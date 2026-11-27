// As ligas da alquimia (D-206, 26/11/2026). Quando dois elementos se fundem numa skill, a matéria deles se mistura numa
// terceira coisa, com a lógica da mistura e um pouco de licença poética: fogo e terra viram lava; fogo e gelo, vapor (o
// fogo derrete o gelo) ou cristais com fogo preso dentro (o gelo guarda o fogo); raio e terra, o fulgurito (o vidro que
// o raio deixa na areia); trevas e luz, o eclipse. Cada liga é feita à mão: a matéria na mão e no rastro (`fio`), o
// estouro de partículas no acerto e uma silhueta (`gesto`) — a poça de lava com veios acesos, a coluna de vapor, o olho
// em chamas, as pedras que flutuam. Quando a mistura tem um elemento dominante (o do núcleo), algumas ligas mudam com
// ele. Os elementos de cada parte continuam aparecendo por cima (manifestacao-mistura.ts). Só desenho.

import type { Emissao } from '../presets-particula';
import { arcoDeGolpe, brotar, cair, circuloNoChao, clarao, ondaDeChoque, orbitar, relampago, sortear, tween } from './blocos';
import type { AreaVfx, CenaVfx, P } from './cena';
import { brasas, chamaViva, cintilar, em, faiscasMetal, fumacaEscura, nevoa, poeira } from './emissoes';
import type { Runa } from './manifestacao-runa';
import { MATERIA_DAS_LIGAS } from './ligas-materia';
import type { Transmuta } from './transmutacao';

export interface Liga {
  nome: string;
  /** O tom da liga (a onda da área e o que tinge sem cor própria). */
  cor: number;
  /** Na mão de quem conjura e no rastro do projétil (poucas partículas). */
  fio: readonly Emissao[];
  /** No alvo atingido e nas células da área. */
  estouro: readonly Emissao[];
  /** A silhueta no acerto (`e` é a escala do golpe). */
  gesto: (c: CenaVfx, em: P, de: P | null, e: number) => void;
  /** A silhueta da área, quando a liga tem uma própria (sem ela: a onda, o estouro nas células e o gesto no centro). */
  naArea?: (c: CenaVfx, a: AreaVfx) => void;
}

/** A liga já com o par de que nasceu e a matéria com que refaz a assinatura do núcleo (ligas-materia.ts). */
export interface LigaDoPar extends Liga {
  par: readonly [Runa, Runa];
  trans: Transmuta | null;
}

// --- Matérias de mistura (as peças com que as ligas se montam).

const gotas = (q: number, cores: readonly number[], o: Partial<Emissao> = {}): Emissao =>
  em({ textura: 'gota_viva', quantidade: q, vidaMs: [420, 700], velocidade: [60, 150], direcao: 'cima', abertura: 1.2, gravidade: 560, escala: [0.24, 0.12], alpha: [1, 0.4], raio: 4, cores, ...o });
const bolhas = (q: number, cor: number, o: Partial<Emissao> = {}): Emissao =>
  em({ textura: 'bolha', quantidade: q, vidaMs: [500, 900], velocidade: [10, 40], direcao: 'cima', gravidade: -30, escala: [0.12, 0.4], alpha: [0.9, 0], raio: 10, cor, turbulencia: 12, ...o });
const cristais = (q: number, cores: readonly number[], o: Partial<Emissao> = {}): Emissao =>
  em({ textura: 'gelo', quantidade: q, vidaMs: [420, 680], velocidade: [80, 170], direcao: 'cima', abertura: 1.3, gravidade: 380, escala: [0.34, 0.18], alpha: [1, 0], raio: 4, cores, giro: [-8, 8], ...o });
const arcos = (q: number, cor: number, o: Partial<Emissao> = {}): Emissao =>
  em({ textura: 'arco', quantidade: q, vidaMs: [90, 180], velocidade: [0, 20], escala: [0.45, 0.7], alpha: [1, 0], aditivo: true, raio: 12, cor, giro: [-3, 3], ...o });
const centelhas = (q: number, cor: number, o: Partial<Emissao> = {}): Emissao =>
  em({ textura: 'faisca', quantidade: q, vidaMs: [140, 260], velocidade: [140, 300], escala: [0.45, 0.15], alpha: [1, 0], aditivo: true, raio: 3, cor, esticar: 1.2, ...o });
const runas = (q: number, cor: number, o: Partial<Emissao> = {}): Emissao =>
  em({ textura: 'runa1', quantidade: q, vidaMs: [500, 800], velocidade: [10, 30], direcao: 'cima', escala: [0.22, 0.4], alpha: [1, 0], aditivo: true, raio: 14, cor, ...o });
const pedras = (q: number, cor: number, o: Partial<Emissao> = {}): Emissao =>
  em({ textura: 'rocha', quantidade: q, vidaMs: [450, 700], velocidade: [100, 200], direcao: 'cima', abertura: 1.1, gravidade: 620, escala: [0.3, 0.2], alpha: [1, 0.7], raio: 6, cor, giro: [-6, 6], ...o });
const almas = (q: number, cor: number, o: Partial<Emissao> = {}): Emissao =>
  em({ textura: 'alma', quantidade: q, vidaMs: [600, 900], velocidade: [30, 70], direcao: 'cima', gravidade: -50, escala: [0.3, 0.5], alpha: [0.9, 0], aditivo: true, raio: 8, cor, ...o });
const lascas = (q: number, cores: readonly number[], o: Partial<Emissao> = {}): Emissao =>
  em({ textura: 'estilhaco', quantidade: q, vidaMs: [260, 440], velocidade: [90, 190], escala: [0.3, 0.1], alpha: [1, 0], raio: 3, cores, giro: [-10, 10], ...o });

/** Uma peça que sobe do ponto e some no alto (a coluna de vapor, o feixe do sol). */
const coluna = (c: CenaVfx, q: P, textura: 'feixe' | 'fumaca1' | 'fumaca2', cor: number, aditivo: boolean, ms: number, atrasoMs = 0): void => { tween(c, { textura, de: q, s: [0.6, 1.3], sy: [0.5, 3], rot: textura === 'feixe' ? [Math.PI / 2, Math.PI / 2] : [0, 0.4], a: [0.85, 0], cor, aditivo, ms, atrasoMs, subir: -34 }); };

