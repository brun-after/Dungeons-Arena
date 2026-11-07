// O "falcão" da skin Mágico do Aventureiro (06/11/2026), para o atlas pré-renderizado: a cartola que voa (com a fita
// vermelha), a cartola virada de boca para cima com a mão de luva branca e a varinha saindo de dentro (a magia sai
// dela) e o pombo branco que sai dela nos movimentos do pássaro. Peças rígidas animadas
// por rotação, como o falcão (feras3d.ts). Olham para +z. O jogo troca o modelo em src/render/voo-falcao.ts.

import * as THREE from 'three';
import type { Criatura } from './criaturas3d';

function mat(cor: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: cor, roughness: 0.6, ...o });
}
const ciclo = (f: number, fase = 0) => Math.sin(f * Math.PI * 2 + fase);

/** A cartola: aba larga e curva, copa alta um pouco mais larga em cima, fita vermelha e o forro do topo. */
function chapeu(): THREE.Group {
  const g = new THREE.Group();
  const feltro = mat(0x17161b, { roughness: 0.45, metalness: 0.1 });
  const aba = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 32), feltro);
  aba.scale.set(1, 1, 0.86);
  g.add(aba);
  const copa = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.115, 0.27, 32), feltro);
  copa.position.y = 0.14;
  g.add(copa);
  const fita = new THREE.Mesh(new THREE.CylinderGeometry(0.118, 0.117, 0.05, 32), mat(0xb3202e, { roughness: 0.5 }));
  fita.position.y = 0.035;
  g.add(fita);
  const topo = new THREE.Mesh(new THREE.CylinderGeometry(0.124, 0.124, 0.006, 32), mat(0x2a2830, { roughness: 0.3 }));
  topo.position.y = 0.277;
  g.add(topo);
  return g;
}

/** A mão de luva branca com a varinha preta de ponta branca, saindo da boca da cartola. O pivô é o pulso. */
function maoDaVarinha(): THREE.Group {
  const pulso = new THREE.Group();
  const luva = mat(0xf6f4ee, { roughness: 0.7 });
  const manga = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.12, 12), luva);
  manga.position.y = 0.06;
  pulso.add(manga);
  const mao = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), luva);
  mao.scale.set(1, 1.15, 0.8);
  mao.position.y = 0.14;
  pulso.add(mao);
  const varinha = new THREE.Group();
  varinha.position.set(0, 0.15, 0.02);
  varinha.rotation.x = 0.9;
  pulso.add(varinha);
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 8), mat(0x101014, { roughness: 0.3 }));
  haste.position.y = 0.13;
  varinha.add(haste);
  const ponta = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.05, 8), mat(0xffffff, { emissive: 0xfff3c4, emissiveIntensity: 0.8 }));
  ponta.position.y = 0.27;
  varinha.add(ponta);
  return pulso;
}

/**
 * A cartola que voa. `virada`: de boca para cima (a aba no alto, com o forro escuro da boca) e a mão com a varinha
 * saindo de dentro; o meio da copa fica na mesma altura da cartola em pé (o jogo gira uma até a outra). Paira
 * balançando; no golpe dá um bote; na morte cai.
 */
function cartolaQueVoa(virada: boolean): Criatura {
  const grupo = new THREE.Group();
  const corpo = new THREE.Group();
  grupo.add(corpo);
  const chap = chapeu();
  corpo.add(chap);
  const mao = virada ? maoDaVarinha() : null;
  if (mao) {
    chap.rotation.z = Math.PI;
    chap.position.y = 0.277;
    const boca = new THREE.Mesh(new THREE.CircleGeometry(0.112, 32), mat(0x050507, { roughness: 1 }));
    boca.rotation.x = -Math.PI / 2;
    boca.position.y = 0.284;
    corpo.add(boca);
    mao.position.y = 0.2;
    corpo.add(mao);
  }
  return {
    grupo,
    animar(estado, f) {
      corpo.rotation.set(0, 0, 0);
      corpo.position.set(0, 0.25, 0);
      if (estado === 'parado' || estado === 'conjurar') {
        corpo.position.y = 0.25 + 0.03 * ciclo(f);
        corpo.rotation.z = 0.12 * ciclo(f, Math.PI / 2);
        corpo.rotation.x = 0.06 * ciclo(f);
      } else if (estado === 'andar') {
        corpo.rotation.x = 0.28;
        corpo.position.y = 0.25 + 0.02 * ciclo(f);
      } else if (estado === 'golpe') {
        const m = Math.sin(f * Math.PI);
        corpo.rotation.x = 0.6 * m;
        corpo.position.z = 0.12 * m;
      } else {
        corpo.rotation.z = 1.5 * f;
        corpo.position.y = 0.25 - 0.22 * f;
      }
      // a varinha acena (um oito pequeno)
      if (mao) mao.rotation.set(0.25 * ciclo(f), 0, 0.3 * ciclo(f, Math.PI / 2));
    },
  };
}

