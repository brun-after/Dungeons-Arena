// A ficha do personagem do Mundo (marco 29, 30/10/2026, D-128): o que o servidor guarda na tabela
// `personagens_mundo` (coluna `ficha`). O personagem é separado da campanha (slots próprios, nível 1 ao criar) e o
// cliente nunca manda a ficha: o servidor a carrega e a usa como verdade. Ao carregar, a progressão passa pela
// mesma conferência da campanha em grupo (`conferirPersonagem`), como um sanity check. Puro.
// Marco 30 (30/10/2026, D-129): a ficha ganha o baú do banco (fora da mochila: a morte não leva) e as missões do
// quadro (as aceitas, com o progresso, e as feitas por dia). A versão 1 lê com os dois vazios.

import type { ContextoSimulacao } from '../core/contexto';
import { ehObjeto } from '../core/validar';
import type { Entidade, ItemNaMochila } from '../entities/entidade';
import { criarJogador } from '../entities/fabrica';
import { pedidoDoPersonagem, type PedidoDePersonagem } from '../coop/personagem';
import type { Reino } from './reino';

export const VERSAO_FICHA_MUNDO = 2;
export const SLOTS_DO_MUNDO = 3;
const MAX_NOME = 24;

export interface FichaDoMundo {
  versao: number;
  personagem: PedidoDePersonagem;
  /** A região da vila onde salvou por último: é onde entra (e renasce) quem saiu sem salvar. */
  vilaSalva: string;
  /** Os lugares descobertos: regiões visitadas e estruturas encontradas (os destinos do portal e a névoa do mapa). */
  descobertas: string[];
  /** Masmorra -> hora (ms, relógio do servidor) em que a recompensa volta a valer para o personagem. */
  recargas: Record<string, number>;
  /** Hora (ms) em que o portal volta a ficar livre para o personagem. */
  portalLivreEm: number;
  /** Marco 30: o baú do banco (os mesmos itens da mochila, com o próprio invId) e o ouro guardado. */
  banco: { itens: ItemNaMochila[]; ouro: number };
  /** Marco 30: as missões aceitas (o progresso e o dia em que foram aceitas) e o dia em que cada uma foi entregue. */
  missoes: { ativas: MissaoAtiva[]; feitas: Record<string, number> };
}

export interface MissaoAtiva {
  id: string;
  progresso: number;
  /** O dia (desde a época, no relógio do servidor) em que foi aceita. */
  dia: number;
}

const MAX_ITENS_BANCO = 500;
const MAX_MISSOES = 50;

function lerItens(v: unknown): ItemNaMochila[] {
  if (!Array.isArray(v)) return [];
  const itens: ItemNaMochila[] = [];
  for (const x of v.slice(0, MAX_ITENS_BANCO)) {
    if (!ehObjeto(x) || typeof x.invId !== 'string' || typeof x.itemId !== 'string' || typeof x.qtd !== 'number' || !Number.isInteger(x.qtd) || x.qtd < 1) continue;
    itens.push({ invId: x.invId, itemId: x.itemId, qtd: x.qtd, ref: typeof x.ref === 'string' ? x.ref : null });
  }
  return itens;
}

const inteiroNaoNegativo = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

function lerMissoes(v: unknown): FichaDoMundo['missoes'] {
  const o = ehObjeto(v) ? v : {};
  const ativas: MissaoAtiva[] = [];
  for (const x of Array.isArray(o.ativas) ? o.ativas.slice(0, MAX_MISSOES) : []) {
    if (ehObjeto(x) && typeof x.id === 'string') ativas.push({ id: x.id, progresso: inteiroNaoNegativo(x.progresso), dia: inteiroNaoNegativo(x.dia) });
  }
  const feitas: Record<string, number> = {};
  if (ehObjeto(o.feitas)) for (const [k, x] of Object.entries(o.feitas).slice(0, 500)) feitas[k] = inteiroNaoNegativo(x);
  return { ativas, feitas };
}

/** O personagem novo do Mundo: nível 1 da classe, na vila de início do reino. */
export function fichaNova(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, reino: Reino, classeId: string, nome: string, personagemId: string): FichaDoMundo | null {
  const classe = ctx.conteudo.classes.get(classeId);
  if (!classe) return null;
  const e = criarJogador(classe, 'novo', 0, 0, ctx.balance);
  e.nome = nome.trim().slice(0, MAX_NOME) || classe.nome;
  if (e.bolsa) e.bolsa.personagemId = personagemId;
  const personagem = pedidoDoPersonagem(e);
  if (!personagem) return null;
  return {
    versao: VERSAO_FICHA_MUNDO,
    personagem,
    vilaSalva: reino.inicio,
    descobertas: [`regiao:${reino.inicio}`],
    recargas: {},
    portalLivreEm: 0,
    banco: { itens: [], ouro: 0 },
    missoes: { ativas: [], feitas: {} },
  };
}

/** Lê a ficha guardada; o que faltar ou vier torto volta ao padrão (o personagem é conferido ao entrar). */
export function lerFichaDoMundo(v: unknown, reino: Reino): FichaDoMundo | null {
  if (!ehObjeto(v) || !ehObjeto(v.personagem) || !ehObjeto(v.personagem.bolsa)) return null;
  const vila = typeof v.vilaSalva === 'string' && reino.regioes.some((r) => r.id === v.vilaSalva && r.vila) ? v.vilaSalva : reino.inicio;
  const descobertas = Array.isArray(v.descobertas) ? v.descobertas.filter((x): x is string => typeof x === 'string').slice(0, 500) : [];
  const recargas: Record<string, number> = {};
  if (ehObjeto(v.recargas)) for (const [k, x] of Object.entries(v.recargas)) if (typeof x === 'number' && Number.isFinite(x)) recargas[k] = x;
  return {
    versao: VERSAO_FICHA_MUNDO,
    personagem: v.personagem as unknown as PedidoDePersonagem,
    vilaSalva: vila,
    descobertas: [...new Set([`regiao:${reino.inicio}`, ...descobertas])],
    recargas,
    portalLivreEm: typeof v.portalLivreEm === 'number' && Number.isFinite(v.portalLivreEm) ? v.portalLivreEm : 0,
    banco: { itens: lerItens(ehObjeto(v.banco) ? v.banco.itens : null), ouro: inteiroNaoNegativo(ehObjeto(v.banco) ? v.banco.ouro : 0) },
    missoes: lerMissoes(v.missoes),
  };
}

/** A ficha com a progressão atual da entidade (o checkpoint e a passagem de sala). */
export function fichaAtualizada(ficha: FichaDoMundo, e: Entidade): FichaDoMundo {
  const personagem = pedidoDoPersonagem(e);
  return personagem ? { ...ficha, personagem } : ficha;
}

/** Marca um lugar como descoberto (sem repetir). */
export function descobrir(ficha: FichaDoMundo, lugar: string): boolean {
  if (ficha.descobertas.includes(lugar)) return false;
  ficha.descobertas.push(lugar);
  return true;
}
