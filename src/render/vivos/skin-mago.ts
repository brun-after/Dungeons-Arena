// A skin Sombra Rubra do mago (06/11/2026), refeita do zero a partir das medidas da arte (skin-mago-medidas.ts). Cada
// peça sai da caixa ou dos pontos que ocupa na imagem:
// - as alturas passam da arte ao rig por marcos (chão, joelho, virilha, ombro, queixo e topo da cabeça), porque a
//   cabeça da arte é maior que a do rig;
// - os tamanhos e o lado usam a altura do rig (H).
// O desenho vai espelhado no lado: na arte o cajado está na mão esquerda, aqui na direita, que é a dos golpes.
// As peças:
// - a cabeça virada para o lado livre, com o rosto em sombra e o cabelo cinza-violeta que vira carmesim nas pontas ao
//   vento;
// - o cachecol cinza que cobre a boca e os ombros;
// - o manto negro que abre em duas asas com ganchos de foice (o roxo embaixo, o vermelho só nos ganchos) e a borda
//   vermelha do forro na diagonal da frente;
// - as braçadeiras e as manoplas;
// - a placa do cinto inclinada;
// - a placa da coxa com a runa ᛉ, a joelheira sextavada, a greva com runas e a bota de placas.
// O pano e o cabelo voam com o vento de skin-pano.ts. O corpo do rig fica escondido.

import * as THREE from 'three';
import { altura as alturaNaArte, ASAS, caixa, CABELO, COSTAS, FAISCAS, INCLINACAO_DO_CINTO, lado as ladoNaArte, MANTO, PECAS, tam } from './skin-mago-medidas';
import type { Ossos, PecaSombria } from './sombrio-base';
import { aoLongo, Corpo, grupoEm, sorteio, V } from './sombrio-base';
import { dentes, eixosDoCorpo, mao, mix, pesosDoManto, suave, type Eixos } from './skin-ceifador';
import { fita, flutuante, lamina, mecha, superficie, ventoso, type Anel } from './skin-pano';

type Obj = THREE.Object3D;
const DUPLO = THREE.DoubleSide;

// ---------- a régua: da arte para o rig ----------
interface Regua {
  /** A altura do rig de uma fração de altura da arte (por marcos). */
  y: (fracao: number) => number;
  /** Um tamanho ou lado (fração de H da arte) no rig. */
  m: (fracao: number) => number;
}
function regua(c: Corpo, e: Eixos): Regua {
  const H = c.p('Head').y + 0.225 * c.u;
  const queixo = c.p('Head').y + 0.022 * c.u;
  // os marcos: [na arte (fração de H), no rig]
  const marcos: [number, number][] = [
    [0, 0],
    [alturaNaArte(692), c.p('calf_l').y],
    [alturaNaArte(515), c.p('thigh_l').y],
    [alturaNaArte(320), e.topo],
    [alturaNaArte(235), queixo],
    // a cabeça da arte (com o volume do cabelo) é maior que a do rig: do queixo ao topo vale a proporção da arte
    [1, queixo + (1 - alturaNaArte(235)) * H],
  ];
  return {
    y: (f) => {
      for (let i = 1; i < marcos.length; i++) {
        const [a0, r0] = marcos[i - 1] as [number, number], [a1, r1] = marcos[i] as [number, number];
        if (f <= a1 || i === marcos.length - 1) return mix(r0, r1, (f - a0) / (a1 - a0));
      }
      return H;
    },
    m: (f) => f * H,
  };
}

/** Uma tabela [x, valor] interpolada em linha reta (x crescente). */
function tabela(t: readonly (readonly [number, number])[]): (x: number) => number {
  return (x) => {
    const p0 = t[0] as readonly [number, number];
    if (x <= p0[0]) return p0[1];
    for (let i = 1; i < t.length; i++) {
      const [x0, v0] = t[i - 1] as readonly [number, number], [x1, v1] = t[i] as readonly [number, number];
      if (x <= x1) return mix(v0, v1, (x - x0) / (x1 - x0));
    }
    return (t[t.length - 1] as readonly [number, number])[1];
  };
}

// ---------- texturas ----------
function tela(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  if (!g) throw new Error('sem canvas 2d');
  return [c, g];
}
const comoTextura = (c: HTMLCanvasElement): THREE.CanvasTexture => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** A base gasta da armadura escura (manchas e riscos), comum às placas. */
function placaGasta(g: CanvasRenderingContext2D, base: string, semente: number): void {
  const r = sorteio(semente);
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 80; i++) {
    const x = r() * 512, y = r() * 512, raio = 10 + r() * 50;
    const grd = g.createRadialGradient(x, y, 0, x, y, raio);
    grd.addColorStop(0, r() < 0.65 ? 'rgba(0,0,0,0.28)' : 'rgba(140,130,170,0.07)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(x - raio, y - raio, raio * 2, raio * 2);
  }
}

/** As linhas de runa vermelho-escuras (a arte: vermelho fosco, não aceso) em `desenho`, sobre a placa gasta. */
function gravura(base: string, semente: number, desenho: (g: CanvasRenderingContext2D) => void): { map: THREE.CanvasTexture; brilho: THREE.CanvasTexture } {
  const [cb, gb] = tela();
  const [ce, ge] = tela();
  placaGasta(gb, base, semente);
  ge.fillStyle = '#000';
  ge.fillRect(0, 0, 512, 512);
  for (const [g, cor] of [[gb, '#7a1e30'], [ge, '#a01830']] as const) {
    g.strokeStyle = cor;
    g.lineWidth = 14;
    g.lineCap = 'square';
    g.lineJoin = 'miter';
    g.beginPath();
    desenho(g);
    g.stroke();
  }
  return { map: comoTextura(cb), brilho: comoTextura(ce) };
}

