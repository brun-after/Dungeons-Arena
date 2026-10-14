// Prompt de interação contextual (§2.15). Marco 12 (14/10/2026). Só lê o estado, a cada 200 ms: o baú ou a
// loja ao alcance (a mesma escolha de `interagir`, world/interacao.ts), a saída trancada sob os pés e,
// sem nada disso e sem ninguém perseguindo, o lembrete do descanso. No toque, mostra o ✋ em vez do E.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { t } from '../i18n';
import { podeDescansar } from '../modos/regras';
import { perseguido } from '../progression/recursos';
import { alvoDeInteracao, recargaLojaRestante } from '../world/interacao';

const INTERVALO_MS = 200;

export interface Prompt {
  elemento: HTMLElement;
  atualizar: (estado: EstadoJogo, agoraMs: number) => void;
}

export function criarPrompt(ctx: ContextoSimulacao, idLocal: string, toque: boolean): Prompt {
  const el = document.createElement('div');
  el.className = 'prompt-interacao';
  el.setAttribute('role', 'status');
  el.hidden = true;
  let ultimo = -Infinity;
  const tecla = (letra: string) => (toque ? '✋' : letra);

  const texto = (estado: EstadoJogo): string => {
    const eu = estado.entidades.find((e) => e.id === idLocal);
    if (!eu?.bolsa || eu.morto || eu.interacao) return '';
    const o = alvoDeInteracao(estado, ctx, eu);
    if (o?.tipo === 'loja') {
      return recargaLojaRestante(estado, o.objetoId, eu.id) > 0 ? t('prompt.lojaRecarga') : t('prompt.loja', { tecla: tecla('E') });
    }
    if (o?.tipo === 'bau') return t(o.chave ? 'prompt.bauTrancado' : 'prompt.bau', { tecla: tecla('E') });
    const s = ctx.fase.portaSaida;
    if (s && s.x === eu.x && s.y === eu.y && s.tranca !== 'livre' && !estado.saidaAberta) {
      return t(s.tranca === 'chave' ? 'prompt.saidaChave' : 'prompt.saidaBoss');
    }
    if (podeDescansar(ctx.modo) && !toque && eu.hp < eu.hpMax * 0.5 && !perseguido(estado, eu)) return t('prompt.descansar');
    return '';
  };

  return {
    elemento: el,
    atualizar: (estado, agoraMs) => {
      if (agoraMs - ultimo < INTERVALO_MS) return;
      ultimo = agoraMs;
      const novo = texto(estado);
      if (el.textContent !== novo) el.textContent = novo;
      el.hidden = novo === '';
    },
  };
}
