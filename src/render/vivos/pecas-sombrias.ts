// As peças sombrias de uso geral (04/11/2026, marco 37): os membros e a capa que eram só do guerreiro, agora com o
// material de cada classe, e as partes dos outros arquétipos: a saia da veste (presa nas coxas, balança no passo), o
// capuz pontudo de feiticeiro com o rosto na sombra, as máscaras (pano, osso, bico), o chapéu de aba larga, a coroa,
// os cristais de feitiço em volta da cabeça, a galhada, a aljava, a bandoleira, as costelas de osso, a gola alta e a
// estola. Tudo em metros do esqueleto, nos ossos da Quaternius (Corpo em sombrio-base.ts).

import * as THREE from 'three';
import { anel, aoLongo, caixa, chifre, Corpo, esfera, grupoEm, nivelDe, seg, torno, V } from './sombrio-base';

type Mat = THREE.Material;
type Saida = THREE.Object3D[];

// ---------- membros ----------
/** Os materiais dos membros: o leve (nível 0), as placas (1 e 2), as juntas, as luvas e a borda. */
export interface LigaDosMembros {
  leve: Mat;
  placa: Mat;
  junta: Mat;
  luva: readonly [Mat, Mat];
  borda: Mat;
  /** O feiticeiro não usa cotoveleira nem asa no joelho: só couro e pano. */
  semJuntas?: boolean;
}

