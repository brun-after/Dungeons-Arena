// Sala do Colyseus para o modo Mundo (marco 29, 30/10/2026, D-128). Cada sala é um lugar (região, masmorra ou
// covil); a região cheia abre outra sala do mesmo lugar (o canal 2, 3...), porque o `joinOrCreate` filtra por
// `lugar` e `instancia`. A conexão é a da base; aqui ficam:
// - a autenticação (o token da conta Google, conferido pela persistência; sem nuvem, o token `local:` dos testes);
// - a entrada: pelo bilhete de uma troca de sala, ou carregando a ficha do slot (só na vila salva, ou criando o
//   personagem novo);
// - as pendências da sala do núcleo: gravar a ficha e trocar a sessão de sala (bilhete de uso único, 60 s).
// Um personagem fica em uma sala por vez (a mesma conta não entra duas vezes no mesmo slot).

import { randomUUID } from 'node:crypto';
import { matchMaker, ServerError, type AuthContext, type Client } from '@colyseus/core';
import { versaoDoConteudo } from '../../src/arena/protocolo';
import type { Celula } from '../../src/core/comandos';
import { conteudoOficial, type Conteudo } from '../../src/core/conteudo';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { ehObjeto } from '../../src/core/validar';
import { fichaNova, type FichaDoMundo } from '../../src/mundo/ficha-mundo';
import { idDoLugar, lerLugar } from '../../src/mundo/lugares';
import { reinoDoConteudo, type Reino } from '../../src/mundo/reino';
import { SalaMundo, type PendenciaDoMundo } from '../../src/mundo/sala-mundo';
import { registrarLog } from '../metricas';
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
  expira: number;
}

/** O reino do Mundo (marco 29: o Reino Central, o único por enquanto). */
export const reinoDoMundo = (conteudo: Conteudo): Reino => reinoDoConteudo(conteudo);

/** O que o coordenador pede a uma sala: soltar o personagem de uma sessão caída (devolve a ficha atual). */
interface SalaDoCoordenador {
  liberarCaida(identidade: string): FichaDoMundo | null;
}

/** O estado do Mundo no processo: o reino, a persistência, os bilhetes e quem está jogando. */
export class CoordenadorDoMundo {
  readonly reino: Reino;
  private readonly bilhetes = new Map<string, Bilhete>();
  /** Personagem -> a sala em que está (quem sai de uma sala velha não derruba a entrada na nova). */
  private readonly online = new Map<string, string>();
  private readonly salas = new Map<string, SalaDoCoordenador>();

  constructor(
    readonly persistencia: PersistenciaMundo,
    readonly conteudo: Conteudo = conteudoOficial(),
  ) {
    this.reino = reinoDoMundo(conteudo);
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
    for (const b of this.bilhetes.values()) if (`${b.conta}#${String(b.slot)}` === identidade) return true;
    return false;
  }

  entrar(identidade: string, sala: string): boolean {
    if (this.online.has(identidade)) return false;
    this.online.set(identidade, sala);
    return true;
  }

  sair(identidade: string, sala: string | null = null): void {
    if (sala === null || this.online.get(identidade) === sala) this.online.delete(identidade);
  }

  registrarSala(id: string, sala: SalaDoCoordenador | null): void {
    if (sala) this.salas.set(id, sala);
    else this.salas.delete(id);
  }

  /**
   * Marco 29 (30/10/2026): o personagem que está online por uma sessão caída (a página recarregada fica 30 s na
   * reserva de reconexão) é solto, com a ficha atual, para a entrada nova. null quando a sessão está ativa.
   */
  liberarCaida(identidade: string): FichaDoMundo | null {
    const sala = this.online.get(identidade);
    const ficha = sala === undefined ? null : (this.salas.get(sala)?.liberarCaida(identidade) ?? null);
    if (ficha) this.sair(identidade);
    return ficha;
  }

  gravar(conta: string, slot: number, ficha: FichaDoMundo): void {
    this.persistencia.gravar(conta, slot, ficha).catch((e: unknown) => {
      registrarLog('mundo_gravacao_falhou', { motivo: e instanceof Error ? e.message : String(e) });
    });
  }
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

