// A sintonia do Guerreiro (marco 24, 24/10/2026, D-095): a família das gerais de tecla muda a fúria, a aura e o
// Frenesi; as vertentes Paladino, Berserker e Carcereiro somam as suas. Cada função aqui é o ponto de entrada de um tipo
// do vocabulário (progression/sintonia-efeitos.ts); os números vêm de data/sintonia.json.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { efeitoDeSintonia, efeitosDeSintonia, somaDeSintonia } from '../progression/sintonia';
import { definicaoDe } from './compilar-habilidade';
import { aplicarEfeito, multiplicadorCuraRecebida, type OrigemDoEfeito } from './efeitos';
import { emFrenesi } from './furia';
import { celulaOcupada, chebyshev } from './geometria';
import type { Habilidade } from './habilidades';

const familiaDaGeral = (ctx: ContextoSimulacao, hab: Habilidade): string | null => definicaoDe(ctx, hab.id)?.familiaGeral ?? null;
const ativo = (e: Entidade, tipo: string, tick: number): boolean => e.efeitos.some((f) => f.tipo === tipo && f.ateTick > tick);

/** Técnica: a geral da família que fere enche a fúria (quanto; 0 = não enche). */
export function furiaDaGeral(ctx: ContextoSimulacao, conjurador: Entidade, hab: Habilidade, tick: number): number {
  const familia = familiaDaGeral(ctx, hab);
  if (!familia) return 0;
  return efeitosDeSintonia(ctx, conjurador, 'furiaPorGeral', tick).filter((ef) => ef.familia === familia).reduce((s, ef) => s + ef.valor, 0);
}

/** Suporte: no Frenesi, as curas e os escudos das gerais que você lança rendem mais (multiplicador). */
export function reforcoDaGeral(ctx: ContextoSimulacao, conjurador: Entidade | undefined, hab: Habilidade, tick: number): number {
  if (!conjurador || !familiaDaGeral(ctx, hab)) return 1;
  return 1 + somaDeSintonia(ctx, conjurador, 'curaGeralNoFrenesi', 'pct', tick) / 100;
}

/** Arcana: células a mais no raio da aura. */
export function raioExtraDaAura(ctx: ContextoSimulacao, ator: Entidade, tick: number): number {
  return somaDeSintonia(ctx, ator, 'auraRaio', 'valor', tick);
}

/** Fogo, psíquico e Berserker: o pulso da aura aplica estes efeitos em quem atinge. */
export function efeitosDoPulso(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, atingidos: readonly Entidade[], saida: EventoSimulacao[]): void {
  const lista = efeitosDeSintonia(ctx, ator, 'auraAplica', estado.tick);
  if (lista.length === 0) return;
  const origem: OrigemDoEfeito = { id: ator.id, x: ator.x, y: ator.y };
  for (const e of atingidos) for (const ef of lista) if (ef.efeito) aplicarEfeito(estado, ctx, e, ef.efeito, origem, { x: e.x, y: e.y }, saida);
}

/** Sagrado e Paladino: a cura da aura também alcança os aliados perto (a maior % entre as entradas). */
export function curarAliadosDaAura(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, curaDaAura: number, saida: EventoSimulacao[]): void {
  if (curaDaAura <= 0) return;
  const lista = efeitosDeSintonia(ctx, ator, 'auraCuraAliados', estado.tick);
  if (lista.length === 0) return;
  const pct = Math.max(...lista.map((ef) => ef.pct));
  const raio = Math.max(...lista.map((ef) => ef.raio));
  for (const e of estado.entidades) {
    if (e === ator || !vivo(e) || e.invocacao || !podeAjudar(ator, e, ctx.modo) || chebyshev(celulaOcupada(e), celulaOcupada(ator)) > raio) continue;
    const cura = Math.min(e.hpMax - e.hp, Math.round(curaDaAura * pct / 100 * multiplicadorCuraRecebida(e, estado.tick)));
    if (cura <= 0) continue;
    e.hp += cura;
    saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: e.id, origemId: ator.id, tipo: 'cura', dano: 0, cura, mana: 0 });
  }
}

