// D-173 (14/11/2026): o desenho dos 17 combos de papel e dos 30 combos assinados das classes (data/combos-papel.json).
// O combo de papel desenha a troca de função (o controle que vira dano, a defesa que vira revide); o assinado desenha
// a frase da classe (o Moedor puxa para o giro; a Órbita deixa o orbe pulsando sobre o círculo; a Pinça fecha as duas
// garras). Antes, o combo só subia como texto.

import { arcoDeGolpe, brotar, cair, circuloNoChao, clarao, clarear, cupula, feixe, ondaDeChoque, orbitar, relampago, tween } from './blocos';
import { brasas, cintilar, faiscasMetal, nevoa, poeira } from './emissoes';
import { acima, cercar, chover, CORES as K, emVolta, estourar, fechar, lancar, soltar, subir, type Gesto } from './gestos-base';
import { elastica, sai } from './pincel';

export const GESTOS_DOS_COMBOS: Readonly<Record<string, Gesto>> = {
  // ===================== Combos de papel.
  /** Golpe no preso: o elo que prende brilha e o golpe entra por ele. */
  golpe_no_preso: (c, g) => { tween(c, { textura: 'algema', de: acima(g.em, 0.5), s: [1.2, 0.8], a: [1, 0], cor: 0xffe070, aditivo: true, ms: 420, curva: elastica }); arcoDeGolpe(c, g.de, g.em, 0xffffff, 1.3); },
  /** Prender o ferido: as gotas do ferimento viram elos que fecham. */
  prender_o_ferido: (c, g) => { fechar(c, acima(g.em, 0.4), 'elo', K.sangue, 6, 1.1, 380, 0.5, () => { clarao(c, acima(g.em, 0.4), K.sangue, 1); }); },
  /** Prisão dupla: a segunda grade fecha por cima da primeira, cruzada. */
  prisao_dupla: (c, g) => { for (const rot of [0.6, -0.6]) tween(c, { textura: 'feixe', de: acima(g.em, 0.5), s: [1.6, 1.2], sy: [0.3, 0.3], a: [0, 1], rot: [rot, rot], cor: 0xc8d0e0, aditivo: true, ms: 360, curva: elastica }); cupula(c, () => g.em, 0xb8c4d8, 520, 0.6); },
  /** Embalo: o rastro do movimento empurra o golpe. */
  embalo: (c, g) => { lancar(c, g, 'arco_golpe', 0xe8f4ff, 1.6, 200, () => { ondaDeChoque(c, g.em, 0xe8f4ff, 1, 260); }); },
  /** Bater e sair: o corte fica e o vulto some para trás. */
  bater_e_sair: (c, g) => { arcoDeGolpe(c, g.de, g.em, 0xffffff, 1.1); if (g.de) tween(c, { textura: 'alma', de: g.em, para: g.de, s: [1, 0.6], a: [0.7, 0], cor: 0xe8f4ff, aditivo: true, ms: 320 }); },
  /** Emboscada na chegada: a poeira da chegada vira um laço no chão. */
  emboscada_na_chegada: (c, g) => { circuloNoChao(c, () => g.em, 'mira_alvo', 0xd8c39a, 1.6, 600, 2); soltar(c, g.em, [poeira(8)], K.terra); },
  /** Revide: a casca devolve — o escudo pisca e a lâmina sai dele. */
  revide: (c, g) => { const quem = g.de ?? g.em; tween(c, { textura: 'hexagono', de: acima(quem, 0.5), s: [0.8, 1.4], a: [1, 0], cor: 0xd8e0e8, aditivo: true, ms: 300 }); lancar(c, g, 'lamina', 0xffffff, 1.1, 200); soltar(c, g.em, [faiscasMetal(6)], K.aco); },
  /** Fôlego: o golpe volta como ar — um anel claro fecha em quem bateu. */
  folego: (c, g) => { const quem = g.de ?? g.em; fechar(c, acima(quem, 0.5), 'cintilar', 0xd8f0ff, 6, 1.2, 420, 0.6); cupula(c, () => quem, 0xc8e0f0, 520, 0.6); },
  /** Bênção ofensiva: a luz da cura desce pela arma até o alvo. */
  bencao_ofensiva: (c, g) => { feixe(c, g.de ?? acima(g.em, 3), g.em, 0xfff8d0, 0.8, 320); soltar(c, g.em, [cintilar(8)], K.sagrado); },
  /** Sangue por sangue: o que saiu do alvo volta em gotas para o grupo. */
  sangue_por_sangue: (c, g) => { const quem = g.de ?? acima(g.em, 2); for (let i = 0; i < 4; i++) tween(c, { textura: 'gota_viva', de: g.em, para: quem, s: [0.5, 0.3], a: [1, 0.4], cor: K.sangue, aditivo: true, ms: 420, atrasoMs: i * 60, subir: -16, ...(i === 3 ? { aoFim: () => { clarao(c, quem, K.vida, 1); } } : {}) }); },
  /** Vigília: a cura fica de guarda — a luz vira um anel de escudos. */
  vigilia: (c, g) => { const quem = g.de ?? g.em; orbitar(c, () => acima(quem, 0.5), 'hexagono', K.sagrado, { n: 4, raio: 0.7, ms: 900, voltas: 1, tamanho: 0.5, aditivo: true }); },
  /** Cuidado: o escudo abre e a folha de cura cai dentro dele. */
  cuidado: (c, g) => { const quem = g.de ?? g.em; cupula(c, () => quem, 0xc8f0d8, 600, 0.6); chover(c, quem, 'folha', 0x8fe08f, 3, 0.4, 0.6); },
  /** Ataque coordenado: as garras das criaturas e o golpe chegam juntos. */
  ataque_coordenado: (c, g) => { for (const rot of [-0.7, 0, 0.7]) tween(c, { textura: 'garra', de: g.em, s: [0.6, 1.3], a: [1, 0], rot: [rot, rot], cor: 0xffe0c0, aditivo: true, ms: 280, atrasoMs: (rot + 0.7) * 60 }); },
  /** Presa entregue: a mira trava no preso para as criaturas. */
  presa_entregue: (c, g) => { tween(c, { textura: 'mira_alvo', de: acima(g.em, 0.5), s: [1.8, 0.8], a: [0.5, 1], rot: [1.2, 0], cor: 0xff7050, aditivo: true, ms: 420 }); cercar(c, g.em, 'garra', 0xffc0a0, 3, 0.8, 0.6, 600, true); },
  /** Cerco: as criaturas fecham a roda — pegadas em anel que apertam. */
  cerco: (c, g) => { fechar(c, g.em, 'garra', 0xd8c0a0, 6, 1.6, 460, 0.6, () => { ondaDeChoque(c, g.em, 0xd8c0a0, 0.9, 260); }); },
  /** Ritmo: dois rastros seguidos, o segundo mais longo. */
  ritmo: (c, g) => { const quem = g.de ?? g.em; for (let i = 0; i < 2; i++) tween(c, { textura: 'arco_golpe', de: quem, para: g.em, s: [0.6, 1.2 + i * 0.4], a: [0.8, 0], cor: 0xe8f4ff, aditivo: true, ms: 260, atrasoMs: i * 120 }); },
  /** Provocação: o olho da fúria abre atrás da guarda e puxa os olhares. */
  provocacao: (c, g) => { const quem = g.de ?? g.em; tween(c, { textura: 'olho', de: acima(quem, 1.2), s: [0.3, 1.2], sy: [0.05, 1], a: [1, 0], cor: 0xff5a3a, aditivo: true, ms: 700, curva: elastica }); ondaDeChoque(c, quem, 0xff5a3a, 1.8, 420, 'onda_som', false); },

  // ===================== Guerreiro.
  /** Moedor: quem foi atropelado é sugado em espiral para dentro do giro. */
  moedor_de_ferro: (c, g) => { orbitar(c, () => g.em, 'arco_golpe', 0xf4f0e8, { n: 4, raio: 1.4, ms: 520, voltas: 2, tamanho: 1, aditivo: true, rastro: 2 }); fechar(c, g.em, 'elo', 0xb8c0c8, 6, 2, 420, 0.5); },
  /** Aríete: a tora de pedra bate no fim da investida e o tremor abre largo. */
  ariete: (c, g) => { lancar(c, g, 'rocha', 0x9a8468, 1.8, 220, () => { ondaDeChoque(c, g.em, K.terra, 2.4, 420); c.marca('rachadura', g.em.x, g.em.y, 0x3a2a18, 2.2, 3000); c.tremor('forte'); }); },
  /** Terra arrasada: sobre os derrubados, a lâmina do carrasco desce no chão rachado. */
  terra_arrasada: (c, g) => { c.marca('rachadura', g.em.x, g.em.y, 0x5a1a10, 2, 3000, true); cair(c, g.em, 'lamina', 0xff8060, { altura: 3.5, ms: 240, tamanho: 1.8, aditivo: true, aoChegar: () => { soltar(c, g.em, [brasas(8), poeira(6)], K.fogo); } }); },
  /** Ceifa em roda: a foice dá a volta inteira e corta todos em volta. */
  ceifa_em_roda: (c, g) => { orbitar(c, () => g.em, 'lamina', 0xffffff, { n: 1, raio: 1.5, ms: 380, voltas: 1, tamanho: 1.6, aditivo: true, tangente: true, rastro: 8 }); ondaDeChoque(c, g.em, K.sangue, 1.6, 380); },
  /** Grito de guerra: o brado acende a lâmina — as ondas de som entram na arma em brasa. */
  grito_de_guerra: (c, g) => { const quem = g.de ?? g.em; fechar(c, acima(quem, 0.6), 'onda_som', 0xffb060, 5, 1.6, 360, 0.8, () => { tween(c, { textura: 'lamina', de: acima(quem, 0.8), s: [0.8, 1.6], a: [1, 0], rot: [-0.8, -0.8], cor: 0xffa040, aditivo: true, ms: 420 }); soltar(c, quem, [brasas(10)], K.fogo); }); },
  /** Ordem de avanço: o estandarte aponta e as setas de vento correm para a frente. */
  ordem_de_avanco: (c, g) => { const quem = g.de ?? g.em; brotar(c, quem, 'lamina', 0xe8c06a, 1.4, 900, true); for (const d of [-0.5, 0, 0.5]) tween(c, { textura: 'arco_golpe', de: { x: quem.x, y: quem.y + d }, para: { x: g.em.x, y: g.em.y + d }, s: [0.6, 1], a: [0.8, 0], cor: 0xe8f4ff, aditivo: true, ms: 360 }); },

  // ===================== Arqueiro.
  /** Presa marcada: a mira fecha no marcado e o tiro sai num risco só. */
  presa_marcada: (c, g) => { tween(c, { textura: 'mira_alvo', de: acima(g.em, 0.5), s: [2, 0.7], a: [0.5, 1], rot: [1.5, 0], cor: 0xffe070, aditivo: true, ms: 240 }); feixe(c, g.de ?? acima(g.em, 3), g.em, 0xfff2a0, 0.5, 240); },
  /** Céu fechado: as flechas caem em roda e fecham a saída. */
  ceu_fechado: (c, g) => { chover(c, g.em, 'espinho', 0xd8c39a, 8, 1.5, 1, (p) => { soltar(c, p, [poeira(2, { forma: 'ponto' })], K.terra); }); },
  /** Tempestade de aço: do centro da chuva, as flechas saem para todos os lados. */
  tempestade_de_aco: (c, g) => { estourar(c, g.em, 'espinho', 0xe8eef4, 12, 2.2, 340, 0.8); clarao(c, g.em, 0xffffff, 1.2); },
  /** Fio da navalha: uma linha fina atravessa todos os que a saraivada tocou. */
  fio_da_navalha: (c, g) => { const de = g.de ?? { x: g.em.x - 2, y: g.em.y }; const ate = { x: g.em.x + (g.em.x - de.x) * 0.6, y: g.em.y + (g.em.y - de.y) * 0.6 }; feixe(c, de, ate, 0xffffff, 0.35, 300); soltar(c, g.em, [faiscasMetal(6)], K.aco); },
  /** Olho no alvo: três marcas caem em fila sobre o alvo. */
  olho_no_alvo: (c, g) => { for (let i = 0; i < 3; i++) tween(c, { textura: 'mira_alvo', de: acima(g.em, 1.6), para: acima(g.em, 0.5), s: [1.2, 0.6 + i * 0.2], a: [0, 1], cor: 0xff7050, aditivo: true, ms: 260, atrasoMs: i * 110, curva: elastica }); },
  /** Leque de tempestade: cada flecha do leque leva um raio na ponta. */
  leque_de_tempestade: (c, g) => { const de = g.de ?? acima(g.em, 2); for (const p of emVolta(g.em, 0.9, 5)) relampago(c, () => de, () => p, K.raio, 260, 0.6); },

  // ===================== Mago.
  /** Prisão rúnica: o círculo de gelo segura e o cataclismo cai nele na hora. */
  prisao_runica: (c, g) => { circuloNoChao(c, () => g.em, 'circulo_runico', K.gelo, 2.6, 800, 1); cair(c, g.em, 'clarao', K.psiquico, { altura: 4, ms: 260, tamanho: 2.2, aditivo: true, aoChegar: () => { ondaDeChoque(c, g.em, K.psiquico, 2, 380); c.tremor('leve'); } }); },
  /** Enxame arcano: do orbe sai um segundo míssil, em curva, no mesmo alvo. */
  enxame_arcano: (c, g) => { const de = g.de ?? acima(g.em, 2); for (const lado of [-1, 1]) tween(c, { textura: 'clarao', de, para: g.em, s: [0.5, 0.7], a: [1, 0.6], cor: K.psiquico, aditivo: true, ms: 320, atrasoMs: lado > 0 ? 100 : 0, subir: lado * 26 }); },
  /** Encarnação plena: a descarga sai com as três cores do elemento encarnado, em anel duplo. */
  encarnacao_plena: (c, g) => { ondaDeChoque(c, g.em, g.cor, 2.4, 420); ondaDeChoque(c, g.em, clarear(g.cor, 0.5), 1.4, 320); orbitar(c, () => g.em, 'runa0', g.cor, { n: 6, raio: 1.6, ms: 620, voltas: 1, tamanho: 0.6, aditivo: true }); },
  /** Fogo cruzado: o míssil ricocheteia entre os atingidos em zigue-zague. */
  fogo_cruzado: (c, g) => { const pontos = emVolta(g.em, 1.3, 4, 0.4); let anterior = g.de ?? g.em; for (const p of pontos) { const de = anterior; relampago(c, () => de, () => p, K.psiquico, 240, 0.7); anterior = p; } },
  /** Órbita: o orbe para sobre o círculo e pulsa três vezes. */
  orbita: (c, g) => { tween(c, { textura: 'clarao', de: acima(g.em, 1), s: [1.2, 1.2], a: [1, 0.4], cor: K.psiquico, aditivo: true, ms: 1500 }); for (let i = 0; i < 3; i++) tween(c, { textura: 'choque', de: g.em, s: [0.3, 2.4], sy: [0.15, 1.2], a: [1, 0], cor: K.gelo, aditivo: true, ms: 420, atrasoMs: i * 500, noChao: true }); },
  /** Fim dos tempos: dos escombros nasce o orbe gigante, que engole a luz em volta. */
  fim_dos_tempos: (c, g) => { fechar(c, acima(g.em, 0.6), 'rocha', 0x4a4458, 8, 2.2, 520, 0.7, () => { tween(c, { textura: 'clarao', de: acima(g.em, 0.6), s: [0.5, 3.4], a: [1, 0], cor: 0xc080ff, aditivo: true, ms: 700, curva: sai }); c.tremor('forte'); }); },

  // ===================== Necromante.
  /** Sepultura aberta: os recém-erguidos estouram juntos, cada um na sua cova. */
  sepultura_rasa: (c, g) => { for (const p of emVolta(g.em, 1.2, 4)) { ondaDeChoque(c, p, K.veneno, 1, 320); estourar(c, p, 'osso', K.osso, 5, 0.8, 320, 0.4); } soltar(c, g.em, [nevoa(6, { cor: 0x5a7a30, raio: 50 })], K.veneno); },
  /** Colheita farta: a foice passa e as almas que a seta tocou sobem de novo. */
  colheita_farta: (c, g) => { arcoDeGolpe(c, g.de, g.em, 0xb090e0, 1.8, 1, 260, 'lamina'); subir(c, g.em, 'alma', 0xc0a0f0, 5, 1.6, 800, 0.7); },
  /** Escudo de ossos: as costelas fecham em volta de quem comanda. */
  escudo_de_ossos: (c, g) => { const quem = g.de ?? g.em; orbitar(c, () => acima(quem, 0.5), 'osso', K.osso, { n: 6, raio: 0.7, ms: 1200, voltas: 1.2, tamanho: 0.7, tangente: true }); cupula(c, () => quem, 0xd8d0c0, 600, 0.6); },
  /** Marcha fúnebre: as mãos rompem o chão já junto do alvo da Ordem. */
  marcha_dos_mortos: (c, g) => { cercar(c, g.em, 'mao_ossea', 0xb0a0c8, 5, 1, 1, 900); c.marca('rachadura', g.em.x, g.em.y, 0x2a2038, 1.6, 2500); },
  /** Ceifa e semeadura: cada alma colhida desce de volta ao chão e vira um servo. */
  ceifa_e_semeadura: (c, g) => { const quem = g.de ?? g.em; emVolta(quem, 1, 3).forEach((p, i) => { cair(c, p, 'alma', 0xc0a0f0, { altura: 2.5, ms: 320, tamanho: 0.9, atrasoMs: i * 120, aditivo: true, aoChegar: () => { brotar(c, p, 'mao_ossea', 0xb0a0c8, 0.9, 800); } }); }); },
  /** Seta podre: a seta atravessa a nuvem e sai dela verde, deixando o rastro. */
  seta_podre: (c, g) => { lancar(c, g, 'espinho', 0xa8d060, 1.3, 240, () => { c.marca('poca_veneno', g.em.x, g.em.y, 0x6aa040, 1.2, 2500); }); soltar(c, g.de ?? g.em, [nevoa(5, { cor: 0x5a7a30, raio: 30 })], K.veneno); },

  // ===================== Aventureiro.
  /** Pinça: as duas garras fecham de lados opostos no agarrado. */
  pinca: (c, g) => { for (const lado of [-1, 1]) tween(c, { textura: 'garra', de: { x: g.em.x + lado * 1.4, y: g.em.y - 0.5 }, para: acima(g.em, 0.5), s: [1.2, 0.8], a: [0.6, 1], rot: [lado > 0 ? Math.PI : 0, lado > 0 ? Math.PI : 0], cor: 0xffe0c0, aditivo: true, ms: 220, ...(lado > 0 ? { aoFim: () => { clarao(c, acima(g.em, 0.5), 0xffffff, 1.4); } } : {}) }); },
  /** Caçada em matilha: os rasgos chegam de três lados ao mesmo tempo. */
  cacada_em_matilha: (c, g) => { emVolta(g.em, 1.6, 3, 0.5).forEach((p, i) => { tween(c, { textura: 'garra', de: p, para: g.em, s: [0.7, 1.2], a: [0.8, 0], rot: [Math.atan2(g.em.y - p.y, g.em.x - p.x), Math.atan2(g.em.y - p.y, g.em.x - p.x)], cor: 0xd8c0a0, aditivo: true, ms: 260, atrasoMs: i * 50 }); }); soltar(c, g.em, [poeira(6)], K.terra); },
  /** Atropelo: a carga derruba e a pata fica em cima. */
  atropelo: (c, g) => { lancar(c, g, 'arco_golpe', 0xe8d8b8, 1.8, 220, () => { cair(c, g.em, 'garra', 0xd8c0a0, { altura: 1.5, ms: 180, tamanho: 1.4, aditivo: true }); soltar(c, g.em, [poeira(8)], K.terra); c.tremor('leve'); }); },
  /** Isca: a armadilha puxa — os arcos de vento correm de fora para dentro dela. */
  isca: (c, g) => { fechar(c, g.em, 'arco_golpe', 0xe8f4ff, 6, 2, 420, 0.8, () => { brotar(c, g.em, 'espinho', 0xb8a070, 1.2, 700); }); },
  /** Segundo fôlego: a arma volta à mão e vira um escudo de vento. */
  segundo_folego: (c, g) => { const quem = g.de ?? g.em; orbitar(c, () => acima(quem, 0.5), 'pena', 0xe8f4ff, { n: 5, raio: 0.7, ms: 800, voltas: 1.5, tamanho: 0.6, aditivo: true, rastro: 2 }); cupula(c, () => quem, 0xd8ecff, 520, 0.6); },
  /** Laço: a cura corre do dono ao companheiro por um fio de folhas. */
  laco: (c, g) => { const quem = g.de ?? acima(g.em, 2); for (let i = 0; i < 4; i++) tween(c, { textura: 'folha', de: quem, para: g.em, s: [0.4, 0.5], a: [1, 0.4], cor: 0x8fe08f, ms: 420, atrasoMs: i * 70, subir: -12 }); soltar(c, g.em, [cintilar(5)], K.vida); },
};

