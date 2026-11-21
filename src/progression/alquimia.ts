// Marco 50 (21/11/2026, D-196): a transmutação. O comando `fundir` junta 2 ou 3 skills comuns (ou uma fusão e mais uma,
// achatada até 3), com até 2 runas elementais (o par leva 1, o trio 2) e 1 material. Cada parte precisa de 100% de
// compreensão; as partes, as runas e o material são consumidos, e a fusão começa a ser estudada (o tempo pelo grau;
// a de 3 é sempre S). Ela nasce no rank da média das partes, arredondada para baixo. Não se desfaz. Tudo por comando.
// Marco 52 (21/11/2026, D-198): a fusão sai num nível de raridade (3º, 2º ou 1º), sorteado com a chance da
// Inteligência (progression/fusao-raridade.ts). As partes consumidas ficam liberadas: o personagem as aprende de novo
// (com ponto) para refazer a mesma fórmula, e o que fica é o melhor nível entre a fusão que já tem e a nova.

import { definicaoDe } from '../combat/compilar-habilidade';
import { ehElemento, type Elemento } from '../combat/elementos';
import { achatar, ehFusao, herancaDasFusoes, idDaFusao, raridadeDaFusao, type RaridadeFusao, type Receita } from '../combat/fusao/receita';
import type { ContextoSimulacao } from '../core/contexto';
import type { EventoSimulacao, MotivoHabilidade } from '../core/eventos-simulacao';
import type { Bolsa, Entidade } from '../entities/entidade';
import type { EstadoJogo } from '../core/estado';
import { emCombate } from './buffs';
import { recalcularFicha } from './derivados';
import { ehDeAlgumaClasse } from './habilidades-classe';
import { ticksDeEstudo } from './habilidades-personagem';
import { chancesDeRaridade, mesmaFormulaConhecida, sortearRaridade, tentativasDaFormula } from './fusao-raridade';

type Ctx = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

/** A runa de fusão antiga vira a runa curinga: vale o elemento do núcleo (ou o primeiro da mistura). */
export const ID_RUNA_CURINGA = 'runa_de_fusao';
export const PREFIXO_RUNA = 'runa_';

/** O elemento de uma runa elemental (item `runa_<elemento>`); null para outro item. */
export function elementoDaRuna(itemId: string): Elemento | null {
  if (!itemId.startsWith(PREFIXO_RUNA)) return null;
  const el = itemId.slice(PREFIXO_RUNA.length);
  return ehElemento(el) ? el : null;
}

export interface PedidoDeFusao {
  /** 2 ou 3 skills conhecidas, na ordem núcleo, forma e eco (uma delas pode ser uma fusão). */
  partes: readonly string[];
  /** As runas: invIds de runas elementais (ou da curinga). */
  runas: readonly string[];
  /** O material: invId (null = nenhum). */
  material: string | null;
}

/** A skill pode entrar numa fórmula? (comum ou fusão; nunca a de classe, a ultimate, o básico, a passiva ou a interna) */
export function fundivel(ctx: Ctx, id: string): boolean {
  if (ehDeAlgumaClasse(ctx, id) || ctx.conteudo.ultimates.has(id)) return false;
  const d = definicaoDe(ctx, id);
  return !!d && !d.basico && !d.interna && d.base.passiva === null;
}

/** A compreensão de uma skill (0 a 100). */
export const compreensaoDe = (bolsa: Pick<Bolsa, 'compreensao'>, id: string): number => Math.min(100, bolsa.compreensao?.[id] ?? 0);

/** Os encaixes de runa da mistura (pelo número de partes já achatadas). */
export const encaixesDeRuna = (ctx: Ctx, partes: number): number => (partes >= 3 ? ctx.balance.alquimia.trio.runas : ctx.balance.alquimia.par.runas);

interface Montagem {
  receita: Receita;
  runasInv: string[];
  materialInv: string | null;
  rank: number;
  /** D-198: a fusão da mesma fórmula que o personagem já tem (o id, com o nível dele), ou null. */
  existente: string | null;
}

