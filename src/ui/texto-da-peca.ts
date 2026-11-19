// O texto da peça de armadura na mochila e na loja (marco 46, 16/11/2026, D-188): o propósito, o estilo e uma linha
// por efeito, montados do perfil (progression/pecas.ts) pelo dicionário. O HTML que os mostra escapa tudo.

import { t, tOu, type ChaveTexto } from '../i18n';
import type { EfeitoDaPeca, PerfilDePeca } from '../progression/pecas';
import { DT_MS } from '../core/loop';

const segundos = (ticks: number) => Math.round((ticks * DT_MS) / 100) / 10;
const elemento = (el: string | null) => (el ? tOu(`elemento.${el}`, el) : '');

/** A linha de um efeito da peça. */
export function textoDoEfeito(x: EfeitoDaPeca): string {
  const ef = x.efeito;
  const el = elemento(x.se.elemento);
  const ataque = x.se.ataque === 'qualquer' ? '' : t(`peca.ataque.${x.se.ataque}` as ChaveTexto);
  const p = { elemento: el, ataque, pct: 'pct' in ef ? ef.pct : 'pctDaVida' in ef ? ef.pctDaVida : 0, s: 'ticks' in ef ? segundos(ef.ticks) : 0, raio: 'raio' in ef ? ef.raio : 0 };
  const base = `peca.efeito.${x.gatilho}.${ef.tipo}`;
  if (ef.tipo === 'absorver') return t(`${base}.${ef.em}` as ChaveTexto, p);
  if (ef.tipo === 'dano') return t((x.se.elemento ? `${base}.elemento` : base) as ChaveTexto, p).replace(/\s+/g, ' ').trim();
  if (x.gatilho === 'usar' && !x.se.elemento) return t(`${base}.magia` as ChaveTexto, p);
  if ((ef.tipo === 'velocidade' || ef.tipo === 'refletir') && x.gatilho === 'atingido' && !x.se.elemento) return t(`${base}.qualquer` as ChaveTexto, p);
  return t(base as ChaveTexto, p);
}

/** O propósito, o estilo e os efeitos da peça, separados por ` · `. */
export function textoDaPeca(p: PerfilDePeca): string {
  const visual = t('peca.visual', { proposito: tOu(`peca.proposito.${p.proposito}`, p.proposito), estilo: tOu(`peca.estilo.${p.estilo}`, p.estilo) });
  return [visual, ...p.efeitos.map(textoDoEfeito)].join(' · ');
}
