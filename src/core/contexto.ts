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
import type { RegrasDeEventos } from '../mundo/eventos-mundo';
import type { Atributos } from '../entities/entidade';
import type { RegrasItensGerados } from '../progression/gerar-item';
import type { Conteudo } from './conteudo';
import type { DominioDaClasse } from '../progression/dominio';

/** Marco 24 (24/10/2026, D-094): os momentos de cada classe que enchem o medidor da ultimate (balance.ultimate.classe). */
export type MomentoCargaClasse = 'furiaCheia' | 'encarnacao' | 'miraFirme' | 'servoCaiu' | 'falcao';

export interface Balance {
  /** Ajustes de classes (18/10/2026): curvas e passivas de produção. */
  ajustesClasses: {
    guerreiro: { contatoMaxPct: number; contatoNivel: number; contatoExpoente: number; grupoReducaoMaxPct: number; grupoNivelPleno: number; grupoRaio: number; extraInicioNivel: number; extraMaxPct: number; auraMinPct: number; auraMaxPct: number; auraRaio: number; auraCuraMinPct: number; auraCuraMaxPct: number;
      /** Marco 21 (D-088): fração da defesa do alvo descontada do pulso da aura (100 = inteira). */
      auraDefesaPct: number;
      /** Marco 21 (D-088): parte da vida que falta recuperada ao derrubar um hostil (não invocação). */
      curaAoAbaterPct: number;
      furia: { max: number; porBasico: number; carenciaMs: number; perdaPorS: number; curaMult: number; /** Marco 24 (D-094): a fúria cheia liga o Frenesi. */ frenesi: { duracaoMs: number; danoPct: number; velocidadeAtaquePct: number } }; reforcosInicioNivel: number; reforcosPlenosNivel: number; movimentoMult: number };
    mago: { inicialPct: number; intermediarioPct: number; nivelIntermediario: number; fimIntermediario: number; nivelFinal: number; dardoInicioMult: number; dardoRecuperacaoNivel: number; dardoPlenoNivel: number; concentracaoAcertos: number; concentracaoJanelaMs: number; concentracaoExtraPct: number;
      /** Marco 22 (D-089): encarnação elemental. */
      encarnacao: { fogoDanoPct: number; fogoIntervaloMs: number; fogoRaio: number; fogoQueimaValor: number; fogoQueimaMs: number; geloReducaoPct: number; geloResfriarMs: number; raioVelocidadePct: number; duracaoMs: number; duplaJanelaMs: number; duplaDuracaoMs: number } };
    aventureiro: { nivelCorte: number; danoMult: number; /** Marco 24 (D-094): dano das skills do falcão. */ falcaoDanoMult: number; /** Marco 22 (D-089): passo do falcão. */ falcaoPassoMs: number; /** D-091: IA do falcão. */ falcao: { distanciaAlvo: number; raioPasseio: number; raioColeta: number; passeioMs: number; raioCombate: number; /** Marco 24 (D-098): o dano no falcão que chega ao dono, do nível 1 ao máximo, e a espera até pousar no ombro. */ reflexoInicioPct: number; reflexoFimPct: number; pousoMs: number; /** Marco 25 (D-102): velocidades do ataque e do dash (por nível) e o bônus do atributo; a vigia dos projéteis. */ velocidadeAtaque: CurvaPorNivel; velocidadeDash: CurvaPorNivel; atributoBonusPorPontoPct: number; atributoBonusMaxPct: number; vigiaCelulas: number; vigiaRaio: number } };
    arqueiro: { secundariosMult: number; /** Marco 22 (D-089): Mira firme. */ mira: { cargaMs: number; reducaoPorDestrezaPct: number; reducaoMaxPct: number; d20Minimo: number } };
    necromante: { protecaoMs: number; doisPct: number; grupoPct: number };
  };
  necromancia: { ataquesPorInvocacao: number; resistenciaPorSabPct: number; resistenciaSabMaxPct: number; danoPct: number; servosExtras: number; retornoServoMs: number; duracaoMortoMs: number; raioColheita: number; ecoRecargaMs: number; vidaBase: number; vidaPorNivel: number; vidaServoPct: number; alcanceRitual: number; /** Marco 22 (D-090). */ distanciaRetorno: number; atributoPorInt: number; perdaPorQuantidade: number };
  tatica: { respostaPct: number; respostaMs: number; aparoJanelaMaxMs: number; veuJanelaMaxMs: number; muralhaMaxMs: number; campoMaxMs: number; janelaEtapaMs: number; janelaTotalMs: number; tetoCampos: number; escudoMaxHpPct: number; fluxoIntervaloMs: number; fluxoDuracaoMs: number; fluxoTeto: number; consumoTeto: number; consumoPct: number; colisaoDano: number; colisaoAtordoarMs: number; tenacidadeMaxPct: number; removiveis: string[] };
  progressaoItens: { tomoPrecoBase: number; aceleracaoIncomumChancePct: number; aceleracaoRaraChancePct: number; essenciaChancePct: number; essenciaBossChancePct: number };
  versao: number;
  movimento: {
    /** Milissegundos por célula na destreza 10 (§2.3). */
    velocidadeBaseMs: number;
    /** Tamanho máximo da fila de waypoints do jogador (§2.3). */
    filaMaxWaypoints: number;
    /** Marco 26 (D-104): o raio do corpo redondo, em células (dois corpos que se bloqueiam ficam a 2 raios). */
    raioCorpo: number;
    /** Marco 26 (28/10/2026, D-120): o avanço e o teleporte passam por paredes dentro do alcance. */
    dashAtravessaParedes: boolean;
    /** Marco 28 (D-127): teto do multiplicador de velocidade pela Destreza (atributos até 100). */
    velocidadeMaxMult: number;
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
  /** Marco 24 (D-094): o medidor da ultimate; `classe`, o ganho do jeito de cada classe (com intervalo mínimo). */
  ultimate: { max: number; vidaBaixaPct: number; ganhos: { habilidade: number; basico: number; cura: number; abate: number; combo: number }; classe: Record<MomentoCargaClasse, { valor: number; intervaloMs: number }> };
  /** Marco 24 (24/10/2026, D-097): tetos e números dos estados novos. */
  estados: { esquivaMaxPct: number; cegoMaxPct: number; contragolpeAtordoarMs: number; contragolpeFuria: number };
  /** Marco 24 (D-095): quantas passivas gerais ficam ligadas ao mesmo tempo. */
  passivasGerais: { maxAtivas: number };
  /** Marco 24 (D-095): quantas gerais da mesma família nas teclas 3–6 fazem Domínio. */
  sintonia: { dominioMinimo: number };
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
  /**
   * Marco 26 (28/10/2026, D-121): seguir alvo. À distância (o básico em projétil) segue
   * até o alcance × (1 + `folgaDistancia`) e troca, depois do abate, no alcance × `trocaDistancia`; corpo a corpo, com
   * `folgaCorpoACorpo` e `trocaCorpoACorpo`. O direcional a mais de `anguloCancelaGraus` do alvo cancela.
   */
  seguirAlvo: {
    folgaDistancia: number;
    folgaCorpoACorpo: number;
    trocaDistancia: number;
    trocaCorpoACorpo: number;
    anguloCancelaGraus: number;
  };
  /**
   * Marco 26 (26/10/2026, D-113): os enfeites que quebram (tipos de world/decoracao.ts) e o peso de cada saque; o
   * ouro sai entre `ouroMin` e `ouroMax`, e os orbes usam as porcentagens de `drops`.
   */
  quebraveis: {
    tipos: string[];
    saque: Record<'nada' | 'ouro' | 'orbe_hp' | 'orbe_recurso' | 'orbe_efeito', number>;
    ouroMin: number;
    ouroMax: number;
  };
  /** Progressão (§2.12). XP para passar do nível N: `tabela[N-1]` ou `N × fallbackPorNivel`. */
  xp: {
    decaimentoAntifarm: number;
    criaturasInferiores: { niveisPorMeiaVida: number; xpMinimo: number };
    tabela: number[];
    fallbackPorNivel: number;
    nivelMax: number;
    pontosPorNivel: number;
    /** Marco 28 (D-127): a partir de cada nível, quantos pontos de atributo cada nível dá (substitui `pontosPorNivel`). */
    pontosPorFaixa: { aPartirDe: number; pontos: number }[];
    /** Marco 28 (D-127): acima de `aPartirDe`, cada nível custa mais `crescimentoPct`% por nível (curva longa). */
    curvaLonga: { aPartirDe: number; crescimentoPct: number };
    /** Marco 28 (D-127): o nível em que as curvas de classe (aura, falcão, extra) chegam ao máximo. */
    nivelPlenoDasClasses: number;
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
    /**
     * Marco 26 (D-122): quanto o drop que ninguém pega fica no chão. Livros, essências e itens raros ou melhores
     * não somem.
     */
    prazoNoChao: { orbeMs: number; ouroMs: number; itemMs: number };
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
  /** Marco 25 (D-101): reforço de inimigos por fase avançada, proporcional à área passável da fase. */
  populacao: { reforcoPorFasePct: number; areaReferencia: number; tetoMult: number; tetoInimigos: number };
  portas: {
    recargaMs: number;
    janelaPortaBossMs: number; /** Marco 24 (D-099): parado na porta de fase até sair. */ esperaMs: number;
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
    /** Marco 28 (D-127): o ponto gasto não leva o atributo-base acima de nível + folga. */
    folgaSobreNivel: number;
    /** Marco 28 (D-127): acima de `aPartirDe`, cada ponto rende `pct`% nas fórmulas sem teto. */
    rendimentoAcima: { aPartirDe: number; pct: number };
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
    intervaloMs: number; queimadura: number; veneno: number; duracaoMs: number;
    danoArmadilhaBase: number; danoArmadilhaPorNivel: number; danoArmadilhaMax: number; rearmeMs: number;
    sangramento: number; sangramentoMs: number; enxameReservaMax: number; enxamePorSala: number;
    enxameAtivos: number; enxameLeva: number; enxameInicio: number; enxameRaio: number; enxameDistanciaSegura: number;
    /** Marco 23 (D-092): as áreas novas (gelo fino, lama, névoa sombria, luz sagrada). */
    resfriadoPct: number; atoladoPct: number; definhandoPct: number; curaSagrada: number;
    /** Marco 25 (D-100): a área do próprio elemento cura o inimigo afim, por pulso. */
    curaAfim: number;
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
  /** Marco 27 (D-126): as armas de classe (progression/armas.ts e combat/basico.ts). */
  armas: {
    /** O n-ésimo básico sai pela arma da mão secundária. */
    secundariaACada: number;
    /** O tiro carregado do Arqueiro por uma arma corpo a corpo vira uma linha com este multiplicador do alcance. */
    carregadoAlcanceMult: number;
    /** O que a classe perde sem a arma natural. */
    semFamiliaridade: { curaPct: number; alcance: number; velocidadePct: number; elementalPct: number; servosPct: number };
    /** A fração da passiva de outra classe que a arma dela dá. */
    emprestimo: {
      curaAoAbaterChancePct: number;
      curaAoAbaterPct: number;
      elementalChancePct: number;
      elementalMs: number;
      reanimarChancePct: number;
      reanimarMs: number;
      invocacaoDuracaoPct: number;
      arcoRecargaPct: number;
    };
    /** A passiva do Aventureiro, com o arremessável na mão principal. */
    aventureiro: { descontoPergaminhoPct: number; sortePergaminhoPct: number; duracaoInvocacaoPct: number; danoBasicoPct: number };
  };
  /** Marco 28 (30/10/2026, D-127): o atributo de classe (progression/dominio.ts). */
  dominio: {
    skillsPorPontoPct: number;
    semFamiliaridadePct: number;
    classes: Readonly<Record<string, DominioDaClasse>>;
    efeitos: {
      rastroIntervaloMs: number; rastroPct: number;
      ressonanciaRaio: number;
      orbeRaio: number; orbeIntervaloMs: number; orbePct: number;
      ancoraIntervaloMs: number; ancoraPct: number; ancoraAlcance: number;
      explosaoRaio: number;
      tempestadeCelulas: number;
      legiaoPulsos: number;
    };
  };
  /** Marco 29 (30/10/2026, D-128): o modo Mundo (túmulo, portais, coleta, covis e o checkpoint). */
  mundo: {
    /** Só o dono abre o túmulo por `donoExclusivoS` (fora das regiões com PvP); some em `duracaoS`. */
    tumulo: { donoExclusivoS: number; duracaoS: number };
    /** Custo do portal: base + por região de distância (Chebyshev na grade do reino). */
    portal: { ouroBase: number; ouroPorRegiao: number; recargaS: number };
    /** A coleta canaliza por `canalMs` (o dano interrompe) a até `raio` células; o nó volta em `renascerS`. */
    coleta: { canalMs: number; renascerS: number; raio: number };
    /** No covil, quem causou ao menos esta % do dano no boss leva o próprio sorteio. */
    covil: { contribuicaoMinPct: number };
    checkpointS: number;
    /** Invisível para inimigos por alguns segundos depois de passar de região. */
    passagemProtecaoS: number;
    /** Marco 30 (D-129): o baú do banco (por personagem, em qualquer vila). */
    banco: { slots: number };
    /** Missões aceitas ao mesmo tempo e quantas o quadro oferece por dia. */
    missoes: { ativasMax: number; ofertasPorQuadro: number };
    /** Chat: o raio do canal local, o tamanho da mensagem, o limite por janela e o histórico do cliente. */
    chat: { raioLocal: number; maxTexto: number; porJanela: number; janelaS: number; historico: number };
    grupo: { max: number; conviteS: number };
    /** Troca direta: a distância entre os dois e as pilhas por lado. */
    troca: { raio: number; maxItens: number };
    /** Mercado do reino: as taxas que tiram ouro da economia, o limite de anúncios, a validade e a página. */
    mercado: { taxaAnuncioPct: number; taxaVendaPct: number; anunciosPorPersonagem: number; duracaoH: number; precoMax: number; pagina: number };
    /** Marco 30 (D-129): os eventos por região, sorteados por janela de tempo (mundo/eventos-mundo.ts). */
    eventos: RegrasDeEventos;
  };
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
  /**
   * Marco 31 (31/10/2026, D-130): o visual sombrio. Os raios de luz (em células) e o escuro do exterior, a mistura e a
   * oclusão do chão texturizado (render/solo/) e a parede alta do isométrico (altura em células, esmaecimento).
   */
  visual: {
    luz: { raioJogador: number; raioTocha: number; raioObjeto: number; raioMagia: number; resolucaoMapa: number; realceMinimo: number; escuridaoExterior: number; clareza: number };
    /** Ajuste de 31/10/2026 (D-130): até quanto ouro cada monte vai (o maior fica com o resto). */
    ouroMontes: number[];
    solo: { amostrasPorCelula: number; raioMistura: number; ruidoBorda: number; aoRaio: number; aoForca: number; macroForca: number; variacaoCobre: number };
    paredeIso: { altura: number; alcanceSala: number; alphaFade: number; telhadoPerto: number };
  };
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
    /** Marco 28 (D-127): a luta nos níveis altos e o tempo do 30 ao 100 (em vezes o do 1 ao 30). */
    nivelAlto: { niveis: number[]; vitoriasMinPct: number; tempoMinS: number; tempoMaxS: number; ritmoNiveis: number[]; razaoTempoMin: number; razaoTempoMax: number };
    /** Marco 30 (D-129): o ritmo das regiões do Mundo e o tempo dos covis de boss (tools/balanceamento/mundo.ts). */
    mundo: { regiaoVitoriasMinPct: number; covilGrupo: number; covilTempoMinS: number; covilTempoMaxS: number; covilSoloTempoMaxS: number };
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
  /** Marco 26 (D-122): a patrulha só se aproxima de quem está a até este raio (células, Manhattan). */
  raioAproximar: number;
  chanceManter: number;
  /** Opções mais curtas que a base, com a chance de cada uma (a base fica com o restante). */
  hesitacao: { s: number; chance: number }[];
  hesitacaoBaseS: number;
  /** Marco 26 (28/10/2026, D-118): o "?" nunca passa disto (depois do preset e da dificuldade). */
  hesitacaoMaxS: number;
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
  /**
   * Marco 25 (25/10/2026, D-100): quanto uma célula de perigo pesa no caminho de quem evita (em passos); o raio da
   * busca pela área do próprio elemento e a vida em que sai dela; o intervalo dos sorteios táticos (cura, foco); o
   * raio em que se vê uma armadilha disparar e quantos donos de armadilha a IA lembra.
   */
  custoPerigo: number;
  curaAfimRaio: number;
  curaAfimSaiPct: number;
  sorteioTaticoMs: number;
  armadilhaVistaRaio: number;
  armadilhasLembradas: number;
  /** Marco 25 (D-100): arquétipos que não largam a posição para se esquivar da telegrafia (o chefe segura o lugar). */
  arquetiposFirmes: string[];
}

// O JSON importado tipa `raridadeMinBoss` como string e as tuplas como listas; o leitor de conteúdo e os testes
// conferem os valores.
/** Marco 25 (D-102): um valor nos níveis 1, 20 e 30 (linear entre eles). */
export interface CurvaPorNivel {
  n1: number;
  n20: number;
  n30: number;
}

export const BALANCE_PADRAO: Balance = balanceJson as unknown as Balance;

export interface ContextoSimulacao {
  readonly fase: Fase;
  readonly balance: Balance;
  readonly conteudo: Conteudo;
  readonly modo: ModoDeJogo;
}
