import { clonarEntidade } from '../entities/entidade';
import { velocidadeFrenesiPct } from './furia';
import { prepararSequencia, participaDeCombo } from './sequencias';
// O ciclo de uma ação (§2.7): intenção -> validação -> conjuração -> viagem -> impacto.
// Custo e recarga são pagos no início da conjuração. Durante a conjuração a ação fica telegrafada
// (ticks publicados no evento `acaoIniciada`) e pode ser interrompida sem devolver o custo.
// Contato e área consultam a geometria no tick do impacto: sair do alcance ou da área esquiva.
// Marco 14 (14/10/2026), D-059: a habilidade vem compilada pela chave do ator (rank, caminhos, modificadores;
// perfil.ts) e a ação guarda a chave. Alvos de suporte (aliado, aliados), formas novas (linha, cone, ao redor;
// formas.ts), custo em vida, saltos (saltos.ts) e o perfil da classe e das passivas (dano, alcance, custo,
// recarga).

import { atributosDeFormula, bonusDeEspecializacao, multiplicadorDeRolagem, perfilDestreza, potenciaDeEfeito, reducaoRecargaBasicoPct } from '../progression/efeitos-atributo';
import type { Celula, EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, novoId, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao, MotivoCancelamento, MotivoRecusa } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { fatoresDoMundo, ladoDoJogador } from '../modos/dificuldade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { bonusDeAtributo } from '../progression/ficha';
import { ordemRotativa } from '../world/colisao';
import { resolverHabilidade } from './compilar-habilidade';
import type { FonteDeDano } from './dano';
import { acaoBloqueada, aplicarEfeito, bonusAtaqueBasico, multiplicadorDanoCausado, REGISTRO_EFEITOS } from './efeitos';
import { excedeLimite } from './efeitos-fluxo';
import { alvosDaForma, celulasDaForma, celulasDaLinha, deSuporte, deslocaQuemConjura } from './formas';
import { muralhaEm } from './tatica';
import { quebrarEm } from './quebraveis';
import { celulaOcupada, chebyshev } from './geometria';
import { aplicarImpacto } from './golpe';
import type { Habilidade } from './habilidades';
import { rampaDeInvocacao } from './invocacoes';
import { chaveDoAtor, habilidadeDoAtor, perfilPara } from './perfil';
import { lancarProjetil } from './projeteis';
import { alcanceSemArma, aoUsarSkill, basicoComVariacao, basicoDaVez, chaveDoBasico, consumirRiposta, contarBasico, ehBasico, fatorDaVelocidade, multiplosDaVez, recargaDoBasicoPct } from './basico';
import { lancarSolo } from './solos';
import { celulaDoCompanheiro, ticksDoVooDoFalcao } from './companheiro';
import { encarnar } from './encarnacao';
import { consumirMira } from './mira';
import { prepararTiroCheio } from './sintonia-arqueiro';
import { raioAreaDaEncarnacao } from './encarnacao-efeitos';
import { quantidadeDeSaltos, saltar } from './saltos';
import { dispararGanchosDe, passivosDe } from '../progression/ganchos-do-portador';
import { comCombo, fazerCombo } from './combos';
import { dizimoErgue, podeErguerNoDizimo } from './necromancia';
import { agendarFase, fasesVencidas } from './fases';
import { virarPara } from './orientacao';
import { cargaDaClasse, medidorCheio, ultimateDe } from './carga-ultimate';
import { fatorDeDominio, fatorDeSkillDeClasse } from '../progression/dominio';
import { alcanceDoTiroCarregado } from './marcos-arqueiro';
import { ressonanciaArcana } from './marcos-mago';

export function chaveRecarga(entidadeId: EntidadeId, habilidadeId: string): string {
  return `${entidadeId}_${habilidadeId}`;
}

/**
 * O custo de conjurar agora (Marco 26, 29/10/2026: separado de `iniciarAcao` para o seguir alvo saber o que está pronto).
 * Marco 24 (D-096): a ressonância Eco ancestral deixa a próxima skill de classe sem custo de mana.
 */
export function custoDaHabilidade(ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade): { custoMana: number; custoVida: number; semMana: boolean } {
  const perfil = perfilPara(ctx, ator, hab);
  const semMana = !!ator.classeSemMana && !!ctx.conteudo.classes.get(ator.bolsa?.classeId ?? ator.classeId ?? '')?.exclusivas.includes(hab.id);
  return {
    custoMana: semMana ? 0 : Math.max(0, Math.round(hab.custoRecurso * (1 + perfil.custoPct / 100))),
    custoVida: Math.max(0, Math.round(hab.custoVida * (1 + perfil.custoPct / 100))),
    semMana,
  };
}

/** Custo em vida (marco 14): nunca mata quem conjura. */
export const podePagar = (ator: Entidade, custoMana: number, custoVida: number): boolean => ator.mana >= custoMana && !(custoVida > 0 && ator.hp <= custoVida);

/** Ticks até a habilidade sair de recarga (0 = pronta). */
export function recargaRestante(estado: EstadoJogo, entidadeId: EntidadeId, habilidadeId: string): number {
  return Math.max(0, (estado.recargas[chaveRecarga(entidadeId, habilidadeId)] ?? 0) - estado.tick);
}

