// Modelos procedurais da ferramenta de objetos (marco 43, 15/11/2026, D-177): as rochas, as árvores e as peças de
// madeira e pedra do cenário, feitas aqui em three.js (sem pacote de fora), em facetas (flat shading), no mesmo
// espírito low-poly dos pacotes CC0 e com a mesma luz e o mesmo contorno (pagina.ts). Cada modelo sai de um nome e
// de uma semente: `p:rocha:7`, `p:carvalho:3`... A unidade é a célula do jogo (1 = uma célula; a pessoa tem ~1,1).
// Roda só na ferramenta (tools/objetos), nunca no jogo.

import * as THREE from 'three';

/** Gerador de números da semente (mulberry32): o mesmo modelo sai igual toda vez. */
function rng(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cor = (hex: number) => new THREE.Color(hex);

/** Material de facetas com a cor por vértice. */
function material(rugoso = 0.95): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: rugoso, metalness: 0 });
}

/** Pinta cada vértice: a cor base, mais escura embaixo, e a do topo onde a face olha para cima (musgo, neve, capim). */
function pintar(geo: THREE.BufferGeometry, base: number, opcoes: { topo?: number; limiar?: number; escurecerPe?: number; variar?: number; r?: () => number } = {}): void {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.copy(g);
  geo.computeVertexNormals();
  const pos = geo.getAttribute('position');
  const nor = geo.getAttribute('normal');
  const caixa = new THREE.Box3().setFromBufferAttribute(pos as THREE.BufferAttribute);
  const alt = Math.max(1e-4, caixa.max.y - caixa.min.y);
  const cores = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const r = opcoes.r ?? Math.random;
  // Uma variação por face (três vértices), para as facetas não saírem todas iguais.
  for (let i = 0; i < pos.count; i += 3) {
    const ny = ((nor.getY(i) + nor.getY(i + 1) + nor.getY(i + 2)) / 3);
    const y = ((pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3 - caixa.min.y) / alt;
    const v = 1 + ((r() - 0.5) * (opcoes.variar ?? 0.12));
    c.set(base);
    if (opcoes.topo !== undefined && ny > (opcoes.limiar ?? 0.55)) c.lerp(cor(opcoes.topo), Math.min(1, (ny - (opcoes.limiar ?? 0.55)) * 3));
    const pe = 1 - (opcoes.escurecerPe ?? 0.35) * (1 - Math.min(1, y * 1.6));
    c.multiplyScalar(v * pe);
    for (let k = 0; k < 3; k++) cores.set([c.r, c.g, c.b], (i + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cores, 3));
}

/** Desloca os vértices de um sólido pelo ruído (soma de senos com fases da semente). */
function amassar(geo: THREE.BufferGeometry, forca: number, r: () => number): void {
  const pos = geo.getAttribute('position');
  const f = Array.from({ length: 6 }, () => [r() * 6 + 1, r() * Math.PI * 2] as const);
  const v = new THREE.Vector3();
  // Mesmo ponto, mesmo deslocamento (o sólido indexado não racha).
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = v.clone().normalize();
    let n = 0;
    for (const [freq, fase] of f) n += Math.sin(d.x * freq + fase) * Math.sin(d.y * freq * 0.8 + fase * 1.3) * Math.sin(d.z * freq * 1.1 + fase * 0.7);
    v.addScaledVector(d, (n / f.length) * forca * 3);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
}

function malha(geo: THREE.BufferGeometry, mat = material()): THREE.Mesh {
  return new THREE.Mesh(geo, mat);
}

export interface OpcoesRocha {
  largura: number;
  altura: number;
  cor: number;
  topo?: number;
  /** 0 = arredondada; 1 = em lascas. */
  lascas?: number;
}

/** Uma rocha: o icosaedro amassado, achatado no pé (assenta no chão) e com o topo pintado (musgo, neve). */
export function rocha(semente: number, o: OpcoesRocha): THREE.Mesh {
  const r = rng(semente);
  const geo = new THREE.IcosahedronGeometry(1, o.lascas && o.lascas > 0.5 ? 1 : 2);
  amassar(geo, 0.14 + (o.lascas ?? 0) * 0.1, r);
  geo.scale(o.largura / 2, o.altura, (o.largura / 2) * (0.75 + r() * 0.35));
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) < 0) pos.setY(i, pos.getY(i) * 0.15);
  geo.rotateY(r() * Math.PI * 2);
  pintar(geo, o.cor, { ...(o.topo !== undefined && { topo: o.topo }), limiar: 0.5, escurecerPe: 0.4, variar: 0.16, r });
  return malha(geo);
}

