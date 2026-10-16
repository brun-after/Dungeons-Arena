// Marcadores das entidades: modelo de criatura (ou a imagem do jogador), anel de equipe sob os pés, barra
// de HP, sub-barra de recurso, **barra de conjuração** (a telegrafia, §2.15), anel de alvo, anéis de
// invocação e o status principal. A cor de equipe vem da `relacao()` com o jogador local (§2.13).
// Marco 13 (14/10/2026), D-058: posição pela projeção (de cima ou isométrica), profundidade por `zIndex`,
// modelos do atlas gerado no build, caminhada por fatias e o token por imagem. A silhueta geométrica por
// arquétipo continua como substituto quando o modelo não existe ou o atlas não carrega.

import { Container, Graphics, Text } from 'pixi.js';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { efeitosAtivos } from '../combat/efeitos';
import type { Arquetipo, Entidade } from '../entities/entidade';
import { relacao } from '../modos/relacao';
import { pose, type EstiloCaminhada } from './caminhada';
import { CELULA_PX } from './camera-calculo';
import type { PontoVisual } from './interpolacao';
import { ehModelo, MODELO_JOGADOR, MODELOS } from './modelos';
import { centroDaCelula, type Projecao } from './projecao';
import { RigToken } from './rig-token';
import type { BibliotecaCriaturas, FonteToken } from './texturas-criaturas';

const COR_PROPRIO = 0x3498db;
const COR_ALIADO = 0x27ae60;
const COR_HOSTIL = 0xe74c3c;
const COR_NEUTRO = 0x95a5a6;
const RAIO = CELULA_PX * 0.32;
const LARGURA_BARRA = CELULA_PX * 0.84;
/** Altura do token: célula × 1,12 (§2.16). */
export const ALTURA_TOKEN = CELULA_PX * 1.12;
/** Andou há menos que isto: ainda conta como andando (absorve quadros sem avanço). */
const ANDANDO_MS = 120;
/** Troca de quadro das classes jogáveis (2 quadros) enquanto andam. */
const QUADRO_MS = 190;

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
export function desenharSilhueta(g: Graphics, arquetipo: Arquetipo, cor: number): Graphics {
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

/**
 * Ajuste de 15/10/2026 (D-060): o "?" ganha força com o progresso da hesitação e fica apagado enquanto o alvo está
 * fora da zona de atenção. Sem os dados (estado público da arena), aparece inteiro.
 */
export function forcaDoIndicador(e: Entidade, tick: number): number {
  const ia = e.ia;
  if (ia?.modo !== 'hesitando' || ia.hesitacaoAteTick <= ia.modoDesdeTick) return 1;
  if (ia.foraDaZonaTicks > 0) return 0.3;
  const progresso = Math.min(1, Math.max(0, (tick - ia.modoDesdeTick) / (ia.hesitacaoAteTick - ia.modoDesdeTick)));
  return 0.45 + 0.55 * progresso;
}

/** Fase da caminhada por entidade, para criaturas iguais não andarem em uníssono. */
function faseDe(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h >>> 0) % 1000) / 500;
}

export interface OpcoesEntidades {
  idLocal: string;
  projecao: () => Projecao;
  biblioteca: () => BibliotecaCriaturas | null;
  /** A imagem do jogador local, já fatiada (null: usa o modelo). */
  tokenProprio: () => { emPe: FonteToken; cima: FonteToken } | null;
  /** Tamanho do personagem neste aparelho e se a imagem própria olha para a esquerda. */
  aparencia: () => { tamanho: number; imagemOlhaEsquerda: boolean };
  /** Atalho de qualidade (§4.10): false = um desenho só. */
  usarTiras: () => boolean;
  reduzido: () => boolean;
}

interface Marcador {
  raiz: Container;
  chao: Graphics;
  silhueta: Graphics;
  seta: Graphics;
  rig: RigToken | null;
  barras: Graphics;
  aneis: Graphics;
  indicador: Text;
  cor: number;
  angulo: number;
  sentido: number;
  ultimoX: number;
  ultimoY: number;
  visualX: number;
  visualY: number;
  andandoAteMs: number;
  acaoId: number | null;
  ataqueDesdeMs: number;
  escala: number;
  /** Altura do topo do desenho acima da origem (negativo), para barras e indicador. */
  topo: number;
  /** Achatamento dos anéis no chão: 1 de cima, 0,5 no isométrico. */
  achatamento: number;
  chaoDesenhado: string;
}

