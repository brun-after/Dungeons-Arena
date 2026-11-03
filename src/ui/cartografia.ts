import { criarProjecao } from '../render/projecao';
import { CELULA_PX } from '../render/camera-calculo';

/** Usa a mesma matriz do chão do jogo, inclusive na conversão dos cliques. */
export function cartografia(largura: number, altura: number, w: number, h: number, margem = 20) {
  const p = criarProjecao('iso', largura, altura);
  const escala = Math.min((w - margem * 2) / p.largura, (h - margem * 2) / p.altura);
  const ox = (w - p.largura * escala) / 2, oy = (h - p.altura * escala) / 2;
  return {
    matriz: { a: p.matriz.a * CELULA_PX * escala, b: p.matriz.b * CELULA_PX * escala, c: p.matriz.c * CELULA_PX * escala, d: p.matriz.d * CELULA_PX * escala, e: ox + p.matriz.tx * escala, f: oy },
    ponto: (x: number, y: number) => {
      const q = p.projetar((x + .5) * CELULA_PX, (y + .5) * CELULA_PX);
      return { x: ox + q.x * escala, y: oy + q.y * escala };
    },
    celula: (x: number, y: number) => {
      const q = p.desprojetar((x - ox) / escala, (y - oy) / escala);
      return { x: Math.floor(q.x / CELULA_PX), y: Math.floor(q.y / CELULA_PX) };
    },
  };
}

export function rosaDosVentos(g: CanvasRenderingContext2D, x: number, y: number, raio: number): void {
  g.save();
  g.font = `600 ${raio < 20 ? 9 : 12}px sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const [nome, dx, dy] of [['N', 1, -.5], ['L', 1, .5], ['S', -1, .5], ['O', -1, -.5]] as const) {
    g.strokeStyle = '#718b92'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx * raio * .7, y + dy * raio * .7); g.stroke();
    g.fillStyle = nome === 'N' ? '#ffe1a0' : '#d1dfe0';
    g.fillText(nome, x + dx * raio, y + dy * raio);
  }
  g.restore();
}
