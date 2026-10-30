// Os modelos das armas de classe na mão (marco 27, 29/10/2026, D-126). Cada uma das 40 armas (e as de partida) tem o
// seu desenho, nas duas vistas: em pé (3/4, a mão em (x, y), a arma subindo) e de cima (a arma apontando para +x).
// Mesmos traços dos modelos (contorno de 1,6, as cores do aço, da madeira e do couro). A gema, o brilho e a aura da
// forma continuam por conta de modelos/adornos.ts.

import { circulo, elipse, hex, linha, poligono, retangulo } from './svg.ts';

const ACO = 0xd5dbe3;
const ACO_ESCURO = 0xaab4be;
const MADEIRA = 0x7a5230;
const MADEIRA_ESCURA = 0x5a3d22;
const COURO = 0x6e4b2a;
const OSSO = 0xe8e2cf;
const OURO = 0xd4ac0d;

/** O arco: a madeira em curva (`curva` maior = mais aberto) e a corda. */
function arco34(x: number, y: number, alto: number, curva: number, cor: number, ponta = false): string {
  const topo = y - alto;
  const base = y + alto * 0.45;
  const corpo = `<path d="M ${x} ${topo} Q ${x + curva} ${(topo + base) / 2} ${x} ${base}" fill="none" stroke="${hex(cor)}" stroke-width="2.4" stroke-linecap="round"/>`;
  const extra = ponta ? poligono([x - 1.5, topo, x, topo - 3, x + 1.5, topo], OSSO, false) + poligono([x - 1.5, base, x, base + 3, x + 1.5, base], OSSO, false) : '';
  return corpo + linha([x, topo, x, base], 0xe5e1d8, 0.8) + extra;
}

function arcoCima(x: number, y: number, alto: number, curva: number, cor: number): string {
  return `<path d="M ${x + 2} ${y - alto} Q ${x + 2 + curva} ${y} ${x + 2} ${y + alto}" fill="none" stroke="${hex(cor)}" stroke-width="2.4" stroke-linecap="round"/>` + linha([x + 2, y - alto, x + 2, y + alto], 0xe5e1d8, 0.8);
}

/** O livro aberto na mão: a capa, as páginas e o símbolo da capa. */
function livro34(x: number, y: number, capa: number, simbolo: number): string {
  return retangulo(x - 6, y - 12, 12, 9, capa, 1.2) + retangulo(x - 5, y - 11, 4.6, 7, 0xf4ecd8, 0.6, false) + retangulo(x + 0.4, y - 11, 4.6, 7, 0xf4ecd8, 0.6, false) + circulo(x, y - 7.5, 1.4, simbolo, false);
}

function livroCima(x: number, y: number, capa: number, simbolo: number): string {
  return retangulo(x + 2, y - 5, 9, 10, capa, 1.2) + retangulo(x + 3, y - 4, 7, 3.6, 0xf4ecd8, 0.6, false) + circulo(x + 6.5, y + 2, 1.3, simbolo, false);
}

/** O cajado: a haste e a cabeça (`cabeca` desenha o topo em (x, topo)). */
function cajado34(x: number, y: number, haste: number, cabeca: (cx: number, cy: number) => string): string {
  return linha([x, y + 9, x, y - 25], haste, 2.4) + cabeca(x, y - 26);
}

function cajadoCima(x: number, y: number, haste: number, cabeca: (cx: number, cy: number) => string): string {
  return linha([x, y, x + 18, y], haste, 2.4) + cabeca(x + 19, y);
}

/** O bumerangue em V (a mão segura uma das pontas). */
function bumerangue34(x: number, y: number, cor: number, serrilha = false): string {
  const v = poligono([x, y, x + 2, y - 11, x + 9, y - 15, x + 4, y - 9, x + 2.5, y + 1], cor);
  return serrilha ? v + linha([x + 3, y - 12, x + 5, y - 13.5, x + 7, y - 13, x + 8.5, y - 14.5], ACO, 0.9) : v;
}

function bumerangueCima(x: number, y: number, cor: number): string {
  return poligono([x, y, x + 9, y - 2, x + 14, y - 8, x + 10, y - 1, x + 1, y + 2], cor);
}

type Desenho = (x: number, y: number) => string;

