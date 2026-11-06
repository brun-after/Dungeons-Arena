// As texturas e os materiais do Ceifador (06/11/2026), no estilo de pano pesado e gasto (camadas, dobras fundas,
// acabamentos bordados). Paleta fria da arte: preto-arroxeado no fundo das dobras, cinza-malva nas cristas, e o bordado
// em gavinhas num cinza-lilás gasto. Separado de skin-ceifador.ts para ele caber no limite de linhas.

import * as THREE from 'three';
import { metal, sorteio } from './sombrio-base';
import { filigrana, rasgos, ventoso } from './skin-pano';

const DUPLO = THREE.DoubleSide;

function tela(lado = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = lado;
  const g = c.getContext('2d');
  if (!g) throw new Error('sem canvas 2d');
  return [c, g];
}
const comoTextura = (c: HTMLCanvasElement, repete: [number, number] = [1, 1]): THREE.CanvasTexture => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repete[0], repete[1]);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/**
 * O tecido pesado: faixas verticais de dobra (o fundo escuro e a crista clara, com o degradê entre elas), o desgaste em
 * manchas e o fio do tecido. `escuro` é o fundo da dobra e `claro`, a crista.
 */
export function tecido(escuro: string, claro: string, semente: number, dobras = 9): THREE.CanvasTexture {
  const r = sorteio(semente);
  const [c, g] = tela();
  g.fillStyle = escuro;
  g.fillRect(0, 0, 512, 512);
  let x = 0;
  for (let i = 0; i < dobras * 2; i++) {
    const w = (512 / dobras) * (0.35 + r() * 0.5);
    const grd = g.createLinearGradient(x, 0, x + w, 0);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.5, r() < 0.6 ? claro : 'rgba(0,0,0,0.35)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.35 + r() * 0.45;
    g.fillStyle = grd;
    // a dobra abre um pouco para baixo (o pano cai e alarga)
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w * 1.25 + (r() - 0.5) * 20, 512); g.lineTo(x - w * 0.25 + (r() - 0.5) * 20, 512); g.fill();
    x = (x + w * 0.55) % 512;
  }
  g.globalAlpha = 1;
  for (let i = 0; i < 70; i++) {
    const px = r() * 512, py = r() * 512, raio = 8 + r() * 40;
    const grd = g.createRadialGradient(px, py, 0, px, py, raio);
    grd.addColorStop(0, r() < 0.7 ? 'rgba(0,0,0,0.25)' : 'rgba(150,135,150,0.08)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(px - raio, py - raio, raio * 2, raio * 2);
  }
  for (let y = 0; y < 512; y += 2) { g.fillStyle = `rgba(0,0,0,${0.02 + r() * 0.04})`; g.fillRect(0, y, 512, 1); }
  return comoTextura(c);
}

/** As gavinhas do bordado numa faixa (x0, largura) de `y0` a `y1`, com a moldura dupla (o acabamento em relevo). */
export function gavinhas(g: CanvasRenderingContext2D, x0: number, largura: number, y0: number, y1: number, cor = '#8a7c88', fundo = '#2a2228'): void {
  g.fillStyle = fundo;
  g.fillRect(x0, y0, largura, y1 - y0);
  g.strokeStyle = cor;
  g.lineWidth = Math.max(2, largura * 0.09);
  const passo = largura * 1.1;
  for (let v = y0 + passo / 2, k = 0; v < y1 - passo / 3; v += passo, k++) {
    const lado = k % 2 === 0 ? 1 : -1;
    const cx = x0 + largura / 2;
    g.beginPath();
    g.arc(cx + lado * largura * 0.08, v, largura * 0.3, lado > 0 ? Math.PI * 0.5 : -Math.PI * 0.5, lado > 0 ? Math.PI * 2.2 : Math.PI * 1.2);
    g.stroke();
    g.beginPath();
    g.arc(cx + lado * largura * 0.2, v - largura * 0.05, largura * 0.12, 0, Math.PI * 1.6);
    g.stroke();
  }
  g.lineWidth = Math.max(1.5, largura * 0.06);
  g.strokeRect(x0 + largura * 0.06, y0, largura * 0.88, y1 - y0);
}

/** A faixa de acabamento (as bordas do casaco, da capeleta e das mangas): o bordado de gavinhas ao longo de `v`. */
export function texturaDoAcabamento(): THREE.CanvasTexture {
  const [c, g] = tela(256);
  gavinhas(g, 0, 256, 0, 256, '#9a8c98', '#2a2228');
  return comoTextura(c, [1, 4]);
}

/** O casaco: o tecido com as duas faixas de bordado nas bordas da abertura (u perto de 0 e de 1), da altura `v0` a `v1`. */
export function texturaDoCasaco(faixas: readonly (readonly [number, number])[]): THREE.CanvasTexture {
  const t = tecido('#17131a', '#4a4049', 411, 14);
  const g = t.image.getContext('2d');
  if (!g) return t;
  for (const [k, [v0, v1]] of faixas.entries()) gavinhas(g, k === 0 ? 0 : 512 - 30, 30, v0, v1);
  t.needsUpdate = true;
  return t;
}

/**
 * O pano que se desfaz em trevas (06/11/2026): da fração `desde` para baixo (e, com `borda`, nas beiras u perto de 0 e
 * de 1), o pano se esburaca em pedaços cada vez mais densos até sumir. Sem brilho: as bordas dos furos só escurecem,
 * como fumaça preta (pintadas na própria textura do pano, `mapa`).
 */
