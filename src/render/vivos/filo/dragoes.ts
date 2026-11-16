// Marco 45 (16/11/2026, D-181): os dragões de Filo, feitos do zero (no lugar do dragão CC0): um corpo só, de pescoço e
// cauda em segmentos, asas de membrana, quatro patas com garras e a cabeça com chifres, vestido por dimensão:
// - da Fornalha (Ignárea): escamas negras rachadas de brasa, a fornalha acesa no peito e a fumaça nos chifres;
// - do Silêncio (Hiemália): pálido de geada, a crista de cristais de gelo e a boca costurada de gelo (o silêncio);
// - da Tempestade Engrenada (Fulgúria): as placas de ferro e latão, as engrenagens no dorso e as bobinas nas asas;
// - Fermentado (Putrévia): inchado, os sacos de gás verdes no pescoço e os fungos crescendo nas costas;
// - das Ruínas (Lítia): de pedra viva, com pedaços de muralha e coluna nas costas e o musgo.

import * as THREE from 'three';
import { asaDeMembrana, bola, brilho, chama, ciclo, cogumelo, cone, cristais, em, mat, metalico, olhos, pernas, pivo, raizDe, SOTAQUE, suave, vidro, type EstadoFera, type Fera, type Perna } from './kit';

interface Veste {
  escama: THREE.Material;
  barriga: THREE.Material;
  chifre: THREE.Material;
  membrana: THREE.Material;
  olho: number;
  /** O que só esta dimensão tem: o peito, o dorso, a cabeça. */
  enfeitar: (p: { tronco: THREE.Group; cabeca: THREE.Group; pescoco: THREE.Group[]; cauda: THREE.Group[]; asas: THREE.Group[] }) => void;
  largura?: number;
}

