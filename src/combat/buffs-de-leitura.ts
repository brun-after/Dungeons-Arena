// Marco 40 (13/11/2026, D-161): os estados que mudam a próxima magia (as promessas das leituras de estilo). A área
// ampliada soma raio à próxima magia de área (e sai nela, como a sobrecarga); o eco faz cada magia que fere repetir
// `pct`% do golpe 0,6 s depois enquanto dura. Puro.

import type { Entidade } from '../entities/entidade';
import { faixaDaFormula } from './dados';
import type { Habilidade } from './habilidades';
import { construirEfeito } from './registro-efeitos';

export function comBuffsDeLeitura(ator: Entidade, hab: Habilidade, tick: number): Habilidade {
  if (hab.tipoAtaque !== 'magico') return hab;
  let saida = hab;
  const ampliada = ator.efeitos.find((f) => f.tipo === 'area_ampliada' && f.ateTick > tick);
  if (ampliada && hab.politicaImpacto === 'area' && hab.raioArea > 0) saida = { ...saida, raioArea: Math.min(5, saida.raioArea + Math.max(1, ampliada.valor)) };
  const eco = ator.efeitos.find((f) => f.tipo === 'ecoando' && f.ateTick > tick);
  if (eco && hab.formulaDano !== null) {
    const f = faixaDaFormula(hab.formulaDano);
    const valor = Math.max(1, Math.round((((f.min + f.max) / 2) * hab.multDano * eco.pct) / 100));
    saida = { ...saida, efeitos: [...saida.efeitos, construirEfeito('efeito_atrasado', { duracaoMs: 600, interno: construirEfeito('dano_direto', { valor }) })] };
  }
  return saida;
}
