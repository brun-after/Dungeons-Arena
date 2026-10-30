// Assinaturas do básico das armas de classe (marco 27, 29/10/2026, D-126). Cada uma das 40 armas (e os básicos de
// base do solo e do bumerangue) tem um desenho próprio no acerto e, nas de longe, o corpo em voo: o machado varre em
// arco largo, a lança risca a estocada, a maça racha o chão, a besta deixa lascas, o tomo das marés espirra água, o
// cajado de ossos abre o solo com ossos, o chakram gira faiscando. A raridade da arma na mão (`tier`: Comum 0, Épica
// 1, Lendária 2, Última 3) soma camadas: o brilho, a marca no chão com a matéria, o clarão e o anel na cor.

import type { AssinaturaVisual } from '../../../combat/assinaturas-visuais';
import type { Emissao } from '../../presets-particula';
import { arcoDeGolpe, circuloNoChao, clarao, feixe, ondaDeChoque, orbitar, tween } from '../blocos';
import type { Acerto, CenaVfx, DefAssinatura, FamiliaVfx } from '../cena';
import { brasas, cintilar, em, faiscasMetal, fumacaEscura, poeira } from '../emissoes';
import { sai } from '../pincel';
import type { TexturaRica } from '../texturas';

type Silhueta = 'corte' | 'pesado' | 'estocada' | 'tremor' | 'impacto' | 'runa' | 'onda' | 'orbe' | 'feixe' | 'solo' | 'giro';

interface Spec {
  familia: FamiliaVfx;
  cor: number;
  silhueta: Silhueta;
  /** O corpo em voo (as de longe) e o rastro. */
  corpo?: readonly Emissao[];
  rastro?: readonly Emissao[];
  impacto: readonly Emissao[];
  /** A matéria da marca no chão (da Lendária para cima). */
  marca: TexturaRica;
}

const lascas = (n: number, cor = 0xb08d5a) => em({ textura: 'lasca', quantidade: n, vidaMs: [220, 380], velocidade: [60, 140], gravidade: 420, arrasto: 0.4, escala: [0.45, 0.25], alpha: [1, 0], raio: 3, cor, giro: [-8, 8] });
const gotas = (n: number, cor: number) => em({ textura: 'gota_viva', quantidade: n, vidaMs: [300, 520], velocidade: [70, 160], direcao: 'cima', abertura: 1.2, gravidade: 520, escala: [0.22, 0.12], alpha: [1, 0.3], raio: 4, cor, esticar: 0.2 });
const ossos = (n: number) => em({ textura: 'osso', quantidade: n, vidaMs: [450, 700], velocidade: [80, 180], direcao: 'cima', abertura: 1.1, gravidade: 600, escala: [0.26, 0.2], alpha: [1, 0.6], raio: 8, cor: 0xece4d0, giro: [-10, 10] });
const almas = (n: number, cor: number | null = null) => em({ textura: 'alma', quantidade: n, vidaMs: [600, 900], velocidade: [20, 60], direcao: 'cima', gravidade: -50, escala: [0.3, 0.45], alpha: [0.9, 0], aditivo: true, raio: 10, cor });
const runas = (n: number) => em({ textura: 'runa2', quantidade: n, vidaMs: [500, 800], velocidade: [10, 30], direcao: 'cima', escala: [0.25, 0.4], alpha: [1, 0], aditivo: true, raio: 12, cor: null });
const laminas = (n: number) => em({ textura: 'lamina', quantidade: n, vidaMs: [260, 420], velocidade: [100, 200], arrasto: 1, escala: [0.38, 0.26], alpha: [1, 0], raio: 4, cor: 0xe8eef4, giro: [-14, 14] });
const estrelas = (n: number, cor: number) => em({ textura: 'estrela', quantidade: n, vidaMs: [400, 620], velocidade: [40, 100], direcao: 'cima', gravidade: 160, escala: [0.32, 0.14], alpha: [1, 0], aditivo: true, raio: 6, cor, giro: [-6, 6] });
const penas = (n: number) => em({ textura: 'pena', quantidade: n, vidaMs: [600, 900], velocidade: [40, 110], gravidade: 40, arrasto: 1.5, escala: [0.4, 0.3], alpha: [1, 0], raio: 6, cor: 0xe8e0d0, giro: [-4, 4] });

