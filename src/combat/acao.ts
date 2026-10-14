// O ciclo de uma ação (§2.7): intenção → validação → conjuração → viagem → impacto.
// Custo e recarga são pagos no início da conjuração. Durante a conjuração a ação fica telegrafada
// (ticks publicados no evento `acaoIniciada`) e pode ser interrompida sem devolver o custo.
// Contato e área consultam a geometria no tick do impacto: sair do alcance ou da área esquiva.

import type { Celula, EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, novoId, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao, MotivoCancelamento, MotivoRecusa } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { bonusDeAtributo } from '../progression/ficha';
import { ordemRotativa } from '../world/colisao';
import type { FonteDeDano } from './dano';
import { acaoBloqueada, bonusAtaqueBasico, multiplicadorDanoCausado } from './efeitos';
import { celulaOcupada, chebyshev, dentroDoQuadrado } from './geometria';
import { aplicarImpacto } from './golpe';
import type { Habilidade } from './habilidades';
import { lancarProjetil } from './projeteis';

export function chaveRecarga(entidadeId: EntidadeId, habilidadeId: string): string {
  return `${entidadeId}_${habilidadeId}`;
}

/** Ticks até a habilidade sair de recarga (0 = pronta). */
export function recargaRestante(estado: EstadoJogo, entidadeId: EntidadeId, habilidadeId: string): number {
  return Math.max(0, (estado.recargas[chaveRecarga(entidadeId, habilidadeId)] ?? 0) - estado.tick);
}

export function fonteDe(e: Entidade, ctx: ContextoSimulacao, tick: number): FonteDeDano {
  return {
    id: e.id,
    equipe: e.equipe,
    bonusAtributo: bonusDeAtributo(e.atributos, e.classe, ctx.balance.combate.multiplicadorAtributoPadrao),
    carisma: e.atributos.carisma,
    multDano: multiplicadorDanoCausado(e, tick),
  };
}

/** Alcance com o `ab_alcance` quando é o ataque básico (§2.8, marco 8A). */
export function alcanceDe(ator: Entidade, hab: Habilidade, tick: number): number {
  return hab.alcanceCelulas + (hab.id === ator.ataqueBasico ? bonusAtaqueBasico(ator, tick).alcance : 0);
}

/** Alvo ofensivo válido: vivo, visível e passível de dano pela relação do modo (§2.5). */
export function alvoOfensivoValido(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade): boolean {
  return vivo(alvo) && alvo.invisivelAteTick <= estado.tick && podeFerir(ator, alvo, ctx.modo);
}

