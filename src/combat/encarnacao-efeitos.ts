// O efeito das encarnações novas do Mago e das encarnações duplas (marco 24, 24/10/2026, D-095). Terra, veneno, trevas e
// luz (abertas pela sintonia) e as 21 fusões vêm de data/sintonia.json (mecanicas.encarnacoes e encarnacoesDuplas), no
// vocabulário de progression/sintonia-efeitos.ts; fogo, gelo e raio seguem a regra de combat/encarnacao.ts. Cada função
// é o ponto de entrada de um tipo: as magias que acertam, o chão, o pulso por segundo, o abate e as curas herdadas.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { efeitoDeSintonia, efeitosDeSintonia } from '../progression/sintonia';
import type { EfeitoSintonia, TipoSintonia } from '../progression/sintonia-efeitos';
import { definicaoDe } from './compilar-habilidade';
import { aplicarEfeito, REGISTRO_EFEITOS, type OrigemDoEfeito } from './efeitos';
import { duplaDe, ehMago, elementoDaMagia, encarnacaoDe } from './encarnacao';
import { celulaOcupada, chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { construirEfeito } from './registro-efeitos';

const origemDe = (e: Entidade): OrigemDoEfeito => ({ id: e.id, x: e.x, y: e.y });
const ativo = (e: Entidade, tipo: string | null, tick: number): boolean => !!tipo && e.efeitos.some((f) => f.tipo === tipo && f.ateTick > tick);

/**
 * Os efeitos do tipo que valem para o Mago agora: os da encarnação, os da dupla e os da sintonia e das vertentes (os
 * destes que citam uma dupla em `habilidade` só valem com ela).
 */
export function efeitosDoMago(ctx: ContextoSimulacao, e: Entidade, t: TipoSintonia, tick: number): EfeitoSintonia[] {
  if (!ehMago(e)) return [];
  const regras = ctx.conteudo.sintonia;
  const el = encarnacaoDe(e);
  const dupla = duplaDe(e, tick);
  const daDupla = dupla ? regras.encarnacoesDuplas.find((d) => d.id === dupla)?.efeitos ?? [] : [];
  const duplas = new Set(regras.encarnacoesDuplas.map((d) => d.id));
  const daSintonia = efeitosDeSintonia(ctx, e, t, tick).filter((ef) => !ef.habilidade || !duplas.has(ef.habilidade) || ef.habilidade === dupla);
  return [...(el ? regras.efeitosDaEncarnacao[el] ?? [] : []), ...daDupla, ...daSintonia].filter((ef) => ef.t === t);
}

/** A entrada vale para esta magia (o elemento, quando pedido, conta o da Seta e da Agulha no Arquimago)? */
function valeParaMagia(ctx: ContextoSimulacao, e: Entidade, ef: EfeitoSintonia, hab: Habilidade, tick: number): boolean {
  return !ef.elemento || elementoDaMagia(ctx, e, hab, tick) === ef.elemento;
}

/** Uma vez a cada `ms` por chave (0 = sem espera). */
function pronta(e: Entidade, chave: string, ms: number, tick: number): boolean {
  if (ms <= 0) return true;
  const vistos = e.sintoniaVistos ??= {};
  if (tick - (vistos[chave] ?? -Infinity) < ticksDe(ms)) return false;
  vistos[chave] = tick;
  return true;
}

/** Supercondução: o multiplicador do dano da magia contra quem está com o estado. */
export function multiplicadorDaEncarnacao(ctx: ContextoSimulacao, mago: Entidade | undefined, alvo: Entidade, hab: Habilidade, tick: number): number {
  if (!mago || hab.tipoAtaque !== 'magico') return 1;
  let mult = 1;
  for (const ef of efeitosDoMago(ctx, mago, 'danoContraEstado', tick)) if (valeParaMagia(ctx, mago, ef, hab, tick) && ativo(alvo, ef.estado, tick)) mult *= 1 + ef.pct / 100;
  return mult;
}

/**
 * A magia do Mago que acertou: estados nos hostis (magiaAplica), escudos e curas nos aliados perto (magiaAliados), o
 * chão (magiaChao), o puxão dos eletrizados (magiaPuxa) e o roubo de vida; a cura ou o escudo geral herda a encarnação
 * com a sintonia do suporte.
 */
export function aoAcertarMagia(estado: EstadoJogo, ctx: ContextoSimulacao, mago: Entidade, alvo: Entidade, hab: Habilidade, dano: number, cura: number, primeiro: boolean, saida: EventoSimulacao[]): void {
  if (!ehMago(mago) || !vivo(mago)) return;
  const tick = estado.tick;
  if (hab.tipoAtaque === 'magico' && mago !== alvo && podeFerir(mago, alvo, ctx.modo)) {
    efeitosDoMago(ctx, mago, 'magiaAplica', tick).forEach((ef, i) => {
      if (!ef.efeito || !valeParaMagia(ctx, mago, ef, hab, tick) || (ef.estado && !ativo(alvo, ef.estado, tick))) return;
      if (!pronta(mago, `magia:${i}:${alvo.id}`, ef.ms, tick)) return;
      aplicarEfeito(estado, ctx, alvo, ef.efeito, origemDe(mago), { x: alvo.x, y: alvo.y }, saida);
    });
    if (dano > 0) {
      const roubo = efeitosDoMago(ctx, mago, 'rouboDeVida', tick).filter((ef) => valeParaMagia(ctx, mago, ef, hab, tick)).reduce((s, ef) => s + ef.pct, 0);
      const vida = Math.round(dano * roubo / 100);
      if (vida > 0) aplicarEfeito(estado, ctx, mago, construirEfeito('cura', { valor: vida }), origemDe(mago), null, saida);
    }
    if (primeiro) magiaNoChaoEAliados(estado, ctx, mago, alvo, hab, saida);
  }
  if (cura > 0 || hab.efeitos.some((ef) => REGISTRO_EFEITOS[ef.tipo].escudo)) herdarEncarnacao(estado, ctx, mago, alvo, hab, saida);
}

/** Uma vez por magia (no primeiro atingido): o chão, os aliados e o puxão. */
function magiaNoChaoEAliados(estado: EstadoJogo, ctx: ContextoSimulacao, mago: Entidade, alvo: Entidade, hab: Habilidade, saida: EventoSimulacao[]): void {
  const tick = estado.tick;
  const c = celulaOcupada(alvo);
  for (const ef of efeitosDoMago(ctx, mago, 'magiaChao', tick)) {
    if (!valeParaMagia(ctx, mago, ef, hab, tick)) continue;
    const tipo = ef.efeito ? 'rastro_efeito' : 'rastro_dano';
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = c.x + dx, y = c.y + dy;
      if (estado.rastros.some((r) => r.x === x && r.y === y && r.donoId === mago.id && r.tipo === tipo)) continue;
      estado.rastros.push({ x, y, donoId: mago.id, equipeDono: mago.equipe, tipo, valor: ef.valor, interno: ef.efeito, ateTick: tick + ticksDe(ef.ms), atingidos: [] });
    }
  }
  for (const ef of efeitosDoMago(ctx, mago, 'magiaAliados', tick)) {
    if (!ef.efeito || !valeParaMagia(ctx, mago, ef, hab, tick)) continue;
    for (const a of estado.entidades) {
      if (!vivo(a) || a.invocacao || (a !== mago && !podeAjudar(mago, a, ctx.modo)) || chebyshev(celulaOcupada(a), celulaOcupada(mago)) > ef.raio) continue;
      aplicarEfeito(estado, ctx, a, ef.efeito, origemDe(mago), null, saida);
    }
  }
  for (const ef of efeitosDoMago(ctx, mago, 'magiaPuxa', tick)) {
    const origem = { id: mago.id, x: c.x, y: c.y };
    for (const e of estado.entidades) {
      if (e === alvo || !vivo(e) || !podeFerir(mago, e, ctx.modo) || !ativo(e, ef.estado, tick) || chebyshev(c, celulaOcupada(e)) > ef.raio) continue;
      aplicarEfeito(estado, ctx, e, construirEfeito('puxao', { valor: ef.valor }), origem, c, saida);
    }
  }
}

