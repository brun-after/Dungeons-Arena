// O pedido do quadro do personagem 3D (22/11/2026, D-202: saiu de palco-vivo.ts, que chegou ao teto de linhas).

import type { AparenciaEquipada } from '../../entities/entidade';
import type { Equipamento3d } from '../adornos';
import type { EstadoPersonagem } from '../quadros-personagem';
import type { PedidoVivo } from './palco-vivo';
import { pecasDoPedido, realceDe } from './vestes-vivas';

/** O pedido do quadro a partir do que o desenho das entidades já calcula (sprites.ts). */
export function pedidoVivo(
  id: string,
  modelo: string,
  aparencia: AparenciaEquipada | null | undefined,
  equipamento: Equipamento3d | null,
  estado: EstadoPersonagem,
  tempoMs: number,
  fracao: number,
  angulo: number,
  golpe?: PedidoVivo['golpe'],
): PedidoVivo {
  // 06/11/2026: com skin (a chave `skin:<id>`), prevalece a skin: sem peças e sem armas do equipamento (a skin tem a dela).
  if (modelo.startsWith('skin:')) return { id, modelo, pecas: {}, estado, tempoMs, fracao, angulo, golpe, arma: null, secundaria: null };
  // Marco 46 (D-189): cada peça pelo propósito, estilo, marca e grau dela; o realce pelo grau, conjunto e elemento.
  const realce = realceDe(aparencia, modelo);
  const arma = equipamento?.arma.modelo ? equipamento.arma : null;
  const secundaria = equipamento?.secundaria ?? null;
  // Só no servidor de desenvolvimento: `&vestir=N` veste todas as peças (e as armas) no grau N, para revisar o visual.
  const vestir = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('vestir') ?? Number.NaN) : Number.NaN;
  if (vestir >= 0 && vestir <= 5) {
    return { id, modelo, pecas: pecasDoPedido(aparencia, modelo, vestir), realce, estado, tempoMs, fracao, angulo, golpe, arma: arma && { ...arma, grau: vestir }, secundaria: secundaria && { ...secundaria, grau: vestir } };
  }
  return { id, modelo, pecas: pecasDoPedido(aparencia, modelo), realce, estado, tempoMs, fracao, angulo, golpe, arma, secundaria };
}
