import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { digest } from '../../src/core/digest';
import { criarEstado, type EstadoJogo } from '../../src/core/estado';
import { criarJogador } from '../../src/entities/fabrica';
import { esquecerConexao, gravarNoBanco } from '../../src/plataforma/banco';
import { lerPreferencias, prepararPreferencias } from '../../src/plataforma/preferencias';
import { apagarSlot, carregarSlot, criarAutosave, gravarRegistro, listarSlots } from '../../src/plataforma/saves';
import {
  exportarRegistro,
  importarRegistro,
  lerRegistro,
  VERSAO_SCHEMA,
  type RegistroProgresso,
} from '../../src/save/esquema';
import { povoarFase } from '../../src/world/populacao';
import { CONTEUDO, contexto, faseOficial01 } from '../apoio/fases';
import { criarBotAleatorio, rodar } from '../sim/harness';

const ctx = contexto(faseOficial01());

/** Campanha jogada por um bot por alguns segundos: estado com mochila, inimigos, recargas e respawns. */
function estadoJogado(ticks = 600): EstadoJogo {
  const estado = criarEstado({ semente: 11, faseId: ctx.fase.id });
  const classe = CONTEUDO.classes.get('aventureiro');
  if (!classe) throw new Error('classe');
  const spawn = ctx.fase.spawns[0] ?? { x: 1, y: 1 };
  estado.entidades.push(criarJogador(classe, 'j1', spawn.x, spawn.y, ctx.balance));
  povoarFase(estado, ctx);
  rodar({ estado, ctx }, ticks, criarBotAleatorio(3));
  return estado;
}

function registro(slot: number, estado = estadoJogado()): RegistroProgresso {
  return {
    versaoSchema: VERSAO_SCHEMA,
    slot,
    criadoEm: 1,
    atualizadoEm: 2,
    faseRef: { tipo: 'oficial', id: 'fase-01' },
    nomeFase: ctx.fase.nome,
    estado,
    fasesVisitadas: {},
    estatisticas: { inimigosDerrotados: 3, mortes: 1 },
  };
}

describe('registro de save (puro)', () => {
  it('exportar e importar preserva o estado exatamente (mesmo digest)', () => {
    const r = registro(1);
    const lido = importarRegistro(exportarRegistro(r), 2);
    expect(lido.ok).toBe(true);
    if (!lido.ok) return;
    expect(lido.registro.slot).toBe(2);
    expect(digest(lido.registro.estado)).toBe(digest(r.estado));
    expect(lido.registro.estatisticas).toEqual(r.estatisticas);
  });

  it('recusa arquivo de outro formato, versão futura, slot fora, estado sem jogador e números não finitos', () => {
    const r = registro(1);
    expect(importarRegistro('{"nao":"save"}', 1)).toEqual({ ok: false, erro: 'formato' });
    expect(importarRegistro('não é json', 1)).toEqual({ ok: false, erro: 'formato' });
    expect(lerRegistro({ ...r, versaoSchema: VERSAO_SCHEMA + 1 })).toEqual({ ok: false, erro: 'versao_futura' });
    expect(lerRegistro({ ...r, slot: 9 })).toEqual({ ok: false, erro: 'slot' });
    expect(lerRegistro({ ...r, faseRef: { tipo: 'outra', id: 'x' } })).toEqual({ ok: false, erro: 'fase' });
    const semJogador = { ...r.estado, entidades: r.estado.entidades.filter((e) => e.bolsa === null) };
    expect(lerRegistro({ ...r, estado: semJogador })).toEqual({ ok: false, erro: 'estado' });
    expect(lerRegistro({ ...r, estatisticas: { mortes: Infinity } })).toEqual({ ok: false, erro: 'nao_finito' });
  });

  it('migra degrau a degrau até a versão alvo', () => {
    const r = registro(1);
    const v0 = { ...r, versaoSchema: 0, estatisticas: undefined, legado: true };
    const migracoes = [
      (x: Record<string, unknown>) => ({ ...x, estatisticas: { inimigosDerrotados: 0, mortes: 0 } }),
      (x: Record<string, unknown>) => ({ ...x, nomeFase: `${String(x.nomeFase)} (v2)` }),
    ];
    const lido = lerRegistro(v0, migracoes, 2);
    expect(lido.ok).toBe(true);
    if (!lido.ok) return;
    expect(lido.registro.versaoSchema).toBe(2);
    expect(lido.registro.nomeFase).toBe(`${ctx.fase.nome} (v2)`);
    // Sem o degrau que falta, recusa em vez de adivinhar.
    expect(lerRegistro(v0, [], 1)).toEqual({ ok: false, erro: 'formato' });
  });
});

