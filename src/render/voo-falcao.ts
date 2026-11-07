// O voo do falcão no desenho (marco 24, 25/10/2026, D-098). A regra anda o falcão de célula em célula; aqui ele voa
// solto por cima disso:
// - uma mola com inércia persegue a célula, com uma deriva lenta em volta (não para no centro da célula);
// - pousado (IA no modo `pousado`), vai para o ombro do dono, menor e de asas fechadas;
// - nas habilidades do falcão, segue a trajetória da skill (render/voos-falcao.ts) do início da ação até o impacto
//   previsto, com o rastro na cor dela; nas ultimates, tingido da cor da ultimate. A volta é a própria mola;
// - as asas batem em rajadas (e sem parar quando voa rápido).
// Só apresentação: nada aqui entra na simulação.

import type { BuscaHabilidade } from '../combat/habilidades';
import type { Barramento } from '../core/events';
import type { EstadoJogo } from '../core/estado';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import { msDe } from '../core/tempo';
import type { Entidade, PontoVisual } from '../entities/entidade';
import { CELULA_PX } from './camera-calculo';
import { ALTURA_NO_AR, type SistemaParticulas } from './particulas';
import type { AjusteVisual } from './sprites';
import { pontoDoVoo, quadroDasAsas, VOOS_SKILL, vooDaUltimate, type VooDeSkill } from './voos-falcao';

/** Rigidez e amortecimento da mola (um pouco abaixo do crítico: o falcão passa do ponto e volta, como quem plana). */
const RIGIDEZ = 16;
const AMORTECE = 2 * Math.sqrt(RIGIDEZ) * 0.7;
/**
 * Marco 25 (25/10/2026, D-102): no dash e no mergulho da regra, a mola é bem mais dura (quase crítica) e sem deriva,
 * com um rastro branco curto — a diferença de velocidade para a patrulha fica clara.
 */
const RIGIDEZ_RAPIDA = 140;
const AMORTECE_RAPIDO = 2 * Math.sqrt(RIGIDEZ_RAPIDA) * 0.9;
const COR_DASH = 0xffffff;
/** A deriva em volta da célula, em células. */
const DERIVA = 0.32;
/**
 * O ombro do dono, em células a partir dos pés, e a altura para o falcão menor ficar no ombro. Marco 32 (31/10/2026,
 * D-131): o ombro do aventureiro pré-renderizado (1,12 célula de altura) fica perto de 0,88.
 */
const OMBRO = { x: 0.14, y: -0.04, altura: 0.88 };
/** Marco 32 (31/10/2026, D-131): o voo solto passa acima da cabeça do aventureiro (1,12 célula), não rente ao chão. */
const ALTURA_VOO = 1.3;
/** Quão rápido o falcão desce para a trajetória da skill (por segundo): um mergulho curto, sem salto. */
const DESCIDA = 10;
/**
 * Marco 32 (31/10/2026, D-131): no corte de um projétil (o dash da IA), o falcão desce até a altura em que o projétil
 * voa (o meio do corpo dele nela); no mergulho de ataque, até o tronco do alvo.
 */
const ALTURA_DO_BLOQUEIO = ALTURA_NO_AR - 0.1;
const ALTURA_DO_MERGULHO = 0.5;
const ESCALA_POUSADO = 0.7;
/**
 * 06/11/2026: a skin Mágico do Aventureiro (o falcão é a cartola que voa):
 * - nos movimentos do pássaro (o voo das skills, menos o grito, e o dash e o mergulho da IA), a cartola para no ar e o
 *   pombo sai de dentro dela num puff, faz o movimento e espera; depois a cartola vai de encontro a ele e ele entra;
 * - o resto (o grito, as skills que saem do pássaro sem ser ele e as magias do dono) sai da própria cartola;
 * - nas magias, a cartola vira de boca para cima e a mão com a varinha sai dela; fica na preparação por `PREPARO_MS`
 *   (outra magia renova) e desvira;
 * - pousada, fica vestida na cabeça do dono.
 */
