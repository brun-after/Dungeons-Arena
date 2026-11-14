// D-173 (14/11/2026): o desenho de cada uma das 30 ressonâncias (data/ressonancias.json), pelo id `eixo_elemento`.
// A ressonância é o eixo do estilo dito na língua do elemento: a Área em fogo é o Incêndio que corre pelo chão; o Eco
// em raio é o Trovão que chega depois; a Invocação em terra é o Golem que se monta de pedra. Sempre abre com o anel
// duplo da ressonância (o sinal comum, que diz "isto é uma ressonância").

import { arcoDeGolpe, brotar, cair, circuloNoChao, clarao, clarear, cupula, escurecer, feixe, ondaDeChoque, orbitar, relampago, tween } from './blocos';
import type { CenaVfx, P } from './cena';
import { brasas, chamaViva, cintilar, faiscasMetal, nevoa, poeira } from './emissoes';
import { acima, cercar, chover, CORES as K, emVolta, estourar, faiscar, fechar, lancar, soltar, subir, type Gesto } from './gestos-base';
import { elastica, sai } from './pincel';

/** O sinal da ressonância: dois anéis finos que se cruzam no alvo, na cor do elemento. */
function sinal(c: CenaVfx, em: P, cor: number): void {
  tween(c, { textura: 'choque', de: em, s: [0.3, 1.5], sy: [0.3, 0.6], a: [1, 0], rot: [0.5, 0.5], cor, aditivo: true, ms: 420, curva: sai });
  tween(c, { textura: 'choque', de: em, s: [0.3, 1.5], sy: [0.3, 0.6], a: [1, 0], rot: [-0.5, -0.5], cor: clarear(cor, 0.5), aditivo: true, ms: 420, curva: sai });
}
const com = (cor: number, g: Gesto): Gesto => (c, p) => { sinal(c, p.em, cor); g(c, p); };