/** O tronco (cilindro afinando, levemente torto) de `altura` e raio `raio` no pé. */
function tronco(r: () => number, altura: number, raio: number, corTronco: number): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(raio * 0.55, raio, altura, 6, 3, false);
  geo.translate(0, altura / 2, 0);
  const pos = geo.getAttribute('position');
  const curva = (r() - 0.5) * 0.25;
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / altura;
    pos.setX(i, pos.getX(i) + curva * t * t);
  }
  pintar(geo, corTronco, { escurecerPe: 0.2, variar: 0.2, r });
  return malha(geo);
}

/** Uma copa: a bola de facetas amassada, mais clara em cima. */
function copa(r: () => number, raio: number, corFolha: number, topo: number): THREE.Mesh {
  const geo = new THREE.IcosahedronGeometry(raio, 1);
  amassar(geo, 0.12, r);
  geo.scale(1, 0.82, 1);
  pintar(geo, corFolha, { topo, limiar: 0.35, escurecerPe: 0.45, variar: 0.22, r });
  return malha(geo);
}

export interface OpcoesArvore {
  altura: number;
  folha: number;
  topo: number;
  tronco: number;
}

/** A árvore de folhas (carvalho, faia): o tronco, dois ou três galhos e de cinco a oito copas em volta do alto. */
export function folhosa(semente: number, o: OpcoesArvore): THREE.Group {
  const r = rng(semente);
  const g = new THREE.Group();
  const alturaTronco = o.altura * (0.42 + r() * 0.1);
  g.add(tronco(r, alturaTronco, 0.13 + r() * 0.04, o.tronco));
  const copas = 5 + Math.floor(r() * 4);
  const raioCopa = o.altura * 0.2;
  for (let i = 0; i < copas; i++) {
    const a = (i / copas) * Math.PI * 2 + r() * 0.6;
    const d = raioCopa * (0.55 + r() * 0.5);
    const c = copa(r, raioCopa * (0.7 + r() * 0.45), o.folha, o.topo);
    c.position.set(Math.cos(a) * d, alturaTronco + raioCopa * (0.4 + r() * 0.9), Math.sin(a) * d);
    g.add(c);
  }
  const alto = copa(r, raioCopa * 1.05, o.folha, o.topo);
  alto.position.set(0, alturaTronco + raioCopa * 1.4, 0);
  g.add(alto);
  return g;
}

/** O pinheiro: o tronco e quatro ou cinco saias de cone, recortadas, mais estreitas para cima (com neve, se pedir). */
export function pinheiro(semente: number, o: OpcoesArvore & { neve?: boolean }): THREE.Group {
  const r = rng(semente);
  const g = new THREE.Group();
  g.add(tronco(r, o.altura * 0.3, 0.1, o.tronco));
  const saias = 4 + Math.floor(r() * 2);
  for (let i = 0; i < saias; i++) {
    const t = i / saias;
    const raio = o.altura * 0.24 * (1 - t * 0.72);
    const alt = o.altura * 0.34 * (1 - t * 0.55);
    const geo = new THREE.ConeGeometry(raio, alt, 8, 1, false);
    amassar(geo, 0.05, r);
    geo.translate(0, o.altura * (0.2 + t * 0.62) + alt / 2, 0);
    geo.rotateY(r() * Math.PI);
    pintar(geo, o.folha, { topo: o.neve ? 0xf2f6fa : o.topo, limiar: o.neve ? 0.5 : 0.5, escurecerPe: 0.25, variar: 0.2, r });
    g.add(malha(geo));
  }
  return g;
}

