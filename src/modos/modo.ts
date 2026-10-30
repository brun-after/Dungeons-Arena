// Modo de jogo como dado (§2.13), em src/data/modos/*.json. Regras de modo nunca viram
// `if (modo === 'x')` espalhado pelo código: são consultadas por funções pequenas
// (relacao.ts, regras.ts, arena/ficha-sessao.ts).

import { TIPOS_DE_COMANDO } from '../core/comandos';
import { ehObjeto, Leitor, type Objeto } from '../core/validar';
import { ATRIBUTOS_NEUTROS, type Atributos } from '../entities/entidade';

export type PoliticaRelacao = 'todos_hostis' | 'todos_aliados' | 'por_equipe';
export type TipoFim = 'nenhum' | 'abates' | 'pontos' | 'tempo' | 'ultimo_de_pe' | 'objetivo';
export type LocalRespawn = 'base_da_equipe' | 'aleatorio' | 'longe_do_inimigo';
/** Marco 17 (D-063): faixa de nível de uma sala da arena (quem entra com a ficha inteira precisa caber nela). */
export interface FaixaDeNivel {
  id: string;
  min: number;
  max: number;
}

/** Marco 17: o que derrotar um jogador com a ficha inteira vale, e o teto de XP por hora de cada um. */
export interface RecompensaDeJogador {
  xpPorNivel: number;
  tetoXpPorHora: number;
}

/** Marco 15: quando a fase termina — qualquer jogador na saída, ou todos os vivos sobre ela (cooperativo). */
export type RegraSaida = 'qualquer' | 'todos_vivos';
/** Marco 18 (D-069): `ultima` é a Última forma dos itens base (não cai: vem da forja e de missões). */
export type Raridade = 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario' | 'ultima';

export const RARIDADES: readonly Raridade[] = ['comum', 'incomum', 'raro', 'epico', 'lendario', 'ultima'];
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
  /** Marco 15 (D-061): a vida no modo, em % da derivada (o PvP dura mais sem mexer no dano). */
  vidaPct: number;
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
  loot: {
    politica: 'compartilhado' | 'individual';
    janelaParticipacaoS: number;
    itens: boolean;
    /** Marco 17: o spawner põe baú e loot no mundo (a arena tem itens só dos abates). */
    economiaDoSpawner: boolean;
  };
  limites: { npcs: number; invocacoesPorJogador: number; invocacoesDePergaminho: number; avataresPorJogador: number; armadilhasPorJogador: number; projeteis: number };
  /** Sempre false na v1 (§3.7): o schema rejeita true. */
  progressaoContaParaCampanha: false;
  fasesPermitidas: string[] | 'qualquer';
  inimigosDeIA: 'nenhum' | 'da_fase' | 'ondas';
  objetosDeFase: boolean;
  spawnerDinamico: boolean;
  /** Marco 10A-1: chance de um NPC atravessar uma porta interna ao pisar nela (§2.1, 50%). */
  portas: { inimigosCruzamChance: number };
  /** Marco 15: quem precisa estar na saída para a fase terminar. */
  saida: RegraSaida;
  /** Marco 15: os comandos que a sala aceita pela rede (o resto é recusado com `nao_permitido`). */
  comandosDeRede: string[];
  /** Marco 17: faixas de nível das salas (vazio: sem faixa). */
  faixas: FaixaDeNivel[];
  /** Marco 17: recompensa por jogador derrotado (null: só NPCs dão XP). */
  recompensaJogador: RecompensaDeJogador | null;
  /**
   * Marco 24 (24/10/2026, D-097): XP de grupo. Quem abate leva tudo e cada aliado vivo a até `raio` células (ou que
   * lutou na janela) leva `aliadoPct`. null = a divisão de antes, entre quem participou.
   */
  /** Marco 30 (D-129): `exigeGrupo` limita a partilha aos do mesmo grupo (no Mundo, todos os jogadores são aliados). */
  partilhaXp: { aliadoPct: number; raio: number; exigeGrupo: boolean } | null;
  /** Marco 10A-2 (§2.12): regeneração por célula e penalidade de morte (null = sem). O descanso saiu (D-067). */
  sobrevivencia: {
    regenPorCelula: boolean;
    penalidadeMorte: PenalidadeMorte | null;
    /** Marco 18 (D-068): a Sabedoria revela e desarma armadilhas (a arena não mostra armadilhas). */
    revelarArmadilhas: boolean;
    /** Marco 18 (D-068): o estudo de habilidades anda nesta modalidade (a arena usa a ficha certificada, sem estudo). */
    estudoAvanca: boolean;
  };
  /**
   * Marco 25 (25/10/2026, D-102): entre personagens (os dois com ficha), as skills de classe batem `danoClassePct`%.
   * Ausente = 100 (a campanha). Na arena, o duelo dura alguns golpes e os atributos decidem, não quem acerta primeiro.
   */
  pvp?: { danoClassePct: number };
  /**
   * Marco 29 (30/10/2026, D-128): cada sessão recebe só as entidades a até `raio` células do seu personagem
   * (o Mundo). Ausente = um patch só para todos, como antes.
   */
  areaDeInteresse?: { raio: number };
  /** Marco 29 (D-128): a IA só pensa a até estas células de algum jogador. Ausente = sempre pensa. */
  iaRaioAtivacao?: number;
  /** Marco 29 (D-128): a morte do jogador deixa a mochila e o equipado num túmulo (o Mundo, fora das dungeons). */
  tumuloNaMorte?: boolean;
  /**
   * Marco 30 (D-129): o loot do lugar em % (o ouro e a chance de item); o Mundo põe o do perigo da região. Ausente =
   * 100.
   */
  lootPct?: number;
  /** Marco 30 (D-129): os materiais que cada preset deixa ao morrer (o Mundo põe os do reino). Ausente = nenhum. */
  materiaisDeInimigos?: Readonly<Record<string, readonly { itemId: string; chancePct: number }[]>>;
}

