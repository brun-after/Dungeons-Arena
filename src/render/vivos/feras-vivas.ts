// Marco 40 (13/11/2026, D-165): o lobo e o urso do Aventureiro em tempo real, como o próprio Aventureiro. Antes, o
// lobo era o do inimigo (atlas `lobo`) e o urso, o troll. Agora cada um tem corpo próprio, de peças rígidas em pivôs
// (como as feras de tools/sprites/feras3d.ts), com o arreio de montaria (a coleira com a runa de bronze da Terra, a
// manta verde e a sela): são companheiros de luta e montarias. As animações saem assadas em clipes (`assar`), para o
// palco em tempo real (palco-vivo.ts) tocá-las como as de um GLB; a ferramenta de sprites usa as mesmas peças para o
// atlas de reserva (sem GPU).

import * as THREE from 'three';

/** Marco 40 (14/11/2026): três golpes por fera, alternados a cada ataque (golpe, golpe2, golpe3). */
export type EstadoFera = 'parado' | 'andar' | 'golpe' | 'golpe2' | 'golpe3' | 'conjurar' | 'morte' | 'correr';
export interface Fera {
  grupo: THREE.Group;
  animar(estado: EstadoFera, f: number): void;
}

/** Os nomes dos clipes assados (o palco os pede pelo estado). */
export const CLIPES_DA_FERA: Readonly<Record<EstadoFera, string>> = {
  parado: 'Fera_Parado',
  andar: 'Fera_Andar',
  golpe: 'Fera_Golpe',
  golpe2: 'Fera_Golpe2',
  golpe3: 'Fera_Golpe3',
  conjurar: 'Fera_Conjurar',
  morte: 'Fera_Morte',
  correr: 'Fera_Correr',
};

const mat = (cor: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: 0.82, ...o });
const ciclo = (f: number, fase = 0) => Math.sin(f * Math.PI * 2 + fase);
const suave = (t: number) => t * t * (3 - 2 * t);

/** Um pivô com nome (o clipe acha a peça pelo nome). */
function pivo(nome: string, pai: THREE.Object3D, x = 0, y = 0, z = 0): THREE.Group {
  const g = new THREE.Group();
  g.name = `f_${nome}`;
  g.position.set(x, y, z);
  pai.add(g);
  return g;
}

function bola(r: number, m: THREE.Material, sx = 1, sy = 1, sz = 1): THREE.Mesh {
  const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m);
  b.scale.set(sx, sy, sz);
  return b;
}

/** Um segmento pendurado do pivô para baixo (as pernas). */
function osso(raio: number, compr: number, m: THREE.Material, raioFim = raio): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(raioFim, raio, compr, 9);
  geo.translate(0, -compr / 2, 0);
  return new THREE.Mesh(geo, m);
}

function em<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): T {
  o.position.set(x, y, z);
  o.rotation.set(rx, ry, rz);
  return o;
}

/** Os materiais do arreio, iguais nos dois (o couro, a manta verde do Aventureiro e o bronze da runa da Terra). */
function arreio() {
  return {
    couro: mat(0x4a2e1a, { roughness: 0.6 }),
    manta: mat(0x3f6b3a, { roughness: 0.9 }),
    barra: mat(0xc9a24a, { roughness: 0.45, metalness: 0.6 }),
    bronze: mat(0xb07a3a, { roughness: 0.35, metalness: 0.85 }),
    runa: mat(0xffb04a, { emissive: 0xff8a1a, emissiveIntensity: 1.4, roughness: 0.4 }),
  };
}

/** A coleira com o pingente da runa, no pescoço (`raio`), virada para a frente. */
function coleira(pai: THREE.Object3D, raio: number, a: ReturnType<typeof arreio>, y: number, z: number): void {
  const anel = new THREE.Mesh(new THREE.TorusGeometry(raio, raio * 0.18, 8, 20), a.couro);
  // O anel fica em volta do pescoço (o eixo dele aponta para a frente), um pouco inclinado com o pescoço.
  em(anel, 0, y, z, -0.5);
  pai.add(anel);
  const pingente = new THREE.Mesh(new THREE.CylinderGeometry(raio * 0.32, raio * 0.32, raio * 0.1, 10), a.bronze);
  em(pingente, 0, y - raio * 0.95, z + raio * 0.55, Math.PI / 2 - 0.3);
  pai.add(pingente);
  const runa = new THREE.Mesh(new THREE.BoxGeometry(raio * 0.12, raio * 0.4, raio * 0.04), a.runa);
  em(runa, 0, y - raio * 0.95, z + raio * 0.62, -0.3);
  pai.add(runa);
}

