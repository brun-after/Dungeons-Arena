// Fórmulas de dados multigrupo (§2.7, passo 4): "2d6+1d8+3", com dados negativos ("1d8-1d4").
// A rolagem usa o PRNG do estado, então é determinística por semente.

import { inteiro, type EstadoRng } from '../core/rng';

export interface TermoDeFormula {
  sinal: 1 | -1;
  quantidade: number;
  /** 0 = constante (o valor está em `quantidade`). */
  faces: number;
}

const MAX_DADOS = 100;
const MAX_FACES = 1000;

/** Interpreta a fórmula; devolve null se o texto não for uma fórmula válida. */
export function interpretarFormula(texto: string): TermoDeFormula[] | null {
  const limpo = texto.replace(/\s+/g, '').toLowerCase();
  if (limpo === '') return null;
  const termos: TermoDeFormula[] = [];
  const padrao = /([+-]?)(\d+)(?:d(\d+))?/y;
  let posicao = 0;
  while (posicao < limpo.length) {
    padrao.lastIndex = posicao;
    const m = padrao.exec(limpo);
    if (!m) return null;
    // Só o primeiro termo pode vir sem sinal.
    if (m[1] === '' && termos.length > 0) return null;
    const quantidade = Number(m[2]);
    const faces = m[3] === undefined ? 0 : Number(m[3]);
    if (faces > 0 && (quantidade < 1 || quantidade > MAX_DADOS || faces > MAX_FACES)) return null;
    termos.push({ sinal: m[1] === '-' ? -1 : 1, quantidade, faces });
    posicao = padrao.lastIndex;
  }
  return termos;
}

export function formulaValida(texto: string): boolean {
  return interpretarFormula(texto) !== null;
}

export interface Rolagem {
  total: number;
  /** Cada dado rolado, já com sinal, para o feedback visual. */
  dados: number[];
}

export function rolar(rng: EstadoRng, formula: string): Rolagem {
  const termos = interpretarFormula(formula);
  if (!termos) throw new Error(`fórmula inválida: ${formula}`);
  const dados: number[] = [];
  let total = 0;
  for (const t of termos) {
    if (t.faces === 0) {
      total += t.sinal * t.quantidade;
      continue;
    }
    for (let i = 0; i < t.quantidade; i++) {
      const valor = t.sinal * inteiro(rng, 1, t.faces);
      dados.push(valor);
      total += valor;
    }
  }
  return { total, dados };
}

/** Faixa possível de uma fórmula, útil para testes e para a interface. */
export function faixaDaFormula(formula: string): { min: number; max: number } {
  const termos = interpretarFormula(formula);
  if (!termos) throw new Error(`fórmula inválida: ${formula}`);
  let min = 0;
  let max = 0;
  for (const t of termos) {
    // Cada dado vale no mínimo 1; constante vale ela mesma nas duas pontas.
    const baixo = t.quantidade;
    const alto = t.faces === 0 ? t.quantidade : t.quantidade * t.faces;
    if (t.sinal > 0) {
      min += baixo;
      max += alto;
    } else {
      min -= alto;
      max -= baixo;
    }
  }
  return { min, max };
}
