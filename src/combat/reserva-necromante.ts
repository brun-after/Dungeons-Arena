// 01/11/2026: reservas de combate, sem renovação por cura ou passagem do tempo.
import type { Entidade } from '../entities/entidade';
import type { ContextoSimulacao } from '../core/contexto';
import { pontosUteis } from '../progression/efeitos-atributo';

export function prepararReservas(morto: Entidade, dono: Entidade, ctx: ContextoSimulacao): void {
  if (!morto.invocacao || (dono.classeId ?? dono.bolsa?.classeId) !== 'necromante') return;
  const r = ctx.balance.necromancia;
  const base = morto.hpMax;
  const sab = Math.max(0, pontosUteis(dono.atributos.sabedoria, ctx.balance) - 10);
  morto.hpMax = Math.max(1, Math.round(base * (1 + Math.min(r.resistenciaSabMaxPct, sab * r.resistenciaPorSabPct) / 100)));
  morto.hp = morto.hpMax;
  Object.assign(morto.invocacao, {
    expiraTick: Number.MAX_SAFE_INTEGER,
    ataquesRestantes: r.ataquesPorInvocacao,
    ataquesTotal: r.ataquesPorInvocacao,
    resistenciaRestante: morto.hpMax,
    resistenciaTotal: morto.hpMax,
  });
}

/** Só HP efetivamente retirado conta; escudo, imunidade e excesso letal não consomem reserva. */
export function retirarVida(alvo: Entidade, pedido: number): number {
  const defesa = alvo.invocacao;
  const dano = Math.max(0, Math.min(alvo.hp, pedido, defesa?.resistenciaRestante ?? Infinity));
  alvo.hp -= dano;
  if (defesa?.resistenciaRestante !== undefined) {
    defesa.resistenciaRestante = Math.max(0, defesa.resistenciaRestante - dano);
    if (defesa.resistenciaRestante === 0) alvo.hp = 0;
  }
  return dano;
}

/** Uma ação lançada custa um ataque, mesmo se errar; área e múltiplos projéteis não multiplicam o custo. */
export function consumirAtaque(morto: Entidade, acaoId: number): boolean {
  const inv = morto.invocacao;
  if (inv?.ataquesRestantes === undefined) return true;
  if (inv.ultimoAtaqueId === acaoId) return true;
  if (inv.ataquesRestantes <= 0) return false;
  inv.ultimoAtaqueId = acaoId;
  inv.ataquesRestantes--;
  return true;
}
