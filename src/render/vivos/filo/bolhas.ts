// Marco 45 (16/11/2026, D-181): os fofos de Filo sem pernas de verdade (bolhas que pulam), feitos do zero. Os olhos
// grandes de criança e a cor da dimensão no que brilha (a brasa, o gelo, o lodo, a vela), nunca no corpo todo.

import * as THREE from 'three';
import { animarBolha, bola, brilho, chama, ciclo, cone, cristais, em, floco, mat, olhos, osso, pivo, raizDe, SOTAQUE, suave, vidro, type Fera } from './kit';

/** O Tiçãozinho (Ignárea): a brasa redonda de casca preta rachada, as rachaduras acesas, a chaminha na cabeça e as
 * perninhas de carvão. Ferido, foge (a chama encolhe). */
export function ticaozinho(): Fera {
  const { grupo, raiz } = raizDe();
  const corpo = pivo('corpo', raiz);
  const casca = mat(0x4a3428, { roughness: 0.9 });
  const brasa = brilho(SOTAQUE.ignarea, 1.21);
  corpo.add(em(bola(0.24, casca, 1, 0.92, 1), 0, 0.26, 0));
  // As rachaduras: faixas acesas em volta do carvão.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const fenda = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.2, 0.012), brasa);
    em(fenda, Math.cos(a) * 0.235, 0.26, Math.sin(a) * 0.235, 0, -a, 0.3 * ciclo(i / 7));
    corpo.add(fenda);
  }
  corpo.add(em(bola(0.12, brasa, 1.2, 0.5, 1.2), 0, 0.08, 0));
  olhos(corpo, { x: 0.09, y: 0.3, z: 0.21, r: 0.06, fofo: true });
  const topo = pivo('topo', corpo, 0, 0.47, 0);
  chama(topo, 0.22, SOTAQUE.ignarea);
  const bracos = [-1, 1].map((s) => {
    const b = pivo(s < 0 ? 'bracoE' : 'bracoD', corpo, s * 0.2, 0.24, 0.04);
    b.add(osso(0.03, 0.12, casca, 0.025));
    b.add(em(bola(0.035, brasa), 0, -0.13, 0));
    return b;
  });
  for (const s of [-1, 1]) corpo.add(em(bola(0.05, casca, 1, 0.7, 1.3), s * 0.1, 0.03, 0.03));
  return { grupo, animar: (e, f) => { animarBolha({ raiz, corpo, topo, bracos }, e, f, { pulo: 0.2 }); } };
}

/** O Floquinho (Hiemália): a bola de neve gorda, o nariz de pingente de gelo, os bracinhos de galho geado e o floco na
 * testa; de longe, vira bola e rola (a animação do golpe é o giro). */
export function floquinho(): Fera {
  const { grupo, raiz } = raizDe();
  const corpo = pivo('corpo', raiz);
  // O giro da bola é em volta do centro dela (não dos pés): tudo vai num pivô no meio do corpo.
  const giro = pivo('giro', corpo, 0, 0.3, 0);
  const dentro = new THREE.Group();
  dentro.position.y = -0.3;
  giro.add(dentro);
  const neve = mat(0xe8f2fa, { roughness: 0.9 });
  const gelo = vidro(SOTAQUE.hiemalia, 0.8, 0.5);
  dentro.add(em(bola(0.26, neve), 0, 0.26, 0));
  dentro.add(em(bola(0.17, neve), 0, 0.56, 0.02));
  olhos(dentro, { x: 0.06, y: 0.6, z: 0.15, r: 0.035, fofo: true });
  dentro.add(em(cone(0.025, 0.12, gelo), 0, 0.55, 0.2, Math.PI / 2));
  const topo = pivo('topo', dentro, 0, 0.74, 0.02);
  floco(topo, 0.07, gelo);
  const galho = mat(0x4a3a2c);
  const bracos = [-1, 1].map((s) => {
    const b = pivo(s < 0 ? 'bracoE' : 'bracoD', dentro, s * 0.24, 0.32, 0);
    const g = osso(0.012, 0.2, galho, 0.006);
    g.rotation.z = s * 0.9;
    b.add(g);
    cristais(b, 3, 0.03, 0.04, gelo, 11 + s, 0.4);
    return b;
  });
  // Os botões de pedrinha na barriga.
  for (let i = 0; i < 3; i++) dentro.add(em(bola(0.02, mat(0x2a2a30)), 0, 0.18 + i * 0.08, 0.25 - Math.abs(i - 1) * 0.01));
  return {
    grupo,
    animar(e, f) {
      animarBolha({ raiz, corpo, topo, bracos }, e, f, { pulo: 0.1 });
      giro.rotation.x = e === 'golpe' || e === 'golpe2' || e === 'golpe3' ? f * Math.PI * 4 : 0;
    },
  };
}

