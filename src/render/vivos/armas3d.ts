// As armas em 3D (marco 32, 31/10/2026, D-131): cada desenho do jogo (modelos/armas-classe.ts e bipede.ts) vira um
// modelo de geometria simples com as mesmas formas, e cada grau de raridade o deixa mais enfeitado. Medidas em
// células; o cabo na origem, a arma para +y, a face larga para +z (para a câmera).
//
// 04/11/2026 (marco 37): no estilo sombrio. As cores dos desenhos saem dessaturadas e escurecidas (madeira gasta,
// couro velho), o metal ganha a textura de riscos e a rugosidade do kit sombrio (sombrio-base.ts), e o grau muda o
// material e o ornamento, não o tamanho: ferro e aço gasto (comum), latão nos enfeites (incomum), aço polido e a pedra
// apagada (raro, épico), o ouro velho e as runas acesas (lendário), e o aço enegrecido com o fio em brasa (última).
// Os cristais flutuantes e o ouro amarelo vivo saíram; o crescimento por grau caiu de 42% para 18%.

import * as THREE from 'three';
import { TOMOS, tomoFechado } from '../equipamento-3d';
import { metal } from './sombrio-base';

/** Quanto a arma cresce por grau (0 = comum … 5 = última). */
export const ESCALA_DO_GRAU = [1, 1.03, 1.06, 1.1, 1.14, 1.18] as const;
/** O brilho de cada grau: cinza, musgo, azul pálido, violeta pálido, ouro e brasa (o acento da raridade, sóbrio). */
export const ACENTOS_SOMBRIOS = [0x8a8a8a, 0x9aa88a, 0x8fb0d8, 0xa890c8, 0xe0b060, 0xff8a3a] as const;

const ACO = 0x8a8d94;
const ACO_ESCURO = 0x5a5e66;
const MADEIRA = 0x5e4630;
const MADEIRA_ESCURA = 0x3e2e22;
const COURO = 0x4a3424;
const OSSO = 0xcfc6b0;
const OURO = 0x9a7a3e;
const LATAO = 0x7e6236;
const FERRO = 0x3a3836;

/** A cor sóbria: menos saturada e mais escura (as cores vivas dos desenhos antigos). */
function sobrio(cor: number, s = 0.45, l = 0.72): number {
  const c = new THREE.Color(cor);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s * s, hsl.l * l);
  return c.getHex();
}

type P = [number, number];

export class Kit {
  readonly g = new THREE.Group();
  /** O acento do grau (ACENTOS_SOMBRIOS); o `acento` pedido (a cor da raridade) fica só para quem não tem grau. */
  readonly acento: number;
  constructor(
    readonly n: number,
    acento: number,
    readonly fechado = false,
  ) {
    this.acento = ACENTOS_SOMBRIOS[n] ?? acento;
  }

  /** O material: as cores lisas ficam sóbrias; o metal (metalness ≥ 0,3) ganha os riscos e a rugosidade do kit. */
  mat(cor: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
    const metalico = (o.metalness ?? 0) >= 0.3;
    const aceso = o.emissive !== undefined;
    const base = aceso ? sobrio(cor, 0.6, 0.9) : metalico ? cor : sobrio(cor);
    const m = new THREE.MeshStandardMaterial({ roughness: 0.6, ...o, color: base, ...(aceso ? { emissive: sobrio(cor, 0.6, 0.9) } : {}) });
    if (metalico) {
      const riscos = metal('#d0d0d0', 211, 0.9, 0.4);
      m.map = riscos.map;
      m.roughnessMap = riscos.roughnessMap;
      m.metalness = Math.max(m.metalness, 0.8);
    }
    return m;
  }
  /** O aço da lâmina pelo grau: gasto (comum), polido (raro e épico), escuro (lendário) e enegrecido (última). */
  aco(base = ACO): THREE.Material {
    const cor = sobrio(base, 0.35, 1);
    if (this.n >= 5) return this.mat(0x2e2c30, { metalness: 0.85, roughness: 0.38 });
    if (this.n >= 4) return this.mat(0x5a5a62, { metalness: 0.9, roughness: 0.3 });
    if (this.n >= 2) return this.mat(cor, { metalness: 0.9, roughness: 0.28 });
    return this.mat(cor, { metalness: 0.85, roughness: 0.5 });
  }
  /** Os enfeites: ferro (comum), latão (incomum a épico) e ouro velho (lendário em diante). */
  enfeite(): THREE.Material {
    return this.mat(this.n >= 4 ? OURO : this.n >= 1 ? LATAO : FERRO, { metalness: 0.9, roughness: 0.4 });
  }
  brilho(cor = this.acento, forca = 0.35 + 0.25 * Math.max(0, this.n - 2)): THREE.Material {
    return this.mat(cor, { emissive: cor, emissiveIntensity: forca, roughness: 0.3 });
  }

