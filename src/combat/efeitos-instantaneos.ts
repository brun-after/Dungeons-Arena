import { muralhaEm } from './tatica';
// Efeitos instantâneos de deslocamento (§2.8): teleporte, avanço e empurrão. Marco 8A (13/10/2026).
// Marco 14 (14/10/2026): puxão (para perto de quem puxa) e troca de lugar.
// Todo destino é conferido com passabilidade e colisão: ninguém para dentro de parede nem em cima
// de quem bloqueia (invariante do harness). Andam célula a célula em 8 direções e param no
// primeiro obstáculo.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { posicionar, type Entidade } from '../entities/entidade';
import { celulaLivrePara } from '../world/colisao';
import { passavel } from '../world/fase';
import { caminho } from '../world/navegacao';
import { suavizarCaminho } from '../world/corpo';

function livre(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, x: number, y: number): boolean {
  return !muralhaEm(estado, x, y) && passavel(ctx.fase, x, y) && celulaLivrePara(e, x, y, estado.entidades, ctx.balance.colisao);
}

/** Coloca a entidade numa célula, parada: o passo em curso e o caminho planejado são descartados. */
export function reposicionar(e: Entidade, x: number, y: number): void {
  posicionar(e, x, y);
  e.caminho = [];
  e.waypoints = [];
}

/** Anda até `passos` células na direção (dx, dy) ∈ {−1, 0, 1}², parando antes do primeiro obstáculo. */
function deslizar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, dx: number, dy: number, passos: number): boolean {
  if (dx === 0 && dy === 0) return false;
  let { x, y } = e;
  let andou = 0;
  for (let i = 0; i < passos; i++) {
    if (!livre(estado, ctx, e, x + dx, y + dy)) break;
    x += dx;
    y += dy;
    andou++;
  }
  if (andou > 0) reposicionar(e, x, y);
  return andou > 0;
}

export function teleportar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, mira: Celula | null): boolean {
  if (!mira || !livre(estado, ctx, e, mira.x, mira.y)) return false;
  reposicionar(e, mira.x, mira.y);
  return true;
}

/** Avança em direção à célula mirada, sem passar dela. */
export function avancar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, mira: Celula | null, celulas: number): boolean {
  if (!mira) return false;
  // D-078 (17/10/2026): o avanço voluntário mantém a intenção de ir até o ponto clicado.
  const destino = e.caminho.at(-1) ?? e.waypoints.at(-1) ?? null;
  const distancia = Math.max(Math.abs(mira.x - e.x), Math.abs(mira.y - e.y));
  const andou = deslizar(estado, ctx, e, Math.sign(mira.x - e.x), Math.sign(mira.y - e.y), Math.min(celulas, distancia));
  if (andou && destino) {
    // Marco 26 (D-104): o resto do caminho, de novo em trechos retos a partir de onde o avanço parou.
    const passos = caminho(ctx.fase, e, { x: Math.round(destino.x), y: Math.round(destino.y) }, ctx.balance.navegacao.maxPassosToque).passos;
    e.caminho = suavizarCaminho(ctx.fase, { x: e.px, y: e.py }, passos, ctx.balance.movimento.raioCorpo);
  }
  return andou;
}

/** Puxa em direção à origem, parando ao lado dela (marco 14). */
export function puxar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, origem: Celula, celulas: number): boolean {
  const distancia = Math.max(Math.abs(origem.x - e.x), Math.abs(origem.y - e.y));
  return deslizar(estado, ctx, e, Math.sign(origem.x - e.x), Math.sign(origem.y - e.y), Math.min(celulas, distancia - 1));
}

/** Troca de lugar (marco 14): as duas param no meio do passo e trocam de célula. */
export function trocarLugar(a: Entidade, b: Entidade): boolean {
  if (a.id === b.id) return false;
  const { x, y } = a;
  reposicionar(a, b.x, b.y);
  reposicionar(b, x, y);
  return true;
}

/** Empurra para longe da origem. Sem direção (mesma célula), não empurra. */
export function empurrar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, origem: Celula, celulas: number): boolean {
  return deslizar(estado, ctx, e, Math.sign(e.x - origem.x), Math.sign(e.y - origem.y), celulas);
}

/**
 * Marco 24 (24/10/2026): arremessa para longe da origem (a Telecinese). Devolve se bateu em algo antes de completar
 * as células (parede, muralha ou alguém no caminho) — quem bate fica atordoado em efeitos.ts.
 */
export function arremessar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, origem: Celula, celulas: number): boolean {
  const dx = Math.sign(e.x - origem.x);
  const dy = Math.sign(e.y - origem.y);
  if (dx === 0 && dy === 0) return false;
  let { x, y } = e;
  let andou = 0;
  while (andou < celulas && livre(estado, ctx, e, x + dx, y + dy)) {
    x += dx;
    y += dy;
    andou++;
  }
  if (andou > 0) reposicionar(e, x, y);
  return andou < celulas;
}
