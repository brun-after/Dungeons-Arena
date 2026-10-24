// Simulador de balanceamento (marco 15, 15/10/2026, D-061): os cenários medidos e os critérios de `balance.metas`.
// Puro: o CLI (balancear.ts) e o teste "ritmo" (tests/sim/ritmo.test.ts) usam as mesmas funções.

import { construirFichaDeSessao } from '../../src/arena/ficha-sessao';
import { entrarNaArena } from '../../src/arena/entrada';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { chaveServo } from '../../src/combat/necromancia';
import { passavel } from '../../src/world/fase';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { DT_MS } from '../../src/core/loop';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { vivo, type Entidade } from '../../src/entities/entidade';
import type { Dificuldade } from '../../src/modos/dificuldade';
import { guardarItem } from '../../src/progression/inventario';
import { recalcularFicha } from '../../src/progression/derivados';
import { idItemGerado } from '../../src/progression/gerar-item';
import type { Raridade } from '../../src/modos/modo';
import perfis from '../rede/perfis.json';
import { ATRIBUTOS_TIPICOS, BotDeDuelo, CONTEUDO, contextoDoCenario, inimigo, jogadorTipico, mundo, TICKS_POR_S } from './cenarios';

// Marco 22 (23/10/2026, D-090): o Necromante entra nas metas (antes só no diagnóstico).
export const CLASSES = ['aventureiro', 'guerreiro', 'mago', 'arqueiro', 'necromante'] as const;
const LIMITE_S = 120;
/** O estado público vai a 20 Hz: o evento do golpe chega, em média, meio período depois (e até um inteiro). */
const PERIODO_ESTADO_MS = 50;

export function percentil(v: readonly number[], p: number): number {
  if (v.length === 0) return 0;
  const o = [...v].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor(o.length * p))] ?? 0;
}
export const mediana = (v: readonly number[]) => percentil(v, 0.5);

const segundos = (ticks: number) => ticks / TICKS_POR_S;

function primeiro(eventos: readonly EventoSimulacao[], f: (e: EventoSimulacao) => boolean): EventoSimulacao | undefined {
  return eventos.find(f);
}

/**
 * Marco 22 (D-090): a luta começa na primeira ação do time do jogador, ele ou uma invocação dele (o servo do
 * Necromante costuma abrir a luta antes do dono).
 */
function primeiraAcaoDoTime(todos: readonly EventoSimulacao[], trecho: readonly EventoSimulacao[], dono: string): EventoSimulacao | undefined {
  const time = new Set([dono, ...todos.flatMap((e) => (e.t === 'invocou' && e.donoId === dono ? [e.id] : []))]);
  return primeiro(trecho, (e) => e.t === 'acaoIniciada' && time.has(e.atorId));
}

export interface ResultadoDuelo {
  golpes: number;
  tempoS: number;
  venceu: boolean;
}

/** Jogador típico contra um inimigo do mesmo nível: golpes do jogador e tempo da primeira ação até a morte dele. */
export function duelo(classe: string, nivel: number, preset: string, semente: number, dificuldade: Dificuldade = 'normal', ctx = contextoDoCenario()): ResultadoDuelo {
  const m = mundo(ctx, semente, [jogadorTipico(ctx, classe, nivel), inimigo(ctx, preset, nivel)], dificuldade);
  m.bots.push(new BotDeDuelo('j1'));
  const acabou = () => m.eventos.some((e) => e.t === 'morreu' && (e.id === 'i1' || e.id === 'j1'));
  m.rodar(LIMITE_S * TICKS_POR_S, acabou);
  const inicio = primeiraAcaoDoTime(m.eventos, m.eventos, 'j1')?.tick ?? 0;
  const morte = primeiro(m.eventos, (e) => e.t === 'morreu' && e.id === 'i1');
  const golpes = m.eventos.filter((e) => e.t === 'impacto' && e.fonteId === 'j1' && e.alvoId === 'i1').length;
  return { golpes, tempoS: segundos((morte?.tick ?? m.estado.tick) - inicio), venceu: morte !== undefined };
}

/** Segundos andando até o próximo inimigo (e descansando) numa sequência de lutas. */
const ENTRE_LUTAS_S = 2;

/**
 * O ritmo de verdade: o jogador típico enfrenta os comuns em sequência, sem zerar recargas nem mana (a abertura com
 * tudo pronto não decide a média). Entre uma luta e outra, um descanso curto: vida cheia e +30% de mana.
 * Devolve uma medida por luta (golpes do jogador e tempo da primeira ação até a morte do inimigo).
 */
