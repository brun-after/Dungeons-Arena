// Qual assinatura uma skill usa (marco 26, 29/10/2026, D-124). Puro: o campo `visual.assinatura` quando existe;
// senão o tema do id (corrente, giro, meteoro…), depois o elemento com a forma (as skills geradas: fogo em cone é o
// lança-chamas, gelo em volta é a nova) e, por fim, o tipo de ataque com a forma. Nunca o brilho genérico.

import type { AssinaturaVisual } from '../../combat/assinaturas-visuais';
import type { Elemento } from '../../combat/elementos';
import type { Habilidade } from '../../combat/habilidades';

export type FormaVfx = 'projetil' | 'quadrado' | 'linha' | 'ao_redor' | 'cone' | 'contato' | 'proprio';

export function formaVfx(h: Habilidade): FormaVfx {
  if (h.politicaImpacto === 'projetil') return 'projetil';
  if (h.politicaImpacto === 'contato') return 'contato';
  if (h.politicaImpacto === 'proprio') return 'proprio';
  if (h.tipoArea === 'linha' || h.tipoArea === 'cone' || h.tipoArea === 'ao_redor') return h.tipoArea;
  return 'quadrado';
}

/** Temas que o nome já diz (vale também para as skills que quem joga cria com esses nomes). */
const POR_ID: readonly [RegExp, AssinaturaVisual][] = [
  [/corrente|cadeia_sombria|grilh|laco_do|acorrent/, 'corrente'],
  [/meteoro|cometa/, 'meteoro'],
  [/redemoinho|turbilh|rodopi|ciclone|vortice|furacao/, 'redemoinho'],
];

const POR_ELEMENTO: Readonly<Record<Elemento, Readonly<Record<FormaVfx, AssinaturaVisual>>>> = {
  fogo: { projetil: 'bola_de_fogo_projetil', quadrado: 'chuva_de_brasas', linha: 'risco_de_fogo', ao_redor: 'anel_de_chamas', contato: 'mao_em_chamas', cone: 'lanca_chamas', proprio: 'rastro_de_fogo' },
  gelo: { projetil: 'estilhaco_de_gelo', quadrado: 'tempestade_de_gelo', linha: 'lanca_de_gelo', ao_redor: 'nova_glacial', contato: 'toque_de_gelo', cone: 'cone_de_gelo', proprio: 'chao_congelado' },
  raio: { projetil: 'relampago', quadrado: 'tempestade_de_raios', linha: 'feixe_eletrico', ao_redor: 'esfera_de_plasma', contato: 'toque_eletrico', cone: 'cone_eletrico', proprio: 'esfera_de_plasma' },
  veneno: { projetil: 'dardo_toxico', quadrado: 'poca_toxica', linha: 'cone_toxico', ao_redor: 'nevoa_venenosa', contato: 'golpe_viscoso', cone: 'cone_toxico', proprio: 'seiva_corrosiva' },
  psiquico: { projetil: 'agulha_mental', quadrado: 'mente_partida', linha: 'onda_de_repulsao', ao_redor: 'mente_partida', contato: 'telecinese', cone: 'onda_de_repulsao', proprio: 'pressagio' },
  terra: { projetil: 'estaca_de_pedra', quadrado: 'salto_esmagador', linha: 'pedregulho', ao_redor: 'abalo_sismico', contato: 'golpe_pesado', cone: 'pedregulho', proprio: 'pele_de_pedra' },
  trevas: { projetil: 'cranio', quadrado: 'garras_do_ossuario', linha: 'ceifa_de_almas', ao_redor: 'mortalha', contato: 'golpe_sombrio', cone: 'ceifa_de_almas', proprio: 'veu_da_noite' },
  sagrado: { projetil: 'lanca_radiante', quadrado: 'chuva_de_estrelas', linha: 'lanca_radiante', ao_redor: 'circulo_de_amparo', contato: 'purificacao', cone: 'lanca_radiante', proprio: 'bencao' },
};

/** Sem elemento: o tipo de ataque com a forma (o físico corta e atira flecha; o mágico é arcano). */
const FISICO: Readonly<Record<FormaVfx, AssinaturaVisual>> = { projetil: 'flecha', quadrado: 'salto_esmagador', linha: 'investida', ao_redor: 'onda_de_brado', contato: 'golpe', cone: 'contragolpe_arco', proprio: 'postura_de_aparo' };
const MAGICO: Readonly<Record<FormaVfx, AssinaturaVisual>> = { projetil: 'dardo_arcano', quadrado: 'eco_arcano', linha: 'seta_arcana', ao_redor: 'runa_amplificadora', contato: 'telecinese', cone: 'onda_de_repulsao', proprio: 'bencao' };

export function assinaturaDe(h: Habilidade): AssinaturaVisual {
  const v = h.visual;
  if (v?.assinatura) return v.assinatura;
  for (const [re, a] of POR_ID) if (re.test(h.id)) return a;
  const forma = formaVfx(h);
  if (h.formulaCura !== null && h.formulaDano === null) return forma === 'proprio' || forma === 'ao_redor' ? 'circulo_de_amparo' : 'cura';
  if (h.elemento) return POR_ELEMENTO[h.elemento][forma];
  return (h.tipoAtaque === 'magico' ? MAGICO : FISICO)[forma];
}
