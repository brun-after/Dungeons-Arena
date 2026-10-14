// Preferências locais do jogador. Marco 6B (13/10/2026): passam do localStorage para o store
// `perfil` do IndexedDB (§3.5, fecha a D-015). A leitura é síncrona, de um cache carregado no
// início por `prepararPreferencias`. Sem IndexedDB, continuam no localStorage; sem nenhum dos
// dois, valem só nesta sessão. Falha de armazenamento nunca quebra o jogo.

import { gravarNoBanco, lerDoBanco } from './banco';

export type TipoControle = 'joystick' | 'dpad';
export type ModoCamera = 'janela' | 'centralizada';

export interface Preferencias {
  controle: TipoControle;
  camera: ModoCamera;
}

const CHAVE_LOCAL = 'dungeons-arena:preferencias';
const CHAVE_PERFIL = 'preferencias';
const PADRAO: Preferencias = { controle: 'joystick', camera: 'janela' };

let cache: Preferencias = { ...PADRAO };
let usarBanco = false;

export function normalizarPreferencias(dados: unknown): Preferencias {
  const d = typeof dados === 'object' && dados !== null ? (dados as Partial<Record<keyof Preferencias, unknown>>) : {};
  return {
    controle: d.controle === 'dpad' ? 'dpad' : 'joystick',
    camera: d.camera === 'centralizada' ? 'centralizada' : 'janela',
  };
}

function lerLocal(): Preferencias | null {
  try {
    const bruto = localStorage.getItem(CHAVE_LOCAL);
    return bruto ? normalizarPreferencias(JSON.parse(bruto)) : null;
  } catch {
    return null;
  }
}

/** Carrega o cache. Na primeira vez com IndexedDB, migra o que estava no localStorage. */
export async function prepararPreferencias(): Promise<void> {
  try {
    const registro = await lerDoBanco('perfil', CHAVE_PERFIL);
    usarBanco = true;
    if (registro !== undefined) {
      cache = normalizarPreferencias((registro as { valor?: unknown }).valor);
      return;
    }
    const antigas = lerLocal();
    if (antigas) {
      cache = antigas;
      await gravarNoBanco('perfil', { chave: CHAVE_PERFIL, valor: antigas });
      try {
        localStorage.removeItem(CHAVE_LOCAL);
      } catch {
        // Sem localStorage: nada a limpar.
      }
    }
  } catch {
    usarBanco = false;
    cache = lerLocal() ?? { ...PADRAO };
  }
}

export function lerPreferencias(): Preferencias {
  return { ...cache };
}

export function gravarPreferencias(p: Preferencias): void {
  cache = { ...p };
  if (usarBanco) {
    gravarNoBanco('perfil', { chave: CHAVE_PERFIL, valor: cache }).catch(() => {
      // Falhou: a preferência vale só nesta sessão.
    });
    return;
  }
  try {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(p));
  } catch {
    // Armazenamento indisponível: a preferência vale só nesta sessão.
  }
}
