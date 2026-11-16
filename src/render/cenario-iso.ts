// O cenário em pé do exterior do Mundo (marco 43, 15/11/2026, D-177): as árvores, as rochas, os rochedos da montanha
// e os objetos da vila, em sprites pré-renderizados de modelos 3D (src/assets/cenario, tools/objetos --cenario), com a
// mesma luz e o mesmo contorno dos outros objetos. Cada sprite fica de pé no chão erguido (a projeção com o relevo) e
// na profundidade da diagonal dele: quem passa atrás da árvore fica atrás dela.
// O que vai em cada célula sai da fase (o obstáculo natural, data/mundo/cenario.json pelo bioma) e da composição dos
// lugares (world/composicao-cenario.ts), sem sorteio (o hash da célula escolhe a variante, o deslocamento e o
// tamanho). Para o celular: só os blocos de 16×16 perto da câmera têm sprites; os longe são soltos.

import { Assets, CanvasSource, Container, Sprite, Texture } from 'pixi.js';
import CATALOGO from '../assets/cenario/catalogo.json';
import CENARIO from '../data/mundo/cenario.json';
import type { Fase } from '../world/fase';
import { OBSTACULO } from '../world/geografia';
import { raioDaSombra, type RegrasDaCamuflagem } from '../world/camuflagem';
import { rochaDoPenhasco } from '../world/cenario-baixo';
import type { PecaDoCenario } from '../world/composicao-cenario';
import { CELULA_PX } from './camera-calculo';
import type { Projecao } from './projecao';
import { deslocamentoNoPlano } from './solo/malha-relevo';
import { ehLuzDoMundo, registrarUrlDaLuz } from './luzes-do-mundo';

const URLS = import.meta.glob<string>('../assets/cenario/*.webp', { eager: true, query: '?url', import: 'default' });
for (const [caminho, url] of Object.entries(URLS)) {
  const nome = caminho.slice(caminho.lastIndexOf('/') + 1, -'.webp'.length);
  if (ehLuzDoMundo(nome)) registrarUrlDaLuz(nome, url);
}
/** Pixels da imagem por pixel do jogo (renderizadas a 96 px por célula). */
const RESOLUCAO = 2;
const BLOCO = 16;
/** Margem (células) em volta da vista onde o bloco já ganha os sprites; além do triplo, são soltos. */
const MARGEM = 6;
/** Marco 43 (D-177): a árvore ou o objeto na frente do jogador fica translúcido (o alpha e a velocidade da troca). */
const ALPHA_NA_FRENTE = 0.32;
const TROCA_POR_MS = 1 / 180;
/** Marco 44 (D-178): até quantas células (na tela) em volta do jogador o cenário fica transparente. */
const RAIO_TRANSPARENTE = 2.6;

type NomeCenario = keyof typeof CATALOGO;
const ehNome = (n: string): n is NomeCenario => Object.hasOwn(CATALOGO, n);

/** As variantes de cada série (carvalho vira carvalho_1, carvalho_2...; o nome sem número vale sozinho). */
const VARIANTES = new Map<string, NomeCenario[]>();
for (const nome of Object.keys(CATALOGO)) {
  if (!ehNome(nome)) continue;
  const serie = /^(.*)_\d+$/.exec(nome)?.[1] ?? nome;
  VARIANTES.set(serie, [...(VARIANTES.get(serie) ?? []), nome]);
  if (serie !== nome) VARIANTES.set(nome, [nome]);
}

function hash(x: number, y: number, s: number): number {
  let h = (Math.imul(x, 374_761_393) + Math.imul(y, 668_265_263) + Math.imul(s, 1_013_904_223)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1_274_126_177);
  return ((h ^ (h >>> 16)) >>> 0) / 4_294_967_296;
}

const escolher = <T>(lista: readonly T[], t: number): T | undefined => lista[Math.min(lista.length - 1, Math.floor(t * lista.length))];

type Bioma = keyof typeof CENARIO.arvores;
const ehBioma = (b: string | undefined): b is Bioma => b !== undefined && Object.hasOwn(CENARIO.arvores, b);

