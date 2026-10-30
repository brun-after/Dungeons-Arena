// A sala do Mundo (marco 29, 30/10/2026, D-128): um lugar (região, masmorra ou covil) numa SalaArena, com a área de
// interesse e a IA com ativação que o modo `mundo` liga. O servidor reserva a ficha de quem vai entrar (pela
// identidade autenticada) e recolhe as pendências da sala: gravar a ficha (save na vila, checkpoint, saída) e trocar
// de sala (a passagem pela borda, a porta da estrutura, a saída do interior, o portal e o renascer na vila salva).
// Na troca, a sessão sai desta sala com a ficha atualizada e o cliente entra na outra com um bilhete.
// Nada aqui decide pelo id do modo: as regras vêm do reino (perigo, recompensas, covis) e do balance (`mundo`).
// Marco 30 (30/10/2026, D-129): as ações do Mundo (quadro de missões, banco, chat, troca; o grupo, o chat do grupo e
// o mercado vão ao servidor como pendências), os materiais que os monstros deixam, o progresso das missões e o grupo
// (a entidade leva o `grupo`; a masmorra de quem está em grupo é a instância do grupo).

import { versaoDoConteudo, type MensagemCliente } from '../arena/protocolo';
import { SalaArena, type EntradaDePersonagem, type OpcoesSala, type Sessao } from '../arena/sala';
import { celulaDeEntrada, colocarEm } from '../coop/sala-campanha';
import { conferirPersonagem, previaDoPersonagem } from '../coop/personagem';
import type { Celula, EntidadeId } from '../core/comandos';
import { modoPorId, type Conteudo } from '../core/conteudo';
import { aplicarEfeito } from '../combat/efeitos';
import { construirEfeito } from '../combat/registro-efeitos';
import { buscarEntidade } from '../core/estado';
import { aleatorio, criarRng, hashTexto } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade, type ItemNaMochila } from '../entities/entidade';
import { equipeDeEntrada } from '../modos/regras';
import { raioDeRevelar } from '../progression/efeitos-atributo';
import { concederXpDeProgressao } from '../progression/nivel';
import { guardarItem } from '../progression/inventario';
import { tipoEm } from '../world/fase';
import { largarItem, largarPerto } from '../world/objetos';
import { naSaidaAberta } from '../world/portas';
import type { AcaoDoMundo } from './acoes';
import type { AvisoDoMundo, DestinoDePortal, MotivoDoMundo } from './avisos';
import { atenderBanco, atenderMissao, avisoDoBanco, avisoDoQuadro, missoesPorId, type Balcao } from './balcao';
import { LimiteDoChat } from './chat';
import { taxaDeAnuncio } from './mercado';
import { progredirMissoes, type FatoDeMissao } from './missoes-mundo';
import type { AcaoSocial, PendenciaDoMundo, ResultadoDoMercado } from './pendencias';
import { atenderChat, atenderTroca, cancelarTrocaDe, type Participante, type SalaSocial } from './sala-social';
import { TrocasDaSala } from './troca';
import { descobrir, fichaAtualizada, type FichaDoMundo } from './ficha-mundo';
import { idDoLugar, montarLugar, type Lugar } from './lugares';
import { estruturaDoDestino, LADOS, ladoOposto, portaDa, vizinha, type LadoDaRegiao, type PapelNpc, type Reino, type RegiaoDoMundo } from './reino';
import type { ExteriorGerado } from '../world/gerador-exterior';

export const MODO_MUNDO = 'mundo';
export const PERGAMINHO_RETORNO = 'pergaminho_retorno';

export interface OpcoesSalaMundo {
  semente: number;
  canal?: number;
  /** Relógio de parede do servidor (ms): as recargas das masmorras e do portal valem entre sessões. */
  agora: () => number;
  versaoConteudo?: string;
}

export type { PendenciaDoMundo, ResultadoDoMercado } from './pendencias';

interface Presenca {
  identidade: string;
  ficha: FichaDoMundo;
  /** Morreu fora de dungeon: ao renascer, volta à vila salva (se não for esta região). */
  morreu: boolean;
  /** Marco 30: o grupo do Mundo (o servidor define; null fora de grupo). */
  grupo: string | null;
}

