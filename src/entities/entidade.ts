import type { MemoriaTatica } from '../combat/estado-tatico';
// Entidade (§2.5). Só dados, para clonar, comparar no digest e gravar em checkpoint.
// Marco 3: atributos, recursos, efeitos, ação em curso e dados de morte e respawn.
// Marco 6 (13/10/2026): `bolsa` (base da ficha, equipamento e mochila) nos jogadores da campanha.

import type { Celula, Dir8, EntidadeId } from '../core/comandos';
import { clonarRng, type EstadoRng } from '../core/rng';
import type { EfeitoCanonico, TipoEfeito } from '../combat/registro-efeitos';
import type { Afinidade } from '../combat/afinidade';
import type { Slot } from '../modos/modo';

export type TipoEntidade = 'jogador' | 'inimigo' | 'invocacao' | 'avatar';
export type EquipeId = string;
export type TipoControlador = 'local' | 'remoto' | 'ia';
/** Marco 14: `atirador` soma a Destreza ao dano (arqueiro). */
export type ClasseCombate = 'corpo_a_corpo' | 'conjurador' | 'atirador';
export type Arquetipo = 'jogador' | 'perseguidor' | 'atirador' | 'controlador' | 'boss' | 'boneco';

export interface Atributos {
  forca: number;
  destreza: number;
  constituicao: number;
  inteligencia: number;
  sabedoria: number;
  carisma: number;
}

export interface EfeitoAtivo {
  tipo: TipoEfeito;
  /** Tick em que o efeito expira (§2.7: tempo em ticks, nunca relógio de parede). */
  ateTick: number;
  origemId: EntidadeId;
  /** Marco 8A: magnitude (campos do tipo no registro; 0 quando não usa). */
  valor: number;
  pct: number;
  /** Próxima aplicação dos periódicos; 0 nos demais. */
  proximoTick: number;
  /** Marco 8A-2: o efeito carregado (rastro de efeito) e a referência (preset); null nos demais. */
  interno: EfeitoCanonico | null;
  ref: string | null;
  /** Marco 14: quando começou (o anel de duração do HUD) e quantos acúmulos tem (regra `soma`). */
  inicioTick: number;
  acumulos: number;
}

/** Comportamento da invocação (§2.9, marco 10A-3). */
// Marco 22 (D-089): `companheiro` (o falcão do Aventureiro) ataca sempre o alvo selecionado do dono.
export type ComportamentoInvocacao = 'agressivo' | 'assassino' | 'protetor' | 'curador' | 'isca' | 'companheiro';

/** Invocação ou dominado (§2.9): de quem é, até quando, e se foi dominado (sobrevive ao dono). */
export interface DadosInvocacao {
  donoId: EntidadeId;
  expiraTick: number;
  dominado: boolean;
  /** Marco 10A-3: comportamento, avatar (isca que bloqueia e atrai), golpes que o avatar ainda aguenta. */
  comportamento: ComportamentoInvocacao;
  avatar: boolean;
  golpesRestantes: number;
  /** Rampa (§2.9): a invocação fica mais forte com o tempo e com os abates. */
  abates: number;
  criadoTick: number;
  /** Cascata de dominação: 0 para invocações, 1 para dominados, 2 para quem um dominado dominou… */
  nivelDominacao: number;
  /** Mortos do Necromante têm atributos próprios; o modelo só guarda a semelhança visual. */
  necromancia?: 'servo' | 'reanimado' | 'eco';
  /** Marco 22 (D-090): quantos mortos do mesmo Necromante estão de pé (o dano de cada um cai com a quantidade). */
  exercito?: number;
  modeloOriginal?: string;
  /** Marco 22 (D-089): o falcão do Aventureiro. Divide a vida do dono (o dano nele sai do dono) e tem vaga própria. */
  companheiro?: boolean;
  /** A vida do dono copiada no fim do último tick; a diferença é o dano que o falcão levou. */
  hpEspelhado?: number;
  /** Marco 24 (24/10/2026): invocação temporária fora do limite (Levante profano). */
  extra?: boolean;
}

