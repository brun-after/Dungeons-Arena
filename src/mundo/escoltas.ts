// As escoltas do Mundo (marco 38, 08/11/2026, D-142): a missão de levar alguém até a porta de uma estrutura da
// região. Ao aceitar (ou ao falar de novo com quem deu a missão, se o protegido se perdeu), o protegido nasce ao lado
// do jogador como uma invocação dele que só o segue (comportamento `escoltado`): os monstros o atacam, ele não revida.
// Chegou a `raioChegada` células da frente da porta, a missão completa (é só entregar) e ele entra. Morreu, a missão
// falha e sai das aceitas. Sair da região o perde (a invocação some sem o dono): a missão espera, e quem deu a missão
// chama o protegido de novo. Tempo em ticks. Puro.

import { celulaDeEntrada, colocarEm } from '../coop/sala-campanha';
import type { EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { criarInimigo } from '../entities/fabrica';
import type { FichaDoMundo } from './ficha-mundo';
import type { MissaoDoMundo } from './missoes-mundo';
import { portaDa, type RegiaoDoMundo } from './reino';

/** O que a escolta pede à sala. */
export interface HostDaEscolta {
  avisarChegada: (donoId: EntidadeId, missao: string) => void;
  avisarFalha: (donoId: EntidadeId, missao: string) => void;
}

interface Escoltado {
  donoId: EntidadeId;
  missao: string;
  protegidoId: EntidadeId;
  destino: { x: number; y: number };
}

export class EscoltasDaRegiao {
  private readonly escoltas: Escoltado[] = [];

  constructor(private readonly regiao: RegiaoDoMundo | null) {}

  /** Chama os protegidos que faltam das escoltas aceitas desta região (ao aceitar ou ao falar com quem as deu). */
  garantir(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, ficha: FichaDoMundo, missoes: ReadonlyMap<string, MissaoDoMundo>): void {
    const regiao = this.regiao;
    if (!regiao || !vivo(dono)) return;
    for (const ativa of ficha.missoes.ativas) {
      const m = missoes.get(ativa.id);
      if (m?.alvo.tipo !== 'escoltar' || ativa.progresso >= 1) continue;
      const alvo = m.alvo;
      const estrutura = regiao.estruturas.find((x) => x.id === alvo.estrutura);
      if (!estrutura || this.escoltas.some((x) => x.donoId === dono.id && x.missao === m.id)) continue;
      const preset = ctx.conteudo.presets.get(alvo.protegido);
      if (!preset) continue;
      const p = criarInimigo(preset, `esc${estado.proximoId++}`, dono.x, dono.y, ctx.balance, { nivel: dono.nivel });
      p.tipo = 'invocacao';
      p.equipe = dono.equipe;
      p.xpBase = 0;
      p.invocacao = {
        donoId: dono.id,
        expiraTick: estado.tick + ticksDe(ctx.balance.mundo.escolta.duracaoMin * 60_000),
        dominado: false,
        comportamento: 'escoltado',
        avatar: false,
        golpesRestantes: 0,
        abates: 0,
        criadoTick: estado.tick,
        nivelDominacao: 0,
      };
      colocarEm(p, celulaDeEntrada(estado, ctx, p, { x: dono.x, y: dono.y + 1 }));
      estado.entidades.push(p);
      this.escoltas.push({ donoId: dono.id, missao: m.id, protegidoId: p.id, destino: portaDa(estrutura).frente });
    }
  }

  /** Confere cada escolta: chegou (completa e o protegido entra), morreu (falha) ou o dono saiu (só esquece). */
  conferir(estado: EstadoJogo, ctx: ContextoSimulacao, host: HostDaEscolta): void {
    for (let i = this.escoltas.length - 1; i >= 0; i--) {
      const x = this.escoltas[i];
      if (!x) continue;
      const dono = buscarEntidade(estado, x.donoId);
      const p = buscarEntidade(estado, x.protegidoId);
      if (!dono) {
        if (p) p.hp = 0;
        this.escoltas.splice(i, 1);
        continue;
      }
      if (!p || !vivo(p)) {
        this.escoltas.splice(i, 1);
        host.avisarFalha(x.donoId, x.missao);
        continue;
      }
      if (Math.max(Math.abs(p.x - x.destino.x), Math.abs(p.y - x.destino.y)) > ctx.balance.mundo.escolta.raioChegada) continue;
      this.escoltas.splice(i, 1);
      // Chegou: entra pela porta (some sem morrer: nada cai e ninguém ganha XP).
      estado.entidades = estado.entidades.filter((e) => e.id !== p.id);
      host.avisarChegada(x.donoId, x.missao);
    }
  }

  /** O dono abandonou a missão: o protegido vai embora. */
  dispensar(estado: EstadoJogo, donoId: EntidadeId, missao: string): void {
    const i = this.escoltas.findIndex((x) => x.donoId === donoId && x.missao === missao);
    const x = this.escoltas[i];
    if (!x) return;
    this.escoltas.splice(i, 1);
    estado.entidades = estado.entidades.filter((e) => e.id !== x.protegidoId);
  }
}
