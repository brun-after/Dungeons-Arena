// Assinaturas de arcano, psíquico, luz e suporte (marco 26, 29/10/2026, D-124). O arcano é cristal facetado e runa que
// gira (dardo, seta, orbe instável que tremula e estoura em estilhaços, o piscar que implode e reaparece); o psíquico
// é onda concêntrica e vidro que se parte; a luz são feixes que descem, a cúpula hexagonal, o glifo no chão, as asas.

import type { DefAssinatura } from '../cena';
import { brotar, cair, circuloNoChao, clarao, clarear, cupula, feixe, ondaDeChoque, orbitar, PX, sortear, tremido, tween } from '../blocos';
import { cintilar, em } from '../emissoes';
import { elastica, sai } from '../pincel';
import type { Emissao } from '../../presets-particula';

const RUNAS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'runa0', quantidade: n, vidaMs: [500, 800], velocidade: [10, 30], direcao: 'cima', gravidade: -10, escala: [0.25, 0.4], alpha: [1, 0], curvaAlpha: 'entra', aditivo: true, raio: 14, cor: null, giro: [-1, 1], ...o });
const RUNAS_VARIADAS = (n: number) => [RUNAS(n, { textura: 'runa0' }), RUNAS(n, { textura: 'runa1' }), RUNAS(n, { textura: 'runa3' })];
const ESTILHACOS_ARCANOS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'estilhaco', quantidade: n, vidaMs: [300, 520], velocidade: [120, 240], gravidade: 120, arrasto: 1, escala: [0.4, 0.2], alpha: [1, 0], aditivo: true, raio: 4, cor: null, giro: [-8, 8], ...o });
const CONJURA_ARCANA = [RUNAS(1, { raio: 10 }), em({ textura: 'cintilar', quantidade: 1, vidaMs: [300, 500], velocidade: [10, 30], direcao: 'cima', escala: [0.05, 0.3], curvaEscala: 'pulso', alpha: [1, 0.3], aditivo: true, raio: 10, cor: null })];
const VIDRO = (n: number) => em({ textura: 'estilhaco', quantidade: n, vidaMs: [400, 650], velocidade: [80, 180], gravidade: 300, escala: [0.35, 0.25], alpha: [0.9, 0], raio: 6, cor: 0xf4e8ff, giro: [-10, 10] });
const LUZ_DESCE = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'faisca', quantidade: n, vidaMs: [300, 500], velocidade: [140, 220], direcao: 'baixo', abertura: 0.05, escala: [0.6, 0.2], alpha: [1, 0], aditivo: true, raio: 14, cor: null, alturaInicial: 50, esticar: 0.5, ...o });
const FOLHAS = (n: number) => em({ textura: 'folha', quantidade: n, vidaMs: [700, 1000], velocidade: [20, 50], direcao: 'cima', gravidade: -20, escala: [0.3, 0.2], alpha: [1, 0], raio: 12, cor: 0x7ad07a, giro: [-3, 3], turbulencia: 20 });

