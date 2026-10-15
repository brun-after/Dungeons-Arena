// O d20 perto da barra de habilidades (§2.7, rolagem visível). Ajuste de 15/10/2026, D-060.
// A cada rolagem do jogador o dado gira rápido e mostra o número, na cor da faixa: falha (1–3) vermelha, normal
// neutra, bom (13–19) dourada e 20 dourada maior com "Crítico!". Parado por um tempo, ele esmaece para não
// competir com o jogo. Com movimento reduzido, não gira (o CSS desliga a animação).

import { t } from '../i18n';

/** Quanto tempo sem rolagem nova até o dado esmaecer. */
export const DADO_ESMAECE_MS = 1500;

export type FaixaDado = 'falha' | 'normal' | 'bom' | 'critico';

/** Faixa visual do resultado: segue a tabela do d20 (§2.7: 1–3 ×0, 13–15 ×1,2, 16–19 ×1,5, 20 ×2). */
export function faixaDoDado(valor: number): FaixaDado {
  if (valor <= 3) return 'falha';
  if (valor >= 20) return 'critico';
  if (valor >= 13) return 'bom';
  return 'normal';
}

export class DadoD20 {
  readonly elemento = document.createElement('div');
  private readonly numero = document.createElement('span');
  private readonly rotulo = document.createElement('span');
  private ultimaMs = -Infinity;

  constructor() {
    this.elemento.className = 'dado-d20 esmaecido';
    this.elemento.setAttribute('role', 'status');
    this.elemento.setAttribute('aria-live', 'off');
    this.numero.className = 'numero-dado';
    this.numero.textContent = '20';
    this.rotulo.className = 'rotulo-dado';
    this.elemento.append(this.numero, this.rotulo);
    this.elemento.hidden = true;
    this.elemento.addEventListener('animationend', () => {
      this.elemento.classList.remove('girando');
    });
  }

  mostrar(valor: number, agoraMs: number): void {
    const faixa = faixaDoDado(valor);
    this.ultimaMs = agoraMs;
    this.elemento.hidden = false;
    this.elemento.dataset.faixa = faixa;
    this.elemento.dataset.valor = String(valor);
    this.numero.textContent = String(valor);
    this.rotulo.textContent = faixa === 'critico' ? t('dado.critico') : faixa === 'falha' ? t('dado.falha') : '';
    this.elemento.setAttribute('aria-label', t('hud.d20', { valor }));
    this.elemento.classList.remove('esmaecido', 'girando');
    // Reinicia a animação mesmo com duas rolagens seguidas.
    this.elemento.getBoundingClientRect();
    this.elemento.classList.add('girando');
  }

  atualizar(agoraMs: number): void {
    if (this.elemento.hidden) return;
    this.elemento.classList.toggle('esmaecido', agoraMs - this.ultimaMs > DADO_ESMAECE_MS);
  }
}
