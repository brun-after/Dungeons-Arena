// O personagem que cada um traz do próprio slot para a campanha cooperativa (marco 15, 15/10/2026, D-061). Puro.
// O save é do aparelho e não prova nada (§3.7): a sala recria o personagem pela classe e aceita do pedido só o que
// cabe no nível — atributos-base e pontos, habilidades, ranks e caminhos, itens e ouro. O que não cabe é cortado,
// e a lista do que mudou volta para o jogador. Vida, mana, defesa e atributos efetivos são sempre derivados.

import { definicaoDe } from '../combat/compilar-habilidade';
import type { ContextoSimulacao } from '../core/contexto';
import { serializarCanonico } from '../core/digest';
import { clonarEntidade, clonarEstado } from '../core/estado';
import { ehObjeto, type Objeto } from '../core/validar';
import { SLOTS_BARRA, type Bolsa, type Entidade, type HabilidadeConhecida, type ItemNaMochila } from '../entities/entidade';
import { criarJogador } from '../entities/fabrica';
import type { Alteracao } from '../arena/ficha-sessao';
import { SLOTS_DE_EQUIPAMENTO } from '../modos/modo';
import { recalcularFicha } from '../progression/derivados';
import { caminhosDoRank, nivelParaRank } from '../progression/habilidades-personagem';
import { empilha } from '../progression/inventario';
import { NOMES_ATRIBUTOS } from '../progression/itens';
import { xpParaProximo } from '../progression/nivel';
import { jogadorDoSave, type RegistroProgresso } from '../save/esquema';

const MAX_NOME = 24;

/** O que o cliente manda ao entrar: só a progressão (o resto nasce na sala). */
export interface PedidoDePersonagem {
  nome: string;
  nivel: number;
  xp: number;
  bolsa: Bolsa;
}

export function pedidoDoPersonagem(e: Entidade): PedidoDePersonagem | null {
  if (!e.bolsa) return null;
  return { nome: e.nome, nivel: e.nivel, xp: e.xp, bolsa: clonarEntidade(e).bolsa ?? e.bolsa };
}

export interface PersonagemConferido {
  entidade: Entidade;
  alteracoes: Alteracao[];
}

const inteiro = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null);
const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/**
 * Confere atributos-base e pontos livres contra o orçamento do nível: corta primeiro os livres, depois o atributo
 * que mais passou da base da classe (devolve o excesso de onde ele foi posto).
 */
function conferirAtributos(b: Objeto, bolsa: Bolsa, nivel: number, ctx: ContextoSimulacao, classeBase: Bolsa['atributosBase']): void {
  const { minimo, maximo } = ctx.balance.atributos;
  const pedidos = ehObjeto(b.atributosBase) ? b.atributosBase : {};
  for (const nome of NOMES_ATRIBUTOS) bolsa.atributosBase[nome] = limitar(inteiro(pedidos[nome]) ?? classeBase[nome], minimo, maximo);
  bolsa.pontosAtributo = Math.max(0, inteiro(b.pontosAtributo) ?? 0);
  const orcamento = NOMES_ATRIBUTOS.reduce((s, n) => s + classeBase[n], 0) + (nivel - 1) * ctx.balance.xp.pontosPorNivel;
  let excesso = NOMES_ATRIBUTOS.reduce((s, n) => s + bolsa.atributosBase[n], 0) + bolsa.pontosAtributo - orcamento;
  const livres = Math.min(Math.max(0, excesso), bolsa.pontosAtributo);
  bolsa.pontosAtributo -= livres;
  excesso -= livres;
  for (let guarda = 0; excesso > 0 && guarda < 10_000; guarda++) {
    let alvo: (typeof NOMES_ATRIBUTOS)[number] | null = null;
    const acima = (n: (typeof NOMES_ATRIBUTOS)[number]) => bolsa.atributosBase[n] - classeBase[n];
    for (const n of NOMES_ATRIBUTOS) if (bolsa.atributosBase[n] > minimo && (alvo === null || acima(n) > acima(alvo))) alvo = n;
    if (alvo === null) break;
    bolsa.atributosBase[alvo]--;
    excesso--;
  }
}