/** Ação em conjuração (§2.7, etapa 3). Ticks publicados para a telegrafia (§3.6). */
export interface AcaoEmCurso {
  raioCombo?: number;
  acaoId: number;
  habilidadeId: string;
  /** Marco 14: a chave compilada (rank, caminhos e modificadores do momento da conjuração). */
  chave: string;
  alvoId: EntidadeId | null;
  /** Célula mirada (área) ou célula do alvo no início. */
  alvoX: number;
  alvoY: number;
  inicioTick: number;
  lancamentoTick: number;
  impactoPrevistoTick: number;
}

export type ModoIa = 'patrulha' | 'hesitando' | 'perseguindo';

/** Estado da IA (§2.6). Só dados, com PRNG próprio: reproduzível no harness. */
export interface EstadoIa {
  modo: ModoIa;
  /** Tick em que o modo atual começou (para o "!" e o "?" da apresentação). */
  modoDesdeTick: number;
  alvoId: EntidadeId | null;
  hesitacaoAteTick: number;
  /**
   * Alvos que já foram perseguidos: ao voltar ao raio, a perseguição é imediata. Ajuste de 15/10/2026 (D-060):
   * só entra quem chegou a ser perseguido (sair durante o "?" desarma a hesitação).
   */
  detectados: EntidadeId[];
  /** Ajuste de 15/10/2026: há quantos ticks o alvo da hesitação está fora da zona de atenção (0 = dentro). */
  foraDaZonaTicks: number;
  proximaAvaliacaoTick: number;
  proximoPassoTick: number;
  direcaoPatrulha: Dir8 | null;
  /** Últimas 3 células visitadas na patrulha (antitravamento, §2.3). */
  recentes: Celula[];
  proximaChecagemDesistenciaTick: number;
  falhasCaminho: number;
  /** Célula do alvo quando o caminho foi calculado (cache do perseguidor, §2.3). */
  alvoCacheX: number;
  alvoCacheY: number;
  proximoAtaqueTick: number;
  ataquesFeitos: number;
  /** Marco 18 (17/10/2026): o tick do último golpe recebido que já virou revide (os mais novos ainda não). */
  ultimaAgressaoVista: number;
  rng: EstadoRng;
}

/** Quem causou dano e quando, para dividir XP entre participantes (§2.7, morte). */
export interface Participacao {
  id: EntidadeId;
  tick: number;
}

/** Uma entrada da mochila. `invId` é estável enquanto o item existir (§2.10). */
export interface ItemNaMochila {
  invId: string;
  itemId: string;
  qtd: number;
  /** Marco 14: o conteúdo do livro raro (o id da habilidade gerada); null nos demais. */
  ref: string | null;
}

/** Marco 14: teclas 1–4 da barra de habilidades. */
export const SLOTS_BARRA = 4;

/** Marco 14: uma habilidade que o personagem conhece, no rank e com os caminhos escolhidos (definitivos). */
export interface HabilidadeConhecida {
  id: string;
  rank: number;
  caminhos: string[];
}

/**
 * Ficha de quem tem progressão (§2.10, §2.12): atributos-base e fontes de modificador. Os campos
 * `atributos`, `defesa`, `hpMax` e `manaMax` da entidade são sempre derivados daqui
 * (`recalcularFicha`), nunca guardados como deltas.
 */
