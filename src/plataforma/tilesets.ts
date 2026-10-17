// Tilesets do jogador no store `tilesets` (§3.5, §3.10). Marco 11A (16/10/2026), D-066: a imagem do atlas (Blob,
// PNG/JPEG/WebP até 2 MB e 2048 px), a grade (4 ou 5), a separação entre células e os vínculos chave -> célula. Fica
// só neste aparelho; a arena não recebe atlas.

import { RE_CHAVE_PECA, type CelulaAtlas, type GradeAtlas, type Vinculos } from '../world/tileset';
import { apagarDoBanco, gravarNoBanco, lerDoBanco, listarDoBanco } from './banco';

export const TIPOS_DE_IMAGEM = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAX_BYTES_ATLAS = 2 * 1024 * 1024;
export const MAX_LADO_ATLAS = 2048;

export interface RegistroTileset {
  id: string;
  nome: string;
  grade: GradeAtlas;
  separacao: number;
  imagem: Blob;
  vinculos: Vinculos;
  /** Cor média da peça de parede (os prismas do isométrico), `0xRRGGBB`. */
  corParede: number;
  atualizadoEm: number;
}

const RE_CELULA = /^\d,\d$/;

export function lerRegistroTileset(v: unknown): RegistroTileset | null {
  if (typeof v !== 'object' || v === null) return null;
  const r = v as Partial<Record<keyof RegistroTileset, unknown>>;
  if (typeof r.id !== 'string' || typeof r.nome !== 'string' || (r.grade !== 4 && r.grade !== 5)) return null;
  if (typeof r.separacao !== 'number' || r.separacao < 0 || r.separacao > 64 || !(r.imagem instanceof Blob)) return null;
  if (typeof r.vinculos !== 'object' || r.vinculos === null) return null;
  const vinculos: Vinculos = {};
  for (const [k, c] of Object.entries(r.vinculos)) {
    if (RE_CHAVE_PECA.test(k) && typeof c === 'string' && RE_CELULA.test(c)) vinculos[k] = c as CelulaAtlas;
  }
  return {
    id: r.id,
    nome: r.nome,
    grade: r.grade,
    separacao: r.separacao,
    imagem: r.imagem,
    vinculos,
    corParede: typeof r.corParede === 'number' ? r.corParede : 0x4a4458,
    atualizadoEm: typeof r.atualizadoEm === 'number' ? r.atualizadoEm : 0,
  };
}

export async function listarTilesets(): Promise<RegistroTileset[]> {
  const brutos = await listarDoBanco('tilesets');
  return brutos
    .map(lerRegistroTileset)
    .filter((r): r is RegistroTileset => r !== null)
    .sort((a, b) => b.atualizadoEm - a.atualizadoEm);
}

export async function carregarTileset(id: string): Promise<RegistroTileset | null> {
  try {
    return lerRegistroTileset(await lerDoBanco('tilesets', id));
  } catch {
    return null;
  }
}

export async function gravarTileset(t: RegistroTileset): Promise<void> {
  await gravarNoBanco('tilesets', { ...t, vinculos: { ...t.vinculos }, atualizadoEm: Date.now() });
}

export async function apagarTileset(id: string): Promise<void> {
  await apagarDoBanco('tilesets', id);
}

export function novoIdDeTileset(): string {
  return `atlas-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export type ErroImagem = 'tipo' | 'tamanho' | 'dimensoes' | 'leitura';

/** Confere tipo e tamanho do arquivo antes de decodificar. */
export function conferirArquivoDeImagem(arquivo: Blob): ErroImagem | null {
  if (!(TIPOS_DE_IMAGEM as readonly string[]).includes(arquivo.type)) return 'tipo';
  if (arquivo.size > MAX_BYTES_ATLAS) return 'tamanho';
  return null;
}

/** Quadrada com tolerância de 10% e até 2048 px de lado. */
export function dimensoesDeAtlasOk(largura: number, altura: number): boolean {
  if (largura < 16 || altura < 16 || largura > MAX_LADO_ATLAS || altura > MAX_LADO_ATLAS) return false;
  return Math.abs(largura - altura) <= Math.max(largura, altura) * 0.1;
}
