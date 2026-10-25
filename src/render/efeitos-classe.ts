// Efeitos visuais do marco 24 (25/10/2026, D-094/D-095), separados de efeitos-habilidade.ts. Só leem eventos e estado:
// - a ultimate: a explosão de luz e o eco em volta de quem lança, a matéria do elemento dela e o tremor forte;
// - o Guerreiro: o rastro da lâmina na cor da fúria (cinza, vermelho na metade, laranja no Frenesi), a pausa de impacto
//   de ~50 ms nos golpes de classe e críticos (só no desenho: a simulação não para), as rachaduras incandescentes do
//   Salto esmagador, o anel branco do aparo e, no Frenesi, brasas subindo do corpo e os olhos acesos;
// - o Mago com a encarnação dupla: a matéria dos dois elementos, alternada;
// - a vertente ligada: runas lentas na cor dela, em volta de quem a montou.
// Partículas sempre (nunca formas planas); o teto e o movimento reduzido valem como nas outras.

import type { Elemento } from '../combat/elementos';
import type { BuscaHabilidade } from '../combat/habilidades';
import type { EstadoJogo } from '../core/estado';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import type { Entidade, PontoVisual } from '../entities/entidade';
import type { ControladorImpacto } from './impacto';
import { corDaFuria, corDaVertente, presetDeImpacto } from './materiais';
import type { SistemaParticulas } from './particulas';
import { visualDe } from './visual-habilidade';

const INTERVALO_FRENESI_MS = 110;
const INTERVALO_FURIA_MS = 380;
const INTERVALO_DUPLA_MS = 260;
const INTERVALO_VERTENTE_MS = 1100;
const SALTO = 'salto_esmagador';

export interface OpcoesEfeitosClasse {
  particulas: SistemaParticulas;
  impacto: ControladorImpacto;
  habilidades: BuscaHabilidade;
  /** A fúria do Guerreiro em [0, 1] (null: não tem fúria). */
  fracaoFuria: (e: Entidade, tick: number) => number | null;
  /** Os dois elementos da encarnação dupla ativa (null: sem dupla). */
  elementosDaDupla: (e: Entidade, tick: number) => readonly [Elemento, Elemento] | null;
  /** A skill é uma das 8 exclusivas da classe de quem a usou? */
  deClasse: (e: Entidade, habilidadeId: string) => boolean;
  /** O id da vertente ligada (null: nenhuma). */
  vertenteDe: (e: Entidade) => string | null;
}

export class EfeitosDeClasse {
  private readonly ultimo = new Map<string, number>();
  private readonly posicoes = new Map<string, PontoVisual>();
  private alternar = 0;

  constructor(private readonly o: OpcoesEfeitosClasse) {}

  private vez(chave: string, agoraMs: number, intervaloMs: number): boolean {
    if (agoraMs - (this.ultimo.get(chave) ?? -Infinity) < intervaloMs) return false;
    this.ultimo.set(chave, agoraMs);
    return true;
  }

  ligar(bus: Barramento<EventosDaSimulacao>, estado: () => EstadoJogo, agora: () => number): void {
    const p = this.o.particulas;
    const entidade = (id: string) => estado().entidades.find((x) => x.id === id);
    const pos = (id: string): PontoVisual | null => {
      const e = entidade(id);
      return this.posicoes.get(id) ?? (e ? { x: e.x, y: e.y } : null);
    };
    bus.on('ultimateUsada', (ev) => {
      const onde = pos(ev.id);
      if (!onde) return;
      const h = this.o.habilidades(ev.ultimateId);
      const cor = h ? visualDe(h).cor : 0xfff3c4;
      p.emitir('ultimate', onde.x, onde.y, cor);
      p.emitir('ultimate_eco', onde.x, onde.y, cor);
      if (h?.elemento) p.emitir(presetDeImpacto(h.elemento), onde.x, onde.y, cor);
      this.o.impacto.pedir('ultimate', agora());
    });
    bus.on('impacto', (ev) => {
      if (ev.dano <= 0 || ev.indice > 0) return;
      const fonte = entidade(ev.fonteId);
      const h = this.o.habilidades(ev.chave);
      if (!fonte || !h) return;
      const fracao = this.o.fracaoFuria(fonte, ev.tick);
      if (fracao === null) return;
      const alvo = pos(ev.alvoId);
      const frenesi = (fonte.furia?.frenesiAteTick ?? 0) > ev.tick;
      if (alvo && h.politicaImpacto !== 'projetil') p.emitir('corte', alvo.x, alvo.y, corDaFuria(fracao, frenesi));
      if (alvo && frenesi) p.emitir('brasas', alvo.x, alvo.y, corDaFuria(1, true));
      if (h.id === SALTO && alvo) p.emitir('rachadura', alvo.x, alvo.y, corDaFuria(fracao, frenesi));
      // A pausa de impacto nos golpes fortes: as skills de classe (nem o básico nem as gerais) e os críticos.
      if (this.o.deClasse(fonte, h.id) || ev.critico) this.o.impacto.pedir('golpe', agora());
    });
    bus.on('efeitoAplicado', (ev) => {
      if (ev.tipo !== 'resposta_aparo') return;
      const onde = pos(ev.alvoId);
      if (!onde) return;
      p.emitir('aparo', onde.x, onde.y, 0xffffff);
      this.o.impacto.pedir('golpe', agora());
    });
  }

  quadro(estado: EstadoJogo, agoraMs: number, posicao: (e: Entidade) => PontoVisual): void {
    const p = this.o.particulas;
    this.posicoes.clear();
    for (const e of estado.entidades) {
      if (e.morto) continue;
      const onde = posicao(e);
      this.posicoes.set(e.id, onde);
      const frenesi = (e.furia?.frenesiAteTick ?? 0) > estado.tick;
      if (frenesi && this.vez(`frenesi:${e.id}`, agoraMs, INTERVALO_FRENESI_MS)) {
        p.emitir('frenesi', onde.x, onde.y, corDaFuria(1, true));
        p.emitir('frenesi_olhos', onde.x, onde.y, corDaFuria(1, true));
      } else if (!frenesi && e.furia && this.vez(`furia:${e.id}`, agoraMs, INTERVALO_FURIA_MS)) {
        const f = this.o.fracaoFuria(e, estado.tick);
        if (f !== null && f >= 0.5) p.emitir('furia_meia', onde.x, onde.y, corDaFuria(f, false));
      }
      if (e.encarnacaoDupla && this.vez(`dupla:${e.id}`, agoraMs, INTERVALO_DUPLA_MS)) {
        const par = this.o.elementosDaDupla(e, estado.tick);
        if (par) {
          this.alternar = 1 - this.alternar;
          p.emitir(presetDeImpacto(this.alternar === 0 ? par[0] : par[1]), onde.x, onde.y, 0xffffff);
        }
      }
      if (e.bolsa && this.vez(`vertente:${e.id}`, agoraMs, INTERVALO_VERTENTE_MS)) {
        const v = this.o.vertenteDe(e);
        if (v) p.emitir('aura_vertente', onde.x, onde.y, corDaVertente(v));
      }
    }
  }
}
