// As peças dos diálogos do Mundo (marco 30, 30/10/2026, D-129): o diálogo modal, o painel que se redesenha a cada
// aviso novo (o banco, o quadro, o mercado e a troca respondem pelo servidor, e o mesmo diálogo mostra a resposta),
// botões, campos de número e a linha de item. Texto sempre por `textContent` (nada de HTML montado à mão).

import { t } from '../i18n';

export interface Dialogo {
  el: HTMLDialogElement;
  corpo: HTMLElement;
  fechar: () => void;
}

export function dialogo(titulo: string): Dialogo {
  const el = document.createElement('dialog');
  el.className = 'modal';
  const topo = document.createElement('div');
  topo.className = 'modal-topo';
  const h = document.createElement('h2');
  h.textContent = titulo;
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'botao-cabecalho';
  x.textContent = t('mundo.portal.fechar');
  const corpo = document.createElement('div');
  corpo.className = 'modal-corpo';
  topo.append(h, x);
  el.append(topo, corpo);
  const fechar = () => {
    el.close();
    el.remove();
  };
  x.addEventListener('click', fechar);
  el.addEventListener('cancel', fechar);
  document.body.append(el);
  el.showModal();
  return { el, corpo, fechar };
}

export function paragrafo(texto: string, classe = 'vazio-modal'): HTMLParagraphElement {
  const p = document.createElement('p');
  p.className = classe;
  p.textContent = texto;
  return p;
}

export function subtitulo(texto: string): HTMLHeadingElement {
  const h = document.createElement('h3');
  h.className = 'subtitulo-modal';
  h.textContent = texto;
  return h;
}

export function botao(texto: string, fazer: () => void, desligado = false, classe = 'botao-menu'): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = classe;
  b.textContent = texto;
  b.disabled = desligado;
  b.addEventListener('click', fazer);
  return b;
}

export function linhaDeAcoes(...filhos: HTMLElement[]): HTMLDivElement {
  const d = document.createElement('div');
  d.className = 'acoes-slot';
  d.append(...filhos);
  return d;
}

/** Um campo de número com rótulo; `valor()` lê o número dentro dos limites. */
export function campoNumero(rotulo: string, inicial: number, min: number, max: number): { el: HTMLLabelElement; valor: () => number } {
  const el = document.createElement('label');
  el.className = 'campo-mundo';
  el.textContent = rotulo;
  const input = document.createElement('input');
  input.type = 'number';
  input.min = String(min);
  input.max = String(max);
  input.step = '1';
  input.value = String(inicial);
  el.append(input);
  return { el, valor: () => Math.min(max, Math.max(min, Math.floor(Number(input.value) || 0))) };
}

/** Um item da lista do diálogo: o texto e as ações à direita. */
export function linhaDeItem(texto: string, ...acoes: HTMLElement[]): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'linha-mundo';
  const s = document.createElement('span');
  s.textContent = texto;
  li.append(s, ...acoes);
  return li;
}

export function lista(classe = 'lista-itens'): HTMLUListElement {
  const ul = document.createElement('ul');
  ul.className = classe;
  return ul;
}

/** O diálogo que fica aberto e se redesenha a cada aviso; fechado, o próximo aviso o abre de novo. */
export interface Painel {
  mostrar(desenhar: (corpo: HTMLElement, fechar: () => void) => void): void;
  fechar(): void;
  aberto(): boolean;
}

/**
 * O aviso da sala chega antes da bolsa privada (que vai no próximo estado transmitido, a 20 Hz): o painel se
 * redesenha mais uma vez depois deste tempo, com a mochila e o ouro já atualizados.
 */
const REDESENHO_MS = 250;

export function painel(titulo: string): Painel {
  let d: Dialogo | null = null;
  let ultimo: ((corpo: HTMLElement, fechar: () => void) => void) | null = null;
  const aberto = () => d?.el.isConnected === true;
  const fechar = () => {
    if (aberto()) d?.fechar();
    d = null;
  };
  const desenharAgora = (desenhar: (corpo: HTMLElement, fechar: () => void) => void) => {
    if (!d) return;
    // O foco volta ao controle de mesma chave depois de redesenhar (quem clicou não perde o lugar).
    const chave = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.chave : undefined;
    d.corpo.textContent = '';
    desenhar(d.corpo, fechar);
    if (chave) d.corpo.querySelector<HTMLElement>(`[data-chave="${CSS.escape(chave)}"]`)?.focus();
  };
  return {
    aberto,
    fechar,
    mostrar: (desenhar) => {
      if (!aberto()) d = dialogo(titulo);
      ultimo = desenhar;
      desenharAgora(desenhar);
      setTimeout(() => {
        if (aberto() && ultimo === desenhar) desenharAgora(desenhar);
      }, REDESENHO_MS);
    },
  };
}

/** Marca o controle para o foco voltar a ele depois de redesenhar. */
export function comChave<T extends HTMLElement>(el: T, chave: string): T {
  el.dataset.chave = chave;
  return el;
}
