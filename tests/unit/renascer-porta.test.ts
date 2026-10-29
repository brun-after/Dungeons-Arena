// Marco 26 (29/10/2026, D-123): quem renasce não cai na porta de retorno (no primeiro spawn) e, parado, não volta de
// fase sem querer.
import { expect, it } from 'vitest';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { ticksDe } from '../../src/core/tempo';
import { criarJogador } from '../../src/entities/fabrica';
import { processarMortes } from '../../src/progression/morte';
import { comRetorno } from '../../src/save/retorno';
import { carregarFase, type FaseJson } from '../../src/world/fase';
import { ehCelulaDePorta, processarPortas } from '../../src/world/portas';
import { CONTEUDO, contexto, SALA_ABERTA } from '../apoio/fases';

it('renasce fora da porta de retorno e, parado, não volta de fase', () => {
  const json: FaseJson = { id: 'sala', nome: 'Sala', ordem: 1, tipo: 'campanha', mapa: SALA_ABERTA, spawns: [{ x: 2, y: 2 }] };
  const base = contexto(carregarFase(json));
  const ctx = { ...base, fase: comRetorno(base.fase, { tipo: 'oficial', id: 'fase-02' }) };
  expect(ctx.fase.portaRetorno).toEqual({ x: 2, y: 2 });
  const estado = criarEstado({ semente: 4, faseId: json.id });
  const classe = CONTEUDO.classes.get('aventureiro');
  if (!classe) throw new Error('classe');
  const j = criarJogador(classe, 'j', 6, 4, ctx.balance);
  estado.entidades.push(j);
  estado.tick = 100;
  j.hp = 0;
  j.morto = true;
  j.reviverEmTick = estado.tick;

  const eventos: EventoSimulacao[] = [];
  processarMortes(estado, ctx, eventos);
  expect(j.morto).toBe(false);
  expect(eventos.some((e) => e.t === 'reviveu')).toBe(true);
  expect(ehCelulaDePorta(estado, ctx, j.x, j.y)).toBe(false);
  expect(Math.max(Math.abs(j.x - 2), Math.abs(j.y - 2))).toBeLessThanOrEqual(1);

  const saida: EventoSimulacao[] = [];
  for (let i = 0; i <= ticksDe(ctx.balance.portas.esperaMs) + 5; i++) {
    estado.tick++;
    processarPortas(estado, ctx, saida);
  }
  expect(saida.some((e) => e.t === 'saidaAlcancada')).toBe(false);
});
