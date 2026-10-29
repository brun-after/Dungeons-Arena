import { muralhaEm } from './tatica';
// Efeitos instantâneos de deslocamento (§2.8): teleporte, avanço e empurrão. Marco 8A (13/10/2026).
// Marco 14 (14/10/2026): puxão (para perto de quem puxa) e troca de lugar.
// Todo destino é conferido com passabilidade e colisão: ninguém para dentro de parede nem em cima
// de quem bloqueia (invariante do harness). Andam célula a célula em 8 direções e param no
// primeiro obstáculo.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { posicionar, vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { celulaOcupada } from './geometria';
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

/** As células da reta de `de` até `ate` (Bresenham), sem a de partida. */
export function linhaAte(de: Celula, ate: Celula): Celula[] {
  const celulas: Celula[] = [];
  let { x, y } = de;
  const dx = Math.abs(ate.x - x);
  const dy = -Math.abs(ate.y - y);
  const sx = Math.sign(ate.x - x);
  const sy = Math.sign(ate.y - y);
  let erro = dx + dy;
  while (x !== ate.x || y !== ate.y) {
    const e2 = 2 * erro;
    if (e2 >= dy) {
      erro += dy;
      x += sx;
    }
    if (e2 <= dx) {
      erro += dx;
      y += sy;
    }
    celulas.push({ x, y });
  }
  return celulas;
}

/**
 * Marco 26 (28/10/2026, D-120): onde o avanço para na reta até a mira, em até `passos` células. As paredes do meio
 * não param quem passa (o dash troca de corredor); fora do mapa ou uma muralha tática encerram a reta.
 * Marco 26 (29/10/2026, D-125): o primeiro hostil do caminho também; quem investe para nele (a linha da habilidade
 * ainda acerta quem estiver além). Sem célula livre antes dele ou da mira (o alvo logo atrás da parede), pousa ao lado.
 */
function fimDoAvanco(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, mira: Celula, passos: number, celulas: number): Celula | null {
  let achada: Celula | null = null;
  const reta = linhaAte({ x: e.x, y: e.y }, mira).slice(0, passos);
  for (const [i, c] of reta.entries()) {
    // A muralha tática é feita para barrar: ela para o dash (as paredes do mapa, não).
    if (c.x < 0 || c.y < 0 || c.x >= ctx.fase.largura || c.y >= ctx.fase.altura || muralhaEm(estado, c.x, c.y)) return achada;
    if (hostilEm(estado, ctx, e, c)) return achada ?? (i > 0 ? vizinhaLivre(estado, ctx, e, c, celulas) : null);
    if (livre(estado, ctx, e, c.x, c.y)) achada = c;
  }
  return achada ?? (reta.length > 1 ? vizinhaLivre(estado, ctx, e, mira, celulas) : null);
}

/** Há um hostil vivo de `e` (pela relação do modo) parado na célula? */
function hostilEm(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, c: Celula): boolean {
  return estado.entidades.some((o) => {
    if (o === e || !vivo(o) || !podeFerir(e, o, ctx.modo)) return false;
    const oc = celulaOcupada(o);
    return oc.x === c.x && oc.y === c.y;
  });
}

/**
 * Marco 26 (29/10/2026, D-125): a célula livre vizinha da mira mais perto de quem avança, a até `celulas` dele
 * (desempate por y e x). É o pouso quando a reta não tem célula livre: o inimigo logo atrás da parede.
 */
function vizinhaLivre(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, mira: Celula, celulas: number): Celula | null {
  let melhor: Celula | null = null;
  let melhorD = Infinity;
  for (let y = mira.y - 1; y <= mira.y + 1; y++) {
    for (let x = mira.x - 1; x <= mira.x + 1; x++) {
      const d = Math.max(Math.abs(x - e.x), Math.abs(y - e.y));
      if (d === 0 || d > celulas || d >= melhorD || muralhaEm(estado, x, y) || !livre(estado, ctx, e, x, y)) continue;
      melhor = { x, y };
      melhorD = d;
    }
  }
  return melhor;
}

export function teleportar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, mira: Celula | null): boolean {
  if (!mira) return false;
  if (livre(estado, ctx, e, mira.x, mira.y)) {
    reposicionar(e, mira.x, mira.y);
    return true;
  }
  // D-120: mira na parede (ou ocupada): a célula livre mais perto dela, voltando pela reta até quem conjura.
  if (!ctx.balance.movimento.dashAtravessaParedes) return false;
  const volta = linhaAte(mira, { x: e.x, y: e.y }).slice(0, -1);
  const destino = volta.find((c) => livre(estado, ctx, e, c.x, c.y));
  if (!destino) return false;
  reposicionar(e, destino.x, destino.y);
  return true;
}

/** Avança em direção à célula mirada, sem passar dela. */
export function avancar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, mira: Celula | null, celulas: number): boolean {
  if (!mira) return false;
  // D-078 (17/10/2026): o avanço voluntário mantém a intenção de ir até o ponto clicado.
  const destino = e.caminho.at(-1) ?? e.waypoints.at(-1) ?? null;
  const distancia = Math.max(Math.abs(mira.x - e.x), Math.abs(mira.y - e.y));
  let andou: boolean;
  if (ctx.balance.movimento.dashAtravessaParedes) {
    // D-120: segue a reta até a mira e para na última célula livre dela, passando pelas paredes do meio.
    const fim = fimDoAvanco(estado, ctx, e, mira, Math.min(celulas, distancia), celulas);
    andou = !!fim;
    if (fim) reposicionar(e, fim.x, fim.y);
  } else andou = deslizar(estado, ctx, e, Math.sign(mira.x - e.x), Math.sign(mira.y - e.y), Math.min(celulas, distancia));
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
