import { describe, expect, it } from 'vitest';
import { somDaHabilidade, sonsDoEvento } from '../../src/audio/mapeamento';
import { ELEMENTOS } from '../../src/combat/elementos';
import { CONTEUDO } from '../apoio/fases';
import { compor } from '../../src/audio/composicao';

const original = CONTEUDO.habilidades.get('golpe');
if (!original) throw new Error('golpe ausente');
const base = original;
const impacto = { t: 'impacto', tick: 0, acaoId: 1, fonteId: 'j', alvoId: 'g', habilidadeId: 'golpe', chave: 'golpe', dano: 5, cura: 0, d20: 15, mult: 1, falha: false, critico: false, imune: false, indice: 0, sinergias: [] as string[] } as const;

describe('identidade sonora do combate', () => {
  it.each(ELEMENTOS)('%s sobrepõe o antigo som genérico do conteúdo e permanece no crítico', (elemento) => {
    const h = { ...base, elemento, visual: base.visual ? { ...base.visual, som: 'magia' } : null };
    expect(somDaHabilidade(h)).toBe(elemento);
    const buscar = () => ({ ...base, elemento });
    expect(sonsDoEvento({ ...impacto, critico: true }, 'j', buscar)).toEqual([
      { som: elemento, origemId: 'g' }, { som: 'critico', origemId: 'g' },
    ]);
    expect(sonsDoEvento({ t: 'projetilLancado', tick: 0, projetilId: 1, acaoId: 1, donoId: 'j', habilidadeId: 'golpe', chave: 'golpe' }, 'j', buscar)[0]?.som).toBe(elemento);
    expect(sonsDoEvento({ ...impacto, falha: true }, 'j', buscar)[0]?.som).toBe('falha');
    expect(sonsDoEvento({ ...impacto, imune: true }, 'j', buscar)).toEqual([]);
  });
  it('distingue aço, impacto pesado e arco', () => {
    for (const [id, som] of [['espada', 'lamina'], ['martelo', 'contundente'], ['arco', 'arco']] as const) {
      expect(somDaHabilidade({ ...base, id, elemento: null })).toBe(som);
    }
  });
  it('as trilhas usam frases espaçadas e mantêm a tônica entre variantes', () => {
    for (const clima of ['exploracao', 'combate', 'chefe'] as const) {
      const a = compor('fase-01', clima);
      const b = compor('fase-01', clima, 2, 1);
      expect(a.passos[0]?.baixo).toBe(b.passos[0]?.baixo);
      expect(a.passos.every((p, i) => p.melodia === null || i % 4 === 0)).toBe(true);
      expect(a.timbres.melodia).not.toBe('square');
    }
  });
});
