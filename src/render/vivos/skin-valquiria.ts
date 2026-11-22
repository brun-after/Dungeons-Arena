// A skin Valquíria Glacial do arqueiro (21/11/2026), montada a partir das medidas da arte
// (skin-valquiria-medidas.ts), no mesmo processo da Sombra Rubra: as alturas passam da arte ao rig por marcos (chão,
// joelho, virilha, ombro e queixo) e os tamanhos e o lado usam a altura do rig. O desenho vai espelhado no lado: na
// arte o arco está na mão esquerda, aqui na direita, que é a dos golpes. As peças:
// - o rosto claro com os olhos azuis, o cabelo louro comprido que desce às costas e voa para o lado livre, e a franja
//   repartida;
// - o elmo: o diadema de ouro com a pedra rubra na testa, as asinhas de penas brancas e douradas nas têmporas e a crista;
// - o peitoral de prata com as gavinhas de ouro, as taças azul-aço de borda dourada e os chevrons dourados da barriga;
// - as ombreiras em camadas com os espinhos, as braçadeiras com a ponta no cotovelo e as luvas de ouro;
// - as tassetes curtas de ouro e prata em pontas, a coxa à mostra, a liga escura, a joelheira em ponta, a greva e o pé
//   de placas;
// - a capa de pelo branco aberta na frente, com o forro azul estrelado e a barra em tufos;
// - as quatro asas de gelo de cada lado, translúcidas e estreladas, que flutuam devagar.
// O pano, o cabelo e as asas voam com o vento de skin-pano.ts. A arma é o arco de skin-arco.ts. O corpo do rig fica
// escondido.

import * as THREE from 'three';
import { altura as alturaNaArte, ASAS, CABELO, CAPA, lado as ladoNaArte, MARCOS, PECAS, RAIZ_DAS_ASAS, tam } from './skin-valquiria-medidas';
import { materiaisDaValquiria, type MateriaisDaValquiria as M } from './skin-valquiria-texturas';
import type { Ossos, PecaSombria } from './sombrio-base';
import { aoLongo, Corpo, sorteio, V } from './sombrio-base';
import { eixosDoCorpo, mao, mix, pesosDoManto, suave, type Eixos } from './skin-ceifador';
import { lamina, mecha, superficie, type Anel } from './skin-pano';

type Obj = THREE.Object3D;

// ---------- a régua: da arte para o rig ----------
interface Regua {
  /** A altura do rig de uma altura da arte (y em px), por marcos. */
  y: (yArte: number) => number;
  /** Um tamanho em px da arte no rig. */
  t: (px: number) => number;
  /** O lado de um x da arte no rig (espelhado). */
  x: (xArte: number) => number;
}
function regua(c: Corpo, e: Eixos): Regua {
  const H = c.p('Head').y + 0.225 * c.u;
  const queixo = c.p('Head').y + 0.022 * c.u;
  const marcos: [number, number][] = [
    [0, 0],
    [alturaNaArte(MARCOS.joelho), c.p('calf_l').y],
    [alturaNaArte(MARCOS.virilha), c.p('thigh_l').y],
    [alturaNaArte(MARCOS.ombro), e.topo],
    [alturaNaArte(MARCOS.queixo), queixo],
    [1, queixo + (1 - alturaNaArte(MARCOS.queixo)) * H],
  ];
  return {
    y: (yArte) => {
      const f = alturaNaArte(yArte);
      for (let i = 1; i < marcos.length; i++) {
        const [a0, r0] = marcos[i - 1] as [number, number], [a1, r1] = marcos[i] as [number, number];
        if (f <= a1 || i === marcos.length - 1) return mix(r0, r1, (f - a0) / (a1 - a0));
      }
      return H;
    },
    t: (px) => tam(px) * H,
    x: (xArte) => ladoNaArte(xArte) * H,
  };
}