/** Berserker: no Frenesi, cada hostil com o estado perto (no pulso da aura) prolonga o Frenesi, até o teto. */
export function prolongarFrenesi(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, atingidos: readonly Entidade[]): void {
  const f = ator.furia;
  if (!f?.frenesiAteTick || !emFrenesi(ator, estado.tick)) return;
  for (const ef of efeitosDeSintonia(ctx, ator, 'frenesiPorEstadoPerto', estado.tick)) {
    const n = ef.estado ? atingidos.filter((e) => ativo(e, ef.estado ?? '', estado.tick)).length : 0;
    const resta = ticksDe(ef.valor) - (f.frenesiExtraTicks ?? 0);
    const mais = Math.min(resta, n * ticksDe(ef.ms));
    if (mais <= 0) continue;
    f.frenesiAteTick += mais;
    f.frenesiExtraTicks = (f.frenesiExtraTicks ?? 0) + mais;
    for (const x of ator.efeitos) if (x.tipo === 'frenesi') x.ateTick += mais;
  }
}

/** Veneno: quantos hostis contam para a resistência contra grupos (os com o estado contam `n`). */
export function pesoDoHostil(ctx: ContextoSimulacao, guerreiro: Entidade, hostil: Entidade, tick: number): number {
  let peso = 1;
  for (const ef of efeitosDeSintonia(ctx, guerreiro, 'grupoContaEstado', tick)) if (ef.estado && ativo(hostil, ef.estado, tick)) peso = Math.max(peso, ef.n);
  return peso;
}

/** Terra: no Frenesi, você não sofre empurrão nem puxão. */
export function inamovivelPelaSintonia(ctx: ContextoSimulacao, e: Entidade, tick: number): boolean {
  return efeitoDeSintonia(ctx, e, 'inamovivel', tick) !== null;
}

/** Sombra: encher a fúria deixa o próximo golpe como pelas costas. */
export function armarCostas(ctx: ContextoSimulacao, e: Entidade, tick: number): void {
  if (efeitoDeSintonia(ctx, e, 'costasAoEncherFuria', tick)) e.costasGarantidas = true;
}

/** O golpe de dano gasta as costas armadas (devolve se havia). */
export function gastarCostas(atacante: Entidade | undefined, alvo: Entidade, hab: Habilidade, ctx: ContextoSimulacao): boolean {
  if (!atacante?.costasGarantidas || atacante === alvo || hab.formulaDano === null || !podeFerir(atacante, alvo, ctx.modo)) return false;
  delete atacante.costasGarantidas;
  return true;
}

/** Carcereiro: o desafiado por você que chega a `raio` células fica enraizado, uma vez por desafio. */
export function processarCarcereiros(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const tick = estado.tick;
  for (const g of estado.entidades) {
    if (!g.bolsa || !vivo(g)) continue;
    const ef = efeitoDeSintonia(ctx, g, 'desafiadoEnraiza', tick);
    const preso = ef?.efeito;
    if (!ef || !preso) continue;
    const vistos = g.sintoniaVistos ?? {};
    for (const e of estado.entidades) {
      if (!vivo(e) || !podeFerir(g, e, ctx.modo) || chebyshev(celulaOcupada(e), celulaOcupada(g)) > ef.raio) continue;
      const desafio = e.efeitos.find((f) => f.tipo === 'desafiado' && f.origemId === g.id && f.ateTick > tick);
      const chave = `${e.id}/${e.geracao}`;
      if (!desafio || vistos[chave] === desafio.inicioTick) continue;
      vistos[chave] = desafio.inicioTick;
      aplicarEfeito(estado, ctx, e, preso, { id: g.id, x: g.x, y: g.y }, { x: e.x, y: e.y }, saida);
    }
    g.sintoniaVistos = Object.fromEntries(Object.entries(vistos).filter(([k]) => estado.entidades.some((e) => `${e.id}/${e.geracao}` === k && vivo(e))));
  }
}
