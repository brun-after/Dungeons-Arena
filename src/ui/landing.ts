// A landing (25/11/2026, D-205): a porta de entrada na web, com a arte da cidadela, o nome do jogo e os modos. Vem da
// entrega visual da VPS, refeita pelo DOM (textos no dicionário) e sem a conta própria de lá: a conta do jogo segue
// nos slots (Google). "Jogar" leva ao menu (`?jogar=1`); no app Android a landing não aparece (abre direto o menu).

import capa from '../assets/dungeons-portao.webp';
import { t } from '../i18n';
import { ENDERECO_DO_MENU } from './menu';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
};

const link = (href: string, texto: string, classe?: string): HTMLAnchorElement => {
  const a = el('a', classe, texto);
  a.href = href;
  return a;
};

export function mostrarLanding(raiz: HTMLElement): void {
  const pagina = el('main', 'portal-arena');

  const topo = el('header', 'portal-topo');
  const marca = link('./', '', 'portal-marca');
  const icone = el('img');
  icone.src = './icones/icone.svg';
  icone.alt = '';
  icone.width = icone.height = 36;
  marca.append(icone, el('span', undefined, t('app.titulo')));
  const nav = el('nav');
  nav.setAttribute('aria-label', t('landing.navegacao'));
  nav.append(link('#modos', t('landing.modos')), link(ENDERECO_DO_MENU, t('landing.jogar'), 'portal-botao'));
  topo.append(marca, nav);

  const hero = el('section', 'portal-hero');
  hero.setAttribute('aria-labelledby', 'portal-titulo');
  const img = el('img', 'portal-capa');
  img.alt = '';
  img.width = 1672;
  img.height = 941;
  img.setAttribute('fetchpriority', 'high');
  img.src = capa;
  const texto = el('div', 'portal-limite portal-ilustracao-texto');
  const h1 = el('h1');
  h1.id = 'portal-titulo';
  h1.append(t('landing.titulo1'), ' ', el('em', undefined, t('landing.titulo2')));
  const acoes = el('div', 'portal-acoes');
  acoes.append(link(ENDERECO_DO_MENU, t('landing.entrar'), 'portal-botao principal'), link('#modos', t('landing.explorar'), 'portal-botao contorno'));
  texto.append(el('p', 'portal-legenda', t('landing.legenda')), h1, el('p', 'portal-descricao', t('landing.descricao')), acoes);
  hero.append(img, texto);

  const modos = el('section', 'portal-modos portal-limite');
  modos.id = 'modos';
  modos.setAttribute('aria-labelledby', 'portal-titulo-modos');
  const h2 = el('h2', undefined, t('landing.jornada'));
  h2.id = 'portal-titulo-modos';
  const grade = el('div', 'portal-grade');
  const cartoes: [string, Parameters<typeof t>[0], Parameters<typeof t>[0], Parameters<typeof t>[0]][] = [
    ['./?jogo=campanha', 'menu.campanha', 'landing.campanha', 'landing.abrirCampanha'],
    ['./?jogo=mundo', 'menu.mundo', 'landing.mundo', 'landing.abrirMundo'],
    ['./?arena=online', 'menu.arenaOnline', 'landing.arena', 'landing.abrirArena'],
  ];
  for (const [href, nome, descricao, acao] of cartoes) {
    const art = el('article');
    art.append(el('h3', undefined, t(nome)), el('p', undefined, t(descricao)), link(href, t(acao)));
    grade.append(art);
  }
  modos.append(h2, grade);

  const rodape = el('footer', 'portal-rodape portal-limite');
  rodape.append(el('span', undefined, t('app.titulo')), link('./?arena=loopback', t('landing.treino')), link('./?editor', t('menu.editor')));

  pagina.append(topo, hero, modos, rodape);
  raiz.replaceChildren(pagina);
  document.title = t('app.titulo');
}