export function fonteDe(e: Entidade, ctx: ContextoSimulacao, tick: number, hab: Habilidade): FonteDeDano {
  return {
    id: e.id,
    equipe: e.equipe,
    // Marco 18 (D-068): o bônus fixo segue o atributo da habilidade; a rolagem escala com Força e Inteligência.
    // Marco 28 (D-127): acima de 30, o ponto de atributo do jogador rende menos (atributosDeFormula).
    bonusAtributo: bonusDeAtributo(atributosDeFormula(e, ctx.balance), hab.escalaCom, ctx.balance.combate.multiplicadorAtributoPadrao) + (e.bolsa ? bonusDeEspecializacao(e.atributos, hab.escalaCom, ctx.balance) : 0),
    multRolagem: multiplicadorDeRolagem(atributosDeFormula(e, ctx.balance), ctx.balance, hab.escalaCom, hab.escalaRolagem),
    // Marco 18: a Inteligência e os passivos (Mente dupla) dão a potência dos efeitos.
    potencia: potenciaDeEfeito(e.atributos, ctx.balance) * (1 + passivosDe(ctx, e).potenciaPct / 100),
    carisma: e.atributos.carisma,
    // Marco 10A-3: a rampa da invocação multiplica junto com os efeitos (§2.9).
    // Marco 28 (D-127): o % de dano dos itens vale para básico, skill e ultimate.
    multDano: multiplicadorDanoCausado(e, tick) * rampaDeInvocacao(e, tick, ctx) * (1 + (e.danoItensPct ?? 0) / 100),
    multCura: 1,
  };
}

/** Marco 14: a fonte de uma habilidade: o rank e os caminhos (na compilação) e o perfil da classe e passivas. */
export function fonteDaHabilidade(e: Entidade, ctx: ContextoSimulacao, tick: number, hab: Habilidade): FonteDeDano {
  const f = fonteDe(e, ctx, tick, hab);
  const p = perfilPara(ctx, e, hab);
  // Marco 28 (D-127): o atributo de classe fortalece as skills de classe e as ultimates (dano, cura e potência).
  const classe = fatorDeSkillDeClasse(ctx, e, hab.id);
  return { ...f, potencia: f.potencia * classe, multDano: f.multDano * hab.multDano * (1 + p.danoPct / 100) * classe, multCura: hab.multCura * (1 + p.curaPct / 100) * classe };
}

/**
 * Marco 22 (23/10/2026, D-089): de onde a habilidade parte. As do Aventureiro (fora o ataque básico, a espada) saem
 * do falcão quando ele está em campo: o projétil nasce nele e a área "em volta" é em volta dele. O alcance continua
 * medido a partir do Aventureiro (quem joga não precisa calcular onde o pássaro está).
 */
export function origemDaHabilidade(estado: EstadoJogo, ator: Entidade, hab: Habilidade): Celula {
  // Ajuste de 24/10/2026 (D-091): o falcão tem alcance global. A habilidade sempre sai dele, esteja onde estiver; quem
  // decide se dá para usar é o alcance contado do Aventureiro. O projétil voa do falcão até o alvo (paredes o param).
  return (!ehBasico(ator, hab.id) ? celulaDoCompanheiro(estado, ator) : null) ?? celulaOcupada(ator);
}

/**
 * Marco 25 (25/10/2026, D-102): o golpe de contato que sai do falcão voa até o alvo — o impacto vem quando ele chega,
 * na velocidade de ataque do falcão (nível e Sabedoria). Devolve os ticks do voo (0: não é golpe do falcão).
 */
function vooDoGolpe(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, mira: Celula): number {
  if (hab.politicaImpacto !== 'contato' || hab.politicaAlvo !== 'hostil' || ehBasico(ator, hab.id)) return 0;
  const falcao = celulaDoCompanheiro(estado, ator);
  return falcao ? ticksDoVooDoFalcao(ctx, ator, falcao, mira) : 0;
}

/** Alcance com o perfil (marco 14) e o `ab_alcance` quando é o ataque básico (§2.8, marco 8A). */
export function alcanceDe(ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, tick: number): number {
  const basico = ehBasico(ator, hab.id) ? bonusAtaqueBasico(ator, tick).alcance : 0;
  // Marco 27 (D-126): sem o arco, o básico do Arqueiro perde o alcance característico.
  return Math.max(0, hab.alcanceCelulas + perfilPara(ctx, ator, hab).alcance + basico + alcanceSemArma(ctx, ator, hab));
}

/** Alvo ofensivo válido: vivo, visível e passível de dano pela relação do modo (§2.5). */
export function alvoOfensivoValido(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade): boolean {
  // Marco 24 (D-094): quem tem a marca do caçador de quem ataca não some para ele.
  const visivel = alvo.invisivelAteTick <= estado.tick || alvo.efeitos.some((f) => f.ateTick > estado.tick && f.origemId === ator.id && REGISTRO_EFEITOS[f.tipo].revela);
  // Marco 24 (25/10/2026, D-098): o falcão não atrai ninguém; só vira alvo de quem já está perseguindo.
  const falcaoFora = !!alvo.invocacao?.companheiro && ator.controlador === 'ia' && ator.ia?.modo !== 'perseguindo';
  return vivo(alvo) && visivel && !falcaoFora && podeFerir(ator, alvo, ctx.modo);
}

/** Marco 14: alvo de suporte válido: vivo e o próprio ou aliado, pela relação do modo. */
export function alvoDeSuporteValido(ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade): boolean {
  // Marco 22: o falcão divide a vida do dono; curá-lo não faria nada.
  return vivo(alvo) && !alvo.invocacao?.companheiro && podeAjudar(ator, alvo, ctx.modo);
}

function alvoValido(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade, hab: Habilidade): boolean {
  return deSuporte(hab) ? alvoDeSuporteValido(ctx, ator, alvo) : alvoOfensivoValido(estado, ctx, ator, alvo);
}