/** A altura do quadril do lobo (as pernas longas). */
const H_LOBO = 0.6;

/** O arreio leve do lobo: o peitoral, a cilha e o assento curto de couro, sem manta. */
function arreioLeve(pai: THREE.Object3D, a: ReturnType<typeof arreio>, y: number): void {
  const peitoral = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 6, 20), a.couro);
  em(peitoral, 0, -0.02, 0.24, 0.35);
  pai.add(peitoral);
  const cilha = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.014, 6, 20), a.couro);
  em(cilha, 0, 0.0, 0.02);
  pai.add(cilha);
  const assento = bola(0.085, a.couro, 1, 0.28, 1.5);
  em(assento, 0, y, 0.02);
  pai.add(assento);
  for (const sx of [-1, 1]) pai.add(em(bola(0.014, a.barra), sx * 0.075, y - 0.02, 0.02));
}

/** A manta com a barra dourada, a sela e a cinta na barriga, no dorso (`y` é o alto das costas). */
function sela(pai: THREE.Object3D, a: ReturnType<typeof arreio>, y: number, largura: number, compr: number, z = 0): void {
  for (const s of [-1, 1]) {
    const aba = new THREE.Mesh(new THREE.BoxGeometry(0.02, largura * 0.55, compr), a.manta);
    em(aba, s * largura * 0.48, y - largura * 0.2, z, 0, 0, s * 0.35);
    pai.add(aba);
    const barra = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.03, compr * 1.02), a.barra);
    em(barra, s * largura * 0.56, y - largura * 0.44, z, 0, 0, s * 0.35);
    pai.add(barra);
  }
  const topo = new THREE.Mesh(new THREE.BoxGeometry(largura * 0.9, 0.025, compr), a.manta);
  em(topo, 0, y + 0.005, z);
  pai.add(topo);
  const assento = bola(largura * 0.32, a.couro, 1, 0.3, 1.25);
  em(assento, 0, y + 0.04, z);
  pai.add(assento);
  const cepilho = bola(largura * 0.14, a.couro, 1.2, 1, 0.6);
  em(cepilho, 0, y + 0.09, z + compr * 0.38);
  pai.add(cepilho);
  const cinta = new THREE.Mesh(new THREE.TorusGeometry(largura * 0.62, 0.016, 6, 24), a.couro);
  em(cinta, 0, y - largura * 0.62, z);
  pai.add(cinta);
}

interface Perna { coxa: THREE.Group; canela: THREE.Group; fase: number; frente: boolean; lado: number }

function pernas(pai: THREE.Object3D, pontos: readonly (readonly [number, number, number, number])[], m: { coxa: THREE.Material; pe: THREE.Material; garra?: THREE.Material }, dims: { r: number; coxa: number; canela: number; pata: number }): Perna[] {
  return pontos.map(([x, y, z, fase], i) => {
    const coxa = pivo(`coxa${i}`, pai, x, y, z);
    coxa.add(osso(dims.r, dims.coxa, m.coxa, dims.r * 0.75));
    const canela = pivo(`canela${i}`, coxa, 0, -dims.coxa, 0);
    canela.add(osso(dims.r * 0.72, dims.canela, m.pe, dims.r * 0.6));
    const pata = bola(dims.pata, m.pe, 1, 0.55, 1.35);
    pata.position.set(0, -dims.canela, dims.pata * 0.35);
    canela.add(pata);
    if (m.garra) {
      for (const g of [-1, 0, 1]) {
        const garra = new THREE.Mesh(new THREE.ConeGeometry(dims.pata * 0.16, dims.pata * 0.55, 5), m.garra);
        em(garra, g * dims.pata * 0.42, -dims.canela - dims.pata * 0.25, dims.pata * 1.2, Math.PI / 2 + 0.4);
        canela.add(garra);
      }
    }
    return { coxa, canela, fase, frente: z > 0, lado: Math.sign(x) };
  });
}

