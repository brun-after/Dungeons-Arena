// As feras sem modelo CC0 nos pacotes baixados (marco 32, 31/10/2026, D-131): o lobo, a aranha e o falcão, de peças
// rígidas (corpo, cabeça, pernas e asas em pivôs) animadas por rotação, como o slime (criaturas3d.ts). Olham para +z.

import * as THREE from 'three';
import type { Criatura } from './criaturas3d';

function mat(cor: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: cor, roughness: 0.75, ...o });
}

/** Um pivô com um segmento pendurado para baixo (`compr`), para as pernas. */
function segmento(raio: number, compr: number, m: THREE.Material, raioFim = raio): THREE.Group {
  const pivo = new THREE.Group();
  const geo = new THREE.CylinderGeometry(raioFim, raio, compr, 7);
  geo.translate(0, -compr / 2, 0);
  pivo.add(new THREE.Mesh(geo, m));
  return pivo;
}

function bola(r: number, m: THREE.Material, sx = 1, sy = 1, sz = 1): THREE.Mesh {
  const b = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m);
  b.scale.set(sx, sy, sz);
  return b;
}

const ciclo = (f: number, fase = 0) => Math.sin(f * Math.PI * 2 + fase);

/** O lobo: o corpo cinza, a cabeça de focinho longo, as quatro pernas de duas partes e o rabo. Trota, morde, uiva. */
export function lobo(): Criatura {
  const grupo = new THREE.Group();
  const raiz = new THREE.Group();
  grupo.add(raiz);
  const pelo = mat(0x6f7682);
  const dorso = mat(0x4b505a);
  const claro = mat(0xa8aeb6);
  const tronco = new THREE.Group();
  raiz.add(tronco);
  tronco.add(bola(0.2, pelo, 1, 0.95, 2.1));
  const peito = bola(0.2, claro, 1.05, 1.1, 1);
  peito.position.set(0, -0.02, 0.24);
  tronco.add(peito);
  const costas = bola(0.16, dorso, 1, 0.6, 1.9);
  costas.position.y = 0.1;
  tronco.add(costas);
  const cabeca = new THREE.Group();
  cabeca.position.set(0, 0.16, 0.42);
  tronco.add(cabeca);
  cabeca.add(bola(0.13, pelo, 1, 0.95, 1.1));
  const focinho = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.24, 8), claro);
  focinho.rotation.x = Math.PI / 2;
  focinho.position.set(0, -0.04, 0.17);
  cabeca.add(focinho);
  const nariz = bola(0.025, mat(0x111111, { roughness: 0.3 }));
  nariz.position.set(0, -0.03, 0.29);
  cabeca.add(nariz);
  for (const s of [-1, 1]) {
    const orelha = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 4), dorso);
    orelha.position.set(s * 0.07, 0.13, -0.02);
    orelha.rotation.z = -s * 0.25;
    cabeca.add(orelha);
    const olho = bola(0.02, mat(0xf1c40f, { emissive: 0xc08a00, emissiveIntensity: 0.8 }));
    olho.position.set(s * 0.06, 0.03, 0.1);
    cabeca.add(olho);
  }
  const pernas: { coxa: THREE.Group; canela: THREE.Group; fase: number; frente: boolean }[] = [];
  for (const [x, z, fase] of [
    [-0.11, 0.28, 0],
    [0.11, 0.28, Math.PI],
    [-0.11, -0.3, Math.PI],
    [0.11, -0.3, 0],
  ] as const) {
    const coxa = segmento(0.05, 0.24, pelo, 0.035);
    coxa.position.set(x, -0.05, z);
    tronco.add(coxa);
    const canela = segmento(0.033, 0.24, dorso, 0.028);
    canela.position.y = -0.24;
    coxa.add(canela);
    const pata = bola(0.035, dorso, 1, 0.6, 1.4);
    pata.position.set(0, -0.24, 0.02);
    canela.add(pata);
    pernas.push({ coxa, canela, fase, frente: z > 0 });
  }
  const rabo = segmento(0.05, 0.32, pelo, 0.025);
  rabo.position.set(0, 0.05, -0.4);
  tronco.add(rabo);
  return {
    grupo,
    animar(estado, f) {
      raiz.position.set(0, 0, 0);
      raiz.rotation.set(0, 0, 0);
      tronco.position.set(0, 0.52, 0);
      tronco.rotation.set(0, 0, 0);
      tronco.scale.set(1, 1, 1);
      cabeca.rotation.set(0, 0, 0);
      rabo.rotation.set(-2.2, 0, 0.25 * ciclo(f));
      for (const p of pernas) {
        p.coxa.rotation.set(0, 0, 0);
        p.canela.rotation.set(0, 0, 0);
      }
      if (estado === 'parado') {
        tronco.scale.set(1, 1 + 0.02 * ciclo(f), 1);
        cabeca.rotation.x = 0.05 * ciclo(f);
      } else if (estado === 'andar') {
        tronco.position.y = 0.52 + 0.025 * Math.abs(ciclo(f));
        for (const p of pernas) {
          const a = ciclo(f, p.fase);
          p.coxa.rotation.x = 0.55 * a;
          p.canela.rotation.x = (p.frente ? -1 : 1) * 0.6 * Math.max(0, -a);
        }
        rabo.rotation.x = -2.0;
      } else if (estado === 'golpe') {
        const bote = Math.sin(f * Math.PI);
        tronco.position.z = bote * 0.28;
        tronco.rotation.x = -bote * 0.25;
        cabeca.rotation.x = bote * 0.5;
        for (const p of pernas) if (p.frente) p.coxa.rotation.x = -bote * 0.9;
      } else if (estado === 'conjurar') {
        // O uivo: a cabeça para o alto, sentado nas patas de trás.
        const u = Math.min(1, f * 2);
        tronco.rotation.x = -0.45 * u;
        tronco.position.y = 0.48;
        cabeca.rotation.x = -0.8 * u;
        for (const p of pernas) if (!p.frente) p.coxa.rotation.x = 1.0 * u;
      } else {
        // Cai de lado.
        raiz.rotation.z = (Math.PI / 2) * f;
        raiz.position.y = 0.2 * f;
        tronco.position.y = 0.52 - 0.3 * f;
        for (const p of pernas) p.coxa.rotation.x = 0.3 * f * (p.frente ? -1 : 1);
      }
    },
  };
}

