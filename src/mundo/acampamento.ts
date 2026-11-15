// A fogueira de acampamento (marco 44, 15/11/2026, D-178). Quem leva lenha monta, fora da vila, uma fogueira com uma
// caixa ao lado; ela nasce apagada e acende com qualquer skill de fogo mirada nela ou com a tocha acesa de quem
// interage. Acesa, ela ilumina, acende tochas e aquece: à noite, quem descansa perto, fora de combate, recupera vida e
// mana e, se ficou o bastante, acorda com o bônus do amanhecer. O fogo também chama monstros da noite. A sala do Mundo
// guarda na ficha o acampamento aceso (a caixa e o lugar de renascer, mundo/acampamento-sala.ts). Puro.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio, criarRng, hashTexto } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { aplicarEfeito } from '../combat/efeitos';
import { resolverHabilidade } from '../combat/compilar-habilidade';
import { construirEfeito } from '../combat/registro-efeitos';
import { vivo, type Entidade } from '../entities/entidade';
import { emCombate } from '../progression/buffs';
import { passavel } from '../world/fase';
import { ehDeAcampamento, fogoAceso, PREFIXO_ACAMPAMENTO } from '../world/fogo-aceso';
import { novoObjeto } from '../world/objeto-novo';
import { emPassagem } from '../world/passagem';
import { emRefugio } from '../world/refugio';

const chebyshev = (a: Celula, b: Celula) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/** A chave do dono gravada no `ref` dos objetos do acampamento. */
export const donoDoAcampamento = (o: Pick<ObjetoNoMundo, 'ref'>): string => (o.ref ?? '').slice(PREFIXO_ACAMPAMENTO.length);

function livre(estado: EstadoJogo, ctx: ContextoSimulacao, c: Celula): boolean {
  const f = ctx.fase;
  return passavel(f, c.x, c.y) && !emRefugio(f, c.x, c.y) && !emPassagem(f, c.x, c.y) && !estado.objetos.some((o) => o.x === c.x && o.y === c.y);
}

const VIZINHAS: readonly Celula[] = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }];

/**
 * Monta o acampamento de `dono` perto de `e`: a fogueira (apagada, `valor` 0) e a caixa ao lado. O acampamento antigo
 * do mesmo dono nesta região sai. Devolve false fora do exterior, na vila ou sem lugar.
 */
export function montarAcampamento(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, dono: string, saida: EventoSimulacao[]): boolean {
  if (!ctx.modo.acampamento || !ctx.fase.exterior || emRefugio(ctx.fase, e.x, e.y)) return false;
  const ref = `${PREFIXO_ACAMPAMENTO}${dono}`;
  const antigos = estado.objetos.filter((o) => o.ref === ref);
  estado.objetos = estado.objetos.filter((o) => o.ref !== ref);
  for (const d of VIZINHAS) {
    const fogo = { x: e.x + d.x, y: e.y + d.y };
    if (!livre(estado, ctx, fogo)) continue;
    const caixa = VIZINHAS.map((v) => ({ x: fogo.x + v.x, y: fogo.y + v.y })).find((c) => (c.x !== e.x || c.y !== e.y) && livre(estado, ctx, c));
    if (!caixa) continue;
    const id = `acamp${String(estado.tick)}_${e.id}`;
    estado.objetos.push(novoObjeto(id, 'fogueira', fogo.x, fogo.y, { ref, valor: 0 }));
    estado.objetos.push(novoObjeto(`${id}_caixa`, 'caixa_acampamento', caixa.x, caixa.y, { ref }));
    saida.push({ t: 'acampamentoMontado', tick: estado.tick, id: e.id, objetoId: id, x: fogo.x, y: fogo.y });
    return true;
  }
  estado.objetos.push(...antigos);
  return false;
}

/** Acende a fogueira de acampamento por `acesaMin` (ou até o tick dado, quando a sala a refaz). */
export function acenderAcampamento(estado: EstadoJogo, ctx: ContextoSimulacao, o: ObjetoNoMundo, saida: EventoSimulacao[], ateTick?: number): void {
  o.valor = ateTick ?? estado.tick + ticksDe(ctx.balance.mundo.acampamento.acesaMin * 60_000);
  saida.push({ t: 'acampamentoAceso', tick: estado.tick, objetoId: o.objetoId, dono: donoDoAcampamento(o), x: o.x, y: o.y, ateTick: o.valor });
}

