// Os chefes em tempo real (04/11/2026, marco 37): cada chefe usa o rig do monstro de origem (o GLB exportado da
// receita) com uma veste fixa no estilo sombrio e a arma dele, para que a luta contra o chefe tenha a mesma presença
// dos jogadores. Os monstros comuns continuam no atlas pré-renderizado; só o arquétipo boss usa a chave `chefe:<preset>`.
// - rei_goblin: coroa de ferro torta com a pedra em brasa, manto de pele, ombros de pelo, colar de dentes e o machado.
// - bruxa_do_pantano: capuz pontudo com o rosto na sombra, trapos verde-lodo rasgados, xale de musgo e o cajado da praga.
// - necromante_ancestral: o kit do necromante no grau 5 com a coroa de osso e a gadanha.
// - boss (o demônio): chifres longos para trás, o coração em brasa no peito, ombreiras de ferro com espinhos, tanga
//   rasgada e manoplas; luta de mãos nuas, como no atlas.

import * as THREE from 'three';
import { aceso, comuns, Corpo, chifre, grupoEm, liso, pano, type Ossos, type PecaSombria } from './sombrio-base';
import { capa, capuz, cinto, coroa, estola, membros, ombreira, pingente, saia } from './pecas-sombrias';
import { KITS_DAS_CLASSES } from './kits-classes';
import { PECAS_DE_ARMADURA } from '../equipamento-3d';

export interface Chefe {
  /** O GLB do rig (src/assets/modelos/<glb>.glb) e a altura em células (antes do aumento de chefe do jogo). */
  glb: string;
  altura: number;
  largura?: number;
  /** O clipe parado e o do golpe (o resto é o do humano). */
  parado: string;
  golpe: string;
  arma: { modelo: string; grau: number } | null;
  veste: (ossos: Ossos) => PecaSombria;
  /** A cor nova dos materiais do rig cujo nome contém a chave (a pele carbonizada, o pano do lodo). */
  tingir?: Readonly<Record<string, number>>;
}

/** Junta várias peças numa só (as extras somadas; o primeiro tecido e os escondidos de todas). */
function juntar(pecas: PecaSombria[]): PecaSombria {
  const esconder = pecas.map((p) => p.esconder).filter(Boolean).join('|');
  return { extras: pecas.flatMap((p) => p.extras), tecido: pecas.find((p) => p.tecido)?.tecido, esconder: esconder || undefined };
}

function reiGoblin(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  coroa(c, k.ferro, 7, 0.06, extras, 0.19, 0.125, aceso(0xff8a3a, 1.6));
  ombreira(c, 'l', 'pele', liso(0x3a2c20, 1), null, extras);
  ombreira(c, 'r', 'pele', liso(0x3a2c20, 1), null, extras);
  extras.push(...cinto(c, k.couroNegro, k.ferro, 3, k.couro));
  pingente(c, k.couro, liso(0xd8cfb4, 0.6), extras, 1.6);
  extras.push(...capa(c, 5, {
    panos: [pano('#3a2a1e', 201, { rasgo: 0.8 }), pano('#3a2a1e', 201, { rasgo: 0.8 }), pano('#2e2218', 203, { rasgo: 0.72 })],
    forro: pano('#5a1a14', 205, { rasgo: 0.72 }), fecho: k.ferro, gola: { tipo: 'pele', m: liso(0x3a2c20, 1) }, comprimentos: [0.5, 0.7, 0.85],
  }));
  extras.push(...membros(c, 'maos', 3, { leve: k.couro, placa: k.ferro, junta: k.ferro, luva: [k.couro, k.ferro], borda: k.latao }));
  return { extras, tecido: pano('#4a3a28', 207, { tachas: true, aspereza: 0.8 }), esconder: 'Hair' };
}

function bruxa(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const lodo = pano('#2a3024', 211, { aspereza: 0.95 });
  capuz(c, pano('#22281e', 213), 1, true, extras, liso(0x050605, 1));
  extras.push(...saia(c, 0.74, pano('#262c20', 217, { rasgo: 0.6 }), 1.3, false));
  estola(c, pano('#3a4a2a', 219, { rasgo: 0.7 }), 0.55, extras);
  extras.push(...cinto(c, k.couroNegro, k.ferro, 3, liso(0x4a5a3a, 0.9)));
  pingente(c, k.ferro, aceso(0x9ad26a, 1.4), extras, 1.3);
  extras.push(...capa(c, 4, {
    panos: [lodo, lodo, pano('#1c2218', 221, { rasgo: 0.62 })], forro: pano('#33402a', 223, { rasgo: 0.6 }), fecho: k.ferro,
    gola: null, comprimentos: [0.6, 0.9, 1.3],
  }));
  return { extras, tecido: lodo, esconder: 'Hood|Hair' };
}

