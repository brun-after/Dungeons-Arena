// A forma do estilo no visual (marco 39, 12/11/2026, D-156). A forma aparece com 10% da ponta e cresce em 10 faixas até
// 100% (combat/forma-do-estilo.ts). O desenho conta o que ela faz e cresce com ela, para que o estilo se veja cada vez
// mais nas skills. Cada forma tem o seu, feito à mão:
// - ecoar: o golpe volta. Na hora do eco (600 ms depois) o acerto reaparece pálido, e ondas de som saem do alvo; com a
//   faixa, são mais ondas, mais nítidas, e o fantasma do golpe se repete;
// - encadear: elos se formam em volta do alvo, prontos para saltar; com a faixa, mais elos, maiores, e a faísca do
//   salto acende;
// - atravessar: a flecha não para. O traço continua além do alvo, mais longo e mais claro a cada faixa, e do meio
//   para cima ele arranca estilhaços ao sair;
// - maior e mais lenta: o peso. Na conjuração, a força se junta em anéis que fecham sobre a mão. No estouro, um anel
//   externo pesado passa da área; nas faixas altas a terra treme.
// Só desenho; a intensidade vem da faixa na chave da skill.

import type { Modificador } from '../../combat/habilidades';
import { clarao, clarear, orbitar, ondaDeChoque, tween } from './blocos';
import type { Acerto, AreaVfx, CenaVfx, P } from './cena';
import { cintilar, em } from './emissoes';

export interface FormaVisual {
  mod: Modificador;
  faixa: number;
}

/** O tom de cada forma, misturado à cor da skill: o eco é pálido e violeta, o elo é azul de faísca, o traço é claro. */
const TOM: Readonly<Record<Modificador, number>> = {
  ecoar: 0xd2c4ff,
  encadear: 0x9fe4ff,
  atravessar: 0xfff2c8,
  maior_e_mais_lenta: 0xffb070,
};

/** A intensidade (0,3 a 1) pela faixa: a faixa 1 já se nota; a 10 é o estilo inteiro. */
export function intensidadeDaForma(faixa: number): number {
  return 0.3 + 0.7 * Math.max(0, Math.min(10, faixa)) / 10;
}

const mistura = (a: number, b: number): number => {
  const c = (s: number) => Math.round((((a >> s) & 255) + ((b >> s) & 255)) / 2);
  return (c(16) << 16) | (c(8) << 8) | c(0);
};

function eco(c: CenaVfx, a: Acerto, f: FormaVisual, cor: number, i: number): void {
  const ondas = f.faixa >= 8 ? 3 : f.faixa >= 4 ? 2 : 1;
  for (let k = 0; k < ondas; k++) {
    tween(c, { textura: 'onda_som', de: a.ate, s: [0.4, 1.1 + 0.9 * i], sy: [0.4 * (c.iso ? 0.55 : 1), (1.1 + 0.9 * i) * (c.iso ? 0.55 : 1)], a: [0.55 + 0.4 * i, 0], cor, aditivo: true, ms: 420, atrasoMs: 600 + k * 110, noChao: true });
  }
  // O fantasma do golpe: o clarão volta, pálido, na hora do eco; nas faixas altas, duas vezes.
  tween(c, { textura: 'clarao', de: a.ate, s: [0.6 * i, 1.4 * i], a: [0.35 + 0.45 * i, 0], cor: clarear(cor, 0.3), aditivo: true, ms: 260, atrasoMs: 600 });
  if (f.faixa >= 7 && !c.reduzido) tween(c, { textura: 'clarao', de: a.ate, s: [0.4 * i, 1 * i], a: [0.3 * i, 0], cor, aditivo: true, ms: 220, atrasoMs: 760 });
}

function elos(c: CenaVfx, a: Acerto, f: FormaVisual, cor: number, i: number): void {
  const alvo = a.alvoId;
  const onde = (): P | null => c.ondeEsta(alvo) ?? a.ate;
  orbitar(c, onde, f.faixa >= 5 ? 'elo' : 'elo_lado', cor, { n: 1 + Math.floor(f.faixa / 3), raio: 0.45 + 0.25 * i, ms: 380 + 120 * i, voltas: 0.8 + 0.6 * i, tamanho: 0.35 + 0.35 * i, aditivo: true, rastro: f.faixa >= 8 ? 1 : 0 });
  // A faísca do salto: o elo acende quando já pode pular para mais de um.
  if (f.faixa >= 5) clarao(c, a.ate, cor, 0.6 + 0.7 * i, 160);
}

