import { describe, expect, it } from 'vitest';
import { criarEntidade, type NovaEntidade } from '../../src/entities/entidade';
import { bloqueia, celulaLivrePara, ordemRotativa, type RegrasColisao } from '../../src/world/colisao';

const PADRAO: RegrasColisao = { jogadorBloqueiaJogador: false, jogadorBloqueiaInimigo: false };
const ent = (id: string, tipo: NovaEntidade['tipo'], x = 0, y = 0) => criarEntidade({ id, tipo, x, y });

describe('regras de colisão (§2.3)', () => {
  it('a própria entidade nunca bloqueia', () => {
    const a = ent('a', 'inimigo');
    expect(bloqueia(a, a, PADRAO)).toBe(false);
  });

  it('inimigo × inimigo sempre bloqueia', () => {
    expect(bloqueia(ent('a', 'inimigo'), ent('b', 'inimigo'), PADRAO)).toBe(true);
  });

  it('jogador × jogador e jogador × inimigo seguem a regra do modo', () => {
    expect(bloqueia(ent('a', 'jogador'), ent('b', 'jogador'), PADRAO)).toBe(false);
    expect(bloqueia(ent('a', 'jogador'), ent('b', 'inimigo'), PADRAO)).toBe(false);
    const fechado = { jogadorBloqueiaJogador: true, jogadorBloqueiaInimigo: true };
    expect(bloqueia(ent('a', 'jogador'), ent('b', 'jogador'), fechado)).toBe(true);
    expect(bloqueia(ent('a', 'inimigo'), ent('b', 'jogador'), fechado)).toBe(true);
  });

  it('jogador com HP 0 não vira parede, nem contra avatar', () => {
    const morto = ent('m', 'jogador');
    morto.hp = 0;
    expect(bloqueia(ent('a', 'avatar'), morto, PADRAO)).toBe(false);
    expect(bloqueia(morto, ent('b', 'jogador'), { ...PADRAO, jogadorBloqueiaJogador: true })).toBe(false);
  });

  it('avatar sempre bloqueia, inclusive jogadores', () => {
    expect(bloqueia(ent('a', 'jogador'), ent('b', 'avatar'), PADRAO)).toBe(true);
  });

  // Marco 26 (D-104): sem passo, só a célula ocupada (a do centro do corpo) fica reservada.
  it('a célula ocupada fica reservada; a vizinha, não', () => {
    const parado = ent('a', 'inimigo', 1, 1);
    const outro = ent('b', 'inimigo', 3, 1);
    expect(celulaLivrePara(outro, 1, 1, [parado, outro], PADRAO)).toBe(false);
    expect(celulaLivrePara(outro, 2, 1, [parado, outro], PADRAO)).toBe(true);
  });
});

describe('ordem rotativa', () => {
  it('ordena por ID e gira o ponto de partida a cada tick', () => {
    const itens = [{ id: 'c' }, { id: 'a' }, { id: 'b' }];
    expect(ordemRotativa(itens, 0).map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(ordemRotativa(itens, 1).map((i) => i.id)).toEqual(['b', 'c', 'a']);
    expect(ordemRotativa(itens, 5).map((i) => i.id)).toEqual(['c', 'a', 'b']);
  });

  it('cada entidade é a primeira com a mesma frequência', () => {
    const itens = [{ id: 'x' }, { id: 'y' }, { id: 'z' }];
    const primeiros = new Map<string, number>();
    for (let t = 0; t < 300; t++) {
      const id = ordemRotativa(itens, t)[0]?.id ?? '';
      primeiros.set(id, (primeiros.get(id) ?? 0) + 1);
    }
    expect([...primeiros.values()]).toEqual([100, 100, 100]);
  });
});
