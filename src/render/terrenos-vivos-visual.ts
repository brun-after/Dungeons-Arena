// Os terrenos vivos à vista (08/11/2026, D-138): a água congelada, o vapor, a lama, a lava do foco, o campo elétrico…
// Só lê o estado e os eventos. A cada pouco, cada terreno perto de quem joga solta partículas no chão, espalhadas pela
// área, na cor do tipo, e um detalhe próprio (o vapor sobe, a lava solta brasas, o campo pisca faíscas, a lama
// borbulha); a reação (`terrenoReagiu`) abre um anel e uma rajada do tipo novo. Partículas sempre, nunca formas planas.

import type { Barramento } from '../core/events';
import type { EstadoJogo } from '../core/estado';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import type { PontoVisual } from '../entities/entidade';
import { CORES_TERRENO_VIVO, type TerrenoVivo, type TipoTerrenoVivo } from '../world/ambiente-tipos';
import type { SistemaParticulas } from './particulas';
import type { Emissao } from './presets-particula';

const INTERVALO_MS = 160;
/** Só os terrenos até esta distância (células) de quem joga soltam partículas. */
const ALCANCE = 18;

const CHAO: Emissao = { textura: 'brilho', quantidade: 1, vidaMs: [900, 1300], velocidade: [0, 3], direcao: 'cima', gravidade: 0, escala: [0.75, 0.55], alpha: [0.45, 0], aditivo: true, raio: 3, cor: null, curvaAlpha: 'sino' };

/** O detalhe de cada tipo (null: só o brilho do chão). */
const DETALHE: Readonly<Record<TipoTerrenoVivo, Emissao | null>> = {
  agua: { textura: 'brilho', quantidade: 1, vidaMs: [500, 800], velocidade: [0, 2], direcao: 'livre', gravidade: 0, escala: [0.25, 0.1], alpha: [0.8, 0], aditivo: true, raio: 4, cor: 0xbfe8ff, curvaAlpha: 'sino' },
  gelo_fino: { textura: 'cristal', quantidade: 1, vidaMs: [700, 1000], velocidade: [0, 2], direcao: 'livre', gravidade: 0, escala: [0.45, 0.3], alpha: [0.9, 0], aditivo: true, raio: 4, cor: 0xeaf8ff, curvaAlpha: 'sino' },
  brasas: { textura: 'faisca', quantidade: 1, vidaMs: [600, 900], velocidade: [20, 40], direcao: 'cima', gravidade: -12, escala: [0.6, 0.15], alpha: [1, 0], aditivo: true, raio: 4, cor: 0xffa040, abertura: 0.3 },
  miasma: { textura: 'fumaca', quantidade: 1, vidaMs: [1200, 1700], velocidade: [4, 10], direcao: 'cima', gravidade: -3, escala: [0.5, 1.1], alpha: [0.35, 0], aditivo: false, raio: 5, cor: 0x6c9962 },
  campo_eletrico: { textura: 'faisca', quantidade: 1, vidaMs: [120, 220], velocidade: [40, 80], direcao: 'livre', gravidade: 0, escala: [0.7, 0.3], alpha: [1, 0], aditivo: true, raio: 4, cor: 0xfff2a0 },
  lama: { textura: 'bolha', quantidade: 1, vidaMs: [500, 800], velocidade: [2, 6], direcao: 'cima', gravidade: 0, escala: [0.2, 0.45], alpha: [0.8, 0], aditivo: false, raio: 4, cor: 0x5a4630 },
  nevoa_sombria: { textura: 'fumaca', quantidade: 1, vidaMs: [1300, 1800], velocidade: [3, 8], direcao: 'cima', gravidade: -2, escala: [0.6, 1.2], alpha: [0.4, 0], aditivo: false, raio: 5, cor: 0x3a2850 },
  luz_sagrada: { textura: 'brilho', quantidade: 1, vidaMs: [900, 1300], velocidade: [10, 22], direcao: 'cima', gravidade: -6, escala: [0.4, 0.1], alpha: [0.9, 0], aditivo: true, raio: 4, cor: 0xfff4c0 },
  vapor: { textura: 'fumaca', quantidade: 2, vidaMs: [900, 1400], velocidade: [14, 26], direcao: 'cima', gravidade: -8, escala: [0.5, 1.3], alpha: [0.55, 0], aditivo: false, raio: 6, cor: 0xe8eef2 },
  seco: { textura: 'ponto', quantidade: 1, vidaMs: [500, 800], velocidade: [3, 8], direcao: 'cima', gravidade: 2, escala: [0.25, 0.1], alpha: [0.5, 0], aditivo: false, raio: 5, cor: 0x9a8a70 },
};

const ANEL: Emissao = { textura: 'anel', quantidade: 1, vidaMs: [380, 480], velocidade: [0, 0], direcao: 'livre', gravidade: 0, escala: [0.4, 3.2], alpha: [0.85, 0], aditivo: true, raio: 0, cor: null };

export class TerrenosVivosVisual {
  private ultimo = -Infinity;
  private sorteio = 0;

  constructor(private readonly particulas: SistemaParticulas) {}

  ligar(bus: Barramento<EventosDaSimulacao>): void {
    bus.on('terrenoReagiu', (ev) => {
      const p = this.particulas;
      const centro = p.noChao(ev.x, ev.y);
      p.emitirNaTela([ANEL], centro.x, centro.y, CORES_TERRENO_VIVO[ev.para]);
      const detalhe = DETALHE[ev.para];
      if (!detalhe) return;
      for (let i = 0; i < 8; i++) {
        const c = this.pontoNaArea(ev);
        p.emitirNaTela([detalhe], c.x, c.y, CORES_TERRENO_VIVO[ev.para]);
      }
    });
  }

  /** Um ponto da área (na tela, no chão), girando pelo disco com a razão áurea. */
  private pontoNaArea(t: Pick<TerrenoVivo, 'x' | 'y' | 'raio'>): { x: number; y: number } {
    this.sorteio = (this.sorteio + 0.618034) % 1;
    const a = this.sorteio * Math.PI * 2;
    const r = Math.sqrt((this.sorteio * 7.31) % 1) * (t.raio + 0.4);
    return this.particulas.noChao(t.x + Math.cos(a) * r, t.y + Math.sin(a) * r);
  }

  quadro(estado: EstadoJogo, agoraMs: number, ouvinte: PontoVisual | null): void {
    const terrenos = estado.terrenos;
    if (!terrenos?.length || agoraMs - this.ultimo < INTERVALO_MS) return;
    this.ultimo = agoraMs;
    for (const t of terrenos) {
      if (t.ateTick <= estado.tick || (ouvinte && Math.max(Math.abs(t.x - ouvinte.x), Math.abs(t.y - ouvinte.y)) > ALCANCE + t.raio)) continue;
      const cor = CORES_TERRENO_VIVO[t.tipo];
      const n = Math.max(2, Math.round(t.raio * t.raio * 0.9));
      for (let i = 0; i < n; i++) {
        const c = this.pontoNaArea(t);
        this.particulas.emitirNaTela([CHAO], c.x, c.y, cor);
      }
      const detalhe = DETALHE[t.tipo];
      if (detalhe) {
        const c = this.pontoNaArea(t);
        this.particulas.emitirNaTela([detalhe], c.x, c.y, cor);
      }
    }
  }
}
