// Marco 49 (21/11/2026, D-194): o canal — a rajada (um fluxo de projéteis por alguns segundos) e o feixe (o laser do
// elemento). Fica na entidade que canaliza (`canal`), paga mana por pulso, segue o alvo e acaba quando o tempo passa,
// a mana falta, o alvo cai ou sai do alcance, quem canaliza é impedido ou começa outra ação, ou pede a mesma skill de
// novo (soltar). O feixe segue o alvo que o jogador escolher enquanto dura e, se o alvo cai, salta para o hostil mais
// perto de onde ele caiu (até `saltoRaio`, dentro do alcance) em vez de apagar. No feixe, cada pulso empilha exposição no alvo: o pulso seguinte fere mais, e o estado do elemento
// cresce enquanto ele fica no raio. Quem canaliza o feixe anda devagar (world/movimento.ts). Puro.

import type { ContextoSimulacao } from '../../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../../core/estado';
import type { EventoSimulacao } from '../../core/eventos-simulacao';
import { ticksDe } from '../../core/tempo';
import { vivo, type Entidade } from '../../entities/entidade';
import { podeFerir } from '../../modos/relacao';
import { resolverHabilidade } from '../compilar-habilidade';
import type { FonteDeDano } from '../dano';
import { acaoBloqueada } from '../efeitos';
import { celulasDaLinha } from '../formas';
import { celulaOcupada, chebyshev } from '../geometria';
import { aplicarImpacto } from '../golpe';
import type { Habilidade } from '../habilidades';
import { criarProjetil } from './projetil';
import type { CanalAtivo } from './tipos';

/** Solta o canal (a mesma skill pedida de novo). */
export function soltarCanal(ator: Entidade): boolean {
  delete ator.canal;
  return true;
}

const hostilVisivel = (estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, e: Entidade): boolean =>
  e !== ator && vivo(e) && podeFerir(ator, e, ctx.modo) && e.invisivelAteTick <= estado.tick;

/**
 * 21/11/2026 (D-194): a mesma skill do feixe pedida de novo num alvo diferente troca o alvo do feixe (no mesmo, ou sem
 * alvo, solta). Devolve se trocou.
 */
export function trocarAlvoDoFeixe(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alvoId: string | null): boolean {
  const c = ator.canal;
  if (c?.tipo !== 'feixe' || !alvoId || alvoId === c.alvoId) return false;
  const novo = buscarEntidade(estado, alvoId);
  const hab = resolverHabilidade(ctx, c.chave);
  if (!novo || !hab || !hostilVisivel(estado, ctx, ator, novo) || chebyshev(celulaOcupada(ator), celulaOcupada(novo)) > hab.alcanceCelulas) return false;
  c.alvoId = novo.id;
  return true;
}

/** O hostil mais perto de onde o alvo do feixe caiu (até `saltoRaio`), dentro do alcance de quem canaliza. */
function proximoDoFeixe(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, c: CanalAtivo, alcance: number): Entidade | null {
  const onde = { x: c.miraX, y: c.miraY };
  const de = celulaOcupada(ator);
  const raio = ctx.balance.entrega.feixe.saltoRaio;
  let melhor: Entidade | null = null;
  let dMelhor = Infinity;
  for (const e of estado.entidades) {
    if (e.id === c.alvoId || !hostilVisivel(estado, ctx, ator, e)) continue;
    const k = celulaOcupada(e);
    const d = chebyshev(k, onde);
    if (d > raio || chebyshev(de, k) > alcance) continue;
    if (d < dMelhor || (d === dMelhor && melhor && e.id < melhor.id)) [melhor, dMelhor] = [e, d];
  }
  return melhor;
}

/**
 * O alvo do canal neste tick: no feixe, o escolhido pelo jogador (se mudou e está no alcance) e, se o alvo caiu, o
 * mais perto de onde ele caiu. Devolve null quando o canal deve acabar.
 */
function alvoDoCanal(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, c: CanalAtivo, hab: Habilidade): Entidade | null | 'chao' {
  if (!c.alvoId) return 'chao';
  // Troca só quando o jogador escolhe outro alvo durante o feixe (não pela escolha automática que já havia).
  if (c.escolhido === undefined) c.escolhido = ator.alvoSelecionado;
  if (c.tipo === 'feixe' && ator.alvoSelecionado !== c.escolhido) {
    c.escolhido = ator.alvoSelecionado;
    trocarAlvoDoFeixe(estado, ctx, ator, ator.alvoSelecionado);
  }
  const alvo = buscarEntidade(estado, c.alvoId);
  if (alvo && vivo(alvo)) return alvo;
  if (c.tipo !== 'feixe') return null;
  const proximo = proximoDoFeixe(estado, ctx, ator, c, hab.alcanceCelulas);
  if (proximo) c.alvoId = proximo.id;
  return proximo;
}

