// Área de interesse (marco 29, 30/10/2026, D-128): no Mundo, cada sessão recebe só o que está a até `raio` células
// (Chebyshev) do seu personagem: as entidades, os objetos, os projéteis, os rastros e os respawns. A entidade que sai
// do raio vai como "removida" no patch daquela sessão (cada uma tem o seu GeradorDePatches) e volta como "nova" ao
// entrar de novo. A própria entidade sempre vai, mesmo morta ou longe da câmera. Puro.

import type { EstadoJogo } from '../core/estado';

interface Posicionado {
  x: number;
  y: number;
}

function perto(a: Posicionado, b: Posicionado, raio: number): boolean {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= raio;
}

/** O recorte do estado público visto por uma sessão; sem a própria entidade no mundo, só as listas vazias. */
export function recortarPorInteresse(publico: EstadoJogo, propriaId: string, raio: number): EstadoJogo {
  const propria = publico.entidades.find((e) => e.id === propriaId);
  if (!propria) return { ...publico, entidades: [], objetos: [], projeteis: [], rastros: [], respawns: [] };
  // A party recebe as vizinhanças de todos os aliados na mesma sala para as câmeras e o mapa.
  const focos = propria.grupo ? publico.entidades.filter(e => e.id === propriaId || e.grupo === propria.grupo && e.arquetipo === 'jogador') : [propria];
  const ve = (p: Posicionado) => focos.some(f => perto(p, f, raio));
  return {
    ...publico,
    entidades: publico.entidades.filter((e) => e.id === propriaId || ve(e)),
    // 16/11/2026 (D-184): a luz de XP só vai ao dono.
    objetos: publico.objetos.filter((o) => ve(o) && (o.tipo !== 'orbe_xp' || o.ref === propriaId)),
    projeteis: publico.projeteis.filter(ve),
    rastros: publico.rastros.filter(ve),
    respawns: publico.respawns.filter(ve),
  };
}

type EventoComPosicao = { x?: number; y?: number; id?: string; fonteId?: string | null; alvoId?: string | null; porId?: string | null };

/**
 * Marco 54 (26/11/2026, D-207): os eventos do tique que a sessão vê. No Mundo contínuo a sala é o atlas inteiro, e o
 * golpe do outro lado do reino não interessa a ninguém aqui. Vai o evento sem posição nem entidade (os gerais), o que
 * é da própria entidade, e o que acontece (ou envolve quem está) a até `raio` células dela.
 */
export function eventosPorInteresse<E extends object>(eventos: readonly E[], posicoes: ReadonlyMap<string, Posicionado>, propriaId: string, raio: number): E[] {
  const eu = posicoes.get(propriaId);
  if (!eu) return [];
  return eventos.filter((ev) => {
    const e = ev as EventoComPosicao;
    const ids = [e.id, e.fonteId, e.alvoId, e.porId].filter((x): x is string => typeof x === 'string' && x !== '');
    if (ids.includes(propriaId)) return true;
    if (typeof e.x === 'number' && typeof e.y === 'number') return perto(eu, { x: e.x, y: e.y }, raio);
    const quem = ids.map((id) => posicoes.get(id)).filter((p): p is Posicionado => p !== undefined);
    return quem.length === 0 ? ids.length === 0 : quem.some((p) => perto(eu, p, raio));
  });
}
