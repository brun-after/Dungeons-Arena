// A skin Ceifador do necromante (06/11/2026), refeita a partir das medidas da arte (skin-ceifador-medidas.ts), no
// mesmo processo da Sombra Rubra. As alturas passam ao rig por marcos (chão, ombro e queixo; do queixo ao topo do capuz
// vale a proporção da arte), e os tamanhos e o lado usam a altura do rig. As peças:
// - o capuz grande com a ponta dobrada para o lado e, dentro, o rosto só de escuridão (sem olhos nem dentes);
// - a gola em camadas e a ombreira de três placas com o medalhão e a corrente;
// - o espartilho laceado com as tachas em losango;
// - o casaco longo aberto na frente, com as faixas de bordado em gavinhas nas bordas; por dentro, a túnica e o tabardo
//   com a ponta ornada;
// - as mangas em sino rasgadas sobre as de dentro justas, com o punho bordado, e as mãos de osso;
// - as camadas de cima (06/11/2026): a capeleta dupla, a sobressaia de quatro painéis com o cinto, o boldrié com as
//   fivelas e os acabamentos em relevo nas bordas, no estilo de pano pesado e gasto;
// - a capa rasgada atrás e o traje que se desfaz em trevas: os pedaços que se soltam nos caminhos das fitas da arte,
//   os que caem da barra, e a fumaça preta.
// O pano voa com o vento de skin-pano.ts. A arma é a gadanha de skin-gadanha.ts. As funções de base daqui (perfis,
// pesos, mão de osso) também servem à Sombra Rubra.

import * as THREE from 'three';
import { altura as alturaNaArte, BORDADOS, caixa, lado as ladoNaArte, MANTO, MARCOS, PECAS, TACHAS, tam } from './skin-ceifador-medidas';
import type { Ossos, PecaSombria } from './sombrio-base';
import { aoLongo, Corpo, esfera, sorteio, V } from './sombrio-base';
import { fita, superficie, type Anel } from './skin-pano';
import { materiaisDoCeifador, type MateriaisDoCeifador as M } from './skin-ceifador-texturas';
import { fiapos, materiaisDasTrevas, type Pedaco } from './skin-trevas';

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

/**
 * A mão de osso: os metacarpos presos na mão e cada dedo em falanges presas aos ossos dele (dobram com a animação).
 * `escala` (06/11/2026) estica a mão a partir do pulso, para a mão do desenho caber no rig (a do Ceifador é quase o dobro).
 */
export function mao(c: Corpo, lado: 'l' | 'r', m: { osso: THREE.Material }, extras: Obj[], grosso = 1, escala = 1): void {
  const u = c.u;
  const pulso = c.p(`hand_${lado}`);
  const p = (nome: string) => pulso.clone().add(c.p(nome).sub(pulso).multiplyScalar(escala));
  const g = grosso * Math.sqrt(escala);
  const dedos = ['index', 'middle', 'ring', 'pinky'] as const;
  for (const d of dedos) {
    const base = p(`${d}_01_${lado}`);
    const meta = new THREE.Mesh(new THREE.CylinderGeometry(0.007 * u * g, 0.0085 * u * g, 1, 6), m.osso);
    meta.scale.y = pulso.distanceTo(base);
    aoLongo(meta, pulso, base, 0.5);
    c.prender(`hand_${lado}`, meta, extras);
  }
  const palma = new THREE.Mesh(new THREE.BoxGeometry(0.06 * u * escala, 0.012 * u * g, 0.012 * u * g), m.osso);
  palma.position.copy(pulso.clone().lerp(p(`middle_01_${lado}`), 0.55));
  palma.rotation.z = lado === 'l' ? 0.2 : -0.2;
  c.prender(`hand_${lado}`, palma, extras);
  for (const d of [...dedos, 'thumb'] as const) {
    const pontos = [1, 2, 3].map((k) => p(`${d}_0${k}_${lado}`));
    pontos.push(p(`${d}_04_leaf_${lado}`));
    for (let k = 0; k < 3; k++) {
      const a = pontos[k] as THREE.Vector3, b = pontos[k + 1] as THREE.Vector3;
      const falange = new THREE.Mesh(new THREE.CylinderGeometry(0.0055 * u * g * (k === 2 ? 0.55 : 0.85), 0.0075 * u * g, 1, 6), m.osso);
      falange.scale.y = a.distanceTo(b);
      aoLongo(falange, a, b, 0.5);
      c.prender(`${d}_0${k + 1}_${lado}`, falange, extras);
      const junta = new THREE.Mesh(esfera(0.0085, 8, 6), m.osso);
      junta.scale.setScalar(u * g);
      junta.position.copy(a);
      c.prender(`${d}_0${k + 1}_${lado}`, junta, extras);
    }
  }
}