const SKIN_DO_MAGICO = 'aventureiro-magico';
/**
 * A cabeça do dono, em células de tela a partir dos pés (medida no corpo 3D parado, já projetada pela câmera): a
 * esfera do yin-yang tem o meio a 0,874 e raio de 0,075, e o topo fica a 0,95. O meio da aba entra um quarto da
 * esfera (vestida): 0,91. O meio da aba do atlas fica `ELEVACAO_DA_CARTOLA` acima da âncora (escala 1; medido no
 * quadro parado: 6,8 px de 72 por célula), e isso sai da altura para a aba tocar a cabeça.
 */
const CABECA = { x: 0, y: 0, aba: 0.91 };
const ELEVACAO_DA_CARTOLA = 0.094;
const ESCALA_NA_CABECA = 0.8;
const PREPARO_MS = 3000;
/** Quão rápido a cartola vira (por segundo). */
const VIRADA = 6;
/** Depois do movimento, quanto a cartola espera antes de ir buscar o pombo, que também volta para ela. */
const ESPERA_DA_VOLTA_MS = 300;
/** A mola da volta (os dois se encontram no caminho, sem pressa). */
const RIGIDEZ_DA_VOLTA = 10;
const AMORTECE_DA_VOLTA = 2 * Math.sqrt(RIGIDEZ_DA_VOLTA);
/** A cartola recolhe o pombo quando chega a esta distância dele (em células). */
const RECOLHE = 0.25;
const COR_DO_PUFF = 0xf4f1ea;
/** O dono usa a skin Mágico (no servidor de desenvolvimento, também pelo `&skin=`, como o corpo em palco-vivo.ts). */
const SKIN_DEV = import.meta.env.DEV && typeof location !== 'undefined' ? new URLSearchParams(location.search).get('skin') : null;
const ehMagico = (dono: Entidade | undefined): boolean =>
  dono?.aparencia?.skin === SKIN_DO_MAGICO || (SKIN_DEV === SKIN_DO_MAGICO && dono?.classeId === 'aventureiro');
/** Longe demais (troca de fase, teleporte): salta em vez de voar. */
const SALTO = 6;
const RASTRO_MS = 28;

interface VooEmCurso extends VooDeSkill {
  de: PontoVisual;
  alvoId: string | null;
  alvo: PontoVisual;
  inicioMs: number;
  fimMs: number;
  ultimoRastroMs: number;
  /** Skin Mágico: quem voa é o pombo (a cartola espera). */
  pombo: boolean;
}

/** O que voa: a posição, a velocidade e a altura (o falcão, a cartola ou o pombo). */
interface Corpo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  altura: number;
}

interface EstadoVoo extends Corpo {
  semente: number;
  voo: VooEmCurso | null;
  pousado: boolean;
  /** A IA no dash ou no mergulho (marco 25). */
  rapido: boolean;
  /** A IA no dash: cortando um projétil (marco 32). */
  bloqueando: boolean;
  ultimoRastroMs: number;
  /** Skin Mágico: o pombo fora da cartola, onde a cartola espera, até quando prepara a magia e quanto já virou (0 a 1). */
  magico: boolean;
  pombo: Corpo | null;
  espera: PontoVisual | null;
  magiaAteMs: number;
  virada: number;
  /** Quando o movimento do pombo acabou (-1: ainda se movendo, ou sem pombo fora). */
  voltaDesdeMs: number;
}

export interface OpcoesVooFalcao {
  particulas: SistemaParticulas;
  habilidades: BuscaHabilidade;
  /** O par de skills da ultimate (pelo id da habilidade, com ou sem a etapa), null se não for ultimate. */
  parDaUltimate: (id: string) => readonly string[] | null;
  reduzido: () => boolean;
}

const ehFalcao = (e: Entidade) => e.invocacao?.companheiro === true && !e.morto;
/** O voo é o próprio pássaro se movendo (não algo que sai dele, como o grito). */
const moveOPassaro = (v: VooDeSkill) => v.forma !== 'grito';

