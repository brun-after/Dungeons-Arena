// D-188 (19/11/2026): o cansaço das feras do Aventureiro — o fôlego que a montaria, os golpes, as skills de classe e
// o dano gastam; o descanso, a troca sozinha e o que fica sem fera; o X de cada uma.
import { describe, expect, it } from 'vitest';
import { companheiroDe } from '../../src/combat/companheiro';
import { fatorMontado, feraDe, gastoDaSkill, noNivel } from '../../src/combat/feras';
import { aplicarImpacto } from '../../src/combat/golpe';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { fatorDeVelocidade, movimentosDosBotoes } from '../../src/combat/movimento-classe';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { petDe } from '../../src/combat/pets';
import type { Comando } from '../../src/core/comandos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { simular } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const ctx = contexto(faseDeTexto(SALA_ABERTA));
const f = ctx.balance.ajustesClasses.aventureiro.feras;

function cena(nivel = 1) {
  const estado = criarEstado({ semente: 4, faseId: ctx.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get('aventureiro')), 'j', 4, 5, ctx.balance);
  j.nivel = nivel;
  estado.entidades.push(j);
  const eventos: EventoSimulacao[] = [];
  const passo = (cmds: Comando[] = [], ms = DT_MS) => {
    for (let t = 0; t < ms; t += DT_MS) simular(estado, ctx, t === 0 ? cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })) : [], eventos, DT_MS);
  };
  const orc = (x: number, y: number) => {
    const o = criarInimigo(obter(CONTEUDO.presets.get('orc')), `o${x}${y}`, x, y, ctx.balance);
    estado.entidades.push(o);
    return o;
  };
  /** Põe a fera da vez colada no dono (para montar). */
  const colar = () => {
    const c = obter(companheiroDe(estado, j));
    c.x = c.px = j.x;
    c.y = c.py = j.y + 1;
  };
  return { estado, j, eventos, passo, orc, colar };
}
const ids = (c: ReturnType<typeof cena>) => movimentosDosBotoes(ctx, c.j).map((m) => m.id);
const modo = (c: ReturnType<typeof cena>) => c.j.movimentoClasse?.modo?.tipo;

