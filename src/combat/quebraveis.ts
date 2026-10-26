// Quebráveis (marco 26, 26/10/2026, D-113). Os enfeites que fazem sentido quebrar (barril, caixote, vaso, cristal…)
// viram objetos da fase nos modos com objetos (campanha e grupo). Não bloqueiam a passagem; quebram com o golpe do
// lado do jogador que cai na célula (o básico mirado no objeto, a área de uma habilidade ou um projétil) e soltam
// nada, de 1 a 3 de ouro, um orbe de vida, de recurso ou de efeito. O saque sai de um sorteio próprio, semeado pela
// fase e pelo objeto: não gasta o RNG do estado, então as metas do balanceamento não se mexem.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio, criarRng, hashTexto, inteiro } from '../core/rng';
import type { Entidade } from '../entities/entidade';
import { ladoDoJogador } from '../modos/dificuldade';
import { sortearEfeitoDeOrbe } from './registro-efeitos';
import { largarObjeto, largarOrbeEfeito, largarOuro, largarPerto } from '../world/objetos';

export type SaqueQuebravel = 'nada' | 'ouro' | 'orbe_hp' | 'orbe_recurso' | 'orbe_efeito';

/** O quebrável na célula, se houver. */
export function quebravelEm(estado: EstadoJogo, x: number, y: number): ObjetoNoMundo | undefined {
  return estado.objetos.find((o) => o.tipo === 'quebravel' && o.x === x && o.y === y);
}

/** Só o lado do jogador quebra (os monstros passam sem quebrar nada). */
export function quebraQuem(estado: EstadoJogo, ator: Pick<Entidade, 'equipe'> | undefined): boolean {
  return !!ator && ladoDoJogador(estado, ator);
}

/** O que o objeto guarda (pura e determinística: a fase e o id decidem). */
export function saqueDe(ctx: ContextoSimulacao, faseId: string, objetoId: string): { tipo: SaqueQuebravel; ouro: number } {
  const q = ctx.balance.quebraveis;
  const rng = criarRng(hashTexto(`${faseId}/${objetoId}/quebra`));
  const pesos = Object.entries(q.saque) as [SaqueQuebravel, number][];
  const total = pesos.reduce((s, [, p]) => s + p, 0);
  let sorteio = aleatorio(rng) * total;
  let tipo: SaqueQuebravel = 'nada';
  for (const [t, p] of pesos) {
    if (sorteio < p) {
      tipo = t;
      break;
    }
    sorteio -= p;
  }
  return { tipo, ouro: tipo === 'ouro' ? inteiro(rng, q.ouroMin, q.ouroMax) : 0 };
}

/** Quebra o que houver nas células (o golpe de `ator`). Devolve quantos quebrou. */
export function quebrarEm(estado: EstadoJogo, ctx: ContextoSimulacao, celulas: readonly Celula[], ator: Entidade, saida: EventoSimulacao[]): number {
  if (!quebraQuem(estado, ator) || !estado.objetos.some((o) => o.tipo === 'quebravel')) return 0;
  let n = 0;
  for (const c of celulas) {
    const o = quebravelEm(estado, c.x, c.y);
    if (!o) continue;
    quebrar(estado, ctx, o, ator.id, saida);
    n++;
  }
  return n;
}

/** Tira o objeto do mundo, avisa e solta o saque na célula (ou numa vizinha, se ela já tiver outro objeto). */
export function quebrar(estado: EstadoJogo, ctx: ContextoSimulacao, o: ObjetoNoMundo, porId: string, saida: EventoSimulacao[]): void {
  estado.objetos = estado.objetos.filter((x) => x !== o);
  saida.push({ t: 'quebrou', tick: estado.tick, objetoId: o.objetoId, forma: o.ref ?? '', x: o.x, y: o.y, porId });
  const saque = saqueDe(ctx, estado.faseId, o.objetoId);
  const d = ctx.balance.drops;
  switch (saque.tipo) {
    case 'ouro':
      largarPerto(ctx, o.x, o.y, (x, y) => largarOuro(estado, saque.ouro, x, y, saida));
      break;
    case 'orbe_hp':
      largarPerto(ctx, o.x, o.y, (x, y) => largarObjeto(estado, 'orbe_hp', x, y, d.orbeHpPct, 'pct', saida));
      break;
    case 'orbe_recurso':
      largarPerto(ctx, o.x, o.y, (x, y) => largarObjeto(estado, 'orbe_recurso', x, y, d.orbeRecursoPct, 'pct', saida));
      break;
    case 'orbe_efeito': {
      const efeito = sortearEfeitoDeOrbe(criarRng(hashTexto(`${estado.faseId}/${o.objetoId}/efeito`)), undefined, ctx.modo.sobrevivencia.revelarArmadilhas);
      if (efeito) largarPerto(ctx, o.x, o.y, (x, y) => largarOrbeEfeito(estado, efeito, x, y, saida));
      break;
    }
    case 'nada':
      break;
  }
}
