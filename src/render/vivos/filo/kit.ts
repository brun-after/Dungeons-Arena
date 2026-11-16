// Marco 45 (16/11/2026, D-182): o kit das criaturas de Filo, feitas do zero em geometria (nenhum modelo de pacote).
// Como as feras do Aventureiro (feras-vivas.ts): peças rígidas em pivôs com nome (`f_…`, para o palco assar os clipes)
// e uma pose por estado (`animar`). Aqui ficam os materiais (a paleta sombria com o sotaque da dimensão: o brilho
// discreto da cor dela, nunca o corpo inteiro), as peças que se repetem (olhos, cristais, chamas, flocos, faíscas,
// fungos, penas) e os animadores dos tipos de corpo (bolha, bicho de quatro patas, inseto, objeto da arena).

import * as THREE from 'three';
import type { EstadoFera, Fera } from '../feras-vivas';

export type { EstadoFera, Fera };

/** O brilho de cada dimensão (o `cor` de dimensoes.json) e um tom escuro de apoio. */
export const SOTAQUE = {
  ignarea: 0xff7a2f, hiemalia: 0x9fd8ff, fulguria: 0xffd84a, putrevia: 0x7fcf4f, umbralia: 0x6b4fa0,
  oniria: 0xd79bff, litia: 0xc79bff, halonia: 0xffe27a, zefiria: 0xbfe8ff,
} as const;
export type Dimensao = keyof typeof SOTAQUE;

export const mat = (cor: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color: cor, roughness: 0.82, ...o });
/** O que brilha sozinho (a brasa, o olho, o cristal aceso). */
export const brilho = (cor: number, forca = 1, o: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial =>
  mat(cor, { emissive: cor, emissiveIntensity: forca, roughness: 0.35, ...o });
/** O vidro, o gelo, o cristal: translúcido e liso. */
export const vidro = (cor: number, opacidade = 0.7, forca = 0.35): THREE.MeshStandardMaterial =>
  mat(cor, { transparent: true, opacity: opacidade, roughness: 0.08, metalness: 0.1, emissive: cor, emissiveIntensity: forca, depthWrite: opacidade > 0.85 });
export const metalico = (cor: number, roughness = 0.4): THREE.MeshStandardMaterial => mat(cor, { metalness: 0.85, roughness });

export const ciclo = (f: number, fase = 0): number => Math.sin(f * Math.PI * 2 + fase);
export const suave = (t: number): number => { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); };
/** O arco de um golpe: sobe até `pico` e volta (de 0 a 1 e de volta a 0). */
export const arco = (f: number, pico = 0.45): number => (f < pico ? suave(f / pico) : 1 - suave((f - pico) / (1 - pico)));

export function pivo(nome: string, pai: THREE.Object3D, x = 0, y = 0, z = 0): THREE.Group {
  const g = new THREE.Group();
  g.name = `f_${nome}`;
  g.position.set(x, y, z);
  pai.add(g);
  return g;
}
export function bola(r: number, m: THREE.Material, sx = 1, sy = 1, sz = 1, ls = 18, as = 14): THREE.Mesh {
  const b = new THREE.Mesh(new THREE.SphereGeometry(r, ls, as), m);
  b.scale.set(sx, sy, sz);
  return b;
}
/** Um segmento pendurado do pivô para baixo (pernas, braços, antenas). */
export function osso(raio: number, compr: number, m: THREE.Material, raioFim = raio, lados = 9): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(raioFim, raio, compr, lados);
  geo.translate(0, -compr / 2, 0);
  return new THREE.Mesh(geo, m);
}
export function cone(r: number, a: number, m: THREE.Material, lados = 7): THREE.Mesh {
  return new THREE.Mesh(new THREE.ConeGeometry(r, a, lados), m);
}
export function em<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): T {
  o.position.set(x, y, z);
  o.rotation.set(rx, ry, rz);
  return o;
}
/** Um número de 0 a 1 que não muda entre gerações (as posições "ao acaso" das pontas e das penas). */
export function sorte(semente: number): () => number {
  let s = semente >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------- peças ----------

/** Os olhos: o branco grande dos fofos (com o brilho) ou a brasa pequena dos ferozes. */
export function olhos(pai: THREE.Object3D, o: { x: number; y: number; z: number; r: number; fofo?: boolean; cor?: number; forca?: number }): THREE.Mesh[] {
  const saida: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    if (o.fofo) {
      const branco = em(bola(o.r, mat(0x101014, { roughness: 0.15 }), 1, 1.25, 0.6), s * o.x, o.y, o.z);
      const reflexo = em(bola(o.r * 0.32, new THREE.MeshBasicMaterial({ color: 0xffffff })), s * o.x - o.r * 0.25, o.y + o.r * 0.35, o.z + o.r * 0.45);
      pai.add(branco, reflexo);
      saida.push(branco);
    } else {
      const olho = em(bola(o.r, brilho(o.cor ?? 0xffb347, o.forca ?? 1.4)), s * o.x, o.y, o.z);
      pai.add(olho);
      saida.push(olho);
    }
  }
  return saida;
}

