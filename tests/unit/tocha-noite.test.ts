// Marco 44 (15/11/2026, D-178): a tocha à noite: a visão do jogador, a percepção dos monstros e quem ela atrai ou afasta.
import { describe, expect, it } from 'vitest';
import { modoPorId } from '../../src/core/conteudo';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { aplicarEfeito, processarEfeitos } from '../../src/combat/efeitos';
import { temLuzPropria } from '../../src/combat/luz-propria';
import { ticksDe } from '../../src/core/tempo';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import type { Entidade } from '../../src/entities/entidade';
import { fogoQueAfasta, raioContra, reacaoAoFogo } from '../../src/entities/ia-mundo';
import { lerLugar, montarLugar } from '../../src/mundo/lugares';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { morteSemTumulo, recompensaDaNoite } from '../../src/mundo/noite';
import { criarTumulo } from '../../src/mundo/objetos-mundo';
import { alfaNoEscuro } from '../../src/ui/visao-no-escuro';
import { CONTEUDO } from '../apoio/fases';

function cena(escuro: number) {
  const reino = CONTEUDO.reinos.get('reino_central');
  if (!reino) throw new Error('reino');
  const lugar = lerLugar(reino, 'regiao:campos_do_oeste');
  if (!lugar) throw new Error('lugar');
  const m = montarLugar(CONTEUDO, reino, lugar, modoPorId(CONTEUDO, MODO_MUNDO));
  const ctx: ContextoSimulacao = { ...m.ctx, modo: { ...m.ctx.modo, escuro, noite: escuro } };
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

  it('a tocha atrai os mais fortes; dos mais fracos, metade ataca com cautela e metade evita (até serem atacados)', () => {
    const { ctx, estado, eu, monstro, acender } = cena(1);
    const forte = monstro('forte', 14, 6);
    acender();
    expect(reacaoAoFogo(estado, ctx, forte, eu)).toBe('atraido');
    expect(raioContra(estado, ctx, forte, eu, 10)).toBeCloseTo(10 * ctx.balance.mundo.tocha.atraiMult);
    // 16/11/2026: o mais fraco ataca com 50% de chance, percebendo a 50% do alcance do dia.
    let cautelosos = 0;
    for (let i = 0; i < 200; i++) {
      const f = monstro(`fraco${i}`, 6, 3);
      if (reacaoAoFogo(estado, ctx, f, eu) !== 'cauteloso') continue;
      cautelosos++;
      expect(raioContra(estado, ctx, f, eu, 10)).toBeCloseTo(10 * ctx.balance.mundo.tocha.fracosAlcancePct / 100);
    }
    expect(cautelosos).toBeGreaterThan(70);
    expect(cautelosos).toBeLessThan(130);
    estado.entidades = estado.entidades.filter((e) => !e.id.startsWith('fraco'));
    let fraco = monstro('fraco', 6, 3);
    for (let i = 0; reacaoAoFogo(estado, ctx, fraco, eu) !== 'evita'; i++) {
      estado.entidades.pop();
      fraco = monstro(`fraco_evita${i}`, 6, 3);
    }
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
    // De dia, vê-se quem está ao sol; quem está na sombra de uma árvore (a camuflagem) só de perto, como à noite.
    const semArvores = new Uint8Array(ctx.fase.largura * ctx.fase.altura);
    expect(alfaNoEscuro({ ...ctx, fase: { ...ctx.fase, obstaculos: semArvores } }, estado, eu, meio, 0)).toBe(1);
    const arvore = semArvores.slice();
    arvore[Math.round(meio.y) * ctx.fase.largura + Math.round(meio.x)] = 3;
    expect(alfaNoEscuro({ ...ctx, fase: { ...ctx.fase, obstaculos: arvore } }, estado, eu, meio, 0)).toBe(0);
    acender();
    expect(alfaNoEscuro(ctx, estado, eu, meio, 1)).toBe(1);
    expect(alfaNoEscuro(ctx, estado, eu, monstro('longe', 10, 14), 1)).toBe(0);
  });

  it('acabado o tempo, a tocha queima a mana e apaga quando ela acaba', () => {
    const { ctx, estado, eu, acender } = cena(1);
    acender();
    const t = ctx.balance.mundo.tocha;
    const custo = Math.max(t.manaMin, Math.ceil((eu.manaMax * t.manaPct) / 100));
    eu.mana = custo * 2 + Math.floor(custo / 2);
    estado.tick += ticksDe(60_000);
    processarEfeitos(estado, ctx, []);
    expect(temLuzPropria(eu)).toBe(true);
    expect(eu.mana).toBe(custo + Math.floor(custo / 2));
    estado.tick += ticksDe(1000);
    processarEfeitos(estado, ctx, []);
    expect(temLuzPropria(eu)).toBe(true);
    estado.tick += ticksDe(1000);
    processarEfeitos(estado, ctx, []);
    expect(temLuzPropria(eu)).toBe(false);
  });

  it('a noite paga mais XP e saque, e quem morre nela não deixa túmulo', () => {
    const dia = cena(0);
    expect(recompensaDaNoite(dia.ctx)).toBe(1);
    expect(morteSemTumulo(dia.ctx)).toBe(false);
    const noite = cena(1);
    expect(recompensaDaNoite(noite.ctx)).toBeCloseTo(1 + noite.ctx.balance.mundo.noite.recompensaPct / 100);
    expect(morteSemTumulo(noite.ctx)).toBe(true);
    const bolsa = noite.eu.bolsa;
    if (!bolsa) throw new Error('bolsa');
    bolsa.mochila.push({ invId: 'i1', itemId: 'tocha', qtd: 2, ref: null });
    criarTumulo(noite.estado, noite.ctx, noite.eu, [], true);
    expect(bolsa.mochila).toHaveLength(0);
    expect(noite.estado.objetos.some((o) => o.tipo === 'tumulo')).toBe(false);
  });
});
