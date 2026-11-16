// Marco 45 (16/11/2026, D-182): as vestes dos humanoides de Lítia, Halônia e Zefíria. Os chefes desta parte: o Monarca
// de Geodo, o Arauto Caído, o Hierofante, o Almirante dos Ventos e a Harpia Soberana.

import * as THREE from 'three';
import { bandoleira, capa, capuz, chapeu, cinto, coroa, estola, golaAlta, mascara, membros, ombreira, pingente, saia } from '../pecas-sombrias';
import { comuns, pano } from '../sombrio-base';
import { asaDePenas, SOTAQUE } from './kit';
import { aceso, armaNaMao, chifres, Corpo, halo, liso, noOsso, olhosAcesos, pontas, type Ossos, type PecaSombria } from './humanos-base';

const geodo = () => aceso(SOTAQUE.litia, 0.9);
const marmore = () => liso(0xe6e0d6, 0.35);

/** O Fundeiro: o pastor de pedra de colete de couro, a funda enrolada no braço, a bolsa de pedras e a pele de
 * rocha rachada; as pedras ficam no chão (no jogo). */
export function fundeiro(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  olhosAcesos(c, SOTAQUE.litia, extras, 1.2);
  mascara(c, 'pano', pano('#5a4a3a', 901), k.fenda, extras);
  bandoleira(c, k.couro, k.latao, extras);
  noOsso(c, 'pelvis', extras, (g) => {
    const bolsa = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), pano('#4a3a28', 903));
    bolsa.position.set(0.15, -0.06, 0.02);
    g.add(bolsa);
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.DodecahedronGeometry(0.022, 0), liso(0x7a6a58, 1));
      p.position.set(0.13 + (i % 2) * 0.03, -0.01, 0.0 + i * 0.012);
      g.add(p);
    }
  });
  noOsso(c, 'hand_r', extras, (g) => {
    const funda = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 4, 14), k.couro);
    funda.position.set(0.02, -0.08, 0);
    const pedra = new THREE.Mesh(new THREE.DodecahedronGeometry(0.03, 0), liso(0x7a6a58, 1));
    pedra.position.set(0.02, -0.13, 0);
    g.add(funda, pedra);
  });
  extras.push(...cinto(c, k.couro, k.latao, 1));
  return { extras, tecido: pano('#5a4632', 905, { aspereza: 0.9 }), esconder: 'Hair' };
}

/** O Colosso de Geodo: o gigante de pele de rocha, o geodo aberto nas costas (os cristais lilases à mostra são o ponto
 * fraco, pelas costas) e os punhos de pedra. */
export function colossoDeGeodo(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const pedra = liso(0x6a5c4a, 1);
  olhosAcesos(c, SOTAQUE.litia, extras, 1.8);
  pontas(c, 'spine_03', geodo(), 8, 0.16, extras, [0, 0.04, -0.15], 1.2);
  for (const l of ['l', 'r'] as const) ombreira(c, l, 'placa', pedra, pedra, extras, 3);
  extras.push(...membros(c, 'maos', 5, { leve: pedra, placa: pedra, junta: pedra, luva: [pedra, pedra], borda: geodo() }));
  extras.push(...membros(c, 'pes', 4, { leve: pedra, placa: pedra, junta: pedra, luva: [pedra, pedra], borda: pedra }));
  extras.push(...cinto(c, k.couroNegro, k.ferro, 0));
  return { extras, tecido: pano('#4a4034', 907, { aspereza: 1 }), esconder: 'Hair' };
}

/** O Monarca de Geodo (governante de Lítia): o rei dentro do geodo (as placas de rocha sobre o corpo e os cristais
 * crescendo da coroa), o manto de pedra e o cetro de cristal. */
export function monarcaDeGeodo(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const pedra = liso(0x5a4c3a, 1);
  coroa(c, pedra, 8, 0.1, extras, 0.2, 0.125, geodo());
  pontas(c, 'Head', geodo(), 7, 0.1, extras, [0, 0.2, -0.02], 0.9);
  pontas(c, 'clavicle_l', geodo(), 3, 0.12, extras, [0, 0.03, 0], 0.6);
  pontas(c, 'clavicle_r', geodo(), 3, 0.12, extras, [0, 0.03, 0], 0.6);
  olhosAcesos(c, SOTAQUE.litia, extras, 2.4);
  for (const l of ['l', 'r'] as const) ombreira(c, l, 'placa', pedra, geodo(), extras, 3);
  extras.push(...capa(c, 5, {
    panos: [pano('#3a3028', 909), pano('#3a3028', 909), pano('#2e2620', 911, { rasgo: 0.4 })], forro: pano('#5a3a7a', 913),
    fecho: k.ouro, gola: { tipo: 'alta', m: pedra }, comprimentos: [0.7, 1, 1.2],
  }));
  extras.push(...membros(c, 'maos', 5, { leve: pedra, placa: pedra, junta: k.ouro, luva: [pedra, pedra], borda: geodo() }));
  armaNaMao(c, 'cetro', 5, 'r', extras);
  return { extras, tecido: pano('#3a3028', 915, { tachas: true }), esconder: 'Hair' };
}

