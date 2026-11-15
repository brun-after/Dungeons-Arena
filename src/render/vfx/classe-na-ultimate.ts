// D-174 (14/11/2026): a mesma família de ultimate não é igual em duas classes. Por cima da assinatura da família (o
// que a ultimate faz) e da runa (de que ela é feita), cada classe assina do seu jeito, feito à mão:
// - Guerreiro: o aço — as lâminas cravam em volta e o estandarte finca no centro;
// - Mago: a escrita — círculos rúnicos concêntricos giram em sentidos opostos e os glifos sobem;
// - Arqueiro: a mira — as flechas caem marcando a borda e o retículo fecha no centro;
// - Necromante: a cova — as mãos e os crânios rompem o chão e as almas sobem;
// - Aventureiro: a caçada — as pegadas correm em volta, as garras riscam e as penas caem.
// O estilo mais forte de quem lança põe o seu sinal (o eixo dele) e a afinidade dominante do personagem, quando se
// destaca, deixa um toque do elemento dela. Tudo cresce com a intensidade (0 a 1): mais peças, maiores, por mais tempo.
// Só desenho.

import type { Eixo } from '../../combat/eixos';
import { brotar, cair, circuloNoChao, clarao, clarear, ondaDeChoque, orbitar, tween } from './blocos';
import type { CenaVfx, P } from './cena';
import { em, faiscasMetal } from './emissoes';
import { conjuracaoDaRuna, COR_DA_RUNA, materiaDaRuna, type ClasseComRuna, type Runa } from './manifestacao-runa';
import { elastica, sai } from './pincel';

export interface PalcoDaUltimate {
  centro: P;
  /** O raio da área (células); em si mesmo, 1,5. */
  raio: number;
  cor: number;
  /** 0 a 1: a faixa da runa da ultimate. */
  intensidade: number;
}

const vezes = (n: number, i: number): number => Math.max(2, Math.round(n * (0.5 + 0.5 * i)));
const emVolta = (centro: P, raio: number, n: number, fase = 0): P[] =>
  Array.from({ length: n }, (_, k) => ({ x: centro.x + Math.cos((k / n) * Math.PI * 2 + fase) * raio, y: centro.y + Math.sin((k / n) * Math.PI * 2 + fase) * raio }));

/** A assinatura da classe na ultimate. */
export function classeNaUltimate(c: CenaVfx, classe: ClasseComRuna, g: PalcoDaUltimate): void {
  const i = g.intensidade;
  const r = Math.max(1.5, g.raio);
  const tam = 0.8 + 0.5 * i;
  const ms = 900 + 700 * i;
  switch (classe) {
    case 'guerreiro': {
      emVolta(g.centro, r, vezes(6, i)).forEach((p, k) => { cair(c, p, 'lamina', clarear(g.cor, 0.5), { altura: 3, ms: 220, tamanho: 1.1 * tam, atrasoMs: k * 40, aoChegar: () => { c.particulas.emitirLista([faiscasMetal(3)], p.x, p.y, g.cor); } }); });
      brotar(c, g.centro, 'runa_guerreiro', g.cor, 1.6 * tam, ms, true);
      if (i > 0.6) c.tremor('leve');
      return;
    }
    case 'mago': {
      circuloNoChao(c, () => g.centro, 'circulo_runico', g.cor, r * 2, ms, 0.8);
      circuloNoChao(c, () => g.centro, 'circulo_runico', clarear(g.cor, 0.4), r * 1.2, ms, -1.2);
      if (i > 0.5) circuloNoChao(c, () => g.centro, 'runa_mago', clarear(g.cor, 0.6), r * 0.7, ms, 0.4);
      orbitar(c, () => g.centro, 'runa2', clarear(g.cor, 0.3), { n: vezes(5, i), raio: r, ms, voltas: 1, tamanho: 0.6 * tam, aditivo: true });
      return;
    }
    case 'arqueiro': {
      emVolta(g.centro, r, vezes(8, i), 0.3).forEach((p, k) => { cair(c, p, 'espinho', clarear(g.cor, 0.4), { altura: 4, ms: 240, tamanho: 0.9 * tam, atrasoMs: k * 30, aditivo: true }); });
      tween(c, { textura: 'mira_alvo', de: g.centro, s: [r * 1.6, r * 0.6], a: [0.3, 1], rot: [1.2, 0], cor: g.cor, aditivo: true, ms: 420, noChao: true, aoFim: () => { clarao(c, g.centro, g.cor, 1 + i); } });
      return;
    }
    case 'necromante': {
      emVolta(g.centro, r * 0.8, vezes(5, i), 0.6).forEach((p, k) => { brotar(c, p, k % 2 ? 'cranio' : 'mao_ossea', clarear(g.cor, 0.3), 0.9 * tam, ms, false, k * 60); });
      c.particulas.emitirLista([em({ textura: 'alma', quantidade: vezes(6, i), vidaMs: [700, 1100], velocidade: [30, 70], direcao: 'cima', gravidade: -50, escala: [0.35, 0.6 * tam], alpha: [0.9, 0], aditivo: true, raio: r * 30, cor: null })], g.centro.x, g.centro.y, g.cor);
      circuloNoChao(c, () => g.centro, 'runa_necromante', g.cor, r * 0.9, ms, -0.3);
      return;
    }
    case 'aventureiro': {
      orbitar(c, () => g.centro, 'garra', clarear(g.cor, 0.3), { n: vezes(3, i), raio: r, ms: 700, voltas: 1.2, tamanho: 0.8 * tam, aditivo: true, tangente: true, rastro: 2 });
      c.particulas.emitirLista([em({ textura: 'pena', quantidade: vezes(8, i), vidaMs: [700, 1100], velocidade: [30, 90], gravidade: 40, arrasto: 1.5, escala: [0.4 * tam, 0.3], alpha: [1, 0], raio: r * 30, cor: null, giro: [-4, 4] })], g.centro.x, g.centro.y, clarear(g.cor, 0.4));
      brotar(c, g.centro, 'runa_aventureiro', g.cor, 1.4 * tam, ms, true);
      return;
    }
  }
}