/** Uma habilidade conhecida, no maior rank que o nível e os caminhos pedidos permitem (null = nenhuma). */
function conferirConhecida(v: unknown, nivel: number, ctx: ContextoSimulacao): HabilidadeConhecida | null {
  if (!ehObjeto(v) || typeof v.id !== 'string' || !definicaoDe(ctx, v.id)) return null;
  const id = v.id;
  let rank = limitar(inteiro(v.rank) ?? 1, 1, ctx.balance.habilidades.rankMax);
  while (rank > 0 && nivel < nivelParaRank(ctx, id, rank)) rank--;
  if (rank === 0) return null;
  const pedidos = lista(v.caminhos).filter((c): c is string => typeof c === 'string');
  const caminhos: string[] = [];
  for (const r of ctx.balance.habilidades.ranksEvolucao) {
    if (r > rank) break;
    const escolhido = pedidos[caminhos.length];
    if (escolhido === undefined || !caminhosDoRank(ctx, id, r).includes(escolhido)) {
      rank = r - 1;
      break;
    }
    caminhos.push(escolhido);
  }
  return rank > 0 ? { id, rank, caminhos } : null;
}

/** Habilidades: ids que existem, rank pelo nível, caminhos válidos e pontos dentro do que os níveis deram. */
function conferirHabilidades(b: Objeto, bolsa: Bolsa, nivel: number, ctx: ContextoSimulacao): void {
  const vistas = new Set<string>();
  const conhecidas: HabilidadeConhecida[] = [];
  for (const v of lista(b.conhecidas)) {
    const c = conferirConhecida(v, nivel, ctx);
    if (!c || vistas.has(c.id)) continue;
    vistas.add(c.id);
    conhecidas.push(c);
  }
  bolsa.conhecidas = conhecidas;
  bolsa.pontosHabilidade = Math.max(0, inteiro(b.pontosHabilidade) ?? 0);
  // Cada rank acima do 1 custou um ponto; o 1 pode ter vindo de livro (sem ponto) ou da classe.
  const orcamento = (nivel - 1) * ctx.balance.habilidades.pontosPorNivel;
  let excesso = conhecidas.reduce((s, c) => s + c.rank - 1, 0) + bolsa.pontosHabilidade - orcamento;
  const livres = Math.min(Math.max(0, excesso), bolsa.pontosHabilidade);
  bolsa.pontosHabilidade -= livres;
  excesso -= livres;
  for (let guarda = 0; excesso > 0 && guarda < 10_000; guarda++) {
    const maior = conhecidas.reduce<HabilidadeConhecida | null>((m, c) => (c.rank > 1 && (!m || c.rank > m.rank) ? c : m), null);
    if (!maior) break;
    maior.rank--;
    maior.caminhos = maior.caminhos.slice(0, ctx.balance.habilidades.ranksEvolucao.filter((r) => r <= maior.rank).length);
    excesso--;
  }
  const barra = lista(b.barra);
  bolsa.barra = Array.from({ length: SLOTS_BARRA }, (_, i) => {
    const id = barra[i];
    return typeof id === 'string' && vistas.has(id) && !definicaoDe(ctx, id)?.base.passiva ? id : null;
  });
  bolsa.barra = bolsa.barra.map((id, i) => (id !== null && bolsa.barra.indexOf(id) !== i ? null : id));
}

/** Itens: só do catálogo, quantidades da pilha, equipamento no slot dele e no nível; invIds renumerados. */
function conferirItens(b: Objeto, bolsa: Bolsa, nivel: number, ctx: ContextoSimulacao): void {
  const { capacidade, pilhaMax } = ctx.balance.inventario;
  let proximo = 1;
  const entrada = (v: unknown): ItemNaMochila | null => {
    if (!ehObjeto(v) || typeof v.itemId !== 'string') return null;
    const item = ctx.conteudo.itens.get(v.itemId);
    if (!item) return null;
    const qtd = limitar(inteiro(v.qtd) ?? 1, 1, empilha(item) ? pilhaMax : 1);
    const ref = typeof v.ref === 'string' && definicaoDe(ctx, v.ref) ? v.ref : null;
    return { invId: `i${proximo++}`, itemId: item.id, qtd, ref };
  };
  const pedidoEquip = ehObjeto(b.equipamento) ? b.equipamento : {};
  for (const slot of SLOTS_DE_EQUIPAMENTO) {
    const e = entrada(pedidoEquip[slot]);
    const item = e ? ctx.conteudo.itens.get(e.itemId) : undefined;
    bolsa.equipamento[slot] = e && item?.tipo === 'equipamento' && item.slotPadrao === slot && item.nivelMinimo <= nivel ? e : null;
  }
  bolsa.mochila = lista(b.mochila)
    .map(entrada)
    .filter((e): e is ItemNaMochila => e !== null)
    .slice(0, capacidade);
  bolsa.proximoInv = proximo;
  bolsa.ouro = limitar(inteiro(b.ouro) ?? 0, 0, ctx.balance.economia.ouroMax);
}

