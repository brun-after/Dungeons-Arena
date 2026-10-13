// Interpolação dos outros jogadores e NPCs (§3.6): eles são desenhados um pouco no passado (buffer
// visual de ~100 ms), entre os dois snapshots do servidor que cercam esse instante. Sem IA nem
// simulação deles no cliente.

import type { EstadoJogo } from '../core/estado';
import { posicaoNoPasso, type PontoVisual } from '../entities/entidade';

interface Snapshot {
  tick: number;
  posicoes: Map<string, PontoVisual>;
}

const MAX_SNAPSHOTS = 30;

export class BufferRemoto {
  private readonly snapshots: Snapshot[] = [];

  registrar(tick: number, estado: EstadoJogo): void {
    const ultimo = this.snapshots.at(-1);
    if (ultimo && tick <= ultimo.tick) return;
    const posicoes = new Map<string, PontoVisual>();
    for (const e of estado.entidades) posicoes.set(e.id, posicaoNoPasso(e));
    this.snapshots.push({ tick, posicoes });
    if (this.snapshots.length > MAX_SNAPSHOTS) this.snapshots.shift();
  }

  /** Posição de `id` no tick (fracionário) pedido; null se não há snapshot com ele. */
  posicao(id: string, tick: number): PontoVisual | null {
    let antes: Snapshot | undefined;
    let depois: Snapshot | undefined;
    for (const s of this.snapshots) {
      if (s.tick <= tick) antes = s;
      else {
        depois = s;
        break;
      }
    }
    const a = antes?.posicoes.get(id);
    const b = depois?.posicoes.get(id);
    if (a && b && antes && depois) {
      const t = (tick - antes.tick) / Math.max(1, depois.tick - antes.tick);
      // Saltos grandes (respawn, teleporte) não são animados.
      if (Math.abs(b.x - a.x) + Math.abs(b.y - a.y) > 2) return t < 0.5 ? a : b;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    return a ?? b ?? null;
  }
}
