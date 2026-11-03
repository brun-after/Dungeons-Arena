// Escolha de classe ao criar o personagem (D-057, D-059). Marco 14 (14/10/2026).
// Aparece no jogo novo de um slot vazio; escolher leva ao mesmo endereço com `&classe=<id>`. A classe não muda depois.
import type { Conteudo } from '../core/conteudo';
import { t } from '../i18n';
import { painelPersonagem } from './retrato-personagem';
import { svgDaRuna } from './runa-dom';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

/** `base`: o endereço do jogo novo (com slot e fase); cada classe acrescenta `&classe=<id>`. */
export function mostrarEscolhaDeClasse(raiz: HTMLElement, conteudo: Conteudo, base: string): void {
  raiz.textContent = '';
  const tela = el('section', 'tela-menu escolha-classe');
  tela.setAttribute('aria-labelledby', 'titulo-escolha-classe');
  const titulo = el('h1', undefined, t('escolhaClasse.titulo'));
  titulo.id = 'titulo-escolha-classe';
  const voltar = el('a', 'link-menu voltar-selecao', t('menu.voltar'));
  voltar.href = './';
  tela.append(voltar, titulo, el('p', 'aviso-classe', t('escolhaClasse.aviso')));
  const faixa = el('div', 'colunas-classe');
  for (const c of conteudo.classes.values()) {
    const coluna = el('article', 'classe-coluna');
    coluna.dataset.classe = c.id;
    const runa = svgDaRuna(c.id, 48);
    if (runa) coluna.append(runa);
    coluna.append(el('h2', undefined, c.nome));
    coluna.append(painelPersonagem(c.id));
    const escolher = el('a', 'botao-menu', t('escolhaClasse.escolher', { nome: c.nome }));
    escolher.href = `${base}&classe=${encodeURIComponent(c.id)}`;
    coluna.append(escolher);
    faixa.append(coluna);
  }
  tela.append(faixa);
  raiz.append(tela);
}
