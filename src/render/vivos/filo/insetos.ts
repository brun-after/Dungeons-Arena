// Marco 45 (16/11/2026, D-181): os insetos e as aranhas de Filo, feitos do zero: o Zunzum (o fofo de Fulgúria), a
// Bobinadora (a aranha-bobina), a Tecelã do Vazio, o Enxame Pútrido e a Mãe-Colmeia (a governante de Putrévia).

import * as THREE from 'three';
import { animarInseto, arco, bola, brilho, ciclo, cone, em, faisca, mat, metalico, olhos, osso, patasDeInseto, pivo, raizDe, SOTAQUE, sorte, suave, vidro, type Fera } from './kit';

/** As asas de película (o Zunzum, a Mãe-Colmeia), presas em pivôs nas costas. */
function asasDePelicula(pai: THREE.Object3D, compr: number, m: THREE.Material, y: number, z: number, pares = 1): THREE.Group[] {
  const saida: THREE.Group[] = [];
  for (let k = 0; k < pares; k++) for (const s of [-1, 1]) {
    const a = pivo(`asa${String(k)}${s > 0 ? 'd' : 'e'}`, pai, s * 0.04, y, z - k * compr * 0.3);
    const geo = new THREE.SphereGeometry(compr / 2, 12, 8);
    geo.scale(1, 0.05, 0.42);
    geo.translate(s * compr / 2, 0, 0);
    a.add(new THREE.Mesh(geo, m));
    a.rotation.y = s * -0.3 * (k + 1);
    saida.push(a);
  }
  return saida;
}

/** O Zunzum (Fulgúria): o besourinho redondo de listras escuras e amarelo-faísca, as antenas com bolinhas acesas e as
 * asinhas que zumbem; a linha entre dois Zunzuns é o elo (no jogo, do traço). */
export function zunzum(): Fera {
  const { grupo, raiz } = raizDe();
  const tronco = pivo('tronco', raiz);
  const preto = mat(0x1e1a14, { roughness: 0.5 });
  const listra = mat(0xd8b030, { roughness: 0.45, emissive: SOTAQUE.fulguria, emissiveIntensity: 0.35 });
  for (let i = 0; i < 4; i++) tronco.add(em(bola(0.14 - i * 0.012, i % 2 ? preto : listra, 1, 1, 0.5), 0, 0, -0.05 - i * 0.055));
  const cabeca = pivo('cabeca', tronco, 0, 0.03, 0.1);
  cabeca.add(bola(0.1, preto));
  olhos(cabeca, { x: 0.05, y: 0.02, z: 0.07, r: 0.035, fofo: true });
  for (const s of [-1, 1]) {
    const ant = pivo(s > 0 ? 'antenaD' : 'antenaE', cabeca, s * 0.04, 0.08, 0.02);
    const haste = osso(0.006, 0.1, preto, 0.004);
    haste.rotation.set(Math.PI - 0.4, 0, s * 0.4);
    ant.add(haste);
    ant.add(em(bola(0.022, brilho(SOTAQUE.fulguria, 1.32)), s * 0.04, 0.09, 0.03));
  }
  const asas = asasDePelicula(tronco, 0.18, vidro(0xfff3a0, 0.45, 0.4), 0.1, -0.06);
  const patas = patasDeInseto(tronco, 3, 0.12, 0.008, preto, 0.9);
  const ferrao = cone(0.02, 0.07, brilho(SOTAQUE.fulguria, 0.66), 6);
  tronco.add(em(ferrao, 0, -0.01, -0.27, -Math.PI / 2));
  return { grupo, animar: (e, f) => { animarInseto({ raiz, tronco, cabeca, patas, asas, voa: true, altura: 0.42 }, e, f); } };
}

/** A Bobinadora (Fulgúria): a aranha de cobre com o abdome de bobina enrolada, os isoladores de porcelana nas costas e
 * a faísca que pula entre eles; planta as pernas e dispara (a torre). */
