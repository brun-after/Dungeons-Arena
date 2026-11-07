// O "falcão" da skin Mágico do Aventureiro (06/11/2026): a cartola que voa, a cartola virada de boca para cima com a mão
// de luva branca e a varinha saindo de dentro quando conjura, e o pombo que sai dela nos movimentos do pássaro
// (render/voo-falcao.ts escolhe o modelo).
// Mesmas regras de quadro das feras: 3/4 com os pés em y = 60 (o corpo voando bem acima), de cima com centro em
// (32, 32), olhando +x. Quadros: 0 e 1 em voo (a cartola balança; o pombo bate as asas) e 2 pousado.

import { circulo, clarear, elipse, escurecer, linha, MEIO, PES_Y, poligono, type Vista } from './svg.ts';

const PRETO = 0x1b1a20;
const FITA = 0xb3202e;
const LUVA = 0xf6f4ee;
const POMBO = 0xeef0f2;

/** A cartola de lado: a aba, a copa alta com a fita vermelha e o brilho. `inclina` em unidades de quadro. */
function cartolaDeLado(y: number, inclina: number): string {
  const topo = y - 17;
  return [
    elipse(MEIO, y, 13, 3.4, escurecer(PRETO, 0.2)),
    poligono([MEIO - 8, y - 1, MEIO - 8 + inclina, topo, MEIO + 8 + inclina, topo, MEIO + 8, y - 1], PRETO),
    poligono([MEIO - 8, y - 1, MEIO - 7.6 + inclina * 0.25, y - 5, MEIO + 8.4 + inclina * 0.25, y - 5, MEIO + 8, y - 1], FITA, false),
    elipse(MEIO + inclina, topo, 8, 2.2, escurecer(PRETO, 0.35)),
    linha([MEIO - 4 + inclina * 0.6, topo + 3, MEIO - 5 + inclina * 0.2, y - 7], clarear(PRETO, 0.35), 1.6),
  ].join('');
}

/** A mão de luva branca saindo da copa, com a varinha preta de ponta branca e um brilho. */
function maoComVarinha(y: number): string {
  const topo = y - 17;
  return [
    poligono([MEIO - 2, topo, MEIO - 3, topo - 7, MEIO + 3, topo - 8, MEIO + 3, topo], LUVA),
    circulo(MEIO, topo - 9, 3.6, LUVA),
    linha([MEIO + 2, topo - 10, MEIO + 13, topo - 19], PRETO, 2.2),
    linha([MEIO + 11, topo - 17, MEIO + 13.5, topo - 19.5], 0xffffff, 2.2),
    poligono([MEIO + 15, topo - 25, MEIO + 16, topo - 22, MEIO + 19, topo - 21, MEIO + 16, topo - 20, MEIO + 15, topo - 17, MEIO + 14, topo - 20, MEIO + 11, topo - 21, MEIO + 14, topo - 22], 0xfff3c4, false),
  ].join('');
}

/** A cartola virada: a copa embaixo, a aba em cima com a boca escura, e a mão com a varinha saindo dela. */
function cartolaVirada(y: number): string {
  const fundo = y + 17;
  return [
    poligono([MEIO - 8, y + 1, MEIO - 8, fundo, MEIO + 8, fundo, MEIO + 8, y + 1], PRETO),
    poligono([MEIO - 8, fundo - 6, MEIO - 8, fundo - 1, MEIO + 8, fundo - 1, MEIO + 8, fundo - 6], FITA, false),
    elipse(MEIO, y, 13, 3.4, escurecer(PRETO, 0.2)),
    elipse(MEIO, y, 7.6, 2, 0x050507, false),
    maoComVarinha(y + 17),
  ].join('');
}

function cartola34(quadro: number, virada: boolean): string {
  const y = quadro === 2 ? PES_Y - 6 : PES_Y - 26 + (quadro === 1 ? 1.5 : 0);
  if (virada) return cartolaVirada(y - 17);
  const inclina = quadro === 2 ? 0 : quadro === 1 ? -2 : 2;
  return cartolaDeLado(y, inclina);
}

function cartolaCima(virada: boolean): string {
  const c = MEIO;
  return [
    circulo(c, c, 13, escurecer(PRETO, 0.2)),
    circulo(c, c, 8.6, FITA, false),
    circulo(c, c, 7.4, PRETO),
    virada ? circulo(c, c, 7.4, 0x050507, false) : elipse(c - 2.5, c - 2.5, 2.6, 1.4, clarear(PRETO, 0.3), false),
    ...(virada ? [circulo(c + 3, c, 3.4, LUVA), linha([c + 5, c, c + 17, c - 5], PRETO, 2), circulo(c + 18, c - 5.5, 1.8, 0xfff3c4, false)] : []),
  ].join('');
}

/** O pombo: corpo branco redondo, asas de pontas cinza, bico curto rosado. Quadros de asas como os do falcão. */
function pombo34(quadro: number): string {
  const y = PES_Y - 30;
  const ponta = quadro === 1 ? { tras: [MEIO - 18, y + 9], frente: [MEIO + 15, y + 10] } : quadro === 2 ? { tras: [MEIO - 10, y + 1], frente: [MEIO + 2, y - 2] } : { tras: [MEIO - 19, y - 12], frente: [MEIO + 17, y - 13] };
  const asa = escurecer(POMBO, 0.12);
  return [
    poligono([MEIO - 2, y - 2, ...ponta.tras, MEIO - 6, y + 2], escurecer(POMBO, 0.3)),
    poligono([MEIO - 10, y + 2, MEIO - 19, y + 4, MEIO - 14, y + 7, MEIO - 6, y + 4], escurecer(POMBO, 0.2)),
    elipse(MEIO - 1, y, 9, 5.4, POMBO),
    poligono([MEIO + 2, y - 1, ...ponta.frente, MEIO + 6, y + 3], asa),
    circulo(MEIO + 9, y - 3, 3.8, POMBO),
    poligono([MEIO + 12.5, y - 3.6, MEIO + 16, y - 2.4, MEIO + 12.5, y - 1.4], 0xe6a39a),
    circulo(MEIO + 10.4, y - 4, 0.9, PRETO, false),
  ].join('');
}

function pomboCima(quadro: number): string {
  const c = MEIO;
  const env = quadro === 1 ? 13 : quadro === 2 ? 6 : 20;
  return [
    poligono([c - 4, c - 3, c - 2, c - env, c + 5, c - env + 4, c + 4, c - 3], escurecer(POMBO, 0.15)),
    poligono([c - 4, c + 3, c - 2, c + env, c + 5, c + env - 4, c + 4, c + 3], escurecer(POMBO, 0.15)),
    poligono([c - 9, c - 4, c - 16, c - 5, c - 16, c + 5, c - 9, c + 4], escurecer(POMBO, 0.25)),
    elipse(c - 1, c, 9, 5, POMBO),
    circulo(c + 8, c, 3.6, POMBO),
    poligono([c + 11, c - 1.2, c + 14.5, c, c + 11, c + 1.2], 0xe6a39a),
  ].join('');
}

export const cartola = (virada: boolean) => (vista: Vista, quadro = 0) => (vista === '34' ? cartola34(quadro, virada) : cartolaCima(virada));
export const pombo = () => (vista: Vista, quadro = 0) => (vista === '34' ? pombo34(quadro) : pomboCima(quadro));
