// A runa da classe na interface (marco 26, 28/10/2026, D-116): um `<svg>` montado por createElementNS a partir de
// render/runas.ts (constantes do código, nada de texto do jogador). É decorativa (`aria-hidden`): o nome ao lado diz o
// que é. Marca a seleção de classe, os livros que ensinam skills de classe e as próprias skills de classe.

import type { Conteudo } from '../core/conteudo';
import { runaDe, TRACO_RUNA } from '../render/runas';

const SVG = 'http://www.w3.org/2000/svg';

const hex = (cor: number) => `#${cor.toString(16).padStart(6, '0')}`;

/** O `<svg>` da runa (null para classe desconhecida). `px` é o lado em px; a cor padrão é a da classe. */
export function svgDaRuna(classeId: string, px: number, cor?: number): SVGSVGElement | null {
  const runa = runaDe(classeId);
  if (!runa) return null;
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('width', String(px));
  svg.setAttribute('height', String(px));
  svg.setAttribute('class', 'runa-classe');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.dataset.runa = classeId;
  const g = document.createElementNS(SVG, 'g');
  const tinta = hex(cor ?? runa.cor);
  g.setAttribute('fill', 'none');
  g.setAttribute('stroke', tinta);
  g.setAttribute('stroke-width', String(TRACO_RUNA));
  g.setAttribute('stroke-linecap', 'round');
  g.setAttribute('stroke-linejoin', 'round');
  for (const tr of runa.tracos) {
    if (tr.t === 'circulo') {
      const c = document.createElementNS(SVG, 'circle');
      c.setAttribute('cx', String(tr.x));
      c.setAttribute('cy', String(tr.y));
      c.setAttribute('r', String(tr.r));
      if (tr.cheio) c.setAttribute('fill', tinta);
      g.append(c);
      continue;
    }
    const p = document.createElementNS(SVG, 'path');
    if (tr.t === 'curva') p.setAttribute('d', `M${tr.de[0]} ${tr.de[1]}Q${tr.controle[0]} ${tr.controle[1]} ${tr.ate[0]} ${tr.ate[1]}`);
    else {
      const pares: string[] = [];
      for (let i = 0; i + 1 < tr.p.length; i += 2) pares.push(`${i === 0 ? 'M' : 'L'}${tr.p[i] ?? 0} ${tr.p[i + 1] ?? 0}`);
      p.setAttribute('d', pares.join('') + (tr.fechar ? 'Z' : ''));
    }
    g.append(p);
  }
  svg.append(g);
  return svg;
}

/** A classe dona de uma skill exclusiva (pelas `exclusivas` de classes.json), ou null. */
export function classeDaHabilidade(conteudo: Pick<Conteudo, 'classes'>, habilidadeId: string): string | null {
  for (const c of conteudo.classes.values()) if (c.exclusivas.includes(habilidadeId)) return c.id;
  return null;
}

/** A classe do livro que ensina uma skill de classe, ou null. */
export function classeDoItem(conteudo: Pick<Conteudo, 'classes' | 'itens'>, itemId: string): string | null {
  const item = conteudo.itens.get(itemId);
  return item?.tipo === 'livro' && item.ensina ? classeDaHabilidade(conteudo, item.ensina) : null;
}

/** Prefixa a runa (pequena) num elemento de texto, quando a skill ou o livro é de uma classe. */
export function comRuna(el: HTMLElement, classeId: string | null, px = 14): HTMLElement {
  const runa = classeId ? svgDaRuna(classeId, px) : null;
  if (runa) el.prepend(runa);
  return el;
}
