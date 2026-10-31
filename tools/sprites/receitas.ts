// As receitas dos personagens pré-renderizados (marco 32, 31/10/2026, D-131). Cada modelo do jogo junta um corpo
// (o traje da Quaternius com a cabeça do corpo base, ou um personagem inteiro do KayKit), as armas presas nos ossos
// das mãos, as cores (multiplicam o material pelo nome) e as animações de cada estado. Arquivos: `base:` Universal
// Base Characters, `traje:` Modular Character Outfits – Fantasy, `ual1:`/`ual2:` Universal Animation Library 1 e 2,
// `kes:` KayKit Skeletons, `q:` Fantasy Props MegaKit; licenças em src/assets/personagens/LICENCAS.md.

export type Estado = 'parado' | 'andar' | 'golpe' | 'conjurar' | 'morte';

/** Quantos quadros cada estado tem (a mesma ordem em todos os atlas). */
export const QUADROS: Readonly<Record<Estado, number>> = { parado: 4, andar: 8, golpe: 6, conjurar: 6, morte: 6 };
export const ESTADOS: readonly Estado[] = ['parado', 'andar', 'golpe', 'conjurar', 'morte'];
/** As direções na grade: 0 = +x (direita-baixo na tela), girando para +y (esquerda-baixo), de 45° em 45°. */
export const DIRECOES = 8;

export interface Arma {
  m: string;
  /** O osso (`hand_r`, `hand_l` na Quaternius; `handslot.r`, `handslot.l` no KayKit). */
  osso: string;
  p?: [number, number, number];
  /** Giro em graus (x, y, z) no espaço do osso. */
  giro?: [number, number, number];
  /** Tamanho em células (a escala do arquivo é ajustada para a maior medida dar isso). */
  tamanho: number;
  cor?: number;
}

export interface Receita {
  nome: string;
  /** O corpo: o traje (com a cabeça de `cabeca`) ou o personagem inteiro. */
  corpo: string;
  cabeca?: string;
  /** A altura da pessoa em células (o jogador: 1,12). */
  altura: number;
  /** Largura extra (o orc, o troll): multiplica x e z. */
  largura?: number;
  /** Cor por material (o nome contém a chave): multiplica a cor do material. */
  cores?: Record<string, number>;
  /** Quanto o material brilha sozinho (os olhos do vampiro, a sombra). */
  emissao?: Record<string, number>;
  armas?: Arma[];
  /** Sem esqueleto (o boneco de treino): a mesma pose em todos os quadros. */
  animacoes: Record<Estado, string> | null;
  /** Escala de ossos por nome (a cabeça grande do esqueleto do KayKit encolhe). */
  ossos?: Record<string, number>;
  exposicao?: number;
  /** O quadro (em células, em volta dos pés) quando o modelo é maior que o padrão. */
  quadro?: { largura: number; altura: number; baixo: number };
}

const HUMANO = { parado: 'ual1:Idle_Loop', andar: 'ual1:Walk_Loop', golpe: 'ual1:Sword_Attack', conjurar: 'ual1:Spell_Simple_Shoot', morte: 'ual1:Death01' } as const;
const ESPADA = { ...HUMANO, parado: 'ual1:Sword_Idle' } as const;
const MAGIA = { ...HUMANO, golpe: 'ual1:Spell_Simple_Shoot' } as const;
const ZUMBI = { ...HUMANO, parado: 'ual2:Zombie_Idle_Loop', andar: 'ual2:Zombie_Walk_Fwd_Loop', golpe: 'ual2:Zombie_Scratch' } as const;
const ESQUELETO = { parado: 'kes:General:Idle_B', andar: 'kes:Movement:Walking_C', golpe: 'kes:General:Throw', conjurar: 'kes:General:Use_Item', morte: 'kes:General:Death_A' } as const;

const RANGER_M = 'traje:Outfits/Male_Ranger';
const RANGER_F = 'traje:Outfits/Female_Ranger';
const CAMPONES_M = 'traje:Outfits/Male_Peasant';
const CABECA_M = 'base:Superhero_Male_FullBody';
const CABECA_F = 'base:Superhero_Female_FullBody';

