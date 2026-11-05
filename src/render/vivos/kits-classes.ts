// Os kits sombrios das outras classes (04/11/2026, marco 37): cada uma com o arquétipo dela, na mesma regra do
// guerreiro (três níveis por peça, o grau ímpar ornamenta, o grau 5 troca o latão por ouro velho e acende a pedra):
// - mago: o feiticeiro da academia. Veste de lã azul-cinza que escurece até o azul profundo com barra dourada, capuz
//   pontudo com o rosto na sombra, e no alto a coroa de cristais de pedra-brilhante acesos em azul.
// - arqueiro: a caçadora. Couro e brigandina tachada, aljava nas costas, capuz com o pano no rosto e, no alto, a
//   máscara de ave de rapina; pele nos ombros e capa curta de mato.
// - necromante: o sacerdote da morte. Trapos negros rasgados, costelas de osso no peito, máscara de caveira, galhada e
//   véu; no grau 5 os olhos e a pedra acendem em chama-fantasma. A capa ganha gola de penas.
// - aventureiro: o andarilho. Gambeson e bolsas, depois brigandina, e por fim o peito de ferro aberto; o capuz dá lugar
//   ao chapéu de ferro e ao chapéu de aba larga com o pano no rosto.

import type * as THREE from 'three';
import type { PecaDeArmadura } from '../equipamento-3d';
import { aceso, comuns, Corpo, liso, nivelDe, pano, type Comuns, type Ossos, type PecaSombria } from './sombrio-base';
import {
  aljava, bandoleira, capa, capuz, chapeu, cinto, coroa, costelas, cristais, estola, galhada, gibao, golaAlta, mascara,
  membros, ombreira, pingente, saia, veu,
} from './pecas-sombrias';

type Kit = (ossos: Ossos, peca: PecaDeArmadura, grau: number) => PecaSombria;
type Mat = THREE.Material;

interface Contexto {
  c: Corpo;
  k: Comuns;
  n: number;
  ornato: boolean;
  ouro: boolean;
  borda: Mat;
  extras: THREE.Object3D[];
}
function contexto(ossos: Ossos, grau: number): Contexto {
  const k = comuns();
  return { c: new Corpo(ossos), k, n: nivelDe(grau), ornato: grau % 2 === 1, ouro: grau >= 5, borda: grau >= 5 ? k.ouro : k.latao, extras: [] };
}
const de = <T>(lista: readonly T[], i: number): T => lista[Math.min(i, lista.length - 1)] as T;

// ---------- mago ----------
const pecaDoMago: Kit = (ossos, peca, grau) => {
  const x = contexto(ossos, grau);
  const { c, k, n, borda, extras } = x;
  const vestes = [pano('#2c3140', 61), pano('#1f2a44', 63, { barra: '#5e4a2a' }), pano('#17203a', 67, { barra: '#8a6d36' })] as const;
  const pedra = aceso(x.ouro ? 0x9cc8ff : 0x6fa4ff, x.ouro ? 1.9 : 1.3);
  const sombra = liso(0x06070a, 1);
  if (peca === 'corpo') {
    extras.push(...saia(c, de([0.42, 0.56, 0.7], n), de(vestes, n), 1.1));
    extras.push(...cinto(c, n === 0 ? pano('#4a3b2a', 73) : k.couroNegro, n === 0 ? k.couro : borda, n === 0 ? 1 : 2, k.couro));
    if (n >= 1) estola(c, pano('#1a1f30', 79, { barra: x.ouro ? '#a08040' : '#6a5530' }), n === 2 ? 0.62 : 0.45, extras);
    if (n === 2) golaAlta(c, vestes[2], 0.14, extras, borda);
    if (x.ornato || x.ouro) pingente(c, borda, pedra, extras, x.ouro ? 1.4 : 1);
    return { extras, tecido: de(vestes, n) };
  }
  if (peca === 'cabeca') {
    const tecidoDoCapuz = de([pano('#2a2e38', 71), pano('#1e2638', 83), pano('#151c30', 89)], n);
    if (grau === 0) capuz(c, tecidoDoCapuz, 0, false, extras);
    else if (grau <= 3) capuz(c, tecidoDoCapuz, grau === 1 ? 0.4 : 1, true, extras, sombra);
    else capuz(c, tecidoDoCapuz, grau === 4 ? 0.3 : 0, true, extras, sombra);
    if (grau === 3) mascara(c, 'pano', pano('#12141c', 87), sombra, extras);
    if (grau >= 4) cristais(c, pedra, borda, grau === 5 ? 9 : 6, grau === 5 ? 0.1 : 0.06, extras);
    return { extras, esconder: 'Hood|Hair' };
  }
  if (peca === 'capa') {
    return { extras: capa(c, grau, {
      panos: [pano('#262a36', 91, { rasgo: 0.86 }), pano('#1c2236', 93, { rasgo: 0.84 }), pano('#141a2e', 97, { rasgo: 0.82 })],
      forro: pano('#2a3a66', 101, { rasgo: 0.82 }), fecho: borda, gola: { tipo: 'alta', m: vestes[2] },
    }) };
  }
  return { extras: membros(c, peca, grau, { leve: pano('#4a3b2a', 73), placa: k.couroNegro, junta: k.couro, luva: [k.couro, k.couroNegro], borda, semJuntas: true }) };
};

