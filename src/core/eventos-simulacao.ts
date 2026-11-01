// Eventos que a simulação grava a cada tick. O adaptador de apresentação os publica no
// barramento (events.ts) depois do tick; a simulação nunca chama a interface.
// Eventos visuais não são autoridade sobre HP: o estado basta para reconstruir a tela (§3.6).

import type { Dificuldade } from '../modos/dificuldade';
import type { EntidadeId } from './comandos';
import type { TipoObjeto } from './estado';
import type { TipoEfeito } from '../combat/registro-efeitos';
import type { Slot } from '../modos/modo';
import type { StatusCaminho } from '../world/navegacao';

/** Marco 26 (D-124): o que deslocou alguém (o evento `deslocado`). */
export type CausaDeslocamento = 'puxao' | 'empurrao' | 'arremesso' | 'avanco' | 'teleporte' | 'troca';

export type MotivoRecusa =
  | 'nadando'
  | 'sem_habilidade'
  | 'vida_cheia'
  | 'sem_invocacao'
  | 'ocupado'
  | 'bloqueado'
  | 'recarga'
  | 'recurso'
  | 'sem_alvo'
  | 'fora_de_alcance'
  /** Marco 8A-2: limite de invocações ou armadilhas do modo, recusado antes de cobrar (§5.6). */
  | 'limite'
  /** Marco 24 (D-094): o par das teclas 1 e 2 não forma ultimate, ou o medidor não encheu. */
  | 'sem_ultimate'
  | 'sem_carga';

/** Recusas de mochila, equipamento e pontos (marco 6). */
export type MotivoItem =
  | 'sem_mochila'
  | 'nao_encontrado'
  | 'slot_invalido'
  | 'nivel_insuficiente'
  | 'mochila_cheia'
  | 'nao_consumivel'
  | 'sem_efeito'
  | 'sem_pontos'
  | 'atributo_no_maximo'
  /** Marco 28 (D-127): o ponto passaria do teto nível + folga; o pergaminho não acha lugar para a criatura. */
  | 'atributo_acima_do_nivel'
  | 'sem_espaco'
  /** Marco 9A: interação, loja e baú. */
  | 'nada_perto'
  | 'congelado'
  | 'em_recarga'
  | 'loja_fechada'
  | 'fora_do_estoque'
  | 'sem_ouro'
  | 'nao_vendavel'
  | 'trancado'
  /** Ajuste de 16/10/2026 (D-067): loja com hostil perseguindo (o descanso saiu do jogo). */
  | 'em_perigo'
  /** Marco 10A-3: pergaminho de invocação acima do limite do modo (recusado antes de gastar). */
  | 'limite'
  /** Marco 14: livro de uma habilidade que o personagem já conhece. */
  | 'ja_conhece'
  /** Marco 18 (D-068): já há um estudo em andamento (o livro não é gasto). */
  | 'estudando'
  /** Marco 24 (D-094): livro de skill de outra classe. */
  | 'outra_classe'
  /** Marco 18 (D-070): a forja pede material que falta. */
  | 'sem_material'
  /** Marco 29 (D-128): a coleta levou dano durante o canal. */
  | 'interrompido'
  | 'sem_espaco_no_chao';

/** Marco 14: por que a habilidade não subiu de rank ou não foi para a barra. */
export type MotivoHabilidade =
  | 'usar_acelerador'
  | 'essencia_incompativel'
  | 'rank_desatualizado'
  | 'sem_ficha'
  | 'desconhecida'
  | 'nao_aprendivel'
  | 'rank_maximo'
  | 'sem_pontos'
  | 'nivel_baixo'
  | 'caminho_invalido'
  | 'tecla_invalida'
  | 'passiva'
  /** Marco 18 (D-068): já estuda outra habilidade; ou não há estudo para acelerar, ou acabaram as acelerações. */
  | 'estudando'
  | 'sem_estudo'
  | 'aceleracoes_esgotadas'
  /** Marco 18 (camada 7): fusão sem a runa, sem as duas no nível máximo, ou já tendo outra. */
  | 'fusao_runa'
  | 'fusao_niveis'
  | 'fusao_unica'
  /** Marco 24 (D-094): a tecla não aceita esse tipo (1–2 só de classe, 3–6 só gerais); a geral ainda não foi liberada
   *  por livro; a skill de classe não se aprende nem sobe com ponto (vem do livro e do nível). */
  | 'tecla_errada'
  | 'nao_liberada'
  | 'de_classe'
  /** Marco 24 (D-095): só passivas gerais se ligam; a troca é fora de combate e até o limite. */
  | 'nao_passiva'
  | 'em_combate'
  | 'limite_passivas';

export type MotivoCancelamento = 'morte' | 'interrompido' | 'alvo_invalido' | 'substituido';

