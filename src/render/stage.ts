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
  /** Telegrafia no chão (áreas e linhas de mira), abaixo das entidades. */
  chao: Container;
  /** Marco 12: poços de luz (aditivos), entre o chão e as entidades. */
  luz: Container;
  entidades: Container;
  /** Projéteis em voo. */
  voo: Container;
  /** Números de dano e efeitos de habilidade, acima de tudo no mundo. */
  efeitos: Container;
  /** Marco 12: camada de tela (fora do mundo), para o flash dos presets de impacto. */
  tela: Container;
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
  // Ordem de camadas (§2.16): terreno → chão (rastros, armadilhas, portas, objetos, telegrafia) → luz →
  // entidades → projéteis → efeitos (partículas e números). A tela (flash) fica fora do mundo.
  const terreno = new Container({ label: 'terreno' });
  const chao = new Container({ label: 'chao' });
  const luz = new Container({ label: 'luz' });
  const entidades = new Container({ label: 'entidades' });
  const voo = new Container({ label: 'voo' });
  const efeitos = new Container({ label: 'efeitos' });
  mundo.addChild(terreno, chao, luz, entidades, voo, efeitos);
  const tela = new Container({ label: 'tela' });
  app.stage.addChild(mundo, tela);

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
    chao,
    luz,
    entidades,
    voo,
    efeitos,
    tela,
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
