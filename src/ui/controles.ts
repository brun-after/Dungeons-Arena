// Faixa de controles de toque (§4.8): três colunas, joystick ou D-pad à esquerda e botões de
// ação à direita. Botões de ação disparam no `pointerdown`, para funcionar com um segundo dedo
// enquanto o primeiro segura o joystick; o teclado aciona pelo `click` sem ponteiro (detail 0).
// Assim a ação nunca dispara duas vezes (§3.4).

import type { Dir8 } from '../core/comandos';
import { t, type ChaveTexto } from '../i18n';
import { criarDpad } from '../input/touch/dpad';
import { criarJoystick } from '../input/touch/joystick';
import type { TipoControle } from '../plataforma/preferencias';

export interface OpcoesControles {
  tipo: TipoControle;
  aoMudarDirecao: (dir: Dir8 | 'parado') => void;
  aoAtacar: () => void;
  aoInteragir: () => void;
  isometrico: () => boolean;
}

export interface Controles {
  elemento: HTMLElement;
  trocarTipo: (tipo: TipoControle) => void;
  desligar: () => void;
}

function botaoAcao(rotulo: ChaveTexto, simbolo: string, classe: string, acao: () => void): HTMLButtonElement {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = `botao-acao ${classe}`;
  botao.textContent = simbolo;
  botao.setAttribute('aria-label', t(rotulo));
  botao.dataset.testid = classe;
  botao.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    botao.classList.add('pressionado');
    acao();
  });
  const soltar = () => {
    botao.classList.remove('pressionado');
  };
  botao.addEventListener('pointerup', soltar);
  botao.addEventListener('pointercancel', soltar);
  botao.addEventListener('pointerleave', soltar);
  botao.addEventListener('click', (ev) => {
    if (ev.detail === 0) acao();
  });
  return botao;
}

export function criarControles(opcoes: OpcoesControles): Controles {
  const faixa = document.createElement('div');
  faixa.className = 'faixa-controles';
  faixa.setAttribute('role', 'group');
  faixa.setAttribute('aria-label', t('controles.faixa'));

  const esquerda = document.createElement('div');
  esquerda.className = 'coluna esquerda';
  const centro = document.createElement('div');
  centro.className = 'coluna centro';
  const direita = document.createElement('div');
  direita.className = 'coluna direita';
  direita.append(
    botaoAcao('controles.interagir', '✋', 'interagir', opcoes.aoInteragir),
    botaoAcao('controles.ataque', '⚔', 'ataque', opcoes.aoAtacar),
  );
  faixa.append(esquerda, centro, direita);

  let desligarDirecional: (() => void) | null = null;
  const trocarTipo = (tipo: TipoControle) => {
    desligarDirecional?.();
    const args = { aoMudarDirecao: opcoes.aoMudarDirecao, isometrico: opcoes.isometrico };
    const controle = tipo === 'dpad' ? criarDpad(args) : criarJoystick(args);
    esquerda.append(controle.elemento);
    desligarDirecional = controle.desligar;
  };
  trocarTipo(opcoes.tipo);

  return {
    elemento: faixa,
    trocarTipo,
    desligar: () => {
      desligarDirecional?.();
      faixa.remove();
    },
  };
}