/** Avatar hostil vem antes de qualquer outro alvo (§2.9): é regra de alvo, não de hostilidade. */
export function prioridadeDeAlvo(e: Entidade): number {
  // Marco 22 (D-089): o falcão alheio só é escolhido sozinho quando não há outro alvo (golpeá-lo fere o dono).
  return e.invocacao?.avatar ? 0 : e.invocacao?.companheiro ? 2 : 1;
}

/** Auto-alvo (§4.7): hostil no alcance por Chebyshev; avatar primeiro, depois mais próximo, menor HP e id. */
export function autoAlvo(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  ator: Entidade,
  alcance: number,
  filtro: (e: Entidade) => boolean = () => true,
  origem: Celula = celulaOcupada(ator),
): Entidade | null {
  let melhor: Entidade | null = null;
  let melhorDist = Infinity;
  for (const e of estado.entidades) {
    if (e.id === ator.id || !alvoOfensivoValido(estado, ctx, ator, e) || !filtro(e)) continue;
    const d = chebyshev(origem, celulaOcupada(e));
    if (d > alcance) continue;
    const p = prioridadeDeAlvo(e);
    const pm = melhor ? prioridadeDeAlvo(melhor) : Infinity;
    const melhorQue =
      !melhor || p < pm || (p === pm && (d < melhorDist || (d === melhorDist && (e.hp < melhor.hp || (e.hp === melhor.hp && e.id < melhor.id)))));
    if (melhorQue) {
      melhor = e;
      melhorDist = d;
    }
  }
  return melhor;
}

/** Marco 14: o aliado (ou o próprio) no alcance com a menor fração de vida; empate pelo id. */
function aliadoMaisFerido(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alcance: number, origem: Celula): Entidade | null {
  let melhor: Entidade | null = null;
  for (const e of estado.entidades) {
    if (!alvoDeSuporteValido(ctx, ator, e) || chebyshev(origem, celulaOcupada(e)) > alcance) continue;
    const f = e.hp / Math.max(1, e.hpMax);
    const fm = melhor ? melhor.hp / Math.max(1, melhor.hpMax) : Infinity;
    if (!melhor || f < fm || (f === fm && e.id < melhor.id)) melhor = e;
  }
  return melhor;
}

function habilidadeDisponivel(ator: Entidade, id: string): boolean {
  return ehBasico(ator, id) || ator.habilidades.includes(id);
}

/**
 * Intenção + validação + início da conjuração. Retorna se a ação começou.
 * `alvoPedido`: id de entidade, célula (área) ou nada (alvo selecionado, depois auto-alvo).
 */
