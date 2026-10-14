// Motor de áudio (§2.14, §4.11). Marco 12 (14/10/2026), D-056. O único lugar que toca Web Audio.
// - O contexto só nasce no primeiro gesto (click, touchstart, keydown), com fade de 400 ms.
// - Ganhos: mestre → música (0,45) e efeitos (0,75), ajustáveis nas Configurações, com mudo.
// - Música: sequenciador com olhar à frente (agenda 120 ms adiante a cada 25 ms); trocar de clima é um
//   fade de 800 ms entre dois sequenciadores. Pausar suspende o contexto e retoma do ponto.
// - Pausa sozinho quando a aba some (visibilitychange) e retoma ao voltar, se o jogo não estiver pausado.
// - Qualquer falha deixa o jogo mudo e seguindo: nunca derruba a partida.

import { compor, frequencia, PASSOS_POR_LACO, type Composicao } from './composicao';
import type { Clima } from './contexto-musical';
import { LimitadorDeSom, variacaoDeTom } from './limitador';
import type { SomId } from './mapeamento';
import { criarAmbiente, DURACAO_MS, tocarBumbo, tocarCaixa, tocarChimbal, tocarEfeito, tocarNota, type SomAmbiente } from './sintetizador';

const OLHAR_A_FRENTE_S = 0.12;
const INTERVALO_AGENDA_MS = 25;
const FADE_CLIMA_S = 0.8;
const FADE_INICIO_S = 0.4;

export interface VolumesAudio {
  musica: number;
  efeitos: number;
  mudo: boolean;
}

interface Sequenciador {
  ganho: GainNode;
  timer: ReturnType<typeof setInterval>;
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
  private efeitos: GainNode | null = null;
  private atual: { chave: string; seq: Sequenciador } | null = null;
  private pedidoMusica: { faseId: string; clima: Clima } | null = null;
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
      this.aplicarVolumes();
      void ctx.resume().catch(() => undefined);
      document.body.dataset.audio = 'ativo';
      if (this.pedidoMusica) this.definirMusica(this.pedidoMusica.faseId, this.pedidoMusica.clima);
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

  /** Música da fase no clima pedido; a troca de clima é um fade de 800 ms. */
  definirMusica(faseId: string, clima: Clima): void {
    this.pedidoMusica = { faseId, clima };
    const ctx = this.ctx;
    if (!ctx || !this.musica) return;
    const chave = `${faseId}:${clima}`;
    if (this.atual?.chave === chave) return;
    const anterior = this.atual;
    const seq = this.criarSequenciador(ctx, this.musica, compor(faseId, clima));
    seq.ganho.gain.setValueAtTime(0.0001, ctx.currentTime);
    seq.ganho.gain.exponentialRampToValueAtTime(1, ctx.currentTime + FADE_CLIMA_S);
    this.atual = { chave, seq };
    if (anterior) {
      anterior.seq.ganho.gain.setTargetAtTime(0.0001, ctx.currentTime, FADE_CLIMA_S / 4);
      setTimeout(() => {
        clearInterval(anterior.seq.timer);
        anterior.seq.ganho.disconnect();
      }, FADE_CLIMA_S * 1000 + 100);
    }
  }

  private criarSequenciador(ctx: AudioContext, destino: AudioNode, composicao: Composicao): Sequenciador {
    const ganho = ctx.createGain();
    ganho.connect(destino);
    const seq = { passo: 0, proximoS: ctx.currentTime + 0.05 };
    const duracaoPassoS = 60 / composicao.bpm / 4;
    const timer = setInterval(() => {
      if (ctx.state !== 'running') return;
      while (seq.proximoS < ctx.currentTime + OLHAR_A_FRENTE_S) {
        const p = composicao.passos[seq.passo];
        const t = Math.max(seq.proximoS, ctx.currentTime);
        if (p) {
          if (p.melodia !== null) tocarNota(ctx, ganho, t, frequencia(p.melodia), duracaoPassoS * 1.8, 'triangle', 0.12);
          if (p.baixo !== null) tocarNota(ctx, ganho, t, frequencia(p.baixo), duracaoPassoS * 3, 'sine', 0.22);
          if (p.bumbo) tocarBumbo(ctx, ganho, t);
          if (p.caixa) tocarCaixa(ctx, ganho, t);
          if (p.chimbal) tocarChimbal(ctx, ganho, t);
        }
        seq.passo = (seq.passo + 1) % PASSOS_POR_LACO;
        seq.proximoS += duracaoPassoS;
      }
    }, INTERVALO_AGENDA_MS);
    return { ganho, timer };
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
