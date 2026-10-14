// Plano de fundo do menu (§2.15). Marco 12 (14/10/2026). Masmorra procedural em canvas: piso e paredes
// pela mesma variação de piso do terreno e tochas que cintilam. Sem movimento reduzido, anima; com ele,
// fica parado. Para sozinho quando sai da página.

import { variacaoPiso } from '../render/terreno';
import { cintilacao } from '../render/luz';

const CELULA = 32;

export function criarFundoMenu(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.className = 'fundo-menu';
  canvas.setAttribute('aria-hidden', 'true');
  const g = canvas.getContext('2d');
  const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('movimento-reduzido');

  const desenhar = (tMs: number) => {
    if (!g) return;
    const l = (canvas.width = canvas.clientWidth || innerWidth);
    const a = (canvas.height = canvas.clientHeight || innerHeight);
    const colunas = Math.ceil(l / CELULA);
    const linhas = Math.ceil(a / CELULA);
    for (let y = 0; y < linhas; y++) {
      for (let x = 0; x < colunas; x++) {
        // Salas de 6×4 separadas por paredes de uma célula, com corredores no meio.
        const parede = (x % 7 === 0 && y % 3 !== 1) || (y % 5 === 0 && x % 7 !== 3);
        const v = variacaoPiso(x, y);
        g.fillStyle = parede ? '#15131b' : v < 0.15 ? '#25212e' : '#1e1b26';
        g.fillRect(x * CELULA, y * CELULA, CELULA, CELULA);
        if (!parede) {
          g.strokeStyle = 'rgba(0,0,0,0.25)';
          g.strokeRect(x * CELULA + 0.5, y * CELULA + 0.5, CELULA - 1, CELULA - 1);
        }
      }
    }
    // Tochas no centro de cada sala.
    for (let y = 2; y < linhas; y += 5) {
      for (let x = 3; x < colunas; x += 7) {
        const cx = x * CELULA + CELULA / 2;
        const cy = y * CELULA + CELULA / 2;
        const forca = reduzido() ? 0.55 : cintilacao(tMs, x * 7 + y);
        const grad = g.createRadialGradient(cx, cy, 0, cx, cy, CELULA * 3.2);
        grad.addColorStop(0, `rgba(255,170,80,${(0.35 * forca).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(255,170,80,0)');
        g.fillStyle = grad;
        g.fillRect(cx - CELULA * 3.2, cy - CELULA * 3.2, CELULA * 6.4, CELULA * 6.4);
      }
    }
    // Vinheta: o centro (onde ficam os botões) mais escuro e legível.
    const v = g.createRadialGradient(l / 2, a / 2, 0, l / 2, a / 2, Math.max(l, a) * 0.6);
    v.addColorStop(0, 'rgba(20,18,26,0.85)');
    v.addColorStop(1, 'rgba(20,18,26,0.35)');
    g.fillStyle = v;
    g.fillRect(0, 0, l, a);
  };

  let ultimo = 0;
  const quadro = (tMs: number) => {
    if (!canvas.isConnected) return;
    // ~10 quadros por segundo bastam para a cintilação e poupam bateria.
    if (tMs - ultimo > 100) {
      ultimo = tMs;
      desenhar(tMs);
    }
    if (!reduzido()) requestAnimationFrame(quadro);
  };
  requestAnimationFrame((t) => {
    desenhar(t);
    quadro(t);
  });
  return canvas;
}
