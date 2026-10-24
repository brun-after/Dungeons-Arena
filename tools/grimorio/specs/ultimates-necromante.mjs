// As 28 ultimates do Necromante (Grimório v1.2), na ordem dos pares do catálogo. Mágicas, quase todas de trevas.
// Fases: `[segundos, etapa]` no alvo/célula, `[segundos, etapa, 'eu']` na célula de quem lança.
import { ef, eu, forma } from './dsl.mjs';

const trevas = { el: 'trevas' };

export const TIPO = 'magico';
export default [
  // 0 Dardo funesto + Dízimo vital: Banquete funesto
  { ...forma.linha(8), ...trevas, d: '4d6', ef: [ef.definha(25, 4), eu(ef.curaPct(15)), eu(ef.drenar(10))], impacto: 'sombra', camera: 'forte' },
  // 1 Dardo funesto + Garras do ossuário: Ossário faminto
  { ...forma.area(6, 2), ...trevas, d: '2d6', ef: [ef.enraiza(2), ef.definha(25, 4)], impacto: 'pedra',
    fases: [[1.5, { ...forma.area(30, 2, 'celula'), ...trevas, d: '2d6', ef: [ef.enraiza(1)] }]] },
  // 2 Dardo funesto + Comando sepulcral: Ordem da praga
  { ...forma.tiro(8, 14), ...trevas, d: '3d6', ef: [ef.definha(25, 4), eu(ef.comandar(30, 6))], impacto: 'sombra',
    fases: [[0.4, { ...forma.noAlvo(), ...trevas, d: '2d6' }], [0.8, { ...forma.noAlvo(), ...trevas, d: '2d6' }]] },
  // 3 Dardo funesto + Ceifa de almas: Colheita sombria
  { ...forma.area(6, 3), ...trevas, d: '1d6', ef: [ef.definha(30, 5)], impacto: 'sombra',
    fases: [[3, { ...forma.area(30, 3, 'celula'), ...trevas, d: '6d6', ef: [ef.puxa(1)] }]] },
  // 4 Dardo funesto + Mortalha fúnebre: Véu da peste
  { ...forma.aoRedor(2), ...trevas, d: '1d6', ef: [ef.definha(25, 4), eu(ef.fantasma(3)), eu(ef.imune(1))], impacto: 'fumaca',
    fases: [[1.5, { ...forma.emVolta(2), ...trevas, d: '1d6', ef: [ef.definha(25, 3)] }, 'eu']] },
  // 5 Dardo funesto + Explosão cadavérica: Pestilência explosiva
  { ...forma.tiro(8, 14), ...trevas, d: '3d6', ef: [ef.definha(30, 6), ef.envenena(3, 6)], impacto: 'bolhas',
    fases: [[3, { ...forma.emVolta(2), el: 'veneno', d: '3d6', ef: [ef.envenena(2, 4)] }]] },
  // 6 Dardo funesto + Levante profano: Praga dos mortos
  { ...forma.tiro(8, 14), ...trevas, d: '4d6', ef: [ef.definha(25, 5), eu(ef.invocaTemp('esqueleto_profano', 1, 12))], impacto: 'sombra' },
  // 7 Dízimo vital + Garras do ossuário: Raízes do tributo
  { ...forma.aoRedor(4), ...trevas, d: '1d6', ef: [ef.enraiza(1.5), eu(ef.regenera(4, 4))], impacto: 'pedra',
    fases: [1, 2, 3].map((s) => [s, { ...forma.emVolta(4), ...trevas, d: '1d6+1' }, 'eu']) },
  // 8 Dízimo vital + Comando sepulcral: Pacto da legião
  { ...forma.proprio(), ef: [eu(ef.drenar(10)), eu(ef.comandar(50, 8))], impacto: 'sangue' },
  // 9 Dízimo vital + Ceifa de almas: Dízimo das almas
  { ...forma.cone(4, 3), ...trevas, d: '4d6', ef: [ef.puxa(1), eu(ef.cura(12))], impacto: 'sombra' },
  // 10 Dízimo vital + Mortalha fúnebre: Sudário vampírico
  { ...forma.aoRedor(2), ...trevas, d: '1d6', ef: [eu(ef.escudo(10, 6))], impacto: 'fumaca',
    fases: [1.5, 3, 4.5, 6].map((s) => [s, { ...forma.emVolta(2), ...trevas, d: '1d6', ef: [eu(ef.escudo(4, 4))] }, 'eu']) },
  // 11 Dízimo vital + Explosão cadavérica: Oferenda ardente
  { ...forma.aoRedor(3), ...trevas, d: '6d6', ef: [eu(ef.drenar(30)), ef.queima(4, 4)], impacto: 'explosao', camera: 'forte' },
  // 12 Dízimo vital + Levante profano: Ciclo eterno
  { ...forma.proprio(), ef: [eu(ef.invocaTemp('esqueleto_profano', 3, 15)), eu(ef.regenera(3, 6))], impacto: 'sombra' },
  // 13 Garras do ossuário + Comando sepulcral: Mãos da cripta
  { ...forma.aoRedor(5), ...trevas, d: '2d6', ef: [ef.enraiza(1.5), eu(ef.comandar(20, 6))], impacto: 'pedra' },
  // 14 Garras do ossuário + Ceifa de almas: Abraço do ossuário
  { ...forma.area(6, 2), ...trevas, d: '2d6', ef: [ef.enraiza(1.5)], impacto: 'pedra', fases: [[1.5, { ...forma.area(30, 2, 'celula'), ...trevas, d: '4d6', ef: [ef.puxa(2)] }]] },
  // 15 Garras do ossuário + Mortalha fúnebre: Cemitério vivo
  { ...forma.area(5, 3), ...trevas, d: '1d6', ef: [ef.atola(30, 2)], impacto: 'pedra',
    fases: [2, 4, 6, 8].map((s) => [s, { ...forma.area(30, 3, 'celula'), ...trevas, ef: [ef.atola(30, 2)] }]).concat([2, 4, 6].map((s) => [s, { ...forma.aliados(3), ef: [ef.escudo(5, 3)] }, 'eu'])) },
  // 16 Garras do ossuário + Explosão cadavérica: Campo de ossos
  { ...forma.aoRedor(4), ...trevas, d: '3d6', ef: [ef.enraiza(1.5), eu(ef.detona(2, 50))], impacto: 'pedra', camera: 'forte' },
  // 17 Garras do ossuário + Levante profano: Exército sepulto
  { ...forma.area(6, 2), ...trevas, d: '2d6', ef: [ef.enraiza(2), eu(ef.invocaTemp('esqueleto_profano', 4, 10))], impacto: 'pedra' },
  // 18 Comando sepulcral + Ceifa de almas: Marcha dos ceifadores
  { ...forma.cone(4, 3), ...trevas, d: '2d6', ef: [eu(ef.comandar(40, 6))], impacto: 'corte' },
  // 19 Comando sepulcral + Mortalha fúnebre: Marcha fantasma
  { ...forma.aoRedor(4), ...trevas, d: '1d6', ef: [ef.atola(30, 3), ef.definha(25, 4), eu(ef.comandar(25, 4)), eu(ef.fantasma(2))], impacto: 'fumaca' },
  // 20 Comando sepulcral + Explosão cadavérica: Sacrifício em massa
  { ...forma.aoRedor(5), ...trevas, d: '3d6', ef: [eu(ef.detona(3, 80))], impacto: 'explosao', camera: 'forte',
    fases: [[0.6, { ...forma.emVolta(5), ...trevas, d: '2d6' }, 'eu']] },
  // 21 Comando sepulcral + Levante profano: Rei dos mortos
  { ...forma.proprio(), ef: [eu(ef.invocaTemp('cavaleiro_da_morte', 1, 15)), eu(ef.comandar(20, 15))], impacto: 'sombra', camera: 'forte' },
  // 22 Ceifa de almas + Mortalha fúnebre: Foice do além
  { ...forma.cone(4, 4), ...trevas, d: '3d6', ef: [eu(ef.fantasma(4)), ef.marca(20, 4)], impacto: 'corte',
    fases: [[4, { ...forma.emVolta(4), ...trevas, d: '4d6' }, 'eu']] },
  // 23 Ceifa de almas + Explosão cadavérica: Ceifa explosiva
  { ...forma.cone(5, 4), ...trevas, d: '2d6', ef: [ef.puxa(3)], impacto: 'corte', fases: [[0.5, { ...forma.emVolta(3), ...trevas, d: '1d6', ef: [eu(ef.detona(3, 90))] }, 'eu']] },
  // 24 Ceifa de almas + Levante profano: Colheita da legião
  { ...forma.cone(4, 3), ...trevas, d: '3d6', ef: [eu(ef.invocaTemp('esqueleto_profano', 2, 8))], impacto: 'corte',
    fases: [[4, { ...forma.proprio(), ef: [eu(ef.invocaTemp('esqueleto_profano', 2, 8))] }, 'eu']] },
  // 25 Mortalha fúnebre + Explosão cadavérica: Mortalha em chamas
  { ...forma.aoRedor(3), ...trevas, d: '5d6', ef: [ef.queima(4, 3), eu(ef.fantasma(2))], impacto: 'explosao', camera: 'forte' },
  // 26 Mortalha fúnebre + Levante profano: Hoste espectral
  { ...forma.proprio(), ef: [eu(ef.invocaTemp('espectro', 4, 10)), eu(ef.intercepta(6, 6))], impacto: 'fumaca' },
  // 27 Explosão cadavérica + Levante profano: Ressurreição detonante
  { ...forma.aoRedor(4), ...trevas, d: '4d6', ef: [eu(ef.detona(2, 70)), eu(ef.invocaTemp('esqueleto_profano', 3, 12))], impacto: 'explosao', camera: 'forte' },
];
