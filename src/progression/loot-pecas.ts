// O loot de armadura (marco 47, 20/11/2026, D-190). Puro.
//
// Além do drop de sempre (progression/sorteio.ts), cada abate pode largar uma peça de armadura gerada pelo mesmo sorteio
// da vitrine (progression/sorteio-pecas.ts):
// - o inimigo comum, com `chancePorAbatePct` vezes o loot do lugar (o perigo, o antifarm, a noite);
// - a GARANTIA contra azar: quem abate conta os abates sem peça e sem peça rara (na bolsa, `azarDePeca`); ao chegar ao
//   teto, a peça cai (rara ou melhor, no segundo contador). O renascido conta só a fração dele (o antifarm vale aqui);
// - o chefe solta o perfil `chefe`; o da masmorra e do covil do Mundo (`modo.chefeMaior`), o `chefeMaior`; o chefe de
//   Filo, na PRIMEIRA vitória de quem o derruba, uma peça a mais do perfil `chefeFiloPrimeira` no elemento dele;
// - o elemento da criatura (a afinidade dela ou o sotaque da dimensão de Filo) puxa a peça com `elementoDaCriaturaPct`;
// - a dificuldade mexe no peso das raridades acima de comum.
// O RNG é próprio do abate (a fase, o morto e o tick): o do combate não anda. Tudo em data/equipamento-sorteio.json.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { aleatorio, criarRng, hashTexto, type EstadoRng } from '../core/rng';
import type { Elemento } from '../combat/elementos';
import type { Entidade } from '../entities/entidade';
import type { PresetInimigo } from '../entities/presets';
import { RARIDADES } from '../modos/modo';
import { sortearPeca, nivelDaFase } from './sorteio-pecas';

/** O elemento que a peça da criatura tende a ter: a afinidade dela ou o sotaque da dimensão (null: nenhum). */
export function elementoDaCriatura(ctx: ContextoSimulacao, preset: PresetInimigo | undefined, afinidade?: Elemento): Elemento | null {
  if (afinidade) return afinidade;
  const sotaque = preset?.dimensao ? ctx.conteudo.dimensoes.get(preset.dimensao)?.sotaque : undefined;
  return sotaque && ctx.conteudo.elementos.has(sotaque as Elemento) ? (sotaque as Elemento) : null;
}

const ehRaraOuMelhor = (ctx: ContextoSimulacao, id: string): boolean =>
  RARIDADES.indexOf(ctx.conteudo.itens.get(id)?.raridade ?? 'comum') >= RARIDADES.indexOf(ctx.conteudo.sorteio.loot.garantia.raridade);

/**
 * As peças de armadura que o abate larga (ids `gi_`). `quem` é quem leva o crédito (o dono da invocação já resolvido):
 * com bolsa, conta a garantia. `lootMult` é o loot do lugar e `renascido` o fator do antifarm (0 a 1).
 */
export function pecasDoAbate(estado: EstadoJogo, ctx: ContextoSimulacao, morto: Entidade, quem: Entidade | undefined, lootMult: number, renascido: number): string[] {
  // Quem tem bolsa (o jogador derrubado na arena) não solta peça gerada.
  if (morto.bolsa) return [];
  const L = ctx.conteudo.sorteio.loot;
  const preset = ctx.conteudo.presets.get(morto.preset);
  const rng = criarRng(hashTexto(`${estado.faseId}/${morto.id}/${estado.tick}/peca`));
  const elemento = elementoDaCriatura(ctx, preset, morto.afinidade?.elemento);
  const bonusRaridadePct = L.raridadePorDificuldadePct[estado.dificuldade];
  const ids: string[] = [];
  const pedir = (perfilId: string, raridadeMin?: (typeof RARIDADES)[number], elementoPct = L.elementoDaCriaturaPct) => {
    const perfil = ctx.conteudo.sorteio.perfis.get(perfilId);
    for (let i = 0; perfil && i < perfil.quantidade; i++) {
      const id = sortearPeca(ctx, rng, { nivel: morto.nivel, perfil, ...(raridadeMin && { raridadeMin }), bonusRaridadePct, elemento, elementoPct });
      if (id) ids.push(id);
    }
  };
  const bolsa = quem?.bolsa;
  const azar = bolsa ? (bolsa.azarDePeca ?? { semPeca: 0, semRara: 0 }) : null;
  const passo = Math.min(1, Math.max(0, renascido));
  if (morto.arquetipo === 'boss') {
    pedir(ctx.modo.chefeMaior ? L.chefeMaior : L.chefe);
    // O diário conta a vitória depois das mortes (core/simulacao.ts): aqui, 0 é a primeira.
    if (preset?.dimensao && bolsa && (bolsa.vitorias?.[preset.id] ?? 0) === 0) pedir(L.chefeFiloPrimeira, undefined, 100);
  } else {
    const sorte = aleatorio(rng) * 100;
    const forcarRara = !!azar && azar.semRara + passo >= L.garantia.abatesSemRara;
    const forcarPeca = !!azar && azar.semPeca + passo >= L.garantia.abatesSemPeca;
    if (forcarRara || forcarPeca || sorte < L.chancePorAbatePct * lootMult) pedir(L.perfilComum, forcarRara ? L.garantia.raridade : undefined);
  }
  if (bolsa && azar) {
    bolsa.azarDePeca = {
      semPeca: ids.length > 0 ? 0 : azar.semPeca + passo,
      semRara: ids.some((id) => ehRaraOuMelhor(ctx, id)) ? 0 : azar.semRara + passo,
    };
  }
  return ids;
}

/** A peça do baú (null na maior parte das vezes): o perfil `bau`, no nível da fase, pelo RNG do baú. */
export function pecaDoBau(ctx: ContextoSimulacao, rng: EstadoRng): string | null {
  const b = ctx.conteudo.sorteio.loot.bau;
  const perfil = ctx.conteudo.sorteio.perfis.get(b.perfil);
  if (!perfil || aleatorio(rng) * 100 >= b.chancePct) return null;
  return sortearPeca(ctx, rng, { nivel: nivelDaFase(ctx), perfil });
}

/** O que o monstruário mostra do loot de armadura de uma criatura (números de data/equipamento-sorteio.json). */
export interface LootDaCriatura {
  /** % de peça por abate (o inimigo comum; 100 no chefe). */
  pecaPct: number;
  /** Quantas peças o chefe solta (0 no comum). */
  pecasDoChefe: number;
  /** O elemento puxado e a chance dele. */
  elemento: Elemento | null;
  elementoPct: number;
  /** O chefe de Filo: a peça a mais na primeira vitória. */
  primeiraVitoria: boolean;
  /** A garantia: abates sem peça e sem rara. */
  garantia: { semPeca: number; semRara: number };
}

export function lootDaCriatura(ctx: ContextoSimulacao, preset: PresetInimigo): LootDaCriatura {
  const L = ctx.conteudo.sorteio.loot;
  const chefe = preset.arquetipo === 'boss';
  const perfilChefe = ctx.conteudo.sorteio.perfis.get(ctx.modo.chefeMaior ? L.chefeMaior : L.chefe);
  return {
    pecaPct: chefe ? 100 : L.chancePorAbatePct * ((ctx.modo.lootPct ?? 100) / 100),
    pecasDoChefe: chefe ? (perfilChefe?.quantidade ?? 0) : 0,
    elemento: elementoDaCriatura(ctx, preset),
    elementoPct: L.elementoDaCriaturaPct,
    primeiraVitoria: chefe && !!preset.dimensao,
    garantia: { semPeca: L.garantia.abatesSemPeca, semRara: L.garantia.abatesSemRara },
  };
}
