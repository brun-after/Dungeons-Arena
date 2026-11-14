// As receitas dos personagens pré-renderizados (marco 32, 31/10/2026, D-131). Cada modelo do jogo junta um corpo
// (o traje da Quaternius com a cabeça do corpo base, ou um personagem inteiro do KayKit), as armas presas nos ossos
// das mãos, as cores (multiplicam o material pelo nome) e as animações de cada estado. Arquivos: `base:` Universal
// Base Characters, `traje:` Modular Character Outfits – Fantasy, `ual1:`/`ual2:` Universal Animation Library 1 e 2,
// `kes:` KayKit Skeletons, `q:` Fantasy Props MegaKit; licenças em src/assets/personagens/LICENCAS.md.

/** Os estados com animação própria na receita. */
export type EstadoBase = 'parado' | 'andar' | 'golpe' | 'conjurar' | 'morte';
/**
 * Marco 32 (31/10/2026, D-131): o golpe e a conjuração em movimento juntam as pernas do andar com o tronco e os braços
 * do estado de base (o mago que ataca andando dá passos em vez de deslizar).
 */
/**
 * Marco 32 (31/10/2026, D-131): o golpe de cada tipo de arma (golpe de `armas.json`), só nas classes (que trocam de
 * arma): o corte da espada, o golpe pesado do montante e do machado, o esmagar da maça e do mangual, o golpe leve do
 * cajado, a estocada da lança e da rapieira, o disparo do arco, o arremesso e o giro. O `golpe` da receita fica para a
 * magia e para quem não tem arma de golpe (o tomo lê a magia).
 */
export type Variante = 'golpeCorte' | 'golpePesado' | 'golpeEsmagar' | 'golpeLeve' | 'golpeEstocada' | 'golpeDisparo' | 'golpeArremesso' | 'golpeGiro';
export type Estado = EstadoBase | 'andarGolpe' | 'andarConjurar' | Variante;

/** A animação de cada golpe de arma (UAL 1 e 2). O giro gira o corpo inteiro numa volta. */
export const VARIANTES: Readonly<Record<Variante, string>> = {
  golpeCorte: 'ual2:Sword_Regular_A',
  golpePesado: 'ual1:Sword_Attack',
  golpeEsmagar: 'ual2:TreeChopping_Loop',
  golpeLeve: 'ual2:Melee_Hook',
  golpeEstocada: 'ual1:Punch_Jab',
  golpeDisparo: 'ual1:Pistol_Shoot',
  golpeArremesso: 'ual2:OverhandThrow',
  golpeGiro: 'ual2:Sword_Regular_A',
};
const NOMES_VARIANTES = Object.keys(VARIANTES) as Variante[];
export const ehVariante = (e: Estado): e is Variante => Object.hasOwn(VARIANTES, e);

/** Quantos quadros cada estado tem (a mesma ordem em todos os atlas). */
export const QUADROS: Readonly<Record<Estado, number>> = {
  parado: 4,
  andar: 8,
  golpe: 6,
  conjurar: 6,
  morte: 6,
  andarGolpe: 6,
  andarConjurar: 6,
  ...(Object.fromEntries(NOMES_VARIANTES.map((v) => [v, 5])) as Record<Variante, number>),
};
const ESTADOS: readonly Estado[] = ['parado', 'andar', 'golpe', 'conjurar', 'morte', 'andarGolpe', 'andarConjurar'];
/** Os estados do atlas da receita: as classes ganham os golpes de cada arma. */
export const estadosDe = (r: Receita): readonly Estado[] => (r.equipamento ? [...ESTADOS, ...NOMES_VARIANTES] : ESTADOS);
/** O estado de base (a animação do tronco) de cada estado; os golpes de arma contam como golpe. */
export const BASE: Readonly<Record<Estado, EstadoBase>> = {
  parado: 'parado',
  andar: 'andar',
  golpe: 'golpe',
  conjurar: 'conjurar',
  morte: 'morte',
  andarGolpe: 'golpe',
  andarConjurar: 'conjurar',
  ...(Object.fromEntries(NOMES_VARIANTES.map((v) => [v, 'golpe'])) as Record<Variante, EstadoBase>),
};
/** As colunas por faixa: o atlas vai em faixas de 8 direções para não passar de 4096 px de largura. */
export const COLUNAS_POR_FAIXA = 21;
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

/**
 * As peças de armadura de uma classe (marco 32, D-131): as malhas do próprio traje (pelo nome e, se houver, pelo
 * material) e as peças a mais do pacote de trajes, religadas ao esqueleto. `esconder`: o que sai da máscara do corpo
 * nessa camada (o cabelo, que atravessaria o capuz posto).
 */
export interface PecaDeTraje {
  malhas?: string;
  material?: string;
  pecas?: string[];
  esconder?: string;
}

