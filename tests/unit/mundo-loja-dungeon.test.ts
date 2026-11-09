// 09/11/2026 (D-144): cada dungeon tem a própria loja, melhor que a da vila, e renova toda quarta-feira.

import { describe, expect, it } from 'vitest';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { estoqueSemanalDaDungeon, semanaDaLoja } from '../../src/mundo/lojas-mundo';
import { lerLugar } from '../../src/mundo/lugares';
import { territorioDoLugar, type Reino } from '../../src/mundo/reino';
import { SalaMundo } from '../../src/mundo/sala-mundo';
import { CONTEUDO } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const REGRAS = BALANCE_PADRAO.mundo.lojaDungeon;
const REINO: Reino = obter(CONTEUDO.reinos.get('reino_central'), 'reino');
const MASMORRAS = REINO.regioes.flatMap((r) => r.estruturas.filter((e) => e.destino.tipo === 'masmorra').map((e) => e.destino.id));
const masmorra = (id: string) => {
  const l = obter(lerLugar(REINO, `masmorra:${id}`), id);
  if (l.tipo !== 'masmorra') throw new Error(id);
  return l.masmorra;
};
const estoque = (id: string, semana: number) => estoqueSemanalDaDungeon(CONTEUDO, territorioDoLugar(REINO, id), masmorra(id), semana, REGRAS);
// Quarta-feira, 11/11/2026, 00:00 em Brasília (03:00 UTC).
const QUARTA = Date.UTC(2026, 10, 11, 3, 0, 0);

describe('loja das dungeons (D-144)', () => {
  it('a semana vira na quarta à meia-noite de Brasília', () => {
    expect(semanaDaLoja(QUARTA, REGRAS)).toBe(semanaDaLoja(QUARTA - 1, REGRAS) + 1);
    expect(semanaDaLoja(QUARTA + 7 * 86_400_000 - 1, REGRAS)).toBe(semanaDaLoja(QUARTA, REGRAS));
    expect(semanaDaLoja(QUARTA + 7 * 86_400_000, REGRAS)).toBe(semanaDaLoja(QUARTA, REGRAS) + 1);
  });

  it('cada dungeon tem o próprio estoque, igual na semana e diferente na seguinte', () => {
    expect(MASMORRAS.length).toBeGreaterThan(1);
    const [a, b] = MASMORRAS as [string, string];
    const s = semanaDaLoja(QUARTA, REGRAS);
    expect(estoque(a, s)).toEqual(estoque(a, s));
    expect(estoque(a, s)).not.toEqual(estoque(b, s));
    expect(estoque(a, s)).not.toEqual(estoque(a, s + 1));
  });

  it('é melhor que a loja da vila: incomuns e raros garantidos, e às vezes épico ou lendário', () => {
    const raridades = new Map<string, number>();
    for (const id of MASMORRAS) {
      for (let s = 0; s < 40; s++) {
        const lista = estoque(id, s);
        expect(lista).toContain('pergaminho_retorno');
        const itens = lista.map((x) => obter(CONTEUDO.itens.get(x), x));
        expect(itens.filter((i) => i.raridade === 'raro').length).toBeGreaterThanOrEqual(REGRAS.raros);
        for (const i of itens) {
          expect(i.valorBase).toBeGreaterThan(0);
          if (i.id !== 'pergaminho_retorno') expect(i.tipo).not.toBe('chave');
          raridades.set(i.raridade, (raridades.get(i.raridade) ?? 0) + 1);
        }
      }
    }
    expect(raridades.get('epico') ?? 0).toBeGreaterThan(0);
    expect(raridades.get('lendario') ?? 0).toBeGreaterThan(0);
  });

  it('a sala da dungeon aplica o estoque da semana à loja', () => {
    const id = obter(MASMORRAS[0], 'masmorra');
    const lugar = obter(lerLugar(REINO, `masmorra:${id}`), 'lugar');
    const sala = new SalaMundo(REINO, lugar, CONTEUDO, { semente: 1, agora: () => QUARTA });
    const lojas = sala.estado.objetos.filter((o) => o.tipo === 'loja');
    for (const o of lojas) expect(o.itens).toEqual(estoque(id, semanaDaLoja(QUARTA, REGRAS)));
  });
});