/** Um tubo pela lista de pontos, com um raio e um osso por ponto de controle (mistura entre eles). */
function tubo(pontos: THREE.Vector3[], raios: number[], ossos: string[], m: THREE.Material, extras: Obj[], achatar = 0.95): void {
  const curva = new THREE.CatmullRomCurve3(pontos);
  const N = 12;
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const f = (i / (N - 1)) * (raios.length - 1);
    const k = Math.min(raios.length - 2, Math.floor(f));
    const rr = mix(raios[k] as number, raios[k + 1] as number, f - k);
    aneis.push({ c: curva.getPointAt(i / (N - 1)), rx: rr, rz: rr * achatar });
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

/** Um espinho de ouro: um cone de `de` até a ponta `ate`, preso ao osso. */
function espinho(c: Corpo, de: THREE.Vector3, ate: THREE.Vector3, raio: number, m: THREE.Material, osso: string, extras: Obj[]): void {
  const cone = new THREE.Mesh(new THREE.ConeGeometry(raio, 1, 6), m);
  cone.scale.y = de.distanceTo(ate);
  aoLongo(cone, de, ate, 0.5);
  c.prender(osso, cone, extras);
}

/** O ponto do osso `a` ao osso `b` na altura `y` do rig. */
function naAltura(a: THREE.Vector3, b: THREE.Vector3, y: number): THREE.Vector3 {
  return a.clone().lerp(b, Math.min(1, Math.max(0, (a.y - y) / (a.y - b.y || 1))));
}

// ---------- o corpo: a roupa de baixo, o peitoral e as tassetes ----------
function tronco(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const N = 10;
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const y = mix(e.topo, e.bacia - 0.06 * c.u, i / (N - 1));
    // a cintura fina da arte: o tronco afina até a cintura e volta a abrir no quadril
    const cintura = 1 - 0.14 * Math.exp(-(((y - R.y(MARCOS.cintura)) / (0.08 * c.u)) ** 2));
    aneis.push({ c: V(0, y, e.zDe(y)), rx: e.rx(y) * 0.78 * cintura, rz: e.rz(y) * 0.85 * cintura });
  }
  extras.push(superficie({ aneis, colunas: 24, pesos: pesosDoManto(c, e) }, m.roupa));
  // o pescoço à mostra e o colar de ouro
  const pesc = c.p('neck_01');
  tubo([V(pesc.x, e.topo - 0.02 * c.u, pesc.z), c.p('Head').clone().add(V(0, 0.02 * c.u, -0.005 * c.u))], [0.052 * c.u, 0.046 * c.u], ['neck_01', 'Head'], m.pele, extras);
  const colar = new THREE.Mesh(new THREE.TorusGeometry(0.056 * c.u, 0.008 * c.u, 6, 24), m.ouro);
  colar.rotation.x = Math.PI / 2 - 0.35;
  colar.position.set(pesc.x, e.topo + 0.005 * c.u, pesc.z + 0.012 * c.u);
  c.prender('neck_01', colar, extras);
}

/** O peitoral: a prata da cintura ao peito, as taças de borda dourada e os chevrons de ouro da barriga. */
function peitoral(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const yCintura = R.y(MARCOS.cintura);
  const N = 11;
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const y = mix(e.topo - 0.035 * c.u, e.bacia - 0.02 * c.u, i / (N - 1));
    const cintura = 1 - 0.12 * Math.exp(-(((y - yCintura) / (0.08 * c.u)) ** 2));
    aneis.push({ c: V(0, y, e.zDe(y)), rx: e.rx(y) * 0.82 * cintura, rz: e.rz(y) * 0.9 * cintura });
  }
  // aberto atrás (lá fica a raiz das asas) e com o decote na frente, entre as taças
  extras.push(superficie({
    aneis, colunas: 26, arco: [-Math.PI * 0.35, Math.PI * 1.7],
    descer: (i, _j, a) => (i <= 1 ? 0.05 * c.u * (2 - i) / 2 * Math.exp(-(((a - Math.PI / 2) / 0.3) ** 2)) : 0),
    pesos: pesosDoManto(c, e),
  }, m.peitoral));
  // as taças: meia-esferas azul-aço achatadas, com a borda de ouro
  const raio = R.t(PECAS.taca[2] - PECAS.taca[0]) * 0.5;
  const yT = R.y((PECAS.taca[1] + PECAS.taca[3]) / 2);
  for (const s of [1, -1]) {
    const x = s * Math.abs(R.x((PECAS.taca[0] + PECAS.taca[2]) / 2)) * 1.05;
    const z = e.zDe(yT) + e.rz(yT) * 0.88 - raio * 0.15;
    const g = new THREE.Group();
    g.position.set(x, yT, z);
    g.rotation.set(0.15, s * 0.32, 0);
    const casca = new THREE.Mesh(new THREE.SphereGeometry(raio, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), m.taca);
    casca.rotation.x = Math.PI / 2;
    casca.scale.set(1, 0.55, 0.92);
    g.add(casca);
    const borda = new THREE.Mesh(new THREE.TorusGeometry(raio * 0.98, raio * 0.12, 6, 24), m.ouro);
    borda.scale.set(1, 0.95, 1);
    g.add(borda);
    c.prender('spine_03', g, extras);
  }
  // os chevrons de ouro da barriga: três vês que descem do peito até o quadril, colados no peitoral
  const barriga = PECAS.barriga;
  for (let k = 0; k < 3; k++) {
    const yMeio = R.y(mix(barriga[1], barriga[3], (k + 0.6) / 3)), yLado = yMeio + 0.05 * c.u;
    const largura = R.t(barriga[2] - barriga[0]) * (0.75 - k * 0.12);
    const pts = [-1, -0.5, 0, 0.5, 1].map((s) => {
      const y = mix(yMeio, yLado, Math.abs(s));
      const a = Math.PI / 2 - s * (largura / (e.rx(y) * 0.82));
      return V(Math.cos(a) * e.rx(y) * 0.84, y, e.zDe(y) + Math.sin(a) * e.rz(y) * 0.93);
    });
    const fio = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), 16, 0.011 * c.u, 5, false), k === 1 ? m.ouroEscuro : m.ouro);
    c.prender(k === 2 ? 'spine_01' : 'spine_02', fio, extras);
  }
  // o cinto de ouro no quadril
  const cinto = new THREE.Mesh(new THREE.TorusGeometry(1, 0.014 * c.u, 6, 36), m.ouro);
  cinto.rotation.x = Math.PI / 2;
  cinto.scale.set(e.rx(e.bacia) * 0.86, e.rz(e.bacia) * 0.92, 1);
  cinto.position.set(0, e.bacia + 0.03 * c.u, e.zDe(e.bacia));
  c.prender('pelvis', cinto, extras);
}

