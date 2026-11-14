// O desenho das passagens entre as regiões do Mundo (marco 41, 14/11/2026, D-169). Cada lado com vizinha ganha, no meio
// da borda, uma faixa de `PROFUNDIDADE_PASSAGEM` células: o corredor de `LARGURA_PASSAGEM`, duas células de margem de
// cada lado e um muro fechando a faixa. A faixa é a mesma nas duas regiões (as duas veem o mesmo trecho de mundo): a
// do lado norte de uma é a do lado sul da vizinha de cima, linha a linha. Por isso tudo sai das coordenadas físicas
// da faixa (`u` ao longo da borda, `t` a partir da ponta norte ou oeste) e do par de regiões, nunca do RNG de cada uma.
//
// O tipo da passagem segue o par de biomas (a narrativa do caminho entre os dois lugares):
// - o cânion de arenito chega ao deserto; a passarela de tábuas atravessa o brejo; o desfiladeiro gelado sobe à neve;
// - o portão em ruínas marca a entrada das ruínas; a ponte cruza a ravina entre as colinas;
// - a trilha entre as árvores liga a floresta e os campos.
// Puro.

import type { Celula } from '../core/comandos';
import { hashTexto } from '../core/rng';
import { LADOS, vizinha, type Bioma, type LadoDaRegiao, type Reino, type RegiaoDoMundo } from '../mundo/reino';
import type { GradeDoExterior } from './exterior-extras';
import type { Decoracao, TipoDecoracao } from './decoracao';
import { hashCelula } from './decoracao';
import type { AreaDePassagem } from './passagem';

/** Largura do corredor andável (a abertura da borda de antes). */
export const LARGURA_PASSAGEM = 6;
/** Comprimento da faixa dentro de cada região (a passagem inteira é este trecho, visto dos dois lados). */
export const PROFUNDIDADE_PASSAGEM = 28;
/** As células de margem entre o corredor e o muro, de cada lado. */
const MARGEM = 2;
/**
 * A sala troca quando quem anda para fora passa desta profundidade (meio da faixa, com folga): chega do outro lado a
 * `PROFUNDIDADE - 1 - d`, além do gatilho de volta, então ninguém fica indo e vindo.
 */
export const TROCA_NA_PASSAGEM = PROFUNDIDADE_PASSAGEM / 2 - 2;

export const TIPOS_PASSAGEM = ['canion', 'passarela', 'desfiladeiro', 'portao', 'ponte', 'trilha'] as const;
export type TipoPassagem = (typeof TIPOS_PASSAGEM)[number];

/** O bioma que manda na passagem, em ordem: o primeiro presente no par decide. */
const PRIORIDADE: readonly [Bioma, TipoPassagem][] = [
  ['deserto', 'canion'], ['pantano', 'passarela'], ['neve', 'desfiladeiro'], ['ruinas', 'portao'], ['colinas', 'ponte'],
  ['floresta', 'trilha'], ['campo', 'trilha'],
];

export function tipoDaPassagem(a: Bioma, b: Bioma): TipoPassagem {
  return PRIORIDADE.find(([bioma]) => a === bioma || b === bioma)?.[1] ?? 'trilha';
}

interface Desenho {
  /** O chão do corredor e o das margens (o muro é sempre rocha). */
  piso: string;
  margem: string;
  /** Os enfeites das margens e os do corredor (perto das beiradas), com a chance por célula. */
  enfeitesMargem: readonly TipoDecoracao[];
  enfeitesCorredor: readonly TipoDecoracao[];
  densidade: number;
  /** A luz do caminho: lanternas nas beiradas a cada `passoLuz` linhas. */
  luz: 'vela' | 'tocha';
}

