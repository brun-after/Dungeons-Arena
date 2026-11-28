// Minimapa (§2.15). Marco 12 (14/10/2026). Canvas 2D de 120×120 no desktop e 90×90 no toque, sem ponteiro,
// em pixel art. O terreno é desenhado uma vez por fase num canvas guardado; as entidades, a cada 100 ms
// no desktop e 333 ms no toque. Cores: eu branco r=3, boss #f1c40f r=4, hostil ativo #e74c3c r=2,5,
// inativo r=1,5, aliado #27ae60, invocação #b07ef0. Na arena, a cor vem da relação (§2.13).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { relacao } from '../modos/relacao';
import { alfaNoEscuro } from './visao-no-escuro';
import { t } from '../i18n';
import { codigoDeTipo, tipoEm, type Fase, type TipoCelula } from '../world/fase';
import { ligarZoomMapa } from './zoom-mapa';
import { cartografia, rosaDosVentos } from './cartografia';
import { desenharMarco, marcosDaFase, marcosDoEstado } from './marcos-do-mapa';

// Marco 29 (D-128): o exterior do Mundo (mato, estrada, água e fachadas).
const COR_TERRENO: Readonly<Record<string, string>> = { piso: '#3a3546', saida: '#c98a1a', parede: '#15131b', mato: '#3d5a2e', estrada: '#7a6448', agua: '#2b5f86', fachada: '#5a4a3c' };

/**
 * Marco 55 (26/11/2026, D-208): a fase maior que isto (o atlas do Mundo contínuo) vai no minimapa numa janela de
 * `JANELA` células em volta do jogador, pintada das células a cada passo de `PASSO_JANELA` (e quando chega região).
 */
const LIMITE_FASE_INTEIRA = 600 * 600;
const JANELA = 200;
const PASSO_JANELA = 8;

/** As cores do terreno por código de célula, em RGBA (para a pintura da janela). */
const COR_POR_CODIGO = (() => {
  const t = new Uint32Array(256);
  for (const [tipo, cor] of Object.entries(COR_TERRENO)) {
    const n = parseInt(cor.slice(1), 16);
    // ImageData em little-endian: A B G R.
    t[codigoDeTipo(tipo as TipoCelula)] = (0xff << 24) | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff);
  }
  return t;
})();

function pintarJanela(fase: Fase, x0: number, y0: number, c: HTMLCanvasElement): void {
  const g = c.getContext('2d');
  if (!g) return;
  const img = g.createImageData(JANELA, JANELA);
  const px = new Uint32Array(img.data.buffer);
  for (let y = 0; y < JANELA; y++) {
    const fy = y0 + y;
    if (fy < 0 || fy >= fase.altura) continue;
    for (let x = 0; x < JANELA; x++) {
      const fx = x0 + x;
      if (fx < 0 || fx >= fase.largura) continue;
      px[y * JANELA + x] = COR_POR_CODIGO[fase.celulas[fy * fase.largura + fx] ?? 0] ?? 0;
    }
  }
  g.putImageData(img, 0, 0);
}

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

