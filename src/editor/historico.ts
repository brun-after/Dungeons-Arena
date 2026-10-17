// Desfazer e refazer por traço (§3.10, §4.13). Marco 6C (13/10/2026). Um traço é tudo o que um
// gesto alterou; cancelar o traço em andamento (segundo dedo) desfaz e não deixa meio-traço.
// Marco 11A (16/10/2026): além das células, entradas de "fase" com o retrato de antes e depois (redimensionar,
// portas, tranca, matiz, tileset), que trocam a fase inteira.

import { substituirFase } from './ferramentas';
import { clonarFaseEditavel, escreverCelula, type Alteracao, type FaseEditavel } from './grade';

export const LIMITE_HISTORICO = 120;

export type EntradaHistorico = { t: 'celulas'; alteracoes: Alteracao[] } | { t: 'fase'; antes: FaseEditavel; depois: FaseEditavel };

/** O que mudou ao desfazer ou refazer: as células (redesenho local) ou a fase inteira (reconstruir). */
export type Efeito = { t: 'celulas'; alteracoes: Alteracao[] } | { t: 'fase' } | { t: 'nada' };

export class Historico {
  private desfazer: EntradaHistorico[] = [];
  private refazer: EntradaHistorico[] = [];
  private traco: Alteracao[] | null = null;

  constructor(private readonly limite = LIMITE_HISTORICO) {}

  iniciarTraco(): void {
    this.traco = [];
  }

  registrar(alteracoes: readonly Alteracao[]): void {
    this.traco?.push(...alteracoes);
  }

  /** Fecha o traço; traço vazio não entra no histórico. */
  concluirTraco(): void {
    const traco = this.traco;
    this.traco = null;
    if (!traco || traco.length === 0) return;
    this.empilhar({ t: 'celulas', alteracoes: traco });
  }

  /** Uma mudança de metadados ou de tamanho: os retratos de antes e depois (clonados aqui). */
  registrarFase(antes: FaseEditavel, depois: FaseEditavel): void {
    this.empilhar({ t: 'fase', antes: clonarFaseEditavel(antes), depois: clonarFaseEditavel(depois) });
  }

  private empilhar(e: EntradaHistorico): void {
    this.desfazer.push(e);
    if (this.desfazer.length > this.limite) this.desfazer.shift();
    this.refazer = [];
  }

  /** Desfaz o traço em andamento, sem registrá-lo. Devolve as células tocadas. */
  cancelarTraco(f: FaseEditavel): Alteracao[] {
    const traco = this.traco ?? [];
    this.traco = null;
    for (const a of [...traco].reverse()) escreverCelula(f, a.x, a.y, a.antes);
    return traco;
  }

  desfazerUm(f: FaseEditavel): Efeito {
    const e = this.desfazer.pop();
    if (!e) return { t: 'nada' };
    this.refazer.push(e);
    if (e.t === 'fase') {
      substituirFase(f, e.antes);
      return { t: 'fase' };
    }
    for (const a of [...e.alteracoes].reverse()) escreverCelula(f, a.x, a.y, a.antes);
    return { t: 'celulas', alteracoes: e.alteracoes.map((a) => ({ ...a, antes: a.depois, depois: a.antes })) };
  }

  refazerUm(f: FaseEditavel): Efeito {
    const e = this.refazer.pop();
    if (!e) return { t: 'nada' };
    this.desfazer.push(e);
    if (e.t === 'fase') {
      substituirFase(f, e.depois);
      return { t: 'fase' };
    }
    for (const a of e.alteracoes) escreverCelula(f, a.x, a.y, a.depois);
    return { t: 'celulas', alteracoes: e.alteracoes };
  }

  podeDesfazer(): boolean {
    return this.desfazer.length > 0;
  }

  podeRefazer(): boolean {
    return this.refazer.length > 0;
  }

  emTraco(): boolean {
    return this.traco !== null;
  }
}
