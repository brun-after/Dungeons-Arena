// O eneágono do vínculo elemental na ficha (marco 39, 12/11/2026, D-150). Nove pontas (o Físico e os oito elementos),
// com o vínculo de cada uma e a resistência que ele dá (negativa = fraqueza). Mesmo desenho do pentagrama de estilos.
// Textos sempre por textContent.

import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { PONTAS_ELEMENTAIS, resistenciaDoVinculoPct, vinculoDe } from '../progression/vinculo';

const SVG = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

const nome = (p: string) => (p === 'fisico' ? t('vinculo.fisico') : t(`elemento.${p}` as ChaveTexto));

export function painelDoVinculo(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, j: Entidade, tick: number): HTMLElement | null {
  if (!j.bolsa) return null;
  const v = vinculoDe(ctx, j, tick);
  const n = PONTAS_ELEMENTAIS.length;
  const tam = 220;
  const c = tam / 2;
  const r = 78;
  const ponto = (k: number, f: number): string => {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / n;
    return `${(c + Math.cos(a) * r * f).toFixed(1)},${(c + Math.sin(a) * r * f).toFixed(1)}`;
  };
  const raiz = svg('svg', { viewBox: `0 0 ${String(tam)} ${String(tam)}`, class: 'radar-estilos radar-vinculo', role: 'img', 'aria-label': t('vinculo.radar') });
  for (const f of [0.5, 1]) raiz.append(svg('polygon', { points: PONTAS_ELEMENTAIS.map((_, k) => ponto(k, f)).join(' '), class: f === 1 ? 'radar-borda' : 'radar-grade' }));
  raiz.append(svg('polygon', { points: PONTAS_ELEMENTAIS.map((p, k) => ponto(k, Math.max(0.02, v[p]))).join(' '), class: 'radar-pontos' }));
  const lista = el('ul', 'lista-estilos lista-vinculo');
  PONTAS_ELEMENTAIS.forEach((p, k) => {
    const [x, y] = ponto(k, 1.3).split(',');
    const rotulo = svg('text', { x: x ?? '0', y: y ?? '0', class: 'radar-rotulo', 'text-anchor': 'middle' });
    rotulo.textContent = nome(p);
    raiz.append(rotulo);
    const res = Math.round(resistenciaDoVinculoPct(ctx.balance.vinculo, p, v[p]));
    const li = el('li', undefined, t('vinculo.ponta', { nome: nome(p), pct: Math.round(v[p] * 100), res: `${res >= 0 ? '+' : ''}${String(res)}` }));
    li.dataset.ponta = p;
    lista.append(li);
  });
  const painel = el('section', 'painel-estilos painel-vinculo');
  painel.append(el('h3', 'subtitulo-modal', t('vinculo.titulo')), el('p', 'detalhe-item', t('vinculo.explicacao')), raiz, lista);
  return painel;
}
