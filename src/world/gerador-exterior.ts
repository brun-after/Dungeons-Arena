// O exterior de uma região do Mundo (marco 29, 30/10/2026, D-128): o terreno sai da semente da região, sempre igual
// no servidor e no cliente. Ruído suave em grade grossa decide a água e as rochas (ou árvores) pelo bioma; por cima
// entram os pontos escritos à mão no reino: a vila murada com os NPCs, as fachadas das estruturas com a porta e as
// passagens para as regiões vizinhas. Estradas ligam a vila (ou o centro) às passagens e às portas, então tudo o
// que importa fica alcançável; a coleta e os inimigos só caem em células alcançáveis. Puro.
// Marco 31 (31/10/2026, D-130): casas fechadas de pedra com telhado: na vila (o telhado some de perto) e, nas regiões
// normais e perigosas, as abandonadas (o telhado só some ao entrar, e há um monstro lá dentro). As casas usam um
// gerador de números à parte, para não mexer no sorteio do resto.

import { ehDragao, porteDoDragao } from './porte-dragoes';
import { BALANCE_PADRAO } from '../core/contexto';
import { aleatorio, criarRng, inteiro, escolher, type EstadoRng } from '../core/rng';
import { portaDa, type Bioma, type LadoDaRegiao, type PapelNpc, type Reino, type RegiaoDoMundo } from '../mundo/reino';
import type { Celula } from '../core/comandos';
import type { FaseJson, InimigoPosicionado, ObjetoPosicionadoJson, SpawnJson, Telhado } from './fase';
import { armadilhaDeFase } from './armadilhas-de-fase';
import type { AreaAmbiente, TipoAmbiente } from './ambiente-tipos';
import { erguerPredios, PREDIO_DO_PAPEL } from './vila-predios';
import { entradaDoLado, escavarPassagens, type PassagemDoExterior } from './passagens-exterior';
import type { Decoracao } from './decoracao';
import { abrigoDoCentro, andarilhosDaRegiao, entradasDosLados, escavarCorredor, nivelDoMonstro, rotasDosErrantes } from './exterior-extras';
import { luzesDoExterior } from './luzes-exterior';
import { gerarRelevo } from './relevo-exterior';
import { gerarGeografia, OBSTACULO } from './geografia';
import { abrirEstrada, type TerrenoDaEstrada } from './estradas-exterior';
import { comporCenario, type PecaDoCenario } from './composicao-cenario';
import { emPassagem } from './passagem';

export { LARGURA_PASSAGEM } from './passagens-exterior';
/** Distância mínima (Chebyshev) entre os inimigos e a vila ou os spawns. */
const FOLGA_INIMIGOS = 12;

/** O que o bioma põe no chão: o piso de base e os limiares do ruído para água e obstáculo (0–1; maior = menos). */
interface PerfilDeBioma {
  chao: ',' | '.';
  agua: number;
  rocha: number;
}

const PERFIS: Readonly<Record<Bioma, PerfilDeBioma>> = {
  campo: { chao: ',', agua: 0.8, rocha: 0.8 },
  floresta: { chao: ',', agua: 0.84, rocha: 0.62 },
  pantano: { chao: ',', agua: 0.58, rocha: 0.82 },
  colinas: { chao: ',', agua: 0.88, rocha: 0.66 },
  ruinas: { chao: '.', agua: 0.9, rocha: 0.7 },
  neve: { chao: '.', agua: 0.86, rocha: 0.7 },
  // Marco 38 (D-142): o deserto, quase sem água (um oásis raro) e com rochedos de arenito.
  deserto: { chao: '.', agua: 0.95, rocha: 0.74 },
};

export type PontoDoExterior =
  | { tipo: 'npc'; papel: PapelNpc; x: number; y: number }
  /** Marco 38 (D-142): quem dá missão fora da vila, com a aparência de um preset (ou `gente`). */
  | { tipo: 'andarilho'; id: string; aparencia: string; x: number; y: number }
  | { tipo: 'coleta'; itemId: string; x: number; y: number }
  /** Marco 42 (15/11/2026, D-176): os postes de tocha (nas estradas) e as fogueiras (nas matas e nos abrigos). */
  | { tipo: 'luz'; objeto: 'poste_tocha' | 'fogueira'; x: number; y: number }
  | { tipo: 'estrutura'; estruturaId: string; porta: Celula; frente: Celula; escondida: boolean };

