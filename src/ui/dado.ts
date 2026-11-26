// O d20 perto da barra de habilidades (§2.7, rolagem visível). Ajuste de 15/10/2026, D-060.
// A cada rolagem do jogador o dado gira rápido e mostra o número, na cor da faixa: falha (1–3) vermelha, normal
// neutra, bom (13–19) dourada e 20 dourada maior com "Crítico!". Parado por um tempo, ele esmaece para não
// competir com o jogo. Com movimento reduzido, não gira.
// D-205 (25/11/2026): o icosaedro desenhado (dado-modelo.ts) rola 480 ms e para com a face do combate de frente;
// em ataques seguidos, o último resultado entra depois do atual, para cada número ser lido.

import { t } from '../i18n';
import { desenharIcosaedro, TAMANHO_DADO } from './dado-modelo';

/** Quanto tempo sem rolagem nova até o dado esmaecer. */
export const DADO_ESMAECE_MS = 2000;
const TEMPO_ROLAGEM_MS = 480;
const TEMPO_RESULTADO_MS = 240;
const QUADRO_MS = 1000 / 30;

export type FaixaDado = 'falha' | 'normal' | 'bom' | 'critico';

/** Faixa visual do resultado: segue a tabela do d20 (§2.7: 1–3 ×0, 13–15 ×1,2, 16–19 ×1,5, 20 ×2). */
export function faixaDoDado(valor: number): FaixaDado {
  if (valor <= 3) return 'falha';
  if (valor >= 20) return 'critico';
  if (valor >= 13) return 'bom';
  return 'normal';
}

const TONS: Record<FaixaDado, number> = { falha: 3, normal: 29, bom: 43, critico: 46 };

export class DadoD20 {
  readonly elemento = document.createElement('div');
  private readonly modelo = document.createElement('canvas');
  private readonly desenho = this.modelo.getContext('2d');
  private readonly rotulo = document.createElement('span');
  private readonly reduzir = matchMedia('(prefers-reduced-motion: reduce)');
  private inicioMs = -Infinity;
  private resultadoMs = -Infinity;
  private quadroMs = -Infinity;
  private rolando: number | null = null;
  private pendente: number | null = null;

  constructor() {
    this.elemento.className = 'dado-d20 esmaecido';
    this.elemento.setAttribute('role', 'status');
    this.elemento.setAttribute('aria-live', 'off');
    this.modelo.width = this.modelo.height = TAMANHO_DADO;
    this.modelo.className = 'modelo-dado';
    this.modelo.setAttribute('aria-hidden', 'true');
    this.rotulo.className = 'rotulo-dado';
    this.elemento.append(this.modelo, this.rotulo);
    this.elemento.hidden = true;
  }

  mostrar(valor: number, agoraMs: number): void {
    this.elemento.hidden = false;
    this.elemento.dataset.valor = String(valor);
    this.elemento.classList.remove('esmaecido');
    if (this.semMovimento()) {
      this.pendente = null;
      this.revelar(valor, agoraMs);
    } else if (this.rolando !== null || agoraMs < this.resultadoMs + TEMPO_RESULTADO_MS) {
      // Em ataques múltiplos, mantém a rolagem em curso legível e mostra o último resultado em seguida.
      this.pendente = valor;
    } else {
      this.iniciar(valor, agoraMs);
    }
  }

  private semMovimento(): boolean {
    return !this.desenho || this.reduzir.matches || document.body.classList.contains('movimento-reduzido');
  }

  private iniciar(valor: number, agoraMs: number): void {
    this.rolando = valor;
    this.inicioMs = this.quadroMs = agoraMs;
    this.elemento.classList.add('girando');
    delete this.elemento.dataset.faixa;
    this.rotulo.textContent = t('dado.d20');
    if (this.desenho) desenharIcosaedro(this.desenho, valor, TONS.normal, 0);
  }

  private revelar(valor: number, agoraMs: number): void {
    const faixa = faixaDoDado(valor);
    this.rolando = null;
    this.resultadoMs = agoraMs;
    this.elemento.classList.remove('girando');
    this.elemento.dataset.faixa = faixa;
    this.rotulo.textContent = faixa === 'critico' ? t('dado.critico') : faixa === 'falha' ? t('dado.falha') : t('dado.d20');
    this.elemento.setAttribute('aria-label', t('hud.d20', { valor }));
    if (this.desenho) desenharIcosaedro(this.desenho, valor, TONS[faixa], 1);
    else this.rotulo.textContent = String(valor);
  }

  atualizar(agoraMs: number): void {
    if (this.elemento.hidden) return;
    if (this.rolando !== null) {
      const progresso = (agoraMs - this.inicioMs) / TEMPO_ROLAGEM_MS;
      if (progresso >= 1 || this.semMovimento()) this.revelar(this.rolando, agoraMs);
      else if (this.desenho && agoraMs - this.quadroMs >= QUADRO_MS) {
        this.quadroMs = agoraMs;
        desenharIcosaedro(this.desenho, this.rolando, TONS.normal, Math.max(0, progresso));
      }
    } else if (this.pendente !== null && agoraMs >= this.resultadoMs + TEMPO_RESULTADO_MS) {
      const valor = this.pendente;
      this.pendente = null;
      if (this.semMovimento()) this.revelar(valor, agoraMs);
      else this.iniciar(valor, agoraMs);
    } else {
      this.elemento.classList.toggle('esmaecido', agoraMs - this.resultadoMs > DADO_ESMAECE_MS);
    }
  }
}
