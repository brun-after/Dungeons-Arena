// Marco 18 (17/10/2026, D-068): aprender uma habilidade é um estudo. O tempo vem do grau (B 15 min, A 30 min, S 1 h),
// a Inteligência encurta, só anda com o jogo rodando (tick de simulação, nos modos em que vale), um por vez, e cada
// ponto extra tira 1/3 do total.

import { describe, expect, it } from 'vitest';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { Comando, ComandoDoTick } from '../../src/core/comandos';
import { ticksDe } from '../../src/core/tempo';
import { criarJogador } from '../../src/entities/fabrica';
import { ticksDeEstudo } from '../../src/progression/habilidades-personagem';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined, nome: string): T {
  if (v === undefined) throw new Error(`${nome} ausente`);
  return v;
}

function cena(modoId = 'campanha') {
  const ctx = contexto(faseDeTexto(SALA_ABERTA), undefined, modoId);
  const estado = criarEstado({ semente: 2, faseId: 'teste' });
  estado.entidades.push(criarJogador(obter(CONTEUDO.classes.get('mago'), 'mago'), 'j', 3, 3, ctx.balance));
  const eventos: EventoSimulacao[] = [];
  const j = obter(buscarEntidade(estado, 'j'), 'j');
  const bolsa = obter(j.bolsa ?? undefined, 'bolsa');
  const tick = (cmd?: Comando) => {
    const pendentes: ComandoDoTick[] = cmd ? [{ tick: estado.tick, entidadeId: 'j', cmd }] : [];
    simular(estado, ctx, pendentes, eventos, DT_MS);
  };
  return { ctx, estado, eventos, j, bolsa, tick };
}

describe('estudo de habilidades', () => {
  it('o grau decide o tempo, e a Inteligência encurta', () => {
    const c = cena();
    const b = c.ctx.balance.habilidades.estudo;
    c.j.atributos = { ...c.j.atributos, inteligencia: 10 };
    expect(ticksDeEstudo(c.ctx, c.j, 'barreira')).toBe(ticksDe(b.B));
    expect(ticksDeEstudo(c.ctx, c.j, 'bola_de_fogo')).toBe(ticksDe(b.A));
    expect(ticksDeEstudo(c.ctx, c.j, 'nova_glacial')).toBe(ticksDe(b.S));
    c.j.atributos = { ...c.j.atributos, inteligencia: 20 };
    expect(ticksDeEstudo(c.ctx, c.j, 'nova_glacial')).toBe(ticksDe(b.S * (1 - Math.min(b.reducaoMaxPct, 10 * b.reducaoPorIntPct) / 100)));
  });

  it('aprender gasta o ponto e estuda; um por vez; termina sozinho com o jogo rodando', () => {
    const c = cena();
    c.bolsa.pontosHabilidade = 2;
    c.tick({ t: 'subirRank', id: 'nova_glacial' });
    expect(c.bolsa.pontosHabilidade).toBe(1);
    expect(c.bolsa.estudo?.id).toBe('nova_glacial');
    expect(c.bolsa.conhecidas.some((x) => x.id === 'nova_glacial')).toBe(false);
    c.tick({ t: 'subirRank', id: 'mente_partida' });
    expect(c.eventos.at(-1)).toMatchObject({ t: 'habilidadeRecusada', motivo: 'estudando' });
    // Encurta o estudo para o teste: o que importa é a contagem por tick.
    const estudo = obter(c.bolsa.estudo ?? undefined, 'estudo');
    estudo.restanteTicks = 5;
    for (let i = 0; i < 5; i++) c.tick();
    expect(c.bolsa.estudo).toBeNull();
    expect(c.bolsa.conhecidas.some((x) => x.id === 'nova_glacial')).toBe(true);
    expect(c.eventos.some((e) => e.t === 'estudoConcluido')).toBe(true);
  });

  it('cada ponto extra tira 1/3 do total (não do que falta); 3 terminam na hora; o quarto é recusado', () => {
    const c = cena();
    c.bolsa.pontosHabilidade = 5;
    c.tick({ t: 'subirRank', id: 'mente_partida' });
    const estudo = obter(c.bolsa.estudo ?? undefined, 'estudo');
    const total = estudo.totalTicks;
    for (let i = 0; i < 10; i++) c.tick();
    c.tick({ t: 'acelerarEstudo' });
    // O tick do pedido e os 10 seguintes contam, e o da aceleração também.
    expect(estudo.restanteTicks).toBe(total - 12 - Math.ceil(total / 3));
    c.tick({ t: 'acelerarEstudo' });
    c.tick({ t: 'acelerarEstudo' });
    expect(c.bolsa.estudo).toBeNull();
    expect(c.bolsa.pontosHabilidade).toBe(1);
    c.tick({ t: 'acelerarEstudo' });
    expect(c.eventos.at(-1)).toMatchObject({ t: 'habilidadeRecusada', motivo: 'sem_estudo' });
  });

  it('na arena (modo sem estudo) a contagem não anda', () => {
    const c = cena('livre');
    c.bolsa.estudo = { id: 'nova_glacial', totalTicks: 100, restanteTicks: 100, aceleracoes: 0 };
    for (let i = 0; i < 20; i++) c.tick();
    expect(c.bolsa.estudo.restanteTicks).toBe(100);
  });
});
