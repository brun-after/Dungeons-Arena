// A matéria de cada liga (D-206, continuação, 26/11/2026). A fusão não só leva a liga por cima: a assinatura do núcleo
// é refeita dela (transmutacao.ts). Para cada liga:
// - a rampa de cor, do escuro ao claro: toda cor da assinatura cai nela pela claridade (o cinza da rocha vira o laranja
//   da lava; o branco do miolo, o amarelo-claro do magma);
// - a matéria que entra no lugar da de cada elemento de origem, por papel (o corpo, o leve, o fumo, a marca): a chama
//   da bola de fogo vira gota de magma; a lasca da terra, brasa; o papel que a liga não troca fica com a textura dele,
//   só recolorido (o espinho de terra continua espinho, feito de lava);
// - o brilho: a liga incandescente (lava, plasma, cristal ígneo, raio divino…) desenha uma passada somada por cima.
// Só desenho.

import type { Transmuta } from './transmutacao';

const t = (cor: number, rampa: readonly number[], materia: Transmuta['materia'], brilho = false): Transmuta => ({ cor, rampa, materia, brilho });

const LAVA = [0x140603, 0x3a0c04, 0x8a1c06, 0xd8400a, 0xff7a14, 0xffb838] as const;

export const MATERIA_DAS_LIGAS: Readonly<Record<string, Transmuta>> = {
  // Fogo
  'Lava': t(0xff6a1a, LAVA, { fogo: { corpo: ['rocha'], leve: ['gota_viva'], fumo: ['fumaca1'] }, terra: { leve: ['brasa'], fumo: ['fumaca1'], marca: ['queimado'] } }, true),
  'Pedra em brasa': t(0xff7a2a, LAVA, { fogo: { corpo: ['rocha'], leve: ['brasa'] }, terra: { leve: ['brasa'], fumo: ['fumaca1'] } }, true),
  'Vapor': t(0xeef6ff, [0x5a6a78, 0xa8c0d0, 0xe0eef8, 0xffffff], { fogo: { corpo: ['fumaca2'], leve: ['gota'], fumo: ['fumaca2'], marca: ['geada'] }, gelo: { corpo: ['fumaca2'], leve: ['gota'] } }),
  'Cristal ígneo': t(0xffa050, [0x5a1a08, 0xb03a10, 0xff8a30, 0xffd48a, 0xffffff], { fogo: { corpo: ['gelo'], leve: ['brasa'] }, gelo: { leve: ['brasa'], fumo: ['fumaca1'] } }, true),
  'Plasma': t(0xffa060, [0x6a2010, 0xff4a20, 0xff9a50, 0xffe0c0, 0xffffff], { fogo: { leve: ['faisca'] }, raio: { leve: ['brasa'], fumo: ['fumaca2'] } }, true),
  'Chama pestilenta': t(0x9ae040, [0x0a2008, 0x1a4010, 0x50c020, 0xb8f040, 0xf0ffc0], { fogo: { leve: ['bolha'], marca: ['poca_veneno'] }, veneno: { corpo: ['chama3'], leve: ['brasa'] } }, true),
  'Chama da mente': t(0xff70d0, [0x200820, 0x401040, 0xc040c0, 0xff8ae0, 0xffe0ff], { fogo: { leve: ['runa1'] }, psiquico: { corpo: ['chama3'], leve: ['brasa'] } }, true),
  'Fogo negro': t(0x8a3ac8, [0x000000, 0x0a0410, 0x2a0a3a, 0x5a2080, 0xc080ff], { fogo: { leve: ['cinza'], fumo: ['fumaca1'] }, trevas: { corpo: ['chama3'], leve: ['brasa'] } }),
  'Fogo solar': t(0xffd040, [0x9a4a10, 0xff9a20, 0xffd040, 0xfff2a0, 0xffffff], { fogo: { leve: ['cintilar'] }, sagrado: { corpo: ['chama3'], leve: ['brasa'] } }, true),
  'Metal fundido': t(0xff8a30, [0x2a1008, 0x402010, 0xff5010, 0xffc060, 0xffffff], { fogo: { corpo: ['estilhaco'], leve: ['gota_viva'] }, fisico: { leve: ['brasa'] } }, true),
  // Gelo
  'Granizo carregado': t(0xc8d0ff, [0x1a1440, 0x2a2060, 0x6a5ac0, 0xa898ff, 0xd8d8ff, 0xffffff], { gelo: { leve: ['faisca'] }, raio: { corpo: ['gelo'], leve: ['cristal'] } }, true),
  'Gelo tóxico': t(0x8af0c0, [0x061a10, 0x0a3020, 0x3aa070, 0x8af0c0, 0xe0fff0], { gelo: { leve: ['bolha'], marca: ['poca_veneno'] }, veneno: { corpo: ['gelo'], leve: ['cristal'] } }),
  'Prisma': t(0xd0c0ff, [0x402060, 0xa060ff, 0x60c0ff, 0xff90e0, 0xffffff], { gelo: { leve: ['runa1'] }, psiquico: { corpo: ['gelo'], leve: ['cristal'] } }, true),
  'Permafrost': t(0xa8c4d8, [0x1a2028, 0x2a3440, 0x5a6a78, 0x9ab8cc, 0xd8f0ff, 0xffffff], { terra: { leve: ['floco'], fumo: ['floco'], marca: ['geada'] }, gelo: { corpo: ['rocha'] } }),
  'Gelo da tumba': t(0x7a80d8, [0x05040c, 0x181028, 0x403868, 0x9098e0, 0xd0d8ff], { gelo: { leve: ['cinza'], fumo: ['fumaca2'] }, trevas: { corpo: ['gelo'], leve: ['floco'] } }),
  'Diamante': t(0xf0f8ff, [0x6a7080, 0xd8f0ff, 0xfff4d0, 0xffffff], { gelo: { leve: ['cintilar'] }, sagrado: { corpo: ['gelo'], leve: ['cristal'] } }, true),
  'Lâmina de gelo': t(0xbfe6ff, [0x1a2a3a, 0x2a4a6a, 0x9fdcff, 0xdff4ff, 0xffffff], { fisico: { corpo: ['gelo'], leve: ['cristal'] }, gelo: { leve: ['faisca'] } }, true),
  // Raio
  'Descarga ácida': t(0xc0ff40, [0x0a1804, 0x1a3008, 0x6aa020, 0xc0ff40, 0xf0ffc0], { raio: { leve: ['gota'] }, veneno: { corpo: ['arco'], leve: ['faisca'] } }, true),
  'Sinapse': t(0xff90f0, [0x200820, 0x401040, 0xa040c0, 0xff90f0, 0xffe0ff], { raio: { leve: ['runa1'] }, psiquico: { corpo: ['arco'], leve: ['faisca'] } }, true),
  'Fulgurito': t(0xd0b8ff, [0x14101e, 0x2a2040, 0x7a6aa8, 0xc0a0ff, 0xe6dcff, 0xffffff], { raio: { leve: ['lasca'] }, terra: { corpo: ['estilhaco'], leve: ['faisca'] } }, true),
  'Relâmpago negro': t(0x6a3aa8, [0x000000, 0x10061a, 0x3a1a5a, 0x8a5ac8, 0xd0b0ff], { raio: { leve: ['cinza'] }, trevas: { corpo: ['arco'], leve: ['faisca'] } }),
  'Raio divino': t(0xffe070, [0x5a4008, 0x8a6010, 0xffc040, 0xffe070, 0xfff4c0, 0xffffff], { raio: { leve: ['cintilar'] }, sagrado: { corpo: ['arco'], leve: ['faisca'] } }, true),
  'Aço carregado': t(0xc8b8ff, [0x1a1828, 0x3a3450, 0x9a8ac0, 0xd8ccff, 0xffffff], { fisico: { leve: ['faisca'] }, raio: { corpo: ['estilhaco'] } }, true),
  // Veneno
  'Alucinógeno': t(0xc0a0ff, [0x2a1040, 0x8a50d0, 0x80ffc0, 0xff80e0, 0xffffff], { veneno: { leve: ['runa1'] }, psiquico: { corpo: ['bolha'], leve: ['gota'] } }, true),
  'Lodo': t(0x7a8a30, [0x0a0a04, 0x1a1a08, 0x3a3a18, 0x6a7a2a, 0xa8b048, 0xd0d880], { veneno: { leve: ['lasca'] }, terra: { corpo: ['gota_viva'], leve: ['bolha'], marca: ['poca_veneno'] } }),
  'Praga': t(0x6a9a3a, [0x050805, 0x1a2a10, 0x3a5a2a, 0x80e060, 0xc0ffa0], { veneno: { leve: ['cinza'] }, trevas: { corpo: ['gota_viva'], leve: ['bolha'] } }),
  'Elixir': t(0xffd860, [0x3a2a08, 0x6a4a10, 0xc8a030, 0xffd860, 0xfff4c0, 0xffffff], { veneno: { leve: ['cintilar'] }, sagrado: { corpo: ['gota_viva'], leve: ['bolha'] } }, true),
  'Lâmina envenenada': t(0x8ad040, [0x0a1808, 0x1a3010, 0x5a9a2a, 0xb0f060, 0xe0ffc0], { fisico: { leve: ['gota'] }, veneno: { corpo: ['estilhaco'] } }),
  // Psíquico
  'Monólito': t(0xc89ac8, [0x140e18, 0x2a2030, 0x6a5a6a, 0xc89ac8, 0xf0c0f0], { terra: { leve: ['runa1'] }, psiquico: { corpo: ['rocha'], leve: ['lasca'] } }),
  'Pesadelo': t(0xb05ad0, [0x05030a, 0x1a0a22, 0x5a2a6a, 0xd050a0, 0xff90d0], { psiquico: { leve: ['cinza'] }, trevas: { corpo: ['olho'], leve: ['runa1'] } }),
  'Epifania': t(0xffd0a0, [0x4a3020, 0x8a6040, 0xffb080, 0xffd870, 0xffffff], { psiquico: { leve: ['cintilar'] }, sagrado: { corpo: ['olho'], leve: ['runa1'] } }, true),
  'Telecinese': t(0xe8a8e0, [0x1a141a, 0x3a2a3a, 0x9a6a9a, 0xf0c0f0, 0xffffff], { fisico: { leve: ['runa1'] }, psiquico: { corpo: ['estilhaco'] } }, true),
  // Terra, trevas e sagrado
  'Obsidiana': t(0x5a3a7a, [0x020104, 0x100810, 0x2a1a38, 0x6a5080, 0xb090e0], { terra: { corpo: ['estilhaco'], leve: ['cinza'] }, trevas: { corpo: ['estilhaco'], leve: ['lasca'] } }),
  'Âmbar': t(0xffb040, [0x2a1404, 0x5a3008, 0xa86010, 0xffb040, 0xffe0a0, 0xffffff], { terra: { corpo: ['gelo'], leve: ['cintilar'] }, sagrado: { corpo: ['gelo'], leve: ['lasca'] } }, true),
  'Cascalho': t(0xb8a080, [0x14100c, 0x2a2420, 0x5a5048, 0x8a7a68, 0xd8d0c0], { fisico: { corpo: ['rocha'], leve: ['lasca'] }, terra: { leve: ['faisca'] } }),
  'Eclipse': t(0xffd070, [0x000000, 0x05030a, 0x3a2a10, 0xffd070, 0xfff4c0], { trevas: { leve: ['cintilar'] }, sagrado: { corpo: ['alma'], leve: ['cinza'] } }),
  'Lâmina sombria': t(0x8a5ac8, [0x05030a, 0x2a1a38, 0x8a5ac8, 0xd0b0ff], { fisico: { leve: ['cinza'], fumo: ['fumaca1'] }, trevas: { corpo: ['estilhaco'] } }),
  'Aço consagrado': t(0xffe08a, [0x4a3a18, 0x8a6a30, 0xffc040, 0xfff0b0, 0xffffff], { fisico: { leve: ['cintilar'] }, sagrado: { corpo: ['estilhaco'] } }, true),
};