/** A fogueira de acampamento apagada: quem interage com a tocha acesa a acende. */
export const apagadaDeAcampamento = (o: ObjetoNoMundo, tick: number): boolean => o.tipo === 'fogueira' && ehDeAcampamento(o) && !fogoAceso(o, tick);

/**
 * Etapa do tick: a skill de fogo mirada perto de uma fogueira de acampamento apagada (ou lançada por quem está ao lado
 * dela) a acende.
 */
export function processarAcampamentos(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[], inicio: number): void {
  if (!estado.objetos.some((o) => apagadaDeAcampamento(o, estado.tick))) return;
  const raio = ctx.balance.mundo.acampamento.raioFogo;
  const fim = saida.length;
  for (let i = inicio; i < fim; i++) {
    const ev = saida[i];
    if (ev?.t !== 'acaoIniciada' || resolverHabilidade(ctx, ev.chave)?.elemento !== 'fogo') continue;
    const ator = estado.entidades.find((x) => x.id === ev.atorId);
    for (const o of estado.objetos) {
      if (!apagadaDeAcampamento(o, estado.tick)) continue;
      const mirou = Math.hypot(o.x - ev.alvoX, o.y - ev.alvoY) <= raio;
      if (mirou || (ator && chebyshev(ator, o) <= 1)) acenderAcampamento(estado, ctx, o, saida);
    }
  }
}

/**
 * A conferência a cada segundo (pela sala, com a noite): quem descansa perto do fogo aceso à noite, vivo, fora de combate
 * e sem se mexer, recupera vida e mana e soma o tempo no efeito `descansado`; ao clarear, quem descansou o bastante
 * troca o `descansado` pelo bônus do amanhecer. O fogo de acampamento aceso à noite chama monstros (`nascerPerto`).
 */
export function conferirAcampamentos(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  escuro: number,
  nascerPerto: (centro: Celula, de: number, ate: number, id: string) => boolean,
): void {
  const a = ctx.balance.mundo.acampamento;
  const noite = escuro >= a.noiteDesde;
  const fogos = estado.objetos.filter((o) => o.tipo === 'fogueira' && fogoAceso(o, estado.tick));
  const tick = estado.tick;
  for (const e of estado.entidades) {
    if (!vivo(e) || e.controlador === 'ia' || e.arquetipo !== 'jogador') continue;
    const marca = e.efeitos.find((f) => f.tipo === 'descansado');
    if (!noite) {
      if (!marca) continue;
      e.efeitos = e.efeitos.filter((f) => f !== marca);
      if (marca.valor >= a.descansoMinS) aplicarEfeito(estado, ctx, e, construirEfeito('bonus_dano', { duracaoMs: a.bonusMin * 60_000, pct: a.bonusDanoPct }), { id: e.id, x: e.x, y: e.y }, null, []);
      continue;
    }
    if (!fogos.some((o) => chebyshev(o, e) <= a.raioDescanso) || emCombate(estado, ctx, e) || e.caminho.length > 0) continue;
    e.hp = Math.min(e.hpMax, e.hp + Math.ceil((e.hpMax * a.curaPctPorS) / 100));
    e.mana = Math.min(e.manaMax, e.mana + Math.ceil((e.manaMax * a.curaPctPorS) / 100));
    if (marca) {
      marca.valor += 1;
      marca.ateTick = tick + ticksDe(a.marcaMin * 60_000);
    } else {
      e.efeitos.push({ tipo: 'descansado', ateTick: tick + ticksDe(a.marcaMin * 60_000), origemId: e.id, valor: 1, pct: 0, proximoTick: 0, interno: null, ref: null, inicioTick: tick, acumulos: 1 });
    }
  }
  if (!noite) return;
  for (const o of fogos) {
    if (!ehDeAcampamento(o)) continue;
    const rng = criarRng(hashTexto(`${o.objetoId}/atrai/${String(tick)}`));
    if (aleatorio(rng) * 100 * 60 >= a.atraiChancePorMinPct) continue;
    nascerPerto(o, a.atraiDistancia[0], a.atraiDistancia[1], `${o.objetoId}:${String(tick)}`);
  }
}
