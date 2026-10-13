// Harness de simulação (§5.1): roda o tick real com dt fixo e PRNG semeado, sem DOM e sem rede,
// validando invariantes a cada tick. Cresce a cada marco.

import type { ComandoDoTick, Dir8 } from '../../src/core/comandos';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { criarEntidade, criarEstado, type EstadoJogo } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { aleatorio, criarRng, escolher, inteiro, type EstadoRng } from '../../src/core/rng';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { emPasso } from '../../src/entities/entidade';
import { bloqueia, reservaCelula } from '../../src/world/colisao';
import { passavel } from '../../src/world/fase';
import { contexto, faseOficial01 } from '../apoio/fases';

export interface Cenario {
  estado: EstadoJogo;
  ctx: ContextoSimulacao;
}

export interface OpcoesCenario {
  semente: number;
  inimigos?: number;
  ctx?: ContextoSimulacao;
}

/** Cenário na fase oficial 1: um jogador no spawn e inimigos em células livres sorteadas pela semente. */
export function criarCenario(opcoes: OpcoesCenario): Cenario {
  const ctx = opcoes.ctx ?? contexto(faseOficial01());
  const { fase } = ctx;
  const estado = criarEstado({ semente: opcoes.semente, faseId: fase.id });
  const spawn = fase.spawns[0] ?? { x: 1, y: 1 };
  estado.entidades.push(criarEntidade({ id: 'j1', tipo: 'jogador', x: spawn.x, y: spawn.y }));

  const ocupadas = new Set([`${spawn.x},${spawn.y}`]);
  const n = opcoes.inimigos ?? 12;
  for (let i = 0; i < n; i++) {
    let x: number;
    let y: number;
    do {
      x = inteiro(estado.rng, 0, fase.largura - 1);
      y = inteiro(estado.rng, 0, fase.altura - 1);
    } while (!passavel(fase, x, y) || ocupadas.has(`${x},${y}`));
    ocupadas.add(`${x},${y}`);
    const id = `i${String(i).padStart(3, '0')}`;
    estado.entidades.push(criarEntidade({ id, tipo: 'inimigo', x, y, destreza: inteiro(estado.rng, 6, 20) }));
  }
  return { estado, ctx };
}

/** Produz os comandos de um tick. Recebe o estado só para leitura. */
export type Produtor = (estado: Readonly<EstadoJogo>) => ComandoDoTick[];

const DIRECOES: readonly (Dir8 | 'parado')[] = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO', 'parado'];

/**
 * Bot determinístico: cada entidade age com 5% de chance por tick — troca de direção (70%)
 * ou pede `irPara` a uma célula próxima (30%). PRNG próprio, separado do de gameplay.
 */
export function criarBotAleatorio(semente: number): Produtor {
  const rng: EstadoRng = criarRng(semente);
  return (estado) => {
    const comandos: ComandoDoTick[] = [];
    for (const e of estado.entidades) {
      if (aleatorio(rng) >= 0.05) continue;
      const cmd: ComandoDoTick['cmd'] =
        aleatorio(rng) < 0.7
          ? { t: 'mover', dir: escolher(rng, DIRECOES) }
          : { t: 'irPara', x: e.x + inteiro(rng, -8, 8), y: e.y + inteiro(rng, -8, 8) };
      comandos.push({ tick: estado.tick, entidadeId: e.id, cmd });
    }
    return comandos;
  };
}

export function verificarInvariantes(estado: EstadoJogo, ctx: ContextoSimulacao): string[] {
  const erros: string[] = [];
  const { fase, balance } = ctx;
  procurarNaoFinitos(estado, 'estado', erros);
  for (const e of estado.entidades) {
    if (!passavel(fase, e.x, e.y)) erros.push(`${e.id} em célula não passável (${e.x}, ${e.y})`);
    if (!passavel(fase, e.destinoX, e.destinoY)) erros.push(`${e.id} com destino não passável`);
    const distancia = Math.abs(e.destinoX - e.x) + Math.abs(e.destinoY - e.y);
    if (distancia > 1) erros.push(`${e.id} com destino não adjacente`);
    if (e.progressoPasso < 0 || e.progressoPasso >= 1) erros.push(`${e.id} com progresso ${e.progressoPasso}`);
    if (!emPasso(e) && e.progressoPasso !== 0) erros.push(`${e.id} parado com progresso`);
    if (e.waypoints.length > balance.movimento.filaMaxWaypoints) erros.push(`${e.id} com fila longa`);
    if (e.hp > e.hpMax) erros.push(`${e.id} com hp ${e.hp} > hpMax ${e.hpMax}`);
    if (e.hp < 0) erros.push(`${e.id} com hp negativo`);
  }
  // Pares bloqueantes nunca dividem célula reservada (§2.3).
  const lista = estado.entidades;
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i];
      const b = lista[j];
      if (!a || !b || !bloqueia(a, b, balance.colisao)) continue;
      if (reservaCelula(b, a.x, a.y) || reservaCelula(b, a.destinoX, a.destinoY)) {
        erros.push(`${a.id} e ${b.id} dividem célula reservada`);
      }
    }
  }
  return erros;
}

function procurarNaoFinitos(valor: unknown, caminho: string, erros: string[]): void {
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) erros.push(`${caminho} não é finito (${valor})`);
  } else if (Array.isArray(valor)) {
    valor.forEach((v, i) => {
      procurarNaoFinitos(v, `${caminho}[${i}]`, erros);
    });
  } else if (typeof valor === 'object' && valor !== null) {
    for (const [k, v] of Object.entries(valor)) procurarNaoFinitos(v, `${caminho}.${k}`, erros);
  }
}

/** Roda `ticks` ticks reais, falhando no primeiro tick que violar uma invariante. */
export function rodar(cenario: Cenario, ticks: number, produtor: Produtor): EventoSimulacao[] {
  const { estado, ctx } = cenario;
  const eventos: EventoSimulacao[] = [];
  for (let i = 0; i < ticks; i++) {
    simular(estado, ctx, produtor(estado), eventos, DT_MS);
    const erros = verificarInvariantes(estado, ctx);
    if (erros.length > 0) {
      throw new Error(`invariante violada no tick ${estado.tick}: ${erros.join('; ')}`);
    }
  }
  return eventos;
}
