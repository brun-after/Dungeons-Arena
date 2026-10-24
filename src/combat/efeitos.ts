import { extraGuerreiro, protecaoInicial, pulsarAura } from './ajustes-classes';
import { imuneAoEstado } from './afinidade';
import { executarTatica, fato, muralhaEm, fluxoRestaurador } from './tatica';
import { passivasDaBolsa } from './perfil';
import { executarRitual } from './necromancia';
// Efeitos (§2.8): dispatcher único, consultas e processamento por tick. Marco 3 registrou os de
// controle; marco 8A (13/10/2026) liga os 20 tipos do registro (registro-efeitos.ts, D-048).
// Aplicar efeito acontece em um lugar só (`aplicarEfeito`); quem precisa saber se algo vale
// (movimento, ações, dano, colisão, projéteis) pergunta por estas consultas, que leem o registro.
// Marco 14 (14/10/2026), D-059: acúmulo, oposições, transformações, teto e imunidades em dados (acumulo.ts);
// lentidão, cura recebida, dano recebido e escudo; puxão, troca de lugar e dano direto.

import type { Celula, EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type Armadilha, type EstadoJogo } from '../core/estado';
import { passivosDe } from '../progression/ganchos-do-portador';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { congelada, vivo, type EfeitoAtivo, type Entidade } from '../entities/entidade';
import { agendarAtrasado, armarArmadilha, dispararArmadilha, excedeLimite, invocar, processarFluxo, processarGatilhos } from './efeitos-fluxo';
import { fatorDoGolpe } from '../modos/dificuldade';
import { registrarEfeitoAtivo } from './acumulo';
import { avancar, empurrar, puxar, teleportar, trocarLugar } from './efeitos-instantaneos';
import { registrarParticipacao } from './participacao';
import { REGISTRO_EFEITOS, type DefinicaoEfeito, type EfeitoCanonico } from './registro-efeitos';

export { REGISTRO_EFEITOS, TIPOS_EFEITO, type EfeitoCanonico, type TipoEfeito } from './registro-efeitos';

/** Quem originou o efeito e de onde (o empurrão afasta desta posição). */
export interface OrigemDoEfeito {
  acaoId?: number;
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
  return congelada(e) || efeitosAtivos(e, tick).some((d) => d.bloqueiaMovimento);
}

