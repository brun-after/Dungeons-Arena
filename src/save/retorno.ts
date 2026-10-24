// Retorno e revisita (17/10/2026): mantém as referências exatas e suporta saves anteriores.
import type { Celula } from '../core/comandos';
import type { EstadoJogo } from '../core/estado';
import { reservaCelula } from '../world/colisao';
import { chaveDaFase, type RefFase } from './esquema';
import { faseSeguinte } from './fases-campanha';
import { passavel, type Fase } from '../world/fase';

export function temRetorno(ref: RefFase): boolean {
  return ref.tipo === 'aventura' ? (ref.indice ?? 0) > 0 : ref.tipo === 'gerada' || ref.id !== 'fase-01';
}
export function comRetorno(fase: Fase, ref: RefFase): Fase {
  const spawn = fase.spawns[0];
  return temRetorno(ref) && spawn ? { ...fase, portaRetorno: { ...spawn } } : fase;
}
export function faseAnterior(ref: RefFase, conhecidas: Readonly<Record<string, RefFase>> = {}): RefFase | null {
  if (!temRetorno(ref)) return null;
  if (ref.tipo === 'aventura') return { tipo: 'aventura', id: ref.id, indice: (ref.indice ?? 0) - 1 };
  if (ref.tipo === 'oficial') return { tipo: 'oficial', id: 'fase-01' };
  if (ref.numero === 1) return { tipo: 'oficial', id: 'fase-02' };
  const guardada = conhecidas[`gerada:gerada-${ref.numero - 1}`];
  if (guardada) return guardada;
  if (ref.numero > 10000) return null;
  // Saves antigos: sequência determinística legada; não inventa dimensões/estilo novos.
  let anterior: RefFase = { tipo: 'oficial', id: 'fase-02' };
  for (let n = 1; n < ref.numero; n++) {
    const proxima = faseSeguinte(anterior);
    if (!proxima || proxima.tipo !== 'gerada') return null;
    if (!ref.params.ambientesVivos) {
      delete proxima.params.ambientesVivos;
      delete proxima.params.formato;
      proxima.params.eventos = (proxima.params.eventos ?? []).filter((id) => id !== 'enxame');
      proxima.params.largura = 60;
      proxima.params.altura = 40;
    }
    if (ref.params.estilo) proxima.params.estilo = [...ref.params.estilo];
    // Marco 23 (D-092): saves de antes dos temas reconstroem a fase sem tema.
    if (!ref.params.tema) delete proxima.params.tema;
    anterior = proxima;
  }
  return anterior;
}
export function referenciaConhecida(ref: RefFase, conhecidas: Readonly<Record<string, RefFase>> = {}): RefFase {
  return conhecidas[chaveDaFase(ref)] ?? ref;
}
/** Chega junto à porta de destino, sem ocupar a porta (evita transição automática no grupo). */
export function chegadaNaFase(fase: Fase, retorno: boolean, estado?: EstadoJogo): Celula {
  const origem = retorno ? fase.portaSaida ?? fase.spawns[0] : fase.spawns[0];
  if (!origem) return { x: 1, y: 1 };
  const fila: Celula[] = [origem];
  const vistas = new Set<string>([`${origem.x},${origem.y}`]);
  for (let i = 0; i < fila.length; i++) {
    const atual = fila[i]; if (!atual) break;
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]] as const) {
      const c = { x: atual.x + dx, y: atual.y + dy }, chave = `${c.x},${c.y}`;
      if (vistas.has(chave) || !passavel(fase, c.x, c.y) || Math.max(Math.abs(c.x - origem.x), Math.abs(c.y - origem.y)) > 5) continue;
      vistas.add(chave);
      const porta = c.x === fase.portaSaida?.x && c.y === fase.portaSaida.y || c.x === fase.portaRetorno?.x && c.y === fase.portaRetorno.y;
      if (!porta && !estado?.entidades.some((e) => !e.morto && reservaCelula(e, c.x, c.y))) return c;
      fila.push(c);
    }
  }
  return origem;
}