export interface ExteriorGerado {
  fase: FaseJson;
  pontos: PontoDoExterior[];
  /** As células da borda que passam para a vizinha, por lado (vazio onde o reino acaba). */
  passagens: Readonly<Record<LadoDaRegiao, readonly Celula[]>>;
  /** Marco 41 (D-169): as passagens inteiras (a faixa, o tipo e o lado) e os enfeites delas. */
  faixas: readonly PassagemDoExterior[];
  enfeites: readonly Decoracao[];
  /** A área segura da vila (sem monstros nem PvP), ou null. */
  vila: { x: number; y: number; raio: number } | null;
  /** Marco 38 (D-142): o abrigo da pedra de save no centro das regiões sem vila (os monstros não entram), ou null. */
  abrigo: { x: number; y: number; raio: number } | null;
  /** Marco 38: as rotas dos mercadores errantes (células de estrada em ordem, de ida e volta). */
  rotas: readonly (readonly Celula[])[];
  /** Marco 42 (15/11/2026, D-176): a altura de cada célula (world/relevo-exterior.ts). */
  alturas: Uint8Array;
  /** Marco 43 (D-177): o obstáculo natural de cada '#' (montanha, rochedo, árvore; 0 nas paredes construídas). */
  obstaculos: Uint8Array;
  /** Marco 43 (D-177): o que fica em pé pela função de cada lugar (world/composicao-cenario.ts). */
  pecas: readonly PecaDoCenario[];
}

class Grade {
  readonly c: string[][];
  constructor(readonly n: number, preencher: string) {
    this.c = Array.from({ length: n }, () => Array.from({ length: n }, () => preencher));
  }
  em(x: number, y: number): string {
    return this.c[y]?.[x] ?? '#';
  }
  por(x: number, y: number, ch: string): void {
    const linha = this.c[y];
    if (linha && x >= 0 && x < this.n) linha[x] = ch;
  }
  /** Dentro da moldura de 1 célula de parede. */
  interna(x: number, y: number): boolean {
    return x > 0 && y > 0 && x < this.n - 1 && y < this.n - 1;
  }
}

const ANDA = new Set([',', '.', '=']);

/** A casa da vila e a abandonada (células, com as paredes). */
const CASA_VILA = { largura: 5, altura: 4 } as const;
const CASA_ABANDONADA = { largura: 6, altura: 5 } as const;
/** Os quatro quadrantes da vila (entre os caminhos em cruz), um por casa. */
const QUADRANTES = [[1, 1], [-1, 1], [-1, -1], [1, -1]] as const;
const CASAS_NA_VILA = 12;
/** Desloca a semente das casas (o outro gerador de números). */
const SEMENTE_CASAS = 7919;
/** 06/11/2026 (D-135): o RNG das armadilhas do exterior (separado: mudar a densidade não mexe no resto). */
const SEMENTE_ARMADILHAS = 15_013;
const SEMENTE_TERRENOS = 21_011;
/** As áreas que a fase aceita (world/validacao-ambientes.ts). */
const MAX_AREAS = 48;

/**
 * 08/11/2026 (D-138): o terreno que o chefe do elemento deixa em volta do covil (a lava do dragão de fogo, o gelo do
 * de gelo…). O chefe sem elemento não deixa nada.
 */
export const TERRENO_DO_CHEFE: Readonly<Record<string, TipoAmbiente>> = {
  dragao_fogo: 'brasas', dragao_das_ruinas: 'brasas', dragao_gelo: 'gelo_fino', dragao_raio: 'campo_eletrico',
  dragao_veneno: 'miasma', necromante_ancestral: 'nevoa_sombria', bruxa_do_pantano: 'miasma',
};

/**
 * Cabe a casa em (x, y)? A casa só sobre o chão `chao`; a volta de uma célula em `margem` (por onde se passa em
 * volta dela); nada nas células `bloqueadas`.
 */
function cabeCasa(g: Grade, x: number, y: number, l: number, a: number, chao: string, margem: ReadonlySet<string>, bloqueadas: ReadonlySet<number>, limpavel: (x: number, y: number) => boolean = () => false): boolean {
  for (let cy = y - 1; cy <= y + a; cy++) {
    for (let cx = x - 1; cx <= x + l; cx++) {
      const casa = cx >= x && cy >= y && cx < x + l && cy < y + a;
      const ch = g.em(cx, cy);
      // Marco 43 (D-177): a árvore e o rochedo soltos saem do lugar da casa (a clareira); a montanha e a água, não.
      if (!g.interna(cx, cy) || bloqueadas.has(cy * g.n + cx) || (!limpavel(cx, cy) && (casa ? ch !== chao : !margem.has(ch)))) return false;
    }
  }
  return true;
}

/** A casa: paredes em volta, o chão `piso` dentro e a porta no meio da parede sul. Devolve a porta. */
function erguerCasa(g: Grade, x: number, y: number, l: number, a: number, piso: string): Celula {
  for (let cy = y; cy < y + a; cy++) {
    for (let cx = x; cx < x + l; cx++) {
      const borda = cx === x || cy === y || cx === x + l - 1 || cy === y + a - 1;
      g.por(cx, cy, borda ? '#' : piso);
    }
  }
  const porta = { x: x + Math.floor(l / 2), y: y + a - 1 };
  g.por(porta.x, porta.y, piso);
  return porta;
}

