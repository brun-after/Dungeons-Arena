// O exterior de uma região do Mundo (marco 29, 30/10/2026, D-128): o terreno sai da semente da região, sempre igual
// no servidor e no cliente. Ruído suave em grade grossa decide a água e as rochas (ou árvores) pelo bioma; por cima
// entram os pontos escritos à mão no reino: a vila murada com os NPCs, as fachadas das estruturas com a porta e as
// passagens para as regiões vizinhas. Estradas ligam a vila (ou o centro) às passagens e às portas, então tudo o
// que importa fica alcançável; a coleta e os inimigos só caem em células alcançáveis. Puro.
// Marco 31 (31/10/2026, D-130): casas fechadas de pedra com telhado: na vila (o telhado some de perto) e, nas regiões
// normais e perigosas, as abandonadas (o telhado só some ao entrar, e há um monstro lá dentro). As casas usam um
// gerador de números à parte, para não mexer no sorteio do resto.

import { aleatorio, criarRng, inteiro, escolher, type EstadoRng } from '../core/rng';
import { LADOS, portaDa, vizinha, type Bioma, type LadoDaRegiao, type PapelNpc, type Reino, type RegiaoDoMundo } from '../mundo/reino';
import type { Celula } from '../core/comandos';
import type { FaseJson, InimigoPosicionado, SpawnJson, Telhado } from './fase';

/** Largura da abertura na borda que leva à região vizinha. */
export const LARGURA_PASSAGEM = 6;
/** Distância mínima (Chebyshev) entre os inimigos e a vila ou os spawns. */
const FOLGA_INIMIGOS = 12;
/** Passo da grade grossa do ruído. */
const PASSO_RUIDO = 8;

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
};

export type PontoDoExterior =
  | { tipo: 'npc'; papel: PapelNpc; x: number; y: number }
  | { tipo: 'coleta'; itemId: string; x: number; y: number }
  | { tipo: 'estrutura'; estruturaId: string; porta: Celula; frente: Celula; escondida: boolean };

export interface ExteriorGerado {
  fase: FaseJson;
  pontos: PontoDoExterior[];
  /** As células da borda que passam para a vizinha, por lado (vazio onde o reino acaba). */
  passagens: Readonly<Record<LadoDaRegiao, readonly Celula[]>>;
  /** A área segura da vila (sem monstros nem PvP), ou null. */
  vila: { x: number; y: number; raio: number } | null;
}

/** Ruído de valor suave (0–1): valores sorteados na grade grossa, interpolados entre os quatro vizinhos. */
function campoDeRuido(rng: EstadoRng, tamanho: number): (x: number, y: number) => number {
  const n = Math.ceil(tamanho / PASSO_RUIDO) + 2;
  const grade = Array.from({ length: n * n }, () => aleatorio(rng));
  const v = (gx: number, gy: number) => grade[Math.min(n - 1, gy) * n + Math.min(n - 1, gx)] ?? 0;
  const suave = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const gx = Math.floor(x / PASSO_RUIDO);
    const gy = Math.floor(y / PASSO_RUIDO);
    const tx = suave((x % PASSO_RUIDO) / PASSO_RUIDO);
    const ty = suave((y % PASSO_RUIDO) / PASSO_RUIDO);
    const a = v(gx, gy) + (v(gx + 1, gy) - v(gx, gy)) * tx;
    const b = v(gx, gy + 1) + (v(gx + 1, gy + 1) - v(gx, gy + 1)) * tx;
    return a + (b - a) * ty;
  };
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

/**
 * Cabe a casa em (x, y)? A casa só sobre o chão `chao`; a volta de uma célula em `margem` (por onde se passa em
 * volta dela); nada nas células `bloqueadas`.
 */
