// Botão de centralizar a câmera (marco 26, 28/10/2026, D-117). Com a câmera em janela, arrastar a deixa solta: andar
// não recentraliza mais. Dois toques seguidos no botão (ou duas vezes a tecla C) voltam a seguir o personagem; um toque
// só lembra como se faz. O botão acende enquanto a câmera está solta.

import { t } from '../i18n';
import { icone } from './icones';

/** Dois toques em até este intervalo contam como toque duplo. */
const DUPLO_MS = 350;

export interface BotaoCentralizar {
  elemento: HTMLButtonElement;
  /** A tecla C chama o mesmo toque (o duplo vale igual). */
  tocar: (agoraMs: number) => void;
  /** A cada quadro: acende o botão com a câmera solta. */
  marcar: (solta: boolean) => void;
}

export function criarBotaoCentralizar(o: { aoCentralizar: () => void; aoDica: (texto: string) => void }): BotaoCentralizar {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao-acao centralizar';
  botao.dataset.testid = 'centralizar';
  botao.dataset.solta = 'false';
  botao.setAttribute('aria-label', t('camera.centralizar'));
  botao.title = t('camera.centralizar');
  botao.append(icone('centralizar'));
  let ultimoMs = -Infinity;
  const tocar = (agoraMs: number) => {
    if (agoraMs - ultimoMs <= DUPLO_MS) {
      ultimoMs = -Infinity;
      o.aoCentralizar();
      return;
    }
    ultimoMs = agoraMs;
    o.aoDica(t('camera.dicaCentralizar'));
  };
  botao.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    tocar(performance.now());
  });
  // O teclado (Enter/Espaço no foco) chega como click sem ponteiro.
  botao.addEventListener('click', (ev) => {
    if (ev.detail === 0) tocar(performance.now());
  });
  return {
    elemento: botao,
    tocar,
    marcar: (solta) => {
      const v = String(solta);
      if (botao.dataset.solta !== v) botao.dataset.solta = v;
    },
  };
}