export interface PenalidadeMorte {
  xp: number;
  /** Perder XP pode baixar o nível (revogando pontos); desligado na campanha padrão (§2.12). */
  perdeNivel: boolean;
  ouroPctMin: number;
  ouroPctMax: number;
}

function lerPenalidade(l: Leitor, v: unknown): PenalidadeMorte | null {
  if (v === null) return null;
  const o = l.objeto(v, 'penalidadeMorte');
  const p: PenalidadeMorte = {
    xp: l.numero(o, 'xp', { min: 0, inteiro: true }),
    perdeNivel: l.booleano(o, 'perdeNivel'),
    ouroPctMin: l.numero(o, 'ouroPctMin', { min: 0, max: 100, inteiro: true }),
    ouroPctMax: l.numero(o, 'ouroPctMax', { min: 0, max: 100, inteiro: true }),
  };
  if (p.ouroPctMin > p.ouroPctMax) l.erro('penalidadeMorte: ouroPctMin maior que ouroPctMax');
  return p;
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
    nivelMax: l.numero(o, 'nivelMax', { min: 1, max: 100, inteiro: true }),
    atributoMax: l.numero(o, 'atributoMax', { min: 1, max: 100, inteiro: true }),
    atributoTotalMax: l.numero(o, 'atributoTotalMax', { min: 6, inteiro: true }),
    orcamentoAtributos: l.numero(o, 'orcamentoAtributos', { min: 0, inteiro: true }),
    raridadeMax: l.opcao(o, 'raridadeMax', RARIDADES),
    slotsPermitidos: l.listaDeTextos(o, 'slotsPermitidos'),
    habilidadesPermitidas: lerListaOuQualquer(l, o, 'habilidadesPermitidas'),
    slotsHabilidade: l.numero(o, 'slotsHabilidade', { min: 0, max: 12, inteiro: true }),
    hpMaxAbsoluto: o.hpMaxAbsoluto === null ? null : l.numero(o, 'hpMaxAbsoluto', { min: 1 }),
    vidaPct: l.numero(o, 'vidaPct', { min: 10, max: 1000 }),
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
  const sobrevivencia = l.objeto(o.sobrevivencia, 'sobrevivencia');
  if (o.progressaoContaParaCampanha !== false) l.erro('progressaoContaParaCampanha precisa ser false na v1 (§3.7)');

  const modo: ModoDeJogo = {
    id: l.texto(o, 'id'),
    nome: l.texto(o, 'nome'),
    descricao: l.texto(o, 'descricao'),
    icone: l.icone(o, 'icone'),
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
    // Marco 29 (D-128): até 64, pelas regiões do Mundo (a arena e o grupo seguem no que os dados dizem).
    maxJogadores: l.numero(o, 'maxJogadores', { min: 1, max: 64, inteiro: true }),
    espectadores: l.booleano(o, 'espectadores'),
    clamp: lerClamp(l, o.clamp),
    loot: {
      politica: l.opcao(loot, 'politica', ['compartilhado', 'individual'] as const),
      janelaParticipacaoS: l.numero(loot, 'janelaParticipacaoS', { min: 0 }),
      itens: l.booleano(loot, 'itens'),
      economiaDoSpawner: l.booleano(loot, 'economiaDoSpawner'),
    },
    limites: {
      npcs: l.numero(limites, 'npcs', { min: 0, inteiro: true }),
      invocacoesPorJogador: l.numero(limites, 'invocacoesPorJogador', { min: 0, inteiro: true }),
      // Marco 27 (D-126): os pergaminhos de invocação acumulam até este teto, à parte das invocações de classe.
      invocacoesDePergaminho: l.numero(limites, 'invocacoesDePergaminho', { min: 0, inteiro: true }),
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
    saida: l.opcao(o, 'saida', ['qualquer', 'todos_vivos'] as const),
    comandosDeRede: l.listaDeTextos(o, 'comandosDeRede'),
    faixas: (Array.isArray(o.faixas) ? o.faixas : []).map((f) => {
      const x = l.objeto(f, 'faixa');
      return { id: l.texto(x, 'id'), min: l.numero(x, 'min', { min: 1, max: 100, inteiro: true }), max: l.numero(x, 'max', { min: 1, max: 100, inteiro: true }) };
    }),
    recompensaJogador:
      o.recompensaJogador === null || o.recompensaJogador === undefined
        ? null
        : (() => {
            const x = l.objeto(o.recompensaJogador, 'recompensaJogador');
            return { xpPorNivel: l.numero(x, 'xpPorNivel', { min: 0 }), tetoXpPorHora: l.numero(x, 'tetoXpPorHora', { min: 0 }) };
          })(),
    partilhaXp:
      o.partilhaXp === null || o.partilhaXp === undefined
        ? null
        : (() => {
            const x = l.objeto(o.partilhaXp, 'partilhaXp');
            return {
              aliadoPct: l.numero(x, 'aliadoPct', { min: 0, max: 100 }),
              raio: l.numero(x, 'raio', { min: 0, max: 50, inteiro: true }),
              exigeGrupo: x.exigeGrupo === undefined ? false : l.booleano(x, 'exigeGrupo'),
            };
          })(),
    sobrevivencia: {
      regenPorCelula: l.booleano(sobrevivencia, 'regenPorCelula'),
      penalidadeMorte: lerPenalidade(l, sobrevivencia.penalidadeMorte),
      revelarArmadilhas: sobrevivencia.revelarArmadilhas === undefined ? false : l.booleano(sobrevivencia, 'revelarArmadilhas'),
      estudoAvanca: sobrevivencia.estudoAvanca === undefined ? false : l.booleano(sobrevivencia, 'estudoAvanca'),
    },
    ...(o.pvp === undefined ? {} : { pvp: { danoClassePct: l.numero(l.objeto(o.pvp, 'pvp'), 'danoClassePct', { min: 0, max: 100 }) } }),
    ...(o.areaDeInteresse === undefined ? {} : { areaDeInteresse: { raio: l.numero(l.objeto(o.areaDeInteresse, 'areaDeInteresse'), 'raio', { min: 8, max: 64, inteiro: true }) } }),
    ...(o.iaRaioAtivacao === undefined ? {} : { iaRaioAtivacao: l.numero(o, 'iaRaioAtivacao', { min: 8, max: 128, inteiro: true }) }),
    ...(o.tumuloNaMorte === undefined ? {} : { tumuloNaMorte: l.booleano(o, 'tumuloNaMorte') }),
  };
  if (modo.fim.tipo !== 'nenhum' && modo.fim.alvo === null && modo.fim.tempoLimiteS === null) {
    l.erro('fim com tipo diferente de "nenhum" precisa de alvo ou tempo limite');
  }
  for (const c of modo.comandosDeRede) {
    if (!(TIPOS_DE_COMANDO as readonly string[]).includes(c)) l.erro(`comandosDeRede: comando desconhecido "${c}"`);
  }
  if (ehObjeto(o.clamp) && modo.clamp?.modo === 'preset' && modo.clamp.presetClasse === null) {
    l.erro('clamp em modo preset precisa de presetClasse');
  }
  return { modo, erros: l.erros };
}