function necromanteAncestral(ossos: Ossos): PecaSombria {
  const kit = KITS_DAS_CLASSES.necromante;
  if (!kit) return { extras: [] };
  const pecas = PECAS_DE_ARMADURA.map((p) => kit(ossos, p, 5));
  const c = new Corpo(ossos);
  const extras: THREE.Object3D[] = [];
  coroa(c, liso(0xcfc6b0, 0.7), 9, 0.07, extras, 0.2, 0.128, aceso(0x9fd8ff, 2.4));
  return juntar([...pecas, { extras }]);
}

function demonio(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const corno = liso(0x8a7a62, 0.6);
  // os chifres longos, curvando para trás e para fora
  const cab = grupoEm(c, c.p('Head'));
  for (const sx of [-1, 1]) {
    // o caminho do chifre sobe (+y) e curva para +z: virado para trás e aberto para o lado
    const ch = chifre(0.4, 0.045, 1.5, corno, 12);
    ch.position.set(sx * 0.075, 0.16, 0.03);
    ch.rotation.set(-0.35, Math.PI + sx * 0.55, sx * 0.45);
    cab.add(ch);
  }
  c.prender('Head', cab, extras);
  // o coração em brasa no peito, com as rachaduras acesas
  const peito = grupoEm(c, c.p('spine_02'));
  const brasa = aceso(0xff7a2a, 2.6);
  const coracao = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), brasa);
  coracao.scale.set(1, 1.3, 0.6);
  coracao.position.set(0, 0.14, 0.2);
  peito.add(coracao);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const fio = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.07 + (i % 2) * 0.04, 0.004), brasa);
    fio.position.set(Math.cos(a) * 0.06, 0.14 + Math.sin(a) * 0.07, 0.19);
    fio.rotation.z = a + Math.PI / 2;
    peito.add(fio);
  }
  c.prender('spine_02', peito, extras);
  ombreira(c, 'l', 'osso', k.ferro, null, extras, 2);
  ombreira(c, 'r', 'osso', k.ferro, null, extras, 2);
  ombreira(c, 'l', 'placa', k.ferro, k.latao, extras, 2);
  ombreira(c, 'r', 'placa', k.ferro, k.latao, extras, 2);
  extras.push(...saia(c, 0.42, pano('#1a1214', 227, { rasgo: 0.62 }), 1, false));
  extras.push(...cinto(c, k.couroNegro, k.ferro, 0));
  extras.push(...membros(c, 'maos', 5, { leve: k.couroNegro, placa: k.ferro, junta: k.ferro, luva: [k.ferro, k.ferro], borda: brasa }));
  extras.push(...membros(c, 'pes', 4, { leve: k.couroNegro, placa: k.ferro, junta: k.ferro, luva: [k.ferro, k.ferro], borda: k.ferro }));
  return { extras };
}

/** Os chefes humanoides com modelo em tempo real, pelo preset (inimigos.json). */
export const CHEFES: Readonly<Record<string, Chefe>> = {
  rei_goblin: { glb: 'goblin', altura: 0.95, parado: 'Sword_Idle', golpe: 'Sword_Attack', arma: { modelo: 'machado', grau: 3 }, veste: reiGoblin },
  bruxa_do_pantano: {
    glb: 'cultista', altura: 1.12, parado: 'Idle_Loop', golpe: 'Spell_Simple_Shoot', arma: { modelo: 'praga', grau: 4 }, veste: bruxa,
    tingir: { Ranger: 0x3a4030, Superhero: 0x9aa08a, Regular: 0x9aa08a },
  },
  necromante_ancestral: { glb: 'necromante', altura: 1.2, parado: 'Idle_Loop', golpe: 'Spell_Simple_Shoot', arma: { modelo: 'gadanha', grau: 5 }, veste: necromanteAncestral },
  boss: {
    glb: 'demonio', altura: 1.4, largura: 1.15, parado: 'Sword_Idle', golpe: 'Punch_Cross', arma: null, veste: demonio,
    // a pele carbonizada (não o vermelho vivo do atlas): a brasa fica no peito e nas manoplas
    tingir: { Superhero: 0x2a1c1c, Regular: 0x2a1c1c },
  },
};
