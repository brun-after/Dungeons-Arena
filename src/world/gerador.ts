// Geração procedural de fases (§2.1). Marco 10A-2 (14/10/2026), D-053. Pura e semeada: os mesmos
// parâmetros dão sempre a mesma fase, então o save guarda só os parâmetros. A saída passa pela mesma
// `validarFase` do conteúdo oficial.
//   1. grid de parede;
//   2. até `salas` salas (4–10 × 3–8), em até `salas × 20` tentativas, sem sobrepor (margem de 2);
//   3. corredores em L ligando os centros de salas consecutivas;
//   4. um par de portas internas a cada 10 salas, extremos a Chebyshev ≥ 20 (relaxa para 15 e 10);
//   5. início e loja na primeira sala; boss na última (com mais de 2 salas) e a saída trancada por ele;
//      nas demais, `1 + floor(rand × min(3, floor(l × a / 8)))` inimigos do nível pedido.
//   6. marco 14 (14/10/2026), D-059: habilidades geradas por semente — o chefe ganha 2 e cada inimigo comum,
//      com chance que cresce com o nível, 1. Num fluxo de PRNG **separado** (`semente:habilidades`): o mapa, os
//      inimigos e os objetos das fases geradas já salvas não mudam.
//   7. marco 11A (16/10/2026), D-066: com `estilo` (regras do perfil do jogador, guardadas nos parâmetros), uma
//      passada de `aplicarEstilo` no fim, num PRNG próprio; sem `estilo`, a fase é a mesma de antes.

import { idItemBase } from '../progression/gerar-item-base';
import { idGerada } from '../combat/chave-habilidade';
import type { Celula } from '../core/comandos';
import type { Conteudo } from '../core/conteudo';
import { BALANCE_PADRAO, type Balance } from '../core/contexto';
import { aleatorio, criarRng, escolher, hashTexto, inteiro, proximoU32, type EstadoRng } from '../core/rng';
import { enriquecerFase, salasEmEspiral } from './geracao-viva';
import { aplicarEstilo } from './estilo';
import type { FaseJson, InimigoPosicionado, ObjetoPosicionadoJson, PortaInterna } from './fase';

export interface ParametrosGeracao {
  id: string;
  nome: string;
  semente: number;
  salas: number;
  nivelInimigos: number;
  matizGraus: number;
  largura?: number;
  altura?: number;
  /** Marco 11A: regras de estilo (`[PFD]{8}[01]`), opcionais, só neste aparelho (aprendizado por aparelho). */
  estilo?: string[];
  /** Marco 18 (D-070): eventos da fase (lua sangrenta, mercador errante, sala secreta). */
  eventos?: string[];
  /** Reproduz o terreno original do enxame antes de retirar sua população extra na revisita. */
  enxameConcluido?: boolean;
  ambientesVivos?: boolean;
  formato?: 'salas' | 'espiral';
}

/** O que o gerador precisa do catálogo: presets comuns e de chefe, e o estoque da loja. */
export interface CatalogoGeracao {
  comuns: readonly string[];
  boss: string;
  estoque: readonly string[];
  /** Marco 14: chances das habilidades geradas. */
  geracao: Balance['geracao'];
  /** Marco 18 (D-070): os livros de grau S (o mercador errante) e as bases (a peça Lendária e a de conjunto). */
  livrosRaros: readonly string[];
  bases: readonly string[];
  basesDeConjunto: readonly string[];
}

/** Presets comuns (sem chefe, boneco de treino nem invocações, marco 10A-3) e o chefe, tirados do catálogo. */
export function catalogoDeGeracao(conteudo: Conteudo, estoque: readonly string[], geracao: Balance['geracao'] = BALANCE_PADRAO.geracao): CatalogoGeracao {
  const presets = [...conteudo.presets.values()].filter((p) => p.invocacao === null);
  const comuns = presets.filter((p) => p.arquetipo !== 'boss' && p.arquetipo !== 'boneco').map((p) => p.id);
  const boss = presets.find((p) => p.arquetipo === 'boss')?.id ?? comuns[0] ?? '';
  const livrosRaros = [...conteudo.itens.values()]
    .filter((i) => i.tipo === 'livro' && i.dropavel && i.ensina !== null && conteudo.definicoes.get(i.ensina)?.base.grau === 'S')
    .map((i) => i.id);
  const bases = [...conteudo.itensComFormas.bases.keys()];
  const basesDeConjunto = [...new Set([...conteudo.conjuntos.values()].flatMap((c) => c.pecas))];
  return { comuns, boss, estoque: [...estoque], geracao, livrosRaros, bases, basesDeConjunto };
}

