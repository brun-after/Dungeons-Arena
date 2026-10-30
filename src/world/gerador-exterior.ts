// O exterior de uma região do Mundo (marco 29, 30/10/2026, D-128): o terreno sai da semente da região, sempre igual
// no servidor e no cliente. Ruído suave em grade grossa decide a água e as rochas (ou árvores) pelo bioma; por cima
// entram os pontos escritos à mão no reino: a vila murada com os NPCs, as fachadas das estruturas com a porta e as
// passagens para as regiões vizinhas. Estradas ligam a vila (ou o centro) às passagens e às portas, então tudo o
// que importa fica alcançável; a coleta e os inimigos só caem em células alcançáveis. Puro.

import { aleatorio, criarRng, inteiro, escolher, type EstadoRng } from '../core/rng';
import { LADOS, portaDa, vizinha, type Bioma, type LadoDaRegiao, type PapelNpc, type Reino, type RegiaoDoMundo } from '../mundo/reino';
import type { Celula } from '../core/comandos';
import type { FaseJson, InimigoPosicionado, SpawnJson } from './fase';

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
      if (d <= raio - 1) g.por(x, y, '.');
      else if (d <= raio + 0.5) g.por(x, y, portao ? '=' : '#');
      else g.por(x, y, ',');
      if (d <= raio + 0.5) protegidas.add(y * g.n + x);
    }
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
  const n = reino.tamanhoRegiao;
  const rng = criarRng(regiao.semente);
  const perfil = PERFIS[regiao.bioma];
  const g = new Grade(n, '#');
  const ruidoAgua = campoDeRuido(rng, n);
  const ruidoRocha = campoDeRuido(rng, n);
  for (let y = 1; y < n - 1; y++) {
    for (let x = 1; x < n - 1; x++) {
      const a = ruidoAgua(x, y);
      const r = ruidoRocha(x, y);
      g.por(x, y, a > perfil.agua ? '~' : r > perfil.rocha ? '#' : perfil.chao);
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
  if (regiao.vila) pontos.push(...erguerVila(g, regiao.vila, protegidas));
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

  const regras = reino.perigos[regiao.perigo];
  const total = Math.floor((livres.length * regras.densidadePor1000) / 1000);
  const inimigos: InimigoPosicionado[] = [];
  for (let i = 0; i < total && regiao.inimigos.length > 0; i++) {
    const c = sortearLivre((x) => !naVila(x) && spawns.every((s) => chebyshev(s, x) >= FOLGA_INIMIGOS));
    if (!c) continue;
    const preset = escolher(rng, regiao.inimigos);
    const nivel = inteiro(rng, regiao.nivel[0], regiao.nivel[1]);
    // Marco 30 (D-129): a elite do perigo nasce acima do topo da faixa (mais forte e com mais XP e loot).
    const elite = aleatorio(rng) * 100 < regras.elitePct;
    inimigos.push({ preset, x: c.x, y: c.y, nivel: elite ? Math.min(100, regiao.nivel[1] + regras.eliteNiveis) : nivel });
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
  };
  return { fase, pontos, passagens, vila: regiao.vila ? { x: regiao.vila.x, y: regiao.vila.y, raio: regiao.vila.raio } : null };
}