/** Pontas de cristal (geodo, gelo, vidro) num leque em volta de um eixo. */
export function cristais(pai: THREE.Object3D, n: number, raio: number, altura: number, m: THREE.Material, semente: number, abertura = 0.9): void {
  const r = sorte(semente);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.6;
    const h = altura * (0.6 + r() * 0.6);
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), m);
    c.scale.set(h * 0.22, h, h * 0.22);
    em(c, Math.cos(a) * raio, h * 0.45, Math.sin(a) * raio, Math.sin(a) * abertura * 0.5, 0, -Math.cos(a) * abertura * 0.5);
    pai.add(c);
  }
}

/** Uma chama de camadas (o núcleo claro e as línguas de fora), virada para cima. */
export function chama(pai: THREE.Object3D, altura: number, cor: number, nucleo = 0xfff0b0): THREE.Group {
  const g = new THREE.Group();
  const fora = cone(altura * 0.36, altura, brilho(cor, 0.5, { transparent: true, opacity: 0.85 }), 9);
  fora.position.y = altura / 2;
  const dentro = cone(altura * 0.18, altura * 0.62, brilho(nucleo, 0.61), 8);
  dentro.position.y = altura * 0.3;
  g.add(fora, dentro);
  for (const s of [-1, 1]) {
    const lingua = cone(altura * 0.14, altura * 0.55, brilho(cor, 0.5), 6);
    em(lingua, s * altura * 0.16, altura * 0.32, 0, 0, 0, -s * 0.35);
    g.add(lingua);
  }
  pai.add(g);
  return g;
}

/** Um floco de neve de seis braços (o enfeite das criaturas de Hiemália). */
export function floco(pai: THREE.Object3D, r: number, m: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const braco = new THREE.Mesh(new THREE.BoxGeometry(r * 0.12, r, r * 0.05), m);
    braco.geometry.translate(0, r / 2, 0);
    braco.rotation.z = (i / 6) * Math.PI * 2;
    g.add(braco);
    const ramo = new THREE.Mesh(new THREE.BoxGeometry(r * 0.08, r * 0.35, r * 0.04), m);
    ramo.position.set(Math.sin((i / 6) * Math.PI * 2) * -r * 0.6, Math.cos((i / 6) * Math.PI * 2) * r * 0.6, 0);
    ramo.rotation.z = (i / 6) * Math.PI * 2 + 0.7;
    g.add(ramo);
  }
  pai.add(g);
  return g;
}

/** Os raios em zigue-zague (Fulgúria): uma linha quebrada entre dois pontos. */
export function faisca(pai: THREE.Object3D, de: THREE.Vector3, ate: THREE.Vector3, m: THREE.Material, semente: number, grossura = 0.012): void {
  const r = sorte(semente);
  const passos = 5;
  let a = de.clone();
  for (let i = 1; i <= passos; i++) {
    const b = de.clone().lerp(ate, i / passos);
    if (i < passos) b.add(new THREE.Vector3((r() - 0.5) * 0.08, (r() - 0.5) * 0.08, (r() - 0.5) * 0.08));
    const d = b.clone().sub(a);
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(grossura, grossura, d.length(), 4), m);
    seg.position.copy(a).addScaledVector(d, 0.5);
    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    pai.add(seg);
    a = b;
  }
}