export function iniciarAcao(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  ator: Entidade,
  habilidadeId: string,
  alvoPedido: EntidadeId | Celula | undefined,
  saida: EventoSimulacao[],
  /** Marco 24 (D-094): a ultimate não fica na barra; quem chama já conferiu o par e o medidor. */
  ultimate = false,
): boolean {
  const recusar = (motivo: MotivoRecusa) => {
    saida.push({ t: 'acaoRecusada', tick: estado.tick, atorId: ator.id, habilidadeId, motivo });
    return false;
  };
  if (!vivo(ator)) return false;
  // Marco 27 (D-126): o 3º básico sai pela arma da mão secundária (quando o alvo está no alcance dela).
  if (!ultimate) {
    const pedido = habilidadeId;
    habilidadeId = basicoDaVez(estado, ctx, ator, pedido, alvoPedido, (id) => {
      const h = habilidadeDoAtor(ctx, ator, id, estado.tick);
      return h ? alcanceDe(ctx, ator, h, estado.tick) : null;
    });
  }
  const hab = ultimate || habilidadeDisponivel(ator, habilidadeId) ? habilidadeDoAtor(ctx, ator, habilidadeId, estado.tick) : undefined;
  // Passiva não se conjura (marco 14): vale enquanto conhecida.
  if (!hab || hab.passiva) return recusar('sem_habilidade');
  // Pedir uma habilidade durante a conjuração do ataque básico substitui o básico (D-020):
  // o automático nunca impede o jogador de usar habilidades.
  const substituiBasico = !!ator.acao && ehBasico(ator, ator.acao.habilidadeId) && !ehBasico(ator, habilidadeId);
  if (ator.acao && !substituiBasico) return recusar('ocupado');
  if (acaoBloqueada(ator, estado.tick, hab.tipoAtaque)) return recusar('bloqueado');
  if (recargaRestante(estado, ator.id, chaveDoBasico(ator, hab.id)) > 0) return recusar('recarga');
  const perfil = perfilPara(ctx, ator, hab);
  const { custoMana, custoVida, semMana } = custoDaHabilidade(ctx, ator, hab);
  if (!podePagar(ator, custoMana, custoVida)) return recusar('recurso');
  // Limites de invocação e armadilha do modo: recusa antes de cobrar (§5.6, marco 8A-2).
  if (excedeLimite(estado, ctx, ator, hab.efeitos)) return recusar('limite');

  const origem = celulaOcupada(ator);
  let alvo: Entidade | null = null;
  let celula: Celula | null = null;
  // Em volta de quem conjura (ao redor, aliados) não precisa de alvo: a área sai de onde ele está.
  if (hab.politicaAlvo === 'proprio' || hab.politicaAlvo === 'aliados' || hab.tipoArea === 'ao_redor') {
    alvo = ator;
  } else if (typeof alvoPedido === 'object') {
    celula = alvoPedido;
  } else {
    alvo = escolherAlvo(estado, ctx, ator, hab, alvoPedido, origem);
  }
  if (!alvo && !celula) return recusar('sem_alvo');
  // Marco 22: o alvo de uma habilidade do Aventureiro vira o selecionado, e o falcão voa até ele.
  if (alvo && alvo !== ator && !deSuporte(hab) && celulaDoCompanheiro(estado, ator)) ator.alvoSelecionado = alvo.id;
  // Marco 24: a regra do ritual é do Dízimo; a ultimate que drena sai mesmo com a vida cheia.
  if (!ultimate && hab.efeitos.some((ef) => ef.tipo === 'drenar_invocacao')) {
    // Marco 22 (D-090): sem morto ao alcance, o Dízimo ergue um (se houver vaga) em vez de drenar.
    if (dizimoErgue(estado, ctx, ator)) {
      if (!podeErguerNoDizimo(estado, ctx, ator)) return recusar('sem_invocacao');
    } else if (ator.hp >= ator.hpMax) return recusar('vida_cheia');
  }
  // Em volta de quem conjura (ao redor, aliados): a mira é a própria célula.
  let mira = hab.tipoArea === 'ao_redor' ? origem : (celula ?? celulaOcupada(alvo as Entidade));
  const alcance = alcanceDe(ctx, ator, hab, estado.tick);
  if (chebyshev(origem, mira) > alcance) {
    // Marco 26 (28/10/2026, D-119): o alvo longe demais dá lugar ao mais próximo no alcance (hostil ou, no suporte,
    // o aliado mais ferido); só a mira numa célula continua sendo recusada.
    const perto = !celula && alvo && alvo !== ator && ator.controlador !== 'ia' ? (deSuporte(hab) ? aliadoMaisFerido(estado, ctx, ator, alcance, origem) : autoAlvo(estado, ctx, ator, alcance, undefined, origem)) : null;
    if (!perto) return recusar('fora_de_alcance');
    alvo = perto;
    mira = celulaOcupada(perto);
    if (!deSuporte(hab)) ator.alvoSelecionado = perto.id;
  }

  if (substituiBasico) cancelar(ator, estado, 'substituido', saida);
  // Marco 24 (D-097): quem ataca olha para o alvo (decide o "pelas costas" de quem bate nele).
  if (mira.x !== origem.x || mira.y !== origem.y) virarPara(ator, mira);
  // Conjuração (§2.7, etapa 3): custo e recarga descontados aqui, com recarga monotônica.
  ator.mana -= custoMana;
  ator.hp -= custoVida;
  if (semMana) delete ator.classeSemMana;
  if (hab.recargaMs > 0) {
    // Marco 27 (D-126): o básico das duas mãos divide a recarga do automático.
    const chave = chaveRecarga(ator.id, chaveDoBasico(ator, hab.id));
    // `ab_recarga` encurta a recarga do ataque básico (até 75%); o perfil, a de qualquer habilidade.
    // Marco 17: a Destreza acima de 10 também encurta o básico (somada ao `ab_recarga`, dentro do mesmo teto).
    // Marco 18: o teto passa a 75% só somando buff; a Destreza do arqueiro chega a 50% sozinha.
    // Marco 27 (D-126): sem o arco, o Arqueiro perde parte da cadência da Destreza; o arco de outra classe é lento.
    const reducao = ehBasico(ator, hab.id) ? Math.min(75, bonusAtaqueBasico(ator, estado.tick).recargaPct + reducaoRecargaBasicoPct(ator.atributos, ctx.balance, perfilDestreza(ctx, ator)) * fatorDaVelocidade(ctx, ator) + velocidadeFrenesiPct(ctx, ator, estado.tick)) : 0;
    const ms = hab.recargaMs * (1 - reducao / 100) * (1 + perfil.recargaPct / 100) * (1 + recargaDoBasicoPct(ctx, ator, hab) / 100);
    estado.recargas[chave] = Math.max(estado.recargas[chave] ?? 0, estado.tick + ticksDe(ms));
  }
  // Marco 15: na dificuldade fácil, os golpes de quem não é do lado do jogador avisam mais cedo.
  const avisoExtra = ladoDoJogador(estado, ator) ? 0 : fatoresDoMundo(estado, ctx).avisoExtraMs;
  const lancamentoTick = estado.tick + ticksDe(hab.conjuracaoMs + avisoExtra);
  const viagem =
    hab.politicaImpacto === 'projetil' ? ticksDe((Math.hypot(mira.x - origem.x, mira.y - origem.y) / hab.velocidadeProjetil) * 1000) : vooDoGolpe(estado, ctx, ator, hab, mira);
  const alvoId = hab.politicaImpacto === 'area' ? null : (alvo?.id ?? null);
  ator.acao = {
    acaoId: novoId(estado),
    habilidadeId: hab.id,
    chave: hab.chave,
    alvoId,
    alvoX: mira.x,
    alvoY: mira.y,
    inicioTick: estado.tick,
    lancamentoTick,
    impactoPrevistoTick: lancamentoTick + viagem,
  };
  if (!ehBasico(ator, hab.id) && participaDeCombo(ctx, ator, hab.id)) {
    const previa = prepararSequencia(estado, ctx, clonarEntidade(ator), hab, ator.acao.acaoId, alvo, mira);
    if (previa.raioArea !== hab.raioArea) ator.acao.raioCombo = previa.raioArea;
  }
  // Diagnóstico (18/10/2026): registra o custo real, inclusive de ações canceladas depois da cobrança.
  saida.push({ t: 'acaoIniciada', tick: estado.tick, atorId: ator.id, ...ator.acao, custoMana, custoVida });
  return true;
}

