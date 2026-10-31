// Página da ferramenta de objetos (marco 31, 31/10/2026, D-130): roda no Chromium do Playwright, carrega os modelos
// glTF dos pacotes CC0 (servidos de .brutos/ pela ferramenta) e renderiza cada receita no ângulo do isométrico do jogo
// (câmera ortográfica a 45° de giro e 30° de elevação: o chão sai 2:1), com a luz do clima sombrio: a principal quente
// de cima à esquerda, um recorte frio por trás e pouca luz ambiente. Depois, no canvas: menos saturação e um contorno
// escuro fino na silhueta. Devolve o PNG e a âncora dos pés (o ponto do chão no centro da célula).

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as clonarComEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Receita } from './receitas';

/** Pixels por célula na saída (o jogo desenha com a metade: 48 px por célula, nítido em tela de alta densidade). */
const PX_CELULA = 96;
const ELEVACAO = Math.PI / 6;
const DESSATURAR = 0.22;

export interface Saida {
  png: string;
  largura: number;
  altura: number;
  /** A âncora dos pés em px da imagem. */
  ancoraX: number;
  ancoraY: number;
}

const carregador = new GLTFLoader();
const cache = new Map<string, Promise<{ cena: THREE.Group; animacoes: THREE.AnimationClip[] }>>();

function carregar(url: string) {
  let p = cache.get(url);
  if (!p) {
    p = carregador.loadAsync(url).then((g) => ({ cena: g.scene, animacoes: g.animations }));
    cache.set(url, p);
  }
  return p;
}

/** O tamanho do modelo (em unidades dele) e as animações: para calibrar as receitas. */
export async function medir(url: string): Promise<{ tamanho: number[]; animacoes: string[] }> {
  const { cena, animacoes } = await carregar(url);
  const caixa = new THREE.Box3().setFromObject(cena);
  const t = caixa.getSize(new THREE.Vector3());
  return { tamanho: [t.x, t.y, t.z].map((v) => Math.round(v * 100) / 100), animacoes: animacoes.map((a) => a.name) };
}

async function montar(receita: Receita, base: (m: string) => { url: string; escala: number }): Promise<THREE.Group> {
  const grupo = new THREE.Group();
  for (const peca of receita.pecas) {
    const { url, escala } = base(peca.m);
    const { cena, animacoes } = await carregar(url);
    const copia = clonarComEsqueleto(cena);
    const pose = peca.animacao;
    if (pose) {
      const clipe = animacoes.find((a) => a.name === pose.nome);
      if (clipe) {
        const mixer = new THREE.AnimationMixer(copia);
        const acao = mixer.clipAction(clipe);
        acao.play();
        mixer.setTime(clipe.duration * pose.t);
      }
    }
    const k = escala * (peca.escala ?? 1);
    const [ex = 1, ey = 1, ez = 1] = peca.estica ?? [];
    copia.scale.set(k * ex, k * ey, k * ez);
    const [x = 0, y = 0, z = 0] = peca.p ?? [];
    copia.position.set(x, y, z);
    copia.rotation.y = ((peca.giro ?? 0) * Math.PI) / 180;
    if (peca.cor) {
      copia.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          o.material = mats.map((m: THREE.Material) => {
            const c = m.clone();
            if (c instanceof THREE.MeshStandardMaterial) c.color.multiply(new THREE.Color(peca.cor));
            return c;
          });
        }
      });
    }
    grupo.add(copia);
  }
  grupo.rotation.y = ((receita.giro ?? 0) * Math.PI) / 180;
  return grupo;
}

