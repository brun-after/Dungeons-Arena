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
// Marco 22 (23/10/2026, D-089): identidade das classes em partículas. As habilidades do Aventureiro saem do falcão
// (penas no lançamento); o Mago encarnado solta a aura do elemento; o Arqueiro com a Mira firme cheia brilha, e o tiro
// carregado deixa um rastro dourado.
// Marco 23 (24/10/2026, D-092): o ar do tema da fase (neve, cinzas, folhas…, da qualidade média para cima) e a aura do
// elemento nos inimigos afins.

import { celulasDaForma } from '../combat/formas';
import type { BuscaHabilidade } from '../combat/habilidades';
import type { Fase } from '../world/fase';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import type { EstadoJogo } from '../core/estado';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import type { Entidade, PontoVisual } from '../entities/entidade';
import { encarnacaoDe, type ElementoEncarnado } from '../combat/encarnacao';
import type { ControladorImpacto } from './impacto';
import type { SistemaParticulas } from './particulas';
import type { NomePreset } from './presets-particula';
import type { ParticulaClima } from '../world/temas';
import type { Elemento } from '../combat/elementos';
import type { PresetQualidade } from './qualidade';
import { visualDe } from './visual-habilidade';
import { AURA_DO_ESTADO, presetDeConjuracao, presetDeImpacto } from './materiais';

const INTERVALO_CONJURACAO_MS = 120;
const INTERVALO_RASTRO_MS = 30;
const INTERVALO_AURA_MS = 320;
/** Ajuste de 24/10/2026 (D-091): a encarnação do Mago, andando (trilha) e parado (respiro). */
const INTERVALO_TRILHA_MS = 70;
const INTERVALO_RESPIRO_MS = 1400;
const INTERVALO_POEIRA_MS = 220;
const INTERVALO_CLIMA_MS = 140;
const INTERVALO_AFINIDADE_MS = 420;
const INTERVALO_CHAO_MS = 160;


const cor = (hex: string) => Number.parseInt(hex.slice(1), 16);

/** Marco 22 (D-089): a aura e a cor de cada encarnação do Mago. */
// Marco 24 (24/10/2026, D-095): as encarnações de terra, veneno, trevas e luz.
const ENCARNACAO: Record<ElementoEncarnado, { preset: NomePreset; cor: number }> = {
  fogo: { preset: 'brasas', cor: 0xff6b3d },
  gelo: { preset: 'cristais', cor: 0x85c1e9 },
  raio: { preset: 'faiscas', cor: 0xbb8fce },
  terra: { preset: 'pedra', cor: 0xb08d57 },
  veneno: { preset: 'bolhas', cor: 0x58d68d },
  trevas: { preset: 'sombra', cor: 0x6c3483 },
  sagrado: { preset: 'sagrado', cor: 0xf7dc6f },
};
const COR_MIRA = 0xf9e79f;
const COR_PENAS = 0xc8a165;

export interface OpcoesEfeitos {
  /** Ajuste de 15/10/2026: a fase, para as células da área (linha para na parede). */
  fase: Fase;
  particulas: SistemaParticulas;
  impacto: ControladorImpacto;
  habilidades: BuscaHabilidade;
  idLocal: string;
  qualidade: () => PresetQualidade;
  /** Marco 22 (D-089): a Mira firme do Arqueiro está cheia (o brilho na mão)? */
  miraCheia?: (e: Entidade, tick: number) => boolean;
  /** Marco 23 (D-092): as partículas do ar do tema da fase e a cor de cada elemento (a aura dos afins). */
  clima?: ParticulaClima | null;
  corElemento?: (e: Elemento) => number;
}

export class EfeitosDeHabilidade {
  private readonly conjurando = new Map<number, { atorId: string; chave: string; ateTick: number; ultimoMs: number }>();
  /** Ações de área esperando o lançamento: de onde saem e onde caem. */
  private readonly areas = new Map<number, { chave: string; origem: PontoVisual; mira: PontoVisual; raioCombo?: number; ateTick: number }>();
  private readonly ultimoRastro = new Map<number, number>();
  private readonly ultimaAura = new Map<string, number>();
  private ultimaPoeira = 0;
  private ultimoChao = 0;
  /** Posições em células conhecidas no quadro anterior (para eventos de quem já saiu do mundo). */
  private readonly posicoes = new Map<string, PontoVisual>();
  /** Ajuste de 24/10/2026: onde o Mago encarnado estava no quadro anterior (para saber se anda). */
  private readonly ultimaPosicao = new Map<string, PontoVisual>();
  /** Marco 22: os projéteis do tiro carregado (rastro dourado). */
  private readonly carregados = new Set<number>();
  private carregadoDe: string | null = null;

  constructor(private readonly o: OpcoesEfeitos) {}