function escolherAlvo(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  ator: Entidade,
  hab: Habilidade,
  pedido: EntidadeId | undefined,
  origem: Celula,
): Entidade | null {
  const alcance = alcanceDe(ctx, ator, hab, estado.tick);
  if (pedido) {
    // O pedido explícito vale mesmo fora do alcance (a validação recusa).
    const e = buscarEntidade(estado, pedido);
    if (e && alvoValido(estado, ctx, ator, e, hab)) return e;
  }
  if (deSuporte(hab)) return aliadoMaisFerido(estado, ctx, ator, alcance, origem);
  // Ajuste de 15/10/2026 (D-065): travado, a habilidade vai no travado mesmo fora do alcance (a validação recusa),
  // nunca em outro; destravado, o hostil escolhido pelo auto-alvo passa a ser o selecionado (o anel acompanha).
  const atual = alvoAtual(estado, ctx, ator);
  if (atual && (ator.alvoTravado || chebyshev(origem, celulaOcupada(atual)) <= alcance)) return atual;
  if (ator.alvoTravado && ator.alvoSelecionado) return null;
  const novo = autoAlvo(estado, ctx, ator, alcance, undefined, origem);
  if (novo) ator.alvoSelecionado = novo.id;
  return novo;
}

function cancelar(ator: Entidade, estado: EstadoJogo, motivo: MotivoCancelamento, saida: EventoSimulacao[]): void {
  if (!ator.acao) return;
  saida.push({ t: 'acaoCancelada', tick: estado.tick, acaoId: ator.acao.acaoId, atorId: ator.id, motivo });
  ator.acao = null;
}

/**
 * Marco 24 (24/10/2026, D-094): as fases que vencem saem antes das conjurações — a habilidade da fase no alvo guardado
 * (ou na célula, se ele morreu ou é de área), sem custo, recarga, combo nem ganchos de uso.
 */
function processarFases(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  for (const f of fasesVencidas(estado)) {
    const ator = buscarEntidade(estado, f.atorId);
    const hab = ator && vivo(ator) ? resolverHabilidade(ctx, f.chave) : undefined;
    if (!ator || !hab) continue;
    const alvo = f.alvoId === null ? null : buscarEntidade(estado, f.alvoId);
    const valido = alvo && vivo(alvo) ? alvo : null;
    const mira = valido && hab.politicaImpacto !== 'area' ? celulaOcupada(valido) : { x: f.x, y: f.y };
    // Marco 25 (D-102): o golpe do falcão que chegou ao alvo é o lançamento completo da ação (só adiado).
    if (f.acaoId !== undefined) lancar(estado, ctx, ator, hab, f.acaoId, mira, valido, saida, false, true);
    else lancar(estado, ctx, ator, hab, novoId(estado), mira, valido, saida, true);
  }
}

/** Etapa 3 do tick: conjurações em curso — interrupção e lançamento. */
export function processarAcoes(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  processarFases(estado, ctx, saida);
  for (const ator of ordemRotativa(estado.entidades, estado.tick)) {
    const a = ator.acao;
    if (!a) continue;
    const hab = resolverHabilidade(ctx, a.chave);
    if (!hab || !vivo(ator)) {
      cancelar(ator, estado, 'morte', saida);
      continue;
    }
    if (hab.interrupcao === 'interrompivel' && acaoBloqueada(ator, estado.tick, hab.tipoAtaque)) {
      cancelar(ator, estado, 'interrompido', saida);
      continue;
    }
    const alvo = a.alvoId === null ? null : buscarEntidade(estado, a.alvoId);
    if (a.alvoId !== null && a.alvoId !== ator.id && (!alvo || !alvoValido(estado, ctx, ator, alvo, hab))) {
      cancelar(ator, estado, 'alvo_invalido', saida);
      continue;
    }
    if (estado.tick < a.lancamentoTick) continue;
    ator.acao = null;
    // Marco 25 (D-102): o golpe do falcão sai quando ele chega ao alvo; o dono já fica livre.
    if (hab.politicaImpacto === 'contato' && a.impactoPrevistoTick > a.lancamentoTick) {
      (estado.fases ??= []).push({ atorId: ator.id, chave: a.chave, alvoId: a.alvoId, x: a.alvoX, y: a.alvoY, tick: a.impactoPrevistoTick, acaoId: a.acaoId });
      continue;
    }
    lancar(estado, ctx, ator, hab, a.acaoId, { x: a.alvoX, y: a.alvoY }, alvo ?? null, saida);
  }
}

