// Aceleração, recuo do ataque de longe e fôlego de caça (04/11/2026, D-132).
import { describe, expect, it } from 'vitest';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { alcanceDe } from '../../src/combat/acao';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { DT_MS } from '../../src/core/loop';
import { simular } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import {
  aplicarRecuoDeDistancia,
  bonusDeCacaPct,
  fatorDoImpulso,
  integrarEntidade,
  recuoAgoraPct,
  recuoDaDistanciaPct,
  velocidade,
} from '../../src/world/movimento';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v == null) throw new Error(`${nome} ausente`);
  return v;
}

const ctx = contexto(faseDeTexto(SALA_ABERTA));
const acel = ctx.balance.movimento.aceleracao;
const recuo = ctx.balance.movimento.recuoDistancia;
const caca = ctx.balance.ia.caca;

function cena() {
  const estado = criarEstado({ semente: 5, faseId: ctx.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get('arqueiro'), 'classe'), 'j', 2, 5, ctx.balance);
  const orc = criarInimigo(obter(CONTEUDO.presets.get('orc'), 'orc'), 'o', 2, 2, ctx.balance);
  estado.entidades.push(j, orc);
  const eventos: EventoSimulacao[] = [];
  const andar = (e: Entidade, ms: number) => {
    for (let t = 0; t < ms; t += DT_MS) {
      integrarEntidade(e, estado, ctx, eventos, DT_MS);
      estado.tick++;
    }
  };
  return { estado, j, orc, eventos, andar };
}

/** Células por tick no pico, para quem anda reto e sem efeitos. */
const passoNoPico = (e: Entidade) =>
  (velocidade(e.atributos.destreza, ctx.balance.movimento.velocidadeBaseMs, false, ctx.balance.movimento.velocidadeMaxMult) * DT_MS) / 1000;

describe('aceleração dos personagens (D-132)', () => {
  it('sai com a velocidade inicial e chega ao pico na rampa', () => {
    const c = cena();
    c.j.direcao = 'E';
    const x0 = c.j.px;
    c.andar(c.j, DT_MS);
    expect(c.j.px - x0).toBeCloseTo(passoNoPico(c.j) * (acel.inicialPct / 100), 6);
    c.andar(c.j, acel.rampaMs);
    expect(c.j.impulso).toBe(1);
    expect(fatorDoImpulso(c.j, ctx)).toBe(1);
    const x1 = c.j.px;
    c.andar(c.j, DT_MS);
    expect(c.j.px - x1).toBeCloseTo(passoNoPico(c.j), 6);
  });

  it('parar, travar contra a parede ou ser atordoado zera o impulso', () => {
    const c = cena();
    c.j.direcao = 'E';
    c.andar(c.j, acel.rampaMs + 50);
    expect(c.j.impulso).toBe(1);
    c.j.direcao = 'parado';
    c.andar(c.j, DT_MS);
    expect(c.j.impulso).toBe(0);
    c.j.direcao = 'O';
    c.andar(c.j, 3000);
    expect(c.j.impulso).toBe(0);
  });

  it('a lentidão em curso consome o impulso, na proporção da lentidão', () => {
    const c = cena();
    c.j.direcao = 'E';
    c.andar(c.j, acel.rampaMs + 50);
    c.j.recuoPct = 50;
    c.j.recuoAteTick = c.estado.tick + ticksDe(250);
    c.andar(c.j, 250);
    // 4/s × 0,5 × 0,25 s = 0,5 de impulso perdido.
    expect(obter(c.j.impulso, 'impulso')).toBeCloseTo(1 - acel.perdaPorLentidaoPorS * 0.5 * 0.25, 1);
  });

  it('monstros não têm arranque: andam no pico desde o primeiro passo', () => {
    const c = cena();
    c.orc.direcao = 'S';
    const y0 = c.orc.py;
    c.andar(c.orc, DT_MS);
    expect(c.orc.py - y0).toBeCloseTo(passoNoPico(c.orc), 6);
    expect(c.orc.impulso).toBeUndefined();
  });
});

