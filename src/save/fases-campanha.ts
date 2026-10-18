// Fases da campanha, puras (marco 15, 15/10/2026). Saíram de jogo.ts para a sala cooperativa usar as mesmas: as
// oficiais vêm de data/fases e as geradas nascem de novo dos parâmetros (D-053). As aventuras do editor ficam só no
// aparelho de quem as criou, então não estão aqui (jogo.ts as busca à parte).

import type { Conteudo } from '../core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../core/contexto';
import { criarEstado, type EstadoJogo } from '../core/estado';
import { hashTexto } from '../core/rng';
import campanha from '../data/campanha.json';
import fase01 from '../data/fases/fase-01.json';
import fase02 from '../data/fases/fase-02.json';
import type { ModoDeJogo } from '../modos/modo';
import { carregarFase } from '../world/fase';
import { catalogoDeGeracao, gerarFase } from '../world/gerador';
import { idDoInimigo, povoarFase } from '../world/populacao';
import { validarFase } from '../world/validacao-fase';
import type { RefFase } from './esquema';
import { proximaFase } from './sequencia';

/** Fases oficiais da campanha, por id (a referência gravada no save). */
export const FASES_OFICIAIS: Readonly<Record<string, unknown>> = { 'fase-01': fase01, 'fase-02': fase02 };
export const FASE_INICIAL: RefFase = { tipo: 'oficial', id: 'fase-01' };

/** O JSON de uma fase oficial ou gerada; undefined para aventura (do aparelho) ou id desconhecido. */
export function faseOficialOuGerada(ref: RefFase, conteudo: Conteudo): unknown {
  if (ref.tipo === 'oficial') return FASES_OFICIAIS[ref.id];
  if (ref.tipo === 'gerada') return gerarFase(ref.params, catalogoDeGeracao(conteudo, campanha.geradas.estoque));
  return undefined;
}

export type LeituraDeContexto = { ok: true; ctx: ContextoSimulacao } | { ok: false; erro: string };

/** O contexto de simulação de uma fase em JSON, no modo dado (campanha solo ou cooperativa). */
export function contextoDaFase(conteudo: Conteudo, faseJson: unknown, modo: ModoDeJogo = conteudo.modoCampanha): LeituraDeContexto {
  const validacao = validarFase(faseJson, new Set(conteudo.presets.keys()), conteudo.itens);
  if (!validacao.ok) return { ok: false, erro: validacao.erros[0]?.mensagem ?? '?' };
  return { ok: true, ctx: { fase: carregarFase(validacao.fase), balance: BALANCE_PADRAO, conteudo, modo } };
}

/** A fase como o jogo a encontra pela primeira vez: inimigos e objetos, sem o jogador. */
export function estadoInicialDaFase(ctx: ContextoSimulacao): EstadoJogo {
  const estado = criarEstado({ semente: hashTexto(ctx.fase.id), faseId: ctx.fase.id });
  povoarFase(estado, ctx);
  return estado;
}

/** Ao atravessar a saída, guarda só a população normal e retira o evento das revisitas. */
export function concluirEnxame(ref: RefFase, estado: EstadoJogo, conteudo: Conteudo): RefFase {
  if (ref.tipo !== 'gerada' || !ref.params.eventos?.includes('enxame')) return ref;
  const normal: RefFase = { ...ref, params: { ...ref.params, eventos: ref.params.eventos.filter((e) => e !== 'enxame'), enxameConcluido: true } };
  const leitura = contextoDaFase(conteudo, faseOficialOuGerada(normal, conteudo));
  if (!leitura.ok) throw new Error(`fase inválida: ${leitura.erro}`);
  const ids = new Set(leitura.ctx.fase.inimigos.map((_, i) => idDoInimigo(i)));
  estado.entidades = estado.entidades.filter((e) => e.controlador !== 'ia' || ids.has(e.id));
  // Os inimigos normais ainda na reserva não morreram: passam a fazer parte da população ativa.
  const reservados = new Set((estado.reservaEnxame ?? []).map(idDoInimigo));
  estado.entidades.push(...estadoInicialDaFase(leitura.ctx).entidades.filter((e) => reservados.has(e.id)));
  estado.respawns = [];
  delete estado.reservaEnxame;
  return normal;
}

/** A fase seguinte da campanha (oficial, depois as geradas); na aventura, a próxima da lista (ou null no fim). */
export function faseSeguinte(ref: RefFase, fasesDaAventura = 1, estilo: readonly string[] = []): RefFase | null {
  return proximaFase(ref, campanha.fases, campanha.geradas, BALANCE_PADRAO.xp.nivelMax, fasesDaAventura, estilo);
}
