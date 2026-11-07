// A skin Mágico do Aventureiro (06/11/2026): um mágico de palco de terno preto (o feltro da cartola). As peças:
// - a cabeça é uma esfera com o símbolo do yin-yang (preto e branco, com os dois pontos), sem rosto;
// - a camisa branca, a gravata-borboleta vermelha (a fita da cartola) e a gola branca;
// - o paletó aberto na frente, com as lapelas de cetim preto e a casaca que desce em duas abas atrás;
// - as mangas e a calça do terno, as luvas brancas e os sapatos pretos de verniz.
// 06/11/2026: o terno passou de branco para a cor da cartola; a camisa e as lapelas trocaram de tom para contrastar.
// O "falcão" é a cartola que voa (render/voo-falcao.ts, modelos/magico.ts e o atlas de tools/sprites/magico3d.ts).
// O corpo do rig fica escondido.

import * as THREE from 'three';
import type { Ossos, PecaSombria } from './sombrio-base';
import { aoLongo, Corpo, V } from './sombrio-base';
import { fita, superficie, type Anel } from './skin-pano';
import { eixosDoCorpo, mao, mix, pesosDoManto, suave, type Eixos } from './skin-ceifador';

type Obj = THREE.Object3D;
const DUPLO = THREE.DoubleSide;

