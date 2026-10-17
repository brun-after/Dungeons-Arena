// Efeitos de habilidade (§2.16, §5.3 das sugestões, D-056). Marco 12 (14/10/2026). Só lê eventos e estado:
// - conjuração: do `acaoIniciada` até o `lancamentoTick` (a telegrafia continua sendo a barra);
// - viagem: rastro do projétil em voo;
// - impacto: no evento `impacto`, no alvo; crítico, área e chefe pedem tremor;
// - persistentes: aura dos status ativos, na cor do registro, enquanto durarem;
// - poeira no ar, só na qualidade alta.
// O tempo é o da simulação: o impacto que se vê é o que aconteceu.
// Marco 14 (14/10/2026): a habilidade vem pela chave do evento (geradas e ranks); do rank 4 em diante o impacto
// solta o dobro de partículas.
// Ajuste de 15/10/2026 (D-060): a habilidade de área explode pela área no lançamento — o impacto do visual em
// pontos espalhados pelas células e uma onda saindo do centro —, mesmo sem ninguém atingido. Cancelada, não explode.

import { celulasDaForma } from '../combat/formas';
import type { BuscaHabilidade } from '../combat/habilidades';
import type { Fase } from '../world/fase';
import { REGISTRO_EFEITOS, type TipoEfeito } from '../combat/registro-efeitos';
import type { EstadoJogo } from '../core/estado';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import type { Entidade, PontoVisual } from '../entities/entidade';
import type { ControladorImpacto } from './impacto';
import type { SistemaParticulas } from './particulas';
import type { NomePreset } from './presets-particula';
import type { PresetQualidade } from './qualidade';
import { visualDe } from './visual-habilidade';

const INTERVALO_CONJURACAO_MS = 120;
const INTERVALO_RASTRO_MS = 30;
const INTERVALO_AURA_MS = 320;
const INTERVALO_POEIRA_MS = 220;
const INTERVALO_CHAO_MS = 160;

/** Aura por tipo de status; os demais usam `aura` na cor do registro. */
const AURA: Partial<Record<TipoEfeito, NomePreset>> = {
  dano_periodico: 'brasas',
  atordoar: 'estrelas',
  imune_dano: 'anel',
  sem_movimento: 'fumaca',
};

const cor = (hex: string) => Number.parseInt(hex.slice(1), 16);

export interface OpcoesEfeitos {
  /** Ajuste de 15/10/2026: a fase, para as células da área (linha para na parede). */
  fase: Fase;
  particulas: SistemaParticulas;
  impacto: ControladorImpacto;
  habilidades: BuscaHabilidade;
  idLocal: string;
  qualidade: () => PresetQualidade;
}

export class EfeitosDeHabilidade {
  private readonly conjurando = new Map<number, { atorId: string; chave: string; ateTick: number; ultimoMs: number }>();
  /** Ações de área esperando o lançamento: de onde saem e onde caem. */
  private readonly areas = new Map<number, { chave: string; origem: PontoVisual; mira: PontoVisual; ateTick: number }>();
  private readonly ultimoRastro = new Map<number, number>();
  private readonly ultimaAura = new Map<string, number>();
  private ultimaPoeira = 0;
  private ultimoChao = 0;
  /** Posições em células conhecidas no quadro anterior (para eventos de quem já saiu do mundo). */
  private readonly posicoes = new Map<string, PontoVisual>();

  constructor(private readonly o: OpcoesEfeitos) {}