function lancar(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  ator: Entidade,
  habilidadeBase: Habilidade,
  acaoId: number,
  mira: Celula,
  alvo: Entidade | null,
  saida: EventoSimulacao[],
  /** Marco 24: lançada por uma fase (sem combo, ganchos de uso nem encarnação). */
  daFase = false,
  /** Marco 25 (D-102): o golpe do falcão que chegou ao alvo — o alcance já valeu na conjuração; o dono pode ter andado. */
  falcaoChegou = false,
): void {
  // Marco 27 (D-126): o básico com a variação da arma (o giro do Montante, o elemento emprestado do tomo).
  const hab = daFase ? habilidadeBase : basicoComVariacao(estado, ator, prepararSequencia(estado, ctx, ator, habilidadeBase, acaoId, alvo, mira));
  const multiplos = multiplosDaVez(ator, hab);
  if (!daFase) contarBasico(ator, hab.id);
  if (hab.formulaDano) ator.efeitos = ator.efeitos.filter((f) => f.tipo !== 'veu_noturno');
  // Marco 18 (D-068, D-069): o combo (a habilidade anterior em até a janela) fortalece esta; os ganchos "ao usar"
  // disparam; e esta vira a última.
  let fonte = daFase ? fonteDaHabilidade(ator, ctx, estado.tick, hab) : comCombo(fonteDaHabilidade(ator, ctx, estado.tick, hab), fazerCombo(estado, ctx, ator, hab, alvo, mira, saida, false));
  // Marco 24 (D-095): o crítico garantido (Presságio) sai no próximo golpe; a sobrecarga sai na magia que fortaleceu.
  if (hab.formulaDano) {
    const tick = estado.tick;
    if (ator.efeitos.some((f) => f.ateTick > tick && REGISTRO_EFEITOS[f.tipo].criticoGarantido)) fonte = { ...fonte, d20Minimo: 20 };
    // Marco 27 (D-126): a riposta da Rapieira (levou um golpe há pouco) deixa o básico crítico.
    if (consumirRiposta(estado, ator, hab)) fonte = { ...fonte, d20Minimo: 20 };
    ator.efeitos = ator.efeitos.filter((f) => !(REGISTRO_EFEITOS[f.tipo].criticoGarantido || REGISTRO_EFEITOS[f.tipo].someAoLancar === hab.tipoAtaque));
  }
  if (!daFase) {
    dispararGanchosDe(estado, ctx, ator, 'aoUsarHabilidade', { outro: alvo, hab }, saida);
    // Marco 24 (D-096): a anterior fica para as sinergias de sequência.
    if (ator.ultimaHabilidade) ator.habilidadeAnterior = { id: ator.ultimaHabilidade.id, tick: ator.ultimaHabilidade.tick };
    ator.ultimaHabilidade = { id: hab.id, chave: hab.chave, tick: estado.tick, alvoId: alvo?.id ?? null };
    // Marco 27 (D-126): o tomo de outra classe deixa o próximo básico com o elemento da skill.
    aoUsarSkill(estado, ctx, ator, hab);
    // Marco 22 (D-089): a magia de fogo, gelo ou raio troca a encarnação do Mago.
    const encarnadoAntes = ator.encarnacao;
    if (encarnar(ctx, ator, hab, estado.tick)) {
      // Marco 28 (D-127): a Ressonância do Arcano explode na troca de encarnação.
      if (encarnadoAntes) ressonanciaArcana(estado, ctx, ator, encarnadoAntes, hab, fonte, acaoId, saida);
      saida.push({ t: 'encarnou', tick: estado.tick, id: ator.id, elemento: ator.encarnacao ?? 'fogo', ...(ator.encarnacaoDupla && { dupla: ator.encarnacaoDupla }) });
      // Marco 24 (D-094): trocar de encarnação enche a ultimate (no máximo uma vez a cada 4 s).
      cargaDaClasse(ctx, ator, 'encarnacao', estado.tick, saida);
    }
  }
  const basico = ehBasico(ator, hab.id) ? bonusAtaqueBasico(ator, estado.tick) : null;
  const alcance = alcanceDe(ctx, ator, hab, estado.tick);
  const base = { acaoId, fonte, hab, mira, ...(basico && basico.dano > 0 && { danoExtra: basico.dano }) };
  // Marco 26 (29/10/2026, D-125): a célula de onde a habilidade sai, antes de quem conjura avançar.
  const partida = origemDaHabilidade(estado, ator, hab);
  // Efeitos de lançamento (armadilha, invocação): uma vez, sobre quem conjura, na célula mirada. D-125: o avanço e o
  // teleporte de quem conjura também (antes, só saíam a cada alvo atingido: sem ninguém na linha, nada de avanço).
  for (const ef of hab.efeitos) {
    const desloca = ef.em === 'conjurador' && REGISTRO_EFEITOS[ef.tipo].deslocaConjurador;
    if (!REGISTRO_EFEITOS[ef.tipo].aoLancar && !desloca) continue;
    // Marco 24: a fase guarda o alvo da ação (o resto do lançamento cai em quem conjura, na célula mirada).
    // `em: conjurador` guarda a célula de onde quem lançou saiu (o eco do Piscar); a fase herda as variantes de agora.
    if (REGISTRO_EFEITOS[ef.tipo].fluxo === 'fase' && ef.ref) agendarFase(estado, ator, chaveDoAtor(ctx, ator, ef.ref, estado.tick), ef.em === 'conjurador' ? celulaOcupada(ator) : (alvo ?? mira), ef.duracaoMs);
    // D-125: quem avança sobre um alvo vai até onde ele está agora (ele pode ter andado durante a conjuração).
    else aplicarEfeito(estado, ctx, ator, ef, { id: ator.id, x: ator.x, y: ator.y, ...(desloca && { acaoId }) }, desloca && alvo && alvo !== ator && vivo(alvo) ? celulaOcupada(alvo) : mira, saida);
  }
  // Marco 27 (D-126): o solo amaldiçoado (Necromante) e a runa (Mago) caem sob o alvo e pulsam (combat/solos.ts).
  if (hab.variacao?.solo) {
    lancarSolo(estado, ator, hab, acaoId, fonte, alvo, mira, saida);
    return;
  }
  // Marco 27 (D-126): o tiro carregado do Arqueiro por uma arma corpo a corpo vira uma linha com o alcance multiplicado,
  // que atravessa todos com o crítico garantido (a passiva da classe vale em qualquer arma).
  if (basico && !daFase && alvo && alvo !== ator && hab.politicaImpacto !== 'projetil' && consumirMira(ctx, ator, estado.tick)) {
    saida.push({ t: 'tiroCarregado', tick: estado.tick, id: ator.id });
    cargaDaClasse(ctx, ator, 'miraFirme', estado.tick, saida);
    const cheia = { ...fonte, d20Minimo: Math.max(fonte.d20Minimo ?? 0, ctx.balance.ajustesClasses.arqueiro.mira.d20Minimo) };
    const linha = celulasDaLinha(partida, celulaOcupada(alvo), Math.round(alcanceCarregado(ctx, ator, alcance) * ctx.balance.armas.carregadoAlcanceMult), ctx.fase);
    alvosDaForma(estado, ctx, ator, hab, linha).forEach((e, indice) => {
      aplicarImpacto(estado, ctx, e, { ...base, fonte: cheia, indice, secundario: indice > 0 }, saida);
    });
    return;
  }
  switch (hab.politicaImpacto) {
    case 'proprio':
      aplicarImpacto(estado, ctx, ator, { ...base, indice: 0 }, saida);
      break;
    case 'contato': {
      // Marco 26 (D-113): o golpe mirado numa célula (sem alvo) quebra o que houver nela.
      if (!alvo) {
        quebrarEm(estado, ctx, [mira], ator, saida);
        break;
      }
      const origem = celulaOcupada(ator);
      if (!falcaoChegou && chebyshev(origem, celulaOcupada(alvo)) > alcance) {
        saida.push({ t: 'esquivou', tick: estado.tick, acaoId, atorId: ator.id, alvoId: alvo.id });
        break;
      }
      const saltos = quantidadeDeSaltos(hab, alvo, estado.tick, ator, ctx);
      aplicarImpacto(estado, ctx, alvo, { ...base, indice: 0 }, saida);
      const atingidos = [alvo.id];
      // `ab_multi_alvo` (§2.8): alvos adicionais no alcance, os mais próximos primeiro.
      const extras = basico?.alvosExtras ?? 0;
      if (extras > 0) {
        const perto = (e: Entidade) => chebyshev(origem, celulaOcupada(e));
        estado.entidades
          .filter((e) => e.id !== alvo.id && alvoOfensivoValido(estado, ctx, ator, e) && perto(e) <= alcance)
          .sort((a, b) => perto(a) - perto(b) || (a.id < b.id ? -1 : 1))
          .slice(0, extras)
          .forEach((e, i) => {
            aplicarImpacto(estado, ctx, e, { ...base, indice: i + 1 }, saida);
            atingidos.push(e.id);
          });
      }
      if (saltos > 0) saltar(estado, ctx, ator, hab, alvo, saltos, base, atingidos, saida);
      break;
    }
    case 'area': {
      // Marco 24 (D-095): o Mago encarnado em terra alcança +1 de raio nas magias de área.
      // D-125: a investida acerta a trajetória toda, a partir de onde saiu, passando pelas paredes como o dash.
      const atravessa = ctx.balance.movimento.dashAtravessaParedes && deslocaQuemConjura(hab);
      const barreira = atravessa ? (c: Celula) => c.x < 0 || c.y < 0 || c.x >= ctx.fase.largura || c.y >= ctx.fase.altura || !!muralhaEm(estado, c.x, c.y) : undefined;
      const celulas = celulasDaForma(raioAreaDaEncarnacao(ctx, ator, hab, estado.tick), partida, mira, ctx.fase, barreira);
      const atingidos = alvosDaForma(estado, ctx, ator, hab, celulas);
      // Marco 26 (D-113): a área quebra os quebráveis que pega.
      if (!deSuporte(hab)) quebrarEm(estado, ctx, celulas, ator, saida);
      const principal = [...atingidos].sort((a, b) => chebyshev(celulaOcupada(a), mira) - chebyshev(celulaOcupada(b), mira) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
      atingidos.forEach((e, indice) => {
        aplicarImpacto(estado, ctx, e, { ...base, indice, secundario: e !== principal }, saida);
      });
      break;
    }
    case 'projetil': {
      // Mira na célula do alvo no lançamento; daí em diante segue em linha reta e pode ser esquivado.
      // Marco 22 (D-089): com a Mira firme cheia, o tiro sai carregado (crítico garantido, atravessa, alcance máximo).
      const carregado = consumirMira(ctx, ator, estado.tick);
      if (carregado) {
        saida.push({ t: 'tiroCarregado', tick: estado.tick, id: ator.id });
        cargaDaClasse(ctx, ator, 'miraFirme', estado.tick, saida);
      }
      const fonteTiro = carregado ? { ...fonte, d20Minimo: Math.max(fonte.d20Minimo ?? 0, ctx.balance.ajustesClasses.arqueiro.mira.d20Minimo) } : fonte;
      // Marco 27 (D-126): a variação pode lançar vários (leque, salva, imagem); cada um leva o que vale para o tiro.
      const tiros = lancarProjetil(estado, ator, hab, acaoId, fonteTiro, alvo ? celulaOcupada(alvo) : mira, saida, origemDaHabilidade(estado, ator, hab), carregado ? { alcance: alcanceCarregado(ctx, ator, alcance) } : null, multiplos);
      // Marco 24 (D-096): a ressonância Engenhoso faz o projétil mágico atravessar.
      const atravessa = hab.tipoAtaque === 'magico' && ator.bolsa ? passivosDe(ctx, ator).atravessaMagico : 0;
      for (const tiro of tiros) {
        // Marco 24 (D-095): a sintonia do Arqueiro marca o tiro cheio (mágico, ricochetes, invisível).
        if (carregado) prepararTiroCheio(ctx, ator, tiro, estado.tick);
        if (atravessa > 0) tiro.perfuraExtra = atravessa;
      }
      break;
    }
  }
}

/**
 * Ataque básico automático (§2.7): a cada 250 ms, contra o alvo selecionado no alcance ou, sem
 * seleção, contra o hostil mais próximo que esteja perseguindo o atacante.
 * Ajuste de 15/10/2026 (D-065): o alvo escolhido fica selecionado (não troca a cada golpe); travado, só ele —
 * fora do alcance, o automático espera em vez de bater em outro.
 */
export function processarAutoAtaque(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  if (estado.tick % Math.max(1, ticksDe(ctx.balance.combate.autoAtaqueMs)) !== 0) return;
  for (const ator of ordemRotativa(estado.entidades, estado.tick)) {
    if (!ator.autoAtaque || !vivo(ator) || ator.acao) continue;
    const hab = habilidadeDoAtor(ctx, ator, ator.ataqueBasico);
    if (!hab || recargaRestante(estado, ator.id, hab.id) > 0 || acaoBloqueada(ator, estado.tick, hab.tipoAtaque)) {
      continue;
    }
    const alcance = alcanceDe(ctx, ator, hab, estado.tick);
    const atual = alvoAtual(estado, ctx, ator);
    const noAlcance = !!atual && chebyshev(celulaOcupada(ator), celulaOcupada(atual)) <= alcance;
    if (ator.alvoTravado && ator.alvoSelecionado) {
      if (atual && noAlcance) iniciarAcao(estado, ctx, ator, hab.id, atual.id, saida);
      continue;
    }
    const alvo = atual && noAlcance ? atual : autoAlvo(estado, ctx, ator, alcance, (e) => e.ia?.modo === 'perseguindo' && e.ia.alvoId === ator.id);
    if (!alvo) continue;
    ator.alvoSelecionado = alvo.id;
    iniciarAcao(estado, ctx, ator, hab.id, alvo.id, saida);
  }
}

/**
 * Ajuste de 15/10/2026 (D-065): o alvo selecionado, se ainda dá para atacá-lo. Morto ou fora do estado, a seleção e a
 * trava se desfazem; invisível, a seleção fica (travado, quem ataca espera a furtividade acabar).
 */
export function alvoAtual(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade): Entidade | null {
  if (!ator.alvoSelecionado) return null;
  const e = buscarEntidade(estado, ator.alvoSelecionado);
  if (!e || !vivo(e) || !podeFerir(ator, e, ctx.modo)) {
    ator.alvoSelecionado = null;
    ator.alvoTravado = false;
    return null;
  }
  return alvoOfensivoValido(estado, ctx, ator, e) ? e : null;
}

/**
 * Ajuste de 15/10/2026 (D-065): o hostil seguinte (ou o anterior) ao atual para a troca manual de alvo — os válidos
 * por `relacao()` até `raio` células, avatar primeiro, depois por distância e id; dá a volta na lista.
 */
export function proximoHostil(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  ator: Entidade,
  atualId: EntidadeId | null,
  sentido: 1 | -1,
  raio: number,
): Entidade | null {
  const origem = celulaOcupada(ator);
  const lista = estado.entidades
    .filter((e) => e.id !== ator.id && alvoOfensivoValido(estado, ctx, ator, e) && chebyshev(origem, celulaOcupada(e)) <= raio)
    .map((e) => ({ e, p: prioridadeDeAlvo(e), d: chebyshev(origem, celulaOcupada(e)) }))
    .sort((a, b) => a.p - b.p || a.d - b.d || (a.e.id < b.e.id ? -1 : a.e.id > b.e.id ? 1 : 0))
    .map((x) => x.e);
  if (lista.length === 0) return null;
  const i = atualId ? lista.findIndex((e) => e.id === atualId) : -1;
  if (i < 0) return sentido === 1 ? (lista[0] ?? null) : (lista[lista.length - 1] ?? null);
  return lista[(i + sentido + lista.length) % lista.length] ?? null;
}

/**
 * Marco 24 (24/10/2026, D-094): a ultimate do par nas teclas 1 e 2. Recusada sem par ou com o medidor abaixo do
 * máximo; no mais, segue as regras de qualquer habilidade (alvo, alcance, ocupado). Começar zera o medidor.
 */
export function usarUltimate(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alvo: EntidadeId | Celula | undefined, saida: EventoSimulacao[]): boolean {
  const u = ultimateDe(ctx, ator);
  const recusa = !u ? 'sem_ultimate' : !medidorCheio(ctx, ator) ? 'sem_carga' : null;
  if (recusa || !u) {
    saida.push({ t: 'acaoRecusada', tick: estado.tick, atorId: ator.id, habilidadeId: u?.id ?? '', motivo: recusa ?? 'sem_ultimate' });
    return false;
  }
  if (!iniciarAcao(estado, ctx, ator, u.id, alvo, saida, true) || !ator.acao) return false;
  ator.cargaUltimate = 0;
  saida.push({ t: 'ultimateUsada', tick: estado.tick, id: ator.id, ultimateId: u.id, acaoId: ator.acao.acaoId });
  return true;
}

/** Marco 28 (D-127): o alcance do tiro carregado com o Instinto (por ponto e a Tempestade de aço). */
function alcanceCarregado(ctx: ContextoSimulacao, ator: Entidade, alcance: number): number {
  return alcanceDoTiroCarregado(ctx, ator, alcance * fatorDeDominio(ctx, ator, 'alcanceCarregado'));
}