describe('o cansaço das feras (D-188)', () => {
  it('o Shift troca de fera, o V monta e o X chama; montado, o X vira o golpe da fera', () => {
    const c = cena();
    c.passo([], 100);
    expect(ids(c)).toEqual(['troca_de_companheiro', 'falcao_carrega', 'chamado']);
    c.colar();
    c.passo([{ t: 'movimentoClasse', botao: 1 }]);
    expect(modo(c)).toBe('voo');
    expect(fatorDeVelocidade(ctx, c.j)).toBeCloseTo(2);
    expect(ids(c)[2]).toBe('arremesso');
    c.passo([{ t: 'movimentoClasse', botao: 0 }], 700);
    expect(petDe(c.j)).toBe('lobo');
    expect(ids(c)).toEqual(['troca_de_companheiro', 'lobo', 'chamado']);
  });

  it('o Chamado traz a fera para junto do dono', () => {
    const c = cena();
    c.passo([], 100);
    const falcao = obter(companheiroDe(c.estado, c.j));
    falcao.x = falcao.px = c.j.x + 6;
    c.passo([{ t: 'movimentoClasse', botao: 2 }]);
    expect(Math.max(Math.abs(falcao.x - c.j.x), Math.abs(falcao.y - c.j.y))).toBeLessThanOrEqual(1);
  });

  it('o lobo leva o dono por 1 min no nível 1; cansado, desce o dono e a vez passa ao urso', () => {
    const c = cena();
    obter(c.j.bolsa).pet = 'lobo';
    c.passo([], 100);
    c.colar();
    c.passo([{ t: 'movimentoClasse', botao: 1 }]);
    expect(modo(c)).toBe('montado');
    c.passo([], 30_000);
    expect(feraDe(c.j, 'lobo').energia).toBeGreaterThan(40);
    expect(feraDe(c.j, 'lobo').energia).toBeLessThan(60);
    c.passo([], 31_000);
    expect(feraDe(c.j, 'lobo').cansado).toBe(true);
    expect(modo(c)).toBeUndefined();
    expect(petDe(c.j)).toBe('urso');
    expect(c.eventos.some((e) => e.t === 'feraCansou' && e.pet === 'lobo')).toBe(true);
    // Descansa 30 s e volta cheio.
    c.passo([], 31_000);
    expect(feraDe(c.j, 'lobo').cansado).toBe(false);
    expect(feraDe(c.j, 'lobo').energia).toBe(100);
  });

  it('a Disparada do lobo vai a +80% e gasta o dobro', () => {
    const c = cena();
    obter(c.j.bolsa).pet = 'lobo';
    c.passo([], 100);
    c.colar();
    c.passo([{ t: 'movimentoClasse', botao: 1 }]);
    c.passo([{ t: 'movimentoClasse', botao: 2 }]);
    expect(fatorDeVelocidade(ctx, c.j)).toBeCloseTo(1.8);
    c.passo([], 15_000);
    expect(feraDe(c.j, 'lobo').energia).toBeLessThan(52);
    expect(feraDe(c.j, 'lobo').energia).toBeGreaterThan(45);
  });

  it('o Mergulho gasta um terço do fôlego no nível 1 (3 por fôlego cheio)', () => {
    const c = cena();
    expect(100 / gastoDaSkill(ctx, c.j, 'falcao', 'mergulho')).toBeCloseTo(3, 0);
    expect(100 / gastoDaSkill(ctx, cena(100).j, 'falcao', 'mergulho')).toBeCloseTo(4, 0);
  });

  it('o golpe no lobo passa 20% à vida atual do dono e o resto cansa o lobo', () => {
    const c = cena();
    obter(c.j.bolsa).pet = 'lobo';
    c.passo([], 100);
    const lobo = obter(companheiroDe(c.estado, c.j));
    c.j.hp = c.j.hpMax = 1000;
    const o = c.orc(lobo.x + 1, lobo.y);
    const hab = obter(habilidadeDoAtor(ctx, o, o.ataqueBasico));
    aplicarImpacto(c.estado, ctx, lobo, { acaoId: 1, hab, indice: 0, fonte: { ...fonteDaHabilidade(o, ctx, 0, hab), d20Minimo: 20, multDano: 50 } }, c.eventos);
    expect(c.j.hpMax).toBe(1000);
    expect(c.j.hp).toBeLessThan(1000);
    expect(feraDe(c.j, 'lobo').energia).toBeLessThan(100);
  });

  it('o Arremesso acaba o voo num salto e o falcão descansa o dobro', () => {
    const c = cena();
    c.passo([], 100);
    c.colar();
    c.passo([{ t: 'movimentoClasse', botao: 1, dx: 1000, dy: 0 }]);
    c.passo([{ t: 'movimentoClasse', botao: 2, dx: 1000, dy: 0 }]);
    expect(modo(c)).toBe('salto');
    const fera = feraDe(c.j, 'falcao');
    expect(fera.cansado).toBe(true);
    expect(fera.descansoAteTick - c.estado.tick).toBeGreaterThan(ticksDe(noNivel(f.falcao.descansoMs, 1) * 1.9));
    expect(petDe(c.j)).toBe('lobo');
    c.passo([], 1500);
    expect(modo(c)).toBeUndefined();
  });

  it('o Círculo de Contenção barra a magia de fora e gasta todo o fôlego do urso', () => {
    const c = cena();
    obter(c.j.bolsa).pet = 'urso';
    c.passo([], 100);
    c.colar();
    c.passo([{ t: 'movimentoClasse', botao: 1 }]);
    c.passo([{ t: 'movimentoClasse', botao: 2 }]);
    expect(c.j.movimentoClasse?.contencao).toBeDefined();
    expect(feraDe(c.j, 'urso').energia).toBe(0);
    const mago = c.orc(c.j.x + 6, c.j.y);
    const hab = obter(habilidadeDoAtor(ctx, mago, mago.ataqueBasico));
    const antes = c.j.hp;
    aplicarImpacto(c.estado, ctx, c.j, { acaoId: 9, hab: { ...hab, tipoAtaque: 'magico' }, indice: 0, fonte: { ...fonteDaHabilidade(mago, ctx, 0, hab), d20Minimo: 20 } }, c.eventos);
    expect(c.j.hp).toBe(antes);
    expect(obter(c.j.movimentoClasse?.contencao).bloqueado).toBeGreaterThan(0);
    c.passo([], 3200);
    expect(c.j.movimentoClasse?.contencao).toBeUndefined();
    const urso = feraDe(c.j, 'urso');
    expect(urso.cansado).toBe(true);
    // Barrou uma magia: volta antes do descanso inteiro.
    expect(urso.descansoAteTick - c.estado.tick).toBeLessThan(ticksDe(noNivel(f.urso.descansoMs, 1)));
  });

  it('montados, uma vida só: o golpe no lobo cai inteiro no dono, 10% menor, e o lobo não cansa; no urso, 20%', () => {
    const c = cena();
    obter(c.j.bolsa).pet = 'lobo';
    c.passo([], 100);
    c.colar();
    c.passo([{ t: 'movimentoClasse', botao: 1 }]);
    expect(fatorMontado(ctx, c.j)).toBeCloseTo(0.9);
    const lobo = obter(companheiroDe(c.estado, c.j));
    c.j.hp = c.j.hpMax = 1000;
    const o = c.orc(c.j.x + 1, c.j.y);
    const hab = obter(habilidadeDoAtor(ctx, o, o.ataqueBasico));
    aplicarImpacto(c.estado, ctx, lobo, { acaoId: 1, hab, indice: 0, fonte: { ...fonteDaHabilidade(o, ctx, 0, hab), d20Minimo: 20, multDano: 50 } }, c.eventos);
    expect(c.j.hp).toBeLessThan(1000);
    expect(feraDe(c.j, 'lobo').energia).toBeGreaterThan(99);
    const u = cena();
    obter(u.j.bolsa).pet = 'urso';
    u.passo([], 100);
    u.colar();
    u.passo([{ t: 'movimentoClasse', botao: 1 }]);
    expect(fatorMontado(ctx, u.j)).toBeCloseTo(0.8);
    expect(fatorMontado(ctx, cena().j)).toBe(1);
  });

  it('montado, a fera morde a caça marcada ao alcance', () => {
    const c = cena();
    obter(c.j.bolsa).pet = 'lobo';
    c.passo([], 100);
    c.colar();
    c.passo([{ t: 'movimentoClasse', botao: 1 }]);
    const lobo = obter(companheiroDe(c.estado, c.j));
    const o = c.orc(c.j.x + 1, c.j.y);
    o.hp = o.hpMax = 500;
    c.passo([{ t: 'usarHabilidade', id: c.j.ataqueBasico, alvo: o.id }], 2500);
    expect(modo(c)).toBe('montado');
    expect(c.eventos.some((e) => e.t === 'impacto' && e.alvoId === o.id && e.fonteId === lobo.id && e.dano > 0)).toBe(true);
  });

  it('com as três cansadas, sem skill de classe: o básico fere e sai do Aventureiro', () => {
    const c = cena();
    c.passo([], 100);
    for (const p of ['falcao', 'lobo', 'urso'] as const) Object.assign(feraDe(c.j, p), { energia: 0, cansado: true, descansoAteTick: c.estado.tick + ticksDe(60_000) });
    const o = c.orc(c.j.x + 1, c.j.y);
    o.hp = o.hpMax = 500;
    c.passo([{ t: 'usarHabilidade', id: 'mergulho', alvo: o.id }], 100);
    expect(c.eventos.some((e) => e.t === 'acaoRecusada' && e.motivo === 'sem_companheiro')).toBe(true);
    c.passo([{ t: 'usarHabilidade', id: c.j.ataqueBasico, alvo: o.id }], 800);
    expect(c.eventos.some((e) => e.t === 'cacaMarcada')).toBe(false);
    expect(o.hp).toBeLessThan(500);
  });
});
