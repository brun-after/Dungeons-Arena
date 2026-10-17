// Adornos do equipamento sobre os modelos das classes (ajuste de 16/10/2026, D-067). Funções puras: devolvem o
// SVG de duas camadas no quadro de 64 do modelo, uma atrás (capa) e outra na frente (armadura, elmo, mão
// secundária e arma), com o mesmo contorno (1,6) e os mesmos traços de arma dos modelos. A geometria das mãos, do
// tronco e da cabeça repete a de bipede.ts (quadro 0).

import { arma34, armaCima, type Arma, type OpcoesBipede } from './bipede.ts';
import { circulo, clarear, elipse, escurecer, hex, linha, MEIO, PES_Y, poligono, type Vista } from './svg.ts';

/** O que o token veste: a base da arma de cada mão e, nas peças, a cor (da raridade) ou null. */
export interface VisualEquipamento {
  arma: string | null;
  secundaria: string | null;
  cabeca: number | null;
  corpo: number | null;
  capa: number | null;
}

const ARMAS: ReadonlySet<string> = new Set<Arma>(['espada', 'cajado', 'clava', 'adaga', 'machado', 'foice', 'arco', 'lanca']);
const comoArma = (base: string | null): Arma | null => (base && ARMAS.has(base) ? (base as Arma) : null);

export interface CamadasAdorno {
  atras: string;
  frente: string;
}

function adornos34(o: OpcoesBipede, v: VisualEquipamento): CamadasAdorno {
  const base = PES_Y - (o.elevacao ?? 0);
  const quadrilY = base - o.perna;
  const ombroY = quadrilY - o.tronco;
  const cabecaY = ombroY - o.cabeca * 0.8;
  const r = o.cabeca;
  const bracoA = o.tronco + 3;
  const maoE = { x: MEIO - o.ombro - 3.5 + 2.2, y: ombroY + bracoA };
  const maoD = { x: MEIO + o.ombro - 1 + 2.2, y: ombroY + bracoA };
  const atras: string[] = [];
  const frente: string[] = [];
  if (v.capa !== null) {
    atras.push(poligono([MEIO - o.ombro - 1, ombroY, MEIO + o.ombro + 1, ombroY, MEIO + o.ombro + 6, base - 3, MEIO - o.ombro - 6, base - 3], escurecer(v.capa, 0.35)));
  }
  if (v.corpo !== null) {
    // Peitoral: uma placa no tronco, com a borda clara de cima e a cor da raridade.
    const meioY = ombroY + o.tronco * 0.55;
    frente.push(poligono([MEIO - o.ombro + 1, ombroY + 1, MEIO + o.ombro - 1, ombroY + 1, MEIO + o.quadril - 0.5, meioY, MEIO - o.quadril + 0.5, meioY], escurecer(v.corpo, 0.25)));
    frente.push(linha([MEIO - o.ombro + 2, ombroY + 2.2, MEIO + o.ombro - 2, ombroY + 2.2], clarear(v.corpo, 0.35), 1.2));
  }
  if (v.cabeca !== null) {
    // Elmo: a calota sobre a cabeça e a faixa da testa.
    frente.push(`<path d="M ${MEIO - r - 1} ${cabecaY - 0.5} A ${r + 1} ${r + 1} 0 0 1 ${MEIO + r + 1} ${cabecaY - 0.5} Z" fill="${hex(escurecer(v.cabeca, 0.2))}" stroke="#0d0b12" stroke-width="1.6" stroke-linejoin="round"/>`);
    frente.push(linha([MEIO - r - 0.5, cabecaY - 0.8, MEIO + r + 0.5, cabecaY - 0.8], clarear(v.cabeca, 0.3), 1.4));
  }
  const secundaria = v.secundaria;
  if (secundaria === 'escudo') {
    frente.push(elipse(maoE.x - 1, maoE.y - 4, 4.8, 6.2, 0x8a6d3b) + circulo(maoE.x - 1, maoE.y - 4, 1.6, clarear(0x8a6d3b, 0.5), false));
  } else {
    const arma = comoArma(secundaria);
    if (arma) frente.push(arma34(arma, maoE.x, maoE.y));
  }
  if (secundaria) frente.push(circulo(maoE.x, maoE.y, 2.2, o.pele));
  const arma = comoArma(v.arma);
  if (arma) frente.push(arma34(arma, maoD.x, maoD.y), circulo(maoD.x, maoD.y, 2.2, escurecer(o.pele, 0.15)));
  return { atras: atras.join(''), frente: frente.join('') };
}

function adornosCima(o: OpcoesBipede, v: VisualEquipamento): CamadasAdorno {
  const c = MEIO;
  const maoE = { x: c + 5, y: c - o.ombro - 1.5 };
  const maoD = { x: c + 5, y: c + o.ombro + 1.5 };
  const atras: string[] = [];
  const frente: string[] = [];
  if (v.capa !== null) atras.push(elipse(c - 4, c, o.ombro * 0.75, o.ombro + 3, escurecer(v.capa, 0.35)));
  if (v.corpo !== null) frente.push(elipse(c - 1, c, o.ombro * 0.55, o.ombro + 1, escurecer(v.corpo, 0.25)));
  if (v.secundaria === 'escudo') frente.push(elipse(maoE.x + 2, maoE.y, 2.6, 5.5, 0x8a6d3b));
  else {
    const arma = comoArma(v.secundaria);
    if (arma) frente.push(armaCima(arma, maoE.x, maoE.y));
  }
  if (v.secundaria) frente.push(circulo(maoE.x, maoE.y, 2.4, o.pele));
  const arma = comoArma(v.arma);
  if (arma) frente.push(armaCima(arma, maoD.x, maoD.y), circulo(maoD.x, maoD.y, 2.4, escurecer(o.pele, 0.15)));
  if (v.cabeca !== null) {
    const r = o.cabeca * 0.95;
    frente.push(circulo(c + 1, c, r + 0.6, escurecer(v.cabeca, 0.2)), circulo(c + 1.5, c, r * 0.45, clarear(v.cabeca, 0.3), false));
  }
  // Mesma ampliação da vista de cima do modelo.
  const g = (s: string) => (s ? `<g transform="translate(${c} ${c}) scale(1.35) translate(${-c} ${-c})">${s}</g>` : '');
  return { atras: g(atras.join('')), frente: g(frente.join('')) };
}

/** As duas camadas de adorno de um bípede, na vista pedida (vazias quando não há o que mostrar). */
export function adornosDoBipede(o: OpcoesBipede, vista: Vista, v: VisualEquipamento): CamadasAdorno {
  return vista === '34' ? adornos34(o, v) : adornosCima(o, v);
}