const D34: Readonly<Record<string, Desenho>> = {
  // --- Lâminas (Guerreiro)
  montante: (x, y) => linha([x, y + 3, x, y - 24], ACO, 3.2) + retangulo(x - 5, y - 1, 10, 2.4, 0x8a6d3b, 0.8, false) + linha([x, y + 3, x, y + 6], COURO, 2.6),
  sabre: (x, y) => `<path d="M ${x} ${y + 1} Q ${x + 5} ${y - 9} ${x + 2} ${y - 18}" fill="none" stroke="${hex(ACO)}" stroke-width="2.6" stroke-linecap="round"/>` + `<path d="M ${x - 3} ${y} Q ${x} ${y + 3} ${x + 3} ${y}" fill="none" stroke="${hex(OURO)}" stroke-width="1.2"/>`,
  mangual: (x, y) => linha([x, y + 3, x, y - 8], COURO, 2.8) + linha([x, y - 8, x + 3, y - 12, x + 5, y - 15], 0x99a3a4, 1.1) + circulo(x + 6, y - 17, 3.4, 0x5d6d7e) + poligono([x + 6, y - 22, x + 7, y - 20, x + 5, y - 20], ACO_ESCURO, false) + poligono([x + 10.5, y - 17, x + 9, y - 16, x + 9, y - 18], ACO_ESCURO, false),
  rapieira: (x, y) => linha([x, y + 1, x, y - 22], ACO, 1.4) + `<path d="M ${x - 3.5} ${y} A 3.5 3 0 0 0 ${x + 3.5} ${y}" fill="none" stroke="${hex(OURO)}" stroke-width="1.4"/>`,
  // --- Arcos (Arqueiro)
  arco_longo: (x, y) => arco34(x, y - 4, 18, 9, MADEIRA),
  besta: (x, y) => linha([x - 2, y + 2, x + 2, y - 12], MADEIRA, 2.8) + `<path d="M ${x - 7} ${y - 9} Q ${x} ${y - 14} ${x + 9} ${y - 11}" fill="none" stroke="${hex(0x5d4037)}" stroke-width="2.2"/>` + linha([x - 7, y - 9, x + 9, y - 11], 0xe5e1d8, 0.7),
  composto: (x, y) => arco34(x, y - 4, 14, 11, 0x2e4053) + circulo(x + 5, y - 9, 1.2, 0xa9cce3, false),
  arcocurto: (x, y) => arco34(x, y - 4, 10, 8, 0xa04000),
  elfico: (x, y) => arco34(x, y - 4, 16, 10, 0x1e8449) + `<path d="M ${x + 6} ${y - 12} q 3 -2 2 2" fill="none" stroke="${hex(0x82e0aa)}" stroke-width="1"/>`,
  chifre: (x, y) => arco34(x, y - 4, 13, 12, 0xdc7633, true),
  arcoguerra: (x, y) => arco34(x, y - 4, 16, 9, 0x4d5656) + linha([x + 2, y - 12, x + 6, y - 6], 0x922b21, 1.2),
  arcocaca: (x, y) => arco34(x, y - 4, 15, 8, 0x7d6608) + elipse(x + 4, y - 4, 1.4, 2.2, 0xe8e0d0, false),
  // --- Tomos (Mago)
  tomo: (x, y) => livro34(x, y, 0x5b2c6f, 0x9b8cff),
  codice: (x, y) => livro34(x, y, 0x784212, 0xf39c12) + linha([x - 6, y - 12.5, x + 6, y - 12.5], OURO, 0.8),
  mares: (x, y) => livro34(x, y, 0x1f618d, 0x5dade2),
  estelar: (x, y) => livro34(x, y, 0x1b2631, 0xf7dc6f) + circulo(x + 4, y - 13, 1, 0xf7dc6f, false),
  prisma: (x, y) => livro34(x, y, 0x6c3483, 0xbb8fce) + poligono([x - 1.5, y - 13, x, y - 15.5, x + 1.5, y - 13], 0xebdef0, false),
  espelhos: (x, y) => livro34(x, y, 0xaab7b8, 0xf5eef8),
  orbital: (x, y) => livro34(x, y, 0x21618c, 0x85c1e9) + `<circle cx="${x}" cy="${y - 7.5}" r="4" fill="none" stroke="${hex(0x85c1e9)}" stroke-width="0.7"/>`,
  vazio: (x, y) => livro34(x, y, 0x17202a, 0x5b2c6f) + circulo(x, y - 7.5, 2.4, 0x0d0b12, false),
  // --- Cajados (Necromante)
  praga: (x, y) => cajado34(x, y, 0x4d5656, (cx, cy) => circulo(cx, cy, 3.4, 0x7dcea0) + circulo(cx - 1, cy - 1, 1, 0xd5f5e3, false)),
  cova: (x, y) => cajado34(x, y, MADEIRA_ESCURA, (cx, cy) => poligono([cx - 4, cy + 2, cx - 3, cy - 4, cx, cy - 1, cx + 3, cy - 4, cx + 4, cy + 2], OSSO)),
  cetro: (x, y) => linha([x, y + 5, x, y - 18], OURO, 2) + elipse(x, y - 21, 3, 3.8, 0xaed6f1) + circulo(x, y - 21, 1.2, 0xffffff, false),
  sanguineo: (x, y) => cajado34(x, y, 0x641e16, (cx, cy) => elipse(cx, cy, 2.8, 3.8, 0xc0392b) + linha([cx - 4, cy + 4, cx + 4, cy + 4], 0x641e16, 1.4)),
  espectro: (x, y) => cajado34(x, y, 0x85929e, (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="4" fill="${hex(0xd6eaf8)}" fill-opacity="0.65" stroke="#0d0b12" stroke-width="1.6"/>`),
  gadanha: (x, y) => linha([x, y + 9, x, y - 24], MADEIRA_ESCURA, 2.2) + poligono([x, y - 24, x + 13, y - 20, x + 3, y - 19], ACO_ESCURO) + linha([x - 3, y - 4, x + 3, y - 6], MADEIRA_ESCURA, 1.6),
  // --- Arremessáveis (Aventureiro)
  bumerangue: (x, y) => bumerangue34(x, y, 0xc49a6c),
  chakram: (x, y) => `<circle cx="${x + 2}" cy="${y - 8}" r="6" fill="none" stroke="${hex(0xf5b041)}" stroke-width="2.4"/>` + circulo(x + 2, y - 14, 1.2, ACO, false),
  machadinha: (x, y) => linha([x, y + 2, x, y - 10], COURO, 2.4) + poligono([x, y - 10, x + 5.5, y - 12, x + 5.5, y - 5, x, y - 7], ACO),
  shuriken: (x, y) => poligono([x + 2, y - 15, x + 3.5, y - 9.5, x + 9, y - 8, x + 3.5, y - 6.5, x + 2, y - 1, x + 0.5, y - 6.5, x - 5, y - 8, x + 0.5, y - 9.5], 0x85929e) + circulo(x + 2, y - 8, 1, 0x1b2631, false),
  duplo: (x, y) => bumerangue34(x, y, 0xca6f1e) + bumerangue34(x + 3, y - 3, 0xe59866),
  arpeu: (x, y) => linha([x, y + 2, x + 1, y - 10], 0x99a3a4, 1.1) + poligono([x - 3, y - 12, x + 1, y - 16, x + 5, y - 12, x + 1, y - 13.5], ACO_ESCURO) + circulo(x + 1, y - 10, 1.4, ACO, false),
  falcoeiro: (x, y) => bumerangue34(x, y, 0xd68910) + elipse(x + 7, y - 14, 1.2, 2.4, 0xe8e0d0, false),
  serrilhado: (x, y) => bumerangue34(x, y, 0x1e8449, true),
};

const DCIMA: Readonly<Record<string, Desenho>> = {
  montante: (x, y) => linha([x, y, x + 20, y], ACO, 3.2) + linha([x + 2, y - 4, x + 2, y + 4], 0x8a6d3b, 2),
  sabre: (x, y) => `<path d="M ${x} ${y} Q ${x + 8} ${y - 4} ${x + 15} ${y - 2}" fill="none" stroke="${hex(ACO)}" stroke-width="2.6" stroke-linecap="round"/>`,
  mangual: (x, y) => linha([x, y, x + 8, y], COURO, 2.8) + linha([x + 8, y, x + 13, y + 2], 0x99a3a4, 1.1) + circulo(x + 15, y + 2, 3, 0x5d6d7e),
  rapieira: (x, y) => linha([x, y, x + 18, y], ACO, 1.4) + circulo(x + 1, y, 2, OURO, false),
  arco_longo: (x, y) => arcoCima(x, y, 11, 9, MADEIRA),
  besta: (x, y) => linha([x, y, x + 12, y], MADEIRA, 2.8) + `<path d="M ${x + 9} ${y - 7} Q ${x + 13} ${y} ${x + 9} ${y + 7}" fill="none" stroke="${hex(0x5d4037)}" stroke-width="2.2"/>`,
  composto: (x, y) => arcoCima(x, y, 9, 10, 0x2e4053),
  arcocurto: (x, y) => arcoCima(x, y, 7, 7, 0xa04000),
  elfico: (x, y) => arcoCima(x, y, 10, 9, 0x1e8449),
  chifre: (x, y) => arcoCima(x, y, 8, 11, 0xdc7633),
  arcoguerra: (x, y) => arcoCima(x, y, 10, 9, 0x4d5656),
  arcocaca: (x, y) => arcoCima(x, y, 9, 8, 0x7d6608),
  tomo: (x, y) => livroCima(x, y, 0x5b2c6f, 0x9b8cff),
  codice: (x, y) => livroCima(x, y, 0x784212, 0xf39c12),
  mares: (x, y) => livroCima(x, y, 0x1f618d, 0x5dade2),
  estelar: (x, y) => livroCima(x, y, 0x1b2631, 0xf7dc6f),
  prisma: (x, y) => livroCima(x, y, 0x6c3483, 0xbb8fce),
  espelhos: (x, y) => livroCima(x, y, 0xaab7b8, 0xf5eef8),
  orbital: (x, y) => livroCima(x, y, 0x21618c, 0x85c1e9),
  vazio: (x, y) => livroCima(x, y, 0x17202a, 0x5b2c6f),
  praga: (x, y) => cajadoCima(x, y, 0x4d5656, (cx, cy) => circulo(cx, cy, 3, 0x7dcea0)),
  cova: (x, y) => cajadoCima(x, y, MADEIRA_ESCURA, (cx, cy) => poligono([cx - 1, cy - 4, cx + 4, cy - 3, cx + 2, cy, cx + 4, cy + 3, cx - 1, cy + 4], OSSO)),
  cetro: (x, y) => linha([x, y, x + 14, y], OURO, 2) + elipse(x + 17, y, 3.4, 2.8, 0xaed6f1),
  sanguineo: (x, y) => cajadoCima(x, y, 0x641e16, (cx, cy) => elipse(cx, cy, 3.4, 2.6, 0xc0392b)),
  espectro: (x, y) => cajadoCima(x, y, 0x85929e, (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="3.6" fill="${hex(0xd6eaf8)}" fill-opacity="0.65" stroke="#0d0b12" stroke-width="1.6"/>`),
  gadanha: (x, y) => linha([x, y, x + 18, y], MADEIRA_ESCURA, 2.2) + poligono([x + 18, y, x + 15, y + 10, x + 16, y + 2], ACO_ESCURO),
  bumerangue: (x, y) => bumerangueCima(x, y, 0xc49a6c),
  chakram: (x, y) => `<circle cx="${x + 7}" cy="${y}" r="5" fill="none" stroke="${hex(0xf5b041)}" stroke-width="2.2"/>`,
  machadinha: (x, y) => linha([x, y, x + 10, y], COURO, 2.4) + poligono([x + 8, y, x + 11, y + 5, x + 13, y], ACO),
  shuriken: (x, y) => poligono([x + 7, y - 6, x + 8.2, y - 1.2, x + 13, y, x + 8.2, y + 1.2, x + 7, y + 6, x + 5.8, y + 1.2, x + 1, y, x + 5.8, y - 1.2], 0x85929e),
  duplo: (x, y) => bumerangueCima(x, y, 0xca6f1e) + bumerangueCima(x + 2, y + 3, 0xe59866),
  arpeu: (x, y) => linha([x, y, x + 10, y], 0x99a3a4, 1.1) + poligono([x + 10, y - 4, x + 15, y, x + 10, y + 4, x + 12, y], ACO_ESCURO),
  falcoeiro: (x, y) => bumerangueCima(x, y, 0xd68910),
  serrilhado: (x, y) => bumerangueCima(x, y, 0x1e8449),
};

/** Os modelos de arma de classe conhecidos (os de bipede.ts ficam com os desenhos antigos). */
export const MODELOS_DE_ARMA: ReadonlySet<string> = new Set(Object.keys(D34));

export function armaDeClasse34(modelo: string, x: number, y: number): string | null {
  return D34[modelo]?.(x, y) ?? null;
}

export function armaDeClasseCima(modelo: string, x: number, y: number): string | null {
  return DCIMA[modelo]?.(x, y) ?? null;
}
