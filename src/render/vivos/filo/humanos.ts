// Marco 45 (16/11/2026, D-182): os humanoides de Filo pelo modelo (o `modelo` de inimigos.json): o traje do rig, a
// altura em células, a largura, as cores do traje e da pele (multiplicam o material pelo nome, como nas receitas), o
// jeito de golpear e a veste. O atlas sai disto (tools/sprites/receitas.ts) e os chefes em tempo real também
// (chefes-vivos.ts).

import type { Ossos, PecaSombria } from './humanos-base';
import * as A from './humanos-a';
import * as B from './humanos-b';
import * as C from './humanos-c';

export type Traje = 'ranger_m' | 'ranger_f' | 'campones_m' | 'campones_f' | 'nu_m';
/** O jeito de golpear: a espada, a magia, o zumbi (garra), o soco, o arco e o arremesso. */
export type Jeito = 'espada' | 'magia' | 'zumbi' | 'soco' | 'arco' | 'arremesso';

export interface HumanoDeFilo {
  traje: Traje;
  altura: number;
  largura?: number;
  /** A pele (o rosto e as mãos), o traje por baixo da veste e o cabelo. */
  pele: number;
  roupa: number;
  emissao?: number;
  jeito: Jeito;
  veste: (ossos: Ossos) => PecaSombria;
  /** O quadro do atlas maior que o padrão (os grandes). */
  quadro?: { largura: number; altura: number; baixo: number };
}

const GRANDE = { largura: 1.9, altura: 2.2, baixo: 0.45 };
const ALTO = { largura: 2.2, altura: 2.5, baixo: 0.5 };
/** 16/11/2026: os de cajado ou lâmina compridos, que saíam pelas bordas do quadro nos golpes. */
const LARGO = { largura: 2.6, altura: 2.5, baixo: 0.5 };
const ENORME = { largura: 2.9, altura: 2.9, baixo: 0.6 };

