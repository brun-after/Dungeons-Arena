import { tipoEm } from '../world/fase';
// Marcadores das entidades: modelo de criatura (ou a imagem do jogador), anel de equipe sob os pés, barra
// de HP, sub-barra de recurso, **barra de conjuração** (a telegrafia, §2.15), anel de alvo, anéis de
// invocação e o status principal. A cor de equipe vem da `relacao()` com o jogador local (§2.13).
// Marco 13 (14/10/2026), D-058: posição pela projeção (de cima ou isométrica), profundidade por `zIndex`,
// modelos do atlas gerado no build, caminhada por fatias e o token por imagem. A silhueta geométrica por
// arquétipo continua como substituto quando o modelo não existe ou o atlas não carrega.

import type { Elemento } from '../combat/elementos';
import { misturarCor } from './decoracao';
import { Container, Graphics, Text } from 'pixi.js';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { efeitosAtivos } from '../combat/efeitos';
import type { Arquetipo, Entidade } from '../entities/entidade';
import { relacao } from '../modos/relacao';
import { duracaoDoGolpe, pose, type EstiloCaminhada, type Golpe } from './caminhada';
import { elementoDaAcao, golpeDaAcao } from './golpe-visual';
import { runaDoElemento } from './runas-elementos';
import type { Runa } from './runas';
import { CELULA_PX } from './camera-calculo';
import type { PontoVisual } from './interpolacao';
import { ehModelo, MODELO_JOGADOR, MODELOS } from './modelos';
import { centroDaCelula, type Projecao } from './projecao';
import { equipamento3d, texturasDoAdorno } from './adornos';
import { RigToken } from './rig-token';
import { existeArma3d, type AtlasDePersonagens } from './personagens-3d';
import { Figura3d } from './figura-3d';
import { ArmasEmVoo, type DonoDoProjetil } from './armas-em-voo';
import { direcaoDoAngulo, estadoDoPersonagem, peloGolpe, quadroDoEstado, RECUO_DO_GOLPE } from './quadros-personagem';
import { quadroDoToken, type MomentoDoQuadro } from './quadro-membros';
import { anelDaInvocacao } from './anel-invocacao';
import { coresDasRunas, desenharRuna } from './runas';
import type { BibliotecaCriaturas, FonteToken } from './texturas-criaturas';

// Marco 31 (31/10/2026, D-130): a marca de equipe no chão fica discreta, em tons sóbrios (dourado para o próprio,
// cinza-azulado para o aliado, vermelho escuro para o hostil) em vez do anel saturado.
const COR_PROPRIO = 0xc9a24a;
const COR_ALIADO = 0x7f93a8;
const COR_HOSTIL = 0x9b2f2a;
const COR_NEUTRO = 0x7a7570;
const RAIO = CELULA_PX * 0.32;
const LARGURA_BARRA = CELULA_PX * 0.84;
/** Marco 26 (D-116): o lado da runa da classe sobre a cabeça, em px de tela. */
const TAMANHO_RUNA = 18;
/** Altura do token: célula × 1,12 (§2.16). */
export const ALTURA_TOKEN = CELULA_PX * 1.12;
/** Andou há menos que isto: ainda conta como andando (absorve quadros sem avanço). */
const ANDANDO_MS = 120;
/** Marco 25 (D-103): o pulso do arco branco do Arqueiro. */
const PULSO_ARMA_MS = 2000;
/** Marco 32 (31/10/2026, D-131): a fração da altura do voo (o falcão) que aparece na vista de cima. */
const ALTURA_VISTA_DE_CIMA = 0.25;
/** Troca de quadro das classes jogáveis (2 quadros) enquanto andam. */

