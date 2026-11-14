// O que segue com o personagem na troca de sala do Mundo (marco 41, 14/11/2026, D-169). A sala de chegada recria o
// personagem pela ficha (a bolsa), então tudo que vivia só na entidade voltava ao começo a cada região: a vida e a mana
// cheias, as recargas prontas, os efeitos (bons e ruins) sumidos, a mecânica de movimento escolhida voltando à primeira
// da lista, a fúria, a carga da ultimate. Aqui fica o retrato disso, com os prazos guardados como o tempo que falta:
// - na saída, cada tick absoluto vira "daqui a tantos ticks";
// - na chegada, volta a ser absoluto no relógio da sala nova, descontado o tempo da viagem (`decorridoTicks`), então
//   as contagens seguem correndo durante a troca, como se fosse um lugar só.
// A origem de um efeito que não viaja (o monstro que envenenou) vira `ORIGEM_DE_FORA`: na sala nova ninguém tem esse
// id, e nenhum outro personagem leva o crédito. Puro, com clone explícito (sem ida e volta por JSON).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { BuffArmado, EfeitoAtivo, Entidade, EstadoArmas } from '../entities/entidade';
import type { EntidadeId } from '../core/comandos';

/** A origem dos efeitos de quem ficou na sala de antes. */
export const ORIGEM_DE_FORA = 'de_fora';

/** O prazo sem fim (a invocação sem prazo, o companheiro): nunca é deslocado. */
const SEM_PRAZO = Number.MAX_SAFE_INTEGER / 2;

export interface EstadoQueViaja {
  hp: number;
  mana: number;
  /** Ticks que faltam de cada recarga, pelo id da habilidade. */
  recargas: Record<string, number>;
  /** Os efeitos ativos, com os ticks relativos à saída. */
  efeitos: EfeitoAtivo[];
  buffsArmados: BuffArmado[];
  /** A mecânica de movimento escolhida e as cargas gastas (ticks relativos); o modo em curso termina na troca. */
  movimento: { ativo: string; cargas: Record<string, number[]> } | null;
  petAtivo?: Entidade['petAtivo'];
  furia?: Entidade['furia'];
  cargaUltimate?: number;
  encarnacao?: Entidade['encarnacao'];
  encarnacaoAteTick?: number;
  encarnacaoUltimoTick?: number;
  encarnacaoDupla?: string;
  encarnacaoDuplaAteTick?: number;
  armas?: EstadoArmas;
  refugio: boolean;
}

/** O tick absoluto `t` como relativo a `base` (o prazo sem fim fica como está). */
const relativo = (t: number, base: number) => (t >= SEM_PRAZO ? t : t - base);
/** O relativo `r` de volta a absoluto, com a viagem descontada. */
const absoluto = (r: number, base: number) => (r >= SEM_PRAZO ? r : r + base);

/** O efeito com os ticks relativos a `base` (`ida`) ou de volta a absolutos (`!ida`). */
function deslocarEfeito(f: EfeitoAtivo, base: number, ida: boolean, origem: (id: EntidadeId) => EntidadeId): EfeitoAtivo {
  const t = (x: number) => (ida ? relativo(x, base) : absoluto(x, base));
  return {
    ...f,
    ...(f.interno && { interno: { ...f.interno } }),
    ateTick: t(f.ateTick),
    // O periódico que já ia pulsar pulsa logo na chegada (0 é "não periódico").
    proximoTick: f.proximoTick > 0 ? (ida ? Math.max(1, f.proximoTick - base) : f.proximoTick + base) : 0,
    inicioTick: t(f.inicioTick),
    origemId: origem(f.origemId),
  };
}

function deslocarFuria(f: NonNullable<Entidade['furia']>, base: number, ida: boolean): NonNullable<Entidade['furia']> {
  const t = (x: number) => (ida ? relativo(x, base) : absoluto(x, base));
  return { ...f, ultimoTick: t(f.ultimoTick), ...(f.frenesiAteTick !== undefined && { frenesiAteTick: t(f.frenesiAteTick) }) };
}

function deslocarArmas(a: EstadoArmas, base: number, ida: boolean): EstadoArmas {
  const t = (x: number) => (ida ? relativo(x, base) : absoluto(x, base));
  return {
    ...a,
    ...(a.elementoAteTick !== undefined && { elementoAteTick: t(a.elementoAteTick) }),
    ...(a.ripostaAteTick !== undefined && { ripostaAteTick: t(a.ripostaAteTick) }),
  };
}

/**
 * O retrato de `e` na saída da sala. `daComitiva` diz quem viaja junto (a origem dos efeitos postos por eles segue
 * apontando para eles; o resto vira `ORIGEM_DE_FORA`). A trégua da passagem não viaja: a sala nova a dá de novo.
 */