export function sequencia(classe: string, nivel: number, presets: readonly string[], semente: number, dificuldade: Dificuldade = 'normal', ajustar?: (e: Entidade, ctx: ContextoSimulacao) => void): ResultadoDuelo[] {
  const ctx = contextoDoCenario();
  const j = jogadorTipico(ctx, classe, nivel);
  ajustar?.(j, ctx);
  j.hp = j.hpMax; j.mana = j.manaMax;
  const m = mundo(ctx, semente, [j], dificuldade);
  m.bots.push(new BotDeDuelo('j1'));
  const resultados: ResultadoDuelo[] = [];
  presets.forEach((preset, i) => {
    const id = `i${i + 1}`;
    // Ajuste de 24/10/2026 (D-091): o próximo nasce a 2 células numa célula passável (encostado na borda, nascia na parede).
    const lado = [2, -2].find((dx) => passavel(ctx.fase, j.x + dx, j.y)) ?? 0;
    const e = inimigo(ctx, preset, nivel, id, j.x + lado, j.y + (lado === 0 ? 2 : 0));
    if (!m.estado.entidades.includes(j) || !vivo(j)) return;
    m.estado.entidades.push(e);
    const desde = m.eventos.length;
    m.rodar(LIMITE_S * TICKS_POR_S, () => m.eventos.slice(desde).some((ev) => ev.t === 'morreu' && (ev.id === id || ev.id === 'j1')));
    const novos = m.eventos.slice(desde);
    const inicio = primeiraAcaoDoTime(m.eventos, novos, 'j1')?.tick ?? m.estado.tick;
    const morte = primeiro(novos, (ev) => ev.t === 'morreu' && ev.id === id);
    resultados.push({
      // Marco 24 (24/10/2026): golpe é o que fere ou erra; o impacto só de efeito (o Grito do falcão expõe) não conta.
      golpes: novos.filter((ev) => ev.t === 'impacto' && ev.fonteId === 'j1' && ev.alvoId === id && (ev.dano > 0 || ev.falha)).length,
      tempoS: segundos((morte?.tick ?? m.estado.tick) - inicio),
      venceu: morte !== undefined,
    });
    // Descanso curto e a caminhada até o próximo.
    j.hp = j.hpMax;
    j.mana = Math.min(j.manaMax, j.mana + Math.round(j.manaMax * 0.3));
    m.estado.entidades = m.estado.entidades.filter((x) => x.id !== id);
    m.rodar(ENTRE_LUTAS_S * TICKS_POR_S);
  });
  return resultados;
}

export interface ResultadoAguenta {
  golpes: number;
  tempoS: number;
}

/** Quanto o jogador típico aguenta de um inimigo do mesmo nível, parado e sem revidar. */
export function aguenta(classe: string, nivel: number, preset: string, semente: number, dificuldade: Dificuldade = 'normal'): ResultadoAguenta {
  const ctx = contextoDoCenario();
  const m = mundo(ctx, semente, [jogadorTipico(ctx, classe, nivel), inimigo(ctx, preset, nivel, 'i1', 5, 9)], dificuldade);
  // Marco 22 (D-090): mede o corpo do personagem; o servo do Necromante (que tankaria e mataria o inimigo) fica de fora.
  m.estado.recargas[chaveServo('j1')] = Number.MAX_SAFE_INTEGER;
  m.bots.push(new BotDeDuelo('j1', false, true));
  const morreu = () => m.eventos.some((e) => e.t === 'morreu' && e.id === 'j1');
  m.rodar(LIMITE_S * TICKS_POR_S, morreu);
  const golpesNoJogador = m.eventos.filter((e) => e.t === 'impacto' && e.fonteId === 'i1' && e.alvoId === 'j1');
  const inicio = golpesNoJogador[0]?.tick ?? 0;
  const morte = primeiro(m.eventos, (e) => e.t === 'morreu' && e.id === 'j1')?.tick ?? m.estado.tick;
  return { golpes: golpesNoJogador.length, tempoS: segundos(morte - inicio) };
}

/** Os personagens de um grupo de N (classes misturadas, começando pela pedida). */
function grupo(ctx: ContextoSimulacao, classe: string, nivel: number, n: number): Entidade[] {
  const ordem = [classe, ...CLASSES.filter((c) => c !== classe)];
  return Array.from({ length: n }, (_, i) => jogadorTipico(ctx, ordem[i % ordem.length] ?? classe, nivel, `j${i + 1}`, 3 + (i % 3), 7 + Math.floor(i / 3) * 4));
}

