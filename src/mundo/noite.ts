// A noite perigosa do Mundo (marco 42, 15/11/2026, D-176). No modelo dos focos (mundo/focos.ts): a sala confere a cada
// segundo e põe ou tira monstros em tempo de execução, sem regenerar a região. Quanto mais escuro (mundo/ciclo.ts), mais
// monstros extras perto de quem anda pela região, de nível acima da faixa, e às vezes um chefe da noite. As matas
// fechadas são escuras sempre: têm os seus monstros também de dia, mesmo dentro das regiões seguras. Ao clarear, os
// extras que ninguém feriu e que não estão perto de ninguém vão embora. O sorteio é pela região e pelo tick (o mesmo
// resultado para o mesmo estado). Puro.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { aleatorio, criarRng, hashTexto, inteiro } from '../core/rng';
import { vivo, type Entidade } from '../entities/entidade';
import { criarInimigo } from '../entities/fabrica';
import { passavel } from '../world/fase';
import { emPassagem } from '../world/passagem';
import { emRefugio } from '../world/refugio';
import { ehDragao } from '../world/porte-dragoes';
import { escuroBaseEm, escuroDoLugar, horaDoMundo } from './ciclo';
import { acenderFoco, apagarFoco, focoAceso } from './focos';
import type { RegiaoDoMundo } from './reino';

/** Os monstros da noite (nunca renascem: a noite traz outros). */
export const PREFIXO_NOITE = 'noite:';
const ID_CHEFE = `${PREFIXO_NOITE}chefe`;

export interface RegrasDaNoite {
  /** Os extras na noite fechada, em % dos monstros da região (a meia-luz, proporcional). */
  densidadePct: number;
  /** O teto de extras por região. */
  maxExtras: number;
  /** Quantos nascem por conferência (a horda chega aos poucos). */
  porConferencia: number;
  /** A distância (células) de quem anda em que os extras nascem: fora da vista, mas perto. */
  distancia: readonly [number, number];
  /** Os níveis acima do topo da faixa da região. */
  niveisExtra: readonly [number, number];
  /** Marco 44 (D-178): no escuro total, os monstros percebem a ameaça a esta % a menos de distância que de dia. */
  percepcaoMenosPct: number;
  /** Marco 44 (D-178): na noite fechada, o XP e o saque crescem esta % (a meia-luz, proporcional). */
  recompensaPct: number;
  /** Marco 44 (D-178): a partir deste escuro da noite, quem morre não deixa túmulo (o que levava se perde). */
  semTumuloDesde: number;
  /** Os monstros de cada mata fechada (sempre) e os presets quando a região não tem monstros (as seguras). */
  porMata: number;
  presetsDaMata: readonly string[];
  /** A chance por minuto de noite fechada de um chefe da noite, e quem pode ser (fora os dragões). */
  chefeChancePorMinPct: number;
  chefes: readonly string[];
  /** Ao clarear, o extra só vai embora se ninguém estiver a menos destas células. */
  someLongeDe: number;
}

const chebyshev = (a: Celula, b: Celula) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/** Marco 44 (15/11/2026, D-178): o multiplicador de XP e saque pela noite da região (1 de dia e fora do Mundo). */
export function recompensaDaNoite(ctx: ContextoSimulacao): number {
  return 1 + (ctx.balance.mundo.noite.recompensaPct / 100) * (ctx.modo.escuro ?? 0);
}

/** Marco 44 (D-178): na noite fechada, a morte não deixa túmulo. */
export function morteSemTumulo(ctx: ContextoSimulacao): boolean {
  return (ctx.modo.escuro ?? 0) >= ctx.balance.mundo.noite.semTumuloDesde;
}

/** O escuro da noite na região inteira (0 a 1) vai no modo; a mata soma pela posição. */
export function escuroEm(ctx: ContextoSimulacao, x: number, y: number): number {
  return Math.max(ctx.modo.escuro ?? 0, escuroBaseEm(ctx.fase, x, y));
}

/**
 * Marco 44 (15/11/2026, D-178): no escuro o monstro também enxerga pouco: o raio de atenção encolhe até
 * `percepcaoMenosPct` na noite fechada (antes crescia). Quem está iluminado (a tocha, o fogo perto) não ganha o desconto.
 */
export function percepcaoNoEscuro(ctx: ContextoSimulacao, e: Entidade, base: number): number {
  return base * (1 - (ctx.balance.mundo.noite.percepcaoMenosPct / 100) * escuroEm(ctx, e.x, e.y));
}

function lugarLivre(ctx: ContextoSimulacao, c: Celula): boolean {
  return passavel(ctx.fase, c.x, c.y) && !emRefugio(ctx.fase, c.x, c.y) && !emPassagem(ctx.fase, c.x, c.y);
}

/** Uma célula livre entre `de` e `ate` do centro (num círculo de `raio` se dado). */
function sortearPerto(ctx: ContextoSimulacao, centro: Celula, de: number, ate: number, sorte: () => number): Celula | null {
  for (let t = 0; t < 40; t++) {
    const d = de + sorte() * (ate - de);
    const a = sorte() * Math.PI * 2;
    const c = { x: Math.round(centro.x + Math.cos(a) * d), y: Math.round(centro.y + Math.sin(a) * d) };
    if (lugarLivre(ctx, c)) return c;
  }
  return null;
}

function nascer(estado: EstadoJogo, ctx: ContextoSimulacao, id: string, preset: string, c: Celula, nivel: number): boolean {
  const p = ctx.conteudo.presets.get(preset);
  if (!p || estado.entidades.some((e) => e.id === id)) return false;
  estado.entidades.push(criarInimigo(p, id, c.x, c.y, ctx.balance, { nivel: Math.min(100, nivel) }));
  return true;
}

