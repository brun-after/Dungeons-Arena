// Marco 16 (15/10/2026, D-062, §3.6, aceite 20): limites do processo e métricas — o servidor recusa salas acima do
// limite (`servidor_cheio`) e criações demais da mesma origem (`muitas_salas`), e o `/metricas` responde agregado.

import { afterEach, describe, expect, it } from 'vitest';
import { conectarArena } from '../../src/plataforma/transporte-colyseus';
import { iniciarServidor } from '../../server/servidor';

let encerrar: (() => Promise<void>) | null = null;

afterEach(async () => {
  await encerrar?.();
  encerrar = null;
});

async function servidor(maxSalas: number, criacoesPorMinuto: number): Promise<string> {
  const s = await iniciarServidor({ porta: 0, regiao: 'teste', maxSalas, criacoesPorMinuto });
  encerrar = s.encerrar;
  return `ws://localhost:${s.porta}`;
}

describe('limites do servidor', () => {
  it('acima do limite de salas por processo, a criação é recusada com motivo', async () => {
    const url = await servidor(1, 10);
    const a = await conectarArena(url, { criar: true });
    await expect(conectarArena(url, { criar: true })).rejects.toThrow('servidor_cheio');
    // Entrar numa sala existente continua valendo.
    const b = await conectarArena(url, { codigo: a.codigo });
    a.transporte.fechar();
    b.transporte.fechar();
  });

  it('criações demais da mesma origem num minuto são recusadas', async () => {
    const url = await servidor(10, 2);
    const salas = [await conectarArena(url, { criar: true }), await conectarArena(url, { criar: true })];
    await expect(conectarArena(url, { criar: true })).rejects.toThrow('muitas_salas');
    for (const s of salas) s.transporte.fechar();
  });

  it('/metricas: processo e cada sala, sem dado pessoal', async () => {
    const url = await servidor(6, 6);
    const a = await conectarArena(url, { criar: true, fase: 'arena-02' });
    // A metadata de métricas é atualizada na criação; o tick vem a cada 10 s.
    const r = await fetch(`${url.replace('ws', 'http')}/metricas`);
    expect(r.status).toBe(200);
    const m = (await r.json()) as { processo: Record<string, number>; salas: number; clientes: number; porSala: Record<string, unknown>[]; limites: { maxSalas: number } };
    expect(m.processo.rssMb).toBeGreaterThan(0);
    expect(m.processo.uptimeS).toBeGreaterThanOrEqual(0);
    expect(typeof m.processo.atrasoAgendadorP95Ms).toBe('number');
    expect(m.limites.maxSalas).toBe(6);
    expect(m.salas).toBe(1);
    expect(m.porSala[0]).toMatchObject({ codigo: a.codigo, tipo: 'arena', fase: 'arena-02' });
    expect(Object.keys(m.porSala[0] ?? {})).toEqual(expect.arrayContaining(['tickP95Ms', 'tickP99Ms', 'entidades', 'fila', 'rejeicoes', 'reconexoes', 'bytesPorClientePorS']));
    a.transporte.fechar();
  });
});
