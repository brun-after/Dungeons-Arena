// D-173 (14/11/2026): o desenho de cada uma das 42 reações elementais (data/interacoes.json, `sinergias`). Cada gesto
// conta o que a reação faz: a Forja bate o ferro em brasa; o Vapor sobe em nuvem; o Juízo é o raio do céu no círculo
// consagrado; o Túmulo é a lápide com as mãos. Antes, a reação só subia como texto no alvo.

import { arcoDeGolpe, brotar, cair, circuloNoChao, clarao, clarear, cupula, escurecer, feixe, ondaDeChoque, orbitar, relampago, tween } from './blocos';
import { brasas, chamaViva, cintilar, faiscasMetal, fumacaEscura, nevoa, poeira } from './emissoes';
import { acima, cercar, chover, CORES as K, estourar, faiscar, fechar, lancar, soltar, subir, type Gesto } from './gestos-base';
import { elastica, sai } from './pincel';
import { QUADROS_CHAMA } from './texturas';

export const GESTOS_DAS_REACOES: Readonly<Record<string, Gesto>> = {
  // ----- O golpe físico sobre um estado.
  /** Forja: o ferro bate na brasa — a lâmina incandescente e as fagulhas em leque. */
  forja: (c, g) => { lancar(c, g, 'lamina', 0xffb060, 1); soltar(c, g.em, [faiscasMetal(10, { cores: [0xffffff, 0xffc060, 0xff6020] }), brasas(6)], K.fogo); clarao(c, g.em, 0xffc060, 1.3); },
  /** Estilhaçar: o gelo que prendia parte em cacos para todo lado. */
  estilhacar: (c, g) => { estourar(c, g.em, 'gelo', 0xe8f6ff, 10, 1.4, 340, 0.6); estourar(c, g.em, 'estilhaco', K.gelo, 6, 0.9, 260, 0.5); ondaDeChoque(c, g.em, K.gelo, 1.2, 300); c.marca('geada', g.em.x, g.em.y, 0xd8f0ff, 1.4, 2500); },
  /** Condutor: a carga escapa do corpo pelo aço e salta para o chão em volta. */
  condutor: (c, g) => { faiscar(c, g.em, K.raio, 4, 1.4); lancar(c, g, 'lamina', 0xffffc0, 0.8); soltar(c, g.em, [faiscasMetal(8, { cores: [0xffffff, 0xfff2a0, 0xa0d8ff], gravidade: 100 })], K.raio); },
  /** Ferida aberta: o corte abre e o veneno escorre com o sangue. */
  ferida_aberta: (c, g) => { arcoDeGolpe(c, g.de, g.em, K.sangue, 1.1); estourar(c, g.em, 'gota_viva', K.veneno, 6, 0.8, 380, 0.45); c.marca('poca_veneno', g.em.x, g.em.y, 0x6aa040, 1.1, 3000); },
  /** Golpe certeiro: a mira fecha no ponto fraco e o golpe entra nele. */
  golpe_certeiro: (c, g) => { tween(c, { textura: 'mira_alvo', de: acima(g.em, 0.4), s: [2.2, 0.6], a: [0.4, 1], rot: [0.8, 0], cor: 0xffe070, aditivo: true, ms: 260, aoFim: () => { clarao(c, acima(g.em, 0.4), 0xffffff, 1.6); } }); },
  /** Esmagar: a pedra cai sobre o preso e as raízes partem. */
  esmagar: (c, g) => { cair(c, g.em, 'rocha', 0x9a8468, { altura: 3, ms: 240, tamanho: 1.6, aoChegar: () => { estourar(c, g.em, 'espinho', 0x8a6f4a, 6, 1, 300, 0.5); c.marca('rachadura', g.em.x, g.em.y, 0x4a3a28, 1.5, 3000); soltar(c, g.em, [poeira(8)], K.terra); c.tremor('leve'); } }); },
  /** Quebra-alma: a alma marcada sai do corpo partida em duas. */
  quebra_alma: (c, g) => { for (const lado of [-1, 1]) tween(c, { textura: 'alma', de: acima(g.em, 0.4), para: { x: g.em.x + lado * 0.9, y: g.em.y - 1.2 }, s: [0.9, 0.5], a: [1, 0], rot: [0, lado * 0.8], cor: K.trevas, aditivo: true, ms: 520, curva: sai }); estourar(c, acima(g.em, 0.4), 'estilhaco', clarear(K.trevas, 0.4), 5, 0.7, 260, 0.4); },
  /** Aço sagrado: a lâmina desce como um raio de luz sobre o consagrado. */
  aco_sagrado: (c, g) => { feixe(c, acima(g.em, 4), g.em, K.sagrado, 0.8, 320); cair(c, g.em, 'lamina', 0xfff8d8, { altura: 3, ms: 220, tamanho: 1.4, aditivo: true, aoChegar: () => { soltar(c, g.em, [cintilar(8)], K.sagrado); } }); },

  // ----- O fogo.
  /** Vapor: o fogo no frio levanta uma nuvem branca que cobre o alvo. */
  vapor: (c, g) => { subir(c, g.em, 'fumaca1', 0xf4f8ff, 6, 1.6, 900, 1.3, false); soltar(c, g.em, [nevoa(8, { cor: 0xf0f6ff, raio: 20 })], 0xffffff); ondaDeChoque(c, g.em, 0xffffff, 1.3, 420); },
  /** Plasma: a carga pega fogo e vira uma bola branca e violeta que crepita. */
  plasma: (c, g) => { orbitar(c, () => g.em, 'clarao', 0xd8b0ff, { n: 3, raio: 0.5, ms: 420, voltas: 2, tamanho: 0.9, aditivo: true }); faiscar(c, g.em, 0xffffff, 3, 1.1); soltar(c, g.em, [chamaViva(5)], K.fogo); },
  /** Plasma (pelo raio): a chama que já queimava sobe em coluna e o raio a atravessa. */
  plasma_raio: (c, g) => { subir(c, g.em, 'chama3', 0xffc060, 4, 1.4, 420, 0.9); relampago(c, () => acima(g.em, 3), () => g.em, 0xd8b0ff, 260, 1.2); clarao(c, g.em, 0xffffff, 1.5); },
  /** Combustão: o veneno pega fogo e estoura em chama verde. */
  combustao: (c, g) => { tween(c, { textura: 'chama0', quadros: QUADROS_CHAMA, de: g.em, s: [0.6, 2.2], a: [1, 0], cor: 0xb8ff60, aditivo: true, ms: 420, subir: -20 }); ondaDeChoque(c, g.em, K.veneno, 1.5, 360); soltar(c, g.em, [brasas(8, { cores: [0xffffff, 0xd8ff70, 0x70c020, 0x204a0a] }), fumacaEscura(4)], K.veneno); },
  /** Pânico em chamas: o olho arregala e as labaredas lambem em volta. */
  panico_em_chamas: (c, g) => { tween(c, { textura: 'olho', de: acima(g.em, 1), s: [0.3, 1.1], sy: [0.05, 1], a: [1, 0], cor: 0xffb060, aditivo: true, ms: 620, curva: elastica }); cercar(c, g.em, 'chama2', K.fogo, 5, 0.6, 0.7, 700, true); },
  /** Magma: a terra que prendia derrete — o chão fica em brasa e cospe pedra. */
  magma: (c, g) => { c.marca('queimado', g.em.x, g.em.y, 0xff5a10, 1.8, 3500, true); cercar(c, g.em, 'rocha', 0x5a2a10, 4, 0.5, 0.7, 800); soltar(c, g.em, [brasas(10, { direcao: 'cima' }), chamaViva(4)], K.fogo); },
  /** Pira fúnebre: a coluna de fogo roxo sobe com a caveira no meio. */
  pira_funebre: (c, g) => { feixe(c, g.em, acima(g.em, 3.5), 0xb060ff, 1.4, 520); tween(c, { textura: 'cranio', de: acima(g.em, 0.4), para: acima(g.em, 2), s: [0.7, 1.1], a: [1, 0], cor: 0xf0d8ff, aditivo: true, ms: 620 }); soltar(c, g.em, [chamaViva(6, { cores: [0xffffff, 0xd8a0ff, 0x8a40d0, 0x30104a] })], K.trevas); },
  /** Fogo purificador: a chama branca gira subindo e deixa só luz. */
  fogo_purificador: (c, g) => { orbitar(c, () => g.em, 'chama4', 0xfff4d0, { n: 4, raio: 0.6, ms: 620, voltas: 1.5, tamanho: 0.8, aditivo: true, rastro: 2 }); subir(c, g.em, 'cintilar', K.sagrado, 5, 1.6, 700, 0.6); },

  // ----- O gelo.
  /** Cristal carregado: o gelo vira um cristal com o raio preso dentro. */
  cristal_carregado: (c, g) => { brotar(c, g.em, 'gelo', 0xd8f0ff, 1.8, 800, true); relampago(c, () => acima(g.em, 1.1), () => g.em, K.raio, 420, 0.8); faiscar(c, acima(g.em, 0.5), 0xffffff, 3, 0.8); },
  /** Veneno gelado: o veneno congela em espinhos verdes que brotam do alvo. */
  veneno_gelado: (c, g) => { cercar(c, g.em, 'espinho', 0x9fe8c0, 5, 0.5, 0.9, 800, true); soltar(c, g.em, [nevoa(4, { cor: 0xc8f0d8, raio: 12 })], K.gelo); },
  /** Mente congelada: um cristal fecha sobre a cabeça e trinca. */
  mente_congelada: (c, g) => { tween(c, { textura: 'gelo', de: acima(g.em, 1.1), s: [0.3, 1.2], a: [1, 1], cor: 0xe8f6ff, aditivo: true, ms: 300, curva: elastica, aoFim: () => { estourar(c, acima(g.em, 1.1), 'estilhaco', K.gelo, 6, 0.7, 300, 0.4); } }); },
  /** Fossilizar: a pedra sobe pelo corpo congelado e fecha sobre ele. */
  fossilizar: (c, g) => { fechar(c, g.em, 'rocha', 0x9a8468, 6, 1.2, 380, 0.8, () => { cupula(c, () => g.em, 0x8a7258, 520, 0.6); soltar(c, g.em, [poeira(6)], K.terra); }); },
  /** Gelo negro: a geada escura se espalha no chão e as sombras sobem dela. */
  gelo_negro: (c, g) => { c.marca('geada', g.em.x, g.em.y, 0x40305a, 2, 3500); subir(c, g.em, 'alma', 0x8a70c0, 3, 1.2, 800, 0.6); ondaDeChoque(c, g.em, 0x5a4a8a, 1.3, 420); },
  /** Orvalho: gotas de luz caem sobre o frio e o derretem. */
  orvalho: (c, g) => { chover(c, g.em, 'gota_viva', 0xd8f4ff, 5, 0.7, 0.5, (p) => { soltar(c, p, [cintilar(2)], K.sagrado); }); },

  // ----- O raio e a mente.
  /** Neurotoxina: o choque corre pelos nervos em ramos verdes. */
  neurotoxina: (c, g) => { faiscar(c, acima(g.em, 0.5), 0xb8ff60, 5, 1, 300); tween(c, { textura: 'olho', de: acima(g.em, 1), s: [0.8, 0.3], a: [1, 0], cor: 0xb8ff60, aditivo: true, ms: 400 }); },
  /** Sobrecarga: a mente transborda — as runas saltam da cabeça com a descarga. */
  sobrecarga: (c, g) => { estourar(c, acima(g.em, 1), 'runa2', K.psiquico, 6, 1, 420, 0.5); faiscar(c, acima(g.em, 1), K.raio, 3, 0.9); clarao(c, acima(g.em, 1), K.psiquico, 1.3); },
  /** Aterramento: o raio desce do céu, corre pelas raízes e some no chão. */
  aterramento: (c, g) => { relampago(c, () => acima(g.em, 4), () => g.em, K.raio, 280, 1.4); c.marca('rachadura', g.em.x, g.em.y, 0xfff2a0, 1.6, 1200, true); ondaDeChoque(c, g.em, K.raio, 1.4, 320); },
  /** Tempestade negra: a nuvem escura fecha sobre o marcado e solta o raio. */
  tempestade_negra: (c, g) => { tween(c, { textura: 'fumaca2', de: acima(g.em, 2.2), s: [0.8, 2.2], a: [0.9, 0], cor: 0x2a2040, ms: 700 }); relampago(c, () => acima(g.em, 2.2), () => g.em, 0xc8a0ff, 300, 1.2); soltar(c, g.em, [fumacaEscura(4)], K.trevas); },
  /** Juízo: o raio dourado cai do céu no círculo consagrado. */
  juizo: (c, g) => { circuloNoChao(c, () => g.em, 'circulo_runico', K.sagrado, 2, 700, 1); feixe(c, acima(g.em, 5), g.em, 0xfff8d0, 1.6, 360); clarao(c, g.em, 0xffffff, 2); c.tremor('leve'); },
  /** Peso da mente: um bloco invisível desce sobre a cabeça e afunda o preso. */
  peso_da_mente: (c, g) => { cair(c, acima(g.em, 0.6), 'hexagono', K.psiquico, { altura: 2.5, ms: 260, tamanho: 1.3, aditivo: true, aoChegar: () => { ondaDeChoque(c, g.em, K.psiquico, 1.1, 300); } }); },
  /** Pesadelo: a mão sai da sombra do marcado e o olho abre atrás dele. */
  pesadelo: (c, g) => { brotar(c, g.em, 'mao_ossea', 0x9a70d0, 1.2, 900); tween(c, { textura: 'olho', de: acima(g.em, 1.5), s: [0.2, 1.3], sy: [0.05, 1.1], a: [1, 0], cor: K.psiquico, aditivo: true, ms: 800, curva: elastica }); },

  // ----- O veneno.
  /** Delírio: os olhos giram em volta da cabeça do exposto. */
  delirio: (c, g) => { orbitar(c, () => acima(g.em, 0.9), 'olho', 0xb8ff60, { n: 3, raio: 0.5, ms: 800, voltas: 1.5, tamanho: 0.5, aditivo: true }); },
  /** Lama ácida: a poça borbulha em volta das raízes. */
  lama_acida: (c, g) => { c.marca('poca_veneno', g.em.x, g.em.y, 0x8a9a30, 1.8, 3500); subir(c, g.em, 'gota_viva', 0xc8e040, 5, 0.7, 600, 0.4); },
  /** Putrefação: a caveira aparece e as cinzas rodam como moscas. */
  putrefacao: (c, g) => { tween(c, { textura: 'cranio', de: acima(g.em, 0.8), s: [0.4, 1], a: [1, 0], cor: 0xa8c080, aditivo: true, ms: 700 }); orbitar(c, () => acima(g.em, 0.6), 'cinza', 0x40502a, { n: 6, raio: 0.6, ms: 800, voltas: 2, tamanho: 0.4 }); },
  /** Purgar: o veneno sai em gotas e vira luz no ar. */
  purgar: (c, g) => { subir(c, g.em, 'gota_viva', K.veneno, 4, 1.1, 500, 0.45); subir(c, acima(g.em, 0.8), 'cintilar', K.sagrado, 4, 0.9, 700, 0.6); },
  /** Peste: a nuvem verde fecha e as caveiras pequenas sobem dela. */
  peste: (c, g) => { soltar(c, g.em, [nevoa(8, { cor: 0x7aa040, raio: 18 })], K.veneno); subir(c, g.em, 'cranio', 0xc8e0a0, 3, 1.3, 800, 0.5); },

  // ----- As trevas e a luz.
  /** Revelação: o olho de luz abre e os raios saem dele. */
  revelacao: (c, g) => { tween(c, { textura: 'olho', de: acima(g.em, 1.1), s: [0.3, 1.3], sy: [0.05, 1.1], a: [1, 0], cor: K.sagrado, aditivo: true, ms: 700, curva: elastica }); estourar(c, acima(g.em, 1.1), 'feixe', 0xfff8d0, 8, 1.2, 360, 0.5); },
  /** Túmulo: a lápide brota sobre o preso e as mãos sobem em volta. */
  tumulo: (c, g) => { brotar(c, acima(g.em, 0.1), 'rocha', 0x4a4458, 1.6, 1100); cercar(c, g.em, 'mao_ossea', 0x9a8ab0, 3, 0.7, 0.8, 900); soltar(c, g.em, [poeira(5, { cor: 0x5a5068 })], K.trevas); },
  /** Solo consagrado: o círculo dourado acende no chão e as folhas sobem das raízes. */
  solo_consagrado: (c, g) => { circuloNoChao(c, () => g.em, 'circulo_runico', K.sagrado, 2.2, 900, 0.5); subir(c, g.em, 'folha', 0xf0e8a0, 5, 1.2, 800, 0.5, false); },
  /** Eclipse: o disco negro cobre a luz e fica só o anel. */
  eclipse: (c, g) => { tween(c, { textura: 'choque', de: acima(g.em, 1), s: [0.4, 1.6], a: [1, 0], cor: 0xfff0a0, aditivo: true, ms: 700 }); tween(c, { textura: 'bola_ferro', de: acima(g.em, 1), s: [0.3, 1.1], a: [1, 0.2], cor: 0x100818, ms: 700, curva: sai }); },
  /** Eclipse (pela luz): a luz rompe o disco escuro e estoura em raios. */
  eclipse_luz: (c, g) => { tween(c, { textura: 'bola_ferro', de: acima(g.em, 1), s: [1.1, 0.3], a: [1, 0], cor: 0x100818, ms: 360 }); estourar(c, acima(g.em, 1), 'feixe', K.sagrado, 10, 1.4, 420, 0.6); clarao(c, acima(g.em, 1), 0xffffff, 1.8); },
  /** Absolvição: duas asas pequenas se abrem e o que definhava sobe em luz. */
  absolvicao: (c, g) => { for (const lado of [-1, 1]) tween(c, { textura: 'asa', de: acima(g.em, 0.7), para: { x: g.em.x + lado * 0.6, y: g.em.y - 0.9 }, s: [0.3, 1.1], a: [1, 0], rot: [0, lado * 0.3], cor: 0xfff6dc, aditivo: true, ms: 700, curva: sai }); subir(c, g.em, 'cintilar', K.sagrado, 4, 1.4, 700, 0.6); },

  // ----- O molhado.
  /** Eletrocutar: a descarga corre pela água em volta. */
  eletrocutar: (c, g) => { ondaDeChoque(c, g.em, 0xa0d8ff, 1.6, 320); faiscar(c, g.em, 0xffffff, 5, 1.5); estourar(c, g.em, 'gota_viva', 0xa0d8ff, 6, 1, 320, 0.4); },
  /** Lama: a terra na água respinga e gruda. */
  lama: (c, g) => { estourar(c, g.em, 'gota_viva', 0x7a5a38, 8, 1, 360, 0.5); c.marca('poca_sangue', g.em.x, g.em.y, escurecer(K.terra, 0.4), 1.6, 3000); soltar(c, g.em, [poeira(4, { cor: 0x6a4a2a })], K.terra); },
};
