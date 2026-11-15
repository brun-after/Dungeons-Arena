// O acampamento na ficha (marco 44, 15/11/2026, D-178). A fogueira que o jogador acende (mundo/acampamento.ts) vira o
// acampamento da ficha: o lugar onde ele renasce (em vez da vila) e a caixa onde guarda itens, aberta em qualquer das
// suas fogueiras acesas enquanto o acampamento vale. Vencido o prazo (`duraMin` desde a última vez que acendeu), o
// que estava na caixa vai para o banco. A sala do Mundo chama estas funções; o relógio é o de parede do servidor. Puro.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { msDe, ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { PREFIXO_ACAMPAMENTO } from '../world/fogo-aceso';
import { novoObjeto } from '../world/objeto-novo';
import { passavel } from '../world/fase';
import type { AvisoDoMundo, MotivoDoMundo } from './avisos';
import { depositarNoBanco, guardarNoBanco, tirarDoBanco } from './banco';
import type { Balcao } from './balcao';
import type { AcaoDoMundo } from './acoes';
import type { FichaDoMundo } from './ficha-mundo';

export interface AcampamentoDaFicha {
  regiao: string;
  x: number;
  y: number;
  /** Até quando o acampamento vale (ms, relógio do servidor). */
  ateMs: number;
  /** Até quando a fogueira queima (ms). */
  acesoAteMs: number;
  caixa: { itens: FichaDoMundo['banco']['itens']; ouro: number };
}

/** O `ref` dos objetos do acampamento de `dono`. */
export const refDoAcampamento = (dono: string): string => `${PREFIXO_ACAMPAMENTO}${dono}`;

/** O acampamento que vale agora; o vencido sai da ficha e a caixa dele vai para o banco. */
export function acampamentoValido(ficha: FichaDoMundo, agoraMs: number): AcampamentoDaFicha | null {
  const a = ficha.acampamento;
  if (!a) return null;
  if (a.ateMs > agoraMs) return a;
  depositarNoBanco(ficha.banco, a.caixa.itens, a.caixa.ouro);
  delete ficha.acampamento;
  return null;
}

/** Os eventos do tick: a fogueira de acampamento acesa de `dono` vira (ou renova) o acampamento da ficha. */
export function registrarAcampamentos(eventos: readonly EventoSimulacao[], regiao: string, ficha: (dono: string) => FichaDoMundo | undefined, agoraMs: number, tick: number, ctx: ContextoSimulacao): void {
  for (const ev of eventos) {
    if (ev.t !== 'acampamentoAceso') continue;
    const f = ficha(ev.dono);
    if (!f) continue;
    const caixa = acampamentoValido(f, agoraMs)?.caixa ?? { itens: [], ouro: 0 };
    f.acampamento = { regiao, x: ev.x, y: ev.y, ateMs: agoraMs + ctx.balance.mundo.acampamento.duraMin * 60_000, acesoAteMs: agoraMs + msDe(ev.ateTick - tick), caixa };
  }
}

/** Quem entra na região do seu acampamento encontra a fogueira e a caixa (a sala pode ter sido refeita). */
export function garantirAcampamento(estado: EstadoJogo, ctx: ContextoSimulacao, ficha: FichaDoMundo, regiao: string, dono: string, agoraMs: number): void {
  const a = acampamentoValido(ficha, agoraMs);
  const ref = `${PREFIXO_ACAMPAMENTO}${dono}`;
  if (a?.regiao !== regiao || estado.objetos.some((o) => o.ref === ref)) return;
  const id = `acamp_${dono}`;
  const ateTick = estado.tick + Math.max(0, ticksDe(a.acesoAteMs - agoraMs));
  estado.objetos.push(novoObjeto(id, 'fogueira', a.x, a.y, { ref, valor: ateTick }));
  const caixa = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }].map((d) => ({ x: a.x + d.x, y: a.y + d.y })).find((c) => passavel(ctx.fase, c.x, c.y));
  if (caixa) estado.objetos.push(novoObjeto(`${id}_caixa`, 'caixa_acampamento', caixa.x, caixa.y, { ref }));
}

/** Onde renasce quem morreu: o acampamento que vale, ou null (a vila). */
export function renascerNoAcampamento(ficha: FichaDoMundo, agoraMs: number): (Celula & { regiao: string }) | null {
  const a = acampamentoValido(ficha, agoraMs);
  return a ? { regiao: a.regiao, x: a.x, y: a.y } : null;
}

/** A caixa de `dono` ao alcance de `e`. */
export function pertoDaCaixa(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, dono: string): boolean {
  const alcance = ctx.balance.economia.alcanceInteracao;
  return estado.objetos.some((o) => o.tipo === 'caixa_acampamento' && o.ref === `${PREFIXO_ACAMPAMENTO}${dono}` && Math.max(Math.abs(o.x - e.x), Math.abs(o.y - e.y)) <= alcance);
}

export function avisoDaCaixa(b: Balcao): AvisoDoMundo {
  const itens = b.ficha.acampamento?.caixa.itens ?? [];
  return { tipo: 'banco', itens: itens.map((i) => ({ ...i })), ouro: 0, slots: b.ctx.balance.mundo.acampamento.slots, caixa: true };
}

/** Guardar e tirar da caixa do acampamento (perto dela e com o acampamento valendo). */
export function atenderCaixa(b: Balcao, acao: Extract<AcaoDoMundo, { a: 'banco' }>, perto: boolean): void {
  const a = acampamentoValido(b.ficha, b.agora);
  let motivo: MotivoDoMundo | null;
  if (!a || !perto) {
    motivo = 'longe';
  } else {
    const lista = acao.op === 'guardar' ? b.bolsa.mochila : a.caixa.itens;
    const item = b.ctx.conteudo.itens.get(lista.find((i) => i.invId === acao.invId)?.itemId ?? '');
    const regras = b.ctx.balance.inventario;
    motivo = !item
      ? 'sem_item'
      : acao.op === 'guardar'
        ? guardarNoBanco(a.caixa, b.bolsa, item, acao.invId, acao.qtd, b.ctx.balance.mundo.acampamento.slots, regras.pilhaMax)
        : tirarDoBanco(a.caixa, b.bolsa, item, acao.invId, acao.qtd, regras);
  }
  if (motivo) b.avisar({ tipo: 'recusa', motivo });
  b.avisar(avisoDaCaixa(b));
}
