// O chefe que surge (marco 53, 22/11/2026, D-203). No Mundo, o registro lateral saiu da tela; o chefe que aparece
// por perto (o da noite, o que renasce, o encontro da região que entra na vista) vira uma faixa chamativa logo abaixo
// da do lugar, com o nome e o nível. Só lê o estado a cada quadro: o chefe da noite nasce fora da simulação (sem
// evento), e o que entra na área de interesse também é novidade para quem chega. Cada chefe avisa de novo só depois
// de `REPETIR_MS` longe da vista (sair e voltar à borda da área não repete a faixa).

import type { EstadoJogo } from '../core/estado';
import { vivo } from '../entities/entidade';
import { t } from '../i18n';

const DURACAO_MS = 6000;
const REPETIR_MS = 120_000;
/** Na chegada a um lugar, os chefes já presentes não viram faixa (a do lugar já está na tela). */
const CHEGADA_MS = 2000;

export interface AnuncioDeChefe {
  elemento: HTMLElement;
  atualizar: (estado: EstadoJogo, agoraMs: number) => void;
  /** Chegou a outro lugar: quem já estava lá não é novidade. */
  chegou: () => void;
}

/** Os chefes vivos do estado que ainda não foram anunciados (ou que sumiram da vista há mais de `REPETIR_MS`). */
export function chefesNovos(estado: EstadoJogo, vistos: Map<string, number>, agoraMs: number): { id: string; nome: string; nivel: number }[] {
  const novos: { id: string; nome: string; nivel: number }[] = [];
  for (const e of estado.entidades) {
    if (e.arquetipo !== 'boss' || !vivo(e) || e.invocacao) continue;
    const visto = vistos.get(e.id);
    if (visto === undefined || agoraMs - visto > REPETIR_MS) novos.push({ id: e.id, nome: e.nome, nivel: e.nivel });
    vistos.set(e.id, agoraMs);
  }
  return novos;
}

export function criarAnuncioDeChefe(): AnuncioDeChefe {
  const el = document.createElement('div');
  el.className = 'faixa-chefe';
  el.setAttribute('role', 'alert');
  el.style.opacity = '0';
  const titulo = document.createElement('strong');
  const detalhe = document.createElement('span');
  el.append(titulo, detalhe);
  const vistos = new Map<string, number>();
  let chegada: number | null = null;
  return {
    elemento: el,
    chegou: () => { chegada = null; },
    atualizar: (estado, agoraMs) => {
      if (estado.entidades.length === 0) return;
      chegada ??= agoraMs;
      const novos = chefesNovos(estado, vistos, agoraMs);
      if (agoraMs - chegada < CHEGADA_MS) return;
      const c = novos[0];
      if (!c) return;
      titulo.textContent = t('chefe.surgiu', { nome: c.nome });
      detalhe.textContent = novos.length > 1 ? t('chefe.surgiramMais', { nivel: c.nivel, n: novos.length - 1 }) : t('chefe.surgiuNivel', { nivel: c.nivel });
      el.getAnimations().forEach((a) => { a.cancel(); });
      el.animate([{ opacity: 0, transform: 'translateX(-50%) scale(0.92)' }, { opacity: 1, transform: 'translateX(-50%) scale(1)', offset: 0.06 }, { opacity: 1, offset: 0.75 }, { opacity: 0, transform: 'translateX(-50%)' }], { duration: DURACAO_MS, fill: 'forwards' });
    },
  };
}