// ---------- a régua: da arte para o rig ----------
interface Regua {
  /** A altura do rig de uma fração de altura da arte (por marcos). */
  y: (fracao: number) => number;
  /** Um tamanho ou lado (fração de H da arte) no rig. */
  m: (fracao: number) => number;
}
function regua(c: Corpo, e: Eixos): Regua {
  const H = c.p('Head').y + 0.225 * c.u;
  const queixo = c.p('Head').y + 0.022 * c.u;
  const marcos: [number, number][] = [
    [0, 0],
    [alturaNaArte(MARCOS.ombro), e.topo],
    [alturaNaArte(MARCOS.queixo), queixo],
    // do queixo ao alto do capuz vale a proporção da arte (o capuz é bem maior que a cabeça do rig)
    [1, queixo + (1 - alturaNaArte(MARCOS.queixo)) * H],
  ];
  return {
    y: (f) => {
      for (let i = 1; i < marcos.length; i++) {
        const [a0, r0] = marcos[i - 1] as [number, number], [a1, r1] = marcos[i] as [number, number];
        if (f <= a1 || i === marcos.length - 1) return mix(r0, r1, (f - a0) / (a1 - a0));
      }
      return H;
    },
    m: (f) => f * H,
  };
}
/** A altura e o lado no rig de um ponto (x, y) da arte. */
const ponto = (R: Regua, x: number, y: number, z = 0): THREE.Vector3 => V(R.m(ladoNaArte(x)), R.y(alturaNaArte(y)), z);

// ---------- materiais (skin-ceifador-texturas.ts) ----------
/** Os materiais, com as faixas de bordado (BORDADOS) postas na altura certa da textura do casaco. */
function materiais(yTopo: number, R: Regua): M {
  const vDe = (y: number) => ((yTopo - R.y(alturaNaArte(y))) / yTopo) * 512;
  return materiaisDoCeifador(BORDADOS.map(([, y0, y1]) => [vDe(y0), vDe(y1)] as const));
}

// ---------- o casaco, a túnica, o tabardo e a capa ----------
/** A largura do manto na arte (MANTO) como meia-largura no rig, pela altura do rig. */
function meiaLargura(R: Regua): (y: number) => number {
  const tabela = MANTO.map(([yArte, w]) => [R.y(alturaNaArte(yArte)), R.m(tam(w)) / 2] as const);
  return perfilDe(tabela);
}

/**
 * O casaco longo até o chão, aberto na frente entre as duas faixas de bordado (x = 275 e x = 450 na arte), com a barra
 * rasgada e soprada para o lado esquerdo dele (a arte). Por dentro, a túnica fechada, mais estreita.
 */
function casaco(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const larg = meiaLargura(R);
  const N = 28, COL = 60;
  const barra = R.m(tam(265));
  const a1 = Math.acos(Math.max(-1, Math.min(1, R.m(ladoNaArte(BORDADOS[1]?.[0] ?? 450)) / barra)));
  const a0 = Math.acos(Math.max(-1, Math.min(1, R.m(ladoNaArte(BORDADOS[0]?.[0] ?? 275)) / barra)));
  const yChao = 0.006 * c.u;
  const aneis = (escala: number): Anel[] => Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1), y = mix(e.topo, yChao, t);
    const zy = e.zDe(Math.max(y, e.bacia)) - t * 0.04 * c.u;
    const rx = Math.max(larg(y), e.rx(Math.max(y, e.bacia)) * 0.9) * escala;
    return { c: V(0, y, zy), rx, rz: rx * mix(0.85, 0.72, t) };
  });
  const cortes = dentes(COL, 91, R.m(tam(70)));
  const pesos = pesosDoManto(c, e);
  // o vento da arte: a barra se abre mais para o lado esquerdo dele (+x)
  const ruga = (i: number, a: number) => 1 + Math.sin(a * 9 + i * 0.05) * 0.03 * suave(4, N - 1, i) + Math.max(0, Math.cos(a)) * 0.16 * suave(N / 3, N - 1, i);
  extras.push(superficie({
    aneis: aneis(0.86), colunas: COL,
    ruga: (i, _j, a) => ruga(i, a) * 0.98,
    descer: (i, j) => (i >= N - 2 ? (cortes[(j * 7) % COL] ?? 0) * 0.6 : 0),
    solto: (i) => Math.pow(suave(N / 3, N - 1, i), 1.15) * 0.9,
    pesos,
  }, m.tunica));
  const soltoDoCasaco = (i: number) => Math.pow(suave(N / 4, N - 1, i), 1.1) * 1.1;
  const fora = aneis(1);
  extras.push(superficie({
    aneis: fora, colunas: COL, arco: [a0, Math.PI * 2 - (a0 - a1)], repete: [1, 1],
    ruga: (i, _j, a) => ruga(i, a),
    descer: (i, j) => (i >= N - 3 ? cortes[j] ?? 0 : 0),
    solto: soltoDoCasaco,
    pesos,
  }, m.casaco));
  // o acabamento em relevo (06/11/2026): a faixa bordada e grossa que corre pelas duas bordas da abertura, por cima
  // do pano, como a barra pesada das vestes da arte
  for (const a of [a0, a1]) {
    const normal = V(Math.cos(a), 0, Math.sin(a));
    const borda: Anel[] = fora.slice(0, N - 2).map((anel, i) => ({
      c: anel.c.clone().add(V(Math.cos(a) * anel.rx * ruga(i, a) * 1.01, 0, Math.sin(a) * anel.rz * ruga(i, a) * 1.01)),
      rx: R.m(tam(17)), rz: 0.007 * c.u,
    }));
    extras.push(superficie({ aneis: borda, colunas: 8, frente: normal, repete: [1, 6], solto: soltoDoCasaco, pesos }, m.acabamento));
  }
}