/** A célula de chegada na vizinha: o mesmo ponto da borda, duas células para dentro do lado oposto. */
export function chegadaPelaBorda(tamanho: number, lado: LadoDaRegiao, c: Celula): Celula {
  const dentro = 2;
  const oposto = ladoOposto(lado);
  if (oposto === 'norte') return { x: c.x, y: dentro };
  if (oposto === 'sul') return { x: c.x, y: tamanho - 1 - dentro };
  if (oposto === 'oeste') return { x: dentro, y: c.y };
  return { x: tamanho - 1 - dentro, y: c.y };
}

export class SalaMundo extends SalaArena {
  readonly lugar: Lugar;
  readonly canal: number;
  private readonly exterior: ExteriorGerado | null;
  private readonly reservas = new Map<string, { ficha: FichaDoMundo; chegada: Celula | null; grupo: string | null }>();
  /** Por entidade: quem é e a ficha que entrou (a progressão vem da entidade na hora de gravar). */
  private readonly presencas = new Map<EntidadeId, Presenca>();
  private readonly despedidos = new Set<string>();
  private pendencias: PendenciaDoMundo[] = [];
  /** Dano no chefe do covil por jogador (a contribuição do loot). */
  private readonly danoNoChefe = new Map<EntidadeId, Map<EntidadeId, number>>();
  private proximoCheckpoint: number;
  private readonly trocas = new TrocasDaSala();
  private readonly limiteDoChat: LimiteDoChat;

  constructor(
    readonly reino: Reino,
    lugar: Lugar,
    conteudo: Conteudo,
    private readonly opcoesMundo: OpcoesSalaMundo,
  ) {
    const montado = montarLugar(conteudo, reino, lugar, modoPorId(conteudo, MODO_MUNDO));
    const opcoes: OpcoesSala = { semente: opcoesMundo.semente, versaoConteudo: opcoesMundo.versaoConteudo ?? versaoDoConteudo() };
    super(montado.ctx, opcoes, montado.estado);
    this.lugar = lugar;
    this.canal = opcoesMundo.canal ?? 1;
    this.exterior = montado.exterior;
    this.proximoCheckpoint = ticksDe(this.ctx.balance.mundo.checkpointS * 1000);
    const chat = this.ctx.balance.mundo.chat;
    this.limiteDoChat = new LimiteDoChat(chat.porJanela, chat.janelaS * 1000);
  }

  get idLugar(): string {
    return idDoLugar(this.lugar);
  }

  /** O servidor guarda a ficha de quem vai entrar por esta identidade (e onde chega, ou o spawn). */
  reservar(identidade: string, ficha: FichaDoMundo, chegada: Celula | null = null, grupo: string | null = null): void {
    this.reservas.set(identidade, { ficha, chegada, grupo });
  }

  /** As pendências desde a última retirada (o servidor grava e troca as sessões de sala). */
  retirarPendencias(): PendenciaDoMundo[] {
    const p = this.pendencias;
    this.pendencias = [];
    return p;
  }

  /** Manda o aviso de troca de sala e tira a sessão daqui (a ficha já seguiu na pendência). */
  despedir(sessaoId: string, aviso: AvisoDoMundo): void {
    const s = this.sessoes.get(sessaoId);
    if (!s) return;
    this.enviarPara(s, { t: 'mundo', aviso });
    this.despedidos.add(sessaoId);
    this.removerSessao(s);
  }

  protected override criarPersonagem(_msg: Extract<MensagemCliente, { t: 'entrar' }>, jogadorId: string, entidadeId: EntidadeId, _n: number, identidade: string | null): EntradaDePersonagem {
    const reserva = identidade ? this.reservas.get(identidade) : undefined;
    if (!identidade || !reserva) return { ok: false, motivo: 'personagem_invalido' };
    const r = conferirPersonagem(reserva.ficha.personagem, this.ctx, entidadeId, jogadorId);
    if (!r) return { ok: false, motivo: 'personagem_invalido' };
    this.reservas.delete(identidade);
    const e = r.entidade;
    e.controlador = 'remoto';
    e.equipe = equipeDeEntrada(this.ctx.modo, jogadorId, this.estado);
    const origem = reserva.chegada ?? this.ctx.fase.spawns[0] ?? { x: 1, y: 1 };
    colocarEm(e, celulaDeEntrada(this.estado, this.ctx, e, origem));
    this.estado.entidades.push(e);
    const ficha = { ...reserva.ficha, descobertas: [...reserva.ficha.descobertas] };
    this.presencas.set(entidadeId, { identidade, ficha, morreu: false, grupo: reserva.grupo });
    if (reserva.grupo) e.grupo = reserva.grupo;
    // Marco 30 (30/10/2026, D-129): a proteção na passagem. Quem chega (pela borda, pela porta, pelo portal ou ao
    // entrar no jogo) fica uns segundos sem levar dano: ninguém espera do outro lado para pegar quem ainda carrega.
    const protecaoMs = this.ctx.balance.mundo.passagemProtecaoS * 1000;
    if (protecaoMs > 0) aplicarEfeito(this.estado, this.ctx, e, construirEfeito('imune_dano', { duracaoMs: protecaoMs }), { id: e.id, x: e.x, y: e.y }, null, this.eventosDoTick);
    return { ok: true, previa: previaDoPersonagem(e, r.alteracoes, this.ctx.modo.id, this.ctx.balance.versao) };
  }

