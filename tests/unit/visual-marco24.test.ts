// Marco 24 (25/10/2026): os materiais de partícula por elemento e estado, a cor da fúria e as pausas de impacto.
import { describe, expect, it } from 'vitest';
import { ELEMENTOS } from '../../src/combat/elementos';
import { REGISTRO_EFEITOS } from '../../src/combat/registro-efeitos';
import { ControladorImpacto, RECEITAS } from '../../src/render/impacto';
import { AURA_DO_ESTADO, COR_FRENESI, COR_FURIA_ALTA, COR_FURIA_BAIXA, corDaFuria, corDaVertente, presetDeConjuracao, presetDeImpacto } from '../../src/render/materiais';
import { MATERIAIS, PRESETS_ELEMENTOS } from '../../src/render/presets-elementos';
import { PRESETS_PARTICULA, TEXTURAS_PARTICULA } from '../../src/render/presets-particula';

describe('materiais por elemento (marco 24)', () => {
  it('cada elemento do jogo tem matéria própria de impacto e de conjuração, no catálogo', () => {
    for (const el of ELEMENTOS) {
      expect(PRESETS_PARTICULA[presetDeImpacto(el)].length, el).toBeGreaterThan(0);
      expect(PRESETS_PARTICULA[presetDeConjuracao(el)].length, el).toBeGreaterThan(0);
    }
    expect(presetDeImpacto('sagrado')).toBe('mat_luz');
  });

  it('a matéria não é só cor: cada material usa ao menos uma textura diferente do brilho genérico', () => {
    for (const m of MATERIAIS) {
      const texturas = new Set(PRESETS_ELEMENTOS[`mat_${m}`].map((e) => e.textura));
      expect([...texturas].some((t) => t !== 'brilho' && t !== 'ponto'), m).toBe(true);
    }
    // Fogo sobe em chamas; gelo estala em cristais; raio pisca em arcos.
    expect(PRESETS_ELEMENTOS.mat_fogo.some((e) => e.textura === 'chama' && e.direcao === 'cima')).toBe(true);
    expect(PRESETS_ELEMENTOS.mat_gelo.some((e) => e.textura === 'cristal')).toBe(true);
    expect(PRESETS_ELEMENTOS.mat_raio.some((e) => e.textura === 'arco' && e.vidaMs[1] <= 200)).toBe(true);
  });

  it('as auras dos estados apontam para presets existentes e para estados do registro', () => {
    for (const [estado, preset] of Object.entries(AURA_DO_ESTADO)) {
      expect(estado in REGISTRO_EFEITOS, estado).toBe(true);
      expect(PRESETS_PARTICULA[preset].length, estado).toBeGreaterThan(0);
    }
    for (const estado of ['queimando', 'resfriado', 'congelado', 'eletrizado', 'envenenado'] as const) expect(AURA_DO_ESTADO[estado]).toBeDefined();
  });

  it('todas as texturas usadas existem no atlas', () => {
    const atlas = new Set<string>(TEXTURAS_PARTICULA);
    for (const [nome, lista] of Object.entries(PRESETS_PARTICULA)) for (const e of lista) expect(atlas.has(e.textura), nome).toBe(true);
  });
});

describe('fúria, vertente e impacto (marco 24)', () => {
  it('o rastro da lâmina: cinza até a metade, vermelho depois, laranja no Frenesi', () => {
    expect(corDaFuria(0.2, false)).toBe(COR_FURIA_BAIXA);
    expect(corDaFuria(0.5, false)).toBe(COR_FURIA_ALTA);
    expect(corDaFuria(0, true)).toBe(COR_FRENESI);
  });

  it('a cor da vertente é estável pelo id', () => {
    expect(corDaVertente('druida')).toBe(corDaVertente('druida'));
  });

  it('a pausa do golpe forte e a da ultimate seguram só o desenho, e respeitam o desligado', () => {
    expect(RECEITAS.golpe.congelaMs).toBeGreaterThanOrEqual(40);
    expect(RECEITAS.golpe.congelaMs).toBeLessThanOrEqual(60);
    const ligado = new ControladorImpacto(() => true);
    ligado.pedir('ultimate', 0);
    expect(ligado.quadro(10).congelado).toBe(true);
    expect(ligado.quadro(RECEITAS.ultimate.duracaoMs + 1).congelado).toBe(false);
    const desligado = new ControladorImpacto(() => false);
    desligado.pedir('golpe', 0);
    expect(desligado.quadro(10).congelado).toBe(false);
  });
});
