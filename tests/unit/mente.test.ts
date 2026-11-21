// Marco 49 (21/11/2026, D-195): o psíquico toma a mente. O enfeitiçado vira contra os seus; o iludido acerta a si
// mesmo; o sem visão não tem alvo; o golpe psíquico sorteia um dos cinco estados (com espera por alvo).
import { describe, expect, it } from 'vitest';
import { alvoOfensivoValido, fonteDaHabilidade, iniciarAcao, processarAcoes } from '../../src/combat/acao';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { aplicarImpacto } from '../../src/combat/golpe';
import type { Habilidade } from '../../src/combat/habilidades';
import { ESTADOS_DA_MENTE, semVisao, tomarAMente } from '../../src/combat/mente';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { relacao } from '../../src/modos/relacao';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};

function cena() {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 5, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 3, 3, ctx.balance);
  j.mana = j.manaMax = 500;
  estado.entidades.push(j);
  const inimigo = (id: string, x: number, y: number) => {
    const e = criarInimigo(obter(ctx.conteudo.presets.get('goblin')), id, x, y, ctx.balance);
    e.hp = e.hpMax = 5000;
    e.autoAtaque = false;
    estado.entidades.push(e);
    return e;
  };
  return { ctx, estado, j, inimigo, saida: [] as EventoSimulacao[] };
}

const origem = { id: 'j', x: 3, y: 3 };

describe('a mente tomada (D-195)', () => {
  it('o enfeitiçado vira contra os seus e deixa de ver o jogador como inimigo', () => {
    const c = cena();
    const a = c.inimigo('a', 6, 3);
    const b = c.inimigo('b', 7, 3);
    expect(relacao(a, b, c.ctx.modo)).toBe('aliado');
    aplicarEfeito(c.estado, c.ctx, a, construirEfeito('enfeiticado', { duracaoMs: 2000 }), origem, null, c.saida);
    expect(relacao(a, b, c.ctx.modo)).toBe('hostil');
    expect(relacao(b, a, c.ctx.modo)).toBe('hostil');
    expect(relacao(a, c.j, c.ctx.modo)).toBe('neutro');
    expect(alvoOfensivoValido(c.estado, c.ctx, a, b)).toBe(true);
    expect(alvoOfensivoValido(c.estado, c.ctx, a, c.j)).toBe(false);
  });

  it('sem visão, ninguém é alvo', () => {
    const c = cena();
    const a = c.inimigo('a', 6, 3);
    expect(alvoOfensivoValido(c.estado, c.ctx, c.j, a)).toBe(true);
    aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('sem_visao', { duracaoMs: 2000 }), { id: 'a', x: 6, y: 3 }, null, c.saida);
    expect(semVisao(c.j, c.estado.tick)).toBe(true);
    expect(alvoOfensivoValido(c.estado, c.ctx, c.j, a)).toBe(false);
  });

  it('o iludido acerta a si mesmo com a skill ofensiva', () => {
    const c = cena();
    const a = c.inimigo('a', 5, 3);
    aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('iludido', { duracaoMs: 3000 }), { id: 'a', x: 5, y: 3 }, null, c.saida);
    const hp = c.j.hp;
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'projetil_fogo', a.id, c.saida)).toBe(true);
    for (let t = 0; t < 120 && c.j.acao; t++) {
      c.estado.tick++;
      processarAcoes(c.estado, c.ctx, c.saida);
    }
    expect(c.saida.some((e) => e.t === 'impacto' && e.alvoId === 'j' && e.fonteId === 'j')).toBe(true);
    expect(c.j.hp).toBeLessThan(hp);
    expect(a.hp).toBe(a.hpMax);
  });

  it('o golpe psíquico que fere sorteia um dos cinco estados e espera antes de repetir', () => {
    const c = cena();
    const ctx = { ...c.ctx, balance: { ...c.ctx.balance, elementosFerem: { ...c.ctx.balance.elementosFerem, mente: { ...c.ctx.balance.elementosFerem.mente, chancePct: 100 } } } };
    const a = c.inimigo('a', 5, 3);
    const primeiro = tomarAMente(c.estado, ctx, a, origem, false, c.saida);
    expect(primeiro && ESTADOS_DA_MENTE.includes(primeiro)).toBe(true);
    expect(a.efeitos.some((f) => f.tipo === primeiro)).toBe(true);
    expect(tomarAMente(c.estado, ctx, a, origem, false, c.saida)).toBeNull();
    // Muitos alvos: os cinco estados saem.
    const vistos = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const e = c.inimigo(`m${String(i)}`, 8, 8);
      const t = tomarAMente(c.estado, ctx, e, origem, false, c.saida);
      if (t) vistos.add(t);
    }
    expect(vistos.size).toBe(ESTADOS_DA_MENTE.length);
  });

  it('o golpe psíquico pelo impacto pode tomar a mente; o de outro elemento, não', () => {
    const c = cena();
    const ctx = { ...c.ctx, balance: { ...c.ctx.balance, elementosFerem: { ...c.ctx.balance.elementosFerem, mente: { ...c.ctx.balance.elementosFerem.mente, chancePct: 100 } } } };
    const base = obter(CONTEUDO.habilidades.get('raio_em_cadeia'));
    const golpe = (elemento: Habilidade['elemento']): Habilidade => ({ ...base, elemento, efeitos: [] });
    const a = c.inimigo('a', 5, 3);
    const b = c.inimigo('b', 6, 6);
    for (const [alvo, el] of [[a, 'psiquico'], [b, 'fogo']] as const) {
      const hab = golpe(el);
      aplicarImpacto(c.estado, ctx, alvo, { acaoId: 1, fonte: { ...fonteDaHabilidade(c.j, ctx, c.estado.tick, hab), d20Minimo: 20 }, hab, indice: 0 }, c.saida);
    }
    expect(a.efeitos.some((f) => (ESTADOS_DA_MENTE as readonly string[]).includes(f.tipo))).toBe(true);
    expect(b.efeitos.some((f) => (ESTADOS_DA_MENTE as readonly string[]).includes(f.tipo))).toBe(false);
  });
});
