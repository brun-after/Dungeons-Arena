// O arco glacial da skin Valquíria Glacial do arqueiro (21/11/2026), montado a partir das medidas da arte
// (skin-valquiria-medidas.ts, `ARCO`): os braços de ouro como galhos retorcidos, com espinhos voltados para o punho e as
// pontas que se curvam para fora; os cristais de gelo no punho e nas pontas e a corda de gelo acesa. Medidas em células
// como as outras armas (armas3d.ts), no mesmo arranjo do arco comum (`arcoDe`): a corda em x = 0, de ponta a ponta em y,
// e o punho na barriga do arco, em +x. Registrado em ARMAS_3D como `arco_glacial`.

import * as THREE from 'three';
import type { Kit } from './armas3d';
import { ARCO, COMPRIMENTO_DO_ARCO } from './skin-valquiria-medidas';
import { sorteio } from './sombrio-base';

const V3 = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);

/**
 * A metade do arco em células do Kit: o arco mede 0,85 vez a altura do corpo (a arte), o corpo da skin mede 1,08 no
 * mundo (`SKINS_VIVAS`) e a arma do grau 4 cresce 1,14 vez.
 */
const METADE = ((COMPRIMENTO_DO_ARCO / 858) * 1.08) / 1.14 / 2;
/** A barriga e a grossura, na proporção da arte. */
const CURVA = (ARCO.curva / COMPRIMENTO_DO_ARCO) * METADE * 2;
const RAIO = (ARCO.espessura / COMPRIMENTO_DO_ARCO) * METADE * 1.4;

/** Um tubo pelos pontos, afinando até `ponta` (fração do raio) no fim. */
function galho(pontos: THREE.Vector3[], raio: number, ponta: number, m: THREE.Material, lados = 7): THREE.Mesh {
  const curva = new THREE.CatmullRomCurve3(pontos, false, 'centripetal');
  const passos = Math.max(10, pontos.length * 6);
  const g = new THREE.TubeGeometry(curva, passos, raio, lados, false);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.floor(i / (lados + 1)) / passos);
    const c = curva.getPointAt(t);
    const f = 1 - t * (1 - ponta);
    p.setXYZ(i, c.x + (p.getX(i) - c.x) * f, c.y + (p.getY(i) - c.y) * f, c.z + (p.getZ(i) - c.z) * f);
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, m);
}

/** Um cristal de gelo: um octaedro esticado de `de` até `ate`. */
function cristal(k: Kit, de: THREE.Vector3, ate: THREE.Vector3, largura: number, m: THREE.Material): void {
  const d = ate.clone().sub(de);
  const c = k.add(new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), m), ...de.clone().addScaledVector(d, 0.5).toArray());
  c.scale.set(largura, d.length() / 2, largura * 0.8);
  c.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize());
}

export function arcoGlacial(k: Kit): void {
  const r = sorteio(4417);
  // o ouro vivo da arte (sem os riscos sóbrios do kit, que o escureciam)
  const ouro = new THREE.MeshStandardMaterial({ color: 0xd8aa48, metalness: 0.92, roughness: 0.3 });
  const ouroEscuro = new THREE.MeshStandardMaterial({ color: 0x9a6c26, metalness: 0.85, roughness: 0.4 });
  const gelo = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, emissive: 0x5fbaff, emissiveIntensity: 0.65, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.88 });
  const corda = new THREE.MeshBasicMaterial({ color: 0xdff6ff });
  const A = METADE;

  for (const s of [1, -1]) {
    // o braço: do punho (na barriga, +x) até a ponta na linha da corda, que se curva para fora no fim (o recurvo)
    const pts = [V3(CURVA, 0), V3(CURVA * 0.96, s * A * 0.22), V3(CURVA * 0.78, s * A * 0.5), V3(CURVA * 0.45, s * A * 0.78), V3(CURVA * 0.08, s * A * 0.96), V3(CURVA * 0.02, s * A * 1.02), V3(CURVA * 0.22, s * A * 1.1)];
    k.add(galho(pts, RAIO, 0.3, ouro));
    // os galhos que se enroscam no braço: finos, de lado a lado, como a madeira retorcida da arte
    const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const enrosco: THREE.Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = 0.06 + (i / 16) * 0.82;
      const c = curva.getPointAt(t);
      const a = t * Math.PI * 7;
      enrosco.push(c.add(V3(Math.cos(a) * RAIO * 0.9, 0, Math.sin(a) * RAIO * 1.1)));
    }
    k.add(galho(enrosco, RAIO * 0.38, 0.5, ouroEscuro, 5));
    // os espinhos: para fora da barriga e voltados para o punho
    for (let i = 0; i < 6; i++) {
      const t = 0.15 + i * 0.13 + r() * 0.04;
      const c = curva.getPointAt(t);
      const tangente = curva.getTangentAt(t);
      const fora = V3(tangente.y, -tangente.x, 0).normalize();
      if (fora.x < 0) fora.negate();
      const lado = i % 2 === 0 ? 1 : -1;
      const ponta = c.clone().addScaledVector(fora, RAIO * (2.6 + r() * 1.6)).addScaledVector(tangente, -RAIO * 1.4).add(V3(0, 0, lado * RAIO * 1.2));
      k.add(galho([c, c.clone().lerp(ponta, 0.5).addScaledVector(tangente, RAIO * 0.3), ponta], RAIO * 0.55, 0.08, ouro, 5));
    }
    // os cristais da ponta
    const fim = curva.getPointAt(1);
    cristal(k, fim, fim.clone().add(V3(CURVA * 0.25, s * A * 0.12, 0)), RAIO * 0.9, gelo);
    cristal(k, curva.getPointAt(0.9), curva.getPointAt(0.9).add(V3(CURVA * 0.55, s * A * 0.04, RAIO)), RAIO * 0.6, gelo);
  }

  // o punho: a faixa de ouro e o tufo de cristais de gelo que sai para fora da barriga
  k.add(galho([V3(CURVA, -A * 0.08), V3(CURVA * 1.04, 0), V3(CURVA, A * 0.08)], RAIO * 1.35, 0.9, ouroEscuro));
  for (let i = 0; i < 7; i++) {
    const a = -0.9 + (i / 6) * 1.8 + (r() - 0.5) * 0.2;
    const de = V3(CURVA + RAIO, (r() - 0.5) * A * 0.06, (r() - 0.5) * RAIO * 2);
    const comp = A * (0.12 + r() * 0.12) * (1 - Math.abs(a) * 0.35);
    cristal(k, de, de.clone().add(V3(Math.cos(a) * comp, Math.sin(a) * comp, (r() - 0.5) * comp * 0.5)), RAIO * (0.55 + r() * 0.3), gelo);
  }

  // a corda de gelo, de ponta a ponta, acesa
  k.add(new THREE.Mesh(new THREE.CylinderGeometry(RAIO * 0.16, RAIO * 0.16, A * 2.04, 5), corda), CURVA * 0.02, 0);
}
