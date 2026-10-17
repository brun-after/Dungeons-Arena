// Marco 19 (17/10/2026): consulta de sequências e próxima etapa; usa estado autoritativo e os mesmos ticks.
import { progressoDeCombo } from '../combat/sequencias';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { t } from '../i18n';

export function catalogoCombos(ctx: ContextoSimulacao, ator: Entidade): HTMLElement {
  const detalhes = document.createElement('details');
  detalhes.className = 'catalogo-combos';
  const titulo = document.createElement('summary'); titulo.textContent = t('combos.titulo'); detalhes.append(titulo);
  const conhecidas = ator.bolsa?.conhecidas.map((c) => c.id) ?? ator.habilidades;
  const combos = [...ctx.conteudo.combos.values()].filter((c) => c.sequencia.every((id) => conhecidas.includes(id)));
  for (const c of combos) {
    const artigo = document.createElement('article'); artigo.dataset.combo = c.id;
    const nome = document.createElement('h4'); nome.textContent = c.nome;
    const seq = document.createElement('p'); seq.textContent = t('combos.sequencia', { skills: c.sequencia.map((id) => ctx.conteudo.habilidades.get(id)?.nome ?? id).join(' / ') });
    const efeito = document.createElement('p'); efeito.textContent = c.texto;
    artigo.append(nome, seq, efeito); detalhes.append(artigo);
  }
  if (!combos.length) { const p = document.createElement('p'); p.textContent = t('combos.nenhum'); detalhes.append(p); }
  return detalhes;
}
export class IndicadorCombo {
  readonly elemento = document.createElement('output');
  constructor() { this.elemento.className = 'indicador-combo'; this.elemento.hidden = true; }
  atualizar(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade | undefined): void {
    const p = ator ? progressoDeCombo(estado, ctx, ator) : null;
    this.elemento.hidden = !p;
    if (p) this.elemento.textContent = t('combos.preparado', { nome: p.combo.nome, etapa: p.etapa, total: p.combo.sequencia.length, skill: ctx.conteudo.habilidades.get(p.proxima)?.nome ?? p.proxima });
  }
}
