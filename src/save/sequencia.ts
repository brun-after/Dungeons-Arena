// Sequência da campanha (§2.1 "Transições"). Marco 10A-2 (14/10/2026), D-053. Pura: depois das fases
// oficiais (data/campanha.json), cada saída leva a uma fase gerada nova, com parâmetros sorteados de
// forma determinística pela fase atual: `salas = anterior + rand(0..3)`, `nivelInimigos + 1` e
// `matizGraus + 28`. O save guarda só esses parâmetros; a fase é gerada de novo ao abrir.

import { criarRng, hashTexto, inteiro } from '../core/rng';
import type { RefFase } from './esquema';

export interface RegrasGeradas {
  nome: string;
  salasBase: number;
  salasMax: number;
  nivelBase: number;
  largura: number;
  altura: number;
}

/**
 * A fase seguinte; null quando não há. Marco 11A: a aventura do editor segue pela lista de fases dela
 * (`fasesDaAventura` é quantas tem) e termina na última.
 */
export function proximaFase(
  ref: RefFase,
  fases: readonly string[],
  g: RegrasGeradas,
  nivelMax: number,
  fasesDaAventura = 1,
  estilo: readonly string[] = [],
): RefFase | null {
  if (ref.tipo === 'aventura') {
    const indice = (ref.indice ?? 0) + 1;
    return indice < fasesDaAventura ? { tipo: 'aventura', id: ref.id, indice } : null;
  }
  if (ref.tipo === 'oficial') {
    const indice = fases.indexOf(ref.id);
    const seguinte = indice >= 0 ? fases[indice + 1] : undefined;
    if (seguinte) return { tipo: 'oficial', id: seguinte };
  }
  const anterior = ref.tipo === 'gerada' ? ref : null;
  const rng = criarRng(hashTexto(ref.id));
  const numero = (anterior?.numero ?? 0) + 1;
  const id = `gerada-${numero}`;
  const salas = Math.min(g.salasMax, (anterior?.params.salas ?? g.salasBase) + inteiro(rng, 0, 3));
  return {
    tipo: 'gerada',
    id,
    numero,
    params: {
      id,
      nome: g.nome.replace('{n}', String(numero)),
      semente: hashTexto(id),
      salas,
      nivelInimigos: Math.min(nivelMax, anterior ? anterior.params.nivelInimigos + 1 : g.nivelBase),
      matizGraus: ((anterior?.params.matizGraus ?? 0) + 28) % 360,
      largura: g.largura,
      altura: g.altura,
      // Marco 11A: as regras de estilo do aparelho (opcional), guardadas para a fase sair igual ao reabrir.
      ...(estilo.length > 0 && { estilo: [...estilo] }),
    },
  };
}
