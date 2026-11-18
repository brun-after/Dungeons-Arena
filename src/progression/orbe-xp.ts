// 16/11/2026 (D-184): a luz de XP. O XP do abate não entra mais sozinho: cada um que tem parte nele (quem abateu e os
// aliados da partilha) ganha a sua luz onde o inimigo caiu. Só o dono a vê (o render e a área de interesse a escondem
// dos outros) e só ele a pega, bastando chegar perto (`raioColeta`), sem pisar em cima como nos itens. A luz brilha
// mais quanto mais XP leva, pela fração do nível do dono. Com sorte, o inimigo abaixo do nível do dono rende 3× ou 5×.

import type { Balance, ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio, criarRng, hashTexto } from '../core/rng';
import { vivo, type Entidade } from '../entities/entidade';
import { novoObjeto } from '../world/objeto-novo';
import { concederXpDeProgressao, xpParaProximo } from './nivel';

/** O XP deste abate cai no chão? Onde o modo quer (com objetos de fase) e só de criatura; derrubar jogador paga direto. */
export function xpVaiAoChao(ctx: ContextoSimulacao, morto: Entidade): boolean {
  return !!ctx.modo.xpNoChao && ctx.modo.objetosDeFase && morto.controlador === 'ia';
}

/**
 * O multiplicador da sorte para `dono` no abate de `morto`: só contra inimigo abaixo do nível do dono, com um RNG
 * próprio da morte (não desloca o do combate nem o do loot). 1 sem sorte.
 */
export function sorteDoXp(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, morto: Entidade): number {
  if (morto.nivel >= dono.nivel) return 1;
  const rng = criarRng(hashTexto(`${estado.faseId}/${morto.id}/${String(morto.geracao)}/${dono.id}/${String(estado.tick)}/xp`));
  const sorteio = aleatorio(rng) * 100;
  let acumulado = 0;
  for (const s of ctx.balance.xp.orbe.sorte) {
    acumulado += s.chancePct;
    if (sorteio < acumulado) return s.multiplicador;
  }
  return 1;
}

/** Deixa a luz de `xp` para `dono` em (x, y); junta com a dele que já estiver na mesma célula. */
export function largarOrbeXp(estado: EstadoJogo, dono: Entidade, xp: number, sorte: number, x: number, y: number, saida: EventoSimulacao[]): void {
  if (xp <= 0) return;
  const junto = estado.objetos.find((o) => o.tipo === 'orbe_xp' && o.ref === dono.id && o.x === x && o.y === y);
  if (junto) {
    junto.valor += xp;
    junto.largadoTick = estado.tick;
    if (sorte > (junto.xpSorte ?? 1)) junto.xpSorte = sorte;
    return;
  }
  const objetoId = `d:${estado.proximoId++}`;
  estado.objetos.push(novoObjeto(objetoId, 'orbe_xp', x, y, { valor: xp, ref: dono.id, largadoTick: estado.tick, ...(sorte > 1 ? { xpSorte: sorte } : {}) }));
  saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo: 'orbe_xp', x, y });
}

/** O dono pega as luzes dele que estão a até `raioColeta` células; quem não é o dono nunca pega. */
export function coletarOrbesXp(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  if (!estado.objetos.some((o) => o.tipo === 'orbe_xp')) return;
  const raio = ctx.balance.xp.orbe.raioColeta;
  const pegos = new Set<string>();
  for (const o of estado.objetos) {
    if (o.tipo !== 'orbe_xp' || !o.ref) continue;
    const dono = estado.entidades.find((e) => e.id === o.ref);
    if (!dono || dono.controlador === 'ia' || !vivo(dono) || Math.max(Math.abs(dono.x - o.x), Math.abs(dono.y - o.y)) > raio) continue;
    pegos.add(o.objetoId);
    saida.push({ t: 'coletou', tick: estado.tick, id: dono.id, objetoId: o.objetoId, tipo: 'orbe_xp', ganho: Math.max(1, Math.round(o.valor)), itemId: null });
    concederXpDeProgressao(dono, ctx, o.valor, estado.tick, saida);
  }
  if (pegos.size > 0) estado.objetos = estado.objetos.filter((o) => !pegos.has(o.objetoId));
}

/**
 * O brilho da luz (0,15 a 1): cresce com o XP em escala de raiz, até `brilhoRefPct`% do XP que falta ao nível do dono
 * acender por inteiro. Puro: o render usa com o nível do jogador local (só ele a vê).
 */
export function brilhoDoOrbeXp(o: Pick<ObjetoNoMundo, 'valor'>, nivelDono: number, balance: Balance): number {
  const ref = Math.max(1, (xpParaProximo(nivelDono, balance.xp) * balance.xp.orbe.brilhoRefPct) / 100);
  return Math.min(1, 0.15 + 0.85 * Math.sqrt(Math.max(0, o.valor) / ref));
}
