// Armaduras sombrias (04/11/2026, marco 37): o equipamento evolui por material e silhueta, não pela cor da raridade.
// Cada peça tem três níveis (graus 0–1, 2–3 e 4–5): couro e pano acolchoado, malha com aço e tabardo, e placas
// completas com ombreiras em lâminas, gorjal e capa longa rasgada. O grau ímpar acrescenta ornamento ao nível (latão,
// rebites, gorjal); o grau 5 troca o latão por ouro e acende a brasa. As peças são torneadas (LatheGeometry), presas
// nos ossos do traje (seguem a animação) e usam materiais PBR com texturas procedurais (sombrio-base.ts). Os membros e
// a capa são os de uso geral (pecas-sombrias.ts) com os materiais do guerreiro; as outras classes ficam em
// kits-classes.ts e todas se registram em KITS_SOMBRIOS.

import * as THREE from 'three';
import type { PecaDeArmadura } from '../equipamento-3d';
import { anel, comuns, Corpo, esfera, grupoEm, nivelDe, pano, seg, torno, V, type Ossos, type PecaSombria } from './sombrio-base';
import { capa, membros } from './pecas-sombrias';
import { KITS_DAS_CLASSES } from './kits-classes';

export { definirDetalhe, type PecaSombria } from './sombrio-base';

const doGuerreiro = () => ({
  ...comuns(),
  gambeson: pano('#4a3a2c', 29, { acolchoado: true }),
  tabardo: pano('#5a1518', 9, { bordado: true, rasgo: 0.9, aspereza: 0.9 }),
  tabardoSimples: pano('#4a1a1a', 31, { rasgo: 0.88 }),
  mantoCurto: pano('#3b3028', 37, { rasgo: 0.86, aspereza: 0.95 }),
  capaMedia: pano('#2b2e26', 41, { rasgo: 0.84, aspereza: 0.95 }),
  capa: pano('#1d1a1c', 13, { rasgo: 0.8, aspereza: 0.95 }),
  forro: pano('#3d0c10', 17, { rasgo: 0.8, aspereza: 0.9 }),
  capuz: pano('#33302a', 43, { aspereza: 0.95 }),
});
type Materiais = ReturnType<typeof doGuerreiro>;

