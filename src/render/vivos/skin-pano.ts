// O pano das skins (06/11/2026): as superfícies de tecido com pesos por osso, o atributo `solto` e o vento.
//
// - `superficie`: uma malha por anéis ao longo de um caminho (a veste, a manga, o véu, a faixa). Cada vértice leva dois
//   ossos com peso (a veste segue a bacia e as coxas ao mesmo tempo, sem a fenda das meias-saias) e o `solto` (0 preso,
//   1 livre) que diz o quanto o pano voa. O palco (palco-vivo.ts `fundir`) lê `sa`, `sb`, `sw` e `solto`.
// - `aplicarVento`: o shader. Depois da pele, o vértice é empurrado para trás do rumo do personagem, sobe um pouco e
//   ondula; quanto mais solto, mais vai. Os uniformes são do ator (não do material), então cada skin vestida tem o
//   próprio vento. O estado dele (mola, curva, ondulação) é de `ventoDoAtor`.
// - `filigrana`: a textura dos bordados e das gravuras em espiral (pano e metal).

import * as THREE from 'three';
import { sorteio, seg, V } from './sombrio-base';

// ---------- vento ----------
export interface UniformesDeVento {
  /** xyz: o quanto o pano solto vai (unidades do rig, no espaço do modelo: -z é atrás); w: a energia (0 parado, 1 correndo). */
  uVento: THREE.IUniform<THREE.Vector4>;
  uTempo: THREE.IUniform<number>;
}
export const novosUniformes = (): UniformesDeVento => ({ uVento: { value: new THREE.Vector4() }, uTempo: { value: 0 } });

/** Depois de `skinning_vertex`: `transformed` está no espaço do modelo, já com a pele. */
const CODIGO_DO_VENTO = /* glsl */ `
  if (solto > 0.0) {
    float s2 = solto * solto;
    float fase = uTempo * 2.3 + transformed.y * 6.5 + transformed.x * 4.5;
    float onda = 0.6 * sin(fase) + 0.4 * sin(fase * 1.9 + 1.3);
    vec3 d = uVento.xyz * s2;
    d.z -= uVento.w * (0.5 + 0.5 * onda) * 0.2 * s2;
    d.x += onda * (0.014 + 0.05 * uVento.w) * s2;
    d.y += uVento.w * 0.08 * s2 * (0.6 + 0.4 * onda);
    transformed += d;
  }`;

/** O material com o vento do ator (o clone é do ator: os uniformes não se misturam entre personagens). */
export function aplicarVento<T extends THREE.Material>(m: T, u: UniformesDeVento): T {
  const c = m.clone();
  c.onBeforeCompile = (sombra) => {
    sombra.uniforms.uVento = u.uVento;
    sombra.uniforms.uTempo = u.uTempo;
    sombra.vertexShader = sombra.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float solto;\nuniform vec4 uVento;\nuniform float uTempo;')
      .replace('#include <skinning_vertex>', `#include <skinning_vertex>\n${CODIGO_DO_VENTO}`);
  };
  c.customProgramCacheKey = () => 'vento-skin-1';
  return c;
}

/** O material que o palco troca pelo clone com vento (a marca fica no `userData`; o clone leva junto). */
export function ventoso<T extends THREE.Material>(m: T): T {
  const c = m.clone();
  c.userData = { ...c.userData, vento: true };
  return c;
}

/** O estado do vento de um ator: o pano segue o movimento com uma mola um pouco folgada (o que dá o ar fantasmagórico). */
export interface EstadoDoVento {
  /** O quanto o personagem anda (0 a 1), suavizado, e a mola dele. */
  ritmo: number;
  vRitmo: number;
  /** O giro (lateral), suavizado e a mola. */
  giro: number;
  vGiro: number;
  anguloAnterior: number | null;
  ultimoMs: number;
  tempo: number;
}
export const novoEstadoDeVento = (): EstadoDoVento => ({ ritmo: 0, vRitmo: 0, giro: 0, vGiro: 0, anguloAnterior: null, ultimoMs: 0, tempo: 0 });

