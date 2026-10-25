// Criaturas não bípedes (§2.16): lobo, aranha e slime. Marco 13 (14/10/2026), D-058.
// Marco 22 (23/10/2026, D-089): o falcão do Aventureiro, em voo (asas abertas, acima do chão).
// Mesmas regras de quadro dos bípedes: 3/4 com os pés em y = 60; de cima com centro em (32, 32), olhando +x.

import { circulo, clarear, elipse, escurecer, hex, linha, MEIO, olhos, PES_Y, poligono, type Vista } from './svg.ts';

function lobo34(cor: number): string {
  const sombra = escurecer(cor, 0.3);
  const y = PES_Y - 12;
  return [
    linha([MEIO - 15, y - 2, MEIO - 22, y - 9], sombra, 3.4),
    // Pernas de trás (mais escuras) e da frente.
    poligono([MEIO - 13, y + 2, MEIO - 9, y + 2, MEIO - 9, PES_Y, MEIO - 13, PES_Y], escurecer(cor, 0.45)),
    poligono([MEIO + 6, y + 2, MEIO + 10, y + 2, MEIO + 10, PES_Y, MEIO + 6, PES_Y], escurecer(cor, 0.45)),
    elipse(MEIO - 2, y, 15, 7.5, cor),
    elipse(MEIO - 2, y + 3, 12, 3.6, sombra, false),
    poligono([MEIO - 8, y + 2, MEIO - 4, y + 2, MEIO - 4, PES_Y, MEIO - 8, PES_Y], escurecer(cor, 0.2)),
    poligono([MEIO + 11, y + 2, MEIO + 15, y + 2, MEIO + 15, PES_Y, MEIO + 11, PES_Y], escurecer(cor, 0.2)),
    // Cabeça com focinho e orelhas.
    poligono([MEIO + 10, y - 13, MEIO + 12, y - 20, MEIO + 15, y - 13], escurecer(cor, 0.2)),
    circulo(MEIO + 14, y - 8, 6.5, cor),
    poligono([MEIO + 17, y - 9, MEIO + 26, y - 6, MEIO + 25, y - 3, MEIO + 17, y - 3], clarear(cor, 0.15)),
    circulo(MEIO + 25.5, y - 5.5, 1.4, 0x111111, false),
    poligono([MEIO + 15, y - 13, MEIO + 18, y - 20, MEIO + 19, y - 12], cor),
    olhos(MEIO + 15.5, y - 9, 2.2, 1.1, 0xf1c40f),
  ].join('');
}

function loboCima(cor: number): string {
  const c = MEIO;
  return [
    linha([c - 14, c, c - 24, c + 3], escurecer(cor, 0.3), 3.4),
    elipse(c - 2, c - 6, 2.6, 2, escurecer(cor, 0.45)),
    elipse(c - 2, c + 6, 2.6, 2, escurecer(cor, 0.45)),
    elipse(c - 2, c, 14, 7, cor),
    elipse(c - 4, c + 2, 10, 3, escurecer(cor, 0.25), false),
    circulo(c + 13, c, 6, cor),
    poligono([c + 17, c - 3, c + 25, c, c + 17, c + 3], clarear(cor, 0.15)),
    poligono([c + 10, c - 5, c + 9, c - 10, c + 14, c - 5], cor),
    poligono([c + 10, c + 5, c + 9, c + 10, c + 14, c + 5], escurecer(cor, 0.2)),
    circulo(c + 16, c - 2.4, 1, 0xf1c40f, false) + circulo(c + 16, c + 2.4, 1, 0xf1c40f, false),
  ].join('');
}

function aranha34(cor: number): string {
  const y = PES_Y - 11;
  const partes: string[] = [];
  const perna = escurecer(cor, 0.35);
  for (let i = 0; i < 4; i++) {
    const a = 6 + i * 4;
    partes.push(linha([MEIO - 3, y, MEIO - a, y - 8 + i, MEIO - a - 5, PES_Y - 1], perna, 2));
    partes.push(linha([MEIO + 3, y, MEIO + a, y - 8 + i, MEIO + a + 5, PES_Y - 1], escurecer(perna, 0.2), 2));
  }
  partes.push(elipse(MEIO - 4, y - 5, 11, 9, escurecer(cor, 0.1)));
  partes.push(elipse(MEIO - 6, y - 8, 4, 3, clarear(cor, 0.2), false));
  partes.push(circulo(MEIO + 6, y + 1, 6, cor));
  partes.push(olhos(MEIO + 6, y, 2, 1.2, 0xe74c3c) + olhos(MEIO + 6, y + 2.6, 1.2, 0.8, 0xe74c3c));
  return partes.join('');
}

function aranhaCima(cor: number): string {
  const c = MEIO;
  const partes: string[] = [];
  const perna = escurecer(cor, 0.35);
  for (let i = 0; i < 4; i++) {
    const x = c - 4 + i * 4;
    partes.push(linha([x, c, x + 4 - i * 3, c - 13, x + 8 - i * 5, c - 20], perna, 2));
    partes.push(linha([x, c, x + 4 - i * 3, c + 13, x + 8 - i * 5, c + 20], perna, 2));
  }
  partes.push(elipse(c - 6, c, 10, 8, escurecer(cor, 0.1)));
  partes.push(elipse(c - 8, c - 2, 4, 2.6, clarear(cor, 0.2), false));
  partes.push(circulo(c + 6, c, 5.5, cor));
  partes.push(circulo(c + 10, c - 1.8, 1, 0xe74c3c, false) + circulo(c + 10, c + 1.8, 1, 0xe74c3c, false));
  return partes.join('');
}

