// A hora do Mundo no cliente (marco 42, 15/11/2026, D-176): o relógio de parede, como no servidor (mundo/ciclo.ts).
// Para ver a noite sem esperar, `?hora=N` desloca N minutos (só no desenho deste aparelho; no servidor, a variável de
// ambiente MUNDO_HORA_MIN faz o mesmo para as regras).

let deslocamentoMs: number | null = null;

function deslocamento(): number {
  if (deslocamentoMs !== null) return deslocamentoMs;
  let min: number;
  try {
    min = Number(new URLSearchParams(globalThis.location.search).get('hora') ?? 0) || 0;
  } catch {
    min = 0;
  }
  deslocamentoMs = min * 60_000;
  return deslocamentoMs;
}

/** O agora do Mundo (ms). */
export function agoraDoMundo(): number {
  return Date.now() + deslocamento();
}
