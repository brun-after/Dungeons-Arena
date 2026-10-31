// Sistema de partículas (§2.16). Marco 12 (14/10/2026), D-056. Texturas geradas uma vez (ponto, brilho,
// fumaça, anel, estrela, faísca) e sprites reaproveitados num pool. Vivem em coordenadas de mundo, então
// acompanham câmera e zoom. O teto vem da qualidade (§4.10): no mínimo, nenhuma partícula. Usa um PRNG
// visual próprio (Math.random): nunca consome a sequência da simulação (§2.1).
// Marco 13 (14/10/2026): a origem é projetada (de cima ou isométrica); a partícula voa no espaço da tela.
// Marco 11A (16/10/2026, D-066): ParticleContainer do Pixi (dois: aditivo e normal) com todas as texturas num atlas
// só, gerado uma vez — muito mais partículas pelo mesmo custo. Formas de emissão, cor ao longo da vida, giro e
// arrasto. Com movimento reduzido, metade das partículas e nada de giro.
// Marco 26 (29/10/2026, D-124): um segundo atlas, rico (vfx/texturas.ts, canvas com gradiente), com os seus dois
// contêineres; flipbook (`quadros`), `esticar`, curvas de vida, cores em paradas, turbulência e `aoMorrer`. As peças,
// fitas e marcas pegam as texturas daqui (`textura`) e emitem em px de tela (`emitirNaTela`).

import { CanvasSource, Container, Graphics, Particle, ParticleContainer, Rectangle, Texture, type Renderer } from 'pixi.js';
import { CELULA_PX } from './camera-calculo';
import { centroDaCelula, type Projecao } from './projecao';
import { PRESETS_PARTICULA, TEXTURAS_PARTICULA, type CurvaVida, type Emissao, type NomePreset, type TexturaParticula } from './presets-particula';
import { celulaDaTextura, LADO_RICO, pintarAtlasRico, TEXTURAS_RICAS, type TexturaRica } from './vfx/texturas';

/** A altura (células) das partículas no ar no isométrico: a do corpo e a dos projéteis em voo. */
export const ALTURA_NO_AR = 0.4;

interface Viva {
  p: Particle;
  destino: ParticleContainer;
  vx: number;
  vy: number;
  gravidade: number;
  idadeMs: number;
  vidaMs: number;
  escala: readonly [number, number];
  alpha: readonly [number, number];
  cor: number;
  corFinal: number | null;
  giro: number;
  arrasto: number;
  quadros: Texture[] | null;
  quadro0: number;
  esticar: number;
  curvaEscala: CurvaVida | undefined;
  curvaAlpha: CurvaVida | undefined;
  cores: number[] | null;
  turbulencia: number;
  fase: number;
  aoMorrer: readonly Emissao[] | null;
}

const LADO = 32;
const entre = (a: number, b: number) => a + Math.random() * (b - a);

function misturar(a: number, b: number, f: number): number {
  const c = (s: number) => Math.round(((a >> s) & 0xff) + (((b >> s) & 0xff) - ((a >> s) & 0xff)) * f);
  return (c(16) << 16) | (c(8) << 8) | c(0);
}

