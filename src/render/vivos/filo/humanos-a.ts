// Marco 45 (16/11/2026, D-181): as vestes dos humanoides de Ignárea, Hiemália e Fulgúria (peças sombrias com o sotaque
// da dimensão; o rig é o dos jogadores). Os chefes desta parte: o Rei das Fagulhas, a Imperatriz das Estátuas e o
// Maquinista Voltaico.

import * as THREE from 'three';
import { capa, capuz, cinto, coroa, estola, golaAlta, mascara, membros, ombreira, pingente, saia, veu } from '../pecas-sombrias';
import { comuns, metal, pano } from '../sombrio-base';
import { SOTAQUE } from './kit';
import { aceso, armaNaMao, Corpo, liso, noOsso, olhosAcesos, pontas, type Ossos, type PecaSombria } from './humanos-base';

const gelo = () => liso(0xbfe4f8, 0.1, 0.1);

/** O Fagulheiro: o diabrete de fuligem e pele de brasa, os trapos queimados, a lanterna de brasa na cintura e a faca. */
export function fagulheiro(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  olhosAcesos(c, SOTAQUE.ignarea, extras);
  pontas(c, 'Head', aceso(SOTAQUE.ignarea, 1.8), 5, 0.06, extras, [0, 0.16, -0.02], 0.7);
  extras.push(...cinto(c, k.couroNegro, k.ferro, 2, k.couro));
  noOsso(c, 'pelvis', extras, (g) => {
    const lanterna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.07, 8), k.ferro);
    lanterna.position.set(0.15, -0.04, 0.05);
    const brasa = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), aceso(SOTAQUE.ignarea, 2.6));
    brasa.position.copy(lanterna.position);
    g.add(lanterna, brasa);
  });
  extras.push(...saia(c, 0.3, pano('#2a1e16', 301, { rasgo: 0.75 }), 1.1, true));
  armaNaMao(c, 'adaga', 1, 'r', extras);
  return { extras, tecido: pano('#3a2a1e', 303, { rasgo: 0.5, aspereza: 0.9 }), esconder: 'Hair' };
}

/** O Vidraceiro: o soprador de vidro magro, o avental de couro grosso, os óculos escuros e os cacos presos nas costas. */
export function vidraceiro(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  olhosAcesos(c, SOTAQUE.ignarea, extras, 1.4);
  mascara(c, 'pano', pano('#3a2a20', 305), k.fenda, extras);
  pontas(c, 'spine_03', liso(0xffd0a0, 0.05, 0.2), 6, 0.12, extras, [0, 0.02, -0.14], 1.1);
  extras.push(...saia(c, 0.55, pano('#4a2e1c', 307, { aspereza: 0.6 }), 1, true));
  extras.push(...cinto(c, k.couro, k.latao, 3));
  extras.push(...membros(c, 'maos', 2, { leve: k.couro, placa: k.couro, junta: k.latao, luva: [k.couroNegro, k.couro], borda: k.latao }));
  armaNaMao(c, 'cetro', 1, 'r', extras, 0.8);
  return { extras, tecido: pano('#5a4632', 309), esconder: 'Hair' };
}

/** O Fornalheiro: o brutamontes com a fornalha no peito (a grade de ferro e o fogo dentro), o fole nas costas e a máscara
 * de ferro; na água, apaga (no jogo). */
export function fornalheiro(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  mascara(c, 'bico', k.ferro, aceso(SOTAQUE.ignarea, 2), extras);
  noOsso(c, 'spine_03', extras, (g) => {
    const boca = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 12), k.ferro);
    boca.rotation.x = Math.PI / 2;
    boca.position.set(0, 0, 0.13);
    const fogo = new THREE.Mesh(new THREE.CircleGeometry(0.095, 16), aceso(SOTAQUE.ignarea, 2.8));
    fogo.position.set(0, 0, 0.165);
    g.add(boca, fogo);
    for (let i = 0; i < 4; i++) {
      const barra = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.2, 0.012), k.ferro);
      barra.position.set((i - 1.5) * 0.045, 0, 0.17);
      g.add(barra);
    }
    const fole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.08), pano('#3a2618', 311, { aspereza: 0.8 }));
    fole.position.set(0, 0.02, -0.17);
    const bico = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 8), k.latao);
    bico.position.set(0, 0.2, -0.17);
    g.add(fole, bico);
  });
  for (const l of ['l', 'r'] as const) ombreira(c, l, 'placa', k.ferro, k.latao, extras, 2);
  extras.push(...membros(c, 'maos', 4, { leve: k.couroNegro, placa: k.ferro, junta: k.ferro, luva: [k.ferro, k.ferro], borda: aceso(SOTAQUE.ignarea, 1.4) }));
  extras.push(...cinto(c, k.couroNegro, k.ferro, 0));
  armaNaMao(c, 'clava', 3, 'r', extras);
  return { extras, tecido: pano('#2a1e18', 313, { tachas: true, aspereza: 0.85 }), esconder: 'Hair' };
}

