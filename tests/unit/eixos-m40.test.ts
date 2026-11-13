// Marco 40 (12/11/2026, D-157): os nove eixos das skills, as cinco formas novas (controle, sustento, marca, grupo,
// invocação), o destino `aliados`, a marca que acumula e a função secundária do elemento pelo papel do núcleo.
import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { formatarChave, lerChave } from '../../src/combat/chave-habilidade';
import { compilarHabilidade, resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { aplicarEfeito, multiplicadorDanoRecebido } from '../../src/combat/efeitos';
import { ESTADOS_DE_CONTROLE, formaDoEixo, type Papel } from '../../src/combat/eixos';
import { aplicarImpacto } from '../../src/combat/golpe';
import type { DefinicaoHabilidade, Habilidade } from '../../src/combat/habilidades';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarEntidade } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA, 'fase-02'));
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}
const defs = [...CONTEUDO.definicoes.values()].filter((d) => !d.basico && !d.interna);
const ferindo = obter(defs.find((d) => d.base.formulaDano !== null && d.base.politicaAlvo === 'hostil' && d.base.politicaImpacto === 'projetil'));
const comControle = obter(defs.find((d) => d.base.formulaDano !== null && d.base.politicaAlvo === 'hostil' && d.base.efeitos.some((e) => e.em === 'alvo' && ESTADOS_DE_CONTROLE.includes(e.tipo) && e.duracaoMs > 0)));
const comForma = (d: DefinicaoHabilidade, mod: Parameters<typeof formaDoEixo>[0], faixa: number): Habilidade =>
  obter(resolverHabilidade(ctx, formatarChave({ id: d.base.id, rank: 1, caminhos: [], mods: [], formas: [{ mod: formaDoEixo(mod), faixa }] })));

function cena() {
  const estado = criarEstado({ semente: 7, faseId: ctx.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 3, 3, ctx.balance);
  const amigo = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'k', 3, 5, ctx.balance);
  const longe = criarJogador(obter(CONTEUDO.classes.get('arqueiro')), 'l', 12, 12, ctx.balance);
  const alvo = criarEntidade({ id: 'a', tipo: 'inimigo', x: 5, y: 3, hpMax: 100000, nivel: 1, xpBase: 100 });
  const vizinho = criarEntidade({ id: 'b', tipo: 'inimigo', x: 6, y: 3, hpMax: 100000, nivel: 1, xpBase: 100 });
  for (const e of [j, amigo, longe]) e.autoAtaque = false;
  estado.entidades.push(j, amigo, longe, alvo, vizinho);
  const eventos: EventoSimulacao[] = [];
  const bater = (hab: Habilidade) => {
    aplicarImpacto(estado, ctx, alvo, { acaoId: 1, hab, indice: 0, fonte: { ...fonteDaHabilidade(j, ctx, 0, hab), d20Minimo: 12 } }, eventos);
  };
  return { estado, j, amigo, longe, alvo, vizinho, bater };
}

