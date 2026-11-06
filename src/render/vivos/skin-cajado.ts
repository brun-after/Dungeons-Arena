// O cajado retorcido da skin Sombra Rubra do mago (06/11/2026): um galho preto-arroxeado, nodoso e torto, que se abre no
// alto numa coroa de galhos espinhosos, com veios vermelhos acesos correndo pelo tronco e pelos galhos (a arte de
// referência). Medidas em células como as outras armas (armas3d.ts): o cabo na origem (a mão), a arma para +y.
// Registrada em ARMAS_3D como `cajado_retorcido`.

import * as THREE from 'three';
import type { Kit } from './armas3d';
import { sorteio } from './sombrio-base';

const V3 = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);

/** Um tubo ao longo dos pontos, afinando até a ponta (`ponta` é a fração do raio que sobra) e com nós. */
function ramo(pontos: THREE.Vector3[], raio: number, ponta: number, m: THREE.Material, nos = 0, lados = 6): THREE.Mesh {
  const curva = new THREE.CatmullRomCurve3(pontos);
  const passos = Math.max(8, pontos.length * 5);
  const g = new THREE.TubeGeometry(curva, passos, raio, lados, false);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.floor(i / (lados + 1)) / passos);
    const c = curva.getPointAt(t);
    const f = (1 - t * (1 - ponta)) * (1 + Math.sin(t * Math.PI * nos) * 0.28 * (nos > 0 ? 1 : 0));
    p.setXYZ(i, c.x + (p.getX(i) - c.x) * f, c.y + (p.getY(i) - c.y) * f, c.z + (p.getZ(i) - c.z) * f);
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, m);
}

export function cajadoRetorcido(k: Kit): void {
  const r = sorteio(2024);
  const casca = k.mat(0x1c141f, { roughness: 0.92 });
  const brasa = k.mat(0xff2a3c, { emissive: 0xff2a3c, emissiveIntensity: 1.5, roughness: 0.3 });

  // o tronco: sobe torcendo, mais grosso embaixo, com nós
  const tronco: THREE.Vector3[] = [];
  const N = 9;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    tronco.push(V3(Math.sin(t * 7 + 0.5) * 0.02 * (0.4 + t), -0.42 + t * 1.0, Math.cos(t * 6) * 0.012));
  }
  k.add(ramo(tronco, 0.027, 0.62, casca, 5, 7));
  const noTronco = new THREE.CatmullRomCurve3(tronco);

  // os veios vermelhos: uma espiral fina em volta do tronco e fios nos galhos
  const veio: THREE.Vector3[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const c = noTronco.getPointAt(t);
    const a = t * 30;
    const rr = 0.0245 * (1 - t * 0.35);
    veio.push(V3(c.x + Math.cos(a) * rr, c.y, c.z + Math.sin(a) * rr));
  }
  k.add(ramo(veio, 0.0042, 0.7, brasa, 0, 4));

  // os espinhos do tronco
  for (let i = 0; i < 12; i++) {
    const t = 0.12 + (i / 12) * 0.78;
    const c = noTronco.getPointAt(t);
    const a = r() * Math.PI * 2;
    const e = k.add(new THREE.Mesh(new THREE.ConeGeometry(0.0075, 0.045 + r() * 0.03, 4), casca), c.x + Math.cos(a) * 0.022, c.y, c.z + Math.sin(a) * 0.022);
    e.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
  }

  // a coroa: galhos tortos que se abrem do alto, com ramos menores e brasas nas pontas
  const topo = noTronco.getPointAt(1);
  const direcoes: [number, number, number][] = [[-0.17, 0.24, 0.02], [0.19, 0.28, -0.02], [-0.06, 0.36, 0.03], [0.06, 0.4, -0.03], [-0.25, 0.13, -0.02], [0.25, 0.16, 0.03], [0.0, 0.27, -0.07]];
  for (const [dx, dy, dz] of direcoes) {
    const pts = [topo.clone()];
    const passos = 5;
    for (let i = 1; i <= passos; i++) {
      const t = i / passos;
      const gira = Math.sin(t * 5 + dx * 9) * 0.045;
      pts.push(V3(topo.x + dx * t + gira * (r() + 0.4), topo.y + dy * t + Math.cos(t * 4 + dy * 7) * 0.025, topo.z + dz * t + (r() - 0.5) * 0.03));
    }
    const fim = pts[pts.length - 1] as THREE.Vector3;
    k.add(ramo(pts, 0.015, 0.12, casca, 2, 5));
    const fio = pts.map((p, i) => V3(p.x, p.y, p.z + 0.011 * (1 - i / passos)));
    k.add(ramo(fio, 0.0026, 0.5, brasa, 0, 4));
    // um galhinho no meio e outro perto da ponta
    for (const t of [0.45, 0.78]) {
      const base = new THREE.CatmullRomCurve3(pts).getPointAt(t);
      const lado = r() < 0.5 ? -1 : 1;
      k.add(ramo([base, V3(base.x + lado * 0.04, base.y + 0.05, base.z), V3(base.x + lado * 0.07, base.y + 0.1 + r() * 0.04, base.z + (r() - 0.5) * 0.02)], 0.0065, 0.1, casca, 0, 4));
    }
    const pedra = k.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.0085), brasa), fim.x, fim.y, fim.z + 0.004);
    pedra.scale.y = 1.6;
  }
  // a brasa maior no coração da coroa
  const miolo = k.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.02), brasa), topo.x, topo.y + 0.03, topo.z + 0.01);
  miolo.scale.y = 1.5;

  // a ponteira: o galho termina em ponta, com duas raízes curtas
  k.add(ramo([V3(0, -0.42), V3(0.012, -0.5), V3(-0.006, -0.57)], 0.017, 0.05, casca, 0, 5));
  for (const lado of [-1, 1]) k.add(ramo([V3(0, -0.4), V3(lado * 0.03, -0.46), V3(lado * 0.055, -0.5)], 0.008, 0.1, casca, 0, 4));
}
