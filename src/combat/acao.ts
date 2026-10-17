// O ciclo de uma ação (§2.7): intenção -> validação -> conjuração -> viagem -> impacto.
// Custo e recarga são pagos no início da conjuração. Durante a conjuração a ação fica telegrafada
// (ticks publicados no evento `acaoIniciada`) e pode ser interrompida sem devolver o custo.
// Contato e área consultam a geometria no tick do impacto: sair do alcance ou da área esquiva.
// Marco 14 (14/10/2026), D-059: a habilidade vem compilada pela chave do ator (rank, caminhos, modificadores;
// perfil.ts) e a ação guarda a chave. Alvos de suporte (aliado, aliados), formas novas (linha, cone, ao redor;
// formas.ts), custo em vida, saltos (saltos.ts) e o perfil da classe e das passivas (dano, alcance, custo,
// recarga).

import { bonusDeEspecializacao, multiplicadorDeRolagem, perfilDestreza, potenciaDeEfeito, reducaoRecargaBasicoPct } from '../progression/efeitos-atributo';
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
import { alvosDaForma, celulasDaForma, deSuporte } from './formas';
import { celulaOcupada, chebyshev } from './geometria';
import { aplicarImpacto } from './golpe';
import type { Habilidade } from './habilidades';
import { rampaDeInvocacao } from './invocacoes';
import { habilidadeDoAtor, perfilPara } from './perfil';
import { lancarProjetil } from './projeteis';
import { quantidadeDeSaltos, saltar } from './saltos';
import { dispararGanchosDe, passivosDe } from '../progression/ganchos-do-portador';
import { comCombo, fazerCombo } from './combos';

export function chaveRecarga(entidadeId: EntidadeId, habilidadeId: string): string {
  return `${entidadeId}_${habilidadeId}`;
}

/** Ticks até a habilidade sair de recarga (0 = pronta). */
export function recargaRestante(estado: EstadoJogo, entidadeId: EntidadeId, habilidadeId: string): number {
  return Math.max(0, (estado.recargas[chaveRecarga(entidadeId, habilidadeId)] ?? 0) - estado.tick);
}

export function fonteDe(e: Entidade, ctx: ContextoSimulacao, tick: number, hab: Habilidade): FonteDeDano {
  return {
    id: e.id,
    equipe: e.equipe,
    // Marco 18 (D-068): o bônus fixo segue o atributo da habilidade; a rolagem escala com Força e Inteligência.
    bonusAtributo: bonusDeAtributo(e.atributos, hab.escalaCom, ctx.balance.combate.multiplicadorAtributoPadrao) + (e.bolsa ? bonusDeEspecializacao(e.atributos, hab.escalaCom, ctx.balance) : 0),
    multRolagem: multiplicadorDeRolagem(e.atributos, ctx.balance),
    // Marco 18: a Inteligência e os passivos (Mente dupla) dão a potência dos efeitos.
    potencia: potenciaDeEfeito(e.atributos, ctx.balance) * (1 + passivosDe(ctx, e).potenciaPct / 100),
    carisma: e.atributos.carisma,
    // Marco 10A-3: a rampa da invocação multiplica junto com os efeitos (§2.9).
    multDano: multiplicadorDanoCausado(e, tick) * rampaDeInvocacao(e, tick, ctx),
    multCura: 1,
  };
}

/** Marco 14: a fonte de uma habilidade: o rank e os caminhos (na compilação) e o perfil da classe e passivas. */
export function fonteDaHabilidade(e: Entidade, ctx: ContextoSimulacao, tick: number, hab: Habilidade): FonteDeDano {
  const f = fonteDe(e, ctx, tick, hab);
  const p = perfilPara(ctx, e, hab);
  return { ...f, multDano: f.multDano * hab.multDano * (1 + p.danoPct / 100), multCura: hab.multCura * (1 + p.curaPct / 100) };
}

/** Alcance com o perfil (marco 14) e o `ab_alcance` quando é o ataque básico (§2.8, marco 8A). */
export function alcanceDe(ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, tick: number): number {
  const basico = hab.id === ator.ataqueBasico ? bonusAtaqueBasico(ator, tick).alcance : 0;
  return Math.max(0, hab.alcanceCelulas + perfilPara(ctx, ator, hab).alcance + basico);
}

/** Alvo ofensivo válido: vivo, visível e passível de dano pela relação do modo (§2.5). */
export function alvoOfensivoValido(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade): boolean {
  return vivo(alvo) && alvo.invisivelAteTick <= estado.tick && podeFerir(ator, alvo, ctx.modo);
}

/** Marco 14: alvo de suporte válido: vivo e o próprio ou aliado, pela relação do modo. */
export function alvoDeSuporteValido(ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade): boolean {
  return vivo(alvo) && podeAjudar(ator, alvo, ctx.modo);
}

