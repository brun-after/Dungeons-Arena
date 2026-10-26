// Temas de fase (marco 23, 24/10/2026, D-092). Cada tema é dado (src/data/temas.json): a paleta do terreno, a luz, as
// partículas do ar, os enfeites e o pilar das salas grandes, as áreas de terreno, os inimigos (com pesos) e a chance
// de eles nascerem com afinidade elemental. O tema com `elemento` muda as regras da fase (combat/clima.ts).
// As fases geradas sorteiam o tema (save/sequencia.ts); as oficiais trazem o seu no JSON.

import { ELEMENTOS, type Elemento } from '../combat/elementos';
import { Leitor, type Objeto } from '../core/validar';
import { TIPOS_AMBIENTE, type TipoAmbiente } from './ambiente-tipos';
import { TIPOS_DECORACAO, TIPOS_PILAR, type TipoDecoracao, type TipoPilar } from './decoracao';

export const PARTICULAS_CLIMA = ['poeira', 'folhas', 'brilhos', 'bolhas', 'cinzas', 'faiscas', 'areia', 'neve', 'vagalumes', 'esporos', 'sombras'] as const;
export type ParticulaClima = (typeof PARTICULAS_CLIMA)[number];

export interface PaletaTema {
  parede: number;
  paredeTopo: number;
  junta: number;
  piso: readonly [number, number, number];
}

/** Marco 26 (26/10/2026, D-112): a moldura do portal que leva a uma fase do tema. */
export const ESTILOS_PORTAL = ['pedra', 'gelo', 'fogo', 'veneno', 'raio', 'trevas', 'sagrado', 'terra', 'psiquico'] as const;
export type EstiloPortal = (typeof ESTILOS_PORTAL)[number];

export interface Tema {
  id: string;
  nome: string;
  /** O elemento dominante (o clima da fase), ou null nos temas neutros. */
  elemento: Elemento | null;
  paleta: PaletaTema;
  luz: number;
  particulas: ParticulaClima;
  /** Enfeite -> peso; `densidade` é a fração das células de piso enfeitadas. */
  decoracoes: Readonly<Partial<Record<TipoDecoracao, number>>>;
  densidade: number;
  pilar: TipoPilar;
  ambientes: { tipos: readonly TipoAmbiente[]; aCada: number; raioMax: number };
  /** Preset -> peso. */
  inimigos: Readonly<Record<string, number>>;
  elementosInimigos: readonly Elemento[];
  chanceElemental: number;
  /** Marco 26 (D-112): como é o portal que leva a uma fase deste tema. */
  portal: { estilo: EstiloPortal; cor: number };
}

const ehElemento = (v: string): v is Elemento => (ELEMENTOS as readonly string[]).includes(v);

function cor(l: Leitor, o: Objeto, campo: string): number {
  const v = l.texto(o, campo);
  if (!/^#[0-9a-f]{6}$/i.test(v)) l.erro(`${campo} precisa ser #rrggbb ("${v}")`);
  return Number.parseInt(v.slice(1), 16) || 0;
}

function pesos(l: Leitor, o: Objeto, campo: string, validos: ((k: string) => boolean) | null): Record<string, number> {
  const bruto = l.objeto(o[campo], campo);
  const r: Record<string, number> = {};
  for (const [k, v] of Object.entries(bruto)) {
    if (validos && !validos(k)) l.erro(`${campo}: "${k}" desconhecido`);
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) l.erro(`${campo}.${k}: peso positivo`);
    else r[k] = v;
  }
  if (Object.keys(r).length === 0) l.erro(`${campo}: ao menos um`);
  return r;
}

