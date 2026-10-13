// Aplicação de um impacto num alvo (§2.7, passo 10): dano com HP mínimo 0, cura limitada ao
// máximo, efeitos só quando acerta, e registro de participação para dividir XP.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { rolar } from './dados';
import { resolverGolpe, type FonteDeDano } from './dano';
import { aplicarEfeito } from './efeitos';
import type { Habilidade } from './habilidades';

export interface Impacto {
  acaoId: number;
  fonte: FonteDeDano;
  hab: Habilidade;
  /** Ordem do alvo num impacto em área. */
  indice: number;
}

export function aplicarImpacto(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  alvo: Entidade,
  impacto: Impacto,
  saida: EventoSimulacao[],
): void {
  if (!vivo(alvo)) return;
  const { hab, fonte } = impacto;
  let dano = 0;
  let cura = 0;
  let d20 = 0;
  let mult = 1;
  let falha = false;
  let critico = false;
  let imune = false;

  if (hab.formulaDano !== null) {
    const r = resolverGolpe(estado.rng, hab.formulaDano, fonte, { defesa: alvo.defesa, imune: false }, ctx.balance.combate);
    ({ dano, d20, mult, falha, critico, imune } = r);
    alvo.hp = Math.max(0, alvo.hp - dano);
    if (dano > 0) registrarParticipacao(alvo, fonte.id, estado.tick, ctx);
  }
  if (hab.formulaCura !== null) {
    cura = Math.max(0, rolar(estado.rng, hab.formulaCura).total);
    const antes = alvo.hp;
    alvo.hp = Math.min(alvo.hpMax, alvo.hp + cura);
    cura = alvo.hp - antes;
  }

  saida.push({
    t: 'impacto',
    tick: estado.tick,
    acaoId: impacto.acaoId,
    fonteId: fonte.id,
    alvoId: alvo.id,
    habilidadeId: hab.id,
    dano,
    cura,
    d20,
    mult,
    falha,
    critico,
    imune,
    indice: impacto.indice,
  });

  // Efeitos dependentes de acerto não se aplicam na falha crítica nem com imunidade (§2.7, passo 7).
  if (falha || imune) return;
  for (const efeito of hab.efeitos) {
    aplicarEfeito(alvo, efeito.tipo, efeito.duracaoMs, fonte.id, estado.tick, saida);
  }
}

function registrarParticipacao(alvo: Entidade, fonteId: string, tick: number, ctx: ContextoSimulacao): void {
  const janela = ticksDe(ctx.balance.combate.janelaParticipacaoS * 1000);
  alvo.participacao = alvo.participacao.filter((p) => p.id !== fonteId && tick - p.tick <= janela);
  alvo.participacao.push({ id: fonteId, tick });
}