export class VooDoFalcao {
  private readonly estados = new Map<string, EstadoVoo>();
  private ultimoMs = -1;

  constructor(private readonly o: OpcoesVooFalcao) {}

  /** O voo que a habilidade dá ao falcão (null: a habilidade não é do falcão). */
  private vooDe(chave: string): VooDeSkill | null {
    const h = this.o.habilidades(chave);
    if (!h) return null;
    const skill = VOOS_SKILL[h.id];
    if (skill) return skill;
    const par = this.o.parDaUltimate(h.id);
    if (par) return vooDaUltimate(h.id.replace(/_\d+$/, ''), par, h.visual?.cor ? Number.parseInt(h.visual.cor.slice(1), 16) : null);
    return h.tags.includes('falcao') ? { forma: 'reto', cor: h.visual?.cor ? Number.parseInt(h.visual.cor.slice(1), 16) : 0xffffff, tinge: false } : null;
  }

  ligar(bus: Barramento<EventosDaSimulacao>, estado: () => EstadoJogo, agora: () => number): void {
    const falcaoDe = (donoId: string) => estado().entidades.find((x) => ehFalcao(x) && x.invocacao?.donoId === donoId);
    bus.on('acaoIniciada', (ev) => {
      const falcao = falcaoDe(ev.atorId);
      const dono = estado().entidades.find((x) => x.id === ev.atorId);
      if (!falcao || !dono || this.o.habilidades(ev.chave)?.id === dono.ataqueBasico) return;
      const voo = this.vooDe(ev.chave);
      const st = this.estados.get(falcao.id);
      const magico = ehMagico(dono);
      // Skin Mágico: a magia que não move o pássaro vira a cartola com a varinha (e renova a preparação).
      if (st && magico && (!voo || !moveOPassaro(voo))) st.magiaAteMs = agora() + msDe(ev.impactoPrevistoTick - ev.tick) + PREPARO_MS;
      if (!voo || !st || this.o.reduzido()) return;
      const alvo = ev.alvoId ? estado().entidades.find((x) => x.id === ev.alvoId) : undefined;
      const duracao = Math.max(voo.forma === 'circulo' ? 900 : 300, msDe(ev.impactoPrevistoTick - ev.tick));
      const ms = agora();
      const pombo = magico && moveOPassaro(voo);
      // O pombo sai de onde já está (fora da cartola) ou de dentro dela.
      const de = pombo && st.pombo ? { x: st.pombo.x, y: st.pombo.y } : { x: st.x, y: st.y };
      st.voo = { ...voo, de, alvoId: alvo?.id ?? null, alvo: alvo ? { x: alvo.x, y: alvo.y } : { x: ev.alvoX, y: ev.alvoY }, inicioMs: ms, fimMs: ms + duracao, ultimoRastroMs: 0, pombo };
    });
    bus.on('acaoCancelada', (ev) => {
      const falcao = falcaoDe(ev.atorId);
      const st = falcao ? this.estados.get(falcao.id) : undefined;
      if (st) st.voo = null;
    });
  }

