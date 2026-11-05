// Personagens 3D em tempo real (marco 37, 04/11/2026): os jogadores (e, depois, os chefes) deixam o atlas
// pré-renderizado e são desenhados pelo three.js a cada quadro, na resolução da tela, com a armadura sombria do grau de
// cada peça (armaduras-sombrias.ts) e as armas 3D presas nos ossos das mãos (armas3d.ts). Todos os personagens saem
// numa passada só, cada um no seu quadrinho de um atlas dinâmico; o Pixi mostra os quadrinhos como sprites (a ordem
// de desenho com paredes e telhados continua a do jogo). O protótipo (bench/modelos3d.ts) mediu, numa Intel UHD, 20
// personagens a 10 ms por quadro e 40 a 23 ms com uma passada só (contra 32 ms para 20 com uma passada por personagem).
// Enquanto o modelo carrega (ou se falhar), quem pede recebe null e o atlas pré-renderizado continua.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clone as clonarComEsqueleto } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Rectangle, Texture } from 'pixi.js';
import { CELULA_PX } from '../camera-calculo';
import { PAUSA_DO_IMPACTO_MS, peloGolpe, PERFIL_PADRAO, PERFIS_DE_GOLPE, progressoDoGolpe, voltaDoGolpe, type EstadoPersonagem, type PerfilDoGolpe } from '../quadros-personagem';

const saida = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 2;
import { grauDe, GRAUS, PECAS_DE_ARMADURA, TOMOS, type PecaDeArmadura } from '../equipamento-3d';
import type { Equipamento3d } from '../adornos';
import type { AparenciaEquipada } from '../../entities/entidade';
import { definirDetalhe, KITS_SOMBRIOS, type PecaSombria } from './armaduras-sombrias';
import { CHEFES } from './chefes-vivos';
import { ARMAS_3D, ESCALA_DO_GRAU, Kit } from './armas3d';

const URLS = import.meta.glob<string>('../../assets/modelos/*.glb', { query: '?url', import: 'default' });

/** O quadrinho de cada personagem, em células (como o quadro do atlas, mais largo para o montante). */
const QL = 2;
const QA = 2.1;
const BAIXO = 0.45;
const COLUNAS = 8;
const ELEVACAO = Math.PI / 6;
/** O detalhe das peças torneadas: a 48 px × dpr, um terço dos segmentos do atlas basta. */
const DETALHE = 0.4;
/** Quadros sem pedido até o personagem sair do palco. */
const ESQUECER_APOS = 30;

/**
 * Cada modelo em tempo real: o GLB, a altura (células), a largura, as animações de cada estado (clipes da UAL) e,
 * nos chefes, a veste fixa e a arma deles.
 */
interface Classe {
  glb: string;
  altura: number;
  largura: number;
  clipes: Record<'parado' | 'andar' | 'golpe' | 'conjurar' | 'morte', string>;
  veste: ((ossos: { get(nome: string): THREE.Bone | undefined }) => PecaSombria) | null;
  arma: { modelo: string; grau: number } | null;
  tingir?: Readonly<Record<string, number>> | undefined;
}
const HUMANO: Classe['clipes'] = { parado: 'Idle_Loop', andar: 'Walk_Loop', golpe: 'Sword_Attack', conjurar: 'Spell_Simple_Shoot', morte: 'Death01' };
const MAGIA: Classe['clipes'] = { ...HUMANO, golpe: 'Spell_Simple_Shoot' };
/** As alturas e os clipes como nas receitas do atlas (tools/sprites/receitas.ts). */
const classe = (glb: string, altura: number, clipes: Classe['clipes']): Classe => ({ glb, altura, largura: 1, clipes, veste: null, arma: null });
const CLASSES: Readonly<Record<string, Classe>> = {
  guerreiro: classe('guerreiro', 1.14, { ...HUMANO, parado: 'Sword_Idle' }),
  mago: classe('mago', 1.12, MAGIA),
  arqueiro: classe('arqueiro', 1.08, MAGIA),
  necromante: classe('necromante', 1.14, MAGIA),
  aventureiro: classe('aventureiro', 1.12, HUMANO),
  // Os chefes humanoides (chefes-vivos.ts), pela chave `chefe:<preset>`.
  ...Object.fromEntries(Object.entries(CHEFES).map(([preset, c]) => [`chefe:${preset}`, {
    glb: c.glb, altura: c.altura, largura: c.largura ?? 1, clipes: { ...HUMANO, parado: c.parado, golpe: c.golpe }, veste: c.veste, arma: c.arma, tingir: c.tingir,
  } satisfies Classe])),
};
/** A chave do modelo em tempo real do chefe (o preset), se houver. */
export const chaveDoChefe = (preset: string): string | null => (Object.hasOwn(CHEFES, preset) ? `chefe:${preset}` : null);
/**
 * Os golpes de cada tipo de arma (o primeiro é o do atlas, tools/sprites/receitas.ts VARIANTES). Marco 37
 * (05/11/2026): golpes seguidos alternam entre as variações (corte da direita, corte da esquerda, golpe de cima), para
 * a luta não repetir o mesmo movimento.
 */
