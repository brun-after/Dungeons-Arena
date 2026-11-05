// A base do estilo sombrio (04/11/2026, marco 37): texturas procedurais, a biblioteca de materiais PBR e as peças de
// geometria que todos os kits usam (guerreiro, mago, arqueiro, necromante, aventureiro, chefes e armas). Saiu de
// armaduras-sombrias.ts quando o rework se estendeu às outras classes: um lugar só para o metal gasto, a cota de malha,
// o tecido pesado e o pano rasgado, para que tudo saia com a mesma paleta sóbria (o ouro velho, não o amarelo vivo).
// Medidas em metros do esqueleto da Quaternius (tronco do pescoço à bacia = 0,571 m), convertidas pela escala do corpo.

import * as THREE from 'three';

export interface Ossos {
  get(nome: string): THREE.Bone | undefined;
}

/** O que a peça acrescenta à camada: as malhas novas, o material do traje por baixo e o que sai da máscara. */
export interface PecaSombria {
  extras: THREE.Object3D[];
  /** O tecido do traje nessa camada (no lugar do pano tingido pela raridade). */
  tecido?: THREE.Material | undefined;
  /** Malhas do traje escondidas nessa camada (regex no nome). */
  esconder?: string | undefined;
}

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
/** O nível de detalhe das peças (1 = o atlas; menos no 3D em tempo real, onde o personagem tem 48 px × dpr). */
let detalhe = 1;
export function definirDetalhe(f: number): void {
  detalhe = Math.max(0.15, Math.min(1, f));
}
export const seg = (n: number, minimo = 6) => Math.max(minimo, Math.round(n * detalhe));
export function esfera(r: number, ls: number, as: number, ...resto: number[]): THREE.SphereGeometry {
  return new THREE.SphereGeometry(r, seg(ls), seg(as, 4), ...resto);
}
const pos = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());
const TRONCO_M = 0.5714;
/** O nível do grau (0–1, 2–3, 4–5): o material e a silhueta da peça. */
export const nivelDe = (grau: number) => (grau <= 1 ? 0 : grau <= 3 ? 1 : 2);

