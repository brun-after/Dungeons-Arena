// Limites de disparo de som (§2.14). Marco 12 (14/10/2026), D-056. Puro e testável:
//   - o mesmo som no máximo a cada 80 ms;
//   - no máximo 4 vozes simultâneas do mesmo som;
//   - passos: 450 ms por entidade e 140 ms no total (~7 passos/s no grupo inteiro);
//   - variação de tom sorteada em ±8%, para o mesmo som não soar repetido.

export const INTERVALO_MESMO_SOM_MS = 80;
export const VOZES_POR_SOM = 4;
export const PASSO_POR_ENTIDADE_MS = 450;
export const PASSO_GLOBAL_MS = 140;

export class LimitadorDeSom {
  private readonly ultimo = new Map<string, number>();
  /** Fim previsto de cada voz tocando, por som. */
  private readonly vozes = new Map<string, number[]>();
  private readonly passosPorEntidade = new Map<string, number>();
  private ultimoPassoGlobal = -Infinity;

  /** O som pode tocar agora? Se sim, reserva uma voz até `agoraMs + duracaoMs`. */
  permitir(som: string, agoraMs: number, duracaoMs: number): boolean {
    if (agoraMs - (this.ultimo.get(som) ?? -Infinity) < INTERVALO_MESMO_SOM_MS) return false;
    const ativas = (this.vozes.get(som) ?? []).filter((fim) => fim > agoraMs);
    if (ativas.length >= VOZES_POR_SOM) {
      this.vozes.set(som, ativas);
      return false;
    }
    ativas.push(agoraMs + duracaoMs);
    this.vozes.set(som, ativas);
    this.ultimo.set(som, agoraMs);
    return true;
  }

  /** Passo de uma entidade: respeita o intervalo dela e o global. */
  permitirPasso(entidadeId: string, agoraMs: number): boolean {
    if (agoraMs - this.ultimoPassoGlobal < PASSO_GLOBAL_MS) return false;
    if (agoraMs - (this.passosPorEntidade.get(entidadeId) ?? -Infinity) < PASSO_POR_ENTIDADE_MS) return false;
    this.ultimoPassoGlobal = agoraMs;
    this.passosPorEntidade.set(entidadeId, agoraMs);
    return true;
  }
}

/** Fator de tom em [0,92; 1,08) a partir de um número em [0, 1). */
export function variacaoDeTom(u: number): number {
  return 0.92 + u * 0.16;
}
