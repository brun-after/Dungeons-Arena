// As missões do quadro do Mundo (marco 30, 30/10/2026, D-129). Sempre com combate:
// - caçar N de um preset (numa região ou em qualquer uma);
// - entregar N de um material (os de bicho só caem dos monstros: `reino.materiais`);
// - derrubar o chefe de um covil (com a contribuição mínima do loot);
// - concluir uma masmorra.
// Cada vila oferece, por dia, algumas das missões que a listam (sorteio pela semente da vila e do dia, igual para
// todos). A missão aceita guarda o progresso na ficha; a entregue fica marcada no dia e volta a valer no seguinte.
// A recompensa (ouro, XP e itens) quem dá é a sala. Puro.

import { aleatorio, criarRng, hashTexto } from '../core/rng';
import type { Leitor, Objeto } from '../core/validar';
import type { ItemNaMochila } from '../entities/entidade';
import type { MotivoDoMundo } from './avisos';
import type { FichaDoMundo, MissaoAtiva } from './ficha-mundo';

export type AlvoDeMissao =
  | { tipo: 'cacar'; preset: string; regiao: string | null; qtd: number }
  | { tipo: 'entregar'; itemId: string; qtd: number }
  | { tipo: 'covil'; covil: string }
  | { tipo: 'masmorra'; masmorra: string };

export interface MissaoDoMundo {
  id: string;
  nome: string;
  texto: string;
  /** As vilas (ids das regiões) cujo quadro oferece a missão. */
  vilas: readonly string[];
  alvo: AlvoDeMissao;
  recompensa: { ouro: number; xp: number; itens: readonly string[] };
}

/** O que aconteceu no jogo e pode andar uma missão. */
export type FatoDeMissao = { tipo: 'abate'; preset: string; regiao: string | null } | { tipo: 'covil'; covil: string } | { tipo: 'masmorra'; masmorra: string };

const DIA_MS = 86_400_000;

/** O dia (desde a época, em UTC) de uma hora do relógio do servidor. */
export const diaDe = (agoraMs: number): number => Math.floor(agoraMs / DIA_MS);

export function metaDa(m: MissaoDoMundo): number {
  return m.alvo.tipo === 'cacar' || m.alvo.tipo === 'entregar' ? m.alvo.qtd : 1;
}

export function lerMissaoDoMundo(l: Leitor, v: unknown): MissaoDoMundo {
  const o: Objeto = l.objeto(v, 'missao');
  const id = l.texto(o, 'id');
  const a = l.objeto(o.alvo, `${id}.alvo`);
  const tipo = l.opcao(a, 'tipo', ['cacar', 'entregar', 'covil', 'masmorra'] as const);
  const qtd = () => l.numero(a, 'qtd', { min: 1, max: 999, inteiro: true });
  const alvo: AlvoDeMissao =
    tipo === 'cacar'
      ? { tipo, preset: l.texto(a, 'preset'), regiao: a.regiao === undefined || a.regiao === null ? null : l.texto(a, 'regiao'), qtd: qtd() }
      : tipo === 'entregar'
        ? { tipo, itemId: l.texto(a, 'itemId'), qtd: qtd() }
        : tipo === 'covil'
          ? { tipo, covil: l.texto(a, 'covil') }
          : { tipo, masmorra: l.texto(a, 'masmorra') };
  const r = l.objeto(o.recompensa, `${id}.recompensa`);
  return {
    id,
    nome: l.texto(o, 'nome'),
    texto: l.texto(o, 'texto'),
    vilas: l.listaDeTextos(o, 'vilas'),
    alvo,
    recompensa: {
      ouro: l.numero(r, 'ouro', { min: 0, max: 1_000_000, inteiro: true }),
      xp: l.numero(r, 'xp', { min: 0, max: 10_000_000, inteiro: true }),
      itens: r.itens === undefined ? [] : l.listaDeTextos(r, 'itens'),
    },
  };
}

/** As ofertas do quadro da vila no dia: um sorteio estável entre as missões que listam a vila. */
export function ofertasDoQuadro(missoes: readonly MissaoDoMundo[], vila: string, dia: number, quantas: number): string[] {
  const candidatas = missoes.filter((m) => m.vilas.includes(vila)).map((m) => m.id);
  const rng = criarRng(hashTexto(`quadro:${vila}:${String(dia)}`));
  // Fisher-Yates com o RNG do dia.
  for (let i = candidatas.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio(rng) * (i + 1));
    const t = candidatas[i] ?? '';
    candidatas[i] = candidatas[j] ?? '';
    candidatas[j] = t;
  }
  return candidatas.slice(0, quantas);
}

/** As missões entregues no dia (para o quadro mostrar "feita hoje"). */
export function feitasNoDia(ficha: FichaDoMundo, dia: number): string[] {
  return Object.entries(ficha.missoes.feitas)
    .filter(([, d]) => d === dia)
    .map(([id]) => id);
}

/** Aceita uma oferta do quadro (null = aceitou; senão, o motivo). */
export function aceitarMissao(ficha: FichaDoMundo, ofertas: readonly string[], id: string, dia: number, ativasMax: number): MotivoDoMundo | null {
  if (!ofertas.includes(id) || ficha.missoes.ativas.some((a) => a.id === id)) return 'missao_invalida';
  if (ficha.missoes.feitas[id] === dia) return 'missao_feita_hoje';
  if (ficha.missoes.ativas.length >= ativasMax) return 'missoes_cheias';
  ficha.missoes.ativas.push({ id, progresso: 0, dia });
  return null;
}

