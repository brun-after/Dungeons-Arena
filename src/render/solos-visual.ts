// O solo amaldiçoado e a runa no chão (marco 27, 29/10/2026, D-126). Só lê eventos: ao nascer, o círculo do solo na
// cor da arma (a runa espera o atraso com o círculo rúnico); a cada pulso, o acerto da assinatura no centro e as
// partículas dela pelas células; ao acabar, a marca some sozinha. A raridade da arma de quem lançou soma camadas.

import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import type { Habilidade } from '../combat/habilidades';
import type { DiretorVfx } from './vfx/diretor';
import { assinaturaDe } from './vfx/resolver';
import { visualDe } from './visual-habilidade';

const ORDEM_FORMAS = ['comum', 'epica', 'lendaria', 'ultima'];

/** A raridade da arma principal de quem lançou (0 a 3), pelo que a aparência pública mostra. */
export function tierDaArma(e: Entidade | undefined): number {
  return Math.max(0, ORDEM_FORMAS.indexOf(e?.aparencia?.formaArma ?? 'comum'));
}

export function ligarSolos(
  bus: Barramento<EventosDaSimulacao>,
  estado: () => EstadoJogo,
  diretor: DiretorVfx,
  habilidade: (chave: string) => Habilidade | undefined,
): void {
  const solos = new Map<number, { chave: string; donoId: string; raio: number; forma: 'quadrado' | 'cone' }>();
  bus.on('soloCriado', (ev) => {
    solos.set(ev.soloId, { chave: ev.chave, donoId: ev.donoId, raio: ev.raio, forma: ev.forma });
    const h = habilidade(ev.chave);
    if (!h) return;
    const cor = visualDe(h).cor;
    const celulas = [];
    for (let dy = -ev.raio; dy <= ev.raio; dy++) for (let dx = -ev.raio; dx <= ev.raio; dx++) celulas.push({ x: ev.x + dx, y: ev.y + dy });
    const centro = { x: ev.x, y: ev.y };
    diretor.rajada(assinaturaDe(h), { chave: ev.chave, atorId: ev.donoId, origem: centro, mira: centro, centro, celulas, cor, escala: 1, tipoArea: ev.forma, raio: ev.raio });
  });
  bus.on('soloPulsou', (ev) => {
    const s = solos.get(ev.soloId);
    const h = s ? habilidade(s.chave) : undefined;
    if (!s || !h) return;
    const dono = estado().entidades.find((e) => e.id === s.donoId);
    diretor.acertar(assinaturaDe(h), { chave: s.chave, fonteId: s.donoId, alvoId: '', de: null, ate: { x: ev.x, y: ev.y }, cor: visualDe(h).cor, escala: 0.8 + 0.25 * ev.raio, critico: false, indice: 0, tier: tierDaArma(dono) }, h.visual?.variante, true);
  });
  bus.on('soloFim', (ev) => {
    solos.delete(ev.soloId);
  });
}
