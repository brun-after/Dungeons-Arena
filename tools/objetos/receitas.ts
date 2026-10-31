// As receitas dos objetos pré-renderizados (marco 31, 31/10/2026, D-130). Cada receita junta peças dos pacotes CC0
// (`k:` KayKit Dungeon Remastered, `q:` Quaternius Fantasy Props MegaKit; ver src/assets/objetos/LICENCAS.md), em
// células: x para a direita-baixo da tela, z para a esquerda-baixo, y para cima. A origem é o centro da célula, no chão
// (a âncora dos pés no jogo). `giro` em graus em volta do eixo vertical.

export interface Peca {
  m: string;
  p?: [number, number, number];
  giro?: number;
  escala?: number;
  /** Escala diferente por eixo (x, y, z), por cima de `escala`. */
  estica?: [number, number, number];
  /** Multiplica a cor do material (tingir a pedra, a madeira). */
  cor?: number;
  /** A pose: o nome da animação e o ponto dela (0 a 1). */
  animacao?: { nome: string; t: number };
}

export interface Receita {
  nome: string;
  pecas: Peca[];
  giro?: number;
  exposicao?: number;
  /** Uma luz pontual (vela, brasa) na própria receita. */
  luz?: { cor: number; forca: number; p: [number, number, number] };
}

const VELA = 0xffb060;

export const RECEITAS: Receita[] = [
  { nome: 'bau_fechado', giro: 18, pecas: [{ m: 'q:Chest_Wood', animacao: { nome: 'Chest_Closed', t: 0 } }] },
  { nome: 'bau_aberto', giro: 18, pecas: [{ m: 'q:Chest_Wood', animacao: { nome: 'Chest_Opened', t: 0 } }] },
  {
    nome: 'bau_trancado',
    giro: 18,
    pecas: [
      { m: 'q:Chest_Wood', animacao: { nome: 'Chest_Closed', t: 0 } },
      { m: 'q:Chain_Coil', p: [0, 0.45, 0.05], escala: 0.8 },
    ],
  },
  // O monte de ouro cresce com a quantia (as faixas ficam em balance.json, visual.ouroMontes).
  {
    nome: 'ouro_1',
    pecas: [
      { m: 'k:coin', p: [-0.08, 0, 0.02], escala: 1.1 },
      { m: 'k:coin', p: [0.1, 0, -0.06], escala: 1.1, giro: 40 },
      { m: 'k:coin', p: [0.02, 0.06, 0.08], escala: 1.1, giro: 15 },
    ],
  },
  {
    nome: 'ouro_2',
    pecas: [
      { m: 'k:coin_stack_small', escala: 0.6 },
      { m: 'k:coin', p: [0.26, 0, 0.12], escala: 1.1 },
    ],
  },
  {
    nome: 'ouro_3',
    pecas: [
      { m: 'k:coin_stack_medium', escala: 0.8 },
      { m: 'k:coin_stack_small', p: [0.36, 0, 0.2], escala: 0.45, giro: 60 },
      { m: 'k:coin', p: [-0.32, 0, 0.18], escala: 1.1 },
    ],
  },
  {
    nome: 'ouro_4',
    pecas: [
      { m: 'k:coin_stack_large', escala: 0.75 },
      { m: 'k:coin_stack_medium', p: [0.5, 0, 0.25], escala: 0.55, giro: 30 },
      { m: 'k:coin_stack_small', p: [-0.45, 0, 0.3], escala: 0.5, giro: 80 },
      { m: 'k:coin', p: [0.1, 0, 0.55], escala: 1.1 },
      { m: 'k:coin', p: [-0.15, 0, 0.6], escala: 1.1, giro: 50 },
    ],
  },
  {
    nome: 'santuario_aceso',
    giro: 30,
    luz: { cor: VELA, forca: 3, p: [0, 0.6, 0.5] },
    pecas: [
      { m: 'k:pillar_decorated', escala: 0.32 },
      { m: 'q:Chalice', p: [0, 0.64, 0], escala: 1.2 },
      { m: 'k:candle_thin_lit', p: [-0.32, 0, 0.25], escala: 0.9 },
      { m: 'k:candle_lit', p: [0.3, 0, 0.28], escala: 0.9 },
    ],
  },
  {
    nome: 'santuario_apagado',
    giro: 30,
    exposicao: 0.8,
    pecas: [
      { m: 'k:pillar_decorated', escala: 0.32 },
      { m: 'q:Chalice', p: [0, 0.64, 0], escala: 1.2 },
      { m: 'k:candle_thin', p: [-0.32, 0, 0.25], escala: 0.9 },
      { m: 'k:candle_melted', p: [0.3, 0, 0.28], escala: 0.9 },
    ],
  },
  {
    nome: 'loja',
    giro: 22,
    pecas: [
      { m: 'q:Stall_Empty', escala: 1.25 },
      { m: 'q:FarmCrate_Apple', p: [-1.0, 0, 0.35], giro: 10 },
      { m: 'q:Barrel', p: [1.0, 0, 0.3] },
      { m: 'q:Potion_1', p: [-0.3, 0.62, 0.15], escala: 1.3 },
      { m: 'q:Potion_2', p: [0, 0.62, 0.15], escala: 1.3 },
      { m: 'q:SmallBottles_1', p: [0.32, 0.62, 0.12], escala: 1.3 },
    ],
  },
  { nome: 'barril', pecas: [{ m: 'q:Barrel', escala: 1.25 }] },
  { nome: 'caixote', giro: 20, pecas: [{ m: 'q:Crate_Wooden', escala: 1.05 }] },
  { nome: 'vaso', pecas: [{ m: 'q:Vase_4', escala: 1.2 }] },
  { nome: 'carrinho', giro: 30, pecas: [{ m: 'q:Stall_Cart_Empty', escala: 0.5 }] },
  {
    nome: 'livros',
    pecas: [
      { m: 'q:Book_Stack_1', escala: 2.2, p: [-0.12, 0, 0] },
      { m: 'q:Book_Stack_2', escala: 2.2, p: [0.15, 0, 0.08], giro: 40 },
    ],
  },
  { nome: 'estante', giro: 15, pecas: [{ m: 'q:Bookcase_2', escala: 0.95 }] },
  { nome: 'coluna', pecas: [{ m: 'k:pillar', escala: 0.62 }] },
  { nome: 'vela', luz: { cor: VELA, forca: 2, p: [0, 0.5, 0.3] }, pecas: [{ m: 'k:candle_triple', escala: 1.1 }] },
  // O portal: dois pilares e um lintel de pedra, de frente para a câmera; o vórtice é desenhado no jogo, no vão.
  {
    nome: 'portal',
    giro: 45,
    pecas: [
      { m: 'k:pillar', p: [-0.6, 0, 0], escala: 0.68, estica: [0.6, 1, 0.6] },
      { m: 'k:pillar', p: [0.6, 0, 0], escala: 0.68, estica: [0.6, 1, 0.6] },
      { m: 'k:floor_tile_small', p: [0, 1.36, 0], estica: [1.75, 2.5, 0.55], cor: 0x6e6862 },
    ],
  },
];
