// Os efeitos visuais dos marcos do atributo de classe (marco 28, 30/10/2026, D-127). Só leem eventos e estado:
// - a aura do Guerreiro (Bravura 25+): pontos de luz pela borda do raio, que cresce com os marcos; com a aura
//   elemental, na cor do elemento da arma;
// - os orbes do Mago (Arcano 75+): um ou dois núcleos que giram em volta, na cor da encarnação;
// - os eventos `marcoDeClasse`: a explosão (Disparo explosivo e Ressonância), a chuva da Tempestade de aço pelas
//   células, o brilho dos orbes em quem eles ferem, a fumaça da Legião e as estrelas do Faro do falcão.
// Partículas sempre (nunca formas planas); o teto e o movimento reduzido valem como nas outras.

import type { Barramento } from '../core/events';
import type { EstadoJogo } from '../core/estado';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import type { Entidade, PontoVisual } from '../entities/entidade';
import type { SistemaParticulas } from './particulas';

const INTERVALO_AURA_MS = 140;
const PONTOS_POR_VEZ = 3;
const INTERVALO_ORBE_MS = 45;
const VOLTA_ORBE_MS = 1400;
const RAIO_ORBE = 1.1;
const COR_PADRAO = 0xffd86b;

export interface OpcoesEfeitosDominio {
  particulas: SistemaParticulas;
  /** O raio da aura visível e a cor (null: sem a aura à mostra). */
  auraDe: (e: Entidade, tick: number) => { raio: number; cor: number } | null;
  /** Os orbes em volta e a cor (null: sem orbes). */
  orbesDe: (e: Entidade) => { n: number; cor: number } | null;
}

export class EfeitosDeDominio {
  private readonly ultimo = new Map<string, number>();
  private sorteio = 0;

  constructor(private readonly o: OpcoesEfeitosDominio) {}

  private vez(chave: string, agoraMs: number, intervaloMs: number): boolean {
    if (agoraMs - (this.ultimo.get(chave) ?? -Infinity) < intervaloMs) return false;
    this.ultimo.set(chave, agoraMs);
    return true;
  }

  ligar(bus: Barramento<EventosDaSimulacao>, estado: () => EstadoJogo): void {
    const p = this.o.particulas;
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
    if (this.ultimo.size > 4 * estado.entidades.length + 64) {
      for (const [chave, ms] of this.ultimo) if (agoraMs - ms > 10_000) this.ultimo.delete(chave);
    }
    for (const e of estado.entidades) {
      if (e.morto || !e.bolsa) continue;
      const onde = posicao(e);
      const aura = this.o.auraDe(e, estado.tick);
      if (aura && aura.raio > 0 && this.vez(`aura:${e.id}`, agoraMs, INTERVALO_AURA_MS)) {
        // A borda quadrada (a aura mede por Chebyshev): alguns pontos por vez, girando pela borda.
        const r = aura.raio + 0.5;
        const perimetro = 8 * r;
        for (let i = 0; i < PONTOS_POR_VEZ; i++) {
          this.sorteio = (this.sorteio + 0.37 * perimetro) % perimetro;
          const lado = Math.floor(this.sorteio / (2 * r));
          const t = (this.sorteio % (2 * r)) - r;
          const [dx, dy] = lado === 0 ? [t, -r] : lado === 1 ? [r, t] : lado === 2 ? [-t, r] : [-r, -t];
          p.emitir('dominio_aura', onde.x + dx, onde.y + dy, aura.cor);
        }
      }
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
