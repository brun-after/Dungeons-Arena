// Marco 46 (16/11/2026, D-185): as peças de armadura por propósito, estilo, grau e efeito. O modelo de dados
// (data/pecas.json, progression/pecas.ts) e o motor `gatilho → condição → efeito` (combat/efeitos-de-peca.ts): cada
// linha da tabela tem o teste do gatilho, da duração em ticks e do fim do efeito.

import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { aoSerAtingidoDasPecas, aoUsarHabilidadeDasPecas, fatorDeRecargaDasPecas, multiplicadorDasPecas, pecasNosEventos, processarPecas } from '../../src/combat/efeitos-de-peca';
import { aplicarImpacto } from '../../src/combat/golpe';
import type { Habilidade } from '../../src/combat/habilidades';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { criarEstado, type EstadoJogo } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { passivosDe } from '../../src/progression/ganchos-do-portador';
import { idItemGerado } from '../../src/progression/gerar-item';
import { PECAS_DE_ARMADURA, type PecaDeArmadura } from '../../src/progression/graus';
import { lerPecas, perfilDaPeca, type PerfilDePeca } from '../../src/progression/pecas';
import { usoAtual } from '../../src/progression/vinculo';
import pecasJson from '../../src/data/pecas.json';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const BASE_DA_PECA: Record<PecaDeArmadura, string> = { capa: 'capa', corpo: 'peitoral', pernas: 'calcas', pes: 'botas', maos: 'luvas', cabeca: 'elmo' };

/** O primeiro item gerado (pela semente) da peça e da raridade cujo perfil traz a receita (e o elemento, se pedido). */
function itemCom(peca: PecaDeArmadura, receita: string, raridade: 'comum' | 'raro' | 'lendario' = 'comum', elemento?: string): { id: string; perfil: PerfilDePeca } {
  for (let s = 0; s < 20_000; s++) {
    const id = idItemGerado(BASE_DA_PECA[peca], 5, raridade, s);
    const perfil = CONTEUDO.itens.get(id)?.peca;
    if (perfil?.efeitos.some((x) => x.receita === receita) && (!elemento || perfil.elemento === elemento)) return { id, perfil };
  }
  throw new Error(`nenhum item com ${receita}`);
}

function vestir(e: Entidade, peca: PecaDeArmadura, id: string): void {
  obter(e.bolsa, 'bolsa').equipamento[peca] = { invId: `v-${peca}`, itemId: id, qtd: 1, ref: null };
}

