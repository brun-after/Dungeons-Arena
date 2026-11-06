// A skin Ceifador do necromante (06/11/2026): o personagem da arte de referência em 3D, no lugar de qualquer
// equipamento. Uma figura encapuzada, o rosto um vazio negro com olhos brancos e dentes à mostra, mãos e antebraços de
// osso, o manto longo e rasgado com bordado de gavinhas, mangas em sino, a ombreira ornada com medalhão e corrente, o
// espartilho laceado com tachas em losango e o cinto. O pano (manto, mangas, sobressaia, capuz, cachecol, fitas e os
// fiapos fantasmas) é `superficie` com pesos nas coxas e o `solto` que o vento (skin-pano.ts) usa para voar para trás
// do rumo. A arma é a gadanha de skin-gadanha.ts, presa na mão pelo palco. Medidas em metros do rig × `Corpo.u`.

import * as THREE from 'three';
import type { Ossos, PecaSombria } from './sombrio-base';
import { aoLongo, Corpo, esfera, grupoEm, metal, V } from './sombrio-base';
import { ombreira } from './pecas-sombrias';
import { filigrana, fita, rasgos, superficie, ventoso, type Anel } from './skin-pano';
import { sorteio } from './sombrio-base';

type Obj = THREE.Object3D;
export const suave = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a || 1)));
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/** A interpolação suave de uma tabela [y, valor] (y decrescente: do alto para baixo). */
export function perfilDe(tabela: readonly (readonly [number, number])[]): (y: number) => number {
  return (y) => {
    if (y >= (tabela[0] as readonly [number, number])[0]) return (tabela[0] as readonly [number, number])[1];
    for (let i = 1; i < tabela.length; i++) {
      const [y1, v1] = tabela[i - 1] as readonly [number, number];
      const [y2, v2] = tabela[i] as readonly [number, number];
      if (y >= y2) return mix(v2, v1, suave(y2, y1, y));
    }
    return (tabela[tabela.length - 1] as readonly [number, number])[1];
  };
}

function materiais() {
  const pano = (base: string, linha: string, semente: number, o: { rasgo?: number; repete?: number; barra?: string; densidade?: number } = {}) => {
    const map = filigrana(base, linha, semente, { ...(o.barra && { barra: o.barra }), ...(o.densidade && { densidade: o.densidade }) });
    map.repeat.set(1, 1);
    return new THREE.MeshStandardMaterial({
      map, roughness: 0.9, side: THREE.DoubleSide,
      ...(o.rasgo !== undefined ? { alphaMap: rasgos(semente + 7, o.rasgo, 7), alphaTest: 0.5 } : {}),
    });
  };
  const placa = new THREE.MeshStandardMaterial({ map: filigrana('#2b242b', '#9a8494', 401, { densidade: 1.1, manchas: 40 }), metalness: 0.85, roughness: 0.42, side: THREE.DoubleSide });
  return {
    manto: ventoso(pano('#0f0b10', '#4d3b49', 411, { rasgo: 0.9 })),
    sobressaia: ventoso(pano('#150f19', '#47364a', 421, { rasgo: 0.7, densidade: 1.4 })),
    manga: ventoso(pano('#130e13', '#4d3b49', 431, { rasgo: 0.8 })),
    capuz: ventoso(pano('#0e0a10', '#3f303b', 441, { densidade: 0.6 })),
    cachecol: ventoso(pano('#1c141b', '#4b3a47', 451, { rasgo: 0.92, densidade: 0.8 })),
    tabardo: ventoso(pano('#0c090f', '#7a6074', 461, { rasgo: 0.86, densidade: 1.6 })),
    fita: ventoso(pano('#120d13', '#46343f', 471, { rasgo: 0.55, densidade: 0.5 })),
    fantasma: ventoso(new THREE.MeshBasicMaterial({ color: 0x9a8fb4, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide })),
    borda: new THREE.MeshStandardMaterial({ color: 0x241a22, roughness: 0.85, side: THREE.DoubleSide }),
    couro: new THREE.MeshStandardMaterial({ color: 0x1c120f, roughness: 0.7, side: THREE.DoubleSide }),
    cordao: new THREE.MeshStandardMaterial({ color: 0x8a7766, roughness: 0.9 }),
    latao: metal('#8a6c47', 619, 0.9, 0.38),
    ferro: metal('#2a262b', 631, 0.85, 0.5),
    placa,
    osso: new THREE.MeshStandardMaterial({ color: 0xd6cbc6, roughness: 0.55 }),
    vazio: new THREE.MeshBasicMaterial({ color: 0x030204 }),
    olho: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    dente: new THREE.MeshStandardMaterial({ color: 0xf0eadf, emissive: 0xcfc6b8, emissiveIntensity: 0.55, roughness: 0.35 }),
  };
}
type M = ReturnType<typeof materiais>;