describe('eixos e formas novas (D-157)', () => {
  it('a chave leva as formas novas e a sintonia, e volta igual', () => {
    const chave = formatarChave({ id: 'x', rank: 2, caminhos: [], mods: [], formas: [{ mod: 'marca', faixa: 7 }, { mod: 'controle', faixa: 3 }], sintonia: 6 });
    expect(chave).toBe('x@2^controle3,marca7%6');
    expect(lerChave(chave)).toMatchObject({ id: 'x', rank: 2, formas: [{ mod: 'controle', faixa: 3 }, { mod: 'marca', faixa: 7 }], sintonia: 6 });
    expect(lerChave('x%11')).toBeNull();
    expect(lerChave('x^voo4')).toBeNull();
  });

  it('controle: os estados de controle duram mais com a faixa, e da faixa 5 passam a um vizinho', () => {
    const base = obter(resolverHabilidade(ctx, comControle.base.id));
    const duracao = (h: Habilidade) => Math.max(...h.efeitos.filter((e) => ESTADOS_DE_CONTROLE.includes(e.tipo) && e.em === 'alvo').map((e) => e.duracaoMs));
    const f3 = comForma(comControle, 'controle', 3);
    const f10 = comForma(comControle, 'controle', 10);
    expect(duracao(f3)).toBeGreaterThan(duracao(base));
    expect(duracao(f10)).toBeGreaterThan(duracao(f3));
    expect(f3.controleVizinho).toBeUndefined();
    expect(f10.controleVizinho).toBeDefined();
    // Sem controle na skill, a forma não entra.
    const semControle = defs.find((d) => d.base.formulaDano !== null && d.base.efeitos.length === 0 && d.base.elemento === null);
    if (semControle) expect(comForma(semControle, 'controle', 10).formas).toBeUndefined();
  });

  it('controle no jogo: o vizinho do alvo também pega o estado, com parte da duração', () => {
    const c = cena();
    c.bater(comForma(comControle, 'controle', 10));
    const tipos = (e: typeof c.alvo) => e.efeitos.filter((f) => ESTADOS_DE_CONTROLE.includes(f.tipo)).map((f) => f.tipo);
    expect(tipos(c.alvo).length).toBeGreaterThan(0);
    expect(tipos(c.vizinho).some((t) => tipos(c.alvo).includes(t))).toBe(true);
  });

  it('sustento: parte do golpe vira escudo acumulado em quem usa, maior com a faixa', () => {
    const escudo = (h: Habilidade) => h.efeitos.find((e) => e.tipo === 'escudo_acumulado' && e.em === 'conjurador')?.valor ?? 0;
    expect(escudo(comForma(ferindo, 'sustento', 2))).toBeGreaterThan(0);
    expect(escudo(comForma(ferindo, 'sustento', 10))).toBeGreaterThan(escudo(comForma(ferindo, 'sustento', 2)));
  });

  it('marca: acumula até o teto e cada marca soma ao dano recebido', () => {
    const c = cena();
    const h = comForma(ferindo, 'marca', 10);
    const marca = obter(h.efeitos.find((e) => e.tipo === 'marca_estilo'));
    for (let k = 0; k < 8; k++) aplicarEfeito(c.estado, ctx, c.alvo, marca, { id: c.j.id, x: c.j.x, y: c.j.y }, null, []);
    const ativa = obter(c.alvo.efeitos.find((f) => f.tipo === 'marca_estilo'));
    expect(ativa.valor).toBe(ctx.balance.habilidades.eixos.marca.max);
    expect(multiplicadorDanoRecebido(c.alvo, c.estado.tick)).toBeCloseTo(1 + (ativa.valor * ativa.pct) / 100);
  });

  it('grupo: o efeito com destino aliados cai nos aliados em volta, não no inimigo, em quem usa nem em quem está longe', () => {
    const c = cena();
    const h = comForma(ferindo, 'grupo', 10);
    expect(h.efeitos.some((e) => e.tipo === 'bonus_dano' && e.em === 'aliados')).toBe(true);
    c.bater(h);
    const temBonus = (e: typeof c.j) => e.efeitos.some((f) => f.tipo === 'bonus_dano');
    expect(temBonus(c.amigo)).toBe(true);
    expect(temBonus(c.longe)).toBe(false);
    expect(temBonus(c.alvo)).toBe(false);
    expect(temBonus(c.j)).toBe(false);
  });

  it('invocação: só entra em skill que invoca, e as invocações duram mais', () => {
    const invoca = defs.find((d) => d.base.efeitos.some((e) => (e.tipo === 'invocar' || e.tipo === 'invocar_temporario') && e.duracaoMs > 0));
    expect(comForma(ferindo, 'invocacao', 10).formas).toBeUndefined();
    if (!invoca) return;
    const dur = (h: Habilidade) => Math.max(...h.efeitos.filter((e) => e.tipo === 'invocar' || e.tipo === 'invocar_temporario').map((e) => e.duracaoMs));
    expect(dur(comForma(invoca, 'invocacao', 10))).toBeGreaterThan(dur(obter(resolverHabilidade(ctx, invoca.base.id))));
  });
});

describe('papel × elemento (D-157)', () => {
  const comPapel = (papel: Papel, elemento: Habilidade['elemento']): DefinicaoHabilidade => ({ ...ferindo, base: { ...ferindo.base, papel, elemento } });

  it('na skill comum, a função secundária cresce com a sintonia e some sem ela', () => {
    const def = comPapel('dano', 'trevas');
    const cura = (s: number) => compilarHabilidade(def, { rank: 1, caminhos: [], mods: [], sintonia: s }, CONTEUDO, ctx.balance.habilidades).efeitos.find((e) => e.tipo === 'cura' && e.em === 'conjurador')?.valor ?? 0;
    expect(cura(0)).toBe(0);
    expect(cura(5)).toBeGreaterThan(0);
    expect(cura(10)).toBeGreaterThan(cura(5));
  });

  it('`desde`: o efeito entra inteiro a partir da faixa', () => {
    const def = comPapel('dano', null);
    const empurra = (s: number) => compilarHabilidade(def, { rank: 1, caminhos: [], mods: [], sintonia: s }, CONTEUDO, ctx.balance.habilidades).efeitos.some((e) => e.tipo === 'empurrao');
    expect(empurra(9)).toBe(false);
    expect(empurra(10)).toBe(true);
  });

  it('com runa, a skill com papel tira a função secundária da tabela', () => {
    const def = comPapel('dano', null);
    const h = compilarHabilidade(def, { rank: 1, caminhos: [], mods: [], runa: { runa: 'sagrado', faixa: 10 } }, CONTEUDO, ctx.balance.habilidades);
    expect(h.efeitos.some((e) => e.tipo === 'cura' && e.em === 'aliados')).toBe(true);
    expect(h.runa).toBe('sagrado');
  });

  it('a tabela tem os seis papéis e só elementos conhecidos', () => {
    expect([...CONTEUDO.papeis.keys()].sort()).toEqual(['controle', 'cura', 'dano', 'defesa', 'invocacao', 'mobilidade']);
    expect(CONTEUDO.papeis.get('controle')?.size).toBe(9);
  });
});
