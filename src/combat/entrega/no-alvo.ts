// Marco 49 (21/11/2026, D-194): o que a entrega faz no caminho, no acerto e na chegada — a trilha marcada, o par
// convergente que se encontra, o corpo grande que esmaga e empurra, o chão amaldiçoado e a erupção que ficam, o efeito
// que gira ou pulsa no alvo, a área que cai do céu ou sobe do círculo, e o retorno que traz vida ou escudo. Os
// ganchos são chamados por combat/projeteis.ts em cada sub-passo. Puro e determinístico.

import type { Celula } from '../../core/comandos';
import type { ContextoSimulacao } from '../../core/contexto';
import { buscarEntidade, novoId, type EstadoJogo, type Projetil } from '../../core/estado';
import type { EventoSimulacao } from '../../core/eventos-simulacao';
import { ticksDe } from '../../core/tempo';
import { vivo, type Entidade } from '../../entities/entidade';
import { podeFerir } from '../../modos/relacao';
import type { FonteDeDano } from '../dano';
import { faixaDaFormula } from '../dados';
import { aplicarEfeito, REGISTRO_EFEITOS } from '../efeitos';
import { celulaOcupada, chebyshev } from '../geometria';
import { aplicarImpacto } from '../golpe';
import type { Habilidade } from '../habilidades';
import { impactoEmArea } from '../impacto-area';
import { fonteDoProjetil } from '../projeteis-variacoes';
import { construirEfeito } from '../registro-efeitos';
import { criarSolo, soloDaEntrega } from '../solos';
import { direcaoEm, pontoEm } from './rota';

/** Anda `passo` células na rota (a posição, a direção do voo e o que ainda falta). */
export function andarNaRota(p: Projetil, passo: number): void {
  const r = p.rota;
  if (!r) return;
  const t = Math.min(1, (p.t ?? 0) + passo / Math.max(1e-6, r.comp));
  const ponto = pontoEm(r, t);
  const d = direcaoEm(r, t);
  p.t = t;
  p.x = ponto.x;
  p.y = ponto.y;
  p.dirX = d.x;
  p.dirY = d.y;
  p.restante = (1 - t) * r.comp;
}

/** A altura agora acima do voo comum (a parábola, a queda; a coluna ainda sob o chão é negativa). */
export const alturaNaRota = (p: Projetil): number => (p.rota ? pontoEm(p.rota, p.t ?? 0).z : 0);

/** A área da skill que chega no fim da rota (o céu, o círculo sob o alvo e a magia de área que voa). */
const chegaEmArea = (p: Projetil, hab: Habilidade): boolean =>
  (hab.politicaImpacto === 'area' && hab.entrega?.cadencia !== 'rajada') || p.rota?.tipo === 'queda' || p.rota?.tipo === 'coluna';

/** Ainda não fere: o retorno, a magia de área que voa (fora o chão), a queda e a coluna, e a parábola subindo. */
export function noArDaEntrega(ctx: ContextoSimulacao, p: Projetil, hab: Habilidade | undefined): boolean {
  if (p.traz) return true;
  if (!p.rota || !hab) return false;
  if (chegaEmArea(p, hab) && hab.entrega?.origem !== 'chao') return true;
  return p.rota.tipo === 'parabola' && (p.t ?? 0) < ctx.balance.entrega.parabola.acertaDe;
}

/** Passa por cima das paredes: alto o bastante (a parábola no meio, a queda) ou subindo do chão sob o alvo. */
export const passaPorCima = (p: Projetil): boolean => !!p.rota && (p.rota.tipo === 'coluna' || alturaNaRota(p) > 0.8);

/** O raio de toque: a espiral, o corpo grande e os grãos tocam quem está perto da linha. */
export function toqueDaEntrega(ctx: ContextoSimulacao, hab: Habilidade | undefined): number {
  const e = hab?.entrega;
  if (!e) return 0;
  const r = ctx.balance.entrega;
  if (e.corpo === 'grande') return r.grande.toque;
  if (e.trajetoria === 'espiral') return r.espiral.toque;
  if (e.corpo === 'graos') return r.graos.toque;
  return 0;
}

/** O hostil mais perto do projétil a até `raio` células (desempate pelo id). */
export function alvoPerto(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, raio: number): Entidade | null {
  const dono = buscarEntidade(estado, p.donoId) ?? { id: p.donoId, equipe: p.equipeDono };
  let escolhido: Entidade | null = null;
  let melhor = Infinity;
  for (const e of estado.entidades) {
    if (e.id === p.donoId || !vivo(e) || !podeFerir(dono, e, ctx.modo) || p.atingidos.includes(e.id)) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d > raio) continue;
    if (d < melhor || (d === melhor && escolhido && e.id < escolhido.id)) {
      melhor = d;
      escolhido = e;
    }
  }
  return escolhido;
}

/** O golpe médio da skill (para a trilha, que fere por valor fixo). */
function golpeMedio(p: Projetil, hab: Habilidade): number {
  if (!hab.formulaDano) return 0;
  const f = faixaDaFormula(hab.formulaDano);
  return ((f.min + f.max) / 2 + p.bonusAtributo) * p.multRolagem * p.multDano;
}

