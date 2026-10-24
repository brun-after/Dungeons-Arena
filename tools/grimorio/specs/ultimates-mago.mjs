// As 28 ultimates do Mago (Grimório v1.2), na ordem dos pares do catálogo. Todas mágicas (escalam com Inteligência).
// Uma fase é `[segundos, etapa]` (no alvo ou célula da ultimate) ou `[segundos, etapa, 'eu']` (na célula de quem lança).
import { ef, eu, forma, porElemento } from './dsl.mjs';

const gelo = { el: 'gelo' };
const raio = { el: 'raio' };
const psi = { el: 'psiquico' };

export const TIPO = 'magico';
export default [
  // 0 Lança de gelo + Raio em cadeia: Tempestade cristalina (seis lanças em sequência)
  { ...forma.area(7, 1), ...gelo, d: '2d6', ef: [ef.resfria(30, 3), ef.eletriza(1.5)], impacto: 'cristais',
    fases: [0.3, 0.6, 0.9, 1.2, 1.5].map((s) => [s, { ...forma.area(30, 1, 'celula'), ...gelo, d: '2d6', ef: [ef.resfria(30, 3), ef.eletriza(1.5)] }]) },
  // 1 Lança de gelo + Nova glacial: Inverno eterno
  { ...forma.area(6, 3), ...gelo, d: '2d6', ef: [ef.resfria(40, 6)], impacto: 'cristais',
    fases: [[1.5, { ...forma.area(30, 3, 'celula'), ...gelo, d: '1d6', ef: [ef.resfria(40, 3)] }], [3, { ...forma.area(30, 3, 'celula'), ...gelo, d: '1d6', ef: [ef.resfria(40, 3)] }],
      [4.5, { ...forma.area(30, 3, 'celula'), ...gelo, d: '2d6', ef: [ef.congela(1.5)] }]] },
  // 2 Lança de gelo + Mente partida: Estilhaço mental
  { ...forma.tiro(8, 16), ...gelo, d: '3d6', ef: [ef.silencia(3)], impacto: 'cristais', fases: [[2.5, { ...forma.noAlvo(), ...psi, d: '5d6' }]] },
  // 3 Lança de gelo + Afinidade elemental: Lança dos quatro ventos
  { ...forma.tiro(8, 16), ...gelo, d: '2d6', ef: [ef.resfria(30, 3)], impacto: 'cristais', variantes: porElemento(() => [ef.dano(6)]),
    fases: [[0.2, { ...forma.noAlvo(), el: 'fogo', d: '2d6', ef: [ef.queima(3, 3)] }], [0.4, { ...forma.noAlvo(), ...raio, d: '2d6', ef: [ef.eletriza(2)] }],
      [0.6, { ...forma.noAlvo(), el: 'terra', d: '2d6', ef: [ef.atola(30, 2)] }]] },
  // 4 Lança de gelo + Sobrecarga arcana: Geleira arcana (custa vida)
  { ...forma.tiro(9, 7), ...gelo, d: '6d6', custoVida: 10, custoRecurso: 0, ef: [ef.resfria(40, 4)], mods: ['atravessar', 'maior_e_mais_lenta'], impacto: 'cristais' },
  // 5 Lança de gelo + Piscar: Rastro de geada (pisca e deixa estacas que explodem juntas)
  { ...forma.area(5, 1), ...gelo, d: '2d6', ef: [eu(ef.teleporta()), ef.resfria(30, 3)], impacto: 'cristais',
    fases: [[0, { ...forma.emVolta(1), ...gelo, d: '1d6' }, 'eu'], [1.2, { ...forma.emVolta(2), ...gelo, d: '4d6', ef: [ef.congela(1)] }, 'eu'],
      [1.2, { ...forma.emVolta(2, 'celula'), ...gelo, d: '4d6', ef: [ef.congela(1)] }]] },
  // 6 Lança de gelo + Orbe instável: Cometa congelado
  { ...forma.area(7, 2), ...gelo, d: '5d6', ef: [ef.resfria(40, 3)], impacto: 'explosao', camera: 'forte',
    fases: [[2, { ...forma.area(30, 2, 'celula'), ...gelo, d: '3d6', ef: [ef.congela(1)] }]] },
  // 7 Raio em cadeia + Nova glacial: Supercondutor
  { ...forma.aoRedor(3), ...gelo, d: '2d6', ef: [ef.congela(1.5), eu(ef.sobrecarga(60, 6))], impacto: 'cristais' },
  // 8 Raio em cadeia + Mente partida: Tempestade de pensamentos
  { ...forma.tiro(8, 18), ...raio, d: '3d6', ef: [ef.confunde(2)], mods: ['encadear'], impacto: 'relampago' },
  // 9 Raio em cadeia + Afinidade elemental: Prisma elemental
  { ...forma.aoRedor(4), ...raio, d: '2d6', ef: [ef.eletriza(1.5)], impacto: 'relampago', variantes: porElemento(),
    fases: [1, 2, 3, 4].map((s) => [s, { ...forma.emVolta(4), ...raio, d: '2d6', variantes: porElemento() }, 'eu']) },
  // 10 Raio em cadeia + Sobrecarga arcana: Sobretensão (custa vida)
  { ...forma.tiro(9, 18), ...raio, d: '3d6', custoVida: 8, custoRecurso: 0, ef: [ef.eletriza(2)], mods: ['encadear', 'ecoar'], impacto: 'relampago',
    fases: [[1, { ...forma.noAlvo(), ...raio, d: '5d6' }]] },
  // 11 Raio em cadeia + Piscar: Relâmpago errante
  { ...forma.linha(6), ...raio, d: '4d6', ef: [ef.avanca(6), ef.eletriza(2)], impacto: 'relampago', fases: [[0.3, { ...forma.emVolta(2), ...raio, d: '2d6' }, 'eu']] },
  // 12 Raio em cadeia + Orbe instável: Esfera de plasma (segue o alvo por 5 s)
  { ...forma.noAlvo(), alcance: 8, ...raio, d: '2d6', ef: [ef.eletriza(1.5)], impacto: 'relampago',
    fases: [1, 2, 3, 4, 5].map((s) => [s, { ...forma.emVolta(3), ...raio, d: '2d6' }]) },
  // 13 Nova glacial + Mente partida: Silêncio glacial
  { ...forma.area(6, 2), ...gelo, d: '2d6', ef: [ef.congela(1), ef.silencia(3)], impacto: 'cristais',
    fases: [1, 2, 3].map((s) => [s, { ...forma.area(30, 2, 'celula'), ...psi, d: '1d6+2' }]) },
  // 14 Nova glacial + Afinidade elemental: Zero absoluto
  { ...forma.aoRedor(5), ...gelo, d: '2d6', ef: [ef.resfria(40, 6), ef.expoe(25, 6)], impacto: 'cristais', camera: 'forte' },
  // 15 Nova glacial + Sobrecarga arcana: Nova cataclísmica (custa vida)
  { ...forma.aoRedor(2), ...gelo, d: '3d6', custoVida: 12, custoRecurso: 0, ef: [ef.resfria(30, 3)], impacto: 'cristais',
    fases: [[0.5, { ...forma.emVolta(3), ...gelo, d: '3d6' }, 'eu'], [1, { ...forma.emVolta(4), ...gelo, d: '4d6', ef: [ef.atordoa(1)] }, 'eu']] },
  // 16 Nova glacial + Piscar: Passo do inverno
  { ...forma.aoRedor(2), ...gelo, d: '2d6', ef: [ef.resfria(30, 3), eu(ef.zera('piscar')), eu(ef.pressa(75, 4))], impacto: 'cristais' },
  // 17 Nova glacial + Orbe instável: Coração de gelo
  { ...forma.area(6, 3), ...gelo, d: '1d6', ef: [ef.puxa(1), ef.resfria(30, 3)], impacto: 'cristais',
    fases: [[1, { ...forma.area(30, 3, 'celula'), ...gelo, d: '1d6', ef: [ef.puxa(1)] }], [2, { ...forma.area(30, 3, 'celula'), ...gelo, d: '1d6', ef: [ef.puxa(1)] }],
      [3, { ...forma.area(30, 3, 'celula'), ...gelo, d: '5d6', ef: [ef.congela(1)] }]] },
  // 18 Mente partida + Afinidade elemental: Mente elemental
  { ...forma.tiro(8, 18), ...psi, d: '2d6', ef: [ef.marca(25, 6), eu(ef.critico(6))], impacto: 'runas' },
  // 19 Mente partida + Sobrecarga arcana: Colapso psíquico
  { ...forma.tiro(8, 16), ...psi, d: '6d6', ef: [ef.silencia(2)], impacto: 'runas', fases: [[0.3, { ...forma.emVolta(3), ...psi, d: '1d6', ef: [ef.silencia(2)] }]] },
  // 20 Mente partida + Piscar: Labirinto da mente
  { ...forma.proprio(), ...psi, ef: [eu(ef.invocaTemp('copia_ilusoria', 3, 6)), eu(ef.invisivel(1.5))], impacto: 'runas' },
  // 21 Mente partida + Orbe instável: Singularidade
  { ...forma.area(7, 3), ...psi, d: '1d6', ef: [ef.puxa(2), ef.silencia(3)], impacto: 'sombra', camera: 'forte',
    fases: [[1, { ...forma.area(30, 3, 'celula'), ...psi, d: '1d6', ef: [ef.puxa(1)] }], [2, { ...forma.area(30, 3, 'celula'), ...psi, d: '1d6', ef: [ef.puxa(1)] }],
      [3, { ...forma.area(30, 2, 'celula'), ...psi, d: '6d6' }]] },
  // 22 Afinidade elemental + Sobrecarga arcana: Ascensão arcana
  { ...forma.proprio(), ef: [eu(ef.bonus(30, 8)), eu(ef.pressa(30, 8))], impacto: 'runas' },
  // 23 Afinidade elemental + Piscar: Dança dos elementos
  { ...forma.noAlvo(), alcance: 6, el: 'fogo', d: '2d6', ef: [ef.queima(3, 3)], impacto: 'explosao',
    fases: [[0.3, { ...forma.emVolta(1), ...gelo, d: '2d6', ef: [ef.resfria(30, 3)] }], [0.6, { ...forma.emVolta(1), ...raio, d: '2d6', ef: [ef.eletriza(2)] }],
      [0.9, { ...forma.emVolta(2), el: 'terra', d: '3d6', ef: [ef.atola(30, 2)] }]] },
  // 24 Afinidade elemental + Orbe instável: Orbe da fusão
  { ...forma.area(7, 3), d: '5d6', impacto: 'explosao', camera: 'forte', variantes: porElemento() },
  // 25 Sobrecarga arcana + Piscar: Ruptura dimensional
  { ...forma.linha(7), el: 'trevas', d: '5d6', ef: [ef.avanca(7), ef.executa(20)], impacto: 'sombra', camera: 'forte' },
  // 26 Sobrecarga arcana + Orbe instável: Supernova (canaliza 2 s)
  { ...forma.aoRedor(7), d: '8d6', conjuracaoMs: 2000, interrupcao: 'ininterrupta', impacto: 'explosao', camera: 'forte' },
  // 27 Piscar + Orbe instável: Eco do vazio
  { ...forma.area(6, 1), d: '2d6', ef: [eu(ef.teleporta())], impacto: 'runas', fases: [[2, { ...forma.emVolta(3, 'celula'), d: '6d6' }, 'eu']] },
];