export function recolherBagagem(estado: EstadoJogo, e: Entidade, daComitiva: ReadonlySet<EntidadeId> = new Set()): EstadoQueViaja {
  const base = estado.tick;
  const prefixo = `${e.id}_`;
  const recargas: Record<string, number> = {};
  for (const [chave, fim] of Object.entries(estado.recargas)) if (chave.startsWith(prefixo) && fim > base) recargas[chave.slice(prefixo.length)] = fim - base;
  const origem = (id: EntidadeId) => (id === e.id ? e.id : daComitiva.has(id) ? id : ORIGEM_DE_FORA);
  const mc = e.movimentoClasse;
  const cargas: Record<string, number[]> = {};
  if (mc) for (const [id, lista] of Object.entries(mc.cargas)) cargas[id] = lista.filter((t) => t > base).map((t) => t - base);
  return {
    hp: e.hp,
    mana: e.mana,
    recargas,
    efeitos: e.efeitos.filter((f) => f.ateTick > base && f.tipo !== 'tregua').map((f) => deslocarEfeito(f, base, true, origem)),
    buffsArmados: e.buffsArmados.map((b) => ({ efeito: { ...b.efeito }, ateTick: relativo(b.ateTick, base) })),
    movimento: mc ? { ativo: mc.ativo, cargas } : null,
    ...(e.petAtivo !== undefined && { petAtivo: e.petAtivo }),
    ...(e.furia && { furia: deslocarFuria(e.furia, base, true) }),
    ...(e.cargaUltimate !== undefined && { cargaUltimate: e.cargaUltimate }),
    ...(e.encarnacao !== undefined && { encarnacao: e.encarnacao }),
    ...(e.encarnacaoAteTick !== undefined && { encarnacaoAteTick: relativo(e.encarnacaoAteTick, base) }),
    ...(e.encarnacaoUltimoTick !== undefined && { encarnacaoUltimoTick: relativo(e.encarnacaoUltimoTick, base) }),
    ...(e.encarnacaoDupla !== undefined && { encarnacaoDupla: e.encarnacaoDupla }),
    ...(e.encarnacaoDuplaAteTick !== undefined && { encarnacaoDuplaAteTick: relativo(e.encarnacaoDuplaAteTick, base) }),
    ...(e.armas && { armas: deslocarArmas(e.armas, base, true) }),
    refugio: e.refugio,
  };
}

/**
 * Na sala de chegada: põe o retrato em `e` (já recriado pela ficha). `decorridoTicks` é o tempo da viagem; `origem`
 * traduz os ids da comitiva antiga para os novos. A vida e a mana não passam do máximo de agora.
 */
export function aplicarBagagem(estado: EstadoJogo, ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Entidade, b: EstadoQueViaja, decorridoTicks: number, origem: (id: EntidadeId) => EntidadeId = (id) => id): void {
  const base = estado.tick - Math.max(0, Math.floor(decorridoTicks));
  const vivoAinda = (t: number) => t > estado.tick;
  e.hp = Math.max(1, Math.min(e.hpMax, b.hp));
  e.mana = Math.max(0, Math.min(e.manaMax, b.mana));
  for (const [hab, falta] of Object.entries(b.recargas)) {
    const fim = base + falta;
    if (vivoAinda(fim)) estado.recargas[`${e.id}_${hab}`] = fim;
  }
  const deFora = (id: EntidadeId) => (id === ORIGEM_DE_FORA ? ORIGEM_DE_FORA : origem(id));
  const voltaram = b.efeitos.map((f) => deslocarEfeito(f, base, false, deFora)).filter((f) => vivoAinda(f.ateTick));
  e.efeitos = [...e.efeitos.filter((f) => !voltaram.some((v) => v.tipo === f.tipo)), ...voltaram];
  e.buffsArmados = b.buffsArmados.map((x) => ({ efeito: { ...x.efeito }, ateTick: absoluto(x.ateTick, base) })).filter((x) => vivoAinda(x.ateTick));
  if (b.movimento) {
    const liberado = (ctx.conteudo.movimentos.get(e.bolsa?.classeId ?? e.classeId ?? '') ?? []).some((m) => m.id === b.movimento?.ativo);
    const cargas: Record<string, number[]> = {};
    for (const [id, lista] of Object.entries(b.movimento.cargas)) cargas[id] = lista.map((r) => r + base).filter(vivoAinda);
    e.movimentoClasse = { ...(e.movimentoClasse ?? { ativo: b.movimento.ativo, cargas: {} }), ativo: liberado ? b.movimento.ativo : (e.movimentoClasse?.ativo ?? b.movimento.ativo), cargas };
  }
  if (b.petAtivo !== undefined) e.petAtivo = b.petAtivo;
  if (b.furia) e.furia = deslocarFuria(b.furia, base, false);
  if (b.cargaUltimate !== undefined) e.cargaUltimate = b.cargaUltimate;
  if (b.encarnacao !== undefined) e.encarnacao = b.encarnacao;
  if (b.encarnacaoAteTick !== undefined) e.encarnacaoAteTick = absoluto(b.encarnacaoAteTick, base);
  if (b.encarnacaoUltimoTick !== undefined) e.encarnacaoUltimoTick = absoluto(b.encarnacaoUltimoTick, base);
  if (b.encarnacaoDupla !== undefined) e.encarnacaoDupla = b.encarnacaoDupla;
  if (b.encarnacaoDuplaAteTick !== undefined) e.encarnacaoDuplaAteTick = absoluto(b.encarnacaoDuplaAteTick, base);
  if (b.armas) e.armas = { ...(e.armas ?? b.armas), ...deslocarArmas(b.armas, base, false) };
  e.refugio = b.refugio;
}