export function membros(c: Corpo, peca: 'maos' | 'pernas' | 'pes', grau: number, l: LigaDosMembros): Saida {
  const saida: Saida = [];
  const nivel = nivelDe(grau);
  for (const lado of ['l', 'r'] as const) {
    const sx = lado === 'l' ? 1 : -1;
    if (peca === 'maos') {
      const ombro = c.p(`upperarm_${lado}`), cot = c.p(`lowerarm_${lado}`), mao = c.p(`hand_${lado}`), dedo = c.p(`middle_01_${lado}`);
      const ante = torno(nivel === 0 ? [[0.045, -0.5], [0.05, 0], [0.052, 0.5]] : [[0.042, -0.5], [0.054, 0.1], [0.062, 0.45], [0.066, 0.5]], nivel === 0 ? l.leve : l.placa, 24);
      ante.scale.set(c.u, mao.distanceTo(cot) * (nivel === 0 ? 0.6 : 0.92), c.u);
      c.prender(`lowerarm_${lado}`, aoLongo(ante, cot, mao, nivel === 0 ? 0.62 : 0.5), saida);
      if (nivel >= 1) {
        if (!l.semJuntas) {
          const cotovelo = new THREE.Mesh(esfera(0.058, 20, 10, 0, Math.PI * 2, 0, 1.6), l.junta);
          cotovelo.scale.setScalar(c.u);
          aoLongo(cotovelo, ombro, cot, 1);
          cotovelo.rotateX(-Math.PI / 2);
          c.prender(`upperarm_${lado}`, cotovelo, saida);
        }
        const luva = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.1, 0.05), l.luva[nivel === 2 ? 1 : 0]);
        luva.scale.setScalar(c.u);
        c.prender(`hand_${lado}`, aoLongo(luva, mao, dedo.clone().addScaledVector(dedo.clone().sub(mao), 0.6), 0.5), saida);
      }
      if (nivel === 2) {
        if (!l.semJuntas) {
          const braco = torno([[0.058, -0.5], [0.064, 0], [0.06, 0.5]], l.placa, 24);
          braco.scale.set(c.u, cot.distanceTo(ombro) * 0.7, c.u);
          c.prender(`upperarm_${lado}`, aoLongo(braco, ombro, cot, 0.58), saida);
        }
        const punho = anel(0.064, 0.007, l.borda);
        punho.scale.setScalar(c.u);
        aoLongo(punho, cot, mao, 0.96);
        punho.rotateX(Math.PI / 2);
        c.prender(`lowerarm_${lado}`, punho, saida);
      }
    } else if (peca === 'pernas') {
      const coxa = c.p(`thigh_${lado}`), joelho = c.p(`calf_${lado}`);
      if (nivel >= 1 && !l.semJuntas) {
        const joelheira = new THREE.Mesh(esfera(0.068, 20, 10, 0, Math.PI * 2, 0, 1.5), l.junta);
        joelheira.scale.set(c.u, c.u, c.u * 0.7);
        joelheira.position.copy(joelho).add(V(0, 0, 0.035 * c.u));
        joelheira.rotation.x = Math.PI / 2;
        c.prender(`thigh_${lado}`, joelheira, saida);
      }
      if (nivel === 0) {
        const tira = torno([[0.085, -0.5], [0.09, 0.5]], l.leve, 20, Math.PI, -Math.PI / 2);
        tira.scale.set(c.u, joelho.distanceTo(coxa) * 0.35, c.u);
        c.prender(`thigh_${lado}`, aoLongo(tira, coxa, joelho, 0.75), saida);
      } else {
        const coxote = torno([[0.08, -0.5], [0.088, 0], [0.095, 0.5]], l.placa, 28, nivel === 2 ? Math.PI * 2 : Math.PI, nivel === 2 ? 0 : -Math.PI / 2);
        coxote.scale.set(c.u, joelho.distanceTo(coxa) * (nivel === 2 ? 0.62 : 0.45), c.u * 0.95);
        c.prender(`thigh_${lado}`, aoLongo(coxote, coxa, joelho, nivel === 2 ? 0.6 : 0.7), saida);
      }
      if (nivel === 2 && !l.semJuntas) {
        const asa = new THREE.Mesh(esfera(0.05, 16, 8, 0, Math.PI, 0, Math.PI), l.borda);
        asa.scale.set(0.5 * c.u, c.u, 0.25 * c.u);
        asa.position.copy(joelho).add(V(sx * 0.055 * c.u, 0, 0.02 * c.u));
        asa.rotation.y = sx * Math.PI / 2;
        c.prender(`thigh_${lado}`, asa, saida);
        const tasset = torno([[0.105, 0.5], [0.118, -0.5]], l.placa, 20, Math.PI * 0.55, -Math.PI * 0.275);
        tasset.scale.set(c.u, 0.2 * c.u, c.u);
        aoLongo(tasset, coxa, joelho, 0.22);
        c.prender(`thigh_${lado}`, tasset, saida);
      }
    } else {
      const joelho = c.p(`calf_${lado}`), pe = c.p(`foot_${lado}`), bola = c.p(`ball_${lado}`);
      const greva = torno(nivel === 0 ? [[0.06, -0.5], [0.064, 0.5]] : [[0.05, -0.5], [0.066, -0.1], [0.07, 0.3], [0.064, 0.5]], nivel === 0 ? l.leve : l.placa, 24);
      greva.scale.set(c.u, pe.distanceTo(joelho) * (nivel === 0 ? 0.35 : 0.86), c.u);
      c.prender(`calf_${lado}`, aoLongo(greva, joelho, pe, nivel === 0 ? 0.65 : 0.52), saida);
      if (nivel >= 1) {
        // a fivela (ou o reforço) no alto do cano
        const aro = anel(0.068, 0.006, l.borda);
        aro.scale.setScalar(c.u);
        aoLongo(aro, joelho, pe, nivel === 2 ? 0.12 : 0.18);
        aro.rotateX(Math.PI / 2);
        c.prender(`calf_${lado}`, aro, saida);
      }
      if (nivel === 2) {
        const sapato = new THREE.Mesh(esfera(0.068, 20, 10), l.placa);
        sapato.scale.set(0.95 * c.u, 0.75 * c.u, 2.3 * c.u);
        sapato.position.copy(pe).lerp(bola, 0.55).add(V(0, -0.015 * c.u, 0));
        sapato.lookAt(bola.clone().add(bola.clone().sub(pe)));
        c.prender(`foot_${lado}`, sapato, saida);
      }
    }
  }
  return saida;
}

