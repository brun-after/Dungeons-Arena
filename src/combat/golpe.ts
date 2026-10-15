// Aplicação de um impacto num alvo (§2.7, passo 10): dano com HP mínimo 0, cura limitada ao
// máximo, efeitos só quando acerta, e registro de participação para dividir XP.
// Marco 14 (14/10/2026), D-059: o elemento consulta as sinergias com os estados do alvo (dano extra, remoção e
// efeitos, só quando acerta); resistência do preset, exposto e escudo; a cura passa pelo veneno e pelo rank.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { buscarEntidade } from '../core/estado';
import { vivo, type Entidade } from '../entities/entidade';
import { rolar } from './dados';
import { resolverGolpe, type FonteDeDano } from './dano';
import { absorverEscudo, aplicarEfeito, imuneADano, multiplicadorCuraRecebida, multiplicadorDanoRecebido, REGISTRO_EFEITOS } from './efeitos';
import { dispararSinergias, resistenciaPct, sinergiasAtivas } from './elementos';
import { fatorDoGolpe } from '../modos/dificuldade';
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

/** Multiplicador do dano recebido: exposto, resistência ao elemento e as sinergias. 0 = imune ao elemento. */
function multiplicadorRecebido(ctx: ContextoSimulacao, alvo: Entidade, hab: Habilidade, tick: number, sinergiaPct: number): number {
  const resistencia = resistenciaPct(ctx, alvo, hab.elemento);
  if (resistencia >= 100) return 0;
  return multiplicadorDanoRecebido(alvo, tick) * (1 - resistencia / 100) * (1 + sinergiaPct / 100);
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
  const tick = estado.tick;
  let dano = 0;
  let cura = 0;
  let d20 = 0;
  let mult = 1;
  let falha = false;
  let critico = false;
  let imune = false;
  const conjurador = buscarEntidade(estado, fonte.id);
  const origem = { id: fonte.id, x: conjurador?.x ?? alvo.x, y: conjurador?.y ?? alvo.y };
  const mira = impacto.mira ?? { x: alvo.x, y: alvo.y };
  const sinergias = hab.formulaDano !== null ? sinergiasAtivas(alvo, hab.elemento, ctx.conteudo.interacoes.sinergias, tick) : [];

  if (hab.formulaDano !== null) {
    // Marco 15: a dificuldade e o tamanho do grupo pesam pelo lado de quem bate e de quem apanha.
    const recebido = multiplicadorRecebido(ctx, alvo, hab, tick, sinergias.reduce((s, x) => s + x.danoExtraPct, 0)) * fatorDoGolpe(estado, ctx, fonte, alvo);
    const r = resolverGolpe(
      estado.rng,
      hab.formulaDano,
      { ...fonte, bonusAtributo: fonte.bonusAtributo + (impacto.danoExtra ?? 0) },
      { defesa: alvo.defesa, imune: imuneADano(alvo, tick) || recebido === 0, multRecebido: recebido },
      ctx.balance.combate,
      fonte.multDano,
    );
    ({ d20, mult, falha, critico, imune } = r);
    // Marco 14: o escudo absorve antes da vida.
    dano = absorverEscudo(alvo, r.dano, tick);
    alvo.hp = Math.max(0, alvo.hp - dano);
    if (dano > 0) registrarParticipacao(alvo, fonte.id, tick, ctx);
  }
  if (hab.formulaCura !== null) {
    const bruta = rolar(estado.rng, hab.formulaCura).total;
    cura = Math.max(0, Math.round(bruta * fonte.multCura * multiplicadorCuraRecebida(alvo, tick)));
    const antes = alvo.hp;
    alvo.hp = Math.min(alvo.hpMax, alvo.hp + cura);
    cura = alvo.hp - antes;
  }

  const disparadas = falha || imune ? [] : sinergias.map((s) => s.id);
  saida.push({
    t: 'impacto',
    tick,
    acaoId: impacto.acaoId,
    fonteId: fonte.id,
    alvoId: alvo.id,
    habilidadeId: hab.id,
    chave: hab.chave,
    dano,
    cura,
    d20,
    mult,
    falha,
    critico,
    imune,
    indice: impacto.indice,
    sinergias: disparadas,
  });

  // Efeitos dependentes de acerto não se aplicam na falha crítica nem com imunidade (§2.7, passo 7).
  if (falha || imune) return;
  // Sinergias (marco 14): o estado consumido sai e os efeitos da sinergia entram, antes dos da habilidade.
  dispararSinergias(alvo, sinergias, (ef) => {
    aplicarEfeito(estado, ctx, alvo, ef, origem, mira, saida);
  });
  // Dispatcher único (§2.8); `em: 'conjurador'` cai sobre quem lançou (ex.: avanço, roubo de vida).
  for (const efeito of hab.efeitos) {
    // Armadilha e invocação saem uma vez no lançamento (acao.ts), não por alvo atingido.
    if (REGISTRO_EFEITOS[efeito.tipo].aoLancar) continue;
    const sobre = efeito.em === 'conjurador' ? conjurador : alvo;
    if (sobre) aplicarEfeito(estado, ctx, sobre, efeito, origem, mira, saida);
  }
}
