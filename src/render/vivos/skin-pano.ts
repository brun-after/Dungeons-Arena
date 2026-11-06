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

/**
 * A flutuação em baixa gravidade (06/11/2026): só nos materiais marcados com `flutuante` (o cabelo da Sombra Rubra).
 * O vértice solto paira sempre, mesmo parado:
 * - deriva lenta nos três eixos (ciclos de 7 a 11 s);
 * - uma onda que corre da raiz para a ponta, atrasando com o solto (a ponta responde depois, como sem peso);
 * - um empuxo para cima que tira a queda das pontas.
 * `uFlutuar` é a amplitude (unidades do rig). Vem antes do vento, que continua por cima quando o personagem anda.
 */
const CODIGO_DA_FLUTUACAO = /* glsl */ `
  if (solto > 0.0) {
    float sf = solto * solto;
    float atraso = solto * 2.6;
    float fa = uTempo * 0.62 - atraso + transformed.x * 2.4 + transformed.z * 1.9;
    float fb = uTempo * 0.83 - atraso * 1.3 + transformed.y * 2.8 + 1.7;
    float fc = uTempo * 0.57 - atraso * 0.8 + transformed.x * 1.6 - transformed.z * 2.2 + 3.1;
    vec3 boia = vec3(sin(fa) + 0.35 * sin(fb * 1.7), 0.55 + 0.45 * sin(fb), cos(fc) + 0.35 * sin(fa * 1.4));
    transformed += boia * uFlutuar * sf;
  }`;

/** Marca o material para flutuar como em baixa gravidade, com a amplitude `amplitude` (unidades do rig). */
export function flutuante<T extends THREE.Material>(m: T, amplitude: number): T {
  m.userData = { ...m.userData, flutuar: amplitude };
  return m;
}