/** A árvore morta: o tronco seco e galhos quebrados, sem folha. */
export function arvoreMorta(semente: number, o: { altura: number; tronco: number }): THREE.Group {
  const r = rng(semente);
  const g = new THREE.Group();
  const alt = o.altura * 0.75;
  g.add(tronco(r, alt, 0.12, o.tronco));
  const galhos = 3 + Math.floor(r() * 3);
  for (let i = 0; i < galhos; i++) {
    const comp = o.altura * (0.25 + r() * 0.25);
    const geo = new THREE.CylinderGeometry(0.02, 0.05, comp, 5);
    geo.translate(0, comp / 2, 0);
    pintar(geo, o.tronco, { variar: 0.2, r });
    const m = malha(geo);
    m.position.set(0, alt * (0.45 + r() * 0.5), 0);
    m.rotation.set((r() - 0.5) * 0.4, r() * Math.PI * 2, 0.6 + r() * 0.6);
    g.add(m);
  }
  return g;
}

/** O arbusto: três a cinco bolinhas de folha rente ao chão. */
export function arbusto(semente: number, o: { largura: number; folha: number; topo: number }): THREE.Group {
  const r = rng(semente);
  const g = new THREE.Group();
  const n = 3 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const c = copa(r, o.largura * (0.22 + r() * 0.12), o.folha, o.topo);
    c.position.set((r() - 0.5) * o.largura * 0.6, o.largura * 0.18, (r() - 0.5) * o.largura * 0.6);
    g.add(c);
  }
  return g;
}

/** Um tronco deitado (caído no chão, a lenha). */
export function toraDeitada(semente: number, o: { comprimento: number; raio: number; cor: number; corte?: number }): THREE.Mesh {
  const r = rng(semente);
  const geo = new THREE.CylinderGeometry(o.raio, o.raio * 1.05, o.comprimento, 7, 1);
  geo.rotateZ(Math.PI / 2);
  geo.translate(0, o.raio, 0);
  pintar(geo, o.cor, { topo: o.corte ?? o.cor, limiar: 2, variar: 0.18, escurecerPe: 0.3, r });
  const m = malha(geo);
  m.rotation.y = r() * Math.PI;
  return m;
}

/** O cacto de braços (deserto). */
export function cacto(semente: number, o: { altura: number; cor: number }): THREE.Group {
  const r = rng(semente);
  const g = new THREE.Group();
  const corpo = new THREE.CylinderGeometry(0.11, 0.13, o.altura, 7);
  corpo.translate(0, o.altura / 2, 0);
  pintar(corpo, o.cor, { variar: 0.15, escurecerPe: 0.25, r });
  g.add(malha(corpo));
  for (const lado of [-1, 1]) {
    if (r() < 0.25) continue;
    const h = o.altura * (0.3 + r() * 0.25);
    const braco = new THREE.CylinderGeometry(0.07, 0.08, h, 6);
    braco.translate(lado * 0.24, o.altura * (0.35 + r() * 0.2) + h / 2, 0);
    pintar(braco, o.cor, { variar: 0.15, r });
    g.add(malha(braco));
    const liga = new THREE.CylinderGeometry(0.06, 0.06, 0.26, 6);
    liga.rotateZ(Math.PI / 2);
    liga.translate(lado * 0.12, o.altura * 0.36, 0);
    pintar(liga, o.cor, { r });
    g.add(malha(liga));
  }
  g.rotation.y = r() * Math.PI;
  return g;
}

/** Os juncos do brejo: hastes finas em tufo. */
export function juncos(semente: number, o: { altura: number; cor: number; ponta: number }): THREE.Group {
  const r = rng(semente);
  const g = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const h = o.altura * (0.5 + r() * 0.6);
    const geo = new THREE.ConeGeometry(0.02, h, 4);
    geo.translate(0, h / 2, 0);
    pintar(geo, o.cor, { topo: o.ponta, limiar: -1, variar: 0.25, escurecerPe: 0.3, r });
    const m = malha(geo);
    m.position.set((r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5);
    m.rotation.set((r() - 0.5) * 0.35, 0, (r() - 0.5) * 0.35);
    g.add(m);
  }
  return g;
}