/** A runa ᛉ da coxa (a arte): o traço vertical, os braços para cima, a ponta em losango e os ganchos de baixo. */
const RUNA_DA_COXA = (g: CanvasRenderingContext2D): void => {
  g.moveTo(256, 70); g.lineTo(256, 450);
  g.moveTo(256, 230); g.lineTo(150, 110); g.moveTo(256, 230); g.lineTo(362, 110);
  g.moveTo(256, 70); g.lineTo(206, 140); g.moveTo(256, 70); g.lineTo(306, 140);
  g.moveTo(256, 330); g.lineTo(170, 420); g.moveTo(256, 330); g.lineTo(342, 420);
};
/** As linhas angulares das braçadeiras, da greva e do cinto: chevrons e traços paralelos. */
const LINHAS = (g: CanvasRenderingContext2D): void => {
  for (let y = 40; y < 512; y += 110) {
    g.moveTo(70, y); g.lineTo(256, y + 60); g.lineTo(442, y);
    g.moveTo(120, y + 50); g.lineTo(120, y + 95); g.moveTo(392, y + 50); g.lineTo(392, y + 95);
  }
};
/** O X da joelheira e a borda sextavada. */
const XIS = (g: CanvasRenderingContext2D): void => {
  g.moveTo(110, 110); g.lineTo(402, 402); g.moveTo(402, 110); g.lineTo(110, 402);
  g.moveTo(256, 30); g.lineTo(470, 150); g.lineTo(470, 362); g.lineTo(256, 482); g.lineTo(42, 362); g.lineTo(42, 150); g.closePath();
};

/** As dobras do pano negro: faixas cinza e sombras quase verticais (a arte). */
function dobras(g: CanvasRenderingContext2D, semente: number): void {
  const r = sorteio(semente);
  g.fillStyle = '#15141b';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const x = r() * 512, w = 6 + r() * 26;
    g.fillStyle = r() < 0.5 ? 'rgba(62,60,76,0.55)' : 'rgba(0,0,0,0.35)';
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w * 0.6 + (r() - 0.5) * 60, 512); g.lineTo(x + (r() - 0.5) * 60, 512); g.fill();
  }
}

/**
 * Uma asa do manto (ASAS): o negro com dobras; de `MANTO.roxo` para baixo, o roxo em blocos; de `MANTO.vermelho` para
 * baixo, o vermelho do gancho com furos roxos (a arte, em pixels). `ys` é o y médio da arte em cada estação, e a linha
 * da tela vai da primeira estação (alto) à última (baixo).
 */
function texturaDaAsa(ys: readonly number[], semente: number): THREE.CanvasTexture {
  const r = sorteio(semente);
  const [c, g] = tela();
  dobras(g, semente);
  const yDaLinha = (v: number) => {
    const f = (v / 512) * (ys.length - 1), k = Math.min(ys.length - 2, Math.floor(f));
    return mix(ys[k] as number, ys[k + 1] as number, f - k);
  };
  for (let v = 0; v < 512; v += 6)
    for (let x = 0; x < 512; x += 6) {
      const y = yDaLinha(v + r() * 30 - 15);
      if (y >= MANTO.vermelho) g.fillStyle = r() < 0.86 ? '#d42a44' : '#5a4677';
      else if (y >= MANTO.roxo) {
        if (r() < 0.25) continue;
        g.fillStyle = r() < 0.7 ? '#4f416c' : '#3c3256';
      } else continue;
      g.fillRect(x, v, 6 + Math.floor(r() * 2) * 6, 6);
    }
  return comoTextura(c);
}

/** O pano de trás: só o negro com dobras. */
function texturaDasCostas(): THREE.CanvasTexture {
  const [c, g] = tela();
  dobras(g, 603);
  return comoTextura(c);
}

/**
 * O pano que vira brasa (06/11/2026). Da fração `desde` para baixo, a barra se desfaz em furos cada vez mais densos
 * (`recorte`, o alphaMap), e as bordas dos furos ficam em brasa vermelha e laranja (`brilho`, o emissiveMap). Com
 * `borda`, a beira de fora (u perto de 1) também queima.
 */
function brasas(semente: number, desde: number, borda = false): { recorte: THREE.CanvasTexture; brilho: THREE.CanvasTexture } {
  const r = sorteio(semente);
  const [ca, ga] = tela();
  const [cb, gb] = tela();
  ga.fillStyle = '#fff';
  ga.fillRect(0, 0, 512, 512);
  gb.fillStyle = '#000';
  gb.fillRect(0, 0, 512, 512);
  const P = 6;
  for (let v = 0; v < 512; v += P)
    for (let x = 0; x < 512; x += P) {
      const fundo = Math.max(0, (v / 512 - desde) / (1 - desde)), beira = borda ? suave(0.82, 1, x / 512) * 0.7 : 0;
      const queima = Math.min(1, Math.pow(fundo, 1.4) + beira);
      if (queima <= 0) continue;
      const q = r();
      if (q < queima * 0.78) { ga.fillStyle = '#000'; ga.fillRect(x, v, P, P); }
      else if (q < queima * 1.25) {
        gb.fillStyle = r() < 0.6 ? '#ff2a3a' : r() < 0.6 ? '#ff6a2a' : '#a01020';
        gb.fillRect(x, v, P, P);
      }
    }
  const recorte = new THREE.CanvasTexture(ca);
  recorte.wrapS = recorte.wrapT = THREE.RepeatWrapping;
  return { recorte, brilho: comoTextura(cb) };
}

/** O cachecol: cinza-ardósia com dobras mais claras e sombras fundas (a arte). */
function texturaDoCachecol(): THREE.CanvasTexture {
  const r = sorteio(641);
  const [c, g] = tela();
  g.fillStyle = '#2a2833';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) {
    const y = r() * 512, h = 8 + r() * 30, inclina = (r() - 0.3) * 120;
    g.fillStyle = r() < 0.5 ? 'rgba(78,76,92,0.6)' : 'rgba(8,8,12,0.55)';
    g.beginPath(); g.moveTo(0, y); g.lineTo(512, y + inclina); g.lineTo(512, y + inclina + h); g.lineTo(0, y + h); g.fill();
  }
  return comoTextura(c);
}

