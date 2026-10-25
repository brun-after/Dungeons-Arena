// Objetos coletáveis (§2.1): orbes de HP, de recurso e de efeito (marco 8A), posicionados pela fase
// ou largados por inimigos, e itens (marco 6) largados por inimigos. A coleta acontece na etapa 7 do tick (gatilhos por célula alcançada) como uma
// transação: o primeiro coletor válido, na ordem rotativa do tick, consome o objeto, que sai do
// mundo no mesmo tick. Dez jogadores na mesma célula no mesmo tick resultam em uma coleta (§3.6).
// Marco 9A (14/10/2026): ouro (vai para a bolsa), loot com quantidade e os interagíveis (baú e loja),
// que não são coletados ao pisar: abrem pelo comando `interagir` (world/interacao.ts).

import { armarBuff, EFEITOS_OFENSIVOS } from '../progression/buffs';
import { aplicarEfeito } from '../combat/efeitos';
import type { EfeitoCanonico } from '../combat/registro-efeitos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { guardarItem } from '../progression/inventario';
import { ordemRotativa } from './colisao';
import { passavel } from './fase';

// 25/10/2026: `novoObjeto` mora em objeto-novo.ts (só tipos), para o e2e importar sem puxar o núcleo inteiro.
import { novoObjeto } from './objeto-novo';

export { novoObjeto };

/** Quanto o orbe daria a esta entidade agora (0 = não serve, não coleta). */
export function ganhoDoObjeto(o: ObjetoNoMundo, e: Entidade): number {
  const [atual, maximo] = o.tipo === 'orbe_hp' ? [e.hp, e.hpMax] : [e.mana, e.manaMax];
  const bruto = o.modo === 'pct' ? Math.round((maximo * o.valor) / 100) : o.valor;
  return Math.max(0, Math.min(maximo - atual, bruto));
}

/** Baú e loja abrem por `interagir`; o resto é coletado ao pisar. */
export function interagivel(o: ObjetoNoMundo): boolean {
  return o.tipo === 'bau' || o.tipo === 'loja' || o.tipo === 'santuario';
}

/** Ninguém coleta: interagíveis e a porta temporária do boss (marco 10A-1, world/portas.ts). */
function coletavel(o: ObjetoNoMundo): boolean {
  return !interagivel(o) && o.tipo !== 'saida';
}

/** O que o falcão do Aventureiro recolhe para o dono (itens e refúgio ficam para o jogador). */
const TIPOS_DO_FALCAO: ReadonlySet<ObjetoNoMundo['tipo']> = new Set(['ouro', 'orbe_hp', 'orbe_recurso', 'orbe_efeito']);

/** Quem coleta: entidades controladas por jogadores (local ou remoto), nunca a IA. */
function coletor(e: Entidade): boolean {
  return e.controlador !== 'ia' && vivo(e);
}

export function coletarObjetos(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  if (estado.objetos.length === 0 || !ctx.modo.objetosDeFase) return;
  const consumidos = new Set<string>();
  for (const o of estado.objetos) {
    if (!o.aguardaSaidaDe) continue;
    const dono = estado.entidades.find((e) => e.id === o.aguardaSaidaDe);
    // A coleta usa x/y (passo concluído), não a reserva de combate que muda no meio do passo.
    if (!dono || dono.x !== o.x || dono.y !== o.y) delete o.aguardaSaidaDe;
  }
  for (const e of ordemRotativa(estado.entidades, estado.tick)) {
    // Marco 22 (D-089): o falcão do Aventureiro recolhe para o dono o que encontra onde pousa.
    const dono = e.invocacao?.companheiro && vivo(e) ? estado.entidades.find((x) => x.id === e.invocacao?.donoId) : undefined;
    if (!coletor(e) && !dono) continue;
    const o = estado.objetos.find((x) => x.x === e.x && x.y === e.y && x.aguardaSaidaDe !== e.id && !consumidos.has(x.objetoId) && coletavel(x));
    if (!o) continue;
    // Ajuste de 24/10/2026 (D-091): também os orbes de vida, de mana e de buff, aplicados ao dono.
    if (dono && (!vivo(dono) || !TIPOS_DO_FALCAO.has(o.tipo))) continue;
    const quem = dono ?? e;
    // Transação: verificar -> consumir -> transferir -> registrar, tudo neste tick.
    if (o.tipo === 'item') {
      // Item: só quem tem mochila com espaço para a quantidade toda; senão fica no chão (§2.10).
      const item = o.itemId ? ctx.conteudo.itens.get(o.itemId) : undefined;
      if (!item || !quem.bolsa || !guardarItem(quem.bolsa, item, o.valor, ctx.balance.inventario, o.ref)) continue;
      consumidos.add(o.objetoId);
      saida.push({ t: 'coletou', tick: estado.tick, id: quem.id, objetoId: o.objetoId, tipo: o.tipo, ganho: o.valor, itemId: item.id });
      continue;
    }
    if (o.tipo === 'ouro') {
      // Ouro (marco 9A): só quem tem bolsa (a ficha de sessão da arena não tem economia).
      if (!quem.bolsa) continue;
      consumidos.add(o.objetoId);
      quem.bolsa.ouro += o.valor;
      saida.push({ t: 'coletou', tick: estado.tick, id: quem.id, objetoId: o.objetoId, tipo: o.tipo, ganho: o.valor, itemId: null });
      continue;
    }
    if (o.tipo === 'orbe_refugio') {
      // D-067: uma carga só; quem já tem deixa no chão.
      if (quem.refugio || !quem.bolsa) continue;
      consumidos.add(o.objetoId);
      quem.refugio = true;
      saida.push({ t: 'coletou', tick: estado.tick, id: quem.id, objetoId: o.objetoId, tipo: o.tipo, ganho: 1, itemId: null });
      continue;
    }
    if (o.tipo === 'orbe_efeito') {
      // Orbe de efeito: sempre serve; o efeito passa pelo dispatcher único (§2.8). D-067: o ofensivo chega armado.
      if (!o.efeito) continue;
      consumidos.add(o.objetoId);
      if (EFEITOS_OFENSIVOS.has(o.efeito.tipo)) armarBuff(estado, ctx, quem, o.efeito, saida);
      else aplicarEfeito(estado, ctx, quem, o.efeito, { id: quem.id, x: quem.x, y: quem.y }, null, saida);
      saida.push({ t: 'coletou', tick: estado.tick, id: quem.id, objetoId: o.objetoId, tipo: o.tipo, ganho: 1, itemId: null });
      continue;
    }
    const ganho = ganhoDoObjeto(o, quem);
    if (ganho <= 0) continue;
    consumidos.add(o.objetoId);
    if (o.tipo === 'orbe_hp') quem.hp += ganho;
    else quem.mana += ganho;
    saida.push({ t: 'coletou', tick: estado.tick, id: quem.id, objetoId: o.objetoId, tipo: o.tipo, ganho, itemId: null });
  }
  if (consumidos.size > 0) estado.objetos = estado.objetos.filter((o) => !consumidos.has(o.objetoId));
}

