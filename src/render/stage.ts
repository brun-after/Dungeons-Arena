// Palco PixiJS (§2.16, §4.9, §4.10): WebGL, DPR com teto 2, sem ticker próprio (o laço do jogo
// chama `renderizar`), redimensionamento por ResizeObserver com debounce de 150 ms.

import { Application, Container } from 'pixi.js';

export const TETO_DPR = 2;
const DEBOUNCE_RESIZE_MS = 150;

export interface Palco {
  app: Application;
  /** Recebe o transform da câmera; tudo do mundo fica aqui dentro. */
  mundo: Container;
  terreno: Container;
  entidades: Container;
  canvas: HTMLCanvasElement;
  largura: () => number;
  altura: () => number;
  aoRedimensionar: (fn: (largura: number, altura: number) => void) => void;
  renderizar: () => void;
  destruir: () => void;
}

export async function criarPalco(host: HTMLElement): Promise<Palco> {
  const app = new Application();
  await app.init({
    width: Math.max(1, host.clientWidth),
    height: Math.max(1, host.clientHeight),
    background: '#14121a',
    resolution: Math.min(window.devicePixelRatio || 1, TETO_DPR),
    autoDensity: true,
    antialias: false,
    preference: 'webgl',
    autoStart: false,
    sharedTicker: false,
  });
  app.ticker.stop();
  host.append(app.canvas);

  const mundo = new Container({ label: 'mundo' });
  const terreno = new Container({ label: 'terreno' });
  const entidades = new Container({ label: 'entidades' });
  mundo.addChild(terreno, entidades);
  app.stage.addChild(mundo);

  const ouvintes: ((l: number, a: number) => void)[] = [];
  let espera: ReturnType<typeof setTimeout> | undefined;
  const redimensionar = () => {
    clearTimeout(espera);
    espera = setTimeout(() => {
      const l = Math.max(1, host.clientWidth);
      const a = Math.max(1, host.clientHeight);
      app.renderer.resize(l, a);
      for (const fn of ouvintes) fn(l, a);
    }, DEBOUNCE_RESIZE_MS);
  };
  const observador = new ResizeObserver(redimensionar);
  observador.observe(host);
  window.addEventListener('resize', redimensionar);
  window.addEventListener('orientationchange', redimensionar);

  return {
    app,
    mundo,
    terreno,
    entidades,
    canvas: app.canvas,
    // Em px CSS, independentes do DPR.
    largura: () => app.screen.width,
    altura: () => app.screen.height,
    aoRedimensionar: (fn) => ouvintes.push(fn),
    renderizar: () => {
      app.render();
    },
    destruir: () => {
      clearTimeout(espera);
      observador.disconnect();
      window.removeEventListener('resize', redimensionar);
      window.removeEventListener('orientationchange', redimensionar);
      app.destroy({ removeView: true }, { children: true });
    },
  };
}
