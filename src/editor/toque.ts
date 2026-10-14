// Gestos do editor (§4.13). Marco 6C (13/10/2026):
// - um dedo (ou botão esquerdo) pinta; no modo navegação, arrasta a câmera;
// - dois dedos: arrasto e pinça ancorada no ponto médio; o traço em andamento é cancelado e sai
//   do histórico (nada de meio-traço);
// - botão do meio ou direito do mouse arrasta; roda dá zoom no cursor.

import type { Celula } from '../core/comandos';
import type { Camera } from '../render/camera';

const PASSO_RODA = 0.15;

export interface OpcoesToqueEditor {
  camera: Camera;
  navegando: () => boolean;
  aoIniciarTraco: (c: Celula) => void;
  aoContinuarTraco: (c: Celula) => void;
  aoConcluirTraco: () => void;
  aoCancelarTraco: () => void;
  /** A câmera mudou: redesenhar. */
  aoMover: () => void;
}

type Gesto = 'nada' | 'pintando' | 'arrastando' | 'pinca' | 'ignorando';

export function ligarToqueEditor(alvo: HTMLElement, o: OpcoesToqueEditor): () => void {
  const { camera } = o;
  const pontos = new Map<number, { x: number; y: number }>();
  let gesto: Gesto = 'nada';
  let pinca = { distancia: 1, zoom: 1, meioX: 0, meioY: 0 };

  const local = (ev: PointerEvent | WheelEvent) => {
    const r = alvo.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };
  const medidas = () => {
    const [a, b] = [...pontos.values()];
    if (!a || !b) return null;
    return { distancia: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), meioX: (a.x + b.x) / 2, meioY: (a.y + b.y) / 2 };
  };

  const aoBaixar = (ev: PointerEvent) => {
    ev.preventDefault();
    alvo.setPointerCapture(ev.pointerId);
    const p = local(ev);
    pontos.set(ev.pointerId, p);
    if (pontos.size === 1) {
      if (o.navegando() || ev.button === 1 || ev.button === 2) {
        gesto = 'arrastando';
      } else {
        gesto = 'pintando';
        o.aoIniciarTraco(camera.celulaSob(p.x, p.y));
      }
    } else if (pontos.size === 2) {
      if (gesto === 'pintando') o.aoCancelarTraco();
      const m = medidas();
      if (m) pinca = { ...m, zoom: camera.zoom };
      gesto = 'pinca';
    }
  };

  const aoMover = (ev: PointerEvent) => {
    const anterior = pontos.get(ev.pointerId);
    if (!anterior) return;
    const p = local(ev);
    pontos.set(ev.pointerId, p);
    if (gesto === 'pintando') {
      o.aoContinuarTraco(camera.celulaSob(p.x, p.y));
    } else if (gesto === 'arrastando') {
      camera.arrastar(p.x - anterior.x, p.y - anterior.y);
      o.aoMover();
    } else if (gesto === 'pinca') {
      const m = medidas();
      if (!m) return;
      camera.zoomEm(pinca.zoom * (m.distancia / pinca.distancia), m.meioX, m.meioY);
      camera.arrastar(m.meioX - pinca.meioX, m.meioY - pinca.meioY);
      pinca = { ...pinca, meioX: m.meioX, meioY: m.meioY };
      o.aoMover();
    }
  };

  const aoSoltar = (ev: PointerEvent) => {
    if (!pontos.delete(ev.pointerId)) return;
    if (gesto === 'pintando' && pontos.size === 0) o.aoConcluirTraco();
    // Depois da pinça, o dedo que sobrou não pinta: espera todos saírem.
    if (gesto === 'pinca') gesto = 'ignorando';
    if (pontos.size === 0) gesto = 'nada';
  };

  const aoCancelar = (ev: PointerEvent) => {
    if (gesto === 'pintando') o.aoCancelarTraco();
    pontos.delete(ev.pointerId);
    gesto = pontos.size === 0 ? 'nada' : 'ignorando';
  };

  const aoRodar = (ev: WheelEvent) => {
    ev.preventDefault();
    const p = local(ev);
    camera.zoomEm(camera.zoom * (ev.deltaY < 0 ? 1 + PASSO_RODA : 1 - PASSO_RODA), p.x, p.y);
    o.aoMover();
  };
  const semMenu = (ev: Event) => {
    ev.preventDefault();
  };

  alvo.addEventListener('pointerdown', aoBaixar);
  alvo.addEventListener('pointermove', aoMover);
  alvo.addEventListener('pointerup', aoSoltar);
  alvo.addEventListener('pointercancel', aoCancelar);
  alvo.addEventListener('wheel', aoRodar, { passive: false });
  alvo.addEventListener('contextmenu', semMenu);
  return () => {
    alvo.removeEventListener('pointerdown', aoBaixar);
    alvo.removeEventListener('pointermove', aoMover);
    alvo.removeEventListener('pointerup', aoSoltar);
    alvo.removeEventListener('pointercancel', aoCancelar);
    alvo.removeEventListener('wheel', aoRodar);
    alvo.removeEventListener('contextmenu', semMenu);
  };
}
