// Falcão do Aventureiro (marco 22, 23/10/2026, D-089). Um companheiro permanente que:
// - nasce ao lado do dono em cada fase e quando o dono volta;
// - divide a vida com o dono: o golpe no falcão cai no Aventureiro (combat/golpe.ts, com as defesas dele), o dano
//   periódico que o falcão leva sai da vida do dono, e os dois caem juntos (marco 24, D-098: só o reflexo do dano,
//   de 80% no nível 1 a 60% no máximo);
// - não ataca: voa até o alvo selecionado do dono (entities/ia-invocacao.ts, comportamento `companheiro`), e o
//   ataque básico continua saindo do Aventureiro;
// - é a origem das habilidades do Aventureiro (combat/acao.ts, `origemDaHabilidade`);
// - revela armadilhas com a Sabedoria do dono e recolhe o ouro em que pousa (world/).
// Tem vaga própria (não conta no limite de invocações) e voa (não ocupa célula). Números em balance.json.

import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { reflexoDoFalcao } from './ajustes-classes';
import { invocar } from './efeitos-fluxo';
import { celulaOcupada } from './geometria';
import { registrarParticipacao } from './participacao';
import { construirEfeito } from './registro-efeitos';

export const PRESET_FALCAO = 'falcao_companheiro';

/** Tem falcão? O Aventureiro (pela bolsa ou, na rede, pelo `classeId`), não as invocações dele. */
export function temCompanheiro(e: Entidade): boolean {
  return (e.bolsa?.classeId ?? e.classeId ?? '') === 'aventureiro' && !e.invocacao;
}

/** O falcão vivo do dono, se houver. */
export function companheiroDe(estado: EstadoJogo, dono: Entidade): Entidade | undefined {
  return estado.entidades.find((e) => vivo(e) && e.invocacao?.companheiro === true && e.invocacao.donoId === dono.id);
}

function chamar(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, saida: EventoSimulacao[]): void {
  const antes = estado.entidades.length;
  invocar(estado, ctx, dono, construirEfeito('invocar', { ref: PRESET_FALCAO, valor: 1, duracaoMs: 86_400_000 }), saida);
  const falcao = estado.entidades[antes];
  if (!falcao?.invocacao) return;
  falcao.invocacao.companheiro = true;
  falcao.invocacao.expiraTick = Number.MAX_SAFE_INTEGER;
  falcao.nivel = dono.nivel;
  falcao.defesa = dono.defesa;
  falcao.autoAtaque = false;
  espelhar(falcao, dono);
}

function espelhar(falcao: Entidade, dono: Entidade): void {
  falcao.hpMax = dono.hpMax;
  falcao.hp = dono.hp;
  // Invisível com o dono (o falcão não denuncia quem está escondido).
  falcao.invisivelAteTick = dono.invisivelAteTick;
  if (falcao.invocacao) falcao.invocacao.hpEspelhado = dono.hp;
}

/** Início do tick: chama o falcão de quem não tem (fase nova, dono que voltou). */
export function processarCompanheiros(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  for (const dono of [...estado.entidades]) {
    if (!temCompanheiro(dono) || !vivo(dono) || companheiroDe(estado, dono)) continue;
    chamar(estado, ctx, dono, saida);
  }
}

/**
 * Antes das mortes: o dano que o falcão levou neste tick sai da vida do dono (com a autoria, para o abate e a cura dos
 * inimigos), e o falcão volta a mostrar a vida do dono. Dono caído, o falcão cai junto.
 */
export function sincronizarCompanheiros(estado: EstadoJogo, ctx: ContextoSimulacao): void {
  for (const falcao of estado.entidades) {
    const inv = falcao.invocacao;
    if (!inv?.companheiro || falcao.morto) continue;
    const dono = buscarEntidade(estado, inv.donoId);
    if (!dono || dono.morto || dono.hp <= 0) {
      falcao.hp = 0;
      continue;
    }
    // Marco 24 (25/10/2026, D-098): o dono sente só o reflexo do dano (80% no nível 1, 60% no máximo).
    const dano = Math.round(Math.max(0, (inv.hpEspelhado ?? dono.hp) - falcao.hp) * reflexoDoFalcao(ctx, dono.nivel));
    if (dano > 0) {
      dono.hp = Math.max(0, dono.hp - dano);
      // A autoria dos golpes no falcão passa ao dono (quem derruba o Aventureiro pelo falcão leva o abate).
      for (const p of falcao.participacao) registrarParticipacao(dono, p.id, p.tick, ctx);
    }
    falcao.participacao = [];
    espelhar(falcao, dono);
    if (dono.hp <= 0) falcao.hp = 0;
  }
}

/** A célula do falcão, quando ele está vivo (para a origem das habilidades). */
export function celulaDoCompanheiro(estado: EstadoJogo, dono: Entidade): { x: number; y: number } | null {
  if (!temCompanheiro(dono)) return null;
  const f = companheiroDe(estado, dono);
  return f ? celulaOcupada(f) : null;
}
