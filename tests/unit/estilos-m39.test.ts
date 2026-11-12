// Marco 39 (12/11/2026, D-147): o pentagrama de estilos — intensidade linear e imediata, a camada dos itens, os efeitos
// somados, a mecânica na força da ponta e o aviso de estilo desperto.
import { describe, expect, it } from 'vitest';
import { criarEstado } from '../../src/core/estado';
import { criarJogador } from '../../src/entities/fabrica';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { atualizarEstilosDespertos } from '../../src/progression/estilos-despertos';
import { camadaDosItens, escalarGancho, ganchosDosEstilos, intensidadesBase, radarDe } from '../../src/progression/estilos';
import { recalcularFicha } from '../../src/progression/derivados';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
const regras = ctx.balance.estilos;
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}
const NEUTRO = { vontade: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, carisma: 10 };

describe('pentagrama de estilos', () => {
  it('cada classe tem 5 estilos, cada um com um par de pesos que soma 1', () => {
    for (const [classe, lista] of CONTEUDO.estilos) {
      expect(lista, classe).toHaveLength(5);
      for (const e of lista) expect(Object.values(e.pesos).reduce((s, v) => s + v, 0)).toBeCloseTo(1);
    }
  });

  it('a intensidade é linear e imediata: cada ponto no atributo principal move a ponta 0,65/90', () => {
    const mago = obter(CONTEUDO.estilos.get('mago'));
    const k = mago.findIndex((e) => e.id === 'guardiao');
    const antes = intensidadesBase(mago, NEUTRO, regras)[k] ?? 0;
    const depois = intensidadesBase(mago, { ...NEUTRO, constituicao: 11 }, regras)[k] ?? 0;
    expect(antes).toBe(0);
    expect(depois).toBeCloseTo(0.65 / 90);
    expect(intensidadesBase(mago, { ...NEUTRO, constituicao: 100, sabedoria: 100 }, regras)[k]).toBe(1);
  });

  it('a camada dos itens segue os pesos e tem teto que cresce com o nível', () => {
    const g = obter(CONTEUDO.estilos.get('guerreiro'));
    const efetivos = { ...NEUTRO, vontade: 60 };
    const no1 = Math.max(...camadaDosItens(g, NEUTRO, efetivos, 1, 100, regras));
    const no100 = Math.max(...camadaDosItens(g, NEUTRO, efetivos, 100, 100, regras));
    expect(no1).toBeCloseTo((regras.itemTetoPct / 100) * (regras.itemEscalaMinPct / 100));
    expect(no100).toBeCloseTo(regras.itemTetoPct / 100);
    expect(Math.max(...camadaDosItens(g, NEUTRO, NEUTRO, 100, 100, regras))).toBe(0);
  });

  it('a mecânica vem na força da ponta: chance × intensidade, passivo × intensidade', () => {
    const g = obter(CONTEUDO.estilos.get('mago')?.find((e) => e.id === 'artilheiro')?.ganchos[0]);
    expect(escalarGancho(g, 0.5)?.se.chancePct).toBe(50);
    expect(escalarGancho(g, 0)).toBeNull();
    const p = obter(CONTEUDO.estilos.get('mago')?.find((e) => e.id === 'guardiao')?.ganchos[0]);
    const escalado = escalarGancho(p, 0.25);
    expect(escalado?.efeito.tipo === 'passivo' && escalado.efeito.passivo.escudoPct).toBe(15);
  });

  it('o jogador vê o radar desde o nível 2, ganha as mecânicas e o aviso de estilo desperto', () => {
    const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 2, 2, ctx.balance);
    const bolsa = obter(j.bolsa);
    j.nivel = 2;
    bolsa.atributosBase.carisma += 3;
    recalcularFicha(j, ctx);
    const radar = obter(radarDe(ctx, bolsa, j.atributos, j.nivel));
    expect(radar.total.find((_, k) => radar.estilos[k]?.id === 'comandante')).toBeGreaterThan(0);
    expect(ganchosDosEstilos(ctx, j).length).toBeGreaterThan(0);
    const estado = criarEstado({ semente: 1, faseId: 't' });
    estado.entidades.push(j);
    const saida: EventoSimulacao[] = [];
    bolsa.atributosBase.carisma = 60;
    recalcularFicha(j, ctx);
    atualizarEstilosDespertos(estado, ctx, saida);
    expect(saida.some((e) => e.t === 'estiloDespertou' && e.estilo === 'comandante')).toBe(true);
    expect(j.estilos).toContain('comandante');
  });
});
