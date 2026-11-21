// Marco 49 (21/11/2026, D-194): o canal — a rajada (um fluxo de projéteis por alguns segundos) e o feixe (o laser do
// elemento). Fica na entidade que canaliza (`canal`), paga mana por pulso, segue o alvo e acaba quando o tempo passa,
// a mana falta, o alvo cai ou sai do alcance, quem canaliza é impedido ou começa outra ação, ou pede a mesma skill de
// novo (soltar). No feixe, cada pulso empilha exposição no alvo: o pulso seguinte fere mais, e o estado do elemento
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
      .filter((e) => e !== ator && vivo(e) && podeFerir(ator, e, ctx.modo) && e.invisivelAteTick <= estado.tick)
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
    const alvo = c.alvoId ? buscarEntidade(estado, c.alvoId) : null;
    const destino = alvo ? celulaOcupada(alvo) : { x: c.miraX, y: c.miraY };
    const longe = !!hab && chebyshev(celulaOcupada(ator), destino) > hab.alcanceCelulas + 2;
    if (!hab || !vivo(ator) || estado.tick >= c.ateTick || !!ator.acao || acaoBloqueada(ator, estado.tick, hab.tipoAtaque) || (c.alvoId && (!alvo || !vivo(alvo))) || longe) {
      delete ator.canal;
      continue;
    }
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
