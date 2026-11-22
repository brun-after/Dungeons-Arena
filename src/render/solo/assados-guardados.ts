// Os blocos de chão já assados, guardados entre as cenas (marco 41, 14/11/2026, D-169). Assar um bloco (render/solo/)
// custa caro; a troca de região montava a cena nova e assava de novo todo o chão à vista, e a tela travava. Agora o
// canvas assado fica aqui, compartilhado por quem o usa (a cena daqui, o pedaço da vizinha além da borda e, depois da
// troca, a cena de lá), e os que ninguém usa saem do mais antigo para o mais novo.
// A chave leva a fase, o bloco, o tema do chão e as células do bloco com a borda que a mistura olha (o mesmo id com
// outro conteúdo não reaproveita o chão errado). A resolução não entra: o sprite estica o canvas ao tamanho do bloco, e
// a cena com a qualidade reduzida (a da região de antes) não obriga a de agora a assar tudo de novo.

import type { Fase } from '../../world/fase';
import type { ImagemAssada } from './assador-remoto';

/** Quantos blocos ficam guardados sem uso (≈0,6 a 1,3 MB cada, pela resolução da qualidade). */
const SEM_USO_MAX = 24;
/** A borda de células que a mistura do chão olha em volta do bloco (render/solo/mascaras.ts). */
const BORDA = 2;

interface Guardado {
  canvas: ImagemAssada;
  usos: number;
}

/** Solta a memória da imagem (22/11/2026, D-202: a do trabalhador é um ImageBitmap, que se fecha). */
function apagar(imagem: ImagemAssada): void {
  if ('close' in imagem) imagem.close();
  else imagem.width = imagem.height = 0;
}

const guardados = new Map<string, Guardado>();

export function chaveDoAssado(fase: Fase, bx: number, by: number, fimX: number, fimY: number, tema: string): string {
  let h = 2166136261;
  for (let y = by - BORDA; y < fimY + BORDA; y++) for (let x = bx - BORDA; x < fimX + BORDA; x++) {
    const dentro = x >= 0 && y >= 0 && x < fase.largura && y < fase.altura;
    h = Math.imul(h ^ (dentro ? (fase.celulas[y * fase.largura + x] ?? 255) : 255), 16777619);
  }
  return `${fase.id}|${bx},${by}|${tema}|${(h >>> 0).toString(36)}`;
}

function enxugar(): void {
  let semUso = 0;
  for (const g of guardados.values()) if (g.usos === 0) semUso++;
  for (const [chave, g] of guardados) {
    if (semUso <= SEM_USO_MAX) break;
    if (g.usos > 0) continue;
    apagar(g.canvas);
    guardados.delete(chave);
    semUso--;
  }
}

/** Há um canvas guardado com esta chave? */
export function temAssado(chave: string): boolean {
  return guardados.has(chave);
}

/** O canvas guardado (passa a contar um uso a mais), ou null. */
export function pegarAssado(chave: string): ImagemAssada | null {
  const g = guardados.get(chave);
  if (!g) return null;
  g.usos++;
  // O mais novo vai para o fim (os mais antigos saem primeiro).
  guardados.delete(chave);
  guardados.set(chave, g);
  return g.canvas;
}

/** Guarda um canvas recém-assado, já com um uso. */
export function guardarAssado(chave: string, canvas: ImagemAssada): void {
  const antes = guardados.get(chave);
  if (antes && antes.canvas !== canvas && antes.usos === 0) apagar(antes.canvas);
  guardados.set(chave, { canvas, usos: (antes?.canvas === canvas ? antes.usos : 0) + 1 });
  enxugar();
}

/** Quem usava o canvas o soltou. */
export function soltarAssado(chave: string): void {
  const g = guardados.get(chave);
  if (!g) return;
  g.usos = Math.max(0, g.usos - 1);
  enxugar();
}