/** O halo macio dos olhos (somado à luz, sem escrever na profundidade). */
function halo(): THREE.Material {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(0.35, 'rgba(210,225,255,0.4)');
    grd.addColorStop(1, 'rgba(180,200,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
  }
  return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
}

// ---------- o manto, a sobressaia e o tabardo ----------
/** Os dentes da barra: o quanto cada coluna desce (em metros do rig). */
export function dentes(colunas: number, semente: number, fundo: number): number[] {
  const r = sorteio(semente);
  const lista: number[] = [];
  let atual = 0;
  for (let j = 0; j <= colunas; j++) {
    if (j % 3 === 0) atual = r() < 0.3 ? fundo * (0.7 + r() * 0.3) : fundo * r() * 0.5;
    lista.push(atual * (0.8 + r() * 0.2));
  }
  lista[colunas] = lista[0] as number;
  return lista;
}

export interface Eixos {
  topo: number;
  barra: number;
  bacia: number;
  zDe: (y: number) => number;
  rx: (y: number) => number;
  rz: (y: number) => number;
}

export function eixosDoCorpo(c: Corpo): Eixos {
  const u = c.u;
  const pesc = c.p('neck_01'), s3 = c.p('spine_03'), s2 = c.p('spine_02'), bacia = c.p('pelvis'), joelho = c.p('calf_l');
  const barra = Math.min(c.p('ball_l').y, c.p('ball_r').y) + 0.01 * u;
  const rx = perfilDe([[pesc.y + 0.03 * u, 0.13 * u], [(pesc.y + s3.y) / 2, 0.25 * u], [s3.y, 0.235 * u], [s2.y, 0.175 * u], [bacia.y, 0.205 * u], [joelho.y, 0.31 * u], [barra, 0.48 * u]]);
  const rz = perfilDe([[pesc.y + 0.03 * u, 0.115 * u], [(pesc.y + s3.y) / 2, 0.14 * u], [s3.y, 0.145 * u], [s2.y, 0.125 * u], [bacia.y, 0.155 * u], [joelho.y, 0.255 * u], [barra, 0.44 * u]]);
  const zDe = perfilDe([[pesc.y, pesc.z], [s3.y, s3.z], [s2.y, s2.z], [bacia.y, bacia.z]]);
  return { topo: pesc.y + 0.03 * u, barra, bacia: bacia.y, zDe, rx, rz };
}

/** Os pesos do pano que desce do corpo: o tronco segue a coluna; abaixo da bacia, mistura bacia e a coxa do lado. */
export function pesosDoManto(c: Corpo, e: Eixos): (i: number, j: number, a: number, p: THREE.Vector3) => readonly [string, string, number] {
  const s2 = c.p('spine_02').y;
  return (_i, _j, _a, p) => {
    if (p.y >= s2) return ['spine_03', 'spine_02', suave(s2, s2 + 0.2 * c.u, p.y)];
    if (p.y >= e.bacia) return ['spine_02', 'pelvis', suave(e.bacia, s2, p.y)];
    const fundo = suave(e.bacia, e.barra, p.y);
    // as coxas só movem o pano nas laterais; no meio ele fica com a bacia (não racha na frente nem atrás)
    const lado = suave(0.02 * c.u, 0.14 * c.u, Math.abs(p.x));
    return [p.x >= 0 ? 'thigh_l' : 'thigh_r', 'pelvis', Math.min(0.55, fundo * 0.7) * lado];
  };
}

