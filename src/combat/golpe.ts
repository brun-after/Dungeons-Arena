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
import { construirEfeito, type EfeitoCanonico } from './registro-efeitos';
import { chebyshev } from './geometria';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { dispararGanchosDe, passivosDe } from '../progression/ganchos-do-portador';
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

/**
 * Marco 18 (17/10/2026, D-068): a Inteligência de quem lança (`potencia`) fortalece o efeito — a duração dos status e
 * o valor de quem é número de verdade (periódico, escudo, cura e dano instantâneos). Fluxos (armadilha, invocação,
 * atrasado) e deslocamentos ficam como são; o `pct` também (lentidão e afins não passam do que o efeito descreve).
 */
export function comPotencia(ef: EfeitoCanonico, potencia: number): EfeitoCanonico {
  if (potencia === 1) return ef;
  const def = REGISTRO_EFEITOS[ef.tipo];
  if (def.fluxo !== null) return ef;
  const numerico = def.periodico !== null || def.escudo || def.instantaneo === 'cura' || def.instantaneo === 'dano';
  return {
    ...ef,
    duracaoMs: ef.duracaoMs > 0 ? Math.round(ef.duracaoMs * potencia) : 0,
    valor: numerico ? Math.max(1, Math.round(ef.valor * potencia)) : ef.valor,
  };
}

/** Multiplicador do dano recebido: exposto, resistência ao elemento e as sinergias. 0 = imune ao elemento. */
function multiplicadorRecebido(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, hab: Habilidade, tick: number, sinergiaPct: number): number {
  const resistencia = resistenciaPct(ctx, alvo, hab.elemento);
  if (resistencia >= 100) return 0;
  return multiplicadorDanoRecebido(alvo, tick) * (1 - resistencia / 100) * (1 + sinergiaPct / 100) * (1 - auraDeDefesaPct(estado, ctx, alvo) / 100);
}

/** Marco 18 (ressonância Bastião): o maior "aliados perto levam menos dano" entre os aliados a até 3 células. */
function auraDeDefesaPct(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade): number {
  let melhor = 0;
  for (const outro of estado.entidades) {
    if (outro === alvo || !outro.bolsa || !vivo(outro) || chebyshev(outro, alvo) > 3 || !podeAjudar(outro, alvo, ctx.modo)) continue;
    melhor = Math.max(melhor, passivosDe(ctx, outro).auraDefesaPct);
  }
  return Math.min(50, melhor);
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
  // Marco 18: os estados do alvo antes do golpe (os ganchos "se o alvo estava…" olham estes).
  const estadosAntes = alvo.efeitos.filter((f) => f.ateTick > tick).map((f) => f.tipo);

  if (hab.formulaDano !== null) {
    // Marco 15: a dificuldade e o tamanho do grupo pesam pelo lado de quem bate e de quem apanha.
    // Marco 18: o dano extra das sinergias cresce com a potência (Inteligência) de quem lança.
    const extraPct = sinergias.reduce((s, x) => s + x.danoExtraPct, 0) * fonte.potencia;
    const recebido = multiplicadorRecebido(estado, ctx, alvo, hab, tick, extraPct) * fatorDoGolpe(estado, ctx, fonte, alvo);
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
    if (dano > 0) {
      registrarParticipacao(alvo, fonte.id, tick, ctx);
      alvo.ultimoGolpe = { fonteId: fonte.id, chave: hab.chave };
    }
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
    aplicarEfeito(estado, ctx, alvo, comPotencia(ef, fonte.potencia), origem, mira, saida);
  });
  // Marco 18 (D-068): reações em área (vapor, lama, peste; o eletrocutar só nos molhados) e a cura de quem lançou.
  for (const s of sinergias) {
    if (s.raio > 0) {
      for (const outro of estado.entidades) {
        if (outro === alvo || !vivo(outro) || chebyshev(outro, alvo) > s.raio || !podeFerir(fonte, outro, ctx.modo)) continue;
        if (s.soComEstado && !outro.efeitos.some((f) => f.tipo === s.soComEstado && f.ateTick > tick)) continue;
        if (s.soComEstado) outro.efeitos = outro.efeitos.filter((f) => !s.remove.includes(f.tipo));
        for (const ef of s.aplicar) aplicarEfeito(estado, ctx, outro, comPotencia(ef, fonte.potencia), origem, { x: outro.x, y: outro.y }, saida);
      }
    }
    if (s.curarFonte > 0 && conjurador && vivo(conjurador)) {
      aplicarEfeito(estado, ctx, conjurador, construirEfeito('cura', { valor: Math.round(s.curarFonte * fonte.potencia) }), origem, null, saida);
    }
  }
  // Marco 18: o marcado sai no golpe; o consagrado cura quem acerta.
  if (dano > 0) {
    const consagrado = alvo.efeitos.find((f) => f.ateTick > tick && REGISTRO_EFEITOS[f.tipo].curaQuemAcerta);
    if (consagrado && conjurador && vivo(conjurador) && conjurador !== alvo) {
      aplicarEfeito(estado, ctx, conjurador, construirEfeito('cura', { valor: consagrado.valor }), origem, null, saida);
    }
    alvo.efeitos = alvo.efeitos.filter((f) => !REGISTRO_EFEITOS[f.tipo].someAoLevarGolpe);
  }
  // Dispatcher único (§2.8); `em: 'conjurador'` cai sobre quem lançou (ex.: avanço, roubo de vida).
  for (const efeito of hab.efeitos) {
    // Armadilha e invocação saem uma vez no lançamento (acao.ts), não por alvo atingido.
    if (REGISTRO_EFEITOS[efeito.tipo].aoLancar) continue;
    const sobre = efeito.em === 'conjurador' ? conjurador : alvo;
    if (sobre) aplicarEfeito(estado, ctx, sobre, comPotencia(efeito, fonte.potencia), origem, mira, saida);
  }
  // Marco 18 (D-069): ganchos de quem acerta (no acerto e no crítico) e de quem leva o golpe.
  if (hab.formulaDano !== null && conjurador && conjurador !== alvo) {
    dispararGanchosDe(estado, ctx, conjurador, 'aoAcertar', { outro: alvo, hab, estadosDoOutro: estadosAntes }, saida);
    if (critico) dispararGanchosDe(estado, ctx, conjurador, 'aoCritico', { outro: alvo, hab, estadosDoOutro: estadosAntes }, saida);
    if (dano > 0) dispararGanchosDe(estado, ctx, alvo, 'aoReceberGolpe', { outro: conjurador, hab }, saida);
  }
}
