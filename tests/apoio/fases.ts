import { conteudoOficial, modoPorId, type Conteudo } from '../../src/core/conteudo';
import { BALANCE_PADRAO, type Balance, type ContextoSimulacao } from '../../src/core/contexto';
import fase01 from '../../src/data/fases/fase-01.json';
import { carregarFase, type Fase } from '../../src/world/fase';
import { validarFase } from '../../src/world/validacao-fase';

/** Fase de teste a partir de linhas de texto (`#` parede, `.` piso, `S` saída, espaço vazio). */
export function faseDeTexto(mapa: string[], id = 'teste'): Fase {
  return carregarFase({ id, nome: id, ordem: 1, tipo: 'campanha', mapa, spawns: [{ x: 1, y: 1 }] });
}

export const CONTEUDO: Conteudo = conteudoOficial();

export function faseOficial01(): Fase {
  const r = validarFase(fase01, new Set(CONTEUDO.presets.keys()));
  if (!r.ok) throw new Error(`fase-01 inválida: ${JSON.stringify(r.erros)}`);
  return carregarFase(r.fase);
}

export function contexto(fase: Fase, balance: Balance = BALANCE_PADRAO, modoId = 'campanha'): ContextoSimulacao {
  return { fase, balance, conteudo: CONTEUDO, modo: modoPorId(CONTEUDO, modoId) };
}

/** Sala aberta 12×12 cercada de paredes, útil para testes de movimento e combate. */
export const SALA_ABERTA: string[] = [
  '############',
  ...Array.from({ length: 10 }, () => '#..........#'),
  '############',
];