export interface Equipamento {
  cabeca: PecaDeTraje;
  corpo: PecaDeTraje;
}

export interface Receita {
  nome: string;
  /** O corpo: o traje (com a cabeça de `cabeca`) ou o personagem inteiro. */
  corpo: string;
  cabeca?: string;
  /** A altura da pessoa em células (o jogador: 1,12). */
  altura: number;
  /** 03/11/2026: centraliza criaturas cujo modelo de origem não tem os pés na origem. */
  apoiarNoChao?: boolean;
  pxCelula?: number;
  /** Largura extra (o orc, o troll): multiplica x e z. */
  largura?: number;
  /** Cor por material (o nome contém a chave): multiplica a cor do material. */
  cores?: Record<string, number>;
  /** Quanto o material brilha sozinho (os olhos do vampiro, a sombra). */
  emissao?: Record<string, number>;
  armas?: Arma[];
  /** Sem esqueleto (o boneco de treino): a mesma pose em todos os quadros. */
  animacoes: Record<EstadoBase, string> | null;
  /** Escala de ossos por nome (a cabeça grande do esqueleto do KayKit encolhe). */
  ossos?: Record<string, number>;
  exposicao?: number;
  /** Iluminação em faixas usada apenas durante a geração dos atlas. */
  manga?: boolean;
  /**
   * 04/11/2026 (marco 37): luz realista (PBR com mapa de ambiente e recorte quente e frio) no lugar da luz em faixas,
   * e a armadura do kit sombrio (armaduras-sombrias.ts).
   */
  sombrio?: boolean;
  semCapuz?: boolean;
  adornosCabeca?: string[];
  /** O quadro (em células, em volta dos pés) quando o modelo é maior que o padrão. */
  quadro?: { largura: number; altura: number; baixo: number };
  /** Armadura fixa no corpo (a sentinela): o grau do elmo e do peito, com a cor de destaque. */
  armadura?: { cabeca: number; corpo: number; acento: number };
  /** Asas translúcidas nas costas (a fada), na cor dada. */
  asas?: number;
  /** As classes: o corpo sai sem armas (vão na mão, medida em cada quadro) e cada peça de armadura vira camadas por grau. */
  equipamento?: Equipamento;
}

