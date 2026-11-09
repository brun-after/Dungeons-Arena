// O Portal temporário do Mundo (09/11/2026, D-143). Quem tem o item marca no mapa um ponto de uma região descoberta e
// confirma: o portal abre por `duracaoS` (1 min) entre onde está e o ponto marcado. Ele e os aliados do mesmo grupo
// atravessam pelas duas pontas (E). Não abre de dentro de dungeons nem para elas.
// - o registro é do processo (o coordenador do servidor guarda um só; as salas das duas pontas leem o mesmo), com o
//   relógio de parede do servidor, como a recarga do portal das vilas: as pontas podem estar em salas diferentes;
// - cada sala põe no chão um objeto `portal_temporario` por ponta dela (`ref`: `<id>:<ponta>`), na célula andável mais
//   perto do ponto, e tira os vencidos;
// - quem abre um novo fecha o anterior dele.
// A sala faz a viagem (a troca de sala, ou o passo dentro da mesma região); aqui fica a regra. Puro.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { passavel } from '../world/fase';
import { novoObjeto } from '../world/objeto-novo';
import type { MotivoDoMundo } from './avisos';
import type { FichaDoMundo } from './ficha-mundo';
import { lerLugar } from './lugares';
import { capitalDoAtlas, type Reino } from './reino';

import { PORTAL_TEMPORARIO } from './objetos-mundo';

export { FRAGMENTO_DE_PORTAL, PORTAL_TEMPORARIO } from './objetos-mundo';

export interface PontaDoPortal {
  lugar: string;
  x: number;
  y: number;
}

export interface PortalTemporario {
  id: string;
  /** A identidade de quem abriu (o personagem). */
  dono: string;
  /** O grupo de quem abriu, na hora de abrir (os do grupo atravessam). */
  grupo: string | null;
  pontas: readonly [PontaDoPortal, PontaDoPortal];
  /** Até quando fica aberto (ms do relógio do servidor). */
  fimMs: number;
}

/** O registro dos portais abertos no processo (um por servidor, lido por todas as salas do Mundo). */
export class PortaisTemporarios {
  private readonly abertos = new Map<string, PortalTemporario>();
  private contador = 0;

  /** Abre um portal (fecha o anterior do mesmo dono). */
  abrir(dono: string, grupo: string | null, pontas: readonly [PontaDoPortal, PontaDoPortal], fimMs: number): PortalTemporario {
    for (const [id, p] of this.abertos) if (p.dono === dono) this.abertos.delete(id);
    this.contador++;
    const portal: PortalTemporario = { id: `pt${String(this.contador)}`, dono, grupo, pontas: [{ ...pontas[0] }, { ...pontas[1] }], fimMs };
    this.abertos.set(portal.id, portal);
    return portal;
  }

  /** Os abertos agora (os vencidos saem do registro). */
  ativos(agoraMs: number): PortalTemporario[] {
    for (const [id, p] of this.abertos) if (p.fimMs <= agoraMs) this.abertos.delete(id);
    return [...this.abertos.values()];
  }

  buscar(id: string, agoraMs: number): PortalTemporario | null {
    const p = this.abertos.get(id);
    return p && p.fimMs > agoraMs ? p : null;
  }
}

/** Quem pode atravessar: o dono e quem é do mesmo grupo que ele tinha ao abrir. */
export function podeAtravessar(portal: PortalTemporario, identidade: string, grupo: string | null): boolean {
  return portal.dono === identidade || (!!portal.grupo && portal.grupo === grupo);
}

export interface PedidoDePortal {
  reino: Reino;
  /** O lugar de quem usa (`regiao:id`...). */
  lugar: string;
  e: Entidade;
  ficha: FichaDoMundo;
  destino: PontaDoPortal;
}

