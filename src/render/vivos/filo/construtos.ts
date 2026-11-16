// Marco 45 (16/11/2026, D-182): os construtos de Filo (o Obelisco Vigia; o Espelhante virou humanoide, humanos-b.ts) e os objetos que os chefes põem
// na arena (a estátua de gelo, a torre engrenada, o cabo voltaico, o cogumelo-pulmão, o casulo, o braseiro, a coluna
// antiga, o pilar de cristal e o pedregulho), feitos do zero. Os objetos só pulsam, disparam e desmoronam.

import * as THREE from 'three';
import { animarObjeto, bola, brilho, chama, ciclo, cogumelo, cone, cristais, em, faisca, floco, mat, metalico, pivo, raizDe, SOTAQUE, sorte, vidro, type Fera } from './kit';

/** O Obelisco Vigia (Lítia): o monólito de pedra escura com runas gastas, o olho de cristal aceso no alto e o anel de
 * pedras que flutua em volta (a estase); não anda: gira o anel e pisca o olho ao disparar. */
export function obeliscoVigia(): Fera {
  const { grupo, raiz } = raizDe();
  const pedra = mat(0x4a4038, { roughness: 0.95 });
  const runa = brilho(SOTAQUE.litia, 0.66);
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 1.1, 4), pedra);
  em(corpo, 0, 0.55, 0, 0, Math.PI / 4, 0);
  raiz.add(corpo);
  raiz.add(em(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 4), pedra), 0, 1.19, 0, 0, Math.PI / 4, 0));
  raiz.add(em(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), pedra), 0, 0.05, 0));
  for (let i = 0; i < 4; i++) raiz.add(em(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.005), runa), 0, 0.3 + i * 0.16, 0.12 - i * 0.012, 0, 0, i * 0.4));
  const olho = pivo('olho', raiz, 0, 0.92, 0.07);
  olho.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), brilho(SOTAQUE.litia, 1.32)));
  const anel = pivo('anel', raiz, 0, 0.5, 0);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    anel.add(em(new THREE.Mesh(new THREE.DodecahedronGeometry(0.04, 0), pedra), Math.cos(a) * 0.32, 0.04 * ciclo(i / 7), Math.sin(a) * 0.32, a, a, 0));
  }
  return {
    grupo,
    animar(e, f) {
      animarObjeto(raiz, olho, e, f);
      anel.rotation.y = f * Math.PI * 2 * (e === 'conjurar' ? 2 : 0.5);
      anel.position.y = 0.5 + 0.04 * ciclo(f);
    },
  };
}

/** Um objeto parado com um pivô que pulsa (o que dispara ou respira). */
function objeto(montar: (raiz: THREE.Group) => THREE.Object3D | null): () => Fera {
  return () => {
    const { grupo, raiz } = raizDe();
    const pulso = montar(raiz);
    return { grupo, animar: (e, f) => { animarObjeto(raiz, pulso, e, f); } };
  };
}

/** A estátua de gelo da Imperatriz: o jogador caído preso num bloco facetado, com a geada subindo. */
export const estatuaDeGelo = objeto((raiz) => {
  const gelo = vidro(SOTAQUE.hiemalia, 0.6, 0.4);
  raiz.add(em(new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), gelo), 0, 0.5, 0, 0, 0, 0)).scale.set(0.7, 1.35, 0.7);
  raiz.add(em(bola(0.09, mat(0x2a3440, { transparent: true, opacity: 0.5 })), 0, 0.82, 0));
  raiz.add(em(bola(0.13, mat(0x2a3440, { transparent: true, opacity: 0.45 }), 1, 1.8, 0.8), 0, 0.5, 0));
  cristais(raiz, 7, 0.32, 0.22, gelo, 61);
  const p = pivo('floco', raiz, 0, 1.08, 0);
  floco(p, 0.08, brilho(0xd9f2ff, 0.77));
  return p;
});

/** A torre engrenada do Dragão da Tempestade: o mastro de ferro, as engrenagens de latão e a bobina que acumula a carga. */
export const torreEngrenada = objeto((raiz) => {
  const ferro = metalico(0x2e2c30, 0.55);
  const latao = metalico(0x8a6a3a, 0.35);
  raiz.add(em(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 1.2, 8), ferro), 0, 0.6, 0));
  raiz.add(em(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.12, 10), ferro), 0, 0.06, 0));
  for (const [y, r] of [[0.4, 0.16], [0.75, 0.12]] as const) {
    const roda = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 6, 12), latao);
    for (let i = 0; i < 10; i++) roda.add(em(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.04), latao), Math.cos(i * 0.628) * r, Math.sin(i * 0.628) * r, 0, 0, 0, i * 0.628));
    raiz.add(em(roda, 0.08, y, 0, 0, Math.PI / 2, 0));
  }
  const p = pivo('bobina', raiz, 0, 1.25, 0);
  p.add(bola(0.1, brilho(SOTAQUE.fulguria, 1.21)));
  for (let i = 0; i < 4; i++) faisca(p, new THREE.Vector3(), new THREE.Vector3(Math.cos(i * 1.57) * 0.22, -0.1, Math.sin(i * 1.57) * 0.22), brilho(0xfff3a0, 1.4), 70 + i, 0.006);
  return p;
});

