// Faixa de controles de toque (§4.8): três colunas, joystick ou D-pad à esquerda e botões de
// ação à direita. Botões de ação disparam no `pointerdown`, para funcionar com um segundo dedo
// enquanto o primeiro segura o joystick; o teclado aciona pelo `click` sem ponteiro (detail 0).
// Assim a ação nunca dispara duas vezes (§3.4).

import type { Dir8 } from '../core/comandos';
import { t, type ChaveTexto } from '../i18n';
import { criarDpad } from '../input/touch/dpad';
import { criarJoystick } from '../input/touch/joystick';
import type { TipoControle } from '../plataforma/preferencias';
import { icone } from './icones';

export interface OpcoesControles {
  tipo: TipoControle;
  aoMudarDirecao: (dir: Dir8 | 'parado') => void;
  /** Marco 24 (25/10/2026, D-094): o botão grande do canto é a ultimate; o básico liga pelo alvo (D-097). */
  principal: HTMLElement;
  aoInteragir: () => void;
  /** Ajuste de 15/10/2026 (D-065): tocar no botão de alvo troca de alvo; segurar trava ou destrava. */
  aoTrocarAlvo: () => void;
  aoTravarAlvo: () => void;
  /** Marco 24 (24/10/2026, D-097): o botão Parar ataque (liga e desliga o básico automático). */
  aoPararAtaque: () => void;
  isometrico: () => boolean;
}

export interface Controles {
  elemento: HTMLElement;
  /** Coluna do botão de ataque, onde a roda de habilidades é montada. */
  direita: HTMLElement;
  trocarTipo: (tipo: TipoControle) => void;
  /** Mostra no botão de alvo se o alvo está travado. */
  marcarTrava: (travado: boolean) => void;
  /** Marco 24: mostra no Parar ataque se o básico automático está desligado. */
  marcarBasico: (ligado: boolean) => void;
  desligar: () => void;
}

function botaoAcao(rotulo: ChaveTexto, simbolo: string, classe: string, acao: () => void): HTMLButtonElement {
  // Ajuste de 16/10/2026 (D-067): `simbolo` é um id de ícone (nada de emoji).
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = `botao-acao ${classe}`;
  botao.append(icone(simbolo));
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

const SEGURAR_MS = 450;

/** Ajuste de 15/10/2026 (D-065): o botão de alvo — toque curto troca de alvo; segurar ~450 ms trava ou destrava. */
function botaoAlvo(aoTocar: () => void, aoSegurar: () => void): HTMLButtonElement {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao-acao alvo';
  botao.append(icone('alvo'));
  botao.setAttribute('aria-label', t('controles.trocarAlvo'));
  botao.dataset.testid = 'alvo';
  let timer: ReturnType<typeof setTimeout> | null = null;
  const parar = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    botao.classList.remove('pressionado');
  };
  botao.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    botao.classList.add('pressionado');
    timer = setTimeout(() => {
      timer = null;
      aoSegurar();
    }, SEGURAR_MS);
  });
  botao.addEventListener('pointerup', () => {
    if (timer !== null) aoTocar();
    parar();
  });
  botao.addEventListener('pointercancel', parar);
  botao.addEventListener('pointerleave', parar);
  botao.addEventListener('click', (ev) => {
    if (ev.detail === 0) aoTocar();
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
  const alvo = botaoAlvo(opcoes.aoTrocarAlvo, opcoes.aoTravarAlvo);
  const parar = botaoAcao('controles.pararAtaque', 'pausa', 'parar-ataque', opcoes.aoPararAtaque);
  centro.append(botaoAcao('controles.interagir', 'interagir', 'interagir', opcoes.aoInteragir), parar, alvo);
  direita.append(opcoes.principal);
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
    direita,
    trocarTipo,
    marcarTrava: (travado) => {
      if (alvo.dataset.travado !== String(travado)) alvo.dataset.travado = String(travado);
    },
    marcarBasico: (ligado) => {
      if (parar.dataset.parado !== String(!ligado)) parar.dataset.parado = String(!ligado);
    },
    desligar: () => {
      desligarDirecional?.();
      faixa.remove();
    },
  };
}