/** As tassetes: as placas de prata e, por cima, as de ouro mais compridas, abrindo em pontas sobre o quadril. */
function tassetes(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const y0 = e.bacia + 0.03 * c.u, y1 = e.bacia - R.t(PECAS.tassetes[3] - PECAS.tassetes[1]) * 0.85;
  for (const [mat, comprido, giro, folga] of [[m.placa, 1, 0.31, 1.0], [m.ouro, 0.7, 0, 1.06]] as const) {
    const N = 6;
    const aneis: Anel[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const y = mix(y0, mix(y0, y1, comprido), t);
      const r = (1.02 + t * 0.32) * folga;
      aneis.push({ c: V(0, y, e.zDe(e.bacia) + 0.01 * c.u), rx: e.rx(e.bacia) * 0.86 * r, rz: e.rz(e.bacia) * 0.95 * r });
    }
    extras.push(superficie({
      aneis, colunas: 40, arco: [-0.45, Math.PI + 0.9],
      // as pontas: cinco placas por cima, cada uma descendo em ponta no meio
      descer: (i, _j, a) => (Math.pow(1 - Math.abs(Math.sin((a + giro) * 2.5)), 2) - 0.6) * 0.08 * c.u * (i / (N - 1)) * comprido,
      pesos: pesosDoManto(c, e),
    }, mat));
  }
}

// ---------- os braços ----------
function bracos(c: Corpo, R: Regua, m: M, extras: Obj[]): void {
  const rBraco = R.t(PECAS.bracadeira[2] - PECAS.bracadeira[0]) * 0.36;
  for (const lado of ['l', 'r'] as const) {
    const ombro = c.p(`upperarm_${lado}`), cot = c.p(`lowerarm_${lado}`), pulso = c.p(`hand_${lado}`);
    const fora = lado === 'l' ? 1 : -1;
    tubo([ombro.clone().add(V(0, 0.03 * c.u, 0)), ombro.clone().lerp(cot, 0.5), cot, cot.clone().lerp(pulso, 0.5), pulso],
      [rBraco * 1.25, rBraco * 1.05, rBraco * 0.95, rBraco * 0.85, rBraco * 0.75],
      [`upperarm_${lado}`, `upperarm_${lado}`, `lowerarm_${lado}`, `lowerarm_${lado}`, `hand_${lado}`], m.roupa, extras);
    // a braçadeira: do cotovelo ao pulso, abrindo na boca, com a ponta para trás do cotovelo
    const b0 = cot.clone().lerp(pulso, 0.05), b1 = pulso.clone().lerp(cot, 0.02);
    tubo([b0, b0.clone().lerp(b1, 0.5), b1], [rBraco * 1.35, rBraco * 1.2, rBraco * 1.45], [`lowerarm_${lado}`, `lowerarm_${lado}`, `lowerarm_${lado}`], m.placa, extras);
    const eixo = pulso.clone().sub(cot).normalize();
    espinho(c, cot.clone().addScaledVector(eixo, 0.04 * c.u), cot.clone().addScaledVector(eixo, -0.07 * c.u).add(V(fora * 0.03 * c.u, 0.01 * c.u, -0.03 * c.u)), rBraco * 0.55, m.ouro, `lowerarm_${lado}`, extras);
    for (const t of [0.35, 0.7]) {
      const p = cot.clone().lerp(pulso, t);
      const aro = new THREE.Mesh(new THREE.TorusGeometry(rBraco * (1.24 + t * 0.15), rBraco * 0.12, 5, 18), m.ouro);
      aro.position.copy(p);
      aro.quaternion.setFromUnitVectors(V(0, 0, 1), eixo);
      c.prender(`lowerarm_${lado}`, aro, extras);
    }
    // a luva de ouro
    mao(c, lado, { osso: m.ouro }, extras, 2.3);
    const dedos = c.p(`middle_01_${lado}`);
    const dorso = new THREE.Mesh(new THREE.BoxGeometry(rBraco * 1.7, 1, rBraco * 0.7), m.ouro);
    dorso.scale.y = pulso.distanceTo(dedos) * 1.05;
    aoLongo(dorso, pulso, dedos, 0.5);
    c.prender(`hand_${lado}`, dorso, extras);
  }
}

