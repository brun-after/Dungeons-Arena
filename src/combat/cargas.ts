// Cargas de habilidade (07/11/2026, D-136). A skill com `cargas` > 1 acumula usos na recarga: cada uso empurra para
// a frente o tick em que todas estão cheias (`<chave>#cheio`), e a chave de sempre guarda quando a próxima fica pronta.
// Assim, quem só lê `recargas[chave]` (a IA, a barra, o bot) continua certo. Só dados no estado. Puro.

import type { EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import type { Habilidade } from './habilidades';

export const chaveDasCargas = (chave: string): string => `${chave}#cheio`;

/** Registra um uso: sem cargas, a recarga monotônica de sempre; com cargas, a fila de recargas. */
export function registrarRecarga(estado: EstadoJogo, chave: string, ms: number, hab: Pick<Habilidade, 'cargas'>): void {
  const cargas = hab.cargas ?? 1;
  const recarga = ticksDe(ms);
  if (cargas <= 1) {
    estado.recargas[chave] = Math.max(estado.recargas[chave] ?? 0, estado.tick + recarga);
    return;
  }
  const chaveCheio = chaveDasCargas(chave);
  const cheio = Math.max(estado.recargas[chaveCheio] ?? 0, estado.tick) + recarga;
  estado.recargas[chaveCheio] = cheio;
  // A próxima fica pronta quando sobra só uma recarga até encher (a que está correndo agora fica para depois).
  estado.recargas[chave] = Math.max(estado.recargas[chave] ?? 0, cheio - (cargas - 1) * recarga);
}

/** Quantas cargas estão prontas agora (a barra mostra o número). `msPorCarga` é a recarga de uma. */
export function cargasProntas(estado: EstadoJogo, chave: string, hab: Pick<Habilidade, 'cargas' | 'recargaMs'>, msPorCarga = hab.recargaMs): number {
  const cargas = hab.cargas ?? 1;
  const falta = Math.max(0, (estado.recargas[chaveDasCargas(chave)] ?? 0) - estado.tick);
  if (falta === 0) return cargas;
  const recarga = Math.max(1, ticksDe(msPorCarga));
  return Math.max(0, cargas - Math.ceil(falta / recarga));
}
