// A gadanha do Ceifador (06/11/2026), montada a partir das medidas da arte (skin-ceifador-medidas.ts, `GADANHA`).
// - Cabo de madeira riscada, com o colar de ferro e a guarda de volutas no alto.
// - A lâmina enorme em arco, que passa por cima do capuz: o lombo e as larguras são os medidos, com a gravura em
//   espiral e o gume claro na borda de dentro.
// - O gancho curvo que desce da raiz da lâmina.
// - A ponteira longa de ferro com as espirais e a ponta.
// Medidas em células como as outras armas (armas3d.ts): o cabo na origem (a mão), a arma para +y, a lâmina para +x e a
// face larga para +z. Registrada em ARMAS_3D como `gadanha_ceifador`.

import * as THREE from 'three';
import type { Kit } from './armas3d';
import { ALTURA_DO_CEIFADOR, GADANHA } from './skin-ceifador-medidas';
import { filigrana } from './skin-pano';

/**
 * A escala: a arte mede 1200 px de altura, e a skin tem ALTURA_DO_CEIFADOR de altura no mundo (`SKINS_VIVAS` em palco-vivo.ts). A arma
 * do grau 4 cresce 1,14 vez (`ESCALA_DO_GRAU`). Assim, 1 px da arte vale `PX` células.
 */
const PX = ALTURA_DO_CEIFADOR / 1.14 / 1200;
/**
 * A mão do rig fica a 0,53 H do chão (o braço não sobe como na arte), então a pegada desliza pelo cabo até a ponta de
 * baixo encostar no chão: a ponta fica a `ABAIXO` células da mão.
 */
const ABAIXO = 0.55 * (ALTURA_DO_CEIFADOR / 1.2);

const EIXO = new THREE.Vector2(GADANHA.colar[0] - GADANHA.ponta[0], GADANHA.colar[1] - GADANHA.ponta[1]).normalize();
const NORMAL = new THREE.Vector2(-EIXO.y, EIXO.x);
/** Um ponto da arte (px) nas células da arma: ao longo do cabo (+y) e para o lado da lâmina (+x). */
function emCelulas(x: number, y: number): THREE.Vector2 {
  const d = new THREE.Vector2(x - GADANHA.ponta[0], y - GADANHA.ponta[1]);
  return new THREE.Vector2(d.dot(NORMAL) * PX, d.dot(EIXO) * PX - ABAIXO);
}