/** O Pregador: o sacerdote de batina branca e estola dourada, o halo pequeno, o livro aberto na mão e a voz que
 * protege os outros (no jogo). */
export function pregador(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  halo(c, SOTAQUE.halonia, extras, false, 0.13);
  estola(c, pano('#c8a04a', 917, { barra: '#fff3c0' }), 0.75, extras);
  golaAlta(c, pano('#f0e8d8', 919), 0.08, extras, k.ouro);
  extras.push(...saia(c, 1, pano('#e8e0d0', 921, { barra: '#c8a04a' }), 1.25, false));
  extras.push(...cinto(c, pano('#c8a04a', 923), k.ouro, 0));
  pingente(c, k.ouro, aceso(SOTAQUE.halonia, 1.8), extras, 1.2);
  armaNaMao(c, 'tomo', 2, 'l', extras);
  return { extras, tecido: pano('#e8e0d0', 925, { barra: '#c8a04a' }), esconder: 'Hair' };
}

/** O Penitente: o flagelante de capuz pontudo e corda na cintura, as costas rasgadas pela penitência (as feridas de
 * luz), as correntes nos braços e o flagelo; quanto mais ferido, mais forte e mais rápido (no jogo). */
export function penitente(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  capuz(c, pano('#6a5a4a', 927, { rasgo: 0.5 }), 1.5, true, extras, liso(0x050405, 1));
  olhosAcesos(c, SOTAQUE.halonia, extras, 1.8);
  noOsso(c, 'spine_03', extras, (g) => {
    for (let i = 0; i < 5; i++) {
      const ferida = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.008, 0.01), aceso(SOTAQUE.halonia, 1.6));
      ferida.position.set(0, -0.08 + i * 0.05, -0.14);
      ferida.rotation.z = (i % 2 ? 1 : -1) * 0.35;
      g.add(ferida);
    }
  });
  for (const braco of ['lowerarm_l', 'lowerarm_r']) noOsso(c, braco, extras, (g) => {
    for (let i = 0; i < 4; i++) {
      const elo = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 5, 10), k.ferro);
      elo.position.set(0, -0.06 - i * 0.035, 0.03);
      elo.rotation.y = i % 2 ? Math.PI / 2 : 0;
      g.add(elo);
    }
  });
  extras.push(...saia(c, 0.85, pano('#5a4a3a', 929, { rasgo: 0.75 }), 1.2, false));
  extras.push(...cinto(c, liso(0x8a7a5a, 1), k.ferro, 0));
  armaNaMao(c, 'mangual', 2, 'r', extras);
  return { extras, tecido: pano('#5a4a3a', 931, { rasgo: 0.6 }), esconder: 'Hair|Hood' };
}

/** O Guardião de Mármore: a estátua de cavaleiro que anda, de mármore claro com veios dourados, o escudo de torre e a
 * lança; vira o escudo devagar para quem bate (no jogo). */
export function guardiaoDeMarmore(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const m = marmore();
  mascara(c, 'bico', m, aceso(SOTAQUE.halonia, 1.6), extras);
  coroa(c, m, 5, 0.05, extras, 0.19, 0.125, null);
  for (const l of ['l', 'r'] as const) ombreira(c, l, 'placa', m, k.ouro, extras, 3);
  extras.push(...membros(c, 'maos', 4, { leve: m, placa: m, junta: k.ouro, luva: [m, m], borda: k.ouro }));
  extras.push(...membros(c, 'pes', 4, { leve: m, placa: m, junta: k.ouro, luva: [m, m], borda: k.ouro }));
  extras.push(...saia(c, 0.5, m, 1.1, true));
  armaNaMao(c, 'escudo', 4, 'l', extras);
  armaNaMao(c, 'lanca', 3, 'r', extras);
  return { extras, tecido: m, esconder: 'Hair' };
}

/** O Arauto Caído (o chefe final da campanha, de Halônia): o anjo que caiu, de pele carbonizada, o halo partido, os
 * chifres que nasceram da queda, as asas de penas queimadas e o coração em brasa. */
