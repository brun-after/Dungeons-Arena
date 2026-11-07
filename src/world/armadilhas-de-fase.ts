// As armadilhas que a geração espalha (06/11/2026, D-135): círculos de conjuração escondidos no chão, elementais (o
// elemento do tema na maior parte das vezes) ou de explosão, com o dano pelo nível e rearme. O disparo (puxão, % da
// vida atual, estado do elemento) fica em combat/armadilhas-disparo.ts. Puro e determinístico pelo RNG recebido.

import { ELEMENTOS, type Elemento } from '../combat/elementos';
import type { Celula } from '../core/comandos';
import { BALANCE_PADRAO, type Balance } from '../core/contexto';
import { aleatorio, escolher, type EstadoRng } from '../core/rng';
import type { ObjetoPosicionadoJson } from './fase';

/** Chance de o elemental sair do elemento do tema (quando há um), em vez de um qualquer. */
const DO_TEMA = 0.7;

/** Uma armadilha de fase na célula, já com o dano do nível e o estilo sorteado (coordenadas normalizadas da fase). */
export function armadilhaDeFase(
  rng: EstadoRng,
  c: Celula,
  dimensoes: { largura: number; altura: number },
  nivel: number,
  elementoDoTema: Elemento | null,
  balance: Balance = BALANCE_PADRAO,
): ObjetoPosicionadoJson {
  const b = balance.ambiente;
  const elemental = aleatorio(rng) * 100 < balance.armadilhas.elementalPct;
  const elemento = elemental ? (elementoDoTema && aleatorio(rng) < DO_TEMA ? elementoDoTema : escolher(rng, ELEMENTOS)) : null;
  return {
    tipo: 'armadilha',
    x: (c.x + 0.5) / dimensoes.largura,
    y: (c.y + 0.5) / dimensoes.altura,
    valor: Math.min(b.danoArmadilhaMax, b.danoArmadilhaBase + nivel * b.danoArmadilhaPorNivel),
    modo: 'rearme',
    rearmeMs: b.rearmeMs,
    ...(elemento && { elemento }),
  };
}
