// Assinaturas físicas, do arqueiro e do falcão (marco 26, 29/10/2026, D-124). O golpe é o arco da arma com faíscas;
// o atordoante deixa estrelas girando na cabeça; a investida risca vento e poeira; o escudo empurra uma onda; o brado
// e o grito são ondas de som visíveis; a flecha é flecha (perfura com lascas, chove do alto, abre em leque, explode
// com pavio); a armadilha é uma mandíbula dentada; o falcão mergulha, rasga com três garras e solta penas.

import type { DefAssinatura } from '../cena';
import { arcoDeGolpe, bolaDeFogo, brotar, cair, clarao, ondaDeChoque, orbitar, PX, sortear, tremido, tween } from '../blocos';
import { brasas, em, faiscasMetal, poeira } from '../emissoes';
import { elastica, sai } from '../pincel';
import type { Emissao } from '../../presets-particula';

const COR_MADEIRA = 0xd8c39a;
const LASCAS = (n: number) => em({ textura: 'lasca', quantidade: n, vidaMs: [220, 380], velocidade: [60, 140], gravidade: 420, arrasto: 0.4, escala: [0.45, 0.25], alpha: [1, 0], raio: 3, cor: 0xb08d5a, giro: [-8, 8] });
const SANGUE = (n: number) => em({ textura: 'gota_viva', quantidade: n, vidaMs: [300, 500], velocidade: [80, 170], direcao: 'cima', abertura: 1.2, gravidade: 600, escala: [0.2, 0.12], alpha: [1, 0.3], raio: 3, cores: [0xd83040, 0x7a1020], esticar: 0.2 });
const PENAS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'pena', quantidade: n, vidaMs: [600, 1000], velocidade: [40, 120], direcao: 'livre', gravidade: 40, arrasto: 1.6, escala: [0.4, 0.3], alpha: [1, 0], raio: 6, cor: 0xe8e0d0, giro: [-4, 4], turbulencia: 20, ...o });
const VENTO = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'corte', quantidade: n, vidaMs: [260, 420], velocidade: [80, 160], direcao: 'livre', escala: [0.6, 0.3], alpha: [0.7, 0], aditivo: true, raio: 10, cor: 0xe8f4ff, ...o });
const ESTRELINHAS = (n: number) => em({ textura: 'estrela', quantidade: n, vidaMs: [400, 600], velocidade: [40, 90], direcao: 'cima', gravidade: 160, escala: [0.35, 0.15], alpha: [1, 0], aditivo: true, raio: 6, cor: 0xffe070, giro: [-6, 6] });
const FLECHA_CORPO = [em({ textura: 'flecha', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.8, 0.8], alpha: [1, 0.85], cor: COR_MADEIRA })];
const ESTEIRA = [em({ textura: 'faisca', quantidade: 2, vidaMs: [140, 220], velocidade: [-30, -10], direcao: 'orientada', escala: [0.55, 0.15], alpha: [0.6, 0], aditivo: true, raio: 1, cor: null })];

/** A onda de som: três arcos que crescem para fora, em volta de quem grita. */
function ondasDeSom(c: Parameters<NonNullable<DefAssinatura['naArea']>>[0], em2: { x: number; y: number }, cor: number, raio: number): void {
  for (let i = 0; i < 3; i++) ondaDeChoque(c, em2, cor, raio * (0.6 + i * 0.25), 420, 'choque', false);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    tween(c, { textura: 'onda_som', de: em2, para: { x: em2.x + Math.cos(ang) * raio, y: em2.y + Math.sin(ang) * raio }, s: [0.4, 1], a: [1, 0], rot: [ang + Math.PI / 2, ang + Math.PI / 2], cor, aditivo: true, ms: 420, curva: sai });
  }
}

