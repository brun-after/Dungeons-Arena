// As passagens entre as regiões do Mundo (marco 41, 14/11/2026, D-169). Cada abertura da borda virou um trecho curto
// (a ponte, a passarela, o desfiladeiro, o cânion, o portão ou a trilha) que existe igual nos mapas das duas regiões
// vizinhas: a sala troca no meio dele e quem atravessa não vê nada mudar. Dentro da passagem:
// - os monstros nunca entram (a IA que não é invocação, como no refúgio da vila), nem perseguindo;
// - quem está dentro não é alvo de ninguém e não fere ninguém (a trégua, renovada a cada tick), nem no PvP;
// - os enfeites e as lanternas são só aparência (o mesmo hash nos dois lados).
// Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';

/** O retângulo da passagem em células, com as bordas incluídas (corredor, margens e os muros dos lados). */
export interface AreaDePassagem {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** O tipo do desenho (world/passagens-exterior.ts), para o aviso de quem entra. */
  tipo?: string;
  /** O lugar do outro lado (`regiao:<id>`): o cliente prepara o mapa de lá enquanto se anda pela passagem. */
  destino?: string;
}

/** A passagem onde está o ponto, ou null. */
export function passagemNoPonto(fase: { readonly passagens?: readonly AreaDePassagem[] }, x: number, y: number): AreaDePassagem | null {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  return fase.passagens?.find((a) => dentroDaArea(a, cx, cy)) ?? null;
}

/** Quanto a trégua dura depois do último tick dentro (a saída é suave: meio segundo). */
const TREGUA_MS = REGISTRO_EFEITOS.tregua.padrao.duracaoMs;

export function dentroDaArea(a: AreaDePassagem, x: number, y: number): boolean {
  return x >= a.x0 && x <= a.x1 && y >= a.y0 && y <= a.y1;
}

/** O ponto (em células, contínuo ou não) está numa passagem da fase? */
export function emPassagem(fase: { readonly passagens?: readonly AreaDePassagem[] }, x: number, y: number): boolean {
  const lista = fase.passagens;
  if (!lista) return false;
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  for (const a of lista) if (dentroDaArea(a, cx, cy)) return true;
  return false;
}

/** A entidade está numa passagem (pela célula ocupada)? */
export const naPassagem = (fase: { readonly passagens?: readonly AreaDePassagem[] }, e: Pick<Entidade, 'x' | 'y'>): boolean => emPassagem(fase, e.x, e.y);

/**
 * Início do tick: quem está numa passagem fica (ou segue) com a trégua. A renovação mexe só no prazo (sem evento a cada
 * tick); a primeira aplicação entra como efeito comum. A fase sem passagens não muda nada.
 */
export function processarPassagens(estado: EstadoJogo, ctx: ContextoSimulacao): void {
  if (!ctx.fase.passagens?.length) return;
  const ate = estado.tick + ticksDe(TREGUA_MS);
  for (const e of estado.entidades) {
    if (!vivo(e) || !naPassagem(ctx.fase, e)) continue;
    const atual = e.efeitos.find((f) => f.tipo === 'tregua');
    if (atual) {
      atual.ateTick = Math.max(atual.ateTick, ate);
      continue;
    }
    e.efeitos.push({ tipo: 'tregua', ateTick: ate, origemId: e.id, valor: 0, pct: 0, proximoTick: 0, interno: null, ref: null, inicioTick: estado.tick, acumulos: 1 });
  }
}
