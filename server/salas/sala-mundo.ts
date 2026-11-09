// Sala do Colyseus para o modo Mundo (marco 29, 30/10/2026, D-128). Cada sala é um lugar (região, masmorra ou
// covil); a região cheia abre outra sala do mesmo lugar (o canal 2, 3...), porque o `joinOrCreate` filtra por
// `lugar` e `instancia`. A conexão é a da base; aqui ficam:
// - a autenticação (o token da conta Google, conferido pela persistência; sem nuvem, o token `local:` dos testes);
// - a entrada: pelo bilhete de uma troca de sala, ou carregando a ficha do slot (só na vila salva, ou criando o
//   personagem novo);
// - as pendências da sala do núcleo: gravar a ficha e trocar a sessão de sala (bilhete de uso único, 60 s).
// Um personagem fica em uma sala por vez (a mesma conta não entra duas vezes no mesmo slot).
// Marco 30 (30/10/2026, D-129): o coordenador guarda também os grupos, o perfil de quem está online (nome, classe,
// nível e lugar, para o grupo e o convite pelo nome) e a loja do mercado; os serviços que passam entre salas ficam em
// server/mundo-servicos.ts.

import { randomUUID } from 'node:crypto';
import { matchMaker, ServerError, type AuthContext, type Client } from '@colyseus/core';
import { versaoDoConteudo } from '../../src/arena/protocolo';
import type { Celula } from '../../src/core/comandos';
import { conteudoOficial, type Conteudo } from '../../src/core/conteudo';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { ehObjeto } from '../../src/core/validar';
import type { AvisoDoMundo } from '../../src/mundo/avisos';
import { depositarNoBanco } from '../../src/mundo/banco';
import { fichaNova, type FichaDoMundo } from '../../src/mundo/ficha-mundo';
import { GruposDoMundo } from '../../src/mundo/grupos';
import { idDoLugar, lerLugar, montarLugar, type Lugar, type LugarMontado } from '../../src/mundo/lugares';
import { modoPorId } from '../../src/core/conteudo';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { reinoDoConteudo, type Reino } from '../../src/mundo/reino';
import { SalaMundo, type PendenciaDoMundo, type ResultadoDoMercado } from '../../src/mundo/sala-mundo';
import type { InvocacaoQueViaja } from '../../src/mundo/comitiva';
import { MercadoEmMemoria, type LojaDoMercado } from '../mercado-mundo';
import { registrarLog } from '../metricas';
import { atenderMercado, atenderSocial, publicarGrupo } from '../mundo-servicos';
import { slotValido, type PersistenciaMundo } from '../persistencia-mundo';
import { SalaColyseusBase, type MetadataDaSala } from './sala-base';

const VALIDADE_BILHETE_MS = 60_000;
const INTERVALO_PENDENCIAS_MS = 200;

interface Bilhete {
  conta: string;
  slot: number;
  ficha: FichaDoMundo;
  lugar: string;
  chegada: Celula | null;
  instancia: string | null;
  /** 09/11/2026 (D-144): as invocações que viajam com o personagem. */
  comitiva?: InvocacaoQueViaja[];
  expira: number;
}

/** O reino do Mundo (marco 29: o Reino Central, o único por enquanto). */
export const reinoDoMundo = (conteudo: Conteudo): Reino => reinoDoConteudo(conteudo);

/** O que o coordenador pede a uma sala: soltar a sessão caída e entregar a quem está nela (false = não está). */
interface SalaDoCoordenador {
  visaoParty?(identidade: string): import('../../src/mundo/avisos').VisaoExternaParty | null;
  /** null: a sessão está ativa; senão, a ficha que estava pendente (null se a sessão já tinha sido despedida). */
  liberarCaida(identidade: string): { ficha: FichaDoMundo | null } | null;
  entregar(identidade: string, aviso: AvisoDoMundo): boolean;
  definirGrupo(identidade: string, grupo: string | null): boolean;
  concluirMercado(identidade: string, r: ResultadoDoMercado): boolean;
}