/** Um cogumelo (o chapéu, as lamelas e o pé), de pé no ponto. */
export function cogumelo(pai: THREE.Object3D, r: number, chapeu: THREE.Material, pe: THREE.Material, pintas?: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const haste = osso(r * 0.28, r * 1.1, pe, r * 0.36);
  haste.position.y = r * 1.1;
  const topo = bola(r, chapeu, 1, 0.55, 1);
  topo.position.y = r * 1.15;
  const lamelas = new THREE.Mesh(new THREE.CircleGeometry(r * 0.95, 16), pe);
  em(lamelas, 0, r * 1.1, 0, Math.PI / 2);
  g.add(haste, topo, lamelas);
  if (pintas) for (let i = 0; i < 5; i++) {
    const a = i * 1.3;
    g.add(em(bola(r * 0.14, pintas, 1, 0.4, 1), Math.cos(a) * r * 0.55, r * 1.4, Math.sin(a) * r * 0.55));
  }
  pai.add(g);
  return g;
}

/** Uma pena (o cálamo e a lâmina achatada), apontando para +y. */
export function pena(compr: number, m: THREE.Material): THREE.Mesh {
  const g = new THREE.SphereGeometry(compr / 2, 8, 6);
  g.scale(0.28, 1, 0.06);
  g.translate(0, compr / 2, 0);
  return new THREE.Mesh(g, m);
}

/** Uma asa de penas em leque (a ave, a harpia, o dragão de vento), presa num pivô. */
export function asaDePenas(pai: THREE.Object3D, lado: number, compr: number, m: THREE.Material, ponta: THREE.Material, n = 7): void {
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = pena(compr * (0.55 + 0.45 * Math.sin(t * Math.PI * 0.85)), t > 0.7 ? ponta : m);
    em(p, lado * compr * 0.12 * t, 0, -compr * 0.08 * t, 0, 0, -lado * (0.4 + t * 1.1));
    pai.add(p);
  }
}

/** A membrana da asa de morcego (o dragão): os dedos e o pano esticado entre eles. */
export function asaDeMembrana(pai: THREE.Object3D, lado: number, compr: number, osso_: THREE.Material, pele: THREE.Material): void {
  const pontas: THREE.Vector3[] = [];
  for (let i = 0; i < 4; i++) {
    const a = 0.25 + i * 0.38;
    const d = compr * (1 - i * 0.16);
    const p = new THREE.Vector3(lado * Math.cos(a) * d, Math.sin(a) * d * 0.55, -i * compr * 0.12);
    pontas.push(p);
    const dedo = new THREE.Mesh(new THREE.CylinderGeometry(compr * 0.012, compr * 0.024, d, 5), osso_);
    dedo.position.copy(p.clone().multiplyScalar(0.5));
    dedo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize());
    pai.add(dedo);
  }
  const forma = new THREE.BufferGeometry();
  const v: number[] = [];
  for (let i = 0; i < pontas.length; i++) {
    const a = pontas[i] ?? new THREE.Vector3();
    const b = pontas[i + 1] ?? new THREE.Vector3(lado * compr * 0.15, -compr * 0.1, -compr * 0.5);
    const meio = a.clone().lerp(b, 0.5).multiplyScalar(0.72);
    v.push(0, 0, 0, a.x, a.y, a.z, meio.x, meio.y, meio.z, 0, 0, 0, meio.x, meio.y, meio.z, b.x, b.y, b.z);
  }
  forma.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  forma.computeVertexNormals();
  const membrana = new THREE.Mesh(forma, pele);
  pai.add(membrana);
}

// ---------- os tipos de corpo ----------

