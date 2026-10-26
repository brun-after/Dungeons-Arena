// Gestos no mapa (§4.8):
// - toque/clique curto sem arrastar -> ir até o ponto tocado (marco 26: o ponto contínuo, não o centro da célula);
// - segurar parado por 300 ms -> seguir o dedo, recalculando o caminho a cada célula (D-012);
// - arrastar além da zona morta (3 px no toque, 6 px no mouse) -> mover a câmera; acima de 4 px
//   o clique é suprimido;
// - dois dedos -> pinça de zoom ancorada no ponto médio, com arrasto;
// - roda do mouse -> zoom ±0.1 ancorado no cursor.
// Marco 26 (26/10/2026, D-115): o mouse não espera soltar. O botão esquerdo age ao apertar (vai ao ponto, seleciona o
// hostil) e, segurado, guia o personagem como o joystick: o vetor de tela do personagem até o cursor, a cada quadro
// (o personagem anda e o cursor parado muda de direção), pela inversa da projeção; soltar para. A câmera passa a ser
// arrastada com o botão do meio ou o direito. O toque segue como antes.

import type { Celula } from '../core/comandos';
import type { Camera } from '../render/camera';
import { PARADO, rumoMudou, vetorDaTela, type Rumo } from './direcao';

const SEGURAR_MS = 300;
const ZONA_MORTA_TOQUE_PX = 3;
const ZONA_MORTA_MOUSE_PX = 6;
const SUPRIME_CLIQUE_PX = 4;
const PASSO_RODA = 0.1;
const CACHE_RETANGULO_MS = 100;
/** D-115: segurando o botão esquerdo por isto (ou movendo o cursor), o mouse passa a guiar. */
export const GUIAR_APOS_MS = 120;
/** D-115: com o cursor a menos disto do personagem (px de tela), ele para. */
export const PARADO_PERTO_PX = 14;

type Gesto = 'nenhum' | 'pendente' | 'arrastando' | 'seguindo' | 'pinca' | 'ignorando';

interface Ponto {
  x: number;
  y: number;
  inicioX: number;
  inicioY: number;
  tipo: string;
}

export interface OpcoesPonteiro {
  camera: Camera;
  /** A célula tocada (para achar quem está nela) e o ponto contínuo exato. `false`: não andou (selecionou um alvo). */
  aoIrPara: (celula: Celula, ponto: Celula) => boolean;
  /** D-115: o mouse guiando como o joystick (sem isto, o mouse se comporta como o toque). */
  guiar?: {
    /** O personagem local na tela (px do alvo), ou null sem personagem. */
    posicaoNaTela: () => { x: number; y: number } | null;
    aoMudarDirecao: (rumo: Rumo) => void;
    isometrico: () => boolean;
  };
}

export interface Ponteiro {
  /** A cada quadro: o mouse segurado reavalia a direção (o personagem andou). */
  atualizar: (agoraMs: number) => void;
  desligar: () => void;
}

interface MouseGuiando {
  id: number;
  x: number;
  y: number;
  inicioX: number;
  inicioY: number;
  desdeMs: number;
  guiando: boolean;
  /** O clique selecionou um alvo: segurar não guia. */
  semGuiar: boolean;
}