/** As casas da vila, no meio do caminho entre o anel dos NPCs e o muro. */
function casasDaVila(g: Grade, vila: NonNullable<RegiaoDoMundo['vila']>, npcs: readonly Celula[]): Telhado[] {
  const { largura: l, altura: a } = CASA_VILA;
  const anel = Math.max(4, Math.floor(vila.raio * 0.55));
  const bloqueadas = new Set(npcs.map((c) => c.y * g.n + c.x));
  const telhados: Telhado[] = [];
  // Uma casa por quadrante, na posição que cabe mais perto do meio do caminho entre o anel e o muro.
  const ideal = (anel + vila.raio) / 2;
  for (const [sx, sy] of [...QUADRANTES, ...QUADRANTES, ...QUADRANTES]) {
    if (telhados.length >= Math.min(CASAS_NA_VILA, Math.floor(vila.raio / 3))) break;
    const candidatas: { x: number; y: number; erro: number }[] = [];
    for (let dy = 2; dy <= vila.raio; dy++) {
      for (let dx = 2; dx <= vila.raio; dx++) {
        const x = sx > 0 ? vila.x + dx : vila.x - dx - l + 1;
        const y = sy > 0 ? vila.y + dy : vila.y - dy - a + 1;
        candidatas.push({ x, y, erro: Math.abs(Math.hypot(x + l / 2 - vila.x, y + a / 2 - vila.y) - ideal) });
      }
    }
    candidatas.sort((p, q) => p.erro - q.erro || p.y - q.y || p.x - q.x);
    const c = candidatas.find((k) => cabeCasa(g, k.x, k.y, l, a, '.', ANDA, bloqueadas));
    if (!c) continue;
    erguerCasa(g, c.x, c.y, l, a, '.');
    telhados.push({ x: c.x, y: c.y, largura: l, altura: a, revela: 'perto', estilo: 'telha' });
  }
  return telhados;
}

/** As casas abandonadas, longe da vila e dos spawns, e a célula de dentro de cada uma (onde fica o monstro). */
function casasAbandonadas(g: Grade, rng: EstadoRng, quantas: number, chao: string, longe: (c: Celula) => boolean, protegidas: ReadonlySet<number>, limpavel: (x: number, y: number) => boolean): { telhados: Telhado[]; dentro: Celula[] } {
  const { largura: l, altura: a } = CASA_ABANDONADA;
  const telhados: Telhado[] = [];
  const dentro: Celula[] = [];
  for (let t = 0; t < 120 && telhados.length < quantas; t++) {
    const x = inteiro(rng, 3, g.n - l - 4);
    const y = inteiro(rng, 3, g.n - a - 4);
    if (!longe({ x, y }) || !cabeCasa(g, x, y, l, a, chao, new Set([chao]), protegidas, limpavel)) continue;
    for (let cy = y - 1; cy <= y + a; cy++) for (let cx = x - 1; cx <= x + l; cx++) if (limpavel(cx, cy)) g.por(cx, cy, chao);
    erguerCasa(g, x, y, l, a, chao);
    telhados.push({ x, y, largura: l, altura: a, revela: 'dentro', estilo: 'palha' });
    dentro.push({ x: x + Math.floor(l / 2), y: y + 1 });
  }
  return { telhados, dentro };
}

/** A estrada de 2 células de largura, em L com a curva sorteada; atravessa água (ponte) e rocha. */
function estrada(g: Grade, rng: EstadoRng, de: Celula, para: Celula, protegidas: ReadonlySet<number>): void {
  const curva = inteiro(rng, 0, 1) === 0 ? { x: para.x, y: de.y } : { x: de.x, y: para.y };
  for (const [a, b] of [
    [de, curva],
    [curva, para],
  ] as const) {
    for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x) + 1; x++) {
      for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y) + 1; y++) {
        if (g.interna(x, y) && !protegidas.has(y * g.n + x)) g.por(x, y, '=');
      }
    }
  }
}

/**
 * Marco 41 (14/11/2026, D-169): as passagens para as vizinhas (world/passagens-exterior.ts) e onde cada uma chega por
 * dentro. Antes era uma abertura de seis células na borda; agora é a faixa que as duas regiões veem igual.
 */
function abrirPassagens(g: Grade, reino: Reino, regiao: RegiaoDoMundo, protegidas: Set<number>): { passagens: Record<LadoDaRegiao, Celula[]>; areas: PassagemDoExterior[]; enfeites: Decoracao[]; entradas: Celula[] } {
  const r = escavarPassagens(g, reino, regiao, protegidas);
  const passagens: Record<LadoDaRegiao, Celula[]> = { norte: [], sul: [], leste: [], oeste: [] };
  for (const p of r.passagens) passagens[p.lado] = p.borda;
  return { passagens, areas: r.passagens, enfeites: r.enfeites, entradas: r.passagens.map((p) => entradaDoLado(g.n, p.lado)) };
}

/**
 * A vila: praça de piso, muro circular com quatro portões e os NPCs em volta do centro. Marco 38 (D-142): quem atende
 * fica no seu prédio (vila-predios.ts); a pedra de save no centro da praça e os outros em anel, como antes.
 */
