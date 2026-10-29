// Seletor rápido da barra de habilidades (ajuste de 16/10/2026, D-067): o clique direito (PC) ou o toque longo
// (celular) num botão da barra, ou o botão "+" de uma tecla livre, abre esta lista com as habilidades ativas
// conhecidas. Escolher uma põe na tecla (o núcleo troca de lugar se ela já estava em outra); "Tirar" esvazia a tecla.

import { t } from '../i18n';
import { icone } from './icones';
import { comRuna } from './runa-dom';

export interface OpcaoSeletor {
  id: string;
  nome: string;
  icone: string;
  /** Marco 26 (28/10/2026, D-116): a classe da skill de classe (leva a runa), ou null. */
  classe?: string | null;
}

export interface SeletorBarra {
  abrir: (slot: number, atual: string | null, opcoes: readonly OpcaoSeletor[], ancora: HTMLElement) => void;
  fechar: () => void;
  aberto: () => boolean;
}

export function criarSeletorBarra(raiz: HTMLElement, aoEscolher: (slot: number, id: string | null) => void): SeletorBarra {
  const caixa = document.createElement('div');
  caixa.className = 'seletor-barra';
  caixa.setAttribute('role', 'menu');
  caixa.hidden = true;
  raiz.append(caixa);

  const fechar = () => {
    caixa.hidden = true;
    caixa.textContent = '';
    document.removeEventListener('pointerdown', foraDaCaixa, true);
    document.removeEventListener('keydown', aoTecla, true);
  };
  const foraDaCaixa = (ev: PointerEvent) => {
    if (!caixa.contains(ev.target as Node)) fechar();
  };
  const aoTecla = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.stopPropagation();
      fechar();
    }
  };

  const opcao = (texto: string, idIcone: string, chave: string, marcado: boolean, aoClicar: () => void, classe: string | null = null) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opcao-seletor';
    b.setAttribute('role', 'menuitemradio');
    b.setAttribute('aria-checked', String(marcado));
    b.dataset.chave = chave;
    b.append(icone(idIcone));
    const nome = document.createElement('span');
    nome.textContent = texto;
    b.append(comRuna(nome, classe, 12));
    b.addEventListener('click', () => {
      aoClicar();
      fechar();
    });
    return b;
  };

  const abrir: SeletorBarra['abrir'] = (slot, atual, opcoes, ancora) => {
    fechar();
    const titulo = document.createElement('p');
    titulo.className = 'titulo-seletor';
    titulo.textContent = t('habilidades.escolherNaBarra', { n: slot + 1 });
    caixa.append(titulo);
    for (const o of opcoes) caixa.append(opcao(o.nome, o.icone, `barra-${o.id}`, o.id === atual, () => { aoEscolher(slot, o.id); }, o.classe ?? null));
    if (atual) caixa.append(opcao(t('habilidades.tirarDaTecla', { n: slot + 1 }), 'fechar', 'barra-tirar', false, () => { aoEscolher(slot, null); }));
    caixa.hidden = false;
    // Acima do botão, sem sair da tela.
    const r = ancora.getBoundingClientRect();
    const base = raiz.getBoundingClientRect();
    const largura = caixa.offsetWidth;
    const esquerda = Math.min(Math.max(8, r.left + r.width / 2 - largura / 2 - base.left), base.width - largura - 8);
    caixa.style.left = `${esquerda}px`;
    caixa.style.bottom = `${Math.max(8, base.bottom - r.top + 8)}px`;
    (caixa.querySelector<HTMLButtonElement>('[aria-checked="true"]') ?? caixa.querySelector<HTMLButtonElement>('.opcao-seletor'))?.focus();
    document.addEventListener('pointerdown', foraDaCaixa, true);
    document.addEventListener('keydown', aoTecla, true);
  };

  return { abrir, fechar, aberto: () => !caixa.hidden };
}
