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
  const r = validarFase(fase01, new Set(CONTEUDO.presets.keys()), CONTEUDO.itens);
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

/** O kit de antes do marco 24 do Aventureiro: skills gerais que os testes do motor usam como "kit qualquer". */
export const KIT_GERAL = ['seta_arcana', 'explosao', 'curar', 'golpe_atordoante'] as const;

/**
 * Marco 24 (24/10/2026): dá ao jogador de teste um kit explícito — conhecidas no rank 1 e na barra, sem a regra das
 * teclas (1–2 de classe) —, para os testes do motor não dependerem do kit da classe.
 */
export function comKit<E extends { habilidades: string[]; bolsa?: { conhecidas: { id: string; rank: number; caminhos: string[] }[]; barra: (string | null)[] } | null }>(e: E, ids: readonly string[] = KIT_GERAL): E {
  if (e.bolsa) {
    for (const id of ids) if (!e.bolsa.conhecidas.some((c) => c.id === id)) e.bolsa.conhecidas.push({ id, rank: 1, caminhos: [] });
    e.bolsa.barra = Array.from({ length: Math.max(6, ids.length) }, (_, i) => ids[i] ?? null);
  }
  e.habilidades = [...ids];
  return e;
}
