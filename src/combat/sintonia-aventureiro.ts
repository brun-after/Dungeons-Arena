// A sintonia do Aventureiro (marco 24, 24/10/2026, D-095): a família das gerais de tecla muda o falcão e as skills dele;
// as vertentes Druida, Rapina e Tempestuoso somam as suas. Cada função é o ponto de entrada de um tipo do vocabulário
// (progression/sintonia-efeitos.ts); os números vêm de data/sintonia.json.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { efeitoDeSintonia, efeitosDeSintonia, somaDeSintonia } from '../progression/sintonia';
import type { EfeitoSintonia } from '../progression/sintonia-efeitos';
import { definicaoDe } from './compilar-habilidade';
import type { FonteDeDano } from './dano';
import { aplicarEfeito, REGISTRO_EFEITOS, type OrigemDoEfeito } from './efeitos';
import { causarDano } from './efeitos-fluxo';
import { celulaOcupada, chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { construirEfeito, type EfeitoCanonico } from './registro-efeitos';

const origemDe = (e: Entidade): OrigemDoEfeito => ({ id: e.id, x: e.x, y: e.y });
const temFalcao = (e: Entidade): boolean => (e.bolsa?.classeId ?? e.classeId ?? '') === 'aventureiro' && !e.invocacao;

/** A entrada vale para esta habilidade? Por família da geral, por id, ou `magico` (toda geral mágica). */
function valeParaHabilidade(ctx: ContextoSimulacao, ef: EfeitoSintonia, hab: Habilidade): boolean {
  const familia = definicaoDe(ctx, hab.id)?.familiaGeral;
  if (ef.familia) return familia === ef.familia;
  if (ef.habilidade === 'magico') return !!familia && hab.tipoAtaque === 'magico';
  return ef.habilidade === hab.id;
}

/** Uma vez a cada `ms` por entrada (0 = sem espera); marca em `sintoniaVistos`. */
function pronta(e: Entidade, chave: string, ms: number, tick: number): boolean {
  if (ms <= 0) return true;
  const vistos = e.sintoniaVistos ??= {};
  if (tick - (vistos[chave] ?? -Infinity) < ticksDe(ms)) return false;
  vistos[chave] = tick;
  return true;
}

/**
 * O acerto de quem tem falcão: técnica, arcana, Rapina e Tempestuoso (o falcão golpeia junto, com parte do dano);
 * fogo, veneno, terra e psíquico (as skills do falcão aplicam estados, também em volta); sagrado (o Retorno ao punho cura
 * os aliados perto).
 */
export function aoAcertarComFalcao(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, alvo: Entidade, hab: Habilidade, dano: number, cura: number, saida: EventoSimulacao[]): void {
  if (!temFalcao(dono)) return;
  const tick = estado.tick;
  if (dono !== alvo && podeFerir(dono, alvo, ctx.modo)) {
    if (dano > 0) efeitosDeSintonia(ctx, dono, 'falcaoGolpeiaComGeral', tick).forEach((ef, i) => {
      if (!valeParaHabilidade(ctx, ef, hab) || !pronta(dono, `falcao:${i}`, ef.ms, tick)) return;
      const extra = Math.round(dano * ef.pct / 100);
      if (extra > 0) causarDano(estado, ctx, alvo, extra, dono.id, 'armadilha', saida);
      if (ef.efeito) aplicarEfeito(estado, ctx, alvo, ef.efeito, origemDe(dono), null, saida);
    });
    // Os estados das skills do falcão valem também nas que não ferem (o Grito).
    for (const ef of efeitosDeSintonia(ctx, dono, 'habilidadeAplica', tick)) {
      if (!ef.efeito || ef.habilidade !== hab.id) continue;
      const centro = celulaOcupada(alvo);
      for (const e of estado.entidades) {
        if (e !== alvo && (ef.raio <= 0 || !vivo(e) || !podeFerir(dono, e, ctx.modo) || chebyshev(centro, celulaOcupada(e)) > ef.raio)) continue;
        aplicarEfeito(estado, ctx, e, ef.efeito, origemDe(dono), { x: e.x, y: e.y }, saida);
      }
    }
  }
  if (cura <= 0) return;
  for (const ef of efeitosDeSintonia(ctx, dono, 'habilidadeCuraAliados', tick)) {
    if (ef.habilidade !== hab.id) continue;
    const valor = Math.round(cura * ef.pct / 100);
    for (const e of estado.entidades) {
      if (e === dono || e === alvo || !vivo(e) || e.invocacao || !podeAjudar(dono, e, ctx.modo) || chebyshev(celulaOcupada(e), celulaOcupada(dono)) > ef.raio) continue;
      aplicarEfeito(estado, ctx, e, construirEfeito('cura', { valor }), origemDe(dono), null, saida);
    }
  }
}

/** Sombra: o primeiro golpe de uma skill do falcão depois de um tempo sem golpear é crítico (d20 mínimo). */
export function criticoDoFalcao(ctx: ContextoSimulacao, atacante: Entidade | undefined, hab: Habilidade, fonte: FonteDeDano, tick: number): FonteDeDano {
  if (!atacante || !temFalcao(atacante) || !hab.tags.includes('falcao') || hab.formulaDano === null) return fonte;
  const ef = efeitoDeSintonia(ctx, atacante, 'falcaoCritico', tick);
  if (!ef) return fonte;
  const vistos = atacante.sintoniaVistos ??= {};
  const ultimo = vistos['falcao:golpe'] ?? -Infinity;
  vistos['falcao:golpe'] = tick;
  return tick - ultimo >= ticksDe(ef.ms) ? { ...fonte, d20Minimo: Math.max(fonte.d20Minimo ?? 0, ef.valor) } : fonte;
}

/** Suporte: os escudos que o Aventureiro recebe rendem mais (o falcão divide a proteção). */
export function escudoComFalcao(ctx: ContextoSimulacao, alvo: Entidade, ef: EfeitoCanonico, tick: number): EfeitoCanonico {
  if (!temFalcao(alvo) || !REGISTRO_EFEITOS[ef.tipo].escudo) return ef;
  const pct = somaDeSintonia(ctx, alvo, 'escudoNoFalcao', 'pct', tick);
  return pct > 0 ? { ...ef, valor: Math.round(ef.valor * (1 + pct / 100)) } : ef;
}

/** Druida: o falcão guardião absorve um golpe a cada `ms` (devolve se absorveu). */
export function falcaoGuardiaoAbsorve(ctx: ContextoSimulacao, alvo: Entidade, atacante: Entidade | undefined, hab: Habilidade, tick: number): boolean {
  if (!atacante || atacante === alvo || hab.formulaDano === null || !temFalcao(alvo) || !podeFerir(atacante, alvo, ctx.modo)) return false;
  const ef = efeitoDeSintonia(ctx, alvo, 'falcaoGuardiao', tick);
  return !!ef && pronta(alvo, 'guardiao', ef.ms, tick);
}

/** Druida: o falcão fica ao lado do dono. */
export function falcaoDeGuarda(ctx: ContextoSimulacao, dono: Entidade, tick: number): boolean {
  return efeitoDeSintonia(ctx, dono, 'falcaoGuardiao', tick) !== null;
}
