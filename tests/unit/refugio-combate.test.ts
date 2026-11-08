// O refúgio da vila do Mundo com combate (08/11/2026, D-138): o monstro segue e ataca quem fugiu para dentro lutando;
// sem combate, quem está dentro não fere o monstro de fora (nem por área), e o monstro não entra.
import { describe, expect, it } from 'vitest';
import { alvoOfensivoValido } from '../../src/combat/acao';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { criarEstado } from '../../src/core/estado';
import { ticksDe } from '../../src/core/tempo';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { emCombateCom, podePisarNoRefugio, refugioProtege } from '../../src/world/refugio';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

function cenario() {
  const base = contexto(faseDeTexto(SALA_ABERTA));
  // A vila: o círculo de raio 3 em volta de (3, 3).
  const ctx: ContextoSimulacao = { ...base, fase: { ...base.fase, refugios: [{ x: 3, y: 3, raio: 3 }] } };
  const estado = criarEstado({ semente: 2, faseId: 'teste' });
  estado.tick = 1000;
  const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 4, 4, ctx.balance);
  const m = criarInimigo(obter(CONTEUDO.presets.get('goblin')), 'm', 8, 4, ctx.balance);
  estado.entidades.push(j, m);
  return { ctx, estado, j, m };
}

describe('refúgio e combate', () => {
  it('sem combate: o monstro não ataca nem entra, e quem está dentro não fere o de fora', () => {
    const { ctx, estado, j, m } = cenario();
    expect(emCombateCom(estado, ctx, j, m)).toBe(false);
    expect(alvoOfensivoValido(estado, ctx, m, j)).toBe(false);
    expect(alvoOfensivoValido(estado, ctx, j, m)).toBe(false);
    expect(refugioProtege(estado, ctx, j, m)).toBe(true);
    m.ia = { alvoId: 'j' } as typeof m.ia;
    expect(podePisarNoRefugio(estado, ctx, m, 5, 3)).toBe(false);
    // Fora da vila, a luta segue normal.
    j.x = 9; j.y = 4;
    expect(alvoOfensivoValido(estado, ctx, j, m)).toBe(true);
  });

  it('quem fugiu lutando é seguido e atacado lá dentro, e pode revidar', () => {
    const { ctx, estado, j, m } = cenario();
    // O monstro acertou o jogador há pouco (a participação fica no atingido).
    j.participacao.push({ id: 'm', tick: estado.tick - 20 });
    m.ia = { alvoId: 'j' } as typeof m.ia;
    expect(alvoOfensivoValido(estado, ctx, m, j)).toBe(true);
    expect(alvoOfensivoValido(estado, ctx, j, m)).toBe(true);
    expect(podePisarNoRefugio(estado, ctx, m, 5, 3)).toBe(true);
    // Passada a janela de combate, a vila volta a proteger.
    estado.tick += ticksDe(ctx.balance.mundo.refugio.combateS * 1000) + 1;
    expect(alvoOfensivoValido(estado, ctx, m, j)).toBe(false);
    expect(podePisarNoRefugio(estado, ctx, m, 5, 3)).toBe(false);
  });

  it('o monstro que já entrou sai livre', () => {
    const { ctx, estado, m } = cenario();
    m.px = 4; m.py = 3; m.x = 4; m.y = 3;
    expect(podePisarNoRefugio(estado, ctx, m, 5, 3)).toBe(true);
  });
});
