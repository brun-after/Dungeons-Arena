import { describe, expect, it } from 'vitest';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';
import { criarJogador } from '../../src/entities/fabrica';
import { criarEntidade } from '../../src/entities/entidade';
import { clonarEstado, criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { habilidadeDoAtor, perfilPara } from '../../src/combat/perfil';
import { entregaRemota, extraGuerreiro, multiplicadorDireto, protecaoInicial, pulsarAura } from '../../src/combat/ajustes-classes';
import { aplicarEfeito, processarEfeitos } from '../../src/combat/efeitos';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { fonteDaHabilidade, iniciarAcao, processarAcoes } from '../../src/combat/acao';
import { aplicarImpacto } from '../../src/combat/golpe';
import { integrarEntidade } from '../../src/world/movimento';
import { xpDeCriatura, lerHistoricoXp } from '../../src/progression/xp-antifarm';
import { processarMortes } from '../../src/progression/morte';
import { idItemBase } from '../../src/progression/gerar-item-base';
import { lerRegistro } from '../../src/save/esquema';
import { ticksDe } from '../../src/core/tempo';
import { personagemNoInicio } from '../../src/save/transicao';
import { aplicarRetratoNoSave, atualizarPersonagemNoSave, conferirPersonagem, pedidoDoPersonagem } from '../../src/coop/personagem';

function obter<T>(v: T | undefined | null): T { if (v == null) throw Error('ausente'); return v; }
function cena(classe = 'guerreiro', nivel = 30) {
  const ctx = contexto(faseDeTexto(SALA_ABERTA, 'fase-02'));
  const estado = criarEstado({ semente: 99, faseId: ctx.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 3, 3, ctx.balance);
  j.nivel = nivel; j.autoAtaque = false;
  const alvo = criarEntidade({ id: 'a', tipo: 'inimigo', x: 4, y: 3, hpMax: 1000, nivel: 1, xpBase: 100 });
  const eventos: EventoSimulacao[] = [];
  estado.entidades.push(j, alvo);
  const hab = (id: string) => obter(habilidadeDoAtor(ctx, j, id));
  return { ctx, estado, j, alvo, eventos, hab };
}

describe('ajustes das classes (18/10/2026)', () => {
  it.each([[1,35],[2,32.5],[3,30],[4,27.5],[5,25],[15,25],[16,27],[17,29],[18,31],[19,33],[20,35],[30,35]])('Mago nível %i: afinidade %s sem duplicar elemento', (nivel, pct) => {
    const c = cena('mago', nivel);
    expect(perfilPara(c.ctx, c.j, c.hab('bola_de_fogo'))).toMatchObject({ danoPct: pct, custoPct: -20 });
  });
  it.each([1,5,10,15,20,25,30])('Guerreiro nível %i: contato absoluto e multiplicador separado', nivel => {
    const c = cena('guerreiro', nivel);
    expect(perfilPara(c.ctx, c.j, c.hab('ataque_basico')).danoPct).toBeCloseTo(15 * Math.min(1, (nivel - 1) / 9));
    expect(extraGuerreiro(c.ctx, c.j, c.alvo)).toBeCloseTo(1 + .1 * Math.max(0, nivel - 10) / 20);
  });
  it('aura acumula frações por alvo, cura com fração e não gera recursão', () => {
    const c = cena(); c.j.hp -= 20;
    for (let i = 0; i < 10; i++) pulsarAura(c.estado, c.ctx, c.j, c.alvo, 10, c.eventos);
    expect(c.alvo.hp).toBe(995); expect(c.j.auraCuraFracao).toBeCloseTo(0);
    expect(c.j.hp).toBe(c.j.hpMax - 19);
    expect(c.eventos.filter(e => e.t === 'efeitoResultado' && e.dano > 0)).toHaveLength(5);
    expect(c.eventos.every(e => e.t === 'efeitoResultado')).toBe(true);
  });
  it('aura respeita defesa, escudo, imunidade, limite inclusivo e não guarda sobrecura inteira', () => {
    const c = cena(); c.alvo.x = 5; c.alvo.defesa = 2;
    aplicarEfeito(c.estado, c.ctx, c.alvo, construirEfeito('escudo', { valor: 3, duracaoMs: 2000 }), c.alvo, null, c.eventos);
    pulsarAura(c.estado, c.ctx, c.j, c.alvo, 100, c.eventos);
    expect(c.alvo.hp).toBe(1000);
    pulsarAura(c.estado, c.ctx, c.j, c.alvo, 100, c.eventos);
    expect(c.alvo.hp).toBe(997);
    expect(c.j.auraCuraFracao).toBeCloseTo(.6);
    c.j.hp--;
    pulsarAura(c.estado, c.ctx, c.j, c.alvo, 0, c.eventos);
    expect(c.j.hp).toBe(c.j.hpMax - 1);
    aplicarEfeito(c.estado, c.ctx, c.alvo, construirEfeito('imune_dano', { duracaoMs: 2000 }), c.alvo, null, c.eventos);
    pulsarAura(c.estado, c.ctx, c.j, c.alvo, 1000, c.eventos);
    expect(c.alvo.hp).toBe(997);
    c.alvo.x = 6;
    c.alvo.efeitos = [];
    pulsarAura(c.estado, c.ctx, c.j, c.alvo, 1000, c.eventos);
    expect(c.alvo.hp).toBe(997);
  });
  it('impacto letal remoto pulsa no atingido e não junto ao Guerreiro', () => {
    const c = cena(); c.alvo.x = 9; c.alvo.hp = 0;
    const perto = criarEntidade({ id: 'b', tipo: 'inimigo', x: 8, y: 3, hpMax: 100 });
    const local = criarEntidade({ id: 'c', tipo: 'inimigo', x: 4, y: 3, hpMax: 100 });
    c.estado.entidades.push(perto, local);
    pulsarAura(c.estado, c.ctx, c.j, c.alvo, 100, c.eventos, true);
    expect(perto.hp).toBe(95); expect(local.hp).toBe(100);
    expect(entregaRemota(c.hab('explosao'))).toBe(true);
    expect(entregaRemota(c.hab('redemoinho'))).toBe(false);
  });
  it('dano periódico do Guerreiro recebe extra e pulsa uma vez, dano autoinfligido fica intacto', () => {
    const c = cena();
    aplicarEfeito(c.estado, c.ctx, c.alvo, construirEfeito('dano_periodico', { valor: 100, duracaoMs: 2000 }), c.j, null, c.eventos);
    c.estado.tick = ticksDe(c.ctx.balance.efeitos.intervaloPeriodicoMs);
    processarEfeitos(c.estado, c.ctx, c.eventos);
    expect(c.alvo.hp).toBe(885); // 110 originais + 5 da aura; resta 0,5.
    const hp = c.j.hp;
    aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('dano_direto', { valor: 10 }), c.j, null, c.eventos);
    expect(c.j.hp).toBe(hp - 10);
  });
  it('preserva cura de 10% no básico separada da aura e exclui excesso letal', () => {
    const c = cena(); c.alvo.hp = 10; c.j.hp -= 20;
    const hab = c.hab('ataque_basico');
    aplicarImpacto(c.estado, c.ctx, c.alvo, { acaoId: 1, hab, indice: 0, fonte: { ...fonteDaHabilidade(c.j, c.ctx, 0, hab), bonusAtributo: 1000, d20Minimo: 20 } }, c.eventos);
    expect(c.j.hp).toBe(c.j.hpMax - 19);
  });
  it('corte do Aventureiro vale só a partir do 20 e só para dano direto próprio', () => {
    const c = cena('aventureiro', 19); const hab = c.hab('explosao');
    expect(multiplicadorDireto(c.ctx, c.j, hab, false)).toBe(1);
    c.j.nivel = 20; expect(multiplicadorDireto(c.ctx, c.j, hab, false)).toBe(.95);
    expect(multiplicadorDireto(c.ctx, c.j, c.hab('ataque_basico'), false)).toBe(1);
  });
  it('Arqueiro escolhe principal pela distância à mira e ID, preservando ordem', () => {
    const c = cena('arqueiro'); c.alvo.x = 6;
    const principal = criarEntidade({ id: 'z', tipo: 'inimigo', x: 7, y: 3, hpMax: 1000 });
    c.estado.entidades.push(principal);
    // Ordem da enumeração: a vem antes de z, mas z ocupa a mira.
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'chuva_de_flechas', { x: 7, y: 3 }, c.eventos)).toBe(true);
    c.estado.tick = obter(c.j.acao).lancamentoTick;
    processarAcoes(c.estado, c.ctx, c.eventos);
    const impactos = c.eventos.filter(e => e.t === 'impacto');
    expect(impactos.map(e => e.alvoId)).toEqual(['a','z']);
    expect(multiplicadorDireto(c.ctx, c.j, c.hab('chuva_de_flechas'), true)).toBe(1.15);
  });
  it('Necromante soma -75 pontos à afinidade de Trevas e a proteção expira sem renovar por onda', () => {
    const c = cena('necromante', 1);
    expect(c.j.bolsa?.hpBase).toBe(32);
    expect(perfilPara(c.ctx, c.j, c.hab('dardo_funesto')).danoPct).toBe(-65);
    expect(protecaoInicial(c.estado, c.ctx, c.j, c.alvo)).toBe(1);
    c.estado.entidades.push(criarEntidade({ id: 'b', tipo: 'inimigo', x: 9, y: 9 }));
    expect(protecaoInicial(c.estado, c.ctx, c.j, c.alvo)).toBe(.9);
    c.estado.entidades.push(criarEntidade({ id: 'c', tipo: 'inimigo', x: 9, y: 8 }));
    expect(protecaoInicial(c.estado, c.ctx, c.j, c.alvo)).toBe(.8);
    c.estado.tick = ticksDe(5000);
    expect(protecaoInicial(c.estado, c.ctx, c.j, c.alvo)).toBe(1);
    expect(protecaoInicial(c.estado, c.ctx, c.j, c.j)).toBe(1);
  });
  it('proteção inicial reduz dano direto e periódico antes do escudo, sem reduzir dano próprio', () => {
    const c = cena('necromante', 1);
    c.estado.entidades.push(criarEntidade({ id: 'b', tipo: 'inimigo', x: 9, y: 9 }));
    c.j.hp = c.j.hpMax = 1000;
    aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('escudo', { valor: 20, duracaoMs: 6000 }), c.j, null, c.eventos);
    aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('dano_direto', { valor: 100 }), c.alvo, null, c.eventos);
    expect(c.j.hp).toBe(930);
    aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('dano_periodico', { valor: 100, duracaoMs: 6000 }), c.alvo, null, c.eventos);
    c.estado.tick = ticksDe(c.ctx.balance.efeitos.intervaloPeriodicoMs);
    processarEfeitos(c.estado, c.ctx, c.eventos);
    expect(c.j.hp).toBe(840);
    aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('dano_direto', { valor: 100 }), c.j, null, c.eventos);
    expect(c.j.hp).toBe(740);
  });
  it.each([[15,0],[16,.2],[17,.4],[18,.6],[19,.8],[20,1],[21,1],[30,1]])('Guerreiro nível %i: movimento e aura remota escalam juntos', (nivel, reforco) => {
    const c = cena('guerreiro', nivel), controle = cena('aventureiro', nivel);
    // Mesma Destreza para isolar o reforço de classe no integrador da predição.
    controle.j.atributos.destreza = c.j.atributos.destreza;
    for (const x of [c, controle]) { x.j.direcao = 'S'; integrarEntidade(x.j, x.estado, x.ctx, x.eventos, 100); }
    expect(c.j.progressoPasso / controle.j.progressoPasso).toBeCloseTo(1 + .15 * reforco);
    c.alvo.x = 9;
    const perto = criarEntidade({ id: 'remoto', tipo: 'inimigo', x: 8, y: 3, hpMax: 10000 });
    const local = criarEntidade({ id: 'local', tipo: 'inimigo', x: 4, y: 3, hpMax: 10000 });
    c.estado.entidades.push(perto, local);
    pulsarAura(c.estado, c.ctx, c.j, c.alvo, 10000, c.eventos, true);
    const dano = Math.floor(10000 * (1 + 4 * (nivel - 1) / 29) / 100 * reforco + 1e-9);
    expect(perto.hp).toBe(10000 - dano); expect(local.hp).toBe(10000);
  });
  it('a escala nova preserva a aura local antes do 16 e seus percentuais antigos', () => {
    const c = cena('guerreiro', 15);
    pulsarAura(c.estado, c.ctx, c.j, c.alvo, 1000, c.eventos);
    expect(c.alvo.hp).toBe(1000 - Math.floor(1000 * (1 + 4 * 14 / 29) / 100));
  });
});

