// Fases de habilidade (marco 24, 24/10/2026, D-094). Uma habilidade em etapas agenda as próximas: no prazo, quem lançou
// solta a habilidade da fase no mesmo alvo (ou célula), sem custo nem recarga. É assim que as ultimates encadeiam
// golpes, que o Brado empurra depois de fortalecer e que o Contragolpe responde ao aparar. Só dados no estado; o
// lançamento fica em acao.ts (`processarFases`).

import type { Celula } from '../core/comandos';
import type { EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { celulaOcupada } from './geometria';

/** Agenda a habilidade `chave` de `ator` contra `alvo` (entidade ou célula) daqui a `atrasoMs`. */
export function agendarFase(estado: EstadoJogo, ator: Entidade, chave: string, alvo: Entidade | Celula | null, atrasoMs: number): void {
  const ehEntidade = alvo !== null && 'id' in alvo;
  const c = ehEntidade ? celulaOcupada(alvo) : (alvo ?? celulaOcupada(ator));
  (estado.fases ??= []).push({ atorId: ator.id, chave, alvoId: ehEntidade ? alvo.id : null, x: c.x, y: c.y, tick: estado.tick + ticksDe(atrasoMs) });
}

/** Tira do estado as fases que vencem neste tick, na ordem em que foram agendadas. */
export function fasesVencidas(estado: EstadoJogo): NonNullable<EstadoJogo['fases']> {
  const fases = estado.fases;
  if (!fases || fases.length === 0) return [];
  const vencidas = fases.filter((f) => f.tick <= estado.tick);
  const restantes = fases.filter((f) => f.tick > estado.tick);
  if (restantes.length > 0) estado.fases = restantes;
  else delete estado.fases;
  return vencidas;
}
