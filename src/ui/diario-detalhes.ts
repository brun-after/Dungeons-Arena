// O que cada descoberta do Diário mostra (marco 26, 26/10/2026, D-111): o nome, o "Como" (as habilidades e as
// condições que a fazem acontecer) e o "Efeito", montados dos dados. Usado pelo Diário, pelos combos da build e pelo
// aviso de descoberta. Só lê o conteúdo.

import { resolverHabilidade } from '../combat/compilar-habilidade';
import type { Combo } from '../combat/combos';
import type { ContextoSimulacao } from '../core/contexto';
import { t, type ChaveTexto } from '../i18n';
import type { TipoDeEntrada } from '../progression/diario';
import { descreverHabilidade } from './descrever';

export interface DetalheDaEntrada {
  nome: string;
  /** As linhas do "Como" (vazio quando não há o que dizer). */
  como: string[];
  efeito: string;
}

type Ctx = ContextoSimulacao;

export const nomeDaHabilidade = (ctx: Ctx, id: string): string => ctx.conteudo.definicoes.get(id)?.base.nome ?? ctx.conteudo.habilidades.get(id)?.nome ?? id;
const nomeDoEfeito = (tipo: string) => t(`efeito.${tipo}` as ChaveTexto).toLowerCase();
const nomeDoElemento = (el: string) => t(`elemento.${el}` as ChaveTexto);
const lista = (itens: readonly string[]) => itens.join(', ');

/** Uma condição de combo em palavras ("no mesmo alvo", "com o alvo sangrando"…); a desconhecida sai como veio. */
export function textoDaCondicao(cond: string): string {
  if (cond.startsWith('alvo:')) return t('combos.cond.alvo', { estado: nomeDoEfeito(cond.slice(5)) });
  const chave = `combos.cond.${cond}` as ChaveTexto;
  const texto = t(chave);
  return texto === chave ? cond : texto;
}

/** Como fazer o combo: a ordem das habilidades, a janela, o mesmo alvo e as condições. */
export function comoFazerCombo(ctx: Ctx, c: Combo): string[] {
  const linhas = [t('combos.ordem', { skills: c.sequencia.map((id) => nomeDaHabilidade(ctx, id)).join(' › ') })];
  const extras = [t('combos.janela', { s: (c.janelaMs / 1000).toLocaleString('pt-BR') })];
  if (c.mesmoAlvo && !c.condicoes.includes('mesmo_alvo')) extras.push(textoDaCondicao('mesmo_alvo'));
  for (const cond of c.condicoes) extras.push(textoDaCondicao(cond));
  linhas.push(extras.join(', '));
  return linhas;
}

