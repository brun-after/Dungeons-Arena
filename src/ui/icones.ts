// Ícones na interface (ajuste de 16/10/2026, D-067): monta o SVG de um ícone do conjunto (data/icones.ts). A cor vem
// do texto (`currentColor`), o tamanho do CSS (1em por padrão). Os desenhos são constantes do código, não entrada do
// jogador; mesmo assim o id é conferido e um id desconhecido vira o ícone genérico.

import { ehIcone, ICONES } from '../data/icones';

export { svgDoIcone } from '../data/icones';

const SVG = 'http://www.w3.org/2000/svg';

/** O miolo SVG de um ícone; desconhecido usa `circulo`. */
export function desenhoDoIcone(id: string): string {
  return ehIcone(id) ? ICONES[id] : ICONES.circulo;
}

/** Um `<svg>` pronto para a interface (decorativo: quem usa dá o rótulo ao botão). */
export function icone(id: string, classe = 'icone'): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', classe);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  // Constante do código (data/icones.ts), não texto de usuário.
  svg.innerHTML = desenhoDoIcone(id).replace(/class="F"/g, 'fill="currentColor"');
  return svg;
}

/** Um botão só com ícone (o rótulo vai em `aria-label` e `title`). */
export function comIcone(el: HTMLElement, id: string, texto?: string): HTMLElement {
  el.textContent = '';
  el.append(icone(id));
  if (texto) {
    const s = document.createElement('span');
    s.className = 'rotulo-icone';
    s.textContent = texto;
    el.append(s);
  }
  return el;
}
