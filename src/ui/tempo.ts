// Durações para a interface (marco 18, 17/10/2026): o estudo de habilidades fala em minutos e horas; o HUD, em
// relógio (m:ss ou h:mm:ss). Puro, sem DOM.

/** "1 h 05 min", "42 min" ou "35 s" (minutos arredondados para cima, como quem espera conta). */
export function duracaoLegivel(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s} s`;
  const min = Math.ceil(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const resto = min % 60;
  return resto === 0 ? `${h} h` : `${h} h ${String(resto).padStart(2, '0')} min`;
}

/** Relógio: "4:07" ou "1:02:30". */
export function relogio(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