/** As ombreiras: três cascas sobrepostas (prata, ouro, prata) que descem pelo braço, e os espinhos para cima e para fora. */
function ombreiras(c: Corpo, R: Regua, m: M, extras: Obj[]): void {
  const raio = R.t(PECAS.ombreira[2] - PECAS.ombreira[0]) * 0.55;
  const esp = R.t(PECAS.espinhoDaOmbreira[3] - PECAS.espinhoDaOmbreira[1]);
  for (const lado of ['l', 'r'] as const) {
    const ombro = c.p(`upperarm_${lado}`), cot = c.p(`lowerarm_${lado}`);
    const fora = lado === 'l' ? 1 : -1;
    const eixo = cot.clone().sub(ombro).normalize();
    for (let k = 0; k < 3; k++) {
      const casca = new THREE.Mesh(new THREE.SphereGeometry(raio * (1 - k * 0.1), 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), k === 1 ? m.ouro : m.placa);
      casca.scale.set(1, 0.75, 0.95);
      const p = ombro.clone().addScaledVector(eixo, raio * (0.05 + k * 0.42)).add(V(fora * 0.01 * c.u, raio * 0.15, 0));
      casca.position.copy(p);
      casca.quaternion.setFromUnitVectors(V(0, 1, 0), V(fora * 0.55, 1, 0).normalize());
      c.prender(`upperarm_${lado}`, casca, extras);
    }
    const topo = ombro.clone().add(V(fora * raio * 0.25, raio * 0.6, 0));
    espinho(c, topo, topo.clone().add(V(fora * esp * 0.35, esp, -esp * 0.1)), raio * 0.18, m.ouro, `upperarm_${lado}`, extras);
    const lateral = ombro.clone().add(V(fora * raio * 0.75, raio * 0.25, 0.01 * c.u));
    espinho(c, lateral, lateral.clone().add(V(fora * esp * 0.8, esp * 0.45, -esp * 0.15)), raio * 0.15, m.ouro, `upperarm_${lado}`, extras);
    const tras = ombro.clone().add(V(fora * raio * 0.35, raio * 0.45, -raio * 0.55));
    espinho(c, tras, tras.clone().add(V(fora * esp * 0.4, esp * 0.6, -esp * 0.45)), raio * 0.14, m.ouroEscuro, `upperarm_${lado}`, extras);
  }
}

