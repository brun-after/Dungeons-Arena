// Marco 47 (20/11/2026, D-190): o loot de armadura — determinístico pelo abate, com a garantia contra azar, o elemento
// da criatura, as peças dos chefes e o baú no nível da fase. O sorteio é o mesmo da vitrine das lojas.

import { describe, expect, it } from 'vitest';
import { clonarEntidade, criarEstado } from '../../src/core/estado';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { criarRng } from '../../src/core/rng';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import type { Entidade } from '../../src/entities/entidade';
import { RARIDADES } from '../../src/modos/modo';
import { lerIdItemGerado } from '../../src/progression/gerar-item';
import { ehPecaDeArmadura } from '../../src/progression/graus';
import { elementoDaCriatura, lootDaCriatura, pecaDoBau, pecasDoAbate } from '../../src/progression/loot-pecas';
import { pesosDoPedido } from '../../src/progression/sorteio-pecas';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'dado'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const L = CONTEUDO.sorteio.loot;
const indiceDe = (id: string) => RARIDADES.indexOf(obter(CONTEUDO.itens.get(id), id).raridade);
const RARO = RARIDADES.indexOf('raro');

function cena(ctx: ContextoSimulacao = contexto(faseDeTexto(SALA_ABERTA))) {
  const estado = criarEstado({ semente: 5, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 2, 2, ctx.balance);
  estado.entidades.push(j);
  const inimigo = (preset: string, id: string, nivel = 10): Entidade => criarInimigo(obter(CONTEUDO.presets.get(preset), preset), id, 5, 5, ctx.balance, { nivel });
  return { ctx, estado, j, b: obter(j.bolsa), inimigo };
}

describe('loot de armadura (D-190)', () => {
  it('é determinístico pelo abate e não anda o RNG do combate', () => {
    const c = cena();
    const goblin = c.inimigo('goblin', 'g1');
    const antes = { ...c.estado.rng };
    const jogador = clonarEntidade(c.j);
    const a = pecasDoAbate(c.estado, c.ctx, goblin, jogador, 50, 1);
    const b = pecasDoAbate(c.estado, c.ctx, goblin, clonarEntidade(c.j), 50, 1);
    expect(a).toEqual(b);
    expect(c.estado.rng).toEqual(antes);
    for (const id of a) expect(ehPecaDeArmadura(obter(CONTEUDO.itens.get(id), id).slotPadrao)).toBe(true);
  });

  it('cai em cerca de 1 a cada 12 abates comuns', () => {
    const c = cena();
    let pecas = 0;
    const n = 3000;
    for (let i = 0; i < n; i++) {
      c.estado.tick = i;
      pecas += pecasDoAbate(c.estado, c.ctx, c.inimigo('goblin', `g${i}`), undefined, 1, 1).length;
    }
    expect(pecas / n).toBeGreaterThan(0.05);
    expect(pecas / n).toBeLessThan(0.11);
  });

  it('a garantia solta uma peça a cada 20 abates sem nenhuma e uma rara a cada 60', () => {
    const c = cena();
    // Sem loot no lugar, só a garantia faz cair.
    const quedas: number[] = [];
    for (let i = 1; i <= 3 * L.garantia.abatesSemPeca; i++) {
      c.estado.tick = i;
      if (pecasDoAbate(c.estado, c.ctx, c.inimigo('goblin', `g${i}`), c.j, 0, 1).length > 0) quedas.push(i);
    }
    expect(quedas).toEqual([20, 40, 60]);
    // A um abate do teto da rara: a peça cai rara ou melhor e os dois contadores zeram.
    c.b.azarDePeca = { semPeca: 3, semRara: L.garantia.abatesSemRara - 1 };
    c.estado.tick = 999;
    const ids = pecasDoAbate(c.estado, c.ctx, c.inimigo('goblin', 'g999'), c.j, 0, 1);
    expect(ids).toHaveLength(1);
    expect(indiceDe(obter(ids[0]))).toBeGreaterThanOrEqual(RARO);
    expect(c.b.azarDePeca).toEqual({ semPeca: 0, semRara: 0 });
  });

  it('o renascido conta só a fração do antifarm na garantia', () => {
    const c = cena();
    for (let i = 0; i < 10; i++) pecasDoAbate(c.estado, c.ctx, c.inimigo('goblin', `g${i}`), c.j, 0, 0.25);
    expect(c.b.azarDePeca?.semPeca).toBeCloseTo(2.5);
  });

  it('a peça puxa o elemento da criatura (o sotaque da dimensão ou a afinidade)', () => {
    const c = cena();
    const goblin = obter(CONTEUDO.presets.get('goblin'), 'goblin');
    expect(elementoDaCriatura(c.ctx, goblin)).toBe('fogo');
    expect(elementoDaCriatura(c.ctx, goblin, 'gelo')).toBe('gelo');
    let fogo = 0;
    let total = 0;
    for (let i = 0; i < 600; i++) {
      c.estado.tick = i;
      for (const id of pecasDoAbate(c.estado, c.ctx, c.inimigo('goblin', `g${i}`), undefined, 100, 1)) {
        total++;
        if (CONTEUDO.itens.get(id)?.peca?.elemento === 'fogo') fogo++;
      }
    }
    // Sem viés, cada um dos 8 elementos sairia ~12,5%; com 20% puxados, o fogo fica perto de 30%.
    expect(total).toBeGreaterThan(400);
    expect(fogo / total).toBeGreaterThan(0.22);
    expect(fogo / total).toBeLessThan(0.4);
  });

  it('o chefe solta rara ou melhor; o da masmorra, duas; o de Filo, uma épica a mais na primeira vitória', () => {
    const c = cena();
    c.b.vitorias = { rei_goblin: 1 };
    const chefe = pecasDoAbate(c.estado, c.ctx, c.inimigo('rei_goblin', 'b1', 20), c.j, 1, 1);
    expect(chefe).toHaveLength(1);
    expect(indiceDe(obter(chefe[0]))).toBeGreaterThanOrEqual(RARO);
    const maior = cena({ ...c.ctx, modo: { ...c.ctx.modo, chefeMaior: true } });
    maior.b.vitorias = { rei_goblin: 3 };
    const dois = pecasDoAbate(maior.estado, maior.ctx, maior.inimigo('rei_goblin', 'b2', 20), maior.j, 1, 1);
    expect(dois).toHaveLength(2);
    for (const id of dois) expect(indiceDe(id)).toBeGreaterThanOrEqual(RARO);
    const primeira = cena();
    const tres = pecasDoAbate(primeira.estado, primeira.ctx, primeira.inimigo('rei_goblin', 'b3', 20), primeira.j, 1, 1);
    expect(tres).toHaveLength(2);
    const extra = obter(CONTEUDO.itens.get(obter(tres[1])), 'peça extra');
    expect(RARIDADES.indexOf(extra.raridade)).toBeGreaterThanOrEqual(RARIDADES.indexOf('epico'));
    expect(extra.peca?.elemento).toBe('fogo');
  });

  it('o jogador derrubado não solta peça gerada', () => {
    const c = cena();
    expect(pecasDoAbate(c.estado, c.ctx, c.j, undefined, 100, 1)).toEqual([]);
  });

  it('a dificuldade mexe no peso das raridades acima de comum', () => {
    const c = cena();
    const perfil = obter(CONTEUDO.sorteio.perfis.get(L.perfilComum), 'perfil');
    const facil = pesosDoPedido(c.ctx, { nivel: 10, perfil, bonusRaridadePct: L.raridadePorDificuldadePct.facil });
    const pesadelo = pesosDoPedido(c.ctx, { nivel: 10, perfil, bonusRaridadePct: L.raridadePorDificuldadePct.pesadelo });
    expect(pesadelo.raro).toBeGreaterThan(facil.raro);
    expect(pesadelo.comum).toBe(facil.comum);
    // A raridade mínima zera as de baixo.
    expect(pesosDoPedido(c.ctx, { nivel: 10, perfil, raridadeMin: 'raro' }).incomum).toBe(0);
  });

  it('o baú traz peça em cerca de metade das vezes, no nível da fase', () => {
    const c = cena();
    let pecas = 0;
    for (let s = 0; s < 400; s++) {
      const id = pecaDoBau(c.ctx, criarRng(s + 1));
      if (!id) continue;
      pecas++;
      // A fase de teste não tem inimigos: nível 1 mais a folga do perfil do baú.
      expect(obter(lerIdItemGerado(id), id).nivel).toBeLessThanOrEqual(1 + 2);
    }
    expect(pecas / 400).toBeGreaterThan(0.4);
    expect(pecas / 400).toBeLessThan(0.6);
  });

  it('o monstruário lê as chances dos mesmos dados', () => {
    const c = cena();
    const goblin = lootDaCriatura(c.ctx, obter(CONTEUDO.presets.get('goblin'), 'goblin'));
    expect(goblin).toMatchObject({ pecaPct: L.chancePorAbatePct, pecasDoChefe: 0, elemento: 'fogo', elementoPct: L.elementoDaCriaturaPct, primeiraVitoria: false });
    const rei = lootDaCriatura(c.ctx, obter(CONTEUDO.presets.get('rei_goblin'), 'rei'));
    expect(rei).toMatchObject({ pecaPct: 100, pecasDoChefe: 1, primeiraVitoria: true });
  });
});
