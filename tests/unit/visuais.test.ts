// Marco 11A (16/10/2026, D-066): a aparência das habilidades — todo preset que uma habilidade (oficial ou de elemento)
// pede existe no sistema de partículas, toda emissão usa uma textura do atlas, e os golpes, arcanas, gelo, veneno,
// sombra, sangue, cura, vento e raio têm cada um a sua fantasia (não mais tudo faísca).

import { describe, expect, it } from 'vitest';
import { PRESETS_VISUAIS } from '../../src/combat/habilidades';
import { PRESETS_PARTICULA, TEXTURAS_PARTICULA } from '../../src/render/presets-particula';
import { visualDe } from '../../src/render/visual-habilidade';
import { CONTEUDO } from '../apoio/fases';

describe('presets visuais', () => {
  it('todo preset das habilidades existe e toda emissão usa textura do atlas', () => {
    for (const nome of PRESETS_VISUAIS) expect(PRESETS_PARTICULA[nome].length).toBeGreaterThan(0);
    for (const emissoes of Object.values(PRESETS_PARTICULA)) {
      for (const e of emissoes) {
        expect(TEXTURAS_PARTICULA).toContain(e.textura);
        expect(e.vidaMs[0]).toBeLessThanOrEqual(e.vidaMs[1]);
        expect(e.quantidade).toBeGreaterThan(0);
      }
    }
  });

  it('cada fantasia tem o seu visual', () => {
    const impacto = (id: string) => {
      const h = CONTEUDO.habilidades.get(id);
      return h ? visualDe(h).impacto : undefined;
    };
    expect(impacto('golpe')).toBe('corte');
    expect(impacto('seta_arcana')).toBe('runas');
    expect(impacto('lanca_de_gelo')).toBe('cristais');
    expect(impacto('flecha_venenosa')).toBe('bolhas');
    expect(impacto('troca_sombria')).toBe('sombra');
    expect(impacto('raio_vampirico')).toBe('sangue');
    expect(impacto('curar')).toBe('sagrado');
    expect(impacto('redemoinho')).toBe('vento');
    expect(impacto('raio')).toBe('relampago');
    const usados = new Set([...CONTEUDO.habilidades.values()].map((h) => visualDe(h).impacto));
    expect(usados.size).toBeGreaterThanOrEqual(10);
  });
});
