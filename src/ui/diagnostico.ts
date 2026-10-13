// Diagnóstico (§4.10): fps médio e p95 num buffer circular de 240 quadros, atualizado a 2 Hz,
// atrás da flag `?diag=1`. Também expõe dados em atributos para o teste ponta a ponta.

import { t } from '../i18n';

const QUADROS = 240;
const INTERVALO_MS = 500;

export interface DadosDiagnostico {
  tick: number;
  celula: { x: number; y: number };
  tela: { x: number; y: number };
  entidades: number;
  impactos: number;
  hp: number;
  zoom: number;
}

export class Diagnostico {
  private readonly duracoes = new Float64Array(QUADROS);
  private indice = 0;
  private preenchidos = 0;
  private ultimoQuadroMs: number | null = null;
  private ultimaAtualizacaoMs = 0;
  readonly elemento: HTMLElement;

  constructor() {
    this.elemento = document.createElement('div');
    this.elemento.className = 'diagnostico';
    this.elemento.id = 'diag';
    this.elemento.setAttribute('aria-label', t('diag.rotulo'));
  }

  static ativo(): boolean {
    return new URLSearchParams(location.search).get('diag') === '1';
  }

  quadro(agoraMs: number, dados: () => DadosDiagnostico): void {
    if (this.ultimoQuadroMs !== null) {
      this.duracoes[this.indice] = agoraMs - this.ultimoQuadroMs;
      this.indice = (this.indice + 1) % QUADROS;
      this.preenchidos = Math.min(QUADROS, this.preenchidos + 1);
    }
    this.ultimoQuadroMs = agoraMs;
    if (agoraMs - this.ultimaAtualizacaoMs < INTERVALO_MS) return;
    this.ultimaAtualizacaoMs = agoraMs;

    const amostra = Array.from(this.duracoes.subarray(0, this.preenchidos)).sort((a, b) => a - b);
    const media = amostra.reduce((s, v) => s + v, 0) / Math.max(1, amostra.length);
    const p95 = amostra[Math.floor(amostra.length * 0.95)] ?? 0;
    const d = dados();
    this.elemento.textContent =
      `fps ${(1000 / Math.max(1, media)).toFixed(0)} · p95 ${p95.toFixed(1)} ms · tick ${d.tick}` +
      ` · célula ${d.celula.x},${d.celula.y} · entidades ${d.entidades} · zoom ${d.zoom.toFixed(2)}`;
    this.elemento.dataset.tick = String(d.tick);
    this.elemento.dataset.celula = `${d.celula.x},${d.celula.y}`;
    this.elemento.dataset.tela = `${Math.round(d.tela.x)},${Math.round(d.tela.y)}`;
    this.elemento.dataset.impactos = String(d.impactos);
    this.elemento.dataset.hp = String(d.hp);
  }
}
