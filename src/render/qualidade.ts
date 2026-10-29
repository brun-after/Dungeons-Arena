// Qualidade gráfica (§4.10). Marco 12 (14/10/2026), D-056. Puro: presets e a degradação automática,
// testáveis sem navegador. Os efeitos só leem o preset; a simulação nunca sabe da qualidade.
//   mínimo -> sem partículas, luz, poeira, presets de impacto nem auras;
//   baixo  -> poucas partículas, sem luz nem poeira;
//   (mínimo e baixo usam um desenho só por token, sem as 18 tiras: o atalho de sprite, marco 13)
//   médio  -> partículas, luz e presets de impacto;
//   alto   -> tudo, inclusive poeira.
// Degradação (com a escolha "automática"): buffer circular de 240 quadros, verificação a cada 5 s;
// média abaixo de 45 fps em duas verificações seguidas desce um nível. Nunca sobe sozinha.
// Marco 20 (21/10/2026, D-087): também desce com travadas (p95 da duração dos quadros acima de 50 ms), não só com
// lentidão constante; e, com teto de 30 fps, o limite da média acompanha o teto (75% dele).
// Marco 26 (29/10/2026, D-122): também SOBE. Antes, alguns picos numa luta cheia levavam ao mínimo (com teto de 30 fps)
// até o fim da cena, e o jogo "ficava pesado" com o tempo. Agora, com `SUBIDA_MS` seguidos de quadros bons, volta um
// nível (nunca acima do nível com que a cena começou). Se cair logo depois de subir, a espera da próxima subida dobra
// (até `SUBIDA_MAX_MS`), para não ficar oscilando. O quadro marcado com `ignorarProximo` (o salvamento) não conta.

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
/** Quadro que passa disto conta como travada; o p95 acima disto é "travando". */
export const PICO_P95_MS = 50;
/** Quadros bons seguidos para subir um nível, e o teto dessa espera depois de quedas logo após subir. */
export const SUBIDA_MS = 30_000;
export const SUBIDA_MAX_MS = 240_000;
/** Bom: média em ao menos 92% do alvo e p95 até 1,25 quadro do alvo. */
const FRACAO_BOA = 0.92;
const P95_BOM_QUADROS = 1.25;

export function nivelAcima(n: NivelQualidade, teto: NivelQualidade): NivelQualidade {
  return ORDEM[Math.min(ORDEM.indexOf(teto), ORDEM.indexOf(n) + 1)] ?? teto;
}

/** Monitor da qualidade automática: registra a duração dos quadros e decide quando descer (e voltar a subir). */
export class MonitorDeQualidade {
  private readonly duracoes = new Float64Array(QUADROS_NO_BUFFER);
  private cheios = 0;
  private proximo = 0;
  private ultimaVerificacaoMs: number | null = null;
  private abaixoSeguidas = 0;
  private boasDesdeMs: number | null = null;
  private esperaSubidaMs = SUBIDA_MS;
  private subiuEmMs: number | null = null;
  private ignorar = false;
  /** O nível com que a cena começou: a subida automática não passa dele. */
  teto: NivelQualidade;

  constructor(public nivel: NivelQualidade) {
    this.teto = nivel;
  }

  /** O próximo quadro não conta (um salvamento, uma troca de aba). */
  ignorarProximo(): void {
    this.ignorar = true;
  }

  /** Registra um quadro; devolve o novo nível quando a qualidade deve mudar, senão null. */
  registrar(duracaoMs: number, agoraMs: number, alvoFps = 60): NivelQualidade | null {
    if (this.ignorar) {
      this.ignorar = false;
      return null;
    }
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
    const lento = this.fpsMedio() < Math.min(FPS_MINIMO, alvoFps * 0.75);
    const travando = this.p95Ms() > Math.max(PICO_P95_MS, 1500 / alvoFps);
    this.abaixoSeguidas = lento || travando ? this.abaixoSeguidas + 1 : 0;
    if (this.abaixoSeguidas >= 2 && this.nivel !== 'minimo') return this.descer(agoraMs);
    const bom = this.fpsMedio() >= alvoFps * FRACAO_BOA && this.p95Ms() <= (P95_BOM_QUADROS * 1000) / alvoFps;
    if (!bom) {
      this.boasDesdeMs = null;
      return null;
    }
    this.boasDesdeMs ??= agoraMs;
    if (this.nivel === this.teto || agoraMs - this.boasDesdeMs < this.esperaSubidaMs) return null;
    this.nivel = nivelAcima(this.nivel, this.teto);
    this.boasDesdeMs = null;
    this.subiuEmMs = agoraMs;
    this.reiniciarBuffer();
    return this.nivel;
  }

  private descer(agoraMs: number): NivelQualidade {
    // Caiu logo depois de subir: a próxima subida espera o dobro.
    if (this.subiuEmMs !== null && agoraMs - this.subiuEmMs < SUBIDA_MS) this.esperaSubidaMs = Math.min(SUBIDA_MAX_MS, this.esperaSubidaMs * 2);
    this.subiuEmMs = null;
    this.abaixoSeguidas = 0;
    this.boasDesdeMs = null;
    this.nivel = nivelAbaixo(this.nivel);
    return this.nivel;
  }

  /** Depois de subir, o buffer recomeça (os quadros do nível anterior não dizem nada do novo). */
  private reiniciarBuffer(): void {
    this.cheios = 0;
    this.proximo = 0;
  }

  /** Percentil 95 da duração dos quadros no buffer (ms). */
  p95Ms(): number {
    if (this.cheios === 0) return 0;
    const ordenadas = Array.from(this.duracoes.subarray(0, this.cheios)).sort((a, b) => a - b);
    return ordenadas[Math.min(this.cheios - 1, Math.floor(this.cheios * 0.95))] ?? 0;
  }

  fpsMedio(): number {
    if (this.cheios === 0) return 0;
    let soma = 0;
    for (let i = 0; i < this.cheios; i++) soma += this.duracoes[i] ?? 0;
    return soma > 0 ? (1000 * this.cheios) / soma : 0;
  }
}
