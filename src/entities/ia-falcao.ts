// IA do falcão do Aventureiro (ajuste de 24/10/2026, D-091; o falcão é do marco 22, D-089). O falcão não ataca e não
// precisa grudar no inimigo: tem alcance global (as habilidades sempre saem dele, combat/acao.ts, `origemDaHabilidade`)
// e o que decide o uso é o alcance contado do Aventureiro. Então ele voa pelo campo:
// - o dono conjurando uma habilidade corpo a corpo: mergulha no alvo (só avança nesse caso);
// - em combate (alvo do dono a até `raioCombate` dele): passeia em volta do alvo, a `distanciaAlvo` células;
// - fora de combate: busca para o dono o ouro, os orbes de vida e mana (quando faltam) e os buffs a até `raioColeta`
//   células dele (world/objetos.ts entrega ao dono); sem nada para pegar, passeia em volta do dono.
// - marco 24 (25/10/2026, D-098): com o dono parado, sem hostil e sem nada para pegar por `pousoMs`, pousa no ombro
//   dele (modo `pousado`, na célula do dono); sai na hora quando o dono anda, conjura ou aparece um hostil.
// - marco 25 (25/10/2026, D-102): protetor. Um projétil hostil que acertaria o dono faz o falcão dar um dash até a
//   linha dele (o projétil acerta o falcão, que reflete menos dano no dono); o golpe dele voa até o alvo (`mergulho`).
//   Os dois são mais rápidos que a patrulha (combat/companheiro.ts: o nível dá a base; Carisma e Sabedoria somam).
// O ponto do passeio é sorteado pelo PRNG da própria IA e trocado a cada `passeioMs` ou ao chegar.
// `alvoCacheX/Y` guardam o destino atual e `proximaAvaliacaoTick`, a troca do passeio.

import { alvoOfensivoValido } from '../combat/acao';
import { celulaOcupada, chebyshev } from '../combat/geometria';
import { habilidadeDoAtor } from '../combat/perfil';
import { falcaoDeGuarda } from '../combat/sintonia-aventureiro';
import { velocidadeDoDash } from '../combat/companheiro';
import { podeFerir } from '../modos/relacao';
import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo, type ObjetoNoMundo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { emCombate } from '../progression/buffs';
import { passavel } from '../world/fase';
import { planejarCaminho } from '../world/movimento';
import { emPasso, vivo, type Entidade, type EstadoIa } from './entidade';

/** O que o falcão recolhe para o dono (o resto, como itens e chaves, fica para o jogador). */
function serveAoDono(o: ObjetoNoMundo, dono: Entidade): boolean {
  if (o.tipo === 'ouro') return !!dono.bolsa;
  if (o.tipo === 'orbe_efeito') return !!o.efeito;
  if (o.tipo === 'orbe_hp') return dono.hp < dono.hpMax;
  if (o.tipo === 'orbe_recurso') return dono.mana < dono.manaMax;
  return false;
}

function coletavelMaisPerto(estado: EstadoJogo, ctx: ContextoSimulacao, falcao: Entidade, dono: Entidade): Celula | null {
  const raio = ctx.balance.ajustesClasses.aventureiro.falcao.raioColeta;
  const daqui = celulaOcupada(falcao);
  let melhor: ObjetoNoMundo | null = null;
  for (const o of estado.objetos) {
    if (o.aguardaSaidaDe || !serveAoDono(o, dono) || chebyshev(dono, o) > raio) continue;
    if (!melhor || chebyshev(daqui, o) < chebyshev(daqui, melhor) || (chebyshev(daqui, o) === chebyshev(daqui, melhor) && o.objetoId < melhor.objetoId)) melhor = o;
  }
  return melhor ? { x: melhor.x, y: melhor.y } : null;
}

/**
 * Um ponto do passeio: a `distancia` células do centro (ou até ela, quando `ate`), passável. Em volta do alvo, o novo
 * ponto fica a no máximo 90 graus de onde o falcão está, para ele contornar o alvo em vez de cruzar por cima.
 */
