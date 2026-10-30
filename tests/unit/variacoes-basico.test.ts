// Marco 27 (29/10/2026, D-126): as variações do básico na simulação — o bumerangue que volta, o ricochete, a tabela,
// o leque, o solo amaldiçoado (pulsos, crescer, saltar), o giro do Montante, a riposta e os pergaminhos que acumulam.
import { describe, expect, it } from 'vitest';
import type { Comando } from '../../src/core/comandos';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import type { Entidade } from '../../src/entities/entidade';
import { recalcularFicha } from '../../src/progression/derivados';
import { idItemBase } from '../../src/progression/gerar-item-base';
import { usarItem } from '../../src/progression/inventario';
import { contarInvocacoes, contarPergaminhos } from '../../src/combat/efeitos-fluxo';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

/** Quem ataca em (2,5) com a arma; bonecos (sem IA) onde pedir. */
function cena(classe: string, arma: string | null, bonecos: [number, number][], secundaria: string | null = null) {
  const estado = criarEstado({ semente: 4, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 2, 5, ctx.balance);
  const bolsa = obter(j.bolsa);
  if (arma) bolsa.equipamento.arma_principal = { invId: 'a1', itemId: idItemBase(arma, 'comum', null, 1, 7), qtd: 1, ref: null };
  if (secundaria) bolsa.equipamento.arma_secundaria = { invId: 'a2', itemId: idItemBase(secundaria, 'comum', null, 1, 7), qtd: 1, ref: null };
  recalcularFicha(j, ctx);
  j.autoAtaque = false;
  estado.entidades.push(j);
  bonecos.forEach(([x, y], i) => {
    const b = criarInimigo(obter(CONTEUDO.presets.get('boneco')), `b${String(i)}`, x, y, ctx.balance);
    b.hp = b.hpMax = 999;
    estado.entidades.push(b);
  });
  const eventos: EventoSimulacao[] = [];
  const tick = (cmds: [string, Comando][] = []) => {
    simular(estado, ctx, cmds.map(([entidadeId, cmd]) => ({ tick: estado.tick, entidadeId, cmd })), eventos, DT_MS);
  };
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const de = <T extends EventoSimulacao['t']>(t: T) => eventos.filter((e): e is Extract<EventoSimulacao, { t: T }> => e.t === t);
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id));
  const basico = (alvo: string) => {
    tick([['j', { t: 'ataqueBasico', alvo }]]);
    ticks(ticksDe(4000));
  };
  return { estado, eventos, tick, ticks, de, ent, basico, j };
}