function erguerVila(g: Grade, vila: NonNullable<RegiaoDoMundo['vila']>, protegidas: Set<number>, telhados: Telhado[]): PontoDoExterior[] {
  const { x: cx, y: cy, raio } = vila;
  for (let y = cy - raio - 1; y <= cy + raio + 1; y++) {
    for (let x = cx - raio - 1; x <= cx + raio + 1; x++) {
      if (!g.interna(x, y)) continue;
      const d = Math.hypot(x - cx, y - cy);
      const portao = Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1;
      const ang = Math.atan2(y - cy, x - cx);
      const limite = raio * (0.9 + 0.06 * Math.sin(3 * ang) + 0.04 * Math.cos(5 * ang));
      if (d <= limite - 1) g.por(x, y, '.');
      else if (d <= limite + 0.5) g.por(x, y, portao ? '=' : '#');
      // 01/11/2026: o terreno externo permanece natural, sem recorte quadrado.
      if (d <= limite + 0.5) protegidas.add(y * g.n + x);
    }
  }
  // Marco 31 (31/10/2026, D-130): o muro com uma célula de espessura (as que encostam na praça); com 1,5, os degraus
  // do círculo viravam paredes duplas no isométrico. As de fora voltam a ser mato.
  const fora: Celula[] = [];
  for (let y = cy - raio - 1; y <= cy + raio + 1; y++) {
    for (let x = cx - raio - 1; x <= cx + raio + 1; x++) {
      if (g.em(x, y) !== '#' || !g.interna(x, y)) continue;
      let encosta = false;
      for (let dy = -1; dy <= 1 && !encosta; dy++) for (let dx = -1; dx <= 1 && !encosta; dx++) encosta = g.em(x + dx, y + dy) === '.';
      if (!encosta) fora.push({ x, y });
    }
  }
  for (const c of fora) {
    g.por(c.x, c.y, ',');
    protegidas.delete(c.y * g.n + c.x);
  }
  // Os quatro caminhos internos em cruz, do portão à praça.
  for (let i = -raio; i <= raio; i++) {
    g.por(cx + i, cy, '=');
    g.por(cx, cy + i, '=');
  }
  const anel = Math.max(4, Math.floor(raio * 0.55));
  const predios = erguerPredios(g, { x: cx, y: cy }, raio, anel + 2, vila.npcs, new Set<number>());
  telhados.push(...predios.map((p) => p.telhado));
  const naPraca = vila.npcs.filter((p) => p !== 'save' && !predios.some((f) => f.papel === p || (PREDIO_DO_PAPEL[f.papel] === 'mercado' && PREDIO_DO_PAPEL[p] === 'mercado')));
  const pontos: PontoDoExterior[] = predios.map((p) => ({ tipo: 'npc' as const, papel: p.papel, x: p.atendente.x, y: p.atendente.y }));
  if (vila.npcs.includes('save')) pontos.push({ tipo: 'npc', papel: 'save', x: cx, y: cy });
  // Os que ficam na praça (o portal e quem não coube num prédio): no anel pequeno, nas diagonais.
  const raioPraca = Math.min(anel, 4);
  naPraca.forEach((papel, i) => {
    const ang = (i / Math.max(1, naPraca.length)) * Math.PI * 2 + Math.PI / 4;
    const x = Math.round(cx + Math.cos(ang) * raioPraca);
    const y = Math.round(cy + Math.sin(ang) * raioPraca);
    g.por(x, y, '.');
    pontos.push({ tipo: 'npc', papel, x, y });
  });
  return pontos;
}

/** As células andáveis alcançáveis a partir de `origem` (busca em largura, 4 vizinhos). */
function alcancaveis(g: Grade, origem: Celula, alturas?: Uint8Array): Uint8Array {
  const n = g.n;
  const visto = new Uint8Array(n * n);
  if (!ANDA.has(g.em(origem.x, origem.y))) return visto;
  const fila = [origem.y * n + origem.x];
  visto[fila[0] as number] = 1;
  for (let i = 0; i < fila.length; i++) {
    const k = fila[i] as number;
    const x = k % n;
    const y = Math.floor(k / n);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const nk = ny * n + nx;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n || visto[nk] || !ANDA.has(g.em(nx, ny))) continue;
      // Marco 42 (D-176): pelo desnível que se anda (o muro separa).
      if (alturas && Math.abs((alturas[nk] ?? 0) - (alturas[k] ?? 0)) > BALANCE_PADRAO.relevo.encostaMax) continue;
      visto[nk] = 1;
      fila.push(nk);
    }
  }
  return visto;
}

function chebyshev(a: Celula, b: Celula): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/** Gera o exterior da região: terreno, vila, fachadas, passagens, coleta e inimigos. Determinístico pela semente. */
/** Marco 42 (D-176): a célula está numa mata fechada da região. */
export function naMata(regiao: { matas?: readonly { x: number; y: number; raio: number }[] }, x: number, y: number): boolean {
  return (regiao.matas ?? []).some((m) => Math.hypot(x - m.x, y - m.y) <= m.raio);
}

