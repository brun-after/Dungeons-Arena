// Marco 45 (16/11/2026, D-181): a morte das criaturas de Filo. Antes de cair, o Arqueiro de Osso desmonta e se
// remonta (a menos que o golpe final seja em área ou sagrado, ou que ele esteja na luz sagrada). Ao cair, o Vidraceiro
// estilhaça e o Penitente explode em luz; o Faminto em volta come o morto e cresce.

import type { ContextoSimulacao } from '../../core/contexto';
import type { EstadoJogo } from '../../core/estado';
import type { EventoSimulacao } from '../../core/eventos-simulacao';
import { ticksDe } from '../../core/tempo';
import { aplicarEfeito } from '../../combat/efeitos';
import { chebyshev } from '../../combat/geometria';
import { construirEfeito } from '../../combat/registro-efeitos';
import { vivo, type Entidade } from '../entidade';
import { aoCairNaArena } from './chefes';
import { presetDe, reacaoAgora } from './terreno';
import { criaturaDe, hostis } from './tracos';

const PRESA_MS = 3_600_000;

/** Se a criatura não cai agora (desmontou): true. Chamado por progression/morte.ts antes de marcar a morte. */
export function antesDeCair(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): boolean {
  if (e.controlador !== 'ia') return false;
  const t = presetDe(ctx, e)?.tracos.find((x) => x.tipo === 'remontar');
  const c = criaturaDe(e);
  if (!t || c.remontou || c.golpeFinal?.area || c.golpeFinal?.sagrado || reacaoAgora(estado, ctx, e).marcas.includes('semRemontar')) return false;
  c.remontou = true;
  c.remontaTick = estado.tick + ticksDe(t.ms);
  e.hp = 1;
  e.caminho = [];
  e.acao = null;
  // Desmontado: no chão, sem agir e sem levar dano até remontar (o tick dos traços tira estes estados).
  for (const tipo of ['sem_movimento', 'sem_ataque', 'imune_dano', 'petrificado'] as const) {
    aplicarEfeito(estado, ctx, e, construirEfeito(tipo, { duracaoMs: PRESA_MS }), { id: `remonta:${e.id}`, x: e.x, y: e.y }, null, saida);
  }
  saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: e.id, origemId: e.id, tipo: 'petrificado', dano: 0, cura: 0, mana: 0 });
  return true;
}

/** Depois de marcar a morte: o estilhaço, a explosão, a fome dos Famintos e os objetos de arena. */
export function aoCair(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const p = presetDe(ctx, e);
  if (p) {
    for (const t of p.tracos) {
      if (t.tipo !== 'aoMorrer' || reacaoAgora(estado, ctx, e).marcas.includes('semEstilhaco')) continue;
      for (const h of hostis(estado, ctx, e, t.raio)) {
        const origem = { id: e.id, x: e.x, y: e.y };
        if (t.dano > 0) aplicarEfeito(estado, ctx, h, construirEfeito('dano_direto', { valor: t.dano }), origem, null, saida);
        for (const ef of t.efeitos) aplicarEfeito(estado, ctx, h, ef, origem, null, saida);
      }
    }
  }
  // O Faminto come quem cai perto (amigo ou inimigo); na luz sagrada, não come.
  for (const f of estado.entidades) {
    if (f === e || !vivo(f) || f.controlador !== 'ia') continue;
    const t = presetDe(ctx, f)?.tracos.find((x) => x.tipo === 'faminto');
    if (!t || chebyshev(f, e) > t.raio || reacaoAgora(estado, ctx, f).marcas.includes('encolhe')) continue;
    const c = criaturaDe(f);
    if ((c.comidos ?? 0) >= t.max) continue;
    c.comidos = (c.comidos ?? 0) + 1;
    const extra = Math.round((f.hpMax * t.porMortePct) / 100);
    f.hpMax += extra;
    f.hp += extra;
  }
  aoCairNaArena(estado, ctx, e, saida);
}
