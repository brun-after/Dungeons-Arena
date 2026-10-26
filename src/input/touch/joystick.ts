// Joystick analógico (§4.3). Rastreia um único pointerId com captura, para que outro dedo
// possa conjurar ao mesmo tempo. Marco 26 (25/10/2026, D-105): manda o vetor exato do botão (qualquer ângulo),
// levado à fase pela inversa da projeção; só reemite quando o ângulo muda uns 3°.

import { t } from '../../i18n';
import { limitarRaio, PARADO, rumoMudou, vetorDaTela, ZONA_MORTA_JOYSTICK_PX, type Rumo } from '../direcao';

export const RAIO_MAX_PX = 50;

export interface OpcoesJoystick {
  aoMudarDirecao: (rumo: Rumo) => void;
  isometrico: () => boolean;
}

export interface Joystick {
  elemento: HTMLElement;
  /** O vetor já sai pela projeção atual a cada movimento: nada a redesenhar ao trocar de visão. */
  atualizarVisao: () => void;
  desligar: () => void;
}

export function criarJoystick(opcoes: OpcoesJoystick): Joystick {
  const anel = document.createElement('div');
  anel.className = 'joystick';
  anel.setAttribute('role', 'application');
  anel.setAttribute('aria-label', t('controles.joystick'));
  anel.dataset.testid = 'joystick';
  const botao = document.createElement('div');
  botao.className = 'joystick-botao';
  anel.append(botao);

  let ponteiro: number | null = null;
  let atual: Rumo = PARADO;

  const posicionar = (x: number, y: number) => {
    botao.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  };

  const emitir = (rumo: Rumo) => {
    if (!rumoMudou(atual, rumo)) return;
    atual = rumo;
    opcoes.aoMudarDirecao(rumo);
  };

  const mover = (ev: PointerEvent) => {
    const r = anel.getBoundingClientRect();
    const dx = ev.clientX - (r.left + r.width / 2);
    const dy = ev.clientY - (r.top + r.height / 2);
    const p = limitarRaio(dx, dy, RAIO_MAX_PX);
    posicionar(p.x, p.y);
    emitir(Math.hypot(dx, dy) < ZONA_MORTA_JOYSTICK_PX ? PARADO : vetorDaTela(dx, dy, opcoes.isometrico()));
  };

  const soltar = () => {
    ponteiro = null;
    anel.classList.remove('ativo');
    posicionar(0, 0);
    emitir(PARADO);
  };

  const aoBaixar = (ev: PointerEvent) => {
    if (ponteiro !== null) return;
    ev.preventDefault();
    ponteiro = ev.pointerId;
    anel.setPointerCapture(ev.pointerId);
    anel.classList.add('ativo');
    mover(ev);
  };
  const aoMover = (ev: PointerEvent) => {
    if (ev.pointerId === ponteiro) mover(ev);
  };
  const aoTerminar = (ev: PointerEvent) => {
    if (ev.pointerId === ponteiro) soltar();
  };

  anel.addEventListener('pointerdown', aoBaixar);
  anel.addEventListener('pointermove', aoMover);
  anel.addEventListener('pointerup', aoTerminar);
  anel.addEventListener('pointercancel', aoTerminar);
  anel.addEventListener('lostpointercapture', aoTerminar);

  return {
    elemento: anel,
    atualizarVisao: () => undefined,
    desligar: () => {
      if (ponteiro !== null) soltar();
      anel.remove();
    },
  };
}
