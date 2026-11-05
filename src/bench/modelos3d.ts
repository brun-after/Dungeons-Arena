// Protótipo (04/11/2026, marco 37): personagens 3D em tempo real no lugar dos atlas pré-renderizados.
//   ?bench=modelos3d[&n=20][&segundos=20][&taxa=1][&dpr=2]
// Monta o guerreiro com o kit sombrio no grau 5 (tools/sprites/armaduras-sombrias.ts), funde as peças em malhas com
// pele (uma por material) e clona N vezes, cada um com o seu mixer andando. A cada quadro (ou a cada `taxa` quadros),
// o three.js desenha cada personagem num quadrinho de um atlas dinâmico, na resolução da tela (48 px por célula ×
// dpr), e o Pixi mostra os quadrinhos como sprites andando pela tela. Mede o quadro inteiro e só o custo do three.js.
// Só no servidor de desenvolvimento: os modelos vêm de .brutos/ (fora do git).

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clone as clonarComEsqueleto } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Application, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { definirDetalhe, pecaDoGuerreiro } from '../render/vivos/armaduras-sombrias';
import { PECAS_DE_ARMADURA } from '../render/equipamento-3d';

const B = '/.brutos/';
const BASE = `${B}q-base/x/Universal Base Characters[Standard]/Base Characters/Godot - UE/Superhero_Male_FullBody.gltf`;
const ANIM = `${B}q-anim/x/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb`;
const CELULA_TELA = 48;
const ALTURA_CELULAS = 1.14;

const percentil = (v: readonly number[], p: number) => [...v].sort((a, b) => a - b)[Math.min(v.length - 1, Math.floor(v.length * p))] ?? 0;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Funde as peças rígidas presas nos ossos numa malha com pele por material (peso 1 no osso de cada peça). */
function fundirPecas(raiz: THREE.Object3D, pele: THREE.SkinnedMesh): { malhas: THREE.SkinnedMesh[]; triangulos: number } {
  const ossos = pele.skeleton.bones;
  const indice = new Map(ossos.map((b, i) => [b, i]));
  const porMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const remover: THREE.Mesh[] = [];
  raiz.updateMatrixWorld(true);
  raiz.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || o instanceof THREE.SkinnedMesh) return;
    const m = o as THREE.Mesh;
    let osso: THREE.Object3D | null = m.parent;
    while (osso && !indice.has(osso as THREE.Bone)) osso = osso.parent;
    if (!osso) return;
    const g = m.geometry.clone().toNonIndexed();
    g.applyMatrix4(m.matrixWorld);
    for (const nome of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(nome)) g.deleteAttribute(nome);
    const n = g.getAttribute('position').count;
    if (!g.hasAttribute('uv')) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
    const i = indice.get(osso as THREE.Bone) ?? 0;
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(n * 4).map((_, k) => (k % 4 === 0 ? i : 0)), 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Float32Array(n * 4).map((_, k) => (k % 4 === 0 ? 1 : 0)), 4));
    const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    if (!mat) return;
    const lista = porMaterial.get(mat) ?? [];
    lista.push(g);
    porMaterial.set(mat, lista);
    remover.push(m);
  });
  for (const m of remover) m.removeFromParent();
  // O esqueleto das peças: os mesmos ossos, com o inverso tirado na pose em que foram montadas.
  const esqueleto = new THREE.Skeleton(ossos);
  const malhas: THREE.SkinnedMesh[] = [];
  let triangulos = 0;
  for (const [mat, geos] of porMaterial) {
    const g = mergeGeometries(geos) as THREE.BufferGeometry | null;
    if (!g) continue;
    triangulos += g.getAttribute('position').count / 3;
    const s = new THREE.SkinnedMesh(g, mat);
    s.frustumCulled = false;
    raiz.add(s);
    s.bind(esqueleto, new THREE.Matrix4());
    malhas.push(s);
  }
  return { malhas, triangulos };
}