export interface Bolsa {
  atributosBase: Atributos;
  defesaBase: number;
  hpBase: number;
  equipamento: Record<Slot, ItemNaMochila | null>;
  mochila: ItemNaMochila[];
  pontosAtributo: number;
  proximoInv: number;
  /** Marco 9A: moeda única (§2.10). Nunca negativa. */
  ouro: number;
  /** Marco 14 (D-059): a classe escolhida ao criar o personagem (fixa). */
  classeId: string;
  conhecidas: HabilidadeConhecida[];
  /** As 4 teclas (1–4): ids de habilidades conhecidas, ou null. `Entidade.habilidades` deriva daqui. */
  barra: (string | null)[];
  pontosHabilidade: number;
  /** D-075 (17/10/2026): origens permanentes dos ganhos por consumíveis e saldo fracionário de XP. */
  tomosComprados?: number;
  pontosPorItens?: number;
  ranksPorItens?: number;
  xpFracao?: number;
  xpLegado?: number;
  /** 18/10/2026: XP de abates por fase, persistente e sem reembolso na morte. */
  xpPorFase?: Record<string, { xpBaseAcumulado: number; meiaVidaXp?: number }>;
  /**
   * Marco 17 (D-063): identidade do personagem (UUID), dada pelo cliente ao criar; vazia nos saves antigos até o
   * jogo dar uma. O certificado da arena se prende a ela.
   */
  personagemId: string;
  /** Marco 18 (17/10/2026, D-068): a habilidade sendo estudada (aprender não é instantâneo); null = nenhuma. */
  estudo: Estudo | null;
  /** Marco 18 (D-070): a contagem de cada missão (as que zeram por fase usam `id@fase`) e as concluídas. */
  missoes: Record<string, number>;
  missoesConcluidas: string[];
  /** Marco 18 (D-070): as entradas do diário de descobertas. */
  diario: string[];
}

/** Marco 18 (D-068): estudo de uma habilidade nova. Só anda com o jogo rodando (um tick por tick de simulação). */
export interface Estudo {
  id: string;
  totalTicks: number;
  restanteTicks: number;
  /** Legado: apenas migração/reembolso dos pontos antigos. */
  aceleracoes: number;
  /** D-075: velocidade em doze avos e resto do progresso, sem arredondar cada tick. */
  velocidade12?: number;
  fracao12?: number;
}

/**
 * Interação em curso com baú ou loja (§2.10, marco 9A): enquanto existir, a entidade está
 * congelada (não anda nem age). Termina na etapa 5 do tick em `ateTick`, ao fechar ou ao morrer.
 */
export interface Interacao {
  /** Marco 18: `desarme` de armadilha revelada (o `objetoId` é o id da armadilha em texto). */
  tipo: 'bau' | 'loja' | 'desarme';
  objetoId: string;
  ateTick: number;
}

export interface Entidade {
  id: EntidadeId;
  nome: string;
  /** O que é. Nunca decide hostilidade (§2.5): isso é papel de `relacao()`. */
  tipo: TipoEntidade;
  /** De que lado está. */
  equipe: EquipeId;
  controlador: TipoControlador;
  /** Jogador que controla, quando `controlador` não é IA. Vazio para IA. */
  jogadorId: string;

  /** Posição lógica em células (§2.2): a origem do passo em curso. */
  x: number;
  y: number;
  /** Célula de destino do passo em curso; igual a (x, y) quando parado. Fica reservada. */
  destinoX: number;
  destinoY: number;
  /** Fração do passo em curso, em [0, 1). */
  progressoPasso: number;
  direcao: Dir8 | 'parado';
  proximoEixoX: boolean;
  waypoints: Celula[];
  caminho: Celula[];
  relogioAndar: number;

  atributos: Atributos;
  classe: ClasseCombate;
  defesa: number;
  hp: number;
  hpMax: number;
  mana: number;
  manaMax: number;
  ataqueBasico: string;
  habilidades: string[];
  efeitos: EfeitoAtivo[];
  acao: AcaoEmCurso | null;
  alvoSelecionado: EntidadeId | null;
  /** Ajuste de 15/10/2026 (D-065): travado, o alvo só muda por escolha do jogador. Ausente em saves antigos = false. */
  alvoTravado: boolean;
  autoAtaque: boolean;
  invisivelAteTick: number;
  morto: boolean;
  /** Tick em que o jogador revive; 0 quando não há revivescência pendente. */
  reviverEmTick: number;