/** O yin-yang na esfera: cada ponto pela projeção de frente (x, y da direção), o mesmo desenho na frente e atrás. */
function texturaDoYinYang(): THREE.CanvasTexture {
  const L = 512, A = 256;
  const c = document.createElement('canvas');
  c.width = L;
  c.height = A;
  const g = c.getContext('2d');
  if (!g) throw new Error('sem canvas 2d');
  const img = g.createImageData(L, A);
  for (let py = 0; py < A; py++) {
    const teta = ((py + 0.5) / A) * Math.PI;
    for (let px = 0; px < L; px++) {
      const fi = ((px + 0.5) / L) * Math.PI * 2;
      const x = -Math.cos(fi) * Math.sin(teta), y = Math.cos(teta);
      const cima = Math.hypot(x, y - 0.5), baixo = Math.hypot(x, y + 0.5);
      let preto = x > 0;
      if (cima < 0.5) preto = true;
      if (baixo < 0.5) preto = false;
      if (cima < 0.14) preto = false;
      if (baixo < 0.14) preto = true;
      const v = preto ? 18 : 240;
      const k = (py * L + px) * 4;
      img.data[k] = v;
      img.data[k + 1] = v;
      img.data[k + 2] = preto ? 22 : 236;
      img.data[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function materiais() {
  return {
    terno: new THREE.MeshStandardMaterial({ color: 0x17161b, roughness: 0.45, metalness: 0.1, side: DUPLO }),
    cetim: new THREE.MeshStandardMaterial({ color: 0x0b0b0e, roughness: 0.22, metalness: 0.15, side: DUPLO }),
    camisa: new THREE.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.7, side: DUPLO }),
    gravata: new THREE.MeshStandardMaterial({ color: 0xb3202e, roughness: 0.45 }),
    luva: new THREE.MeshStandardMaterial({ color: 0xf8f6f0, roughness: 0.75 }),
    sapato: new THREE.MeshStandardMaterial({ color: 0x0e0e12, roughness: 0.18, metalness: 0.2 }),
    yinYang: new THREE.MeshStandardMaterial({ map: texturaDoYinYang(), roughness: 0.35 }),
  };
}
type M = ReturnType<typeof materiais>;

/** Um tubo pela lista de pontos, com um raio e um osso por ponto (mistura entre eles). */
function tubo(pontos: THREE.Vector3[], raios: number[], ossos: string[], m: THREE.Material, extras: Obj[]): void {
  const curva = new THREE.CatmullRomCurve3(pontos);
  const N = 12;
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const f = (i / (N - 1)) * (raios.length - 1);
    const k = Math.min(raios.length - 2, Math.floor(f));
    const rr = mix(raios[k] as number, raios[k + 1] as number, f - k);
    aneis.push({ c: curva.getPointAt(i / (N - 1)), rx: rr, rz: rr * 0.95 });
  }
  extras.push(superficie({
    aneis, colunas: 18,
    pesos: (i) => {
      const f = (i / (N - 1)) * (ossos.length - 1);
      const k = Math.min(ossos.length - 2, Math.floor(f));
      return [ossos[k] as string, ossos[k + 1] as string, 1 - suave(0.25, 0.75, f - k)];
    },
  }, m));
}

/** A camisa branca por baixo (do pescoço à bacia). */
function camisa(c: Corpo, e: Eixos, m: M, extras: Obj[]): void {
  const aneis: Anel[] = [];
  for (let i = 0; i < 8; i++) {
    const y = mix(e.topo, e.bacia - 0.04 * c.u, i / 7);
    aneis.push({ c: V(0, y, e.zDe(y)), rx: e.rx(y) * 0.8, rz: e.rz(y) * 0.84 });
  }
  extras.push(superficie({ aneis, colunas: 22, pesos: pesosDoManto(c, e) }, m.camisa));
}

/**
 * O paletó: aberto na frente (o V até a cintura e abrindo abaixo dela), justo no tronco, e a casaca em duas abas atrás,
 * que descem até o meio da coxa. As lapelas de cetim correm pelas bordas da abertura.
 */
function paleto(c: Corpo, e: Eixos, m: M, extras: Obj[]): void {
  const N = 12;
  const yFim = e.bacia - 0.16 * c.u;
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const y = mix(e.topo + 0.01 * c.u, yFim, i / (N - 1));
    const yy = Math.max(y, e.bacia);
    const folga = y < e.bacia ? 1.08 + (e.bacia - y) / c.u * 0.4 : 1;
    aneis.push({ c: V(0, y, e.zDe(yy)), rx: e.rx(yy) * 0.9 * folga, rz: e.rz(yy) * 0.95 * folga });
  }
  const s2 = c.p('spine_02').y;
  extras.push(superficie({
    aneis, colunas: 30, arco: [Math.PI / 2 + 0.28, Math.PI * 2 - 0.56],
    // abaixo da cintura, a frente sobe (o paletó curto na frente) e as abas de trás descem
    descer: (i, _j, a) => {
      const t = i / (N - 1), atras = Math.max(0, -Math.sin(a)), frente = Math.max(0, Math.sin(a));
      const fenda = Math.abs(Math.cos(a)) < 0.12 && Math.sin(a) < 0 ? 0.08 * c.u : 0;
      return (0.1 * c.u * atras * suave(0.5, 1, t)) - (0.14 * c.u * frente * suave(0.55, 1, t)) - fenda * suave(0.6, 1, t);
    },
    ruga: (_i, _j, a) => 1 + Math.sin(a * 6) * 0.01,
    pesos: (i, j, a, p) => (p.y < s2 - 0.05 * c.u ? pesosDoManto(c, e)(i, j, a, p) : ['spine_03', 'spine_02', suave(s2, s2 + 0.2 * c.u, p.y)]),
  }, m.terno));
  // as lapelas: tiras de cetim nas duas bordas da abertura, do colarinho até a cintura, deitadas para fora
  for (const lado of [1, -1]) {
    const pts = [0, 0.2, 0.45, 0.7, 1].map((t) => {
      const y = mix(e.topo, s2 - 0.04 * c.u, t);
      const a = Math.PI / 2 - lado * mix(0.22, 0.32, t);
      return V(Math.cos(a) * e.rx(y) * 0.93, y, e.zDe(y) + Math.sin(a) * e.rz(y) * 0.99);
    });
    extras.push(fita(pts, [0.05 * c.u, 0.07 * c.u, 0.075 * c.u, 0.05 * c.u, 0.01 * c.u], 'spine_03', m.cetim, 0, V(lado, 0, 0.3).normalize()));
  }
}

/** A gravata-borboleta vermelha e a gola branca da camisa. */
function gravata(c: Corpo, e: Eixos, m: M, extras: Obj[]): void {
  const u = c.u;
  const pesc = c.p('neck_01');
  const gola = new THREE.Mesh(new THREE.CylinderGeometry(0.075 * u, 0.085 * u, 0.05 * u, 18, 1, true), m.camisa);
  gola.position.set(pesc.x, e.topo + 0.015 * u, e.zDe(e.topo));
  c.prender('neck_01', gola, extras);
  const g = new THREE.Group();
  g.position.set(pesc.x, e.topo - 0.02 * u, e.zDe(e.topo) + e.rz(e.topo) * 0.9 + 0.035 * u);
  g.scale.setScalar(1.5);
  const no = new THREE.Mesh(new THREE.SphereGeometry(0.014 * u, 10, 8), m.gravata);
  g.add(no);
  for (const s of [-1, 1]) {
    const asa = new THREE.Mesh(new THREE.ConeGeometry(0.03 * u, 0.06 * u, 4), m.gravata);
    asa.rotation.z = s * Math.PI / 2;
    asa.scale.set(1, 1, 0.45);
    asa.position.x = s * 0.03 * u;
    g.add(asa);
  }
  c.prender('spine_03', g, extras);
}