/** Um tubo pelos pontos, afinando de `raio` até `ponta` × raio. */
function tubo(pontos: THREE.Vector3[], raio: number, ponta: number, m: THREE.Material, lados = 8): THREE.Mesh {
  const curva = new THREE.CatmullRomCurve3(pontos);
  const passos = Math.max(12, pontos.length * 6);
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

export function gadanhaDoCeifador(k: Kit): void {
  // prateada (06/11/2026, pedido do jogador): todo o metal em prata polida, a gravura em prata fosca, e o gume
  // espelhado; a madeira do cabo fica quente para separar da veste escura
  const madeira = k.mat(0x7a5236, { roughness: 0.75 });
  const veio = k.mat(0x3a2619, { roughness: 0.9 });
  const ferro = k.mat(0xb4b6be, { metalness: 0.95, roughness: 0.24, emissive: 0x1c1d22 });
  const aco = k.mat(0xf2f3f7, { metalness: 1, roughness: 0.1, emissive: 0x30323a });
  const gravura = new THREE.MeshStandardMaterial({ map: filigrana('#a9abb4', '#eef0f6', 331, { densidade: 0.9, manchas: 20 }), metalness: 0.95, roughness: 0.22, emissive: 0x202126, side: THREE.DoubleSide });
  const raio = (GADANHA.espessura / 2) * PX;

  // o cabo: do colar até o começo da ponteira, de madeira com os veios em espiral
  const colar = emCelulas(GADANHA.colar[0], GADANHA.colar[1]);
  const inicioDaPonteira = emCelulas(GADANHA.ponteira[0][0], GADANHA.ponteira[0][1]);
  const de = new THREE.Vector3(inicioDaPonteira.x, inicioDaPonteira.y, 0), ate = new THREE.Vector3(colar.x, colar.y, 0);
  k.add(tubo([de, de.clone().lerp(ate, 0.5), ate], raio, 1, madeira, 10));
  for (let i = 0; i < 3; i++) {
    const espiral: THREE.Vector3[] = [];
    for (let s = 0; s <= 40; s++) {
      const t = s / 40, a = t * 18 + i * 2.1;
      const c = de.clone().lerp(ate, t);
      espiral.push(new THREE.Vector3(c.x + Math.cos(a) * raio * 1.02, c.y, Math.sin(a) * raio * 1.02));
    }
    k.add(tubo(espiral, raio * 0.18, 1, veio, 4));
  }

  // o colar de ferro e a guarda: anéis no alto do cabo, a placa da raiz e as volutas para os dois lados
  const [gx0, gy0, gx1, gy1] = GADANHA.guarda;
  const topoDoColar = emCelulas(GADANHA.colar[0], gy1).y;
  k.cil(raio * 1.5, colar.y - 0.03, colar.y, ferro, colar.x, 0, raio * 1.3);
  k.cil(raio * 1.9, colar.y - 0.008, colar.y + 0.004, ferro, colar.x, 0, raio * 1.9);
  k.cil(raio * 1.2, colar.y, topoDoColar, ferro, colar.x, 0, raio * 1.6);
  const largura = (gx1 - gx0) * PX, alto = (gy1 - gy0) * PX;
  k.caixa(largura * 0.45, alto * 0.4, raio * 1.6, ferro, colar.x, topoDoColar + alto * 0.15);
  for (const lado of [-1, 1]) {
    k.curva(largura * 0.22, Math.PI * 1.5, raio * 0.45, ferro, colar.x + lado * largura * 0.32, topoDoColar + alto * 0.28, lado > 0 ? -0.6 : Math.PI + 0.6, 1);
    k.curva(largura * 0.12, Math.PI * 1.6, raio * 0.35, ferro, colar.x + lado * largura * 0.46, topoDoColar + alto * 0.05, lado > 0 ? 0.9 : Math.PI - 0.9, 1);
  }

  // a lâmina: o lombo medido e, para dentro (o lado côncavo), a largura medida em cada ponto
  const lombo = GADANHA.lombo.map(([x, y]) => emCelulas(x, y));
  const curvaDoLombo = new THREE.SplineCurve(lombo);
  const N = 40;
  const fora: THREE.Vector2[] = [], dentro: THREE.Vector2[] = [], gume: THREE.Vector2[] = [];
  const larguraEm = (t: number) => {
    const f = t * (GADANHA.larguras.length - 1), i = Math.min(GADANHA.larguras.length - 2, Math.floor(f));
    return THREE.MathUtils.lerp(GADANHA.larguras[i] ?? 0, GADANHA.larguras[i + 1] ?? 0, f - i) * PX;
  };
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curvaDoLombo.getPoint(t);
    const tg = curvaDoLombo.getTangent(t);
    // o lado côncavo: a tangente girada para baixo da curva (o arco sobe e desce por cima da cabeça)
    const n = new THREE.Vector2(tg.y, -tg.x);
    const w = larguraEm(t);
    fora.push(p.clone());
    dentro.push(p.clone().addScaledVector(n, w));
    gume.push(p.clone().addScaledVector(n, w * 0.62));
  }
  const corpo = new THREE.Shape([...fora, ...dentro.slice().reverse()]);
  const geo = new THREE.ExtrudeGeometry(corpo, { depth: raio * 0.5, bevelEnabled: true, bevelThickness: raio * 0.2, bevelSize: raio * 0.15, bevelSegments: 2, curveSegments: 4 });
  geo.translate(0, 0, -raio * 0.25);
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2.2, uv.getY(i) * 2.2);
  k.add(new THREE.Mesh(geo, gravura));
  const fio = new THREE.Shape([...gume, ...dentro.slice().reverse()]);
  const fioGeo = new THREE.ExtrudeGeometry(fio, { depth: raio * 0.62, bevelEnabled: false, curveSegments: 4 });
  fioGeo.translate(0, 0, -raio * 0.31);
  k.add(new THREE.Mesh(fioGeo, aco));
  // o lombo de ferro ao longo da borda de fora, afinando até a ponta
  k.add(tubo(fora.filter((_, i) => i % 4 === 0).map((p) => new THREE.Vector3(p.x, p.y, 0)), raio * 0.5, 0.15, ferro, 6));

  // o gancho de trás: o esporão curvo que desce da raiz da lâmina, afinando
  k.add(tubo(GADANHA.gancho.map(([x, y]) => {
    const p = emCelulas(x, y);
    return new THREE.Vector3(p.x, p.y, 0);
  }), raio * 0.75, 0.08, ferro, 6));

  // a ponteira: o ferro torneado com os bulbos, as espirais para o lado de fora e a ponta
  const pBaixo = emCelulas(GADANHA.ponteira[1][0], GADANHA.ponteira[1][1]);
  const pAlto = inicioDaPonteira;
  const L = pAlto.y - pBaixo.y;
  const perfil: [number, number][] = [[0.2, 0], [0.9, 0.02], [1.7, 0.1], [1.1, 0.2], [1.9, 0.32], [1.2, 0.45], [1.5, 0.62], [0.9, 0.72], [1.3, 0.8], [1.0, 1]];
  const torno = new THREE.LatheGeometry(perfil.map(([r, t]) => new THREE.Vector2(r * raio, t * L)), 12);
  k.add(new THREE.Mesh(torno, ferro), (pBaixo.x + pAlto.x) / 2, pBaixo.y);
  for (const [x, y] of GADANHA.espirais) {
    const p = emCelulas(x, y);
    k.curva(raio * 2.6, Math.PI * 1.7, raio * 0.45, ferro, p.x, p.y, Math.PI * 0.2, 1);
    k.bola(raio * 0.55, aco, p.x - raio * 2.6, p.y, 0, 0);
  }
  const ponta = k.add(new THREE.Mesh(new THREE.ConeGeometry(raio * 0.9, L * 0.16, 6), ferro), pBaixo.x, pBaixo.y - L * 0.06);
  ponta.rotation.x = Math.PI;
}