/**
 * O lobo do Aventureiro: maior que o lobo selvagem e esguio (o peito fundo e estreito, a barriga recolhida, as pernas
 * longas e finas), castanho-acinzentado com a faixa escura no dorso, o focinho comprido, as orelhas em pé e os olhos
 * âmbar; a coleira com a runa e um arreio leve de montaria (sem manta: a sela inteira o fazia parecer um pônei).
 * Ajuste de 14/11/2026: afinado. Trota, galopa, salta na mordida e uiva.
 */
export function loboCompanheiro(): Fera {
  const grupo = new THREE.Group();
  const raiz = pivo('raiz', grupo);
  const pelo = mat(0x5f5b56);
  const dorso = mat(0x2b2724);
  const claro = mat(0xb9b2a6);
  const a = arreio();
  // O apoio fica no quadril: sentar (o uivo) gira o corpo em volta das patas de trás.
  const apoio = pivo('apoio', raiz, 0, H_LOBO, -0.34);
  const tronco = pivo('tronco', apoio, 0, 0, 0.34);
  // O peito fundo na frente, a cintura fina e o quadril menor atrás.
  tronco.add(em(bola(0.16, pelo, 0.82, 1.18, 1.25), 0, -0.01, 0.2));
  tronco.add(em(bola(0.12, pelo, 0.8, 0.82, 1.9), 0, 0.03, -0.05));
  tronco.add(em(bola(0.13, pelo, 0.85, 0.95, 1.1), 0, 0.02, -0.28));
  tronco.add(em(bola(0.1, dorso, 0.85, 0.45, 3.2), 0, 0.12, -0.02));
  tronco.add(em(bola(0.1, claro, 0.75, 1.1, 0.6), 0, -0.09, 0.32));
  // A juba curta em volta do pescoço.
  for (let i = 0; i < 7; i++) {
    const t = (i / 6 - 0.5) * 2.2;
    const tufo = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 5), i % 3 ? pelo : dorso);
    em(tufo, Math.sin(t) * 0.11, 0.06 + Math.cos(t) * 0.09, 0.33, -0.9, 0, -t * 0.6);
    tronco.add(tufo);
  }
  const pescoco = pivo('pescoco', tronco, 0, 0.08, 0.36);
  pescoco.add(em(bola(0.085, pelo, 0.9, 0.95, 1.6), 0, 0.04, 0.06, -0.7));
  const cabeca = pivo('cabeca', pescoco, 0, 0.1, 0.14);
  cabeca.add(bola(0.1, pelo, 0.92, 0.85, 1.2));
  cabeca.add(em(bola(0.07, dorso, 0.9, 0.45, 1.1), 0, 0.06, -0.02));
  const focinho = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.25, 9), claro);
  cabeca.add(em(focinho, 0, -0.025, 0.17, Math.PI / 2));
  cabeca.add(em(bola(0.022, mat(0x121212, { roughness: 0.25 })), 0, -0.015, 0.29));
  const mandibula = pivo('mandibula', cabeca, 0, -0.055, 0.05);
  mandibula.add(em(new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.19, 8), claro), 0, 0, 0.1, Math.PI / 2, 0, 0));
  for (const s of [-1, 1]) {
    const orelha = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.14, 4), dorso);
    cabeca.add(em(orelha, s * 0.055, 0.12, -0.03, -0.1, 0, -s * 0.12));
    const olho = bola(0.018, mat(0xffb347, { emissive: 0xff8a00, emissiveIntensity: 0.9, roughness: 0.2 }));
    cabeca.add(em(olho, s * 0.05, 0.03, 0.09));
  }
  coleira(tronco, 0.09, a, 0.08, 0.4);
  arreioLeve(tronco, a, 0.15);
  const ps = pernas(tronco, [[-0.075, -0.06, 0.26, 0], [0.075, -0.06, 0.26, Math.PI], [-0.075, -0.04, -0.32, Math.PI], [0.075, -0.04, -0.32, 0]], { coxa: pelo, pe: dorso }, { r: 0.05, coxa: 0.25, canela: 0.25, pata: 0.036 });
  // Os ombros e as ancas: o músculo no alto das pernas.
  for (const sx of [-1, 1]) {
    tronco.add(em(bola(0.07, pelo, 0.75, 1.25, 1), sx * 0.075, -0.06, 0.25));
    tronco.add(em(bola(0.08, pelo, 0.75, 1.2, 1.15), sx * 0.075, -0.04, -0.31));
  }
  const rabo = pivo('rabo', tronco, 0, 0.07, -0.4);
  rabo.add(osso(0.045, 0.3, pelo, 0.04));
  rabo.add(em(bola(0.045, dorso, 1, 1.8, 1), 0, -0.33, 0));
  return {
    grupo,
    animar(estado, f) {
      raiz.position.set(0, 0, 0);
      raiz.rotation.set(0, 0, 0);
      apoio.position.set(0, H_LOBO, -0.34);
      apoio.rotation.set(0, 0, 0);
      tronco.position.set(0, 0, 0.34);
      tronco.rotation.set(0, 0, 0);
      pescoco.rotation.set(0, 0, 0);
      cabeca.rotation.set(0, 0, 0);
      mandibula.rotation.set(0, 0, 0);
      rabo.rotation.set(-2.1, 0, 0.3 * ciclo(f));
      for (const p of ps) {
        p.coxa.rotation.set(0, 0, 0);
        p.canela.rotation.set(0, 0, 0);
      }
      if (estado === 'parado') {
        // Respira, abana o rabo devagar e vira a cabeça de um lado a outro.
        tronco.scale.set(1, 1 + 0.025 * ciclo(f), 1);
        pescoco.rotation.y = 0.25 * ciclo(f, 0.6);
        cabeca.rotation.x = 0.06 * ciclo(f * 2);
        rabo.rotation.z = 0.45 * ciclo(f * 2);
        return;
      }
      tronco.scale.set(1, 1, 1);
      if (estado === 'andar') {
        // O trote: as patas em diagonal juntas, o corpo sobe a cada passo.
        apoio.position.y = H_LOBO + 0.03 * Math.abs(ciclo(f));
        pescoco.rotation.x = 0.08 * ciclo(f * 2);
        for (const p of ps) {
          const v = ciclo(f, p.fase);
          p.coxa.rotation.x = 0.55 * v;
          p.canela.rotation.x = (p.frente ? -0.7 : 0.7) * Math.max(0, -v);
        }
        rabo.rotation.x = -1.9;
      } else if (estado === 'correr') {
        // O galope: o par da frente e o de trás alternam, o corpo ondula e se estica.
        apoio.position.y = H_LOBO + 0.04 + 0.08 * Math.max(0, ciclo(f));
        apoio.rotation.x = 0.16 * ciclo(f, Math.PI / 2);
        pescoco.rotation.x = 0.2 - 0.15 * ciclo(f, Math.PI / 2);
        for (const p of ps) {
          const v = ciclo(f, p.frente ? 0 : Math.PI) + 0.15 * p.lado;
          p.coxa.rotation.x = 0.95 * v;
          p.canela.rotation.x = (p.frente ? -1 : 1) * 0.9 * Math.max(0, -v);
        }
        rabo.rotation.x = -1.4;
        cabeca.rotation.x = 0.1;
      } else if (estado === 'golpe') {
        // O bote: agacha, salta para a frente com a boca aberta e fecha a mordida.
        const carga = suave(Math.min(1, f / 0.35));
        const bote = f < 0.35 ? 0 : Math.sin(((f - 0.35) / 0.65) * Math.PI);
        apoio.position.y = H_LOBO - 0.1 * carga * (1 - bote) + 0.12 * bote;
        apoio.position.z = -0.34 + 0.35 * bote;
        apoio.rotation.x = 0.1 * carga - 0.25 * bote;
        pescoco.rotation.x = 0.3 * carga - 0.2 * bote;
        mandibula.rotation.x = 0.7 * Math.sin(Math.min(1, f / 0.8) * Math.PI);
        for (const p of ps) {
          p.coxa.rotation.x = p.frente ? -1.1 * bote + 0.3 * carga : 0.6 * bote - 0.4 * carga;
          p.canela.rotation.x = p.frente ? 0.4 * carga : 0.5 * carga;
        }
      } else if (estado === 'golpe2') {
        // A patada: meio empinado nas patas de trás, a pata direita varre de fora para dentro e a cabeça acompanha.
        const sobe = f < 0.4 ? suave(f / 0.4) : 1 - suave((f - 0.4) / 0.6);
        const varre = f < 0.35 ? -suave(f / 0.35) : -1 + 2 * suave(Math.min(1, (f - 0.35) / 0.25));
        apoio.rotation.x = -0.45 * sobe;
        apoio.position.y = H_LOBO + 0.04 * sobe;
        pescoco.rotation.y = -0.35 * varre * sobe;
        mandibula.rotation.x = 0.35 * sobe;
        for (const p of ps) {
          if (!p.frente) {
            p.coxa.rotation.x = 0.45 * sobe;
            continue;
          }
          const ataca = p.lado > 0;
          p.coxa.rotation.x = (ataca ? -1.3 : -0.5) * sobe;
          p.coxa.rotation.z = ataca ? 0.9 * varre * sobe : 0;
          p.canela.rotation.x = (ataca ? 0.7 : 0.9) * sobe;
        }
      } else if (estado === 'golpe3') {
        // A mordida que prende: o bote curto, os dentes cravados e a cabeça sacudindo para rasgar.
        const bote = suave(Math.min(1, f / 0.25)) * (1 - suave(Math.max(0, (f - 0.8) / 0.2)));
        const sacode = f > 0.25 && f < 0.8 ? Math.sin(((f - 0.25) / 0.55) * Math.PI * 5) : 0;
        apoio.position.z = -0.34 + 0.18 * bote;
        apoio.position.y = H_LOBO - 0.06 * bote;
        apoio.rotation.x = 0.12 * bote;
        apoio.rotation.z = 0.08 * sacode;
        pescoco.rotation.x = 0.35 * bote;
        pescoco.rotation.y = 0.45 * sacode;
        mandibula.rotation.x = f < 0.25 ? 0.7 * suave(f / 0.25) : 0.08;
        for (const p of ps) {
          p.coxa.rotation.x = p.frente ? -0.35 * bote : 0.55 * bote;
          p.canela.rotation.x = p.frente ? 0.3 * bote : -0.4 * bote;
        }
        rabo.rotation.x = -1.5;
      } else if (estado === 'conjurar') {
        // O uivo: senta nas patas de trás, a cabeça para o alto e a boca aberta.
        const u = suave(Math.min(1, f * 2.5));
        apoio.rotation.x = -0.55 * u;
        apoio.position.y = H_LOBO - 0.12 * u;
        pescoco.rotation.x = -0.7 * u;
        cabeca.rotation.x = -0.3 * u;
        mandibula.rotation.x = 0.55 * u * (0.8 + 0.2 * ciclo(f * 3));
        for (const p of ps) {
          p.coxa.rotation.x = p.frente ? 0.55 * u : 1.35 * u;
          p.canela.rotation.x = p.frente ? 0 : -1.4 * u;
        }
        rabo.rotation.x = -2.6;
      } else {
        // Cai de lado e para.
        raiz.rotation.z = (Math.PI / 2) * suave(f);
        raiz.position.y = 0.16 * f;
        apoio.position.y = H_LOBO - 0.32 * f;
        for (const p of ps) p.coxa.rotation.x = 0.35 * f * (p.frente ? -1 : 1);
        mandibula.rotation.x = 0.25 * f;
      }
    },
  };
}

