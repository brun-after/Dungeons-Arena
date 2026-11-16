// Marco 45 (16/11/2026, D-181): as vestes dos humanoides de Putrévia, Umbrália e Oníria. Os chefes desta parte: o
// Necromante Ancestral (o kit do necromante, chefes-vivos.ts), o Apagador, a Bruxa dos Sonhos e o Rei das Máscaras;
// e as duas cópias que os chefes põem na arena (a sombra roubada e o reflexo do sonho).

import * as THREE from 'three';
import { capa, capuz, chapeu, cinto, costelas, coroa, cristais, estola, golaAlta, mascara, membros, ombreira, pingente, saia, veu } from '../pecas-sombrias';
import { comuns, metal, pano } from '../sombrio-base';
import { SOTAQUE } from './kit';
import { aceso, armaNaMao, chifres, Corpo, liso, noOsso, olhosAcesos, pontas, type Ossos, type PecaSombria } from './humanos-base';

/** O Bebedor: o vulto magro de pele cinza-esverdeada, as mangueiras de seiva presas nos braços, o manto de lodo e os
 * olhos verdes; marca e bebe de quem marcou (no jogo). */
export function bebedor(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const seiva = aceso(SOTAQUE.putrevia, 1.4);
  olhosAcesos(c, SOTAQUE.putrevia, extras, 2.2);
  golaAlta(c, pano('#1e2418', 501), 0.16, extras, k.ferro);
  for (const braco of ['lowerarm_l', 'lowerarm_r']) noOsso(c, braco, extras, (g) => {
    for (let i = 0; i < 2; i++) {
      const tubo = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 6, 14, Math.PI * 1.5), seiva);
      tubo.rotation.set(Math.PI / 2, 0, i * 1.2);
      tubo.position.y = -0.08 - i * 0.08;
      g.add(tubo);
    }
  });
  extras.push(...capa(c, 4, {
    panos: [pano('#2a3424', 503, { rasgo: 0.7 }), pano('#2a3424', 503, { rasgo: 0.7 }), pano('#1e281a', 505, { rasgo: 0.65 })],
    forro: pano('#3a5a2a', 507, { rasgo: 0.6 }), fecho: k.ferro, gola: null, comprimentos: [0.6, 0.85, 1.05],
  }));
  extras.push(...cinto(c, k.couroNegro, k.ferro, 2, liso(0x3a5a2a, 0.5)));
  return { extras, tecido: pano('#2a2e22', 509, { rasgo: 0.4 }), esconder: 'Hair' };
}

/** O Esporeiro: o andarilho coberto de micélio, o chapéu é um cogumelo enorme de pintas acesas, os fungos nos ombros e
 * o saco de esporos; planta cogumelos-bomba (no jogo). */
export function esporeiro(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const chapeuM = liso(0x7a5a2a, 0.6);
  chapeu(c, 0.32, 0.12, chapeuM, liso(0xd8d0b0, 0.8), extras, 0.2);
  noOsso(c, 'Head', extras, (g) => {
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9;
      const pinta = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), aceso(0xb7f27a, 1.2));
      pinta.scale.set(1, 0.4, 1);
      pinta.position.set(Math.cos(a) * 0.18, 0.26, Math.sin(a) * 0.18);
      g.add(pinta);
    }
  });
  for (const omb of ['clavicle_l', 'clavicle_r']) noOsso(c, omb, extras, (g) => {
    for (let i = 0; i < 3; i++) {
      const topo = new THREE.Mesh(new THREE.SphereGeometry(0.035 + i * 0.01, 10, 6), liso(0x8a6a3a, 0.6));
      topo.scale.set(1, 0.5, 1);
      topo.position.set(0, 0.05 + i * 0.03, -0.03 + i * 0.02);
      g.add(topo);
    }
  });
  mascara(c, 'pano', pano('#3a3a24', 511), k.fenda, extras);
  extras.push(...saia(c, 0.7, pano('#3a3a28', 513, { rasgo: 0.7 }), 1.2, false));
  extras.push(...cinto(c, k.couro, k.ferro, 3, liso(0x5f9a3a, 0.5)));
  return { extras, tecido: pano('#4a4a30', 515, { rasgo: 0.5, aspereza: 0.95 }), esconder: 'Hair|Hood' };
}

