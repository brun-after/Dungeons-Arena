// A manifestação da runa (marco 39, 12/11/2026, D-151). A assinatura da skill continua contando o que ela é (a corrente
// estica, o redemoinho gira); a runa conta de que ela é feita agora. São duas camadas, feitas à mão:
// - a matéria do elemento (9: o Físico e os 8), com o que cada um deixa no mundo: a brasa sobe e o chão fica queimado,
//   o gelo estilhaça e deixa geada, o raio salta de volta para quem lançou, a terra racha o chão, as trevas puxam almas;
// - o veículo da classe, o jeito de cada uma carregar o elemento: o Guerreiro na lâmina (o arco do golpe na cor da
//   runa), o Mago no círculo rúnico que gira sob o alvo, o Arqueiro no traço da flecha, o Necromante nas almas que
//   sobem do golpe, o Aventureiro nas penas do falcão.
// Tudo cresce com o vínculo (a faixa 0 a 10 que vem na chave): a quantidade, o tamanho, a marca no chão (da faixa 5) e
// o floreio do especialista (da faixa 8: o clarão, o relâmpago de volta, o tremor). O estado do elemento já tem a aura
// que dura no alvo enquanto ele vale (materiais.ts); aqui é o momento do golpe e da conjuração. Só desenho.

import type { Elemento } from '../../combat/elementos';
import type { Emissao } from '../presets-particula';
import { arcoDeGolpe, brotar, circuloNoChao, clarao, feixe, ondaDeChoque, relampago } from './blocos';
import type { Acerto, CenaVfx, P } from './cena';
import { brasas, chamaViva, cintilar, em, faiscasMetal, fumacaEscura, nevoa, poeira } from './emissoes';
import type { TexturaRica } from './texturas';

export type Runa = 'fisico' | Elemento;
export const CLASSES_COM_RUNA = ['guerreiro', 'mago', 'arqueiro', 'necromante', 'aventureiro'] as const;
export type ClasseComRuna = (typeof CLASSES_COM_RUNA)[number];
export const RUNAS_VFX: readonly Runa[] = ['fisico', 'fogo', 'gelo', 'raio', 'veneno', 'psiquico', 'terra', 'trevas', 'sagrado'];

/** A cor de cada runa (a do Físico é o aço). */
export const COR_DA_RUNA: Readonly<Record<Runa, number>> = {
  fisico: 0xd8dde4,
  fogo: 0xff7a2a,
  gelo: 0x9fdcff,
  raio: 0xb89cff,
  veneno: 0x7ad04a,
  psiquico: 0xe07ad8,
  terra: 0xb08a5a,
  trevas: 0x8a5ac8,
  sagrado: 0xffe08a,
};

/** A intensidade (0,35 a 1) pela faixa do vínculo: o iniciante já mostra a runa; o especialista, por inteiro. */
export function intensidadeDaRuna(faixa: number): number {
  return 0.35 + 0.65 * Math.max(0, Math.min(10, faixa)) / 10;
}

const vezes = (n: number, i: number) => Math.max(1, Math.round(n * i));

