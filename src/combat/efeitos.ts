// Registro de efeitos (§2.8): fonte única de verdade, com um dispatcher só. Marco 3 registra
// os efeitos de controle; os 26 tipos entram no 8A sem mudar quem aplica.
// Registrar um tipo com `elegivelParaOrbe: true` o coloca automaticamente no sorteio do orbe.

import type { EntidadeId } from '../core/comandos';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';

export const TIPOS_EFEITO = ['atordoar', 'silenciar'] as const;
export type TipoEfeito = (typeof TIPOS_EFEITO)[number];

export interface DefinicaoEfeito {
  id: TipoEfeito;
  icone: string;
  cor: string;
  ehStatus: boolean;
  positivo: boolean;
  elegivelParaOrbe: boolean;
  pesoOrbe: number;
  /** Impede começar passos. */
  bloqueiaMovimento: boolean;
  /** Quais ações não podem começar nem continuar. */
  bloqueiaAcoes: 'todas' | 'magicas' | 'nenhuma';
}

export const REGISTRO_EFEITOS: Readonly<Record<TipoEfeito, DefinicaoEfeito>> = {
  atordoar: {
    id: 'atordoar',
    icone: '✷',
    cor: '#f1c40f',
    ehStatus: true,
    positivo: false,
    elegivelParaOrbe: false,
    pesoOrbe: 0,
    bloqueiaMovimento: true,
    bloqueiaAcoes: 'todas',
  },
  silenciar: {
    id: 'silenciar',
    icone: '🔇',
    cor: '#9b59b6',
    ehStatus: true,
    positivo: false,
    elegivelParaOrbe: false,
    pesoOrbe: 0,
    bloqueiaMovimento: false,
    bloqueiaAcoes: 'magicas',
  },
};

export function efeitosAtivos(e: Entidade, tick: number): DefinicaoEfeito[] {
  return e.efeitos.filter((f) => f.ateTick > tick).map((f) => REGISTRO_EFEITOS[f.tipo]);
}

export function movimentoBloqueado(e: Entidade, tick: number): boolean {
  return efeitosAtivos(e, tick).some((d) => d.bloqueiaMovimento);
}

/** A entidade pode começar (ou continuar) uma ação desse tipo? */
export function acaoBloqueada(e: Entidade, tick: number, magica: boolean): boolean {
  return efeitosAtivos(e, tick).some((d) => d.bloqueiaAcoes === 'todas' || (magica && d.bloqueiaAcoes === 'magicas'));
}

/**
 * Dispatcher único (§2.8). Reaplicar o mesmo tipo estende a duração, nunca encurta.
 * A interrupção da ação em curso acontece no processamento de ações (combat/acao.ts),
 * que consulta `acaoBloqueada` a cada tick.
 */
export function aplicarEfeito(
  alvo: Entidade,
  tipo: TipoEfeito,
  duracaoMs: number,
  origemId: EntidadeId,
  tick: number,
  saida: EventoSimulacao[],
): void {
  const ateTick = tick + ticksDe(duracaoMs);
  const existente = alvo.efeitos.find((f) => f.tipo === tipo);
  if (existente) {
    existente.ateTick = Math.max(existente.ateTick, ateTick);
    existente.origemId = origemId;
  } else {
    alvo.efeitos.push({ tipo, ateTick, origemId });
  }
  saida.push({ t: 'efeitoAplicado', tick, alvoId: alvo.id, origemId, tipo, ateTick });
}

/** Etapa 4 do tick: remove efeitos expirados. */
export function expirarEfeitos(entidades: readonly Entidade[], tick: number): void {
  for (const e of entidades) {
    if (e.efeitos.length > 0) e.efeitos = e.efeitos.filter((f) => f.ateTick > tick);
  }
}