/** O Arqueiro de Osso: o esqueleto (o corpo some; as costelas, a caveira e os ossos dos braços são nossos), o capuz
 * rasgado e o arco de osso; desmonta e se remonta (no jogo). */
export function arqueiroDeOsso(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const osso = liso(0xd8cfb4, 0.6);
  costelas(c, osso, 5, extras);
  mascara(c, 'osso', osso, k.fenda, extras);
  olhosAcesos(c, SOTAQUE.umbralia, extras, 2.4);
  capuz(c, pano('#1e1a24', 517, { rasgo: 0.8 }), 0.6, false, extras);
  for (const parte of ['upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r']) noOsso(c, parte, extras, (g) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.26, 8), osso);
    b.position.y = -0.13;
    g.add(b);
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), osso);
    g.add(n);
  });
  noOsso(c, 'pelvis', extras, (g) => {
    const bacia = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 6, 14), osso);
    bacia.rotation.x = Math.PI / 2;
    g.add(bacia);
  });
  armaNaMao(c, 'arcocurto', 2, 'l', extras);
  return { extras, esconder: 'Body|Arms|Legs|Feet|Hands|Superhero|Regular|Hair|Ranger|Peasant' };
}

/** O Apagador (governante de Umbrália): alto, o capuz em cone como um apagador de vela (o rosto é o breu), o manto que
 * escorre fumaça e a gadanha; apaga as luzes e caça no escuro (no jogo). */
export function oApagador(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  noOsso(c, 'Head', extras, (g) => {
    const apagador = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.5, 18, 1, true), metal('#1e1c22', 601, 0.85, 0.5));
    apagador.position.set(0, 0.2, 0);
    const breu = new THREE.Mesh(new THREE.CircleGeometry(0.165, 18), liso(0x000000, 1));
    breu.rotation.x = Math.PI / 2;
    breu.position.set(0, -0.05, 0);
    const alca = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 12), metal('#2e2c30', 603));
    alca.position.set(0, 0.47, 0);
    g.add(apagador, breu, alca);
    for (const s of [-1, 1]) {
      const olho = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), aceso(SOTAQUE.umbralia, 2.8));
      olho.position.set(s * 0.04, 0.05, 0.12);
      g.add(olho);
    }
  });
  extras.push(...saia(c, 1.1, pano('#0e0c12', 605, { rasgo: 0.7 }), 1.6, false));
  extras.push(...capa(c, 5, {
    panos: [pano('#141018', 607, { rasgo: 0.75 }), pano('#141018', 607, { rasgo: 0.75 }), pano('#0e0c12', 609, { rasgo: 0.7 })],
    forro: pano('#2a1840', 611, { rasgo: 0.6 }), fecho: k.ferro, gola: { tipo: 'penas', m: liso(0x0a080c, 1) }, comprimentos: [0.8, 1.1, 1.35],
  }));
  extras.push(...membros(c, 'maos', 4, { leve: k.couroNegro, placa: k.ferro, junta: k.ferro, luva: [k.couroNegro, k.ferro], borda: aceso(SOTAQUE.umbralia, 1.2) }));
  armaNaMao(c, 'gadanha', 4, 'r', extras);
  return { extras, tecido: pano('#100e14', 613), esconder: 'Hair|Hood' };
}

/** O Riscador: o escriba medroso de capuz, os gizes de runa presos no cinto, os pingentes de runa e o rolo de
 * pergaminho; foge plantando runas e fecha o anel (no jogo). */
export function riscador(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const runa = aceso(SOTAQUE.oniria, 1.8);
  capuz(c, pano('#3a2a4a', 701, { rasgo: 0.4 }), 0.9, true, extras, liso(0x08060a, 1));
  olhosAcesos(c, SOTAQUE.oniria, extras, 1.6);
  pingente(c, k.prata, runa, extras, 1.2);
  noOsso(c, 'pelvis', extras, (g) => {
    for (let i = 0; i < 5; i++) {
      const giz = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 6), i % 2 ? runa : liso(0xf0eadc, 0.9));
      giz.position.set(-0.14 + i * 0.02, -0.06, 0.12);
      g.add(giz);
    }
    const rolo = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8), liso(0xe8dcc0, 0.9));
    rolo.rotation.z = Math.PI / 2;
    rolo.position.set(0.1, -0.04, -0.12);
    g.add(rolo);
  });
  extras.push(...saia(c, 0.75, pano('#2e2240', 703, { barra: '#7a5a9a' }), 1.15, true));
  extras.push(...cinto(c, k.couro, k.prata, 2));
  return { extras, tecido: pano('#3a2e4a', 705, { barra: '#7a5a9a' }), esconder: 'Hair' };
}

