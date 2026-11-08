// Reprodução de gravações licenciadas, locais: sem síntese ou sequenciador procedural.
// O AudioContext só nasce no primeiro gesto. Suspender preserva a posição de músicas e ambientes.
import type { Clima } from './contexto-musical';
import { LimitadorDeSom, variacaoDeTom } from './limitador';
import type { SomId } from './mapeamento';
import { AMBIENTES, BancoDeGravacoes, EFEITOS, musicaDaCena, type SomAmbiente } from './gravacoes';

const FADE_MUSICA_S = 1.5;
const GANHOS: Partial<Record<SomId, number>> = { passo: 0.25, clique: 0.35, critico: 0.65, conjuracao: 0.18, lancamento_magico: 0.25, magia: 0.4, zunido: 0.45, invocacao: 0.6, moeda: 0.6, recusa: 0.4, necro_conjura: 0.55, necro_sombra: 0.7, necro_ossos: 0.75, golpe_baque: 0.9, golpe_flecha: 0.85, golpe_mordida: 0.8, golpe_garra: 0.7, golpe_gosma: 0.75 };

export interface VolumesAudio {
  musica: number;
  efeitos: number;
  mudo: boolean;
}
interface Voz {
  fonte: AudioBufferSourceNode;
  ganho: GainNode;
  painel: StereoPannerNode | null;
}

export class MotorAudio {
  private ctx: AudioContext | null = null;
  private banco: BancoDeGravacoes | null = null;
  private musica: GainNode | null = null;
  private efeitos: GainNode | null = null;
  private atual: (Voz & { chave: string }) | null = null;
  private chavePedida: string | null = null;
  private pedidoMusica: { faseId: string; clima: Clima; sombra: number; variante: number } | null = null;
  private readonly limitador = new LimitadorDeSom();
  private readonly fontes = new Map<string, Voz>();
  private readonly vozes = new Set<Voz>();
  private pausadoPeloJogo = false;
  private desligado = false;
  private readonly aoGesto = () => { this.iniciar(); };
  private readonly aoVisibilidade = () => { this.sincronizarPausa(); };

  constructor(private volumes: VolumesAudio) {
    for (const ev of ['click', 'touchstart', 'keydown'] as const) addEventListener(ev, this.aoGesto, { passive: true });
    document.addEventListener('visibilitychange', this.aoVisibilidade);
  }

  ativo(): boolean { return this.ctx?.state === 'running'; }

  private iniciar(): void {
    if (this.desligado) return;
    if (this.ctx) { this.sincronizarPausa(); return; }
    try {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.banco = new BancoDeGravacoes(ctx);
      const mestre = ctx.createGain();
      mestre.gain.setValueAtTime(0.0001, ctx.currentTime);
      mestre.gain.exponentialRampToValueAtTime(0.85, ctx.currentTime + 0.4);
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -10;
      compressor.knee.value = 12;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.2;
      mestre.connect(compressor); compressor.connect(ctx.destination);
      this.musica = ctx.createGain(); this.efeitos = ctx.createGain();
      this.musica.connect(mestre); this.efeitos.connect(mestre);
      this.aplicarVolumes();
      this.sincronizarPausa();
      document.body.dataset.audio = 'ativo';
      void this.banco.prepararEfeitos();
      if (this.pedidoMusica) {
        const p = this.pedidoMusica;
        this.definirMusica(p.faseId, p.clima, p.sombra, p.variante);
      }
    } catch {
      this.desligado = true;
      document.body.dataset.audio = 'indisponivel';
    }
  }

  definirVolumes(v: VolumesAudio): void { this.volumes = v; this.aplicarVolumes(); }

  private aplicarVolumes(): void {
    if (!this.ctx) return;
    const nivel = (v: number) => this.volumes.mudo ? 0 : Math.max(0, Math.min(1, v));
    this.musica?.gain.setTargetAtTime(nivel(this.volumes.musica), this.ctx.currentTime, 0.05);
    this.efeitos?.gain.setTargetAtTime(nivel(this.volumes.efeitos), this.ctx.currentTime, 0.05);
  }

  /** Uma voz é desconectada no relógio do áudio, inclusive durante pausa e crossfade. */
  private criarVoz(buffer: AudioBuffer, destino: AudioNode, volume: number, pan: number | null): Voz {
    const ctx = this.ctx;
    if (!ctx) throw new Error('Áudio encerrado');
    const fonte = ctx.createBufferSource(); fonte.buffer = buffer;
    const ganho = ctx.createGain(); ganho.gain.value = volume;
    const painel = pan === null ? null : ctx.createStereoPanner();
    fonte.connect(ganho);
    if (painel) { painel.pan.value = Math.max(-1, Math.min(1, pan ?? 0)); ganho.connect(painel); painel.connect(destino); }
    else ganho.connect(destino);
    const voz = { fonte, ganho, painel };
    this.vozes.add(voz);
    fonte.onended = () => {
      fonte.disconnect(); ganho.disconnect(); painel?.disconnect(); this.vozes.delete(voz);
    };
    return voz;
  }

