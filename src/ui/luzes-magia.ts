// As luzes das magias (marco 44, 15/11/2026, D-178). No escuro, a magia ilumina onde está e por onde passa, na cor do
// elemento: o projétil e o rastro curto que ele deixa, o solo e o terreno que a magia cria, e o clarão do impacto em
// quem é atingido. Só desenho: nada aqui muda a simulação.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import { resolverHabilidade } from '../combat/compilar-habilidade';
import type { PontoDeLuz } from '../render/luz';
import { CORES_TERRENO_VIVO } from '../world/ambiente-tipos';

/** Quanto dura o rastro de luz do projétil e o clarão do impacto (ms). */
const RASTRO_MS = 320;
const CLARAO_MS = 380;
const LUZ_NEUTRA = 0xffd8a8;

interface Marca {
  x: number;
  y: number;
  cor: number;
  ate: number;
  raio: number;
  intensidade: number;
  dura: number;
}

export interface LuzesDeMagia {
  /** As luzes de magia deste quadro. */
  pontos(estado: EstadoJogo, agoraMs: number): PontoDeLuz[];
}

export function criarLuzesDeMagia(ctx: ContextoSimulacao, bus: Barramento<EventosDaSimulacao>, estado: () => EstadoJogo, corDoElemento: (el: string | null | undefined) => number | null, raioMagia: number): LuzesDeMagia {
  const marcas: Marca[] = [];
  const cores = new Map<string, number>();
  const cor = (chave: string): number => {
    let c = cores.get(chave);
    if (c === undefined) {
      c = corDoElemento(resolverHabilidade(ctx, chave)?.elemento) ?? LUZ_NEUTRA;
      cores.set(chave, c);
    }
    return c;
  };
  bus.on('impacto', (ev) => {
    const alvo = estado().entidades.find((e) => e.id === ev.alvoId);
    if (alvo) marcas.push({ x: alvo.x, y: alvo.y, cor: cor(ev.chave), ate: performance.now() + CLARAO_MS, raio: 2.2, intensidade: 0.8, dura: CLARAO_MS });
  });
  return {
    pontos: (est, agoraMs) => {
      const pontos: PontoDeLuz[] = [];
      for (const p of est.projeteis) {
        const c = cor(p.chave);
        pontos.push({ x: p.x, y: p.y, cor: c, semente: p.id, intensidade: 0.6, raio: raioMagia });
        marcas.push({ x: p.x, y: p.y, cor: c, ate: agoraMs + RASTRO_MS, raio: raioMagia * 0.6, intensidade: 0.35, dura: RASTRO_MS });
      }
      for (const s of est.solos ?? []) pontos.push({ x: s.x, y: s.y, cor: cor(s.chave), semente: s.id, intensidade: 0.45, raio: s.raio + 1.2 });
      for (const t of est.terrenos ?? []) pontos.push({ x: t.x, y: t.y, cor: CORES_TERRENO_VIVO[t.tipo], semente: t.id, intensidade: 0.35, raio: t.raio + 1 });
      // As marcas (os rastros e os clarões) apagam com o tempo; as vencidas saem.
      let k = 0;
      for (const m of marcas) {
        const resta = m.ate - agoraMs;
        if (resta <= 0) continue;
        marcas[k++] = m;
        pontos.push({ x: m.x, y: m.y, cor: m.cor, semente: k, intensidade: m.intensidade * Math.min(1, resta / m.dura), raio: m.raio });
      }
      marcas.length = k;
      // Um teto, para o rastro de muitos projéteis não pesar.
      if (marcas.length > 160) marcas.splice(0, marcas.length - 160);
      return pontos;
    },
  };
}
