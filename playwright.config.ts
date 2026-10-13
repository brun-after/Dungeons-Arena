import { defineConfig, devices } from '@playwright/test';

const PORTA = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // O WebGL do navegador headless é por software: dois navegadores em paralelo disputam a CPU,
  // os quadros passam de 250 ms e a simulação desacelera de propósito (teto do laço). Em série.
  workers: 1,
  // Andar até uma sala e lutar leva mais que os 30 s padrão no WebGL por software.
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: 'retain-on-failure',
    // O Service Worker do PWA não deve servir respostas em cache entre testes.
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Mobile é plataforma primária (§1.3): o smoke também roda em emulação de celular.
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
