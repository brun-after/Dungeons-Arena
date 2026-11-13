// O radar do pentagrama de estilos na ficha (marco 39, 12/11/2026, D-147). Mostra as cinco pontas da classe com o
// quanto cada uma já está cheia (a parte dos pontos e a dos itens), e, para cada estilo, o efeito de agora ao lado do
// máximo prometido, e a mecânica. O "+" de cada atributo ganha a prévia do próximo ponto (qual ponta sobe e quanto).
// Textos sempre por textContent (sem HTML montado a partir de dados).

import type { ContextoSimulacao } from '../core/contexto';
import type { Atributos, Bolsa } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { degrausDaPonta, pontaConquistada, trilhaDoRadar, valorDaMelhoria } from '../progression/dominio';
import { areaDaForma, ecoDaForma, faixaDaForma, perfuracaoDaForma, saltosDaForma } from '../combat/forma-do-estilo';
import { formaDoEixo, type FormaId } from '../combat/eixos';
import { radarDe, type ComponenteDeEstilo, type Estilo, type MelhoriaDeClasse, type RadarDeEstilos } from '../progression/estilos';
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

type CtxPainel = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

/** Marco 39 (12/11/2026, D-155): o texto de uma melhoria de classe com tal valor (fator em %, marco no seu texto). */
function textoDaMelhoria(m: MelhoriaDeClasse, v: number): string {
  if (m.chave in FATORES) return t('estilos.classeFator', { efeito: t(`dominio.porPonto.${m.chave}` as ChaveTexto), v: Math.round(v) });
  const virgula = (n: number) => String(n).replace('.', ',');
  return t(`marco.${m.chave}` as ChaveTexto, { valor: virgula(Math.round(v * 100) / 100), s: virgula(Math.round(v / 100) / 10) });
}

/** As chaves de fator (as outras são marcos). */
const FATORES: Readonly<Record<string, true>> = {
  furia: true, aura: true, servos: true, retornoServo: true, carga: true, alcanceCarregado: true, encarnacao: true, elemental: true, falcao: true, pergaminho: true,
};

/** D-155: a linha da classe do estilo: o degrau de agora, o que cada melhoria dá e quando vem o próximo. */
function linhaDaClasse(ctx: CtxPainel, e: Estilo, intensidade: number): string {
  const passo = ctx.balance.dominio.degrauPct;
  const d = degrausDaPonta(ctx, intensidade);
  const proximo = t('estilos.classeProximo', { pct: (d + 1) * passo });
  // Sem degrau ainda, mostra o que o primeiro traz (a prévia de para onde o estilo leva a classe).
  const olhar = Math.max(1, d);
  const itens = e.melhorias.map((m) => {
    const v = valorDaMelhoria(m, olhar);
    if (v > 0) return textoDaMelhoria(m, v);
    // O primeiro degrau em que ela vale algo (as inteiras esperam chegar a 1).
    const primeiro = Math.max(m.desde, m.inteiro && m.porDegrau > 0 ? Math.ceil((1 - m.base) / m.porDegrau - 1e-9) : m.desde);
    return t('estilos.classeEmBreve', { pct: primeiro * passo, texto: textoDaMelhoria(m, valorDaMelhoria(m, primeiro)) });
  }).join(' · ');
  if (d <= 0) return t('estilos.classeNada', { pct: passo, itens });
  return `${t('estilos.classe', { d, itens })} ${proximo}`;
}