export const COMBATE = {
  // ===================== Físico
  /** O golpe: o arco da arma varrendo, com faíscas (a arma equipada desenha o seu quando cuida do golpe). */
  golpe: {
    familia: 'fisico',
    impacto: [faiscasMetal(5)],
    aoAcertar: (c, a) => { arcoDeGolpe(c, a.de, a.ate, a.cor, 1 * a.escala); },
  },
  /** O golpe atordoante: a pancada com clarão e as estrelas girando sobre a cabeça. */
  golpe_atordoante: {
    familia: 'fisico',
    impacto: [ESTRELINHAS(5), faiscasMetal(3)],
    camera: 'leve',
    aoAcertar: (c, a) => {
      clarao(c, a.ate, 0xfff2b0, 1.6);
      c.tocar({ ms: 1100, desenhar: (t, ms, p) => {
        const q = c.tela(c.ondeEsta(a.alvoId) ?? a.ate);
        for (let i = 0; i < 3; i++) {
          const ang = ms * 0.008 + (i / 3) * Math.PI * 2;
          p.desenhar('estrela', q.x + Math.cos(ang) * 14, q.y - 26 + Math.sin(ang) * 5, { sx: 0.4, alpha: t > 0.8 ? (1 - t) / 0.2 : 1, cor: 0xffe070, aditivo: true, rot: ms * 0.01 });
        }
      } });
    },
  },
  /** Investida: o rastro de vento e poeira na trajetória (o corpo desliza junto). */
  investida: {
    familia: 'fisico',
    impacto: [poeira(4, { forma: 'ponto' }), faiscasMetal(3)],
    camera: 'leve',
    naArea: (c, a) => {
      const ponta = a.celulas.reduce((m, p) => (Math.hypot(p.x - a.origem.x, p.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? p : m), a.mira);
      c.particulas.emitirLista([poeira(10, { forma: 'ponto', direcao: 'cima', raio: 4 }), VENTO(8, { direcao: 'orientada', velocidade: [-60, -20], raio: 2 })], a.origem.x, a.origem.y, a.cor, ponta);
      for (let i = 0; i < 3; i++) tween(c, { textura: 'feixe', de: a.origem, para: ponta, s: [0.3, 0.3], sy: [0.5, 0.2], a: [0.5, 0], rot: [Math.atan2(c.tela(ponta).y - c.tela(a.origem).y, c.tela(ponta).x - c.tela(a.origem).x), Math.atan2(c.tela(ponta).y - c.tela(a.origem).y, c.tela(ponta).x - c.tela(a.origem).x)], cor: 0xf0e8d8, aditivo: true, ms: 260, atrasoMs: i * 40 });
    },
  },
  /** Investida de escudo: o escudo à frente e a onda de choque que empurra. */
  investida_de_escudo: {
    familia: 'fisico',
    impacto: [faiscasMetal(6), poeira(3, { forma: 'ponto' })],
    camera: 'leve',
    naArea: (c, a) => {
      const ponta = a.celulas.reduce((m, p) => (Math.hypot(p.x - a.origem.x, p.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? p : m), a.mira);
      const ang = Math.atan2(c.tela(ponta).y - c.tela(a.origem).y, c.tela(ponta).x - c.tela(a.origem).x);
      tween(c, { textura: 'hexagono', de: a.origem, para: ponta, s: [0.9, 1.1], a: [1, 0.2], rot: [ang, ang], cor: 0xd8e0e8, aditivo: true, ms: 260 });
      tween(c, { textura: 'onda_som', de: ponta, s: [0.8, 2.2], a: [1, 0], rot: [ang + Math.PI / 2, ang + Math.PI / 2], cor: 0xffffff, aditivo: true, ms: 320, atrasoMs: 200, curva: sai });
      c.particulas.emitirLista([poeira(8, { forma: 'ponto', direcao: 'cima', raio: 4 })], a.origem.x, a.origem.y, a.cor, ponta);
    },
  },
  /** Redemoinho: o anel de vento cortante em volta de quem gira (as lâminas da arma giram junto). */
  redemoinho: {
    familia: 'fisico',
    impacto: [faiscasMetal(4), SANGUE(2)],
    camera: 'leve',
    naArea: (c, a) => {
      const centro = () => c.ondeEsta(a.atorId) ?? a.origem;
      orbitar(c, centro, 'arco_golpe', 0xf4f0e8, { n: 3, raio: Math.max(0.9, a.raio * 0.8), ms: 420, voltas: 1.6, tamanho: 1.1, aditivo: true, rastro: 2 });
      c.particulas.emitirLista([VENTO(12, { forma: 'espiral', raio: Math.max(1, a.raio) * PX * 0.7 }), poeira(8, { raio: Math.max(1, a.raio) * PX * 0.5 })], a.origem.x, a.origem.y, a.cor);
    },
  },
  /** Brado: ondas de som visíveis saem de quem grita, e o chão treme. */
  brado: {
    familia: 'fisico',
    impacto: [ESTRELINHAS(2)],
    camera: 'leve',
    naArea: (c, a) => { ondasDeSom(c, a.origem, a.cor, Math.max(1.5, a.raio)); },
    emSi: (c, a) => { ondasDeSom(c, a.pos, a.cor, 1.5); },
  },
  /** A onda do brado: o anel de choque largo que corre pelo chão levantando poeira. */
  onda_de_brado: {
    familia: 'fisico',
    impacto: [poeira(3, { forma: 'ponto' })],
    camera: 'leve',
    naArea: (c, a) => {
      ondaDeChoque(c, a.origem, a.cor, Math.max(1, a.raio) + 0.5, 420);
      c.particulas.emitirLista([poeira(14, { raio: Math.max(1, a.raio) * PX * 0.8, velocidade: [60, 120] })], a.origem.x, a.origem.y, a.cor);
    },
  },
  /** Desafio: o olho da fúria sobre quem desafia e a marca vermelha que fica nos inimigos. */
  desafio: {
    familia: 'fisico',
    impacto: [em({ textura: 'mira_alvo', quantidade: 1, vidaMs: [600, 800], escala: [0.9, 0.5], alpha: [1, 0], aditivo: true, cor: null, alturaInicial: 28 })],
    naArea: (c, a) => {
      tween(c, { textura: 'olho', de: { x: a.origem.x, y: a.origem.y - 1.1 }, s: [0.3, 1.1], sy: [0.05, 0.9], a: [1, 0], cor: a.cor, aditivo: true, ms: 700, curva: elastica });
      ondaDeChoque(c, a.origem, a.cor, Math.max(1.5, a.raio), 420);
    },
  },
  /** Contragolpe: o clarão do aparo (lâmina que brilha) e o corte de volta. */
  contragolpe: {
    familia: 'fisico',
    impacto: [faiscasMetal(8)],
    emSi: (c, a) => {
      tween(c, { textura: 'lamina', de: a.pos, s: [0.7, 0.9], a: [1, 0], rot: [-0.8, 0.4], cor: 0xffffff, aditivo: true, ms: 360 });
      clarao(c, a.pos, 0xffffff, 1.8);
    },
    aoAcertar: (c, a) => {
      clarao(c, a.ate, 0xffffff, 1.4);
      arcoDeGolpe(c, a.de, a.ate, a.cor, 1.1, -1, 180);
    },
  },
  /** O contragolpe em arco: o corte largo de volta, em leque, com faíscas. */
  contragolpe_arco: {
    familia: 'fisico',
    impacto: [faiscasMetal(5), SANGUE(2)],
    naArea: (c, a) => {
      const meio = { x: (a.origem.x + a.mira.x) / 2, y: (a.origem.y + a.mira.y) / 2 };
      arcoDeGolpe(c, a.origem, meio, a.cor, 1.8 * a.escala, -1, 240);
      c.particulas.emitirLista([faiscasMetal(8, { forma: 'cone', direcao: 'livre', abertura: 0.6 })], a.origem.x, a.origem.y, a.cor, a.mira);
    },
  },
  /** Corte dilacerante: três rasgos rápidos e sangue que espirra e mancha o chão. */
  corte_dilacerante: {
    familia: 'fisico',
    impacto: [SANGUE(8)],
    marca: 'poca_sangue',
    aoAcertar: (c, a) => {
      for (let i = 0; i < 3; i++) {
        c.tocar({ ms: 1, atrasoMs: i * 70, desenhar: () => false, aoFim: () => { arcoDeGolpe(c, a.de, a.ate, a.cor, 0.9, i % 2 === 0 ? 1 : -1, 160); } });
      }
    },
  },
  /** Postura de aparo: a guarda com o brilho correndo pela lâmina e um escudo fino. */
  postura_de_aparo: {
    familia: 'fisico',
    impacto: [faiscasMetal(3)],
    emSi: (c, a) => {
      tween(c, { textura: 'lamina', de: a.pos, s: [0.9, 0.9], a: [0.2, 1], rot: [-0.3, -0.3], cor: a.cor, aditivo: true, ms: 420, aoFim: () => { clarao(c, a.pos, 0xffffff, 1.2); } });
      c.particulas.emitirLista([em({ textura: 'cintilar', quantidade: 3, vidaMs: [300, 500], velocidade: [10, 30], escala: [0.05, 0.4], curvaEscala: 'pulso', alpha: [1, 0], aditivo: true, raio: 10, cor: 0xffffff })], a.pos.x, a.pos.y, a.cor);
    },
  },
  /** A muralha de aço (Parede de aço, Formação): escudos sobem em fileira e se travam. */
  muralha_de_aco: {
    familia: 'fisico',
    impacto: [faiscasMetal(4)],
    naArea: (c, a) => {
      a.celulas.slice(0, 8).forEach((cel, i) => {
        brotar(c, cel, 'hexagono', 0xd8e0e8, 1, 900, true, i * 40);
        c.particulas.emitirLista([faiscasMetal(2)], cel.x, cel.y, a.cor);
      });
    },
  },
  /** A chuva de lâminas: espadas caem do céu e se cravam na área. */
  chuva_de_laminas: {
    familia: 'fisico',
    impacto: [faiscasMetal(4)],
    camera: 'leve',
    naArea: (c, a) => {
      sortear(a.celulas, c.reduzido ? 4 : 8).forEach((cel, i) => {
        const p = tremido(cel, 0.4);
        cair(c, p, 'lamina', 0xe8eef4, { altura: 180, ms: 220, tamanho: 0.9, atrasoMs: i * 50, aoChegar: () => {
          c.particulas.emitirLista([faiscasMetal(5), poeira(3, { forma: 'ponto' })], p.x, p.y, a.cor);
          brotar(c, p, 'lamina', 0xe8eef4, 0.7, 700);
        } });
      });
    },
  },

  // ===================== Arqueiro
  /** A flecha: a haste com penas e a esteira fina; no acerto, lascas. */
  flecha: {
    familia: 'arqueiro',
    corpo: FLECHA_CORPO,
    rastro: ESTEIRA,
    impacto: [LASCAS(6)],
  },
  /** Flecha perfurante: a flecha que atravessa, com o rastro de ar rasgado e lascas dos dois lados. */
  flecha_perfurante: {
    familia: 'arqueiro',
    corpo: [em({ textura: 'flecha', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.95, 0.95], alpha: [1, 0.85], cor: 0xf0e0b0 }), em({ textura: 'feixe', quantidade: 1, vidaMs: [60, 90], direcao: 'orientada', escala: [0.5, 0.5], alpha: [0.5, 0], aditivo: true, cor: null })],
    rastro: [em({ textura: 'faisca', quantidade: 3, vidaMs: [240, 360], velocidade: [-40, -10], direcao: 'orientada', abertura: 0.05, escala: [0.8, 0.2], alpha: [0.8, 0], aditivo: true, raio: 1, cor: null })],
    impacto: [LASCAS(8), SANGUE(3)],
  },
  /** Chuva de flechas: a salva sobe e cai inclinada na área, com pó onde crava. */
  chuva_de_flechas: {
    familia: 'arqueiro',
    impacto: [LASCAS(4)],
    camera: 'leve',
    naArea: (c, a) => {
      sortear(a.celulas, c.reduzido ? 6 : 12).forEach((cel, i) => {
        const p = tremido(cel, 0.5);
        cair(c, p, 'flecha', COR_MADEIRA, { altura: 150, inclinacao: 0.25, ms: 200, tamanho: 0.85, atrasoMs: (i % 6) * 40, aoChegar: () => {
          c.particulas.emitirLista([poeira(2, { forma: 'ponto', direcao: 'cima', escala: [0.2, 0.5] })], p.x, p.y, a.cor);
          brotar(c, p, 'flecha', COR_MADEIRA, 0.6, 700);
        } });
      });
    },
  },
  /** Tiro em leque: as flechas abrem em cone saindo do arco. */
  leque_de_flechas: {
    familia: 'arqueiro',
    impacto: [LASCAS(4)],
    naArea: (c, a) => {
      c.particulas.emitirLista([em({ textura: 'flecha', quantidade: 7, vidaMs: [200, 260], velocidade: [380, 440], abertura: 0.55, escala: [0.75, 0.75], alpha: [1, 0.7], raio: 2, cor: COR_MADEIRA, forma: 'cone' }), em({ textura: 'faisca', quantidade: 7, vidaMs: [160, 220], velocidade: [300, 380], abertura: 0.55, escala: [0.45, 0.15], alpha: [0.5, 0], aditivo: true, raio: 2, cor: null, forma: 'cone', esticar: 0.4 })], a.origem.x, a.origem.y, a.cor, a.mira);
    },
  },
  /** A flecha explosiva: a flecha com pavio aceso (faíscas no voo) e a explosão de fogo. */
  flecha_explosiva: {
    familia: 'arqueiro',
    corpo: FLECHA_CORPO,
    rastro: [faiscasMetal(2, { velocidade: [20, 60], gravidade: 200 }), em({ textura: 'fumaca2', quantidade: 1, vidaMs: [300, 500], velocidade: [5, 15], escala: [0.2, 0.5], alpha: [0.4, 0], raio: 2, cor: 0x5a5048 })],
    impacto: [brasas(4)],
    camera: 'leve',
    naArea: (c, a) => {
      cair(c, a.centro, 'flecha', COR_MADEIRA, { altura: 60, inclinacao: -1.5, ms: 160, tamanho: 0.85, aoChegar: () => { bolaDeFogo(c, a.centro, 0.8 * a.escala, 0xff8a3a); } });
    },
  },
  /** Armadilha de caça: a mandíbula dentada que se abre no chão e fecha com um estalo. */
  armadilha_de_caca: {
    familia: 'arqueiro',
    impacto: [faiscasMetal(6), SANGUE(3)],
    naArea: (c, a) => {
      for (const lado of [1, -1]) {
        c.tocar({ ms: 600, desenhar: (t, _ms, p) => {
          const q = c.chao(a.centro);
          const fecha = t < 0.5 ? 1 : 1 - elastica((t - 0.5) / 0.5);
          p.desenhar('arco_golpe', q.x, q.y + lado * 10 * fecha, { sx: 1.1, sy: 0.8 * lado, alpha: t > 0.85 ? (1 - t) / 0.15 : 1, cor: 0xa8a29a });
        } });
      }
      c.tocar({ ms: 1, atrasoMs: 300, desenhar: () => false, aoFim: () => { c.particulas.emitirLista([faiscasMetal(8)], a.centro.x, a.centro.y, a.cor); } });
    },
  },
  /** Marca do caçador: a mira gira e trava sobre o alvo. */
  marca_do_cacador: {
    familia: 'arqueiro',
    impacto: [em({ textura: 'cintilar', quantidade: 2, vidaMs: [300, 400], escala: [0.1, 0.4], curvaEscala: 'pulso', alpha: [1, 0], aditivo: true, raio: 6, cor: null })],
    aoAcertar: (c, a) => {
      c.tocar({ ms: 900, desenhar: (t, _ms, p) => {
        const q = c.tela(c.ondeEsta(a.alvoId) ?? a.ate);
        const trava = sai(Math.min(1, t / 0.4));
        p.desenhar('mira_alvo', q.x, q.y, { sx: 2 - trava, rot: (1 - trava) * 3, alpha: t > 0.8 ? (1 - t) / 0.2 : 1, cor: a.cor, aditivo: true });
      } });
    },
  },
  /** Rolamento: a poeira do chão e um borrão do corpo que rola. */
  rolamento: {
    familia: 'arqueiro',
    impacto: [poeira(4, { forma: 'ponto' })],
    emSi: (c, a) => { c.particulas.emitirLista([poeira(10, { raio: 8 }), VENTO(4, { cor: 0xd8c8a8 })], a.pos.x, a.pos.y, a.cor); },
  },
  /** Olho de águia: o olho dourado se abre sobre a cabeça e o foco fecha em volta. */
  olho_de_aguia: {
    familia: 'arqueiro',
    impacto: [em({ textura: 'cintilar', quantidade: 3, vidaMs: [300, 500], escala: [0.1, 0.4], curvaEscala: 'pulso', alpha: [1, 0], aditivo: true, raio: 10, cor: null })],
    emSi: (c, a) => {
      tween(c, { textura: 'olho', de: { x: a.pos.x, y: a.pos.y - 1 }, s: [0.4, 1], sy: [0.05, 0.85], a: [1, 0], cor: 0xf4c430, aditivo: true, ms: 800, curva: elastica });
      tween(c, { textura: 'choque', de: a.pos, s: [3.2, 1], a: [0.1, 0.7], cor: 0xf4c430, aditivo: true, ms: 420, curva: sai });
    },
  },
  /** Teia: a rede que gira no voo e se abre grudando no alvo. */
  teia: {
    familia: 'arqueiro',
    corpo: [em({ textura: 'teia', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.75, 0.75], alpha: [0.95, 0.8], cor: 0xe5e8ea })],
    rastro: [em({ textura: 'ponto', quantidade: 1, vidaMs: [300, 500], escala: [0.15, 0.05], alpha: [0.6, 0], raio: 3, cor: 0xe5e8ea })],
    impacto: [em({ textura: 'fumaca3', quantidade: 2, vidaMs: [300, 500], velocidade: [10, 30], escala: [0.3, 0.6], alpha: [0.4, 0], raio: 6, cor: 0xe5e8ea })],
    aoAcertar: (c, a) => { tween(c, { textura: 'teia', de: a.ate, s: [0.4, 1.8], a: [1, 0], rot: [0, 0.6], cor: 0xf0f2f4, ms: 900, curva: elastica }); },
  },
  /** Armar teia: a teia se estende no chão, fio a fio. */
  armar_teia: {
    familia: 'arqueiro',
    impacto: [],
    naArea: (c, a) => {
      for (const cel of a.celulas.slice(0, 9)) tween(c, { textura: 'teia', de: cel, s: [0.2, 1.4], a: [0.9, 0.5], rot: [0, 0.4], cor: 0xe5e8ea, ms: 900, curva: sai, noChao: true });
    },
  },
  /** Campo minado: as minas caem, piscam no chão e explodem em estilhaços. */
  campo_minado: {
    familia: 'arqueiro',
    impacto: [faiscasMetal(6)],
    camera: 'leve',
    naArea: (c, a) => {
      sortear(a.celulas, c.reduzido ? 4 : 7).forEach((cel, i) => {
        const p = tremido(cel, 0.3);
        cair(c, p, 'bola_ferro', 0x8a8a8a, { altura: 90, ms: 200, tamanho: 0.35, atrasoMs: i * 40, aoChegar: () => {
          c.tocar({ ms: 1, atrasoMs: 200, desenhar: () => false, aoFim: () => {
            clarao(c, p, 0xffd070, 1.2);
            c.particulas.emitirLista([faiscasMetal(6), poeira(3, { forma: 'ponto' }), brasas(3)], p.x, p.y, a.cor);
            c.marca('queimado', p.x, p.y, 0x1a1210, 0.8, 1800);
          } });
        } });
      });
    },
  },
  /** Rede de caça: a rede grande voa em leque e cai aberta sobre a área. */
  rede_de_caca: {
    familia: 'arqueiro',
    impacto: [],
    naArea: (c, a) => {
      tween(c, { textura: 'teia', de: a.origem, para: a.centro, s: [0.4, 2.6], a: [1, 0.85], rot: [0, 1.2], cor: 0xd8c8a8, ms: 280, curva: sai, aoFim: () => { tween(c, { textura: 'teia', de: a.centro, s: [2.6, 2.6], a: [0.85, 0], cor: 0xd8c8a8, ms: 900, noChao: true }); } });
    },
  },

  // ===================== Falcão
  /** Mergulho: o falcão cai do alto em queda, com penas e estrondo no alvo. */
  mergulho: {
    familia: 'falcao',
    rastro: [PENAS(1)],
    impacto: [PENAS(6, { velocidade: [80, 160] }), poeira(4, { forma: 'ponto' })],
    camera: 'leve',
    aoAcertar: (c, a) => {
      if (a.indice > 0) return;
      cair(c, a.ate, 'pena', 0xe8e0d0, { altura: 180, inclinacao: 0.4, ms: 180, tamanho: 1.2, aoChegar: () => { ondaDeChoque(c, a.ate, 0xe8f4ff, 1, 300); } });
      c.particulas.emitirLista([VENTO(6, { direcao: 'baixo', alturaInicial: 60, raio: 4 })], a.ate.x, a.ate.y, a.cor);
    },
  },
  /** Rasante: o risco de vento rente ao chão, com folhas e penas arrastadas. */
  rasante: {
    familia: 'falcao',
    impacto: [PENAS(3), VENTO(3)],
    camera: 'leve',
    naArea: (c, a) => {
      const ponta = a.celulas.reduce((m, p) => (Math.hypot(p.x - a.origem.x, p.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? p : m), a.mira);
      const ang = Math.atan2(c.tela(ponta).y - c.tela(a.origem).y, c.tela(ponta).x - c.tela(a.origem).x);
      tween(c, { textura: 'feixe', de: a.origem, para: ponta, s: [0.6, 0.6], sy: [0.8, 0.3], a: [0.8, 0], rot: [ang, ang], cor: 0xe8f4ff, aditivo: true, ms: 300 });
      c.particulas.emitirLista([PENAS(6, { raio: 2 }), VENTO(10, { raio: 2, direcao: 'orientada' }), poeira(6, { forma: 'ponto', raio: 4 })], a.origem.x, a.origem.y, a.cor, ponta);
    },
  },
  /** Tempestade de penas: penas cortantes em turbilhão pela área. */
  tempestade_de_penas: {
    familia: 'falcao',
    conjuracao: [PENAS(1)],
    impacto: [PENAS(3), SANGUE(2)],
    camera: 'leve',
    naArea: (c, a) => {
      orbitar(c, () => a.centro, 'pena', 0xf0f4f8, { n: c.reduzido ? 6 : 10, raio: Math.max(1, a.raio), ms: 700, voltas: 1.6, tamanho: 0.7, rastro: 1 });
      c.particulas.emitirLista([PENAS(14, { forma: 'espiral', raio: Math.max(1, a.raio) * PX * 0.6, velocidade: [80, 160] }), VENTO(8, { forma: 'espiral', raio: 30 })], a.centro.x, a.centro.y, a.cor);
    },
  },
  /** Grito do falcão: ondas de som saindo do bico e penas soltas. */
  grito_do_falcao: {
    familia: 'falcao',
    impacto: [PENAS(3)],
    aoAcertar: (c, a) => {
      if (a.indice > 0 || !a.de) return;
      const ang = Math.atan2(c.tela(a.ate).y - c.tela(a.de).y, c.tela(a.ate).x - c.tela(a.de).x);
      for (let i = 0; i < 3; i++) tween(c, { textura: 'onda_som', de: a.de, para: a.ate, s: [0.5, 1.4], a: [1, 0], rot: [ang + Math.PI / 2, ang + Math.PI / 2], cor: a.cor, aditivo: true, ms: 360, atrasoMs: i * 70, curva: sai });
    },
  },
  /** Garras cegantes: três garras rasgam e uma nuvem escura cobre o rosto. */
  garras_cegantes: {
    familia: 'falcao',
    impacto: [SANGUE(4), em({ textura: 'fumaca1', quantidade: 4, vidaMs: [600, 900], velocidade: [5, 15], escala: [0.4, 0.8], alpha: [0.7, 0], raio: 6, cor: 0x1a1a24, alturaInicial: 14 })],
    aoAcertar: (c, a) => { tween(c, { textura: 'garra', de: a.ate, s: [0.6, 1.3], a: [1, 0], rot: [-0.3, 0.1], cor: 0xffffff, aditivo: true, ms: 260, curva: sai }); },
  },
  /** Vigia: o falcão circula no alto, com o anel de vigilância no chão. */
  vigia: {
    familia: 'falcao',
    impacto: [PENAS(2)],
    emSi: (c, a) => {
      orbitar(c, () => c.ondeEsta(a.id) ?? a.pos, 'pena', 0xe8e0d0, { n: 1, raio: 1.6, ms: 1400, voltas: 1, tamanho: 1, rastro: 3 });
      c.tocar({ ms: 1400, desenhar: (t, _ms, p) => {
        const q = c.chao(c.ondeEsta(a.id) ?? a.pos);
        p.desenhar('choque', q.x, q.y, { sx: 5, sy: c.iso ? 2.5 : 5, alpha: Math.sin(t * Math.PI) * 0.4, cor: a.cor, aditivo: true });
      } });
    },
  },
  /** Presa dupla: duas mordidas cruzadas, uma de cada lado. */
  presa_dupla: {
    familia: 'falcao',
    impacto: [SANGUE(4), PENAS(2)],
    aoAcertar: (c, a) => {
      arcoDeGolpe(c, a.de, a.ate, a.cor, 0.9, 1, 160);
      c.tocar({ ms: 1, atrasoMs: 90, desenhar: () => false, aoFim: () => { arcoDeGolpe(c, a.de, a.ate, a.cor, 0.9, -1, 160); } });
    },
  },
  /** Furacão: a coluna de vento girando, levando penas e poeira para cima. */
  furacao: {
    familia: 'vento',
    impacto: [VENTO(4), PENAS(2)],
    camera: 'leve',
    naArea: (c, a) => {
      const centro = () => a.centro;
      for (let k = 0; k < 3; k++) orbitar(c, () => ({ x: centro().x, y: centro().y - k * 0.35 }), 'corte', 0xe8f4ff, { n: 3, raio: Math.max(0.6, a.raio * (0.5 + k * 0.25)), ms: 800, voltas: 2.5, tamanho: 0.9, aditivo: true });
      c.particulas.emitirLista([PENAS(10, { forma: 'espiral', raio: 30, gravidade: -80 }), poeira(10, { raio: Math.max(1, a.raio) * PX * 0.6 })], a.centro.x, a.centro.y, a.cor);
    },
  },
  /** Revoada: uma revoada de penas e asas passa em onda pela área. */
  revoada: {
    familia: 'falcao',
    impacto: [PENAS(4)],
    naArea: (c, a) => {
      sortear(a.celulas, c.reduzido ? 4 : 7).forEach((cel, i) => {
        tween(c, { textura: 'asa', de: { x: a.origem.x, y: a.origem.y - 1 }, para: cel, s: [0.5, 0.8], a: [1, 0], rot: [0, (i % 2 ? 1 : -1) * 0.6], cor: 0xf0f4f8, aditivo: true, ms: 380, atrasoMs: i * 40 });
      });
      c.particulas.emitirLista([PENAS(12, { raio: 30 })], a.centro.x, a.centro.y, a.cor);
    },
  },
} satisfies Record<string, DefAssinatura>;