const GOLPES: Readonly<Partial<Record<EstadoPersonagem, readonly string[]>>> = {
  golpeCorte: ['Sword_Regular_A', 'Sword_Regular_B', 'Sword_Attack'],
  golpePesado: ['Sword_Attack', 'Sword_Regular_B'],
  golpeEsmagar: ['TreeChopping_Loop', 'Sword_Attack'],
  golpeLeve: ['Melee_Hook', 'Punch_Cross'],
  golpeEstocada: ['Punch_Jab', 'Punch_Cross'],
  golpeDisparo: ['Pistol_Shoot'],
  golpeArremesso: ['OverhandThrow'],
  golpeGiro: ['Sword_Regular_A'],
};
/** As variações do golpe genérico (a classe sem arma de tipo conhecido, os chefes) pelo clipe principal. */
const VARIACOES: Readonly<Record<string, readonly string[]>> = {
  Sword_Attack: ['Sword_Attack', 'Sword_Regular_A', 'Sword_Regular_B'],
  Punch_Cross: ['Punch_Cross', 'Punch_Jab', 'Melee_Hook'],
};
/** A preparação das magias: as mãos sobem e carregam durante a conjuração (o lançamento é o golpe da classe). */
const PREPARO_DA_MAGIA = 'Spell_Simple_Enter';
/** A duração dos ciclos no atlas (quadros × ms, quadros-personagem.ts): o modelo anda no mesmo passo. */
const CICLO_MS: Readonly<Partial<Record<EstadoPersonagem, number>>> = { parado: 880, andar: 760, conjurar: 660, andarConjurar: 660, morte: 660 };
/** As armas longas que ficam em pé (o cajado, a lança, o arco): seguem o corpo, não o eixo da mão. */
const EM_PE = new Set(['cajado', 'praga', 'cova', 'cetro', 'sanguineo', 'espectro', 'gadanha', 'lanca', 'foice',
  'arco', 'arco_longo', 'composto', 'arcocurto', 'elfico', 'chifre', 'arcoguerra', 'arcocaca']);
const ARCOS = /^arco|composto|elfico|chifre/;
const OSSOS_DAS_PERNAS = /^(root|pelvis|thigh|calf|foot|ball)/i;

export interface PedidoVivo {
  id: string;
  modelo: string;
  /** As peças vestidas (grau 0 a 5) e as armas de cada mão. */
  pecas: Partial<Record<PecaDeArmadura, number>>;
  arma: { modelo: string; grau: number } | null;
  secundaria: { modelo: string; grau: number } | null;
  estado: EstadoPersonagem;
  /** Relógio dos ciclos (ms), a fração do golpe (0 a 1) e o tempo desde a queda (ms). */
  tempoMs: number;
  fracao: number;
  /** O rumo na grade (rad, de +x para +y). */
  angulo: number;
  /** Marco 37 (05/11/2026): o tempo do golpe (quadros-personagem.ts progressoDoGolpe) e a variação dele. */
  golpe?: { preparo: number | null; desdeMs: number | null; comPreparo: boolean; variacao: number } | undefined;
}

export interface QuadroVivo {
  textura: Texture;
  /** A âncora dos pés (fração do quadrinho) e a escala que leva o quadrinho a CELULA_PX por célula. */
  ancoraX: number;
  ancoraY: number;
  escala: number;
  /** A altura do topo acima dos pés (px de mundo). */
  topo: number;
}

/** O modelo de referência de uma classe: o rig, os clipes e as peças já fundidas por grau. */
interface Base {
  nome: string;
  modelo: THREE.Object3D;
  escala: number;
  largura: number;
  clipes: Map<string, THREE.AnimationClip>;
  pernas: Map<string, THREE.AnimationClip>;
  tronco: Map<string, THREE.AnimationClip>;
  nomesDosOssos: string[];
  pecas: Map<string, PecaFundida>;
}
interface PecaFundida {
  malhas: { geometria: THREE.BufferGeometry; material: THREE.Material }[];
  tecido: THREE.Material | null;
  esconder: RegExp | null;
}
interface Ator {
  base: Base;
  raiz: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  ossos: THREE.Bone[];
  esqueleto: THREE.Skeleton;
  roupa: string;
  extras: THREE.Object3D[];
  /** As armas em pé e o giro delas no corpo (refeito a cada quadro, depois da pose). */
  emPe: { g: THREE.Object3D; giro: THREE.Quaternion }[];
  originais: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
  vagas: number;
  vaga: number;
  textura: Texture;
  pedido: PedidoVivo | null;
  semPedido: number;
}

function malhasDe(o: THREE.Object3D): THREE.Mesh[] {
  const lista: THREE.Mesh[] = [];
  o.traverse((x) => {
    if (x instanceof THREE.Mesh) lista.push(x as THREE.Mesh);
  });
  return lista;
}

