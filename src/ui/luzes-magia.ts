// As luzes das magias (marco 44, 15/11/2026, D-178). No escuro, a magia ilumina onde está e por onde passa, na cor do
// elemento: o projétil e o rastro curto que ele deixa, o solo e o terreno que a magia cria, e o clarão do impacto em
// quem é atingido. Só desenho: nada aqui muda a simulação.
// Marco 49 (21/11/2026, D-194): a entrega solta muitos projéteis e acertos de uma vez (os grãos do granizo, os pulsos
// do feixe). Somadas, as luzes estouravam num clarão branco. Agora o rastro sai a cada RASTRO_PASSO_MS (não a cada
// quadro), o grão ilumina pouco, o tiro que ainda não saiu não ilumina, o clarão do mesmo golpe no mesmo alvo se renova
// em vez de empilhar, e o chão da entrega ilumina menos (a matéria dele é que conta o elemento).

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
/** De quanto em quanto tempo o projétil deixa uma luz de rastro (ms). */
const RASTRO_PASSO_MS = 60;
/** A luz do grão, em fração da luz de um projétil comum. */
const LUZ_DO_GRAO = 0.2;

interface Marca {
  x: number;
  y: number;
  cor: number;
  ate: number;
  raio: number;
  intensidade: number;
  dura: number;
  /** O clarão de um golpe num alvo (`chave|alvo`): o mesmo se renova em vez de empilhar. */
  chave?: string;
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
  const grao = new Map<string, boolean>();
  const ehGrao = (chave: string): boolean => {
    let g = grao.get(chave);
    if (g === undefined) {
      g = resolverHabilidade(ctx, chave)?.entrega?.corpo === 'graos';
      grao.set(chave, g);
    }
    return g;
  };
  const ultimoRastro = new Map<number, number>();
  bus.on('impacto', (ev) => {
    const alvo = estado().entidades.find((e) => e.id === ev.alvoId);
    if (!alvo) return;
    const chave = `${ev.chave}|${ev.alvoId}`;
    const ate = performance.now() + CLARAO_MS;
    const viva = marcas.find((m) => m.chave === chave);
    if (viva) {
      viva.ate = ate;
      viva.x = alvo.x;
      viva.y = alvo.y;
      return;
    }
    marcas.push({ x: alvo.x, y: alvo.y, cor: cor(ev.chave), ate, raio: 2.2, intensidade: 0.8, dura: CLARAO_MS, chave });
  });
  return {
    pontos: (est, agoraMs) => {
      const pontos: PontoDeLuz[] = [];
      for (const p of est.projeteis) {
        if ((p.saiEm ?? 0) > est.tick) continue;
        const c = cor(p.chave);
        const f = ehGrao(p.chave) ? LUZ_DO_GRAO : 1;
        pontos.push({ x: p.x, y: p.y, cor: c, semente: p.id, intensidade: 0.6 * f, raio: raioMagia * (f < 1 ? 0.6 : 1) });
        const ultimo = ultimoRastro.get(p.id);
        if (f === 1 && (ultimo === undefined || agoraMs - ultimo >= RASTRO_PASSO_MS)) {
          ultimoRastro.set(p.id, agoraMs);
          marcas.push({ x: p.x, y: p.y, cor: c, ate: agoraMs + RASTRO_MS, raio: raioMagia * 0.6, intensidade: 0.35, dura: RASTRO_MS });
        }
      }
      if (ultimoRastro.size > 256) ultimoRastro.clear();
      for (const s of est.solos ?? []) pontos.push({ x: s.x, y: s.y, cor: cor(s.chave), semente: s.id, intensidade: s.entrega ? 0.2 : 0.45, raio: s.raio + (s.entrega ? 0.6 : 1.2) });
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