  add<T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0): T {
    o.position.set(x, y, z);
    this.g.add(o);
    return o;
  }
  cil(r: number, y0: number, y1: number, m: THREE.Material, x = 0, z = 0, r2 = r): THREE.Mesh {
    return this.add(new THREE.Mesh(new THREE.CylinderGeometry(r2, r, y1 - y0, 8), m), x, (y0 + y1) / 2, z);
  }
  bola(r: number, m: THREE.Material, x: number, y: number, z = 0, detalhe = 1): THREE.Mesh {
    return this.add(new THREE.Mesh(new THREE.IcosahedronGeometry(r, detalhe), m), x, y, z);
  }
  caixa(l: number, a: number, p: number, m: THREE.Material, x: number, y: number, z = 0, giro = 0): THREE.Mesh {
    const c = this.add(new THREE.Mesh(new THREE.BoxGeometry(l, a, p), m), x, y, z);
    c.rotation.z = giro;
    return c;
  }
  /** Um perfil plano extrudado (a lâmina, a cabeça do machado), centrado na espessura. */
  perfil(pts: P[], esp: number, m: THREE.Material, z = 0): THREE.Mesh {
    const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(s, { depth: esp, bevelEnabled: true, bevelThickness: esp * 0.35, bevelSize: esp * 0.3, bevelSegments: 3 });
    geo.translate(0, 0, -esp / 2);
    return this.add(new THREE.Mesh(geo, m), 0, 0, z);
  }
  /** Um arco de toro no plano da face (o arco, a lâmina curva, o aro). */
  curva(raio: number, abertura: number, tubo: number, m: THREE.Material, x: number, y: number, giro: number, achatar = 1): THREE.Mesh {
    const t = this.add(new THREE.Mesh(new THREE.TorusGeometry(raio, tubo, 6, 20, abertura), m), x, y);
    t.rotation.z = giro;
    t.scale.z = achatar;
    return t;
  }

  // --- Os enfeites por grau, iguais para todas as armas.

  /** O cabo com o couro e, do incomum em diante, as faixas de metal. */
  cabo(y0: number, y1: number, r = 0.018, cor = COURO): void {
    this.cil(r, y0, y1, this.mat(cor, { roughness: 0.85 }));
    const costura = this.mat(0x34241d, { roughness: 0.95 });
    const passos = Math.min(12, Math.ceil((y1 - y0) / 0.018));
    for (let i = 0; i < passos; i++) {
      const y = y0 + (y1 - y0) * (i + 0.5) / passos;
      const volta = this.add(new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, r * 0.065, 5, 14), costura), 0, y);
      volta.rotation.x = Math.PI / 2 + 0.16;
    }
    if (this.n >= 1) for (const y of [y0 + 0.01, y1 - 0.01]) this.cil(r * 1.35, y - 0.008, y + 0.008, this.enfeite());
  }
  /** O pomo: uma bola de metal; do raro em diante, a gema da raridade. */
  pomo(y: number, r = 0.022): void {
    if (this.n >= 2) this.bola(r * 1.1, this.brilho(), 0, y);
    else this.bola(r, this.enfeite(), 0, y, 0, 0);
  }
  /** A guarda: a barra; do épico em diante, com asas para cima; no lendário, com a gema no meio. */
  guarda(larg: number, y: number): void {
    const l = larg * (1 + 0.12 * this.n);
    this.caixa(l, 0.024, 0.03, this.enfeite(), 0, y);
    if (this.n >= 3) {
      for (const lado of [-1, 1]) {
        const asa = this.add(new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.07 + 0.012 * this.n, 5), this.enfeite()), (lado * l) / 2, y + 0.025);
        asa.rotation.z = -lado * 0.5;
      }
    }
    if (this.n >= 4) this.bola(0.018, this.brilho(), 0, y, 0.02);
  }
  /** As runas acesas no meio da lâmina (lendário em diante), nas duas faces. */
  runas(y0: number, y1: number, esp: number, x = 0): void {
    if (this.n < 4) return;
    const passos = 3 + this.n;
    for (let i = 0; i < passos; i++) {
      const y = y0 + ((y1 - y0) * (i + 0.5)) / passos;
      for (const z of [-1, 1]) this.caixa(0.012, ((y1 - y0) / passos) * 0.55, 0.004, this.brilho(), x, y, z * (esp / 2 + 0.006));
    }
  }
  /** Espinhos de metal (lendário em diante) em volta de um ponto. */
  espinhos(x: number, y: number, raio: number, quantos = 4): void {
    if (this.n < 4) return;
    for (let i = 0; i < quantos; i++) {
      const a = (i / quantos) * Math.PI * 2;
      const e = this.add(new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.05, 4), this.enfeite()), x + Math.cos(a) * raio, y + Math.sin(a) * raio);
      e.rotation.z = a - Math.PI / 2;
    }
  }
  /** A última: em vez dos cristais flutuantes, três brasas cravadas perto do ponto (o fio aceso fica em `lamina`). */
  cristais(x: number, y: number, raio: number): void {
    if (this.n < 5) return;
    for (let i = 0; i < 3; i++) {
      const c = this.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.012), this.brilho(this.acento, 1.2)), x + (i - 1) * raio * 0.15, y - i * raio * 0.2, 0.012);
      c.scale.y = 1.6;
    }
  }
}

