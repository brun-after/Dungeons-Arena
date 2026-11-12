// Marco 39 (12/11/2026, D-145): o que travava no nível 100 (ids de item e de skill gerada, recompensa de missão) e o
// loot do inimigo renascido no Mundo.
import { describe, expect, it } from 'vitest';
import { idGerada, lerIdGerada } from '../../src/combat/chave-habilidade';
import { BALANCE_PADRAO, type Balance } from '../../src/core/contexto';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarInimigo } from '../../src/entities/fabrica';
import { idItemBase, lerIdItemBase } from '../../src/progression/gerar-item-base';
import { idItemGerado, lerIdItemGerado } from '../../src/progression/gerar-item';
import { idDaRecompensa } from '../../src/progression/missoes';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

describe('ids no nível 100', () => {
  it('item gerado, item base e skill gerada aceitam o nível 100', () => {
    expect(lerIdItemGerado(idItemGerado('espada', 100, 'raro', 12345))?.nivel).toBe(100);
    expect(lerIdItemBase(idItemBase('espada', 'comum', null, 100, 777))?.nivel).toBe(100);
    expect(lerIdGerada(idGerada(42, 100))?.nivel).toBe(100);
  });

  it('a recompensa de missão sai no nível de quem recebe, até o máximo dos itens', () => {
    const r = { base: 'espada', forma: 'comum' as const, elemento: null };
    const id = idDaRecompensa(r, 87, 'x', BALANCE_PADRAO.itensGerados.nivelMax);
    expect(lerIdItemBase(id)?.nivel).toBe(87);
    expect(lerIdItemBase(idDaRecompensa(r, 140, 'x', 100))?.nivel).toBe(100);
  });
});

describe('loot do renascido', () => {
  const balance: Balance = { ...BALANCE_PADRAO, drops: { ...BALANCE_PADRAO.drops, chanceOrbeHp: 1 } };
  function morrer(modoId: string): number {
    const ctx = contexto(faseDeTexto(SALA_ABERTA), balance, modoId);
    const estado = criarEstado({ semente: 7, faseId: 'teste' });
    const goblin = criarInimigo(obter(CONTEUDO.presets.get('goblin')), 'g', 5, 5, balance);
    goblin.abates = 2;
    goblin.hp = 0;
    estado.entidades.push(goblin);
    const eventos: EventoSimulacao[] = [];
    simular(estado, ctx, [], eventos, DT_MS);
    return estado.objetos.length;
  }

  it('na campanha o renascido não solta nada (§3.6); no Mundo, solta', () => {
    expect(morrer('campanha')).toBe(0);
    expect(morrer('mundo')).toBeGreaterThan(0);
  });
});
