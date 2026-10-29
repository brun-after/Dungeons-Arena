// Assinaturas de trevas e necromancia (marco 26, 29/10/2026, D-124). Crânio etéreo que voa com rastro de névoa, mãos de
// osso que brotam do chão, a foice espectral que arranca almas, o sudário de fumaça, o corpo que estoura em ossos, o
// círculo de onde os mortos levantam, os fios de vida verdes e os olhos que acendem nos servos.

import type { DefAssinatura } from '../cena';
import { arcoDeGolpe, brotar, circuloNoChao, clarao, ondaDeChoque, orbitar, PX, sortear, tremido, tween } from '../blocos';
import { em, fumacaEscura, nevoa } from '../emissoes';
import { sai } from '../pincel';
import type { Emissao } from '../../presets-particula';

const SOMBRA = (n: number, o: Partial<Emissao> = {}) => nevoa(n, { cor: 0x3a1a5a, raio: 10, ...o });
const ALMAS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'alma', quantidade: n, vidaMs: [600, 1000], velocidade: [30, 70], direcao: 'cima', abertura: 0.5, gravidade: -50, escala: [0.35, 0.55], alpha: [0.9, 0], curvaAlpha: 'entra', aditivo: true, raio: 8, cor: null, turbulencia: 20, ...o });
const OSSOS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'osso', quantidade: n, vidaMs: [450, 750], velocidade: [100, 220], direcao: 'cima', abertura: 1.1, gravidade: 600, escala: [0.3, 0.25], alpha: [1, 0.6], raio: 6, cor: 0xece4d0, giro: [-10, 10], ...o });
const SANGUE = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'gota_viva', quantidade: n, vidaMs: [300, 500], velocidade: [80, 180], direcao: 'cima', abertura: 1.2, gravidade: 600, escala: [0.22, 0.14], alpha: [1, 0.3], raio: 4, cores: [0xd83040, 0x7a1020], esticar: 0.2, ...o });
const CONJURA_TREVAS = [SOMBRA(1, { raio: 8, escala: [0.3, 0.8] }), em({ textura: 'runa1', quantidade: 1, vidaMs: [400, 600], velocidade: [10, 20], direcao: 'cima', escala: [0.3, 0.4], alpha: [0.8, 0], aditivo: true, raio: 12, cor: null })];