// ---------- capa ----------
export interface LigaDaCapa {
  /** O pano de cada nível (curta, média e longa). */
  panos: readonly [Mat, Mat, Mat];
  /** O forro da capa longa (null: sem forro). */
  forro: Mat | null;
  fecho: Mat;
  /** A gola do grau 5: pele (o guerreiro), alta e dura (o feiticeiro) ou penas (o necromante). */
  gola: { tipo: 'pele' | 'alta' | 'penas'; m: Mat } | null;
  /** O comprimento de cada nível (m) e a largura da barra. */
  comprimentos?: readonly [number, number, number];
  /** O capuz caído nas costas (o andarilho, o caçador). */
  capuzCaido?: Mat;
}

export function capa(c: Corpo, grau: number, l: LigaDaCapa): Saida {
  const saida: Saida = [];
  const nivel = nivelDe(grau);
  const s3 = c.p('spine_03');
  const comprimentos: readonly number[] = l.comprimentos ?? [0.62, 1.0, 1.42];
  const comprimento = comprimentos[nivel] ?? 1;
  const baixo = [0.24, 0.29, 0.33][nivel] ?? 0.3;
  const geo = new THREE.CylinderGeometry(0.19, baixo, comprimento, seg(40), seg(24, 4), true, -Math.PI * 0.6, Math.PI * 1.2);
  const cp = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < cp.count; i++) {
    const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i);
    const ang = Math.atan2(x, z);
    const dobra = Math.sin(ang * 7) * 0.02 * (comprimento / 2 - y) / comprimento;
    cp.setXYZ(i, x + Math.sin(ang) * dobra, y, z + Math.cos(ang) * dobra);
  }
  geo.computeVertexNormals();
  const g = grupoEm(c, s3);
  const tecido = l.panos[nivel];
  const corpo = new THREE.Mesh(geo, tecido);
  corpo.rotation.y = Math.PI;
  corpo.position.set(0, 0.1 - comprimento / 2, -0.04);
  g.add(corpo);
  if (nivel === 2 && l.forro) {
    const forro = new THREE.Mesh(geo.clone().scale(0.985, 1, 0.985), l.forro);
    forro.rotation.y = Math.PI;
    forro.position.copy(corpo.position);
    g.add(forro);
  }
  if (l.capuzCaido) {
    const capuz = new THREE.Mesh(esfera(0.12, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), l.capuzCaido);
    capuz.scale.set(1.1, 0.55, 0.9);
    capuz.rotation.x = -2.2;
    capuz.position.set(0, 0.1, -0.13);
    g.add(capuz);
  }
  if (grau % 2 === 1 || grau >= 4) {
    for (const sx of [-1, 1]) {
      const fecho = new THREE.Mesh(esfera(0.02, 12, 8), l.fecho);
      fecho.position.set(sx * 0.12, 0.09, 0.09);
      g.add(fecho);
    }
  }
  if (grau >= 5 && l.gola) {
    if (l.gola.tipo === 'alta') {
      const gola = torno([[0.15, -0.5], [0.16, 0], [0.2, 0.5]], l.gola.m, 32, Math.PI * 1.4, Math.PI * 0.8);
      gola.scale.set(1, 0.16, 0.9);
      gola.position.set(0, 0.2, -0.01);
      g.add(gola);
    } else if (l.gola.tipo === 'penas') {
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (0.55 + (i / 8) * 0.9);
        const pena = chifre(0.16, 0.018, 0.6, l.gola.m, 5);
        pena.scale.set(1.6, 1, 0.4);
        pena.position.set(Math.cos(a) * 0.15, 0.08, Math.sin(a) * 0.12 - 0.02);
        pena.rotation.set(-0.5, -a + Math.PI / 2, 0);
        g.add(pena);
      }
    } else {
      const gola = anel(0.15, 0.04, l.gola.m, Math.PI * 1.3);
      gola.rotation.set(Math.PI / 2, 0, Math.PI * 0.85);
      gola.scale.set(1.1, 0.85, 1);
      gola.position.set(0, 0.1, -0.02);
      g.add(gola);
    }
  }
  c.prender('spine_03', g, saida);
  return saida;
}