/** Um poste de madeira quadrado (os postes de tocha, de lanterna, as placas). */
export function poste(semente: number, o: { altura: number; cor: number; lado?: number }): THREE.Mesh {
  const r = rng(semente);
  const lado = o.lado ?? 0.1;
  const geo = new THREE.BoxGeometry(lado, o.altura, lado, 1, 3, 1);
  geo.translate(0, o.altura / 2, 0);
  pintar(geo, o.cor, { variar: 0.2, escurecerPe: 0.3, r });
  return malha(geo);
}

/** Uma caixa de pedra ou madeira (o anel do poço, o cocho, a base). */
export function bloco(semente: number, o: { x: number; y: number; z: number; cor: number; topo?: number }): THREE.Mesh {
  const r = rng(semente);
  const geo = new THREE.BoxGeometry(o.x, o.y, o.z, 2, 1, 2);
  geo.translate(0, o.y / 2, 0);
  pintar(geo, o.cor, { ...(o.topo !== undefined && { topo: o.topo }), limiar: 0.9, variar: 0.18, escurecerPe: 0.3, r });
  return malha(geo);
}

/** O anel de pedra (o poço, a fogueira): `n` pedrinhas em volta. */
export function anelDePedras(semente: number, o: { raio: number; n: number; tamanho: number; cor: number }): THREE.Group {
  const r = rng(semente);
  const g = new THREE.Group();
  for (let i = 0; i < o.n; i++) {
    const a = (i / o.n) * Math.PI * 2;
    const p = rocha(semente * 31 + i, { largura: o.tamanho * (0.8 + r() * 0.4), altura: o.tamanho * (0.5 + r() * 0.3), cor: o.cor });
    p.position.set(Math.cos(a) * o.raio, 0, Math.sin(a) * o.raio);
    g.add(p);
  }
  return g;
}

/** O cilindro de pedra (a boca do poço, o marco). */
export function cilindroDePedra(semente: number, o: { raio: number; altura: number; cor: number; oco?: boolean }): THREE.Mesh {
  const r = rng(semente);
  const geo = o.oco ? new THREE.CylinderGeometry(o.raio, o.raio * 1.05, o.altura, 10, 2, true) : new THREE.CylinderGeometry(o.raio, o.raio * 1.05, o.altura, 10, 2);
  geo.translate(0, o.altura / 2, 0);
  pintar(geo, o.cor, { variar: 0.22, escurecerPe: 0.35, r });
  const m = malha(geo, material());
  if (o.oco && m.material instanceof THREE.MeshStandardMaterial) m.material.side = THREE.DoubleSide;
  return m;
}

/** O telhadinho de duas águas (o poço, a banca). */
export function telhadinho(semente: number, o: { largura: number; profundidade: number; altura: number; cor: number }): THREE.Mesh {
  const r = rng(semente);
  const forma = new THREE.Shape();
  forma.moveTo(-o.largura / 2, 0);
  forma.lineTo(o.largura / 2, 0);
  forma.lineTo(0, o.altura);
  forma.closePath();
  const geo = new THREE.ExtrudeGeometry(forma, { depth: o.profundidade, bevelEnabled: false });
  geo.translate(0, 0, -o.profundidade / 2);
  pintar(geo, o.cor, { variar: 0.2, escurecerPe: 0.1, r });
  return malha(geo);
}

/** O fardo de feno (cilindro deitado, palha). */
export function feno(semente: number): THREE.Mesh {
  return toraDeitada(semente, { comprimento: 0.62, raio: 0.3, cor: 0xc8a650, corte: 0xd8bc6a });
}