// ---------- arqueiro ----------
const pecaDoArqueiro: Kit = (ossos, peca, grau) => {
  const x = contexto(ossos, grau);
  const { c, k, n, borda, extras } = x;
  const couros = [pano('#3e3424', 103, { aspereza: 0.8 }), pano('#2e3424', 107, { tachas: true, aspereza: 0.75 }), pano('#262a20', 109, { tachas: true, aspereza: 0.75 })] as const;
  if (peca === 'corpo') {
    extras.push(...cinto(c, k.couro, n === 0 ? k.ferro : borda, 2, k.couroClaro));
    bandoleira(c, k.couro, n >= 1 ? borda : null, extras);
    aljava(c, grau, k.couroNegro, liso(n === 2 ? 0x2a2a2a : 0x8a7a5a, 0.9), borda, extras);
    if (n >= 1) ombreira(c, 'l', 'couro', k.couroNegro, x.ornato || n === 2 ? borda : null, extras, n + 1);
    if (n === 2) {
      ombreira(c, 'l', 'pele', k.pele, null, extras);
      ombreira(c, 'r', 'pele', k.pele, null, extras);
      extras.push(...saia(c, 0.2, k.malha, 0.4));
    }
    if (x.ouro) pingente(c, borda, aceso(0xb8e07a, 1.2), extras);
    return { extras, tecido: de(couros, n) };
  }
  if (peca === 'cabeca') {
    const capuzM = de([pano('#34382a', 111), pano('#2a3022', 113), pano('#202619', 117)], n);
    const sombra = liso(0x07080a, 1);
    if (grau === 0) {
      // só a faixa de couro na testa: o cabelo continua à mostra
      coroa(c, k.couro, 0, 0, extras, 0.13, 0.122);
      return { extras };
    }
    capuz(c, capuzM, grau >= 4 ? 0.2 : 0, grau >= 2, extras, sombra);
    if (grau === 2 || grau === 3) mascara(c, 'pano', pano('#2a2a22', 119), sombra, extras);
    if (grau === 3) coroa(c, k.latao, 0, 0, extras, 0.13, 0.13);
    if (grau >= 4) mascara(c, 'bico', grau === 5 ? k.ferro : k.placa, sombra, extras);
    if (grau === 5) coroa(c, k.ouro, 7, 0.03, extras, 0.2, 0.128);
    return { extras, esconder: 'Hood|Hair' };
  }
  if (peca === 'capa') {
    return { extras: capa(c, grau, {
      panos: [pano('#2e3626', 123, { rasgo: 0.86 }), pano('#242c20', 127, { rasgo: 0.84 }), pano('#1c2219', 129, { rasgo: 0.8 })],
      forro: pano('#4a3a28', 131, { rasgo: 0.8 }), fecho: borda, gola: { tipo: 'pele', m: k.pele }, comprimentos: [0.55, 0.85, 1.2],
    }) };
  }
  return { extras: membros(c, peca, grau, { leve: k.couro, placa: k.couroNegro, junta: k.couro, luva: [k.couro, k.couroNegro], borda }) };
};

