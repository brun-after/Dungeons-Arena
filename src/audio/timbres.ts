// O som do golpe corpo a corpo pelo atacante (08/11/2026, D-138). Puro: a arma (a do básico, ou a da mão) dá o timbre
// do personagem; a criatura sem arma soa pelo próprio corpo (o preset, senão o modelo); os mortos do Necromante dão o
// baque surdo. Tabelas aqui, consultadas por funções pequenas; arma ou criatura nova cai no timbre da natureza do golpe
// (corte, esmagar, estocada…) ou no soco.

import type { Habilidade } from '../combat/habilidades';
import type { GolpeDeArma, RegrasDeArmas } from '../progression/armas';
import type { SomId } from './mapeamento';

/** Até onde (células) uma habilidade física de contato ainda é golpe corpo a corpo. */
const ALCANCE_CORPO_A_CORPO = 2;

/** A natureza do golpe da arma -> timbre (o de longe só vale quando a arma bate de perto). */
const POR_NATUREZA: Readonly<Record<GolpeDeArma, SomId>> = {
  corte: 'golpe_espada',
  corte_pesado: 'golpe_machado',
  contundente: 'golpe_maca',
  contundente_leve: 'golpe_cajado',
  estocada: 'golpe_lanca',
  estocada_rapida: 'golpe_rapieira',
  leitura: 'golpe_livro',
  disparo: 'golpe_cajado',
  arremesso: 'golpe_faca',
};

/** As armas que soam diferente das outras da mesma natureza. */
const POR_ARMA: Readonly<Record<string, SomId>> = {
  montante: 'golpe_montante',
  sabre: 'golpe_sabre',
  mangual: 'golpe_mangual',
  foice: 'golpe_foice',
  colheita: 'golpe_foice',
};

/** O corpo da criatura sem arma de classe, pelo modelo (o prefixo vale: `dragao` cobre os quatro dragões). */
const POR_MODELO: readonly (readonly [string, SomId])[] = [
  ['goblin', 'golpe_faca'],
  ['orc', 'golpe_machado'],
  ['troll', 'golpe_maca'],
  ['lobo', 'golpe_mordida'],
  ['aranha', 'golpe_mordida'],
  ['falcao', 'golpe_garra'],
  ['vampiro', 'golpe_garra'],
  ['fada', 'golpe_garra'],
  ['slime', 'golpe_gosma'],
  ['demonio', 'golpe_garra_pesada'],
  ['dragao', 'golpe_garra_pesada'],
  ['sombra', 'golpe_sombra'],
  ['esqueleto', 'golpe_foice'],
  ['sentinela', 'golpe_maca'],
];

/** Quem bate, no que importa ao som. */
export interface AtacanteSonoro {
  preset: string;
  /** O modelo desenhado (o da classe, senão o do preset); null se desconhecido. */
  modelo: string | null;
  /** A arma na mão principal (o desenho), ou null (criatura sem arma de classe). */
  arma: string | null;
  /** O básico do atacante (o golpe da criatura é básico mesmo sem a marca `basico`). */
  ataqueBasico: string;
  /** É um morto do Necromante (o servo, os reanimados, os ecos e os erguidos pelas skills dele)? */
  mortoDoNecromante: boolean;
}

/** O que diz "flecha" no id ou nas etiquetas (o tiro do arco, a seta da besta). */
const FLECHA = /flecha|tiro|arco|besta/;

/** O golpe é corpo a corpo (físico, de contato ou área curta)? */
export function golpeCorpoACorpo(h: Pick<Habilidade, 'tipoAtaque' | 'politicaImpacto' | 'alcanceCelulas'>): boolean {
  return h.tipoAtaque === 'fisico' && h.politicaImpacto !== 'projetil' && h.alcanceCelulas <= ALCANCE_CORPO_A_CORPO;
}

function daArma(armas: RegrasDeArmas, desenho: string): SomId | null {
  const natureza = armas.golpes.get(desenho);
  return POR_ARMA[desenho] ?? (natureza ? POR_NATUREZA[natureza] : null);
}

/** A arma de onde sai o básico (o da mão secundária também), ou null se não é básico de arma. */
function armaDoBasico(armas: RegrasDeArmas, habilidadeId: string): string | null {
  for (const [desenho, def] of armas.armas) if (def.basico === habilidadeId) return desenho;
  return null;
}

/**
 * O timbre do golpe e se é o básico do atacante (o básico sempre soa pela arma; a skill com elemento ou som próprio
 * fica com o dela), ou null quando o golpe não é corpo a corpo.
 */
export function timbreDoGolpe(
  armas: RegrasDeArmas,
  h: Pick<Habilidade, 'id' | 'tipoAtaque' | 'politicaImpacto' | 'alcanceCelulas'> & Partial<Pick<Habilidade, 'tags'>>,
  a: AtacanteSonoro,
  basico: boolean,
): { som: SomId; basico: boolean } | null {
  if (h.tipoAtaque !== 'fisico') return null;
  const ehBasico = basico || h.id === a.ataqueBasico;
  if (a.mortoDoNecromante) return golpeCorpoACorpo(h) ? { som: 'golpe_baque', basico: ehBasico } : null;
  // O básico de arma soa pela própria arma (o da secundária também), inclusive a onda curta da espada.
  const doBasico = ehBasico ? armaDoBasico(armas, h.id) : null;
  if (doBasico) {
    const natureza = armas.golpes.get(doBasico);
    // 08/11/2026: a flecha do arco crava com o baque surdo, um pouco mais agudo que o dos mortos.
    if (natureza === 'disparo' && h.politicaImpacto === 'projetil') return { som: 'golpe_flecha', basico: true };
    const deLonge = natureza === 'disparo' || natureza === 'arremesso';
    if (!deLonge || golpeCorpoACorpo(h)) {
      const som = daArma(armas, doBasico);
      if (som) return { som, basico: true };
    }
    return null;
  }
  if (h.politicaImpacto === 'projetil' && FLECHA.test(`${h.id} ${(h.tags ?? []).join(' ')}`)) return { som: 'golpe_flecha', basico: ehBasico };
  if (!golpeCorpoACorpo(h)) return null;
  const som = (a.arma ? daArma(armas, a.arma) : null)
    ?? (a.modelo ? POR_MODELO.find(([prefixo]) => a.modelo?.startsWith(prefixo))?.[1] : undefined)
    ?? 'golpe_soco';
  return { som, basico: ehBasico };
}
