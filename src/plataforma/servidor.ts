// Endereço do servidor da arena (marco 5), compartilhado pela arena online e pela pesquisa (marco 7A).
// Ordem: `?servidor=` na URL -> o servidor escolhido neste aparelho (marco 20, preferência) -> VITE_ARENA_URL do
// build -> ws://localhost:2567 quando o cliente está em localhost -> null (sem servidor configurado). Nenhum segredo:
// é só um endereço público.

import { ehAppNativo } from './nativo';
import { enderecoDeServidorValido, lerPreferencias } from './preferencias';

export function enderecoDoServidor(): string | null {
  const daUrl = new URLSearchParams(location.search).get('servidor');
  if (daUrl && enderecoDeServidorValido(daUrl)) return daUrl;
  const escolhido = lerPreferencias().servidor;
  if (escolhido) return escolhido;
  const doBuild = import.meta.env.VITE_ARENA_URL as string | undefined;
  if (doBuild) return doBuild;
  // No app Android a página também é servida em localhost, mas lá não há servidor.
  if (ehAppNativo()) return null;
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'ws://localhost:2567' : null;
}

/** ws(s):// -> http(s):// para as rotas HTTP do mesmo servidor. */
export function enderecoHttp(servidor: string): string {
  return servidor.replace(/^ws/, 'http');
}