/**
 * Uma conferência (a cada segundo): `escuro` é o da região inteira agora (a noite, ou 1 na floresta densa).
 * Devolve quantos monstros nasceram (para o teste e o log).
 */
export function conferirNoite(estado: EstadoJogo, ctx: ContextoSimulacao, regiao: RegiaoDoMundo, escuro: number): number {
  const r = ctx.balance.mundo.noite;
  const rng = criarRng(hashTexto(`${regiao.id}/noite/${String(estado.tick)}`));
  const sorte = () => aleatorio(rng);
  const jogadores = estado.entidades.filter((e) => vivo(e) && e.arquetipo === 'jogador' && !e.invocacao && !emRefugio(ctx.fase, e.x, e.y));
  const presets = regiao.inimigos.length > 0 ? regiao.inimigos : r.presetsDaMata;
  const nivel = () => regiao.nivel[1] + inteiro(rng, r.niveisExtra[0], r.niveisExtra[1]);
  const vivos = estado.entidades.filter((e) => vivo(e) && e.id.startsWith(PREFIXO_NOITE));
  const limite = ctx.modo.limites.npcs;
  let nasceram = 0;
  const cabe = () => estado.entidades.length < limite;

  // As matas fechadas: sempre os seus, quando alguém está por perto (ninguém por perto, ninguém nasce).
  for (const [i, m] of (ctx.fase.matas ?? []).entries()) {
    if (!jogadores.some((j) => Math.hypot(j.x - m.x, j.y - m.y) <= m.raio + 24)) continue;
    for (let k = 0; k < r.porMata && cabe(); k++) {
      const id = `${PREFIXO_NOITE}mata${String(i)}:${String(k)}`;
      if (estado.entidades.some((e) => e.id === id)) continue;
      const c = sortearPerto(ctx, m, 0, m.raio, sorte);
      if (c && !jogadores.some((j) => chebyshev(j, c) < 8) && nascer(estado, ctx, id, presets[Math.floor(sorte() * presets.length)] ?? 'lobo', c, nivel())) nasceram++;
    }
  }

  // A horda da noite: só nas regiões com monstros, proporcional ao escuro.
  const base = regiao.inimigos.length > 0 ? estado.entidades.filter((e) => vivo(e) && e.arquetipo !== 'jogador' && !e.invocacao && !e.id.startsWith(PREFIXO_NOITE)).length : 0;
  const alvo = Math.min(r.maxExtras, Math.floor((base * r.densidadePct * escuro) / 100));
  const extras = vivos.filter((e) => !e.id.includes(':mata') && e.id !== ID_CHEFE);
  if (escuro > 0 && jogadores.length > 0) {
    for (let k = 0; k < r.porConferencia && extras.length + k < alvo && cabe(); k++) {
      const quem = jogadores[Math.floor(sorte() * jogadores.length)];
      const c = quem ? sortearPerto(ctx, quem, r.distancia[0], r.distancia[1], sorte) : null;
      const preset = regiao.inimigos[Math.floor(sorte() * regiao.inimigos.length)];
      if (c && preset && nascer(estado, ctx, `${PREFIXO_NOITE}${String(estado.tick)}:${String(k)}`, preset, c, nivel())) nasceram++;
    }
  }

  // O chefe da noite: só na noite fechada, por chance a cada conferência.
  const chefes = (regiao.bosses?.presets ?? r.chefes).filter((p) => !ehDragao(p));
  const lista = chefes.length > 0 ? chefes : r.chefes;
  if (escuro >= 1 && regiao.inimigos.length > 0 && jogadores.length > 0 && cabe() && sorte() * 100 * 60 < r.chefeChancePorMinPct) {
    const quem = jogadores[Math.floor(sorte() * jogadores.length)];
    const c = quem ? sortearPerto(ctx, quem, r.distancia[0] + 4, r.distancia[1] + 6, sorte) : null;
    const preset = lista[Math.floor(sorte() * lista.length)];
    if (c && preset && nascer(estado, ctx, ID_CHEFE, preset, c, regiao.nivel[1] + r.niveisExtra[1])) nasceram++;
  }

  // Ao clarear: vão embora os extras da horda e o chefe que ninguém feriu e que estão longe de todos.
  if (escuro <= 0) {
    const longe = (e: Entidade) => !estado.entidades.some((j) => vivo(j) && j.arquetipo === 'jogador' && chebyshev(j, e) < r.someLongeDe);
    estado.entidades = estado.entidades.filter((e) => !e.id.startsWith(PREFIXO_NOITE) || e.id.includes(':mata') || !vivo(e) || e.hp < e.hpMax || !longe(e));
  }
  return nasceram;
}

/**
 * A conferência da sala a cada segundo: os focos (mundo/focos.ts) e a noite. Devolve o contexto com o escuro da região
 * no modo (o mesmo objeto se nada mudou).
 */
export function conferirFocosENoite(estado: EstadoJogo, ctx: ContextoSimulacao, regiao: RegiaoDoMundo, agoraMs: number): ContextoSimulacao {
  for (const foco of regiao.focos ?? []) {
    const aceso = focoAceso(regiao.id, foco, agoraMs);
    if (aceso) acenderFoco(estado, ctx, regiao, foco, aceso, agoraMs);
    else apagarFoco(estado, foco);
  }
  const escuro = escuroDoLugar(horaDoMundo(agoraMs, ctx.balance.mundo.ciclo), regiao.escuroBase ?? 0, false);
  const novo = (ctx.modo.escuro ?? 0) === escuro ? ctx : { ...ctx, modo: { ...ctx.modo, escuro } };
  conferirNoite(estado, novo, regiao, escuro);
  return novo;
}