const VIZINHANCA: readonly (readonly [number, number])[] = [
  [0, 0],
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
];

/** A célula pode já ter um objeto: tenta ela e as vizinhas passáveis, numa ordem fixa. */
export function largarPerto(ctx: ContextoSimulacao, x0: number, y0: number, largar: (x: number, y: number) => boolean): boolean {
  for (const [dx, dy] of VIZINHANCA) {
    const x = x0 + dx;
    const y = y0 + dy;
    if (passavel(ctx.fase, x, y) && largar(x, y)) return true;
  }
  return false;
}

/** Coloca um orbe no mundo, se a célula estiver livre de outro objeto. */
export function largarObjeto(
  estado: EstadoJogo,
  tipo: 'orbe_hp' | 'orbe_recurso',
  x: number,
  y: number,
  valor: number,
  modo: 'abs' | 'pct',
  saida: EventoSimulacao[],
  objetoId = `d:${estado.proximoId++}`,
): boolean {
  if (estado.objetos.some((o) => o.x === x && o.y === y)) return false;
  estado.objetos.push(novoObjeto(objetoId, tipo, x, y, { valor, modo }));
  saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo, x, y });
  return true;
}

/** Coloca um item (`qtd` unidades) no mundo, se a célula estiver livre de outro objeto. */
export function largarItem(
  estado: EstadoJogo,
  itemId: string,
  x: number,
  y: number,
  saida: EventoSimulacao[],
  qtd = 1,
  objetoId = `d:${estado.proximoId++}`,
  ref: string | null = null,
): boolean {
  if (estado.objetos.some((o) => o.x === x && o.y === y)) return false;
  estado.objetos.push(novoObjeto(objetoId, 'item', x, y, { valor: qtd, itemId, ref }));
  saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo: 'item', x, y });
  return true;
}

/** Coloca ouro no mundo (marco 9A), se a célula estiver livre de outro objeto. */
export function largarOuro(estado: EstadoJogo, quantia: number, x: number, y: number, saida: EventoSimulacao[]): boolean {
  if (quantia <= 0 || estado.objetos.some((o) => o.x === x && o.y === y)) return false;
  const objetoId = `d:${estado.proximoId++}`;
  estado.objetos.push(novoObjeto(objetoId, 'ouro', x, y, { valor: quantia }));
  saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo: 'ouro', x, y });
  return true;
}

/** Coloca um orbe de efeito no mundo (marco 8A), se a célula estiver livre de outro objeto. */
export function largarOrbeEfeito(
  estado: EstadoJogo,
  efeito: EfeitoCanonico,
  x: number,
  y: number,
  saida: EventoSimulacao[],
  objetoId = `d:${estado.proximoId++}`,
): boolean {
  if (estado.objetos.some((o) => o.x === x && o.y === y)) return false;
  estado.objetos.push(novoObjeto(objetoId, 'orbe_efeito', x, y, { efeito: { ...efeito } }));
  saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo: 'orbe_efeito', x, y });
  return true;
}