/** A bolha (os fofos sem pernas): `corpo` deforma; `nucleo` (o olhar, a chama) acompanha. */
export interface PartesDaBolha { raiz: THREE.Group; corpo: THREE.Group; topo?: THREE.Group; bracos?: THREE.Group[] }
export function animarBolha(p: PartesDaBolha, estado: EstadoFera, f: number, o: { pulo?: number; derrete?: boolean } = {}): void {
  const pulo = o.pulo ?? 0.16;
  p.raiz.position.set(0, 0, 0);
  p.raiz.rotation.set(0, 0, 0);
  p.corpo.position.set(0, 0, 0);
  p.corpo.rotation.set(0, 0, 0);
  let sy = 1;
  let sxz = 1;
  for (const [i, b] of (p.bracos ?? []).entries()) b.rotation.set(0, 0, (i ? -1 : 1) * 0.3);
  if (estado === 'parado') {
    sy = 1 + 0.06 * ciclo(f);
    sxz = 1 - 0.03 * ciclo(f);
    if (p.topo) p.topo.rotation.z = 0.08 * ciclo(f, 1);
  } else if (estado === 'andar' || estado === 'correr') {
    const salto = Math.abs(ciclo(f / 2));
    p.corpo.position.y = salto * pulo;
    sy = 0.86 + 0.28 * salto;
    sxz = 1.1 - 0.14 * salto;
    for (const [i, b] of (p.bracos ?? []).entries()) b.rotation.z = (i ? -1 : 1) * (0.3 + 0.4 * salto);
  } else if (estado === 'golpe' || estado === 'golpe2' || estado === 'golpe3') {
    const bote = arco(f, 0.4);
    p.corpo.position.z = bote * 0.28;
    p.corpo.position.y = bote * 0.08;
    sy = 1 - 0.18 * bote;
    sxz = 1 + 0.16 * bote;
    p.corpo.rotation.x = bote * 0.35;
    for (const [i, b] of (p.bracos ?? []).entries()) b.rotation.x = -1.4 * bote * (i ? 1 : 0.6);
  } else if (estado === 'conjurar') {
    sy = 1.1 + 0.08 * ciclo(f * 2);
    sxz = 1.04 - 0.04 * ciclo(f * 2);
    for (const [i, b] of (p.bracos ?? []).entries()) b.rotation.z = (i ? -1 : 1) * 1.6;
    if (p.topo) p.topo.scale.setScalar(1 + 0.25 * Math.abs(ciclo(f * 2)));
  } else {
    if (o.derrete ?? true) {
      sy = 1 - 0.8 * suave(f);
      sxz = 1 + 0.7 * suave(f);
    } else {
      p.raiz.rotation.z = (Math.PI / 2) * suave(f);
      p.raiz.position.y = 0.1 * f;
    }
  }
  p.corpo.scale.set(sxz, sy, sxz);
}

