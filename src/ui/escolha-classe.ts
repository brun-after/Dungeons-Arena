// Escolha de classe ao criar o personagem (D-057, D-059). Marco 14 (14/10/2026).
// Aparece no jogo novo de um slot vazio. Cada cartão diz o que a classe é, com que habilidades começa e as
// afinidades (descrição gerada); escolher leva ao mesmo endereço com `&classe=<id>`. A classe não muda depois.

import type { Conteudo } from '../core/conteudo';
import { t, type ChaveTexto } from '../i18n';
import { descreverBonus } from './descrever';

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
  tela.append(titulo, el('p', 'aviso-classe', t('escolhaClasse.aviso')));
  const grade = el('div', 'cartoes-classe');
  for (const c of conteudo.classes.values()) {
    const cartao = el('article', 'cartao-classe');
    cartao.dataset.classe = c.id;
    cartao.append(el('h2', undefined, c.nome));
    if (c.descricao) cartao.append(el('p', undefined, t(c.descricao as ChaveTexto)));
    const iniciais = c.habilidades.map((id) => {
      const h = conteudo.habilidades.get(id);
      return h ? h.nome : id;
    });
    cartao.append(el('p', 'detalhe-classe', t('escolhaClasse.iniciais', { lista: iniciais.join(', ') })));
    const afinidades = c.afinidades.flatMap((a) => descreverBonus(a));
    if (afinidades.length > 0) cartao.append(el('p', 'detalhe-classe', t('escolhaClasse.afinidades', { lista: afinidades.join('; ') })));
    const escolher = el('a', 'botao-menu', t('escolhaClasse.escolher', { nome: c.nome }));
    escolher.href = `${base}&classe=${encodeURIComponent(c.id)}`;
    cartao.append(escolher);
    grade.append(cartao);
  }
  tela.append(grade);
  const voltar = el('a', 'botao-menu secundario', t('slots.voltar'));
  voltar.href = './?jogo=campanha';
  tela.append(voltar);
  raiz.append(tela);
}
