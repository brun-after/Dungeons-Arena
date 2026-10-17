// Telegrafia no chão e projéteis (§1.3 pilar 2, §2.6): toda ação ofensiva mostra, durante a
// conjuração, onde vai cair — área com preenchimento que cresce até o impacto, linha de mira
// para golpe e projétil — e o projétil fica visível durante a viagem. Só lê o estado.
// Marco 13 (14/10/2026): a telegrafia do chão segue a matriz do plano; o projétil, em pé, é projetado.
// Marco 14 (14/10/2026): a habilidade vem pela chave da ação; linha, cone e ao redor desenham as mesmas células
// que a simulação atinge (combat/formas.ts); as de suporte ficam na cor própria.
// Ajuste de 15/10/2026 (D-060): a área deixa de ser a hitbox pintada. Vira uma mancha orgânica que cobre as células
// (render/formas-visuais.ts): preenchimento suave na cor do elemento, borda na cor da equipe e o miolo crescendo até
// o impacto. "Mostrar a área exata" (Configurações) desenha as células por cima.
// Marco 11A (16/10/2026, D-066): com partículas ligadas, nada de forma plana — a área enche de luz na cor do elemento
// (mais densa conforme o impacto chega), o contorno é feito de pontos na cor de quem ataca, a mira é um fio de
// partículas e o projétil é um núcleo de luz. As formas desenhadas ficam só para a qualidade sem partículas.

import { Graphics, type Container } from 'pixi.js';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { DT_MS } from '../core/loop';
import { resolverHabilidade } from '../combat/compilar-habilidade';
import { celulasDaForma, deSuporte } from '../combat/formas';
import { relacao } from '../modos/relacao';
import { CELULA_PX } from './camera-calculo';
import { contornoDaArea, escalarContorno, type Contorno } from './formas-visuais';
import type { SistemaParticulas } from './particulas';
import { centroDaCelula, type Projecao } from './projecao';
import { visualDe } from './visual-habilidade';
import type { Celula } from '../core/comandos';

/** De quanto em quanto tempo cada ação solta as partículas da telegrafia. */
const INTERVALO_TELEGRAFO_MS = 70;
const INTERVALO_MIRA_MS = 90;

const sortear = <T>(lista: readonly T[]): T | undefined => lista[Math.floor(Math.random() * lista.length)];

/** As células da área que tocam uma de fora (o contorno, em células). */
function bordaDe(celulas: readonly Celula[]): Celula[] {
  const dentro = new Set(celulas.map((c) => `${c.x},${c.y}`));
  return celulas.filter((c) => !dentro.has(`${c.x + 1},${c.y}`) || !dentro.has(`${c.x - 1},${c.y}`) || !dentro.has(`${c.x},${c.y + 1}`) || !dentro.has(`${c.x},${c.y - 1}`));
}

const COR_HOSTIL = 0xff5a3c;
const COR_PROPRIA = 0x5dade2;

const corDe = (hex: string) => Number.parseInt(hex.slice(1), 16);

export class CamadaTelegrafia {
  private readonly chao = new Graphics();
  private readonly voo = new Graphics();
  /** Contorno por ação (o mesmo do começo ao fim da conjuração). */
  private readonly contornos = new Map<number, Contorno>();
  /** Marco 11A: última emissão de partículas por ação (telegrafia em partículas). */
  private readonly ultimaEmissao = new Map<number, number>();

  constructor(
    camadaChao: Container,
    camadaVoo: Container,
    private readonly projecao: () => Projecao,
    /** Ajuste de 15/10/2026: desenhar também as células exatas da hitbox. */
    private readonly areaExata: () => boolean = () => false,
    /** Marco 11A: com partículas (qualidade acima do mínimo), a forma do ataque é toda partícula. */
    private readonly particulas: SistemaParticulas | null = null,
  ) {
    camadaChao.addChild(this.chao);
    camadaVoo.addChild(this.voo);
  }