/** Lê e confere temas.json; `presets` (quando passado) confere os inimigos de cada tema. */
export function lerTemas(json: unknown, presets?: ReadonlySet<string>): { temas: Map<string, Tema>; erros: string[] } {
  const raiz = new Leitor('temas.json');
  const lista = raiz.lista(raiz.objeto(json, 'raiz'), 'temas');
  const erros = [...raiz.erros];
  const temas = new Map<string, Tema>();
  for (const item of lista) {
    const id = typeof (item as { id?: unknown }).id === 'string' ? (item as { id: string }).id : '?';
    const l = new Leitor(`temas.json: ${id}`);
    const o = l.objeto(item, 'tema');
    const p = l.objeto(o.paleta, 'paleta');
    const pisos = l.listaDeTextos(p, 'piso');
    const elemento = l.textoOuNulo(o, 'elemento');
    if (elemento !== null && !ehElemento(elemento)) l.erro(`elemento desconhecido "${elemento}"`);
    const a = l.objeto(o.ambientes, 'ambientes');
    const portal = l.objeto(o.portal, 'portal');
    const tiposAmbiente = l.listaDeTextos(a, 'tipos');
    for (const t of tiposAmbiente) if (!(TIPOS_AMBIENTE as readonly string[]).includes(t)) l.erro(`ambiente desconhecido "${t}"`);
    const elementosInimigos = l.listaDeTextos(o, 'elementosInimigos');
    for (const e of elementosInimigos) if (!ehElemento(e)) l.erro(`elementosInimigos: "${e}" desconhecido`);
    if (pisos.length !== 3) l.erro('paleta.piso: três cores');
    const tema: Tema = {
      id: l.texto(o, 'id'),
      nome: l.texto(o, 'nome'),
      elemento: elemento !== null && ehElemento(elemento) ? elemento : null,
      paleta: {
        parede: cor(l, p, 'parede'),
        paredeTopo: cor(l, p, 'paredeTopo'),
        junta: cor(l, p, 'junta'),
        piso: [0, 1, 2].map((i) => cor(l, { c: pisos[i] ?? '' }, 'c')) as unknown as readonly [number, number, number],
      },
      luz: cor(l, o, 'luz'),
      particulas: l.opcao(o, 'particulas', PARTICULAS_CLIMA),
      decoracoes: pesos(l, o, 'decoracoes', (k) => (TIPOS_DECORACAO as readonly string[]).includes(k)),
      densidade: l.numero(o, 'densidade', { min: 0, max: 0.3 }),
      pilar: l.opcao(o, 'pilar', TIPOS_PILAR),
      ambientes: { tipos: tiposAmbiente.filter((t): t is TipoAmbiente => (TIPOS_AMBIENTE as readonly string[]).includes(t)), aCada: l.numero(a, 'aCada', { min: 1, max: 6, inteiro: true }), raioMax: l.numero(a, 'raioMax', { min: 1, max: 3, inteiro: true }) },
      inimigos: pesos(l, o, 'inimigos', presets ? (k) => presets.has(k) : null),
      elementosInimigos: elementosInimigos.filter(ehElemento),
      chanceElemental: l.numero(o, 'chanceElemental', { min: 0, max: 1 }),
      portal: { estilo: l.opcao(portal, 'estilo', ESTILOS_PORTAL), cor: cor(l, portal, 'cor') },
    };
    if (tema.ambientes.tipos.length === 0) l.erro('ambientes.tipos: ao menos um');
    if (tema.chanceElemental > 0 && tema.elementosInimigos.length === 0) l.erro('chanceElemental sem elementosInimigos');
    if (temas.has(tema.id)) l.erro('id repetido');
    erros.push(...l.erros);
    temas.set(tema.id, tema);
  }
  return { temas, erros };
}

/** Sorteio por peso com um número em [0, 1). Ordem estável: a do JSON. */
export function porPeso<T extends string>(pesosDe: Readonly<Partial<Record<T, number>>>, sorteio: number): T | null {
  const entradas = Object.entries(pesosDe) as [T, number][];
  const total = entradas.reduce((s, [, p]) => s + p, 0);
  let alvo = sorteio * total;
  for (const [k, p] of entradas) {
    alvo -= p;
    if (alvo < 0) return k;
  }
  return entradas[entradas.length - 1]?.[0] ?? null;
}
