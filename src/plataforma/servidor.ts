// Endereço do servidor da arena (marco 5), compartilhado pela arena online e pela pesquisa (marco 7A).
// Ordem: `?servidor=` na URL -> VITE_ARENA_URL do build -> ws://localhost:2567 quando o cliente está
// em localhost -> null (sem servidor configurado). Nenhum segredo: é só um endereço público.

export function enderecoDoServidor(): string | null {
  const daUrl = new URLSearchParams(location.search).get('servidor');
  if (daUrl && /^wss?:\/\/[\w.-]+(:\d+)?$/.test(daUrl)) return daUrl;
  const doBuild = import.meta.env.VITE_ARENA_URL as string | undefined;
  if (doBuild) return doBuild;
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'ws://localhost:2567' : null;
}

/** ws(s):// -> http(s):// para as rotas HTTP do mesmo servidor. */
export function enderecoHttp(servidor: string): string {
  return servidor.replace(/^ws/, 'http');
}
