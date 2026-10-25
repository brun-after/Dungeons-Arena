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
import type { SistemaParticulas } from './particulas';
import type { AjusteVisual } from './sprites';
import { pontoDoVoo, quadroDasAsas, VOOS_SKILL, vooDaUltimate, type VooDeSkill } from './voos-falcao';

/** Rigidez e amortecimento da mola (um pouco abaixo do crítico: o falcão passa do ponto e volta, como quem plana). */
const RIGIDEZ = 16;
const AMORTECE = 2 * Math.sqrt(RIGIDEZ) * 0.7;
/** A deriva em volta da célula, em células. */
const DERIVA = 0.32;
/** O ombro do dono, em células a partir dos pés, e a altura extra para o falcão menor ficar no ombro. */
const OMBRO = { x: 0.14, y: -0.04, altura: 0.16 };
const ESCALA_POUSADO = 0.7;
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
}

interface EstadoVoo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  altura: number;
  semente: number;
  voo: VooEmCurso | null;
  pousado: boolean;
}

export interface OpcoesVooFalcao {
  particulas: SistemaParticulas;
  habilidades: BuscaHabilidade;
  /** O par de skills da ultimate (pelo id da habilidade, com ou sem a etapa), null se não for ultimate. */
  parDaUltimate: (id: string) => readonly string[] | null;
  reduzido: () => boolean;
}

const ehFalcao = (e: Entidade) => e.invocacao?.companheiro === true && !e.morto;

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
      if (!voo || !st || this.o.reduzido()) return;
      const alvo = ev.alvoId ? estado().entidades.find((x) => x.id === ev.alvoId) : undefined;
      const duracao = Math.max(voo.forma === 'circulo' ? 900 : 300, msDe(ev.impactoPrevistoTick - ev.tick));
      const ms = agora();
      st.voo = { ...voo, de: { x: st.x, y: st.y }, alvoId: alvo?.id ?? null, alvo: alvo ? { x: alvo.x, y: alvo.y } : { x: ev.alvoX, y: ev.alvoY }, inicioMs: ms, fimMs: ms + duracao, ultimoRastroMs: 0 };
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
        st = { x: b.x, y: b.y, vx: 0, vy: 0, altura: 0, semente: this.estados.size + 1, voo: null, pousado: false };
        this.estados.set(e.id, st);
      }
      const dono = estado.entidades.find((x) => x.id === e.invocacao?.donoId);
      st.pousado = e.ia?.modo === 'pousado' && !st.voo;
      if (st.voo) this.voar(st, agoraMs, dt, estado, base, dono);
      else this.planar(st, agoraMs, dt, b, dono ? base(dono) : null);
    }
    for (const id of this.estados.keys()) if (!vistos.has(id)) this.estados.delete(id);
  }

  private voar(st: EstadoVoo, agoraMs: number, dt: number, estado: EstadoJogo, base: (e: Entidade) => PontoVisual, dono: Entidade | undefined): void {
    const v = st.voo;
    if (!v) return;
    // O alvo que anda é seguido até o fim.
    const alvo = v.alvoId ? estado.entidades.find((x) => x.id === v.alvoId) : undefined;
    if (alvo) v.alvo = base(alvo);
    const t = (agoraMs - v.inicioMs) / (v.fimMs - v.inicioMs);
    const p = this.o.particulas;
    if (t >= 1) {
      this.chegar(v);
      st.voo = null;
      return;
    }
    const ponto = pontoDoVoo(v.forma, Math.max(0, t), v.de, v.alvo, dono ? base(dono) : v.de);
    if (dt > 0) {
      st.vx = (ponto.x - st.x) / dt;
      st.vy = (ponto.y - st.y) / dt;
    }
    st.x = ponto.x;
    st.y = ponto.y;
    st.altura = ponto.altura;
    if (agoraMs - v.ultimoRastroMs < RASTRO_MS) return;
    v.ultimoRastroMs = agoraMs;
    const y = st.y - st.altura;
    p.emitir('falcao_rastro', st.x, y, v.cor);
    // O mergulho risca o ar na descida; o rasante e a espiral soltam penas pelo caminho.
    if (v.forma === 'mergulho' && t > 0.55) p.emitir('falcao_velocidade', st.x, y, v.cor);
    if ((v.forma === 'rasante' || v.forma === 'espiral') && Math.floor(agoraMs / 120) % 2 === 0) p.emitir('falcao_penas', st.x, y, 0xc8a165);
  }

  private chegar(v: VooEmCurso): void {
    const p = this.o.particulas;
    if (v.forma === 'grito') p.emitir('falcao_grito', v.alvo.x, v.alvo.y, v.cor);
    else if (v.forma !== 'circulo' && v.forma !== 'retorno') p.emitir('falcao_penas', v.alvo.x, v.alvo.y, 0xc8a165);
    if (v.forma === 'mergulho') p.emitir('falcao_grito', v.alvo.x, v.alvo.y, v.cor);
  }

  private planar(st: EstadoVoo, agoraMs: number, dt: number, b: PontoVisual, dono: PontoVisual | null): void {
    const s = agoraMs / 1000;
    const destino = st.pousado && dono
      ? { x: dono.x + OMBRO.x, y: dono.y + OMBRO.y }
      : this.o.reduzido()
        ? b
        : { x: b.x + DERIVA * Math.sin(s * 0.9 + st.semente), y: b.y + DERIVA * 0.8 * Math.cos(s * 0.7 + st.semente * 2) };
    if (Math.hypot(destino.x - st.x, destino.y - st.y) > SALTO) {
      Object.assign(st, { x: destino.x, y: destino.y, vx: 0, vy: 0 });
    }
    st.vx += (RIGIDEZ * (destino.x - st.x) - AMORTECE * st.vx) * dt;
    st.vy += (RIGIDEZ * (destino.y - st.y) - AMORTECE * st.vy) * dt;
    st.x += st.vx * dt;
    st.y += st.vy * dt;
    const altura = st.pousado ? OMBRO.altura : 0;
    st.altura += (altura - st.altura) * Math.min(1, dt * 6);
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
    const rapido = Math.hypot(st.vx, st.vy) > 4 || (st.voo !== null && st.voo.forma !== 'grito' && st.voo.forma !== 'circulo');
    const balanco = st.pousado || this.o.reduzido() ? 0 : Math.sin(agoraMs / 520 + st.semente) * 0.04;
    return {
      alturaPx: (st.altura + balanco) * CELULA_PX,
      inclina: st.pousado ? 0 : Math.max(-0.35, Math.min(0.35, st.vx * 0.05)),
      escala: st.pousado ? ESCALA_POUSADO : 1,
      tinta: st.voo?.tinge ? st.voo.cor : null,
      quadro: quadroDasAsas(agoraMs, st.semente, st.pousado, rapido),
      zMais: st.pousado ? 2 : 0,
    };
  }
}
