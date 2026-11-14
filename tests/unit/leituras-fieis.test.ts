// Marco 40 (13/11/2026, D-161): toda leitura de estilo muda a skill de verdade — a forma do eixo age nela ou os efeitos
// extras da leitura entram. Assim o texto da carta nunca promete o que a mecânica não faz.
import { describe, expect, it } from 'vitest';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { formaDoEixo } from '../../src/combat/eixos';
import type { Habilidade } from '../../src/combat/habilidades';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));

/** O que a skill faz, sem os campos que só descrevem a chave. */
function mecanica(h: Habilidade): string {
  return JSON.stringify(Object.entries(h).filter(([k]) => k !== 'chave' && k !== 'formas'));
}

describe('leituras fiéis à mecânica (D-161)', () => {
  const casos: [string, string][] = [];
  for (const def of CONTEUDO.definicoes.values()) for (const estilo of Object.keys(def.leituras ?? {})) casos.push([def.base.id, estilo]);

  it('são as 160 leituras das 32 skills de classe (marco 40, D-165: a Troca e o Grito do Aventureiro)', () => {
    expect(casos).toHaveLength(160);
  });

  it.each(casos)('%s / %s muda a skill', (id, estilo) => {
    const leitura = CONTEUDO.definicoes.get(id)?.leituras?.[estilo];
    if (!leitura) throw new Error('sem leitura');
    const base = resolverHabilidade(ctx, id);
    const lida = resolverHabilidade(ctx, `${id}^${formaDoEixo(leitura.eixo)}10&${estilo}10`);
    if (!base || !lida) throw new Error('não compilou');
    expect(mecanica(lida)).not.toBe(mecanica(base));
    expect(leitura.texto.length).toBeGreaterThan(0);
  });
});
