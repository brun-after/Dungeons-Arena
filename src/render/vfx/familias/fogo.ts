// Assinaturas de fogo (marco 26, 29/10/2026, D-124). Fogo é chama que tremula (flipbook com turbulência), brasa que
// vira fumaça, calor que sobe e chão queimado — nunca a bola de brilho genérica. Cada skill tem a sua forma: a bola de
// fogo que voa e estoura em cogumelo, o arco da lâmina em brasa, o tornado do ciclone, a parede circular do anel, o
// pilar do incinerar, o meteoro, o lança-chamas, o risco que arde pela linha e a mão em chamas.

import type { DefAssinatura, P } from '../cena';
import { arcoDeGolpe, bolaDeFogo, brotar, cair, clarao, ondaDeChoque, orbitar, PX, sortear, tremido, tween } from '../blocos';
import { brasas, chamaViva, em, fumacaEscura, CORES_CHAMA } from '../emissoes';
import { sai } from '../pincel';
import { QUADROS_CHAMA } from '../texturas';

const MAO_EM_CHAMAS = [chamaViva(2, { escala: [0.45, 0.1], raio: 4, velocidade: [10, 30] }), brasas(1, { velocidade: [20, 60] })];
const IMPACTO_FOGO = [chamaViva(5, { raio: 8, escala: [0.9, 0.2] }), brasas(5), fumacaEscura(2)];

/** O corpo da bola de fogo em voo: o miolo claro, chamas que lambem para trás e a cauda de brasa. */
const CORPO_BOLA = [
  em({ textura: 'brasa', quantidade: 1, vidaMs: [60, 80], escala: [1.1, 0.9], alpha: [1, 0.8], aditivo: true, cor: 0xfff0b0 }),
  chamaViva(2, { vidaMs: [140, 240], velocidade: [-60, -30], direcao: 'orientada', abertura: 0.4, gravidade: -30, escala: [0.8, 0.2], raio: 3 }),
];
const RASTRO_BOLA = [brasas(2, { direcao: 'orientada', velocidade: [-50, -20], abertura: 0.6, gravidade: 0 }), fumacaEscura(1, { escala: [0.3, 0.8], vidaMs: [400, 700] })];

/** A bola de fogo que voa de quem lança até o centro, num arco, e estoura. */
function arremessarBola(c: Parameters<NonNullable<DefAssinatura['naArea']>>[0], de: P, ate: P, raio: number, aoChegar: () => void): void {
  const ms = Math.min(420, 120 + Math.hypot(ate.x - de.x, ate.y - de.y) * 35);
  c.tocar({
    ms,
    aoFim: aoChegar,
    desenhar: (t, decorrido, p) => {
      const a = c.tela(de);
      const b = c.tela(ate);
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 40;
      const quadro = QUADROS_CHAMA[Math.floor(decorrido / 50) % QUADROS_CHAMA.length] ?? 'chama0';
      const rot = Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2;
      p.desenhar('brasa', x, y, { sx: 2.4 * raio, alpha: 0.55, cor: 0xff5a1a, aditivo: true });
      p.desenhar(quadro, x, y, { sx: 2 * raio, sy: 2.6 * raio, rot, alpha: 1, cor: 0xff8a2a, aditivo: true });
      p.desenhar('brasa', x, y, { sx: 1.3 * raio, alpha: 1, cor: 0xfff0b0, aditivo: true });
      if (Math.random() < 0.6) c.particulas.emitirNaTela(RASTRO_BOLA, x, y, 0xff7b39);
    },
  });
}

