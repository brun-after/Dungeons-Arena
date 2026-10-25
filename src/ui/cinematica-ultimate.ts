// A cinemática da ultimate (marco 24, 25/10/2026, D-094): ao lançar a sua ultimate, uma vinheta escurece as bordas da
// tela por ~1,4 s, com o brilho na cor da habilidade. Ajuste de 25/10/2026 (D-099): sem o nome na tela. Não bloqueia o
// toque (pointer-events: none) e, com movimento reduzido, só aparece e some (o CSS tira a animação). A explosão em
// partículas fica em efeitos-classe.ts.

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
    raiz.append(el);
    atual = el;
    timer = window.setTimeout(() => {
      el.remove();
      if (atual === el) atual = null;
    }, DURACAO_MS);
  });
}
