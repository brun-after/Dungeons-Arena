import { ehDragao, porteDoDragao } from './porte-dragoes';
import { classeDe, progressoReforcosGuerreiro } from '../combat/ajustes-classes';
import { velocidadeEncarnacao } from '../combat/encarnacao';
import { celulaOcupada } from '../combat/geometria';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import { podeFerir } from '../modos/relacao';
import { dispararGanchosDe } from '../progression/ganchos-do-portador';
import { muralhaEm } from '../combat/tatica';
import { direcaoDe } from '../combat/orientacao';
import { multiplicadorDoPassoDoFalcao } from '../combat/companheiro';
import { passoDoPet, petDoCompanheiro, pressaDaCaca } from '../combat/pets';
import { atravessaCorpos, fatorDeVelocidade, fimDaTirolesa, fimDoSalto, naTirolesa, noAr, noSalto } from '../combat/movimento-classe';
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
import { msDe, ticksDe } from '../core/tempo';
import { bloqueia, celulaLivrePara, ordemRotativa } from './colisao';
import { corpoCabe, suavizarCaminho, type Barreira } from './corpo';
import { passavel, tipoEm } from './fase';
import { podePisarNoRefugio } from './refugio';
import { GradeDeCorpos } from './grade-corpos';
import { alcancavelMaisPerto, caminho, caminhoComCusto } from './navegacao';

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