const DESENHOS: Readonly<Record<TipoPassagem, Desenho>> = {
  // A ponte sobre a ravina: o abismo dos dois lados, só as lanternas no parapeito.
  ponte: { piso: '=', margem: ' ', enfeitesMargem: [], enfeitesCorredor: ['pedras', 'rachadura'], densidade: 0.12, luz: 'vela' },
  // A passarela de tábuas no brejo: água rasa e juncos dos lados, cogumelos nas tábuas.
  passarela: { piso: '=', margem: '~', enfeitesMargem: ['junco', 'junco', 'poca'], enfeitesCorredor: ['cogumelo', 'musgo'], densidade: 0.35, luz: 'vela' },
  // O desfiladeiro gelado: paredões de rocha, neve e gelo no chão.
  desfiladeiro: { piso: '.', margem: '#', enfeitesMargem: [], enfeitesCorredor: ['neve', 'gelo', 'pedras'], densidade: 0.3, luz: 'vela' },
  // O cânion de arenito: areia, ossos e cactos.
  canion: { piso: '.', margem: '#', enfeitesMargem: [], enfeitesCorredor: ['areia', 'ossos', 'cacto', 'pedras'], densidade: 0.22, luz: 'vela' },
  // O portão em ruínas: lajes rachadas, estandartes, lápides e tochas.
  portao: { piso: '.', margem: '#', enfeitesMargem: [], enfeitesCorredor: ['rachadura', 'ossos', 'lapide', 'estandarte'], densidade: 0.2, luz: 'tocha' },
  // A trilha entre as árvores: o caminho de terra com árvores e arbustos nas margens.
  trilha: { piso: '=', margem: ',', enfeitesMargem: ['arvore', 'arbusto', 'arvore', 'flores'], enfeitesCorredor: ['flores', 'pedras', 'raiz'], densidade: 0.45, luz: 'vela' },
};

/** De quantas em quantas linhas vai uma lanterna em cada beirada do corredor. */
const PASSO_LUZ = 5;

export interface PassagemDoExterior {
  lado: LadoDaRegiao;
  tipo: TipoPassagem;
  area: AreaDePassagem;
  /** As células da borda (profundidade 0) do corredor. */
  borda: Celula[];
}

/** O meio da borda: onde começa o corredor (a mesma conta nas duas regiões, então a faixa se encaixa). */
const inicioDoCorredor = (n: number) => Math.floor(n / 2) - Math.floor(LARGURA_PASSAGEM / 2);

/** A célula da faixa do lado `lado` em `u` (ao longo da borda, 0 = primeira do corredor) e `d` (profundidade). */
export function celulaDaFaixa(n: number, lado: LadoDaRegiao, u: number, d: number): Celula {
  const m = inicioDoCorredor(n) + u;
  return lado === 'norte' ? { x: m, y: d } : lado === 'sul' ? { x: m, y: n - 1 - d } : lado === 'oeste' ? { x: d, y: m } : { x: n - 1 - d, y: m };
}

/** O contrário de `celulaDaFaixa`: `u` e `d` da célula (sem conferir se está na faixa). */
export function posicaoNaFaixa(n: number, lado: LadoDaRegiao, x: number, y: number): { u: number; d: number } {
  const m = inicioDoCorredor(n);
  if (lado === 'norte') return { u: x - m, d: y };
  if (lado === 'sul') return { u: x - m, d: n - 1 - y };
  if (lado === 'oeste') return { u: y - m, d: x };
  return { u: y - m, d: n - 1 - x };
}

/** A linha física da faixa (a partir da ponta norte ou oeste): igual nas duas regiões para o mesmo ponto. */
const linhaFisica = (lado: LadoDaRegiao, d: number) => (lado === 'norte' || lado === 'oeste' ? d : PROFUNDIDADE_PASSAGEM - 1 - d);

/** Onde cada passagem chega por dentro: logo depois da boca da faixa, no meio. */
export function entradaDoLado(n: number, lado: LadoDaRegiao): Celula {
  return celulaDaFaixa(n, lado, Math.floor(LARGURA_PASSAGEM / 2), PROFUNDIDADE_PASSAGEM + 1);
}

/** A chave do par (a mesma vista de qualquer um dos dois lados). */
const chaveDoPar = (a: RegiaoDoMundo, b: RegiaoDoMundo) => hashTexto([a.id, b.id].sort().join('|'));

/**
 * Escava as passagens da região na grade e devolve as áreas, os enfeites e as bordas. As células da faixa entram em
 * `protegidas` (estrada, casas, coleta e inimigos ficam fora).
 */
