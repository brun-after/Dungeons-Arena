// Movimento célula a célula com integração por distância (§2.2, §2.3).
// Cada passo é cardinal: reserva o destino, avança `progressoPasso` pela velocidade e, ao
// completar, a posição lógica vira o destino. Um tick pode consumir vários passos.

import type { Celula, Dir8 } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import type { EstadoJogo } from '../core/estado';
import { movimentoBloqueado } from '../combat/efeitos';
import { emPasso, type Entidade } from '../entities/entidade';
import { celulaLivrePara, ordemRotativa } from './colisao';
import { passavel } from './fase';
import { caminho } from './navegacao';

export const VETOR_DIR: Readonly<Record<Dir8, readonly [number, number]>> = {
  N: [0, -1],
  NE: [1, -1],
  E: [1, 0],
  SE: [1, 1],
  S: [0, 1],
  SO: [-1, 1],
  O: [-1, 0],
  NO: [-1, -1],
};

/** Guarda de iteração do integrador por entidade e por tick. */
const MAX_PASSOS_POR_TICK = 8;
/** Absorve o erro de ponto flutuante ao somar frações de célula (D-005). */
const EPS = 1e-9;

/** Velocidade em células por segundo (§2.3). Destreza 10 → 2,5; destreza 20 → 3,75. */
export function velocidade(destreza: number, velocidadeBaseMs: number, dominado = false): number {
  let mult = Math.max(0.2, 1 + ((destreza - 10) * 5) / 100);
  if (dominado) mult *= 1.3;
  return Math.max(0.3, (1000 / velocidadeBaseMs) * mult);
}

interface PassoEscolhido {
  celula: Celula;
  proximoEixoX: boolean;
}

/** Primeiro passo cardinal de uma direção, sem checar terreno nem colisão. */
function passoBruto(e: Entidade, dir: Dir8): Celula {
  const [dx, dy] = VETOR_DIR[dir];
  if (dx !== 0 && dy !== 0) return e.proximoEixoX ? { x: e.x + dx, y: e.y } : { x: e.x, y: e.y + dy };
  return { x: e.x + dx, y: e.y + dy };
}

/**
 * Comando `mover` (§2.3): a entrada mantida é estado direcional. Trocar de direção com menos de
 * 50% do passo concluído cancela o passo, a menos que a nova direção leve à mesma célula.
 * Parar não cancela: o passo em curso termina, para o personagem não ficar entre células.
 */
export function definirDirecao(e: Entidade, dir: Dir8 | 'parado'): void {
  if (dir === e.direcao) return;
  e.direcao = dir;
  e.proximoEixoX = true; // em empate, a diagonal começa por X
  if (dir === 'parado') return;

  e.caminho = [];
  e.waypoints = [];
  if (emPasso(e) && e.progressoPasso < 0.5) {
    const novo = passoBruto(e, dir);
    if (novo.x !== e.destinoX || novo.y !== e.destinoY) {
      e.destinoX = e.x;
      e.destinoY = e.y;
      e.progressoPasso = 0;
    }
  }
}

/** Comando `irPara`: caminho pela navegação a partir de onde o passo em curso vai terminar. */
export function planejarCaminho(
  e: Entidade,
  destino: Celula,
  ctx: ContextoSimulacao,
  tick: number,
  saida: EventoSimulacao[],
  maxPassos = ctx.balance.navegacao.maxPassosToque,
): boolean {
  const origem = { x: e.destinoX, y: e.destinoY };
  const resultado = caminho(ctx.fase, origem, destino, maxPassos);
  if (resultado.status !== 'alcancado') {
    saida.push({ t: 'caminhoFalhou', tick, id: e.id, status: resultado.status });
    return false;
  }
  e.direcao = 'parado';
  e.caminho = resultado.passos;
  e.waypoints = [];
  return true;
}

/** Para de andar: limpa caminho e direção. O passo em curso termina normalmente. */
export function pararMovimento(e: Entidade): void {
  e.direcao = 'parado';
  e.caminho = [];
  e.waypoints = [];
}

/** A entidade pode entrar na célula agora (terreno e reservas de outras entidades)? */
export function celulaLivre(e: Entidade, x: number, y: number, estado: EstadoJogo, ctx: ContextoSimulacao): boolean {
  return podeEntrar(e, x, y, estado, ctx);
}

