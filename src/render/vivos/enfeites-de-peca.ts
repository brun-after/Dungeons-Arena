// Os enfeites do estilo e da marca nas peças 3D (marco 46, 16/11/2026, D-186). O propósito dá a silhueta (o kit,
// armaduras-sombrias.ts); por cima dele:
// - o ESTILO, a persona (só visual): simples (sem enfeite, tons apagados), medieval (cravos de latão e o pano em cor
//   heráldica), colorida (o pano numa cor viva da semente), arcana (runas acesas nas bordas) e meme (um enfeite absurdo
//   e leve: o patinho no elmo, a flor no peito, o guizo na capa, o pompom na bota);
// - a MARCA do efeito, para a peça se reconhecer pelo que faz: espinhos (reflexo), garras (corpo a corpo), penas
//   (velocidade), filigrana (magia), brasa (o elemento) e placas (sem enfeite).
// Os pontos de cada peça são os de destaque (o gorjal, os ombros, a barra da capa, os punhos, os joelhos, os pés).

import * as THREE from 'three';
import type { PecaDeArmadura } from '../../progression/graus';
import { hashTexto } from '../../core/rng';
import { aceso, anel, chifre, comuns, Corpo, esfera, grupoEm, liso, V, type PecaSombria } from './sombrio-base';

type Saida = THREE.Object3D[];
const LADOS = ['l', 'r'] as const;

/** Os ossos dos pontos de destaque de cada peça (dos dois lados quando o nome leva `*`). */
const PONTOS: Readonly<Record<PecaDeArmadura, readonly string[]>> = {
  cabeca: ['Head'],
  corpo: ['upperarm_*', 'spine_03'],
  capa: ['neck_01', 'spine_02'],
  maos: ['hand_*', 'lowerarm_*'],
  pernas: ['calf_*'],
  pes: ['foot_*'],
};
const pontosDe = (peca: PecaDeArmadura): string[] => PONTOS[peca].flatMap((o) => (o.endsWith('*') ? LADOS.map((l) => o.replace('*', l)) : [o]));

/** Um enfeite pequeno, no osso, com o deslocamento em metros do esqueleto. */
function noOsso(c: Corpo, osso: string, o: THREE.Object3D, saida: Saida, desloca = V()): void {
  const g = grupoEm(c, c.p(osso).add(desloca.multiplyScalar(c.u)));
  g.add(o);
  c.prender(osso, g, saida);
}

// ---------- estilo ----------

/** Troca a cor dos panos (os materiais com textura e pouco metal) por um tom; o material é clonado. */
function tingirPanos(objetos: readonly THREE.Object3D[], cor: THREE.Color, mistura: number): void {
  const feitos = new Map<THREE.Material, THREE.Material>();
  const trocar = (m: THREE.Material): THREE.Material => {
    if (!(m instanceof THREE.MeshStandardMaterial) || !m.map || m.metalness > 0.5) return m;
    const pronto = feitos.get(m);
    if (pronto) return pronto;
    const novo = m.clone();
    novo.color.lerp(cor, mistura);
    feitos.set(m, novo);
    return novo;
  };
  for (const o of objetos) o.traverse((x) => {
    if (x instanceof THREE.Mesh) x.material = Array.isArray(x.material) ? x.material.map(trocar) : trocar(x.material as THREE.Material);
  });
}

const HERALDICAS = [0x7a1418, 0x173a7a, 0x1d5a2a, 0x6a5a14] as const;
const VIVAS = [0xd8343c, 0x2f7de0, 0x3cc05a, 0xe0b020, 0xb048d8, 0x20c0c0, 0xe0702a] as const;

function meme(c: Corpo, peca: PecaDeArmadura, saida: Saida): void {
  const amarelo = liso(0xf2d23c, 0.6), laranja = liso(0xf08a24, 0.6), rosa = liso(0xf27ab8, 0.7);
  if (peca === 'cabeca') {
    // o patinho de borracha no alto do elmo
    const pato = new THREE.Group();
    const corpoP = new THREE.Mesh(esfera(0.05, 12, 8), amarelo);
    corpoP.scale.set(1.2, 0.8, 1);
    const cab = new THREE.Mesh(esfera(0.032, 12, 8), amarelo);
    cab.position.set(0.04, 0.045, 0);
    const bico = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.035, 6), laranja);
    bico.rotation.z = -Math.PI / 2;
    bico.position.set(0.078, 0.042, 0);
    pato.add(corpoP, cab, bico);
    pato.rotation.y = -Math.PI / 2;
    noOsso(c, 'Head', pato, saida, V(0, 0.3, 0));
  } else if (peca === 'corpo' || peca === 'maos') {
    // a flor (no peito, ou presa no punho)
    const flor = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(esfera(0.018, 8, 6), rosa);
      const a = (i / 5) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.022, Math.sin(a) * 0.022, 0);
      flor.add(p);
    }
    flor.add(new THREE.Mesh(esfera(0.014, 8, 6), amarelo));
    if (peca === 'corpo') noOsso(c, 'spine_03', flor, saida, V(0.08, 0.05, 0.16));
    else for (const l of LADOS) noOsso(c, `hand_${l}`, flor.clone(), saida, V(0, 0, 0.05));
  } else if (peca === 'capa') {
    const guizo = new THREE.Mesh(esfera(0.035, 12, 8), comuns().ouro);
    noOsso(c, 'spine_02', guizo, saida, V(0, -0.35, -0.2));
  } else {
    // o pompom colorido (na bota) e as meias listradas (na perneira)
    for (const l of LADOS) {
      if (peca === 'pes') noOsso(c, `foot_${l}`, new THREE.Mesh(esfera(0.035, 10, 8), rosa), saida, V(0, 0.05, 0.08));
      else for (let i = 0; i < 3; i++) {
        const faixa = anel(0.06, 0.008, i % 2 ? amarelo : rosa);
        faixa.rotation.x = Math.PI / 2;
        noOsso(c, `calf_${l}`, faixa, saida, V(0, -0.05 - i * 0.04, 0));
      }
    }
  }
}

