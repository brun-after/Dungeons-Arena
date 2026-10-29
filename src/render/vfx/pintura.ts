// Pintura das texturas ricas (marco 26, 29/10/2026, D-124): cada desenho do atlas de vfx/texturas.ts, em canvas 2D com
// gradiente, sombreado e ruído. Tudo em tons de cinza (a cor vem do tingimento). Separado da lista para caber no limite
// de linhas por arquivo.

import { RUNAS, TRACO_RUNA } from '../runas';
import type { TexturaRica } from './texturas';
import { branco, C, cinza, LADO_RICO, radial, sorteador, type C2D } from './pintura-base';
import { alma, arcoGolpe, asa, choque, cintilar, circuloRunico, clarao, cranio, espinho, estilhaco, feixe, folha, garra, geada, gelo, gotaViva, hexagono, lamina, mancha, maoOssea, miraAlvo, olho, ondaSom, osso, pena, rachadura, rocha, runa } from './pintura-formas';

export { LADO_RICO };

/** A labareda: gota de fogo com a borda deformada por ondas que mudam de quadro a quadro, miolo claro e língua no topo. */
function chama(g: C2D, quadro: number): void {
  const fase = (quadro / 8) * Math.PI * 2;
  g.save();
  g.beginPath();
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = t * Math.PI * 2;
    // Base redonda embaixo, afinando numa ponta que balança para os lados em cima.
    const sobe = Math.max(0, -Math.sin(a));
    const raio = 13 + 4 * Math.sin(a * 3 + fase * 2) * (1 - sobe) + 2.5 * Math.sin(a * 5 - fase);
    const alto = sobe * (16 + 6 * Math.sin(fase + 1.3));
    const x = C + Math.cos(a) * raio * (1 - sobe * 0.75) + sobe * sobe * 6 * Math.sin(fase + t * 3);
    const y = C + 8 + Math.sin(a) * raio - alto;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillStyle = radial(g, C, C + 8, 26, [[0, branco(1)], [0.35, branco(0.95)], [0.7, cinza(200, 0.75)], [1, cinza(160, 0)]]);
  g.fill();
  // Línguas soltas que sobem do topo.
  const r = sorteador(97 + quadro * 13);
  for (let i = 0; i < 2; i++) {
    const lx = C + (r() - 0.5) * 14 + Math.sin(fase + i) * 4;
    const ly = C - 14 - r() * 10;
    g.beginPath();
    g.ellipse(lx, ly, 2.5 + r() * 2, 5 + r() * 3, (r() - 0.5) * 0.6, 0, Math.PI * 2);
    g.fillStyle = radial(g, lx, ly, 7, [[0, branco(0.9)], [1, branco(0)]]);
    g.fill();
  }
  g.restore();
}

/** Fumaça macia: bolhas sobrepostas com degradê, cada variação com um arranjo. */
function fumaca(g: C2D, semente: number): void {
  const r = sorteador(semente);
  for (let i = 0; i < 9; i++) {
    const x = C + (r() - 0.5) * 26;
    const y = C + (r() - 0.5) * 26;
    const raio = 10 + r() * 12;
    g.fillStyle = radial(g, x, y, raio, [[0, cinza(235, 0.32)], [0.6, cinza(215, 0.18)], [1, cinza(200, 0)]]);
    g.beginPath();
    g.arc(x, y, raio, 0, Math.PI * 2);
    g.fill();
  }
}

