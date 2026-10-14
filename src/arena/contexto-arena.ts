// Contexto das arenas oficiais (modo Livre), compartilhado pelo servidor, pela tela de loopback e
// pelos testes: os dois lados precisam simular com o mesmo conteúdo (§3.6, versão/hash).
// Marco 7B (13/10/2026): duas fases — arena-01 (30×22) e arena-02, a "cena padrão" da §5.6 (60×40,
// 20 NPCs). A fase da sala é escolhida ao criar e precisa estar em `fasesPermitidas` do modo.

import { conteudoOficial, modoPorId } from '../core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../core/contexto';
import arena01 from '../data/fases/arena-01.json';
import arena02 from '../data/fases/arena-02.json';
import type { ModoDeJogo } from '../modos/modo';
import { carregarFase } from '../world/fase';
import { validarFase } from '../world/validacao-fase';

export const FASE_ARENA_PADRAO = 'arena-01';
const FASES_DE_ARENA: Readonly<Record<string, unknown>> = { 'arena-01': arena01, 'arena-02': arena02 };

/** A fase existe e o modo a permite; senão, a padrão. */
export function faseDeArena(modo: ModoDeJogo, pedida: unknown): string {
  if (typeof pedida !== 'string' || !(pedida in FASES_DE_ARENA)) return FASE_ARENA_PADRAO;
  return modo.fasesPermitidas === 'qualquer' || modo.fasesPermitidas.includes(pedida) ? pedida : FASE_ARENA_PADRAO;
}

export function contextoDaArena(modoId = 'livre', faseId: string = FASE_ARENA_PADRAO): ContextoSimulacao {
  const conteudo = conteudoOficial();
  const modo = modoPorId(conteudo, modoId);
  const id = faseDeArena(modo, faseId);
  const r = validarFase(FASES_DE_ARENA[id], new Set(conteudo.presets.keys()), conteudo.itens);
  if (!r.ok) throw new Error(`fase de arena inválida: ${r.erros.map((e) => e.mensagem).join('; ')}`);
  return { fase: carregarFase(r.fase), balance: BALANCE_PADRAO, conteudo, modo };
}