/** Um ponto na pele do tronco, na frente: o lado `x` e a altura `y`, `fora` acima da superfície. */
function naFrenteDoTronco(e: Eixos, x: number, y: number, fora: number): THREE.Vector3 {
  const yy = Math.max(y, e.bacia);
  const rx = e.rx(yy), q = Math.min(0.96, Math.abs(x) / rx);
  return V(x, y, e.zDe(yy) + e.rz(yy) * Math.sqrt(1 - q * q) + fora);
}

/**
 * A capeleta (06/11/2026): duas camadas curtas de pano rasgado sobre os ombros, abertas na frente, a de baixo mais
 * longa. Dão o volume em camadas do alto da veste (o casaco, a capeleta, a gola e o capuz uns sobre os outros).
 */
function capeleta(c: Corpo, e: Eixos, m: M, extras: Obj[]): void {
  const u = c.u;
  const ombro = Math.abs(c.p('upperarm_l').x);
  const arco = [Math.PI / 2 + 0.55, Math.PI * 2 - 1.1] as const;
  for (const [k, comprido] of [[0, 0.3], [1, 0.19]] as const) {
    const N = 9, COL = 44;
    const cortes = dentes(COL, 301 + k, 0.06 * u);
    const aneis: Anel[] = Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1), y = e.topo + 0.02 * u - t * comprido * u;
      const r = mix(e.rx(e.topo) * 1.05, ombro + (0.09 - k * 0.02) * u, Math.pow(t, 0.6)) + k * 0.012 * u;
      return { c: V(0, y, e.zDe(Math.max(y, e.bacia)) - t * 0.02 * u), rx: r, rz: r * mix(0.85, 0.7, t) };
    });
    extras.push(superficie({
      aneis, colunas: COL, arco, repete: [2, 1],
      ruga: (i, _j, a) => 1 + Math.sin(a * 11 + k * 3) * 0.05 * (i / (N - 1)),
      descer: (i, j) => (i >= N - 2 ? cortes[j] ?? 0 : 0),
      solto: (i) => suave(2, N - 1, i) * 0.5,
      pesos: (i, _j, a) => [Math.cos(a) > 0.5 && i > 3 ? 'upperarm_l' : Math.cos(a) < -0.5 && i > 3 ? 'upperarm_r' : 'spine_03', 'spine_03', 0.5],
    }, k === 0 ? m.capeleta : m.gola));
    // a barra bordada da camada de cima
    if (k === 1) {
      const ult = aneis[N - 2] as Anel;
      extras.push(superficie({
        aneis: [{ c: ult.c.clone().add(V(0, 0.014 * u, 0)), rx: ult.rx * 1.02, rz: ult.rz * 1.02 }, { c: ult.c, rx: ult.rx * 1.035, rz: ult.rz * 1.035 }],
        colunas: COL, arco, repete: [10, 1],
        solto: () => 0.3, pesos: () => ['spine_03', 'spine_03', 1],
      }, m.acabamento));
    }
  }
}

/** A fivela: o aro quadrado de latão com a lingueta, virada de `giro` em torno do eixo vertical. */
function fivela(c: Corpo, centro: THREE.Vector3, lado: number, m: M, osso: string, extras: Obj[], giro = 0): void {
  const g = new THREE.Group();
  g.position.copy(centro);
  g.rotation.y = giro;
  const barra = lado * 0.16;
  for (const [x, y, w, h] of [[0, lado / 2, lado, barra], [0, -lado / 2, lado, barra], [lado / 2, 0, barra, lado], [-lado / 2, 0, barra, lado]] as const) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w + barra, h, barra), m.latao);
    b.position.set(x, y, 0);
    g.add(b);
  }
  const lingueta = new THREE.Mesh(new THREE.BoxGeometry(lado * 0.75, barra * 0.6, barra * 0.6), m.ferro);
  lingueta.position.z = barra * 0.5;
  g.add(lingueta);
  c.prender(osso, g, extras);
}

/**
 * A sobressaia (06/11/2026): quatro painéis rasgados que pendem do cinto por cima do casaco, dois de cada lado da
 * abertura e dois atrás, com o cinto largo de couro e a fivela.
 */
function sobressaia(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const u = c.u;
  const larg = meiaLargura(R);
  const yCinto = e.bacia + 0.05 * u, yFim = mix(c.p('calf_l').y, 0, 0.35);
  const raio = (y: number) => Math.max(larg(y), e.rx(Math.max(y, e.bacia)) * 0.9) * 1.07 + 0.012 * u;
  const pesos = pesosDoManto(c, e);
  const centros = [Math.PI / 2 - 0.95, Math.PI / 2 + 0.95, Math.PI * 1.5 - 0.75, Math.PI * 1.5 + 0.75];
  for (const [k, meio] of centros.entries()) {
    const N = 12, COL = 12;
    const cortes = dentes(COL, 341 + k, 0.09 * u);
    const fim = mix(yCinto, yFim, k < 2 ? 1 : 0.85);
    const aneis: Anel[] = Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1), y = mix(yCinto, fim, t), r = raio(y) * (1 + t * 0.06);
      return { c: V(0, y, e.zDe(Math.max(y, e.bacia)) - t * 0.04 * u), rx: r, rz: r * mix(0.85, 0.74, t) };
    });
    extras.push(superficie({
      aneis, colunas: COL, arco: [meio - 0.5, 1.0],
      ruga: (i, j) => 1 + Math.sin(j * 1.4 + k) * 0.035 * (i / (N - 1)),
      descer: (i, j) => (i >= N - 2 ? cortes[j] ?? 0 : 0),
      solto: (i) => Math.pow(i / (N - 1), 1.2) * 1.2,
      pesos,
    }, m.sobressaia));
  }
  // o cinto: a faixa de couro por cima de tudo, com a fivela de latão do lado esquerdo dele
  const cinto: Anel[] = [yCinto + 0.022 * u, yCinto - 0.022 * u].map((y) => {
    const r = raio(y) * 1.03;
    return { c: V(0, y, e.zDe(Math.max(y, e.bacia))), rx: r, rz: r * 0.85 };
  });
  extras.push(superficie({ aneis: cinto, colunas: 40, pesos: () => ['pelvis', 'spine_02', 0.8] }, m.couro));
  const r = raio(yCinto) * 1.03, a = 1.1;
  fivela(c, V(r * Math.cos(a), yCinto, e.zDe(e.bacia) + r * 0.86 * Math.sin(a)), 0.05 * u, m, 'pelvis', extras, -0.45);
}