export function moverEntidades(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  saida: EventoSimulacao[],
  dtMs: number,
): void {
  for (const e of ordemRotativa(estado.entidades, estado.tick)) {
    integrarEntidade(e, estado, ctx, saida, dtMs);
  }
}

/** Integra o movimento de uma única entidade por um tick (usado também pela predição do cliente). */
export function integrarEntidade(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[], dtMs: number) {
  if (e.morto) return;
  const vel = velocidade(e.atributos.destreza, ctx.balance.movimento.velocidadeBaseMs);
  let restante = (dtMs / 1000) * vel;

  for (let guarda = 0; guarda < MAX_PASSOS_POR_TICK; guarda++) {
    if (!emPasso(e)) {
      if (restante <= EPS) return;
      const passo = escolherPasso(e, estado, ctx);
      if (!passo) {
        e.progressoPasso = 0;
        return;
      }
      e.destinoX = passo.celula.x;
      e.destinoY = passo.celula.y;
      e.proximoEixoX = passo.proximoEixoX;
      e.progressoPasso = 0;
    }

    const falta = 1 - e.progressoPasso;
    if (restante + EPS < falta) {
      e.progressoPasso += restante;
      e.relogioAndar += (1000 * restante) / vel;
      return;
    }
    restante = Math.max(0, restante - falta);
    e.relogioAndar += (1000 * falta) / vel;
    e.x = e.destinoX;
    e.y = e.destinoY;
    e.progressoPasso = 0;
    saida.push({ t: 'moveu', tick: estado.tick, id: e.id, x: e.x, y: e.y });
  }
}

function podeEntrar(e: Entidade, x: number, y: number, estado: EstadoJogo, ctx: ContextoSimulacao): boolean {
  return passavel(ctx.fase, x, y) && celulaLivrePara(e, x, y, estado.entidades, ctx.balance.colisao);
}

function escolherPasso(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao): PassoEscolhido | null {
  // Quem conjura ou está atordoado não começa passo novo; o passo em curso termina (D-017).
  if (e.acao || movimentoBloqueado(e, estado.tick)) return null;
  // Reabastece a fila curta a partir do caminho do irPara.
  const max = ctx.balance.movimento.filaMaxWaypoints;
  while (e.waypoints.length < max && e.caminho.length > 0) {
    const proximo = e.caminho.shift();
    if (proximo) e.waypoints.push(proximo);
  }

  const wp = e.waypoints[0];
  if (wp) {
    const adjacente = Math.abs(wp.x - e.x) + Math.abs(wp.y - e.y) === 1;
    if (!adjacente || !passavel(ctx.fase, wp.x, wp.y)) {
      e.waypoints = [];
      e.caminho = [];
      return null;
    }
    // Ocupado por outra entidade: espera, mantendo o caminho.
    if (!podeEntrar(e, wp.x, wp.y, estado, ctx)) return null;
    e.waypoints.shift();
    return { celula: wp, proximoEixoX: e.proximoEixoX };
  }

  if (e.direcao === 'parado') return null;
  return passoDirecional(e, e.direcao, estado, ctx);
}

/** Diagonal vira passos cardinais alternados; eixo bloqueado cede ao outro; ambos bloqueados param. */
function passoDirecional(e: Entidade, dir: Dir8, estado: EstadoJogo, ctx: ContextoSimulacao): PassoEscolhido | null {
  const [dx, dy] = VETOR_DIR[dir];
  if (dx === 0 || dy === 0) {
    const celula = { x: e.x + dx, y: e.y + dy };
    return podeEntrar(e, celula.x, celula.y, estado, ctx) ? { celula, proximoEixoX: e.proximoEixoX } : null;
  }
  const emX = { x: e.x + dx, y: e.y };
  const emY = { x: e.x, y: e.y + dy };
  const [primeiro, segundo] = e.proximoEixoX ? [emX, emY] : [emY, emX];
  if (podeEntrar(e, primeiro.x, primeiro.y, estado, ctx)) return { celula: primeiro, proximoEixoX: !e.proximoEixoX };
  if (podeEntrar(e, segundo.x, segundo.y, estado, ctx)) return { celula: segundo, proximoEixoX: e.proximoEixoX };
  return null;
}
