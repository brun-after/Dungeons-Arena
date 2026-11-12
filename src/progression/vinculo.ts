// Vínculo elemental (marco 39, 12/11/2026, D-150): o eneágono do personagem. São nove pontas independentes, o Físico e
// os oito elementos; encher uma não esvazia outra. ("Afinidade" já é o nome do elemento dos inimigos, combat/afinidade.ts,
// e "sintonia" o das famílias de skills do marco 24; daí "vínculo".)
// Cada ponta (0 a 1) soma três partes, ponderadas por `balance.vinculo`:
// - a barra (50%): a fração das teclas com skills daquele elemento (sem elemento conta como Físico);
// - o uso (30%): um contador por elemento que sobe a cada skill usada, satura em `usoSaturacao` e esfria com meia-vida
//   `usoMeiaVidaS` (calculado na leitura, sem sistema por tick, como a fúria);
// - os itens (20%): a fração das peças equipadas daquele elemento (a fusão elemental e as formas com elemento).
// Dela saem:
// - a resistência: −fraqueza + (fraqueza + máximo) × vínculo^expoente (sem vínculo, fraco ao elemento; o especialista
//   resiste muito ao seu; o Físico não gera fraqueza, porque todo mundo tem corpo);
// - a penetração no próprio elemento: parte da resistência (e da absorção) do alvo àquele elemento é furada, com
//   `penetracaoPct × vínculo^1,5`. Sem ela, o especialista ficava inútil contra quem absorve o seu elemento.
// Os números vêm do simulador (eneágono): paridade 1,02–1,03 entre especialista, dupla, trio e generalista. Puro.

import { resolverHabilidade } from '../combat/compilar-habilidade';
import type { Elemento } from '../combat/elementos';
import { levaRuna, runaPadraoDaSkill } from '../combat/encaixe-runa';
import type { ContextoSimulacao } from '../core/contexto';
import { msDe } from '../core/tempo';
import type { Bolsa, Entidade } from '../entities/entidade';
import { itensEquipados } from './derivados';

/** O Físico e os oito elementos (na ordem de `ELEMENTOS`, escrita aqui para não criar ciclo com combat/elementos.ts). */
export const PONTAS_ELEMENTAIS = ['fisico', 'fogo', 'gelo', 'raio', 'veneno', 'psiquico', 'terra', 'trevas', 'sagrado'] as const satisfies readonly ('fisico' | Elemento)[];
export type PontaElemental = 'fisico' | Elemento;
export type Vinculo = Record<PontaElemental, number>;

export interface RegrasVinculo {
  barraPct: number;
  usoPct: number;
  itensPct: number;
  /** Quantos usos enchem a parte do uso de um elemento. */
  usoSaturacao: number;
  /** Em quantos segundos sem usar a parte do uso cai pela metade. */
  usoMeiaVidaS: number;
  fraquezaPct: number;
  resistenciaMaxPct: number;
  /** O máximo da resistência física (o golpe sem elemento). */
  resistenciaMaxFisicoPct: number;
  expoente: number;
  penetracaoPct: number;
}

/** O elemento de um golpe como ponta do eneágono (sem elemento = Físico). */
export const pontaDe = (elemento: Elemento | null): PontaElemental => elemento ?? 'fisico';

const vazio = (): Vinculo => Object.fromEntries(PONTAS_ELEMENTAIS.map((p) => [p, 0])) as Vinculo;

type CtxVinculo = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

/** O uso de um elemento agora, já esfriado desde o último registro. */
export function usoAtual(r: RegrasVinculo, registro: { valor: number; tick: number } | undefined, tick: number): number {
  if (!registro) return 0;
  const segundos = Math.max(0, msDe(tick - registro.tick)) / 1000;
  return registro.valor * Math.pow(0.5, segundos / Math.max(1, r.usoMeiaVidaS));
}

/** Registra o uso de uma skill daquele elemento (satura no máximo). */
export function registrarUso(ctx: CtxVinculo, bolsa: Bolsa, elemento: Elemento | null, tick: number): void {
  const r = ctx.balance.vinculo;
  const p = pontaDe(elemento);
  const uso = (bolsa.vinculoUso ??= {});
  uso[p] = { valor: Math.min(r.usoSaturacao, usoAtual(r, uso[p], tick) + 1), tick };
}

/**
 * O combate consulta o vínculo a cada golpe; ele só muda com a barra, o equipado, o uso e o tick. Fica guardado por
 * ficha (memória fraca) com essa assinatura. Não muda o resultado, só evita refazer a conta.
 */
