// A noite perigosa do Mundo (marco 42, 15/11/2026, D-176). No modelo dos focos (mundo/focos.ts): a sala confere a cada
// segundo e põe ou tira monstros em tempo de execução, sem regenerar a região. Quanto mais escuro (mundo/ciclo.ts), mais
// monstros extras perto de quem anda pela região, de nível acima da faixa, e às vezes um chefe da noite. As matas
// fechadas são escuras sempre: têm os seus monstros também de dia, mesmo dentro das regiões seguras. Ao clarear, os
// extras que ninguém feriu e que não estão perto de ninguém vão embora. O sorteio é pela região e pelo tick (o mesmo
// resultado para o mesmo estado). Puro.

import { conferirVilaANoite } from './vila-noite';
import { aplicarEfeito } from '../combat/efeitos';
import { construirEfeito } from '../combat/registro-efeitos';
import { ticksDe } from '../core/tempo';
import { emCombate } from '../progression/buffs';
import { conferirAcampamentos } from './acampamento';
import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { aleatorio, criarRng, hashTexto, inteiro } from '../core/rng';
import { vivo, type Entidade } from '../entities/entidade';
import { criarInimigo } from '../entities/fabrica';
import { presetNaFenda } from '../world/populacao';
import { passavel } from '../world/fase';
import { emPassagem } from '../world/passagem';
import { emRefugio } from '../world/refugio';
import { ehDragao } from '../world/porte-dragoes';
import { diaDoCiclo, escuroDoLugar, horaDoMundo } from './ciclo';
import { marcarVitrinesDaVila } from './lojas-mundo';
import { naSombra, type RegrasDaCamuflagem } from '../world/camuflagem';
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
  /** Marco 44 (D-178): os monstros que só existem à noite e a chance de cada um da horda ser deles. */
  noturnos: readonly string[];
  noturnosPct: number;
  /** Marco 44 (D-178): de dia, os monstros do covil dormem; o primeiro golpe acorda e fere esta % a mais. */
  sonoDoCovilPct: number;
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
  /** Marco 44 (D-178): a zona de fácil camuflagem (world/camuflagem.ts). */
  camuflagem: RegrasDaCamuflagem;
  /**
   * Marco 44 (D-178): a calma perto da vila e das entradas da região. Até `raioVila` células além do muro da vila e
   * `raioEntrada` da boca de cada passagem, a horda da noite tende aos níveis baixos da faixa (do piso até
   * `nivelBaixoAte` acima dele); os de nível normal da noite ainda vêm, com `fortePct`% de chance bem junto, e a chance
   * cresce com a distância até o normal.
   */
  calma: { raioVila: number; raioEntrada: number; nivelBaixoAte: number; fortePct: number };
}

const chebyshev = (a: Celula, b: Celula) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/** Marco 44 (15/11/2026, D-178): o multiplicador de XP e saque pela noite da região (1 de dia e fora do Mundo). */
export function recompensaDaNoite(ctx: ContextoSimulacao): number {
  return 1 + (ctx.balance.mundo.noite.recompensaPct / 100) * (ctx.modo.noite ?? 0);
}

/** Marco 44 (D-178): na noite fechada, a morte não deixa túmulo. */
export function morteSemTumulo(ctx: ContextoSimulacao): boolean {
  // A hora da noite, não o escuro da mata (de dia, morrer na mata fechada ainda deixa túmulo).
  return (ctx.modo.noite ?? 0) >= ctx.balance.mundo.noite.semTumuloDesde;
}

/**
 * O quanto o ponto esconde quem está nele (0 a 1): o escuro da noite (no modo, o mesmo na região inteira) ou a sombra
 * de uma árvore (world/camuflagem.ts), de dia também. Marco 44 (D-178): pelo lugar de quem é visto, não de quem vê.
 */
export function escondeEm(ctx: ContextoSimulacao, x: number, y: number): number {
  const sombra = ctx.fase.exterior && naSombra(ctx.fase, x, y, ctx.balance.mundo.noite.camuflagem) ? 1 : 0;
  return Math.max(ctx.modo.escuro ?? 0, sombra);
}

