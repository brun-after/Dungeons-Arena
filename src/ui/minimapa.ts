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
import { ligarZoomMapa } from './zoom-mapa';
import { cartografia, rosaDosVentos } from './cartografia';

// Marco 29 (D-128): o exterior do Mundo (mato, estrada, água e fachadas).
const COR_TERRENO: Readonly<Record<string, string>> = { piso: '#3a3546', saida: '#c98a1a', parede: '#15131b', mato: '#3d5a2e', estrada: '#7a6448', agua: '#2b5f86', fachada: '#5a4a3c' };

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

export function marcadorDaEntidade(ctx: ContextoSimulacao, idLocal: string, e: Entidade, eu: Entidade | undefined): { cor: string; r: number } | null {
    if (e.morto) return null;
    if (e.id === idLocal) return { cor: '#ffffff', r: 3 };
    // Marco 30 (30/10/2026, D-129): os do meu grupo do Mundo, em azul e maiores.
    if (eu?.grupo && e.grupo === eu.grupo) return { cor: '#3fa9f5', r: 3 };
    const rel = eu ? relacao(eu, e, ctx.modo) : 'hostil';
    // Marco 22 (D-089): o falcão do Aventureiro, em dourado.
    if (e.invocacao?.companheiro && rel !== 'hostil') return { cor: '#f5b041', r: 2 };
    if (e.invocacao && rel !== 'hostil') return { cor: '#b07ef0', r: 2 };
    if (rel === 'aliado' || rel === 'proprio') return { cor: '#27ae60', r: 2 };
    if (e.arquetipo === 'boss') return { cor: '#f1c40f', r: 4 };
    const ativo = e.ia?.modo === 'perseguindo' || e.controlador !== 'ia';
    return { cor: '#e74c3c', r: ativo ? 2.5 : 1.5 };
}

export function criarMinimapa(ctx: ContextoSimulacao, idLocal: string, toque: boolean, destino?: () => { x: number; y: number } | null): Minimapa {
  const lado = toque ? 90 : 120;
  const intervalo = toque ? 333 : 100;
  const canvas = document.createElement('canvas');
  canvas.className = 'minimapa';
  const mundo = ctx.modo.id === 'mundo';
  canvas.width = mundo ? (toque ? 132 : 176) : lado;
  canvas.height = mundo ? (toque ? 82 : 106) : lado;
  canvas.setAttribute('aria-label', t('minimapa.rotulo'));
  canvas.setAttribute('role', 'img');
  const g = canvas.getContext('2d');
  const fase = ctx.fase;
  canvas.classList.toggle('minimapa-mundo', mundo);
  const mapa = cartografia(fase.largura, fase.altura, canvas.width, canvas.height, 3);
  const fundo = terrenoEmCanvas(fase);
  const escala = Math.min(lado / fase.largura, lado / fase.altura);
  const ox = (lado - fase.largura * escala) / 2;
  const oy = (lado - fase.altura * escala) / 2;
  const px = (cx: number, cy: number) => mundo ? mapa.ponto(cx, cy).x : ox + (cx + 0.5) * escala;
  const py = (cy: number, cx: number) => mundo ? mapa.ponto(cx, cy).y : oy + (cy + 0.5) * escala;
  let ultimo = -Infinity;
  let zoom = 1;
  if (mundo) ligarZoomMapa(canvas, fator => {
    zoom = Math.max(1, Math.min(4, zoom * fator));
    ultimo = -Infinity;
  });

  const ponto = (x: number, y: number, r: number, cor: string) => {
    if (!g) return;
    g.fillStyle = cor;
    g.beginPath();
    g.arc(px(x, y), py(y, x), r / zoom, 0, Math.PI * 2);
    g.fill();
  };


  return {
    elemento: canvas,
    atualizar: (estado, agoraMs) => {
      if (!g || agoraMs - ultimo < intervalo) return;
      ultimo = agoraMs;
      g.clearRect(0, 0, canvas.width, canvas.height);
      const eu = estado.entidades.find(e => e.id === idLocal);
      g.save();
      if (mundo && zoom > 1) {
        const centro = eu ? mapa.ponto(eu.x, eu.y) : { x: canvas.width / 2, y: canvas.height / 2 };
        g.translate(canvas.width / 2, canvas.height / 2);
        g.scale(zoom, zoom);
        g.translate(-centro.x, -centro.y);
      }
      g.imageSmoothingEnabled = false;
      if (mundo) {
        g.save();
        const m = mapa.matriz;
        g.transform(m.a, m.b, m.c, m.d, m.e, m.f);
        g.drawImage(fundo, 0, 0);
        g.restore();

      } else g.drawImage(fundo, ox, oy, fase.largura * escala, fase.altura * escala);
      // Portas e saída: pontos fixos, para a orientação.
      const volta = fase.portaRetorno;
      if (volta) ponto(volta.x, volta.y, 2.5, '#65d7ee');
      for (const p of fase.portasInternas) {
        ponto(p.a.x, p.a.y, 1.5, '#bb8fce');
        ponto(p.b.x, p.b.y, 1.5, '#bb8fce');
      }
      const alvo = destino?.();
      if (alvo && eu) {
        g.strokeStyle = '#ffdc73'; g.lineWidth = 1.5; g.setLineDash([3, 3]);
        g.beginPath(); g.moveTo(px(eu.x, eu.y), py(eu.y, eu.x)); g.lineTo(px(alvo.x, alvo.y), py(alvo.y, alvo.x)); g.stroke();
        g.setLineDash([]); ponto(alvo.x, alvo.y, 3, '#ffdc73');
      }
      // Marco 22 (D-089): baús ainda fechados e as armadilhas que você já revelou.
      for (const o of estado.objetos) if (o.tipo === 'bau' && o.abertoTick === 0) ponto(o.x, o.y, 2, '#d4a017');
      for (const a of estado.armadilhas) if (a.reveladaPara.includes(idLocal)) ponto(a.x, a.y, 1.5, '#e67e22');
      // O jogador por último, por cima de todos.
      for (const e of [...estado.entidades].sort((a, b) => Number(a.id === idLocal) - Number(b.id === idLocal))) {
        const c = marcadorDaEntidade(ctx, idLocal, e, eu);
        if (c) ponto(e.x, e.y, c.r, c.cor);
      }
      g.restore();
      if (mundo) rosaDosVentos(g, 17, 13, 12);
      canvas.dataset.atualizado = String(estado.tick);
    },
  };
}