/** A matéria do elemento no acerto, já na intensidade. */
export function materiaDaRuna(runa: Runa, i: number): Emissao[] {
  const s = 0.8 + 0.4 * i;
  switch (runa) {
    case 'fisico':
      return [faiscasMetal(vezes(6, i)), em({ textura: 'estilhaco', quantidade: vezes(3, i), vidaMs: [260, 420], velocidade: [90, 180], escala: [0.3 * s, 0.1], alpha: [1, 0], raio: 3, cor: 0xe8eef4, giro: [-10, 10] })];
    case 'fogo':
      return [chamaViva(vezes(4, i), { escala: [0.7 * s, 0.2] }), brasas(vezes(6, i))];
    case 'gelo':
      return [em({ textura: 'gelo', quantidade: vezes(6, i), vidaMs: [380, 620], velocidade: [80, 170], gravidade: 380, escala: [0.34 * s, 0.2], alpha: [1, 0], raio: 4, cor: 0xe8f6ff, giro: [-8, 8] }), nevoa(vezes(2, i), { cor: 0xdff4ff })];
    case 'raio':
      return [em({ textura: 'faisca', quantidade: vezes(8, i), vidaMs: [140, 260], velocidade: [160, 320], escala: [0.5 * s, 0.2], alpha: [1, 0], aditivo: true, raio: 3, cor: 0xe6dcff, esticar: 1.4 }), em({ textura: 'cintilar', quantidade: vezes(2, i), vidaMs: [120, 200], escala: [0.6 * s, 1], alpha: [1, 0], aditivo: true, raio: 2, cor: 0xffffff })];
    case 'veneno':
      return [em({ textura: 'bolha', quantidade: vezes(6, i), vidaMs: [500, 900], velocidade: [10, 40], direcao: 'cima', gravidade: -30, escala: [0.15, 0.42 * s], alpha: [0.9, 0], raio: 10, cor: 0x9ae05a }), em({ textura: 'gota_viva', quantidade: vezes(4, i), vidaMs: [320, 520], velocidade: [70, 150], direcao: 'cima', abertura: 1.2, gravidade: 560, escala: [0.2 * s, 0.12], alpha: [1, 0.3], raio: 3, cor: 0x6ac03a })];
    case 'psiquico':
      return [em({ textura: 'runa1', quantidade: vezes(3, i), vidaMs: [500, 800], velocidade: [10, 30], direcao: 'cima', escala: [0.25, 0.42 * s], alpha: [1, 0], aditivo: true, raio: 14, cor: 0xf0a0e8 }), em({ textura: 'onda_som', quantidade: vezes(2, i), vidaMs: [300, 450], velocidade: [60, 120], direcao: 'fora', forma: 'anel', escala: [0.3, 0.8 * s], alpha: [1, 0], aditivo: true, raio: 6, cor: 0xe07ad8 })];
    case 'terra':
      return [em({ textura: 'rocha', quantidade: vezes(5, i), vidaMs: [450, 700], velocidade: [100, 200], direcao: 'cima', abertura: 1.1, gravidade: 620, escala: [0.3 * s, 0.2], alpha: [1, 0.7], raio: 6, cor: 0x8a7258, giro: [-6, 6] }), poeira(vezes(4, i))];
    case 'trevas':
      return [em({ textura: 'alma', quantidade: vezes(3, i), vidaMs: [600, 900], velocidade: [30, 70], direcao: 'cima', gravidade: -50, escala: [0.35, 0.5 * s], alpha: [0.9, 0], aditivo: true, raio: 8, cor: 0xb08ae8 }), fumacaEscura(vezes(3, i))];
    case 'sagrado':
      return [cintilar(vezes(6, i)), em({ textura: 'estrela', quantidade: vezes(4, i), vidaMs: [400, 600], velocidade: [40, 100], direcao: 'cima', gravidade: 160, escala: [0.35 * s, 0.15], alpha: [1, 0], aditivo: true, raio: 6, cor: 0xffe070, giro: [-6, 6] })];
  }
}

/** A conjuração: um fio da matéria na mão de quem lança (menos que no acerto). */
export function conjuracaoDaRuna(runa: Runa, i: number): Emissao[] {
  return materiaDaRuna(runa, i * 0.4).map((e) => ({ ...e, quantidade: Math.max(1, Math.round(e.quantidade / 2)), velocidade: [e.velocidade[0] * 0.5, e.velocidade[1] * 0.5] }));
}

/** O que fica no chão (da faixa 5). */
const MARCA_DA_RUNA: Partial<Record<Runa, { nome: TexturaRica; cor: number; aditivo?: boolean }>> = {
  fogo: { nome: 'queimado', cor: 0x1a1210 },
  gelo: { nome: 'geada', cor: 0xd8f0ff, aditivo: true },
  veneno: { nome: 'poca_veneno', cor: 0x4a9a3a },
  terra: { nome: 'rachadura', cor: 0x2a2018 },
  fisico: { nome: 'rachadura', cor: 0x3a3430 },
};

