// Mapeamento de som (§2.14). Marco 12 (14/10/2026), D-056. Puro: o que tocar para cada habilidade e
// para cada evento da simulação. Elemento e arma precedem os sons genéricos legados;
// depois vêm o conteúdo, o prefixo e o tipo de ataque. Habilidade nova toca algo coerente sem mexer aqui.

import type { Habilidade } from '../combat/habilidades';
import type { EventoSimulacao } from '../core/eventos-simulacao';

export const SONS = [
  'fogo', 'gelo', 'raio', 'veneno', 'psiquico', 'terra', 'trevas', 'sagrado',
  'lamina', 'contundente', 'arco', 'quebra', 'teleporte',
  'acerto_projetil', 'lancamento_magico',
  // 06/11/2026: o zunido do básico mágico (cajado, tomo, cetro), no lançamento e no impacto.
  'zunido',
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
  // 07/11/2026 (D-136): as skills do Necromante, graves e levemente macabras (tools/audio/necromancia.py).
  'necro_conjura',
  'necro_sombra',
  'necro_ossos',
  // 08/11/2026 (D-138): os golpes corpo a corpo, um por arma e por criatura (tools/audio/golpes.py, audio/timbres.ts).
  'golpe_espada', 'golpe_sabre', 'golpe_faca', 'golpe_machado', 'golpe_montante', 'golpe_lanca', 'golpe_rapieira',
  'golpe_maca', 'golpe_mangual', 'golpe_cajado', 'golpe_foice', 'golpe_livro', 'golpe_soco', 'golpe_baque',
  'golpe_mordida', 'golpe_garra', 'golpe_garra_pesada', 'golpe_gosma', 'golpe_sombra',
  // O acerto da flecha (e da seta da besta): o baque surdo, um pouco mais agudo que o dos mortos.
  'golpe_flecha',
] as const;
export type SomId = (typeof SONS)[number];

export function ehSom(v: unknown): v is SomId {
  return typeof v === 'string' && (SONS as readonly string[]).includes(v);
}

/** Prefixo do id da habilidade -> som (fallback por prefixo, §2.14). */
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

/** 07/11/2026 (D-136): as assinaturas dos ossos (o resto do Necromante soa como sombra). */
const ASSINATURAS_DE_OSSO: readonly string[] = ['lanca_de_osso', 'garras_do_ossuario', 'explosao_cadaverica'];
/** As assinaturas próprias do Necromante (as ultimates dele também as usam). */
const ASSINATURAS_DO_NECROMANTE: readonly string[] = [...ASSINATURAS_DE_OSSO, 'cranio', 'ceifa_de_almas', 'mortalha', 'levante_profano', 'fios_de_vida', 'comando_sepulcral'];

/** O som próprio da skill do Necromante (pela etiqueta `necromancia` ou pela assinatura dele), ou null. */
export function somDoNecromante(h: Pick<Habilidade, 'visual'> & Partial<Pick<Habilidade, 'tags'>>): SomId | null {
  const assinatura = h.visual?.assinatura ?? '';
  if (!(h.tags ?? []).includes('necromancia') && !ASSINATURAS_DO_NECROMANTE.includes(assinatura)) return null;
  return ASSINATURAS_DE_OSSO.includes(assinatura) ? 'necro_ossos' : 'necro_sombra';
}

/** O som da habilidade ao ser usada (conjuração ou lançamento). */
export function somDaHabilidade(h: Pick<Habilidade, 'id' | 'tipoAtaque' | 'politicaImpacto' | 'formulaCura' | 'visual'> & Partial<Pick<Habilidade, 'elemento' | 'tags'>>, basico = false): SomId {
  if (h.formulaCura !== null && h.politicaImpacto === 'proprio') return 'cura';
  // 05/11/2026: o básico se repete a cada segundo e meio; o som do elemento (as trevas duram 3 a 4 s) fica para as
  // habilidades. 06/11/2026: o básico mágico é um zunido; o físico segue o som da arma.
  if (basico && h.tipoAtaque === 'magico') return 'zunido';
  const necro = basico ? null : somDoNecromante(h);
  if (necro) return necro;
  if (h.elemento && !basico) return h.elemento;
  const identidade = `${h.id} ${(h.tags ?? []).join(' ')}`;
  if (/espada|lamina|corte|adaga|machado|lanca|montante|rapieira|chakram/.test(identidade)) return 'lamina';
  if (/martelo|soco|punho|clava|escudo/.test(identidade)) return 'contundente';
  if (/arco|besta/.test(identidade)) return 'arco';
  const doConteudo = h.visual?.som;
  if (ehSom(doConteudo)) return doConteudo;
  for (const [prefixo, som] of PREFIXOS) if (h.id.startsWith(prefixo)) return som;
  if (h.politicaImpacto === 'projetil') return 'projetil';
  if (h.politicaImpacto === 'area') return 'explosao';
  return h.tipoAtaque === 'magico' ? 'magia' : 'golpe';
}

/** 08/11/2026 (D-138): os sons de `visual.som` que só dizem "golpe" (o timbre do atacante fica no lugar deles). */
const SONS_DE_GOLPE_GENERICOS: readonly SomId[] = ['golpe', 'acerto', 'lamina', 'contundente'];

