// Qualidade gráfica (§4.10). Marco 12 (14/10/2026), D-056. Puro: presets e a degradação automática,
// testáveis sem navegador. Os efeitos só leem o preset; a simulação nunca sabe da qualidade.
//   mínimo -> sem partículas, luz, poeira, presets de impacto nem auras;
//   baixo  -> poucas partículas, sem luz nem poeira;
//   (mínimo e baixo usam um desenho só por token, sem as 18 tiras: o atalho de sprite, marco 13)
//   médio  -> partículas, luz e presets de impacto;
//   alto   -> tudo, inclusive poeira.
// Degradação (com a escolha "automática"): buffer circular de 240 quadros, verificação a cada 5 s;
// média abaixo de 45 fps em duas verificações seguidas desce um nível. Nunca sobe sozinha.

import type { NivelQualidade } from '../plataforma/preferencias';

export interface PresetQualidade {
  /** Teto de partículas vivas ao mesmo tempo. */
  particulas: number;
  luz: boolean;
  poeira: boolean;
  /** Tremor, flash, congelamento e soco de zoom (também dependem do movimento reduzido). */
  impacto: boolean;
  /** Auras de status persistentes. */
  auras: boolean;
  /** Animações decorativas de CSS (menu, pulsos de botão). */
  animacoesCss: boolean;
  /** Caminhada por 18 tiras (§2.16); sem ela, um desenho só por token (atalho de sprite, marco 13). */
  tiras: boolean;
}

export const PRESETS_QUALIDADE: Readonly<Record<NivelQualidade, PresetQualidade>> = {
  minimo: { particulas: 0, luz: false, poeira: false, impacto: false, auras: false, animacoesCss: false, tiras: false },
  baixo: { particulas: 120, luz: false, poeira: false, impacto: true, auras: true, animacoesCss: false, tiras: false },
  medio: { particulas: 300, luz: true, poeira: false, impacto: true, auras: true, animacoesCss: true, tiras: true },
  alto: { particulas: 600, luz: true, poeira: true, impacto: true, auras: true, animacoesCss: true, tiras: true },
};

const ORDEM: readonly NivelQualidade[] = ['minimo', 'baixo', 'medio', 'alto'];

/** Padrão do primeiro uso: baixo no toque, alto no desktop (§4.10). */
export function qualidadePadrao(toque: boolean): NivelQualidade {
  return toque ? 'baixo' : 'alto';
}

export function nivelAbaixo(n: NivelQualidade): NivelQualidade {
  return ORDEM[Math.max(0, ORDEM.indexOf(n) - 1)] ?? 'minimo';
}

export const QUADROS_NO_BUFFER = 240;
export const VERIFICACAO_MS = 5000;
export const FPS_MINIMO = 45;

/** Monitor da degradação automática: registra a duração dos quadros e decide quando descer. */
export class MonitorDeQualidade {
  private readonly duracoes = new Float64Array(QUADROS_NO_BUFFER);
  private cheios = 0;
  private proximo = 0;
  private ultimaVerificacaoMs: number | null = null;
  private abaixoSeguidas = 0;

  constructor(public nivel: NivelQualidade) {}

  /** Registra um quadro; devolve o novo nível quando a qualidade deve descer, senão null. */
  registrar(duracaoMs: number, agoraMs: number): NivelQualidade | null {
    this.duracoes[this.proximo] = duracaoMs;
    this.proximo = (this.proximo + 1) % QUADROS_NO_BUFFER;
    this.cheios = Math.min(QUADROS_NO_BUFFER, this.cheios + 1);
    if (this.ultimaVerificacaoMs === null) {
      this.ultimaVerificacaoMs = agoraMs;
      return null;
    }
    if (agoraMs - this.ultimaVerificacaoMs < VERIFICACAO_MS) return null;
    this.ultimaVerificacaoMs = agoraMs;
    if (this.cheios < QUADROS_NO_BUFFER / 4) return null;
    this.abaixoSeguidas = this.fpsMedio() < FPS_MINIMO ? this.abaixoSeguidas + 1 : 0;
    if (this.abaixoSeguidas < 2 || this.nivel === 'minimo') return null;
    this.abaixoSeguidas = 0;
    this.nivel = nivelAbaixo(this.nivel);
    return this.nivel;
  }

  fpsMedio(): number {
    if (this.cheios === 0) return 0;
    let soma = 0;
    for (let i = 0; i < this.cheios; i++) soma += this.duracoes[i] ?? 0;
    return soma > 0 ? (1000 * this.cheios) / soma : 0;
  }
}
