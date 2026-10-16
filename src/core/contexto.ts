// Contexto injetado em `simular()`: conteúdo imutável (fase e catálogos), modo de jogo e números
// de balanceamento. Fica fora do estado: não entra no digest nem no checkpoint (D-007).

import balanceJson from '../data/balance.json';
import type { RegrasHabilidades } from '../combat/compilar-habilidade';
import type { FaixaCritico } from '../combat/critico';
import type { RegrasOrcamento } from '../combat/orcamento';
import type { Dificuldade, RegrasDificuldade, RegrasGrupo } from '../modos/dificuldade';
import type { ModoDeJogo, Raridade } from '../modos/modo';
import type { RegrasColisao } from '../world/colisao';
import type { Fase } from '../world/fase';
import type { Atributos } from '../entities/entidade';
import type { Conteudo } from './conteudo';

export interface Balance {
  versao: number;
  movimento: {
    /** Milissegundos por célula na destreza 10 (§2.3). */
    velocidadeBaseMs: number;
    /** Tamanho máximo da fila de waypoints do jogador (§2.3). */
    filaMaxWaypoints: number;
  };
  navegacao: {
    /** Limite da busca para toque no mapa (§2.3). */
    maxPassosToque: number;
  };
  colisao: RegrasColisao;
  combate: {
    multiplicadorAtributoPadrao: number;
    autoAtaqueMs: number;
    /** Ajuste de 15/10/2026 (D-065): até quantas células a troca manual de alvo procura. */
    raioTrocaAlvo: number;
    janelaParticipacaoS: number;
    carismaNeutro: number;
    critico: FaixaCritico[];
  };
  hp: {
    hpAtributoMult: number;
    dificuldadeMult: number;
    fallback: number;
  };
  recursos: {
    regenManaPorSegundo: number;
    /** Marco 10A-2: por célula caminhada (§2.12), onde o modo liga. */
    regenHpPorCelula: number;
    regenManaPorCelula: number;
  };
  /** Descanso (§2.12, marco 10A-2): duração do congelamento e o que o curto devolve. */
  descanso: {
    curtoMs: number;
    longoMs: number;
    curtoHpPct: number;
    curtoManaPct: number;
  };
  respawn: {
    inimigoS: number;
    bossS: number;
  };
  /** Drops na primeira morte de um inimigo (§2.10). */
  drops: {
    chanceOrbeHp: number;
    chanceOrbeRecurso: number;
    orbeHpPct: number;
    orbeRecursoPct: number;
    /** Sorteio de item, independente do de orbe (§2.10); boss tem chance própria. */
    chanceItem: number;
    chanceItemBoss: number;
    /** Orbe de efeito (§2.10, 8%), sorteado à parte; o efeito vem do registro, por peso. */
    chanceOrbeEfeito: number;
    /** Ouro derrubado (marco 9A): `round(xp × ouroPorXp × [0,5; 1,5))`, só onde o modo solta itens. */
    ouroPorXp: number;
    raridadeMinBoss: Raridade;
    pesoRaridade: Record<Raridade, number>;
  };
  /** Progressão (§2.12). XP para passar do nível N: `tabela[N-1]` ou `N × fallbackPorNivel`. */
  xp: {
    decaimentoAntifarm: number;
    tabela: number[];
    fallbackPorNivel: number;
    nivelMax: number;
    pontosPorNivel: number;
    /** Aumento automático de HP base por nível acima do 1º. */
    hpPorNivel: number;
  };
  /** Efeitos (§2.8): dano, cura e recurso periódicos aplicam a cada intervalo. */
  efeitos: {
    intervaloPeriodicoMs: number;
    /** Quanto dura cada célula de rastro (§2.8). */
    rastroCelulaMs: number;
    /** Dominação (§2.9): duração e HP com que o dominado volta. */
    dominacaoMs: number;
    dominacaoHpPct: number;
  };
  /** Economia (§2.10, marco 9A): loja, baús e ouro. */
  economia: {
    /** Ouro de quem começa uma campanha. */
    ouroInicial: number;
    /** Marco 15: teto de ouro que a sala cooperativa aceita na ficha trazida do slot. */
    ouroMax: number;
    /** A loja compra por esta porcentagem do `valorBase` (arredondado para baixo). */
    vendaPct: number;
    /** Janela da loja (o jogador fica congelado) e a recarga armada ao fechar, por jogador e loja. */
    janelaLojaMs: number;
    recargaLojaMs: number;
    /** Quanto o baú congela quem abre, e quanto ele fica no mundo depois de aberto. */
    bauCongelaMs: number;
    bauSomeMs: number;
    /** Distância Chebyshev máxima para interagir. */
    alcanceInteracao: number;
  };
  /** Spawner dinâmico (§2.1, marco 9A-2): a cada `intervaloS`, depois de `carenciaS`. */
  spawner: {
    carenciaS: number;
    intervaloS: number;
    /** Tentativas de célula por objeto, e a distância Chebyshev mínima de todo jogador. */
    tentativas: number;
    distanciaMinJogador: number;
    bau: CategoriaSpawner;
    loot: CategoriaSpawner;
    orbe: CategoriaSpawner;
    armadilha: CategoriaSpawner;
    /** Chance relativa de cada orbe (§2.1: 40% vida, 30% recurso, 30% efeito). */
    pesoOrbe: { hp: number; recurso: number; efeito: number };
    /** Faixas fechadas [mínimo, máximo] do baú do spawner. */
    itensBau: [number, number];
    ouroBau: [number, number];
    danoArmadilha: number;
    armadilhaExpiraS: number;
  };
  /** Portas (§2.1, marco 10A-1): recarga da porta interna e janela de destaque da porta do boss. */
  portas: {
    recargaMs: number;
    janelaPortaBossMs: number;
  };
  /** Invocações (§2.9, marco 10A-3): IA própria, rampa e cascata de dominação. */
  invocacoes: {
    passoMs: number;
    raioEngajamento: number;
    distanciaDono: number;
    raioProtetor: number;
    rampaPorMinutoPct: number;
    rampaPorAbatePct: number;
    rampaMaxPct: number;
    cascataDominacao: number;
  };
  /** Limites do atributo efetivo (§2.10, equipamento derivado). */
  atributos: {
    minimo: number;
    maximo: number;
  };
  inventario: {
    /** Entradas na mochila; consumíveis iguais empilham até `pilhaMax`. */
    capacidade: number;
    pilhaMax: number;
  };
  /** Marco 14 (D-059): ranks, barra e pontos de habilidade; orçamento de poder; habilidades geradas. */
  habilidades: RegrasHabilidades;
  orcamento: RegrasOrcamento;
  geracao: {
    chanceInimigo: number;
    chancePorNivel: number;
    chanceMax: number;
    habilidadesBoss: number;
    chanceSecundario: number;
    /** Chance de um livro raro (habilidade gerada) entre os itens sorteados. */
    chanceLivroRaro: number;
  };
  /** Marco 15 (D-061): as alavancas de cada dificuldade e a escala pelo tamanho do grupo. */
  /** Marco 15 (D-061): as metas do ritmo, conferidas pelo simulador (tools/balanceamento) e pelo teste "ritmo". */
  metas: {
    /** Os presets que contam como "inimigo comum". */
    comuns: string[];
    comum: { golpesMin: number; golpesMax: number; tempoMinS: number; tempoMaxS: number };
    aguenta: { golpesMin: number; golpesMax: number };
    chefe: { tempoMinS: number; tempoMaxS: number; nivelJogador: number; nivelChefe: number };
    pvpLivre: { tempoMinS: number; tempoMaxS: number; nivel: number };
    avisoUtilMinMs: number;
    grupo: { tempoMinPctDoSolo: number; tempoMaxPctDoSolo: number };
    invocacao: { fatiaMinPct: number; fatiaMaxPct: number };
  };
  dificuldades: Record<Dificuldade, RegrasDificuldade>;
  grupo: RegrasGrupo;
  /**
   * Marco 15 (§2.5, D-061): o inimigo cresce com o nível — cada atributo ganha `porNivel` a cada nível a partir de
   * `aPartirDoNivel` (vida pela Constituição, dano pelo atributo da classe); o XP cresce `xpPorNivelPct` por nível.
   */
  inimigos: {
    crescimento: { atributo: keyof Atributos; porNivel: number; aPartirDoNivel: number }[];
    xpPorNivelPct: number;
    /** A vida de todo inimigo, em % da fórmula (§2.5): o ajuste fino do ritmo sem mexer em cada preset. */
    vidaPct: number;
  };
  ia: RegrasIa;
}

