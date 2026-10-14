// Modo de jogo como dado (§2.13), em src/data/modos/*.json. Regras de modo nunca viram
// `if (modo === 'x')` espalhado pelo código: são consultadas por funções pequenas
// (relacao.ts, regras.ts, arena/ficha-sessao.ts).

import { ehObjeto, Leitor, type Objeto } from '../core/validar';
import { ATRIBUTOS_NEUTROS, type Atributos } from '../entities/entidade';

export type PoliticaRelacao = 'todos_hostis' | 'todos_aliados' | 'por_equipe';
export type TipoFim = 'nenhum' | 'abates' | 'pontos' | 'tempo' | 'ultimo_de_pe' | 'objetivo';
export type LocalRespawn = 'base_da_equipe' | 'aleatorio' | 'longe_do_inimigo';
export type Raridade = 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario';

export const RARIDADES: readonly Raridade[] = ['comum', 'incomum', 'raro', 'epico', 'lendario'];
export const SLOTS_DE_EQUIPAMENTO = [
  'arma_principal',
  'arma_secundaria',
  'cabeca',
  'corpo',
  'maos',
  'pernas',
  'pes',
  'anel',
  'amuleto',
  'capa',
] as const;
export type Slot = (typeof SLOTS_DE_EQUIPAMENTO)[number];

/** Integridade da ficha no PvP (§3.7). */
export interface ClampDeFicha {
  modo: 'clamp' | 'escalar' | 'preset';
  nivelMax: number;
  atributoMax: number;
  /** Soma máxima de todos os atributos. */
  atributoTotalMax: number;
  /** Pontos acima do neutro (10) que podem ser distribuídos. */
  orcamentoAtributos: number;
  raridadeMax: Raridade;
  slotsPermitidos: string[];
  habilidadesPermitidas: string[] | 'qualquer';
  slotsHabilidade: number;
  hpMaxAbsoluto: number | null;
  orcamentoEquipamento: number;
  /** Desempate da redução: o primeiro da lista perde ponto antes (§3.7, "documentado em dados"). */
  ordemReducao: (keyof Atributos)[];
  /** Classe oficial usada como ficha no modo preset (Duelo). */
  presetClasse: string | null;
}

export interface ModoDeJogo {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  equipes: number;
  politicaRelacao: PoliticaRelacao;
  autoBalancear: boolean;
  fogoAmigo: boolean;
  fim: { tipo: TipoFim; alvo: number | null; tempoLimiteS: number | null };
  respawn: {
    ativo: boolean;
    atrasoS: number;
    atrasoCrescenteS: number;
    local: LocalRespawn;
    /** Segundos invisível para inimigos depois de reaparecer (§2.12 na campanha). */
    protecaoS: number;
  };
  entradaEmAndamento: boolean;
  maxJogadores: number;
  espectadores: boolean;
  /** null = a ficha é usada como está (campanha). */
  clamp: ClampDeFicha | null;
  /** `itens`: inimigos soltam itens de equipamento e consumíveis (marco 6: só a campanha, D-039). */
  loot: { politica: 'compartilhado' | 'individual'; janelaParticipacaoS: number; itens: boolean };
  limites: { npcs: number; invocacoesPorJogador: number; avataresPorJogador: number; armadilhasPorJogador: number; projeteis: number };
  /** Sempre false na v1 (§3.7): o schema rejeita true. */
  progressaoContaParaCampanha: false;
  fasesPermitidas: string[] | 'qualquer';
  inimigosDeIA: 'nenhum' | 'da_fase' | 'ondas';
  objetosDeFase: boolean;
  spawnerDinamico: boolean;
  /** Marco 10A-1: chance de um NPC atravessar uma porta interna ao pisar nela (§2.1, 50%). */
  portas: { inimigosCruzamChance: number };
}

const ORDEM_PADRAO = Object.keys(ATRIBUTOS_NEUTROS) as (keyof Atributos)[];

function lerListaOuQualquer(l: Leitor, o: Objeto, campo: string): string[] | 'qualquer' {
  return o[campo] === 'qualquer' ? 'qualquer' : l.listaDeTextos(o, campo);
}

function lerClamp(l: Leitor, valor: unknown): ClampDeFicha | null {
  if (valor === null) return null;
  const o = l.objeto(valor, 'clamp');
  const ordem = l.listaDeTextos(o, 'ordemReducao');
  const ordemValida = ordem.length === ORDEM_PADRAO.length && ORDEM_PADRAO.every((a) => ordem.includes(a));
  if (!ordemValida) l.erro('ordemReducao precisa listar cada atributo exatamente uma vez');
  return {
    modo: l.opcao(o, 'modo', ['clamp', 'escalar', 'preset'] as const),
    nivelMax: l.numero(o, 'nivelMax', { min: 1, max: 20, inteiro: true }),
    atributoMax: l.numero(o, 'atributoMax', { min: 1, max: 100, inteiro: true }),
    atributoTotalMax: l.numero(o, 'atributoTotalMax', { min: 6, inteiro: true }),
    orcamentoAtributos: l.numero(o, 'orcamentoAtributos', { min: 0, inteiro: true }),
    raridadeMax: l.opcao(o, 'raridadeMax', RARIDADES),
    slotsPermitidos: l.listaDeTextos(o, 'slotsPermitidos'),
    habilidadesPermitidas: lerListaOuQualquer(l, o, 'habilidadesPermitidas'),
    slotsHabilidade: l.numero(o, 'slotsHabilidade', { min: 0, max: 12, inteiro: true }),
    hpMaxAbsoluto: o.hpMaxAbsoluto === null ? null : l.numero(o, 'hpMaxAbsoluto', { min: 1 }),
    orcamentoEquipamento: l.numero(o, 'orcamentoEquipamento', { min: 0 }),
    ordemReducao: ordemValida ? (ordem as (keyof Atributos)[]) : [...ORDEM_PADRAO],
    presetClasse: o.presetClasse === null ? null : l.texto(o, 'presetClasse'),
  };
}