interface Perfil {
  nome: string;
  classeId: string;
  nivel: number;
}

/** O estado do Mundo no processo: o reino, a persistência, os bilhetes e quem está jogando. */
export class CoordenadorDoMundo {
  readonly reino: Reino;
  private readonly bilhetes = new Map<string, Bilhete>();
  /** Personagem -> a sala em que está (quem sai de uma sala velha não derruba a entrada na nova). */
  private readonly online = new Map<string, string>();
  private readonly donosDaReserva = new Map<string, string>();
  private readonly salas = new Map<string, SalaDoCoordenador>();
  /** Personagem -> o texto da última ficha gravada (só enquanto está online). */
  private readonly gravadas = new Map<string, string>();
  private readonly gravacoesPendentes = new Map<string, Promise<void>>();
  private readonly operacoes = new Map<string, Promise<unknown>>();
  private readonly operacoesMercado = new Map<string, number>();

  /** Uma compra em trânsito também precisa terminar antes de apagar o personagem. */
  iniciarMercado(identidade: string): () => void {
    this.operacoesMercado.set(identidade, (this.operacoesMercado.get(identidade) ?? 0) + 1);
    return () => {
      const restantes = (this.operacoesMercado.get(identidade) ?? 1) - 1;
      if (restantes > 0) this.operacoesMercado.set(identidade, restantes);
      else this.operacoesMercado.delete(identidade);
    };
  }

  /** Entrada e exclusão do mesmo slot não podem atravessar uma à outra durante I/O. */
  async noSlot<T>(conta: string, slot: number, fazer: () => Promise<T>): Promise<T> {
    const chave = `${conta}#${String(slot)}`;
    const anterior = this.operacoes.get(chave) ?? Promise.resolve();
    const atual = anterior.catch(() => {}).then(fazer);
    this.operacoes.set(chave, atual);
    try { return await atual; }
    finally { if (this.operacoes.get(chave) === atual) this.operacoes.delete(chave); }
  }

  slotDoBilhete(id: string): number | undefined { return this.bilhetes.get(id)?.slot; }

  /**
   * 09/11/2026 (D-144): a conta de um bilhete ainda válido. O bilhete (UUID de uso único, 60 s) já prova quem viaja:
   * a troca de sala não depende do token da conta, que vence em 1 h, nem de a nuvem responder naquele instante.
   */
  contaDoBilhete(id: string): string | null {
    const b = this.bilhetes.get(id);
    return b && b.expira >= Date.now() ? b.conta : null;
  }

  async excluir(conta: string, slot: number, nome: string): Promise<string | null> {
    return this.noSlot(conta, slot, async () => {
      const identidade = `${conta}#${String(slot)}`;
      if (this.online.has(identidade) || this.emTroca(identidade)) return 'ja_jogando';
      if (this.operacoesMercado.has(identidade)) return 'mercado_pendente';
      const ficha = await this.carregar(conta, slot);
      if (!ficha) return 'sem_personagem';
      if (ficha.personagem.nome !== nome) return 'nome_diferente';
      // O mercado identifica o vendedor pelo slot. Evita herdar anúncios de um personagem apagado.
      if ((await this.mercado.doVendedor(identidade)).length) return 'mercado_pendente';
      if (this.operacoesMercado.has(identidade)) return 'mercado_pendente';
      await this.persistencia.excluir(conta, slot);
      this.gravadas.delete(identidade);
      this.cancelarBilhetesDe(identidade);
      this.saiuDoJogo(identidade);
      return null;
    });
  }
  /** 09/11/2026 (D-144): cada lugar montado uma vez (as salas novas clonam o estado inicial). */
  private readonly moldes = new Map<string, LugarMontado>();

  moldeDe(lugar: Lugar): LugarMontado {
    const id = idDoLugar(lugar);
    let m = this.moldes.get(id);
    if (!m) {
      m = montarLugar(this.conteudo, this.reino, lugar, modoPorId(this.conteudo, MODO_MUNDO));
      this.moldes.set(id, m);
    }
    return m;
  }

