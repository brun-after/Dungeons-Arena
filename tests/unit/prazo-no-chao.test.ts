// Marco 26 (29/10/2026, D-122): o drop que ninguém pega some do chão no prazo; livros e raros ficam.
import { expect, it } from 'vitest';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { ticksDe } from '../../src/core/tempo';
import { expirarDrops, largarItem, largarObjeto, largarOuro } from '../../src/world/objetos';
import { contexto, faseDeTexto } from '../apoio/fases';

const SALA = ['##########', ...Array.from({ length: 6 }, () => '#........#'), '##########'];

it('orbes somem em 60 s, ouro e itens comuns em 180 s; livros e raros ficam', () => {
  const ctx = contexto(faseDeTexto(SALA));
  const estado = criarEstado({ semente: 1, faseId: 'teste' });
  const saida: EventoSimulacao[] = [];
  expect(largarObjeto(estado, 'orbe_hp', 1, 1, 10, 'abs', saida)).toBe(true);
  expect(largarOuro(estado, 5, 2, 1, saida)).toBe(true);
  expect(largarItem(estado, 'espada_curta', 3, 1, saida)).toBe(true);
  expect(largarItem(estado, 'livro_investida', 4, 1, saida)).toBe(true);
  expect(largarItem(estado, 'cota_malha', 5, 1, saida)).toBe(true);
  const restantes = () => estado.objetos.map((o) => o.itemId ?? o.tipo).sort();
  const ate = (ms: number) => {
    const fim = ticksDe(ms);
    while (estado.tick <= fim) {
      expirarDrops(estado, ctx);
      estado.tick++;
    }
  };
  const p = ctx.balance.economia.prazoNoChao;
  ate(p.orbeMs - 1000);
  expect(restantes()).toHaveLength(5);
  ate(p.orbeMs + 1000);
  expect(restantes()).toEqual(['cota_malha', 'espada_curta', 'livro_investida', 'ouro']);
  ate(Math.max(p.ouroMs, p.itemMs) + 1000);
  expect(restantes()).toEqual(['cota_malha', 'livro_investida']);
});

it('objetos da fase (sem tick de queda) nunca expiram', () => {
  const ctx = contexto(faseDeTexto(SALA));
  const estado = criarEstado({ semente: 1, faseId: 'teste' });
  largarOuro(estado, 5, 2, 1, []);
  const ouro = estado.objetos[0];
  if (!ouro) throw new Error('ouro');
  delete ouro.largadoTick;
  estado.tick = ticksDe(ctx.balance.economia.prazoNoChao.ouroMs) * 3;
  estado.tick -= estado.tick % 60;
  expirarDrops(estado, ctx);
  expect(estado.objetos).toHaveLength(1);
});
