// Gerador de criaturas bípedes (§2.16, modelos de criatura). Marco 13 (14/10/2026), D-058.
// Um conjunto de proporções e acessórios vira as duas vistas: 3/4 em pé (pés em (32, 60)) e de cima
// (centro em (32, 32), olhando para +x). O sombreamento é o escurecimento paramétrico da cor base.

import { circulo, clarear, elipse, escurecer, linha, MEIO, olhos, PES_Y, poligono, retangulo, type Vista } from './svg.ts';

export type Arma = 'espada' | 'cajado' | 'clava' | 'adaga' | 'machado' | 'foice';

export interface OpcoesBipede {
  /** Pele ou corpo. */
  pele: number;
  /** Roupa do tronco. */
  roupa: number;
  olho: number;
  /** Proporções em unidades do quadro de 64. */
  perna: number;
  tronco: number;
  ombro: number;
  quadril: number;
  cabeca: number;
  /** Veste longa no lugar das pernas (cultista, sombra): a bainha que balança no estilo `deslizar`. */
  veste?: boolean;
  orelhas?: boolean;
  chifres?: number;
  capuz?: number;
  presas?: boolean;
  costelas?: boolean;
  capa?: number;
  asas?: number;
  cauda?: number;
  chapeu?: number;
  escudo?: number;
  arma?: Arma;
  /** Elevação do corpo acima do chão (quem flutua). */
  elevacao?: number;
}

function arma34(tipo: Arma, x: number, y: number): string {
  switch (tipo) {
    case 'espada':
      return linha([x, y + 2, x, y - 17], 0xd5dbe3, 2.6) + retangulo(x - 3.5, y - 1, 7, 2.2, 0x8a6d3b, 0.8, false);
    case 'adaga':
      return linha([x, y + 1, x + 1, y - 8], 0xd5dbe3, 2.2);
    case 'cajado':
      return linha([x, y + 9, x, y - 26], 0x7a5230, 2.4) + circulo(x, y - 27, 3.4, 0x9b59b6);
    case 'clava':
      return linha([x, y + 2, x + 2, y - 14], 0x6e4b2a, 3.2) + elipse(x + 2.5, y - 15, 3.6, 4.6, 0x5a3d22);
    case 'machado':
      return linha([x, y + 3, x, y - 16], 0x6e4b2a, 2.6) + poligono([x, y - 16, x + 7, y - 19, x + 7, y - 9, x, y - 12], 0xbdc3c7);
    case 'foice':
      return linha([x, y + 9, x, y - 24], 0x4a3a2a, 2.2) + poligono([x, y - 24, x + 11, y - 22, x + 3, y - 20], 0xbdc3c7);
  }
}

