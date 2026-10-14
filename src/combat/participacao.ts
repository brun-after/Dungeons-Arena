// Participação em dano (§2.7, morte): quem feriu e quando, para dividir XP. Usada pelo impacto
// direto (golpe.ts) e pelo dano periódico (efeitos.ts, marco 8A). Marco 10A-3: é também o ponto único
// por onde todo dano maior que zero passa, então o golpe do avatar é contado aqui.

import type { ContextoSimulacao } from '../core/contexto';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { contarGolpe } from './invocacoes';

export function registrarParticipacao(alvo: Entidade, fonteId: string, tick: number, ctx: ContextoSimulacao): void {
  const janela = ticksDe(ctx.balance.combate.janelaParticipacaoS * 1000);
  alvo.participacao = alvo.participacao.filter((p) => p.id !== fonteId && tick - p.tick <= janela);
  alvo.participacao.push({ id: fonteId, tick });
  contarGolpe(alvo);
}
