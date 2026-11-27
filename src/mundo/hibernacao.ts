// Marco 54 (26/11/2026, D-207): a hibernação do Mundo contínuo. Com as 24 regiões numa sala só, o estado teria ~6 mil
// monstros e ~1 mil objetos; o tique (`simular`, a cópia do estado público e o recorte por interesse) ficaria do
// tamanho do atlas. Aqui o que está longe de todo jogador sai do estado para um depósito por bloco e volta quando
// alguém chega perto, antes de entrar na área de interesse:
// - dorme: o monstro sem dono (nem invocação, nem com ficha), longe de todo jogador e sem alvo; o objeto longe; o
//   respawn pendente longe;
// - acorda: o bloco inteiro, quando um jogador chega a `raioAcordar` dele (menor que `raioDormir`: não pisca);
// - o tempo para enquanto dorme (o respawn que venceu dormindo acontece ao acordar).
// Clone explícito: o depósito guarda os próprios objetos, tirados do estado. Puro.

import type { Balance } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo, RespawnPendente } from '../core/estado';
import type { Entidade } from '../entities/entidade';

type Regras = Balance['mundo']['hibernacao'];

interface Bloco {
  entidades: Entidade[];
  objetos: ObjetoNoMundo[];
  respawns: RespawnPendente[];
}

/** Os tipos de objeto que nunca dormem (o túmulo tem dono esperando e prazo de parede). */
const SEMPRE_ACORDADOS: ReadonlySet<string> = new Set(['tumulo']);

export class Hibernacao {
  private readonly blocos = new Map<number, Bloco>();

  constructor(private readonly regras: Regras) {}

  /** Quantos estão dormindo (para as métricas e os testes). */
  dormindo(): { entidades: number; objetos: number; respawns: number } {
    let entidades = 0;
    let objetos = 0;
    let respawns = 0;
    for (const b of this.blocos.values()) {
      entidades += b.entidades.length;
      objetos += b.objetos.length;
      respawns += b.respawns.length;
    }
    return { entidades, objetos, respawns };
  }

  /** Confere quem dorme e quem acorda (a sala chama a cada tique; só age a cada `aCadaTicks`). */
  conferir(estado: EstadoJogo, forcar = false): void {
    if (!forcar && estado.tick % this.regras.aCadaTicks !== 0) return;
    const jogadores = estado.entidades.filter((e) => e.controlador !== 'ia');
    this.acordar(estado, jogadores);
    this.adormecer(estado, jogadores);
  }

  private chave(x: number, y: number): number {
    const b = this.regras.bloco;
    return Math.floor(y / b) * 65_536 + Math.floor(x / b);
  }

  private bloco(x: number, y: number): Bloco {
    const k = this.chave(x, y);
    let b = this.blocos.get(k);
    if (!b) {
      b = { entidades: [], objetos: [], respawns: [] };
      this.blocos.set(k, b);
    }
    return b;
  }

  private acordar(estado: EstadoJogo, jogadores: readonly Entidade[]): void {
    const { bloco: lado, raioAcordar } = this.regras;
    for (const [k, b] of this.blocos) {
      const bx = (k % 65_536) * lado;
      const by = Math.floor(k / 65_536) * lado;
      // Chebyshev do jogador ao retângulo do bloco.
      const perto = jogadores.some((j) => Math.max(bx - j.x, j.x - (bx + lado - 1), 0) <= raioAcordar && Math.max(by - j.y, j.y - (by + lado - 1), 0) <= raioAcordar);
      if (!perto) continue;
      estado.entidades.push(...b.entidades);
      estado.objetos.push(...b.objetos);
      estado.respawns.push(...b.respawns);
      this.blocos.delete(k);
    }
  }

  private adormecer(estado: EstadoJogo, jogadores: readonly Entidade[]): void {
    const { raioDormir } = this.regras;
    const longe = (p: { x: number; y: number }) => jogadores.every((j) => Math.max(Math.abs(j.x - p.x), Math.abs(j.y - p.y)) > raioDormir);
    const ficam: Entidade[] = [];
    for (const e of estado.entidades) {
      const dorme = e.controlador === 'ia' && !e.invocacao && !e.bolsa && !e.ia?.alvoId && !e.acao && longe(e);
      if (dorme) this.bloco(e.x, e.y).entidades.push(e);
      else ficam.push(e);
    }
    estado.entidades = ficam;
    const objetos: ObjetoNoMundo[] = [];
    for (const o of estado.objetos) {
      if (!SEMPRE_ACORDADOS.has(o.tipo) && longe(o)) this.bloco(o.x, o.y).objetos.push(o);
      else objetos.push(o);
    }
    estado.objetos = objetos;
    const respawns: RespawnPendente[] = [];
    for (const r of estado.respawns) {
      if (longe(r)) this.bloco(r.x, r.y).respawns.push(r);
      else respawns.push(r);
    }
    estado.respawns = respawns;
  }
}
