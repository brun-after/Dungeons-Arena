// O vento como elemento (marco 42, 15/11/2026, D-176). Cada forma conta o que o ar faz: a lâmina de ar que corta e
// gira no voo; a lufada que cai do alto e esparrama a poeira; a corrente que corre em linha arrastando folhas; o
// vendaval que sai em anel de quem está no meio; o tapa de ar de perto; a rajada em leque (a que apaga as tochas); e o
// manto de vento girando em volta do corpo. Folhas, poeira e riscos de ar claros; nada de brilho chapado.

import type { DefAssinatura } from '../cena';
import { arcoDeGolpe, ondaDeChoque, orbitar, PX, sortear, tween } from '../blocos';
import { em, poeira } from '../emissoes';
import { sai } from '../pincel';
import type { Emissao } from '../../presets-particula';

const COR_AR = 0xe4f2fa;
const RISCOS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'corte', quantidade: n, vidaMs: [260, 420], velocidade: [90, 180], direcao: 'livre', escala: [0.6, 0.25], alpha: [0.75, 0], aditivo: true, raio: 10, cor: COR_AR, ...o });
const FOLHAS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'folha', quantidade: n, vidaMs: [700, 1100], velocidade: [60, 150], direcao: 'livre', gravidade: 30, arrasto: 1.2, escala: [0.3, 0.22], alpha: [1, 0], raio: 8, cores: [0x8ab060, 0xc0a050, 0x6a8a40], giro: [-6, 6], turbulencia: 30, ...o });
const PO = (n: number, o: Partial<Emissao> = {}) => poeira(n, { cor: 0xcfc2a8, ...o });

