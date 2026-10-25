// Marco 24 (24/10/2026, D-094): o Frenesi do Guerreiro v1.2 — a fúria cheia liga +20% de dano, +15% de velocidade do
// básico e as variantes das skills de classe, sem resistência contra grupos; no fim, a barra zera.
import { describe, expect, it } from 'vitest';
import { cargaDe } from '../../src/combat/carga-ultimate';
import { emFrenesi, furiaAtual, velocidadeFrenesiPct } from '../../src/combat/furia';
import { protecaoInicial } from '../../src/combat/ajustes-classes';
import { chaveDoAtor } from '../../src/combat/perfil';
import { lerComando } from '../../src/arena/protocolo';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena() {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 11, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 3, 5, ctx.balance);
  j.nivel = 10;
  const b = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'b', 4, 5, ctx.balance);
  const c = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'c', 3, 6, ctx.balance);
  estado.entidades.push(j, b, c);
  const eventos: EventoSimulacao[] = [];
  const tick = (cmd?: Parameters<typeof lerComando>[0]) => {
    simular(estado, ctx, cmd ? [{ tick: estado.tick, entidadeId: 'j', cmd: obter(lerComando(cmd)) }] : [], eventos, DT_MS);
  };
  return { ctx, estado, j, eventos, tick };
}

describe('Frenesi (D-094)', () => {
  it('a fúria cheia liga o Frenesi, enche a ultimate e, no fim, zera a barra', () => {
    const { ctx, estado, j, tick } = cena();
    const r = ctx.balance.ajustesClasses.guerreiro.furia;
    j.furia = { valor: r.max - 1, ultimoTick: 0 };
    tick({ t: 'selecionarAlvo', alvo: 'b' });
    for (let i = 0; i < 300 && !emFrenesi(j, estado.tick); i++) tick();
    expect(emFrenesi(j, estado.tick)).toBe(true);
    expect(j.efeitos.some((f) => f.tipo === 'frenesi' && f.ateTick > estado.tick)).toBe(true);
    expect(cargaDe(j)).toBeGreaterThanOrEqual(ctx.balance.ultimate.classe.furiaCheia.valor);
    expect(furiaAtual(ctx, j, estado.tick)).toBe(r.max);
    expect(velocidadeFrenesiPct(ctx, j, estado.tick)).toBe(r.frenesi.velocidadeAtaquePct);
    expect(chaveDoAtor(ctx, j, 'redemoinho', estado.tick)).toContain('~frenesi');
    const fim = obter(obter(j.furia).frenesiAteTick);
    j.autoAtaque = false;
    while (estado.tick < fim + ticksDe(100)) tick();
    expect(emFrenesi(j, estado.tick)).toBe(false);
    expect(furiaAtual(ctx, j, estado.tick)).toBe(0);
    expect(chaveDoAtor(ctx, j, 'redemoinho', estado.tick)).not.toContain('~frenesi');
  });

  it('no Frenesi, a resistência contra grupos vai a zero', () => {
    const { ctx, estado, j } = cena();
    const b = obter(estado.entidades.find((e) => e.id === 'b'));
    const com = protecaoInicial(estado, ctx, j, b);
    expect(com).toBeCloseTo(1 - ctx.balance.ajustesClasses.guerreiro.grupoReducaoMaxPct / 100, 5);
    j.furia = { valor: 100, ultimoTick: estado.tick, frenesiAteTick: estado.tick + 100 };
    expect(protecaoInicial(estado, ctx, j, b)).toBe(1);
  });
});
