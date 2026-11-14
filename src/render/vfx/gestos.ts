// D-173 (14/11/2026): liga os gestos (reações, ressonâncias e combos de papel e assinados) aos eventos da simulação.
// A reação vem no `impacto` (a lista `sinergias`); a ressonância, no evento `ressonancia`; o combo, no `comboFeito`
// (os 35 combos antigos seguem com o desenho deles, em render/combos-taticos.ts). Só desenho.

import type { Barramento } from '../../core/events';
import type { EventosDaSimulacao } from '../../core/eventos-simulacao';
import interacoes from '../../data/interacoes.json';
import ressonancias from '../../data/ressonancias.json';
import type { PontoVisual } from '../../entities/entidade';
import type { DiretorVfx } from './diretor';
import { CORES, type Gesto } from './gestos-base';
import { GESTOS_DOS_COMBOS } from './gestos-combos';
import { GESTOS_DAS_REACOES } from './gestos-reacoes';
import { GESTOS_DAS_RESSONANCIAS } from './gestos-ressonancias';

const cor = (elemento: string | null | undefined): number => (elemento && elemento in CORES ? CORES[elemento as keyof typeof CORES] : 0xffffff);
const COR_DA_REACAO = new Map(interacoes.sinergias.map((s) => [s.id, cor(s.elemento)]));
const COR_DA_RESSONANCIA = new Map(ressonancias.ressonancias.map((r) => [r.id, cor(r.elemento)]));
const COR_DO_COMBO = 0xffe070;

export function gestoDaReacao(id: string): Gesto | undefined {
  return GESTOS_DAS_REACOES[id];
}
export function gestoDaRessonancia(id: string): Gesto | undefined {
  return GESTOS_DAS_RESSONANCIAS[id];
}
export function gestoDoCombo(id: string): Gesto | undefined {
  return GESTOS_DOS_COMBOS[id];
}

export function ligarGestos(bus: Barramento<EventosDaSimulacao>, diretor: DiretorVfx, pos: (id: string) => PontoVisual | null): void {
  bus.on('impacto', (ev) => {
    if (ev.sinergias.length === 0 || ev.falha) return;
    const em = pos(ev.alvoId);
    if (!em) return;
    for (const s of ev.sinergias) diretor.gesto(gestoDaReacao(s), { de: pos(ev.fonteId), em, cor: COR_DA_REACAO.get(s) ?? 0xffffff });
  });
  bus.on('ressonancia', (ev) => {
    diretor.gesto(gestoDaRessonancia(ev.ressonancia), { de: pos(ev.id), em: pos(ev.alvoId) ?? { x: ev.x, y: ev.y }, cor: COR_DA_RESSONANCIA.get(ev.ressonancia) ?? 0xffffff });
  });
  bus.on('comboFeito', (ev) => {
    const g = gestoDoCombo(ev.combo);
    if (!g) return;
    const em = ev.x !== undefined && ev.y !== undefined ? { x: ev.x, y: ev.y } : ((ev.alvoId ? pos(ev.alvoId) : null) ?? pos(ev.id));
    if (em) diretor.gesto(g, { de: pos(ev.id), em, cor: COR_DO_COMBO });
  });
}
