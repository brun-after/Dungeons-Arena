// Sessão de jogo na tela (§4.9): tela cheia e trava de orientação no primeiro gesto (no toque),
// Wake Lock enquanto a aba está visível. Tudo com falha silenciosa.

/**
 * Marco 16 (15/10/2026, §4.9): ao deixar o jogo pelo menu, solta a orientação e sai da tela cheia (a página seguinte é
 * um menu, que gira à vontade). Falha em silêncio.
 */
export function sairDaTelaCheia(): void {
  try {
    screen.orientation.unlock();
  } catch {
    // Sem suporte: nada a soltar.
  }
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
}

export function prepararSessaoDeTela(toque: boolean): () => void {
  let trava: WakeLockSentinel | null = null;

  const pedirWakeLock = async () => {
    try {
      trava = await navigator.wakeLock.request('screen');
    } catch {
      trava = null;
    }
  };

  const aoPrimeiroGesto = async () => {
    // Navegador automatizado (testes) não entra em tela cheia, para não mudar a viewport.
    if (!toque || navigator.webdriver) return;
    try {
      await document.documentElement.requestFullscreen();
      // Em navegadores sem `lock` (iOS), a chamada lança e cai no catch.
      await screen.orientation.lock('landscape');
    } catch {
      // Sem suporte ou recusado: segue em janela.
    }
  };

  const aoVisibilidade = () => {
    if (document.visibilityState === 'visible') void pedirWakeLock();
  };

  void pedirWakeLock();
  document.addEventListener('pointerdown', () => void aoPrimeiroGesto(), { once: true });
  document.addEventListener('visibilitychange', aoVisibilidade);
  return () => {
    document.removeEventListener('visibilitychange', aoVisibilidade);
    void trava?.release().catch(() => undefined);
  };
}
