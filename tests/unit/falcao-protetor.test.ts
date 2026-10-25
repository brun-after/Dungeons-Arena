// Marco 25 (25/10/2026, D-102): o falcão protetor. Velocidades por nível e atributo, o golpe que sai na chegada e o
// dash que corta a linha de um projétil hostil ao dono.
import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { companheiroDe, curvaNoNivel, ticksDoVooDoFalcao, velocidadeDoAtaqueDoFalcao, velocidadeDoDash } from '../../src/combat/companheiro';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { lancarProjetil } from '../../src/combat/projeteis';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { celulaDeInterceptacao } from '../../src/entities/ia-falcao';
import { comKit, CONTEUDO, contexto, faseDeTexto, KIT_GERAL, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
const r = ctx.balance.ajustesClasses.aventureiro.falcao;

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v == null) throw new Error(`${nome} ausente`);
  return v;
}

function arena(nivel: number) {
  const estado = criarEstado({ semente: 3, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('aventureiro')), 'j', 3, 5, ctx.balance);
  comKit(j, [...KIT_GERAL, ...j.habilidades]);
  j.autoAtaque = false;
  j.nivel = nivel;
  const boneco = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'b', 10, 5, ctx.balance);
  estado.entidades.push(j, boneco);
  const eventos: EventoSimulacao[] = [];
  const tick = () => {
    simular(estado, ctx, [], eventos, DT_MS);
  };
  tick();
  return { estado, eventos, j, boneco, tick, falcao: obter(companheiroDe(estado, j), 'falcão') };
}

/** O boneco atira no dono um projétil rápido; devolve quem ele acertou primeiro. */
function tiroNoDono(nivel: number, falcaoEm: { x: number; y: number }): string {
  const a = arena(nivel);
  Object.assign(a.falcao, { x: falcaoEm.x, y: falcaoEm.y });
  const seta = obter(habilidadeDoAtor(ctx, a.j, 'seta_arcana'), 'seta');
  lancarProjetil(a.estado, a.boneco, seta, 99, fonteDaHabilidade(a.boneco, ctx, a.estado.tick, seta), { x: a.j.x, y: a.j.y }, a.eventos);
  const p = obter(a.estado.projeteis.at(-1), 'projétil');
  p.velocidade = 40;
  for (let i = 0; i < 60 && a.estado.projeteis.includes(p); i++) a.tick();
  return p.atingidos[0] ?? 'ninguém';
}