describe('slots no IndexedDB', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    esquecerConexao();
  });

  it('grava, lista com resumo, carrega igual e apaga', async () => {
    const r = registro(2);
    await gravarRegistro(r);
    const slots = await listarSlots();
    expect(slots.map((s) => s.tipo)).toEqual(['vazio', 'ok', 'vazio']);
    expect(slots[1]).toMatchObject({ tipo: 'ok', resumo: { slot: 2, nivel: r.estado.entidades.find((e) => e.bolsa)?.nivel, nomeFase: ctx.fase.nome } });
    const lido = await carregarSlot(2);
    expect(lido !== null && lido !== 'invalido' && digest(lido.estado)).toBe(digest(r.estado));
    await apagarSlot(2);
    expect(await carregarSlot(2)).toBeNull();
  });

  it('save ilegível aparece como inválido e nunca como vazio', async () => {
    await gravarNoBanco('progresso', { slot: 3, versaoSchema: 1, lixo: true });
    expect((await listarSlots())[2]?.tipo).toBe('invalido');
    expect(await carregarSlot(3)).toBe('invalido');
  });

  it('autosave junta pedidos do mesmo instante e grava uma cópia, fora do tick', async () => {
    const estado = estadoJogado(60);
    let gravacoes = 0;
    const auto = criarAutosave({
      slot: 1,
      faseRef: { tipo: 'oficial', id: 'fase-01' },
      nomeFase: 'x',
      criadoEm: 1,
      fasesVisitadas: {},
      estado: () => {
        gravacoes++;
        return estado;
      },
      estatisticas: () => ({ inimigosDerrotados: 0, mortes: 0 }),
    });
    auto.pedir();
    auto.pedir();
    auto.pedir();
    expect(gravacoes).toBe(0);
    await new Promise((r) => setTimeout(r, 20));
    expect(gravacoes).toBe(1);
    const tickGravado = estado.tick;
    estado.tick += 100;
    const lido = await carregarSlot(1);
    expect(lido !== null && lido !== 'invalido' && lido.estado.tick).toBe(tickGravado);
    await auto.agora();
    const depois = await carregarSlot(1);
    expect(depois !== null && depois !== 'invalido' && depois.estado.tick).toBe(tickGravado + 100);
  });
});

describe('preferências no perfil', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    esquecerConexao();
  });

  it('migram do localStorage para o IndexedDB uma vez', async () => {
    const memoria = new Map<string, string>([['dungeons-arena:preferencias', JSON.stringify({ controle: 'dpad', camera: 'centralizada' })]]);
    globalThis.localStorage = {
      getItem: (k: string) => memoria.get(k) ?? null,
      setItem: (k: string, v: string) => void memoria.set(k, v),
      removeItem: (k: string) => void memoria.delete(k),
    } as unknown as Storage;
    await prepararPreferencias();
    expect(lerPreferencias()).toEqual({ controle: 'dpad', camera: 'centralizada' });
    expect(memoria.size).toBe(0);
    // Segunda carga: vem do banco, mesmo sem o localStorage.
    esquecerConexao();
    await prepararPreferencias();
    expect(lerPreferencias()).toEqual({ controle: 'dpad', camera: 'centralizada' });
  });
});
