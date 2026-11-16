// Marco 45 (16/11/2026, D-182): as marcas de Filo no chão. Só lê o estado (como a telegrafia, que a desenha):
// - a fenda: quando uma criatura de Filo aparece (nasce na noite, renasce, é posta pelo chefe), o chão racha por um
//   instante na cor da fenda da dimensão dela, no jeito dela (os cacos de vidro de Ignárea, os espinhos de Hiemália,
//   os pulsos de Fulgúria...); a primeira leva que já estava lá ao abrir a cena não racha;
// - as marcas dos chefes (as zonas do estado da criatura): o silêncio, o bombardeio, a coluna que vai desabar, o mergulho
//   da Harpia e o sonho, cada uma na sua cor, enchendo até o fim.

import type { Graphics } from 'pixi.js';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { CELULA_PX } from './camera-calculo';

const FENDA_MS = 1400;
const ABRE_MS = 220;
/** Quantos braços tem a rachadura de cada jeito de fenda, e quanto eles se quebram. */
const JEITOS: Readonly<Record<string, { bracos: number; quebra: number }>> = {
  vidro: { bracos: 7, quebra: 0.5 }, espinhos: { bracos: 9, quebra: 0.15 }, pulsos: { bracos: 5, quebra: 0.8 },
  bolhas: { bracos: 6, quebra: 0.3 }, breu: { bracos: 4, quebra: 0.2 }, espelho: { bracos: 8, quebra: 0.05 },
  geodo: { bracos: 6, quebra: 0.35 }, coro: { bracos: 12, quebra: 0.05 }, sopro: { bracos: 5, quebra: 0.6 },
};
const ZONAS: Readonly<Record<string, number>> = {
  silencio: 0xbfe4f8, bombardeio: 0xff6a3a, coluna: 0xa98f6a, mergulho: 0xeef9ff, sonho: 0xd79bff,
};

const cor = (hex: string): number => Number.parseInt(hex.replace('#', ''), 16) || 0xffffff;

interface Fenda { x: number; y: number; cor: number; borda: number; jeito: string; desde: number; semente: number }

export class MarcasDeFilo {
  private readonly vistos = new Map<string, boolean>();
  private primeiraLeva = true;
  private fendas: Fenda[] = [];

  desenhar(g: Graphics, estado: EstadoJogo, ctx: ContextoSimulacao, agora: number): void {
    this.notarChegadas(estado, ctx, agora);
    this.fendas = this.fendas.filter((f) => agora - f.desde < FENDA_MS);
    for (const f of this.fendas) this.rachar(g, f, agora);
    const tick = estado.tick;
    for (const e of estado.entidades) {
      for (const z of e.criatura?.zonas ?? []) {
        if (z.ateTick <= tick) continue;
        const c = ZONAS[z.tipo] ?? 0xffffff;
        const cx = (z.x + 0.5) * CELULA_PX;
        const cy = (z.y + 0.5) * CELULA_PX;
        const r = (z.raio + 0.5) * CELULA_PX;
        // Nos 2 s do fim, enche do centro para a borda (o aviso de quando cai).
        const falta = Math.max(0, Math.min(1, (z.ateTick - tick) / 120));
        g.circle(cx, cy, r).fill({ color: c, alpha: 0.1 }).stroke({ width: 2, color: c, alpha: 0.7 });
        g.circle(cx, cy, r * (1 - 0.85 * falta)).fill({ color: c, alpha: 0.16 });
      }
    }
  }

  /** As criaturas de Filo que acabaram de aparecer (novas ou de volta da morte). */
  private notarChegadas(estado: EstadoJogo, ctx: ContextoSimulacao, agora: number): void {
    if (this.vistos.size > 4000) this.vistos.clear();
    for (const e of estado.entidades) {
      const dim = ctx.conteudo.presets.get(e.preset)?.dimensao;
      if (!dim) continue;
      const antes = this.vistos.get(e.id);
      this.vistos.set(e.id, e.morto);
      if (this.primeiraLeva || e.morto || antes === false) continue;
      const d = ctx.conteudo.dimensoes.get(dim);
      if (!d) continue;
      this.fendas.push({ x: e.x, y: e.y, cor: cor(d.fenda.cor), borda: cor(d.fenda.borda), jeito: d.fenda.jeito, desde: agora, semente: e.id.length * 31 + Math.round(e.x * 7 + e.y * 13) });
    }
    this.primeiraLeva = false;
  }

  /** A rachadura em estrela: a borda escura por baixo e a luz da dimensão por cima; abre rápido e some devagar. */
  private rachar(g: Graphics, f: Fenda, agora: number): void {
    const t = (agora - f.desde) / FENDA_MS;
    const abre = Math.min(1, (agora - f.desde) / ABRE_MS);
    const alpha = 1 - Math.max(0, (t - 0.45) / 0.55);
    const j = JEITOS[f.jeito] ?? { bracos: 6, quebra: 0.3 };
    const cx = (f.x + 0.5) * CELULA_PX;
    const cy = (f.y + 0.5) * CELULA_PX;
    const raio = CELULA_PX * 0.95 * abre;
    let s = f.semente;
    const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    g.ellipse(cx, cy, raio * 0.55, raio * 0.4).fill({ color: f.borda, alpha: 0.55 * alpha });
    for (let i = 0; i < j.bracos; i++) {
      const a = (i / j.bracos) * Math.PI * 2 + r() * 0.5;
      const compr = raio * (0.6 + r() * 0.6);
      const meio = compr * 0.5;
      const desvio = (r() - 0.5) * j.quebra;
      const mx = cx + Math.cos(a + desvio) * meio;
      const my = cy + Math.sin(a + desvio) * meio;
      const px = cx + Math.cos(a) * compr;
      const py = cy + Math.sin(a) * compr;
      g.moveTo(cx, cy).lineTo(mx, my).lineTo(px, py).stroke({ width: 4, color: f.borda, alpha: 0.8 * alpha });
      g.moveTo(cx, cy).lineTo(mx, my).lineTo(px, py).stroke({ width: 1.6, color: f.cor, alpha: alpha });
    }
    g.ellipse(cx, cy, raio * 0.22, raio * 0.16).fill({ color: f.cor, alpha: 0.8 * alpha });
  }
}