  /** Por quadro, antes de desenhar: avança a mola e os voos. `base` é a posição interpolada da regra. */
  quadro(estado: EstadoJogo, agoraMs: number, base: (e: Entidade) => PontoVisual): void {
    const dt = this.ultimoMs < 0 ? 0 : Math.min(0.05, Math.max(0, (agoraMs - this.ultimoMs) / 1000));
    this.ultimoMs = agoraMs;
    const vistos = new Set<string>();
    for (const e of estado.entidades) {
      if (!ehFalcao(e)) continue;
      vistos.add(e.id);
      const b = base(e);
      let st = this.estados.get(e.id);
      if (!st) {
        st = { x: b.x, y: b.y, vx: 0, vy: 0, altura: ALTURA_VOO, semente: this.estados.size + 1, voo: null, pousado: false, rapido: false, bloqueando: false, ultimoRastroMs: 0, magico: false, pombo: null, espera: null, magiaAteMs: 0, virada: 0, voltaDesdeMs: -1 };
        this.estados.set(e.id, st);
      }
      const dono = estado.entidades.find((x) => x.id === e.invocacao?.donoId);
      st.magico = ehMagico(dono);
      st.pousado = e.ia?.modo === 'pousado' && !st.voo && !st.pombo;
      st.rapido = e.ia?.modo === 'dash' || e.ia?.modo === 'mergulho';
      st.bloqueando = e.ia?.modo === 'dash';
      if (st.magico) this.magica(st, agoraMs, dt, estado, base, b, dono);
      else if (st.voo) {
        if (this.voar(st, st.voo, agoraMs, dt, estado, base, dono)) st.voo = null;
      } else this.planar(st, agoraMs, dt, b, dono ? base(dono) : null);
    }
    for (const id of this.estados.keys()) if (!vistos.has(id)) this.estados.delete(id);
  }

  /** Segue o voo da skill com `corpo` (o falcão, a cartola ou o pombo); true quando acabou. */
  private voar(corpo: Corpo, v: VooEmCurso, agoraMs: number, dt: number, estado: EstadoJogo, base: (e: Entidade) => PontoVisual, dono: Entidade | undefined): boolean {
    // O alvo que anda é seguido até o fim.
    const alvo = v.alvoId ? estado.entidades.find((x) => x.id === v.alvoId) : undefined;
    if (alvo) v.alvo = base(alvo);
    const t = (agoraMs - v.inicioMs) / (v.fimMs - v.inicioMs);
    const p = this.o.particulas;
    if (t >= 1) {
      this.chegar(v);
      return true;
    }
    const ponto = pontoDoVoo(v.forma, Math.max(0, t), v.de, v.alvo, dono ? base(dono) : v.de);
    if (dt > 0) {
      corpo.vx = (ponto.x - corpo.x) / dt;
      corpo.vy = (ponto.y - corpo.y) / dt;
    }
    corpo.x = ponto.x;
    corpo.y = ponto.y;
    corpo.altura += (ponto.altura - corpo.altura) * Math.min(1, dt * DESCIDA);
    if (agoraMs - v.ultimoRastroMs < RASTRO_MS) return false;
    v.ultimoRastroMs = agoraMs;
    const y = corpo.y - corpo.altura;
    p.emitir('falcao_rastro', corpo.x, y, v.cor);
    // O mergulho risca o ar na descida; o rasante e a espiral soltam penas pelo caminho.
    const pena = v.pombo ? 0xeef0f2 : 0xc8a165;
    if (v.forma === 'mergulho' && t > 0.55) p.emitir('falcao_velocidade', corpo.x, y, v.cor);
    if ((v.forma === 'rasante' || v.forma === 'espiral') && Math.floor(agoraMs / 120) % 2 === 0) p.emitir('falcao_penas', corpo.x, y, pena);
    return false;
  }

