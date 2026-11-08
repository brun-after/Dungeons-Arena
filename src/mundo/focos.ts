// Os focos elementais do Mundo (08/11/2026, D-138). Cada região tem os seus (dados do reino: o tipo do terreno, perto
// de quê, a chance por janela, quanto dura e o chefe que às vezes vem junto). Como os eventos da região
// (mundo/eventos-mundo.ts), o sorteio é pela semente da região, do foco e da janela: igual em todos os canais, sem estado
// guardado. Aceso, o foco põe terrenos vivos (world/terrenos-vivos.ts) com o id dele, perto do que o explica (a porta
// da estrutura, o chefe do elemento ou um canto livre longe da vila), e às vezes o chefe. No fim da janela os terrenos
// somem (pelo prazo) e o chefe que ninguém feriu vai embora. Sem aviso: quem passa, vê.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { aleatorio, criarRng, hashTexto, inteiro } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { vivo } from '../entities/entidade';
import { criarInimigo } from '../entities/fabrica';
import { passavel } from '../world/fase';
import { ehDragao, porteDoDragao } from '../world/porte-dragoes';
import { TERRENO_DO_CHEFE } from '../world/gerador-exterior';
import { portaDa, type FocoDaRegiao, type RegiaoDoMundo } from './reino';

/** A janela em que o foco está aceso agora (início e fim em ms), ou null. */
export function focoAceso(regiaoId: string, foco: FocoDaRegiao, agoraMs: number): { inicio: number; fim: number } | null {
  const janelaMs = foco.janelaMin * 60_000;
  const duracaoMs = Math.min(foco.duracaoMin * 60_000, janelaMs);
  if (janelaMs <= 0 || duracaoMs <= 0) return null;
  const janela = Math.floor(agoraMs / janelaMs);
  const chave = `${regiaoId}/${foco.id}/${String(janela)}`;
  if (hashTexto(chave) % 100 >= foco.chancePct) return null;
  const folga = janelaMs - duracaoMs;
  const inicio = janela * janelaMs + (folga > 0 ? hashTexto(`${chave}/inicio`) % folga : 0);
  return agoraMs >= inicio && agoraMs < inicio + duracaoMs ? { inicio, fim: inicio + duracaoMs } : null;
}

/** A marca do foco aceso numa janela (os terrenos e o chefe dele a levam). */
export function marcaDoFoco(foco: FocoDaRegiao, inicio: number): string {
  return `${foco.id}@${String(inicio)}`;
}

/** O id do chefe do foco. */
export function idDoChefeDoFoco(foco: FocoDaRegiao): string {
  return `foco:${foco.id}`;
}

/** Onde o foco nasce: perto do que o explica. Null se não há lugar (a estrutura não existe, o chefe não está). */
function ancora(estado: EstadoJogo, ctx: ContextoSimulacao, regiao: RegiaoDoMundo, foco: FocoDaRegiao, sorte: () => number): Celula | null {
  if (foco.perto === 'boss') {
    const chefe = estado.entidades.find((e) => vivo(e) && TERRENO_DO_CHEFE[e.preset] === foco.tipo);
    return chefe ? { x: chefe.x, y: chefe.y } : null;
  }
  if (foco.perto !== 'livre') {
    const portas = regiao.estruturas.filter((e) => e.tipo === foco.perto).map((e) => portaDa(e).frente);
    return portas.length ? (portas[Math.floor(sorte() * portas.length)] ?? null) : null;
  }
  // Livre: um canto andável longe da vila e das chegadas.
  const longe = (c: Celula) => (ctx.fase.refugios ?? []).every((r) => Math.hypot(c.x - r.x, c.y - r.y) > r.raio + 12)
    && ctx.fase.spawns.every((s) => Math.max(Math.abs(s.x - c.x), Math.abs(s.y - c.y)) > 12);
  for (let t = 0; t < 200; t++) {
    const c = { x: Math.floor(sorte() * ctx.fase.largura), y: Math.floor(sorte() * ctx.fase.altura) };
    if (passavel(ctx.fase, c.x, c.y) && longe(c)) return c;
  }
  return null;
}