const VESTES: Readonly<Record<string, () => Veste>> = {
  fornalha: () => ({
    escama: mat(0x1a1412, { roughness: 0.55, metalness: 0.2 }), barriga: mat(0x3a1a10, { emissive: SOTAQUE.ignarea, emissiveIntensity: 0.35 }),
    chifre: mat(0x2a2420, { roughness: 0.5 }), membrana: mat(0x3a1a12, { side: THREE.DoubleSide, roughness: 0.8, emissive: 0x5a1a05, emissiveIntensity: 0.4 }), olho: SOTAQUE.ignarea,
    enfeitar: ({ tronco, cabeca }) => {
      const brasa = brilho(SOTAQUE.ignarea, 1.32);
      const grade = new THREE.Group();
      for (let i = 0; i < 5; i++) grade.add(em(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.02), metalico(0x2e2c30, 0.6)), (i - 2) * 0.06, 0, 0));
      grade.add(em(bola(0.13, brasa, 1.1, 0.9, 0.4), 0, 0, -0.02));
      em(grade, 0, -0.08, 0.42, 0.3);
      tronco.add(grade);
      for (let i = 0; i < 8; i++) tronco.add(em(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.18, 0.012), brasa), Math.cos(i) * 0.3, 0.05, -0.3 + i * 0.09, 0, i, 0.6));
      for (const s of [-1, 1]) { const c = new THREE.Group(); em(c, s * 0.08, 0.22, -0.1); chama(c, 0.12, SOTAQUE.ignarea); cabeca.add(c); }
    },
  }),
  silencio: () => ({
    escama: mat(0xc8d4de, { roughness: 0.45 }), barriga: mat(0xe8f0f6, { roughness: 0.6 }), chifre: vidro(SOTAQUE.hiemalia, 0.85, 0.5),
    membrana: mat(0xb8d0e0, { side: THREE.DoubleSide, transparent: true, opacity: 0.75, roughness: 0.3 }), olho: SOTAQUE.hiemalia,
    enfeitar: ({ tronco, cabeca, cauda }) => {
      const gelo = vidro(SOTAQUE.hiemalia, 0.8, 0.6);
      for (let i = 0; i < 6; i++) { const g = new THREE.Group(); em(g, 0, 0.25, 0.3 - i * 0.14); cristais(g, 3, 0.02, 0.18 - i * 0.015, gelo, 200 + i, 0.3); tronco.add(g); }
      for (const [i, c] of cauda.entries()) if (i % 2 === 0) cristais(c, 2, 0.02, 0.08, gelo, 300 + i, 0.3);
      // A boca costurada de gelo: as tiras que fecham a mandíbula.
      for (let i = 0; i < 4; i++) cabeca.add(em(new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.07, 0.01), gelo), (i - 1.5) * 0.03, -0.06, 0.25));
    },
  }),
  engrenado: () => ({
    escama: metalico(0x3a3a40, 0.5), barriga: metalico(0x7e6236, 0.4), chifre: metalico(0x8a6a3a, 0.35),
    membrana: mat(0x2a2a30, { side: THREE.DoubleSide, roughness: 0.6, metalness: 0.4 }), olho: SOTAQUE.fulguria,
    enfeitar: ({ tronco, asas }) => {
      const latao = metalico(0x8a6a3a, 0.35);
      for (let i = 0; i < 3; i++) {
        const roda = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 6, 14), latao);
        for (let k = 0; k < 10; k++) roda.add(em(new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.04, 0.035), latao), Math.cos(k * 0.628) * 0.1, Math.sin(k * 0.628) * 0.1, 0, 0, 0, k * 0.628));
        tronco.add(em(roda, 0, 0.26, 0.2 - i * 0.2, Math.PI / 2, 0, 0));
      }
      for (const a of asas) for (let k = 0; k < 3; k++) a.add(em(new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.01, 4, 10), metalico(0xb06a3a)), (k + 1) * 0.15 * Math.sign(a.position.x || 1), 0.05, 0, 0, Math.PI / 2, 0));
      tronco.add(em(bola(0.06, brilho(SOTAQUE.fulguria, 1.4)), 0, -0.05, 0.42));
    },
  }),
  fermentado: () => ({
    escama: mat(0x3a4a28, { roughness: 0.5 }), barriga: mat(0x6a7a3a, { roughness: 0.7 }), chifre: mat(0x5a5038),
    membrana: mat(0x4a5a2a, { side: THREE.DoubleSide, roughness: 0.8, transparent: true, opacity: 0.9 }), olho: SOTAQUE.putrevia, largura: 1.2,
    enfeitar: ({ tronco, pescoco }) => {
      const gas = mat(0x9ad26a, { transparent: true, opacity: 0.7, roughness: 0.1, emissive: SOTAQUE.putrevia, emissiveIntensity: 0.5 });
      for (const [i, p] of pescoco.entries()) if (i % 2) for (const s of [-1, 1]) p.add(em(bola(0.06, gas), s * 0.08, -0.02, 0));
      for (let i = 0; i < 6; i++) { const g = new THREE.Group(); em(g, Math.cos(i * 1.3) * 0.18, 0.25, -0.2 + i * 0.08); cogumelo(g, 0.05 + (i % 3) * 0.02, mat(0x8a6a3a), mat(0xd8d0b0), brilho(0xb7f27a, 0.44)); tronco.add(g); }
    },
  }),
  ruinas: () => ({
    escama: mat(0x7a7064, { roughness: 0.95 }), barriga: mat(0x5a5048, { roughness: 0.95 }), chifre: mat(0x4a4038, { roughness: 0.9 }),
    membrana: mat(0x5a5248, { side: THREE.DoubleSide, roughness: 0.95 }), olho: SOTAQUE.litia,
    enfeitar: ({ tronco }) => {
      const pedra = mat(0x8a8070, { roughness: 0.95 });
      for (let i = 0; i < 4; i++) tronco.add(em(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08 + (i % 2) * 0.06, 0.1), pedra), (i % 2 ? 1 : -1) * 0.08, 0.28, 0.25 - i * 0.15, 0, i * 0.4, 0));
      const coluna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.26, 8), pedra);
      tronco.add(em(coluna, 0.1, 0.38, -0.1, 0.3, 0, 0.2));
      for (let i = 0; i < 7; i++) tronco.add(em(bola(0.04, mat(0x4a5a2a), 1, 0.4, 1), Math.cos(i * 2) * 0.22, 0.2, -0.3 + i * 0.1));
      const g = new THREE.Group();
      em(g, 0, 0.3, -0.42);
      cristais(g, 4, 0.03, 0.12, vidro(SOTAQUE.litia, 0.9, 0.6), 410, 0.5);
      tronco.add(g);
    },
  }),
};

