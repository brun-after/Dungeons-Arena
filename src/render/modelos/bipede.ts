// Gerador de criaturas bípedes (§2.16, modelos de criatura). Marco 13 (14/10/2026), D-058.
// Um conjunto de proporções e acessórios vira as duas vistas: 3/4 em pé (pés em (32, 60)) e de cima
// (centro em (32, 32), olhando para +x). O sombreamento é o escurecimento paramétrico da cor base.

import { angulosDoQuadro, BALANCO, cantosDoMembro, pontaDoMembro, QUADRO_GOLPE } from './membros.ts';
import { circulo, clarear, elipse, escurecer, hex, linha, MEIO, olhos, PES_Y, poligono, retangulo, type Vista } from './svg.ts';

export type Arma = 'espada' | 'cajado' | 'clava' | 'adaga' | 'machado' | 'foice' | 'arco' | 'lanca';

/** Arco (marco 14, arqueiro): a madeira em curva e a corda reta. */
function arco(x: 'cima' | '34', cx: number, cy: number): string {
  if (x === '34') {
    return `<path d="M ${cx} ${cy - 14} Q ${cx + 8} ${cy - 4} ${cx} ${cy + 6}" fill="none" stroke="${hex(0x7a5230)}" stroke-width="2.4" stroke-linecap="round"/>` + linha([cx, cy - 14, cx, cy + 6], 0xe5e1d8, 0.8);
  }
  return `<path d="M ${cx + 2} ${cy - 9} Q ${cx + 10} ${cy} ${cx + 2} ${cy + 9}" fill="none" stroke="${hex(0x7a5230)}" stroke-width="2.4" stroke-linecap="round"/>` + linha([cx + 2, cy - 9, cx + 2, cy + 9], 0xe5e1d8, 0.8);
}

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

export function arma34(tipo: Arma, x: number, y: number): string {
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
    case 'arco':
      return arco('34', x, y - 4);
    case 'lanca':
      return linha([x, y + 10, x, y - 26], 0x7a5230, 2.2) + poligono([x - 2.4, y - 25, x, y - 32, x + 2.4, y - 25], 0xd5dbe3);
  }
}

/**
 * Marco 26 (25/10/2026, D-108): as mãos no quadro (vista 3/4 em unidades do quadro de 64; de cima, antes da
 * ampliação de 1,35). Os adornos (arma e mão secundária) seguem a mão: o rig desloca as camadas por esta diferença.
 */
export function maosDoBipede(o: OpcoesBipede, vista: Vista, quadro: number): { e: { x: number; y: number }; d: { x: number; y: number } } {
  if (vista === 'cima') {
    const b = BALANCO[quadro] ?? 0;
    const c = MEIO;
    const frenteD = quadro === QUADRO_GOLPE ? 7 : 3 * b;
    return { e: { x: c + 5 - 3 * b, y: c - o.ombro - 1.5 }, d: { x: c + 5 + frenteD, y: c + o.ombro + 1.5 } };
  }
  const base = PES_Y - (o.elevacao ?? 0);
  const ombroY = base - o.perna - o.tronco;
  const bracoA = o.tronco + 3;
  const a = angulosDoQuadro(quadro);
  const e = pontaDoMembro(MEIO - o.ombro - 3.5 + 2.25, ombroY, bracoA, a.bracoE);
  const d = pontaDoMembro(MEIO + o.ombro - 1 + 2.25, ombroY, bracoA, a.bracoD);
  return { e, d };
}

/**
 * Vista 3/4 em pé. Marco 26 (D-108): os quadros giram pernas (no quadril) e braços (no ombro) — 0 parado, 1–4 a
 * passada, 5 o golpe com o braço da arma estendido (modelos/membros.ts).
 */