export interface ItemDoCenario {
  nome: NomeCenario;
  /** Posição em células (o centro da célula é o inteiro). */
  x: number;
  y: number;
  escala: number;
}

/** O que fica em pé na fase (puro): os obstáculos naturais pelo bioma e as peças compostas. */
export function itensDoCenario(fase: Fase, pecas: readonly PecaDoCenario[] = []): ItemDoCenario[] {
  const itens: ItemDoCenario[] = [];
  const obst = fase.obstaculos;
  const bioma: Bioma = ehBioma(fase.bioma) ? fase.bioma : 'campo';
  const naMata = (x: number, y: number) => (fase.matas ?? []).some((m) => Math.hypot(x - m.x, y - m.y) <= m.raio);
  const altura = (x: number, y: number) => fase.alturas?.[y * fase.largura + x] ?? 0;
  const obstaculoEm = (x: number, y: number) => (x < 0 || y < 0 || x >= fase.largura || y >= fase.altura ? 0 : (obst?.[y * fase.largura + x] ?? 0));
  /**
   * A espécie da árvore tem motivo: o talhão (uma mancha de ~9 células, de borda irregular) é de uma espécie só, com
   * um pouco de mistura; acima da altitude alta, as coníferas; na borda da mata (poucas árvores em volta), o arbusto.
   */
  const especie = (x: number, y: number): string | undefined => {
    const t = CENARIO.talhaoCelulas;
    const talhao = hash(Math.floor((x + (hash(x, y, 17) - 0.5) * 4) / t), Math.floor((y + (hash(x, y, 18) - 0.5) * 4) / t), 19);
    const lista = naMata(x, y) ? CENARIO.matas[bioma] : altura(x, y) >= CENARIO.altitudeAlta ? CENARIO.arvoresAltas[bioma] : CENARIO.arvores[bioma];
    return escolher(lista, hash(x, y, 21) < 0.15 ? hash(x, y, 22) : talhao);
  };
  /** O rochedo grande só no pé do penhasco (o vizinho bem mais alto) ou da serra. */
  const pePenhasco = (x: number, y: number) => rochaDoPenhasco(obstaculoEm, altura, x, y);
  const por = (serie: string | undefined, x: number, y: number, s: number, jitter: number, escala: [number, number]) => {
    const nome = serie ? escolher(VARIANTES.get(serie) ?? [], hash(x, y, s + 1)) : undefined;
    if (!nome) return;
    itens.push({ nome, x: x + (hash(x, y, s + 2) - 0.5) * jitter, y: y + (hash(x, y, s + 3) - 0.5) * jitter, escala: escala[0] + hash(x, y, s + 4) * (escala[1] - escala[0]) });
  };
  if (obst) {
    for (let y = 0; y < fase.altura; y++) {
      for (let x = 0; x < fase.largura; x++) {
        const o = obst[y * fase.largura + x] ?? 0;
        if (o === OBSTACULO.arvore) por(especie(x, y), x, y, 20, 0.45, [0.85, 1.15]);
        // 16/11/2026: o arbusto da borda da mata (o gerador marca, world/cenario-baixo.ts).
        else if (o === OBSTACULO.arbusto) por(escolher(CENARIO.subosque[bioma], hash(x, y, 16)), x, y, 20, 0.45, [0.85, 1.15]);
        else if (o === OBSTACULO.rochedo) por(escolher(pePenhasco(x, y) ? CENARIO.pePenhasco[bioma] : CENARIO.rochedos[bioma], hash(x, y, 12)), x, y, 30, 0.3, [0.8, 1.15]);
        else if (o === OBSTACULO.montanha && hash(x, y, 13) * 100 < CENARIO.montanha.densidadePct) por(escolher(CENARIO.montanha[bioma], hash(x, y, 14)), x, y, 40, 0.6, [0.9, 1.35]);
      }
    }
  }
  for (const p of pecas) {
    const nome = escolher(VARIANTES.get(p.nome) ?? [], hash(Math.round(p.x * 3), Math.round(p.y * 3), 50));
    if (nome) itens.push({ nome, x: p.x, y: p.y, escala: p.escala ?? 1 });
  }
  return itens;
}

