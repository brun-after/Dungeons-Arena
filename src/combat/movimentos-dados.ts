// Marco 40 (D-164): os dados das mecânicas de movimento (data/movimentos.json): os tipos, os números e o leitor.
// D-188 (19/11/2026): separado de movimento-classe.ts (o limite de linhas por arquivo). Puro.

import { Leitor } from '../core/validar';

export const TIPOS_MOVIMENTO = ['voo', 'tirolesa', 'salto', 'marcha', 'nevoa', 'montaria', 'posto', 'avanco', 'teleporte', 'recuo', 'ancora', 'acelerar', 'troca', 'camuflagem', 'troca_pet', 'chamado', 'arremesso', 'disparada', 'contencao'] as const;
export type TipoMovimento = (typeof TIPOS_MOVIMENTO)[number];

/** Os números de uma mecânica (os marcos sobrescrevem a partir do nível deles). */
export interface ParametrosMovimento {
  /** As células no nível 1. */
  alcance: number;
  /** Quantas células o alcance ganha a cada 10 níveis (arredondado para baixo). */
  crescimento: number;
  velocidade: number;
  recargaMs: number;
  cargas: number;
  duracaoMs: number;
  lentidaoPct: number;
  /** O Posto dos Mortos: quantos postos, a cura do servo parado (% da vida por s), o escudo ao trocar e a reunião. */
  postos: number;
  curaPctPorS: number;
  escudo: number;
  reuniao: number;
  /** D-168: o raio e a velocidade do círculo do Acelerar; o eco do Piscar; a armadilha do recuo; o marco elemental. */
  raio: number;
  velocidadePct: number;
  eco: number;
  armadilha: number;
  elemental: number;
}

export interface MovimentoDaClasse {
  id: string;
  nivel: number;
  tipo: TipoMovimento;
  icone: string;
  cor: string;
  pesada: boolean;
  /**
   * Marco 40 (14/11/2026): o companheiro dono da mecânica (o Aventureiro). Na classe com companheiros, o movimento ativo
   * é sempre o do companheiro ativo (o falcão carrega, o lobo e o urso são a montaria) e o G não troca.
   */
  pet: string | null;
  /** D-168: vai ao ponto mirado (o cursor; no celular, o toque depois do botão). */
  mira: boolean;
  /**
   * D-172: o movimento principal da classe (o mais usado, de recarga menor): fica no Shift e no primeiro botão e não
   * recarrega mais devagar em combate. Os de companheiro (o Aventureiro) contam todos como principal.
   */
  principal: boolean;
  base: ParametrosMovimento;
  marcos: ReadonlyMap<number, Partial<ParametrosMovimento>>;
}

const CAMPOS: readonly (keyof ParametrosMovimento)[] = ['alcance', 'crescimento', 'velocidade', 'recargaMs', 'cargas', 'duracaoMs', 'lentidaoPct', 'postos', 'curaPctPorS', 'escudo', 'reuniao', 'raio', 'velocidadePct', 'eco', 'armadilha', 'elemental'];

export function lerMovimentos(json: unknown): { movimentos: Map<string, MovimentoDaClasse[]>; erros: string[] } {
  const l = new Leitor('movimentos.json');
  const saida = new Map<string, MovimentoDaClasse[]>();
  const classes = l.objeto(l.objeto(json, 'raiz').classes, 'classes');
  for (const [classe, lista] of Object.entries(classes)) {
    const itens: MovimentoDaClasse[] = [];
    for (const bruto of Array.isArray(lista) ? lista : []) {
      const o = l.objeto(bruto, `${classe}.movimento`);
      const numeros = (x: Record<string, unknown>): Partial<ParametrosMovimento> => {
        const p: Partial<ParametrosMovimento> = {};
        for (const k of CAMPOS) if (x[k] !== undefined) p[k] = l.numero(x, k, { min: 0, max: 60_000 });
        return p;
      };
      const marcos = new Map<number, Partial<ParametrosMovimento>>();
      for (const [n, m] of Object.entries(l.objeto(o.marcos ?? {}, 'marcos'))) marcos.set(Number(n), numeros(l.objeto(m, `marco ${n}`)));
      itens.push({
        id: l.texto(o, 'id'),
        nivel: l.numero(o, 'nivel', { min: 1, max: 100, inteiro: true }),
        tipo: l.opcao(o, 'tipo', TIPOS_MOVIMENTO),
        icone: l.texto(o, 'icone'),
        cor: l.texto(o, 'cor'),
        pesada: o.pesada === true,
        pet: o.pet === undefined ? null : l.texto(o, 'pet'),
        mira: o.mira === true,
        principal: o.principal === true,
        base: { alcance: 0, crescimento: 0, velocidade: 12, recargaMs: 3000, cargas: 1, duracaoMs: 0, lentidaoPct: 0, postos: 1, curaPctPorS: 0, escudo: 0, reuniao: 0, raio: 0, velocidadePct: 0, eco: 0, armadilha: 0, elemental: 0, ...numeros(o) },
        marcos,
      });
    }
    saida.set(classe, itens);
  }
  return { movimentos: saida, erros: l.erros };
}