/** A trilha: cada célula nova do caminho fica marcada pelo elemento por um tempo. */
export function trilhar(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, hab: Habilidade | undefined): void {
  if (!hab || hab.entrega?.marca !== 'trilha' || p.traz) return;
  const cx = Math.round(p.x);
  const cy = Math.round(p.y);
  if (cx === p.trilhaX && cy === p.trilhaY) return;
  p.trilhaX = cx;
  p.trilhaY = cy;
  const r = ctx.balance.entrega.trilha;
  const valor = Math.max(1, Math.round((golpeMedio(p, hab) * r.pctDoGolpe) / 100));
  estado.rastros.push({ x: cx, y: cy, donoId: p.donoId, equipeDono: p.equipeDono, tipo: 'rastro_dano', valor, interno: null, ateTick: estado.tick + ticksDe(r.duracaoMs), atingidos: [] });
}

/** O par convergente: se o irmão acertou o mesmo alvo há pouco, este chega com o bônus do encontro. */
export function antesDoAcerto(ctx: ContextoSimulacao, estado: EstadoJogo, p: Projetil, alvo: Entidade): void {
  if (p.parAlvoId === alvo.id && estado.tick - (p.parTick ?? -99) <= 2) {
    p.multDano *= 1 + ctx.balance.entrega.convergente.encontroPct / 100;
    delete p.parAlvoId;
  }
}

/** O chão amaldiçoado e a erupção que ficam onde a magia caiu (um solo da entrega). */
export function deixarNoChao(estado: EstadoJogo, ctx: ContextoSimulacao, hab: Habilidade, c: Celula, dono: { id: string; equipe: string }, acaoId: number, fonte: FonteDeDano, saida: EventoSimulacao[]): void {
  const e = hab.entrega;
  if (!e) return;
  for (const tipo of ['marca', 'erupcao'] as const) {
    if ((tipo === 'marca' && e.marca !== 'chao') || (tipo === 'erupcao' && e.permanencia !== 'erupcao')) continue;
    const def = soloDaEntrega(ctx, tipo);
    criarSolo(estado, def, {
      id: novoId(estado), acaoId, donoId: dono.id, equipeDono: dono.equipe, chave: hab.chave, habilidadeId: hab.id,
      x: Math.round(c.x), y: Math.round(c.y), dirX: 0, dirY: 0, raio: def.raio, pulsosRestantes: def.pulsos, pulsados: 0,
      proximoTick: estado.tick + ticksDe(def.atrasoMs), saltos: 0, entrega: tipo,
      bonusAtributo: fonte.bonusAtributo, carisma: fonte.carisma, multRolagem: fonte.multRolagem, potencia: fonte.potencia,
      multDano: fonte.multDano, multCura: fonte.multCura, ...(fonte.d20Minimo ? { d20Minimo: fonte.d20Minimo } : {}),
    }, saida);
  }
}

/** Prende o projétil no alvo para girar ou pulsar nele (a permanência). */
function prender(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, alvo: Entidade, hab: Habilidade): boolean {
  const tipo = hab.entrega?.permanencia;
  if ((tipo !== 'gira' && tipo !== 'pulsa') || !vivo(alvo)) return false;
  const r = ctx.balance.entrega;
  const intervalo = tipo === 'gira' ? r.gira.intervaloMs : r.pulsa.intervaloMs;
  p.perm = { alvoId: alvo.id, ateTick: estado.tick + ticksDe(r.permanenciaMs), proximoTick: estado.tick + ticksDe(intervalo), voltas: 0 };
  return true;
}

/** Depois do acerto: o encontro do par, o corpo grande, o que fica no chão e no alvo. Devolve `continua` se segue. */
export function depoisDoAcerto(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, alvo: Entidade, hab: Habilidade, saida: EventoSimulacao[]): 'continua' | null {
  const e = hab.entrega;
  if (!e) return null;
  const r = ctx.balance.entrega;
  if (p.parId !== undefined) {
    const irmao = estado.projeteis.find((x) => x.id === p.parId);
    if (irmao) {
      irmao.parAlvoId = alvo.id;
      irmao.parTick = estado.tick;
    }
  }
  const c = celulaOcupada(alvo);
  const origem = { id: p.donoId, x: Math.round(p.x - p.dirX), y: Math.round(p.y - p.dirY), acaoId: p.acaoId };
  if (e.corpo === 'grande') {
    // O corpo grande quebra o escudo, empurra e respinga em volta.
    alvo.efeitos = alvo.efeitos.filter((f) => !REGISTRO_EFEITOS[f.tipo].escudo);
    if (vivo(alvo)) aplicarEfeito(estado, ctx, alvo, construirEfeito('empurrao', { valor: r.grande.empurra }), origem, null, saida);
    const dono = { id: p.donoId, equipe: p.equipeDono };
    estado.entidades
      .filter((x) => x !== alvo && vivo(x) && x.id !== p.donoId && !p.atingidos.includes(x.id) && podeFerir(dono, x, ctx.modo) && chebyshev(c, celulaOcupada(x)) <= r.grande.raioImpacto)
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .forEach((x, i) => {
        aplicarImpacto(estado, ctx, x, { acaoId: p.acaoId, fonte: fonteDoProjetil(estado, p, r.grande.respingoPct / 100), hab, indice: i + 1, secundario: true }, saida);
        p.atingidos.push(x.id);
      });
  }
  deixarNoChao(estado, ctx, hab, c, { id: p.donoId, equipe: p.equipeDono }, p.acaoId, fonteDoProjetil(estado, p), saida);
  return prender(estado, ctx, p, alvo, hab) ? 'continua' : null;
}