async function montarModelo(): Promise<{ modelo: THREE.Object3D; andar: THREE.AnimationClip; triangulos: number; triCorpo: number; chamadas: number }> {
  const l = new GLTFLoader();
  const [base, anim] = await Promise.all([l.loadAsync(BASE), l.loadAsync(ANIM)]);
  const andar = anim.animations.find((a) => a.name === 'Walk_Loop');
  const parado = anim.animations.find((a) => a.name === 'Idle_Loop');
  if (!andar || !parado) throw new Error('animações não encontradas');
  const modelo = base.scene;
  // a escala do jogo: a altura de 1,14 célula em unidades de célula
  modelo.scale.setScalar(ALTURA_CELULAS / 1.82);
  const mixer = new THREE.AnimationMixer(modelo);
  mixer.clipAction(parado).play();
  mixer.setTime(0);
  modelo.updateMatrixWorld(true);
  const peles: THREE.SkinnedMesh[] = [];
  modelo.traverse((o) => {
    if (o instanceof THREE.SkinnedMesh && o.name === 'SuperHero_Male') peles.push(o as THREE.SkinnedMesh);
    else if (o instanceof THREE.Mesh) o.visible = false;
  });
  const corpo = peles[0];
  if (!corpo) throw new Error('corpo sem pele');
  const ossos = { get: (n: string) => modelo.getObjectByName(n) as THREE.Bone | undefined };
  for (const peca of PECAS_DE_ARMADURA) {
    const r = pecaDoGuerreiro(ossos, peca, peca === 'maos' || peca === 'pernas' || peca === 'pes' ? 4 : 5);
    if (r.tecido) corpo.material = r.tecido;
  }
  mixer.stopAllAction();
  const { malhas, triangulos } = fundirPecas(modelo, corpo);
  const tCorpo = (corpo.geometry.index?.count ?? corpo.geometry.getAttribute('position').count) / 3;
  return { modelo, andar, triangulos: Math.round(triangulos), triCorpo: Math.round(tCorpo), chamadas: malhas.length + 1 };
}

function painel(raiz: HTMLElement, linhas: string[], json: unknown): void {
  const p = document.createElement('section');
  p.className = 'resultado-bench';
  p.style.cssText = 'position:fixed;left:8px;top:8px;z-index:9;background:#000c;color:#eee;padding:8px;font:12px monospace';
  const pre = document.createElement('pre');
  pre.textContent = linhas.join('\n');
  const dados = document.createElement('script');
  dados.type = 'application/json';
  dados.id = 'resultado-bench';
  dados.textContent = JSON.stringify(json);
  p.append(pre, dados);
  raiz.append(p);
}