/** Uma peça escura (não somada: o preto aparece) que cresce e some no ponto. */
const sombra = (c: CenaVfx, q: P, textura: 'clarao' | 'fumaca1' | 'choque', cor: number, s: number, ms: number): void => { tween(c, { textura, de: q, s: [0.3 * s, s], a: [0.9, 0], cor, aditivo: false, ms }); };

/** `n` raios curtos que se abrem do ponto (a estrela, os feixes do prisma). */
function raios(c: CenaVfx, q: P, cores: readonly number[], n: number, alcance: number, ms = 260): void {
  for (let k = 0; k < n; k++) {
    const ang = (k / n) * Math.PI * 2 + Math.random() * 0.4;
    tween(c, { textura: 'feixe', de: q, para: { x: q.x + Math.cos(ang) * alcance, y: q.y + Math.sin(ang) * alcance }, s: [0.18, 0.05], a: [0.9, 0], cor: cores[k % cores.length] ?? 0xffffff, aditivo: true, ms, atrasoMs: 30 });
  }
}

/** Peças que brotam em volta do ponto, em leque (espinhos, cristais, pedras). */
function coroa(c: CenaVfx, q: P, textura: 'espinho' | 'estilhaco' | 'rocha' | 'gelo' | 'mao_ossea' | 'gota_viva', cor: number, n: number, raio: number, e: number, aditivo = false): void {
  for (let k = 0; k < n; k++) {
    const ang = (k / n) * Math.PI * 2 + Math.random() * 0.5;
    brotar(c, { x: q.x + Math.cos(ang) * raio, y: q.y + Math.sin(ang) * raio }, textura, cor, (0.55 + Math.random() * 0.3) * e, 620, aditivo, 40 * k);
  }
}

// --- As cores das ligas.
const LAVA = [0xfff2a0, 0xffa020, 0xe04010, 0x3a1408] as const;
const MAGMA_ROCHA = 0x4a2a1c;
const VAPOR = 0xeef6ff;
const IGNEO = [0xffffff, 0xffd48a, 0xff8a30, 0xb03a10] as const;
const PLASMA = [0xffffff, 0xffe0c0, 0xff9a50, 0xff4a20] as const;
const CHAMA_VERDE = [0xf0ffc0, 0xb8f040, 0x50c020, 0x1a4010] as const;
const CHAMA_MENTE = [0xffe0ff, 0xff8ae0, 0xc040c0, 0x401040] as const;
const CHAMA_NEGRA = [0xc080ff, 0x5a2080, 0x2a0a3a, 0x0a0410] as const;
const CHAMA_SOL = [0xffffff, 0xfff2a0, 0xffd040, 0xff9a20] as const;
const METAL_FUNDIDO = [0xffffff, 0xffc060, 0xff5010, 0x402010] as const;
const PRISMA = [0xffffff, 0xa0e0ff, 0xe0a0ff, 0xffa0e0, 0xa0ffc0] as const;
const OURO = 0xffd870;

/** A tabela: a chave é o par em ordem alfabética (`fogo+terra`). */
type Fabrica = (dominante: Runa) => Liga;