export const FOGO = {
  /** Bola de fogo: a esfera viva voa em arco e explode em cogumelo, com anel de calor e cratera. */
  bola_de_fogo: {
    familia: 'fogo',
    conjuracao: MAO_EM_CHAMAS,
    corpo: CORPO_BOLA,
    rastro: RASTRO_BOLA,
    impacto: [brasas(4)],
    camera: 'forte',
    naArea: (c, a) => {
      arremessarBola(c, a.origem, a.centro, 1, () => {
        bolaDeFogo(c, a.centro, Math.max(1.2, a.raio * 0.9) * a.escala, a.cor);
        for (const cel of sortear(a.celulas, 6)) c.particulas.emitirLista(IMPACTO_FOGO, cel.x, cel.y, a.cor);
        c.tremor('forte');
      });
    },
  },
  /** O projétil de fogo (as geradas): a bola menor que voa reta e estoura no alvo. */
  bola_de_fogo_projetil: {
    familia: 'fogo',
    conjuracao: MAO_EM_CHAMAS,
    corpo: CORPO_BOLA,
    rastro: RASTRO_BOLA,
    impacto: IMPACTO_FOGO,
    marca: 'queimado',
    aoAcertar: (c, a) => {
      if (a.indice === 0) bolaDeFogo(c, a.ate, 0.55 * a.escala, a.cor);
    },
  },
  /** A explosão de fogo no lugar (Explosão, a flecha explosiva no fim). */
  explosao_de_fogo: {
    familia: 'fogo',
    conjuracao: MAO_EM_CHAMAS,
    impacto: [brasas(3)],
    camera: 'forte',
    naArea: (c, a) => {
      bolaDeFogo(c, a.centro, Math.max(0.8, a.raio * 0.6) * a.escala, a.cor);
      for (const cel of sortear(a.celulas, 5)) c.particulas.emitirLista(IMPACTO_FOGO, cel.x, cel.y, a.cor);
    },
  },
  /** Lâmina em brasa: o arco da lâmina incandescente, labaredas pelo cone e brasas que se soltam. */
  lamina_em_brasa: {
    familia: 'fogo',
    conjuracao: [brasas(2, { velocidade: [20, 60] })],
    impacto: [chamaViva(3), brasas(3)],
    camera: 'leve',
    naArea: (c, a) => {
      const meio = { x: (a.origem.x + a.mira.x) / 2, y: (a.origem.y + a.mira.y) / 2 };
      arcoDeGolpe(c, a.origem, meio, 0xff8a2a, 1.6 * a.escala, 1, 240);
      arcoDeGolpe(c, a.origem, meio, 0xffd27a, 1.2 * a.escala, 1, 200);
      c.particulas.emitirLista([chamaViva(16, { forma: 'cone', direcao: 'livre', velocidade: [220, 380], abertura: 0.55, gravidade: -40, arrasto: 1.1, escala: [0.6, 1.1], curvaEscala: 'sai', raio: 4, vidaMs: [360, 520] }), brasas(8, { forma: 'cone', direcao: 'livre', velocidade: [160, 260], abertura: 0.7 })], a.origem.x, a.origem.y, a.cor, a.mira);
      for (const cel of sortear(a.celulas, 3)) c.marca('queimado', cel.x, cel.y, 0x1a1210, 1, 1800);
    },
  },
  /** Ciclone flamejante: o tornado de chamas girando em volta de quem gira, subindo em espiral. */
  ciclone_de_fogo: {
    familia: 'fogo',
    conjuracao: MAO_EM_CHAMAS,
    impacto: [chamaViva(3), brasas(2)],
    camera: 'forte',
    naArea: (c, a) => {
      const centro = () => c.ondeEsta(a.atorId) ?? a.origem;
      orbitar(c, centro, 'chama0', 0xff8a2a, { quadros: QUADROS_CHAMA, n: 6, raio: Math.max(1, a.raio * 0.8), ms: 620, voltas: 2.2, tamanho: 1.3, aditivo: true, tangente: false, rastro: 2 });
      orbitar(c, centro, 'brasa', 0xffd070, { n: 4, raio: Math.max(0.6, a.raio * 0.45), ms: 520, voltas: -2.6, tamanho: 0.7, aditivo: true });
      c.particulas.emitirLista([chamaViva(16, { forma: 'espiral', direcao: 'livre', raio: a.raio * PX * 0.7, velocidade: [80, 140], gravidade: -120 }), brasas(10, { forma: 'espiral', raio: a.raio * PX * 0.6 })], a.origem.x, a.origem.y, a.cor);
      ondaDeChoque(c, a.origem, 0xff7b39, a.raio + 0.5, 420);
    },
  },
  /** Anel de chamas: uma parede de fogo circular que sobe em volta e pulsa para fora. */
  anel_de_chamas: {
    familia: 'fogo',
    conjuracao: [brasas(2, { velocidade: [20, 50] })],
    impacto: [chamaViva(3), brasas(2)],
    camera: 'leve',
    naArea: (c, a) => {
      const n = c.reduzido ? 8 : 14;
      const r = Math.max(1, a.raio);
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        brotar(c, { x: a.origem.x + Math.cos(ang) * r, y: a.origem.y + Math.sin(ang) * r }, 'chama3', 0xff7b39, 1.3 * a.escala, 700, true, i * 12);
      }
      c.particulas.emitirLista([chamaViva(24, { forma: 'anel', raio: r * PX, direcao: 'cima', velocidade: [30, 70] }), brasas(10, { forma: 'anel', raio: r * PX })], a.origem.x, a.origem.y, a.cor);
      ondaDeChoque(c, a.origem, 0xff5722, r + 0.6, 500);
      c.marca('queimado', a.origem.x, a.origem.y, 0x1a1210, r * 2.4, 2400);
    },
  },
  /** Incinerar: o pilar de fogo que irrompe do chão sob o alvo. */
  pilar_de_fogo: {
    familia: 'fogo',
    conjuracao: MAO_EM_CHAMAS,
    impacto: [brasas(6, { velocidade: [80, 200], abertura: 0.4 })],
    marca: 'queimado',
    camera: 'leve',
    aoAcertar: (c, a) => {
      if (a.indice > 0) return;
      tween(c, { textura: 'chama0', quadros: QUADROS_CHAMA, de: a.ate, s: [1.4, 2.6], sy: [0.6, 4.6], a: [1, 0], cor: 0xff9a3a, corFim: 0xb8200a, aditivo: true, ms: 620, subir: -PX * 1.1, curva: sai, noChao: true });
      tween(c, { textura: 'chama4', quadros: QUADROS_CHAMA, de: a.ate, s: [0.9, 1.6], sy: [0.5, 3.4], a: [1, 0], cor: 0xffe08a, corFim: 0xff6a1a, aditivo: true, ms: 460, subir: -PX * 0.8, curva: sai, noChao: true });
      c.particulas.emitirLista([chamaViva(14, { velocidade: [120, 220], abertura: 0.15, gravidade: -160, raio: 5 }), fumacaEscura(3, { velocidade: [60, 110] })], a.ate.x, a.ate.y, a.cor);
      ondaDeChoque(c, a.ate, 0xff6a1a, 0.9, 300);
    },
  },
  /** Rastro ígneo: o chão arde atrás de quem corre (as pegadas acendem uma a uma). */
  rastro_de_fogo: {
    familia: 'fogo',
    impacto: [chamaViva(3)],
    emSi: (c, a) => {
      c.particulas.emitirLista([chamaViva(14, { forma: 'anel', raio: 18, velocidade: [20, 50] }), brasas(6)], a.pos.x, a.pos.y, a.cor);
      for (let i = 0; i < 3; i++) brotar(c, tremido(a.pos, 0.8), 'chama2', 0xff7b39, 0.9, 900, true, i * 80);
      c.marca('queimado', a.pos.x, a.pos.y, 0x1a1210, 1.4, 2400);
    },
  },
  /** O meteoro: a rocha em chamas cai em diagonal com cauda longa e abre uma cratera. */
  meteoro: {
    familia: 'fogo',
    conjuracao: [chamaViva(2, { escala: [0.5, 0.1] }), em({ textura: 'cintilar', quantidade: 1, vidaMs: [300, 400], escala: [0.2, 0.6], alpha: [0.9, 0], aditivo: true, raio: 6, cor: 0xffd08a, alturaInicial: 40 })],
    impacto: [brasas(4)],
    camera: 'forte',
    naArea: (c, a) => {
      const raio = Math.max(1, a.raio * 0.8) * a.escala;
      cair(c, a.centro, 'chama0', 0xff8a2a, { quadros: QUADROS_CHAMA, altura: 220, inclinacao: 0.6, ms: 360, tamanho: 2.4 * raio, aditivo: true, contraMao: true });
      cair(c, a.centro, 'rocha', 0x6a4030, { altura: 220, inclinacao: 0.6, ms: 360, tamanho: 0.9 * raio, aoChegar: () => {
        bolaDeFogo(c, a.centro, raio * 1.2, a.cor);
        c.marca('rachadura', a.centro.x, a.centro.y, 0x2a1a10, raio * 2.6, 3200);
        c.particulas.emitirLista([em({ textura: 'rocha', quantidade: 8, vidaMs: [400, 700], velocidade: [120, 240], direcao: 'cima', abertura: 1.2, gravidade: 600, escala: [0.25, 0.15], alpha: [1, 0.6], raio: 6, cor: 0x5a4030, giro: [-6, 6] })], a.centro.x, a.centro.y, a.cor);
        c.tremor('forte');
      } });
    },
  },
  /** A chuva de brasas (fogo em área): pequenos meteoros caindo pelas células. */
  chuva_de_brasas: {
    familia: 'fogo',
    conjuracao: MAO_EM_CHAMAS,
    impacto: [chamaViva(3), brasas(3)],
    camera: 'leve',
    naArea: (c, a) => {
      sortear(a.celulas, c.reduzido ? 5 : 9).forEach((cel, i) => {
        const p = tremido(cel, 0.5);
        cair(c, p, 'chama1', 0xff8a2a, { quadros: QUADROS_CHAMA, altura: 150, inclinacao: 0.35, ms: 240, tamanho: 0.9, aditivo: true, contraMao: true, atrasoMs: i * 55, aoChegar: () => {
          c.particulas.emitirLista([chamaViva(4, { raio: 4 }), brasas(4)], p.x, p.y, a.cor);
          c.marca('queimado', p.x, p.y, 0x1a1210, 0.8, 1800);
        } });
      });
    },
  },
  /** Lança-chamas (fogo em cone): o jato de fogo saindo em leque, rolando e subindo. */
  lanca_chamas: {
    familia: 'fogo',
    conjuracao: MAO_EM_CHAMAS,
    impacto: [chamaViva(3), brasas(2)],
    naArea: (c, a) => {
      const jato = [
        chamaViva(c.reduzido ? 14 : 26, { forma: 'cone', direcao: 'livre', velocidade: [160, 300], abertura: 0.45, gravidade: -40, arrasto: 1.6, escala: [0.4, 1.4], curvaEscala: 'sai', raio: 3, vidaMs: [380, 560] }),
        brasas(8, { forma: 'cone', direcao: 'livre', velocidade: [200, 320], abertura: 0.5 }),
        fumacaEscura(4, { forma: 'cone', direcao: 'livre', velocidade: [80, 150], abertura: 0.5 }),
      ];
      c.particulas.emitirLista(jato, a.origem.x, a.origem.y, a.cor, a.mira);
      clarao(c, a.origem, 0xffa040, 1.2);
    },
  },
  /** O risco de fogo (fogo em linha): as labaredas irrompem uma a uma pela linha, da mão até a ponta. */
  risco_de_fogo: {
    familia: 'fogo',
    conjuracao: MAO_EM_CHAMAS,
    impacto: [chamaViva(3), brasas(2)],
    naArea: (c, a) => {
      const ordem = [...a.celulas].sort((p, q) => Math.hypot(p.x - a.origem.x, p.y - a.origem.y) - Math.hypot(q.x - a.origem.x, q.y - a.origem.y));
      ordem.forEach((cel, i) => {
        brotar(c, cel, 'chama2', 0xff7b39, 1.4 * a.escala, 620, true, i * 45);
        c.marca('queimado', cel.x, cel.y, 0x1a1210, 1, 2200);
      });
      c.particulas.emitirLista([chamaViva(12, { velocidade: [40, 90] }), brasas(6)], a.origem.x, a.origem.y, a.cor, ordem.at(-1) ?? a.mira);
    },
  },
  /** A mão em chamas (fogo no toque): o soco que explode em labaredas e um arco quente. */
  mao_em_chamas: {
    familia: 'fogo',
    conjuracao: MAO_EM_CHAMAS,
    impacto: [chamaViva(8, { direcao: 'livre', velocidade: [60, 140], gravidade: -80, raio: 4 }), brasas(6), fumacaEscura(2)],
    aoAcertar: (c, a) => {
      arcoDeGolpe(c, a.de, a.ate, 0xff7b39, 1.1 * a.escala, 1, 200);
      ondaDeChoque(c, a.ate, 0xff8a2a, 0.7, 260, 'choque', false);
    },
  },
  /** A chama sombria (trevas que ardem): labaredas roxas e fumaça escura, num redemoinho lento. */
  chamas_sombrias: {
    familia: 'fogo',
    conjuracao: [chamaViva(2, { cores: [0xf0d0ff, 0xa060e0, 0x5a2090, 0x200830], escala: [0.5, 0.1] })],
    impacto: [chamaViva(5, { cores: [0xf0d0ff, 0xa060e0, 0x5a2090, 0x200830] }), fumacaEscura(3, { cor: 0x1a0a28 })],
    naArea: (c, a) => {
      const r = Math.max(1, a.raio);
      orbitar(c, () => c.ondeEsta(a.atorId) ?? a.origem, 'chama0', 0x9a5ae0, { quadros: QUADROS_CHAMA, n: 8, raio: r, ms: 800, voltas: 0.8, tamanho: 1.5, aditivo: true, tangente: false });
      c.particulas.emitirLista([chamaViva(20, { forma: 'anel', raio: r * PX, cores: [0xf0d0ff, 0xa060e0, 0x5a2090, 0x200830] }), fumacaEscura(6, { forma: 'anel', raio: r * PX, cor: 0x1a0a28 })], a.origem.x, a.origem.y, a.cor);
      c.marca('queimado', a.origem.x, a.origem.y, 0x120818, r * 2.2, 2600);
    },
  },
} satisfies Record<string, DefAssinatura>;

/** As cores da chama, exportadas para as etapas de fogo das ultimates de vários elementos. */
export const COR_FOGO = CORES_CHAMA[2];
