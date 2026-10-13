import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Caminhos relativos: o GitHub Pages publica em /Dungeons-Arena/ (§3.8).
  base: './',
  build: {
    target: 'es2023',
    sourcemap: true,
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/sim/**/*.test.ts'],
    environment: 'node',
  },
});