// ---------- texturas procedurais (geradas uma vez por página) ----------
export function sorteio(semente: number): () => number {
  let s = semente >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
function tela(n: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d');
  if (!g) throw new Error('sem canvas 2d');
  return [c, g];
}
function textura(c: HTMLCanvasElement, repete: number, cor = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repete, repete);
  t.anisotropy = 8;
  if (cor) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function manchas(g: CanvasRenderingContext2D, r: () => number, n: number, escura: string, clara: string): void {
  for (let i = 0; i < n; i++) {
    const x = r() * 512, y = r() * 512, raio = 8 + r() * 60;
    const grd = g.createRadialGradient(x, y, 0, x, y, raio);
    grd.addColorStop(0, r() < 0.55 ? escura : clara);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(x - raio, y - raio, raio * 2, raio * 2);
  }
}
/** Metal gasto: manchas, riscos finos e rugosidade variável. */
function metalGasto(base: string, semente: number): { map: THREE.Texture; roughnessMap: THREE.Texture } {
  const r = sorteio(semente);
  const [c, g] = tela(512);
  const [cr, gr] = tela(512);
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  gr.fillStyle = '#6a6a6a';
  gr.fillRect(0, 0, 512, 512);
  manchas(g, r, 220, 'rgba(0,0,0,0.13)', 'rgba(255,240,220,0.07)');
  manchas(gr, r, 160, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.12)');
  for (let i = 0; i < 900; i++) {
    const x = r() * 512, y = r() * 512, ang = r() * Math.PI, len = 4 + r() * 30;
    const fim = [x + Math.cos(ang) * len, y + Math.sin(ang) * len] as const;
    g.strokeStyle = `rgba(255,250,240,${0.08 + r() * 0.2})`;
    g.lineWidth = 0.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(...fim); g.stroke();
    gr.strokeStyle = 'rgba(30,30,30,0.5)';
    gr.beginPath(); gr.moveTo(x, y); gr.lineTo(...fim); gr.stroke();
  }
  return { map: textura(c, 2), roughnessMap: textura(cr, 2, false) };
}
function cotaDeMalha(): THREE.Texture {
  const [c, g] = tela(256);
  g.fillStyle = '#121214';
  g.fillRect(0, 0, 256, 256);
  const s = 16;
  for (let y = 0; y < 256 + s; y += s * 0.55)
    for (let x = 0; x < 256 + s; x += s) {
      const ox = (Math.round(y / (s * 0.55)) % 2) * s * 0.5;
      g.strokeStyle = '#4c4c52';
      g.lineWidth = 2.6;
      g.beginPath(); g.ellipse(x + ox, y, s * 0.42, s * 0.34, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = '#8e8c88';
      g.lineWidth = 0.9;
      g.beginPath(); g.ellipse(x + ox, y - 1, s * 0.4, s * 0.3, 0, Math.PI * 1.1, Math.PI * 1.7); g.stroke();
    }
  return textura(c, 10);
}
export interface OpcoesDoPano {
  /** A barra bordada e o emblema da árvore (o tabardo). */
  bordado?: boolean;
  /** As costuras do gambeson em faixas verticais. */
  acolchoado?: boolean;
  /** Os rebites do couro tachado (brigandina). */
  tachas?: boolean;
  /** A barra dourada das vestes de feiticeiro (sem emblema). */
  barra?: string;
}
/** Tecido pesado: trama, desgaste e os acabamentos de cada veste. */
function tecidoPesado(cor: string, semente: number, o: OpcoesDoPano = {}): THREE.Texture {
  const r = sorteio(semente);
  const [c, g] = tela(512);
  g.fillStyle = cor;
  g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 2) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`; g.fillRect(0, y, 512, 1); }
  for (let x = 0; x < 512; x += 3) { g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.03})`; g.fillRect(x, 0, 1, 512); }
  manchas(g, r, 120, 'rgba(10,6,4,0.25)', 'rgba(255,240,220,0.04)');
  if (o.acolchoado) {
    g.strokeStyle = 'rgba(0,0,0,0.45)';
    g.lineWidth = 3;
    for (let x = 0; x < 512; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
    g.strokeStyle = 'rgba(255,230,200,0.08)';
    g.lineWidth = 2;
    for (let x = 6; x < 512; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  }
  if (o.tachas) {
    for (let y = 16; y < 512; y += 40)
      for (let x = (y / 40) % 2 ? 36 : 16; x < 512; x += 40) {
        g.fillStyle = 'rgba(0,0,0,0.5)';
        g.beginPath(); g.arc(x + 1, y + 1, 5, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#8a7a5a';
        g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,240,200,0.5)';
        g.beginPath(); g.arc(x - 1.2, y - 1.2, 1.4, 0, Math.PI * 2); g.fill();
      }
  }
  if (o.barra) {
    g.fillStyle = o.barra;
    g.fillRect(0, 440, 512, 22);
    g.fillRect(0, 474, 512, 6);
    g.strokeStyle = 'rgba(255,240,200,0.35)';
    g.lineWidth = 1.5;
    for (let x = 0; x < 512; x += 24) { g.beginPath(); g.arc(x + 12, 451, 6, 0, Math.PI * 2); g.stroke(); }
  }
  if (o.bordado) {
    g.fillStyle = '#7d6230';
    g.fillRect(0, 430, 512, 34);
    g.fillRect(226, 0, 60, 512);
    g.strokeStyle = '#d9b86a';
    g.lineWidth = 2;
    for (let x = 0; x < 512; x += 18) { g.beginPath(); g.moveTo(x, 438); g.lineTo(x + 9, 456); g.lineTo(x + 18, 438); g.stroke(); }
    for (let y = 0; y < 512; y += 20) { g.beginPath(); g.moveTo(232, y); g.lineTo(256, y + 10); g.lineTo(280, y); g.stroke(); }
    g.save();
    g.translate(256, 170);
    g.fillStyle = '#2a0f10';
    g.beginPath(); g.arc(0, 0, 70, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#e2c27a';
    g.lineWidth = 4;
    g.beginPath(); g.arc(0, 0, 64, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(0, 50); g.lineTo(0, -50);
    for (const [a, l] of [[-0.6, 40], [0.6, 40], [-1.1, 30], [1.1, 30], [-0.3, 52], [0.3, 52]] as const) {
      g.moveTo(0, 20 - l * 0.4);
      g.lineTo(Math.sin(a) * l, 20 - l * 0.4 - Math.cos(a) * l);
    }
    g.stroke();
    g.restore();
  }
  return textura(c, 1);
}
/** Alfa com a barra rasgada (pano gasto) e alguns furos. */
function rasgado(semente: number, fundo: number): THREE.Texture {
  const r = sorteio(semente);
  const [c, g] = tela(256);
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#000';
  let x = 0;
  g.beginPath();
  g.moveTo(0, 256);
  while (x < 256) {
    const w = 4 + r() * 14;
    g.lineTo(x + w * 0.5, 256 * fundo + r() * 256 * (1 - fundo) * 0.9);
    g.lineTo(x + w, 256 * (fundo + 0.08) + r() * 20);
    x += w;
  }
  g.lineTo(256, 256);
  g.fill();
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.ellipse(r() * 256, 256 * (0.6 + r() * 0.3), 2 + r() * 5, 3 + r() * 8, r(), 0, Math.PI * 2);
    g.fill();
  }
  return new THREE.CanvasTexture(c);
}

// ---------- materiais ----------
const lado = THREE.DoubleSide;
const cache = new Map<string, THREE.Material>();
function guardado<T extends THREE.Material>(chave: string, criar: () => T): T {
  const m = cache.get(chave);
  if (m) return m as T;
  const novo = criar();
  novo.name = `sombrio:${chave}`;
  cache.set(chave, novo);
  return novo;
}
/** Um metal gasto na cor dada (aço, ferro negro, latão, ouro velho, prata). */
export function metal(cor: string, semente: number, metalness = 0.9, roughness = 0.4): THREE.MeshStandardMaterial {
  return guardado(`metal:${cor}:${String(semente)}:${String(metalness)}:${String(roughness)}`, () =>
    new THREE.MeshStandardMaterial({ ...metalGasto(cor, semente), metalness, roughness, side: lado }));
}
/** Um pano (ou couro) pesado; `rasgo` é a altura (0 a 1) onde a barra começa a rasgar. */
export function pano(cor: string, semente: number, o: OpcoesDoPano & { rasgo?: number; aspereza?: number } = {}): THREE.MeshStandardMaterial {
  return guardado(`pano:${cor}:${String(semente)}:${JSON.stringify(o)}`, () => new THREE.MeshStandardMaterial({
    map: tecidoPesado(cor, semente, o), roughness: o.aspereza ?? 0.92, side: lado,
    ...(o.rasgo !== undefined ? { alphaMap: rasgado(semente, o.rasgo), alphaTest: 0.5 } : {}),
  }));
}
/** Cota de malha. */
export function malha(): THREE.MeshStandardMaterial {
  return guardado('malha', () => new THREE.MeshStandardMaterial({ map: cotaDeMalha(), metalness: 0.8, roughness: 0.5, side: lado }));
}
/** Uma cor lisa (osso, pele, pena), sem textura. */
export function liso(cor: number, roughness = 0.8, metalness = 0): THREE.MeshStandardMaterial {
  return guardado(`liso:${String(cor)}:${String(roughness)}:${String(metalness)}`, () => new THREE.MeshStandardMaterial({ color: cor, roughness, metalness, side: lado }));
}
/** O que brilha sozinho: a brasa, a pedra de feitiço, os olhos. */
export function aceso(cor: number, forca = 2.2): THREE.MeshStandardMaterial {
  return guardado(`aceso:${String(cor)}:${String(forca)}`, () => new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: forca, roughness: 0.3 }));
}
/** O negro das fendas (visor, olhos da máscara). */
export function fenda(): THREE.MeshBasicMaterial {
  return guardado('fenda', () => new THREE.MeshBasicMaterial({ color: 0x050405 }));
}

/** A paleta comum: os metais e couros que todas as classes compartilham. */
export const comuns = () => ({
  aco: metal('#8a8d94', 3, 0.95, 0.32),
  placa: metal('#4a4a50', 7, 0.85, 0.55),
  ferro: metal('#2e2c30', 47, 0.8, 0.6),
  latao: metal('#7e6236', 19, 0.9, 0.45),
  ouro: metal('#9a7a3e', 11, 1, 0.3),
  prata: metal('#a8acb4', 53, 0.95, 0.28),
  couro: pano('#3a2618', 5, { aspereza: 0.78 }),
  couroClaro: pano('#5a3d26', 23, { aspereza: 0.72 }),
  couroNegro: pano('#1e1814', 59, { aspereza: 0.7 }),
  malha: malha(),
  pele: liso(0x2a221c, 1),
  fenda: fenda(),
  brasa: aceso(0xffb347),
});
export type Comuns = ReturnType<typeof comuns>;

// ---------- geometria ----------
function prender(osso: THREE.Bone | undefined, o: THREE.Object3D): THREE.Object3D | null {
  if (!osso) return null;
  o.updateMatrixWorld(true);
  osso.attach(o);
  return o;
}
/** Põe o objeto (eixo Y local) ao longo de a->b, em `t` do caminho; `frente` fixa o giro em volta do eixo. */
export function aoLongo(o: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, t = 0.5, frente = V(0, 0, 1)): THREE.Object3D {
  const d = b.clone().sub(a);
  o.position.copy(a).addScaledVector(d, t);
  const y = d.clone().normalize();
  const z = frente.clone().sub(y.clone().multiplyScalar(frente.dot(y))).normalize();
  const x = y.clone().cross(z).normalize();
  o.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  return o;
}
/** Peça torneada: perfil [raio, altura] com altura de -0,5 a 0,5. */
export function torno(perfil: readonly (readonly [number, number])[], m: THREE.Material, segmentos = 32, arco = Math.PI * 2, inicio = 0): THREE.Mesh {
  const g = new THREE.LatheGeometry(perfil.map(([r, h]) => new THREE.Vector2(r, h)), seg(segmentos), inicio, arco);
  g.computeVertexNormals();
  return new THREE.Mesh(g, m);
}
export function anel(r: number, tubo: number, m: THREE.Material, arco = Math.PI * 2): THREE.Mesh {
  return new THREE.Mesh(new THREE.TorusGeometry(r, tubo, seg(8, 3), seg(40), arco), m);
}
export function caixa(l: number, a: number, p: number, m: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const c = new THREE.Mesh(new THREE.BoxGeometry(l, a, p), m);
  c.position.set(x, y, z);
  return c;
}
/** Um chifre (ou galhada, ou pena): cone curvo feito de anéis ao longo de um arco. */
export function chifre(compr: number, raio: number, curva: number, m: THREE.Material, passos = 8): THREE.Mesh {
  const n = seg(passos, 4);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(V(0, Math.sin(t * curva) * compr / Math.max(curva, 1e-3), (1 - Math.cos(t * curva)) * compr / Math.max(curva, 1e-3)));
  }
  const caminho = new THREE.CatmullRomCurve3(pts);
  const g = new THREE.TubeGeometry(caminho, n, raio, seg(7, 4), false);
  // afina até a ponta
  const p = g.attributes.position as THREE.BufferAttribute;
  const centro = new THREE.Vector3();
  const ponto = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const anelI = Math.floor(i / (seg(7, 4) + 1));
    const t = anelI / n;
    caminho.getPointAt(Math.min(1, t), centro);
    ponto.fromBufferAttribute(p, i).sub(centro).multiplyScalar(1 - t * 0.92).add(centro);
    p.setXYZ(i, ponto.x, ponto.y, ponto.z);
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, m);
}

/** O contexto da montagem: os ossos, a escala (metros do esqueleto -> mundo) e as posições. */
export class Corpo {
  readonly u: number;
  constructor(readonly ossos: Ossos) {
    const pesc = ossos.get('neck_01'), bacia = ossos.get('pelvis');
    this.u = pesc && bacia ? pos(pesc).distanceTo(pos(bacia)) / TRONCO_M : 1;
  }
  p(nome: string): THREE.Vector3 {
    const o = this.ossos.get(nome);
    return o ? pos(o) : V();
  }
  prender(osso: string, o: THREE.Object3D, saida: THREE.Object3D[]): void {
    const preso = prender(this.ossos.get(osso), o);
    if (preso) saida.push(preso);
  }
}

/** Um grupo em metros, posto no ponto `em` do mundo (a escala do corpo aplicada ao grupo). */
export function grupoEm(c: Corpo, em: THREE.Vector3): THREE.Group {
  const g = new THREE.Group();
  g.position.copy(em);
  g.scale.setScalar(c.u);
  return g;
}
