// Marco 39 (12/11/2026, D-152): a forma desperta dos estilos. Abaixo do limite, nada muda; do limite em diante, o
// modificador entra na chave das skills da etiqueta e o perfil cobra o dano por alvo; skills de outra etiqueta não mudam.
import { describe, expect, it } from 'vitest';
import { formatarChave, lerChave } from '../../src/combat/chave-habilidade';
import { chaveDoAtor, habilidadeDoAtor, perfilPara } from '../../src/combat/perfil';
import { criarJogador } from '../../src/entities/fabrica';
import { formasDespertas, radarDe } from '../../src/progression/estilos';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

describe('forma desperta dos estilos (D-152)', () => {
  it('todo estilo com forma tem modificador conhecido e custo de dano', () => {
    const formas = [...CONTEUDO.estilos.values()].flat().filter((e) => e.forma);
    expect(formas.length).toBeGreaterThanOrEqual(10);
    for (const e of formas) expect(obter(e.forma).danoPct).toBeLessThan(0);
  });

  it('o Mago Artilheiro desperta a área maior nas magias de área, e só nelas', () => {
    const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 2, 2, ctx.balance);
    const b = obter(j.bolsa);
    // Uma skill de área do kit e uma de projétil.
    const area = obter(b.conhecidas.map((c) => c.id).concat(['nova_glacial', 'lanca_de_gelo']).find((id) => habilidadeDoAtor(ctx, j, id)?.politicaImpacto === 'area'));
    expect(formasDespertas(ctx, j)).toEqual([]);
    expect(lerChave(chaveDoAtor(ctx, j, area))?.mods ?? []).not.toContain('maior_e_mais_lenta');
    // Inteligência e Destreza altas enchem o Artilheiro além do limite.
    j.nivel = 60;
    b.atributosBase = { ...b.atributosBase, inteligencia: 100, destreza: 80 };
    j.atributos = { ...b.atributosBase };
    const k = obter(radarDe(ctx, b, j.atributos, j.nivel)).estilos.findIndex((e) => e.id === 'artilheiro');
    expect(obter(radarDe(ctx, b, j.atributos, j.nivel)).total[k]).toBeGreaterThanOrEqual(ctx.balance.estilos.formaPct / 100);
    expect(formasDespertas(ctx, j).some((f) => f.mod === 'maior_e_mais_lenta')).toBe(true);
    const h = obter(habilidadeDoAtor(ctx, j, area));
    expect(lerChave(h.chave)?.mods).toContain('maior_e_mais_lenta');
    const outra = obter(['raio_em_cadeia', 'mente_partida', 'bola_de_fogo', 'lanca_de_gelo'].find((id) => !(habilidadeDoAtor(ctx, j, id)?.tags ?? ['area']).includes('area')));
    const sem = obter(habilidadeDoAtor(ctx, j, outra));
    expect(lerChave(sem.chave)?.mods ?? []).not.toContain('maior_e_mais_lenta');
    // O custo por alvo aparece no perfil da skill transformada.
    const custo = obter([...CONTEUDO.estilos.get('mago') ?? []].find((e) => e.id === 'artilheiro')?.forma).danoPct;
    const partes = obter(lerChave(h.chave));
    const semForma = { ...h, chave: formatarChave({ ...partes, mods: partes.mods.filter((m) => m !== 'maior_e_mais_lenta') }) };
    expect(perfilPara(ctx, j, h).danoPct - perfilPara(ctx, j, semForma).danoPct).toBeCloseTo(custo);
  });
});
