import manifesto from '../../public/audio/manifesto.json';
import type { SomId } from './mapeamento';
import type { Clima } from './contexto-musical';
import { hashTexto } from '../core/rng';

export type SomAmbiente = 'fogo' | 'agua' | 'vento' | 'goteira';
export interface Gravacao {
  arquivo: string;
  duracao: number;
  tipo: string;
  fonte: string;
}
export const GRAVACOES: Readonly<Record<string, Gravacao>> = manifesto.arquivos;
export const EFEITOS: Readonly<Record<SomId, readonly string[]>> = manifesto.efeitos;
export const AMBIENTES: Readonly<Record<SomAmbiente, string>> = manifesto.ambientes;
const MUSICAS: Readonly<Record<Clima, readonly string[]>> = manifesto.musicas;

/** Escolhe gravações completas por clima; não altera o timbre das músicas prontas. */
export function musicaDaCena(faseId: string, clima: Clima, sombra: number, variante: number): string {
  const lista = MUSICAS[clima];
  if (clima === 'exploracao' && sombra >= 0.65) return 'musica-caverna';
  const opcoes = clima === 'exploracao' ? lista.slice(0, 2) : lista;
  return opcoes[(hashTexto(faseId) + Math.max(0, Math.floor(variante))) % opcoes.length] ?? 'musica-caverna';
}

export function urlDaGravacao(id: string): string {
  const gravacao = GRAVACOES[id];
  if (!gravacao) throw new Error(`Gravação desconhecida: ${id}`);
  return `${import.meta.env.BASE_URL}audio/${gravacao.arquivo}`;
}

/** Decodifica uma vez; compartilha downloads concorrentes e limita o cache musical a duas faixas. */
export class BancoDeGravacoes {
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly pendentes = new Map<string, Promise<AudioBuffer>>();
  private readonly abortar = new AbortController();

  constructor(private readonly ctx: BaseAudioContext) {}

  pronto(id: string): AudioBuffer | undefined {
    return this.buffers.get(id);
  }

  carregar(id: string): Promise<AudioBuffer> {
    const pronto = this.buffers.get(id);
    if (pronto) return Promise.resolve(pronto);
    const pendente = this.pendentes.get(id);
    if (pendente) return pendente;
    const tarefa = this.baixar(id);
    this.pendentes.set(id, tarefa);
    return tarefa;
  }

  private async baixar(id: string): Promise<AudioBuffer> {
    try {
      const resposta = await fetch(urlDaGravacao(id), { signal: this.abortar.signal });
      if (!resposta.ok) throw new Error(`Áudio indisponível: ${resposta.status}`);
      const buffer = await this.ctx.decodeAudioData(await resposta.arrayBuffer());
      if (this.abortar.signal.aborted) throw new Error('Banco encerrado');
      this.buffers.set(id, buffer);
      if (GRAVACOES[id]?.tipo === 'musica') {
        const musicas = [...this.buffers.keys()].filter((chave) => GRAVACOES[chave]?.tipo === 'musica');
        for (const chave of musicas.slice(0, -2)) this.buffers.delete(chave);
      }
      return buffer;
    } finally {
      this.pendentes.delete(id);
    }
  }

  async prepararEfeitos(): Promise<void> {
    const fila = [...new Set(Object.values(EFEITOS).flat())];
    await Promise.all(Array.from({ length: 4 }, async () => {
      let id: string | undefined;
      while ((id = fila.shift()) !== undefined && !this.abortar.signal.aborted) {
        try { await this.carregar(id); } catch { /* Uma gravação ausente não impede as demais. */ }
      }
    }));
  }

  destruir(): void {
    this.abortar.abort();
    this.buffers.clear();
    this.pendentes.clear();
  }
}
