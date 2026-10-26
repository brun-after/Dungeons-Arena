// Prompt de interação contextual (§2.15). Marco 12 (14/10/2026). Só lê o estado, a cada 200 ms: o baú ou a
// loja ao alcance (a mesma escolha de `interagir`, world/interacao.ts) e a saída trancada sob os pés.
// Ajuste de 16/10/2026 (D-067): o lembrete do descanso saiu com o descanso.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { t } from '../i18n';
import { armadilhaParaDesarmar } from '../world/armadilhas-ocultas';
import { alvoDeInteracao, podeConverterArmadilha, recargaLojaRestante } from '../world/interacao';
import { esperaNaPorta } from '../world/portas';

const INTERVALO_MS = 200;

export interface Prompt {
  elemento: HTMLElement;
  atualizar: (estado: EstadoJogo, agoraMs: number) => void;
}

export function criarPrompt(ctx: ContextoSimulacao, idLocal: string, toque: boolean, letraInteragir: () => string = () => 'E'): Prompt {
  const el = document.createElement('div');
  el.className = 'prompt-interacao';
  el.setAttribute('role', 'status');
  el.hidden = true;
  let ultimo = -Infinity;
  // D-067: no toque, a palavra (o botão de interagir tem o ícone da mão).
  // Marco 26 (D-107): a letra de interagir muda com EWAS no isométrico (o D).
  const tecla = () => (toque ? t('prompt.toque') : letraInteragir());

  const texto = (estado: EstadoJogo): string => {
    const eu = estado.entidades.find((e) => e.id === idLocal);
    if (!eu?.bolsa || eu.morto || eu.interacao) return '';
    const o = alvoDeInteracao(estado, ctx, eu);
    if (o?.tipo === 'loja') {
      return recargaLojaRestante(estado, o.objetoId, eu.id) > 0 ? t('prompt.lojaRecarga') : t('prompt.loja', { tecla: tecla() });
    }
    if (o?.tipo === 'santuario') return t('prompt.santuario', { tecla: tecla() });
    if (o?.tipo === 'bau') return t(o.chave ? 'prompt.bauTrancado' : 'prompt.bau', { tecla: tecla() });
    // Marco 18 (D-068): armadilha revelada ao alcance.
    if (!o && armadilhaParaDesarmar(estado, ctx, eu)) return t(podeConverterArmadilha(eu, estado.tick) ? 'prompt.converter' : 'prompt.desarmar', { tecla: tecla() });
    // Marco 24 (D-099): parado na porta de fase, a contagem até sair.
    const espera = esperaNaPorta(estado, ctx, eu);
    if (espera !== null && espera < 1) return t('prompt.esperaPorta', { s: Math.ceil((1 - espera) * (ctx.balance.portas.esperaMs / 1000)) });
    const volta = ctx.fase.portaRetorno;
    if (volta && Math.max(Math.abs(volta.x - eu.x), Math.abs(volta.y - eu.y)) <= 1) return t('prompt.retorno');
    const s = ctx.fase.portaSaida;
    if (s && s.x === eu.x && s.y === eu.y && s.tranca !== 'livre' && !estado.saidaAberta) {
      return t(s.tranca === 'chave' ? 'prompt.saidaChave' : 'prompt.saidaBoss');
    }
    const ambiente = ctx.fase.ambientes?.find((a) => (a.x - eu.x) ** 2 + (a.y - eu.y) ** 2 <= a.raio ** 2);
    return ambiente ? t(`prompt.${ambiente.tipo}`) : '';
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
