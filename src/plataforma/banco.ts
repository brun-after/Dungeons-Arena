// IndexedDB do jogo (§3.5). Marco 6B (13/10/2026). Sem biblioteca: um banco, os cinco domínios da
// spec e quatro operações em promessa. Gravação sempre fora do tick e sem bloquear a interface.
// Sem IndexedDB (aba privada antiga, armazenamento bloqueado), as operações rejeitam e quem chama
// decide o que fazer; o jogo continua jogável sem salvar.

export const NOME_BANCO = 'dungeons-arena';
const VERSAO_BANCO = 1;

export type Store = 'progresso' | 'aventuras' | 'tilesets' | 'perfil' | 'arena';

/** Chave de cada store. `progresso` por slot; `perfil` e `arena` por nome de registro. */
const CHAVES: Readonly<Record<Store, string>> = {
  progresso: 'slot',
  aventuras: 'id',
  tilesets: 'id',
  perfil: 'chave',
  arena: 'chave',
};

let aberto: Promise<IDBDatabase> | null = null;

function promessa<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolver, rejeitar) => {
    req.onsuccess = () => {
      resolver(req.result);
    };
    req.onerror = () => {
      rejeitar(req.error ?? new Error('erro no IndexedDB'));
    };
  });
}

export function abrirBanco(): Promise<IDBDatabase> {
  aberto ??= new Promise<IDBDatabase>((resolver, rejeitar) => {
    if (typeof indexedDB === 'undefined') {
      rejeitar(new Error('IndexedDB indisponível'));
      return;
    }
    const req = indexedDB.open(NOME_BANCO, VERSAO_BANCO);
    // Migração do banco: cria o que faltar, sem apagar dados de versões anteriores (§3.5).
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [store, chave] of Object.entries(CHAVES)) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: chave });
      }
    };
    req.onsuccess = () => {
      resolver(req.result);
    };
    req.onerror = () => {
      rejeitar(req.error ?? new Error('não foi possível abrir o IndexedDB'));
    };
    req.onblocked = () => {
      rejeitar(new Error('IndexedDB bloqueado por outra aba'));
    };
  }).catch((erro: unknown) => {
    aberto = null;
    throw erro;
  });
  return aberto;
}

async function operar<T>(store: Store, modo: IDBTransactionMode, fazer: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrirBanco();
  return promessa(fazer(db.transaction(store, modo).objectStore(store)));
}

export function lerDoBanco(store: Store, chave: IDBValidKey): Promise<unknown> {
  return operar<unknown>(store, 'readonly', (s) => s.get(chave));
}

export function listarDoBanco(store: Store): Promise<unknown[]> {
  return operar<unknown[]>(store, 'readonly', (s) => s.getAll());
}

export async function gravarNoBanco(store: Store, valor: object): Promise<void> {
  await operar(store, 'readwrite', (s) => s.put(valor));
}

export async function apagarDoBanco(store: Store, chave: IDBValidKey): Promise<void> {
  await operar(store, 'readwrite', (s) => s.delete(chave));
}

/** Só para testes: esquece a conexão aberta. */
export function esquecerConexao(): void {
  aberto = null;
}
