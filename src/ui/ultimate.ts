// Botão da ultimate (marco 24, 24/10/2026, D-094): o anel mostra a carga do medidor e acende cheio; a tecla é `R`.
// Sem par nas teclas 1 e 2, fica apagado com o motivo na dica. Dispara no pointerdown, como os botões de ação (D-014).

import { t } from '../i18n';
import { icone } from './icones';

export interface BotaoUltimate {
  elemento: HTMLButtonElement;
  /** `fracao` da carga em [0, 1]; `nome` da ultimate do par (null: sem par). */
  atualizar: (fracao: number, nome: string | null) => void;
}

export function criarBotaoUltimate(aoUsar: () => void): BotaoUltimate {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'botao-ultimate';
  b.dataset.testid = 'ultimate';
  const anel = document.createElement('span');
  anel.className = 'anel-carga';
  anel.setAttribute('aria-hidden', 'true');
  const tecla = document.createElement('span');
  tecla.className = 'tecla';
  tecla.textContent = 'R';
  b.append(anel, icone('coroa'), tecla);
  b.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    aoUsar();
  });
  b.addEventListener('click', (ev) => {
    if (ev.detail === 0) aoUsar();
  });
  let ultimo = '';
  return {
    elemento: b,
    atualizar: (fracao, nome) => {
      const pct = Math.round(Math.max(0, Math.min(1, fracao)) * 100);
      const chave = `${pct}/${nome ?? ''}`;
      if (chave === ultimo) return;
      ultimo = chave;
      b.style.setProperty('--carga', String(pct / 100));
      b.classList.toggle('cheia', pct >= 100 && nome !== null);
      b.classList.toggle('sem-par', nome === null);
      b.dataset.carga = String(pct);
      const rotulo = nome === null ? t('ultimate.semPar') : pct >= 100 ? t('ultimate.pronta', { nome }) : t('ultimate.carregando', { nome, pct });
      b.setAttribute('aria-label', rotulo);
      b.title = rotulo;
    },
  };
}