function manto(c: Corpo, m: M, extras: Obj[]): Eixos {
  const u = c.u;
  const e = eixosDoCorpo(c);
  const N = 26, COL = 56;
  const cortes = dentes(COL, 91, 0.1 * u);
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const y = mix(e.topo, e.barra, i / (N - 1));
    aneis.push({ c: V(0, y, e.zDe(y)), rx: e.rx(y), rz: e.rz(y) });
  }
  extras.push(superficie({
    aneis, colunas: COL, repete: [3, 1],
    // as pregas: ondas verticais que crescem para baixo
    ruga: (i, _j, a) => 1 + Math.sin(a * 9 + i * 0.05) * 0.025 * suave(0.2, 1, i / (N - 1)) + Math.sin(a * 17) * 0.01 * suave(0.5, 1, i / (N - 1)),
    descer: (i, j) => (i >= N - 2 ? cortes[j] ?? 0 : 0),
    solto: (i) => Math.pow(suave(0.35, 1, i / (N - 1)), 1.15),
    pesos: pesosDoManto(c, e),
  }, m.manto));
  return e;
}

/** A sobressaia: as lâminas de pano mais longas e rasgadas por cima do manto, à volta da cintura (voam mais). */
function sobressaia(c: Corpo, e: Eixos, m: M, extras: Obj[]): void {
  const u = c.u;
  const N = 20, COL = 40;
  const cortes = dentes(COL, 131, 0.3 * u);
  const topo = mix(e.bacia, e.topo, 0.05);
  for (const [arco, escala, semente] of [[[Math.PI * 0.62, Math.PI * 1.05], 1.08, 1], [[Math.PI * 1.7, Math.PI * 1.0], 1.12, 2]] as const) {
    const aneis: Anel[] = [];
    for (let i = 0; i < N; i++) {
      const y = mix(topo, e.barra - 0.02 * u, i / (N - 1));
      const f = escala + suave(0, 1, i / (N - 1)) * 0.06;
      aneis.push({ c: V(0, y, e.zDe(y)), rx: e.rx(y) * f + 0.01 * u, rz: e.rz(y) * f + 0.01 * u });
    }
    extras.push(superficie({
      aneis, colunas: COL, arco, repete: [2, 1],
      ruga: (i, _j, a) => 1 + Math.sin(a * 7 + semente) * 0.05 * suave(0.2, 1, i / (N - 1)),
      descer: (i, j) => (i >= N - 3 ? (cortes[j] ?? 0) * (semente === 1 ? 1 : 0.8) : 0),
      solto: (i) => Math.pow(suave(0.1, 1, i / (N - 1)), 1.1) * 1.1,
      pesos: pesosDoManto(c, e),
    }, m.sobressaia));
  }
}

/** O tabardo da frente: a tira escura de bordado que desce do peito até a barra. */
function tabardo(c: Corpo, e: Eixos, m: M, extras: Obj[]): void {
  const u = c.u;
  const N = 24, COL = 12;
  const topo = c.p('spine_03').y - 0.02 * u;
  const cortes = dentes(COL, 171, 0.2 * u);
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const y = mix(topo, e.barra - 0.04 * u, i / (N - 1));
    aneis.push({ c: V(0, y, e.zDe(y)), rx: e.rx(y) + 0.014 * u, rz: e.rz(y) + 0.014 * u });
  }
  extras.push(superficie({
    aneis, colunas: COL, arco: [Math.PI * 0.5 - 0.24, 0.48], repete: [0.6, 1],
    descer: (i, j) => (i >= N - 3 ? (j % 2 === 0 ? 0.04 * u : 0) + (cortes[j] ?? 0) * 0.6 : 0),
    solto: (i) => Math.pow(suave(0.3, 1, i / (N - 1)), 1.1),
    pesos: pesosDoManto(c, e),
  }, m.tabardo));
}