// ---------- tronco ----------
/** A saia da veste: o alto preso na bacia e as duas metades presas nas coxas (balançam no passo). */
export function saia(c: Corpo, comprimento: number, m: Mat, alargar = 1, frente = true): Saida {
  const saida: Saida = [];
  const bacia = c.p('pelvis');
  const topo = grupoEm(c, bacia);
  const alto = torno([[0.16, 0.5], [0.185, -0.5]], m, 32);
  alto.scale.set(1.08, 0.18, 0.86);
  alto.position.set(0, -0.06, 0.005);
  topo.add(alto);
  c.prender('pelvis', topo, saida);
  for (const lado of ['l', 'r'] as const) {
    const g = grupoEm(c, bacia);
    const baixo = 0.2 + 0.1 * alargar * comprimento;
    // meia saia: o arco de fora da perna (x > 0 é a esquerda); a frente se fecha quando `frente`
    const inicio = lado === 'l' ? (frente ? 0 : 0.08) : Math.PI + (frente ? 0 : 0.08);
    const geo = new THREE.CylinderGeometry(0.188, baixo, comprimento, seg(20), seg(10, 3), true, inicio, Math.PI - (frente ? 0 : 0.16));
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const ang = Math.atan2(x, z);
      const dobra = Math.sin(ang * 9) * 0.012 * (comprimento / 2 - y) / comprimento;
      p.setXYZ(i, (x + Math.sin(ang) * dobra) * 1.06, y, (z + Math.cos(ang) * dobra) * 0.9);
    }
    geo.computeVertexNormals();
    const meia = new THREE.Mesh(geo, m);
    meia.position.set(0, -0.12 - comprimento / 2, 0.005);
    g.add(meia);
    c.prender(`thigh_${lado}`, g, saida);
  }
  return saida;
}

/** O gibão (colete torneado) no spine_02, aberto na frente quando `aberto`. */
export function gibao(c: Corpo, m: Mat, aberto = true, largura = 1): THREE.Group {
  const bacia = c.p('pelvis'), pesc = c.p('neck_01');
  const alto = (pesc.y - bacia.y) / c.u;
  const torso = grupoEm(c, bacia);
  const arco = aberto ? Math.PI * 1.7 : Math.PI * 2;
  const v = torno([[0.15, -0.5], [0.165, -0.2], [0.18, 0.15], [0.175, 0.4], [0.12, 0.5]], m, 32, arco, aberto ? Math.PI * 0.15 : 0);
  v.scale.set(1.05 * largura, alto * 0.9, 0.82 * largura);
  v.position.set(0, alto * 0.5, 0.005);
  torso.add(v);
  return torso;
}

/** O cinto com fivela (e bolsas, quando `bolsas` > 0), preso na bacia. */
export function cinto(c: Corpo, m: Mat, fivela: Mat, bolsas = 0, bolsa: Mat = m): Saida {
  const saida: Saida = [];
  const g = grupoEm(c, c.p('pelvis'));
  const tira = anel(0.158, 0.016, m);
  tira.rotation.x = Math.PI / 2;
  tira.scale.set(1.08, 0.86, 1);
  tira.position.set(0, 0.03, 0.008);
  g.add(tira);
  g.add(caixa(0.045, 0.04, 0.012, fivela, 0, 0.03, 0.148));
  for (let i = 0; i < bolsas; i++) {
    const a = Math.PI * (0.62 + i * 0.22) * (i % 2 ? -1 : 1);
    const b = caixa(0.055, 0.06, 0.035, bolsa, Math.sin(a) * 0.165, -0.01, Math.cos(a) * 0.14);
    b.rotation.y = a;
    g.add(b);
  }
  c.prender('pelvis', g, saida);
  return saida;
}