/** O fator (0 a 1) que a noite tira da percepção: 1 de dia, `1 - percepcaoMenosPct` na noite fechada. */
export function fatorDaNoite(ctx: ContextoSimulacao, escuro = ctx.modo.escuro ?? 0): number {
  return 1 - (ctx.balance.mundo.noite.percepcaoMenosPct / 100) * escuro;
}

/**
 * Marco 44 (15/11/2026, D-178): no escuro o monstro também enxerga pouco: o raio de atenção contra `alvo` encolhe até
 * `percepcaoMenosPct` na noite fechada ou com o alvo na sombra de uma árvore. Quem está iluminado (a tocha, o fogo
 * perto) não ganha o desconto (quem chama, raioContra, já confere).
 */
export function percepcaoNoEscuro(ctx: ContextoSimulacao, alvo: Entidade, base: number): number {
  return base * fatorDaNoite(ctx, escondeEm(ctx, alvo.x, alvo.y));
}

/** Marco 44 (D-178): o quanto o ponto está na calma da vila ou de uma entrada (1 junto, 0 longe). */
export function calmaEm(ctx: ContextoSimulacao, regiao: RegiaoDoMundo, c: Celula): number {
  const r = ctx.balance.mundo.noite.calma;
  let calma = 0;
  const v = regiao.vila;
  if (v) calma = Math.max(calma, 1 - Math.max(0, Math.hypot(c.x - v.x, c.y - v.y) - v.raio) / Math.max(1, r.raioVila));
  for (const a of ctx.fase.passagens ?? []) {
    const d = Math.hypot(c.x - Math.max(a.x0, Math.min(a.x1, c.x)), c.y - Math.max(a.y0, Math.min(a.y1, c.y)));
    calma = Math.max(calma, 1 - d / Math.max(1, r.raioEntrada));
  }
  return Math.max(0, Math.min(1, calma));
}

/**
 * Marco 44 (D-178): o nível de quem a noite traz em `c`. Na calma, tende ao piso da faixa da região; longe dela, o da
 * noite (acima do topo da faixa), como antes. Os fortes ainda podem vir junto da vila, com chance menor.
 */
export function nivelDaNoite(ctx: ContextoSimulacao, regiao: RegiaoDoMundo, c: Celula, sorte: () => number): number {
  const r = ctx.balance.mundo.noite;
  const forte = regiao.nivel[1] + r.niveisExtra[0] + Math.floor(sorte() * (r.niveisExtra[1] - r.niveisExtra[0] + 1));
  const calma = calmaEm(ctx, regiao, c);
  if (sorte() >= calma * (1 - r.calma.fortePct / 100)) return forte;
  return Math.min(regiao.nivel[1], regiao.nivel[0] + Math.floor(sorte() * (r.calma.nivelBaixoAte + 1)));
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
  if (estado.entidades.length >= ctx.modo.limites.npcs) return false;
  // Marco 45 (D-182): a fenda da noite também respeita o pico de nível.
  const p = presetNaFenda(ctx, preset, Math.min(100, nivel), c.x, c.y);
  if (!p || estado.entidades.some((e) => e.id === id)) return false;
  estado.entidades.push(criarInimigo(p, id, c.x, c.y, ctx.balance, { nivel: Math.min(100, nivel) }));
  return true;
}

/**
 * Marco 54 (26/11/2026, D-207): no Mundo contínuo, a conferência é por zona: só os jogadores, as matas e os monstros
 * dela contam, os ids levam a zona, e o acampamento (que não é de zona) é conferido uma vez só.
 */
export interface ZonaDaConferencia {
  naZona?: (p: { x: number; y: number }) => boolean;
  semAcampamentos?: boolean;
}

/**
 * Uma conferência (a cada segundo): `escuro` é o da região inteira agora (a noite, ou 1 na floresta densa).
 * Devolve quantos monstros nasceram (para o teste e o log).
 */