/** 03/11/2026: asas e pernas do dragão não atravessam paredes; colisão entre atores conserva as regras de combate. */
export const raioNoTerreno = (e: Entidade, ctx: ContextoSimulacao): number => ehDragao(e.preset) ? porteDoDragao(e.nivel,ctx.balance).raio : ctx.balance.movimento.raioCorpo;
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
export function velocidade(destreza: number, velocidadeBaseMs: number, dominado = false, multMax = Infinity): number {
  // Marco 28 (D-127): com a Destreza até 100, a velocidade tem teto (`movimento.velocidadeMaxMult`).
  let mult = Math.min(multMax, Math.max(0.2, 1 + ((destreza - 10) * 5) / 100));
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
  const livre=ehDragao(e.preset)?(x:number,y:number)=>corpoCabe(ctx.fase,x,y,raioNoTerreno(e,ctx)):undefined;
  const resultado = perigo ? caminhoComCusto(ctx.fase, origem, celula, maxPassos, perigo, ctx.balance.ia.custoPerigo,livre) : caminho(ctx.fase, origem, celula, maxPassos,livre);
  if (resultado.status !== 'alcancado') {
    saida.push({ t: 'caminhoFalhou', tick, id: e.id, status: resultado.status });
    return false;
  }
  const r = raioNoTerreno(e,ctx);
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

/** O passo da busca do ponto mais longe em linha reta (em células). */
const PASSO_RETA = 0.1;

/**
 * Marco 26 (26/10/2026, D-114): o `irPara` do jogador nunca se perde. O ponto fica dentro do mapa; sem caminho até
 * ele (parede, vazio, longe demais), vai à célula alcançável mais perto do ponto; se essa é a própria, anda em linha
 * reta na direção do clique até onde o corpo cabe. A IA continua com `planejarCaminho`.
 */
export function planejarIrPara(e: Entidade, destino: Celula, ctx: ContextoSimulacao, tick: number, saida: EventoSimulacao[]): boolean {
  const fase = ctx.fase;
  const ponto = { x: Math.min(fase.largura - 1, Math.max(0, destino.x)), y: Math.min(fase.altura - 1, Math.max(0, destino.y)) };
  if (planejarCaminho(e, ponto, ctx, tick, [])) return true;
  const perto = alcancavelMaisPerto(fase, { x: e.x, y: e.y }, ponto, ctx.balance.navegacao.maxPassosToque);
  if (perto.x !== e.x || perto.y !== e.y) return planejarCaminho(e, perto, ctx, tick, saida);
  // A própria célula é a mais perto: em linha reta, até onde o corpo cabe.
  const dx = ponto.x - e.px;
  const dy = ponto.y - e.py;
  const d = Math.sqrt(dx * dx + dy * dy);
  const r = raioNoTerreno(e,ctx);
  let alcance = 0;
  for (let s = PASSO_RETA; s <= d + EPS; s += PASSO_RETA) {
    if (!corpoCabe(fase, e.px + (dx / d) * s, e.py + (dy / d) * s, r)) break;
    alcance = s;
  }
  if (alcance < CHEGOU) {
    saida.push({ t: 'caminhoFalhou', tick, id: e.id, status: 'inacessivel' });
    return false;
  }
  pararMovimento(e);
  e.caminho = [{ x: e.px + (dx / d) * alcance, y: e.py + (dy / d) * alcance }];
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
  return !muralhaEm(estado, x, y) && (ehDragao(e.preset)?corpoCabe(ctx.fase,x,y,raioNoTerreno(e,ctx)):passavel(ctx.fase,x,y)) && celulaLivrePara(e, x, y, estado.entidades, ctx.balance.colisao);
}

export function moverEntidades(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  saida: EventoSimulacao[],
  dtMs: number,
): void {
  // Antes de alguém andar, todos com a posição contínua na própria célula (a colisão lê a dos outros).
  for (const e of estado.entidades) sincronizarPosicao(e);
  // Marco 26 (29/10/2026, D-122): a colisão pergunta só aos corpos de perto (a grade segue quem anda).
  const grade = new GradeDeCorpos(estado.entidades);
  for (const e of ordemRotativa(estado.entidades, estado.tick)) {
    integrarEntidade(e, estado, ctx, saida, dtMs, grade);
    grade.atualizar(e);
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
        ? velocidadeDoCompanheiro(estado, ctx, e)
        : 1000 / ctx.balance.invocacoes.passoMs
      : velocidade(e.atributos.destreza, ctx.balance.movimento.velocidadeBaseMs, inv?.dominado ?? false, ctx.balance.movimento.velocidadeMaxMult);
  // Marco 14: o frio (resfriado) deixa mais lento. Ajuste de 15/10/2026: conjurar uma habilidade `lenta` também.
  const conjurando = 1 - freioDaConjuracao(e, ctx);
  const r = ctx.balance.ajustesClasses.guerreiro;
  // Marco 22 (D-089): o Mago encarnado em raio anda mais rápido.
  const classe = (classeDe(e) === 'guerreiro' && !inv ? 1 + (r.movimentoMult - 1) * progressoReforcosGuerreiro(ctx, e.nivel) : 1) * velocidadeEncarnacao(ctx, e);
  const bonus = e.efeitos.reduce((pct, f) => f.ateTick > estado.tick && REGISTRO_EFEITOS[f.tipo].velocidade ? Math.max(pct, f.pct) : pct, 0);
  // 04/11/2026 (D-132): a aceleração dos personagens, o recuo de quem atacou de longe e o fôlego de caça.
  const arranque = fatorDoImpulso(e, ctx);
  return vel * (1 - lentidaoPct(e, estado.tick) / 100) * conjurando * classe * (1 + bonus / 100)
    * arranque * (1 - recuoAgoraPct(e, estado.tick) / 100) * (1 + bonusDeCacaPct(e, estado, ctx) / 100)
    // Marco 40 (13/11/2026, D-164): o movimento da classe (viagem rápida fora de combate; o voo lento em combate).
    * fatorDeVelocidade(ctx, e);
}

/**
 * 04/11/2026 (D-132): a aceleração e o recuo valem para os personagens (quem tem ficha). Monstros e invocações
 * ficam de fora (a classe vem pela ficha ou, na rede, pelo `classeId`): o monstro para a cada golpe, e recomeçar devagar facilitaria fugir dele.
 */
export const temArranque = (e: Entidade): boolean => classeDe(e) !== '' && !e.invocacao;

/** 04/11/2026 (D-132): a fração da velocidade de pico que o impulso libera (de `inicialPct` a 100%). */
export function fatorDoImpulso(e: Entidade, ctx: ContextoSimulacao): number {
  if (!temArranque(e)) return 1;
  const inicial = ctx.balance.movimento.aceleracao.inicialPct / 100;
  return inicial + (1 - inicial) * (e.impulso ?? 0);
}

/** 04/11/2026 (D-132): a lentidão de quem atacou de longe, enquanto vale. */
export function recuoAgoraPct(e: Entidade, tick: number): number {
  return (e.recuoAteTick ?? 0) > tick ? (e.recuoPct ?? 0) : 0;
}

/** 04/11/2026 (D-132): a lentidão do ataque de longe pela distância (em células, Chebyshev) até o alvo. */
export function recuoDaDistanciaPct(ctx: ContextoSimulacao, distancia: number): number {
  const r = ctx.balance.movimento.recuoDistancia;
  return Math.min(r.maxPct, Math.max(0, distancia - r.aPartirDeCelulas) * r.porCelulaPct);
}

/** 04/11/2026 (D-132): quem lança um ataque de longe fica lento por um instante (o mais forte dos que valem). */
export function aplicarRecuoDeDistancia(e: Entidade, mira: Celula, tick: number, ctx: ContextoSimulacao): void {
  if (!temArranque(e)) return;
  const origem = celulaOcupada(e);
  const pct = recuoDaDistanciaPct(ctx, Math.max(Math.abs(mira.x - origem.x), Math.abs(mira.y - origem.y)));
  if (pct <= 0) return;
  const atual = recuoAgoraPct(e, tick);
  e.recuoPct = Math.max(pct, atual);
  e.recuoAteTick = Math.max(tick + ticksDe(ctx.balance.movimento.recuoDistancia.duracaoMs), atual > 0 ? (e.recuoAteTick ?? 0) : 0);
}

/** 04/11/2026 (D-132): o bônus de velocidade do perseguidor que não alcança o alvo (o fôlego de caça), em %. */
export function bonusDeCacaPct(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao): number {
  const ia = e.ia;
  if (!ia || ia.modo !== 'perseguindo' || ia.cacaDesdeTick === undefined || ia.cacaDesdeTick < 0) return 0;
  const c = ctx.balance.ia.caca;
  const ms = msDe(estado.tick - ia.cacaDesdeTick);
  if (ms < c.carenciaMs) return 0;
  const folego = Math.min(1, (ms - c.carenciaMs) / c.rampaMs) * c.maxPct;
  // O chefe já é forte por si: recebe bem menos do fôlego.
  return (folego + Math.min(c.nivelMaxPct, (ia.cacaNiveis ?? 0) * c.porNivelPct)) * (e.arquetipo === 'boss' ? c.chefeMult : 1);
}

/** 04/11/2026 (D-132): o quanto a lentidão em curso freia (0 a 1): efeitos, conjuração lenta e o recuo. */
function freioAgora(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao): number {
  const conjurando = freioDaConjuracao(e, ctx);
  return Math.max(lentidaoPct(e, estado.tick) / 100, recuoAgoraPct(e, estado.tick) / 100, conjurando);
}

/**
 * 04/11/2026 (D-132): sobe o impulso de quem andou sem freio; com freio, o consome; parado, zera. Em milésimos, para o
 * patch ficar curto e o cliente (predição) e o servidor chegarem ao mesmo valor.
 */
function ajustarImpulso(e: Entidade, andou: boolean, freio: number, dtMs: number, ctx: ContextoSimulacao): void {
  if (!andou) {
    if (e.impulso) e.impulso = 0;
    return;
  }
  const a = ctx.balance.movimento.aceleracao;
  const atual = e.impulso ?? 0;
  const novo = freio > 0 ? atual - (dtMs / 1000) * a.perdaPorLentidaoPorS * freio : atual + dtMs / a.rampaMs;
  e.impulso = Math.round(Math.min(1, Math.max(0, novo)) * 1000) / 1000;
}

/** Integra o movimento de uma única entidade por um tick (usado também pela predição do cliente). */
export function integrarEntidade(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[], dtMs: number, grade?: GradeDeCorpos) {
  if (e.morto) return;
  sincronizarPosicao(e);
  // Quem conjura uma ação que trava ou está atordoado não anda (D-017, D-060); e perde o impulso (D-132).
  const arranque = temArranque(e);
  // Marco 40 (13/11/2026, D-164): na tirolesa, o corpo segue reto (o básico não para; o atordoado cai dela).
  if (naTirolesa(e)) {
    if (movimentoBloqueado(e, estado.tick)) fimDaTirolesa(estado, e, saida);
    else andarNaTirolesa(e, estado, ctx, saida, dtMs, grade);
    return;
  }
  // D-164: no salto, o corpo voa até a queda (por cima do que houver no meio).
  if (noSalto(e)) {
    andarNoSalto(e, estado, ctx, saida, dtMs);
    return;
  }
  if (mobilidadeDaAcao(e, ctx) === 'trava' || movimentoBloqueado(e, estado.tick)) {
    if (arranque) ajustarImpulso(e, false, 0, dtMs, ctx);
    return;
  }
  // O freio é lido antes de andar (a lentidão que valeu neste tick); só quem tem arranque precisa dele.
  const freio = arranque ? freioAgora(e, estado, ctx) : 0;
  const andou = andarNoTick(e, estado, ctx, saida, dtMs, grade);
  if (arranque) ajustarImpulso(e, andou > EPS, freio, dtMs, ctx);
}

/** Marco 40 (D-164): a tirolesa — reta, sem mudar de rumo, até bater na parede ou no relevo, ou o alcance acabar. */
function andarNaTirolesa(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[], dtMs: number, grade?: GradeDeCorpos): void {
  const m = e.movimentoClasse?.modo;
  if (!m || m.rumoX === undefined || m.rumoY === undefined) return;
  const trecho = Math.min(m.restante ?? 0, (dtMs / 1000) * (m.velocidade ?? 12));
  const andou = trecho > EPS ? andar(e, m.rumoX * trecho, m.rumoY * trecho, estado, ctx, saida, grade) : 0;
  m.restante = Math.max(0, (m.restante ?? 0) - trecho);
  if (andou < trecho * 0.9 || m.restante <= EPS) fimDaTirolesa(estado, e, saida);
}

/** O passo do companheiro do Aventureiro: o voo do falcão; o lobo e o urso (marco 40, D-165), o passo de cada um. */
function velocidadeDoCompanheiro(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): number {
  const pet = petDoCompanheiro(e);
  // Marco 40 (14/11/2026, D-166): mais rápido atrás da caça marcada.
  const pressa = pressaDaCaca(estado, ctx, e);
  return (pet === 'falcao' ? (1000 / ctx.balance.ajustesClasses.aventureiro.falcaoPassoMs) * multiplicadorDoPassoDoFalcao(estado, ctx, e) : 1000 / passoDoPet(ctx, pet)) * pressa;
}

/** Marco 40 (D-164): o salto do Guerreiro, reto até a queda, que atordoa em volta. */
function andarNoSalto(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[], dtMs: number): void {
  const m = e.movimentoClasse?.modo;
  if (!m || m.x === undefined || m.y === undefined) return;
  const dx = m.x - e.px;
  const dy = m.y - e.py;
  const d = Math.hypot(dx, dy);
  const passo = (dtMs / 1000) * (m.velocidade ?? 16);
  if (passo >= d) {
    e.px = m.x;
    e.py = m.y;
  } else {
    e.px += (dx / d) * passo;
    e.py += (dy / d) * passo;
  }
  trocarDeCelula(e, estado, ctx, saida);
  if (passo >= d) fimDoSalto(estado, ctx, e, saida);
}

/** Marco 40 (D-164): a velocidade de andar agora sem o bônus do movimento da classe e sem o arranque (a duração das viagens). */
export function velocidadeDeViagem(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao): number {
  return velocidadeAgora(e, estado, ctx) / fatorDeVelocidade(ctx, e) / Math.max(0.01, fatorDoImpulso(e, ctx));
}

/** O trecho do tick: segue os pontos ou a direção mantida. Devolve quanto andou (0 parado ou preso). */
function andarNoTick(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[], dtMs: number, grade?: GradeDeCorpos): number {
  // 14/11/2026 (D-164): quem voa, salta ou desce a tirolesa passa por cima da água sem nadar.
  const nadando = tipoEm(ctx.fase, e.x, e.y) === 'agua' && !noAr(e) && !naTirolesa(e);
  const vel = velocidadeAgora(e, estado, ctx) * (nadando ? ctx.balance.movimento.nadoMult : 1);
  let restante = (dtMs / 1000) * vel;
  let total = 0;

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
      return total;
    }
    // Quem anda olha para onde vai (Marco 24, D-097), salvo se está golpeando alguém.
    const olhar = e.acao ? null : direcaoDe(ux, uy);
    if (olhar) e.olhando = olhar;
    const andou = andar(e, ux * trecho, uy * trecho, estado, ctx, saida, grade);
    e.relogioAndar += (1000 * andou) / vel;
    total += andou;
    restante -= trecho;
    if (andou < EPS) {
      // Preso: atrás de quem bloqueia, espera mantendo o caminho; contra a parede, desiste do ponto.
      if (wp && !bloqueadoPorEntidade(e, e.px + ux * SUBPASSO, e.py + uy * SUBPASSO, estado, ctx, grade)) e.waypoints.shift();
      return total;
    }
  }
  return total;
}

