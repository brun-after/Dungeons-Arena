/** Uma consulta de cada vez: atraso de rede não pode virar uma fila de snapshots completos. */
export class ConsultaParty {
  private enviadaEm: number | null = null;

  podeConsultar(agora: number): boolean {
    if (this.enviadaEm !== null && agora - this.enviadaEm < 2000) return false;
    this.enviadaEm = agora;
    return true;
  }

  concluir(): void { this.enviadaEm = null; }
}