  preset: string;
  /** Identidade de classe pública, inclusive em fichas de treino sem bolsa. Opcional em saves antigos. */
  classeId?: string;
  arquetipo: Arquetipo;
  nivel: number;
  /** Incrementa a cada respawn; o id continua estável (§3.6). */
  geracao: number;
  origemX: number;
  origemY: number;
  xp: number;
  /** XP concedido ao morrer, antes do antifarm. */
  xpBase: number;
  /** Quantas vezes esta instância já morreu (antifarm, §2.12). */
  abates: number;
  participacao: Participacao[];
  /** Criado no primeiro tick para entidades de IA; null para jogadores e bonecos. */
  ia: EstadoIa | null;
  /** Só jogadores da campanha; null para NPCs e para a ficha de sessão da arena (§3.7). */
  bolsa: Bolsa | null;
  /** Marco 8A-2: invocações e dominados; null nas demais entidades. */
  invocacao: DadosInvocacao | null;
  /** Marco 9A: baú ou loja aberta (congela); null quando livre. */
  interacao: Interacao | null;
  /** Ajuste de 16/10/2026 (D-067): buffs ofensivos pegos, esperando o combate para começar. */
  buffsArmados: BuffArmado[];
  /** D-067: carga de refúgio (imune por 45 s ao abrir a mochila ou a loja). */
  refugio: boolean;
  /** D-067: o que está equipado, para o token (público: a arena mostra para todos). */
  aparencia: AparenciaEquipada | null;
  /** Marco 18 (D-068): as ressonâncias de atributo ativas (ids). */
  ressonancias: string[];
  /** Marco 18: o último golpe com dano que a entidade levou (quem e com qual habilidade) — o "ao abater" lê. */
  ultimoGolpe: { fonteId: EntidadeId; chave: string } | null;
  /** Marco 18: a última habilidade que usou (combos e a Lâmina rúnica). */
  tatica?: MemoriaTatica;
  ultimaHabilidade: { id: string; chave: string; tick: number; alvoId: EntidadeId | null } | null;
  /** Marco 18 (D-069): a fase em que o renascer do item já foi usado ('' = disponível). */
  renascerFase: string;
  /** Marco 18 (D-070): a última reação que a entidade sofreu (as origens raras olham ao cair). */
  ultimaSinergia: string | null;
  /** 18/10/2026: um encontro por visita à fase, iniciado na primeira agressão hostil. */
  encontro?: { faseId: string; inicioTick: number };
  auraFracoes?: Record<string, number>;
  auraCuraFracao?: number;
  /** Marco 23 (D-092): a afinidade elemental do inimigo (absorve o elemento, fraco ao oposto). */
  afinidade?: Afinidade;
  /** Marco 22 (D-089): o elemento que o Mago encarna (fogo, gelo ou raio). */
  encarnacao?: 'fogo' | 'gelo' | 'raio';
  /** Ajuste de 24/10/2026 (D-091): até quando a encarnação vale (renova ao lançar outra magia do elemento). */
  encarnacaoAteTick?: number;
  /** Marco 22 (D-089): Mira firme do Arqueiro — a barra enche a partir deste tick (dano recebido ou tiro carregado zeram). */
  mira?: { desdeTick: number };
  /** Marco 21 (D-088): fúria do Guerreiro, valor no `ultimoTick` (o esvaziamento é calculado na leitura). */
  furia?: { valor: number; ultimoTick: number };
  /** Marco 24 (24/10/2026, D-097): para onde olha (último passo ou quem ataca); ausente = sul. Decide o "pelas costas". */
  olhando?: Dir8;
  /** Marco 24 (D-094): o medidor da ultimate (0..balance.ultimate.max); ausente = vazio. */
  cargaUltimate?: number;
  /** 18/10/2026: acertos efetivos consecutivos do Dardo no mesmo alvo e vida. */
  concentracaoArcana?: { alvoId: string; geracao: number; abates: number; acertos: number; ultimoTick: number };
}