function alvoValido(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade, hab: Habilidade): boolean {
  return deSuporte(hab) ? alvoDeSuporteValido(ctx, ator, alvo) : alvoOfensivoValido(estado, ctx, ator, alvo);
}

/** Avatar hostil vem antes de qualquer outro alvo (§2.9): é regra de alvo, não de hostilidade. */
export function prioridadeDeAlvo(e: Entidade): number {
  return e.invocacao?.avatar ? 0 : 1;
}

/** Auto-alvo (§4.7): hostil no alcance por Chebyshev; avatar primeiro, depois mais próximo, menor HP e id. */
export function autoAlvo(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  ator: Entidade,
  alcance: number,
  filtro: (e: Entidade) => boolean = () => true,
): Entidade | null {
  const origem = celulaOcupada(ator);
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
function aliadoMaisFerido(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alcance: number): Entidade | null {
  const origem = celulaOcupada(ator);
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
  return ator.ataqueBasico === id || ator.habilidades.includes(id);
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
): boolean {
  const recusar = (motivo: MotivoRecusa) => {
    saida.push({ t: 'acaoRecusada', tick: estado.tick, atorId: ator.id, habilidadeId, motivo });
    return false;
  };
  if (!vivo(ator)) return false;
  const hab = habilidadeDisponivel(ator, habilidadeId) ? habilidadeDoAtor(ctx, ator, habilidadeId) : undefined;
  // Passiva não se conjura (marco 14): vale enquanto conhecida.
  if (!hab || hab.passiva) return recusar('sem_habilidade');
  // Pedir uma habilidade durante a conjuração do ataque básico substitui o básico (D-020):
  // o automático nunca impede o jogador de usar habilidades.
  const substituiBasico = ator.acao?.habilidadeId === ator.ataqueBasico && habilidadeId !== ator.ataqueBasico;
  if (ator.acao && !substituiBasico) return recusar('ocupado');
  if (acaoBloqueada(ator, estado.tick, hab.tipoAtaque)) return recusar('bloqueado');
  if (recargaRestante(estado, ator.id, hab.id) > 0) return recusar('recarga');
  const perfil = perfilPara(ctx, ator, hab);
  const custoMana = Math.max(0, Math.round(hab.custoRecurso * (1 + perfil.custoPct / 100)));
  const custoVida = Math.max(0, Math.round(hab.custoVida * (1 + perfil.custoPct / 100)));
  // Custo em vida (marco 14): nunca mata quem conjura.
  if (ator.mana < custoMana || (custoVida > 0 && ator.hp <= custoVida)) return recusar('recurso');
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
    alvo = escolherAlvo(estado, ctx, ator, hab, alvoPedido);
  }
  if (!alvo && !celula) return recusar('sem_alvo');
  // Em volta de quem conjura (ao redor, aliados): a mira é a própria célula.
  const mira = hab.tipoArea === 'ao_redor' ? origem : (celula ?? celulaOcupada(alvo as Entidade));
  if (chebyshev(origem, mira) > alcanceDe(ctx, ator, hab, estado.tick)) return recusar('fora_de_alcance');

  if (substituiBasico) cancelar(ator, estado, 'substituido', saida);
  // Conjuração (§2.7, etapa 3): custo e recarga descontados aqui, com recarga monotônica.
  ator.mana -= custoMana;
  ator.hp -= custoVida;
  if (hab.recargaMs > 0) {
    const chave = chaveRecarga(ator.id, hab.id);
    // `ab_recarga` encurta a recarga do ataque básico (até 75%); o perfil, a de qualquer habilidade.
    // Marco 17: a Destreza acima de 10 também encurta o básico (somada ao `ab_recarga`, dentro do mesmo teto).
    // Marco 18: o teto passa a 75% só somando buff; a Destreza do arqueiro chega a 50% sozinha.
    const reducao = hab.id === ator.ataqueBasico ? Math.min(75, bonusAtaqueBasico(ator, estado.tick).recargaPct + reducaoRecargaBasicoPct(ator.atributos, ctx.balance, perfilDestreza(ctx, ator))) : 0;
    const ms = hab.recargaMs * (1 - reducao / 100) * (1 + perfil.recargaPct / 100);
    estado.recargas[chave] = Math.max(estado.recargas[chave] ?? 0, estado.tick + ticksDe(ms));
  }
  // Marco 15: na dificuldade fácil, os golpes de quem não é do lado do jogador avisam mais cedo.
  const avisoExtra = ladoDoJogador(estado, ator) ? 0 : fatoresDoMundo(estado, ctx).avisoExtraMs;
  const lancamentoTick = estado.tick + ticksDe(hab.conjuracaoMs + avisoExtra);
  const viagem =
    hab.politicaImpacto === 'projetil' ? ticksDe((Math.hypot(mira.x - origem.x, mira.y - origem.y) / hab.velocidadeProjetil) * 1000) : 0;
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
  saida.push({ t: 'acaoIniciada', tick: estado.tick, atorId: ator.id, ...ator.acao });
  return true;
}