export const ARCANO = {
  // ===================== Arcano
  /** Dardo arcano: o cristal violeta facetado que gira no voo e estala em estilhaços. */
  dardo_arcano: {
    familia: 'arcano',
    conjuracao: CONJURA_ARCANA,
    corpo: [em({ textura: 'cristal', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.7, 0.7], alpha: [1, 0.9], aditivo: true, cor: null }), em({ textura: 'brasa', quantidade: 1, vidaMs: [60, 80], escala: [0.8, 0.6], alpha: [0.6, 0.3], aditivo: true, cor: null })],
    rastro: [em({ textura: 'cintilar', quantidade: 1, vidaMs: [200, 320], velocidade: [0, 10], escala: [0.25, 0.05], alpha: [1, 0], aditivo: true, raio: 3, cor: null, giro: [-4, 4] })],
    impacto: [ESTILHACOS_ARCANOS(6)],
    aoAcertar: (c, a) => { clarao(c, a.ate, a.cor, 1.2); },
  },
  /** Seta arcana: a seta rúnica longa, com runas que ficam no caminho. */
  seta_arcana: {
    familia: 'arcano',
    conjuracao: CONJURA_ARCANA,
    corpo: [em({ textura: 'feixe', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [1, 1], alpha: [1, 0.9], aditivo: true, cor: null }), em({ textura: 'runa3', quantidade: 1, vidaMs: [40, 50], escala: [0.4, 0.4], alpha: [1, 0.9], aditivo: true, cor: null })],
    rastro: [RUNAS(1, { raio: 2, velocidade: [0, 6], vidaMs: [300, 500] })],
    impacto: [...RUNAS_VARIADAS(1), ESTILHACOS_ARCANOS(4)],
    naArea: (c, a) => {
      const ponta = a.celulas.reduce((m, p) => (Math.hypot(p.x - a.origem.x, p.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? p : m), a.mira);
      feixe(c, a.origem, ponta, a.cor, 0.6, 320);
      c.particulas.emitirLista([RUNAS(6, { raio: 2 })], a.origem.x, a.origem.y, a.cor, ponta);
    },
  },
  /** Flecha arcana: a flecha de luz violeta com runa na ponta. */
  flecha_arcana: {
    familia: 'arcano',
    conjuracao: CONJURA_ARCANA,
    corpo: [em({ textura: 'flecha', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.85, 0.85], alpha: [1, 0.9], aditivo: true, cor: null })],
    rastro: [em({ textura: 'faisca', quantidade: 2, vidaMs: [160, 260], velocidade: [-30, -10], direcao: 'orientada', escala: [0.5, 0.15], alpha: [0.8, 0], aditivo: true, raio: 1, cor: null })],
    impacto: [RUNAS(2), ESTILHACOS_ARCANOS(4)],
  },
  /** Orbe instável: a esfera que tremula enquanto voa e estoura em estilhaços de cristal. */
  orbe_instavel: {
    familia: 'arcano',
    conjuracao: CONJURA_ARCANA,
    corpo: [em({ textura: 'brasa', quantidade: 1, vidaMs: [50, 70], escala: [1.2, 1.5], curvaEscala: 'pulso', alpha: [1, 0.7], aditivo: true, cor: null })],
    rastro: [em({ textura: 'arco', quantidade: 1, vidaMs: [80, 140], velocidade: [10, 40], escala: [0.5, 0.3], alpha: [1, 0], aditivo: true, raio: 8, cor: null, giro: [-20, 20] })],
    impacto: [ESTILHACOS_ARCANOS(4)],
    camera: 'leve',
    naArea: (c, a) => {
      tween(c, { textura: 'brasa', de: a.centro, s: [3, 0.5], a: [0.4, 1], cor: clarear(a.cor, 0.3), aditivo: true, ms: 160, curva: (t) => t * t, aoFim: () => {
        ondaDeChoque(c, a.centro, a.cor, Math.max(1, a.raio) + 0.6, 420);
        clarao(c, a.centro, a.cor, 2.4);
        c.particulas.emitirLista([ESTILHACOS_ARCANOS(c.reduzido ? 10 : 18, { velocidade: [160, 300] }), ...RUNAS_VARIADAS(2)], a.centro.x, a.centro.y, a.cor);
      } });
    },
  },
  /** Piscar: implode onde estava (anel que se fecha) e reaparece num clarão; a imagem residual some. */
  piscar: {
    familia: 'arcano',
    impacto: [RUNAS(2)],
    emSi: (c, a) => {
      tween(c, { textura: 'choque', de: a.pos, s: [2.6, 0.2], a: [0.2, 1], cor: a.cor, aditivo: true, ms: 200, curva: (t) => t * t });
      c.particulas.emitirLista([em({ textura: 'cintilar', quantidade: 10, vidaMs: [300, 500], velocidade: [60, 120], direcao: 'fora', forma: 'anel', escala: [0.3, 0.05], alpha: [1, 0], aditivo: true, raio: 6, cor: null })], a.pos.x, a.pos.y, a.cor);
    },
  },
  /** O eco do piscar e o eco arcano em área: o anel rúnico que explode onde ficou a imagem. */
  eco_arcano: {
    familia: 'arcano',
    conjuracao: CONJURA_ARCANA,
    impacto: [ESTILHACOS_ARCANOS(4)],
    naArea: (c, a) => {
      circuloNoChao(c, () => a.centro, 'circulo_runico', a.cor, Math.max(2, a.raio * 2.4), 520, 2);
      ondaDeChoque(c, a.centro, a.cor, Math.max(1, a.raio) + 0.5, 380);
      c.particulas.emitirLista([...RUNAS_VARIADAS(2), ESTILHACOS_ARCANOS(8)], a.centro.x, a.centro.y, a.cor);
    },
  },
  /** Sobrecarga arcana: arcos violetas estalam em volta do mago e runas giram. */
  sobrecarga_arcana: {
    familia: 'arcano',
    conjuracao: [em({ textura: 'arco', quantidade: 2, vidaMs: [80, 140], velocidade: [20, 60], escala: [0.6, 0.3], alpha: [1, 0], aditivo: true, raio: 14, cor: null, giro: [-20, 20] })],
    impacto: [RUNAS(2)],
    emSi: (c, a) => {
      orbitar(c, () => c.ondeEsta(a.id) ?? a.pos, 'arco', a.cor, { n: 5, raio: 0.7, ms: 700, voltas: 3, tamanho: 0.8, aditivo: true });
      orbitar(c, () => c.ondeEsta(a.id) ?? a.pos, 'runa0', a.cor, { n: 3, raio: 1, ms: 700, voltas: -1, tamanho: 0.5, aditivo: true, tangente: false });
      clarao(c, a.pos, a.cor, 1.8);
    },
  },
  /** Runa amplificadora: a runa grande gravada no chão que pulsa e sobe em colunas de luz. */
  runa_amplificadora: {
    familia: 'arcano',
    conjuracao: CONJURA_ARCANA,
    impacto: [RUNAS(2)],
    naArea: (c, a) => {
      circuloNoChao(c, () => a.origem, 'circulo_runico', a.cor, Math.max(2.4, a.raio * 2.4), 900, 0.6);
      for (let i = 0; i < 4; i++) tween(c, { textura: `runa${i}` as 'runa0', de: tremido(a.origem, Math.max(1, a.raio) * 1.4), s: [0.4, 0.7], a: [1, 0], cor: a.cor, aditivo: true, ms: 800, atrasoMs: i * 80, subir: -40 });
    },
    emSi: (c, a) => {
      circuloNoChao(c, () => a.pos, 'circulo_runico', a.cor, 2.4, 900, 0.6);
    },
  },
  /** Dissipar: um anel que varre e apaga, com os estilhaços do que foi desfeito caindo. */
  dissipar: {
    familia: 'arcano',
    impacto: [VIDRO(4)],
    naArea: (c, a) => {
      ondaDeChoque(c, a.centro, 0xe8f4ff, Math.max(1, a.raio) + 0.5, 420);
      c.particulas.emitirLista([VIDRO(10), em({ textura: 'runa2', quantidade: 4, vidaMs: [400, 600], velocidade: [10, 30], direcao: 'baixo', gravidade: 60, escala: [0.4, 0.2], alpha: [1, 0], aditivo: true, raio: 20, cor: null, giro: [-3, 3] })], a.centro.x, a.centro.y, a.cor);
    },
  },
  /** Afinidade elemental: quatro elementos orbitam o mago (chama, gelo, raio e folha). */
  afinidade_elemental: {
    familia: 'arcano',
    impacto: [RUNAS(2)],
    emSi: (c, a) => {
      const centro = () => c.ondeEsta(a.id) ?? a.pos;
      orbitar(c, centro, 'chama2', 0xff7b39, { n: 1, raio: 0.8, ms: 900, voltas: 1.5, tamanho: 0.8, aditivo: true, tangente: false });
      orbitar(c, centro, 'gelo', 0xbfe6ff, { n: 1, raio: 0.8, ms: 900, voltas: 1.5, tamanho: 0.6, tangente: false });
      orbitar(c, centro, 'arco', 0xf7dc6f, { n: 1, raio: 0.8, ms: 900, voltas: -1.5, tamanho: 0.8, aditivo: true });
      orbitar(c, centro, 'folha', 0x7ad07a, { n: 1, raio: 0.8, ms: 900, voltas: -1.5, tamanho: 0.6 });
    },
  },
  /** Singularidade: o ponto escuro que suga tudo para dentro e implode. */
  singularidade: {
    familia: 'arcano',
    conjuracao: CONJURA_ARCANA,
    impacto: [ESTILHACOS_ARCANOS(3)],
    camera: 'forte',
    naArea: (c, a) => {
      const r = Math.max(1.2, a.raio);
      tween(c, { textura: 'choque', de: a.centro, s: [r * 3, 0.3], a: [0.3, 1], cor: a.cor, aditivo: true, ms: 520, curva: (t) => t * t });
      tween(c, { textura: 'fumaca1', de: a.centro, s: [0.4, 1.6], a: [1, 0.9], rot: [0, 6], cor: 0x0a0414, ms: 600, curva: sai });
      c.particulas.emitirLista([em({ textura: 'cintilar', quantidade: c.reduzido ? 10 : 20, vidaMs: [400, 520], velocidade: [-160, -90], direcao: 'fora', forma: 'anel', escala: [0.3, 0.05], alpha: [0.2, 1], aditivo: true, raio: r * PX, cor: null })], a.centro.x, a.centro.y, a.cor);
      c.tocar({ ms: 1, atrasoMs: 520, desenhar: () => false, aoFim: () => {
        ondaDeChoque(c, a.centro, clarear(a.cor, 0.4), r + 0.8, 380);
        clarao(c, a.centro, a.cor, 2.6);
      } });
    },
  },
  /** Supernova: a estrela que incha, brilha branca e explode num anel enorme. */
  supernova: {
    familia: 'arcano',
    conjuracao: CONJURA_ARCANA,
    impacto: [em({ textura: 'cintilar', quantidade: 4, vidaMs: [400, 600], velocidade: [60, 140], escala: [0.4, 0.05], alpha: [1, 0], aditivo: true, raio: 6, cor: 0xffffff })],
    camera: 'forte',
    naArea: (c, a) => {
      const r = Math.max(1.5, a.raio);
      tween(c, { textura: 'brasa', de: a.origem, s: [0.5, 3.2], a: [1, 1], cor: 0xffffff, aditivo: true, ms: 320, curva: elastica, aoFim: () => {
        ondaDeChoque(c, a.origem, a.cor, r + 1, 520);
        ondaDeChoque(c, a.origem, 0xffffff, r * 0.7, 380);
        clarao(c, a.origem, 0xffffff, 4);
        c.particulas.emitirLista([cintilar(c.reduzido ? 12 : 24, { direcao: 'fora', forma: 'anel', raio: 10, velocidade: [200, 340], gravidade: 0, cor: null }), ESTILHACOS_ARCANOS(12)], a.origem.x, a.origem.y, a.cor);
      } });
    },
  },
  /** Prisma: o feixe que se abre em cores (cada etapa da ultimate sai na cor do seu elemento). */
  prisma: {
    familia: 'arcano',
    conjuracao: CONJURA_ARCANA,
    impacto: [ESTILHACOS_ARCANOS(4)],
    aoAcertar: (c, a) => {
      if (a.de) feixe(c, a.de, a.ate, a.corEtapa ?? a.cor, 0.7, 300);
      clarao(c, a.ate, a.corEtapa ?? a.cor, 1.4);
    },
    naArea: (c, a) => {
      const cores = [0xff7b39, 0x74b9ff, 0xf7dc6f, 0x58d68d, 0xd980fa];
      sortear(a.celulas, 5).forEach((cel, i) => { feixe(c, a.origem, cel, cores[i % cores.length] ?? a.cor, 0.6, 360); });
      clarao(c, a.origem, 0xffffff, 2);
    },
  },
  /** Presságio: o olho que se abre sobre quem conjura e estrelas girando. */
  pressagio: {
    familia: 'arcano',
    impacto: [cintilar(3)],
    emSi: (c, a) => {
      tween(c, { textura: 'olho', de: { x: a.pos.x, y: a.pos.y - 1 }, s: [0.3, 1.2], sy: [0.05, 1], a: [1, 0], cor: a.cor, aditivo: true, ms: 900, curva: sai });
      orbitar(c, () => c.ondeEsta(a.id) ?? a.pos, 'cintilar', a.cor, { n: 5, raio: 0.8, ms: 900, voltas: 1, tamanho: 0.4, aditivo: true, tangente: false });
    },
  },
  /** Impulso: a rajada de vento azul-verde que sobe em espiral e empurra. */
  impulso: {
    familia: 'arcano',
    impacto: [em({ textura: 'faisca', quantidade: 4, vidaMs: [200, 300], velocidade: [120, 200], escala: [0.4, 0.1], alpha: [0.8, 0], aditivo: true, raio: 4, cor: null, esticar: 0.4 })],
    naArea: (c, a) => {
      ondaDeChoque(c, a.origem, a.cor, Math.max(1, a.raio) + 0.5, 360);
      c.particulas.emitirLista([em({ textura: 'corte', quantidade: 12, vidaMs: [300, 500], velocidade: [120, 200], direcao: 'livre', forma: 'espiral', escala: [0.6, 0.3], alpha: [0.8, 0], aditivo: true, raio: 20, cor: null })], a.origem.x, a.origem.y, a.cor);
    },
  },

  // ===================== Psíquico
  /** Mente partida: ondas concêntricas sobre a cabeça e estilhaços de vidro. */
  mente_partida: {
    familia: 'arcano',
    conjuracao: CONJURA_ARCANA,
    corpo: [em({ textura: 'choque', quantidade: 1, vidaMs: [60, 90], escala: [0.3, 0.7], alpha: [1, 0], aditivo: true, cor: null })],
    rastro: [em({ textura: 'choque', quantidade: 1, vidaMs: [200, 300], escala: [0.2, 0.6], alpha: [0.6, 0], aditivo: true, raio: 1, cor: null })],
    impacto: [VIDRO(8)],
    aoAcertar: (c, a) => {
      for (let i = 0; i < 3; i++) tween(c, { textura: 'choque', de: { x: a.ate.x, y: a.ate.y - 0.4 }, s: [0.2, 1.4], a: [1, 0], cor: a.cor, aditivo: true, ms: 360, atrasoMs: i * 90, curva: sai });
    },
    naArea: (c, a) => {
      for (let i = 0; i < 3; i++) ondaDeChoque(c, a.centro, a.cor, Math.max(1, a.raio) * (0.5 + i * 0.3), 420, 'choque', false);
      c.particulas.emitirLista([VIDRO(10)], a.centro.x, a.centro.y, a.cor);
    },
  },
  /** Agulha mental: a agulha fina de luz que perfura e deixa ondas no alvo. */
  agulha_mental: {
    familia: 'arcano',
    corpo: [em({ textura: 'faisca', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.9, 0.9], alpha: [1, 0.9], aditivo: true, cor: null })],
    rastro: [em({ textura: 'faisca', quantidade: 1, vidaMs: [140, 220], velocidade: [-20, -5], direcao: 'orientada', escala: [0.5, 0.1], alpha: [0.8, 0], aditivo: true, raio: 1, cor: null })],
    impacto: [VIDRO(4)],
    aoAcertar: (c, a) => { tween(c, { textura: 'choque', de: a.ate, s: [0.2, 1.2], a: [1, 0], cor: a.cor, aditivo: true, ms: 300, curva: sai }); },
  },
  /** Telecinese: a aura que envolve o alvo, ergue e lança (o deslize leva o corpo). */
  telecinese: {
    familia: 'arcano',
    impacto: [VIDRO(3)],
    aoAcertar: (c, a) => {
      orbitar(c, () => c.ondeEsta(a.alvoId) ?? a.ate, 'estilhaco', a.cor, { n: 6, raio: 0.6, ms: 520, voltas: 1.5, tamanho: 0.5, aditivo: true });
      tween(c, { textura: 'choque', de: a.ate, s: [1.8, 1], a: [0.9, 0], cor: a.cor, aditivo: true, ms: 420 });
    },
  },
  /** Onda de repulsão: o cone de distorção que empurra (arcos que crescem para fora). */
  onda_de_repulsao: {
    familia: 'arcano',
    conjuracao: CONJURA_ARCANA,
    impacto: [VIDRO(3)],
    naArea: (c, a) => {
      const ang = Math.atan2(c.tela(a.mira).y - c.tela(a.origem).y, c.tela(a.mira).x - c.tela(a.origem).x);
      for (let i = 0; i < 3; i++) {
        tween(c, { textura: 'onda_som', de: a.origem, para: a.mira, s: [0.6, 2.2], a: [1, 0], rot: [ang + Math.PI / 2, ang + Math.PI / 2], cor: a.cor, aditivo: true, ms: 380, atrasoMs: i * 80, curva: sai });
      }
      c.particulas.emitirLista([em({ textura: 'faisca', quantidade: 10, vidaMs: [240, 360], velocidade: [200, 320], forma: 'cone', abertura: 0.45, escala: [0.5, 0.1], alpha: [0.8, 0], aditivo: true, raio: 2, cor: null, esticar: 0.4 })], a.origem.x, a.origem.y, a.cor, a.mira);
    },
  },

  // ===================== Luz e suporte
  /** Curar: feixes de luz descem sobre o alvo e folhas verdes sobem. */
  cura: {
    familia: 'luz',
    conjuracao: [cintilar(1, { raio: 8 })],
    impacto: [LUZ_DESCE(6), FOLHAS(4), cintilar(4)],
    aoAcertar: (c, a) => {
      tween(c, { textura: 'feixe', de: { x: a.ate.x, y: a.ate.y - 1.2 }, para: a.ate, s: [0.5, 0.5], sy: [1.4, 0.4], rot: [Math.PI / 2, Math.PI / 2], a: [0.9, 0], cor: clarear(a.cor, 0.5), aditivo: true, ms: 520 });
      circuloNoChao(c, () => c.ondeEsta(a.alvoId) ?? a.ate, 'choque', a.cor, 1.6, 520, 0);
    },
    emSi: (c, a) => {
      c.particulas.emitirLista([LUZ_DESCE(6), FOLHAS(4), cintilar(4)], a.pos.x, a.pos.y, a.cor);
      circuloNoChao(c, () => a.pos, 'choque', a.cor, 1.6, 520, 0);
    },
  },
  /** Barreira: a cúpula de hexágonos que se forma e encaixa em volta do alvo. */
  barreira: {
    familia: 'luz',
    conjuracao: [cintilar(1)],
    impacto: [cintilar(3)],
    aoAcertar: (c, a) => { cupula(c, () => c.ondeEsta(a.alvoId) ?? a.ate, a.cor); },
    emSi: (c, a) => { cupula(c, () => c.ondeEsta(a.id) ?? a.pos, a.cor); },
  },
  /** Purificação: a luz que lava de baixo para cima, levando as manchas embora. */
  purificacao: {
    familia: 'luz',
    conjuracao: [cintilar(1)],
    impacto: [cintilar(6, { velocidade: [60, 120], gravidade: -60 }), em({ textura: 'fumaca2', quantidade: 3, vidaMs: [500, 700], velocidade: [40, 80], direcao: 'cima', escala: [0.3, 0.8], alpha: [0.5, 0], raio: 10, cor: 0x4a4050 })],
    aoAcertar: (c, a) => {
      tween(c, { textura: 'feixe', de: a.ate, s: [0.5, 0.6], sy: [0.2, 3], rot: [Math.PI / 2, Math.PI / 2], a: [1, 0], cor: a.cor, aditivo: true, ms: 520, subir: -30, curva: sai });
    },
  },
  /** Círculo de amparo: o glifo de cura no chão, com cruz de luz e cintilar subindo. */
  circulo_de_amparo: {
    familia: 'luz',
    conjuracao: [cintilar(1)],
    impacto: [cintilar(3), FOLHAS(2)],
    emSi: (c, a) => {
      circuloNoChao(c, () => a.pos, 'circulo_runico', a.cor, 3, 1200, 0.4);
      c.particulas.emitirLista([cintilar(10, { raio: 40 }), FOLHAS(4)], a.pos.x, a.pos.y, a.cor);
    },
    naArea: (c, a) => {
      circuloNoChao(c, () => a.origem, 'circulo_runico', a.cor, Math.max(2.4, a.raio * 2.2), 1200, 0.4);
      c.particulas.emitirLista([cintilar(12, { raio: Math.max(1, a.raio) * PX * 0.7 }), FOLHAS(4)], a.origem.x, a.origem.y, a.cor);
    },
  },
  /** Lança radiante: o feixe dourado que atravessa, com cintilar no caminho. */
  lanca_radiante: {
    familia: 'luz',
    conjuracao: [cintilar(1)],
    corpo: [em({ textura: 'feixe', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [1.2, 1.2], alpha: [1, 0.9], aditivo: true, cor: null }), em({ textura: 'cintilar', quantidade: 1, vidaMs: [40, 50], escala: [0.5, 0.5], alpha: [1, 0.9], aditivo: true, cor: 0xffffff })],
    rastro: [cintilar(1, { raio: 2, velocidade: [0, 10] })],
    impacto: [cintilar(6, { direcao: 'livre', velocidade: [60, 140] })],
    aoAcertar: (c, a) => {
      if (a.de && a.indice === 0) feixe(c, a.de, a.ate, a.cor, 0.7, 260);
      clarao(c, a.ate, 0xfff4c0, 1.6);
    },
    naArea: (c, a) => {
      const ponta = a.celulas.reduce((m, p) => (Math.hypot(p.x - a.origem.x, p.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? p : m), a.mira);
      feixe(c, a.origem, ponta, a.cor, 1, 420);
    },
  },
  /** Asas da aurora: duas asas de luz se abrem atrás do alvo e batem uma vez. */
  asas_da_aurora: {
    familia: 'luz',
    impacto: [cintilar(5), em({ textura: 'pena', quantidade: 4, vidaMs: [600, 900], velocidade: [20, 50], direcao: 'baixo', gravidade: 30, escala: [0.35, 0.25], alpha: [1, 0], aditivo: true, raio: 14, cor: null, giro: [-2, 2] })],
    aoAcertar: (c, a) => {
      for (const lado of [1, -1]) {
        c.tocar({ ms: 900, desenhar: (t, _ms, p) => {
          const q = c.tela(c.ondeEsta(a.alvoId) ?? a.ate);
          const abre = elastica(Math.min(1, t / 0.35));
          const bate = Math.sin(t * Math.PI * 2) * 0.2;
          p.desenhar('asa', q.x, q.y - 6, { sx: 1.4 * lado, sy: 1.4, rot: lado * (-0.3 + bate) * abre, ax: 0, ay: 0.6, alpha: (t > 0.75 ? (1 - t) / 0.25 : 1) * abre, cor: a.cor, aditivo: true });
        } });
      }
    },
  },
  /** Chuva de estrelas: estrelas cadentes riscam o céu e explodem em cintilar. */
  chuva_de_estrelas: {
    familia: 'luz',
    conjuracao: [cintilar(1)],
    impacto: [cintilar(4)],
    camera: 'leve',
    naArea: (c, a) => {
      sortear(a.celulas, c.reduzido ? 5 : 9).forEach((cel, i) => {
        const p = tremido(cel, 0.5);
        cair(c, p, 'cintilar', 0xfff6c8, { altura: 200, inclinacao: 0.8, ms: 300, tamanho: 0.8, aditivo: true, atrasoMs: i * 60, aoChegar: () => {
          clarao(c, p, a.cor, 1.2);
          c.particulas.emitirLista([cintilar(5, { direcao: 'livre', velocidade: [60, 120] })], p.x, p.y, a.cor);
        } });
        c.particulas.emitirLista([em({ textura: 'faisca', quantidade: 4, vidaMs: [300, 400], velocidade: [0, 0], escala: [0.6, 0.1], alpha: [0.8, 0], aditivo: true, raio: 0, cor: 0xfff6c8, alturaInicial: 140 })], p.x - 2, p.y, a.cor, p);
      });
    },
  },
  /** Bênção (posturas e treinos): a coluna de luz que sobe do chão e o símbolo sobre a cabeça. */
  bencao: {
    familia: 'luz',
    impacto: [cintilar(3)],
    emSi: (c, a) => {
      circuloNoChao(c, () => c.ondeEsta(a.id) ?? a.pos, 'choque', a.cor, 1.8, 600, 0);
      tween(c, { textura: 'feixe', de: a.pos, s: [0.7, 0.7], sy: [0.2, 3], rot: [Math.PI / 2, Math.PI / 2], a: [0.8, 0], cor: a.cor, aditivo: true, ms: 600, subir: -36, curva: sai });
      tween(c, { textura: 'runa3', de: { x: a.pos.x, y: a.pos.y - 0.9 }, s: [0.3, 0.6], a: [1, 0], cor: a.cor, aditivo: true, ms: 700, subir: -14 });
    },
  },
  /** Retorno (o falcão volta ao punho): penas de luz em espiral até o braço e um brilho verde de cura. */
  retorno: {
    familia: 'luz',
    impacto: [FOLHAS(3), cintilar(3)],
    aoAcertar: (c, a) => {
      orbitar(c, () => c.ondeEsta(a.alvoId) ?? a.ate, 'pena', a.cor, { n: 5, raio: 0.7, ms: 600, voltas: 1.2, tamanho: 0.5, aditivo: true });
      brotar(c, a.ate, 'feixe', a.cor, 0.6, 400, true);
    },
  },
} satisfies Record<string, DefAssinatura>;
