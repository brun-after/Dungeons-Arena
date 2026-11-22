// D-204 (22/11/2026): a caça solta na troca de fera e no Chamado (o X), e as ultimates do Aventureiro trazem cópias da
// fera ativa no lugar das criaturas; com uma cópia viva, o dano na fera chega ao dono a 1/3.
import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { ultimateDe } from '../../src/combat/carga-ultimate';
import { companheiroDe } from '../../src/combat/companheiro';
import { invocar } from '../../src/combat/efeitos-fluxo';
import { aplicarImpacto } from '../../src/combat/golpe';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { ehCopiaDoPet, fatorDasCopias, petDoCompanheiro } from '../../src/combat/pets';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import type { Comando } from '../../src/core/comandos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { simular } from '../../src/core/simulacao';
import { vivo } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const ctx = contexto(faseDeTexto(SALA_ABERTA));

function cena(pet: 'falcao' | 'lobo' | 'urso' = 'lobo') {
  const estado = criarEstado({ semente: 4, faseId: ctx.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get('aventureiro')), 'j', 4, 5, ctx.balance);
  obter(j.bolsa).pet = pet;
  j.hp = j.hpMax = 999;
  // Sem o ataque automático: o básico do dono marcaria a presa de novo quando ela chega perto.
  j.autoAtaque = false;
  estado.entidades.push(j);
  const eventos: EventoSimulacao[] = [];
  const passo = (cmds: Comando[] = [], ms = DT_MS) => {
    for (let t = 0; t < ms; t += DT_MS) simular(estado, ctx, t === 0 ? cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })) : [], eventos, DT_MS);
  };
  const orc = (x: number, y: number) => {
    const o = criarInimigo(obter(CONTEUDO.presets.get('orc')), `o${String(x)}${String(y)}`, x, y, ctx.balance);
    o.hp = o.hpMax = 999;
    estado.entidades.push(o);
    return o;
  };
  passo([], 100);
  return { estado, j, eventos, passo, orc };
}

const mordidasEm = (c: ReturnType<typeof cena>, alvoId: string, desde: number) =>
  c.eventos.filter((e) => e.t === 'impacto' && e.alvoId === alvoId && e.tick > desde && e.fonteId !== 'j').length;

describe('a caça solta (D-204)', () => {
  it('a troca de fera solta a caça: a que chega não morde a presa', () => {
    const c = cena('lobo');
    const o = c.orc(c.j.x + 1, c.j.y);
    c.passo([{ t: 'usarHabilidade', id: c.j.ataqueBasico, alvo: o.id }], 600);
    expect(c.j.cacaMarcada).toBe(o.id);
    c.passo([{ t: 'movimentoClasse', botao: 0 }], 100);
    expect(c.j.cacaMarcada ?? null).toBeNull();
    const desde = c.estado.tick;
    c.passo([], 3000);
    expect(mordidasEm(c, o.id, desde)).toBe(0);
  });

  it('o X (o Chamado) solta a caça e a fera volta para junto do dono', () => {
    const c = cena('lobo');
    const o = c.orc(c.j.x + 4, c.j.y);
    c.j.cacaMarcada = o.id;
    c.j.cacaAteTick = c.estado.tick + 1000;
    c.passo([], 400);
    expect(c.j.cacaMarcada).toBe(o.id);
    c.passo([{ t: 'movimentoClasse', botao: 2 }], 100);
    expect(c.j.cacaMarcada ?? null).toBeNull();
    const desde = c.estado.tick;
    c.passo([], 3000);
    expect(mordidasEm(c, o.id, desde)).toBe(0);
    const lobo = obter(companheiroDe(c.estado, c.j));
    expect(Math.max(Math.abs(lobo.x - c.j.x), Math.abs(lobo.y - c.j.y))).toBeLessThanOrEqual(2);
  });
});

