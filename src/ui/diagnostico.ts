// Diagnóstico (§4.10): fps médio e p95 num buffer circular de 240 quadros, atualizado a 2 Hz,
// atrás da flag `?diag=1`. Também expõe dados em atributos para o teste ponta a ponta.
// Marco 16 (15/10/2026, D-062): p99, pausas acima de 100 ms na janela e a memória do heap (quando o navegador expõe).

import { t } from '../i18n';

const QUADROS = 240;
const INTERVALO_MS = 500;
/** Quadro acima disto conta como pausa perceptível. */
const PAUSA_MS = 100;

/** Indicador de rede da arena (§2.15): latência, correção e estado da conexão. */
export interface DadosRede {
  rttMs: number;
  /** Latência simulada de ida, no loopback. */
  latenciaSimuladaMs: number;
  /** p95 do erro de correção (células) nas últimas reconciliações. */
  erroP95: number;
  conectado: boolean;
}

export interface DadosDiagnostico {
  tick: number;
  celula: { x: number; y: number };
  /** Marco 24 (D-099): a célula para onde o passo em curso vai (igual à célula quando parado); os testes param na porta. */
  destino?: { x: number; y: number };
  /** Marco 24 (D-099): a célula do jogador e as duas vizinhas (+x, +y) na tela; os testes clicam numa célula exata. */
  grade?: readonly { x: number; y: number }[];
  tela: { x: number; y: number };
  entidades: number;
  impactos: number;
  hp: number;
  /** Marco 6: nível e quantos slots têm item. */
  nivel: number;
  equipados: number;
  /** Marco 15: a dificuldade da sessão. */
  dificuldade: string;
  zoom: number;
  rede?: DadosRede;
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
    const p99 = amostra[Math.floor(amostra.length * 0.99)] ?? 0;
    const pausas = amostra.filter((v) => v > PAUSA_MS).length;
    const memoria = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    const mb = memoria ? Math.round(memoria.usedJSHeapSize / 1024 / 1024) : null;
    const d = dados();
    this.elemento.dataset.p99 = p99.toFixed(1);
    this.elemento.dataset.pausas = String(pausas);
    if (mb !== null) this.elemento.dataset.memoriaMb = String(mb);
    this.elemento.textContent =
      `fps ${(1000 / Math.max(1, media)).toFixed(0)} · p95 ${p95.toFixed(1)} · p99 ${p99.toFixed(1)} ms · pausas ${pausas}` +
      (mb !== null ? ` · ${mb} MB` : '') +
      ` · tick ${d.tick}` +
      ` · célula ${d.celula.x},${d.celula.y} · entidades ${d.entidades} · zoom ${d.zoom.toFixed(2)}` +
      (d.rede ? ` · rtt ${d.rede.rttMs.toFixed(0)} ms · correção p95 ${d.rede.erroP95.toFixed(2)}` : '');
    if (d.rede) {
      this.elemento.dataset.rtt = d.rede.rttMs.toFixed(0);
      this.elemento.dataset.erroP95 = d.rede.erroP95.toFixed(3);
    }
    this.elemento.dataset.tick = String(d.tick);
    this.elemento.dataset.celula = `${d.celula.x},${d.celula.y}`;
    if (d.destino) this.elemento.dataset.destino = `${d.destino.x},${d.destino.y}`;
    if (d.grade) this.elemento.dataset.grade = d.grade.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(',');
    this.elemento.dataset.tela = `${Math.round(d.tela.x)},${Math.round(d.tela.y)}`;
    this.elemento.dataset.impactos = String(d.impactos);
    this.elemento.dataset.hp = String(d.hp);
    this.elemento.dataset.nivel = String(d.nivel);
    this.elemento.dataset.equipados = String(d.equipados);
    this.elemento.dataset.dificuldade = d.dificuldade;
  }
}