// ---------- as pernas ----------
function pernas(c: Corpo, R: Regua, m: M, extras: Obj[]): void {
  const largura = (k: readonly [number, number, number, number]) => R.t(k[2] - k[0]);
  const rCoxa = largura(PECAS.coxa) * 0.27, rCanela = largura(PECAS.greva) * 0.34, rPe = largura(PECAS.pe) * 0.4;
  const yLiga = R.y(PECAS.coxa[3]), yGreva = R.y(PECAS.joelheira[1]);
  for (const lado of ['l', 'r'] as const) {
    const quadril = c.p(`thigh_${lado}`), joelho = c.p(`calf_${lado}`), tornozelo = c.p(`foot_${lado}`), bola = c.p(`ball_${lado}`);
    // a coxa à mostra até a liga escura
    const liga = naAltura(quadril, joelho, yLiga);
    tubo([quadril.clone().add(V(0, 0.04 * c.u, 0)), quadril.clone().lerp(liga, 0.5), liga], [rCoxa * 1.05, rCoxa, rCoxa * 0.92], [`thigh_${lado}`, `thigh_${lado}`, `thigh_${lado}`], m.pele, extras);
    const fimDaLiga = naAltura(quadril, joelho, yLiga - 0.035 * c.u);
    tubo([liga.clone().add(V(0, 0.01 * c.u, 0)), fimDaLiga], [rCoxa * 0.98, rCoxa * 0.95], [`thigh_${lado}`, `thigh_${lado}`], m.liga, extras);
    // a perna de prata: da liga ao tornozelo, com a greva que alarga na canela
    const inicio = naAltura(quadril, joelho, yGreva);
    tubo([fimDaLiga, inicio, joelho, joelho.clone().lerp(tornozelo, 0.45), tornozelo],
      [rCoxa * 0.94, rCoxa * 0.86, rCanela * 1.08, rCanela * 1.05, rCanela * 0.78],
      [`thigh_${lado}`, `thigh_${lado}`, `calf_${lado}`, `calf_${lado}`, `foot_${lado}`], m.placa, extras);
    // a joelheira de ouro em ponta para cima e para baixo, e as aletas dos lados
    const frente = V(0, 0, 1);
    const yj = R.y((PECAS.joelheira[1] + PECAS.joelheira[3]) / 2);
    const pj = naAltura(quadril, tornozelo, yj).add(frente.clone().multiplyScalar(rCanela * 1.05));
    const altoJ = R.t(PECAS.joelheira[3] - PECAS.joelheira[1]);
    for (const s of [1, -1]) {
      espinho(c, pj, pj.clone().add(V(0, s * altoJ * 0.55, s > 0 ? -0.004 * c.u : 0.008 * c.u)), rCanela * 0.75, m.ouro, `calf_${lado}`, extras);
      espinho(c, pj.clone().add(V(s * rCanela * 0.6, 0.01 * c.u, -rCanela * 0.4)), pj.clone().add(V(s * rCanela * 1.6, altoJ * 0.25, -rCanela * 0.9)), rCanela * 0.3, m.ouroEscuro, `calf_${lado}`, extras);
    }
    // as tiras de ouro da greva
    for (const t of [0.3, 0.65]) {
      const p = joelho.clone().lerp(tornozelo, t);
      const aro = new THREE.Mesh(new THREE.TorusGeometry(rCanela * (1.12 - t * 0.2), rCanela * 0.1, 5, 18), m.ouro);
      aro.position.copy(p);
      aro.quaternion.setFromUnitVectors(V(0, 0, 1), tornozelo.clone().sub(joelho).normalize());
      c.prender(`calf_${lado}`, aro, extras);
    }
    // o pé de placas em ponta, de ouro
    const ponta = bola.clone().add(bola.clone().sub(tornozelo).setY(0).normalize().multiplyScalar(rPe * 1.6)).setY(0.01 * c.u);
    tubo([tornozelo.clone().add(V(0, 0.03 * c.u, 0)), tornozelo.clone().lerp(bola, 0.5).setY(0.04 * c.u), bola.clone().setY(0.03 * c.u), ponta],
      [rPe * 1.05, rPe * 0.95, rPe * 0.7, rPe * 0.1], [`foot_${lado}`, `foot_${lado}`, `ball_${lado}`, `ball_${lado}`], m.ouro, extras, 0.8);
  }
}

// ---------- a capa de pelo ----------
/**
 * A capa de pelo: da cintura de trás até a barra (CAPA), aberta na frente num leque de 240° (os lados e as costas),
 * com o pelo branco por fora e o forro azul de gelo por dentro. A barra se desfaz em tufos (o recorte do material).
 */
function capa(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const yCima = R.y(CAPA.cintura), yBarra = R.y(CAPA.barra);
  const N = 12, LEQUE = (Math.PI * 4) / 3, a0 = Math.PI / 2 + LEQUE / 4;
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const y = mix(yCima, yBarra, t);
    const r = R.t(mix(CAPA.larguraEmCima, CAPA.larguraEmbaixo, Math.pow(t, 0.8))) / 2;
    aneis.push({ c: V(0, y, e.zDe(e.bacia) - 0.03 * c.u - t * 0.05 * c.u), rx: r, rz: r * 0.8 });
  }
  const opcoes = {
    aneis, colunas: 44, arco: [a0, LEQUE] as const,
    ruga: (i: number, _j: number, a: number) => 1 + Math.sin(a * 8 + i * 0.4) * 0.05 * (i / (N - 1)),
    solto: (i: number) => Math.pow(i / (N - 1), 1.2) * 0.95,
    pesos: pesosDoManto(c, e),
  };
  // a face de trás da malha fica para fora (o pelo) e a da frente, para o corpo (o forro)
  const fora = superficie(opcoes, m.pelo);
  (fora.material as THREE.MeshStandardMaterial).side = THREE.BackSide;
  const dentro = superficie(opcoes, m.forro);
  (dentro.material as THREE.MeshStandardMaterial).side = THREE.FrontSide;
  extras.push(fora, dentro);
}

// ---------- as asas de gelo ----------
/** O quanto as asas encolhem em relação à arte (no jogo, a envergadura inteira passaria do quadrinho). */
const ASAS_MENORES = 0.82;