export const GESTOS_DAS_RESSONANCIAS: Readonly<Record<string, Gesto>> = {
  // ----- Área.
  /** Incêndio: o fogo corre pelo chão em volta e deixa o queimado. */
  area_fogo: com(K.fogo, (c, g) => { cercar(c, g.em, 'chama1', K.fogo, 8, 1.6, 0.9, 900, true); c.marca('queimado', g.em.x, g.em.y, 0x3a1a08, 2.6, 4000); soltar(c, g.em, [brasas(12, { raio: 60 }), chamaViva(6, { raio: 50 })], K.fogo); }),
  /** Abalo: o chão racha em estrela e as pedras saltam. */
  area_terra: com(K.terra, (c, g) => { c.marca('rachadura', g.em.x, g.em.y, 0x3a2a18, 2.8, 4000); cercar(c, g.em, 'rocha', 0x8a7258, 6, 1.5, 0.8, 700); ondaDeChoque(c, g.em, K.terra, 2, 420); soltar(c, g.em, [poeira(12, { raio: 60 })], K.terra); c.tremor('leve'); }),
  /** Inverno: a geada se espalha e os flocos caem em volta. */
  area_gelo: com(K.gelo, (c, g) => { c.marca('geada', g.em.x, g.em.y, 0xd8f0ff, 2.8, 4000); chover(c, g.em, 'gelo', 0xe8f6ff, 7, 1.5, 0.6); soltar(c, g.em, [nevoa(8, { cor: 0xd8eeff, raio: 50 })], K.gelo); }),

  // ----- Alvos.
  /** Corrente elétrica: a descarga salta do alvo para os vizinhos em arcos. */
  alvos_raio: com(K.raio, (c, g) => { faiscar(c, g.em, K.raio, 5, 2, 300); for (const p of emVolta(g.em, 2, 5)) clarao(c, p, 0xffffff, 0.8, 260); }),
  /** Contágio: as gotas verdes pulam do alvo para quem está perto. */
  alvos_veneno: com(K.veneno, (c, g) => { for (const p of emVolta(g.em, 1.8, 5)) tween(c, { textura: 'gota_viva', de: g.em, para: p, s: [0.6, 0.4], a: [1, 0.3], cor: K.veneno, aditivo: true, ms: 380, subir: -24, aoFim: () => { c.marca('poca_veneno', p.x, p.y, 0x6aa040, 0.8, 2500); } }); }),
  /** Eco mental: o golpe se repete em anéis dentro da cabeça. */
  alvos_psiquico: com(K.psiquico, (c, g) => { for (let i = 0; i < 3; i++) tween(c, { textura: 'onda_som', de: acima(g.em, 1), s: [0.3, 1.2 + i * 0.3], a: [1, 0], cor: K.psiquico, aditivo: true, ms: 420, atrasoMs: i * 130 }); }),

  // ----- Perfuração.
  /** Lança de inverno: a lança de gelo atravessa e deixa o rastro de geada. */
  perfuracao_gelo: com(K.gelo, (c, g) => { lancar(c, g, 'gelo', 0xe8f6ff, 1.6, 220, () => { estourar(c, g.em, 'estilhaco', K.gelo, 6, 0.9, 280, 0.45); }); c.marca('geada', g.em.x, g.em.y, 0xd8f0ff, 1.6, 2500); }),
  /** Furar armadura: a ponta entra e a placa racha em volta. */
  perfuracao_fisico: com(K.fisico, (c, g) => { lancar(c, g, 'espinho', 0xf4f8ff, 1.4, 180, () => { estourar(c, g.em, 'hexagono', 0xb8c0c8, 5, 0.8, 340, 0.45); soltar(c, g.em, [faiscasMetal(8)], K.aco); }); }),
  /** Raio de luz: o feixe atravessa o alvo e banha quem está em volta de você. */
  perfuracao_sagrado: com(K.sagrado, (c, g) => { feixe(c, g.de ?? acima(g.em, 3), g.em, 0xfff8d0, 1.2, 360); if (g.de) { ondaDeChoque(c, g.de, K.sagrado, 2, 520); soltar(c, g.de, [cintilar(10, { raio: 60 })], K.sagrado); } }),

  // ----- Eco.
  /** Trovão: depois do raio, o estrondo — o segundo raio cai e a onda de som abre. */
  eco_raio: com(K.raio, (c, g) => { relampago(c, () => acima(g.em, 4), () => g.em, 0xffffff, 240, 1.5); for (let i = 0; i < 2; i++) ondaDeChoque(c, g.em, K.raio, 1.2 + i * 0.6, 380 + i * 100, 'onda_som', false); c.tremor('leve'); }),
  /** Assombração: a sombra do golpe volta como um vulto que atravessa o alvo. */
  eco_trevas: com(K.trevas, (c, g) => { tween(c, { textura: 'alma', de: { x: g.em.x - 1.2, y: g.em.y - 0.5 }, para: { x: g.em.x + 1.2, y: g.em.y - 0.5 }, s: [1.2, 1.4], a: [0.9, 0], cor: 0xb090e0, aditivo: true, ms: 520 }); tween(c, { textura: 'olho', de: acima(g.em, 1.2), s: [0.2, 0.9], sy: [0.05, 0.8], a: [1, 0], cor: K.trevas, aditivo: true, ms: 600, curva: elastica }); }),
  /** Golpe duplo: o mesmo arco, de novo, pelo outro lado. */
  eco_fisico: com(K.fisico, (c, g) => { arcoDeGolpe(c, g.de, g.em, 0xffffff, 1.3, 1, 180); tween(c, { textura: 'arco_golpe', de: g.em, s: [0.8, 1.5], a: [1, 0], rot: [Math.PI, Math.PI + 0.6], cor: 0xf4f0e8, aditivo: true, ms: 220, atrasoMs: 140 }); soltar(c, g.em, [faiscasMetal(6)], K.aco); }),
  /** Déjà-vu: o relógio de runas gira para trás sobre quem lançou. */
  eco_psiquico: com(K.psiquico, (c, g) => { const quem = g.de ?? g.em; circuloNoChao(c, () => quem, 'circulo_runico', K.psiquico, 1.8, 700, -2); orbitar(c, () => acima(quem, 0.6), 'runa3', K.psiquico, { n: 4, raio: 0.6, ms: 700, voltas: -1.5, tamanho: 0.5, aditivo: true }); }),

  // ----- Controle.
  /** Prisão de gelo: o bloco de gelo fecha sobre o alvo de baixo para cima. */
  controle_gelo: com(K.gelo, (c, g) => { cercar(c, g.em, 'gelo', 0xd8f0ff, 5, 0.45, 1.3, 1100, true); cupula(c, () => g.em, 0xc8e8ff, 700, 0.6); }),
  /** Raízes: as raízes brotam em volta e fecham nos pés. */
  controle_terra: com(K.terra, (c, g) => { cercar(c, g.em, 'espinho', 0x6f8a4a, 7, 1, 0.9, 1200); fechar(c, g.em, 'folha', 0x8fe08f, 5, 1, 420, 0.5); }),
  /** Sombras que prendem: as mãos da sombra sobem e seguram as pernas. */
  controle_trevas: com(K.trevas, (c, g) => { cercar(c, g.em, 'mao_ossea', 0x5a4080, 4, 0.5, 1, 1200); c.marca('poca_sangue', g.em.x, g.em.y, 0x18102a, 1.6, 2500); }),
  /** Domínio: o olho abre sobre a cabeça e os fios descem até ela. */
  controle_psiquico: com(K.psiquico, (c, g) => { tween(c, { textura: 'olho', de: acima(g.em, 1.8), s: [0.3, 1.2], sy: [0.05, 1], a: [1, 0.2], cor: K.psiquico, aditivo: true, ms: 900, curva: elastica }); for (const d of [-0.3, 0, 0.3]) feixe(c, acima(g.em, 1.7), { x: g.em.x + d, y: g.em.y - 0.5 }, K.psiquico, 0.25, 700); }),

  // ----- Sustento (em quem lançou).
  /** Graça: a luz desce devagar e fica rodando em volta de você. */
  sustento_sagrado: com(K.sagrado, (c, g) => { const quem = g.de ?? g.em; feixe(c, acima(quem, 3), quem, 0xfff8d0, 0.9, 700); orbitar(c, () => acima(quem, 0.5), 'cintilar', K.sagrado, { n: 5, raio: 0.6, ms: 1200, voltas: 1, tamanho: 0.6, aditivo: true }); }),
  /** Pele de pedra: as placas de pedra chegam de fora e encaixam no corpo. */
  sustento_terra: com(K.terra, (c, g) => { const quem = g.de ?? g.em; fechar(c, acima(quem, 0.5), 'rocha', 0x9a8468, 6, 1.3, 360, 0.7, () => { clarao(c, acima(quem, 0.5), 0xd8c8a0, 1.1); soltar(c, quem, [poeira(5)], K.terra); }); }),
  /** Pacto: a vida do alvo corre em fios vermelhos até você. */
  sustento_trevas: com(K.trevas, (c, g) => { const quem = g.de ?? acima(g.em, 2); for (let i = 0; i < 4; i++) tween(c, { textura: 'gota_viva', de: g.em, para: quem, s: [0.5, 0.25], a: [1, 0.4], cor: 0xff4050, aditivo: true, ms: 420, atrasoMs: i * 70, subir: -14 - i * 6 }); clarao(c, quem, 0xa040c0, 1); }),

  // ----- Marca.
  /** Sentença: o selo escuro desce sobre o marcado e fica pesando. */
  marca_trevas: com(K.trevas, (c, g) => { cair(c, acima(g.em, 0.9), 'circulo_runico', 0x9a60e0, { altura: 2.5, ms: 300, tamanho: 1.1, aditivo: true, aoChegar: () => { tween(c, { textura: 'cranio', de: acima(g.em, 0.9), s: [0.5, 0.9], a: [1, 0], cor: 0xd8c0ff, aditivo: true, ms: 600 }); } }); }),
  /** Pavio: a marca acende e a chama corre em volta dela. */
  marca_fogo: com(K.fogo, (c, g) => { orbitar(c, () => acima(g.em, 0.8), 'brasa', 0xffc060, { n: 1, raio: 0.45, ms: 700, voltas: 2, tamanho: 0.6, aditivo: true, rastro: 6 }); tween(c, { textura: 'mira_alvo', de: acima(g.em, 0.8), s: [0.9, 0.6], a: [1, 0], cor: K.fogo, aditivo: true, ms: 700 }); }),
  /** Infecção: a marca incha em bolhas verdes que estouram. */
  marca_veneno: com(K.veneno, (c, g) => { for (const p of emVolta(acima(g.em, 0.6), 0.35, 4)) tween(c, { textura: 'gota_viva', de: p, s: [0.2, 0.8], a: [1, 0], cor: 0xb8e060, ms: 520, atrasoMs: Math.random() * 200, curva: elastica }); c.marca('poca_veneno', g.em.x, g.em.y, 0x6aa040, 1, 2500); }),

  // ----- Grupo (em volta de quem lançou).
  /** Coral: as vozes — anéis dourados saem de você e as notas sobem do grupo. */
  grupo_sagrado: com(K.sagrado, (c, g) => { const quem = g.de ?? g.em; for (let i = 0; i < 3; i++) ondaDeChoque(c, quem, K.sagrado, 1.5 + i * 0.8, 480 + i * 120, 'onda_som', false); subir(c, quem, 'cintilar', 0xfff8d0, 6, 1.6, 900, 0.6); }),
  /** Formação: os escudos plantam em volta do grupo, ombro a ombro. */
  grupo_fisico: com(K.fisico, (c, g) => { const quem = g.de ?? g.em; emVolta(quem, 1.6, 6).forEach((p, i) => { brotar(c, acima(p, 0.3), 'hexagono', 0xd8e0e8, 1, 1000, true, i * 50); }); soltar(c, quem, [faiscasMetal(6, { raio: 50 })], K.aco); }),
  /** Ânimo elétrico: a centelha corre de você para os aliados em volta. */
  grupo_raio: com(K.raio, (c, g) => { const quem = g.de ?? g.em; faiscar(c, acima(quem, 0.5), K.raio, 6, 2.2, 320); orbitar(c, () => quem, 'clarao', 0xffffc0, { n: 2, raio: 0.6, ms: 520, voltas: 2, tamanho: 0.6, aditivo: true, rastro: 3 }); }),

  // ----- Invocação.
  /** Mortos famintos: os olhos dos seus acendem e as bocas de osso batem. */
  invocacao_trevas: com(K.trevas, (c, g) => { const quem = g.de ?? g.em; for (const p of emVolta(quem, 1.4, 4)) { tween(c, { textura: 'cranio', de: acima(p, 0.8), s: [0.5, 0.9], a: [1, 0], cor: 0xd8c0ff, aditivo: true, ms: 700, curva: elastica }); tween(c, { textura: 'olho', de: acima(p, 0.9), s: [0.3, 0.5], a: [1, 0], cor: 0xff4040, aditivo: true, ms: 500 }); } }),
  /** Golem: as pedras rolam de fora e se empilham numa casca em volta dos seus. */
  invocacao_terra: com(K.terra, (c, g) => { const quem = g.de ?? g.em; fechar(c, quem, 'rocha', 0x8a7258, 8, 2.2, 480, 0.9, () => { cupula(c, () => quem, 0x9a8468, 700, 1); c.tremor('leve'); }); soltar(c, quem, [poeira(8, { raio: 50 })], K.terra); }),
  /** Fênix: as asas de brasa se abrem sobre os seus e as penas de fogo caem. */
  invocacao_fogo: com(K.fogo, (c, g) => { const quem = g.de ?? g.em; for (const lado of [-1, 1]) tween(c, { textura: 'asa', de: acima(quem, 0.8), para: { x: quem.x + lado * 1.2, y: quem.y - 1.2 }, s: [0.4, 2], a: [1, 0], rot: [0, lado * 0.3], cor: 0xffa040, aditivo: true, ms: 900, curva: sai }); chover(c, quem, 'pena', 0xffc060, 5, 1.2, 0.6); soltar(c, quem, [brasas(8, { raio: 50 })], K.fogo); }),
  /** Enxame: a nuvem de pontos verdes roda em volta do alvo e pica. */
  invocacao_veneno: com(K.veneno, (c, g) => { orbitar(c, () => acima(g.em, 0.5), 'espinho', 0xb8e060, { n: 8, raio: 1.2, ms: 900, voltas: 2.5, tamanho: 0.35, aditivo: true, tangente: true }); soltar(c, g.em, [nevoa(5, { cor: escurecer(K.veneno, 0.3), raio: 40 })], K.veneno); }),
};