/** O ângulo na tela de `de` para `para` (a lâmina e os riscos seguem o sopro). */
function angulo(c: Parameters<NonNullable<DefAssinatura['naArea']>>[0], de: { x: number; y: number }, para: { x: number; y: number }): number {
  const a = c.tela(de);
  const b = c.tela(para);
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export const VENTO_VFX = {
  /** Lâmina de ar: a meia-lua de vento gira no voo e se desfaz em riscos e folhas no alvo. */
  lamina_de_ar: {
    familia: 'vento',
    conjuracao: [RISCOS(3, { raio: 8, direcao: 'cima' })],
    corpo: [em({ textura: 'arco_golpe', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.7, 0.7], alpha: [0.85, 0.75], aditivo: true, cor: COR_AR, giro: [14, 18] })],
    rastro: [RISCOS(1, { raio: 3, velocidade: [-40, -10], direcao: 'orientada' })],
    impacto: [RISCOS(6), FOLHAS(3)],
  },
  /** Lufada: o ar cai do alto sobre a área, achata a poeira em anel e levanta folhas pelas bordas. */
  lufada: {
    familia: 'vento',
    conjuracao: [RISCOS(2, { direcao: 'cima' })],
    impacto: [RISCOS(3, { direcao: 'baixo' }), PO(3)],
    camera: 'leve',
    naArea: (c, a) => {
      const r = Math.max(1, a.raio);
      for (const cel of sortear(a.celulas, c.reduzido ? 3 : 6)) c.particulas.emitirLista([RISCOS(4, { direcao: 'baixo', alturaInicial: 70, raio: 6 })], cel.x, cel.y, a.cor);
      ondaDeChoque(c, a.mira, COR_AR, r + 0.3, 420, 'choque', true);
      c.particulas.emitirLista([PO(14, { forma: 'anel', raio: r * PX * 0.5, direcao: 'fora', velocidade: [80, 160] }), FOLHAS(6, { forma: 'anel', raio: r * PX * 0.7, direcao: 'cima' })], a.mira.x, a.mira.y, a.cor);
    },
  },
  /** Corrente de ar: o sopro corre em linha, os riscos seguem o rumo e as folhas são arrastadas até a ponta. */
  corrente_de_ar: {
    familia: 'vento',
    conjuracao: [RISCOS(3, { raio: 6 })],
    impacto: [RISCOS(3), FOLHAS(2)],
    naArea: (c, a) => {
      const ponta = a.celulas.reduce((m, p) => (Math.hypot(p.x - a.origem.x, p.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? p : m), a.mira);
      const rot = angulo(c, a.origem, ponta);
      for (let i = 0; i < (c.reduzido ? 3 : 5); i++) {
        tween(c, { textura: 'corte', de: a.origem, para: ponta, s: [0.5, 0.9], a: [0.8, 0], rot: [rot, rot], cor: COR_AR, aditivo: true, ms: 260 + i * 40, curva: sai, atrasoMs: i * 50 });
      }
      c.particulas.emitirLista([FOLHAS(8, { direcao: 'orientada', velocidade: [140, 240] }), PO(6, { direcao: 'orientada', raio: 4 })], a.origem.x, a.origem.y, a.cor, ponta);
    },
  },
  /** Vendaval: o anel de vento sai de quem está no meio, empurrando poeira e folhas para fora. */
  vendaval: {
    familia: 'vento',
    conjuracao: [RISCOS(3, { forma: 'anel', raio: 10, direcao: 'fora', velocidade: [-120, -60] })],
    impacto: [RISCOS(4), FOLHAS(2)],
    camera: 'leve',
    naArea: (c, a) => {
      const r = Math.max(1, a.raio);
      ondaDeChoque(c, a.origem, COR_AR, r + 0.4, 460, 'choque', true);
      ondaDeChoque(c, a.origem, 0xffffff, r * 0.6, 340, 'choque', false);
      c.particulas.emitirLista([RISCOS(16, { forma: 'anel', raio: r * PX * 0.3, direcao: 'fora', velocidade: [160, 260] }), FOLHAS(8, { forma: 'anel', raio: r * PX * 0.4, direcao: 'fora' }), PO(10, { forma: 'anel', raio: r * PX * 0.5, direcao: 'fora' })], a.origem.x, a.origem.y, a.cor);
    },
  },
  /** Tapa de ar: um golpe de vento curto, o arco do sopro e a poeira que voa do alvo. */
  tapa_de_ar: {
    familia: 'vento',
    impacto: [RISCOS(5, { direcao: 'orientada' }), PO(4)],
    naArea: (c, a) => {
      arcoDeGolpe(c, a.origem, a.mira, COR_AR, 1.1, 1, 200, 'corte');
      c.particulas.emitirLista([RISCOS(8, { direcao: 'orientada', raio: 4 }), FOLHAS(3, { direcao: 'orientada' })], a.origem.x, a.origem.y, a.cor, a.mira);
    },
  },
  /** Rajada: o leque de vento que sai da boca de quem sopra; as folhas e a poeira voam pelo cone (apaga a tocha). */
  rajada: {
    familia: 'vento',
    conjuracao: [RISCOS(4, { forma: 'anel', raio: 12, direcao: 'fora', velocidade: [-120, -60] })],
    impacto: [RISCOS(4, { direcao: 'orientada' }), FOLHAS(2)],
    camera: 'leve',
    naArea: (c, a) => {
      const alvos = sortear(a.celulas, c.reduzido ? 4 : 8);
      alvos.forEach((cel, i) => {
        const rot = angulo(c, a.origem, cel);
        tween(c, { textura: 'corte', de: a.origem, para: cel, s: [0.4, 1], a: [0.85, 0], rot: [rot, rot], cor: COR_AR, aditivo: true, ms: 300, curva: sai, atrasoMs: i * 25 });
      });
      const longe = a.celulas.reduce((m, p) => (Math.hypot(p.x - a.origem.x, p.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? p : m), a.mira);
      c.particulas.emitirLista([FOLHAS(10, { direcao: 'orientada', abertura: 0.9, velocidade: [120, 220] }), PO(8, { direcao: 'orientada', abertura: 0.9 })], a.origem.x, a.origem.y, a.cor, longe);
    },
  },
  /** Manto de vento: o ar gira em volta do corpo (três riscos em órbita) e leva folhas junto. */
  manto_de_vento: {
    familia: 'vento',
    impacto: [RISCOS(3)],
    emSi: (c, a) => {
      orbitar(c, () => c.ondeEsta(a.id) ?? a.pos, 'corte', COR_AR, { n: 3, raio: 0.7, ms: 900, voltas: 2.2, tamanho: 0.8, aditivo: true });
      c.particulas.emitirLista([FOLHAS(6, { forma: 'espiral', raio: 20, gravidade: -40 })], a.pos.x, a.pos.y, a.cor);
    },
  },
} satisfies Record<string, DefAssinatura>;
