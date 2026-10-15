// Marco 17 (15/10/2026, D-063): a nuvem falsa (a mesma interface da do Supabase) e o personagem da arena gravado no
// slot. Enviar exige login; baixar devolve o registro conferido; o retrato certificado troca só a progressão.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { contextoDaArena } from '../../src/arena/contexto-arena';
import { aplicarRetratoNoSave, pedidoDoPersonagem } from '../../src/coop/personagem';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { clonarEstado, criarEstado } from '../../src/core/estado';
import { criarJogador } from '../../src/entities/fabrica';
import { criarNuvemFalsa } from '../../src/plataforma/nuvem';
import { VERSAO_SCHEMA, type RegistroProgresso } from '../../src/save/esquema';
import { CONTEUDO } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function registro(slot: number, nivel = 1): RegistroProgresso {
  const estado = criarEstado({ semente: 1, faseId: 'fase-01' });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago'), 'mago'), 'j1', 4, 5, BALANCE_PADRAO);
  j.nivel = nivel;
  estado.entidades.push(j);
  return {
    versaoSchema: VERSAO_SCHEMA,
    slot,
    criadoEm: 1,
    atualizadoEm: 2,
    faseRef: { tipo: 'oficial', id: 'fase-01' },
    nomeFase: 'Salões da entrada',
    estado,
    estatisticas: { inimigosDerrotados: 0, mortes: 0 },
    fasesVisitadas: {},
    certificado: null,
  };
}

beforeEach(() => {
  const guardado = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => guardado.get(k) ?? null,
    setItem: (k: string, v: string) => guardado.set(k, v),
    removeItem: (k: string) => guardado.delete(k),
  });
  vi.stubGlobal('location', { reload: () => undefined, search: '' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('nuvem (falsa, mesma interface)', () => {
  it('sem login não envia; logado envia, lista e baixa o registro conferido', async () => {
    const nuvem = criarNuvemFalsa();
    expect(await nuvem.usuario()).toBeNull();
    await expect(nuvem.enviar(registro(2, 3))).rejects.toThrow('sem_login');
    await nuvem.entrar();
    expect(await nuvem.usuario()).not.toBeNull();
    await nuvem.enviar(registro(2, 3));
    expect(await nuvem.listar()).toEqual([{ slot: 2, nivel: 3, nomeFase: 'Salões da entrada', atualizadoEm: 2 }]);
    const baixado = obter(await nuvem.baixar(2), 'baixado');
    expect(baixado.slot).toBe(2);
    expect(baixado.estado.entidades[0]?.nivel).toBe(3);
    expect(await nuvem.baixar(1)).toBeNull();
    await nuvem.sair();
    expect(await nuvem.usuario()).toBeNull();
  });
});

describe('personagem da arena de volta ao slot', () => {
  it('aplicarRetratoNoSave troca nível, XP e bolsa; mantém fase, posição e o registro original', () => {
    const r = registro(1);
    const ctx = contextoDaArena();
    const retrato = obter(pedidoDoPersonagem(obter(r.estado.entidades[0], 'jogador')), 'retrato');
    retrato.nivel = 4;
    retrato.xp = 7;
    retrato.bolsa.ouro = 222;
    const novo = aplicarRetratoNoSave({ ...r, estado: clonarEstado(r.estado) }, retrato, ctx, 99);
    const j = obter(novo.estado.entidades[0], 'jogador');
    expect([j.nivel, j.xp, j.bolsa?.ouro]).toEqual([4, 7, 222]);
    expect([j.x, j.y]).toEqual([4, 5]);
    expect(j.hp).toBe(j.hpMax);
    expect(novo.faseRef).toEqual(r.faseRef);
    expect(r.estado.entidades[0]?.nivel).toBe(1);
    // A bolsa do slot é uma cópia (mexer no retrato depois não muda o save).
    retrato.bolsa.ouro = 1;
    expect(j.bolsa?.ouro).toBe(222);
  });
});