  /**
   * A skin Mágico. Com movimento do pássaro, a cartola espera parada e o pombo (que saiu dela num puff) voa; sem
   * movimento, a cartola vai até o pombo e ele entra (outro puff). Sem pombo fora, a cartola plana como o falcão (e o
   * grito a leva). A virada anda para 1 enquanto prepara a magia e volta a 0 depois.
   */
  private magica(st: EstadoVoo, agoraMs: number, dt: number, estado: EstadoJogo, base: (e: Entidade) => PontoVisual, b: PontoVisual, dono: Entidade | undefined): void {
    st.virada += ((agoraMs < st.magiaAteMs ? 1 : 0) - st.virada) * Math.min(1, dt * VIRADA);
    const vooDoPombo = st.voo?.pombo ? st.voo : null;
    const movimento = !!vooDoPombo || st.rapido;
    if (movimento && !st.pombo) {
      st.pombo = { x: st.x, y: st.y, vx: 0, vy: 0, altura: st.altura };
      st.espera = { x: st.x, y: st.y };
      this.puff(st);
    }
    const pombo = st.pombo;
    if (!pombo) {
      if (st.voo) {
        if (this.voar(st, st.voo, agoraMs, dt, estado, base, dono)) st.voo = null;
      } else this.planar(st, agoraMs, dt, b, dono ? base(dono) : null);
      return;
    }
    // O pombo: o voo da skill, o dash e o mergulho da IA (a mola dura até a regra) ou, na volta, de encontro à cartola.
    if (movimento) st.voltaDesdeMs = -1;
    else if (st.voltaDesdeMs < 0) st.voltaDesdeMs = agoraMs;
    const voltando = !movimento && agoraMs - st.voltaDesdeMs >= ESPERA_DA_VOLTA_MS;
    if (vooDoPombo) {
      if (this.voar(pombo, vooDoPombo, agoraMs, dt, estado, base, dono)) st.voo = null;
    } else {
      const alvo = st.rapido ? b : voltando ? { x: st.x, y: st.y } : { x: pombo.x, y: pombo.y };
      const [k, c] = st.rapido ? [RIGIDEZ_RAPIDA, AMORTECE_RAPIDO] : [RIGIDEZ_DA_VOLTA, AMORTECE_DA_VOLTA];
      pombo.vx += (k * (alvo.x - pombo.x) - c * pombo.vx) * dt;
      pombo.vy += (k * (alvo.y - pombo.y) - c * pombo.vy) * dt;
      pombo.x += pombo.vx * dt;
      pombo.y += pombo.vy * dt;
      const altura = st.bloqueando ? ALTURA_DO_BLOQUEIO : st.rapido ? ALTURA_DO_MERGULHO : voltando ? (pombo.altura + st.altura) / 2 : ALTURA_VOO;
      pombo.altura += (altura - pombo.altura) * Math.min(1, dt * (st.rapido ? DESCIDA : 4));
    }
    // A cartola: parada no ar enquanto o pássaro se move e logo depois; então os dois se encontram no caminho.
    const destino = voltando ? { x: pombo.x, y: pombo.y } : (st.espera ?? { x: st.x, y: st.y });
    st.vx += (RIGIDEZ_DA_VOLTA * (destino.x - st.x) - AMORTECE_DA_VOLTA * st.vx) * dt;
    st.vy += (RIGIDEZ_DA_VOLTA * (destino.y - st.y) - AMORTECE_DA_VOLTA * st.vy) * dt;
    st.x += st.vx * dt;
    st.y += st.vy * dt;
    st.altura += ((voltando ? pombo.altura : ALTURA_VOO) - st.altura) * Math.min(1, dt * 4);
    if (voltando && Math.hypot(pombo.x - st.x, pombo.y - st.y) < RECOLHE) {
      st.pombo = null;
      st.espera = null;
      st.voltaDesdeMs = -1;
      this.puff(st);
    }
  }

  private puff(c: Corpo): void {
    if (!this.o.reduzido()) this.o.particulas.emitir('puff_magico', c.x, c.y - c.altura, COR_DO_PUFF);
  }

  private chegar(v: VooEmCurso): void {
    const p = this.o.particulas;
    if (v.forma === 'grito') p.emitir('falcao_grito', v.alvo.x, v.alvo.y, v.cor);
    else if (v.forma !== 'circulo' && v.forma !== 'retorno') p.emitir('falcao_penas', v.alvo.x, v.alvo.y, v.pombo ? 0xeef0f2 : 0xc8a165);
    if (v.forma === 'mergulho') p.emitir('falcao_grito', v.alvo.x, v.alvo.y, v.cor);
  }