/** O Marionetista: a máscara branca de sorriso fixo, o casaco de arlequim desbotado e as cruzetas de madeira nas mãos,
 * com os fios que descem (no jogo, ligam os aliados). */
export function marionetista(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  mascara(c, 'osso', liso(0xf2eee6, 0.4), k.fenda, extras);
  chapeu(c, 0.12, 0.2, pano('#2a1e30', 707), liso(0xd79bff, 0.6), extras, 0.05);
  for (const mao of ['hand_l', 'hand_r']) noOsso(c, mao, extras, (g) => {
    const madeira = liso(0x6a4a2a, 0.7);
    const barra = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.015), madeira);
    const cruz = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.14), madeira);
    barra.position.y = 0.06;
    cruz.position.y = 0.06;
    g.add(barra, cruz);
    for (const x of [-0.1, 0, 0.1]) {
      const fio = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.5, 3), aceso(0xf1dcff, 1.2));
      fio.position.set(x, -0.19, 0);
      g.add(fio);
    }
  });
  golaAlta(c, pano('#f0e8f4', 709), 0.08, extras, liso(0x2a1e30, 0.8));
  extras.push(...saia(c, 0.55, pano('#5a3a6a', 711, { rasgo: 0.4 }), 1.1, true));
  extras.push(...cinto(c, k.couroNegro, k.prata, 1));
  return { extras, tecido: pano('#4a3a5a', 713, { acolchoado: true }), esconder: 'Hair' };
}

/** A Bruxa dos Sonhos (governante de Oníria): o capuz pontudo lilás com as estrelas, o xale de névoa, a saia que se
 * desfaz em fumaça e o cajado de prisma; puxa um jogador para o sonho (no jogo). */
export function bruxaDosSonhos(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const sonho = pano('#3a2a50', 715);
  capuz(c, sonho, 1.4, true, extras, liso(0x06040a, 1));
  olhosAcesos(c, SOTAQUE.oniria, extras, 2.6);
  cristais(c, aceso(SOTAQUE.oniria, 1.6), k.prata, 5, 0.06, extras);
  estola(c, pano('#d8c8ec', 717, { rasgo: 0.6 }), 0.6, extras);
  extras.push(...saia(c, 0.95, pano('#2a1e3a', 719, { rasgo: 0.7 }), 1.5, false));
  extras.push(...capa(c, 4, {
    panos: [sonho, sonho, pano('#2a1e3a', 721, { rasgo: 0.62 })], forro: pano('#6a4a8a', 723, { rasgo: 0.6 }), fecho: k.prata,
    gola: null, comprimentos: [0.6, 0.9, 1.2],
  }));
  pingente(c, k.prata, aceso(SOTAQUE.oniria, 2), extras, 1.4);
  armaNaMao(c, 'prisma', 5, 'r', extras);
  return { extras, tecido: sonho, esconder: 'Hood|Hair' };
}

/** O Rei das Máscaras (governante de Oníria): a máscara de porcelana partida ao meio (o riso e o choro), a coroa de
 * máscaras pequenas, os chifres finos e o manto com as máscaras costuradas; troca a regra a cada fase (no jogo). */
export function reiDasMascaras(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const porcelana = liso(0xf2eee6, 0.25);
  mascara(c, 'osso', porcelana, k.fenda, extras);
  chifres(c, liso(0x2a1e30, 0.5), 0.22, extras);
  coroa(c, k.ouro, 6, 0.06, extras, 0.2, 0.125, aceso(SOTAQUE.oniria, 2));
  noOsso(c, 'spine_03', extras, (g) => {
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8, 0, Math.PI), porcelana);
      m.position.set((i - 2) * 0.09, -0.05 - Math.abs(i - 2) * 0.05, -0.17);
      m.rotation.y = Math.PI;
      g.add(m);
    }
  });
  extras.push(...capa(c, 5, {
    panos: [pano('#4a1e3a', 725), pano('#4a1e3a', 725), pano('#3a1630', 727, { rasgo: 0.4 })], forro: pano('#d79bff', 729),
    fecho: k.ouro, gola: { tipo: 'alta', m: pano('#2a1020', 731) }, comprimentos: [0.7, 1, 1.25],
  }));
  for (const l of ['l', 'r'] as const) ombreira(c, l, 'placa', k.ouro, k.prata, extras, 2);
  extras.push(...membros(c, 'maos', 4, { leve: k.couroNegro, placa: k.ouro, junta: k.prata, luva: [k.couroNegro, k.ouro], borda: aceso(SOTAQUE.oniria, 1) }));
  armaNaMao(c, 'rapieira', 5, 'r', extras);
  return { extras, tecido: pano('#3a1630', 733, { barra: '#d79bff' }), esconder: 'Hair' };
}