/** O cabo voltaico do Maquinista: a estaca de cobre com o refém amarrado (um vulto encolhido) e o cabo que zumbe. */
export const caboVoltaico = objeto((raiz) => {
  const cobre = metalico(0xb06a3a, 0.35);
  raiz.add(em(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1, 8), cobre), 0, 0.5, -0.1));
  raiz.add(em(bola(0.16, mat(0x4a4640, { roughness: 0.95 }), 1, 1.2, 0.9), 0, 0.28, 0.06));
  raiz.add(em(bola(0.09, mat(0x6a6058)), 0, 0.52, 0.08));
  for (let i = 0; i < 3; i++) raiz.add(em(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 4, 14), cobre), 0, 0.18 + i * 0.12, 0.02, Math.PI / 2, 0, 0));
  const p = pivo('carga', raiz, 0, 1.02, -0.1);
  p.add(bola(0.05, brilho(SOTAQUE.fulguria, 1.32)));
  faisca(raiz, new THREE.Vector3(0, 1, -0.1), new THREE.Vector3(0, 0.5, 0.1), brilho(0xfff3a0, 1.32), 81, 0.006);
  return p;
});

/** O cogumelo-pulmão do Dragão Fermentado: o cogumelo gordo que infla e esvazia (limpa o ar quando cai). */
export const cogumeloPulmao = objeto((raiz) => {
  const p = pivo('pulmao', raiz);
  cogumelo(p, 0.32, mat(0x7a8a3a, { roughness: 0.6, emissive: SOTAQUE.putrevia, emissiveIntensity: 0.15 }), mat(0xd8d0b0), brilho(0xb7f27a, 0.5));
  for (let i = 0; i < 3; i++) raiz.add(em(bola(0.05, mat(0x5a6a2a)), Math.cos(i * 2.1) * 0.25, 0.04, Math.sin(i * 2.1) * 0.25));
  return p;
});

/** O casulo da Mãe-Colmeia: a bolsa de cera e lodo com a larva se mexendo dentro (choca um Enxame). */
export const casulo = objeto((raiz) => {
  const p = pivo('casulo', raiz, 0, 0.3, 0);
  p.add(bola(0.22, mat(0x8a7a3a, { transparent: true, opacity: 0.8, roughness: 0.2, emissive: SOTAQUE.putrevia, emissiveIntensity: 0.25 }), 1, 1.4, 1));
  p.add(em(bola(0.09, mat(0x2a2a18), 1, 1.8, 1), 0, 0, 0));
  for (let i = 0; i < 6; i++) raiz.add(em(cone(0.02, 0.25, mat(0x5f9a3a, { transparent: true, opacity: 0.8 }), 5), Math.cos(i) * 0.12, 0.1, Math.sin(i) * 0.12, 0, 0, Math.cos(i) * 0.6));
  return p;
});

/** O braseiro do Apagador: a taça de ferro em três pés, com o carvão e a chama baixa (aceso pelo golpe). */
export const braseiro = objeto((raiz) => {
  const ferro = metalico(0x2e2c30, 0.6);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    raiz.add(em(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.5, 6), ferro), Math.cos(a) * 0.12, 0.24, Math.sin(a) * 0.12, Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25));
  }
  raiz.add(em(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.14, 12, 1, true), ferro), 0, 0.52, 0));
  raiz.add(em(bola(0.18, mat(0x1c1512), 1, 0.3, 1), 0, 0.56, 0));
  const p = pivo('fogo', raiz, 0, 0.58, 0);
  chama(p, 0.3, SOTAQUE.ignarea);
  return p;
});

/** A coluna antiga do Dragão das Ruínas: o fuste de pedra rachado com o capitel e a base, coberta de musgo. */
export const colunaAntiga = objeto((raiz) => {
  const pedra = mat(0x8a8070, { roughness: 0.95 });
  raiz.add(em(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.5, 12), pedra), 0, 0.85, 0));
  raiz.add(em(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.55), pedra), 0, 0.06, 0));
  raiz.add(em(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.5), pedra), 0, 1.65, 0));
  for (let i = 0; i < 5; i++) raiz.add(em(new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.25, 0.01), mat(0x2a2620)), Math.cos(i) * 0.2, 0.5 + i * 0.2, Math.sin(i) * 0.2, 0, -i, 0.4));
  for (let i = 0; i < 4; i++) raiz.add(em(bola(0.07, mat(0x4a5a2a), 1, 0.4, 1), Math.cos(i * 1.6) * 0.2, 0.15 + i * 0.05, Math.sin(i * 1.6) * 0.2));
  return null;
});

/** O pilar de cristal do Monarca de Geodo: o feixe de cristais lilases de pé sobre a rocha, com o brilho que pulsa. */
export const pilarDeCristal = objeto((raiz) => {
  raiz.add(em(new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), mat(0x5a4c3a, { roughness: 0.95 })), 0, 0.12, 0)).scale.set(1, 0.5, 1);
  const p = pivo('feixe', raiz, 0, 0.2, 0);
  const c = vidro(SOTAQUE.litia, 0.85, 0.7);
  const alto = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), c);
  alto.scale.set(0.12, 0.65, 0.12);
  alto.position.y = 0.6;
  p.add(alto);
  cristais(p, 6, 0.12, 0.45, c, 97, 0.6);
  return p;
});

/** O pedregulho (do Fundeiro e dos chefes de Lítia): a rocha caída, com as lascas em volta. */
export const pedregulho = objeto((raiz) => {
  const r = sorte(13);
  raiz.add(em(new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 1), mat(0x7a6a58, { roughness: 1 })), 0, 0.24, 0, r(), r(), r())).scale.set(1.1, 0.8, 1);
  for (let i = 0; i < 4; i++) raiz.add(em(new THREE.Mesh(new THREE.TetrahedronGeometry(0.06, 0), mat(0x6a5a48)), Math.cos(i * 1.7) * 0.35, 0.03, Math.sin(i * 1.7) * 0.35, r(), r(), r()));
  return null;
});