/** As correias (06/11/2026): o boldrié de couro do ombro direito ao quadril esquerdo, com as fivelas e as tachas. */
function correias(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const u = c.u;
  const de = c.p('upperarm_r'), yFim = e.bacia + 0.06 * u;
  const xFim = e.rx(e.bacia) * 0.78;
  const N = 10;
  const pts = Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1);
    return naFrenteDoTronco(e, mix(de.x * 0.85, xFim, t), mix(e.topo - 0.01 * u, yFim, t), 0.03 * u);
  });
  extras.push(fita(pts, pts.map(() => R.m(tam(30))), 'spine_03', m.couro, 0.15, V(1, 0.7, 0).normalize()));
  for (const t of [0.3, 0.72]) {
    const i = Math.round(t * (N - 1)), p = pts[i] ?? V();
    fivela(c, p.clone().add(V(0, 0, 0.006 * u)), R.m(tam(34)), m, i < 5 ? 'spine_03' : 'spine_02', extras, 0);
  }
  for (let i = 1; i < N - 1; i += 2) {
    const tacha = new THREE.Mesh(esfera(0.007, 6, 4), m.latao);
    tacha.scale.set(u, u, u * 0.5);
    tacha.position.copy(pts[i] ?? V()).add(V(0, 0, 0.004 * u));
    c.prender(i < 5 ? 'spine_03' : 'spine_02', tacha, extras);
  }
}

/** O tabardo (PECAS.tabardo): a tira de bordado escuro entre as bordas do casaco, com a ponta ornada embaixo. */
function tabardo(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const tb = caixa(PECAS.tabardo);
  const x = R.m(tb.lado);
  const y0 = R.y(alturaNaArte(PECAS.tabardo[1])), y1 = R.y(alturaNaArte(PECAS.tabardo[3]));
  const larg = meiaLargura(R);
  const N = 9;
  const pontos = Array.from({ length: N }, (_, i) => {
    const y = mix(y0, y1, i / (N - 1));
    return V(x, y, e.zDe(Math.max(y, e.bacia)) + larg(y) * 0.8 + 0.01 * c.u);
  });
  extras.push(fita(pontos, pontos.map((_, i) => R.m(tb.largura) * (i === N - 1 ? 0.2 : 1 - (i / (N - 1)) * 0.15)), 'pelvis', m.tabardo, 0.6));
  const fim = pontos[N - 2] ?? V();
  const ponta = new THREE.Mesh(new THREE.OctahedronGeometry(R.m(tam(26))), m.latao);
  ponta.scale.set(0.7, 1.5, 0.35);
  ponta.position.copy(fim).add(V(0, 0, 0.012 * c.u));
  c.prender('pelvis', ponta, extras);
}