export function lerModo(json: unknown, arquivo: string): { modo: ModoDeJogo; erros: string[] } {
  const l = new Leitor(arquivo);
  const o = l.objeto(json, 'modo');
  const fim = l.objeto(o.fim, 'fim');
  const respawn = l.objeto(o.respawn, 'respawn');
  const loot = l.objeto(o.loot, 'loot');
  const limites = l.objeto(o.limites, 'limites');
  if (o.progressaoContaParaCampanha !== false) l.erro('progressaoContaParaCampanha precisa ser false na v1 (§3.7)');

  const modo: ModoDeJogo = {
    id: l.texto(o, 'id'),
    nome: l.texto(o, 'nome'),
    descricao: l.texto(o, 'descricao'),
    icone: l.texto(o, 'icone'),
    equipes: l.numero(o, 'equipes', { min: 1, max: 10, inteiro: true }),
    politicaRelacao: l.opcao(o, 'politicaRelacao', ['todos_hostis', 'todos_aliados', 'por_equipe'] as const),
    autoBalancear: l.booleano(o, 'autoBalancear'),
    fogoAmigo: l.booleano(o, 'fogoAmigo'),
    fim: {
      tipo: l.opcao(fim, 'tipo', ['nenhum', 'abates', 'pontos', 'tempo', 'ultimo_de_pe', 'objetivo'] as const),
      alvo: fim.alvo === null || fim.alvo === undefined ? null : l.numero(fim, 'alvo', { min: 1 }),
      tempoLimiteS: fim.tempoLimiteS === null || fim.tempoLimiteS === undefined ? null : l.numero(fim, 'tempoLimiteS', { min: 1 }),
    },
    respawn: {
      ativo: l.booleano(respawn, 'ativo'),
      atrasoS: l.numero(respawn, 'atrasoS', { min: 0 }),
      atrasoCrescenteS: l.numero(respawn, 'atrasoCrescenteS', { min: 0 }),
      local: l.opcao(respawn, 'local', ['base_da_equipe', 'aleatorio', 'longe_do_inimigo'] as const),
      protecaoS: l.numero(respawn, 'protecaoS', { min: 0 }),
    },
    entradaEmAndamento: l.booleano(o, 'entradaEmAndamento'),
    maxJogadores: l.numero(o, 'maxJogadores', { min: 1, max: 10, inteiro: true }),
    espectadores: l.booleano(o, 'espectadores'),
    clamp: lerClamp(l, o.clamp),
    loot: {
      politica: l.opcao(loot, 'politica', ['compartilhado', 'individual'] as const),
      janelaParticipacaoS: l.numero(loot, 'janelaParticipacaoS', { min: 0 }),
      itens: l.booleano(loot, 'itens'),
    },
    limites: {
      npcs: l.numero(limites, 'npcs', { min: 0, inteiro: true }),
      invocacoesPorJogador: l.numero(limites, 'invocacoesPorJogador', { min: 0, inteiro: true }),
      avataresPorJogador: l.numero(limites, 'avataresPorJogador', { min: 0, inteiro: true }),
      armadilhasPorJogador: l.numero(limites, 'armadilhasPorJogador', { min: 0, inteiro: true }),
      projeteis: l.numero(limites, 'projeteis', { min: 0, inteiro: true }),
    },
    progressaoContaParaCampanha: false,
    fasesPermitidas: lerListaOuQualquer(l, o, 'fasesPermitidas'),
    inimigosDeIA: l.opcao(o, 'inimigosDeIA', ['nenhum', 'da_fase', 'ondas'] as const),
    objetosDeFase: l.booleano(o, 'objetosDeFase'),
    spawnerDinamico: l.booleano(o, 'spawnerDinamico'),
    portas: { inimigosCruzamChance: l.numero(l.objeto(o.portas, 'portas'), 'inimigosCruzamChance', { min: 0, max: 1 }) },
  };
  if (modo.fim.tipo !== 'nenhum' && modo.fim.alvo === null && modo.fim.tempoLimiteS === null) {
    l.erro('fim com tipo diferente de "nenhum" precisa de alvo ou tempo limite');
  }
  if (ehObjeto(o.clamp) && modo.clamp?.modo === 'preset' && modo.clamp.presetClasse === null) {
    l.erro('clamp em modo preset precisa de presetClasse');
  }
  return { modo, erros: l.erros };
}
