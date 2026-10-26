// Aba "Diário" da mochila (marco 18, 17/10/2026, D-070). Mostra o que o personagem já descobriu — reações, combos,
// ressonâncias, marcos de nível, fusões, variações de item, conjuntos, regras de buff, missões, origens raras e eventos
// de fase — e o que falta como silhueta ("???", com o tipo à vista). As missões aparecem com a contagem. Um rumor
// (meia pista) muda a cada abertura. Só lê o estado.
// Marco 26 (26/10/2026, D-111): cada descoberta vira um cartão com "Como" (as habilidades, condições ou peças) e
// "Efeito" (ui/diario-detalhes.ts); o combo diz se está na sua barra, e a silhueta do combo, quantas habilidades tem.

import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { entradasDoDiario, TIPOS_DE_ENTRADA, type EntradaDoDiario, type TipoDeEntrada } from '../progression/diario';
import { descreverEntrada } from './diario-detalhes';

export { descreverEntrada } from './diario-detalhes';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
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
        const titulo = el('strong', undefined, d.nome);
        const combo = tipo === 'combo' ? ctx.conteudo.combos.get(e.id.slice(6)) : undefined;
        if (combo && combo.sequencia.every((id) => bolsa.barra.includes(id))) titulo.append(' ', el('span', 'marca-barra', t('diario.naBarra')));
        li.append(titulo);
        if (d.como.length > 0) li.append(el('span', 'linha-diario', `${t('diario.como')}: ${d.como.join(' · ')}`));
        if (d.efeito) li.append(el('span', 'linha-diario', `${t('diario.efeito')}: ${d.efeito}`));
        li.dataset.entrada = e.id;
      } else {
        const combo = tipo === 'combo' ? ctx.conteudo.combos.get(e.id.slice(6)) : undefined;
        li.append(el('strong', undefined, combo ? t('diario.silhuetaCombo', { n: combo.sequencia.length }) : '???'));
      }
      ul.append(li);
    }
    grupo.append(ul);
    corpo.append(grupo);
  }
}
