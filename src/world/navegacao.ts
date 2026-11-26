// Navegação por busca em largura (§2.3): 4 direções, só terreno, com mapa `veioDe`
// (nunca copiando o caminho a cada expansão).

// Marco 44 (15/11/2026, D-178): a navegação contorna os troncos das árvores (world/troncos.ts).
// Marco 54 (26/11/2026, D-207): as buscas limitadas por `maxPassos` guardam só as células que visitam (Map), sem
// alocar vetores do tamanho do mapa inteiro a cada chamada: no Mundo contínuo a fase é o atlas todo.
import { temTronco } from './troncos';
import type { Celula } from '../core/comandos';
import { passavel, type Fase } from './fase';
import { andavelEntre, subidaEntre } from './relevo';

export type StatusCaminho = 'alcancado' | 'inacessivel' | 'limite_excedido';

export interface ResultadoCaminho {
  status: StatusCaminho;
  /** Células a percorrer, sem a origem e com o destino. Vazio se não alcançou. */
  passos: Celula[];
}

/** Ordem fixa de expansão: N, E, S, O. Mantém o resultado determinístico. */
const VIZINHOS: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export function caminho(fase: Fase, origem: Celula, destino: Celula, maxPassos = 60, livre?: (x: number,y: number)=>boolean): ResultadoCaminho {
  if (origem.x === destino.x && origem.y === destino.y) return { status: 'alcancado', passos: [] };
  if ((!passavel(fase, destino.x, destino.y) || livre?.(destino.x,destino.y) === false)) return { status: 'inacessivel', passos: [] };

  const { largura } = fase;
  const indice = (x: number, y: number) => y * largura + x;
  const veioDe = new Map<number, number>();
  const profundidade = new Map<number, number>();
  const inicio = indice(origem.x, origem.y);
  const alvo = indice(destino.x, destino.y);
  veioDe.set(inicio, inicio);
  profundidade.set(inicio, 0);

  const fila: number[] = [inicio];
  let cortado = false;
  for (let cabeca = 0; cabeca < fila.length; cabeca++) {
    const atual = fila[cabeca] as number;
    const prof = profundidade.get(atual) ?? 0;
    if (prof >= maxPassos) {
      cortado = true;
      continue;
    }
    const cx = atual % largura;
    const cy = (atual - cx) / largura;
    for (const [dx, dy] of VIZINHOS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if ((!passavel(fase, nx, ny) || livre?.(nx,ny) === false || !andavelEntre(fase, cx, cy, nx, ny) || (temTronco(fase, nx, ny) && (nx !== destino.x || ny !== destino.y)))) continue;
      const vizinho = indice(nx, ny);
      if (veioDe.has(vizinho)) continue;
      veioDe.set(vizinho, atual);
      profundidade.set(vizinho, prof + 1);
      if (vizinho === alvo) return { status: 'alcancado', passos: reconstruir(veioDe, inicio, alvo, largura) };
      fila.push(vizinho);
    }
  }
  // Se a busca foi cortada pelo limite, não dá para afirmar que o destino é inacessível.
  return { status: cortado ? 'limite_excedido' : 'inacessivel', passos: [] };
}

function reconstruir(veioDe: ReadonlyMap<number, number>, inicio: number, alvo: number, largura: number): Celula[] {
  const passos: Celula[] = [];
  for (let i = alvo; i !== inicio; i = veioDe.get(i) ?? inicio) {
    const x = i % largura;
    passos.push({ x, y: (i - x) / largura });
  }
  return passos.reverse();
}

/**
 * Marco 26 (26/10/2026, D-114): a célula alcançável (até `maxPassos`) mais perto de um ponto qualquer, mesmo parede ou
 * fora do mapa. Empate: a de menos passos e, nela, a primeira na ordem fixa da busca (determinístico).
 */
export function alcancavelMaisPerto(fase: Fase, origem: Celula, ponto: { x: number; y: number }, maxPassos = 60): Celula {
  const { largura } = fase;
  const indice = (x: number, y: number) => y * largura + x;
  const profundidade = new Map<number, number>();
  const distancia = (x: number, y: number) => (x - ponto.x) * (x - ponto.x) + (y - ponto.y) * (y - ponto.y);
  let melhor = origem;
  let melhorD = distancia(origem.x, origem.y);
  if (!passavel(fase, origem.x, origem.y)) return origem;
  profundidade.set(indice(origem.x, origem.y), 0);
  const fila: number[] = [indice(origem.x, origem.y)];
  for (let cabeca = 0; cabeca < fila.length; cabeca++) {
    const atual = fila[cabeca] as number;
    const prof = profundidade.get(atual) ?? 0;
    if (prof >= maxPassos) continue;
    const cx = atual % largura;
    const cy = (atual - cx) / largura;
    for (const [dx, dy] of VIZINHOS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!passavel(fase, nx, ny) || !andavelEntre(fase, cx, cy, nx, ny) || temTronco(fase, nx, ny)) continue;
      const vizinho = indice(nx, ny);
      if (profundidade.has(vizinho)) continue;
      profundidade.set(vizinho, prof + 1);
      fila.push(vizinho);
      const d = distancia(nx, ny);
      if (d < melhorD) {
        melhor = { x: nx, y: ny };
        melhorD = d;
      }
    }
  }
  return melhor;
}