/** O cabelo: cinza-violeta na raiz, escurece e vira carmesim a partir de `CABELO.carmesimDesde` (a arte). */
function texturaDoCabelo(): THREE.CanvasTexture {
  const [c, g] = tela();
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#46404f');
  grd.addColorStop(0.35, '#2e2836');
  grd.addColorStop(CABELO.carmesimDesde, '#4a1a30');
  grd.addColorStop(0.85, '#8e1f36');
  grd.addColorStop(1, '#b8283f');
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 512);
  return comoTextura(c);
}

function materiais() {
  // 06/11/2026: o lado de fora do manto 20% mais escuro (a cor multiplica a textura); o de dentro é o forro preto (`forrado`)
  const emBrasa = (map: THREE.Texture, b: ReturnType<typeof brasas>) => ventoso(new THREE.MeshStandardMaterial({
    map, color: new THREE.Color(0.8, 0.8, 0.8), roughness: 0.9, side: DUPLO, alphaMap: b.recorte, alphaTest: 0.5, emissive: 0xffffff, emissiveMap: b.brilho, emissiveIntensity: 1.1,
  }));
  const placa = (t: ReturnType<typeof gravura>, metal = 0.5) =>
    new THREE.MeshStandardMaterial({ map: t.map, emissiveMap: t.brilho, emissive: 0xffffff, emissiveIntensity: 0.35, metalness: metal, roughness: 0.55, side: DUPLO });
  return {
    costas: emBrasa(texturaDasCostas(), brasas(611, 0.68)),
    asaLivre: emBrasa(texturaDaAsa(ASAS.livre.map(([a, b]) => (a[1] + b[1]) / 2), 613), brasas(615, 0.62, true)),
    asaCajado: emBrasa(texturaDaAsa(ASAS.cajado.map(([a, b]) => (a[1] + b[1]) / 2), 617), brasas(619, 0.62, true)),
    // o cabelo e a escuridão dele flutuam como em baixa gravidade (o shader de skin-pano.ts)
    escuridao: flutuante(ventoso(new THREE.MeshBasicMaterial({ color: 0x08070c, side: DUPLO })), 0.045),
    brasaPreta: ventoso(new THREE.MeshBasicMaterial({ color: 0x0c0a10, side: DUPLO })),
    brasaAcesa: ventoso(new THREE.MeshBasicMaterial({ color: 0xff4a2a, side: DUPLO })),
    frente: ventoso(new THREE.MeshStandardMaterial({ color: 0x17161d, roughness: 0.9, side: DUPLO })),
    forro: ventoso(new THREE.MeshStandardMaterial({ color: 0xd42a44, emissive: 0x8a1024, emissiveIntensity: 0.25, roughness: 0.7, side: DUPLO })),
    cachecol: ventoso(new THREE.MeshStandardMaterial({ map: texturaDoCachecol(), roughness: 0.92, side: DUPLO })),
    cabelo: flutuante(ventoso(new THREE.MeshStandardMaterial({ map: texturaDoCabelo(), roughness: 0.8, side: DUPLO })), 0.06),
    tunica: new THREE.MeshStandardMaterial({ color: 0x16151c, roughness: 0.9, side: DUPLO }),
    calca: new THREE.MeshStandardMaterial({ color: 0x1c1b23, roughness: 0.85, side: DUPLO }),
    coxa: placa(gravura('#2c2b36', 701, RUNA_DA_COXA), 0.4),
    linhas: placa(gravura('#2a2934', 711, LINHAS)),
    joelheira: placa(gravura('#34333f', 721, XIS), 0.6),
    bota: new THREE.MeshStandardMaterial({ color: 0x2f2e39, metalness: 0.55, roughness: 0.5 }),
    luva: new THREE.MeshStandardMaterial({ color: 0x3a3946, metalness: 0.35, roughness: 0.6 }),
    couro: new THREE.MeshStandardMaterial({ color: 0x15131a, roughness: 0.6 }),
    sombra: new THREE.MeshBasicMaterial({ color: 0x050407 }),
    faisca: flutuante(ventoso(new THREE.MeshBasicMaterial({ color: 0xe0203a, side: DUPLO })), 0.08),
  };
}
type M = ReturnType<typeof materiais>;

/** Um tubo pela lista de pontos, com um raio e um osso por ponto de controle (mistura entre eles). */
function tubo(pontos: THREE.Vector3[], raios: number[], ossos: string[], m: THREE.Material, extras: Obj[], repete: [number, number] = [1, 1]): void {
  const curva = new THREE.CatmullRomCurve3(pontos);
  const N = 12;
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const f = (i / (N - 1)) * (raios.length - 1);
    const k = Math.min(raios.length - 2, Math.floor(f));
    const rr = mix(raios[k] as number, raios[k + 1] as number, f - k);
    aneis.push({ c: curva.getPointAt(i / (N - 1)), rx: rr, rz: rr * 0.95 });
  }
  extras.push(superficie({
    aneis, colunas: 20, repete,
    pesos: (i) => {
      const f = (i / (N - 1)) * (ossos.length - 1);
      const k = Math.min(ossos.length - 2, Math.floor(f));
      return [ossos[k] as string, ossos[k + 1] as string, 1 - suave(0.25, 0.75, f - k)];
    },
  }, m));
}

/** O ponto do osso `a` ao osso `b` na altura `y` do rig. */
function naAltura(a: THREE.Vector3, b: THREE.Vector3, y: number): THREE.Vector3 {
  return a.clone().lerp(b, Math.min(1, Math.max(0, (a.y - y) / (a.y - b.y || 1))));
}

