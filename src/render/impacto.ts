// Presets de impacto (§2.16, §2.4). Marco 12 (14/10/2026), D-056. Puro: tremor, congelamento de impacto,
// flash e soco de zoom, combinados num deslocamento de câmera por quadro. Até 3 ativos ao mesmo tempo;
// o resto espera numa fila (§4.10). Tudo é só apresentação: o congelamento segura o desenho (~60 ms),
// nunca a simulação. Desligados com movimento reduzido ou com "efeitos de tela" desmarcado.

// Marco 24 (25/10/2026): `golpe` (a pausa de ~50 ms dos golpes fortes do Guerreiro e do aparo) e `ultimate`.
export type TipoImpacto = 'leve' | 'forte' | 'dano' | 'golpe' | 'golpe_leve' | 'ultimate';

interface Receita {
  tremorPx: number;
  duracaoMs: number;
  congelaMs: number;
  flash: number;
  /** Cor do flash: branco no impacto, vermelho no dano recebido. */
  corFlash: number;
  zoom: number;
}

// Ajuste de 14/10/2026: tremor e flash pela metade (feedback de jogo; D-056).
export const RECEITAS: Readonly<Record<TipoImpacto, Receita>> = {
  leve: { tremorPx: 2, duracaoMs: 150, congelaMs: 0, flash: 0, corFlash: 0xffffff, zoom: 0 },
  forte: { tremorPx: 4.5, duracaoMs: 300, congelaMs: 60, flash: 0.11, corFlash: 0xffffff, zoom: 0.04 },
  dano: { tremorPx: 2.5, duracaoMs: 200, congelaMs: 0, flash: 0.09, corFlash: 0xe74c3c, zoom: 0 },
  golpe: { tremorPx: 2, duracaoMs: 140, congelaMs: 50, flash: 0, corFlash: 0xffffff, zoom: 0 },
  golpe_leve: { tremorPx: 1.2, duracaoMs: 110, congelaMs: 35, flash: 0, corFlash: 0xffffff, zoom: 0 },
  ultimate: { tremorPx: 5, duracaoMs: 420, congelaMs: 80, flash: 0.16, corFlash: 0xfff3c4, zoom: 0.06 },
};

export const IMPACTOS_SIMULTANEOS = 3;

interface Ativo {
  receita: Receita;
  inicioMs: number;
}

export interface QuadroDeImpacto {
  dx: number;
  dy: number;
  zoomExtra: number;
  flash: number;
  corFlash: number;
  congelado: boolean;
}

const NEUTRO: QuadroDeImpacto = { dx: 0, dy: 0, zoomExtra: 0, flash: 0, corFlash: 0xffffff, congelado: false };

export class ControladorImpacto {
  private readonly ativos: Ativo[] = [];
  private readonly fila: TipoImpacto[] = [];

  constructor(private readonly ligado: () => boolean) {}

  pedir(tipo: TipoImpacto, agoraMs: number): void {
    if (!this.ligado()) return;
    if (this.ativos.length < IMPACTOS_SIMULTANEOS) this.ativos.push({ receita: RECEITAS[tipo], inicioMs: agoraMs });
    else if (this.fila.length < IMPACTOS_SIMULTANEOS) this.fila.push(tipo);
  }

  /** Quanto ainda está ativo (para o teste e o diagnóstico). */
  get ativosAgora(): number {
    return this.ativos.length;
  }

  quadro(agoraMs: number): QuadroDeImpacto {
    for (let i = this.ativos.length - 1; i >= 0; i--) {
      const a = this.ativos[i];
      if (a && agoraMs - a.inicioMs >= a.receita.duracaoMs) this.ativos.splice(i, 1);
    }
    while (this.ativos.length < IMPACTOS_SIMULTANEOS && this.fila.length > 0) {
      const tipo = this.fila.shift();
      if (tipo) this.ativos.push({ receita: RECEITAS[tipo], inicioMs: agoraMs });
    }
    if (this.ativos.length === 0 || !this.ligado()) return NEUTRO;
    const q = { ...NEUTRO };
    for (const a of this.ativos) {
      const t = (agoraMs - a.inicioMs) / a.receita.duracaoMs;
      const forca = 1 - t;
      // Tremor determinístico no tempo (sem PRNG): duas senoides de frequências diferentes.
      q.dx += Math.sin(agoraMs / 17) * a.receita.tremorPx * forca;
      q.dy += Math.cos(agoraMs / 23) * a.receita.tremorPx * forca;
      q.zoomExtra = Math.max(q.zoomExtra, a.receita.zoom * Math.sin(Math.PI * Math.min(1, t * 2)));
      if (a.receita.flash * forca > q.flash) {
        q.flash = a.receita.flash * forca;
        q.corFlash = a.receita.corFlash;
      }
      if (agoraMs - a.inicioMs < a.receita.congelaMs) q.congelado = true;
    }
    return q;
  }
}