export function desfazer(semente: number, desde: number, borda: boolean, mapa: THREE.CanvasTexture): THREE.CanvasTexture {
  const r = sorteio(semente);
  const [ca, ga] = tela();
  const gb = mapa.image.getContext('2d');
  ga.fillStyle = '#fff';
  ga.fillRect(0, 0, 512, 512);
  const P = 8;
  for (let v = 0; v < 512; v += P)
    for (let x = 0; x < 512; x += P) {
      const fundo = Math.max(0, (v / 512 - desde) / (1 - desde));
      const beira = borda ? Math.max(0, 1 - Math.min(x, 512 - x) / 70) * 0.6 : 0;
      const some = Math.min(1, Math.pow(fundo, 1.3) + beira);
      if (some <= 0) continue;
      const q = r();
      if (q < some * 0.8) { ga.fillStyle = '#000'; ga.fillRect(x, v, P, P); }
      else if (gb && q < some * 1.5) { gb.fillStyle = `rgba(4,3,6,${0.6 + r() * 0.4})`; gb.fillRect(x - P, v - P, P * 3, P * 3); }
    }
  mapa.needsUpdate = true;
  const recorte = new THREE.CanvasTexture(ca);
  recorte.wrapS = recorte.wrapT = THREE.RepeatWrapping;
  return recorte;
}

/** O halo macio dos olhos (somado à luz, sem escrever na profundidade). */
export function halo(): THREE.Material {
  const [c, g] = tela(64);
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,0.95)');
  grd.addColorStop(0.35, 'rgba(210,225,255,0.4)');
  grd.addColorStop(1, 'rgba(180,200,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: DUPLO });
}

/** Os materiais do Ceifador; `faixas` são as alturas (v da tela) das faixas de bordado do casaco. */
export function materiaisDoCeifador(faixas: readonly (readonly [number, number])[]) {
  const pano = (escuro: string, claro: string, semente: number, rasgo?: number, dobras = 9) =>
    ventoso(new THREE.MeshStandardMaterial({
      map: tecido(escuro, claro, semente, dobras), roughness: 0.92, side: DUPLO,
      ...(rasgo !== undefined ? { alphaMap: rasgos(semente + 7, rasgo, 7), alphaTest: 0.5 } : {}),
    }));
  // o traje que se desfaz em trevas: da fração `desde` para baixo (e nas beiras, com `borda`), o pano some em pedaços
  const emTrevas = (map: THREE.CanvasTexture, semente: number, desde: number, borda = false) => ventoso(new THREE.MeshStandardMaterial({
    map, roughness: 0.92, side: DUPLO, alphaMap: desfazer(semente, desde, borda, map), alphaTest: 0.5,
  }));
  return {
    casaco: emTrevas(texturaDoCasaco(faixas), 418, 0.7),
    tunica: pano('#100c11', '#2c252c', 421, 0.92, 12),
    sobressaia: emTrevas(tecido('#151117', '#3e353e', 423, 6), 424, 0.55, true),
    capeleta: emTrevas(tecido('#18141a', '#4a4049', 427, 10), 428, 0.62, true),
    capa: emTrevas(tecido('#141016', '#3a3139', 425, 8), 426, 0.45, true),
    manga: pano('#19151b', '#463c45', 431, 0.8, 7),
    mangaDentro: pano('#100d12', '#2a242a', 433, undefined, 10),
    capuz: pano('#18141a', '#433a43', 441, undefined, 8),
    gola: pano('#1d181e', '#504650', 451, 0.93, 10),
    fita: pano('#1c171d', '#463d46', 471, 0.65, 5),
    acabamento: ventoso(new THREE.MeshStandardMaterial({ map: texturaDoAcabamento(), roughness: 0.7, metalness: 0.15, side: DUPLO })),
    tabardo: ventoso(new THREE.MeshStandardMaterial({ map: filigrana('#110c10', '#7a6c78', 461, { densidade: 1.5 }), roughness: 0.88, side: DUPLO, alphaMap: rasgos(468, 0.9, 7), alphaTest: 0.5 })),
    // a fumaça preta que o traje solta (era um fantasma claro; 06/11/2026: tudo vira trevas)
    fumaca: ventoso(new THREE.MeshBasicMaterial({ color: 0x08060b, transparent: true, opacity: 0.35, depthWrite: false, side: DUPLO })),
    couro: new THREE.MeshStandardMaterial({ color: 0x2a1d1c, roughness: 0.62, metalness: 0.05, side: DUPLO }),
    cordao: new THREE.MeshStandardMaterial({ color: 0x4e3e3c, roughness: 0.9 }),
    latao: metal('#7d6f68', 619, 0.9, 0.36),
    ferro: metal('#2c282d', 631, 0.85, 0.5),
    placa: new THREE.MeshStandardMaterial({ map: filigrana('#2e282d', '#958592', 401, { densidade: 1.1, manchas: 40 }), metalness: 0.85, roughness: 0.4, side: DUPLO }),
    osso: new THREE.MeshStandardMaterial({ color: 0xd8cdd0, roughness: 0.55 }),
    vazio: new THREE.MeshBasicMaterial({ color: 0x030204, side: DUPLO }),
    olho: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    dente: new THREE.MeshStandardMaterial({ color: 0xf0eadf, emissive: 0xcfc6b8, emissiveIntensity: 0.55, roughness: 0.35 }),
  };
}
export type MateriaisDoCeifador = ReturnType<typeof materiaisDoCeifador>;
