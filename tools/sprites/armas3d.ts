// As armas em 3D (marco 32, 31/10/2026, D-131): cada desenho do jogo (modelos/armas-classe.ts e bipede.ts) vira um
// modelo de geometria simples com as mesmas formas e cores, e cada grau de raridade o deixa maior e mais enfeitado:
// faixas no cabo (incomum), a gema no punho (raro), a guarda com asas e o aço polido (épico), o ouro, as runas acesas
// e os espinhos (lendário), e o aço negro com cristais flutuantes (última). Medidas em células; o cabo na origem, a
// arma para +y, a face larga para +z (para a câmera).

import * as THREE from 'three';

/** Quanto a arma cresce por grau (0 = comum … 5 = última). */
export const ESCALA_DO_GRAU = [1, 1.05, 1.12, 1.2, 1.3, 1.42] as const;

const ACO = 0xaeb6c0;
const ACO_ESCURO = 0x8a949e;
const MADEIRA = 0x7a5230;
const MADEIRA_ESCURA = 0x5a3d22;
const COURO = 0x6e4b2a;
const OSSO = 0xe8e2cf;
const OURO = 0xd4ac0d;
const LATAO = 0x8a6d3b;

type P = [number, number];

export class Kit {
  readonly g = new THREE.Group();
  constructor(
    readonly n: number,
    readonly acento: number,
  ) {}

  mat(cor: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: cor, roughness: 0.55, ...o });
  }
  /** O aço da lâmina pelo grau: comum, polido (épico), claro (lendário) e negro (última). */
  aco(base = ACO): THREE.Material {
    if (this.n >= 5) return this.mat(0x34303e, { metalness: 0.5, roughness: 0.3 });
    if (this.n >= 4) return this.mat(0xc8d0d8, { metalness: 0.45, roughness: 0.25 });
    if (this.n >= 3) return this.mat(base, { metalness: 0.4, roughness: 0.3 });
    return this.mat(base, { metalness: 0.3, roughness: 0.45 });
  }
  /** Os enfeites: latão, prata (épico) ou ouro (lendário em diante). */
  enfeite(): THREE.Material {
    return this.mat(this.n >= 4 ? OURO : this.n >= 3 ? 0xc8d0d8 : LATAO, { metalness: 0.45, roughness: 0.35 });
  }
  brilho(cor = this.acento, forca = 0.5 + 0.25 * Math.max(0, this.n - 2)): THREE.Material {
    return this.mat(cor, { emissive: cor, emissiveIntensity: forca, roughness: 0.2 });
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
    const geo = new THREE.ExtrudeGeometry(s, { depth: esp, bevelEnabled: true, bevelThickness: esp * 0.35, bevelSize: esp * 0.3, bevelSegments: 1 });
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
  /** A última: cristais acesos flutuando em volta de um ponto. */
  cristais(x: number, y: number, raio: number): void {
    if (this.n < 5) return;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      const c = this.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.022), this.brilho(this.acento, 1.4)), x + Math.cos(a) * raio, y + Math.sin(a) * raio * 0.6, 0.03);
      c.scale.y = 1.8;
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
  k.perfil(pts, 0.016, k.aco(cor));
  k.runas(y0 + compr * 0.1, y0 + compr * 0.75, 0.016, curva * 0.3);
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
  // Aberto na mão, de frente: as duas capas um pouco dobradas, as páginas e o símbolo aceso no meio.
  const l = 0.15;
  const a = 0.2;
  for (const s of [-1, 1]) {
    const c = k.caixa(l, a, 0.02, k.mat(capa, { roughness: 0.7 }), (s * l) / 2, a / 2, -0.012);
    c.rotation.y = -s * 0.55;
    const pag = k.caixa(l * 0.7, a * 0.78, 0.016, k.mat(0xcfc2a2, { roughness: 0.9 }), (s * l) / 2.4, a / 2, 0.006);
    pag.rotation.y = -s * 0.55;
    if (k.n >= 3) k.caixa(0.014, a * 1.02, 0.024, k.enfeite(), s * l * 0.92, a / 2, -0.02);
  }
  k.caixa(0.03, a, 0.03, k.mat(capa, { roughness: 0.7 }), 0, a / 2, -0.03);
  k.bola(0.02 + 0.004 * k.n, k.brilho(simbolo, 0.6 + 0.2 * k.n), 0, a / 2, 0.03);
  if (k.n >= 2) k.curva(0.04 + 0.006 * k.n, Math.PI * 2, 0.004, k.brilho(simbolo, 0.8), 0, a / 2, 0);
  k.cristais(0, a * 0.9, 0.16);
}