// ---------- as mangas, as mãos e os antebraços de osso ----------
function manga(c: Corpo, lado: 'l' | 'r', m: M, extras: Obj[]): void {
  const u = c.u;
  const ombro = c.p(`upperarm_${lado}`), cot = c.p(`lowerarm_${lado}`), pulso = c.p(`hand_${lado}`);
  const fim = cot.clone().lerp(pulso, 0.82);
  const comeco = ombro.clone().add(V(0, 0.035 * u, 0));
  const pontos = [comeco, ombro.clone().lerp(cot, 0.4), ombro.clone().lerp(cot, 0.8), cot, cot.clone().lerp(fim, 0.5), fim];
  // a boca da manga abre em sino além do pulso
  const aneis: Anel[] = [];
  const N = 16;
  const curva = new THREE.CatmullRomCurve3(pontos);
  const raios = perfilDe([[1, 0.25 * u], [0.78, 0.19 * u], [0.6, 0.12 * u], [0.4, 0.098 * u], [0, 0.092 * u]]);
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const r = raios(1 - t);
    aneis.push({ c: curva.getPointAt(t), rx: r, rz: r * 0.92 });
  }
  const cortes = dentes(36, lado === 'l' ? 211 : 223, 0.12 * u);
  const ate = `lowerarm_${lado}`, de = `upperarm_${lado}`;
  extras.push(superficie({
    aneis, colunas: 36, repete: [2, 1], frente: V(0, 0, 1),
    ruga: (i, _j, a) => 1 + Math.sin(a * 6) * 0.04 * suave(0.5, 1, i / (N - 1)),
    descer: (i, j) => (i >= N - 2 ? cortes[j] ?? 0 : 0),
    solto: (i) => Math.pow(suave(0.55, 1, i / (N - 1)), 1.2) * 0.9,
    pesos: (i) => {
      const t = i / (N - 1);
      return t < 0.5 ? [de, ate, 1 - suave(0.32, 0.5, t) * 0.5] : [ate, `hand_${lado}`, 1 - suave(0.8, 1, t) * 0.45];
    },
  }, m.manga));
  // o antebraço de osso que aparece abaixo da boca da manga: rádio e ulna, com o punho
  const a = cot.clone().lerp(pulso, 0.66);
  for (const dz of [-0.011, 0.011]) {
    const osso = new THREE.Mesh(new THREE.CylinderGeometry(0.0085 * u, 0.0105 * u, 1, 8), m.osso);
    const de2 = a.clone().add(V(0, 0, dz * u)), ate2 = pulso.clone().add(V(0, 0, dz * 0.8 * u));
    osso.scale.y = de2.distanceTo(ate2);
    aoLongo(osso, de2, ate2, 0.5);
    c.prender(`lowerarm_${lado}`, osso, extras);
  }
  const punho = new THREE.Mesh(esfera(0.016, 10, 8), m.osso);
  punho.scale.setScalar(u);
  punho.position.copy(pulso);
  c.prender(`lowerarm_${lado}`, punho, extras);
}

/** A mão de osso: os metacarpos presos na mão e cada dedo em falanges presas aos ossos dele (dobram com a animação). */
export function mao(c: Corpo, lado: 'l' | 'r', m: Pick<M, 'osso'>, extras: Obj[], grosso = 1): void {
  const u = c.u;
  const pulso = c.p(`hand_${lado}`);
  const dedos = ['index', 'middle', 'ring', 'pinky'] as const;
  for (const d of dedos) {
    const base = c.p(`${d}_01_${lado}`);
    const meta = new THREE.Mesh(new THREE.CylinderGeometry(0.007 * u * grosso, 0.0085 * u * grosso, 1, 6), m.osso);
    meta.scale.y = pulso.distanceTo(base);
    aoLongo(meta, pulso, base, 0.5);
    c.prender(`hand_${lado}`, meta, extras);
  }
  const palma = new THREE.Mesh(new THREE.BoxGeometry(0.06 * u, 0.012 * u * grosso, 0.012 * u * grosso), m.osso);
  palma.position.copy(pulso.clone().lerp(c.p(`middle_01_${lado}`), 0.55));
  palma.rotation.z = lado === 'l' ? 0.2 : -0.2;
  c.prender(`hand_${lado}`, palma, extras);
  for (const d of [...dedos, 'thumb'] as const) {
    const pontos = [1, 2, 3].map((k) => c.p(`${d}_0${k}_${lado}`));
    pontos.push(c.p(`${d}_04_leaf_${lado}`));
    for (let k = 0; k < 3; k++) {
      const a = pontos[k] as THREE.Vector3, b = pontos[k + 1] as THREE.Vector3;
      const falange = new THREE.Mesh(new THREE.CylinderGeometry(0.0055 * u * grosso * (k === 2 ? 0.55 : 0.85), 0.0075 * u * grosso, 1, 6), m.osso);
      falange.scale.y = a.distanceTo(b);
      aoLongo(falange, a, b, 0.5);
      c.prender(`${d}_0${k + 1}_${lado}`, falange, extras);
      const junta = new THREE.Mesh(esfera(0.0085, 8, 6), m.osso);
      junta.scale.setScalar(u * grosso);
      junta.position.copy(a);
      c.prender(`${d}_0${k + 1}_${lado}`, junta, extras);
    }
  }
}

