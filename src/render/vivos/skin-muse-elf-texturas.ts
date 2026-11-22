// As texturas e os materiais da Muse Elf (21/11/2026), pintados em canvas a partir das cores da arte:
// - a prata das placas com as gavinhas de ouro em relevo (o peitoral, as grevas, as braçadeiras);
// - as asas de gelo translúcidas: o azul que clareia no meio, os veios brancos, os cacos de cristal e as faíscas;
// - a capa de pelo branco, com a barra em tufos (o recorte), e o forro azul de gelo estrelado;
// - o cabelo louro em fios.
// O cabelo e as asas flutuam (skin-pano.ts `flutuante`); a capa, o cabelo e as asas levam o vento (`ventoso`).

import * as THREE from 'three';
import { sorteio } from './sombrio-base';
import { batente, flutuante, ventoso } from './skin-pano';

const DUPLO = THREE.DoubleSide;

function tela(l = 512, a = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = l;
  c.height = a;
  const g = c.getContext('2d');
  if (!g) throw new Error('sem canvas 2d');
  return [c, g];
}
const comoTextura = (c: HTMLCanvasElement, cor = true): THREE.CanvasTexture => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (cor) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** Uma gavinha de ouro: a curva que se enrola na ponta, com o traço escuro por baixo (o relevo). */
function gavinha(g: CanvasRenderingContext2D, r: () => number, x: number, y: number, tamanho: number): void {
  const pts: [number, number][] = [];
  let a = r() * Math.PI * 2, px = x, py = y;
  const volta = (r() < 0.5 ? 1 : -1) * (0.12 + r() * 0.1);
  for (let i = 0; i < 26; i++) {
    pts.push([px, py]);
    const passo = tamanho * (1 - i / 30) * 0.09;
    a += volta * (1 + i / 10);
    px += Math.cos(a) * passo;
    py += Math.sin(a) * passo;
  }
  for (const [cor, largura, dx] of [['#5a3d12', 9, 2], ['#b88a2e', 7, 0], ['#f3d27a', 2.5, -1.5]] as const) {
    g.strokeStyle = cor;
    g.lineWidth = largura;
    g.lineCap = 'round';
    g.beginPath();
    pts.forEach(([qx, qy], i) => {
      if (i === 0) g.moveTo(qx + dx, qy + dx);
      else g.lineTo(qx + dx, qy + dx);
    });
    g.stroke();
  }
}

/** A prata polida das placas, com riscos finos e as gavinhas de ouro. */
function texturaDaPrata(semente: number, gavinhas: number): THREE.CanvasTexture {
  const r = sorteio(semente);
  const [c, g] = tela();
  const grd = g.createLinearGradient(0, 0, 512, 512);
  grd.addColorStop(0, '#e6ebf2');
  grd.addColorStop(0.5, '#a9b2c0');
  grd.addColorStop(1, '#d4dae3');
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) {
    g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(60,70,90,0.12)';
    g.lineWidth = 1;
    const x = r() * 512, y = r() * 512;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 20); g.stroke();
  }
  for (let i = 0; i < gavinhas; i++) gavinha(g, r, r() * 512, r() * 512, 160 + r() * 180);
  return comoTextura(c);
}

/**
 * A asa de gelo. `u` vai da borda de baixo (0) à de cima (1) e o alto da tela é a raiz. O azul clareia no meio, a beira
 * escurece num contorno fino, os veios brancos correm da raiz à ponta e se abrem, e os cacos e as faíscas brilham.
 */
