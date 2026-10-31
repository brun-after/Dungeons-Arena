// O acabamento comum dos renders (marco 32, 31/10/2026, D-131): menos saturação e o contorno escuro de 1 px por fora
// da silhueta, como os objetos. `cinza`: a peça tingida no jogo sai sem cor e clara (o tom multiplica o cinza).

const DESSATURAR = 0.2;

export function posProcessar(g: CanvasRenderingContext2D, l: number, a: number, cinza = false): void {
  const img = g.getImageData(0, 0, l, a);
  const px = img.data;
  const alfa = (x: number, y: number) => (x < 0 || y < 0 || x >= l || y >= a ? 0 : (px[(y * l + x) * 4 + 3] ?? 0));
  const contorno: number[] = [];
  for (let y = 0; y < a; y++) {
    for (let x = 0; x < l; x++) {
      const i = (y * l + x) * 4;
      if ((px[i + 3] ?? 0) === 0) {
        if (Math.max(alfa(x - 1, y), alfa(x + 1, y), alfa(x, y - 1), alfa(x, y + 1)) > 120) contorno.push(i);
        continue;
      }
      const r = px[i] ?? 0;
      const gg = px[i + 1] ?? 0;
      const b = px[i + 2] ?? 0;
      const lum = 0.3 * r + 0.59 * gg + 0.11 * b;
      if (cinza) {
        const v = Math.min(255, 24 + lum * 1.5);
        px[i] = v;
        px[i + 1] = v;
        px[i + 2] = v;
        continue;
      }
      px[i] = r + (lum - r) * DESSATURAR;
      px[i + 1] = gg + (lum - gg) * DESSATURAR;
      px[i + 2] = b + (lum - b) * DESSATURAR;
    }
  }
  for (const i of contorno) {
    px[i] = 10;
    px[i + 1] = 8;
    px[i + 2] = 12;
    px[i + 3] = 160;
  }
  g.putImageData(img, 0, 0);
}
