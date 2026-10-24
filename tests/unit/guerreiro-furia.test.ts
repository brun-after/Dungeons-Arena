// Marco 21 (23/10/2026, D-088): Guerreiro mais forte — cura ao abater, aura desde o nível 1 e a barra de fúria.
import { describe, expect, it } from 'vitest';
import { curvaDaAura, pulsarAura } from '../../src/combat/ajustes-classes';
import { acumularFuria, fracaoFuria, furiaAtual, multiplicadorFuria } from '../../src/combat/furia';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { aplicarImpacto } from '../../src/combat/golpe';
import { registrarParticipacao } from '../../src/combat/participacao';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { clonarEstado, criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { ticksDe } from '../../src/core/tempo';
import { criarEntidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { processarMortes } from '../../src/progression/morte';
import { personagemNoInicio } from '../../src/save/transicao';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null): T {
  if (v == null) throw Error('ausente');
  return v;
}

function cena(classe = 'guerreiro', nivel = 1) {
  const ctx = contexto(faseDeTexto(SALA_ABERTA, 'fase-02'));
  const estado = criarEstado({ semente: 7, faseId: ctx.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 3, 3, ctx.balance);
  j.nivel = nivel;
  j.autoAtaque = false;
  const alvo = criarEntidade({ id: 'a', tipo: 'inimigo', x: 4, y: 3, hpMax: 100000, nivel: 1, xpBase: 100 });
  estado.entidades.push(j, alvo);
  const eventos: EventoSimulacao[] = [];
  return { ctx, estado, j, alvo, eventos };
}

/** Um ataque básico que sempre acerta (d20 mínimo 20). */
function basico(c: ReturnType<typeof cena>): void {
  const hab = obter(habilidadeDoAtor(c.ctx, c.j, c.j.ataqueBasico));
  aplicarImpacto(c.estado, c.ctx, c.alvo, { acaoId: 1, hab, indice: 0, fonte: { ...fonteDaHabilidade(c.j, c.ctx, 0, hab), d20Minimo: 20 } }, c.eventos);
}

describe('aura do Guerreiro desde o nível 1', () => {
  it('curva: 3% de dano e 20% de cura no 1; 15% e 50% no 30', () => {
    const c = cena();
    expect(curvaDaAura(c.ctx, 1)).toEqual({ danoPct: 3, curaPct: 20 });
    expect(curvaDaAura(c.ctx, 30)).toEqual({ danoPct: 15, curaPct: 50 });
    const meio = curvaDaAura(c.ctx, 15);
    expect(meio.danoPct).toBeGreaterThan(8.7);
    expect(meio.curaPct).toBeCloseTo(20 + 30 * 14 / 29);
  });

  it('no nível 1 já fere em volta e cura; o pulso remoto também vale', () => {
    const c = cena();
    c.j.hp -= 50;
    const hp = c.j.hp;
    pulsarAura(c.estado, c.ctx, c.j, c.alvo, 1000, c.eventos);
    expect(c.alvo.hp).toBe(100000 - 30);
    expect(c.j.hp).toBe(hp + 6);
    const longe = criarEntidade({ id: 'b', tipo: 'inimigo', x: 12, y: 3, hpMax: 1000 });
    c.estado.entidades.push(longe);
    pulsarAura(c.estado, c.ctx, c.j, longe, 1000, c.eventos, true);
    expect(longe.hp).toBe(1000 - 30);
  });
});

describe('fúria', () => {
  it('cada básico que fere enche 12; com a barra cheia, as curas dobram', () => {
    const c = cena();
    for (let i = 0; i < 8; i++) basico(c);
    expect(furiaAtual(c.ctx, c.j, c.estado.tick)).toBe(96);
    expect(multiplicadorFuria(c.ctx, c.j, c.estado.tick)).toBe(1);
    basico(c);
    expect(furiaAtual(c.ctx, c.j, c.estado.tick)).toBe(100);
    expect(fracaoFuria(c.ctx, c.j, c.estado.tick)).toBe(1);
    expect(multiplicadorFuria(c.ctx, c.j, c.estado.tick)).toBe(2);
  });

  it('a aura cura o dobro com a fúria cheia', () => {
    const sem = cena();
    const com = cena();
    com.j.furia = { valor: 100, ultimoTick: 0 };
    for (const c of [sem, com]) {
      c.j.hp -= 50;
      pulsarAura(c.estado, c.ctx, c.j, c.alvo, 1000, c.eventos);
    }
    expect(com.j.hp - (com.j.hpMax - 50)).toBe(2 * (sem.j.hp - (sem.j.hpMax - 50)));
  });

  it('sem bater, segura 3 s e depois perde 20 por segundo', () => {
    const c = cena();
    c.j.furia = { valor: 100, ultimoTick: 0 };
    expect(furiaAtual(c.ctx, c.j, ticksDe(3000))).toBe(100);
    expect(furiaAtual(c.ctx, c.j, ticksDe(4000))).toBeCloseTo(80);
    expect(furiaAtual(c.ctx, c.j, ticksDe(10_000))).toBe(0);
    acumularFuria(c.ctx, c.j, ticksDe(4000));
    expect(c.j.furia.valor).toBeCloseTo(92);
  });

  it('só o Guerreiro tem fúria; o clone copia e a troca de fase zera', () => {
    const outro = cena('mago');
    acumularFuria(outro.ctx, outro.j, 0);
    expect(outro.j.furia).toBeUndefined();
    expect(fracaoFuria(outro.ctx, outro.j, 0)).toBeNull();
    const c = cena();
    acumularFuria(c.ctx, c.j, 0);
    const copia = obter(clonarEstado(c.estado).entidades.find((e) => e.id === 'j'));
    expect(copia.furia).toEqual(c.j.furia);
    expect(copia.furia).not.toBe(c.j.furia);
    expect(personagemNoInicio(c.j, { x: 1, y: 1 }).furia).toBeUndefined();
  });
});

describe('cura do Guerreiro ao abater', () => {
  function abate(furia: number, invocacao = false) {
    const c = cena();
    const modelo = obter(CONTEUDO.presets.get('goblin'));
    const npc = criarInimigo(modelo, 'npc', 5, 3, c.ctx.balance);
    if (invocacao) {
      npc.invocacao = {
        donoId: 'outro', expiraTick: 99_999, dominado: false, comportamento: 'agressivo', avatar: false, golpesRestantes: 0,
        abates: 0, criadoTick: 0, nivelDominacao: 0,
      };
    }
    c.estado.entidades.push(npc);
    c.j.hp = c.j.hpMax - 40;
    c.j.furia = { valor: furia, ultimoTick: 0 };
    npc.hp = 0;
    registrarParticipacao(npc, c.j.id, 0, c.ctx);
    processarMortes(c.estado, c.ctx, c.eventos);
    return c.j.hpMax - c.j.hp;
  }

  it('recupera metade da vida que falta; com a fúria cheia, toda', () => {
    expect(abate(0)).toBe(20);
    expect(abate(100)).toBe(0);
  });

  it('derrubar uma invocação não cura', () => {
    expect(abate(0, true)).toBe(40);
  });
});
