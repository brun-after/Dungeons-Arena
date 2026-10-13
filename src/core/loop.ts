// Passo fixo com acumulador e interpolação (§2.2).
// Este módulo não agenda nada: o navegador chama `avancarLaco` a cada quadro e o servidor
// usará um agendador monotônico próprio. Assim o mesmo cálculo serve aos dois.

/** Duração de um tick: 60 Hz. */
export const DT_MS = 1000 / 60;

/** Teto de tempo absorvido por quadro, para não entrar em espiral após uma pausa da aba. */
export const MAX_QUADRO_MS = 250;

const TOLERANCIA_MS = 1e-6;

export interface Acumulador {
  anteriorMs: number | null;
  acumuladoMs: number;
}

export interface ResultadoQuadro {
  /** Quantos ticks foram simulados neste quadro. */
  passos: number;
  /** Fração do próximo tick, em [0, 1), para interpolar a apresentação. */
  alpha: number;
}

export function criarAcumulador(): Acumulador {
  return { anteriorMs: null, acumuladoMs: 0 };
}

export function avancarLaco(
  acumulador: Acumulador,
  agoraMs: number,
  simular: (dtMs: number) => void,
): ResultadoQuadro {
  if (acumulador.anteriorMs === null) {
    acumulador.anteriorMs = agoraMs;
    return { passos: 0, alpha: 0 };
  }
  const decorrido = Math.max(0, agoraMs - acumulador.anteriorMs);
  acumulador.anteriorMs = agoraMs;
  acumulador.acumuladoMs += Math.min(decorrido, MAX_QUADRO_MS);

  let passos = 0;
  // A tolerância absorve o erro de ponto flutuante de somar 1000/60 várias vezes,
  // que faria um segundo de quadros render 59 ou 61 ticks.
  while (acumulador.acumuladoMs >= DT_MS - TOLERANCIA_MS) {
    simular(DT_MS);
    acumulador.acumuladoMs = Math.max(0, acumulador.acumuladoMs - DT_MS);
    passos++;
  }
  return { passos, alpha: acumulador.acumuladoMs / DT_MS };
}
