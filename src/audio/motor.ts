// Motor de áudio (§2.14, §4.11). Marco 12 (14/10/2026), D-056. O único lugar que toca Web Audio.
// - O contexto só nasce no primeiro gesto (click, touchstart, keydown), com fade de 400 ms.
// - Ganhos: mestre -> música (0,45) e efeitos (0,75), ajustáveis nas Configurações, com mudo.
// - Música: sequenciador com olhar à frente (agenda 120 ms adiante a cada 25 ms); trocar de clima é um
//   fade de 800 ms entre dois sequenciadores. Pausar suspende o contexto e retoma do ponto.
// - Pausa sozinho quando a aba some (visibilitychange) e retoma ao voltar, se o jogo não estiver pausado.
// - Qualquer falha deixa o jogo mudo e seguindo: nunca derruba a partida.
// Marco 11A (16/10/2026, D-066): a música tem uma "sombra" (0 casual … 1 dark). A faixa (5 degraus) escolhe a
// composição; dentro da faixa, a sombra mexe ao vivo no passa-baixa e na ambiência (eco), sem recompor. Trocar de
// laço espera o fim do compasso e cruza em 1,5 s. Pad, arpejo e melodia filtrada pelos timbres da faixa.

import { compor, faixaDaSombra, frequencia, PASSOS_POR_COMPASSO, PASSOS_POR_LACO, type Composicao } from './composicao';
import type { Clima } from './contexto-musical';
import { LimitadorDeSom, variacaoDeTom } from './limitador';
import type { SomId } from './mapeamento';
import { criarAmbiente, DURACAO_MS, tocarBumbo, tocarCaixa, tocarChimbal, tocarEfeito, tocarNota, tocarNotaFiltrada, tocarPad, type SomAmbiente } from './sintetizador';

const OLHAR_A_FRENTE_S = 0.12;
const INTERVALO_AGENDA_MS = 25;
const FADE_CLIMA_S = 1.5;
const FADE_INICIO_S = 0.4;
/** Eco da ambiência: atraso e realimentação. */
const ECO_S = 0.32;
const ECO_REALIMENTACAO = 0.32;

export interface VolumesAudio {
  musica: number;
  efeitos: number;
  mudo: boolean;
}

interface Sequenciador {
  ganho: GainNode;
  timer: ReturnType<typeof setInterval>;
  /** Para a troca no fim do compasso: em que passo está e quando cai o próximo. */
  estado: { passo: number; proximoS: number };
  duracaoPassoS: number;
}

interface Fonte {
  ganho: GainNode;
  painel: StereoPannerNode;
  parar: () => void;
}

export class MotorAudio {
  private ctx: AudioContext | null = null;
  private mestre: GainNode | null = null;
  private musica: GainNode | null = null;
  /** Marco 11A: entrada da música (antes do filtro), o passa-baixa da sombra e o ganho da ambiência. */
  private entradaMusica: GainNode | null = null;
  private filtroMusica: BiquadFilterNode | null = null;
  private ambiencia: GainNode | null = null;
  private efeitos: GainNode | null = null;
  private atual: { chave: string; seq: Sequenciador } | null = null;
  private pedidoMusica: { faseId: string; clima: Clima; sombra: number; variante: number } | null = null;
  private readonly limitador = new LimitadorDeSom();
  private readonly fontes = new Map<string, Fonte>();
  private pausadoPeloJogo = false;
  private desligado = false;
  private readonly aoGesto = () => {
    this.iniciar();
  };
  private readonly aoVisibilidade = () => {
    if (!this.ctx) return;
    if (document.visibilityState === 'hidden') void this.ctx.suspend().catch(() => undefined);
    else if (!this.pausadoPeloJogo) void this.ctx.resume().catch(() => undefined);
  };

  constructor(private volumes: VolumesAudio) {
    for (const ev of ['click', 'touchstart', 'keydown'] as const) addEventListener(ev, this.aoGesto, { passive: true });
    document.addEventListener('visibilitychange', this.aoVisibilidade);
  }

