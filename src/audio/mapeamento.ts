// Mapeamento de som (§2.14). Marco 12 (14/10/2026), D-056. Puro: o que tocar para cada habilidade e
// para cada evento da simulação. Por habilidade: o `visual.som` do conteúdo; senão, o prefixo do id;
// senão, o tipo de ataque. Habilidade nova toca algo coerente sem mexer aqui.

import type { Habilidade } from '../combat/habilidades';
import type { EventoSimulacao } from '../core/eventos-simulacao';

export const SONS = [
  'golpe',
  'acerto',
  'critico',
  'falha',
  'conjuracao',
  'magia',
  'projetil',
  'explosao',
  'cura',
  'moeda',
  'coleta',
  'passo',
  'porta',
  'armadilha',
  'invocacao',
  'morte',
  'nivel',
  'clique',
  'recusa',
] as const;
export type SomId = (typeof SONS)[number];

export function ehSom(v: unknown): v is SomId {
  return typeof v === 'string' && (SONS as readonly string[]).includes(v);
}

/** Prefixo do id da habilidade → som (fallback por prefixo, §2.14). */
const PREFIXOS: readonly (readonly [string, SomId])[] = [
  ['golpe', 'golpe'],
  ['ataque', 'golpe'],
  ['seta', 'projetil'],
  ['flecha', 'projetil'],
  ['raio', 'magia'],
  ['explosao', 'explosao'],
  ['bola', 'explosao'],
  ['marca', 'explosao'],
  ['cur', 'cura'],
  ['invocar', 'invocacao'],
  ['armar', 'armadilha'],
  ['teia', 'armadilha'],
];

/** O som da habilidade ao ser usada (conjuração ou lançamento). */
export function somDaHabilidade(h: Pick<Habilidade, 'id' | 'tipoAtaque' | 'politicaImpacto' | 'formulaCura' | 'visual'>): SomId {
  const doConteudo = h.visual?.som;
  if (ehSom(doConteudo)) return doConteudo;
  for (const [prefixo, som] of PREFIXOS) if (h.id.startsWith(prefixo)) return som;
  if (h.formulaCura !== null && h.politicaImpacto === 'proprio') return 'cura';
  if (h.politicaImpacto === 'projetil') return 'projetil';
  if (h.politicaImpacto === 'area') return 'explosao';
  return h.tipoAtaque === 'magico' ? 'magia' : 'golpe';
}

/** Um som a tocar: global (interface, o próprio jogador) ou numa entidade/posição. */
export interface PedidoDeSom {
  som: SomId;
  /** Entidade de onde sai o som (para o volume e o pan); null = global. */
  origemId: string | null;
}

/**
 * Sons de um evento. `habilidade` traduz o id da habilidade; `idLocal` torna globais os sons que só
 * dizem respeito ao jogador local (coleta, nível, recusa).
 */
export function sonsDoEvento(ev: EventoSimulacao, idLocal: string, habilidade: (id: string) => Habilidade | undefined): PedidoDeSom[] {
  switch (ev.t) {
    case 'acaoIniciada': {
      const h = habilidade(ev.chave);
      if (!h) return [];
      // O ataque básico só soa no impacto (evita dois sons por golpe); o resto anuncia a conjuração.
      if (h.politicaImpacto === 'contato' && h.conjuracaoMs < 600) return [];
      return [{ som: h.tipoAtaque === 'magico' ? 'conjuracao' : somDaHabilidade(h), origemId: ev.atorId }];
    }
    case 'projetilLancado':
      return [{ som: 'projetil', origemId: ev.donoId }];
    case 'impacto': {
      if (ev.cura > 0 && ev.dano === 0) return [{ som: 'cura', origemId: ev.alvoId }];
      if (ev.d20 === 0) return [];
      if (ev.falha) return [{ som: 'falha', origemId: ev.alvoId }];
      const h = habilidade(ev.chave);
      const base: SomId = ev.critico ? 'critico' : h?.politicaImpacto === 'area' ? 'explosao' : 'acerto';
      return [{ som: base, origemId: ev.alvoId }];
    }
    case 'esquivou':
      return [{ som: 'falha', origemId: ev.alvoId }];
    case 'morreu':
      return [{ som: 'morte', origemId: ev.id }];
    case 'coletou':
      if (ev.id !== idLocal) return [];
      return [{ som: ev.tipo === 'ouro' ? 'moeda' : ev.tipo === 'orbe_hp' || ev.tipo === 'orbe_recurso' ? 'cura' : 'coleta', origemId: null }];
    case 'comprou':
    case 'vendeu':
      return ev.id === idLocal ? [{ som: 'moeda', origemId: null }] : [];
    case 'bauAberto':
      return [{ som: 'coleta', origemId: ev.id }];
    case 'subiuNivel':
      return ev.id === idLocal ? [{ som: 'nivel', origemId: null }] : [];
    case 'itemRecusado':
    case 'acaoRecusada':
      return (ev.t === 'itemRecusado' ? ev.id : ev.atorId) === idLocal ? [{ som: 'recusa', origemId: null }] : [];
    case 'teleportou':
    case 'saidaAlcancada':
      return [{ som: 'porta', origemId: ev.id }];
    case 'saidaDestrancada':
      return [{ som: 'porta', origemId: null }];
    case 'armadilhaDisparou':
      return [{ som: 'armadilha', origemId: ev.alvoId }];
    case 'invocou':
    case 'dominou':
      return [{ som: 'invocacao', origemId: ev.id }];
    case 'explodiu':
      return [{ som: 'explosao', origemId: ev.id }];
    case 'invocacaoCurou':
      return [{ som: 'cura', origemId: ev.donoId }];
    default:
      return [];
  }
}
