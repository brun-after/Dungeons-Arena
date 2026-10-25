// A cinemática da ultimate (marco 24, 25/10/2026, D-094): ao lançar a sua ultimate, uma vinheta escurece as bordas da
// tela e o nome dela cruza o centro por ~1,4 s, na cor da habilidade. Não bloqueia o toque (pointer-events: none) e,
// com movimento reduzido, só aparece e some (o CSS tira a animação). A explosão em partículas fica em efeitos-classe.ts.

import type { BuscaHabilidade } from '../combat/habilidades';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import { visualDe } from '../render/visual-habilidade';

const DURACAO_MS = 1400;

export function ligarCinematicaUltimate(raiz: HTMLElement, bus: Barramento<EventosDaSimulacao>, idLocal: string, habilidades: BuscaHabilidade): void {
  let atual: HTMLElement | null = null;
  let timer = 0;
  bus.on('ultimateUsada', (ev) => {
    if (ev.id !== idLocal) return;
    const h = habilidades(ev.ultimateId);
    atual?.remove();
    window.clearTimeout(timer);
    const el = document.createElement('div');
    el.className = 'cinematica-ultimate';
    el.dataset.testid = 'cinematica-ultimate';
    el.setAttribute('aria-hidden', 'true');
    const cor = h ? visualDe(h).cor : 0xfff3c4;
    el.style.setProperty('--cor-ultimate', `#${cor.toString(16).padStart(6, '0')}`);
    const nome = document.createElement('strong');
    nome.textContent = h?.nome ?? ev.ultimateId;
    el.append(nome);
    raiz.append(el);
    atual = el;
    timer = window.setTimeout(() => {
      el.remove();
      if (atual === el) atual = null;
    }, DURACAO_MS);
  });
}
