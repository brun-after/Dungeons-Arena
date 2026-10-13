// Marcadores das entidades (os modelos de criatura e a caminhada por fatias entram nos marcos
// 12 e 13): corpo, seta de direção, barra de HP, sub-barra de recurso, **barra de conjuração**
// (a telegrafia, §2.15), anel de alvo e anel de atordoamento. Cor pela `relacao()` com o
// jogador local (§2.13: "cor por equipe").

import { Container, Graphics, Text } from 'pixi.js';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { movimentoBloqueado } from '../combat/efeitos';
import type { Arquetipo, Entidade } from '../entities/entidade';
import { relacao } from '../modos/relacao';
import { CELULA_PX } from './camera-calculo';
import type { PontoVisual } from './interpolacao';

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

/**
 * Silhueta por arquétipo (§2.6): a ameaça se distingue pela forma, não só pela cor.
 * Perseguidor = triângulo; atirador = losango; controlador = hexágono; boss = círculo com coroa;
 * boneco = quadrado; jogador = círculo.
 */
function desenharSilhueta(g: Graphics, arquetipo: Arquetipo, cor: number): Graphics {
  const contorno = { width: 2, color: 0x0d0b12 };
  const r = RAIO;
  switch (arquetipo) {
    case 'perseguidor':
      return g.poly([0, -r * 1.1, r, r * 0.8, -r, r * 0.8]).fill(cor).stroke(contorno);
    case 'atirador':
      return g.poly([0, -r * 1.1, r * 0.9, 0, 0, r * 1.1, -r * 0.9, 0]).fill(cor).stroke(contorno);
    case 'controlador': {
      const pontos: number[] = [];
      for (let i = 0; i < 6; i++) pontos.push(Math.cos((Math.PI / 3) * i) * r, Math.sin((Math.PI / 3) * i) * r);
      return g.poly(pontos).fill(cor).stroke(contorno);
    }
    case 'boss':
      g.circle(0, 0, r).fill(cor).stroke(contorno);
      return g.poly([-r * 0.6, -r * 0.7, -r * 0.35, -r * 1.25, 0, -r * 0.8, r * 0.35, -r * 1.25, r * 0.6, -r * 0.7]).fill(0xf1c40f).stroke(contorno);
    case 'boneco':
      return g.roundRect(-r, -r, r * 2, r * 2, 6).fill(cor).stroke(contorno);
    case 'jogador':
      return g.circle(0, 0, r).fill(cor).stroke(contorno);
  }
}

/** "?" enquanto hesita; "!" por um segundo ao começar a perseguir. */
function textoIndicador(e: Entidade, tick: number): string {
  if (!e.ia || e.morto) return '';
  if (e.ia.modo === 'hesitando') return '?';
  if (e.ia.modo === 'perseguindo' && tick - e.ia.modoDesdeTick < 60) return '!';
  return '';
}

interface Marcador {
  raiz: Container;
  corpo: Graphics;
  seta: Graphics;
  barras: Graphics;
  aneis: Graphics;
  indicador: Text;
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
    const corpo = desenharSilhueta(new Graphics(), e.arquetipo, cor);
    const seta = new Graphics().poly([RAIO * 0.35, -RAIO * 0.45, RAIO * 1.05, 0, RAIO * 0.35, RAIO * 0.45]).fill(0xece8f4);
    const barras = new Graphics();
    const indicador = new Text({
      text: '',
      style: { fontFamily: 'system-ui, sans-serif', fontSize: 20, fontWeight: '800', fill: 0xf1c40f, stroke: { color: 0x000000, width: 4 } },
    });
    indicador.anchor.set(0.5, 1);
    indicador.position.set(0, -RAIO * escala - 22);
    corpo.scale.set(escala);
    seta.scale.set(escala);
    raiz.addChild(sombra, aneis, corpo, seta, barras, indicador);
    this.camada.addChild(raiz);
    return { raiz, corpo, seta, barras, aneis, indicador, angulo: 0, ultimoX: e.x, ultimoY: e.y, escala };
  }

  /**
   * posicao diz onde desenhar cada entidade: na campanha, a interpolação entre ticks; na arena,
   * a predição para o próprio jogador e a interpolação remota para os outros.
   */
  desenhar(
    estado: EstadoJogo,
    ctx: ContextoSimulacao,
    posicao: (e: Entidade) => PontoVisual,
    alpha: number,
    aoRemover?: (id: string) => void,
  ): void {
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

      const p = posicao(e);
      m.raiz.position.set((p.x + 0.5) * CELULA_PX, (p.y + 0.5) * CELULA_PX);
      m.seta.rotation = m.angulo;
      m.seta.visible = e.arquetipo !== 'boneco';
      // Morto fica apagado; invisível (pós-morte) fica translúcido.
      m.raiz.alpha = e.morto ? 0.25 : e.invisivelAteTick > estado.tick ? 0.5 : 1;

      const indicador = textoIndicador(e, estado.tick);
      if (m.indicador.text !== indicador) m.indicador.text = indicador;
      this.desenharAneis(m, e, estado, local?.alvoSelecionado === e.id);
      this.desenharBarras(m, e, tickVisual, e.id === this.idLocal);
    }

    for (const [id, m] of this.marcadores) {
      if (vistos.has(id)) continue;
      m.raiz.destroy({ children: true });
      this.marcadores.delete(id);
      aoRemover?.(id);
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
