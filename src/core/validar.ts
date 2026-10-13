// Leitura validada de JSON de conteúdo (§3.9). Cada leitura registra o erro e devolve um valor
// neutro, para que uma única passada junte todos os problemas de um arquivo.

export type Objeto = Record<string, unknown>;

export function ehObjeto(v: unknown): v is Objeto {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export class Leitor {
  readonly erros: string[] = [];

  constructor(private readonly contexto: string) {}

  erro(mensagem: string): void {
    this.erros.push(`${this.contexto}: ${mensagem}`);
  }

  objeto(v: unknown, campo: string): Objeto {
    if (ehObjeto(v)) return v;
    this.erro(`${campo} precisa ser um objeto`);
    return {};
  }

  texto(o: Objeto, campo: string): string {
    const v = o[campo];
    if (typeof v === 'string' && v.trim() !== '') return v;
    this.erro(`${campo} precisa ser texto não vazio`);
    return '';
  }

  textoOuNulo(o: Objeto, campo: string): string | null {
    const v = o[campo];
    if (v === null || v === undefined) return null;
    if (typeof v === 'string') return v;
    this.erro(`${campo} precisa ser texto ou null`);
    return null;
  }

  numero(o: Objeto, campo: string, opcoes: { min?: number; max?: number; inteiro?: boolean } = {}): number {
    const v = o[campo];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      this.erro(`${campo} precisa ser número finito`);
      return 0;
    }
    if (opcoes.inteiro && !Number.isInteger(v)) this.erro(`${campo} precisa ser inteiro`);
    if (opcoes.min !== undefined && v < opcoes.min) this.erro(`${campo} precisa ser ≥ ${opcoes.min}`);
    if (opcoes.max !== undefined && v > opcoes.max) this.erro(`${campo} precisa ser ≤ ${opcoes.max}`);
    return v;
  }

  booleano(o: Objeto, campo: string): boolean {
    const v = o[campo];
    if (typeof v === 'boolean') return v;
    this.erro(`${campo} precisa ser booleano`);
    return false;
  }

  opcao<T extends string>(o: Objeto, campo: string, valores: readonly T[]): T {
    const v = o[campo];
    if (typeof v === 'string' && (valores as readonly string[]).includes(v)) return v as T;
    this.erro(`${campo} precisa ser um de: ${valores.join(', ')}`);
    return valores[0] as T;
  }

  lista(o: Objeto, campo: string): unknown[] {
    const v = o[campo];
    if (Array.isArray(v)) return v;
    this.erro(`${campo} precisa ser uma lista`);
    return [];
  }

  listaDeTextos(o: Objeto, campo: string): string[] {
    return this.lista(o, campo).filter((item): item is string => {
      if (typeof item === 'string') return true;
      this.erro(`${campo} só aceita textos`);
      return false;
    });
  }
}