describe('recuo de quem ataca de longe (D-132)', () => {
  it('cresce com a distância além do limiar, até o teto', () => {
    expect(recuoDaDistanciaPct(ctx, 1)).toBe(0);
    expect(recuoDaDistanciaPct(ctx, recuo.aPartirDeCelulas)).toBe(0);
    expect(recuoDaDistanciaPct(ctx, recuo.aPartirDeCelulas + 2)).toBe(2 * recuo.porCelulaPct);
    expect(recuoDaDistanciaPct(ctx, 99)).toBe(recuo.maxPct);
  });

  it('vale só para personagens, pela duração, e guarda o mais forte', () => {
    const c = cena();
    aplicarRecuoDeDistancia(c.j, { x: c.j.x + 8, y: c.j.y }, c.estado.tick, ctx);
    const forte = recuoDaDistanciaPct(ctx, 8);
    expect(recuoAgoraPct(c.j, c.estado.tick)).toBe(forte);
    aplicarRecuoDeDistancia(c.j, { x: c.j.x + 5, y: c.j.y }, c.estado.tick + 1, ctx);
    expect(recuoAgoraPct(c.j, c.estado.tick + 1)).toBe(forte);
    expect(recuoAgoraPct(c.j, c.estado.tick + ticksDe(recuo.duracaoMs) + 1)).toBe(0);
    aplicarRecuoDeDistancia(c.orc, { x: c.orc.x + 8, y: c.orc.y }, c.estado.tick, ctx);
    expect(recuoAgoraPct(c.orc, c.estado.tick)).toBe(0);
  });

  it('o tiro do arqueiro de longe o deixa lento ao sair', () => {
    const estado = criarEstado({ semente: 9, faseId: ctx.fase.id });
    const j = criarJogador(obter(CONTEUDO.classes.get('arqueiro'), 'classe'), 'j', 1, 5, ctx.balance);
    const boneco = criarInimigo(obter(CONTEUDO.presets.get('boneco'), 'boneco'), 'b', 8, 5, ctx.balance);
    estado.entidades.push(j, boneco);
    const eventos: EventoSimulacao[] = [];
    simular(estado, ctx, [{ tick: estado.tick, entidadeId: 'j', cmd: { t: 'selecionarAlvo', alvo: 'b' } }], eventos, DT_MS);
    for (let i = 0; i < 120 && !eventos.some((e) => e.t === 'acaoIniciada' && e.atorId === 'j'); i++) simular(estado, ctx, [], eventos, DT_MS);
    for (let i = 0; i < 60 && recuoAgoraPct(j, estado.tick) === 0; i++) simular(estado, ctx, [], eventos, DT_MS);
    expect(recuoAgoraPct(j, estado.tick)).toBe(recuoDaDistanciaPct(ctx, 7));
  });
});

