// O golpe de cada arma em partículas (marco 24, 25/10/2026, D-098). Só lê eventos e estado:
// - no impacto de um golpe de arma (o básico e as skills físicas de perto), o rastro pela natureza dele — corte em leque,
//   machadada com lascas, esmagar com o anel de choque, estocada com o traço da ponta — orientado de quem bate para o alvo;
// - a cor do rastro: o elemento da arma, a fúria (Guerreiro) ou o aço; o material do elemento no alvo;
// - por cima, a forma da arma (Épica, Lendária, Última), mais intensa quanto mais poderosa;
// - o giro (Redemoinho e afins): o vento girando junto do corpo enquanto dura e o anel de lâminas no lançamento;
// - no Guerreiro, a pausa curta também no básico (o golpe pesa mais).
// O que o golpe de arma desenha substitui o impacto genérico da habilidade (o `corte` e as `faiscas`).

import type { Elemento } from '../combat/elementos';
import type { EstadoJogo } from '../core/estado';
import { msDe } from '../core/tempo';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import type { Entidade, PontoVisual } from '../entities/entidade';
import { DURACAO_GOLPE, type Golpe } from './caminhada';
import type { ControladorImpacto } from './impacto';
import { presetDeImpacto } from './materiais';
import type { SistemaParticulas } from './particulas';
import type { NomePreset } from './presets-particula';

const COR_ACO = 0xe8ecf2;
const INTERVALO_GIRO_MS = 40;
/** O giro segue soltando vento um pouco depois do lançamento (o corpo ainda roda). */
const GIRO_MS = DURACAO_GOLPE.giro;

const RASTRO: Readonly<Record<Exclude<Golpe, 'disparo' | 'giro'>, NomePreset>> = {
  corte: 'golpe_corte',
  corte_pesado: 'golpe_machado',
  contundente: 'golpe_esmagar',
  contundente_leve: 'golpe_cajado',
  estocada: 'golpe_estocada',
  estocada_rapida: 'golpe_estocada_rapida',
};

/** Quantas vezes o rastro sai, pela forma da arma (o poder dela), com teto. */
const REPETE: Readonly<Record<string, number>> = { comum: 1, epica: 1, lendaria: 2, ultima: 2 };

export interface ArmaVisual {
  elemento: Elemento | null;
  forma: string | null;
}

export interface OpcoesEfeitosArma {
  particulas: SistemaParticulas;
  impacto: ControladorImpacto;
  /** O golpe que a ação (pela chave) anima em quem a usa (null: não é golpe de arma). */
  golpeDe: (e: Entidade, chave: string) => Golpe | null;
  /** O elemento e a forma da arma na mão. */
  armaDe: (e: Entidade) => ArmaVisual;
  /** A cor do rastro de quem tem fúria (null: sem fúria). */
  corDaFuria: (e: Entidade, tick: number) => number | null;
  corElemento: (el: Elemento) => number;
}

export class EfeitosDeArma {
  private readonly posicoes = new Map<string, PontoVisual>();
  /** Os giros em curso: quem gira, até quando (ms) e de que cor. */
  private readonly giros = new Map<string, { ateMs: number; cor: number; ultimoMs: number }>();

  constructor(private readonly o: OpcoesEfeitosArma) {}

  /** O impacto genérico da habilidade fica de fora quando o golpe de arma o desenha. */
  cuidaDoImpacto(fonte: Entidade | undefined, chave: string): boolean {
    const g = fonte ? this.o.golpeDe(fonte, chave) : null;
    return g !== null && g !== 'disparo';
  }

  private corDoRastro(e: Entidade, tick: number): number {
    const arma = this.o.armaDe(e);
    if (arma.elemento) return this.o.corElemento(arma.elemento);
    return this.o.corDaFuria(e, tick) ?? COR_ACO;
  }

  ligar(bus: Barramento<EventosDaSimulacao>, estado: () => EstadoJogo, agora: () => number): void {
    const p = this.o.particulas;
    const entidade = (id: string) => estado().entidades.find((x) => x.id === id);
    const pos = (id: string): PontoVisual | null => {
      const e = entidade(id);
      return this.posicoes.get(id) ?? (e ? { x: e.x, y: e.y } : null);
    };
    bus.on('acaoIniciada', (ev) => {
      const e = entidade(ev.atorId);
      if (!e || this.o.golpeDe(e, ev.chave) !== 'giro') return;
      const ate = msDe(ev.lancamentoTick - ev.tick);
      this.giros.set(e.id, { ateMs: agora() + Math.max(0, ate) + GIRO_MS, cor: this.corDoRastro(e, ev.tick), ultimoMs: 0 });
    });
    bus.on('impacto', (ev) => {
      if (ev.indice > 2) return;
      const fonte = entidade(ev.fonteId);
      if (!fonte) return;
      const golpe = this.o.golpeDe(fonte, ev.chave);
      if (!golpe || golpe === 'disparo') return;
      const de = pos(ev.fonteId);
      const alvo = pos(ev.alvoId);
      if (!de || !alvo) return;
      const cor = this.corDoRastro(fonte, ev.tick);
      const dir = { x: alvo.x - de.x, y: alvo.y - de.y };
      const arma = this.o.armaDe(fonte);
      if (golpe === 'giro') {
        p.emitir('golpe_corte', alvo.x, alvo.y, cor, undefined, dir);
      } else {
        const vezes = REPETE[arma.forma ?? 'comum'] ?? 1;
        for (let i = 0; i < vezes; i++) p.emitir(RASTRO[golpe], alvo.x, alvo.y, cor, undefined, dir);
        if (golpe === 'corte' || golpe === 'corte_pesado') p.emitir('golpe_faiscas', alvo.x, alvo.y, cor, undefined, dir);
      }
      if (arma.elemento && ev.dano > 0) p.emitir(presetDeImpacto(arma.elemento), alvo.x, alvo.y, cor);
      if (arma.forma === 'epica' || arma.forma === 'lendaria' || arma.forma === 'ultima') p.emitir(`forma_${arma.forma}`, alvo.x, alvo.y, cor, undefined, dir);
      // O Guerreiro: o básico também pesa (a pausa curta), e o crítico treme.
      if (ev.indice === 0 && this.o.corDaFuria(fonte, ev.tick) !== null) {
        this.o.impacto.pedir(ev.critico ? 'golpe' : 'golpe_leve', agora());
      }
    });
    bus.on('acaoCancelada', (ev) => {
      this.giros.delete(ev.atorId);
    });
  }

  quadro(estado: EstadoJogo, agoraMs: number, posicao: (e: Entidade) => PontoVisual): void {
    this.posicoes.clear();
    for (const e of estado.entidades) this.posicoes.set(e.id, posicao(e));
    for (const [id, g] of this.giros) {
      if (agoraMs > g.ateMs) {
        this.giros.delete(id);
        continue;
      }
      if (agoraMs - g.ultimoMs < INTERVALO_GIRO_MS) continue;
      g.ultimoMs = agoraMs;
      const onde = this.posicoes.get(id);
      if (onde) this.o.particulas.emitir('vento_giro', onde.x, onde.y, g.cor);
    }
  }

  /** O anel de lâminas na borda do giro, no lançamento (chamado pelo explodir da área). */
  laminasDoGiro(centro: PontoVisual, cor: number): void {
    this.o.particulas.emitir('laminas_giro', centro.x, centro.y, cor);
  }
}
