// Presets de inimigo (§2.5) e classes jogáveis, lidos e validados dos JSONs de conteúdo.
// Preset visual (modelo) e arquétipo de IA são campos independentes (§2.6).

import { ehObjeto, Leitor, type Objeto } from '../core/validar';
import { ATRIBUTOS_NEUTROS, type Arquetipo, type Atributos, type ClasseCombate } from './entidade';

const CLASSES: readonly ClasseCombate[] = ['corpo_a_corpo', 'conjurador'];
const ARQUETIPOS: readonly Exclude<Arquetipo, 'jogador'>[] = ['perseguidor', 'atirador', 'controlador', 'boss', 'boneco'];

export interface PresetInimigo {
  id: string;
  nome: string;
  hpBase: number;
  hesitacaoS: number;
  deteccao: number;
  xp: number;
  modelo: string;
  arquetipo: Exclude<Arquetipo, 'jogador'>;
  classe: ClasseCombate;
  defesa: number;
  ataqueBasico: string;
  habilidades: string[];
  intervaloAtaqueMs: number;
}

export interface ClasseJogador {
  id: string;
  nome: string;
  hpBase: number;
  defesa: number;
  classe: ClasseCombate;
  atributos: Atributos;
  ataqueBasico: string;
  habilidades: string[];
  /** Mochila inicial (marco 6): referências ao catálogo de itens. */
  itensIniciais: { id: string; qtd: number }[];
}

function idDe(item: unknown): string {
  return ehObjeto(item) && typeof item.id === 'string' ? item.id : '?';
}

export function lerPresets(json: unknown): { presets: Map<string, PresetInimigo>; erros: string[] } {
  const raiz = new Leitor('inimigos.json');
  const lista = raiz.lista(raiz.objeto(json, 'raiz'), 'presets');
  const erros = [...raiz.erros];
  const presets = new Map<string, PresetInimigo>();
  for (const item of lista) {
    const l = new Leitor(`preset ${idDe(item)}`);
    const o = l.objeto(item, 'preset');
    const p: PresetInimigo = {
      id: l.texto(o, 'id'),
      nome: l.texto(o, 'nome'),
      hpBase: l.numero(o, 'hpBase', { min: 1 }),
      hesitacaoS: l.numero(o, 'hesitacaoS', { min: 0 }),
      deteccao: l.numero(o, 'deteccao', { min: 0, inteiro: true }),
      xp: l.numero(o, 'xp', { min: 0, inteiro: true }),
      modelo: l.texto(o, 'modelo'),
      arquetipo: l.opcao(o, 'arquetipo', ARQUETIPOS),
      classe: l.opcao(o, 'classe', CLASSES),
      defesa: l.numero(o, 'defesa', { min: 0, inteiro: true }),
      ataqueBasico: l.texto(o, 'ataqueBasico'),
      habilidades: l.listaDeTextos(o, 'habilidades'),
      intervaloAtaqueMs: l.numero(o, 'intervaloAtaqueMs', { min: 0 }),
    };
    if (presets.has(p.id)) l.erro('id repetido');
    erros.push(...l.erros);
    presets.set(p.id, p);
  }
  return { presets, erros };
}

function lerAtributos(l: Leitor, o: Objeto): Atributos {
  const a = l.objeto(o.atributos, 'atributos');
  const saida = { ...ATRIBUTOS_NEUTROS };
  for (const chave of Object.keys(ATRIBUTOS_NEUTROS) as (keyof Atributos)[]) {
    saida[chave] = l.numero(a, chave, { min: 1, max: 100, inteiro: true });
  }
  return saida;
}

export function lerClasses(json: unknown): { classes: Map<string, ClasseJogador>; erros: string[] } {
  const raiz = new Leitor('classes.json');
  const lista = raiz.lista(raiz.objeto(json, 'raiz'), 'classes');
  const erros = [...raiz.erros];
  const classes = new Map<string, ClasseJogador>();
  for (const item of lista) {
    const l = new Leitor(`classe ${idDe(item)}`);
    const o = l.objeto(item, 'classe');
    const c: ClasseJogador = {
      id: l.texto(o, 'id'),
      nome: l.texto(o, 'nome'),
      hpBase: l.numero(o, 'hpBase', { min: 1 }),
      defesa: l.numero(o, 'defesa', { min: 0, inteiro: true }),
      classe: l.opcao(o, 'classe', CLASSES),
      atributos: lerAtributos(l, o),
      ataqueBasico: l.texto(o, 'ataqueBasico'),
      habilidades: l.listaDeTextos(o, 'habilidades'),
      itensIniciais: l.lista(o, 'itensIniciais').map((v) => {
        const i = l.objeto(v, 'itensIniciais[]');
        return { id: l.texto(i, 'id'), qtd: l.numero(i, 'qtd', { min: 1, max: 99, inteiro: true }) };
      }),
    };
    if (classes.has(c.id)) l.erro('id repetido');
    erros.push(...l.erros);
    classes.set(c.id, c);
  }
  return { classes, erros };
}
