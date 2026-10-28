// Diagnóstico (18/10/2026): custos, cura sem duplicação, excesso letal, censura e comparação pareada.
import { describe, expect, it } from 'vitest';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { aplicarImpacto } from '../../src/combat/golpe';
import { fonteDaHabilidade, iniciarAcao } from '../../src/combat/acao';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { usarItem } from '../../src/progression/inventario';
import { contextoDoCenario, jogadorTipico, inimigo } from '../../tools/balanceamento/cenarios';
import { contextoExperimental, simularDiagnostico, type AmostraCombate } from '../../tools/balanceamento/diagnostico';
import { opcoesDiagnostico } from '../../tools/balanceamento/diagnostico-cli';
import { compararPares, diferencaDasDiferencas, resumir, wilson } from '../../tools/balanceamento/estatisticas';
import { MedidorCombate, metricasVazias } from '../../tools/balanceamento/metricas';
import { validarAmostras } from '../../tools/balanceamento/validacao-diagnostico';
import { gerarRelatorioDiagnostico } from '../../tools/balanceamento/relatorio-diagnostico';

function obter<T>(v: T | undefined | null): T { if (v == null) throw new Error('Dado ausente'); return v; }
const config = { classe: 'guerreiro', nivel: 1, dificuldade: 'normal', cenario: 'atrito', semente: 1000, intervencao: 'base' } as const;
function amostra(resultado: AmostraCombate['resultado'], semente = 1000): AmostraCombate {
  return { configuracao: { ...config, semente }, resultado, tempoS: 10, ondasConcluidas: 0, ondasPlanejadas: 5,
    abates: 0, hpInicial: 100, hpFinal: 0, hpMax: 100, defesa: 2, manaInicial: 10, manaFinal: 0,
    saldoHpSemEvento: 0, saldoManaSemEvento: 0, metricas: { ...metricasVazias(), tempoVivoS: 10 }, ondas: [] };
}

describe('contabilidade real do combate', () => {
  it('usa HP efetivamente retirado, mede escudo e não muda o dano histórico do golpe', () => {
    const ctx = contextoDoCenario(), estado = criarEstado({ semente: 1, faseId: ctx.fase.id });
    const j = jogadorTipico(ctx, 'guerreiro', 1), alvo = inimigo(ctx, 'orc', 1);
    estado.entidades.push(j, alvo); alvo.hp = 3; alvo.defesa = 0;
    const eventos: EventoSimulacao[] = [];
    aplicarEfeito(estado, ctx, alvo, construirEfeito('escudo', { valor: 20, duracaoMs: 10000 }), { id: alvo.id, x: alvo.x, y: alvo.y }, null, eventos);
    const hab = { ...obter(habilidadeDoAtor(ctx, j, j.ataqueBasico)), formulaDano: '50', efeitos: [] };
    aplicarImpacto(estado, ctx, alvo, { acaoId: 1, indice: 0, hab,
      fonte: { ...fonteDaHabilidade(j, ctx, 0, hab), bonusAtributo: 0, multRolagem: 1, multDano: 1, carisma: 30 } }, eventos);
    const impacto = obter(eventos.find(e => e.t === 'impacto'));
    expect(impacto).toMatchObject({ danoEfetivo: 3, absorvidoEscudo: 20 });
    expect(impacto.dano).toBeGreaterThan(3);
    const medidor = new MedidorCombate(j.id, new Set([alvo.id])); medidor.registrar(eventos);
    expect(medidor.metricas.dano).toBe(3);
  });
  it('conta a poção uma vez e a separa de cura de habilidade ou efeito', () => {
    const ctx = contextoDoCenario(), estado = criarEstado({ semente: 1, faseId: ctx.fase.id });
    const j = jogadorTipico(ctx, 'guerreiro', 1); estado.entidades.push(j); j.hp = 1;
    const antes = j.hp, eventos: EventoSimulacao[] = [];
    usarItem(estado, j, ctx, obter(j.bolsa?.mochila.find(i => i.itemId === 'pocao_vida')).invId, eventos);
    const medidor = new MedidorCombate(j.id, new Set()); medidor.registrar(eventos);
    expect(eventos.some(e => e.t === 'efeitoResultado')).toBe(true);
    expect(eventos.some(e => e.t === 'usouItem')).toBe(true);
    expect(medidor.metricas.cura).toBe(j.hp - antes);
    expect(medidor.metricas.curaPocoes).toBe(j.hp - antes);
    expect(medidor.metricas.curaEfeitos).toBe(0);
  });
  it('registra custo real após afinidades e o preserva quando a ação é interrompida', () => {
    const ctx = contextoDoCenario(), estado = criarEstado({ semente: 1, faseId: ctx.fase.id });
    const j = jogadorTipico(ctx, 'mago', 1), alvo = inimigo(ctx, 'orc', 1, 'i1', 5, 9);
    estado.entidades.push(j, alvo);
    const antes = j.mana, eventos: EventoSimulacao[] = [];
    expect(iniciarAcao(estado, ctx, j, 'bola_de_fogo', alvo.id, eventos)).toBe(true);
    const custo = antes - j.mana;
    expect(custo).toBeGreaterThan(0);
    eventos.push({ t: 'acaoCancelada', tick: 1, acaoId: obter(j.acao).acaoId, atorId: j.id, motivo: 'interrompido' });
    const medidor = new MedidorCombate(j.id, new Set([alvo.id])); medidor.registrar(eventos);
    expect(medidor.metricas.manaGasta).toBe(custo);
    expect(medidor.metricas.cancelamentos).toBe(1);
  });
  it('atribui invocação removida ao dono e não duplica seu resumo de cura', () => {
    const medidor = new MedidorCombate('j', new Set(['i']));
    medidor.registrar([{ t: 'invocou', tick: 0, donoId: 'j', id: 'pet' },
      { t: 'efeitoResultado', tick: 1, origemId: 'pet', alvoId: 'i', tipo: 'queimando', dano: 9, cura: 0, mana: 0 },
      { t: 'efeitoResultado', tick: 2, origemId: 'pet', alvoId: 'j', tipo: 'cura', dano: 0, cura: 8, mana: 0 },
      { t: 'invocacaoCurou', tick: 2, id: 'pet', donoId: 'j', cura: 8 }]);
    expect(medidor.metricas.danoInvocacoes).toBe(9);
    expect(medidor.metricas.cura).toBe(8);
    expect(medidor.metricas.curaInvocacoes).toBe(8);
    expect(medidor.metricas.curaEfeitos).toBe(0);
    medidor.registrar([{ t: 'invocou', tick: 3, donoId: 'i', id: 'pet-hostil' },
      { t: 'efeitoResultado', tick: 4, origemId: 'pet-hostil', alvoId: 'j', tipo: 'queimando', dano: 12, cura: 0, mana: 0 }]);
    expect(medidor.metricas.recebido).toBe(12);
  });
});

