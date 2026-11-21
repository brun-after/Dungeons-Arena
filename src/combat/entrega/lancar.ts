// Marco 49 (21/11/2026, D-194): o lançamento pela entrega. `lancar` (acao.ts) chama aqui quando a skill tem
// `entrega`: o canal começa (rajada, feixe); o sentido de volta fere o alvo e traz vida; a invocação lança do servo; a
// área que não viaja cai na hora (e deixa o chão e a erupção); o resto vira projéteis em rota (a trajetória, as
// origens, a salva, o par, os grãos), cada um com a sua parte do golpe. Puro e determinístico.

import type { Celula } from '../../core/comandos';
import type { ContextoSimulacao } from '../../core/contexto';
import { novoId, type EstadoJogo, type Projetil } from '../../core/estado';
import type { EventoSimulacao } from '../../core/eventos-simulacao';
import { vivo, type Entidade } from '../../entities/entidade';
import { celulaOcupada, chebyshev } from '../geometria';
import { aplicarImpacto, type Impacto } from '../golpe';
import type { Habilidade } from '../habilidades';
import { impactoEmArea } from '../impacto-area';
import { iniciarCanal } from './canal';
import { deixarNoChao } from './no-alvo';
import { criarProjetil, fatorDaEntrega, ligarPares, planejarTiros, rotaDe } from './projetil';
import { direcaoEm } from './rota';

/** O servo de quem lança mais perto do destino (a origem do sentido da invocação). */
function servoDe(estado: EstadoJogo, ator: Entidade, destino: Celula): Entidade | undefined {
  return estado.entidades
    .filter((e) => vivo(e) && e.invocacao?.donoId === ator.id)
    .sort((a, b) => chebyshev(celulaOcupada(a), destino) - chebyshev(celulaOcupada(b), destino) || (a.id < b.id ? -1 : 1))[0];
}

/** O retorno: sai de (x, y) e vai a quem lançou, sem ferir; ao chegar entrega a vida ou o escudo. */
function retorno(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, acaoId: number, de: { x: number; y: number }, traz: NonNullable<Projetil['traz']>, saida: EventoSimulacao[]): void {
  const r = ctx.balance.entrega;
  const id = novoId(estado);
  const rota = rotaDe({ de, para: celulaOcupada(ator), tipo: 'reta', lado: 1, desvio: 0, mult: 1, saiEmMs: 0 }, r, id);
  const d = direcaoEm(rota, 0);
  const p: Projetil = {
    id, acaoId, donoId: ator.id, equipeDono: ator.equipe, habilidadeId: hab.id, chave: hab.chave,
    x: rota.ox, y: rota.oy, dirX: d.x, dirY: d.y, restante: rota.comp, velocidade: r.volta.velocidade,
    bonusAtributo: 0, carisma: 0, multRolagem: 1, potencia: 1, multDano: 0, multCura: 1, atravessa: true, atingidos: [],
    rota, t: 0, traz,
  };
  estado.projeteis.push(p);
  saida.push({ t: 'projetilLancado', tick: estado.tick, projetilId: p.id, acaoId, donoId: ator.id, habilidadeId: hab.id, chave: hab.chave });
}

/** Alvo → usuário: a magia nasce no alvo (fere com a parte do golpe) e volta trazendo parte do dano como vida. */
function golpeDeVolta(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, base: Omit<Impacto, 'indice'>, alvo: Entidade, saida: EventoSimulacao[]): void {
  const e = hab.entrega;
  if (!e) return;
  const r = ctx.balance.entrega;
  const fonte = { ...base.fonte, multDano: base.fonte.multDano * fatorDaEntrega(e, r) };
  const antes = alvo.hp;
  aplicarImpacto(estado, ctx, alvo, { ...base, fonte, indice: 0 }, saida);
  const dano = Math.max(0, antes - alvo.hp);
  const c = celulaOcupada(alvo);
  deixarNoChao(estado, ctx, hab, c, ator, base.acaoId, fonte, saida);
  retorno(estado, ctx, ator, hab, base.acaoId, { x: alvo.x, y: alvo.y }, { tipo: 'vida', valor: Math.round((dano * r.volta.trazPct) / 100) }, saida);
}

/** A área que não viaja: cai agora, com a parte do golpe, e deixa o chão e a erupção no ponto. */
function areaNaHora(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, base: Omit<Impacto, 'indice'>, partida: Celula, mira: Celula, saida: EventoSimulacao[]): void {
  const e = hab.entrega;
  if (!e) return;
  const fonte = { ...base.fonte, multDano: base.fonte.multDano * fatorDaEntrega(e, ctx.balance.entrega) };
  impactoEmArea(estado, ctx, ator, hab, { ...base, fonte }, partida, mira, saida);
  deixarNoChao(estado, ctx, hab, mira, ator, base.acaoId, fonte, saida);
}

/** Lança pela entrega da skill; devolve false se não há entrega (o lançamento comum segue). */
export function lancarEntrega(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, base: Omit<Impacto, 'indice'>, partida: Celula, alvo: Entidade | null, mira: Celula, saida: EventoSimulacao[]): boolean {
  const e = hab.entrega;
  if (!e) return false;
  const r = ctx.balance.entrega;
  if (e.cadencia === 'rajada' || e.cadencia === 'feixe') {
    iniciarCanal(estado, ator, hab, base.fonte, base.acaoId, alvo, mira);
    return true;
  }
  const comAlvo = alvo && alvo !== ator && vivo(alvo) ? alvo : null;
  const destino = comAlvo ? celulaOcupada(comAlvo) : mira;
  if (e.sentido === 'volta' && comAlvo) {
    golpeDeVolta(estado, ctx, ator, hab, base, comAlvo, saida);
    return true;
  }
  let de = partida;
  if (e.sentido === 'invocacao_alvo' || e.sentido === 'invocacao_usuario') {
    const servo = servoDe(estado, ator, destino);
    if (servo) {
      de = celulaOcupada(servo);
      if (e.sentido === 'invocacao_usuario') retorno(estado, ctx, ator, hab, base.acaoId, { x: servo.x, y: servo.y }, { tipo: 'escudo', valor: Math.round((ator.hpMax * r.invocacao.escudoPctVida) / 100) }, saida);
    }
  }
  // A área da mão em reta cai na hora; a que voa (outra trajetória, o céu, o círculo, o chão) chega por um projétil.
  const voa = e.trajetoria !== 'reta' || e.origem === 'ceu' || e.origem === 'sob_alvo' || e.origem === 'chao';
  if (hab.politicaImpacto === 'area' && !voa) {
    areaNaHora(estado, ctx, ator, hab, base, de, mira, saida);
    return true;
  }
  const plano = planejarTiros(e, r, de, hab.politicaImpacto === 'area' ? mira : destino, base.acaoId);
  const criados = plano.map((t) => criarProjetil(estado, ctx, ator, hab, base.acaoId, base.fonte, t, saida));
  ligarPares(criados, plano);
  return true;
}