  ativo(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  private iniciar(): void {
    if (this.ctx || this.desligado) return;
    try {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.mestre = ctx.createGain();
      this.mestre.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.mestre.gain.exponentialRampToValueAtTime(1, ctx.currentTime + FADE_INICIO_S);
      this.mestre.connect(ctx.destination);
      this.musica = ctx.createGain();
      this.efeitos = ctx.createGain();
      this.musica.connect(this.mestre);
      this.efeitos.connect(this.mestre);
      // Música: entrada -> passa-baixa -> música; e um envio de eco (ambiência) que volta antes do filtro.
      this.entradaMusica = ctx.createGain();
      this.filtroMusica = ctx.createBiquadFilter();
      this.filtroMusica.type = 'lowpass';
      this.filtroMusica.frequency.value = 6000;
      this.entradaMusica.connect(this.filtroMusica);
      this.filtroMusica.connect(this.musica);
      const eco = ctx.createDelay(1);
      eco.delayTime.value = ECO_S;
      const realimentacao = ctx.createGain();
      realimentacao.gain.value = ECO_REALIMENTACAO;
      this.ambiencia = ctx.createGain();
      this.ambiencia.gain.value = 0.15;
      this.entradaMusica.connect(eco);
      eco.connect(realimentacao);
      realimentacao.connect(eco);
      eco.connect(this.ambiencia);
      this.ambiencia.connect(this.filtroMusica);
      this.aplicarVolumes();
      void ctx.resume().catch(() => undefined);
      document.body.dataset.audio = 'ativo';
      if (this.pedidoMusica) this.definirMusica(this.pedidoMusica.faseId, this.pedidoMusica.clima, this.pedidoMusica.sombra, this.pedidoMusica.variante);
      if (this.pausadoPeloJogo) void ctx.suspend().catch(() => undefined);
    } catch {
      // Sem Web Audio: o jogo segue mudo.
      this.desligado = true;
      document.body.dataset.audio = 'indisponivel';
    }
    for (const ev of ['click', 'touchstart', 'keydown'] as const) removeEventListener(ev, this.aoGesto);
  }

  definirVolumes(v: VolumesAudio): void {
    this.volumes = v;
    this.aplicarVolumes();
  }

  private aplicarVolumes(): void {
    if (!this.ctx || !this.musica || !this.efeitos) return;
    const t = this.ctx.currentTime;
    this.musica.gain.setTargetAtTime(this.volumes.mudo ? 0 : this.volumes.musica, t, 0.05);
    this.efeitos.gain.setTargetAtTime(this.volumes.mudo ? 0 : this.volumes.efeitos, t, 0.05);
  }

  /** Efeito sonoro; `volume` já inclui a distância (0 = não toca), `pan` de -1 a 1. */
  tocar(som: SomId, volume = 1, pan = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.efeitos || volume <= 0 || ctx.state !== 'running') return;
    const agora = performance.now();
    if (!this.limitador.permitir(som, agora, DURACAO_MS[som])) return;
    try {
      const ganho = ctx.createGain();
      ganho.gain.value = volume;
      const painel = ctx.createStereoPanner();
      painel.pan.value = pan;
      ganho.connect(painel);
      painel.connect(this.efeitos);
      tocarEfeito(ctx, ganho, som, variacaoDeTom(Math.random()));
      setTimeout(() => {
        painel.disconnect();
      }, DURACAO_MS[som] + 200);
    } catch {
      // Um som que falha não interrompe nada.
    }
  }

  /** Passo de uma entidade (limitado por entidade e no total, §2.14). */
  passo(entidadeId: string, volume: number, pan: number): void {
    if (volume <= 0 || !this.limitador.permitirPasso(entidadeId, performance.now())) return;
    this.tocar('passo', volume, pan);
  }

  /**
   * Música da fase no clima e na sombra pedidos (marco 11A). A sombra mexe ao vivo no filtro e no eco; quando muda a
   * faixa (ou o clima), o laço novo entra no fim do compasso do atual, cruzando em 1,5 s.
   */
  definirMusica(faseId: string, clima: Clima, sombra = 0.5, variante = 0): void {
    this.pedidoMusica = { faseId, clima, sombra, variante };
    const ctx = this.ctx;
    if (!ctx || !this.entradaMusica) return;
    const s = Math.max(0, Math.min(1, sombra));
    this.filtroMusica?.frequency.setTargetAtTime(7000 - 5200 * s, ctx.currentTime, 0.8);
    this.ambiencia?.gain.setTargetAtTime(0.1 + 0.3 * s, ctx.currentTime, 0.8);
    const faixa = faixaDaSombra(s);
    // Marco 24 (D-099): a variante troca a música de tempos em tempos (o mesmo cruzamento da troca de clima).
    const chave = `${faseId}:${clima}:${faixa}:${variante}`;
    if (this.atual?.chave === chave) return;
    const anterior = this.atual;
    // O começo do próximo compasso do laço atual (ou já, se não há música).
    let inicio = ctx.currentTime + 0.05;
    if (anterior) {
      const { estado, duracaoPassoS } = anterior.seq;
      const faltam = (PASSOS_POR_COMPASSO - (estado.passo % PASSOS_POR_COMPASSO)) % PASSOS_POR_COMPASSO;
      inicio = Math.max(inicio, estado.proximoS + faltam * duracaoPassoS);
    }
    const seq = this.criarSequenciador(ctx, this.entradaMusica, compor(faseId, clima, faixa, variante), inicio);
    seq.ganho.gain.setValueAtTime(0.0001, inicio);
    seq.ganho.gain.exponentialRampToValueAtTime(1, inicio + FADE_CLIMA_S);
    this.atual = { chave, seq };
    if (anterior) {
      anterior.seq.ganho.gain.setTargetAtTime(0.0001, inicio, FADE_CLIMA_S / 4);
      setTimeout(
        () => {
          clearInterval(anterior.seq.timer);
          anterior.seq.ganho.disconnect();
        },
        (inicio - ctx.currentTime + FADE_CLIMA_S) * 1000 + 200,
      );
    }
  }