function texturaDaAsa(semente: number): THREE.CanvasTexture {
  const r = sorteio(semente);
  const [c, g] = tela();
  const grd = g.createLinearGradient(0, 0, 512, 0);
  grd.addColorStop(0, '#1456a8');
  grd.addColorStop(0.12, '#2f92e6');
  grd.addColorStop(0.5, '#7fcaf8');
  grd.addColorStop(0.88, '#2f92e6');
  grd.addColorStop(1, '#1456a8');
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 512);
  // os cacos de cristal: polígonos claros e escuros, como gelo rachado
  for (let i = 0; i < 70; i++) {
    const x = r() * 512, y = r() * 512, raio = 14 + r() * 40;
    g.fillStyle = r() < 0.6 ? `rgba(225,245,255,${0.12 + r() * 0.18})` : `rgba(20,70,140,${0.1 + r() * 0.15})`;
    g.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + r() * 0.8;
      const d = raio * (0.5 + r() * 0.5);
      if (k === 0) g.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
      else g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }
    g.fill();
  }
  // os veios: da raiz (alto) para a ponta, abrindo em leque e se ramificando
  g.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    let x = 256 + (r() - 0.5) * 60, y = 0;
    const alvo = 40 + (i / 8) * 432;
    g.strokeStyle = `rgba(240,250,255,${0.35 + r() * 0.3})`;
    g.lineWidth = 2 + r() * 2;
    g.beginPath();
    g.moveTo(x, y);
    while (y < 512) {
      y += 18 + r() * 14;
      x += (alvo - x) * 0.12 + (r() - 0.5) * 10;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  // as faíscas: pontos brancos com halo
  for (let i = 0; i < 220; i++) {
    const x = r() * 512, y = r() * 512, raio = 1 + r() * (r() < 0.1 ? 5 : 2);
    const h = g.createRadialGradient(x, y, 0, x, y, raio * 3);
    h.addColorStop(0, 'rgba(255,255,255,0.95)');
    h.addColorStop(0.35, 'rgba(210,240,255,0.5)');
    h.addColorStop(1, 'rgba(210,240,255,0)');
    g.fillStyle = h;
    g.fillRect(x - raio * 3, y - raio * 3, raio * 6, raio * 6);
  }
  // o contorno fino das bordas
  g.fillStyle = 'rgba(12,40,90,0.85)';
  g.fillRect(0, 0, 10, 512);
  g.fillRect(502, 0, 10, 512);
  return comoTextura(c);
}

/** O pelo branco da capa: fios verticais claros e sombras cinza-azuladas. */
function texturaDoPelo(semente: number): THREE.CanvasTexture {
  const r = sorteio(semente);
  const [c, g] = tela();
  g.fillStyle = '#e9eef5';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    const x = r() * 512, y = r() * 512, comp = 20 + r() * 70;
    g.strokeStyle = r() < 0.55 ? `rgba(150,170,195,${0.2 + r() * 0.3})` : `rgba(255,255,255,${0.4 + r() * 0.4})`;
    g.lineWidth = 1 + r() * 2;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * 12, y + comp / 2, x + (r() - 0.5) * 16, y + comp); g.stroke();
  }
  return comoTextura(c);
}

/** O recorte da barra da capa: tufos de pelo de comprimentos desencontrados, do 72% da altura para baixo. */
function recorteDoPelo(semente: number): THREE.CanvasTexture {
  const r = sorteio(semente);
  const [c, g] = tela();
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 512, 400);
  g.fillStyle = '#fff';
  for (let x = 0; x < 512; x += 5) {
    const fundo = 380 + r() * 130;
    g.beginPath();
    g.moveTo(x - 4, 360);
    g.lineTo(x + 2 + (r() - 0.5) * 6, fundo);
    g.lineTo(x + 9, 360);
    g.fill();
  }
  return comoTextura(c, false);
}

/** O forro da capa: o azul do gelo, mais fundo embaixo, com as faíscas. */
function texturaDoForro(semente: number): THREE.CanvasTexture {
  const r = sorteio(semente);
  const [c, g] = tela();
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#5b9fd8');
  grd.addColorStop(1, '#1f4f8e');
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) {
    const x = r() * 512, y = r() * 512, raio = 1 + r() * 3;
    const h = g.createRadialGradient(x, y, 0, x, y, raio * 3);
    h.addColorStop(0, 'rgba(255,255,255,0.9)');
    h.addColorStop(1, 'rgba(190,230,255,0)');
    g.fillStyle = h;
    g.fillRect(x - raio * 3, y - raio * 3, raio * 6, raio * 6);
  }
  return comoTextura(c);
}

