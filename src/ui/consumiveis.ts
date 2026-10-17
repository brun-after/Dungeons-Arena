// Barra de consumíveis (ajuste de 16/10/2026, D-067): poções e pergaminhos à mão, sem abrir a mochila. Fica à
// direita: no PC, uma coluna com a tecla de cada um (5–9 e 0, os mesmos atalhos de antes); no toque, uma lista
// rolável translúcida no alto, onde ficava o minimapa. Clicar ou tocar usa o item (comando `usarItem`).

import type { Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { t } from '../i18n';
import type { Item } from '../progression/itens';
import { ATALHOS_DE_CONSUMIVEL } from '../progression/inventario';
import { icone } from './icones';

/** A tecla de cada posição da barra (as mesmas do teclado: 5–9 e 0). */
const TECLAS = ['5', '6', '7', '8', '9', '0'];

/** 17/10/2026: rótulo curto nos dois dispositivos; recuperação nominal, antes de modificadores. */
export function nomeCurtoConsumivel(item: Item, jogador: Pick<Entidade, 'hpMax' | 'manaMax'>): string {
  const recurso = item.efeitos.find((e) => e.tipo === 'cura' || (e.tipo === 'recuperar_recurso' && e.duracaoMs === 0));
  if (recurso) {
    const vida = recurso.tipo === 'cura';
    const valor = Math.round(recurso.valor + (vida ? jogador.hpMax : jogador.manaMax) * recurso.pct / 100);
    return t(vida ? 'consumiveis.vida' : 'consumiveis.mana', { valor });
  }
  const nome = item.nome.replace(/^Pergaminho (?:do|da|de) /i, '');
  return nome.charAt(0).toLocaleUpperCase('pt-BR') + nome.slice(1);
}

export interface BarraConsumiveis {
  readonly elemento: HTMLElement;
  atualizar: (jogador: Entidade | undefined) => void;
}

export function criarBarraConsumiveis(ctx: ContextoSimulacao, emitir: (c: Comando) => void, toque: boolean): BarraConsumiveis {
  const elemento = document.createElement('ul');
  elemento.className = 'barra-consumiveis';
  elemento.setAttribute('aria-label', t('consumiveis.rotulo'));
  let ultimo = '';

  const atualizar = (j: Entidade | undefined) => {
    const lista = (j?.bolsa?.mochila ?? []).filter((i) => ctx.conteudo.itens.get(i.itemId)?.tipo === 'consumivel');
    const chave = lista.map((i) => `${i.invId}:${i.itemId}:${i.qtd}`).join(',') + `:${j?.hpMax}:${j?.manaMax}`;
    if (chave === ultimo) return;
    ultimo = chave;
    elemento.textContent = '';
    lista.forEach((entrada, n) => {
      const item = ctx.conteudo.itens.get(entrada.itemId);
      if (!item) return;
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'botao-consumivel';
      b.dataset.item = item.id;
      const tecla = !toque && n < ATALHOS_DE_CONSUMIVEL ? TECLAS[n] : undefined;
      const rotulo = tecla ? t('consumiveis.usarComTecla', { nome: item.nome, tecla }) : t('consumiveis.usar', { nome: item.nome });
      b.title = rotulo;
      b.setAttribute('aria-label', rotulo);
      b.append(icone(item.icone));
      if (j) {
        const nome = document.createElement('span');
        nome.className = 'nome';
        nome.textContent = nomeCurtoConsumivel(item, j);
        b.append(nome);
      }
      if (entrada.qtd > 1) {
        const q = document.createElement('span');
        q.className = 'qtd';
        q.textContent = `×${entrada.qtd}`;
        b.append(q);
      }
      if (tecla) {
        const k = document.createElement('span');
        k.className = 'tecla';
        k.textContent = tecla;
        b.append(k);
      }
      b.addEventListener('click', () => {
        emitir({ t: 'usarItem', invId: entrada.invId });
        b.blur();
      });
      li.append(b);
      elemento.append(li);
    });
  };
  return { elemento, atualizar };
}