  ligar(bus: Barramento<EventosDaSimulacao>, estado: () => EstadoJogo, agora: () => number): void {
    const pos = (id: string): PontoVisual | null => {
      const e = estado().entidades.find((x) => x.id === id);
      return e ? { x: e.x, y: e.y } : (this.posicoes.get(id) ?? null);
    };
    bus.on('acaoIniciada', (ev) => {
      const h = this.o.habilidades(ev.chave);
      const ator = pos(ev.atorId);
      if (h?.politicaImpacto === 'area' && ator) {
        this.areas.set(ev.acaoId, { chave: ev.chave, origem: ator, mira: { x: ev.alvoX, y: ev.alvoY }, ateTick: ev.lancamentoTick });
      }
      if (!h || !visualDe(h).conjuracao) return;
      this.conjurando.set(ev.acaoId, { atorId: ev.atorId, chave: ev.chave, ateTick: ev.lancamentoTick, ultimoMs: 0 });
    });
    bus.on('impacto', (ev) => {
      const h = this.o.habilidades(ev.chave);
      const alvo = pos(ev.alvoId);
      if (!h || !alvo) return;
      const v = visualDe(h);
      const fonte = pos(ev.fonteId);
      const vezes = h.escalaVisual >= 1.4 ? 2 : 1;
      for (let i = 0; i < vezes; i++) {
        // Raio e relâmpago correm da fonte ao alvo (marco 11A: o relâmpago é o raio com ramificação).
        if ((v.impacto === 'raio' || v.impacto === 'relampago') && fonte) this.o.particulas.emitir(v.impacto, fonte.x, fonte.y, v.cor, alvo);
        // D-067: chuva e leque já desenham as flechas pela área; no alvo, as farpas do acerto.
        else if (v.impacto && (ev.dano > 0 || ev.cura > 0 || ev.d20 === 0)) this.o.particulas.emitir(v.impacto === 'chuva' || v.impacto === 'leque' ? 'farpas' : v.impacto, alvo.x, alvo.y, v.cor);
      }
      if (ev.indice > 0) return;
      const agoraMs = agora();
      if (ev.critico || v.camera === 'forte') this.o.impacto.pedir('forte', agoraMs);
      else if (v.camera === 'leve') this.o.impacto.pedir('leve', agoraMs);
      // Dano grande em você (≥ 20% da vida máxima): tremor e flash vermelhos.
      const local = estado().entidades.find((e) => e.id === this.o.idLocal);
      if (ev.alvoId === this.o.idLocal && local && ev.dano >= local.hpMax * 0.2) this.o.impacto.pedir('dano', agoraMs);
    });
    bus.on('acaoCancelada', (ev) => {
      this.areas.delete(ev.acaoId);
      this.conjurando.delete(ev.acaoId);
    });
    bus.on('explodiu', (ev) => {
      this.o.particulas.emitir('explosao', ev.x, ev.y, 0xff8c42);
      this.o.impacto.pedir('forte', agora());
    });
    bus.on('morreu', (ev) => {
      const e = estado().entidades.find((x) => x.id === ev.id);
      const p = pos(ev.id);
      if (p) this.o.particulas.emitir('fumaca', p.x, p.y, 0x777777);
      if (e?.arquetipo === 'boss') this.o.impacto.pedir('forte', agora());
    });
    bus.on('subiuNivel', (ev) => {
      const p = pos(ev.id);
      if (p) this.o.particulas.emitir('estrelas', p.x, p.y, 0xf1c40f);
    });
    bus.on('invocou', (ev) => {
      const p = pos(ev.id);
      if (p) this.o.particulas.emitir('anel', p.x, p.y, 0x1abc9c);
    });
  }

  /** Por quadro: conjurações em curso, rastros de projétil, auras e poeira. */
  quadro(estado: EstadoJogo, agoraMs: number, posicao: (e: Entidade) => PontoVisual): void {
    const q = this.o.qualidade();
    const p = this.o.particulas;
    this.posicoes.clear();
    for (const e of estado.entidades) this.posicoes.set(e.id, posicao(e));
    for (const [acaoId, c] of this.conjurando) {
      if (estado.tick >= c.ateTick) {
        this.conjurando.delete(acaoId);
        continue;
      }
      if (agoraMs - c.ultimoMs < INTERVALO_CONJURACAO_MS) continue;
      c.ultimoMs = agoraMs;
      const pos = this.posicoes.get(c.atorId);
      const h = this.o.habilidades(c.chave);
      const v = h ? visualDe(h) : null;
      if (pos && v?.conjuracao) p.emitir(v.conjuracao, pos.x, pos.y, v.cor);
    }
    for (const [acaoId, a] of this.areas) {
      if (estado.tick < a.ateTick) continue;
      this.areas.delete(acaoId);
      this.explodirArea(a);
    }
    for (const pr of estado.projeteis) {
      if (agoraMs - (this.ultimoRastro.get(pr.id) ?? 0) < INTERVALO_RASTRO_MS) continue;
      this.ultimoRastro.set(pr.id, agoraMs);
      const h = this.o.habilidades(pr.chave);
      const v = h ? visualDe(h) : null;
      if (v?.viagem) p.emitir(v.viagem, pr.x, pr.y, v.cor, undefined, { x: pr.dirX, y: pr.dirY });
    }
    if (this.ultimoRastro.size > 64) this.ultimoRastro.clear();
    if (q.auras) this.auras(estado, agoraMs);
    // Marco 11A: os rastros no chão são partícula na cor do efeito (não quadrados pintados).
    if (agoraMs - this.ultimoChao >= INTERVALO_CHAO_MS) {
      this.ultimoChao = agoraMs;
      for (const r of estado.rastros) p.emitir('chao', r.x, r.y, cor(REGISTRO_EFEITOS[r.tipo].cor));
    }
    if (q.poeira && agoraMs - this.ultimaPoeira > INTERVALO_POEIRA_MS) {
      this.ultimaPoeira = agoraMs;
      const eu = this.posicoes.get(this.o.idLocal);
      if (eu) p.emitir('poeira', eu.x, eu.y, 0xd8cfb8);
    }
  }