export function conferirNoite(estado: EstadoJogo, ctx: ContextoSimulacao, regiao: RegiaoDoMundo, escuro: number, zona: ZonaDaConferencia = {}): number {
  const r = ctx.balance.mundo.noite;
  const rng = criarRng(hashTexto(`${regiao.id}/noite/${String(estado.tick)}`));
  const sorte = () => aleatorio(rng);
  const naZona = zona.naZona ?? (() => true);
  const sufixo = zona.naZona ? `@${regiao.id}` : '';
  const jogadores = estado.entidades.filter((e) => vivo(e) && e.arquetipo === 'jogador' && !e.invocacao && !emRefugio(ctx.fase, e.x, e.y) && naZona(e));
  const presets = regiao.inimigos.length > 0 ? regiao.inimigos : r.presetsDaMata;
  const nivel = (c: Celula) => nivelDaNoite(ctx, regiao, c, sorte);
  const vivos = estado.entidades.filter((e) => vivo(e) && e.id.startsWith(PREFIXO_NOITE));
  const limite = ctx.modo.limites.npcs;
  let nasceram = 0;
  const cabe = () => estado.entidades.length < limite;

  // As matas fechadas: sempre os seus, quando alguém está por perto (ninguém por perto, ninguém nasce).
  for (const [i, m] of (ctx.fase.matas ?? []).entries()) {
    if (!naZona(m) || !jogadores.some((j) => Math.hypot(j.x - m.x, j.y - m.y) <= m.raio + 24)) continue;
    for (let k = 0; k < r.porMata && cabe(); k++) {
      const id = `${PREFIXO_NOITE}mata${String(i)}:${String(k)}`;
      if (estado.entidades.some((e) => e.id === id)) continue;
      const c = sortearPerto(ctx, m, 0, m.raio, sorte);
      if (c && !jogadores.some((j) => chebyshev(j, c) < 8) && nascer(estado, ctx, id, presets[Math.floor(sorte() * presets.length)] ?? 'lobo', c, nivel(c))) nasceram++;
    }
  }

  // A horda da noite: só nas regiões com monstros, proporcional ao escuro.
  const base = regiao.inimigos.length > 0 ? estado.entidades.filter((e) => vivo(e) && e.arquetipo !== 'jogador' && !e.invocacao && !e.id.startsWith(PREFIXO_NOITE) && naZona(e)).length : 0;
  const alvo = Math.min(r.maxExtras, Math.floor((base * r.densidadePct * escuro) / 100));
  const extras = vivos.filter((e) => !e.id.includes(':mata') && e.id !== ID_CHEFE && naZona(e));
  if (escuro > 0 && jogadores.length > 0) {
    for (let k = 0; k < r.porConferencia && extras.length + k < alvo && cabe(); k++) {
      const quem = jogadores[Math.floor(sorte() * jogadores.length)];
      const c = quem ? sortearPerto(ctx, quem, r.distancia[0], r.distancia[1], sorte) : null;
      // Marco 44 (15/11/2026, D-178): a caça noturna: parte da horda é dos que só saem à noite.
      const noturno = sorte() * 100 < r.noturnosPct ? r.noturnos[Math.floor(sorte() * r.noturnos.length)] : undefined;
      const preset = noturno ?? regiao.inimigos[Math.floor(sorte() * regiao.inimigos.length)];
      if (c && preset && nascer(estado, ctx, `${PREFIXO_NOITE}${String(estado.tick)}:${String(k)}${sufixo}`, preset, c, nivel(c))) nasceram++;
    }
  }

  // O chefe da noite: só na noite fechada, por chance a cada conferência.
  const chefes = (regiao.bosses?.presets ?? r.chefes).filter((p) => !ehDragao(p));
  const lista = chefes.length > 0 ? chefes : r.chefes;
  if (escuro >= 1 && regiao.inimigos.length > 0 && jogadores.length > 0 && cabe() && sorte() * 100 * 60 < r.chefeChancePorMinPct) {
    const quem = jogadores[Math.floor(sorte() * jogadores.length)];
    const c = quem ? sortearPerto(ctx, quem, r.distancia[0] + 4, r.distancia[1] + 6, sorte) : null;
    const preset = lista[Math.floor(sorte() * lista.length)];
    // Marco 44 (D-178): na calma da vila e das entradas, o chefe da noite quase não vem.
    if (c && preset && sorte() >= calmaEm(ctx, regiao, c) * (1 - r.calma.fortePct / 100) && nascer(estado, ctx, ID_CHEFE, preset, c, regiao.nivel[1] + r.niveisExtra[1])) nasceram++;
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
export function conferirFocosENoite(estado: EstadoJogo, ctx: ContextoSimulacao, regiao: RegiaoDoMundo, agoraMs: number, zona: ZonaDaConferencia = {}): ContextoSimulacao {
  for (const foco of regiao.focos ?? []) {
    const aceso = focoAceso(regiao.id, foco, agoraMs);
    if (aceso) acenderFoco(estado, ctx, regiao, foco, aceso, agoraMs, zona.naZona);
    else apagarFoco(estado, foco);
  }
  const hora = horaDoMundo(agoraMs, ctx.balance.mundo.ciclo);
  // Marco 44 (D-178): o escuro da região é o da hora; a mata fechada esconde pela sombra das árvores (escondeEm).
  const escuro = escuroDoLugar(hora, 0, false);
  const novo = (ctx.modo.escuro ?? 0) === escuro && (ctx.modo.noite ?? 0) === hora.noite ? ctx : { ...ctx, modo: { ...ctx.modo, escuro, noite: hora.noite } };
  conferirVilaANoite(estado, novo, regiao);
  // Marco 47 (20/11/2026, D-190): a vitrine do ferreiro renova a cada dia do Mundo.
  marcarVitrinesDaVila(estado.objetos, novo, diaDoCiclo(agoraMs, ctx.balance.mundo.ciclo), regiao.nivel);
  conferirNoite(estado, novo, regiao, escuro, zona);
  if (zona.semAcampamentos) return novo;
  conferirSonoDoCovil(estado, novo, agoraMs, new Set(ctx.balance.mundo.noite.noturnos));
  // Marco 44 (15/11/2026, D-178): o descanso junto ao fogo e os monstros que o fogo de acampamento chama.
  const r = ctx.balance.mundo.noite;
  const presets = regiao.inimigos.length > 0 ? regiao.inimigos : r.presetsDaMata;
  conferirAcampamentos(estado, novo, escuro, (centro, de, ate, id) => {
    const rng = criarRng(hashTexto(id));
    const c = sortearPerto(novo, centro, de, ate, () => aleatorio(rng));
    const preset = presets[inteiro(rng, 0, presets.length - 1)];
    return !!c && !!preset && nascer(estado, novo, `${PREFIXO_NOITE}${id}`, preset, c, regiao.nivel[1] + inteiro(rng, r.niveisExtra[0], r.niveisExtra[1]));
  });
  return novo;
}

/**
 * Marco 44 (15/11/2026, D-178): o covil de dia. Os monstros que não estão em combate dormem (o efeito `adormecido`: não
 * se mexem nem atacam; o primeiro golpe acorda e fere `sonoDoCovilPct`% a mais), e quem chega com cuidado os pega de
 * surpresa. Acordado, o monstro só volta a dormir depois do combate. À noite, ninguém dorme. A cada segundo, pela sala.
 * No ermo (`so`), dormem de dia só os monstros da noite (`noturnos`).
 */
export function conferirSonoDoCovil(estado: EstadoJogo, ctx: ContextoSimulacao, agoraMs: number, so?: ReadonlySet<string>): void {
  const dia = horaDoMundo(agoraMs, ctx.balance.mundo.ciclo).fase === 'dia';
  for (const e of estado.entidades) {
    if (!vivo(e) || e.controlador !== 'ia' || e.arquetipo === 'jogador' || e.invocacao || (so && !so.has(e.preset))) continue;
    const dorme = e.efeitos.find((f) => f.tipo === 'adormecido');
    if (!dia) {
      if (dorme) e.efeitos = e.efeitos.filter((f) => f !== dorme);
      continue;
    }
    if (dorme) dorme.ateTick = estado.tick + ticksDe(120_000);
    else if (e.ia?.modo !== 'perseguindo' && !emCombate(estado, ctx, e)) {
      aplicarEfeito(estado, ctx, e, construirEfeito('adormecido', { pct: ctx.balance.mundo.noite.sonoDoCovilPct }), { id: e.id, x: e.x, y: e.y }, null, [], false);
    }
  }
}