/** Desenha cada textura numa célula de 32 px (centro em 16,16). */
function desenharTextura(g: Graphics, tipo: TexturaParticula, ox: number): void {
  const cx = ox + 16;
  const cy = 16;
  switch (tipo) {
    case 'ponto':
      g.circle(cx, cy, 6).fill(0xffffff);
      return;
    case 'brilho':
      for (let r = 15; r >= 1; r--) g.circle(cx, cy, r).fill({ color: 0xffffff, alpha: 0.07 + (15 - r) * 0.004 });
      return;
    case 'fumaca':
      for (let r = 15; r >= 3; r--) g.circle(cx + Math.sin(r) * 1.5, cy + Math.cos(r) * 1.5, r).fill({ color: 0xffffff, alpha: 0.06 });
      return;
    case 'anel':
      g.circle(cx, cy, 12).stroke({ width: 2, color: 0xffffff });
      return;
    case 'estrela': {
      const pontos: number[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 14 : 6;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        pontos.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      g.poly(pontos).fill(0xffffff);
      return;
    }
    case 'faisca':
      g.poly([cx, cy - 15, cx + 2, cy, cx, cy + 15, cx - 2, cy]).fill(0xffffff);
      return;
    case 'gota':
      g.circle(cx, cy + 4, 7).fill(0xffffff);
      g.poly([cx - 6, cy + 1, cx, cy - 13, cx + 6, cy + 1]).fill(0xffffff);
      return;
    case 'floco':
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        g.moveTo(cx, cy)
          .lineTo(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13)
          .stroke({ width: 2, color: 0xffffff });
      }
      g.circle(cx, cy, 3).fill(0xffffff);
      return;
    case 'runa':
      g.circle(cx, cy, 12).stroke({ width: 2, color: 0xffffff, alpha: 0.7 });
      g.moveTo(cx - 6, cy - 8).lineTo(cx + 6, cy - 8).lineTo(cx - 4, cy + 8).lineTo(cx + 6, cy + 8).stroke({ width: 2, color: 0xffffff });
      g.moveTo(cx, cy - 11).lineTo(cx, cy + 11).stroke({ width: 2, color: 0xffffff });
      return;
    case 'bolha':
      g.circle(cx, cy, 11).fill({ color: 0xffffff, alpha: 0.18 }).stroke({ width: 2, color: 0xffffff });
      g.circle(cx - 4, cy - 4, 3).fill(0xffffff);
      return;
    case 'lasca':
      g.poly([cx, cy - 14, cx + 6, cy + 2, cx - 1, cy + 14, cx - 6, cy]).fill(0xffffff);
      return;
    case 'corte':
      // Arco de golpe: a meia-lua afinando nas pontas.
      g.arc(cx, cy + 6, 14, Math.PI * 1.1, Math.PI * 1.9).arc(cx, cy + 10, 11, Math.PI * 1.9, Math.PI * 1.1, true).fill(0xffffff);
      return;
    case 'chama':
      g.circle(cx, cy + 5, 8).fill(0xffffff);
      g.poly([cx - 8, cy + 4, cx - 2, cy - 6, cx, cy - 15, cx + 3, cy - 5, cx + 8, cy + 4]).fill(0xffffff);
      return;
    case 'flecha':
      // Ajuste de 16/10/2026 (D-067): apontando para cima (−y), como a faísca — haste fina, ponta e penas.
      g.moveTo(cx, cy - 10).lineTo(cx, cy + 13).stroke({ width: 2, color: 0xb9a382 });
      g.poly([cx, cy - 15, cx + 3.5, cy - 8, cx - 3.5, cy - 8]).fill(0xffffff);
      g.poly([cx, cy + 8, cx + 4, cy + 14, cx + 4, cy + 10, cx, cy + 5]).fill({ color: 0xffffff, alpha: 0.85 });
      g.poly([cx, cy + 8, cx - 4, cy + 14, cx - 4, cy + 10, cx, cy + 5]).fill({ color: 0xffffff, alpha: 0.85 });
      return;
    case 'arco': {
      // Marco 24 (25/10/2026): o raio que se ramifica — um zigue-zague com dois galhos.
      const traco = { width: 2, color: 0xffffff };
      g.moveTo(cx - 2, cy - 15).lineTo(cx + 4, cy - 6).lineTo(cx - 3, cy + 1).lineTo(cx + 3, cy + 8).lineTo(cx - 1, cy + 15).stroke(traco);
      g.moveTo(cx + 4, cy - 6).lineTo(cx + 11, cy - 2).lineTo(cx + 13, cy + 4).stroke({ width: 1.5, color: 0xffffff, alpha: 0.8 });
      g.moveTo(cx - 3, cy + 1).lineTo(cx - 10, cy + 4).stroke({ width: 1.5, color: 0xffffff, alpha: 0.7 });
      return;
    }
    case 'cristal':
      // O gelo facetado: losango alongado com a face clara e a escura.
      g.poly([cx, cy - 15, cx + 7, cy - 2, cx, cy + 15, cx - 7, cy - 2]).fill({ color: 0xffffff, alpha: 0.75 });
      g.poly([cx, cy - 15, cx + 7, cy - 2, cx, cy + 3]).fill(0xffffff);
      g.moveTo(cx, cy - 15).lineTo(cx, cy + 15).stroke({ width: 1, color: 0xffffff, alpha: 0.9 });
      return;
    case 'teia':
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 4) * i;
        g.moveTo(cx - Math.cos(a) * 13, cy - Math.sin(a) * 13)
          .lineTo(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13)
          .stroke({ width: 1.5, color: 0xffffff });
      }
      g.circle(cx, cy, 5).stroke({ width: 1.5, color: 0xffffff });
      g.circle(cx, cy, 10).stroke({ width: 1.5, color: 0xffffff, alpha: 0.8 });
      return;
  }
}