  /**
   * 09/11/2026 (D-144): monta as regiões logo que o servidor sobe, uma por vez com folga entre elas, para a primeira
   * entrada em cada região não travar quem já está jogando.
   */
  aquecer(intervaloMs = 250): void {
    const ids = this.reino.regioes.map((r) => `regiao:${r.id}`);
    const proxima = () => {
      const id = ids.shift();
      if (id === undefined) return;
      const lugar = lerLugar(this.reino, id);
      if (lugar && !this.moldes.has(id)) this.moldeDe(lugar);
      setTimeout(proxima, intervaloMs).unref();
    };
    setTimeout(proxima, intervaloMs).unref();
  }

  /** Personagem -> o lugar onde está (para o grupo) e o perfil (o convite pelo nome). */
  private readonly lugares = new Map<string, string>();
  private readonly perfis = new Map<string, Perfil>();
  readonly grupos: GruposDoMundo;

  constructor(
    readonly persistencia: PersistenciaMundo,
    readonly conteudo: Conteudo = conteudoOficial(),
    readonly mercado: LojaDoMercado = new MercadoEmMemoria(),
  ) {
    this.reino = reinoDoMundo(conteudo);
    const g = BALANCE_PADRAO.mundo.grupo;
    this.grupos = new GruposDoMundo(g.max, g.conviteS * 1000);
  }

  /** Quem entrou numa sala: o perfil e o lugar (o grupo mostra onde cada um está). */
  registrarPerfil(identidade: string, ficha: FichaDoMundo, lugar: string): void {
    const p = ficha.personagem;
    this.perfis.set(identidade, { nome: p.nome, classeId: p.bolsa.classeId, nivel: p.nivel });
    this.lugares.set(identidade, lugar);
    const grupo = this.grupos.grupoDe(identidade);
    if (grupo) publicarGrupo(this, grupo);
  }

  perfil(identidade: string): Perfil | undefined {
    return this.perfis.get(identidade);
  }

  lugarDe(identidade: string): string | null {
    return this.online.has(identidade) ? (this.lugares.get(identidade) ?? null) : null;
  }

  /** O personagem online com o nome (sem caixa); o primeiro, se houver dois iguais. */
  porNome(nome: string): string | undefined {
    const n = nome.trim().toLowerCase();
    for (const id of this.online.keys()) if (this.perfis.get(id)?.nome.toLowerCase() === n) return id;
    return undefined;
  }

  private salaDe(identidade: string): SalaDoCoordenador | undefined {
    const id = this.online.get(identidade);
    return id === undefined ? undefined : this.salas.get(id);
  }

  entregarA(identidade: string, aviso: AvisoDoMundo): boolean {
    return this.salaDe(identidade)?.entregar(identidade, aviso) ?? false;
  }

  definirGrupoDe(identidade: string, grupo: string | null): boolean {
    return this.salaDe(identidade)?.definirGrupo(identidade, grupo) ?? false;
  }

  private readonly ultimaVisaoParty = new Map<string, number>();
  visoesParty(quem: string): void {
    const agora = Date.now();
    if (agora - (this.ultimaVisaoParty.get(quem) ?? 0) < 200) return;
    this.ultimaVisaoParty.set(quem, agora);
    const grupo = this.grupos.grupoDe(quem);
    const salas = new Set<string>();
    const visoes: import('../../src/mundo/avisos').VisaoExternaParty[] = [];
    for (const membro of grupo?.membros ?? []) {
      const salaId = this.online.get(membro);
      if (!salaId || salaId === this.online.get(quem) || salas.has(salaId)) continue;
      salas.add(salaId);
      const visao = this.salaDe(membro)?.visaoParty?.(membro);
      if (visao) visoes.push(visao);
    }
    this.entregarA(quem, { tipo: 'visoesParty', visoes });
  }

