// Marco 20 (21/10/2026, D-087): no app Android os arquivos já estão no APK; o registro do service worker não faz nada.

export function registerSW(): () => Promise<void> {
  return () => Promise.resolve();
}