export interface ResultadoChefe {
  tempoS: number;
  venceu: boolean;
  mortesDoGrupo: number;
}

/** O chefe contra um grupo de N (1 = solo), com a escala do grupo. */
export function chefe(classe: string, nivel: number, semente: number, n = 1, dificuldade: Dificuldade = 'normal', nivelChefe = nivel): ResultadoChefe {
  const ctx = contextoDoCenario();
  const jogadores = grupo(ctx, classe, nivel, n);
  const m = mundo(ctx, semente, [...jogadores, inimigo(ctx, 'boss', nivelChefe, 'i1', 9, 9)], dificuldade);
  for (const j of jogadores) m.bots.push(new BotDeDuelo(j.id));
  const ids = new Set(jogadores.map((j) => j.id));
  const acabou = () => m.eventos.some((e) => e.t === 'morreu' && e.id === 'i1') || jogadores.every((j) => m.eventos.some((e) => e.t === 'morreu' && e.id === j.id));
  m.rodar(LIMITE_S * 2 * TICKS_POR_S, acabou);
  const inicio = primeiro(m.eventos, (e) => e.t === 'acaoIniciada' && ids.has(e.atorId))?.tick ?? 0;
  const morte = primeiro(m.eventos, (e) => e.t === 'morreu' && e.id === 'i1');
  return {
    tempoS: segundos((morte?.tick ?? m.estado.tick) - inicio),
    venceu: morte !== undefined,
    mortesDoGrupo: m.eventos.filter((e) => e.t === 'morreu' && ids.has(e.id)).length,
  };
}

/** PvP no Livre: duas fichas da classe, sob o clamp do modo, uma contra a outra. */
export function pvpLivre(classe: string, semente: number, nivel: number): { tempoS: number } {
  const ctx = contextoDoCenario('livre');
  const c = CONTEUDO.classes.get(classe);
  if (!c) throw new Error(classe);
  const principais = ATRIBUTOS_TIPICOS[classe] ?? ['forca'];
  const atributos = { ...c.atributos, constituicao: c.atributos.constituicao + 6 };
  for (const a of principais) atributos[a] += 8 / principais.length;
  const ficha = construirFichaDeSessao({ classeId: classe, nivel, atributos }, ctx.modo, ctx.conteudo, ctx.balance).ficha;
  const m = mundo(ctx, semente, []);
  const a = entrarNaArena(m.estado, ctx, 'jogador-1', 'j1', ficha, 'A');
  const b = entrarNaArena(m.estado, ctx, 'jogador-2', 'j2', ficha, 'B');
  Object.assign(a, { x: 6, y: 9, destinoX: 6, destinoY: 9 });
  Object.assign(b, { x: 10, y: 9, destinoX: 10, destinoY: 9 });
  m.bots.push(new BotDeDuelo('j1'), new BotDeDuelo('j2'));
  // Marco 22 (D-090): só a queda de um dos dois personagens encerra (a de uma invocação, não).
  const caiu = (e: EventoSimulacao) => e.t === 'morreu' && (e.id === 'j1' || e.id === 'j2');
  m.rodar(LIMITE_S * TICKS_POR_S, () => m.eventos.some(caiu));
  const inicio = primeiro(m.eventos, (e) => e.t === 'acaoIniciada')?.tick ?? 0;
  const morte = primeiro(m.eventos, caiu)?.tick ?? m.estado.tick;
  return { tempoS: segundos(morte - inicio) };
}

/** Fatia do dano feita pela invocação (pergaminho do lobo), num duelo do aventureiro contra um orc. */
export function fatiaDaInvocacao(nivel: number, semente: number): number {
  const ctx = contextoDoCenario();
  const j = jogadorTipico(ctx, 'aventureiro', nivel);
  const pergaminho = CONTEUDO.itens.get('pergaminho_lobo');
  if (pergaminho && j.bolsa) guardarItem(j.bolsa, pergaminho, 1, ctx.balance.inventario);
  const m = mundo(ctx, semente, [j, inimigo(ctx, 'orc', nivel, 'i1', 7, 9)]);
  m.bots.push(new BotDeDuelo('j1'));
  const invId = j.bolsa?.mochila.find((i) => i.itemId === 'pergaminho_lobo')?.invId;
  if (invId) m.comandar('j1', { t: 'usarItem', invId });
  const acabou = () => m.eventos.some((e) => e.t === 'morreu' && (e.id === 'i1' || e.id === 'j1'));
  m.rodar(LIMITE_S * TICKS_POR_S, acabou);
  const invocados = new Set(m.eventos.filter((e) => e.t === 'invocou' && e.donoId === 'j1').map((e) => (e.t === 'invocou' ? e.id : '')));
  let total = 0;
  let daInvocacao = 0;
  for (const e of m.eventos) {
    if (e.t !== 'impacto' || e.alvoId !== 'i1') continue;
    total += e.dano;
    if (invocados.has(e.fonteId)) daInvocacao += e.dano;
  }
  return total > 0 ? (100 * daInvocacao) / total : 0;
}

