import { classeDe, progressoReforcosGuerreiro } from '../combat/ajustes-classes';
import { velocidadeEncarnacao } from '../combat/encarnacao';
import { celulaOcupada } from '../combat/geometria';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import { podeFerir } from '../modos/relacao';
import { dispararGanchosDe } from '../progression/ganchos-do-portador';
import { muralhaEm } from '../combat/tatica';
import { direcaoDe } from '../combat/orientacao';
import { multiplicadorDoPassoDoFalcao } from '../combat/companheiro';
// Movimento livre (§2.2, §2.3). Marco 26 (25/10/2026, D-104): antes célula a célula, em passos cardinais (a diagonal
// virava escadinha); agora a posição é contínua e anda em qualquer ângulo.
// - a direção mantida (`mover`) é um vetor quantizado em ±1000 (o teclado e a IA mandam um dos 8 octantes);
// - o `irPara` vira pontos em linha reta (o caminho de células suavizado, world/corpo.ts);
// - o corpo é um círculo: desliza nas paredes e em volta de quem bloqueia (as regras de `bloqueia`, world/colisao.ts);
// - a célula ocupada (`x`, `y`) é o arredondamento da posição, e as regras por célula seguem iguais: ao mudar de
//   célula saem o evento `moveu`, a regeneração por célula andada e o cruzar com inimigo.
// Só soma, produto, divisão e raiz: o cliente (predição) e o servidor chegam ao mesmo lugar.

import type { Celula, Dir8 } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import type { EstadoJogo } from '../core/estado';
import { resolverHabilidade } from '../combat/compilar-habilidade';
import { lentidaoPct, movimentoBloqueado } from '../combat/efeitos';
import type { Mobilidade } from '../combat/habilidades';
import { sincronizarPosicao, type Entidade } from '../entities/entidade';
import { regenerarPorPasso } from '../progression/recursos';
import { bloqueia, celulaLivrePara, ordemRotativa } from './colisao';
import { corpoCabe, suavizarCaminho, type Barreira } from './corpo';
import { passavel } from './fase';
import { caminho, caminhoComCusto } from './navegacao';

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

/** A escala da direção quantizada (o comando `mover` leva inteiros em ±ESCALA_RUMO). */
export const ESCALA_RUMO = 1000;
/** O maior trecho andado de uma vez: menor que o raio do corpo, nenhuma quina passa no meio. */
const SUBPASSO = 0.2;
/** Chegou ao ponto (em células). */
const CHEGOU = 0.02;
/** Guarda de iteração do integrador por entidade e por tick. */
const MAX_TRECHOS_POR_TICK = 16;
/** Absorve o erro de ponto flutuante ao somar frações de célula (D-005). */
const EPS = 1e-9;
/** Quantas bissecções para encostar na parede (0,2 / 2¹⁰: rente a menos de 0,0002 célula). */
const BISSECCOES = 10;

/** Velocidade em células por segundo (§2.3). Destreza 10 -> 2,5; destreza 20 -> 3,75. */
export function velocidade(destreza: number, velocidadeBaseMs: number, dominado = false): number {
  let mult = Math.max(0.2, 1 + ((destreza - 10) * 5) / 100);
  if (dominado) mult *= 1.3;
  return Math.max(0.3, (1000 / velocidadeBaseMs) * mult);
}

/** O vetor (quantizado) de um octante. */
export function rumoDe(dir: Dir8): { dx: number; dy: number } {
  const [dx, dy] = VETOR_DIR[dir];
  return { dx: dx * ESCALA_RUMO, dy: dy * ESCALA_RUMO };
}

/**
 * Comando `mover` (§2.3): a direção mantida. Marco 26 (D-104): `dx`, `dy` é o vetor exato (o joystick e o isométrico
 * mandam qualquer ângulo); sem ele, o octante `dir`. Parar para onde está (sem terminar passo: não há passo).
 */
export function definirDirecao(e: Entidade, dir: Dir8 | 'parado', dx?: number, dy?: number): void {
  const rumo = dx !== undefined && dy !== undefined ? { dx, dy } : dir === 'parado' ? { dx: 0, dy: 0 } : rumoDe(dir);
  const octante = direcaoDe(rumo.dx, rumo.dy);
  e.rumoX = octante ? rumo.dx : 0;
  e.rumoY = octante ? rumo.dy : 0;
  e.direcao = octante ?? 'parado';
  if (!octante) return;
  e.caminho = [];
  e.waypoints = [];
}

/**
 * Comando `irPara`: o caminho de células pela navegação, suavizado em trechos retos (marco 26: sem escadinha). O
 * destino pode ter fração (o ponto tocado); se o corpo não cabe nele, para no centro da célula.
 */
