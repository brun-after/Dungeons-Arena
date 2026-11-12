// Marco 28 (30/10/2026, D-127): invocações iguais lado a lado, nível 100 com o teto nível+20, o rendimento acima de
// 30, a classe nos estilos (D-155, no lugar do atributo de classe), o multiplicador dos itens e a migração 29 › 30.
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

/** D-155: leva o personagem ao nível 100 com `pontos` no par do estilo (2 no principal para 1 no secundário). */
function noEstilo(e: ReturnType<typeof jogador>, estiloId: string, pontos: number): void {
  const bolsa = obter(e.bolsa);
  const estilo = obter((CONTEUDO.estilos.get(bolsa.classeId) ?? []).find((x) => x.id === estiloId));
  const [p1, p2] = Object.entries(estilo.pesos).sort((x, y) => y[1] - x[1]).map(([k]) => k as keyof typeof bolsa.atributosBase);
  const base = obter(CONTEUDO.classes.get(bolsa.classeId)).atributos;
  e.nivel = 100;
  bolsa.atributosBase = { ...base };
  bolsa.atributosBase[obter(p1)] = Math.min(100, base[obter(p1)] + Math.round((pontos * 2) / 3));
  bolsa.atributosBase[obter(p2)] = Math.min(100, base[obter(p2)] + Math.round(pontos / 3));
  recalcularFicha(e, ctx);
}

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

describe('nível 100 e o teto 10 + 2 × nível (marco 39)', () => {
  it('a curva até o 30 é a de antes; os pontos ficam escassos depois (3 até o 30, 2 depois)', () => {
    for (let n = 1; n <= 30; n++) expect(xpParaProximo(n, b.xp)).toBe(b.xp.tabela[n - 1] ?? n * b.xp.fallbackPorNivel);
    expect(xpParaProximo(31, b.xp)).toBeGreaterThan(31 * b.xp.fallbackPorNivel);
    expect(xpParaProximo(99, b.xp)).toBeGreaterThan(xpParaProximo(50, b.xp) * 2);
    expect(pontosAteONivel(30, b.xp)).toBe(29 * b.xp.pontosPorNivel);
    expect(pontosAteONivel(100, b.xp)).toBe(227);
  });

  it('o ponto gasto para em 10 + 2 × nível; o item leva acima', () => {
    expect(tetoDoAtributo(5, b)).toBe(20);
    expect(tetoDoAtributo(95, b)).toBe(b.atributos.maximo);
    const j = jogador('guerreiro');
    const bolsa = obter(j.bolsa);
    j.nivel = 5;
    bolsa.pontosAtributo = 5;
    // Marco 39 (D-153): o teto também conta do valor inicial da classe.
    const tetoV = tetoDoAtributo(5, b, obter(CONTEUDO.classes.get('guerreiro')).atributos.vontade);
    bolsa.atributosBase.vontade = tetoV;
    const saida: EventoSimulacao[] = [];
    distribuirPonto(j, ctx, 'vontade', 0, saida);
    expect(bolsa.atributosBase.vontade).toBe(tetoV);
    expect(saida.some((e) => e.t === 'itemRecusado' && e.motivo === 'atributo_acima_do_nivel')).toBe(true);
    distribuirPonto(j, ctx, 'destreza', 0, saida);
    expect(bolsa.pontosAtributo).toBe(4);
    const anel = { ...obter(CONTEUDO.itens.get('anel_sabio')), id: 'anel_t', bonusAtributos: { vontade: { modo: 'abs' as const, valor: 5 } } };
    const ctxAnel = { ...ctx, conteudo: { ...CONTEUDO, itens: new Map([...CONTEUDO.itens, ['anel_t', anel]]) } };
    bolsa.equipamento.anel = { invId: 'a', itemId: 'anel_t', qtd: 1, ref: null };
    expect(derivarFicha(bolsa, 5, ctxAnel).atributos.vontade).toBe(tetoV + 5);
  });

  it('acima de 30 o ponto rende menos; até 30 é igual', () => {
    expect(pontosUteis(25, b)).toBe(25);
    expect(pontosUteis(30, b)).toBe(30);
    expect(pontosUteis(100, b)).toBe(30 + (70 * b.atributos.rendimentoAcima.pct) / 100);
  });
});

// Marco 39 (12/11/2026, D-155): o atributo de classe saiu; a classe cresce nos estilos.
describe('classe nos estilos', () => {
  it('cada estilo dá as suas melhorias de classe, crescendo a cada degrau da ponta', () => {
    const g = jogador('guerreiro');
    expect(fatorDeDominio(ctx, g, 'carga')).toBe(1);
    noEstilo(g, 'carniceiro', 30);
    const pouco = fatorDeDominio(ctx, g, 'furia');
    expect(pouco).toBeGreaterThan(1);
    expect(marcoDe(ctx, g, 'auraVisivel')).toBe(1);
    expect(marcoDe(ctx, g, 'estandartePct')).toBe(0);
    noEstilo(g, 'carniceiro', 200);
    expect(fatorDeDominio(ctx, g, 'furia')).toBeGreaterThan(pouco);
    expect(marcoDe(ctx, g, 'auraRaio')).toBe(2);
    const c = jogador('guerreiro');
    noEstilo(c, 'comandante', 200);
    expect(marcoDe(ctx, c, 'estandartePct')).toBeGreaterThan(marcoDe(ctx, g, 'estandartePct'));
    const n = jogador('necromante');
    noEstilo(n, 'senhor_da_horda', 200);
    expect(marcoDe(ctx, n, 'servosDaPassiva')).toBe(3);
    expect(marcoDe(ctx, n, 'auraRaio')).toBe(0);
  });

  it('as skills de classe crescem com os degraus de todos os estilos', () => {
    const m = jogador('mago');
    const classe = obter(CONTEUDO.classes.get('mago'));
    const exclusiva = obter(classe.exclusivas[0]);
    const hab = obter(resolverHabilidade(ctx, exclusiva));
    const antes = fonteDaHabilidade(m, ctx, 0, hab).multDano;
    noEstilo(m, 'ocultista', 100);
    expect(fatorDeSkillDeClasse(ctx, m, exclusiva)).toBeGreaterThan(1);
    expect(fatorDeSkillDeClasse(ctx, m, 'pedregulho')).toBe(1);
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
  it('a migração 29 › 30 tira o atributo de classe', () => {
    const j = jogador('mago');
    const bolsa = obter(j.bolsa);
    const r = obter(MIGRACOES[29])({ versaoSchema: 29, estado: { entidades: [{ ...j, atributos: { ...j.atributos, dominio: 40 }, bolsa: { ...bolsa, atributosBase: { ...bolsa.atributosBase, dominio: 40 } } }] }, fasesVisitadas: {} });
    const e = obter((r.estado as { entidades: { atributos: object; bolsa: { atributosBase: object } }[] }).entidades[0]);
    expect('dominio' in e.atributos).toBe(false);
    expect('dominio' in e.bolsa.atributosBase).toBe(false);
  });
});