export interface BuffArmado {
  efeito: EfeitoCanonico;
  /** Fim do prazo para entrar em combate. */
  ateTick: number;
}

/** Aparência pelo equipamento: a base da arma e da mão secundária; nas peças, a raridade (ou null). */
export interface AparenciaEquipada {
  arma: string | null;
  secundaria: string | null;
  cabeca: string | null;
  corpo: string | null;
  capa: string | null;
  /** Marco 18 (D-069): a forma da arma (null = sem forma) e o elemento dela. */
  formaArma: string | null;
  elementoArma: string | null;
  /** Marco 18: a forma mais alta entre as peças vestidas (o brilho e a aura do token). */
  formaMaxima: string | null;
}

export const ATRIBUTOS_NEUTROS: Readonly<Atributos> = {
  forca: 10,
  destreza: 10,
  constituicao: 10,
  inteligencia: 10,
  sabedoria: 10,
  carisma: 10,
};

export interface NovaEntidade {
  id: EntidadeId;
  tipo: TipoEntidade;
  x: number;
  y: number;
  nome?: string;
  equipe?: EquipeId;
  controlador?: TipoControlador;
  jogadorId?: string;
  atributos?: Partial<Atributos>;
  classe?: ClasseCombate;
  defesa?: number;
  hpMax?: number;
  manaMax?: number;
  ataqueBasico?: string;
  habilidades?: string[];
  autoAtaque?: boolean;
  preset?: string;
  arquetipo?: Arquetipo;
  nivel?: number;
  xpBase?: number;
}

export function criarEntidade(n: NovaEntidade): Entidade {
  const hpMax = n.hpMax ?? 100;
  const manaMax = n.manaMax ?? 10;
  const jogador = n.tipo === 'jogador';
  return {
    id: n.id,
    nome: n.nome ?? n.id,
    tipo: n.tipo,
    equipe: n.equipe ?? (jogador ? 'jogadores' : 'inimigos'),
    controlador: n.controlador ?? (jogador ? 'local' : 'ia'),
    jogadorId: n.jogadorId ?? '',
    x: n.x,
    y: n.y,
    destinoX: n.x,
    destinoY: n.y,
    progressoPasso: 0,
    direcao: 'parado',
    proximoEixoX: true,
    waypoints: [],
    caminho: [],
    relogioAndar: 0,
    atributos: { ...ATRIBUTOS_NEUTROS, ...n.atributos },
    classe: n.classe ?? 'corpo_a_corpo',
    defesa: n.defesa ?? 0,
    hp: hpMax,
    hpMax,
    mana: manaMax,
    manaMax,
    ataqueBasico: n.ataqueBasico ?? 'ataque_basico',
    habilidades: [...(n.habilidades ?? [])],
    efeitos: [],
    acao: null,
    alvoSelecionado: null,
    alvoTravado: false,
    autoAtaque: n.autoAtaque ?? jogador,
    invisivelAteTick: 0,
    morto: false,
    reviverEmTick: 0,
    preset: n.preset ?? '',
    arquetipo: n.arquetipo ?? (jogador ? 'jogador' : 'perseguidor'),
    nivel: n.nivel ?? 1,
    geracao: 0,
    origemX: n.x,
    origemY: n.y,
    xp: 0,
    xpBase: n.xpBase ?? 0,
    abates: 0,
    participacao: [],
    ia: null,
    bolsa: null,
    invocacao: null,
    interacao: null,
    buffsArmados: [],
    refugio: false,
    aparencia: null,
    ressonancias: [],
    ultimoGolpe: null,
    ultimaHabilidade: null,
    renascerFase: '',
    ultimaSinergia: null,
  };
}

export interface PontoVisual {
  x: number;
  y: number;
}

/** Posição contínua em células: origem do passo + fração do caminho até o destino. */
export function posicaoNoPasso(e: Entidade): PontoVisual {
  return {
    x: e.x + (e.destinoX - e.x) * e.progressoPasso,
    y: e.y + (e.destinoY - e.y) * e.progressoPasso,
  };
}