  private criarSequenciador(ctx: AudioContext, destino: AudioNode, composicao: Composicao, inicio: number): Sequenciador {
    const ganho = ctx.createGain();
    ganho.connect(destino);
    const estado = { passo: 0, proximoS: inicio };
    const duracaoPassoS = 60 / composicao.bpm / 4;
    const tim = composicao.timbres;
    const timer = setInterval(() => {
      if (ctx.state !== 'running') return;
      while (estado.proximoS < ctx.currentTime + OLHAR_A_FRENTE_S) {
        const p = composicao.passos[estado.passo];
        const t = Math.max(estado.proximoS, ctx.currentTime);
        if (p) {
          if (p.melodia !== null) tocarNotaFiltrada(ctx, ganho, t, frequencia(p.melodia), duracaoPassoS * tim.sustentacao, tim.melodia, 0.1, tim.corte);
          if (p.baixo !== null) tocarNota(ctx, ganho, t, frequencia(p.baixo), duracaoPassoS * (tim.drone ? PASSOS_POR_COMPASSO : 3), 'sine', 0.2);
          if (p.pad) tocarPad(ctx, ganho, t, p.pad.map(frequencia), duracaoPassoS * PASSOS_POR_COMPASSO, tim.pad, tim.volumePad);
          if (p.arpejo !== null) tocarNotaFiltrada(ctx, ganho, t, frequencia(p.arpejo), duracaoPassoS * 1.5, 'triangle', 0.05, 3000);
          if (p.bumbo) tocarBumbo(ctx, ganho, t);
          if (p.caixa) tocarCaixa(ctx, ganho, t);
          if (p.chimbal) tocarChimbal(ctx, ganho, t);
        }
        estado.passo = (estado.passo + 1) % PASSOS_POR_LACO;
        estado.proximoS += duracaoPassoS;
      }
    }, INTERVALO_AGENDA_MS);
    return { ganho, timer, estado, duracaoPassoS };
  }

  /** Fontes sonoras da fase (§2.14): cria uma vez; o volume e o pan vêm de `atualizarFonte`. */
  definirFonte(id: string, tipo: SomAmbiente): void {
    const ctx = this.ctx;
    if (!ctx || !this.efeitos || this.fontes.has(id)) return;
    const painel = ctx.createStereoPanner();
    painel.connect(this.efeitos);
    const { ganho, parar } = criarAmbiente(ctx, painel, tipo);
    this.fontes.set(id, { ganho, painel, parar });
  }

  atualizarFonte(id: string, volume: number, pan: number): void {
    const f = this.fontes.get(id);
    if (!f || !this.ctx) return;
    f.ganho.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.2);
    f.painel.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.2);
  }

  /** Pausa do jogo (§2.14: os laços pausam com o jogo). */
  pausar(pausado: boolean): void {
    this.pausadoPeloJogo = pausado;
    if (!this.ctx) return;
    void (pausado ? this.ctx.suspend() : this.ctx.resume()).catch(() => undefined);
  }

  destruir(): void {
    for (const ev of ['click', 'touchstart', 'keydown'] as const) removeEventListener(ev, this.aoGesto);
    document.removeEventListener('visibilitychange', this.aoVisibilidade);
    if (this.atual) clearInterval(this.atual.seq.timer);
    for (const f of this.fontes.values()) f.parar();
    this.fontes.clear();
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }
}