const MOLA = 16;
const AMORTECIMENTO = 3.6;

/**
 * Avança o vento: `andando` e o rumo (`angulo`, rad) vêm do pedido; `agoraMs` é o relógio de parede (o pano é
 * aparência, não gameplay). O pano vai para trás do rumo quando anda, balança para fora quando o personagem gira
 * e, parado, só respira. A mola passa um pouco do alvo e volta: o pano demora a acompanhar e a parar.
 */
export function avancarVento(e: EstadoDoVento, u: UniformesDeVento, andando: boolean, angulo: number, agoraMs: number, reduzido = false): void {
  const dt = e.ultimoMs === 0 ? 0 : Math.min(0.05, Math.max(0, (agoraMs - e.ultimoMs) / 1000));
  e.ultimoMs = agoraMs;
  e.tempo += dt * (reduzido ? 0.25 : 1);
  let giroAlvo = 0;
  if (e.anguloAnterior !== null && dt > 0) {
    let d = angulo - e.anguloAnterior;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    giroAlvo = Math.max(-1, Math.min(1, (d / dt) * 0.18));
  }
  e.anguloAnterior = angulo;
  const alvo = andando && !reduzido ? 1 : 0;
  e.vRitmo += (MOLA * (alvo - e.ritmo) - AMORTECIMENTO * e.vRitmo) * dt;
  e.ritmo += e.vRitmo * dt;
  e.vGiro += (MOLA * (giroAlvo - e.giro) - AMORTECIMENTO * e.vGiro) * dt;
  e.giro += e.vGiro * dt;
  const r = Math.max(0, e.ritmo);
  // A deriva do pano parado: um sopro lento, para trás e para os lados, que nunca para.
  const sopro = Math.sin(e.tempo * 0.9) * 0.5 + Math.sin(e.tempo * 1.7 + 2) * 0.5;
  u.uVento.value.set(e.giro * 0.4 + sopro * 0.035, 0.015 + r * 0.05, -0.05 - r * 0.42 + sopro * 0.02, Math.min(1.2, r));
  u.uTempo.value = e.tempo;
}

/** A pose fixa (retratos dos menus): o pano num sopro leve, como se a figura acabasse de parar. */
export function ventoParado(u: UniformesDeVento): void {
  u.uVento.value.set(0.03, 0.03, -0.14, 0.3);
  u.uTempo.value = 1.4;
}

// ---------- superfície por anéis ----------
export interface Anel {
  /** O centro do anel (mundo) e os raios na lateral e na frente. */
  c: THREE.Vector3;
  rx: number;
  rz: number;
}
export interface OpcoesDaSuperficie {
  aneis: readonly Anel[];
  colunas: number;
  /** Início e abertura do arco em torno do eixo (rad; 0 = o lado +x, π/2 = a frente). Padrão: a volta inteira. */
  arco?: readonly [number, number];
  /** A direção da frente (para fixar o giro dos anéis); padrão +z. */
  frente?: THREE.Vector3;
  /** Quanto o vértice desce pelo eixo (a barra rasgada), em metros do mundo. */
  descer?: (i: number, j: number, a: number) => number;
  /** O fator do raio (as dobras do pano). */
  ruga?: (i: number, j: number, a: number) => number;
  /** O quanto o vértice voa (0 preso a 1 solto; passa de 1 nas fitas). */
  solto?: (i: number, j: number) => number;
  /** Os dois ossos do vértice e o peso do primeiro (o do segundo é o resto). */
  pesos: (i: number, j: number, a: number, p: THREE.Vector3) => readonly [string, string, number];
  repete?: readonly [number, number];
}

