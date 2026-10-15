// Efeitos de habilidade (§2.16, §5.3 das sugestões, D-056). Marco 12 (14/10/2026). Só lê eventos e estado:
// - conjuração: do `acaoIniciada` até o `lancamentoTick` (a telegrafia continua sendo a barra);
// - viagem: rastro do projétil em voo;
// - impacto: no evento `impacto`, no alvo; crítico, área e chefe pedem tremor;
// - persistentes: aura dos status ativos, na cor do registro, enquanto durarem;
// - poeira no ar, só na qualidade alta.
// O tempo é o da simulação: o impacto que se vê é o que aconteceu.
// Marco 14 (14/10/2026): a habilidade vem pela chave do evento (geradas e ranks); do rank 4 em diante o impacto
// solta o dobro de partículas.

import type { BuscaHabilidade } from '../combat/habilidades';
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
const INTERVALO_RASTRO_MS = 50;
const INTERVALO_AURA_MS = 320;
const INTERVALO_POEIRA_MS = 220;

/** Aura por tipo de status; os demais usam `aura` na cor do registro. */
const AURA: Partial<Record<TipoEfeito, NomePreset>> = {
  dano_periodico: 'brasas',
  atordoar: 'estrelas',
  imune_dano: 'anel',
  sem_movimento: 'fumaca',
};

const cor = (hex: string) => Number.parseInt(hex.slice(1), 16);

export interface OpcoesEfeitos {
  particulas: SistemaParticulas;
  impacto: ControladorImpacto;
  habilidades: BuscaHabilidade;
  idLocal: string;
  qualidade: () => PresetQualidade;
}

export class EfeitosDeHabilidade {
  private readonly conjurando = new Map<number, { atorId: string; chave: string; ateTick: number; ultimoMs: number }>();
  private readonly ultimoRastro = new Map<number, number>();
  private readonly ultimaAura = new Map<string, number>();
  private ultimaPoeira = 0;
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
        if (v.impacto === 'raio' && fonte) this.o.particulas.emitir('raio', fonte.x, fonte.y, v.cor, alvo);
        else if (v.impacto && (ev.dano > 0 || ev.cura > 0 || ev.d20 === 0)) this.o.particulas.emitir(v.impacto, alvo.x, alvo.y, v.cor);
      }
      if (ev.indice > 0) return;
      const agoraMs = agora();
      if (ev.critico || v.camera === 'forte') this.o.impacto.pedir('forte', agoraMs);
      else if (v.camera === 'leve') this.o.impacto.pedir('leve', agoraMs);
      // Dano grande em você (≥ 20% da vida máxima): tremor e flash vermelhos.
      const local = estado().entidades.find((e) => e.id === this.o.idLocal);
      if (ev.alvoId === this.o.idLocal && local && ev.dano >= local.hpMax * 0.2) this.o.impacto.pedir('dano', agoraMs);
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
    for (const pr of estado.projeteis) {
      if (agoraMs - (this.ultimoRastro.get(pr.id) ?? 0) < INTERVALO_RASTRO_MS) continue;
      this.ultimoRastro.set(pr.id, agoraMs);
      const h = this.o.habilidades(pr.chave);
      const v = h ? visualDe(h) : null;
      if (v?.viagem) p.emitir(v.viagem, pr.x, pr.y, v.cor);
    }
    if (this.ultimoRastro.size > 64) this.ultimoRastro.clear();
    if (q.auras) this.auras(estado, agoraMs);
    if (q.poeira && agoraMs - this.ultimaPoeira > INTERVALO_POEIRA_MS) {
      this.ultimaPoeira = agoraMs;
      const eu = this.posicoes.get(this.o.idLocal);
      if (eu) p.emitir('poeira', eu.x, eu.y, 0xd8cfb8);
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
  }
}
