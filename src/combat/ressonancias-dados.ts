// D-173 (14/11/2026): as 30 ressonâncias (Códex do Combate). Cada uma junta um eixo de estilo e um elemento da sintonia;
// os dados ficam em data/ressonancias.json. Só a leitura (o disparo fica em ressonancias.ts). Puro.

import { Leitor } from '../core/validar';
import { EIXOS, type Eixo } from './eixos';
import { normalizarEfeito } from './normalizar-efeito';
import type { EfeitoCanonico } from './registro-efeitos';

export const PONTAS = ['fogo', 'gelo', 'raio', 'veneno', 'terra', 'trevas', 'sagrado', 'psiquico', 'fisico'] as const;
export type PontaDaRessonancia = (typeof PONTAS)[number];

export interface Ressonancia {
  /** `eixo_elemento`. */
  id: string;
  eixo: Eixo;
  elemento: PontaDaRessonancia;
  nome: string;
  texto: string;
  /** O efeito na faixa 10 (em `alvo`, `conjurador` ou `aliados`). */
  efeito: EfeitoCanonico;
  /** Com raio, o efeito no alvo pega também nos hostis em volta dele. */
  raio: number;
}

export const idDaRessonancia = (eixo: Eixo, elemento: string): string => `${eixo}_${elemento}`;

export function lerRessonancias(json: unknown): { ressonancias: Map<string, Ressonancia>; erros: string[] } {
  const l = new Leitor('ressonancias.json');
  const raiz = l.objeto(json, 'raiz');
  const saida = new Map<string, Ressonancia>();
  for (const bruto of l.lista(raiz, 'ressonancias')) {
    const o = l.objeto(bruto, 'ressonância');
    const eixo = l.opcao(o, 'eixo', EIXOS);
    const elemento = l.opcao(o, 'elemento', PONTAS);
    const id = idDaRessonancia(eixo, elemento);
    if (o.id !== id) l.erro(`ressonância "${String(o.id)}": o id precisa ser "${id}"`);
    if (saida.has(id)) l.erro(`ressonância "${id}" repetida`);
    const [efeito] = normalizarEfeito(o.efeito, l);
    if (!efeito) continue;
    saida.set(id, { id, eixo, elemento, nome: l.texto(o, 'nome'), texto: l.texto(o, 'texto'), efeito, raio: o.raio === undefined ? 0 : l.numero(o, 'raio', { min: 0, max: 4, inteiro: true }) });
  }
  return { ressonancias: saida, erros: l.erros };
}