/** A sombra roubada (o Necromante Ancestral): a cópia de breu de quem perdeu a sombra, de contorno violeta; só a luz a
 * fere (no jogo). */
export function sombraRoubada(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const extras: THREE.Object3D[] = [];
  olhosAcesos(c, SOTAQUE.umbralia, extras, 2.8);
  veu(c, pano('#0a080e', 801, { rasgo: 0.8 }), 0.6, extras);
  extras.push(...saia(c, 0.7, pano('#0a080e', 803, { rasgo: 0.85 }), 1.3, false));
  return { extras, tecido: liso(0x050407, 1), esconder: 'Hair' };
}

/** O reflexo do sonho (a Bruxa dos Sonhos): a cópia translúcida e lilás de quem dorme, com o brilho de dentro. */
export function reflexoDoSonho(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const extras: THREE.Object3D[] = [];
  olhosAcesos(c, SOTAQUE.oniria, extras, 2.6);
  pontas(c, 'Head', aceso(0xf1dcff, 1.6), 5, 0.05, extras, [0, 0.16, -0.02], 0.8);
  const tecido = liso(0xd79bff, 0.2);
  tecido.transparent = true;
  tecido.opacity = 0.6;
  tecido.emissive.setHex(SOTAQUE.oniria);
  tecido.emissiveIntensity = 0.6;
  return { extras, tecido, esconder: 'Hair' };
}

/** O Espelhante (Oníria, 16/11/2026): a figura de porcelana de juntas douradas, sem rosto, com o espelho oval de moldura
 * escura no lugar dele, os cacos que giram em volta da cabeça e a túnica de véu; devolve a sua skill (no jogo). */
export function espelhante(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const porcelana = liso(0xf2eef4, 0.35);
  const espelho = new THREE.MeshStandardMaterial({ color: 0xc8d0e4, metalness: 0.6, roughness: 0.08, emissive: 0x6a5a8a, emissiveIntensity: 0.35 });
  const moldura = liso(0x3a2a4a, 0.5);
  noOsso(c, 'Head', extras, (g) => {
    const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), porcelana);
    cabeca.scale.set(1, 1.18, 1.05);
    cabeca.position.set(0, 0.08, 0);
    const vidro = new THREE.Mesh(new THREE.CircleGeometry(0.085, 28), espelho);
    vidro.scale.set(0.82, 1.1, 1);
    vidro.position.set(0, 0.085, 0.128);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.011, 8, 32), moldura);
    aro.scale.set(0.82, 1.1, 1);
    aro.position.copy(vidro.position);
    g.add(cabeca, vidro, aro);
    const caco = aceso(SOTAQUE.oniria, 0.9);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const p = new THREE.Mesh(new THREE.TetrahedronGeometry(0.03), i % 2 ? espelho : caco);
      p.position.set(Math.cos(a) * 0.22, 0.1 + Math.sin(a * 2) * 0.05, Math.sin(a) * 0.22);
      p.rotation.set(a, a * 0.5, 0);
      g.add(p);
    }
  });
  golaAlta(c, pano('#e8e0ee', 715), 0.07, extras, liso(0xc8a85a, 0.5));
  extras.push(...membros(c, 'maos', 2, { leve: porcelana, placa: porcelana, junta: liso(0xc8a85a, 0.4), luva: [porcelana, liso(0xc8a85a, 0.4)], borda: aceso(SOTAQUE.oniria, 0.8) }));
  extras.push(...saia(c, 0.7, pano('#d8d0e4', 717, { rasgo: 0.3, barra: '#9a7ac0' }), 1.1, true));
  extras.push(...cinto(c, k.couroNegro, k.prata, 1));
  return { extras, tecido: pano('#e4dcec', 719, { barra: '#9a7ac0' }), esconder: 'Hair' };
}