/** O Rei das Fagulhas (governante de Ignárea): a coroa torta com a pedra em brasa, o manto de pele chamuscado e o
 * machado; o bando de Fagulheiros é a armadura dele (no jogo). */
export function reiDasFagulhas(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  olhosAcesos(c, SOTAQUE.ignarea, extras, 2.6);
  coroa(c, k.ferro, 7, 0.07, extras, 0.19, 0.125, aceso(SOTAQUE.ignarea, 2));
  for (const l of ['l', 'r'] as const) ombreira(c, l, 'pele', liso(0x3a2c20, 1), null, extras);
  pingente(c, k.couro, aceso(SOTAQUE.ignarea, 1.8), extras, 1.6);
  extras.push(...cinto(c, k.couroNegro, k.ferro, 3, k.couro));
  extras.push(...capa(c, 5, {
    panos: [pano('#3a2a1e', 315, { rasgo: 0.8 }), pano('#3a2a1e', 315, { rasgo: 0.8 }), pano('#2e2218', 317, { rasgo: 0.72 })],
    forro: pano('#6a2a10', 319, { rasgo: 0.7 }), fecho: k.ferro, gola: { tipo: 'pele', m: liso(0x3a2c20, 1) }, comprimentos: [0.5, 0.7, 0.85],
  }));
  extras.push(...membros(c, 'maos', 3, { leve: k.couro, placa: k.ferro, junta: k.ferro, luva: [k.couro, k.ferro], borda: k.latao }));
  armaNaMao(c, 'machado', 3, 'r', extras);
  return { extras, tecido: pano('#4a3a28', 321, { tachas: true, aspereza: 0.8 }), esconder: 'Hair' };
}

/** O Quebra-gelo: o grandalhão de barba congelada, as placas de gelo grossas nos ombros e no peito (caem a cada golpe
 * forte, no jogo) e o machado de gelo. */
export function quebraGelo(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const g = gelo();
  olhosAcesos(c, SOTAQUE.hiemalia, extras, 1.6);
  for (const l of ['l', 'r'] as const) ombreira(c, l, 'placa', g, k.ferro, extras, 3);
  pontas(c, 'spine_03', g, 5, 0.1, extras, [0, 0.05, 0.12], 0.8);
  pontas(c, 'Head', g, 6, 0.05, extras, [0, -0.02, 0.1], 0.9);
  extras.push(...cinto(c, k.couroNegro, k.ferro, 2, liso(0x6a5a4a, 1)));
  extras.push(...membros(c, 'maos', 3, { leve: liso(0x6a5a4a, 1), placa: g, junta: k.ferro, luva: [k.couroNegro, k.ferro], borda: g }));
  extras.push(...membros(c, 'pes', 2, { leve: liso(0x6a5a4a, 1), placa: k.ferro, junta: k.ferro, luva: [k.couroNegro, k.ferro], borda: k.ferro }));
  armaNaMao(c, 'machado', 2, 'r', extras, 1.2);
  return { extras, tecido: pano('#4a4a52', 323, { aspereza: 0.9 }), esconder: 'Hair' };
}

/** O Silente: o vulto alto de véu e capuz de geada, sem rosto (só o frio saindo de dentro), as mãos de gelo; some quando
 * ninguém está perto (no jogo). */