export function gerarExterior(reino: Reino, regiao: RegiaoDoMundo): ExteriorGerado {
  const n = regiao.tamanho ?? reino.tamanhoRegiao;
  const rng = criarRng(regiao.semente);
  const perfil = PERFIS[regiao.bioma];
  const g = new Grade(n, '#');
  // Marco 43 (15/11/2026, D-177): a geografia primeiro (a altura, a água, a montanha, a mata e os rochedos).
  const geo = gerarGeografia({ n, semente: regiao.semente, bioma: regiao.bioma, matas: regiao.matas ?? [] });
  for (let y = 1; y < n - 1; y++) {
    for (let x = 1; x < n - 1; x++) {
      const k = y * n + x;
      g.por(x, y, geo.agua[k] ? '~' : (geo.obstaculos[k] ?? 0) > 0 ? '#' : perfil.chao);
    }
  }
  // Marco 38 (D-142): a região estreita é um corredor entre as passagens, com paredões de arenito dos lados.
  if (regiao.estreita) escavarCorredor(g, entradasDosLados(reino, regiao, n), perfil.chao, regiao.semente);
  const protegidas = new Set<number>();
  const pontos: PontoDoExterior[] = [];
  const centro: Celula = regiao.vila ? { x: regiao.vila.x, y: regiao.vila.y } : { x: Math.floor(n / 2), y: Math.floor(n / 2) };
  // As fachadas primeiro (com uma margem de chão), para a estrada não as cortar.
  for (const e of regiao.estruturas) {
    for (let y = e.y - 2; y < e.y + e.altura + 2; y++) for (let x = e.x - 2; x < e.x + e.largura + 2; x++) if (g.interna(x, y)) g.por(x, y, perfil.chao);
    for (let y = e.y; y < e.y + e.altura; y++) {
      for (let x = e.x; x < e.x + e.largura; x++) {
        // Marco 30 (30/10/2026, D-129): a escondida é um rochedo como os outros (sem fachada nem estrada até ela).
        g.por(x, y, e.escondida ? '#' : 'F');
        protegidas.add(y * n + x);
      }
    }
    const { porta, frente } = portaDa(e);
    g.por(porta.x, porta.y, '=');
    pontos.push({ tipo: 'estrutura', estruturaId: e.id, porta, frente, escondida: e.escondida });
  }
  const telhados: Telhado[] = [];
  if (regiao.vila) {
    const npcs = erguerVila(g, regiao.vila, protegidas, telhados);
    pontos.push(...npcs);
    telhados.push(...casasDaVila(g, regiao.vila, npcs.flatMap((p) => (p.tipo === 'npc' ? [p] : []))));
  }
  // Marco 38 (D-142): toda região sem vila tem a pedra de save no centro, numa clareira abrigada.
  const abrigo = regiao.vila ? null : abrigoDoCentro(g, centro, protegidas);
  if (abrigo) pontos.push({ tipo: 'npc', papel: 'save', x: centro.x, y: centro.y });
  const { passagens, areas, enfeites, entradas } = abrirPassagens(g, reino, regiao, protegidas);
  // Das portas da vila (ou do centro) até cada passagem e cada porta de estrutura.
  const saidaDaVila = (alvo: Celula): Celula => {
    if (!regiao.vila) return centro;
    const { x, y, raio } = regiao.vila;
    const dx = alvo.x - x;
    const dy = alvo.y - y;
    return Math.abs(dx) > Math.abs(dy) ? { x: x + Math.sign(dx) * (raio + 1), y } : { x, y: y + Math.sign(dy || 1) * (raio + 1) };
  };
  // Marco 43 (D-177): a estrada segue o terreno (world/estradas-exterior.ts); o L reto fica de reserva.
  const terreno: TerrenoDaEstrada = { n, em: (x, y) => g.em(x, y), por: (x, y, ch) => { g.por(x, y, ch); }, alturas: geo.alturas, obstaculos: geo.obstaculos, protegidas };
  const ligar = (de: Celula, para: Celula) => { if (!abrirEstrada(terreno, de, para)) estrada(g, rng, de, para, protegidas); };
  for (const alvo of entradas) ligar(saidaDaVila(alvo), alvo);
  for (const p of pontos) if (p.tipo === 'estrutura' && !p.escondida) ligar(saidaDaVila(p.frente), p.frente);
  // A escondida ganha só a picada (na montanha, sem ela, ninguém chegaria).
  for (const p of pontos) if (p.tipo === 'estrutura' && p.escondida) abrirEstrada(terreno, saidaDaVila(p.frente), p.frente, perfil.chao);
  // A frente da porta fica sempre livre.
  for (const p of pontos) if (p.tipo === 'estrutura') g.por(p.frente.x, p.frente.y, '=');

  const spawns: SpawnJson[] = regiao.vila
    ? [-2, 0, 2].flatMap((dx) => [-2, 2].map((dy) => ({ x: centro.x + dx, y: centro.y + dy })))
    : entradas.length > 0
      ? entradas.map((c) => ({ x: c.x, y: c.y }))
      : [{ x: centro.x, y: centro.y }];
  for (const s of spawns) if (!ANDA.has(g.em(s.x, s.y))) g.por(s.x, s.y, regiao.vila ? '.' : '=');
  const regras = reino.perigos[regiao.perigo];
  const longeDaVila = (c: Celula) => (!regiao.vila || Math.hypot(c.x - regiao.vila.x, c.y - regiao.vila.y) > regiao.vila.raio + FOLGA_INIMIGOS) && (!abrigo || chebyshev(c, abrigo) > abrigo.raio + FOLGA_INIMIGOS);
  const abandonadas = casasAbandonadas(g, criarRng(regiao.semente + SEMENTE_CASAS), regiao.inimigos.length > 0 ? regras.casas : 0, perfil.chao, (c) => longeDaVila(c) && spawns.every((s) => chebyshev(s, c) >= FOLGA_INIMIGOS), protegidas,
    (x, y) => g.em(x, y) === '#' && (geo.obstaculos[y * n + x] === OBSTACULO.arvore || geo.obstaculos[y * n + x] === OBSTACULO.rochedo) && !protegidas.has(y * n + x));
  telhados.push(...abandonadas.telhados);

  // Marco 43 (D-177): a composição dos lugares (o que é sólido vira obstáculo antes do alcance).
  const doCenario = new Set<number>();
  const pecas = comporCenario({
    n, semente: regiao.semente, bioma: regiao.bioma, em: (x, y) => g.em(x, y), telhados, entradas,
    bloqueada: (c) => emPassagem({ passagens: areas.map((f) => f.area) }, c.x, c.y),
    ocupar: (x, y) => { g.por(x, y, '#'); doCenario.add(y * n + x); },
    vila: regiao.vila ? { x: regiao.vila.x, y: regiao.vila.y, raio: regiao.vila.raio } : null,
    estruturas: pontos.flatMap((p) => (p.tipo === 'estrutura' ? [{ tipo: regiao.estruturas.find((s) => s.id === p.estruturaId)?.tipo ?? '', frente: p.frente, escondida: p.escondida }] : [])),
    reservadas: [...spawns, ...entradas, ...pontos.flatMap((p) => (p.tipo === 'estrutura' ? [p.frente, p.porta] : p.tipo === 'npc' ? [p] : []))],
  });
  // Marco 42 (15/11/2026, D-176): o relevo (RNG próprio), antes do alcance: os monstros e a coleta só onde se anda.
  const naPassagemDaRegiao = (c: Celula) => emPassagem({ passagens: areas.map((f) => f.area) }, c.x, c.y);
  const alturas = gerarRelevo({
    n, base: geo.alturas, em: (x, y) => g.em(x, y),
    planas: [...(regiao.vila ? [{ x: regiao.vila.x, y: regiao.vila.y, raio: regiao.vila.raio + 6 }] : []), ...(abrigo ? [{ x: abrigo.x, y: abrigo.y, raio: abrigo.raio + 4 }] : []), ...spawns.map((s) => ({ x: s.x, y: s.y, raio: 2 }))],
    retangulos: [...telhados, ...regiao.estruturas], passagem: naPassagemDaRegiao, origens: spawns, encostaMax: BALANCE_PADRAO.relevo.encostaMax,
    encostas: regiao.estruturas.filter((e) => !e.escondida && (e.tipo === 'caverna' || e.tipo === 'mina')), alturaDoMorro: BALANCE_PADRAO.relevo.muroAltoMax - 1,
  });
  const alcance = alcancaveis(g, spawns[0] as Celula, alturas);
  const livres: Celula[] = [];
  for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) if (alcance[y * n + x] && !protegidas.has(y * n + x) && g.em(x, y) !== '=') livres.push({ x, y });
  const naVila = (c: Celula) => (regiao.vila !== null && Math.hypot(c.x - regiao.vila.x, c.y - regiao.vila.y) <= regiao.vila.raio + FOLGA_INIMIGOS) || (abrigo !== null && chebyshev(c, abrigo) <= abrigo.raio + FOLGA_INIMIGOS);

  const ocupadas: Celula[] = [];
  const sortearLivre = (ok: (c: Celula) => boolean): Celula | null => {
    for (let t = 0; t < 60 && livres.length > 0; t++) {
      const c = escolher(rng, livres);
      if (ok(c) && !ocupadas.some((o) => chebyshev(o, c) < 3)) {
        ocupadas.push(c);
        return c;
      }
    }
    return null;
  };
  for (const { itemId, quantidade } of regiao.coleta) {
    for (let i = 0; i < quantidade; i++) {
      const c = sortearLivre((x) => !naVila(x) || regiao.vila === null);
      if (c) pontos.push({ tipo: 'coleta', itemId, x: c.x, y: c.y });
    }
  }

  // 02/11/2026: reserva capacidade para exércitos de bosses e invocações dos jogadores.
  const total = Math.min(BALANCE_PADRAO.mundo.populacaoMax, Math.floor((livres.length * regras.densidadePor1000) / 1000));
  const inimigos: InimigoPosicionado[] = [];
  let centroHorda: Celula | null = null;
  let restantes = 0;
  for (let i = 0; i < total && regiao.inimigos.length > 0; i++) {
    const segura = (x: Celula) => !naVila(x) && spawns.every((s) => chebyshev(s, x) >= FOLGA_INIMIGOS);
    let c: Celula | null = null;
    if (centroHorda && restantes > 0) {
      const candidatas = livres.filter(x => chebyshev(x, centroHorda as Celula) <= regras.raioHorda && segura(x) && !ocupadas.some(o => chebyshev(o, x) < 2));
      if (candidatas.length) { c = escolher(rng, candidatas); ocupadas.push(c); restantes--; }
    }
    if (!c) {
      c = sortearLivre(segura);
      centroHorda = c;
      restantes = inteiro(rng, regras.hordaMin, Math.max(regras.hordaMin, regras.hordaMax)) - 1;
    }
    if (!c) continue;
    const preset = escolher(rng, regiao.inimigos);
    const nivel = nivelDoMonstro(rng, regiao);
    // Marco 30 (D-129): a elite do perigo nasce acima do topo da faixa (mais forte e com mais XP e loot).
    const elite = aleatorio(rng) * 100 < regras.elitePct;
    inimigos.push({ preset, x: c.x, y: c.y, nivel: elite ? Math.min(100, regiao.nivel[1] + regras.eliteNiveis) : nivel });
  }
  // Marco 31 (D-130): quem mora na casa abandonada (no topo da faixa: entrar é arriscado).
  for (const c of abandonadas.dentro) if (regiao.inimigos.length > 0) inimigos.push({ preset: escolher(rng, regiao.inimigos), x: c.x, y: c.y, nivel: regiao.nivel[1] });

  // 02/11/2026: encontros de bosses fora das vilas e longe de todos os pontos de chegada.
  // RNG próprio: mudar as probabilidades não altera terreno, hordas ou recursos.
  const encontros = regiao.bosses;
  const chefes: { preset: string; c: Celula; raio: number }[] = [];
  const rngBoss = criarRng(regiao.semente + 104729);
  if (encontros?.presets.length && aleatorio(rngBoss) * 100 < encontros.chancePct) {
    for (let i = 0; i < encontros.quantidade; i++) {
      const preset=escolher(rngBoss,encontros.presets);
      const raio=ehDragao(preset)?Math.ceil(porteDoDragao(regiao.nivel[1],BALANCE_PADRAO).raio):0;
      const cabe=(c:Celula)=>g.interna(c.x-raio,c.y-raio)&&g.interna(c.x+raio,c.y+raio)&&
        ![...telhados,...regiao.estruturas].some(t=>c.x+raio>=t.x&&c.x-raio<t.x+t.largura&&c.y+raio>=t.y&&c.y-raio<t.y+t.altura);
      const c = sortearLivre(x => longeDaVila(x) && cabe(x) && spawns.every(s => chebyshev(s, x) >= FOLGA_INIMIGOS * 2));
      if(c) {
        chefes.push({ preset, c, raio });
        if(ehDragao(preset)) {
          // Só alarga terreno natural: nunca apaga portas, casas, vila ou a moldura da região.
          for(let dy=-raio;dy<=raio;dy++)for(let dx=-raio;dx<=raio;dx++)if(g.interna(c.x+dx,c.y+dy))g.por(c.x+dx,c.y+dy,perfil.chao);
        }
        inimigos.push({preset,x:c.x,y:c.y,nivel:regiao.nivel[1]});
      }
    }
  }

  // 06/11/2026 (D-135): os círculos escondidos do exterior, pela densidade do perigo (fora da vila e longe das chegadas).
  // RNG próprio: o resto da região sai igual.
  const rngArmadilhas = criarRng(regiao.semente + SEMENTE_ARMADILHAS);
  const armadilhas: ObjetoPosicionadoJson[] = [];
  const quantasArmadilhas = Math.floor((livres.length * regras.armadilhasPor1000) / 1000);
  const usadas = new Set<number>();
  for (let t = 0; t < quantasArmadilhas * 4 && armadilhas.length < quantasArmadilhas && livres.length > 0; t++) {
    const c = escolher(rngArmadilhas, livres);
    // 14/11/2026 (D-169): nunca embaixo de um monstro (ele disparava a armadilha parado, sem ninguém por perto).
    if (usadas.has(c.y * n + c.x) || naVila(c) || spawns.some((s) => chebyshev(s, c) < FOLGA_INIMIGOS) || inimigos.some((i) => chebyshev(i, c) < 2)) continue;
    usadas.add(c.y * n + c.x);
    armadilhas.push(armadilhaDeFase(rngArmadilhas, c, { largura: n, altura: n }, inteiro(rngArmadilhas, regiao.nivel[0], regiao.nivel[1]), null));
  }

  const ambientes = terrenosDaRegiao(g, regiao, livres, chefes, naVila, spawns);
  // Marco 38 (D-142): os andarilhos perto das estradas e as rotas dos errantes (RNG próprio: o resto sai igual).
  pontos.push(...andarilhosDaRegiao(g, regiao, (c) => !naVila(c) && !protegidas.has(c.y * n + c.x) && spawns.every((s) => chebyshev(s, c) >= 6), ocupadas));
  const rotas = rotasDosErrantes(g, regiao, centro, entradas);
  // Marco 42 (15/11/2026, D-176): postes de tocha nas estradas e fogueiras nas matas e no abrigo (sem sorteio).
  pontos.push(...luzesDoExterior((x, y) => g.em(x, y), n, regiao, naVila, naPassagemDaRegiao, [...(abrigo ? [abrigo] : []), ...(regiao.vila ? [centro] : [])], ocupadas));

  // Marco 43 (D-177): o '#' natural (da geografia, fora do que foi construído) é desenhado como rocha ou árvore.
  const obstaculos = new Uint8Array(n * n);
  for (let k = 0; k < n * n; k++) {
    const o = geo.obstaculos[k] ?? OBSTACULO.nenhum;
    if (o !== OBSTACULO.nenhum && !protegidas.has(k) && g.em(k % n, Math.floor(k / n)) === '#') obstaculos[k] = o;
    if (doCenario.has(k) && g.em(k % n, Math.floor(k / n)) === '#') obstaculos[k] = OBSTACULO.objeto;
  }
  const fase: FaseJson = {
    id: `mundo_${reino.id}_${regiao.id}`,
    nome: regiao.nome,
    ordem: 0,
    tipo: 'campanha',
    mapa: g.c.map((linha) => linha.join('')),
    spawns,
    inimigos,
    ...(regiao.tema && { tema: regiao.tema }),
    ...(telhados.length > 0 && { telhados }),
    ...(armadilhas.length > 0 && { objetos: armadilhas }),
    ...(ambientes.length > 0 && { ambientes }),
  };
  return { fase, alturas, obstaculos, pecas, pontos, passagens, faixas: areas, enfeites, vila: regiao.vila ? { x: regiao.vila.x, y: regiao.vila.y, raio: regiao.vila.raio } : null, abrigo, rotas };
}