describe('falcão protetor (marco 25)', () => {
  it('o nível dá a base: ataque 1x, 5x e 7x a patrulha nos níveis 1, 20 e 30', () => {
    expect(curvaNoNivel(r.velocidadeAtaque, 1)).toBe(1);
    expect(curvaNoNivel(r.velocidadeAtaque, 20)).toBe(5);
    expect(curvaNoNivel(r.velocidadeAtaque, 30)).toBe(7);
    expect(curvaNoNivel(r.velocidadeDash, 30)).toBe(9);
  });

  it('Sabedoria soma ao ataque e Carisma ao dash, até +30%', () => {
    const j = arena(20).j;
    j.atributos.sabedoria = 10;
    j.atributos.carisma = 10;
    expect(velocidadeDoAtaqueDoFalcao(ctx, j)).toBeCloseTo(5);
    expect(velocidadeDoDash(ctx, j)).toBeCloseTo(6);
    j.atributos.sabedoria = 20;
    expect(velocidadeDoAtaqueDoFalcao(ctx, j)).toBeCloseTo(5 * (1 + (10 * r.atributoBonusPorPontoPct) / 100));
    j.atributos.sabedoria = 99;
    j.atributos.carisma = 99;
    expect(velocidadeDoAtaqueDoFalcao(ctx, j)).toBeCloseTo(5 * 1.3);
    expect(velocidadeDoDash(ctx, j)).toBeCloseTo(6 * 1.3);
  });

  it('o voo do golpe no nível 20 é cerca de 5x mais curto que no 1', () => {
    const j1 = arena(1).j;
    const j20 = arena(20).j;
    for (const j of [j1, j20]) j.atributos.sabedoria = 10;
    const de = { x: 3, y: 5 };
    const ate = { x: 11, y: 5 };
    const t1 = ticksDoVooDoFalcao(ctx, j1, de, ate);
    const t20 = ticksDoVooDoFalcao(ctx, j20, de, ate);
    expect(t1).toBeGreaterThan(80);
    expect(t1 / t20).toBeGreaterThan(4.5);
  });

  it('o golpe do falcão sai quando ele chega ao alvo, e o dono fica livre antes', () => {
    const a = arena(1);
    a.j.atributos.sabedoria = 10;
    // O boneco ao lado do dono e o falcão longe: o voo leva o tempo da distância dele, não do dono.
    Object.assign(a.boneco, { x: 4, y: 5 });
    Object.assign(a.falcao, { x: 10, y: 9 });
    simular(a.estado, ctx, [{ tick: a.estado.tick, entidadeId: 'j', cmd: { t: 'usarHabilidade', id: 'golpe_atordoante', alvo: 'b' } }], a.eventos, DT_MS);
    const inicio = obter(a.eventos.find((e): e is Extract<EventoSimulacao, { t: 'acaoIniciada' }> => e.t === 'acaoIniciada'), 'acaoIniciada');
    expect(inicio.impactoPrevistoTick - inicio.lancamentoTick).toBeGreaterThan(30);
    // O golpe resolve (acerta ou o alvo se esquiva) na chegada do falcão.
    const resolveu = () => a.eventos.some((e) => (e.t === 'impacto' || e.t === 'esquivou') && e.acaoId === inicio.acaoId);
    let livreAntes = false;
    let mergulhou = false;
    while (!resolveu() && a.estado.tick < inicio.tick + 400) {
      a.tick();
      if (resolveu()) break;
      if (!a.j.acao) livreAntes = true;
      if (obter(buscarEntidade(a.estado, a.falcao.id)).ia?.modo === 'mergulho') mergulhou = true;
    }
    expect(livreAntes).toBe(true);
    expect(mergulhou).toBe(true);
    expect(a.estado.tick).toBeGreaterThanOrEqual(inicio.impactoPrevistoTick);
    expect(a.estado.tick).toBeLessThanOrEqual(inicio.impactoPrevistoTick + 1);
  });

  it('o golpe em voo acerta mesmo que o dono se afaste durante o voo', () => {
    // Com o dono parado o golpe acerta; com o dono longe durante o voo, acerta igual (o alcance valeu na conjuração).
    const resultado = (afastar: boolean) => {
      const a = arena(1);
      a.j.atributos.sabedoria = 10;
      Object.assign(a.boneco, { x: 4, y: 5 });
      Object.assign(a.falcao, { x: 10, y: 9 });
      simular(a.estado, ctx, [{ tick: a.estado.tick, entidadeId: 'j', cmd: { t: 'usarHabilidade', id: 'golpe_atordoante', alvo: 'b' } }], a.eventos, DT_MS);
      for (let i = 0; i < 400 && !a.eventos.some((e) => e.t === 'impacto' || e.t === 'esquivou'); i++) {
        if (afastar && !a.j.acao) Object.assign(a.j, { x: 1, y: 9, destinoX: 1, destinoY: 9 });
        a.tick();
      }
      return a.eventos.find((e) => e.t === 'impacto' || e.t === 'esquivou')?.t;
    };
    expect(resultado(false)).toBe('impacto');
    expect(resultado(true)).toBe('impacto');
  });

  it('no nível 30 o falcão corta a linha do projétil; no 1 não chega a tempo', () => {
    const longe = { x: 4, y: 8 };
    expect(tiroNoDono(30, longe)).toBe(arena(30).falcao.id);
    expect(tiroNoDono(1, longe)).toBe('j');
  });

  it('só reage a projétil que acertaria o dono', () => {
    const a = arena(30);
    const seta = obter(habilidadeDoAtor(ctx, a.j, 'seta_arcana'), 'seta');
    lancarProjetil(a.estado, a.boneco, seta, 99, fonteDaHabilidade(a.boneco, ctx, a.estado.tick, seta), { x: 10, y: 1 }, a.eventos);
    expect(celulaDeInterceptacao(a.estado, ctx, a.falcao, a.j)).toBeNull();
  });
});
