// Marco 28 (30/10/2026, D-127): invocações iguais lado a lado, nível 100 com o teto nível+20, o rendimento acima de
// 30, o atributo de classe (fatores e marcos), o multiplicador dos itens e a migração 27 › 28.
import { describe, expect, it } from 'vitest';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { celulaOcupada } from '../../src/combat/geometria';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { derivarFicha, multiplicadoresDoItem, recalcularFicha } from '../../src/progression/derivados';
import { fatorDeDominio, fatorDeSkillDeClasse, marcoDe } from '../../src/progression/dominio';
import { pontosUteis } from '../../src/progression/efeitos-atributo';
import { idItemGerado } from '../../src/progression/gerar-item';
import { distribuirPonto, usarItem } from '../../src/progression/inventario';
import { pontosAteONivel, tetoDoAtributo, xpParaProximo } from '../../src/progression/nivel';
import { MIGRACOES } from '../../src/save/esquema';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
const b = ctx.balance;
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}
const jogador = (classe: string) => criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 2, 5, b);

describe('invocações iguais', () => {
  it('três lobos de pergaminho ficam em células diferentes, seguindo e em combate', () => {
    const estado = criarEstado({ semente: 4, faseId: 'teste' });
    const j = jogador('aventureiro');
    j.autoAtaque = false;
    estado.entidades.push(j);
    obter(j.bolsa).mochila.push({ invId: 'p1', itemId: 'pergaminho_lobo', qtd: 3, ref: null });
    const saida: EventoSimulacao[] = [];
    for (let i = 0; i < 3; i++) usarItem(estado, j, ctx, 'p1', saida);
    const lobos = () => estado.entidades.filter((e) => e.invocacao?.pergaminho && e.hp > 0);
    const distintas = () => new Set(lobos().map((e) => `${celulaOcupada(e).x},${celulaOcupada(e).y}`)).size;
    expect(lobos()).toHaveLength(3);
    expect(distintas()).toBe(3);
    for (let i = 0; i < ticksDe(2000); i++) simular(estado, ctx, [], saida, DT_MS);
    expect(distintas()).toBe(3);
    const boneco = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'b', 6, 5, b);
    boneco.hp = boneco.hpMax = 99_999;
    estado.entidades.push(boneco);
    for (let i = 0; i < ticksDe(3000); i++) simular(estado, ctx, [], saida, DT_MS);
    expect(distintas()).toBe(3);
  });

  it('o pergaminho não é gasto quando nada nasce', () => {
    const estado = criarEstado({ semente: 4, faseId: 'teste' });
    const j = criarJogador(obter(CONTEUDO.classes.get('aventureiro')), 'j', 1, 1, b);
    estado.entidades.push(j);
    const bolsa = obter(j.bolsa);
    bolsa.mochila.push({ invId: 'p1', itemId: 'pergaminho_lobo', qtd: 1, ref: null });
    // No canto, cercado de bonecos até a distância 2: nenhuma célula livre.
    let n = 0;
    for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) {
      if (x === 1 && y === 1) continue;
      estado.entidades.push(criarInimigo(obter(CONTEUDO.presets.get('boneco')), `b${String(n++)}`, x, y, b));
    }
    const saida: EventoSimulacao[] = [];
    usarItem(estado, j, ctx, 'p1', saida);
    expect(estado.entidades.some((e) => e.invocacao?.pergaminho)).toBe(false);
    expect(bolsa.mochila.find((m) => m.invId === 'p1')?.qtd).toBe(1);
    expect(saida.some((e) => e.t === 'itemRecusado' && e.motivo === 'sem_espaco')).toBe(true);
  });
});

describe('nível 100 e o teto nível+20', () => {
  it('a curva até o 30 é a de antes e cresce depois', () => {
    for (let n = 1; n <= 30; n++) expect(xpParaProximo(n, b.xp)).toBe(b.xp.tabela[n - 1] ?? n * b.xp.fallbackPorNivel);
    expect(xpParaProximo(31, b.xp)).toBeGreaterThan(31 * b.xp.fallbackPorNivel);
    expect(xpParaProximo(99, b.xp)).toBeGreaterThan(xpParaProximo(50, b.xp) * 2);
    expect(pontosAteONivel(30, b.xp)).toBe(29 * b.xp.pontosPorNivel);
    expect(pontosAteONivel(100, b.xp)).toBe(447);
  });

  it('o ponto gasto para em nível+20; o item leva acima', () => {
    expect(tetoDoAtributo(5, b)).toBe(25);
    expect(tetoDoAtributo(95, b)).toBe(b.atributos.maximo);
    const j = jogador('guerreiro');
    const bolsa = obter(j.bolsa);
    j.nivel = 5;
    bolsa.pontosAtributo = 5;
    bolsa.atributosBase.forca = 25;
    const saida: EventoSimulacao[] = [];
    distribuirPonto(j, ctx, 'forca', 0, saida);
    expect(bolsa.atributosBase.forca).toBe(25);
    expect(saida.some((e) => e.t === 'itemRecusado' && e.motivo === 'atributo_acima_do_nivel')).toBe(true);
    distribuirPonto(j, ctx, 'destreza', 0, saida);
    expect(bolsa.pontosAtributo).toBe(4);
    const anel = { ...obter(CONTEUDO.itens.get('anel_sabio')), id: 'anel_t', bonusAtributos: { forca: { modo: 'abs' as const, valor: 5 } } };
    const ctxAnel = { ...ctx, conteudo: { ...CONTEUDO, itens: new Map([...CONTEUDO.itens, ['anel_t', anel]]) } };
    bolsa.equipamento.anel = { invId: 'a', itemId: 'anel_t', qtd: 1, ref: null };
    expect(derivarFicha(bolsa, 5, ctxAnel).atributos.forca).toBe(30);
  });

  it('acima de 30 o ponto rende menos; até 30 é igual', () => {
    expect(pontosUteis(25, b)).toBe(25);
    expect(pontosUteis(30, b)).toBe(30);
    expect(pontosUteis(100, b)).toBe(30 + (70 * b.atributos.rendimentoAcima.pct) / 100);
  });
});