const DO_RANGER: Equipamento = {
  cabeca: { malhas: 'Hood' },
  corpo: { malhas: '_Body|Pauldron|Bracer|_Arms', material: 'MI_Ranger' },
};
const DO_CAMPONES: Equipamento = {
  cabeca: { pecas: ['traje:Modular Parts/Male_Ranger_Head_Hood'], esconder: 'Hair' },
  corpo: { malhas: '_Body|_Arms', material: 'MI_Peasant' },
};

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
    manga: true,
    sombrio: true,
    semCapuz: true,
    adornosCabeca: ['cabelo:Hair_SimpleParted', 'cabelo:Hair_Beard'],
    corpo: RANGER_M,
    cabeca: CABECA_M,
    altura: 1.14,
    // 04/11/2026 (marco 37): o traje de baixo em vinho escuro e gasto, não o vermelho vivo do mangá.
    cores: { Ranger: 0x7a4a3e, Hair: 0x5e3a22 },
    animacoes: ESPADA,
    equipamento: DO_RANGER,
  },
  {
    nome: 'mago',
    manga: true,
    adornosCabeca: ['cabelo:Hair_SimpleParted'],
    corpo: CAMPONES_M,
    cabeca: CABECA_M,
    altura: 1.12,
    sombrio: true,
    // 04/11/2026 (marco 37): as cores sóbrias do estilo sombrio (a lã azul-cinza do feiticeiro).
    cores: { Peasant: 0x4a5470, Hair: 0x1a1c24 },
    exposicao: 2.1,
    animacoes: MAGIA,
    equipamento: DO_CAMPONES,
  },
  {
    nome: 'arqueiro',
    manga: true,
    semCapuz: true,
    adornosCabeca: ['cabelo:Hair_Long'],
    corpo: RANGER_F,
    cabeca: CABECA_F,
    altura: 1.08,
    sombrio: true,
    cores: { Ranger: 0x5a6644, Hair: 0x5a3424 },
    animacoes: MAGIA,
    equipamento: DO_RANGER,
  },
  {
    nome: 'necromante',
    manga: true,
    corpo: RANGER_M,
    cabeca: CABECA_M,
    altura: 1.14,
    sombrio: true,
    cores: { Ranger: 0x3e3446, Superhero: 0xc4c0c8, Regular: 0xc4c0c8, Hair: 0x9c96a4 },
    exposicao: 1.8,
    animacoes: MAGIA,
    equipamento: DO_RANGER,
  },
  {
    nome: 'aventureiro',
    manga: true,
    adornosCabeca: ['traje:Modular Parts/Male_Ranger_Head_Hood'],
    corpo: CAMPONES_M,
    cabeca: CABECA_M,
    altura: 1.12,
    sombrio: true,
    cores: { Peasant: 0x7a6c4e, Ranger: 0x666a46, Hair: 0x3e2a18 },
    exposicao: 1.8,
    animacoes: HUMANO,
    equipamento: DO_CAMPONES,
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
  // A sentinela: o guarda de armadura (elmo com crista, peitoral e ombreiras), escudo e espada.
  {
    nome: 'sentinela',
    corpo: RANGER_M,
    cabeca: CABECA_M,
    altura: 1.16,
    largura: 1.1,
    cores: { Ranger: 0x8a96a0, Hair: 0x2a2a2a },
    exposicao: 1.7,
    armadura: { cabeca: 3, corpo: 3, acento: 0x5dade2 },
    armas: [
      { m: 'kes:assets/gltf/Skeleton_Blade.gltf', osso: 'hand_r', tamanho: 0.5, giro: [0, 0, 90], cor: 0xd0d8e0 },
      { m: 'kes:assets/gltf/Skeleton_Shield_Large_A.gltf', osso: 'hand_l', tamanho: 0.55, giro: [0, 90, 0], cor: 0x6d7d8e },
    ],
    animacoes: ESPADA,
  },
  // A fada: pequena, de vestido verde-água e asas translúcidas (flutua no jogo).
  {
    nome: 'fada',
    corpo: 'traje:Outfits/Female_Peasant',
    cabeca: CABECA_F,
    altura: 0.62,
    cores: { Peasant: 0xa8f4e4, Superhero: 0xfff0e8, Regular: 0xfff0e8, Hair: 0xf8e090 },
    emissao: { Eye: 0.6 },
    exposicao: 2.6,
    asas: 0xd6eaf8,
    animacoes: MAGIA,
  },
  // Os bichos: geometria feita na ferramenta (criaturas3d.ts, feras3d.ts), animada por rotação e deformação.
  { nome: 'lobo', corpo: 'proc:lobo', altura: 0.78, animacoes: null, exposicao: 1.3, quadro: { largura: 1.8, altura: 1.6, baixo: 0.5 } },
  // Marco 40 (13/11/2026, D-165): o lobo e o urso do Aventureiro (src/render/vivos/feras-vivas.ts), reserva do 3D em tempo real.
  { nome: 'lobo_companheiro', corpo: 'proc:lobo_companheiro', altura: 0.95, animacoes: null, exposicao: 1.3, quadro: { largura: 2, altura: 1.8, baixo: 0.6 } },
  { nome: 'urso_companheiro', corpo: 'proc:urso_companheiro', altura: 1.2, animacoes: null, exposicao: 1.3, quadro: { largura: 2.4, altura: 2.2, baixo: 0.7 } },
  { nome: 'aranha', corpo: 'proc:aranha', altura: 0.55, animacoes: null, exposicao: 1.8, quadro: { largura: 1.8, altura: 1.4, baixo: 0.5 } },
  { nome: 'falcao', corpo: 'proc:falcao', altura: 0.216, animacoes: null, exposicao: 1.5 },
  // 06/11/2026: o falcão da skin Mágico (tools/sprites/magico3d.ts): a cartola, a cartola virada com a varinha e o pombo.
  { nome: 'cartola', corpo: 'proc:cartola', altura: 0.22, animacoes: null, exposicao: 1.6 },
  { nome: 'cartola_magica', corpo: 'proc:cartola_magica', altura: 0.362, animacoes: null, exposicao: 1.6 },
  { nome: 'pombo', corpo: 'proc:pombo', altura: 0.2, animacoes: null, exposicao: 1.4 },
  // O slime: geometria feita na ferramenta (criaturas3d.ts), animada por deformação.
  { nome: 'slime', corpo: 'proc:slime', altura: 0.62, animacoes: null, exposicao: 1.4 },
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

// 02/11/2026: dragão CC0 de Cethiel/Drummyfish, textura negra e anatomia detalhada.
// A cor elemental vem da energia em volta do corpo, não das escamas.
for (const elemento of ['fogo', 'gelo', 'raio', 'veneno'] as const) {
  RECEITAS.push({ nome: `dragao_${elemento}`, corpo: 'cethiel:dragon.dae', altura: 3.3, pxCelula: 21, apoiarNoChao: true,
    exposicao: 2, cores: { '': 0xd9dbe2 }, quadro: { largura: 9, altura: 7.2, baixo: 2.7 },
    animacoes: { parado: 'cethiel_idle:padrao', andar: 'cethiel_walk:padrao', golpe: 'cethiel_attack:padrao', conjurar: 'cethiel_attack:padrao', morte: 'cethiel_die:padrao' } });
}