  protected override aoEntrar(s: Sessao): void {
    const p = this.presencas.get(s.entidadeId);
    if (!p) return;
    const regiao = this.lugar.tipo === 'regiao' ? this.lugar.regiao : null;
    if (descobrir(p.ficha, this.idLugar)) this.avisar(s, { tipo: 'descoberta', lugar: this.idLugar, nome: this.nomeDoLugar() });
    this.avisar(s, {
      tipo: 'lugar',
      lugar: this.idLugar,
      nome: this.nomeDoLugar(),
      perigo: regiao ? regiao.perigo : 'dungeon',
      pvp: this.ctx.modo.fogoAmigo,
      canal: this.canal,
      vilaSalva: p.ficha.vilaSalva,
      descobertas: [...p.ficha.descobertas],
    });
  }

  protected override aoRemoverSessao(s: Sessao): void {
    cancelarTrocaDe(this.social(), s.entidadeId, this.trocas);
    const p = this.presencas.get(s.entidadeId);
    if (p) this.limiteDoChat.esquecer(p.identidade);
    this.presencas.delete(s.entidadeId);
    if (this.despedidos.delete(s.sessaoId) || !p) return;
    // Saiu do jogo (sem troca): a progressão fica; a posição volta à vila salva na próxima entrada.
    this.pendencias.push({ tipo: 'gravar', identidade: p.identidade, ficha: p.ficha });
  }

  protected override depoisDoTick(): void {
    this.lerEventos();
    for (const s of [...this.sessoes.values()]) {
      const e = buscarEntidade(this.estado, s.entidadeId);
      const p = this.presencas.get(s.entidadeId);
      if (!e || !p) continue;
      p.ficha = fichaAtualizada(p.ficha, e);
      if (this.conferirMorte(s, e, p)) continue;
      if (this.conferirBorda(s, e, p)) continue;
      this.conferirSaidaDoInterior(s, e, p);
      this.conferirEscondidas(s, e, p);
    }
    if (this.estado.tick >= this.proximoCheckpoint) {
      this.proximoCheckpoint = this.estado.tick + ticksDe(this.ctx.balance.mundo.checkpointS * 1000);
      for (const p of this.presencas.values()) this.pendencias.push({ tipo: 'gravar', identidade: p.identidade, ficha: p.ficha });
    }
  }

  /**
   * Marco 30 (30/10/2026, D-129): a estrutura escondida é descoberta por quem passa perto da porta (o raio de revelar
   * da Sabedoria, o mesmo das armadilhas): entra no mapa do reino e dá o aviso.
   */
  private conferirEscondidas(s: Sessao, e: Entidade, p: Presenca): void {
    if (this.lugar.tipo !== 'regiao') return;
    const raio = raioDeRevelar(e.atributos, this.ctx.balance);
    for (const estrutura of this.lugar.regiao.estruturas) {
      if (!estrutura.escondida) continue;
      const { porta } = portaDa(estrutura);
      if (Math.max(Math.abs(porta.x - e.x), Math.abs(porta.y - e.y)) > raio) continue;
      if (descobrir(p.ficha, `${estrutura.destino.tipo}:${estrutura.destino.id}`)) {
        this.avisar(s, { tipo: 'descoberta', lugar: `${estrutura.destino.tipo}:${estrutura.destino.id}`, nome: estrutura.nome });
      }
    }
  }

  protected override aoViajar(s: Sessao, destino: string, pagamento: 'ouro' | 'pergaminho'): void {
    const motivo = this.viajar(s, destino, pagamento);
    if (motivo) this.avisar(s, { tipo: 'recusa', motivo });
  }

