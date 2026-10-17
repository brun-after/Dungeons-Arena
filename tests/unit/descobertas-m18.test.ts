// Marco 18 (17/10/2026, D-070): missões, origens raras, forja, eventos de fase e o diário de descobertas.

import { describe, expect, it } from 'vitest';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { simular } from '../../src/core/simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { entradasDoDiario, registrarDescobertas } from '../../src/progression/diario';
import { forjar } from '../../src/progression/forja';
import { idItemBase, lerIdItemBase } from '../../src/progression/gerar-item-base';
import { guardarItem } from '../../src/progression/inventario';
import { abateDe, processarMissoes, sortearOrigensRaras } from '../../src/progression/missoes';
import { proximaFase } from '../../src/save/sequencia';
import { catalogoDeGeracao, gerarFase } from '../../src/world/gerador';
import campanha from '../../src/data/campanha.json';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena() {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 11, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('arqueiro'), 'arqueiro'), 'j', 3, 3, ctx.balance);
  estado.entidades.push(j);
  const eventos: EventoSimulacao[] = [];
  return { ctx, estado, j, bolsa: obter(j.bolsa, 'bolsa'), eventos };
}

describe('missões', () => {
  it('Guardião do refúgio conta os refúgios gastos e entrega o Manto Lendário uma vez', () => {
    const c = cena();
    const ev = (n: number): EventoSimulacao[] => Array.from({ length: n }, () => ({ t: 'refugioUsado', tick: c.estado.tick, id: 'j', ateTick: 0 }));
    processarMissoes(c.estado, c.ctx, ev(9), [], c.eventos);
    expect(c.bolsa.missoesConcluidas).toEqual([]);
    processarMissoes(c.estado, c.ctx, ev(1), [], c.eventos);
    expect(c.bolsa.missoesConcluidas).toEqual(['guardiao_refugio']);
    const recompensa = c.bolsa.mochila.map((i) => lerIdItemBase(i.itemId)).find((p) => p?.base === 'manto');
    expect(recompensa?.forma).toBe('lendaria');
    processarMissoes(c.estado, c.ctx, ev(10), [], c.eventos);
    expect(c.eventos.filter((e) => e.t === 'missaoConcluida')).toHaveLength(1);
  });

  it('Céu limpo zera ao levar dano', () => {
    const c = cena();
    const esqueleto = criarInimigo(obter(CONTEUDO.presets.get('esqueleto'), 'esqueleto'), 'e1', 5, 5, c.ctx.balance);
    esqueleto.ultimoGolpe = { fonteId: 'j', chave: 'flecha_perfurante' };
    const abate = abateDe(c.ctx, c.j, esqueleto);
    for (let i = 0; i < 5; i++) processarMissoes(c.estado, c.ctx, [], [abate], c.eventos);
    expect(c.bolsa.missoes['ceu_limpo@teste']).toBe(5);
    processarMissoes(c.estado, c.ctx, [{ t: 'impacto', tick: 0, acaoId: 1, fonteId: 'e1', alvoId: 'j', habilidadeId: 'x', chave: 'x', dano: 3, cura: 0, d20: 10, mult: 1, falha: false, critico: false, imune: false, indice: 0, sinergias: [] }], [], c.eventos);
    expect(c.bolsa.missoes['ceu_limpo@teste']).toBeUndefined();
  });
});

describe('origens raras', () => {
  it('o golpe com Eco pode soltar o fragmento (20%): em muitas quedas, cai às vezes', () => {
    const c = cena();
    let quedas = 0;
    for (let i = 0; i < 200; i++) {
      const morto = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), `g${i}`, 5, 5, c.ctx.balance);
      // A Seta arcana com o caminho Eco (nível 5).
      morto.ultimoGolpe = { fonteId: 'j', chave: 'seta_arcana@5/brutal,eco' };
      const antes = c.eventos.length;
      sortearOrigensRaras(c.estado, c.ctx, abateDe(c.ctx, c.j, morto), c.eventos);
      if (c.eventos.slice(antes).some((e) => e.t === 'origemRara' && e.origem === 'fragmento_de_eco')) quedas++;
    }
    expect(quedas).toBeGreaterThan(15);
    expect(quedas).toBeLessThan(70);
  });
});

