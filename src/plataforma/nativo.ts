// App Android (marco 20, 21/10/2026, D-087): o que muda quando o cliente roda dentro do Capacitor. A ponte nativa
// injeta `window.Capacitor` antes dos scripts da página, então a detecção é síncrona e não carrega nada; os plugins
// vêm sob demanda, só no app (o build web não paga por eles).

interface PonteCapacitor {
  isNativePlatform?: () => boolean;
}

/** Roda dentro do app Android (Capacitor)? */
export function ehAppNativo(): boolean {
  const ponte = (globalThis as { Capacitor?: PonteCapacitor }).Capacitor;
  return ponte?.isNativePlatform?.() === true;
}

/** O modal aberto por cima de tudo (o último), se houver. */
function modalAberto(): HTMLDialogElement | null {
  const abertos = [...document.querySelectorAll<HTMLDialogElement>('dialog.modal[open]')];
  return abertos.at(-1) ?? null;
}

/** Botão de pausa da partida em andamento (só existe dentro de uma cena). */
function botaoDePausa(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>('.botao-pausa');
}

/**
 * Liga os eventos do app: o voltar do Android fecha o modal aberto, pausa a partida ou volta uma página; ao ir para o
 * segundo plano, a partida abre a pausa (quem volta encontra o jogo parado, não o personagem morto). Fora do app, nada.
 */
export async function ligarAppNativo(): Promise<void> {
  if (!ehAppNativo()) return;
  const { App } = await import('@capacitor/app');
  await App.addListener('backButton', () => {
    const modal = modalAberto();
    if (modal) {
      // O modal trata o `cancel` como o Esc (fecha e avisa quem abriu).
      modal.dispatchEvent(new Event('cancel', { cancelable: true }));
      return;
    }
    const pausa = botaoDePausa();
    if (pausa) {
      pausa.click();
      return;
    }
    if (new URLSearchParams(location.search).size > 0) history.back();
    else void App.minimizeApp();
  });
  await App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive && !modalAberto()) botaoDePausa()?.click();
  });
}

/** Vibração pelo motor do aparelho (Haptics). Padrão como no navegador: [vibra, pausa, vibra, ...] em ms. */
export function vibrarNativo(padrao: number | readonly number[]): void {
  const passos = typeof padrao === 'number' ? [padrao] : padrao;
  void import('@capacitor/haptics')
    .then(({ Haptics }) => {
      let espera = 0;
      passos.forEach((ms, i) => {
        if (i % 2 === 0 && ms > 0) setTimeout(() => void Haptics.vibrate({ duration: ms }).catch(() => undefined), espera);
        espera += ms;
      });
    })
    .catch(() => undefined);
}