/** Começa a rajada ou o feixe; o primeiro pulso sai neste tick. */
export function iniciarCanal(estado: EstadoJogo, ator: Entidade, hab: Habilidade, fonte: FonteDeDano, acaoId: number, alvo: Entidade | null, mira: { x: number; y: number }): void {
  const e = hab.entrega;
  if (!e || (e.cadencia !== 'rajada' && e.cadencia !== 'feixe')) return;
  ator.canal = {
    chave: hab.chave,
    habilidadeId: hab.id,
    acaoId,
    tipo: e.cadencia,
    alvoId: alvo && alvo !== ator ? alvo.id : null,
    miraX: mira.x,
    miraY: mira.y,
    ateTick: estado.tick + ticksDe(e.duracaoMs),
    proximoTick: estado.tick,
    pulsos: 0,
    bonusAtributo: fonte.bonusAtributo,
    carisma: fonte.carisma,
    multRolagem: fonte.multRolagem,
    potencia: fonte.potencia,
    multDano: fonte.multDano,
    multCura: fonte.multCura,
    exposicao: {},
  };
}

function fonteDoCanal(ator: Entidade, c: CanalAtivo, mult: number): FonteDeDano {
  return { id: ator.id, equipe: ator.equipe, bonusAtributo: c.bonusAtributo, carisma: c.carisma, multRolagem: c.multRolagem, potencia: c.potencia, multDano: c.multDano * mult, multCura: c.multCura };
}

/** Os hostis na linha do feixe, do mais perto ao mais longe (o primeiro, ou todos se a skill atravessa). */
function naLinha(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, destino: { x: number; y: number }): Entidade[] {
  const de = celulaOcupada(ator);
  const linha = celulasDaLinha(de, destino, Math.max(1, chebyshev(de, destino)), ctx.fase);
  const achados: Entidade[] = [];
  for (const c of linha) {
    const aqui = estado.entidades
      .filter((e) => hostilVisivel(estado, ctx, ator, e))
      .filter((e) => {
        const k = celulaOcupada(e);
        return k.x === c.x && k.y === c.y;
      })
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    achados.push(...aqui);
    if (achados.length > 0 && !hab.perfura) break;
  }
  return achados;
}

/** Um pulso do canal: a rajada solta um projétil; o feixe fere quem está na linha, com a exposição. */
function pulsar(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, c: CanalAtivo, hab: Habilidade, destino: { x: number; y: number }, saida: EventoSimulacao[]): void {
  const r = ctx.balance.entrega;
  if (c.tipo === 'rajada') {
    const e = hab.entrega;
    const fonte = fonteDoCanal(ator, c, r.rajada.pulsoPct / 100);
    criarProjetil(estado, ctx, ator, hab, c.acaoId, fonte, { de: celulaOcupada(ator), para: destino, tipo: e?.trajetoria ?? 'reta', lado: c.pulsos % 2 === 0 ? 1 : -1, desvio: 0, mult: 1, saiEmMs: 0 }, saida);
    return;
  }
  naLinha(estado, ctx, ator, hab, destino).forEach((alvo, indice) => {
    const exp = c.exposicao[alvo.id] ?? 0;
    const fonte = fonteDoCanal(ator, c, (r.feixe.pulsoPct / 100) * (1 + exp / 100));
    aplicarImpacto(estado, ctx, alvo, { acaoId: c.acaoId, fonte, hab, indice, secundario: indice > 0 }, saida);
    c.exposicao[alvo.id] = Math.min(r.feixe.exposicaoMaxPct, exp + r.feixe.exposicaoPorPulsoPct);
  });
}

/** Por tick, depois das ações: cada canal pulsa na hora, paga a mana e acaba quando deve. */
export function processarCanais(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const r = ctx.balance.entrega;
  for (const ator of estado.entidades) {
    const c = ator.canal;
    if (!c) continue;
    const hab = resolverHabilidade(ctx, c.chave);
    const alvo = hab && vivo(ator) ? alvoDoCanal(estado, ctx, ator, c, hab) : null;
    const destino = alvo && alvo !== 'chao' ? celulaOcupada(alvo) : { x: c.miraX, y: c.miraY };
    const longe = !!hab && chebyshev(celulaOcupada(ator), destino) > hab.alcanceCelulas + 2;
    if (!hab || !alvo || estado.tick >= c.ateTick || !!ator.acao || acaoBloqueada(ator, estado.tick, hab.tipoAtaque) || longe) {
      delete ator.canal;
      continue;
    }
    // Onde o alvo está agora (para o salto, se ele cair).
    [c.miraX, c.miraY] = [destino.x, destino.y];
    if (estado.tick < c.proximoTick) continue;
    const regra = c.tipo === 'rajada' ? r.rajada : r.feixe;
    // O primeiro pulso já foi pago no lançamento; os seguintes custam parte da mana da skill.
    if (c.pulsos > 0) {
      const custo = Math.max(1, Math.round((hab.custoRecurso * regra.custoPorPulsoPct) / 100));
      if (ator.mana < custo) {
        delete ator.canal;
        continue;
      }
      ator.mana -= custo;
    }
    c.pulsos++;
    c.proximoTick = estado.tick + Math.max(1, ticksDe(regra.intervaloMs));
    pulsar(estado, ctx, ator, c, hab, destino, saida);
  }
}

/** Quanto o canal deixa andar (o feixe freia quem canaliza); 1 = livre. */
export function andarNoCanal(ctx: ContextoSimulacao, e: Entidade): number {
  return e.canal?.tipo === 'feixe' ? ctx.balance.entrega.feixe.andarPct / 100 : 1;
}