function asas(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const s3 = c.p('spine_03');
  const raiz = V(0, R.y(RAIZ_DAS_ASAS[1]), s3.z - e.rz(s3.y) * 0.75);
  for (const s of [1, -1]) {
    ASAS.forEach((asa, k) => {
      // cada ponto da arte: o lado (espelhado para o outro lado), a altura e o recuo para trás (as asas abrem para as costas)
      const ponto = ([x, y]: readonly [number, number]) => {
        const p = V(s * Math.abs(R.x(x)), R.y(y), raiz.z);
        p.sub(raiz).multiplyScalar(ASAS_MENORES).add(raiz);
        p.z -= Math.abs(p.x) * (0.55 + k * 0.08) + 0.02 * c.u;
        return p;
      };
      extras.push(lamina({
        estacoes: asa.map(([i, o]) => ({ i: ponto(i), o: ponto(o) })),
        colunas: 6,
        barriga: 0.06,
        dobra: (t, u) => V(0, 0, Math.sin(u * Math.PI) * 0.012 * c.u * t),
        solto: (t) => Math.pow(t, 1.3) * 0.55,
        pesos: () => ['spine_03', 'spine_03', 1],
      }, m.asa));
    });
  }
}

// ---------- a cabeça, o cabelo e o elmo ----------
interface Cabeca { centro: THREE.Vector3; raio: number }
/** A cabeça: o crânio de cabelo, o rosto claro na frente com os olhos azuis e a boca. */
function cabeca(c: Corpo, R: Regua, m: M, extras: Obj[]): Cabeca {
  const cab = c.p('Head');
  const raio = R.t(PECAS.cabeca[2] - PECAS.cabeca[0]) * 0.5;
  const centro = V(cab.x, (R.y(MARCOS.queixo) + R.y(PECAS.cabeca[1])) / 2 - 0.03 * c.u, cab.z + 0.012 * c.u);
  const g = new THREE.Group();
  g.position.copy(centro);
  const cranio = new THREE.Mesh(new THREE.SphereGeometry(raio, 28, 18), m.cranio);
  cranio.scale.set(0.9, 1.08, 1);
  g.add(cranio);
  // o rosto: a frente da esfera, um pouco maior, do alto da testa ao queixo
  const rosto = new THREE.Mesh(new THREE.SphereGeometry(raio * 1.01, 28, 16, Math.PI / 2 - 0.95, 1.9, Math.PI / 2 - 0.55, Math.PI / 2 + 0.55), m.pele);
  rosto.scale.copy(cranio.scale);
  g.add(rosto);
  const naFrente = (lado: number, el: number, d = 1.02) => V(Math.sin(lado) * Math.cos(el) * 0.9, Math.sin(el) * 1.08, Math.cos(lado) * Math.cos(el)).multiplyScalar(raio * d);
  const elOlho = Math.asin((R.y(MARCOS.olhos) - centro.y) / (raio * 1.08));
  for (const s of [1, -1]) {
    const olho = new THREE.Mesh(new THREE.SphereGeometry(raio * 0.1, 10, 8), m.olho);
    olho.scale.set(1.3, 0.75, 0.3);
    olho.position.copy(naFrente(s * 0.36, elOlho));
    olho.lookAt(olho.position.clone().multiplyScalar(2));
    g.add(olho);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(raio * 0.06, 8, 6), m.iris);
    iris.scale.set(1, 1, 0.3);
    iris.position.copy(naFrente(s * 0.36, elOlho, 1.045));
    g.add(iris);
  }
  const boca = new THREE.Mesh(new THREE.BoxGeometry(raio * 0.22, raio * 0.04, raio * 0.04), m.boca);
  boca.position.copy(naFrente(0, elOlho - 0.62, 1.0));
  g.add(boca);
  c.prender('Head', g, extras);
  return { centro, raio };
}

/** Um caminho de mecha: da raiz à ponta, ondulando, com a ponta caindo (`queda`). */
function caminho(raiz: THREE.Vector3, ponta: THREE.Vector3, onda: number, fase: number, queda: number): THREE.Vector3[] {
  return Array.from({ length: 9 }, (_, k) => {
    const t = k / 8;
    return raiz.clone().lerp(ponta, t).add(V(Math.sin(t * Math.PI * 1.4 + fase) * onda * t, -queda * t * t, Math.cos(t * Math.PI * 1.2 + fase) * onda * 0.5 * t));
  });
}

/**
 * O cabelo louro: a franja repartida que emoldura o rosto, as mechas que caem nos ombros pela frente, a cascata das
 * costas até o meio do corpo e as que voam para o lado livre (+x), como na arte.
 */