const flecha = (cor = 0xd8c39a, escala = 0.8) => [em({ textura: 'flecha', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [escala, escala], alpha: [1, 0.85], cor })];
const dardo = (cor: number, escala = 0.7) => [em({ textura: 'brilho', quantidade: 1, vidaMs: [40, 50], escala: [escala, escala], alpha: [1, 0.9], aditivo: true, cor }), em({ textura: 'runa', quantidade: 1, vidaMs: [40, 50], escala: [0.35, 0.35], alpha: [0.8, 0.6], aditivo: true, cor })];
const giratorio = (textura: 'lamina' | 'estilhaco' | 'arco_golpe', cor: number, escala = 0.55) => [em({ textura, quantidade: 1, vidaMs: [40, 50], escala: [escala, escala], alpha: [1, 0.9], cor, giro: [24, 30] })];
const esteira = (cor: number | null = null) => [em({ textura: 'faisca', quantidade: 2, vidaMs: [140, 220], velocidade: [-30, -10], direcao: 'orientada', escala: [0.5, 0.15], alpha: [0.6, 0], aditivo: true, raio: 1, cor })];

const angulo = (c: CenaVfx, de: { x: number; y: number }, ate: { x: number; y: number }) => {
  const a = c.tela(de);
  const b = c.tela(ate);
  return Math.atan2(b.y - a.y, b.x - a.x);
};

/** A silhueta do acerto, pela natureza do básico. */
function silhueta(c: CenaVfx, a: Acerto, s: Spec, esc: number): void {
  const cor = s.cor;
  switch (s.silhueta) {
    case 'corte':
      arcoDeGolpe(c, a.de, a.ate, cor, esc);
      break;
    case 'pesado':
      arcoDeGolpe(c, a.de, a.ate, cor, 1.4 * esc, 1, 240);
      ondaDeChoque(c, a.ate, cor, 0.8 * esc, 320);
      break;
    case 'estocada':
      if (a.de) feixe(c, a.de, a.ate, cor, 0.5 * esc, 200);
      clarao(c, a.ate, cor, 0.8 * esc, 120);
      break;
    case 'tremor':
      c.marca('rachadura', a.ate.x, a.ate.y, 0x5a4636, 0.9 * esc, 900);
      ondaDeChoque(c, a.ate, cor, 1.1 * esc, 380);
      break;
    case 'impacto':
      clarao(c, a.ate, cor, 1 * esc, 140);
      break;
    case 'runa':
      circuloNoChao(c, () => a.ate, 'circulo_runico', cor, 1.6 * esc, 600, 1.5);
      clarao(c, a.ate, cor, 1.4 * esc, 200);
      break;
    case 'onda':
      if (a.de) {
        const r = angulo(c, a.de, a.ate);
        tween(c, { textura: 'onda_som', de: a.de, para: a.ate, s: [0.6, 1.4 * esc], a: [0.9, 0], rot: [r + Math.PI / 2, r + Math.PI / 2], cor, aditivo: true, ms: 320, curva: sai });
      }
      break;
    case 'orbe':
      clarao(c, a.ate, cor, 1.2 * esc, 220);
      orbitar(c, () => c.ondeEsta(a.alvoId) ?? a.ate, 'cintilar', cor, { n: 3, raio: 0.5, ms: 420, tamanho: 0.4 });
      break;
    case 'feixe':
      if (a.de) feixe(c, a.de, a.ate, cor, 0.9 * esc, 320);
      break;
    case 'solo':
      c.marca('rachadura', a.ate.x, a.ate.y, cor, 0.7 * esc, 700, true);
      break;
    case 'giro':
      tween(c, { textura: 'lamina', de: a.ate, s: [0.5 * esc, 0.7 * esc], a: [1, 0], rot: [0, Math.PI * 3], cor: 0xe8eef4, ms: 300 });
      break;
  }
}

/** O que a raridade soma: o brilho (Épica), a marca com a matéria (Lendária) e o clarão com o anel (Última). */
function camadasDaRaridade(c: CenaVfx, a: Acerto, s: Spec): void {
  const tier = a.tier ?? 0;
  if (tier >= 1) c.particulas.emitirLista([cintilar(3 + tier * 2)], a.ate.x, a.ate.y, s.cor);
  if (tier >= 2) c.marca(s.marca, a.ate.x, a.ate.y, s.cor, 0.6 + 0.15 * tier, 900, s.marca !== 'rachadura');
  if (tier >= 3) {
    clarao(c, a.ate, s.cor, 2, 220);
    ondaDeChoque(c, a.ate, s.cor, 1.3, 420, 'choque', false);
    c.particulas.emitirLista([estrelas(4, s.cor)], a.ate.x, a.ate.y, s.cor);
  }
}

function assinatura(s: Spec): DefAssinatura {
  return {
    familia: s.familia,
    ...(s.corpo && { corpo: s.corpo }),
    ...(s.rastro && { rastro: s.rastro }),
    impacto: s.impacto,
    aoAcertar: (c, a) => {
      // O primeiro alvo leva a silhueta inteira; os da área, só o impacto e a raridade.
      const esc = a.escala * (1 + 0.12 * (a.tier ?? 0));
      if (a.indice === 0) silhueta(c, a, s, esc);
      camadasDaRaridade(c, a, s);
    },
  };
}