// ---------- peças do guerreiro ----------
function tronco(c: Corpo, nivel: number, ornato: boolean, grau: number, m: Materiais): THREE.Object3D[] {
  const saida: THREE.Object3D[] = [];
  const bacia = c.p('pelvis'), pesc = c.p('neck_01');
  const alto = (pesc.y - bacia.y) / c.u;
  const borda = grau >= 5 ? m.ouro : m.latao;
  // o torso inteiro fica preso no spine_02 (segue a curva do tronco); as faldas e o tabardo, na bacia
  const torso = grupoEm(c, bacia);
  if (nivel === 0) {
    // gibão de couro aberto na frente, com cinto largo
    const gibao = torno([[0.15, -0.5], [0.165, -0.2], [0.18, 0.15], [0.175, 0.4], [0.12, 0.5]], m.couroClaro, 32, Math.PI * 1.7, Math.PI * 0.15);
    gibao.scale.set(1.05, alto * 0.9, 0.82);
    gibao.position.set(0, alto * 0.5, 0.005);
    torso.add(gibao);
  } else {
    const perfil = [[0.135, -0.5], [0.15, -0.35], [0.175, 0.05], [0.19, 0.3], [0.17, 0.46], [0.11, 0.5]] as const;
    const peito = torno(perfil, nivel === 2 ? m.placa : m.aco, 40, nivel === 2 ? Math.PI * 2 : Math.PI * 1.1, nivel === 2 ? 0 : -Math.PI * 0.55);
    peito.scale.set(1.08, alto * (nivel === 2 ? 0.95 : 0.7), 0.82);
    peito.position.set(0, alto * (nivel === 2 ? 0.52 : 0.6), 0.01);
    torso.add(peito);
    if (nivel === 2) {
      const quilha = new THREE.Mesh(new THREE.BoxGeometry(0.018, alto * 0.75, 0.03), m.aco);
      quilha.position.set(0, alto * 0.5, 0.155);
      quilha.rotation.x = -0.12;
      torso.add(quilha);
    }
    if (ornato || nivel === 2) {
      for (const [y, r] of [[0.07, 0.148], [0.95, 0.12]] as const) {
        if (nivel === 1 && y < 0.5) continue;
        const b = anel(r * 1.06, 0.009, borda);
        b.rotation.x = Math.PI / 2;
        b.scale.set(1.08, 0.82, 1);
        b.position.set(0, alto * (nivel === 1 ? 0.92 : y), 0.01);
        torso.add(b);
      }
    }
  }
  // cinto com fivela
  const cinto = anel(0.152, 0.018, m.couro);
  cinto.rotation.x = Math.PI / 2;
  cinto.scale.set(1.08, 0.84, 1);
  cinto.position.set(0, 0.04, 0.01);
  torso.add(cinto);
  const fivela = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.045, 0.012), nivel === 0 && !ornato ? m.aco : borda);
  fivela.position.set(0, 0.04, 0.145);
  torso.add(fivela);
  // gorjal (ornato do nível 1 e todo o nível 2)
  if (nivel === 2 || (nivel === 1 && ornato)) {
    const gorjal = torno([[0.13, -0.5], [0.1, 0], [0.075, 0.5]], m.aco);
    gorjal.scale.set(1, 0.09, 0.9);
    gorjal.position.set(0, alto - 0.005, 0);
    torso.add(gorjal);
  }
  c.prender('spine_02', torso, saida);

  // faldas, tabardo e tassets presos na bacia
  const saia = grupoEm(c, bacia);
  if (nivel >= 1) {
    for (let i = 0; i < nivel + 1; i++) {
      const f = torno([[0.165 + i * 0.012, 0.5], [0.185 + i * 0.016, -0.5]], m.placa);
      f.scale.set(1.06, 0.05, 0.84);
      f.position.set(0, -0.005 - i * 0.042, 0.005);
      saia.add(f);
    }
    const tab = new THREE.Mesh(new THREE.PlaneGeometry(0.24, nivel === 2 ? 0.6 : 0.5, seg(8, 2), seg(20, 4)), nivel === 2 ? m.tabardo : m.tabardoSimples);
    const pt = tab.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pt.count; i++) {
      const x = pt.getX(i), y = pt.getY(i);
      pt.setZ(i, Math.sin(x * 9) * 0.01 + (0.3 - y) * 0.07);
    }
    tab.geometry.computeVertexNormals();
    tab.position.set(0, nivel === 2 ? -0.27 : -0.22, 0.17);
    saia.add(tab);
  } else {
    // aba de couro do gibão
    const aba = torno([[0.165, 0.5], [0.2, -0.5]], m.couroClaro, 32, Math.PI * 1.7, Math.PI * 0.15);
    aba.scale.set(1.06, 0.16, 0.84);
    aba.position.set(0, -0.08, 0.005);
    saia.add(aba);
  }
  c.prender('pelvis', saia, saida);

  // ombreiras: couro (ornato do nível 0), duas lâminas (nível 1), quatro lâminas com borda e aba (nível 2)
  if (nivel > 0 || ornato) {
    for (const lado of ['l', 'r'] as const) {
      const sx = lado === 'l' ? 1 : -1;
      const ombro = grupoEm(c, c.p(`upperarm_${lado}`).add(V(sx * 0.015 * c.u, 0.05 * c.u, 0)));
      const laminas = nivel === 2 ? 4 : nivel === 1 ? 2 : 1;
      for (let i = 0; i < laminas; i++) {
        const r = (nivel === 2 ? 0.16 : 0.13) - i * 0.012;
        const teta = 0.95 - i * 0.04;
        const cal = new THREE.Mesh(esfera(r, 32, 12, 0, Math.PI * 2, 0, teta), nivel === 0 ? m.couro : m.placa);
        cal.scale.set(1, 0.62, 0.95);
        cal.position.set(sx * i * 0.022, -i * 0.05, 0);
        cal.rotation.z = -sx * (0.35 + i * 0.12);
        if (nivel === 2 || ornato) {
          const b = anel(r * Math.sin(teta), 0.006, nivel === 0 ? m.latao : borda);
          b.rotation.x = Math.PI / 2;
          b.position.y = r * Math.cos(teta);
          cal.add(b);
        }
        ombro.add(cal);
      }
      if (nivel === 2) {
        const aba = torno([[0, -0.5], [0.06, -0.3], [0.05, 0.2], [0, 0.5]], m.placa, 6);
        aba.scale.set(1, 0.16, 0.5);
        aba.position.set(-sx * 0.02, 0.1, 0);
        aba.rotation.z = sx * 0.5;
        ombro.add(aba);
      }
      c.prender(`upperarm_${lado}`, ombro, saida);
    }
  }
  return saida;
}

