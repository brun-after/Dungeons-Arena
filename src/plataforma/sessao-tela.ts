// Sessão de jogo na tela (§4.9): tela cheia e trava de orientação no primeiro gesto (no toque),
// Wake Lock enquanto a aba está visível. Tudo com falha silenciosa.
// Ajuste de 16/10/2026 (D-067): no toque, a tela cheia e a paisagem são pedidas a cada toque enquanto não pegarem
// (não só no primeiro), e em retrato um aviso cobre o jogo pedindo para girar o aparelho (o iOS não deixa travar).

import { t } from '../i18n';
import { ehAppNativo } from './nativo';
import { icone } from '../ui/icones';

/**
 * Marco 16 (15/10/2026, §4.9): ao deixar o jogo pelo menu, solta a orientação e sai da tela cheia (a página seguinte é
 * um menu, que gira à vontade). Falha em silêncio.
 */
export function sairDaTelaCheia(): void {
  if (ehAppNativo()) return;
  try {
    screen.orientation.unlock();
  } catch {
    // Sem suporte: nada a soltar.
  }
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
}

export function prepararSessaoDeTela(toque: boolean): () => void {
  // Marco 20 (D-087): no app Android, a tela cheia, a paisagem e a tela acesa vêm do próprio app.
  if (ehAppNativo()) return () => undefined;
  let trava: WakeLockSentinel | null = null;

  const pedirWakeLock = async () => {
    try {
      trava = await navigator.wakeLock.request('screen');
    } catch {
      trava = null;
    }
  };

  // Navegador automatizado (testes) não entra em tela cheia nem vê o aviso, para não mudar a viewport.
  const forcar = toque && !navigator.webdriver;
  let travou = false;
  const aoGesto = async () => {
    if (!forcar) return;
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      } catch {
        // Sem suporte ou recusado: segue em janela (o próximo toque tenta de novo).
      }
    }
    if (travou) return;
    try {
      // Em navegadores sem `lock` (iOS), a chamada lança e cai no catch; o aviso de retrato cobre esse caso.
      await screen.orientation.lock('landscape');
      travou = true;
    } catch {
      // Sem suporte ou fora da tela cheia: tenta no próximo toque.
    }
  };
  const aoToque = () => void aoGesto();

  const aviso = document.createElement('div');
  aviso.className = 'aviso-girar';
  aviso.setAttribute('role', 'alert');
  aviso.append(icone('girar_tela', 'icone grande'));
  const texto = document.createElement('p');
  texto.textContent = t('tela.gireOAparelho');
  aviso.append(texto);
  if (forcar) document.body.append(aviso);

  const aoVisibilidade = () => {
    if (document.visibilityState === 'visible') void pedirWakeLock();
  };

  void pedirWakeLock();
  document.addEventListener('pointerdown', aoToque);
  document.addEventListener('visibilitychange', aoVisibilidade);
  return () => {
    document.removeEventListener('pointerdown', aoToque);
    aviso.remove();
    document.removeEventListener('visibilitychange', aoVisibilidade);
    void trava?.release().catch(() => undefined);
  };
}