/** Chance de um inimigo comum ter uma habilidade gerada no nível (§D-057: cresce com a profundidade). */
export function chanceDeHabilidade(nivel: number, g: Balance['geracao']): number {
  return Math.min(g.chanceMax, g.chanceInimigo + g.chancePorNivel * nivel);
}

/** Habilidades geradas dos inimigos, num PRNG próprio (não mexe na sequência do mapa). */
function distribuirHabilidades(inimigos: InimigoPosicionado[], catalogo: CatalogoGeracao, p: ParametrosGeracao): void {
  const rng = criarRng(hashTexto(`${p.semente}:habilidades`));
  const g = catalogo.geracao;
  for (const ini of inimigos) {
    const quantas = ini.preset === catalogo.boss ? g.habilidadesBoss : aleatorio(rng) < chanceDeHabilidade(p.nivelInimigos, g) ? 1 : 0;
    if (quantas > 0) ini.habilidades = Array.from({ length: quantas }, () => idGerada(proximoU32(rng), p.nivelInimigos));
  }
}

interface Sala {
  x: number;
  y: number;
  l: number;
  a: number;
}

const MARGEM = 2;
const DISTANCIAS_PORTA = [20, 15, 10] as const;

const centro = (s: Sala): Celula => ({ x: s.x + Math.floor(s.l / 2), y: s.y + Math.floor(s.a / 2) });
const chebyshev = (a: Celula, b: Celula) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const normalizado = (c: number, tamanho: number) => (c + 0.5) / tamanho;

/** Dimensões: as informadas ou `area = max(352, salas × 60)`, largura `round(√(area × 1,4))`. */
export function dimensoes(p: ParametrosGeracao): { largura: number; altura: number } {
  if (p.largura && p.altura) return { largura: p.largura, altura: p.altura };
  const area = Math.max(352, p.salas * 60);
  const largura = Math.round(Math.sqrt(area * 1.4));
  return { largura, altura: Math.round(area / largura) };
}

function sobrepoe(a: Sala, b: Sala): boolean {
  return a.x < b.x + b.l + MARGEM && a.x + a.l + MARGEM > b.x && a.y < b.y + b.a + MARGEM && a.y + a.a + MARGEM > b.y;
}

function posicionarSalas(rng: EstadoRng, n: number, largura: number, altura: number): Sala[] {
  const salas: Sala[] = [];
  for (let tentativa = 0; tentativa < n * 20 && salas.length < n; tentativa++) {
    const l = inteiro(rng, 4, 10);
    const a = inteiro(rng, 3, 8);
    if (l + 2 > largura || a + 2 > altura) continue;
    const s: Sala = { x: inteiro(rng, 1, largura - l - 1), y: inteiro(rng, 1, altura - a - 1), l, a };
    if (!salas.some((o) => sobrepoe(s, o))) salas.push(s);
  }
  return salas;
}

