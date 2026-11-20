// A vitrine de armadura na tela da loja (marco 47, 20/11/2026, D-190). Os filtros (peça, propósito, estilo e
// elemento) só escolhem o que a tela mostra: não emitem comando. Os chips listam só os valores que a vitrine tem, e o
// contador diz quando ela renova (o dia do Mundo no exterior, a semana na dungeon, os ticks fora do Mundo).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import { DT_MS } from '../core/loop';
import { tOu, t } from '../i18n';
import { duracaoDoCiclo } from '../mundo/ciclo';
import type { Item } from '../progression/itens';
import { ticksAteRenovar } from '../progression/vitrine';
import { agoraDoMundo } from './hora-do-mundo';
import { duracaoLegivel } from './tempo';

export const FILTROS_DA_VITRINE = ['peca', 'proposito', 'estilo', 'elemento'] as const;
export type FiltroDaVitrine = (typeof FILTROS_DA_VITRINE)[number];
export type FiltrosDaVitrine = Record<FiltroDaVitrine, string | null>;

export const filtrosVazios = (): FiltrosDaVitrine => ({ peca: null, proposito: null, estilo: null, elemento: null });

/** O valor de um filtro numa peça (null: não é peça de armadura). */
function valorDe(item: Item, f: FiltroDaVitrine): string | null {
  const p = item.peca;
  if (!p) return null;
  return f === 'peca' ? p.peca : f === 'proposito' ? p.proposito : f === 'estilo' ? p.estilo : p.elemento;
}

const nomeDoValor = (f: FiltroDaVitrine, v: string): string =>
  f === 'peca' ? tOu(`slot.${v}`, v) : f === 'proposito' ? tOu(`peca.proposito.${v}`, v) : f === 'estilo' ? tOu(`peca.estilo.${v}`, v) : tOu(`elemento.${v}`, v);

/** As peças que passam em todos os filtros escolhidos. */
export function filtrarVitrine(itens: readonly Item[], filtros: FiltrosDaVitrine): Item[] {
  return itens.filter((i) => FILTROS_DA_VITRINE.every((f) => filtros[f] === null || valorDe(i, f) === filtros[f]));
}

/** O texto do contador: quanto falta para a vitrine renovar. */
export function textoDaRenovacao(estado: EstadoJogo, ctx: ContextoSimulacao, loja: ObjetoNoMundo): string {
  if (loja.vitrine === ctx.conteudo.lojas.perfilDungeon) return t('loja.vitrineSemanal');
  const ticks = ticksAteRenovar(estado, ctx, loja);
  if (ticks !== null) return t('loja.vitrineRenova', { tempo: duracaoLegivel(ticks * DT_MS) });
  const ciclo = duracaoDoCiclo(ctx.balance.mundo.ciclo);
  return ciclo > 0 ? t('loja.vitrineRenova', { tempo: duracaoLegivel(ciclo - (agoraDoMundo() % ciclo)) }) : '';
}

/** Os chips de um filtro: "Todos" e cada valor presente na vitrine. */
export function chipsDoFiltro(itens: readonly Item[], f: FiltroDaVitrine, filtros: FiltrosDaVitrine, escolher: (f: FiltroDaVitrine, v: string | null) => void): HTMLElement {
  const grupo = document.createElement('div');
  grupo.className = 'filtro-vitrine';
  grupo.setAttribute('role', 'group');
  grupo.setAttribute('aria-label', t(`loja.filtro.${f}`));
  const valores = [...new Set(itens.map((i) => valorDe(i, f)).filter((v): v is string => v !== null))].sort((a, b) => nomeDoValor(f, a).localeCompare(nomeDoValor(f, b)));
  const chip = (rotulo: string, v: string | null) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip-vitrine';
    b.textContent = rotulo;
    b.dataset.chave = `vitrine-${f}-${v ?? 'todos'}`;
    b.setAttribute('aria-pressed', String(filtros[f] === v));
    b.addEventListener('click', () => { escolher(f, v); });
    return b;
  };
  const titulo = document.createElement('span');
  titulo.className = 'rotulo-filtro';
  titulo.textContent = t(`loja.filtro.${f}`);
  grupo.append(titulo, chip(t('loja.filtroTodos'), null), ...valores.map((v) => chip(nomeDoValor(f, v), v)));
  return grupo;
}
