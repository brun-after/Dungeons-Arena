// Marco 45 (16/11/2026, D-182): a base dos humanoides de Filo. O corpo é o mesmo rig dos jogadores (o traje e a cabeça
// da Quaternius, com as animações da UAL) e tudo o que faz a criatura é nosso: a veste de peças sombrias (as mesmas
// dos kits das classes) com o sotaque da dimensão, e a arma do jogo (armas3d.ts) presa na mão. A veste serve ao atlas
// (tools/sprites) e ao 3D em tempo real (os chefes, palco-vivo.ts).

import * as THREE from 'three';
import { ARMAS_3D, ESCALA_DO_GRAU, Kit } from '../armas3d';
import { aceso, chifre, Corpo, grupoEm, liso, type Ossos, type PecaSombria } from '../sombrio-base';

export type { Ossos, PecaSombria };
export { Corpo };

/** A arma do jogo na mão (`r` ou `l`), ao longo do eixo da mão como no palco (o cabo na palma). */
export function armaNaMao(c: Corpo, modelo: string, grau: number, lado: 'r' | 'l', extras: THREE.Object3D[], escala = 1): void {
  const construtor = ARMAS_3D[modelo];
  const osso = c.ossos.get(`hand_${lado}`);
  if (!construtor || !osso) return;
  const k = new Kit(grau, 0x888888, false);
  construtor(k);
  const g = new THREE.Group();
  g.add(k.g);
  k.g.scale.setScalar((ESCALA_DO_GRAU[grau] ?? 1) * escala);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
  g.scale.setScalar(1 / (osso.getWorldScale(new THREE.Vector3()).x || 1));
  osso.add(g);
  extras.push(g);
}

/** Um grupo em metros preso no osso (para os enfeites soltos: a lanterna, a bobina, as pedras). */
export function noOsso(c: Corpo, osso: string, extras: THREE.Object3D[], montar: (g: THREE.Group) => void): void {
  const g = grupoEm(c, c.p(osso));
  montar(g);
  c.prender(osso, g, extras);
}

/** Os olhos acesos no rosto (a cor da dimensão: as criaturas não têm o olhar humano). */
export function olhosAcesos(c: Corpo, cor: number, extras: THREE.Object3D[], forca = 2.2): void {
  noOsso(c, 'Head', extras, (g) => {
    for (const s of [-1, 1]) {
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), aceso(cor, forca));
      o.position.set(s * 0.032, 0.075, 0.105);
      g.add(o);
    }
  });
}

/** Os chifres curvos para trás (o Arauto, o Rei das Máscaras, o Hierofante caído). */
export function chifres(c: Corpo, m: THREE.Material, compr: number, extras: THREE.Object3D[]): void {
  noOsso(c, 'Head', extras, (g) => {
    for (const sx of [-1, 1]) {
      const ch = chifre(compr, 0.035, 1.4, m, 10);
      ch.position.set(sx * 0.07, 0.15, 0.02);
      ch.rotation.set(-0.4, Math.PI + sx * 0.5, sx * 0.4);
      g.add(ch);
    }
  });
}

/** Pontas (de cristal, de gelo, de vidro) saindo de um osso num leque. */
export function pontas(c: Corpo, osso: string, m: THREE.Material, n: number, tamanho: number, extras: THREE.Object3D[], centro: [number, number, number] = [0, 0, -0.1], abertura = 1): void {
  noOsso(c, osso, extras, (g) => {
    for (let i = 0; i < n; i++) {
      const a = (i / Math.max(1, n - 1) - 0.5) * 2.4 * abertura;
      const h = tamanho * (0.7 + ((i * 37) % 10) / 25);
      const p = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), m);
      p.scale.set(h * 0.22, h, h * 0.22);
      p.position.set(centro[0] + Math.sin(a) * 0.1, centro[1] + h * 0.4 + Math.cos(a) * 0.04, centro[2]);
      p.rotation.set(-0.5, 0, -a * 0.5);
      g.add(p);
    }
  });
}

/** O halo de luz atrás da cabeça (Halônia), inteiro ou quebrado (o Arauto Caído). */
export function halo(c: Corpo, cor: number, extras: THREE.Object3D[], quebrado = false, raio = 0.16): void {
  noOsso(c, 'Head', extras, (g) => {
    const geo = new THREE.TorusGeometry(raio, 0.012, 6, 40, quebrado ? Math.PI * 1.35 : Math.PI * 2);
    const h = new THREE.Mesh(geo, aceso(cor, quebrado ? 1.1 : 1.8));
    h.position.set(0, 0.16, -0.12);
    h.rotation.z = quebrado ? 0.8 : 0;
    g.add(h);
  });
}

export const pele = (cor: number) => liso(cor, 0.85);
export { aceso, liso };
