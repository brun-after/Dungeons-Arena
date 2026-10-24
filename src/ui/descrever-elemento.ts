// Textos do tema e das afinidades (marco 23, 24/10/2026, D-092): o chip do clima no HUD e a linha do alvo afim.

import { climaDaFase } from '../combat/clima';
import type { Elemento } from '../combat/elementos';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { t } from '../i18n';

const nomeElemento = (e: Elemento) => t(`elemento.${e}`);

/** "Gelo +25% · Fogo −25%", ou vazio na fase neutra. */
export function dicaDoClima(ctx: ContextoSimulacao): string {
  const c = climaDaFase(ctx);
  if (!c) return '';
  const b = ctx.balance.clima;
  const reforco = t('hud.climaReforco', { elemento: nomeElemento(c.elemento), pct: b.reforcoPct });
  return c.oposto ? `${reforco} · ${t('hud.climaOpressao', { elemento: nomeElemento(c.oposto), pct: b.opressaoPct })}` : reforco;
}

/** "Absorve Gelo · Fraco a Fogo" (o extremo: "Só o Fogo o fere"), ou null sem afinidade. */
export function descreverAfinidade(ctx: ContextoSimulacao, alvo: Entidade): string | null {
  const a = alvo.afinidade;
  if (!a) return null;
  const oposto = ctx.conteudo.afinidades.elementos.get(a.elemento)?.oposto;
  if (!oposto) return t('hud.afinidadeAbsorve', { elemento: nomeElemento(a.elemento) });
  return t(a.extrema ? 'hud.afinidadeExtrema' : 'hud.afinidade', { elemento: nomeElemento(a.elemento), oposto: nomeElemento(oposto) });
}
