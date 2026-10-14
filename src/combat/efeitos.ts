// Efeitos (§2.8): dispatcher único, consultas e processamento por tick. Marco 3 registrou os de
// controle; marco 8A (13/10/2026) liga os 20 tipos do registro (registro-efeitos.ts, D-048).
// Aplicar efeito acontece em um lugar só (`aplicarEfeito`); quem precisa saber se algo vale
// (movimento, ações, dano, colisão, projéteis) pergunta por estas consultas, que leem o registro.

import type { Celula, EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type EfeitoAtivo, type Entidade } from '../entities/entidade';
import { agendarAtrasado, armarArmadilha, excedeLimite, invocar, processarFluxo, processarGatilhos } from './efeitos-fluxo';
import { avancar, empurrar, teleportar } from './efeitos-instantaneos';
import { registrarParticipacao } from './participacao';
import { REGISTRO_EFEITOS, type DefinicaoEfeito, type EfeitoCanonico } from './registro-efeitos';

export { REGISTRO_EFEITOS, TIPOS_EFEITO, type EfeitoCanonico, type TipoEfeito } from './registro-efeitos';

/** Quem originou o efeito e de onde (o empurrão afasta desta posição). */
export interface OrigemDoEfeito {
  id: EntidadeId;
  x: number;
  y: number;
}

const ativos = (e: Entidade, tick: number): EfeitoAtivo[] => e.efeitos.filter((f) => f.ateTick > tick);
const comDefinicao = (e: Entidade, tick: number): [EfeitoAtivo, DefinicaoEfeito][] =>
  ativos(e, tick).map((f) => [f, REGISTRO_EFEITOS[f.tipo]]);

export function efeitosAtivos(e: Entidade, tick: number): DefinicaoEfeito[] {
  return ativos(e, tick).map((f) => REGISTRO_EFEITOS[f.tipo]);
}

export function movimentoBloqueado(e: Entidade, tick: number): boolean {
  return efeitosAtivos(e, tick).some((d) => d.bloqueiaMovimento);
}

/** A entidade pode começar (ou continuar) uma ação desse tipo? */
export function acaoBloqueada(e: Entidade, tick: number, tipoAtaque: 'fisico' | 'magico'): boolean {
  return efeitosAtivos(e, tick).some(
    (d) => d.bloqueiaAcoes === 'todas' || (tipoAtaque === 'magico' ? d.bloqueiaAcoes === 'magicas' : d.bloqueiaAcoes === 'fisicas'),
  );
}

export function imuneADano(e: Entidade, tick: number): boolean {
  return efeitosAtivos(e, tick).some((d) => d.imuneDano);
}

/** Multiplicador do dano causado: bônus somam, reduções somam, e os dois se multiplicam (D-048). */
export function multiplicadorDanoCausado(e: Entidade, tick: number): number {
  let mais = 0;
  let menos = 0;
  for (const [f, d] of comDefinicao(e, tick)) {
    if (d.danoCausado > 0) mais += f.pct;
    else if (d.danoCausado < 0) menos += f.pct;
  }
  return (1 + mais / 100) * Math.max(0, 1 - menos / 100);
}

export interface BonusAtaqueBasico {
  dano: number;
  recargaPct: number;
  alcance: number;
  alvosExtras: number;
}

/** Os quatro `ab_*` (§2.8): dano extra, recarga, alcance e alvos adicionais do ataque básico. */
export function bonusAtaqueBasico(e: Entidade, tick: number): BonusAtaqueBasico {
  const b: BonusAtaqueBasico = { dano: 0, recargaPct: 0, alcance: 0, alvosExtras: 0 };
  for (const [f, d] of comDefinicao(e, tick)) {
    if (d.ataqueBasico === 'dano') b.dano += f.valor;
    else if (d.ataqueBasico === 'recarga') b.recargaPct += f.pct;
    else if (d.ataqueBasico === 'alcance') b.alcance += f.valor;
    else if (d.ataqueBasico === 'alvos') b.alvosExtras += f.valor;
  }
  b.recargaPct = Math.min(75, b.recargaPct);
  return b;
}

export function projeteisAtravessam(e: Entidade, tick: number): boolean {
  return efeitosAtivos(e, tick).some((d) => d.projeteisAtravessam);
}

function resultado(
  saida: EventoSimulacao[],
  tick: number,
  alvo: Entidade,
  origemId: EntidadeId,
  ef: { tipo: EfeitoAtivo['tipo'] },
  r: { dano?: number; cura?: number; mana?: number },
): void {
  saida.push({ t: 'efeitoResultado', tick, alvoId: alvo.id, origemId, tipo: ef.tipo, dano: r.dano ?? 0, cura: r.cura ?? 0, mana: r.mana ?? 0 });
}

/** Cura ou recurso de uma vez: `valor` fixo mais `pct` do máximo. */
function restaurar(alvo: Entidade, recurso: 'cura' | 'recurso', valor: number, pct: number): number {
  if (recurso === 'cura') {
    const antes = alvo.hp;
    alvo.hp = Math.min(alvo.hpMax, alvo.hp + Math.max(0, Math.round(valor + (alvo.hpMax * pct) / 100)));
    return alvo.hp - antes;
  }
  const antes = alvo.mana;
  alvo.mana = Math.min(alvo.manaMax, alvo.mana + Math.max(0, Math.round(valor + (alvo.manaMax * pct) / 100)));
  return alvo.mana - antes;
}

