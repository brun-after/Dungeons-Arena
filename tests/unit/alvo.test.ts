// Ajuste de 15/10/2026 (D-065): o alvo não troca sozinho. O auto-alvo escolhe uma vez e a seleção acompanha quem
// você acerta; travado (escolha manual), o golpe nunca vai para outro; a troca manual percorre os hostis por distância.

import { describe, expect, it } from 'vitest';
import { proximoHostil } from '../../src/combat/acao';
import { lerComando } from '../../src/arena/protocolo';
import type { Comando } from '../../src/core/comandos';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import type { Entidade } from '../../src/entities/entidade';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));

function obter<T>(v: T | undefined, nome: string): T {
  if (v === undefined) throw new Error(`${nome} ausente`);
  return v;
}

/** Jogador em (3,5) e dois bonecos (sem IA) colados nele: `b` em (4,5) e `c` em (2,5). */
function cena() {
  const estado = criarEstado({ semente: 1, faseId: 'teste' });
  const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
  const boneco = obter(CONTEUDO.presets.get('boneco'), 'boneco');
  estado.entidades.push(criarJogador(classe, 'j', 3, 5, ctx.balance));
  estado.entidades.push(criarInimigo(boneco, 'b', 4, 5, ctx.balance));
  estado.entidades.push(criarInimigo(boneco, 'c', 2, 5, ctx.balance));
  const eventos: EventoSimulacao[] = [];
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
  const tick = (cmds: [string, Comando][] = []) => {
    simular(estado, ctx, cmds.map(([entidadeId, cmd]) => ({ tick: estado.tick, entidadeId, cmd })), eventos, DT_MS);
  };
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const de = <T extends EventoSimulacao['t']>(t: T) => eventos.filter((e): e is Extract<EventoSimulacao, { t: T }> => e.t === t);
  const mover = (id: string, x: number) => {
    Object.assign(ent(id), { x, px: x, origemX: x });
  };
  /** Espera a recarga do básico e pede outro golpe sem alvo (Espaço). */
  const espaco = () => {
    ticks(120);
    eventos.length = 0;
    tick([['j', { t: 'ataqueBasico' }]]);
  };
  return { estado, eventos, ent, tick, ticks, de, mover, espaco };
}

describe('alvo automático que acompanha (D-065)', () => {
  it('o primeiro golpe seleciona e os seguintes ficam nele, mesmo com outro mais fraco ao lado', () => {
    const a = cena();
    a.tick([['j', { t: 'ataqueBasico' }]]);
    expect(a.de('acaoIniciada')).toMatchObject([{ alvoId: 'b' }]);
    expect(a.ent('j')).toMatchObject({ alvoSelecionado: 'b', alvoTravado: false });
    // Antes, o auto-alvo pularia para o de menor vida a cada golpe.
    a.ent('c').hp = 1;
    a.eventos.length = 0;
    a.ticks(300);
    const alvos = new Set(a.de('acaoIniciada').map((e) => e.alvoId));
    expect([...alvos]).toEqual(['b']);
  });

  it('destravado e com o alvo fora do alcance, o golpe vai para outro e a seleção acompanha', () => {
    const a = cena();
    a.tick([['j', { t: 'ataqueBasico' }]]);
    a.mover('b', 9);
    a.espaco();
    expect(a.de('acaoIniciada')).toMatchObject([{ alvoId: 'c' }]);
    expect(a.ent('j').alvoSelecionado).toBe('c');
  });
});

