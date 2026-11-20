// A assinatura de cada propósito nos membros (marco 46, 20/11/2026, D-189). As luvas, as perneiras e as botas de
// todos os propósitos saem da mesma função (`membros`, pecas-sombrias.ts) e só mudavam pelo material: no grau 0, e nas
// botas do Batedor e da Espreita, ficavam iguais. A assinatura acrescenta, em todos os graus, a forma do propósito:
// - Baluarte: a munhequeira de ferro e a barra dos nós dos dedos, a tira rebitada na coxa e a biqueira de ferro;
// - Batedor: as tiras de couro cruzadas no antebraço, a bolsa na coxa e as faixas enroladas no cano;
// - Arcano: o punho que abre em sino, a aba de pano na frente da coxa e a ponta da sapatilha virada para cima;
// - Espreita: a braçadeira de arqueiro e a tira dos dedos, a bainha da faca na coxa e o bico macio da bota;
// - Ossuário: os esporões de osso no antebraço, a rótula de osso e as falanges na ponta do pé.
// Cresce um pouco com o nível visual (0 a 2), para a peça subir de grau sem perder a forma.

import * as THREE from 'three';
import { anel, aoLongo, caixa, chifre, Corpo, esfera, liso, nivelDe, torno, V } from './sombrio-base';

type Mat = THREE.Material;

/** A correia clara do Batedor e o couro pardo-esverdeado da Espreita: leem no sprite pequeno contra o couro escuro. */
const correia = (): Mat => liso(0x8a6a42, 0.85);
const camufla = (): Mat => liso(0x4e5a3c, 0.9);
type Saida = THREE.Object3D[];
type Membro = 'maos' | 'pernas' | 'pes';

/** Os materiais que a assinatura usa (os mesmos da liga dos membros). */
export interface MateriaisDaAssinatura {
  leve: Mat;
  placa: Mat;
  junta: Mat;
  borda: Mat;
}

/** O grupo em metros do esqueleto ao longo do trecho de dois ossos (y do primeiro para o segundo). */
function trecho(c: Corpo, de: string, ate: string, frente: THREE.Vector3): THREE.Group {
  const g = new THREE.Group();
  g.scale.setScalar(c.u);
  return aoLongo(g, c.p(de), c.p(ate), 0, frente) as THREE.Group;
}

/** O trecho principal de cada membro (o antebraço, a coxa, a canela). */
const TRECHO: Readonly<Record<Membro, readonly [string, string]>> = { maos: ['lowerarm', 'hand'], pernas: ['thigh', 'calf'], pes: ['calf', 'foot'] };

/** O desenho: `g` no trecho principal, `pe` do tornozelo à bola (a frente para cima); o y é a fração do trecho. */
type Desenho = (g: THREE.Group, pe: THREE.Group, membro: Membro, k: number, sx: number, m: MateriaisDaAssinatura) => void;

/** Um anel inclinado em volta do trecho (a tira, a faixa, o punho). */
function aro(g: THREE.Group, r: number, tubo: number, m: Mat, y: number, inclina = 0): void {
  const a = anel(r, tubo, m);
  a.rotation.set(Math.PI / 2 + inclina, 0, 0);
  a.position.y = y;
  g.add(a);
}

