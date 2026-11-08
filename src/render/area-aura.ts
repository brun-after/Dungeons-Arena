// A área da aura do Guerreiro (08/11/2026, D-138): não são pontinhos, é uma área no chão. A cada pulso que atinge
// alguém (`auraPulsou`), o disco da aura acende por inteiro e faixas de luz macia nascem na borda e se fecham sobre
// o Guerreiro, como se puxassem a energia de quem está dentro, e acompanham o Guerreiro enquanto ele anda.
// Correção de 08/11/2026: a camada (`palco.marcas`, a da telegrafia) já leva a matriz da projeção do plano, então os
// sprites vão em coordenadas do plano (`centroDaCelula`), sem projetar nem achatar à mão: o ponto já projetado caía
// longe do Guerreiro. Fica acima do escuro, como a telegrafia, para a área se ver fora da luz.
// Ajuste de 08/11/2026: texturas próprias (o disco e a faixa, pintados aqui com margem transparente). As do atlas,
// esticadas sete vezes, puxavam a borda da textura vizinha e riscavam uma linha reta no alto da área. Mais sutil
// (opacidade menor); a cor vem de quem chama (do amarelo ao vermelho pela Bravura).

import { CanvasSource, Texture, type Container } from 'pixi.js';
import type { PontoVisual } from '../entities/entidade';
import { centroDaCelula } from './projecao';
import { Animacoes, Pincel, type NomeTextura } from './vfx/pincel';

/** Quanto dura um pulso, quantas faixas se fecham nele e o atraso entre uma e outra. */
const PULSO_MS = 760;
const FAIXAS = 3;
const ATRASO_FAIXA_MS = 150;
const FAIXA_MS = PULSO_MS - (FAIXAS - 1) * ATRASO_FAIXA_MS;
/** As texturas valem 32 px no mundo; a célula, 48: a escala que cobre um diâmetro de `d` células. */
const POR_CELULA = 48 / 32;
/** Lado do canvas das texturas (vistas como 32 px, como as do atlas). */
const LADO_CANVAS = 128;

/**
 * A cor da aura pela Bravura (o ciclo do amarelo ao vermelho): amarela no 25, laranja no 50, vermelha do 75 em diante
 * (mais funda no 100). Entre os marcos, a mistura.
 */
const CORES_DA_BRAVURA: readonly (readonly [number, number])[] = [[25, 0xffd86b], [50, 0xff9a3c], [75, 0xe8402a], [100, 0xc81e1e]];

export function corDaAura(bravura: number): number {
  const [primeiro] = CORES_DA_BRAVURA;
  if (!primeiro || bravura <= primeiro[0]) return primeiro?.[1] ?? 0xffd86b;
  for (let i = 1; i < CORES_DA_BRAVURA.length; i++) {
    const a = CORES_DA_BRAVURA[i - 1];
    const b = CORES_DA_BRAVURA[i];
    if (!a || !b || bravura > b[0]) continue;
    const t = (bravura - a[0]) / (b[0] - a[0]);
    const canal = (desloc: number) => Math.round(((a[1] >> desloc) & 0xff) * (1 - t) + ((b[1] >> desloc) & 0xff) * t);
    return (canal(16) << 16) | (canal(8) << 8) | canal(0);
  }
  return CORES_DA_BRAVURA[CORES_DA_BRAVURA.length - 1]?.[1] ?? 0xc81e1e;
}

/**
 * Com a Bravura 75+, quem está dentro da aura parece pegar fogo: quanto menor a diferença de nível para o Guerreiro,
 * mais (1 no mesmo nível, caindo até 0,15 a 15 níveis ou mais de distância).
 */
export function fogoNaAura(nivelGuerreiro: number, nivelAlvo: number): number {
  return Math.max(0.15, 1 - Math.abs(nivelGuerreiro - nivelAlvo) / 15);
}