/** Marco 25 (D-103): invocação do Necromante (os mortos dele, ou qualquer invocação de dono Necromante). */
function doNecromante(estado: EstadoJogo, inv: NonNullable<Entidade['invocacao']>): boolean {
  if (inv.necromancia) return true;
  const dono = estado.entidades.find((x) => x.id === inv.donoId);
  return (dono?.bolsa?.classeId ?? dono?.classeId) === 'necromante';
}

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
  /**
   * Marco 31 (31/10/2026, D-130): onde vão as barras, os anéis e o indicador (acima do escuro). Sem ela, ficam na
   * própria entidade (a galeria e os testes).
   */
  rotulos?: Container;
  projecao: () => Projecao;
  biblioteca: () => BibliotecaCriaturas | null;
  /** A imagem do jogador local, já fatiada (null: usa o modelo). */
  tokenProprio: () => { emPe: FonteToken; cima: FonteToken } | null;
  /** Tamanho do personagem neste aparelho e se a imagem própria olha para a esquerda. */
  aparencia: () => { tamanho: number; imagemOlhaEsquerda: boolean };
  /** Atalho de qualidade (§4.10): false = um desenho só. */
  usarTiras: () => boolean;
  reduzido: () => boolean;
  /** Marco 23 (D-092): a cor de cada elemento (o inimigo afim fica tingido dela). */
  corElemento?: (e: Elemento) => number;
  /** Marco 25 (D-103): a arma fica branca (o arco do Arqueiro com a mira cheia)? */
  armaBranca?: (e: Entidade, tick: number) => boolean;
  /** Marco 24 (D-098): o ajuste do voo (o falcão); null para quem anda no chão. */
  ajuste?: (e: Entidade, agoraMs: number) => AjusteVisual | null;
  /** Marco 32 (D-131): os atlas dos personagens pré-renderizados (no isométrico, no lugar do token desenhado). */
  personagens?: AtlasDePersonagens | null;
  /** Marco 31 (D-130): quem está em (x, y) não aparece (dentro de uma casa fechada, para quem está fora). */
  oculto?: (x: number, y: number) => boolean;
  /** Marco 26 (28/10/2026, D-116): a runa da classe sobre a cabeça dos jogadores (preferência). */
  runaDaClasse?: () => boolean;
}

/** Marco 24 (25/10/2026, D-098): quem voa solto por cima da regra (o falcão). */
export interface AjusteVisual {
  /** Altura extra do desenho, em px de mundo. */
  alturaPx: number;
  /** Inclinação na curva, em rad. */
  inclina: number;
  escala: number;
  /** Cor que tinge o desenho (null: a de sempre). */
  tinta: number | null;
  /** Quadro do modelo (as asas), em vez do da caminhada. */
  quadro: number | null;
  /** Soma à profundidade (o falcão no ombro fica na frente do dono). */
  zMais: number;
}

/** O que desenhar no token: a fonte, o estilo de passo e (Marco 26, D-108) o quadro de membros escolhido. */
interface EscolhaDeFonte {
  fonte: FonteToken;
  estilo: EstiloCaminhada;
  proprio: boolean;
  modelo: string;
  quadro: number;
  membros: boolean;
}

interface Marcador {
  raiz: Container;
  /** Marco 31 (D-130): barras, anéis e indicador (na camada de rótulos, ou dentro da raiz). */
  sobre: Container;
  chao: Graphics;
  silhueta: Graphics;
  seta: Graphics;
  rig: RigToken | null;
  /** Marco 32 (D-131): a figura pré-renderizada, com a armadura e as armas (null: o token desenhado). */
  figura3d: Figura3d | null;
  /** Marco 32 (D-131): o modelo e a arma da figura 3D (o desenho do projétil das armas de arremesso). */
  dono3d: DonoDoProjetil | null;
  /** Quando a entidade caiu (para a animação de morte), ou -1. */
  morteDesdeMs: number;
  barras: Graphics;
  aneis: Graphics;
  indicador: Text;
  /** Marco 26 (D-116): a runa da classe (só jogadores) e a chave do último desenho (classe, cor, se é o local). */
  runa: Graphics | null;
  runaDesenhada: string;
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
  /** Marco 24 (D-098): o golpe da última ação (pela chave), que a pose anima. */
  golpe: Golpe | null;
  chaveGolpe: string;
  /** Marco 32 (D-131): a runa do elemento da última ação, acesa no tomo enquanto conjura. */
  runaGolpe: Runa | null;
  escala: number;
  /** Altura do topo do desenho acima da origem (negativo), para barras e indicador. */
  topo: number;
  /** Achatamento dos anéis no chão: 1 de cima, 0,5 no isométrico. */
  achatamento: number;
  chaoDesenhado: string;
}

