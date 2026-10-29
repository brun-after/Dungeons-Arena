// Passo fixo com acumulador e interpolação (§2.2).
// Este módulo não agenda nada: o navegador chama `avancarLaco` a cada quadro e o servidor
// usará um agendador monotônico próprio. Assim o mesmo cálculo serve aos dois.

/** Duração de um tick: 60 Hz. */
export const DT_MS = 1000 / 60;

/** Teto de tempo absorvido por quadro, para não entrar em espiral após uma pausa da aba. */
export const MAX_QUADRO_MS = 250;

/**
 * Marco 26 (29/10/2026, D-122): orçamento de simulação num quadro da campanha solo. Com o tick caro (multidão no
 * celular), rodar até 15 ticks para alcançar o atraso deixava o quadro seguinte ainda mais lento (bola de neve): passado
 * o orçamento, o atraso é descartado e o jogo só fica um instante mais lento. Com o tick barato e o desenho lento (o CI
 * sem GPU), o atraso ainda é todo recuperado: um teto fixo de ticks deixava o jogo em câmera lenta. O grupo e a arena
 * seguem sem orçamento (acompanham o servidor).
 */
export const ORCAMENTO_SIM_SOLO_MS = 10;

/** O orçamento: quanto tempo os ticks deste quadro podem somar, medido pelo relógio dado. */
export interface OrcamentoDoQuadro {
  ms: number;
  relogio: () => number;
}

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
  orcamento?: OrcamentoDoQuadro,
): ResultadoQuadro {
  if (acumulador.anteriorMs === null) {
    acumulador.anteriorMs = agoraMs;
    return { passos: 0, alpha: 0 };
  }
  const decorrido = Math.max(0, agoraMs - acumulador.anteriorMs);
  acumulador.anteriorMs = agoraMs;
  acumulador.acumuladoMs += Math.min(decorrido, MAX_QUADRO_MS);

  let passos = 0;
  const inicio = orcamento?.relogio();
  // A tolerância absorve o erro de ponto flutuante de somar 1000/60 várias vezes,
  // que faria um segundo de quadros render 59 ou 61 ticks.
  while (acumulador.acumuladoMs >= DT_MS - TOLERANCIA_MS) {
    if (orcamento && inicio !== undefined && passos > 0 && orcamento.relogio() - inicio >= orcamento.ms) {
      // D-122: descarta o atraso, guardando só a fração do tick (a interpolação continua lisa).
      acumulador.acumuladoMs %= DT_MS;
      break;
    }
    simular(DT_MS);
    acumulador.acumuladoMs = Math.max(0, acumulador.acumuladoMs - DT_MS);
    passos++;
  }
  return { passos, alpha: acumulador.acumuladoMs / DT_MS };
}
