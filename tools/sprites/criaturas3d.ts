// Criaturas sem modelo CC0 nos pacotes baixados (marco 32, 31/10/2026, D-131): montadas de geometria simples e
// animadas por deformação (sem esqueleto). `animar(estado, f)` põe a pose da fração `f` (0 a 1) do estado.

import * as THREE from 'three';
import type { EstadoBase as Estado } from './receitas';
import { aranha, falcao, lobo } from './feras3d';

export interface Criatura {
  grupo: THREE.Group;
  animar(estado: Estado, f: number): void;
}

/** O slime: a bolha verde e brilhante, com olhos e um núcleo; pula, avança, incha ao conjurar e derrete ao morrer. */
function slime(): Criatura {
  const grupo = new THREE.Group();
  const corpo = new THREE.Group();
  grupo.add(corpo);
  const geo = new THREE.SphereGeometry(0.5, 24, 16);
  // A base achatada (a bolha apoiada no chão) e a ponta um pouco caída.
  const p = geo.attributes.position;
  if (p) {
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setY(i, y < -0.2 ? -0.2 - (y + 0.2) * 0.25 : y * (y > 0.3 ? 0.92 : 1));
    }
    geo.computeVertexNormals();
  }
  const pele = new THREE.MeshStandardMaterial({ color: 0x5fc84a, emissive: 0x1f6a14, emissiveIntensity: 0.5, roughness: 0.15, metalness: 0 });
  const bolha = new THREE.Mesh(geo, pele);
  bolha.position.y = 0.25;
  corpo.add(bolha);
  const nucleo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), new THREE.MeshStandardMaterial({ color: 0x2d6a1f, roughness: 0.4 }));
  nucleo.position.set(0.05, 0.2, -0.05);
  corpo.add(nucleo);
  for (const s of [-1, 1]) {
    const olho = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.2 }));
    olho.position.set(s * 0.15, 0.4, 0.42);
    olho.scale.set(1, 1.3, 0.6);
    corpo.add(olho);
    const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    brilho.position.set(s * 0.15 - 0.02, 0.43, 0.46);
    corpo.add(brilho);
  }
  const reflexo = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xd8ffc8 }));
  reflexo.position.set(-0.2, 0.55, 0.25);
  reflexo.scale.set(1.3, 0.7, 0.5);
  corpo.add(reflexo);
  const onda = (f: number) => Math.sin(f * Math.PI * 2);
  return {
    grupo,
    animar(estado, f) {
      corpo.position.set(0, 0, 0);
      corpo.rotation.set(0, 0, 0);
      pele.emissiveIntensity = 0.5;
      let sy: number;
      let sxz: number;
      if (estado === 'parado') {
        sy = 1 + 0.07 * onda(f);
        sxz = 1 - 0.035 * onda(f);
      } else if (estado === 'andar') {
        const salto = Math.abs(onda(f / 2));
        corpo.position.y = salto * 0.18;
        sy = 0.85 + 0.3 * salto;
        sxz = 1.1 - 0.15 * salto;
        corpo.position.z = 0.04 * onda(f);
      } else if (estado === 'golpe') {
        const bote = Math.sin(f * Math.PI);
        corpo.position.z = bote * 0.3;
        corpo.position.y = bote * 0.08;
        sy = 1 - 0.2 * bote;
        sxz = 1 + 0.18 * bote;
        corpo.rotation.x = bote * 0.35;
      } else if (estado === 'conjurar') {
        sy = 1.08 + 0.08 * onda(f);
        sxz = 1.06 - 0.04 * onda(f);
        pele.emissiveIntensity = 0.8 + 0.4 * Math.abs(onda(f));
      } else {
        sy = 1 - 0.82 * f;
        sxz = 1 + 0.75 * f;
      }
      corpo.scale.set(sxz, sy, sxz);
    },
  };
}

const CRIATURAS: Readonly<Record<string, () => Criatura>> = { slime, lobo, aranha, falcao };

export function criatura(tipo: string): Criatura | null {
  return CRIATURAS[tipo]?.() ?? null;
}