export function planejarCaminho(
  e: Entidade,
  destino: Celula,
  ctx: ContextoSimulacao,
  tick: number,
  saida: EventoSimulacao[],
  maxPassos = ctx.balance.navegacao.maxPassosToque,
  // Marco 25 (25/10/2026, D-100): a IA que evita perigo passa o mapa dele (world/perigos.ts).
  perigo: Uint8Array | null = null,
): boolean {
  const origem = { x: e.x, y: e.y };
  const celula = { x: Math.round(destino.x), y: Math.round(destino.y) };
  const resultado = perigo ? caminhoComCusto(ctx.fase, origem, celula, maxPassos, perigo, ctx.balance.ia.custoPerigo) : caminho(ctx.fase, origem, celula, maxPassos);
  if (resultado.status !== 'alcancado') {
    saida.push({ t: 'caminhoFalhou', tick, id: e.id, status: resultado.status });
    return false;
  }
  const r = ctx.balance.movimento.raioCorpo;
  const largura = ctx.fase.largura;
  // Na suavização, o perigo que a IA evita conta como parede (o atalho não corta pelas brasas).
  const barreira: Barreira | null = perigo ? (x, y) => perigo[y * largura + x] === 1 : null;
  const celulas = resultado.passos.length > 0 ? resultado.passos : [celula];
  const pontos = suavizarCaminho(ctx.fase, { x: e.px, y: e.py }, celulas, r, barreira);
  const ultimo = pontos.at(-1);
  if (ultimo && (destino.x !== celula.x || destino.y !== celula.y) && corpoCabe(ctx.fase, destino.x, destino.y, r)) {
    ultimo.x = destino.x;
    ultimo.y = destino.y;
  }
  e.direcao = 'parado';
  e.rumoX = 0;
  e.rumoY = 0;
  e.caminho = pontos;
  e.waypoints = [];
  return true;
}

/** Para de andar: limpa caminho e direção, onde estiver. */
export function pararMovimento(e: Entidade): void {
  e.direcao = 'parado';
  e.rumoX = 0;
  e.rumoY = 0;
  e.caminho = [];
  e.waypoints = [];
}

/** A entidade pode entrar na célula agora (terreno, muralha e a célula de outra entidade que a bloqueia)? */
export function celulaLivre(e: Entidade, x: number, y: number, estado: EstadoJogo, ctx: ContextoSimulacao): boolean {
  return !muralhaEm(estado, x, y) && passavel(ctx.fase, x, y) && celulaLivrePara(e, x, y, estado.entidades, ctx.balance.colisao);
}

export function moverEntidades(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  saida: EventoSimulacao[],
  dtMs: number,
): void {
  // Antes de alguém andar, todos com a posição contínua na própria célula (a colisão lê a dos outros).
  for (const e of estado.entidades) sincronizarPosicao(e);
  for (const e of ordemRotativa(estado.entidades, estado.tick)) {
    integrarEntidade(e, estado, ctx, saida, dtMs);
  }
}

/** Células por segundo da entidade agora (destreza, lentidão, conjuração, classe e efeitos). */
function velocidadeAgora(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao): number {
  // Marco 10A-3: invocação (não dominada) anda uma célula a cada `passoMs` (§2.9, 380 ms).
  const inv = e.invocacao;
  const vel =
    inv && !inv.dominado
      ? // Marco 25 (D-102): o falcão mergulhando ou no dash anda mais rápido que na patrulha.
        inv.companheiro
        ? (1000 / ctx.balance.ajustesClasses.aventureiro.falcaoPassoMs) * multiplicadorDoPassoDoFalcao(estado, ctx, e)
        : 1000 / ctx.balance.invocacoes.passoMs
      : velocidade(e.atributos.destreza, ctx.balance.movimento.velocidadeBaseMs, inv?.dominado ?? false);
  // Marco 14: o frio (resfriado) deixa mais lento. Ajuste de 15/10/2026: conjurar uma habilidade `lenta` também.
  const conjurando = mobilidadeDaAcao(e, ctx) === 'lenta' ? ctx.balance.habilidades.velocidadeConjurandoLenta : 1;
  const r = ctx.balance.ajustesClasses.guerreiro;
  // Marco 22 (D-089): o Mago encarnado em raio anda mais rápido.
  const classe = (classeDe(e) === 'guerreiro' && !inv ? 1 + (r.movimentoMult - 1) * progressoReforcosGuerreiro(ctx, e.nivel) : 1) * velocidadeEncarnacao(ctx, e);
  const bonus = e.efeitos.reduce((pct, f) => f.ateTick > estado.tick && REGISTRO_EFEITOS[f.tipo].velocidade ? Math.max(pct, f.pct) : pct, 0);
  return vel * (1 - lentidaoPct(e, estado.tick) / 100) * conjurando * classe * (1 + bonus / 100);
}

