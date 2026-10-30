// As variações do básico que viajam (marco 27, 29/10/2026, D-126): o leque, a salva e a imagem (vários projéteis),
// o tiro parabólico, a flecha teleguiada e a curva da machadinha, a tabela nas paredes, o chakram que ricocheteia entre
// inimigos, o estilhaço, o cravar na parede, o bumerangue que volta (e o que gira em volta do alvo, o que se divide,
// o que puxa na volta, o que pousa no falcão e o serrilhado que deixa rastro). Tudo determinístico e em células.
// projeteis.ts chama estes ganchos em cada sub-passo; o estado da variação viaja no próprio projétil (`var`).

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, novoId, type EstadoJogo, type Projetil } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import type { EntidadeId } from '../core/comandos';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { passavel } from '../world/fase';
import { celulaDoCompanheiro } from './companheiro';
import type { FonteDeDano } from './dano';
import { aplicarEfeito } from './efeitos';
import { celulaOcupada, chebyshev } from './geometria';
import { aplicarImpacto } from './golpe';
import type { Habilidade } from './habilidades';
import { construirEfeito } from './registro-efeitos';
import { muralhaEm } from './tatica';
import { girar, type VariacaoBasico } from './variacoes';

/**
 * O estado da variação num projétil em voo, só com primitivos. A definição vem da habilidade, resolvida pela chave
 * como o resto do projétil (não vai para o save nem para o digest).
 */
export interface EstadoVariacao {
  fase: 'ida' | 'volta' | 'orbita';
  /** O alvo (teleguiada, curva, órbita) e o último atingido (o falcão golpeia ele). */
  alvoId?: EntidadeId;
  ultimoId?: EntidadeId;
  /** A salva e a imagem: o projétil espera na mão até este tick (saem em sequência do mesmo ponto). */
  esperaAte?: number;
  /** A célula mirada: a teleguiada escolhe o alvo nela no primeiro passo. */
  miraX?: number;
  miraY?: number;
  paredes: number;
  ricochetes: number;
  /** Na órbita: até quando gira e o próximo golpe. */
  orbitaAte?: number;
  orbitaProximo?: number;
  /** A última célula onde o serrilhado deixou rastro. */
  rastroX?: number;
  rastroY?: number;
  /** A volta dura no máximo tantas células (a garantia de que termina). */
  voltaRestante?: number;
  /** O irmão do divisor volta pelo outro lado. */
  lado?: 1 | -1;
}

/** Quanto o projétil de volta pode andar antes de sumir (não fica preso). */
const VOLTA_MAX = 40;
/** A distância em que o bumerangue "chega" na mão. */
const CHEGOU = 0.6;
/** O raio da órbita da shuriken, em células. */
const RAIO_ORBITA = 0.6;
/** Até onde o chakram procura o próximo inimigo. */
const RAIO_RICOCHETE = 4;

/** Depois de criar o projétil: o estado da variação e o desvio inicial (a curva). */
export function prepararVariacao(p: Projetil, hab: Habilidade, mira: Celula, desvioExtra = 0, esperaAte = 0): void {
  const def = hab.variacao;
  if (!def) return;
  p.var = { fase: 'ida', ...(def.guiado && { miraX: mira.x, miraY: mira.y }), ...(esperaAte > 0 && { esperaAte }), paredes: def.ricocheteParede ?? 0, ricochetes: def.ricochetes ?? 0 };
  // A tabela voa o alcance todo (para achar a parede).
  if (def.ricocheteParede) p.restante = Math.max(p.restante, hab.alcanceCelulas + 0.5);
  if (desvioExtra) {
    const d = girar(p.dirX, p.dirY, desvioExtra);
    p.dirX = d.x;
    p.dirY = d.y;
  }
  if (def.desvioGraus) {
    const d = girar(p.dirX, p.dirY, def.desvioGraus);
    p.dirX = d.x;
    p.dirY = d.y;
    // A curva anda mais que a reta: a folga cobre o arco.
    p.restante *= 1.35;
  }
  if (def.retorna) p.restante = Math.max(p.restante, 2);
}

/** Vira o projétil (dirX, dirY) até `graus` na direção de (tx, ty). */
function virarPara(p: Projetil, tx: number, ty: number, graus: number): void {
  const dx = tx - p.x;
  const dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return;
  const alvoAng = Math.atan2(dy, dx);
  const atual = Math.atan2(p.dirY, p.dirX);
  let delta = alvoAng - atual;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  const max = (graus * Math.PI) / 180;
  const ang = atual + Math.max(-max, Math.min(max, delta));
  p.dirX = Math.cos(ang);
  p.dirY = Math.sin(ang);
}

