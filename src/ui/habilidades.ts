// Barra de habilidades. No desktop, fila com as teclas 1–4; no toque, roda em quarto de
// círculo ao redor do botão de ataque (§4.6, versão simplificada: D-019). Cada botão mostra a
// recarga restante e a falta de mana. Dispara no pointerdown, como os botões de ação (D-014).

import type { Habilidade } from '../combat/habilidades';
import { t } from '../i18n';

export interface EstadoBotao {
  /** Fração da recarga que ainda falta, em [0, 1]. */
  recarga: number;
  semMana: boolean;
}

export interface BarraHabilidades {
  elemento: HTMLElement;
  atualizar: (estado: (h: Habilidade) => EstadoBotao) => void;
}

export function criarBarraHabilidades(habilidades: readonly Habilidade[], aoUsar: (id: string) => void): BarraHabilidades {
  const barra = document.createElement('div');
  barra.className = 'barra-habilidades';
  barra.setAttribute('role', 'group');
  barra.setAttribute('aria-label', t('controles.habilidades'));

  const botoes = habilidades.map((h, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'botao-habilidade';
    b.dataset.testid = `habilidade-${h.id}`;
    b.style.setProperty('--angulo', `${180 + i * 30}deg`);
    b.setAttribute('aria-label', t('controles.habilidade', { nome: h.nome, tecla: i + 1 }));
    const icone = document.createElement('span');
    icone.className = 'icone';
    icone.textContent = h.icone;
    const tecla = document.createElement('span');
    tecla.className = 'tecla';
    tecla.textContent = String(i + 1);
    b.append(icone, tecla);
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

  return {
    elemento: barra,
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