describe('alvo travado (D-065)', () => {
  it('a escolha manual trava; o automático espera, e o golpe pedido fora do alcance vai no mais perto (D-119)', () => {
    const a = cena();
    a.tick([['j', { t: 'selecionarAlvo', alvo: 'b' }]]);
    expect(a.ent('j')).toMatchObject({ alvoSelecionado: 'b', alvoTravado: true });
    a.mover('b', 9);
    a.ticks(120);
    a.eventos.length = 0;
    const vidaC = a.ent('c').hp;
    // O automático espera em vez de bater no `c`.
    a.ticks(300);
    expect(a.de('acaoIniciada')).toHaveLength(0);
    expect(a.ent('c').hp).toBe(vidaC);
    expect(a.ent('j').alvoSelecionado).toBe('b');
    // Marco 26 (28/10/2026, D-119): pedir o golpe com o travado longe troca para o mais próximo no alcance.
    a.espaco();
    expect(a.de('acaoRecusada')).toHaveLength(0);
    expect(a.de('acaoIniciada')).toMatchObject([{ alvoId: 'c' }]);
    expect(a.ent('j').alvoSelecionado).toBe('c');
  });

  it('travado e no alcance, o automático bate só nele', () => {
    const a = cena();
    a.tick([['j', { t: 'selecionarAlvo', alvo: 'c' }]]);
    a.ticks(300);
    const alvos = new Set(a.de('acaoIniciada').map((e) => e.alvoId));
    expect([...alvos]).toEqual(['c']);
  });

  it('a morte do travado desfaz a seleção e a trava; o próximo golpe escolhe de novo', () => {
    const a = cena();
    a.tick([['j', { t: 'selecionarAlvo', alvo: 'b' }]]);
    a.ent('b').morto = true;
    a.espaco();
    expect(a.de('acaoIniciada')).toMatchObject([{ alvoId: 'c' }]);
    expect(a.ent('j')).toMatchObject({ alvoSelecionado: 'c', alvoTravado: false });
  });

  it('travar: false destrava sem perder o alvo; alvo nulo limpa tudo', () => {
    const a = cena();
    a.tick([['j', { t: 'selecionarAlvo', alvo: 'b' }]]);
    a.tick([['j', { t: 'selecionarAlvo', alvo: 'b', travar: false }]]);
    expect(a.ent('j')).toMatchObject({ alvoSelecionado: 'b', alvoTravado: false });
    a.tick([['j', { t: 'selecionarAlvo', alvo: 'b' }]]);
    a.tick([['j', { t: 'selecionarAlvo', alvo: null }]]);
    expect(a.ent('j')).toMatchObject({ alvoSelecionado: null, alvoTravado: false });
  });
});

describe('troca manual de alvo (D-065)', () => {
  it('percorre os hostis por distância e id, dá a volta e respeita o raio', () => {
    const a = cena();
    a.mover('c', 0);
    const j = a.ent('j');
    const id = (atual: string | null, sentido: 1 | -1, raio = 10) => proximoHostil(a.estado, ctx, j, atual, sentido, raio)?.id ?? null;
    expect(id(null, 1)).toBe('b');
    expect(id('b', 1)).toBe('c');
    expect(id('c', 1)).toBe('b');
    expect(id(null, -1)).toBe('c');
    expect(id('b', -1)).toBe('c');
    expect(id(null, 1, 2)).toBe('b');
    expect(id('b', 1, 2)).toBe('b');
    expect(id(null, 1, 0)).toBeNull();
  });

  it('nunca escolhe a si mesmo, aliado, morto ou invisível', () => {
    const a = cena();
    const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
    a.estado.entidades.push(criarJogador(classe, 'k', 3, 6, ctx.balance));
    a.ent('b').morto = true;
    a.ent('c').invisivelAteTick = 999;
    expect(proximoHostil(a.estado, ctx, a.ent('j'), null, 1, 10)).toBeNull();
  });

  it('o protocolo aceita travar booleano e recusa outro tipo', () => {
    expect(lerComando({ t: 'selecionarAlvo', alvo: 'b' })).toEqual({ t: 'selecionarAlvo', alvo: 'b' });
    expect(lerComando({ t: 'selecionarAlvo', alvo: 'b', travar: false })).toEqual({ t: 'selecionarAlvo', alvo: 'b', travar: false });
    expect(lerComando({ t: 'selecionarAlvo', alvo: 'b', travar: 'sim' })).toBeNull();
    expect(lerComando({ t: 'selecionarAlvo', alvo: 3 })).toBeNull();
  });
});
