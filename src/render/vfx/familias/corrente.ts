// Assinaturas de corrente (marco 26, 29/10/2026, D-124). A Corrente é a corrente de verdade: elos de metal que saem da
// mão girando, o gancho crava no alvo com faíscas e um tranco, e a corrente recolhe arrastando o alvo (o deslize do
// evento `deslocado` espera o gancho chegar). A Cadeia sombria é a mesma mecânica com elos espectrais; os Grilhões em
// brasa fecham algemas incandescentes; o Turbilhão gira correntes em volta; o Aríete leva a bola de ferro e volta; o
// Laço do carrasco aperta um laço de elos.

import type { Acerto, CenaVfx, DefAssinatura } from '../cena';
import { clarao, corrente, ondaDeChoque, orbitar, sortear, type PontaCorrente } from '../blocos';
import { brasas, chamaViva, em, faiscasMetal, nevoa, poeira } from '../emissoes';

/** Quanto o puxão espera: o voo da corrente até o alvo. */
export const VOO_CORRENTE_MS = 170;

const COR_FERRO = 0xc8ccd2;

/** O tranco do gancho que crava: faíscas, clarão e um tremor leve. */
function prender(c: CenaVfx, a: Acerto, cor: number, extra?: () => void): () => void {
  return () => {
    const alvo = c.ondeEsta(a.alvoId) ?? a.ate;
    c.particulas.emitirLista([faiscasMetal(c.reduzido ? 6 : 12)], alvo.x, alvo.y, cor);
    clarao(c, alvo, 0xfff2c0, 1.3);
    c.tremor('leve');
    extra?.();
  };
}

function lancarCorrente(c: CenaVfx, a: Acerto, ponta: PontaCorrente, cor: number, brilho?: number, extra?: () => void): void {
  if (a.indice > 0) return;
  const de = () => (a.fonteId ? c.ondeEsta(a.fonteId) : null) ?? a.de;
  corrente(c, {
    de,
    ate: () => c.ondeEsta(a.alvoId) ?? a.ate,
    cor,
    ponta,
    ...(brilho === undefined ? {} : { brilho }),
    vooMs: VOO_CORRENTE_MS,
    aoPrender: prender(c, a, cor, extra),
  });
}