/**
 * 08/11/2026 (D-138): os terrenos fixos da região, sempre perto do que os explica: em volta do covil do chefe do
 * elemento (TERRENO_DO_CHEFE), na frente das estruturas do tipo pedido (a névoa na cripta, a luz no templo) ou livres
 * pelo bioma (a nascente no campo, o lago gelado na neve). Fora da vila os que ferem; RNG próprio (o resto sai igual).
 */
function terrenosDaRegiao(g: Grade, regiao: RegiaoDoMundo, livres: readonly Celula[], chefes: readonly { preset: string; c: Celula; raio: number }[], naVila: (c: Celula) => boolean, spawns: readonly Celula[]): AreaAmbiente[] {
  const rng = criarRng(regiao.semente + SEMENTE_TERRENOS);
  const areas: AreaAmbiente[] = [];
  const pode = (c: Celula, tipo: TipoAmbiente, raio: number) => areas.length < MAX_AREAS && g.interna(c.x - raio, c.y - raio) && g.interna(c.x + raio, c.y + raio)
    && ANDA.has(g.em(c.x, c.y)) && g.em(c.x, c.y) !== '=' && spawns.every((s) => chebyshev(s, c) > raio + 2)
    && (!naVila(c) || tipo === 'agua' || tipo === 'luz_sagrada') && areas.every((a) => chebyshev(a, c) > a.raio + raio);
  const por = (c: Celula, tipo: TipoAmbiente, raio: number): boolean => {
    if (!pode(c, tipo, raio)) return false;
    // A validação pede o centro em piso ('.'): a grama do centro vira piso.
    g.por(c.x, c.y, '.');
    areas.push({ tipo, x: c.x, y: c.y, raio });
    return true;
  };
  /** Perto de um ponto: as células livres entre `de` e `ate` passos dele. */
  const perto = (centro: Celula, de: number, ate: number) => livres.filter((c) => { const d = chebyshev(c, centro); return d >= de && d <= ate; });
  const tentar = (candidatas: readonly Celula[], tipo: TipoAmbiente, raio: number) => {
    for (let t = 0; t < 30 && candidatas.length > 0; t++) if (por(escolher(rng, candidatas), tipo, raio)) return true;
    return false;
  };
  // O covil do chefe do elemento: três poças em volta.
  for (const chefe of chefes) {
    const tipo = TERRENO_DO_CHEFE[chefe.preset];
    if (!tipo) continue;
    const anel = perto(chefe.c, chefe.raio + 2, chefe.raio + 6);
    for (let i = 0; i < 3; i++) tentar(anel, tipo, 2);
  }
  for (const t of regiao.terrenos ?? []) {
    for (let i = 0; i < t.quantidade; i++) {
      if (t.perto === 'livre') tentar(livres, t.tipo, t.raio);
      else if (t.perto === 'boss') {
        const chefe = chefes.find((c) => TERRENO_DO_CHEFE[c.preset] === t.tipo);
        if (chefe) tentar(perto(chefe.c, chefe.raio + 2, chefe.raio + 8), t.tipo, t.raio);
      } else {
        const portas = regiao.estruturas.filter((e) => e.tipo === t.perto).map((e) => portaDa(e).frente);
        const porta = portas[i % Math.max(1, portas.length)];
        if (porta) tentar(perto(porta, 3, 8), t.tipo, t.raio);
      }
    }
  }
  return areas;
}

