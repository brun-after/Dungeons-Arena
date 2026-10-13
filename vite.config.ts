import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Caminhos relativos: o GitHub Pages publica em /Dungeons-Arena/ (§3.8).
  base: './',
  build: {
    target: 'es2023',
    sourcemap: true,
  },
  plugins: [
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
        orientation: 'any',
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
    include: ['tests/unit/**/*.test.ts', 'tests/sim/**/*.test.ts'],
    environment: 'node',
  },
});
