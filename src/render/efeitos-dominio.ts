// Os efeitos visuais dos marcos do atributo de classe (marco 28, 30/10/2026, D-127). Só leem eventos e estado:
// - a aura do Guerreiro (Bravura 25+), só quando ela atinge alguém (ajuste de 08/11/2026, D-138: só perseguir não
//   acende nada): a cada pulso (`auraPulsou`), a área no chão acende e se fecha sobre ele (area-aura.ts) e filetes
//   saem de cada inimigo atingido em direção a ele. Com a aura elemental, na cor do elemento da arma;
// - os orbes do Mago (Arcano 75+): um ou dois núcleos que giram em volta, na cor da encarnação;
// - os eventos `marcoDeClasse`: a explosão (Disparo explosivo e Ressonância), a chuva da Tempestade de aço pelas
//   células, o brilho dos orbes em quem eles ferem, a fumaça da Legião e as estrelas do Faro do falcão.
// Partículas sempre (nunca formas planas); o teto e o movimento reduzido valem como nas outras.

import type { Barramento } from '../core/events';
import type { EstadoJogo } from '../core/estado';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import type { Entidade, PontoVisual } from '../entities/entidade';
import type { SistemaParticulas } from './particulas';
import type { Emissao } from './presets-particula';
import type { AuraEmPulso } from './area-aura';

/** Quanto o filete de energia leva do inimigo até o Guerreiro. */
const VOO_FILETE_MS = 420;

/** Um risco de energia que voa de `de` até `para` (em px de tela) no tempo `vidaMs`, esticado no voo, sumindo ao chegar. */
function voo(textura: 'brilho' | 'faisca', escala: readonly [number, number], de: { x: number; y: number }, para: { x: number; y: number }, vidaMs: number): { lista: Emissao[]; angulo: number } {
  const v = Math.hypot(para.x - de.x, para.y - de.y) / (vidaMs / 1000);
  return {
    lista: [{ textura, quantidade: 1, vidaMs: [vidaMs, vidaMs], velocidade: [v, v], direcao: 'orientada', gravidade: 0, escala, alpha: [0.95, 0.25], aditivo: true, raio: 0, cor: null, curvaAlpha: 'sino', esticar: 1.6 }],
    angulo: Math.atan2(para.y - de.y, para.x - de.x),
  };
}
const INTERVALO_ORBE_MS = 45;
const VOLTA_ORBE_MS = 1400;
const RAIO_ORBE = 1.1;
const COR_PADRAO = 0xffd86b;

export interface OpcoesEfeitosDominio {
  particulas: SistemaParticulas;
  /** O raio da aura visível, a cor e a força (1 a 4, os marcos alcançados); null: sem a aura à mostra. */
  auraDe: (e: Entidade, tick: number) => { raio: number; cor: number; forca: number } | null;
  /** Os orbes em volta e a cor (null: sem orbes). */
  orbesDe: (e: Entidade) => { n: number; cor: number } | null;
  /** A área da aura no chão (area-aura.ts); sem ela, só os filetes. */
  area?: { pulsar: (onde: () => PontoVisual | null, aura: AuraEmPulso, agoraMs: number) => void; quadro: (agoraMs: number) => void };
}

export class EfeitosDeDominio {
  private readonly ultimo = new Map<string, number>();

  constructor(private readonly o: OpcoesEfeitosDominio) {}

  private vez(chave: string, agoraMs: number, intervaloMs: number): boolean {
    if (agoraMs - (this.ultimo.get(chave) ?? -Infinity) < intervaloMs) return false;
    this.ultimo.set(chave, agoraMs);
    return true;
  }

  private posicao: ((e: Entidade) => PontoVisual) | null = null;