/** O clipe só com as faixas dos ossos que passam no teste (o passo nas pernas, o golpe no resto). */
/**
 * Marco 37 (05/11/2026): o golpe no lugar. As espadadas da UAL avançam o corpo (o passo do bote); o jogo já move a
 * entidade, então a bacia e a raiz ficam no ponto do primeiro quadro no chão (a altura continua: a base baixa do golpe).
 */
function noLugar(c: THREE.AnimationClip): THREE.AnimationClip {
  for (const t of c.tracks) {
    const [osso, prop] = t.name.split('.');
    if (prop !== 'position' || !/^(root|pelvis)$/i.test(osso ?? '')) continue;
    const v = t.values;
    const x0 = v[0] ?? 0, z0 = v[2] ?? 0;
    for (let i = 0; i < v.length; i += 3) {
      v[i] = x0;
      v[i + 2] = z0;
    }
  }
  return c;
}

function recortar(c: THREE.AnimationClip, pernas: boolean): THREE.AnimationClip {
  const faixas = c.tracks.filter((t) => OSSOS_DAS_PERNAS.test(t.name.split('.')[0] ?? '') === pernas);
  return new THREE.AnimationClip(`${c.name}:${pernas ? 'pernas' : 'tronco'}`, c.duration, faixas);
}