describe('estatística e leitura', () => {
  it('separa limite de morte e TTK, e pondera DPS pelo tempo de exposição', () => {
    const a = amostra('vitoria'), b = amostra('morte', 2), c = amostra('limite', 3);
    a.metricas.dano = 100; b.metricas.dano = 40; c.metricas.dano = 60; c.tempoS = c.metricas.tempoVivoS = 20;
    const r = resumir([a, b, c]);
    expect(r).toMatchObject({ n: 3, vitorias: 1, mortes: 1, limites: 1, tempoVitoriaMediano: 10, dps: 5 });
    expect(resumir([b, c]).tempoVitoriaMediano).toBeNull();
    expect(wilson(8, 8)?.[0]).toBeCloseTo(0.6756, 3);
    expect(wilson(0, 0)).toBeNull();
  });
  it('compara as sementes corretas e rejeita pares perdidos ou duplicados', () => {
    const a = [amostra('vitoria', 1), amostra('morte', 2)];
    const b = [amostra('limite', 2), amostra('morte', 1)];
    expect(compararPares(a, b)).toMatchObject({ favoreceA: 1, favoreceB: 0, deltaVitoriaPp: 50 });
    expect(() => compararPares(a, [amostra('vitoria', 3), amostra('morte', 2)])).toThrow('sem par');
    expect(() => compararPares(a, [obter(b[0]), obter(b[0])])).toThrow('não pareadas');
  });
  it('expõe ausência de experimentos e a incerteza de uma amostra pequena', () => {
    const a = amostra('vitoria'), b = amostra('morte'); b.configuracao = { ...b.configuracao, classe: 'mago' };
    const doc = gerarRelatorioDiagnostico([a, b], '18/10/2026');
    expect(doc).toContain('Experimentos não executados');
    expect(doc).toContain('Amostra pequena');
    expect(doc).toContain('a mana total não é o custo exclusivo da cura');
  });
  it('distingue efeito sobre uma classe de mudança da vantagem entre classes', () => {
    const a = [amostra('vitoria', 1), amostra('vitoria', 2)];
    const b = [amostra('morte', 1), amostra('vitoria', 2)];
    // O fator importa para ambas igualmente: a vantagem entre elas permanece em 50 p.p.
    const semA = [amostra('morte', 1), amostra('vitoria', 2)];
    const semB = [amostra('morte', 1), amostra('morte', 2)];
    expect(diferencaDasDiferencas(a, b, semA, semB)).toMatchObject({ vantagemBasePp: 50, vantagemSemPp: 50, contrasteVitoriaPp: 0 });
  });
});

