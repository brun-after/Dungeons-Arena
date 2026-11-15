// O dia e a noite do Mundo (marco 42, 15/11/2026, D-176). A hora sai do relógio de parede, como os eventos de região
// (mundo/eventos-mundo.ts): igual no servidor e no cliente, em todo canal e todo processo, sem estado guardado. O ciclo
// passa por amanhecer, dia, entardecer e noite; `noite` vai de 0 (dia claro) a 1 (noite fechada), subindo no
// entardecer e descendo no amanhecer. O escuro do lugar é o maior entre a noite, o escuro próprio da região (a
// floresta densa, sempre escura) e o interior (caverna, masmorra). Tudo o que muda à noite lê esse número. Puro.

export type FaseDoDia = 'amanhecer' | 'dia' | 'entardecer' | 'noite';
export const FASES_DO_DIA: readonly FaseDoDia[] = ['amanhecer', 'dia', 'entardecer', 'noite'];

/** A cor do escuro (#rrggbb) e quanto escurece fora da luz (0 a 1). */
export interface QuadroDeLuz {
  ambiente: string;
  nivel: number;
}

export interface RegrasDoCiclo {
  /** A duração de cada fase, em minutos (o ciclo é a soma, na ordem de `FASES_DO_DIA`). */
  minutos: Record<FaseDoDia, number>;
  /** O escuro no meio de cada fase; entre elas, interpola. */
  quadros: Record<FaseDoDia, QuadroDeLuz>;
  /**
   * Marco 43 (15/11/2026, D-177): o mínimo de luz fora das luzes na noite fechada (o `realceMinimo` das masmorras é
   * alto demais para o céu aberto: a noite ficava clara e a tocha, inútil). Entre o dia e a noite, interpola.
   */
  realceNoite: number;
}

export interface HoraDoMundo {
  fase: FaseDoDia;
  /** 0 a 1 dentro da fase. */
  progresso: number;
  /** Hora (ms) em que a fase acaba. */
  fim: number;
  /** 0 = dia claro; 1 = noite fechada. */
  noite: number;
}

const MINUTO = 60_000;

/** A hora do mundo agora. */
export function horaDoMundo(agoraMs: number, r: RegrasDoCiclo): HoraDoMundo {
  const duracoes = FASES_DO_DIA.map((f) => Math.max(0, r.minutos[f]) * MINUTO);
  const ciclo = duracoes.reduce((a, b) => a + b, 0);
  if (ciclo <= 0) return { fase: 'dia', progresso: 0, fim: Number.MAX_SAFE_INTEGER, noite: 0 };
  const inicioCiclo = Math.floor(agoraMs / ciclo) * ciclo;
  let t = agoraMs - inicioCiclo;
  let inicio = inicioCiclo;
  for (let i = 0; i < FASES_DO_DIA.length; i++) {
    const d = duracoes[i] ?? 0;
    const fase = FASES_DO_DIA[i] ?? 'dia';
    if (t < d) {
      const progresso = d > 0 ? t / d : 0;
      return { fase, progresso, fim: inicio + d, noite: noiteDa(fase, progresso) };
    }
    t -= d;
    inicio += d;
  }
  return { fase: 'dia', progresso: 0, fim: inicioCiclo + ciclo, noite: 0 };
}

function noiteDa(fase: FaseDoDia, progresso: number): number {
  if (fase === 'noite') return 1;
  if (fase === 'entardecer') return progresso;
  if (fase === 'amanhecer') return 1 - progresso;
  return 0;
}

/** O escuro do lugar (0 a 1): o maior entre a noite, o escuro próprio da região e o interior. */
export function escuroDoLugar(hora: HoraDoMundo, escuroBase: number, interior: boolean): number {
  return Math.max(0, Math.min(1, Math.max(hora.noite, escuroBase, interior ? 1 : 0)));
}

const canais = (v: number): [number, number, number] => [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
const hexParaNumero = (hex: string): number => Number.parseInt(hex.slice(1), 16) || 0;

function misturar(a: { ambiente: number; nivel: number }, b: { ambiente: number; nivel: number }, t: number): { ambiente: number; nivel: number } {
  const [ar, ag, ab] = canais(a.ambiente);
  const [br, bg, bb] = canais(b.ambiente);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return { ambiente: (m(ar, br) << 16) | (m(ag, bg) << 8) | m(ab, bb), nivel: a.nivel + (b.nivel - a.nivel) * t };
}

const quadro = (q: QuadroDeLuz) => ({ ambiente: hexParaNumero(q.ambiente), nivel: q.nivel });

/**
 * O escuro da tela na hora. Marco 44 (15/11/2026, D-178): o dia e a noite ficam inteiros no seu quadro (antes a noite
 * só chegava ao breu no meio dela, misturada metade a metade com o entardecer e o amanhecer); a passagem acontece no
 * entardecer e no amanhecer, do quadro anterior ao dela e dele ao seguinte. Um lugar sempre escuro (`escuroBase`, a
 * floresta densa) puxa para o quadro da noite na mesma medida.
 */
export function luzDaHora(hora: HoraDoMundo, r: RegrasDoCiclo, escuroBase = 0): { ambiente: number; nivel: number } {
  const i = FASES_DO_DIA.indexOf(hora.fase);
  const n = FASES_DO_DIA.length;
  const antes = FASES_DO_DIA[(i + n - 1) % n] ?? hora.fase;
  const depois = FASES_DO_DIA[(i + 1) % n] ?? hora.fase;
  const meu = quadro(r.quadros[hora.fase]);
  const t = hora.progresso;
  const passagem = hora.fase === 'amanhecer' || hora.fase === 'entardecer';
  const base = !passagem ? meu : t < 0.5 ? misturar(quadro(r.quadros[antes]), meu, t * 2) : misturar(meu, quadro(r.quadros[depois]), (t - 0.5) * 2);
  const b = Math.max(0, Math.min(1, escuroBase));
  if (b <= hora.noite) return base;
  return misturar(base, quadro(r.quadros.noite), (b - hora.noite) / Math.max(0.0001, 1 - hora.noite));
}

/** Marco 42 (D-176): o escuro próprio no ponto: o da região e o das matas fechadas (borda macia de `borda` células). */
export function escuroBaseEm(fase: { escuroBase?: number; matas?: readonly { x: number; y: number; raio: number }[] }, x: number, y: number, borda = 4): number {
  let v = fase.escuroBase ?? 0;
  for (const m of fase.matas ?? []) {
    const fora = Math.hypot(x - m.x, y - m.y) - m.raio;
    v = Math.max(v, fora <= 0 ? 1 : Math.max(0, 1 - fora / borda));
  }
  return Math.min(1, v);
}