export class PalcoVivo {
  private readonly bases = new Map<string, Base | 'carregando' | 'falhou'>();
  private readonly atores = new Map<string, Ator>();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly cena = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-QL / 2, QL / 2, QA - BAIXO, -BAIXO, -50, 50);
  private readonly tela = document.createElement('canvas');
  private fonte: Texture;
  private readonly direita: THREE.Vector3;
  private readonly cima: THREE.Vector3;
  private linhas = 0;
  private livres: number[] = [];
  private pedidos = 0;
  private destruido = false;

  /**
   * `resolucao`: px de tela por px de mundo (o dpr, limitado pela qualidade). `detalhe`: os segmentos das peças
   * torneadas (0,4 no jogo; 1 nos retratos dos menus, vistos de perto).
   */
  constructor(private readonly resolucao: number, private readonly detalhe = DETALHE) {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.tela, antialias: true, alpha: true, premultipliedAlpha: true });
    this.renderer.setPixelRatio(1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.cena.environment = new THREE.PMREMGenerator(this.renderer).fromScene(new RoomEnvironment(), 0.04).texture;
    this.cena.environmentIntensity = 0.6;
    // A luz da ferramenta de sprites (tools/sprites/pagina.ts, receita sombria): tocha, recorte frio e recorte quente.
    this.cena.add(new THREE.HemisphereLight(0x8a96b0, 0x1a1410, 0.45));
    for (const [cor, forca, x, y, z] of [[0xffc98a, 3.4, -4, 9, 6], [0x9fbcff, 4.2, -6, 5, -7], [0xffa860, 2.0, 7, 3, -4]] as const) {
      const luz = new THREE.DirectionalLight(cor, forca);
      luz.position.set(x, y, z);
      this.cena.add(luz);
    }
    const d = 20;
    this.camera.position.set(Math.cos(ELEVACAO) * Math.SQRT1_2 * d, Math.sin(ELEVACAO) * d, Math.cos(ELEVACAO) * Math.SQRT1_2 * d);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld(true);
    this.direita = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    this.cima = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    this.dimensionar(1);
    this.fonte = Texture.from(this.tela);
    // Só no desenvolvimento: o palco à mão no console (diagnóstico do 3D em tempo real).
    if (import.meta.env.DEV) (globalThis as { palcoVivo?: PalcoVivo }).palcoVivo = this;
  }

  /** Diagnóstico: o estado de cada modelo e os atores no palco. */
  diagnostico(): { bases: Record<string, string>; atores: number; tela: string } {
    const bases: Record<string, string> = {};
    for (const [n, b] of this.bases) bases[n] = typeof b === 'string' ? b : 'pronto';
    return { bases, atores: this.atores.size, tela: `${this.tela.width}×${this.tela.height}` };
  }

  private get pxCelula(): number {
    return CELULA_PX * this.resolucao;
  }
  private get quadroL(): number {
    return Math.round(QL * this.pxCelula);
  }
  private get quadroA(): number {
    return Math.round(QA * this.pxCelula);
  }

  /** Há modelo em tempo real para a classe? */
  suporta(modelo: string): boolean {
    const c = Object.hasOwn(CLASSES, modelo) ? CLASSES[modelo] : undefined;
    return !!c && Object.keys(URLS).some((u) => u.endsWith(`/${c.glb}.glb`));
  }

  private dimensionar(linhas: number): void {
    const antes = this.linhas;
    this.linhas = linhas;
    this.renderer.setSize(COLUNAS * this.quadroL, linhas * this.quadroA, false);
    for (let v = antes * COLUNAS; v < linhas * COLUNAS; v++) this.livres.push(v);
    this.camera.right = -QL / 2 + COLUNAS * QL;
    this.camera.bottom = QA - BAIXO - linhas * QA;
    this.camera.updateProjectionMatrix();
    if (antes > 0) {
      // O canvas cresceu: a fonte do Pixi e os recortes de cada ator são refeitos.
      this.fonte.destroy(true);
      this.fonte = Texture.from(this.tela);
      for (const a of this.atores.values()) a.textura = this.recorte(a.vaga);
    }
  }

  private recorte(vaga: number): Texture {
    const x = (vaga % COLUNAS) * this.quadroL;
    const y = Math.floor(vaga / COLUNAS) * this.quadroA;
    return new Texture({ source: this.fonte.source, frame: new Rectangle(x, y, this.quadroL, this.quadroA) });
  }

  private base(modelo: string): Base | null {
    const b = this.bases.get(modelo);
    if (b && b !== 'carregando' && b !== 'falhou') return b;
    if (b) return null;
    const classe = Object.hasOwn(CLASSES, modelo) ? CLASSES[modelo] : undefined;
    const url = classe && Object.entries(URLS).find(([c]) => c.endsWith(`/${classe.glb}.glb`))?.[1];
    if (!url) {
      this.bases.set(modelo, 'falhou');
      return null;
    }
    this.bases.set(modelo, 'carregando');
    void url()
      .then((u) => new GLTFLoader().loadAsync(u))
      .then((g) => {
        if (!this.destruido) this.bases.set(modelo, this.montarBase(modelo, classe, g.scene, g.animations));
      })
      .catch(() => {
        this.bases.set(modelo, 'falhou');
      });
    return null;
  }

  private montarBase(nome: string, classe: Classe, modelo: THREE.Object3D, animacoes: THREE.AnimationClip[]): Base {
    const clipes = new Map(animacoes.map((c) => [c.name, /^(Sword|Melee|Punch|Shield|TreeChopping|OverhandThrow)/.test(c.name) ? noLugar(c) : c]));
    const mixer = new THREE.AnimationMixer(modelo);
    const parado = clipes.get(classe.clipes.parado);
    if (parado) {
      mixer.clipAction(parado).play();
      mixer.setTime(0);
    }
    modelo.updateMatrixWorld(true);
    const caixa = new THREE.Box3().setFromObject(modelo, true);
    const escala = classe.altura / (caixa.max.y - caixa.min.y || 1);
    for (const m of malhasDe(modelo)) {
      m.frustumCulled = false;
      // O chefe recolore o rig do monstro de origem (a cópia do material vale para todos os atores).
      for (const [chave, cor] of Object.entries(classe.tingir ?? {})) {
        const trocar = (x: THREE.Material) => {
          if (!x.name.includes(chave) || !(x instanceof THREE.MeshStandardMaterial)) return x;
          const novo = x.clone();
          novo.color.setHex(cor);
          return novo;
        };
        m.material = Array.isArray(m.material) ? m.material.map(trocar) : trocar(m.material);
      }
    }
    const nomesDosOssos: string[] = [];
    modelo.traverse((o) => {
      if (o instanceof THREE.Bone) nomesDosOssos.push(o.name);
    });
    const base: Base = {
      nome, modelo, escala, largura: classe.largura, clipes, nomesDosOssos, pecas: new Map(),
      pernas: new Map(animacoes.map((c) => [c.name, recortar(c, true)])),
      tronco: new Map(animacoes.map((c) => [c.name, recortar(c, false)])),
    };
    // As peças: montadas uma vez por grau no modelo de referência em repouso, já na escala do jogo.
    modelo.scale.set(escala * classe.largura, escala, escala * classe.largura);
    modelo.updateMatrixWorld(true);
    const kit = Object.hasOwn(KITS_SOMBRIOS, nome) ? KITS_SOMBRIOS[nome] : undefined;
    const ossos = { get: (n: string) => modelo.getObjectByName(n) as THREE.Bone | undefined };
    const inverso = modelo.matrixWorld.clone().invert();
    definirDetalhe(this.detalhe);
    if (kit) {
      for (const peca of PECAS_DE_ARMADURA) {
        for (let grau = 0; grau < GRAUS.length; grau++) {
          const r = kit(ossos, peca, grau);
          base.pecas.set(`${peca}-${grau}`, {
            malhas: this.fundir(r.extras, nomesDosOssos, inverso),
            tecido: r.tecido ?? null,
            esconder: r.esconder ? new RegExp(r.esconder) : null,
          });
        }
      }
    }
    if (classe.veste) {
      const r = classe.veste(ossos);
      base.pecas.set('veste', { malhas: this.fundir(r.extras, nomesDosOssos, inverso), tecido: r.tecido ?? null, esconder: r.esconder ? new RegExp(r.esconder) : null });
    }
    definirDetalhe(1);
    mixer.stopAllAction();
    modelo.scale.setScalar(1);
    modelo.updateMatrixWorld(true);
    return base;
  }

  /** As peças rígidas presas nos ossos viram geometria com pele (peso 1 no osso), fundida por material. */
  private fundir(extras: THREE.Object3D[], nomes: string[], inverso: THREE.Matrix4): PecaFundida['malhas'] {
    const porMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
    for (const extra of extras) {
      extra.updateMatrixWorld(true);
      let osso: THREE.Object3D | null = extra.parent;
      while (osso && !(osso instanceof THREE.Bone)) osso = osso.parent;
      const indice = Math.max(0, nomes.indexOf(osso?.name ?? ''));
      for (const m of malhasDe(extra)) {
        const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverso, m.matrixWorld));
        for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv') g.deleteAttribute(n);
        const qtd = g.getAttribute('position').count;
        if (!g.hasAttribute('uv')) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(qtd * 2), 2));
        const si = new Uint16Array(qtd * 4);
        const sw = new Float32Array(qtd * 4);
        for (let k = 0; k < qtd; k++) {
          si[k * 4] = indice;
          sw[k * 4] = 1;
        }
        g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
        g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
        const mat = Array.isArray(m.material) ? m.material[0] : m.material;
        if (!mat) continue;
        const lista = porMaterial.get(mat) ?? [];
        lista.push(g);
        porMaterial.set(mat, lista);
      }
      extra.removeFromParent();
    }
    const saida: PecaFundida['malhas'] = [];
    for (const [material, geos] of porMaterial) {
      const geometria = mergeGeometries(geos) as THREE.BufferGeometry | null;
      if (geometria) saida.push({ geometria, material });
    }
    return saida;
  }

  private novoAtor(base: Base): Ator {
    const raiz = clonarComEsqueleto(base.modelo);
    raiz.scale.set(base.escala * base.largura, base.escala, base.escala * base.largura);
    const ossos = base.nomesDosOssos.map((n) => raiz.getObjectByName(n) as THREE.Bone);
    const mixer = new THREE.AnimationMixer(raiz);
    // O esqueleto das peças: o inverso de cada osso tirado em repouso, com a raiz na origem.
    const parado = base.clipes.get(CLASSES[base.nome]?.clipes.parado ?? '') ?? base.clipes.values().next().value;
    if (parado) {
      mixer.clipAction(parado).play();
      mixer.setTime(0);
    }
    raiz.updateMatrixWorld(true);
    const esqueleto = new THREE.Skeleton(ossos);
    mixer.stopAllAction();
    this.cena.add(raiz);
    if (this.livres.length === 0) this.dimensionar(this.linhas + 1);
    const vaga = this.livres.shift() ?? 0;
    const originais = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    for (const m of malhasDe(raiz)) originais.set(m, m.material);
    return { base, raiz, mixer, ossos, esqueleto, roupa: '', extras: [], emPe: [], originais, vagas: 0, vaga, textura: this.recorte(vaga), pedido: null, semPedido: 0 };
  }

  /** Veste as peças e as armas do pedido (só quando mudam). */
  private vestir(a: Ator, p: PedidoVivo): void {
    const roupa = JSON.stringify([p.pecas, p.arma, p.secundaria]);
    if (a.roupa === roupa) return;
    a.roupa = roupa;
    for (const x of a.extras) x.removeFromParent();
    a.extras = [];
    a.emPe = [];
    for (const [m, mat] of a.originais) {
      m.material = mat;
      m.visible = true;
    }
    // Em repouso, na origem: o bind das peças casa com o do modelo de referência.
    const pos = a.raiz.position.clone();
    const rot = a.raiz.rotation.y;
    a.raiz.position.set(0, 0, 0);
    a.raiz.rotation.y = 0;
    a.raiz.updateMatrixWorld(true);
    const vestidas: [string, boolean][] = PECAS_DE_ARMADURA.flatMap((peca) => {
      const grau = p.pecas[peca];
      return grau === undefined ? [] : [[`${peca}-${grau}`, peca === 'corpo'] as [string, boolean]];
    });
    if (a.base.pecas.has('veste')) vestidas.push(['veste', true]);
    for (const [chave, doCorpo] of vestidas) {
      const f = a.base.pecas.get(chave);
      if (!f) continue;
      for (const { geometria, material } of f.malhas) {
        const s = new THREE.SkinnedMesh(geometria, material);
        s.frustumCulled = false;
        a.raiz.add(s);
        s.updateMatrixWorld(true);
        s.bind(a.esqueleto, s.matrixWorld);
        a.extras.push(s);
      }
      for (const m of a.originais.keys()) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        if (f.esconder && (f.esconder.test(m.name) || mats.some((x) => f.esconder?.test(x.name)))) m.visible = false;
        else if (f.tecido && doCorpo && /_Body|_Arms|Bracer/.test(m.name) && mats.some((x) => x.name.includes('Ranger') || x.name.includes('Peasant'))) m.material = f.tecido;
      }
    }
    const daClasse = CLASSES[p.modelo]?.arma ?? null;
    for (const [lado, arma] of [['r', p.arma ?? daClasse], ['l', p.secundaria]] as const) {
      if (!arma?.modelo) continue;
      const fechado = TOMOS.has(arma.modelo);
      const construtor = ARMAS_3D[arma.modelo];
      const osso = a.raiz.getObjectByName(`hand_${lado}`);
      if (!construtor || !osso) continue;
      const k = new Kit(arma.grau, 0x888888, fechado);
      construtor(k);
      const g = new THREE.Group();
      g.add(k.g);
      k.g.scale.setScalar(ESCALA_DO_GRAU[arma.grau] ?? 1);
      // O cabo na palma e a arma ao longo do eixo da mão (+x no osso da mão da UAL: a lâmina para cima na guarda).
      const ajuste = import.meta.env.DEV ? (globalThis as { eixoArma?: [number, number, number] }).eixoArma : undefined;
      g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...(ajuste ?? [1, 0, 0])).normalize());
      g.scale.setScalar(1 / (osso.getWorldScale(new THREE.Vector3()).x || 1));
      osso.add(g);
      a.extras.push(g);
      if (EM_PE.has(arma.modelo)) {
        // Inclinada um pouco para a frente e virada para a câmera (o arco de perfil viraria um risco a 48 px).
        // 05/11/2026: o arco meio giro em pé, a madeira para o alvo e a corda para quem atira (estava ao contrário).
        const giro = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.18, ARCOS.test(arma.modelo) ? 0.35 + Math.PI : 0.4, 0));
        a.emPe.push({ g, giro });
      }
    }
    a.raiz.position.copy(pos);
    a.raiz.rotation.y = rot;
  }

  /** Posa o ator no estado do pedido. */
  private posar(a: Ator, p: PedidoVivo): void {
    const classe = CLASSES[p.modelo];
    if (!classe) return;
    const base = p.estado === 'andarGolpe' ? 'golpe' : p.estado === 'andarConjurar' ? 'conjurar' : p.estado;
    const daClasse = base in classe.clipes ? classe.clipes[base as keyof Classe['clipes']] : classe.clipes.parado;
    const g = p.golpe;
    const deGolpe = peloGolpe(p.estado);
    // O golpe: a variação da vez entre as que o modelo tem; a magia prepara com as mãos subindo.
    const opcoes = (GOLPES[p.estado] ?? (base === 'golpe' ? VARIACOES[daClasse] : undefined) ?? [daClasse]).filter((n) => a.base.clipes.has(n));
    const preparaMagia = !deGolpe && base === 'conjurar' && g?.preparo != null && a.base.clipes.has(PREPARO_DA_MAGIA);
    const nome = preparaMagia ? PREPARO_DA_MAGIA : deGolpe && opcoes.length > 0 ? (opcoes[(g?.variacao ?? 0) % opcoes.length] ?? daClasse) : daClasse;
    const clipe = a.base.clipes.get(nome);
    a.mixer.stopAllAction();
    if (!clipe) return;
    const ciclo = preparaMagia || deGolpe ? undefined : CICLO_MS[p.estado];
    const tempo = (c: THREE.AnimationClip, ms: number | undefined) => {
      if (p.estado === 'morte') return Math.min(c.duration - 1e-3, (p.tempoMs / (ms ?? 660)) * c.duration);
      if (preparaMagia) return Math.min(c.duration - 1e-3, saida(g.preparo ?? 0) * c.duration);
      if (deGolpe && g) return progressoDoGolpe(PERFIS_DE_GOLPE[nome] ?? PERFIL_PADRAO, g.preparo, g.desdeMs, g.comPreparo) * c.duration;
      return ms !== undefined ? ((p.tempoMs % ms) / ms) * c.duration : Math.min(c.duration - 1e-3, p.fracao * c.duration);
    };
    const tocar = (c: THREE.AnimationClip, t: number, peso = 1) => {
      const acao = a.mixer.clipAction(c);
      acao.reset();
      acao.play();
      acao.time = t;
      acao.setEffectiveWeight(peso);
    };
    // A guarda: o golpe sai da pose parada no começo da carga e volta a ela no fim da volta (sem o estalo de trocar
    // de clipe; as espadadas da UAL começam e terminam com a espada em lugares diferentes).
    let guarda = 0;
    if ((deGolpe || preparaMagia) && g) {
      if (g.desdeMs === null) guarda = 1 - saida((g.preparo ?? 0) / 0.3);
      else {
        const volta = voltaDoGolpe(PERFIS_DE_GOLPE[nome] ?? PERFIL_PADRAO);
        const inicio = PAUSA_DO_IMPACTO_MS + volta * 0.45;
        guarda = Math.min(1, Math.max(0, (g.desdeMs - inicio) / (volta * 0.55)));
      }
    }
    const parado = classe.clipes.parado;
    const tParado = (c: THREE.AnimationClip) => ((p.tempoMs % 880) / 880) * c.duration;
    if (p.estado === 'andarGolpe' || p.estado === 'andarConjurar') {
      const andar = a.base.pernas.get(classe.clipes.andar);
      const tronco = a.base.tronco.get(nome);
      const troncoParado = a.base.tronco.get(parado);
      if (andar) tocar(andar, ((p.tempoMs % 760) / 760) * andar.duration);
      if (tronco) tocar(tronco, tempo(clipe, ciclo), 1 - guarda);
      if (troncoParado && guarda > 0) tocar(troncoParado, tParado(troncoParado), guarda);
    } else {
      tocar(clipe, tempo(clipe, ciclo), 1 - guarda);
      const cParado = a.base.clipes.get(parado);
      if (cParado && guarda > 0 && cParado !== clipe) tocar(cParado, tParado(cParado), guarda);
    }
    a.mixer.update(0);
    if ((deGolpe || preparaMagia) && g) this.inclinar(a, g, PERFIS_DE_GOLPE[nome] ?? PERFIL_PADRAO, preparaMagia || nome.startsWith('Spell'));
  }

  /**
   * Marco 37 (05/11/2026): o peso do golpe por cima do clipe. O tronco recua enquanto carrega (a magia, mais) e se
   * lança para a frente no impacto, voltando na volta. Giro em torno do eixo da direita do corpo, no espaço do mundo.
   */
  private inclinar(a: Ator, g: NonNullable<PedidoVivo['golpe']>, perfil: PerfilDoGolpe, magia: boolean): void {
    let angulo: number;
    if (g.desdeMs === null) angulo = -(magia ? 0.16 : 0.2) * saida((g.preparo ?? 0) / 0.8);
    else {
      const volta = voltaDoGolpe(perfil);
      const t = g.desdeMs / (PAUSA_DO_IMPACTO_MS + volta);
      angulo = (magia ? 0.24 : 0.2) * Math.max(0, 1 - saida(Math.min(1, t * 1.3)));
    }
    // A magia: o catalisador (o cajado, o tomo) sobe enquanto carrega e é lançado para a frente no lançamento.
    let braco = 0;
    if (magia) {
      if (g.desdeMs === null) braco = -1.5 * saida((g.preparo ?? 0) / 0.85);
      else {
        const t = g.desdeMs / (PAUSA_DO_IMPACTO_MS + voltaDoGolpe(perfil));
        braco = t < 0.12 ? -1.5 + 0.2 * saida(t / 0.12) : -1.3 * (1 - saida(Math.min(1, (t - 0.12) / 0.88)));
      }
    }
    if (Math.abs(angulo) < 1e-3 && Math.abs(braco) < 1e-3) return;
    a.raiz.updateMatrixWorld(true);
    const direita = new THREE.Vector3(0, 0, 1).applyQuaternion(a.raiz.getWorldQuaternion(new THREE.Quaternion()));
    const giros: [string, number][] = [['spine_01', angulo * 0.4], ['spine_02', angulo * 0.35], ['spine_03', angulo * 0.25], ['upperarm_r', braco]];
    for (const [nomeOsso, giro] of giros) {
      const osso = a.ossos.find((o) => o.name === nomeOsso);
      if (!osso?.parent || Math.abs(giro) < 1e-4) continue;
      const mundo = osso.getWorldQuaternion(new THREE.Quaternion());
      const pai = osso.parent.getWorldQuaternion(new THREE.Quaternion());
      osso.quaternion.copy(pai.invert().multiply(new THREE.Quaternion().setFromAxisAngle(direita, giro)).multiply(mundo));
      osso.updateMatrixWorld(true);
    }
  }

  /** As armas em pé: o giro do corpo (a raiz) com a inclinação da arma, desfeito o giro do osso da mão. */
  private endireitar(a: Ator): void {
    a.raiz.updateMatrixWorld(true);
    const corpo = a.raiz.getWorldQuaternion(new THREE.Quaternion());
    const osso = new THREE.Quaternion();
    for (const { g, giro } of a.emPe) {
      g.parent?.getWorldQuaternion(osso);
      g.quaternion.copy(osso.invert().multiply(corpo).multiply(giro));
    }
  }

  /** O quadro do personagem (null enquanto o modelo carrega: o atlas continua). */
  pedir(p: PedidoVivo): QuadroVivo | null {
    if (this.destruido) return null;
    const base = this.base(p.modelo);
    if (!base) return null;
    let a = this.atores.get(p.id);
    if (!a) {
      a = this.novoAtor(base);
      this.atores.set(p.id, a);
    }
    a.pedido = p;
    a.semPedido = 0;
    this.pedidos++;
    const classe = CLASSES[p.modelo];
    return {
      textura: a.textura,
      ancoraX: 0.5,
      ancoraY: (QA - BAIXO) / QA,
      escala: 1 / this.resolucao,
      topo: (classe?.altura ?? 1.14) * CELULA_PX,
    };
  }

  /** Desenha, numa passada só, todos os personagens pedidos neste quadro. */
  desenhar(): void {
    if (this.destruido) return;
    for (const [id, a] of this.atores) {
      if (a.semPedido++ > ESQUECER_APOS) {
        a.raiz.removeFromParent();
        a.textura.destroy(false);
        this.livres.push(a.vaga);
        this.atores.delete(id);
      }
    }
    if (this.pedidos === 0) return;
    this.pedidos = 0;
    for (const a of this.atores.values()) {
      const p = a.pedido;
      a.raiz.visible = p !== null && a.semPedido <= 1;
      if (!p || !a.raiz.visible) continue;
      this.vestir(a, p);
      this.posar(a, p);
      const giro = p.estado === 'golpeGiro' ? 2 * Math.PI * p.fracao : 0;
      a.raiz.rotation.y = Math.atan2(Math.cos(p.angulo), Math.sin(p.angulo)) + giro;
      const col = a.vaga % COLUNAS;
      const lin = Math.floor(a.vaga / COLUNAS);
      a.raiz.position.copy(this.direita).multiplyScalar(col * QL).addScaledVector(this.cima, -lin * QA);
      if (a.emPe.length > 0) this.endireitar(a);
    }
    this.renderer.render(this.cena, this.camera);
    this.fonte.source.update();
  }

  /**
   * O retrato dos menus (04/11/2026, marco 37): o mesmo modelo do jogo, sozinho, de corpo inteiro em perspectiva e a
   * três quartos, na resolução pedida. Espera o modelo carregar; null se ele não existir ou falhar.
   */
  async retrato(p: PedidoVivo, largura: number, altura: number): Promise<HTMLCanvasElement | null> {
    let base = this.base(p.modelo);
    for (let i = 0; !base && i < 600 && this.bases.get(p.modelo) === 'carregando' && !this.destruido; i++) {
      await new Promise((r) => setTimeout(r, 50));
      base = this.base(p.modelo);
    }
    if (!base || this.destruido) return null;
    const a = this.novoAtor(base);
    for (const outro of this.atores.values()) outro.raiz.visible = false;
    this.vestir(a, p);
    this.posar(a, p);
    a.raiz.position.set(0, 0, 0);
    a.raiz.rotation.y = -0.42;
    if (a.emPe.length > 0) this.endireitar(a);
    const alto = CLASSES[p.modelo]?.altura ?? 1.14;
    const camera = new THREE.PerspectiveCamera(22, largura / altura, 0.1, 60);
    // a altura toda com folga para a arma e a coroa; o olho um pouco acima do peito, olhando de leve para baixo
    const distancia = (alto * 1.5) / (2 * Math.tan(THREE.MathUtils.degToRad(11)));
    camera.position.set(0, alto * 0.78, distancia);
    camera.lookAt(0, alto * 0.56, 0);
    this.renderer.setSize(largura, altura, false);
    this.renderer.render(this.cena, camera);
    const saida = document.createElement('canvas');
    saida.width = largura;
    saida.height = altura;
    saida.getContext('2d')?.drawImage(this.tela, 0, 0);
    a.raiz.removeFromParent();
    a.textura.destroy(false);
    this.livres.push(a.vaga);
    this.renderer.setSize(COLUNAS * this.quadroL, this.linhas * this.quadroA, false);
    return saida;
  }

  destruir(): void {
    this.destruido = true;
    for (const a of this.atores.values()) a.textura.destroy(false);
    this.atores.clear();
    this.fonte.destroy(true);
    this.renderer.dispose();
  }
}

