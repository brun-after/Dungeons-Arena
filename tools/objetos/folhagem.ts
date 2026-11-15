// A folhagem das árvores do cenário (marco 43, 15/11/2026, D-177). A copa de um icosaedro grande com facetas deixava
// ver os polígonos; aqui ela é feita como se lê uma copa de longe: dezenas de tufos pequenos de sombreado suave,
// espalhados em duas ou três massas, mais escuros por dentro (a luz não entra) e mais claros onde a luz do alto à
// esquerda bate, com um pouco de variação de tom de tufo para tufo. O pinheiro tem saias de galhos com a borda
// serrilhada e caída (as pontas dos ramos), também suaves. Todo o detalhe fica na imagem pré-renderizada: o jogo
// continua desenhando um sprite do mesmo tamanho. Roda só na ferramenta (tools/objetos), nunca no jogo.

import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** A luz que bate na copa (a mesma direção da luz-chave de pagina.ts: do alto, à esquerda e um pouco à frente). */
const LUZ = new THREE.Vector3(-0.55, 0.8, 0.35).normalize();

export interface Massa {
  centro: THREE.Vector3;
  /** Os raios do elipsoide (x, y, z). */
  raio: THREE.Vector3;
}

export interface CoresDaFolha {
  folha: number;
  topo: number;
  /** Quanto o miolo escurece (0 a 1). */
  miolo?: number;
  /** A variação de tom entre os tufos (0 a 1). */
  variar?: number;
}

function materialSuave(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: false, roughness: 1, metalness: 0, side: THREE.DoubleSide });
}

/** Ruído suave por direção (soma de senos), para a superfície do tufo ondular sem facetas grandes. */
function ondular(geo: THREE.BufferGeometry, forca: number, r: () => number): void {
  const pos = geo.getAttribute('position');
  const f = Array.from({ length: 5 }, () => [r() * 9 + 4, r() * Math.PI * 2] as const);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = v.clone().normalize();
    let n = 0;
    for (const [freq, fase] of f) n += Math.sin(d.x * freq + fase) * Math.sin(d.y * freq + fase * 1.7) * Math.sin(d.z * freq + fase * 0.6);
    v.multiplyScalar(1 + (n / f.length) * forca);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
}

/**
 * Pinta os vértices de um tufo: o miolo escuro (pela distância ao centro da massa), a luz pela direção da superfície,
 * o tom do topo onde a superfície olha para cima, e o desvio de tom deste tufo.
 */
function pintarTufo(geo: THREE.BufferGeometry, massa: Massa, cores: CoresDaFolha, desvio: THREE.Color): void {
  const pos = geo.getAttribute('position');
  const nor = geo.getAttribute('normal');
  const dados = new Float32Array(pos.count * 3);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const base = new THREE.Color(cores.folha);
  const topo = new THREE.Color(cores.topo);
  const c = new THREE.Color();
  const miolo = cores.miolo ?? 0.55;
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i).sub(massa.centro);
    n.fromBufferAttribute(nor, i);
    // 0 no centro da massa, 1 na casca.
    const fundo = Math.min(1, Math.hypot(p.x / massa.raio.x, p.y / massa.raio.y, p.z / massa.raio.z));
    const luz = Math.max(0, n.dot(LUZ));
    c.copy(base).lerp(topo, Math.min(1, Math.max(0, n.y * 0.7 + luz * 0.4 - 0.25)));
    c.multiply(desvio);
    c.multiplyScalar((1 - miolo) + miolo * fundo * fundo);
    dados.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(dados, 3));
}

/**
 * O truque da folhagem estilizada: a normal de cada tufo é puxada para a da copa (a direção a partir do centro da
 * massa). A luz passa a cair sobre a copa como um volume só e macio (sem o cacho de uvas de bolas acesas uma a uma),
 * e a silhueta continua recortada pelos tufos.
 */
function puxarNormais(geo: THREE.BufferGeometry, massa: Massa, quanto: number): void {
  const pos = geo.getAttribute('position');
  const nor = geo.getAttribute('normal');
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i).sub(massa.centro);
    p.set(p.x / massa.raio.x, p.y / massa.raio.y, p.z / massa.raio.z).normalize();
    n.fromBufferAttribute(nor, i).lerp(p, quanto).normalize();
    nor.setXYZ(i, n.x, n.y, n.z);
  }
}

/** O desvio de tom de um tufo: um pouco mais claro ou escuro, um pouco mais amarelo ou azulado. */
function desvioDoTufo(r: () => number, variar: number): THREE.Color {
  const v = 1 + (r() - 0.5) * variar;
  const quente = (r() - 0.5) * variar * 0.6;
  return new THREE.Color(v * (1 + quente), v, v * (1 - quente));
}

