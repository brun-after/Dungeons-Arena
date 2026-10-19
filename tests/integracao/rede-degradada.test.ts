// Rede suportada e degradada sobre o WSS real (§5.6, marco 7B): servidor de verdade, proxy TCP com
// atraso, jitter e perda-como-retransmissão, e bots reais pelo SDK do Colyseus.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { contextoDaArena } from '../../src/arena/contexto-arena';
import { digest } from '../../src/core/digest';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { BotDeArena } from '../../src/net/bot';
import { ClienteArena } from '../../src/net/cliente';
import { conectarArena, type ConexaoArena } from '../../src/plataforma/transporte-colyseus';
import { iniciarServidor } from '../../server/servidor';
import { iniciarProxy, PERFIS, type Proxy } from '../../tools/rede/proxy';

let porta = 0;
let encerrar: () => Promise<void> = () => Promise.resolve();
const proxies: Proxy[] = [];

beforeAll(async () => {
  const s = await iniciarServidor({ porta: 0, regiao: 'teste' });
  porta = s.porta;
  encerrar = s.encerrar;
});

afterAll(async () => {
  for (const p of proxies) await p.encerrar();
  await encerrar();
});

interface Bot {
  conexao: ConexaoArena;
  cliente: ClienteArena;
  bot: BotDeArena;
  coletas: string[];
}

async function rodada(perfil: 'suportado' | 'degradado', quantos: number, segundos: number) {
  const p = PERFIS[perfil];
  if (!p) throw new Error(perfil);
  const proxy = await iniciarProxy({ porta: 0, destinoHost: '127.0.0.1', destinoPorta: porta, perfil: p, semente: 11 });
  proxies.push(proxy);
  const url = `ws://127.0.0.1:${proxy.porta}`;
  const ctx = contextoDaArena('livre', 'arena-01');
  const bots: Bot[] = [];
  let codigo: string | null = null;
  for (let i = 0; i < quantos; i++) {
    const conexao = await conectarArena(url, codigo ? { codigo } : { criar: true, fase: 'arena-01' });
    codigo = conexao.codigo;
    const cliente = new ClienteArena({ ctx, transporte: conexao.transporte, nome: `B${i}`, pedidoFicha: { classeId: 'aventureiro' }, agoraMs: () => performance.now() });
    const b: Bot = { conexao, cliente, bot: new BotDeArena(cliente, 50 + i, 2), coletas: [] };
    cliente.aoEventos = (eventos: EventoSimulacao[]) => {
      for (const ev of eventos) if (ev.t === 'coletou') b.coletas.push(ev.objetoId);
    };
    cliente.entrar();
    bots.push(b);
  }
  const laco = setInterval(() => {
    for (const b of bots) {
      b.bot.agir();
      b.cliente.passo();
    }
  }, DT_MS);
  await new Promise((r) => setTimeout(r, segundos * 1000));
  // Para de agir e deixa a rede assentar; os clientes seguem recebendo estado.
  clearInterval(laco);
  const assentar = setInterval(() => {
    for (const b of bots) b.cliente.passo();
  }, DT_MS);
  return {
    bots,
    parar: async () => {
      clearInterval(assentar);
      // 19/10/2026: aguarda a saída pelo proxy antes de destruir os sockets no teardown.
      await Promise.all(bots.map((b) => b.conexao.encerrar()));
    },
  };
}

/** Espera os dois clientes terem a base no mesmo tick e compara o digest do estado público. */
async function mesmoEstado(a: ClienteArena, b: ClienteArena): Promise<boolean> {
  for (let i = 0; i < 300; i++) {
    if (a.base && b.base && a.baseTick === b.baseTick) return digest(a.base) === digest(b.base);
    await new Promise((r) => setTimeout(r, 5));
  }
  return false;
}

describe('rede degradada sobre o WSS real (§5.6)', () => {
  it('perfil degradado: integridade preservada (sem rejeição, coleta única, estados iguais)', async () => {
    const { bots, parar } = await rodada('degradado', 3, 10);
    try {
      expect(bots.every((b) => b.cliente.conectado)).toBe(true);
      expect(bots.map((b) => b.cliente.rejeitados)).toEqual([0, 0, 0]);
      // Todos veem as mesmas coletas, cada objeto uma vez só.
      const [a, b] = bots;
      if (!a || !b) throw new Error('bots');
      expect(new Set(a.coletas).size).toBe(a.coletas.length);
      expect(await mesmoEstado(a.cliente, b.cliente)).toBe(true);
      // Depois da primeira medição de métricas (10 s), a metadata ainda tem a fase.
      let tick = 0;
      for (let i = 0; i < 60 && tick === 0; i++) {
        tick = ((await (await fetch(`http://127.0.0.1:${porta}/saude`)).json()) as { tick: { p95Ms: number } | null }).tick?.p95Ms ?? 0;
        if (tick === 0) await new Promise((r) => setTimeout(r, 100));
      }
      expect(tick).toBeGreaterThan(0);
      const sala = (await (await fetch(`http://127.0.0.1:${porta}/salas/${a.conexao.codigo}`)).json()) as { fase: string };
      expect(sala.fase).toBe('arena-01');
    } finally {
      await parar();
    }
  });

  it('perfil suportado: correção p99 ≤ 1 célula', async () => {
    const { bots, parar } = await rodada('suportado', 2, 8);
    try {
      const erros = bots.flatMap((b) => b.cliente.erros.slice(10)).sort((x, y) => x - y);
      const p99 = erros[Math.floor(erros.length * 0.99)] ?? 0;
      expect(p99).toBeLessThanOrEqual(1);
      expect(bots.every((b) => b.cliente.rejeitados === 0)).toBe(true);
    } finally {
      await parar();
    }
  });

  it('/salas informa a fase e /saude o pior tick das salas', async () => {
    const conexao = await conectarArena(`ws://127.0.0.1:${porta}`, { criar: true, fase: 'arena-02' });
    try {
      const sala = (await (await fetch(`http://127.0.0.1:${porta}/salas/${conexao.codigo}`)).json()) as { fase: string };
      expect(sala.fase).toBe('arena-02');
      const entrou = await conectarArena(`ws://127.0.0.1:${porta}`, { codigo: conexao.codigo });
      expect(entrou.fase).toBe('arena-02');
      await entrou.encerrar();
      const saude = (await (await fetch(`http://127.0.0.1:${porta}/saude`)).json()) as { tick: { p95Ms: number } | null };
      expect(saude.tick).not.toBeNull();
    } finally {
      await conexao.encerrar();
    }
  });
});