/** A lâmina reta (com ponta) de `y0` a `y0 + compr`. */
function lamina(k: Kit, y0: number, compr: number, larg: number, cor = ACO, curva = 0): void {
  const l = larg / 2;
  const pts: P[] = [
    [-l, y0],
    [l, y0],
    [l + curva * 0.6, y0 + compr * 0.82],
    [curva, y0 + compr],
    [-l + curva * 0.6, y0 + compr * 0.82],
  ];
  k.perfil(pts, 0.006, k.mat(cor, { metalness: 0.35, roughness: 0.46 }));
  // O fio claro aparece nas duas faces, ao redor do corpo escuro da lâmina.
  const alma: P[] = [
    [-l * 0.63, y0], [l * 0.63, y0],
    [l * 0.6 + curva * 0.6, y0 + compr * 0.82],
    [curva * 0.91, y0 + compr * 0.95],
    [-l * 0.6 + curva * 0.6, y0 + compr * 0.82],
  ];
  k.perfil(alma, 0.015, k.mat(k.n >= 5 ? 0x302b38 : 0x55535a, { metalness: 0.34, roughness: 0.58 }));
  for (const lado of [-1, 1]) {
    k.caixa(larg * 0.11, compr * 0.64, 0.001, k.mat(0x39353a), curva * 0.24, y0 + compr * 0.35, lado * 0.009, -curva / compr * 0.75);
  }
  k.runas(y0 + compr * 0.1, y0 + compr * 0.75, 0.011, curva * 0.3);
  if (k.n >= 5) {
    // a última: o fio em brasa, um contorno aceso logo atrás do aço
    const contorno: P[] = pts.map(([x, y]) => [x * 1.18 + curva * 0.02, y0 + (y - y0) * 1.015]);
    k.perfil(contorno, 0.003, k.brilho(k.acento, 0.9));
  }
}

function espadaComum(k: Kit, compr: number, larg: number, guarda: number, cor = ACO): void {
  k.cabo(-0.09, 0.03);
  k.pomo(-0.1);
  k.guarda(guarda, 0.04);
  lamina(k, 0.05, compr, larg, cor);
  k.cristais(0, 0.05 + compr * 0.6, 0.09);
}

function haste(k: Kit, y0: number, y1: number, cor: number, r = 0.016): void {
  k.cil(r, y0, y1, k.mat(cor, { roughness: 0.8 }));
  if (k.n >= 1) for (const y of [y0 + 0.04, (y0 + y1) / 2]) k.cil(r * 1.4, y - 0.01, y + 0.01, k.enfeite());
}

function machadoDe(k: Kit, alto: number, cor = 0xbdc3c7, cabo = COURO): void {
  haste(k, -0.12, alto, cabo, 0.02);
  const y = alto - 0.08;
  const t = 0.12 + 0.015 * k.n;
  k.perfil([[0, y - 0.04], [t, y - 0.09], [t + 0.03, y + 0.02], [t, y + 0.11], [0, y + 0.05]], 0.02, k.aco(cor));
  if (k.n >= 3) k.perfil([[0, y - 0.02], [-t * 0.6, y - 0.06], [-t * 0.7, y + 0.03], [-t * 0.6, y + 0.08], [0, y + 0.04]], 0.02, k.aco(cor));
  k.runas(y - 0.03, y + 0.06, 0.02, t * 0.55);
  k.espinhos(0, alto + 0.02, 0.03, 3);
  k.cristais(t * 0.5, y, 0.12);
  if (k.n >= 2) k.bola(0.02, k.brilho(), 0, y, 0.02);
}

