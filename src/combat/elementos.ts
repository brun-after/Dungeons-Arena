// Elementos (D-057, D-059). Marco 14 (14/10/2026). Os 5 temas — fogo, gelo, raio, veneno e psíquico — vivem em
// dados (src/data/elementos.json): cada um traz o estado que aplica, a cor, o visual, o som, os pesos de forma
// do gerador e os fragmentos de nome. As sinergias (interacoes.json) são consultadas aqui, no impacto: o
// elemento que chega sobre um estado do alvo pode removê-lo, somar dano e aplicar efeitos.

import type { ContextoSimulacao } from '../core/contexto';
import { ehObjeto, Leitor } from '../core/validar';
import type { Entidade } from '../entities/entidade';
import { normalizarEfeito } from './normalizar-efeito';
import { PRESETS_VISUAIS, type PresetVisual } from './habilidades';
import type { EfeitoCanonico, TipoEfeito } from './registro-efeitos';

export const ELEMENTOS = ['fogo', 'gelo', 'raio', 'veneno', 'psiquico'] as const;
export type Elemento = (typeof ELEMENTOS)[number];

/** Formas que o gerador sorteia (§D-057): o elemento dá o peso de cada uma. */
export const FORMAS = ['contato', 'projetil', 'quadrado', 'linha', 'cone', 'ao_redor'] as const;
export type Forma = (typeof FORMAS)[number];

export interface DefinicaoElemento {
  id: Elemento;
  /** O estado que o elemento aplica (canônico, com os números de base). */
  estado: EfeitoCanonico;
  cor: string;
  icone: string;
  formas: Readonly<Record<Forma, number>>;
  visual: { conjuracao: PresetVisual | null; viagem: PresetVisual | null; impacto: PresetVisual | null; som: string };
  nomes: { nucleos: readonly string[]; qualidades: readonly string[] };
}

export function ehElemento(v: unknown): v is Elemento {
  return typeof v === 'string' && (ELEMENTOS as readonly string[]).includes(v);
}

export function lerElementos(json: unknown): { elementos: Map<Elemento, DefinicaoElemento>; erros: string[] } {
  const elementos = new Map<Elemento, DefinicaoElemento>();
  const raiz = new Leitor('elementos.json');
  const lista = raiz.lista(raiz.objeto(json, 'raiz'), 'elementos');
  const erros = [...raiz.erros];
  for (const item of lista) {
    const id = ehObjeto(item) && typeof item.id === 'string' ? item.id : '?';
    const l = new Leitor(`elemento ${id}`);
    const o = l.objeto(item, 'elemento');
    const elemento = l.opcao(o, 'id', ELEMENTOS);
    const [estado] = normalizarEfeito(o.estado, l);
    const formasObj = l.objeto(o.formas, 'formas');
    const formas = Object.fromEntries(FORMAS.map((f) => [f, formasObj[f] === undefined ? 0 : l.numero(formasObj, f, { min: 0, max: 100 })])) as Record<Forma, number>;
    const v = l.objeto(o.visual, 'visual');
    const preset = (campo: string): PresetVisual | null => (v[campo] === undefined ? null : l.opcao(v, campo, PRESETS_VISUAIS));
    const n = l.objeto(o.nomes, 'nomes');
    const def: DefinicaoElemento = {
      id: elemento,
      estado: estado ?? { tipo: 'queimando', duracaoMs: 0, valor: 0, pct: 0, em: 'alvo', interno: null, ref: null },
      cor: l.texto(o, 'cor'),
      icone: l.icone(o, 'icone'),
      formas,
      visual: { conjuracao: preset('conjuracao'), viagem: preset('viagem'), impacto: preset('impacto'), som: l.texto(v, 'som') },
      nomes: { nucleos: l.listaDeTextos(n, 'nucleos'), qualidades: l.listaDeTextos(n, 'qualidades') },
    };
    if (!/^#[0-9a-f]{6}$/i.test(def.cor)) l.erro(`cor precisa ser #rrggbb ("${def.cor}")`);
    if (Object.values(formas).every((p) => p <= 0)) l.erro('precisa de ao menos uma forma com peso');
    if (def.nomes.nucleos.length === 0 || def.nomes.qualidades.length === 0) l.erro('precisa de fragmentos de nome');
    if (elementos.has(elemento)) l.erro('id repetido');
    erros.push(...l.erros);
    elementos.set(elemento, def);
  }
  for (const e of ELEMENTOS) if (!elementos.has(e)) erros.push(`elementos.json: falta o elemento "${e}"`);
  return { elementos, erros };
}

/** Resistência do alvo ao elemento, em % (−100 a 100; 100 = imune), pelo preset. */
export function resistenciaPct(ctx: ContextoSimulacao, alvo: Entidade, elemento: Elemento | null): number {
  if (!elemento) return 0;
  return ctx.conteudo.presets.get(alvo.preset)?.resistencias[elemento] ?? 0;
}

export interface Sinergia {
  id: string;
  elemento: Elemento;
  sobre: readonly TipoEfeito[];
  remove: readonly TipoEfeito[];
  danoExtraPct: number;
  aplicar: readonly EfeitoCanonico[];
}

/** As sinergias que o elemento dispara sobre os estados ativos do alvo (o dano extra vale no mesmo golpe). */
export function sinergiasAtivas(alvo: Entidade, elemento: Elemento | null, sinergias: readonly Sinergia[], tick: number): Sinergia[] {
  if (!elemento) return [];
  return sinergias.filter((s) => s.elemento === elemento && alvo.efeitos.some((f) => f.ateTick > tick && s.sobre.includes(f.tipo)));
}

/**
 * Depois de um golpe que acertou: cada sinergia remove o estado que consome e aplica os seus efeitos (pelo
 * `aplicar`, o dispatcher único).
 */
export function dispararSinergias(alvo: Entidade, sinergias: readonly Sinergia[], aplicar: (ef: EfeitoCanonico) => void): void {
  for (const s of sinergias) {
    alvo.efeitos = alvo.efeitos.filter((f) => !s.remove.includes(f.tipo));
    for (const ef of s.aplicar) aplicar(ef);
  }
}