describe('forja', () => {
  it('sobe uma peça Lendária para a Última (mesma base, nível e semente) com fragmentos e ouro, só com a loja aberta', () => {
    const c = cena();
    const lendaria = idItemBase('arco', 'lendaria', 'gelo', 6, 77);
    guardarItem(c.bolsa, obter(CONTEUDO.itens.get(lendaria), 'arco'), 1, c.ctx.balance.inventario);
    guardarItem(c.bolsa, obter(CONTEUDO.itens.get('fragmento_eco'), 'fragmento'), 3, c.ctx.balance.inventario);
    c.bolsa.ouro = 500;
    const invId = obter(c.bolsa.mochila.find((i) => i.itemId === lendaria), 'entrada').invId;
    forjar(c.estado, c.ctx, c.j, 'ultima_forma', invId, c.eventos);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'itemRecusado', motivo: 'loja_fechada' });
    c.j.interacao = { tipo: 'loja', objetoId: 'l1', ateTick: 2 ** 31 - 1 };
    forjar(c.estado, c.ctx, c.j, 'ultima_forma', invId, c.eventos);
    expect(c.bolsa.mochila.find((i) => i.invId === invId)?.itemId).toBe(idItemBase('arco', 'ultima', 'gelo', 6, 77));
    expect(c.bolsa.ouro).toBe(100);
    expect(c.bolsa.mochila.some((i) => i.itemId === 'fragmento_eco')).toBe(false);
  });
});

describe('eventos de fase', () => {
  it('os eventos saem da semente; a fase sem evento é igual à de antes; o mercador e a sala secreta entram', () => {
    const g = { ...campanha.geradas, eventos: { lua_sangrenta: 100, mercador_errante: 100, sala_secreta: 100 } };
    const ref = proximaFase({ tipo: 'oficial', id: 'fase-02' }, ['fase-01', 'fase-02'], g, 20);
    if (ref?.tipo !== 'gerada') throw new Error('esperava gerada');
    expect(ref.params.eventos).toEqual(['lua_sangrenta', 'mercador_errante', 'sala_secreta']);
    const catalogo = catalogoDeGeracao(CONTEUDO, campanha.geradas.estoque);
    const sem = gerarFase({ ...ref.params, eventos: [] }, catalogo);
    const com = gerarFase(ref.params, catalogo);
    expect(com.mapa).toEqual(sem.mapa);
    expect(com.nome).toContain('Lua sangrenta');
    expect((com.objetos ?? []).filter((o) => o.tipo === 'loja')).toHaveLength(2);
    expect((com.objetos ?? []).some((o) => o.tipo === 'bau' && o.chave === 'chave_cripta')).toBe(true);
    expect(com.inimigos?.[0]?.nivel).toBe((sem.inimigos?.[0]?.nivel ?? 0) + 3);
  });
});

describe('diário de descobertas', () => {
  it('conta as entradas possíveis e anota a primeira vez (uma vez só)', () => {
    const c = cena();
    const todas = entradasDoDiario(c.ctx);
    expect(todas.length).toBeGreaterThan(150);
    expect(new Set(todas.map((e) => e.id)).size).toBe(todas.length);
    const evs: EventoSimulacao[] = [{ t: 'comboFeito', tick: 0, id: 'j', combo: 'saraivada', alvoId: null }];
    registrarDescobertas(c.estado, c.ctx, evs, c.eventos);
    registrarDescobertas(c.estado, c.ctx, evs, c.eventos);
    expect(c.bolsa.diario).toEqual(['combo:saraivada']);
    expect(c.eventos.filter((e) => e.t === 'descoberta')).toHaveLength(1);
  });

  it('na simulação, o item com forma na mochila vira entrada', () => {
    const c = cena();
    guardarItem(c.bolsa, obter(CONTEUDO.itens.get(idItemBase('espada', 'epica', 'fogo', 3, 5)), 'espada'), 1, c.ctx.balance.inventario);
    for (let i = 0; i < 31; i++) simular(c.estado, c.ctx, [], c.eventos, DT_MS);
    expect(c.bolsa.diario).toContain('item:espada:epica:fogo');
  });
});
