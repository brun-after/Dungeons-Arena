// A área da aura do Guerreiro (08/11/2026, D-138): não são pontinhos, é uma área no chão. A cada pulso que atinge
// alguém (`auraPulsou`), o disco da aura acende por inteiro e faixas de luz macia nascem na borda e se fecham sobre
// o Guerreiro, como se puxassem a energia de quem está dentro. Sprites de textura com gradiente (o `brilho` e o
// `choque`) e acompanham o Guerreiro enquanto ele anda.
// Correção de 08/11/2026: a camada (`palco.marcas`, a da telegrafia) já leva a matriz da projeção do plano, então os
// sprites vão em coordenadas do plano (`centroDaCelula`), sem projetar nem achatar à mão: o ponto já projetado caía
// longe do Guerreiro. Fica acima do escuro, como a telegrafia, para a área se ver fora da luz.

import type { Container, Texture } from 'pixi.js';
import type { PontoVisual } from '../entities/entidade';
import { centroDaCelula } from './projecao';
import { Animacoes, Pincel, type NomeTextura } from './vfx/pincel';

/** Quanto dura um pulso, quantas faixas se fecham nele e o atraso entre uma e outra. */
const PULSO_MS = 760;
const FAIXAS = 3;
const ATRASO_FAIXA_MS = 150;
const FAIXA_MS = PULSO_MS - (FAIXAS - 1) * ATRASO_FAIXA_MS;
/** A textura tem 32 px; a célula, 48: a escala que cobre um diâmetro de `d` células. */
const POR_CELULA = 48 / 32;
/** O `choque` é um anel macio a ~0,8 do raio da textura: a escala que põe o anel na borda da aura. */
const AJUSTE_FAIXA = 1.2;

export interface AuraEmPulso {
  raio: number;
  cor: number;
  forca: number;
}

export interface OpcoesAreaDaAura {
  /** Uma camada com a matriz da projeção do plano (`palco.marcas`). */
  plano: Container;
  textura: (nome: NomeTextura) => Texture | null;
}

export class AreaDaAura {
  private readonly pincel: Pincel;
  private readonly anim: Animacoes;

  constructor(private readonly o: OpcoesAreaDaAura) {
    this.pincel = new Pincel(o.plano, o.textura);
    this.pincel.limite = 160;
    this.anim = new Animacoes(this.pincel);
    this.anim.limite = 24;
  }

  /** Um pulso da área em volta de quem `onde` devolve (null: sumiu, o pulso acaba). */
  pulsar(onde: () => PontoVisual | null, aura: AuraEmPulso, agoraMs: number): void {
    const diametro = (2 * aura.raio + 1) * POR_CELULA;
    // Mais marcos, área mais acesa.
    const brilho = 0.18 + 0.06 * aura.forca;
    this.anim.tocar(
      {
        ms: PULSO_MS,
        desenhar: (t, _ms, p) => {
          const c = onde();
          if (!c) return false;
          const q = centroDaCelula(c.x, c.y);
          // O disco inteiro acende e se encolhe um pouco (a área toda puxa para dentro).
          const s = diametro * (1 - 0.18 * t);
          const sino = Math.sin(Math.PI * t);
          p.desenhar('brilho', q.x, q.y, { sx: s, sy: s, alpha: brilho * sino, cor: aura.cor, aditivo: true });
          // O miolo junta a energia que chega.
          const m = diametro * 0.22 * (0.6 + 0.8 * t);
          p.desenhar('brilho', q.x, q.y, { sx: m, sy: m, alpha: 0.55 * t * (1 - t) * 4 * 0.6, cor: aura.cor, aditivo: true });
          return undefined;
        },
      },
      agoraMs,
    );
    for (let i = 0; i < FAIXAS; i++) {
      this.anim.tocar(
        {
          ms: FAIXA_MS,
          atrasoMs: i * ATRASO_FAIXA_MS,
          enfeite: i > 0,
          desenhar: (t, _ms, p) => {
            const c = onde();
            if (!c) return false;
            const q = centroDaCelula(c.x, c.y);
            // Da borda para o Guerreiro, acelerando no fim (a energia cai para dentro).
            const s = diametro * AJUSTE_FAIXA * (1 - 0.88 * t * t);
            const alpha = (0.35 + 0.1 * aura.forca) * Math.min(1, t / 0.15) * (1 - t * t);
            p.desenhar('choque', q.x, q.y, { sx: s, sy: s, alpha, cor: aura.cor, aditivo: true });
            return undefined;
          },
        },
        agoraMs,
      );
    }
  }

  quadro(agoraMs: number): void {
    this.anim.quadro(agoraMs);
  }

  destruir(): void {
    this.pincel.destruir();
  }
}