function arcoDe(k: Kit, alto: number, curva: number, cor: number, pontas = false): void {
  // O arco simétrico em volta do cabo (na origem), aberto para +x, e a corda reta.
  const raio = (alto * alto + curva * curva) / (2 * curva);
  const ang = Math.asin(Math.min(1, alto / raio));
  const madeira = k.mat(cor, { roughness: 0.7 });
  k.curva(raio, ang * 2, 0.016 + 0.002 * k.n, madeira, curva - raio, 0, -ang);
  const pontaX = curva - raio + raio * Math.cos(ang);
  k.cil(0.0035, -alto, alto, k.mat(0xe5e1d8), pontaX);
  k.cil(0.024, -0.05, 0.05, k.mat(COURO, { roughness: 0.85 }), curva);
  if (pontas || k.n >= 3) for (const s of [-1, 1]) k.add(new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.06, 5), pontas ? k.mat(OSSO) : k.enfeite()), pontaX, s * (alto + 0.025)).rotation.z = s > 0 ? 0 : Math.PI;
  if (k.n >= 2) k.bola(0.018, k.brilho(), curva + 0.02, 0, 0.02);
  if (k.n >= 4) for (const s of [-1, 1]) k.curva(0.05, Math.PI, 0.008, k.enfeite(), curva - 0.01, s * alto * 0.5, s > 0 ? 0 : Math.PI);
  k.cristais(curva, 0, alto * 0.7);
}

function livroDe(k: Kit, capa: number, simbolo: number): void {
  if (k.fechado) {
    const couro = k.mat(capa, { roughness: 0.89 });
    const papel = k.mat(0xb6a081, { roughness: 0.95 });
    k.caixa(0.18, 0.235, 0.048, papel, 0, -0.107);
    for (const z of [-0.03, 0.03]) k.caixa(0.203, 0.252, 0.014, couro, 0, -0.107, z);
    k.caixa(0.03, 0.25, 0.07, couro, -0.09, -0.107);
    for (const y of [-0.16, -0.062]) {
      k.caixa(0.203, 0.019, 0.076, k.mat(0x39291f), 0, y);
      k.caixa(0.033, 0.022, 0.081, k.enfeite(), 0.065, y);
    }
    k.perfil([[0, -0.08], [0.027, -0.11], [0, -0.14], [-0.027, -0.11]], 0.004, k.mat(simbolo), 0.04);
    return;
  }
  // O livro abre sobre a mão e mostra a espessura do papel nas bordas.
  const l = 0.15;
  const a = 0.2;
  for (const s of [-1, 1]) {
    const c = k.caixa(l, a, 0.02, k.mat(capa, { roughness: 0.7 }), (s * l) / 2, a / 2, -0.012);
    c.rotation.y = -s * 0.55;
    const pag = k.caixa(l * 0.76, a * 0.83, 0.029, k.mat(0xad9979, { roughness: 0.94 }), (s * l) / 2.4, a / 2, 0.006);
    pag.rotation.y = -s * 0.55;
    const tinta = k.mat(0x564138, { roughness: 0.9 });
    for (let linha = 0; linha < 6; linha++) {
      const letra = k.caixa(l * (linha % 3 === 1 ? 0.36 : 0.48), 0.0025, 0.002, tinta,
        s * l / 2.4, a * 0.76 - linha * 0.018, 0.023);
      letra.rotation.y = -s * 0.55;
    }
    if (k.n >= 3) k.caixa(0.014, a * 1.02, 0.024, k.enfeite(), s * l * 0.92, a / 2, -0.02);
  }
  k.caixa(0.03, a, 0.03, k.mat(capa, { roughness: 0.7 }), 0, a / 2, -0.03);
  const fita = k.caixa(0.014, a * 0.66, 0.002, k.mat(simbolo, { roughness: 0.95 }), 0.015, a * 0.21, 0.026);
  fita.rotation.z = -0.16;
  const aberto = new THREE.Group();
  aberto.add(...k.g.children);
  aberto.rotation.set(-0.43, 0.2, -0.12);
  k.g.add(aberto);
}

function cajadoDe(k: Kit, cor: number, cabeca: (y: number) => void, alto = 1.0): void {
  haste(k, -0.35, alto - 0.35, cor, 0.017);
  const y = alto - 0.3;
  // A pedra fica encaixada no metal, com garras e um colar em torno da haste.
  k.cil(0.025, y - 0.15, y - 0.09, k.enfeite(), 0, 0, 0.039);
  for (const lado of [-1, 1]) {
    k.perfil([[lado * 0.02, y - 0.12], [lado * 0.07, y - 0.055],
      [lado * 0.087, y + 0.045], [lado * 0.066, y + 0.018], [lado * 0.05, y - 0.05]],
      0.017, k.enfeite(), 0.027);
  }
  cabeca(y);
  k.espinhos(0, alto - 0.3, 0.07, 4);
  k.cristais(0, alto - 0.3, 0.13);
}