describe('cenários e interface', () => {
  it('é determinístico, mantém desgaste entre ondas e deixa o balance global intacto', () => {
    const a = simularDiagnostico(config), b = simularDiagnostico(config);
    expect(a).toEqual(b);
    expect(a.ondas.length).toBeGreaterThan(1);
    for (let i = 1; i < a.ondas.length; i++) {
      expect(a.ondas[i]?.hpEntrada).toBe(a.ondas[i - 1]?.hpSaida);
      expect(a.ondas[i]?.manaEntrada).toBe(a.ondas[i - 1]?.manaSaida);
    }
    const ctx = contextoDoCenario();
    const cura = ctx.balance.recursos.curaBasicoPorClassePct.guerreiro;
    expect(contextoExperimental('sem_cura_basico').balance.recursos.curaBasicoPorClassePct.guerreiro).toBeUndefined();
    expect(ctx.balance.recursos.curaBasicoPorClassePct.guerreiro).toBe(cura);
    expect(a.saldoHpSemEvento).toBeGreaterThanOrEqual(0);
  });
  it('inclui Necromante, distingue censura e remove poções apenas no experimento pedido', () => {
    expect(opcoesDiagnostico([]).classes).toContain('necromante');
    const curto = simularDiagnostico({ ...config, classe: 'necromante', limiteS: 1 / 60 });
    expect(curto.resultado).toBe('limite');
    expect(curto.tempoS).toBeCloseTo(1 / 60);
    const sem = simularDiagnostico({ ...config, intervencao: 'sem_pocoes' });
    expect(sem.metricas.curaPocoes).toBe(0);
  });
  it.each([['--sementes', '0'], ['--sementes', '1.5'], ['--niveis', '0'], ['--limite', 'NaN'], ['--classes', 'inexistente'], ['--sementes'], ['--desconhecido']])('rejeita argumentos inválidos: %s', (...args) => {
    expect(() => opcoesDiagnostico(args)).toThrow();
  });
});


describe('integridade da execução completa', () => {
  const configuracao = { ...config, cenario: 'duelo', semente: 1000 } as const;
  it('aceita controle e intervenção válidos e rejeita grade incompleta ou duplicada', () => {
    const base = simularDiagnostico(configuracao);
    const sem = simularDiagnostico({ ...configuracao, intervencao: 'sem_pocoes' });
    expect(() => { validarAmostras([base, sem], 2); }).not.toThrow();
    expect(() => { validarAmostras([base], 2); }).toThrow('Grade incompleta');
    expect(() => { validarAmostras([base, base], 2); }).toThrow('duplicada');
    expect(() => { validarAmostras([sem], 1); }).toThrow('sem controle');
  });
  it('rejeita cura duplicada e custos perdidos na contabilidade por fonte', () => {
    const base = simularDiagnostico(configuracao);
    const cura = structuredClone(base); cura.metricas.cura++;
    expect(() => { validarAmostras([cura], 1); }).toThrow('cura por origem');
    const custo = structuredClone(base); custo.metricas.manaGasta++;
    expect(() => { validarAmostras([custo], 1); }).toThrow('custo de mana por fonte');
    const invalida = structuredClone(base); invalida.metricas.dano = NaN;
    expect(() => { validarAmostras([invalida], 1); }).toThrow('métrica inválida');
  });
  it('rejeita recuperação artificial entre ondas', () => {
    const base = simularDiagnostico(config);
    const segunda = obter(base.ondas[1]); segunda.hpEntrada++;
    expect(() => { validarAmostras([base], 1); }).toThrow('vida restaurada entre ondas');
  });
  it('mantém morte simultânea como derrota sem contar a onda como concluída', () => {
    const base = simularDiagnostico({ ...configuracao, classe: 'arqueiro', nivel: 1, dificuldade: 'pesadelo', semente: 30810, intervencao: 'sem_pocoes' });
    expect(base.resultado).toBe('morte');
    expect(base.ondasConcluidas).toBe(0);
    const controle = simularDiagnostico({ ...base.configuracao, intervencao: 'base' });
    expect(() => { validarAmostras([controle, base], 2); }).not.toThrow();
  });
});