export function gerarFase(p: ParametrosGeracao, catalogo: CatalogoGeracao): FaseJson {
  const rng = criarRng(p.semente);
  const { largura, altura } = dimensoes(p);
  const grade: string[][] = Array.from({ length: altura }, () => Array.from({ length: largura }, () => '#'));
  const cavar = (x: number, y: number) => {
    const linha = grade[y];
    if (linha && x > 0 && y > 0 && x < largura - 1 && y < altura - 1) linha[x] = '.';
  };

  const salas = p.formato === 'espiral' ? salasEmEspiral(largura, altura, p.salas, cavar) : posicionarSalas(rng, Math.max(1, p.salas), largura, altura);
  for (const s of salas) for (let y = s.y; y < s.y + s.a; y++) for (let x = s.x; x < s.x + s.l; x++) cavar(x, y);
  // Corredores em L: horizontal e vertical, em ordem sorteada.
  for (let i = 1; p.formato !== 'espiral' && i < salas.length; i++) {
    const de = centro(salas[i - 1] as Sala);
    const para = centro(salas[i] as Sala);
    const horizontalPrimeiro = inteiro(rng, 0, 1) === 0;
    const curva = horizontalPrimeiro ? { x: para.x, y: de.y } : { x: de.x, y: para.y };
    for (const [a, b] of [
      [de, curva],
      [curva, para],
    ] as const) {
      for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) cavar(x, y);
    }
  }

  const ocupadas = new Set<string>();
  const ocupar = (c: Celula) => ocupadas.add(`${c.x},${c.y}`);
  const livre = (c: Celula) => grade[c.y]?.[c.x] === '.' && !ocupadas.has(`${c.x},${c.y}`);
  const celulaNaSala = (s: Sala): Celula | null => {
    for (let t = 0; t < 30; t++) {
      const c = { x: inteiro(rng, s.x, s.x + s.l - 1), y: inteiro(rng, s.y, s.y + s.a - 1) };
      if (livre(c)) return c;
    }
    return null;
  };

  const primeira = salas[0] ?? { x: 1, y: 1, l: 1, a: 1 };
  const spawn = centro(primeira);
  ocupar(spawn);
  const objetos: ObjetoPosicionadoJson[] = [];
  const loja = { x: primeira.x, y: primeira.y };
  if (livre(loja)) {
    ocupar(loja);
    objetos.push({ tipo: 'loja', x: normalizado(loja.x, largura), y: normalizado(loja.y, altura), estoque: [...catalogo.estoque] });
  }

  const inimigos: InimigoPosicionado[] = [];
  const ultima = salas.length > 1 ? salas[salas.length - 1] : undefined;
  const comBoss = salas.length > 2 && ultima !== undefined;
  let portaSaida: FaseJson['portaSaida'];
  if (ultima) {
    const s = { x: ultima.x + ultima.l - 1, y: ultima.y + ultima.a - 1 };
    const linha = grade[s.y];
    if (linha) linha[s.x] = 'S';
    ocupar(s);
    if (comBoss) {
      const b = centro(ultima);
      ocupar(b);
      inimigos.push({ preset: catalogo.boss, x: b.x, y: b.y, nivel: p.nivelInimigos });
      portaSaida = { x: s.x, y: s.y, tranca: 'boss', bossIndice: 0 };
    } else {
      portaSaida = { x: s.x, y: s.y, tranca: 'livre' };
    }
  }
  // Demais salas (nem a do início, nem a do boss).
  for (const s of salas.slice(1, comBoss ? -1 : undefined)) {
    const n = 1 + Math.floor(aleatorio(rng) * Math.min(3, Math.floor((s.l * s.a) / 8)));
    for (let i = 0; i < n; i++) {
      const c = celulaNaSala(s);
      if (!c || catalogo.comuns.length === 0) continue;
      ocupar(c);
      inimigos.push({ preset: escolher(rng, catalogo.comuns), x: c.x, y: c.y, nivel: p.nivelInimigos });
    }
  }

  distribuirHabilidades(inimigos, catalogo, p);

  const portasInternas: PortaInterna[] = [];
  for (let par = 0; par < Math.floor(salas.length / 10); par++) {
    const achado = sortearParDePortas(rng, salas, celulaNaSala);
    if (!achado) continue;
    ocupar(achado.a);
    ocupar(achado.b);
    portasInternas.push({ numero: par + 1, nome: `Passagem ${par + 1}`, a: achado.a, b: achado.b });
  }

  const json: FaseJson = {
    id: p.id,
    nome: p.nome,
    ordem: 1000,
    tipo: 'campanha',
    mapa: grade.map((l) => l.join('')),
    spawns: [spawn],
    inimigos,
    objetos,
    ...(portaSaida && { portaSaida }),
    ...(portasInternas.length > 0 && { portasInternas }),
    matizGraus: p.matizGraus,
  };
  const geracao = p.enxameConcluido ? { ...p, eventos: [...(p.eventos ?? []), 'enxame'] } : p;
  aplicarEventos(json, geracao, catalogo, salas, livre, ocupar);
  const populacaoNormal = inimigos.length;
  if (p.ambientesVivos) enriquecerFase(json, geracao, catalogo, salas, livre, ocupar);
  const final = p.estilo && p.estilo.length > 0 ? aplicarEstilo(json, p.estilo, p.semente) : json;
  if (p.enxameConcluido) {
    final.inimigos = (final.inimigos ?? []).slice(0, populacaoNormal);
    final.eventos = (final.eventos ?? []).filter((e) => e !== 'enxame');
    final.nome = final.nome.replace(' · Enxame', '');
  }
  return final;
}

