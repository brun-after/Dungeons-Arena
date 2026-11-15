// D-175 (15/11/2026): o gesto do núcleo. As 89 skills comuns saem de 20 núcleos (projétil, explosão, prisão…), e
// algumas dividiam a mesma assinatura com outra de núcleo diferente. Agora cada núcleo assina a skill com o seu gesto,
// feito à mão e na cor do elemento: o que a skill é (o núcleo) se lê junto do que ela é feita (a assinatura e o
// elemento). Com a troca de matéria das que dividem assinatura (transmutacao.ts), nenhuma skill comum repete o visual
// de outra: cada par núcleo × elemento é único. Só desenho.

import { brotar, cair, circuloNoChao, clarear, cupula, feixe, ondaDeChoque, orbitar, tween } from './blocos';
import type { CenaVfx, P } from './cena';
import { elastica, sai } from './pincel';

export interface PalcoDoNucleo {
  /** De onde sai (quem lança), quando se sabe. */
  de: P | null;
  /** Onde acontece: o alvo, o centro da área ou quem lança (nas que são em si). */
  em: P;
  cor: number;
  /** O raio da área (células); 0 quando é um alvo só. */
  raio: number;
}

export const NUCLEOS_COM_GESTO = [
  'projetil', 'explosao', 'feixe', 'cadeia', 'campo', 'nova', 'investida', 'recuo', 'maldicao', 'prisao',
  'muro', 'escudo', 'cura', 'dreno', 'invocar', 'armadilha', 'marca', 'grito', 'chuva', 'postura',
] as const;
export type NucleoComGesto = (typeof NUCLEOS_COM_GESTO)[number];
export const ehNucleoComGesto = (v: string | null | undefined): v is NucleoComGesto => !!v && (NUCLEOS_COM_GESTO as readonly string[]).includes(v);

const acima = (p: P, h: number): P => ({ x: p.x, y: p.y - h });
const emVolta = (centro: P, raio: number, n: number, fase = 0): P[] =>
  Array.from({ length: n }, (_, k) => ({ x: centro.x + Math.cos((k / n) * Math.PI * 2 + fase) * raio, y: centro.y + Math.sin((k / n) * Math.PI * 2 + fase) * raio }));
const angulo = (c: CenaVfx, de: P, ate: P): number => Math.atan2(c.tela(ate).y - c.tela(de).y, c.tela(ate).x - c.tela(de).x);