/** O bicho de quatro patas: o apoio (o quadril), o tronco, o pescoço, a cabeça, a mandíbula, as pernas e o rabo. */
export interface Perna { coxa: THREE.Group; canela: THREE.Group; fase: number; frente: boolean; lado: number }
export interface PartesDoQuadrupede {
  raiz: THREE.Group; apoio: THREE.Group; tronco: THREE.Group; pescoco: THREE.Group; cabeca: THREE.Group;
  mandibula?: THREE.Group; rabo?: THREE.Group; pernas: Perna[]; altura: number;
}
export function pernas(pai: THREE.Object3D, pontos: readonly (readonly [number, number, number, number])[], m: { coxa: THREE.Material; pe: THREE.Material; garra?: THREE.Material }, d: { r: number; coxa: number; canela: number; pata: number }, prefixo = ''): Perna[] {
  return pontos.map(([x, y, z, fase], i) => {
    const coxa = pivo(`${prefixo}coxa${String(i)}`, pai, x, y, z);
    coxa.add(osso(d.r, d.coxa, m.coxa, d.r * 0.75));
    const canela = pivo(`${prefixo}canela${String(i)}`, coxa, 0, -d.coxa, 0);
    canela.add(osso(d.r * 0.72, d.canela, m.pe, d.r * 0.6));
    canela.add(em(bola(d.pata, m.pe, 1, 0.55, 1.35), 0, -d.canela, d.pata * 0.35));
    if (m.garra) for (const g of [-1, 0, 1]) canela.add(em(cone(d.pata * 0.16, d.pata * 0.55, m.garra, 5), g * d.pata * 0.42, -d.canela - d.pata * 0.2, d.pata * 1.2, Math.PI / 2 + 0.4));
    return { coxa, canela, fase, frente: z > 0, lado: Math.sign(x) };
  });
}
export function animarQuadrupede(p: PartesDoQuadrupede, estado: EstadoFera, f: number, o: { passo?: number; bote?: number } = {}): void {
  const passo = o.passo ?? 0.55;
  p.raiz.position.set(0, 0, 0);
  p.raiz.rotation.set(0, 0, 0);
  p.apoio.position.set(0, p.altura, 0);
  p.apoio.rotation.set(0, 0, 0);
  p.tronco.rotation.set(0, 0, 0);
  p.tronco.scale.set(1, 1, 1);
  p.pescoco.rotation.set(0, 0, 0);
  p.cabeca.rotation.set(0, 0, 0);
  p.mandibula?.rotation.set(0, 0, 0);
  p.rabo?.rotation.set(-2, 0, 0.25 * ciclo(f));
  for (const l of p.pernas) { l.coxa.rotation.set(0, 0, 0); l.canela.rotation.set(0, 0, 0); }
  if (estado === 'parado') {
    p.tronco.scale.set(1, 1 + 0.025 * ciclo(f), 1);
    p.pescoco.rotation.y = 0.22 * ciclo(f, 0.6);
    p.cabeca.rotation.x = 0.05 * ciclo(f * 2);
  } else if (estado === 'andar' || estado === 'correr') {
    const corre = estado === 'correr' ? 1.5 : 1;
    p.apoio.position.y = p.altura + 0.03 * corre * Math.abs(ciclo(f));
    p.pescoco.rotation.x = 0.08 * ciclo(f * 2);
    for (const l of p.pernas) {
      const v = ciclo(f, l.fase);
      l.coxa.rotation.x = passo * corre * v;
      l.canela.rotation.x = (l.frente ? -0.7 : 0.7) * Math.max(0, -v);
    }
  } else if (estado === 'golpe' || estado === 'golpe2' || estado === 'golpe3') {
    const carga = suave(f / 0.35);
    const b = f < 0.35 ? 0 : Math.sin(((f - 0.35) / 0.65) * Math.PI);
    const bote = o.bote ?? 0.3;
    p.apoio.position.y = p.altura - p.altura * 0.15 * carga * (1 - b) + p.altura * 0.18 * b;
    p.apoio.position.z = bote * b;
    p.apoio.rotation.x = 0.1 * carga - 0.25 * b;
    p.pescoco.rotation.x = 0.3 * carga - 0.25 * b;
    if (p.mandibula) p.mandibula.rotation.x = 0.75 * Math.sin(Math.min(1, f / 0.8) * Math.PI);
    for (const l of p.pernas) {
      l.coxa.rotation.x = l.frente ? -1.1 * b + 0.3 * carga : 0.6 * b - 0.4 * carga;
      l.canela.rotation.x = 0.45 * carga;
    }
  } else if (estado === 'conjurar') {
    const u = suave(f * 2.5);
    p.apoio.rotation.x = -0.45 * u;
    p.pescoco.rotation.x = -0.6 * u;
    if (p.mandibula) p.mandibula.rotation.x = 0.55 * u;
    for (const l of p.pernas) l.coxa.rotation.x = l.frente ? 0.4 * u : 1.1 * u;
  } else {
    p.raiz.rotation.z = (Math.PI / 2) * suave(f);
    p.raiz.position.y = p.altura * 0.25 * f;
    p.apoio.position.y = p.altura * (1 - 0.5 * f);
    for (const l of p.pernas) l.coxa.rotation.x = 0.35 * f * (l.frente ? -1 : 1);
    if (p.mandibula) p.mandibula.rotation.x = 0.25 * f;
  }
}