/** O nome, o "Como" e o "Efeito" de uma entrada do Diário (`tipo:resto`). */
export function descreverEntrada(ctx: Ctx, id: string): DetalheDaEntrada {
  const [tipo = '', a = '', b = '', c = ''] = id.split(':');
  const conteudo = ctx.conteudo;
  switch (tipo as TipoDeEntrada) {
    case 'reacao': {
      const s = conteudo.interacoes.sinergias.find((x) => x.id === a);
      if (!s) return { nome: t(`sinergia.${a}` as ChaveTexto), como: [], efeito: '' };
      const efeito: string[] = [];
      if (s.danoExtraPct > 0) efeito.push(t('diario.reacaoDano', { pct: s.danoExtraPct }));
      if (s.remove.length > 0) efeito.push(t('diario.reacaoRemove', { estados: lista(s.remove.map(nomeDoEfeito)) }));
      if (s.aplicar.length > 0) efeito.push(t('diario.reacaoAplica', { estados: lista(s.aplicar.map((e) => nomeDoEfeito(e.tipo))) }));
      if (s.raio > 0) efeito.push(t('diario.reacaoEmVolta', { raio: s.raio }));
      if (s.curarFonte > 0) efeito.push(t('diario.reacaoCura', { valor: s.curarFonte }));
      return {
        nome: t(`sinergia.${a}` as ChaveTexto),
        como: [t('diario.reacaoComo', { elemento: nomeDoElemento(s.elemento), estados: s.sobre.map(nomeDoEfeito).join(' ou ') })],
        efeito: efeito.join('; '),
      };
    }
    case 'combo': {
      const k = conteudo.combos.get(a);
      return k ? { nome: k.nome, como: comoFazerCombo(ctx, k), efeito: k.texto } : { nome: a, como: [], efeito: '' };
    }
    case 'ressonancia': {
      const r = conteudo.ressonancias.get(a);
      const exige = Object.entries(r?.exige ?? {}).map(([at, n]) => `${t(`atributo.${at}` as ChaveTexto)} ${n}`);
      return { nome: r?.nome ?? a, como: exige.length > 0 ? [t('diario.ressonanciaComo', { lista: lista(exige) })] : [], efeito: r?.texto ?? '' };
    }
    case 'marco': {
      const d = conteudo.definicoes.get(a);
      const nome = d?.base.nome ?? a;
      return { nome: t('diario.marco', { nome, n: b }), como: [t('diario.marcoComo', { nome, n: b })], efeito: d?.marcos[Number(b)]?.texto ?? '' };
    }
    case 'fusao': {
      const d = conteudo.definicoes.get(a);
      const partes = (d?.fusao ?? []).map((p) => nomeDaHabilidade(ctx, p));
      const compilada = d ? resolverHabilidade(ctx, a) : undefined;
      return {
        nome: d?.base.nome ?? a,
        como: [t('diario.fusaoComo', { a: partes[0] ?? '', b: partes[1] ?? '' })],
        efeito: compilada ? descreverHabilidade(compilada).join(' · ') : '',
      };
    }
    case 'item': {
      const base = conteudo.itensComFormas.bases.get(a);
      const forma = base?.formas[b as 'comum'];
      const q = c !== 'n' && forma ? conteudo.itensComFormas.qualificadores[c as 'fogo']?.[forma.genero] : undefined;
      return {
        nome: forma ? `${forma.nome}${q ? ` ${q}` : ''}` : a,
        como: [t('diario.itemComo', { base: base?.formas.comum.nome ?? a, forma: t(`forma.${b}` as ChaveTexto), elemento: c !== 'n' ? t('diario.itemElemento', { elemento: nomeDoElemento(c) }) : '' })],
        efeito: forma?.texto ?? '',
      };
    }
    case 'conjunto': {
      const cj = conteudo.conjuntos.get(a);
      const pecas = (cj?.pecas ?? []).map((p) => conteudo.itensComFormas.bases.get(p)?.formas.comum.nome ?? p);
      return {
        nome: t('diario.conjunto', { nome: cj?.nome ?? a, n: b }),
        como: cj ? [t('diario.conjuntoComo', { pecas: lista(pecas), forma: t(`forma.${cj.formaMin}` as ChaveTexto), n: b })] : [],
        efeito: cj?.bonus[Number(b)]?.texto ?? '',
      };
    }
    case 'buff': {
      const r = conteudo.regrasDeBuff.get(a);
      if (!r) return { nome: a, como: [], efeito: '' };
      const quem = r.habilidade ? t('diario.buffHabilidade', { nome: nomeDaHabilidade(ctx, r.habilidade) }) : r.tag ? t('diario.buffTag', { tag: r.tag }) : t('diario.buffQualquer');
      return { nome: r.nome, como: [t('diario.buffComo', { buff: t(`efeito.${r.buff}` as ChaveTexto), quem })], efeito: r.texto };
    }
    case 'sinergia': {
      const s = conteudo.sinergias.find((x) => x.id === a);
      if (!s) return { nome: a, como: [], efeito: '' };
      return { nome: s.nome, como: [t('diario.sinergiaComo', { passiva: nomeDaHabilidade(ctx, s.passiva), skills: s.sequencia.map((x) => nomeDaHabilidade(ctx, x)).join(' › ') })], efeito: s.texto };
    }
    case 'missao': {
      const m = conteudo.missoes.get(a);
      return { nome: m?.nome ?? a, como: [], efeito: m?.texto ?? '' };
    }
    case 'origem': {
      const o = conteudo.origens.get(a);
      const item = o?.item;
      const nomeItem = !item ? undefined : 'id' in item ? conteudo.itens.get(item.id)?.nome : conteudo.itensComFormas.bases.get(item.base)?.formas[item.forma].nome;
      return { nome: o?.nome ?? a, como: o ? [o.texto] : [], efeito: nomeItem ? t('diario.origemDa', { item: nomeItem }) : '' };
    }
    case 'evento':
      return { nome: t(`evento.${a}` as ChaveTexto), como: [], efeito: t(`evento.${a}.texto` as ChaveTexto) };
  }
  return { nome: id, como: [], efeito: '' };
}