/**
 * O urso do Aventureiro, feito do zero: pardo, com a corcova nos ombros, a cabeça redonda de focinho curto e claro, as
 * patas grossas com garras; as ombreiras de bronze, a coleira com a runa, a manta, a sela e os alforjes. Anda pesado
 * balançando o corpo, corre aos saltos, ergue-se e desce as patas no golpe e ruge de pé.
 */
export function ursoCompanheiro(): Fera {
  const grupo = new THREE.Group();
  const raiz = pivo('raiz', grupo);
  const pelo = mat(0x5e3c25);
  const escuro = mat(0x3a2416);
  const claro = mat(0x9a7652);
  const marfim = mat(0xe8dcc0, { roughness: 0.4 });
  const a = arreio();
  const apoio = pivo('apoio', raiz, 0, 0.62, -0.36);
  const tronco = pivo('tronco', apoio, 0, 0, 0.36);
  tronco.add(bola(0.32, pelo, 1.12, 0.98, 1.6));
  tronco.add(em(bola(0.29, pelo, 1.05, 0.95, 1), 0, -0.02, -0.32));
  tronco.add(em(bola(0.25, escuro, 1.1, 0.85, 1.05), 0, 0.17, 0.2));
  tronco.add(em(bola(0.24, claro, 1, 0.8, 0.6), 0, -0.14, 0.3));
  for (const s of [-1, 1]) {
    // As ombreiras de bronze com os rebites.
    const ombro = bola(0.15, a.bronze, 1, 0.55, 1.15);
    tronco.add(em(ombro, s * 0.27, 0.12, 0.3, 0, 0, s * 0.5));
    for (const k of [-1, 0, 1]) tronco.add(em(bola(0.018, a.barra), s * 0.33, 0.07, 0.3 + k * 0.08));
    // Os alforjes atrás da sela.
    const bolsa = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.2), a.couro);
    tronco.add(em(bolsa, s * 0.36, 0.0, -0.28, 0, 0, s * 0.2));
    tronco.add(em(new THREE.Mesh(new THREE.BoxGeometry(0.084, 0.04, 0.204), a.barra), s * 0.37, 0.06, -0.28, 0, 0, s * 0.2));
  }
  const pescoco = pivo('pescoco', tronco, 0, 0.1, 0.48);
  const cabeca = pivo('cabeca', pescoco, 0, 0.02, 0.12);
  cabeca.add(bola(0.19, pelo, 1.05, 0.92, 1.05));
  cabeca.add(em(bola(0.095, claro, 1, 0.78, 1.3), 0, -0.05, 0.17));
  cabeca.add(em(bola(0.036, mat(0x111111, { roughness: 0.25 }), 1.3, 0.9, 1), 0, -0.02, 0.29));
  const mandibula = pivo('mandibula', cabeca, 0, -0.1, 0.1);
  mandibula.add(em(bola(0.07, claro, 1, 0.45, 1.3), 0, -0.01, 0.08));
  for (const s of [-1, 1]) {
    mandibula.add(em(new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.045, 5), marfim), s * 0.035, 0.03, 0.14, 0, 0, 0));
    cabeca.add(em(bola(0.06, pelo), s * 0.13, 0.15, -0.03));
    cabeca.add(em(bola(0.035, escuro, 1, 1, 0.5), s * 0.13, 0.15, 0.0));
    cabeca.add(em(bola(0.02, mat(0x24140a, { roughness: 0.15, emissive: 0x3a1a00, emissiveIntensity: 0.4 })), s * 0.08, 0.04, 0.16));
  }
  coleira(tronco, 0.165, a, 0.08, 0.5);
  sela(tronco, a, 0.29, 0.5, 0.4, -0.05);
  const ps = pernas(tronco, [[-0.2, -0.12, 0.3, 0], [0.2, -0.12, 0.3, Math.PI], [-0.2, -0.12, -0.36, 0], [0.2, -0.12, -0.36, Math.PI]], { coxa: pelo, pe: escuro, garra: marfim }, { r: 0.1, coxa: 0.26, canela: 0.22, pata: 0.085 });
  const rabo = pivo('rabo', tronco, 0, 0.04, -0.6);
  rabo.add(bola(0.06, pelo));
  return {
    grupo,
    animar(estado, f) {
      raiz.position.set(0, 0, 0);
      raiz.rotation.set(0, 0, 0);
      apoio.position.set(0, 0.62, -0.36);
      apoio.rotation.set(0, 0, 0);
      tronco.position.set(0, 0, 0.36);
      tronco.rotation.set(0, 0, 0);
      tronco.scale.set(1, 1, 1);
      pescoco.rotation.set(0, 0, 0);
      cabeca.rotation.set(0, 0, 0);
      mandibula.rotation.set(0, 0, 0);
      rabo.rotation.set(0, 0, 0);
      for (const p of ps) {
        p.coxa.rotation.set(0, 0, 0);
        p.canela.rotation.set(0, 0, 0);
      }
      // As pernas de trás ficam em pé quando o corpo se ergue em volta do quadril.
      const ergue = (ang: number) => {
        apoio.rotation.x = -ang;
        for (const p of ps) if (!p.frente) p.coxa.rotation.x = ang;
      };
      if (estado === 'parado') {
        tronco.scale.set(1, 1 + 0.02 * ciclo(f), 1);
        pescoco.rotation.y = 0.2 * ciclo(f, 1);
        pescoco.rotation.x = 0.1 + 0.05 * ciclo(f * 2);
      } else if (estado === 'andar') {
        // O passo pesado: as patas do mesmo lado juntas, o corpo rola de um lado a outro e a cabeça balança baixa.
        apoio.rotation.z = 0.06 * ciclo(f);
        apoio.position.y = 0.62 + 0.02 * Math.abs(ciclo(f, Math.PI / 2));
        pescoco.rotation.x = 0.18;
        pescoco.rotation.y = 0.1 * ciclo(f);
        for (const p of ps) {
          const v = ciclo(f, p.lado > 0 ? Math.PI : 0);
          p.coxa.rotation.x = 0.42 * v;
          p.canela.rotation.x = (p.frente ? -0.6 : 0.6) * Math.max(0, -v);
        }
      } else if (estado === 'correr') {
        // A corrida aos saltos: o par da frente cai, o de trás empurra; a corcova sobe e desce.
        apoio.position.y = 0.66 + 0.07 * Math.max(0, ciclo(f));
        apoio.rotation.x = 0.12 * ciclo(f, Math.PI / 2);
        pescoco.rotation.x = 0.25;
        for (const p of ps) {
          const v = ciclo(f, p.frente ? 0 : Math.PI) + 0.12 * p.lado;
          p.coxa.rotation.x = 0.75 * v;
          p.canela.rotation.x = (p.frente ? -0.8 : 0.8) * Math.max(0, -v);
        }
      } else if (estado === 'golpe') {
        // Ergue-se nas patas de trás e desce as da frente com todo o peso.
        const sobe = f < 0.45 ? suave(f / 0.45) : 1 - suave(Math.min(1, (f - 0.45) / 0.25));
        ergue(0.95 * sobe);
        pescoco.rotation.x = -0.35 * sobe + (f > 0.6 ? 0.25 : 0);
        mandibula.rotation.x = 0.6 * Math.sin(Math.min(1, f / 0.75) * Math.PI);
        for (const p of ps) {
          if (!p.frente) continue;
          p.coxa.rotation.x = -1.4 * sobe;
          p.coxa.rotation.z = p.lado * 0.35 * sobe;
          p.canela.rotation.x = 0.6 * sobe;
        }
        if (f > 0.65) apoio.position.y = 0.62 - 0.05 * Math.sin(((f - 0.65) / 0.35) * Math.PI);
      } else if (estado === 'golpe2') {
        // A patada de lado, nas quatro: o peso vai para trás, o corpo gira e a pata esquerda varre em gancho.
        const carga = f < 0.35 ? suave(f / 0.35) : 1 - suave((f - 0.35) / 0.2);
        const gancho = f < 0.35 ? 0 : Math.sin(Math.min(1, (f - 0.35) / 0.45) * Math.PI);
        apoio.rotation.y = 0.35 * carga - 0.45 * gancho;
        apoio.rotation.z = -0.08 * carga + 0.1 * gancho;
        apoio.position.y = 0.62 - 0.04 * carga;
        pescoco.rotation.y = 0.3 * carga - 0.4 * gancho;
        mandibula.rotation.x = 0.45 * gancho;
        for (const p of ps) {
          if (!p.frente || p.lado > 0) continue;
          p.coxa.rotation.x = -0.4 * carga - 1.1 * gancho;
          p.coxa.rotation.z = -0.5 * carga + 1.0 * gancho;
          p.canela.rotation.x = 0.8 * (carga + gancho);
        }
      } else if (estado === 'golpe3') {
        // Os golpes de pé: ergue-se inteiro nas patas de trás e golpeia com a esquerda e depois com a direita.
        const sobe = suave(Math.min(1, f / 0.25)) * (1 - suave(Math.max(0, (f - 0.82) / 0.18)));
        ergue(1.15 * sobe);
        apoio.position.y = 0.62 + 0.05 * sobe;
        pescoco.rotation.x = -0.2 * sobe;
        const esquerda = f > 0.25 && f < 0.55 ? Math.sin(((f - 0.25) / 0.3) * Math.PI) : 0;
        const direita = f > 0.5 && f < 0.82 ? Math.sin(((f - 0.5) / 0.32) * Math.PI) : 0;
        apoio.rotation.y = 0.3 * esquerda - 0.3 * direita;
        mandibula.rotation.x = 0.5 * sobe;
        for (const p of ps) {
          if (!p.frente) continue;
          const golpe = p.lado < 0 ? esquerda : direita;
          p.coxa.rotation.x = -1.2 * sobe + 0.9 * golpe;
          p.coxa.rotation.z = p.lado * (0.6 * sobe - 0.9 * golpe);
          p.canela.rotation.x = 0.9 * sobe - 0.5 * golpe;
        }
      } else if (estado === 'conjurar') {
        // O rugido de pé: o corpo todo erguido, as patas abertas e a boca escancarada.
        const u = suave(Math.min(1, f * 2.2));
        ergue(1.2 * u);
        apoio.position.y = 0.62 + 0.04 * u;
        pescoco.rotation.x = -0.25 * u;
        cabeca.rotation.x = -0.25 * u;
        mandibula.rotation.x = 0.75 * u * (0.85 + 0.15 * ciclo(f * 4));
        for (const p of ps) {
          if (!p.frente) continue;
          p.coxa.rotation.x = -1.1 * u;
          p.coxa.rotation.z = p.lado * 0.7 * u;
          p.canela.rotation.x = 0.9 * u;
        }
      } else {
        raiz.rotation.z = (Math.PI / 2) * suave(f);
        raiz.position.y = 0.24 * f;
        apoio.position.y = 0.62 - 0.36 * f;
        mandibula.rotation.x = 0.2 * f;
      }
    },
  };
}