export function arautoCaido(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  halo(c, SOTAQUE.halonia, extras, true, 0.18);
  chifres(c, liso(0x8a7a62, 0.6), 0.4, extras);
  olhosAcesos(c, 0xff7a2a, extras, 2.6);
  noOsso(c, 'spine_03', extras, (g) => {
    const coracao = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), aceso(0xff7a2a, 2.6));
    coracao.scale.set(1, 1.3, 0.6);
    coracao.position.set(0, 0.02, 0.16);
    g.add(coracao);
    for (const s of [-1, 1]) {
      const asa = new THREE.Group();
      asa.position.set(s * 0.1, 0.1, -0.15);
      asa.rotation.set(0.3, s * 0.4, 0);
      asaDePenas(asa, s, 0.7, liso(0x2a2220, 0.9), aceso(0xff7a2a, 0.8), 8);
      g.add(asa);
    }
  });
  for (const l of ['l', 'r'] as const) { ombreira(c, l, 'osso', k.ferro, null, extras, 2); ombreira(c, l, 'placa', k.ferro, k.latao, extras, 2); }
  extras.push(...saia(c, 0.42, pano('#1a1214', 933, { rasgo: 0.62 }), 1, false));
  extras.push(...cinto(c, k.couroNegro, k.ferro, 0));
  extras.push(...membros(c, 'maos', 5, { leve: k.couroNegro, placa: k.ferro, junta: k.ferro, luva: [k.ferro, k.ferro], borda: aceso(0xff7a2a, 2) }));
  extras.push(...membros(c, 'pes', 4, { leve: k.couroNegro, placa: k.ferro, junta: k.ferro, luva: [k.ferro, k.ferro], borda: k.ferro }));
  return { extras };
}

/** O Hierofante (governante de Halônia): a mitra alta de ouro velho, as vestes em camadas, a estola com o selo, o halo
 * duplo e o báculo; declara o pecado da vez (no jogo). */
export function hierofante(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  noOsso(c, 'Head', extras, (g) => {
    const mitra = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 4, 1), pano('#e8e0d0', 935, { barra: '#c8a04a' }));
    mitra.position.set(0, 0.3, 0);
    mitra.rotation.y = Math.PI / 4;
    mitra.scale.set(1, 1, 0.55);
    const faixa = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.07), k.ouro);
    faixa.position.set(0, 0.3, 0.035);
    g.add(mitra, faixa);
  });
  halo(c, SOTAQUE.halonia, extras, false, 0.2);
  halo(c, 0xfffbe6, extras, false, 0.26);
  olhosAcesos(c, SOTAQUE.halonia, extras, 2.4);
  estola(c, pano('#c8a04a', 937, { barra: '#fff3c0' }), 0.9, extras);
  golaAlta(c, k.ouro, 0.1, extras, k.ouro);
  extras.push(...saia(c, 1.1, pano('#f0e8d8', 939, { barra: '#c8a04a' }), 1.5, false));
  extras.push(...capa(c, 5, {
    panos: [pano('#8a6a2a', 941), pano('#8a6a2a', 941), pano('#7a5a22', 943)], forro: pano('#fff3c0', 945),
    fecho: k.ouro, gola: { tipo: 'alta', m: k.ouro }, comprimentos: [0.8, 1.1, 1.3],
  }));
  armaNaMao(c, 'cetro', 5, 'r', extras, 1.3);
  return { extras, tecido: pano('#e8e0d0', 947, { barra: '#c8a04a' }), esconder: 'Hair' };
}

/** O Velejador: o planador de capuz de vento, a vela de pano esticada entre os braços e as costas (pousa no alto) e o
 * arco curto. */
export function velejador(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const vela = pano('#cfe0ea', 949, { rasgo: 0.3 });
  vela.side = THREE.DoubleSide;
  capuz(c, pano('#8aa2b4', 951), 0.7, false, extras);
  mascara(c, 'pano', pano('#6a8294', 953), k.fenda, extras);
  for (const lado of ['l', 'r'] as const) noOsso(c, `upperarm_${lado}`, extras, (g) => {
    const s = lado === 'l' ? 1 : -1;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, s * 0.5, -0.05, -0.05, 0, -0.45, -0.12], 3));
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, vela));
  });
  bandoleira(c, k.couro, k.latao, extras);
  extras.push(...cinto(c, k.couro, k.latao, 2));
  armaNaMao(c, 'arcocurto', 2, 'l', extras);
  return { extras, tecido: pano('#6a8294', 955), esconder: 'Hair' };
}

/** O Ciclonista: o dervixe de saia larga que gira, as faixas de vento presas no corpo e o lenço que esvoaça; o golpe é
 * a lufada (no jogo, as correntes de vento). */