/** A capa rasgada atrás (mais larga que o casaco) e as fitas da arte (FITAS), que voam para os dois lados. */
function capa(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const larg = meiaLargura(R);
  const N = 22, COL = 40;
  const cortes = dentes(COL, 131, R.m(tam(140)));
  const aneis: Anel[] = Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1), y = mix(e.topo + 0.01 * c.u, 0.04 * c.u, t);
    const rx = Math.max(larg(y), e.rx(Math.max(y, e.bacia))) * (1.08 + t * 0.2);
    return { c: V(0, y, e.zDe(Math.max(y, e.bacia)) - t * 0.1 * c.u), rx, rz: rx * 0.8 };
  });
  extras.push(superficie({
    aneis, colunas: COL, arco: [Math.PI * 0.95, Math.PI * 1.1], repete: [2, 1],
    ruga: (i, _j, a) => 1 + Math.sin(a * 7 + i * 0.2) * 0.06 * suave(3, N - 1, i),
    descer: (i, j) => (i >= N - 4 ? (cortes[j] ?? 0) * suave(N - 4, N - 1, i) : 0),
    solto: (i) => Math.pow(suave(1, N - 1, i), 1.1) * 1.3,
    pesos: pesosDoManto(c, e),
  }, m.capa));
  // o rastro de trevas (06/11/2026): não são tiras ao vento nem uma aura, é o próprio traje se desfazendo atrás de quem
  // anda. Os fiapos nascem nas costas do pano (dentro da silhueta, mais na barra, onde o traje mais se desfaz) e vão reto
  // para trás, quase sem abrir para os lados: visto de frente ou de costas é uma esteira estreita, não um halo. O
  // shader (skin-trevas.ts) só os mostra andando, cada um na sua fase: o fluxo não para e nada estica e volta.
  const rr = sorteio(913);
  const trevas = materiaisDasTrevas();
  const densos: Pedaco[] = [], leves: Pedaco[] = [];
  for (let n = 0; n < 160; n++) {
    // mais embaixo: a barra se desfaz mais que os ombros
    const t = Math.pow(rr(), 1.8), y = mix(0.04 * c.u, e.topo * 0.92, t);
    const yy = Math.max(y, e.bacia);
    const largura = Math.max(larg(y), e.rx(yy) * 0.9);
    const x = (rr() - 0.5) * 2 * largura * mix(0.75, 0.45, t);
    const centro = V(x, y, e.zDe(yy) - largura * 0.75);
    const rumo = V(x * 0.15, (rr() - 0.35) * 0.06 * c.u, -(0.28 + rr() * 0.26) * c.u * mix(1.2, 0.7, t));
    (rr() < 0.65 ? densos : leves).push({ centro, rumo, largura: R.m(tam((95 + rr() * 50) * mix(1.15, 0.75, t))), fase: rr(), osso: y > e.bacia + 0.1 * c.u ? 'spine_03' : 'pelvis' });
  }
  extras.push(fiapos(densos, trevas.densa), fiapos(leves, trevas.fumo));
  // a fumaça: fitas translúcidas e escuras, compridas e bem mais soltas
  const r = sorteio(77);
  for (let i = 0; i < 7; i++) {
    const x = (i / 6 - 0.5) * 0.36 * c.u;
    const y0 = mix(e.bacia, e.barra, 0.25 + r() * 0.35);
    const N2 = 10;
    const pontos = Array.from({ length: N2 }, (_, k) => {
      const t = k / (N2 - 1);
      return V(x * (1 + t * 0.8) + Math.sin(t * 6 + i) * 0.025 * c.u, y0 - t * (0.35 + r() * 0.2) * c.u, e.zDe(y0) - e.rz(y0) * (1.2 + t * 0.15));
    });
    extras.push(fita(pontos, pontos.map((_, k) => (0.045 + r() * 0.03) * c.u * (1 - (k / (N2 - 1)) * 0.7)), 'pelvis', m.fumaca, 1.7));
  }
}

// ---------- as mangas e os antebraços de osso ----------
/** A manga em sino: a boca tem a largura medida (140 px na arte) e a barra rasgada pende mais. */
function manga(c: Corpo, R: Regua, lado: 'l' | 'r', m: M, extras: Obj[]): void {
  const u = c.u;
  const ombro = c.p(`upperarm_${lado}`), cot = c.p(`lowerarm_${lado}`), pulso = c.p(`hand_${lado}`);
  const fim = cot.clone().lerp(pulso, 0.78);
  const curva = new THREE.CatmullRomCurve3([ombro.clone().add(V(0, 0.035 * u, 0)), ombro.clone().lerp(cot, 0.5), cot, cot.clone().lerp(fim, 0.5), fim]);
  const boca = R.m(tam((PECAS.mangaSolta[2] - PECAS.mangaSolta[0]) / 2));
  const raios = perfilDe([[1, boca], [0.72, boca * 0.72], [0.45, boca * 0.55], [0, boca * 0.6]]);
  const N = 16;
  const aneis: Anel[] = Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1);
    return { c: curva.getPointAt(t), rx: raios(1 - t), rz: raios(1 - t) * 0.92 };
  });
  const cortes = dentes(36, lado === 'l' ? 211 : 223, R.m(tam(lado === 'r' ? 120 : 60)));
  extras.push(superficie({
    aneis, colunas: 36, repete: [2, 1], frente: V(0, 0, 1),
    ruga: (i, _j, a) => 1 + Math.sin(a * 6) * 0.06 * suave(0.5, 1, i / (N - 1)),
    descer: (i, j) => (i >= N - 2 ? cortes[j] ?? 0 : 0),
    solto: (i) => Math.pow(suave(0.5, 1, i / (N - 1)), 1.2) * 1.0,
    pesos: (i) => {
      const t = i / (N - 1);
      return t < 0.5 ? [`upperarm_${lado}`, `lowerarm_${lado}`, 1 - suave(0.32, 0.5, t) * 0.5] : [`lowerarm_${lado}`, `hand_${lado}`, 1 - suave(0.8, 1, t) * 0.45];
    },
  }, m.manga));
  // a manga de dentro (06/11/2026): justa, sai da boca do sino até perto do pulso, e o punho bordado na boca de fora
  const justa: Anel[] = Array.from({ length: 6 }, (_, i) => {
    const t = i / 5;
    return { c: cot.clone().lerp(pulso, mix(0.1, 0.62, t)), rx: mix(0.04, 0.03, t) * u, rz: mix(0.038, 0.028, t) * u };
  });
  extras.push(superficie({ aneis: justa, colunas: 16, frente: V(0, 0, 1), pesos: () => [`lowerarm_${lado}`, `lowerarm_${lado}`, 1] }, m.mangaDentro));
  extras.push(superficie({
    aneis: aneis.slice(N - 4, N - 2).map((a) => ({ c: a.c, rx: a.rx * 1.06, rz: a.rz * 1.06 })), colunas: 36, repete: [8, 1], frente: V(0, 0, 1),
    solto: () => 0.6, pesos: () => [`lowerarm_${lado}`, `hand_${lado}`, 0.7],
  }, m.acabamento));
  // o antebraço de osso abaixo da boca da manga: rádio e ulna, com o punho
  const a = cot.clone().lerp(pulso, 0.6);
  for (const dz of [-0.014, 0.014]) {
    const osso = new THREE.Mesh(new THREE.CylinderGeometry(0.011 * u, 0.0135 * u, 1, 8), m.osso);
    const de = a.clone().add(V(0, 0, dz * u)), ate = pulso.clone().add(V(0, 0, dz * 0.8 * u));
    osso.scale.y = de.distanceTo(ate);
    aoLongo(osso, de, ate, 0.5);
    c.prender(`lowerarm_${lado}`, osso, extras);
  }
  const punho = new THREE.Mesh(esfera(0.022, 10, 8), m.osso);
  punho.scale.setScalar(u);
  punho.position.copy(pulso);
  c.prender(`lowerarm_${lado}`, punho, extras);
}