  /** Entrega o resultado do mercado na sala onde a pessoa está; se saiu do jogo, no banco da ficha guardada. */
  async concluirMercadoDe(identidade: string, r: ResultadoDoMercado): Promise<void> {
    if (this.salaDe(identidade)?.concluirMercado(identidade, r)) return;
    const { conta, slot } = separar(identidade);
    await this.noSlot(conta, slot, async () => {
      if (this.salaDe(identidade)?.concluirMercado(identidade, r)) return;
      const ficha = await this.carregar(conta, slot);
      if (!ficha) {
        registrarLog('mundo_mercado_entrega_perdida', { itens: r.itens.length, ouro: r.ouro + r.ouroNoBanco });
        return;
      }
      depositarNoBanco(ficha.banco, r.itens, r.ouro + r.ouroNoBanco);
      await this.persistencia.gravar(conta, slot, ficha);
      this.gravadas.delete(identidade);
    });
  }

  /** Saiu do jogo de vez (não é troca de sala): sai do grupo, e os outros ficam sabendo. */
  saiuDoJogo(identidade: string): void {
    this.ultimaVisaoParty.delete(identidade);
    const r = this.grupos.sair(identidade);
    if (r) publicarGrupo(this, r.desfeito ? null : r.grupo, r.desfeito ? r.grupo.membros : []);
    this.perfis.delete(identidade);
    this.lugares.delete(identidade);
  }

  emitir(b: Omit<Bilhete, 'expira'>): string {
    const agora = Date.now();
    for (const [k, x] of this.bilhetes) if (x.expira < agora) this.bilhetes.delete(k);
    const id = randomUUID();
    this.bilhetes.set(id, { ...b, expira: agora + VALIDADE_BILHETE_MS });
    return id;
  }

  usar(id: string, conta: string, lugar: string): Bilhete | null {
    const b = this.bilhetes.get(id);
    if (!b || b.conta !== conta || b.lugar !== lugar || b.expira < Date.now()) return null;
    this.bilhetes.delete(id);
    return b;
  }

  /** Há bilhete em aberto para o personagem (está trocando de sala: não conta como saída). */
  emTroca(identidade: string): boolean {
    for (const [id, b] of this.bilhetes) {
      if (b.expira <= Date.now()) { this.bilhetes.delete(id); continue; }
      if (`${b.conta}#${String(b.slot)}` === identidade) return true;
    }
    return false;
  }

  cancelarBilhetesDe(identidade: string): void {
    for (const [id, b] of this.bilhetes) if (`${b.conta}#${String(b.slot)}` === identidade) this.bilhetes.delete(id);
  }

  entrar(identidade: string, sala: string, sessao = sala): boolean {
    if (this.online.has(identidade)) return false;
    this.online.set(identidade, sala);
    this.donosDaReserva.set(identidade, sessao);
    return true;
  }

  sair(identidade: string, sala: string | null = null, sessao?: string): boolean {
    if (sala !== null && this.online.get(identidade) !== sala) return false;
    if (sessao !== undefined && this.donosDaReserva.get(identidade) !== sessao) return false;
    this.donosDaReserva.delete(identidade);
    this.online.delete(identidade);
    // Sem guardar a última gravada de quem saiu (a troca de sala também passa aqui: custa uma gravação a mais).
    this.gravadas.delete(identidade);
    return true;
  }

  registrarSala(id: string, sala: SalaDoCoordenador | null): void {
    if (sala) this.salas.set(id, sala);
    else {
      this.salas.delete(id);
      for (const [identidade, salaId] of this.online) if (salaId === id) {
        this.sair(identidade, id);
        this.saiuDoJogo(identidade);
      }
    }
  }

  /**
   * Marco 29 (30/10/2026): o personagem que está online por uma sessão caída (a página recarregada fica 30 s na
   * reserva de reconexão) é solto, com a ficha atual, para a entrada nova. null quando a sessão está ativa.
   */
  liberarCaida(identidade: string): { ficha: FichaDoMundo | null } | null {
    const sala = this.online.get(identidade);
    const solta = sala === undefined ? null : (this.salas.get(sala)?.liberarCaida(identidade) ?? null);
    if (solta) this.sair(identidade);
    return solta;
  }

