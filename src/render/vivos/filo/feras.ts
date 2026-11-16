// Marco 45 (16/11/2026, D-182): os bichos de pernas de Filo, feitos do zero: o Faminto (Umbrália), o Pedrico (o fofo
// de Lítia), o Galgo do Vendaval (Zefíria) e a Pluminha (o fofo de Zefíria).

import * as THREE from 'three';
import { animarQuadrupede, arco, asaDePenas, bola, brilho, ciclo, cone, cristais, em, mat, olhos, osso, pena, pernas, pivo, raizDe, SOTAQUE, suave, vidro, type Fera } from './kit';

/** O Faminto (Umbrália): o cão magro de costelas à mostra e a boca que rasga até o peito, os dentes em duas fileiras,
 * a pele cinza de defunto e a névoa violeta saindo da garganta; come quem cai e cresce (no jogo, a escala). */
export function faminto(): Fera {
  const { grupo, raiz } = raizDe();
  const H = 0.5;
  const apoio = pivo('apoio', raiz, 0, H, 0);
  const tronco = pivo('tronco', apoio);
  const pele = mat(0x5a5560, { roughness: 0.9 });
  const escuro = mat(0x24202a, { roughness: 0.85 });
  const dente = mat(0xe0d8c0, { roughness: 0.4 });
  tronco.add(em(bola(0.15, pele, 0.8, 1, 1.1), 0, 0, 0.18));
  tronco.add(em(bola(0.1, pele, 0.75, 0.7, 2), 0, 0.02, -0.08));
  tronco.add(em(bola(0.11, pele, 0.85, 0.85, 1), 0, 0.02, -0.28));
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) {
    const costela = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 4, 10, Math.PI * 0.6), mat(0x8a8478));
    tronco.add(em(costela, s * 0.02, -0.02, 0.12 - i * 0.05, 0, Math.PI / 2, s > 0 ? -0.6 : Math.PI + 0.6));
  }
  for (let i = 0; i < 6; i++) tronco.add(em(cone(0.015, 0.06, escuro, 4), 0, 0.12, 0.15 - i * 0.08, -0.3));
  const pescoco = pivo('pescoco', tronco, 0, 0.05, 0.32);
  pescoco.add(em(bola(0.075, pele, 0.85, 0.9, 1.5), 0, 0.02, 0.05, -0.5));
  const cabeca = pivo('cabeca', pescoco, 0, 0.06, 0.13);
  cabeca.add(bola(0.1, pele, 0.95, 0.8, 1.25));
  olhos(cabeca, { x: 0.05, y: 0.05, z: 0.08, r: 0.016, cor: SOTAQUE.umbralia, forca: 2.4 });
  const mandibula = pivo('mandibula', cabeca, 0, -0.04, 0.02);
  mandibula.add(em(bola(0.08, pele, 0.9, 0.4, 1.4), 0, -0.02, 0.08));
  mandibula.add(em(bola(0.06, brilho(SOTAQUE.umbralia, 0.66, { transparent: true, opacity: 0.7 }), 0.8, 0.3, 1.2), 0, 0.005, 0.07));
  for (let i = 0; i < 7; i++) {
    const a = (i / 6 - 0.5) * 2.4;
    cabeca.add(em(cone(0.008, 0.035, dente, 4), Math.sin(a) * 0.065, -0.035, 0.08 + Math.cos(a) * 0.05, Math.PI));
    mandibula.add(em(cone(0.008, 0.035, dente, 4), Math.sin(a) * 0.06, 0.0, 0.08 + Math.cos(a) * 0.05));
  }
  for (const s of [-1, 1]) cabeca.add(em(cone(0.03, 0.11, escuro, 4), s * 0.05, 0.1, -0.04, -0.5, 0, -s * 0.3));
  const ps = pernas(tronco, [[-0.07, -0.05, 0.22, 0], [0.07, -0.05, 0.22, Math.PI], [-0.07, -0.03, -0.28, Math.PI], [0.07, -0.03, -0.28, 0]], { coxa: pele, pe: escuro, garra: dente }, { r: 0.035, coxa: 0.22, canela: 0.24, pata: 0.03 });
  const rabo = pivo('rabo', tronco, 0, 0.04, -0.36);
  rabo.add(osso(0.022, 0.3, pele, 0.008));
  return { grupo, animar: (e, f) => { animarQuadrupede({ raiz, apoio, tronco, pescoco, cabeca, mandibula, rabo, pernas: ps, altura: H }, e, f, { bote: 0.35 }); } };
}

