// App Android (marco 20, 21/10/2026, D-087): o mesmo cliente web empacotado pelo Capacitor, com os arquivos dentro do
// APK (sem service worker). O esquema http://localhost continua um contexto seguro (IndexedDB, crypto da conta) e deixa
// o app falar com um servidor da rede local por ws:// (o servidor público segue por wss://).

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.brunafter.dungeonsarena',
  appName: 'Dungeons Arena',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  android: {
    backgroundColor: '#14121a',
  },
  plugins: {
    StatusBar: { overlaysWebView: true, backgroundColor: '#14121a' },
  },
};

export default config;