function slime34(cor: number): string {
  const y = PES_Y;
  return [
    `<path d="M ${MEIO - 17} ${y} Q ${MEIO - 18} ${y - 22} ${MEIO} ${y - 24} Q ${MEIO + 18} ${y - 22} ${MEIO + 17} ${y} Z" fill="${hex(cor)}" fill-opacity="0.92" stroke="#0d0b12" stroke-width="1.6"/>`,
    elipse(MEIO + 6, y - 8, 8, 6, escurecer(cor, 0.25), false),
    elipse(MEIO - 7, y - 17, 4, 2.6, clarear(cor, 0.55), false),
    olhos(MEIO, y - 12, 4.5, 1.8, 0x111111),
  ].join('');
}

function slimeCima(cor: number): string {
  return [
    elipse(MEIO, MEIO, 16, 15, cor),
    elipse(MEIO - 3, MEIO + 4, 10, 8, escurecer(cor, 0.2), false),
    elipse(MEIO - 5, MEIO - 6, 4, 2.6, clarear(cor, 0.55), false),
    circulo(MEIO + 8, MEIO - 3.5, 1.6, 0x111111, false) + circulo(MEIO + 8, MEIO + 3.5, 1.6, 0x111111, false),
  ].join('');
}

export const lobo = (cor: number) => (vista: Vista) => (vista === '34' ? lobo34(cor) : loboCima(cor));
export const aranha = (cor: number) => (vista: Vista) => (vista === '34' ? aranha34(cor) : aranhaCima(cor));
export const slime = (cor: number) => (vista: Vista) => (vista === '34' ? slime34(cor) : slimeCima(cor));

// Marco 22: o falcão voa alto (o corpo bem acima dos pés) para não se confundir com quem anda no chão.
// Marco 24 (25/10/2026, D-098): três quadros de asas: 0 abertas (planando), 1 batendo para baixo, 2 fechadas (pousado).
function falcao34(cor: number, quadro: number): string {
  const y = PES_Y - 30;
  const asa = escurecer(cor, 0.25);
  // A ponta das asas: alta e aberta, baixa na batida, colada ao corpo quando fecha.
  const ponta = quadro === 1 ? { tras: [MEIO - 20, y + 10], frente: [MEIO + 18, y + 11] } : quadro === 2 ? { tras: [MEIO - 12, y + 1], frente: [MEIO + 2, y - 3] } : { tras: [MEIO - 22, y - 14], frente: [MEIO + 20, y - 15] };
  return [
    // Asas, a de trás mais escura.
    poligono([MEIO - 2, y - 2, ...ponta.tras, MEIO - 18, y - 4 + (quadro === 1 ? 10 : 0), MEIO - 6, y + 2], escurecer(cor, 0.4)),
    poligono([MEIO - 12, y + 3, MEIO - 22, y + 6, MEIO - 16, y + 9, MEIO - 6, y + 5], escurecer(cor, 0.3)),
    elipse(MEIO - 1, y, 10, 5, cor),
    poligono([MEIO + 2, y - 1, ...ponta.frente, MEIO + 16 - (quadro === 2 ? 12 : 0), y - 3 + (quadro === 1 ? 10 : 0), MEIO + 6, y + 3], asa),
    elipse(MEIO, y + 2, 7, 2.4, clarear(cor, 0.35), false),
    circulo(MEIO + 10, y - 3, 4.2, cor),
    poligono([MEIO + 13.5, y - 4, MEIO + 19, y - 2, MEIO + 13.5, y - 0.5], 0xf4d03f),
    circulo(MEIO + 11.5, y - 4.2, 1.1, 0x111111, false),
  ].join('');
}

function falcaoCima(cor: number, quadro: number): string {
  const c = MEIO;
  // De cima, a envergadura: inteira, a meio na batida, recolhida pousado.
  const env = quadro === 1 ? 15 : quadro === 2 ? 6 : 24;
  return [
    poligono([c - 4, c - 3, c - 2, c - env, c + 6, c - env + 4, c + 4, c - 3], escurecer(cor, 0.25)),
    poligono([c - 4, c + 3, c - 2, c + env, c + 6, c + env - 4, c + 4, c + 3], escurecer(cor, 0.25)),
    poligono([c - 10, c - 4, c - 18, c - 6, c - 18, c + 6, c - 10, c + 4], escurecer(cor, 0.35)),
    elipse(c - 1, c, 10, 4.5, cor),
    circulo(c + 9, c, 3.8, cor),
    poligono([c + 12, c - 1.6, c + 17, c, c + 12, c + 1.6], 0xf4d03f),
  ].join('');
}

export const falcao = (cor: number) => (vista: Vista, quadro = 0) => (vista === '34' ? falcao34(cor, quadro) : falcaoCima(cor, quadro));