/** Uma ombreira: couro, placa em lâminas, pele (pelo grosso) ou osso (lâminas pontudas). */
export function ombreira(c: Corpo, lado: 'l' | 'r', tipo: 'couro' | 'placa' | 'pele' | 'osso', m: Mat, borda: Mat | null, saida: Saida, laminas = 1): void {
  const sx = lado === 'l' ? 1 : -1;
  const ombro = grupoEm(c, c.p(`upperarm_${lado}`).add(V(sx * 0.015 * c.u, 0.05 * c.u, 0)));
  if (tipo === 'pele') {
    const pelo = new THREE.Mesh(esfera(0.15, 16, 8, 0, Math.PI * 2, 0, 1.3), m);
    pelo.scale.set(1.1, 0.7, 1.05);
    pelo.rotation.z = -sx * 0.4;
    ombro.add(pelo);
  } else if (tipo === 'osso') {
    for (let i = 0; i < 3 + laminas; i++) {
      const a = (i / (2 + laminas)) * Math.PI - Math.PI / 2;
      const espinho = chifre(0.11 + 0.03 * Math.cos(a), 0.022, 0.8, m, 5);
      espinho.position.set(sx * 0.03, 0.02, Math.sin(a) * 0.07);
      espinho.rotation.set(Math.sin(a) * 0.6, 0, -sx * (0.9 + 0.2 * Math.cos(a)));
      ombro.add(espinho);
    }
  } else {
    for (let i = 0; i < laminas; i++) {
      const r = (tipo === 'placa' ? 0.15 : 0.13) - i * 0.012;
      const teta = 0.95 - i * 0.04;
      const cal = new THREE.Mesh(esfera(r, 32, 12, 0, Math.PI * 2, 0, teta), m);
      cal.scale.set(1, 0.62, 0.95);
      cal.position.set(sx * i * 0.022, -i * 0.05, 0);
      cal.rotation.z = -sx * (0.35 + i * 0.12);
      if (borda) {
        const b = anel(r * Math.sin(teta), 0.006, borda);
        b.rotation.x = Math.PI / 2;
        b.position.y = r * Math.cos(teta);
        cal.add(b);
      }
      ombro.add(cal);
    }
  }
  c.prender(`upperarm_${lado}`, ombro, saida);
}

/** A bandoleira em diagonal no peito (a correia da aljava, a faixa do erudito). */
export function bandoleira(c: Corpo, m: Mat, fivela: Mat | null, saida: Saida, espessura = 0.014): void {
  const bacia = c.p('pelvis'), pesc = c.p('neck_01');
  const alto = (pesc.y - bacia.y) / c.u;
  const g = grupoEm(c, bacia);
  const faixa = anel(0.17, espessura, m);
  faixa.scale.set(1.04, 1.55, 0.86);
  faixa.rotation.set(Math.PI / 2, 0.75, 0);
  faixa.position.set(0, alto * 0.62, 0.005);
  g.add(faixa);
  if (fivela) g.add(caixa(0.03, 0.034, 0.012, fivela, -0.06, alto * 0.58, 0.15));
  c.prender('spine_02', g, saida);
}

/** A aljava nas costas, com as penas das flechas para fora (mais flechas e o bocal de metal nos graus altos). */
export function aljava(c: Corpo, grau: number, couro: Mat, penas: Mat, bocal: Mat, saida: Saida): void {
  const g = grupoEm(c, c.p('spine_02'));
  const corpo = torno([[0.045, -0.5], [0.05, 0.3], [0.056, 0.5]], couro, 16);
  corpo.scale.set(1, 0.42, 0.8);
  const inclinado = new THREE.Group();
  inclinado.position.set(0.05, 0.12, -0.15);
  inclinado.rotation.z = -0.5;
  inclinado.add(corpo);
  if (grau >= 2) {
    const aro = anel(0.056, 0.007, bocal);
    aro.rotation.x = Math.PI / 2;
    aro.position.y = 0.21;
    inclinado.add(aro);
  }
  const n = 4 + nivelDe(grau) * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const flecha = caixa(0.006, 0.12, 0.006, couro, Math.cos(a) * 0.022, 0.25, Math.sin(a) * 0.018);
    inclinado.add(flecha);
    const pena = caixa(0.022, 0.05, 0.002, penas, Math.cos(a) * 0.022, 0.3, Math.sin(a) * 0.018);
    pena.rotation.y = a;
    inclinado.add(pena);
  }
  g.add(inclinado);
  c.prender('spine_02', g, saida);
}

