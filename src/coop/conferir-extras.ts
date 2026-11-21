// Marco 48 (20/11/2026, D-192): os campos da ficha que `conferirPersonagem` jogava fora e que, por isso, sumiam ao
// entrar no Mundo, no grupo ou na arena (e voltavam vazios para o slot): as runas escolhidas, o uso que sustenta o
// vínculo, o companheiro do Aventureiro, as missões, o diário e as vitórias sobre os chefes. Cada um é conferido
// contra o conteúdo (o save do aparelho não prova nada, §3.7) e só passa o que cabe. Puro.

import { levaRuna, idDoEncaixe } from '../combat/encaixe-runa';
import { ehPonta } from '../combat/runas';
import type { ContextoSimulacao } from '../core/contexto';
import { ehObjeto } from '../core/validar';
import type { Bolsa } from '../entities/entidade';
import { formulaDaFusao } from '../combat/fusao/receita';
import { PONTAS_ELEMENTAIS, usoAtual } from '../progression/vinculo';

const PETS = ['falcao', 'lobo', 'urso'] as const;
const MAX_TEXTO = 120;
const MAX_DIARIO = 4000;

const inteiroEntre = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : null;

/** As runas: só encaixes que existem (skill de classe ou ultimate, pelo id do encaixe) e só pontas do eneágono. */
export function conferirRunas(ctx: Pick<ContextoSimulacao, 'conteudo'>, v: unknown): Bolsa['runas'] {
  if (!ehObjeto(v)) return undefined;
  const runas: NonNullable<Bolsa['runas']> = {};
  for (const [k, r] of Object.entries(v)) {
    if (levaRuna(ctx, k) && idDoEncaixe(ctx, k) === k && ehPonta(r)) runas[k] = r;
  }
  return Object.keys(runas).length ? runas : undefined;
}

/**
 * O uso de cada elemento, reancorado no tick de quem recebe. O tick do registro é o da sala de origem, que não vale
 * na sala nova (lá ele zeraria o uso de uma vez ou o deixaria sem esfriar): o valor é lido já esfriado no último uso
 * registrado e passa a valer a partir de `tickDestino`.
 */
export function conferirVinculoUso(ctx: Pick<ContextoSimulacao, 'balance'>, v: unknown, tickDestino: number): Bolsa['vinculoUso'] {
  if (!ehObjeto(v)) return undefined;
  const r = ctx.balance.vinculo;
  const registros: { p: (typeof PONTAS_ELEMENTAIS)[number]; valor: number; tick: number }[] = [];
  for (const p of PONTAS_ELEMENTAIS) {
    const u = v[p];
    if (!ehObjeto(u) || typeof u.valor !== 'number' || typeof u.tick !== 'number' || !Number.isFinite(u.valor) || !Number.isFinite(u.tick)) continue;
    registros.push({ p, valor: Math.min(r.usoSaturacao, Math.max(0, u.valor)), tick: Math.max(0, Math.round(u.tick)) });
  }
  if (registros.length === 0) return undefined;
  const referencia = Math.max(...registros.map((x) => x.tick));
  const uso: NonNullable<Bolsa['vinculoUso']> = {};
  for (const x of registros) {
    const valor = usoAtual(r, { valor: x.valor, tick: x.tick }, referencia);
    if (valor > 0) uso[x.p] = { valor, tick: Math.max(0, Math.round(tickDestino)) };
  }
  return Object.keys(uso).length ? uso : undefined;
}

/** Reancora o uso de uma bolsa já conferida (a que volta do grupo ou da arena para o slot, com o tick do slot). */
export function reancorarVinculoUso(ctx: Pick<ContextoSimulacao, 'balance'>, bolsa: Bolsa, tickDestino: number): void {
  const uso = conferirVinculoUso(ctx, bolsa.vinculoUso, tickDestino);
  if (uso) bolsa.vinculoUso = uso;
  else delete bolsa.vinculoUso;
}