export const HUMANOS_FILO: Readonly<Record<string, HumanoDeFilo>> = {
  // Ignárea
  fagulheiro: { traje: 'campones_m', altura: 0.82, pele: 0x7a3a22, roupa: 0x5a4434, emissao: 1.2, jeito: 'espada', veste: A.fagulheiro },
  vidraceiro: { traje: 'campones_m', altura: 1.02, largura: 0.85, pele: 0xc8a890, roupa: 0x6a5038, jeito: 'magia', veste: A.vidraceiro },
  fornalheiro: { traje: 'campones_m', altura: 1.32, largura: 1.35, pele: 0x5a3a2a, roupa: 0x3a2a20, jeito: 'espada', veste: A.fornalheiro, quadro: LARGO },
  rei_das_fagulhas: { traje: 'campones_m', altura: 1, largura: 1.1, pele: 0x7a3a22, roupa: 0x4a3a28, emissao: 1.4, jeito: 'espada', veste: A.reiDasFagulhas, quadro: LARGO },
  // Hiemália
  quebra_gelo: { traje: 'campones_m', altura: 1.3, largura: 1.3, pele: 0x8a9aa8, roupa: 0x4a4a52, jeito: 'espada', veste: A.quebraGelo, quadro: LARGO },
  silente: { traje: 'ranger_f', altura: 1.25, largura: 0.85, pele: 0xd0dce6, roupa: 0xc8d4de, jeito: 'magia', veste: A.silente },
  escultor_de_geada: { traje: 'campones_m', altura: 1.08, pele: 0xb8c8d4, roupa: 0x5a6470, jeito: 'espada', veste: A.escultorDeGeada },
  imperatriz_das_estatuas: { traje: 'ranger_f', altura: 1.25, pele: 0xe0e8f0, roupa: 0xdfe8f0, jeito: 'magia', veste: A.imperatrizDasEstatuas, quadro: LARGO },
  // Fulgúria
  saltafaisca: { traje: 'campones_m', altura: 0.75, pele: 0x8a8a5a, roupa: 0x4a4a3a, jeito: 'soco', veste: A.saltafaisca },
  para_raios: { traje: 'ranger_m', altura: 1.3, largura: 1.2, pele: 0x6a5a4a, roupa: 0x3a3430, jeito: 'espada', veste: A.paraRaios, quadro: GRANDE },
  maquinista_voltaico: { traje: 'ranger_m', altura: 1.15, pele: 0xb89a80, roupa: 0x3a2e24, jeito: 'magia', veste: A.maquinistaVoltaico, quadro: LARGO },
  // Putrévia
  bebedor: { traje: 'ranger_m', altura: 1.16, largura: 0.9, pele: 0x8a9a7a, roupa: 0x2a2e22, jeito: 'zumbi', veste: B.bebedor },
  esporeiro: { traje: 'campones_m', altura: 1, pele: 0x9a8a6a, roupa: 0x4a4a30, jeito: 'magia', veste: B.esporeiro },
  // Umbrália
  arqueiro_de_osso: { traje: 'ranger_m', altura: 1.1, largura: 0.9, pele: 0xd8cfb4, roupa: 0x1e1a24, jeito: 'arco', veste: B.arqueiroDeOsso },
  o_apagador: { traje: 'ranger_m', altura: 1.5, pele: 0x1a1820, roupa: 0x100e14, jeito: 'espada', veste: B.oApagador, quadro: ENORME },
  sombra_roubada: { traje: 'ranger_m', altura: 1.12, pele: 0x050407, roupa: 0x050407, jeito: 'zumbi', veste: B.sombraRoubada },
  // Oníria
  riscador: { traje: 'campones_m', altura: 0.95, pele: 0xc8b8a8, roupa: 0x3a2e4a, jeito: 'magia', veste: B.riscador },
  espelhante: { traje: 'ranger_f', altura: 1.05, largura: 0.85, pele: 0xf2eef4, roupa: 0xd8d0e4, jeito: 'magia', veste: B.espelhante },
  marionetista: { traje: 'ranger_m', altura: 1.12, largura: 0.9, pele: 0xe8e0e8, roupa: 0x4a3a5a, jeito: 'magia', veste: B.marionetista },
  bruxa_dos_sonhos: { traje: 'ranger_f', altura: 1.12, pele: 0xb8a8c8, roupa: 0x3a2a50, jeito: 'magia', veste: B.bruxaDosSonhos },
  rei_das_mascaras: { traje: 'ranger_m', altura: 1.2, pele: 0x8a6a7a, roupa: 0x3a1630, jeito: 'espada', veste: B.reiDasMascaras, quadro: LARGO },
  reflexo_do_sonho: { traje: 'ranger_f', altura: 1.1, pele: 0xd79bff, roupa: 0xd79bff, emissao: 1, jeito: 'magia', veste: B.reflexoDoSonho },
  // Lítia
  fundeiro: { traje: 'campones_m', altura: 1, pele: 0x8a7a62, roupa: 0x5a4632, jeito: 'arremesso', veste: C.fundeiro },
  colosso_de_geodo: { traje: 'campones_m', altura: 1.5, largura: 1.4, pele: 0x6a5c4a, roupa: 0x4a4034, jeito: 'soco', veste: C.colossoDeGeodo, quadro: ENORME },
  monarca_de_geodo: { traje: 'ranger_m', altura: 1.3, largura: 1.2, pele: 0x5a4c3a, roupa: 0x3a3028, jeito: 'espada', veste: C.monarcaDeGeodo, quadro: LARGO },
  // Halônia
  pregador: { traje: 'campones_m', altura: 1.1, pele: 0xd8c0a8, roupa: 0xe8e0d0, jeito: 'magia', veste: C.pregador },
  penitente: { traje: 'campones_m', altura: 1.08, pele: 0xb89a80, roupa: 0x5a4a3a, jeito: 'espada', veste: C.penitente },
  guardiao_de_marmore: { traje: 'ranger_m', altura: 1.3, largura: 1.15, pele: 0xe6e0d6, roupa: 0xe6e0d6, jeito: 'espada', veste: C.guardiaoDeMarmore, quadro: ENORME },
  arauto_caido: { traje: 'nu_m', altura: 1.4, largura: 1.15, pele: 0x2a1c1c, roupa: 0x2a1c1c, jeito: 'soco', veste: C.arautoCaido, quadro: ALTO },
  hierofante: { traje: 'campones_m', altura: 1.3, pele: 0xd8c0a8, roupa: 0xe8e0d0, jeito: 'magia', veste: C.hierofante, quadro: ENORME },
  // Zefíria
  velejador: { traje: 'ranger_m', altura: 1.08, pele: 0xc8b8a8, roupa: 0x6a8294, jeito: 'arco', veste: C.velejador, quadro: GRANDE },
  ciclonista: { traje: 'campones_m', altura: 1.05, pele: 0xc8b8a8, roupa: 0xd8e6f0, jeito: 'magia', veste: C.ciclonista },
  almirante_dos_ventos: { traje: 'ranger_m', altura: 1.2, pele: 0xc8a890, roupa: 0x2a3a50, jeito: 'espada', veste: C.almiranteDosVentos, quadro: LARGO },
  harpia_soberana: { traje: 'ranger_f', altura: 1.2, pele: 0xb8a8a0, roupa: 0x5a6a78, jeito: 'magia', veste: C.harpiaSoberana, quadro: ALTO },
};

/** Os clipes da UAL do golpe de cada jeito (o resto é o do humano). */
export const CLIPE_DO_JEITO: Readonly<Record<Jeito, { parado: string; golpe: string }>> = {
  espada: { parado: 'Sword_Idle', golpe: 'Sword_Attack' },
  magia: { parado: 'Idle_Loop', golpe: 'Spell_Simple_Shoot' },
  zumbi: { parado: 'Idle_Loop', golpe: 'Punch_Cross' },
  soco: { parado: 'Sword_Idle', golpe: 'Punch_Cross' },
  arco: { parado: 'Idle_Loop', golpe: 'Pistol_Shoot' },
  arremesso: { parado: 'Idle_Loop', golpe: 'OverhandThrow' },
};