/** O pedido do quadro a partir do que o desenho das entidades já calcula (sprites.ts). */
export function pedidoVivo(
  id: string,
  modelo: string,
  aparencia: AparenciaEquipada | null | undefined,
  equipamento: Equipamento3d | null,
  estado: EstadoPersonagem,
  tempoMs: number,
  fracao: number,
  angulo: number,
  golpe?: PedidoVivo['golpe'],
): PedidoVivo {
  const pecas: Partial<Record<PecaDeArmadura, number>> = {};
  for (const peca of PECAS_DE_ARMADURA) {
    const raridade = aparencia?.[peca];
    if (raridade) pecas[peca] = grauDe(raridade);
  }
  const arma = equipamento?.arma.modelo ? equipamento.arma : null;
  const secundaria = equipamento?.secundaria ?? null;
  // Só no servidor de desenvolvimento: `&vestir=N` veste todas as peças (e as armas) no grau N, para revisar o visual.
  const vestir = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('vestir') ?? Number.NaN) : Number.NaN;
  if (vestir >= 0 && vestir <= 5) {
    for (const peca of PECAS_DE_ARMADURA) pecas[peca] = vestir;
    return { id, modelo, pecas, estado, tempoMs, fracao, angulo, golpe, arma: arma && { ...arma, grau: vestir }, secundaria: secundaria && { ...secundaria, grau: vestir } };
  }
  return { id, modelo, pecas, estado, tempoMs, fracao, angulo, golpe, arma, secundaria };
}