/** As costelas de osso por cima do peito (o necromante), com o esterno. */
export function costelas(c: Corpo, osso: Mat, pares: number, saida: Saida): void {
  const bacia = c.p('pelvis'), pesc = c.p('neck_01');
  const alto = (pesc.y - bacia.y) / c.u;
  const g = grupoEm(c, bacia);
  for (let i = 0; i < pares; i++) {
    const y = alto * (0.82 - i * 0.11);
    const r = 0.17 - Math.abs(i - pares * 0.4) * 0.006;
    const costela = anel(r, 0.011, osso, Math.PI * 0.8);
    costela.rotation.set(Math.PI / 2, 0, Math.PI * 0.1);
    costela.scale.set(1.08, 0.84, 1);
    costela.position.set(0, y, 0.01);
    g.add(costela);
  }
  g.add(caixa(0.022, alto * 0.11 * pares, 0.016, osso, 0, alto * (0.86 - pares * 0.055), 0.155));
  c.prender('spine_02', g, saida);
}

/** A gola alta e dura em volta do pescoço (o feiticeiro, o necromante). */
export function golaAlta(c: Corpo, m: Mat, altura: number, saida: Saida, borda: Mat | null = null): void {
  const g = grupoEm(c, c.p('neck_01'));
  const gola = torno([[0.12, -0.5], [0.11, -0.1], [0.135, 0.5]], m, 32, Math.PI * 1.5, Math.PI * 0.75);
  gola.scale.set(1, altura, 0.95);
  gola.position.set(0, altura * 0.35, -0.01);
  g.add(gola);
  if (borda) {
    const b = anel(0.135, 0.005, borda, Math.PI * 1.5);
    b.rotation.set(Math.PI / 2, 0, Math.PI * 1.25);
    b.scale.set(1, 0.95, 1);
    b.position.set(0, altura * 0.85, -0.01);
    g.add(b);
  }
  c.prender('neck_01', g, saida);
}

/** A estola: duas faixas bordadas caindo do pescoço pela frente. */
export function estola(c: Corpo, m: Mat, comprimento: number, saida: Saida): void {
  const pesc = c.p('neck_01');
  const g = grupoEm(c, pesc);
  for (const sx of [-1, 1]) {
    const faixa = new THREE.Mesh(new THREE.PlaneGeometry(0.07, comprimento, 1, seg(8, 2)), m);
    faixa.position.set(sx * 0.07, -comprimento / 2 + 0.02, 0.14);
    faixa.rotation.x = -0.08;
    g.add(faixa);
  }
  c.prender('spine_03', g, saida);
}

/** O pingente (amuleto) com a pedra acesa, no peito. */
export function pingente(c: Corpo, corrente: Mat, pedra: Mat, saida: Saida, tamanho = 1): void {
  const g = grupoEm(c, c.p('neck_01'));
  const fio = anel(0.1, 0.004, corrente, Math.PI);
  fio.rotation.set(-0.35, 0, Math.PI);
  fio.scale.set(1, 1.3, 1);
  fio.position.set(0, 0.0, 0.05);
  g.add(fio);
  const gema = new THREE.Mesh(new THREE.OctahedronGeometry(0.022 * tamanho), pedra);
  gema.scale.y = 1.4;
  gema.position.set(0, -0.13, 0.15);
  g.add(gema);
  c.prender('spine_03', g, saida);
}

// ---------- cabeça ----------
/** O capuz: redondo (0) a pontudo e caído para trás (1); `sombra` escurece o rosto (feiticeiros, caçadores). */
export function capuz(c: Corpo, m: Mat, ponta: number, sombra: boolean, saida: Saida, sombraM: Mat | null = null): void {
  const g = grupoEm(c, c.p('Head'));
  const casco = new THREE.Mesh(esfera(0.135, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), m);
  casco.scale.set(1, 1.12, 1.12);
  casco.position.set(0, 0.085, -0.014);
  g.add(casco);
  const gola = torno([[0.18, -0.5], [0.125, 0.5]], m, 24);
  gola.scale.set(1, 0.16, 1.05);
  gola.position.set(0, -0.015, 0);
  g.add(gola);
  if (ponta > 0) {
    const bico = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24 * ponta, seg(12, 5), 1, true), m);
    bico.position.set(0, 0.2 + 0.05 * ponta, -0.07 - 0.04 * ponta);
    bico.rotation.x = -0.75 - 0.25 * ponta;
    g.add(bico);
  }
  if (sombra && sombraM) {
    const rosto = new THREE.Mesh(esfera(0.1, 16, 8, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.18, Math.PI * 0.5), sombraM);
    rosto.position.set(0, 0.075, 0.03);
    rosto.scale.set(1, 1.1, 1.1);
    g.add(rosto);
  }
  c.prender('Head', g, saida);
}