  liberarCaida(identidade: string): FichaDoMundo | null {
    for (const [sessionId, id] of this.identidades) {
      if (id !== identidade || !this.caidas.has(sessionId)) continue;
      this.identidades.delete(sessionId);
      this.encerrarCaida(sessionId);
      let ficha: FichaDoMundo | null = null;
      for (const p of this.mundo.retirarPendencias()) {
        if (p.identidade === identidade) ficha = p.ficha;
        this.atender(p);
      }
      return ficha;
    }
    return null;
  }

  protected metadataPropria(): MetadataDaSala {
    // `lugar` e `instancia` são os filtros do matchmaking (o setMetadata da base substitui tudo, então vão sempre).
    return { tipo: 'mundo', lugar: this.mundo.idLugar, instancia: this.instancia, canal: this.canal };
  }

  override async onAuth(_client: Client, _opcoes: unknown, contexto: AuthContext): Promise<{ conta: string }> {
    const conta = contexto.token ? await this.coordenador.persistencia.autenticar(contexto.token) : null;
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
    const entrada = await this.prepararEntrada(conta, o);
    const identidade = `${conta}#${String(entrada.slot)}`;
    if (!this.coordenador.entrar(identidade, this.roomId)) {
      // A página recarregada: a sessão velha caiu e ainda está na reserva; a entrada nova fica com a ficha dela.
      const ficha = this.coordenador.liberarCaida(identidade);
      if (!ficha || !this.coordenador.entrar(identidade, this.roomId)) throw new ServerError(409, 'ja_jogando');
      if (entrada.chegada === null) entrada.ficha = ficha;
    }
    this.mundo.reservar(identidade, entrada.ficha, entrada.chegada);
    this.identidades.set(client.sessionId, identidade);
    void super.onJoin(client);
    registrarLog('mundo_entrada', { lugar: this.mundo.idLugar, canal: this.canal });
  }

  override onLeave(client: Client): void {
    void super.onLeave(client);
    this.processarPendencias();
    const identidade = this.identidades.get(client.sessionId);
    this.identidades.delete(client.sessionId);
    if (identidade && !this.coordenador.emTroca(identidade)) this.coordenador.sair(identidade, this.roomId);
  }

  /** Pelo bilhete (troca de sala) ou pelo slot (entrar no jogo, sempre na vila salva; ou criar o personagem). */
  private async prepararEntrada(conta: string, o: Record<string, unknown>): Promise<{ slot: number; ficha: FichaDoMundo; chegada: Celula | null }> {
    if (typeof o.bilhete === 'string') {
      const b = this.coordenador.usar(o.bilhete, conta, this.mundo.idLugar);
      if (!b) throw new ServerError(403, 'bilhete_invalido');
      this.coordenador.sair(`${conta}#${String(b.slot)}`);
      return { slot: b.slot, ficha: b.ficha, chegada: b.chegada };
    }
    if (!slotValido(o.slot)) throw new ServerError(400, 'slot_invalido');
    const slot = o.slot;
    let ficha = await this.coordenador.persistencia.carregar(conta, slot);
    if (!ficha && ehObjeto(o.criar) && typeof o.criar.classeId === 'string') {
      const nome = typeof o.criar.nome === 'string' ? o.criar.nome : '';
      ficha = fichaNova({ conteudo: this.coordenador.conteudo, balance: BALANCE_PADRAO }, this.coordenador.reino, o.criar.classeId, nome, randomUUID());
      if (ficha) await this.coordenador.persistencia.gravar(conta, slot, ficha);
    }
    if (!ficha) throw new ServerError(404, 'sem_personagem');
    if (this.mundo.idLugar !== `regiao:${ficha.vilaSalva}`) throw new ServerError(409, 'fora_da_vila_salva');
    return { slot, ficha, chegada: null };
  }

  private processarPendencias(): void {
    for (const p of this.mundo.retirarPendencias()) this.atender(p);
  }

  private atender(p: PendenciaDoMundo): void {
    const { conta, slot } = separar(p.identidade);
    this.coordenador.gravar(conta, slot, p.ficha);
    if (p.tipo === 'gravar') return;
    const destino = lerLugar(this.coordenador.reino, p.destino);
    if (!destino) return;
    const lugar = idDoLugar(destino);
    const bilhete = this.coordenador.emitir({ conta, slot, ficha: p.ficha, lugar, chegada: p.chegada, instancia: p.instancia });
    this.mundo.despedir(p.sessaoId, { tipo: 'trocarSala', lugar, bilhete, instancia: p.instancia });
    registrarLog('mundo_troca', { de: this.mundo.idLugar, para: lugar });
  }
}
