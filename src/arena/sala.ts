// Sala autoritativa da arena (§3.6). Só ela decide movimento, combate, loot e pontuação; o cliente
// envia intenções. O mesmo código roda em loopback (marco 4) e no servidor dedicado (marco 5).
//
// Por comando: a entidade vem da sessão (nunca do payload), época e seq são conferidos (seq repetido
// é ignorado: deduplicação), há balde de fichas (60/s, burst 20) e fila limitada; o comando vale no
// `tickCliente` se ainda não passou, senão no tick atual (D-033). Nenhum jogador acelera a simulação
// mandando mais mensagens, e o criador da sala não tem prioridade nenhuma.
// Marco 15 (15/10/2026): a campanha cooperativa (coop/sala-campanha.ts) estende esta sala pelos ganchos
// `criarPersonagem`, `motivoParaRecusar`, `depoisDoTick`, `aoRemoverSessao` e `trocarMundo`; os comandos aceitos
// pela rede vêm do modo (`comandosDeRede`).

import { posicionar } from '../entities/entidade';
import type { Comando, ComandoDoTick, Dir8, EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { criarEstado, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { criarRng, proximoU32, type EstadoRng } from '../core/rng';
import { simular } from '../core/simulacao';
import { ticksDe } from '../core/tempo';
import { conferirPersonagem, pedidoDoPersonagem, previaDoPersonagem, type PedidoDePersonagem } from '../coop/personagem';
import { ehObjeto } from '../core/validar';
import type { AcaoDoMundo } from '../mundo/acoes';
import { xpTotal, type Certificado } from '../integridade/certificado';
import type { FaixaDeNivel } from '../modos/modo';
import { comandoAceitoEmRede, equipeDeEntrada, localDeRespawn } from '../modos/regras';
import { povoarFase } from '../world/populacao';
import { entrarNaArena } from './entrada';
import { estadoPublico } from './estado-publico';
import { GeradorDePatches, novoCacheDeCampos } from './patches';
import { recortarPorInteresse } from './interesse';
import { construirFichaDeSessao, type PreviaDeFicha } from './ficha-sessao';
import { lerMensagemCliente, type MensagemCliente, type MensagemServidor, type MotivoErro, type MotivoRejeicao } from './protocolo';

export const COMANDOS_POR_SEGUNDO = 60;
export const BURST_COMANDOS = 20;
export const MAX_FILA_POR_SESSAO = 64;
/** Quanto à frente do servidor um comando pode ser agendado. */
export const MAX_ADIANTAMENTO_TICKS = 30;
export const EXPIRACAO_MOVIMENTO_MS = 500;
export const RESERVA_RECONEXAO_MS = 30_000;
/** Estado público (completo ou patch) a 20 Hz: a cada 3 ticks de 60 Hz (§3.6). */
export const TICKS_POR_ESTADO = 3;

export interface Sessao {
  sessaoId: string;
  jogadorId: string;
  entidadeId: string;
  enviar: (texto: string) => void;
  ultimoSeq: number;
  fichas: number;
  ultimaRecargaTick: number;
  direcao: Dir8 | 'parado';
  ultimoMoverTick: number;
  naFila: number;
  conectada: boolean;
  desconectadaEmTick: number;
  /** Próxima transmissão vai completa (entrada, reconexão, ressincronização). */
  precisaCompleto: boolean;
  bytesEnviados: number;
  rejeicoes: number;
  /** Marco 17: entrou com o personagem certificado (ficha inteira, bolsa e recompensas). */
  certificada: boolean;
  /** Marco 17: XP total e tick na entrada (teto de XP por hora) e se já passou do teto. */
  xpNaEntrada: number;
  entradaTick: number;
  semRecompensa: boolean;
}

interface ComandoAgendado {
  tickAplicacao: number;
  ordem: number;
  sessaoId: string;
  entidadeId: string;
  cmd: Comando;
}

export interface Conexao {
  receber: (texto: string) => void;
  /** Queda: o personagem para e a sessão fica reservada por 30 s (§2.13). */
  fechar: () => void;
  /** Reconexão dentro da reserva: volta a receber, começando por um estado completo. */
  retomar: () => void;
  /** Saída definitiva: a entidade sai do mundo agora. */
  encerrar: () => void;
}

export interface MetricasSala {
  jogadores: number;
  bytesEnviados: number;
  rejeicoes: number;
  /** Marco 16: entidades no mundo e comandos na agenda (para o `/metricas`). */
  entidades: number;
  fila: number;
}

/** Marco 17: a assinatura dos certificados (só o servidor tem a chave; os testes usam uma falsa). */
export interface CertificacaoDaSala {
  /** O certificado bruto, se a assinatura confere (senão, null). */
  conferir: (bruto: unknown) => Certificado | null;
  assinar: (retrato: PedidoDePersonagem, agora: number) => Certificado;
  /** Relógio de parede do servidor (o certificado guarda quando foi emitido). */
  agora: () => number;
}

export interface OpcoesSala {
  semente: number;
  versaoConteudo: string;
  /** Marco 17: faixa de nível da sala (null: aberta). */
  faixa?: FaixaDeNivel | null;
  certificacao?: CertificacaoDaSala | undefined;
}

/** O que o gancho de entrada devolve: a prévia da ficha, ou o motivo da recusa. */
export type EntradaDePersonagem = { ok: true; previa: PreviaDeFicha; certificada?: boolean } | { ok: false; motivo: MotivoErro };

export class SalaArena {
  /** Marco 15: a campanha cooperativa troca o mundo (e o contexto) a cada fase; a época sobe junto. */
  estado: EstadoJogo;
  epoca = 1;
  protected readonly sessoes = new Map<string, Sessao>();
  private agenda: ComandoAgendado[] = [];
  private ordemChegada = 0;
  private proximoJogador = 1;
  /** PRNG só para IDs de sessão: não consome a sequência da simulação. */
  private readonly rngSessoes: EstadoRng;
  protected readonly eventosDoTick: EventoSimulacao[] = [];
  private patches = new GeradorDePatches();
  /** Marco 29 (D-128): com área de interesse, um gerador por sessão (cada uma vê um recorte diferente). */
  private patchesPorSessao = new Map<string, GeradorDePatches>();
  /** Último canal privado mandado a cada sessão (texto), para só mandar quando muda. */
  private readonly privados = new Map<string, string>();
  private bytesTotais = 0;
  private rejeicoesTotais = 0;

  constructor(
    public ctx: ContextoSimulacao,
    private readonly opcoes: OpcoesSala,
    estadoInicial?: EstadoJogo,
  ) {
    this.rngSessoes = criarRng(opcoes.semente ^ 0x5e55a0);
    if (estadoInicial) {
      this.estado = estadoInicial;
    } else {
      this.estado = criarEstado({ semente: opcoes.semente, faseId: ctx.fase.id });
      povoarFase(this.estado, ctx);
    }
  }

  get jogadores(): number {
    return this.sessoes.size;
  }

  /**
   * Contadores acumulados da sala desde a criação. São monotônicos: quem sai não tira o que já
   * foi enviado (a soma por sessão ficava negativa quando um jogador saía).
   */
  metricas(): MetricasSala {
    return {
      jogadores: this.sessoes.size,
      bytesEnviados: this.bytesTotais,
      rejeicoes: this.rejeicoesTotais,
      entidades: this.estado.entidades.length,
      fila: this.agenda.length,
    };
  }

  /** Marco 29 (D-128): `identidade` é quem o servidor autenticou nesta conexão (o Mundo reserva a ficha por ela). */
  conectar(enviarBruto: (texto: string) => void, identidade: string | null = null): Conexao {
    let sessao: Sessao | null = null;
    const enviar = (texto: string) => {
      this.bytesTotais += texto.length;
      if (sessao) sessao.bytesEnviados += texto.length;
      enviarBruto(texto);
    };
    const responder = (msg: MensagemServidor) => {
      if (msg.t === 'rejeitado') {
        this.rejeicoesTotais++;
        if (sessao) sessao.rejeicoes++;
      }
      enviar(JSON.stringify(msg));
    };
    return {
      receber: (texto) => {
        const leitura = lerMensagemCliente(texto);
        if (!leitura.ok) {
          // Comando rejeitado conta como recebido, para o ack andar (D-034).
          if (sessao && leitura.seq !== null && leitura.seq > sessao.ultimoSeq) sessao.ultimoSeq = leitura.seq;
          responder({ t: 'rejeitado', seq: leitura.seq, motivo: leitura.motivo });
          return;
        }
        const nova = this.tratar(leitura.msg, sessao, enviar, responder, identidade);
        if (nova) sessao = nova;
      },
      fechar: () => {
        if (!sessao) return;
        sessao.conectada = false;
        sessao.desconectadaEmTick = this.estado.tick;
        // Personagem desconectado fica parado e vulnerável (§2.13).
        this.agendar(sessao, { t: 'mover', dir: 'parado' }, this.estado.tick);
        sessao.direcao = 'parado';
      },
      retomar: () => {
        if (!sessao || !this.sessoes.has(sessao.sessaoId)) return;
        sessao.conectada = true;
        sessao.desconectadaEmTick = 0;
        sessao.precisaCompleto = true;
      },
      encerrar: () => {
        if (!sessao) return;
        this.removerSessao(sessao);
        sessao = null;
      },
    };
  }

  private tratar(
    msg: MensagemCliente,
    sessao: Sessao | null,
    enviar: (texto: string) => void,
    responder: (m: MensagemServidor) => void,
    identidade: string | null,
  ): Sessao | null {
    switch (msg.t) {
      case 'ping':
        responder({ t: 'pong', id: msg.id, enviadoMs: msg.enviadoMs, tickServidor: this.estado.tick });
        return null;
      case 'entrar':
        return this.entrar(msg, sessao, enviar, responder, identidade);
      case 'ressincronizar':
        if (sessao) sessao.precisaCompleto = true;
        return null;
      case 'pedirCertificado':
        responder({ t: 'certificado', certificado: sessao ? this.certificadoDe(sessao) : null });
        return null;
      case 'viajar':
        if (sessao) this.aoViajar?.(sessao, msg.destino, msg.pagamento);
        return null;
      case 'acaoMundo':
        if (sessao) this.aoAcaoDoMundo?.(sessao, msg.acao);
        return null;
      case 'cmd': {
        const rejeitar = (motivo: MotivoRejeicao) => {
          responder({ t: 'rejeitado', seq: msg.pacote.seq, motivo });
        };
        if (!sessao) {
          rejeitar('nao_entrou');
          return null;
        }
        const p = msg.pacote;
        if (p.sessaoId !== sessao.sessaoId) {
          rejeitar('sessao');
          return null;
        }
        if (p.epocaSala !== this.epoca) {
          rejeitar('epoca');
          return null;
        }
        // seq repetido ou antigo: já aplicado (ou rejeitado); não reaplica (deduplicação, §3.6).
        if (p.seq <= sessao.ultimoSeq) return null;
        sessao.ultimoSeq = p.seq;
        // Marco 15: o modo diz o que a rede pode mandar (e a sala cooperativa, o que só o anfitrião pode).
        const motivo = this.motivoParaRecusar(sessao, p.cmd);
        if (motivo) {
          rejeitar(motivo);
          return null;
        }
        this.recarregarFichas(sessao);
        if (sessao.fichas < 1) {
          rejeitar('taxa');
          return null;
        }
        if (sessao.naFila >= MAX_FILA_POR_SESSAO) {
          rejeitar('fila');
          return null;
        }
        sessao.fichas -= 1;
        const tick = Math.min(this.estado.tick + MAX_ADIANTAMENTO_TICKS, Math.max(this.estado.tick, p.tickCliente));
        this.agendar(sessao, p.cmd, tick);
        return null;
      }
    }
  }

  private entrar(
    msg: Extract<MensagemCliente, { t: 'entrar' }>,
    sessao: Sessao | null,
    enviar: (texto: string) => void,
    responder: (m: MensagemServidor) => void,
    identidade: string | null,
  ): Sessao | null {
    if (sessao) {
      responder({ t: 'erro', motivo: 'ja_entrou' });
      return null;
    }
    if (msg.versaoConteudo !== this.opcoes.versaoConteudo) {
      responder({ t: 'erro', motivo: 'versao_conteudo' });
      return null;
    }
    if (this.sessoes.size >= this.ctx.modo.maxJogadores) {
      responder({ t: 'erro', motivo: 'sala_cheia' });
      return null;
    }
    const n = this.proximoJogador;
    const jogadorId = `jogador-${n}`;
    const entidadeId = `p${n}`;
    const entrada = this.criarPersonagem(msg, jogadorId, entidadeId, n, identidade);
    if (!entrada.ok) {
      responder({ t: 'erro', motivo: entrada.motivo });
      return null;
    }
    this.proximoJogador++;
    const { previa } = entrada;
    const entidadeNova = this.estado.entidades.find((e) => e.id === entidadeId);
    const nova: Sessao = {
      sessaoId: `s${proximoU32(this.rngSessoes).toString(36)}${proximoU32(this.rngSessoes).toString(36)}`,
      jogadorId,
      entidadeId,
      enviar,
      ultimoSeq: 0,
      fichas: BURST_COMANDOS,
      ultimaRecargaTick: this.estado.tick,
      direcao: 'parado',
      ultimoMoverTick: this.estado.tick,
      naFila: 0,
      conectada: true,
      desconectadaEmTick: 0,
      precisaCompleto: true,
      bytesEnviados: 0,
      rejeicoes: 0,
      certificada: entrada.certificada === true,
      xpNaEntrada: entidadeNova ? xpTotal(entidadeNova.nivel, entidadeNova.xp, this.ctx.balance.xp) : 0,
      entradaTick: this.estado.tick,
      semRecompensa: false,
    };
    this.sessoes.set(nova.sessaoId, nova);
    this.aoEntrar?.(nova);
    responder({
      t: 'bemVindo',
      sessaoId: nova.sessaoId,
      entidadeId,
      epocaSala: this.epoca,
      tick: this.estado.tick,
      faseId: this.ctx.fase.id,
      modoId: this.ctx.modo.id,
      previa,
      estado: this.visaoDe(nova, estadoPublico(this.estado)),
    });
    return nova;
  }

  /**
   * Gancho de entrada: cria a entidade do jogador no mundo. Marco 17: com um certificado válido, o personagem entra
   * inteiro (bolsa, nível, itens) e ganha recompensas; sem ele, a ficha de treino com o clamp do modo. Nos dois, o
   * nível precisa caber na faixa da sala.
   */
  // A identidade só importa ao Mundo (a ficha reservada pelo servidor); a arena ignora.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected criarPersonagem(msg: Extract<MensagemCliente, { t: 'entrar' }>, jogadorId: string, entidadeId: EntidadeId, n: number, _identidade: string | null = null): EntradaDePersonagem {
    const faixa = this.opcoes.faixa ?? null;
    const cabe = (nivel: number) => !faixa || (nivel >= faixa.min && nivel <= faixa.max);
    const pedido = ehObjeto(msg.pedidoFicha) ? msg.pedidoFicha : {};
    const certificado = this.opcoes.certificacao?.conferir(pedido.certificado) ?? null;
    const conferido = certificado ? conferirPersonagem(certificado.retrato, this.ctx, entidadeId, jogadorId) : null;
    if (conferido && conferido.alteracoes.length === 0) {
      const e = conferido.entidade;
      if (!cabe(e.nivel)) return { ok: false, motivo: 'fora_da_faixa' };
      e.controlador = 'remoto';
      e.equipe = equipeDeEntrada(this.ctx.modo, jogadorId, this.estado);
      e.xpBase = Math.round((this.ctx.modo.recompensaJogador?.xpPorNivel ?? 0) * e.nivel);
      const local = localDeRespawn(this.estado, this.ctx.fase, this.ctx.modo, e, this.estado.rng);
      posicionar(e, local.x, local.y);
      Object.assign(e, { origemX: local.x, origemY: local.y });
      this.estado.entidades.push(e);
      return { ok: true, previa: previaDoPersonagem(e, [], this.ctx.modo.id, this.ctx.balance.versao), certificada: true };
    }
    const previa = construirFichaDeSessao(msg.pedidoFicha, this.ctx.modo, this.ctx.conteudo, this.ctx.balance);
    if (!cabe(previa.ficha.nivel)) return { ok: false, motivo: 'fora_da_faixa' };
    entrarNaArena(this.estado, this.ctx, jogadorId, entidadeId, previa.ficha, msg.nome || `Jogador ${n}`);
    return { ok: true, previa };
  }

  /** Marco 17: o personagem da sessão, certificado agora (só para quem entrou com a ficha inteira). */
  private certificadoDe(s: Sessao): Certificado | null {
    const cert = this.opcoes.certificacao;
    const e = this.estado.entidades.find((x) => x.id === s.entidadeId);
    const retrato = e && s.certificada && cert ? pedidoDoPersonagem(e) : null;
    return retrato && cert ? cert.assinar(retrato, cert.agora()) : null;
  }

  /** Gancho: quem é o anfitrião (só a campanha em grupo tem). Vai no canal privado. */
  protected dadosDoAnfitriao?(s: Sessao): { anfitriao: boolean; anfitriaoId: string | null };

  /** O canal privado volta a ser mandado inteiro (fase nova, reconexão). */
  protected esquecerPrivado(s: Sessao): void {
    this.privados.delete(s.sessaoId);
  }

  /** Marco 15 (subiu para a base no 17): cada sessão com bolsa recebe só a própria, quando muda. */
  private mandarPrivados(): void {
    for (const s of this.sessoes.values()) {
      if (!s.conectada) {
        // Na volta, a sessão recebe tudo de novo.
        this.privados.delete(s.sessaoId);
        continue;
      }
      const bolsa = this.estado.entidades.find((e) => e.id === s.entidadeId)?.bolsa ?? null;
      if (!bolsa) continue;
      // 17/10/2026: na campanha, só as descobertas ou aliadas; o público continua sem armadilhas.
      const equipe = this.estado.entidades.find((e) => e.id === s.entidadeId)?.equipe;
      const armadilhas = this.ctx.modo.sobrevivencia.revelarArmadilhas
        ? this.estado.armadilhas.filter((a) => a.donoId === s.entidadeId || a.equipeDono === equipe || a.reveladaPara.includes(s.entidadeId)) : undefined;
      const texto = JSON.stringify({ t: 'privado', bolsa, ...(armadilhas && { armadilhas }), ...(this.dadosDoAnfitriao?.(s) ?? { anfitriao: false, anfitriaoId: null }) });
      if (this.privados.get(s.sessaoId) === texto) continue;
      this.privados.set(s.sessaoId, texto);
      s.enviar(texto);
    }
  }

  /**
   * Marco 17: o teto de XP por hora de quem entrou com a ficha inteira. Passou dele, a sessão sai da participação
   * de todo golpe (não ganha XP nem drop de abate) até sair da sala.
   */
  private aplicarTetoDeRecompensa(): void {
    const teto = this.ctx.modo.recompensaJogador?.tetoXpPorHora;
    if (!teto) return;
    for (const s of this.sessoes.values()) {
      if (!s.certificada) continue;
      if (!s.semRecompensa && this.estado.tick % ticksDe(1000) === 0) {
        const e = this.estado.entidades.find((x) => x.id === s.entidadeId);
        const horas = (this.estado.tick - s.entradaTick) / ticksDe(3_600_000);
        // Dez minutos de folga no começo, para a primeira luta não esbarrar no teto.
        if (e && xpTotal(e.nivel, e.xp, this.ctx.balance.xp) - s.xpNaEntrada > teto * (horas + 1 / 6)) s.semRecompensa = true;
      }
      if (!s.semRecompensa) continue;
      for (const e of this.estado.entidades) {
        if (e.participacao.some((p) => p.id === s.entidadeId)) e.participacao = e.participacao.filter((p) => p.id !== s.entidadeId);
      }
    }
  }

  /** Gancho: a sessão acabou de entrar (já está em `sessoes`). */
  protected aoEntrar?(s: Sessao): void;

  /** Marco 29 (D-128): o pedido de viagem pelo portal (só o Mundo trata). */
  protected aoViajar?(s: Sessao, destino: string, pagamento: 'ouro' | 'pergaminho'): void;

  /** Marco 30 (D-129): as ações do Mundo fora da simulação (banco, missões, chat, grupo, troca, mercado). */
  protected aoAcaoDoMundo?(s: Sessao, acao: AcaoDoMundo): void;

  /** Gancho: por que recusar o comando desta sessão (null = aceita). Na base, só o que o modo aceita pela rede. */
  protected motivoParaRecusar(s: Sessao, cmd: Comando): MotivoRejeicao | null {
    return comandoAceitoEmRede(this.ctx.modo, cmd) ? null : 'nao_permitido';
  }

  /** Gancho: depois de cada tick (a sala cooperativa manda o canal privado e confere a saída). */
  protected depoisDoTick?(): void;

  /** Gancho: a sessão saiu de vez (a entidade já saiu do mundo). */
  protected aoRemoverSessao?(s: Sessao): void;

  protected removerSessao(s: Sessao): void {
    this.patchesPorSessao.delete(s.sessaoId);
    this.sessoes.delete(s.sessaoId);
    this.privados.delete(s.sessaoId);
    this.estado.entidades = this.estado.entidades.filter((e) => e.id !== s.entidadeId);
    this.aoRemoverSessao?.(s);
  }

  protected estadoPublicoAtual(): EstadoJogo {
    return estadoPublico(this.estado);
  }

  protected enviarPara(s: Sessao, msg: MensagemServidor): void {
    if (s.conectada) s.enviar(JSON.stringify(msg));
  }

  /**
   * Marco 15: troca o mundo inteiro (fase nova da campanha cooperativa). A época sobe — comandos em trânsito da fase
   * anterior são recusados — e a agenda esvazia. O gerador de patches parte do estado novo, que quem chama manda
   * completo (`novaFase`).
   */
  protected trocarMundo(ctx: ContextoSimulacao, estado: EstadoJogo): EstadoJogo {
    // O mundo novo tem o próprio relógio: os ticks guardados nas sessões andam junto (reserva, taxa, movimento).
    const delta = estado.tick - this.estado.tick;
    this.ctx = ctx;
    this.estado = estado;
    this.epoca++;
    this.agenda = [];
    for (const s of this.sessoes.values()) {
      s.desconectadaEmTick += delta;
      s.ultimaRecargaTick += delta;
      s.ultimoMoverTick += delta;
      s.naFila = 0;
      s.direcao = 'parado';
      s.precisaCompleto = false;
    }
    this.patches = new GeradorDePatches();
    this.patchesPorSessao.clear();
    const publico = estadoPublico(estado);
    this.patches.gerar(publico);
    return publico;
  }

  /** Balde de fichas: 60 por segundo de simulação, até o burst (§3.6). */
  private recarregarFichas(s: Sessao): void {
    const decorrido = this.estado.tick - s.ultimaRecargaTick;
    s.fichas = Math.min(BURST_COMANDOS, s.fichas + (decorrido * COMANDOS_POR_SEGUNDO) / ticksDe(1000));
    s.ultimaRecargaTick = this.estado.tick;
  }

  private agendar(s: Sessao, cmd: Comando, tickAplicacao: number): void {
    this.agenda.push({ tickAplicacao, ordem: this.ordemChegada++, sessaoId: s.sessaoId, entidadeId: s.entidadeId, cmd });
    s.naFila++;
    if (cmd.t === 'mover') {
      s.direcao = cmd.dir;
      s.ultimoMoverTick = tickAplicacao;
    }
  }

  /** Um tick de 60 Hz: comandos vencidos -> simulação -> eventos; estado público a 20 Hz. */
  tick(dtMs: number): void {
    this.expirarMovimentoMantido();
    this.removerDesconectados();

    const vencidos = this.agenda.filter((c) => c.tickAplicacao <= this.estado.tick);
    this.agenda = this.agenda.filter((c) => c.tickAplicacao > this.estado.tick);
    vencidos.sort((a, b) => a.tickAplicacao - b.tickAplicacao || a.ordem - b.ordem);
    const comandos: ComandoDoTick[] = [];
    for (const c of vencidos) {
      const s = this.sessoes.get(c.sessaoId);
      if (s) s.naFila--;
      comandos.push({ tick: this.estado.tick, entidadeId: c.entidadeId, cmd: c.cmd });
    }

    this.eventosDoTick.length = 0;
    this.aplicarTetoDeRecompensa();
    simular(this.estado, this.ctx, comandos, this.eventosDoTick, dtMs);
    if (this.eventosDoTick.length > 0) {
      this.transmitir({ t: 'eventos', tick: this.estado.tick, eventos: this.eventosDoTick });
    }
    if (this.estado.tick % TICKS_POR_ESTADO === 0) this.transmitirEstado();
    this.depoisDoTick?.();
    if (this.estado.tick % TICKS_POR_ESTADO === 0) this.mandarPrivados();
  }

  /**
   * Estado a 20 Hz (§3.6): completo para quem acabou de entrar, reconectou ou pediu; patch para os
   * demais. O patch é o mesmo para todos (parte da transmissão anterior); só o ack muda por sessão.
   */
  private transmitirEstado(): void {
    const publico = estadoPublico(this.estado);
    if (this.ctx.modo.areaDeInteresse) {
      this.transmitirPorInteresse(publico);
      return;
    }
    const patch = this.patches.gerar(publico);
    const tick = this.estado.tick;
    // Serializa o corpo uma vez só; por sessão muda apenas o ack (o maior custo do tick era repetir o JSON).
    let textoPatch: string | null = null;
    let textoEstado: string | null = null;
    for (const s of this.sessoes.values()) {
      if (!s.conectada) continue;
      const cabecalho = `"tick":${tick},"epocaSala":${this.epoca},"ackSeq":${s.ultimoSeq}`;
      if (s.precisaCompleto) {
        textoEstado ??= JSON.stringify(publico);
        s.enviar(`{"t":"estado",${cabecalho},"estado":${textoEstado}}`);
      } else {
        textoPatch ??= JSON.stringify(patch);
        s.enviar(`{"t":"patch",${cabecalho},"patch":${textoPatch}}`);
      }
      s.precisaCompleto = false;
    }
  }

  /** Marco 29 (30/10/2026, D-128): o que a sessão vê do estado público (tudo, sem área de interesse no modo). */
  protected visaoDe(s: Sessao, publico: EstadoJogo): EstadoJogo {
    const area = this.ctx.modo.areaDeInteresse;
    return area ? recortarPorInteresse(publico, s.entidadeId, area.raio) : publico;
  }

  /** Marco 29 (D-128): um recorte e um patch por sessão; o completo reinicia o gerador daquela sessão. */
  private transmitirPorInteresse(publico: EstadoJogo): void {
    const tick = this.estado.tick;
    const cache = novoCacheDeCampos();
    for (const s of this.sessoes.values()) {
      if (!s.conectada) continue;
      const visao = this.visaoDe(s, publico);
      const cabecalho = `"tick":${tick},"epocaSala":${this.epoca},"ackSeq":${s.ultimoSeq}`;
      let gerador = this.patchesPorSessao.get(s.sessaoId);
      if (s.precisaCompleto || !gerador) {
        gerador = new GeradorDePatches();
        gerador.gerar(visao, cache);
        this.patchesPorSessao.set(s.sessaoId, gerador);
        s.enviar(`{"t":"estado",${cabecalho},"estado":${JSON.stringify(visao)}}`);
      } else {
        s.enviar(`{"t":"patch",${cabecalho},"patch":${JSON.stringify(gerador.gerar(visao, cache))}}`);
      }
      s.precisaCompleto = false;
    }
  }

  /** Entrada mantida sem renovação expira (§2.13): o servidor manda parar. */
  private expirarMovimentoMantido(): void {
    const limite = ticksDe(EXPIRACAO_MOVIMENTO_MS);
    for (const s of this.sessoes.values()) {
      if (s.direcao !== 'parado' && this.estado.tick - s.ultimoMoverTick > limite) {
        this.agendar(s, { t: 'mover', dir: 'parado' }, this.estado.tick);
      }
    }
  }

  /** A reserva de reconexão dura 30 s (§2.13); depois a entidade sai do mundo. */
  private removerDesconectados(): void {
    const limite = ticksDe(RESERVA_RECONEXAO_MS);
    for (const s of [...this.sessoes.values()]) {
      if (s.conectada || this.estado.tick - s.desconectadaEmTick < limite) continue;
      this.removerSessao(s);
    }
  }

  private transmitir(msg: MensagemServidor): void {
    const texto = JSON.stringify(msg);
    for (const s of this.sessoes.values()) if (s.conectada) s.enviar(texto);
  }
}