function traco(c: CenaVfx, a: Acerto, cor: number, f: FormaVisual, i: number): void {
  const de = a.de;
  if (!de) return;
  const dx = a.ate.x - de.x;
  const dy = a.ate.y - de.y;
  const d = Math.hypot(dx, dy) || 1;
  const alem = 0.8 + 1.9 * i;
  const fim = { x: a.ate.x + (dx / d) * alem, y: a.ate.y + (dy / d) * alem };
  // O traço que segue: estica do alvo para a frente e se apaga.
  tween(c, { textura: 'feixe', de: a.ate, para: fim, s: [0.25 + 0.35 * i, 0.1], a: [0.5 + 0.5 * i, 0], cor: clarear(cor, 0.35), aditivo: true, ms: 200 + 80 * i });
  if (f.faixa >= 5) c.particulas.emitirLista([em({ textura: 'estilhaco', quantidade: Math.round(2 + 4 * i), vidaMs: [250, 420], velocidade: [90, 180], direcao: 'orientada', abertura: 0.5, escala: [0.35, 0.1], alpha: [1, 0], aditivo: true, raio: 4, cor })], a.ate.x, a.ate.y, cor, undefined, { x: dx / d, y: dy / d });
}

/** A forma no acerto: o eco, os elos ou o traço, na intensidade da faixa. Só os três primeiros alvos desenham. */
export function formaNoAcerto(c: CenaVfx, formas: readonly FormaVisual[], a: Acerto): void {
  if (a.indice >= 3) return;
  for (const f of formas) {
    const i = intensidadeDaForma(f.faixa);
    const cor = mistura(a.corEtapa ?? a.cor, TOM[f.mod]);
    if (f.mod === 'ecoar' && a.indice === 0) eco(c, a, f, cor, i);
    if (f.mod === 'encadear') elos(c, a, f, cor, i);
    if (f.mod === 'atravessar') traco(c, a, cor, f, i);
  }
}

/** A forma na mão de quem conjura: o peso da área maior se junta em anéis que fecham. */
export function formaNaConjuracao(c: CenaVfx, formas: readonly FormaVisual[], pos: P, cor: number): void {
  const f = formas.find((x) => x.mod === 'maior_e_mais_lenta');
  if (!f) return;
  const i = intensidadeDaForma(f.faixa);
  const tom = mistura(cor, TOM.maior_e_mais_lenta);
  tween(c, { textura: 'choque', de: pos, s: [1.4 + 1.2 * i, 0.3], sy: [(1.4 + 1.2 * i) * (c.iso ? 0.5 : 1), 0.3 * (c.iso ? 0.5 : 1)], a: [0, 0.35 + 0.45 * i], cor: tom, aditivo: true, ms: 240, noChao: true });
  if (f.faixa >= 6) c.particulas.emitirLista([cintilar(Math.round(1 + 3 * i), { velocidade: [20, 50], direcao: 'cima', cor: tom })], pos.x, pos.y, tom);
}

/** A forma no estouro da área: o anel externo pesado passa da área; das faixas altas, o chão treme. */
export function formaNaArea(c: CenaVfx, formas: readonly FormaVisual[], a: AreaVfx): void {
  const f = formas.find((x) => x.mod === 'maior_e_mais_lenta');
  if (!f) return;
  const i = intensidadeDaForma(f.faixa);
  const tom = mistura(a.cor, TOM.maior_e_mais_lenta);
  const raio = Math.max(1, a.raio) + 0.4 + 0.6 * i;
  ondaDeChoque(c, a.centro, tom, raio, 380 + 240 * i);
  if (f.faixa >= 5) ondaDeChoque(c, a.centro, clarear(tom, 0.4), raio * 0.75, 300 + 200 * i, 'rachadura');
  if (f.faixa >= 8) c.tremor('leve');
}