// ---------- a cabeça: capuz e o vazio ----------
/**
 * O capuz (PECAS.capuz): a cúpula fechada do alto até a testa, com a ponta dobrada para o lado esquerdo dele, e a parte
 * aberta na frente da testa até os ombros, onde se abre sobre eles. Dentro, só a escuridão do rosto, virada para a
 * direita dele.
 */
function cabeca(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const u = c.u;
  const cab = c.p('Head');
  const capuz = caixa(PECAS.capuz);
  const raio = R.m(capuz.largura) / 2;
  const x0 = R.m(capuz.lado);
  const yTesta = R.y(alturaNaArte(195)), yQueixo = R.y(alturaNaArte(MARCOS.queixo)), yOmbro = e.topo;
  const zc = cab.z - 0.01 * u;
  const pontaDoCapuz = ponto(R, 515, 120, zc - 0.16 * u);
  // 06/11/2026: o capuz pontudo da arte, em gota: o pano afina da testa até a ponta, que cai para trás e para o lado
  // (sem o topo chato de antes, que deixava a cabeça quadrada, e sem virar crânio: é pano sobre a cabeça)
  const fechado: Anel[] = [0, 0.12, 0.28, 0.46, 0.64, 0.82, 1].map((f) => {
    const c = V(mix(pontaDoCapuz.x, x0, Math.pow(f, 0.5)), mix(pontaDoCapuz.y, yTesta, Math.pow(f, 1.6)), mix(pontaDoCapuz.z, zc, Math.pow(f, 0.55)));
    const r = raio * Math.max(0.04, Math.pow(f, 0.42));
    return { c, rx: r * 0.92, rz: r };
  });
  extras.push(superficie({
    aneis: fechado, colunas: 30,
    ruga: (i, _j, a) => 1 + Math.sin(a * 5 + i) * 0.03,
    solto: (i) => Math.max(0, 0.6 - i * 0.2),
    pesos: () => ['Head', 'Head', 1],
  }, m.capuz));
  const aberto: Anel[] = [
    { c: V(x0, yTesta, zc), rx: raio * 0.9, rz: raio },
    { c: V(x0, mix(yTesta, yQueixo, 0.5), zc), rx: raio * 0.9, rz: raio * 1.02 },
    { c: V(x0 * 0.6, yQueixo, zc - 0.005 * u), rx: raio * 0.95, rz: raio * 1.0 },
    { c: V(x0 * 0.3, mix(yQueixo, yOmbro, 0.6), e.zDe(yOmbro)), rx: raio * 1.35, rz: raio * 1.15 },
    { c: V(0, yOmbro - 0.03 * u, e.zDe(yOmbro)), rx: raio * 1.75, rz: raio * 1.3 },
  ];
  extras.push(superficie({
    aneis: aberto, colunas: 34, arco: [Math.PI / 2 + 0.62, Math.PI * 2 - 1.24],
    ruga: (i, _j, a) => 1 + Math.sin(a * 7 + i * 0.8) * 0.05 * (i / 4),
    solto: (i) => suave(2, 4, i) * 0.35,
    pesos: (i) => (i <= 2 ? ['Head', 'neck_01', 0.85 - i * 0.2] : ['spine_03', 'neck_01', 0.6]),
  }, m.capuz));

  // o rosto: só o vazio, virado para a direita dele
  const rosto = caixa(PECAS.rosto);
  const g = new THREE.Group();
  g.position.set(x0, R.y(rosto.altura), zc + raio * 0.12);
  g.rotation.y = -0.36;
  const rx = R.m(rosto.largura) / 2 * 0.95, ry = R.m(rosto.alto) / 2, rz = raio * 0.8;
  const vazio = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), m.vazio);
  vazio.scale.set(rx, ry, rz);
  g.add(vazio);
  // 06/11/2026: sem o aro de pano em volta do rosto (sem os olhos, ele virava um círculo cinza): a própria abertura do
  // capuz emoldura a escuridão
  // 06/11/2026: sem olhos nem dentes (deixou de imitar o rosto da arte): dentro do capuz só a escuridão
  c.prender('Head', g, extras);
}