function bumerangueDe(k: Kit, cor: number, serrilha = false, x = 0, y = 0): void {
  const m = k.mat(cor, { roughness: 0.7 });
  const pts: P[] = [[0, 0], [0.04, -0.01], [0.06, 0.18], [0.24, 0.27], [0.22, 0.3], [0.03, 0.21]];
  const v = k.perfil(pts.map(([px, py]) => [px - 0.03, py - 0.12] as P), 0.018, m);
  v.position.set(x, y, 0);
  if (serrilha || k.n >= 3) for (let i = 0; i < 4; i++) k.add(new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.035, 4), k.aco()), x + 0.06 + i * 0.04, y + 0.1 + i * 0.022).rotation.z = 0.6;
  if (k.n >= 2) k.bola(0.018, k.brilho(), x + 0.02, y + 0.07, 0.015);
}

type Construtor = (k: Kit) => void;

/** Espada longa, com seção losangular forjada e guarda curvada. */
function espadaDeGuerra(k: Kit): void {
  const secoes = [[0.06, 0.039, 0.012], [0.25, 0.034, 0.01], [0.53, 0.024, 0.007], [0.66, 0.001, 0.001]] as const;
  const aco = k.mat(k.n >= 4 ? 0x695457 : 0x68676b, { metalness: 0.45, roughness: 0.47, side: THREE.DoubleSide });
  // a última: o fio em brasa
  const fio = k.n >= 5 ? k.brilho(k.acento, 0.9) : k.mat(0xbeb3a6, { metalness: 0.38, roughness: 0.48, side: THREE.DoubleSide });
  for (const lado of [-1, 1]) for (const face of [-1, 1]) {
    const planos = [[], []] as [number[], number[]];
    const cortes = secoes.map(([y, x, z]) => [
      [0, y, face * z], [lado * x * 0.78, y, face * z * 0.52], [lado * x, y, 0],
    ] as const);
    for (const [i, a] of cortes.entries()) {
      const b = cortes[i + 1];
      if (!b) break;
      for (const j of [0, 1] as const) {
        const seguinte = j === 0 ? 1 : 2;
        planos[j].push(...a[j], ...a[seguinte], ...b[seguinte], ...a[j], ...b[seguinte], ...b[j]);
      }
    }
    for (const [i, vertices] of planos.entries()) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      k.add(new THREE.Mesh(geo, i === 0 ? aco : fio));
    }
  }
  k.cabo(-0.126, 0.032, 0.019, 0x4d2420);
  k.perfil([[-0.021, -0.158], [0.021, -0.158], [0.03, -0.133], [0.019, -0.119], [-0.019, -0.119], [-0.03, -0.133]], 0.022, k.enfeite());
  k.perfil([[-0.112, 0.066], [-0.087, 0.067], [-0.048, 0.047], [0.048, 0.047], [0.087, 0.067], [0.112, 0.066], [0.099, 0.04], [0.056, 0.023], [-0.056, 0.023], [-0.099, 0.04]], 0.025, k.enfeite());
}

/** Escudo ogival com dorso de madeira e face arqueada sobre o antebraço. */
function escudoDeGuerra(k: Kit): void {
  const contorno: P[] = [[0, 0.198], [0.075, 0.178], [0.177, 0.151], [0.163, 0.016], [0.124, -0.118], [0.065, -0.216], [0, -0.267], [-0.065, -0.216], [-0.124, -0.118], [-0.163, 0.016], [-0.177, 0.151], [-0.075, 0.178]];
  const curvatura = (x: number) => 0.048 * (1 - (x / 0.18) ** 2);
  const casca = (forma: P[], espessura: number, material: THREE.Material, frente = 0) => {
    const malha = k.perfil(forma, espessura, material, frente);
    const p = malha.geometry.getAttribute('position');
    for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + curvatura(p.getX(i)));
    malha.geometry.computeVertexNormals();
  };
  const aro = k.mat(0x746357, { metalness: 0.37, roughness: 0.54 });
  casca(contorno, 0.026, aro);
  const face: P[] = contorno.map(([x, y]) => [x * 0.89, y * 0.91]);
  casca(face, 0.014, k.mat(k.n >= 3 ? 0x763a33 : 0x514533, { roughness: 0.94 }), 0.013);
  casca(face, 0.012, k.mat(0x523528, { roughness: 0.97 }), -0.014);
  const tinta = k.mat(0xc9ad77, { roughness: 0.93 });
  for (const lado of [-1, 1]) {
    const asa: P[] = [[0.014, 0.004], [0.031, 0.051], [0.092, 0.096], [0.065, 0.036], [0.086, 0.044], [0.058, -0.009], [0.072, 0.001], [0.052, -0.042], [0.017, -0.06]];
    casca(asa.map(([x, y]) => [x * lado, y]), 0.002, tinta, 0.021);
  }
  casca([[0, -0.11], [0.019, -0.074], [0.012, 0.035], [0.028, 0.07], [0, 0.059], [-0.014, 0.031], [-0.017, -0.074]], 0.002, tinta, 0.022);
  const couro = k.mat(0x332019, { roughness: 0.96 });
  for (const y of [-0.035, 0.066]) {
    const arco = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.011, 5, 14, Math.PI), couro);
    arco.rotation.x = -Math.PI / 2;
    k.add(arco, 0, y, 0.016);
  }
  for (const [x, y] of contorno) k.bola(0.008, aro, x * 0.95, y * 0.95, curvatura(x * 0.95) + 0.017, 0);
}

