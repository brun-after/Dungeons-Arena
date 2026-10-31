// Página da ferramenta de personagens (marco 32, 31/10/2026, D-131): roda no Chromium do Playwright e renderiza cada
// receita (receitas.ts) num atlas: 8 direções (linhas) e os quadros de cada estado (colunas), no ângulo do isométrico
// do jogo e com a luz do clima sombrio, como os objetos (tools/objetos/pagina.ts). O traje da Quaternius não tem rosto:
// a cabeça vem do corpo base, religada ao esqueleto do traje; os ossos do resto desse corpo viram um osso de escala
// quase zero preso ao pescoço (o corpo emprestado some dentro da gola, em qualquer pose).
// As camadas de equipamento (equipamento-3d.ts) saem na mesma pose de cada quadro: o corpo só escreve profundidade
// (esconde o que fica atrás dele) e a peça da camada pinta por cima; as peças tingidas saem em cinza.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as clonarComEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { DIRECOES, ESTADOS, QUADROS, type Arma, type Estado, type Receita } from './receitas';
import { posProcessar } from './pos';
import { renderizarArmas } from './icones';
import { asas, capa, elmo, peito, tiara } from './armaduras3d';
import { criatura } from './criaturas3d';

/** Pixels por célula no atlas (o jogo desenha a 48: 1,5× para ficar nítido sem pesar). */
const PX_CELULA = 72;
const ELEVACAO = Math.PI / 6;
const QUADRO_PADRAO = { largura: 1.5, altura: 1.75, baixo: 0.35 };

/** Uma camada de equipamento: as malhas do corpo que pinta, as peças a mais, as armas e a capa. */
export interface PedidoDeCamada {
  nome: string;
  tingir: boolean;
  malhas?: string;
  material?: string;
  esconder?: string;
  pecas?: string[];
  armas?: Arma[];
  /** A peça de armadura em 3D (armaduras3d.ts) e o grau dela; a cor da raridade também tinge as malhas do traje. */
  armadura?: { peca: 'cabeca' | 'corpo' | 'capa'; grau: number; acento: number };
}

export interface SaidaAtlas {
  /** O corpo ('' quando o pedido foi só de camadas). */
  png: string;
  camadas: string[];
  /**
   * As mãos das classes (marco 32, D-131), por direção e coluna: x e y do punho no quadro (px), o ângulo da arma na
   * tela (rad, 0 = para cima, horário), o encurtamento (1 = de lado) e se a mão está na frente do tronco (1) ou atrás (0).
   * `d` é a direita (a arma), `e` a esquerda (a mão secundária); 5 números por quadro.
   */
  maos: { d: number[]; e: number[] } | null;
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
type Mats = THREE.Material | THREE.Material[];

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
  /** As criaturas de geometria (`proc:`): a pose de cada estado por deformação. */
  animar?: (estado: Estado, f: number) => void;
}

/** Os ossos da cabeça emprestada que ficam (o resto do corpo base some). */
const OSSOS_DA_CABECA = new Set(['Head', 'neck_01']);

const urlDe = (urls: Urls, m: string) => {
  const u = urls[m];
  if (!u) throw new Error(`sem caminho: ${m}`);
  return u;
};

/** As malhas de um arquivo do mesmo esqueleto, religadas aos ossos do traje pelos nomes (`trocar`: outro osso). */
async function religadas(url: string, ossos: Map<string, THREE.Bone>, trocar?: (b: THREE.Bone) => THREE.Bone): Promise<THREE.Mesh[]> {
  const base = clonarComEsqueleto((await carregar(url)).cena);
  for (const m of malhas(base)) {
    if (!(m instanceof THREE.SkinnedMesh)) continue;
    const novos = m.skeleton.bones.map((b) => (trocar ? trocar(b) : (ossos.get(b.name) ?? b)));
    m.bind(new THREE.Skeleton(novos, m.skeleton.boneInverses), m.bindMatrix);
  }
  // Só as malhas: o esqueleto do arquivo não entra na cena (a animação acharia os ossos dele pelo nome).
  return malhas(base);
}

