import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { moduloDoAtlas } from './src/render/modelos/atlas.ts';

// Marco 13 (14/10/2026), D-058: atlas dos modelos de criatura gerado no build e no dev (§2.16).
function atlasCriaturas(): Plugin {
  const id = 'virtual:atlas-criaturas';
  // O prefixo NUL marca o módulo como virtual para os outros plugins (convenção do Rollup).
  const resolvido = String.fromCharCode(0) + id;
  return {
    name: 'atlas-criaturas',
    resolveId: (fonte) => (fonte === id ? resolvido : undefined),
    load: (fonte) => (fonte === resolvido ? moduloDoAtlas() : undefined),
  };
}

export default defineConfig({
  // Caminhos relativos: o GitHub Pages publica em /Dungeons-Arena/ (§3.8).
  base: './',
  build: {
    target: 'es2023',
    sourcemap: true,
  },
  plugins: [
    atlasCriaturas(),
    // PWA (§3.8): campanha jogável offline depois da primeira visita.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icones/icone.svg'],
      manifest: {
        name: 'Dungeons Arena',
        short_name: 'Dungeons',
        description: 'RPG de ação em tempo real: campanha, arena e editor de fases.',
        lang: 'pt-BR',
        start_url: './',
        scope: './',
        display: 'standalone',
        // Ajuste de 16/10/2026 (D-067): o jogo instalado abre deitado.
        orientation: 'landscape',
        background_color: '#14121a',
        theme_color: '#14121a',
        icons: [
          { src: 'icones/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icones/icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icones/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cacheId: 'dungeons-arena',
        // Assets versionados pelo hash do build: precache (cache-first).
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,json}'],
        cleanupOutdatedCaches: true,
        // Navegação: rede primeiro; offline, cai no index.html do precache (D-013).
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dungeons-arena-navegacao',
              networkTimeoutSeconds: 3,
              precacheFallback: { fallbackURL: 'index.html' },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/sim/**/*.test.ts', 'tests/net/**/*.test.ts', 'tests/integracao/**/*.test.ts'],
    environment: 'node',
    // Simulações de 10.000 ticks e cargas de rede rodam em paralelo e disputam CPU.
    testTimeout: 60_000,
  },
});