  private planar(st: EstadoVoo, agoraMs: number, dt: number, b: PontoVisual, dono: PontoVisual | null): void {
    const s = agoraMs / 1000;
    const pouso = st.magico ? { ...CABECA, altura: CABECA.aba - ELEVACAO_DA_CARTOLA * ESCALA_NA_CABECA } : OMBRO;
    const destino = st.pousado && dono
      ? { x: dono.x + pouso.x, y: dono.y + pouso.y }
      : this.o.reduzido() || st.rapido
        ? b
        : { x: b.x + DERIVA * Math.sin(s * 0.9 + st.semente), y: b.y + DERIVA * 0.8 * Math.cos(s * 0.7 + st.semente * 2) };
    if (Math.hypot(destino.x - st.x, destino.y - st.y) > SALTO) {
      Object.assign(st, { x: destino.x, y: destino.y, vx: 0, vy: 0 });
    }
    const [k, c] = st.rapido ? [RIGIDEZ_RAPIDA, AMORTECE_RAPIDO] : [RIGIDEZ, AMORTECE];
    st.vx += (k * (destino.x - st.x) - c * st.vx) * dt;
    st.vy += (k * (destino.y - st.y) - c * st.vy) * dt;
    st.x += st.vx * dt;
    st.y += st.vy * dt;
    if (st.rapido && !this.o.reduzido() && Math.hypot(st.vx, st.vy) > 3 && agoraMs - st.ultimoRastroMs >= RASTRO_MS) {
      st.ultimoRastroMs = agoraMs;
      this.o.particulas.emitir('falcao_rastro', st.x, st.y - st.altura, COR_DASH);
    }
    const altura = st.pousado ? pouso.altura : st.bloqueando ? ALTURA_DO_BLOQUEIO : st.rapido ? ALTURA_DO_MERGULHO : ALTURA_VOO;
    st.altura += (altura - st.altura) * Math.min(1, dt * (st.rapido ? DESCIDA : 6));
  }

  /** A posição desenhada: a do voo para o falcão, a da regra para os outros. */
  posicao(base: (e: Entidade) => PontoVisual): (e: Entidade) => PontoVisual {
    return (e) => {
      const st = ehFalcao(e) ? this.estados.get(e.id) : undefined;
      return st ? { x: st.x, y: st.y } : base(e);
    };
  }

  /** Altura, inclinação, tamanho, cor e quadro das asas do falcão (null para os outros). */
  ajuste(e: Entidade, agoraMs: number): AjusteVisual | null {
    const st = ehFalcao(e) ? this.estados.get(e.id) : undefined;
    if (!st) return null;
    const rapido = st.rapido || Math.hypot(st.vx, st.vy) > 4 || (st.voo !== null && st.voo.forma !== 'grito' && st.voo.forma !== 'circulo');
    const balanco = st.pousado || this.o.reduzido() ? 0 : Math.sin(agoraMs / 520 + st.semente) * 0.04;
    const comum = {
      alturaPx: (st.altura + balanco) * CELULA_PX,
      inclina: st.pousado ? 0 : Math.max(-0.35, Math.min(0.35, st.vx * 0.05)),
      zMais: st.pousado ? 2 : 0,
    };
    if (!st.magico) {
      return { ...comum, escala: st.pousado ? ESCALA_POUSADO : 1, tinta: st.voo?.tinge ? st.voo.cor : null, quadro: quadroDasAsas(agoraMs, st.semente, st.pousado, rapido) };
    }
    // A cartola gira de boca para cima; quase no fim da volta, troca para o modelo virado com a mão e a varinha.
    const virou = st.virada > 0.97;
    const pombo = st.pombo;
    return {
      ...comum,
      escala: st.pousado ? ESCALA_NA_CABECA : 1,
      tinta: null,
      quadro: st.pousado ? 2 : 0,
      modelo: virou ? 'cartola_magica' : 'cartola',
      gira: virou || st.virada < 0.03 ? 0 : st.virada * Math.PI,
      acompanhante: pombo
        ? {
            modelo: 'pombo',
            x: pombo.x,
            y: pombo.y,
            alturaPx: pombo.altura * CELULA_PX,
            angulo: Math.atan2(pombo.vy, pombo.vx),
            tinta: st.voo?.pombo && st.voo.tinge ? st.voo.cor : null,
          }
        : null,
    };
  }
}