/** Monta a receita do pedido, ou diz por que não dá. Não muda nada. */
export function montarFusao(ctx: Ctx, bolsa: Bolsa, pedido: PedidoDeFusao): Montagem | MotivoHabilidade {
  const ids = pedido.partes;
  if (ids.length < 2 || ids.length > 3 || new Set(ids).size !== ids.length) return 'fusao_partes';
  for (const id of ids) {
    const c = bolsa.conhecidas.find((k) => k.id === id);
    if (!c || !fundivel(ctx, id)) return 'fusao_partes';
    if (compreensaoDe(bolsa, id) < 100) return 'fusao_compreensao';
  }
  const partes = achatar(ids);
  if (!partes) return 'fusao_teto';
  if (new Set(partes).size !== partes.length || !partes.every((p) => fundivel(ctx, p) && !ehFusao(p))) return 'fusao_partes';
  // As runas: os itens pedidos existem, são runas, e cabem nos encaixes (somadas às que já vêm dentro da fusão).
  const heranca = herancaDasFusoes(ids);
  const nucleo = definicaoDe(ctx, partes[0] ?? '')?.base.elemento ?? null;
  const runas: Elemento[] = [...heranca.runas];
  for (const invId of pedido.runas) {
    // A mesma pilha pode dar duas runas, se tiver duas.
    const item = bolsa.mochila.find((i) => i.invId === invId);
    if (!item || item.qtd < pedido.runas.filter((x) => x === invId).length) return 'fusao_runa';
    const el = item.itemId === ID_RUNA_CURINGA ? (nucleo ?? partes.map((p) => definicaoDe(ctx, p)?.base.elemento).find((x) => !!x) ?? null) : elementoDaRuna(item.itemId);
    if (!el) return 'fusao_runa';
    runas.push(el);
  }
  if (runas.length > encaixesDeRuna(ctx, partes.length)) return 'fusao_runa';
  let material = heranca.material;
  if (pedido.material !== null) {
    if (material !== null) return 'fusao_material';
    const item = bolsa.mochila.find((i) => i.invId === pedido.material && i.qtd > 0);
    if (!item || !ctx.conteudo.alquimia.materiais.has(item.itemId)) return 'fusao_material';
    material = item.itemId;
  }
  const receita: Receita = { partes, runas, material };
  const id = idDaFusao(receita);
  if (!definicaoDe(ctx, id)) return 'fusao_partes';
  // D-198: a mesma fórmula pode ser refeita (para tentar um nível melhor); o nível 1 já é o teto.
  const existente = bolsa.conhecidas.some((c) => c.id === id) ? id : mesmaFormulaConhecida(bolsa, id);
  if (existente !== null && raridadeDaFusao(existente) === 1) return 'fusao_maxima';
  if (bolsa.estudo?.id === id) return 'fusao_partes';
  const ranks = ids.map((p) => bolsa.conhecidas.find((c) => c.id === p)?.rank ?? 1);
  const rank = Math.max(1, Math.floor(ranks.reduce((a, b) => a + b, 0) / ranks.length));
  return { receita, runasInv: [...pedido.runas], materialInv: pedido.material, rank, existente };
}

function gastar(bolsa: Bolsa, invId: string): void {
  const item = bolsa.mochila.find((i) => i.invId === invId);
  if (!item) return;
  item.qtd--;
  if (item.qtd <= 0) bolsa.mochila = bolsa.mochila.filter((i) => i !== item);
}

/** O comando `fundir`: consome as partes, as runas e o material e começa o estudo da fusão. */
export function fundir(estado: EstadoJogo, e: Entidade, ctx: ContextoSimulacao, pedido: PedidoDeFusao, saida: EventoSimulacao[]): boolean {
  const tick = estado.tick;
  const bolsa = e.bolsa;
  const recusar = (motivo: MotivoHabilidade): false => {
    saida.push({ t: 'habilidadeRecusada', tick, id: e.id, habilidadeId: pedido.partes[0] ?? '', motivo });
    return false;
  };
  if (!bolsa) return recusar('sem_ficha');
  if (bolsa.estudo) return recusar('estudando');
  if (emCombate(estado, ctx, e)) return recusar('em_combate');
  const m = montarFusao(ctx, bolsa, pedido);
  if (typeof m === 'string') return recusar(m);
  // As partes saem do personagem (das conhecidas, da barra e da compreensão), mas ficam liberadas para aprender de novo.
  for (const p of pedido.partes) {
    if (!ehFusao(p) && !(bolsa.liberadas ?? []).includes(p)) (bolsa.liberadas ??= []).push(p);
    // D-198: a vez que a skill foi consumida (reaprendê-la sai de graça e com a compreensão adiantada).
    if (!ehFusao(p)) {
      const consumidas = (bolsa.consumidas ??= {});
      consumidas[p] = (consumidas[p] ?? 0) + 1;
    }
    bolsa.conhecidas = bolsa.conhecidas.filter((c) => c.id !== p);
    bolsa.barra = bolsa.barra.map((b) => (b === p ? null : b));
    if (bolsa.compreensao) bolsa.compreensao = Object.fromEntries(Object.entries(bolsa.compreensao).filter(([k]) => k !== p));
  }
  for (const invId of m.runasInv) gastar(bolsa, invId);
  if (m.materialInv) gastar(bolsa, m.materialInv);
  // D-198: o nível de raridade, sorteado pela Inteligência; refazendo a fórmula, fica o melhor dos dois.
  // D-198: cada tentativa anterior da mesma fórmula sobe a chance do 2º e do 1º nível.
  const formula = idDaFusao(m.receita);
  const tentativas = tentativasDaFormula(bolsa, formula);
  (bolsa.tentativasFusao ??= {})[formula] = tentativas + 1;
  const sorteado = sortearRaridade(estado.rng, chancesDeRaridade(ctx.balance.alquimia, e.atributos, tentativas));
  const antes: RaridadeFusao | null = m.existente ? raridadeDaFusao(m.existente) : null;
  const raridade = antes === null ? sorteado : (Math.min(antes, sorteado) as RaridadeFusao);
  const id = idDaFusao({ ...m.receita, raridade });
  if (antes !== null && raridade === antes) {
    // Não melhorou: a fusão de antes fica como está, e as partes, as runas e o material se foram na tentativa.
    recalcularFicha(e, ctx);
    saida.push({ t: 'fusaoCriada', tick, id: e.id, habilidadeId: id, partes: [...pedido.partes], raridade, melhorou: false });
    return true;
  }
  const totalTicks = ticksDeEstudo(ctx, e, id);
  bolsa.estudo = { id, totalTicks, restanteTicks: totalTicks, aceleracoes: 0, velocidade12: 12, fracao12: 0, ...(m.rank > 1 && { rank: m.rank }) };
  recalcularFicha(e, ctx);
  saida.push({ t: 'fusaoCriada', tick, id: e.id, habilidadeId: id, partes: [...pedido.partes], raridade, melhorou: true });
  saida.push({ t: 'estudoIniciado', tick, id: e.id, habilidadeId: id, totalTicks });
  return true;
}
