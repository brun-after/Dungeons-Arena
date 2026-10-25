// Materiais de partícula por elemento e estado (marco 24, 25/10/2026, D-094/D-095; pedido de 24/10/2026). Cada
// elemento tem matéria própria, não só cor: o fogo sobe em chamas que cintilam, com brasas e fumaça; o gelo estala em
// cristais facetados e geada; o raio pisca em arcos ramificados; o veneno borbulha e pinga; a terra solta lascas e
// poeira pesada; as trevas sugam fumaça escura para dentro; a luz abre raios e faíscas douradas; o psíquico ondula; o
// vento corre em espiral; o sangue respinga. Também a ultimate, o Frenesi do Guerreiro e as rachaduras do chão.
// Dado puro, no mesmo formato de presets-particula.ts (que espalha estes no catálogo).

import type { Emissao } from './presets-particula';

export const MATERIAIS = ['fogo', 'gelo', 'raio', 'veneno', 'terra', 'trevas', 'luz', 'psiquico', 'vento', 'sangue', 'sombra'] as const;
export type Material = (typeof MATERIAIS)[number];

/** Os nomes dos presets deste arquivo: `mat_<material>` (impacto), `con_<material>` (conjuração), as auras e o resto. */
export type NomePresetElemento =
  | `mat_${Material}`
  | `con_${Material}`
  | 'aura_queimando'
  | 'aura_geada'
  | 'aura_congelado'
  | 'aura_eletrizado'
  | 'aura_envenenado'
  | 'aura_molhado'
  | 'aura_atolado'
  | 'aura_definhando'
  | 'aura_consagrado'
  | 'aura_sangrando'
  | 'aura_cego'
  | 'aura_medo'
  | 'aura_confuso'
  | 'aura_marca'
  | 'aura_enraizado'
  | 'aura_vertente'
  | 'ultimate'
  | 'ultimate_eco'
  | 'frenesi'
  | 'frenesi_olhos'
  | 'furia_meia'
  | 'rachadura'
  | 'aparo';

type Lista = readonly Emissao[];

