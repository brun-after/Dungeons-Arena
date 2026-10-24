// Saltos (D-057, D-059). Marco 14 (14/10/2026). Depois do golpe principal (contato ou projétil), o golpe pula
// para o próximo hostil mais próximo ainda não atingido, dentro do raio do salto, com uma fração do dano.
// Fontes: o modificador `encadear` (saltos da habilidade compilada) e o raio sobre um alvo eletrizado (+1).
// Os saltos não saltam de novo. Hostilidade sempre pela relação do modo (§2.5).

import { saltosEncarnacao } from './encarnacao';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir, type Lado } from '../modos/relacao';
import { celulaOcupada, chebyshev } from './geometria';
import { aplicarImpacto, type Impacto } from './golpe';
import type { Habilidade } from './habilidades';

/** Raio padrão do salto do raio sobre eletrizado, quando a habilidade não encadeia. */
const RAIO_ELETRIZADO = 3;
const PCT_ELETRIZADO = 60;

/** Quantos saltos este golpe terá (conferir antes do golpe principal: ele mesmo pode eletrizar). */
export function quantidadeDeSaltos(hab: Habilidade, alvo: Entidade, tick: number, ator?: Entidade): number {
  const eletrizado = hab.elemento === 'raio' && alvo.efeitos.some((f) => f.tipo === 'eletrizado' && f.ateTick > tick);
  // Marco 22 (D-089): o Mago encarnado em raio ganha um salto.
  return (hab.saltos?.quantidade ?? 0) + (eletrizado ? 1 : 0) + saltosEncarnacao(ator, hab);
}

export function saltar(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  dono: Lado,
  hab: Habilidade,
  primeiro: Entidade,
  quantos: number,
  impacto: Omit<Impacto, 'indice'>,
  atingidos: string[],
  saida: EventoSimulacao[],
): void {
  const raio = hab.saltos?.raio ?? RAIO_ELETRIZADO;
  const pct = hab.saltos?.pct ?? PCT_ELETRIZADO;
  const fonte = { ...impacto.fonte, multDano: (impacto.fonte.multDano * pct) / 100 };
  let de = celulaOcupada(primeiro);
  for (let i = 0; i < quantos; i++) {
    let proximo: Entidade | null = null;
    let melhor = Infinity;
    for (const e of estado.entidades) {
      if (e.id === dono.id || atingidos.includes(e.id) || !vivo(e) || e.invisivelAteTick > estado.tick || !podeFerir(dono, e, ctx.modo)) continue;
      const d = chebyshev(de, celulaOcupada(e));
      if (d > raio) continue;
      if (d < melhor || (d === melhor && proximo && e.id < proximo.id)) {
        proximo = e;
        melhor = d;
      }
    }
    if (!proximo) return;
    aplicarImpacto(estado, ctx, proximo, { ...impacto, fonte, indice: atingidos.length }, saida);
    atingidos.push(proximo.id);
    de = celulaOcupada(proximo);
  }
}