/** O inseto e a aranha: o tronco, a cabeça, as pernas em par (dobram no joelho) e as asas, se houver. */
export interface PartesDoInseto { raiz: THREE.Group; tronco: THREE.Group; cabeca: THREE.Group; patas: { coxa: THREE.Group; ponta: THREE.Group; lado: number; i: number }[]; asas: THREE.Group[]; voa: boolean; altura: number }
export function patasDeInseto(pai: THREE.Object3D, n: number, compr: number, grossura: number, m: THREE.Material, abertura = 0.5, ponta?: THREE.Material): PartesDoInseto['patas'] {
  const saida: PartesDoInseto['patas'] = [];
  for (let i = 0; i < n; i++) for (const lado of [-1, 1]) {
    const z = (i / Math.max(1, n - 1) - 0.5) * compr * 0.7;
    const coxa = pivo(`pata${String(i)}${lado > 0 ? 'd' : 'e'}`, pai, lado * grossura * 3, 0, z);
    coxa.rotation.set(0, lado * (i - (n - 1) / 2) * 0.35, lado * -abertura - lado * 0.6);
    const a = osso(grossura, compr * 0.55, m, grossura * 0.8, 6);
    a.rotation.z = lado * -Math.PI / 2 + lado * 0.35;
    coxa.add(a);
    const p = pivo(`ponta${String(i)}${lado > 0 ? 'd' : 'e'}`, coxa, lado * compr * 0.48, compr * 0.2, 0);
    const b = osso(grossura * 0.8, compr * 0.7, ponta ?? m, grossura * 0.25, 6);
    b.rotation.z = lado * 0.25;
    p.add(b);
    saida.push({ coxa, ponta: p, lado, i });
  }
  return saida;
}
export function animarInseto(p: PartesDoInseto, estado: EstadoFera, f: number): void {
  p.raiz.position.set(0, p.voa ? p.altura + 0.04 * ciclo(f * 2) : p.altura, 0);
  p.raiz.rotation.set(0, 0, 0);
  p.tronco.rotation.set(0, 0, 0);
  p.cabeca.rotation.set(0, 0, 0);
  for (const a of p.asas) a.rotation.set(0, 0, 0);
  const bater = (vel: number) => { for (const [k, a] of p.asas.entries()) a.rotation.z = (k % 2 ? -1 : 1) * (0.3 + 0.6 * Math.abs(ciclo(f * vel))); };
  for (const l of p.patas) { l.coxa.rotation.x = 0; l.ponta.rotation.z = 0; }
  if (p.voa) bater(estado === 'parado' ? 6 : 8);
  if (estado === 'parado') {
    p.tronco.rotation.x = 0.04 * ciclo(f);
    for (const l of p.patas) l.ponta.rotation.z = l.lado * 0.05 * ciclo(f, l.i);
  } else if (estado === 'andar' || estado === 'correr') {
    for (const l of p.patas) {
      const v = ciclo(f * (estado === 'correr' ? 2 : 1), (l.i + (l.lado > 0 ? 1 : 0)) * Math.PI);
      l.coxa.rotation.x = 0.35 * v;
      l.ponta.rotation.z = l.lado * 0.25 * Math.max(0, v);
    }
    p.raiz.position.y += p.voa ? 0 : 0.015 * Math.abs(ciclo(f * 2));
  } else if (estado === 'golpe' || estado === 'golpe2' || estado === 'golpe3') {
    const b = arco(f, 0.4);
    p.raiz.position.z = 0.2 * b;
    p.tronco.rotation.x = -0.35 * b;
    p.cabeca.rotation.x = 0.4 * b;
    for (const l of p.patas) if (l.i === 0) { l.coxa.rotation.x = -1.1 * b; l.ponta.rotation.z = l.lado * -0.6 * b; }
  } else if (estado === 'conjurar') {
    const u = suave(f * 2);
    p.tronco.rotation.x = -0.5 * u;
    for (const l of p.patas) if (l.i === 0) l.coxa.rotation.x = -1.3 * u;
  } else {
    p.raiz.rotation.z = Math.PI * suave(f);
    p.raiz.position.y = p.altura * (1 - 0.6 * f) + 0.1 * f;
    for (const l of p.patas) l.ponta.rotation.z = l.lado * 0.9 * f;
  }
}

/** O objeto da arena: parado, pulsa; ao "golpear" (a torre que dispara), salta o brilho; ao cair, desmorona. */
export function animarObjeto(raiz: THREE.Group, pulso: THREE.Object3D | null, estado: EstadoFera, f: number): void {
  raiz.position.set(0, 0, 0);
  raiz.rotation.set(0, 0, 0);
  raiz.scale.set(1, 1, 1);
  if (pulso) pulso.scale.setScalar(1 + 0.08 * ciclo(f));
  if (estado === 'golpe' || estado === 'golpe2' || estado === 'golpe3' || estado === 'conjurar') {
    if (pulso) pulso.scale.setScalar(1 + 0.35 * arco(f));
    raiz.position.y = 0.02 * arco(f);
  } else if (estado === 'morte') {
    raiz.scale.set(1 + 0.25 * f, 1 - 0.85 * suave(f), 1 + 0.25 * f);
    raiz.rotation.z = 0.25 * f;
  }
}

/** A raiz de toda criatura: o grupo e o pivô que gira e cai. */
export function raizDe(): { grupo: THREE.Group; raiz: THREE.Group } {
  const grupo = new THREE.Group();
  return { grupo, raiz: pivo('raiz', grupo) };
}