export function bobinadora(): Fera {
  const { grupo, raiz } = raizDe();
  const tronco = pivo('tronco', raiz);
  const cobre = metalico(0xb06a3a, 0.35);
  const ferro = metalico(0x2e2c30, 0.6);
  const porcelana = mat(0xe8e4dc, { roughness: 0.3 });
  const raio = brilho(SOTAQUE.fulguria, 1.4);
  tronco.add(em(bola(0.13, ferro, 1, 0.7, 1.1), 0, 0, 0.05));
  const abdome = new THREE.Group();
  abdome.position.set(0, 0.06, -0.2);
  for (let i = 0; i < 9; i++) abdome.add(em(new THREE.Mesh(new THREE.TorusGeometry(0.13 - Math.abs(i - 4) * 0.018, 0.018, 6, 18), cobre), 0, 0, (i - 4) * 0.032));
  abdome.add(em(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 12), ferro), 0, 0, 0, Math.PI / 2));
  tronco.add(abdome);
  for (const s of [-1, 1]) {
    const iso = new THREE.Group();
    for (let k = 0; k < 3; k++) iso.add(em(new THREE.Mesh(new THREE.CylinderGeometry(0.028 - k * 0.004, 0.03 - k * 0.004, 0.025, 10), porcelana), 0, k * 0.028, 0));
    iso.position.set(s * 0.07, 0.18, -0.18);
    tronco.add(iso);
  }
  faisca(tronco, new THREE.Vector3(-0.07, 0.27, -0.18), new THREE.Vector3(0.07, 0.27, -0.18), raio, 5, 0.008);
  const cabeca = pivo('cabeca', tronco, 0, 0.02, 0.17);
  cabeca.add(bola(0.07, ferro, 1, 0.8, 1));
  for (let i = 0; i < 4; i++) cabeca.add(em(bola(0.014, brilho(SOTAQUE.fulguria, 1.1)), (i - 1.5) * 0.025, 0.04, 0.055));
  for (const s of [-1, 1]) cabeca.add(em(cone(0.012, 0.06, cobre), s * 0.03, -0.04, 0.06, Math.PI / 2 + 0.4));
  const patas = patasDeInseto(tronco, 4, 0.36, 0.013, ferro, 0.2, cobre);
  return { grupo, animar: (e, f) => { animarInseto({ raiz, tronco, cabeca, patas, asas: [], voa: false, altura: 0.18 }, e, f); } };
}

/** A Tecelã do Vazio (Umbrália): a aranha grande de quitina negro-violeta, o abdome com o desenho de um olho que pisca
 * e as pernas longas de pontas pálidas; a teia sai da fiandeira (o conjurar ergue o abdome). */
export function tecelaDoVazio(): Fera {
  const { grupo, raiz } = raizDe();
  const tronco = pivo('tronco', raiz);
  const quitina = mat(0x1a1424, { roughness: 0.35, metalness: 0.2 });
  const palido = mat(0xb8b0c8, { roughness: 0.6 });
  const vazio = brilho(SOTAQUE.umbralia, 1.1);
  tronco.add(em(bola(0.13, quitina, 1, 0.75, 1.15), 0, 0, 0.04));
  const abdome = pivo('abdome', tronco, 0, 0.07, -0.12);
  abdome.add(em(bola(0.22, quitina, 1, 0.85, 1.15), 0, 0.04, -0.15));
  abdome.add(em(bola(0.07, vazio, 1, 0.6, 0.3), 0, 0.14, -0.13, -0.9));
  abdome.add(em(bola(0.03, mat(0x050407)), 0, 0.155, -0.12, -0.9));
  for (let i = 0; i < 8; i++) abdome.add(em(cone(0.012, 0.05, palido, 5), Math.cos(i) * 0.15, 0.12 + Math.sin(i * 3) * 0.04, -0.15 + Math.sin(i) * 0.14, -0.8, 0, Math.cos(i) * 0.5));
  const cabeca = pivo('cabeca', tronco, 0, 0.02, 0.17);
  cabeca.add(bola(0.075, quitina));
  for (let i = 0; i < 6; i++) cabeca.add(em(bola(i < 2 ? 0.02 : 0.012, vazio), (i % 3 - 1) * 0.03, 0.03 + Math.floor(i / 3) * 0.025, 0.06));
  for (const s of [-1, 1]) cabeca.add(em(cone(0.015, 0.08, palido), s * 0.03, -0.05, 0.06, Math.PI / 2 + 0.5));
  const patas = patasDeInseto(tronco, 4, 0.5, 0.014, quitina, 0.35, palido);
  return {
    grupo,
    animar(e, f) {
      animarInseto({ raiz, tronco, cabeca, patas, asas: [], voa: false, altura: 0.22 }, e, f);
      abdome.rotation.set(e === 'conjurar' ? -0.6 * suave(f * 2) : 0.04 * ciclo(f), 0, 0);
    },
  };
}

/** O Enxame Pútrido (Putrévia): a nuvem de moscas gordas de asas foscas em volta de um miolo de podridão que pinga;
 * a nuvem gira e se abre no golpe (cada mosca tem o próprio pivô). */