/** Missões: contagens só de missões que existem (`id` ou `id@fase`), abaixo da meta; concluídas só as que existem. */
function conferirMissoes(ctx: Pick<ContextoSimulacao, 'conteudo'>, v: unknown, concluidasPedidas: unknown, bolsa: Bolsa): void {
  const concluidas = Array.isArray(concluidasPedidas) ? concluidasPedidas : [];
  bolsa.missoesConcluidas = [...new Set(concluidas.filter((id): id is string => typeof id === 'string' && ctx.conteudo.missoes.has(id)))];
  bolsa.missoes = {};
  if (!ehObjeto(v)) return;
  for (const [k, n] of Object.entries(v)) {
    const m = ctx.conteudo.missoes.get(k.split('@')[0] ?? '');
    if (!m || bolsa.missoesConcluidas.includes(m.id) || k.length > MAX_TEXTO) continue;
    // A meta só se cumpre com um evento na sala (que dá a recompensa): a contagem trazida para logo antes dela.
    const c = inteiroEntre(n, 0, Math.max(0, m.meta - 1));
    if (c) bolsa.missoes[k] = c;
  }
}

/** Copia na bolsa conferida o que o pedido traz de runas, uso, companheiro, missões, diário e vitórias. */
export function conferirExtras(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, b: Record<string, unknown>, bolsa: Bolsa, tickDestino: number): void {
  const runas = conferirRunas(ctx, b.runas);
  if (runas) bolsa.runas = runas;
  const uso = conferirVinculoUso(ctx, b.vinculoUso, tickDestino);
  if (uso) bolsa.vinculoUso = uso;
  const pet = PETS.find((p) => p === b.pet);
  if (pet) bolsa.pet = pet;
  conferirMissoes(ctx, b.missoes, b.missoesConcluidas, bolsa);
  if (Array.isArray(b.diario)) {
    bolsa.diario = [...new Set(b.diario.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= MAX_TEXTO))].slice(0, MAX_DIARIO);
  }
  // Marco 50 (21/11/2026, D-196): a compreensão (0 a 100) e as acelerações, só das skills que a bolsa conhece.
  const conhece = (id: string) => bolsa.conhecidas.some((c) => c.id === id);
  if (ehObjeto(b.compreensao)) {
    const compreensao: Record<string, number> = {};
    for (const [k, n] of Object.entries(b.compreensao)) {
      const c = inteiroEntre(n, 0, 100);
      if (conhece(k) && c) compreensao[k] = c;
    }
    if (Object.keys(compreensao).length) bolsa.compreensao = compreensao;
  }
  if (Array.isArray(b.compreensaoAcelerada)) {
    const aceleradas = [...new Set(b.compreensaoAcelerada.filter((x): x is string => typeof x === 'string' && conhece(x)))];
    if (aceleradas.length) bolsa.compreensaoAcelerada = aceleradas;
  }
  // Marco 52 (21/11/2026, D-198): as skills consumidas (das que existem) e as tentativas de cada fórmula.
  const contagem = (v: unknown, vale: (k: string) => boolean): Record<string, number> | null => {
    if (!ehObjeto(v)) return null;
    const saida: Record<string, number> = {};
    for (const [k, n] of Object.entries(v)) {
      const c = inteiroEntre(n, 1, 1000);
      if (c && vale(k)) saida[k] = c;
    }
    return Object.keys(saida).length ? saida : null;
  };
  const consumidas = contagem(b.consumidas, (k) => ctx.conteudo.definicoes.has(k));
  if (consumidas) bolsa.consumidas = consumidas;
  const tentativas = contagem(b.tentativasFusao, (k) => formulaDaFusao(k) === k);
  if (tentativas) bolsa.tentativasFusao = tentativas;
  if (ehObjeto(b.vitorias)) {
    const vitorias: Record<string, number> = {};
    for (const [k, n] of Object.entries(b.vitorias)) {
      const c = inteiroEntre(n, 0, 1_000_000);
      if (ctx.conteudo.presets.has(k) && c) vitorias[k] = c;
    }
    if (Object.keys(vitorias).length) bolsa.vitorias = vitorias;
  }
}
