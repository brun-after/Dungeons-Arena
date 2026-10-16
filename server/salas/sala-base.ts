// Base das salas do Colyseus (§3.6). Marco 15 (15/10/2026): saiu da sala Livre para a campanha cooperativa usar a
// mesma conexão. A sala só cuida da conexão (WSS, reconexão, código) e embrulha a sala do núcleo, que decide tudo
// do jogo. Mensagens vão e vêm como texto JSON no tipo "m" — o mesmo protocolo do loopback (D-035).
//
// - O roomId é o código curto da sala (D-036).
// - Criador é cliente comum: sair não encerra a sala (§2.13). Sala vazia expira em 120 s.
// - Queda: a sessão fica reservada por 30 s (allowReconnection); a entidade fica parada e vulnerável.
// - Passo fixo de 60 Hz com acumulador do Colyseus (sem espiral, D-037).
// - Métricas vão também para a metadata da sala, que o `/saude` agrega (sem estado global).

import { matchMaker, Room, ServerError, type AuthContext, type Client } from '@colyseus/core';
import { RESERVA_RECONEXAO_MS, type Conexao, type SalaArena } from '../../src/arena/sala';
import { gerarCodigo, LimiteDeTentativas } from '../codigo-sala';
import type { Certificador } from '../certificacao';
import { Janela, registrarLog, type AtrasoDoAgendador } from '../metricas';

export const EXPIRACAO_SALA_VAZIA_MS = 120_000;
const INTERVALO_METRICAS_MS = 10_000;

/** O que cada tipo de sala põe na metadata, além das métricas (fase, tipo...). */
export type MetadataDaSala = Record<string, unknown>;

/**
 * Marco 16 (D-062): limites do processo, configurados uma vez na partida do servidor (servidor.ts). Na VM de 1 GB,
 * 6 salas no máximo e 6 criações por minuto por origem; a recusa sai com motivo (`servidor_cheio`, `muitas_salas`).
 */
export interface LimitesDoServidor {
  maxSalas: number;
  criacao: LimiteDeTentativas;
  agendador: AtrasoDoAgendador | null;
  /** Marco 17: confere e assina os certificados do personagem (a chave só existe no servidor). */
  certificador: Certificador | null;
}

export abstract class SalaColyseusBase extends Room {
  override autoDispose = false;
  override maxMessagesPerSecond = 120;

  static limites: LimitesDoServidor | null = null;

  /** Roda no pedido HTTP de matchmaking: na criação, confere o limite de salas e a taxa por origem. */
  static override async onAuth(_token: string, _opcoes: unknown, contexto: AuthContext): Promise<boolean> {
    const limites = SalaColyseusBase.limites;
    const pedido = contexto.req as { url?: unknown } | undefined;
    const url = typeof pedido?.url === 'string' ? pedido.url : '';
    if (!limites || !url.includes('/matchmake/create/')) return true;
    const origem = contexto.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? contexto.ip ?? 'local';
    if ((await matchMaker.query({})).length >= limites.maxSalas) {
      registrarLog('sala_recusada', { motivo: 'servidor_cheio' });
      throw new ServerError(503, 'servidor_cheio');
    }
    if (!limites.criacao.permitir(origem, Date.now())) {
      registrarLog('sala_recusada', { motivo: 'muitas_salas' });
      throw new ServerError(429, 'muitas_salas');
    }
    return true;
  }

  protected sala!: SalaArena;
  private readonly conexoes = new Map<string, Conexao>();
  private vaziaDesde: number | null = Date.now();
  private readonly duracaoTick = new Janela(600);
  private bytesNaUltimaMedida = 0;
  private reconexoes = 0;
  private tickP95Ms = 0;
  private tickP99Ms = 0;

  /** Cria a sala do núcleo a partir das opções (não confiáveis) de quem criou. */
  protected abstract criarSala(opcoes: unknown): SalaArena;
  /** A parte da metadata própria do tipo de sala (a fase pode mudar com o tempo). */
  protected abstract metadataPropria(): MetadataDaSala;