  desenhar(estado: EstadoJogo, ctx: ContextoSimulacao, idLocal: string, alpha: number): void {
    const chao = this.chao.clear();
    const voo = this.voo.clear();
    const local = estado.entidades.find((e) => e.id === idLocal);
    const tickVisual = estado.tick + alpha;
    const agora = performance.now();
    const p = this.particulas && this.particulas.limite > 0 ? this.particulas : null;
    const vez = (id: number, intervalo: number) => {
      if (agora - (this.ultimaEmissao.get(id) ?? -Infinity) < intervalo) return false;
      this.ultimaEmissao.set(id, agora);
      return true;
    };

    const vistas = new Set<number>();
    for (const e of estado.entidades) {
      const a = e.acao;
      if (!a) continue;
      const base = resolverHabilidade(ctx, a.chave);
      const hab = base && a.raioCombo ? { ...base, raioArea: a.raioCombo } : base;
      if (!hab || hab.politicaImpacto === 'proprio') continue;
      const cor = deSuporte(hab) || (local && relacao(local, e, ctx.modo) === 'proprio') ? COR_PROPRIA : COR_HOSTIL;
      const fracao = Math.min(1, Math.max(0, (tickVisual - a.inicioTick) / Math.max(1, a.lancamentoTick - a.inicioTick)));

      if (hab.politicaImpacto === 'area') {
        const celulas = celulasDaForma(hab, { x: e.x, y: e.y }, { x: a.alvoX, y: a.alvoY }, ctx.fase);
        let contorno = this.contornos.get(a.acaoId);
        if (!contorno) {
          // Linha e cone saem de quem conjura (o miolo cresce a partir dele); as demais são redondas.
          const origem = centroDaCelula(e.x, e.y);
          const desenho = hab.tipoArea === 'linha' ? { tipo: 'faixa' as const, origem } : hab.tipoArea === 'cone' ? { tipo: 'leque' as const, origem } : { tipo: 'radial' as const };
          contorno = contornoDaArea(celulas, a.acaoId, desenho);
          this.contornos.set(a.acaoId, contorno);
        }
        vistas.add(a.acaoId);
        if (contorno.pontos.length === 0) continue;
        const elemento = hab.elemento ? ctx.conteudo.elementos.get(hab.elemento)?.cor : undefined;
        const fundo = elemento ? corDe(elemento) : visualDe(hab).cor;
        if (p) {
          // A área em partículas: o miolo enche conforme o impacto chega; a borda, em pontos na cor de quem ataca.
          if (vez(a.acaoId, INTERVALO_TELEGRAFO_MS)) {
            const miolo = Math.min(celulas.length, 2 + Math.round(10 * fracao));
            for (let i = 0; i < miolo; i++) {
              const c = sortear(celulas);
              if (c) p.emitir('telegrafo', c.x, c.y, fundo);
            }
            const borda = bordaDe(celulas);
            for (let i = 0; i < Math.min(borda.length, 3 + Math.round(3 * fracao)); i++) {
              const c = sortear(borda);
              if (c) p.emitir('borda', c.x, c.y, cor);
            }
          }
          if (this.areaExata()) {
            for (const c of celulas) chao.rect(c.x * CELULA_PX + 2, c.y * CELULA_PX + 2, CELULA_PX - 4, CELULA_PX - 4).stroke({ width: 1, color: cor, alpha: 0.6 });
          }
          continue;
        }
        // Preenchimento suave: camadas concêntricas mais densas no centro; a borda diz de quem é.
        chao.poly(escalarContorno(contorno, 1)).fill({ color: fundo, alpha: 0.1 });
        chao.poly(escalarContorno(contorno, 0.72)).fill({ color: fundo, alpha: 0.07 });
        chao.poly(escalarContorno(contorno, 0.42)).fill({ color: fundo, alpha: 0.06 });
        chao.poly(escalarContorno(contorno, 1)).stroke({ width: 2, color: cor, alpha: 0.75 });
        // O miolo cresce do centro até cobrir a área no tick do impacto: a contagem visível.
        if (fracao > 0) chao.poly(escalarContorno(contorno, fracao)).fill({ color: fundo, alpha: 0.22 });
        if (this.areaExata()) {
          for (const c of celulas) chao.rect(c.x * CELULA_PX + 2, c.y * CELULA_PX + 2, CELULA_PX - 4, CELULA_PX - 4).stroke({ width: 1, color: cor, alpha: 0.6 });
        }
      } else {
        const ox = (e.x + 0.5) * CELULA_PX;
        const oy = (e.y + 0.5) * CELULA_PX;
        const alvo = a.alvoId ? estado.entidades.find((x) => x.id === a.alvoId) : undefined;
        const tx = ((alvo?.x ?? a.alvoX) + 0.5) * CELULA_PX;
        const ty = ((alvo?.y ?? a.alvoY) + 0.5) * CELULA_PX;
        if (p) {
          // A mira em partículas: um fio de pontos de quem ataca até o alvo.
          if (vez(a.acaoId, INTERVALO_MIRA_MS)) p.emitir('mira', e.x, e.y, cor, { x: alvo?.x ?? a.alvoX, y: alvo?.y ?? a.alvoY });
          vistas.add(a.acaoId);
          continue;
        }
        chao.moveTo(ox, oy).lineTo(tx, ty).stroke({ width: 2, color: cor, alpha: 0.35 + 0.5 * fracao });
      }
    }

    for (const id of this.contornos.keys()) if (!vistas.has(id)) this.contornos.delete(id);
    for (const id of this.ultimaEmissao.keys()) if (!vistas.has(id)) this.ultimaEmissao.delete(id);
    const proj = this.projecao();
    // No isométrico o projétil voa um pouco acima do chão (na altura do peito).
    const altura = proj.visao === 'iso' ? CELULA_PX * 0.45 : 0;
    const particulas = this.particulas && this.particulas.limite > 0 ? this.particulas : null;
    for (const p of estado.projeteis) {
      const avanco = (p.velocidade * alpha * DT_MS) / 1000;
      const c = centroDaCelula(p.x + p.dirX * avanco, p.y + p.dirY * avanco);
      const { x, y: yChao } = proj.projetar(c.x, c.y);
      const y = yChao - altura;
      const atras = proj.projetar(c.x - p.dirX * CELULA_PX * 0.6, c.y - p.dirY * CELULA_PX * 0.6);
      const dono = estado.entidades.find((e) => e.id === p.donoId);
      const cor = dono && local && relacao(local, dono, ctx.modo) === 'proprio' ? COR_PROPRIA : COR_HOSTIL;
      // Ajuste de 16/10/2026 (D-067): o corpo segue a forma do projétil — flecha orientada, teia ou o núcleo de luz.
      const hab = resolverHabilidade(ctx, p.chave);
      const visual = hab ? visualDe(hab) : null;
      const forma = visual?.projetil ?? 'orbe';
      if (particulas) {
        const preset = forma === 'flecha' ? 'projetil_flecha' : forma === 'teia' ? 'projetil_teia' : 'projetil';
        particulas.emitir(preset, p.x + p.dirX * avanco, p.y + p.dirY * avanco, visual?.cor ?? cor, undefined, { x: p.dirX, y: p.dirY });
        continue;
      }
      // Sem partículas: o rastro curto atrás mostra a trajetória (2 px, como os outros traços de reserva).
      voo.moveTo(atras.x, atras.y - altura).lineTo(x, y).stroke({ width: 2, color: cor, alpha: 0.5 });
      if (forma === 'flecha') {
        const ang = Math.atan2(y - (atras.y - altura), x - atras.x);
        const ponta = (d: number, a: number) => ({ x: x + Math.cos(ang + a) * d, y: y + Math.sin(ang + a) * d });
        const e = ponta(6, Math.PI - 0.5);
        const dd = ponta(6, Math.PI + 0.5);
        voo.moveTo(e.x, e.y).lineTo(x, y).lineTo(dd.x, dd.y).stroke({ width: 2, color: 0xffffff, alpha: 0.9 });
      } else {
        voo.circle(x, y, 6).fill(cor).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
      }
      if (altura > 0) voo.ellipse(x, yChao, 5, 2.5).fill({ color: 0x000000, alpha: 0.3 });
    }
  }

  destruir(): void {
    this.chao.destroy();
    this.voo.destroy();
  }
}
