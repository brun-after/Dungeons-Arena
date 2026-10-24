// As 28 ultimates do Arqueiro (Grimório v1.2), na ordem dos pares do catálogo. Físicas (escalam com Força; o arco usa
// Destreza pela regra de sempre). Fases: `[segundos, etapa]` no alvo/célula, `[segundos, etapa, 'eu']` na célula de quem lança.
import { ef, eu, forma } from './dsl.mjs';

const flecha = (alcance = 8, vel = 18) => ({ ...forma.tiro(alcance, vel), projetil: 'flecha' });
const prende = { enraizado: 1500 };

export const TIPO = 'fisico';
export default [
  // 0 Flecha perfurante + Chuva de flechas: Lança dos céus
  { ...forma.linha(8), d: '5d6', ef: [ef.sangra(3, 3)], impacto: 'chuva', camera: 'forte' },
  // 1 Flecha perfurante + Tiro em leque: Leque perfurante
  { ...forma.cone(6, 4), d: '4d6', ef: [ef.sangra(3, 4)], mods: ['atravessar'], impacto: 'leque' },
  // 2 Flecha perfurante + Armadilha de caça: Fio de disparo
  { ...forma.linha(6), d: '2d6', ef: [ef.enraiza(1.5), ef.armadilha(10, prende, 20)], impacto: 'farpas', fases: [[0.4, { ...forma.noAlvo(), d: '3d6' }]] },
  // 3 Flecha perfurante + Olho de águia: Tiro do falcão-rei (mira 1,5 s)
  { ...flecha(20, 30), d: '6d6', conjuracaoMs: 1500, ef: [eu(ef.critico(3))], mods: ['atravessar'], impacto: 'farpas', camera: 'forte' },
  // 4 Flecha perfurante + Flecha explosiva: Flecha do cataclismo
  { ...flecha(9, 18), d: '4d6', mods: ['atravessar', 'ecoar'], impacto: 'explosao', fases: [[0.3, { ...forma.emVolta(2), d: '3d6', ef: [ef.empurra(1)] }]] },
  // 5 Flecha perfurante + Rolamento: Tiro de retirada
  { ...flecha(8, 18), d: '3d6', ef: [eu(ef.passo(4))], mods: ['atravessar'], impacto: 'farpas',
    fases: [[0.25, { ...forma.noAlvo(), d: '2d6' }], [0.5, { ...forma.noAlvo(), d: '2d6' }]] },
  // 6 Flecha perfurante + Marca do caçador: Sentença do caçador
  { ...flecha(20, 20), d: '5d6', ef: [ef.executa(25), ef.marcaCacador(20, 6)], mods: ['atravessar'], impacto: 'farpas', camera: 'forte' },
  // 7 Chuva de flechas + Tiro em leque: Céu de aço (avança por 4 s)
  { ...forma.area(6, 2), d: '2d6', impacto: 'chuva',
    fases: [1, 2, 3, 4].map((s) => [s, { ...forma.area(30, 2, 'celula'), d: '2d6', ef: [ef.atola(20, 1)] }]) },
  // 8 Chuva de flechas + Armadilha de caça: Campo minado
  { ...forma.area(6, 2), d: '2d6', ef: [ef.armadilha(8, prende, 20)], impacto: 'chuva', fases: [[2, { ...forma.area(30, 2, 'celula'), d: '2d6' }]] },
  // 9 Chuva de flechas + Olho de águia: Olhar da tempestade
  { ...forma.proprio(), ef: [eu(ef.bonus(25, 6)), eu(ef.pressa(30, 6))], impacto: 'estrelas', fases: [[0, { ...forma.emVolta(6), d: '2d6' }, 'eu']] },
  // 10 Chuva de flechas + Flecha explosiva: Bombardeio
  { ...forma.area(7, 3), d: '3d6', el: 'fogo', ef: [ef.empurra(2)], impacto: 'explosao', camera: 'forte',
    fases: [[0.5, { ...forma.area(30, 3, 'celula'), el: 'fogo', d: '2d6', ef: [ef.empurra(1)] }], [1, { ...forma.area(30, 3, 'celula'), el: 'fogo', d: '2d6' }]] },
  // 11 Chuva de flechas + Rolamento: Chuva em fuga
  { ...forma.aoRedor(2), d: '2d6', ef: [eu(ef.passo(3)), eu(ef.zera('rolamento'))], impacto: 'chuva', fases: [[0.6, { ...forma.emVolta(2, 'celula'), d: '3d6' }]] },
  // 12 Chuva de flechas + Marca do caçador: Cerco do caçador
  { ...forma.noAlvo(), alcance: 8, d: '2d6', ef: [ef.marcaCacador(20, 6)], impacto: 'chuva', fases: [[0.2, { ...forma.emVolta(3), d: '2d6', ef: [ef.enraiza(1.5)] }]] },
  // 13 Tiro em leque + Armadilha de caça: Rede de caça
  { ...forma.cone(4, 4), d: '2d6', ef: [ef.resfria(40, 3), ef.prende(2)], impacto: 'leque' },
  // 14 Tiro em leque + Olho de águia: Salva certeira (cinco leques em 2 s)
  { ...forma.cone(4, 4), d: '2d6', impacto: 'leque',
    fases: [0.5, 1, 1.5, 2].map((s, i) => [s, { ...forma.cone(4, 3 - Math.floor(i / 2)), d: '2d6', ...(i === 3 ? { ef: [ef.expoe(25, 3)] } : {}) }, 'eu']) },
  // 15 Tiro em leque + Flecha explosiva: Leque incendiário
  { ...forma.cone(5, 4), d: '3d6', el: 'fogo', ef: [ef.queima(4, 4), eu(ef.rastroFogo(3, 3))], impacto: 'explosao' },
  // 16 Tiro em leque + Rolamento: Pirueta mortal
  { ...forma.aoRedor(4), d: '4d6', ef: [eu(ef.passo(2)), eu(ef.esquiva(30, 2))], impacto: 'leque' },
  // 17 Tiro em leque + Marca do caçador: Matilha de flechas
  { ...forma.aoRedor(7), d: '3d6', ef: [ef.marcaCacador(15, 6)], impacto: 'farpas' },
  // 18 Armadilha de caça + Olho de águia: Tocaia
  { ...forma.aoRedor(2, 'celula'), ef: [ef.armadilha(10, prende, 30), eu(ef.invisivel(2)), eu(ef.critico(4))], impacto: 'farpas' },
  // 19 Armadilha de caça + Flecha explosiva: Mina de estilhaços
  { ...forma.area(6, 2), d: '1d6', ef: [ef.puxa(2)], impacto: 'farpas', fases: [[0.6, { ...forma.area(30, 2, 'celula'), d: '5d6', el: 'fogo', ef: [ef.sangra(3, 3)] }]] },
  // 20 Armadilha de caça + Rolamento: Rota de fuga
  { ...forma.celula(4), ef: [eu(ef.passo(3)), eu(ef.zera('rolamento')), eu(ef.armadilha(8, prende, 20))], impacto: 'farpas' },
  // 21 Armadilha de caça + Marca do caçador: Caçada guiada
  { ...forma.noAlvo(), alcance: 8, d: '2d6', ef: [ef.marcaCacador(30, 8), ef.armadilha(10, prende, 20)], impacto: 'farpas' },
  // 22 Olho de águia + Flecha explosiva: Ponto de impacto (mira 1 s)
  { ...forma.area(9, 3), d: '5d6', el: 'fogo', conjuracaoMs: 1000, impacto: 'explosao', camera: 'forte', fases: [[0, { ...forma.emVolta(0, 'celula'), d: '5d6', el: 'fogo' }]] },
  // 23 Olho de águia + Rolamento: Mira inabalável
  { ...forma.proprio(), ef: [eu(ef.libertar()), eu(ef.zera('rolamento')), eu(ef.pressa(50, 6)), eu(ef.bonus(20, 6))], impacto: 'estrelas' },
  // 24 Olho de águia + Marca do caçador: Olho do predador
  { ...forma.aoRedor(8), ef: [ef.marcaCacador(20, 6), eu(ef.pressa(30, 6))], impacto: 'estrelas' },
  // 25 Flecha explosiva + Rolamento: Rastro explosivo
  { ...forma.celula(4), ef: [eu(ef.passo(4)), eu(ef.armadilha(14, { queimando: { valor: 4, duracaoMs: 3000 } }, 15))], impacto: 'explosao' },
  // 26 Flecha explosiva + Marca do caçador: Presa marcada
  { ...forma.noAlvo(), alcance: 8, d: '2d6', ef: [ef.marcaCacador(20, 4)], impacto: 'explosao', fases: [[2, { ...forma.emVolta(2), el: 'fogo', d: '6d6' }]] },
  // 27 Rolamento + Marca do caçador: Dança do caçador
  { ...flecha(8, 20), d: '2d6', ef: [ef.marcaCacador(20, 6), eu(ef.esquiva(30, 5))], impacto: 'farpas',
    fases: [1, 2, 3, 4, 5].map((s) => [s, { ...forma.noAlvo(), d: '2d6', ef: [ef.marcaCacador(20, 3)] }]) },
];
