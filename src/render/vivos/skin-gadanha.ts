// A gadanha do Ceifador (06/11/2026): a skin do necromante vem com a arma dela, maior que o personagem. Cabo de madeira
// riscada e com faixas, o colar de ferro com as volutas no alto, a lâmina em crescente de aço lilás com a gravura em
// espiral e as runas acesas, e a ponteira de ferro com as duas gavinhas curvas embaixo (o desenho da arte original).
// Medidas em células como as outras armas (armas3d.ts): o cabo na origem (a mão), a arma para +y, a lâmina para +x e a
// face larga para +z. Registrada em ARMAS_3D como `gadanha_ceifador`.

import * as THREE from 'three';
import type { Kit } from './armas3d';
import { filigrana } from './skin-pano';

const ARCO_C = new THREE.Vector2(0.17, 0.33);
const ARCO_R = 0.54;
const DE = THREE.MathUtils.degToRad(108);
const ATE = THREE.MathUtils.degToRad(-16);

/** O ponto do arco da lâmina a `t` (0 no cabo, 1 na ponta), com o raio deslocado de `d`. */
const noArco = (t: number, d = 0): THREE.Vector2 => {
  const a = DE + (ATE - DE) * t;
  return new THREE.Vector2(ARCO_C.x + Math.cos(a) * (ARCO_R + d), ARCO_C.y + Math.sin(a) * (ARCO_R + d));
};

/** A largura da lâmina em `t`: larga na raiz, afinando até a ponta. */
const larguraEm = (t: number): number => 0.19 * Math.pow(1 - t, 0.75) * (0.55 + 0.45 * Math.sin(Math.min(1, t * 3.2) * Math.PI * 0.5)) + 0.004;

