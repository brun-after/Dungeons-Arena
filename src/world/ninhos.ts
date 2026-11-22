// Os ninhos (marco 53, 22/11/2026, D-203): o lugar de uma região onde se junta a criatura que guarda uma receita da
// forja. Por que ali: é a toca delas (a teia das tecelãs, a fornalha caída dos fornalheiros); por isso nascem mais
// delas lá, e quem as derruba dentro do ninho acha a receita com mais frequência (`engaste.ninho.receitaMult`). A
// região diz em dados qual criatura faz ninho e o nome dele (mundo/*.json, `ninhos`); o gerador sorteia o lugar,
// longe da vila e das chegadas, com um RNG próprio (o resto da região sai igual). Puro.

import type { Celula } from '../core/comandos';
import { aleatorio, criarRng, escolher } from '../core/rng';
import { chebyshev } from '../combat/geometria';

/** O ninho na fase: o centro, o raio, a criatura e o nome (o mapa e a receita mostram). */
export interface NinhoDaFase {
  x: number;
  y: number;
  raio: number;
  preset: string;
  nome: string;
}

/** As regras do ninho (balance.engaste.ninho). */
export interface RegrasDoNinho {
  raio: number;
  guardioes: number;
  /** Quantas vezes a chance da receita de quem morre dentro do ninho dele. */
  receitaMult: number;
}

const SEMENTE_NINHOS = 27_449;
/** Quanto o centro do ninho fica longe da vila, das chegadas e de outro ninho (células). */
const FOLGA = 16;

/**
 * Põe os ninhos da região e os guardiões de cada um (no topo da faixa de nível). `livre` diz se a célula serve para
 * um monstro; `longe` se o centro pode ficar ali (fora da vila e das chegadas).
 */
export function posicionarNinhos(
  pedidos: readonly { preset: string; nome: string }[],
  semente: number,
  livres: readonly Celula[],
  livre: (c: Celula) => boolean,
  longe: (c: Celula) => boolean,
  ocupadas: readonly Celula[],
  nivel: number,
  regras: RegrasDoNinho,
): { ninhos: NinhoDaFase[]; guardioes: { preset: string; x: number; y: number; nivel: number }[] } {
  const ninhos: NinhoDaFase[] = [];
  const guardioes: { preset: string; x: number; y: number; nivel: number }[] = [];
  if (pedidos.length === 0 || livres.length === 0) return { ninhos, guardioes };
  const rng = criarRng(semente + SEMENTE_NINHOS);
  const tomadas = [...ocupadas];
  for (const p of pedidos) {
    let centro: Celula | null = null;
    for (let t = 0; t < 200 && !centro; t++) {
      const c = escolher(rng, livres);
      if (longe(c) && ninhos.every((n) => chebyshev(n, c) >= FOLGA + regras.raio)) centro = c;
    }
    if (!centro) continue;
    ninhos.push({ x: centro.x, y: centro.y, raio: regras.raio, preset: p.preset, nome: p.nome });
    for (let k = 0, t = 0; k < regras.guardioes && t < regras.guardioes * 30; t++) {
      const a = aleatorio(rng) * Math.PI * 2;
      const d = aleatorio(rng) * (regras.raio - 1);
      const c = { x: Math.round(centro.x + Math.cos(a) * d), y: Math.round(centro.y + Math.sin(a) * d) };
      if (!livre(c) || tomadas.some((o) => o.x === c.x && o.y === c.y)) continue;
      tomadas.push(c);
      guardioes.push({ preset: p.preset, x: c.x, y: c.y, nivel });
      k++;
    }
  }
  return { ninhos, guardioes };
}

/** O ninho da criatura em que (x, y) está, ou null: só o ninho do mesmo preset conta. */
export function ninhoDe(ninhos: readonly NinhoDaFase[] | undefined, preset: string, x: number, y: number): NinhoDaFase | null {
  return (ninhos ?? []).find((n) => n.preset === preset && Math.hypot(x - n.x, y - n.y) <= n.raio) ?? null;
}
