// Habilidades (§2.8). Habilidade nova é registro novo em src/data/skills.json, não cirurgia:
// a lógica lê só estes campos e nunca depende do tempo de uma animação do cliente (§2.7).
// Marco 12 (14/10/2026): `visual` descreve a aparência como dado (D-055/D-056). É só apresentação: a
// simulação nunca o lê, e o jogo funciona igual sem ele.

import { ehObjeto, Leitor } from '../core/validar';
import { formulaValida } from './dados';
import { normalizarEfeitos } from './normalizar-efeito';
import type { EfeitoCanonico } from './registro-efeitos';

export type TipoAtaque = 'fisico' | 'magico';
export type TipoArea = 'nenhuma' | 'quadrado';
export type PoliticaAlvo = 'hostil' | 'proprio';
/** Como o impacto é resolvido (§2.7): contato e área consultam a geometria no tick do impacto. */
export type PoliticaImpacto = 'contato' | 'projetil' | 'area' | 'proprio';
export type Interrupcao = 'interrompivel' | 'ininterrupta';

export interface Habilidade {
  id: string;
  nome: string;
  icone: string;
  tipoAtaque: TipoAtaque;
  formulaDano: string | null;
  formulaCura: string | null;
  alcanceCelulas: number;
  tipoArea: TipoArea;
  raioArea: number;
  custoRecurso: number;
  recargaMs: number;
  conjuracaoMs: number;
  politicaAlvo: PoliticaAlvo;
  politicaImpacto: PoliticaImpacto;
  interrupcao: Interrupcao;
  /** Células por segundo; só para `politicaImpacto: 'projetil'`. */
  velocidadeProjetil: number;
  /** Já normalizados (§2.8): uma entrada canônica por componente. */
  efeitos: EfeitoCanonico[];
  /** Marco 12: aparência (só apresentação); null = deduzida dos efeitos (render/visual-habilidade.ts). */
  visual: VisualHabilidade | null;
}

export const PRESETS_VISUAIS = ['faiscas', 'brilho', 'fumaca', 'anel', 'rastro', 'estrelas', 'brasas', 'explosao', 'raio'] as const;
export type PresetVisual = (typeof PRESETS_VISUAIS)[number];

/** Aparência de uma habilidade (§2.16, D-055): presets de partícula por momento da ação. */
export interface VisualHabilidade {
  cor: string | null;
  conjuracao: PresetVisual | null;
  viagem: PresetVisual | null;
  impacto: PresetVisual | null;
  camera: 'nenhum' | 'leve' | 'forte';
  /** Id do som (audio/mapeamento.ts); validado lá, pois o catálogo de sons é da apresentação. */
  som: string | null;
}

function lerVisual(l: Leitor, v: unknown): VisualHabilidade | null {
  if (v === undefined || v === null) return null;
  const o = l.objeto(v, 'visual');
  const preset = (campo: string): PresetVisual | null => (o[campo] === undefined ? null : l.opcao(o, campo, PRESETS_VISUAIS));
  const cor = o.cor === undefined ? null : l.texto(o, 'cor');
  if (cor !== null && !/^#[0-9a-f]{6}$/i.test(cor)) l.erro(`visual.cor precisa ser #rrggbb ("${cor}")`);
  for (const k of Object.keys(o)) {
    if (!['cor', 'conjuracao', 'viagem', 'impacto', 'camera', 'som'].includes(k)) l.erro(`visual: campo desconhecido "${k}"`);
  }
  return {
    cor,
    conjuracao: preset('conjuracao'),
    viagem: preset('viagem'),
    impacto: preset('impacto'),
    camera: o.camera === undefined ? 'nenhum' : l.opcao(o, 'camera', ['nenhum', 'leve', 'forte'] as const),
    som: o.som === undefined ? null : l.texto(o, 'som'),
  };
}

export type Catalogo<T> = ReadonlyMap<string, T>;

export function lerHabilidades(json: unknown): { habilidades: Map<string, Habilidade>; erros: string[] } {
  const habilidades = new Map<string, Habilidade>();
  const raiz = new Leitor('skills.json');
  const lista = raiz.lista(raiz.objeto(json, 'raiz'), 'habilidades');
  const erros = [...raiz.erros];

  for (const item of lista) {
    const id = ehObjeto(item) && typeof item.id === 'string' ? item.id : '?';
    const l = new Leitor(`habilidade ${id}`);
    const o = l.objeto(item, 'habilidade');
    const h: Habilidade = {
      id: l.texto(o, 'id'),
      nome: l.texto(o, 'nome'),
      icone: l.texto(o, 'icone'),
      tipoAtaque: l.opcao(o, 'tipoAtaque', ['fisico', 'magico'] as const),
      formulaDano: l.textoOuNulo(o, 'formulaDano'),
      formulaCura: l.textoOuNulo(o, 'formulaCura'),
      alcanceCelulas: l.numero(o, 'alcanceCelulas', { min: 0, max: 30, inteiro: true }),
      tipoArea: l.opcao(o, 'tipoArea', ['nenhuma', 'quadrado'] as const),
      raioArea: l.numero(o, 'raioArea', { min: 0, max: 5, inteiro: true }),
      custoRecurso: l.numero(o, 'custoRecurso', { min: 0, inteiro: true }),
      recargaMs: l.numero(o, 'recargaMs', { min: 0 }),
      conjuracaoMs: l.numero(o, 'conjuracaoMs', { min: 0 }),
      politicaAlvo: l.opcao(o, 'politicaAlvo', ['hostil', 'proprio'] as const),
      politicaImpacto: l.opcao(o, 'politicaImpacto', ['contato', 'projetil', 'area', 'proprio'] as const),
      interrupcao: l.opcao(o, 'interrupcao', ['interrompivel', 'ininterrupta'] as const),
      velocidadeProjetil: l.numero(o, 'velocidadeProjetil', { min: 0, max: 60 }),
      efeitos: normalizarEfeitos(l.lista(o, 'efeitos'), l),
      visual: lerVisual(l, o.visual),
    };
    if (h.formulaDano !== null && !formulaValida(h.formulaDano)) l.erro(`fórmula de dano inválida: ${h.formulaDano}`);
    if (h.formulaCura !== null && !formulaValida(h.formulaCura)) l.erro(`fórmula de cura inválida: ${h.formulaCura}`);
    if (h.politicaImpacto === 'projetil' && h.velocidadeProjetil <= 0) l.erro('projétil precisa de velocidade');
    if (h.politicaImpacto === 'area' && h.tipoArea === 'nenhuma') l.erro('impacto em área precisa de tipoArea');
    if ((h.politicaAlvo === 'proprio') !== (h.politicaImpacto === 'proprio')) {
      l.erro('politicaAlvo e politicaImpacto "proprio" andam juntos');
    }
    if (habilidades.has(h.id)) l.erro('id repetido');
    erros.push(...l.erros);
    habilidades.set(h.id, h);
  }
  return { habilidades, erros };
}
