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
import type { RegrasItensGerados } from '../progression/gerar-item';
import type { Conteudo } from './conteudo';

export interface Balance {
  /** Ajustes de classes (18/10/2026): curvas e passivas de produção. */
  ajustesClasses: {
    guerreiro: { contatoMaxPct: number; contatoNivel: number; contatoExpoente: number; grupoReducaoMaxPct: number; grupoNivelPleno: number; grupoRaio: number; extraInicioNivel: number; extraMaxPct: number; auraMinPct: number; auraMaxPct: number; auraRaio: number; auraCuraMinPct: number; auraCuraMaxPct: number;
      /** Marco 21 (D-088): fração da defesa do alvo descontada do pulso da aura (100 = inteira). */
      auraDefesaPct: number;
      /** Marco 21 (D-088): parte da vida que falta recuperada ao derrubar um hostil (não invocação). */
      curaAoAbaterPct: number;
      furia: { max: number; porBasico: number; carenciaMs: number; perdaPorS: number; curaMult: number }; reforcosInicioNivel: number; reforcosPlenosNivel: number; movimentoMult: number };
    mago: { inicialPct: number; intermediarioPct: number; nivelIntermediario: number; fimIntermediario: number; nivelFinal: number; dardoInicioMult: number; dardoRecuperacaoNivel: number; dardoPlenoNivel: number; concentracaoAcertos: number; concentracaoJanelaMs: number; concentracaoExtraPct: number;
      /** Marco 22 (D-089): encarnação elemental. */
      encarnacao: { fogoDanoPct: number; fogoIntervaloMs: number; fogoRaio: number; fogoQueimaValor: number; fogoQueimaMs: number; geloReducaoPct: number; geloResfriarMs: number; raioVelocidadePct: number; duracaoMs: number } };
    aventureiro: { nivelCorte: number; danoMult: number; /** Marco 24 (D-094): dano das skills do falcão. */ falcaoDanoMult: number; /** Marco 22 (D-089): passo do falcão. */ falcaoPassoMs: number; /** D-091: IA do falcão. */ falcao: { distanciaAlvo: number; raioPasseio: number; raioColeta: number; passeioMs: number; raioCombate: number } };
    arqueiro: { secundariosMult: number; /** Marco 22 (D-089): Mira firme. */ mira: { cargaMs: number; reducaoPorDestrezaPct: number; reducaoMaxPct: number; d20Minimo: number } };
    necromante: { protecaoMs: number; doisPct: number; grupoPct: number };
  };
  necromancia: { danoPct: number; servosExtras: number; retornoServoMs: number; duracaoMortoMs: number; raioColheita: number; ecoRecargaMs: number; vidaBase: number; vidaPorNivel: number; vidaServoPct: number; alcanceRitual: number; /** Marco 22 (D-090). */ distanciaRetorno: number; atributoPorInt: number; perdaPorQuantidade: number };
  tatica: { respostaPct: number; respostaMs: number; aparoJanelaMaxMs: number; veuJanelaMaxMs: number; muralhaMaxMs: number; campoMaxMs: number; janelaEtapaMs: number; janelaTotalMs: number; tetoCampos: number; escudoMaxHpPct: number; fluxoIntervaloMs: number; fluxoDuracaoMs: number; fluxoTeto: number; consumoTeto: number; consumoPct: number; colisaoDano: number; colisaoAtordoarMs: number; tenacidadeMaxPct: number; removiveis: string[] };
  progressaoItens: { tomoPrecoBase: number; aceleracaoIncomumChancePct: number; aceleracaoRaraChancePct: number; essenciaChancePct: number; essenciaBossChancePct: number };
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
    /** Marco 24 (D-097): abertura do cone de trás, em graus (135 = a célula de trás e as duas diagonais). */
    costasConeGraus: number;
  };
  /** Marco 24 (24/10/2026, D-094): o medidor da ultimate e quanto cada momento enche. */
  ultimate: { max: number; ganhos: { habilidade: number; basico: number; cura: number; abate: number; combo: number } };
  /** Marco 24 (24/10/2026, D-097): tetos e números dos estados novos. */
  estados: { esquivaMaxPct: number; cegoMaxPct: number; contragolpeAtordoarMs: number; contragolpeFuria: number };
  /** Marco 24 (D-095): quantas passivas gerais ficam ligadas ao mesmo tempo. */
  passivasGerais: { maxAtivas: number };
  hp: {
    hpAtributoMult: number;
    dificuldadeMult: number;
    fallback: number;
  };
  recursos: {
    /** D-078 (17/10/2026): cura proporcional ao HP retirado pelo básico, por classe. */
    curaBasicoPorClassePct: Record<string, number>;
    /** D-071 (17/10/2026): recuperação dos NPCs hostis e repouso dos chefes. */
    curaNpcAoAbaterPct: number;
    regenBossPorSegundoPct: number;
    regenBossEsperaMs: number;
    regenManaPorSegundo: number;
    /** Marco 10A-2: por célula caminhada (§2.12), onde o modo liga. */
    regenHpPorCelula: number;
    regenManaPorCelula: number;
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
    criaturasInferiores: { niveisPorMeiaVida: number; xpMinimo: number };
    tabela: number[];
    fallbackPorNivel: number;
    nivelMax: number;
    pontosPorNivel: number;
    /** Aumento automático de HP base por nível acima do 1º. */
    hpPorNivel: number;
    faixaAvancada: { nivelInicio: number; percentuais: Record<Dificuldade, number> };
  };
  /** Efeitos (§2.8): dano, cura e recurso periódicos aplicam a cada intervalo. */
  efeitos: {
    intervaloPeriodicoMs: number;
    /** Quanto dura cada célula de rastro (§2.8). */
    rastroCelulaMs: number;
    /** Dominação (§2.9): duração e HP com que o dominado volta. */
    dominacaoMs: number;
    dominacaoHpPct: number;
    /** D-067: prazo para o buff ofensivo armado começar (em combate). */
    prazoArmadoMs: number;
    /** D-067: imunidade do refúgio ao abrir a mochila ou a loja. */
    refugioMs: number;
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
    /** D-067: o orbe de refúgio (um só por vez, contando o que o jogador carrega). */
    refugio: CategoriaSpawner;
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
    /** Marco 17 (D-063): o que cada ponto acima de 10 faz (progression/efeitos-atributo.ts). */
    efeitos: {
      regenManaPorSabedoriaPct: number;
      recargaBasicoPorDestrezaPct: number;
      recargaBasicoMaxPct: number;
      regenPorCelulaPorConstituicaoPct: number;
      descontoPorCarismaPct: number;
      descontoMaxPct: number;
      /** Marco 18 (D-068): a rolagem escala com FOR e INT (meio a meio) e a INT dá a potência dos efeitos. */
      rolagemPorPontoPct: number;
      especializacaoInicio: number;
      especializacaoPorPonto: number;
      especializacaoMax: number;
      rolagemMin: number;
      efeitoPorIntPct: number;
      potenciaMin: number;
      potenciaMax: number;
    };
  };
  /** Marco 18 (D-068): a Sabedoria revela (raio e chance por teste) e desarma armadilhas. */
  ambiente: {
    intervaloMs: number; engenhoMs: number; queimadura: number; veneno: number; duracaoMs: number;
    danoArmadilhaBase: number; danoArmadilhaPorNivel: number; danoArmadilhaMax: number; rearmeMs: number;
    sangramento: number; sangramentoMs: number; enxameReservaMax: number; enxamePorSala: number;
    enxameAtivos: number; enxameLeva: number; enxameInicio: number; enxameRaio: number; enxameDistanciaSegura: number;
    /** Marco 23 (D-092): as áreas novas (gelo fino, lama, névoa sombria, luz sagrada). */
    resfriadoPct: number; atoladoPct: number; definhandoPct: number; curaSagrada: number;
  };
  /** Marco 23 (24/10/2026, D-092): o clima da fase de tema elemental (combat/clima.ts). */
  clima: {
    /** O elemento do tema bate mais forte, e o estado que ele aplica dura mais… */
    reforcoPct: number;
    duracaoEstadoPct: number;
    /** …e o oposto dele bate mais fraco. */
    opressaoPct: number;
    /** A cada `pulsoMs`, o clima pesa nos personagens sem resistência de `resistenciaImunePct` ao elemento. */
    pulsoMs: number;
    resistenciaImunePct: number;
    pulsos: Partial<Record<string, { tipo: string; valor: number; pct: number; duracaoMs: number }>>;
  };
  /** Marco 23 (D-092): inimigos com afinidade elemental (absorvem o próprio elemento, fracos ao oposto). */
  afinidade: {
    absorcaoPct: number;
    fraquezaPct: number;
    extremaFraquezaPct: number;
    chanceExtrema: number;
    vidaExtremaPct: number;
    /** O afim vale mais XP (o extremo, mais ainda). */
    xpPct: number;
    xpExtremaPct: number;
  };
  /** Marco 23 (D-093): o básico emprestado da arma de outra família (progression/armas.ts). */
  armas: { danoForaDaClassePct: number };
  armadilhas: {
    revelarIntervaloMs: number;
    raioBase: number;
    /** +1 de raio a cada tantos pontos acima de 10. */
    raioPorPontos: number;
    chanceBasePct: number;
    chancePorPontoPct: number;
    chanceMaxPct: number;
    desarmeBasePct: number;
    desarmePorPontoPct: number;
    desarmeMaxPct: number;
    desarmeMs: number;
    xpDesarme: number;
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
    /** Marco 17: na arena com a ficha inteira, a build focada e o equipado vencem a maioria dos duelos. */
    build: { nivel: number; vitoriasMinPct: number };
  };
  dificuldades: Record<Dificuldade, RegrasDificuldade>;
  grupo: RegrasGrupo;
  /**
   * Marco 15 (§2.5, D-061): o inimigo cresce com o nível — cada atributo ganha `porNivel` a cada nível a partir de
   * `aPartirDoNivel` (vida pela Constituição, dano pelo atributo da classe); o XP cresce `xpPorNivelPct` por nível.
   */
  /**
   * Marco 17 (D-063): tetos de crescimento entre dois certificados do personagem (por minuto de jogo, com folga) e
   * o nível até onde um personagem sem certificado anterior é aceito.
   */
  /** Marco 17 (D-063): equipamento gerado por semente (progression/gerar-item.ts). */
  itensGerados: RegrasItensGerados;
  integridade: {
    nivelSemHistorico: number;
    xpPorMinutoBase: number;
    xpPorMinutoPorNivelPct: number;
    folgaXp: number;
    ouroPorMinuto: number;
    folgaOuro: number;
    itensPorMinuto: number;
    folgaItens: number;
    minutosMaxPorCertificado: number;
  };
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
  /** Marco 18: quem leva golpe persegue o agressor na hora (e troca para o último que bateu). */
  revide: boolean;
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
