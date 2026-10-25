// Marco 24 (25/10/2026, D-098): o golpe de cada arma — a natureza pela arma, as poses distintas, o giro e os rastros.
import { describe, expect, it } from 'vitest';
import { criarEntidade } from '../../src/core/estado';
import { GOLPES_DE_ARMA } from '../../src/progression/armas';
import { DURACAO_GOLPE, pose, type EntradaPose, type Golpe } from '../../src/render/caminhada';
import { golpeDaAcao, golpeDaArmaNaMao } from '../../src/render/golpe-visual';
import { RECEITAS } from '../../src/render/impacto';
import { PRESETS_ARMAS } from '../../src/render/presets-armas';
import { PRESETS_PARTICULA, TEXTURAS_PARTICULA } from '../../src/render/presets-particula';
import { contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
const BASE: EntradaPose = { estilo: 'passada', tMs: 0, andando: false, ataqueMs: null, fase: 0, tiras: false, reduzido: false };

const comArma = (arma: string | null) => {
  const e = criarEntidade({ id: 'j', tipo: 'jogador', x: 3, y: 3 });
  e.aparencia = { arma, secundaria: null, cabeca: null, corpo: null, capa: null, formaArma: null, elementoArma: null, formaMaxima: null };
  return e;
};

describe('a natureza do golpe pela arma (marco 24)', () => {
  it('cada base de arma tem um golpe conhecido; espada corta, machado corta pesado, clava esmaga, lança estoca', () => {
    const golpes = ctx.conteudo.armas.golpes;
    for (const g of golpes.values()) expect(GOLPES_DE_ARMA).toContain(g);
    expect(golpes.get('espada')).toBe('corte');
    expect(golpes.get('machado')).toBe('corte_pesado');
    expect(golpes.get('clava')).toBe('contundente');
    expect(golpes.get('lanca')).toBe('estocada');
    expect(golpes.get('adaga')).toBe('estocada_rapida');
  });

  it('sem arma na mão, vale a arma da classe do modelo; criatura sem arma de classe não tem golpe', () => {
    const vazio = criarEntidade({ id: 'j', tipo: 'jogador', x: 3, y: 3 });
    expect(golpeDaArmaNaMao(ctx, vazio, 'guerreiro')).toBe('corte_pesado');
    expect(golpeDaArmaNaMao(ctx, vazio, 'goblin')).toBeNull();
    expect(golpeDaArmaNaMao(ctx, comArma('espada'), 'guerreiro')).toBe('corte');
  });

  it('o básico de perto anima o golpe da arma; o Redemoinho gira; magia não é golpe de arma', () => {
    expect(golpeDaAcao(ctx, comArma('clava'), 'ataque_basico', 'guerreiro')).toBe('contundente');
    expect(golpeDaAcao(ctx, comArma('espada'), 'redemoinho', 'guerreiro')).toBe('giro');
    expect(golpeDaAcao(ctx, comArma('cajado'), 'dardo_arcano', 'mago')).toBeNull();
    expect(golpeDaAcao(ctx, comArma('espada'), 'nao_existe', 'guerreiro')).toBeNull();
  });
});

describe('as poses dos golpes (marco 24)', () => {
  const amostra = (golpe: Golpe, t: number) => pose({ ...BASE, golpe, ataqueMs: t * DURACAO_GOLPE[golpe] });

  it('a preparação na conjuração ergue a arma; o golpe a leva para a frente', () => {
    const preparo = pose({ ...BASE, golpe: 'corte_pesado', preparo: 1 });
    expect(preparo.arma?.rotacao).toBeLessThan(-1);
    expect(amostra('corte_pesado', 0.3).arma?.rotacao).toBeGreaterThan(1);
  });

  it('cada golpe tem um desenho próprio no meio do movimento', () => {
    const assinaturas = new Set<string>();
    for (const g of Object.keys(DURACAO_GOLPE) as Golpe[]) {
      const p = amostra(g, 0.25);
      assinaturas.add([p.arma?.rotacao.toFixed(2), p.arma?.dx.toFixed(2), p.empurrao.toFixed(2), (p.giro ?? 0).toFixed(2)].join('|'));
    }
    expect(assinaturas.size).toBe(Object.keys(DURACAO_GOLPE).length);
  });

  it('a estocada leva a ponta para longe; o esmagar achata o corpo no impacto', () => {
    expect(amostra('estocada', 0.3).arma?.dx).toBeGreaterThan(0.2);
    expect(amostra('contundente', 0.28).escalaY).toBeLessThan(0.95);
  });

  it('o giro dá duas voltas inteiras (termina de frente) com a arma estendida como contrapeso', () => {
    const meio = amostra('giro', 0.5);
    expect(meio.arma?.rotacao).toBeGreaterThan(1.4);
    const fim = amostra('giro', 1);
    expect(fim.giro).toBeCloseTo(4 * Math.PI, 5);
    expect(Math.cos(fim.giro ?? 0)).toBeCloseTo(1, 5);
  });

  it('sem golpe, segue o empurrão genérico; com movimento reduzido, nada se mexe', () => {
    expect(pose({ ...BASE, ataqueMs: 100 }).arma).toBeUndefined();
    expect(pose({ ...BASE, reduzido: true, golpe: 'giro', ataqueMs: 100 }).giro).toBeUndefined();
  });
});

describe('os rastros das armas (marco 24)', () => {
  it('os presets das armas estão no catálogo e usam texturas do atlas', () => {
    const atlas = new Set<string>(TEXTURAS_PARTICULA);
    for (const nome of Object.keys(PRESETS_ARMAS) as (keyof typeof PRESETS_ARMAS)[]) {
      expect(PRESETS_PARTICULA[nome].length, nome).toBeGreaterThan(0);
      for (const e of PRESETS_PARTICULA[nome]) expect(atlas.has(e.textura), nome).toBe(true);
    }
  });

  it('o corte sai orientado (a lâmina aponta para o alvo), e o giro solta vento em espiral', () => {
    expect(PRESETS_ARMAS.golpe_corte.some((e) => e.textura === 'corte' && e.direcao === 'orientada')).toBe(true);
    expect(PRESETS_ARMAS.vento_giro.every((e) => e.forma === 'espiral')).toBe(true);
  });

  it('o básico do Guerreiro tem uma pausa leve, mais curta que a do golpe pesado', () => {
    expect(RECEITAS.golpe_leve.congelaMs).toBeGreaterThan(0);
    expect(RECEITAS.golpe_leve.congelaMs).toBeLessThan(RECEITAS.golpe.congelaMs);
  });
});
