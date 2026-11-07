// A Lança de ossos (07/11/2026, D-136). O Necromante para e conjura; no lançamento, uma lança de osso sai do peito de
// cada morto dele (servo, reanimado, eco) e perfura o alvo do morto e `lanca.alem` células atrás dele. Com
// `lanca.lados` (a última evolução), cada morto também crava uma lança para cada lado. Regras do dano:
// - na mesma lança, o primeiro perfurado leva o golpe inteiro e os seguintes, `necromancia.lanca.perfuradoPct`;
// - quem é perfurado por mais de uma lança leva menos a cada uma: a k-ésima rende 1/k.
// O alvo do morto é o que a IA dele persegue; sem ele, o selecionado do Necromante; senão, o hostil mais perto.
// Age pelo mesmo aplicarImpacto das outras skills. Puro.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { buscarEntidade } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { afetavel, alvosDaForma, celulasDaLinha } from './formas';
import { celulaOcupada, chebyshev } from './geometria';
import { aplicarImpacto, type Impacto } from './golpe';
import type { Habilidade } from './habilidades';
import { tiroLivre } from './linha-de-tiro';

/** Os mortos do Necromante que lançam (os da necromancia, vivos; nunca o avatar). */
function mortosDe(estado: EstadoJogo, dono: Entidade): Entidade[] {
  return estado.entidades
    .filter((e) => vivo(e) && e.invocacao?.donoId === dono.id && e.invocacao.necromancia !== undefined && !e.invocacao.avatar)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Há morto para lançar? (Sem nenhum, a skill é recusada sem gastar mana.) */
export function temMortos(estado: EstadoJogo, dono: Entidade): boolean {
  return mortosDe(estado, dono).length > 0;
}

/** O alvo da lança deste morto: o da IA dele, o selecionado do dono ou o hostil mais perto, ao alcance e à vista. */
function alvoDoMorto(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, morto: Entidade, hab: Habilidade): Entidade | null {
  const alcance = ctx.balance.ajustesClasses.necromante.lanca.alcanceAlvo;
  const de = celulaOcupada(morto);
  const serve = (e: Entidade | undefined): e is Entidade =>
    !!e && afetavel(ctx, dono, e, hab) && chebyshev(de, celulaOcupada(e)) <= alcance && tiroLivre(estado, ctx, de, celulaOcupada(e));
  for (const id of [morto.ia?.alvoId, dono.alvoSelecionado]) {
    const e = id ? buscarEntidade(estado, id) : undefined;
    if (serve(e)) return e;
  }
  const perto = (e: Entidade) => chebyshev(de, celulaOcupada(e));
  return estado.entidades.filter(serve).sort((a, b) => perto(a) - perto(b) || (a.id < b.id ? -1 : 1))[0] ?? null;
}

export function lancasDosMortos(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, habBase: Habilidade, base: Omit<Impacto, 'indice'>, saida: EventoSimulacao[]): void {
  const lanca = habBase.lanca;
  if (!lanca) return;
  // A lança fere como uma linha hostil (a skill é conjurada em si mesmo).
  const hab: Habilidade = { ...habBase, politicaAlvo: 'hostil', politicaImpacto: 'area', tipoArea: 'linha' };
  const perfuradoPct = ctx.balance.ajustesClasses.necromante.lanca.perfuradoPct;
  const vezes = new Map<string, number>();
  let indice = 0;
  for (const morto of mortosDe(estado, dono)) {
    const alvo = alvoDoMorto(estado, ctx, dono, morto, hab);
    if (!alvo) continue;
    const de = celulaOcupada(morto);
    const ate = celulaOcupada(alvo);
    const dx = Math.sign(ate.x - de.x);
    const dy = Math.sign(ate.y - de.y);
    const comprimento = chebyshev(de, ate) + lanca.alem;
    const direcoes: Celula[] = [ate];
    if (lanca.lados) direcoes.push({ x: de.x - dy, y: de.y + dx }, { x: de.x + dy, y: de.y - dx });
    for (const mira of direcoes) {
      const celulas = celulasDaLinha(de, mira, comprimento, ctx.fase);
      const fim = celulas.at(-1);
      if (!fim) continue;
      saida.push({ t: 'lancaDeOsso', tick: estado.tick, acaoId: base.acaoId, chave: habBase.chave, donoId: dono.id, mortoId: morto.id, deX: de.x, deY: de.y, paraX: fim.x, paraY: fim.y });
      alvosDaForma(estado, ctx, dono, hab, celulas).forEach((e, ordem) => {
        const k = (vezes.get(e.id) ?? 0) + 1;
        vezes.set(e.id, k);
        const mult = (ordem === 0 ? 1 : perfuradoPct / 100) / k;
        aplicarImpacto(estado, ctx, e, { ...base, hab, fonte: { ...base.fonte, multDano: base.fonte.multDano * mult }, indice: indice++, secundario: ordem > 0 }, saida);
      });
    }
  }
}
