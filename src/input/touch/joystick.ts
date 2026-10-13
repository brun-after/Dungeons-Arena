// Joystick analógico (§4.3). Rastreia um único pointerId com captura, para que outro dedo
// possa conjurar ao mesmo tempo. Só reemite quando o setor de 45° muda.

import type { Dir8 } from '../../core/comandos';
import { t } from '../../i18n';
import { limitarRaio, remapearParaGrade, setorJoystick } from '../direcao';

export const RAIO_MAX_PX = 50;

export interface OpcoesJoystick {
  aoMudarDirecao: (dir: Dir8 | 'parado') => void;
  isometrico: () => boolean;
}

export interface Joystick {
  elemento: HTMLElement;
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
  let atual: Dir8 | 'parado' = 'parado';

  const posicionar = (x: number, y: number) => {
    botao.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  };

  const emitir = (dir: Dir8 | 'parado') => {
    if (dir === atual) return;
    atual = dir;
    opcoes.aoMudarDirecao(dir);
  };

  const mover = (ev: PointerEvent) => {
    const r = anel.getBoundingClientRect();
    const dx = ev.clientX - (r.left + r.width / 2);
    const dy = ev.clientY - (r.top + r.height / 2);
    const p = limitarRaio(dx, dy, RAIO_MAX_PX);
    posicionar(p.x, p.y);
    emitir(remapearParaGrade(setorJoystick(dx, dy), opcoes.isometrico()));
  };

  const soltar = () => {
    ponteiro = null;
    anel.classList.remove('ativo');
    posicionar(0, 0);
    emitir('parado');
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
    desligar: () => {
      if (ponteiro !== null) soltar();
      anel.remove();
    },
  };
}
