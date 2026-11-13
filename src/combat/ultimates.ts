// Marco 24 (24/10/2026, D-094): as ultimates, liberadas pelo medidor de carga (carga-ultimate.ts). As definições são
// habilidades comuns (data/ultimates.json, etiqueta `ultimate`); as etapas (`<id>_N`) são internas, lançadas por fases.
// Marco 40 (13/11/2026, D-160): as 140 ultimates por par de skills dão lugar a 21 famílias. A família vem dos papéis
// das duas skills do par (teclas 1 e 2), em qualquer ordem; a classe dá o veículo, e os fios de estilo e de elemento
// dão a forma (fios-ultimate.ts). As 36 fusões de eixos (o par dos dois estilos mais fortes) também ficam aqui.

import { Leitor } from '../core/validar';
import { EIXOS, PAPEIS, type Eixo, type Papel } from './eixos';
import { lerHabilidades, type DefinicaoHabilidade } from './habilidades';
import { lerEfeitosGraduais, type EfeitoSecundario } from './papeis';

export interface Ultimate {
  id: string;
  /** A família (o id sem o prefixo `ult_`). */
  familia: string;
  nome: string;
  /** Os papéis das duas skills do par, em ordem do catálogo. */
  papeis: readonly [Papel, Papel];
  /** O que a ultimate faz, na língua do jogo. */
  texto: string;
}

/** Marco 40 (D-160): o que o par dos dois estilos mais fortes junta na ultimate, gradual pela faixa do mais fraco. */
export interface Fusao {
  eixos: readonly [Eixo, Eixo];
  texto: string;
  efeitos: readonly EfeitoSecundario[];
}

/** A chave da fusão: os dois eixos na ordem de EIXOS, juntos por `+`. */
export function chaveDaFusao(a: Eixo, b: Eixo): string {
  return EIXOS.indexOf(a) <= EIXOS.indexOf(b) ? `${a}+${b}` : `${b}+${a}`;
}

/** A chave da família: os dois papéis na ordem de PAPEIS, juntos por `+`. */
export function chaveDosPapeis(a: Papel, b: Papel): string {
  return PAPEIS.indexOf(a) <= PAPEIS.indexOf(b) ? `${a}+${b}` : `${b}+${a}`;
}

export interface UltimatesLidas {
  ultimates: Map<string, Ultimate>;
  fusoes: Map<string, Fusao>;
  definicoes: Map<string, DefinicaoHabilidade>;
  erros: string[];
}

export function lerUltimates(json: unknown): UltimatesLidas {
  const l = new Leitor('ultimates.json');
  const raiz = l.objeto(json, 'raiz');
  const ultimates = new Map<string, Ultimate>();
  const porPapeis = new Set<string>();
  for (const bruto of l.lista(raiz, 'ultimates')) {
    const o = l.objeto(bruto, 'ultimate');
    const id = l.texto(o, 'id');
    const papeis = l.listaDeTextos(o, 'papeis');
    const [a, b] = papeis;
    const ehPapel = (p: string | undefined): p is Papel => (PAPEIS as readonly string[]).includes(p ?? '');
    if (papeis.length !== 2 || !ehPapel(a) || !ehPapel(b)) {
      l.erro(`${id}: "papeis" precisa de dois papéis conhecidos`);
      continue;
    }
    const chave = chaveDosPapeis(a, b);
    if (porPapeis.has(chave)) l.erro(`${id}: a família ${chave} já existe`);
    porPapeis.add(chave);
    if (ultimates.has(id)) l.erro(`ultimate "${id}" repetida`);
    ultimates.set(id, { id, familia: l.texto(o, 'familia'), nome: l.texto(o, 'nome'), papeis: [a, b], texto: l.texto(o, 'texto') });
  }
  const fusoes = new Map<string, Fusao>();
  for (const bruto of raiz.fusoes === undefined ? [] : l.lista(raiz, 'fusoes')) {
    const o = l.objeto(bruto, 'fusao');
    const [a, b] = l.listaDeTextos(o, 'eixos');
    const ehEixo = (e: string | undefined): e is Eixo => (EIXOS as readonly string[]).includes(e ?? '');
    if (!ehEixo(a) || !ehEixo(b) || a === b) {
      l.erro(`fusão ${String(a)}+${String(b)}: precisa de dois eixos diferentes`);
      continue;
    }
    const chave = chaveDaFusao(a, b);
    if (fusoes.has(chave)) l.erro(`fusão ${chave} repetida`);
    fusoes.set(chave, { eixos: [a, b], texto: l.texto(o, 'texto'), efeitos: lerEfeitosGraduais(l, l.lista(o, 'efeitos'), `fusão ${chave}`) });
  }
  const h = lerHabilidades({ versao: raiz.versao, habilidades: raiz.habilidades });
  for (const u of ultimates.values()) {
    const def = h.definicoes.get(u.id);
    if (!def) l.erro(`${u.id}: sem definição em "habilidades"`);
    else if (!def.base.tags.includes('ultimate')) l.erro(`${u.id}: a definição precisa da etiqueta "ultimate"`);
  }
  return { ultimates, fusoes, definicoes: h.definicoes, erros: [...l.erros, ...h.erros.map((e) => `ultimates.json: ${e}`)] };
}

/** A ultimate da família de dois papéis, em qualquer ordem (null se nenhuma família tem o par). */
export function ultimateDosPapeis(ultimates: ReadonlyMap<string, Ultimate>, a: Papel, b: Papel): Ultimate | null {
  const chave = chaveDosPapeis(a, b);
  for (const u of ultimates.values()) if (chaveDosPapeis(u.papeis[0], u.papeis[1]) === chave) return u;
  return null;
}
