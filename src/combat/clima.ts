// Clima elemental (marco 23, 24/10/2026, D-092). Na fase de tema elemental (data/temas.json, `elemento`):
// - reforço: as habilidades do elemento do tema batem `reforcoPct` mais forte, e o estado do elemento dura
//   `duracaoEstadoPct` mais (vale para todos, inimigos inclusive);
// - opressão: as do elemento oposto (data/afinidades.json) batem `opressaoPct` mais fraco;
// - pulso: a cada `pulsoMs`, o clima pesa nos personagens (frio, calor, estática...), menos em quem tem ao menos
//   `resistenciaImunePct` de resistência ao elemento pelo equipamento.
// Junto com os inimigos afins, é o que convida a trocar a barra e o equipamento antes de seguir.
// Números em balance.clima.

import type { ContextoSimulacao } from '../core/contexto';
import { DONO_FASE, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo } from '../entities/entidade';
import type { Tema } from '../world/temas';
import { aplicarEfeito } from './efeitos';
import { resistenciaPct, type Elemento } from './elementos';
import type { Habilidade } from './habilidades';
import { construirEfeito, TIPOS_EFEITO, type EfeitoCanonico, type TipoEfeito } from './registro-efeitos';

/** O tema da fase atual, se houver (um id desconhecido conta como sem tema). */
export function temaDaFase(ctx: ContextoSimulacao): Tema | null {
  return ctx.fase.tema ? (ctx.conteudo.temas.get(ctx.fase.tema) ?? null) : null;
}

/** O elemento do clima e o seu oposto, ou null na fase neutra. */
export function climaDaFase(ctx: ContextoSimulacao): { elemento: Elemento; oposto: Elemento | null } | null {
  const elemento = temaDaFase(ctx)?.elemento ?? null;
  return elemento ? { elemento, oposto: ctx.conteudo.afinidades.elementos.get(elemento)?.oposto ?? null } : null;
}

/**
 * Marco 44 (15/11/2026, D-178): os elementos pela hora, no Mundo (onde a sala põe `modo.noite`): os da noite (sombra e
 * gelo) ficam até `pct`% mais fortes na noite fechada e os do dia (luz e fogo), de dia, na medida da hora. Vale para
 * as skills (as runas inclusive, que mudam o elemento) e para quanto dura o estado do elemento (as reações).
 */
export function fatorDaHora(ctx: ContextoSimulacao, elemento: Elemento | null): number {
  const noite = ctx.modo.noite;
  if (!elemento || noite === undefined) return 1;
  const h = ctx.balance.mundo.elementosPelaHora;
  if (h.noite.includes(elemento)) return 1 + (h.pct / 100) * noite;
  if (h.dia.includes(elemento)) return 1 + (h.pct / 100) * (1 - noite);
  return 1;
}

/** Multiplicador de dano do clima (e da hora, D-178) para uma habilidade do elemento. */
export function multiplicadorClima(ctx: ContextoSimulacao, elemento: Elemento | null): number {
  return fatorDaHora(ctx, elemento) * multiplicadorDoTema(ctx, elemento);
}

function multiplicadorDoTema(ctx: ContextoSimulacao, elemento: Elemento | null): number {
  const c = elemento ? climaDaFase(ctx) : null;
  if (!c) return 1;
  if (elemento === c.elemento) return 1 + ctx.balance.clima.reforcoPct / 100;
  if (elemento === c.oposto) return 1 - ctx.balance.clima.opressaoPct / 100;
  return 1;
}

/** O estado do elemento do clima dura mais quando sai de uma habilidade desse elemento. */
export function estenderNoClima(ctx: ContextoSimulacao, hab: Habilidade, ef0: EfeitoCanonico): EfeitoCanonico {
  // D-178: o estado do elemento favorecido pela hora dura mais (mais tempo para as reações).
  const hora = fatorDaHora(ctx, hab.elemento);
  const ef = hora !== 1 && hab.elemento && ef0.duracaoMs > 0 && ctx.conteudo.elementos.get(hab.elemento)?.estado.tipo === ef0.tipo ? { ...ef0, duracaoMs: Math.round(ef0.duracaoMs * hora) } : ef0;
  const c = hab.elemento ? climaDaFase(ctx) : null;
  if (!c || hab.elemento !== c.elemento || ef.duracaoMs <= 0) return ef;
  if (ctx.conteudo.elementos.get(c.elemento)?.estado.tipo !== ef.tipo) return ef;
  return { ...ef, duracaoMs: Math.round(ef.duracaoMs * (1 + ctx.balance.clima.duracaoEstadoPct / 100)) };
}

const ehTipoEfeito = (v: string): v is TipoEfeito => (TIPOS_EFEITO as readonly string[]).includes(v);

/** O pulso do clima nos personagens (só quem tem bolsa: jogadores; as invocações e os inimigos ficam de fora). */
export function processarClima(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const c = climaDaFase(ctx);
  if (!c) return;
  const b = ctx.balance.clima;
  if (estado.tick === 0 || estado.tick % Math.max(1, ticksDe(b.pulsoMs)) !== 0) return;
  const pulso = b.pulsos[c.elemento];
  if (!pulso || !ehTipoEfeito(pulso.tipo)) return;
  const ef = construirEfeito(pulso.tipo, { duracaoMs: pulso.duracaoMs, valor: pulso.valor, pct: pulso.pct });
  for (const e of estado.entidades) {
    if (!vivo(e) || !e.bolsa || resistenciaPct(ctx, e, c.elemento, estado.tick) >= b.resistenciaImunePct) continue;
    // Sem aviso a cada pulso (o ícone do estado basta; o clima já foi anunciado ao entrar).
    aplicarEfeito(estado, ctx, e, ef, { id: DONO_FASE, x: e.x, y: e.y }, null, saida, false);
  }
}