  /**
   * Marco 30 (30/10/2026, D-129): grava só quando a ficha mudou desde a última gravação deste processo (o checkpoint
   * de 60 s de quem está parado na vila não vai ao banco). A falha esquece a última, para a próxima tentar de novo.
   */
  gravar(conta: string, slot: number, ficha: FichaDoMundo): void {
    const chave = `${conta}#${String(slot)}`;
    const texto = JSON.stringify(ficha);
    if (this.gravadas.get(chave) === texto) return;
    this.gravadas.set(chave, texto);
    // 01/11/2026: saída e checkpoints gravam em ordem; reentrada aguarda o último save.
    const copia = structuredClone(ficha);
    const pendente = (this.gravacoesPendentes.get(chave) ?? Promise.resolve()).then(() => this.persistencia.gravar(conta, slot, copia)).catch((e: unknown) => {
      if (this.gravadas.get(chave) === texto) this.gravadas.delete(chave);
      registrarLog('mundo_gravacao_falhou', { motivo: e instanceof Error ? e.message : String(e) });
    }).finally(() => {
      if (this.gravacoesPendentes.get(chave) === pendente) this.gravacoesPendentes.delete(chave);
    });
    this.gravacoesPendentes.set(chave, pendente);
  }

  async carregar(conta: string, slot: number): Promise<FichaDoMundo | null> {
    await this.gravacoesPendentes.get(`${conta}#${String(slot)}`);
    return this.persistencia.carregar(conta, slot);
  }
}

/** 09/11/2026 (D-144): uma falha passageira da nuvem não vira "sessão expirada": tenta mais uma vez. */
async function autenticarComRetentativa(p: PersistenciaMundo, token: string): Promise<string | null> {
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const conta = await p.autenticar(token);
      if (conta) return conta;
    } catch {
      // a próxima tentativa decide
    }
    if (tentativa === 0) await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

const separar = (identidade: string): { conta: string; slot: number } => {
  const i = identidade.lastIndexOf('#');
  return { conta: identidade.slice(0, i), slot: Number(identidade.slice(i + 1)) };
};

export class SalaMundoColyseus extends SalaColyseusBase {
  static coordenador: CoordenadorDoMundo | null = null;

  private mundo!: SalaMundo;
  private canal = 1;
  /** A masmorra instanciada (vazio nos lugares compartilhados). Fica na metadata: o `joinOrCreate` filtra por ela. */
  private instancia = '';
  private readonly identidades = new Map<string, string>();

  private get coordenador(): CoordenadorDoMundo {
    const c = SalaMundoColyseus.coordenador;
    if (!c) throw new Error('mundo sem coordenador');
    return c;
  }

  protected criarSala(opcoes: unknown): SalaMundo {
    const o = ehObjeto(opcoes) ? opcoes : {};
    const lugar = lerLugar(this.coordenador.reino, o.lugar);
    if (!lugar) throw new ServerError(400, 'lugar_invalido');
    this.instancia = typeof o.instancia === 'string' ? o.instancia.slice(0, 120) : '';
    this.mundo = new SalaMundo(this.coordenador.reino, lugar, this.coordenador.conteudo, {
      molde: this.coordenador.moldeDe(lugar),
      semente: Math.floor(Math.random() * 2 ** 31),
      canal: this.canal,
      agora: () => Date.now(),
      versaoConteudo: versaoDoConteudo(),
    });
    this.clock.setInterval(() => {
      this.processarPendencias();
    }, INTERVALO_PENDENCIAS_MS);
    return this.mundo;
  }

  /** O canal é a ordem da sala entre as do mesmo lugar (a região cheia abre a próxima). */
  override async onCreate(opcoes: unknown): Promise<void> {
    const o = ehObjeto(opcoes) ? opcoes : {};
    const mesmas = (await matchMaker.query({ name: 'mundo' })).filter((s) => {
      const m = (s.metadata ?? {}) as { lugar?: unknown };
      return m.lugar === o.lugar;
    });
    this.canal = mesmas.length + 1;
    await super.onCreate(opcoes);
    this.coordenador.registrarSala(this.roomId, this);
  }

