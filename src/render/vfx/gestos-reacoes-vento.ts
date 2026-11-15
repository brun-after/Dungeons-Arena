// Marco 42 (15/11/2026, D-176): o desenho das 9 reações do vento (data/interacoes.json). Cada gesto conta o que o ar
// faz com o estado: a Lâmina de vento corta o arrastado; a Labareda aviva o fogo; a Nevasca levanta o gelo em
// redemoinho; a Tempestade é o raio no meio do vento; a Nuvem tóxica espalha o veneno; a Vertigem gira a cabeça; a
// Tempestade de areia cega; o Vento fúnebre uiva com as almas; a Brisa sagrada acalma o ar.

import { arcoDeGolpe, clarao, ondaDeChoque, orbitar, relampago, tween } from './blocos';
import { brasas, chamaViva, cintilar, nevoa, poeira } from './emissoes';
import { acima, cercar, CORES as K, estourar, faiscar, soltar, subir, type Gesto } from './gestos-base';
import { sai } from './pincel';

const AR = 0xe4f2fa;

export const GESTOS_DO_VENTO: Readonly<Record<string, Gesto>> = {
  /** Lâmina de vento: o golpe corta o ar que arrastava o alvo; dois cortes claros em X. */
  lamina_de_vento: (c, g) => { arcoDeGolpe(c, g.de, g.em, AR, 1.2, 1, 180, 'corte'); arcoDeGolpe(c, g.de, g.em, K.aco, 1, -1, 220); estourar(c, g.em, 'folha', 0x8ab060, 5, 1.1, 360, 0.3); },
  /** Labareda: o vento sopra a chama e ela cresce para os vizinhos. */
  labareda: (c, g) => { cercar(c, g.em, 'chama3', K.fogo, 4, 0.9, 0.8, 520, true); orbitar(c, () => g.em, 'corte', AR, { n: 2, raio: 0.8, ms: 420, voltas: 1, tamanho: 0.7, aditivo: true }); soltar(c, g.em, [brasas(10, { direcao: 'livre' }), chamaViva(3)], K.fogo); },
  /** Nevasca: o vento levanta o gelo em redemoinho de flocos em volta do alvo. */
  nevasca: (c, g) => { orbitar(c, () => g.em, 'gelo', 0xe8f6ff, { n: 5, raio: 0.9, ms: 700, voltas: 2, tamanho: 0.4, aditivo: true, rastro: 2 }); soltar(c, g.em, [nevoa(6, { cor: 0xf0f8ff, raio: 18 })], K.gelo); },
  /** Tempestade: o raio desce no meio do vento que gira e estala para os lados. */
  tempestade: (c, g) => { relampago(c, () => acima(g.em, 3.5), () => g.em, K.raio, 300, 1.3); orbitar(c, () => g.em, 'corte', AR, { n: 3, raio: 0.7, ms: 480, voltas: 1.5, tamanho: 0.8, aditivo: true }); faiscar(c, g.em, K.raio, 3, 1.2); },
  /** Nuvem tóxica: o vento leva o veneno numa nuvem verde que se espalha pelos vizinhos. */
  nuvem_toxica: (c, g) => { soltar(c, g.em, [nevoa(10, { cor: 0x9ad860, raio: 26 })], K.veneno); ondaDeChoque(c, g.em, 0x7ab040, 1.6, 520); subir(c, g.em, 'fumaca1', 0x8ac050, 3, 1, 900, 1, false); },
  /** Vertigem: o ar gira em volta da cabeça exposta e o olho roda junto. */
  vertigem: (c, g) => { orbitar(c, () => acima(g.em, 1), 'corte', AR, { n: 3, raio: 0.4, ms: 700, voltas: 3, tamanho: 0.5, aditivo: true, tangente: true }); tween(c, { textura: 'olho', de: acima(g.em, 1), s: [0.8, 0.8], a: [1, 0], rot: [0, 6], cor: K.psiquico, aditivo: true, ms: 700 }); },
  /** Tempestade de areia: a terra sobe com o vento numa parede de poeira que cobre o alvo. */
  tempestade_de_areia: (c, g) => { soltar(c, g.em, [poeira(16, { cor: 0xd8b878, raio: 22 })], K.terra); orbitar(c, () => g.em, 'rocha', 0xb89868, { n: 4, raio: 0.8, ms: 600, voltas: 1.5, tamanho: 0.35 }); },
  /** Vento fúnebre: as almas uivam no vento e passam pelo alvo marcado. */
  vento_funebre: (c, g) => { for (const lado of [-1, 1]) tween(c, { textura: 'alma', de: { x: g.em.x - lado * 1.2, y: g.em.y - 0.6 }, para: { x: g.em.x + lado * 1.2, y: g.em.y - 0.8 }, s: [0.6, 0.9], a: [0.9, 0], cor: 0xb8a0e0, aditivo: true, ms: 560, curva: sai }); ondaDeChoque(c, g.em, K.trevas, 1.1, 400); },
  /** Brisa sagrada: o ar acalma e o arrasto se desfaz em cintilar. */
  brisa_sagrada: (c, g) => { clarao(c, acima(g.em, 0.5), 0xfff6dc, 1.2, 240); soltar(c, g.em, [cintilar(8)], K.sagrado); subir(c, g.em, 'corte', AR, 3, 1.2, 600, 0.5); },
};
