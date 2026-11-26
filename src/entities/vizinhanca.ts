// Marco 54 (26/11/2026, D-207): quem está perto de um ponto, sem varrer todas as entidades. No Mundo contínuo há
// centenas de monstros acordados na mesma sala, e cada um procurava alvo, batalha e fogo em `estado.entidades` inteiro a
// cada tique (O(n²)). Aqui as entidades vão para blocos de `LADO` células uma vez por tique, e a consulta devolve as dos
// blocos que cobrem o quadrado pedido: um superconjunto (quem chama ainda confere a distância de verdade). A grade é
// refeita quando muda o tique, a lista ou o tamanho dela (alguém nasceu ou saiu). Puro: é só memória do cálculo.

import type { EstadoJogo } from '../core/estado';
import type { Entidade } from './entidade';

const LADO = 16;
/** Abaixo disto, varrer a lista é mais barato que montar a grade. */
const MINIMO = 64;

interface Grade {
  tick: number;
  lista: readonly Entidade[];
  tamanho: number;
  blocos: Map<number, Entidade[]>;
}

const grades = new WeakMap<EstadoJogo, Grade>();

const chave = (bx: number, by: number) => by * 65_536 + bx;

function gradeDe(estado: EstadoJogo): Grade {
  const g = grades.get(estado);
  if (g && g.tick === estado.tick && g.lista === estado.entidades && g.tamanho === estado.entidades.length) return g;
  const blocos = new Map<number, Entidade[]>();
  for (const e of estado.entidades) {
    const k = chave(Math.floor(e.x / LADO), Math.floor(e.y / LADO));
    const b = blocos.get(k);
    if (b) b.push(e);
    else blocos.set(k, [e]);
  }
  const nova = { tick: estado.tick, lista: estado.entidades, tamanho: estado.entidades.length, blocos };
  grades.set(estado, nova);
  return nova;
}

/** As entidades que podem estar a até `raio` células (Chebyshev) do ponto; a lista inteira se for pequena. */
export function vizinhosDe(estado: EstadoJogo, x: number, y: number, raio: number): readonly Entidade[] {
  if (estado.entidades.length < MINIMO) return estado.entidades;
  const g = gradeDe(estado);
  const r = Math.ceil(raio) + 1;
  const saida: Entidade[] = [];
  for (let by = Math.floor((y - r) / LADO); by <= Math.floor((y + r) / LADO); by++) {
    for (let bx = Math.floor((x - r) / LADO); bx <= Math.floor((x + r) / LADO); bx++) {
      const b = g.blocos.get(chave(bx, by));
      if (b) for (const e of b) saida.push(e);
    }
  }
  return saida;
}