interface Amostra { pos: number[]; giro: number[]; escala: number[] }

/**
 * Assa as poses em clipes (a posição, o giro e a escala de cada pivô `f_*`). Os ciclos fecham a volta (o último quadro
 * é o primeiro); o golpe e a morte vão do começo ao fim.
 */
export function assar(fera: Fera, quadros = 24): THREE.AnimationClip[] {
  const pivos: THREE.Object3D[] = [];
  fera.grupo.traverse((o) => {
    if (o.name.startsWith('f_')) pivos.push(o);
  });
  const ESTADOS: readonly [EstadoFera, number, boolean][] = [['parado', 2, true], ['andar', 1, true], ['correr', 0.6, true], ['golpe', 1, false], ['golpe2', 0.9, false], ['golpe3', 1.2, false], ['conjurar', 1.4, false], ['morte', 1, false]];
  const clipes = ESTADOS.map(([estado, dur, laco]) => {
    const tempos: number[] = [];
    const amostras = new Map<THREE.Object3D, Amostra>(pivos.map((p) => [p, { pos: [], giro: [], escala: [] }]));
    for (let i = 0; i <= quadros; i++) {
      const f = laco ? i / quadros : i / quadros;
      fera.animar(estado, laco && i === quadros ? 0 : f);
      tempos.push((i / quadros) * dur);
      for (const p of pivos) {
        const s = amostras.get(p);
        if (!s) continue;
        s.pos.push(p.position.x, p.position.y, p.position.z);
        s.giro.push(p.quaternion.x, p.quaternion.y, p.quaternion.z, p.quaternion.w);
        s.escala.push(p.scale.x, p.scale.y, p.scale.z);
      }
    }
    const trilhas = pivos.flatMap((p) => {
      const s = amostras.get(p);
      if (!s) return [];
      return [
        new THREE.VectorKeyframeTrack(`${p.name}.position`, tempos, s.pos),
        new THREE.QuaternionKeyframeTrack(`${p.name}.quaternion`, tempos, s.giro),
        new THREE.VectorKeyframeTrack(`${p.name}.scale`, tempos, s.escala),
      ];
    });
    return new THREE.AnimationClip(CLIPES_DA_FERA[estado], dur, trilhas);
  });
  fera.animar('parado', 0);
  return clipes;
}

/** As feras do palco em tempo real, pelo nome do modelo. */
export const FERAS_VIVAS: Readonly<Record<string, () => Fera>> = { lobo_companheiro: loboCompanheiro, urso_companheiro: ursoCompanheiro };