const lamina = (cor: number, sil: Silhueta, extra: readonly Emissao[] = []): Spec => ({ familia: 'fisico', cor, silhueta: sil, impacto: [faiscasMetal(5), ...extra], marca: 'rachadura' });
const arco = (cor: number, extra: readonly Emissao[] = [], corpoCor?: number): Spec => ({ familia: 'arqueiro', cor, silhueta: 'impacto', corpo: flecha(corpoCor), rastro: esteira(), impacto: [lascas(4), ...extra], marca: 'rachadura' });
const tomo = (cor: number, sil: Silhueta, extra: readonly Emissao[], corpo = true): Spec => ({ familia: 'arcano', cor, silhueta: sil, ...(corpo && { corpo: dardo(cor), rastro: esteira(cor) }), impacto: [runas(2), ...extra], marca: 'circulo_runico' });
const solo = (cor: number, extra: readonly Emissao[], marca: TexturaRica = 'poca_veneno'): Spec => ({ familia: 'trevas', cor, silhueta: 'solo', impacto: [fumacaEscura(3, { cor }), ...extra], marca });
const bumerangue = (cor: number, textura: 'lamina' | 'estilhaco' | 'arco_golpe', extra: readonly Emissao[] = []): Spec => ({ familia: 'vento', cor, silhueta: 'giro', corpo: giratorio(textura, cor), rastro: esteira(cor), impacto: [laminas(3), ...extra], marca: 'rachadura' });