// ---------- necromante ----------
const pecaDoNecromante: Kit = (ossos, peca, grau) => {
  const x = contexto(ossos, grau);
  const { c, k, n, extras } = x;
  const osso = liso(0xcfc6b0, 0.7);
  const chama = aceso(0x9fd8ff, x.ouro ? 2.4 : 1.2);
  const trapos = [pano('#242026', 137, { aspereza: 0.95 }), pano('#1a171c', 139, { aspereza: 0.95 }), pano('#121014', 141, { aspereza: 0.95 })] as const;
  const rasgados = [pano('#242026', 143, { rasgo: 0.72 }), pano('#1a171c', 147, { rasgo: 0.7 }), pano('#121014', 149, { rasgo: 0.66 })] as const;
  if (peca === 'corpo') {
    extras.push(...saia(c, de([0.48, 0.62, 0.74], n), de(rasgados, n), 1.2, false));
    extras.push(...cinto(c, k.couroNegro, k.ferro, 1, k.couroNegro));
    if (n >= 1) costelas(c, osso, n === 2 ? 5 : 3, extras);
    if (n === 2) {
      ombreira(c, 'l', 'osso', osso, null, extras, x.ouro ? 2 : 1);
      ombreira(c, 'r', 'osso', osso, null, extras, x.ouro ? 2 : 1);
      golaAlta(c, de(trapos, 2), 0.18, extras);
    }
    if (x.ornato || x.ouro) pingente(c, k.ferro, chama, extras, x.ouro ? 1.6 : 1);
    return { extras, tecido: de(trapos, n) };
  }
  if (peca === 'cabeca') {
    const capuzM = de([pano('#1e1b20', 151), pano('#171519', 153), pano('#100e12', 157)], n);
    const sombra = liso(0x050406, 1);
    capuz(c, capuzM, grau === 0 ? 0.2 : grau <= 3 ? 0.6 : 0.1, grau === 0, extras, sombra);
    if (grau >= 1) mascara(c, 'osso', osso, x.ouro ? chama : sombra, extras);
    if (grau >= 3) galhada(c, osso, grau === 3 ? 0.6 : grau === 4 ? 1 : 1.3, extras, grau === 5 ? 3 : 2);
    if (grau >= 4) veu(c, pano('#0c0b0e', 159, { rasgo: 0.6 }), 0.5, extras);
    return { extras, esconder: 'Hood|Hair' };
  }
  if (peca === 'capa') {
    return { extras: capa(c, grau, {
      panos: [pano('#1c1a1e', 161, { rasgo: 0.7 }), pano('#151317', 163, { rasgo: 0.65 }), pano('#0e0d10', 167, { rasgo: 0.6 })],
      forro: pano('#2a1f33', 169, { rasgo: 0.6 }), fecho: osso, gola: { tipo: 'penas', m: liso(0x141216, 0.9) },
    }) };
  }
  return { extras: membros(c, peca, grau, { leve: pano('#2a2620', 171), placa: k.couroNegro, junta: osso, luva: [k.couroNegro, k.couroNegro], borda: osso }) };
};

// ---------- aventureiro ----------
const pecaDoAventureiro: Kit = (ossos, peca, grau) => {
  const x = contexto(ossos, grau);
  const { c, k, n, borda, extras } = x;
  const vestes = [pano('#4a3e2c', 173, { acolchoado: true }), pano('#3a3026', 177, { tachas: true, aspereza: 0.75 }), pano('#2e2a24', 179, { tachas: true, aspereza: 0.75 })] as const;
  if (peca === 'corpo') {
    extras.push(...cinto(c, k.couro, n === 0 ? k.ferro : borda, 2 + n, k.couroClaro));
    bandoleira(c, k.couroClaro, n >= 1 ? borda : null, extras);
    if (n >= 1) ombreira(c, 'l', 'couro', k.couroNegro, x.ornato || n === 2 ? borda : null, extras, n);
    if (n === 2) {
      const peito = gibao(c, k.ferro, true, 1.03);
      c.prender('spine_02', peito, extras);
      ombreira(c, 'r', 'placa', k.placa, borda, extras, 2);
      extras.push(...saia(c, 0.24, k.malha, 0.5));
    }
    return { extras, tecido: de(vestes, n) };
  }
  if (peca === 'cabeca') {
    const sombra = liso(0x07080a, 1);
    // 05/11/2026: o capuz de pano grosso do andarilho no lugar do capuz liso do traje (o atlas não aceita camada vazia)
    if (grau <= 1) {
      capuz(c, pano('#4a4030', 185, { aspereza: 0.95 }), 0, grau === 1, extras, sombra);
      if (grau === 1) mascara(c, 'pano', pano('#5a4a34', 181), sombra, extras);
      return { extras, esconder: 'Hood|Hair' };
    }
    if (grau <= 3) chapeu(c, 0.2, 0.11, k.ferro, grau === 3 ? k.latao : k.couro, extras, 0.25);
    else chapeu(c, 0.27, 0.15, pano('#2a2420', 183, { aspereza: 0.9 }), x.ouro ? k.ouro : k.couroNegro, extras, 0.14);
    if (grau >= 4 || grau === 3) mascara(c, 'pano', pano('#3a3024', 187), sombra, extras);
    return { extras, esconder: 'Hood|Hair' };
  }
  if (peca === 'capa') {
    return { extras: capa(c, grau, {
      panos: [pano('#4a4030', 189, { rasgo: 0.86 }), pano('#3a3428', 191, { rasgo: 0.84 }), pano('#2c2822', 193, { rasgo: 0.8 })],
      forro: pano('#5a2a1e', 197, { rasgo: 0.8 }), fecho: borda, gola: { tipo: 'pele', m: k.pele }, comprimentos: [0.6, 0.95, 1.3],
    }) };
  }
  return { extras: membros(c, peca, grau, { leve: k.couro, placa: k.couroNegro, junta: k.ferro, luva: [k.couro, k.ferro], borda }) };
};

export const KITS_DAS_CLASSES: Readonly<Record<string, Kit>> = {
  mago: pecaDoMago,
  arqueiro: pecaDoArqueiro,
  necromante: pecaDoNecromante,
  aventureiro: pecaDoAventureiro,
};
