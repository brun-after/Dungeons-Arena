// A escolha de onde renascer no Mundo (marco 53, 22/11/2026, D-203). Morto fora de dungeon (onde fica o túmulo), o
// jogador vê três botões: o acampamento, a vila salva (o último save) e a vila central. A escolha vai ao servidor
// (`renascer`), que a usa quando o personagem levanta; sem escolha, vale o de antes (o acampamento, ou a vila salva).

import type { AcaoDoMundo } from '../mundo/acoes';
import type { LugarDeRenascer } from '../mundo/renascer';
import { t } from '../i18n';

export interface EscolhaDeRenascer {
  /** O jogador morreu: mostra as opções. */
  abrir: () => void;
  /** A cada quadro: vivo de novo, some. */
  atualizar: (morto: boolean) => void;
}

export function criarEscolhaDeRenascer(raiz: HTMLElement, enviar: (a: AcaoDoMundo) => void, nomes: () => { save: string; central: string }): EscolhaDeRenascer {
  const el = document.createElement('div');
  el.className = 'escolha-renascer';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', t('renascer.titulo'));
  el.hidden = true;
  const titulo = document.createElement('strong');
  titulo.textContent = t('renascer.titulo');
  const escolhido = document.createElement('span');
  escolhido.className = 'detalhe-item';
  const botoes = document.createElement('div');
  botoes.className = 'acoes-slot';
  const rotulos = (): Record<LugarDeRenascer, string> => {
    const n = nomes();
    return { acampamento: t('renascer.acampamento'), save: t('renascer.save', { nome: n.save }), central: t('renascer.central', { nome: n.central }) };
  };
  const todos: HTMLButtonElement[] = [];
  for (const onde of ['acampamento', 'save', 'central'] as const) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'botao-menu';
    b.dataset.chave = `renascer-${onde}`;
    b.dataset.onde = onde;
    b.addEventListener('click', () => {
      enviar({ a: 'renascer', onde });
      for (const x of todos) x.setAttribute('aria-pressed', String(x === b));
      escolhido.textContent = t('renascer.escolhido', { nome: b.textContent });
    });
    todos.push(b);
    botoes.append(b);
  }
  el.append(titulo, botoes, escolhido);
  raiz.append(el);
  let aberto = false;
  return {
    abrir: () => {
      aberto = true;
      el.hidden = false;
      escolhido.textContent = t('renascer.padrao');
      const r = rotulos();
      for (const x of todos) {
        x.setAttribute('aria-pressed', 'false');
        x.textContent = r[x.dataset.onde as LugarDeRenascer];
      }
    },
    atualizar: (morto) => {
      if (aberto && !morto) {
        aberto = false;
        el.hidden = true;
      }
    },
  };
}