export function ciclonista(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  chapeu(c, 0.05, 0.18, pano('#e0ecf4', 957), liso(0x8aa2b4, 0.8), extras, 0);
  olhosAcesos(c, SOTAQUE.zefiria, extras, 1.6);
  extras.push(...saia(c, 0.85, pano('#bcd4e4', 959, { barra: '#5a7a90' }), 2, false));
  estola(c, pano('#eef9ff', 961, { rasgo: 0.6 }), 0.8, extras);
  noOsso(c, 'pelvis', extras, (g) => {
    for (let i = 0; i < 3; i++) {
      const faixa = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.06, 0.006, 4, 30, Math.PI * 1.4), aceso(SOTAQUE.zefiria, 0.8));
      faixa.rotation.set(Math.PI / 2 + 0.2, 0, i * 2);
      faixa.position.y = 0.05 + i * 0.12;
      g.add(faixa);
    }
  });
  extras.push(...cinto(c, pano('#5a7a90', 963), k.prata, 0));
  return { extras, tecido: pano('#d8e6f0', 965), esconder: 'Hair' };
}

/** O Almirante dos Ventos (governante de Zefíria): o tricórnio, a casaca longa azul de botões de latão, as dragonas, a
 * luneta no cinto e o sabre; as pipas de guerra bombardeiam por ele (no jogo). */
export function almiranteDosVentos(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  chapeu(c, 0.24, 0.1, pano('#1e2a3a', 967), k.latao, extras, 0.25);
  olhosAcesos(c, SOTAQUE.zefiria, extras, 1.8);
  for (const l of ['l', 'r'] as const) ombreira(c, l, 'couro', pano('#1e2a3a', 969), k.latao, extras, 2);
  golaAlta(c, pano('#1e2a3a', 971), 0.09, extras, k.latao);
  extras.push(...saia(c, 0.85, pano('#2a3a50', 973, { barra: '#c8a04a' }), 1.3, true));
  extras.push(...capa(c, 4, {
    panos: [pano('#1e2a3a', 975), pano('#1e2a3a', 975), pano('#18222e', 977)], forro: pano('#8a2a2a', 979), fecho: k.latao,
    gola: null, comprimentos: [0.6, 0.85, 1.05],
  }));
  noOsso(c, 'pelvis', extras, (g) => {
    const luneta = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.22, 10), k.latao);
    luneta.rotation.z = Math.PI / 2.3;
    luneta.position.set(-0.15, -0.05, 0.06);
    g.add(luneta);
  });
  extras.push(...cinto(c, k.couroNegro, k.latao, 1));
  pingente(c, k.latao, aceso(SOTAQUE.zefiria, 1.4), extras, 1.2);
  armaNaMao(c, 'sabre', 5, 'r', extras);
  return { extras, tecido: pano('#2a3a50', 981, { barra: '#c8a04a' }), esconder: 'Hair' };
}

/** A Harpia Soberana (governante de Zefíria): a rainha das harpias, as asas enormes de penas cinza-azuladas presas nos
 * braços e nas costas, a coroa de penas, as garras nos pés e o colar de ossos; fica no ar e mergulha (no jogo). */
export function harpiaSoberana(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const penas = liso(0x6a7a88, 0.9);
  const pontasM = liso(0xd8e6f0, 0.9);
  noOsso(c, 'spine_03', extras, (g) => {
    for (const s of [-1, 1]) {
      const asa = new THREE.Group();
      asa.position.set(s * 0.12, 0.08, -0.12);
      asa.rotation.set(0.2, s * 0.3, 0);
      asaDePenas(asa, s, 0.9, penas, pontasM, 9);
      g.add(asa);
    }
  });
  for (const braco of ['lowerarm_l', 'lowerarm_r']) noOsso(c, braco, extras, (g) => {
    const s = braco.endsWith('l') ? 1 : -1;
    asaDePenas(g, s, 0.35, penas, pontasM, 5);
  });
  noOsso(c, 'Head', extras, (g) => {
    for (let i = 0; i < 7; i++) {
      const a = (i / 6 - 0.5) * 2;
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), i % 2 ? pontasM : aceso(SOTAQUE.zefiria, 0.8));
      p.scale.set(0.3, 1.6, 0.08);
      p.position.set(Math.sin(a) * 0.1, 0.24 + Math.cos(a) * 0.04, -0.05);
      p.rotation.set(-0.3, 0, -a * 0.6);
      g.add(p);
    }
  });
  for (const pe of ['foot_l', 'foot_r']) noOsso(c, pe, extras, (g) => {
    for (let i = 0; i < 3; i++) {
      const garra = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.07, 5), liso(0x2a2420, 0.4));
      garra.position.set((i - 1) * 0.03, -0.02, 0.1);
      garra.rotation.x = Math.PI / 2 + 0.5;
      g.add(garra);
    }
  });
  olhosAcesos(c, SOTAQUE.zefiria, extras, 2.6);
  pingente(c, k.couro, liso(0xd8cfb4, 0.6), extras, 1.4);
  extras.push(...saia(c, 0.5, pano('#4a5a68', 983, { rasgo: 0.7 }), 1.2, false));
  return { extras, tecido: pano('#5a6a78', 985, { rasgo: 0.4 }), esconder: 'Hair' };
}

