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
  const ve = (p: Posicionado) => perto(p, propria, raio);
  return {
    ...publico,
    entidades: publico.entidades.filter((e) => e.id === propriaId || ve(e)),
    objetos: publico.objetos.filter(ve),
    projeteis: publico.projeteis.filter(ve),
    rastros: publico.rastros.filter(ve),
    respawns: publico.respawns.filter(ve),
  };
}