/** Monta o modelo procedural pelo nome (`p:tipo:semente`); null se o tipo não existe. */
export function modeloProcedural(nome: string): THREE.Object3D | null {
  const [, tipo = '', s = '1'] = nome.split(':');
  const semente = Number(s) || 1;
  const r = rng(semente * 7919);
  switch (tipo) {
    case 'rocha_cinza': return rocha(semente, { largura: 0.7 + r() * 0.5, altura: 0.35 + r() * 0.35, cor: 0x7a7670, topo: 0x6a7a48 });
    case 'rochedo_cinza': return rocha(semente, { largura: 1.5 + r() * 0.6, altura: 0.9 + r() * 0.6, cor: 0x77736c, topo: 0x667846, lascas: 0.6 });
    case 'rocha_neve': return rocha(semente, { largura: 0.8 + r() * 0.6, altura: 0.45 + r() * 0.4, cor: 0x80848e, topo: 0xf0f4f8 });
    case 'rochedo_neve': return rocha(semente, { largura: 1.6 + r() * 0.6, altura: 1 + r() * 0.6, cor: 0x7c808a, topo: 0xf2f6fa, lascas: 0.7 });
    case 'rocha_arenito': return rocha(semente, { largura: 0.8 + r() * 0.5, altura: 0.4 + r() * 0.4, cor: 0xa08060, topo: 0xb89870 });
    case 'rochedo_arenito': return rocha(semente, { largura: 1.6 + r() * 0.7, altura: 1.1 + r() * 0.8, cor: 0x9c7c5c, topo: 0xb89870, lascas: 0.8 });
    case 'rocha_musgo': return rocha(semente, { largura: 0.8 + r() * 0.5, altura: 0.4 + r() * 0.35, cor: 0x5f6258, topo: 0x4a6a32 });
    case 'carvalho': return folhosa(semente, { altura: 2.6 + r() * 0.9, folha: 0x3a5826, topo: 0x627e34, tronco: 0x5a4430 });
    case 'faia': return folhosa(semente, { altura: 2.2 + r() * 0.8, folha: 0x4a6430, topo: 0x7a8c3e, tronco: 0x6a5a48 });
    case 'outono': return folhosa(semente, { altura: 2.3 + r() * 0.8, folha: 0x9a6a2a, topo: 0xc8943a, tronco: 0x5a4430 });
    case 'pinheiro': return pinheiro(semente, { altura: 2.8 + r() * 1.1, folha: 0x34503a, topo: 0x52704a, tronco: 0x4a3626 });
    case 'pinheiro_neve': return pinheiro(semente, { altura: 2.6 + r() * 1, folha: 0x2e4636, topo: 0x4a6a40, tronco: 0x4a3626, neve: true });
    case 'morta': return arvoreMorta(semente, { altura: 2.2 + r() * 0.8, tronco: 0x5a5048 });
    case 'arbusto': return arbusto(semente, { largura: 0.9 + r() * 0.3, folha: 0x48662e, topo: 0x7a9440 });
    case 'arbusto_seco': return arbusto(semente, { largura: 0.8 + r() * 0.3, folha: 0x7a6a3a, topo: 0x9a8a4a });
    case 'cacto': return cacto(semente, { altura: 1 + r() * 0.6, cor: 0x5a7a3a });
    case 'juncos': return juncos(semente, { altura: 0.9, cor: 0x5a6a30, ponta: 0x8a7a40 });
    case 'tora': return toraDeitada(semente, { comprimento: 1.3, raio: 0.14, cor: 0x5a4430, corte: 0xb08a5a });
    case 'toco': {
      const g = new THREE.Group();
      const geo = new THREE.CylinderGeometry(0.16, 0.2, 0.28, 7);
      geo.translate(0, 0.14, 0);
      pintar(geo, 0x5a4430, { topo: 0xb08a5a, limiar: 0.9, r });
      g.add(malha(geo));
      return g;
    }
    case 'feno': return feno(semente);
    // As peças das receitas compostas (receitas-cenario.ts).
    case 'poste': return poste(semente, { altura: 1.7, cor: 0x5a4430, lado: 0.11 });
    case 'poste_alto': return poste(semente, { altura: 2.1, cor: 0x4e3a28, lado: 0.12 });
    case 'trave': {
      const m = poste(semente, { altura: 0.42, cor: 0x4e3a28, lado: 0.06 });
      m.rotation.z = Math.PI / 2;
      return m;
    }
    case 'boca_poco': return cilindroDePedra(semente, { raio: 0.42, altura: 0.5, cor: 0x7e7a72 });
    case 'agua_poco': {
      const geo = new THREE.CircleGeometry(0.36, 12);
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, 0.46, 0);
      return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x1a2a34, roughness: 0.2 }));
    }
    case 'telhado_poco': return telhadinho(semente, { largura: 1.1, profundidade: 0.9, altura: 0.42, cor: 0x6a4630 });
    case 'pedras_fogueira': return anelDePedras(semente, { raio: 0.34, n: 9, tamanho: 0.2, cor: 0x6e6a64 });
    case 'lenha_fogueira': {
      const g = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const t = toraDeitada(semente + i, { comprimento: 0.55, raio: 0.05, cor: 0x3a2a1e, corte: 0x1e1612 });
        t.rotation.set(0, (i / 4) * Math.PI, 0.35);
        t.position.set(0, 0.04, 0);
        g.add(t);
      }
      return g;
    }
    case 'brasa': {
      const geo = new THREE.IcosahedronGeometry(0.16, 1);
      geo.scale(1.3, 0.35, 1.3);
      geo.translate(0, 0.04, 0);
      return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x3a1408, emissive: 0xff6018, emissiveIntensity: 1.6, flatShading: true }));
    }
    case 'braseiro': {
      // O cesto de ferro no alto do poste: a tigela aberta, as hastes e a brasa dentro (a chama é do jogo, animada).
      const g = new THREE.Group();
      const tigela = new THREE.CylinderGeometry(0.17, 0.09, 0.16, 8, 1, true);
      tigela.translate(0, 0.08, 0);
      const ferro = new THREE.MeshStandardMaterial({ color: 0x2a2624, roughness: 0.6, metalness: 0.5, flatShading: true, side: THREE.DoubleSide });
      g.add(new THREE.Mesh(tigela, ferro));
      for (let i = 0; i < 4; i++) {
        const haste = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 4);
        const a = (i / 4) * Math.PI * 2;
        haste.rotateZ(0.5);
        haste.rotateY(a);
        haste.translate(Math.cos(a) * 0.12, 0.12, Math.sin(a) * 0.12);
        g.add(new THREE.Mesh(haste, ferro));
      }
      const brasa = new THREE.IcosahedronGeometry(0.13, 1);
      brasa.scale(1, 0.5, 1);
      brasa.translate(0, 0.13, 0);
      g.add(new THREE.Mesh(brasa, new THREE.MeshStandardMaterial({ color: 0x3a1408, emissive: 0xff5a10, emissiveIntensity: 1.4, flatShading: true })));
      return g;
    }
    case 'pilha_lenha': {
      const g = new THREE.Group();
      let i = 0;
      for (let camada = 0; camada < 3; camada++) {
        for (let k = 0; k < 4 - camada; k++) {
          const t = toraDeitada(semente + i++, { comprimento: 0.9, raio: 0.09, cor: 0x5a4430, corte: 0xb08a5a });
          t.rotation.set(0, Math.PI / 2, 0);
          t.position.set((k - (3 - camada) / 2) * 0.19, camada * 0.16, 0);
          g.add(t);
        }
      }
      return g;
    }
    case 'cerca': {
      const g = new THREE.Group();
      for (const x of [-0.45, 0, 0.45]) {
        const m = poste(semente, { altura: 0.62, cor: 0x5a4430, lado: 0.07 });
        m.position.x = x;
        g.add(m);
      }
      for (const y of [0.25, 0.48]) {
        const t = bloco(semente + 3, { x: 1, y: 0.05, z: 0.04, cor: 0x6a5038 });
        t.position.y = y;
        g.add(t);
      }
      return g;
    }
    case 'marco_pedra': return rocha(semente, { largura: 0.32, altura: 0.75, cor: 0x8a867e, topo: 0x6a7a48 });
    case 'placa': {
      const g = new THREE.Group();
      g.add(poste(semente, { altura: 1.25, cor: 0x5a4430, lado: 0.08 }));
      const tabua = bloco(semente + 1, { x: 0.62, y: 0.2, z: 0.05, cor: 0x7a5a3a });
      tabua.position.set(0.18, 0.95, 0);
      tabua.rotation.y = 0.2;
      g.add(tabua);
      return g;
    }
    case 'cocho': return bloco(semente, { x: 1, y: 0.32, z: 0.4, cor: 0x6a5038, topo: 0x2a3a40 });
    default: return null;
  }
}
