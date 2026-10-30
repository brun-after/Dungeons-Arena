// Menu inicial (§2.15): campanha, arena online e treino de arena (loopback). Links simples, para
// funcionar com teclado, toque e leitores de tela, e para cada modo ter um endereço próprio.

import { t } from '../i18n';
import { criarFundoMenu } from './fundo-menu';
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
  // Marco 12: plano de fundo procedural (masmorra com tochas).
  tela.append(criarFundoMenu(), titulo, subtitulo);

  const opcoes: [string, string][] = [
    ['./?jogo=campanha', t('menu.campanha')],
    // Marco 29 (D-128): o Mundo aberto.
    ['./?jogo=mundo', t('menu.mundo')],
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
