// Os efeitos visuais dos marcos do atributo de classe (marco 28, 30/10/2026, D-127). Só leem eventos e estado:
// - a aura do Guerreiro (Bravura 25+): um anel de luz no chão, no raio da aura, que cresce com os marcos e fica mais
//   denso e com faíscas a cada marco (ajuste de 08/11/2026, D-138); com a aura elemental, na cor do elemento da arma;
// - os orbes do Mago (Arcano 75+): um ou dois núcleos que giram em volta, na cor da encarnação;
// - os eventos `marcoDeClasse`: a explosão (Disparo explosivo e Ressonância), a chuva da Tempestade de aço pelas
//   células, o brilho dos orbes em quem eles ferem, a fumaça da Legião e as estrelas do Faro do falcão.
// Partículas sempre (nunca formas planas); o teto e o movimento reduzido valem como nas outras.

import type { Barramento } from '../core/events';
import type { EstadoJogo } from '../core/estado';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import type { Entidade, PontoVisual } from '../entities/entidade';
import type { SistemaParticulas } from './particulas';
import { PRESETS_PARTICULA } from './presets-particula';

const INTERVALO_AURA_MS = 60;
/** A fração de volta entre um ponto e o próximo (a razão áurea: os pontos cobrem o anel por igual). */
const PASSO_AUREO = 0.618034;
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
      // 08/11/2026 (D-138): sem exigir a bolsa (no online e no Mundo ela não chega; a aura dos outros também aparece).
      if (e.morto || e.invocacao) continue;
      const onde = posicao(e);
      const aura = this.o.auraDe(e, estado.tick);
      if (aura && aura.raio > 0 && this.vez(`aura:${e.id}`, agoraMs, INTERVALO_AURA_MS)) {
        // O anel no chão, meia célula além do raio (a borda das células que a aura alcança).
        const r = aura.raio + 0.5;
        for (let i = 0; i < 2 + aura.forca; i++) {
          this.sorteio = (this.sorteio + PASSO_AUREO) % 1;
          const a = this.sorteio * Math.PI * 2;
          const chao = p.noChao(onde.x + Math.cos(a) * r, onde.y + Math.sin(a) * r);
          p.emitirNaTela(PRESETS_PARTICULA.dominio_aura, chao.x, chao.y, aura.cor);
          if (aura.forca >= 2 && i === 0) p.emitirNaTela(PRESETS_PARTICULA.dominio_aura_faisca, chao.x, chao.y, aura.cor);
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
