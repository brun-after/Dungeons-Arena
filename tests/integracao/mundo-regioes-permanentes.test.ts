// 22/11/2026 (D-201): a sala de cada região do Mundo abre quando o servidor sobe e nunca expira. Vazia há 120 s, ela
// dorme (para de simular) em vez de fechar, e acorda quando alguém entra.

import { matchMaker } from '@colyseus/core';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { versaoDoConteudo } from '../../src/arena/protocolo';
import { conectarMundo } from '../../src/plataforma/transporte-colyseus';
import { EXPIRACAO_SALA_VAZIA_MS } from '../../server/salas/sala-base';
import { SalaMundoColyseus } from '../../server/salas/sala-mundo';
import { iniciarServidor } from '../../server/servidor';

let porta = 0;
let encerrar: () => Promise<void> = () => Promise.resolve();

beforeAll(async () => {
  const s = await iniciarServidor({ porta: 0, regiao: 'teste' });
  porta = s.porta;
  encerrar = s.encerrar;
});

afterAll(async () => {
  await encerrar();
});

async function esperar<T>(achar: () => Promise<T | undefined> | T | undefined, ms = 10_000): Promise<T> {
  const inicio = Date.now();
  for (;;) {
    const v = await achar();
    if (v !== undefined) return v;
    if (Date.now() - inicio > ms) throw new Error('condição não atingida a tempo');
    await new Promise((r) => setTimeout(r, 20));
  }
}

/** O que o teste olha por dentro da sala (campos privados da base). */
interface Interna {
  dormindo: boolean;
  vaziaDesde: number | null;
  expirarSeVazia(): void;
  sala: { estado: { tick: number } };
}

const LUGAR = 'regiao:vila_do_centro';

it('a região abre a sala permanente, que dorme vazia em vez de expirar e acorda com quem entra', async () => {
  SalaMundoColyseus.coordenador?.aquecer(1, true, [LUGAR]);
  const doLugar = async () => (await matchMaker.query({ name: 'mundo' })).filter((s) => (s.metadata as { lugar?: unknown } | undefined)?.lugar === LUGAR);
  const sala = await esperar(async () => (await doLugar())[0]);
  expect(sala.metadata).toMatchObject({ canal: 1, instancia: '' });

  const interna = matchMaker.getLocalRoomById(sala.roomId) as unknown as Interna;
  // Recém-aberta e sem ninguém, dorme no primeiro segundo (não há ficha a gravar).
  await esperar(() => (interna.dormindo ? true : undefined), 3000);
  const parado = interna.sala.estado.tick;
  await new Promise((r) => setTimeout(r, 150));
  expect(interna.sala.estado.tick).toBe(parado);

  const conexao = await conectarMundo(`ws://localhost:${String(porta)}`, 'local:permanente', { lugar: LUGAR, slot: 1, criar: { classeId: 'mago', nome: 'Acorda' } });
  conexao.transporte.enviar(JSON.stringify({ t: 'entrar', nome: 'x', pedidoFicha: null, versaoConteudo: versaoDoConteudo() }));
  await esperar(() => (interna.dormindo ? undefined : true));
  await esperar(() => (interna.sala.estado.tick > parado ? true : undefined));
  expect((await doLugar()).map((s) => s.roomId)).toEqual([sala.roomId]);

  // Quem jogou e saiu: a sala segue acordada; vencidos os 120 s, dorme em vez de fechar.
  conexao.transporte.fechar();
  await esperar(() => (interna.vaziaDesde !== null ? true : undefined));
  interna.expirarSeVazia();
  expect(interna.dormindo).toBe(false);
  interna.vaziaDesde = Date.now() - EXPIRACAO_SALA_VAZIA_MS - 1;
  interna.expirarSeVazia();
  expect(interna.dormindo).toBe(true);
  await new Promise((r) => setTimeout(r, 100));
  expect((await doLugar()).map((s) => s.roomId)).toEqual([sala.roomId]);
});