// ---------- o corpo: tronco, pernas, braços e cinto ----------
function tronco(c: Corpo, e: Eixos, m: M, extras: Obj[]): void {
  const N = 10;
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const y = mix(e.topo, e.bacia - 0.06 * c.u, i / (N - 1));
    aneis.push({ c: V(0, y, e.zDe(y)), rx: e.rx(y) * 0.82, rz: e.rz(y) * 0.85 });
  }
  extras.push(superficie({ aneis, colunas: 24, pesos: pesosDoManto(c, e) }, m.tunica));
}

/** As pernas: a calça, a placa da coxa, a joelheira, a greva e a bota, cada uma na faixa de altura medida. */
function pernas(c: Corpo, R: Regua, m: M, extras: Obj[]): void {
  const coxa = caixa(PECAS.placaDaCoxa), joelheira = caixa(PECAS.joelheira), greva = caixa(PECAS.greva), bota = caixa(PECAS.bota);
  const rCoxa = R.m(coxa.largura) / 2, rCanela = R.m(greva.largura) / 2 * 0.85, rBota = R.m(bota.largura) / 2;
  for (const lado of ['l', 'r'] as const) {
    const quadril = c.p(`thigh_${lado}`), joelho = c.p(`calf_${lado}`), tornozelo = c.p(`foot_${lado}`), bola = c.p(`ball_${lado}`);
    // a calça
    tubo([quadril.clone().add(V(0, 0.03 * c.u, 0)), quadril.clone().lerp(joelho, 0.5), joelho, joelho.clone().lerp(tornozelo, 0.5), tornozelo],
      [rCoxa * 0.95, rCoxa * 0.88, rCanela * 1.05, rCanela, rCanela * 0.9],
      [`thigh_${lado}`, `thigh_${lado}`, `calf_${lado}`, `calf_${lado}`, `foot_${lado}`], m.calca, extras);
    // a placa da coxa com a runa, na frente, de `y0` a `y1`
    const y0 = R.y(alturaNaArte(PECAS.placaDaCoxa[1])), y1 = R.y(alturaNaArte(PECAS.placaDaCoxa[3]));
    const topo = naAltura(quadril, joelho, y0), fim = naAltura(quadril, joelho, y1);
    const placa = new THREE.Mesh(new THREE.CylinderGeometry(rCoxa * 1.12, rCoxa * 1.04, 1, 16, 1, true, -Math.PI * 0.42, Math.PI * 0.84), m.coxa);
    placa.scale.y = topo.distanceTo(fim);
    aoLongo(placa, topo, fim, 0.5);
    c.prender(`thigh_${lado}`, placa, extras);
    // a joelheira sextavada (a placa de 6 lados de frente), na altura medida
    const yj = R.y(joelheira.altura);
    const pj = naAltura(quadril, tornozelo, yj).setY(yj);
    const jo = new THREE.Mesh(new THREE.CylinderGeometry(R.m(joelheira.largura) / 2, R.m(joelheira.largura) / 2 * 0.9, 0.02 * c.u, 6), m.joelheira);
    jo.rotation.set(Math.PI / 2, Math.PI / 6, 0);
    jo.scale.set(1, 1, R.m(joelheira.alto) / R.m(joelheira.largura));
    jo.position.copy(pj).add(V(0, 0, rCanela * 1.25));
    c.prender(`calf_${lado}`, jo, extras);
    // a greva com as linhas de runa
    const g0 = naAltura(joelho, tornozelo, R.y(alturaNaArte(PECAS.greva[1]))), g1 = naAltura(joelho, tornozelo, R.y(alturaNaArte(PECAS.greva[3])));
    tubo([g0, g0.clone().lerp(g1, 0.5), g1], [rCanela * 1.25, rCanela * 1.2, rCanela * 1.15], [`calf_${lado}`, `calf_${lado}`, `calf_${lado}`], m.linhas, extras, [2, 1]);
    // a bota de placas: do cano (altura medida) ao tornozelo, ao peito do pé e à ponta afilada
    const cano = naAltura(joelho, tornozelo, R.y(alturaNaArte(PECAS.bota[1])));
    const ponta = bola.clone().add(bola.clone().sub(tornozelo).setY(0).normalize().multiplyScalar(rBota * 1.3)).setY(0.012 * c.u);
    tubo([cano, tornozelo, tornozelo.clone().lerp(bola, 0.55), bola, ponta], [rBota, rBota * 0.98, rBota * 0.85, rBota * 0.62, rBota * 0.12],
      [`calf_${lado}`, `foot_${lado}`, `foot_${lado}`, `ball_${lado}`, `ball_${lado}`], m.bota, extras);
  }
}

/** Os braços: a manga, a braçadeira (o comprimento medido) e a manopla grossa (a largura medida). */
function bracos(c: Corpo, R: Regua, m: M, extras: Obj[]): void {
  const livre = caixa(PECAS.bracadeiraLivre), manopla = caixa(PECAS.manopla);
  const rBraco = R.m(livre.largura) / 2;
  for (const lado of ['l', 'r'] as const) {
    const ombro = c.p(`upperarm_${lado}`), cot = c.p(`lowerarm_${lado}`), pulso = c.p(`hand_${lado}`);
    tubo([ombro.clone().add(V(0, 0.03 * c.u, 0)), ombro.clone().lerp(cot, 0.5), cot, cot.clone().lerp(pulso, 0.5), pulso],
      [rBraco * 1.3, rBraco * 1.15, rBraco * 1.05, rBraco * 0.95, rBraco * 0.85],
      [`upperarm_${lado}`, `upperarm_${lado}`, `lowerarm_${lado}`, `lowerarm_${lado}`, `hand_${lado}`], m.tunica, extras);
    // a braçadeira: da arte, cobre do pulso até 3/4 do antebraço
    const b0 = pulso.clone().lerp(cot, 0.78), b1 = pulso.clone().lerp(cot, 0.04);
    tubo([b0, b0.clone().lerp(b1, 0.5), b1], [rBraco * 1.18, rBraco * 1.12, rBraco * 1.05], [`lowerarm_${lado}`, `lowerarm_${lado}`, `lowerarm_${lado}`], m.linhas, extras, [2, 1]);
    // a manopla
    mao(c, lado, { osso: m.luva }, extras, 2.4);
    const dedos = c.p(`middle_01_${lado}`);
    const dorso = new THREE.Mesh(new THREE.BoxGeometry(R.m(manopla.largura) * 0.8, 1, R.m(manopla.largura) * 0.4), m.luva);
    dorso.scale.y = pulso.distanceTo(dedos) * 1.05;
    aoLongo(dorso, pulso, dedos, 0.5);
    c.prender(`hand_${lado}`, dorso, extras);
    tubo([pulso.clone().lerp(cot, 0.12), pulso.clone().lerp(dedos, 0.15)], [rBraco * 1.3, rBraco * 1.2], [`lowerarm_${lado}`, `hand_${lado}`], m.luva, extras);
  }
}