function dragao(tipo: keyof typeof VESTES): () => Fera {
  return () => {
    const v = (VESTES[tipo] ?? VESTES.fornalha)?.() as Veste;
    const { grupo, raiz } = raizDe();
    const H = 0.62;
    const L = v.largura ?? 1;
    const apoio = pivo('apoio', raiz, 0, H, 0);
    const tronco = pivo('tronco', apoio);
    tronco.add(em(bola(0.32, v.escama, L, 0.85, 1.35), 0, 0.05, 0));
    tronco.add(em(bola(0.26, v.barriga, L * 0.85, 0.7, 1.2), 0, -0.07, 0.05));
    for (let i = 0; i < 7; i++) tronco.add(em(cone(0.035, 0.12, v.chifre, 4), 0, 0.3, 0.32 - i * 0.11, -0.4));
    // O pescoço em cinco segmentos, cada um um pivô (o S do pescoço no conjurar e o bote no golpe).
    const pescoco: THREE.Group[] = [];
    let pai: THREE.Object3D = tronco;
    let z = 0.38;
    for (let i = 0; i < 5; i++) {
      const p = pivo(`pescoco${String(i)}`, pai, 0, i === 0 ? 0.12 : 0.06, i === 0 ? z : 0.12);
      p.add(em(bola(0.1 - i * 0.008, v.escama, L * 0.9, 0.9, 1.3), 0, 0, 0.05));
      p.add(em(cone(0.025, 0.08, v.chifre, 4), 0, 0.09, 0.04, -0.4));
      pescoco.push(p);
      pai = p;
      z = 0.12;
    }
    const cabeca = pivo('cabeca', pai, 0, 0.06, 0.14);
    cabeca.add(bola(0.12, v.escama, 0.9, 0.75, 1.3));
    cabeca.add(em(bola(0.085, v.escama, 0.85, 0.55, 1.6), 0, -0.02, 0.15));
    olhos(cabeca, { x: 0.07, y: 0.04, z: 0.07, r: 0.022, cor: v.olho, forca: 2.4 });
    for (const s of [-1, 1]) {
      const c = cone(0.03, 0.28, v.chifre, 6);
      cabeca.add(em(c, s * 0.07, 0.1, -0.1, -2.2, 0, s * 0.35));
      cabeca.add(em(cone(0.018, 0.14, v.chifre, 5), s * 0.09, 0.02, -0.08, -2, 0, s * 0.9));
    }
    const mandibula = pivo('mandibula', cabeca, 0, -0.06, 0.02);
    mandibula.add(em(bola(0.07, v.barriga, 0.8, 0.35, 1.8), 0, -0.01, 0.13));
    for (let i = 0; i < 6; i++) mandibula.add(em(cone(0.008, 0.03, mat(0xe0d8c0), 4), (i % 2 ? 1 : -1) * 0.04, 0.02, 0.06 + i * 0.03));
    const bafo = pivo('bafo', cabeca, 0, -0.04, 0.3);
    bafo.add(bola(0.05, brilho(v.olho, 1.1, { transparent: true, opacity: 0.6 })));
    bafo.scale.setScalar(0.01);
    // A cauda em seis segmentos que afinam.
    const cauda: THREE.Group[] = [];
    pai = tronco;
    for (let i = 0; i < 6; i++) {
      const p = pivo(`cauda${String(i)}`, pai, 0, i === 0 ? 0.02 : 0, i === 0 ? -0.42 : -0.16);
      p.add(em(bola(0.1 - i * 0.014, v.escama, L * 0.9, 0.85, 1.5), 0, 0, -0.07));
      if (i === 5) p.add(em(cone(0.06, 0.18, v.chifre, 4), 0, 0, -0.2, -Math.PI / 2));
      cauda.push(p);
      pai = p;
    }
    const asas = [-1, 1].map((s) => {
      const a = pivo(s > 0 ? 'asaD' : 'asaE', tronco, s * 0.2, 0.22, 0.1);
      asaDeMembrana(a, s, 0.95, v.chifre, v.membrana);
      return a;
    });
    const ps: Perna[] = pernas(tronco, [[-0.2, -0.1, 0.25, 0], [0.2, -0.1, 0.25, Math.PI], [-0.2, -0.08, -0.25, Math.PI], [0.2, -0.08, -0.25, 0]], { coxa: v.escama, pe: v.barriga, garra: v.chifre }, { r: 0.08, coxa: 0.28, canela: 0.28, pata: 0.07 });
    v.enfeitar({ tronco, cabeca, pescoco, cauda, asas });
    return {
      grupo,
      animar(e: EstadoFera, f: number) {
        raiz.position.set(0, 0, 0);
        raiz.rotation.set(0, 0, 0);
        apoio.position.set(0, H, 0);
        apoio.rotation.set(0, 0, 0);
        mandibula.rotation.set(0, 0, 0);
        bafo.scale.setScalar(0.01);
        for (const [i, p] of pescoco.entries()) p.rotation.set(i === 0 ? -0.5 : 0.12, 0, 0);
        cabeca.rotation.set(0.5, 0, 0);
        for (const [i, c] of cauda.entries()) c.rotation.set(0.05, 0.15 * ciclo(f, i * 0.6), 0);
        for (const [k, a] of asas.entries()) a.rotation.set(0, 0, (k ? -1 : 1) * -0.9);
        for (const p of ps) { p.coxa.rotation.set(0, 0, 0); p.canela.rotation.set(0, 0, 0); }
        if (e === 'parado') {
          tronco.scale.set(1, 1 + 0.03 * ciclo(f), 1);
          for (const [i, p] of pescoco.entries()) p.rotation.y = 0.08 * ciclo(f, i * 0.3);
          for (const [k, a] of asas.entries()) a.rotation.z = (k ? -1 : 1) * (-0.9 + 0.08 * ciclo(f));
        } else if (e === 'andar' || e === 'correr') {
          apoio.position.y = H + 0.03 * Math.abs(ciclo(f));
          for (const p of ps) {
            const s = ciclo(f, p.fase);
            p.coxa.rotation.x = 0.45 * s;
            p.canela.rotation.x = (p.frente ? -0.6 : 0.6) * Math.max(0, -s);
          }
          for (const [k, a] of asas.entries()) a.rotation.z = (k ? -1 : 1) * (-0.7 + 0.2 * ciclo(f * 2));
        } else if (e === 'golpe' || e === 'golpe2' || e === 'golpe3') {
          // O bote: o pescoço recolhe e lança a cabeça, a mandíbula fecha no fim.
          const carga = suave(f / 0.4);
          const b = f < 0.4 ? 0 : Math.sin(((f - 0.4) / 0.6) * Math.PI);
          for (const [i, p] of pescoco.entries()) p.rotation.x = (i === 0 ? -0.5 : 0.12) - 0.25 * carga * (1 - b) + 0.22 * b;
          cabeca.rotation.x = 0.5 + 0.3 * b;
          mandibula.rotation.x = 0.6 * Math.sin(Math.min(1, f / 0.85) * Math.PI);
          apoio.position.z = 0.15 * b;
        } else if (e === 'conjurar') {
          // Ergue-se nas patas de trás, abre as asas e solta o sopro da dimensão.
          const u = suave(f * 2.2);
          apoio.rotation.x = -0.45 * u;
          for (const [i, p] of pescoco.entries()) p.rotation.x = (i === 0 ? -0.8 : 0.05) * u + (i === 0 ? -0.5 : 0.12) * (1 - u);
          cabeca.rotation.x = 0.5 + 0.4 * u;
          mandibula.rotation.x = 0.7 * u;
          bafo.scale.setScalar(0.01 + 2.5 * u * (0.8 + 0.2 * ciclo(f * 4)));
          for (const [k, a] of asas.entries()) a.rotation.z = (k ? -1 : 1) * (0.3 * u - 0.9 * (1 - u) + 0.15 * ciclo(f * 3));
          for (const p of ps) if (p.frente) p.coxa.rotation.x = -0.6 * u;
        } else {
          raiz.rotation.z = (Math.PI / 2.4) * suave(f);
          apoio.position.y = H * (1 - 0.55 * suave(f));
          for (const [i, p] of pescoco.entries()) p.rotation.x = (i === 0 ? -0.5 : 0.12) + 0.25 * f;
          for (const [k, a] of asas.entries()) a.rotation.z = (k ? -1 : 1) * (-0.9 + 0.8 * f);
          mandibula.rotation.x = 0.3 * f;
        }
      },
    };
  };
}

export const dragaoDaFornalha = dragao('fornalha');
export const dragaoDoSilencio = dragao('silencio');
export const dragaoEngrenado = dragao('engrenado');
export const dragaoFermentado = dragao('fermentado');
export const dragaoDasRuinas = dragao('ruinas');
