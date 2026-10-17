// Gestos no mapa (§4.8):
// - toque/clique curto sem arrastar -> ir até a célula;
// - segurar parado por 300 ms -> seguir o dedo, recalculando o caminho a cada célula (D-012);
// - arrastar além da zona morta (3 px no toque, 6 px no mouse) -> mover a câmera; acima de 4 px
//   o clique é suprimido;
// - dois dedos -> pinça de zoom ancorada no ponto médio, com arrasto;
// - roda do mouse -> zoom ±0.1 ancorado no cursor.

import type { Celula } from '../core/comandos';
import type { Camera } from '../render/camera';

const SEGURAR_MS = 300;
const ZONA_MORTA_TOQUE_PX = 3;
const ZONA_MORTA_MOUSE_PX = 6;
const SUPRIME_CLIQUE_PX = 4;
const PASSO_RODA = 0.1;
const CACHE_RETANGULO_MS = 100;

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
  aoIrPara: (celula: Celula) => void;
}

export function ligarPonteiro(alvo: HTMLElement, opcoes: OpcoesPonteiro): () => void {
  const { camera } = opcoes;
  const pontos = new Map<number, Ponto>();
  let gesto: Gesto = 'nenhum';
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  let ultimaCelula: Celula | null = null;
  let pinca = { distancia: 1, zoom: 1, meioX: 0, meioY: 0 };

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

  const irParaPonto = (p: { x: number; y: number }) => {
    const celula = camera.celulaSob(p.x, p.y);
    if (ultimaCelula && ultimaCelula.x === celula.x && ultimaCelula.y === celula.y) return;
    ultimaCelula = celula;
    opcoes.aoIrPara(celula);
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
    pontos.set(ev.pointerId, { x: p.x, y: p.y, inicioX: p.x, inicioY: p.y, tipo: ev.pointerType });
    clearTimeout(temporizador);

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
    const ponto = pontos.get(ev.pointerId);
    if (!ponto) return;
    const p = local(ev);
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
  return () => {
    clearTimeout(temporizador);
    alvo.removeEventListener('pointerdown', aoBaixar);
    alvo.removeEventListener('pointermove', aoMover);
    alvo.removeEventListener('pointerup', aoSoltar);
    alvo.removeEventListener('pointercancel', aoSoltar);
    alvo.removeEventListener('wheel', aoRolar);
  };
}