/** Quantos objetos de uma categoria o spawner mantém no mundo, e a chance por rodada. */
export interface CategoriaSpawner {
  max: number;
  chance: number;
}

/** Números da IA (§2.6). */
export interface RegrasIa {
  /** Ajuste de 15/10/2026 (D-060): quanto o alvo pode ficar fora da zona durante o "?" antes do inimigo desistir. */
  gracaForaDaZonaMs: number;
  patrulhaAvaliacaoMs: number;
  patrulhaPassoMs: number;
  chanceAproximar: number;
  chanceManter: number;
  /** Opções mais curtas que a base, com a chance de cada uma (a base fica com o restante). */
  hesitacao: { s: number; chance: number }[];
  hesitacaoBaseS: number;
  /** Cada ponto de Carisma acima do neutro multiplica as chances por este fator. */
  fatorCarisma: number;
  maxPassosPerseguicao: number;
  recalcularDistancia: number;
  maxFalhasCaminho: number;
  desistirAposMs: number;
  checagemDesistenciaMs: number;
  chanceDesistir: number;
  distanciaMinAtirador: number;
  distanciaMaxAtirador: number;
}

// O JSON importado tipa `raridadeMinBoss` como string e as tuplas como listas; o leitor de conteúdo e os testes
// conferem os valores.
export const BALANCE_PADRAO: Balance = balanceJson as unknown as Balance;

export interface ContextoSimulacao {
  readonly fase: Fase;
  readonly balance: Balance;
  readonly conteudo: Conteudo;
  readonly modo: ModoDeJogo;
}