export function silente(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const extras: THREE.Object3D[] = [];
  const geada = pano('#c8d4de', 325, { rasgo: 0.55 });
  capuz(c, geada, 1.2, true, extras, liso(0x02060a, 1));
  veu(c, pano('#dfe8f0', 327, { rasgo: 0.6 }), 0.7, extras);
  extras.push(...saia(c, 0.95, pano('#b8c6d2', 329, { rasgo: 0.62 }), 1.4, false));
  estola(c, pano('#9fb4c4', 331, { rasgo: 0.6 }), 0.6, extras);
  olhosAcesos(c, SOTAQUE.hiemalia, extras, 1.2);
  noOsso(c, 'Head', extras, (g) => {
    const nevoa = liso(0xd9f2ff, 0.3);
    nevoa.transparent = true;
    nevoa.opacity = 0.35;
    const sopro = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), nevoa);
    sopro.position.set(0, 0.04, 0.14);
    g.add(sopro);
  });
  return { extras, tecido: geada, esconder: 'Hair|Hood' };
}

/** O Escultor de Geada: o artesão de avental de couro geado, o cinzel e o martelo, os cristais de gelo nos ombros e a
 * barba de pingentes; esculpe estilhaços (o golpe) e congela a água (no jogo). */
export function escultorDeGeada(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const g = gelo();
  pontas(c, 'clavicle_l', g, 3, 0.08, extras, [0, 0.02, 0], 0.6);
  pontas(c, 'clavicle_r', g, 3, 0.08, extras, [0, 0.02, 0], 0.6);
  pontas(c, 'Head', g, 5, 0.04, extras, [0, -0.03, 0.1], 0.7);
  extras.push(...saia(c, 0.5, pano('#4a5058', 333, { aspereza: 0.7 }), 1, true));
  extras.push(...cinto(c, k.couro, k.prata, 3));
  extras.push(...membros(c, 'maos', 2, { leve: k.couro, placa: k.couro, junta: k.prata, luva: [k.couroNegro, k.couro], borda: g }));
  armaNaMao(c, 'clava', 1, 'r', extras, 0.75);
  armaNaMao(c, 'adaga', 1, 'l', extras, 0.8);
  return { extras, tecido: pano('#5a6470', 335), esconder: 'Hair' };
}

/** A Imperatriz das Estátuas (governante de Hiemália): a coroa de gelo alta, o vestido longo de geada com a cauda, o
 * véu e os cristais flutuando em volta da cabeça; transforma quem cai em estátua (no jogo). */
export function imperatrizDasEstatuas(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const g = gelo();
  coroa(c, g, 9, 0.12, extras, 0.2, 0.124, aceso(SOTAQUE.hiemalia, 2.2));
  veu(c, pano('#e8f0f6', 337, { rasgo: 0.3 }), 0.9, extras);
  golaAlta(c, g, 0.14, extras, k.prata);
  extras.push(...saia(c, 1.05, pano('#cfdce6', 339, { barra: '#8fb0d8' }), 1.6, false));
  extras.push(...capa(c, 5, {
    panos: [pano('#9fb4c4', 341), pano('#9fb4c4', 341), pano('#8aa2b4', 343)], forro: pano('#e8f0f6', 345),
    fecho: k.prata, gola: { tipo: 'alta', m: g }, comprimentos: [0.7, 1, 1.2],
  }));
  olhosAcesos(c, SOTAQUE.hiemalia, extras, 2.4);
  armaNaMao(c, 'cetro', 5, 'r', extras);
  return { extras, tecido: pano('#dfe8f0', 347, { barra: '#8fb0d8' }), esconder: 'Hair' };
}

/** O Saltafaísca: o duende de cabelo arrepiado de faíscas, os óculos de solda, as tornozeleiras de bobina e as
 * luvas de borracha; salta de novo no campo elétrico (no jogo). */
export function saltafaisca(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const raio = aceso(SOTAQUE.fulguria, 2.4);
  pontas(c, 'Head', raio, 7, 0.07, extras, [0, 0.14, -0.03], 1);
  noOsso(c, 'Head', extras, (g) => {
    for (const s of [-1, 1]) {
      const lente = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), liso(0x1a1810, 0.1, 0.5));
      lente.rotation.x = Math.PI / 2;
      lente.position.set(s * 0.04, 0.09, 0.11);
      g.add(lente);
    }
  });
  for (const pe of ['calf_l', 'calf_r']) noOsso(c, pe, extras, (g) => {
    for (let i = 0; i < 3; i++) {
      const anel = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.01, 6, 14), metal('#b06a3a', 401, 0.9, 0.35));
      anel.rotation.x = Math.PI / 2;
      anel.position.y = -0.2 - i * 0.03;
      g.add(anel);
    }
  });
  extras.push(...membros(c, 'maos', 1, { leve: liso(0x2a2a20, 0.4), placa: k.couro, junta: k.latao, luva: [liso(0x2a2a20, 0.4), k.couro], borda: raio }));
  extras.push(...cinto(c, k.couro, k.latao, 2));
  return { extras, tecido: pano('#4a4a3a', 349, { rasgo: 0.4 }), esconder: 'Hair' };
}