/**
 * Dispatcher único (§2.8). Instantâneos executam e não ficam no estado; os com duração entram em
 * `efeitos` (reaplicar o mesmo tipo estende a duração e fica com o maior valor, nunca encurta).
 * A interrupção da ação em curso acontece em combat/acao.ts, que consulta `acaoBloqueada`.
 */
export function aplicarEfeito(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  alvo: Entidade,
  ef: EfeitoCanonico,
  origem: OrigemDoEfeito,
  mira: Celula | null,
  saida: EventoSimulacao[],
): void {
  if (!vivo(alvo)) return;
  const def = REGISTRO_EFEITOS[ef.tipo];
  const tick = estado.tick;
  const instantaneo = def.instantaneo ?? (ef.duracaoMs <= 0 && (def.periodico === 'cura' || def.periodico === 'recurso') ? def.periodico : null);
  if (instantaneo) {
    switch (instantaneo) {
      case 'cura':
        resultado(saida, tick, alvo, origem.id, ef, { cura: restaurar(alvo, 'cura', ef.valor, ef.pct) });
        break;
      case 'recurso':
        resultado(saida, tick, alvo, origem.id, ef, { mana: restaurar(alvo, 'recurso', ef.valor, ef.pct) });
        break;
      case 'teleporte':
        teleportar(estado, ctx, alvo, mira);
        break;
      case 'avanco':
        avancar(estado, ctx, alvo, mira, ef.valor);
        break;
      case 'empurrao':
        empurrar(estado, ctx, alvo, origem, ef.valor);
        break;
    }
    saida.push({ t: 'efeitoAplicado', tick, alvoId: alvo.id, origemId: origem.id, tipo: ef.tipo, ateTick: tick });
    return;
  }
  // Marco 8A-2: fluxos próprios de um disparo (efeitos-fluxo.ts).
  if (def.fluxo) {
    switch (def.fluxo) {
      case 'atrasado':
        agendarAtrasado(estado, alvo, ef, origem);
        break;
      case 'armadilha':
        if (!excedeLimite(estado, ctx, alvo, [ef])) armarArmadilha(estado, ctx, alvo, ef, mira, saida);
        break;
      case 'invocar':
        if (!excedeLimite(estado, ctx, alvo, [ef])) invocar(estado, ctx, alvo, ef, saida);
        break;
    }
    saida.push({ t: 'efeitoAplicado', tick, alvoId: alvo.id, origemId: origem.id, tipo: ef.tipo, ateTick: tick });
    return;
  }
  const ateTick = tick + ticksDe(ef.duracaoMs);
  const existente = alvo.efeitos.find((f) => f.tipo === ef.tipo);
  if (existente) {
    existente.ateTick = Math.max(existente.ateTick, ateTick);
    existente.valor = Math.max(existente.valor, ef.valor);
    existente.pct = Math.max(existente.pct, ef.pct);
    existente.origemId = origem.id;
    if (ef.interno) existente.interno = { ...ef.interno };
  } else {
    const intervalo = ticksDe(ctx.balance.efeitos.intervaloPeriodicoMs);
    alvo.efeitos.push({
      tipo: ef.tipo,
      ateTick,
      origemId: origem.id,
      valor: ef.valor,
      pct: ef.pct,
      proximoTick: def.periodico ? tick + intervalo : 0,
      interno: ef.interno ? { ...ef.interno } : null,
      ref: ef.ref,
    });
  }
  saida.push({ t: 'efeitoAplicado', tick, alvoId: alvo.id, origemId: origem.id, tipo: ef.tipo, ateTick });
}

/**
 * Etapa 4 do tick: periódicos (dano, cura, recurso a cada intervalo, inclusive no último tick
 * da duração) e depois a expiração. Dano periódico respeita imunidade e conta participação (XP).
 */
export function processarEfeitos(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const tick = estado.tick;
  const intervalo = ticksDe(ctx.balance.efeitos.intervaloPeriodicoMs);
  for (const e of estado.entidades) {
    if (e.efeitos.length === 0) continue;
    if (vivo(e)) {
      for (const f of e.efeitos) {
        const periodico = REGISTRO_EFEITOS[f.tipo].periodico;
        if (!periodico || f.proximoTick === 0 || tick < f.proximoTick) continue;
        f.proximoTick += intervalo;
        if (periodico === 'dano') {
          if (imuneADano(e, tick)) continue;
          const dano = Math.min(e.hp, Math.max(0, Math.round(f.valor)));
          e.hp -= dano;
          if (dano > 0) registrarParticipacao(e, f.origemId, tick, ctx);
          resultado(saida, tick, e, f.origemId, f, { dano });
          if (e.hp <= 0) break;
        } else {
          const ganho = restaurar(e, periodico, f.valor, f.pct);
          resultado(saida, tick, e, f.origemId, f, periodico === 'cura' ? { cura: ganho } : { mana: ganho });
        }
      }
    }
    e.efeitos = e.efeitos.filter((f) => f.ateTick > tick);
  }
  processarFluxo(estado, (alvo, ef, origem, mira) => {
    aplicarEfeito(estado, ctx, alvo, ef, origem, mira, saida);
  });
}

/** Etapa 7 (gatilhos por célula): rastros e armadilhas (marco 8A-2). */
export function processarGatilhosDeEfeito(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  processarGatilhos(
    estado,
    ctx,
    (alvo, ef, origem, mira) => {
      aplicarEfeito(estado, ctx, alvo, ef, origem, mira, saida);
    },
    saida,
  );
}
