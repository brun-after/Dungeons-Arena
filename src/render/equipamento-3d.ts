// O equipamento nos personagens pré-renderizados (marco 32, 31/10/2026, D-131). Sem dependências: tools/sprites/ usa
// as mesmas listas para saber o que renderizar.
// - As armas (e o escudo) têm um modelo 3D por desenho (o mesmo de armas.json e dos tokens), em 6 graus: a raridade,
//   ou a forma, se for mais alta. Cada grau é maior e mais enfeitado. O jogo prende a arma na mão medida em cada
//   quadro do personagem (atlas `armas/<desenho>.webp`).
// - O capuz/elmo, o peito e a capa são camadas do tamanho do atlas da classe, uma por grau (`<classe>~<peça>-<grau>`),
//   já recortadas pelo corpo: vão por cima dele.

// Marco 46 (16/11/2026, D-185): os graus e as peças moram no núcleo (progression/graus.ts); daqui só reexportamos.
export { GRAUS, PECAS_DE_ARMADURA, grauDe, grauVisual, pecaDeMembro, type PecaDeArmadura } from '../progression/graus';

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
export const tomoFechado = (modelo: string): string => `${modelo}-fechado`;

/** O nome do atlas da camada (o mesmo em tools/sprites/ e no catálogo). */
export const nomeDaCamada = (modelo: string, camada: string): string => `${modelo}~${camada}`;
