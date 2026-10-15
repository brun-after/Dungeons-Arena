// Base das salas do Colyseus (§3.6). Marco 15 (15/10/2026): saiu da sala Livre para a campanha cooperativa usar a
// mesma conexão. A sala só cuida da conexão (WSS, reconexão, código) e embrulha a sala do núcleo, que decide tudo
// do jogo. Mensagens vão e vêm como texto JSON no tipo "m" — o mesmo protocolo do loopback (D-035).
//
// - O roomId é o código curto da sala (D-036).
// - Criador é cliente comum: sair não encerra a sala (§2.13). Sala vazia expira em 120 s.
// - Queda: a sessão fica reservada por 30 s (allowReconnection); a entidade fica parada e vulnerável.
// - Passo fixo de 60 Hz com acumulador do Colyseus (sem espiral, D-037).
// - Métricas vão também para a metadata da sala, que o `/saude` agrega (sem estado global).

import { matchMaker, Room, type Client } from '@colyseus/core';
import { RESERVA_RECONEXAO_MS, type Conexao, type SalaArena } from '../../src/arena/sala';
import { gerarCodigo } from '../codigo-sala';
import { Janela, registrarLog } from '../metricas';

export const EXPIRACAO_SALA_VAZIA_MS = 120_000;
const INTERVALO_METRICAS_MS = 10_000;

/** O que cada tipo de sala põe na metadata, além das métricas (fase, tipo...). */
export type MetadataDaSala = Record<string, unknown>;

export abstract class SalaColyseusBase extends Room {
  override autoDispose = false;
  override maxMessagesPerSecond = 120;

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

  /** setMetadata substitui (não mescla): manda sempre o objeto inteiro. */
  protected async atualizarMetadata(): Promise<void> {
    await this.setMetadata({ ...this.metadataPropria(), tickP95Ms: this.tickP95Ms, tickP99Ms: this.tickP99Ms, jogadores: this.sala.jogadores });
  }

  private registrarMetricas(): void {
    const m = this.sala.metricas();
    const bytes = m.bytesEnviados - this.bytesNaUltimaMedida;
    this.bytesNaUltimaMedida = m.bytesEnviados;
    this.tickP95Ms = Number(this.duracaoTick.percentil(0.95).toFixed(3));
    this.tickP99Ms = Number(this.duracaoTick.percentil(0.99).toFixed(3));
    void this.atualizarMetadata();
    registrarLog('metricas_sala', {
      sala: this.roomId,
      ...this.metadataPropria(),
      jogadores: m.jogadores,
      tickP95Ms: this.tickP95Ms,
      tickP99Ms: this.tickP99Ms,
      bytesPorClientePorS: m.jogadores > 0 ? Math.round(bytes / m.jogadores / (INTERVALO_METRICAS_MS / 1000)) : 0,
      rejeicoes: m.rejeicoes,
      reconexoes: this.reconexoes,
      memoriaMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    });
  }
}
