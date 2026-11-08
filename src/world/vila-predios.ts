// Os prédios da vila do Mundo (marco 38, 08/11/2026, D-142). Quem atende na vila fica num lugar que faz sentido:
// - a taverna (o quadro de missões vira a balconista atrás do balcão);
// - o banco, de pedra e ardósia, com o banqueiro atrás do guichê;
// - o mercado, um pavilhão aberto de toldo listrado sobre quatro pilares (a loja do reino e os anúncios);
// - a ferraria, com a chaminé e a bigorna;
// - a botica do alquimista, de telhado de cobre.
// Cada um é uma casa com a porta ao sul e quem atende no fundo, de frente para ela (o pavilhão não tem paredes, só os
// pilares). O telhado leva o tipo do prédio (o render desenha a placa e os detalhes) e some quando o jogador chega
// perto, como o das casas da vila. A pedra de save fica no centro da praça e a de portal ao lado. Puro.

import type { Celula } from '../core/comandos';
import { PAPEIS_OBRIGATORIOS, type PapelNpc } from '../mundo/reino';
import type { TipoPredio, Telhado } from './fase';

/** O prédio de cada papel (os outros ficam na praça). */
export const PREDIO_DO_PAPEL: Readonly<Partial<Record<PapelNpc, TipoPredio>>> = {
  missoes: 'taverna',
  banco: 'banco',
  mercado: 'mercado',
  mercador: 'mercado',
  ferreiro: 'ferreiro',
  alquimista: 'alquimista',
};

const MEDIDAS: Readonly<Record<TipoPredio, { largura: number; altura: number; estilo: Telhado['estilo'] }>> = {
  taverna: { largura: 8, altura: 5, estilo: 'telha' },
  banco: { largura: 7, altura: 5, estilo: 'ardosia' },
  mercado: { largura: 7, altura: 5, estilo: 'toldo' },
  ferreiro: { largura: 7, altura: 5, estilo: 'telha' },
  alquimista: { largura: 6, altura: 5, estilo: 'cobre' },
};

/** O que o gerador precisa da grade (a mesma de `gerador-exterior.ts`). */
export interface GradeDaVila {
  readonly n: number;
  em(x: number, y: number): string;
  por(x: number, y: number, ch: string): void;
  interna(x: number, y: number): boolean;
}

const ANDA = new Set([',', '.', '=']);
const QUADRANTES = [[1, 1], [-1, 1], [-1, -1], [1, -1]] as const;

/** Cabe o prédio em (x, y)? Sobre piso, com a volta de uma célula andável e longe das células bloqueadas. */
function cabe(g: GradeDaVila, x: number, y: number, l: number, a: number, bloqueadas: ReadonlySet<number>): boolean {
  for (let cy = y - 1; cy <= y + a; cy++) {
    for (let cx = x - 1; cx <= x + l; cx++) {
      const dentro = cx >= x && cy >= y && cx < x + l && cy < y + a;
      const ch = g.em(cx, cy);
      if (!g.interna(cx, cy) || bloqueadas.has(cy * g.n + cx) || (dentro ? ch !== '.' : !ANDA.has(ch))) return false;
    }
  }
  return true;
}

/** Ergue o prédio: paredes (ou só os pilares, no pavilhão), o piso e a porta ao sul. Devolve onde fica quem atende. */
function erguer(g: GradeDaVila, tipo: TipoPredio, x: number, y: number, l: number, a: number): Celula {
  for (let cy = y; cy < y + a; cy++) {
    for (let cx = x; cx < x + l; cx++) {
      const borda = cx === x || cy === y || cx === x + l - 1 || cy === y + a - 1;
      const canto = (cx === x || cx === x + l - 1) && (cy === y || cy === y + a - 1);
      g.por(cx, cy, (tipo === 'mercado' ? canto : borda) ? '#' : '.');
    }
  }
  const porta = x + Math.floor(l / 2);
  g.por(porta, y + a - 1, '.');
  return { x: porta, y: y + 1 };
}

export interface PredioErguido {
  papel: PapelNpc;
  atendente: Celula;
  telhado: Telhado;
}

/**
 * Os prédios dos papéis da vila, em volta da praça (o mais perto possível do anel `anel`), sem cobrir os caminhos em
 * cruz. O papel que não couber fica sem prédio (quem chama o põe na praça, como antes).
 */
const OBRIGATORIOS: ReadonlySet<PapelNpc> = new Set(PAPEIS_OBRIGATORIOS);

export function erguerPredios(g: GradeDaVila, centro: Celula, raio: number, anel: number, papeis: readonly PapelNpc[], bloqueadas: Set<number>): PredioErguido[] {
  const feitos: PredioErguido[] = [];
  // O caminho em cruz e a praça do meio ficam livres.
  for (let i = -raio; i <= raio; i++) {
    bloqueadas.add(centro.y * g.n + centro.x + i);
    bloqueadas.add((centro.y + i) * g.n + centro.x);
  }
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) bloqueadas.add((centro.y + dy) * g.n + centro.x + dx);
  let quadrante = 0;
  // Os obrigatórios (mercado, ferreiro, alquimista) primeiro: numa vila cheia, quem fica sem prédio é o resto.
  const ordem = [...papeis].sort((p, q) => Number(!OBRIGATORIOS.has(p)) - Number(!OBRIGATORIOS.has(q)));
  for (const papel of ordem) {
    const tipo = PREDIO_DO_PAPEL[papel];
    if (!tipo || feitos.some((f) => f.papel === papel || f.telhado.predio === tipo)) continue;
    const { largura: l, altura: a, estilo } = MEDIDAS[tipo];
    let achou: { x: number; y: number } | null = null;
    for (let t = 0; t < QUADRANTES.length && !achou; t++) {
      const [sx, sy] = QUADRANTES[(quadrante + t) % QUADRANTES.length] ?? [1, 1];
      const candidatas: { x: number; y: number; erro: number }[] = [];
      for (let dy = 2; dy <= raio; dy++) {
        for (let dx = 2; dx <= raio; dx++) {
          const x = sx > 0 ? centro.x + dx : centro.x - dx - l + 1;
          const y = sy > 0 ? centro.y + dy : centro.y - dy - a + 1;
          candidatas.push({ x, y, erro: Math.abs(Math.hypot(x + l / 2 - centro.x, y + a / 2 - centro.y) - anel) });
        }
      }
      candidatas.sort((p, q) => p.erro - q.erro || p.y - q.y || p.x - q.x);
      achou = candidatas.find((k) => cabe(g, k.x, k.y, l, a, bloqueadas)) ?? null;
    }
    quadrante++;
    if (!achou) continue;
    const atendente = erguer(g, tipo, achou.x, achou.y, l, a);
    // A volta do prédio fica livre para o próximo e para as casas.
    for (let cy = achou.y - 1; cy <= achou.y + a; cy++) for (let cx = achou.x - 1; cx <= achou.x + l; cx++) bloqueadas.add(cy * g.n + cx);
    feitos.push({ papel, atendente, telhado: { x: achou.x, y: achou.y, largura: l, altura: a, revela: 'perto', estilo, predio: tipo } });
  }
  return feitos;
}