/** Sintonia do suporte: a cura ou o escudo geral leva a encarnação (no curado, ou nos hostis em volta dele). */
function herdarEncarnacao(estado: EstadoJogo, ctx: ContextoSimulacao, mago: Entidade, alvo: Entidade, hab: Habilidade, saida: EventoSimulacao[]): void {
  const tick = estado.tick;
  if (!definicaoDe(ctx, hab.id)?.familiaGeral || !efeitoDeSintonia(ctx, mago, 'suporteHerdaEncarnacao', tick)) return;
  if (mago !== alvo && !podeAjudar(mago, alvo, ctx.modo)) return;
  for (const ef of efeitosDoMago(ctx, mago, 'herancaSuporte', tick)) {
    if (!ef.efeito) continue;
    if (ef.raio <= 0) {
      aplicarEfeito(estado, ctx, alvo, ef.efeito, origemDe(mago), null, saida);
      continue;
    }
    for (const e of estado.entidades) {
      if (!vivo(e) || !podeFerir(mago, e, ctx.modo) || chebyshev(celulaOcupada(e), celulaOcupada(alvo)) > ef.raio) continue;
      aplicarEfeito(estado, ctx, e, ef.efeito, origemDe(mago), null, saida);
    }
  }
}

/** Terra: o raio a mais das magias de área. */
export function raioAreaDaEncarnacao(ctx: ContextoSimulacao, mago: Entidade, hab: Habilidade, tick: number): Habilidade {
  if (hab.tipoAtaque !== 'magico' || hab.politicaImpacto !== 'area' || hab.raioArea <= 0) return hab;
  const extra = efeitosDoMago(ctx, mago, 'raioArea', tick).reduce((s, ef) => s + ef.valor, 0);
  return extra > 0 ? { ...hab, raioArea: hab.raioArea + extra } : hab;
}

