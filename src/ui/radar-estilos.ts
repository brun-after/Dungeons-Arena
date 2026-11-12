// O radar do pentagrama de estilos na ficha (marco 39, 12/11/2026, D-147). Mostra as cinco pontas da classe com o
// quanto cada uma já está cheia (a parte dos pontos e a dos itens), e, para cada estilo, o efeito de agora ao lado do
// máximo prometido, e a mecânica. O "+" de cada atributo ganha a prévia do próximo ponto (qual ponta sobe e quanto).
// Textos sempre por textContent (sem HTML montado a partir de dados).

import type { ContextoSimulacao } from '../core/contexto';
import type { Atributos, Bolsa } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { radarDe, type ComponenteDeEstilo, type RadarDeEstilos } from '../progression/estilos';
import type { NomeAtributo } from '../progression/itens';

const SVG = 'http://www.w3.org/2000/svg';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

const pct = (v: number) => Math.round(v * 100);

/** O ponto da ponta `k` (de 5) a uma fração `f` do raio. */
function ponto(k: number, f: number, r: number, c: number): [number, number] {
  const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
  return [c + Math.cos(a) * r * f, c + Math.sin(a) * r * f];
}

const poligono = (fs: readonly number[], r: number, c: number) => fs.map((f, k) => ponto(k, Math.min(1.2, Math.max(0.02, f)), r, c).map((v) => v.toFixed(1)).join(',')).join(' ');

/** O desenho do pentágono: a grade, a parte dos pontos e a dos itens por cima. */
function desenho(radar: RadarDeEstilos): SVGSVGElement {
  const tam = 220;
  const c = tam / 2;
  const r = 78;
  const raiz = svg('svg', { viewBox: `0 0 ${String(tam)} ${String(tam)}`, class: 'radar-estilos', role: 'img', 'aria-label': t('estilos.radar') });
  for (const f of [0.25, 0.5, 0.75, 1]) raiz.append(svg('polygon', { points: poligono([f, f, f, f, f], r, c), class: f === 1 ? 'radar-borda' : 'radar-grade' }));
  raiz.append(svg('polygon', { points: poligono(radar.total, r, c), class: 'radar-itens' }));
  raiz.append(svg('polygon', { points: poligono(radar.base, r, c), class: 'radar-pontos' }));
  radar.estilos.forEach((e, k) => {
    const [x, y] = ponto(k, 1.32, r, c);
    const rotulo = svg('text', { x: x.toFixed(1), y: y.toFixed(1), class: 'radar-rotulo', 'text-anchor': 'middle' });
    rotulo.textContent = `${e.nome} ${String(pct(radar.total[k] ?? 0))}%`;
    raiz.append(rotulo);
  });
  return raiz;
}

/** O radar e a lista de estilos para a ficha (null: a classe não tem estilos). */
export function painelDeEstilos(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, bolsa: Bolsa, efetivos: Atributos, nivel: number): HTMLElement | null {
  const radar = radarDe(ctx, bolsa, efetivos, nivel);
  if (!radar) return null;
  const painel = el('section', 'painel-estilos');
  painel.append(el('h3', 'subtitulo-modal', t('ficha.estilos')), el('p', 'detalhe-item', t('estilos.explicacao')), desenho(radar));
  const lista = el('ul', 'lista-estilos');
  radar.estilos.forEach((e, k) => {
    const i = radar.total[k] ?? 0;
    const li = el('li');
    li.dataset.estilo = e.id;
    li.dataset.intensidade = String(pct(i));
    const pesos = Object.keys(e.pesos).map((a) => t(`atributoCurto.${a}` as ChaveTexto)).join(' + ');
    li.append(el('strong', undefined, `${e.nome} · ${String(pct(i))}%`), el('span', 'estilo-pesos', ` (${pesos})`));
    if ((radar.itens[k] ?? 0) > 0) li.append(el('span', 'estilo-itens', ` ${t('estilos.dosItens', { n: pct(radar.itens[k] ?? 0) })}`));
    const efeitos = (Object.entries(e.efeitos) as [ComponenteDeEstilo, number][])
      .map(([comp, max]) => t('estilos.efeito', { nome: t(`estilos.comp.${comp}` as ChaveTexto), agora: Math.round(max * i * 100), max: Math.round(max * 100) }));
    li.append(el('div', 'estilo-efeitos', efeitos.join(' · ')), el('div', 'estilo-mecanica', e.texto));
    lista.append(li);
  });
  painel.append(lista);
  return painel;
}

/** A prévia do próximo ponto num atributo: o estilo que mais sobe e quantos p.p. (null: nenhum estilo usa o atributo). */
export function previaDoPonto(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, bolsa: Bolsa, efetivos: Atributos, nivel: number, atributo: NomeAtributo): string | null {
  const antes = radarDe(ctx, bolsa, efetivos, nivel);
  if (!antes) return null;
  const mais = { ...bolsa, atributosBase: { ...bolsa.atributosBase, [atributo]: bolsa.atributosBase[atributo] + 1 } };
  const depois = radarDe(ctx, mais, { ...efetivos, [atributo]: efetivos[atributo] + 1 }, nivel);
  if (!depois) return null;
  let melhor = -1;
  let ganho = 0;
  depois.total.forEach((v, k) => {
    const d = v - (antes.total[k] ?? 0);
    if (d > ganho) {
      ganho = d;
      melhor = k;
    }
  });
  const estilo = antes.estilos[melhor];
  return estilo && ganho > 0 ? t('estilos.previa', { estilo: estilo.nome, pp: (ganho * 100).toFixed(1).replace('.', ',') }) : null;
}
