// A Lanças da escuridão no render (07/11/2026, D-136). Só lê eventos: cada `lancaDeOsso` vira a área da assinatura da skill
// (os espinhos de osso irrompendo em sequência) pelas células da lança, do peito do morto até a ponta.

import { bresenham } from '../combat/formas';
import type { Habilidade } from '../combat/habilidades';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import type { DiretorVfx } from './vfx/diretor';
import { assinaturaDe } from './vfx/resolver';
import { visualDe } from './visual-habilidade';

export function ligarLancas(bus: Barramento<EventosDaSimulacao>, diretor: DiretorVfx, habilidade: (chave: string) => Habilidade | undefined): void {
  bus.on('lancaDeOsso', (ev) => {
    const h = habilidade(ev.chave);
    if (!h) return;
    const de = { x: ev.deX, y: ev.deY };
    const ate = { x: ev.paraX, y: ev.paraY };
    const area = { chave: ev.chave, atorId: ev.mortoId, origem: de, mira: ate, centro: ate, celulas: bresenham(de, ate).slice(1), cor: visualDe(h).cor, escala: 1, tipoArea: 'linha', raio: 0 };
    if (!diretor.area(assinaturaDe(h), area, h.visual?.variante)) diretor.rajada(assinaturaDe(h), area);
  });
}