/** A entidade pode começar (ou continuar) uma ação desse tipo? */
export function acaoBloqueada(e: Entidade, tick: number, tipoAtaque: 'fisico' | 'magico'): boolean {
  // Baú e loja congelam (marco 9A): nem ação nova nem a que estava em curso.
  if (congelada(e)) return true;
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

/** Marco 14: lentidão somada (resfriado), em %, até 80. */
export function lentidaoPct(e: Entidade, tick: number): number {
  let soma = 0;
  for (const [f, d] of comDefinicao(e, tick)) if (d.lentidao) soma += f.pct;
  return Math.min(80, soma);
}

/** Marco 14: o veneno reduz toda cura recebida (golpe, efeito e periódico). */
export function multiplicadorCuraRecebida(e: Entidade, tick: number): number {
  let menos = 0;
  for (const [f, d] of comDefinicao(e, tick)) if (d.curaRecebida < 0) menos += f.pct;
  return Math.max(0, 1 - menos / 100);
}

/** Marco 14: exposto aumenta todo dano recebido. */
export function multiplicadorDanoRecebido(e: Entidade, tick: number): number {
  let mais = 0;
  for (const [f, d] of comDefinicao(e, tick)) if (d.danoRecebido > 0) mais += f.pct;
  return 1 + mais / 100;
}

/** Marco 14: o escudo absorve dano antes da vida e se gasta; devolve o dano que sobra. */
export function absorverEscudo(e: Entidade, dano: number, tick: number): number {
  let resto = dano;
  for (const f of e.efeitos) {
    if (resto <= 0) break;
    if (f.ateTick <= tick || !REGISTRO_EFEITOS[f.tipo].escudo) continue;
    const absorvido = Math.min(f.valor, resto);
    f.valor -= absorvido;
    resto -= absorvido;
  }
  e.efeitos = e.efeitos.filter((f) => !REGISTRO_EFEITOS[f.tipo].escudo || f.valor > 0);
  return resto;
}

/**
 * Dano que não passa pelo d20 (periódico e dano direto): exposto, escudo e o HP mínimo 0. `fator`: dificuldade e
 * grupo (marco 15), pelo lado de quem originou.
 */
export function sofrerDano(e: Entidade, valor: number, tick: number, fator = 1): number {
  const bruto = Math.max(0, Math.round(valor * multiplicadorDanoRecebido(e, tick) * fator));
  const dano = Math.min(e.hp, absorverEscudo(e, bruto, tick));
  e.hp -= dano;
  return dano;
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

/** Cura ou recurso de uma vez: `valor` fixo mais `pct` do máximo. A cura passa pelo veneno (marco 14). */
function restaurar(alvo: Entidade, recurso: 'cura' | 'recurso', valor: number, pct: number, tick: number): number {
  if (recurso === 'cura') {
    const antes = alvo.hp;
    const cura = Math.round((valor + (alvo.hpMax * pct) / 100) * multiplicadorCuraRecebida(alvo, tick));
    alvo.hp = Math.min(alvo.hpMax, alvo.hp + Math.max(0, cura));
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
  /** Marco 19 (17/10/2026): zonas renovam um estado já visível sem repetir aviso a cada tick. */
  notificar = true,
): void {
  if (!vivo(alvo)) return;
  // Marco 23 (D-092): o estado do elemento afim não pega no inimigo afim (brasas não queimam o inimigo de fogo).
  if (imuneAoEstado(ctx, alvo, ef.tipo)) return;
  const def = REGISTRO_EFEITOS[ef.tipo];
  const tick = estado.tick;
  if (ef.tipo === 'aparando') ef = { ...ef, duracaoMs: Math.min(ef.duracaoMs, ctx.balance.tatica.aparoJanelaMaxMs) };
  if (ef.tipo === 'veu_noturno') ef = { ...ef, duracaoMs: Math.min(ef.duracaoMs, ctx.balance.tatica.veuJanelaMaxMs) };
  if (alvo.bolsa && (def.bloqueiaMovimento || def.bloqueiaAcoes !== 'nenhuma')) {
    const pct = Math.min(ctx.balance.tatica.tenacidadeMaxPct, passivasDaBolsa(ctx, alvo.bolsa).reduce((s, p) => s + (p.tenacidadePct ?? 0), 0));
    if (pct > 0) ef = { ...ef, duracaoMs: Math.round(ef.duracaoMs * (1 - pct / 100)) };
  }
  // Marco 18 (ressonância Muralha): escudos recebidos duram e absorvem mais.
  if (def.escudo && alvo.bolsa) {
    const k = 1 + passivosDe(ctx, alvo).escudoPct / 100;
    if (k !== 1) ef = { ...ef, valor: Math.round(ef.valor * k), duracaoMs: Math.round(ef.duracaoMs * k) };
  }
  if (def.escudo) ef = { ...ef, valor: Math.min(ef.valor, Math.max(1, Math.floor(alvo.hpMax * ctx.balance.tatica.escudoMaxHpPct / 100))) };
  const instantaneo = def.instantaneo ?? (ef.duracaoMs <= 0 && (def.periodico === 'cura' || def.periodico === 'recurso') ? def.periodico : null);
  if (instantaneo) {
    switch (instantaneo) {
      case 'drenar_invocacao': case 'comandar_mortos':
        executarRitual(estado, ctx, alvo, ef, origem.acaoId, multiplicadorCuraRecebida(alvo, tick), (destino, efeito) => {
          aplicarEfeito(estado, ctx, destino, efeito, origem, mira, saida);
        }, saida);
        break;
      case 'purificar': case 'passo_sombrio': case 'muralha_pedra': case 'campo_cura': case 'campo_veneno':
        executarTatica(estado, ctx, alvo, ef, origem, mira);
        break;
      case 'cura': {
        const cura = restaurar(alvo, 'cura', ef.valor, ef.pct, tick);
        resultado(saida, tick, alvo, origem.id, ef, { cura });
        const ator = buscarEntidade(estado, origem.id);
        if (ator) fluxoRestaurador(estado, ctx, ator, alvo, cura, saida);
        break;
      }
      case 'recurso':
        resultado(saida, tick, alvo, origem.id, ef, { mana: restaurar(alvo, 'recurso', ef.valor, ef.pct, tick) });
        break;
      case 'teleporte':
        teleportar(estado, ctx, alvo, mira);
        break;
      case 'avanco':
        if (avancar(estado, ctx, alvo, mira, ef.valor)) fato(alvo, 'deslocou', undefined, origem.acaoId);
        break;
      case 'empurrao':
        // Marco 18: quem é inamovível (ressonância, grevas, escudo Último) não sai do lugar.
        if (!passivosDe(ctx, alvo).inamovivel) {
          const dx = Math.sign(alvo.x - origem.x), dy = Math.sign(alvo.y - origem.y);
          empurrar(estado, ctx, alvo, origem, ef.valor);
          if ((dx || dy) && muralhaEm(estado, alvo.x + dx, alvo.y + dy)) {
            const ator = buscarEntidade(estado, origem.id);
            if (ator) fato(ator, 'colidiu', alvo.id, origem.acaoId);
          }
        }
        break;
      case 'puxao':
        if (!passivosDe(ctx, alvo).inamovivel && puxar(estado, ctx, alvo, origem, ef.valor)) { const ator = buscarEntidade(estado, origem.id); if (ator) fato(ator, 'puxou', alvo.id, origem.acaoId); }
        break;
      case 'trocar': {
        const outro = buscarEntidade(estado, origem.id);
        if (outro && vivo(outro) && trocarLugar(alvo, outro)) fato(outro, 'trocou', undefined, origem.acaoId);
        break;
      }
      case 'dano': {
        if (imuneADano(alvo, tick)) break;
        const quem = buscarEntidade(estado, origem.id);
        const dano = sofrerDano(alvo, ef.valor, tick, (quem ? fatorDoGolpe(estado, ctx, quem, alvo) * extraGuerreiro(ctx, quem, alvo) : 1) * protecaoInicial(estado, ctx, alvo, quem));
        if (quem) pulsarAura(estado, ctx, quem, alvo, dano, saida);
        if (dano > 0) registrarParticipacao(alvo, origem.id, tick, ctx);
        resultado(saida, tick, alvo, origem.id, ef, { dano });
        break;
      }
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
  // Marco 14: acúmulo, oposições, transformação, teto e imunidade vêm das interações (acumulo.ts).
  const ativo = registrarEfeitoAtivo(ctx, alvo, ef, origem.id, tick, (vira) => {
    aplicarEfeito(estado, ctx, alvo, vira, origem, mira, saida);
  });
  if (ativo && notificar) saida.push({ t: 'efeitoAplicado', tick, alvoId: alvo.id, origemId: origem.id, tipo: ef.tipo, ateTick: ativo.ateTick });
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
          const quem = buscarEntidade(estado, f.origemId);
          const dano = sofrerDano(e, f.valor, tick, (quem ? fatorDoGolpe(estado, ctx, quem, e) * extraGuerreiro(ctx, quem, e) : 1) * protecaoInicial(estado, ctx, e, quem));
          if (quem) pulsarAura(estado, ctx, quem, e, dano, saida);
          if (dano > 0) registrarParticipacao(e, f.origemId, tick, ctx);
          resultado(saida, tick, e, f.origemId, f, { dano });
          if (e.hp <= 0) break;
        } else {
          const ganho = restaurar(e, periodico, f.valor, f.pct, tick);
          resultado(saida, tick, e, f.origemId, f, periodico === 'cura' ? { cura: ganho } : { mana: ganho });
          const ator = buscarEntidade(estado, f.origemId);
          if (periodico === 'cura' && ator) fluxoRestaurador(estado, ctx, ator, e, ganho, saida);
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
/** Marco 18: a falha no desarme dispara a armadilha em quem tentou (e a tira, se não rearma). */
export function dispararArmadilhaEm(estado: EstadoJogo, ctx: ContextoSimulacao, a: Armadilha, alvo: Entidade, saida: EventoSimulacao[]): void {
  const some = dispararArmadilha(estado, ctx, a, alvo, (x, ef, origem, mira) => { aplicarEfeito(estado, ctx, x, ef, origem, mira, saida); }, saida);
  if (some) estado.armadilhas = estado.armadilhas.filter((x) => x.id !== a.id);
}

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