/** O cabelo louro: o ouro claro com fios mais escuros e mais claros, no comprimento da mecha. */
function texturaDoCabelo(semente: number): THREE.CanvasTexture {
  const r = sorteio(semente);
  const [c, g] = tela();
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#a8741f');
  grd.addColorStop(0.3, '#d9a23c');
  grd.addColorStop(1, '#efc865');
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const x = r() * 512;
    g.strokeStyle = r() < 0.5 ? `rgba(140,95,30,${0.25 + r() * 0.3})` : `rgba(255,240,190,${0.3 + r() * 0.4})`;
    g.lineWidth = 1 + r() * 3;
    g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 40, 170, x + (r() - 0.5) * 40, 340, x + (r() - 0.5) * 30, 512); g.stroke();
  }
  return comoTextura(c);
}

export function materiaisDaMuseElf() {
  const prata = (semente: number, gavinhas: number) => new THREE.MeshStandardMaterial({ map: texturaDaPrata(semente, gavinhas), metalness: 0.7, roughness: 0.3, side: DUPLO });
  const asa = texturaDaAsa(1301);
  const recorte = recorteDoPelo(1311);
  return {
    pele: new THREE.MeshStandardMaterial({ color: 0xe9b89a, roughness: 0.65 }),
    roupa: new THREE.MeshStandardMaterial({ color: 0x1c2233, roughness: 0.7, side: DUPLO }),
    liga: new THREE.MeshStandardMaterial({ color: 0x14161f, roughness: 0.45, metalness: 0.2 }),
    peitoral: prata(1201, 9),
    placa: prata(1211, 5),
    taca: new THREE.MeshStandardMaterial({ color: 0x8696b4, metalness: 0.55, roughness: 0.3 }),
    ouro: new THREE.MeshStandardMaterial({ color: 0xd6a744, metalness: 0.92, roughness: 0.3, side: DUPLO }),
    ouroEscuro: new THREE.MeshStandardMaterial({ color: 0x8f6524, metalness: 0.85, roughness: 0.42, side: DUPLO }),
    penas: new THREE.MeshStandardMaterial({ color: 0xeef2f8, metalness: 0.35, roughness: 0.4, side: DUPLO }),
    pedra: new THREE.MeshStandardMaterial({ color: 0xc0182c, emissive: 0xa0101e, emissiveIntensity: 0.8, roughness: 0.15, metalness: 0.2 }),
    olho: new THREE.MeshBasicMaterial({ color: 0x1a2030 }),
    iris: new THREE.MeshBasicMaterial({ color: 0x7fb6e8 }),
    boca: new THREE.MeshBasicMaterial({ color: 0xc0606a }),
    // as asas: translúcidas e acesas por dentro, flutuando devagar mesmo paradas
    asa: batente(flutuante(ventoso(new THREE.MeshStandardMaterial({
      map: asa, emissiveMap: asa, emissive: 0xffffff, emissiveIntensity: 0.38, roughness: 0.2, metalness: 0.1,
      transparent: true, opacity: 0.82, depthWrite: false, side: DUPLO,
    })), 0.03), 0.6),
    pelo: ventoso(new THREE.MeshStandardMaterial({ map: texturaDoPelo(1321), alphaMap: recorte, alphaTest: 0.5, roughness: 0.95 })),
    forro: ventoso(new THREE.MeshStandardMaterial({ map: texturaDoForro(1331), alphaMap: recorte, alphaTest: 0.5, emissive: 0x2a6ab0, emissiveIntensity: 0.25, roughness: 0.6 })),
    cabelo: flutuante(ventoso(new THREE.MeshStandardMaterial({ map: texturaDoCabelo(1341), roughness: 0.55, metalness: 0.1, side: DUPLO })), 0.035),
    cranio: new THREE.MeshStandardMaterial({ map: texturaDoCabelo(1351), roughness: 0.55, metalness: 0.1 }),
  };
}
export type MateriaisDaMuseElf = ReturnType<typeof materiaisDaMuseElf>;