  ligar(bus: Barramento<EventosDaSimulacao>, estado: () => EstadoJogo, agora: () => number): void {
    const pos = (id: string): PontoVisual | null => {
      const e = estado().entidades.find((x) => x.id === id);
      return e ? { x: e.x, y: e.y } : (this.posicoes.get(id) ?? null);
    };
    // Marco 22 (D-089): a habilidade do Aventureiro (que não o básico) parte do falcão.
    const quemLanca = (atorId: string, chave: string): string => {
      const st = estado();
      const dono = st.entidades.find((x) => x.id === atorId);
      const falcao = st.entidades.find((x) => !x.morto && x.invocacao?.companheiro === true && x.invocacao.donoId === atorId);
      const h = this.o.habilidades(chave);
      return falcao && dono && h && h.id !== dono.ataqueBasico ? falcao.id : atorId;
    };
    bus.on('acaoIniciada', (ev) => {
      const h = this.o.habilidades(ev.chave);
      const lancador = quemLanca(ev.atorId, ev.chave);
      const ator = pos(lancador);
      if (h?.politicaImpacto === 'area' && ator) {
        this.areas.set(ev.acaoId, { chave: ev.chave, origem: ator, mira: { x: ev.alvoX, y: ev.alvoY }, ...(ev.raioCombo ? { raioCombo: ev.raioCombo } : {}), ateTick: ev.lancamentoTick });
      }
      if (!h || !visualDe(h).conjuracao) return;
      this.conjurando.set(ev.acaoId, { atorId: lancador, chave: ev.chave, ateTick: ev.lancamentoTick, ultimoMs: 0 });
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
      // Marco 24 (25/10/2026): a matéria do elemento no acerto (nos 3 primeiros alvos da área, pelo custo).
      if (h.elemento && ev.dano > 0 && ev.indice < 3) this.o.particulas.emitir(presetDeImpacto(h.elemento), alvo.x, alvo.y, v.cor);
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
    bus.on('armadilhaDisparou', (ev) => {
      const p = ev.x !== undefined && ev.y !== undefined ? { x: ev.x, y: ev.y } : pos(ev.alvoId);
      if (!p) return;
      this.o.particulas.emitir('explosao', p.x, p.y, 0xff6437);
      this.o.particulas.emitir('estrelas', p.x, p.y, 0xffdf87);
      if (ev.alvoId === this.o.idLocal) this.o.impacto.pedir('forte', agora());
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
    bus.on('encarnou', (ev) => {
      const p = pos(ev.id);
      const e = ENCARNACAO[ev.elemento];
      if (!p) return;
      this.o.particulas.emitir('onda', p.x, p.y, e.cor);
      this.o.particulas.emitir(e.preset, p.x, p.y, e.cor);
    });
    // Marco 22 (D-090): o morto longe demais some numa fumaça e reaparece ao lado do Necromante.
    bus.on('invocacaoRetornou', (ev) => {
      this.o.particulas.emitir('fumaca', ev.deX, ev.deY, 0x7ee0bb);
      this.o.particulas.emitir('sombra', ev.x, ev.y, 0x7ee0bb);
    });
    bus.on('tiroCarregado', (ev) => {
      // O projétil do tiro carregado vem logo depois, no mesmo tick.
      this.carregadoDe = ev.id;
      const p = pos(ev.id);
      if (p) this.o.particulas.emitir('estrelas', p.x, p.y, COR_MIRA);
    });
    bus.on('projetilLancado', (ev) => {
      if (this.carregadoDe === ev.donoId) {
        this.carregados.add(ev.projetilId);
        this.carregadoDe = null;
      }
      const dono = estado().entidades.find((x) => x.id === ev.donoId);
      const falcao = estado().entidades.find((x) => !x.morto && x.invocacao?.companheiro === true && x.invocacao.donoId === ev.donoId);
      const p = falcao && dono && ev.habilidadeId !== dono.ataqueBasico ? pos(falcao.id) : null;
      if (p) this.o.particulas.emitir('vento', p.x, p.y, COR_PENAS);
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
      // Marco 24 (25/10/2026): a matéria do elemento na mão de quem conjura (chamas, geada, arcos, bolhas…).
      if (pos && h?.elemento) p.emitir(presetDeConjuracao(h.elemento), pos.x, pos.y, v?.cor ?? 0xffffff);
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
      // Ajuste de 24/10/2026 (D-091): o tiro carregado é uma flecha com esteira dourada (não uma bola de brilho).
      if (this.carregados.has(pr.id)) p.emitir('esteira_carregada', pr.x, pr.y, COR_MIRA, undefined, { x: pr.dirX, y: pr.dirY });
    }
    if (this.ultimoRastro.size > 64) this.ultimoRastro.clear();
    if (this.carregados.size > 0) for (const id of this.carregados) if (!estado.projeteis.some((pr) => pr.id === id)) this.carregados.delete(id);
    if (q.auras) this.auras(estado, agoraMs);
    // Marco 11A: os rastros no chão são partícula na cor do efeito (não quadrados pintados).
    if (agoraMs - this.ultimoChao >= INTERVALO_CHAO_MS) {
      this.ultimoChao = agoraMs;
      for (const r of estado.rastros) p.emitir('chao', r.x, r.y, cor(REGISTRO_EFEITOS[r.tipo].cor));
    }
    const clima = this.o.clima;
    if (clima ? q.auras : q.poeira) {
      if (agoraMs - this.ultimaPoeira > (clima ? INTERVALO_CLIMA_MS : INTERVALO_POEIRA_MS)) {
        this.ultimaPoeira = agoraMs;
        const eu = this.posicoes.get(this.o.idLocal);
        if (eu && clima) p.emitir(`clima_${clima}`, eu.x, eu.y, 0xffffff, undefined, { x: 1, y: 0.25 });
        else if (eu) p.emitir('poeira', eu.x, eu.y, 0xd8cfb8);
      }
    }
  }

  /** A explosão pela área: o impacto do visual e a onda no centro, e faíscas em até 6 células sorteadas. */
  private explodirArea(a: { chave: string; origem: PontoVisual; mira: PontoVisual; raioCombo?: number }): void {
    const base = this.o.habilidades(a.chave);
    const h = base && a.raioCombo ? { ...base, raioArea: a.raioCombo } : base;
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

  /** Parado: um respiro a cada `INTERVALO_RESPIRO_MS`. Andando: a trilha a cada `INTERVALO_TRILHA_MS`, onde ele passou. */
  private encarnacaoVisual(id: string, pos: PontoVisual, cor: number, agoraMs: number): void {
    const antes = this.ultimaPosicao.get(id);
    this.ultimaPosicao.set(id, { x: pos.x, y: pos.y });
    const rastro = antes && Math.hypot(pos.x - antes.x, pos.y - antes.y) > 0.01 ? antes : null;
    const chave = `encarnacao:${id}`;
    if (agoraMs - (this.ultimaAura.get(chave) ?? 0) < (rastro ? INTERVALO_TRILHA_MS : INTERVALO_RESPIRO_MS)) return;
    this.ultimaAura.set(chave, agoraMs);
    if (rastro) this.o.particulas.emitir('trilha_elemental', rastro.x, rastro.y, cor);
    else this.o.particulas.emitir('aura_sutil', pos.x, pos.y, cor);
  }

  private auras(estado: EstadoJogo, agoraMs: number): void {
    for (const e of estado.entidades) {
      if (e.morto) continue;
      const status = e.efeitos.filter((f) => f.ateTick > estado.tick && REGISTRO_EFEITOS[f.tipo].ehStatus);
      const primeiro = status[0];
      if (!primeiro || agoraMs - (this.ultimaAura.get(e.id) ?? 0) < INTERVALO_AURA_MS) continue;
      this.ultimaAura.set(e.id, agoraMs);
      const pos = this.posicoes.get(e.id);
      if (pos) this.o.particulas.emitir(AURA_DO_ESTADO[primeiro.tipo] ?? 'aura', pos.x, pos.y, cor(REGISTRO_EFEITOS[primeiro.tipo].cor));
    }
    // Marco 22 (D-089): a encarnação do Mago e o brilho do Arqueiro com a Mira firme cheia. Ajuste de 24/10/2026
    // (D-091): a encarnação é sutil com o Mago parado e vira uma trilha elegante quando ele anda.
    for (const e of estado.entidades) {
      if (e.morto) continue;
      const pos = this.posicoes.get(e.id);
      if (!pos) continue;
      const el = encarnacaoDe(e);
      if (el) {
        this.encarnacaoVisual(e.id, pos, ENCARNACAO[el].cor, agoraMs);
        continue;
      }
      if (this.o.miraCheia?.(e, estado.tick) !== true) continue;
      const chave = `classe:${e.id}`;
      if (agoraMs - (this.ultimaAura.get(chave) ?? 0) < INTERVALO_AURA_MS) continue;
      this.ultimaAura.set(chave, agoraMs);
      this.o.particulas.emitir('brilho', pos.x, pos.y, COR_MIRA);
    }
    // Marco 23 (D-092): o inimigo afim solta o elemento dele.
    for (const e of estado.entidades) {
      const a = e.afinidade;
      if (e.morto || !a || !this.o.corElemento) continue;
      const chave = `afinidade:${e.id}`;
      if (agoraMs - (this.ultimaAura.get(chave) ?? 0) < INTERVALO_AFINIDADE_MS) continue;
      this.ultimaAura.set(chave, agoraMs);
      const pos = this.posicoes.get(e.id);
      if (pos) this.o.particulas.emitir(a.extrema ? 'aura_afinidade_extrema' : 'aura_afinidade', pos.x, pos.y, this.o.corElemento(a.elemento));
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
