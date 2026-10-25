// As 28 ultimates do Guerreiro (Grimório v1.2), na ordem dos pares do catálogo. Cada uma é uma habilidade com fases;
// `sub` descreve uma etapa (a mesma forma das skills), lançada `s` segundos depois no mesmo alvo ou célula.
import { ef, eu, forma } from './dsl.mjs';

export const COR = '#d0603f';
export default [
  // 0 Redemoinho + Investida de escudo: Ciclone de aço
  // Marco 24 (25/10/2026, D-098): `animacao: 'giro'` nas ultimates que giram (o corpo roda com a arma e o vento).
  { ...forma.aoRedor(2), d: '3d6', ef: [eu(ef.escudoAc(3, 15, 4)), eu(ef.intercepta(9, 3)), eu(ef.acelera(20, 3))], impacto: 'vento', animacao: 'giro',
    fases: [[1, { ...forma.aoRedor(2), d: '2d6', ef: [eu(ef.escudoAc(3, 15, 4))] }], [2, { ...forma.aoRedor(2), d: '2d6', ef: [eu(ef.escudoAc(3, 15, 4))] }], [3, { ...forma.aoRedor(2), d: '4d6', ef: [ef.empurra(1)] }]] },
  // 1 Redemoinho + Brado: Fúria rodopiante
  { ...forma.aoRedor(3), d: '5d6', ef: [ef.empurra(1)], impacto: 'vento', animacao: 'giro', fases: [[0, { ...forma.aliados(3), ef: [ef.bonus(20, 6)] }]] },
  // 2 Redemoinho + Corrente: Turbilhão de correntes
  { ...forma.aoRedor(4), d: '2d6', ef: [ef.puxa(3)], impacto: 'corte', fases: [[0.5, { ...forma.aoRedor(2), d: '5d6', ef: [ef.atordoa(0.5)] }]] },
  // 3 Redemoinho + Lâmina em brasa: Vórtice ígneo
  { ...forma.aoRedor(3), d: '4d6', el: 'fogo', ef: [ef.queima(4, 4)], impacto: 'chamas', animacao: 'giro',
    fases: [[1, { ...forma.aoRedor(2), d: '2d6', el: 'fogo', ef: [ef.puxa(1)] }], [2, { ...forma.aoRedor(1), d: '3d6', el: 'fogo' }]] },
  // 4 Redemoinho + Desafio: Olho do furacão
  { ...forma.aoRedor(5), ef: [ef.desafia(15, 4), eu(ef.libertar())], impacto: 'anel',
    fases: [[1, { ...forma.aoRedor(1), d: '3d6', ef: [ef.empurra(2)] }], [2, { ...forma.aoRedor(1), d: '3d6', ef: [ef.empurra(2)] }], [3, { ...forma.aoRedor(1), d: '3d6', ef: [ef.empurra(2)] }]] },
  // 5 Redemoinho + Salto esmagador: Meteoro de aço
  { ...forma.area(6, 2), d: '6d6', ef: [ef.atordoa(1), ef.avanca(6)], impacto: 'pedra', camera: 'forte', fases: [[0.3, { ...forma.aoRedor(3), d: '2d6', ef: [ef.empurra(1)] }]] },
  // 6 Redemoinho + Contragolpe: Lâminas em guarda
  { ...forma.aoRedor(2), d: '2d6', ef: [eu(ef.contragolpe('contragolpe_giro', 3)), eu(ef.aparo(50, 3))], impacto: 'vento', animacao: 'giro',
    fases: [[1, { ...forma.aoRedor(2), d: '2d6' }], [2, { ...forma.aoRedor(2), d: '2d6' }]] },
  // 7 Investida de escudo + Brado: Formação de choque
  { ...forma.linha(3), d: '4d6', ef: [ef.avanca(3), ef.empurra(1), ef.atordoa(0.5)], impacto: 'faiscas', fases: [[0, { ...forma.aliados(4), ef: [ef.escudo(6, 6), ef.acelera(30, 2)] }]] },
  // 8 Investida de escudo + Corrente: Aríete acorrentado
  { ...forma.cone(3, 3), d: '2d6', ef: [ef.puxa(2)], impacto: 'corte', fases: [[0.3, { ...forma.linha(4), d: '5d6', ef: [ef.avanca(4), ef.atordoa(0.7)] }]] },
  // 9 Investida de escudo + Lâmina em brasa: Égide flamejante
  { ...forma.linha(3), d: '3d6', el: 'fogo', ef: [ef.avanca(3), eu(ef.rastroFogo(3, 3)), eu(ef.reflexo({ queimando: { valor: 4, duracaoMs: 3000 } }, 5)), eu(ef.escudo(12, 5))], impacto: 'chamas',
    fases: [[5, { ...forma.aoRedor(2), d: '5d6', el: 'fogo' }]] },
  // 10 Investida de escudo + Desafio: Carga do desafiante
  { ...forma.toque(5), d: '4d6', ef: [ef.avanca(5), ef.desafia(20, 4)], impacto: 'faiscas',
    fases: [[0, { ...forma.aoRedor(5), ef: [ef.desafia(15, 4), eu(ef.escudoAc(4, 20, 6)), eu(ef.bonus(25, 6))] }]] },
  // 11 Investida de escudo + Salto esmagador: Queda do bastião
  { ...forma.aliado(6), ef: [ef.escudo(15, 6), eu(ef.avanca(6)), eu(ef.escudo(15, 6))], impacto: 'sagrado', fases: [[0.2, { ...forma.aoRedor(2), d: '3d6', ef: [ef.empurra(2)] }]] },
  // 12 Investida de escudo + Contragolpe: Parede de aço
  { ...forma.linha(3), d: '3d6', ef: [ef.avanca(3), eu(ef.contragolpe('contragolpe_arco', 3)), eu(ef.intercepta(9, 3)), eu(ef.aparo(65, 3))], impacto: 'faiscas' },
  // 13 Brado + Corrente: Chamado às armas
  { ...forma.aliados(6), ef: [ef.bonus(15, 6), ef.escudo(6, 6)], impacto: 'estrelas', fases: [[0, { ...forma.aoRedor(4), d: '2d6', ef: [ef.atordoa(1)] }]] },
  // 14 Brado + Lâmina em brasa: Brado incandescente
  { ...forma.cone(4, 4), d: '4d6', el: 'fogo', ef: [ef.queima(4, 4)], impacto: 'chamas', fases: [[0, { ...forma.aliados(4), ef: [ef.bonus(20, 6), ef.reflexo({ queimando: { valor: 3, duracaoMs: 3000 } }, 6)] }]] },
  // 15 Brado + Desafio: Rugido do tirano
  { ...forma.aoRedor(5), ef: [ef.medo(2), ef.atrasado(2, { desafiado: { pct: 20, duracaoMs: 4000 } })], impacto: 'anel', camera: 'forte' },
  // 16 Brado + Salto esmagador: Estrondo de guerra
  { ...forma.area(5, 2), d: '5d6', ef: [ef.avanca(5), ef.atordoa(0.7)], impacto: 'pedra', camera: 'forte', fases: [[0, { ...forma.aliados(4), ef: [ef.bonus(25, 6)] }]] },
  // 17 Brado + Contragolpe: Brado do desafio
  { ...forma.aliados(3), ef: [ef.contragolpe('contragolpe_arco', 4), ef.bonus(20, 4)], impacto: 'estrelas' },
  // 18 Corrente + Lâmina em brasa: Grilhões em brasa
  { ...forma.tiro(6, 18), d: '3d6', el: 'fogo', ef: [ef.prende(3), ef.queima(4, 4)], mods: ['encadear'], impacto: 'chamas' },
  // 19 Corrente + Desafio: Laço do carrasco
  { ...forma.toque(6), d: '3d6', ef: [ef.puxa(5), ef.prende(3), ef.desafia(50, 3), ef.expoe(25, 3)], impacto: 'corte' },
  // 20 Corrente + Salto esmagador: Arrasto sísmico
  { ...forma.toque(6), d: '3d6', ef: [ef.avanca(6), ef.puxa(3)], impacto: 'pedra', fases: [[0.3, { ...forma.linha(4), d: '3d6', ef: [ef.atordoa(1)] }]] },
  // 21 Corrente + Contragolpe: Desarme
  { ...forma.cone(4, 4), d: '2d6', ef: [ef.puxa(3), ef.semAtaque(2)], impacto: 'corte', fases: [[0, { ...forma.proprio(), ef: [ef.contragolpe('contragolpe_arco', 3)] }]] },
  // 22 Lâmina em brasa + Desafio: Pira desafiadora
  { ...forma.aoRedor(2), d: '2d6', el: 'fogo', ef: [ef.desafia(15, 5), ef.queima(3, 3)], impacto: 'chamas',
    fases: [[1, { ...forma.aoRedor(2), d: '2d6', el: 'fogo', ef: [ef.desafia(15, 2)] }], [2, { ...forma.aoRedor(3), d: '2d6', el: 'fogo' }], [3, { ...forma.aoRedor(3), d: '2d6', el: 'fogo' }], [4, { ...forma.aoRedor(3), d: '3d6', el: 'fogo' }]] },
  // 23 Lâmina em brasa + Salto esmagador: Impacto vulcânico
  { ...forma.area(5, 1), d: '4d6', el: 'fogo', ef: [ef.avanca(5), ef.atordoa(0.5)], impacto: 'explosao', camera: 'forte', fases: [[0.2, { ...forma.linha(5), d: '3d6', el: 'fogo', ef: [ef.queima(5, 4)] }]] },
  // 24 Lâmina em brasa + Contragolpe: Riposta ígnea
  { ...forma.proprio(), ef: [ef.contragolpe('lamina_em_brasa_resposta', 4), ef.aparo(65, 4)], impacto: 'chamas' },
  // 25 Desafio + Salto esmagador: Desafio do titã
  { ...forma.area(6, 2), d: '5d6', ef: [ef.avanca(6), ef.desafia(20, 4), eu(ef.furia(100)), eu(ef.escudo(15, 4))], impacto: 'pedra', camera: 'forte' },
  // 26 Desafio + Contragolpe: Duelo de honra
  { ...forma.toque(5), d: '3d6', ef: [ef.desafia(30, 5), eu(ef.contragolpe('contragolpe_arco', 5)), eu(ef.aparo(65, 5))], impacto: 'corte',
    fases: [[3, { ...forma.toque(5), d: '6d6', ef: [ef.atordoa(2)] }]] },
  // 27 Salto esmagador + Contragolpe: Golpe do juízo
  { ...forma.toque(5), d: '6d6', ef: [ef.avanca(5), ef.executa(25), eu(ef.contragolpe('contragolpe_arco', 2))], impacto: 'pedra', camera: 'forte' },
];

/** Etapas avulsas citadas pelas ultimates do Guerreiro (fora das fases). */
export const EXTRAS = {
  lamina_em_brasa_resposta: { ...forma.cone(3, 3), d: '3d6', el: 'fogo', ef: [ef.atrasado(1, { dano_direto: 8 })], impacto: 'chamas' },
};
