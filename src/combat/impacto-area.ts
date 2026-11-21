// O impacto em área de uma skill (antes dentro de `lancar`, em acao.ts). Marco 49 (21/11/2026, D-194): fica à parte
// para a entrega usá-lo quando a magia chega (o céu que cai e o círculo sob o alvo que sobe), com a mesma regra.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import type { Entidade } from '../entities/entidade';
import { raioAreaDaEncarnacao } from './encarnacao-efeitos';
import { alvosDaForma, celulasDaForma, deSuporte, deslocaQuemConjura } from './formas';
import { chebyshev, celulaOcupada } from './geometria';
import { aplicarImpacto, type Impacto } from './golpe';
import type { Habilidade } from './habilidades';
import { quebrarEm } from './quebraveis';
import { saltar } from './saltos';
import { muralhaEm } from './tatica';

/** Fere (ou cura) os alvos da forma da skill a partir de `partida`, mirada em `mira`; devolve os atingidos. */
export function impactoEmArea(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, base: Omit<Impacto, 'indice'>, partida: Celula, mira: Celula, saida: EventoSimulacao[]): Entidade[] {
  // Marco 24 (D-095): o Mago encarnado em terra alcança +1 de raio nas magias de área.
  // D-125: a investida acerta a trajetória toda, a partir de onde saiu, passando pelas paredes como o dash.
  const atravessa = ctx.balance.movimento.dashAtravessaParedes && deslocaQuemConjura(hab);
  const barreira = atravessa ? (c: Celula) => c.x < 0 || c.y < 0 || c.x >= ctx.fase.largura || c.y >= ctx.fase.altura || !!muralhaEm(estado, c.x, c.y) : undefined;
  const celulas = celulasDaForma(raioAreaDaEncarnacao(ctx, ator, hab, estado.tick), partida, mira, ctx.fase, barreira);
  const atingidos = alvosDaForma(estado, ctx, ator, hab, celulas);
  // Marco 26 (D-113): a área quebra os quebráveis que pega.
  if (!deSuporte(hab)) quebrarEm(estado, ctx, celulas, ator, saida);
  const principal = [...atingidos].sort((a, b) => chebyshev(celulaOcupada(a), mira) - chebyshev(celulaOcupada(b), mira) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
  atingidos.forEach((e, indice) => {
    aplicarImpacto(estado, ctx, e, { ...base, hab, indice, secundario: e !== principal }, saida);
  });
  // Marco 40 (13/11/2026, D-161): a área que salta (as leituras de estilo) pula do alvo principal para os de fora.
  if (principal && hab.saltos) saltar(estado, ctx, ator, hab, principal, hab.saltos.quantidade, { ...base, hab }, atingidos.map((e) => e.id), saida);
  return atingidos;
}
