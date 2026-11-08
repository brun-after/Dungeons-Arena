// O Servo do ossuário em tempo real (08/11/2026, D-137): a invocação da passiva do Necromante deixou de ser o esqueleto
// do atlas (a caveira de cabeça grande) e virou o vulto encapuzado da arte de referência: o corte do Ceifador sem os
// enfeites (o capuz fundo, o manto longo e rasgado, a capeleta nos ombros; skin-ceifador.ts) e, dentro da escuridão
// do capuz, os dois olhos pálidos acesos e as presas compridas.

import * as THREE from 'three';
import { vesteDoServoBase } from './skin-ceifador';
import { aceso, grupoEm, liso, type Ossos, type PecaSombria } from './sombrio-base';

export function vesteDoServo(ossos: Ossos): PecaSombria {
  const { extras, esconder, corpo: c } = vesteDoServoBase(ossos);
  // a frente da cabeça é +z; os olhos inclinados para dentro e as presas descendo do escuro
  const rosto = grupoEm(c, c.p('Head'));
  const olho = aceso(0xe8ecd8, 2);
  const osso = liso(0xd8d4c0, 0.6);
  for (const sx of [-1, 1]) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), olho);
    o.scale.set(1.5, 0.6, 0.5);
    o.position.set(sx * 0.042, 0.095, 0.13);
    o.rotation.z = sx * 0.25;
    rosto.add(o);
    const presa = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.05, 6), osso);
    presa.rotation.x = Math.PI;
    presa.position.set(sx * 0.016, 0.03, 0.13);
    rosto.add(presa);
  }
  c.prender('Head', rosto, extras);
  return { extras, ...(esconder ? { esconder } : {}) };
}