function sortearPonto(ctx: ContextoSimulacao, ia: EstadoIa, e: Entidade, centro: Celula, distancia: number, ate: boolean): Celula | null {
  const atual = Math.atan2(e.y - centro.y, e.x - centro.x);
  for (let tentativa = 0; tentativa < 8; tentativa++) {
    const angulo = ate ? aleatorio(ia.rng) * Math.PI * 2 : atual + (aleatorio(ia.rng) - 0.5) * Math.PI;
    const raio = ate ? 1 + aleatorio(ia.rng) * Math.max(0, distancia - 1) : distancia;
    const c = { x: Math.round(centro.x + Math.cos(angulo) * raio), y: Math.round(centro.y + Math.sin(angulo) * raio) };
    if (passavel(ctx.fase, c.x, c.y)) return c;
  }
  return null;
}

function irPara(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, destino: Celula, saida: EventoSimulacao[]): void {
  const mudou = ia.alvoCacheX !== destino.x || ia.alvoCacheY !== destino.y;
  if (!mudou && (emPasso(e) || e.caminho.length > 0)) return;
  if (e.x === destino.x && e.y === destino.y) return;
  ia.alvoCacheX = destino.x;
  ia.alvoCacheY = destino.y;
  planejarCaminho(e, destino, ctx, estado.tick, saida, ctx.balance.ia.maxPassosPerseguicao);
}

function passear(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, centro: Celula, distancia: number, ate: boolean, saida: EventoSimulacao[]): void {
  const chegou = e.x === ia.alvoCacheX && e.y === ia.alvoCacheY && !emPasso(e);
  // O ponto antigo ainda vale se continua perto do centro (o alvo e o dono andam).
  const valido = ia.alvoCacheX >= 0 && Math.abs(chebyshev(centro, { x: ia.alvoCacheX, y: ia.alvoCacheY }) - distancia) <= (ate ? distancia : 1);
  if (valido && !chegou && estado.tick < ia.proximaAvaliacaoTick) {
    irPara(estado, ctx, e, ia, { x: ia.alvoCacheX, y: ia.alvoCacheY }, saida);
    return;
  }
  if (valido && chegou && estado.tick < ia.proximaAvaliacaoTick) return;
  ia.proximaAvaliacaoTick = estado.tick + ticksDe(ctx.balance.ajustesClasses.aventureiro.falcao.passeioMs);
  const ponto = sortearPonto(ctx, ia, e, centro, distancia, ate);
  if (ponto) irPara(estado, ctx, e, ia, ponto, saida);
}

/** Troca o modo; `modoDesdeTick` marca a última atividade (o pouso conta a partir dela). */
function mudarModo(ia: EstadoIa, modo: EstadoIa['modo'], tick: number, ativo: boolean): void {
  if (ia.modo !== modo || ativo) ia.modoDesdeTick = tick;
  ia.modo = modo;
}

/** O dono parado e sem conjurar (o falcão pode pousar). */
function donoQuieto(dono: Entidade): boolean {
  return !emPasso(dono) && dono.direcao === 'parado' && dono.caminho.length === 0 && !dono.acao;
}

/**
 * Marco 25 (D-102): a célula em que o falcão corta a linha de um projétil hostil que acertaria o dono, a tempo pela
 * velocidade do dash (null: nenhum projétil ameaça, ou não dá tempo). Entre vários, o que chega primeiro.
 */
export function celulaDeInterceptacao(estado: EstadoJogo, ctx: ContextoSimulacao, falcao: Entidade, dono: Entidade): Celula | null {
  const r = ctx.balance.ajustesClasses.aventureiro.falcao;
  const passoMs = ctx.balance.ajustesClasses.aventureiro.falcaoPassoMs / velocidadeDoDash(ctx, dono);
  const daqui = celulaOcupada(falcao);
  let melhor: { c: Celula; ms: number } | null = null;
  for (const p of estado.projeteis) {
    if (p.velocidade <= 0 || p.atingidos.includes(dono.id) || !podeFerir({ id: p.donoId, equipe: p.equipeDono }, dono, ctx.modo)) continue;
    const ox = dono.x - p.x;
    const oy = dono.y - p.y;
    // Até onde, na linha, o projétil passa mais perto do dono, e a que distância de lado.
    const ao = ox * p.dirX + oy * p.dirY;
    if (ao <= 0 || ao > Math.min(p.restante, r.vigiaCelulas) || Math.abs(ox * p.dirY - oy * p.dirX) > r.vigiaRaio) continue;
    // O corte mais perto do dono que o falcão alcança antes do projétil (até meia célula de onde ele está).
    for (let s = ao - 1; s >= 0.5; s -= 0.5) {
      const c = { x: Math.round(p.x + p.dirX * s), y: Math.round(p.y + p.dirY * s) };
      if (!passavel(ctx.fase, c.x, c.y) || (c.x === dono.x && c.y === dono.y)) continue;
      const msProjetil = (s / p.velocidade) * 1000;
      if (chebyshev(daqui, c) * passoMs > msProjetil) continue;
      if (!melhor || msProjetil < melhor.ms) melhor = { c, ms: msProjetil };
      break;
    }
  }
  return melhor?.c ?? null;
}