/** Para onde o bumerangue volta: o falcão (Falcoeiro) ou a mão de quem lançou. */
function destinoDaVolta(estado: EstadoJogo, p: Projetil, def: VariacaoBasico): { x: number; y: number } | null {
  const dono = buscarEntidade(estado, p.donoId);
  if (!dono || !vivo(dono)) return null;
  if (def.voltaAoFalcao) {
    const falcao = celulaDoCompanheiro(estado, dono);
    if (falcao) return falcao;
  }
  return { x: dono.x, y: dono.y };
}

/** O bumerangue vira para voltar: pode acertar de novo quem acertou na ida, com `voltaPct` do golpe. */
export function iniciarVolta(estado: EstadoJogo, p: Projetil, def: VariacaoBasico, saida: EventoSimulacao[]): boolean {
  const v = p.var;
  if (!v || !def.retorna || v.fase === 'volta') return false;
  v.fase = 'volta';
  v.voltaRestante = VOLTA_MAX;
  p.atingidos = [];
  p.multDano *= (def.voltaPct ?? 60) / 100;
  if (def.divisor && !v.lado) {
    // Bumerangue duplo: no ápice vira dois, que voltam abrindo para os lados.
    v.lado = 1;
    const irmao: Projetil = { ...p, id: novoId(estado), atingidos: [], var: { ...v, lado: -1 } };
    estado.projeteis.push(irmao);
    saida.push({ t: 'projetilLancado', tick: estado.tick, projetilId: irmao.id, acaoId: p.acaoId, donoId: p.donoId, habilidadeId: p.habilidadeId, chave: p.chave });
  }
  return true;
}

/** Bateu numa parede: quica (Tabela), começa a volta (bumerangue) ou acaba. Devolve se continua. */
export function naParede(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, def: VariacaoBasico, passo: number, saida: EventoSimulacao[]): boolean {
  const v = p.var;
  if (!v) return false;
  if (v.fase === 'volta') return true;
  if (v.paredes > 0) {
    // Volta ao ponto de antes e inverte o eixo que bateu.
    p.x -= p.dirX * passo;
    p.y -= p.dirY * passo;
    const bloqueia = (x: number, y: number) => !passavel(ctx.fase, Math.round(x), Math.round(y)) || !!muralhaEm(estado, Math.round(x), Math.round(y));
    const bx = bloqueia(p.x + p.dirX * 0.5, p.y);
    const by = bloqueia(p.x, p.y + p.dirY * 0.5);
    if (bx) p.dirX = -p.dirX;
    if (by) p.dirY = -p.dirY;
    if (!bx && !by) {
      p.dirX = -p.dirX;
      p.dirY = -p.dirY;
    }
    v.paredes--;
    p.restante = Math.max(p.restante, 3);
    // Quem já foi atingido pode levar de novo depois da tabela.
    p.atingidos = [];
    return true;
  }
  if (def.retorna) {
    p.x -= p.dirX * passo;
    p.y -= p.dirY * passo;
    return iniciarVolta(estado, p, def, saida);
  }
  return false;
}

/** O tiro parabólico só acerta quando chega na célula mirada (passa por cima de quem está no caminho). */
export function aindaNoAr(p: Projetil, def: VariacaoBasico): boolean {
  return !!def.porCima && p.var?.fase === 'ida' && p.restante > 0.75;
}

/** Cada sub-passo da ida e da volta: a teleguiada e a curva viram, a volta procura a mão, o serrilhado deixa rastro. */
export function guiar(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, def: VariacaoBasico, passo: number): 'segue' | 'chegou' {
  const v = p.var;
  if (!v) return 'segue';
  if (v.fase === 'volta') {
    const destino = destinoDaVolta(estado, p, def);
    v.voltaRestante = (v.voltaRestante ?? VOLTA_MAX) - passo;
    if (!destino || (v.voltaRestante ?? 0) <= 0) return 'chegou';
    // O irmão do divisor abre para um lado antes de fechar na mão.
    const abre = v.lado ? v.lado * Math.min(45, 15 * (v.voltaRestante ?? 0) / 4) : 0;
    const alvo = abre ? girar(destino.x - p.x, destino.y - p.y, abre) : { x: destino.x - p.x, y: destino.y - p.y };
    virarPara(p, p.x + alvo.x, p.y + alvo.y, 180);
    if (Math.hypot(destino.x - p.x, destino.y - p.y) <= CHEGOU) return 'chegou';
    p.restante = Math.max(p.restante, 1);
  } else if (v.fase === 'ida' && def.guiado) {
    if (!v.alvoId && v.miraX !== undefined && v.miraY !== undefined) {
      const achado = proximoHostil(estado, ctx, p, { x: v.miraX, y: v.miraY }, 1);
      if (achado) v.alvoId = achado.id;
      delete v.miraX;
      delete v.miraY;
    }
    const alvo = v.alvoId ? buscarEntidade(estado, v.alvoId) : undefined;
    if (alvo && vivo(alvo)) {
      virarPara(p, alvo.x, alvo.y, def.guiado * passo);
      // Enquanto persegue, não expira antes de chegar.
      p.restante = Math.max(p.restante, Math.min(2, Math.hypot(alvo.x - p.x, alvo.y - p.y) + 0.5));
    }
  }
  const r = def.rastro;
  if (r) {
    const cx = Math.round(p.x);
    const cy = Math.round(p.y);
    if ((cx !== v.rastroX || cy !== v.rastroY) && passavel(ctx.fase, cx, cy)) {
      v.rastroX = cx;
      v.rastroY = cy;
      estado.rastros.push({ x: cx, y: cy, donoId: p.donoId, equipeDono: p.equipeDono, tipo: 'rastro_dano', valor: r.valor, interno: null, ateTick: estado.tick + ticksDe(r.duracaoMs), atingidos: [] });
    }
  }
  return 'segue';
}

