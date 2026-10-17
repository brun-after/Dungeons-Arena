// Aba "Diário" da mochila (marco 18, 17/10/2026, D-070). Mostra o que o personagem já descobriu — reações, combos,
// ressonâncias, marcos de nível, fusões, variações de item, conjuntos, regras de buff, missões, origens raras e eventos
// de fase — e o que falta como silhueta ("???", com o tipo à vista). As missões aparecem com a contagem. Um rumor
// (meia pista) muda a cada abertura. Só lê o estado.

import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { entradasDoDiario, TIPOS_DE_ENTRADA, type EntradaDoDiario, type TipoDeEntrada } from '../progression/diario';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

/** O nome e a descrição de uma entrada (do conteúdo). */
export function descreverEntrada(ctx: ContextoSimulacao, id: string): { nome: string; texto: string } {
  const [tipo = '', a = '', b = '', c = ''] = id.split(':');
  const conteudo = ctx.conteudo;
  switch (tipo as TipoDeEntrada) {
    case 'reacao': {
      const s = conteudo.interacoes.sinergias.find((x) => x.id === a);
      return { nome: t(`sinergia.${a}` as ChaveTexto), texto: s ? t('diario.reacao', { elemento: t(`elemento.${s.elemento}` as ChaveTexto), estados: s.sobre.map((e) => t(`efeito.${e}` as ChaveTexto)).join(', ') }) : '' };
    }
    case 'combo': {
      const k = conteudo.combos.get(a);
      return { nome: k?.nome ?? a, texto: k?.texto ?? '' };
    }
    case 'ressonancia': {
      const r = conteudo.ressonancias.get(a);
      return { nome: r?.nome ?? a, texto: r?.texto ?? '' };
    }
    case 'marco': {
      const d = conteudo.definicoes.get(a);
      return { nome: t('diario.marco', { nome: d?.base.nome ?? a, n: b }), texto: d?.marcos[Number(b)]?.texto ?? '' };
    }
    case 'fusao': {
      const d = conteudo.definicoes.get(a);
      const partes = (d?.fusao ?? []).map((p) => conteudo.definicoes.get(p)?.base.nome ?? p);
      return { nome: d?.base.nome ?? a, texto: t('habilidades.fusaoDe', { a: partes[0] ?? '', b: partes[1] ?? '' }) };
    }
    case 'item': {
      const base = conteudo.itensComFormas.bases.get(a);
      const forma = base?.formas[b as 'comum'];
      const q = c !== 'n' && forma ? conteudo.itensComFormas.qualificadores[c as 'fogo']?.[forma.genero] : undefined;
      return { nome: forma ? `${forma.nome}${q ? ` ${q}` : ''}` : a, texto: [t(`forma.${b}` as ChaveTexto), forma?.texto ?? ''].filter(Boolean).join(' · ') };
    }
    case 'conjunto': {
      const cj = conteudo.conjuntos.get(a);
      return { nome: t('diario.conjunto', { nome: cj?.nome ?? a, n: b }), texto: cj?.bonus[Number(b)]?.texto ?? '' };
    }
    case 'buff': {
      const r = conteudo.regrasDeBuff.get(a);
      return { nome: r?.nome ?? a, texto: r?.texto ?? '' };
    }
    case 'missao': {
      const m = conteudo.missoes.get(a);
      return { nome: m?.nome ?? a, texto: m?.texto ?? '' };
    }
    case 'origem': {
      const o = conteudo.origens.get(a);
      return { nome: o?.nome ?? a, texto: o?.texto ?? '' };
    }
    case 'evento':
      return { nome: t(`evento.${a}` as ChaveTexto), texto: t(`evento.${a}.texto` as ChaveTexto) };
  }
  return { nome: id, texto: '' };
}

/** Quantos rumores existem no dicionário (`rumor.1` … `rumor.N`). */
const RUMORES = 12;

export function desenharDiario(corpo: HTMLElement, j: Entidade, ctx: ContextoSimulacao): void {
  const bolsa = j.bolsa;
  if (!bolsa) return;
  const todas = entradasDoDiario(ctx);
  const vistas = new Set(bolsa.diario);
  const total = el('p', 'linha-pontos', t('diario.contagem', { n: todas.filter((e) => vistas.has(e.id)).length, total: todas.length }));
  total.dataset.descobertas = String(vistas.size);
  corpo.append(total);
  const rumor = el('p', 'rumor', t(`rumor.${1 + (Math.floor(Date.now() / 60_000) % RUMORES)}` as ChaveTexto));
  corpo.append(rumor);

  // Missões: a contagem (as que zeram por fase mostram a desta fase).
  corpo.append(el('h3', 'subtitulo-modal', t('diario.missoes')));
  const missoes = el('ul', 'lista-itens');
  for (const m of ctx.conteudo.missoes.values()) {
    const li = el('li', 'linha-item missao');
    li.dataset.missao = m.id;
    const feita = bolsa.missoesConcluidas.includes(m.id);
    const contagem = Object.entries(bolsa.missoes).filter(([k]) => k === m.id || k.startsWith(`${m.id}@`)).reduce((s, [, v]) => Math.max(s, v), 0);
    const textos = el('div', 'textos-item');
    textos.append(el('strong', 'nome-item', m.nome), el('span', 'detalhe-item', m.texto));
    li.append(textos, el('span', feita ? 'estado-missao feita' : 'estado-missao', feita ? t('diario.concluida') : `${Math.min(contagem, m.meta)}/${m.meta}`));
    missoes.append(li);
  }
  corpo.append(missoes);

  // As entradas por tipo, cada grupo dobrável; o que falta é silhueta.
  const porTipo = new Map<TipoDeEntrada, EntradaDoDiario[]>();
  for (const e of todas) porTipo.set(e.tipo, [...(porTipo.get(e.tipo) ?? []), e]);
  for (const tipo of TIPOS_DE_ENTRADA) {
    const lista = porTipo.get(tipo) ?? [];
    if (lista.length === 0 || tipo === 'missao') continue;
    const vistasDoTipo = lista.filter((e) => vistas.has(e.id));
    const grupo = el('details', 'grupo-diario');
    grupo.dataset.tipo = tipo;
    const resumo = el('summary', undefined, t('diario.grupo', { tipo: t(`diario.tipo.${tipo}` as ChaveTexto), n: vistasDoTipo.length, total: lista.length }));
    grupo.append(resumo);
    const ul = el('ul', 'entradas-diario');
    for (const e of lista) {
      const li = el('li', vistas.has(e.id) ? 'entrada-diario vista' : 'entrada-diario silhueta');
      if (vistas.has(e.id)) {
        const d = descreverEntrada(ctx, e.id);
        li.append(el('strong', undefined, d.nome));
        if (d.texto) li.append(el('span', 'detalhe-item', d.texto));
        li.dataset.entrada = e.id;
      } else {
        li.append(el('strong', undefined, '???'));
      }
      ul.append(li);
    }
    grupo.append(ul);
    corpo.append(grupo);
  }
}