/** O estilo da peça (a persona): tinge os panos e acrescenta os enfeites dele. */
export function estilizar(c: Corpo, peca: PecaDeArmadura, estilo: string, semente: string, base: PecaSombria): Saida {
  const saida: Saida = [];
  const n = hashTexto(semente);
  const todos = [...base.extras, ...(base.tecido ? [new THREE.Mesh(undefined, base.tecido)] : [])];
  if (estilo === 'simples') tingirPanos(todos, new THREE.Color(0x6a665e), 0.35);
  else if (estilo === 'colorida') tingirPanos(todos, new THREE.Color(VIVAS[n % VIVAS.length] ?? 0xd8343c), 0.55);
  else if (estilo === 'medieval') {
    tingirPanos(todos, new THREE.Color(HERALDICAS[n % HERALDICAS.length] ?? 0x7a1418), 0.45);
    // os cravos de latão nos pontos de destaque
    for (const osso of pontosDe(peca)) noOsso(c, osso, new THREE.Mesh(esfera(0.016, 8, 6), comuns().latao), saida, V(0, 0.02, 0.07));
  } else if (estilo === 'arcana') {
    const runa = aceso(0x8a7cff, 1.6);
    for (const osso of pontosDe(peca)) {
      const aro = anel(peca === 'cabeca' ? 0.13 : 0.07, 0.005, runa);
      aro.rotation.x = Math.PI / 2;
      noOsso(c, osso, aro, saida, V(0, peca === 'cabeca' ? 0.16 : 0, 0));
    }
  } else if (estilo === 'meme') meme(c, peca, saida);
  // o tecido tingido volta ao kit (o traje por baixo pega a cor nova)
  const tecido = todos.at(-1);
  if (base.tecido && tecido instanceof THREE.Mesh) base.tecido = tecido.material as THREE.Material;
  return saida;
}

// ---------- marca do efeito ----------

/** A marca do efeito nos pontos da peça (cresce um pouco com o grau). */
export function marcar(c: Corpo, peca: PecaDeArmadura, marca: string, grau: number, cor: number | null): Saida {
  const saida: Saida = [];
  const k = 0.8 + grau * 0.08;
  const ferro = comuns().ferro;
  for (const osso of pontosDe(peca)) {
    const lado = osso.endsWith('_r') ? -1 : 1;
    if (marca === 'espinhos') {
      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.012 * k, 0.07 * k, 6), ferro);
        cone.position.set(lado * 0.05, 0.03 + i * 0.035, -0.02);
        cone.rotation.z = -lado * 1.1;
        noOsso(c, osso, cone, saida);
      }
    } else if (marca === 'garras' && (peca === 'maos' || peca === 'pes')) {
      for (let i = 0; i < 3; i++) {
        const garra = chifre(0.06 * k, 0.008, 1.1, liso(0x1a1614, 0.5, 0.4), 6);
        garra.rotation.x = Math.PI / 2;
        noOsso(c, osso, garra, saida, V((i - 1) * 0.02, peca === 'pes' ? 0 : -0.02, 0.09));
      }
    } else if (marca === 'penas') {
      for (let i = 0; i < 3; i++) {
        const pena = chifre(0.11 * k, 0.012, 0.6, liso(0x1c1c22, 0.9), 6);
        pena.scale.set(1.6, 1, 0.35);
        pena.rotation.set(-0.5, 0, lado * (0.3 + i * 0.25));
        noOsso(c, osso, pena, saida, V(lado * 0.04, 0.03, -0.04));
      }
    } else if (marca === 'filigrana') {
      for (let i = 0; i < 2; i++) {
        const fio = anel(0.055 + i * 0.012, 0.0035, comuns().ouro, Math.PI * 1.3);
        fio.rotation.set(Math.PI / 2, 0, i * 1.2);
        noOsso(c, osso, fio, saida);
      }
    } else if (marca === 'brasa') {
      const brasa = aceso(cor ?? 0xff7b39, 2);
      for (let i = 0; i < 2; i++) noOsso(c, osso, new THREE.Mesh(esfera(0.012, 8, 6), brasa), saida, V(lado * 0.03 * (i + 1), -0.02, 0.06));
    }
  }
  return saida;
}