/** Vista 3/4 em pé. `quadro` 1 é o passo (braços e pernas trocados), para as classes jogáveis. */
export function bipede34(o: OpcoesBipede, quadro: number): string {
  const passo = quadro === 1 ? 1 : 0;
  const base = PES_Y - (o.elevacao ?? 0);
  const quadrilY = base - o.perna;
  const ombroY = quadrilY - o.tronco;
  const cabecaY = ombroY - o.cabeca * 0.8;
  const sombra = escurecer(o.roupa, 0.32);
  const partes: string[] = [];

  // Atrás do corpo: asas, cauda e capa.
  if (o.asas !== undefined) {
    const a = o.asas;
    partes.push(poligono([MEIO - 3, ombroY + 2, MEIO - 22, ombroY - 12, MEIO - 18, ombroY + 4, MEIO - 24, ombroY + 10, MEIO - 4, ombroY + 9], a));
    partes.push(poligono([MEIO + 3, ombroY + 2, MEIO + 22, ombroY - 12, MEIO + 18, ombroY + 4, MEIO + 24, ombroY + 10, MEIO + 4, ombroY + 9], escurecer(a, 0.25)));
  }
  if (o.cauda !== undefined) partes.push(linha([MEIO + 3, quadrilY, MEIO + 14, quadrilY + 4, MEIO + 17, quadrilY - 4], o.cauda, 2.4));
  if (o.capa !== undefined) {
    partes.push(poligono([MEIO - o.ombro - 1, ombroY, MEIO + o.ombro + 1, ombroY, MEIO + o.ombro + 6, base - 3, MEIO - o.ombro - 6, base - 3], escurecer(o.capa, 0.15)));
  }

  // Pernas ou veste.
  if (o.veste) {
    partes.push(poligono([MEIO - o.quadril, quadrilY - 2, MEIO + o.quadril, quadrilY - 2, MEIO + o.quadril + 6, base, MEIO - o.quadril - 6, base], o.roupa));
    partes.push(poligono([MEIO + 1, quadrilY - 2, MEIO + o.quadril, quadrilY - 2, MEIO + o.quadril + 6, base, MEIO + 3, base], sombra, false));
  } else {
    const perna = escurecer(o.roupa, 0.45);
    const lx = MEIO - o.quadril + 1 - passo * 1.5;
    const rx = MEIO + o.quadril - 5 + passo * 1.5;
    partes.push(retangulo(lx, quadrilY - 1, 4.5, o.perna + 1 - passo, perna));
    partes.push(retangulo(rx, quadrilY - 1, 4.5, o.perna + 1, escurecer(perna, 0.2)));
    partes.push(elipse(lx + 2, base - 0.8, 3.4, 1.8, escurecer(perna, 0.4)));
    partes.push(elipse(rx + 2.5, base - 0.8, 3.4, 1.8, escurecer(perna, 0.5)));
  }

  // Tronco com o lado direito na sombra.
  partes.push(poligono([MEIO - o.ombro, ombroY, MEIO + o.ombro, ombroY, MEIO + o.quadril, quadrilY, MEIO - o.quadril, quadrilY], o.roupa));
  partes.push(poligono([MEIO + o.ombro * 0.35, ombroY + 1, MEIO + o.ombro - 0.8, ombroY + 1, MEIO + o.quadril - 0.8, quadrilY - 0.8, MEIO + o.quadril * 0.35, quadrilY - 0.8], sombra, false));
  if (o.costelas) {
    for (let i = 0; i < 3; i++) partes.push(linha([MEIO - o.ombro * 0.6, ombroY + 3 + i * 3.2, MEIO + o.ombro * 0.6, ombroY + 3 + i * 3.2], escurecer(o.roupa, 0.5), 1.2));
  }

  // Braços (balançam em oposição às pernas no quadro do passo) e mãos.
  const bracoA = o.tronco + 3;
  const ex = MEIO - o.ombro - 3.5;
  const dx = MEIO + o.ombro - 1;
  partes.push(retangulo(ex, ombroY, 4.5, bracoA - passo * 2, escurecer(o.roupa, 0.12)));
  partes.push(retangulo(dx, ombroY, 4.5, bracoA, escurecer(o.roupa, 0.38)));
  const maoE = { x: ex + 2.2, y: ombroY + bracoA - passo * 2 };
  const maoD = { x: dx + 2.2, y: ombroY + bracoA };
  partes.push(circulo(maoE.x, maoE.y, 2.2, o.pele));
  if (o.escudo !== undefined) partes.push(elipse(maoE.x - 1, maoE.y - 4, 4.8, 6.2, o.escudo) + circulo(maoE.x - 1, maoE.y - 4, 1.6, clarear(o.escudo, 0.5), false));
  if (o.arma) partes.push(arma34(o.arma, maoD.x, maoD.y));
  partes.push(circulo(maoD.x, maoD.y, 2.2, escurecer(o.pele, 0.15)));

  // Cabeça: orelhas e chifres atrás, rosto, capuz por cima.
  const r = o.cabeca;
  if (o.orelhas) {
    partes.push(poligono([MEIO - r * 0.7, cabecaY - 1, MEIO - r - 6, cabecaY - 5, MEIO - r * 0.8, cabecaY + 3], o.pele));
    partes.push(poligono([MEIO + r * 0.7, cabecaY - 1, MEIO + r + 6, cabecaY - 5, MEIO + r * 0.8, cabecaY + 3], escurecer(o.pele, 0.2)));
  }
  if (o.capuz !== undefined) {
    partes.push(poligono([MEIO - r - 2.5, cabecaY + r, MEIO - r * 0.6, cabecaY - r - 2, MEIO, cabecaY - r - 5, MEIO + r * 0.6, cabecaY - r - 2, MEIO + r + 2.5, cabecaY + r], o.capuz));
    partes.push(elipse(MEIO, cabecaY + 1, r * 0.7, r * 0.75, escurecer(o.capuz, 0.7), false));
    partes.push(olhos(MEIO, cabecaY + 1, r * 0.32, 1.3, o.olho));
  } else {
    partes.push(circulo(MEIO, cabecaY, r, o.pele));
    partes.push(elipse(MEIO + r * 0.45, cabecaY + r * 0.15, r * 0.45, r * 0.75, escurecer(o.pele, 0.22), false));
    partes.push(olhos(MEIO - 0.5, cabecaY + 0.5, r * 0.38, o.costelas ? 1.9 : 1.3, o.costelas ? 0x111111 : o.olho));
    if (o.costelas) partes.push(olhos(MEIO - 0.5, cabecaY + 0.5, r * 0.38, 0.8, o.olho));
    if (o.presas) {
      partes.push(poligono([MEIO - 3, cabecaY + r * 0.55, MEIO - 2, cabecaY + r * 0.55 - 3, MEIO - 1, cabecaY + r * 0.55], 0xf5f0e1, false));
      partes.push(poligono([MEIO + 1, cabecaY + r * 0.55, MEIO + 2, cabecaY + r * 0.55 - 3, MEIO + 3, cabecaY + r * 0.55], 0xf5f0e1, false));
    }
  }
  if (o.chifres !== undefined) {
    partes.push(poligono([MEIO - r * 0.6, cabecaY - r * 0.6, MEIO - r - 3, cabecaY - r - 6, MEIO - r * 0.2, cabecaY - r * 0.9], o.chifres));
    partes.push(poligono([MEIO + r * 0.6, cabecaY - r * 0.6, MEIO + r + 3, cabecaY - r - 6, MEIO + r * 0.2, cabecaY - r * 0.9], escurecer(o.chifres, 0.2)));
  }
  if (o.chapeu !== undefined) {
    partes.push(elipse(MEIO, cabecaY - r * 0.55, r + 6, 2.6, o.chapeu));
    partes.push(poligono([MEIO - r * 0.7, cabecaY - r * 0.55, MEIO, cabecaY - r - 7, MEIO + r * 0.7, cabecaY - r * 0.55], escurecer(o.chapeu, 0.1)));
  }
  return partes.join('');
}