/** A máscara: pano (cobre boca e nariz), osso (rosto de caveira com os olhos fundos) ou bico de ave de rapina. */
export function mascara(c: Corpo, tipo: 'pano' | 'osso' | 'bico', m: Mat, escuro: Mat, saida: Saida): void {
  const g = grupoEm(c, c.p('Head'));
  if (tipo === 'pano') {
    const p = new THREE.Mesh(esfera(0.118, 20, 8, Math.PI * 0.08, Math.PI * 0.84, Math.PI * 0.45, Math.PI * 0.3), m);
    p.scale.set(1.02, 1.1, 1.15);
    p.position.set(0, 0.07, 0.008);
    g.add(p);
  } else if (tipo === 'osso') {
    const rosto = new THREE.Mesh(esfera(0.12, 20, 12, Math.PI * 0.1, Math.PI * 0.8, Math.PI * 0.12, Math.PI * 0.6), m);
    rosto.scale.set(1, 1.15, 1.18);
    rosto.position.set(0, 0.075, 0.012);
    g.add(rosto);
    for (const sx of [-1, 1]) {
      const olho = new THREE.Mesh(esfera(0.022, 10, 6), escuro);
      olho.scale.set(1.2, 0.9, 0.5);
      olho.position.set(sx * 0.04, 0.1, 0.138);
      g.add(olho);
    }
    g.add(caixa(0.06, 0.006, 0.01, escuro, 0, 0.035, 0.14));
  } else {
    const bico = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, seg(8, 4)), m);
    bico.rotation.x = Math.PI / 2 + 0.5;
    bico.position.set(0, 0.06, 0.18);
    g.add(bico);
    const fronte = new THREE.Mesh(esfera(0.125, 20, 10, Math.PI * 0.05, Math.PI * 0.9, Math.PI * 0.08, Math.PI * 0.4), m);
    fronte.scale.set(1, 1.1, 1.15);
    fronte.position.set(0, 0.085, 0.01);
    g.add(fronte);
    for (const sx of [-1, 1]) g.add(caixa(0.035, 0.012, 0.01, escuro, sx * 0.045, 0.1, 0.143));
  }
  c.prender('Head', g, saida);
}

/** O chapéu de aba larga (o andarilho, o caçador), com a fita. */
export function chapeu(c: Corpo, aba: number, copa: number, m: Mat, fita: Mat, saida: Saida, caida = 0.12): void {
  const g = grupoEm(c, c.p('Head'));
  const geo = new THREE.CylinderGeometry(aba, aba * 1.02, 0.012, seg(32));
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const r = Math.hypot(x, z) / aba;
    p.setY(i, p.getY(i) - r * r * caida * aba);
  }
  geo.computeVertexNormals();
  const borda = new THREE.Mesh(geo, m);
  borda.position.set(0, 0.17, 0.005);
  borda.rotation.x = 0.08;
  g.add(borda);
  const alto = torno([[0.125, -0.5], [0.118, 0.2], [0.09, 0.45], [0, 0.5]], m, 24);
  alto.scale.set(1, copa, 1.06);
  alto.position.set(0, 0.17 + copa / 2, 0.005);
  g.add(alto);
  const f = anel(0.124, 0.012, fita);
  f.rotation.x = Math.PI / 2;
  f.scale.set(1, 1.06, 1);
  f.position.set(0, 0.19, 0.005);
  g.add(f);
  c.prender('Head', g, saida);
}