  /** A explosão pela área: o impacto do visual e a onda no centro, e faíscas em até 6 células sorteadas. */
  private explodirArea(a: { chave: string; origem: PontoVisual; mira: PontoVisual }): void {
    const h = this.o.habilidades(a.chave);
    if (!h) return;
    const v = visualDe(h);
    const celulas = celulasDaForma(h, { x: Math.round(a.origem.x), y: Math.round(a.origem.y) }, a.mira, this.o.fase);
    if (celulas.length === 0) return;
    const centro = {
      x: celulas.reduce((s, c) => s + c.x, 0) / celulas.length,
      y: celulas.reduce((s, c) => s + c.y, 0) / celulas.length,
    };
    const p = this.o.particulas;
    const impacto = v.impacto && v.impacto !== 'raio' && v.impacto !== 'relampago' ? v.impacto : null;
    // Marco 11A (D-066): a forma do ataque em partículas.
    if (h.tipoArea === 'linha') {
      // Feixe: o impacto corre de quem conjura até a ponta da linha, mais faíscas pelo caminho.
      const ponta = celulas.reduce((m, c) => (Math.hypot(c.x - a.origem.x, c.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? c : m), celulas[0] ?? a.origem);
      p.emitir(impacto ?? 'relampago', a.origem.x, a.origem.y, v.cor, ponta);
      p.emitir('faiscas', a.origem.x, a.origem.y, v.cor, ponta);
    } else if (impacto === 'chuva') {
      // Ajuste de 16/10/2026 (D-067): a chuva de flechas cai em até 10 células da área, sem onda nem faíscas.
      const sorteadas = [...celulas].sort(() => Math.random() - 0.5);
      for (const c of sorteadas.slice(0, 10)) p.emitir('chuva', c.x + (Math.random() - 0.5) * 0.4, c.y + (Math.random() - 0.5) * 0.4, v.cor);
    } else if (impacto === 'leque') {
      // D-067: o leque sai de quem atira, em cone para o meio da área.
      p.emitir('leque', a.origem.x, a.origem.y, v.cor, centro);
    } else {
      // Rajada pela área: o impacto em até 5 células espalhadas, faíscas no resto; a onda só nas redondas.
      if (h.tipoArea !== 'cone') p.emitir('onda', centro.x, centro.y, v.cor);
      const sorteadas = [...celulas].sort(() => Math.random() - 0.5);
      for (const c of sorteadas.slice(0, 5)) p.emitir(impacto ?? 'faiscas', c.x + (Math.random() - 0.5) * 0.5, c.y + (Math.random() - 0.5) * 0.5, v.cor);
      for (const c of sorteadas.slice(5, 11)) p.emitir('faiscas', c.x + (Math.random() - 0.5) * 0.6, c.y + (Math.random() - 0.5) * 0.6, v.cor);
    }
  }

  private auras(estado: EstadoJogo, agoraMs: number): void {
    for (const e of estado.entidades) {
      if (e.morto) continue;
      const status = e.efeitos.filter((f) => f.ateTick > estado.tick && REGISTRO_EFEITOS[f.tipo].ehStatus);
      const primeiro = status[0];
      if (!primeiro || agoraMs - (this.ultimaAura.get(e.id) ?? 0) < INTERVALO_AURA_MS) continue;
      this.ultimaAura.set(e.id, agoraMs);
      const pos = this.posicoes.get(e.id);
      if (pos) this.o.particulas.emitir(AURA[primeiro.tipo] ?? 'aura', pos.x, pos.y, cor(REGISTRO_EFEITOS[primeiro.tipo].cor));
    }
    // Marco 18 (D-069): quem veste Lendária solta fagulhas âmbar; a Última, uma aura carmim (partículas, nunca forma).
    for (const e of estado.entidades) {
      const forma = e.aparencia?.formaMaxima;
      if (e.morto || (forma !== 'lendaria' && forma !== 'ultima')) continue;
      const chave = `forma:${e.id}`;
      if (agoraMs - (this.ultimaAura.get(chave) ?? 0) < (forma === 'ultima' ? INTERVALO_AURA_MS : INTERVALO_AURA_MS * 2)) continue;
      this.ultimaAura.set(chave, agoraMs);
      const pos = this.posicoes.get(e.id);
      if (pos) this.o.particulas.emitir('aura_forma', pos.x, pos.y, forma === 'ultima' ? COR_ULTIMA : COR_LENDARIA);
    }
  }
}

const COR_LENDARIA = 0xf39c12;
const COR_ULTIMA = 0xff4d6d;
