// Página da ferramenta de personagens (marco 32, 31/10/2026, D-131): roda no Chromium do Playwright e renderiza cada
// receita (receitas.ts) num atlas: 8 direções (linhas) e os quadros de cada estado (colunas), no ângulo do isométrico
// do jogo e com a luz do clima sombrio, como os objetos (tools/objetos/pagina.ts). O traje da Quaternius não tem rosto:
// a cabeça vem do corpo base, religada ao esqueleto do traje; os ossos do resto desse corpo viram um osso de escala
// quase zero preso ao pescoço (o corpo emprestado some dentro da gola, em qualquer pose).

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as clonarComEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { DIRECOES, ESTADOS, QUADROS, type Estado, type Receita } from './receitas';

/** Pixels por célula no atlas (o jogo desenha a 48: 1,5× para ficar nítido sem pesar). */
const PX_CELULA = 72;
const ELEVACAO = Math.PI / 6;
const DESSATURAR = 0.2;
const QUADRO_PADRAO = { largura: 1.5, altura: 1.75, baixo: 0.35 };

export interface SaidaAtlas {
  png: string;
  quadroL: number;
  quadroA: number;
  ancoraX: number;
  ancoraY: number;
  pxCelula: number;
  colunas: number;
  estados: Record<Estado, { inicio: number; n: number }>;
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

type Urls = Record<string, string>;

function malhas(o: THREE.Object3D): THREE.Mesh[] {
  const lista: THREE.Mesh[] = [];
  o.traverse((x) => {
    if (x instanceof THREE.Mesh) lista.push(x as THREE.Mesh);
  });
  return lista;
}

function materiais(m: THREE.Mesh): THREE.Material[] {
  return Array.isArray(m.material) ? m.material : [m.material];
}

/** Tinge e acende os materiais pelo nome (cópias: o cache dos arquivos fica intacto). */
function colorir(raiz: THREE.Object3D, cores: Record<string, number> = {}, emissao: Record<string, number> = {}): void {
  for (const m of malhas(raiz)) {
    const novos = materiais(m).map((mat) => {
      const c = mat.clone();
      if (c instanceof THREE.MeshStandardMaterial) {
        for (const [chave, cor] of Object.entries(cores)) if (c.name.includes(chave)) c.color.multiply(new THREE.Color(cor));
        for (const [chave, forca] of Object.entries(emissao)) {
          if (!c.name.includes(chave)) continue;
          c.emissive = new THREE.Color(0xff4020);
          c.emissiveIntensity = forca;
        }
      }
      return c;
    });
    m.material = novos.length === 1 ? (novos[0] as THREE.Material) : novos;
  }
}

function ossosPorNome(raiz: THREE.Object3D): Map<string, THREE.Bone> {
  const mapa = new Map<string, THREE.Bone>();
  raiz.traverse((o) => {
    if (o instanceof THREE.Bone) mapa.set(o.name, o as THREE.Bone);
  });
  return mapa;
}

interface Montado {
  grupo: THREE.Group;
  mixer: THREE.AnimationMixer;
  ossos: Map<string, THREE.Bone>;
  /** A escala de ossos por nome, reaplicada depois de cada pose. */
  escalas: Record<string, number>;
}

/** Os ossos da cabeça emprestada que ficam (o resto do corpo base some). */
const OSSOS_DA_CABECA = new Set(['Head', 'neck_01']);

async function montar(r: Receita, urls: Urls): Promise<Montado> {
  const grupo = new THREE.Group();
  const url = (m: string) => {
    const u = urls[m];
    if (!u) throw new Error(`sem caminho: ${m}`);
    return u;
  };
  const corpo = clonarComEsqueleto((await carregar(url(r.corpo))).cena);
  grupo.add(corpo);
  const ossos = ossosPorNome(corpo);
  const temCapuz = malhas(corpo).some((m) => m.name.includes('Hood'));
  if (r.cabeca) {
    const base = clonarComEsqueleto((await carregar(url(r.cabeca))).cena);
    const pescoco = ossos.get('neck_01');
    const colapso = new THREE.Bone();
    colapso.scale.setScalar(1e-4);
    pescoco?.add(colapso);
    for (const m of malhas(base)) {
      if (!(m instanceof THREE.SkinnedMesh)) continue;
      // Religa a malha aos ossos do traje (mesmos nomes): a cabeça vai para onde o pescoço do traje está.
      const novos = m.skeleton.bones.map((b) => (OSSOS_DA_CABECA.has(b.name) ? (ossos.get(b.name) ?? b) : colapso));
      m.bind(new THREE.Skeleton(novos, m.skeleton.boneInverses), m.bindMatrix);
      // Com capuz, o cabelo some (atravessaria o pano).
      if (temCapuz && materiais(m).some((mat) => mat.name.includes('Hair'))) m.visible = false;
    }
    // Só as malhas: o esqueleto do corpo base não entra na cena (a animação acharia os ossos dele pelo nome).
    const so = malhas(base);
    for (const m of so) grupo.add(m);
  }
  colorir(grupo, r.cores, r.emissao);
  const mixer = new THREE.AnimationMixer(grupo);
  return { grupo, mixer, ossos, escalas: r.ossos ?? {} };
}

async function clipe(nome: string, urls: Urls): Promise<THREE.AnimationClip> {
  const [biblioteca = '', ...resto] = nome.split(':');
  const id = resto.join(':');
  const [arquivo, animacao] = biblioteca === 'kes' ? [`kes-anim:${id.split(':')[0] ?? ''}`, id.split(':')[1] ?? ''] : [biblioteca, id];
  const u = urls[arquivo];
  if (!u) throw new Error(`biblioteca sem caminho: ${arquivo}`);
  const c = (await carregar(u)).animacoes.find((a) => a.name === animacao);
  if (!c) throw new Error(`animação não encontrada: ${nome}`);
  return c;
}

function pose(mt: Montado, c: THREE.AnimationClip | null, t: number): void {
  if (!c) {
    mt.grupo.updateMatrixWorld(true);
    return;
  }
  mt.mixer.stopAllAction();
  const acao = mt.mixer.clipAction(c);
  acao.reset();
  acao.play();
  mt.mixer.setTime(t);
  for (const [nome, k] of Object.entries(mt.escalas)) mt.ossos.get(nome)?.scale.setScalar(k);
  mt.grupo.updateMatrixWorld(true);
}

async function armar(mt: Montado, r: Receita, urls: Urls): Promise<void> {
  for (const a of r.armas ?? []) {
    const osso = mt.ossos.get(a.osso);
    const u = urls[a.m];
    if (!osso || !u) continue;
    const arma = clonarComEsqueleto((await carregar(u)).cena);
    if (a.cor) colorir(arma, { '': a.cor });
    const caixa = new THREE.Box3().setFromObject(arma);
    const t = caixa.getSize(new THREE.Vector3());
    const escalaOsso = osso.getWorldScale(new THREE.Vector3()).x || 1;
    const k = a.tamanho / Math.max(t.x, t.y, t.z) / escalaOsso;
    arma.scale.setScalar(k);
    const [gx = 0, gy = 0, gz = 0] = a.giro ?? [];
    arma.rotation.set((gx * Math.PI) / 180, (gy * Math.PI) / 180, (gz * Math.PI) / 180);
    const [px = 0, py = 0, pz = 0] = a.p ?? [];
    arma.position.set(px / escalaOsso, py / escalaOsso, pz / escalaOsso);
    osso.add(arma);
  }
}

export async function renderizarAtlas(r: Receita, urls: Urls): Promise<SaidaAtlas> {
  const mt = await montar(r, urls);
  const clipes = {} as Record<Estado, THREE.AnimationClip | null>;
  for (const e of ESTADOS) clipes[e] = r.animacoes ? await clipe(r.animacoes[e], urls) : null;

  // A altura: a pessoa parada (o primeiro quadro do parado) mede `altura` células.
  pose(mt, clipes.parado, 0);
  const caixa = new THREE.Box3().setFromObject(mt.grupo);
  const k = r.altura / (caixa.max.y - caixa.min.y || 1);
  const largura = r.largura ?? 1;
  mt.grupo.scale.set(k * largura, k, k * largura);
  mt.grupo.updateMatrixWorld(true);
  await armar(mt, r, urls);

  const cena = new THREE.Scene();
  const pivo = new THREE.Group();
  pivo.add(mt.grupo);
  cena.add(pivo);
  cena.add(new THREE.HemisphereLight(0x9aa6c0, 0x2a2018, 0.9));
  const principal = new THREE.DirectionalLight(0xffd9a8, 2.6);
  principal.position.set(-4, 9, 6);
  const recorte = new THREE.DirectionalLight(0x7fa6ff, 1.6);
  recorte.position.set(-6, 5, -7);
  const enchimento = new THREE.DirectionalLight(0xffffff, 0.4);
  enchimento.position.set(6, 3, 4);
  cena.add(principal, recorte, enchimento);

  const q = r.quadro ?? QUADRO_PADRAO;
  const quadroL = Math.round(q.largura * PX_CELULA);
  const quadroA = Math.round(q.altura * PX_CELULA);
  const topo = q.altura - q.baixo;
  const camera = new THREE.OrthographicCamera(-quadroL / PX_CELULA / 2, quadroL / PX_CELULA / 2, topo, -q.baixo, -100, 100);
  const dist = 20;
  camera.position.set(Math.cos(ELEVACAO) * Math.SQRT1_2 * dist, Math.sin(ELEVACAO) * dist, Math.cos(ELEVACAO) * Math.SQRT1_2 * dist);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(quadroL, quadroA, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = r.exposicao ?? 1.6;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const estados = {} as Record<Estado, { inicio: number; n: number }>;
  let colunas = 0;
  for (const e of ESTADOS) {
    estados[e] = { inicio: colunas, n: QUADROS[e] };
    colunas += QUADROS[e];
  }
  const atlas = document.createElement('canvas');
  atlas.width = colunas * quadroL;
  atlas.height = DIRECOES * quadroA;
  const g = atlas.getContext('2d');
  if (!g) throw new Error('sem canvas 2d');
  for (let d = 0; d < DIRECOES; d++) {
    // A direção na grade: (cos a, sin a) em (x, z); o modelo olha para +z.
    const a = (d * Math.PI * 2) / DIRECOES;
    pivo.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
    for (const e of ESTADOS) {
      const c = clipes[e];
      const n = QUADROS[e];
      for (let i = 0; i < n; i++) {
        // Os ciclos repartem a volta toda; o golpe e a morte vão do começo ao fim (o último quadro é o fim).
        const ciclo = e === 'parado' || e === 'andar' || e === 'conjurar';
        const duracao = c?.duration ?? 0;
        const t = ciclo ? (duracao * i) / n : (duracao * i) / Math.max(1, n - 1) - (i === n - 1 ? 1e-3 : 0);
        pose(mt, c, Math.max(0, t));
        renderer.render(cena, camera);
        g.drawImage(renderer.domElement, (estados[e].inicio + i) * quadroL, d * quadroA);
      }
    }
  }
  renderer.dispose();
  posProcessar(g, atlas.width, atlas.height);
  return { png: atlas.toDataURL('image/png'), quadroL, quadroA, ancoraX: quadroL / 2, ancoraY: (topo / q.altura) * quadroA, pxCelula: PX_CELULA, colunas, estados };
}

/** Menos saturação e o contorno escuro de 1 px por fora da silhueta (como os objetos). */
function posProcessar(g: CanvasRenderingContext2D, l: number, a: number): void {
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

declare global {
  interface Window {
    personagens: { renderizarAtlas: typeof renderizarAtlas };
  }
}
window.personagens = { renderizarAtlas };