  ligar(bus: Barramento<EventosDaSimulacao>, estado: () => EstadoJogo, agora: () => number = () => performance.now()): void {
    const p = this.o.particulas;
    // O pulso (só sai com alguém atingido): a área acende e se fecha sobre o Guerreiro, e de cada inimigo atingido um
    // filete de energia voa até ele.
    bus.on('auraPulsou', (ev) => {
      const pos = this.posicao;
      const entidades = estado().entidades;
      const dono = entidades.find((e) => e.id === ev.id);
      const aura = dono ? this.o.auraDe(dono, ev.tick) : null;
      if (!pos || !dono || !aura) return;
      const centro = pos(dono);
      const ate = p.naTela(centro.x, centro.y);
      for (const id of ev.atingidos) {
        const alvo = entidades.find((e) => e.id === id);
        if (!alvo) continue;
        const onde = pos(alvo);
        const de = p.naTela(onde.x, onde.y);
        for (let k = 0; k < 3 + aura.forca; k++) {
          // Os brilhos do filete saem um pouco espalhados e chegam juntos.
          const j = { x: de.x + (k - 2) * 3, y: de.y + ((k * 7) % 5) - 2 };
          const { lista, angulo } = voo(k % 2 ? 'faisca' : 'brilho', [0.7, 0.3], j, ate, VOO_FILETE_MS + k * 40);
          p.emitirNaTela(lista, j.x, j.y, aura.cor, undefined, angulo);
        }
      }
      this.o.area?.pulsar(() => {
        const atual = estado().entidades.find((e) => e.id === ev.id);
        return atual && !atual.morto ? pos(atual) : null;
      }, aura, agora());
    });
    bus.on('marcoDeClasse', (ev) => {
      const dono = estado().entidades.find((e) => e.id === ev.id);
      const cor = (dono && this.o.orbesDe(dono)?.cor) ?? COR_PADRAO;
      for (const c of ev.celulas) {
        if (ev.marco === 'explosao' || ev.marco === 'ressonancia') {
          if (ev.marco === 'explosao' || (c.x === ev.celulas[0]?.x && c.y === ev.celulas[0].y)) p.emitir('dominio_explosao', c.x, c.y, cor);
          else p.emitir('dominio_aura', c.x, c.y, cor);
        } else if (ev.marco === 'tempestade') p.emitir('chuva', c.x, c.y, 0xdfe6ee);
        else if (ev.marco === 'orbes') p.emitir('faiscas', c.x, c.y, cor);
        else if (ev.marco === 'legiao') p.emitir('dominio_legiao', c.x, c.y, 0x9b59b6);
        else p.emitir('estrelas', c.x, c.y, 0xf1c40f);
      }
    });
  }

  quadro(estado: EstadoJogo, agoraMs: number, posicao: (e: Entidade) => PontoVisual): void {
    const p = this.o.particulas;
    this.posicao = posicao;
    this.o.area?.quadro(agoraMs);
    if (this.ultimo.size > 4 * estado.entidades.length + 64) {
      for (const [chave, ms] of this.ultimo) if (agoraMs - ms > 10_000) this.ultimo.delete(chave);
    }
    for (const e of estado.entidades) {
      // 08/11/2026 (D-138): sem exigir a bolsa (no online e no Mundo ela não chega). A aura não sai daqui: só do pulso.
      if (e.morto || e.invocacao) continue;
      const onde = posicao(e);
      const orbes = this.o.orbesDe(e);
      if (orbes && orbes.n > 0 && this.vez(`orbe:${e.id}`, agoraMs, INTERVALO_ORBE_MS)) {
        const angulo = ((agoraMs % VOLTA_ORBE_MS) / VOLTA_ORBE_MS) * Math.PI * 2;
        for (let i = 0; i < orbes.n; i++) {
          const a = angulo + (i * Math.PI * 2) / orbes.n;
          p.emitir('dominio_orbe', onde.x + Math.cos(a) * RAIO_ORBE, onde.y + Math.sin(a) * RAIO_ORBE, orbes.cor);
        }
      }
    }
  }
}