describe('variações do básico', () => {
  it('o bumerangue acerta na ida e na volta e termina na mão', () => {
    const c = cena('aventureiro', null, [[5, 5]]);
    c.basico('b0');
    const golpes = c.de('impacto').filter((e) => e.alvoId === 'b0' && e.habilidadeId === 'bumerangue');
    expect(golpes).toHaveLength(2);
    expect(c.estado.projeteis).toHaveLength(0);
    expect(c.de('projetilFim').at(-1)?.motivo).toBe('expirou');
  });

  it('o chakram ricocheteia entre inimigos antes de voltar', () => {
    const c = cena('aventureiro', 'chakram', [[5, 5], [6, 7], [8, 7]]);
    c.basico('b0');
    const atingidos = new Set(c.de('impacto').filter((e) => e.habilidadeId === 'basico_chakram').map((e) => e.alvoId));
    expect(atingidos.size).toBe(3);
  });

  it('a adaga de arremesso quica na parede e volta', () => {
    const c = cena('aventureiro', 'adaga', []);
    c.j.x = c.j.px = 7;
    c.tick([['j', { t: 'ataqueBasico', alvo: { x: 9, y: 5 } }]]);
    let quicou = false;
    for (let i = 0; i < ticksDe(4000); i++) {
      c.tick();
      const p = c.estado.projeteis[0];
      if (p && p.dirX < 0 && p.var?.fase === 'ida') quicou = true;
    }
    expect(quicou).toBe(true);
    expect(c.estado.projeteis).toHaveLength(0);
  });

  it('o arco composto lança três flechas em leque; o arco curto, três em fila', () => {
    const leque = cena('arqueiro', 'composto', [[7, 5]]);
    leque.basico('b0');
    expect(leque.de('projetilLancado').filter((e) => e.habilidadeId === 'basico_composto')).toHaveLength(3);
    const salva = cena('arqueiro', 'arcocurto', [[7, 5]]);
    salva.basico('b0');
    expect(salva.de('impacto').filter((e) => e.alvoId === 'b0')).toHaveLength(3);
  });

  it('o tiro parabólico passa por cima de quem está na frente', () => {
    const c = cena('arqueiro', 'arco', [[4, 5], [7, 5]]);
    c.basico('b1');
    const alvos = c.de('impacto').filter((e) => e.habilidadeId === 'basico_arco').map((e) => e.alvoId);
    expect(alvos).toEqual(['b1']);
  });

  it('o solo amaldiçoado pulsa sob o alvo, e o do cajado de ossos cresce', () => {
    const c = cena('necromante', null, [[6, 5], [7, 6]]);
    c.basico('b0');
    expect(c.de('soloPulsou')).toHaveLength(3);
    expect(c.de('impacto').filter((e) => e.alvoId === 'b0' && e.fonteId === 'j').length).toBe(3);
    // O vizinho também está no solo (raio 1).
    expect(c.de('impacto').some((e) => e.alvoId === 'b1')).toBe(true);
    const ossos = cena('necromante', 'cajado', [[6, 5], [8, 7]]);
    ossos.basico('b0');
    expect(ossos.de('soloPulsou').map((e) => e.raio)).toEqual([0, 1, 2]);
    expect(ossos.de('impacto').some((e) => e.alvoId === 'b1')).toBe(true);
  });

  it('a praga salta para o hostil mais perto quando acaba', () => {
    const c = cena('necromante', 'praga', [[6, 5], [9, 5]]);
    c.basico('b0');
    expect(c.de('soloCriado')).toHaveLength(2);
    expect(c.de('impacto').some((e) => e.alvoId === 'b1')).toBe(true);
  });

  it('o Montante gira em volta a cada 3º golpe', () => {
    const c = cena('guerreiro', 'montante', [[3, 5], [1, 5]]);
    for (let i = 0; i < 3; i++) {
      c.tick([['j', { t: 'ataqueBasico', alvo: 'b0' }]]);
      c.ticks(ticksDe(2500));
    }
    expect(c.de('impacto').filter((e) => e.alvoId === 'b1')).toHaveLength(1);
  });

  it('a Rapieira deixa o próximo básico crítico depois de levar um golpe', () => {
    const c = cena('guerreiro', 'rapieira', [[3, 5]]);
    c.estado.tick = 100;
    c.j.armas = { contador: 0, golpes: 0, ripostaAteTick: 200 };
    c.basico('b0');
    expect(c.de('impacto').find((e) => e.alvoId === 'b0')?.critico).toBe(true);
  });

  it('o 3º básico sai pela mão secundária (o Arqueiro de espada golpeia de perto)', () => {
    const c = cena('arqueiro', 'arco', [[3, 5]], 'espada');
    for (let i = 0; i < 3; i++) {
      c.tick([['j', { t: 'ataqueBasico', alvo: 'b0' }]]);
      c.ticks(ticksDe(2500));
    }
    const usados = c.de('acaoIniciada').map((e) => e.habilidadeId);
    expect(usados).toEqual(['basico_arco', 'basico_arco', 'basico_espada']);
  });

  it('os pergaminhos de invocação acumulam no teto próprio', () => {
    const c = cena('mago', null, []);
    const bolsa = obter(c.j.bolsa);
    bolsa.mochila.push({ invId: 'p1', itemId: 'pergaminho_lobo', qtd: 3, ref: null }, { invId: 'p2', itemId: 'pergaminho_sentinela', qtd: 1, ref: null });
    const saida: EventoSimulacao[] = [];
    for (const id of ['p1', 'p1', 'p2', 'p1']) usarItem(c.estado, c.j, ctx, id, saida);
    expect(contarPergaminhos(c.estado, 'j')).toBe(ctx.modo.limites.invocacoesDePergaminho);
    expect(contarInvocacoes(c.estado, 'j')).toBe(0);
    // Acima do teto, recusa sem gastar.
    bolsa.mochila.push({ invId: 'p3', itemId: 'pergaminho_fada', qtd: 1, ref: null });
    usarItem(c.estado, c.j, ctx, 'p3', saida);
    expect(bolsa.mochila.find((m) => m.invId === 'p3')?.qtd).toBe(1);
  });

  it('a passiva do Aventureiro estende as invocações de pergaminho', () => {
    const av = cena('aventureiro', 'chakram', []);
    const mago = cena('mago', 'tomo', []);
    for (const c of [av, mago]) {
      obter(c.j.bolsa).mochila.push({ invId: 'p1', itemId: 'pergaminho_lobo', qtd: 1, ref: null });
      usarItem(c.estado, c.j, ctx, 'p1', []);
    }
    const dura = (c: typeof av) => obter(c.estado.entidades.find((e) => e.invocacao?.pergaminho)?.invocacao).expiraTick;
    expect(dura(av)).toBeGreaterThan(dura(mago));
  });
});