const LIGAS: Readonly<Record<string, Fabrica>> = {
  // ---------------- Fogo
  'fogo+terra': (d) =>
    d === 'terra'
      ? {
          // A terra domina: a pedra em brasa, o meteoro que cai do alto e racha o chão.
          nome: 'Pedra em brasa',
          cor: 0xff7a2a,
          fio: [pedras(1, MAGMA_ROCHA, { velocidade: [20, 50], gravidade: 200 }), brasas(2)],
          estouro: [pedras(5, MAGMA_ROCHA, { cores: [0xffb060, MAGMA_ROCHA, 0x2a1a10] }), brasas(6), poeira(3, { cor: 0x8a5a3a })],
          gesto: (c, q, _de, e) => {
            cair(c, q, 'rocha', 0x6a3a22, { altura: 200, ms: 300, tamanho: 0.9 * e, inclinacao: 0.4, aoChegar: () => { ondaDeChoque(c, q, 0xff6a1a, 1.1 * e, 420, 'rachadura'); clarao(c, q, 0xffa040, 1.2 * e); c.tremor('leve'); } });
            c.particulas.emitirLista([chamaViva(3, { velocidade: [60, 120], direcao: 'baixo' })], q.x, q.y, 0xff7a2a);
          },
        }
      : {
          // O fogo domina: a lava. Gotas pesadas e incandescentes, bolhas de magma que estouram em brasa, a poça com
          // os veios acesos.
          nome: 'Lava',
          cor: 0xff6a1a,
          fio: [gotas(2, LAVA, { velocidade: [20, 60], gravidade: 420 }), bolhas(1, 0xff8a30, { aditivo: true, aoMorrer: [brasas(2)] })],
          estouro: [gotas(8, LAVA, { aoMorrer: [brasas(1, { velocidade: [20, 50] })] }), bolhas(4, 0xffa040, { aditivo: true, aoMorrer: [brasas(2)] }), fumacaEscura(2, { cor: 0x3a2a24 })],
          gesto: (c, q, _de, e) => {
            ondaDeChoque(c, q, 0xff5a10, 0.9 * e, 900, 'rachadura');
            c.marca('queimado', q.x, q.y, 0x1a1008, 1.1 * e, 2600);
            c.marca('rachadura', q.x, q.y, 0xff6a1a, 0.9 * e, 1800, true);
            // A poça de lava: a mancha irregular acesa que fica um tempo no chão.
            c.marca('poca_sangue', q.x, q.y, 0xff5a10, 0.8 * e, 2200, true);
            coroa(c, q, 'gota_viva', 0xff8a20, 4, 0.35, 0.6 * e, true);
          },
        },
  'fogo+gelo': (d) =>
    d === 'gelo'
      ? {
          // O gelo domina: cristais com o fogo preso dentro, que estalam e soltam brasa.
          nome: 'Cristal ígneo',
          cor: 0xffa050,
          fio: [cristais(1, IGNEO, { aditivo: true, velocidade: [20, 50], gravidade: 120 }), brasas(1)],
          estouro: [cristais(7, IGNEO, { aditivo: true, aoMorrer: [brasas(1, { velocidade: [30, 70] })] }), chamaViva(3, { escala: [0.5, 0.15] })],
          gesto: (c, q, _de, e) => {
            coroa(c, q, 'estilhaco', 0xffb060, 5, 0.45, 0.85 * e, true);
            brotar(c, q, 'gelo', 0xffd8a0, 1.1 * e, 700, true);
            c.particulas.emitirLista([chamaViva(4, { raio: 4, escala: [0.45, 0.1] })], q.x, q.y, 0xff8a30);
            clarao(c, q, 0xffc080, 1.1 * e);
          },
        }
      : {
          // O fogo domina: o vapor. O gelo derrete e chia, a nuvem branca sobe e a água pinga.
          nome: 'Vapor',
          cor: VAPOR,
          fio: [nevoa(1, { cor: VAPOR, gravidade: -40, alpha: [0, 0.5] }), em({ textura: 'gota', quantidade: 1, vidaMs: [300, 500], velocidade: [10, 30], gravidade: 300, escala: [0.4, 0.2], alpha: [0.9, 0], raio: 4, cor: 0xbfe6ff })],
          estouro: [
            nevoa(6, { cor: VAPOR, velocidade: [30, 70], direcao: 'cima', gravidade: -60, escala: [0.6, 1.8], alpha: [0, 0.6], raio: 10 }),
            em({ textura: 'gota', quantidade: 6, vidaMs: [380, 620], velocidade: [60, 140], direcao: 'cima', abertura: 1.3, gravidade: 520, escala: [0.5, 0.25], alpha: [1, 0], raio: 4, cor: 0xbfe6ff }),
            centelhas(4, 0xffffff, { velocidade: [60, 140] }),
          ],
          gesto: (c, q, _de, e) => {
            coluna(c, q, 'fumaca2', VAPOR, false, 900);
            coluna(c, { x: q.x + 0.2, y: q.y }, 'fumaca1', 0xdfeefa, false, 1100, 120);
            ondaDeChoque(c, q, 0xdff4ff, 1 * e, 380);
          },
        },
  'fogo+raio': () => ({
    // O plasma: a bola branca que pulsa, com arcos alaranjados que lambem em volta.
    nome: 'Plasma',
    cor: 0xffa060,
    fio: [em({ textura: 'brilho', quantidade: 1, vidaMs: [160, 260], escala: [0.7, 0.2], alpha: [1, 0], aditivo: true, raio: 2, cores: PLASMA }), arcos(1, 0xffa060)],
    estouro: [arcos(4, 0xffb070), centelhas(8, 0xffd0a0), brasas(4)],
    gesto: (c, q, _de, e) => {
      tween(c, { textura: 'clarao', de: q, s: [0.3 * e, 1.5 * e], a: [1, 0], cor: 0xfff0e0, corFim: 0xff6a2a, aditivo: true, ms: 320, curva: (t) => Math.sin(t * Math.PI * 3) * 0.3 + t });
      raios(c, q, [0xffa060, 0xffffff], 5, 0.9 * e, 200);
      ondaDeChoque(c, q, 0xff8a40, 0.9 * e, 300, 'clarao');
    },
  }),
  'fogo+veneno': () => ({
    // A chama verde: o gás que pega fogo, bolhas que estouram em labareda.
    nome: 'Chama pestilenta',
    cor: 0x9ae040,
    fio: [chamaViva(1, { cores: CHAMA_VERDE, escala: [0.4, 0.1] }), bolhas(1, 0x9ae05a)],
    estouro: [chamaViva(5, { cores: CHAMA_VERDE }), bolhas(5, 0xa8f060, { aoMorrer: [chamaViva(1, { cores: CHAMA_VERDE, escala: [0.35, 0.1] })] })],
    gesto: (c, q, _de, e) => {
      ondaDeChoque(c, q, 0x8ae040, 1.1 * e, 420);
      c.particulas.emitirLista([chamaViva(8, { forma: 'anel', direcao: 'cima', raio: 26 * e, cores: CHAMA_VERDE })], q.x, q.y, 0x9ae040);
      c.marca('poca_veneno', q.x, q.y, 0x3a6a1a, 0.9 * e, 2200);
    },
  }),
  'fogo+psiquico': () => ({
    // A chama da mente: o fogo magenta e runas que ardem; no alvo, um olho que se abre em chamas.
    nome: 'Chama da mente',
    cor: 0xff70d0,
    fio: [chamaViva(1, { cores: CHAMA_MENTE, escala: [0.4, 0.1] }), runas(1, 0xff9a60)],
    estouro: [chamaViva(4, { cores: CHAMA_MENTE }), runas(3, 0xffa070)],
    gesto: (c, q, _de, e) => {
      brotar(c, q, 'olho', 0xff70c0, 0.9 * e, 620, true);
      c.particulas.emitirLista([chamaViva(6, { forma: 'anel', raio: 20 * e, cores: CHAMA_MENTE })], q.x, q.y, 0xff70d0);
      ondaDeChoque(c, q, 0xe07ad8, 0.8 * e, 360, 'onda_som', false);
    },
  }),
  'fogo+trevas': () => ({
    // O fogo negro: a labareda escura de borda roxa, que não ilumina; mãos de osso em chamas.
    nome: 'Fogo negro',
    cor: 0x8a3ac8,
    fio: [chamaViva(1, { cores: CHAMA_NEGRA, aditivo: false, escala: [0.45, 0.1] }), brasas(1, { cores: [0xe0b0ff, 0x8a3ac8, 0x2a0a3a] })],
    estouro: [chamaViva(6, { cores: CHAMA_NEGRA, aditivo: false }), brasas(5, { cores: [0xe0b0ff, 0x8a3ac8, 0x2a0a3a] }), almas(2, 0xb070ff)],
    gesto: (c, q, _de, e) => {
      sombra(c, q, 'clarao', 0x1a0828, 1.6 * e, 420);
      brotar(c, q, 'mao_ossea', 0x6a3a9a, 1 * e, 640);
      c.particulas.emitirLista([chamaViva(4, { cores: CHAMA_NEGRA, aditivo: false, raio: 6 })], q.x, q.y, 0x5a2080);
      c.marca('queimado', q.x, q.y, 0x120818, 1 * e, 2600);
    },
  }),
  'fogo+sagrado': () => ({
    // O fogo solar: chamas brancas e douradas; o sol desce em coluna sobre o alvo.
    nome: 'Fogo solar',
    cor: 0xffd040,
    fio: [chamaViva(1, { cores: CHAMA_SOL, escala: [0.4, 0.1] }), cintilar(1, { raio: 6 })],
    estouro: [chamaViva(5, { cores: CHAMA_SOL }), cintilar(5), em({ textura: 'estrela', quantidade: 3, vidaMs: [400, 600], velocidade: [40, 100], direcao: 'cima', gravidade: 160, escala: [0.3, 0.12], alpha: [1, 0], aditivo: true, raio: 6, cor: 0xffe070, giro: [-6, 6] })],
    gesto: (c, q, _de, e) => {
      tween(c, { textura: 'feixe', de: q, s: [0.7 * e, 0.3], sy: [2.4, 0.4], rot: [Math.PI / 2, Math.PI / 2], a: [0.95, 0], cor: 0xfff0b0, aditivo: true, ms: 360, subir: -20 });
      clarao(c, q, 0xffe080, 1.6 * e, 240);
      ondaDeChoque(c, q, 0xffc040, 1.1 * e, 420);
    },
  }),
  'fisico+fogo': () => ({
    // O metal fundido: estilhaços em brasa e gotas de aço laranja.
    nome: 'Metal fundido',
    cor: 0xff8a30,
    fio: [lascas(1, METAL_FUNDIDO, { aditivo: true, velocidade: [20, 60] }), brasas(1)],
    estouro: [lascas(6, METAL_FUNDIDO, { aditivo: true, esticar: 0.4 }), gotas(4, METAL_FUNDIDO), faiscasMetal(6, { cores: [0xffffff, 0xffb060, 0xff5010] })],
    gesto: (c, q, de, e) => {
      arcoDeGolpe(c, de, q, 0xff8a30, 0.9 * e, 1, 220);
      clarao(c, q, 0xffc070, 1 * e, 160);
    },
  }),

  // ---------------- Gelo
  'gelo+raio': () => ({
    // O cristal condutor: o gelo violeta-claro com o raio saltando de lasca em lasca.
    nome: 'Granizo carregado',
    cor: 0xc8d0ff,
    fio: [cristais(1, [0xffffff, 0xd8d8ff, 0xa898ff], { aditivo: true, velocidade: [20, 50], gravidade: 120 }), centelhas(1, 0xe6dcff)],
    estouro: [cristais(6, [0xffffff, 0xd8d8ff, 0xa898ff], { aditivo: true, aoMorrer: [centelhas(1, 0xe6dcff, { velocidade: [40, 90] })] }), arcos(3, 0xc0b0ff)],
    gesto: (c, q, _de, e) => {
      coroa(c, q, 'estilhaco', 0xd0d8ff, 4, 0.5, 0.75 * e, true);
      const a = { x: q.x - 0.5, y: q.y - 0.3 };
      const b = { x: q.x + 0.5, y: q.y + 0.3 };
      relampago(c, () => a, () => b, 0xd8ccff, 260, 0.5);
    },
  }),
  'gelo+veneno': () => ({
    // O gelo tóxico: cristais verde-água e bolhas congeladas que caem; espinhos verdes brotam.
    nome: 'Gelo tóxico',
    cor: 0x8af0c0,
    fio: [cristais(1, [0xe0fff0, 0x8af0c0, 0x3aa070], { velocidade: [20, 50], gravidade: 120 }), bolhas(1, 0xb0ffe0, { gravidade: 60 })],
    estouro: [cristais(5, [0xe0fff0, 0x8af0c0, 0x3aa070]), bolhas(4, 0xb0ffe0, { gravidade: 80, direcao: 'livre', velocidade: [30, 80] }), nevoa(2, { cor: 0x9ae0b0 })],
    gesto: (c, q, _de, e) => {
      coroa(c, q, 'espinho', 0x7ae0a8, 5, 0.45, 0.8 * e);
      c.marca('geada', q.x, q.y, 0xa8f0c8, 0.9 * e, 2200, true);
      c.marca('poca_veneno', q.x, q.y, 0x3a8a5a, 0.7 * e, 2200);
    },
  }),
  'gelo+psiquico': () => ({
    // O prisma: o cristal que quebra a luz em cores; feixes coloridos saem do alvo.
    nome: 'Prisma',
    cor: 0xd0c0ff,
    fio: [cristais(1, PRISMA, { aditivo: true, velocidade: [10, 40], gravidade: 60 })],
    estouro: [cristais(7, PRISMA, { aditivo: true }), cintilar(4, { cores: PRISMA })],
    gesto: (c, q, _de, e) => {
      brotar(c, q, 'estilhaco', 0xffffff, 1.1 * e, 640, true);
      raios(c, q, PRISMA, 6, 1.1 * e, 300);
      ondaDeChoque(c, q, 0xe0b0ff, 0.8 * e, 360, 'onda_som', false);
    },
  }),
  'gelo+terra': () => ({
    // O permafrost: a rocha coberta de geada, lascas brancas e o chão que trinca em branco.
    nome: 'Permafrost',
    cor: 0xa8c4d8,
    fio: [pedras(1, 0xa8c0d0, { velocidade: [20, 50], gravidade: 200 }), em({ textura: 'floco', quantidade: 1, vidaMs: [400, 700], velocidade: [10, 30], gravidade: 20, escala: [0.3, 0.1], alpha: [1, 0], raio: 6, cor: 0xe8f6ff })],
    estouro: [pedras(5, 0x9ab8cc, { cores: [0xffffff, 0x9ab8cc, 0x5a6a78] }), cristais(4, [0xffffff, 0xd8f0ff]), poeira(3, { cor: 0xd8e8f0 })],
    gesto: (c, q, _de, e) => {
      coroa(c, q, 'rocha', 0xb8d0e0, 3, 0.4, 0.8 * e);
      ondaDeChoque(c, q, 0xe0f4ff, 1 * e, 420, 'rachadura');
      c.marca('geada', q.x, q.y, 0xd8f0ff, 1.1 * e, 2600, true);
      c.tremor('leve');
    },
  }),
  'gelo+trevas': () => ({
    // O frio da tumba: flocos escuros, gelo negro e almas azuladas que sobem do alvo.
    nome: 'Gelo da tumba',
    cor: 0x7a80d8,
    fio: [em({ textura: 'floco', quantidade: 1, vidaMs: [500, 800], velocidade: [10, 30], gravidade: 10, escala: [0.35, 0.15], alpha: [1, 0], raio: 6, cor: 0x302850 }), almas(1, 0x90b0ff, { escala: [0.2, 0.3] })],
    estouro: [cristais(5, [0x9098e0, 0x403868, 0x181028]), almas(3, 0x90b0ff), em({ textura: 'floco', quantidade: 5, vidaMs: [600, 900], velocidade: [30, 80], gravidade: 30, escala: [0.4, 0.15], alpha: [1, 0], raio: 8, cor: 0x302850, giro: [-3, 3] })],
    gesto: (c, q, _de, e) => {
      sombra(c, q, 'clarao', 0x10102a, 1.4 * e, 460);
      coroa(c, q, 'estilhaco', 0x4a4a8a, 4, 0.4, 0.8 * e);
      c.marca('geada', q.x, q.y, 0x6a70c0, 1 * e, 2400, true);
    },
  }),
  'gelo+sagrado': () => ({
    // O diamante: o gelo que vira luz; neve que cintila e um cristal puro no alvo.
    nome: 'Diamante',
    cor: 0xf0f8ff,
    fio: [cintilar(1, { cor: 0xe8f6ff, raio: 6 }), em({ textura: 'floco', quantidade: 1, vidaMs: [400, 700], velocidade: [10, 30], gravidade: 20, escala: [0.3, 0.1], alpha: [1, 0], aditivo: true, raio: 6, cor: 0xfff8e0 })],
    estouro: [cristais(6, [0xffffff, 0xfff4d0, 0xd8f0ff], { aditivo: true }), cintilar(6, { cor: 0xfff8e0 })],
    gesto: (c, q, _de, e) => {
      brotar(c, q, 'estilhaco', 0xffffff, 1.2 * e, 700, true);
      raios(c, q, [0xffffff, 0xfff0b0], 6, 0.9 * e, 280);
      ondaDeChoque(c, q, 0xfff4d0, 1 * e, 420);
    },
  }),
  'fisico+gelo': () => ({
    // As lâminas de gelo: cortes azuis e estilhaços que voam.
    nome: 'Lâmina de gelo',
    cor: 0xbfe6ff,
    fio: [em({ textura: 'lamina', quantidade: 1, vidaMs: [200, 340], velocidade: [20, 60], escala: [0.3, 0.15], alpha: [0.9, 0], aditivo: true, raio: 4, cor: 0xdff4ff, giro: [-10, 10] })],
    estouro: [lascas(6, [0xffffff, 0xdff4ff, 0x9fdcff], { aditivo: true }), cristais(3, [0xffffff, 0xbfe6ff])],
    gesto: (c, q, de, e) => {
      arcoDeGolpe(c, de, q, 0xbfe6ff, 0.9 * e, 1, 220);
      arcoDeGolpe(c, de, q, 0xffffff, 0.7 * e, -1, 240);
    },
  }),

  // ---------------- Raio
  'raio+veneno': () => ({
    // A descarga ácida: faíscas verde-limão e gotas que chiam ao cair.
    nome: 'Descarga ácida',
    cor: 0xc0ff40,
    fio: [centelhas(1, 0xd8ff60), gotas(1, [0xe0ff80, 0x8ad030], { velocidade: [10, 40] })],
    estouro: [centelhas(7, 0xd8ff60), gotas(5, [0xe0ff80, 0x8ad030], { aoMorrer: [centelhas(1, 0xd8ff60, { velocidade: [30, 80] })] }), arcos(3, 0xb0ff40)],
    gesto: (c, q, de, e) => {
      if (de) relampago(c, () => de, () => q, 0xc0ff40, 220, 0.6);
      ondaDeChoque(c, q, 0x9ae040, 0.9 * e, 380, 'poca_veneno');
    },
  }),
  'psiquico+raio': () => ({
    // A sinapse: arcos rosa que se ligam como neurônios em volta do alvo.
    nome: 'Sinapse',
    cor: 0xff90f0,
    fio: [arcos(1, 0xff90f0), runas(1, 0xd0a0ff, { escala: [0.15, 0.3] })],
    estouro: [arcos(4, 0xff90f0), centelhas(5, 0xffc0f8), runas(2, 0xd0a0ff)],
    gesto: (c, q, _de, e) => {
      const nos = [0, 1, 2].map((k) => ({ x: q.x + Math.cos((k / 3) * Math.PI * 2) * 0.7 * e, y: q.y + Math.sin((k / 3) * Math.PI * 2) * 0.7 * e }));
      nos.forEach((n, k) => {
        const prox = nos[(k + 1) % nos.length] ?? q;
        relampago(c, () => n, () => prox, 0xff9af0, 280, 0.4);
      });
      brotar(c, q, 'olho', 0xffa0f0, 0.6 * e, 480, true);
    },
  }),
  'raio+terra': () => ({
    // O fulgurito: o raio cai do alto e vitrifica o chão; veios violeta e cacos de vidro.
    nome: 'Fulgurito',
    cor: 0xd0b8ff,
    fio: [centelhas(1, 0xe6dcff), em({ textura: 'lasca', quantidade: 1, vidaMs: [300, 500], velocidade: [20, 50], gravidade: 300, escala: [0.3, 0.15], alpha: [1, 0], raio: 4, cor: 0xc8a878 })],
    estouro: [lascas(6, [0xffffff, 0xe0d0ff, 0x9a8ac0], { aditivo: true }), poeira(4, { cor: 0xc8a878 }), centelhas(4, 0xe6dcff)],
    gesto: (c, q, _de, e) => {
      cair(c, q, 'arco', 0xe6dcff, { altura: 220, ms: 140, tamanho: 1.4 * e, aditivo: true, aoChegar: () => { ondaDeChoque(c, q, 0xc0a0ff, 1.1 * e, 520, 'rachadura'); clarao(c, q, 0xffffff, 1.3 * e, 140); c.tremor('leve'); } });
      c.marca('rachadura', q.x, q.y, 0xb89cff, 1 * e, 2000, true);
    },
  }),
  'raio+trevas': () => ({
    // O relâmpago negro: arcos escuros de borda violeta, que apagam a luz em volta.
    nome: 'Relâmpago negro',
    cor: 0x6a3aa8,
    fio: [arcos(1, 0x2a1040, { aditivo: false }), centelhas(1, 0xb08ae8)],
    estouro: [arcos(4, 0x200a30, { aditivo: false }), centelhas(5, 0xb08ae8), fumacaEscura(3, { cor: 0x1a1022 })],
    gesto: (c, q, de, e) => {
      sombra(c, q, 'clarao', 0x0a0414, 1.3 * e, 300);
      if (de) relampago(c, () => de, () => q, 0x8a5ac8, 240, 0.8);
      ondaDeChoque(c, q, 0x8a5ac8, 0.8 * e, 300);
    },
  }),
  'raio+sagrado': () => ({
    // O raio divino: arcos dourados e o círculo de luz onde o raio cai.
    nome: 'Raio divino',
    cor: 0xffe070,
    fio: [arcos(1, 0xffe070), cintilar(1, { raio: 6 })],
    estouro: [arcos(4, 0xffe070), cintilar(5), centelhas(5, 0xfff4c0)],
    gesto: (c, q, _de, e) => {
      cair(c, q, 'arco', 0xfff0a0, { altura: 220, ms: 140, tamanho: 1.3 * e, aditivo: true, aoChegar: () => { clarao(c, q, 0xffe080, 1.5 * e, 200); } });
      circuloNoChao(c, () => q, 'circulo_runico', OURO, 1.2 * e, 620, 1.2);
    },
  }),
  'fisico+raio': () => ({
    // O aço carregado: o golpe que solta faíscas violeta.
    nome: 'Aço carregado',
    cor: 0xc8b8ff,
    fio: [centelhas(1, 0xe6dcff), lascas(1, [0xffffff, 0xd8dde4])],
    estouro: [faiscasMetal(6, { cores: [0xffffff, 0xd8ccff, 0x9a7aff] }), arcos(3, 0xc0b0ff), lascas(3, [0xffffff, 0xd8dde4])],
    gesto: (c, q, de, e) => {
      arcoDeGolpe(c, de, q, 0xc8b8ff, 0.9 * e, 1, 200);
      raios(c, q, [0xe6dcff], 4, 0.7 * e, 180);
    },
  }),

  // ---------------- Veneno
  'psiquico+veneno': () => ({
    // O alucinógeno: bolhas furta-cor que giram em espiral; um olho verde se abre.
    nome: 'Alucinógeno',
    cor: 0xc0a0ff,
    fio: [bolhas(1, 0xc0a0ff, { cores: [0xff80e0, 0x80ffc0, 0xa080ff] })],
    estouro: [bolhas(7, 0xc0a0ff, { cores: [0xff80e0, 0x80ffc0, 0xa080ff], forma: 'espiral', direcao: 'fora', velocidade: [30, 70], raio: 14 }), runas(2, 0x9af0a0)],
    gesto: (c, q, _de, e) => {
      brotar(c, q, 'olho', 0x8ae060, 0.85 * e, 620, true);
      orbitar(c, () => q, 'bolha', 0xff90e0, { n: 5, raio: 0.6 * e, ms: 620, voltas: 1.2, tamanho: 0.45, aditivo: true });
    },
  }),
  'terra+veneno': () => ({
    // O lodo do pântano: gotas de lama verde, bolhas que estouram, a poça e o musgo que brota.
    nome: 'Lodo',
    cor: 0x7a8a30,
    fio: [gotas(1, [0x9aa040, 0x5a6a20], { velocidade: [10, 40] }), bolhas(1, 0x8a9a3a)],
    estouro: [gotas(7, [0xa8b048, 0x6a7a2a, 0x3a3a18]), bolhas(4, 0x8a9a3a), poeira(2, { cor: 0x6a6a3a })],
    gesto: (c, q, _de, e) => {
      c.marca('poca_veneno', q.x, q.y, 0x4a5a20, 1.2 * e, 2800);
      coroa(c, q, 'espinho', 0x5a7a2a, 3, 0.4, 0.6 * e);
      ondaDeChoque(c, q, 0x8a9a3a, 0.8 * e, 420, 'poca_veneno');
    },
  }),
  'trevas+veneno': () => ({
    // A praga: a névoa verde-escura, almas doentes e o enxame de moscas em volta.
    nome: 'Praga',
    cor: 0x6a9a3a,
    fio: [nevoa(1, { cor: 0x3a5a2a }), em({ textura: 'ponto', quantidade: 1, vidaMs: [400, 700], velocidade: [20, 50], escala: [0.25, 0.2], alpha: [1, 0], raio: 8, cor: 0x101010, turbulencia: 90 })],
    estouro: [nevoa(4, { cor: 0x3a5a2a }), almas(3, 0x80e060), em({ textura: 'ponto', quantidade: 8, vidaMs: [700, 1100], velocidade: [20, 60], escala: [0.25, 0.2], alpha: [1, 0], raio: 14, cor: 0x101010, turbulencia: 120 })],
    gesto: (c, q, _de, e) => {
      brotar(c, q, 'cranio', 0x7ab04a, 0.8 * e, 680);
      c.marca('poca_veneno', q.x, q.y, 0x2a3a1a, 1 * e, 2600);
    },
  }),
  'sagrado+veneno': () => ({
    // O elixir: gotas douradas que brilham, bolhas de ouro e o halo do remédio que também mata.
    nome: 'Elixir',
    cor: 0xffd860,
    fio: [gotas(1, [0xfff4c0, 0xffd860], { aditivo: true, velocidade: [10, 40] }), bolhas(1, 0xffe080, { aditivo: true })],
    estouro: [gotas(6, [0xfff4c0, 0xffd860, 0x9ad040], { aditivo: true }), bolhas(4, 0xffe080, { aditivo: true }), cintilar(4)],
    gesto: (c, q, _de, e) => {
      brotar(c, q, 'gota_viva', 0xffe080, 1 * e, 620, true);
      ondaDeChoque(c, q, 0xc8e060, 1 * e, 420, 'clarao');
    },
  }),
  'fisico+veneno': () => ({
    // A lâmina envenenada: o corte verde que pinga.
    nome: 'Lâmina envenenada',
    cor: 0x8ad040,
    fio: [gotas(1, [0xb0f060, 0x5a9a2a], { velocidade: [10, 30] })],
    estouro: [gotas(6, [0xb0f060, 0x5a9a2a]), lascas(3, [0xffffff, 0xd8dde4])],
    gesto: (c, q, de, e) => {
      arcoDeGolpe(c, de, q, 0x8ad040, 0.9 * e, 1, 220);
      c.marca('poca_veneno', q.x, q.y, 0x4a9a3a, 0.6 * e, 2000);
    },
  }),

  // ---------------- Psíquico
  'psiquico+terra': () => ({
    // A geomancia: pedras que flutuam e giram em volta do alvo, com runas acesas.
    nome: 'Monólito',
    cor: 0xc89ac8,
    fio: [pedras(1, 0x8a7a8a, { gravidade: -20, velocidade: [10, 30], direcao: 'cima' }), runas(1, 0xe07ad8, { escala: [0.15, 0.3] })],
    estouro: [pedras(5, 0x8a7a8a, { gravidade: -40, velocidade: [40, 90], arrasto: 1.5 }), runas(3, 0xe07ad8)],
    gesto: (c, q, _de, e) => {
      orbitar(c, () => q, 'rocha', 0x9a8a9a, { n: 4, raio: 0.8 * e, ms: 700, voltas: 0.8, tamanho: 0.7 });
      circuloNoChao(c, () => q, 'circulo_runico', 0xe07ad8, 1.1 * e, 700, 0.8);
    },
  }),
  'psiquico+trevas': () => ({
    // O pesadelo: olhos que se abrem na fumaça escura e a mão que sai da sombra.
    nome: 'Pesadelo',
    cor: 0xb05ad0,
    fio: [fumacaEscura(1, { cor: 0x1a0a22, escala: [0.3, 0.8] }), em({ textura: 'olho', quantidade: 1, vidaMs: [300, 500], escala: [0.15, 0.3], curvaEscala: 'pulso', alpha: [1, 0], aditivo: true, raio: 10, cor: 0xff60c0 })],
    estouro: [fumacaEscura(4, { cor: 0x1a0a22 }), em({ textura: 'olho', quantidade: 3, vidaMs: [400, 700], velocidade: [10, 30], escala: [0.2, 0.4], curvaEscala: 'pulso', alpha: [1, 0], aditivo: true, raio: 18, cor: 0xff60c0 })],
    gesto: (c, q, _de, e) => {
      sombra(c, q, 'fumaca1', 0x120818, 1.4 * e, 600);
      brotar(c, q, 'olho', 0xd050a0, 1 * e, 640, true);
      brotar(c, { x: q.x + 0.3, y: q.y + 0.1 }, 'mao_ossea', 0x5a3a7a, 0.7 * e, 600, false, 80);
    },
  }),
  'psiquico+sagrado': () => ({
    // A epifania: o olho dourado e os raios de revelação.
    nome: 'Epifania',
    cor: 0xffd0a0,
    fio: [cintilar(1, { raio: 6, cor: 0xffe0c0 }), runas(1, 0xffd080, { escala: [0.15, 0.3] })],
    estouro: [cintilar(5, { cor: 0xffe0c0 }), runas(3, 0xffd080)],
    gesto: (c, q, _de, e) => {
      brotar(c, q, 'olho', 0xffd870, 1 * e, 640, true);
      raios(c, q, [0xffe080, 0xffa0e0], 8, 1 * e, 320);
      ondaDeChoque(c, q, 0xffd080, 0.9 * e, 380, 'onda_som', false);
    },
  }),
  'fisico+psiquico': () => ({
    // A telecinese: estilhaços que orbitam o alvo antes de cair.
    nome: 'Telecinese',
    cor: 0xe8a8e0,
    fio: [lascas(1, [0xffffff, 0xf0c0f0], { gravidade: -20, velocidade: [10, 30] })],
    estouro: [lascas(5, [0xffffff, 0xf0c0f0], { gravidade: -30, arrasto: 1.6 }), em({ textura: 'onda_som', quantidade: 2, vidaMs: [300, 450], velocidade: [60, 120], direcao: 'fora', forma: 'anel', escala: [0.3, 0.8], alpha: [1, 0], aditivo: true, raio: 6, cor: 0xe07ad8 })],
    gesto: (c, q, _de, e) => {
      orbitar(c, () => q, 'estilhaco', 0xf0c8f0, { n: 5, raio: 0.6 * e, ms: 520, voltas: 1.4, tamanho: 0.55, aditivo: true, rastro: 2 });
    },
  }),

  // ---------------- Terra, trevas e sagrado
  'terra+trevas': () => ({
    // A obsidiana: cacos negros vítreos com brilho roxo; espinhos de vidro escuro brotam.
    nome: 'Obsidiana',
    cor: 0x5a3a7a,
    fio: [lascas(1, [0x403050, 0x1a1020], { velocidade: [20, 50] }), almas(1, 0x9a70d0, { escala: [0.2, 0.3] })],
    estouro: [lascas(6, [0x6a5080, 0x2a1a38, 0x100810]), pedras(3, 0x2a2030), almas(2, 0x9a70d0)],
    gesto: (c, q, _de, e) => {
      coroa(c, q, 'espinho', 0x2a1a3a, 5, 0.45, 0.9 * e);
      ondaDeChoque(c, q, 0x8a5ac8, 0.8 * e, 380, 'rachadura');
      c.tremor('leve');
    },
  }),
  'sagrado+terra': () => ({
    // O âmbar: a pedra dourada translúcida, que guarda a luz; poeira de ouro.
    nome: 'Âmbar',
    cor: 0xffb040,
    fio: [cristais(1, [0xffe0a0, 0xffb040, 0xa86010], { aditivo: true, velocidade: [20, 50], gravidade: 200 })],
    estouro: [cristais(6, [0xffe0a0, 0xffb040, 0xa86010], { aditivo: true }), poeira(3, { cor: 0xe0b060 }), cintilar(3)],
    gesto: (c, q, _de, e) => {
      coroa(c, q, 'estilhaco', 0xffb848, 4, 0.4, 0.85 * e, true);
      ondaDeChoque(c, q, 0xffc860, 1 * e, 420, 'rachadura');
    },
  }),
  'fisico+terra': () => ({
    // O cascalho: a pancada que levanta pedra e lasca.
    nome: 'Cascalho',
    cor: 0xb8a080,
    fio: [em({ textura: 'lasca', quantidade: 1, vidaMs: [300, 500], velocidade: [20, 50], gravidade: 300, escala: [0.3, 0.15], alpha: [1, 0], raio: 4, cor: 0x9a8a70 })],
    estouro: [pedras(6, 0x8a7a68), lascas(3, [0xd8dde4, 0x8a7a68]), poeira(4)],
    gesto: (c, q, _de, e) => {
      ondaDeChoque(c, q, 0xb8a080, 1 * e, 380, 'rachadura');
      c.tremor('leve');
    },
  }),
  'sagrado+trevas': (d) => ({
    // O eclipse: o disco negro com a coroa dourada; quando a luz domina, a coroa se abre em raios.
    nome: 'Eclipse',
    cor: 0xffd070,
    fio: [cintilar(1, { raio: 6 }), fumacaEscura(1, { cor: 0x1a1022, escala: [0.2, 0.6] })],
    estouro: [cintilar(6, { forma: 'anel', direcao: 'fora', velocidade: [40, 90], raio: 18 }), fumacaEscura(3, { cor: 0x120a18 })],
    gesto: (c, q, _de, e) => {
      tween(c, { textura: 'clarao', de: q, s: [0.8 * e, 2 * e], a: [1, 0], cor: 0xffd070, aditivo: true, ms: 520 });
      sombra(c, q, 'clarao', 0x05030a, 1.3 * e, 520);
      if (d === 'sagrado') raios(c, q, [0xffe080], 8, 1.2 * e, 360);
    },
  }),
  'fisico+trevas': () => ({
    // A lâmina sombria: o corte roxo que deixa fumaça e uma alma escapando.
    nome: 'Lâmina sombria',
    cor: 0x8a5ac8,
    fio: [fumacaEscura(1, { cor: 0x2a1a38, escala: [0.2, 0.6] })],
    estouro: [lascas(4, [0xb08ae8, 0x3a2050]), almas(2, 0xb08ae8), fumacaEscura(2, { cor: 0x1a1022 })],
    gesto: (c, q, de, e) => {
      arcoDeGolpe(c, de, q, 0x8a5ac8, 0.95 * e, 1, 230);
      sombra(c, q, 'choque', 0x1a0a28, 0.9 * e, 300);
    },
  }),
  'fisico+sagrado': () => ({
    // O aço consagrado: o golpe dourado que solta estrelas.
    nome: 'Aço consagrado',
    cor: 0xffe08a,
    fio: [cintilar(1, { raio: 4 })],
    estouro: [faiscasMetal(5, { cores: [0xffffff, 0xfff0b0, 0xffc040] }), em({ textura: 'estrela', quantidade: 3, vidaMs: [400, 600], velocidade: [40, 100], direcao: 'cima', gravidade: 160, escala: [0.3, 0.12], alpha: [1, 0], aditivo: true, raio: 6, cor: 0xffe070, giro: [-6, 6] })],
    gesto: (c, q, de, e) => {
      arcoDeGolpe(c, de, q, 0xffe08a, 0.9 * e, 1, 220);
      clarao(c, q, 0xfff0b0, 1.1 * e, 160);
    },
  }),
};