/** O sinal do estilo mais forte na ultimate: o eixo dele, dito num gesto só, na intensidade da faixa. */
export function estiloNaUltimate(c: CenaVfx, eixo: Eixo, faixa: number, g: PalcoDaUltimate): void {
  const i = Math.max(0, Math.min(10, faixa)) / 10;
  if (i <= 0) return;
  const r = Math.max(1.5, g.raio);
  const cor = clarear(g.cor, 0.3);
  switch (eixo) {
    case 'area': ondaDeChoque(c, g.centro, cor, r + 0.5 + i, 420 + 200 * i); return;
    case 'alvos': for (const p of emVolta(g.centro, r, vezes(4, i))) tween(c, { textura: 'elo', de: g.centro, para: p, s: [0.4, 0.6], a: [1, 0], cor, aditivo: true, ms: 380 }); return;
    case 'perfuracao': tween(c, { textura: 'feixe', de: { x: g.centro.x - r, y: g.centro.y }, para: { x: g.centro.x + r, y: g.centro.y }, s: [0.6, 1.2 + i], sy: [0.2, 0.2], a: [1, 0], cor, aditivo: true, ms: 320 }); return;
    case 'eco': for (let k = 0; k < vezes(2, i); k++) tween(c, { textura: 'onda_som', de: g.centro, s: [0.5, r + k * 0.5], a: [0.8, 0], cor, aditivo: true, ms: 420, atrasoMs: 500 + k * 160 }); return;
    case 'controle': orbitar(c, () => g.centro, 'elo', cor, { n: vezes(5, i), raio: r, ms: 900, voltas: -0.6, tamanho: 0.5, aditivo: true, tangente: true }); return;
    case 'sustento': tween(c, { textura: 'hexagono', de: { x: g.centro.x, y: g.centro.y - 0.5 }, s: [0.5, 1.2 + i], a: [1, 0], cor: 0xc8ffe0, aditivo: true, ms: 700, curva: elastica }); return;
    case 'marca': tween(c, { textura: 'mira_alvo', de: { x: g.centro.x, y: g.centro.y - 1 }, s: [1.6 + i, 0.7], a: [0.4, 1], rot: [1, 0], cor: 0xff9a8a, aditivo: true, ms: 420 }); return;
    case 'grupo': for (let k = 0; k < vezes(2, i); k++) ondaDeChoque(c, g.centro, 0xffe6a0, r * (0.8 + k * 0.4), 480 + k * 120, 'onda_som', false); return;
    case 'invocacao': circuloNoChao(c, () => g.centro, 'circulo_runico', 0xb6a6ff, r * (1 + 0.5 * i), 900, 1.5); return;
  }
}

/**
 * O toque da afinidade dominante do personagem (a mais forte, quando se destaca e não é a da própria skill): um fio da
 * matéria dela no golpe ou em volta da ultimate, mais presente quanto mais forte ela é.
 */
export function toqueDominante(c: CenaVfx, runa: Runa, faixa: number, em2: P, largo: boolean): void {
  const i = Math.max(0, Math.min(10, faixa)) / 10;
  if (i <= 0) return;
  const cor = COR_DA_RUNA[runa];
  c.particulas.emitirLista(largo ? materiaDaRuna(runa, 0.4 + 0.6 * i) : conjuracaoDaRuna(runa, 0.5 + 0.5 * i), em2.x, em2.y, cor);
  if (largo) tween(c, { textura: 'choque', de: em2, s: [0.4, 1.6 + i], sy: [0.2, 0.8 + 0.5 * i], a: [0.7 * i + 0.2, 0], cor, aditivo: true, ms: 520, curva: sai, noChao: true });
}
