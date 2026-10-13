// Preferências locais do jogador. Até o save em IndexedDB (marco 6), ficam no localStorage,
// sempre com falha silenciosa: aba privada ou armazenamento bloqueado não podem quebrar o jogo.

export type TipoControle = 'joystick' | 'dpad';
export type ModoCamera = 'janela' | 'centralizada';

export interface Preferencias {
  controle: TipoControle;
  camera: ModoCamera;
}

const CHAVE = 'dungeons-arena:preferencias';
const PADRAO: Preferencias = { controle: 'joystick', camera: 'janela' };

export function lerPreferencias(): Preferencias {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return { ...PADRAO };
    const dados = JSON.parse(bruto) as Partial<Preferencias>;
    return {
      controle: dados.controle === 'dpad' ? 'dpad' : 'joystick',
      camera: dados.camera === 'centralizada' ? 'centralizada' : 'janela',
    };
  } catch {
    return { ...PADRAO };
  }
}

export function gravarPreferencias(p: Preferencias): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p));
  } catch {
    // Armazenamento indisponível: a preferência vale só nesta sessão.
  }
}