/** O Pedrico (Lítia): o jabutizinho de pedra de casco abaulado com um geodo aberto em cima (os cristais lilases), a
 * cabeça de seixo e os olhos de criança; recolhe-se no casco (o conjurar) e enterra-se na lama. */
export function pedrico(): Fera {
  const { grupo, raiz } = raizDe();
  const H = 0.12;
  const apoio = pivo('apoio', raiz, 0, H, 0);
  const tronco = pivo('tronco', apoio);
  const pedra = mat(0x8a7a62, { roughness: 0.95 });
  const escura = mat(0x5a4c3a, { roughness: 0.95 });
  const geodo = vidro(SOTAQUE.litia, 0.9, 0.6);
  tronco.add(em(bola(0.22, pedra, 1, 0.62, 1.1), 0, 0.06, 0));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    tronco.add(em(new THREE.Mesh(new THREE.DodecahedronGeometry(0.06, 0), escura), Math.cos(a) * 0.17, 0.05, Math.sin(a) * 0.19, a, a, 0));
  }
  const casca = new THREE.Group();
  casca.position.set(0, 0.17, -0.02);
  casca.add(em(bola(0.08, escura, 1, 0.5, 1), 0, -0.01, 0));
  cristais(casca, 6, 0.03, 0.1, geodo, 23, 0.5);
  tronco.add(casca);
  const pescoco = pivo('pescoco', tronco, 0, 0.04, 0.2);
  const cabeca = pivo('cabeca', pescoco, 0, 0.03, 0.06);
  cabeca.add(bola(0.075, pedra, 1, 0.85, 1.15));
  olhos(cabeca, { x: 0.035, y: 0.03, z: 0.06, r: 0.022, fofo: true });
  const ps = pernas(tronco, [[-0.13, 0, 0.1, 0], [0.13, 0, 0.1, Math.PI], [-0.13, 0, -0.12, Math.PI], [0.13, 0, -0.12, 0]], { coxa: pedra, pe: escura }, { r: 0.04, coxa: 0.05, canela: 0.05, pata: 0.04 });
  return {
    grupo,
    animar(e, f) {
      animarQuadrupede({ raiz, apoio, tronco, pescoco, cabeca, pernas: ps, altura: H }, e, f, { passo: 0.4, bote: 0.12 });
      // Recolhido: a cabeça e as patas entram no casco.
      const dentro = e === 'conjurar' ? suave(f * 3) : 0;
      pescoco.position.z = 0.2 - 0.12 * dentro;
      for (const p of ps) p.coxa.scale.setScalar(1 - 0.8 * dentro);
    },
  };
}

/** O Galgo do Vendaval (Zefíria): o galgo esguio de pelo cinza-azulado com as faixas de vento claras, a crina que
 * esvoaça como fiapos de nuvem e os olhos de céu; corre em roda com os irmãos (o redemoinho). */
export function galgoDoVendaval(): Fera {
  const { grupo, raiz } = raizDe();
  const H = 0.55;
  const apoio = pivo('apoio', raiz, 0, H, 0);
  const tronco = pivo('tronco', apoio);
  const pelo = mat(0x6a7a88, { roughness: 0.85 });
  const claro = mat(0xd8e6f0, { roughness: 0.9 });
  const vento = vidro(SOTAQUE.zefiria, 0.55, 0.4);
  tronco.add(em(bola(0.13, pelo, 0.75, 1.15, 1.2), 0, 0, 0.18));
  tronco.add(em(bola(0.08, pelo, 0.7, 0.75, 2.4), 0, 0.03, -0.06));
  tronco.add(em(bola(0.1, pelo, 0.8, 0.9, 1.1), 0, 0.03, -0.27));
  tronco.add(em(bola(0.09, claro, 0.7, 1, 0.6), 0, -0.07, 0.27));
  for (let i = 0; i < 3; i++) {
    const faixa = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 4, 16, Math.PI), claro);
    tronco.add(em(faixa, 0, 0.0, 0.1 - i * 0.13, 0, Math.PI / 2, 0));
  }
  for (let i = 0; i < 9; i++) {
    const fiapo = pena(0.14 + (i % 3) * 0.03, vento);
    tronco.add(em(fiapo, (i % 2 ? 1 : -1) * 0.02, 0.1, 0.3 - i * 0.07, -1.9, 0, (i % 2 ? 1 : -1) * 0.2));
  }
  const pescoco = pivo('pescoco', tronco, 0, 0.07, 0.33);
  pescoco.add(em(bola(0.065, pelo, 0.85, 0.9, 1.7), 0, 0.04, 0.05, -0.75));
  const cabeca = pivo('cabeca', pescoco, 0, 0.1, 0.12);
  cabeca.add(bola(0.075, pelo, 0.85, 0.8, 1.25));
  cabeca.add(em(cone(0.045, 0.22, claro, 9), 0, -0.02, 0.15, Math.PI / 2));
  olhos(cabeca, { x: 0.04, y: 0.025, z: 0.07, r: 0.015, cor: SOTAQUE.zefiria, forca: 2 });
  const mandibula = pivo('mandibula', cabeca, 0, -0.045, 0.04);
  mandibula.add(em(cone(0.032, 0.16, claro, 8), 0, 0, 0.09, Math.PI / 2));
  for (const s of [-1, 1]) cabeca.add(em(cone(0.025, 0.11, pelo, 4), s * 0.04, 0.08, -0.04, -1.1, 0, -s * 0.2));
  const ps = pernas(tronco, [[-0.06, -0.05, 0.22, 0], [0.06, -0.05, 0.22, Math.PI], [-0.06, -0.03, -0.28, Math.PI], [0.06, -0.03, -0.28, 0]], { coxa: pelo, pe: claro }, { r: 0.035, coxa: 0.24, canela: 0.26, pata: 0.028 });
  const rabo = pivo('rabo', tronco, 0, 0.06, -0.36);
  rabo.add(osso(0.02, 0.32, pelo, 0.01));
  rabo.add(em(pena(0.18, vento), 0, -0.3, 0, Math.PI));
  return { grupo, animar: (e, f) => { animarQuadrupede({ raiz, apoio, tronco, pescoco, cabeca, mandibula, rabo, pernas: ps, altura: H }, e, f, { passo: 0.7, bote: 0.45 }); } };
}