export function marcadorDaEntidade(ctx: ContextoSimulacao, idLocal: string, e: Entidade, eu: Entidade | undefined, estado?: EstadoJogo): { cor: string; r: number } | null {
    if (e.morto) return null;
    // Marco 44 (D-178): o inimigo que o escuro esconde também some do mapa.
    if (estado && alfaNoEscuro(ctx, estado, eu, e) < 0.5) return null;
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

/**
 * Marco 53 (D-203): arrastar o minimapa ampliado (o mouse ou um dedo). Passados uns px de arrasto, o clique que vem
 * ao soltar é engolido (não abre o mapa grande).
 */
function ligarArrastoDoMinimapa(canvas: HTMLCanvasElement, zoom: () => number, mover: (dx: number, dy: number) => void): void {
  let ponto: { id: number; x: number; y: number; andou: number } | null = null;
  let engolirClique = false;
  canvas.addEventListener('pointerdown', (ev) => {
    if (zoom() <= 1 || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
    ponto = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, andou: 0 };
    engolirClique = false;
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!ponto || ev.pointerId !== ponto.id) return;
    const r = canvas.getBoundingClientRect();
    const escala = canvas.width / Math.max(1, r.width);
    const dx = (ev.clientX - ponto.x) * escala;
    const dy = (ev.clientY - ponto.y) * escala;
    ponto.andou += Math.hypot(ev.clientX - ponto.x, ev.clientY - ponto.y);
    ponto.x = ev.clientX;
    ponto.y = ev.clientY;
    if (ponto.andou > 4) {
      if (!canvas.hasPointerCapture(ev.pointerId)) canvas.setPointerCapture(ev.pointerId);
      engolirClique = true;
      mover(dx, dy);
    }
  });
  const soltar = (ev: PointerEvent) => {
    if (ponto?.id === ev.pointerId) ponto = null;
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  canvas.addEventListener('click', (ev) => {
    if (!engolirClique) return;
    engolirClique = false;
    ev.stopImmediatePropagation();
  }, true);
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
  const janela = mundo && fase.largura * fase.altura > LIMITE_FASE_INTEIRA;
  const mapa = janela ? cartografia(JANELA, JANELA, canvas.width, canvas.height, 3) : cartografia(fase.largura, fase.altura, canvas.width, canvas.height, 3);
  const fundo = janela ? document.createElement('canvas') : terrenoEmCanvas(fase);
  if (janela) fundo.width = fundo.height = JANELA;
  /** O canto da janela no atlas (0, 0 fora dela) e as listas da fase quando ela foi pintada (mudam quando chega região). */
  const origem = { x: 0, y: 0 };
  let pintadaCom: unknown = null;
  const ajustarJanela = (eu: { x: number; y: number } | undefined) => {
    if (!janela || !eu) return;
    const x0 = Math.floor(eu.x) - JANELA / 2;
    const y0 = Math.floor(eu.y) - JANELA / 2;
    if (pintadaCom === fase.spawns && Math.abs(x0 - origem.x) < PASSO_JANELA && Math.abs(y0 - origem.y) < PASSO_JANELA) return;
    if (pintadaCom !== fase.spawns) marcosFixos = marcosDaFase(fase);
    origem.x = x0;
    origem.y = y0;
    pintadaCom = fase.spawns;
    pintarJanela(fase, x0, y0, fundo);
  };
  const escala = Math.min(lado / fase.largura, lado / fase.altura);
  const ox = (lado - fase.largura * escala) / 2;
  const oy = (lado - fase.altura * escala) / 2;
  const px = (cx: number, cy: number) => mundo ? mapa.ponto(cx - origem.x, cy - origem.y).x : ox + (cx + 0.5) * escala;
  const py = (cy: number, cx: number) => mundo ? mapa.ponto(cx - origem.x, cy - origem.y).y : oy + (cy + 0.5) * escala;
  const dentro = (x: number, y: number) => !janela || (x >= origem.x && y >= origem.y && x < origem.x + JANELA && y < origem.y + JANELA);
  let ultimo = -Infinity;
  let zoom = 1;
  // Marco 53 (22/11/2026, D-203): ampliado, o minimapa se arrasta (o desvio, em px do canvas, a partir do jogador);
  // o clique sem arrastar segue abrindo o mapa grande. Os marcos (portões, casas, serviços) vêm da fase.
  const desvio = { x: 0, y: 0 };
  let marcosFixos = mundo && !janela ? marcosDaFase(fase) : [];
  const andarTexto = fase.andar && fase.andar.total > 1 ? t('mundo.andarCurto', { numero: fase.andar.numero, total: fase.andar.total }) : '';
  if (mundo) {
    ligarZoomMapa(canvas, fator => {
      zoom = Math.max(1, Math.min(4, zoom * fator));
      if (zoom <= 1) desvio.x = desvio.y = 0;
      ultimo = -Infinity;
    });
    ligarArrastoDoMinimapa(canvas, () => zoom, (dx, dy) => {
      const limiteX = (canvas.width / 2) * (1 - 1 / zoom) + canvas.width / 2;
      const limiteY = (canvas.height / 2) * (1 - 1 / zoom) + canvas.height / 2;
      desvio.x = Math.max(-limiteX, Math.min(limiteX, desvio.x - dx / zoom));
      desvio.y = Math.max(-limiteY, Math.min(limiteY, desvio.y - dy / zoom));
      ultimo = -Infinity;
    });
    canvas.title = t('minimapa.arrastar');
  }

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
      ajustarJanela(eu);
      g.save();
      if (mundo && zoom > 1) {
        const base = eu ? { x: px(eu.x, eu.y), y: py(eu.y, eu.x) } : { x: canvas.width / 2, y: canvas.height / 2 };
        const centro = { x: base.x + desvio.x, y: base.y + desvio.y };
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
      // Marco 53 (D-203): os marcos do lugar, do tamanho que se lê também ampliado.
      if (mundo) {
        const lado = 7 / Math.sqrt(zoom);
        for (const m of [...marcosFixos, ...marcosDoEstado(estado)]) {
          if (!dentro(m.x, m.y)) continue;
          desenharMarco(g, m.tipo, px(m.x, m.y), py(m.y, m.x), lado);
        }
      }
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
      for (const a of estado.armadilhas) if (a.runa || a.reveladaPara.includes(idLocal)) ponto(a.x, a.y, 1.5, '#e67e22');
      // O jogador por último, por cima de todos.
      for (const e of [...estado.entidades].filter((x) => dentro(x.x, x.y)).sort((a, b) => Number(a.id === idLocal) - Number(b.id === idLocal))) {
        const c = marcadorDaEntidade(ctx, idLocal, e, eu, estado);
        if (c) ponto(e.x, e.y, c.r, c.cor);
      }
      g.restore();
      if (mundo) rosaDosVentos(g, 17, 13, 12);
      // Marco 56 (27/11/2026, D-209): o andar da masmorra, no canto.
      if (andarTexto) {
        g.font = `600 ${toque ? 9 : 10}px sans-serif`;
        g.textAlign = 'right';
        g.textBaseline = 'bottom';
        g.lineWidth = 3;
        g.strokeStyle = 'rgba(0,0,0,.75)';
        g.strokeText(andarTexto, canvas.width - 4, canvas.height - 3);
        g.fillStyle = '#ffe1a0';
        g.fillText(andarTexto, canvas.width - 4, canvas.height - 3);
      }
      canvas.dataset.atualizado = String(estado.tick);
    },
  };
}
