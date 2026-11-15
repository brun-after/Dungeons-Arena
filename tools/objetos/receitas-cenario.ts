// As receitas do cenário do Mundo (marco 43, 15/11/2026, D-177): `npx tsx tools/objetos/render.ts --cenario` grava
// src/assets/cenario/<nome>.webp e o catalogo.json. As rochas e as árvores são procedurais (`p:`, procedurais.ts);
// os objetos da vila juntam peças dos pacotes CC0 (`q:` Quaternius, `k:` KayKit) com as procedurais. Variantes com
// número: o jogo escolhe uma pela célula (render/cenario-iso.ts).

import type { Receita } from './receitas';

const serie = (base: string, modelo: string, n: number, extra: Partial<Receita> = {}): Receita[] =>
  Array.from({ length: n }, (_, i) => ({ nome: `${base}_${i + 1}`, pecas: [{ m: `p:${modelo}:${i * 13 + 5}` }], ...extra }));

export const RECEITAS_CENARIO: Receita[] = [
  // A natureza: rochas e rochedos por bioma.
  ...serie('rocha_cinza', 'rocha_cinza', 4),
  ...serie('rochedo_cinza', 'rochedo_cinza', 3),
  ...serie('rocha_neve', 'rocha_neve', 3),
  ...serie('rochedo_neve', 'rochedo_neve', 2),
  ...serie('rocha_arenito', 'rocha_arenito', 3),
  ...serie('rochedo_arenito', 'rochedo_arenito', 2),
  ...serie('rocha_musgo', 'rocha_musgo', 3),
  // As árvores e o que cresce no chão.
  ...serie('carvalho', 'carvalho', 4),
  ...serie('faia', 'faia', 3),
  ...serie('outono', 'outono', 2),
  ...serie('pinheiro', 'pinheiro', 4),
  ...serie('pinheiro_neve', 'pinheiro_neve', 3),
  ...serie('morta', 'morta', 3),
  ...serie('arbusto', 'arbusto', 3),
  ...serie('arbusto_seco', 'arbusto_seco', 2),
  ...serie('cacto', 'cacto', 2),
  ...serie('juncos', 'juncos', 2),
  ...serie('tora', 'tora', 2),
  { nome: 'toco', pecas: [{ m: 'p:toco:3' }] },
  // A luz: o poste de tocha (o poste, o braço de ferro e a tocha) e a fogueira (o anel de pedras, a lenha e a brasa).
  {
    nome: 'poste_tocha',
    luz: { cor: 0xffa040, forca: 1.5, p: [0, 2.1, 0.3] },
    pecas: [{ m: 'p:poste:1' }, { m: 'p:braseiro:2', p: [0, 1.7, 0] }],
  },
  {
    nome: 'fogueira',
    luz: { cor: 0xff7020, forca: 1.2, p: [0, 0.6, 0.2] },
    pecas: [{ m: 'p:pedras_fogueira:4' }, { m: 'p:brasa:1' }, { m: 'p:lenha_fogueira:7' }],
  },
  {
    nome: 'poste_lanterna',
    luz: { cor: 0xffc070, forca: 2.5, p: [0.3, 1.6, 0.3] },
    pecas: [
      { m: 'p:poste_alto:3' },
      { m: 'p:trave:4', p: [0.14, 1.85, 0] },
      { m: 'q:Lantern_Wall', p: [0.3, 1.2, 0], escala: 1.1, giro: 90 },
    ],
  },
  // A vila: o dia a dia, o depósito, o trabalho e a estrutura.
  {
    nome: 'poco',
    giro: 20,
    pecas: [
      { m: 'p:boca_poco:2' },
      { m: 'p:agua_poco:1' },
      { m: 'p:poste:5', p: [-0.45, 0, 0], estica: [1, 0.72, 1] },
      { m: 'p:poste:6', p: [0.45, 0, 0], estica: [1, 0.72, 1] },
      { m: 'p:telhado_poco:3', p: [0, 1.2, 0] },
      { m: 'q:Bucket_Wooden_1', p: [0.55, 0, 0.42] },
    ],
  },
  { nome: 'pilha_lenha', giro: 30, pecas: [{ m: 'p:pilha_lenha:2' }] },
  { nome: 'feno_1', pecas: [{ m: 'p:feno:3' }] },
  { nome: 'feno_2', giro: 40, pecas: [{ m: 'p:feno:5' }, { m: 'p:feno:6', p: [0.5, 0, 0.35] }, { m: 'p:feno:7', p: [0.25, 0.55, 0.15] }] },
  { nome: 'cerca_1', giro: 45, pecas: [{ m: 'p:cerca:1' }] },
  { nome: 'cerca_2', giro: -15, pecas: [{ m: 'p:cerca:2' }] },
  { nome: 'placa', giro: 30, pecas: [{ m: 'p:placa:1' }] },
  { nome: 'marco_pedra', pecas: [{ m: 'p:marco_pedra:4' }] },
  { nome: 'cocho', giro: 30, pecas: [{ m: 'p:cocho:2' }] },
  { nome: 'barris', giro: 15, pecas: [{ m: 'q:Barrel', escala: 1.15 }, { m: 'q:Barrel', p: [0.55, 0, 0.2], escala: 1.05, giro: 40 }, { m: 'q:Barrel_Apples', p: [0.15, 0, 0.6], escala: 1.05 }] },
  { nome: 'caixotes', giro: 25, pecas: [{ m: 'q:Crate_Wooden' }, { m: 'q:Crate_Wooden', p: [0.62, 0, 0.1], giro: 15 }, { m: 'q:Crate_Wooden', p: [0.3, 0.6, 0.05], giro: 35, escala: 0.9 }] },
  { nome: 'colheita', giro: 10, pecas: [{ m: 'q:FarmCrate_Apple' }, { m: 'q:FarmCrate_Carrot', p: [0.6, 0, 0.2] }, { m: 'q:Bag', p: [0.3, 0, 0.62] }] },
  { nome: 'sacos', giro: 20, pecas: [{ m: 'q:Pouch_Large', escala: 1.4 }, { m: 'q:Bag', p: [0.42, 0, 0.25], escala: 1.3 }] },
  { nome: 'bigorna', giro: 30, pecas: [{ m: 'q:Anvil_Log' }, { m: 'q:Anvil', p: [0, 0.64, 0] }] },
  { nome: 'bancada', giro: 25, pecas: [{ m: 'q:Workbench' }] },
  { nome: 'armas', giro: 25, pecas: [{ m: 'q:WeaponStand' }] },
  { nome: 'boneco', giro: 20, pecas: [{ m: 'q:Dummy' }] },
  { nome: 'banco', giro: 30, pecas: [{ m: 'q:Bench' }] },
  { nome: 'mesa', giro: 20, pecas: [{ m: 'q:Table_Large', escala: 0.8 }, { m: 'q:Stool', p: [0.7, 0, 0.3] }, { m: 'q:Mug', p: [0.1, 0.4, 0.05], escala: 1.4 }] },
  { nome: 'caldeirao', pecas: [{ m: 'q:Cauldron' }] },
  { nome: 'barraca', giro: 22, pecas: [{ m: 'q:Stall_Empty', escala: 1.15 }, { m: 'q:FarmCrate_Apple', p: [-0.3, 0.6, 0.1], escala: 0.7 }, { m: 'q:FarmCrate_Carrot', p: [0.35, 0.6, 0.1], escala: 0.7 }] },
  { nome: 'carroca', giro: 35, pecas: [{ m: 'q:Stall_Cart_Empty', escala: 0.55 }] },
  { nome: 'barril_suporte', giro: 15, pecas: [{ m: 'q:Barrel_Holder' }] },
  { nome: 'escombros_1', pecas: [{ m: 'k:rubble_large', escala: 0.55 }] },
  { nome: 'escombros_2', giro: 50, pecas: [{ m: 'k:rubble_half', escala: 0.55 }] },
  { nome: 'pilar_quebrado', giro: 30, pecas: [{ m: 'k:barrier_colum_half', escala: 0.9 }] },
];
