// O que a sala do Mundo usa para levar alguém a outro lugar (marco 38, 08/11/2026, D-142):
// - a chegada na pedra de save das regiões sem vila (ao lado da pedra, no centro);
// - o lugar ao acaso do reino da Pedra de retorno desviada: uma região do mesmo reino e uma célula onde o gerador pôs
//   um monstro ou um ponto de coleta (sempre alcançável a pé), sorteadas pela semente da sala.
// - a fonte das missões perto de quem pede: o andarilho ou a balconista da taverna da vila.
// Puro.

import type { Celula } from '../core/comandos';
import type { EstadoJogo } from '../core/estado';
import { aleatorio, criarRng, hashTexto } from '../core/rng';
import type { Entidade } from '../entities/entidade';
import type { ExteriorGerado } from '../world/gerador-exterior';
import { gerarExterior } from '../world/gerador-exterior';
import { PREFIXO_ANDARILHO } from './objetos-mundo';
import { fonteDoAndarilho, territorioDoLugar, type Reino, type RegiaoDoMundo } from './reino';

/** Onde chega quem não veio por uma passagem: ao lado da pedra de save do centro (null: o spawn da região). */
export function chegadaNaPedra(exterior: ExteriorGerado | null): Celula | null {
  return exterior?.abrigo ? { x: exterior.abrigo.x, y: exterior.abrigo.y + 1 } : null;
}

/** Uma região do reino de `aqui` e uma célula alcançável dela, sorteadas por `chave`. */
export function lugarAoAcaso(reino: Reino, aqui: string, chave: string): { regiao: RegiaoDoMundo; chegada: Celula } | null {
  const territorio = territorioDoLugar(reino, aqui);
  const candidatas = reino.regioes.filter((r) => territorio.regioes.some((t) => t.id === r.id));
  if (candidatas.length === 0) return null;
  const rng = criarRng(hashTexto(`retorno-desviado:${chave}`));
  const regiao = candidatas[Math.floor(aleatorio(rng) * candidatas.length)] ?? candidatas[0];
  if (!regiao) return null;
  const ex = gerarExterior(reino, regiao);
  const pontos: Celula[] = [...ex.pontos.flatMap((p) => (p.tipo === 'coleta' ? [{ x: p.x, y: p.y }] : [])), ...(ex.fase.inimigos ?? []).map((i) => ({ x: i.x, y: i.y }))];
  const c = pontos[Math.floor(aleatorio(rng) * pontos.length)] ?? ex.fase.spawns[0];
  return c ? { regiao, chegada: { x: c.x, y: c.y } } : null;
}

/** A fonte das missões perto de `e` (alcance em células): `npc:<andarilho>`, a vila da balconista, ou null. */
export function fonteDeMissoesPerto(estado: EstadoJogo, e: Entidade, alcance: number, vila: string | null): { fonte: string; andarilho: string | null } | null {
  for (const o of estado.objetos) {
    if (o.tipo !== 'npc' || !o.ref || Math.max(Math.abs(o.x - e.x), Math.abs(o.y - e.y)) > alcance) continue;
    if (o.ref.startsWith(PREFIXO_ANDARILHO)) {
      const id = o.ref.slice(PREFIXO_ANDARILHO.length);
      return { fonte: fonteDoAndarilho(id), andarilho: id };
    }
    if (o.ref === 'missoes' && vila) return { fonte: vila, andarilho: null };
  }
  return null;
}