/** O veículo da classe: como ela carrega o elemento até o alvo. */
function veiculo(c: CenaVfx, classe: ClasseComRuna, a: Acerto, cor: number, i: number): void {
  const tam = (0.7 + 0.5 * i) * a.escala;
  switch (classe) {
    case 'guerreiro':
      arcoDeGolpe(c, a.de, a.ate, cor, tam, a.indice % 2 === 0 ? 1 : -1, 220);
      return;
    case 'mago':
      circuloNoChao(c, () => a.ate, 'circulo_runico', cor, 1.1 * tam, 520, 1.4);
      return;
    case 'arqueiro':
      if (a.de) feixe(c, a.de, a.ate, cor, 0.35 * tam, 220);
      return;
    case 'necromante':
      c.particulas.emitirLista([em({ textura: 'alma', quantidade: vezes(3, i), vidaMs: [600, 900], velocidade: [20, 50], direcao: 'cima', gravidade: -60, escala: [0.3, 0.55 * tam], alpha: [0.85, 0], aditivo: true, raio: 6, cor })], a.ate.x, a.ate.y, cor);
      return;
    case 'aventureiro':
      c.particulas.emitirLista([em({ textura: 'pena', quantidade: vezes(4, i), vidaMs: [600, 900], velocidade: [40, 110], gravidade: 40, arrasto: 1.5, escala: [0.4 * tam, 0.3], alpha: [1, 0], raio: 6, cor, giro: [-4, 4] })], a.ate.x, a.ate.y, cor);
      return;
  }
}

/** O floreio do especialista (faixa 8+), só no primeiro alvo: cada elemento fecha o golpe do seu jeito. */
function floreio(c: CenaVfx, runa: Runa, a: Acerto, cor: number): void {
  const de = a.de;
  switch (runa) {
    case 'fogo':
      clarao(c, a.ate, cor, 1.4);
      return;
    case 'gelo':
      brotar(c, a.ate, 'estilhaco', 0xe8f6ff, 1.2, 420, true);
      return;
    case 'raio':
      // O raio salta de volta para quem lançou: o especialista é o para-raios do próprio golpe.
      if (de) relampago(c, () => a.ate, () => de, cor, 200, 0.6);
      return;
    case 'terra':
      ondaDeChoque(c, a.ate, cor, 1.2, 360, 'rachadura');
      c.tremor('leve');
      return;
    case 'trevas':
      brotar(c, a.ate, 'mao_ossea', cor, 1, 620);
      return;
    case 'sagrado':
      ondaDeChoque(c, a.ate, cor, 1.1, 420, 'clarao');
      return;
    case 'psiquico':
      brotar(c, a.ate, 'olho', cor, 0.9, 520, true);
      return;
    case 'veneno':
      ondaDeChoque(c, a.ate, cor, 0.9, 420, 'poca_veneno');
      return;
    case 'fisico':
      clarao(c, a.ate, 0xffffff, 1.1, 120);
      return;
  }
}

export const ehClasseComRuna = (v: string | undefined): v is ClasseComRuna => !!v && (CLASSES_COM_RUNA as readonly string[]).includes(v);

/** A runa no acerto: a matéria, o veículo da classe, a marca e o floreio, na intensidade da faixa. */
export function manifestarNoAcerto(c: CenaVfx, classe: ClasseComRuna, runa: Runa, faixa: number, a: Acerto, comParticulas: boolean): void {
  const i = intensidadeDaRuna(faixa);
  const cor = COR_DA_RUNA[runa];
  if (comParticulas) c.particulas.emitirLista(materiaDaRuna(runa, i), a.ate.x, a.ate.y, cor);
  if (a.indice >= 3) return;
  veiculo(c, classe, a, cor, i);
  const marca = MARCA_DA_RUNA[runa];
  if (marca && faixa >= 5) c.marca(marca.nome, a.ate.x, a.ate.y, marca.cor, 0.6 + 0.4 * i, 1800 + 120 * faixa, marca.aditivo);
  if (faixa >= 8 && a.indice === 0 && !c.reduzido) floreio(c, runa, a, cor);
}

/** A runa na mão de quem conjura. */
export function manifestarNaConjuracao(c: CenaVfx, runa: Runa, faixa: number, pos: P): void {
  c.particulas.emitirLista(conjuracaoDaRuna(runa, intensidadeDaRuna(faixa)), pos.x, pos.y, COR_DA_RUNA[runa]);
}