export const chaveDaLiga = (a: Runa, b: Runa): string => [a, b].sort().join('+');

/** A liga de dois elementos (com o dominante, o do núcleo); null quando o par não tem liga (o vento, por enquanto). */
export function ligaDe(a: Runa, b: Runa, dominante: Runa): LigaDoPar | null {
  const l = LIGAS[chaveDaLiga(a, b)]?.(dominante);
  return l ? { ...l, par: [a, b], trans: MATERIA_DAS_LIGAS[l.nome] ?? null } : null;
}

/** A área de uma liga: a onda no tom dela, o estouro em algumas células e o gesto no centro (e em mais uma célula). */
export function ligaNaArea(c: CenaVfx, l: Liga, a: AreaVfx, quantas: number): void {
  if (l.naArea) {
    l.naArea(c, a);
    return;
  }
  const raio = Math.max(1, a.raio);
  ondaDeChoque(c, a.centro, l.cor, raio + 0.3, 460);
  for (const q of sortear(a.celulas, quantas)) c.particulas.emitirLista(l.estouro, q.x, q.y, l.cor);
  l.gesto(c, a.centro, a.origem, Math.min(1.6, 0.8 + raio * 0.25) * a.escala);
  if (c.reduzido) return;
  const outra = sortear(a.celulas.filter((q) => Math.hypot(q.x - a.centro.x, q.y - a.centro.y) > 0.9), 1)[0];
  if (outra) l.gesto(c, outra, null, 0.7 * a.escala);
}