/** O elo de frente: um anel oval grosso, com o claro em cima à esquerda e o escuro embaixo. */
function elo(g: C2D, deLado: boolean): void {
  g.save();
  g.translate(C, C);
  if (deLado) {
    // De lado o elo vira uma barra arredondada (o próximo elo atravessa o anel do anterior).
    const gr = g.createLinearGradient(-6, 0, 6, 0);
    gr.addColorStop(0, cinza(90));
    gr.addColorStop(0.35, cinza(250));
    gr.addColorStop(1, cinza(70));
    g.fillStyle = gr;
    g.beginPath();
    g.roundRect(-5, -22, 10, 44, 5);
    g.fill();
    g.strokeStyle = cinza(40, 0.8);
    g.lineWidth = 1.5;
    g.stroke();
  } else {
    g.lineWidth = 8;
    const gr = g.createLinearGradient(-12, -20, 12, 20);
    gr.addColorStop(0, cinza(255));
    gr.addColorStop(0.45, cinza(170));
    gr.addColorStop(1, cinza(60));
    g.strokeStyle = gr;
    g.beginPath();
    g.ellipse(0, 0, 11, 20, 0, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 1.5;
    g.strokeStyle = cinza(30, 0.7);
    g.beginPath();
    g.ellipse(0, 0, 15, 24, 0, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.ellipse(0, 0, 7, 16, 0, 0, Math.PI * 2);
    g.stroke();
    // O brilho do metal.
    g.strokeStyle = branco(0.9);
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(0, 0, 11, 20, 0, Math.PI * 1.1, Math.PI * 1.45);
    g.stroke();
  }
  g.restore();
}

function gancho(g: C2D): void {
  g.save();
  g.translate(C, C);
  const gr = g.createLinearGradient(-14, -24, 14, 24);
  gr.addColorStop(0, cinza(255));
  gr.addColorStop(0.5, cinza(165));
  gr.addColorStop(1, cinza(70));
  g.strokeStyle = gr;
  g.lineCap = 'round';
  g.lineWidth = 7;
  // Haste para cima (−y) e a curva do gancho com a farpa.
  g.beginPath();
  g.moveTo(0, -24);
  g.lineTo(0, 6);
  g.arc(-9, 6, 9, 0, Math.PI * 0.95);
  g.stroke();
  g.fillStyle = cinza(220);
  g.beginPath();
  g.moveTo(-20, 4);
  g.lineTo(-13, -6);
  g.lineTo(-15, 8);
  g.closePath();
  g.fill();
  g.beginPath();
  g.arc(0, -24, 5, 0, Math.PI * 2);
  g.lineWidth = 3;
  g.stroke();
  g.restore();
}

function bolaFerro(g: C2D): void {
  g.fillStyle = radial(g, C - 7, C - 7, 30, [[0, cinza(255)], [0.3, cinza(170)], [0.8, cinza(60)], [1, cinza(30)]]);
  g.beginPath();
  g.arc(C, C, 20, 0, Math.PI * 2);
  g.fill();
  // Cravos.
  g.fillStyle = cinza(200);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.beginPath();
    g.moveTo(C + Math.cos(a) * 30, C + Math.sin(a) * 30);
    g.lineTo(C + Math.cos(a + 0.22) * 18, C + Math.sin(a + 0.22) * 18);
    g.lineTo(C + Math.cos(a - 0.22) * 18, C + Math.sin(a - 0.22) * 18);
    g.closePath();
    g.fill();
  }
}

function algema(g: C2D): void {
  g.save();
  g.translate(C, C);
  g.lineWidth = 7;
  const gr = g.createLinearGradient(-20, -20, 20, 20);
  gr.addColorStop(0, cinza(255));
  gr.addColorStop(1, cinza(80));
  g.strokeStyle = gr;
  g.beginPath();
  g.arc(0, 2, 18, Math.PI * 0.15, Math.PI * 1.85);
  g.stroke();
  g.fillStyle = cinza(200);
  g.fillRect(12, -10, 10, 22);
  g.restore();
}

function runaDaClasse(g: C2D, classe: string): void {
  const runa = RUNAS[classe];
  if (!runa) return;
  g.save();
  g.translate(4, 4);
  g.scale(0.56, 0.56);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const [w, a] of [[TRACO_RUNA * 2.6, 0.25], [TRACO_RUNA, 1]] as const) {
    g.lineWidth = w;
    g.strokeStyle = branco(a);
    for (const t of runa.tracos) {
      g.beginPath();
      if (t.t === 'linha') {
        g.moveTo(t.p[0] ?? 0, t.p[1] ?? 0);
        for (let i = 2; i < t.p.length; i += 2) g.lineTo(t.p[i] ?? 0, t.p[i + 1] ?? 0);
        if (t.fechar) g.closePath();
      } else if (t.t === 'curva') {
        g.moveTo(t.de[0], t.de[1]);
        g.quadraticCurveTo(t.controle[0], t.controle[1], t.ate[0], t.ate[1]);
      } else {
        g.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      }
      g.stroke();
    }
  }
  g.restore();
}