/** Marco 26 (D-124): a curva da vida (0 a 1) de cada `CurvaVida`. */
export function curva(c: CurvaVida | undefined, f: number): number {
  switch (c) {
    case 'sai':
      return 1 - (1 - f) * (1 - f) * (1 - f);
    case 'entra':
      return f * f;
    case 'pulso':
      return Math.sin(f * Math.PI);
    case 'sino':
      return f < 0.5 ? f * 2 : 2 - f * 2;
    default:
      return f;
  }
}

/** Marco 26 (D-124): a cor de uma lista de paradas na fração `f` da vida. */
export function corNasParadas(cores: readonly number[], f: number): number {
  if (cores.length === 1) return cores[0] ?? 0xffffff;
  const pos = Math.min(0.9999, Math.max(0, f)) * (cores.length - 1);
  const i = Math.floor(pos);
  return misturar(cores[i] ?? 0xffffff, cores[i + 1] ?? cores[i] ?? 0xffffff, pos - i);
}

/** A textura e a família de atlas dela (os dois atlas não se misturam num ParticleContainer). */
interface TexturaNoAtlas {
  t: Texture;
  rica: boolean;
}

export class SistemaParticulas {
  private readonly camada = new Container({ label: 'particulas' });
  private readonly normal: ParticleContainer;
  private readonly aditiva: ParticleContainer;
  /** Marco 26 (D-124): os contêineres do atlas rico (outra textura-base). */
  private readonly normalRica: ParticleContainer | null = null;
  private readonly aditivaRica: ParticleContainer | null = null;
  private readonly atlas: Texture;
  private readonly atlasRico: Texture | null = null;
  private readonly texturas = new Map<string, TexturaNoAtlas>();
  private readonly vivas: Viva[] = [];
  private readonly livres: Particle[] = [];
  /** Teto de partículas vivas, da qualidade atual. */
  limite = 300;
  /** Movimento reduzido: metade das partículas e sem giro. */
  reduzido = false;

  constructor(
    pai: Container,
    renderer: Renderer,
    private readonly projecao: () => Projecao,
  ) {
    pai.addChild(this.camada);
    const g = new Graphics();
    TEXTURAS_PARTICULA.forEach((tipo, i) => {
      desenharTextura(g, tipo, i * LADO);
    });
    // Um retângulo invisível garante a largura toda do atlas.
    g.rect(0, 0, TEXTURAS_PARTICULA.length * LADO, LADO).fill({ color: 0x000000, alpha: 0 });
    this.atlas = renderer.generateTexture({ target: g, resolution: 2, frame: new Rectangle(0, 0, TEXTURAS_PARTICULA.length * LADO, LADO) });
    g.destroy();
    TEXTURAS_PARTICULA.forEach((tipo, i) => {
      this.texturas.set(tipo, { t: new Texture({ source: this.atlas.source, frame: new Rectangle(i * LADO, 0, LADO, LADO) }), rica: false });
    });
    const dinamicas = { position: true, rotation: true, color: true, vertex: true, uvs: true };
    this.normal = new ParticleContainer({ texture: this.atlas, dynamicProperties: dinamicas });
    this.aditiva = new ParticleContainer({ texture: this.atlas, dynamicProperties: dinamicas });
    this.aditiva.blendMode = 'add';
    // Marco 26 (29/10/2026, D-124): o atlas rico, pintado em canvas (64 px vistos como 32: a mesma escala).
    const canvas = pintarAtlasRico();
    if (canvas) {
      const fonte = new CanvasSource({ resource: canvas, resolution: LADO_RICO / LADO });
      this.atlasRico = new Texture({ source: fonte });
      for (const nome of TEXTURAS_RICAS) {
        const c = celulaDaTextura(nome);
        const k = LADO / LADO_RICO;
        this.texturas.set(nome, { t: new Texture({ source: fonte, frame: new Rectangle(c.x * k, c.y * k, LADO, LADO) }), rica: true });
      }
      this.normalRica = new ParticleContainer({ texture: this.atlasRico, dynamicProperties: dinamicas });
      this.aditivaRica = new ParticleContainer({ texture: this.atlasRico, dynamicProperties: dinamicas });
      this.aditivaRica.blendMode = 'add';
    }
    this.camada.addChild(this.normal);
    if (this.normalRica) this.camada.addChild(this.normalRica);
    this.camada.addChild(this.aditiva);
    if (this.aditivaRica) this.camada.addChild(this.aditivaRica);
  }

