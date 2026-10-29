// Escolha de classe ao criar o personagem (D-057, D-059). Marco 14 (14/10/2026).
// Aparece no jogo novo de um slot vazio; escolher leva ao mesmo endereço com `&classe=<id>`. A classe não muda depois.
// Marco 26 (28/10/2026, D-116): deixa de ser cartão. Cada classe é uma coluna sem moldura: a runa no topo, o nome, o
// retrato (o desenho do jogo com a arma da classe), o estilo de jogo, uma linha de lore e "Ver mais" (a lore inteira
// e as skills iniciais). No celular, as colunas viram uma faixa que rola na horizontal.

import type { Conteudo } from '../core/conteudo';
import { t, type ChaveTexto } from '../i18n';
import { mioloDoRetrato } from '../render/retrato';
import { svgDaRuna } from './runa-dom';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

/** A primeira frase do texto (até o primeiro ponto seguido de espaço), para a linha de lore. */
export function primeiraFrase(texto: string): string {
  const fim = texto.search(/[.!?](\s|$)/);
  return fim < 0 ? texto : texto.slice(0, fim + 1);
}

/** O retrato como `<img>` de SVG (sem innerHTML: o SVG vem só de constantes do código). */
function retrato(modelo: string, nome: string): HTMLElement | null {
  const miolo = mioloDoRetrato(modelo);
  if (!miolo) return null;
  const img = el('img', 'retrato-classe');
  img.alt = '';
  img.width = 128;
  img.height = 128;
  img.decoding = 'async';
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${miolo}</svg>`)}`;
  img.dataset.retrato = nome;
  return img;
}

/** `base`: o endereço do jogo novo (com slot e fase); cada classe acrescenta `&classe=<id>`. */
export function mostrarEscolhaDeClasse(raiz: HTMLElement, conteudo: Conteudo, base: string): void {
  raiz.textContent = '';
  const tela = el('section', 'tela-menu escolha-classe');
  tela.setAttribute('aria-labelledby', 'titulo-escolha-classe');
  const titulo = el('h1', undefined, t('escolhaClasse.titulo'));
  titulo.id = 'titulo-escolha-classe';
  tela.append(titulo, el('p', 'aviso-classe', t('escolhaClasse.aviso')));
  const faixa = el('div', 'colunas-classe');
  for (const c of conteudo.classes.values()) {
    const coluna = el('article', 'classe-coluna');
    coluna.dataset.classe = c.id;
    const runa = svgDaRuna(c.id, 48);
    if (runa) coluna.append(runa);
    coluna.append(el('h2', undefined, c.nome));
    const foto = retrato(c.modelo, c.id);
    if (foto) coluna.append(foto);
    coluna.append(el('p', 'estilo-classe', t(`classe.${c.id}.estilo` as ChaveTexto)));
    const lore = c.descricao ? t(c.descricao as ChaveTexto) : '';
    if (lore) coluna.append(el('p', 'lore-classe', primeiraFrase(lore)));
    const mais = el('details', 'mais-classe');
    mais.append(el('summary', undefined, t('escolhaClasse.verMais')));
    if (lore) mais.append(el('p', 'lore-classe', lore));
    const iniciais = c.habilidades.map((id) => conteudo.habilidades.get(id)?.nome ?? id);
    mais.append(el('p', 'detalhe-classe', t('escolhaClasse.iniciais', { lista: iniciais.join(', ') })));
    coluna.append(mais);
    const escolher = el('a', 'botao-menu', t('escolhaClasse.escolher', { nome: c.nome }));
    escolher.href = `${base}&classe=${encodeURIComponent(c.id)}`;
    coluna.append(escolher);
    faixa.append(coluna);
  }
  tela.append(faixa);
  const voltar = el('a', 'botao-menu secundario', t('slots.voltar'));
  voltar.href = './?jogo=campanha';
  tela.append(voltar);
  raiz.append(tela);
}
