// Funções pequenas que consultam o modo (§2.13): respawn, local de reaparição, equipe de entrada e
// fim de partida. Nenhuma regra de modo é escrita como `if (modo === 'x')`.

import type { Celula, Comando, EntidadeId } from '../core/comandos';
import type { EstadoJogo } from '../core/estado';
import { escolher, type EstadoRng } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import type { Fase } from '../world/fase';
import type { FaixaDeNivel, ModoDeJogo, PenalidadeMorte } from './modo';
import { podeFerir } from './relacao';

/** Marco 10A-2 (§2.12): o que a morte custa no modo (null = nada). */
export function penalidadeDeMorte(modo: ModoDeJogo): PenalidadeMorte | null {
  return modo.sobrevivencia.penalidadeMorte;
}

export function regeneraPorCelula(modo: ModoDeJogo): boolean {
  return modo.sobrevivencia.regenPorCelula;
}

/** Marco 18 (D-068): a Sabedoria revela e desarma armadilhas neste modo? */
export function revelaArmadilhas(modo: ModoDeJogo): boolean {
  return modo.sobrevivencia.revelarArmadilhas;
}

/** Marco 18 (D-068): o estudo de habilidades anda neste modo? */
export function estudoAvanca(modo: ModoDeJogo): boolean {
  return modo.sobrevivencia.estudoAvanca;
}

export function podeRespawnar(modo: ModoDeJogo): boolean {
  return modo.respawn.ativo;
}

/** Atraso até reaparecer, com o acréscimo por morte anterior quando o modo pede (§2.13). */
export function atrasoDeRespawnTicks(modo: ModoDeJogo, mortesAnteriores: number): number {
  return ticksDe((modo.respawn.atrasoS + modo.respawn.atrasoCrescenteS * mortesAnteriores) * 1000);
}

export function protecaoDeRespawnTicks(modo: ModoDeJogo): number {
  return ticksDe(modo.respawn.protecaoS * 1000);
}

/** Equipe de quem entra (§2.13): no Livre, cada jogador é a própria equipe (D-028). */
export function equipeDeEntrada(modo: ModoDeJogo, jogadorId: string, estado: EstadoJogo): string {
  switch (modo.politicaRelacao) {
    case 'todos_hostis':
      return `jogador:${jogadorId}`;
    case 'todos_aliados':
      return 'jogadores';
    case 'por_equipe': {
      if (modo.equipes <= 1) return 'jogadores';
      // Autobalanceamento: entra na equipe com menos jogadores; empate pela de menor índice.
      const contagem = Array.from({ length: modo.equipes }, (_, i) =>
        estado.entidades.filter((e) => e.controlador !== 'ia' && e.equipe === `equipe-${i + 1}`).length,
      );
      const menor = Math.min(...contagem);
      return `equipe-${contagem.indexOf(menor) + 1}`;
    }
  }
}

/**
 * Onde reaparecer (§2.13). `longe_do_inimigo` escolhe o spawn cuja distância Manhattan ao hostil
 * vivo mais próximo é a maior; empate pela ordem dos spawns.
 */
export function localDeRespawn(
  estado: EstadoJogo,
  fase: Fase,
  modo: ModoDeJogo,
  quem: Entidade,
  rng: EstadoRng,
): Celula {
  const spawns = fase.spawns.length > 0 ? fase.spawns : [{ x: 1, y: 1 }];
  const primeiro = spawns[0] ?? { x: 1, y: 1 };
  switch (modo.respawn.local) {
    case 'base_da_equipe':
      return primeiro;
    case 'aleatorio':
      return escolher(rng, spawns);
    case 'longe_do_inimigo': {
      const hostis = estado.entidades.filter((e) => e.id !== quem.id && vivo(e) && podeFerir(quem, e, modo));
      if (hostis.length === 0) return primeiro;
      let melhor = primeiro;
      let melhorDist = -1;
      for (const s of spawns) {
        const dist = Math.min(...hostis.map((h) => Math.abs(h.x - s.x) + Math.abs(h.y - s.y)));
        if (dist > melhorDist) {
          melhor = s;
          melhorDist = dist;
        }
      }
      return melhor;
    }
  }
}

/** Marco 17: a faixa do modo com este id (null: sala aberta ou id desconhecido). */
export function faixaPorId(modo: ModoDeJogo, id: unknown): FaixaDeNivel | null {
  return modo.faixas.find((f) => f.id === id) ?? null;
}

/** Marco 17: a faixa em que o nível cai (null: o modo não tem faixas). */
export function faixaDoNivel(modo: ModoDeJogo, nivel: number): FaixaDeNivel | null {
  return modo.faixas.find((f) => nivel >= f.min && nivel <= f.max) ?? null;
}

/** Marco 15: a sala aceita este comando pela rede neste modo? (a lista é do dado do modo) */
export function comandoAceitoEmRede(modo: ModoDeJogo, cmd: Comando): boolean {
  return modo.comandosDeRede.includes(cmd.t);
}

/**
 * Marco 15: a fase terminou para o grupo? `naSaida` diz se a entidade está numa saída aberta. Com `qualquer`, basta
 * um; com `todos_vivos`, todos os vivos precisam estar sobre ela (os mortos esperam o respawn fora da conta).
 */
export function faseConcluida(modo: ModoDeJogo, jogadores: readonly Entidade[], naSaida: (e: Entidade) => boolean): boolean {
  const vivos = jogadores.filter((e) => vivo(e));
  if (vivos.length === 0) return false;
  switch (modo.saida) {
    case 'qualquer':
      return vivos.some(naSaida);
    case 'todos_vivos':
      return vivos.every(naSaida);
  }
}

export interface ResultadoFim {
  acabou: boolean;
  vencedor: EntidadeId | null;
}

/** Fim de partida (§2.13). O Livre nunca acaba; os outros modos entram no 10B. */
export function fimDePartida(modo: ModoDeJogo): ResultadoFim {
  switch (modo.fim.tipo) {
    case 'nenhum':
      return { acabou: false, vencedor: null };
    default:
      return { acabou: false, vencedor: null };
  }
}