const DESENHOS: Readonly<Record<string, Desenho>> = {
  baluarte: (g, pe, membro, k, sx, m) => {
    if (membro === 'maos') {
      aro(g, 0.06 * k, 0.012, m.junta, 0.42);
      aro(g, 0.062 * k, 0.012, m.junta, 0.3);
    } else if (membro === 'pernas') {
      g.add(caixa(0.03, 0.34 * k, 0.012, m.junta, 0, 0.1, 0.09));
      for (let i = 0; i < 3; i++) g.add(new THREE.Mesh(esfera(0.009, 8, 6), m.borda).translateY(-0.02 + i * 0.12).translateZ(0.097));
    } else {
      const biqueira = new THREE.Mesh(esfera(0.06 * k, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), m.junta);
      biqueira.scale.set(1, 0.8, 1.2);
      biqueira.position.set(0, 0.85, 0.01);
      pe.add(biqueira);
    }
  },
  batedor: (g, pe, membro, k, sx, m) => {
    if (membro === 'maos') for (let i = 0; i < 3; i++) {
      aro(g, 0.058 * k, 0.011, correia(), 0.12 + i * 0.14, (i % 2 ? 1 : -1) * 0.45);
      g.add(caixa(0.022, 0.022, 0.012, m.borda, 0, 0.12 + i * 0.14, 0.06 * k));
    }
    else if (membro === 'pernas') {
      g.add(caixa(0.07, 0.11 * k, 0.06, correia(), sx * 0.11, 0.38, 0.01));
      g.add(caixa(0.074, 0.022, 0.064, m.borda, sx * 0.11, 0.3, 0.01));
      aro(g, 0.097, 0.01, correia(), 0.3);
    } else for (let i = 0; i < 3; i++) aro(g, 0.068 * k, 0.011, correia(), 0.5 + i * 0.13, (i % 2 ? 1 : -1) * 0.4);
  },
  arcano: (g, pe, membro, k, sx, m) => {
    if (membro === 'maos') {
      const sino = torno([[0.05, -0.5], [0.07 * k, 0.2], [0.095 * k, 0.5]], m.leve, 24);
      sino.scale.set(1, 0.16, 1);
      sino.position.y = 0.85;
      g.add(sino);
      aro(g, 0.094 * k, 0.005, m.borda, 0.93);
    } else if (membro === 'pernas') {
      g.add(caixa(0.075, 0.42 * k, 0.008, m.leve, 0, 0.5, 0.095), caixa(0.077, 0.018, 0.012, m.borda, 0, 0.3, 0.098), caixa(0.077, 0.018, 0.012, m.borda, 0, 0.72, 0.098));
    } else {
      const ponta = chifre(0.11 * k, 0.03, 1.6, m.leve, 8);
      ponta.position.set(0, 0.7, 0);
      pe.add(ponta);
    }
  },
  espreita: (g, pe, membro, k, sx, m) => {
    if (membro === 'maos') {
      const bracal = caixa(0.04, 0.46 * k, 0.07, camufla(), -sx * 0.05, 0.45, 0);
      g.add(bracal);
      for (let i = 0; i < 2; i++) aro(g, 0.055, 0.005, m.borda, 0.3 + i * 0.3);
    } else if (membro === 'pernas') {
      const bainha = caixa(0.035, 0.34 * k, 0.05, camufla(), sx * 0.1, 0.5, -0.02);
      bainha.rotation.z = sx * 0.12;
      g.add(bainha, caixa(0.022, 0.07, 0.03, m.borda, sx * 0.095, 0.3, -0.02));
    } else {
      const bico = new THREE.Mesh(new THREE.ConeGeometry(0.05 * k, 0.14, 12), camufla());
      bico.position.set(0, 0.95, -0.01);
      pe.add(bico);
      aro(g, 0.07, 0.007, m.borda, 0.88);
    }
  },
  ossuario: (g, pe, membro, k, sx, m) => {
    if (membro === 'maos') for (let i = 0; i < 2; i++) {
      const esporao = chifre(0.08 * k, 0.012, 0.8, m.junta, 6);
      esporao.rotation.set(-Math.PI / 2 - 0.3, 0, -sx * (0.6 + i * 0.2));
      esporao.position.set(sx * 0.05, 0.2 + i * 0.2, -0.02);
      g.add(esporao);
    }
    else if (membro === 'pernas') {
      const rotula = new THREE.Mesh(esfera(0.05 * k, 14, 8), m.junta);
      rotula.scale.set(1, 1.1, 0.5);
      rotula.position.set(0, 0.97, 0.075);
      g.add(rotula, caixa(0.02, 0.4 * k, 0.02, m.junta, -sx * 0.085, 0.45, 0.02));
    } else for (let i = 0; i < 3; i++) {
      const falange = chifre(0.06 * k, 0.01, 0.9, m.junta, 6);
      falange.position.set((i - 1) * 0.025, 0.95, 0.005);
      falange.rotation.x = 0.2;
      pe.add(falange);
    }
  },
};

/** A assinatura do propósito no membro (nada se o propósito não tiver desenho). */
export function assinaturaDosMembros(c: Corpo, membro: Membro, grau: number, proposito: string | undefined, m: MateriaisDaAssinatura): Saida {
  const desenho = proposito ? DESENHOS[proposito] : undefined;
  if (!desenho) return [];
  const saida: Saida = [];
  const k = 1 + nivelDe(grau) * 0.08;
  const [de, ate] = TRECHO[membro];
  for (const lado of ['l', 'r'] as const) {
    const g = trecho(c, `${de}_${lado}`, `${ate}_${lado}`, V(0, 0, 1));
    const pe = trecho(c, `foot_${lado}`, `ball_${lado}`, V(0, 1, 0));
    desenho(g, pe, membro, k, lado === 'l' ? 1 : -1, m);
    // a fração do trecho vira metros (a forma não estica: só a posição segue o comprimento)
    for (const [grupo, a, b] of [[g, `${de}_${lado}`, `${ate}_${lado}`], [pe, `foot_${lado}`, `ball_${lado}`]] as const) {
      const comprimento = c.p(a).distanceTo(c.p(b)) / c.u;
      for (const filho of grupo.children) filho.position.y *= comprimento;
      if (grupo.children.length > 0) c.prender(a, grupo, saida);
    }
  }
  return saida;
}
