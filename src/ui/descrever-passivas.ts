// Marco 24 (24/10/2026, D-095): as linhas dos campos novos das passivas gerais (resistências, esquiva, pelas costas…).
// Chamado por descreverBonus (descrever.ts); os textos ficam em pt-BR-classes.ts.

import type { Passiva } from '../combat/habilidades';
import type { EfeitoCanonico, TipoEfeito } from '../combat/registro-efeitos';
import { t, type ChaveTexto } from '../i18n';

const numero = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',');
const nomeEfeito = (tipo: TipoEfeito) => t(`efeito.${tipo}` as ChaveTexto);
const lista = (tipos: readonly TipoEfeito[]) => tipos.map(nomeEfeito).join(', ');

/** `descreverEfeito` vem de descrever.ts (passado aqui para não haver import circular). */
export function descreverPassivaGeral(p: Partial<Passiva>, descreverEfeito: (e: EfeitoCanonico) => string): string[] {
  const linhas: string[] = [];
  const pct = (chave: ChaveTexto, v: number | undefined) => { if (v) linhas.push(t(chave, { v: numero(v) })); };
  pct('desc.passiva.reducaoFisicoPct', p.reducaoFisicoPct);
  pct('desc.passiva.reducaoMagicoPct', p.reducaoMagicoPct);
  for (const [el, v] of Object.entries(p.resistencias ?? {})) linhas.push(t('desc.passiva.resistencia', { elemento: t(`elemento.${el}` as ChaveTexto), v: numero(v) }));
  for (const [tipo, v] of Object.entries(p.duracaoRecebidaPct ?? {}) as [TipoEfeito, number][]) {
    linhas.push(t('desc.passiva.duracaoRecebida', { efeito: nomeEfeito(tipo), v: numero(Math.abs(v)) }));
  }
  if (p.imunes?.length) linhas.push(t('desc.passiva.imunes', { lista: lista(p.imunes) }));
  if (p.aoAcertar) linhas.push(t('desc.passiva.aoAcertar', { chance: numero(p.aoAcertar.chancePct), efeito: descreverEfeito(p.aoAcertar.efeito) }));
  if (p.reforcoEstado) {
    linhas.push(t('desc.passiva.reforcoEstado', { efeito: nomeEfeito(p.reforcoEstado.tipo), v: numero(p.reforcoEstado.valorPct), s: numero(p.reforcoEstado.duracaoMs / 1000) }));
  }
  if (p.danoContraEstados) linhas.push(t('desc.passiva.danoContraEstados', { v: numero(p.danoContraEstados.pct), lista: lista(p.danoContraEstados.estados) }));
  pct('desc.passiva.esquivaPct', p.esquivaPct);
  pct('desc.passiva.esquivaInvisivelPct', p.esquivaInvisivelPct);
  pct('desc.passiva.costasPct', p.costasPct);
  pct('desc.passiva.curaRecebidaPct', p.curaRecebidaPct);
  pct('desc.passiva.resistenciaIgnoradaPct', p.resistenciaIgnoradaPct);
  return linhas;
}
