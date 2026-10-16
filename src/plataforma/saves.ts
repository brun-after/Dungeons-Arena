// Slots da campanha no IndexedDB (§3.5). Marco 6B (13/10/2026). Todo registro lido passa por
// `lerRegistro` (migração e validação); registro inválido aparece como slot com erro, nunca quebra
// a tela. A gravação é serializada: só uma por vez, e a mais nova vence.

import { clonarEstado, type EstadoJogo } from '../core/estado';
import { lerRegistro, resumoDoRegistro, SLOTS, VERSAO_SCHEMA, type Estatisticas, type RefFase, type RegistroProgresso, type ResumoSlot } from '../save/esquema';
import type { Certificado } from '../integridade/certificado';
import { apagarDoBanco, gravarNoBanco, lerDoBanco, listarDoBanco } from './banco';

export type EstadoSlot = { slot: number; tipo: 'vazio' } | { slot: number; tipo: 'ok'; resumo: ResumoSlot } | { slot: number; tipo: 'invalido' };

export async function listarSlots(): Promise<EstadoSlot[]> {
  const brutos = await listarDoBanco('progresso');
  return SLOTS.map((slot): EstadoSlot => {
    const bruto = brutos.find((b) => typeof b === 'object' && b !== null && (b as { slot?: unknown }).slot === slot);
    if (bruto === undefined) return { slot, tipo: 'vazio' };
    const leitura = lerRegistro(bruto);
    return leitura.ok ? { slot, tipo: 'ok', resumo: resumoDoRegistro(leitura.registro) } : { slot, tipo: 'invalido' };
  });
}

/** null: slot vazio; 'invalido': existe, mas não pôde ser lido (não deve ser sobrescrito sem o jogador decidir). */
export async function carregarSlot(slot: number): Promise<RegistroProgresso | null | 'invalido'> {
  const bruto = await lerDoBanco('progresso', slot);
  if (bruto === undefined) return null;
  const leitura = lerRegistro(bruto);
  return leitura.ok ? leitura.registro : 'invalido';
}

export async function gravarRegistro(r: RegistroProgresso): Promise<void> {
  await gravarNoBanco('progresso', r);
}

export async function apagarSlot(slot: number): Promise<void> {
  await apagarDoBanco('progresso', slot);
}

export interface OpcoesAutosave {
  slot: number;
  faseRef: RefFase;
  nomeFase: string;
  criadoEm: number;
  /** Chamado fora do tick: a cópia é tirada no momento da gravação. */
  estado: () => EstadoJogo;
  estatisticas: () => Estatisticas;
  /** Marco 10A-1: as outras fases visitadas (fixas durante a sessão: trocar de fase recarrega). */
  fasesVisitadas: Record<string, EstadoJogo>;
  /** Marco 17: o certificado do personagem (o último que o servidor deu; a gravação o mantém). */
  certificado?: () => Certificado | null;
  aoFalhar?: (erro: unknown) => void;
}

export interface Autosave {
  /** Pede uma gravação; várias no mesmo instante viram uma só. */
  pedir: () => void;
  /** Grava agora (ao sair ou suspender) e devolve quando terminar. */
  agora: () => Promise<void>;
  /** Para de gravar (a troca de fase já gravou o registro novo e vai recarregar a sessão). */
  suspender: () => Promise<void>;
}

export function criarAutosave(o: OpcoesAutosave): Autosave {
  let gravando: Promise<void> | null = null;
  let pendente = false;
  let agendado = false;
  let suspenso = false;

  const gravar = async (): Promise<void> => {
    if (suspenso) return;
    if (gravando) {
      pendente = true;
      return gravando;
    }
    const registro: RegistroProgresso = {
      versaoSchema: VERSAO_SCHEMA,
      slot: o.slot,
      criadoEm: o.criadoEm,
      atualizadoEm: Date.now(),
      faseRef: o.faseRef,
      nomeFase: o.nomeFase,
      estado: clonarEstado(o.estado()),
      estatisticas: { ...o.estatisticas() },
      fasesVisitadas: o.fasesVisitadas,
      certificado: o.certificado?.() ?? null,
    };
    gravando = gravarRegistro(registro)
      .catch((erro: unknown) => o.aoFalhar?.(erro))
      .finally(() => {
        gravando = null;
        if (pendente) {
          pendente = false;
          void gravar();
        }
      });
    return gravando;
  };

  return {
    pedir: () => {
      if (agendado) return;
      agendado = true;
      // Fora do tick (§3.5): depois que o quadro atual terminar.
      setTimeout(() => {
        agendado = false;
        void gravar();
      }, 0);
    },
    agora: gravar,
    suspender: async () => {
      suspenso = true;
      // Espera a gravação em curso, para ela não chegar depois do registro da fase nova.
      await gravando;
    },
  };
}