/** O giro e o pulso no alvo, por tick. Devolve `fim` quando acaba (o tempo, ou o alvo caiu). */
export function permanecer(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, hab: Habilidade | undefined, saida: EventoSimulacao[]): 'segue' | 'fim' {
  const perm = p.perm;
  const tipo = hab?.entrega?.permanencia;
  if (!perm || !hab || (tipo !== 'gira' && tipo !== 'pulsa')) return 'fim';
  const alvo = buscarEntidade(estado, perm.alvoId);
  if (!alvo || !vivo(alvo) || estado.tick >= perm.ateTick) return 'fim';
  const r = ctx.balance.entrega;
  if (tipo === 'gira') {
    const ang = ((estado.tick % 30) / 30) * 2 * Math.PI * (p.rota?.lado ?? 1);
    p.x = alvo.x + Math.cos(ang) * 0.8;
    p.y = alvo.y + Math.sin(ang) * 0.8;
    p.dirX = -Math.sin(ang);
    p.dirY = Math.cos(ang);
  } else {
    p.x = alvo.x;
    p.y = alvo.y;
  }
  if (estado.tick < perm.proximoTick) return 'segue';
  perm.voltas++;
  perm.proximoTick = estado.tick + ticksDe(tipo === 'gira' ? r.gira.intervaloMs : r.pulsa.intervaloMs);
  const pct = tipo === 'gira' ? r.gira.voltaPct : r.pulsa.pulsoPct;
  const alvos = [alvo];
  // O giro toca também quem chega perto do alvo.
  if (tipo === 'gira') {
    const dono = { id: p.donoId, equipe: p.equipeDono };
    const c = celulaOcupada(alvo);
    alvos.push(...estado.entidades.filter((x) => x !== alvo && vivo(x) && x.id !== p.donoId && podeFerir(dono, x, ctx.modo) && chebyshev(c, celulaOcupada(x)) <= r.gira.raioToque).sort((a, b) => (a.id < b.id ? -1 : 1)));
  }
  alvos.forEach((x, indice) => {
    aplicarImpacto(estado, ctx, x, { acaoId: p.acaoId, fonte: fonteDoProjetil(estado, p, pct / 100), hab, indice, secundario: true }, saida);
  });
  return 'segue';
}

/** O fim da rota: o retorno entrega o que traz; a área cai; o que errou deixa o chão marcado onde chegou. */
export function chegar(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, hab: Habilidade | undefined, saida: EventoSimulacao[]): void {
  const dono = buscarEntidade(estado, p.donoId);
  if (p.traz) {
    if (!dono || !vivo(dono)) return;
    const r = ctx.balance.entrega;
    const ef = p.traz.tipo === 'vida' ? construirEfeito('cura', { valor: p.traz.valor }) : construirEfeito('escudo', { valor: p.traz.valor, duracaoMs: r.invocacao.escudoMs });
    if (p.traz.valor > 0) aplicarEfeito(estado, ctx, dono, ef, { id: dono.id, x: dono.x, y: dono.y }, null, saida);
    return;
  }
  if (!hab || !p.rota) return;
  const destino = { x: Math.round(p.rota.dx), y: Math.round(p.rota.dy) };
  if (chegaEmArea(p, hab)) {
    if (!dono) return;
    const r = ctx.balance.entrega;
    // Cada grão fere só a célula onde cai; a linha e o cone que chegam voando viram o quadrado do ponto.
    const graos = hab.entrega?.corpo === 'graos';
    const extra = p.rota.tipo === 'queda' && !graos ? r.ceu.raioExtra : 0;
    const raio = (hab.politicaImpacto === 'area' && hab.tipoArea === 'quadrado' && !graos ? hab.raioArea : 0) + extra;
    const area: Habilidade = { ...hab, politicaImpacto: 'area', tipoArea: 'quadrado', raioArea: raio };
    impactoEmArea(estado, ctx, dono, area, { acaoId: p.acaoId, fonte: fonteDoProjetil(estado, p), hab: area, mira: destino }, destino, destino, saida);
  }
  deixarNoChao(estado, ctx, hab, destino, { id: p.donoId, equipe: p.equipeDono }, p.acaoId, fonteDoProjetil(estado, p), saida);
}
