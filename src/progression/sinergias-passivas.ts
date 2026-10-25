// Sinergias passivas (marco 24, 24/10/2026, D-096): com a passiva geral `passiva` ligada, a `sequencia` de skills ganha
// um efeito. O `tipo` é um vocabulário fechado (o código de cada um fica em combat/sinergias-passivas.ts); os números
// vêm de data/sinergias.json, gerado do Grimório (tools/grimorio/specs/sinergias.mjs).

import { Leitor } from '../core/validar';

export const TIPOS_SINERGIA = ['curaJuntoDaMuralha', 'estadoMaisLongo', 'escudoDoFluxo', 'atordoaEmVolta'] as const;
export type TipoSinergia = (typeof TIPOS_SINERGIA)[number];

export interface SinergiaPassiva {
  id: string;
  nome: string;
  texto: string;
  /** A passiva geral que precisa estar ligada. */
  passiva: string;
  /** As skills, na ordem (a última é a que ganha o efeito). */
  sequencia: readonly string[];
  tipo: TipoSinergia;
  valor: number;
  pct: number;
  ms: number;
  raio: number;
  janelaMs: number;
  estado: string | null;
}

export function lerSinergias(json: unknown): { sinergias: SinergiaPassiva[]; erros: string[] } {
  const l = new Leitor('sinergias.json');
  const o = l.objeto(json, 'raiz');
  const sinergias = l.lista(o, 'sinergias').map((b): SinergiaPassiva => {
    const s = l.objeto(b, 'sinergia');
    const num = (c: string) => (s[c] === undefined ? 0 : l.numero(s, c, { min: 0, max: 60_000 }));
    return {
      id: l.texto(s, 'id'),
      nome: l.texto(s, 'nome'),
      texto: l.texto(s, 'texto'),
      passiva: l.texto(s, 'passiva'),
      sequencia: l.listaDeTextos(s, 'sequencia'),
      tipo: l.opcao(s, 'tipo', TIPOS_SINERGIA),
      valor: num('valor'),
      pct: num('pct'),
      ms: num('ms'),
      raio: num('raio'),
      janelaMs: num('janelaMs'),
      estado: s.estado === undefined ? null : l.texto(s, 'estado'),
    };
  });
  return { sinergias, erros: l.erros };
}