function escolherAlvo(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  ator: Entidade,
  hab: Habilidade,
  pedido: EntidadeId | undefined,
): Entidade | null {
  const alcance = alcanceDe(ctx, ator, hab, estado.tick);
  if (pedido) {
    // O pedido explícito vale mesmo fora do alcance (a validação recusa).
    const e = buscarEntidade(estado, pedido);
    if (e && alvoValido(estado, ctx, ator, e, hab)) return e;
  }
  if (deSuporte(hab)) return aliadoMaisFerido(estado, ctx, ator, alcance);
  // Ajuste de 15/10/2026 (D-065): travado, a habilidade vai no travado mesmo fora do alcance (a validação recusa),
  // nunca em outro; destravado, o hostil escolhido pelo auto-alvo passa a ser o selecionado (o anel acompanha).
  const atual = alvoAtual(estado, ctx, ator);
  if (atual && (ator.alvoTravado || chebyshev(celulaOcupada(ator), celulaOcupada(atual)) <= alcance)) return atual;
  if (ator.alvoTravado && ator.alvoSelecionado) return null;
  const novo = autoAlvo(estado, ctx, ator, alcance);
  if (novo) ator.alvoSelecionado = novo.id;
  return novo;
}

function cancelar(ator: Entidade, estado: EstadoJogo, motivo: MotivoCancelamento, saida: EventoSimulacao[]): void {
  if (!ator.acao) return;
  saida.push({ t: 'acaoCancelada', tick: estado.tick, acaoId: ator.acao.acaoId, atorId: ator.id, motivo });
  ator.acao = null;
}

/** Etapa 3 do tick: conjurações em curso — interrupção e lançamento. */
export function processarAcoes(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
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
    lancar(estado, ctx, ator, hab, a.acaoId, { x: a.alvoX, y: a.alvoY }, alvo ?? null, saida);
  }
}

function lancar(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  ator: Entidade,
  hab: Habilidade,
  acaoId: number,
  mira: Celula,
  alvo: Entidade | null,
  saida: EventoSimulacao[],
): void {
  // Marco 18 (D-068, D-069): o combo (a habilidade anterior em até a janela) fortalece esta; os ganchos "ao usar"
  // disparam; e esta vira a última.
  const fonte = comCombo(fonteDaHabilidade(ator, ctx, estado.tick, hab), fazerCombo(estado, ctx, ator, hab, alvo, mira, saida));
  dispararGanchosDe(estado, ctx, ator, 'aoUsarHabilidade', { outro: alvo, hab }, saida);
  ator.ultimaHabilidade = { id: hab.id, chave: hab.chave, tick: estado.tick, alvoId: alvo?.id ?? null };
  const basico = hab.id === ator.ataqueBasico ? bonusAtaqueBasico(ator, estado.tick) : null;
  const alcance = alcanceDe(ctx, ator, hab, estado.tick);
  const base = { acaoId, fonte, hab, mira, ...(basico && basico.dano > 0 && { danoExtra: basico.dano }) };
  // Efeitos de lançamento (armadilha, invocação): uma vez, sobre quem conjura, na célula mirada.
  for (const ef of hab.efeitos) {
    if (REGISTRO_EFEITOS[ef.tipo].aoLancar) aplicarEfeito(estado, ctx, ator, ef, { id: ator.id, x: ator.x, y: ator.y }, mira, saida);
  }
  switch (hab.politicaImpacto) {
    case 'proprio':
      aplicarImpacto(estado, ctx, ator, { ...base, indice: 0 }, saida);
      break;
    case 'contato': {
      if (!alvo) break;
      if (chebyshev(celulaOcupada(ator), celulaOcupada(alvo)) > alcance) {
        saida.push({ t: 'esquivou', tick: estado.tick, acaoId, atorId: ator.id, alvoId: alvo.id });
        break;
      }
      const saltos = quantidadeDeSaltos(hab, alvo, estado.tick);
      aplicarImpacto(estado, ctx, alvo, { ...base, indice: 0 }, saida);
      const atingidos = [alvo.id];
      // `ab_multi_alvo` (§2.8): alvos adicionais no alcance, os mais próximos primeiro.
      const extras = basico?.alvosExtras ?? 0;
      if (extras > 0) {
        const origem = celulaOcupada(ator);
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
      const atingidos = alvosDaForma(estado, ctx, ator, hab, celulasDaForma(hab, celulaOcupada(ator), mira, ctx.fase));
      atingidos.forEach((e, indice) => {
        aplicarImpacto(estado, ctx, e, { ...base, indice }, saida);
      });
      break;
    }
    case 'projetil':
      // Mira na célula do alvo no lançamento; daí em diante segue em linha reta e pode ser esquivado.
      lancarProjetil(estado, ator, hab, acaoId, fonte, alvo ? celulaOcupada(alvo) : mira, saida);
      break;
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