/** Confere o pedido de abrir; devolve o motivo da recusa, ou null. Não gasta nada. */
export function recusaDoPortal(p: PedidoDePortal): MotivoDoMundo | null {
  const aqui = lerLugar(p.reino, p.lugar);
  const ali = lerLugar(p.reino, p.destino.lugar);
  if (aqui?.tipo !== 'regiao') return 'portal_dungeon';
  if (ali?.tipo !== 'regiao') return 'destino_invalido';
  const tamanho = ali.regiao.tamanho ?? p.reino.tamanhoRegiao;
  if (p.destino.x < 0 || p.destino.y < 0 || p.destino.x >= tamanho || p.destino.y >= tamanho) return 'destino_invalido';
  if (!p.ficha.descobertas.includes(p.destino.lugar) && !capitalDoAtlas(p.reino, ali.regiao.id)) return 'nao_descoberto';
  if (!p.e.bolsa?.mochila.some((m) => m.itemId === PORTAL_TEMPORARIO && m.qtd > 0)) return 'sem_item';
  return null;
}

/** Gasta um Portal temporário da mochila (quem chama já conferiu que há). */
export function gastarPortal(e: Entidade): void {
  const mochila = e.bolsa?.mochila;
  if (!mochila) return;
  const i = mochila.findIndex((m) => m.itemId === PORTAL_TEMPORARIO && m.qtd > 0);
  const m = mochila[i];
  if (!m) return;
  m.qtd--;
  if (m.qtd <= 0) mochila.splice(i, 1);
}

export const idDaPonta = (portal: string, ponta: number): string => `${portal}:${String(ponta)}`;
const idDoObjeto = (ref: string): string => `portal-${ref}`;

/** O portal e a ponta de um `ref` de objeto (`pt3:1`). */
export function lerPonta(ref: string): { portal: string; ponta: 0 | 1 } | null {
  const [portal, ponta] = ref.split(':');
  return portal && (ponta === '0' || ponta === '1') ? { portal, ponta: ponta === '0' ? 0 : 1 } : null;
}

/** A célula andável mais perto do ponto (até 8 células em volta), ou o próprio ponto. */
export function celulaDoPortal(ctx: ContextoSimulacao, c: Celula): Celula {
  for (let r = 0; r <= 8; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === r && passavel(ctx.fase, c.x + dx, c.y + dy)) return { x: c.x + dx, y: c.y + dy };
      }
    }
  }
  return c;
}

/** Põe no chão as pontas abertas deste lugar e tira as que fecharam. */
export function sincronizarPortais(estado: EstadoJogo, ctx: ContextoSimulacao, portais: PortaisTemporarios, lugar: string, agoraMs: number): void {
  const queridos = new Map<string, Celula>();
  for (const p of portais.ativos(agoraMs)) {
    p.pontas.forEach((ponta, i) => {
      if (ponta.lugar === lugar) queridos.set(idDaPonta(p.id, i), celulaDoPortal(ctx, ponta));
    });
  }
  estado.objetos = estado.objetos.filter((o) => o.tipo !== 'portal_temporario' || (o.ref !== null && queridos.has(o.ref)));
  for (const [ref, c] of queridos) {
    if (!estado.objetos.some((o) => o.ref === ref && o.tipo === 'portal_temporario')) estado.objetos.push(novoObjeto(idDoObjeto(ref), 'portal_temporario', c.x, c.y, { ref }));
  }
}

/** Para onde leva a ponta usada (a outra), se ainda está aberta e quem usa pode atravessar; ou o motivo da recusa. */
export function destinoDaPonta(portais: PortaisTemporarios, ref: string, identidade: string, grupo: string | null, agoraMs: number): PontaDoPortal | MotivoDoMundo {
  const lida = lerPonta(ref);
  const portal = lida ? portais.buscar(lida.portal, agoraMs) : null;
  if (!lida || !portal) return 'portal_fechado';
  if (!podeAtravessar(portal, identidade, grupo)) return 'portal_alheio';
  return portal.pontas[lida.ponta === 0 ? 1 : 0];
}
