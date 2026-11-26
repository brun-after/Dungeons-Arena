// Menu inicial (§2.15): campanha, arena online e treino de arena (loopback). Links simples, para
// funcionar com teclado, toque e leitores de tela, e para cada modo ter um endereço próprio.
// 25/11/2026 (D-205): o menu da cidadela (entrega visual da VPS): a arte do portão ao fundo e cada modo num cartão de
// madeira com ícone e uma linha do que é. Na web ele fica em `?jogar=1` (a raiz é a landing); no app, na raiz.

import capa from '../assets/dungeons-portao.webp';
import { t, type ChaveTexto } from '../i18n';
import { icone } from './icones';
import { criarCampoServidor } from './servidor-menu';
import { baixarAtualizacao, procurarAtualizacao, versaoDoApp, type VersaoPublicada } from '../plataforma/atualizacao';
import { ehAppNativo } from '../plataforma/nativo';

/** Faixa no topo do menu: versão nova disponível, com o botão que baixa o APK. */
function criarAvisoDeAtualizacao(nova: VersaoPublicada): HTMLElement {
  const aviso = document.createElement('div');
  aviso.className = 'aviso-atualizacao';
  aviso.setAttribute('role', 'status');
  const texto = document.createElement('p');
  texto.textContent = t('atualizacao.disponivel', { versao: `1.0.${nova.versao}` });
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao-menu';
  botao.textContent = t('atualizacao.baixar');
  botao.addEventListener('click', () => {
    void baixarAtualizacao(nova.urlApk).catch(() => undefined);
  });
  const dica = document.createElement('p');
  dica.className = 'dica-atualizacao';
  dica.textContent = t('atualizacao.dica');
  aviso.append(texto, botao, dica);
  return aviso;
}

/** Onde fica o menu (a raiz da web é a landing, D-205); os "Voltar ao menu" levam aqui. */
export const ENDERECO_DO_MENU = './?jogar=1';

export function mostrarMenu(raiz: HTMLElement): void {
  raiz.textContent = '';
  const tela = document.createElement('section');
  tela.className = 'tela-menu menu-cidadela';
  tela.style.setProperty('--capa-menu', `url("${capa}")`);
  tela.setAttribute('aria-labelledby', 'titulo-menu');
  const titulo = document.createElement('h1');
  titulo.id = 'titulo-menu';
  titulo.textContent = t('app.titulo');
  const subtitulo = document.createElement('p');
  subtitulo.className = 'subtitulo-menu';
  subtitulo.textContent = t('menu.subtitulo');
  tela.append(titulo, subtitulo);

  // [endereço, nome, a linha do que é, ícone]
  const opcoes: [string, ChaveTexto, ChaveTexto, string][] = [
    ['./?jogo=campanha', 'menu.campanha', 'menu.descricao.campanha', 'livro'],
    // Marco 29 (D-128): o Mundo aberto.
    ['./?jogo=mundo', 'menu.mundo', 'menu.descricao.mundo', 'mapa'],
    ['./?arena=online', 'menu.arenaOnline', 'menu.descricao.arena', 'espada'],
    ['./?arena=loopback', 'menu.treino', 'menu.descricao.treino', 'alvo'],
    ['./?editor', 'menu.editor', 'menu.descricao.editor', 'martelo'],
  ];
  const grade = document.createElement('nav');
  grade.className = 'opcoes-cidadela';
  grade.setAttribute('aria-label', t('menu.modos'));
  for (const [href, rotulo, descricao, simbolo] of opcoes) {
    const a = document.createElement('a');
    a.className = 'botao-menu';
    a.href = href;
    a.setAttribute('aria-label', t(rotulo));
    const nome = document.createElement('strong');
    nome.textContent = t(rotulo);
    const detalhe = document.createElement('small');
    detalhe.textContent = t(descricao);
    a.append(icone(simbolo), nome, detalhe);
    grade.append(a);
  }
  tela.append(grade);
  // Marco 7A: entrada discreta para quem foi convidado a testar.
  const pesquisa = document.createElement('a');
  pesquisa.className = 'link-menu';
  pesquisa.href = './?pesquisa=1';
  pesquisa.textContent = t('menu.pesquisa');
  tela.append(pesquisa);
  // Marco 20: servidor da rede local escolhido neste aparelho (o app Android não tem barra de endereço).
  tela.append(criarCampoServidor());
  // Marco 21 (D-088): no app, a versão instalada e o aviso quando há APK mais novo.
  const versao = versaoDoApp();
  if (ehAppNativo() && versao > 0) {
    const rotulo = document.createElement('p');
    rotulo.className = 'versao-app';
    rotulo.textContent = t('app.versao', { versao: `1.0.${versao}` });
    tela.append(rotulo);
  }
  void procurarAtualizacao().then((nova) => {
    if (nova) tela.prepend(criarAvisoDeAtualizacao(nova));
  });
  raiz.append(tela);
}
