// Imagem do personagem guardada neste aparelho (D-055, D-058). Marco 13 (14/10/2026).
// Fica no store `perfil` do IndexedDB, como o arquivo original (Blob); só o seu personagem usa e nada vai
// para a rede. Sem IndexedDB, vale só nesta sessão (fica em memória).

import { apagarDoBanco, gravarNoBanco, lerDoBanco } from './banco';

const CHAVE = 'token';
let emMemoria: Blob | null = null;
let ouvintes: (() => void)[] = [];

export async function lerImagemToken(): Promise<Blob | null> {
  try {
    const registro = (await lerDoBanco('perfil', CHAVE)) as { arquivo?: unknown } | undefined;
    return registro?.arquivo instanceof Blob ? registro.arquivo : emMemoria;
  } catch {
    return emMemoria;
  }
}

export async function gravarImagemToken(arquivo: Blob): Promise<void> {
  emMemoria = arquivo;
  try {
    await gravarNoBanco('perfil', { chave: CHAVE, arquivo });
  } catch {
    // Sem IndexedDB: vale só nesta sessão.
  }
  avisar();
}

export async function apagarImagemToken(): Promise<void> {
  emMemoria = null;
  try {
    await apagarDoBanco('perfil', CHAVE);
  } catch {
    // Nada gravado.
  }
  avisar();
}

/** A cena recarrega o token quando a imagem muda nas Configurações. */
export function aoMudarImagemToken(fn: () => void): () => void {
  ouvintes.push(fn);
  return () => {
    ouvintes = ouvintes.filter((o) => o !== fn);
  };
}

function avisar(): void {
  for (const fn of ouvintes) fn();
}
