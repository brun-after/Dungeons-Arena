// Aviso de conexão instável (§3.6, perfil degradado: "preservar integridade ... com aviso").
// Marco 7B (13/10/2026). Puro: decide quando avisar, sem tocar na interface. Avisa uma vez quando a
// conexão fica ruim por algum tempo e só volta a avisar depois de um período bom (sem repetir aviso).

/** RTT acima do perfil suportado (150 ms) e da faixa "média" do indicador: perfil degradado. */
export const RTT_INSTAVEL_MS = 250;
export const ESPERA_PARA_AVISAR_MS = 3000;
export const ESPERA_PARA_REARMAR_MS = 5000;

export class MonitorDeConexao {
  private ruimDesde: number | null = null;
  private boaDesde: number | null = null;
  private avisado = false;

  /** Devolve true no quadro em que o aviso deve aparecer. */
  atualizar(agoraMs: number, rttMs: number, conectado: boolean): boolean {
    const ruim = !conectado || rttMs > RTT_INSTAVEL_MS;
    if (ruim) {
      this.boaDesde = null;
      this.ruimDesde ??= agoraMs;
      if (!this.avisado && agoraMs - this.ruimDesde >= ESPERA_PARA_AVISAR_MS) {
        this.avisado = true;
        return true;
      }
      return false;
    }
    this.ruimDesde = null;
    this.boaDesde ??= agoraMs;
    if (this.avisado && agoraMs - this.boaDesde >= ESPERA_PARA_REARMAR_MS) this.avisado = false;
    return false;
  }
}