  /** O portal: a vila descoberta, pagando ouro na pedra (com recarga) ou gastando o pergaminho de retorno onde for. */
  private viajar(s: Sessao, destino: string, pagamento: 'ouro' | 'pergaminho'): MotivoDoMundo | null {
    const e = buscarEntidade(this.estado, s.entidadeId);
    const p = this.presencas.get(s.entidadeId);
    const bolsa = e?.bolsa;
    if (!e || !p || !bolsa || !vivo(e)) return null;
    const alvo = this.reino.regioes.find((r) => r.id === destino && r.vila);
    if (!alvo) return 'destino_invalido';
    if (this.lugar.tipo === 'regiao' && this.lugar.regiao.id === alvo.id) return 'mesmo_lugar';
    if (!p.ficha.descobertas.includes(`regiao:${alvo.id}`)) return 'nao_descoberto';
    const agora = this.opcoesMundo.agora();
    if (pagamento === 'pergaminho') {
      const i = bolsa.mochila.findIndex((m) => m.itemId === PERGAMINHO_RETORNO);
      const m = bolsa.mochila[i];
      if (!m) return 'destino_invalido';
      m.qtd--;
      if (m.qtd <= 0) bolsa.mochila.splice(i, 1);
    } else {
      if (!this.pertoDe(e, 'pedra_portal')) return 'destino_invalido';
      if (agora < p.ficha.portalLivreEm) return 'portal_em_recarga';
      const custo = this.custoDoPortal(alvo);
      if (bolsa.ouro < custo) return 'sem_ouro';
      bolsa.ouro -= custo;
      p.ficha.portalLivreEm = agora + this.ctx.balance.mundo.portal.recargaS * 1000;
    }
    p.ficha = fichaAtualizada(p.ficha, e);
    this.trocar(s, p, `regiao:${alvo.id}`, null, null);
    return null;
  }

  private nomeDoLugar(): string {
    return this.lugar.tipo === 'regiao' ? this.lugar.regiao.nome : this.lugar.tipo === 'masmorra' ? this.lugar.masmorra.nome : this.lugar.covil.nome;
  }

  private avisar(s: Sessao, aviso: AvisoDoMundo): void {
    this.enviarPara(s, { t: 'mundo', aviso });
  }

  private trocar(s: Sessao, p: Presenca, destino: string, chegada: Celula | null, instancia: string | null): void {
    if (this.despedidos.has(s.sessaoId) || this.pendencias.some((x) => x.tipo === 'trocar' && x.sessaoId === s.sessaoId)) return;
    this.pendencias.push({ tipo: 'trocar', identidade: p.identidade, sessaoId: s.sessaoId, ficha: p.ficha, destino, chegada, instancia });
  }

  private pertoDe(e: Entidade, tipo: string): boolean {
    const alcance = this.ctx.balance.economia.alcanceInteracao;
    return this.estado.objetos.some((o) => o.tipo === tipo && Math.max(Math.abs(o.x - e.x), Math.abs(o.y - e.y)) <= alcance);
  }

  private regiaoAtual(): RegiaoDoMundo | null {
    if (this.lugar.tipo === 'regiao') return this.lugar.regiao;
    const id = this.lugar.tipo === 'masmorra' ? this.lugar.masmorra.id : this.lugar.covil.id;
    return estruturaDoDestino(this.reino, id)?.regiao ?? null;
  }

  custoDoPortal(alvo: RegiaoDoMundo): number {
    const aqui = this.regiaoAtual();
    const distancia = aqui ? Math.max(Math.abs(aqui.gx - alvo.gx), Math.abs(aqui.gy - alvo.gy)) : 1;
    const regras = this.ctx.balance.mundo.portal;
    return regras.ouroBase + regras.ouroPorRegiao * distancia;
  }

  private sessaoDaEntidade(id: EntidadeId): Sessao | undefined {
    for (const s of this.sessoes.values()) if (s.entidadeId === id) return s;
    return undefined;
  }

  /** Os pedidos dos objetos (save, portal, porta, quadro), o dano no chefe do covil e a morte dele. */
  private lerEventos(): void {
    for (const ev of this.eventosDoTick) {
      if (ev.t === 'pedidoDoMundo') this.atenderPedido(ev.id, ev.tipo, ev.ref);
      else if (ev.t === 'impacto' && this.lugar.tipo === 'covil') this.anotarDano(ev.fonteId, ev.alvoId, ev.danoEfetivo ?? ev.dano);
      else if (ev.t === 'morreu' && this.danoNoChefe.has(ev.id)) this.lootDoCovil(ev.id);
      if (ev.t === 'morreu') this.aoMorrer(ev.id, ev.porId);
    }
  }