  override async onCreate(opcoes: unknown): Promise<void> {
    // Código único: tenta de novo nas raríssimas colisões.
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      const codigo = gerarCodigo();
      const existentes = await matchMaker.query({ roomId: codigo });
      if (existentes.length === 0) {
        this.roomId = codigo;
        break;
      }
    }
    this.sala = this.criarSala(opcoes);
    this.maxClients = this.sala.ctx.modo.maxJogadores;
    await this.atualizarMetadata();

    this.onMessage('m', (client: Client, texto: unknown) => {
      if (typeof texto === 'string') this.conexoes.get(client.sessionId)?.receber(texto);
    });

    this.setFixedTimestep((passo) => {
      const inicio = performance.now();
      this.sala.tick(passo.dtMs);
      this.duracaoTick.registrar(performance.now() - inicio);
    }, 60);

    this.clock.setInterval(() => {
      this.registrarMetricas();
    }, INTERVALO_METRICAS_MS);
    this.clock.setInterval(() => {
      this.expirarSeVazia();
    }, 1000);
    registrarLog('sala_criada', { sala: this.roomId, ...this.metadataPropria() });
  }

  override onJoin(client: Client): void {
    const id = client.sessionId;
    const conexao = this.sala.conectar((texto) => {
      this.clients.get(id)?.send('m', texto);
    });
    this.conexoes.set(id, conexao);
    this.vaziaDesde = null;
  }

  override async onDrop(client: Client): Promise<void> {
    this.conexoes.get(client.sessionId)?.fechar();
    await this.allowReconnection(client, RESERVA_RECONEXAO_MS / 1000);
  }

  override onReconnect(client: Client): void {
    this.reconexoes++;
    this.conexoes.get(client.sessionId)?.retomar();
  }

  override onLeave(client: Client): void {
    this.conexoes.get(client.sessionId)?.encerrar();
    this.conexoes.delete(client.sessionId);
    if (this.conexoes.size === 0) this.vaziaDesde = Date.now();
  }

  override onDispose(): void {
    registrarLog('sala_encerrada', { sala: this.roomId });
  }

  private expirarSeVazia(): void {
    if (this.vaziaDesde !== null && Date.now() - this.vaziaDesde >= EXPIRACAO_SALA_VAZIA_MS) {
      void this.disconnect();
    }
  }

  private bytesPorClientePorS = 0;

  /** setMetadata substitui (não mescla): manda sempre o objeto inteiro. É o que o `/saude` e o `/metricas` leem. */
  protected async atualizarMetadata(): Promise<void> {
    const m = this.sala.metricas();
    await this.setMetadata({
      ...this.metadataPropria(),
      tickP95Ms: this.tickP95Ms,
      tickP99Ms: this.tickP99Ms,
      jogadores: m.jogadores,
      bytesPorClientePorS: this.bytesPorClientePorS,
      entidades: m.entidades,
      fila: m.fila,
      rejeicoes: m.rejeicoes,
      reconexoes: this.reconexoes,
    });
  }

  private registrarMetricas(): void {
    const m = this.sala.metricas();
    const bytes = m.bytesEnviados - this.bytesNaUltimaMedida;
    this.bytesNaUltimaMedida = m.bytesEnviados;
    this.tickP95Ms = Number(this.duracaoTick.percentil(0.95).toFixed(3));
    this.tickP99Ms = Number(this.duracaoTick.percentil(0.99).toFixed(3));
    this.bytesPorClientePorS = m.jogadores > 0 ? Math.round(bytes / m.jogadores / (INTERVALO_METRICAS_MS / 1000)) : 0;
    void this.atualizarMetadata();
    const agendador = SalaColyseusBase.limites?.agendador;
    registrarLog('metricas_sala', {
      sala: this.roomId,
      ...this.metadataPropria(),
      jogadores: m.jogadores,
      tickP95Ms: this.tickP95Ms,
      tickP99Ms: this.tickP99Ms,
      atrasoAgendadorP95Ms: agendador?.p95Ms() ?? null,
      bytesPorClientePorS: this.bytesPorClientePorS,
      entidades: m.entidades,
      fila: m.fila,
      rejeicoes: m.rejeicoes,
      reconexoes: this.reconexoes,
      memoriaMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    });
  }
}