/** O cinto e a placa ornada, do tamanho e na inclinação medidos, um pouco para o lado do cajado. */
function cinto(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const pc = caixa(PECAS.placaDoCinto);
  const y = R.y(pc.altura);
  const tira = new THREE.Mesh(new THREE.TorusGeometry(1, 0.016 * c.u, 6, 36), m.couro);
  tira.rotation.x = Math.PI / 2;
  tira.scale.set(e.rx(e.bacia) * 0.84, e.rz(e.bacia) * 0.88, 1);
  tira.position.set(0, e.bacia + 0.02 * c.u, e.zDe(e.bacia));
  c.prender('pelvis', tira, extras);
  // a placa: as medidas da arte são da caixa inclinada; o lado maior é o comprimento da diagonal
  const angulo = (INCLINACAO_DO_CINTO * Math.PI) / 180;
  const comprido = R.m(pc.alto) / Math.cos(angulo) * 0.78, largo = R.m(pc.largura) * 0.62;
  const placa = new THREE.Mesh(new THREE.BoxGeometry(largo, comprido, 0.02 * c.u), m.linhas);
  placa.position.set(R.m(pc.lado), y, e.zDe(y) + e.rz(y) * 0.92);
  placa.rotation.set(-0.12, 0, -angulo);
  c.prender('pelvis', placa, extras);
}

// ---------- o pano: manto, forro, cachecol ----------
/** O quanto o manto encolhe em relação ao corpo (06/11/2026: 15% menor, no comprimento e no raio do leque). */
const MANTO_MENOR = 0.85;

/**
 * O pano forrado (06/11/2026): por fora o material da malha (só a face de fora) e por dentro todo preto (a face de
 * dentro), com os mesmos furos das brasas. `dentro` diz qual face da malha fica virada para o corpo.
 */
function forrado(malha: THREE.Mesh, extras: Obj[], dentro: THREE.Side = THREE.BackSide): void {
  const fora = malha.material as THREE.MeshStandardMaterial;
  fora.side = dentro === THREE.BackSide ? THREE.FrontSide : THREE.BackSide;
  const preto = ventoso(new THREE.MeshBasicMaterial({ color: 0x000000, side: dentro, alphaMap: fora.alphaMap, alphaTest: 0.5 }));
  const verso = new THREE.Mesh(malha.geometry.clone(), preto);
  Object.assign(verso.userData, malha.userData);
  extras.push(malha, verso);
}
/**
 * O manto: o pano de trás (COSTAS, anéis só nas costas) e as duas asas (ASAS), lâminas entre a borda de dentro e a de
 * fora medidas estação por estação. Entre o gancho e o corpo a arte fica vazia, por isso as asas não são uma parede.
 * As asas recuam para trás conforme descem (o vento as abre), e a ponta do gancho é a parte mais solta.
 */
