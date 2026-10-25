// Migração 24 para 25 (marco 26, 25/10/2026, D-104): o movimento livre. Puro, sobre o JSON do save.
// Cada entidade ganha a posição contínua no centro da célula que ocupava (a do destino, se já tinha passado da
// metade do passo), sem direção nem caminho; os campos do passo por célula saem.

import { ehObjeto, type Objeto } from '../core/validar';

function migrarEntidade(e: Objeto): Objeto {
  const { destinoX, destinoY, progressoPasso, ...resto } = e;
  delete resto.proximoEixoX;
  const noDestino = typeof progressoPasso === 'number' && progressoPasso >= 0.5 && typeof destinoX === 'number' && typeof destinoY === 'number';
  const x = noDestino ? destinoX : typeof e.x === 'number' ? e.x : 0;
  const y = noDestino ? destinoY : typeof e.y === 'number' ? e.y : 0;
  return { ...resto, x, y, px: x, py: y, direcao: 'parado', rumoX: 0, rumoY: 0, waypoints: [], caminho: [] };
}

function migrarEstado(v: unknown): unknown {
  if (!ehObjeto(v) || !Array.isArray(v.entidades)) return v;
  return { ...v, entidades: v.entidades.map((x: unknown) => (ehObjeto(x) ? migrarEntidade(x) : x)) };
}

export function migrarMovimentoLivre(r: Objeto): Objeto {
  const fasesVisitadas = ehObjeto(r.fasesVisitadas)
    ? Object.fromEntries(Object.entries(r.fasesVisitadas).map(([id, fase]) => [id, migrarEstado(fase)])) : r.fasesVisitadas;
  return { ...r, estado: migrarEstado(r.estado), fasesVisitadas };
}
