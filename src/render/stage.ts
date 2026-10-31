// Palco PixiJS (§2.16, §4.9, §4.10): WebGL, DPR com teto 2, sem ticker próprio (o laço do jogo
// chama `renderizar`), redimensionamento por ResizeObserver com debounce de 150 ms.
// Marco 13 (14/10/2026), D-058: o que é plano (terreno, chão, luz) fica num container `plano`, que recebe a
// matriz da projeção; o que fica em pé (entidades, paredes em prisma, projéteis, efeitos) é posicionado
// já projetado e alinhado à tela. As entidades se ordenam por `zIndex` (profundidade).
// Marco 31 (31/10/2026, D-130): depois das entidades, o escuro (render/escuridao.ts); acima dele, o que precisa ser
// lido no escuro: as marcas no chão (a telegrafia, com a matriz do plano), os rótulos (barras, anéis, indicador), os
// projéteis e os efeitos.

import { Application, Container, Matrix } from 'pixi.js';
import { resolucaoDoPalco } from './desempenho';
import type { Matriz } from './projecao';

export const TETO_DPR = 2;
const DEBOUNCE_RESIZE_MS = 150;

export interface Palco {
  app: Application;
  /** Recebe o transform da câmera; tudo do mundo fica aqui dentro. */
  mundo: Container;
  /** Marco 13: o chão inteiro (terreno, chão e luz), com a matriz da projeção. */
  plano: Container;
  terreno: Container;
  /** Telegrafia no chão (áreas e linhas de mira), abaixo das entidades. */
  chao: Container;
  /** Marco 12: poços de luz (aditivos), entre o chão e as entidades. */
  luz: Container;
  /** Em pé: entidades e, no isométrico, as paredes em prisma; ordenadas por `zIndex`. */
  entidades: Container;
  /** Marco 31 (D-130): o escuro e o mapa de luz, acima das entidades. */
  escuro: Container;
  /** Marco 31 (D-130): marcas no chão acima do escuro (a telegrafia), com a matriz da projeção. */
  marcas: Container;
  /** Marco 31 (D-130): barras, anéis e indicadores das entidades, acima do escuro. */
  rotulos: Container;
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
  /** Marco 20: escala da resolução sobre o DPR (1 = nítido; 0,5 = metade dos pixels por lado). */
  definirEscala: (escala: number) => void;
  /** Marco 13: aplica a matriz da projeção ao chão. */
  definirMatrizPlano: (m: Matriz) => void;
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
  // Ordem de camadas (§2.16): terreno -> chão (rastros, armadilhas, portas, objetos, telegrafia) -> luz ->
  // entidades -> projéteis -> efeitos (partículas e números). A tela (flash) fica fora do mundo.
  const terreno = new Container({ label: 'terreno' });
  const chao = new Container({ label: 'chao' });
  const luz = new Container({ label: 'luz' });
  const plano = new Container({ label: 'plano' });
  plano.addChild(terreno, chao, luz);
  const entidades = new Container({ label: 'entidades', sortableChildren: true });
  const escuro = new Container({ label: 'escuro' });
  const marcas = new Container({ label: 'marcas' });
  const rotulos = new Container({ label: 'rotulos' });
  const voo = new Container({ label: 'voo' });
  const efeitos = new Container({ label: 'efeitos' });
  mundo.addChild(plano, entidades, escuro, marcas, rotulos, voo, efeitos);
  const tela = new Container({ label: 'tela' });
  app.stage.addChild(mundo, tela);

  let escala = 1;
  const resolucao = () => resolucaoDoPalco(window.devicePixelRatio, TETO_DPR, escala);
  const ouvintes: ((l: number, a: number) => void)[] = [];
  let espera: ReturnType<typeof setTimeout> | undefined;
  const redimensionar = () => {
    clearTimeout(espera);
    espera = setTimeout(() => {
      const l = Math.max(1, host.clientWidth);
      const a = Math.max(1, host.clientHeight);
      // Marco 16 (15/10/2026): zoom do navegador e troca de monitor mudam o DPR; a resolução acompanha (teto 2).
      app.renderer.resize(l, a, resolucao());
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
    plano,
    terreno,
    chao,
    luz,
    entidades,
    escuro,
    marcas,
    rotulos,
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
    definirEscala: (e) => {
      if (e === escala) return;
      escala = e;
      app.renderer.resize(app.screen.width, app.screen.height, resolucao());
    },
    definirMatrizPlano: (m) => {
      plano.setFromMatrix(new Matrix(m.a, m.b, m.c, m.d, m.tx, m.ty));
      marcas.setFromMatrix(new Matrix(m.a, m.b, m.c, m.d, m.tx, m.ty));
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