function manto(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const pesos = pesosDoManto(c, e);
  const yOmbro = R.y(alturaNaArte(COSTAS.ombro));
  const encolher = (y: number) => yOmbro + (y - yOmbro) * MANTO_MENOR;
  const yBarra = encolher(R.y(alturaNaArte(COSTAS.barra)));
  // 06/11/2026: o manto abre em leque para fora em 240° em volta do corpo (os lados e as costas; só a frente fica livre),
  // em ondas largas, e a barra se desfaz em brasas (o material). O raio cresce do ombro até a barra como o das asas.
  const N = 22, COL = 60;
  const LEQUE = (Math.PI * 4) / 3;
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), y = mix(yOmbro, yBarra, t) + suave(0.2, 1, t) * 0.32 * c.u * MANTO_MENOR;
    const zy = e.zDe(Math.max(y, e.bacia));
    const raio = mix(R.m(tam(COSTAS.larguraEmCima)) / 2, R.m(tam(640)) * MANTO_MENOR, Math.pow(t, 0.6));
    aneis.push({ c: V(0, y, zy), rx: raio, rz: raio * 0.92 });
  }
  const cortes = dentes(COL, 311, 0.09 * c.u);
  forrado(superficie({
    aneis, colunas: COL, arco: [Math.PI / 2 + LEQUE / 4, LEQUE], repete: [2, 1],
    ruga: (i, _j, a) => 1 + Math.sin(a * 7 + i * 0.35) * 0.12 * suave(2, N - 1, i) + Math.sin(a * 15 - i * 0.2) * 0.04 * suave(6, N - 1, i),
    descer: (i, j, a) => Math.sin(a * 6 + 1.3) * 0.06 * c.u * suave(N / 2, N - 1, i) + (i >= N - 2 ? cortes[j] ?? 0 : 0),
    solto: (i) => Math.pow(suave(1, N - 1, i), 1.1) * 1.3,
    pesos,
  }, m.costas), extras, THREE.FrontSide);
  // as asas
  for (const [estacoes, material] of [[ASAS.livre, m.asaLivre], [ASAS.cajado, m.asaCajado]] as const) {
    const pontos = estacoes.map(([dentro, fora], k) => {
      const s = k / (estacoes.length - 1);
      const pi = V(R.m(ladoNaArte(dentro[0])) * MANTO_MENOR, encolher(R.y(alturaNaArte(dentro[1]))), 0);
      const po = V(R.m(ladoNaArte(fora[0])) * MANTO_MENOR, encolher(R.y(alturaNaArte(fora[1]))), 0);
      const zc = e.zDe(Math.max(Math.min(pi.y, e.topo), e.bacia));
      pi.z = zc - mix(0.02, 0.18, s) * c.u * MANTO_MENOR;
      po.z = zc - mix(0.08, 0.34, s) * c.u * MANTO_MENOR;
      return { i: pi, o: po };
    });
    forrado(lamina({
      estacoes: pontos, colunas: 14, barriga: 0.1,
      dobra: (s, t) => V(0, Math.sin(t * Math.PI * 3 + s * 5) * 0.025 * c.u * s, Math.sin(t * Math.PI * 4 + s * 7) * 0.05 * c.u * s),
      solto: (s, t) => Math.pow(suave(0.05, 1, s), 1.1) * (0.8 + t * 0.6),
      pesos: (_s, _t, p) => pesos(0, 0, 0, p),
    }, material), extras);
  }
  // as brasas soltas: pedaços do pano que se desprendem da barra no mesmo leque de 240°, para fora e para cima
  const r = sorteio(1777);
  for (let i = 0; i < 90; i++) {
    const t = r();
    const a = Math.PI / 2 + LEQUE / 4 + r() * LEQUE;
    const dist = R.m(tam(640)) * MANTO_MENOR * (1 + t * 0.35);
    const p = V(Math.cos(a) * dist, encolher(mix(R.y(alturaNaArte(COSTAS.barra)), R.y(alturaNaArte(560)), r())) + t * 0.12 * c.u, e.zDe(e.bacia) + Math.sin(a) * dist);
    const l = R.m(tam(4 + r() * 9));
    const acesa = r() < 0.55;
    extras.push(superficie({
      aneis: [{ c: p, rx: l, rz: l * 0.3 }, { c: p.clone().add(V(0, -l * (0.8 + r()), 0)), rx: l * 0.5, rz: l * 0.2 }],
      colunas: 4, solto: () => 1.1 + t * 0.5, pesos: () => ['pelvis', 'spine_02', 0.6],
    }, acesa ? (r() < 0.7 ? m.faisca : m.brasaAcesa) : m.brasaPreta));
  }
}


/**
 * A frente do manto: o painel que cruza o corpo na diagonal, do ombro do lado do cajado até a asa do lado livre (o
 * lado de fora da linha), e a borda vermelha do forro nessa linha (`MANTO.forroDe` até `forroAte`, 12 px de largura).
 */
function frente(c: Corpo, e: Eixos, R: Regua, m: M, extras: Obj[]): void {
  const de = V(R.m(ladoNaArte(MANTO.forroDe[0])), R.y(alturaNaArte(MANTO.forroDe[1])), 0);
  const ate = V(R.m(ladoNaArte(MANTO.forroAte[0])), R.y(alturaNaArte(MANTO.forroAte[1])), 0);
  const dir = ate.clone().sub(de).normalize();
  const fora = V(-dir.y, dir.x, 0);
  if (fora.x < 0) fora.negate();
  const N = 10;
  const linha: THREE.Vector3[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const p = de.clone().lerp(ate, t);
    const yy = Math.max(p.y, e.bacia);
    p.z = e.zDe(yy) + e.rz(yy) * 0.98 + mix(0.03, 0.06, t) * c.u;
    linha.push(p);
  }
  const largo = R.m(tam(60));
  extras.push(fita(linha.map((p) => p.clone().addScaledVector(fora, largo / 2).add(V(0, 0, -0.008 * c.u))), linha.map(() => largo), 'spine_03', m.frente, 0.5));
  extras.push(fita(linha, linha.map(() => R.m(tam(MANTO.larguraDoForro)) * 1.4), 'spine_03', m.forro, 0.5));
}

/**
 * O cachecol (PECAS.cachecol): sobe pelas laterais da cabeça, cobre a boca na frente (o queixo da arte) e desce em
 * dobras até os ombros; a largura embaixo é a da caixa medida.
 */
function cachecol(c: Corpo, R: Regua, m: M, extras: Obj[]): void {
  const cx = caixa(PECAS.cachecol);
  const cab = c.p('Head'), pesc = c.p('neck_01');
  const yTopo = R.y(alturaNaArte(175)), yBoca = R.y(alturaNaArte(PECAS.rosto[3])), yBaixo = R.y(alturaNaArte(PECAS.cachecol[3]));
  const N = 12;
  const aneis: Anel[] = [];
  const largura = tabela([[0, R.m(tam(215)) / 2], [0.35, R.m(tam(235)) / 2], [1, R.m(cx.largura) / 2]]);
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const y = mix(yTopo, yBaixo, Math.pow(t, 0.9));
    const z = mix(cab.z, pesc.z, suave(0, 0.5, t));
    aneis.push({ c: V(R.m(cx.lado) * t, y, z), rx: largura(t), rz: largura(t) * mix(1.02, 0.85, t) });
  }
  const descerFrente = yTopo - yBoca;
  extras.push(superficie({
    aneis, colunas: 44,
    ruga: (i, _j, a) => 1 + (Math.sin(a * 5 - i * 0.6) * 0.07 + Math.sin(a * 11) * 0.025) * suave(1, 6, i),
    // a abertura do rosto: os primeiros anéis descem na frente até a boca
    descer: (i, _j, a) => (i <= 2 ? Math.pow(Math.max(0, Math.sin(a)), 2) * descerFrente * (1 - i / 3) : 0),
    solto: (i) => suave(5, N - 1, i) * 0.45,
    pesos: (i) => (i <= 3 ? ['Head', 'neck_01', 0.7 - i * 0.18] : ['spine_03', 'neck_01', suave(3, 7, i)]),
  }, m.cachecol));
}