/** A Pluminha (Zefíria): o filhote redondo de penugem branca com as pontas azul-céu, o bico curto, as asinhas abertas e
 * o topete; flutua num sopro (paira acima do chão e cai devagar). */
export function pluminha(): Fera {
  const { grupo, raiz } = raizDe();
  const corpo = pivo('corpo', raiz, 0, 0.18, 0);
  const penugem = mat(0xf4f8fc, { roughness: 1 });
  const ponta = mat(0x9fcfee, { roughness: 0.9, emissive: SOTAQUE.zefiria, emissiveIntensity: 0.25 });
  corpo.add(em(bola(0.17, penugem), 0, 0.17, 0));
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4;
    const y = 0.05 + ((i * 13) % 10) / 34;
    corpo.add(em(pena(0.06, i % 4 ? penugem : ponta), Math.cos(a) * 0.16, y, Math.sin(a) * 0.16, Math.sin(a) * 1.3, 0, -Math.cos(a) * 1.3));
  }
  olhos(corpo, { x: 0.06, y: 0.2, z: 0.14, r: 0.03, fofo: true });
  corpo.add(em(cone(0.03, 0.06, mat(0xe0a040), 6), 0, 0.15, 0.17, Math.PI / 2));
  const topo = pivo('topo', corpo, 0, 0.33, 0);
  for (let i = 0; i < 3; i++) topo.add(em(pena(0.08, ponta), (i - 1) * 0.02, 0, 0, -0.3, 0, (i - 1) * 0.35));
  const asas = [-1, 1].map((s) => {
    const a = pivo(s > 0 ? 'asaD' : 'asaE', corpo, s * 0.15, 0.2, 0);
    asaDePenas(a, s, 0.14, penugem, ponta, 5);
    return a;
  });
  for (const s of [-1, 1]) corpo.add(em(osso(0.01, 0.05, mat(0xe0a040), 0.008), s * 0.05, 0.03, 0.02));
  return {
    grupo,
    animar(e, f) {
      raiz.position.set(0, 0.06 * ciclo(f) + (e === 'morte' ? -0.18 * suave(f) : 0), 0);
      raiz.rotation.set(0, 0, e === 'morte' ? (Math.PI / 2) * suave(f) : 0);
      corpo.rotation.set(e === 'golpe' || e === 'golpe2' || e === 'golpe3' ? 0.4 * arco(f) : 0, 0, 0);
      corpo.position.z = e === 'golpe' ? 0.15 * arco(f) : 0;
      const bate = e === 'parado' ? 0.4 : e === 'conjurar' ? 1.2 : 0.9;
      for (const [k, a] of asas.entries()) a.rotation.z = (k ? -1 : 1) * (0.2 + bate * Math.abs(ciclo(f * 3)));
      topo.rotation.z = 0.2 * ciclo(f * 2);
    },
  };
}