/** A fonte congelada no projétil (para golpes extras: órbita, estilhaço, falcão). */
export function fonteDoProjetil(estado: EstadoJogo, p: Projetil, mult = 1): FonteDeDano {
  const dono = buscarEntidade(estado, p.donoId);
  return {
    id: p.donoId,
    equipe: dono?.equipe ?? p.equipeDono,
    bonusAtributo: p.bonusAtributo,
    carisma: p.carisma,
    multRolagem: p.multRolagem,
    potencia: p.potencia,
    multDano: p.multDano * mult,
    multCura: p.multCura,
    ...(p.d20Minimo ? { d20Minimo: p.d20Minimo } : {}),
  };
}

/** O hostil mais perto do ponto, ainda não atingido, a até `raio` células (desempate pelo id). */
function proximoHostil(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, de: Celula, raio: number): Entidade | undefined {
  const dono = { id: p.donoId, equipe: p.equipeDono };
  return estado.entidades
    .filter((e) => vivo(e) && e.id !== p.donoId && !p.atingidos.includes(e.id) && e.invisivelAteTick <= estado.tick && podeFerir(dono, e, ctx.modo) && chebyshev(de, celulaOcupada(e)) <= raio)
    .sort((a, b) => chebyshev(de, celulaOcupada(a)) - chebyshev(de, celulaOcupada(b)) || (a.id < b.id ? -1 : 1))[0];
}

/** Um projétil simples (sem variação) a partir do ponto: os fragmentos do estilhaço. */
function fragmento(estado: EstadoJogo, p: Projetil, x: number, y: number, dx: number, dy: number, alcance: number, mult: number, saida: EventoSimulacao[]): void {
  const novo: Projetil = { ...p, id: novoId(estado), x, y, dirX: dx, dirY: dy, restante: alcance, multDano: p.multDano * mult, atingidos: [...p.atingidos], atravessa: false };
  delete novo.var;
  delete novo.curados;
  delete novo.carregado;
  estado.projeteis.push(novo);
  saida.push({ t: 'projetilLancado', tick: estado.tick, projetilId: novo.id, acaoId: p.acaoId, donoId: p.donoId, habilidadeId: p.habilidadeId, chave: p.chave });
}

/**
 * Depois de um acerto: cravar, estilhaço, implosão, puxar na volta, ricochete, órbita e volta. Devolve `continua`
 * quando o projétil segue voando (mesmo sem atravessar), ou null para a regra comum.
 */