/** O timbre do golpe corpo a corpo de quem bate (audio/timbres.ts) e se é o básico dele; null: não é corpo a corpo. */
export type TimbreDoGolpe = (fonteId: string, h: Habilidade) => { som: SomId; basico: boolean } | null;

/** O golpe soa pelo atacante? O básico sempre; a skill só sem elemento nem som próprio. */
function somPeloAtacante(h: Habilidade, timbre: { som: SomId; basico: boolean } | null): SomId | null {
  if (!timbre) return null;
  if (timbre.basico) return timbre.som;
  const proprio = h.visual?.som;
  if (h.elemento || somDoNecromante(h) || (ehSom(proprio) && !SONS_DE_GOLPE_GENERICOS.includes(proprio))) return null;
  return timbre.som;
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
export function sonsDoEvento(
  ev: EventoSimulacao,
  idLocal: string,
  habilidade: (id: string) => Habilidade | undefined,
  basico: (id: string) => boolean = () => false,
  timbre: TimbreDoGolpe = () => null,
): PedidoDeSom[] {
  switch (ev.t) {
    case 'acaoIniciada': {
      const h = habilidade(ev.chave);
      if (!h) return [];
      // O básico da arma secundária também pode ser mágico (ex.: Guerreiro com tomo).
      if (h.id === 'ataque_basico' || h.id.startsWith('basico_')) return [];
      // 07/11/2026 (D-136): toda skill do Necromante começa com o zumbido grave (o surgimento dos mortos segue a risada).
      if (!basico(h.id) && somDoNecromante(h)) return [{ som: 'necro_conjura', origemId: ev.atorId }];
      if (h.tipoAtaque === 'magico' && h.conjuracaoMs < 600) return [];
      if (h.tipoAtaque === 'magico') return [{ som: 'conjuracao', origemId: ev.atorId }];
      // Selecionar um alvo religa o básico automático. Não toca o chiado de preparação
      // física em cada ciclo; a arma soa no impacto e os projéteis, no lançamento.
      return [];
    }
    case 'projetilLancado': {
      const h = habilidade(ev.chave);
      if (h?.tipoAtaque !== 'magico') return [{ som: 'arco', origemId: ev.donoId }];
      if (!basico(h.id) && somDoNecromante(h)) return [{ som: 'necro_sombra', origemId: ev.donoId }];
      return [{ som: basico(h.id) ? 'zunido' : 'lancamento_magico', origemId: ev.donoId }];
    }
    case 'impacto': {
      if (ev.cura > 0 && ev.dano === 0) return [{ som: 'cura', origemId: ev.alvoId }];
      if (ev.d20 === 0) return [];
      if (ev.falha) return [{ som: 'falha', origemId: ev.alvoId }];
      const h = habilidade(ev.chave);
      if (ev.imune) return [];
      // 08/11/2026 (D-138): o golpe corpo a corpo soa pela arma ou pela criatura que bate.
      const peloAtacante = h ? somPeloAtacante(h, timbre(ev.fonteId, h)) : null;
      if (peloAtacante) return [{ som: peloAtacante, origemId: ev.alvoId }, ...(ev.critico ? [{ som: 'critico' as const, origemId: ev.alvoId }] : [])];
      const identidade = h ? somDaHabilidade(h, basico(h.id)) : 'acerto';
      const base: SomId = h?.politicaImpacto === 'projetil' && (identidade === 'arco' || identidade === 'projetil')
        ? 'acerto_projetil' : identidade === 'golpe' ? 'acerto' : identidade;
      const sons: PedidoDeSom[] = [{ som: base, origemId: ev.alvoId }];
      if (ev.critico) sons.push({ som: 'critico', origemId: ev.alvoId });
      return sons;
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
    // Marco 26 (D-113): o quebrável quebrando.
    case 'quebrou':
      return [{ som: 'quebra', origemId: ev.porId }];
    case 'subiuNivel':
      return ev.id === idLocal ? [{ som: 'nivel', origemId: null }] : [];
    case 'itemRecusado':
    case 'acaoRecusada':
      return (ev.t === 'itemRecusado' ? ev.id : ev.atorId) === idLocal ? [{ som: 'recusa', origemId: null }] : [];
    case 'teleportou':
      return [{ som: 'teleporte', origemId: ev.id }];
    case 'saidaAlcancada':
      return [{ som: 'porta', origemId: ev.id }];
    case 'saidaDestrancada':
      return [{ som: 'porta', origemId: null }];
    case 'armadilhaDisparou':
      return [{ som: 'armadilha', origemId: ev.alvoId }];
    case 'invocou':
    case 'dominou':
      return [{ som: 'invocacao', origemId: ev.id }];
    // 07/11/2026 (D-136): cada lança de osso que irrompe de um morto.
    case 'lancaDeOsso':
      return [{ som: 'necro_ossos', origemId: ev.mortoId }];
    case 'explodiu':
      return [{ som: 'explosao', origemId: ev.id }];
    case 'invocacaoCurou':
      return [{ som: 'cura', origemId: ev.donoId }];
    default:
      return [];
  }
}
