// Desfazer e refazer por traço (§3.10, §4.13). Marco 6C (13/10/2026). Um traço é tudo o que um
// gesto alterou; cancelar o traço em andamento (segundo dedo) desfaz e não deixa meio-traço.

import { escreverCelula, type Alteracao, type FaseEditavel } from './grade';

export const LIMITE_HISTORICO = 120;

export class Historico {
  private desfazer: Alteracao[][] = [];
  private refazer: Alteracao[][] = [];
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
    this.desfazer.push(traco);
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

  desfazerUm(f: FaseEditavel): Alteracao[] {
    const traco = this.desfazer.pop();
    if (!traco) return [];
    for (const a of [...traco].reverse()) escreverCelula(f, a.x, a.y, a.antes);
    this.refazer.push(traco);
    return traco;
  }

  refazerUm(f: FaseEditavel): Alteracao[] {
    const traco = this.refazer.pop();
    if (!traco) return [];
    for (const a of traco) escreverCelula(f, a.x, a.y, a.depois);
    this.desfazer.push(traco);
    return traco;
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