export function aoAcertarVariacao(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, alvo: Entidade, hab: Habilidade, saida: EventoSimulacao[]): 'continua' | null {
  const v = p.var;
  if (!v) return null;
  const def = hab.variacao;
  if (!def) return null;
  const origem = { id: p.donoId, x: Math.round(p.x - p.dirX), y: Math.round(p.y - p.dirY), acaoId: p.acaoId };
  const c = celulaOcupada(alvo);
  v.ultimoId = alvo.id;
  if (def.cravarMs && vivo(alvo)) {
    // Cravar: a célula atrás do alvo, na direção do voo, é parede.
    const tx = Math.round(c.x + Math.sign(Math.round(p.dirX * 2) / 2));
    const ty = Math.round(c.y + Math.sign(Math.round(p.dirY * 2) / 2));
    if (!passavel(ctx.fase, tx, ty) || muralhaEm(estado, tx, ty)) aplicarEfeito(estado, ctx, alvo, construirEfeito('enraizado', { duracaoMs: def.cravarMs }), origem, null, saida);
  }
  if (def.estilhacos) {
    const { quantidade, alcance, pct } = def.estilhacos;
    for (let i = 0; i < quantidade; i++) {
      const ang = quantidade === 1 ? 0 : -30 + (60 * i) / (quantidade - 1);
      const d = girar(p.dirX, p.dirY, ang);
      fragmento(estado, p, c.x + d.x * 0.6, c.y + d.y * 0.6, d.x, d.y, alcance, pct / 100, saida);
    }
  }
  if (def.implosao && vivo(alvo)) {
    for (const e of estado.entidades) {
      if (e === alvo || !vivo(e) || e.id === p.donoId || !podeFerir({ id: p.donoId, equipe: p.equipeDono }, e, ctx.modo)) continue;
      if (chebyshev(c, celulaOcupada(e)) > def.implosao) continue;
      aplicarEfeito(estado, ctx, e, construirEfeito('puxao', { valor: 1 }), { id: p.donoId, x: c.x, y: c.y, acaoId: p.acaoId }, null, saida);
    }
  }
  if (v.fase === 'volta' && def.puxaNaVolta && vivo(alvo)) {
    const dono = buscarEntidade(estado, p.donoId);
    if (dono) aplicarEfeito(estado, ctx, alvo, construirEfeito('puxao', { valor: def.puxaNaVolta }), { id: dono.id, x: Math.round(dono.x), y: Math.round(dono.y), acaoId: p.acaoId }, null, saida);
  }
  if (v.fase !== 'ida') return v.fase === 'volta' ? 'continua' : null;
  if (v.ricochetes > 0) {
    const proximo = proximoHostil(estado, ctx, p, c, RAIO_RICOCHETE);
    if (proximo) {
      const d = celulaOcupada(proximo);
      const dx = d.x - c.x;
      const dy = d.y - c.y;
      const n = Math.hypot(dx, dy);
      if (n > 0) {
        p.x = c.x;
        p.y = c.y;
        p.dirX = dx / n;
        p.dirY = dy / n;
        p.restante = n + 0.5;
        p.multDano *= (def.ricochetePct ?? 75) / 100;
        v.ricochetes--;
        v.alvoId = proximo.id;
        return 'continua';
      }
    }
  }
  if (def.orbita && vivo(alvo)) {
    v.fase = 'orbita';
    v.alvoId = alvo.id;
    v.orbitaAte = estado.tick + ticksDe(def.orbita.duracaoMs);
    v.orbitaProximo = estado.tick + ticksDe(def.orbita.intervaloMs);
    return 'continua';
  }
  if (def.retorna && !p.atravessa) {
    iniciarVolta(estado, p, def, saida);
    return 'continua';
  }
  return null;
}

/** A órbita da shuriken: segue o alvo girando e golpeia a cada intervalo; depois volta (ou acaba). */
export function orbitar(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, hab: Habilidade | undefined, saida: EventoSimulacao[]): 'segue' | 'fim' {
  const v = p.var;
  const orbita = hab?.variacao?.orbita;
  if (!v || v.fase !== 'orbita' || !hab?.variacao || !orbita) return 'fim';
  const alvo = v.alvoId ? buscarEntidade(estado, v.alvoId) : undefined;
  if (!alvo || !vivo(alvo) || estado.tick >= (v.orbitaAte ?? 0)) {
    v.fase = 'ida';
    return iniciarVolta(estado, p, hab.variacao, saida) ? 'segue' : 'fim';
  }
  const ang = (estado.tick % 12) * (Math.PI / 6);
  p.x = alvo.x + Math.cos(ang) * RAIO_ORBITA;
  p.y = alvo.y + Math.sin(ang) * RAIO_ORBITA;
  if (estado.tick >= (v.orbitaProximo ?? 0)) {
    v.orbitaProximo = estado.tick + ticksDe(orbita.intervaloMs);
    aplicarImpacto(estado, ctx, alvo, { acaoId: p.acaoId, fonte: fonteDoProjetil(estado, p, orbita.pct / 100), hab, indice: 1, secundario: true }, saida);
  }
  return 'segue';
}

/** O bumerangue do falcoeiro chegou ao falcão: ele golpeia o último alvo, se ainda estiver de pé e perto. */
export function aoChegarNaMao(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, hab: Habilidade | undefined, saida: EventoSimulacao[]): void {
  const v = p.var;
  const pct = hab?.variacao?.voltaAoFalcao;
  if (!v || !pct || !v.ultimoId) return;
  const alvo = buscarEntidade(estado, v.ultimoId);
  if (!alvo || !vivo(alvo) || chebyshev({ x: p.x, y: p.y }, alvo) > 8) return;
  aplicarImpacto(estado, ctx, alvo, { acaoId: p.acaoId, fonte: fonteDoProjetil(estado, p, pct / 100), hab, indice: 1, secundario: true }, saida);
}