/** O Gosminho (Putrévia): a gota de lodo translúcida com bolhas e ossinhos dentro, o olhar sonolento e a borda que
 * escorre; ferido, se divide (o atlas é o mesmo). */
export function gosminho(): Fera {
  const { grupo, raiz } = raizDe();
  const corpo = pivo('corpo', raiz);
  const geo = new THREE.SphereGeometry(0.3, 24, 16);
  const p = geo.attributes.position;
  if (p) {
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setY(i, y < -0.15 ? -0.15 - (y + 0.15) * 0.2 : y * (y > 0.2 ? 0.85 : 1));
    }
    geo.computeVertexNormals();
  }
  const lodo = mat(0x5f9a3a, { transparent: true, opacity: 0.82, roughness: 0.12, emissive: SOTAQUE.putrevia, emissiveIntensity: 0.25 });
  corpo.add(em(new THREE.Mesh(geo, lodo), 0, 0.2, 0));
  const dentro = mat(0x2f4a1f, { roughness: 0.5 });
  corpo.add(em(bola(0.06, mat(0xd8d0b0), 1.6, 0.4, 0.5), 0.05, 0.15, -0.05, 0, 0, 0.6));
  for (let i = 0; i < 6; i++) corpo.add(em(bola(0.02 + (i % 3) * 0.01, brilho(0xb7f27a, 0.44, { transparent: true, opacity: 0.7 })), Math.cos(i * 2.1) * 0.15, 0.1 + (i % 3) * 0.1, Math.sin(i * 2.1) * 0.15));
  corpo.add(em(bola(0.08, dentro), -0.06, 0.12, 0.02));
  olhos(corpo, { x: 0.1, y: 0.3, z: 0.25, r: 0.045, fofo: true });
  // As pálpebras caídas (o olhar de sono).
  for (const s of [-1, 1]) corpo.add(em(bola(0.05, lodo, 1, 0.5, 0.7), s * 0.1, 0.34, 0.25));
  const topo = pivo('topo', corpo, 0, 0.42, 0);
  topo.add(em(bola(0.05, lodo, 1, 1.6, 1), 0.02, 0.02, 0));
  return { grupo, animar: (e, f) => { animarBolha({ raiz, corpo, topo }, e, f); } };
}

/** O Breuzinho (Umbrália): o novelo de breu que não reflete luz, com fiapos que fogem dele e dois olhos violeta enormes;
 * bebe a luz das tochas (os olhos crescem ao conjurar). */
export function breuzinho(): Fera {
  const { grupo, raiz } = raizDe();
  const corpo = pivo('corpo', raiz);
  const breu = mat(0x07060a, { roughness: 1 });
  corpo.add(em(bola(0.25, breu, 1, 0.95, 1), 0, 0.27, 0));
  for (let i = 0; i < 14; i++) {
    const a = i * 2.39;
    const y = 0.1 + ((i * 37) % 10) / 22;
    const fiapo = cone(0.035, 0.16, breu, 5);
    em(fiapo, Math.cos(a) * 0.22, y, Math.sin(a) * 0.22, Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2);
    corpo.add(fiapo);
  }
  const topo = pivo('topo', corpo, 0, 0.32, 0.18);
  for (const s of [-1, 1]) {
    topo.add(em(bola(0.07, brilho(SOTAQUE.umbralia, 1.21), 1, 1.2, 0.5), s * 0.09, 0, 0.02));
    topo.add(em(bola(0.03, brilho(0xe6d8ff, 1.4), 1, 1.2, 0.5), s * 0.09, 0.005, 0.05));
  }
  return { grupo, animar: (e, f) => { animarBolha({ raiz, corpo, topo }, e, f, { pulo: 0.12 }); } };
}