// ---------- a cabeça, o cabelo e as faíscas ----------
/**
 * A cabeça (PECAS.cabeloMassa e PECAS.rosto). A massa de cabelo tem a largura medida. O rosto é sombra e fica virado para
 * o lado livre, como na arte, onde o centro do rosto está 0,07 H para o lado oposto ao cajado.
 */
function cabeca(c: Corpo, R: Regua, m: M, extras: Obj[]): void {
  const massa = caixa(PECAS.cabeloMassa), rosto = caixa(PECAS.rosto);
  const cab = c.p('Head');
  const g = grupoEm(c, cab);
  const raio = R.m(massa.largura) / 2;
  const yCentro = R.y(massa.altura) - cab.y;
  const giro = Math.atan2(R.m(rosto.lado - massa.lado), raio);
  g.rotation.y = giro;
  const cranio = new THREE.Mesh(new THREE.SphereGeometry(raio, 28, 18), m.sombra);
  cranio.scale.set(0.92, (R.y(1) - R.y(alturaNaArte(PECAS.cabeloMassa[3]))) / 2 / raio, 1);
  cranio.position.set(0, yCentro, -0.01 * c.u);
  g.add(cranio);
  const sombra = new THREE.Mesh(new THREE.SphereGeometry(raio * 0.78, 20, 12), m.sombra);
  sombra.scale.set(R.m(rosto.largura) / 2 / (raio * 0.78), 0.95, 0.6);
  sombra.position.set(0, R.y(rosto.altura) - cab.y, raio * 0.55);
  g.add(sombra);
  c.prender('Head', g, extras);
}

/** Um caminho de mecha: da raiz até a ponta, ondulando, com a ponta caindo (`queda`). */
function caminho(raiz: THREE.Vector3, ponta: THREE.Vector3, onda: number, fase: number, queda: number): THREE.Vector3[] {
  return Array.from({ length: 9 }, (_, k) => {
    const t = k / 8;
    return raiz.clone().lerp(ponta, t).add(V(0, Math.sin(t * Math.PI * 1.6 + fase) * onda * t - queda * t * t * t, Math.cos(t * Math.PI * 1.3 + fase) * onda * 0.6 * t));
  });
}

/**
 * O cabelo (CABELO). As mechas saem da raiz medida e vão até a faixa das pontas, todas para o lado livre e um pouco para
 * trás, com a ponta caindo. Os fios finos e enrolados ficam soltos no alto.
 */