/** Auto-alvo (§4.7): hostil no alcance por Chebyshev; mais próximo, depois menor HP, depois id. */
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
    const melhorQue =
      !melhor || d < melhorDist || (d === melhorDist && (e.hp < melhor.hp || (e.hp === melhor.hp && e.id < melhor.id)));
    if (melhorQue) {
      melhor = e;
      melhorDist = d;
    }
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
  const hab = ctx.conteudo.habilidades.get(habilidadeId);
  if (!vivo(ator)) return false;
  if (!hab || !habilidadeDisponivel(ator, habilidadeId)) return recusar('sem_habilidade');
  // Pedir uma habilidade durante a conjuração do ataque básico substitui o básico (D-020):
  // o automático nunca impede o jogador de usar habilidades.
  const substituiBasico = ator.acao?.habilidadeId === ator.ataqueBasico && habilidadeId !== ator.ataqueBasico;
  if (ator.acao && !substituiBasico) return recusar('ocupado');
  if (acaoBloqueada(ator, estado.tick, hab.tipoAtaque)) return recusar('bloqueado');
  if (recargaRestante(estado, ator.id, hab.id) > 0) return recusar('recarga');
  if (ator.mana < hab.custoRecurso) return recusar('recurso');

  const origem = celulaOcupada(ator);
  let alvo: Entidade | null = null;
  let celula: Celula | null = null;
  if (hab.politicaAlvo === 'proprio') {
    alvo = ator;
  } else if (typeof alvoPedido === 'object') {
    celula = alvoPedido;
  } else {
    alvo = escolherAlvo(estado, ctx, ator, hab, alvoPedido);
  }
  if (!alvo && !celula) return recusar('sem_alvo');
  const mira = celula ?? celulaOcupada(alvo as Entidade);
  if (chebyshev(origem, mira) > alcanceDe(ator, hab, estado.tick)) return recusar('fora_de_alcance');

  if (substituiBasico) cancelar(ator, estado, 'substituido', saida);
  // Conjuração (§2.7, etapa 3): custo e recarga descontados aqui, com recarga monotônica.
  ator.mana -= hab.custoRecurso;
  if (hab.recargaMs > 0) {
    const chave = chaveRecarga(ator.id, hab.id);
    // `ab_recarga` encurta a recarga do ataque básico (até 75%).
    const reducao = hab.id === ator.ataqueBasico ? bonusAtaqueBasico(ator, estado.tick).recargaPct : 0;
    estado.recargas[chave] = Math.max(estado.recargas[chave] ?? 0, estado.tick + ticksDe(hab.recargaMs * (1 - reducao / 100)));
  }
  const lancamentoTick = estado.tick + ticksDe(hab.conjuracaoMs);
  const viagem =
    hab.politicaImpacto === 'projetil' ? ticksDe((Math.hypot(mira.x - origem.x, mira.y - origem.y) / hab.velocidadeProjetil) * 1000) : 0;
  const alvoId = hab.politicaImpacto === 'area' ? null : (alvo?.id ?? null);
  ator.acao = {
    acaoId: novoId(estado),
    habilidadeId: hab.id,
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
  const candidatos = [pedido, ator.alvoSelecionado];
  for (const id of candidatos) {
    if (!id) continue;
    const e = buscarEntidade(estado, id);
    if (e && alvoOfensivoValido(estado, ctx, ator, e)) {
      // O pedido explícito vale mesmo fora do alcance (a validação recusa); o selecionado só se alcançável.
      if (id === pedido || chebyshev(celulaOcupada(ator), celulaOcupada(e)) <= alcanceDe(ator, hab, estado.tick)) return e;
    }
  }
  return autoAlvo(estado, ctx, ator, alcanceDe(ator, hab, estado.tick));
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
    const hab = ctx.conteudo.habilidades.get(a.habilidadeId);
    if (!hab || !vivo(ator)) {
      cancelar(ator, estado, 'morte', saida);
      continue;
    }
    if (hab.interrupcao === 'interrompivel' && acaoBloqueada(ator, estado.tick, hab.tipoAtaque)) {
      cancelar(ator, estado, 'interrompido', saida);
      continue;
    }
    const alvo = a.alvoId === null ? null : buscarEntidade(estado, a.alvoId);
    if (a.alvoId !== null && a.alvoId !== ator.id && (!alvo || !alvoOfensivoValido(estado, ctx, ator, alvo))) {
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
  const fonte = fonteDe(ator, ctx, estado.tick);
  const basico = hab.id === ator.ataqueBasico ? bonusAtaqueBasico(ator, estado.tick) : null;
  const alcance = alcanceDe(ator, hab, estado.tick);
  const base = { acaoId, fonte, hab, mira, ...(basico && basico.dano > 0 && { danoExtra: basico.dano }) };
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
      aplicarImpacto(estado, ctx, alvo, { ...base, indice: 0 }, saida);
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
          });
      }
      break;
    }
    case 'area': {
      const atingidos = estado.entidades
        .filter((e) => vivo(e) && podeFerir(ator, e, ctx.modo) && dentroDoQuadrado(celulaOcupada(e), mira, hab.raioArea))
        .sort((a, b) => (a.id < b.id ? -1 : 1));
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
 */
export function processarAutoAtaque(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  if (estado.tick % Math.max(1, ticksDe(ctx.balance.combate.autoAtaqueMs)) !== 0) return;
  for (const ator of ordemRotativa(estado.entidades, estado.tick)) {
    if (!ator.autoAtaque || !vivo(ator) || ator.acao) continue;
    const hab = ctx.conteudo.habilidades.get(ator.ataqueBasico);
    if (!hab || recargaRestante(estado, ator.id, hab.id) > 0 || acaoBloqueada(ator, estado.tick, hab.tipoAtaque)) {
      continue;
    }
    const selecionado = ator.alvoSelecionado ? buscarEntidade(estado, ator.alvoSelecionado) : undefined;
    const alcance = alcanceDe(ator, hab, estado.tick);
    const noAlcance = (e: Entidade) => chebyshev(celulaOcupada(ator), celulaOcupada(e)) <= alcance;
    const alvo =
      selecionado && alvoOfensivoValido(estado, ctx, ator, selecionado) && noAlcance(selecionado)
        ? selecionado
        : autoAlvo(estado, ctx, ator, alcance, (e) => e.ia?.modo === 'perseguindo' && e.ia.alvoId === ator.id);
    if (alvo) iniciarAcao(estado, ctx, ator, hab.id, alvo.id, saida);
  }
}