/**
 * A copa em tufos: `porMassa` tufos em cada massa, mais na casca que no miolo (o miolo não se vê), do tamanho de
 * `tamanho` (fração do raio da massa). Devolve uma malha só (as geometrias juntas).
 */
export function copaEmTufos(r: () => number, massas: readonly Massa[], cores: CoresDaFolha, porMassa = 26, tamanho = 0.34): THREE.Mesh {
  const geos: THREE.BufferGeometry[] = [];
  for (const m of massas) {
    const raioMedio = (m.raio.x + m.raio.y + m.raio.z) / 3;
    for (let i = 0; i < porMassa; i++) {
      // Um ponto do elipsoide, puxado para a casca.
      const t = r() * Math.PI * 2;
      const u = r() * 2 - 1;
      const s = Math.sqrt(1 - u * u);
      const casca = 0.45 + 0.55 * Math.sqrt(r());
      const centro = new THREE.Vector3(Math.cos(t) * s * m.raio.x, u * m.raio.y, Math.sin(t) * s * m.raio.z).multiplyScalar(casca).add(m.centro);
      const raio = raioMedio * tamanho * (0.7 + r() * 0.6);
      let geo: THREE.BufferGeometry = new THREE.IcosahedronGeometry(raio, 2);
      geo.deleteAttribute('uv');
      geo = mergeVertices(geo);
      ondular(geo, 0.38, r);
      geo.scale(1, 0.85, 1);
      geo.translate(centro.x, centro.y, centro.z);
      geo.computeVertexNormals();
      puxarNormais(geo, m, 0.72);
      pintarTufo(geo, m, cores, desvioDoTufo(r, cores.variar ?? 0.18));
      geos.push(geo);
    }
  }
  const junta = mergeGeometries(geos);
  return new THREE.Mesh(junta, materialSuave());
}

/**
 * Uma saia do pinheiro: o cone aberto com a borda serrilhada (as pontas dos ramos, alternando longas e curtas, caídas)
 * e a superfície ondulada; o lado de baixo e o miolo escuros, as pontas claras.
 */
export function saiaDePinheiro(r: () => number, raio: number, altura: number, base: number, cores: CoresDaFolha & { neve?: boolean }): THREE.Mesh {
  const lados = 18;
  let geo: THREE.BufferGeometry = new THREE.ConeGeometry(raio, altura, lados, 3, true);
  geo.deleteAttribute('uv');
  geo = mergeVertices(geo);
  const pos = geo.getAttribute('position');
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = (v.y + altura / 2) / altura; // 0 na borda, 1 na ponta
    // O cone do three.js põe o vértice k no ângulo atan2(x, z) = k·2π/lados: a paridade de k alterna as pontas.
    const k = Math.round((Math.atan2(v.x, v.z) / (Math.PI * 2)) * lados);
    const ponta = ((k % 2) + 2) % 2 === 0;
    const borda = 1 - t;
    // As pontas dos ramos: na borda, uma sim uma não sai mais e cai; no resto, um ondulado leve.
    const fora = 1 + (ponta ? 0.3 : -0.1) * borda * borda;
    v.x *= fora;
    v.z *= fora;
    v.y -= (ponta ? 0.3 : 0.02) * altura * borda * borda;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.translate(0, base + altura / 2, 0);
  geo.computeVertexNormals();
  const nor = geo.getAttribute('normal');
  const dados = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const folha = new THREE.Color(cores.folha);
  const topo = new THREE.Color(cores.neve ? 0xeef3f8 : cores.topo);
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    const t = (v.y - base) / altura;
    const luz = Math.max(0, n.dot(LUZ));
    // A neve só pousa no alto das pontas que olham para cima; o capim claro, nas pontas iluminadas.
    const claro = cores.neve ? Math.min(0.9, Math.max(0, (n.y - 0.62) * 3) * (0.35 + (1 - t) * 0.65)) : Math.min(1, luz * 0.6 + (1 - t) * 0.2);
    c.copy(folha).lerp(topo, claro);
    // O lado de baixo da saia (a normal para baixo) fica na sombra: é o que separa um andar de ramos do outro.
    const baixo = n.y < 0 ? 0.32 : 1;
    const escuro = (0.5 + 0.5 * Math.min(1, (1 - t) * 1.1 + luz * 0.35)) * baixo;
    c.multiplyScalar(escuro * (1 + (r() - 0.5) * 0.06));
    dados.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(dados, 3));
  geo.rotateY(r() * Math.PI);
  return new THREE.Mesh(geo, materialSuave());
}
