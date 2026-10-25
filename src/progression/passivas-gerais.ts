// Passivas gerais (marco 24, 24/10/2026, D-095). Cada família tem duas (uma defensiva, uma ofensiva); elas se aprendem
// por livro e ponto e não ocupam tecla. Valem só as ligadas, até `balance.passivasGerais.maxAtivas`, e a troca é fora
// de combate (o painel de passivas). Passivas que não são de família (as de classe) valem sempre.

import { definicaoDe } from '../combat/compilar-habilidade';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao, MotivoHabilidade } from '../core/eventos-simulacao';
import type { Bolsa, Entidade } from '../entities/entidade';
import { emCombate } from './buffs';
import { recalcularFicha } from './derivados';

type Ctx = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

export function ehPassivaGeral(ctx: Ctx, id: string): boolean {
  const d = definicaoDe(ctx, id);
  return !!d?.familiaGeral && !!d.base.passiva;
}

/** Aprendeu uma passiva geral: liga sozinha se houver vaga (o jogador troca depois, fora de combate). */
export function ligarAoAprender(ctx: Ctx, bolsa: Bolsa, id: string): void {
  if (!ehPassivaGeral(ctx, id)) return;
  const ativas = bolsa.passivasAtivas ?? [];
  if (!ativas.includes(id) && ativas.length < ctx.balance.passivasGerais.maxAtivas) bolsa.passivasAtivas = [...ativas, id];
}

/** Liga ou desliga uma passiva geral conhecida. Recusa em combate e além do limite. */
export function definirPassiva(estado: EstadoJogo, ctx: Ctx, e: Entidade, id: string, ligada: boolean, saida: EventoSimulacao[]): boolean {
  const bolsa = e.bolsa;
  const recusar = (motivo: MotivoHabilidade) => {
    saida.push({ t: 'habilidadeRecusada', tick: estado.tick, id: e.id, habilidadeId: id, motivo });
    return false;
  };
  if (!bolsa) return recusar('sem_ficha');
  if (!bolsa.conhecidas.some((c) => c.id === id)) return recusar('desconhecida');
  if (!ehPassivaGeral(ctx, id)) return recusar('nao_passiva');
  const ativas = bolsa.passivasAtivas ?? [];
  if (ativas.includes(id) === ligada) return true;
  if (emCombate(estado, e)) return recusar('em_combate');
  if (ligada && ativas.length >= ctx.balance.passivasGerais.maxAtivas) return recusar('limite_passivas');
  bolsa.passivasAtivas = ligada ? [...ativas, id] : ativas.filter((x) => x !== id);
  recalcularFicha(e, ctx);
  saida.push({ t: 'passivaDefinida', tick: estado.tick, id: e.id, habilidadeId: id, ligada });
  return true;
}