export const RECEITAS: Receita[] = [
  {
    nome: 'guerreiro',
    corpo: RANGER_M,
    cabeca: CABECA_M,
    altura: 1.14,
    cores: { Ranger: 0xc8ccd2, Hair: 0x3a2a1e },
    armas: [
      { m: 'kes:assets/gltf/Skeleton_Axe.gltf', osso: 'hand_r', tamanho: 0.62, giro: [0, 0, 90] },
      { m: 'kes:assets/gltf/Skeleton_Shield_Small_A.gltf', osso: 'hand_l', tamanho: 0.48, giro: [0, 90, 0], cor: 0x8a6a4a },
    ],
    animacoes: ESPADA,
  },
  {
    nome: 'mago',
    corpo: CAMPONES_M,
    cabeca: CABECA_M,
    altura: 1.12,
    cores: { Peasant: 0x7a90e0, Hair: 0xb8b0a0 },
    exposicao: 2.1,
    armas: [{ m: 'q:Book_5', osso: 'hand_l', tamanho: 0.22, giro: [0, 0, 0] }],
    animacoes: MAGIA,
  },
  {
    nome: 'arqueiro',
    corpo: RANGER_F,
    cabeca: CABECA_F,
    altura: 1.08,
    cores: { Ranger: 0x7d9a6a, Hair: 0x5a3a22 },
    armas: [{ m: 'kes:assets/gltf/Skeleton_Crossbow.gltf', osso: 'hand_r', tamanho: 0.5, giro: [0, 0, 90] }],
    animacoes: MAGIA,
  },
  {
    nome: 'necromante',
    corpo: RANGER_M,
    cabeca: CABECA_M,
    altura: 1.14,
    cores: { Ranger: 0x8a70a8, Superhero: 0xc8d4c8, Regular: 0xc8d4c8, Hair: 0x1a1a1a },
    exposicao: 1.8,
    armas: [{ m: 'kes:assets/gltf/Skeleton_Staff.gltf', osso: 'hand_r', tamanho: 1.0, giro: [0, 0, 90] }],
    animacoes: MAGIA,
  },
  {
    nome: 'aventureiro',
    corpo: CAMPONES_M,
    cabeca: CABECA_M,
    altura: 1.12,
    cores: { Peasant: 0xa0b4d8, Hair: 0x6a4a2a },
    exposicao: 1.8,
    armas: [{ m: 'kes:assets/gltf/Skeleton_Blade.gltf', osso: 'hand_r', tamanho: 0.45, giro: [0, 0, 90] }],
    animacoes: HUMANO,
  },
  // O vendedor da loja (parado e conversando; a loja usa só a direção de frente para a câmera).
  {
    nome: 'vendedor',
    corpo: CAMPONES_M,
    cabeca: CABECA_M,
    altura: 1.1,
    cores: { Peasant: 0xd8b878, Hair: 0x5a3a22 },
    exposicao: 1.8,
    animacoes: { ...HUMANO, parado: 'ual1:Idle_Talking_Loop' },
  },
  // O boneco de treino (o único que usa `generico`) e o espantalho: o boneco da Quaternius, parado.
  { nome: 'generico', corpo: 'q:Dummy', altura: 1.1, animacoes: null },
  { nome: 'espantalho', corpo: 'q:Dummy', altura: 1.1, cores: { '': 0xd8c080 }, animacoes: null },
  {
    nome: 'goblin',
    corpo: CAMPONES_M,
    cabeca: CABECA_M,
    altura: 0.82,
    cores: { Peasant: 0x9a8058, Superhero: 0x8fb070, Regular: 0x8fb070, Hair: 0x2a2a1a },
    exposicao: 1.8,
    armas: [{ m: 'kes:assets/gltf/Skeleton_Blade.gltf', osso: 'hand_r', tamanho: 0.38, giro: [0, 0, 90] }],
    animacoes: ESPADA,
  },
  {
    nome: 'orc',
    corpo: CAMPONES_M,
    cabeca: CABECA_M,
    altura: 1.28,
    largura: 1.25,
    cores: { Peasant: 0x8a6a4a, Superhero: 0x7f9a68, Regular: 0x7f9a68, Hair: 0x1a1a1a },
    exposicao: 1.8,
    armas: [{ m: 'kes:assets/gltf/Skeleton_Axe.gltf', osso: 'hand_r', tamanho: 0.75, giro: [0, 0, 90] }],
    animacoes: ESPADA,
    quadro: { largura: 1.7, altura: 1.9, baixo: 0.4 },
  },
  {
    nome: 'troll',
    corpo: CAMPONES_M,
    cabeca: CABECA_M,
    altura: 1.5,
    largura: 1.4,
    cores: { Peasant: 0x7a7a6a, Superhero: 0x8a9aaa, Regular: 0x8a9aaa, Hair: 0x2a2a2a },
    exposicao: 1.8,
    armas: [{ m: 'kes:assets/gltf/Skeleton_Axe.gltf', osso: 'hand_r', tamanho: 0.9, giro: [0, 0, 90], cor: 0x6a5a4a }],
    animacoes: ESPADA,
    quadro: { largura: 1.85, altura: 2.2, baixo: 0.45 },
  },
  {
    nome: 'vampiro',
    corpo: RANGER_M,
    cabeca: CABECA_M,
    altura: 1.16,
    cores: { Ranger: 0x8a3a52, Superhero: 0xf0e8ec, Regular: 0xf0e8ec, Hair: 0x101010 },
    emissao: { Eye: 2 },
    exposicao: 1.8,
    animacoes: ZUMBI,
  },
  {
    nome: 'cultista',
    corpo: RANGER_M,
    cabeca: CABECA_M,
    altura: 1.12,
    cores: { Ranger: 0xd05040, Hair: 0x1a1a1a },
    exposicao: 1.9,
    armas: [{ m: 'kes:assets/gltf/Skeleton_Blade.gltf', osso: 'hand_r', tamanho: 0.38, giro: [0, 0, 90] }],
    animacoes: MAGIA,
  },
  {
    nome: 'sombra',
    corpo: RANGER_F,
    cabeca: CABECA_F,
    altura: 1.12,
    cores: { Ranger: 0x5a4a72, Superhero: 0x8a80a0, Regular: 0x8a80a0, Hair: 0x0a0a0a },
    emissao: { Eye: 2 },
    exposicao: 1.8,
    animacoes: ZUMBI,
  },
  {
    nome: 'demonio',
    corpo: CABECA_M,
    altura: 1.4,
    largura: 1.15,
    cores: { Superhero: 0xa83a2a, Hair: 0x1a0a0a },
    emissao: { Eye: 1.5 },
    animacoes: { ...ESPADA, golpe: 'ual1:Punch_Cross' },
    quadro: { largura: 1.8, altura: 2.1, baixo: 0.4 },
  },
  {
    nome: 'esqueleto',
    corpo: 'kes:characters/gltf/Skeleton_Minion.glb',
    altura: 1.1,
    ossos: { head: 0.62 },
    armas: [{ m: 'kes:assets/gltf/Skeleton_Blade.gltf', osso: 'handslot.r', tamanho: 0.45 }],
    animacoes: ESQUELETO,
  },
];