function cabeCasa(g: Grade, x: number, y: number, l: number, a: number, chao: string, margem: ReadonlySet<string>, bloqueadas: ReadonlySet<number>): boolean {
  for (let cy = y - 1; cy <= y + a; cy++) {
    for (let cx = x - 1; cx <= x + l; cx++) {
      const casa = cx >= x && cy >= y && cx < x + l && cy < y + a;
      const ch = g.em(cx, cy);
      if (!g.interna(cx, cy) || bloqueadas.has(cy * g.n + cx) || (casa ? ch !== chao : !margem.has(ch))) return false;
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
function casasAbandonadas(g: Grade, rng: EstadoRng, quantas: number, chao: string, longe: (c: Celula) => boolean, protegidas: ReadonlySet<number>): { telhados: Telhado[]; dentro: Celula[] } {
  const { largura: l, altura: a } = CASA_ABANDONADA;
  const telhados: Telhado[] = [];
  const dentro: Celula[] = [];
  for (let t = 0; t < 120 && telhados.length < quantas; t++) {
    const x = inteiro(rng, 3, g.n - l - 4);
    const y = inteiro(rng, 3, g.n - a - 4);
    if (!longe({ x, y }) || !cabeCasa(g, x, y, l, a, chao, new Set([chao]), protegidas)) continue;
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

/** O centro da abertura de cada lado e as células da borda que passam para a vizinha. */
function abrirPassagens(g: Grade, reino: Reino, regiao: RegiaoDoMundo): { passagens: Record<LadoDaRegiao, Celula[]>; entradas: Celula[] } {
  const n = g.n;
  const meio = Math.floor(n / 2) - Math.floor(LARGURA_PASSAGEM / 2);
  const passagens: Record<LadoDaRegiao, Celula[]> = { norte: [], sul: [], leste: [], oeste: [] };
  const entradas: Celula[] = [];
  for (const lado of LADOS) {
    if (!vizinha(reino, regiao, lado)) continue;
    for (let i = 0; i < LARGURA_PASSAGEM; i++) {
      const borda = lado === 'norte' ? { x: meio + i, y: 0 } : lado === 'sul' ? { x: meio + i, y: n - 1 } : lado === 'oeste' ? { x: 0, y: meio + i } : { x: n - 1, y: meio + i };
      g.por(borda.x, borda.y, '=');
      passagens[lado].push(borda);
    }
    const c = Math.floor(n / 2);
    entradas.push(lado === 'norte' ? { x: c, y: 2 } : lado === 'sul' ? { x: c, y: n - 3 } : lado === 'oeste' ? { x: 2, y: c } : { x: n - 3, y: c });
  }
  return { passagens, entradas };
}

/** A vila: praça de piso, muro circular com quatro portões e os NPCs em anel em volta do centro. */
function erguerVila(g: Grade, vila: NonNullable<RegiaoDoMundo['vila']>, protegidas: Set<number>): PontoDoExterior[] {
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
  return vila.npcs.map((papel, i) => {
    const ang = (i / vila.npcs.length) * Math.PI * 2 + Math.PI / 4;
    const x = Math.round(cx + Math.cos(ang) * anel);
    const y = Math.round(cy + Math.sin(ang) * anel);
    g.por(x, y, '.');
    return { tipo: 'npc' as const, papel, x, y };
  });
}

/** As células andáveis alcançáveis a partir de `origem` (busca em largura, 4 vizinhos). */
function alcancaveis(g: Grade, origem: Celula): Uint8Array {
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
export function gerarExterior(reino: Reino, regiao: RegiaoDoMundo): ExteriorGerado {
  const n = regiao.tamanho ?? reino.tamanhoRegiao;
  const rng = criarRng(regiao.semente);
  const perfil = PERFIS[regiao.bioma];
  const g = new Grade(n, '#');
  const ruidoAgua = campoDeRuido(rng, n);
  const ruidoRocha = campoDeRuido(rng, n);
  for (let y = 1; y < n - 1; y++) {
    for (let x = 1; x < n - 1; x++) {
      const a = ruidoAgua(x, y);
      const r = ruidoRocha(x, y);
      // Costas orgânicas mantêm a grade técnica, mas quebram o contorno quadrado da terra.
      const dx = (x - n / 2) / (n * 0.63), dy = (y - n / 2) / (n * 0.59);
      const costa = Math.hypot(dx, dy) > 1 + 0.09 * Math.sin(Math.atan2(dy, dx) * 5 + regiao.semente);
      g.por(x, y, costa || a > perfil.agua ? '~' : r > perfil.rocha ? '#' : perfil.chao);
    }
  }
  // Marco 29 (30/10/2026): o rochedo fica só com a borda; o miolo vira chão sem acesso. No isométrico, o miolo de
  // parede é a base escura das masmorras, que fora parece um buraco.
  const miolo: Celula[] = [];
  for (let y = 1; y < n - 1; y++) {
    for (let x = 1; x < n - 1; x++) {
      let cercada = g.em(x, y) === '#';
      for (let dy = -1; dy <= 1 && cercada; dy++) for (let dx = -1; dx <= 1 && cercada; dx++) cercada = g.em(x + dx, y + dy) === '#';
      if (cercada) miolo.push({ x, y });
    }
  }
  for (const c of miolo) g.por(c.x, c.y, perfil.chao);

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
    const npcs = erguerVila(g, regiao.vila, protegidas);
    pontos.push(...npcs);
    telhados.push(...casasDaVila(g, regiao.vila, npcs.flatMap((p) => (p.tipo === 'npc' ? [p] : []))));
  }
  const { passagens, entradas } = abrirPassagens(g, reino, regiao);
  // Das portas da vila (ou do centro) até cada passagem e cada porta de estrutura.
  const saidaDaVila = (alvo: Celula): Celula => {
    if (!regiao.vila) return centro;
    const { x, y, raio } = regiao.vila;
    const dx = alvo.x - x;
    const dy = alvo.y - y;
    return Math.abs(dx) > Math.abs(dy) ? { x: x + Math.sign(dx) * (raio + 1), y } : { x, y: y + Math.sign(dy || 1) * (raio + 1) };
  };
  for (const alvo of entradas) estrada(g, rng, saidaDaVila(alvo), alvo, protegidas);
  for (const p of pontos) if (p.tipo === 'estrutura' && !p.escondida) estrada(g, rng, saidaDaVila(p.frente), p.frente, protegidas);
  for (const lado of LADOS) for (const c of passagens[lado]) g.por(c.x, c.y, '=');
  // A frente da porta fica sempre livre.
  for (const p of pontos) if (p.tipo === 'estrutura') g.por(p.frente.x, p.frente.y, '=');

  const spawns: SpawnJson[] = regiao.vila
    ? [-2, 0, 2].flatMap((dx) => [-2, 2].map((dy) => ({ x: centro.x + dx, y: centro.y + dy })))
    : entradas.length > 0
      ? entradas.map((c) => ({ x: c.x, y: c.y }))
      : [{ x: centro.x, y: centro.y }];
  for (const s of spawns) if (!ANDA.has(g.em(s.x, s.y))) g.por(s.x, s.y, regiao.vila ? '.' : '=');
  const regras = reino.perigos[regiao.perigo];
  const longeDaVila = (c: Celula) => !regiao.vila || Math.hypot(c.x - regiao.vila.x, c.y - regiao.vila.y) > regiao.vila.raio + FOLGA_INIMIGOS;
  const abandonadas = casasAbandonadas(g, criarRng(regiao.semente + SEMENTE_CASAS), regiao.inimigos.length > 0 ? regras.casas : 0, perfil.chao, (c) => longeDaVila(c) && spawns.every((s) => chebyshev(s, c) >= FOLGA_INIMIGOS), protegidas);
  telhados.push(...abandonadas.telhados);

  const alcance = alcancaveis(g, spawns[0] as Celula);
  const livres: Celula[] = [];
  for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) if (alcance[y * n + x] && !protegidas.has(y * n + x) && g.em(x, y) !== '=') livres.push({ x, y });
  const naVila = (c: Celula) => regiao.vila !== null && Math.hypot(c.x - regiao.vila.x, c.y - regiao.vila.y) <= regiao.vila.raio + FOLGA_INIMIGOS;

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

  const total = Math.floor((livres.length * regras.densidadePor1000) / 1000);
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
    const nivel = inteiro(rng, regiao.nivel[0], regiao.nivel[1]);
    // Marco 30 (D-129): a elite do perigo nasce acima do topo da faixa (mais forte e com mais XP e loot).
    const elite = aleatorio(rng) * 100 < regras.elitePct;
    inimigos.push({ preset, x: c.x, y: c.y, nivel: elite ? Math.min(100, regiao.nivel[1] + regras.eliteNiveis) : nivel });
  }
  // Marco 31 (D-130): quem mora na casa abandonada (no topo da faixa: entrar é arriscado).
  for (const c of abandonadas.dentro) if (regiao.inimigos.length > 0) inimigos.push({ preset: escolher(rng, regiao.inimigos), x: c.x, y: c.y, nivel: regiao.nivel[1] });

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
  };
  return { fase, pontos, passagens, vila: regiao.vila ? { x: regiao.vila.x, y: regiao.vila.y, raio: regiao.vila.raio } : null };
}