export const TREVAS = {
  /** Toque e Dardo funesto: o crânio etéreo voa com rastro de névoa e estoura em almas. */
  cranio: {
    familia: 'trevas',
    conjuracao: CONJURA_TREVAS,
    corpo: [em({ textura: 'cranio', quantidade: 1, vidaMs: [40, 50], escala: [0.55, 0.55], alpha: [1, 0.9], aditivo: true, cor: null }), em({ textura: 'brasa', quantidade: 1, vidaMs: [60, 80], escala: [1, 0.8], alpha: [0.5, 0.3], aditivo: true, cor: null })],
    rastro: [SOMBRA(1, { raio: 3, escala: [0.25, 0.7], vidaMs: [400, 600] }), em({ textura: 'alma', quantidade: 1, vidaMs: [260, 400], velocidade: [-30, -10], direcao: 'orientada', escala: [0.3, 0.15], alpha: [0.6, 0], aditivo: true, raio: 2, cor: null })],
    impacto: [ALMAS(3), SOMBRA(3)],
    aoAcertar: (c, a) => {
      if (a.indice === 0) tween(c, { textura: 'cranio', de: a.ate, s: [0.6, 1.4], a: [0.9, 0], cor: a.cor, aditivo: true, ms: 320, subir: -20, curva: sai });
    },
  },
  /** Garras do ossuário: mãos de osso brotam do chão pela área e agarram. */
  garras_do_ossuario: {
    familia: 'trevas',
    conjuracao: CONJURA_TREVAS,
    impacto: [OSSOS(3), SOMBRA(2)],
    naArea: (c, a) => {
      sortear(a.celulas, c.reduzido ? 4 : 7).forEach((cel, i) => {
        const p = tremido(cel, 0.3);
        brotar(c, p, 'mao_ossea', 0xece4d0, 1.3, 900, false, i * 60);
        c.marca('rachadura', p.x, p.y, 0x1a1020, 0.9, 2000);
        c.particulas.emitirLista([SOMBRA(2, { raio: 6 })], p.x, p.y, a.cor);
      });
    },
  },
  /** Ceifa de almas: a foice espectral varre o cone e arranca almas que sobem. */
  ceifa_de_almas: {
    familia: 'trevas',
    conjuracao: CONJURA_TREVAS,
    impacto: [ALMAS(3, { velocidade: [60, 110] })],
    naArea: (c, a) => {
      const meio = { x: (a.origem.x * 2 + a.mira.x) / 3, y: (a.origem.y * 2 + a.mira.y) / 3 };
      arcoDeGolpe(c, a.origem, meio, a.cor, 2.4 * a.escala, 1, 320);
      arcoDeGolpe(c, a.origem, meio, 0xd8c8ff, 1.8 * a.escala, 1, 260);
      for (const cel of sortear(a.celulas, 4)) c.particulas.emitirLista([ALMAS(2), SOMBRA(1)], cel.x, cel.y, a.cor);
    },
  },
  /** Mortalha fúnebre: o sudário de fumaça escura que envolve e gira devagar. */
  mortalha: {
    familia: 'trevas',
    conjuracao: CONJURA_TREVAS,
    impacto: [SOMBRA(3)],
    emSi: (c, a) => {
      orbitar(c, () => c.ondeEsta(a.id) ?? a.pos, 'fumaca2', 0x2a1440, { n: 6, raio: 0.7, ms: 1000, voltas: 0.8, tamanho: 1.4, tangente: false });
      c.particulas.emitirLista([SOMBRA(10, { forma: 'espiral', raio: 30, velocidade: [20, 50] }), ALMAS(2)], a.pos.x, a.pos.y, a.cor);
    },
    naArea: (c, a) => {
      orbitar(c, () => c.ondeEsta(a.atorId) ?? a.origem, 'fumaca2', 0x2a1440, { n: 8, raio: Math.max(1, a.raio), ms: 1000, voltas: 0.6, tamanho: 1.8, tangente: false });
      c.particulas.emitirLista([SOMBRA(14, { forma: 'anel', raio: Math.max(1, a.raio) * PX })], a.origem.x, a.origem.y, a.cor);
    },
  },
  /** Explosão cadavérica: o corpo estoura em ossos, sangue escuro e gosma. */
  explosao_cadaverica: {
    familia: 'trevas',
    conjuracao: CONJURA_TREVAS,
    impacto: [OSSOS(8, { velocidade: [140, 260] }), SANGUE(8), SOMBRA(3)],
    marca: 'poca_sangue',
    camera: 'leve',
    aoAcertar: (c, a) => {
      if (a.indice > 0) return;
      ondaDeChoque(c, a.ate, 0x9a6ad0, 1.4, 380);
      tween(c, { textura: 'brasa', de: a.ate, s: [0.8, 3], a: [0.9, 0], cor: 0x7d3c98, aditivo: true, ms: 280, curva: sai });
    },
  },
  /** Levante profano: o círculo rúnico no chão e os mortos emergindo (mãos e almas). */
  levante_profano: {
    familia: 'trevas',
    conjuracao: CONJURA_TREVAS,
    impacto: [ALMAS(3)],
    emSi: (c, a) => {
      circuloNoChao(c, () => a.pos, 'circulo_runico', a.cor, 3.2, 1100, 0.6);
      for (let i = 0; i < 4; i++) brotar(c, tremido(a.pos, 1.6), 'mao_ossea', 0xece4d0, 1.1, 900, false, 120 + i * 90);
      c.particulas.emitirLista([ALMAS(6, { raio: 30 }), SOMBRA(6, { raio: 30 })], a.pos.x, a.pos.y, a.cor);
    },
  },
  /** Dízimo vital: fios de vida verdes saem dos servos e correm até o necromante. */
  fios_de_vida: {
    familia: 'trevas',
    conjuracao: [em({ textura: 'brasa', quantidade: 1, vidaMs: [300, 500], velocidade: [10, 30], direcao: 'cima', escala: [0.3, 0.1], alpha: [0.9, 0], aditivo: true, raio: 10, cor: 0x7ee0bb })],
    impacto: [em({ textura: 'cintilar', quantidade: 4, vidaMs: [400, 600], velocidade: [20, 50], direcao: 'cima', escala: [0.1, 0.4], curvaEscala: 'pulso', alpha: [1, 0], aditivo: true, raio: 10, cor: 0x7ee0bb })],
    emSi: (c, a) => {
      // Os fios: brasas verdes que voam de pontos em volta até o corpo (a vida voltando).
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const de = { x: a.pos.x + Math.cos(ang) * 2.2, y: a.pos.y + Math.sin(ang) * 2.2 };
        tween(c, { textura: 'brasa', de, para: a.pos, s: [0.8, 0.4], a: [0.2, 1], cor: 0x7ee0bb, aditivo: true, ms: 420, atrasoMs: i * 50, curva: (t) => t * t });
        c.particulas.emitirLista([em({ textura: 'brasa', quantidade: 4, vidaMs: [300, 400], escala: [0.3, 0.05], alpha: [0.8, 0], aditivo: true, raio: 2, cor: 0x7ee0bb })], de.x, de.y, a.cor, a.pos);
      }
      clarao(c, a.pos, 0x7ee0bb, 1.6);
    },
  },
  /** Comando sepulcral: os olhos acendem sobre os servos e um pulso sai do necromante. */
  comando_sepulcral: {
    familia: 'trevas',
    conjuracao: CONJURA_TREVAS,
    impacto: [em({ textura: 'olho', quantidade: 1, vidaMs: [600, 800], velocidade: [10, 20], direcao: 'cima', escala: [0.5, 0.7], alpha: [1, 0], aditivo: true, raio: 0, cor: null, alturaInicial: 26 })],
    emSi: (c, a) => {
      tween(c, { textura: 'olho', de: a.pos, s: [0.4, 1.4], a: [1, 0], cor: a.cor, aditivo: true, ms: 600, subir: -30, curva: sai });
      ondaDeChoque(c, a.pos, a.cor, 3, 520);
    },
  },
  /** O golpe sombrio (golpe demoníaco, punhal das sombras): o corte de sombra com névoa. */
  golpe_sombrio: {
    familia: 'trevas',
    impacto: [SOMBRA(3), em({ textura: 'faisca', quantidade: 4, vidaMs: [200, 300], velocidade: [80, 160], escala: [0.4, 0.1], alpha: [1, 0], aditivo: true, raio: 3, cor: null, esticar: 0.4 })],
    aoAcertar: (c, a) => {
      arcoDeGolpe(c, a.de, a.ate, a.cor, 1.2 * a.escala, 1, 200);
      arcoDeGolpe(c, a.de, a.ate, 0x2a0a3a, 1.4 * a.escala, -1, 260);
    },
  },
  /** Raio vampírico: o feixe de sangue que vai ao alvo e as gotas que voltam para quem lança. */
  raio_vampirico: {
    familia: 'trevas',
    conjuracao: [SANGUE(1, { velocidade: [10, 30], gravidade: 100 })],
    corpo: [em({ textura: 'gota_viva', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.6, 0.6], alpha: [1, 0.9], cores: [0xd83040] }), em({ textura: 'brasa', quantidade: 1, vidaMs: [60, 80], escala: [0.9, 0.7], alpha: [0.5, 0.3], aditivo: true, cor: 0xa01020 })],
    rastro: [SANGUE(1, { velocidade: [0, 10], gravidade: 200 })],
    impacto: [SANGUE(8)],
    marca: 'poca_sangue',
    aoAcertar: (c, a) => {
      if (!a.de || a.indice > 0) return;
      for (let i = 0; i < 4; i++) tween(c, { textura: 'gota_viva', de: tremido(a.ate), para: a.de, s: [0.4, 0.3], a: [1, 0.6], cor: 0xd83040, ms: 360, atrasoMs: 80 + i * 50, curva: (t) => t * t, subir: -24 });
    },
  },
  /** Passo sombrio: a sombra se fecha onde estava e abre onde reaparece. */
  passo_sombrio: {
    familia: 'trevas',
    impacto: [SOMBRA(4)],
    emSi: (c, a) => {
      tween(c, { textura: 'choque', de: a.pos, s: [2.4, 0.2], a: [0.2, 0.9], cor: 0x2a1440, ms: 260, curva: (t) => t * t });
      c.particulas.emitirLista([SOMBRA(10, { velocidade: [20, 60] }), ALMAS(2)], a.pos.x, a.pos.y, a.cor);
    },
  },
  /** Véu da noite: a fumaça escura sobe e cobre o corpo, que some no breu. */
  veu_da_noite: {
    familia: 'trevas',
    impacto: [SOMBRA(3)],
    emSi: (c, a) => {
      c.particulas.emitirLista([fumacaEscura(10, { cor: 0x160a24, raio: 14, velocidade: [10, 30] }), em({ textura: 'cintilar', quantidade: 5, vidaMs: [500, 800], velocidade: [5, 15], direcao: 'cima', escala: [0.05, 0.2], curvaEscala: 'pulso', alpha: [1, 0], aditivo: true, raio: 16, cor: 0xc8b0ff })], a.pos.x, a.pos.y, a.cor);
    },
  },
  /** Troca sombria: duas fendas de sombra, uma em cada ponta, e um fio entre elas. */
  troca_sombria: {
    familia: 'trevas',
    impacto: [SOMBRA(5), ALMAS(1)],
    aoAcertar: (c, a) => {
      if (!a.de) return;
      for (const p of [a.de, a.ate]) tween(c, { textura: 'choque', de: p, s: [0.4, 1.8], a: [1, 0], cor: 0x6c3483, aditivo: true, ms: 320, curva: sai });
      c.particulas.emitirLista([SOMBRA(6, { raio: 2 })], a.de.x, a.de.y, a.cor, a.ate);
    },
  },
  /** Invocação: o círculo verde no chão e o lacaio surgindo de uma coluna de luz. */
  invocacao: {
    familia: 'trevas',
    impacto: [ALMAS(2)],
    emSi: (c, a) => {
      circuloNoChao(c, () => a.pos, 'circulo_runico', a.cor, 2.6, 900, 1.2);
      tween(c, { textura: 'feixe', de: a.pos, s: [0.6, 0.6], sy: [0.2, 3.6], rot: [Math.PI / 2, Math.PI / 2], a: [1, 0], cor: a.cor, aditivo: true, ms: 500, curva: sai, subir: -30 });
      c.particulas.emitirLista([ALMAS(3), SOMBRA(4)], a.pos.x, a.pos.y, a.cor);
    },
  },
  /** Campo de ossos: costelas e ossos irrompem pela área como estacas. */
  campo_de_ossos: {
    familia: 'trevas',
    conjuracao: CONJURA_TREVAS,
    impacto: [OSSOS(4)],
    camera: 'leve',
    naArea: (c, a) => {
      sortear(a.celulas, c.reduzido ? 5 : 10).forEach((cel, i) => {
        const p = tremido(cel, 0.4);
        brotar(c, p, 'osso', 0xece4d0, 1.2, 900, false, i * 40);
        c.particulas.emitirLista([OSSOS(2, { velocidade: [60, 120] })], p.x, p.y, a.cor);
      });
      c.marca('rachadura', a.centro.x, a.centro.y, 0x1a1020, Math.max(1.4, a.raio * 2), 2600);
    },
  },
  /** Hoste espectral: almas em revoada saem do necromante e circulam. */
  hoste_espectral: {
    familia: 'trevas',
    conjuracao: CONJURA_TREVAS,
    impacto: [ALMAS(3)],
    emSi: (c, a) => {
      orbitar(c, () => c.ondeEsta(a.id) ?? a.pos, 'alma', 0xc8b8ff, { n: 6, raio: 1.4, ms: 1100, voltas: 1.4, tamanho: 0.9, aditivo: true, tangente: false, rastro: 2 });
      c.particulas.emitirLista([ALMAS(6, { raio: 20 })], a.pos.x, a.pos.y, a.cor);
    },
    naArea: (c, a) => {
      orbitar(c, () => c.ondeEsta(a.atorId) ?? a.origem, 'alma', 0xc8b8ff, { n: 8, raio: Math.max(1, a.raio), ms: 900, voltas: 1.4, tamanho: 0.9, aditivo: true, tangente: false, rastro: 2 });
    },
  },
  /** A marca sombria (marca de área): o símbolo escuro no chão que pulsa e explode em sombra. */
  marca_sombria: {
    familia: 'trevas',
    conjuracao: CONJURA_TREVAS,
    impacto: [SOMBRA(3), ALMAS(1)],
    camera: 'leve',
    naArea: (c, a) => {
      circuloNoChao(c, () => a.centro, 'runa2', a.cor, Math.max(2, a.raio * 2.2), 600, 0);
      ondaDeChoque(c, a.centro, a.cor, Math.max(1, a.raio) + 0.4, 420);
      c.particulas.emitirLista([SOMBRA(12, { raio: Math.max(1, a.raio) * PX * 0.6, velocidade: [30, 80] })], a.centro.x, a.centro.y, a.cor);
    },
  },
  /** A peste: a nuvem doente esverdeada com moscas (pontos) e caveiras pequenas. */
  peste: {
    familia: 'trevas',
    conjuracao: CONJURA_TREVAS,
    corpo: [em({ textura: 'cranio', quantidade: 1, vidaMs: [40, 50], escala: [0.45, 0.45], alpha: [1, 0.9], aditivo: true, cor: 0xb8e08a })],
    rastro: [nevoa(1, { cor: 0x6a8a3a, raio: 4 })],
    impacto: [nevoa(4, { cor: 0x6a8a3a }), em({ textura: 'ponto', quantidade: 8, vidaMs: [600, 900], velocidade: [20, 60], escala: [0.12, 0.08], alpha: [1, 0], raio: 14, cor: 0x1a1a10, turbulencia: 60 })],
    naArea: (c, a) => {
      c.particulas.emitirLista([nevoa(c.reduzido ? 6 : 12, { cor: 0x6a8a3a, raio: Math.max(1, a.raio) * PX * 0.6 }), em({ textura: 'ponto', quantidade: 12, vidaMs: [700, 1000], velocidade: [20, 60], escala: [0.12, 0.08], alpha: [1, 0], raio: 30, cor: 0x1a1a10, turbulencia: 60 })], a.centro.x, a.centro.y, a.cor);
      c.marca('poca_veneno', a.centro.x, a.centro.y, 0x4a6a2a, Math.max(1.2, a.raio * 2), 2800);
    },
  },
} satisfies Record<string, DefAssinatura>;