  override onDispose(): void {
    SalaMundoColyseus.coordenador?.registrarSala(this.roomId, null);
    super.onDispose();
  }

  entregar(identidade: string, aviso: AvisoDoMundo): boolean {
    return this.mundo.entregar(identidade, aviso);
  }

  visaoParty(identidade: string): import('../../src/mundo/avisos').VisaoExternaParty | null {
    return this.mundo.visaoParty(identidade);
  }

  definirGrupo(identidade: string, grupo: string | null): boolean {
    return this.mundo.definirGrupo(identidade, grupo);
  }

  concluirMercado(identidade: string, r: ResultadoDoMercado): boolean {
    return this.mundo.concluirMercado(identidade, r);
  }

  liberarCaida(identidade: string): { ficha: FichaDoMundo | null } | null {
    for (const [sessionId, id] of this.identidades) {
      if (id !== identidade || !this.caidas.has(sessionId)) continue;
      this.identidades.delete(sessionId);
      this.encerrarCaida(sessionId);
      let ficha: FichaDoMundo | null = null;
      for (const p of this.mundo.retirarPendencias()) {
        if (p.identidade === identidade && (p.tipo === 'gravar' || p.tipo === 'trocar')) ficha = p.ficha;
        this.atender(p);
      }
      // 09/11/2026 (D-144): a sessão despedida numa troca (sem pendência) também solta; antes ficava 'ja_jogando'.
      return { ficha };
    }
    return null;
  }

  protected metadataPropria(): MetadataDaSala {
    // `lugar` e `instancia` são os filtros do matchmaking (o setMetadata da base substitui tudo, então vão sempre).
    return { tipo: 'mundo', lugar: this.mundo.idLugar, instancia: this.instancia, canal: this.canal };
  }

  override async onAuth(_client: Client, opcoes: unknown, contexto: AuthContext): Promise<{ conta: string }> {
    // 09/11/2026 (D-144): na troca de sala, o bilhete basta (o token venceu em 1 h e derrubava quem viajava).
    const o = ehObjeto(opcoes) ? opcoes : {};
    const doBilhete = typeof o.bilhete === 'string' ? this.coordenador.contaDoBilhete(o.bilhete) : null;
    if (doBilhete) return { conta: doBilhete };
    const conta = contexto.token ? await autenticarComRetentativa(this.coordenador.persistencia, contexto.token) : null;
    if (!conta) throw new ServerError(401, 'sem_conta');
    return { conta };
  }

  protected override identidadeDe(client: Client): string | null {
    return this.identidades.get(client.sessionId) ?? null;
  }

  override async onJoin(client: Client, opcoes?: unknown): Promise<void> {
    const o = ehObjeto(opcoes) ? opcoes : {};
    const auth = client.auth as { conta?: unknown } | undefined;
    const conta = typeof auth?.conta === 'string' ? auth.conta : null;
    if (!conta) throw new ServerError(401, 'sem_conta');
    const slot = typeof o.bilhete === 'string' ? this.coordenador.slotDoBilhete(o.bilhete) : o.slot;
    if (!slotValido(slot)) throw new ServerError(400, typeof o.bilhete === 'string' ? 'bilhete_invalido' : 'slot_invalido');
    await this.coordenador.noSlot(conta, slot, async () => {
      const entrada = await this.prepararEntrada(conta, o);
      const identidade = `${conta}#${String(entrada.slot)}`;
      if (!this.coordenador.entrar(identidade, this.roomId, client.sessionId)) {
        // A página recarregada: a sessão velha caiu e ainda está na reserva; a entrada nova fica com a ficha dela.
        const solta = this.coordenador.liberarCaida(identidade);
        if (!solta || !this.coordenador.entrar(identidade, this.roomId, client.sessionId)) throw new ServerError(409, 'ja_jogando');
        if (entrada.chegada === null && solta.ficha) entrada.ficha = solta.ficha;
      }
      // Uma entrada pelo menu substitui qualquer transferência abandonada.
      if (typeof o.bilhete !== 'string') this.coordenador.cancelarBilhetesDe(identidade);
      this.mundo.reservar(identidade, entrada.ficha, entrada.chegada, this.coordenador.grupos.grupoDe(identidade)?.id ?? null, entrada.comitiva);
      this.coordenador.registrarPerfil(identidade, entrada.ficha, this.mundo.idLugar);
      this.identidades.set(client.sessionId, identidade);
      void super.onJoin(client);
      registrarLog('mundo_entrada', { lugar: this.mundo.idLugar, canal: this.canal });
    });
  }