/**
 * Anda (dx, dy) em subpassos, um eixo de cada vez: o eixo que bate na parede (ou em quem bloqueia) fica, o outro
 * segue — o corpo desliza. Devolve a distância de fato andada.
 */
function andar(e: Entidade, dx: number, dy: number, estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[], grade?: GradeDeCorpos): number {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / SUBPASSO));
  const sx = dx / n;
  const sy = dy / n;
  let andou = 0;
  for (let k = 0; k < n; k++) {
    const x0 = e.px;
    const y0 = e.py;
    avancarEixo(e, sx, 0, estado, ctx, grade);
    avancarEixo(e, 0, sy, estado, ctx, grade);
    if (e.px === x0 && e.py === y0) contornar(e, sx, sy, estado, ctx, grade);
    const mx = e.px - x0;
    const my = e.py - y0;
    if (mx === 0 && my === 0) break;
    andou += Math.sqrt(mx * mx + my * my);
    trocarDeCelula(e, estado, ctx, saida);
  }
  return andou;
}

/** Anda o subpasso num eixo; se não cabe inteiro, encosta (bissecção curta: o corpo para rente à parede). */
function avancarEixo(e: Entidade, sx: number, sy: number, estado: EstadoJogo, ctx: ContextoSimulacao, grade?: GradeDeCorpos): void {
  if (sx === 0 && sy === 0) return;
  if (cabe(e, e.px + sx, e.py + sy, estado, ctx, grade)) {
    e.px += sx;
    e.py += sy;
    return;
  }
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < BISSECCOES; i++) {
    const m = (lo + hi) / 2;
    if (cabe(e, e.px + sx * m, e.py + sy * m, estado, ctx, grade)) lo = m;
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
function contornar(e: Entidade, sx: number, sy: number, estado: EstadoJogo, ctx: ContextoSimulacao, grade?: GradeDeCorpos): void {
  const alcance = 2 * ctx.balance.movimento.raioCorpo + SUBPASSO;
  let perto: Entidade | null = null;
  let menor = alcance * alcance;
  for (const o of grade ? grade.perto(e.px, e.py, alcance) : estado.entidades) {
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
  avancarEixo(e, tx, 0, estado, ctx, grade);
  avancarEixo(e, 0, ty, estado, ctx, grade);
}

/** O corpo da entidade cabe em (x, y): terreno, muralhas e quem a bloqueia (só barra quem se aproxima). */
function cabe(e: Entidade, x: number, y: number, estado: EstadoJogo, ctx: ContextoSimulacao, grade?: GradeDeCorpos): boolean {
  const r = raioNoTerreno(e,ctx);
  // Marco 40 (D-164): quem voa passa por cima dos telhados das casas.
  if (!corpoCabe(ctx.fase, x, y, r, (i, j) => muralhaEm(estado, i, j) !== undefined, noAr(e) ? (i, j) => sobTelhado(ctx, i, j) : null)) return false;
  // Marco 30 (30/10/2026, D-129): o monstro não entra no refúgio (os muros da vila do Mundo). D-138: salvo atrás de quem
  // luta com ele; e quem já está dentro sai livre.
  if (!podePisarNoRefugio(estado, ctx, e, x, y)) return false;
  return !bloqueadoPorEntidade(e, x, y, estado, ctx, grade);
}

/** Algum corpo que bloqueia `e` fica mais perto que dois raios em (x, y), e o passo aproxima os dois? */
function bloqueadoPorEntidade(e: Entidade, x: number, y: number, estado: EstadoJogo, ctx: ContextoSimulacao, grade?: GradeDeCorpos): boolean {
  const minimo = 2 * ctx.balance.movimento.raioCorpo;
  // Marco 40 (D-164): a tirolesa, a névoa e o voo passam pelos corpos.
  if (atravessaCorpos(e) || noAr(e)) return false;
  for (const o of grade ? grade.perto(x, y, minimo) : estado.entidades) {
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

/** Marco 40 (D-164): a célula fica debaixo de um telhado (o voo pousa em cima). */
export function sobTelhado(ctx: ContextoSimulacao, i: number, j: number): boolean {
  return (ctx.fase.telhados ?? []).some((t) => i >= t.x && i < t.x + t.largura && j >= t.y && j < t.y + t.altura);
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
  const m = resolverHabilidade(ctx, e.acao.chave)?.mobilidade ?? 'trava';
  // 08/11/2026 (D-141): o guerreiro nunca para para conjurar (o que travaria anda devagar).
  return m === 'trava' && guerreiroConjuraAndando(e, ctx) ? 'lenta' : m;
}

const guerreiroConjuraAndando = (e: Entidade, ctx: ContextoSimulacao): boolean =>
  !e.invocacao && classeDe(e) === 'guerreiro' && ctx.balance.ajustesClasses.guerreiro.conjuraAndando;

/** O quanto a conjuração em curso freia (0 a 1); 08/11/2026 (D-141): o guerreiro sofre só parte dela. */
function freioDaConjuracao(e: Entidade, ctx: ContextoSimulacao): number {
  if (mobilidadeDaAcao(e, ctx) !== 'lenta') return 0;
  const freio = 1 - ctx.balance.habilidades.velocidadeConjurandoLenta;
  return guerreiroConjuraAndando(e, ctx) ? freio * ctx.balance.ajustesClasses.guerreiro.lentidaoConjuracaoMult : freio;
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
