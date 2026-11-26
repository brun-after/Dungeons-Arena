// D-206 (26/11/2026): a fusão leva todos os elementos dela. Usar enche o vínculo de cada um; na barra, a tecla se divide
// entre eles; o visual acha uma liga para cada par (fogo e terra: lava; fogo e gelo: vapor ou cristal ígneo).
import { describe, expect, it } from 'vitest';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { criarJogador } from '../../src/entities/fabrica';
import { registrarUsoDaSkill, usoAtual, vinculoDe } from '../../src/progression/vinculo';
import { ligaDe } from '../../src/render/vfx/ligas';
import { RUNAS_VFX } from '../../src/render/vfx/manifestacao-runa';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const ID = 'f__projetil_fogo__chuva_gelo__rr_raio';

describe('os elementos da fusão (D-206)', () => {
  it('a definição guarda os elementos das partes e das runas, na ordem da receita', () => {
    const h = obter(resolverHabilidade(ctx, ID));
    expect(h.elementosFusao).toEqual(['fogo', 'gelo', 'raio']);
    expect(h.elemento).toBe('fogo');
  });

  it('usar a fusão enche o uso de cada elemento dela', () => {
    const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 3, 3, ctx.balance);
    const b = obter(j.bolsa);
    registrarUsoDaSkill(ctx, b, obter(resolverHabilidade(ctx, ID)), 0);
    for (const el of ['fogo', 'gelo', 'raio'] as const) expect(usoAtual(ctx.balance.vinculo, b.vinculoUso?.[el], 0)).toBe(1);
    expect(b.vinculoUso?.veneno).toBeUndefined();
  });

  it('na barra, a tecla da fusão se divide entre os elementos', () => {
    const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 3, 3, ctx.balance);
    const b = obter(j.bolsa);
    b.barra = [ID, null, null, null, null, null];
    const v = vinculoDe(ctx, j, 0);
    const parte = ctx.balance.vinculo.barraPct / 100 / 3;
    for (const el of ['fogo', 'gelo', 'raio'] as const) expect(v[el]).toBeCloseTo(parte, 5);
  });
});

describe('as ligas do visual (D-206)', () => {
  it('cada par dos nove elementos tem uma liga', () => {
    for (const a of RUNAS_VFX) for (const b of RUNAS_VFX) if (a !== b) expect(ligaDe(a, b, a), `${a}+${b}`).not.toBeNull();
  });

  it('fogo e terra viram lava; fogo e gelo, vapor ou cristal ígneo pelo dominante', () => {
    expect(ligaDe('fogo', 'terra', 'fogo')?.nome).toBe('Lava');
    expect(ligaDe('fogo', 'gelo', 'fogo')?.nome).toBe('Vapor');
    expect(ligaDe('gelo', 'fogo', 'gelo')?.nome).toBe('Cristal ígneo');
  });
});
