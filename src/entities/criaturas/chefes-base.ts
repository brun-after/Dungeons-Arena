// Marco 45 (16/11/2026, D-182): o que as mecânicas de chefe partilham — os números com padrão, os objetos que o chefe
// põe na arena, as marcas no chão, a regra declarada e o dano direto. Puro.

import type { Celula } from '../../core/comandos';
import type { ContextoSimulacao } from '../../core/contexto';
import type { EstadoJogo } from '../../core/estado';
import type { EventoSimulacao } from '../../core/eventos-simulacao';
import { ticksDe } from '../../core/tempo';
import { aplicarEfeito } from '../../combat/efeitos';
import { vizinhasLivres } from '../../combat/efeitos-fluxo';
import { construirEfeito } from '../../combat/registro-efeitos';
import { passavel } from '../../world/fase';
import { criarInimigo } from '../fabrica';
import { vivo, type Entidade } from '../entidade';
import type { EstadoCriatura, MecanicaDeChefe } from './tipos';

export const numero = (m: MecanicaDeChefe, chave: string, padrao: number): number => m.numeros[chave] ?? padrao;

export const criaturaDoChefe = (e: Entidade): EstadoCriatura => (e.criatura ??= {});

/** Os objetos vivos que o chefe pôs na arena. */
export function objetosVivos(estado: EstadoJogo, chefe: Entidade): Entidade[] {
  const ids = chefe.criatura?.objetos ?? [];
  return estado.entidades.filter((o) => ids.includes(o.id) && vivo(o));
}

/** Uma célula livre perto do ponto (o ponto, se dá). */
function celulaPerto(estado: EstadoJogo, ctx: ContextoSimulacao, quem: Entidade, c: Celula): Celula | null {
  if (passavel(ctx.fase, c.x, c.y) && !estado.entidades.some((o) => vivo(o) && Math.round(o.x) === c.x && Math.round(o.y) === c.y)) return c;
  return vizinhasLivres(estado, ctx, quem, c)[0] ?? null;
}

/** Põe um preset na arena, do lado do chefe (o objeto ou o lacaio), e o guarda nos objetos dele. */
export function porNaArena(estado: EstadoJogo, ctx: ContextoSimulacao, chefe: Entidade, presetId: string, onde: Celula, saida: EventoSimulacao[]): Entidade | null {
  const p = ctx.conteudo.presets.get(presetId);
  const c = p ? celulaPerto(estado, ctx, chefe, onde) : null;
  if (!p || !c || estado.entidades.length >= ctx.modo.limites.npcs) return null;
  const o = criarInimigo(p, `a${String(estado.proximoId++)}`, c.x, c.y, ctx.balance, { nivel: chefe.nivel });
  o.equipe = chefe.equipe;
  o.criatura = { donoId: chefe.id, nascidoTick: estado.tick };
  estado.entidades.push(o);
  const cc = criaturaDoChefe(chefe);
  cc.objetos = [...(cc.objetos ?? []).filter((id) => estado.entidades.some((x) => x.id === id && vivo(x))), o.id];
  if (p.dimensao) saida.push({ t: 'fenda', tick: estado.tick, id: o.id, dimensao: p.dimensao, x: c.x, y: c.y });
  return o;
}

/** `qtd` pontos num anel de raio `raio` em volta do centro (do norte, no sentido do relógio). */
export function anel(centro: Celula, raio: number, qtd: number): Celula[] {
  return [...Array(qtd).keys()].map((i) => {
    const a = (i / qtd) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.round(centro.x + Math.cos(a) * raio), y: Math.round(centro.y + Math.sin(a) * raio) };
  });
}

/** Marca uma zona no chão (fica no estado do chefe e sai o evento para a tela). */
export function marcarZona(estado: EstadoJogo, chefe: Entidade, tipo: string, c: Celula, raio: number, ms: number, saida: EventoSimulacao[]): void {
  const cc = criaturaDoChefe(chefe);
  const ateTick = estado.tick + ticksDe(ms);
  (cc.zonas ??= []).push({ tipo, x: c.x, y: c.y, raio, ateTick });
  saida.push({ t: 'zonaDoChefe', tick: estado.tick, id: chefe.id, tipo, x: c.x, y: c.y, raio, ateTick });
}

export function declararRegra(estado: EstadoJogo, chefe: Entidade, regra: string, ms: number, saida: EventoSimulacao[]): void {
  const cc = criaturaDoChefe(chefe);
  cc.regra = regra;
  cc.regraAteTick = estado.tick + ticksDe(ms);
  saida.push({ t: 'regraDoChefe', tick: estado.tick, id: chefe.id, regra, ateTick: cc.regraAteTick });
}

export function ferir(estado: EstadoJogo, ctx: ContextoSimulacao, chefe: Entidade, alvo: Entidade, valor: number, saida: EventoSimulacao[]): void {
  aplicarEfeito(estado, ctx, alvo, construirEfeito('dano_direto', { valor: Math.max(1, Math.round(valor)) }), { id: chefe.id, x: chefe.x, y: chefe.y }, null, saida);
}
