// Assinaturas de raio, gelo, terra e veneno (marco 26, 29/10/2026, D-124). O raio é relâmpago ramificado que crepita
// (e salta de alvo em alvo na cadeia), o feixe elétrico e o globo de plasma; o gelo é estaca cristalina translúcida,
// geada que se espalha no chão e cristais que brotam; a terra é rocha que rola, espinho que irrompe, rachaduras e
// cratera; o veneno é gota verde que respinga, nuvem borbulhante e poça.

import type { DefAssinatura, P } from '../cena';
import { brotar, cair, clarao, clarear, feixe, ondaDeChoque, orbitar, PX, relampago, sortear, tremido, tween } from '../blocos';
import { em, faiscasMetal, nevoa, poeira } from '../emissoes';
import { sai } from '../pincel';
import type { Emissao } from '../../presets-particula';

// --- Raio.
const FAISCAS_RAIO = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'arco', quantidade: n, vidaMs: [80, 160], velocidade: [40, 120], escala: [0.6, 0.3], alpha: [1, 0], aditivo: true, raio: 10, cor: null, giro: [-20, 20], ...o });
const CONJURA_RAIO = [FAISCAS_RAIO(2, { raio: 8 }), faiscasMetal(1, { gravidade: 0, cores: [0xffffff, 0xfff6a0] })];
const IMPACTO_RAIO = [FAISCAS_RAIO(4), faiscasMetal(6, { gravidade: 100, cores: [0xffffff, 0xfff2a0, 0xa0d8ff] })];

/** O relâmpago de quem lança até o alvo (segue os dois enquanto crepita). */
function raioAte(c: Parameters<NonNullable<DefAssinatura['aoAcertar']>>[0], deId: string, de: P | null, alvoId: string, ate: P, cor: number, largura = 1): void {
  if (!de) return;
  relampago(c, () => c.ondeEsta(deId) ?? de, () => c.ondeEsta(alvoId) ?? ate, cor, 260, largura);
}

// --- Gelo.
const CORES_GELO = [0xffffff, 0xd8f0ff, 0x8cc8f0] as const;
const ESTILHACOS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'gelo', quantidade: n, vidaMs: [380, 620], velocidade: [90, 200], direcao: 'livre', gravidade: 380, arrasto: 0.8, escala: [0.4, 0.25], alpha: [1, 0], aditivo: false, raio: 4, cores: CORES_GELO, giro: [-8, 8], ...o });
const GEADA = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'floco', quantidade: n, vidaMs: [600, 1000], velocidade: [8, 26], direcao: 'livre', gravidade: 10, escala: [0.35, 0.1], alpha: [0.9, 0], aditivo: true, raio: 12, cor: 0xe8f6ff, giro: [-2, 2], ...o });
const NEVOA_FRIA = (n: number) => nevoa(n, { cor: 0xd8eeff, raio: 14 });

// --- Terra.
const PEDRAS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'rocha', quantidade: n, vidaMs: [450, 750], velocidade: [100, 220], direcao: 'cima', abertura: 1.1, gravidade: 620, escala: [0.3, 0.2], alpha: [1, 0.7], raio: 6, cor: 0x8a7258, giro: [-6, 6], ...o });

// --- Veneno.
const CORES_VENENO = [0xe8ffb0, 0x7ee05a, 0x2f8a3a] as const;
const BOLHAS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'bolha', quantidade: n, vidaMs: [500, 900], velocidade: [10, 40], direcao: 'cima', gravidade: -30, escala: [0.15, 0.4], curvaEscala: 'sai', alpha: [0.9, 0], curvaAlpha: 'entra', raio: 10, cores: CORES_VENENO, ...o });
const RESPINGO = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'gota_viva', quantidade: n, vidaMs: [300, 520], velocidade: [80, 180], direcao: 'cima', abertura: 1.2, gravidade: 560, escala: [0.25, 0.15], alpha: [1, 0.4], raio: 4, cores: CORES_VENENO, esticar: 0.2, ...o });
const NUVEM_TOXICA = (n: number, o: Partial<Emissao> = {}) => nevoa(n, { cor: 0x5aa04a, raio: 18, ...o });

