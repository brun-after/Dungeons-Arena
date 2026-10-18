// Minimapa (§2.15). Marco 12 (14/10/2026). Canvas 2D de 120×120 no desktop e 90×90 no toque, sem ponteiro,
// em pixel art. O terreno é desenhado uma vez por fase num canvas guardado; as entidades, a cada 100 ms
// no desktop e 333 ms no toque. Cores: eu branco r=3, boss #f1c40f r=4, hostil ativo #e74c3c r=2,5,
// inativo r=1,5, aliado #27ae60, invocação #b07ef0. Na arena, a cor vem da relação (§2.13).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { relacao } from '../modos/relacao';
import { t } from '../i18n';
import { tipoEm, type Fase } from '../world/fase';

const COR_TERRENO: Readonly<Record<string, string>> = { piso: '#3a3546', saida: '#c98a1a', parede: '#15131b' };

export interface Minimapa {
  elemento: HTMLCanvasElement;
  atualizar: (estado: EstadoJogo, agoraMs: number) => void;
}

function terrenoEmCanvas(fase: Fase): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = fase.largura;
  c.height = fase.altura;
  const g = c.getContext('2d');
  if (!g) return c;
  for (let y = 0; y < fase.altura; y++) {
    for (let x = 0; x < fase.largura; x++) {
      const cor = COR_TERRENO[tipoEm(fase, x, y)];
      if (!cor) continue;
      g.fillStyle = cor;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

export function criarMinimapa(ctx: ContextoSimulacao, idLocal: string, toque: boolean): Minimapa {
  const lado = toque ? 90 : 120;
  const intervalo = toque ? 333 : 100;
  const canvas = document.createElement('canvas');
  canvas.className = 'minimapa';
  canvas.width = lado;
  canvas.height = lado;
  canvas.setAttribute('aria-label', t('minimapa.rotulo'));
  canvas.setAttribute('role', 'img');
  const g = canvas.getContext('2d');
  const fase = ctx.fase;
  const fundo = terrenoEmCanvas(fase);
  const escala = Math.min(lado / fase.largura, lado / fase.altura);
  const ox = (lado - fase.largura * escala) / 2;
  const oy = (lado - fase.altura * escala) / 2;
  const px = (cx: number) => ox + (cx + 0.5) * escala;
  const py = (cy: number) => oy + (cy + 0.5) * escala;
  let ultimo = -Infinity;

  const ponto = (x: number, y: number, r: number, cor: string) => {
    if (!g) return;
    g.fillStyle = cor;
    g.beginPath();
    g.arc(px(x), py(y), r, 0, Math.PI * 2);
    g.fill();
  };

  const corDe = (e: Entidade, eu: Entidade | undefined): { cor: string; r: number } | null => {
    if (e.morto) return null;
    if (e.id === idLocal) return { cor: '#ffffff', r: 3 };
    const rel = eu ? relacao(eu, e, ctx.modo) : 'hostil';
    if (e.invocacao && rel !== 'hostil') return { cor: '#b07ef0', r: 2 };
    if (rel === 'aliado' || rel === 'proprio') return { cor: '#27ae60', r: 2 };
    if (e.arquetipo === 'boss') return { cor: '#f1c40f', r: 4 };
    const ativo = e.ia?.modo === 'perseguindo' || e.controlador !== 'ia';
    return { cor: '#e74c3c', r: ativo ? 2.5 : 1.5 };
  };

  return {
    elemento: canvas,
    atualizar: (estado, agoraMs) => {
      if (!g || agoraMs - ultimo < intervalo) return;
      ultimo = agoraMs;
      g.clearRect(0, 0, lado, lado);
      g.imageSmoothingEnabled = false;
      g.drawImage(fundo, ox, oy, fase.largura * escala, fase.altura * escala);
      // Portas e saída: pontos fixos, para a orientação.
      const volta = fase.portaRetorno;
      if (volta) ponto(volta.x, volta.y, 2.5, '#65d7ee');
      for (const p of fase.portasInternas) {
        ponto(p.a.x, p.a.y, 1.5, '#bb8fce');
        ponto(p.b.x, p.b.y, 1.5, '#bb8fce');
      }
      const eu = estado.entidades.find((e) => e.id === idLocal);
      // O jogador por último, por cima de todos.
      for (const e of [...estado.entidades].sort((a, b) => Number(a.id === idLocal) - Number(b.id === idLocal))) {
        const c = corDe(e, eu);
        if (c) ponto(e.x, e.y, c.r, c.cor);
      }
      canvas.dataset.atualizado = String(estado.tick);
    },
  };
}