  private atenderPedido(entidadeId: EntidadeId, tipo: string, ref: string): void {
    const s = this.sessaoDaEntidade(entidadeId);
    const p = this.presencas.get(entidadeId);
    const e = buscarEntidade(this.estado, entidadeId);
    if (!s || !p || !e) return;
    const regiao = this.lugar.tipo === 'regiao' ? this.lugar.regiao : null;
    if (tipo === 'pedra_save' && regiao?.vila) {
      p.ficha.vilaSalva = regiao.id;
      this.pendencias.push({ tipo: 'gravar', identidade: p.identidade, ficha: p.ficha });
      this.avisar(s, { tipo: 'salvo', vila: regiao.id });
    } else if (tipo === 'pedra_portal') {
      const destinos: DestinoDePortal[] = this.reino.regioes
        .filter((r) => r.vila && r.id !== regiao?.id && p.ficha.descobertas.includes(`regiao:${r.id}`))
        .map((r) => ({ regiao: r.id, nome: r.vila?.nome ?? r.nome, custo: this.custoDoPortal(r) }));
      const temPergaminho = e.bolsa?.mochila.some((m) => m.itemId === PERGAMINHO_RETORNO) ?? false;
      this.avisar(s, { tipo: 'portais', destinos, livreEm: p.ficha.portalLivreEm, temPergaminho });
    } else if (tipo === 'porta_estrutura' && regiao) {
      const estrutura = regiao.estruturas.find((x) => x.id === ref);
      if (!estrutura) return;
      descobrir(p.ficha, `${estrutura.destino.tipo}:${estrutura.destino.id}`);
      // A masmorra é instanciada: a do grupo (todos entram na mesma) ou a de quem está só; o covil é um só.
      const instancia = estrutura.destino.tipo !== 'masmorra' ? null : p.grupo ? `grupo:${p.grupo}:${estrutura.destino.id}` : `${p.identidade}:${this.estado.tick}`;
      this.trocar(s, p, `${estrutura.destino.tipo}:${estrutura.destino.id}`, null, instancia);
    } else if (tipo === 'npc') {
      // Marco 30: o NPC atende pelo papel (o quadro de missões, o banco e o quadro de mercado).
      const b = this.balcao(s, e, p);
      if (!b) return;
      if (ref === 'missoes') this.avisar(s, avisoDoQuadro(b));
      else if (ref === 'banco') this.avisar(s, avisoDoBanco(b));
      else if (ref === 'mercado') this.pedirMercado(p, e, { a: 'mercado', op: 'listar', pagina: 0, busca: '' }, { item: null, ouro: 0 });
    }
  }

  /** Morto fora de dungeon: o túmulo já ficou; ao renascer, a sessão vai para a vila salva (se não for aqui). */
  private conferirMorte(s: Sessao, e: Entidade, p: Presenca): boolean {
    if (!this.ctx.modo.tumuloNaMorte) return false;
    if (e.morto) {
      p.morreu = true;
      return true;
    }
    if (!p.morreu) return false;
    p.morreu = false;
    const aqui = this.lugar.tipo === 'regiao' ? this.lugar.regiao.id : null;
    if (aqui === p.ficha.vilaSalva) return false;
    this.trocar(s, p, `regiao:${p.ficha.vilaSalva}`, null, null);
    return true;
  }

  /** Na passagem da borda, vai para a região vizinha, no ponto correspondente. */
  private conferirBorda(s: Sessao, e: Entidade, p: Presenca): boolean {
    if (!this.exterior || this.lugar.tipo !== 'regiao') return false;
    for (const lado of LADOS) {
      if (!this.exterior.passagens[lado].some((c) => c.x === e.x && c.y === e.y)) continue;
      const destino = vizinha(this.reino, this.lugar.regiao, lado);
      if (!destino) return false;
      this.trocar(s, p, `regiao:${destino.id}`, chegadaPelaBorda(this.reino.tamanhoRegiao, lado, e), null);
      return true;
    }
    return false;
  }