// ---------- a cabeça: capuz, vazio, olhos, dentes ----------
function cabeca(c: Corpo, m: M, extras: Obj[]): void {
  const u = c.u;
  const g = grupoEm(c, c.p('Head'));
  const cabecaP = c.p('Head');
  // o capuz: a cúpula aberta na frente, forrada de negro, com o aro de pano claro em volta do rosto
  const casco = new THREE.Mesh(new THREE.SphereGeometry(0.16, 28, 18, Math.PI / 2 + 0.62, Math.PI * 2 - 1.24, 0, Math.PI * 0.78), m.capuz);
  casco.scale.set(1.08, 1.28, 1.3);
  casco.position.set(0, 0.085, -0.025);
  g.add(casco);
  const vazio = new THREE.Mesh(new THREE.SphereGeometry(0.108, 20, 14), m.vazio);
  vazio.scale.set(0.96, 1.12, 1.02);
  vazio.position.set(0, 0.078, 0.012);
  g.add(vazio);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.017, 8, 40), m.borda);
  aro.scale.set(0.9, 1.2, 1);
  aro.position.set(0, 0.082, 0.082);
  aro.rotation.y = 0;
  g.add(aro);
  // os olhos: fendas inclinadas, brancas, com o halo
  const aureola = halo();
  for (const sx of [-1, 1]) {
    const olho = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.012, 0.006), m.olho);
    olho.position.set(sx * 0.047, 0.097, 0.103);
    olho.rotation.z = -sx * 0.38;
    g.add(olho);
    const brilho = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.1), aureola);
    brilho.position.set(sx * 0.047, 0.097, 0.108);
    g.add(brilho);
  }
  // a boca: duas fileiras de dentes pontudos num sorriso largo, sobre a superfície do vazio
  const zEm = (x: number, y: number) => 0.012 + 0.102 * Math.sqrt(Math.max(0, 1 - (x / 0.0975) ** 2 - ((y - 0.078) / 0.1175) ** 2));
  const N = 11;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1) * 2 - 1;
    const x = t * 0.062;
    const sorriso = 0.045 + t * t * 0.02;
    const alto = 0.017 + (1 - Math.abs(t)) * 0.008;
    for (const [dy, apice] of [[0.006, Math.PI], [-0.007, 0]] as const) {
      const dente = new THREE.Mesh(new THREE.ConeGeometry(0.0072, alto, 4), m.dente);
      const y = sorriso + dy;
      dente.position.set(x, y, zEm(x, y) + 0.002);
      dente.rotation.set(0, 0, apice);
      dente.rotation.z += -t * 0.25 * (apice === 0 ? -1 : 1);
      g.add(dente);
    }
  }
  const linha = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.0035, 5, 20, Math.PI * 0.8), m.dente);
  linha.rotation.z = Math.PI * 1.1;
  linha.position.set(0, 0.094, zEm(0, 0.05) + 0.001);
  linha.scale.set(1, 0.36, 1);
  g.add(linha);
  c.prender('Head', g, extras);

  // a ponta do capuz: um tubo que sobe e curva para trás, afinando até a ponta (a fita da arte), com a ponta solta
  const caminho = new THREE.CatmullRomCurve3([
    V(0, 0.22, -0.06), V(0, 0.34, -0.12), V(0, 0.45, -0.24), V(0, 0.5, -0.4), V(0, 0.47, -0.58), V(0, 0.38, -0.74),
  ].map((p) => p.multiplyScalar(u).add(cabecaP)));
  const aneis: Anel[] = [];
  const N2 = 14;
  for (let i = 0; i < N2; i++) {
    const t = i / (N2 - 1);
    const r = 0.12 * u * Math.pow(1 - t, 0.85) + 0.004 * u;
    aneis.push({ c: caminho.getPointAt(t), rx: r * 1.15, rz: r * 0.85 });
  }
  extras.push(superficie({
    aneis, colunas: 14, frente: V(0, 0, 1),
    solto: (i) => Math.pow(i / (N2 - 1), 1.6) * 0.55,
    pesos: () => ['Head', 'Head', 1],
  }, m.capuz));
}