export class CamadaEntidades {
  private readonly marcadores = new Map<string, Marcador>();

  constructor(
    private readonly camada: Container,
    private readonly o: OpcoesEntidades,
  ) {}

  private criar(e: Entidade, cor: number): Marcador {
    const raiz = new Container({ label: e.id });
    const escala = e.arquetipo === 'boss' ? 1.35 : 1;
    const chao = new Graphics();
    const aneis = new Graphics();
    const silhueta = desenharSilhueta(new Graphics(), e.arquetipo, cor);
    const seta = new Graphics().poly([RAIO * 0.35, -RAIO * 0.45, RAIO * 1.05, 0, RAIO * 0.35, RAIO * 0.45]).fill(0xece8f4);
    const barras = new Graphics();
    const indicador = new Text({
      text: '',
      style: { fontFamily: 'system-ui, sans-serif', fontSize: 20, fontWeight: '800', fill: 0xf1c40f, stroke: { color: 0x000000, width: 4 } },
    });
    indicador.anchor.set(0.5, 1);
    silhueta.scale.set(escala);
    seta.scale.set(escala);
    raiz.addChild(chao, aneis, silhueta, seta, barras, indicador);
    this.camada.addChild(raiz);
    return {
      raiz, chao, silhueta, seta, rig: null, barras, aneis, indicador, cor,
      angulo: 0, sentido: 1, ultimoX: e.x, ultimoY: e.y, visualX: Number.NaN, visualY: Number.NaN,
      andandoAteMs: 0, acaoId: null, ataqueDesdeMs: -Infinity, escala, topo: -RAIO * escala, achatamento: 1, chaoDesenhado: '',
    };
  }

  /** Modelo e fonte de desenho da entidade na visão atual (null: silhueta). */
  private fonteDe(e: Entidade, ctx: ContextoSimulacao, iso: boolean, quadroMs: number, andando: boolean): { fonte: FonteToken; estilo: EstiloCaminhada; proprio: boolean } | null {
    const vista = iso ? '34' : 'cima';
    const token = e.id === this.o.idLocal ? this.o.tokenProprio() : null;
    if (token) return { fonte: iso ? token.emPe : token.cima, estilo: 'passada', proprio: true };
    const biblioteca = this.o.biblioteca();
    if (!biblioteca) return null;
    // Marco 14: o jogador usa o modelo da classe (sem bolsa — arena — o aventureiro).
    const classe = e.bolsa ? ctx.conteudo.classes.get(e.bolsa.classeId)?.modelo : undefined;
    const nome = ctx.conteudo.presets.get(e.preset)?.modelo ?? (e.arquetipo === 'jogador' ? (classe ?? MODELO_JOGADOR) : '');
    if (!ehModelo(nome)) return null;
    const m = MODELOS[nome];
    const quadro = m.quadros > 1 && andando ? Math.floor(quadroMs / QUADRO_MS) % m.quadros : 0;
    const fonte = biblioteca.fonte(nome, vista, quadro);
    return fonte ? { fonte, estilo: m.estilo, proprio: false } : null;
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
    agoraMs: number,
    aoRemover?: (id: string) => void,
  ): void {
    const local = estado.entidades.find((e) => e.id === this.o.idLocal);
    const vistos = new Set<string>();
    const tickVisual = estado.tick + alpha;
    const proj = this.o.projecao();
    const iso = proj.visao === 'iso';
    const usarTiras = this.o.usarTiras();
    const reduzido = this.o.reduzido();
    const aparencia = this.o.aparencia();

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

      // O ataque sai no lançamento: a ação em curso some (ou troca) e o empurrão começa.
      const acaoAtual = e.acao?.acaoId ?? null;
      if (m.acaoId !== null && acaoAtual !== m.acaoId) m.ataqueDesdeMs = agoraMs;
      m.acaoId = acaoAtual;

      const p = posicao(e);
      if (Math.abs(p.x - m.visualX) > 0.001 || Math.abs(p.y - m.visualY) > 0.001) {
        if (!Number.isNaN(m.visualX)) m.andandoAteMs = agoraMs + ANDANDO_MS;
        m.visualX = p.x;
        m.visualY = p.y;
      }
      const c = centroDaCelula(p.x, p.y);
      const pt = proj.projetar(c.x, c.y);
      m.raiz.position.set(pt.x, pt.y);
      m.raiz.zIndex = pt.y;
      // Direção do olhar na tela: o ângulo da grade passado pela projeção.
      const frente = proj.projetar(c.x + Math.cos(m.angulo), c.y + Math.sin(m.angulo));
      const dtx = frente.x - pt.x;
      const dty = frente.y - pt.y;
      const norma = Math.hypot(dtx, dty) || 1;
      if (Math.abs(dtx) > 0.01) m.sentido = dtx > 0 ? 1 : -1;
      // Morto fica apagado; invisível (pós-morte) fica translúcido.
      m.raiz.alpha = e.morto ? 0.25 : e.invisivelAteTick > estado.tick ? 0.5 : 1;

      const andando = agoraMs < m.andandoAteMs && !e.morto;
      const escolha = this.fonteDe(e, ctx, iso, agoraMs, andando);
      this.desenharCorpo(m, e, escolha, {
        iso, usarTiras, reduzido, agoraMs, andando, aparencia,
        direcao: { x: dtx / norma, y: dty / norma },
        angulo: Math.atan2(dty, dtx),
      });
      this.desenharChao(m, iso);

      const indicador = textoIndicador(e, estado.tick);
      if (m.indicador.text !== indicador) m.indicador.text = indicador;
      m.indicador.alpha = forcaDoIndicador(e, estado.tick);
      m.indicador.position.set(0, m.topo - 16);
      this.desenharAneis(m, e, estado, local?.alvoSelecionado === e.id ? (local.alvoTravado ? 'travado' : 'auto') : null);
      this.desenharBarras(m, e, tickVisual, e.id === this.o.idLocal);
    }

