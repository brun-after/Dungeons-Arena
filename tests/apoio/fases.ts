import { BALANCE_PADRAO, type Balance, type ContextoSimulacao } from '../../src/core/contexto';
import { carregarFase, type Fase } from '../../src/world/fase';
import fase01 from '../../src/data/fases/fase-01.json';
import { validarFase } from '../../src/world/validacao-fase';

/** Fase de teste a partir de linhas de texto (`#` parede, `.` piso, `S` saída, espaço vazio). */
export function faseDeTexto(mapa: string[], id = 'teste'): Fase {
  return carregarFase({ id, nome: id, ordem: 1, tipo: 'campanha', mapa, spawns: [{ x: 1, y: 1 }] });
}

export function faseOficial01(): Fase {
  const r = validarFase(fase01);
  if (!r.ok) throw new Error(`fase-01 inválida: ${JSON.stringify(r.erros)}`);
  return carregarFase(r.fase);
}

export function contexto(fase: Fase, balance: Balance = BALANCE_PADRAO): ContextoSimulacao {
  return { fase, balance };
}

/** Sala aberta 12×12 cercada de paredes, útil para testes de movimento. */
export const SALA_ABERTA: string[] = [
  '############',
  ...Array.from({ length: 10 }, () => '#..........#'),
  '############',
];
