// O que a receita da forja diz (marco 53, 22/11/2026, D-203). Antes, quem achava uma receita só lia o nome e não sabia
// se a peça servia para a classe dele nem a raridade. Agora a receita diz:
// - para quê: o slot e, na arma, a família e a classe que a usa naturalmente (a de outra classe também serve, com uma
//   parte da passiva dela, como qualquer arma emprestada, progression/armas.ts);
// - a raridade mínima da peça base (o resultado guarda a raridade da peça) e o que a forja faz nela;
// - onde a receita cai: as criaturas que a guardam, as regiões e dungeons onde elas vivem, a dimensão e os chefes.
// Tudo vem do molde (forja.json) e do reino; nada fixo por receita.

import type { ContextoSimulacao } from '../../core/contexto';
import { t, tOu, type ChaveTexto } from '../../i18n';
import { reinoDoConteudo } from '../../mundo/reino';
import { PREFIXO_RECEITA, type Molde } from '../../progression/moldes';

const MAX_LUGARES = 4;

/** O molde da receita (o item `receita_<id>`), ou null. */
export function moldeDaReceita(ctx: Pick<ContextoSimulacao, 'conteudo'>, itemId: string): Molde | null {
  return itemId.startsWith(PREFIXO_RECEITA) ? ctx.conteudo.moldes.get(itemId.slice(PREFIXO_RECEITA.length)) ?? null : null;
}

/** As linhas da receita, para a mochila, a loja e a mesa da forja. `classe`: a de quem lê. */
export function linhasDaReceita(ctx: Pick<ContextoSimulacao, 'conteudo'>, molde: Molde, classe: string | undefined): string[] {
  const linhas: string[] = [];
  const slot = tOu(`slot.${molde.base.slot}`, molde.base.slot);
  const familia = molde.base.familia;
  if (familia) {
    const dona = ctx.conteudo.armas.porFamilia[familia].classe;
    const nomeClasse = ctx.conteudo.classes.get(dona)?.nome ?? dona;
    const nomeFamilia = tOu(`familiaArma.${familia}`, familia);
    const chave: ChaveTexto = classe === undefined ? 'forja.receita.para' : classe === dona ? 'forja.receita.paraVoce' : 'forja.receita.paraOutra';
    linhas.push(t(chave, { slot, familia: nomeFamilia, classe: nomeClasse }));
  } else linhas.push(t('forja.receita.qualquer', { slot }));
  linhas.push(t('forja.receita.raridade', { raridade: tOu(`raridade.${molde.base.raridadeMin}`, molde.base.raridadeMin) }));
  const feitos: string[] = [];
  if (molde.resultado.ascender) feitos.push(t('forja.receita.ascender'));
  if (molde.resultado.elemento) feitos.push(t('forja.receita.elemento', { elemento: tOu(`elemento.${molde.resultado.elemento}`, molde.resultado.elemento) }));
  if (molde.resultado.engastes.length > 0) feitos.push(t('forja.receita.engastes', { n: molde.resultado.engastes.length }));
  if (feitos.length > 0) linhas.push(t('forja.receita.resultado', { lista: feitos.join(', ') }));
  const onde = ondeCai(ctx, molde);
  if (onde) linhas.push(onde);
  return linhas;
}

/** A linha "onde cai": as criaturas, onde vivem, a dimensão e os chefes. */
function ondeCai(ctx: Pick<ContextoSimulacao, 'conteudo'>, molde: Molde): string | null {
  const partes: string[] = [];
  const presets = molde.cai.presets;
  if (presets.length > 0) {
    const nomes = presets.map((p) => ctx.conteudo.presets.get(p)?.nome ?? p);
    partes.push(t('forja.receita.criaturas', { lista: nomes.join(', ') }));
    const lugares = lugaresDasCriaturas(ctx, presets);
    if (lugares.length > 0) partes.push(t('forja.receita.lugares', { lista: lugares.slice(0, MAX_LUGARES).join(', ') + (lugares.length > MAX_LUGARES ? '…' : '') }));
  }
  for (const d of molde.cai.dimensoes) partes.push(t('forja.receita.dimensao', { nome: ctx.conteudo.dimensoes.get(d)?.nome ?? d }));
  if (molde.cai.chefes) partes.push(t('forja.receita.chefes'));
  return partes.length > 0 ? t('forja.receita.cai', { lista: partes.join(' · ') }) : null;
}

/** As regiões, dungeons e covis do reino onde alguma das criaturas aparece (sem repetir). */
function lugaresDasCriaturas(ctx: Pick<ContextoSimulacao, 'conteudo'>, presets: readonly string[]): string[] {
  if (ctx.conteudo.reinos.size === 0) return [];
  const reino = reinoDoConteudo(ctx.conteudo);
  const tem = (lista: readonly string[]) => lista.some((p) => presets.includes(p));
  const nomes = [
    ...reino.regioes.filter((r) => tem([...r.inimigos, ...(r.bosses?.presets ?? [])])).map((r) => r.nome),
    ...reino.masmorras.filter((m) => tem([...m.inimigos, m.boss])).map((m) => m.nome),
    ...reino.covis.filter((c) => tem(c.inimigos)).map((c) => c.nome),
  ];
  return [...new Set(nomes)];
}
