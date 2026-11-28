// Marco 56 (27/11/2026, D-209): o que cada escada do interior faz, com o E e a espera na porta (D-099, D-138):
// - a escada para cima (a porta de retorno): no primeiro andar sai à frente da porta da estrutura; nos outros, volta ao
//   andar de cima, ao lado da escada para baixo dele;
// - a saída aberta: antes do último andar é a escada para baixo (chega-se ao lado da escada para cima de lá); no
//   último, sai à frente da porta e conclui a masmorra (a recompensa).
// Quem desce ou sobe leva junto quem do grupo está perto (`balance.mundo.andares.raioDoGrupo`). Puro.

import type { Celula } from '../core/comandos';
import type { Conteudo } from '../core/conteudo';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { chegadaNaFase } from '../save/retorno';
import { tipoEm, type Fase } from '../world/fase';
import { esperouNaPorta, naSaidaAberta } from '../world/portas';
import { idDoLugar, montarLugar, type Lugar } from './lugares';
import { estruturaDoDestino, portaDa, type Reino } from './reino';

export interface PassoDaEscada {
  destino: string;
  chegada: Celula | null;
  /** Leva junto quem do grupo está perto (descer e subir entre andares). */
  grupo: boolean;
  /** Saiu pelo fim do último andar: a masmorra está concluída. */
  concluir: boolean;
}

/** As fases dos andares já geradas (para achar a escada para baixo do andar de cima). */
const ANDARES = new Map<string, Fase>();

function faseDoAndar(conteudo: Conteudo, reino: Reino, lugar: Lugar, ctx: ContextoSimulacao): Fase {
  const id = idDoLugar(lugar);
  const guardada = ANDARES.get(id);
  if (guardada) return guardada;
  const fase = montarLugar(conteudo, reino, lugar, ctx.modo).ctx.fase;
  if (ANDARES.size > 32) ANDARES.clear();
  ANDARES.set(id, fase);
  return fase;
}

/** O passo da escada (ou da saída) em que `e` esperou, ou null. */
export function passoDaEscada(reino: Reino, lugar: Lugar, estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): PassoDaEscada | null {
  if ((lugar.tipo !== 'masmorra' && lugar.tipo !== 'covil') || !esperouNaPorta(estado, ctx, e)) return null;
  const porta = estruturaDoDestino(reino, lugar.tipo === 'masmorra' ? lugar.masmorra.id : lugar.covil.id);
  const fora = porta ? { destino: `regiao:${porta.regiao.id}`, chegada: portaDa(porta.estrutura).frente, grupo: false } : null;
  const andar = lugar.tipo === 'masmorra' ? (lugar.andar ?? 1) : 1;
  const r = ctx.fase.portaRetorno;
  if (r && e.x === r.x && e.y === r.y) {
    if (lugar.tipo !== 'masmorra' || andar <= 1) return fora && { ...fora, concluir: false };
    const acima: Lugar = { ...lugar, andar: andar - 1 };
    return { destino: idDoLugar(acima), chegada: chegadaNaFase(faseDoAndar(ctx.conteudo, reino, acima, ctx), true), grupo: true, concluir: false };
  }
  if (tipoEm(ctx.fase, e.x, e.y) !== 'saida' || !naSaidaAberta(estado, ctx, e)) return null;
  if (lugar.tipo === 'masmorra' && andar < (ctx.fase.andar?.total ?? 1)) return { destino: idDoLugar({ ...lugar, andar: andar + 1 }), chegada: null, grupo: true, concluir: false };
  return fora && { ...fora, concluir: lugar.tipo === 'masmorra' };
}

/** Quem vai junto: os vivos a até `raio` células de quem usou a escada (ele incluído). */
export function quemVaiJunto<T extends { e: Entidade }>(todos: readonly T[], quem: Entidade, raio: number): T[] {
  return todos.filter((t) => t.e === quem || (!t.e.morto && Math.max(Math.abs(t.e.x - quem.x), Math.abs(t.e.y - quem.y)) <= raio));
}
