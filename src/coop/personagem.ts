import { lerHistoricoXp, unirHistoricosXp } from '../progression/xp-antifarm';
// O personagem que cada um traz do próprio slot para a campanha cooperativa (marco 15, 15/10/2026, D-061). Puro.
// O save é do aparelho e não prova nada (§3.7): a sala recria o personagem pela classe e aceita do pedido só o que
// cabe no nível — atributos-base e pontos, habilidades, ranks e caminhos, itens e ouro. O que não cabe é cortado,
// e a lista do que mudou volta para o jogador. Vida, mana, defesa e atributos efetivos são sempre derivados.

import { definicaoDe } from '../combat/compilar-habilidade';
import type { ContextoSimulacao } from '../core/contexto';
import { hash53, serializarCanonico } from '../core/digest';
import { clonarEntidade, clonarEstado } from '../core/estado';
import { ehObjeto, type Objeto } from '../core/validar';
import { SLOTS_BARRA, type Bolsa, type Entidade, type HabilidadeConhecida, type ItemNaMochila } from '../entities/entidade';
import { criarJogador } from '../entities/fabrica';
import type { Alteracao, PreviaDeFicha } from '../arena/ficha-sessao';
import { SLOTS_DE_EQUIPAMENTO } from '../modos/modo';
import { recalcularFicha } from '../progression/derivados';
import { caminhosDoRank, nivelParaRank, ticksDeEstudo } from '../progression/habilidades-personagem';
import { ehDaClasse, ehDeAlgumaClasse, teclaRecusa } from '../progression/habilidades-classe';
import { empilha } from '../progression/inventario';
import { cabeNoSlot, NOMES_ATRIBUTOS } from '../progression/itens';
import { ticksDe } from '../core/tempo';
import { jogadorDoSave, type RegistroProgresso } from '../save/esquema';
import { pontosAteONivel, tetoDoAtributo, xpParaProximo } from '../progression/nivel';

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
  // Marco 28 (D-127): nenhum atributo-base acima de nível + folga (a base da classe sempre vale).
  const teto = (nome: (typeof NOMES_ATRIBUTOS)[number]) => Math.max(classeBase[nome], Math.min(maximo, tetoDoAtributo(nivel, ctx.balance)));
  for (const nome of NOMES_ATRIBUTOS) bolsa.atributosBase[nome] = limitar(inteiro(pedidos[nome]) ?? classeBase[nome], minimo, teto(nome));
  bolsa.pontosAtributo = Math.max(0, inteiro(b.pontosAtributo) ?? 0);
  const orcamento = NOMES_ATRIBUTOS.reduce((s, n) => s + classeBase[n], 0) + pontosAteONivel(nivel, ctx.balance.xp);
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
    const opcoes = caminhosDoRank(ctx, id, r);
    if (opcoes.length === 0) continue;
    const escolhido = pedidos[caminhos.length];
    if (escolhido === undefined || !opcoes.includes(escolhido)) {
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
    // Marco 24 (D-094): skill exclusiva de outra classe não entra.
    if (!c || vistas.has(c.id) || (ehDeAlgumaClasse(ctx, c.id) && !ehDaClasse(ctx, bolsa, c.id))) continue;
    vistas.add(c.id);
    conhecidas.push(c);
  }
  bolsa.conhecidas = conhecidas;
  bolsa.pontosHabilidade = Math.max(0, inteiro(b.pontosHabilidade) ?? 0);
  // Cada rank acima do 1 de uma geral custou um ponto; o 1 pode ter vindo de livro (antes do marco 24) ou da classe.
  // Marco 24 (D-094): as skills de classe sobem com o nível e não entram na conta.
  const orcamento = (nivel - 1) * ctx.balance.habilidades.pontosPorNivel + (bolsa.pontosPorItens ?? 0) + (bolsa.ranksPorItens ?? 0);
  let excesso = conhecidas.reduce((s, c) => s + (ehDaClasse(ctx, bolsa, c.id) ? 0 : c.rank - 1), 0) + bolsa.pontosHabilidade - orcamento;
  const livres = Math.min(Math.max(0, excesso), bolsa.pontosHabilidade);
  bolsa.pontosHabilidade -= livres;
  excesso -= livres;
  for (let guarda = 0; excesso > 0 && guarda < 10_000; guarda++) {
    const maior = conhecidas.reduce<HabilidadeConhecida | null>((m, c) => (c.rank > 1 && !ehDaClasse(ctx, bolsa, c.id) && (!m || c.rank > m.rank) ? c : m), null);
    if (!maior) break;
    maior.rank--;
    maior.caminhos = maior.caminhos.slice(0, ctx.balance.habilidades.ranksEvolucao.filter((r) => r <= maior.rank).length);
    excesso--;
  }
  const barra = lista(b.barra);
  bolsa.barra = Array.from({ length: SLOTS_BARRA }, (_, i) => {
    const id = barra[i];
    return typeof id === 'string' && vistas.has(id) && teclaRecusa(ctx, bolsa, i, id) === null ? id : null;
  });
  // Marco 24: as gerais liberadas (só ids que existem e não são de classe) e até 3 passivas gerais conhecidas ligadas.
  bolsa.liberadas = [...new Set(lista(b.liberadas).filter((id): id is string => typeof id === 'string' && !!definicaoDe(ctx, id) && !ehDeAlgumaClasse(ctx, id)))];
  bolsa.passivasAtivas = [...new Set(lista(b.passivasAtivas).filter((id): id is string => typeof id === 'string' && vistas.has(id) && !!definicaoDe(ctx, id)?.base.passiva))].slice(0, ctx.balance.passivasGerais.maxAtivas);
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
    // Marco 27 (D-126): sem arma na mão principal, fica a de partida da classe (criarJogador já pôs).
    const atual = slot === 'arma_principal' && !e ? bolsa.equipamento.arma_principal : null;
    const inicial = atual ? { ...atual, invId: `i${String(proximo++)}` } : null;
    bolsa.equipamento[slot] = e && item && cabeNoSlot(item, slot) && item.nivelMinimo <= nivel ? e : inicial;
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
  for (const campo of ['tomosComprados', 'pontosPorItens', 'ranksPorItens', 'xpLegado'] as const) {
    if (b[campo] !== undefined) bolsa[campo] = limitar(inteiro(b[campo]) ?? 0, 0, 1_000_000);
  }
  if (bolsa.pontosPorItens !== undefined) bolsa.pontosPorItens = Math.min(bolsa.pontosPorItens, bolsa.tomosComprados ?? 0);
  if (b.xpFracao !== undefined) bolsa.xpFracao = typeof b.xpFracao === 'number' && Number.isFinite(b.xpFracao) && b.xpFracao >= 0 && b.xpFracao < 1 ? b.xpFracao : 0;
  if (b.xpPorFase !== undefined) bolsa.xpPorFase = lerHistoricoXp(b.xpPorFase);
  conferirHabilidades(b, bolsa, e.nivel, ctx);
  conferirItens(b, bolsa, e.nivel, ctx);
  // Marco 17: a identidade do personagem passa adiante (o certificado se prende a ela).
  bolsa.personagemId = typeof b.personagemId === 'string' && /^[0-9a-zA-Z-]{8,64}$/.test(b.personagemId) ? b.personagemId : '';
  recalcularFicha(e, ctx);
  const estudoPedido = b.estudo;
  if (ehObjeto(estudoPedido) && typeof estudoPedido.id === 'string' && definicaoDe(ctx, estudoPedido.id) && !bolsa.conhecidas.some((c) => c.id === estudoPedido.id)) {
    const totalTicks = limitar(inteiro(estudoPedido.totalTicks) ?? ticksDeEstudo(ctx, e, estudoPedido.id), 1,
      ticksDe(Math.max(ctx.balance.habilidades.estudo.B, ctx.balance.habilidades.estudo.A, ctx.balance.habilidades.estudo.S)));
    bolsa.estudo = { id: estudoPedido.id, totalTicks, restanteTicks: limitar(inteiro(estudoPedido.restanteTicks) ?? totalTicks, 1, totalTicks), aceleracoes: 0,
      velocidade12: limitar(inteiro(estudoPedido.velocidade12) ?? 12, 12, 12_000_000), fracao12: limitar(inteiro(estudoPedido.fracao12) ?? 0, 0, 11) };
  }
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
  for (const campo of ['tomosComprados', 'pontosPorItens', 'ranksPorItens', 'xpFracao', 'xpLegado'] as const) {
    if (b[campo] !== undefined) registrar(campo, b[campo], bolsa[campo] ?? 0);
  }
  // Itens: compara só o que importa (id e quantidade), não os invIds renumerados.
  const resumo = (v: unknown) => (ehObjeto(v) && typeof v.itemId === 'string' ? `${v.itemId}×${String(inteiro(v.qtd) ?? 1)}` : null);
  registrar('mochila', lista(b.mochila).map(resumo), bolsa.mochila.map(resumo));
  const pedidoEquip = ehObjeto(b.equipamento) ? b.equipamento : {};
  registrar('equipamento', SLOTS_DE_EQUIPAMENTO.map((s) => resumo(pedidoEquip[s])), SLOTS_DE_EQUIPAMENTO.map((s) => resumo(bolsa.equipamento[s])));
  return { entidade: e, alteracoes };
}