export function emPasso(e: Entidade): boolean {
  return e.destinoX !== e.x || e.destinoY !== e.y;
}

export function vivo(e: Entidade): boolean {
  return !e.morto && e.hp > 0;
}

/** Congelada por baú ou loja (§2.2, etapa 5): não começa passo nem ação. */
export function congelada(e: Entidade): boolean {
  return e.interacao !== null;
}

const copiarCelulas = (lista: readonly Celula[]): Celula[] => lista.map((c) => ({ x: c.x, y: c.y }));

const copiarItem = (i: ItemNaMochila | null): ItemNaMochila | null => (i ? { ...i } : null);

function clonarBolsa(b: Bolsa): Bolsa {
  return {
    ...b,
    atributosBase: { ...b.atributosBase },
    ...(b.xpPorFase ? { xpPorFase: Object.fromEntries(Object.entries(b.xpPorFase).map(([id, r]) => [id, { ...r }])) } : {}),
    equipamento: Object.fromEntries(Object.entries(b.equipamento).map(([slot, i]) => [slot, copiarItem(i)])) as Record<
      Slot,
      ItemNaMochila | null
    >,
    mochila: b.mochila.map((i) => ({ ...i })),
    conhecidas: b.conhecidas.map((c) => ({ ...c, caminhos: [...c.caminhos] })),
    barra: [...b.barra],
    estudo: b.estudo ? { ...b.estudo } : null,
    missoes: { ...b.missoes },
    missoesConcluidas: [...b.missoesConcluidas],
    diario: [...b.diario],
  };
}

// Clone explícito, campo a campo (§5.3 regra 4).
export function clonarEntidade(e: Entidade): Entidade {
  return {
    ...e,
    ...(e.encontro ? { encontro: { ...e.encontro } } : {}),
    ...(e.concentracaoArcana ? { concentracaoArcana: { ...e.concentracaoArcana } } : {}),
    ...(e.auraFracoes ? { auraFracoes: { ...e.auraFracoes } } : {}),
    ...(e.furia ? { furia: { ...e.furia } } : {}),
    ...(e.mira ? { mira: { ...e.mira } } : {}),
    ...(e.afinidade ? { afinidade: { ...e.afinidade } } : {}),
    waypoints: copiarCelulas(e.waypoints),
    caminho: copiarCelulas(e.caminho),
    atributos: { ...e.atributos },
    habilidades: [...e.habilidades],
    efeitos: e.efeitos.map((f) => ({ ...f, interno: f.interno ? { ...f.interno } : null })),
    acao: e.acao ? { ...e.acao } : null,
    participacao: e.participacao.map((p) => ({ ...p })),
    ia: e.ia
      ? {
          ...e.ia,
          detectados: [...e.ia.detectados],
          recentes: copiarCelulas(e.ia.recentes),
          rng: clonarRng(e.ia.rng),
        }
      : null,
    bolsa: e.bolsa ? clonarBolsa(e.bolsa) : null,
    invocacao: e.invocacao ? { ...e.invocacao } : null,
    interacao: e.interacao ? { ...e.interacao } : null,
    buffsArmados: e.buffsArmados.map((b) => ({ ateTick: b.ateTick, efeito: { ...b.efeito, interno: b.efeito.interno ? { ...b.efeito.interno } : null } })),
    aparencia: e.aparencia ? { ...e.aparencia } : null,
    ressonancias: [...e.ressonancias],
    ultimoGolpe: e.ultimoGolpe ? { ...e.ultimoGolpe } : null,
    ...(e.tatica ? { tatica: { ...e.tatica, aparou: e.tatica.aparou ? { ...e.tatica.aparou } : null, etapas: e.tatica.etapas.map((a) => ({ ...a, alvos: [...a.alvos], fatos: [...a.fatos], concluidos: [...a.concluidos] })) } } : {}),
    ultimaHabilidade: e.ultimaHabilidade ? { ...e.ultimaHabilidade } : null,
  };
}