/**
 * Marco 18 (D-070): os eventos da fase, com um sorteio à parte (a fase sem evento sai igual a antes).
 * - Lua sangrenta: os inimigos sobem 3 níveis (mais perigo, drops melhores) e o nome avisa;
 * - Mercador errante: uma loja a mais, numa sala do meio, com livros de grau S e uma peça Lendária;
 * - Sala secreta: um baú trancado pela chave da cripta, com uma peça de conjunto (forma Épica).
 */
function aplicarEventos(
  json: FaseJson,
  p: ParametrosGeracao,
  catalogo: CatalogoGeracao,
  salas: readonly Sala[],
  livre: (c: Celula) => boolean,
  ocupar: (c: Celula) => void,
): void {
  const eventos = p.eventos ?? [];
  if (eventos.length === 0) return;
  const rng = criarRng((p.semente ^ 0x5eed18) >>> 0);
  const { largura, altura } = dimensoes(p);
  const nome = (id: string) => ({ lua_sangrenta: 'Lua sangrenta', mercador_errante: 'Mercador errante', sala_secreta: 'Sala secreta', enxame: 'Enxame' })[id] ?? id;
  json.eventos = [...eventos];
  json.nome = `${json.nome} · ${eventos.map(nome).join(' · ')}`;
  const celulaLivre = (): Celula | null => {
    for (let t = 0; t < 80; t++) {
      const s = salas[inteiro(rng, Math.min(1, salas.length - 1), salas.length - 1)];
      if (!s) return null;
      const c = { x: inteiro(rng, s.x, s.x + s.l - 1), y: inteiro(rng, s.y, s.y + s.a - 1) };
      if (livre(c)) return c;
    }
    return null;
  };
  const objetos = (json.objetos ??= []);
  if (eventos.includes('lua_sangrenta')) for (const i of json.inimigos ?? []) i.nivel = Math.min(BALANCE_PADRAO.xp.nivelMax, (i.nivel ?? p.nivelInimigos) + 3);
  if (eventos.includes('mercador_errante')) {
    const c = celulaLivre();
    const base = catalogo.bases.length > 0 ? escolher(rng, catalogo.bases) : null;
    if (c) {
      ocupar(c);
      const livros = catalogo.livrosRaros.length > 0 ? [...new Set([escolher(rng, catalogo.livrosRaros), escolher(rng, catalogo.livrosRaros)])] : [];
      const peca = base ? [idItemBase(base, 'lendaria', null, Math.min(BALANCE_PADRAO.xp.nivelMax, p.nivelInimigos), inteiro(rng, 0, 0x7fffffff))] : [];
      objetos.push({ tipo: 'loja', x: normalizado(c.x, largura), y: normalizado(c.y, altura), estoque: [...livros, ...peca, 'pocao_vida'] });
    }
  }
  if (eventos.includes('sala_secreta')) {
    const c = celulaLivre();
    const base = catalogo.basesDeConjunto.length > 0 ? escolher(rng, catalogo.basesDeConjunto) : null;
    if (c && base) {
      ocupar(c);
      const peca = idItemBase(base, 'epica', null, Math.min(BALANCE_PADRAO.xp.nivelMax, p.nivelInimigos), inteiro(rng, 0, 0x7fffffff));
      objetos.push({ tipo: 'bau', x: normalizado(c.x, largura), y: normalizado(c.y, altura), loot: [peca], ouro: 60, chave: 'chave_cripta' });
    }
  }
}

function sortearParDePortas(rng: EstadoRng, salas: readonly Sala[], celulaNaSala: (s: Sala) => Celula | null): { a: Celula; b: Celula } | null {
  for (const minima of DISTANCIAS_PORTA) {
    for (let t = 0; t < 60; t++) {
      const a = celulaNaSala(escolher(rng, salas));
      const b = celulaNaSala(escolher(rng, salas));
      if (a && b && chebyshev(a, b) >= minima) return { a, b };
    }
  }
  return null;
}