export interface AvisoDeHabilidade {
  habilidade: string;
  presets: string[];
  conjuracaoMs: number;
  suportadoMs: number;
  degradadoMs: number;
}

/** Presets que são do jogador (invocações) ou alvo de treino: fora do aviso de inimigo. */
const FORA_DO_AVISO = new Set(['boneco', 'espantalho', 'lobo_espiritual', 'fada']);

/**
 * Aviso útil de cada habilidade inimiga, por perfil de rede: do início da conjuração ao impacto (com a viagem mais
 * curta, a 1 célula), menos o RTT com dois jitters (p95 aproximado), o período do estado público e um tick.
 */
export function avisos(ctx: ContextoSimulacao = contextoDoCenario()): AvisoDeHabilidade[] {
  const porHabilidade = new Map<string, { presets: string[]; conjuracaoMs: number; viagemMs: number }>();
  for (const p of CONTEUDO.presets.values()) {
    if (FORA_DO_AVISO.has(p.id)) continue;
    for (const id of [p.ataqueBasico, ...p.habilidades]) {
      const h = resolverHabilidade(ctx, id);
      if (!h || h.formulaDano === null) continue;
      const viagemMs = h.politicaImpacto === 'projetil' && h.velocidadeProjetil > 0 ? 1000 / h.velocidadeProjetil : 0;
      const atual = porHabilidade.get(h.id) ?? { presets: [], conjuracaoMs: h.conjuracaoMs, viagemMs };
      atual.presets.push(p.id);
      porHabilidade.set(h.id, atual);
    }
  }
  const util = (base: number, perfil: { rttMs: number; jitterMs: number }) => Math.round(base - (perfil.rttMs + 2 * perfil.jitterMs) - PERIODO_ESTADO_MS - DT_MS);
  return [...porHabilidade.entries()]
    .map(([habilidade, v]) => ({
      habilidade,
      presets: v.presets,
      conjuracaoMs: v.conjuracaoMs,
      suportadoMs: util(v.conjuracaoMs + v.viagemMs, perfis.suportado),
      degradadoMs: util(v.conjuracaoMs + v.viagemMs, perfis.degradado),
    }))
    .sort((a, b) => a.suportadoMs - b.suportadoMs);
}

/** XP por minuto do jogador típico contra uma fila de inimigos comuns do mesmo nível (um de cada vez). */
export function economiaPorMinuto(classe: string, nivel: number, semente: number, comuns: readonly string[], dificuldade: Dificuldade = 'normal', ajustar?: (e: Entidade, ctx: ContextoSimulacao) => void): { xp: number; ouro: number } {
  let xp = 0;
  let ouro = 0;
  let tempo = 0;
  comuns.forEach((preset, i) => {
    const cenario = contextoDoCenario();
    const ctx = { ...cenario, modo: { ...cenario.modo, objetosDeFase: true } };
    const j = jogadorTipico(ctx, classe, nivel);
    ajustar?.(j, ctx);
    j.hp = j.hpMax; j.mana = j.manaMax;
    const m = mundo(ctx, semente + i, [j, inimigo(ctx, preset, nivel)], dificuldade);
    m.bots.push(new BotDeDuelo('j1'));
    m.rodar(LIMITE_S * TICKS_POR_S, () => m.eventos.some((e) => e.t === 'morreu' && (e.id === 'i1' || e.id === 'j1')));
    for (const e of m.eventos) if (e.t === 'xpGanho' && e.id === 'j1') xp += e.xp;
    ouro += m.estado.objetos.filter((o) => o.tipo === 'ouro').reduce((total, o) => total + o.valor, 0);
    tempo += segundos(m.estado.tick);
  });
  return { xp: tempo > 0 ? xp * 60 / tempo : 0, ouro: tempo > 0 ? ouro * 60 / tempo : 0 };
}

