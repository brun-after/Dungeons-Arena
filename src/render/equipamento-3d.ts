// O equipamento nos personagens pré-renderizados (marco 32, 31/10/2026, D-131). Sem dependências: tools/sprites/ usa
// as mesmas listas para saber o que renderizar.
// - As armas (e o escudo) têm um modelo 3D por desenho (o mesmo de armas.json e dos tokens), em 6 graus: a raridade,
//   ou a forma, se for mais alta. Cada grau é maior e mais enfeitado. O jogo prende a arma na mão medida em cada
//   quadro do personagem (atlas `armas/<desenho>.webp`).
// - O capuz/elmo, o peito e a capa são camadas do tamanho do atlas da classe, uma por grau (`<classe>~<peça>-<grau>`),
//   já recortadas pelo corpo: vão por cima dele.

export const GRAUS = ['comum', 'incomum', 'raro', 'epico', 'lendario', 'ultima'] as const;
export const PECAS_DE_ARMADURA = ['capa', 'corpo', 'cabeca'] as const;
export type PecaDeArmadura = (typeof PECAS_DE_ARMADURA)[number];

/** As formas (D-069) contam como raridade: a épica, a lendária e a última puxam o grau para cima. */
const GRAU_DA_FORMA: Readonly<Record<string, number>> = { epica: 3, lendaria: 4, ultima: 5 };

/** O grau (0 a 5) pela raridade e pela forma, o maior dos dois. */
export function grauDe(raridade: string | null | undefined, forma: string | null | undefined = null): number {
  const r = raridade ? (GRAUS as readonly string[]).indexOf(raridade) : -1;
  const f = forma ? (GRAU_DA_FORMA[forma] ?? -1) : -1;
  return Math.max(0, r, f);
}

/** Os desenhos sem modelo próprio (armas.json `modelo`), como nos tokens. */
const MODELO_DO_DESENHO: Readonly<Record<string, string>> = {
  arco: 'arco_longo',
  arco_simples: 'arco',
  espada_curta: 'espada',
  tomo_aprendiz: 'tomo',
  cajado_aprendiz: 'cajado',
  lamento: 'cetro',
  colheita: 'gadanha',
};

/** O modelo 3D da arma pelo desenho (o desconhecido vira espada, como o ícone genérico). */
export function modeloDaArma3d(desenho: string, existe: (m: string) => boolean): string {
  const m = Object.hasOwn(MODELO_DO_DESENHO, desenho) ? (MODELO_DO_DESENHO[desenho] ?? desenho) : desenho;
  return existe(m) ? m : 'espada';
}

/** Os que ficam em pé na mão (não giram com o pulso): o escudo, os livros. */
export const TOMOS: ReadonlySet<string> = new Set(['tomo', 'codice', 'mares', 'estelar', 'prisma', 'espelhos', 'orbital', 'vazio']);
export const SEM_GIRO: ReadonlySet<string> = new Set(['escudo', ...TOMOS]);

/** O nome do atlas da camada (o mesmo em tools/sprites/ e no catálogo). */
export const nomeDaCamada = (modelo: string, camada: string): string => `${modelo}~${camada}`;