/** A aranha: o abdome grande com a marca, o tórax com os olhos vermelhos e as oito pernas articuladas. */
export function aranha(): Criatura {
  const grupo = new THREE.Group();
  const raiz = new THREE.Group();
  grupo.add(raiz);
  const casca = mat(0x4a3560, { roughness: 0.4 });
  const escura = mat(0x2c2038, { roughness: 0.5 });
  const corpo = new THREE.Group();
  raiz.add(corpo);
  const torax = bola(0.14, casca, 1, 0.8, 1.1);
  torax.position.z = 0.12;
  corpo.add(torax);
  const abdome = new THREE.Group();
  abdome.position.set(0, 0.06, -0.2);
  corpo.add(abdome);
  abdome.add(bola(0.22, casca, 1, 0.85, 1.2));
  const marca = bola(0.07, mat(0xc0392b, { emissive: 0x7a1010, emissiveIntensity: 0.6 }), 1, 0.4, 1.5);
  marca.position.set(0, 0.17, -0.02);
  abdome.add(marca);
  const olhos = mat(0xff3030, { emissive: 0xff2020, emissiveIntensity: 1.1, roughness: 0.2 });
  for (const [x, y] of [
    [-0.045, 0.05],
    [0.045, 0.05],
    [-0.08, 0.02],
    [0.08, 0.02],
  ] as const) {
    const o = bola(0.022, olhos);
    o.position.set(x, y, 0.26);
    corpo.add(o);
  }
  for (const s of [-1, 1]) {
    const presa = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.08, 5), escura);
    presa.position.set(s * 0.04, -0.06, 0.26);
    presa.rotation.x = Math.PI;
    corpo.add(presa);
  }
  // Cada perna: o quadril gira para o lado (de trás para a frente), a coxa sobe para fora e a canela desce ao chão.
  const pernas: { coxa: THREE.Group; canela: THREE.Group; fase: number; frente: boolean }[] = [];
  [-0.9, -0.3, 0.3, 0.9].forEach((abre, i) => {
    for (const lado of [-1, 1]) {
      const quadril = new THREE.Group();
      quadril.position.set(lado * 0.09, 0, 0.1 + abre * 0.05);
      quadril.rotation.y = lado * (Math.PI / 2 - abre * 0.6);
      corpo.add(quadril);
      const coxa = segmento(0.022, 0.26, casca, 0.018);
      quadril.add(coxa);
      const canela = segmento(0.018, 0.36, escura, 0.007);
      canela.position.y = -0.26;
      coxa.add(canela);
      pernas.push({ coxa, canela, fase: (i + (lado > 0 ? 1 : 0)) % 2 === 0 ? 0 : Math.PI, frente: abre > 0.5 });
    }
  });
  return {
    grupo,
    animar(estado, f) {
      raiz.rotation.set(0, 0, 0);
      raiz.position.set(0, 0, 0);
      corpo.position.set(0, 0.17, 0);
      corpo.rotation.set(0, 0, 0);
      abdome.scale.setScalar(1);
      for (const p of pernas) {
        // Em volta do eixo z do quadril (já virado para o lado): a coxa para cima e para fora, a canela para baixo.
        p.coxa.rotation.set(0, 0, 0);
        p.coxa.rotation.x = -2.2;
        p.canela.rotation.set(0, 0, 0);
        p.canela.rotation.x = 1.7;
      }
      if (estado === 'parado') {
        corpo.position.y = 0.17 + 0.01 * ciclo(f);
        abdome.scale.setScalar(1 + 0.03 * ciclo(f));
      } else if (estado === 'andar') {
        corpo.position.y = 0.17 + 0.012 * ciclo(f * 2);
        for (const p of pernas) {
          const a = ciclo(f, p.fase);
          p.coxa.rotation.z = 0.35 * a;
          p.coxa.rotation.x = -2.2 - 0.25 * Math.max(0, a);
        }
      } else if (estado === 'golpe') {
        // Ergue as pernas da frente e dá o bote.
        const bote = Math.sin(f * Math.PI);
        corpo.rotation.x = -0.45 * bote;
        corpo.position.z = 0.15 * bote;
        for (const p of pernas) if (p.frente) p.coxa.rotation.x = -2.2 - 0.9 * bote;
      } else if (estado === 'conjurar') {
        abdome.scale.setScalar(1.08 + 0.06 * ciclo(f));
        corpo.rotation.x = 0.15;
      } else {
        // Vira de costas e encolhe as pernas.
        const v = Math.min(1, f * 1.4);
        raiz.rotation.z = Math.PI * v;
        raiz.position.y = 0.4 * v;
        for (const p of pernas) {
          p.coxa.rotation.x = -2.2 + 0.8 * f;
          p.canela.rotation.x = 1.7 + 0.6 * f;
        }
      }
    },
  };
}