/** D-156: o que a forma faz agora, na faixa. Marco 40 (D-157): também as cinco formas novas. */
function efeitoDaForma(ctx: CtxPainel, mod: FormaId, faixa: number): string {
  const r = ctx.balance.habilidades.eixos;
  switch (mod) {
    case 'controle':
      return t('estilos.formaControle', { pct: Math.round(r.controle.duracaoPorFaixaPct * faixa), viz: faixa >= r.controle.vizinhoDesde ? t('estilos.formaControleVizinho') : '' });
    case 'sustento':
      return t('estilos.formaSustento', { pct: Math.round(r.sustento.fracaoPorFaixaPct * faixa) });
    case 'marca':
      return t('estilos.formaMarca', { max: r.marca.max, pct: Math.round(r.marca.pctPorMarcaMax * faixa) / 10 });
    case 'grupo':
      return t('estilos.formaGrupo', { pct: Math.round(r.grupo.fracaoPorFaixaPct * faixa), dano: Math.round(r.grupo.danoPorFaixaPct * faixa) });
    case 'invocacao':
      return t('estilos.formaInvocacao', { pct: Math.round(r.invocacao.duracaoPorFaixaPct * faixa) });
    case 'ecoar':
      return t('estilos.formaEco', { pct: Math.round(ecoDaForma(faixa) * 100) });
    case 'encadear': {
      const s = saltosDaForma(faixa);
      return t('estilos.formaSaltos', { n: s.quantidade, pct: s.pct });
    }
    case 'atravessar':
      return t('estilos.formaAtravessa', { n: perfuracaoDaForma(faixa) });
    case 'maior_e_mais_lenta': {
      const a = areaDaForma(faixa);
      return t('estilos.formaArea', { pct: Math.round((a.danoMult - 1) * 100), conj: Math.round((a.conjuracaoMult - 1) * 100), raio: a.raioExtra > 0 ? t('estilos.formaAreaRaio') : '' });
    }
  }
}

/** D-156: a linha da forma, com o medidor de 10 faixas. */
function linhaDaForma(ctx: CtxPainel, estilo: Estilo, intensidade: number): HTMLElement {
  const r = ctx.balance.estilos;
  const faixa = faixaDaForma(intensidade, r.formaInicioPct / 100, r.formaPlenaPct / 100);
  // Marco 40 (D-157): a forma é a do eixo principal; o secundário vale na metade nas skills sem o principal.
  const [principal, secundario] = estilo.eixos;
  const forma = formaDoEixo(principal);
  const custo = -ctx.balance.habilidades.eixos.custoPct[forma];
  const alvo = t('estilos.formaEixos', { eixo: t(`eixo.${principal}` as ChaveTexto), sec: t(`eixo.${secundario}` as ChaveTexto) });
  const mod = t(`forma.mod.${forma}` as ChaveTexto);
  const texto = faixa > 0
    ? t('estilos.formaAtiva', { faixa, mod, alvo, agora: efeitoDaForma(ctx, forma, faixa), dano: Math.round((custo * faixa) / 10) })
    : t('estilos.forma', { mod, alvo, inicio: r.formaInicioPct, plena: r.formaPlenaPct, dano: custo });
  const div = el('div', faixa > 0 ? 'estilo-forma acesa' : 'estilo-forma');
  div.dataset.forma = String(faixa);
  div.style.setProperty('--forma', String(faixa / 10));
  const medidor = el('span', 'forma-medidor');
  medidor.setAttribute('aria-hidden', 'true');
  for (let k = 1; k <= 10; k++) medidor.append(el('i', k <= faixa ? 'cheia' : undefined));
  div.append(medidor, el('span', undefined, texto));
  return div;
}

/** O radar e a lista de estilos para a ficha (null: a classe não tem estilos). */
export function painelDeEstilos(ctx: CtxPainel, bolsa: Bolsa, efetivos: Atributos, nivel: number): HTMLElement | null {
  const radar = radarDe(ctx, bolsa, efetivos, nivel);
  if (!radar) return null;
  const painel = el('section', 'painel-estilos');
  painel.append(el('h3', 'subtitulo-modal', t('ficha.estilos')), el('p', 'detalhe-item', t('estilos.explicacao')), desenho(radar));
  // D-155: a classe nos estilos (o atributo de classe saiu).
  const trilha = trilhaDoRadar(ctx, radar);
  painel.append(el('p', 'detalhe-item estilo-classe-resumo', t('estilos.classeSkills', {
    passo: ctx.balance.dominio.degrauPct, pct: Math.round(trilha.degraus * ctx.balance.dominio.skillsPorDegrauPct), d: trilha.degraus, sem: ctx.balance.dominio.semFamiliaridadePct,
  })));
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
    if (e.melhorias.length > 0) li.append(el('div', 'estilo-classe', linhaDaClasse(ctx, e, pontaConquistada(radar, k))));
    // Marco 39 (D-156): a forma do estilo, que aparece com 10% e cresce em faixas até 100% (o medidor enche).
    li.append(linhaDaForma(ctx, e, i));
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