/**
 * Marco 17 (D-063): o personagem que voltou da arena, como o servidor o certificou, gravado no slot. A bolsa é a do
 * retrato (a mesma que a assinatura cobre), a ficha é derivada de novo e a fase do slot fica como estava.
 */
export function aplicarRetratoNoSave(r: RegistroProgresso, retrato: PedidoDePersonagem, ctx: ContextoSimulacao, agora: number): RegistroProgresso {
  const atual = jogadorDoSave(r.estado);
  if (!atual) return r;
  const estado = clonarEstado(r.estado);
  const j = estado.entidades.find((e) => e.id === atual.id);
  if (!j) return r;
  // Clone explícito da bolsa do retrato (pela cópia de entidade, que copia a bolsa campo a campo).
  const historico = unirHistoricosXp(j.bolsa?.xpPorFase, retrato.bolsa.xpPorFase);
  j.bolsa = clonarEntidade({ ...j, bolsa: retrato.bolsa }).bolsa;
  if (j.bolsa && Object.keys(historico).length) j.bolsa.xpPorFase = historico;
  j.nivel = retrato.nivel;
  j.xp = retrato.xp;
  recalcularFicha(j, ctx);
  j.hp = j.hpMax;
  j.mana = j.manaMax;
  return { ...r, estado, atualizadoEm: agora };
}

/** A prévia que a sala devolve no `bemVindo` para quem entrou com o personagem (marco 15; arena no 17). */
export function previaDoPersonagem(e: Entidade, alteracoes: Alteracao[], modoId: string, versaoBalance: number): PreviaDeFicha {
  return {
    ficha: {
      classeId: e.bolsa?.classeId ?? '',
      classe: e.classe,
      atributos: { ...e.atributos },
      habilidades: [...e.habilidades],
      ataqueBasico: e.ataqueBasico,
      nivel: e.nivel,
      hpMax: e.hpMax,
      manaMax: e.manaMax,
      defesa: e.defesa,
    },
    alteracoes,
    hashPolitica: hash53(serializarCanonico({ modo: modoId, balance: versaoBalance })),
  };
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
  const historico = unirHistoricosXp(j.bolsa?.xpPorFase, copia.bolsa?.xpPorFase);
  j.bolsa = copia.bolsa;
  if (j.bolsa && Object.keys(historico).length) j.bolsa.xpPorFase = historico;
  recalcularFicha(j, ctx);
  j.hp = j.hpMax;
  j.mana = j.manaMax;
  return { ...r, estado, atualizadoEm: agora };
}