// ---------- gola, ombreira, espartilho, correntes ----------
function corrente(c: Corpo, de: THREE.Vector3, ate: THREE.Vector3, folga: number, m: M, osso: string, extras: Obj[], elo = 1): void {
  const u = c.u;
  const N = Math.max(6, Math.round(de.distanceTo(ate) / (0.02 * u * elo)));
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const p = de.clone().lerp(ate, t);
    p.y -= Math.sin(t * Math.PI) * folga * u;
    const anel = new THREE.Mesh(new THREE.TorusGeometry(0.0085 * u * elo, 0.0022 * u * elo, 5, 8), m.ferro);
    anel.scale.y = 1.35;
    anel.position.copy(p);
    anel.rotation.set(0, i % 2 === 0 ? 0 : Math.PI / 2, 0);
    c.prender(osso, anel, extras);
  }
}

/** O medalhão: o disco de latão com os anéis gravados, o miolo e as pontas em estrela; `raio` em metros do rig. */
function medalhao(c: Corpo, centro: THREE.Vector3, raio: number, m: M, osso: string, extras: Obj[]): void {
  const g = new THREE.Group();
  g.position.copy(centro);
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(raio, raio * 1.04, raio * 0.25, 28), m.latao);
  disco.rotation.x = Math.PI / 2;
  g.add(disco);
  for (const [r, t] of [[0.86, 0.07], [0.62, 0.06], [0.36, 0.055]] as const) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(raio * r, raio * t, 5, 28), m.ferro);
    a.position.z = raio * 0.16;
    g.add(a);
  }
  const miolo = new THREE.Mesh(esfera(raio * 0.24, 12, 8), m.latao);
  miolo.scale.z = 0.5;
  miolo.position.z = raio * 0.2;
  g.add(miolo);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const ponta = new THREE.Mesh(new THREE.ConeGeometry(raio * 0.07, raio * 0.3, 4), m.ferro);
    ponta.position.set(Math.cos(a) * raio * 0.5, Math.sin(a) * raio * 0.5, raio * 0.18);
    ponta.rotation.z = a - Math.PI / 2;
    g.add(ponta);
  }
  c.prender(osso, g, extras);
}

/** A gola (PECAS.gola): três camadas de pano dobrado entre o queixo e os ombros, cada uma mais larga. */
function gola(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const u = c.u;
  const pesc = c.p('neck_01');
  const yAlto = R.y(alturaNaArte(PECAS.gola[1])), yBaixo = R.y(alturaNaArte(PECAS.gola[3]));
  const raio = R.m(tam(PECAS.gola[2] - PECAS.gola[0])) / 2;
  for (let k = 0; k < 3; k++) {
    const N = 6;
    const y0 = mix(yAlto, yBaixo, k * 0.3), y1 = mix(yAlto, yBaixo, 0.45 + k * 0.28);
    const aneis: Anel[] = Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1);
      const r = raio * (0.75 + k * 0.22) * (1 + t * 0.3);
      return { c: V(0, mix(y0, y1, t), mix(pesc.z, e.zDe(e.topo), t)), rx: r, rz: r * 0.92 };
    });
    extras.push(superficie({
      aneis, colunas: 36, repete: [2, 1],
      ruga: (i, _j, a) => 1 + Math.sin(a * 8 + k * 2) * 0.1 * suave(0, N - 1, i),
      descer: (i, j) => (i === N - 1 ? Math.abs(Math.sin(j * 1.7 + k)) * 0.02 * u : 0),
      solto: (i) => suave(2, N - 1, i) * 0.25,
      pesos: () => ['spine_03', 'neck_01', 0.4 + k * 0.2],
    }, m.gola));
  }
}

/**
 * A ombreira do ombro esquerdo (PECAS.ombreira): três placas em arco, uma sobre a outra, a de baixo maior, do lado do
 * pescoço até além do ombro. O medalhão da frente (PECAS.medalhao) e a corrente que pende de trás.
 */
function ombreira(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const u = c.u;
  const ob = caixa(PECAS.ombreira);
  const ombro = c.p('upperarm_l');
  const largura = R.m(ob.largura), alto = R.m(ob.alto);
  const centro = V(R.m(ob.lado), R.y(ob.altura), ombro.z);
  for (let k = 0; k < 3; k++) {
    const r = largura * (0.36 + k * 0.08);
    const placa = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.06, largura * (0.62 - k * 0.08), 28, 1, true, -Math.PI * 0.62, Math.PI * 0.95), m.placa);
    placa.rotation.x = Math.PI / 2;
    placa.position.copy(centro).add(V(k * 0.012 * u, alto * 0.18 - k * alto * 0.24 - r * 0.6, 0));
    c.prender('upperarm_l', placa, extras);
    const borda = new THREE.Mesh(new THREE.TorusGeometry(r * 1.03, r * 0.035, 5, 28, Math.PI * 0.95), m.latao);
    borda.rotation.set(0, 0, Math.PI / 2 - Math.PI * 0.62 + Math.PI);
    borda.position.copy(placa.position).add(V(0, 0, largura * (0.31 - k * 0.04)));
    c.prender('upperarm_l', borda, extras);
  }
  const md = caixa(PECAS.medalhao);
  medalhao(c, V(R.m(md.lado), R.y(md.altura), e.zDe(e.topo) + e.rz(e.topo) + 0.03 * u), R.m(md.largura) / 2, m, 'spine_03', extras);
  corrente(c, ponto(R, 630, 420, ombro.z - 0.04 * u), ponto(R, 650, 485, ombro.z - 0.06 * u), 0.02, m, 'upperarm_l', extras, 1.3);
  // o fecho do outro lado da gola
  medalhao(c, ponto(R, 340, 370, e.zDe(e.topo) + e.rz(e.topo) * 0.9), R.m(tam(12)), m, 'spine_03', extras);
}