/** Integra o movimento de uma única entidade por um tick (usado também pela predição do cliente). */
export function integrarEntidade(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[], dtMs: number) {
  if (e.morto) return;
  sincronizarPosicao(e);
  // Quem conjura uma ação que trava ou está atordoado não anda (D-017, D-060).
  if (mobilidadeDaAcao(e, ctx) === 'trava' || movimentoBloqueado(e, estado.tick)) return;
  const vel = velocidadeAgora(e, estado, ctx);
  let restante = (dtMs / 1000) * vel;

  for (let guarda = 0; guarda < MAX_TRECHOS_POR_TICK && restante > EPS; guarda++) {
    // Reabastece a fila curta a partir do caminho do irPara.
    while (e.waypoints.length < ctx.balance.movimento.filaMaxWaypoints && e.caminho.length > 0) {
      const proximo = e.caminho.shift();
      if (proximo) e.waypoints.push(proximo);
    }
    const wp = e.waypoints[0];
    let ux: number;
    let uy: number;
    let trecho: number;
    if (wp) {
      const dx = wp.x - e.px;
      const dy = wp.y - e.py;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= CHEGOU) {
        e.waypoints.shift();
        continue;
      }
      ux = dx / d;
      uy = dy / d;
      trecho = Math.min(restante, d);
    } else if (e.direcao !== 'parado') {
      // Sem vetor exato (direção escrita direto, saves antigos), vale o octante.
      const rumo = e.rumoX !== 0 || e.rumoY !== 0 ? { dx: e.rumoX, dy: e.rumoY } : rumoDe(e.direcao);
      const n = Math.sqrt(rumo.dx * rumo.dx + rumo.dy * rumo.dy);
      ux = rumo.dx / n;
      uy = rumo.dy / n;
      trecho = restante;
    } else {
      return;
    }
    // Quem anda olha para onde vai (Marco 24, D-097), salvo se está golpeando alguém.
    const olhar = e.acao ? null : direcaoDe(ux, uy);
    if (olhar) e.olhando = olhar;
    const andou = andar(e, ux * trecho, uy * trecho, estado, ctx, saida);
    e.relogioAndar += (1000 * andou) / vel;
    restante -= trecho;
    if (andou < EPS) {
      // Preso: atrás de quem bloqueia, espera mantendo o caminho; contra a parede, desiste do ponto.
      if (wp && !bloqueadoPorEntidade(e, e.px + ux * SUBPASSO, e.py + uy * SUBPASSO, estado, ctx)) e.waypoints.shift();
      return;
    }
  }
}

/**
 * Anda (dx, dy) em subpassos, um eixo de cada vez: o eixo que bate na parede (ou em quem bloqueia) fica, o outro
 * segue — o corpo desliza. Devolve a distância de fato andada.
 */
function andar(e: Entidade, dx: number, dy: number, estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): number {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / SUBPASSO));
  const sx = dx / n;
  const sy = dy / n;
  let andou = 0;
  for (let k = 0; k < n; k++) {
    const x0 = e.px;
    const y0 = e.py;
    avancarEixo(e, sx, 0, estado, ctx);
    avancarEixo(e, 0, sy, estado, ctx);
    if (e.px === x0 && e.py === y0) contornar(e, sx, sy, estado, ctx);
    const mx = e.px - x0;
    const my = e.py - y0;
    if (mx === 0 && my === 0) break;
    andou += Math.sqrt(mx * mx + my * my);
    trocarDeCelula(e, estado, ctx, saida);
  }
  return andou;
}

/** Anda o subpasso num eixo; se não cabe inteiro, encosta (bissecção curta: o corpo para rente à parede). */
function avancarEixo(e: Entidade, sx: number, sy: number, estado: EstadoJogo, ctx: ContextoSimulacao): void {
  if (sx === 0 && sy === 0) return;
  if (cabe(e, e.px + sx, e.py + sy, estado, ctx)) {
    e.px += sx;
    e.py += sy;
    return;
  }
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < BISSECCOES; i++) {
    const m = (lo + hi) / 2;
    if (cabe(e, e.px + sx * m, e.py + sy * m, estado, ctx)) lo = m;
    else hi = m;
  }
  if (lo > 0) {
    e.px += sx * lo;
    e.py += sy * lo;
  }
}

