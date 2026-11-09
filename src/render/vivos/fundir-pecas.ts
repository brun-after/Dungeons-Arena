// A fusão das peças de armadura do palco 3D (09/11/2026, D-144: saiu de palco-vivo.ts, que passava de 800 linhas
// quando as peças passaram a ser montadas só quando alguém as veste).

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ATRIBUTOS_DO_PANO, levarAoRig } from './skin-pano';

export interface MalhaFundida {
  geometria: THREE.BufferGeometry;
  material: THREE.Material;
}

export function malhasDe(o: THREE.Object3D): THREE.Mesh[] {
  const lista: THREE.Mesh[] = [];
  o.traverse((x) => {
    if (x instanceof THREE.Mesh) lista.push(x as THREE.Mesh);
  });
  return lista;
}

/** As peças rígidas presas nos ossos viram geometria com pele (peso 1 no osso), fundida por material. */
export function fundirPecas(extras: THREE.Object3D[], nomes: string[], inverso: THREE.Matrix4): MalhaFundida[] {
  const porMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
  for (const extra of extras) {
    extra.updateMatrixWorld(true);
    let osso: THREE.Object3D | null = extra.parent;
    while (osso && !(osso instanceof THREE.Bone)) osso = osso.parent;
    const indice = Math.max(0, nomes.indexOf(osso?.name ?? ''));
    for (const m of malhasDe(extra)) {
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      levarAoRig(g, new THREE.Matrix4().multiplyMatrices(inverso, m.matrixWorld)); // com os pedaços que se desprendem
      // 06/11/2026 (skins): o pano leva dois ossos por vértice (`sa`, `sb`, `sw`, com a tabela de nomes na malha) e o
      // `solto` que o vento usa; as peças rígidas seguem com um osso só e solto 0.
      const tabela = m.userData.tabela as string[] | undefined;
      const doPano = !!tabela && g.hasAttribute('sa') && g.hasAttribute('sb') && g.hasAttribute('sw');
      const lerAttr = (nome: string): number[] => {
        if (!g.hasAttribute(nome)) return [];
        const a = g.getAttribute(nome);
        return Array.from({ length: a.count }, (_, k) => a.getX(k));
      };
      const noRig = (n: number) => Math.max(0, nomes.indexOf(tabela?.[Math.round(n)] ?? ''));
      const solto = g.hasAttribute('solto') ? Float32Array.from(lerAttr('solto')) : null;
      const indA = doPano ? lerAttr('sa').map(noRig) : [];
      const indB = doPano ? lerAttr('sb').map(noRig) : [];
      const pesoA = doPano ? lerAttr('sw') : [];
      for (const n of Object.keys(g.attributes)) if (!ATRIBUTOS_DO_PANO.has(n)) g.deleteAttribute(n);
      const qtd = g.getAttribute('position').count;
      if (!g.hasAttribute('uv')) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(qtd * 2), 2));
      g.setAttribute('solto', new THREE.Float32BufferAttribute(solto ?? new Float32Array(qtd), 1));
      const si = new Uint16Array(qtd * 4);
      const sw = new Float32Array(qtd * 4);
      for (let k = 0; k < qtd; k++) {
        if (doPano) {
          si[k * 4] = indA[k] ?? 0;
          si[k * 4 + 1] = indB[k] ?? 0;
          sw[k * 4] = pesoA[k] ?? 1;
          sw[k * 4 + 1] = 1 - (pesoA[k] ?? 1);
        } else {
          si[k * 4] = indice;
          sw[k * 4] = 1;
        }
      }
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
      g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
      const mat = Array.isArray(m.material) ? m.material[0] : m.material;
      if (!mat) continue;
      const lista = porMaterial.get(mat) ?? [];
      lista.push(g);
      porMaterial.set(mat, lista);
    }
    extra.removeFromParent();
  }
  const saida: MalhaFundida[] = [];
  for (const [material, geos] of porMaterial) {
    const geometria = mergeGeometries(geos) as THREE.BufferGeometry | null;
    if (geometria) saida.push({ geometria, material });
  }
  return saida;
}