function cabelo(c: Corpo, R: Regua, m: M, extras: Obj[]): void {
  const r = sorteio(909);
  const cab = c.p('Head');
  const massa = caixa(PECAS.cabeloMassa);
  const raio = R.m(massa.largura) / 2;
  const centro = V(R.m(massa.lado), R.y(massa.altura), cab.z - 0.01 * c.u);
  // a capa de mechas curtas sobre o crânio, deitando para o lado livre e para trás
  for (let i = 0; i < 90; i++) {
    const az = r() * Math.PI * 2, el = 0.15 + r() * 1.35;
    const n = V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    if (n.z > 0.55 && n.y < 0.5) continue; // não cobre o rosto
    const p = centro.clone().add(n.clone().multiplyScalar(raio * 0.95));
    const fim = p.clone().add(V(0.09 * c.u + r() * 0.06 * c.u, -0.04 * c.u - r() * 0.05 * c.u, -0.06 * c.u));
    extras.push(mecha(caminho(p, fim, 0.01 * c.u, r() * 6, 0.02 * c.u), R.m(tam(26)), R.m(tam(7)), 'Head', m.cabelo, 0.25, n));
  }
  // 06/11/2026: a escuridão que enche o vão entre o crânio e as mechas: massas negras que saem da cabeça na direção do
  // vento (para o lado livre e para trás), da largura do crânio, e afinam até perto da metade das mechas
  const rx = R.m(ladoNaArte(CABELO.raiz.x));
  const rumo = V(R.m(ladoNaArte((CABELO.pontas.x0 + CABELO.pontas.x1) / 2)), R.y(alturaNaArte((CABELO.pontas.y0 + CABELO.pontas.y1) / 2)), cab.z - raio * 0.6 - 0.12 * c.u);
  for (const [escala, ate, sobe] of [[1, 0.62, 0], [0.7, 0.8, 0.25], [0.6, 0.72, -0.3]] as const) {
    const aneis: Anel[] = [];
    for (let k = 0; k < 8; k++) {
      const t = k / 7;
      const ctr = centro.clone().lerp(rumo, t * ate).add(V(0, sobe * raio * t, -raio * 0.15 * t));
      const f = Math.pow(1 - t, 1.3) * 0.88 + 0.06;
      aneis.push({ c: ctr, rx: raio * escala * f, rz: raio * escala * f * 0.85 });
    }
    extras.push(superficie({
      aneis, colunas: 18, frente: V(1, 0, 0),
      ruga: (i, _j, a) => 1 + Math.sin(a * 7 + i) * 0.12 * (i / 7),
      solto: (i) => Math.pow(i / 7, 1.2) * 0.75,
      pesos: () => ['Head', 'Head', 1],
    }, m.escuridao));
  }
  // as mechas longas ao vento: da raiz medida até a faixa das pontas (lado livre = +x), com a ponta caindo
  for (let i = 0; i < 72; i++) {
    const yRaiz = R.y(alturaNaArte(mix(CABELO.raiz.y0, CABELO.raiz.y1, r())));
    const raiz = V(rx + (r() - 0.5) * 0.14 * c.u, yRaiz, cab.z - raio * (0.1 + r() * 0.75));
    const ponta = V(R.m(ladoNaArte(mix(CABELO.pontas.x0, CABELO.pontas.x1, r()))), R.y(alturaNaArte(mix(CABELO.pontas.y0, CABELO.pontas.y1, r()))), raiz.z - (0.08 + r() * 0.12) * c.u);
    const grossa = r() < 0.5;
    extras.push(mecha(caminho(raiz, ponta, (0.02 + r() * 0.03) * c.u, r() * 6, (0.03 + r() * 0.05) * c.u),
      R.m(tam(grossa ? 28 : 16)), R.m(tam(grossa ? 9 : 5)), 'Head', m.cabelo, 0.8 + r() * 0.3, V(0, 1, 0)));
  }
  // 06/11/2026: a juba. O cabelo abre no mesmo leque de 240° do manto (os lados e as costas; a frente fica livre), com
  // metade do alcance dele, caindo nas pontas. Por baixo, uma casca com a cor do cabelo e o mesmo formato fecha os vãos.
  const LEQUE = (Math.PI * 4) / 3, a0 = Math.PI / 2 + LEQUE / 4;
  const alcance = R.m(tam(640)) * 0.5;
  const queda = 0.32 * c.u;
  {
    const N = 10;
    const aneis: Anel[] = [];
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      // a casca da juba, com a cor do cabelo: só a cabeça é o círculo preto. Desce mais depressa do que abre (sem aba no alto)
      const rr = mix(raio * 0.9, alcance * 0.75, Math.pow(t, 1.4));
      aneis.push({ c: V(centro.x, centro.y + raio * 0.2 - queda * 1.3 * Math.pow(t, 0.85), centro.z), rx: rr, rz: rr });
    }
    extras.push(superficie({
      aneis, colunas: 40, arco: [a0, LEQUE],
      ruga: (i, _j, a) => 1 + Math.sin(a * 9 + i * 0.7) * 0.1 * (i / (N - 1)),
      descer: (i, _j, a) => Math.abs(Math.sin(a * 4.5)) * 0.06 * c.u * (i / (N - 1)),
      solto: (i) => Math.pow(i / (N - 1), 1.1) * 0.8,
      pesos: () => ['Head', 'Head', 1],
    }, m.cabelo));
  }
  for (let i = 0; i < 150; i++) {
    const a = a0 + r() * LEQUE, el = 0.25 + r() * 1.1;
    const n = V(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
    const raiz = centro.clone().add(n.clone().multiplyScalar(raio * 0.92));
    const longe = alcance * (0.65 + r() * 0.45);
    const ponta = V(centro.x + Math.cos(a) * longe, centro.y + raio * 0.3 - queda * (0.5 + r() * 0.7), centro.z + Math.sin(a) * longe);
    const grossa = r() < 0.55;
    extras.push(mecha(caminho(raiz, ponta, (0.02 + r() * 0.04) * c.u, r() * 6, (0.04 + r() * 0.08) * c.u),
      R.m(tam(grossa ? 30 : 17)), R.m(tam(grossa ? 9 : 5)), 'Head', m.cabelo, 0.7 + r() * 0.4, n));
  }
  // os fios soltos do alto: finos, em laço
  for (let i = 0; i < 9; i++) {
    const x = R.m(ladoNaArte(mix(CABELO.fiosDoAlto.x0, CABELO.fiosDoAlto.x1, r())));
    const y = R.y(alturaNaArte(mix(CABELO.fiosDoAlto.y0, CABELO.fiosDoAlto.y1, r())));
    const raiz = V(centro.x + (r() - 0.5) * raio, centro.y + raio * 0.7, centro.z - r() * raio * 0.4);
    const pts = Array.from({ length: 8 }, (_, k) => {
      const t = k / 7, a = t * Math.PI * 1.4;
      return raiz.clone().lerp(V(x, y, raiz.z - 0.03 * c.u), t).add(V(0, Math.sin(a) * 0.035 * c.u, Math.cos(a) * 0.02 * c.u - 0.02 * c.u));
    });
    extras.push(mecha(pts, R.m(tam(5)), R.m(tam(3)), 'Head', m.cabelo, 0.6, V(0, 1, 0)));
  }
  // as faíscas: nas duas nuvens medidas
  for (const [x0, y0, x1, y1] of FAISCAS) {
    for (let i = 0; i < 9; i++) {
      const p = V(R.m(ladoNaArte(mix(x0, x1, r()))), R.y(alturaNaArte(mix(y0, y1, r()))), cab.z - (r() * 0.25) * c.u);
      const l = R.m(tam(5 + r() * 6));
      extras.push(superficie({
        aneis: [{ c: p, rx: l, rz: l * 0.25 }, { c: p.clone().add(V(0, -l, 0)), rx: l * 0.7, rz: l * 0.2 }],
        colunas: 4, solto: () => 0.9 + r() * 0.3, pesos: () => ['Head', 'Head', 1],
      }, m.faisca));
    }
  }
}

/** A veste inteira da skin; o palco esconde o corpo do rig (`esconder`) e põe o cajado na mão direita. */
export function vesteDaSombraRubra(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const e = eixosDoCorpo(c);
  const R = regua(c, e);
  const m = materiais();
  const extras: Obj[] = [];
  tronco(c, e, m, extras);
  pernas(c, R, m, extras);
  bracos(c, R, m, extras);
  cinto(c, e, R, m, extras);
  manto(c, e, R, m, extras);
  frente(c, e, R, m, extras);
  cachecol(c, R, m, extras);
  cabeca(c, R, m, extras);
  cabelo(c, R, m, extras);
  return { extras, esconder: '.' };
}