/** O falcão: o corpo marrom, a cabeça de bico amarelo, as asas de duas partes e a cauda em leque. */
export function falcao(): Criatura {
  const grupo = new THREE.Group();
  const raiz = new THREE.Group();
  grupo.add(raiz);
  const penas = mat(0x8b5a2b);
  const escuras = mat(0x5a3a1c);
  const claras = mat(0xe8dcc0);
  const corpo = new THREE.Group();
  raiz.add(corpo);
  corpo.add(bola(0.1, penas, 1, 0.95, 1.8));
  const peito = bola(0.08, claras, 1, 1, 1.2);
  peito.position.set(0, -0.03, 0.06);
  corpo.add(peito);
  const cabeca = new THREE.Group();
  cabeca.position.set(0, 0.07, 0.17);
  corpo.add(cabeca);
  cabeca.add(bola(0.07, penas));
  const bico = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 6), mat(0xe1b12c, { roughness: 0.4 }));
  bico.rotation.x = Math.PI / 2 + 0.4;
  bico.position.set(0, -0.015, 0.075);
  cabeca.add(bico);
  for (const s of [-1, 1]) {
    const olho = bola(0.014, mat(0x111111, { roughness: 0.2 }));
    olho.position.set(s * 0.04, 0.015, 0.045);
    cabeca.add(olho);
  }
  const cauda = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 3), escuras);
  cauda.rotation.x = -Math.PI / 2;
  cauda.scale.set(1, 1, 0.25);
  cauda.position.set(0, 0, -0.24);
  corpo.add(cauda);
  const asas: { ombro: THREE.Group; ponta: THREE.Group; lado: number }[] = [];
  for (const lado of [-1, 1]) {
    const ombro = new THREE.Group();
    ombro.position.set(lado * 0.07, 0.04, 0.02);
    corpo.add(ombro);
    const braco = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.016, 0.13), penas);
    braco.position.x = lado * 0.11;
    ombro.add(braco);
    const ponta = new THREE.Group();
    ponta.position.x = lado * 0.22;
    ombro.add(ponta);
    const pena = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.11), escuras);
    pena.position.set(lado * 0.1, 0, -0.02);
    ponta.add(pena);
    asas.push({ ombro, ponta, lado });
  }
  return {
    grupo,
    animar(estado, f) {
      raiz.rotation.set(0, 0, 0);
      raiz.position.set(0, 0, 0);
      corpo.rotation.set(0, 0, 0);
      corpo.position.set(0, 0.35, 0);
      const bater = (amplo: number) => {
        for (const a of asas) {
          const v = ciclo(f);
          a.ombro.rotation.set(0, 0, a.lado * amplo * v);
          a.ponta.rotation.set(0, 0, a.lado * amplo * 0.6 * v);
        }
      };
      if (estado === 'parado') {
        bater(0.45);
        corpo.position.y = 0.35 + 0.02 * ciclo(f, Math.PI / 2);
      } else if (estado === 'andar') {
        bater(0.75);
        corpo.rotation.x = 0.15;
      } else if (estado === 'golpe') {
        // O mergulho: as asas para trás e as garras na frente.
        const m = Math.sin(f * Math.PI);
        corpo.rotation.x = 0.7 * m;
        corpo.position.z = 0.15 * m;
        for (const a of asas) {
          a.ombro.rotation.set(0, -a.lado * 0.9 * m, a.lado * 0.3);
          a.ponta.rotation.set(0, 0, 0);
        }
      } else if (estado === 'conjurar') {
        for (const a of asas) {
          a.ombro.rotation.set(0, 0, a.lado * (0.6 + 0.15 * ciclo(f)));
          a.ponta.rotation.set(0, 0, a.lado * 0.2);
        }
        corpo.rotation.x = -0.2;
      } else {
        for (const a of asas) {
          a.ombro.rotation.set(0, 0, -a.lado * 0.4 * f);
          a.ponta.rotation.set(0, 0, -a.lado * 1.2 * f);
        }
        raiz.rotation.z = 1.4 * f;
        corpo.position.y = 0.35 - 0.25 * f;
      }
    },
  };
}
