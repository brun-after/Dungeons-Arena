// Gera os ícones PNG do PWA (192 e 512) a partir de public/icones/icone.svg, usando o Chromium
// do Playwright. Rodar só quando o SVG mudar; os PNGs ficam versionados.
//   node tools/icones/gerar-icones.mjs

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const pasta = join(import.meta.dirname, '../../public/icones');
const svg = readFileSync(join(pasta, 'icone.svg'), 'utf8');

const navegador = await chromium.launch();
try {
  for (const tamanho of [192, 512]) {
    const pagina = await navegador.newPage({ viewport: { width: tamanho, height: tamanho } });
    await pagina.setContent(
      `<html><body style="margin:0;background:transparent">` +
        svg.replace('<svg ', `<svg width="${tamanho}" height="${tamanho}" `) +
        `</body></html>`,
    );
    await pagina.screenshot({ path: join(pasta, `icone-${tamanho}.png`), omitBackground: true });
    await pagina.close();
    console.log(`icone-${tamanho}.png`);
  }
} finally {
  await navegador.close();
}
