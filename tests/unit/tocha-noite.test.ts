// Marco 44 (15/11/2026, D-178): a tocha à noite: a visão do jogador, a percepção dos monstros e quem ela atrai ou afasta.
import { describe, expect, it } from 'vitest';
import { modoPorId } from '../../src/core/conteudo';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import type { Entidade } from '../../src/entities/entidade';
import { fogoQueAfasta, raioContra, reacaoAoFogo } from '../../src/entities/ia-mundo';
import { lerLugar, montarLugar } from '../../src/mundo/lugares';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { alfaNoEscuro } from '../../src/ui/visao-no-escuro';
import { CONTEUDO } from '../apoio/fases';

function cena(escuro: number) {
  const reino = CONTEUDO.reinos.get('reino_central');
  if (!reino) throw new Error('reino');
  const lugar = lerLugar(reino, 'regiao:campos_do_oeste');
  if (!lugar) throw new Error('lugar');
  const m = montarLugar(CONTEUDO, reino, lugar, modoPorId(CONTEUDO, MODO_MUNDO));
  const ctx: ContextoSimulacao = { ...m.ctx, modo: { ...m.ctx.modo, escuro } };
  const estado = m.estado;
  estado.entidades = [];
  estado.objetos = [];
  const classe = CONTEUDO.classes.get('guerreiro');
  if (!classe) throw new Error('classe');
  const eu = criarJogador(classe, 'p1', 50, 50, ctx.balance);
  eu.nivel = 10;
  estado.entidades.push(eu);
  const monstro = (id: string, nivel: number, dx: number): Entidade => {
    const preset = CONTEUDO.presets.get('lobo');
    if (!preset) throw new Error('lobo');
    const e = criarInimigo(preset, id, 50 + dx, 50, ctx.balance, { nivel });
    estado.entidades.push(e);
    return e;
  };
  const acender = () => { aplicarEfeito(estado, ctx, eu, construirEfeito('tocha', { duracaoMs: 60_000 }), { id: eu.id, x: eu.x, y: eu.y }, null, []); };
  return { ctx, estado, eu, monstro, acender };
}

describe('a tocha à noite (D-178)', () => {
  it('no escuro o monstro percebe pela metade; quem está iluminado é visto como de dia', () => {
    const { ctx, estado, eu, monstro, acender } = cena(1);
    const m = monstro('m', 10, 4);
    expect(raioContra(estado, ctx, m, eu, 10)).toBeCloseTo(10 * (1 - ctx.balance.mundo.noite.percepcaoMenosPct / 100));
    acender();
    const r = raioContra(estado, ctx, m, eu, 10);
    expect([-1, 10 * ctx.balance.mundo.tocha.atraiMult]).toContain(r);
  });

  it('a tocha atrai os mais fortes e afasta os mais fracos (até serem atacados)', () => {
    const { ctx, estado, eu, monstro, acender } = cena(1);
    const forte = monstro('forte', 14, 6);
    const fraco = monstro('fraco', 6, 3);
    acender();
    expect(reacaoAoFogo(estado, ctx, forte, eu)).toBe('atraido');
    expect(raioContra(estado, ctx, forte, eu, 10)).toBeCloseTo(10 * ctx.balance.mundo.tocha.atraiMult);
    expect(reacaoAoFogo(estado, ctx, fraco, eu)).toBe('evita');
    expect(raioContra(estado, ctx, fraco, eu, 10)).toBe(-1);
    expect(fogoQueAfasta(estado, ctx, fraco)?.id).toBe(eu.id);
    fraco.participacao.push({ id: eu.id, tick: estado.tick });
    expect(raioContra(estado, ctx, fraco, eu, 10)).toBeGreaterThan(0);
    expect(fogoQueAfasta(estado, ctx, fraco)).toBeNull();
  });

  it('os do mesmo nível avançam em cerca de metade das vezes', () => {
    const { ctx, estado, eu, monstro, acender } = cena(1);
    acender();
    let avancam = 0;
    for (let i = 0; i < 200; i++) if (reacaoAoFogo(estado, ctx, monstro(`igual${i}`, 10, 8), eu) === 'atraido') avancam++;
    expect(avancam).toBeGreaterThan(70);
    expect(avancam).toBeLessThan(130);
  });

  it('no escuro só se veem os inimigos perto: 3 células sem luz, 10 com a tocha', () => {
    const { ctx, estado, eu, monstro, acender } = cena(1);
    const perto = monstro('perto', 10, 2);
    const meio = monstro('meio', 10, 6);
    expect(alfaNoEscuro(ctx, estado, eu, perto, 1)).toBe(1);
    expect(alfaNoEscuro(ctx, estado, eu, meio, 1)).toBe(0);
    expect(alfaNoEscuro(ctx, estado, eu, meio, 0)).toBe(1);
    acender();
    expect(alfaNoEscuro(ctx, estado, eu, meio, 1)).toBe(1);
    expect(alfaNoEscuro(ctx, estado, eu, monstro('longe', 10, 14), 1)).toBe(0);
  });
});
