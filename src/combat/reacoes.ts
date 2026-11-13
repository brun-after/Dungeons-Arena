// Marco 40 (13/11/2026, D-162): o que as reações elementais fazem depois do golpe que acertou. A matriz de 36 pares
// das 9 pontas (o Físico incluído) vive em interacoes.json; aqui o estado consumido sai, o `aplicar` cai no alvo e,
// com `raio`, nos hostis em volta (só os que têm `soComEstado`, os `maxOutros` mais perto), os `aliados` recebem o
// que é deles, quem bate se cura (`curarFonte`, `roubarPct`) e o estado periódico fere de novo na hora (`ticar`). A
// mesma reação só volta a disparar no mesmo alvo depois de `balance.efeitos.reacaoIntervaloMs`.
// Antes em combat/golpe.ts (marcos 14 e 18).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { aplicarEfeito } from './efeitos';
import type { Sinergia } from './elementos';
import { ticksDe } from '../core/tempo';
import { chebyshev } from './geometria';
import { construirEfeito, type EfeitoCanonico } from './registro-efeitos';

type Origem = Parameters<typeof aplicarEfeito>[4];

export interface GolpeReagido {
  alvo: Entidade;
  conjurador: Entidade | null | undefined;
  /** Quem bate (para a relação), com a potência que reforça o que a reação aplica. */
  fonte: Parameters<typeof podeFerir>[0] & { potencia: number };
  origem: Origem;
  /** O dano que o golpe causou de fato (sem o excesso letal). */
  danoEfetivo: number;
  comPotencia: (ef: EfeitoCanonico, potencia: number) => EfeitoCanonico;
}

/** Os hostis em volta do alvo que a reação alcança, do mais perto ao mais longe. */
function emVolta(estado: EstadoJogo, ctx: ContextoSimulacao, g: GolpeReagido, s: Sinergia, tick: number): Entidade[] {
  const perto = estado.entidades
    .filter((o) => o !== g.alvo && vivo(o) && chebyshev(o, g.alvo) <= s.raio && podeFerir(g.fonte, o, ctx.modo))
    .filter((o) => !s.soComEstado || o.efeitos.some((f) => f.tipo === s.soComEstado && f.ateTick > tick))
    .sort((a, b) => chebyshev(a, g.alvo) - chebyshev(b, g.alvo) || (a.id < b.id ? -1 : 1));
  return s.maxOutros > 0 ? perto.slice(0, s.maxOutros) : perto;
}

export function reagir(estado: EstadoJogo, ctx: ContextoSimulacao, g: GolpeReagido, sinergias: readonly Sinergia[], saida: EventoSimulacao[]): void {
  if (sinergias.length === 0) return;
  const tick = estado.tick;
  const { alvo, conjurador, origem } = g;
  const potencia = g.fonte.potencia;
  // O tique a mais do estado periódico, lido antes que a reação o consuma.
  const tiques = sinergias.flatMap((s) => (s.ticar ? alvo.efeitos.filter((f) => f.tipo === s.ticar && f.ateTick > tick).map((f) => f.valor) : []));
  const espera = tick + ticksDe(ctx.balance.efeitos.reacaoIntervaloMs);
  for (const s of sinergias) {
    (alvo.reacoesAte ??= {})[s.id] = espera;
    alvo.efeitos = alvo.efeitos.filter((f) => !s.remove.includes(f.tipo));
    if (!s.soVizinhos) for (const ef of s.aplicar) aplicarEfeito(estado, ctx, alvo, g.comPotencia(ef, potencia), origem, { x: alvo.x, y: alvo.y }, saida);
  }
  for (const valor of tiques) aplicarEfeito(estado, ctx, alvo, construirEfeito('dano_direto', { valor }), origem, null, saida);
  for (const s of sinergias) {
    if (s.raio > 0 && !s.soAliados) {
      for (const outro of emVolta(estado, ctx, g, s, tick)) {
        if (s.soComEstado) outro.efeitos = outro.efeitos.filter((f) => !s.remove.includes(f.tipo));
        for (const ef of s.aplicar) aplicarEfeito(estado, ctx, outro, g.comPotencia(ef, potencia), origem, { x: outro.x, y: outro.y }, saida);
      }
    }
    if (s.aliados.length > 0 && conjurador) {
      const raio = Math.max(1, s.raio);
      const aliados = estado.entidades.filter((o) => vivo(o) && (o === conjurador || (chebyshev(o, alvo) <= raio && podeAjudar(conjurador, o, ctx.modo))));
      for (const a of aliados) for (const ef of s.aliados) aplicarEfeito(estado, ctx, a, g.comPotencia(ef, potencia), origem, { x: a.x, y: a.y }, saida);
    }
    if (conjurador && vivo(conjurador)) {
      const cura = s.curarFonte * potencia + (g.danoEfetivo * s.roubarPct) / 100;
      if (cura >= 1) aplicarEfeito(estado, ctx, conjurador, construirEfeito('cura', { valor: Math.round(cura) }), origem, null, saida);
    }
  }
}