  /** Quantas estão vivas (para o teto e para o diagnóstico/e2e). */
  get quantidade(): number {
    return this.vivas.length;
  }

  /** Marco 26 (D-124): a textura pelo nome (as peças, fitas e marcas usam as mesmas do atlas). */
  textura(nome: TexturaParticula | TexturaRica): Texture | null {
    return this.texturas.get(nome)?.t ?? null;
  }

  /** Marco 26 (D-124): o centro de uma célula na tela, na altura do corpo (como as emissões). */
  naTela(x: number, y: number): { x: number; y: number } {
    // A altura do corpo (e dos projéteis em voo) no isométrico: ALTURA_NO_AR células acima do chão.
    const proj = this.projecao();
    const c = centroDaCelula(x, y);
    const p = proj.projetar(c.x, c.y);
    return { x: p.x, y: p.y - (proj.visao === 'iso' ? CELULA_PX * ALTURA_NO_AR : 0) };
  }

  /** O centro de uma célula no chão (sem a altura do corpo): as marcas e o que brota. */
  noChao(x: number, y: number): { x: number; y: number } {
    const c = centroDaCelula(x, y);
    return this.projecao().projetar(c.x, c.y);
  }

  get iso(): boolean {
    return this.projecao().visao === 'iso';
  }

  /**
   * Emite um preset em (x, y) de célula; com `ate`, espalha ao longo do segmento (raio, relâmpago, rastro) — ou, nas
   * emissões em cone, aponta para lá. `dir` (em células) é a direção do voo, para as emissões `orientada` (D-067).
   */
  emitir(nome: NomePreset, x: number, y: number, cor: number, ate?: { x: number; y: number }, dir?: { x: number; y: number }): void {
    this.emitirLista(PRESETS_PARTICULA[nome], x, y, cor, ate, dir);
  }

  /** Marco 26 (D-124): emite uma lista de emissões (as das assinaturas), como `emitir`. */
  emitirLista(lista: readonly Emissao[], x: number, y: number, cor: number, ate?: { x: number; y: number }, dir?: { x: number; y: number }): void {
    if (this.limite <= 0) return;
    const a = this.naTela(x, y);
    const b = ate ? this.naTela(ate.x, ate.y) : null;
    // D-067: a direção do voo na tela (projetada), para as emissões orientadas.
    const d = dir ? this.naTela(x + dir.x, y + dir.y) : null;
    const anguloVoo = d ? Math.atan2(d.y - a.y, d.x - a.x) : null;
    for (const e of lista) this.nascer(e, a, b, anguloVoo, cor);
  }

  /** Marco 26 (D-124): emite em px de tela (as peças e fitas que já sabem onde estão). */
  emitirNaTela(lista: readonly Emissao[], x: number, y: number, cor: number, ate?: { x: number; y: number }, angulo?: number): void {
    if (this.limite <= 0) return;
    for (const e of lista) this.nascer(e, { x, y }, ate ?? null, angulo ?? null, cor);
  }