describe('atributo de classe', () => {
  it('o domínio fortalece a passiva e as skills de classe, e os marcos destravam nos degraus', () => {
    const g = jogador('guerreiro');
    expect(fatorDeDominio(ctx, g, 'aura')).toBe(1);
    expect(marcoDe(ctx, g, 'auraRaio')).toBe(0);
    g.atributos.dominio = 50;
    expect(fatorDeDominio(ctx, g, 'aura')).toBeGreaterThan(1);
    expect(fatorDeDominio(ctx, g, 'carga')).toBe(1);
    expect(marcoDe(ctx, g, 'auraVisivel')).toBe(1);
    expect(marcoDe(ctx, g, 'auraRaio')).toBe(1);
    expect(marcoDe(ctx, g, 'estandartePct')).toBe(0);
    g.atributos.dominio = 100;
    expect(marcoDe(ctx, g, 'auraRaio')).toBe(2);
    const n = jogador('necromante');
    n.atributos.dominio = 75;
    expect(marcoDe(ctx, n, 'servosDaPassiva')).toBe(3);
    expect(marcoDe(ctx, n, 'auraRaio')).toBe(0);
  });

  it('só a skill de classe ganha com o domínio', () => {
    const m = jogador('mago');
    const classe = obter(CONTEUDO.classes.get('mago'));
    const exclusiva = obter(classe.exclusivas[0]);
    m.atributos.dominio = 60;
    expect(fatorDeSkillDeClasse(ctx, m, exclusiva)).toBeGreaterThan(1);
    expect(fatorDeSkillDeClasse(ctx, m, 'pedregulho')).toBe(1);
    const hab = obter(resolverHabilidade(ctx, exclusiva));
    const antes = fonteDaHabilidade({ ...m, atributos: { ...m.atributos, dominio: 10 } }, ctx, 0, hab).multDano;
    expect(fonteDaHabilidade(m, ctx, 0, hab).multDano).toBeGreaterThan(antes);
  });
});

describe('itens: valor base + % de dano', () => {
  it('os pontos param no nível 30 e o % de dano cresce com o nível e a raridade', () => {
    const i30 = obter(CONTEUDO.itens.get(idItemGerado('espada', 30, 'raro', 1)));
    const i90 = obter(CONTEUDO.itens.get(idItemGerado('espada', 90, 'raro', 1)));
    const soma = (i: typeof i30) => Object.values(i.bonusAtributos).reduce((s, v) => s + v.valor, 0);
    expect(soma(i90)).toBe(soma(i30));
    expect(multiplicadoresDoItem(i90, b).danoPct).toBeGreaterThan(multiplicadoresDoItem(i30, b).danoPct);
    const comum = obter(CONTEUDO.itens.get(idItemGerado('espada', 90, 'comum', 1)));
    expect(multiplicadoresDoItem(i90, b).danoPct).toBeGreaterThan(multiplicadoresDoItem(comum, b).danoPct);
  });

  it('o % de dano entra na fonte do golpe', () => {
    const j = jogador('guerreiro');
    const hab = obter(resolverHabilidade(ctx, j.ataqueBasico));
    const antes = fonteDaHabilidade(j, ctx, 0, hab).multDano;
    obter(j.bolsa).equipamento.arma_principal = { invId: 'x', itemId: idItemGerado('espada', 80, 'epico', 1), qtd: 1, ref: null };
    recalcularFicha(j, ctx);
    expect(j.danoItensPct ?? 0).toBeGreaterThan(0);
    expect(fonteDaHabilidade(j, ctx, 0, hab).multDano).toBeGreaterThan(antes);
  });
});

describe('save', () => {
  it('a migração 27 › 28 dá domínio 10 a todos', () => {
    const j = jogador('mago');
    const semDominio: Partial<typeof j.atributos> = { ...j.atributos };
    delete semDominio.dominio;
    const bolsa = obter(j.bolsa);
    const baseSem: Partial<typeof j.atributos> = { ...bolsa.atributosBase };
    delete baseSem.dominio;
    const r = obter(MIGRACOES[27])({ versaoSchema: 27, estado: { entidades: [{ ...j, atributos: semDominio, bolsa: { ...bolsa, atributosBase: baseSem } }] }, fasesVisitadas: {} });
    const e = (r.estado as { entidades: { atributos: { dominio: number }; bolsa: { atributosBase: { dominio: number } } }[] }).entidades[0];
    expect(obter(e).atributos.dominio).toBe(10);
    expect(obter(e).bolsa.atributosBase.dominio).toBe(10);
  });
});
