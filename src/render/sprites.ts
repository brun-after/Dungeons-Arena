// Marcadores das entidades (os modelos de criatura e a caminhada por fatias entram nos marcos
// 12 e 13): corpo, seta de direção, barra de HP, sub-barra de recurso, **barra de conjuração**
// (a telegrafia, §2.15), anel de alvo e anel de atordoamento. Cor pela `relacao()` com o
// jogador local (§2.13: "cor por equipe").

import { Container, Graphics } from 'pixi.js';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { movimentoBloqueado } from '../combat/efeitos';
import type { Entidade } from '../entities/entidade';
import { relacao } from '../modos/relacao';
import { CELULA_PX } from './camera-calculo';
import type { Interpolador } from './interpolacao';

const COR_PROPRIO = 0x3498db;
const COR_ALIADO = 0x27ae60;
const COR_HOSTIL = 0xe74c3c;
const COR_NEUTRO = 0x95a5a6;
const RAIO = CELULA_PX * 0.32;
const LARGURA_BARRA = CELULA_PX * 0.84;

/** Cor da barra de HP por faixa (§2.15). */
export function corDoHp(fracao: number): number {
  if (fracao > 0.5) return 0x27ae60;
  if (fracao > 0.25) return 0xf39c12;
  return 0xe74c3c;
}

interface Marcador {
  raiz: Container;
  corpo: Graphics;
  seta: Graphics;
  barras: Graphics;
  aneis: Graphics;
  angulo: number;
  ultimoX: number;
  ultimoY: number;
  escala: number;
}

export class CamadaEntidades {
  private readonly marcadores = new Map<string, Marcador>();

  constructor(
    private readonly camada: Container,
    private readonly idLocal: string,
  ) {}

  private criar(e: Entidade, cor: number): Marcador {
    const raiz = new Container({ label: e.id });
    const escala = e.arquetipo === 'boss' ? 1.35 : 1;
    const sombra = new Graphics().ellipse(0, RAIO * 0.9, RAIO * 0.9, RAIO * 0.35).fill({ color: 0x000000, alpha: 0.35 });
    const aneis = new Graphics();
    const corpo = new Graphics();
    const forma = e.arquetipo === 'boneco' ? 'quadrado' : 'circulo';
    if (forma === 'quadrado') corpo.roundRect(-RAIO, -RAIO, RAIO * 2, RAIO * 2, 6).fill(cor).stroke({ width: 2, color: 0x0d0b12 });
    else corpo.circle(0, 0, RAIO).fill(cor).stroke({ width: 2, color: 0x0d0b12 });
    const seta = new Graphics().poly([RAIO * 0.35, -RAIO * 0.45, RAIO * 1.05, 0, RAIO * 0.35, RAIO * 0.45]).fill(0xece8f4);
    const barras = new Graphics();
    corpo.scale.set(escala);
    seta.scale.set(escala);
    raiz.addChild(sombra, aneis, corpo, seta, barras);
    this.camada.addChild(raiz);
    return { raiz, corpo, seta, barras, aneis, angulo: 0, ultimoX: e.x, ultimoY: e.y, escala };
  }

  desenhar(estado: EstadoJogo, ctx: ContextoSimulacao, interp: Interpolador, alpha: number): void {
    const local = estado.entidades.find((e) => e.id === this.idLocal);
    const vistos = new Set<string>();
    const tickVisual = estado.tick + alpha;

    for (const e of estado.entidades) {
      vistos.add(e.id);
      let m = this.marcadores.get(e.id);
      if (!m) {
        const r = local ? relacao(local, e, ctx.modo) : 'neutro';
        const cor = r === 'proprio' ? COR_PROPRIO : r === 'aliado' ? COR_ALIADO : r === 'hostil' ? COR_HOSTIL : COR_NEUTRO;
        m = this.criar(e, cor);
        this.marcadores.set(e.id, m);
      }
      const dx = e.destinoX - e.x || e.x - m.ultimoX;
      const dy = e.destinoY - e.y || e.y - m.ultimoY;
      if (dx !== 0 || dy !== 0) m.angulo = Math.atan2(dy, dx);
      if (e.acao) m.angulo = Math.atan2(e.acao.alvoY - e.y, e.acao.alvoX - e.x) || m.angulo;
      m.ultimoX = e.x;
      m.ultimoY = e.y;

      const p = interp.posicao(e, alpha);
      m.raiz.position.set((p.x + 0.5) * CELULA_PX, (p.y + 0.5) * CELULA_PX);
      m.seta.rotation = m.angulo;
      m.seta.visible = e.arquetipo !== 'boneco';
      // Morto fica apagado; invisível (pós-morte) fica translúcido.
      m.raiz.alpha = e.morto ? 0.25 : e.invisivelAteTick > estado.tick ? 0.5 : 1;

      this.desenharAneis(m, e, estado, local?.alvoSelecionado === e.id);
      this.desenharBarras(m, e, tickVisual, e.id === this.idLocal);
    }

    for (const [id, m] of this.marcadores) {
      if (vistos.has(id)) continue;
      m.raiz.destroy({ children: true });
      this.marcadores.delete(id);
      interp.esquecer(id);
    }
    this.camada.children.sort((a, b) => a.position.y - b.position.y);
  }

  private desenharAneis(m: Marcador, e: Entidade, estado: EstadoJogo, selecionado: boolean): void {
    const g = m.aneis.clear();
    if (selecionado) g.circle(0, 0, RAIO * m.escala + 6).stroke({ width: 2, color: 0xf1c40f, alpha: 0.9 });
    if (!e.morto && movimentoBloqueado(e, estado.tick)) {
      g.circle(0, -RAIO * m.escala - 4, 5).fill(0xf1c40f).stroke({ width: 1, color: 0x000000 });
    }
  }

  private desenharBarras(m: Marcador, e: Entidade, tickVisual: number, proprio: boolean): void {
    const g = m.barras.clear();
    if (e.morto) return;
    const largura = LARGURA_BARRA * (m.escala > 1 ? 1.3 : 1);
    const x = -largura / 2;
    let y = -RAIO * m.escala - 14;

    // Barra de conjuração: a telegrafia que dá ao oponente a chance de reagir (§1.3, §2.15).
    if (e.acao) {
      const total = Math.max(1, e.acao.lancamentoTick - e.acao.inicioTick);
      const fracao = Math.min(1, Math.max(0, (tickVisual - e.acao.inicioTick) / total));
      g.rect(x - 1, y - 9, largura + 2, 7).fill({ color: 0x000000, alpha: 0.75 });
      g.rect(x, y - 8, largura * fracao, 5).fill(proprio ? 0x5dade2 : 0xff7b54);
    }

    const fracaoHp = e.hp / Math.max(1, e.hpMax);
    g.rect(x - 1, y - 1, largura + 2, proprio ? 9 : 6).fill({ color: 0x000000, alpha: 0.7 });
    g.rect(x, y, largura * fracaoHp, 4).fill(corDoHp(fracaoHp));
    if (proprio) {
      y += 5;
      g.rect(x, y, largura * (e.mana / Math.max(1, e.manaMax)), 2).fill(0x5dade2);
    }
  }

  destruir(): void {
    for (const m of this.marcadores.values()) m.raiz.destroy({ children: true });
    this.marcadores.clear();
  }
}
