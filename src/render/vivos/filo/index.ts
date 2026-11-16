// Marco 45 (16/11/2026, D-181): o catálogo das criaturas de Filo de geometria (sem rig), pelo modelo de inimigos.json,
// com a altura e o quadro do atlas. Os humanoides ficam em humanos.ts.

import type { Fera } from './kit';
import { breuzinho, candelinha, floquinho, gosminho, sonequinha, ticaozinho } from './bolhas';
import { bobinadora, enxamePutrido, maeColmeia, tecelaDoVazio, zunzum } from './insetos';
import { faminto, galgoDoVendaval, pedrico, pluminha } from './feras';
import { braseiro, caboVoltaico, casulo, cogumeloPulmao, colunaAntiga, estatuaDeGelo, obeliscoVigia, pedregulho, pilarDeCristal, torreEngrenada } from './construtos';
import { dragaoDaFornalha, dragaoDasRuinas, dragaoDoSilencio, dragaoEngrenado, dragaoFermentado } from './dragoes';

export { HUMANOS_FILO, CLIPE_DO_JEITO, type HumanoDeFilo, type Jeito, type Traje } from './humanos';

export interface ProcDeFilo {
  criar: () => Fera;
  altura: number;
  quadro?: { largura: number; altura: number; baixo: number };
}

const DRAGAO = { largura: 5.2, altura: 4.8, baixo: 1.9 };
const p = (criar: () => Fera, altura: number, quadro?: ProcDeFilo['quadro']): ProcDeFilo => (quadro ? { criar, altura, quadro } : { criar, altura });

export const PROCS_FILO: Readonly<Record<string, ProcDeFilo>> = {
  ticaozinho: p(ticaozinho, 0.6),
  floquinho: p(floquinho, 0.72),
  gosminho: p(gosminho, 0.55),
  breuzinho: p(breuzinho, 0.6),
  sonequinha: p(sonequinha, 0.55),
  candelinha: p(candelinha, 0.62),
  zunzum: p(zunzum, 0.62),
  bobinadora: p(bobinadora, 0.6, { largura: 1.9, altura: 1.5, baixo: 0.5 }),
  tecela_do_vazio: p(tecelaDoVazio, 0.7, { largura: 2, altura: 1.6, baixo: 0.55 }),
  enxame_putrido: p(enxamePutrido, 0.95, { largura: 2.6, altura: 2.6, baixo: 0.8 }),
  mae_colmeia: p(maeColmeia, 1.6, { largura: 4, altura: 3.6, baixo: 1.3 }),
  faminto: p(faminto, 0.85, { largura: 1.9, altura: 1.7, baixo: 0.5 }),
  pedrico: p(pedrico, 0.45),
  galgo_do_vendaval: p(galgoDoVendaval, 0.85, { largura: 1.9, altura: 1.7, baixo: 0.5 }),
  pluminha: p(pluminha, 0.55),
  obelisco_vigia: p(obeliscoVigia, 1.5, { largura: 1.6, altura: 2.1, baixo: 0.4 }),
  estatua_de_gelo: p(estatuaDeGelo, 1.2),
  torre_engrenada: p(torreEngrenada, 1.5, { largura: 1.6, altura: 2.1, baixo: 0.4 }),
  cabo_voltaico: p(caboVoltaico, 1.1),
  cogumelo_pulmao: p(cogumeloPulmao, 0.75),
  casulo: p(casulo, 0.7),
  braseiro: p(braseiro, 0.95),
  coluna_antiga: p(colunaAntiga, 1.7, { largura: 1.6, altura: 2.3, baixo: 0.4 }),
  pilar_de_cristal: p(pilarDeCristal, 1.4, { largura: 1.6, altura: 2, baixo: 0.4 }),
  pedregulho: p(pedregulho, 0.55),
  dragao_da_fornalha: p(dragaoDaFornalha, 2.6, DRAGAO),
  dragao_do_silencio: p(dragaoDoSilencio, 2.6, DRAGAO),
  dragao_engrenado: p(dragaoEngrenado, 2.6, DRAGAO),
  dragao_fermentado: p(dragaoFermentado, 2.6, DRAGAO),
  dragao_das_ruinas: p(dragaoDasRuinas, 2.6, DRAGAO),
};

/** As criaturas de geometria como as feras do 3D em tempo real (palco-vivo.ts) e do atlas (criaturas3d.ts). */
export const CRIATURAS_FILO: Readonly<Record<string, () => Fera>> = Object.fromEntries(Object.entries(PROCS_FILO).map(([k, v]) => [k, v.criar]));