export function bipede34(o: OpcoesBipede, quadro: number): string {
  const ang = angulosDoQuadro(quadro);
  const b = BALANCO[quadro] ?? 0;
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

  // Pernas ou veste. A bainha da veste ondula com a passada (a perna por baixo empurra o pano).
  if (o.veste) {
    const onda = 3 * b;
    partes.push(poligono([MEIO - o.quadril, quadrilY - 2, MEIO + o.quadril, quadrilY - 2, MEIO + o.quadril + 6 + onda, base, MEIO - o.quadril - 6 + onda, base], o.roupa));
    partes.push(poligono([MEIO + 1, quadrilY - 2, MEIO + o.quadril, quadrilY - 2, MEIO + o.quadril + 6 + onda, base, MEIO + 3 + onda, base], sombra, false));
  } else {
    const perna = escurecer(o.roupa, 0.45);
    const comprimento = o.perna + 1;
    const pernas = [
      { x: MEIO - o.quadril + 3.25, angulo: ang.pernaE, cor: perna, pe: escurecer(perna, 0.4) },
      { x: MEIO + o.quadril - 2.75, angulo: ang.pernaD, cor: escurecer(perna, 0.2), pe: escurecer(perna, 0.5) },
    ];
    for (const p of pernas) {
      partes.push(poligono(cantosDoMembro(p.x, quadrilY - 1, comprimento, 4.5, p.angulo), p.cor));
      const pe = pontaDoMembro(p.x, quadrilY - 1, comprimento, p.angulo);
      partes.push(elipse(pe.x, pe.y - 0.8, 3.4, 1.8, p.pe));
    }
  }

  // Tronco com o lado direito na sombra.
  partes.push(poligono([MEIO - o.ombro, ombroY, MEIO + o.ombro, ombroY, MEIO + o.quadril, quadrilY, MEIO - o.quadril, quadrilY], o.roupa));
  partes.push(poligono([MEIO + o.ombro * 0.35, ombroY + 1, MEIO + o.ombro - 0.8, ombroY + 1, MEIO + o.quadril - 0.8, quadrilY - 0.8, MEIO + o.quadril * 0.35, quadrilY - 0.8], sombra, false));
  if (o.costelas) {
    for (let i = 0; i < 3; i++) partes.push(linha([MEIO - o.ombro * 0.6, ombroY + 3 + i * 3.2, MEIO + o.ombro * 0.6, ombroY + 3 + i * 3.2], escurecer(o.roupa, 0.5), 1.2));
  }

  // Braços (balançam em oposição às pernas; no golpe, o da arma vai à frente) e mãos.
  const bracoA = o.tronco + 3;
  const ex = MEIO - o.ombro - 3.5 + 2.25;
  const dx = MEIO + o.ombro - 1 + 2.25;
  partes.push(poligono(cantosDoMembro(ex, ombroY, bracoA, 4.5, ang.bracoE), escurecer(o.roupa, 0.12)));
  partes.push(poligono(cantosDoMembro(dx, ombroY, bracoA, 4.5, ang.bracoD), escurecer(o.roupa, 0.38)));
  const { e: maoE, d: maoD } = maosDoBipede(o, '34', quadro);
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

export function armaCima(tipo: Arma, x: number, y: number): string {
  if (tipo === 'arco') return arco('cima', x, y);
  const comprimento = tipo === 'cajado' || tipo === 'foice' || tipo === 'lanca' ? 18 : tipo === 'adaga' ? 7 : 13;
  const cor = tipo === 'cajado' || tipo === 'clava' || tipo === 'foice' || tipo === 'lanca' ? 0x7a5230 : 0xd5dbe3;
  const ponta = tipo === 'cajado' ? circulo(x + comprimento, y, 2.6, 0x9b59b6) : tipo === 'lanca' ? poligono([x + comprimento, y - 2.2, x + comprimento + 6, y, x + comprimento, y + 2.2], 0xd5dbe3) : tipo === 'machado' ? poligono([x + comprimento - 2, y, x + comprimento, y + 5, x + comprimento + 3, y], 0xbdc3c7) : '';
  return linha([x, y, x + comprimento, y], cor, tipo === 'clava' ? 3.2 : 2.4) + ponta;
}

/**
 * Vista de cima: ombros perpendiculares ao olhar (+x), cabeça no centro, mãos à frente. Marco 26 (D-108): na passada,
 * os pés aparecem alternando à frente e atrás e as mãos balançam ao contrário; no golpe, a mão da arma avança.
 */
export function bipedeCima(o: OpcoesBipede, quadro: number): string {
  const b = BALANCO[quadro] ?? 0;
  const c = MEIO;
  const partes: string[] = [];
  if (o.asas !== undefined) {
    partes.push(poligono([c - 2, c - 4, c - 8, c - 22, c + 2, c - 12], o.asas));
    partes.push(poligono([c - 2, c + 4, c - 8, c + 22, c + 2, c + 12], escurecer(o.asas, 0.25)));
  }
  if (o.cauda !== undefined) partes.push(linha([c - 6, c, c - 16, c + 4, c - 20, c - 2], o.cauda, 2.4));
  if (!o.veste) {
    const pe = escurecer(o.roupa, 0.55);
    partes.push(elipse(c + 6 * b, c - o.quadril * 0.7, 3.2, 2.2, pe));
    partes.push(elipse(c - 6 * b, c + o.quadril * 0.7, 3.2, 2.2, pe));
  }
  if (o.capa !== undefined) partes.push(elipse(c - 4, c, o.ombro * 0.75, o.ombro + 3, escurecer(o.capa, 0.15)));
  if (o.veste) partes.push(elipse(c - 1, c, o.ombro * 0.95, o.ombro + 4, escurecer(o.roupa, 0.2)));
  partes.push(elipse(c - 1, c, o.ombro * 0.7 + 1.5, o.ombro + 2.5, o.roupa));
  partes.push(elipse(c - 2.5, c + o.ombro * 0.4, o.ombro * 0.45, o.ombro * 0.6, escurecer(o.roupa, 0.3), false));
  // Mãos à frente, uma de cada lado, balançando em oposição aos pés.
  const { e: maoE, d: maoD } = maosDoBipede(o, 'cima', quadro);
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
