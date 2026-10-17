// Marco 19 (17/10/2026): vocabulário vetorial. A composição e o movimento de cada combo vêm dos dados.
import type { Graphics } from 'pixi.js';

export function desenharFormaCombo(g: Graphics, nome: string, x: number, y: number, s: number, giro: number, cor: number, alpha: number): void {
  const p = (a: number, b: number): [number, number] => [x + s * (a * Math.cos(giro) - b * Math.sin(giro)), y + s * (a * Math.sin(giro) + b * Math.cos(giro))];
  const linha = (ps: number[][], fechar = false) => {
    const coords = ps.flatMap(([a = 0, b = 0]) => p(a, b));
    if (fechar) g.poly(coords).stroke({ color: cor, alpha, width: 1.7 });
    else { for (let i = 0; i < coords.length; i += 2) { const a = coords[i] ?? 0, b = coords[i + 1] ?? 0; if (i === 0) g.moveTo(a, b); else g.lineTo(a, b); } g.stroke({ color: cor, alpha, width: 1.7 }); }
  };
  const circulo = (a: number, b: number, r: number) => { const [px, py] = p(a, b); g.circle(px, py, r * s).stroke({ color: cor, alpha, width: 1.5 }); };
  const regular = (n: number, r = 1, fase = 0) => Array.from({ length: n }, (_, i) => [Math.cos(i * Math.PI * 2 / n + fase) * r, Math.sin(i * Math.PI * 2 / n + fase) * r]);
  switch (nome) {
    case 'espiral': linha(Array.from({ length: 40 }, (_, i) => { const a = i / 4; return [Math.cos(a) * i / 40, Math.sin(a) * i / 40]; })); break;
    case 'laminas': for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; linha([[Math.cos(a) * .4, Math.sin(a) * .4], [Math.cos(a + .5), Math.sin(a + .5)], [Math.cos(a + .8) * .6, Math.sin(a + .8) * .6]]); } break;
    case 'estandarte': linha([[-.4, 1], [-.4, -1], [.8, -.8], [.5, -.1], [-.4, -.25]]); break;
    case 'onda': for (let i = 0; i < 3; i++) linha([[-1, .2 + i * .25], [-.6, i * .25], [-.2, .2 + i * .25], [.2, i * .25], [.6, .2 + i * .25], [1, i * .25]]); break;
    case 'flechas': for (const d of [-.6, 0, .6]) linha([[d, -.9], [d, .7], [d - .15, .4], [d, .7], [d + .15, .4]]); break;
    case 'gotas': for (const d of [-.6, 0, .6]) { circulo(d, .6, .13); linha([[d - .12, .55], [d, .15], [d + .12, .55]]); } break;
    case 'cristais': for (const d of [-.65, 0, .65]) linha([[d, -.8], [d + .2, 0], [d, .6], [d - .2, 0]], true); break;
    case 'raios': for (const d of [-.5, .3]) linha([[d, -1], [d + .2, -.3], [d - .2, -.1], [d + .3, .4], [d, 1]]); break;
    case 'silhuetas': for (const d of [-.65, .65]) { circulo(d, -.4, .2); linha([[d - .3, .6], [d - .15, -.15], [d + .15, -.15], [d + .3, .6]], true); } break;
    case 'corte': linha([[-1, .6], [-.4, -.1], [.3, -.4], [1, -.6], [.2, -.1], [-.4, .3]]); break;
    case 'hexagonos': linha(regular(6, .9), true); linha(regular(6, .6), true); break;
    case 'coroa': linha([[-1, .5], [-1, -.3], [-.5, .1], [0, -.8], [.5, .1], [1, -.3], [1, .5]], true); break;
    case 'orbita': circulo(0, 0, .65); linha([[-1, .5], [-.6, -.5], [.5, -.6], [1, -.1], [.5, .6], [-1, .5]]); break;
    case 'fissuras': for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; linha([[0, 0], [Math.cos(a + .2) * .4, Math.sin(a + .2) * .4], [Math.cos(a - .15) * .65, Math.sin(a - .15) * .65], [Math.cos(a) * 1.1, Math.sin(a) * 1.1]]); } break;
    case 'leque': for (let i = -2; i <= 2; i++) linha([[0, .7], [Math.sin(i * .35), -.8 + Math.abs(i) * .2]]); break;
    case 'prisma': linha([[0, -1], [.45, 0], [0, .7], [-.45, 0]], true); linha([[0, -1], [0, .7]]); break;
    case 'lascas': for (let i = 0; i < 5; i++) { const a = i * 1.25; linha([[Math.cos(a) * .7, Math.sin(a) * .7], [Math.cos(a + .2), Math.sin(a + .2)], [Math.cos(a + .4) * .8, Math.sin(a + .4) * .8]], true); } break;
    case 'escudo': linha([[-.6, -.7], [.6, -.7], [.6, .2], [0, .9], [-.6, .2]], true); break;
    case 'chifres': linha([[-.15, .6], [-.8, .1], [-1, -.7], [-.7, -.4], [-.4, -.1], [0, -.4], [.4, -.1], [.7, -.4], [1, -.7], [.8, .1], [.15, .6]]); break;
    case 'chamas': linha([[-.8, .6], [-.6, -.2], [-.25, .1], [0, -1], [.3, -.3], [.4, .1], [.8, -.2], [.7, .6]], true); break;
    case 'elos': for (const d of [-.65, 0, .65]) circulo(d, 0, .35); break;
    case 'fornalha': linha([[-.8, .8], [-.8, -.5], [0, -1], [.8, -.5], [.8, .8]], true); for (const d of [-.35, 0, .35]) linha([[d, .6], [d, -.3]]); break;
    case 'flecha': linha([[0, 1], [0, -.9], [-.3, -.5], [0, -.9], [.3, -.5]]); break;
    case 'casulo': linha([[0, -1], [.65, -.4], [.65, .4], [0, 1], [-.65, .4], [-.65, -.4]], true); linha([[0, -1], [0, 1]]); break;
    case 'fumaca': for (const [a, b, r] of [[-.5, .3, .3], [0, -.2, .45], [.5, .1, .3]]) circulo(a ?? 0, b ?? 0, r ?? .3); break;
    case 'costura': for (let i = -2; i <= 2; i++) linha([[-.5, i * .25 - .15], [.5, i * .25 + .15]]); break;
    case 'runas': linha(regular(4, .9, Math.PI / 4), true); linha([[-.3, -.6], [.3, -.6], [-.3, .6], [.3, .6]]); break;
    case 'constelacao': { const ps = [[-.9, .2], [-.4, -.7], [.3, -.3], [.8, -.8], [.6, .7]]; linha(ps); for (const [a, b] of ps) circulo(a ?? 0, b ?? 0, .08); break; }
    case 'anel': circulo(0, 0, .9); break;
    case 'raizes': linha([[-.9, .9], [-.4, .4], [0, -.6], [.2, .1], [.9, .7]]); linha([[-.4, .4], [-.8, -.3]]); linha([[.2, .1], [.8, -.5]]); break;
    case 'bolhas': circulo(-.5, .4, .3); circulo(.3, -.3, .4); circulo(.7, .5, .2); break;
    case 'muralha': for (const y of [-.5, 0, .5]) for (const x of [-.7, 0, .7]) linha([[x - .3, y - .2], [x + .3, y - .2], [x + .3, y + .2], [x - .3, y + .2]], true); break;
    case 'pressao': for (const x of [-.7, -.2, .3]) linha([[x, -.8], [x + .4, 0], [x, .8]]); break;
    case 'aneis': circulo(0, 0, .5); circulo(0, 0, 1); break;
    case 'punhal': linha([[0, -1], [.2, 0], [0, .4], [-.2, 0]], true); linha([[-.4, .4], [.4, .4]]); linha([[0, .4], [0, .9]]); break;
    case 'faiscas': for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; linha([[Math.cos(a) * .4, Math.sin(a) * .4], [Math.cos(a), Math.sin(a)]]); } break;
    case 'serrilha': linha([[-1, .7], [-.6, -.1], [-.5, .3], [-.1, -.5], [0, -.1], [.4, -.8], [.5, -.4], [1, -1]]); break;
    case 'domo': linha(Array.from({ length: 17 }, (_, i) => [Math.cos(Math.PI + i * Math.PI / 16), Math.sin(Math.PI + i * Math.PI / 16)])); linha([[-1, 0], [1, 0]]); break;
    case 'selo': circulo(0, 0, .8); linha([[-1, 0], [1, 0]]); linha([[0, -1], [0, 1]]); break;
    case 'gota': circulo(0, .3, .4); linha([[-.4, .25], [0, -1], [.4, .25]]); break;
    case 'jaula': linha([[-.8, .8], [-.8, -.6], [0, -1], [.8, -.6], [.8, .8]], true); for (const x of [-.4, 0, .4]) linha([[x, .8], [x, -.7]]); break;
    case 'esporos': for (let i = 0; i < 8; i++) circulo(Math.cos(i * .78) * .9, Math.sin(i * .78) * .9, .1); break;
    case 'eclipse': circulo(0, 0, .9); circulo(.35, 0, .65); break;
    case 'triangulo': linha(regular(3, 1, -Math.PI / 2), true); break;
    case 'filamentos': for (const d of [-.6, 0, .6]) linha([[d, 1], [d * .7 + .2, .3], [d * .4, -.3], [0, -.9]]); break;
    case 'proa': linha([[0, -1], [.8, .7], [0, .3], [-.8, .7]], true); break;
    case 'tres_aneis': circulo(-.3, 0, .6); circulo(.3, 0, .6); circulo(0, -.4, .6); break;
    case 'fio': linha([[-1, .6], [-.6, -.1], [-.2, .3], [.2, -.3], [.6, .1], [1, -.6]]); break;
    case 'abrigo': linha([[-.8, .7], [-.8, -.2], [0, -.9], [.8, -.2], [.8, .7]], true); circulo(0, .2, .2); break;
  }
}