const MEMORIA = new WeakMap<Bolsa, { conteudo: object; balance: object; chave: string; v: Vinculo }>();

function assinatura(bolsa: Bolsa, tick: number): string {
  let s = `${String(tick)}|${bolsa.barra.join(',')}|`;
  for (const i of Object.values(bolsa.equipamento)) s += `${i?.itemId ?? '-'},`;
  for (const [k, u] of Object.entries(bolsa.vinculoUso ?? {})) s += `${k}:${String(u.valor)}@${String(u.tick)},`;
  return s;
}

/** O vínculo de quem tem ficha (sem ficha: tudo em 0). */
export function vinculoDe(ctx: CtxVinculo, e: Pick<Entidade, 'bolsa'>, tick: number): Vinculo {
  const bolsa = e.bolsa;
  if (!bolsa) return vazio();
  const chave = assinatura(bolsa, tick);
  const m = MEMORIA.get(bolsa);
  if (m && m.chave === chave && m.conteudo === ctx.conteudo && m.balance === ctx.balance) return m.v;
  const v = calcularVinculo(ctx, bolsa, tick);
  MEMORIA.set(bolsa, { conteudo: ctx.conteudo, balance: ctx.balance, chave, v });
  return v;
}

function calcularVinculo(ctx: CtxVinculo, bolsa: Bolsa, tick: number): Vinculo {
  const v = vazio();
  const r = ctx.balance.vinculo;
  const barra = vazio();
  const teclas = bolsa.barra.filter((id): id is string => id !== null);
  // Marco 39 (D-151): a skill com encaixe de runa conta pela runa padrão na barra (a escolhida se sustenta pelo uso; se
  // contasse na barra, nunca sumiria).
  const ponta = (id: string) => (levaRuna(ctx, id) ? runaPadraoDaSkill(ctx, bolsa, id) : pontaDe(resolverHabilidade(ctx, id)?.elemento ?? null));
  for (const id of teclas) barra[ponta(id)] += 1 / Math.max(1, teclas.length);
  const itens = vazio();
  const pecas = itensEquipados(bolsa, ctx.conteudo.itens).filter((i) => i.tipo === 'equipamento');
  for (const i of pecas) if (i.elemento) itens[i.elemento] += 1 / Math.max(1, pecas.length);
  for (const p of PONTAS_ELEMENTAIS) {
    const uso = Math.min(1, usoAtual(r, bolsa.vinculoUso?.[p], tick) / Math.max(1, r.usoSaturacao));
    v[p] = Math.min(1, (barra[p] * r.barraPct + uso * r.usoPct + itens[p] * r.itensPct) / 100);
  }
  return v;
}

/** A resistência (em %) que o vínculo dá a uma ponta: negativa sem vínculo (fraqueza), alta no especialista. */
export function resistenciaDoVinculoPct(r: RegrasVinculo, ponta: PontaElemental, vinculo: number): number {
  // O Físico não gera fraqueza e resiste menos: quase todo inimigo bate físico, e o corpo já tem vida e defesa.
  const fraqueza = ponta === 'fisico' ? 0 : r.fraquezaPct;
  const maximo = ponta === 'fisico' ? r.resistenciaMaxFisicoPct : r.resistenciaMaxPct;
  return -fraqueza + (fraqueza + maximo) * Math.pow(Math.max(0, vinculo), r.expoente);
}

/** A resistência do alvo (com ficha) ao elemento do golpe pelo vínculo, em %; sem ficha, 0. */
export function resistenciaPeloVinculo(ctx: CtxVinculo, alvo: Pick<Entidade, 'bolsa'>, elemento: Elemento | null, tick: number): number {
  if (!alvo.bolsa) return 0;
  const p = pontaDe(elemento);
  return resistenciaDoVinculoPct(ctx.balance.vinculo, p, vinculoDe(ctx, alvo, tick)[p]);
}

/** A penetração (em %, 0 a `penetracaoPct`) do atacante no próprio elemento. */
export function penetracaoPct(ctx: CtxVinculo, atacante: Pick<Entidade, 'bolsa'> | undefined, elemento: Elemento | null, tick: number): number {
  if (!atacante?.bolsa || !elemento) return 0;
  return ctx.balance.vinculo.penetracaoPct * Math.pow(vinculoDe(ctx, atacante, tick)[elemento], 1.5);
}