describe('as cópias da fera na ultimate (D-204)', () => {
  it('a ultimate que invocava duas criaturas traz duas cópias da fera ativa, pelo mesmo tempo', () => {
    const c = cena('urso');
    const bolsa = obter(c.j.bolsa);
    const comPapel = (p: string, fora?: string) => obter([...CONTEUDO.definicoes.values()].find((d) => d.base.papel === p && d.base.id !== fora && !d.base.tags.includes('ultimate') && !d.interna)?.base.id);
    bolsa.barra[0] = comPapel('dano');
    bolsa.barra[1] = comPapel('invocacao');
    expect(ultimateDe(ctx, c.j)?.id).toBe('ult_exercito_em_furia');
    const o = c.orc(c.j.x + 2, c.j.y);
    c.j.cargaUltimate = ctx.balance.ultimate.max;
    c.j.mana = c.j.manaMax = 999;
    c.passo([{ t: 'usarUltimate', alvo: o.id }], 1500);
    const copias = c.estado.entidades.filter((e) => vivo(e) && ehCopiaDoPet(e));
    expect(copias).toHaveLength(2);
    for (const e of copias) {
      expect(petDoCompanheiro(e)).toBe('urso');
      expect(e.invocacao?.comportamento).toBe('companheiro');
      expect(e.invocacao?.companheiro ?? false).toBe(false);
      expect(e.hpMax).toBeGreaterThan(1);
      const ms = (obter(e.invocacao).expiraTick - obter(e.invocacao).criadoTick) * DT_MS;
      expect(ms).toBeGreaterThanOrEqual(6000);
      expect(ms).toBeLessThan(10_000);
    }
    expect(c.estado.entidades.some((e) => e.preset === 'lobo_espiritual')).toBe(false);
  });

  it('as cópias caçam a marca do dono como a fera', () => {
    const c = cena('lobo');
    invocar(c.estado, ctx, c.j, { ...construirEfeito('invocar_temporario', { ref: 'lobo_espiritual', valor: 2, duracaoMs: 8000 }), copiaDoPet: true }, c.eventos);
    const o = c.orc(c.j.x + 3, c.j.y);
    c.j.cacaMarcada = o.id;
    c.j.cacaAteTick = c.estado.tick + 1000;
    const copias = c.estado.entidades.filter(ehCopiaDoPet).map((e) => e.id);
    c.passo([], 3000);
    expect(c.eventos.some((e) => e.t === 'impacto' && e.alvoId === o.id && copias.includes(e.fonteId))).toBe(true);
  });

  it('com uma cópia viva, o dano na fera chega ao dono a 1/3', () => {
    const perda = (comCopia: boolean) => {
      const c = cena('urso');
      if (comCopia) invocar(c.estado, ctx, c.j, { ...construirEfeito('invocar_temporario', { ref: 'lobo_espiritual', valor: 1, duracaoMs: 8000 }), copiaDoPet: true }, c.eventos);
      const urso = obter(companheiroDe(c.estado, c.j));
      const o = criarInimigo(obter(CONTEUDO.presets.get('orc')), 'oz', 1, 1, ctx.balance);
      const hab = obter(habilidadeDoAtor(ctx, o, o.ataqueBasico));
      const antes = c.j.hp;
      aplicarImpacto(c.estado, ctx, urso, { acaoId: 1, hab, indice: 0, fonte: { ...fonteDaHabilidade(o, ctx, 0, hab), d20Minimo: 20, multDano: 30 } }, c.eventos);
      return { perda: antes - c.j.hp, fator: fatorDasCopias(c.estado, ctx, c.j) };
    };
    const sem = perda(false);
    const com = perda(true);
    expect(sem.fator).toBe(1);
    expect(com.fator).toBeCloseTo(1 / 3);
    expect(sem.perda).toBeGreaterThan(6);
    expect(Math.abs(com.perda - sem.perda / 3)).toBeLessThanOrEqual(2);
  });
});