function pernas(c: Corpo, m: M, extras: Obj[]): void {
  const u = c.u;
  for (const lado of ['l', 'r'] as const) {
    const quadril = c.p(`thigh_${lado}`), joelho = c.p(`calf_${lado}`), tornozelo = c.p(`foot_${lado}`), bola = c.p(`ball_${lado}`);
    tubo([quadril.clone().add(V(0, 0.04 * u, 0)), quadril.clone().lerp(joelho, 0.5), joelho, joelho.clone().lerp(tornozelo, 0.5), tornozelo.clone().add(V(0, 0.02 * u, 0))],
      [0.085 * u, 0.075 * u, 0.06 * u, 0.056 * u, 0.058 * u],
      [`thigh_${lado}`, `thigh_${lado}`, `calf_${lado}`, `calf_${lado}`, `foot_${lado}`], m.terno, extras);
    // o sapato de verniz: do tornozelo à ponta arredondada
    const ponta = bola.clone().add(bola.clone().sub(tornozelo).setY(0).normalize().multiplyScalar(0.05 * u)).setY(0.02 * u);
    tubo([tornozelo.clone().add(V(0, 0.01 * u, 0)), tornozelo.clone().lerp(bola, 0.5).setY(0.035 * u), bola.clone().setY(0.03 * u), ponta],
      [0.05 * u, 0.048 * u, 0.042 * u, 0.02 * u], [`foot_${lado}`, `foot_${lado}`, `ball_${lado}`, `ball_${lado}`], m.sapato, extras);
  }
}

function bracos(c: Corpo, m: M, extras: Obj[]): void {
  const u = c.u;
  for (const lado of ['l', 'r'] as const) {
    const ombro = c.p(`upperarm_${lado}`), cot = c.p(`lowerarm_${lado}`), pulso = c.p(`hand_${lado}`);
    tubo([ombro.clone().add(V(0, 0.03 * u, 0)), ombro.clone().lerp(cot, 0.5), cot, cot.clone().lerp(pulso, 0.5), pulso.clone().lerp(cot, 0.06)],
      [0.062 * u, 0.055 * u, 0.05 * u, 0.047 * u, 0.05 * u],
      [`upperarm_${lado}`, `upperarm_${lado}`, `lowerarm_${lado}`, `lowerarm_${lado}`, `hand_${lado}`], m.terno, extras);
    // o punho branco da camisa aparecendo e a luva branca
    tubo([pulso.clone().lerp(cot, 0.08), pulso.clone().lerp(cot, 0.01)], [0.042 * u, 0.04 * u], [`lowerarm_${lado}`, `hand_${lado}`], m.camisa, extras);
    mao(c, lado, { osso: m.luva }, extras, 2.2);
    const dedos = c.p(`middle_01_${lado}`);
    const dorso = new THREE.Mesh(new THREE.BoxGeometry(0.075 * u, 1, 0.032 * u), m.luva);
    dorso.scale.y = pulso.distanceTo(dedos) * 1.05;
    aoLongo(dorso, pulso, dedos, 0.5);
    c.prender(`hand_${lado}`, dorso, extras);
  }
}

/** A cabeça: a esfera do yin-yang, do tamanho de uma cabeça, um pouco à frente do osso. */
function cabeca(c: Corpo, m: M, extras: Obj[]): void {
  const u = c.u;
  const cab = c.p('Head');
  const bola = new THREE.Mesh(new THREE.SphereGeometry(0.12 * u, 40, 28), m.yinYang);
  bola.position.copy(cab).add(V(0, 0.085 * u, 0.012 * u));
  c.prender('Head', bola, extras);
}

export function vesteDoMagico(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const e = eixosDoCorpo(c);
  const m = materiais();
  const extras: Obj[] = [];
  camisa(c, e, m, extras);
  paleto(c, e, m, extras);
  gravata(c, e, m, extras);
  pernas(c, m, extras);
  bracos(c, m, extras);
  cabeca(c, m, extras);
  return { extras, esconder: '.' };
}