export class CamadaEntidades {
  private readonly marcadores = new Map<string, Marcador>();
  private readonly armasEmVoo: ArmasEmVoo;

  constructor(
    private readonly camada: Container,
    private readonly o: OpcoesEntidades,
  ) {
    this.armasEmVoo = new ArmasEmVoo(camada);
  }

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
    raiz.addChild(chao, silhueta, seta);
    const sobre = new Container({ label: `${e.id}:rotulos` });
    sobre.addChild(aneis, barras, indicador);
    if (this.o.rotulos) this.o.rotulos.addChild(sobre);
    else raiz.addChild(sobre);
    const runa = e.arquetipo === 'jogador' && !e.invocacao ? new Graphics() : null;
    if (runa) raiz.addChild(runa);
    this.camada.addChild(raiz);
    return {
      raiz, sobre, chao, silhueta, seta, rig: null, figura3d: null, dono3d: null, morteDesdeMs: -1, barras, aneis, indicador, runa, runaDesenhada: '', cor,
      angulo: 0, sentido: 1, ultimoX: e.px, ultimoY: e.py, visualX: Number.NaN, visualY: Number.NaN,
      andandoAteMs: 0, acaoId: null, ataqueDesdeMs: -Infinity, golpe: null, chaveGolpe: '', runaGolpe: null, escala, topo: -RAIO * escala, achatamento: 1, chaoDesenhado: '',
    };
  }

  /** Modelo e fonte de desenho da entidade na visão atual (null: silhueta). Marco 26 (D-108): e o quadro dos membros. */
  private fonteDe(e: Entidade, ctx: ContextoSimulacao, iso: boolean, momento: Omit<MomentoDoQuadro, 'fase'>): EscolhaDeFonte | null {
    const vista = iso ? '34' : 'cima';
    const token = e.id === this.o.idLocal ? this.o.tokenProprio() : null;
    if (token) return { fonte: iso ? token.emPe : token.cima, estilo: 'passada', proprio: true, modelo: '', quadro: 0, membros: false };
    const biblioteca = this.o.biblioteca();
    if (!biblioteca) return null;
    // Marco 14: o jogador usa o modelo da classe (sem bolsa — arena — o aventureiro).
    const classe = ctx.conteudo.classes.get(e.classeId ?? e.bolsa?.classeId ?? '')?.modelo;
    const nome = e.invocacao?.modeloOriginal ?? ctx.conteudo.presets.get(e.preset)?.modelo ?? (e.arquetipo === 'jogador' ? (classe ?? MODELO_JOGADOR) : '');
    if (!ehModelo(nome)) return null;
    const m = MODELOS[nome];
    const quadro = quadroDoToken(m, { ...momento, fase: faseDe(e.id) });
    const fonte = biblioteca.fonte(nome, vista, quadro);
    return fonte ? { fonte, estilo: m.estilo, proprio: false, modelo: nome, quadro, membros: m.membros } : null;
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
    const runas = this.o.runaDaClasse?.() ?? true;
    const coresRunas = runas ? coresDasRunas(estado.entidades) : null;

    for (const e of estado.entidades) {
      vistos.add(e.id);
      let m = this.marcadores.get(e.id);
      if (!m) {
        const r = local ? relacao(local, e, ctx.modo) : 'neutro';
        const cor = r === 'proprio' ? COR_PROPRIO : r === 'aliado' ? COR_ALIADO : r === 'hostil' ? COR_HOSTIL : COR_NEUTRO;
        m = this.criar(e, cor);
        this.marcadores.set(e.id, m);
      }
      // Marco 26 (D-104): o rumo é o quanto a posição contínua andou desde o último quadro.
      const dx = e.px - m.ultimoX;
      const dy = e.py - m.ultimoY;
      if (dx * dx + dy * dy > 1e-6) m.angulo = Math.atan2(dy, dx);
      if (e.acao) m.angulo = Math.atan2(e.acao.alvoY - e.py, e.acao.alvoX - e.px) || m.angulo;
      m.ultimoX = e.px;
      m.ultimoY = e.py;

      // O ataque sai no lançamento: a ação em curso some (ou troca) e o empurrão começa.
      const acaoAtual = e.acao?.acaoId ?? null;
      if (m.acaoId !== null && acaoAtual !== m.acaoId) m.ataqueDesdeMs = agoraMs;
      m.acaoId = acaoAtual;

      const p = posicao(e);
      // Marco 26 (25/10/2026, D-108): o primeiro quadro só guarda a posição (com NaN, a comparação dava sempre falso e
      // o token nunca contava como andando).
      if (Number.isNaN(m.visualX) || Math.abs(p.x - m.visualX) > 0.001 || Math.abs(p.y - m.visualY) > 0.001) {
        if (!Number.isNaN(m.visualX)) m.andandoAteMs = agoraMs + ANDANDO_MS;
        m.visualX = p.x;
        m.visualY = p.y;
      }
      const c = centroDaCelula(p.x, p.y);
      const pt = proj.projetar(c.x, c.y);
      const ajuste = this.o.ajuste?.(e, agoraMs) ?? null;
      m.raiz.position.set(pt.x, pt.y);
      m.raiz.zIndex = pt.y + (ajuste?.zMais ?? 0);
      // Direção do olhar na tela: o ângulo da grade passado pela projeção.
      const frente = proj.projetar(c.x + Math.cos(m.angulo), c.y + Math.sin(m.angulo));
      const dtx = frente.x - pt.x;
      const dty = frente.y - pt.y;
      const norma = Math.hypot(dtx, dty) || 1;
      if (Math.abs(dtx) > 0.01) m.sentido = dtx > 0 ? 1 : -1;
      // Morto fica apagado; invisível (pós-morte) fica translúcido.
      m.raiz.alpha = e.morto ? 0.25 : e.invisivelAteTick > estado.tick ? 0.5 : e.invocacao?.necromancia === 'eco' ? 0.7 : 1;
      m.raiz.visible = e.id === this.o.idLocal || !(this.o.oculto?.(p.x, p.y) ?? false);
      if (this.o.rotulos) {
        m.sobre.position.set(pt.x, pt.y);
        m.sobre.alpha = m.raiz.alpha;
        m.sobre.visible = m.raiz.visible;
      }

      const andando = agoraMs < m.andandoAteMs && !e.morto;
      const golpeando = agoraMs - m.ataqueDesdeMs < duracaoDoGolpe(m.golpe) && !e.morto;
      const escolha = this.fonteDe(e, ctx, iso, { tMs: agoraMs, andando, golpeando, reduzido: reduzido || e.morto, fixo: ajuste?.quadro ?? null });
      // Marco 24 (D-098): o golpe da arma (ou o giro) da ação em curso, e quanto da conjuração já passou.
      if (e.acao && escolha && m.chaveGolpe !== e.acao.chave) {
        m.golpe = golpeDaAcao(ctx, e, e.acao.chave, escolha.modelo);
        m.chaveGolpe = e.acao.chave;
        const el = elementoDaAcao(ctx, e, e.acao.chave);
        m.runaGolpe = runaDoElemento(el, el && this.o.corElemento ? this.o.corElemento(el) : null);
      }
      const conjura = e.acao ? e.acao.lancamentoTick - e.acao.inicioTick : 0;
      const preparo = e.acao && m.golpe ? (conjura > 0 ? Math.min(1, Math.max(0, (tickVisual - e.acao.inicioTick) / conjura)) : 1) : null;
      this.desenharCorpo(m, e, escolha, {
        iso, usarTiras, reduzido, agoraMs, andando, aparencia, preparo, ajuste, tick: estado.tick,
        direcao: { x: dtx / norma, y: dty / norma },
        angulo: Math.atan2(dty, dtx),
      });
      this.desenharChao(m, iso);

      const indicador = textoIndicador(e, estado.tick);
      if (m.indicador.text !== indicador) m.indicador.text = indicador;
      m.indicador.alpha = forcaDoIndicador(e, estado.tick);
      m.indicador.position.set(0, m.topo - 16);
      this.desenharAneis(m, e, estado, local?.alvoSelecionado === e.id ? (local.alvoTravado ? 'travado' : 'auto') : null);
      // 01/11/2026: ondulações identificam o nado; a sombra de chão desaparece.
      const nadando = !e.morto && tipoEm(ctx.fase, e.x, e.y) === 'agua';
      m.chao.visible = !nadando;
      if (nadando) {
        const pulso = reduzido ? 0.5 : (agoraMs % 1200) / 1200;
        const r = RAIO * m.escala * (1 + pulso);
        m.aneis.ellipse(0, 0, r, r * m.achatamento).stroke({ width: 2, color: 0xb7ebf4, alpha: 0.7 * (1 - pulso) });
      }
      this.desenharBarras(m, e, tickVisual, e.id === this.o.idLocal);
      if (m.runa) this.desenharRunaDe(m, e, coresRunas?.get(e.id) ?? null);
    }

    for (const [id, m] of this.marcadores) {
      if (vistos.has(id)) continue;
      m.sobre.destroy({ children: true });
      m.raiz.destroy({ children: true });
      this.marcadores.delete(id);
      aoRemover?.(id);
    }
    this.armasEmVoo.desenhar(estado, ctx, alpha, agoraMs, proj, this.o.personagens ?? null, (id) => this.marcadores.get(id)?.dono3d ?? null);
  }

  private desenharCorpo(
    m: Marcador,
    e: Entidade,
    escolha: EscolhaDeFonte | null,
    q: {
      iso: boolean;
      usarTiras: boolean;
      reduzido: boolean;
      agoraMs: number;
      andando: boolean;
      aparencia: { tamanho: number; imagemOlhaEsquerda: boolean };
      direcao: { x: number; y: number };
      angulo: number;
      preparo: number | null;
      ajuste: AjusteVisual | null;
      tick: number;
    },
  ): void {
    m.silhueta.visible = !escolha;
    m.seta.visible = !escolha && e.arquetipo !== 'boneco';
    m.seta.rotation = q.angulo;
    if (!escolha) {
      m.rig?.raiz.removeFromParent();
      if (m.figura3d) m.figura3d.raiz.visible = false;
      m.topo = -RAIO * m.escala;
      return;
    }
    if (this.corpo3d(m, e, escolha, q)) return;
    if (!m.rig) m.rig = new RigToken(escolha.fonte);
    else if (m.rig.fonteAtual !== escolha.fonte) m.rig.trocarFonte(escolha.fonte);
    m.rig.raiz.visible = true;
    if (!m.rig.raiz.parent) m.raiz.addChildAt(m.rig.raiz, m.raiz.getChildIndex(m.silhueta));
    // Marco 23 (D-092): o inimigo afim leva a cor do elemento (o extremo, mais forte).
    const af = e.afinidade;
    m.rig.raiz.tint = q.ajuste?.tinta != null ? misturarCor(0xffffff, q.ajuste.tinta, 0.75) : af && this.o.corElemento ? misturarCor(0xffffff, this.o.corElemento(af.elemento), af.extrema ? 0.6 : 0.42) : 0xffffff;
    // Marco 24 (D-098): o voo solto do falcão (altura, inclinação na curva e o tamanho no ombro).
    // Marco 32 (D-131): de cima, a altura do voo aparece menor (a câmera olha de cima; a sombra marca o chão).
    m.rig.raiz.position.y = -(q.ajuste?.alturaPx ?? 0) * (q.iso ? 1 : ALTURA_VISTA_DE_CIMA);
    m.rig.raiz.rotation = q.ajuste?.inclina ?? 0;
    m.rig.raiz.scale.set(q.ajuste?.escala ?? 1);
    const tamanho = escolha.proprio ? q.aparencia.tamanho : 1;
    const alturaPx = ALTURA_TOKEN * m.escala * tamanho;
    const ataqueMs = q.agoraMs - m.ataqueDesdeMs;
    const p = pose({
      estilo: escolha.estilo,
      tMs: q.agoraMs,
      andando: q.andando,
      ataqueMs: ataqueMs < duracaoDoGolpe(m.golpe) ? ataqueMs : null,
      fase: faseDe(e.id),
      tiras: q.iso && q.usarTiras,
      reduzido: q.reduzido || e.morto,
      golpe: m.golpe,
      preparo: q.preparo,
      membros: escolha.membros,
    });
    // De cima, o modelo gira para o olhar; a imagem própria (sem vista de cima) fica em pé e espelha.
    const gira = !q.iso && !escolha.proprio;
    const espelho = escolha.proprio && q.aparencia.imagemOlhaEsquerda ? -1 : 1;
    // D-067: o equipamento aparece no token (modelos de classe; a imagem própria fica como o jogador a fez).
    const adorno = escolha.proprio ? null : texturasDoAdorno(escolha.modelo, q.iso ? '34' : 'cima', e.aparencia);
    m.rig.aplicar({
      pose: p,
      alturaPx,
      sentido: gira ? 1 : m.sentido * espelho,
      rotacao: gira ? q.angulo : 0,
      direcao: q.direcao,
      usarTiras: q.iso && q.usarTiras,
      vistaDeCima: gira,
      // Marco 26 (D-108): a arma e a mão secundária acompanham a mão no quadro de membros.
      maos: adorno?.maos[escolha.quadro] ?? null,
    });
    // Marco 25 (25/10/2026, D-103): o arco branco com a mira cheia, num pulso suave de 2 s (fixo com movimento reduzido).
    const branca = !e.morto && (this.o.armaBranca?.(e, q.tick) ?? false);
    const brilho = !branca ? 0 : q.reduzido ? 0.65 : 0.55 + 0.25 * Math.sin((2 * Math.PI * q.agoraMs) / PULSO_ARMA_MS);
    m.rig.adornar(adorno?.atras ?? null, adorno?.frente ?? null, adorno?.arma ?? null, adorno?.pivo, adorno?.armaBranca ?? null, brilho, adorno?.secundaria ?? null);
    const f = escolha.fonte;
    m.topo = gira ? -alturaPx * 0.42 : f.ancoraY === 1 ? -alturaPx : -alturaPx * f.ancoraY * 0.9;
  }

  /**
   * Marco 32 (31/10/2026, D-131): no isométrico, o modelo com atlas pré-renderizado vira um sprite com o quadro da
   * direção (pelo rumo na grade) e do estado (morte, golpe, conjuração, andar ou parado). False enquanto o atlas
   * carrega, na vista de cima e na imagem própria (o token desenhado continua).
   */
  private corpo3d(
    m: Marcador,
    e: Entidade,
    escolha: EscolhaDeFonte,
    q: { iso: boolean; agoraMs: number; andando: boolean; reduzido: boolean; preparo: number | null; ajuste: AjusteVisual | null; tick: number },
  ): boolean {
    const atlas = this.o.personagens;
    if (e.morto) {
      if (m.morteDesdeMs < 0) m.morteDesdeMs = q.agoraMs;
    } else m.morteDesdeMs = -1;
    const esconder = () => {
      if (m.figura3d) m.figura3d.raiz.visible = false;
      return false;
    };
    // A arma na mão vale também de cima (o projétil das armas de arremesso tem a forma dela).
    const equipamento = equipamento3d(escolha.modelo, e.aparencia, existeArma3d);
    m.dono3d = { modelo: escolha.modelo, arma: equipamento?.arma ?? null };
    if (!atlas || !q.iso || escolha.proprio || !atlas.existe(escolha.modelo)) return esconder();
    const ataqueMs = q.agoraMs - m.ataqueDesdeMs;
    const duracao = duracaoDoGolpe(m.golpe);
    const golpeando = ataqueMs < duracao;
    const estado = estadoDoPersonagem({ morto: e.morto, golpeando, conjurando: q.preparo !== null && q.preparo < 1, andando: q.andando, golpe: m.golpe });
    const n = atlas.quadrosDe(escolha.modelo, estado);
    const ciclo = q.reduzido && estado !== 'morte' && !peloGolpe(estado) ? 0 : q.agoraMs + faseDe(e.id) * 1000;
    const tempo = estado === 'morte' ? q.agoraMs - m.morteDesdeMs : ciclo;
    // Marco 32 (D-131): na preparação de um golpe de arma, o recuo dele (o começo da animação) acompanha a conjuração.
    const fracao = golpeando ? (duracao > 0 ? ataqueMs / duracao : 0) : (q.preparo ?? 0) * RECUO_DO_GOLPE;
    const indice = quadroDoEstado(estado, n, tempo, fracao);
    if (!m.figura3d) {
      m.figura3d = new Figura3d();
      m.raiz.addChildAt(m.figura3d.raiz, m.raiz.getChildIndex(m.silhueta));
    }
    const medidas = atlas.medidas(escolha.modelo);
    // Marco 23 (D-092): o inimigo afim leva a cor do elemento, como no token desenhado.
    const af = e.afinidade;
    const tinta = q.ajuste?.tinta != null ? misturarCor(0xffffff, q.ajuste.tinta, 0.75) : af && this.o.corElemento ? misturarCor(0xffffff, this.o.corElemento(af.elemento), af.extrema ? 0.6 : 0.42) : 0xffffff;
    const branca = !e.morto && (this.o.armaBranca?.(e, q.tick) ?? false);
    const pulso = q.reduzido ? 0.5 : 0.5 + 0.5 * Math.sin((2 * Math.PI * q.agoraMs) / PULSO_ARMA_MS);
    const pronto =
      !!medidas &&
      m.figura3d.atualizar(atlas, {
        modelo: escolha.modelo,
        estado,
        direcao: direcaoDoAngulo(m.angulo),
        indice,
        escala: medidas.escala * m.escala * (q.ajuste?.escala ?? 1),
        alturaPx: q.ajuste?.alturaPx ?? 0,
        tinta,
        equipamento,
        branca: branca ? 0.45 + 0.3 * pulso : 0,
        pulso,
        morto: e.morto,
        runa: m.runaGolpe,
      });
    if (!pronto) return esconder();
    m.figura3d.raiz.visible = true;
    if (m.rig) m.rig.raiz.visible = false;
    m.topo = -medidas.topo * m.escala * 1.02;
    return true;
  }

  /**
   * Sombra e marca de equipe sob os pés; elipse no isométrico (o chão está achatado pela projeção). Marco 31 (D-130):
   * a sombra macia (camadas de alfa decrescente) e a marca fina e translúcida, como um decalque no chão.
   */
  private desenharChao(m: Marcador, iso: boolean): void {
    const chave = iso ? 'iso' : 'cima';
    if (m.chaoDesenhado === chave) return;
    m.chaoDesenhado = chave;
    m.achatamento = iso ? 0.5 : 1;
    const r = RAIO * 1.15 * m.escala;
    const k = m.achatamento;
    const g = m.chao.clear();
    const sy = iso ? 0 : RAIO * 0.9;
    const sk = 0.42 * (iso ? 1 : 0.8);
    for (const [f, a] of [[1.15, 0.12], [0.9, 0.16], [0.65, 0.2]] as const) g.ellipse(0, sy, r * f, r * sk * f).fill({ color: 0x000000, alpha: a });
    g.ellipse(0, 0, r, r * k).fill({ color: m.cor, alpha: 0.08 }).stroke({ width: 1.5, color: m.cor, alpha: 0.6 });
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
    // Marco 25 (25/10/2026, D-103): a do Necromante tem o anel roxo que esvazia com a duração (e clareia no fim).
    else if (e.invocacao && doNecromante(estado, e.invocacao)) {
      const a = anelDaInvocacao(e.invocacao, estado.tick);
      const r = RAIO * 1.15 * m.escala + 3;
      const inicio = -Math.PI / 2;
      if (a.fracao >= 1) anel(r).stroke({ width: 2, color: a.cor, alpha: a.alpha });
      else if (a.fracao > 0) {
        // O arco na elipse do chão (achatada no isométrico), ponto a ponto.
        const passos = Math.max(2, Math.ceil(48 * a.fracao));
        for (let i = 0; i <= passos; i++) {
          const ang = inicio + Math.PI * 2 * a.fracao * (i / passos);
          const x = Math.cos(ang) * r;
          const y = Math.sin(ang) * r * k;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.stroke({ width: 2, color: a.cor, alpha: a.alpha });
      }
    }
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

    // Marco 31 (D-130): a moldura escura com borda de metal gasto e um brilho no alto da barra (volume).
    const fracaoHp = e.hp / Math.max(1, e.hpMax);
    g.rect(x - 1, y - 1, largura + 2, proprio ? 9 : 6).fill({ color: 0x0b0a0d, alpha: 0.85 }).stroke({ width: 1, color: 0x5a5046, alpha: 0.7 });
    g.rect(x, y, largura * fracaoHp, 4).fill(corDoHp(fracaoHp));
    g.rect(x, y, largura * fracaoHp, 1).fill({ color: 0xffffff, alpha: 0.25 });
    if (proprio) {
      y += 5;
      g.rect(x, y, largura * (e.mana / Math.max(1, e.manaMax)), 2).fill(0x5dade2);
    }
  }

  /**
   * Marco 26 (28/10/2026, D-116): a runa da classe acima das barras. A do jogador local é 1,25× maior e tem um halo;
   * jogadores da mesma classe têm cores diferentes (`coresDasRunas`). Some com o morto e com a preferência desligada.
   * Só redesenha quando a classe, a cor ou o dono mudam.
   */
  private desenharRunaDe(m: Marcador, e: Entidade, cor: number | null): void {
    const g = m.runa;
    if (!g) return;
    g.visible = cor !== null && !e.morto && !!e.classeId;
    if (!g.visible || cor === null || !e.classeId) return;
    const proprio = e.id === this.o.idLocal;
    const tamanho = TAMANHO_RUNA * (proprio ? 1.25 : 1);
    const chave = `${e.classeId}:${cor}:${proprio ? 1 : 0}`;
    if (m.runaDesenhada !== chave) {
      g.clear();
      if (proprio) g.circle(0, 0, tamanho * 0.72).fill({ color: cor, alpha: 0.22 });
      desenharRuna(g, e.classeId, cor, tamanho);
      m.runaDesenhada = chave;
    }
    g.position.set(0, m.topo - 22 - tamanho / 2);
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
    this.armasEmVoo.destruir();
    for (const m of this.marcadores.values()) {
      m.sobre.destroy({ children: true });
      m.raiz.destroy({ children: true });
    }
    this.marcadores.clear();
  }
}