/**
 * Travado de frente contra um corpo que bloqueia: tira do subpasso a componente que aproxima os dois e anda o resto
 * (a tangente), com o comprimento do subpasso — o corpo escorrega em volta em vez de parar.
 */
function contornar(e: Entidade, sx: number, sy: number, estado: EstadoJogo, ctx: ContextoSimulacao): void {
  const alcance = 2 * ctx.balance.movimento.raioCorpo + SUBPASSO;
  let perto: Entidade | null = null;
  let menor = alcance * alcance;
  for (const o of estado.entidades) {
    if (o === e || o.morto || !bloqueia(e, o, ctx.balance.colisao)) continue;
    const d = (o.px - e.px) ** 2 + (o.py - e.py) ** 2;
    if (d < menor && d > EPS) {
      menor = d;
      perto = o;
    }
  }
  if (!perto) return;
  const d = Math.sqrt(menor);
  const nx = (e.px - perto.px) / d;
  const ny = (e.py - perto.py) / d;
  const dot = sx * nx + sy * ny;
  if (dot >= 0) return;
  let tx = sx - dot * nx;
  let ty = sy - dot * ny;
  const t = Math.sqrt(tx * tx + ty * ty);
  if (t < EPS) return;
  const s = Math.sqrt(sx * sx + sy * sy);
  tx = (tx / t) * s;
  ty = (ty / t) * s;
  avancarEixo(e, tx, 0, estado, ctx);
  avancarEixo(e, 0, ty, estado, ctx);
}

/** O corpo da entidade cabe em (x, y): terreno, muralhas e quem a bloqueia (só barra quem se aproxima). */
function cabe(e: Entidade, x: number, y: number, estado: EstadoJogo, ctx: ContextoSimulacao): boolean {
  const r = ctx.balance.movimento.raioCorpo;
  if (!corpoCabe(ctx.fase, x, y, r, (i, j) => muralhaEm(estado, i, j) !== undefined)) return false;
  return !bloqueadoPorEntidade(e, x, y, estado, ctx);
}

/** Algum corpo que bloqueia `e` fica mais perto que dois raios em (x, y), e o passo aproxima os dois? */
function bloqueadoPorEntidade(e: Entidade, x: number, y: number, estado: EstadoJogo, ctx: ContextoSimulacao): boolean {
  const minimo = 2 * ctx.balance.movimento.raioCorpo;
  for (const o of estado.entidades) {
    if (o === e || o.morto || !bloqueia(e, o, ctx.balance.colisao)) continue;
    const nx = o.px - x;
    const ny = o.py - y;
    const novo = nx * nx + ny * ny;
    if (novo >= minimo * minimo) continue;
    // Já encostados (nasceram juntos): pode se afastar, não se aproximar.
    const ax = o.px - e.px;
    const ay = o.py - e.py;
    if (novo < ax * ax + ay * ay - EPS || novo < EPS) return true;
  }
  return false;
}

/** Atualiza a célula ocupada; ao mudar, o evento `moveu`, a regeneração por célula andada e o cruzar com inimigo. */
function trocarDeCelula(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const x = Math.round(e.px);
  const y = Math.round(e.py);
  if (x === e.x && y === e.y) return;
  e.x = x;
  e.y = y;
  cruzarCelula(e, estado, ctx, saida);
  saida.push({ t: 'moveu', tick: estado.tick, id: e.id, x, y });
  regenerarPorPasso(estado, ctx, e);
}

/** Como a ação em curso deixa andar (sem ação: livre). */
function mobilidadeDaAcao(e: Entidade, ctx: ContextoSimulacao): Mobilidade {
  if (!e.acao) return 'livre';
  return resolverHabilidade(ctx, e.acao.chave)?.mobilidade ?? 'trava';
}

/** 18/10/2026: dispara ao mudar de célula ocupada, inclusive se o inimigo cruzar o portador parado. */
function cruzarCelula(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const agora = celulaOcupada(e);
  for (const outro of estado.entidades) {
    if (outro === e || outro.morto || outro.hp <= 0) continue;
    const c = celulaOcupada(outro);
    if (c.x !== agora.x || c.y !== agora.y) continue;
    if (e.bolsa && podeFerir(e, outro, ctx.modo)) dispararGanchosDe(estado, ctx, e, 'aoCruzarInimigo', { outro }, saida);
    if (outro.bolsa && podeFerir(outro, e, ctx.modo)) dispararGanchosDe(estado, ctx, outro, 'aoCruzarInimigo', { outro: e }, saida);
  }
}