// ---------- ombreira, espartilho, cinto e correntes ----------
function corrente(c: Corpo, de: THREE.Vector3, ate: THREE.Vector3, folga: number, m: M, osso: string, extras: Obj[]): void {
  const u = c.u;
  const N = 16;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const p = de.clone().lerp(ate, t);
    p.y -= Math.sin(t * Math.PI) * folga * u;
    const elo = new THREE.Mesh(new THREE.TorusGeometry(0.0085 * u, 0.0022 * u, 5, 8), m.ferro);
    elo.scale.y = 1.35;
    elo.position.copy(p);
    elo.rotation.set(0, i % 2 === 0 ? 0 : Math.PI / 2, 0);
    c.prender(osso, elo, extras);
  }
}

function medalhao(c: Corpo, centro: THREE.Vector3, raio: number, m: M, osso: string, extras: Obj[]): void {
  const u = c.u;
  const g = new THREE.Group();
  g.position.copy(centro);
  g.scale.setScalar(u);
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(raio, raio * 1.04, 0.012, 24), m.latao);
  disco.rotation.x = Math.PI / 2;
  g.add(disco);
  for (const [r, t] of [[raio * 0.86, 0.0035], [raio * 0.62, 0.003], [raio * 0.36, 0.0028]] as const) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(r, t, 5, 28), m.ferro);
    a.position.z = 0.008;
    g.add(a);
  }
  const miolo = new THREE.Mesh(esfera(raio * 0.24, 12, 8), m.latao);
  miolo.scale.z = 0.5;
  miolo.position.z = 0.01;
  g.add(miolo);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const ponta = new THREE.Mesh(new THREE.ConeGeometry(raio * 0.07, raio * 0.3, 4), m.ferro);
    ponta.position.set(Math.cos(a) * raio * 0.5, Math.sin(a) * raio * 0.5, 0.009);
    ponta.rotation.z = a - Math.PI / 2;
    g.add(ponta);
  }
  c.prender(osso, g, extras);
}