  /** Na saída aberta do interior, volta à frente da porta da estrutura (e a masmorra concluída entrega a recompensa). */
  private conferirSaidaDoInterior(s: Sessao, e: Entidade, p: Presenca): void {
    if (this.lugar.tipo === 'regiao' || tipoEm(this.ctx.fase, e.x, e.y) !== 'saida' || !naSaidaAberta(this.estado, this.ctx, e)) return;
    const id = this.lugar.tipo === 'masmorra' ? this.lugar.masmorra.id : this.lugar.covil.id;
    const porta = estruturaDoDestino(this.reino, id);
    if (!porta) return;
    if (this.lugar.tipo === 'masmorra') this.recompensar(s, e, p, this.lugar.masmorra.nome, this.lugar.masmorra.id, this.lugar.masmorra.recompensa, this.lugar.masmorra.recargaH);
    p.ficha = fichaAtualizada(p.ficha, e);
    this.trocar(s, p, `regiao:${porta.regiao.id}`, portaDa(porta.estrutura).frente, null);
  }

  private dar(e: Entidade, itemId: string): void {
    const item = this.ctx.conteudo.itens.get(itemId);
    if (!item || !e.bolsa) return;
    if (!guardarItem(e.bolsa, item, 1, this.ctx.balance.inventario)) largarPerto(this.ctx, e.x, e.y, (x, y) => largarItem(this.estado, itemId, x, y, []));
  }

  private recompensar(s: Sessao, e: Entidade, p: Presenca, nome: string, id: string, itens: readonly string[], recargaH: number): void {
    const agora = this.opcoesMundo.agora();
    if (agora < (p.ficha.recargas[id] ?? 0)) {
      this.avisar(s, { tipo: 'recusa', motivo: 'masmorra_em_recarga' });
      return;
    }
    for (const itemId of itens) this.dar(e, itemId);
    p.ficha.recargas[id] = agora + recargaH * 3_600_000;
    this.progredir(s, p, { tipo: 'masmorra', masmorra: id });
    this.avisar(s, { tipo: 'recompensa', nome, itens: [...itens] });
  }

  private anotarDano(fonteId: EntidadeId, alvoId: EntidadeId, dano: number): void {
    if (this.lugar.tipo !== 'covil' || dano <= 0) return;
    const alvo = buscarEntidade(this.estado, alvoId);
    if (alvo?.preset !== this.lugar.covil.boss) return;
    // A invocação conta para o dono.
    const dono = buscarEntidade(this.estado, fonteId)?.invocacao?.donoId ?? fonteId;
    const mapa = this.danoNoChefe.get(alvoId) ?? new Map<EntidadeId, number>();
    mapa.set(dono, (mapa.get(dono) ?? 0) + dano);
    this.danoNoChefe.set(alvoId, mapa);
  }

  /** O chefe do covil caiu: cada um que causou a parte mínima tem o próprio sorteio; o chefe renasce no ritmo do covil. */
  private lootDoCovil(chefeId: EntidadeId): void {
    if (this.lugar.tipo !== 'covil') return;
    const covil = this.lugar.covil;
    const mapa = this.danoNoChefe.get(chefeId) ?? new Map<EntidadeId, number>();
    this.danoNoChefe.delete(chefeId);
    const total = [...mapa.values()].reduce((a, b) => a + b, 0);
    const minimo = (total * this.ctx.balance.mundo.covil.contribuicaoMinPct) / 100;
    for (const [id, dano] of mapa) {
      const e = buscarEntidade(this.estado, id);
      const s = this.sessaoDaEntidade(id);
      if (!e || !s || dano < minimo) continue;
      const p = this.presencas.get(id);
      if (p) this.progredir(s, p, { tipo: 'covil', covil: covil.id });
      const rng = criarRng(hashTexto(`${covil.id}:${chefeId}:${id}:${this.estado.tick}`));
      if (aleatorio(rng) * 100 >= covil.chanceDropPct) continue;
      this.dar(e, covil.dropExclusivo);
      this.avisar(s, { tipo: 'recompensa', nome: covil.nome, itens: [covil.dropExclusivo] });
    }
    const renascer = this.estado.tick + ticksDe(covil.renascerMin * 60_000);
    for (const r of this.estado.respawns) if (r.id === chefeId) r.noTick = Math.max(r.noTick, renascer);
  }

  // Marco 30 (30/10/2026, D-129): as ações do Mundo e o que o servidor entrega de volta.