const GESTOS: Readonly<Record<NucleoComGesto, (c: CenaVfx, g: PalcoDoNucleo) => void>> = {
  /** Projétil: três centelhas em espiral fecham no ponto do acerto. */
  projetil: (c, g) => { orbitar(c, () => g.em, 'cintilar', clarear(g.cor, 0.4), { n: 3, raio: 0.7, ms: 260, voltas: 1, tamanho: 0.5, aditivo: true, rastro: 2 }); },
  /** Explosão: dois anéis inclinados se cruzam e seis estilhaços saem. */
  explosao: (c, g) => {
    for (const rot of [0.6, -0.6]) tween(c, { textura: 'choque', de: g.em, s: [0.3, 1.2 + g.raio * 0.5], sy: [0.15, 0.5 + g.raio * 0.2], a: [1, 0], rot: [rot, rot], cor: g.cor, aditivo: true, ms: 380, curva: sai });
    for (const p of emVolta(g.em, 1 + g.raio * 0.5, 6, 0.3)) tween(c, { textura: 'estilhaco', de: g.em, para: p, s: [0.5, 0.2], a: [1, 0], rot: [angulo(c, g.em, p), angulo(c, g.em, p)], cor: clarear(g.cor, 0.4), aditivo: true, ms: 300, curva: sai });
  },
  /** Feixe: duas linhas finas correm paralelas ao feixe, da mão até o fim. */
  feixe: (c, g) => { if (g.de) for (const d of [-0.18, 0.18]) feixe(c, { x: g.de.x, y: g.de.y + d }, { x: g.em.x, y: g.em.y + d }, clarear(g.cor, 0.5), 0.2, 300); },
  /** Cadeia: os elos giram em volta do alvo e se soltam para os lados. */
  cadeia: (c, g) => { orbitar(c, () => acima(g.em, 0.4), 'elo', clarear(g.cor, 0.3), { n: 4, raio: 0.6, ms: 420, voltas: 1.2, tamanho: 0.45, aditivo: true, tangente: true }); },
  /** Campo: quatro runas marcam os cantos do chão tomado e giram devagar. */
  campo: (c, g) => {
    const r = Math.max(1, g.raio);
    emVolta(g.em, r * 1.2, 4, Math.PI / 4).forEach((p, k) => { tween(c, { textura: 'runa0', de: p, s: [0.2, 0.7], a: [1, 0], cor: clarear(g.cor, 0.4), aditivo: true, ms: 1400, atrasoMs: k * 80, noChao: true }); });
    circuloNoChao(c, () => g.em, 'hexagono', g.cor, r * 1.6, 1200, 0.3);
  },
  /** Nova: o anel sai de quem lança e um contra-anel volta para ele. */
  nova: (c, g) => {
    const r = Math.max(1.2, g.raio);
    ondaDeChoque(c, g.em, clarear(g.cor, 0.4), r + 0.3, 340);
    tween(c, { textura: 'choque', de: g.em, s: [r * 1.4, 0.3], sy: [r * 0.7, 0.15], a: [0, 0.9], cor: g.cor, aditivo: true, ms: 300, atrasoMs: 300, noChao: true });
  },
  /** Investida: três setas ficam na trilha, uma atrás da outra. */
  investida: (c, g) => {
    const de = g.de ?? g.em;
    const ang = angulo(c, de, g.em);
    for (let k = 1; k <= 3; k++) {
      const p = { x: de.x + ((g.em.x - de.x) * k) / 4, y: de.y + ((g.em.y - de.y) * k) / 4 };
      tween(c, { textura: 'arco_golpe', de: p, s: [0.9, 0.5], a: [0.9, 0], rot: [ang, ang], cor: clarear(g.cor, 0.4), aditivo: true, ms: 420, atrasoMs: k * 50 });
    }
  },
  /** Recuo: um vulto fica no lugar de onde se saiu e desbota. */
  recuo: (c, g) => { tween(c, { textura: 'alma', de: acima(g.de ?? g.em, 0.5), s: [1.2, 1.5], a: [0.8, 0], cor: clarear(g.cor, 0.3), aditivo: true, ms: 520 }); },
  /** Maldição: um olho abre sobre o alvo e um fio desce até ele. */
  maldicao: (c, g) => {
    tween(c, { textura: 'olho', de: acima(g.em, 1.5), s: [0.2, 0.9], sy: [0.05, 0.8], a: [1, 0], cor: g.cor, aditivo: true, ms: 700, curva: elastica });
    feixe(c, acima(g.em, 1.4), acima(g.em, 0.5), g.cor, 0.2, 520);
  },
  /** Prisão: quatro barras caem em volta do alvo. */
  prisao: (c, g) => { emVolta(g.em, 0.5, 4, Math.PI / 4).forEach((p, k) => { cair(c, p, 'feixe', clarear(g.cor, 0.4), { altura: 2.5, ms: 200, tamanho: 0.9, atrasoMs: k * 30, inclinacao: Math.PI / 2, aditivo: true }); }); },
  /** Muro: uma fileira de placas sobe do chão, lado a lado. */
  muro: (c, g) => { for (let k = -2; k <= 2; k++) brotar(c, { x: g.em.x + k * 0.5, y: g.em.y }, 'hexagono', clarear(g.cor, 0.3), 0.8, 1000, true, (k + 2) * 50); },
  /** Escudo: a casca fecha em cúpula e uma placa encaixa na frente. */
  escudo: (c, g) => {
    cupula(c, () => g.em, g.cor, 520, 0.6);
    tween(c, { textura: 'hexagono', de: acima(g.em, 0.5), s: [1.6, 0.9], a: [0, 1], cor: clarear(g.cor, 0.4), aditivo: true, ms: 300, curva: elastica });
  },
  /** Cura: uma cruz de luz sobe do corpo curado. */
  cura: (c, g) => {
    for (const rot of [0, Math.PI / 2]) tween(c, { textura: 'feixe', de: acima(g.em, 0.5), para: acima(g.em, 1.3), s: [0.5, 0.9], sy: [0.25, 0.25], a: [1, 0], rot: [rot, rot], cor: clarear(g.cor, 0.5), aditivo: true, ms: 620 });
  },
  /** Dreno: as gotas saem do alvo e correm para quem lançou. */
  dreno: (c, g) => {
    const para = g.de ?? acima(g.em, 2);
    for (let k = 0; k < 3; k++) tween(c, { textura: 'gota_viva', de: g.em, para, s: [0.45, 0.2], a: [1, 0.4], cor: g.cor, aditivo: true, ms: 420, atrasoMs: k * 70, subir: -12 - k * 6 });
  },
  /** Invocar: o círculo do chamado abre com cinco runas nas pontas. */
  invocar: (c, g) => {
    circuloNoChao(c, () => g.em, 'circulo_runico', g.cor, 2.2, 900, 1);
    emVolta(g.em, 1, 5, -Math.PI / 2).forEach((p, k) => { tween(c, { textura: 'runa3', de: p, s: [0.2, 0.6], a: [1, 0], cor: clarear(g.cor, 0.4), aditivo: true, ms: 800, atrasoMs: k * 60, subir: -14 }); });
  },
  /** Armadilha: os dentes fecham no chão, de fora para dentro. */
  armadilha: (c, g) => { emVolta(g.em, 0.7, 6).forEach((p, k) => { tween(c, { textura: 'espinho', de: p, para: g.em, s: [0.7, 0.5], a: [1, 0.2], rot: [angulo(c, p, g.em), angulo(c, p, g.em)], cor: clarear(g.cor, 0.3), ms: 260, atrasoMs: k * 15, curva: elastica }); }); },
  /** Marca: o losango de mira gira e trava sobre o alvo. */
  marca: (c, g) => { tween(c, { textura: 'mira_alvo', de: acima(g.em, 0.6), s: [1.6, 0.7], a: [0.4, 1], rot: [Math.PI, 0], cor: g.cor, aditivo: true, ms: 420 }); },
  /** Grito: três arcos de som abrem em leque a partir da boca. */
  grito: (c, g) => { for (let k = 0; k < 3; k++) tween(c, { textura: 'onda_som', de: acima(g.em, 0.8), s: [0.4, 1 + k * 0.5 + g.raio * 0.3], a: [1, 0], cor: clarear(g.cor, 0.3), aditivo: true, ms: 420, atrasoMs: k * 90, curva: sai }); },
  /** Chuva: os riscos caem em diagonal sobre a área, antes da própria chuva. */
  chuva: (c, g) => {
    const r = Math.max(1, g.raio);
    emVolta(g.em, r * 0.8, 6, 0.4).forEach((p, k) => { cair(c, p, 'feixe', clarear(g.cor, 0.5), { altura: 4, ms: 220, tamanho: 0.7, atrasoMs: k * 45, inclinacao: 0.5, aditivo: true }); });
  },
  /** Postura: a aura sobe em coluna pelo corpo e duas runas ficam rodando. */
  postura: (c, g) => {
    feixe(c, g.em, acima(g.em, 2.2), g.cor, 1.1, 620);
    orbitar(c, () => acima(g.em, 0.6), 'runa2', clarear(g.cor, 0.4), { n: 2, raio: 0.6, ms: 1200, voltas: 1.5, tamanho: 0.5, aditivo: true });
  },
};

/** O gesto do núcleo da skill comum (nada para quem não tem núcleo). */
export function gestoDoNucleo(c: CenaVfx, nucleo: string | null | undefined, g: PalcoDoNucleo): void {
  if (ehNucleoComGesto(nucleo)) GESTOS[nucleo](c, g);
}