/**
 * Marco 17 (D-063): duelo na arena com a ficha inteira (dois personagens da mesma classe e nível). `montarA` e
 * `montarB` ajustam cada um (build, equipamento). Devolve 1 se o A venceu, 0,5 no empate e 0 na derrota.
 */
export function dueloDeFichas(classe: string, nivel: number, semente: number, montarA: (e: Entidade, ctx: ContextoSimulacao) => void, montarB: (e: Entidade, ctx: ContextoSimulacao) => void): number {
  const ctx = contextoDoCenario('livre');
  const a = jogadorTipico(ctx, classe, nivel, 'a', 6, 9);
  const b = jogadorTipico(ctx, classe, nivel, 'b', 11, 9);
  a.equipe = 'equipe-a';
  b.equipe = 'equipe-b';
  montarA(a, ctx);
  montarB(b, ctx);
  for (const e of [a, b]) {
    e.hp = e.hpMax;
    e.mana = e.manaMax;
  }
  const m = mundo(ctx, semente, [a, b]);
  m.bots.push(new BotDeDuelo('a'), new BotDeDuelo('b'));
  const caiu = (e: EventoSimulacao) => e.t === 'morreu' && (e.id === 'a' || e.id === 'b');
  m.rodar(LIMITE_S * TICKS_POR_S, () => m.eventos.some(caiu));
  const morte = primeiro(m.eventos, caiu);
  // Marco 24 (24/10/2026): os dois caindo no mesmo tick é empate (meio ponto), não derrota de quem foi processado antes.
  const empate = morte && m.eventos.filter((e) => caiu(e) && e.tick === morte.tick).length > 1;
  if (empate) return 0.5;
  return morte?.t === 'morreu' && morte.id === 'b' ? 1 : 0;
}

/** A build dispersa: os pontos dos níveis espalhados por igual nos seis atributos (em vez do principal e da Constituição). */
export function dispersar(e: Entidade, ctx: ContextoSimulacao): void {
  const bolsa = e.bolsa;
  const classe = bolsa ? CONTEUDO.classes.get(bolsa.classeId) : undefined;
  if (!bolsa || !classe) return;
  const pontos = (e.nivel - 1) * ctx.balance.xp.pontosPorNivel;
  bolsa.atributosBase = { ...classe.atributos };
  const nomes = Object.keys(bolsa.atributosBase) as (keyof typeof bolsa.atributosBase)[];
  for (let i = 0; i < pontos; i++) {
    const n = nomes[i % nomes.length];
    if (n) bolsa.atributosBase[n]++;
  }
  recalcularFicha(e, ctx);
}

// Marco 24 (24/10/2026): o Necromante luta de cajado (o naturalDaClasse de armas.json); com a espada, o básico era o emprestado.
const ARMA_DA_CLASSE: Readonly<Record<string, string>> = { guerreiro: 'espada', aventureiro: 'espada', mago: 'cajado', arqueiro: 'arco', necromante: 'cajado' };

/** Equipa arma, peitoral e elmo gerados do nível do personagem, na raridade pedida. */
export function equipar(raridade: Raridade): (e: Entidade, ctx: ContextoSimulacao) => void {
  return (e, ctx) => {
    const bolsa = e.bolsa;
    if (!bolsa) return;
    for (const base of [ARMA_DA_CLASSE[bolsa.classeId] ?? 'espada', 'peitoral', 'elmo']) {
      const item = ctx.conteudo.itens.get(idItemGerado(base, e.nivel, raridade, 7));
      if (item?.slotPadrao) bolsa.equipamento[item.slotPadrao] = { invId: `g-${base}`, itemId: item.id, qtd: 1, ref: null };
    }
    recalcularFicha(e, ctx);
  };
}

/** Sem nada equipado (nem o equipamento inicial). */
export function desequipar(e: Entidade, ctx: ContextoSimulacao): void {
  const bolsa = e.bolsa;
  if (!bolsa) return;
  for (const slot of Object.keys(bolsa.equipamento) as (keyof typeof bolsa.equipamento)[]) bolsa.equipamento[slot] = null;
  recalcularFicha(e, ctx);
}

/** O personagem como o simulador o monta (sem ajuste). */
export function semAjuste(): void {
  // A ficha típica do nível, como está.
}

/** Compatibilidade com o relatório histórico. */
export function xpPorMinuto(...args: Parameters<typeof economiaPorMinuto>): number {
  return economiaPorMinuto(...args).xp;
}
