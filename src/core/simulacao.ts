// `simular(dt)`: um tick da simulação (§2.2). Não toca DOM nem a camada gráfica e não sabe
// se está em rede. Recebe os comandos do tick e grava eventos numa lista de saída.
//
// Ordem por tick (§2.2). Marco 1 implementa as etapas 1 e 6; as outras entram nos marcos
// seguintes, cada uma no seu lugar desta sequência.
//   1. aplicar comandos        2. IA                 3. combate
//   4. efeitos                 5. congelamentos      6. movimento
//   7. gatilhos por célula     8. mortes e respawns  9. periódicos de 1 Hz e spawner

import balance from '../data/balance.json';
import type { ComandoDoTick, Dir8, EntidadeId } from './comandos';
import { buscarEntidade, type Entidade, type EstadoJogo } from './estado';

export type EventoSimulacao = { t: 'moveu'; tick: number; id: EntidadeId; x: number; y: number };

const VETOR: Readonly<Record<Dir8, readonly [number, number]>> = {
  N: [0, -1],
  NE: [1, -1],
  E: [1, 0],
  SE: [1, 1],
  S: [0, 1],
  SO: [-1, 1],
  O: [-1, 0],
  NO: [-1, -1],
};

/** Guarda de iteração do integrador: nenhum tick consome mais passos que isso. */
const MAX_PASSOS_POR_TICK = 8;

/** Absorve o erro de ponto flutuante de somar DT_MS (1000/60) repetidas vezes. */
const TOLERANCIA_MS = 1e-6;

export function simular(
  estado: EstadoJogo,
  comandos: readonly ComandoDoTick[],
  saida: EventoSimulacao[],
  dtMs: number,
): void {
  aplicarComandos(estado, comandos);
  moverEntidades(estado, saida, dtMs);
  estado.tick++;
}

function aplicarComandos(estado: EstadoJogo, comandos: readonly ComandoDoTick[]): void {
  for (const { entidadeId, cmd } of comandos) {
    const entidade = buscarEntidade(estado, entidadeId);
    if (!entidade) continue;
    switch (cmd.t) {
      case 'mover':
        if (cmd.dir !== entidade.direcao) {
          // Em empate, a diagonal começa por X (§2.3).
          entidade.proximoEixoX = true;
          if (cmd.dir === 'parado') entidade.progressoPassoMs = 0;
        }
        entidade.direcao = cmd.dir;
        break;
      default:
        // Demais comandos entram nos marcos 2 a 6.
        break;
    }
  }
}

function moverEntidades(estado: EstadoJogo, saida: EventoSimulacao[], dtMs: number): void {
  const msPorCelula = balance.movimento.velocidadeBaseMs;
  for (const entidade of estado.entidades) {
    if (entidade.direcao === 'parado') continue;
    entidade.progressoPassoMs += dtMs;
    let passos = 0;
    while (entidade.progressoPassoMs >= msPorCelula - TOLERANCIA_MS && passos < MAX_PASSOS_POR_TICK) {
      if (!darPasso(estado, entidade, entidade.direcao)) {
        entidade.progressoPassoMs = 0;
        break;
      }
      entidade.progressoPassoMs = Math.max(0, entidade.progressoPassoMs - msPorCelula);
      passos++;
      saida.push({ t: 'moveu', tick: estado.tick, id: entidade.id, x: entidade.x, y: entidade.y });
    }
  }
}

/**
 * Um passo cardinal (§2.3): a diagonal alterna X e Y; se o eixo da vez estiver bloqueado,
 * cede ao outro; com os dois bloqueados, para. Marco 1 só conhece os limites do mapa;
 * terreno e entidades entram no marco 2.
 */
function darPasso(estado: EstadoJogo, entidade: Entidade, dir: Dir8): boolean {
  const [dx, dy] = VETOR[dir];
  if (dx === 0 || dy === 0) return tentar(estado, entidade, dx, dy);

  const primeiroX = entidade.proximoEixoX;
  const andou = primeiroX
    ? tentar(estado, entidade, dx, 0) || tentar(estado, entidade, 0, dy)
    : tentar(estado, entidade, 0, dy) || tentar(estado, entidade, dx, 0);
  if (andou) entidade.proximoEixoX = !primeiroX;
  return andou;
}

function tentar(estado: EstadoJogo, entidade: Entidade, dx: number, dy: number): boolean {
  const x = entidade.x + dx;
  const y = entidade.y + dy;
  if (x < 0 || y < 0 || x >= estado.mundo.largura || y >= estado.mundo.altura) return false;
  entidade.x = x;
  entidade.y = y;
  return true;
}