export function ligarPonteiro(alvo: HTMLElement, opcoes: OpcoesPonteiro): Ponteiro {
  const { camera, guiar } = opcoes;
  const pontos = new Map<number, Ponto>();
  let gesto: Gesto = 'nenhum';
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  let ultimaCelula: Celula | null = null;
  let pinca = { distancia: 1, zoom: 1, meioX: 0, meioY: 0 };
  let mouse: MouseGuiando | null = null;
  let rumo: Rumo = PARADO;

  let retangulo = alvo.getBoundingClientRect();
  let retanguloEm = 0;
  const local = (ev: PointerEvent | WheelEvent) => {
    const agora = performance.now();
    if (agora - retanguloEm > CACHE_RETANGULO_MS) {
      retangulo = alvo.getBoundingClientRect();
      retanguloEm = agora;
    }
    return { x: ev.clientX - retangulo.left, y: ev.clientY - retangulo.top };
  };

  const irParaPonto = (p: { x: number; y: number }): boolean => {
    const celula = camera.celulaSob(p.x, p.y);
    if (ultimaCelula && ultimaCelula.x === celula.x && ultimaCelula.y === celula.y) return true;
    ultimaCelula = celula;
    return opcoes.aoIrPara(celula, camera.pontoSob(p.x, p.y));
  };

  const emitirRumo = (novo: Rumo) => {
    if (!guiar || !rumoMudou(rumo, novo)) return;
    rumo = novo;
    guiar.aoMudarDirecao(novo);
  };

  /** D-115: a direção do personagem até o cursor, na projeção atual. */
  const guiarAgora = () => {
    if (!mouse || !guiar) return;
    const eu = guiar.posicaoNaTela();
    if (!eu) return;
    const dx = mouse.x - eu.x;
    const dy = mouse.y - eu.y;
    emitirRumo(Math.hypot(dx, dy) < PARADO_PERTO_PX ? PARADO : vetorDaTela(dx, dy, guiar.isometrico()));
  };

  const medidasPinca = () => {
    const [a, b] = [...pontos.values()];
    if (!a || !b) return null;
    return { distancia: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), meioX: (a.x + b.x) / 2, meioY: (a.y + b.y) / 2 };
  };

  const aoBaixar = (ev: PointerEvent) => {
    ev.preventDefault();
    alvo.setPointerCapture(ev.pointerId);
    const p = local(ev);
    clearTimeout(temporizador);
    if (ev.pointerType === 'mouse' && guiar) {
      // D-115: o botão do meio ou o direito arrastam a câmera; o esquerdo anda na hora.
      pontos.set(ev.pointerId, { x: p.x, y: p.y, inicioX: p.x, inicioY: p.y, tipo: 'mouse' });
      if (ev.button !== 0) {
        gesto = 'arrastando';
        return;
      }
      gesto = 'nenhum';
      ultimaCelula = null;
      const andou = irParaPonto(p);
      mouse = { id: ev.pointerId, x: p.x, y: p.y, inicioX: p.x, inicioY: p.y, desdeMs: performance.now(), guiando: false, semGuiar: !andou };
      rumo = PARADO;
      return;
    }
    pontos.set(ev.pointerId, { x: p.x, y: p.y, inicioX: p.x, inicioY: p.y, tipo: ev.pointerType });

    if (pontos.size === 1) {
      gesto = 'pendente';
      ultimaCelula = null;
      temporizador = setTimeout(() => {
        if (gesto !== 'pendente') return;
        gesto = 'seguindo';
        const atual = pontos.get(ev.pointerId);
        if (atual) irParaPonto(atual);
      }, SEGURAR_MS);
    } else if (pontos.size === 2) {
      const m = medidasPinca();
      if (m) {
        gesto = 'pinca';
        pinca = { ...m, zoom: camera.zoom };
      }
    }
  };

  const aoMover = (ev: PointerEvent) => {
    const p = local(ev);
    if (mouse && ev.pointerId === mouse.id) {
      mouse.x = p.x;
      mouse.y = p.y;
      if (!mouse.semGuiar && !mouse.guiando && Math.hypot(p.x - mouse.inicioX, p.y - mouse.inicioY) > ZONA_MORTA_MOUSE_PX) mouse.guiando = true;
      if (mouse.guiando) guiarAgora();
      return;
    }
    const ponto = pontos.get(ev.pointerId);
    if (!ponto) return;
    const dx = p.x - ponto.x;
    const dy = p.y - ponto.y;
    ponto.x = p.x;
    ponto.y = p.y;

    if (gesto === 'pinca') {
      const m = medidasPinca();
      if (!m) return;
      camera.zoomEm(pinca.zoom * (m.distancia / pinca.distancia), m.meioX, m.meioY);
      camera.arrastar(m.meioX - pinca.meioX, m.meioY - pinca.meioY);
      pinca.meioX = m.meioX;
      pinca.meioY = m.meioY;
      return;
    }
    if (gesto === 'pendente') {
      const zonaMorta = ponto.tipo === 'mouse' ? ZONA_MORTA_MOUSE_PX : ZONA_MORTA_TOQUE_PX;
      if (Math.hypot(p.x - ponto.inicioX, p.y - ponto.inicioY) > zonaMorta) {
        gesto = 'arrastando';
        clearTimeout(temporizador);
        camera.arrastar(p.x - ponto.inicioX, p.y - ponto.inicioY);
      }
      return;
    }
    if (gesto === 'arrastando') camera.arrastar(dx, dy);
    else if (gesto === 'seguindo') irParaPonto(p);
  };

  const aoSoltar = (ev: PointerEvent) => {
    if (mouse && ev.pointerId === mouse.id) {
      // Depois de guiar, soltar para na hora (como soltar o joystick); o clique curto segue até o ponto.
      if (mouse.guiando) emitirRumo(PARADO);
      mouse = null;
      pontos.delete(ev.pointerId);
      return;
    }
    const ponto = pontos.get(ev.pointerId);
    if (!ponto) return;
    pontos.delete(ev.pointerId);
    clearTimeout(temporizador);
    const moveu = Math.hypot(ponto.x - ponto.inicioX, ponto.y - ponto.inicioY);
    if (gesto === 'pendente' && moveu <= SUPRIME_CLIQUE_PX && ev.type === 'pointerup') irParaPonto(ponto);
    // Depois de uma pinça, o dedo que sobrar não vira toque nem arrasto até ser solto.
    if (pontos.size === 0) gesto = 'nenhum';
    else if (gesto === 'pinca') gesto = 'ignorando';
  };

  const aoRolar = (ev: WheelEvent) => {
    ev.preventDefault();
    const p = local(ev);
    camera.zoomEm(camera.zoom + (ev.deltaY < 0 ? PASSO_RODA : -PASSO_RODA), p.x, p.y);
  };

  alvo.addEventListener('pointerdown', aoBaixar);
  alvo.addEventListener('pointermove', aoMover);
  alvo.addEventListener('pointerup', aoSoltar);
  alvo.addEventListener('pointercancel', aoSoltar);
  alvo.addEventListener('wheel', aoRolar, { passive: false });
  return {
    atualizar: (agoraMs) => {
      if (!mouse || mouse.semGuiar) return;
      if (!mouse.guiando && agoraMs - mouse.desdeMs >= GUIAR_APOS_MS) mouse.guiando = true;
      if (mouse.guiando) guiarAgora();
    },
    desligar: () => {
      clearTimeout(temporizador);
      alvo.removeEventListener('pointerdown', aoBaixar);
      alvo.removeEventListener('pointermove', aoMover);
      alvo.removeEventListener('pointerup', aoSoltar);
      alvo.removeEventListener('pointercancel', aoSoltar);
      alvo.removeEventListener('wheel', aoRolar);
    },
  };
}
