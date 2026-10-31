// As armas na mão (marco 32, 31/10/2026, D-131): cada desenho (armas3d.ts) sai num atlas com os 6 graus de raridade
// lado a lado, de frente e um pouco girado (mostra o volume), com a mesma luz e o mesmo acabamento dos personagens. O
// jogo prende o punho (a origem do modelo) na mão medida em cada quadro e gira a arma para o eixo dela.

import * as THREE from 'three';
import { ARMAS_3D, ESCALA_DO_GRAU, Kit } from './armas3d';
import { posProcessar } from './pos';

/** A cor de destaque de cada grau: a da raridade (objetos.ts COR_RARIDADE). */
const ACENTOS = [0x888888, 0x2ecc71, 0x3498db, 0x9b59b6, 0xf39c12, 0xff4d6d] as const;
const FOLGA = 3;

export interface SaidaArma {
  nome: string;
  png: string;
  /** O quadro de cada grau (px) e o punho dentro dele. */
  celL: number;
  celA: number;
  pegaX: number;
  pegaY: number;
}

function montar(nome: string, grau: number): THREE.Group {
  const k = new Kit(grau, ACENTOS[grau] ?? 0x888888);
  ARMAS_3D[nome]?.(k);
  const g = k.g;
  g.scale.setScalar(ESCALA_DO_GRAU[grau] ?? 1);
  // Um pouco de lado e de cima: o volume aparece sem perder a silhueta.
  g.rotation.set(-0.22, 0.38, 0);
  const pai = new THREE.Group();
  pai.add(g);
  pai.updateMatrixWorld(true);
  return pai;
}

export function renderizarArmas(nomes: string[], pxCelula: number, exposicao: number): SaidaArma[] {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposicao;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const saidas: SaidaArma[] = [];
  for (const nome of nomes) {
    const graus = ESCALA_DO_GRAU.map((_, i) => montar(nome, i));
    // A caixa de todos os graus (o maior manda), com o punho na mesma posição em todos.
    const caixa = new THREE.Box3();
    for (const g of graus) caixa.union(new THREE.Box3().setFromObject(g));
    const celL = Math.ceil((caixa.max.x - caixa.min.x) * pxCelula) + FOLGA * 2;
    const celA = Math.ceil((caixa.max.y - caixa.min.y) * pxCelula) + FOLGA * 2;
    const esq = caixa.min.x - FOLGA / pxCelula;
    const topo = caixa.max.y + FOLGA / pxCelula;
    const camera = new THREE.OrthographicCamera(esq, esq + celL / pxCelula, topo, topo - celA / pxCelula, -10, 10);
    camera.position.set(0, 0, 5);
    renderer.setSize(celL, celA, false);
    const atlas = document.createElement('canvas');
    atlas.width = celL * graus.length;
    atlas.height = celA;
    const g2 = atlas.getContext('2d');
    if (!g2) throw new Error('sem canvas 2d');
    graus.forEach((g, i) => {
      const cena = new THREE.Scene();
      cena.add(g);
      cena.add(new THREE.HemisphereLight(0x9aa6c0, 0x2a2018, 0.9));
      const principal = new THREE.DirectionalLight(0xffd9a8, 2.6);
      principal.position.set(-4, 9, 6);
      const recorte = new THREE.DirectionalLight(0x7fa6ff, 1.4);
      recorte.position.set(6, 5, -7);
      const enchimento = new THREE.DirectionalLight(0xffffff, 0.5);
      enchimento.position.set(5, 2, 6);
      cena.add(principal, recorte, enchimento);
      renderer.render(cena, camera);
      g2.drawImage(renderer.domElement, i * celL, 0);
    });
    posProcessar(g2, atlas.width, atlas.height);
    saidas.push({ nome, png: atlas.toDataURL('image/png'), celL, celA, pegaX: Math.round(-esq * pxCelula), pegaY: Math.round(topo * pxCelula) });
  }
  renderer.dispose();
  return saidas;
}