  override onLeave(client: Client): void {
    void super.onLeave(client);
    this.processarPendencias();
    const identidade = this.identidades.get(client.sessionId);
    this.identidades.delete(client.sessionId);
    // 01/11/2026: bilhete guarda a transferência, não uma sessão fantasma.
    // A sessão antiga nunca libera a reserva da nova, mesmo na mesma sala.
    if (identidade && this.coordenador.sair(identidade, this.roomId, client.sessionId) && !this.coordenador.emTroca(identidade)) {
      this.coordenador.saiuDoJogo(identidade);
    }
  }

  /** Pelo bilhete (troca de sala) ou pelo slot (entrar no jogo, sempre na vila salva; ou criar o personagem). */
  private async prepararEntrada(conta: string, o: Record<string, unknown>): Promise<{ slot: number; ficha: FichaDoMundo; chegada: Celula | null; comitiva: InvocacaoQueViaja[] }> {
    if (typeof o.bilhete === 'string') {
      const b = this.coordenador.usar(o.bilhete, conta, this.mundo.idLugar);
      if (!b) throw new ServerError(403, 'bilhete_invalido');
      this.coordenador.sair(`${conta}#${String(b.slot)}`);
      return { slot: b.slot, ficha: b.ficha, chegada: b.chegada, comitiva: b.comitiva ?? [] };
    }
    if (!slotValido(o.slot)) throw new ServerError(400, 'slot_invalido');
    const slot = o.slot;
    let ficha = await this.coordenador.carregar(conta, slot);
    if (!ficha && ehObjeto(o.criar) && typeof o.criar.classeId === 'string') {
      const nome = typeof o.criar.nome === 'string' ? o.criar.nome : '';
      ficha = fichaNova({ conteudo: this.coordenador.conteudo, balance: BALANCE_PADRAO }, this.coordenador.reino, o.criar.classeId, nome, randomUUID());
      if (ficha) await this.coordenador.persistencia.gravar(conta, slot, ficha);
    }
    if (!ficha) throw new ServerError(404, 'sem_personagem');
    if (this.mundo.idLugar !== `regiao:${ficha.vilaSalva}`) throw new ServerError(409, 'fora_da_vila_salva');
    return { slot, ficha, chegada: null, comitiva: [] };
  }

  private processarPendencias(): void {
    for (const p of this.mundo.retirarPendencias()) this.atender(p);
  }

  private atender(p: PendenciaDoMundo): void {
    if (p.tipo === 'social') {
      atenderSocial(this.coordenador, p);
      return;
    }
    if (p.tipo === 'mercado') {
      void atenderMercado(this.coordenador, p);
      return;
    }
    const { conta, slot } = separar(p.identidade);
    this.coordenador.gravar(conta, slot, p.ficha);
    if (p.tipo === 'gravar') return;
    const destino = lerLugar(this.coordenador.reino, p.destino);
    if (!destino) return;
    const lugar = idDoLugar(destino);
    const bilhete = this.coordenador.emitir({ conta, slot, ficha: p.ficha, lugar, chegada: p.chegada, instancia: p.instancia, comitiva: p.comitiva });
    this.mundo.despedir(p.sessaoId, { tipo: 'trocarSala', lugar, bilhete, instancia: p.instancia });
    registrarLog('mundo_troca', { de: this.mundo.idLugar, para: lugar });
  }
}