/** A sombra de contato: um disco com borda macia, desenhado uma vez (no plano, vira a elipse do isométrico). */
let texturaSombra: Texture | null = null;
function sombra(): Texture {
  if (texturaSombra && !texturaSombra.destroyed) return texturaSombra;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    const r = g.createRadialGradient(32, 32, 4, 32, 32, 32);
    r.addColorStop(0, 'rgba(0,0,0,0.55)');
    r.addColorStop(0.6, 'rgba(0,0,0,0.3)');
    r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
  }
  texturaSombra = new Texture({ source: new CanvasSource({ resource: c }) });
  return texturaSombra;
}

export interface CenarioIso {
  /** Põe os sprites dos blocos perto da vista (retângulo em px de plano) e solta os longe. */
  atualizar: (vista: readonly [number, number, number, number], jogador?: { x: number; y: number } | null, dtMs?: number) => void;
  destruir: () => void;
}

export function criarCenarioIso(camada: Container, chao: Container, fase: Fase, p: Projecao, pecas: readonly PecaDoCenario[] = [], camuflagem?: RegrasDaCamuflagem): CenarioIso | null {
  const itens = itensDoCenario(fase, pecas);
  if (itens.length === 0) return null;
  const porLinha = Math.ceil(fase.largura / BLOCO);
  const blocos = new Map<number, { itens: ItemDoCenario[]; sprites: Sprite[] | null; corpos: Sprite[] }>();
  const sombras = new Container({ label: 'sombras-cenario' });
  chao.addChild(sombras);
  for (const it of itens) {
    const k = Math.floor(it.y / BLOCO) * porLinha + Math.floor(it.x / BLOCO);
    const b = blocos.get(k) ?? { itens: [], sprites: null, corpos: [] };
    b.itens.push(it);
    blocos.set(k, b);
  }
  const texturas = new Map<NomeCenario, Texture>();
  let destruido = false;
  const pedidas = new Set<NomeCenario>();
  const pedir = (nome: NomeCenario) => {
    if (pedidas.has(nome)) return;
    pedidas.add(nome);
    const url = Object.entries(URLS).find(([c]) => c.endsWith(`/${nome}.webp`))?.[1];
    if (!url) return;
    void Assets.load<Texture>(url).then((t) => {
      if (destruido) return;
      texturas.set(nome, t);
      // Os sprites que esperavam esta textura.
      for (const b of blocos.values()) for (const s of b.sprites ?? []) if (s.label === nome && s.texture !== t) aplicar(s, nome, t);
    }).catch(() => undefined);
  };
  const aplicar = (s: Sprite, nome: NomeCenario, t: Texture) => {
    const c = CATALOGO[nome];
    s.texture = t;
    s.anchor.set(c.ancoraX / c.largura, c.ancoraY / c.altura);
    s.visible = true;
  };
  const montar = (b: { itens: ItemDoCenario[]; sprites: Sprite[] | null; corpos: Sprite[] }) => {
    b.sprites = b.itens.flatMap((it) => {
      // A sombra no chão (no plano, erguida pela altura do chão ali): do tamanho da base do objeto.
      const cx = (it.x + 0.5) * CELULA_PX;
      const cy = (it.y + 0.5) * CELULA_PX;
      const d = deslocamentoNoPlano(p.alturaDoChao(cx, cy));
      // Marco 44 (15/11/2026, D-178): na mata fechada, a sombra da árvore tem `areaNaMata` vezes a área (a zona de
      // fácil camuflagem, world/camuflagem.ts), mais clara para as sombras emendadas não virarem breu.
      const ix = Math.round(it.x);
      const iy = Math.round(it.y);
      const mata = camuflagem && fase.obstaculos?.[iy * fase.largura + ix] === OBSTACULO.arvore ? raioDaSombra(fase, ix, iy, camuflagem) / camuflagem.raioSombra : 1;
      const raio = (CATALOGO[it.nome].largura / RESOLUCAO) * it.escala * 0.42 * mata;
      const sb = new Sprite(sombra());
      if (mata > 1) sb.alpha = 0.7;
      sb.anchor.set(0.5);
      sb.position.set(cx - d, cy - d);
      sb.width = raio * 2;
      sb.height = raio * 2;
      sombras.addChild(sb);
      const s = new Sprite();
      s.label = it.nome;
      const q = p.projetar((it.x + 0.5) * CELULA_PX, (it.y + 0.5) * CELULA_PX);
      s.position.set(q.x, q.y);
      s.scale.set(it.escala / RESOLUCAO);
      s.zIndex = q.z;
      const t = texturas.get(it.nome);
      if (t) aplicar(s, it.nome, t);
      else {
        s.visible = false;
        pedir(it.nome);
      }
      camada.addChild(s);
      return [s, sb];
    });
    b.corpos = b.sprites.filter((s) => ehNome(s.label));
  };
  const soltar = (b: { sprites: Sprite[] | null; corpos: Sprite[] }) => {
    for (const s of b.sprites ?? []) s.destroy();
    b.sprites = null;
    b.corpos = [];
  };
  /** O que está mais perto da câmera que o jogador e cobre o corpo dele na tela fica translúcido (só os blocos em volta). */
  const esmaecer = (jogador: { x: number; y: number } | null, dtMs: number) => {
    const pj = jogador ? p.projetar((jogador.x + 0.5) * CELULA_PX, (jogador.y + 0.5) * CELULA_PX) : null;
    const bjx = jogador ? Math.floor(jogador.x / BLOCO) : -9;
    const bjy = jogador ? Math.floor(jogador.y / BLOCO) : -9;
    const passo = dtMs * TROCA_POR_MS;
    for (const [k, b] of blocos) {
      if (!b.sprites) continue;
      const bx = k % porLinha;
      const by = Math.floor(k / porLinha);
      const vizinho = Math.abs(bx - bjx) <= 1 && Math.abs(by - bjy) <= 1;
      for (const s of b.corpos) {
        let alvo = 1;
        if (vizinho && pj && s.visible && s.zIndex > pj.z) {
          const c = CATALOGO[s.label as NomeCenario]; // corpos só têm nomes do catálogo
          const esc = s.scale.x;
          const esquerda = s.x - c.ancoraX * esc;
          const topo = s.y - c.ancoraY * esc;
          const meioDoCorpo = pj.y - CELULA_PX * 0.5;
          if (pj.x > esquerda && pj.x < esquerda + c.largura * esc && meioDoCorpo > topo && meioDoCorpo < s.y) alvo = ALPHA_NA_FRENTE;
        }
        // Marco 44 (15/11/2026, D-178): no meio das árvores, as de perto do jogador ficam transparentes (as de trás também).
        if (vizinho && pj && s.visible && Math.abs(s.x - pj.x) < RAIO_TRANSPARENTE * CELULA_PX && Math.abs(s.y - pj.y) < RAIO_TRANSPARENTE * CELULA_PX * 0.6) alvo = ALPHA_NA_FRENTE;
        if (s.alpha !== alvo) s.alpha = alvo > s.alpha ? Math.min(alvo, s.alpha + passo) : Math.max(alvo, s.alpha - passo);
      }
    }
  };
  return {
    atualizar: ([x0, y0, x1, y1], jogador = null, dtMs = 16) => {
      const m = MARGEM * CELULA_PX;
      for (const [k, b] of blocos) {
        const bx = (k % porLinha) * BLOCO * CELULA_PX;
        const by = Math.floor(k / porLinha) * BLOCO * CELULA_PX;
        const lado = BLOCO * CELULA_PX;
        const perto = (folga: number) => bx + lado > x0 - folga && bx < x1 + folga && by + lado > y0 - folga && by < y1 + folga;
        if (!b.sprites && perto(m)) montar(b);
        else if (b.sprites && !perto(m * 3)) soltar(b);
      }
      esmaecer(jogador, dtMs);
    },
    destruir: () => {
      destruido = true;
      for (const b of blocos.values()) soltar(b);
      sombras.destroy();
    },
  };
}
