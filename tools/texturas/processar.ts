// Texturas do chão (marco 31, 31/10/2026, D-130): `npx tsx tools/texturas/processar.ts <pasta-dos-mapas-de-cor>`.
// Lê os mapas de cor 1K dos pacotes CC0 do ambientCG (os zips brutos ficam fora do git), reduz para 512 px, tira
// parte da saturação e grava em webp em src/assets/texturas/<nome>.webp. Roda no Chromium do Playwright (canvas),
// sem dependência nova. As texturas do ambientCG já emendam nas bordas; a redução por inteiro (1024 › 512) mantém.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

/** O nome no jogo e o asset de origem (ambientCG, CC0). A lista e as URLs ficam em src/assets/texturas/LICENCAS.md. */
export const TEXTURAS = {
  lajes: 'PavingStones128',
  rocha: 'Ground022',
  blocos: 'Bricks089',
  terra: 'Ground110',
  grama: 'Grass001',
  lama: 'Ground071',
  neve: 'Snow014',
  areia: 'Ground079S',
  estrada: 'PavingStones142',
  basalto: 'Lava002',
} as const;

const LADO = 512;
/** Quanto da saturação sai (0 a 1): o clima sombrio pede cores mais apagadas; a tinta do tema faz o resto. */
const DESSATURAR = 0.3;
const QUALIDADE_WEBP = 0.82;

const pasta = process.argv[2];
if (!pasta) {
  console.error('uso: npx tsx tools/texturas/processar.ts <pasta com os *_Color.jpg>');
  process.exit(1);
}
const destino = join(import.meta.dirname, '..', '..', 'src', 'assets', 'texturas');

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
for (const [nome, id] of Object.entries(TEXTURAS)) {
  const jpg = readFileSync(join(pasta, `${id}_1K-JPG_Color.jpg`)).toString('base64');
  const webp = await pagina.evaluate(
    async ({ jpg, lado, dessaturar, qualidade }) => {
      const img = new Image();
      img.src = `data:image/jpeg;base64,${jpg}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = c.height = lado;
      const g = c.getContext('2d');
      if (!g) throw new Error('sem canvas 2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, lado, lado);
      const d = g.getImageData(0, 0, lado, lado);
      const p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const r = p[i] ?? 0;
        const gg = p[i + 1] ?? 0;
        const b = p[i + 2] ?? 0;
        const l = 0.299 * r + 0.587 * gg + 0.114 * b;
        p[i] = r + (l - r) * dessaturar;
        p[i + 1] = gg + (l - gg) * dessaturar;
        p[i + 2] = b + (l - b) * dessaturar;
      }
      g.putImageData(d, 0, 0);
      const url = c.toDataURL('image/webp', qualidade);
      return url.slice(url.indexOf(',') + 1);
    },
    { jpg, lado: LADO, dessaturar: DESSATURAR, qualidade: QUALIDADE_WEBP },
  );
  const bytes = Buffer.from(webp, 'base64');
  writeFileSync(join(destino, `${nome}.webp`), bytes);
  console.log(`${nome}.webp (${id}): ${Math.round(bytes.length / 1024)} KB`);
}
await navegador.close();
