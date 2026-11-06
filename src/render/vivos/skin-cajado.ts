// O cajado retorcido da skin Sombra Rubra do mago (06/11/2026), montado a partir das medidas da arte
// (skin-mago-medidas.ts, `CAJADO`). Uma haste única, nodosa e de contorno irregular, que engrossa para cima, solta duas
// esporas e se abre em três pontas grossas e serrilhadas, com rachaduras vermelhas curtas na casca. Medidas em células
// como as outras armas (armas3d.ts): o cabo na origem (a mão), a arma para +y. Registrada em ARMAS_3D como `cajado_retorcido`.

import * as THREE from 'three';
import type { Kit } from './armas3d';
import { CAJADO, COMPRIMENTO_DO_CAJADO } from './skin-mago-medidas';
import { sorteio } from './sombrio-base';

const V3 = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);

/** Um tubo ao longo dos pontos, afinando até a ponta (`ponta` é a fração do raio que sobra) e com nós. */
function ramo(pontos: THREE.Vector3[], raio: number, ponta: number, m: THREE.Material, nos = 0, lados = 6, reto = false): THREE.Mesh {
  // `reto`: os trechos entre os pontos ficam quase retos (o galho quebrado, não a curva)
  const curva = new THREE.CatmullRomCurve3(pontos, false, 'catmullrom', reto ? 0.05 : 0.5);
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

/** O comprimento do cajado em células do Kit: 1,05 vez a altura do personagem (a arte), calibrado no retrato. */
const COMPRIMENTO = 1.46;

export function cajadoRetorcido(k: Kit): void {
  const r = sorteio(2024);
  const casca = k.mat(0x241b28, { roughness: 0.9 });
  const brasa = k.mat(0xe0162e, { emissive: 0xe0162e, emissiveIntensity: 1.2, roughness: 0.4 });
  const L = COMPRIMENTO;
  // `ao` (fração do comprimento a partir da base) e `de` (desvio lateral) da arte, em células com a mão na origem
  const em = (ao: number, de = 0, z = 0) => V3(-de * L, (ao - CAJADO.mao) * L, z);
  const grossura = (px: number) => (px / COMPRIMENTO_DO_CAJADO) * L * 0.5;

  // a haste: da base à divisão, em trechos quase retos que quebram de leve, engrossando da base (15 px) até 25 px
  const haste: THREE.Vector3[] = [];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const ao = (i / N) * CAJADO.divisao.ao;
    const quebra = (i % 2 === 0 ? 1 : -1) * (0.004 + r() * 0.006);
    haste.push(em(ao, (ao / CAJADO.divisao.ao) * CAJADO.divisao.de).add(V3(quebra, 0, (r() - 0.5) * 0.008)));
  }
  const raioBase = grossura(CAJADO.espessuraDaBase), raioAlto = grossura(CAJADO.espessura);
  k.add(ramo(haste, raioBase, raioAlto / raioBase, casca, 7, 7, true));
  const naHaste = new THREE.CatmullRomCurve3(haste, false, 'catmullrom', 0.05);
  const raioEm = (t: number) => raioBase + (raioAlto - raioBase) * t;

  // os nós: calombos achatados que quebram o contorno
  for (let i = 0; i < 9; i++) {
    const t = 0.1 + r() * 0.85;
    const c = naHaste.getPointAt(t);
    const a = r() * Math.PI * 2;
    const no = k.add(new THREE.Mesh(new THREE.DodecahedronGeometry(raioEm(t) * (0.7 + r() * 0.4)), casca), c.x + Math.cos(a) * raioEm(t) * 0.6, c.y, c.z + Math.sin(a) * raioEm(t) * 0.6);
    no.scale.set(1, 1.6 + r(), 0.8);
  }

  // um galho serrilhado de `pts` (a ponta afina até 12%), com um dente na lateral
  const galhos: THREE.Vector3[][] = [];
  const galho = (pts: THREE.Vector3[], raio: number, dente: boolean) => {
    const serra: THREE.Vector3[] = [];
    const curva = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
    const passos = 6;
    for (let i = 0; i <= passos; i++) {
      const t = i / passos;
      const quebra = i === 0 || i === passos ? 0 : (i % 2 === 0 ? 1 : -1) * (0.008 + r() * 0.01) * (1 - t * 0.5);
      serra.push(curva.getPointAt(t).add(V3(quebra, 0, (r() - 0.5) * 0.01)));
    }
    k.add(ramo(serra, raio, 0.12, casca, 3, 6, true));
    galhos.push(serra);
    if (!dente) return;
    const b = curva.getPointAt(0.45 + r() * 0.2);
    const fora = Math.sign((pts[pts.length - 1] as THREE.Vector3).x - (pts[0] as THREE.Vector3).x) || 1;
    k.add(ramo([b, V3(b.x + fora * 0.03, b.y + 0.012, b.z), V3(b.x + fora * 0.04, b.y + 0.04, b.z)], raio * 0.4, 0.1, casca, 0, 4, true));
  };
  // as duas esporas baixas
  for (const e of CAJADO.esporas) galho([em(e.ao), em(e.ate.ao, e.ate.de)], grossura(CAJADO.espessuraDasPontas) * 0.6, false);
  // as três pontas, da divisão até a ponta de cada uma passando pelo meio medido
  const divisao = em(CAJADO.divisao.ao, CAJADO.divisao.de);
  for (const [meio, fim] of CAJADO.pontas) galho([divisao.clone().add(V3(0, -0.02, 0)), em(meio.ao, meio.de), em(fim.ao, fim.de)], grossura(CAJADO.espessuraDasPontas), true);

  // as rachaduras vermelhas: riscos curtos sobre a casca, mais densos na cabeça
  const racha = (curva: THREE.Curve<THREE.Vector3>, t: number, raio: number) => {
    const a = (r() - 0.5) * Math.PI * 1.4; // mais na frente, que é o lado que se vê
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 3; i++) {
      const tt = Math.min(1, t + i * (0.025 + r() * 0.02));
      const c = curva.getPointAt(tt);
      const aa = a + (r() - 0.5) * 0.6;
      pts.push(V3(c.x + Math.sin(aa) * raio * 1.02, c.y, c.z + Math.cos(aa) * raio * 1.02));
    }
    k.add(ramo(pts, 0.0024, 0.6, brasa, 0, 4, true));
  };
  for (let i = 0; i < 18; i++) {
    const t = 0.08 + r() * 0.86;
    racha(naHaste, t, raioEm(t));
  }
  for (const pts of galhos) {
    const curva = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05);
    for (let i = 0; i < 2; i++) racha(curva, r() * 0.6, grossura(CAJADO.espessuraDasPontas) * 0.8);
  }

  // a ponteira: a base termina em ponta curta
  const base = haste[0] ?? em(0);
  k.add(ramo([base, base.clone().add(V3(0.004, -0.04, 0)), base.clone().add(V3(-0.002, -0.07, 0))], raioBase, 0.1, casca, 0, 5, true));
}
