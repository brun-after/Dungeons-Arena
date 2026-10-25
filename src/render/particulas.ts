// Sistema de partículas (§2.16). Marco 12 (14/10/2026), D-056. Texturas geradas uma vez (ponto, brilho,
// fumaça, anel, estrela, faísca) e sprites reaproveitados num pool. Vivem em coordenadas de mundo, então
// acompanham câmera e zoom. O teto vem da qualidade (§4.10): no mínimo, nenhuma partícula. Usa um PRNG
// visual próprio (Math.random): nunca consome a sequência da simulação (§2.1).
// Marco 13 (14/10/2026): a origem é projetada (de cima ou isométrica); a partícula voa no espaço da tela.
// Marco 11A (16/10/2026, D-066): ParticleContainer do Pixi (dois: aditivo e normal) com todas as texturas num atlas
// só, gerado uma vez — muito mais partículas pelo mesmo custo. Formas de emissão, cor ao longo da vida, giro e
// arrasto. Com movimento reduzido, metade das partículas e nada de giro.

import { Container, Graphics, Particle, ParticleContainer, Rectangle, Texture, type Renderer } from 'pixi.js';
import { CELULA_PX } from './camera-calculo';
import { centroDaCelula, type Projecao } from './projecao';
import { PRESETS_PARTICULA, TEXTURAS_PARTICULA, type Emissao, type NomePreset, type TexturaParticula } from './presets-particula';

interface Viva {
  p: Particle;
  aditiva: boolean;
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

export class SistemaParticulas {
  private readonly camada = new Container({ label: 'particulas' });
  private readonly normal: ParticleContainer;
  private readonly aditiva: ParticleContainer;
  private readonly atlas: Texture;
  private readonly texturas = new Map<TexturaParticula, Texture>();
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
      this.texturas.set(tipo, new Texture({ source: this.atlas.source, frame: new Rectangle(i * LADO, 0, LADO, LADO) }));
    });
    const dinamicas = { position: true, rotation: true, color: true, vertex: true, uvs: true };
    this.normal = new ParticleContainer({ texture: this.atlas, dynamicProperties: dinamicas });
    this.aditiva = new ParticleContainer({ texture: this.atlas, dynamicProperties: dinamicas });
    this.aditiva.blendMode = 'add';
    this.camada.addChild(this.normal, this.aditiva);
  }

  /** Quantas estão vivas (para o teto e para o diagnóstico/e2e). */
  get quantidade(): number {
    return this.vivas.length;
  }

  /**
   * Emite um preset em (x, y) de célula; com `ate`, espalha ao longo do segmento (raio, relâmpago, rastro) — ou, nas
   * emissões em cone, aponta para lá. `dir` (em células) é a direção do voo, para as emissões `orientada` (D-067).
   */
  emitir(nome: NomePreset, x: number, y: number, cor: number, ate?: { x: number; y: number }, dir?: { x: number; y: number }): void {
    if (this.limite <= 0) return;
    for (const e of PRESETS_PARTICULA[nome]) this.emitirUma(e, x, y, cor, ate, dir);
  }

  private emitirUma(e: Emissao, x: number, y: number, cor: number, ate?: { x: number; y: number }, dir?: { x: number; y: number }): void {
    const proj = this.projecao();
    // No isométrico, os efeitos saem do meio do corpo, não do chão.
    const elevacao = proj.visao === 'iso' ? CELULA_PX * 0.4 : 0;
    const centro = (cx: number, cy: number) => {
      const c = centroDaCelula(cx, cy);
      const p = proj.projetar(c.x, c.y);
      return { x: p.x, y: p.y - elevacao };
    };
    const a = centro(x, y);
    const b = ate ? centro(ate.x, ate.y) : a;
    // D-067: a direção do voo na tela (projetada), para as emissões orientadas.
    const d = dir ? centro(x + dir.x, y + dir.y) : null;
    const anguloVoo = d ? Math.atan2(d.y - a.y, d.x - a.x) : null;
    const quantidade = this.reduzido ? Math.ceil(e.quantidade / 2) : e.quantidade;
    // O cone vale com `ate` (aponta para lá); as outras formas com `ate` correm ao longo do segmento.
    const forma = e.forma === 'cone' ? 'cone' : ate ? 'linha' : (e.forma ?? 'ponto');
    const textura = this.texturas.get(e.textura);
    if (!textura) return;
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
          ox += (b.x - a.x) * t;
          oy += (b.y - a.y) * t;
        }
        ox += entre(-e.raio, e.raio);
        oy += entre(-e.raio, e.raio);
        const abertura = e.abertura ?? (forma === 'cone' ? 0.5 : e.direcao === 'baixo' ? 0.5 : 0.7);
        angulo =
          forma === 'cone'
            ? Math.atan2(b.y - a.y, b.x - a.x) + entre(-abertura, abertura)
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
      const p = this.livres.pop() ?? new Particle({ texture: textura, anchorX: 0.5, anchorY: 0.5 });
      p.texture = textura;
      p.x = ox;
      p.y = oy;
      p.scaleX = e.escala[0];
      p.scaleY = e.escala[0];
      // Faísca, lasca, gota e flecha apontam para onde voam (a orientada, para a direção pedida, mesmo parada).
      // Marco 24 (D-098): o corte em anel ou espiral sai tangente (as lâminas do giro em volta do corpo).
      const aponta = e.textura === 'faisca' || e.textura === 'lasca' || e.textura === 'gota' || e.textura === 'flecha' || (e.textura === 'corte' && (forma === 'anel' || forma === 'espiral'));
      p.rotation = aponta || e.direcao === 'orientada' ? angulo + Math.PI / 2 : e.textura === 'corte' ? entre(-0.6, 0.6) : entre(0, Math.PI * 2);
      const corInicial = e.cor ?? cor;
      p.tint = corInicial;
      p.alpha = e.alpha[0];
      (e.aditivo ? this.aditiva : this.normal).addParticle(p);
      this.vivas.push({
        p,
        aditiva: e.aditivo,
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
      });
    }
  }

  private soltar(v: Viva): void {
    (v.aditiva ? this.aditiva : this.normal).removeParticle(v.p);
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
        continue;
      }
      const f = v.idadeMs / v.vidaMs;
      if (v.arrasto > 0) {
        const freio = Math.max(0, 1 - v.arrasto * dt);
        v.vx *= freio;
        v.vy *= freio;
      }
      v.vy += v.gravidade * dt;
      const p = v.p;
      p.x += v.vx * dt;
      p.y += v.vy * dt;
      const s = v.escala[0] + (v.escala[1] - v.escala[0]) * f;
      p.scaleX = s;
      p.scaleY = s;
      p.alpha = v.alpha[0] + (v.alpha[1] - v.alpha[0]) * f;
      if (v.giro !== 0) p.rotation += v.giro * dt;
      if (v.corFinal !== null) p.tint = misturar(v.cor, v.corFinal, f);
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
    for (const t of this.texturas.values()) t.destroy(false);
    this.atlas.destroy(true);
    this.camada.destroy({ children: true });
  }
}
