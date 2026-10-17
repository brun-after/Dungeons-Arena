// Barra de habilidades. No desktop, fila com as teclas 1–4; no toque, roda em quarto de
// círculo ao redor do botão de ataque (§4.6, versão simplificada: D-019). Cada botão mostra a
// recarga restante e a falta de mana. Dispara no pointerdown, como os botões de ação (D-014).
// Marco 14 (14/10/2026), D-059: a barra é a que o jogador escolheu (4 teclas) e se refaz quando muda; a borda
// tem a cor do elemento e os pontos mostram o rank. Com a barra escolhida, a roda nunca tem mais que 4 botões
// (a janela rotativa da §4.6 fica desnecessária; a lista completa está na aba Habilidades).

import type { Habilidade } from '../combat/habilidades';
import { t } from '../i18n';
import { icone } from './icones';

export interface EstadoBotao {
  /** Fração da recarga que ainda falta, em [0, 1]. */
  recarga: number;
  semMana: boolean;
}

export interface BarraHabilidades {
  elemento: HTMLElement;
  /** As habilidades da barra, na ordem das teclas (compiladas: rank e caminhos). */
  definir: (habilidades: readonly Habilidade[]) => void;
  atualizar: (estado: (h: Habilidade) => EstadoBotao) => void;
}

export function criarBarraHabilidades(aoUsar: (id: string) => void, corDo: (h: Habilidade) => string | null = () => null): BarraHabilidades {
  const barra = document.createElement('div');
  barra.className = 'barra-habilidades';
  barra.setAttribute('role', 'group');
  barra.setAttribute('aria-label', t('controles.habilidades'));
  let botoes: { h: Habilidade; b: HTMLButtonElement; ultimo: string }[] = [];

  const definir = (habilidades: readonly Habilidade[]) => {
    barra.textContent = '';
    botoes = habilidades.map((h, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'botao-habilidade';
      b.dataset.testid = `habilidade-${h.id}`;
      b.dataset.rank = String(h.rank);
      b.style.setProperty('--angulo', `${180 + i * 30}deg`);
      const cor = corDo(h);
      if (cor) b.style.setProperty('--cor-elemento', cor);
      b.setAttribute('aria-label', t('controles.habilidade', { nome: h.nome, tecla: i + 1 }));
      const simbolo = document.createElement('span');
      simbolo.className = 'icone';
      simbolo.append(icone(h.icone));
      const tecla = document.createElement('span');
      tecla.className = 'tecla';
      tecla.textContent = String(i + 1);
      b.append(simbolo, tecla);
      if (h.rank > 1) {
        const rank = document.createElement('span');
        rank.className = 'rank';
        rank.textContent = '•'.repeat(h.rank);
        rank.setAttribute('aria-hidden', 'true');
        b.append(rank);
      }
      b.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        aoUsar(h.id);
      });
      b.addEventListener('click', (ev) => {
        if (ev.detail === 0) aoUsar(h.id);
      });
      barra.append(b);
      return { h, b, ultimo: '' };
    });
  };

  return {
    elemento: barra,
    definir,
    atualizar: (estado) => {
      for (const item of botoes) {
        const s = estado(item.h);
        const chave = `${s.recarga.toFixed(2)}/${s.semMana}`;
        if (chave === item.ultimo) continue;
        item.ultimo = chave;
        item.b.style.setProperty('--recarga', s.recarga.toFixed(3));
        item.b.classList.toggle('em-recarga', s.recarga > 0);
        item.b.classList.toggle('sem-mana', s.semMana);
      }
    },
  };
}