function cabelo(c: Corpo, e: Eixos, R: Regua, m: M, h: Cabeca, extras: Obj[]): void {
  const r = sorteio(1501);
  const { centro, raio } = h;
  const naEsfera = (az: number, el: number, d = 1) => centro.clone().add(V(Math.sin(az) * Math.cos(el) * 0.9, Math.sin(el) * 1.08, Math.cos(az) * Math.cos(el)).multiplyScalar(raio * d));
  // a franja: da risca no alto, para os dois lados, cobrindo a testa e descendo pelas têmporas
  for (let i = 0; i < 70; i++) {
    const s = i % 2 === 0 ? 1 : -1;
    const az0 = s * (0.05 + r() * 0.12), el0 = 1.0 + r() * 0.2;
    const ate = r();
    const az1 = s * mix(0.35, 1.25, ate), el1 = mix(0.42, -0.35, Math.pow(ate, 1.3)) + (r() - 0.5) * 0.1;
    const pts = Array.from({ length: 9 }, (_, k) => {
      const t = k / 8;
      return naEsfera(mix(az0, az1, Math.pow(t, 0.75)), mix(el0, el1, Math.pow(t, 1.5)), 1.03 + 0.06 * t);
    });
    extras.push(mecha(pts, R.t(22 + r() * 10), R.t(5), 'Head', m.cabelo, 0.3, pts[4]?.clone().sub(centro).normalize() ?? V(0, 1, 0)));
  }
  // a franja da testa: da risca, em arco, até um pouco acima dos olhos, mais curta no meio
  const elOlhos = Math.asin(Math.max(-1, Math.min(1, (R.y(MARCOS.olhos) - centro.y) / (raio * 1.08))));
  for (let i = 0; i < 36; i++) {
    const s = i % 2 === 0 ? 1 : -1, t0 = r();
    const az0 = s * (0.04 + r() * 0.08), az1 = s * mix(0.08, 0.75, t0);
    const el1 = elOlhos + mix(0.32, 0.12, t0) + (r() - 0.5) * 0.06;
    const pts = Array.from({ length: 8 }, (_, k) => {
      const t = k / 7;
      return naEsfera(mix(az0, az1, Math.pow(t, 0.9)), mix(1.15, el1, Math.pow(t, 0.8)), 1.04 + 0.04 * Math.sin(t * Math.PI));
    });
    extras.push(mecha(pts, R.t(18 + r() * 8), R.t(4), 'Head', m.cabelo, 0.2, pts[4]?.clone().sub(centro).normalize() ?? V(0, 1, 0)));
  }
  // a capa de mechas sobre o crânio, penteada da risca para trás
  for (let i = 0; i < 120; i++) {
    const az = (r() - 0.5) * Math.PI * 1.7 + Math.PI, el = 0.1 + r() * 1.35;
    const de = naEsfera(az * 0.2 * (r() < 0.5 ? 1 : -1), 1.25, 1.0);
    const para = naEsfera(az, el - 0.5, 1.06);
    extras.push(mecha(caminho(de, para, 0.004 * c.u, r() * 6, 0.004 * c.u), R.t(26), R.t(6), 'Head', m.cabelo, 0.25, para.clone().sub(centro).normalize()));
  }
  // as mechas da frente: das têmporas pelos ombros até o peito
  const yPeito = R.y(MARCOS.peito);
  for (let i = 0; i < 16; i++) {
    const s = i % 2 === 0 ? 1 : -1;
    const raiz = naEsfera(s * (1.2 + r() * 0.3), 0.1 + r() * 0.3, 1.02);
    const ponta = V(s * (e.rx(yPeito) * (0.55 + r() * 0.3)), yPeito - r() * 0.06 * c.u, e.zDe(yPeito) + e.rz(yPeito) * 0.7);
    extras.push(mecha(caminho(raiz, ponta, 0.012 * c.u, r() * 6, 0.01 * c.u), R.t(30), R.t(8), 'Head', m.cabelo, 0.9, V(s, 0, 0.6).normalize()));
  }
  // a cascata das costas e as que voam para o lado livre (+x)
  const yCostas = R.y(CABELO.costas);
  for (let i = 0; i < 90; i++) {
    const az = Math.PI + (r() - 0.5) * 2.4, el = -0.2 + r() * 0.9;
    const raiz = naEsfera(az, el, 0.98);
    const livre = r() < 0.4;
    const ponta = livre
      ? V(R.x(mix(CABELO.pontas.x0, CABELO.pontas.x1, r())) * 0.9, R.y(mix(CABELO.pontas.y0, CABELO.pontas.y1, r())), centro.z - raio * (0.6 + r() * 0.8))
      : V(Math.sin(az) * raio * (0.8 + r() * 1.4), mix(yCostas, R.y(MARCOS.ombro), r() * 0.45), centro.z - raio * (1.2 + r() * 0.6));
    const grossa = r() < 0.55;
    extras.push(mecha(caminho(raiz, ponta, (0.015 + r() * 0.025) * c.u, r() * 6, (0.02 + r() * 0.04) * c.u),
      R.t(grossa ? 34 : 20), R.t(grossa ? 9 : 5), 'Head', m.cabelo, 0.8 + r() * 0.4, V(0, 0, -1)));
  }
}