/** Marco 25 (D-102): o alvo do golpe do falcão em curso (a conjuração de contato do dono ou o golpe já em voo). */
function alvoDoGolpe(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade): Entidade | undefined {
  const acao = dono.acao;
  const hab = acao && acao.habilidadeId !== dono.ataqueBasico ? habilidadeDoAtor(ctx, dono, acao.habilidadeId) : undefined;
  const id = hab?.politicaImpacto === 'contato' && hab.politicaAlvo === 'hostil' ? acao?.alvoId : estado.fases?.find((f) => f.atorId === dono.id && f.acaoId !== undefined)?.alvoId;
  const alvo = id ? buscarEntidade(estado, id) : undefined;
  return alvo && alvo !== dono && vivo(alvo) ? alvo : undefined;
}

export function processarFalcao(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, dono: Entidade | undefined, saida: EventoSimulacao[]): void {
  if (!dono || !vivo(dono)) return;
  const r = ctx.balance.ajustesClasses.aventureiro.falcao;
  // Marco 25 (D-102): o golpe em curso vem primeiro (o falcão voa ao alvo); depois, cortar um projétil.
  const golpe = alvoDoGolpe(estado, ctx, dono);
  if (golpe) {
    mudarModo(ia, 'mergulho', estado.tick, true);
    irPara(estado, ctx, e, ia, celulaOcupada(golpe), saida);
    return;
  }
  const corte = celulaDeInterceptacao(estado, ctx, e, dono);
  if (corte) {
    mudarModo(ia, 'dash', estado.tick, true);
    irPara(estado, ctx, e, ia, corte, saida);
    return;
  }
  // Terminado o dash ou o mergulho, volta à patrulha (o passo fica no ritmo de sempre).
  if (ia.modo === 'mergulho' || ia.modo === 'dash') mudarModo(ia, 'patrulha', estado.tick, true);
  const alvo = dono.alvoSelecionado ? buscarEntidade(estado, dono.alvoSelecionado) : undefined;
  // Só luta perto do dono: depois de renascer longe, o alvo antigo não puxa o falcão de volta ao combate.
  const hostil = alvo && alvoOfensivoValido(estado, ctx, e, alvo) && chebyshev(dono, alvo) <= r.raioCombate ? alvo : undefined;
  ia.alvoId = hostil?.id ?? null;
  if (hostil) mudarModo(ia, 'perseguindo', estado.tick, false);
  else {
    const calmo = donoQuieto(dono) && !emCombate(estado, dono) && !coletavelMaisPerto(estado, ctx, e, dono);
    const pousa = calmo && (ia.modo === 'pousado' || (ia.modo === 'patrulha' && estado.tick - ia.modoDesdeTick >= ticksDe(r.pousoMs)));
    mudarModo(ia, pousa ? 'pousado' : 'patrulha', estado.tick, !calmo);
  }
  if (ia.modo === 'pousado') {
    irPara(estado, ctx, e, ia, celulaOcupada(dono), saida);
    return;
  }
  // Marco 24 (D-095): na vertente Druida, o falcão guardião fica ao lado do dono.
  if (hostil && falcaoDeGuarda(ctx, dono, estado.tick)) {
    passear(estado, ctx, e, ia, celulaOcupada(dono), 1, true, saida);
    return;
  }
  if (hostil) {
    passear(estado, ctx, e, ia, celulaOcupada(hostil), r.distanciaAlvo, false, saida);
    return;
  }
  if (!emCombate(estado, dono)) {
    const objeto = coletavelMaisPerto(estado, ctx, e, dono);
    if (objeto) {
      irPara(estado, ctx, e, ia, objeto, saida);
      return;
    }
  }
  passear(estado, ctx, e, ia, celulaOcupada(dono), r.raioPasseio, true, saida);
}
