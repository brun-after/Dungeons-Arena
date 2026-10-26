// Decoração das fases com tema (marco 23, 24/10/2026, D-092). Duas partes:
// - pilares: nas salas grandes das fases geradas, o gerador ergue colunas (células de parede soltas no meio da sala,
//   com as 8 vizinhas de piso). Uma parede assim nunca separa a sala: o anel de vizinhas continua ligado. Eles mudam
//   o mapa (cobertura contra projéteis), então entram só nas fases com tema;
// - enfeites: só aparência, sem efeito no jogo. Saem de um hash da célula e do tema (nada no estado nem no save): o
//   mesmo mapa desenha sempre os mesmos enfeites, no cliente e no servidor.

import type { Celula } from '../core/comandos';
import { inteiro, type EstadoRng } from '../core/rng';
import { tipoEm, type Fase } from './fase';
import { porPeso, type Tema } from './temas';

export const TIPOS_DECORACAO = [
  'pedras', 'rachadura', 'musgo', 'ossos', 'teia', 'tocha', 'barril', 'corrente', 'tapete', 'estandarte', 'lapide', 'vela',
  'raiz', 'arbusto', 'runa', 'estante', 'livros', 'trilho', 'carrinho', 'cristal', 'poca', 'grade', 'lodo', 'lava',
  'cinzas', 'brasa', 'areia', 'cacto', 'gelo', 'estalactite', 'neve', 'junco', 'cogumelo', 'flores', 'arvore', 'vitral',
  // Marco 26 (26/10/2026, D-113): mais dois que quebram.
  'caixote', 'vaso',
] as const;
export type TipoDecoracao = (typeof TIPOS_DECORACAO)[number];

export const TIPOS_PILAR = [
  'coluna', 'lapide', 'estante', 'escora', 'estalagmite', 'cacto', 'cristal', 'pinheiro', 'para_raios', 'bobina',
  'arvore_morta', 'cogumelo_gigante', 'arvore', 'obelisco',
] as const;
export type TipoPilar = (typeof TIPOS_PILAR)[number];

/** Enfeites que pedem parede atrás (encostados na parede de cima). */
const DE_PAREDE: ReadonlySet<TipoDecoracao> = new Set(['tocha', 'estandarte', 'estante', 'vitral', 'corrente', 'estalactite', 'teia']);

/**
 * Marco 26 (25/10/2026, D-109): os enfeites que ficam em pé no isométrico (os demais são do chão: pedras, tapete,
 * poça…). A teia fica no chão: é o canto da parede, sem volume.
 */
const EM_PE: ReadonlySet<TipoDecoracao> = new Set([
  'tocha', 'barril', 'estandarte', 'lapide', 'vela', 'arbusto', 'arvore', 'estante', 'livros', 'carrinho', 'cristal',
  'cacto', 'cogumelo', 'junco', 'vitral', 'corrente', 'estalactite', 'caixote', 'vaso',
]);

export const ehDecoracaoDeParede = (tipo: TipoDecoracao): boolean => DE_PAREDE.has(tipo);
export const ehDecoracaoEmPe = (tipo: TipoDecoracao): boolean => EM_PE.has(tipo);
export const ehTipoDecoracao = (tipo: string): tipo is TipoDecoracao => (TIPOS_DECORACAO as readonly string[]).includes(tipo);

export interface Decoracao {
  tipo: TipoDecoracao;
  x: number;
  y: number;
  /** 0..1, para o desenho variar (tamanho, giro, cor). */
  variante: number;
}

/** Hash da célula em [0, 1) (avalanche, sem padrão diagonal). */
export function hashCelula(x: number, y: number, sal: number): number {
  let h = Math.imul(x + sal * 31, 0x27d4eb2d) ^ Math.imul(y - sal * 17, 0x165667b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Parede solta no meio do piso (as 8 vizinhas passáveis): o pilar do tema. */
export function ehPilar(fase: Fase, x: number, y: number): boolean {
  if (tipoEm(fase, x, y) !== 'parede') return false;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (dx === 0 && dy === 0) continue;
    const t = tipoEm(fase, x + dx, y + dy);
    if (t !== 'piso' && t !== 'saida') return false;
  }
  return true;
}

/** Os enfeites de uma fase com tema (pura). Sem tema, nenhum. */
export function decoracoesDaFase(fase: Fase, tema: Tema | null): Decoracao[] {
  if (!tema) return [];
  const lista: Decoracao[] = [];
  const ocupadas = new Set(fase.objetos.map((o) => o.y * fase.largura + o.x));
  for (const s of fase.spawns) ocupadas.add(s.y * fase.largura + s.x);
  for (let y = 1; y < fase.altura - 1; y++) for (let x = 1; x < fase.largura - 1; x++) {
    if (tipoEm(fase, x, y) !== 'piso' || ocupadas.has(y * fase.largura + x)) continue;
    if (hashCelula(x, y, 1) >= tema.densidade) continue;
    const tipo = porPeso(tema.decoracoes, hashCelula(x, y, 2));
    if (!tipo) continue;
    // O enfeite de parede só fica onde há parede logo acima; os outros evitam as portas e as passagens estreitas.
    if (DE_PAREDE.has(tipo) !== (tipoEm(fase, x, y - 1) === 'parede')) continue;
    lista.push({ tipo, x, y, variante: hashCelula(x, y, 3) });
  }
  return lista;
}

interface Sala {
  x: number;
  y: number;
  l: number;
  a: number;
}

/**
 * Ergue pilares nas salas de ao menos 7 × 6: em grade de 3 em 3, a 2 células da borda, fora das células ocupadas e
 * só onde as 8 vizinhas ainda são piso livre (então nunca fecham passagem nem tocam outro pilar).
 */
export function erguerPilares(grade: string[][], salas: readonly Sala[], ocupada: (c: Celula) => boolean, rng: EstadoRng): number {
  let erguidos = 0;
  const piso = (x: number, y: number) => grade[y]?.[x] === '.';
  for (const s of salas) {
    if (s.l < 7 || s.a < 6) continue;
    const passo = 3;
    const desvio = inteiro(rng, 0, 1);
    for (let y = s.y + 2; y <= s.y + s.a - 3; y += passo) for (let x = s.x + 2 + desvio; x <= s.x + s.l - 3; x += passo) {
      let livre = true;
      for (let dy = -1; dy <= 1 && livre; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!piso(x + dx, y + dy) || ocupada({ x: x + dx, y: y + dy })) { livre = false; break; }
      }
      const linha = grade[y];
      if (!livre || !linha) continue;
      linha[x] = '#';
      erguidos++;
    }
  }
  return erguidos;
}