describe('XP de criaturas inferiores', () => {
  it.each([[20,10,.5],[21,10,0.5 ** 1.1],[21,9,0.5 ** 1.2],[21,21,1],[20,21,1],[60,10,.03125]])('jogador %i contra fase %i: fator %s com A zero', (nivel, nivelFase, fator) => {
    const c = cena('aventureiro', nivel); c.alvo.nivel = nivelFase;
    expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, 100)).toBeCloseTo(100 * fator);
    expect(c.j.bolsa?.xpPorFase?.['fase-02']?.xpBaseAcumulado ?? 0).toBe(nivel > nivelFase ? 100 : 0);
  });
  it.each([.1, 10, 100, 10000])('desgaste extremo dá 1 XP absoluto para cota base %s', bruto => {
    const c = cena('aventureiro', 20); c.alvo.nivel = 10;
    obter(c.j.bolsa).xpPorFase = { 'fase-02': { xpBaseAcumulado: 1e10, meiaVidaXp: 820 } };
    expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, bruto)).toBe(1);
    expect(c.j.bolsa?.xpPorFase?.['fase-02']?.xpBaseAcumulado).toBe(1e10 + bruto);
  });
  it('não cria 1 XP para recompensa base zero nem aplica o piso à penalidade de morte', () => {
    const c = cena('aventureiro', 20);
    expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, 0)).toBe(0);
    expect(c.j.bolsa?.xpPorFase).toBeUndefined();
    c.j.xp = 100; c.j.hp = 0;
    processarMortes(c.estado, c.ctx, c.eventos);
    expect(c.j.xp).toBe(50);
    expect(c.eventos.find(e => e.t === 'penalidadeMorte')).toMatchObject({ xp: 50 });
  });
  it('usa o nível da fase, independentemente do nível do inimigo abatido', () => {
    const c = cena('aventureiro', 20); c.alvo.nivel = 20;
    const ctx = { ...c.ctx, fase: { ...c.ctx.fase, inimigos: [
      { preset: 'goblin', nivel: 10, x: .5, y: .5 }, { preset: 'boss', nivel: 20, x: .8, y: .8 },
    ] } };
    expect(xpDeCriatura(c.estado, ctx, c.j, c.alvo, 100)).toBe(50);
  });
  it('cada H de XP base reduz pela metade, com incremento só depois do ganho', () => {
    const c = cena('aventureiro', 20); c.alvo.nivel = 10;
    const h = obter(c.ctx.balance.xp.tabela[9]);
    expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, h)).toBe(h * .5);
    expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, h)).toBe(h * .25);
    expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, h)).toBe(h * .125);
    expect(c.j.bolsa?.xpPorFase?.['fase-02']).toEqual({ xpBaseAcumulado: h * 3, meiaVidaXp: h });
    for (let i = 0; i < 1000; i++) expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, h)).toBeGreaterThanOrEqual(1);
    expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, h)).toBe(1);
    expect(c.j.bolsa?.xpPorFase?.['fase-02']?.xpBaseAcumulado).toBe(h * 1004);
  });
  it('avançar, ganhar XP sem diferença e voltar preserva cada fase independentemente', () => {
    const c = cena('aventureiro', 20); c.alvo.nivel = 10;
    const h = obter(c.ctx.balance.xp.tabela[9]);
    xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, h);
    c.estado.faseId = 'posterior'; c.alvo.nivel = 20;
    expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, 100)).toBe(100);
    expect(c.j.bolsa?.xpPorFase?.posterior).toBeUndefined();
    c.estado.faseId = 'fase-02'; c.alvo.nivel = 10;
    expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, h)).toBe(h * .25);
    c.j.nivel = 10;
    expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, h)).toBe(h);
    expect(c.j.bolsa?.xpPorFase?.['fase-02']?.xpBaseAcumulado).toBe(h * 2);
    c.j.nivel = 20;
    expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, h)).toBe(h * .125);
  });
  it('subir aumenta a diferença em um e avançar para fase de nível maior a diminui em um', () => {
    const c = cena('aventureiro', 20); c.alvo.nivel = 10;
    // Isola a diferença de nível, considerando o XP base acumulado após cada ganho.
    expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, 100)).toBe(50);
    c.j.nivel = 21;
    const registro = obter(c.j.bolsa?.xpPorFase?.['fase-02']);
    const ganho = xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, 100);
    expect(ganho).toBeCloseTo(100 * .5 ** 1.1 * .5 ** (100 / obter(registro.meiaVidaXp)));
    c.estado.faseId = 'fase-03'; c.alvo.nivel = 11;
    expect(xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, 100)).toBe(50);
  });
  it('H fica fixado no contador, mesmo após mudar a tabela ou nível do jogador', () => {
    const c = cena('aventureiro', 20); c.alvo.nivel = 10;
    xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, 100);
    const h = obter(c.j.bolsa?.xpPorFase?.['fase-02']?.meiaVidaXp);
    const ctx = { ...c.ctx, balance: { ...c.ctx.balance, xp: { ...c.ctx.balance.xp, tabela: [] } } };
    c.j.nivel = 21;
    xpDeCriatura(c.estado, ctx, c.j, c.alvo, 100);
    expect(c.j.bolsa?.xpPorFase?.['fase-02']?.meiaVidaXp).toBe(h);
  });
  it('abate inferior concede no mínimo 1 XP mesmo com cota fracionária e A soma a cota base', () => {
    const c = cena('aventureiro', 30); c.alvo.xpBase = 1;
    c.alvo.hp = 0; c.alvo.participacao = [{ id: c.j.id, tick: 0 }];
    processarMortes(c.estado, c.ctx, c.eventos);
    expect(c.j.xp).toBe(1); expect(c.j.bolsa?.xpFracao ?? 0).toBe(0);
    expect(c.j.bolsa?.xpPorFase?.['fase-02']?.xpBaseAcumulado).toBeCloseTo(.1);
  });
  it('respawns não acumulam a antiga penalidade por criatura abaixo do piso de 1 XP', () => {
    const c = cena('aventureiro', 10); c.alvo.nivel = 1;
    obter(c.j.bolsa).xpPorFase = { 'fase-02': { xpBaseAcumulado: 100000, meiaVidaXp: 30 } };
    c.alvo.abates = 1000; c.alvo.hp = 0; c.alvo.participacao = [{ id: c.j.id, tick: 0 }];
    processarMortes(c.estado, c.ctx, c.eventos);
    expect(c.j.xp).toBe(1);
    expect(c.j.bolsa?.xpPorFase?.['fase-02']?.xpBaseAcumulado).toBe(100100);
  });
  it('histórico sobrevive a clone, transição, save e entrada cooperativa sem compartilhar referências', () => {
    const c = cena('aventureiro', 2); xpDeCriatura(c.estado, c.ctx, c.j, c.alvo, 100);
    const copia = obter(clonarEstado(c.estado).entidades[0]);
    const registro = obter(copia.bolsa?.xpPorFase?.['fase-02']); registro.xpBaseAcumulado = 0;
    expect(c.j.bolsa?.xpPorFase?.['fase-02']?.xpBaseAcumulado).toBe(100);
    const novo = personagemNoInicio(c.j, { x: 1, y: 1 });
    expect(novo.bolsa?.xpPorFase).toEqual(c.j.bolsa?.xpPorFase);
    const conferido = obter(conferirPersonagem(pedidoDoPersonagem(c.j), c.ctx, 'novo', 'dono'));
    expect(conferido.entidade.bolsa?.xpPorFase).toEqual(c.j.bolsa?.xpPorFase);
    const r = lerRegistro({ versaoSchema: 21, slot: 1, faseRef: { tipo: 'oficial', id: 'fase-02' }, estado: c.estado, fasesVisitadas: {} });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.registro.estado.entidades[0]?.bolsa?.xpPorFase).toEqual(c.j.bolsa?.xpPorFase);
    expect(lerHistoricoXp({ x: { xpBaseAcumulado: -1 }, y: { xpBaseAcumulado: Infinity } })).toEqual({});
  });
  it('morte e retornos com retrato antigo nunca diminuem A nem trocam H', () => {
    const c = cena('aventureiro', 10);
    obter(c.j.bolsa).xpPorFase = { 'fase-02': { xpBaseAcumulado: 1000, meiaVidaXp: 820 } };
    c.j.hp = 0;
    processarMortes(c.estado, c.ctx, c.eventos);
    expect(c.j.bolsa?.xpPorFase?.['fase-02']).toEqual({ xpBaseAcumulado: 1000, meiaVidaXp: 820 });
    const r = lerRegistro({ versaoSchema: 21, slot: 1, faseRef: { tipo: 'oficial', id: 'fase-02' }, estado: c.estado, fasesVisitadas: {} });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const antigo = cena('aventureiro', 10).j;
    obter(antigo.bolsa).xpPorFase = { 'fase-02': { xpBaseAcumulado: 100, meiaVidaXp: 1000 }, outra: { xpBaseAcumulado: 200, meiaVidaXp: 60 } };
    const grupo = atualizarPersonagemNoSave(r.registro, antigo, c.ctx, 1);
    const arena = aplicarRetratoNoSave(r.registro, obter(pedidoDoPersonagem(antigo)), c.ctx, 1);
    for (const salvo of [grupo, arena]) {
      const historico = salvo.estado.entidades.find(e => e.bolsa)?.bolsa?.xpPorFase;
      expect(historico?.['fase-02']).toEqual({ xpBaseAcumulado: 1000, meiaVidaXp: 820 });
      expect(historico?.outra).toEqual({ xpBaseAcumulado: 200, meiaVidaXp: 60 });
    }
  });
  it('migração preserva contadores antigos e atuais e só fixa H quando necessário', () => {
    expect(lerHistoricoXp({ antiga: { xp: 80, ordem: 2 }, atual: { xpBaseAcumulado: 200, meiaVidaXp: 400 } })).toEqual({
      antiga: { xpBaseAcumulado: 80 }, atual: { xpBaseAcumulado: 200, meiaVidaXp: 400 },
    });
    const c = cena('aventureiro', 20);
    const estado = { ...c.estado, entidades: [{ ...c.j, bolsa: { ...c.j.bolsa, xpPorFase: { 'fase-02': { xp: 80, ordem: 2 } } } }] };
    const r = lerRegistro({ versaoSchema: 20, slot: 1, faseRef: { tipo: 'oficial', id: 'fase-02' }, estado, fasesVisitadas: { outra: estado } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.registro.estado.entidades[0]?.bolsa?.xpPorFase?.['fase-02']?.xpBaseAcumulado).toBe(80);
    expect(r.registro.fasesVisitadas.outra?.entidades[0]?.bolsa?.xpPorFase?.['fase-02']?.xpBaseAcumulado).toBe(80);
  });
});