export const ARMAS_3D: Readonly<Record<string, Construtor>> = {
  // --- As antigas (bipede.ts)
  espada: espadaDeGuerra,
  adaga: (k) => { espadaComum(k, 0.22, 0.05, 0.1); },
  clava: (k) => {
    haste(k, -0.12, 0.34, COURO, 0.024);
    k.bola(0.075, k.mat(MADEIRA_ESCURA, { roughness: 0.85 }), 0.01, 0.4);
    k.espinhos(0.01, 0.4, 0.075, 6);
    if (k.n >= 2) k.cil(0.08, 0.36, 0.38, k.enfeite(), 0.01);
    k.cristais(0, 0.4, 0.14);
  },
  machado: (k) => { machadoDe(k, 0.5); },
  foice: (k) => {
    haste(k, -0.35, 0.7, 0x4a3a2a);
    k.perfil([[0, 0.7], [0.3, 0.66], [0.38, 0.6], [0.24, 0.62], [0.02, 0.6]], 0.016, k.aco(0xbdc3c7));
    k.runas(0.6, 0.66, 0.016, 0.18);
    k.cristais(0.2, 0.62, 0.12);
  },
  arco: (k) => { arcoDe(k, 0.38, 0.14, MADEIRA); },
  lanca: (k) => {
    haste(k, -0.4, 0.85, MADEIRA);
    k.perfil([[-0.035, 0.85], [0.035, 0.85], [0, 1.0 + 0.02 * k.n]], 0.02, k.aco());
    if (k.n >= 2) k.cil(0.025, 0.83, 0.86, k.enfeite());
    if (k.n >= 3) for (const s of [-1, 1]) k.perfil([[0, 0.84], [s * 0.07, 0.8], [s * 0.03, 0.87]], 0.012, k.aco());
    k.runas(0.87, 0.95, 0.02);
    k.cristais(0, 0.9, 0.1);
  },
  // --- Lâminas do Guerreiro
  montante: (k) => {
    k.cabo(-0.16, 0.03, 0.02);
    k.pomo(-0.17, 0.026);
    k.guarda(0.24, 0.045);
    lamina(k, 0.06, 0.74, 0.085);
    k.cristais(0, 0.5, 0.12);
  },
  sabre: (k) => {
    k.cabo(-0.09, 0.03);
    k.pomo(-0.1);
    k.curva(0.07, Math.PI, 0.008, k.enfeite(), 0, 0.03, Math.PI);
    lamina(k, 0.04, 0.46, 0.05, ACO, 0.09);
    k.cristais(0.04, 0.3, 0.1);
  },
  mangual: (k) => {
    haste(k, -0.12, 0.25, COURO, 0.02);
    for (let i = 0; i < 4; i++) k.curva(0.012, Math.PI * 2, 0.004, k.mat(0x99a3a4, { metalness: 0.4 }), 0.02 + i * 0.022, 0.27 + i * 0.03, 0);
    k.bola(0.06 + 0.006 * k.n, k.mat(0x5d6d7e, { metalness: 0.4 }), 0.12, 0.42);
    for (let i = 0; i < 6 + k.n; i++) {
      const a = (i / (6 + k.n)) * Math.PI * 2;
      k.add(new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.04, 4), k.aco(ACO_ESCURO)), 0.12 + Math.cos(a) * 0.065, 0.42 + Math.sin(a) * 0.065).rotation.z = a - Math.PI / 2;
    }
    k.cristais(0.12, 0.42, 0.13);
  },
  rapieira: (k) => {
    k.cabo(-0.09, 0.03, 0.014);
    k.pomo(-0.1, 0.018);
    k.curva(0.05, Math.PI, 0.006, k.mat(OURO, { metalness: 0.5 }), 0, 0.02, Math.PI);
    lamina(k, 0.04, 0.56, 0.024);
    k.cristais(0, 0.4, 0.08);
  },
  // --- Arcos do Arqueiro
  arco_longo: (k) => { arcoDe(k, 0.42, 0.15, MADEIRA); },
  besta: (k) => {
    k.caixa(0.04, 0.42, 0.04, k.mat(MADEIRA, { roughness: 0.75 }), 0, 0.08);
    const y = 0.25;
    k.curva(0.3, Math.PI * 0.55, 0.014, k.mat(0x5d4037), 0, y - 0.3, Math.PI * 0.225);
    const corda = k.cil(0.003, -0.24, 0.24, k.mat(0xe5e1d8));
    corda.rotation.z = Math.PI / 2;
    corda.position.set(0, y - 0.04, 0);
    if (k.n >= 2) k.caixa(0.05, 0.03, 0.05, k.enfeite(), 0, y);
    if (k.n >= 3) k.perfil([[-0.015, 0.29], [0.015, 0.29], [0, 0.34]], 0.01, k.aco());
    k.cristais(0, y, 0.2);
  },
  composto: (k) => {
    arcoDe(k, 0.32, 0.17, 0x2e4053);
    k.bola(0.016, k.mat(0xa9cce3), 0.12, 0.18, 0.02);
  },
  arcocurto: (k) => { arcoDe(k, 0.26, 0.12, 0xa04000); },
  elfico: (k) => {
    arcoDe(k, 0.37, 0.16, 0x1e8449);
    k.curva(0.04, Math.PI, 0.006, k.brilho(0x82e0aa, 0.6), 0.1, 0.24, 0.3);
  },
  chifre: (k) => { arcoDe(k, 0.3, 0.2, 0xdc7633, true); },
  arcoguerra: (k) => {
    arcoDe(k, 0.37, 0.15, 0x4d5656);
    k.caixa(0.012, 0.12, 0.012, k.mat(0x922b21), 0.1, 0.2, 0, -0.5);
  },
  arcocaca: (k) => {
    arcoDe(k, 0.35, 0.14, 0x7d6608);
    k.bola(0.02, k.mat(0xe8e0d0), 0.13, -0.1, 0.02).scale.y = 1.6;
  },
  // --- Tomos do Mago
  tomo: (k) => { livroDe(k, 0x5b2c6f, 0x9b8cff); },
  codice: (k) => {
    livroDe(k, 0x784212, 0xf39c12);
    if (k.fechado) return;
    k.caixa(0.26, 0.012, 0.02, k.mat(OURO, { metalness: 0.5 }), 0, 0.17, -0.01);
  },
  mares: (k) => { livroDe(k, 0x1f618d, 0x5dade2); },
  estelar: (k) => {
    livroDe(k, 0x1b2631, 0xf7dc6f);
    if (k.fechado) return;
    k.bola(0.012, k.brilho(0xf7dc6f, 1), 0.08, 0.2, 0.03);
  },
  prisma: (k) => {
    livroDe(k, 0x6c3483, 0xbb8fce);
    if (k.fechado) return;
    k.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.03), k.brilho(0xebdef0, 0.7)), 0, 0.23, 0.03).scale.y = 1.6;
  },
  espelhos: (k) => { livroDe(k, 0xaab7b8, 0xf5eef8); },
  orbital: (k) => {
    livroDe(k, 0x21618c, 0x85c1e9);
    if (k.fechado) return;
    k.curva(0.07, Math.PI * 2, 0.004, k.brilho(0x85c1e9, 0.7), 0, 0.085, 0, 1).rotation.x = 1.1;
  },
  vazio: (k) => {
    livroDe(k, 0x17202a, 0x5b2c6f);
    if (k.fechado) return;
    k.bola(0.035, k.mat(0x0d0b12, { roughness: 0.1 }), 0, 0.085, 0.035);
  },
  // --- Cajados do Necromante
  cajado: (k) => { cajadoDe(k, MADEIRA, (y) => {
    const gema = k.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.06 + 0.005 * k.n), k.brilho(0x4a3a5a, 0.2 + 0.1 * k.n)), 0, y);
    gema.scale.y = 1.34;
    gema.rotation.y = 0.21;
  }); },
  praga: (k) => { cajadoDe(k, 0x4d5656, (y) => {
      k.bola(0.062, k.brilho(0x5a8a5a, 0.3 + 0.1 * k.n), 0, y);
      k.bola(0.02, k.mat(0x9ab09a), -0.03, y + 0.03, 0.055);
    }); },
  cova: (k) => { cajadoDe(k, MADEIRA_ESCURA, (y) => {
      k.perfil([[-0.11, y - 0.05], [-0.08, y + 0.11], [0, y + 0.03], [0.08, y + 0.11], [0.11, y - 0.05]], 0.04, k.mat(OSSO, { roughness: 0.8 }));
      if (k.n >= 2) for (const s of [-1, 1]) k.bola(0.016, k.brilho(), s * 0.04, y, 0.035);
    }); },
  cetro: (k) => {
    k.cil(0.016, -0.12, 0.55, k.mat(OURO, { metalness: 0.5, roughness: 0.3 }));
    k.bola(0.075 + 0.006 * k.n, k.brilho(0xaed6f1, 0.6), 0, 0.64).scale.y = 1.25;
    k.curva(0.045, Math.PI * 2, 0.006, k.mat(OURO, { metalness: 0.5 }), 0, 0.56, 0).rotation.x = Math.PI / 2;
    k.espinhos(0, 0.62, 0.06, 4);
    k.cristais(0, 0.62, 0.12);
  },
  sanguineo: (k) => { cajadoDe(k, 0x641e16, (y) => {
      k.bola(0.08, k.brilho(0xc0392b, 0.6), 0, y).scale.y = 1.35;
      k.caixa(0.2, 0.026, 0.026, k.mat(0x641e16), 0, y - 0.11);
    }); },
  espectro: (k) => { cajadoDe(k, 0x85929e, (y) => {
      k.bola(0.09, k.mat(0xd6eaf8, { transparent: true, opacity: 0.75, emissive: 0x9ac8f0, emissiveIntensity: 0.5 }), 0, y);
    }); },
  gadanha: (k) => {
    haste(k, -0.35, 0.75, MADEIRA_ESCURA, 0.017);
    k.perfil([[0, 0.76], [0.36, 0.68], [0.42, 0.6], [0.26, 0.66], [0.02, 0.69]], 0.016, k.aco(ACO_ESCURO));
    k.caixa(0.1, 0.014, 0.014, k.mat(MADEIRA_ESCURA), 0, 0.22, 0, 0.3);
    k.runas(0.66, 0.72, 0.016, 0.2);
    k.cristais(0.22, 0.66, 0.13);
  },
  // --- Arremessáveis do Aventureiro
  bumerangue: (k) => { bumerangueDe(k, 0x7a5a3e); },
  chakram: (k) => {
    k.curva(0.13, Math.PI * 2, 0.018 + 0.002 * k.n, k.aco(0xf5b041), 0, 0.13, 0, 0.4);
    k.bola(0.016, k.mat(ACO), 0, 0.27);
    if (k.n >= 2) k.curva(0.08, Math.PI * 2, 0.006, k.brilho(), 0, 0.13, 0);
    k.espinhos(0, 0.13, 0.15, 8);
    k.cristais(0, 0.13, 0.2);
  },
  machadinha: (k) => { machadoDe(k, 0.3); },
  shuriken: (k) => {
    const pts: P[] = [];
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 0.13 : 0.04;
      const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
      pts.push([Math.cos(a) * r, 0.13 + Math.sin(a) * r]);
    }
    k.perfil(pts, 0.012, k.aco(0x85929e));
    k.bola(0.02, k.n >= 2 ? k.brilho() : k.mat(0x1b2631), 0, 0.13, 0.012);
    k.cristais(0, 0.13, 0.2);
  },
  duplo: (k) => {
    bumerangueDe(k, 0xca6f1e);
    bumerangueDe(k, 0xe59866, false, 0.05, 0.05);
  },
  arpeu: (k) => {
    k.cil(0.006, -0.05, 0.28, k.mat(0x99a3a4, { metalness: 0.4 }));
    for (const s of [-1, 0, 1]) k.perfil([[0, 0.3], [s * 0.08 + 0.001, 0.25], [s * 0.06, 0.34]], 0.014, k.aco(ACO_ESCURO));
    if (k.n >= 2) k.bola(0.018, k.brilho(), 0, 0.3, 0.02);
    k.cristais(0, 0.3, 0.12);
  },
  falcoeiro: (k) => {
    bumerangueDe(k, 0xd68910);
    k.bola(0.02, k.mat(0xe8e0d0), 0.2, 0.18, 0.02).scale.y = 1.8;
  },
  serrilhado: (k) => { bumerangueDe(k, 0x1e8449, true); },
  // --- A mão secundária
  escudo: escudoDeGuerra,
};

export const TOMOS_FECHADOS = new Map([...TOMOS].map(nome => [tomoFechado(nome), nome]));
