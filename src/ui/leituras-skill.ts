// Marco 40 (12/11/2026, D-159): a carta da skill de classe mostra o que cada estilo da classe faz nela. O estilo que
// já tem forma (faixa > 0) aparece aceso, com a porcentagem da faixa.

import { definicaoDe } from '../combat/compilar-habilidade';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { t } from '../i18n';
import { formasDosEstilos } from '../progression/estilos';

/** A lista das leituras de estilo da skill (null quando ela não tem leituras). */
export function listaDeLeituras(ctx: ContextoSimulacao, j: Entidade, id: string): HTMLElement | null {
  const leituras = definicaoDe(ctx, id)?.leituras;
  if (!leituras) return null;
  const ativas = new Map(formasDosEstilos(ctx, j).map((f) => [f.estilo.id, f.faixa]));
  const todos = [...ctx.conteudo.estilos.values()].flat();
  const ul = document.createElement('ul');
  ul.className = 'leituras-habilidade';
  ul.setAttribute('aria-label', t('habilidades.leituras'));
  for (const [estiloId, leitura] of Object.entries(leituras)) {
    const nome = todos.find((e) => e.id === estiloId)?.nome ?? estiloId;
    const faixa = ativas.get(estiloId) ?? 0;
    const li = document.createElement('li');
    li.className = faixa > 0 ? 'marco alcancado' : 'marco';
    li.dataset.estilo = estiloId;
    li.textContent = faixa > 0
      ? t('habilidades.leituraAtiva', { estilo: nome, pct: faixa * 10, texto: leitura.texto })
      : t('habilidades.leitura', { estilo: nome, texto: leitura.texto });
    ul.append(li);
  }
  return ul;
}