/** O material com o vento do ator (o clone é do ator: os uniformes não se misturam entre personagens). */
export function aplicarVento<T extends THREE.Material>(m: T, u: UniformesDeVento): T {
  const c = m.clone();
  const flutuar = typeof m.userData.flutuar === 'number' ? m.userData.flutuar : 0;
  c.onBeforeCompile = (sombra) => {
    sombra.uniforms.uVento = u.uVento;
    sombra.uniforms.uTempo = u.uTempo;
    sombra.uniforms.uFlutuar = { value: flutuar };
    sombra.vertexShader = sombra.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float solto;\nuniform vec4 uVento;\nuniform float uTempo;\nuniform float uFlutuar;')
      .replace('#include <skinning_vertex>', `#include <skinning_vertex>\n${flutuar > 0 ? CODIGO_DA_FLUTUACAO : ''}\n${CODIGO_DO_VENTO}`);
  };
  c.customProgramCacheKey = () => (flutuar > 0 ? 'vento-skin-flutua' : 'vento-skin-1');
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
  // Só no servidor de desenvolvimento: `tempoDoRetrato` muda o instante do retrato, para revisar o movimento do pano.
  const tempo = import.meta.env.DEV ? (globalThis as { tempoDoRetrato?: number }).tempoDoRetrato : undefined;
  u.uTempo.value = tempo ?? 1.4;
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

/**
 * A densidade das skins (06/11/2026): quantas vezes cada intervalo entre anéis e entre colunas é subdividido. Começa
 * alta (o visual fiel, com muitos polígonos) para depois baixar até o equilíbrio com o desempenho; 1 = a malha desenhada.
 */
let densidade = 3;
export function definirDensidadeDaSkin(k: number): void {
  densidade = Math.max(1, Math.min(6, Math.round(k)));
}

/**
 * A malha de anéis; vai ao palco com `sa`, `sb`, `sw` (ossos por nome em `userData.tabela`) e `solto`. Com a densidade,
 * os anéis são reamostrados por uma curva suave pelos centros e as colunas são subdivididas; dobras, barra, solto e
 * pesos são os dos anéis e colunas desenhados, interpolados entre eles (o formato não muda, só fica mais liso).
 */
export function superficie(o: OpcoesDaSuperficie, m: THREE.Material): THREE.Mesh {
  const n0 = o.aneis.length;
  const k = n0 > 1 ? densidade : 1;
  const n = (n0 - 1) * k + 1;
  const colunas = o.colunas * k;
  const cols = colunas + 1;
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
    let q = tabela.indexOf(nome);
    if (q < 0) q = tabela.push(nome) - 1;
    return q;
  };
  const centros = n0 > 1 ? new THREE.CatmullRomCurve3(o.aneis.map((x) => x.c), false, 'centripetal') : null;
  const anelEm = (fi: number): { c: THREE.Vector3; t: THREE.Vector3; rx: number; rz: number } => {
    const i0 = Math.min(n0 - 1, Math.floor(fi)), i1 = Math.min(n0 - 1, i0 + 1), f = fi - i0;
    const A = o.aneis[i0] as Anel, B = o.aneis[i1] as Anel;
    if (!centros) return { c: A.c.clone(), t: V(0, -1, 0), rx: A.rx, rz: A.rz };
    const u = fi / (n0 - 1);
    const t = centros.getTangent(Math.min(1, Math.max(0, u)));
    return { c: centros.getPoint(u), t, rx: A.rx + (B.rx - A.rx) * f, rz: A.rz + (B.rz - A.rz) * f };
  };
  /** O valor bilinear de um retorno numérico nos anéis e colunas desenhados em volta de (fi, fj). */
  const entre = (fi: number, fj: number, f: (i: number, j: number) => number): number => {
    const i0 = Math.min(n0 - 1, Math.floor(fi)), i1 = Math.min(n0 - 1, i0 + 1), ti = fi - i0;
    const j0 = Math.min(o.colunas, Math.floor(fj)), j1 = Math.min(o.colunas, j0 + 1), tj = fj - j0;
    const a = f(i0, j0) * (1 - tj) + f(i0, j1) * tj;
    const b = f(i1, j0) * (1 - tj) + f(i1, j1) * tj;
    return a * (1 - ti) + b * ti;
  };
  const p = V();
  for (let i = 0; i < n; i++) {
    const fi = i / k;
    const anel = anelEm(fi);
    const t = anel.t;
    // a base do anel: `lado` e `fre` perpendiculares ao eixo, com a frente o mais perto possível de `frente`
    const fre = frente.clone().sub(t.clone().multiplyScalar(frente.dot(t))).normalize();
    const lado = t.clone().cross(fre).normalize().multiplyScalar(-1);
    for (let j = 0; j < cols; j++) {
      const fj = j / k;
      const a = a0 + (j / colunas) * aL;
      const f = o.ruga ? entre(fi, fj, (ii, jj) => o.ruga?.(ii, jj, a) ?? 1) : 1;
      p.copy(anel.c).addScaledVector(lado, Math.cos(a) * anel.rx * f).addScaledVector(fre, Math.sin(a) * anel.rz * f);
      if (o.descer) p.addScaledVector(t, -entre(fi, fj, (ii, jj) => o.descer?.(ii, jj, a0 + (jj / o.colunas) * aL) ?? 0));
      const q = i * cols + j;
      pos.set([p.x, p.y, p.z], q * 3);
      uv.set([(j / colunas) * (o.repete?.[0] ?? 1), (1 - i / (n - 1)) * (o.repete?.[1] ?? 1)], q * 2);
      const [A, B, w] = o.pesos(Math.round(fi), Math.round(fj), a, p);
      sa[q] = indice(A);
      sb[q] = indice(B);
      sw[q] = w;
      solto[q] = o.solto ? entre(fi, fj, (ii, jj) => o.solto?.(ii, jj) ?? 0) : 0;
    }
  }
  const indices: number[] = [];
  for (let i = 0; i < n - 1; i++)
    for (let j = 0; j < colunas; j++) {
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
 * Uma lâmina de pano entre duas bordas (06/11/2026): em cada estação, a borda de dentro `i` e a de fora `o`. É a asa
 * de um manto aberto pelo vento, desenhada pelo contorno medido na arte, onde os anéis não servem. As bordas são
 * reamostradas por curvas suaves (com a densidade das skins). Entre elas o pano faz uma barriga de `barriga` para trás.
 * `u` vai de dentro para fora e `v` da primeira estação à última; `solto` e `pesos` recebem (s, t, p), com `s` ao longo
 * e `t` através, ambos de 0 a 1.
 */
export function lamina(o: {
  estacoes: readonly { i: THREE.Vector3; o: THREE.Vector3 }[];
  colunas: number;
  barriga?: number;
  /** Um deslocamento extra em cada ponto (as dobras soltas do pano ao vento). */
  dobra?: (s: number, t: number) => THREE.Vector3;
  solto?: (s: number, t: number) => number;
  pesos: (s: number, t: number, p: THREE.Vector3) => readonly [string, string, number];
}, m: THREE.Material): THREE.Mesh {
  const k = densidade;
  const linhas = (o.estacoes.length - 1) * k * 2 + 1, cols = o.colunas * k + 1;
  const dentro = new THREE.CatmullRomCurve3(o.estacoes.map((e) => e.i), false, 'centripetal');
  const fora = new THREE.CatmullRomCurve3(o.estacoes.map((e) => e.o), false, 'centripetal');
  const n = linhas * cols;
  const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), sa = new Float32Array(n), sb = new Float32Array(n), sw = new Float32Array(n), solto = new Float32Array(n);
  const tabela: string[] = [];
  const indice = (nome: string) => {
    let q = tabela.indexOf(nome);
    if (q < 0) q = tabela.push(nome) - 1;
    return q;
  };
  const p = V();
  for (let a = 0; a < linhas; a++) {
    const s = a / (linhas - 1);
    const pi = dentro.getPoint(s), po = fora.getPoint(s);
    for (let b = 0; b < cols; b++) {
      const t = b / (cols - 1);
      p.copy(pi).lerp(po, t).add(V(0, 0, -Math.sin(t * Math.PI) * (o.barriga ?? 0) * pi.distanceTo(po)));
      if (o.dobra) p.add(o.dobra(s, t));
      const q = a * cols + b;
      pos.set([p.x, p.y, p.z], q * 3);
      uv.set([t, 1 - s], q * 2);
      const [A, B, w] = o.pesos(s, t, p);
      sa[q] = indice(A);
      sb[q] = indice(B);
      sw[q] = w;
      solto[q] = o.solto ? o.solto(s, t) : 0;
    }
  }
  const indices: number[] = [];
  for (let a = 0; a < linhas - 1; a++)
    for (let b = 0; b < cols - 1; b++) {
      const q = a * cols + b;
      indices.push(q, q + cols, q + 1, q + 1, q + cols, q + cols + 1);
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
 * Uma mecha de cabelo (ou fita grossa): um tubo achatado pelos pontos, afinando até a ponta, com `ponta` de solto no
 * fim. `largura` e `espessura` são as da raiz.
 */
export function mecha(pontos: readonly THREE.Vector3[], largura: number, espessura: number, osso: string, m: THREE.Material, ponta = 1.8, frente = V(0, 0, 1)): THREE.Mesh {
  const N = pontos.length;
  const aneis: Anel[] = pontos.map((c, i) => {
    const t = i / Math.max(1, N - 1);
    const f = Math.pow(1 - t, 0.85) * 0.92 + 0.08;
    return { c, rx: (largura / 2) * f, rz: (espessura / 2) * f };
  });
  return superficie({
    aneis, colunas: 6, frente,
    solto: (i) => Math.pow(i / Math.max(1, N - 1), 1.15) * ponta,
    pesos: () => [osso, osso, 1],
  }, m);
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
