// O traje que se desfaz em trevas (06/11/2026): os pedaços que se soltam do pano do Ceifador e se afastam como fumaça.
// Cada pedaço é um fiapo (um quadro com a textura macia de fumaça: a cabeça mais densa e a cauda que se esfiapa) que
// nasce no pano, segue o rumo dele, cresce e some, num ciclo contínuo com a fase própria. O movimento é do shader
// (`CODIGO_DO_DESPRENDER` em skin-pano.ts, materiais marcados com `desprendido`), não do vento: não estica nem volta.

import * as THREE from 'three';
import { sorteio, V } from './sombrio-base';
import { desprendido, ventoso } from './skin-pano';

/** Um pedaço: onde nasce (no pano), para onde vai (o rumo, já com a distância), o tamanho e o osso que o leva. */
export interface Pedaco {
  centro: THREE.Vector3;
  rumo: THREE.Vector3;
  largura: number;
  fase: number;
  osso: string;
}

/**
 * A textura do fiapo: a cabeça de fumaça em cima (v perto de 1) e a cauda que se esfiapa para baixo, com bordas
 * macias (o alfa cai devagar: nada de quadradinho duro). Escura, com um leve violeta nas bordas, fantasmagórica.
 */
function texturaDoFiapo(semente: number): THREE.CanvasTexture {
  const r = sorteio(semente);
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  if (!g) throw new Error('sem canvas 2d');
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const x = 64 + (r() - 0.5) * 36 * t, y = 50 + t * 190, raio = 44 * (1 - t * 0.75) * (0.7 + r() * 0.5);
    const grd = g.createRadialGradient(x, y, 0, x, y, raio);
    const a = 0.5 * (1 - t * 0.7);
    grd.addColorStop(0, `rgba(6,4,9,${a})`);
    grd.addColorStop(0.55, `rgba(22,14,30,${a * 0.6})`);
    grd.addColorStop(1, 'rgba(30,20,40,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 256);
  }
  // os fios da cauda
  g.strokeStyle = 'rgba(8,6,12,0.45)';
  for (let i = 0; i < 7; i++) {
    g.lineWidth = 2 + r() * 4;
    g.beginPath();
    let x = 40 + r() * 48;
    g.moveTo(x, 90);
    for (let y = 90; y < 250; y += 20) { x += (r() - 0.5) * 14; g.lineTo(x, y); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Os materiais dos fiapos: o mais denso (quase preto) e o de fumaça (mais leve). */
export function materiaisDasTrevas(): { densa: THREE.Material; fumo: THREE.Material } {
  const fiapo = (semente: number, opacidade: number, cor: number) => desprendido(ventoso(new THREE.MeshBasicMaterial({
    map: texturaDoFiapo(semente), color: cor, transparent: true, opacity: opacidade, depthWrite: false, side: THREE.DoubleSide, alphaTest: 0.02,
  })));
  return { densa: fiapo(951, 1, 0xffffff), fumo: fiapo(953, 0.65, 0xb8a8c8) };
}

/**
 * Os pedaços numa malha só: cada um é um quadro com o comprimento ao longo do rumo (a cabeça do fiapo vai na frente)
 * e a largura de lado, virado o mais possível para a frente (+z). Leva `centro` e `deriva` (o rumo e a fase) para o
 * shader, e os ossos pela tabela, como as superfícies de pano.
 */
export function fiapos(pedacos: readonly Pedaco[], m: THREE.Material): THREE.Mesh {
  const n = pedacos.length;
  const pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), centro = new Float32Array(n * 12), deriva = new Float32Array(n * 16);
  const sa = new Float32Array(n * 4), sb = new Float32Array(n * 4), sw = new Float32Array(n * 4).fill(1), solto = new Float32Array(n * 4).fill(0.15);
  const tabela: string[] = [];
  const indices: number[] = [];
  for (const [k, p] of pedacos.entries()) {
    let q = tabela.indexOf(p.osso);
    if (q < 0) q = tabela.push(p.osso) - 1;
    const eixo = p.rumo.clone().normalize();
    let lado = eixo.clone().cross(V(0, 0, 1));
    if (lado.lengthSq() < 1e-4) lado = V(1, 0, 0);
    lado.normalize();
    const w = p.largura / 2, h = p.largura;
    // a cabeça na frente do rumo, a cauda atrás
    const cantos: [number, number, number, number][] = [[-1, -1, 0, 0], [1, -1, 1, 0], [-1, 1, 0, 1], [1, 1, 1, 1]];
    for (const [i, [sx, sy, u, v]] of cantos.entries()) {
      const p0 = p.centro.clone().addScaledVector(lado, sx * w).addScaledVector(eixo, sy * h - h * 0.4);
      const o = k * 4 + i;
      pos.set([p0.x, p0.y, p0.z], o * 3);
      uv.set([u, v], o * 2);
      centro.set([p.centro.x, p.centro.y, p.centro.z], o * 3);
      deriva.set([p.rumo.x, p.rumo.y, p.rumo.z, p.fase], o * 4);
      sa[o] = q;
      sb[o] = q;
    }
    const b = k * 4;
    indices.push(b, b + 1, b + 2, b + 2, b + 1, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('centro', new THREE.BufferAttribute(centro, 3));
  g.setAttribute('deriva', new THREE.BufferAttribute(deriva, 4));
  g.setAttribute('sa', new THREE.BufferAttribute(sa, 1));
  g.setAttribute('sb', new THREE.BufferAttribute(sb, 1));
  g.setAttribute('sw', new THREE.BufferAttribute(sw, 1));
  g.setAttribute('solto', new THREE.BufferAttribute(solto, 1));
  g.setIndex(indices);
  g.computeVertexNormals();
  const malha = new THREE.Mesh(g, m);
  malha.userData.tabela = tabela;
  return malha;
}