describe('fôlego de caça (D-132)', () => {
  it('sobe depois da carência até o teto, mais o bônus por nível', () => {
    const c = cena();
    c.orc.ia = null;
    simular(c.estado, ctx, [], c.eventos, DT_MS);
    const ia = obter(obter(buscarEntidade(c.estado, 'o'), 'orc').ia, 'ia');
    ia.modo = 'perseguindo';
    ia.cacaDesdeTick = c.estado.tick;
    ia.cacaNiveis = 4;
    const em = (ms: number) => ({ ...c.estado, tick: c.estado.tick + ticksDe(ms) });
    expect(bonusDeCacaPct(c.orc, em(caca.carenciaMs - 100), ctx)).toBe(0);
    const nivel = Math.min(caca.nivelMaxPct, 4 * caca.porNivelPct);
    expect(bonusDeCacaPct(c.orc, em(caca.carenciaMs), ctx)).toBeCloseTo(nivel, 6);
    expect(bonusDeCacaPct(c.orc, em(caca.carenciaMs + caca.rampaMs / 2), ctx)).toBeCloseTo(caca.maxPct / 2 + nivel, 1);
    expect(bonusDeCacaPct(c.orc, em(caca.carenciaMs + caca.rampaMs * 3), ctx)).toBeCloseTo(caca.maxPct + nivel, 6);
    ia.modo = 'patrulha';
    expect(bonusDeCacaPct(c.orc, em(caca.carenciaMs * 3), ctx)).toBe(0);
  });

  it('o chefe recebe bem menos do fôlego', () => {
    const c = cena();
    const boss = criarInimigo(obter(CONTEUDO.presets.get('boss'), 'boss'), 'k', 5, 5, ctx.balance);
    c.estado.entidades.push(boss);
    simular(c.estado, ctx, [], c.eventos, DT_MS);
    for (const e of [c.orc, boss]) {
      const ia = obter(e.ia, 'ia');
      ia.modo = 'perseguindo';
      ia.cacaDesdeTick = c.estado.tick;
      ia.cacaNiveis = 0;
    }
    const depois = { ...c.estado, tick: c.estado.tick + ticksDe(caca.carenciaMs + caca.rampaMs) };
    expect(bonusDeCacaPct(c.orc, depois, ctx)).toBeCloseTo(caca.maxPct, 6);
    expect(bonusDeCacaPct(boss, depois, ctx)).toBeCloseTo(caca.maxPct * caca.chefeMult, 6);
  });

  it('o perseguidor marca a caça enquanto não alcança e zera ao alcançar', () => {
    const estado = criarEstado({ semente: 3, faseId: ctx.fase.id });
    const j = criarJogador(obter(CONTEUDO.classes.get('arqueiro'), 'classe'), 'j', 2, 9, ctx.balance);
    const orc = criarInimigo(obter(CONTEUDO.presets.get('orc'), 'orc'), 'o', 9, 9, ctx.balance);
    estado.entidades.push(j, orc);
    j.autoAtaque = false;
    const eventos: EventoSimulacao[] = [];
    let marcou = false;
    for (let i = 0; i < 1200; i++) {
      simular(estado, ctx, [], eventos, DT_MS);
      if ((orc.ia?.cacaDesdeTick ?? -1) >= 0) marcou = true;
      if (marcou && Math.max(Math.abs(orc.x - j.x), Math.abs(orc.y - j.y)) <= 1) break;
    }
    expect(marcou).toBe(true);
    simular(estado, ctx, [], eventos, DT_MS);
    expect(orc.ia?.cacaDesdeTick).toBe(-1);
  });
});

describe('alcance do Arqueiro andando (D-132)', () => {
  const pct = ctx.balance.ajustesClasses.arqueiro.alcanceAndandoPct;
  const alcanceDoBasico = (e: Entidade) => alcanceDe(ctx, e, obter(habilidadeDoAtor(ctx, e, e.ataqueBasico), 'básico'), 0);

  it('parado, o alcance de sempre; andando ou seguindo um caminho, menor', () => {
    const j = criarJogador(obter(CONTEUDO.classes.get('arqueiro'), 'classe'), 'j', 5, 5, ctx.balance);
    const parado = alcanceDoBasico(j);
    expect(parado).toBeGreaterThan(1);
    j.direcao = 'E';
    expect(alcanceDoBasico(j)).toBeCloseTo((parado * pct) / 100, 6);
    j.direcao = 'parado';
    j.caminho = [{ x: 9, y: 5 }];
    expect(alcanceDoBasico(j)).toBeCloseTo((parado * pct) / 100, 6);
    j.caminho = [];
    expect(alcanceDoBasico(j)).toBe(parado);
  });

  it('as outras classes não mudam o alcance andando', () => {
    const m = criarJogador(obter(CONTEUDO.classes.get('mago'), 'classe'), 'm', 5, 5, ctx.balance);
    const parado = alcanceDoBasico(m);
    m.direcao = 'E';
    expect(alcanceDoBasico(m)).toBe(parado);
  });
});
