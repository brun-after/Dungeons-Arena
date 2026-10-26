// Estado público (§3.6): o que vai a todos os clientes. Fica só no servidor: o PRNG da simulação,
// as decisões internas da IA (PRNG, memória, caches), a bolsa (mochila e equipamento são privados,
// marco 6) e, quando existir, conteúdo oculto. O cliente recebe a mesma forma (EstadoJogo), com esses campos neutros.

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
    foraDaZonaTicks: 0,
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
    ultimaAgressaoVista: 0,
    rng: { ...RNG_NEUTRO },
  };
}

export function estadoPublico(estado: EstadoJogo): EstadoJogo {
  const publico = clonarEstado(estado);
  publico.rng = { ...RNG_NEUTRO };
  // Armadilhas são invisíveis para quem não as armou (§2.11); o estado público é igual para todos
  // até o canal privado do 8B, então ficam de fora (D-049).
  publico.armadilhas = [];
  delete publico.reservaEnxame;
  // Conteúdo de baú é só do servidor (§3.6, marco 9A): o que veio aparece no evento `bauAberto`.
  for (const o of publico.objetos) {
    if (o.tipo !== 'bau') continue;
    o.itens = [];
    o.ouro = 0;
  }
  for (const e of publico.entidades) {
    if (e.ia) e.ia = iaPublica(e.ia);
    e.bolsa = null;
    // Marco 26 (25/10/2026, D-104): a posição contínua muda a cada tick; com milésimos de célula, o patch fica curto.
    // O relógio de caminhada (que nada na tela lê) mudava a cada tick de quem anda: fica só no servidor.
    e.px = milesimoParaOCentro(e.px);
    e.py = milesimoParaOCentro(e.py);
    e.relogioAndar = 0;
  }
  return publico;
}

/**
 * Arredonda a milésimos de célula na direção do centro da célula ocupada: quem encosta na parede (a aresta da célula)
 * se afasta dela, nunca entra, e a célula (o arredondamento) não muda. Idempotente.
 */
export function milesimoParaOCentro(v: number): number {
  const m = v * 1000;
  return (v > Math.round(v) ? Math.floor(m + 1e-6) : Math.ceil(m - 1e-6)) / 1000;
}

/** Digest do estado público: cliente e servidor comparam no mesmo tick (§5.6). */
export function digestPublico(estado: EstadoJogo): string {
  return digest(estadoPublico(estado));
}