function cabeca(c: Corpo, grau: number, m: Materiais): THREE.Object3D[] {
  const saida: THREE.Object3D[] = [];
  const cab = c.p('Head');
  const g = grupoEm(c, cab);
  if (grau === 0) {
    // capuz de pano gasto, caído nos ombros
    const capuz = new THREE.Mesh(esfera(0.13, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), m.capuz);
    capuz.scale.set(1, 1.1, 1.12);
    capuz.position.set(0, 0.085, -0.012);
    g.add(capuz);
    const gola = torno([[0.17, -0.5], [0.12, 0.5]], m.capuz, 24);
    gola.scale.set(1, 0.14, 1.05);
    gola.position.set(0, -0.01, 0);
    g.add(gola);
    c.prender('Head', g, saida);
    return saida;
  }
  // coifa de malha (grau 1 e por baixo dos elmos abertos)
  if (grau <= 3) {
    const coifa = new THREE.Mesh(esfera(0.118, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), m.malha);
    coifa.scale.set(1, 1.12, 1.1);
    coifa.position.set(0, 0.09, 0.0);
    g.add(coifa);
    const gola = torno([[0.14, -0.5], [0.105, 0.5]], m.malha, 32, Math.PI * 1.6, Math.PI * 0.7);
    gola.scale.set(1, 0.12, 1.05);
    gola.position.set(0, -0.0, 0);
    g.add(gola);
  }
  if (grau === 2 || grau === 3) {
    // elmo nasal (2) e o mesmo com aba e jugulares (3)
    const casco = torno([[0, 0.5], [0.07, 0.45], [0.112, 0.25], [0.124, -0.1], [0.126, -0.5]], m.aco, 40);
    casco.scale.set(1, 0.17, 1.08);
    casco.position.set(0, 0.165, 0.012);
    g.add(casco);
    const nasal = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.09, 0.016), m.aco);
    nasal.position.set(0, 0.075, 0.138);
    g.add(nasal);
    const aro = anel(0.126, 0.008, grau === 3 ? m.latao : m.aco);
    aro.rotation.x = Math.PI / 2;
    aro.scale.set(1, 1.08, 1);
    aro.position.set(0, 0.125, 0.012);
    g.add(aro);
    if (grau === 3) {
      for (const sx of [-1, 1]) {
        const jugular = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.11, 0.07), m.aco);
        jugular.position.set(sx * 0.118, 0.06, 0.04);
        g.add(jugular);
      }
      const crista = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.2), m.latao);
      crista.position.set(0, 0.245, 0.0);
      g.add(crista);
    }
  }
  if (grau >= 4) {
    // grande elmo fechado: fenda dos olhos, respiros e reforço central
    const elmo = torno([[0, 0.5], [0.07, 0.48], [0.112, 0.38], [0.122, 0.15], [0.12, -0.2], [0.113, -0.42], [0.118, -0.5]], m.placa, 48);
    // 04/11/2026: mais fundo na frente, para o rosto não atravessar o elmo no retrato de perto
    elmo.scale.set(1.04, 0.3, 1.2);
    elmo.position.set(0, 0.105, 0.022);
    g.add(elmo);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.013, 0.02), m.fenda);
    visor.position.set(0, 0.12, 0.158);
    g.add(visor);
    const nariz = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.1, 0.022), m.aco);
    nariz.position.set(0, 0.065, 0.156);
    g.add(nariz);
    for (let i = 0; i < 6; i++) {
      const furo = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.022, 0.02), m.fenda);
      furo.position.set((i < 3 ? 1 : -1) * (0.03 + (i % 3) * 0.014), 0.035, 0.153);
      g.add(furo);
    }
    const aro = anel(0.122, grau >= 5 ? 0.011 : 0.007, grau >= 5 ? m.ouro : m.aco);
    aro.rotation.x = Math.PI / 2;
    aro.scale.set(1, 1.08, 1);
    aro.position.set(0, 0.2, 0.012);
    g.add(aro);
    if (grau >= 5) {
      // a coroa de pontas, mais altas na frente
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2;
        const alt = 0.06 + (Math.cos(a) > 0.3 ? 0.07 * Math.cos(a) : 0.01);
        const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.016, alt, 5), m.ouro);
        ponta.position.set(Math.sin(a) * 0.122, 0.2 + alt / 2, Math.cos(a) * 0.132 + 0.012);
        ponta.rotation.set(Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25);
        g.add(ponta);
      }
    }
  }
  c.prender('Head', g, saida);
  return saida;
}

/** A peça sombria do guerreiro no grau (0 a 5). */
export function pecaDoGuerreiro(ossos: Ossos, peca: PecaDeArmadura, grau: number): PecaSombria {
  const c = new Corpo(ossos);
  const m = doGuerreiro();
  const nivel = nivelDe(grau);
  const ornato = grau % 2 === 1;
  const borda = grau >= 5 ? m.ouro : m.latao;
  if (peca === 'corpo') {
    return {
      extras: tronco(c, nivel, ornato, grau, m),
      tecido: nivel === 0 ? m.gambeson : m.malha,
      esconder: nivel >= 1 ? 'Pauldron' : undefined,
    };
  }
  if (peca === 'cabeca') return { extras: cabeca(c, grau, m), tecido: grau === 0 ? m.capuz : undefined, esconder: grau >= 2 ? 'Hood|Hair' : undefined };
  if (peca === 'capa') {
    return { extras: capa(c, grau, { panos: [m.mantoCurto, m.capaMedia, m.capa], forro: m.forro, fecho: borda, gola: { tipo: 'pele', m: m.pele } }) };
  }
  return { extras: membros(c, peca, grau, { leve: m.couro, placa: m.placa, junta: m.aco, luva: [m.malha, m.placa], borda }) };
}

/** As classes com o kit sombrio. */
export const KITS_SOMBRIOS: Readonly<Record<string, (ossos: Ossos, peca: PecaDeArmadura, grau: number) => PecaSombria>> = {
  guerreiro: pecaDoGuerreiro,
  ...KITS_DAS_CLASSES,
};