  protected override aoAcaoDoMundo(s: Sessao, acao: AcaoDoMundo): void {
    const e = buscarEntidade(this.estado, s.entidadeId);
    const p = this.presencas.get(s.entidadeId);
    if (!e || !p) return;
    const b = this.balcao(s, e, p);
    switch (acao.a) {
      case 'missao':
        if (b) atenderMissao(b, acao);
        break;
      case 'banco':
      case 'bancoOuro':
        if (b) atenderBanco(b, acao);
        break;
      case 'chat':
        atenderChat(this.social(p, e), this.participante(s, e, p), acao, this.limiteDoChat);
        break;
      case 'troca':
        atenderTroca(this.social(p, e), this.participante(s, e, p), acao, this.trocas);
        break;
      case 'grupo':
      case 'denunciar':
        this.pedirSocial(p, e, acao);
        break;
      case 'mercado':
        this.acaoDeMercado(s, e, p, acao);
        break;
    }
    p.ficha = fichaAtualizada(p.ficha, e);
  }

  /** O servidor manda um aviso a quem está nesta sala (o chat do grupo, o convite, o grupo, o mercado). */
  entregar(identidade: string, aviso: AvisoDoMundo): boolean {
    const s = this.sessaoDaIdentidade(identidade);
    if (s) this.avisar(s, aviso);
    return s !== undefined;
  }

  /** O grupo do personagem mudou (o servidor guarda os grupos): a entidade passa a levá-lo. */
  definirGrupo(identidade: string, grupo: string | null): boolean {
    const s = this.sessaoDaIdentidade(identidade);
    const p = s ? this.presencas.get(s.entidadeId) : undefined;
    const e = s ? buscarEntidade(this.estado, s.entidadeId) : undefined;
    if (!p || !e) return false;
    p.grupo = grupo;
    e.grupo = grupo;
    return true;
  }

  /** Aplica o resultado de um pedido do mercado (a devolução, a compra, as vendas recebidas). false = não está aqui. */
  concluirMercado(identidade: string, r: ResultadoDoMercado): boolean {
    const s = this.sessaoDaIdentidade(identidade);
    const e = s ? buscarEntidade(this.estado, s.entidadeId) : undefined;
    const p = s ? this.presencas.get(s.entidadeId) : undefined;
    if (!e?.bolsa || !p) return false;
    e.bolsa.ouro += r.ouro;
    p.ficha.banco.ouro += r.ouroNoBanco;
    for (const m of r.itens) {
      const item = this.ctx.conteudo.itens.get(m.itemId);
      if (item && !guardarItem(e.bolsa, item, m.qtd, this.ctx.balance.inventario, m.ref)) {
        largarPerto(this.ctx, e.x, e.y, (x, y) => largarItem(this.estado, m.itemId, x, y, [], m.qtd, undefined, m.ref));
      }
    }
    p.ficha = fichaAtualizada(p.ficha, e);
    return true;
  }

  private sessaoDaIdentidade(identidade: string): Sessao | undefined {
    for (const s of this.sessoes.values()) if (this.presencas.get(s.entidadeId)?.identidade === identidade) return s;
    return undefined;
  }

  private balcao(s: Sessao, e: Entidade, p: Presenca): Balcao | null {
    const bolsa = e.bolsa;
    if (!bolsa) return null;
    const vila = this.lugar.tipo === 'regiao' && this.lugar.regiao.vila ? this.lugar.regiao.id : null;
    return {
      ctx: this.ctx,
      reino: this.reino,
      e,
      bolsa,
      ficha: p.ficha,
      vila,
      agora: this.opcoesMundo.agora(),
      perto: (papel) => this.pertoDoNpc(e, papel),
      avisar: (a) => {
        this.avisar(s, a);
      },
      dar: (itemId) => {
        this.dar(e, itemId);
      },
      // Fora do tick: os eventos de nível não vão ao cliente (o estado leva o nível novo).
      darXp: (xp) => {
        concederXpDeProgressao(e, this.ctx, xp, this.estado.tick, []);
      },
    };
  }

  private pertoDoNpc(e: Entidade, papel: PapelNpc): boolean {
    const alcance = this.ctx.balance.economia.alcanceInteracao;
    return this.estado.objetos.some((o) => o.tipo === 'npc' && o.ref === papel && Math.max(Math.abs(o.x - e.x), Math.abs(o.y - e.y)) <= alcance);
  }

  private participante(s: Sessao, e: Entidade, p: Presenca): Participante {
    return {
      sessaoId: s.sessaoId,
      e,
      identidade: p.identidade,
      avisar: (a) => {
        this.avisar(s, a);
      },
    };
  }

  private participantes(): Participante[] {
    const lista: Participante[] = [];
    for (const s of this.sessoes.values()) {
      const e = buscarEntidade(this.estado, s.entidadeId);
      const p = this.presencas.get(s.entidadeId);
      if (e && p) lista.push(this.participante(s, e, p));
    }
    return lista;
  }