  private nascer(e: Emissao, a: { x: number; y: number }, b: { x: number; y: number } | null, anguloVoo: number | null, cor: number, filha = false): void {
    const quantidade = this.reduzido ? Math.ceil(e.quantidade / 2) : e.quantidade;
    // O cone vale com `ate` (aponta para lá); as outras formas com `ate` correm ao longo do segmento.
    const forma = e.forma === 'cone' ? 'cone' : b ? 'linha' : (e.forma ?? 'ponto');
    const fim = b ?? a;
    const tex = this.texturas.get(e.quadros?.[0] ?? e.textura);
    if (!tex) return;
    const destino = tex.rica ? (e.aditivo ? this.aditivaRica : this.normalRica) : e.aditivo ? this.aditiva : this.normal;
    if (!destino) return;
    for (let i = 0; i < quantidade && this.vivas.length < this.limite; i++) {
      let ox = a.x;
      let oy = a.y;
      let angulo: number;
      if (forma === 'anel' || forma === 'espiral') {
        const t = (i / quantidade) * Math.PI * 2 + entre(-0.1, 0.1);
        ox += Math.cos(t) * e.raio;
        oy += Math.sin(t) * e.raio;
        // Espiral: a velocidade sai tangente (o redemoinho gira em volta do centro).
        angulo = forma === 'espiral' ? t + Math.PI / 2 : t;
      } else {
        if (forma === 'linha') {
          const t = Math.random();
          ox += (fim.x - a.x) * t;
          oy += (fim.y - a.y) * t;
        }
        ox += entre(-e.raio, e.raio);
        oy += entre(-e.raio, e.raio);
        const abertura = e.abertura ?? (forma === 'cone' ? 0.5 : e.direcao === 'baixo' ? 0.5 : 0.7);
        angulo =
          forma === 'cone'
            ? Math.atan2(fim.y - a.y, fim.x - a.x) + entre(-abertura, abertura)
            : e.direcao === 'orientada'
              ? (anguloVoo ?? entre(0, Math.PI * 2)) + entre(-(e.abertura ?? 0), e.abertura ?? 0)
              : e.direcao === 'cima'
                ? -Math.PI / 2 + entre(-abertura, abertura)
                : e.direcao === 'baixo'
                  ? Math.PI / 2 + entre(-abertura, abertura)
                  : e.direcao === 'fora'
                    ? Math.atan2(oy - a.y, ox - a.x)
                    : entre(0, Math.PI * 2);
      }
      oy -= e.alturaInicial ?? 0;
      const v = entre(e.velocidade[0], e.velocidade[1]);
      const p = this.livres.pop() ?? new Particle({ texture: tex.t, anchorX: 0.5, anchorY: 0.5 });
      p.texture = tex.t;
      p.x = ox;
      p.y = oy;
      p.scaleX = e.escala[0];
      p.scaleY = e.escala[0];
      // Faísca, lasca, gota e flecha apontam para onde voam (a orientada, para a direção pedida, mesmo parada).
      // Marco 24 (D-098): o corte em anel ou espiral sai tangente (as lâminas do giro em volta do corpo).
      const aponta = APONTAM.has(e.textura) || (e.textura === 'corte' && (forma === 'anel' || forma === 'espiral'));
      p.rotation = ERETAS.has(e.textura) ? entre(-0.12, 0.12) : aponta || e.direcao === 'orientada' || e.esticar ? angulo + Math.PI / 2 : e.textura === 'corte' ? entre(-0.6, 0.6) : entre(0, Math.PI * 2);
      const cores = e.cores?.map((c) => c ?? cor);
      const corInicial = cores?.[0] ?? e.cor ?? cor;
      p.tint = corInicial;
      p.alpha = e.alpha[0];
      destino.addParticle(p);
      this.vivas.push({
        p,
        destino,
        vx: Math.cos(angulo) * v,
        vy: Math.sin(angulo) * v,
        gravidade: e.gravidade,
        idadeMs: 0,
        vidaMs: entre(e.vidaMs[0], e.vidaMs[1]),
        escala: e.escala,
        alpha: e.alpha,
        cor: corInicial,
        corFinal: e.corFinal ?? null,
        giro: e.giro && !this.reduzido ? entre(e.giro[0], e.giro[1]) : 0,
        arrasto: e.arrasto ?? 0,
        quadros: e.quadros ? e.quadros.map((q) => this.texturas.get(q)?.t ?? tex.t) : null,
        quadro0: Math.floor(Math.random() * 8),
        esticar: e.esticar ?? 0,
        curvaEscala: e.curvaEscala,
        curvaAlpha: e.curvaAlpha,
        cores: cores ?? null,
        turbulencia: e.turbulencia ?? 0,
        fase: Math.random() * Math.PI * 2,
        aoMorrer: filha ? null : (e.aoMorrer ?? null),
      });
    }
  }

