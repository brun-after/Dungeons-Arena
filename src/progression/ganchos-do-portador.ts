// Os ganchos de quem joga (marco 18, 17/10/2026, D-069): os dos itens equipados, os dos conjuntos completos e os das
// ressonâncias de atributo ativas. Também os passivos somados e os modificadores que os conjuntos dão às habilidades.

import { aplicarEfeito } from '../combat/efeitos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import type { Bolsa, Entidade } from '../entities/entidade';
import { bonusAtivos } from './conjuntos';
import { dispararGanchos, PASSIVOS_NEUTROS, somarPassivos, type Gancho, type MomentoDoGancho, type MomentoGancho, type MundoDoGancho, type PassivosDeGancho } from './ganchos';
import { resolverHabilidade } from '../combat/compilar-habilidade';
import { chebyshev } from '../combat/geometria';
import { ticksDe } from '../core/tempo';
import { podeFerir } from '../modos/relacao';
import { vivo } from '../entities/entidade';
import type { ModificadorDeItem } from './itens';
import { ganchosDasRessonancias } from './ressonancias';

type ContextoGancho = Pick<ContextoSimulacao, 'conteudo'>;

/** Todos os ganchos que valem para a entidade agora (sem ficha: nenhum). */
export function ganchosDe(ctx: ContextoGancho, e: Entidade): Gancho[] {
  const bolsa = e.bolsa;
  if (!bolsa) return [];
  const saida: Gancho[] = [];
  for (const entrada of Object.values(bolsa.equipamento)) {
    const item = entrada ? ctx.conteudo.itens.get(entrada.itemId) : undefined;
    if (item) saida.push(...item.ganchos);
  }
  for (const a of bonusAtivos(ctx.conteudo.conjuntos, bolsa, ctx.conteudo.itens)) for (const b of a.bonus) saida.push(...b.ganchos);
  saida.push(...ganchosDasRessonancias(ctx, e));
  return saida;
}

/** Os passivos somados (inamovível, estudo, armadilhas, resistências, refúgio, buff armado, renascer). */
export function passivosDe(ctx: ContextoGancho, e: Entidade): PassivosDeGancho {
  return e.bolsa ? somarPassivos(ganchosDe(ctx, e)) : PASSIVOS_NEUTROS;
}

/** Os modificadores de habilidade que os conjuntos completos dão (somam aos dos itens). */
export function modificadoresDosConjuntos(ctx: ContextoGancho, bolsa: Bolsa): ModificadorDeItem[] {
  return bonusAtivos(ctx.conteudo.conjuntos, bolsa, ctx.conteudo.itens).flatMap((a) => a.bonus.flatMap((b) => b.modificadores));
}

/** Dispara os ganchos da entidade no momento, aplicando pelo dispatcher único (origem: o portador). */
export function dispararGanchosDe(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  portador: Entidade,
  momento: Exclude<MomentoGancho, 'passivo'>,
  m: MomentoDoGancho,
  saida: EventoSimulacao[],
): void {
  const ganchos = ganchosDe(ctx, portador);
  if (ganchos.length === 0) return;
  dispararGanchos(estado, ganchos, portador, momento, m, mundoDoGancho(estado, ctx, saida), saida);
}

/** O mundo que os ganchos enxergam: aplicar pelo dispatcher, hostis perto e o elemento da última magia. */
function mundoDoGancho(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): MundoDoGancho {
  return {
    aplicar: (alvo, ef, quem) => {
      aplicarEfeito(estado, ctx, alvo, ef, { id: quem.id, x: quem.x, y: quem.y }, { x: alvo.x, y: alvo.y }, saida);
    },
    hostisPerto: (portador, centro, raio) =>
      estado.entidades
        .filter((x) => x !== portador && vivo(x) && chebyshev(x, centro) <= raio && podeFerir(portador, x, ctx.modo))
        .sort((a, b) => chebyshev(a, centro) - chebyshev(b, centro) || (a.id < b.id ? -1 : 1)),
    elementoRecente: (portador, janelaMs) => {
      const u = portador.ultimaHabilidade;
      if (!u || estado.tick - u.tick > ticksDe(janelaMs)) return null;
      const h = resolverHabilidade(ctx, u.chave);
      if (h?.tipoAtaque !== 'magico' || !h.elemento) return null;
      const def = ctx.conteudo.elementos.get(h.elemento);
      return def ? { ...def.estado } : null;
    },
  };
}
