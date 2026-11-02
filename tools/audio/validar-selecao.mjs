/* global window */
// Reproduz a seleção do boneco com um guerreiro no jogo real.
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const servidor = await createServer({ server: { host: '127.0.0.1', port: 0 } });
let navegador;
try {
  await servidor.listen();
  const endereco = servidor.httpServer.address();
  assert(endereco && typeof endereco !== 'string');
  navegador = await chromium.launch({ headless: true, ...(process.argv[2] ? { executablePath: process.argv[2] } : {}) });
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
  const erros = [];
  pagina.on('pageerror', e => erros.push(e.message));
  await pagina.goto(`http://127.0.0.1:${endereco.port}/?jogo=campanha&slot=0&diag=1&classe=guerreiro`);
  await pagina.waitForSelector('#diag[data-celula]', { timeout: 60000 });
  await pagina.evaluate(async () => {
    const { MotorAudio } = await import('/src/audio/motor.ts');
    window.sonsSelecionados = [];
    const tocar = MotorAudio.prototype.tocar;
    MotorAudio.prototype.tocar = function (...args) {
      window.sonsSelecionados.push(args[0]);
      return tocar.apply(this, args);
    };
  });
  await pagina.keyboard.press('q');
  await pagina.waitForFunction(() => Number(window.document.querySelector('#diag').dataset.impactos) > 0, { timeout: 30000 });
  const sons = await pagina.evaluate(() => window.sonsSelecionados);
  assert(!sons.includes('golpe'), JSON.stringify(sons));
  assert(sons.some(som => ['acerto', 'critico', 'falha', 'lamina', 'contundente'].includes(som)), JSON.stringify(sons));
  // Desliga o automático sem desfazer a seleção; deixa a ação em andamento acabar.
  await pagina.keyboard.press('f');
  await pagina.waitForTimeout(3500);
  await pagina.evaluate(() => { window.sonsSelecionados = []; });
  await pagina.waitForTimeout(1500);
  const parado = await pagina.evaluate(() => window.sonsSelecionados.filter(som => som !== 'passo'));
  assert.deepEqual(parado, []);
  assert.deepEqual(erros, []);
  console.log('Guerreiro: alvo selecionado mantém áudio dos impactos reais, sem preparação genérica; automático desligado não emite efeitos de combate.');
} finally {
  await navegador?.close();
  await servidor.close();
}