    for (const [id, m] of this.marcadores) {
      if (vistos.has(id)) continue;
      m.raiz.destroy({ children: true });
      this.marcadores.delete(id);
      aoRemover?.(id);
    }
  }

  private desenharCorpo(
    m: Marcador,
    e: Entidade,
    escolha: { fonte: FonteToken; estilo: EstiloCaminhada; proprio: boolean } | null,
    q: {
      iso: boolean;
      usarTiras: boolean;
      reduzido: boolean;
      agoraMs: number;
      andando: boolean;
      aparencia: { tamanho: number; imagemOlhaEsquerda: boolean };
      direcao: { x: number; y: number };
      angulo: number;
    },
  ): void {
    m.silhueta.visible = !escolha;
    m.seta.visible = !escolha && e.arquetipo !== 'boneco';
    m.seta.rotation = q.angulo;
    if (!escolha) {
      m.rig?.raiz.removeFromParent();
      m.topo = -RAIO * m.escala;
      return;
    }
    if (!m.rig) m.rig = new RigToken(escolha.fonte);
    else if (m.rig.fonteAtual !== escolha.fonte) m.rig.trocarFonte(escolha.fonte);
    if (!m.rig.raiz.parent) m.raiz.addChildAt(m.rig.raiz, m.raiz.getChildIndex(m.silhueta));
    const tamanho = escolha.proprio ? q.aparencia.tamanho : 1;
    const alturaPx = ALTURA_TOKEN * m.escala * tamanho;
    const ataqueMs = q.agoraMs - m.ataqueDesdeMs;
    const p = pose({
      estilo: escolha.estilo,
      tMs: q.agoraMs,
      andando: q.andando,
      ataqueMs: ataqueMs < 400 ? ataqueMs : null,
      fase: faseDe(e.id),
      tiras: q.iso && q.usarTiras,
      reduzido: q.reduzido || e.morto,
    });
    // De cima, o modelo gira para o olhar; a imagem própria (sem vista de cima) fica em pé e espelha.
    const gira = !q.iso && !escolha.proprio;
    const espelho = escolha.proprio && q.aparencia.imagemOlhaEsquerda ? -1 : 1;
    m.rig.aplicar({
      pose: p,
      alturaPx,
      sentido: gira ? 1 : m.sentido * espelho,
      rotacao: gira ? q.angulo : 0,
      direcao: q.direcao,
      usarTiras: q.iso && q.usarTiras,
    });
    const f = escolha.fonte;
    m.topo = gira ? -alturaPx * 0.42 : f.ancoraY === 1 ? -alturaPx : -alturaPx * f.ancoraY * 0.9;
  }

  /** Sombra e anel de equipe sob os pés; elipse no isométrico (o chão está achatado pela projeção). */
  private desenharChao(m: Marcador, iso: boolean): void {
    const chave = iso ? 'iso' : 'cima';
    if (m.chaoDesenhado === chave) return;
    m.chaoDesenhado = chave;
    m.achatamento = iso ? 0.5 : 1;
    const r = RAIO * 1.15 * m.escala;
    const k = m.achatamento;
    m.chao
      .clear()
      .ellipse(0, iso ? 0 : RAIO * 0.9, r * 0.95, r * 0.42 * (iso ? 1 : 0.8))
      .fill({ color: 0x000000, alpha: 0.35 })
      .ellipse(0, 0, r, r * k)
      .stroke({ width: 3, color: m.cor, alpha: 0.9 });
  }

  private desenharAneis(m: Marcador, e: Entidade, estado: EstadoJogo, selecao: 'auto' | 'travado' | null): void {
    const g = m.aneis.clear();
    const k = m.achatamento;
    const anel = (r: number) => g.ellipse(0, 0, r, r * k);
    // Ajuste de 15/10/2026 (D-065): automático, o anel amarelo fino; travado, laranja-avermelhado e grosso, com as
    // quatro marcas da mira.
    const raioSel = RAIO * 1.15 * m.escala + 6;
    if (selecao === 'auto') anel(raioSel).stroke({ width: 2, color: 0xf1c40f, alpha: 0.9 });
    else if (selecao === 'travado') {
      anel(raioSel).stroke({ width: 3, color: 0xff7043, alpha: 0.95 });
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const x = dx * raioSel;
        const y = dy * raioSel * k;
        g.moveTo(x + dx * 3, y + dy * 3).lineTo(x + dx * 9, y + dy * 9).stroke({ width: 3, color: 0xff7043, alpha: 0.95 });
      }
    }
    // Marco 8A-2: dominado (lutando do outro lado) ganha um anel roxo.
    if (e.invocacao?.dominado) anel(RAIO * 1.15 * m.escala + 3).stroke({ width: 2, color: 0x8e44ad, alpha: 0.95 });
    // Marco 10A-3: invocação com anel verde-azulado; avatar mostra os golpes que ainda aguenta.
    else if (e.invocacao) anel(RAIO * 1.15 * m.escala + 3).stroke({ width: 1.5, color: 0x1abc9c, alpha: 0.9 });
    const golpes = e.invocacao?.avatar ? e.invocacao.golpesRestantes : 0;
    for (let i = 0; i < golpes; i++) g.rect(-golpes * 4 + i * 8 + 1, RAIO * k * m.escala + 6, 6, 6).fill(0xf1c40f).stroke({ width: 1, color: 0x000000 });
    // Marco 8A: marcador do status mais importante (negativo antes de positivo), na cor do registro.
    const status = e.morto ? [] : efeitosAtivos(e, estado.tick).filter((d) => d.ehStatus);
    const principal = status.find((d) => !d.positivo) ?? status[0];
    if (principal) {
      const largura = LARGURA_BARRA * (m.escala > 1 ? 1.3 : 1);
      g.circle(largura / 2 + 7, m.topo - 6, 5).fill(Number.parseInt(principal.cor.slice(1), 16)).stroke({ width: 1, color: 0x000000 });
    }
  }

  private desenharBarras(m: Marcador, e: Entidade, tickVisual: number, proprio: boolean): void {
    const g = m.barras.clear();
    if (e.morto) return;
    const largura = LARGURA_BARRA * (m.escala > 1 ? 1.3 : 1);
    const x = -largura / 2;
    let y = m.topo - 8;

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

  /** Visão trocada ou token novo: refaz o chão de todos e solta as fontes antigas. */
  reiniciarVisual(): void {
    for (const m of this.marcadores.values()) {
      m.chaoDesenhado = '';
      m.rig?.destruir();
      m.rig = null;
    }
  }

  destruir(): void {
    for (const m of this.marcadores.values()) m.raiz.destroy({ children: true });
    this.marcadores.clear();
  }
}