export function desenharTextura(g: C2D, nome: TexturaRica): void {
  if (nome.startsWith('chama')) { chama(g, Number(nome.slice(5))); return; }
  if (nome.startsWith('runa_')) { runaDaClasse(g, nome.slice(5)); return; }
  if (nome.startsWith('runa')) { runa(g, Number(nome.slice(4))); return; }
  switch (nome) {
    case 'brasa':
      g.fillStyle = radial(g, C, C, 14, [[0, branco(1)], [0.3, branco(0.95)], [0.6, branco(0.35)], [1, branco(0)]]);
      g.fillRect(0, 0, LADO_RICO, LADO_RICO);
      return;
    case 'fumaca1':
      { fumaca(g, 11); return; }
    case 'fumaca2':
      { fumaca(g, 23); return; }
    case 'fumaca3':
      { fumaca(g, 37); return; }
    case 'cinza': {
      g.fillStyle = cinza(230);
      g.beginPath();
      g.moveTo(C - 8, C - 5);
      g.lineTo(C + 6, C - 9);
      g.lineTo(C + 9, C + 4);
      g.lineTo(C - 4, C + 8);
      g.closePath();
      g.fill();
      return;
    }
    case 'elo':
      { elo(g, false); return; }
    case 'elo_lado':
      { elo(g, true); return; }
    case 'gancho':
      { gancho(g); return; }
    case 'bola_ferro':
      { bolaFerro(g); return; }
    case 'algema':
      { algema(g); return; }
    case 'osso':
      { osso(g); return; }
    case 'cranio':
      { cranio(g); return; }
    case 'alma':
      { alma(g); return; }
    case 'pena':
      { pena(g); return; }
    case 'gelo':
      { gelo(g); return; }
    case 'gota_viva':
      { gotaViva(g); return; }
    case 'rocha':
      { rocha(g); return; }
    case 'folha':
      { folha(g); return; }
    case 'lamina':
      { lamina(g); return; }
    case 'garra':
      { garra(g); return; }
    case 'espinho':
      { espinho(g); return; }
    case 'mao_ossea':
      { maoOssea(g); return; }
    case 'choque':
      { choque(g); return; }
    case 'clarao':
      { clarao(g); return; }
    case 'feixe':
      { feixe(g); return; }
    case 'estilhaco':
      { estilhaco(g); return; }
    case 'cintilar':
      { cintilar(g); return; }
    case 'arco_golpe':
      { arcoGolpe(g); return; }
    case 'hexagono':
      { hexagono(g); return; }
    case 'circulo_runico':
      { circuloRunico(g); return; }
    case 'olho':
      { olho(g); return; }
    case 'mira_alvo':
      { miraAlvo(g); return; }
    case 'onda_som':
      { ondaSom(g); return; }
    case 'queimado':
      { mancha(g, 5, 255, 200, 6); return; }
    case 'geada':
      { geada(g); return; }
    case 'rachadura':
      { rachadura(g); return; }
    case 'poca_sangue':
      { mancha(g, 17, 255, 220, 9); return; }
    case 'poca_veneno':
      { mancha(g, 29, 255, 235, 4); return; }
    case 'asa':
      { asa(g); return; }
    default:
      return;
  }
}