export const ELEMENTOS_VFX = {
  // ===================== Raio
  /** Raio: o relâmpago ramificado da mão ao alvo, com clarão e estalo. */
  relampago: {
    familia: 'raio',
    conjuracao: CONJURA_RAIO,
    corpo: [em({ textura: 'clarao', quantidade: 1, vidaMs: [40, 60], escala: [0.7, 0.5], alpha: [1, 0.6], aditivo: true, cor: null, giro: [-10, 10] })],
    rastro: [FAISCAS_RAIO(2, { raio: 4 })],
    impacto: IMPACTO_RAIO,
    camera: 'leve',
    aoAcertar: (c, a) => {
      raioAte(c, a.fonteId, a.de, a.alvoId, a.ate, a.cor);
      clarao(c, a.ate, a.cor, 1.8);
    },
  },
  /** Raio em cadeia: o arco que salta de alvo em alvo (cada salto parte do alvo anterior). */
  raio_em_cadeia: {
    familia: 'raio',
    conjuracao: CONJURA_RAIO,
    corpo: [em({ textura: 'arco', quantidade: 2, vidaMs: [50, 80], escala: [0.8, 0.5], alpha: [1, 0.5], aditivo: true, cor: null, giro: [-30, 30] })],
    impacto: IMPACTO_RAIO,
    camera: 'leve',
    aoAcertar: (c, a) => {
      raioAte(c, a.fonteId, a.de, a.alvoId, a.ate, a.cor, 0.8);
      orbitar(c, () => c.ondeEsta(a.alvoId) ?? a.ate, 'arco', a.cor, { n: 3, raio: 0.45, ms: 380, voltas: 3, tamanho: 0.7, aditivo: true });
    },
  },
  /** Feixe elétrico (raio em linha): o feixe reto com relâmpagos enroscando nele. */
  feixe_eletrico: {
    familia: 'raio',
    conjuracao: CONJURA_RAIO,
    impacto: IMPACTO_RAIO,
    camera: 'leve',
    naArea: (c, a) => {
      const ponta = a.celulas.reduce((m, p) => (Math.hypot(p.x - a.origem.x, p.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? p : m), a.mira);
      feixe(c, a.origem, ponta, a.cor, 0.8, 380);
      relampago(c, () => a.origem, () => ponta, a.cor, 380, 0.6);
      relampago(c, () => a.origem, () => ponta, 0xffffff, 300, 0.4);
    },
  },
  /** Esfera de plasma: o globo crepitante com arcos girando, que estoura num anel elétrico. */
  esfera_de_plasma: {
    familia: 'raio',
    conjuracao: CONJURA_RAIO,
    impacto: IMPACTO_RAIO,
    aoAcertar: (c, a) => {
      if (a.indice > 0) return;
      tween(c, { textura: 'brasa', de: a.ate, s: [0.6, 2.6], a: [1, 0], cor: clarear(a.cor, 0.5), aditivo: true, ms: 420, curva: sai });
      orbitar(c, () => c.ondeEsta(a.alvoId) ?? a.ate, 'arco', a.cor, { n: 5, raio: 0.55, ms: 420, voltas: 2.5, tamanho: 0.8, aditivo: true });
      ondaDeChoque(c, a.ate, a.cor, 1.3, 360, 'choque', false);
    },
    naArea: (c, a) => {
      orbitar(c, () => c.ondeEsta(a.atorId) ?? a.origem, 'arco', a.cor, { n: 6, raio: Math.max(1, a.raio), ms: 520, voltas: 2, tamanho: 0.9, aditivo: true, rastro: 1 });
      for (const cel of sortear(a.celulas, 4)) relampago(c, () => c.ondeEsta(a.atorId) ?? a.origem, () => cel, a.cor, 220, 0.6);
      ondaDeChoque(c, a.origem, a.cor, a.raio + 0.5, 380);
    },
    emSi: (c, a) => {
      orbitar(c, () => c.ondeEsta(a.id) ?? a.pos, 'arco', a.cor, { n: 4, raio: 0.6, ms: 700, voltas: 3, tamanho: 0.7, aditivo: true });
      c.particulas.emitirLista(CONJURA_RAIO, a.pos.x, a.pos.y, a.cor);
    },
  },
  /** Tempestade de raios (raio em área): relâmpagos caem do céu em pontos da área. */
  tempestade_de_raios: {
    familia: 'raio',
    conjuracao: CONJURA_RAIO,
    impacto: IMPACTO_RAIO,
    camera: 'leve',
    naArea: (c, a) => {
      sortear(a.celulas, c.reduzido ? 3 : 5).forEach((cel, i) => {
        const ceu = { x: cel.x - 0.6, y: cel.y - 4 };
        c.tocar({ ms: 1, atrasoMs: i * 70, desenhar: () => false, aoFim: () => {
          relampago(c, () => ceu, () => cel, a.cor, 240, 1);
          c.particulas.emitirLista(IMPACTO_RAIO, cel.x, cel.y, a.cor);
          c.marca('rachadura', cel.x, cel.y, 0x202030, 0.9, 1400);
        } });
      });
    },
  },
  /** O toque elétrico (raio no contato): a mão que descarrega, arcos curtos no alvo. */
  toque_eletrico: {
    familia: 'raio',
    conjuracao: CONJURA_RAIO,
    impacto: IMPACTO_RAIO,
    aoAcertar: (c, a) => {
      clarao(c, a.ate, a.cor, 2);
      if (a.de) relampago(c, () => a.de, () => a.ate, a.cor, 160, 0.7);
      orbitar(c, () => c.ondeEsta(a.alvoId) ?? a.ate, 'arco', a.cor, { n: 3, raio: 0.4, ms: 300, voltas: 3, tamanho: 0.6, aditivo: true });
    },
  },
  /** O cone elétrico: vários relâmpagos curtos em leque. */
  cone_eletrico: {
    familia: 'raio',
    conjuracao: CONJURA_RAIO,
    impacto: IMPACTO_RAIO,
    naArea: (c, a) => {
      for (const cel of sortear(a.celulas, c.reduzido ? 3 : 5)) relampago(c, () => a.origem, () => cel, a.cor, 220, 0.7);
      clarao(c, a.origem, a.cor, 1.4);
    },
  },
  /** Mergulho do trovão: o falcão cai como um raio — relâmpago do céu, estrondo e anel elétrico. */
  mergulho_do_trovao: {
    familia: 'raio',
    conjuracao: [em({ textura: 'pena', quantidade: 1, vidaMs: [400, 600], velocidade: [10, 30], direcao: 'baixo', gravidade: 40, escala: [0.4, 0.3], alpha: [0.9, 0], raio: 8, cor: 0xe8f0ff, giro: [-3, 3] })],
    impacto: IMPACTO_RAIO,
    camera: 'forte',
    naArea: (c, a) => {
      const ceu = { x: a.centro.x - 0.4, y: a.centro.y - 5 };
      relampago(c, () => ceu, () => a.centro, 0xf7dc6f, 320, 1.6);
      ondaDeChoque(c, a.centro, 0xf7dc6f, a.raio + 0.8, 420);
      c.particulas.emitirLista([em({ textura: 'pena', quantidade: 10, vidaMs: [500, 800], velocidade: [80, 180], direcao: 'fora', forma: 'anel', gravidade: 80, arrasto: 1.5, escala: [0.45, 0.3], alpha: [1, 0], raio: 6, cor: 0xe8f0ff, giro: [-6, 6] }), ...IMPACTO_RAIO], a.centro.x, a.centro.y, a.cor);
      c.marca('rachadura', a.centro.x, a.centro.y, 0x202030, 2, 2400);
      c.tremor('forte');
    },
  },

  // ===================== Gelo
  /** Lança de gelo: a estaca cristalina voa, estilhaça no alvo e deixa geada. */
  lanca_de_gelo: {
    familia: 'gelo',
    conjuracao: [GEADA(2, { raio: 8 }), em({ textura: 'gelo', quantidade: 1, vidaMs: [200, 300], velocidade: [10, 30], direcao: 'cima', escala: [0.15, 0.35], alpha: [0.9, 0], raio: 8, cores: CORES_GELO })],
    corpo: [em({ textura: 'gelo', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.9, 0.9], alpha: [1, 0.9], cores: CORES_GELO })],
    rastro: [GEADA(2, { raio: 3 }), NEVOA_FRIA(1)],
    impacto: [ESTILHACOS(8), GEADA(4)],
    marca: 'geada',
    naArea: (c, a) => {
      const ponta = a.celulas.reduce((m, p) => (Math.hypot(p.x - a.origem.x, p.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? p : m), a.mira);
      tween(c, { textura: 'gelo', de: a.origem, para: ponta, s: [1.2, 1.2], sy: [1.8, 1.8], a: [1, 0.9], rot: [Math.atan2(c.tela(ponta).y - c.tela(a.origem).y, c.tela(ponta).x - c.tela(a.origem).x) + Math.PI / 2, Math.atan2(c.tela(ponta).y - c.tela(a.origem).y, c.tela(ponta).x - c.tela(a.origem).x) + Math.PI / 2], cor: 0xe8f6ff, ms: 220, curva: (t) => t, aoFim: () => { c.particulas.emitirLista([ESTILHACOS(10)], ponta.x, ponta.y, a.cor); } });
      c.particulas.emitirLista([GEADA(10), NEVOA_FRIA(3)], a.origem.x, a.origem.y, a.cor, ponta);
      for (const cel of a.celulas) c.marca('geada', cel.x, cel.y, 0xd8f0ff, 1, 2600, true);
    },
  },
  /** Estilhaço de gelo (o projétil de gelo): o cristal que gira no voo e quebra. */
  estilhaco_de_gelo: {
    familia: 'gelo',
    conjuracao: [GEADA(2, { raio: 8 })],
    corpo: [em({ textura: 'cristal', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.8, 0.8], alpha: [1, 0.9], cor: 0xe8f6ff })],
    rastro: [GEADA(1, { raio: 3 })],
    impacto: [ESTILHACOS(7), GEADA(3)],
    marca: 'geada',
  },
  /** Nova glacial: a onda de geada que corre pelo chão e cristais brotando em volta. */
  nova_glacial: {
    familia: 'gelo',
    conjuracao: [GEADA(2), NEVOA_FRIA(1)],
    impacto: [ESTILHACOS(5), GEADA(3)],
    camera: 'leve',
    naArea: (c, a) => {
      const r = Math.max(1, a.raio);
      ondaDeChoque(c, a.origem, 0xd8f0ff, r + 0.4, 480);
      ondaDeChoque(c, a.origem, 0xffffff, r * 0.7, 360);
      const n = c.reduzido ? 6 : 10;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + Math.random() * 0.3;
        brotar(c, { x: a.origem.x + Math.cos(ang) * r * 0.8, y: a.origem.y + Math.sin(ang) * r * 0.8 }, 'gelo', 0xe8f6ff, 0.9, 900, false, 80 + i * 18);
      }
      c.particulas.emitirLista([GEADA(18, { forma: 'anel', raio: r * PX * 0.6, direcao: 'fora', velocidade: [60, 140] }), NEVOA_FRIA(6)], a.origem.x, a.origem.y, a.cor);
      c.marca('geada', a.origem.x, a.origem.y, 0xd8f0ff, r * 2.4, 3200, true);
    },
  },
  /** O chão congelado (Zero absoluto): placas de gelo cobrem o chão, cristais e névoa fria. */
  chao_congelado: {
    familia: 'gelo',
    conjuracao: [GEADA(2), NEVOA_FRIA(1)],
    impacto: [ESTILHACOS(4), GEADA(3)],
    naArea: (c, a) => {
      for (const cel of a.celulas) c.marca('geada', cel.x, cel.y, 0xe0f4ff, 1.15, 3600, true);
      for (const cel of sortear(a.celulas, c.reduzido ? 4 : 8)) brotar(c, tremido(cel), 'cristal', 0xe8f6ff, 0.8, 1200, false, Math.random() * 200);
      c.particulas.emitirLista([NEVOA_FRIA(8)], a.centro.x, a.centro.y, a.cor);
    },
    emSi: (c, a) => {
      c.marca('geada', a.pos.x, a.pos.y, 0xe0f4ff, 2.4, 3000, true);
      c.particulas.emitirLista([GEADA(12, { forma: 'anel', raio: 26 }), NEVOA_FRIA(3)], a.pos.x, a.pos.y, a.cor);
    },
  },
  /** O cometa de gelo: a rocha de gelo cai em diagonal com cauda de neve e explode em cristais. */
  cometa_de_gelo: {
    familia: 'gelo',
    conjuracao: [GEADA(2)],
    impacto: [ESTILHACOS(6)],
    camera: 'forte',
    naArea: (c, a) => {
      const r = Math.max(1, a.raio * 0.8) * a.escala;
      cair(c, a.centro, 'gelo', 0xe8f6ff, { altura: 220, inclinacao: -0.6, ms: 380, tamanho: 2 * r, aoChegar: () => {
        ondaDeChoque(c, a.centro, 0xd8f0ff, r * 1.6, 460);
        c.particulas.emitirLista([ESTILHACOS(16, { velocidade: [140, 280] }), GEADA(12), NEVOA_FRIA(5)], a.centro.x, a.centro.y, a.cor);
        for (let i = 0; i < 6; i++) brotar(c, tremido(a.centro, r * 1.6), 'gelo', 0xe8f6ff, 1, 1100, false, i * 30);
        c.marca('geada', a.centro.x, a.centro.y, 0xd8f0ff, r * 3, 3600, true);
        c.tremor('forte');
      } });
      cair(c, a.centro, 'brasa', 0xbfe6ff, { altura: 220, inclinacao: -0.6, ms: 380, tamanho: 2.2 * r, aditivo: true });
    },
  },
  /** O cone de gelo: o sopro gelado em leque, cristais voando. */
  cone_de_gelo: {
    familia: 'gelo',
    conjuracao: [GEADA(2)],
    impacto: [ESTILHACOS(4), GEADA(2)],
    naArea: (c, a) => {
      c.particulas.emitirLista([NEVOA_FRIA(8), ESTILHACOS(c.reduzido ? 8 : 14, { forma: 'cone', direcao: 'livre', velocidade: [200, 320], gravidade: 0, abertura: 0.5 }), GEADA(14, { forma: 'cone', direcao: 'livre', velocidade: [140, 260], abertura: 0.55 })], a.origem.x, a.origem.y, a.cor, a.mira);
      for (const cel of sortear(a.celulas, 4)) c.marca('geada', cel.x, cel.y, 0xd8f0ff, 1, 2400, true);
    },
  },
  /** O toque de gelo: a mão que congela — cristais crescem no alvo e quebram. */
  toque_de_gelo: {
    familia: 'gelo',
    conjuracao: [GEADA(2)],
    impacto: [ESTILHACOS(6)],
    marca: 'geada',
    aoAcertar: (c, a) => {
      for (let i = 0; i < 3; i++) brotar(c, tremido(a.ate, 0.5), 'cristal', 0xe8f6ff, 0.8, 600, false, i * 40);
      clarao(c, a.ate, 0xd8f0ff, 1.2);
    },
  },
  /** A tempestade de gelo (gelo em área): estacas de gelo caem do céu. */
  tempestade_de_gelo: {
    familia: 'gelo',
    conjuracao: [GEADA(2), NEVOA_FRIA(1)],
    impacto: [ESTILHACOS(4)],
    camera: 'leve',
    naArea: (c, a) => {
      sortear(a.celulas, c.reduzido ? 5 : 9).forEach((cel, i) => {
        const p = tremido(cel, 0.5);
        cair(c, p, 'gelo', 0xe8f6ff, { altura: 170, inclinacao: 0.15, ms: 220, tamanho: 0.9, atrasoMs: i * 50, aoChegar: () => {
          c.particulas.emitirLista([ESTILHACOS(5)], p.x, p.y, a.cor);
          c.marca('geada', p.x, p.y, 0xd8f0ff, 0.8, 2200, true);
        } });
      });
      c.particulas.emitirLista([NEVOA_FRIA(6)], a.centro.x, a.centro.y, a.cor);
    },
  },

  // ===================== Terra
  /** Pedregulho: a rocha grande rola pela linha esmagando, com poeira e lascas. */
  pedregulho: {
    familia: 'terra',
    conjuracao: [PEDRAS(1, { velocidade: [20, 50], gravidade: 200 })],
    impacto: [PEDRAS(5), poeira(4)],
    camera: 'leve',
    naArea: (c, a) => {
      const ponta = a.celulas.reduce((m, p) => (Math.hypot(p.x - a.origem.x, p.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? p : m), a.mira);
      const dist = Math.hypot(ponta.x - a.origem.x, ponta.y - a.origem.y);
      tween(c, { textura: 'rocha', de: a.origem, para: ponta, s: [1.6, 1.6], a: [1, 0.8], rot: [0, dist * 2.2], cor: 0xa08468, ms: 140 + dist * 60, curva: (t) => t, noChao: true, subir: -10 });
      for (const cel of a.celulas) {
        const d = Math.hypot(cel.x - a.origem.x, cel.y - a.origem.y);
        c.tocar({ ms: 1, atrasoMs: d * 60, desenhar: () => false, aoFim: () => { c.particulas.emitirLista([poeira(3, { forma: 'ponto', direcao: 'cima' }), PEDRAS(2)], cel.x, cel.y, a.cor); } });
        c.marca('rachadura', cel.x, cel.y, 0x2a2018, 0.8, 2000);
      }
    },
  },
  /** Estaca de pedra: o espinho de rocha irrompe do chão sob o alvo. */
  estaca_de_pedra: {
    familia: 'terra',
    conjuracao: [PEDRAS(1, { velocidade: [20, 50], gravidade: 200 }), poeira(1, { forma: 'ponto' })],
    corpo: [em({ textura: 'espinho', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.7, 0.7], alpha: [1, 0.9], cor: 0xa08468 })],
    rastro: [poeira(1, { forma: 'ponto', escala: [0.2, 0.5] })],
    impacto: [PEDRAS(6), poeira(4)],
    marca: 'rachadura',
    aoAcertar: (c, a) => {
      if (a.indice > 0) return;
      brotar(c, a.ate, 'espinho', 0xb09070, 1.6 * a.escala, 700);
      brotar(c, tremido(a.ate, 0.5), 'espinho', 0x8a7258, 1.1, 650, false, 40);
    },
  },
  /** Abalo sísmico: o chão racha em volta, pedras saltam e a poeira corre em anel. */
  abalo_sismico: {
    familia: 'terra',
    conjuracao: [poeira(2, { forma: 'ponto' })],
    impacto: [PEDRAS(4)],
    camera: 'forte',
    naArea: (c, a) => {
      const r = Math.max(1, a.raio);
      c.marca('rachadura', a.origem.x, a.origem.y, 0x2a2018, r * 2.6, 3200);
      ondaDeChoque(c, a.origem, 0xc8b090, r + 0.4, 460);
      c.particulas.emitirLista([poeira(16, { raio: r * PX * 0.5, velocidade: [60, 140] })], a.origem.x, a.origem.y, a.cor);
      for (const cel of sortear(a.celulas, c.reduzido ? 5 : 9)) c.particulas.emitirLista([PEDRAS(3)], cel.x, cel.y, a.cor);
      c.tremor('forte');
    },
  },
  /** Muralha de pedra: os blocos sobem do chão em fileira, com poeira. */
  muralha_de_pedra: {
    familia: 'terra',
    conjuracao: [poeira(2, { forma: 'ponto' })],
    impacto: [PEDRAS(3)],
    emSi: (c, a) => {
      for (let i = -1; i <= 1; i++) brotar(c, { x: a.pos.x + i * 0.9, y: a.pos.y - 1 }, 'rocha', 0x9a8068, 1.4, 1400, false, (i + 1) * 70);
      c.particulas.emitirLista([poeira(10)], a.pos.x, a.pos.y - 1, a.cor);
    },
    naArea: (c, a) => {
      a.celulas.forEach((cel, i) => { brotar(c, cel, 'rocha', 0x9a8068, 1.4, 1400, false, i * 50); });
      c.particulas.emitirLista([poeira(10)], a.centro.x, a.centro.y, a.cor);
    },
  },
  /** Salto esmagador: quem salta cai e abre uma cratera, anel de poeira e pedras. */
  salto_esmagador: {
    familia: 'terra',
    conjuracao: [poeira(1, { forma: 'ponto' })],
    impacto: [PEDRAS(4)],
    camera: 'forte',
    naArea: (c, a) => {
      const r = Math.max(1, a.raio);
      ondaDeChoque(c, a.centro, 0xd8c8a8, r + 0.6, 420);
      c.marca('rachadura', a.centro.x, a.centro.y, 0x2a2018, r * 2.4, 3000);
      c.particulas.emitirLista([poeira(18, { raio: 14, velocidade: [80, 180] }), PEDRAS(10, { velocidade: [140, 260] })], a.centro.x, a.centro.y, a.cor);
      c.tremor('forte');
    },
  },
  /** Pele de pedra: placas de rocha se fecham sobre o corpo (lascas que voam para dentro). */
  pele_de_pedra: {
    familia: 'terra',
    impacto: [PEDRAS(2)],
    emSi: (c, a) => {
      orbitar(c, () => c.ondeEsta(a.id) ?? a.pos, 'rocha', 0xa08468, { n: 6, raio: 0.9, ms: 520, voltas: 0.4, tamanho: 0.5 });
      tween(c, { textura: 'choque', de: a.pos, s: [2.6, 0.8], a: [0.2, 0.8], cor: 0xc8b090, aditivo: true, ms: 420 });
      c.particulas.emitirLista([poeira(8, { direcao: 'livre', velocidade: [10, 30] })], a.pos.x, a.pos.y, a.cor);
    },
  },
  /** A queda de aço (Meteoro de aço): a lâmina gigante cai do céu e crava, com estrondo. */
  queda_de_aco: {
    familia: 'terra',
    conjuracao: [faiscasMetal(1, { velocidade: [20, 60] })],
    impacto: [faiscasMetal(8), PEDRAS(4)],
    camera: 'forte',
    naArea: (c, a) => {
      cair(c, a.centro, 'lamina', 0xe8eef4, { altura: 260, ms: 300, tamanho: 2.6, aoChegar: () => {
        ondaDeChoque(c, a.centro, 0xffffff, a.raio + 0.8, 420);
        clarao(c, a.centro, 0xffffff, 2.4);
        c.particulas.emitirLista([faiscasMetal(16), poeira(14), PEDRAS(8)], a.centro.x, a.centro.y, a.cor);
        c.marca('rachadura', a.centro.x, a.centro.y, 0x2a2018, 2.6, 3000);
        c.tremor('forte');
      } });
    },
  },
  /** O golpe pesado: a pancada que afunda o chão (rachadura, poeira e onda curta). */
  golpe_pesado: {
    familia: 'terra',
    impacto: [PEDRAS(5), poeira(5)],
    marca: 'rachadura',
    camera: 'forte',
    aoAcertar: (c, a) => {
      ondaDeChoque(c, a.ate, 0xd8c8a8, 1, 300);
      clarao(c, a.ate, 0xffe8c0, 1.4);
    },
  },

  // ===================== Veneno
  /** Dardo tóxico: a gota verde que voa pingando e respinga no alvo. */
  dardo_toxico: {
    familia: 'veneno',
    conjuracao: [BOLHAS(2, { raio: 6 })],
    corpo: [em({ textura: 'gota_viva', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.6, 0.6], alpha: [1, 0.9], cores: CORES_VENENO })],
    rastro: [em({ textura: 'gota', quantidade: 1, vidaMs: [300, 500], velocidade: [0, 10], gravidade: 220, escala: [0.25, 0.1], alpha: [0.9, 0], raio: 2, cores: CORES_VENENO })],
    impacto: [RESPINGO(8), BOLHAS(4)],
    marca: 'poca_veneno',
  },
  /** Névoa venenosa: a nuvem verde densa e borbulhante que se espalha e fica. */
  nevoa_venenosa: {
    familia: 'veneno',
    conjuracao: [BOLHAS(2)],
    impacto: [BOLHAS(3)],
    emSi: (c, a) => {
      c.particulas.emitirLista([NUVEM_TOXICA(c.reduzido ? 8 : 14, { raio: 40, vidaMs: [1200, 1800] }), BOLHAS(10, { raio: 30 })], a.pos.x, a.pos.y, a.cor);
      c.marca('poca_veneno', a.pos.x, a.pos.y, 0x4a9a3a, 2.4, 3200);
    },
    naArea: (c, a) => {
      c.particulas.emitirLista([NUVEM_TOXICA(c.reduzido ? 8 : 14, { raio: Math.max(1, a.raio) * PX * 0.7, vidaMs: [1200, 1800] }), BOLHAS(10, { raio: 30 })], a.centro.x, a.centro.y, a.cor);
      c.marca('poca_veneno', a.centro.x, a.centro.y, 0x4a9a3a, Math.max(1, a.raio) * 2.2, 3200);
    },
  },
  /** Seiva corrosiva: a casca de ácido que escorre pelo corpo, pingando e chiando. */
  seiva_corrosiva: {
    familia: 'veneno',
    impacto: [RESPINGO(4)],
    emSi: (c, a) => {
      c.particulas.emitirLista([em({ textura: 'gota_viva', quantidade: 10, vidaMs: [500, 800], velocidade: [5, 20], direcao: 'baixo', gravidade: 160, escala: [0.25, 0.15], alpha: [1, 0], raio: 14, cores: CORES_VENENO, alturaInicial: 16 }), BOLHAS(6, { raio: 12 }), em({ textura: 'fumaca2', quantidade: 3, vidaMs: [500, 800], velocidade: [10, 30], direcao: 'cima', escala: [0.3, 0.8], alpha: [0.4, 0], raio: 10, cor: 0xc8f0a0 })], a.pos.x, a.pos.y, a.cor);
    },
  },
  /** O golpe viscoso: a pancada que espirra gosma verde. */
  golpe_viscoso: {
    familia: 'veneno',
    impacto: [RESPINGO(10), BOLHAS(3)],
    marca: 'poca_veneno',
    aoAcertar: (c, a) => {
      tween(c, { textura: 'gota_viva', de: a.ate, s: [0.4, 1.6], sy: [0.4, 0.9], a: [0.9, 0], cor: 0x7ee05a, ms: 300, curva: sai });
    },
  },
  /** O cone tóxico: o jato de gosma e vapor verde em leque. */
  cone_toxico: {
    familia: 'veneno',
    conjuracao: [BOLHAS(2)],
    impacto: [RESPINGO(4), BOLHAS(2)],
    naArea: (c, a) => {
      c.particulas.emitirLista([RESPINGO(c.reduzido ? 8 : 16, { forma: 'cone', direcao: 'livre', velocidade: [180, 300], gravidade: 200, abertura: 0.45 }), NUVEM_TOXICA(6, { forma: 'cone', direcao: 'livre', velocidade: [80, 160] })], a.origem.x, a.origem.y, a.cor, a.mira);
      for (const cel of sortear(a.celulas, 3)) c.marca('poca_veneno', cel.x, cel.y, 0x4a9a3a, 1, 2600);
    },
  },
  /** A poça tóxica (veneno em área): bolhas de veneno caem e se abrem em poças que fervem. */
  poca_toxica: {
    familia: 'veneno',
    conjuracao: [BOLHAS(2)],
    impacto: [RESPINGO(4)],
    naArea: (c, a) => {
      sortear(a.celulas, c.reduzido ? 3 : 6).forEach((cel, i) => {
        const p = tremido(cel, 0.4);
        cair(c, p, 'gota_viva', 0x7ee05a, { altura: 120, ms: 240, tamanho: 0.7, atrasoMs: i * 60, aoChegar: () => {
          c.particulas.emitirLista([RESPINGO(6), BOLHAS(4)], p.x, p.y, a.cor);
          c.marca('poca_veneno', p.x, p.y, 0x4a9a3a, 1.2, 3000);
        } });
      });
    },
  },
} satisfies Record<string, DefAssinatura>;
