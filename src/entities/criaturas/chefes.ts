// Marco 45 (16/11/2026, D-182): as mecânicas de arena dos governantes das dimensões. Cada chefe tem uma (`chefe.mecanica`
// no preset, com os números dele) — o plano de escravidão vira a regra da luta. Este arquivo tem o que todas
// partilham (a arena que começa no primeiro encontro, os objetos que o chefe põe nela, as marcas no chão e a proteção);
// as mecânicas ficam em chefes-mecanicas.ts, uma função pequena por id. Hostilidade só por `relacao()`.

import type { ContextoSimulacao } from '../../core/contexto';
import type { EstadoJogo } from '../../core/estado';
import type { EventoSimulacao } from '../../core/eventos-simulacao';
import { celulaOcupada, chebyshev } from '../../combat/geometria';
import { vivo, type Entidade } from '../entidade';
import { criaturaDoChefe, objetosVivos } from './chefes-base';
import { MECANICAS } from './chefes-mecanicas';
import { presetDe } from './terreno';

/** O tick das mecânicas: começa no primeiro encontro (a arena) e acaba com o chefe (os objetos somem). */
export function processarChefes(estado: EstadoJogo, ctx: ContextoSimulacao, acordada: (e: Entidade) => boolean, saida: EventoSimulacao[]): void {
  for (const e of estado.entidades) {
    if (e.arquetipo !== 'boss' || e.controlador !== 'ia' || !acordada(e) || !vivo(e)) continue;
    const m = presetDe(ctx, e)?.chefe;
    if (!m) continue;
    const c = criaturaDoChefe(e);
    if (!c.arena) {
      if (e.ia?.modo !== 'perseguindo') continue;
      c.arena = celulaOcupada(e);
      MECANICAS[m.mecanica]?.inicio?.(estado, ctx, e, m, saida);
    }
    c.zonas = (c.zonas ?? []).filter((z) => {
      if (z.ateTick > estado.tick) return true;
      MECANICAS[m.mecanica]?.fimDaZona?.(estado, ctx, e, m, z, saida);
      return false;
    });
    MECANICAS[m.mecanica]?.tick(estado, ctx, e, m, saida);
  }
}

/** O fator do dano que o chefe leva (o bando, as torres, os reféns, o geodo, as máscaras, os braseiros, o voo). */
export function protecaoDoChefe(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, contexto: { costas: boolean; contato: boolean } = { costas: false, contato: false }): number {
  if (alvo.arquetipo !== 'boss') return 1;
  const m = presetDe(ctx, alvo)?.chefe;
  const f = m ? MECANICAS[m.mecanica]?.protecao : undefined;
  return m && f ? f(estado, ctx, alvo, m, contexto) : 1;
}

/** O fator do dano que o chefe causa (o Apagador enfraquece com os braseiros acesos). */
export function forcaDoChefe(estado: EstadoJogo, ctx: ContextoSimulacao, chefe: Entidade): number {
  if (chefe.arquetipo !== 'boss') return 1;
  const m = presetDe(ctx, chefe)?.chefe;
  const f = m ? MECANICAS[m.mecanica]?.forca : undefined;
  return m && f ? f(estado, ctx, chefe, m) : 1;
}

/** Quando algo cai: o objeto de arena avisa o dono; o chefe leva os objetos com ele; o aliado que cai perto da
 * Imperatriz vira estátua. */
export function aoCairNaArena(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const donoId = e.criatura?.donoId;
  const dono = donoId ? estado.entidades.find((x) => x.id === donoId) : undefined;
  if (dono && vivo(dono)) {
    const m = presetDe(ctx, dono)?.chefe;
    if (m) MECANICAS[m.mecanica]?.objetoCaiu?.(estado, ctx, dono, m, e, saida);
  }
  if (e.arquetipo === 'boss') {
    for (const o of objetosVivos(estado, e)) o.hp = 0;
    return;
  }
  for (const chefe of estado.entidades) {
    if (e.criatura?.donoId || chefe.arquetipo !== 'boss' || !vivo(chefe) || chebyshev(chefe, e) > 12) continue;
    const m = presetDe(ctx, chefe)?.chefe;
    if (m) MECANICAS[m.mecanica]?.alguemCaiu?.(estado, ctx, chefe, m, e, saida);
  }
}