const brasa: Emissao = { textura: 'ponto', quantidade: 6, vidaMs: [500, 900], velocidade: [20, 55], direcao: 'cima', gravidade: -45, escala: [0.45, 0.08], alpha: [1, 0], aditivo: true, raio: 10, cor: 0xffc266, corFinal: 0xc0392b };
const fumacaEscura: Emissao = { textura: 'fumaca', quantidade: 4, vidaMs: [700, 1100], velocidade: [10, 26], direcao: 'cima', gravidade: -12, escala: [0.5, 1.4], alpha: [0.35, 0], aditivo: false, raio: 8, cor: 0x4a4440, arrasto: 0.4 };
const chama: Emissao = { textura: 'chama', quantidade: 8, vidaMs: [320, 560], velocidade: [30, 80], direcao: 'cima', gravidade: -90, escala: [0.9, 0.2], alpha: [1, 0], aditivo: true, raio: 9, cor: 0xffe08a, corFinal: 0xd63a1a, giro: [-1, 1] };
const cristal: Emissao = { textura: 'cristal', quantidade: 8, vidaMs: [360, 600], velocidade: [80, 180], direcao: 'livre', gravidade: 220, escala: [0.8, 0.35], alpha: [1, 0], aditivo: true, raio: 4, cor: 0xf2fbff, corFinal: 0x6fb6ff, giro: [-6, 6], arrasto: 0.5 };
const nevoaFria: Emissao = { textura: 'fumaca', quantidade: 4, vidaMs: [700, 1100], velocidade: [6, 18], direcao: 'livre', gravidade: 4, escala: [0.5, 1.3], alpha: [0.3, 0], aditivo: false, raio: 10, cor: 0xd6ecff, arrasto: 0.5 };
const arco: Emissao = { textura: 'arco', quantidade: 5, vidaMs: [70, 140], velocidade: [0, 20], direcao: 'livre', gravidade: 0, escala: [0.9, 0.7], alpha: [1, 0], aditivo: true, raio: 10, cor: 0xf4f0ff, corFinal: 0xa98bff };
const bolha: Emissao = { textura: 'bolha', quantidade: 6, vidaMs: [600, 1000], velocidade: [14, 36], direcao: 'cima', gravidade: -30, escala: [0.3, 0.7], alpha: [0.9, 0], aditivo: false, raio: 12, cor: 0x7fe08a, arrasto: 0.3 };
const pingo: Emissao = { textura: 'gota', quantidade: 4, vidaMs: [380, 620], velocidade: [10, 40], direcao: 'baixo', gravidade: 360, escala: [0.5, 0.3], alpha: [1, 0], aditivo: false, raio: 8, cor: 0x4caf50 };
const lasca: Emissao = { textura: 'lasca', quantidade: 9, vidaMs: [420, 680], velocidade: [80, 170], direcao: 'cima', gravidade: 560, escala: [0.9, 0.6], alpha: [1, 0.2], aditivo: false, raio: 6, cor: 0x8d6e63, giro: [-6, 6] };
const poeiraPesada: Emissao = { textura: 'fumaca', quantidade: 6, vidaMs: [600, 1000], velocidade: [20, 50], direcao: 'fora', gravidade: 20, escala: [0.5, 1.4], alpha: [0.45, 0], aditivo: false, raio: 10, cor: 0xa1887f, forma: 'anel', arrasto: 0.8 };
const suga: Emissao = { textura: 'fumaca', quantidade: 8, vidaMs: [500, 800], velocidade: [-70, -40], direcao: 'fora', gravidade: 0, escala: [1.2, 0.3], alpha: [0.55, 0], aditivo: false, raio: 26, cor: 0x1e0f2b, forma: 'anel', arrasto: 0.2 };
const raioDeLuz: Emissao = { textura: 'faisca', quantidade: 8, vidaMs: [300, 480], velocidade: [60, 120], direcao: 'fora', gravidade: 0, escala: [1.1, 0.2], alpha: [0.9, 0], aditivo: true, raio: 6, cor: 0xfff3c4, forma: 'anel', arrasto: 0.6 };
const fagulhaDourada: Emissao = { textura: 'estrela', quantidade: 4, vidaMs: [500, 800], velocidade: [15, 40], direcao: 'cima', gravidade: 0, escala: [0.45, 0.15], alpha: [1, 0], aditivo: true, raio: 12, cor: 0xffd86b, giro: [-3, 3] };
const ondaPsiquica: Emissao = { textura: 'anel', quantidade: 3, vidaMs: [420, 620], velocidade: [0, 4], direcao: 'livre', gravidade: 0, escala: [0.3, 1.6], alpha: [0.7, 0], aditivo: true, raio: 2, cor: 0xe08bff, corFinal: 0x6a5cff };
const espiral: Emissao = { textura: 'faisca', quantidade: 12, vidaMs: [300, 460], velocidade: [90, 150], direcao: 'fora', gravidade: 0, escala: [0.9, 0.3], alpha: [0.8, 0], aditivo: true, raio: 20, cor: 0xe8f8f5, forma: 'espiral' };
const respingo: Emissao = { textura: 'gota', quantidade: 9, vidaMs: [300, 540], velocidade: [80, 180], direcao: 'livre', gravidade: 400, escala: [0.65, 0.35], alpha: [1, 0], aditivo: false, raio: 4, cor: 0xc0392b, corFinal: 0x5b0e0e };

/** Uma aura de estado: poucas partículas, vida longa (sai a cada ~320 ms enquanto o estado dura). */
const aura = (e: Emissao, quantidade = 2): Emissao => ({ ...e, quantidade, raio: Math.max(e.raio, 10) });