export const CORRENTE = {
  /** A Corrente do Guerreiro: o gancho de ferro que puxa. */
  corrente: {
    familia: 'corrente',
    conjuracao: [faiscasMetal(1, { velocidade: [30, 80], gravidade: 200 })],
    impacto: [em({ textura: 'fumaca3', quantidade: 3, vidaMs: [300, 500], velocidade: [20, 50], escala: [0.3, 0.7], alpha: [0.4, 0], raio: 6, cor: 0xb8a68a })],
    atrasoDeslize: VOO_CORRENTE_MS,
    aoAcertar: (c, a) => { lancarCorrente(c, a, 'gancho', COR_FERRO); },
  },
  /** A Cadeia sombria: elos espectrais roxos que soltam névoa. */
  corrente_sombria: {
    familia: 'corrente',
    conjuracao: [nevoa(1, { escala: [0.3, 0.7], raio: 6 })],
    impacto: [nevoa(4, { raio: 8 })],
    atrasoDeslize: VOO_CORRENTE_MS,
    aoAcertar: (c, a) => { lancarCorrente(c, a, 'gancho', 0x9a78d0, 0x6c3483, () => {
        const alvo = c.ondeEsta(a.alvoId) ?? a.ate;
        c.particulas.emitirLista([nevoa(6, { raio: 10, velocidade: [20, 50] }), em({ textura: 'alma', quantidade: 2, vidaMs: [500, 800], velocidade: [20, 50], direcao: 'cima', gravidade: -40, escala: [0.4, 0.6], alpha: [0.8, 0], aditivo: true, raio: 6, cor: 0xb08ae0 })], alvo.x, alvo.y, 0x6c3483);
      }); },
  },
  /** Grilhões em brasa: a algema incandescente voa, fecha no alvo e a corrente arde. */
  grilhoes: {
    familia: 'corrente',
    conjuracao: [brasas(1, { velocidade: [20, 50] })],
    corpo: [em({ textura: 'algema', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.6, 0.6], alpha: [1, 0.9], cor: 0xffa060 }), chamaViva(1, { vidaMs: [120, 200], escala: [0.5, 0.1], raio: 3 })],
    rastro: [brasas(2, { direcao: 'orientada', velocidade: [-40, -10], gravidade: 0 })],
    impacto: [chamaViva(5), brasas(4)],
    marca: 'queimado',
    aoAcertar: (c, a) => { lancarCorrente(c, a, 'algema', 0xffb070, 0xff5a1a, () => {
        const alvo = c.ondeEsta(a.alvoId) ?? a.ate;
        c.particulas.emitirLista([chamaViva(8, { raio: 6 })], alvo.x, alvo.y, a.cor);
      }); },
  },
  /** Turbilhão de correntes: duas correntes girando em volta de quem gira, com faíscas no chão. */
  turbilhao_de_correntes: {
    familia: 'corrente',
    conjuracao: [faiscasMetal(1, { velocidade: [30, 80] })],
    impacto: [faiscasMetal(6)],
    camera: 'leve',
    naArea: (c, a) => {
      const centro = () => c.ondeEsta(a.atorId) ?? a.origem;
      const r = Math.max(1, a.raio);
      // Cada braço é uma fileira de elos do centro até a bola; dois braços opostos girando juntos.
      orbitar(c, centro, 'elo', COR_FERRO, { n: 2, raio: r, ms: 620, voltas: 2, tamanho: 0.42, rastro: 3 });
      orbitar(c, centro, 'elo_lado', COR_FERRO, { n: 2, raio: r * 0.66, ms: 620, voltas: 2, tamanho: 0.42, rastro: 3 });
      orbitar(c, centro, 'elo', COR_FERRO, { n: 2, raio: r * 0.33, ms: 620, voltas: 2, tamanho: 0.42 });
      orbitar(c, centro, 'bola_ferro', COR_FERRO, { n: 2, raio: r * 1.15, ms: 620, voltas: 2, tamanho: 0.55, rastro: 2 });
      for (const cel of sortear(a.celulas, 5)) c.particulas.emitirLista([faiscasMetal(4)], cel.x, cel.y, a.cor);
      c.particulas.emitirLista([poeira(10, { raio: r * 40 })], a.origem.x, a.origem.y, a.cor);
    },
  },
  /** Aríete acorrentado: a bola de ferro vai na corrente até a ponta, esmaga e volta. */
  ariete: {
    familia: 'corrente',
    conjuracao: [faiscasMetal(1, { velocidade: [30, 80] })],
    impacto: [poeira(6), faiscasMetal(4)],
    camera: 'forte',
    naArea: (c, a) => {
      const ponta = a.celulas.reduce((m, p) => (Math.hypot(p.x - a.origem.x, p.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? p : m), a.mira);
      corrente(c, {
        de: () => c.ondeEsta(a.atorId) ?? a.origem,
        ate: () => ponta,
        cor: COR_FERRO,
        ponta: 'bola_ferro',
        vooMs: 200,
        presoMs: 120,
        recolheMs: 260,
        aoPrender: () => {
          ondaDeChoque(c, ponta, 0xd8c8a8, 1.2, 360);
          c.particulas.emitirLista([poeira(12), faiscasMetal(8), em({ textura: 'rocha', quantidade: 6, vidaMs: [400, 600], velocidade: [100, 200], direcao: 'cima', abertura: 1.2, gravidade: 600, escala: [0.2, 0.12], alpha: [1, 0.6], raio: 6, cor: 0x7a6a5a, giro: [-6, 6] })], ponta.x, ponta.y, a.cor);
          c.marca('rachadura', ponta.x, ponta.y, 0x2a2018, 1.6, 2600);
          c.tremor('forte');
        },
      });
    },
  },
  /** Laço do carrasco: a corrente termina num laço que aperta em volta do alvo. */
  laco: {
    familia: 'corrente',
    conjuracao: [faiscasMetal(1, { velocidade: [30, 80] })],
    impacto: [faiscasMetal(4)],
    atrasoDeslize: VOO_CORRENTE_MS,
    aoAcertar: (c, a) => { lancarCorrente(c, a, 'laco', 0xa8a2a0); },
  },
} satisfies Record<string, DefAssinatura>;
