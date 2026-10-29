// Emissões comuns das assinaturas (marco 26, 29/10/2026, D-124): a chama viva, a brasa que vira fumaça, a fumaça
// escura, as faíscas metálicas, a geada, a poeira. `em` preenche o que a emissão não diz (vida, direção, escala).

import type { Emissao } from '../presets-particula';
import { QUADROS_CHAMA } from './texturas';

type Pedido = Partial<Emissao> & Pick<Emissao, 'textura' | 'quantidade'>;

export function em(o: Pedido): Emissao {
  return { vidaMs: [300, 500], velocidade: [0, 0], direcao: 'livre', gravidade: 0, escala: [1, 1], alpha: [1, 0], aditivo: false, raio: 0, cor: null, ...o };
}

// --- Fogo. As paradas de cor da chama: miolo branco-amarelo, laranja, vermelho e o fim quase apagado.
export const CORES_CHAMA = [0xfff4c0, 0xffc04a, 0xff6a1a, 0xa8200a] as const;
export const CORES_BRASA = [0xffffff, 0xffd070, 0xff5a10, 0x5a1a0a] as const;

/** A fumaça que sobra da brasa (subemissão). */
export const FUMACA_DA_BRASA: readonly Emissao[] = [
  em({ textura: 'fumaca2', quantidade: 1, vidaMs: [500, 800], velocidade: [6, 16], direcao: 'cima', gravidade: -12, escala: [0.18, 0.5], alpha: [0.25, 0], cor: 0x6a625c, turbulencia: 10 }),
];

/** A labareda que tremula e sobe ondulando (flipbook + turbulência). */
export function chamaViva(quantidade: number, o: Partial<Emissao> = {}): Emissao {
  return em({
    textura: 'chama0',
    quadros: QUADROS_CHAMA,
    quantidade,
    vidaMs: [320, 520],
    velocidade: [20, 55],
    direcao: 'cima',
    abertura: 0.35,
    gravidade: -70,
    escala: [0.75, 0.25],
    curvaEscala: 'sai',
    alpha: [1, 0],
    curvaAlpha: 'entra',
    aditivo: true,
    raio: 6,
    cores: CORES_CHAMA,
    turbulencia: 35,
    ...o,
  });
}

/** Brasas incandescentes que sobem tremendo e viram fumaça. */
export function brasas(quantidade: number, o: Partial<Emissao> = {}): Emissao {
  return em({
    textura: 'brasa',
    quantidade,
    vidaMs: [450, 850],
    velocidade: [50, 140],
    direcao: 'cima',
    abertura: 1.1,
    gravidade: 40,
    arrasto: 0.9,
    escala: [0.22, 0.06],
    alpha: [1, 0],
    curvaAlpha: 'entra',
    aditivo: true,
    raio: 5,
    cores: CORES_BRASA,
    turbulencia: 45,
    esticar: 0.35,
    aoMorrer: FUMACA_DA_BRASA,
    ...o,
  });
}

/** Fumaça escura que sobe e se espalha. */
export function fumacaEscura(quantidade: number, o: Partial<Emissao> = {}): Emissao {
  return em({
    textura: 'fumaca1',
    quantidade,
    vidaMs: [800, 1300],
    velocidade: [10, 30],
    direcao: 'cima',
    abertura: 0.6,
    gravidade: -14,
    escala: [0.45, 1.3],
    curvaEscala: 'sai',
    alpha: [0.5, 0],
    raio: 8,
    cor: 0x2b2522,
    turbulencia: 14,
    giro: [-0.8, 0.8],
    ...o,
  });
}

/** Faíscas de metal batendo (amarelo-branco, rápidas, esticadas, caindo). */
export function faiscasMetal(quantidade: number, o: Partial<Emissao> = {}): Emissao {
  return em({
    textura: 'faisca',
    quantidade,
    vidaMs: [180, 360],
    velocidade: [140, 300],
    direcao: 'livre',
    gravidade: 520,
    arrasto: 0.6,
    escala: [0.35, 0.1],
    alpha: [1, 0],
    aditivo: true,
    raio: 3,
    cores: [0xffffff, 0xffe08a, 0xff9a3a],
    esticar: 0.4,
    ...o,
  });
}

/** Poeira do chão que sobe e se abre (pancada, queda, investida). */
export function poeira(quantidade: number, o: Partial<Emissao> = {}): Emissao {
  return em({
    textura: 'fumaca3',
    quantidade,
    vidaMs: [500, 900],
    velocidade: [30, 80],
    direcao: 'fora',
    forma: 'anel',
    gravidade: -10,
    arrasto: 1.2,
    escala: [0.4, 1],
    curvaEscala: 'sai',
    alpha: [0.5, 0],
    raio: 10,
    cor: 0xb8a68a,
    ...o,
  });
}

/** Cintilar de luz (sagrado, estrelas, cura). */
export function cintilar(quantidade: number, o: Partial<Emissao> = {}): Emissao {
  return em({
    textura: 'cintilar',
    quantidade,
    vidaMs: [400, 700],
    velocidade: [10, 40],
    direcao: 'cima',
    gravidade: -20,
    escala: [0.05, 0.4],
    curvaEscala: 'pulso',
    alpha: [1, 0.2],
    aditivo: true,
    raio: 12,
    cor: null,
    giro: [-1.5, 1.5],
    ...o,
  });
}

/** Névoa (sombra, veneno, mortalha): fumaça clara tingida que fica e ondula. */
export function nevoa(quantidade: number, o: Partial<Emissao> = {}): Emissao {
  return em({
    textura: 'fumaca2',
    quantidade,
    vidaMs: [700, 1100],
    velocidade: [6, 22],
    direcao: 'livre',
    gravidade: -6,
    escala: [0.5, 1.2],
    curvaEscala: 'sai',
    alpha: [0, 0.45],
    curvaAlpha: 'pulso',
    raio: 12,
    cor: null,
    turbulencia: 10,
    giro: [-0.6, 0.6],
    ...o,
  });
}
