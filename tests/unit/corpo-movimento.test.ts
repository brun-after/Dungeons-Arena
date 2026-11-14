// Marco 40 (14/11/2026, D-164): o corpo do movimento da classe no desenho — o Salto de Guerra sai do chão num arco.
import { describe, expect, it } from 'vitest';
import type { Comando } from '../../src/core/comandos';
import { criarEstado } from '../../src/core/estado';
import { Barramento } from '../../src/core/events';
import type { EventoSimulacao, EventosDaSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { simular } from '../../src/core/simulacao';
import { criarJogador } from '../../src/entities/fabrica';
import { CorpoEmMovimento } from '../../src/render/movimento/corpo-movimento';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));

describe('corpo do movimento da classe (D-164)', () => {
  const saltar = (comEventos: boolean) => {
    const estado = criarEstado({ semente: 3, faseId: ctx.fase.id });
    const classe = CONTEUDO.classes.get('guerreiro');
    if (!classe) throw new Error('sem guerreiro');
    const j = criarJogador(classe, 'j', 2, 5, ctx.balance);
    estado.entidades.push(j);
    const bus = new Barramento<EventosDaSimulacao>();
    let agora = 0;
    const tipos = new Map([...ctx.conteudo.movimentos.values()].flat().map((m) => [m.id, m.tipo] as const));
    const corpo = new CorpoEmMovimento({ tipoDe: (id) => tipos.get(id) ?? null, posicao: (e) => ({ x: e.px, y: e.py }), raioNevoa: 5 });
    if (comEventos) corpo.ligar(bus, () => estado, () => agora);
    const alturas: (number | null)[] = [];
    const passo = (cmds: Comando[]) => {
      const eventos: EventoSimulacao[] = [];
      simular(estado, ctx, cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })), eventos, DT_MS);
      for (const ev of eventos) bus.emitir(ev.t, ev);
      agora += DT_MS;
      const a = corpo.ajuste(j, agora, estado);
      alturas.push(a?.estado === 'saltar' ? a.alturaPx : null);
    };
    passo([{ t: 'movimentoClasse', dx: 1, dy: 0 }]);
    for (let i = 0; i < 90; i++) passo([]);
    return alturas.filter((h): h is number => h !== null);
  };
  for (const [nome, comEventos] of [['com os eventos', true], ['sem os eventos (online)', false]] as const) {
    it(`o Salto de Guerra sobe num arco e volta ao chão, com a pose de salto (${nome})`, () => {
      const noAr = saltar(comEventos);
      expect(noAr.length).toBeGreaterThan(10);
      expect(Math.max(...noAr)).toBeGreaterThan(60);
      // Sobe e desce: o pico fica no meio do salto.
      const pico = noAr.indexOf(Math.max(...noAr));
      expect(pico).toBeGreaterThan(noAr.length * 0.25);
      expect(pico).toBeLessThan(noAr.length * 0.75);
    });
  }
});