/**
 * Confere o pedido e devolve o personagem como a sala o aceita. null quando nem a classe existe (não há o que
 * aproveitar). A entidade nasce em (0, 0): quem chama põe no lugar.
 */
export function conferirPersonagem(pedido: unknown, ctx: ContextoSimulacao, id: string, jogadorId: string): PersonagemConferido | null {
  if (!ehObjeto(pedido) || !ehObjeto(pedido.bolsa)) return null;
  const b = pedido.bolsa;
  const classe = typeof b.classeId === 'string' ? ctx.conteudo.classes.get(b.classeId) : undefined;
  if (!classe) return null;
  const e = criarJogador(classe, id, 0, 0, ctx.balance, jogadorId);
  const bolsa = e.bolsa;
  if (!bolsa) return null;
  const nome = typeof pedido.nome === 'string' ? pedido.nome.trim().slice(0, MAX_NOME) : '';
  e.nome = nome || classe.nome;
  e.nivel = limitar(inteiro(pedido.nivel) ?? 1, 1, ctx.balance.xp.nivelMax);
  e.xp = limitar(inteiro(pedido.xp) ?? 0, 0, xpParaProximo(e.nivel, ctx.balance.xp) - 1);
  conferirAtributos(b, bolsa, e.nivel, ctx, classe.atributos);
  conferirHabilidades(b, bolsa, e.nivel, ctx);
  conferirItens(b, bolsa, e.nivel, ctx);
  // Marco 17: a identidade do personagem passa adiante (o certificado se prende a ela).
  bolsa.personagemId = typeof b.personagemId === 'string' && /^[0-9a-zA-Z-]{8,64}$/.test(b.personagemId) ? b.personagemId : '';
  recalcularFicha(e, ctx);
  e.hp = e.hpMax;
  e.mana = e.manaMax;

  const alteracoes: Alteracao[] = [];
  const registrar = (campo: string, pedidoValor: unknown, efetivo: unknown) => {
    const a = serializarCanonico(pedidoValor ?? null);
    const c = serializarCanonico(efetivo);
    if (a !== c) alteracoes.push({ campo, pedido: a, efetivo: c });
  };
  registrar('nivel', pedido.nivel, e.nivel);
  registrar('xp', pedido.xp, e.xp);
  registrar('atributosBase', b.atributosBase, bolsa.atributosBase);
  registrar('pontosAtributo', b.pontosAtributo, bolsa.pontosAtributo);
  registrar('conhecidas', b.conhecidas, bolsa.conhecidas);
  registrar('pontosHabilidade', b.pontosHabilidade, bolsa.pontosHabilidade);
  registrar('ouro', b.ouro, bolsa.ouro);
  // Itens: compara só o que importa (id e quantidade), não os invIds renumerados.
  const resumo = (v: unknown) => (ehObjeto(v) && typeof v.itemId === 'string' ? `${v.itemId}×${String(inteiro(v.qtd) ?? 1)}` : null);
  registrar('mochila', lista(b.mochila).map(resumo), bolsa.mochila.map(resumo));
  const pedidoEquip = ehObjeto(b.equipamento) ? b.equipamento : {};
  registrar('equipamento', SLOTS_DE_EQUIPAMENTO.map((s) => resumo(pedidoEquip[s])), SLOTS_DE_EQUIPAMENTO.map((s) => resumo(bolsa.equipamento[s])));
  return { entidade: e, alteracoes };
}

/**
 * O personagem que voltou do grupo, gravado no slot de quem jogou (marco 15): troca só a progressão (nível, XP e
 * bolsa) do jogador do save e mantém a fase do slot, a posição e o resto do mundo.
 */
export function atualizarPersonagemNoSave(r: RegistroProgresso, personagem: Entidade, ctx: ContextoSimulacao, agora: number): RegistroProgresso {
  const atual = jogadorDoSave(r.estado);
  if (!atual || !personagem.bolsa) return r;
  const estado = clonarEstado(r.estado);
  const j = estado.entidades.find((e) => e.id === atual.id);
  if (!j) return r;
  const copia = clonarEntidade(personagem);
  j.nivel = copia.nivel;
  j.xp = copia.xp;
  j.bolsa = copia.bolsa;
  recalcularFicha(j, ctx);
  j.hp = j.hpMax;
  j.mana = j.manaMax;
  return { ...r, estado, atualizadoEm: agora };
}
