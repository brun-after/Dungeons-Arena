// Os efeitos da sintonia e das vertentes (marco 24, 24/10/2026, D-095). Cada classe tem um efeito por família das
// gerais de tecla, e cada vertente, os seus; em data/sintonia.json eles são listas de entradas de um vocabulário
// fechado (`t`), com os números ao lado. O código de cada mecânica consulta só o seu tipo, por `efeitosDeSintonia`
// (progression/sintonia.ts), e recebe os números já multiplicados pela força (2 com Domínio) quando a entrada `dobra`.

import { normalizarEfeito } from '../combat/normalizar-efeito';
import { ehTipoEfeito, type EfeitoCanonico, type TipoEfeito } from '../combat/registro-efeitos';
import type { Leitor, Objeto } from '../core/validar';

export const TIPOS_SINTONIA = [
  // Guerreiro
  'furiaPorGeral', 'auraRaio', 'curaGeralNoFrenesi', 'auraAplica', 'grupoContaEstado', 'inamovivel', 'costasAoEncherFuria',
  'auraCuraAliados', 'frenesiPorEstadoPerto', 'desafiadoEnraiza',
  // Arqueiro
  'miraPorGeral', 'tiroCheioMagico', 'miraEscudoProtege', 'tiroCheioRastro', 'tiroCheioEspalhaEstado', 'tiroCheioAplica',
  'miraInvisivel', 'tiroCheioCuraAliados', 'tiroCheioInvisivel', 'tiroCheioRicochete', 'escudoParadoComMira',
  // Necromante
  'mortoAplica', 'mortoCaiSeta', 'curaGeralNosMortos', 'mortoCaiExplode', 'mortoVida', 'mortoEsquiva', 'mortoCaiCura',
  'mortoAterroriza', 'mortoAtira', 'estadoDobraEm', 'retornoDoServo',
  // Aventureiro
  'falcaoGolpeiaComGeral', 'falcaoRepete', 'escudoNoFalcao', 'habilidadeAplica', 'mergulhoEmVolta', 'falcaoInvisivel',
  'habilidadeCuraAliados', 'falcaoGuardiao', 'falcaoRapina',
  // Mago
  'encarnar', 'encarnacaoEstende', 'encarnacaoRenova', 'suporteHerdaEncarnacao', 'duplaFixa', 'encarnacaoDuracao',
  'contaComoElemento', 'lavaReforcada',
] as const;
export type TipoSintonia = (typeof TIPOS_SINTONIA)[number];

/** Uma entrada do vocabulário. Os campos que a mecânica não usa ficam no neutro (0, null, 'sempre'). */
export interface EfeitoSintonia {
  t: TipoSintonia;
  valor: number;
  pct: number;
  ms: number;
  raio: number;
  n: number;
  /** O estado que a mecânica procura ou conta (envenenado, queimando, desafiado). */
  estado: TipoEfeito | null;
  /** O efeito que a mecânica aplica. */
  efeito: EfeitoCanonico | null;
  /** Quando vale: sempre, só no Frenesi, só fora dele, só invisível ou só parado. */
  quando: 'sempre' | 'frenesi' | 'foraDoFrenesi' | 'invisivel' | 'parado';
  /** A habilidade (ou família, ou elemento) a que a mecânica se refere. */
  habilidade: string | null;
  familia: string | null;
  elemento: string | null;
  /** Com Domínio, `valor`, `pct` e o valor do `efeito` dobram. */
  dobra: boolean;
}

const QUANDO = ['sempre', 'frenesi', 'foraDoFrenesi', 'invisivel', 'parado'] as const;

export function lerEfeitosSintonia(l: Leitor, v: unknown, onde: string): EfeitoSintonia[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) {
    l.erro(`${onde}: efeitos precisa ser uma lista`);
    return [];
  }
  return v.map((bruto): EfeitoSintonia => {
    const o: Objeto = l.objeto(bruto, onde);
    const num = (c: string) => (o[c] === undefined ? 0 : l.numero(o, c, { min: 0, max: 100_000 }));
    const txt = (c: string) => (o[c] === undefined ? null : l.texto(o, c));
    const estado = o.estado === undefined ? null : o.estado;
    if (estado !== null && !ehTipoEfeito(estado)) l.erro(`${onde}: estado desconhecido ${JSON.stringify(estado)}`);
    const [efeito] = o.efeito === undefined ? [] : normalizarEfeito(o.efeito, l);
    const conhecidos = new Set(['t', 'valor', 'pct', 'ms', 'raio', 'n', 'estado', 'efeito', 'quando', 'habilidade', 'familia', 'elemento', 'dobra']);
    for (const k of Object.keys(o)) if (!conhecidos.has(k)) l.erro(`${onde}: campo desconhecido "${k}"`);
    return {
      t: l.opcao(o, 't', TIPOS_SINTONIA),
      valor: num('valor'),
      pct: num('pct'),
      ms: num('ms'),
      raio: num('raio'),
      n: num('n'),
      estado: ehTipoEfeito(estado) ? estado : null,
      efeito: efeito ?? null,
      quando: o.quando === undefined ? 'sempre' : l.opcao(o, 'quando', QUANDO),
      habilidade: txt('habilidade'),
      familia: txt('familia'),
      elemento: txt('elemento'),
      dobra: o.dobra === undefined ? false : l.booleano(o, 'dobra'),
    };
  });
}
