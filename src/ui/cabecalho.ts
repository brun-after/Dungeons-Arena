// Cabeçalho (§2.15): nome da fase, as barras do jogador e os botões (mochila, registro, pausa e os da
// sessão). Marco 12 (14/10/2026): os atalhos de controle e câmera passaram para as Configurações.

import { t } from '../i18n';

export interface OpcoesCabecalho {
  nomeFase: string;
  /** Elementos sob o nome da fase (barras do jogador). */
  status?: HTMLElement;
  /** Botões à direita. */
  acoesExtras?: HTMLElement[];
}

export function criarCabecalho(opcoes: OpcoesCabecalho): HTMLElement {
  const cabecalho = document.createElement('header');
  cabecalho.className = 'cabecalho';
  cabecalho.setAttribute('aria-label', t('cabecalho.rotulo'));
  const titulo = document.createElement('h1');
  titulo.textContent = opcoes.nomeFase;

  const acoes = document.createElement('div');
  acoes.className = 'acoes-cabecalho';
  acoes.append(...(opcoes.acoesExtras ?? []));
  const esquerda = document.createElement('div');
  esquerda.className = 'titulo-cabecalho';
  esquerda.append(titulo);
  if (opcoes.status) esquerda.append(opcoes.status);
  cabecalho.append(esquerda, acoes);
  return cabecalho;
}
