// Aplicação de um impacto num alvo (§2.7, passo 10): dano com HP mínimo 0, cura limitada ao
// máximo, efeitos só quando acerta, e registro de participação para dividir XP.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { buscarEntidade } from '../core/estado';
import { vivo, type Entidade } from '../entities/entidade';
import { rolar } from './dados';
import { resolverGolpe, type FonteDeDano } from './dano';
import { aplicarEfeito, imuneADano, REGISTRO_EFEITOS } from './efeitos';
import type { Habilidade } from './habilidades';
import { registrarParticipacao } from './participacao';

export interface Impacto {
  acaoId: number;
  fonte: FonteDeDano;
  hab: Habilidade;
  /** Ordem do alvo num impacto em área. */
  indice: number;
  /** Célula mirada (teleporte e avanço usam). */
  mira?: { x: number; y: number };
  /** Bônus do ataque básico (`ab_dano`), somado à rolagem. */
  danoExtra?: number;
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
    const r = resolverGolpe(
      estado.rng,
      hab.formulaDano,
      { ...fonte, bonusAtributo: fonte.bonusAtributo + (impacto.danoExtra ?? 0) },
      { defesa: alvo.defesa, imune: imuneADano(alvo, estado.tick) },
      ctx.balance.combate,
      fonte.multDano,
    );
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
  // Dispatcher único (§2.8); `em: 'conjurador'` cai sobre quem lançou (ex.: avanço, roubo de vida).
  const conjurador = buscarEntidade(estado, fonte.id);
  const origem = { id: fonte.id, x: conjurador?.x ?? alvo.x, y: conjurador?.y ?? alvo.y };
  for (const efeito of hab.efeitos) {
    // Armadilha e invocação saem uma vez no lançamento (acao.ts), não por alvo atingido.
    if (REGISTRO_EFEITOS[efeito.tipo].aoLancar) continue;
    const sobre = efeito.em === 'conjurador' ? conjurador : alvo;
    if (sobre) aplicarEfeito(estado, ctx, sobre, efeito, origem, impacto.mira ?? { x: alvo.x, y: alvo.y }, saida);
  }
}
