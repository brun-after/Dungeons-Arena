// Marco 19 (17/10/2026): consulta de sequências e próxima etapa; usa estado autoritativo e os mesmos ticks.
// Marco 26 (26/10/2026, D-111): os combos da build saem das habilidades equipadas (a barra), não das conhecidas. O
// combo descoberto (no Diário) mostra como se faz e o efeito; o que falta descobrir aparece como "????", sem nomes. O
// indicador do combo em preparo também não revela o nome do que ainda não foi descoberto.
import { progressoDeCombo } from '../combat/sequencias';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { t } from '../i18n';
import { comoFazerCombo, nomeDaHabilidade } from './diario-detalhes';

/** As habilidades equipadas (a barra; sem mochila, as da entidade). */
const equipadas = (ator: Entidade): readonly string[] => (ator.bolsa ? ator.bolsa.barra.filter((id): id is string => id !== null) : ator.habilidades);
const descoberto = (ator: Entidade, id: string) => ator.bolsa?.diario.includes(`combo:${id}`) ?? false;

export function catalogoCombos(ctx: ContextoSimulacao, ator: Entidade): HTMLElement {
  const detalhes = document.createElement('details');
  detalhes.className = 'catalogo-combos';
  const titulo = document.createElement('summary'); titulo.textContent = t('combos.titulo'); detalhes.append(titulo);
  const barra = equipadas(ator);
  const combos = [...ctx.conteudo.combos.values()].filter((c) => c.sequencia.every((id) => barra.includes(id)));
  // Os descobertos primeiro (na ordem do catálogo), depois as silhuetas.
  const ordenados = [...combos.filter((c) => descoberto(ator, c.id)), ...combos.filter((c) => !descoberto(ator, c.id))];
  for (const c of ordenados) {
    const artigo = document.createElement('article');
    const nome = document.createElement('h4');
    if (descoberto(ator, c.id)) {
      artigo.dataset.combo = c.id;
      nome.textContent = c.nome;
      artigo.append(nome);
      for (const linha of comoFazerCombo(ctx, c)) {
        const p = document.createElement('p'); p.className = 'como-combo'; p.textContent = linha; artigo.append(p);
      }
      const efeito = document.createElement('p'); efeito.textContent = c.texto; artigo.append(efeito);
    } else {
      artigo.className = 'combo-oculto';
      artigo.dataset.oculto = 'sim';
      nome.textContent = t('combos.naoDescoberto');
      const p = document.createElement('p'); p.textContent = t('combos.silhueta', { n: c.sequencia.length });
      artigo.append(nome, p);
    }
    detalhes.append(artigo);
  }
  if (!combos.length) { const p = document.createElement('p'); p.textContent = t('combos.nenhumaBarra'); detalhes.append(p); }
  return detalhes;
}
export class IndicadorCombo {
  readonly elemento = document.createElement('output');
  constructor() { this.elemento.className = 'indicador-combo'; this.elemento.hidden = true; }
  atualizar(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade | undefined): void {
    const p = ator ? progressoDeCombo(estado, ctx, ator) : null;
    this.elemento.hidden = !p;
    if (!p || !ator) return;
    const valores = { etapa: p.etapa, total: p.combo.sequencia.length, skill: nomeDaHabilidade(ctx, p.proxima) };
    this.elemento.textContent = descoberto(ator, p.combo.id) ? t('combos.preparado', { nome: p.combo.nome, ...valores }) : t('combos.preparadoOculto', valores);
  }
}