async function montar(r: Receita, urls: Urls): Promise<Montado> {
  const grupo = new THREE.Group();
  if (r.corpo.startsWith('proc:')) {
    const c = criatura(r.corpo.slice(5));
    if (!c) throw new Error(`criatura desconhecida: ${r.corpo}`);
    grupo.add(c.grupo);
    c.animar('parado', 0);
    return { grupo, mixer: new THREE.AnimationMixer(grupo), ossos: new Map(), escalas: {}, animar: (e, f) => { c.animar(e, f); } };
  }
  const corpo = clonarComEsqueleto((await carregar(urlDe(urls, r.corpo))).cena);
  grupo.add(corpo);
  const ossos = ossosPorNome(corpo);
  const temCapuz = malhas(corpo).some((m) => m.name.includes('Hood'));
  if (r.cabeca) {
    const pescoco = ossos.get('neck_01');
    const colapso = new THREE.Bone();
    colapso.scale.setScalar(1e-4);
    pescoco?.add(colapso);
    // A cabeça vai para onde o pescoço do traje está; o resto do corpo base, para o osso que some.
    for (const m of await religadas(urlDe(urls, r.cabeca), ossos, (b) => (OSSOS_DA_CABECA.has(b.name) ? (ossos.get(b.name) ?? b) : colapso))) {
      // Com capuz, o cabelo some (atravessaria o pano).
      if (temCapuz && materiais(m).some((mat) => mat.name.includes('Hair'))) m.visible = false;
      grupo.add(m);
    }
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

/** Prende a arma no osso (o tamanho é a maior medida, em células). */
async function armar(mt: Montado, a: Arma, urls: Urls): Promise<THREE.Object3D | null> {
  const osso = mt.ossos.get(a.osso);
  if (!osso) return null;
  const u = urls[a.m];
  if (!u) return null;
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
  return arma;
}

const INVISIVEL = new THREE.MeshBasicMaterial({ visible: false });

/** O eixo da arma no espaço do osso da mão (a lâmina, o cabo do cajado): o mesmo giro das armas presas antes. */
const EIXO_DA_ARMA = new THREE.Vector3(-1, 0, 0);
/** O comprimento (células) usado para medir o encurtamento. */
const MEDIDA = 0.3;

/** O punho e o eixo da arma de uma mão, na tela do quadro. */
function medirMao(mt: Montado, lado: 'r' | 'l', camera: THREE.Camera, quadroL: number, quadroA: number, pxCelula: number): number[] {
  const mao = mt.ossos.get(`hand_${lado}`);
  const meio = mt.ossos.get(`middle_01_${lado}`);
  const tronco = mt.ossos.get('spine_02');
  if (!mao) return [0, 0, 0, 1, 1];
  const punho = mao.getWorldPosition(new THREE.Vector3());
  if (meio) punho.lerp(meio.getWorldPosition(new THREE.Vector3()), 0.55);
  const eixo = EIXO_DA_ARMA.clone().applyQuaternion(mao.getWorldQuaternion(new THREE.Quaternion())).normalize();
  const tela = (v: THREE.Vector3) => {
    const p = v.clone().project(camera);
    return { x: ((p.x + 1) / 2) * quadroL, y: ((1 - p.y) / 2) * quadroA };
  };
  const a = tela(punho);
  const b = tela(punho.clone().addScaledVector(eixo, MEDIDA));
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const k = Math.min(1, Math.hypot(dx, dy) / (MEDIDA * pxCelula));
  const prof = (v: THREE.Vector3) => v.clone().applyMatrix4(camera.matrixWorldInverse).z;
  const frente = tronco ? (prof(punho) > prof(tronco.getWorldPosition(new THREE.Vector3())) ? 1 : 0) : 1;
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return [r2(a.x), r2(a.y), r2(Math.atan2(dx, -dy)), r2(Math.max(0.25, k)), frente];
}

/** O material por pedaço de cada malha do corpo na camada, e as peças que só ela mostra. */
interface CamadaMontada {
  pedido: PedidoDeCamada;
  mats: Map<THREE.Mesh, Mats>;
  pinta: Set<THREE.Mesh>;
  extras: THREE.Object3D[];
}

function variante(cache: Map<THREE.Material, THREE.Material>, mat: THREE.Material, f: (c: THREE.Material) => void): THREE.Material {
  let c = cache.get(mat);
  if (!c) {
    c = mat.clone();
    f(c);
    cache.set(mat, c);
  }
  return c;
}
const soProfundidade = new Map<THREE.Material, THREE.Material>();
const cinzas = new Map<THREE.Material, THREE.Material>();
const naFrente = new Map<THREE.Material, THREE.Material>();
const profundidade = (m: THREE.Material) => variante(soProfundidade, m, (c) => (c.colorWrite = false));
const igualOuFrente = (c: THREE.Material) => (c.depthFunc = THREE.LessEqualDepth);
const cinza = (m: THREE.Material) =>
  variante(cinzas, m, (c) => {
    if (c instanceof THREE.MeshStandardMaterial) c.color.set(0xffffff);
    igualOuFrente(c);
  });
const frente = (m: THREE.Material) => variante(naFrente, m, igualOuFrente);
/** O pano do traje na cor da raridade, por cima do corpo (sem a textura escura do traje: a cor com a luz). */
const tingido = (m: THREE.Material, cor: number) => {
  const c = m.clone();
  if (c instanceof THREE.MeshStandardMaterial) {
    c.map = null;
    c.color = new THREE.Color(0xa8a298).lerp(new THREE.Color(cor), 0.6);
  }
  igualOuFrente(c);
  return c;
};

async function montarCamada(mt: Montado, corpo: THREE.Mesh[], p: PedidoDeCamada, urls: Urls): Promise<CamadaMontada> {
  const mats = new Map<THREE.Mesh, Mats>();
  const pinta = new Set<THREE.Mesh>();
  const reMalha = p.malhas ? new RegExp(p.malhas) : null;
  const reEsconder = p.esconder ? new RegExp(p.esconder) : null;
  for (const m of corpo) {
    const lista = materiais(m).map((mat) => {
      if (reMalha?.test(m.name) && (!p.material || mat.name.includes(p.material))) {
        pinta.add(m);
        if (p.armadura) return tingido(mat, p.armadura.acento);
        return p.tingir ? cinza(mat) : frente(mat);
      }
      if (reEsconder && (reEsconder.test(mat.name) || reEsconder.test(m.name))) return INVISIVEL;
      return profundidade(mat);
    });
    mats.set(m, lista.length === 1 ? (lista[0] as THREE.Material) : lista);
  }
  const extras: THREE.Object3D[] = [];
  for (const ref of p.pecas ?? []) {
    for (const m of await religadas(urlDe(urls, ref), mt.ossos)) {
      // As peças do traje (o capuz, as ombreiras de pano) na cor da raridade.
      const cor = p.armadura?.acento;
      if (cor !== undefined) m.material = Array.isArray(m.material) ? m.material.map((x) => tingido(x, cor)) : tingido(m.material, cor);
      mt.grupo.add(m);
      extras.push(m);
    }
  }
  for (const a of p.armas ?? []) {
    const arma = await armar(mt, a, urls);
    if (arma) extras.push(arma);
  }
  const a = p.armadura;
  if (a) {
    if (a.peca === 'cabeca') extras.push(...(a.grau >= 2 ? elmo(mt.ossos, a.grau, a.acento) : a.grau === 1 ? tiara(mt.ossos, a.acento) : []));
    if (a.peca === 'corpo') extras.push(...peito(mt.ossos, a.grau, a.acento));
    if (a.peca === 'capa') extras.push(...capa(mt.ossos, a.grau, a.acento));
  }
  for (const x of extras) {
    x.visible = false;
    for (const m of malhas(x)) {
      m.renderOrder = 2;
      if (p.tingir) m.material = Array.isArray(m.material) ? m.material.map(cinza) : cinza(m.material);
    }
  }
  return { pedido: p, mats, pinta, extras };
}

/**
 * O atlas do corpo (com `comCorpo`) e o das camadas pedidas, na mesma pose de cada quadro. As camadas de uma vez
 * pesam (um canvas do tamanho do atlas cada): o chamador reparte em lotes.
 */
export async function renderizarAtlas(r: Receita, urls: Urls, camadas: PedidoDeCamada[] = [], comCorpo = true): Promise<SaidaAtlas> {
  cinzas.clear();
  naFrente.clear();
  soProfundidade.clear();
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
  for (const a of r.armas ?? []) await armar(mt, a, urls);
  if (r.armadura) {
    const { cabeca, corpo: peitoral, acento } = r.armadura;
    elmo(mt.ossos, cabeca, acento);
    peito(mt.ossos, peitoral, acento);
  }
  if (r.asas !== undefined) asas(mt.ossos, r.asas);
  const corpo = malhas(mt.grupo);
  const originais = new Map<THREE.Mesh, Mats>(corpo.map((m) => [m, m.material]));
  const montadas: CamadaMontada[] = [];
  for (const p of camadas) montadas.push(await montarCamada(mt, corpo, p, urls));

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
  const tela = () => {
    const c = document.createElement('canvas');
    c.width = colunas * quadroL;
    c.height = DIRECOES * quadroA;
    const g = c.getContext('2d');
    if (!g) throw new Error('sem canvas 2d');
    return { c, g };
  };
  const atlas = comCorpo ? tela() : null;
  const maos = comCorpo && r.equipamento ? { d: [] as number[], e: [] as number[] } : null;
  const telas = montadas.map(() => tela());

  const aplicar = (cm: CamadaMontada | null) => {
    for (const m of corpo) {
      m.material = cm ? (cm.mats.get(m) ?? m.material) : (originais.get(m) ?? m.material);
      // O que a camada pinta vem depois da máscara do resto do corpo.
      m.renderOrder = cm?.pinta.has(m) ? 1 : 0;
    }
    for (const outra of montadas) for (const x of outra.extras) x.visible = outra === cm;
  };

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
        mt.animar?.(e, ciclo ? i / n : i / Math.max(1, n - 1));
        // O pivô girou: as matrizes do mundo (e a da câmera) valem para as medidas das mãos.
        cena.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        const x = (estados[e].inicio + i) * quadroL;
        if (maos) {
          maos.d.push(...medirMao(mt, 'r', camera, quadroL, quadroA, PX_CELULA));
          maos.e.push(...medirMao(mt, 'l', camera, quadroL, quadroA, PX_CELULA));
        }
        if (atlas) {
          aplicar(null);
          renderer.render(cena, camera);
          atlas.g.drawImage(renderer.domElement, x, d * quadroA);
        }
        montadas.forEach((cm, j) => {
          aplicar(cm);
          renderer.render(cena, camera);
          telas[j]?.g.drawImage(renderer.domElement, x, d * quadroA);
        });
      }
    }
  }
  renderer.dispose();
  if (atlas) posProcessar(atlas.g, atlas.c.width, atlas.c.height);
  const saidas = telas.map((t, j) => {
    posProcessar(t.g, t.c.width, t.c.height, montadas[j]?.pedido.tingir ?? false);
    return t.c.toDataURL('image/png');
  });
  return {
    png: atlas ? atlas.c.toDataURL('image/png') : '',
    camadas: saidas,
    maos,
    quadroL,
    quadroA,
    ancoraX: quadroL / 2,
    ancoraY: (topo / q.altura) * quadroA,
    pxCelula: PX_CELULA,
    colunas,
    estados,
  };
}

declare global {
  interface Window {
    personagens: { renderizarAtlas: typeof renderizarAtlas; renderizarArmas: typeof renderizarArmas };
  }
}
window.personagens = { renderizarAtlas, renderizarArmas };