/** Um lugar andável a até `ate` passos do centro onde cabe o raio (o porte do dragão). */
function lugarPerto(ctx: ContextoSimulacao, centro: Celula, de: number, ate: number, raio: number, sorte: () => number): Celula | null {
  const cabe = (c: Celula) => {
    for (let dy = -raio; dy <= raio; dy++) for (let dx = -raio; dx <= raio; dx++) if (!passavel(ctx.fase, c.x + dx, c.y + dy)) return false;
    return true;
  };
  for (let t = 0; t < 80; t++) {
    const d = de + Math.floor(sorte() * (ate - de + 1));
    const a = sorte() * Math.PI * 2;
    const c = { x: Math.round(centro.x + Math.cos(a) * d), y: Math.round(centro.y + Math.sin(a) * d) };
    if (cabe(c)) return c;
  }
  return null;
}

/**
 * Acende o foco na janela (uma vez: se já há terreno com a marca, não faz nada): as áreas em volta da âncora até `fimMs`
 * e, com a chance do foco, o chefe do elemento perto delas.
 */
export function acenderFoco(estado: EstadoJogo, ctx: ContextoSimulacao, regiao: RegiaoDoMundo, foco: FocoDaRegiao, janela: { inicio: number; fim: number }, agoraMs: number): void {
  const marca = marcaDoFoco(foco, janela.inicio);
  if (estado.terrenos?.some((t) => t.foco === marca)) return;
  const rng = criarRng(hashTexto(`${regiao.id}/${marca}`));
  const sorte = () => aleatorio(rng);
  const centro = ancora(estado, ctx, regiao, foco, sorte);
  if (!centro) return;
  const ateTick = estado.tick + Math.max(1, ticksDe(janela.fim - agoraMs));
  const vivos = (estado.terrenos ??= []);
  const postos: Celula[] = [];
  for (let i = 0; i < foco.areas && vivos.length < ctx.balance.terrenos.maxVivos; i++) {
    const c = lugarPerto(ctx, centro, i === 0 ? 2 : foco.raio + 1, foco.raio * 2 + 5, 0, sorte);
    if (!c || postos.some((p) => Math.max(Math.abs(p.x - c.x), Math.abs(p.y - c.y)) <= foco.raio)) continue;
    postos.push(c);
    vivos.push({ id: estado.proximoId++, tipo: foco.tipo, x: c.x, y: c.y, raio: foco.raio, ateTick, foco: marca });
  }
  if (postos.length === 0) {
    if (vivos.length === 0) delete estado.terrenos;
    return;
  }
  const boss = foco.boss;
  const preset = boss ? ctx.conteudo.presets.get(boss.preset) : undefined;
  const id = idDoChefeDoFoco(foco);
  if (!boss || !preset || inteiro(rng, 0, 99) >= boss.chancePct || estado.entidades.some((e) => e.id === id)) return;
  const nivel = regiao.nivel[1];
  const raio = ehDragao(boss.preset) ? Math.ceil(porteDoDragao(nivel, ctx.balance).raio) : 0;
  const c = lugarPerto(ctx, centro, raio + foco.raio + 2, raio + foco.raio * 2 + 8, raio, sorte);
  if (c) estado.entidades.push(criarInimigo(preset, id, c.x, c.y, ctx.balance, { nivel }));
}

/** O foco apagou: o chefe dele que ninguém feriu (vida cheia) vai embora junto. */
export function apagarFoco(estado: EstadoJogo, foco: FocoDaRegiao): void {
  const id = idDoChefeDoFoco(foco);
  estado.entidades = estado.entidades.filter((e) => e.id !== id || (vivo(e) && e.hp < e.hpMax));
}