/** O espartilho (PECAS.espartilho): o couro na frente, o cordão em cinco cruzes e as tachas em losango (TACHAS). */
function espartilho(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const u = c.u;
  const es = caixa(PECAS.espartilho);
  const x = R.m(es.lado), meia = R.m(es.largura) / 2;
  const y0 = R.y(alturaNaArte(PECAS.espartilho[1])), y1 = R.y(alturaNaArte(PECAS.espartilho[3]));
  const frente = (y: number) => e.zDe(Math.max(y, e.bacia)) + e.rz(Math.max(y, e.bacia)) + 0.02 * u;
  const tira = Array.from({ length: 6 }, (_, i) => {
    const y = mix(y0, y1, i / 5);
    return V(x, y, frente(y) - 0.006 * u);
  });
  extras.push(fita(tira, tira.map(() => meia * 2.2), 'spine_02', m.couro, 0));
  const g = new THREE.Group();
  const CRUZES = 5;
  for (let i = 0; i <= CRUZES; i++) {
    const y = mix(y0, y1, i / CRUZES);
    for (const sx of [-1, 1]) {
      const ilhos = new THREE.Mesh(new THREE.TorusGeometry(0.007 * u, 0.0026 * u, 5, 8), m.latao);
      ilhos.position.set(x + sx * meia, y, frente(y));
      g.add(ilhos);
    }
    if (i === CRUZES) continue;
    const y2 = mix(y0, y1, (i + 1) / CRUZES);
    for (const sx of [-1, 1]) {
      const a = V(x + sx * meia, y, frente(y)), b = V(x - sx * meia, y2, frente(y2));
      const fio = new THREE.Mesh(new THREE.BoxGeometry(0.012 * u, 1, 0.004 * u), m.cordao);
      fio.scale.y = a.distanceTo(b);
      aoLongo(fio, a, b, 0.5);
      g.add(fio);
    }
  }
  for (const [tx, ty] of TACHAS) {
    const tacha = new THREE.Mesh(new THREE.OctahedronGeometry(R.m(tam(12))), m.latao);
    tacha.scale.set(0.75, 1.4, 0.5);
    const p = ponto(R, tx, ty);
    tacha.position.set(p.x, p.y, frente(p.y) + 0.004 * u);
    g.add(tacha);
  }
  c.prender('spine_02', g, extras);
  // o cinto inclinado com a corrente que pende dele (a arte: do lado esquerdo dele, até a altura da mão)
  const yc = e.bacia + 0.04 * u;
  const lado = V(R.m(ladoNaArte(490)), yc, frente(yc));
  corrente(c, lado, ponto(R, 505, 880, frente(yc) + 0.02 * u), 0.03, m, 'pelvis', extras, 1.4);
}

/** A veste inteira da skin; o palco esconde o corpo do rig (`esconder`) e põe a gadanha na mão direita. */
export function vesteDoCeifador(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const e = eixosDoCorpo(c);
  const R = regua(c, e);
  const m = materiais(e.topo, R);
  const extras: Obj[] = [];
  casaco(c, e, R, m, extras);
  tabardo(c, e, R, m, extras);
  capa(c, e, R, m, extras);
  espartilho(c, e, R, m, extras);
  sobressaia(c, e, R, m, extras);
  correias(c, e, R, m, extras);
  // as mãos: um pouco maiores que as do rig, mas não as da arte medida (lá a mão é desenhada em exagero; no 3D ela
  // roubava o destaque da roupa e da gadanha; 06/11/2026)
  for (const lado of ['l', 'r'] as const) {
    manga(c, R, lado, m, extras);
    mao(c, lado, m, extras, 1.1, 1.22);
  }
  capeleta(c, e, m, extras);
  gola(c, e, R, m, extras);
  ombreira(c, e, R, m, extras);
  cabeca(c, e, R, m, extras);
  return { extras, esconder: '.' };
}

/**
 * 08/11/2026 (D-137): o Servo do ossuário (servo-vivo.ts) veste o corte do Ceifador sem os enfeites: o casaco longo, a
 * capa rasgada, a capeleta nos ombros, as mangas e o capuz com o rosto de escuridão; sem espartilho, tabardo, cintos,
 * gola, ombreira nem mãos.
 */
export function vesteDoServoBase(ossos: Ossos): PecaSombria & { corpo: Corpo } {
  const c = new Corpo(ossos);
  const e = eixosDoCorpo(c);
  const R = regua(c, e);
  // liso como na arte: sem as gavinhas do casaco, o acabamento bordado vira pano escuro e os punhos de osso somem no breu
  const base = materiaisDoCeifador([]);
  const m: M = { ...base, acabamento: base.tunica, osso: base.mangaDentro };
  const extras: Obj[] = [];
  casaco(c, e, R, m, extras);
  capa(c, e, R, m, extras);
  for (const lado of ['l', 'r'] as const) manga(c, R, lado, m, extras);
  capeleta(c, e, m, extras);
  cabeca(c, e, R, m, extras);
  return { extras, esconder: '.', corpo: c };
}