/** A malha de anéis; vai ao palco com `sa`, `sb`, `sw` (ossos por nome em `userData.tabela`) e `solto`. */
export function superficie(o: OpcoesDaSuperficie, m: THREE.Material): THREE.Mesh {
  const n = o.aneis.length;
  const cols = o.colunas + 1;
  const [a0, aL] = o.arco ?? [0, Math.PI * 2];
  const frente = o.frente ?? V(0, 0, 1);
  const pos = new Float32Array(n * cols * 3);
  const uv = new Float32Array(n * cols * 2);
  const sa = new Float32Array(n * cols);
  const sb = new Float32Array(n * cols);
  const sw = new Float32Array(n * cols);
  const solto = new Float32Array(n * cols);
  const tabela: string[] = [];
  const indice = (nome: string) => {
    let k = tabela.indexOf(nome);
    if (k < 0) k = tabela.push(nome) - 1;
    return k;
  };
  const p = V();
  for (let i = 0; i < n; i++) {
    const anel = o.aneis[i] as Anel;
    const anterior = o.aneis[Math.max(0, i - 1)] as Anel;
    const seguinte = o.aneis[Math.min(n - 1, i + 1)] as Anel;
    const t = seguinte.c.clone().sub(anterior.c).normalize();
    // a base do anel: `lado` e `fre` perpendiculares ao eixo, com a frente o mais perto possível de `frente`
    const fre = frente.clone().sub(t.clone().multiplyScalar(frente.dot(t))).normalize();
    const lado = t.clone().cross(fre).normalize().multiplyScalar(-1);
    for (let j = 0; j < cols; j++) {
      const a = a0 + (j / o.colunas) * aL;
      const f = o.ruga?.(i, j, a) ?? 1;
      p.copy(anel.c).addScaledVector(lado, Math.cos(a) * anel.rx * f).addScaledVector(fre, Math.sin(a) * anel.rz * f);
      p.addScaledVector(t, -(o.descer?.(i, j, a) ?? 0));
      const k = i * cols + j;
      pos.set([p.x, p.y, p.z], k * 3);
      uv.set([(j / o.colunas) * (o.repete?.[0] ?? 1), (1 - i / (n - 1)) * (o.repete?.[1] ?? 1)], k * 2);
      const [A, B, w] = o.pesos(i, j, a, p);
      sa[k] = indice(A);
      sb[k] = indice(B);
      sw[k] = w;
      solto[k] = o.solto?.(i, j) ?? 0;
    }
  }
  const indices: number[] = [];
  for (let i = 0; i < n - 1; i++)
    for (let j = 0; j < o.colunas; j++) {
      const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
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

/**
 * Uma fita (tira de pano solta): `pontos` pelo caminho, `larguras` em cada ponto. O primeiro ponto está preso (solto 0)
 * e o último voa mais (`ponta`). Um osso só (a fita nasce de um lugar do corpo).
 */
export function fita(pontos: readonly THREE.Vector3[], larguras: readonly number[], osso: string, m: THREE.Material, ponta = 1.4, lado = V(1, 0, 0)): THREE.Mesh {
  const aneis: Anel[] = pontos.map((c, i) => ({ c, rx: (larguras[i] ?? larguras[larguras.length - 1] ?? 0.05) / 2, rz: 0.0005 }));
  return superficie({
    aneis, colunas: 2, arco: [0, Math.PI], frente: lado.clone().cross(V(0, 1, 0)).lengthSq() > 1e-6 ? lado.clone().cross(V(0, 1, 0)).normalize() : V(0, 0, 1),
    solto: (i) => Math.pow(i / Math.max(1, pontos.length - 1), 1.1) * ponta,
    pesos: () => [osso, osso, 1],
  }, m);
}

// ---------- texturas ----------
/** Espirais e gavinhas gravadas (o bordado da veste, a gravura do metal), sobre uma cor de base com desgaste. */
export function filigrana(base: string, linha: string, semente: number, o: { densidade?: number; barra?: string; manchas?: number } = {}): THREE.CanvasTexture {
  const r = sorteio(semente);
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  if (!g) throw new Error('sem canvas 2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  // a trama do pano e o desgaste
  for (let y = 0; y < 512; y += 2) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`; g.fillRect(0, y, 512, 1); }
  for (let i = 0; i < (o.manchas ?? 90); i++) {
    const x = r() * 512, y = r() * 512, raio = 10 + r() * 60;
    const grd = g.createRadialGradient(x, y, 0, x, y, raio);
    grd.addColorStop(0, r() < 0.6 ? 'rgba(8,4,8,0.3)' : 'rgba(200,170,190,0.05)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(x - raio, y - raio, raio * 2, raio * 2);
  }
  // as gavinhas: um traço que enrola, com uma folha no fim
  g.lineCap = 'round';
  const gavinha = (x: number, y: number, ang: number, comp: number, grosso: number) => {
    g.strokeStyle = linha;
    g.lineWidth = grosso;
    g.beginPath();
    g.moveTo(x, y);
    let a = ang;
    let passo = comp / 14;
    for (let k = 0; k < 14; k++) {
      a += (0.16 + k * 0.045) * (ang > 0 ? 1 : -1);
      x += Math.cos(a) * passo;
      y += Math.sin(a) * passo;
      passo *= 0.92;
      g.lineTo(x, y);
    }
    g.stroke();
    g.beginPath();
    g.arc(x, y, grosso * 1.6, 0, Math.PI * 2);
    g.stroke();
  };
  // hastes verticais ondulantes, de baixo para cima, com as gavinhas em espiral saindo dos lados (como o bordado da arte)
  const dens = o.densidade ?? 1;
  for (let x = 18 + r() * 24; x < 512; x += (96 + r() * 70) / dens) {
    const alto = 150 + r() * 260;
    const fase = r() * 6;
    const xEm = (t: number) => x + Math.sin(t * 5 + fase) * 15 * (1 - t * 0.3);
    g.strokeStyle = linha;
    g.lineWidth = 2 + r() * 1.5;
    g.beginPath();
    g.moveTo(xEm(0), 500);
    for (let k = 1; k <= 28; k++) g.lineTo(xEm(k / 28), 500 - (alto * k) / 28);
    g.stroke();
    for (let y = 470; y > 500 - alto; y -= 30 + r() * 24) {
      const t = (500 - y) / alto;
      const lado = r() < 0.5 ? -1 : 1;
      gavinha(xEm(t), y, lado > 0 ? -0.5 : Math.PI + 0.5, 26 + r() * 34, 1.2 + r() * 1.1);
    }
    gavinha(xEm(1), 500 - alto, -Math.PI / 2, 30 + r() * 20, 2);
  }
  if (o.barra) {
    g.fillStyle = o.barra;
    g.fillRect(0, 462, 512, 14);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (let x = 0; x < 512; x += 20) g.fillRect(x, 462, 2, 14);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Os cortes da barra rasgada: o alfa branco com dentes e furos pretos (o mesmo desenho do pano rasgado do kit sombrio). */
export function rasgos(semente: number, fundo: number, furos = 6): THREE.CanvasTexture {
  const r = sorteio(semente);
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  if (!g) throw new Error('sem canvas 2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#000';
  let x = 0;
  g.beginPath();
  g.moveTo(0, 256);
  while (x < 256) {
    const w = 5 + r() * 16;
    g.lineTo(x + w * 0.5, 256 * fundo + r() * 256 * (1 - fundo) * 0.95);
    g.lineTo(x + w, 256 * (fundo + 0.1) + r() * 24);
    x += w;
  }
  g.lineTo(256, 256);
  g.fill();
  for (let i = 0; i < furos; i++) {
    g.beginPath();
    g.ellipse(r() * 256, 256 * (0.55 + r() * 0.35), 2 + r() * 6, 3 + r() * 10, r(), 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

export { seg };