const SPECS: Readonly<Record<string, Spec>> = {
  // Guerreiro.
  arma_machado: lamina(0xc0392b, 'pesado', [lascas(4, 0x8a6d3b)]),
  arma_lanca: lamina(0xd5dbe3, 'estocada'),
  arma_montante: lamina(0xbfc9ca, 'pesado', [poeira(4, { forma: 'ponto' })]),
  arma_espada: { ...lamina(0xecf0f1, 'corte'), corpo: giratorio('arco_golpe', 0xecf0f1, 0.7), rastro: esteira(0xecf0f1) },
  arma_maca: lamina(0xa04000, 'tremor', [poeira(6, { forma: 'ponto', direcao: 'cima' })]),
  arma_sabre: lamina(0xd5dbdb, 'corte', [em({ textura: 'corte', quantidade: 3, vidaMs: [200, 320], velocidade: [90, 160], escala: [0.5, 0.2], alpha: [0.8, 0], aditivo: true, raio: 4, cor: 0xe8f4ff })]),
  arma_mangual: lamina(0x5d6d7e, 'pesado', [faiscasMetal(4)]),
  arma_rapieira: lamina(0xf4d03f, 'estocada', [estrelas(2, 0xf4d03f)]),
  // Arqueiro.
  arma_besta: arco(0x6e2c00, [lascas(6, 0x6e2c00)], 0x5d4037),
  arma_composto: arco(0xa9cce3, [em({ textura: 'gota', quantidade: 3, vidaMs: [300, 500], velocidade: [40, 90], gravidade: 300, escala: [0.3, 0.15], alpha: [1, 0], raio: 3, cor: 0x58d68d })]),
  arma_arcocurto: arco(0xf0b27a),
  arma_arco: arco(0xd4ac0d, [poeira(4, { forma: 'ponto', direcao: 'cima' })]),
  arma_elfico: { ...arco(0x82e0aa, [cintilar(4)]), corpo: flecha(0xd5f5e3), rastro: [em({ textura: 'folha', quantidade: 1, vidaMs: [300, 500], velocidade: [-20, -5], direcao: 'orientada', escala: [0.25, 0.15], alpha: [0.8, 0], raio: 2, cor: 0x82e0aa, giro: [-3, 3] })] },
  arma_chifre: arco(0xdc7633, [poeira(3, { forma: 'ponto' })]),
  arma_arcoguerra: arco(0x922b21, [brasas(5), em({ textura: 'estilhaco', quantidade: 3, vidaMs: [260, 400], velocidade: [80, 160], gravidade: 200, escala: [0.3, 0.2], alpha: [1, 0], raio: 3, cor: 0xbdc3c7, giro: [-8, 8] })]),
  arma_arcocaca: arco(0x7d6608, [penas(3)]),
  // Mago.
  arma_tomo: tomo(0x9b8cff, 'feixe', [em({ textura: 'faisca', quantidade: 4, vidaMs: [160, 260], velocidade: [80, 160], escala: [0.4, 0.15], alpha: [1, 0], aditivo: true, raio: 3, cor: 0xd6eaf8 })]),
  arma_codice: tomo(0xf39c12, 'runa', [brasas(4)], false),
  arma_mares: tomo(0x5dade2, 'onda', [gotas(8, 0x5dade2)], false),
  arma_estelar: { ...tomo(0xf7dc6f, 'orbe', [estrelas(4, 0xf7dc6f)]), corpo: dardo(0xf7dc6f, 1.1) },
  arma_prisma: tomo(0xbb8fce, 'feixe', [em({ textura: 'cristal', quantidade: 4, vidaMs: [300, 500], velocidade: [60, 120], escala: [0.3, 0.15], alpha: [1, 0], aditivo: true, raio: 4, cores: [0xff6b6b, 0x6bcBff, 0x8bff6b] })], false),
  arma_espelhos: tomo(0xd2b4de, 'orbe', [em({ textura: 'estilhaco', quantidade: 4, vidaMs: [260, 420], velocidade: [60, 140], escala: [0.3, 0.2], alpha: [0.9, 0], aditivo: true, raio: 4, cor: 0xf5eef8, giro: [-6, 6] })]),
  arma_orbital: tomo(0x85c1e9, 'orbe', [cintilar(5)]),
  arma_vazio: tomo(0x5b2c6f, 'orbe', [fumacaEscura(4, { cor: 0x2e1a40 })]),
  // Necromante.
  arma_cajado: solo(0x8b68d9, [ossos(3)], 'rachadura'),
  arma_praga: solo(0x7dcea0, [em({ textura: 'bolha', quantidade: 4, vidaMs: [500, 800], velocidade: [10, 40], direcao: 'cima', gravidade: -30, escala: [0.15, 0.35], alpha: [0.9, 0], raio: 10, cor: 0x7dcea0 })]),
  arma_foice: solo(0x566573, [laminas(2)], 'rachadura'),
  arma_cova: solo(0x6e2c00, [em({ textura: 'mao_ossea', quantidade: 2, vidaMs: [500, 700], velocidade: [10, 30], direcao: 'cima', escala: [0.35, 0.3], alpha: [1, 0], raio: 8, cor: 0xece4d0 }), poeira(3, { forma: 'ponto' })], 'rachadura'),
  arma_lamento: solo(0xaed6f1, [almas(3, 0xaed6f1)]),
  arma_sanguineo: solo(0x922b21, [gotas(6, 0xd83040)], 'poca_sangue'),
  arma_espectro: solo(0xd6eaf8, [almas(2, 0xd6eaf8), em({ textura: 'gelo', quantidade: 3, vidaMs: [380, 600], velocidade: [60, 120], gravidade: 300, escala: [0.3, 0.2], alpha: [1, 0], raio: 6, cor: 0xe8f6ff, giro: [-8, 8] })], 'geada'),
  arma_colheita: solo(0x7b7d7d, [laminas(2), almas(2)]),
  arma_solo_amaldicoado: solo(0x8b68d9, [ossos(2)]),
  // Aventureiro.
  arma_chakram: bumerangue(0xf5b041, 'estilhaco', [faiscasMetal(4)]),
  arma_adaga: bumerangue(0xbdc3c7, 'lamina'),
  arma_machadinha: bumerangue(0xa04000, 'lamina', [lascas(3, 0x8a6d3b)]),
  arma_shuriken: bumerangue(0x85929e, 'estilhaco', [em({ textura: 'gelo', quantidade: 2, vidaMs: [300, 500], velocidade: [60, 120], gravidade: 300, escala: [0.25, 0.15], alpha: [1, 0], raio: 4, cor: 0xe8f6ff })]),
  arma_duplo: bumerangue(0xca6f1e, 'arco_golpe', [poeira(3, { forma: 'ponto' })]),
  arma_arpeu: { ...bumerangue(0x717d7e, 'arco_golpe'), corpo: [em({ textura: 'gancho', quantidade: 1, vidaMs: [40, 50], direcao: 'orientada', escala: [0.5, 0.5], alpha: [1, 0.9], cor: 0xbdc3c7 })], rastro: [em({ textura: 'elo', quantidade: 1, vidaMs: [200, 300], escala: [0.25, 0.25], alpha: [0.9, 0], raio: 0, cor: 0x99a3a4 })] },
  arma_falcoeiro: bumerangue(0xd68910, 'arco_golpe', [penas(4)]),
  arma_serrilhado: bumerangue(0x1e8449, 'estilhaco', [gotas(4, 0xd83040)]),
  arma_bumerangue: bumerangue(0xc49a6c, 'arco_golpe'),
};

/** As assinaturas das armas, uma por nome `arma_*` da lista fechada. */
export const ARMAS_VFX = Object.fromEntries(Object.entries(SPECS).map(([k, s]) => [k, assinatura(s)])) as Readonly<Record<Extract<AssinaturaVisual, `arma_${string}`>, DefAssinatura>>;
