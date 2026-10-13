// Digest do estado (§5.1): serialização canônica (chaves ordenadas, entidades por id) e hash.
// Duas execuções com a mesma semente e os mesmos comandos precisam produzir o mesmo digest;
// na arena, servirá para comparar estado público no mesmo tick/revisão (§5.6).

import type { EstadoJogo } from './estado';

type Valor = null | boolean | number | string | readonly Valor[] | { readonly [k: string]: Valor };

export function serializarCanonico(valor: unknown): string {
  return JSON.stringify(ordenar(valor));
}

function ordenar(valor: unknown): Valor {
  if (valor === null || typeof valor === 'boolean' || typeof valor === 'string') return valor;
  if (typeof valor === 'number') return valor;
  if (Array.isArray(valor)) return valor.map(ordenar);
  if (typeof valor === 'object') {
    const saida: Record<string, Valor> = {};
    for (const chave of Object.keys(valor).sort()) {
      saida[chave] = ordenar((valor as Record<string, unknown>)[chave]);
    }
    return saida;
  }
  throw new TypeError(`valor não serializável no estado: ${typeof valor}`);
}

/** Hash de 53 bits (cyrb53) em hexadecimal. */
export function hash53(texto: string, semente = 0): string {
  let h1 = 0xdeadbeef ^ semente;
  let h2 = 0x41c6ce57 ^ semente;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

export function digest(estado: EstadoJogo): string {
  const entidades = [...estado.entidades].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return hash53(serializarCanonico({ ...estado, entidades }));
}
