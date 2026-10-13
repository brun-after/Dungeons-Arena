// D-pad de 8 direções (§4.4). O dedo pode deslizar entre botões sem soltar: a direção segue o
// botão sob o ponteiro capturado. A direção é estado mantido, então segurar não concede passos
// extras; a repetição de 180 ms da spec não tem o que repetir (D-010).

import type { Dir8 } from '../../core/comandos';
import { t } from '../../i18n';
import { vibrar } from '../../plataforma/dispositivo';
import { remapearParaGrade } from '../direcao';

const GRADE: readonly (Dir8 | null)[] = ['NO', 'N', 'NE', 'O', null, 'E', 'SO', 'S', 'SE'];
const SETA: Readonly<Record<Dir8, string>> = {
  NO: '↖',
  N: '↑',
  NE: '↗',
  O: '←',
  E: '→',
  SO: '↙',
  S: '↓',
  SE: '↘',
};

export interface OpcoesDpad {
  aoMudarDirecao: (dir: Dir8 | 'parado') => void;
  isometrico: () => boolean;
}

export interface Dpad {
  elemento: HTMLElement;
  desligar: () => void;
}

export function criarDpad(opcoes: OpcoesDpad): Dpad {
  const pad = document.createElement('div');
  pad.className = 'dpad';
  pad.setAttribute('role', 'group');
  pad.setAttribute('aria-label', t('controles.dpad'));
  pad.dataset.testid = 'dpad';

  for (const dir of GRADE) {
    const celula = document.createElement('div');
    if (dir) {
      celula.className = `dpad-botao ${dir.length === 2 ? 'diagonal' : 'cardinal'}`;
      celula.dataset.dir = dir;
      celula.textContent = SETA[dir];
    } else {
      celula.className = 'dpad-centro';
    }
    pad.append(celula);
  }

  let ponteiro: number | null = null;
  let atual: Dir8 | 'parado' = 'parado';
  let pressionado: HTMLElement | null = null;

  const marcar = (alvo: HTMLElement | null) => {
    if (alvo === pressionado) return;
    pressionado?.classList.remove('pressionado');
    alvo?.classList.add('pressionado');
    pressionado = alvo;
  };

  const emitir = (dir: Dir8 | 'parado') => {
    if (dir === atual) return;
    if (dir !== 'parado') vibrar(18);
    atual = dir;
    opcoes.aoMudarDirecao(remapearParaGrade(dir, opcoes.isometrico()));
  };

  const atualizar = (ev: PointerEvent) => {
    const sob = document.elementFromPoint(ev.clientX, ev.clientY);
    const botao = sob instanceof HTMLElement && pad.contains(sob) ? sob.closest<HTMLElement>('.dpad-botao') : null;
    marcar(botao);
    emitir((botao?.dataset.dir as Dir8 | undefined) ?? 'parado');
  };

  const soltar = () => {
    ponteiro = null;
    marcar(null);
    emitir('parado');
  };

  pad.addEventListener('pointerdown', (ev) => {
    if (ponteiro !== null) return;
    ev.preventDefault();
    ponteiro = ev.pointerId;
    pad.setPointerCapture(ev.pointerId);
    atualizar(ev);
  });
  pad.addEventListener('pointermove', (ev) => {
    if (ev.pointerId === ponteiro) atualizar(ev);
  });
  for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    pad.addEventListener(tipo, (ev) => {
      if (ev.pointerId === ponteiro) soltar();
    });
  }

  return {
    elemento: pad,
    desligar: () => {
      if (ponteiro !== null) soltar();
      pad.remove();
    },
  };
}