  private social(p: Presenca | null = null, e: Entidade | null = null): SalaSocial {
    return {
      ctx: this.ctx,
      agora: this.opcoesMundo.agora(),
      participantes: () => this.participantes(),
      pedirAoServidor: (acao) => {
        if (p && e) this.pedirSocial(p, e, acao);
      },
    };
  }

  private pedirSocial(p: Presenca, e: Entidade, acao: AcaoSocial): void {
    this.pendencias.push({ tipo: 'social', identidade: p.identidade, nome: e.nome, lugar: this.idLugar, acao });
  }

  private pedirMercado(p: Presenca, e: Entidade, acao: Extract<AcaoDoMundo, { a: 'mercado' }>, reserva: { item: ItemNaMochila | null; ouro: number }): void {
    this.pendencias.push({ tipo: 'mercado', identidade: p.identidade, nome: e.nome, acao, reserva });
  }

  /** O mercado: a sala confere e reserva (o item e a taxa do anúncio, o ouro da compra); o servidor faz o resto. */
  private acaoDeMercado(s: Sessao, e: Entidade, p: Presenca, acao: Extract<AcaoDoMundo, { a: 'mercado' }>): void {
    const bolsa = e.bolsa;
    if (!bolsa) return;
    if (!this.pertoDoNpc(e, 'mercado')) {
      this.avisar(s, { tipo: 'recusa', motivo: 'longe' });
      return;
    }
    const regras = this.ctx.balance.mundo.mercado;
    if (acao.op === 'anunciar') {
      const i = bolsa.mochila.findIndex((m) => m.invId === acao.invId);
      const m = bolsa.mochila[i];
      const taxa = taxaDeAnuncio(acao.preco, regras);
      const motivo: MotivoDoMundo | null = !m || m.qtd < acao.qtd ? 'sem_item' : acao.preco > regras.precoMax ? 'preco_invalido' : bolsa.ouro < taxa ? 'sem_ouro' : null;
      if (motivo || !m) {
        this.avisar(s, { tipo: 'recusa', motivo: motivo ?? 'sem_item' });
        return;
      }
      m.qtd -= acao.qtd;
      if (m.qtd <= 0) bolsa.mochila.splice(i, 1);
      bolsa.ouro -= taxa;
      this.pedirMercado(p, e, acao, { item: { ...m, qtd: acao.qtd }, ouro: taxa });
    } else if (acao.op === 'comprar') {
      if (bolsa.ouro < acao.preco) {
        this.avisar(s, { tipo: 'recusa', motivo: 'sem_ouro' });
        return;
      }
      bolsa.ouro -= acao.preco;
      this.pedirMercado(p, e, acao, { item: null, ouro: acao.preco });
    } else {
      this.pedirMercado(p, e, acao, { item: null, ouro: 0 });
    }
  }

  /** Um monstro caiu: as missões de caça de quem o derrubou (ou do dono da invocação) e do grupo dele por perto. */
  private aoMorrer(id: EntidadeId, porId: EntidadeId | null): void {
    const preset = this.estado.respawns.find((r) => r.id === id)?.preset;
    const matador = porId ? buscarEntidade(this.estado, porId) : undefined;
    const dono = matador?.invocacao ? buscarEntidade(this.estado, matador.invocacao.donoId) : matador;
    if (!preset || !dono?.bolsa) return;
    const fato: FatoDeMissao = { tipo: 'abate', preset, regiao: this.regiaoAtual()?.id ?? null };
    const raio = this.ctx.modo.partilhaXp?.raio ?? 0;
    for (const s of this.sessoes.values()) {
      const e = buscarEntidade(this.estado, s.entidadeId);
      const p = this.presencas.get(s.entidadeId);
      if (!e || !p) continue;
      const doGrupo = !!dono.grupo && e.grupo === dono.grupo && Math.max(Math.abs(e.x - dono.x), Math.abs(e.y - dono.y)) <= raio;
      if (e === dono || doGrupo) this.progredir(s, p, fato);
    }
  }

  private progredir(s: Sessao, p: Presenca, fato: FatoDeMissao): void {
    for (const { ativa, meta } of progredirMissoes(p.ficha, missoesPorId(this.reino), fato)) {
      this.avisar(s, { tipo: 'missao', id: ativa.id, progresso: ativa.progresso, meta });
    }
  }
}