/** O Para-raios: o guarda alto de armadura de cobre e porcelana, a haste de para-raios nas costas e os isoladores nos
 * ombros; puxa os raios para si (no jogo). */
export function paraRaios(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const cobre = metal('#b06a3a', 403, 0.9, 0.35);
  const porcelana = liso(0xe8e4dc, 0.3);
  mascara(c, 'bico', cobre, aceso(SOTAQUE.fulguria, 2), extras);
  for (const l of ['l', 'r'] as const) ombreira(c, l, 'placa', cobre, porcelana, extras, 3);
  noOsso(c, 'spine_03', extras, (g) => {
    const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.9, 8), cobre);
    haste.position.set(0, 0.35, -0.15);
    const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 8), cobre);
    ponta.position.set(0, 0.84, -0.15);
    const bola = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), aceso(SOTAQUE.fulguria, 2.4));
    bola.position.set(0, 0.92, -0.15);
    g.add(haste, ponta, bola);
    for (let i = 0; i < 3; i++) {
      const iso = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.03, 10), porcelana);
      iso.position.set(0, 0.1 + i * 0.12, -0.15);
      g.add(iso);
    }
  });
  extras.push(...membros(c, 'maos', 4, { leve: k.couroNegro, placa: cobre, junta: k.ferro, luva: [cobre, k.ferro], borda: porcelana }));
  extras.push(...membros(c, 'pes', 4, { leve: k.couroNegro, placa: cobre, junta: k.ferro, luva: [cobre, k.ferro], borda: porcelana }));
  extras.push(...cinto(c, k.couroNegro, cobre, 0));
  armaNaMao(c, 'mangual', 3, 'r', extras);
  return { extras, tecido: pano('#3a3430', 351, { tachas: true }), esconder: 'Hair' };
}

/** O Maquinista Voltaico (governante de Fulgúria): o casaco de couro longo, os óculos, a mochila-gerador com as bobinas
 * acesas, a manopla de cobre e os cabos que descem para os reféns (no jogo). */
export function maquinistaVoltaico(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const k = comuns();
  const extras: THREE.Object3D[] = [];
  const cobre = metal('#b06a3a', 405, 0.9, 0.35);
  const raio = aceso(SOTAQUE.fulguria, 2.6);
  noOsso(c, 'Head', extras, (g) => {
    for (const s of [-1, 1]) {
      const lente = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.025, 12), raio);
      lente.rotation.x = Math.PI / 2;
      lente.position.set(s * 0.04, 0.085, 0.11);
      g.add(lente);
    }
  });
  noOsso(c, 'spine_03', extras, (g) => {
    const caixa = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.14), k.ferro);
    caixa.position.set(0, 0.02, -0.2);
    g.add(caixa);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const espira = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 14), cobre);
        espira.rotation.x = Math.PI / 2;
        espira.position.set(s * 0.09, 0.2 + i * 0.03, -0.2);
        g.add(espira);
      }
      const topo = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), raio);
      topo.position.set(s * 0.09, 0.37, -0.2);
      g.add(topo);
    }
  });
  golaAlta(c, k.couroNegro, 0.1, extras, k.latao);
  extras.push(...saia(c, 0.9, pano('#2e2620', 353, { aspereza: 0.6 }), 1.2, true));
  extras.push(...cinto(c, k.couroNegro, k.latao, 3));
  extras.push(...membros(c, 'maos', 5, { leve: k.couroNegro, placa: cobre, junta: k.latao, luva: [cobre, k.latao], borda: raio }));
  extras.push(...membros(c, 'pes', 3, { leve: k.couroNegro, placa: k.ferro, junta: k.latao, luva: [k.couroNegro, k.ferro], borda: k.latao }));
  armaNaMao(c, 'cetro', 4, 'r', extras);
  return { extras, tecido: pano('#3a2e24', 355, { tachas: true }), esconder: 'Hair' };
}
