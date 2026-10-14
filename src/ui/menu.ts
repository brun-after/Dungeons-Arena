// Menu inicial (§2.15): campanha, arena online e treino de arena (loopback). Links simples, para
// funcionar com teclado, toque e leitores de tela, e para cada modo ter um endereço próprio.

import { t } from '../i18n';

export function mostrarMenu(raiz: HTMLElement): void {
  raiz.textContent = '';
  const tela = document.createElement('section');
  tela.className = 'tela-menu';
  tela.setAttribute('aria-labelledby', 'titulo-menu');
  const titulo = document.createElement('h1');
  titulo.id = 'titulo-menu';
  titulo.textContent = t('app.titulo');
  const subtitulo = document.createElement('p');
  subtitulo.className = 'subtitulo-menu';
  subtitulo.textContent = t('menu.subtitulo');
  tela.append(titulo, subtitulo);

  const opcoes: [string, string][] = [
    ['./?jogo=campanha', t('menu.campanha')],
    ['./?arena=online', t('menu.arenaOnline')],
    ['./?arena=loopback', t('menu.treino')],
    ['./?editor', t('menu.editor')],
  ];
  for (const [href, rotulo] of opcoes) {
    const a = document.createElement('a');
    a.className = 'botao-menu';
    a.href = href;
    a.textContent = rotulo;
    tela.append(a);
  }
  // Marco 7A: entrada discreta para quem foi convidado a testar.
  const pesquisa = document.createElement('a');
  pesquisa.className = 'link-menu';
  pesquisa.href = './?pesquisa=1';
  pesquisa.textContent = t('menu.pesquisa');
  tela.append(pesquisa);
  raiz.append(tela);
}
