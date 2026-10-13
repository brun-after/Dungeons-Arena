// Integração com o servidor real (Colyseus + WebSocket) numa porta local: tudo o que o loopback
// testa, agora pela rede de verdade, mais sala por código, saída do criador e reconexão.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { contextoDaArena } from '../../src/arena/contexto-arena';
import { DT_MS } from '../../src/core/loop';
import { BotDeArena } from '../../src/net/bot';
import { ClienteArena } from '../../src/net/cliente';
import { conectarArena, type ConexaoArena, type EstadoDaConexao } from '../../src/plataforma/transporte-colyseus';
import { codigoValido } from '../../server/codigo-sala';
import { iniciarServidor } from '../../server/servidor';

let porta = 0;
let encerrar: () => Promise<void> = () => Promise.resolve();
const url = () => `ws://localhost:${porta}`;
const ctx = contextoDaArena();

beforeAll(async () => {
  const s = await iniciarServidor({ porta: 0, regiao: 'teste' });
  porta = s.porta;
  encerrar = s.encerrar;
});

afterAll(async () => {
  await encerrar();
});

interface Jogador {
  conexao: ConexaoArena;
  cliente: ClienteArena;
  estados: EstadoDaConexao[];
}

async function jogador(pedido: { criar: true } | { codigo: string }, nome: string): Promise<Jogador> {
  const conexao = await conectarArena(url(), pedido);
  const cliente = new ClienteArena({ ctx, transporte: conexao.transporte, nome, pedidoFicha: { classeId: 'aventureiro' }, agoraMs: () => performance.now() });
  const estados: EstadoDaConexao[] = [];
  conexao.aoMudar((e) => estados.push(e));
  cliente.entrar();
  return { conexao, cliente, estados };
}

/** Roda os clientes a 60 Hz em tempo real por `ms`, com bots opcionais. */
async function jogar(ms: number, clientes: ClienteArena[], bots: BotDeArena[] = []): Promise<void> {
  await new Promise<void>((resolver) => {
    const intervalo = setInterval(() => {
      for (const b of bots) b.agir();
      for (const c of clientes) c.passo();
    }, DT_MS);
    setTimeout(() => {
      clearInterval(intervalo);
      resolver();
    }, ms);
  });
}

async function esperar(condicao: () => boolean, ms = 5000): Promise<void> {
  const inicio = Date.now();
  while (!condicao()) {
    if (Date.now() - inicio > ms) throw new Error('condição não atingida a tempo');
    await new Promise((r) => setTimeout(r, 20));
  }
}

describe('servidor real (Colyseus/WSS)', () => {
  it('/saude responde com versão e região', async () => {
    const r = await fetch(`http://localhost:${porta}/saude`);
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ ok: true, regiao: 'teste' });
  });

  it('criar sala gera código curto; outro entra pelo código e os dois se veem', async () => {
    const a = await jogador({ criar: true }, 'Criador');
    expect(codigoValido(a.conexao.codigo)).toBe(true);
    const busca = await fetch(`http://localhost:${porta}/salas/${a.conexao.codigo.toLowerCase()}`);
    expect(busca.status).toBe(200);
    const b = await jogador({ codigo: a.conexao.codigo }, 'Convidado');
    await esperar(() => a.cliente.conectado && b.cliente.conectado);
    await jogar(1500, [a.cliente, b.cliente], [new BotDeArena(a.cliente, 1), new BotDeArena(b.cliente, 2)]);
    for (const j of [a, b]) {
      const ids = j.cliente.base?.entidades.map((e) => e.id) ?? [];
      expect(ids).toEqual(expect.arrayContaining(['p1', 'p2']));
      expect(j.cliente.rejeitados).toBe(0);
    }
    a.conexao.transporte.fechar();
    b.conexao.transporte.fechar();
  });

  it('o criador sai e a sala continua para quem ficou (§2.13)', async () => {
    const a = await jogador({ criar: true }, 'Criador');
    const b = await jogador({ codigo: a.conexao.codigo }, 'Convidado');
    await esperar(() => a.cliente.conectado && b.cliente.conectado);
    await jogar(300, [a.cliente, b.cliente]);
    a.conexao.transporte.fechar();
    const tickAntes = b.cliente.baseTick;
    await jogar(1000, [b.cliente]);
    expect(b.cliente.baseTick).toBeGreaterThan(tickAntes + 30);
    expect(b.estados).not.toContain('encerrada');
    await esperar(() => !(b.cliente.base?.entidades.some((e) => e.id === 'p1') ?? true));
    b.conexao.transporte.fechar();
  });

  it('código inexistente é recusado', async () => {
    await expect(conectarArena(url(), { codigo: 'ZZZZZZ' })).rejects.toThrow();
    const r = await fetch(`http://localhost:${porta}/salas/ZZZZZZ`);
    expect(r.status).toBe(404);
  });

  it('queda e reconexão: mantém a entidade e o seq, e volta a receber estado', async () => {
    const a = await jogador({ criar: true }, 'Instável');
    await esperar(() => a.cliente.conectado);
    a.cliente.enviarComando({ t: 'mover', dir: 'E' });
    await jogar(300, [a.cliente]);
    const entidade = a.cliente.entidadeId;
    a.conexao.derrubar();
    await esperar(() => a.estados.includes('reconectando'));
    await esperar(() => a.estados.includes('conectado'), 10_000);
    const tickAntes = a.cliente.baseTick;
    await jogar(600, [a.cliente]);
    expect(a.cliente.baseTick).toBeGreaterThan(tickAntes);
    expect(a.cliente.entidadeId).toBe(entidade);
    expect(a.cliente.base?.entidades.some((e) => e.id === entidade)).toBe(true);
    a.conexao.transporte.fechar();
  }, 20_000);
});