function peitoral(c: Corpo, e: Eixos, m: M, extras: Obj[]): void {
  const u = c.u;
  const s3 = c.p('spine_03'), bacia = c.p('pelvis');
  const topo = s3.y + 0.01 * u, fundo = bacia.y + 0.03 * u;
  // o espartilho: o couro por cima do manto, em arco pela frente
  const N = 10;
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const y = mix(topo, fundo, i / (N - 1));
    const estreita = suave(0, 0.5, i / (N - 1)) * 0.0;
    aneis.push({ c: V(0, y, e.zDe(y)), rx: e.rx(y) + 0.012 * u - estreita, rz: e.rz(y) + 0.012 * u });
  }
  extras.push(superficie({
    aneis, colunas: 16, arco: [Math.PI * 0.5 - 0.95, 1.9], repete: [1, 1],
    pesos: (i) => ['spine_03', 'spine_02', 1 - suave(0.3, 0.8, i / (N - 1))],
  }, m.couro));
  // a frente: os ilhoses de latão e o cordão cruzado
  const frente = (y: number) => V(0, y, e.zDe(y) + e.rz(y) + 0.02 * u);
  const grade = new THREE.Group();
  const passos = 6;
  for (let i = 0; i < passos; i++) {
    const y = mix(topo - 0.02 * u, fundo + 0.02 * u, i / (passos - 1));
    for (const sx of [-1, 1]) {
      const ilhos = new THREE.Mesh(new THREE.TorusGeometry(0.006 * u, 0.0022 * u, 5, 8), m.latao);
      ilhos.position.copy(frente(y)).add(V(sx * 0.03 * u, 0, 0));
      grade.add(ilhos);
    }
    if (i < passos - 1) {
      const y2 = mix(topo - 0.02 * u, fundo + 0.02 * u, (i + 1) / (passos - 1));
      for (const sx of [-1, 1]) {
        const a = frente(y).add(V(sx * 0.03 * u, 0, 0)), b = frente(y2).add(V(-sx * 0.03 * u, 0, 0));
        const fio = new THREE.Mesh(new THREE.CylinderGeometry(0.0023 * u, 0.0023 * u, 1, 5), m.cordao);
        fio.scale.y = a.distanceTo(b);
        aoLongo(fio, a, b, 0.5);
        grade.add(fio);
      }
    }
  }
  // as tachas em losango nas tiras dos dois lados da frente
  for (const sx of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const y = mix(topo, fundo, 0.2 + i * 0.28);
      const tacha = new THREE.Mesh(new THREE.OctahedronGeometry(0.011 * u), m.latao);
      tacha.scale.set(0.8, 1.4, 0.6);
      tacha.position.copy(frente(y)).add(V(sx * 0.085 * u, 0, -0.004 * u));
      grade.add(tacha);
    }
  c.prender('spine_02', grade, extras);
  // o cinto: a tira, a fivela de disco e as correntes que pendem
  const yc = bacia.y + 0.03 * u;
  const cinto = new THREE.Mesh(new THREE.TorusGeometry(1, 0.016 * u, 6, 40), m.couro);
  cinto.rotation.x = Math.PI / 2;
  cinto.scale.set(e.rx(yc) + 0.016 * u, e.rz(yc) + 0.016 * u, 1);
  cinto.position.set(0, yc, e.zDe(yc));
  c.prender('pelvis', cinto, extras);
  medalhao(c, V(0, yc, e.zDe(yc) + e.rz(yc) + 0.03 * u), 0.026, m, 'pelvis', extras);
  const lado = V(e.rx(yc) * 0.8, yc, e.zDe(yc) + e.rz(yc) * 0.6);
  corrente(c, V(-lado.x, yc, lado.z), V(lado.x, yc - 0.01 * u, lado.z), 0.16, m, 'pelvis', extras);
  corrente(c, V(lado.x, yc - 0.01 * u, lado.z), V(lado.x * 1.12, yc - 0.28 * u, lado.z - 0.06 * u), 0.04, m, 'pelvis', extras);
}

function ombros(c: Corpo, m: M, extras: Obj[]): void {
  const u = c.u;
  // a ombreira grande no ombro esquerdo: placas em lâminas gravadas com o medalhão e a corrente
  ombreira(c, 'l', 'placa', m.placa, m.latao, extras, 3);
  const oe = c.p('upperarm_l');
  medalhao(c, oe.clone().add(V(0.015 * u, 0.1 * u, 0.045 * u)), 0.05, m, 'upperarm_l', extras);
  // as pontas de aço nas bordas da ombreira
  for (let i = 0; i < 5; i++) {
    const espinho = new THREE.Mesh(new THREE.ConeGeometry(0.012 * u, 0.05 * u, 5), m.ferro);
    const a = (i / 4 - 0.5) * 1.5;
    espinho.position.copy(oe).add(V(0.14 * u * Math.cos(a) * 0.9 + 0.02 * u, 0.035 * u, 0.12 * u * Math.sin(a)));
    espinho.rotation.set(Math.sin(a) * 0.5, 0, -1.2);
    c.prender('upperarm_l', espinho, extras);
  }
  corrente(c, oe.clone().add(V(0.01 * u, 0.06 * u, 0.1 * u)), c.p('spine_02').add(V(-0.03 * u, 0.02 * u, 0.16 * u)), 0.12, m, 'spine_03', extras);
  // o fecho do ombro direito: o medalhão menor que prende o manto
  medalhao(c, c.p('upperarm_r').add(V(-0.03 * u, 0.075 * u, 0.06 * u)), 0.03, m, 'upperarm_r', extras);
}

