// Marco 24 (24/10/2026, D-094): as ultimates. Cada classe tem 28, uma por par das 8 skills exclusivas; a do par das
// teclas 1 e 2 é a que o jogador usa, liberada pelo medidor de carga (carga-ultimate.ts). As definições são
// habilidades comuns (data/ultimates.json, etiqueta `ultimate`); as etapas (`<id>_N`) são internas, lançadas por fases.

import { Leitor } from '../core/validar';
import { lerHabilidades, type DefinicaoHabilidade } from './habilidades';

export interface Ultimate {
  id: string;
  classe: string;
  /** As duas skills exclusivas que formam o par (em qualquer ordem na barra). */
  par: readonly [string, string];
  /** O que a ultimate faz, na língua do jogo (o texto do Grimório). */
  texto: string;
}

export function lerUltimates(json: unknown): { ultimates: Map<string, Ultimate>; definicoes: Map<string, DefinicaoHabilidade>; erros: string[] } {
  const l = new Leitor('ultimates.json');
  const raiz = l.objeto(json, 'raiz');
  const ultimates = new Map<string, Ultimate>();
  for (const bruto of l.lista(raiz, 'ultimates')) {
    const o = l.objeto(bruto, 'ultimate');
    const id = l.texto(o, 'id');
    const par = l.listaDeTextos(o, 'par');
    if (par.length !== 2 || par[0] === par[1]) l.erro(`${id}: o par precisa de duas skills diferentes`);
    if (ultimates.has(id)) l.erro(`ultimate "${id}" repetida`);
    ultimates.set(id, { id, classe: l.texto(o, 'classe'), par: [par[0] ?? '', par[1] ?? ''], texto: l.texto(o, 'texto') });
  }
  const h = lerHabilidades({ versao: raiz.versao, habilidades: raiz.habilidades });
  for (const u of ultimates.values()) {
    const def = h.definicoes.get(u.id);
    if (!def) l.erro(`${u.id}: sem definição em "habilidades"`);
    else if (!def.base.tags.includes('ultimate')) l.erro(`${u.id}: a definição precisa da etiqueta "ultimate"`);
  }
  return { ultimates, definicoes: h.definicoes, erros: [...l.erros, ...h.erros.map((e) => `ultimates.json: ${e}`)] };
}

/** A ultimate de um par, em qualquer ordem (null se o par não tem). */
export function ultimateDoPar(ultimates: ReadonlyMap<string, Ultimate>, a: string, b: string): Ultimate | null {
  for (const u of ultimates.values()) if ((u.par[0] === a && u.par[1] === b) || (u.par[0] === b && u.par[1] === a)) return u;
  return null;
}