export function escavarPassagens(g: GradeDoExterior, reino: Reino, regiao: RegiaoDoMundo, protegidas: Set<number>): { passagens: PassagemDoExterior[]; enfeites: Decoracao[] } {
  const n = g.n;
  const passagens: PassagemDoExterior[] = [];
  const enfeites: Decoracao[] = [];
  for (const lado of LADOS) {
    const outra = vizinha(reino, regiao, lado);
    if (!outra) continue;
    const tipo = tipoDaPassagem(regiao.bioma, outra.bioma);
    const desenho = DESENHOS[tipo];
    const sal = chaveDoPar(regiao, outra);
    const borda: Celula[] = [];
    for (let d = 0; d < PROFUNDIDADE_PASSAGEM; d++) {
      const t = linhaFisica(lado, d);
      for (let u = -MARGEM - 1; u <= LARGURA_PASSAGEM + MARGEM; u++) {
        const c = celulaDaFaixa(n, lado, u, d);
        const muro = u === -MARGEM - 1 || u === LARGURA_PASSAGEM + MARGEM;
        const corredor = u >= 0 && u < LARGURA_PASSAGEM;
        g.por(c.x, c.y, muro ? '#' : corredor ? desenho.piso : desenho.margem);
        protegidas.add(c.y * n + c.x);
        if (corredor && d === 0) borda.push(c);
        if (muro) continue;
        const beirada = u === 0 || u === LARGURA_PASSAGEM - 1;
        // A lanterna na beirada; os enfeites pelo hash físico (o mesmo nos dois lados).
        if (beirada && t % PASSO_LUZ === 2) {
          enfeites.push({ tipo: desenho.luz, x: c.x, y: c.y, variante: hashCelula(u, t, sal + 3) });
          continue;
        }
        const lista = corredor ? (beirada ? desenho.enfeitesCorredor : []) : desenho.enfeitesMargem;
        if (lista.length === 0 || hashCelula(u, t, sal) >= desenho.densidade) continue;
        const tipoEnfeite = lista[Math.floor(hashCelula(u, t, sal + 1) * lista.length)];
        if (tipoEnfeite) enfeites.push({ tipo: tipoEnfeite, x: c.x, y: c.y, variante: hashCelula(u, t, sal + 2) });
      }
    }
    // A boca da faixa fica sempre andável (o terreno de dentro pode ter água ou rocha bem ali).
    for (let u = 0; u < LARGURA_PASSAGEM; u++) {
      const c = celulaDaFaixa(n, lado, u, PROFUNDIDADE_PASSAGEM);
      if (g.interna(c.x, c.y) && !protegidas.has(c.y * n + c.x)) g.por(c.x, c.y, '=');
    }
    const cantos = [celulaDaFaixa(n, lado, -MARGEM - 1, 0), celulaDaFaixa(n, lado, LARGURA_PASSAGEM + MARGEM, PROFUNDIDADE_PASSAGEM - 1)];
    const xs = cantos.map((c) => c.x);
    const ys = cantos.map((c) => c.y);
    passagens.push({ lado, tipo, borda, area: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), tipo } });
  }
  return { passagens, enfeites };
}

/**
 * A célula correspondente na vizinha do lado `lado`: o mesmo ponto físico da faixa (mesmo `u`, a profundidade
 * espelhada). `tamanhoAqui` e `tamanhoLa` são os lados das duas regiões.
 */
export function chegadaPelaPassagem(tamanhoAqui: number, tamanhoLa: number, lado: LadoDaRegiao, x: number, y: number): Celula {
  const { u, d } = posicaoNaFaixa(tamanhoAqui, lado, x, y);
  const oposto: LadoDaRegiao = lado === 'norte' ? 'sul' : lado === 'sul' ? 'norte' : lado === 'leste' ? 'oeste' : 'leste';
  return celulaDaFaixa(tamanhoLa, oposto, u, PROFUNDIDADE_PASSAGEM - 1 - d);
}

/** Em que passagem da região está a célula, e a que profundidade (null fora de todas). */
export function passagemEm(passagens: readonly PassagemDoExterior[], n: number, x: number, y: number): { passagem: PassagemDoExterior; d: number } | null {
  for (const p of passagens) {
    const a = p.area;
    if (x < a.x0 || x > a.x1 || y < a.y0 || y > a.y1) continue;
    return { passagem: p, d: posicaoNaFaixa(n, p.lado, x, y).d };
  }
  return null;
}
