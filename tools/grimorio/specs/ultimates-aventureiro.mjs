// As 28 ultimates do Aventureiro (Grimório v1.2), na ordem dos pares do catálogo. Físicas, com Destreza, feitas pelo
// falcão (tag `falcao`, como as skills de classe dele). Fases: `[segundos, etapa]` no alvo/célula, `[s, etapa, 'eu']` em quem lança.
import { ef, eu, forma } from './dsl.mjs';

export const TIPO = 'fisico';
export const BASE = { escalaCom: 'destreza', tags: ['falcao'] };
export default [
  // 0 Mergulho + Grito do falcão: Mergulho do trovão
  { ...forma.area(8, 2, 'hostil'), d: '2d6', ef: [ef.expoe(20, 5)], impacto: 'anel',
    fases: [[0.6, { ...forma.emVolta(2), el: 'raio', d: '5d6', ef: [ef.atordoa(1)] }]] },
  // 1 Mergulho + Garras cegantes: Ataque cego
  { ...forma.toque(8), d: '3d6', ef: [ef.cega(50, 3)], mods: ['encadear'], impacto: 'corte' },
  // 2 Mergulho + Vigia: Sentinela em queda
  { ...forma.aliado(8), ef: [ef.intercepta(8, 3), ef.reflexo({ sangrando: { valor: 3, duracaoMs: 3000 } }, 3), ef.escudo(8, 3)], impacto: 'vento' },
  // 3 Mergulho + Rasante: Voo rasante mortal (três rasantes em estrela)
  { ...forma.area(7, 2), d: '3d6', ef: [ef.sangra(2, 3)], impacto: 'vento',
    fases: [[0.4, { ...forma.area(30, 2, 'celula'), d: '3d6' }], [0.8, { ...forma.area(30, 2, 'celula'), d: '3d6' }]] },
  // 4 Mergulho + Tempestade de penas: Furacão alado
  { ...forma.area(7, 2), d: '2d6', ef: [ef.puxa(1)], impacto: 'vento',
    fases: [1, 2, 3].map((s) => [s, { ...forma.area(30, 2, 'celula'), d: '2d6', ef: [ef.puxa(1), ef.sangra(1, 2)] }]) },
  // 5 Mergulho + Retorno ao punho: Bumerangue vivo
  { ...forma.linha(7), d: '3d6', impacto: 'vento', fases: [[0.6, { ...forma.linha(7), d: '3d6', ef: [eu(ef.cura(10))] }, 'eu']] },
  // 6 Mergulho + Presa dupla: Caçada em dupla (5 golpes, o último crítico)
  { ...forma.toque(3), d: '2d6', impacto: 'corte',
    fases: [[0.3, { ...forma.noAlvo(), d: '2d6' }], [0.6, { ...forma.noAlvo(), d: '2d6' }], [0.9, { ...forma.noAlvo(), d: '2d6', ef: [eu(ef.critico(1))] }],
      [1.2, { ...forma.noAlvo(), d: '4d6' }]] },
  // 7 Grito do falcão + Garras cegantes: Pânico na revoada
  { ...forma.aoRedor(4), ef: [ef.medo(2), ef.cega(40, 4)], impacto: 'anel', camera: 'forte' },
  // 8 Grito do falcão + Vigia: Alarme da vigília
  { ...forma.aliados(4), ef: [ef.escudo(8, 8), ef.esquiva(15, 8)], impacto: 'anel', fases: [[0, { ...forma.aoRedor(6), ef: [ef.dissipa(1), ef.expoe(10, 8)] }, 'eu']] },
  // 9 Grito do falcão + Rasante: Clamor dos céus
  { ...forma.linha(7), d: '3d6', ef: [ef.empurra(2), ef.expoe(20, 5)], impacto: 'anel' },
  // 10 Grito do falcão + Tempestade de penas: Tempestade estridente
  { ...forma.area(7, 2, 'hostil'), d: '2d6', ef: [ef.silencia(2), ef.sangra(2, 3)], impacto: 'vento',
    fases: [[1.5, { ...forma.area(30, 2, 'celula'), d: '2d6', ef: [ef.silencia(1)] }]] },
  // 11 Grito do falcão + Retorno ao punho: Chamado ao lar
  { ...forma.linha(6), d: '2d6', ef: [ef.avanca(6), ef.expoe(15, 4), ef.resfria(30, 3)], impacto: 'vento',
    fases: [[0.4, { ...forma.aliados(2), formulaCura: '3d6' }, 'eu']] },
  // 12 Grito do falcão + Presa dupla: Marca da presa
  { ...forma.toque(8), d: '2d6', ef: [ef.expoe(30, 15)], impacto: 'anel' },
  // 13 Garras cegantes + Vigia: Guardião das garras
  { ...forma.proprio(), ef: [eu(ef.reflexo({ cego: { pct: 40, duracaoMs: 2000 } }, 6)), eu(ef.intercepta(3, 6))], impacto: 'corte' },
  // 14 Garras cegantes + Rasante: Riscos de garra
  { ...forma.cone(5, 2), d: '3d6', ef: [ef.cega(40, 3), ef.sangra(2, 3)], impacto: 'corte' },
  // 15 Garras cegantes + Tempestade de penas: Nuvem de penas cortantes
  { ...forma.area(7, 2, 'hostil'), d: '1d6', ef: [ef.cega(40, 2)], impacto: 'vento',
    fases: [1, 2, 3].map((s) => [s, { ...forma.emVolta(2), d: '1d6', ef: [ef.cega(40, 2)] }]) },
  // 16 Garras cegantes + Retorno ao punho: Pilhagem
  { ...forma.area(7, 2), d: '1d6', ef: [ef.dissipa(3)], impacto: 'estrelas', fases: [[0.3, { ...forma.aliados(3), ef: [ef.bonus(15, 6), ef.pressa(15, 6)] }, 'eu']] },
  // 17 Garras cegantes + Presa dupla: Dilacerar em par
  { ...forma.toque(2), d: '3d6', ef: [ef.sangra(5, 5), ef.cega(50, 3)], impacto: 'sangue' },
  // 18 Vigia + Rasante: Patrulha aérea
  { ...forma.aoRedor(4), d: '2d6', impacto: 'vento', fases: [2, 4, 6, 8].map((s) => [s, { ...forma.emVolta(4), d: '2d6' }, 'eu']) },
  // 19 Vigia + Tempestade de penas: Redemoinho de asas
  { ...forma.aoRedor(2), d: '1d6', ef: [ef.empurra(2), eu(ef.intercepta(9, 5))], impacto: 'vento',
    fases: [1.5, 3, 4.5].map((s) => [s, { ...forma.emVolta(2), d: '1d6', ef: [ef.empurra(1)] }, 'eu']) },
  // 20 Vigia + Retorno ao punho: Asas protetoras
  { ...forma.aliado(6), formulaCura: '3d6', ef: [ef.escudo(10, 5), eu(ef.escudo(10, 5)), eu(ef.regenera(3, 5))], impacto: 'sagrado' },
  // 21 Vigia + Presa dupla: Vigília da matilha
  { ...forma.proprio(), ef: [eu(ef.invocaTemp('falcao_espectral', 2, 10))], impacto: 'vento' },
  // 22 Rasante + Tempestade de penas: Ventania de penas
  { ...forma.linha(7), d: '2d6', ef: [ef.resfria(40, 4), eu(ef.acelera(30, 4))], impacto: 'vento' },
  // 23 Rasante + Retorno ao punho: Voo de ida e volta
  { ...forma.toque(7), d: '2d6', ef: [eu(ef.cura(4))], impacto: 'vento',
    fases: [0.5, 1, 1.5].map((s) => [s, { ...forma.noAlvo(), d: '2d6', ef: [eu(ef.cura(4))] }]) },
  // 24 Rasante + Presa dupla: Ataque em pinça
  { ...forma.linha(4), d: '3d6', ef: [ef.avanca(4), ef.atordoa(1)], impacto: 'corte' },
  // 25 Tempestade de penas + Retorno ao punho: Refúgio de penas
  { ...forma.aliados(3), ef: [ef.escudo(14, 4)], impacto: 'vento' },
  // 26 Tempestade de penas + Presa dupla: Tempestade da caçada
  { ...forma.toque(3), d: '2d6', ef: [eu(ef.zera('mergulho'))], impacto: 'corte',
    fases: [0.5, 1, 1.5, 2].map((s) => [s, { ...forma.emVolta(1), d: '2d6', ef: [eu(ef.zera('mergulho'))] }]) },
  // 27 Retorno ao punho + Presa dupla: Laço inquebrável
  { ...forma.proprio(), ef: [eu(ef.regenera(3, 8)), eu(ef.zera('mergulho')), eu(ef.pressa(60, 8)), eu(ef.bonus(15, 8))], impacto: 'sagrado' },
];
