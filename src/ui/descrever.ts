// Descrições geradas a partir das peças (D-057, D-059). Marco 14 (14/10/2026).
// Habilidades, efeitos, caminhos, passivas e livros se descrevem sozinhos pelo que são — forma, alcance, dano,
// elemento, efeitos com os números, custo e tempo —, então uma habilidade nova (escrita, gerada ou evoluída)
// já chega com texto. Os textos vêm do dicionário; aqui só a montagem.

import { codigoDaGerada, ehGerada } from '../combat/chave-habilidade';
import type { Caminho } from '../combat/compilar-habilidade';
import { faixaDaFormula } from '../combat/dados';
import type { Elemento } from '../combat/elementos';
import type { Habilidade, Passiva } from '../combat/habilidades';
import type { EfeitoCanonico, TipoEfeito } from '../combat/registro-efeitos';
import { t, type ChaveTexto } from '../i18n';

/** Segundos com vírgula, sem casas inúteis: 1500 -> "1,5"; 3000 -> "3". */
export function segundos(ms: number): string {
  const s = Math.round(ms / 100) / 10;
  return String(s).replace('.', ',');
}

const numero = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',');

export function nomeDoEfeito(tipo: TipoEfeito): string {
  return t(`efeito.${tipo}` as ChaveTexto);
}

export function nomeDoElemento(e: Elemento): string {
  return t(`elemento.${e}` as ChaveTexto);
}

type EfeitoDescrito = Pick<EfeitoCanonico, 'tipo' | 'duracaoMs' | 'valor' | 'pct' | 'interno'> & { em?: EfeitoCanonico['em'] };

/** O que o efeito faz, com os números. */
export function descreverEfeito(ef: EfeitoDescrito): string {
  // Cura e mana: valor fixo e/ou % do máximo.
  const quanto = [ef.valor > 0 ? numero(ef.valor) : '', ef.pct > 0 ? `${numero(ef.pct)}%` : ''].filter((x) => x !== '').join(' + ') || '0';
  const texto = t(`desc.efeito.${ef.tipo}` as ChaveTexto, {
    valor: numero(ef.valor),
    pct: numero(ef.pct),
    s: segundos(ef.duracaoMs),
    quanto,
    interno: ef.interno ? descreverEfeito(ef.interno) : '',
  });
  return ef.em === 'conjurador' ? t('desc.emVoce', { texto }) : texto;
}

const media = (formula: string) => {
  const f = faixaDaFormula(formula);
  return (f.min + f.max) / 2;
};

function linhaDaForma(h: Habilidade): string {
  if (h.politicaAlvo === 'aliado') return t('desc.forma.aliado', { alcance: h.alcanceCelulas });
  if (h.politicaAlvo === 'aliados') return t('desc.forma.aliados', { raio: h.raioArea });
  if (h.politicaAlvo === 'celula' && h.politicaImpacto === 'proprio') return t('desc.forma.celula', { alcance: h.alcanceCelulas });
  if (h.politicaImpacto === 'proprio') return t('desc.forma.proprio');
  if (h.politicaImpacto === 'area' && h.tipoArea !== 'nenhuma') {
    return t(`desc.forma.${h.tipoArea}` as ChaveTexto, { alcance: h.alcanceCelulas, raio: h.raioArea, lado: 2 * h.raioArea + 1 });
  }
  return t(`desc.forma.${h.politicaImpacto === 'projetil' ? 'projetil' : 'contato'}`, { alcance: h.alcanceCelulas });
}

/** Bônus de passiva, afinidade ou caminho, um por linha. */
export function descreverBonus(b: Partial<Passiva> & { duracaoPct?: number; raio?: number }): string[] {
  const linhas: string[] = [];
  const campos = ['danoPct', 'curaPct', 'alcance', 'custoPct', 'recargaPct', 'duracaoPct', 'raio', 'hpMaxPct', 'manaMaxPct', 'defesa', 'tenacidadePct', 'fluxoEscudoPct'] as const;
  for (const c of campos) {
    const v = b[c];
    if (v === undefined || v === 0) continue;
    const bonus = t(`desc.bonus.${c}` as ChaveTexto, { sinal: v > 0 ? '+' : '−', v: numero(Math.abs(v)) });
    const comTag = b.tag && c !== 'hpMaxPct' && c !== 'manaMaxPct' && c !== 'defesa';
    linhas.push(comTag ? t('desc.bonus.comTag', { bonus, tag: t(`tag.${b.tag ?? ''}` as ChaveTexto) }) : bonus);
  }
  return linhas;
}

export interface OpcoesDescricao {
  rankMax?: number;
  /** Dano e cura já com o perfil (afinidade e passivas), em % extra. */
  perfilDanoPct?: number;
}

/** As linhas da descrição de uma habilidade compilada. */
export function descreverHabilidade(h: Habilidade, o: OpcoesDescricao = {}): string[] {
  const linhas: string[] = [];
  if (h.passiva) {
    linhas.push(t('desc.passiva'), ...descreverBonus(h.passiva));
    if (o.rankMax !== undefined) linhas.push(t('desc.rank', { rank: h.rank, max: o.rankMax }));
    return linhas;
  }
  linhas.push(linhaDaForma(h));
  const mult = h.multDano * (1 + (o.perfilDanoPct ?? 0) / 100);
  if (h.formulaDano !== null) linhas.push(t('desc.dano', { formula: h.formulaDano, media: numero(media(h.formulaDano) * mult) }));
  if (h.formulaCura !== null) linhas.push(t('desc.cura', { formula: h.formulaCura, media: numero(media(h.formulaCura) * h.multCura) }));
  if (h.elemento) linhas.push(t('desc.elemento', { nome: nomeDoElemento(h.elemento) }));
  for (const ef of h.efeitos) linhas.push(descreverEfeito(ef));
  if (h.perfura) linhas.push(t('desc.perfura'));
  if (h.saltos) linhas.push(t('desc.saltos', { n: h.saltos.quantidade, pct: h.saltos.pct }));
  const custos = [h.custoRecurso > 0 ? t('desc.custo', { mana: h.custoRecurso }) : '', h.custoVida > 0 ? t('desc.custoVida', { vida: h.custoVida }) : ''].filter((x) => x !== '');
  linhas.push(custos.length > 0 ? custos.join(' · ') : t('desc.semCusto'));
  linhas.push(t(`desc.mobilidade.${h.mobilidade}`));
  linhas.push(h.recargaMs > 0 ? t('desc.tempo', { conj: segundos(h.conjuracaoMs), recarga: segundos(h.recargaMs) }) : t('desc.tempoSemRecarga', { conj: segundos(h.conjuracaoMs) }));
  if (o.rankMax !== undefined) linhas.push(t('desc.rank', { rank: h.rank, max: o.rankMax }));
  const codigo = ehGerada(h.id) ? codigoDaGerada(h.id) : null;
  if (codigo) linhas.push(t('desc.codigo', { codigo }));
  return linhas;
}

/** O que o caminho de evolução muda. */
export function descreverCaminho(c: Caminho): string[] {
  const linhas = [...c.mods.map((m) => t(`mod.${m}` as ChaveTexto)), ...descreverBonus(c)];
  if (c.elemento) linhas.push(t('desc.bonus.elemento', { nome: nomeDoElemento(c.elemento) }));
  for (const ef of c.efeitos) linhas.push(descreverEfeito(ef));
  return linhas;
}
