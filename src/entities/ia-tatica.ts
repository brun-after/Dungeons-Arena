// Marco 25 (25/10/2026, D-100): a tática da IA dos inimigos, pelo perfil da dificuldade (balance.dificuldades.<d>.ia).
// - esquiva: dentro da área telegrafada de um golpe hostil, sai para a vizinha livre fora dela;
// - cerco: os perseguidores corpo a corpo de um alvo repartem as células em volta dele;
// - cura: o afim ferido vai à área do próprio elemento e fica até sarar;
// - foco: troca para o alvo mais ferido por perto;
// - perigo: na perseguição, contorna o chão que fere (world/perigos.ts).
// Os sorteios são por chave (world/perigos.ts::sorteioPct), sem gastar o PRNG da IA.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import { alvoOfensivoValido, origemDaHabilidade } from '../combat/acao';
import { celulasDaForma } from '../combat/formas';
import { celulaOcupada, chebyshev } from '../combat/geometria';
import { habilidadeDoAtor } from '../combat/perfil';
import type { PerfilIa } from '../modos/dificuldade';
import { podeFerir } from '../modos/relacao';
import { passavel } from '../world/fase';
import { celulaLivre } from '../world/movimento';
import { areaAfimMaisProxima, emPerigo, mapaDePerigo, sorteioPct } from '../world/perigos';
import { vivo, type Entidade, type EstadoIa } from './entidade';

const VIZINHAS: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
];

/** O balde do sorteio tático: a mesma decisão por `sorteioTaticoMs`. */
function balde(estado: EstadoJogo, ctx: ContextoSimulacao): number {
  return Math.floor(estado.tick / Math.max(1, ticksDe(ctx.balance.ia.sorteioTaticoMs)));
}

/** A célula para onde fugir da área telegrafada de um golpe hostil em curso (null: fora de área, ou não esquiva). */
export function fugaDoAviso(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, perfil: PerfilIa): Celula | null {
  if (perfil.esquivaAvisoPct <= 0 || ctx.balance.ia.arquetiposFirmes.includes(e.arquetipo)) return null;
  const minha = celulaOcupada(e);
  for (const outro of estado.entidades) {
    const acao = outro.acao;
    if (!acao || outro === e || !vivo(outro) || acao.lancamentoTick <= estado.tick || !podeFerir(outro, e, ctx.modo)) continue;
    const hab = habilidadeDoAtor(ctx, outro, acao.habilidadeId);
    if (hab?.politicaImpacto !== 'area') continue;
    const area = celulasDaForma(hab, origemDaHabilidade(estado, outro, hab), { x: acao.alvoX, y: acao.alvoY }, ctx.fase);
    const dentro = (x: number, y: number) => area.some((c) => c.x === x && c.y === y);
    if (!dentro(minha.x, minha.y) || !sorteioPct(`esquiva:${acao.acaoId}:${e.id}`, perfil.esquivaAvisoPct)) continue;
    // A célula livre fora da área (e fora de perigo) mais perto, até 2 passos; no empate, a que mais se afasta do
    // centro da mira. A de 2 passos precisa de uma vizinha livre no meio.
    let melhor: { c: Celula; passos: number; d: number } | null = null;
    for (let y = minha.y - 2; y <= minha.y + 2; y++) {
      for (let x = minha.x - 2; x <= minha.x + 2; x++) {
        const passos = Math.abs(x - minha.x) + Math.abs(y - minha.y);
        if (passos === 0 || passos > 2 || dentro(x, y) || !celulaLivre(e, x, y, estado, ctx) || emPerigo(estado, ctx, e, x, y)) continue;
        if (passos === 2 && !VIZINHAS.slice(0, 4).some(([dx, dy]) => Math.abs(x - minha.x - dx) + Math.abs(y - minha.y - dy) === 1 && celulaLivre(e, minha.x + dx, minha.y + dy, estado, ctx))) continue;
        const d = (x - acao.alvoX) ** 2 + (y - acao.alvoY) ** 2;
        if (!melhor || passos < melhor.passos || (passos === melhor.passos && d > melhor.d)) melhor = { c: { x, y }, passos, d };
      }
    }
    if (melhor) return melhor.c;
  }
  return null;
}

/**
 * A célula em volta do alvo que cabe a este perseguidor corpo a corpo: os perseguidores do alvo, em ordem de id,
 * escolhem cada um a vizinha livre mais perto de si que ainda ninguém escolheu.
 */
export function celulaDeCerco(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, alvo: Entidade): Celula | null {
  const centro = celulaOcupada(alvo);
  const livres = VIZINHAS.map(([dx, dy]) => ({ x: centro.x + dx, y: centro.y + dy })).filter((c) => passavel(ctx.fase, c.x, c.y));
  const perseguidores = estado.entidades
    .filter((o) => o.ia?.modo === 'perseguindo' && o.ia.alvoId === alvo.id && vivo(o) && o.arquetipo !== 'atirador' && o.arquetipo !== 'controlador')
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const tomadas = new Set<number>();
  for (const p of perseguidores) {
    let escolha = -1;
    for (let i = 0; i < livres.length; i++) {
      const c = livres[i];
      if (!c || tomadas.has(i)) continue;
      const atual = escolha >= 0 ? livres[escolha] : undefined;
      if (!atual || chebyshev(c, p) < chebyshev(atual, p)) escolha = i;
    }
    if (escolha < 0) return null;
    if (p === e) return livres[escolha] ?? null;
    tomadas.add(escolha);
  }
  return null;
}

/** Para onde o afim ferido vai se curar (null: não vai). Liga e desliga `ia.curando`. */
export function destinoDeCura(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, perfil: PerfilIa): Celula | null {
  const r = ctx.balance.ia;
  if (!e.afinidade) return null;
  if (ia.curando) {
    if (e.hp * 100 >= e.hpMax * r.curaAfimSaiPct) ia.curando = false;
  } else if (e.hp * 100 < e.hpMax * perfil.curaHpPct && sorteioPct(`cura:${e.id}:${balde(estado, ctx)}`, perfil.curaAfimPct)) {
    ia.curando = true;
  }
  if (!ia.curando) return null;
  const c = areaAfimMaisProxima(ctx, e, r.curaAfimRaio);
  if (!c) ia.curando = false;
  return c;
}

/** O alvo mais ferido (fração de vida) por perto, se o perfil quiser trocar agora (null: fica com o atual). */
export function alvoMaisFerido(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, atual: Entidade, raio: number, perfil: PerfilIa): Entidade | null {
  if (!sorteioPct(`foco:${e.id}:${balde(estado, ctx)}`, perfil.focoFracoPct)) return null;
  const fracao = (x: Entidade) => x.hp / Math.max(1, x.hpMax);
  let melhor: Entidade | null = null;
  for (const o of estado.entidades) {
    if (o === atual || o === e || chebyshev(o, e) > raio || !alvoOfensivoValido(estado, ctx, e, o)) continue;
    if (fracao(o) < fracao(melhor ?? atual)) melhor = o;
  }
  return melhor;
}

/** O mapa de perigo para planejar o caminho, se o perfil desta vez evita (null: anda reto, pisa no que houver). */
export function perigoDoCaminho(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, perfil: PerfilIa): Uint8Array | null {
  if (perfil.evitaPerigoPct <= 0) return null;
  const mapa = mapaDePerigo(estado, ctx, e);
  return mapa && sorteioPct(`perigo:${e.id}:${balde(estado, ctx)}`, perfil.evitaPerigoPct) ? mapa : null;
}
