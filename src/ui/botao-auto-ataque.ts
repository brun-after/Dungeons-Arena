// O botão do ataque automático no computador (25/11/2026, D-205). Antes, só o toque tinha o Parar ataque; no teclado,
// a tecla F desligava o básico sem nada na tela dizer. Agora o botão fica ao lado da ultimate, com a tecla, e desligado
// ele chama atenção: a espada riscada, vermelha, pulsando, e a faixa "Ataque automático desligado". Desligado, só o
// botão, a tecla ou sair e entrar no jogo o religam (trocar de alvo não religa mais).

import { nomeCurtoDaTecla } from '../input/atalhos';
import { t } from '../i18n';
import { icone } from './icones';

export interface BotaoAutoAtaque {
  elemento: HTMLElement;
  /** Marca o estado do básico automático e a tecla atual (o código, `KeyF`; null sem tecla). */
  marcar: (ligado: boolean, codigoTecla: string | null) => void;
}

export function criarBotaoAutoAtaque(aoAlternar: () => void): BotaoAutoAtaque {
  const caixa = document.createElement('div');
  caixa.className = 'caixa-auto-ataque';
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'botao-auto-ataque';
  b.dataset.testid = 'auto-ataque';
  const tecla = document.createElement('span');
  tecla.className = 'tecla';
  b.append(icone('espada'), tecla);
  const faixa = document.createElement('span');
  faixa.className = 'faixa-auto-ataque';
  faixa.setAttribute('role', 'status');
  caixa.append(faixa, b);
  b.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    aoAlternar();
  });
  b.addEventListener('click', (ev) => {
    if (ev.detail === 0) aoAlternar();
  });
  let ultimo = '';
  return {
    elemento: caixa,
    marcar: (ligado, codigoTecla) => {
      const chave = `${ligado}/${codigoTecla ?? ''}`;
      if (chave === ultimo) return;
      ultimo = chave;
      const nomeTecla = codigoTecla ? nomeCurtoDaTecla(codigoTecla) : '';
      caixa.dataset.desligado = String(!ligado);
      tecla.textContent = nomeTecla;
      faixa.textContent = ligado ? '' : t('autoAtaque.desligado');
      const rotulo = t(ligado ? 'autoAtaque.desligar' : 'autoAtaque.ligar', { tecla: nomeTecla });
      b.setAttribute('aria-label', rotulo);
      b.setAttribute('aria-pressed', String(ligado));
      b.title = rotulo;
    },
  };
}