/** Terra: o Mago encarnado não sofre empurrão nem puxão. */
export function magoInamovivel(ctx: ContextoSimulacao, e: Entidade, tick: number): boolean {
  return efeitosDoMago(ctx, e, 'inamovivel', tick).length > 0;
}

/** O pulso por segundo da encarnação: veneno em quem chega perto e a vida dos aliados perto (luz). */
export function pulsarEncarnacao(estado: EstadoJogo, ctx: ContextoSimulacao, mago: Entidade, saida: EventoSimulacao[]): void {
  const tick = estado.tick;
  const centro = celulaOcupada(mago);
  for (const ef of efeitosDoMago(ctx, mago, 'auraAplica', tick)) {
    if (!ef.efeito) continue;
    for (const e of estado.entidades) {
      if (!vivo(e) || e === mago || !podeFerir(mago, e, ctx.modo) || chebyshev(centro, celulaOcupada(e)) > ef.raio) continue;
      aplicarEfeito(estado, ctx, e, ef.efeito, origemDe(mago), null, saida);
    }
  }
  for (const ef of efeitosDoMago(ctx, mago, 'auraAliados', tick)) {
    if (!ef.efeito) continue;
    for (const a of estado.entidades) {
      if (!vivo(a) || a === mago || a.invocacao || !podeAjudar(mago, a, ctx.modo) || chebyshev(centro, celulaOcupada(a)) > ef.raio) continue;
      aplicarEfeito(estado, ctx, a, ef.efeito, origemDe(mago), null, saida);
    }
  }
}

/**
 * Quem o Mago derrubou (Túmulo, Pestilência, Inverno sombrio, Miasma ardente): com `efeito`, ele cai nos vizinhos (se o
 * morto tinha `estado`, quando pedido); sem `efeito`, o `estado` do morto passa aos vizinhos.
 */
export function aoAbaterComEncarnacao(estado: EstadoJogo, ctx: ContextoSimulacao, mago: Entidade | undefined, morto: Entidade, saida: EventoSimulacao[]): void {
  if (!mago || !ehMago(mago)) return;
  const tick = estado.tick;
  const c = celulaOcupada(morto);
  for (const ef of efeitosDoMago(ctx, mago, 'aoAbaterAplica', tick)) {
    const doMorto = ef.estado ? morto.efeitos.find((f) => f.tipo === ef.estado && f.ateTick > tick) : undefined;
    if (ef.estado && !doMorto) continue;
    const aplicar = ef.efeito ?? (doMorto ? construirEfeito(doMorto.tipo, { valor: doMorto.valor, pct: doMorto.pct, duracaoMs: Math.round((doMorto.ateTick - tick) * 1000 / ticksDe(1000)) }) : null);
    if (!aplicar) continue;
    for (const e of estado.entidades) {
      if (e === morto || !vivo(e) || !podeFerir(mago, e, ctx.modo) || chebyshev(c, celulaOcupada(e)) > ef.raio) continue;
      aplicarEfeito(estado, ctx, e, aplicar, origemDe(mago), null, saida);
    }
  }
}

/** Sintonia arcana: acertos a mais por Dardo na concentração arcana. */
export function concentracaoExtra(ctx: ContextoSimulacao, mago: Entidade, tick: number): number {
  return efeitosDoMago(ctx, mago, 'dardoConcentra', tick).reduce((s, ef) => s + ef.valor, 0);
}