/** A coroa de pontas (mais altas na frente); `joia` põe a pedra acesa no meio da testa. */
export function coroa(c: Corpo, m: Mat, pontas: number, altura: number, saida: Saida, y = 0.2, raio = 0.122, joia: Mat | null = null): void {
  const g = grupoEm(c, c.p('Head'));
  const aro = anel(raio, 0.011, m);
  aro.rotation.x = Math.PI / 2;
  aro.scale.set(1, 1.08, 1);
  aro.position.set(0, y, 0.012);
  g.add(aro);
  for (let i = 0; i < pontas; i++) {
    const a = (i / pontas) * Math.PI * 2;
    const alt = altura * (0.6 + (Math.cos(a) > 0.3 ? 0.9 * Math.cos(a) : 0.15));
    const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.016, alt, 5), m);
    ponta.position.set(Math.sin(a) * raio, y + alt / 2, Math.cos(a) * raio * 1.08 + 0.012);
    ponta.rotation.set(Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25);
    g.add(ponta);
  }
  if (joia) {
    const gema = new THREE.Mesh(new THREE.OctahedronGeometry(0.02), joia);
    gema.scale.y = 1.4;
    gema.position.set(0, y + 0.02, raio * 1.08 + 0.02);
    g.add(gema);
  }
  c.prender('Head', g, saida);
}

/** Os cristais de feitiço em volta da cabeça (a coroa de pedra-brilhante), presos num aro. */
export function cristais(c: Corpo, cristal: Mat, aro: Mat, quantos: number, tamanho: number, saida: Saida): void {
  const g = grupoEm(c, c.p('Head'));
  const base = anel(0.13, 0.009, aro);
  base.rotation.x = Math.PI / 2;
  base.scale.set(1, 1.08, 1);
  base.position.set(0, 0.17, 0.012);
  g.add(base);
  for (let i = 0; i < quantos; i++) {
    const a = (i / quantos) * Math.PI * 2;
    const alto = tamanho * (0.7 + 0.5 * Math.max(0, Math.cos(a)) + ((i * 37) % 10) / 30);
    const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.03), cristal);
    cr.scale.set(0.7, alto / 0.06, 0.7);
    cr.position.set(Math.sin(a) * 0.135, 0.19 + alto * 0.35, Math.cos(a) * 0.145 + 0.012);
    cr.rotation.set(Math.cos(a) * 0.35, a, -Math.sin(a) * 0.35);
    g.add(cr);
  }
  c.prender('Head', g, saida);
}

/** A galhada (ou os chifres) saindo da cabeça. */
export function galhada(c: Corpo, m: Mat, tamanho: number, saida: Saida, ramos = 2): void {
  const g = grupoEm(c, c.p('Head'));
  for (const sx of [-1, 1]) {
    const tronco = chifre(0.2 * tamanho, 0.018, 1.1, m, 8);
    tronco.position.set(sx * 0.07, 0.19, -0.01);
    tronco.rotation.set(-0.5, sx * 0.3, -sx * 0.55);
    g.add(tronco);
    for (let i = 0; i < ramos; i++) {
      const ramo = chifre(0.09 * tamanho, 0.01, 0.9, m, 5);
      ramo.position.set(sx * (0.1 + i * 0.035 * tamanho), 0.24 + i * 0.05 * tamanho, -0.02 - i * 0.02);
      ramo.rotation.set(-0.2, sx * 0.4, -sx * (0.1 + i * 0.25));
      g.add(ramo);
    }
  }
  c.prender('Head', g, saida);
}

/** O véu negro caindo atrás da cabeça (o necromante dos graus altos). */
export function veu(c: Corpo, m: Mat, comprimento: number, saida: Saida): void {
  const g = grupoEm(c, c.p('Head'));
  const geo = new THREE.CylinderGeometry(0.13, 0.2, comprimento, seg(20), seg(6, 2), true, Math.PI * 0.6, Math.PI * 0.8);
  const v = new THREE.Mesh(geo, m);
  v.position.set(0, 0.17 - comprimento / 2, -0.02);
  g.add(v);
  c.prender('Head', g, saida);
}
