// Visual de uma habilidade (§2.16, D-055/D-056). Marco 12 (14/10/2026). Puro: usa o bloco `visual` do
// conteúdo quando existe; senão, deduz da própria habilidade e dos efeitos do registro (físico ->
// faíscas; mágico -> brilho na cor do primeiro efeito; área -> anel e explosão; cura -> brilho verde).
// Assim toda habilidade, inclusive as criadas por quem joga, tem expressão visual.

import type { FormaProjetil, Habilidade, PresetVisual } from '../combat/habilidades';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';

export interface VisualResolvido {
  cor: number;
  conjuracao: PresetVisual | null;
  viagem: PresetVisual | null;
  impacto: PresetVisual | null;
  camera: 'nenhum' | 'leve' | 'forte';
  /** D-067: o corpo do projétil em voo. */
  projetil: FormaProjetil;
}

const COR_FISICO = 0xffd27a;
const COR_MAGICO = 0x9b8cff;
const COR_CURA = 0x2ecc71;

const corDeTexto = (hex: string) => Number.parseInt(hex.slice(1), 16);

export function visualDe(h: Habilidade): VisualResolvido {
  const v = h.visual;
  const curaPropria = h.formulaCura !== null && h.politicaImpacto === 'proprio';
  const corEfeito = h.efeitos[0] ? corDeTexto(REGISTRO_EFEITOS[h.efeitos[0].tipo].cor) : null;
  const corDeduzida = curaPropria ? COR_CURA : (corEfeito ?? (h.tipoAtaque === 'magico' ? COR_MAGICO : COR_FISICO));
  const deduzido: VisualResolvido = {
    cor: corDeduzida,
    conjuracao: h.tipoAtaque === 'magico' || curaPropria ? 'brilho' : null,
    // D-067: o projétil físico é flecha, com esteira fina (não o brilho das magias).
    viagem: h.politicaImpacto === 'projetil' ? (h.tipoAtaque === 'magico' ? 'brilho' : 'esteira') : null,
    impacto: curaPropria ? 'brilho' : h.politicaImpacto === 'area' ? 'explosao' : h.tipoAtaque === 'magico' ? 'brilho' : h.politicaImpacto === 'projetil' ? 'farpas' : 'faiscas',
    camera: h.politicaImpacto === 'area' ? 'leve' : 'nenhum',
    projetil: h.tipoAtaque === 'magico' ? 'orbe' : 'flecha',
  };
  if (!v) return deduzido;
  return {
    cor: v.cor ? corDeTexto(v.cor) : deduzido.cor,
    conjuracao: v.conjuracao ?? deduzido.conjuracao,
    viagem: v.viagem ?? deduzido.viagem,
    impacto: v.impacto ?? deduzido.impacto,
    camera: v.camera,
    projetil: v.projetil ?? deduzido.projetil,
  };
}
