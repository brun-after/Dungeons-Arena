// Marco 50 (21/11/2026, D-196): a prévia da magia nova, comparada com as partes de forma honesta (dano por mana,
// recarga e custo), com os pares de elementos, a assinatura, o orçamento e o que o material faz. Textos por
// textContent.

import { resolverHabilidade } from '../../combat/compilar-habilidade';
import { faixaDaFormula } from '../../combat/dados';
import { ENTREGA_PADRAO, type Entrega } from '../../combat/entrega/tipos';
import type { Habilidade } from '../../combat/habilidades';
import type { ContextoSimulacao } from '../../core/contexto';
import type { MotivoHabilidade } from '../../core/eventos-simulacao';
import type { Entidade } from '../../entities/entidade';
import { t, type ChaveTexto } from '../../i18n';
import { ticksDeEstudo } from '../../progression/habilidades-personagem';
import { chancesDeRaridade, mesmaFormulaConhecida, tentativasDaFormula } from '../../progression/fusao-raridade';
import { raridadeDaFusao } from '../../combat/fusao/receita';
import { bonusDaRaridade } from '../../combat/fusao/regras';
import { DT_MS } from '../../core/loop';
import { descreverHabilidade, nomeDoEfeito } from '../descrever';
import type { Provisoria } from './bancada-estado';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

const media = (f: string | null) => {
  if (f === null) return 0;
  const x = faixaDaFormula(f);
  return (x.min + x.max) / 2;
};
/** O dano (ou a cura) médio por ponto de recurso. */
const porMana = (h: Habilidade) => ((media(h.formulaDano) * h.multDano || media(h.formulaCura) * h.multCura) / Math.max(1, h.custoRecurso)).toFixed(1);
const segundos = (ms: number) => (ms / 1000).toFixed(1);

/** A forma em palavras (só os eixos que fogem do padrão). */
export function formaEmPalavras(e: Entrega | undefined): string {
  if (!e) return t('alquimia.formaPadrao');
  const partes: string[] = [];
  for (const k of ['origem', 'trajetoria', 'cadencia', 'marca', 'permanencia', 'sentido', 'corpo'] as const) {
    if (e[k] !== ENTREGA_PADRAO[k]) partes.push(t(`entrega.${k}.${e[k]}` as ChaveTexto));
  }
  return partes.length ? partes.join(', ') : t('alquimia.formaPadrao');
}

export function desenharPrevia(ctx: ContextoSimulacao, j: Entidade, p: Provisoria | null, motivo: MotivoHabilidade | null): HTMLElement {
  const caixa = el('div', 'previa-alquimia');
  caixa.append(el('h4', 'subtitulo-modal', t('alquimia.previa')));
  if (!p) {
    caixa.append(el('p', 'detalhe-item', t('alquimia.previaVazia')));
    return caixa;
  }
  const h = resolverHabilidade(ctx, p.id);
  if (!h) return caixa;
  const m = p.mistura;
  const nome = el('strong', 'nome-item nome-fusao', h.nome);
  const cor = h.elemento ? ctx.conteudo.elementos.get(h.elemento)?.cor : undefined;
  if (cor) nome.style.color = cor;
  caixa.append(nome);
  const ul = el('ul', 'descricao-habilidade');
  const linha = (texto: string, classe?: string) => { ul.append(el('li', classe, texto)); };
  if (m.assinatura) linha(t('alquimia.assinatura', { nome: m.assinatura.nome, texto: m.assinatura.texto }), 'linha-assinatura');
  linha(t('alquimia.orcamento', { total: m.orcamentoPct, n: p.receita.partes.length, fatia: Math.round(m.fatiaPct) }));
  if (m.ressonante) linha(t('alquimia.ressonante', { pct: ctx.balance.alquimia.ressonanciaPct }), 'linha-ressonante');
  else if (m.instaveis > 0) linha(t('alquimia.instavel', { n: m.instaveis }), 'linha-instavel');
  else if (m.pares.length > 0) linha(t('alquimia.neutra'));
  for (const par of m.pares) {
    const info = ctx.conteudo.alquimia.pares.get(par.chave);
    if (info) linha(t('alquimia.par', { nome: info.nome, texto: info.texto }));
  }
  if (m.elementos.length > 0) linha(t('alquimia.elementos', { lista: m.elementos.map((x) => t(`elemento.${x}` as ChaveTexto)).join(', ') }));
  linha(t('alquimia.forma', { texto: formaEmPalavras(h.entrega) }));
  if (h.efeitos.length > 0) linha(t('alquimia.efeitos', { lista: [...new Set(h.efeitos.map((e) => nomeDoEfeito(e.tipo)))].join(', ') }));
  const partes = p.receita.partes.map((x) => resolverHabilidade(ctx, x)).filter((x): x is Habilidade => !!x);
  linha(t('alquimia.compararDano', { fusao: porMana(h), partes: partes.map(porMana).join(' / ') }));
  linha(t('alquimia.compararRecarga', { fusao: segundos(h.recargaMs), partes: partes.map((x) => segundos(x.recargaMs)).join(' / ') }));
  linha(t('alquimia.compararCusto', { fusao: h.custoRecurso, partes: partes.map((x) => x.custoRecurso).join(' / ') }));
  const ranks = p.receita.partes.map((x) => j.bolsa?.conhecidas.find((c) => c.id === x)?.rank ?? 1);
  const rank = Math.max(1, Math.floor(ranks.reduce((a, b) => a + b, 0) / Math.max(1, ranks.length)));
  linha(t('alquimia.nascimento', { rank, grau: h.grau, min: Math.round((ticksDeEstudo(ctx, j, p.id) * DT_MS) / 60000) }));
  // Marco 52 (21/11/2026, D-198): as chances de cada nível de raridade, pela Inteligência de quem transmuta.
  const tentativas = j.bolsa ? tentativasDaFormula(j.bolsa, p.id) : 0;
  const ch = chancesDeRaridade(ctx.balance.alquimia, j.atributos, tentativas);
  if (tentativas > 0) linha(t('alquimia.tentativas', { n: tentativas }), 'linha-ressonante');
  const r = ctx.balance.alquimia;
  linha(t('alquimia.raridades', { p3: Math.round(ch[3]), p2: Math.round(ch[2]), b2: bonusDaRaridade(r, 2), p1: Math.round(ch[1]), b1: bonusDaRaridade(r, 1) }), 'linha-raridade');
  const ja = j.bolsa ? (j.bolsa.conhecidas.some((c) => c.id === p.id) ? p.id : mesmaFormulaConhecida(j.bolsa, p.id)) : null;
  if (ja) linha(t('alquimia.refazer', { n: raridadeDaFusao(ja) }), 'linha-instavel');
  const material = p.receita.material ? ctx.conteudo.alquimia.materiais.get(p.receita.material) : undefined;
  if (material && p.receita.material) linha(t('alquimia.materialNaMagia', { nome: ctx.conteudo.itens.get(p.receita.material)?.nome ?? p.receita.material, texto: material.texto }));
  caixa.append(ul);
  const desc = el('ul', 'descricao-habilidade descricao-fusao');
  for (const l of descreverHabilidade(h, {})) desc.append(el('li', undefined, l));
  caixa.append(desc);
  if (motivo) caixa.append(el('p', 'detalhe-item motivo-fusao', t('alquimia.previaInvalida', { motivo: t(`habilidades.motivo.${motivo}` as ChaveTexto) })));
  return caixa;
}
