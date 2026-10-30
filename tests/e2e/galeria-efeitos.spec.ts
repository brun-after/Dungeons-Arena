// Marco 26 (29/10/2026, D-124): a galeria das assinaturas abre e toca uma skill de cada família sem erro; a Corrente
// voa até o boneco e só então o puxa, deslizando (não teletransporta).
import { expect, test } from '@playwright/test';

interface Galeria {
  tocar: (id: string) => void;
  ids: string[];
  pausar: (sim: boolean) => void;
  avancar: (ms: number) => void;
  boneco: () => { x: number; y: number };
  animacoes: () => number;
}

test('a galeria toca uma skill de cada família sem erro', async ({ page }) => {
  // Marco 27 (29/10/2026): no WebGL por software do CI, cada segundo avançado custa ~1 s de quadro; 13 skills passam de 90 s.
  test.setTimeout(240_000);
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('./?galeria=efeitos');
  await expect(page.locator('body')).toHaveAttribute('data-galeria', 'pronta');
  expect(await page.evaluate(() => (window as unknown as { __galeria: Galeria }).__galeria.ids.length)).toBeGreaterThan(400);
  const amostra = ['corrente', 'bola_de_fogo', 'raio_em_cadeia', 'nova_glacial', 'abalo_sismico', 'dardo_toxico', 'garras_do_ossuario', 'orbe_instavel', 'barreira', 'golpe_atordoante', 'chuva_de_flechas', 'mergulho', 'ult_impacto_vulcanico'];
  for (const id of amostra) {
    const vivas = await page.evaluate((skill) => {
      const g = (window as unknown as { __galeria: Galeria }).__galeria;
      g.pausar(true);
      g.tocar(skill);
      g.avancar(800);
      const n = g.animacoes() + Number(document.body.dataset.particulas ?? 0);
      g.avancar(3000);
      return n;
    }, id);
    expect(vivas, id).toBeGreaterThan(0);
  }
  expect(erros).toEqual([]);
});

test('a Corrente voa até o boneco e depois o puxa deslizando', async ({ page }) => {
  await page.goto('./?galeria=efeitos');
  await expect(page.locator('body')).toHaveAttribute('data-galeria', 'pronta');
  const posicoes = await page.evaluate(() => {
    const g = (window as unknown as { __galeria: Galeria }).__galeria;
    g.pausar(true);
    g.tocar('corrente');
    const xs: number[] = [];
    for (let i = 0; i < 50; i++) {
      g.avancar(16);
      xs.push(g.boneco().x);
    }
    return xs;
  });
  // Parado enquanto a corrente voa; depois anda em vários quadros intermediários até o lado de quem puxou.
  expect(posicoes[25]).toBe(8);
  const meio = posicoes.filter((x) => x > 4.05 && x < 7.95);
  expect(meio.length).toBeGreaterThan(3);
  expect(posicoes.at(-1)).toBeCloseTo(4, 1);
});
