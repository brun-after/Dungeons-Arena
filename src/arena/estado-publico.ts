// Estado público (§3.6): o que vai a todos os clientes. Fica só no servidor: o PRNG da simulação,
// as decisões internas da IA (PRNG, memória, caches) e, quando existirem, inventários e conteúdo
// oculto. O cliente recebe a mesma forma (EstadoJogo), com esses campos neutros.

import { clonarEstado, type EstadoJogo } from '../core/estado';
import { digest } from '../core/digest';
import type { EstadoIa } from '../entities/entidade';

const RNG_NEUTRO = { a: 0, b: 0, c: 0, d: 0 } as const;

function iaPublica(ia: EstadoIa): EstadoIa {
  // Só o necessário para a interface ("?" e "!"); o resto é decisão do servidor.
  return {
    modo: ia.modo,
    modoDesdeTick: ia.modoDesdeTick,
    alvoId: ia.alvoId,
    hesitacaoAteTick: 0,
    detectados: [],
    proximaAvaliacaoTick: 0,
    proximoPassoTick: 0,
    direcaoPatrulha: null,
    recentes: [],
    proximaChecagemDesistenciaTick: 0,
    falhasCaminho: 0,
    alvoCacheX: -1,
    alvoCacheY: -1,
    proximoAtaqueTick: 0,
    ataquesFeitos: 0,
    rng: { ...RNG_NEUTRO },
  };
}

export function estadoPublico(estado: EstadoJogo): EstadoJogo {
  const publico = clonarEstado(estado);
  publico.rng = { ...RNG_NEUTRO };
  for (const e of publico.entidades) if (e.ia) e.ia = iaPublica(e.ia);
  return publico;
}

/** Digest do estado público: cliente e servidor comparam no mesmo tick (§5.6). */
export function digestPublico(estado: EstadoJogo): string {
  return digest(estadoPublico(estado));
}