export function enxamePutrido(): Fera {
  const { grupo, raiz } = raizDe();
  const miolo = pivo('miolo', raiz, 0, 0.5, 0);
  const podre = mat(0x3a3a1c, { roughness: 0.6, emissive: SOTAQUE.putrevia, emissiveIntensity: 0.2 });
  miolo.add(bola(0.1, podre, 1, 0.9, 1));
  for (let i = 0; i < 4; i++) miolo.add(em(bola(0.02, brilho(0xb7f27a, 0.39)), Math.cos(i * 1.6) * 0.09, -0.07, Math.sin(i * 1.6) * 0.09));
  const r = sorte(91);
  const moscas: { p: THREE.Group; raio: number; alt: number; fase: number; vel: number }[] = [];
  const corpo = mat(0x1e2414, { roughness: 0.4, metalness: 0.3 });
  const asa = vidro(0xc8d8b0, 0.35, 0.1);
  for (let i = 0; i < 18; i++) {
    const p = pivo(`mosca${String(i)}`, miolo);
    const m = new THREE.Group();
    m.add(bola(0.03, corpo, 1, 0.8, 1.4));
    m.add(em(bola(0.018, brilho(0xd04030, 0.44)), 0, 0.01, 0.035));
    for (const s of [-1, 1]) m.add(em(bola(0.03, asa, 1, 0.08, 0.5), s * 0.03, 0.02, -0.01, 0, 0, s * 0.4));
    p.add(m);
    moscas.push({ p, raio: 0.12 + r() * 0.22, alt: (r() - 0.5) * 0.4, fase: r() * Math.PI * 2, vel: 1 + Math.floor(r() * 2) });
  }
  return {
    grupo,
    animar(e, f) {
      raiz.position.set(0, 0, 0);
      raiz.rotation.set(0, 0, 0);
      const abre = e === 'golpe' || e === 'golpe2' || e === 'golpe3' ? 1 + 0.6 * arco(f) : e === 'conjurar' ? 1.3 : 1;
      const cai = e === 'morte' ? suave(f) : 0;
      miolo.position.set(0, 0.5 - 0.42 * cai + 0.03 * ciclo(f), e === 'golpe' ? 0.15 * arco(f) : 0);
      for (const m of moscas) {
        const a = m.fase + f * Math.PI * 2 * m.vel;
        m.p.position.set(Math.cos(a) * m.raio * abre * (1 + cai), m.alt * (1 - cai) + 0.05 * ciclo(f * m.vel, m.fase) - cai * 0.3, Math.sin(a) * m.raio * abre * (1 + cai));
        m.p.rotation.set(0, -a, 0);
      }
    },
  };
}

/** A Mãe-Colmeia (governante de Putrévia): a rainha inchada, o abdome enorme de cera e lodo com os casulos colados, o
 * tórax de quitina com coroa de espinhos, as seis patas e as quatro asas rasgadas. */
export function maeColmeia(): Fera {
  const { grupo, raiz } = raizDe();
  const tronco = pivo('tronco', raiz);
  const quitina = mat(0x2a2a18, { roughness: 0.3, metalness: 0.25 });
  const cera = mat(0x8a7a3a, { roughness: 0.65, emissive: SOTAQUE.putrevia, emissiveIntensity: 0.12 });
  const lodo = mat(0x5f9a3a, { transparent: true, opacity: 0.85, roughness: 0.15, emissive: SOTAQUE.putrevia, emissiveIntensity: 0.3 });
  tronco.add(em(bola(0.3, quitina, 1, 0.85, 1.1), 0, 0.1, 0.15));
  const abdome = pivo('abdome', tronco, 0, 0.15, -0.15);
  abdome.add(em(bola(0.55, cera, 1, 0.8, 1.35), 0, 0.05, -0.55));
  for (let i = 0; i < 6; i++) abdome.add(em(new THREE.Mesh(new THREE.TorusGeometry(0.5 - Math.abs(i - 2.5) * 0.07, 0.025, 6, 24), quitina), 0, 0.05, -0.25 - i * 0.12, 0, 0, 0));
  const r = sorte(17);
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2;
    const casulo = bola(0.07, lodo, 1, 1.5, 1);
    em(casulo, Math.cos(a) * 0.42, 0.15 + r() * 0.3, -0.5 + Math.sin(a) * 0.5, r(), 0, r());
    abdome.add(casulo);
  }
  const cabeca = pivo('cabeca', tronco, 0, 0.22, 0.48);
  cabeca.add(bola(0.17, quitina, 1, 0.9, 1));
  olhos(cabeca, { x: 0.09, y: 0.04, z: 0.1, r: 0.06, cor: SOTAQUE.putrevia, forca: 1.8 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 6 - 0.5) * 2.2;
    cabeca.add(em(cone(0.02, 0.18, quitina), Math.sin(a) * 0.12, 0.17, -0.02 + Math.cos(a) * -0.03, -0.3, 0, -a * 0.5));
  }
  for (const s of [-1, 1]) {
    const mandibula = cone(0.03, 0.16, mat(0x6a5a2a), 6);
    cabeca.add(em(mandibula, s * 0.06, -0.1, 0.12, Math.PI / 2 + 0.6, 0, s * 0.3));
  }
  const asas = asasDePelicula(tronco, 0.75, vidro(0xc8d8a0, 0.3, 0.08), 0.35, 0, 2);
  const patas = patasDeInseto(tronco, 3, 0.75, 0.03, quitina, 0.25, mat(0x6a5a2a));
  return {
    grupo,
    animar(e, f) {
      animarInseto({ raiz, tronco, cabeca, patas, asas, voa: false, altura: 0.55 }, e, f);
      for (const [k, a] of asas.entries()) a.rotation.z = (k % 2 ? -1 : 1) * (0.2 + 0.15 * Math.abs(ciclo(f * 3, k)));
      abdome.scale.setScalar(e === 'conjurar' ? 1 + 0.08 * Math.abs(ciclo(f * 2)) : 1 + 0.02 * ciclo(f));
    },
  };
}
