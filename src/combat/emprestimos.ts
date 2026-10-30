// As frações de passiva que a arma de outra classe dá na hora do abate (marco 27, 29/10/2026, D-126): a lâmina dá
// chance de cura ao abater (do Guerreiro), o cajado dá chance de o abatido se erguer como aliado curto (do
// Necromante). Só para quem tem bolsa; números em balance.armas.emprestimo. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio } from '../core/rng';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { temEmprestimo } from '../progression/armas';
import { erguerEmprestado } from './necromancia';

export function aoAbaterComArmas(estado: EstadoJogo, ctx: ContextoSimulacao, quem: Entidade, morto: Entidade, saida: EventoSimulacao[]): void {
  if (!quem.bolsa || !vivo(quem) || morto.invocacao || !podeFerir(quem, morto, ctx.modo)) return;
  const emp = ctx.balance.armas.emprestimo;
  if (temEmprestimo(ctx, quem, 'curaAoAbater') && aleatorio(estado.rng) * 100 < emp.curaAoAbaterChancePct) {
    const cura = Math.min(quem.hpMax - quem.hp, Math.round((quem.hpMax * emp.curaAoAbaterPct) / 100));
    if (cura > 0) {
      quem.hp += cura;
      saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: quem.id, origemId: quem.id, tipo: 'cura', dano: 0, cura, mana: 0 });
    }
  }
  if (morto.controlador === 'ia' && temEmprestimo(ctx, quem, 'reanimar') && aleatorio(estado.rng) * 100 < emp.reanimarChancePct) {
    erguerEmprestado(estado, ctx, quem, morto, emp.reanimarMs, saida);
  }
}