function cena(ctx: ContextoSimulacao = contexto(faseDeTexto(SALA_ABERTA))) {
  const estado = criarEstado({ semente: 7, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro'), 'guerreiro'), 'j', 3, 3, ctx.balance);
  estado.entidades.push(j);
  const goblin = (id: string, x: number, y: number) => {
    const e = criarInimigo(obter(ctx.conteudo.presets.get('goblin'), 'goblin'), id, x, y, ctx.balance);
    e.hp = e.hpMax = 500;
    estado.entidades.push(e);
    return e;
  };
  const eventos: EventoSimulacao[] = [];
  return { ctx, estado, j, goblin, eventos };
}

const ativo = (estado: EstadoJogo, e: Entidade, tipo: string) => e.efeitos.find((f) => f.tipo === tipo && f.ateTick > estado.tick);
const hab = (h: Partial<Habilidade>): Pick<Habilidade, 'elemento' | 'tipoAtaque' | 'politicaImpacto'> => ({ elemento: null, tipoAtaque: 'magico', politicaImpacto: 'projetil', ...h });

describe('o modelo de dados das peças (D-185)', () => {
  it('pecas.json é válido e cobre as 6 peças, os 5 propósitos e os 5 estilos', () => {
    const { pecas, erros } = lerPecas(pecasJson);
    expect(erros).toEqual([]);
    expect([...pecas.propositos.keys()].sort()).toEqual(['arcano', 'baluarte', 'batedor', 'espreita', 'ossuario']);
    expect([...pecas.estilos.keys()].sort()).toEqual(['arcana', 'colorida', 'medieval', 'meme', 'simples']);
    for (const p of PECAS_DE_ARMADURA) expect(pecas.receitas.some((r) => r.peca === p)).toBe(true);
  });

  it('recusa a receita que a peça não aceita, o elemento que falta e o grau sem número', () => {
    const ruim = structuredClone(pecasJson) as unknown as { receitas: unknown[]; efeitosPorGrau: number[] };
    ruim.receitas.push({ id: 'botas_que_refletem', peca: 'pes', gatilho: 'atingido', se: {}, efeito: { tipo: 'refletir', pct: 10 }, marca: 'espinhos' });
    ruim.receitas.push({ id: 'manto_sem_elemento', peca: 'capa', gatilho: 'passivo', se: {}, efeito: { tipo: 'poderElemento', pct: 5 }, marca: 'filigrana' });
    ruim.efeitosPorGrau = [1, 2];
    const { erros } = lerPecas(ruim);
    expect(erros.some((e) => e.includes('botas_que_refletem') && e.includes('não aceita'))).toBe(true);
    expect(erros.some((e) => e.includes('manto_sem_elemento'))).toBe(true);
    expect(erros.some((e) => e.includes('efeitosPorGrau'))).toBe(true);
  });

  it('o perfil é fixo pelo id e o grau libera 1, 2 ou 3 efeitos', () => {
    const regras = CONTEUDO.pecas;
    for (const [raridade, n] of [['comum', 1], ['incomum', 1], ['raro', 2], ['epico', 2], ['lendario', 3], ['ultima', 3]] as const) {
      const item = { id: `teste_${raridade}`, slotPadrao: 'corpo', raridade };
      const a = obter(perfilDaPeca(regras, item), raridade);
      expect(a).toEqual(perfilDaPeca(regras, item));
      expect(a.efeitos).toHaveLength(Math.min(n, regras.receitas.filter((r) => r.peca === 'corpo' && r.grauMinimo <= a.grau).length));
      expect(new Set(a.efeitos.map((x) => x.receita)).size).toBe(a.efeitos.length);
    }
    expect(perfilDaPeca(regras, { id: 'anel', slotPadrao: 'anel', raridade: 'raro' })).toBeNull();
  });

  it('as peças variam: os propósitos, os estilos, os elementos e as receitas saem todos no loot', () => {
    const propositos = new Set<string>();
    const estilos = new Set<string>();
    const elementos = new Set<string>();
    const combos = new Set<string>();
    for (let s = 0; s < 400; s++) {
      const p = obter(CONTEUDO.itens.get(idItemGerado('luvas', 10, 'lendario', s))?.peca, 'perfil');
      propositos.add(p.proposito);
      estilos.add(p.estilo);
      elementos.add(p.elemento);
      combos.add(p.efeitos.map((x) => x.receita).sort().join('+'));
    }
    expect(propositos.size).toBe(5);
    expect(estilos.size).toBe(5);
    expect(elementos.size).toBe(8);
    expect(combos.size).toBeGreaterThanOrEqual(8);
  });

  it('o número cresce com o grau, e o item com elemento leva o próprio elemento às receitas com "*"', () => {
    const regras = CONTEUDO.pecas;
    const fraco = obter(perfilDaPeca(regras, { id: 'x', slotPadrao: 'capa', raridade: 'comum', elemento: 'gelo' }), 'comum');
    const forte = obter(perfilDaPeca(regras, { id: 'x', slotPadrao: 'capa', raridade: 'ultima', elemento: 'gelo' }), 'última');
    expect(fraco.elemento).toBe('gelo');
    for (const x of [...fraco.efeitos, ...forte.efeitos]) if (x.se.elemento !== null) expect(x.se.elemento).toBe('gelo');
    const pct = (p: PerfilDePeca) => p.efeitos.map((x) => ('pct' in x.efeito ? x.efeito.pct : 0));
    expect(Math.max(...pct(forte))).toBeGreaterThan(Math.max(...pct(fraco)) - 1e-9);
  });

  it('o catálogo dá o perfil às peças geradas (e não às joias)', () => {
    expect(CONTEUDO.itens.get(idItemGerado('botas', 3, 'raro', 5))?.peca?.peca).toBe('pes');
    expect(CONTEUDO.itens.get(idItemGerado('anel', 3, 'raro', 5))?.peca).toBeUndefined();
  });
});

describe('botas: gatilho → velocidade por X ticks, que renova', () => {
  it('pisar no elemento acelera por X ticks, renova pisando de novo e acaba fora dele', () => {
    // Botas de fogo sobre as brasas.
    const base = contexto(faseDeTexto(SALA_ABERTA));
    const { id, perfil } = itemCom('pes', 'passo_elemental', 'comum', 'fogo');
    const ctxCerto: ContextoSimulacao = { ...base, fase: { ...base.fase, ambientes: [{ tipo: 'brasas', x: 3, y: 3, raio: 1 }] } };
    const c = cena(ctxCerto);
    const efeito = obter(perfil.efeitos.find((x) => x.receita === 'passo_elemental'), 'efeito').efeito;
    if (efeito.tipo !== 'velocidade') throw new Error('tipo');
    vestir(c.j, 'pes', id);
    c.estado.tick = 60;
    processarPecas(c.estado, ctxCerto, c.eventos);
    const f = obter(ativo(c.estado, c.j, 'acelerado'), 'acelerado');
    expect(f.ateTick).toBe(60 + efeito.ticks);
    expect(f.pct).toBe(efeito.pct);
    // Renova (não soma): pisando de novo 30 ticks depois, o fim anda e o bônus fica o mesmo.
    c.estado.tick = 90;
    processarPecas(c.estado, ctxCerto, c.eventos);
    const g = obter(ativo(c.estado, c.j, 'acelerado'), 'renovado');
    expect(g.ateTick).toBe(90 + efeito.ticks);
    expect(g.pct).toBe(efeito.pct);
    // Fora do chão, nada dispara e o efeito acaba no tick marcado.
    c.j.x = c.j.px = 9;
    c.estado.tick = 120;
    processarPecas(c.estado, ctxCerto, c.eventos);
    expect(obter(ativo(c.estado, c.j, 'acelerado'), 'ainda').ateTick).toBe(90 + efeito.ticks);
    c.estado.tick = 90 + efeito.ticks;
    expect(ativo(c.estado, c.j, 'acelerado')).toBeUndefined();
  });

  it('usar o elemento acelera; outro elemento, não', () => {
    const c = cena();
    const { id, perfil } = itemCom('pes', 'impeto_elemental');
    const efeito = obter(perfil.efeitos.find((x) => x.receita === 'impeto_elemental'), 'e').efeito;
    if (efeito.tipo !== 'velocidade') throw new Error('tipo');
    vestir(c.j, 'pes', id);
    const outro = perfil.elemento === 'gelo' ? 'fogo' : 'gelo';
    aoUsarHabilidadeDasPecas(c.estado, c.ctx, c.j, hab({ elemento: outro }), c.eventos);
    expect(ativo(c.estado, c.j, 'acelerado')).toBeUndefined();
    aoUsarHabilidadeDasPecas(c.estado, c.ctx, c.j, hab({ elemento: perfil.elemento }), c.eventos);
    expect(obter(ativo(c.estado, c.j, 'acelerado'), 'acelerado').ateTick).toBe(c.estado.tick + efeito.ticks);
    c.estado.tick += efeito.ticks;
    expect(ativo(c.estado, c.j, 'acelerado')).toBeUndefined();
  });

  it('ser atingido pelo golpe físico acelera (pelo golpe de verdade, em golpe.ts)', () => {
    const c = cena();
    const { id, perfil } = itemCom('pes', 'fuga_do_golpe');
    const efeito = obter(perfil.efeitos.find((x) => x.receita === 'fuga_do_golpe'), 'e').efeito;
    if (efeito.tipo !== 'velocidade') throw new Error('tipo');
    vestir(c.j, 'pes', id);
    const g = c.goblin('g', 4, 3);
    const basico = obter(CONTEUDO.habilidades.get(g.ataqueBasico), 'básico do goblin');
    for (let i = 0; i < 20 && !ativo(c.estado, c.j, 'acelerado'); i++) {
      c.j.hp = c.j.hpMax;
      aplicarImpacto(c.estado, c.ctx, c.j, { acaoId: i, fonte: fonteDaHabilidade(g, c.ctx, c.estado.tick, basico), hab: basico, indice: 0 }, c.eventos);
    }
    expect(obter(ativo(c.estado, c.j, 'acelerado'), 'acelerado').ateTick).toBe(c.estado.tick + efeito.ticks);
  });
});

describe('luvas: condição do ataque → bônus', () => {
  it('corpo a corpo ganha; à distância e magia, não', () => {
    const c = cena();
    const { id, perfil } = itemCom('maos', 'punho');
    vestir(c.j, 'maos', id);
    const pct = perfil.efeitos.filter((x) => x.se.ataque === 'corpoACorpo').reduce((s, x) => s + ('pct' in x.efeito ? x.efeito.pct : 0), 0);
    expect(multiplicadorDasPecas(c.ctx, c.j, hab({ tipoAtaque: 'fisico', politicaImpacto: 'contato' }))).toBeCloseTo(1 + Math.min(40, pct) / 100);
    const outros = perfil.efeitos.filter((x) => x.se.ataque !== 'corpoACorpo');
    if (outros.length === 0) expect(multiplicadorDasPecas(c.ctx, c.j, hab({ tipoAtaque: 'fisico', politicaImpacto: 'projetil' }))).toBe(1);
  });

  it('a magia do elemento ganha; a de outro elemento, só o que vale para qualquer magia', () => {
    const c = cena();
    const { id, perfil } = itemCom('maos', 'foco_elemental');
    vestir(c.j, 'maos', id);
    const certo = multiplicadorDasPecas(c.ctx, c.j, hab({ elemento: perfil.elemento }));
    const errado = multiplicadorDasPecas(c.ctx, c.j, hab({ elemento: perfil.elemento === 'gelo' ? 'fogo' : 'gelo' }));
    expect(certo).toBeGreaterThan(errado);
  });

  it('o teto segura a soma', () => {
    const c = cena();
    const { id } = itemCom('maos', 'garra_cruel', 'lendario');
    vestir(c.j, 'maos', id);
    expect(multiplicadorDasPecas(c.ctx, c.j, hab({ tipoAtaque: 'fisico', politicaImpacto: 'contato' }))).toBeLessThanOrEqual(1 + CONTEUDO.pecas.tetos.danoPct / 100 + 1e-9);
  });
});

describe('peitoral: atingido pelo elemento → reflete no atacante, pela relação', () => {
  it('reflete no inimigo, nunca no aliado; igual contra criatura e contra jogador (PvP)', () => {
    const c = cena();
    const { id, perfil } = itemCom('corpo', 'espinhos');
    const pct = Math.min(CONTEUDO.pecas.tetos.refletirPct, perfil.efeitos.filter((x) => x.efeito.tipo === 'refletir' && (x.se.elemento === 'fisico' || x.se.elemento === null)).reduce((s, x) => s + ('pct' in x.efeito ? x.efeito.pct : 0), 0));
    vestir(c.j, 'corpo', id);
    const fisico = hab({ tipoAtaque: 'fisico', politicaImpacto: 'contato' });
    // contra a criatura
    const g = c.goblin('g', 4, 3);
    aoSerAtingidoDasPecas(c.estado, c.ctx, c.j, g, fisico, 100, c.eventos);
    expect(g.hpMax - g.hp).toBe(Math.round((100 * pct) / 100));
    // contra outro jogador de outra equipe (PvP)
    const outro = criarJogador(obter(CONTEUDO.classes.get('mago'), 'mago'), 'p2', 4, 4, c.ctx.balance);
    outro.equipe = 'outra';
    c.estado.entidades.push(outro);
    const antes = outro.hp;
    aoSerAtingidoDasPecas(c.estado, c.ctx, c.j, outro, fisico, 100, c.eventos);
    expect(antes - outro.hp).toBe(Math.round((100 * pct) / 100));
    // o aliado (mesma equipe) não leva
    const aliado = criarJogador(obter(CONTEUDO.classes.get('mago'), 'mago'), 'p3', 2, 2, c.ctx.balance);
    c.estado.entidades.push(aliado);
    const vidaAliado = aliado.hp;
    aoSerAtingidoDasPecas(c.estado, c.ctx, c.j, aliado, fisico, 100, c.eventos);
    expect(aliado.hp).toBe(vidaAliado);
    // outro elemento: só reflete o que vale para qualquer golpe
    const semCondicaoLivre = perfil.efeitos.every((x) => x.efeito.tipo !== 'refletir' || x.se.elemento !== null);
    if (semCondicaoLivre) {
      const vida = g.hp;
      aoSerAtingidoDasPecas(c.estado, c.ctx, c.j, g, hab({ elemento: 'psiquico' }), 100, c.eventos);
      expect(g.hp).toBe(vida);
    }
  });
});

describe('perneiras: o movimento da classe → recarga, rastro e chegada', () => {
  const evento = (id: string, fase: 'inicio' | 'fim', tick: number): EventoSimulacao => ({ t: 'movimentoClasse', tick, id, mov: 'x', fase });

  it('a recarga do movimento fica menor', () => {
    const c = cena();
    expect(fatorDeRecargaDasPecas(c.ctx, c.j)).toBe(1);
    const { id, perfil } = itemCom('pernas', 'passada');
    vestir(c.j, 'pernas', id);
    const pct = perfil.efeitos.filter((x) => x.efeito.tipo === 'recargaMovimento').reduce((s, x) => s + ('pct' in x.efeito ? x.efeito.pct : 0), 0);
    expect(fatorDeRecargaDasPecas(c.ctx, c.j)).toBeCloseTo(1 - pct / 100);
  });

  it('o início deixa o rastro do elemento por X ticks', () => {
    const c = cena();
    const { id, perfil } = itemCom('pernas', 'rastro_elemental');
    const efeito = obter(perfil.efeitos.find((x) => x.receita === 'rastro_elemental'), 'e').efeito;
    if (efeito.tipo !== 'rastro') throw new Error('tipo');
    vestir(c.j, 'pernas', id);
    c.j.movimentoClasse = { ativo: 'x', cargas: {}, modo: { tipo: 'marcha', id: 'x', desdeTick: c.estado.tick } };
    pecasNosEventos(c.estado, c.ctx, [evento('j', 'inicio', c.estado.tick)], c.eventos);
    const r = obter(ativo(c.estado, c.j, 'rastro_efeito'), 'rastro');
    expect(r.ateTick).toBe(c.estado.tick + efeito.ticks);
    expect(r.interno?.tipo).toBe(CONTEUDO.elementos.get(perfil.elemento)?.estado.tipo);
    c.estado.tick += efeito.ticks;
    expect(ativo(c.estado, c.j, 'rastro_efeito')).toBeUndefined();
  });

  it('a chegada fere os hostis em volta (não os aliados) e o escudo dura X ticks', () => {
    const c = cena();
    const dano = itemCom('pernas', 'queda');
    vestir(c.j, 'pernas', dano.id);
    const g = c.goblin('g', 4, 3);
    const longe = c.goblin('l', 9, 9);
    const aliado = criarJogador(obter(CONTEUDO.classes.get('mago'), 'mago'), 'a', 3, 4, c.ctx.balance);
    c.estado.entidades.push(aliado);
    // em curso: a chegada espera o fim
    c.j.movimentoClasse = { ativo: 'x', cargas: {}, modo: { tipo: 'marcha', id: 'x', desdeTick: c.estado.tick } };
    pecasNosEventos(c.estado, c.ctx, [evento('j', 'inicio', c.estado.tick)], c.eventos);
    expect(g.hp).toBe(g.hpMax);
    delete c.j.movimentoClasse.modo;
    pecasNosEventos(c.estado, c.ctx, [evento('j', 'fim', c.estado.tick)], c.eventos);
    expect(g.hp).toBeLessThan(g.hpMax);
    expect(longe.hp).toBe(longe.hpMax);
    expect(aliado.hp).toBe(aliado.hpMax);

    const c2 = cena();
    const escudo = itemCom('pernas', 'guarda_da_chegada');
    const ef = obter(escudo.perfil.efeitos.find((x) => x.receita === 'guarda_da_chegada'), 'e').efeito;
    if (ef.tipo !== 'chegadaEscudo') throw new Error('tipo');
    vestir(c2.j, 'pernas', escudo.id);
    // o movimento instantâneo (sem modo em curso) chega no mesmo tick
    pecasNosEventos(c2.estado, c2.ctx, [evento('j', 'inicio', c2.estado.tick)], c2.eventos);
    const s = obter(ativo(c2.estado, c2.j, 'escudo'), 'escudo');
    expect(s.ateTick).toBe(c2.estado.tick + ef.ticks);
    c2.estado.tick += ef.ticks;
    expect(ativo(c2.estado, c2.j, 'escudo')).toBeUndefined();
  });
});

describe('manto: passivo do elemento e absorção do golpe do elemento', () => {
  it('mais poder nas skills do elemento', () => {
    const c = cena();
    const { id, perfil } = itemCom('capa', 'manto_elemental');
    vestir(c.j, 'capa', id);
    expect(multiplicadorDasPecas(c.ctx, c.j, hab({ elemento: perfil.elemento }))).toBeGreaterThan(1);
    expect(multiplicadorDasPecas(c.ctx, c.j, hab({ elemento: null, tipoAtaque: 'fisico' }))).toBe(1);
  });

  it('absorve em poder: cura parte do golpe e dá bônus de dano por X ticks', () => {
    const c = cena();
    const { id, perfil } = itemCom('capa', 'absorver_em_poder');
    const ef = obter(perfil.efeitos.find((x) => x.receita === 'absorver_em_poder'), 'e').efeito;
    if (ef.tipo !== 'absorver') throw new Error('tipo');
    vestir(c.j, 'capa', id);
    const g = c.goblin('g', 4, 3);
    c.j.hp = c.j.hpMax - 50;
    aoSerAtingidoDasPecas(c.estado, c.ctx, c.j, g, hab({ elemento: perfil.elemento }), 100, c.eventos);
    expect(c.j.hp).toBeGreaterThan(c.j.hpMax - 50);
    const b = obter(ativo(c.estado, c.j, 'bonus_dano'), 'bônus');
    expect(b.ateTick).toBe(c.estado.tick + ef.ticks);
    c.estado.tick += ef.ticks;
    expect(ativo(c.estado, c.j, 'bonus_dano')).toBeUndefined();
    // golpe de outro elemento: nada
    const c2 = cena();
    vestir(c2.j, 'capa', id);
    c2.j.hp = c2.j.hpMax - 50;
    aoSerAtingidoDasPecas(c2.estado, c2.ctx, c2.j, g, hab({ elemento: perfil.elemento === 'gelo' ? 'fogo' : 'gelo' }), 100, c2.eventos);
    expect(c2.j.hp).toBe(c2.j.hpMax - 50);
  });

  it('absorve em sintonia: o uso do elemento sobe no vínculo', () => {
    const c = cena();
    const { id, perfil } = itemCom('capa', 'absorver_em_sintonia');
    vestir(c.j, 'capa', id);
    const bolsa = obter(c.j.bolsa, 'bolsa');
    const antes = usoAtual(c.ctx.balance.vinculo, bolsa.vinculoUso?.[perfil.elemento], c.estado.tick);
    aoSerAtingidoDasPecas(c.estado, c.ctx, c.j, c.goblin('g', 4, 3), hab({ elemento: perfil.elemento }), 100, c.eventos);
    expect(usoAtual(c.ctx.balance.vinculo, bolsa.vinculoUso?.[perfil.elemento], c.estado.tick)).toBeGreaterThan(antes);
  });
});

describe('elmo: resistência passiva pela ponte dos ganchos', () => {
  it('a resistência ao elemento entra nos passivos', () => {
    const c = cena();
    const { id, perfil } = itemCom('cabeca', 'elmo_elemental');
    vestir(c.j, 'cabeca', id);
    const r = passivosDe(c.ctx, c.j).resistencias.find((x) => x.elemento === perfil.elemento);
    expect(r?.pct).toBeGreaterThan(0);
  });
});