/** O elmo: o diadema de ouro na testa com a pedra rubra, a ponta do meio, a crista e as asinhas de penas das têmporas. */
function elmo(c: Corpo, R: Regua, m: M, h: Cabeca, extras: Obj[]): void {
  const { centro, raio } = h;
  const g = new THREE.Group();
  g.position.copy(centro);
  const yTesta = R.y(MARCOS.testa) - centro.y;
  // o diadema: a faixa em arco na frente e nos lados, sobre a franja
  const faixa = new THREE.Mesh(new THREE.TorusGeometry(raio * 1.08, raio * 0.07, 6, 30, Math.PI * 1.25), m.ouro);
  // o arco do toro começa em +x; girado para o plano do chão, a frente (+z) é o meio dele, e a frente desce um pouco
  faixa.rotation.set(Math.PI / 2 + 0.2, 0, -Math.PI * 0.125);
  faixa.scale.set(0.92, 1, 1);
  faixa.position.set(0, yTesta + raio * 0.08, 0);
  g.add(faixa);
  // a placa do meio, em ponta para baixo sobre a testa, e a pedra rubra
  const frente = V(0, yTesta + raio * 0.02, raio * 1.06);
  const placa = new THREE.Mesh(new THREE.ConeGeometry(raio * 0.2, raio * 0.5, 4), m.ouro);
  placa.position.copy(frente).add(V(0, raio * 0.05, 0));
  placa.rotation.set(Math.PI + 0.2, Math.PI / 4, 0);
  placa.scale.set(1, 1, 0.35);
  g.add(placa);
  const pedra = new THREE.Mesh(new THREE.SphereGeometry(R.t(PECAS.pedra[2] - PECAS.pedra[0]) * 0.45, 12, 10), m.pedra);
  pedra.scale.set(0.8, 1.1, 0.6);
  pedra.position.copy(frente).add(V(0, raio * 0.12, raio * 0.06));
  g.add(pedra);
  // a crista: a lâmina de ouro que sobe da testa e corre por cima da cabeça
  const crista = new THREE.Mesh(new THREE.ConeGeometry(raio * 0.16, raio * 0.75, 4), m.ouro);
  crista.position.set(0, raio * 1.05, raio * 0.45);
  crista.rotation.set(-0.5, Math.PI / 4, 0);
  crista.scale.set(1, 1, 0.3);
  g.add(crista);
  // as asinhas das têmporas: cinco penas em leque, as de fora de ouro e as de dentro brancas, para cima e para trás
  const comp = R.t(PECAS.asaDoElmo[3] - PECAS.asaDoElmo[1]);
  for (const s of [1, -1]) {
    const base = V(s * raio * 0.95, yTesta + raio * 0.2, -raio * 0.05);
    for (let k = 0; k < 6; k++) {
      const ouro = k >= 4, l = comp * (ouro ? 0.55 : 1 - k * 0.12);
      const pena = new THREE.Mesh(new THREE.ConeGeometry(raio * (ouro ? 0.16 : 0.24), l, 4), ouro ? m.ouro : m.penas);
      pena.geometry.translate(0, l / 2, 0);
      pena.position.copy(base).add(V(s * k * 0.003 * c.u, -k * 0.006 * c.u, -k * 0.01 * c.u));
      pena.rotation.set(-0.25 - (ouro ? (k - 4) * 0.5 : k * 0.28), 0, -s * (ouro ? 0.15 : 0.38 + k * 0.1));
      pena.scale.set(1, 1, 0.22);
      g.add(pena);
    }
  }
  c.prender('Head', g, extras);
}

/** A veste inteira da skin; o palco esconde o corpo do rig (`esconder`) e põe o arco na mão direita. */
export function vesteDaValquiria(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const e = eixosDoCorpo(c);
  const R = regua(c, e);
  const m = materiaisDaValquiria();
  const extras: Obj[] = [];
  tronco(c, e, R, m, extras);
  peitoral(c, e, R, m, extras);
  tassetes(c, e, R, m, extras);
  bracos(c, R, m, extras);
  ombreiras(c, R, m, extras);
  pernas(c, R, m, extras);
  capa(c, e, R, m, extras);
  asas(c, e, R, m, extras);
  const h = cabeca(c, R, m, extras);
  cabelo(c, e, R, m, h, extras);
  elmo(c, R, m, h, extras);
  return { extras, esconder: '.' };
}
