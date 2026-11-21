// Ferramenta de calibração (21/11/2026): só os covis do Mundo, para ajustar sem rodar o simulador inteiro.
import { tempoDosCovis } from './mundo';

const sementes = Array.from({ length: 4 }, (_, i) => 1000 + i * 7919);
for (const c of tempoDosCovis(sementes, 3)) console.log(`${c.covil}: ${c.tempoS} s (${c.vitoriasPct}%)`);
