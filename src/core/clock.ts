// Relógio injetável (§5.1). O núcleo só conhece a interface; quem fornece a hora real é a
// plataforma (navegador ou servidor). Testes usam o relógio manual.
// Lembrete: gameplay mede tempo em ticks da simulação, nunca em relógio de parede (§2.7).

export interface Relogio {
  agoraMs(): number;
}

export class RelogioManual implements Relogio {
  private atualMs: number;

  constructor(inicioMs = 0) {
    this.atualMs = inicioMs;
  }

  agoraMs(): number {
    return this.atualMs;
  }

  avancar(ms: number): void {
    if (!Number.isFinite(ms) || ms < 0) throw new RangeError(`avanço inválido: ${ms}`);
    this.atualMs += ms;
  }
}