  tocar(som: SomId, volume = 1, pan = 0): void {
    const ctx = this.ctx, banco = this.banco;
    if (!ctx || !banco || !this.efeitos || volume <= 0 || this.volumes.mudo || ctx.state !== 'running' || this.vozes.size >= 40) return;
    const lista = EFEITOS[som];
    const id = lista[Math.floor(Math.random() * lista.length)];
    if (!id) return;
    const buffer = banco.pronto(id);
    // Nunca reproduz uma ação velha quando um download termina atrasado.
    if (!buffer) { void banco.carregar(id).catch(() => undefined); return; }
    const tom = variacaoDeTom(Math.random());
    const maxDuracao = som === 'conjuracao' ? 0.22 : som === 'lancamento_magico' ? 0.18 : som === 'magia' ? 0.5 : Infinity;
    const duracao = Math.min(buffer.duration / tom, maxDuracao);
    const generico = Number.isFinite(maxDuracao);
    // 06/11/2026: a risada da invocação toca uma por vez (vários servos surgem juntos e não se empilham).
    const unica = som === 'invocacao';
    const vozesMax = generico || unica ? 1 : 4;
    const intervalo = som === 'conjuracao' ? 500 : unica ? 1500 : generico ? 180 : 80;
    if (!this.limitador.permitir(som, ctx.currentTime * 1000, duracao * 1000, vozesMax, intervalo)) return;
    try {
      const voz = this.criarVoz(buffer, this.efeitos, Math.min(1, volume) * (GANHOS[som] ?? 0.8), pan);
      voz.fonte.playbackRate.value = tom;
      const inicio = ctx.currentTime;
      if (generico) {
        const pico = Math.min(1, volume) * (GANHOS[som] ?? 0.8);
        voz.ganho.gain.setValueAtTime(0, inicio);
        voz.ganho.gain.linearRampToValueAtTime(pico, inicio + Math.min(0.004, duracao / 4));
        voz.ganho.gain.setValueAtTime(pico, inicio + duracao - Math.min(0.04, duracao / 4));
        voz.ganho.gain.linearRampToValueAtTime(0, inicio + duracao);
      }
      voz.fonte.start(inicio);
      if (generico) voz.fonte.stop(inicio + duracao);
    } catch { /* Um efeito não interrompe a partida. */ }
  }

  passo(entidadeId: string, volume: number, pan: number): void {
    if (volume > 0 && this.limitador.permitirPasso(entidadeId, performance.now())) this.tocar('passo', volume, pan);
  }

  definirMusica(faseId: string, clima: Clima, sombra = 0.5, variante = 0): void {
    this.pedidoMusica = { faseId, clima, sombra, variante };
    if (!this.ctx || !this.banco || !this.musica) return;
    const chave = musicaDaCena(faseId, clima, sombra, variante);
    if (this.chavePedida === chave) return;
    this.chavePedida = chave;
    void this.trocarMusica(chave);
  }

  private async trocarMusica(chave: string): Promise<void> {
    const ctx = this.ctx, banco = this.banco;
    if (!ctx || !banco) return;
    try {
      const buffer = await banco.carregar(chave);
      if (this.ctx !== ctx || this.chavePedida !== chave || !this.musica) return;
      // Se o pedido voltou à música atual durante o download, deixa a reprodução continuar.
      if (this.atual?.chave === chave) return;
      const anterior = this.atual;
      const voz = this.criarVoz(buffer, this.musica, 0, null);
      const agora = ctx.currentTime;
      voz.fonte.loop = true;
      voz.ganho.gain.setValueAtTime(0, agora);
      voz.ganho.gain.linearRampToValueAtTime(1, agora + FADE_MUSICA_S);
      voz.fonte.start(agora);
      this.atual = { ...voz, chave };
      if (anterior) {
        anterior.ganho.gain.cancelAndHoldAtTime(agora);
        anterior.ganho.gain.linearRampToValueAtTime(0, agora + FADE_MUSICA_S);
        anterior.fonte.stop(agora + FADE_MUSICA_S);
      }
    } catch { /* Mantém a música anterior se a nova gravação falhar. */ }
  }

  definirFonte(id: string, tipo: SomAmbiente): void {
    const ctx = this.ctx, banco = this.banco;
    if (!ctx || !banco || !this.efeitos || this.fontes.has(id)) return;
    // Reserva imediatamente; o loop começa só depois da decodificação.
    const voz = this.criarVoz(ctx.createBuffer(1, 1, ctx.sampleRate), this.efeitos, 0, 0);
    this.fontes.set(id, voz);
    void banco.carregar(AMBIENTES[tipo]).then((buffer) => {
      if (this.ctx !== ctx || this.fontes.get(id) !== voz) return;
      voz.fonte.buffer = buffer; voz.fonte.loop = true; voz.fonte.start();
    }).catch(() => {
      this.fontes.delete(id); this.vozes.delete(voz);
      voz.fonte.disconnect(); voz.ganho.disconnect(); voz.painel?.disconnect();
    });
  }

  atualizarFonte(id: string, volume: number, pan: number): void {
    const f = this.fontes.get(id);
    if (!f || !this.ctx) return;
    f.ganho.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)) * 0.5, this.ctx.currentTime, 0.2);
    f.painel?.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.2);
  }

  private sincronizarPausa(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    void (this.pausadoPeloJogo || document.visibilityState === 'hidden' ? ctx.suspend() : ctx.resume()).catch(() => undefined);
  }
  pausar(pausado: boolean): void { this.pausadoPeloJogo = pausado; this.sincronizarPausa(); }

  destruir(): void {
    this.desligado = true;
    for (const ev of ['click', 'touchstart', 'keydown'] as const) removeEventListener(ev, this.aoGesto);
    document.removeEventListener('visibilitychange', this.aoVisibilidade);
    this.banco?.destruir();
    for (const voz of this.vozes) {
      try { voz.fonte.stop(); } catch { /* Uma fonte em download ainda não iniciou. */ }
      voz.fonte.disconnect(); voz.ganho.disconnect(); voz.painel?.disconnect();
    }
    this.vozes.clear(); this.fontes.clear(); this.atual = null;
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null; this.banco = null;
  }
}