export type EventoSimulacao =
  | { t: 'moveu'; tick: number; id: EntidadeId; x: number; y: number }
  | { t: 'caminhoFalhou'; tick: number; id: EntidadeId; status: Exclude<StatusCaminho, 'alcancado'> }
  | {
      t: 'acaoIniciada';
      raioCombo?: number;
      tick: number;
      acaoId: number;
      atorId: EntidadeId;
      habilidadeId: string;
      chave: string;
      /** Diagnóstico de balanceamento (18/10/2026): custos efetivamente cobrados, após afinidades. */
      custoMana?: number;
      custoVida?: number;
      alvoId: EntidadeId | null;
      alvoX: number;
      alvoY: number;
      inicioTick: number;
      lancamentoTick: number;
      impactoPrevistoTick: number;
    }
  | { t: 'acaoRecusada'; tick: number; atorId: EntidadeId; habilidadeId: string; motivo: MotivoRecusa }
  | { t: 'acaoCancelada'; tick: number; acaoId: number; atorId: EntidadeId; motivo: MotivoCancelamento }
  | { t: 'projetilLancado'; tick: number; projetilId: number; acaoId: number; donoId: EntidadeId; habilidadeId: string; chave: string }
  | { t: 'projetilFim'; tick: number; projetilId: number; motivo: 'acertou' | 'parede' | 'expirou' }
  // Marco 27 (29/10/2026, D-126): o solo amaldiçoado e a runa (combat/solos.ts).
  | { t: 'soloCriado'; tick: number; soloId: number; acaoId: number; donoId: EntidadeId; habilidadeId: string; chave: string; x: number; y: number; raio: number; forma: 'quadrado' | 'cone'; atrasoMs: number }
  | { t: 'soloPulsou'; tick: number; soloId: number; x: number; y: number; raio: number; atingidos: number }
  | { t: 'soloFim'; tick: number; soloId: number }
  /** Marco 28 (D-127): um marco do atributo de classe disparou (o render desenha pelas células). */
  | { t: 'marcoDeClasse'; tick: number; id: EntidadeId; marco: string; celulas: { x: number; y: number }[]; itemId?: string }
  | {
      t: 'impacto';
      tick: number;
      acaoId: number;
      fonteId: EntidadeId;
      alvoId: EntidadeId;
      habilidadeId: string;
      /** Marco 14: a chave compilada (o visual escala com o rank). */
      chave: string;
      dano: number;
      /** HP efetivamente retirado, sem excesso letal; dano mantém o valor histórico. */
      danoEfetivo?: number;
      /** Marco 24 (D-097): o golpe pegou pelas costas. */
      costas?: boolean;
      /** Absorção de escudo neste impacto, após esquiva/aparo. */
      absorvidoEscudo?: number;
      cura: number;
      d20: number;
      mult: number;
      falha: boolean;
      critico: boolean;
      imune: boolean;
      /** Ordem do alvo no impacto em área, para escalonar os números (§2.7). */
      indice: number;
      /** Marco 14: sinergias de elemento disparadas neste golpe (ids de interacoes.json). */
      sinergias: string[];
      /** Marco 23 (D-092): o alvo afim absorveu o elemento (a `cura` veio do golpe). */
      absorveu?: boolean;
    }
  | { t: 'esquivou'; tick: number; acaoId: number; atorId: EntidadeId; alvoId: EntidadeId }
  /** Marco 14: habilidade aprendida ou com rank novo (e o caminho escolhido, nos ranks de evolução). */
  | { t: 'habilidadeMudou'; tick: number; id: EntidadeId; habilidadeId: string; rank: number; caminho: string | null }
  | { t: 'habilidadeRecusada'; tick: number; id: EntidadeId; habilidadeId: string; motivo: MotivoHabilidade }
  /** Marco 24 (D-095): uma passiva geral ligada ou desligada. */
  | { t: 'passivaDefinida'; tick: number; id: EntidadeId; habilidadeId: string; ligada: boolean }
  // Marco 18 (D-068): o estudo de uma habilidade nova.
  | { t: 'estudoIniciado'; tick: number; id: EntidadeId; habilidadeId: string; totalTicks: number }
  /** Marco 24 (D-094): o livro de uma geral a liberou (aprender custa um ponto). */
  | { t: 'habilidadeLiberada'; tick: number; id: EntidadeId; habilidadeId: string }
  | { t: 'estudoAcelerado'; tick: number; id: EntidadeId; habilidadeId: string; restanteTicks: number }
  | { t: 'estudoConcluido'; tick: number; id: EntidadeId; habilidadeId: string }
  // Marco 18 (D-068, D-069): ressonância nova, combo feito e o renascer do item.
  | { t: 'ressonanciaAtiva'; tick: number; id: EntidadeId; ressonancia: string }
  | { t: 'comboFeito'; tick: number; id: EntidadeId; combo: string; alvoId: EntidadeId | null; x?: number; y?: number; origemX?: number; origemY?: number; atorX?: number; atorY?: number; miraX?: number; miraY?: number }
  | { t: 'buffInteragiu'; tick: number; id: EntidadeId; regra: string }
  // Marco 18 (D-070): missões, origens raras, forja e o diário.
  | { t: 'missaoConcluida'; tick: number; id: EntidadeId; missao: string; itemId: string }
  | { t: 'origemRara'; tick: number; id: EntidadeId; origem: string; itemId: string }
  | { t: 'forjou'; tick: number; id: EntidadeId; receita: string; itemId: string }
  // Marco 22 (D-089): o Mago trocou de encarnação; o Arqueiro disparou o tiro carregado.
  | { t: 'encarnou'; tick: number; id: EntidadeId; elemento: 'fogo' | 'gelo' | 'raio' | 'terra' | 'veneno' | 'trevas' | 'sagrado'; dupla?: string }
  | { t: 'tiroCarregado'; tick: number; id: EntidadeId }
  // Marco 24 (24/10/2026, D-094): o medidor da ultimate encheu, e a ultimate saiu (par de skills e o id dela).
  | { t: 'ultimateCheia'; tick: number; id: EntidadeId }
  | { t: 'ultimateUsada'; tick: number; id: EntidadeId; ultimateId: string; acaoId: number }
  /** Ajuste de 24/10/2026 (D-091): a encarnação do Mago venceu. */
  | { t: 'encarnacaoAcabou'; tick: number; id: EntidadeId }
  /** Marco 24 (D-096): uma sinergia passiva agiu (a passiva geral ligada mudou a skill). */
  | { t: 'sinergiaPassiva'; tick: number; id: EntidadeId; sinergia: string }
  /** Marco 22 (D-090): o morto do Necromante longe demais voltou para o lado dele. */
  | { t: 'invocacaoRetornou'; tick: number; id: EntidadeId; donoId: EntidadeId; deX: number; deY: number; x: number; y: number }
  /**
   * Marco 26 (29/10/2026, D-124): alguém foi deslocado por um efeito (puxão, empurrão, arremesso, avanço, teleporte ou
   * troca). Só apresentação: o desenho desliza o corpo e a assinatura da skill (a corrente que recolhe) usa a ação.
   */
  | { t: 'deslocado'; tick: number; id: EntidadeId; deX: number; deY: number; paraX: number; paraY: number; origemId: EntidadeId; causa: CausaDeslocamento; acaoId?: number }
  | { t: 'descoberta'; tick: number; id: EntidadeId; entrada: string }
  | { t: 'renasceu'; tick: number; id: EntidadeId; hp: number }
  | { t: 'barraMudou'; tick: number; id: EntidadeId }
  /** Marco 15: a dificuldade do mundo mudou. */
  | { t: 'dificuldadeMudou'; tick: number; nivel: Dificuldade }
  | { t: 'efeitoAplicado'; tick: number; alvoId: EntidadeId; origemId: EntidadeId; tipo: TipoEfeito; ateTick: number }
  /** Marco 8A-2: invocação, dominação e armadilhas. */
  | { t: 'invocou'; tick: number; donoId: EntidadeId; id: EntidadeId }
  | { t: 'dominou'; tick: number; donoId: EntidadeId; id: EntidadeId }
  /** Marco 10A-3: cura do curador, explosão da isca e dispensa. */
  | { t: 'invocacaoCurou'; tick: number; id: EntidadeId; donoId: EntidadeId; cura: number }
  | { t: 'explodiu'; tick: number; id: EntidadeId; x: number; y: number; raio: number }
  | { t: 'dispensou'; tick: number; id: EntidadeId; quantidade: number }
  | { t: 'armadilhaArmada'; tick: number; donoId: EntidadeId; armadilhaId: number; x: number; y: number }
  | { t: 'armadilhaDisparou'; tick: number; donoId: EntidadeId; armadilhaId: number; alvoId: EntidadeId; x?: number; y?: number }
  // Marco 18 (D-068): a Sabedoria revela e desarma armadilhas.
  | { t: 'armadilhaRevelada'; tick: number; id: EntidadeId; armadilhaId: number; x: number; y: number }
  | { t: 'armadilhaDesarmada'; tick: number; id: EntidadeId; armadilhaId: number; sucesso: boolean }
  /** Marco 8A: o que um efeito periódico ou instantâneo fez (números na tela). */
  | { t: 'efeitoResultado'; tick: number; alvoId: EntidadeId; origemId: EntidadeId; tipo: TipoEfeito; dano: number; cura: number; mana: number }
  | { t: 'morreu'; tick: number; id: EntidadeId; porId: EntidadeId | null }
  | { t: 'xpGanho'; tick: number; id: EntidadeId; xp: number }
  | { t: 'iaNotou'; tick: number; id: EntidadeId; alvoId: EntidadeId; hesitacaoAteTick: number }
  | { t: 'iaPerseguindo'; tick: number; id: EntidadeId; alvoId: EntidadeId }
  | { t: 'iaDesistiu'; tick: number; id: EntidadeId; alvoId: EntidadeId }
  | { t: 'objetoSurgiu'; tick: number; objetoId: string; tipo: TipoObjeto; x: number; y: number }
  /** Marco 26 (D-113): um quebrável quebrou (`forma` é o tipo do enfeite, para as lascas e o som). */
  | { t: 'quebrou'; tick: number; objetoId: string; forma: string; x: number; y: number; porId: EntidadeId }
  | { t: 'coletou'; tick: number; id: EntidadeId; objetoId: string; tipo: TipoObjeto; ganho: number; itemId: string | null }
  | { t: 'equipou'; tick: number; id: EntidadeId; itemId: string; slot: Slot }
  | { t: 'usouItem'; tick: number; id: EntidadeId; itemId: string; hp: number; mana: number }
  | { t: 'itemRecusado'; tick: number; id: EntidadeId; motivo: MotivoItem }
  /** Marco 24 (D-099): o santuário de Engenho entregou o kit. */
  | { t: 'santuarioUsado'; tick: number; id: EntidadeId; itemId: string }
  /** Marco 9A: baú e loja. `ateTick` é o fim do congelamento (anel de progresso, contagem da janela). */
  | { t: 'interacaoIniciada'; tick: number; id: EntidadeId; objetoId: string; tipo: 'bau' | 'loja' | 'desarme' | 'coleta'; ateTick: number }
  /** Marco 29 (D-128): o Mundo. O pedido vai ao servidor (salvar, portal, entrar na estrutura, o quadro de missões). */
  | { t: 'pedidoDoMundo'; tick: number; id: EntidadeId; tipo: string; ref: string }
  | { t: 'coletado'; tick: number; id: EntidadeId; objetoId: string; itemId: string; qtd: number }
  | { t: 'tumuloCriado'; tick: number; id: EntidadeId; objetoId: string; x: number; y: number; itens: number }
  | { t: 'tumuloAberto'; tick: number; id: EntidadeId; objetoId: string; itens: number }
  /** Marco 10A-2: penalidade de morte (§2.12). */
  | { t: 'penalidadeMorte'; tick: number; id: EntidadeId; xp: number; ouro: number; niveis: number }
  | { t: 'bauAberto'; tick: number; id: EntidadeId; objetoId: string; itens: string[]; ouro: number }
  /** D-067: `perigo` quando fechou porque um hostil começou a perseguir. */
  | { t: 'lojaFechada'; tick: number; id: EntidadeId; objetoId: string; recargaAteTick: number; perigo?: boolean }
  /** Ajuste de 16/10/2026 (D-067): buff ofensivo armado, ativado em combate ou vencido sem combate; refúgio usado. */
  | { t: 'buffArmado'; tick: number; id: EntidadeId; tipo: TipoEfeito; ateTick: number }
  | { t: 'buffAtivado'; tick: number; id: EntidadeId; tipo: TipoEfeito }
  | { t: 'buffExpirou'; tick: number; id: EntidadeId; tipo: TipoEfeito }
  | { t: 'refugioUsado'; tick: number; id: EntidadeId; ateTick: number }
  | { t: 'comprou'; tick: number; id: EntidadeId; itemId: string; preco: number }
  | { t: 'vendeu'; tick: number; id: EntidadeId; itemId: string; preco: number }
  /** Marco 10A-1: portas internas e porta de saída. */
  | { t: 'teleportou'; tick: number; id: EntidadeId; numero: number; x: number; y: number }
  | { t: 'saidaAlcancada'; tick: number; id: EntidadeId; retorno?: boolean }
  | { t: 'saidaTrancada'; tick: number; id: EntidadeId; motivo: 'chave' | 'boss' }
  | { t: 'saidaDestrancada'; tick: number; motivo: 'chave' | 'boss'; x: number; y: number }
  | { t: 'subiuNivel'; tick: number; id: EntidadeId; nivel: number }
  | { t: 'reviveu'; tick: number; id: EntidadeId }
  | { t: 'surgiu'; tick: number; id: EntidadeId };

/** Mapa evento -> payload para o `Barramento`. */
export type EventosDaSimulacao = { [E in EventoSimulacao as E['t']]: E };
