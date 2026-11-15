// Marco 42 (15/11/2026, D-176): a noite perigosa do Mundo e as matas fechadas.
import { describe, expect, it } from 'vitest';
import { modoPorId } from '../../src/core/conteudo';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { criarJogador } from '../../src/entities/fabrica';
import { vivo } from '../../src/entities/entidade';
import { lerLugar, montarLugar } from '../../src/mundo/lugares';
import { conferirNoite, percepcaoNoEscuro, PREFIXO_NOITE } from '../../src/mundo/noite';
import type { RegiaoDoMundo } from '../../src/mundo/reino';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { passavel, tipoEm } from '../../src/world/fase';
import { CONTEUDO } from '../apoio/fases';

function regiao(id: string) {
  const reino = CONTEUDO.reinos.get('reino_central');
  if (!reino) throw new Error('reino');
  const lugar = lerLugar(reino, `regiao:${id}`);
  if (!lugar || lugar.tipo !== 'regiao') throw new Error('lugar');
  const m = montarLugar(CONTEUDO, reino, lugar, modoPorId(CONTEUDO, MODO_MUNDO));
  return { ...m, regiao: lugar.regiao };
}

function comJogador(m: ReturnType<typeof regiao>, x: number, y: number) {
  const classe = CONTEUDO.classes.get('guerreiro');
  if (!classe) throw new Error('classe');
  const j = criarJogador(classe, 'p1', x, y, m.ctx.balance);
  m.estado.entidades.push(j);
  return j;
}

const comEscuro = (ctx: ContextoSimulacao, escuro: number): ContextoSimulacao => ({ ...ctx, modo: { ...ctx.modo, escuro } });
const daNoite = (m: { estado: { entidades: { id: string }[] } }) => m.estado.entidades.filter((e) => e.id.startsWith(PREFIXO_NOITE));

/** Um ponto andável fora da vila, longe do centro. */
function foraDaVila(m: ReturnType<typeof regiao>, r: RegiaoDoMundo) {
  const n = r.tamanho ?? 200;
  for (let y = 10; y < n - 10; y++) for (let x = 10; x < n - 10; x++) {
    if (passavel(m.ctx.fase, x, y) && tipoEm(m.ctx.fase, x, y) !== 'agua' && (!r.vila || Math.hypot(x - r.vila.x, y - r.vila.y) > r.vila.raio + 30)) return { x, y };
  }
  throw new Error('sem ponto');
}

describe('noite perigosa (D-176)', () => {
  it('de dia não nasce horda; de noite nasce perto de quem anda, acima da faixa', () => {
    const m = regiao('campos_do_oeste');
    const p = foraDaVila(m, m.regiao);
    comJogador(m, p.x, p.y);
    expect(conferirNoite(m.estado, m.ctx, m.regiao, 0)).toBe(0);
    const noite = comEscuro(m.ctx, 1);
    let total = 0;
    for (let i = 0; i < 20; i++) {
      m.estado.tick++;
      total += conferirNoite(m.estado, noite, m.regiao, 1);
    }
    expect(total).toBeGreaterThan(5);
    for (const e of daNoite(m) as unknown as { nivel: number; x: number; y: number }[]) {
      expect(e.nivel).toBeGreaterThan(m.regiao.nivel[1]);
      expect(Math.hypot(e.x - p.x, e.y - p.y)).toBeGreaterThanOrEqual(m.ctx.balance.mundo.noite.distancia[0] - 1);
    }
  });

  it('ao clarear, os extras longe de todos e sem dano vão embora', () => {
    const m = regiao('campos_do_oeste');
    const p = foraDaVila(m, m.regiao);
    const j = comJogador(m, p.x, p.y);
    for (let i = 0; i < 10; i++) {
      m.estado.tick++;
      conferirNoite(m.estado, comEscuro(m.ctx, 1), m.regiao, 1);
    }
    expect(daNoite(m).length).toBeGreaterThan(0);
    j.x = 2;
    j.y = 2;
    conferirNoite(m.estado, comEscuro(m.ctx, 0), m.regiao, 0);
    expect(daNoite(m).length).toBe(0);
  });

  it('a vila segura não tem horda à noite, mas a mata fechada tem os seus a qualquer hora', () => {
    const m = regiao('vila_do_centro');
    const mata = m.ctx.fase.matas?.[0];
    if (!mata) throw new Error('mata');
    comJogador(m, mata.x - mata.raio - 10, mata.y);
    for (let i = 0; i < 5; i++) {
      m.estado.tick++;
      conferirNoite(m.estado, m.ctx, m.regiao, 0);
    }
    const daMata = daNoite(m).filter((e) => e.id.includes(':mata'));
    expect(daMata.length).toBe(m.ctx.balance.mundo.noite.porMata);
    expect(daNoite(m).length).toBe(daMata.length);
    expect(m.estado.entidades.filter((e) => e.id.includes(':mata')).every((e) => vivo(e))).toBe(true);
  });

  it('no escuro, os monstros percebem de mais perto (marco 44, D-178)', () => {
    const m = regiao('campos_do_oeste');
    const e = m.estado.entidades.find((x) => x.arquetipo !== 'jogador');
    if (!e) throw new Error('monstro');
    expect(percepcaoNoEscuro(m.ctx, e, 10)).toBe(10);
    expect(percepcaoNoEscuro(comEscuro(m.ctx, 1), e, 10)).toBeCloseTo(10 * (1 - m.ctx.balance.mundo.noite.percepcaoMenosPct / 100), 5);
  });
});