export interface AuraEmPulso {
  raio: number;
  cor: number;
  forca: number;
}

export interface OpcoesAreaDaAura {
  /** Uma camada com a matriz da projeção do plano (`palco.marcas`). */
  plano: Container;
}

/** Pinta um gradiente radial (paradas de raio 0 a 1 e transparência) num canvas só dele, com margem vazia. */
function texturaRadial(paradas: readonly (readonly [number, number])[]): Texture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = LADO_CANVAS;
  canvas.height = LADO_CANVAS;
  const g = canvas.getContext('2d');
  if (!g) return null;
  const c = LADO_CANVAS / 2;
  // O gradiente acaba antes da borda: nada encosta no limite do canvas.
  const gr = g.createRadialGradient(c, c, 0, c, c, c - 4);
  for (const [r, a] of paradas) gr.addColorStop(r, `rgba(255,255,255,${a})`);
  g.fillStyle = gr;
  g.fillRect(0, 0, LADO_CANVAS, LADO_CANVAS);
  return new Texture({ source: new CanvasSource({ resource: canvas, resolution: LADO_CANVAS / 32 }) });
}

export class AreaDaAura {
  private readonly pincel: Pincel;
  private readonly anim: Animacoes;
  private readonly disco: Texture | null;
  private readonly faixa: Texture | null;

  constructor(o: OpcoesAreaDaAura) {
    // O disco: mais claro perto da borda (a área tem contorno sem virar anel duro). A faixa: um anel macio a 0,8.
    this.disco = texturaRadial([[0, 0.35], [0.6, 0.55], [0.86, 0.8], [1, 0]]);
    this.faixa = texturaRadial([[0, 0], [0.62, 0], [0.8, 1], [0.92, 0.35], [1, 0]]);
    // O pincel só pede dois nomes: o `brilho` é o disco; o `choque`, a faixa (as texturas desta área, não as do atlas).
    this.pincel = new Pincel(o.plano, (nome: NomeTextura) => (nome === 'brilho' ? this.disco : nome === 'choque' ? this.faixa : null));
    this.pincel.limite = 160;
    this.anim = new Animacoes(this.pincel);
    this.anim.limite = 24;
  }

  /** Um pulso da área em volta de quem `onde` devolve (null: sumiu, o pulso acaba). */
  pulsar(onde: () => PontoVisual | null, aura: AuraEmPulso, agoraMs: number): void {
    const diametro = (2 * aura.raio + 1) * POR_CELULA;
    // Sutil; mais acesa a cada marco.
    const brilho = 0.07 + 0.025 * aura.forca;
    this.anim.tocar(
      {
        ms: PULSO_MS,
        desenhar: (t, _ms, p) => {
          const c = onde();
          if (!c) return false;
          const q = centroDaCelula(c.x, c.y);
          // O disco inteiro acende e se encolhe um pouco (a área toda puxa para dentro).
          const s = diametro * (1 - 0.15 * t);
          p.desenhar('brilho', q.x, q.y, { sx: s, sy: s, alpha: brilho * Math.sin(Math.PI * t), cor: aura.cor, aditivo: true });
          // O miolo junta a energia que chega.
          const m = diametro * 0.25 * (0.6 + 0.8 * t);
          p.desenhar('brilho', q.x, q.y, { sx: m, sy: m, alpha: 0.5 * brilho * 4 * t * (1 - t), cor: aura.cor, aditivo: true });
          return undefined;
        },
      },
      agoraMs,
    );
    const faixa = 0.12 + 0.04 * aura.forca;
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
            // Da borda para o Guerreiro, acelerando no fim (a energia cai para dentro); o anel da textura fica a 0,8.
            const s = (diametro / 0.8) * (1 - 0.88 * t * t);
            const alpha = faixa * Math.min(1, t / 0.15) * (1 - t * t);
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
    this.disco?.destroy(true);
    this.faixa?.destroy(true);
  }
}