/** Marca todas as células alcançáveis a partir da origem, sem limite (validação de fase). */
export function alcancaveis(fase: Fase, origem: Celula): Uint8Array {
  const marcadas = new Uint8Array(fase.largura * fase.altura);
  if (!passavel(fase, origem.x, origem.y)) return marcadas;
  const fila: Celula[] = [origem];
  marcadas[origem.y * fase.largura + origem.x] = 1;
  for (let cabeca = 0; cabeca < fila.length; cabeca++) {
    const { x, y } = fila[cabeca] as Celula;
    for (const [dx, dy] of VIZINHOS) {
      const nx = x + dx;
      const ny = y + dy;
      const i = ny * fase.largura + nx;
      if (!passavel(fase, nx, ny) || marcadas[i] === 1 || !andavelEntre(fase, x, y, nx, ny)) continue;
      marcadas[i] = 1;
      fila.push({ x: nx, y: ny });
    }
  }
  return marcadas;
}

/**
 * Marco 11A (16/10/2026): o alcance atravessando as portas internas (§2.1) — chegar a um extremo leva ao outro.
 * A validação do editor usa este, para uma fase dividida por portas não acusar saída inalcançável.
 */
export function alcancaveisComPortas(fase: Fase, origem: Celula): Uint8Array {
  const marcadas = alcancaveis(fase, origem);
  const pares = fase.portasInternas.filter((p) => passavel(fase, p.a.x, p.a.y) && passavel(fase, p.b.x, p.b.y));
  for (let mudou = true; mudou; ) {
    mudou = false;
    for (const p of pares) {
      const ia = p.a.y * fase.largura + p.a.x;
      const ib = p.b.y * fase.largura + p.b.x;
      const [de, para] = marcadas[ia] === 1 && marcadas[ib] !== 1 ? [ia, p.b] : marcadas[ib] === 1 && marcadas[ia] !== 1 ? [ib, p.a] : [-1, null];
      if (de < 0 || !para) continue;
      const novas = alcancaveis(fase, para);
      for (let i = 0; i < novas.length; i++) if (novas[i] === 1) marcadas[i] = 1;
      mudou = true;
    }
  }
  return marcadas;
}


/**
 * Marco 25 (25/10/2026, D-100): o caminho que contorna o perigo. Dijkstra por baldes (custo inteiro): entrar numa
 * célula marcada em `perigo` custa `1 + custoPerigo`; as demais, 1. Mesma ordem de expansão (N, E, S, O) e o mesmo
 * limite de passos do `caminho`; sem perigo no mapa, devolve o mesmo caminho que ele. Se só houver caminho pelo
 * perigo, atravessa (o custo só desempata).
 */
export function caminhoComCusto(fase: Fase, origem: Celula, destino: Celula, maxPassos: number, perigo: ReadonlySet<number>, custoPerigo: number, livre?: (x: number,y: number)=>boolean): ResultadoCaminho {
  if (origem.x === destino.x && origem.y === destino.y) return { status: 'alcancado', passos: [] };
  if ((!passavel(fase, destino.x, destino.y) || livre?.(destino.x,destino.y) === false)) return { status: 'inacessivel', passos: [] };

  const { largura } = fase;
  const custo = new Map<number, number>();
  const passos = new Map<number, number>();
  const veioDe = new Map<number, number>();
  const inicio = origem.y * largura + origem.x;
  const alvo = destino.y * largura + destino.x;
  custo.set(inicio, 0);
  passos.set(inicio, 0);
  veioDe.set(inicio, inicio);
  const baldes: number[][] = [[inicio]];
  let cortado = false;
  for (let c = 0; c < baldes.length; c++) {
    const balde = baldes[c];
    if (!balde) continue;
    for (let k = 0; k < balde.length; k++) {
      const atual = balde[k] as number;
      // Entrada velha: a célula já saiu de um balde mais barato.
      if (custo.get(atual) !== c) continue;
      if (atual === alvo) return { status: 'alcancado', passos: reconstruir(veioDe, inicio, alvo, largura) };
      const prof = passos.get(atual) ?? 0;
      if (prof >= maxPassos) {
        cortado = true;
        continue;
      }
      const cx = atual % largura;
      const cy = (atual - cx) / largura;
      for (const [dx, dy] of VIZINHOS) {
        const nx = cx + dx;
        const ny = cy + dy;
        if ((!passavel(fase, nx, ny) || livre?.(nx,ny) === false || !andavelEntre(fase, cx, cy, nx, ny) || (temTronco(fase, nx, ny) && (nx !== destino.x || ny !== destino.y)))) continue;
        const vizinho = ny * largura + nx;
        // Marco 42 (D-176): subir custa um passo a mais por nível (a IA prefere contornar o morro).
        const novo = c + 1 + (perigo.has(vizinho) ? custoPerigo : 0) + subidaEntre(fase, cx, cy, nx, ny);
        const antigo = custo.get(vizinho);
        if (antigo !== undefined && antigo <= novo) continue;
        custo.set(vizinho, novo);
        veioDe.set(vizinho, atual);
        passos.set(vizinho, prof + 1);
        (baldes[novo] ??= []).push(vizinho);
      }
    }
  }
  return { status: cortado ? 'limite_excedido' : 'inacessivel', passos: [] };
}
