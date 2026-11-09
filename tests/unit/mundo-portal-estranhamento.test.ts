// 09/11/2026 (D-143): o Portal temporário do Mundo (registro, pedido, pontas no chão e travessia) e os monstros que
// só se atacam quando se estranham nas regiões com fogo amigo.

import { describe, expect, it } from 'vitest';
import { criarEstado } from '../../src/core/estado';
import { criarRng } from '../../src/core/rng';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { alvoDaIa, sortearEstranhamento } from '../../src/entities/ia-estranhamento';
import { fichaNova } from '../../src/mundo/ficha-mundo';
import { capitalDoAtlas, reinoDoConteudo } from '../../src/mundo/reino';
import { destinoDaPonta, gastarPortal, idDaPonta, PORTAL_TEMPORARIO, PortaisTemporarios, recusaDoPortal, sincronizarPortais } from '../../src/mundo/portais-temporarios';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | null | undefined): T {
  if (v == null) throw new Error('Conteúdo ausente');
  return v;
}

describe('D-143: Portal temporário', () => {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const reino = reinoDoConteudo(CONTEUDO);
  const inicio = `regiao:${reino.inicio}`;

  function jogador() {
    const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 3, 3, ctx.balance);
    const ficha = obter(fichaNova(ctx, reino, 'mago', 'Ana', 'p1'));
    return { j, ficha };
  }

  it('recusa sem o item, em dungeon e para região não descoberta; aceita com o item', () => {
    const { j, ficha } = jogador();
    const destino = { lugar: inicio, x: 10, y: 10 };
    expect(recusaDoPortal({ reino, lugar: inicio, e: j, ficha, destino })).toBe('sem_item');
    obter(j.bolsa).mochila.push({ invId: 'x1', itemId: PORTAL_TEMPORARIO, qtd: 1, ref: null });
    ficha.descobertas = [inicio];
    expect(recusaDoPortal({ reino, lugar: inicio, e: j, ficha, destino })).toBeNull();
    const masmorra = obter(reino.masmorras[0]);
    expect(recusaDoPortal({ reino, lugar: `masmorra:${masmorra.id}`, e: j, ficha, destino })).toBe('portal_dungeon');
    expect(recusaDoPortal({ reino, lugar: inicio, e: j, ficha, destino: { lugar: `masmorra:${masmorra.id}`, x: 1, y: 1 } })).toBe('destino_invalido');
    const longe = reino.regioes.find((r) => r.id !== reino.inicio && !ficha.descobertas.includes(`regiao:${r.id}`) && !capitalDoAtlas(reino, r.id));
    if (longe) expect(recusaDoPortal({ reino, lugar: inicio, e: j, ficha, destino: { lugar: `regiao:${longe.id}`, x: 1, y: 1 } })).toBe('nao_descoberto');
    gastarPortal(j);
    expect(obter(j.bolsa).mochila.some((m) => m.itemId === PORTAL_TEMPORARIO)).toBe(false);
  });

  it('as pontas aparecem no chão enquanto aberto; o dono e o grupo atravessam; fecha no prazo', () => {
    const portais = new PortaisTemporarios();
    const p = portais.abrir('p1', 'g1', [{ lugar: inicio, x: 3, y: 3 }, { lugar: 'regiao:outra', x: 20, y: 9 }], 60_000);
    const estado = criarEstado({ semente: 1, faseId: 'teste' });
    sincronizarPortais(estado, ctx, portais, inicio, 0);
    expect(estado.objetos.filter((o) => o.tipo === 'portal_temporario').map((o) => o.ref)).toEqual([idDaPonta(p.id, 0)]);
    expect(destinoDaPonta(portais, idDaPonta(p.id, 0), 'p1', null, 1000)).toEqual({ lugar: 'regiao:outra', x: 20, y: 9 });
    expect(destinoDaPonta(portais, idDaPonta(p.id, 1), 'p2', 'g1', 1000)).toEqual({ lugar: inicio, x: 3, y: 3 });
    expect(destinoDaPonta(portais, idDaPonta(p.id, 0), 'p3', 'g2', 1000)).toBe('portal_alheio');
    expect(destinoDaPonta(portais, idDaPonta(p.id, 0), 'p1', null, 60_000)).toBe('portal_fechado');
    sincronizarPortais(estado, ctx, portais, inicio, 60_000);
    expect(estado.objetos.some((o) => o.tipo === 'portal_temporario')).toBe(false);
  });

  it('abrir outro fecha o anterior do mesmo dono', () => {
    const portais = new PortaisTemporarios();
    const a = portais.abrir('p1', null, [{ lugar: inicio, x: 1, y: 1 }, { lugar: inicio, x: 9, y: 9 }], 60_000);
    portais.abrir('p1', null, [{ lugar: inicio, x: 2, y: 2 }, { lugar: inicio, x: 8, y: 8 }], 60_000);
    expect(portais.buscar(a.id, 0)).toBeNull();
    expect(portais.ativos(0)).toHaveLength(1);
  });

  it('o fragmento e o portal inteiro entram no loot de qualquer monstro do Mundo, o inteiro bem mais raro', () => {
    const r = ctx.balance.mundo.portalTemporario;
    expect(r.inteiroChancePct).toBeLessThan(r.fragmentoChancePct / 10);
    expect(CONTEUDO.itens.get(PORTAL_TEMPORARIO)?.valorBase).toBe(2000);
    const receita = obter([...CONTEUDO.forja.values()].find((x) => x.saida.tipo === 'item' && x.saida.item === PORTAL_TEMPORARIO));
    expect(receita.entrada).toEqual([{ item: 'fragmento_portal', qtd: 5 }]);
  });
});

describe('D-143: monstros que se estranham', () => {
  const base = contexto(faseDeTexto(SALA_ABERTA));
  const ctx = { ...base, modo: { ...base.modo, fogoAmigo: true } };
  const preset = obter(CONTEUDO.presets.get('goblin') ?? [...CONTEUDO.presets.values()].find((p) => p.arquetipo !== 'boss'));

  function cena() {
    const estado = criarEstado({ semente: 1, faseId: 'teste' });
    const a = criarInimigo(preset, 'a', 3, 3, ctx.balance);
    const b = criarInimigo(preset, 'b', 4, 3, ctx.balance);
    estado.entidades.push(a, b);
    return { estado, a, b };
  }

  it('com fogo amigo, um monstro não mira o outro sem se estranharem', () => {
    const { estado, a, b } = cena();
    expect(alvoDaIa(estado, ctx, a, b)).toBe(false);
    a.ia = { ...(a.ia ?? {}), estranhoId: 'b', estranhoAteTick: estado.tick + 100 } as NonNullable<typeof a.ia>;
    expect(alvoDaIa(estado, ctx, a, b)).toBe(true);
    // O outro também revida (o estranhamento vale para os dois).
    expect(alvoDaIa(estado, ctx, b, a)).toBe(true);
  });

  it('a chance é de 10% fora de perseguição (em média, num número grande de sorteios)', () => {
    let brigas = 0;
    const n = 400;
    for (let i = 0; i < n; i++) {
      const { estado, a } = cena();
      estado.tick = 0;
      const ia = { modo: 'patrulha', alvoId: null, rng: criarRng(i * 7919 + 1) } as unknown as NonNullable<typeof a.ia>;
      if (sortearEstranhamento(estado, ctx, a, ia)) brigas++;
    }
    expect(brigas / n).toBeGreaterThan(0.04);
    expect(brigas / n).toBeLessThan(0.18);
  });
});