/** O Sonequinha (Oníria): o carneirinho-nuvem que cochila, de lã em tufos lilás-claro, a carinha escura de olhos
 * fechados, os chifrinhos em caracol e o gorro de dormir com a estrela; dormindo, cura os outros (o pulso do conjurar). */
export function sonequinha(): Fera {
  const { grupo, raiz } = raizDe();
  const corpo = pivo('corpo', raiz);
  const la = mat(0xeee4ff, { roughness: 1 });
  for (let i = 0; i < 11; i++) {
    const a = i * 1.7;
    corpo.add(em(bola(0.11 + (i % 3) * 0.02, la), Math.cos(a) * 0.15, 0.2 + ((i * 7) % 5) * 0.035, Math.sin(a) * 0.13));
  }
  const cara = mat(0x3a3048, { roughness: 0.7 });
  const cabeca = pivo('cabeca', corpo, 0, 0.26, 0.2);
  cabeca.add(bola(0.1, cara, 0.9, 1, 0.9));
  for (const s of [-1, 1]) {
    const fechado = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 4, 10, Math.PI), mat(0xf0e8ff));
    cabeca.add(em(fechado, s * 0.04, 0.02, 0.085, 0, 0, Math.PI));
    const chifre = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 12, Math.PI * 1.5), mat(0xc8b8a0));
    cabeca.add(em(chifre, s * 0.08, 0.06, -0.01, 0, Math.PI / 2, 0));
  }
  const topo = pivo('topo', cabeca, 0, 0.08, -0.02);
  const gorro = cone(0.08, 0.2, mat(0x6a4a9a), 10);
  topo.add(em(gorro, 0, 0.08, -0.03, -0.6));
  topo.add(em(bola(0.03, brilho(SOTAQUE.oniria, 0.99)), 0, 0.12, -0.13));
  for (const s of [-1, 1]) for (const z of [-0.08, 0.1]) corpo.add(em(osso(0.025, 0.09, cara, 0.02), s * 0.08, 0.1, z));
  return { grupo, animar: (e, f) => { animarBolha({ raiz, corpo, topo }, e, f, { pulo: 0.08, derrete: false }); } };
}

/** A Candelinha (Halônia): a velinha de cera com a chama-rosto, a cera escorrida e o pires de latão; caminha
 * miudinho e acende quem se esconde (o pulso do conjurar). */
export function candelinha(): Fera {
  const { grupo, raiz } = raizDe();
  const corpo = pivo('corpo', raiz);
  const cera = mat(0xf2e8d0, { roughness: 0.55 });
  const latao = mat(0x8a6a3a, { metalness: 0.85, roughness: 0.35 });
  corpo.add(em(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 18), latao), 0, 0.04, 0));
  corpo.add(em(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.34, 16), cera), 0, 0.25, 0));
  for (let i = 0; i < 5; i++) {
    const a = i * 1.25;
    corpo.add(em(bola(0.03, cera, 0.8, 2, 0.8), Math.cos(a) * 0.1, 0.32 - (i % 3) * 0.05, Math.sin(a) * 0.1));
  }
  olhos(corpo, { x: 0.04, y: 0.33, z: 0.095, r: 0.022, fofo: true });
  const topo = pivo('topo', corpo, 0, 0.42, 0);
  topo.add(em(osso(0.005, 0.03, mat(0x1a1a1a), 0.005), 0, 0.03, 0));
  chama(topo, 0.16, SOTAQUE.halonia, 0xffffff);
  const alca = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI), latao);
  corpo.add(em(alca, 0.17, 0.05, 0, Math.PI / 2, 0, -Math.PI / 2));
  return {
    grupo,
    animar(e, f) {
      animarBolha({ raiz, corpo, topo }, e, f, { pulo: 0.06, derrete: true });
      topo.rotation.z = 0.12 * ciclo(f * 3);
      if (e === 'morte') topo.scale.setScalar(1 - suave(f));
    },
  };
}
