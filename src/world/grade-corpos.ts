// Grade de corpos por célula (marco 26, 29/10/2026, D-122). A colisão do movimento contínuo perguntava, a cada subpasso
// e a cada bissecção, por TODAS as entidades; numa multidão em volta do jogador, isso crescia com o quadrado do número
// de corpos. A grade guarda quem está em cada célula (pela posição contínua arredondada) e devolve só os de perto.
// Os candidatos saem na ordem do vetor de entidades: o resultado é o mesmo da varredura completa (inclusive o
// desempate do mais perto), e a simulação continua determinística.

import type { Entidade } from '../entities/entidade';

const chave = (x: number, y: number) => x * 65536 + y;

export class GradeDeCorpos {
  private readonly celulas = new Map<number, Entidade[]>();
  private readonly ordem = new Map<Entidade, number>();
  private readonly onde = new Map<Entidade, number>();
  private readonly candidatos: Entidade[] = [];

  constructor(entidades: readonly Entidade[]) {
    entidades.forEach((e, i) => {
      this.ordem.set(e, i);
      this.inserir(e, chave(Math.round(e.px), Math.round(e.py)));
    });
  }

  private inserir(e: Entidade, k: number): void {
    const lista = this.celulas.get(k);
    if (lista) lista.push(e);
    else this.celulas.set(k, [e]);
    this.onde.set(e, k);
  }

  /** Depois que `e` andou: muda de célula na grade, se for o caso. */
  atualizar(e: Entidade): void {
    const k = chave(Math.round(e.px), Math.round(e.py));
    const antes = this.onde.get(e);
    if (antes === k) return;
    if (antes !== undefined) {
      const lista = this.celulas.get(antes);
      const i = lista?.indexOf(e) ?? -1;
      if (lista && i >= 0) lista.splice(i, 1);
    }
    this.inserir(e, k);
  }

  /**
   * Quem pode estar a menos de `raio` de (x, y), na ordem do vetor de entidades. O vetor devolvido é reaproveitado:
   * vale até a próxima consulta.
   */
  perto(x: number, y: number, raio: number): readonly Entidade[] {
    const c = this.candidatos;
    c.length = 0;
    for (let i = Math.round(x - raio); i <= Math.round(x + raio); i++) {
      for (let j = Math.round(y - raio); j <= Math.round(y + raio); j++) {
        const lista = this.celulas.get(chave(i, j));
        if (lista) for (const e of lista) c.push(e);
      }
    }
    if (c.length > 1) c.sort((a, b) => (this.ordem.get(a) ?? 0) - (this.ordem.get(b) ?? 0));
    return c;
  }
}