function armaCima(tipo: Arma, x: number, y: number): string {
  const comprimento = tipo === 'cajado' || tipo === 'foice' ? 18 : tipo === 'adaga' ? 7 : 13;
  const cor = tipo === 'cajado' || tipo === 'clava' || tipo === 'foice' ? 0x7a5230 : 0xd5dbe3;
  const ponta = tipo === 'cajado' ? circulo(x + comprimento, y, 2.6, 0x9b59b6) : tipo === 'machado' ? poligono([x + comprimento - 2, y, x + comprimento, y + 5, x + comprimento + 3, y], 0xbdc3c7) : '';
  return linha([x, y, x + comprimento, y], cor, tipo === 'clava' ? 3.2 : 2.4) + ponta;
}

/** Vista de cima: ombros perpendiculares ao olhar (+x), cabeça no centro, mãos à frente. */
export function bipedeCima(o: OpcoesBipede, quadro: number): string {
  const balanco = quadro === 1 ? 2 : 0;
  const c = MEIO;
  const partes: string[] = [];
  if (o.asas !== undefined) {
    partes.push(poligono([c - 2, c - 4, c - 8, c - 22, c + 2, c - 12], o.asas));
    partes.push(poligono([c - 2, c + 4, c - 8, c + 22, c + 2, c + 12], escurecer(o.asas, 0.25)));
  }
  if (o.cauda !== undefined) partes.push(linha([c - 6, c, c - 16, c + 4, c - 20, c - 2], o.cauda, 2.4));
  if (o.capa !== undefined) partes.push(elipse(c - 4, c, o.ombro * 0.75, o.ombro + 3, escurecer(o.capa, 0.15)));
  if (o.veste) partes.push(elipse(c - 1, c, o.ombro * 0.95, o.ombro + 4, escurecer(o.roupa, 0.2)));
  partes.push(elipse(c - 1, c, o.ombro * 0.7 + 1.5, o.ombro + 2.5, o.roupa));
  partes.push(elipse(c - 2.5, c + o.ombro * 0.4, o.ombro * 0.45, o.ombro * 0.6, escurecer(o.roupa, 0.3), false));
  // Mãos à frente, uma de cada lado; o quadro do passo balança as duas em oposição.
  const maoE = { x: c + 5 - balanco, y: c - o.ombro - 1.5 };
  const maoD = { x: c + 5 + balanco, y: c + o.ombro + 1.5 };
  if (o.escudo !== undefined) partes.push(elipse(maoE.x + 2, maoE.y, 2.6, 5.5, o.escudo));
  partes.push(circulo(maoE.x, maoE.y, 2.4, o.pele));
  if (o.arma) partes.push(armaCima(o.arma, maoD.x, maoD.y));
  partes.push(circulo(maoD.x, maoD.y, 2.4, escurecer(o.pele, 0.15)));
  const r = o.cabeca * 0.95;
  if (o.orelhas) {
    partes.push(poligono([c, c - r * 0.6, c - 4, c - r - 5, c + 2, c - r * 0.8], o.pele));
    partes.push(poligono([c, c + r * 0.6, c - 4, c + r + 5, c + 2, c + r * 0.8], escurecer(o.pele, 0.2)));
  }
  if (o.chifres !== undefined) {
    partes.push(poligono([c + 1, c - r * 0.5, c + r + 4, c - r - 2, c + 3, c - r * 0.9], o.chifres));
    partes.push(poligono([c + 1, c + r * 0.5, c + r + 4, c + r + 2, c + 3, c + r * 0.9], escurecer(o.chifres, 0.2)));
  }
  const cabelo = o.capuz ?? (o.chapeu !== undefined ? o.chapeu : o.pele);
  if (o.chapeu !== undefined) partes.push(circulo(c + 1, c, r + 5, o.chapeu));
  partes.push(circulo(c + 1, c, r, cabelo));
  partes.push(elipse(c - 0.5, c + r * 0.3, r * 0.6, r * 0.55, escurecer(cabelo, 0.25), false));
  // Os olhos na borda da frente dizem para onde a criatura olha.
  partes.push(circulo(c + r * 0.65, c - r * 0.35, 1.2, o.olho, false) + circulo(c + r * 0.65, c + r * 0.35, 1.2, o.olho, false));
  // Vista de cima ampliada em torno do centro: ocupa o quadro como a vista em pé.
  return `<g transform="translate(${c} ${c}) scale(1.35) translate(${-c} ${-c})">${partes.join('')}</g>`;
}

export function bipede(o: OpcoesBipede): (vista: Vista, quadro: number) => string {
  return (vista, quadro) => (vista === '34' ? bipede34(o, quadro) : bipedeCima(o, quadro));
}
