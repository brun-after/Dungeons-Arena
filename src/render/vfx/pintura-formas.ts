// Pintura das matérias, impactos, símbolos e marcas do atlas rico (marco 26, 29/10/2026, D-124): osso, crânio, alma,
// pena, gelo, gota, rocha, folha, lâmina, garra, espinho, mão de osso, onda de choque, clarão, feixe, estilhaço,
// cintilar, arco do golpe, runas, hexágono, círculo rúnico, olho, mira, onda de som, manchas, geada, rachadura e asa.

import { branco, C, cinza, LADO_RICO, radial, sorteador, type C2D } from './pintura-base';

export function osso(g: C2D): void {
  g.save();
  g.translate(C, C);
  g.rotate(-Math.PI / 4);
  const gr = g.createLinearGradient(0, -6, 0, 6);
  gr.addColorStop(0, cinza(255));
  gr.addColorStop(1, cinza(170));
  g.fillStyle = gr;
  g.fillRect(-16, -4, 32, 8);
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      g.beginPath();
      g.arc(sx * 18, sy * 5, 6, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
}

export function cranio(g: C2D): void {
  g.save();
  g.translate(C, C);
  g.fillStyle = radial(g, -5, -8, 30, [[0, cinza(255)], [0.7, cinza(200)], [1, cinza(140)]]);
  g.beginPath();
  g.arc(0, -4, 19, Math.PI, 0);
  g.lineTo(19, 4);
  g.quadraticCurveTo(14, 12, 10, 12);
  g.lineTo(10, 20);
  g.lineTo(-10, 20);
  g.lineTo(-10, 12);
  g.quadraticCurveTo(-14, 12, -19, 4);
  g.closePath();
  g.fill();
  // Órbitas que brilham (o claro do miolo vira a cor no tingimento aditivo).
  g.fillStyle = cinza(25);
  g.beginPath();
  g.ellipse(-8, 0, 6, 7, 0, 0, Math.PI * 2);
  g.ellipse(8, 0, 6, 7, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = branco(0.95);
  g.beginPath();
  g.arc(-8, 1, 2.2, 0, Math.PI * 2);
  g.arc(8, 1, 2.2, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = cinza(40);
  g.beginPath();
  g.moveTo(0, 7);
  g.lineTo(-3, 12);
  g.lineTo(3, 12);
  g.closePath();
  g.fill();
  for (let i = -6; i <= 6; i += 4) g.fillRect(i - 1, 15, 2, 5);
  g.restore();
}

/** A alma: a cabeça do espectro com a cauda de névoa ondulando para baixo. */
export function alma(g: C2D): void {
  g.fillStyle = radial(g, C, C - 10, 16, [[0, branco(1)], [0.5, branco(0.6)], [1, branco(0)]]);
  g.beginPath();
  g.arc(C, C - 10, 16, 0, Math.PI * 2);
  g.fill();
  for (let i = 0; i < 10; i++) {
    const y = C - 4 + i * 3;
    const x = C + Math.sin(i * 0.8) * (2 + i * 0.6);
    g.fillStyle = radial(g, x, y, 10 - i * 0.7, [[0, branco(0.5 - i * 0.04)], [1, branco(0)]]);
    g.beginPath();
    g.arc(x, y, 10 - i * 0.7, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = cinza(20, 0.85);
  g.beginPath();
  g.ellipse(C - 5, C - 11, 2.5, 3.5, 0, 0, Math.PI * 2);
  g.ellipse(C + 5, C - 11, 2.5, 3.5, 0, 0, Math.PI * 2);
  g.ellipse(C, C - 4, 2.5, 3.2, 0, 0, Math.PI * 2);
  g.fill();
}

export function pena(g: C2D): void {
  g.save();
  g.translate(C, C);
  g.fillStyle = cinza(240);
  g.beginPath();
  g.moveTo(0, -26);
  g.quadraticCurveTo(13, -6, 3, 24);
  g.lineTo(-3, 24);
  g.quadraticCurveTo(-11, -6, 0, -26);
  g.fill();
  g.strokeStyle = cinza(120, 0.9);
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(0, -24);
  g.lineTo(0, 28);
  g.stroke();
  // As barbas da pena.
  g.strokeStyle = cinza(170, 0.7);
  for (let y = -18; y < 20; y += 4) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(-8, y + 5);
    g.moveTo(0, y);
    g.lineTo(8, y + 5);
    g.stroke();
  }
  g.restore();
}

/** Estilhaço de gelo translúcido: facetas com tons diferentes, borda clara e um reflexo. */
export function gelo(g: C2D): void {
  g.save();
  g.translate(C, C);
  const faces: [number[], number][] = [
    [[0, -28, 9, -4, 0, 4], 0.95],
    [[0, -28, -9, -4, 0, 4], 0.6],
    [[-9, -4, 0, 4, 0, 28], 0.4],
    [[9, -4, 0, 4, 0, 28], 0.75],
  ];
  for (const [p, a] of faces) {
    g.fillStyle = branco(a * 0.8);
    g.beginPath();
    g.moveTo(p[0] ?? 0, p[1] ?? 0);
    g.lineTo(p[2] ?? 0, p[3] ?? 0);
    g.lineTo(p[4] ?? 0, p[5] ?? 0);
    g.closePath();
    g.fill();
  }
  g.strokeStyle = branco(1);
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(0, -28);
  g.lineTo(9, -4);
  g.lineTo(0, 28);
  g.lineTo(-9, -4);
  g.closePath();
  g.stroke();
  g.restore();
}

export function gotaViva(g: C2D): void {
  g.save();
  g.translate(C, C + 4);
  g.fillStyle = radial(g, -4, 2, 22, [[0, branco(1)], [0.5, cinza(220)], [1, cinza(150)]]);
  g.beginPath();
  g.moveTo(0, -24);
  g.bezierCurveTo(6, -10, 14, 0, 14, 8);
  g.arc(0, 8, 14, 0, Math.PI);
  g.bezierCurveTo(-14, 0, -6, -10, 0, -24);
  g.fill();
  g.fillStyle = branco(0.95);
  g.beginPath();
  g.ellipse(-5, 4, 3, 5, -0.4, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

export function rocha(g: C2D): void {
  const r = sorteador(311);
  g.save();
  g.translate(C, C);
  g.beginPath();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const raio = 16 + r() * 8;
    if (i === 0) g.moveTo(Math.cos(a) * raio, Math.sin(a) * raio);
    else g.lineTo(Math.cos(a) * raio, Math.sin(a) * raio);
  }
  g.closePath();
  g.fillStyle = radial(g, -8, -8, 32, [[0, cinza(245)], [0.6, cinza(150)], [1, cinza(80)]]);
  g.fill();
  g.strokeStyle = cinza(60, 0.8);
  g.lineWidth = 1.5;
  g.stroke();
  g.beginPath();
  g.moveTo(-6, -10);
  g.lineTo(2, 0);
  g.lineTo(-2, 10);
  g.stroke();
  g.restore();
}

export function folha(g: C2D): void {
  g.save();
  g.translate(C, C);
  g.rotate(0.4);
  g.fillStyle = radial(g, -3, -6, 26, [[0, cinza(255)], [1, cinza(170)]]);
  g.beginPath();
  g.moveTo(0, -24);
  g.quadraticCurveTo(16, 0, 0, 24);
  g.quadraticCurveTo(-16, 0, 0, -24);
  g.fill();
  g.strokeStyle = cinza(120);
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(0, -22);
  g.lineTo(0, 24);
  g.stroke();
  g.restore();
}

/** A lâmina: aço com fio claro, apontando para cima. */
export function lamina(g: C2D): void {
  g.save();
  g.translate(C, C);
  const gr = g.createLinearGradient(-6, 0, 6, 0);
  gr.addColorStop(0, cinza(140));
  gr.addColorStop(0.5, cinza(255));
  gr.addColorStop(1, cinza(110));
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(0, -30);
  g.lineTo(6, -18);
  g.lineTo(5, 16);
  g.lineTo(-5, 16);
  g.lineTo(-6, -18);
  g.closePath();
  g.fill();
  g.fillStyle = cinza(90);
  g.fillRect(-12, 16, 24, 4);
  g.fillRect(-2.5, 20, 5, 10);
  g.restore();
}

/** Três rasgos de garra paralelos, afinando nas pontas. */
export function garra(g: C2D): void {
  g.save();
  g.translate(C, C);
  g.rotate(-0.5);
  for (const dx of [-12, 0, 12]) {
    g.fillStyle = radial(g, dx, 0, 28, [[0, branco(1)], [0.6, branco(0.8)], [1, branco(0)]]);
    g.beginPath();
    g.moveTo(dx, -28);
    g.quadraticCurveTo(dx + 5, 0, dx, 28);
    g.quadraticCurveTo(dx + 1.5, 0, dx, -28);
    g.fill();
  }
  g.restore();
}

/** Espinho de pedra brotando do chão (a base larga embaixo). */
export function espinho(g: C2D): void {
  g.save();
  g.translate(C, C);
  g.fillStyle = cinza(110);
  g.beginPath();
  g.moveTo(-14, 28);
  g.lineTo(-2, -30);
  g.lineTo(0, 28);
  g.closePath();
  g.fill();
  g.fillStyle = cinza(220);
  g.beginPath();
  g.moveTo(0, 28);
  g.lineTo(-2, -30);
  g.lineTo(13, 28);
  g.closePath();
  g.fill();
  g.restore();
}

export function maoOssea(g: C2D): void {
  g.save();
  g.translate(C, C + 6);
  g.strokeStyle = cinza(235);
  g.lineCap = 'round';
  g.lineWidth = 4;
  // Palma e cinco dedos abertos para cima, com nós.
  g.beginPath();
  g.moveTo(-6, 22);
  g.lineTo(-4, 6);
  g.moveTo(6, 22);
  g.lineTo(4, 6);
  g.stroke();
  const dedos: [number, number][] = [[-16, -6], [-9, -20], [0, -26], [9, -20], [17, -4]];
  for (const [x, y] of dedos) {
    g.beginPath();
    g.moveTo(x * 0.3, 4);
    g.lineTo(x * 0.7, y * 0.5);
    g.lineTo(x, y);
    g.stroke();
    g.fillStyle = cinza(255);
    g.beginPath();
    g.arc(x * 0.7, y * 0.5, 2.6, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** A onda de choque: um anel com degradê dos dois lados (claro no meio, some para dentro e para fora). */
export function choque(g: C2D): void {
  const gr = g.createRadialGradient(C, C, 18, C, C, 31);
  gr.addColorStop(0, branco(0));
  gr.addColorStop(0.55, branco(0.95));
  gr.addColorStop(0.7, branco(0.6));
  gr.addColorStop(1, branco(0));
  g.fillStyle = gr;
  g.fillRect(0, 0, LADO_RICO, LADO_RICO);
}

/** O clarão em cruz: miolo forte e quatro raios finos (estrela de lente). */
export function clarao(g: C2D): void {
  g.fillStyle = radial(g, C, C, 22, [[0, branco(1)], [0.25, branco(0.7)], [1, branco(0)]]);
  g.fillRect(0, 0, LADO_RICO, LADO_RICO);
  for (const [w, h] of [[31, 2.2], [2.2, 31]] as const) {
    g.fillStyle = radial(g, C, C, 31, [[0, branco(1)], [1, branco(0)]]);
    g.beginPath();
    g.ellipse(C, C, w, h, 0, 0, Math.PI * 2);
    g.fill();
  }
}

/** O feixe: faixa horizontal com núcleo branco e halo, para esticar entre dois pontos (raio, corrente de luz). */
export function feixe(g: C2D): void {
  const gr = g.createLinearGradient(0, 0, 0, LADO_RICO);
  gr.addColorStop(0, branco(0));
  gr.addColorStop(0.3, branco(0.25));
  gr.addColorStop(0.44, branco(0.85));
  gr.addColorStop(0.5, branco(1));
  gr.addColorStop(0.56, branco(0.85));
  gr.addColorStop(0.7, branco(0.25));
  gr.addColorStop(1, branco(0));
  g.fillStyle = gr;
  g.fillRect(0, 0, LADO_RICO, LADO_RICO);
}

export function estilhaco(g: C2D): void {
  g.save();
  g.translate(C, C);
  g.fillStyle = branco(0.85);
  g.beginPath();
  g.moveTo(-3, -26);
  g.lineTo(9, -6);
  g.lineTo(2, 24);
  g.lineTo(-8, 2);
  g.closePath();
  g.fill();
  g.strokeStyle = branco(1);
  g.lineWidth = 1.2;
  g.stroke();
  g.restore();
}

/** Brilho de quatro pontas (o cintilar do sagrado e das estrelas). */
export function cintilar(g: C2D): void {
  g.fillStyle = radial(g, C, C, 10, [[0, branco(1)], [1, branco(0)]]);
  g.fillRect(0, 0, LADO_RICO, LADO_RICO);
  g.fillStyle = branco(1);
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 28 : 4;
    const x = C + Math.cos(a) * r;
    const y = C + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fill();
}

/** O arco do golpe: meia-lua grossa com o fio claro na borda externa e o rastro que some para dentro. */
export function arcoGolpe(g: C2D): void {
  g.save();
  g.translate(C, C + 14);
  const gr = g.createRadialGradient(0, 0, 14, 0, 0, 30);
  gr.addColorStop(0, branco(0));
  gr.addColorStop(0.6, branco(0.35));
  gr.addColorStop(0.92, branco(1));
  gr.addColorStop(1, branco(0));
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, 30, Math.PI * 1.08, Math.PI * 1.92);
  g.arc(4, 6, 18, Math.PI * 1.85, Math.PI * 1.15, true);
  g.closePath();
  g.fill();
  g.restore();
}

/** Runas: quatro glifos diferentes, com o traço claro e um halo. */
export function runa(g: C2D, n: number): void {
  const tracos: number[][][] = [
    [[-8, -14, -8, 14], [-8, -6, 8, -14], [-8, 2, 8, -6]],
    [[0, -16, 0, 16], [-10, -8, 10, 8], [10, -8, -10, 8]],
    [[-10, 14, 0, -14, 10, 14], [-6, 4, 6, 4]],
    [[-9, -14, 9, -14, -9, 14, 9, 14], [0, -14, 0, 14]],
  ];
  g.save();
  g.translate(C, C);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const [w, a] of [[7, 0.25], [3, 1]] as const) {
    g.lineWidth = w;
    g.strokeStyle = branco(a);
    for (const t of tracos[n] ?? []) {
      g.beginPath();
      g.moveTo(t[0] ?? 0, t[1] ?? 0);
      for (let i = 2; i < t.length; i += 2) g.lineTo(t[i] ?? 0, t[i + 1] ?? 0);
      g.stroke();
    }
  }
  g.restore();
}

export function hexagono(g: C2D): void {
  g.save();
  g.translate(C, C);
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    if (i === 0) g.moveTo(Math.cos(a) * 26, Math.sin(a) * 26);
    else g.lineTo(Math.cos(a) * 26, Math.sin(a) * 26);
  }
  g.closePath();
  g.fillStyle = radial(g, 0, 0, 26, [[0, branco(0.08)], [0.8, branco(0.3)], [1, branco(0.55)]]);
  g.fill();
  g.strokeStyle = branco(1);
  g.lineWidth = 2.5;
  g.stroke();
  g.restore();
}

/** O círculo rúnico: dois anéis com marcas entre eles (o chão da conjuração). */
export function circuloRunico(g: C2D): void {
  g.save();
  g.translate(C, C);
  g.strokeStyle = branco(1);
  g.lineWidth = 2;
  g.beginPath();
  g.arc(0, 0, 29, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 1.3;
  g.beginPath();
  g.arc(0, 0, 21, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.save();
    g.rotate(a);
    g.beginPath();
    if (i % 3 === 0) {
      g.moveTo(-2, -27);
      g.lineTo(2, -23);
      g.moveTo(2, -27);
      g.lineTo(-2, -23);
    } else {
      g.moveTo(0, -27);
      g.lineTo(0, -23);
    }
    g.stroke();
    g.restore();
  }
  // A estrela de seis pontas no meio.
  g.beginPath();
  for (let k = 0; k < 2; k++) {
    for (let i = 0; i <= 3; i++) {
      const a = (i / 3) * Math.PI * 2 + k * (Math.PI / 3) - Math.PI / 2;
      if (i === 0) g.moveTo(Math.cos(a) * 19, Math.sin(a) * 19);
      else g.lineTo(Math.cos(a) * 19, Math.sin(a) * 19);
    }
  }
  g.stroke();
  g.restore();
}

export function olho(g: C2D): void {
  g.save();
  g.translate(C, C);
  g.fillStyle = radial(g, 0, 0, 28, [[0, branco(0.5)], [1, branco(0)]]);
  g.fillRect(-C, -C, LADO_RICO, LADO_RICO);
  g.strokeStyle = branco(1);
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(-26, 0);
  g.quadraticCurveTo(0, -22, 26, 0);
  g.quadraticCurveTo(0, 22, -26, 0);
  g.stroke();
  g.fillStyle = branco(1);
  g.beginPath();
  g.arc(0, 0, 8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = cinza(20);
  g.beginPath();
  g.ellipse(0, 0, 2.5, 7, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

export function miraAlvo(g: C2D): void {
  g.save();
  g.translate(C, C);
  g.strokeStyle = branco(1);
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(0, 0, 18, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 4; i++) {
    g.save();
    g.rotate((i * Math.PI) / 2);
    g.beginPath();
    g.moveTo(0, -28);
    g.lineTo(0, -12);
    g.stroke();
    g.restore();
  }
  g.fillStyle = branco(1);
  g.beginPath();
  g.arc(0, 0, 3, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** Arcos de onda sonora (três, do menor ao maior), abertos para cima. */
export function ondaSom(g: C2D): void {
  g.save();
  g.translate(C, C + 18);
  g.lineCap = 'round';
  for (const [r, a] of [[12, 1], [22, 0.8], [32, 0.55]] as const) {
    g.strokeStyle = branco(a);
    g.lineWidth = 3;
    g.beginPath();
    g.arc(0, 0, r, Math.PI * 1.2, Math.PI * 1.8);
    g.stroke();
  }
  g.restore();
}

/** Marca no chão de borda irregular (queimado, sangue, veneno): manchas sobrepostas e respingos. */
export function mancha(g: C2D, semente: number, miolo: number, borda: number, respingos: number): void {
  const r = sorteador(semente);
  for (let i = 0; i < 7; i++) {
    const x = C + (r() - 0.5) * 18;
    const y = C + (r() - 0.5) * 18;
    const raio = 12 + r() * 10;
    g.fillStyle = radial(g, x, y, raio, [[0, cinza(miolo, 0.75)], [0.7, cinza(borda, 0.45)], [1, cinza(borda, 0)]]);
    g.beginPath();
    g.arc(x, y, raio, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < respingos; i++) {
    const a = r() * Math.PI * 2;
    const d = 18 + r() * 11;
    g.fillStyle = cinza(miolo, 0.7);
    g.beginPath();
    g.arc(C + Math.cos(a) * d, C + Math.sin(a) * d, 1 + r() * 2.2, 0, Math.PI * 2);
    g.fill();
  }
}

export function geada(g: C2D): void {
  mancha(g, 71, 255, 230, 0);
  const r = sorteador(73);
  g.strokeStyle = branco(0.9);
  g.lineWidth = 1.2;
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2;
    const d = 8 + r() * 20;
    g.beginPath();
    g.moveTo(C, C);
    const x = C + Math.cos(a) * d;
    const y = C + Math.sin(a) * d;
    g.lineTo(x, y);
    g.lineTo(x + Math.cos(a + 0.7) * 6, y + Math.sin(a + 0.7) * 6);
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a - 0.7) * 6, y + Math.sin(a - 0.7) * 6);
    g.stroke();
  }
}

export function rachadura(g: C2D): void {
  const r = sorteador(41);
  g.strokeStyle = cinza(255, 0.95);
  g.lineCap = 'round';
  const galho = (x: number, y: number, a: number, comp: number, w: number) => {
    let cx = x;
    let cy = y;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(cx, cy);
    for (let i = 0; i < 4; i++) {
      a += (r() - 0.5) * 0.9;
      cx += Math.cos(a) * comp / 4;
      cy += Math.sin(a) * comp / 4;
      g.lineTo(cx, cy);
    }
    g.stroke();
    return { x: cx, y: cy, a };
  };
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + r() * 0.5;
    const p = galho(C, C, a, 16 + r() * 10, 2.5);
    if (r() < 0.7) galho(p.x, p.y, p.a + (r() - 0.5) * 1.4, 8, 1.3);
  }
  g.fillStyle = radial(g, C, C, 10, [[0, cinza(255, 0.7)], [1, cinza(255, 0)]]);
  g.fillRect(0, 0, LADO_RICO, LADO_RICO);
}

/** Uma asa de luz (penas longas em leque), aberta para a direita. */
export function asa(g: C2D): void {
  g.save();
  g.translate(6, C + 6);
  for (let i = 0; i < 6; i++) {
    const a = -1.25 + i * 0.28;
    const comp = 52 - i * 5;
    g.save();
    g.rotate(a);
    g.fillStyle = radial(g, comp * 0.5, 0, comp * 0.6, [[0, branco(1 - i * 0.08)], [1, branco(0.15)]]);
    g.beginPath();
    g.ellipse(comp * 0.5, 0, comp * 0.5, 5.5, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  g.restore();
}

/** A runa de uma classe (o mesmo traço de render/runas.ts), branca com halo. */