export const PRESETS_ELEMENTOS: Readonly<Record<NomePresetElemento, Lista>> = {
  // Impacto (a matéria do elemento no alvo).
  mat_fogo: [chama, brasa, fumacaEscura],
  mat_gelo: [cristal, { ...nevoaFria, quantidade: 3 }, { textura: 'floco', quantidade: 4, vidaMs: [600, 900], velocidade: [10, 30], direcao: 'livre', gravidade: 10, escala: [0.5, 0.2], alpha: [0.9, 0], aditivo: true, raio: 12, cor: 0xffffff, giro: [-2, 2] }],
  mat_raio: [arco, { ...arco, quantidade: 3, vidaMs: [110, 200], raio: 16 }, { textura: 'brilho', quantidade: 4, vidaMs: [90, 160], velocidade: [0, 10], direcao: 'livre', gravidade: 0, escala: [1, 0.3], alpha: [1, 0], aditivo: true, raio: 3, cor: 0xffffff }],
  mat_veneno: [bolha, pingo, { textura: 'fumaca', quantidade: 3, vidaMs: [600, 900], velocidade: [6, 16], direcao: 'cima', gravidade: -6, escala: [0.5, 1.1], alpha: [0.3, 0], aditivo: false, raio: 8, cor: 0x3f8f3a }],
  mat_terra: [lasca, poeiraPesada],
  mat_trevas: [suga, { textura: 'ponto', quantidade: 8, vidaMs: [380, 620], velocidade: [-90, -50], direcao: 'fora', gravidade: 0, escala: [0.4, 0.05], alpha: [1, 0], aditivo: true, raio: 30, cor: 0x9b59b6, forma: 'espiral' }],
  mat_luz: [raioDeLuz, fagulhaDourada, { textura: 'brilho', quantidade: 6, vidaMs: [400, 700], velocidade: [30, 60], direcao: 'cima', gravidade: -20, escala: [0.7, 0.1], alpha: [1, 0], aditivo: true, raio: 10, cor: 0xfff3c4 }],
  mat_psiquico: [ondaPsiquica, { textura: 'ponto', quantidade: 6, vidaMs: [400, 700], velocidade: [20, 50], direcao: 'fora', gravidade: 0, escala: [0.35, 0.05], alpha: [0.9, 0], aditivo: true, raio: 14, cor: 0xf0b8ff, forma: 'espiral' }],
  mat_vento: [espiral, { ...nevoaFria, quantidade: 3, cor: 0xe8f8f5, alpha: [0.2, 0] }],
  mat_sangue: [respingo, { textura: 'fumaca', quantidade: 3, vidaMs: [400, 700], velocidade: [10, 25], direcao: 'livre', gravidade: 0, escala: [0.5, 1.1], alpha: [0.3, 0], aditivo: false, raio: 6, cor: 0x8b1a1a }],
  mat_sombra: [{ ...suga, quantidade: 6, cor: 0x140c1c }, { textura: 'fumaca', quantidade: 4, vidaMs: [600, 900], velocidade: [10, 30], direcao: 'livre', gravidade: -4, escala: [0.6, 1.4], alpha: [0.5, 0], aditivo: false, raio: 8, cor: 0x2b1838 }],
  // Conjuração (na mão de quem lança, a cada ~120 ms).
  con_fogo: [{ ...chama, quantidade: 2, velocidade: [10, 30], escala: [0.5, 0.1] }, { ...brasa, quantidade: 1 }],
  con_gelo: [{ ...nevoaFria, quantidade: 1, velocidade: [-20, -8], raio: 18 }, { ...cristal, quantidade: 1, velocidade: [10, 20], gravidade: 0 }],
  con_raio: [{ ...arco, quantidade: 2, escala: [0.5, 0.4], raio: 8 }],
  con_veneno: [{ ...bolha, quantidade: 2, escala: [0.2, 0.45] }],
  con_terra: [{ textura: 'lasca', quantidade: 2, vidaMs: [400, 600], velocidade: [20, 40], direcao: 'cima', gravidade: 80, escala: [0.4, 0.3], alpha: [1, 0], aditivo: false, raio: 10, cor: 0x8d6e63, giro: [-4, 4] }],
  con_trevas: [{ ...suga, quantidade: 3, escala: [0.8, 0.2], raio: 20 }],
  con_luz: [{ ...fagulhaDourada, quantidade: 1 }, { textura: 'brilho', quantidade: 2, vidaMs: [300, 500], velocidade: [10, 25], direcao: 'cima', gravidade: 0, escala: [0.5, 0.1], alpha: [0.9, 0], aditivo: true, raio: 8, cor: 0xfff3c4 }],
  con_psiquico: [{ ...ondaPsiquica, quantidade: 1, escala: [0.2, 0.9] }],
  con_vento: [{ ...espiral, quantidade: 4, raio: 14 }],
  con_sangue: [{ ...respingo, quantidade: 2, velocidade: [20, 50] }],
  con_sombra: [{ ...suga, quantidade: 2, raio: 18 }],
  // Auras dos estados, no alvo.
  aura_queimando: [aura(chama), aura(brasa, 1)],
  aura_geada: [aura(nevoaFria, 1), { textura: 'floco', quantidade: 1, vidaMs: [700, 1000], velocidade: [4, 12], direcao: 'baixo', gravidade: 6, escala: [0.35, 0.15], alpha: [0.9, 0], aditivo: true, raio: 12, cor: 0xe8f6ff, giro: [-2, 2] }],
  aura_congelado: [aura({ ...cristal, velocidade: [10, 30], gravidade: 0 }, 2), aura(nevoaFria, 1)],
  aura_eletrizado: [aura(arco, 2)],
  aura_envenenado: [aura(bolha, 2), aura(pingo, 1)],
  aura_molhado: [{ textura: 'gota', quantidade: 2, vidaMs: [400, 600], velocidade: [5, 20], direcao: 'baixo', gravidade: 300, escala: [0.4, 0.25], alpha: [0.9, 0], aditivo: false, raio: 10, cor: 0x85c1e9 }],
  aura_atolado: [{ textura: 'gota', quantidade: 2, vidaMs: [500, 800], velocidade: [5, 15], direcao: 'baixo', gravidade: 200, escala: [0.5, 0.3], alpha: [1, 0], aditivo: false, raio: 10, cor: 0x6d4c41 }],
  aura_definhando: [aura(suga, 2)],
  aura_consagrado: [aura(fagulhaDourada, 1), { textura: 'brilho', quantidade: 1, vidaMs: [500, 800], velocidade: [10, 20], direcao: 'cima', gravidade: 0, escala: [0.4, 0.05], alpha: [0.8, 0], aditivo: true, raio: 12, cor: 0xfff3c4 }],
  aura_sangrando: [aura(respingo, 2)],
  aura_cego: [{ textura: 'fumaca', quantidade: 2, vidaMs: [600, 900], velocidade: [4, 10], direcao: 'livre', gravidade: 0, escala: [0.4, 0.9], alpha: [0.4, 0], aditivo: false, raio: 8, cor: 0xeaeaea, alturaInicial: 10 }],
  aura_medo: [{ textura: 'fumaca', quantidade: 2, vidaMs: [500, 800], velocidade: [15, 30], direcao: 'cima', gravidade: -10, escala: [0.4, 1], alpha: [0.45, 0], aditivo: false, raio: 10, cor: 0x3d1f4f }],
  aura_confuso: [{ ...ondaPsiquica, quantidade: 1, escala: [0.2, 0.8], alturaInicial: 14 }, { textura: 'estrela', quantidade: 1, vidaMs: [500, 700], velocidade: [20, 30], direcao: 'fora', gravidade: 0, escala: [0.3, 0.2], alpha: [1, 0], aditivo: true, raio: 12, cor: 0xf0b8ff, forma: 'espiral', alturaInicial: 14 }],
  aura_marca: [{ textura: 'anel', quantidade: 1, vidaMs: [500, 700], velocidade: [0, 0], direcao: 'livre', gravidade: 0, escala: [1, 0.5], alpha: [0.8, 0], aditivo: true, raio: 0, cor: null }],
  aura_enraizado: [{ ...lasca, quantidade: 2, velocidade: [10, 30], gravidade: 100, raio: 12 }],
  aura_vertente: [{ textura: 'runa', quantidade: 1, vidaMs: [900, 1300], velocidade: [6, 14], direcao: 'cima', gravidade: -4, escala: [0.4, 0.55], alpha: [0.55, 0], aditivo: true, raio: 14, cor: null, giro: [-1, 1] }],
  // A ultimate: a explosão de luz em volta de quem lança (o material do elemento vem junto, em efeitos-classe.ts).
  ultimate: [
    { textura: 'brilho', quantidade: 40, vidaMs: [420, 620], velocidade: [220, 300], direcao: 'fora', gravidade: 0, escala: [0.9, 0.2], alpha: [1, 0], aditivo: true, raio: 12, cor: null, forma: 'anel', arrasto: 0.7 },
    { textura: 'estrela', quantidade: 12, vidaMs: [600, 900], velocidade: [40, 90], direcao: 'cima', gravidade: -20, escala: [0.7, 0.2], alpha: [1, 0], aditivo: true, raio: 20, cor: 0xfff3c4, giro: [-4, 4] },
    { textura: 'faisca', quantidade: 20, vidaMs: [260, 420], velocidade: [260, 420], direcao: 'livre', gravidade: 0, escala: [1.1, 0.2], alpha: [1, 0], aditivo: true, raio: 4, cor: null, arrasto: 0.8 },
  ],
  ultimate_eco: [{ textura: 'anel', quantidade: 2, vidaMs: [520, 700], velocidade: [0, 0], direcao: 'livre', gravidade: 0, escala: [0.4, 3.2], alpha: [0.9, 0], aditivo: true, raio: 0, cor: null }],
  // O Frenesi: brasas subindo do corpo e os olhos acesos.
  frenesi: [
    { textura: 'ponto', quantidade: 3, vidaMs: [500, 800], velocidade: [30, 60], direcao: 'cima', gravidade: -60, escala: [0.45, 0.05], alpha: [1, 0], aditivo: true, raio: 12, cor: 0xffb347, corFinal: 0xff3b1f },
    { textura: 'chama', quantidade: 1, vidaMs: [300, 460], velocidade: [20, 40], direcao: 'cima', gravidade: -80, escala: [0.5, 0.1], alpha: [0.8, 0], aditivo: true, raio: 8, cor: 0xffa040, corFinal: 0xc0392b },
  ],
  frenesi_olhos: [{ textura: 'brilho', quantidade: 2, vidaMs: [140, 200], velocidade: [0, 0], direcao: 'livre', gravidade: 0, escala: [0.22, 0.18], alpha: [1, 0.4], aditivo: true, raio: 3, cor: 0xff5a1f, alturaInicial: 8 }],
  furia_meia: [{ textura: 'faisca', quantidade: 2, vidaMs: [240, 360], velocidade: [30, 60], direcao: 'cima', gravidade: 80, escala: [0.4, 0.1], alpha: [0.9, 0], aditivo: true, raio: 10, cor: 0xff4d3a }],
  // As rachaduras do chão (Salto esmagador e golpes fortes): lascas deitadas e incandescentes que somem em 2 s.
  rachadura: [
    { textura: 'arco', quantidade: 6, vidaMs: [1700, 2100], velocidade: [0, 0], direcao: 'fora', gravidade: 0, escala: [0.9, 0.9], alpha: [0.9, 0], aditivo: true, raio: 14, cor: 0xffa040, corFinal: 0x3a2a20, forma: 'anel' },
    { ...poeiraPesada, quantidade: 8 },
  ],
  // O aparo do Contragolpe: o anel branco de impacto.
  aparo: [
    { textura: 'anel', quantidade: 1, vidaMs: [220, 300], velocidade: [0, 0], direcao: 'livre', gravidade: 0, escala: [0.5, 2.2], alpha: [1, 0], aditivo: true, raio: 0, cor: 0xffffff },
    { textura: 'faisca', quantidade: 10, vidaMs: [160, 260], velocidade: [180, 300], direcao: 'livre', gravidade: 0, escala: [0.8, 0.2], alpha: [1, 0], aditivo: true, raio: 2, cor: 0xffffff, arrasto: 0.6 },
  ],
};