export function abandonarMissao(ficha: FichaDoMundo, id: string): MotivoDoMundo | null {
  const i = ficha.missoes.ativas.findIndex((a) => a.id === id);
  if (i < 0) return 'missao_invalida';
  ficha.missoes.ativas.splice(i, 1);
  return null;
}

function anda(m: MissaoDoMundo, fato: FatoDeMissao): boolean {
  const a = m.alvo;
  if (fato.tipo === 'abate') return a.tipo === 'cacar' && a.preset === fato.preset && (a.regiao === null || a.regiao === fato.regiao);
  if (fato.tipo === 'covil') return a.tipo === 'covil' && a.covil === fato.covil;
  return a.tipo === 'masmorra' && a.masmorra === fato.masmorra;
}

/** Anda as missões aceitas com o fato; devolve as que mudaram (para o aviso). */
export function progredirMissoes(ficha: FichaDoMundo, missoes: ReadonlyMap<string, MissaoDoMundo>, fato: FatoDeMissao): { ativa: MissaoAtiva; meta: number }[] {
  const mudaram: { ativa: MissaoAtiva; meta: number }[] = [];
  for (const ativa of ficha.missoes.ativas) {
    const m = missoes.get(ativa.id);
    if (!m || !anda(m, fato)) continue;
    const meta = metaDa(m);
    if (ativa.progresso >= meta) continue;
    ativa.progresso++;
    mudaram.push({ ativa, meta });
  }
  return mudaram;
}

const quantidadeNa = (mochila: readonly ItemNaMochila[], itemId: string): number => mochila.filter((i) => i.itemId === itemId).reduce((s, i) => s + i.qtd, 0);

/**
 * Entrega a missão no quadro: a de material gasta os itens da mochila; as outras precisam do progresso completo.
 * Devolve a missão (a sala dá a recompensa) ou o motivo da recusa.
 */
export function entregarMissao(ficha: FichaDoMundo, missoes: ReadonlyMap<string, MissaoDoMundo>, mochila: ItemNaMochila[], id: string, dia: number): MissaoDoMundo | MotivoDoMundo {
  const i = ficha.missoes.ativas.findIndex((a) => a.id === id);
  const ativa = ficha.missoes.ativas[i];
  const m = missoes.get(id);
  if (!ativa || !m) return 'missao_invalida';
  const a = m.alvo;
  if (a.tipo === 'entregar') {
    if (quantidadeNa(mochila, a.itemId) < a.qtd) return 'missao_incompleta';
    let resta = a.qtd;
    for (const x of mochila) {
      if (x.itemId !== a.itemId || resta === 0) continue;
      const tira = Math.min(resta, x.qtd);
      x.qtd -= tira;
      resta -= tira;
    }
    for (let k = mochila.length - 1; k >= 0; k--) if ((mochila[k]?.qtd ?? 0) <= 0) mochila.splice(k, 1);
  } else if (ativa.progresso < metaDa(m)) {
    return 'missao_incompleta';
  }
  ficha.missoes.ativas.splice(i, 1);
  ficha.missoes.feitas[id] = dia;
  return m;
}

/** Confere os ids das missões contra o reino e o catálogo. */
export function conferirMissoes(
  missoes: readonly MissaoDoMundo[],
  existe: { preset: (id: string) => boolean; item: (id: string) => boolean; regiao: (id: string) => boolean; vila: (id: string) => boolean; covil: (id: string) => boolean; masmorra: (id: string) => boolean },
): string[] {
  const erros: string[] = [];
  const ids = new Set<string>();
  for (const m of missoes) {
    if (ids.has(m.id)) erros.push(`missão repetida "${m.id}"`);
    ids.add(m.id);
    if (m.vilas.length === 0) erros.push(`missão ${m.id}: sem vila`);
    for (const v of m.vilas) if (!existe.vila(v)) erros.push(`missão ${m.id}: vila desconhecida "${v}"`);
    for (const it of m.recompensa.itens) if (!existe.item(it)) erros.push(`missão ${m.id}: item desconhecido "${it}"`);
    const a = m.alvo;
    if (a.tipo === 'cacar' && !existe.preset(a.preset)) erros.push(`missão ${m.id}: preset desconhecido "${a.preset}"`);
    if (a.tipo === 'cacar' && a.regiao !== null && !existe.regiao(a.regiao)) erros.push(`missão ${m.id}: região desconhecida "${a.regiao}"`);
    if (a.tipo === 'entregar' && !existe.item(a.itemId)) erros.push(`missão ${m.id}: item desconhecido "${a.itemId}"`);
    if (a.tipo === 'covil' && !existe.covil(a.covil)) erros.push(`missão ${m.id}: covil desconhecido "${a.covil}"`);
    if (a.tipo === 'masmorra' && !existe.masmorra(a.masmorra)) erros.push(`missão ${m.id}: masmorra desconhecida "${a.masmorra}"`);
  }
  return erros;
}
