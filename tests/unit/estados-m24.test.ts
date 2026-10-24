// Marco 24 (24/10/2026, D-094/D-097): orientação e pelas costas, os estados novos, as fases e o XP de grupo.
import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade, processarAcoes } from '../../src/combat/acao';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { agendarFase } from '../../src/combat/fases';
import { aplicarImpacto } from '../../src/combat/golpe';
import { direcaoDe, pelasCostas } from '../../src/combat/orientacao';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarEntidade } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { processarIa } from '../../src/entities/ia';
import { processarMortes } from '../../src/progression/morte';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null): T {
  if (v == null) throw Error('ausente');
  return v;
}

function cena(classe = 'guerreiro') {
  const ctx = contexto(faseDeTexto(SALA_ABERTA, 'fase-02'));
  const estado = criarEstado({ semente: 11, faseId: ctx.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 3, 3, ctx.balance);
  j.autoAtaque = false;
  const alvo = criarEntidade({ id: 'a', tipo: 'inimigo', x: 4, y: 3, hpMax: 100000, nivel: 1, xpBase: 100 });
  estado.entidades.push(j, alvo);
  const eventos: EventoSimulacao[] = [];
  return { ctx, estado, j, alvo, eventos };
}

function golpe(c: ReturnType<typeof cena>, d20 = 12): number {
  const hab = obter(habilidadeDoAtor(c.ctx, c.j, c.j.ataqueBasico));
  const antes = c.alvo.hp;
  aplicarImpacto(c.estado, c.ctx, c.alvo, { acaoId: 1, hab, indice: 0, fonte: { ...fonteDaHabilidade(c.j, c.ctx, 0, hab), d20Minimo: d20 } }, c.eventos);
  return antes - c.alvo.hp;
}

describe('orientação e pelas costas', () => {
  it('a direção do vetor e o cone de trás (135°: a de trás e as duas diagonais)', () => {
    expect(direcaoDe(1, 0)).toBe('E');
    expect(direcaoDe(-2, -2)).toBe('NO');
    expect(direcaoDe(3, 1)).toBe('E');
    expect(direcaoDe(0, 0)).toBeNull();
    const alvo = criarEntidade({ id: 'x', tipo: 'inimigo', x: 5, y: 5 });
    alvo.olhando = 'E';
    expect(pelasCostas({ x: 4, y: 5 }, alvo, 135)).toBe(true);
    expect(pelasCostas({ x: 4, y: 4 }, alvo, 135)).toBe(true);
    expect(pelasCostas({ x: 5, y: 4 }, alvo, 135)).toBe(false);
    expect(pelasCostas({ x: 6, y: 5 }, alvo, 135)).toBe(false);
  });

  it('o golpe pelas costas sai marcado no evento; a passiva de costas bate mais', () => {
    const c = cena();
    c.alvo.olhando = 'E';
    golpe(c);
    expect(c.eventos.some((e) => e.t === 'impacto' && e.costas === true)).toBe(true);
    c.alvo.olhando = 'O';
    c.eventos.length = 0;
    golpe(c);
    expect(c.eventos.some((e) => e.t === 'impacto' && e.costas === true)).toBe(false);
  });
});

describe('estados novos', () => {
  it('cego erra pela chance (100% vira o teto de 60%)', () => {
    const c = cena();
    aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('cego', { pct: 100, duracaoMs: 60_000 }), c.alvo, null, c.eventos);
    let erros = 0;
    for (let i = 0; i < 200; i++) if (golpe(c) === 0) erros++;
    expect(erros).toBeGreaterThan(90);
    expect(erros).toBeLessThan(150);
  });

  it('desafiado leva mais dano só de quem desafiou, e a IA persegue quem desafiou', () => {
    const c = cena();
    c.alvo.olhando = 'O';
    const normal = golpe(c, 15);
    aplicarEfeito(c.estado, c.ctx, c.alvo, construirEfeito('desafiado', { pct: 50, duracaoMs: 60_000 }), c.j, null, c.eventos);
    const desafiado = golpe(c, 15);
    expect(desafiado).toBeGreaterThan(normal);
  });

  it('o contragolpe anula o golpe, atordoa quem bateu e agenda a resposta', () => {
    const c = cena();
    aplicarEfeito(c.estado, c.ctx, c.alvo, { ...construirEfeito('contragolpe', { duracaoMs: 1500 }), ref: 'ataque_basico' }, c.alvo, null, c.eventos);
    const dano = golpe(c, 15);
    expect(dano).toBe(0);
    expect(c.j.efeitos.some((f) => f.tipo === 'atordoar')).toBe(true);
    expect(c.estado.fases?.[0]).toMatchObject({ atorId: 'a', chave: 'ataque_basico', alvoId: 'j' });
  });

  it('o escudo de cada acerto soma até o teto', () => {
    const c = cena();
    for (let i = 0; i < 6; i++) aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('escudo_acumulado', { valor: 4, pct: 16, duracaoMs: 5000 }), c.j, null, c.eventos);
    expect(c.j.efeitos.filter((f) => f.tipo === 'escudo_acumulado').map((f) => f.valor)).toEqual([16]);
  });

  it('aterrorizado foge de quem aterrorizou', () => {
    const c = cena();
    c.alvo.controlador = 'ia';
    c.alvo.preset = 'goblin';
    aplicarEfeito(c.estado, c.ctx, c.alvo, construirEfeito('aterrorizado', { duracaoMs: 3000 }), c.j, null, c.eventos);
    processarIa(c.estado, c.ctx, c.eventos);
    expect(c.alvo.caminho[0]?.x ?? c.alvo.x).toBeGreaterThanOrEqual(c.alvo.x);
    expect(c.alvo.acao).toBeNull();
  });

  it('a fase agendada sai no prazo, sem custo', () => {
    const c = cena();
    agendarFase(c.estado, c.j, 'ataque_basico', c.alvo, 0);
    const mana = c.j.mana;
    processarAcoes(c.estado, c.ctx, c.eventos);
    expect(c.estado.fases).toBeUndefined();
    expect(c.eventos.some((e) => e.t === 'impacto' && e.alvoId === 'a')).toBe(true);
    expect(c.j.mana).toBe(mana);
  });
});

describe('XP de grupo (D-097)', () => {
  it('quem abate leva tudo, o aliado perto leva 75% e o distante sem luta não leva', () => {
    const c = cena();
    const perto = criarJogador(obter(CONTEUDO.classes.get('mago')), 'p', 5, 5, c.ctx.balance);
    const longe = criarJogador(obter(CONTEUDO.classes.get('mago')), 'l', 40, 40, c.ctx.balance);
    c.estado.entidades.push(perto, longe);
    c.alvo.hp = 0;
    c.alvo.xpBase = 8;
    c.alvo.participacao = [{ id: 'j', tick: 0 }];
    processarMortes(c.estado, c.ctx, c.eventos);
    const xp = (e: typeof c.j) => e.xp + (e.bolsa?.xpFracao ?? 0);
    expect(xp(c.j)).toBeGreaterThan(0);
    expect(xp(perto) / xp(c.j)).toBeCloseTo(0.75, 1);
    expect(xp(longe)).toBe(0);
  });
});
