// Retrato da classe (marco 26, 28/10/2026, D-116): o mesmo desenho do personagem no jogo (render/modelos, vista 3/4,
// quadro parado), com a arma e a mão secundária da classe, para a tela de seleção. Só monta o SVG a partir das
// constantes do código: nada de texto do jogador entra aqui.

import { adornosDoBipede } from './modelos/adornos';
import { ARMA_DE_CLASSE, MODELOS, OPCOES_JOGAVEIS } from './modelos/index';
import { LADO_QUADRO } from './modelos/svg';

const ehJogavel = (m: string): m is keyof typeof OPCOES_JOGAVEIS => Object.hasOwn(OPCOES_JOGAVEIS, m);

/** O miolo SVG (quadro de 64) do retrato do modelo da classe, ou null se o modelo não for jogável. */
export function mioloDoRetrato(modelo: string): string | null {
  if (!ehJogavel(modelo)) return null;
  const arma = ARMA_DE_CLASSE[modelo];
  const camadas = adornosDoBipede(OPCOES_JOGAVEIS[modelo], '34', {
    arma: arma.arma,
    secundaria: arma.secundaria,
    cabeca: null,
    corpo: null,
    capa: null,
    corElemento: null,
    forma: null,
    formaMaxima: null,
  });
  const sombra = `<ellipse cx="${LADO_QUADRO / 2}" cy="60" rx="15" ry="3.5" fill="#000" fill-opacity="0.35"/>`;
  return sombra + camadas.atras + MODELOS[modelo].desenhar('34', 0) + camadas.frente + camadas.secundaria + camadas.arma;
}
