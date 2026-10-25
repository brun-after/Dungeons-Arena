// Barra de habilidades. No desktop, fila com as teclas 1–4; no toque, roda em quarto de
// círculo ao redor do botão de ataque (§4.6, versão simplificada: D-019). Cada botão mostra a
// recarga restante e a falta de mana. Dispara no pointerdown, como os botões de ação (D-014).
// Marco 14 (14/10/2026), D-059: a barra é a que o jogador escolheu (4 teclas) e se refaz quando muda; a borda
// tem a cor do elemento e os pontos mostram o rank. Com a barra escolhida, a roda nunca tem mais que 4 botões
// (a janela rotativa da §4.6 fica desnecessária; a lista completa está na aba Habilidades).
// Ajuste de 16/10/2026 (D-067): clique direito ou toque longo num botão pede a troca (`aoTrocar`); com tecla livre,
// um botão "+" no fim abre o mesmo seletor.

import type { Habilidade } from '../combat/habilidades';
import { t } from '../i18n';
import { icone } from './icones';

export interface EstadoBotao {
  /** Fração da recarga que ainda falta, em [0, 1]. */
  recarga: number;
  semMana: boolean;
  /** Marco 22 (D-090): ícone de outro modo da habilidade (o Dízimo vital que ergue um morto); ausente, o próprio. */
  icone?: string;
  /** O que a habilidade faz nesse outro modo (dica e leitor de tela). */
  dica?: string;
}

export interface BarraHabilidades {
  elemento: HTMLElement;
  /**
   * As habilidades da barra por tecla (compiladas: rank e caminhos); `livre` mostra o botão "+". Marco 24 (25/10/2026,
   * D-094): a posição é a tecla — null é tecla vazia (sem botão), para a 4 seguir sendo a 4 com a 3 vazia.
   */
  definir: (habilidades: readonly (Habilidade | null)[], livre?: boolean) => void;
  atualizar: (estado: (h: Habilidade) => EstadoBotao) => void;
}

/** Tempo do toque longo que abre o seletor (o iOS não dispara `contextmenu`). */
const TOQUE_LONGO_MS = 550;

export function criarBarraHabilidades(
  aoUsar: (id: string) => void,
  corDo: (h: Habilidade) => string | null = () => null,
  /** D-067: pede o seletor para a tecla do botão (a habilidade nele, ou null no "+"). */
  aoTrocar?: (id: string | null, ancora: HTMLElement) => void,
): BarraHabilidades {
  const barra = document.createElement('div');
  barra.className = 'barra-habilidades';
  barra.setAttribute('role', 'group');
  barra.setAttribute('aria-label', t('controles.habilidades'));
  let botoes: { h: Habilidade; b: HTMLButtonElement; ultimo: string }[] = [];

  const pedirTroca = (b: HTMLButtonElement, id: string | null) => {
    if (!aoTrocar) return;
    b.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      aoTrocar(id, b);
    });
    let timer = 0;
    const cancelar = () => { window.clearTimeout(timer); };
    b.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType !== 'touch') return;
      cancelar();
      timer = window.setTimeout(() => { aoTrocar(id, b); }, TOQUE_LONGO_MS);
    });
    b.addEventListener('pointerup', cancelar);
    b.addEventListener('pointercancel', cancelar);
    b.addEventListener('pointerleave', cancelar);
  };

  const definir = (habilidades: readonly (Habilidade | null)[], livre = false) => {
    barra.textContent = '';
    botoes = [];
    habilidades.forEach((h, i) => {
      if (!h) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'botao-habilidade';
      b.dataset.testid = `habilidade-${h.id}`;
      b.dataset.rank = String(h.rank);
      // Marco 24 (D-094, 25/10/2026): no toque, as gerais (3 a 6) ficam na roda e as de classe (1 e 2) à esquerda
      // da 3 e da 4 (o mesmo ângulo, deslocadas pelo CSS).
      b.style.setProperty('--angulo', `${180 + (i < 2 ? i : i - 2) * 30}deg`);
      if (i < 2) b.classList.add('de-classe');
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
      pedirTroca(b, h.id);
      barra.append(b);
      botoes.push({ h, b, ultimo: '' });
    });
    if (livre && aoTrocar) {
      const mais = document.createElement('button');
      mais.type = 'button';
      mais.className = 'botao-habilidade vazio';
      mais.dataset.testid = 'habilidade-livre';
      // A primeira tecla geral vazia (3 a 6), ou a seguinte à última.
      const vazia = habilidades.findIndex((h, i) => i >= 2 && h === null);
      const slot = vazia >= 0 ? vazia : Math.max(2, habilidades.length);
      mais.style.setProperty('--angulo', `${180 + (slot - 2) * 30}deg`);
      mais.setAttribute('aria-label', t('habilidades.escolherNaBarra', { n: slot + 1 }));
      const simbolo = document.createElement('span');
      simbolo.className = 'icone';
      simbolo.append(icone('mais'));
      mais.append(simbolo);
      mais.addEventListener('click', () => { aoTrocar(null, mais); });
      barra.append(mais);
    }
  };

  return {
    elemento: barra,
    definir,
    atualizar: (estado) => {
      for (const item of botoes) {
        const s = estado(item.h);
        const chave = `${s.recarga.toFixed(2)}/${s.semMana}/${s.icone ?? ''}`;
        if (chave === item.ultimo) continue;
        const iconeAntes = item.ultimo.split('/')[2] ?? '';
        item.ultimo = chave;
        if ((s.icone ?? '') !== iconeAntes) {
          item.b.querySelector('.icone')?.replaceChildren(icone(s.icone ?? item.h.icone));
          item.b.dataset.modo = s.icone ?? '';
          item.b.title = s.dica ?? '';
          if (s.dica) item.b.setAttribute('aria-description', s.dica);
          else item.b.removeAttribute('aria-description');
        }
        item.b.style.setProperty('--recarga', s.recarga.toFixed(3));
        item.b.classList.toggle('em-recarga', s.recarga > 0);
        item.b.classList.toggle('sem-mana', s.semMana);
      }
    },
  };
}