  private soltar(v: Viva): void {
    v.destino.removeParticle(v.p);
    this.livres.push(v.p);
  }

  atualizar(dtMs: number): void {
    const dt = dtMs / 1000;
    for (let i = this.vivas.length - 1; i >= 0; i--) {
      const v = this.vivas[i];
      if (!v) continue;
      v.idadeMs += dtMs;
      if (v.idadeMs >= v.vidaMs) {
        this.soltar(v);
        this.vivas.splice(i, 1);
        // Marco 26 (D-124): o que nasce quando morre (uma geração só: as filhas não têm `aoMorrer` encadeado).
        if (v.aoMorrer) for (const e of v.aoMorrer) this.nascer(e, { x: v.p.x, y: v.p.y }, null, null, v.cor, true);
        continue;
      }
      const f = v.idadeMs / v.vidaMs;
      if (v.arrasto > 0) {
        const freio = Math.max(0, 1 - v.arrasto * dt);
        v.vx *= freio;
        v.vy *= freio;
      }
      v.vy += v.gravidade * dt;
      if (v.turbulencia > 0) {
        // Ruído barato: senos da posição e da idade, com a fase da partícula (sobe ondulando).
        v.vx += Math.sin(v.p.y * 0.09 + v.idadeMs * 0.008 + v.fase) * v.turbulencia * dt * 6;
      }
      const p = v.p;
      p.x += v.vx * dt;
      p.y += v.vy * dt;
      const s = v.escala[0] + (v.escala[1] - v.escala[0]) * curva(v.curvaEscala, f);
      if (v.esticar > 0) {
        const rapidez = Math.hypot(v.vx, v.vy);
        p.rotation = Math.atan2(v.vy, v.vx) + Math.PI / 2;
        p.scaleX = s;
        p.scaleY = s * (1 + (v.esticar * rapidez) / 200);
      } else {
        p.scaleX = s;
        p.scaleY = s;
      }
      p.alpha = v.alpha[0] + (v.alpha[1] - v.alpha[0]) * curva(v.curvaAlpha, f);
      if (v.giro !== 0) p.rotation += v.giro * dt;
      if (v.cores) p.tint = corNasParadas(v.cores, f);
      else if (v.corFinal !== null) p.tint = misturar(v.cor, v.corFinal, f);
      if (v.quadros) {
        // O flipbook roda a ~16 quadros/s, começando de um quadro sorteado (as chamas não tremulam juntas).
        const q = v.quadros[(v.quadro0 + Math.floor(v.idadeMs / 60)) % v.quadros.length];
        if (q && p.texture !== q) p.texture = q;
      }
    }
  }

  /** Some com todas as partículas (qualidade "mínimo" ou troca de fase). */
  limpar(): void {
    for (const v of this.vivas) this.soltar(v);
    this.vivas.length = 0;
  }

  destruir(): void {
    this.limpar();
    this.livres.length = 0;
    for (const t of this.texturas.values()) t.t.destroy(false);
    this.atlas.destroy(true);
    this.atlasRico?.destroy(true);
    this.camada.destroy({ children: true });
  }
}

/** Texturas que apontam para onde voam. */
const APONTAM: ReadonlySet<string> = new Set(['faisca', 'lasca', 'gota', 'flecha', 'gelo', 'pena', 'estilhaco', 'lamina', 'gota_viva']);
/** Marco 26 (D-124): texturas que ficam de pé (a chama sobe, a mão brota, o olho não gira). */
const ERETAS: ReadonlySet<string> = new Set(['chama0', 'chama1', 'chama2', 'chama3', 'chama4', 'chama5', 'chama6', 'chama7', 'alma', 'cranio', 'mao_ossea', 'espinho', 'olho', 'mira_alvo', 'onda_som', 'asa']);