/** Renderiza a receita. `base` diz a URL e a escala (células por unidade) de cada modelo. */
export async function renderizar(receita: Receita, base: (m: string) => { url: string; escala: number }): Promise<Saida> {
  const cena = new THREE.Scene();
  const grupo = await montar(receita, base);
  cena.add(grupo);
  grupo.updateMatrixWorld(true);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);
  const dist = 20;
  camera.position.set(Math.cos(ELEVACAO) * Math.SQRT1_2 * dist, Math.sin(ELEVACAO) * dist, Math.cos(ELEVACAO) * Math.SQRT1_2 * dist);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);

  // A caixa da tela: os cantos da caixa do grupo (e o ponto dos pés) no espaço da câmera.
  const caixa = new THREE.Box3().setFromObject(grupo);
  caixa.expandByPoint(new THREE.Vector3(0, 0, 0));
  const inv = camera.matrixWorldInverse;
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const cx of [caixa.min.x, caixa.max.x]) {
    for (const cy of [caixa.min.y, caixa.max.y]) {
      for (const cz of [caixa.min.z, caixa.max.z]) {
        const v = new THREE.Vector3(cx, cy, cz).applyMatrix4(inv);
        x0 = Math.min(x0, v.x);
        x1 = Math.max(x1, v.x);
        y0 = Math.min(y0, v.y);
        y1 = Math.max(y1, v.y);
      }
    }
  }
  // Na câmera, uma célula no eixo x do chão mede √2/2 na horizontal: o jogo usa 48·√2/2 px; aqui, PX_CELULA·√2/2.
  const folga = 0.06;
  [x0, x1, y0, y1] = [x0 - folga, x1 + folga, y0 - folga, y1 + folga];
  const largura = Math.ceil((x1 - x0) * PX_CELULA);
  const altura = Math.ceil((y1 - y0) * PX_CELULA);
  camera.left = x0;
  camera.right = x0 + largura / PX_CELULA;
  camera.top = y1;
  camera.bottom = y1 - altura / PX_CELULA;
  camera.updateProjectionMatrix();

  cena.add(new THREE.HemisphereLight(0x8a96b0, 0x1a1410, 0.55));
  const principal = new THREE.DirectionalLight(0xffd9a8, 2.6);
  principal.position.set(-4, 9, 6);
  cena.add(principal);
  const recorte = new THREE.DirectionalLight(0x7fa6ff, 1.4);
  recorte.position.set(-6, 5, -7);
  cena.add(recorte);
  const enchimento = new THREE.DirectionalLight(0xffffff, 0.35);
  enchimento.position.set(6, 3, 4);
  cena.add(enchimento);
  if (receita.luz) {
    const l = new THREE.PointLight(receita.luz.cor, receita.luz.forca, 3, 1.5);
    l.position.set(...receita.luz.p);
    cena.add(l);
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(largura, altura, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = receita.exposicao ?? 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.render(cena, camera);

  // O ponto dos pés: a origem do chão na imagem.
  const pe = new THREE.Vector3(0, 0, 0).applyMatrix4(inv);
  const ancoraX = (pe.x - x0) * PX_CELULA;
  const ancoraY = (y1 - pe.y) * PX_CELULA;

  const tela = document.createElement('canvas');
  tela.width = largura;
  tela.height = altura;
  const g = tela.getContext('2d');
  if (!g) throw new Error('sem canvas 2d');
  g.drawImage(renderer.domElement, 0, 0);
  posProcessar(g, largura, altura);
  renderer.dispose();
  return { png: tela.toDataURL('image/png'), largura, altura, ancoraX, ancoraY };
}

/** Menos saturação e o contorno escuro de 1 px por fora da silhueta (o mesmo para todos os pacotes). */
function posProcessar(g: CanvasRenderingContext2D, l: number, a: number): void {
  const img = g.getImageData(0, 0, l, a);
  const px = img.data;
  const alfa = (x: number, y: number) => (x < 0 || y < 0 || x >= l || y >= a ? 0 : (px[(y * l + x) * 4 + 3] ?? 0));
  const contorno: number[] = [];
  for (let y = 0; y < a; y++) {
    for (let x = 0; x < l; x++) {
      const i = (y * l + x) * 4;
      const al = px[i + 3] ?? 0;
      if (al === 0) {
        const vizinho = Math.max(alfa(x - 1, y), alfa(x + 1, y), alfa(x, y - 1), alfa(x, y + 1));
        if (vizinho > 120) contorno.push(i);
        continue;
      }
      const r = px[i] ?? 0;
      const gg = px[i + 1] ?? 0;
      const b = px[i + 2] ?? 0;
      const lum = 0.3 * r + 0.59 * gg + 0.11 * b;
      px[i] = r + (lum - r) * DESSATURAR;
      px[i + 1] = gg + (lum - gg) * DESSATURAR;
      px[i + 2] = b + (lum - b) * DESSATURAR;
    }
  }
  for (const i of contorno) {
    px[i] = 10;
    px[i + 1] = 8;
    px[i + 2] = 12;
    px[i + 3] = 150;
  }
  g.putImageData(img, 0, 0);
}

export type Modelos = Record<string, { url: string; escala: number }>;

declare global {
  interface Window {
    objetos: { renderizar: (r: Receita, m: Modelos) => Promise<Saida>; medir: typeof medir };
  }
}
window.objetos = {
  renderizar: (r, m) =>
    renderizar(r, (nome) => {
      const b = m[nome];
      if (!b) throw new Error(`modelo sem caminho: ${nome}`);
      return b;
    }),
  medir,
};