describe('botas ao cruzar inimigos e saves legados', () => {
  it.each([['lendaria',30,3000]] as const)('%s acelera ao entrar, não renova parado nem reage a aliados', (forma, pct, ms) => {
    const c = cena('aventureiro', 1);
    const itemId = idItemBase('botas', forma, null, 1, 99);
    expect(CONTEUDO.itens.has(itemId)).toBe(true);
    obter(c.j.bolsa).equipamento.pes = { invId: 'b', itemId, qtd: 1, ref: null };
    c.j.direcao = 'E';
    integrarEntidade(c.j, c.estado, c.ctx, c.eventos, 220);
    const efeito = obter(c.j.efeitos.find(f => f.tipo === 'acelerado'));
    expect(efeito.pct).toBe(pct); expect(efeito.ateTick).toBe(ticksDe(ms));
    expect(c.j.efeitos.some(f => f.tipo === 'fantasma')).toBe(false);
    c.j.direcao = 'parado'; c.estado.tick++;
    integrarEntidade(c.j, c.estado, c.ctx, c.eventos, 500);
    expect(efeito.ateTick).toBe(ticksDe(ms));
    c.j.efeitos = []; c.j.x = c.j.destinoX = 3; c.j.progressoPasso = 0;
    c.alvo.equipe = c.j.equipe; c.j.direcao = 'E';
    integrarEntidade(c.j, c.estado, c.ctx, c.eventos, 220);
    expect(c.j.efeitos).toEqual([]);
  });
  it.each(['comum', 'epica', 'ultima'] as const)('preserva %s sem bônus de velocidade ao cruzar inimigos', forma => {
    const c = cena('aventureiro', 1);
    const itemId = idItemBase('botas', forma, null, 1, 99);
    const item = obter(CONTEUDO.itens.get(itemId));
    expect(item.ganchos.some(g => g.quando === 'aoCruzarInimigo')).toBe(false);
    obter(c.j.bolsa).equipamento.pes = { invId: 'b', itemId, qtd: 1, ref: null };
    c.j.direcao = 'E'; integrarEntidade(c.j, c.estado, c.ctx, c.eventos, 220);
    expect(c.j.efeitos.some(f => f.tipo === 'acelerado')).toBe(false);
    if (forma === 'ultima') {
      expect(item.ganchos).toHaveLength(2);
      expect(item.ganchos[0]).toMatchObject({ quando: 'aoMatar', efeito: { tipo: 'aplicar', efeito: { tipo: 'fantasma', duracaoMs: 4000 } } });
      expect(item.ganchos[1]).toMatchObject({ quando: 'aoMatar', efeito: { tipo: 'curarPct', pct: 5 } });
    }
  });
  it('inimigo que entra na célula do portador parado também ativa as botas', () => {
    const c = cena('aventureiro', 1);
    obter(c.j.bolsa).equipamento.pes = { invId: 'b', itemId: idItemBase('botas', 'lendaria', null, 1, 99), qtd: 1, ref: null };
    c.alvo.direcao = 'O';
    integrarEntidade(c.alvo, c.estado, c.ctx, c.eventos, 220);
    expect(c.j.efeitos.some(f => f.tipo === 'acelerado')).toBe(true);
  });
  it('migra HP antigo do Necromante e inicia histórico vazio sem inventar XP anterior', () => {
    const c = cena('necromante', 1); obter(c.j.bolsa).hpBase = 42;
    c.j.hp = c.j.hpMax = 82;
    const antigo = { versaoSchema: 19, slot: 1, faseRef: { tipo: 'oficial', id: 'fase-01' }, estado: c.estado, fasesVisitadas: {} };
    const r = lerRegistro(antigo); expect(r.ok).toBe(true);
    if (!r.ok) return;
    const j = obter(r.registro.estado.entidades[0]);
    expect(j.bolsa?.hpBase).toBe(32); expect(j.hpMax).toBe(72); expect(j.hp).toBe(72);
    expect(j.bolsa?.xpPorFase).toEqual({});
    expect(c.j.bolsa?.hpBase).toBe(42);
  });
});
