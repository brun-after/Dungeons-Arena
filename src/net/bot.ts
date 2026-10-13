// Cliente bot da arena: outro "jogador" que anda, ataca e usa habilidades por conta própria, pelo
// mesmo caminho de comandos de um humano. Serve aos testes de rede e à tela de demonstração.

import type { Dir8 } from '../core/comandos';
import { aleatorio, criarRng, escolher, type EstadoRng } from '../core/rng';
import type { ClienteArena } from './cliente';

const DIRECOES: readonly Dir8[] = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

export class BotDeArena {
  private readonly rng: EstadoRng;

  constructor(
    private readonly cliente: ClienteArena,
    semente: number,
    private readonly agressividade = 1,
  ) {
    this.rng = criarRng(semente);
  }

  /** Chamado a cada tick do cliente, antes de `cliente.passo()`. */
  agir(): void {
    if (!this.cliente.conectado) return;
    const u = aleatorio(this.rng);
    if (u < 0.02) this.cliente.enviarComando({ t: 'mover', dir: aleatorio(this.rng) < 0.15 ? 'parado' : escolher(this.rng, DIRECOES) });
    else if (u < 0.02 + 0.01 * this.agressividade) this.cliente.enviarComando({ t: 'ataqueBasico' });
    else if (u < 0.03 + 0.015 * this.agressividade) {
      this.cliente.enviarComando({ t: 'usarHabilidade', id: escolher(this.rng, ['seta_arcana', 'explosao', 'curar', 'golpe_atordoante']) });
    }
  }
}