/** O pombo: corpo branco redondo, peito cheio, asas brancas de pontas cinza, cauda curta e bico rosado. */
function pomboQueVoa(): Criatura {
  const grupo = new THREE.Group();
  const raiz = new THREE.Group();
  grupo.add(raiz);
  const penas = mat(0xeef0f2, { roughness: 0.8 });
  const pontas = mat(0xa9adb4, { roughness: 0.8 });
  const corpo = new THREE.Group();
  raiz.add(corpo);
  const bola = (r: number, m: THREE.Material, sx = 1, sy = 1, sz = 1) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m);
    b.scale.set(sx, sy, sz);
    return b;
  };
  corpo.add(bola(0.1, penas, 1, 0.95, 1.6));
  const peito = bola(0.085, penas, 1.05, 1.05, 1.1);
  peito.position.set(0, -0.01, 0.07);
  corpo.add(peito);
  const cabeca = new THREE.Group();
  cabeca.position.set(0, 0.08, 0.15);
  corpo.add(cabeca);
  cabeca.add(bola(0.058, penas));
  const bico = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.045, 6), mat(0xe6a39a, { roughness: 0.4 }));
  bico.rotation.x = Math.PI / 2 + 0.3;
  bico.position.set(0, -0.01, 0.065);
  cabeca.add(bico);
  for (const s of [-1, 1]) {
    const olho = bola(0.011, mat(0x111111, { roughness: 0.2 }));
    olho.position.set(s * 0.034, 0.015, 0.04);
    cabeca.add(olho);
  }
  const cauda = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.12), penas);
  cauda.position.set(0, 0.01, -0.19);
  corpo.add(cauda);
  const asas: { ombro: THREE.Group; ponta: THREE.Group; lado: number }[] = [];
  for (const lado of [-1, 1]) {
    const ombro = new THREE.Group();
    ombro.position.set(lado * 0.07, 0.04, 0.01);
    corpo.add(ombro);
    const braco = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.016, 0.12), penas);
    braco.position.x = lado * 0.1;
    ombro.add(braco);
    const ponta = new THREE.Group();
    ponta.position.x = lado * 0.2;
    ombro.add(ponta);
    const pena = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.1), pontas);
    pena.position.set(lado * 0.08, 0, -0.015);
    ponta.add(pena);
    asas.push({ ombro, ponta, lado });
  }
  return {
    grupo,
    animar(estado, f) {
      raiz.rotation.set(0, 0, 0);
      corpo.rotation.set(0, 0, 0);
      corpo.position.set(0, 0.35, 0);
      const bater = (amplo: number) => {
        for (const a of asas) {
          const v = ciclo(f);
          a.ombro.rotation.set(0, 0, a.lado * amplo * v);
          a.ponta.rotation.set(0, 0, a.lado * amplo * 0.6 * v);
        }
      };
      if (estado === 'parado' || estado === 'conjurar') bater(0.5);
      else if (estado === 'andar') {
        bater(0.8);
        corpo.rotation.x = 0.15;
      } else if (estado === 'golpe') {
        const m = Math.sin(f * Math.PI);
        corpo.rotation.x = 0.7 * m;
        corpo.position.z = 0.15 * m;
        for (const a of asas) {
          a.ombro.rotation.set(0, -a.lado * 0.9 * m, a.lado * 0.3);
          a.ponta.rotation.set(0, 0, 0);
        }
      } else {
        raiz.rotation.z = 1.4 * f;
        corpo.position.y = 0.35 - 0.25 * f;
      }
    },
  };
}

export const cartola = (): Criatura => cartolaQueVoa(false);
export const cartolaMagica = (): Criatura => cartolaQueVoa(true);
export const pombo = (): Criatura => pomboQueVoa();
