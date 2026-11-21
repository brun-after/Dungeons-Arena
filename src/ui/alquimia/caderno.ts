// Marco 50 (21/11/2026, D-196): o caderno de fórmulas. As fusões que o personagem conhece (e a em estudo) viram
// páginas com a receita, e as assinaturas aparecem como páginas em branco até alguém acertar a mistura (o diário guarda
// as descobertas). Textos por textContent.

import { definicaoDe, resolverHabilidade } from '../../combat/compilar-habilidade';
import { ehFusao } from '../../combat/fusao/receita';
import type { ContextoSimulacao } from '../../core/contexto';
import type { Entidade } from '../../entities/entidade';
import { t, type ChaveTexto } from '../../i18n';
import { formaEmPalavras } from './previa';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

export function desenharCaderno(ctx: ContextoSimulacao, j: Entidade): HTMLElement {
  const bolsa = j.bolsa;
  const caixa = el('section', 'caderno-formulas');
  caixa.append(el('h3', 'subtitulo-modal', t('alquimia.caderno')));
  if (!bolsa) return caixa;
  const ids = [...bolsa.conhecidas.map((c) => c.id), ...(bolsa.estudo ? [bolsa.estudo.id] : [])].filter(ehFusao);
  const paginas = el('div', 'paginas-caderno');
  for (const id of ids) {
    const h = resolverHabilidade(ctx, id);
    const partes = definicaoDe(ctx, id)?.fusao ?? [];
    if (!h) continue;
    const pagina = el('article', 'pagina-caderno');
    const cor = h.elemento ? ctx.conteudo.elementos.get(h.elemento)?.cor : undefined;
    if (cor) pagina.style.setProperty('--cor-elemento', cor);
    pagina.append(el('strong', 'nome-item', h.nome));
    pagina.append(el('p', 'detalhe-item', t('alquimia.receita', { partes: partes.map((p) => resolverHabilidade(ctx, p)?.nome ?? p).join(' + ') })));
    pagina.append(el('p', 'detalhe-item', t('alquimia.forma', { texto: formaEmPalavras(h.entrega) })));
    paginas.append(pagina);
  }
  if (ids.length === 0) caixa.append(el('p', 'detalhe-item', t('alquimia.cadernoVazio')));
  caixa.append(paginas);
  // As assinaturas: as achadas com o nome e o texto; as outras, em branco.
  const assinaturas = ctx.conteudo.alquimia.assinaturas;
  const achadas = assinaturas.filter((a) => bolsa.diario.includes(`fusao:${a.id}`));
  caixa.append(el('h4', 'subtitulo-modal', t('alquimia.assinaturasAchadas', { n: achadas.length, total: assinaturas.length })));
  const grade = el('div', 'paginas-caderno assinaturas-caderno');
  for (const a of assinaturas) {
    const achada = achadas.includes(a);
    const pagina = el('article', `pagina-caderno${achada ? '' : ' em-branco'}`);
    if (achada) {
      pagina.append(el('strong', 'nome-item', a.nome));
      pagina.append(el('p', 'detalhe-item', a.nucleos.map((n) => t(`nucleo.${n}` as ChaveTexto)).join(' + ')));
      pagina.append(el('p', 'detalhe-item', a.texto));
    } else pagina.append(el('span', 'detalhe-item', t('alquimia.paginaEmBranco')));
    grade.append(pagina);
  }
  caixa.append(grade);
  return caixa;
}