/** O cachecol: as dobras de pano caídas sobre o pescoço e os ombros, em duas camadas. */
function cachecol(c: Corpo, m: M, extras: Obj[]): void {
  const u = c.u;
  const pesc = c.p('neck_01');
  for (const [alto, largo, caida, semente] of [[0.055, 0.14, 0.085, 3], [0.02, 0.17, 0.12, 5]] as const) {
    const N = 7;
    const aneis: Anel[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      aneis.push({ c: V(0, pesc.y + (alto - caida * t) * u, pesc.z - 0.005 * u), rx: (largo + t * 0.1) * u, rz: (largo * 0.82 + t * 0.07) * u });
    }
    extras.push(superficie({
      aneis, colunas: 40, repete: [2, 1],
      ruga: (i, _j, a) => 1 + Math.sin(a * 8 + semente) * 0.09 * suave(0, 0.6, i / (N - 1)) * 1.1 + Math.sin(a * 3) * 0.02,
      descer: (i, j) => (i >= N - 1 ? Math.abs(Math.sin(j * 1.7 + semente)) * 0.025 * u : 0),
      solto: (i) => suave(0.5, 1, i / (N - 1)) * 0.25,
      pesos: () => ['spine_03', 'neck_01', 0.8],
    }, m.cachecol));
  }
}

/** Fitas de pano e os fiapos fantasmas que seguem o corpo e voam para trás. */
function fitas(c: Corpo, e: Eixos, m: M, extras: Obj[]): void {
  const u = c.u;
  const r = sorteio(77);
  const costas = (y: number) => e.zDe(y) - e.rz(y);
  // as fitas rasgadas que pendem das costas, do ombro e da cintura
  const ancoras: [string, THREE.Vector3, number, number][] = [
    ['spine_03', V(0.14 * u, c.p('spine_03').y + 0.04 * u, costas(c.p('spine_03').y)), 0.7, 0.07],
    ['spine_03', V(-0.12 * u, c.p('spine_03').y, costas(c.p('spine_03').y)), 0.85, 0.06],
    ['spine_02', V(0.05 * u, c.p('spine_02').y, costas(c.p('spine_02').y)), 0.95, 0.08],
    ['pelvis', V(-0.15 * u, e.bacia, costas(e.bacia)), 0.8, 0.06],
    ['pelvis', V(0.17 * u, e.bacia, costas(e.bacia) + 0.03 * u), 0.7, 0.055],
    ['pelvis', V(0, e.bacia, costas(e.bacia) - 0.01 * u), 1.05, 0.09],
  ];
  for (const [osso, a, compr, larg] of ancoras) {
    const pontos: THREE.Vector3[] = [];
    const larguras: number[] = [];
    const N = 9;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      pontos.push(a.clone().add(V(Math.sin(t * 5 + r() * 2) * 0.03 * u * t, -t * compr * u * 0.95, -t * 0.09 * u)));
      larguras.push(larg * u * (1 - t * 0.55));
    }
    extras.push(fita(pontos, larguras, osso, m.fita, 1.35));
  }
  // os fiapos fantasmas: fitas translúcidas e compridas, bem mais soltas
  for (let i = 0; i < 7; i++) {
    const x = (i / 6 - 0.5) * 0.36 * u;
    const y0 = mix(e.bacia, e.barra, 0.25 + r() * 0.35);
    const pontos: THREE.Vector3[] = [];
    const larguras: number[] = [];
    const N = 10;
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      pontos.push(V(x * (1 + t * 0.8) + Math.sin(t * 6 + i) * 0.025 * u, y0 - t * (0.35 + r() * 0.2) * u, e.zDe(y0) - e.rz(y0) * (1 + t * 0.15)));
      larguras.push((0.045 + r() * 0.03) * u * (1 - t * 0.7));
    }
    extras.push(fita(pontos, larguras, 'pelvis', m.fantasma, 1.7));
  }
}

/** A veste inteira da skin; o palco esconde o corpo do rig (`esconder`) e põe a gadanha na mão direita. */
export function vesteDoCeifador(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const m = materiais();
  const extras: Obj[] = [];
  const e = manto(c, m, extras);
  sobressaia(c, e, m, extras);
  tabardo(c, e, m, extras);
  peitoral(c, e, m, extras);
  for (const lado of ['l', 'r'] as const) {
    manga(c, lado, m, extras);
    mao(c, lado, m, extras);
  }
  ombros(c, m, extras);
  cachecol(c, m, extras);
  cabeca(c, m, extras);
  fitas(c, e, m, extras);
  return { extras, esconder: '.' };
}