export async function iniciarBenchModelos(raiz: HTMLElement, params: URLSearchParams): Promise<void> {
  const n = Math.min(80, Math.max(1, Number(params.get('n')) || 20));
  const segundos = Math.min(120, Math.max(5, Number(params.get('segundos')) || 20));
  const taxa = Math.max(1, Number(params.get('taxa')) || 1);
  const dpr = Math.min(3, Number(params.get('dpr')) || devicePixelRatio || 1);
  const nivelDetalhe = Number(params.get('detalhe')) || 0.35;
  definirDetalhe(nivelDetalhe);
  raiz.textContent = '';
  const aviso = document.createElement('p');
  aviso.textContent = 'Montando os modelos…';
  aviso.style.cssText = 'color:#ddd;font:14px sans-serif;padding:16px';
  raiz.append(aviso);

  const { modelo, andar, triangulos, triCorpo, chamadas } = await montarModelo();

  // o atlas dinâmico: um quadrinho por personagem, como o quadro do atlas (1,5 × 1,75 célula)
  const px = Math.round(CELULA_TELA * dpr);
  const qL = Math.round(1.5 * px), qA = Math.round(1.75 * px);
  const colunas = Math.ceil(Math.sqrt(n));
  const linhas = Math.ceil(n / colunas);
  const tela3d = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas: tela3d, antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(colunas * qL, linhas * qA, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.setScissorTest(true);
  const cena = new THREE.Scene();
  cena.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  cena.environmentIntensity = 0.6;
  cena.add(new THREE.HemisphereLight(0x8a96b0, 0x1a1410, 0.45));
  const luz = (cor: number, f: number, x: number, y: number, z: number) => {
    const d = new THREE.DirectionalLight(cor, f);
    d.position.set(x, y, z);
    cena.add(d);
  };
  luz(0xffc98a, 3.4, -4, 9, 6);
  luz(0x9fbcff, 4.2, -6, 5, -7);
  luz(0xffa860, 2.0, 7, 3, -4);
  const camera = new THREE.OrthographicCamera(-0.75, 0.75, 1.4, -0.35, -50, 50);
  const elev = Math.PI / 6;
  camera.position.set(Math.cos(elev) * Math.SQRT1_2 * 20, Math.sin(elev) * 20, Math.cos(elev) * Math.SQRT1_2 * 20);
  camera.lookAt(0, 0, 0);

  const atores = Array.from({ length: n }, (_, i) => {
    const m = clonarComEsqueleto(modelo);
    cena.add(m);
    const mixer = new THREE.AnimationMixer(m);
    mixer.clipAction(andar).play();
    mixer.setTime(Math.random() * andar.duration);
    return { m, mixer, x: Math.random(), y: Math.random(), ang: Math.random() * Math.PI * 2, giro: (Math.random() - 0.5) * 0.8, i };
  });
  const lote = params.get('lote') !== '0';
  const cameraLote = new THREE.OrthographicCamera(-0.75, -0.75 + colunas * 1.5, 1.4, 1.4 - linhas * 1.75, -50, 50);
  cameraLote.position.copy(camera.position);
  cameraLote.quaternion.copy(camera.quaternion);
  cameraLote.updateMatrixWorld(true);
  if (lote) {
    const direita = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const cima = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    for (const a of atores) {
      a.m.position.copy(direita).multiplyScalar((a.i % colunas) * 1.5).addScaledVector(cima, -Math.floor(a.i / colunas) * 1.75);
    }
  }

  const app = new Application();
  await app.init({ resizeTo: window, background: '#1b1a1f', antialias: false, resolution: dpr, autoDensity: true });
  raiz.textContent = '';
  raiz.append(app.canvas);
  const chao = new Graphics();
  for (let y = 0; y < 60; y++) for (let x = 0; x < 60; x++) chao.rect(x * 48, y * 24, 47, 23).fill({ color: (x + y) % 2 ? 0x24222a : 0x2a272f });
  app.stage.addChild(chao);
  const base = Texture.from(tela3d);
  const sprites = atores.map((a) => {
    const t = new Texture({ source: base.source, frame: new Rectangle((a.i % colunas) * qL, Math.floor(a.i / colunas) * qA, qL, qA) });
    const s = new Sprite(t);
    s.anchor.set(0.5, 1.4 / 1.75);
    s.scale.set(1 / dpr);
    app.stage.addChild(s);
    return s;
  });

  const quadros: number[] = [];
  const custo3d: number[] = [];
  let ultimo = performance.now();
  const inicio = ultimo;
  let contador = 0;
  let terminado = false;
  app.ticker.add(() => {
    const agora = performance.now();
    const dt = (agora - ultimo) / 1000;
    if (agora - inicio > 2000) quadros.push(agora - ultimo);
    ultimo = agora;
    const W = app.screen.width, H = app.screen.height;
    for (const [k, a] of atores.entries()) {
      a.ang += a.giro * dt;
      a.x = (a.x + Math.cos(a.ang) * dt * 0.05 + 1) % 1;
      a.y = (a.y + Math.sin(a.ang) * dt * 0.05 + 1) % 1;
      const s = sprites[k];
      if (!s) continue;
      s.position.set(40 + a.x * (W - 80), 80 + a.y * (H - 100));
      s.zIndex = s.position.y;
    }
    app.stage.sortableChildren = true;
    if (contador++ % taxa === 0) {
      const t0 = performance.now();
      for (const a of atores) {
        a.mixer.update(dt * taxa);
        // o rumo na tela vira o giro do modelo (a câmera olha da diagonal)
        a.m.rotation.y = -a.ang + Math.PI / 4 + Math.PI / 2;
      }
      if (lote) {
        // uma passada só: cada personagem fica no mundo deslocado para o quadrinho dele, e a câmera cobre o atlas todo
        renderer.setViewport(0, 0, colunas * qL, linhas * qA);
        renderer.setScissor(0, 0, colunas * qL, linhas * qA);
        renderer.render(cena, cameraLote);
      } else {
        for (const a of atores) a.m.visible = false;
        for (const a of atores) {
          a.m.visible = true;
          const x = (a.i % colunas) * qL;
          const y = (linhas - 1 - Math.floor(a.i / colunas)) * qA;
          renderer.setViewport(x, y, qL, qA);
          renderer.setScissor(x, y, qL, qA);
          renderer.render(cena, camera);
          a.m.visible = false;
        }
      }
      base.source.update();
      if (agora - inicio > 2000) custo3d.push(performance.now() - t0);
    }
    if (!terminado && agora - inicio > 2000 + segundos * 1000) {
      terminado = true;
      const media = quadros.reduce((s, v) => s + v, 0) / Math.max(1, quadros.length);
      const r = {
        n, taxa, dpr, segundos, lote,
        detalhe: nivelDetalhe,
        triangulosArmadura: triangulos,
        triangulosCorpo: triCorpo,
        chamadasPorPersonagem: chamadas,
        atlasPx: `${colunas * qL}×${linhas * qA}`,
        fps: r2(1000 / media),
        p50Ms: r2(percentil(quadros, 0.5)),
        p95Ms: r2(percentil(quadros, 0.95)),
        threeMediaMs: r2(custo3d.reduce((s, v) => s + v, 0) / Math.max(1, custo3d.length)),
        threeP95Ms: r2(percentil(custo3d, 0.95)),
        tela: `${innerWidth}×${innerHeight}@${devicePixelRatio}`,
        agente: navigator.userAgent,
      };
      painel(raiz, [
        `modelos3d · ${n} personagens · ${lote ? 'uma passada' : 'uma passada por personagem'} · taxa 1/${taxa} · dpr ${dpr} · atlas ${r.atlasPx}`,
        `por personagem: armadura ${triangulos} + corpo ${triCorpo} triângulos, ${chamadas} chamadas (detalhe ${nivelDetalhe})`,
        `fps ${r.fps} · p50 ${r.p50Ms} ms · p95 ${r.p95Ms} ms`,
        `three.js por quadro: média ${r.threeMediaMs} ms · p95 ${r.threeP95Ms} ms`,
      ], r);
      document.body.dataset.bench = 'pronto';
    }
  });
}
