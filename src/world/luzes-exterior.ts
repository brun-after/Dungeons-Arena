// As luzes de reposição do exterior do Mundo (marco 42, 15/11/2026, D-176): postes de tocha ao longo das estradas,
// fora da vila, a cada `ESPACO_POSTES` células, e fogueiras na borda das matas fechadas e no abrigo das regiões sem
// vila. Sem sorteio: a posição sai só da grade (o resto da região não muda). Puro.

import type { Celula } from '../core/comandos';

const ESPACO_POSTES = 22;
const ANDA = new Set([',', '.', '=']);

export interface LuzDoExterior {
  tipo: 'luz';
  objeto: 'poste_tocha' | 'fogueira';
  x: number;
  y: number;
}

const chebyshev = (a: Celula, b: Celula) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/** A célula andável fora da estrada ao lado de `c` (o poste fica na beira, não no meio do caminho). */
function beira(em: (x: number, y: number) => string, c: Celula): Celula | null {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const ch = em(c.x + dx, c.y + dy);
    if (ANDA.has(ch) && ch !== '=') return { x: c.x + dx, y: c.y + dy };
  }
  return null;
}

/** A célula andável mais perto de `alvo`, procurando em anéis até `raioMax`. */
function andavelPerto(em: (x: number, y: number) => string, alvo: Celula, raioMax: number, ok: (c: Celula) => boolean = () => true): Celula | null {
  for (let r = 0; r <= raioMax; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const c = { x: alvo.x + dx, y: alvo.y + dy };
        if (ANDA.has(em(c.x, c.y)) && ok(c)) return c;
      }
    }
  }
  return null;
}

export function luzesDoExterior(
  em: (x: number, y: number) => string,
  n: number,
  regiao: { matas?: readonly { x: number; y: number; raio: number }[] },
  naVila: (c: Celula) => boolean,
  naPassagem: (c: Celula) => boolean,
  pracas: readonly Celula[],
  ocupadas: readonly Celula[],
): LuzDoExterior[] {
  const luzes: LuzDoExterior[] = [];
  const livre = (c: Celula) => !naPassagem(c) && !ocupadas.some((o) => chebyshev(o, c) < 2) && !luzes.some((l) => chebyshev(l, c) < 2);
  // As fogueiras primeiro: na borda de cada mata (do lado do centro da região) e no abrigo.
  for (const m of regiao.matas ?? []) {
    const ang = Math.atan2(n / 2 - m.y, n / 2 - m.x);
    const alvo = { x: Math.round(m.x + Math.cos(ang) * (m.raio + 2)), y: Math.round(m.y + Math.sin(ang) * (m.raio + 2)) };
    // Marco 43 (D-177): a busca já pula o que está ocupado (a mata mais cheia do relevo novo tapava o primeiro achado).
    const c = andavelPerto(em, alvo, 10, livre);
    if (c) luzes.push({ tipo: 'luz', objeto: 'fogueira', ...c });
  }
  for (const abrigo of pracas) {
    const c = andavelPerto(em, { x: abrigo.x + 4, y: abrigo.y + 3 }, 4, livre);
    // Marco 43 (D-177): na praça da vila, o poste de tocha (braseiro); a fogueira é do abrigo no ermo.
    if (c && livre(c)) luzes.push({ tipo: 'luz', objeto: naVila(c) ? 'poste_tocha' : 'fogueira', ...c });
  }
  // Os postes: varre as estradas em ordem e põe um a cada `ESPACO_POSTES` do último.
  const postes: Celula[] = [];
  for (let y = 1; y < n - 1; y++) {
    for (let x = 1; x < n - 1; x++) {
      if (em(x, y) !== '=' || naVila({ x, y }) || naPassagem({ x, y })) continue;
      if (postes.some((p) => chebyshev(p, { x, y }) < ESPACO_POSTES)) continue;
      const c = beira(em, { x, y });
      if (!c || !livre(c)) continue;
      postes.push({ x, y });
      luzes.push({ tipo: 'luz', objeto: 'poste_tocha', ...c });
    }
  }
  return luzes;
}