function cajadoDe(k: Kit, cor: number, cabeca: (y: number) => void, alto = 1.0): void {
  haste(k, -0.35, alto - 0.35, cor, 0.017);
  cabeca(alto - 0.3);
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

export const ARMAS_3D: Readonly<Record<string, Construtor>> = {
  // --- As antigas (bipede.ts)
  espada: (k) => { espadaComum(k, 0.48, 0.06, 0.16); },
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
    k.caixa(0.26, 0.012, 0.02, k.mat(OURO, { metalness: 0.5 }), 0, 0.17, -0.01);
  },
  mares: (k) => { livroDe(k, 0x1f618d, 0x5dade2); },
  estelar: (k) => {
    livroDe(k, 0x1b2631, 0xf7dc6f);
    k.bola(0.012, k.brilho(0xf7dc6f, 1), 0.08, 0.2, 0.03);
  },
  prisma: (k) => {
    livroDe(k, 0x6c3483, 0xbb8fce);
    k.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.03), k.brilho(0xebdef0, 0.7)), 0, 0.23, 0.03).scale.y = 1.6;
  },
  espelhos: (k) => { livroDe(k, 0xaab7b8, 0xf5eef8); },
  orbital: (k) => {
    livroDe(k, 0x21618c, 0x85c1e9);
    k.curva(0.07, Math.PI * 2, 0.004, k.brilho(0x85c1e9, 0.7), 0, 0.085, 0, 1).rotation.x = 1.1;
  },
  vazio: (k) => {
    livroDe(k, 0x17202a, 0x5b2c6f);
    k.bola(0.035, k.mat(0x0d0b12, { roughness: 0.1 }), 0, 0.085, 0.035);
  },
  // --- Cajados do Necromante
  cajado: (k) => { cajadoDe(k, MADEIRA, (y) => k.bola(0.085 + 0.008 * k.n, k.brilho(0x9b59b6, 0.5), 0, y)); },
  praga: (k) => { cajadoDe(k, 0x4d5656, (y) => {
      k.bola(0.09, k.brilho(0x7dcea0, 0.6), 0, y);
      k.bola(0.026, k.mat(0xd5f5e3), -0.035, y + 0.035, 0.075);
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
  bumerangue: (k) => { bumerangueDe(k, 0xc49a6c); },
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
  escudo: (k) => {
    const r = 0.17 + 0.012 * k.n;
    const madeira = k.mat(0x8a6a4a, { roughness: 0.8 });
    if (k.n >= 2) {
      // Do raro em diante, o escudo em gota de aço com a borda e o emblema.
      const pts: P[] = [];
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI * (i / 16);
        pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.6]);
      }
      pts.push([0, -r * 1.3]);
      k.perfil(pts, 0.03, k.aco(0x9aa4b0));
      k.bola(0.035 + 0.004 * k.n, k.brilho(), 0, 0, 0.03);
      if (k.n >= 3) k.perfil(pts.map(([x, y]) => [x * 0.78, y * 0.78] as P), 0.034, k.enfeite(), 0.004);
      k.espinhos(0, 0, r * 0.95, 5);
    } else {
      k.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 20), madeira), 0, 0).rotation.x = Math.PI / 2;
      k.bola(0.035, k.enfeite(), 0, 0, 0.02, 0);
      if (k.n >= 1) k.curva(r, Math.PI * 2, 0.01, k.enfeite(), 0, 0, 0);
    }
    k.cristais(0, 0, r + 0.06);
  },
};
