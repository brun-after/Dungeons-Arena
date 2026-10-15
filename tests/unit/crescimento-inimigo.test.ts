// Marco 15 (15/10/2026, D-061, §2.5): o inimigo cresce com o nível — Constituição e Força desde o 2, Inteligência a
// partir do 3, Destreza do 7, Sabedoria do 10 —, a vida sai da Constituição (com a % do balance) e o XP cresce.

import { describe, expect, it } from 'vitest';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { atributosDoInimigo, criarInimigo } from '../../src/entities/fabrica';
import { hpMaximo } from '../../src/progression/ficha';
import { CONTEUDO } from '../apoio/fases';

const goblin = () => {
  const p = CONTEUDO.presets.get('goblin');
  if (!p) throw new Error('goblin');
  return p;
};

describe('crescimento do inimigo por nível', () => {
  it('nível 1 é o neutro; os atributos entram nos níveis da regra', () => {
    expect(atributosDoInimigo(1, BALANCE_PADRAO)).toEqual({ forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, carisma: 10 });
    const n5 = atributosDoInimigo(5, BALANCE_PADRAO);
    const porNivel = (a: string) => BALANCE_PADRAO.inimigos.crescimento.find((c) => c.atributo === a)?.porNivel ?? 0;
    expect(n5.constituicao).toBe(10 + 4 * porNivel('constituicao'));
    expect(n5.forca).toBe(10 + 4 * porNivel('forca'));
    expect(n5.inteligencia).toBe(10 + 3 * porNivel('inteligencia'));
    expect(n5.destreza).toBe(10);
    const n10 = atributosDoInimigo(10, BALANCE_PADRAO);
    expect(n10.destreza).toBe(10 + 4 * porNivel('destreza'));
    expect(n10.sabedoria).toBe(10 + porNivel('sabedoria'));
    expect(n10.carisma).toBe(10);
  });

  it('a vida sai da Constituição do nível, com a % de vida dos inimigos; o XP cresce por nível', () => {
    const b = BALANCE_PADRAO;
    const e5 = criarInimigo(goblin(), 'g', 1, 1, b, { nivel: 5 });
    const esperado = Math.round((hpMaximo(goblin().hpBase, e5.atributos.constituicao, b.hp.hpAtributoMult, b.hp.dificuldadeMult) * b.inimigos.vidaPct) / 100);
    expect(e5.hpMax).toBe(esperado);
    expect(e5.hpMax).toBeGreaterThan(criarInimigo(goblin(), 'g', 1, 1, b).hpMax);
    expect(e5.xpBase).toBe(Math.round(goblin().xp * (1 + (b.inimigos.xpPorNivelPct / 100) * 4)));
    expect(e5.nivel).toBe(5);
  });
});