export function gadanhaDoCeifador(k: Kit): void {
  const madeira = k.mat(0x3a2a20, { roughness: 0.8 });
  const faixa = k.mat(0x1c1618, { metalness: 0.85, roughness: 0.5 });
  const ferro = k.mat(0x2a2428, { metalness: 0.9, roughness: 0.42 });
  const aco = k.mat(0x9a93a6, { metalness: 0.92, roughness: 0.3 });
  const gravura = new THREE.MeshStandardMaterial({ map: filigrana('#6a6472', '#d2c4de', 331, { densidade: 0.9, manchas: 30 }), metalness: 0.85, roughness: 0.38, side: THREE.DoubleSide });
  const runa = k.brilho(0xb89cff, 1.3);

  // o cabo: madeira com as veias torcidas e as faixas de ferro; afina um pouco para baixo
  const BAIXO = -0.25, ALTO = 0.8;
  k.add(new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.016, ALTO - BAIXO, 10), madeira), 0, (ALTO + BAIXO) / 2, 0);
  for (let i = 0; i < 19; i++) {
    const volta = k.add(new THREE.Mesh(new THREE.TorusGeometry(0.0192, 0.0016, 4, 12), faixa), 0, BAIXO + 0.05 + i * 0.054, 0);
    volta.rotation.x = Math.PI / 2 + 0.34;
  }
  for (const y of [0.06, 0.32, 0.62]) k.cil(0.021, y - 0.012, y + 0.012, faixa);

  // o colar do alto: ferro com o aro, a base da lâmina e as volutas
  k.cil(0.024, ALTO - 0.1, ALTO + 0.02, ferro, 0, 0, 0.034);
  k.cil(0.04, ALTO - 0.012, ALTO + 0.004, faixa, 0, 0, 0.04);
  for (const lado of [-1, 1]) {
    const voluta = k.curva(0.034, Math.PI * 1.55, 0.0065, ferro, lado * 0.044, ALTO - 0.06, lado > 0 ? -0.4 : Math.PI + 0.4);
    voluta.scale.z = 1.4;
  }
  k.bola(0.019, ferro, 0, ALTO + 0.03, 0, 0);

  // a lâmina: o corpo escuro com a gravura e, por cima, o fio claro na borda de dentro
  const N = 28;
  const fora: THREE.Vector2[] = [];
  const dentro: THREE.Vector2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const w = larguraEm(t);
    fora.push(noArco(t, w * 0.38));
    dentro.push(noArco(t, -w * 0.62));
  }
  const forma = new THREE.Shape([...fora, ...dentro.slice(0, -1).reverse()]);
  const geo = new THREE.ExtrudeGeometry(forma, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.004, bevelSegments: 2, curveSegments: 4 });
  geo.translate(0, 0, -0.006);
  // a textura da gravura usa o uv do perfil: espalha pela lâmina inteira
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 1.4, uv.getY(i) * 1.4);
  k.add(new THREE.Mesh(geo, gravura));
  // o fio: uma fita fina de aço claro na borda de dentro (nas duas faces)
  const fio: THREE.Vector2[] = [];
  const fioDentro: THREE.Vector2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const w = larguraEm(t);
    fio.push(noArco(t, -w * 0.62));
    fioDentro.push(noArco(t, -w * 0.62 + w * 0.2));
  }
  const gume = new THREE.Shape([...fio, ...fioDentro.slice(0, -1).reverse()]);
  const gumeGeo = new THREE.ExtrudeGeometry(gume, { depth: 0.016, bevelEnabled: false, curveSegments: 4 });
  gumeGeo.translate(0, 0, -0.008);
  k.add(new THREE.Mesh(gumeGeo, aco));
  // o lombo: um tubo de ferro ao longo da curva de fora, com as pontas das gavinhas nas costas da lâmina
  const lombo = new THREE.CatmullRomCurve3(Array.from({ length: 16 }, (_, i) => {
    const p = noArco(i / 15, larguraEm(i / 15) * 0.4);
    return new THREE.Vector3(p.x, p.y, 0);
  }));
  const tuboGeo = new THREE.TubeGeometry(lombo, 36, 0.0075, 6, false);
  const tp = tuboGeo.getAttribute('position') as THREE.BufferAttribute;
  const anelsPorTubo = 7;
  for (let i = 0; i < tp.count; i++) {
    const t = Math.floor(i / anelsPorTubo) / 36;
    const c = lombo.getPointAt(Math.min(1, t));
    tp.setXYZ(i, c.x + (tp.getX(i) - c.x) * (1 - t * 0.7), c.y + (tp.getY(i) - c.y) * (1 - t * 0.7), (tp.getZ(i) - c.z) * (1 - t * 0.7));
  }
  tuboGeo.computeVertexNormals();
  k.add(new THREE.Mesh(tuboGeo, ferro));
  // as volutas da raiz da lâmina (as gavinhas que saem do lombo) e as runas acesas ao longo do corpo
  for (const [t, giro, raio] of [[0.1, 0.5, 0.05], [0.24, 0.9, 0.04], [0.4, 1.3, 0.03]] as const) {
    const p = noArco(t, larguraEm(t) * 0.1);
    for (const z of [-1, 1]) {
      const v = k.curva(raio, Math.PI * 1.5, 0.0042, ferro, p.x, p.y, giro, 1);
      v.position.z = z * 0.011;
    }
  }
  for (let i = 0; i < 7; i++) {
    const t = 0.14 + i * 0.1;
    const p = noArco(t, -larguraEm(t) * 0.12);
    for (const z of [-1, 1]) {
      const r = k.caixa(0.008, 0.022 * (1 - t * 0.5), 0.003, runa, p.x, p.y, z * 0.0105);
      r.rotation.z = DE + (ATE - DE) * t;
    }
  }

  // a ponteira: o ferro afunilado com o colar e as duas gavinhas curvas, como o garfo da arte
  k.cil(0.02, BAIXO - 0.06, BAIXO + 0.02, ferro, 0, 0, 0.026);
  const ponta = k.add(new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.2, 8), ferro), 0, BAIXO - 0.16, 0);
  ponta.rotation.x = Math.PI;
  k.cil(0.034, BAIXO + 0.015, BAIXO + 0.034, faixa, 0, 0, 0.034);
  for (const lado of [-1, 1]) {
    const gav = k.curva(0.052, Math.PI * 1.6, 0.0078, ferro, lado * 0.056, BAIXO - 0.04, lado > 0 ? Math.PI * 0.2 : Math.PI * 0.8 - Math.PI * 0.1, 1.2);
    gav.rotation.z += lado > 0 ? 0 : Math.PI * 0.35;
    k.bola(0.0095, aco, lado * 0.098, BAIXO - 0.07, 0, 0);
  }
  k.bola(0.016, runa, 0, BAIXO + 0.05, 0.02, 0);
}
