// Harness de simulação (§5.1): roda o tick real com dt fixo e PRNG semeado, sem DOM e sem rede,
// validando invariantes a cada tick. Cresce a cada marco.

import type { ComandoDoTick, Dir8 } from '../../src/core/comandos';
import { criarEntidade, criarEstado, type EstadoJogo } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { aleatorio, criarRng, escolher, inteiro, type EstadoRng } from '../../src/core/rng';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';

export interface OpcoesCenario {
  semente: number;
  largura?: number;
  altura?: number;
  entidades?: number;
}

/** Cenário de teste com entidades posicionadas pela própria semente. */
export function criarCenario(opcoes: OpcoesCenario): EstadoJogo {
  const estado = criarEstado({
    semente: opcoes.semente,
    largura: opcoes.largura ?? 60,
    altura: opcoes.altura ?? 40,
  });
  const n = opcoes.entidades ?? 10;
  for (let i = 0; i < n; i++) {
    const x = inteiro(estado.rng, 0, estado.mundo.largura - 1);
    const y = inteiro(estado.rng, 0, estado.mundo.altura - 1);
    estado.entidades.push(criarEntidade(`e${String(i).padStart(3, '0')}`, x, y));
  }
  return estado;
}

/** Produz os comandos de um tick. Recebe o estado só para leitura. */
export type Produtor = (estado: Readonly<EstadoJogo>) => ComandoDoTick[];

const DIRECOES: readonly (Dir8 | 'parado')[] = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO', 'parado'];

/**
 * Bot determinístico: cada entidade troca de direção com 5% de chance por tick.
 * Usa um PRNG próprio, separado do PRNG de gameplay, como um jogador externo.
 */
export function criarBotAleatorio(semente: number): Produtor {
  const rng: EstadoRng = criarRng(semente);
  return (estado) => {
    const comandos: ComandoDoTick[] = [];
    for (const e of estado.entidades) {
      if (aleatorio(rng) < 0.05) {
        comandos.push({ tick: estado.tick, entidadeId: e.id, cmd: { t: 'mover', dir: escolher(rng, DIRECOES) } });
      }
    }
    return comandos;
  };
}

export function verificarInvariantes(estado: EstadoJogo): string[] {
  const erros: string[] = [];
  procurarNaoFinitos(estado, 'estado', erros);
  for (const e of estado.entidades) {
    if (e.x < 0 || e.y < 0 || e.x >= estado.mundo.largura || e.y >= estado.mundo.altura) {
      erros.push(`${e.id} fora do mapa em (${e.x}, ${e.y})`);
    }
    if (!Number.isInteger(e.x) || !Number.isInteger(e.y)) erros.push(`${e.id} fora da grade`);
    if (e.hp > e.hpMax) erros.push(`${e.id} com hp ${e.hp} > hpMax ${e.hpMax}`);
    if (e.hp < 0) erros.push(`${e.id} com hp negativo`);
    if (e.progressoPassoMs < 0) erros.push(`${e.id} com progresso negativo`);
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
export function rodar(estado: EstadoJogo, ticks: number, produtor: Produtor): EventoSimulacao[] {
  const eventos: EventoSimulacao[] = [];
  for (let i = 0; i < ticks; i++) {
    simular(estado, produtor(estado), eventos, DT_MS);
    const erros = verificarInvariantes(estado);
    if (erros.length > 0) {
      throw new Error(`invariante violada no tick ${estado.tick}: ${erros.join('; ')}`);
    }
  }
  return eventos;
}
