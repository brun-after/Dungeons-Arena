// Linha de tiro do ataque básico (06/11/2026, D-135). O básico que é projétil não sai contra quem está atrás de uma
// parede: conta como fora do alcance (o jogador troca para outro visível ou espera; a IA dá a volta). O projétil que já
// saiu antes de o alvo se esconder bate na parede, como sempre. As famílias de arma em `armas.tiroPorCimaDe` (o cajado
// do Necromante) ficam de fora: o básico delas cai sob o alvo. A reta é a mesma integração do projétil. Puro.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { atravessavelPorTiro } from '../world/fase';
import { ehBasico } from './basico';
import { celulaOcupada } from './geometria';
import type { Habilidade } from './habilidades';
import { muralhaEm } from './tatica';

/** O mesmo sub-passo do projétil (projeteis.ts): nenhuma célula do caminho fica sem teste. */
const SUBPASSO = 0.25;

/** A reta de `de` até `ate` passa sem parede nem muralha (as pontas não contam)? */
export function tiroLivre(estado: EstadoJogo, ctx: ContextoSimulacao, de: Celula, ate: Celula): boolean {
  const dx = ate.x - de.x;
  const dy = ate.y - de.y;
  const passos = Math.ceil(Math.hypot(dx, dy) / SUBPASSO);
  for (let i = 1; i < passos; i++) {
    const cx = Math.round(de.x + (dx * i) / passos);
    const cy = Math.round(de.y + (dy * i) / passos);
    if ((cx === de.x && cy === de.y) || (cx === ate.x && cy === ate.y)) continue;
    if (!atravessavelPorTiro(ctx.fase, cx, cy) || muralhaEm(estado, cx, cy)) return false;
  }
  return true;
}

/** Esta habilidade é o básico de projétil que precisa de linha livre? */
export function exigeLinha(ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade): boolean {
  if (hab.politicaImpacto !== 'projetil' || !ehBasico(ator, hab.id)) return false;
  const familia = ctx.conteudo.armas.familiaDoBasico.get(hab.id);
  return !familia || !ctx.balance.armas.tiroPorCimaDe.includes(familia);
}

/** O básico de `ator` contra `alvo` bateria na parede (precisa de linha e ela está fechada)? */
export function semLinha(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, alvo: Entidade, origem: Celula = celulaOcupada(ator)): boolean {
  return exigeLinha(ctx, ator, hab) && !tiroLivre(estado, ctx, origem, celulaOcupada(alvo));
}
