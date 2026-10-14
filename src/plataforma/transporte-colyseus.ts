// Transporte WSS real (§3.1, §3.6) sobre o SDK do Colyseus. Implementa a mesma interface do
// loopback, então a ClienteArena não muda. O SDK reconecta sozinho por até 30 s e reenvia o que foi
// mandado durante a queda; a deduplicação por `seq` da sala impede aplicar duas vezes.

import { Client, type Room } from '@colyseus/sdk';
import type { Transporte } from '../net/transporte';

export type EstadoDaConexao = 'conectado' | 'reconectando' | 'encerrada';

export interface ConexaoArena {
  transporte: Transporte;
  /** Código curto da sala, para compartilhar (é o roomId, D-036). */
  codigo: string;
  /** Fase da sala (marco 7B): o cliente monta o contexto com ela. */
  fase: string;
  /** Avisos de queda, volta e encerramento (§4.12: "reconectando, voltou, sala encerrada"). */
  aoMudar: (ouvinte: (estado: EstadoDaConexao) => void) => void;
  /** Só para testes: derruba a conexão como se a rede tivesse caído. */
  derrubar: () => void;
}

export type PedidoDeSala = { criar: true; fase?: string } | { codigo: string };

/** Fase de uma sala existente, pela rota `/salas/:codigo` (marco 7B). */
async function faseDaSala(url: string, codigo: string): Promise<string> {
  const r = await fetch(`${url.replace(/^ws/, 'http')}/salas/${encodeURIComponent(codigo)}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`sala ${codigo}: ${r.status}`);
  const corpo = (await r.json()) as { fase?: unknown };
  return typeof corpo.fase === 'string' ? corpo.fase : 'arena-01';
}

export async function conectarArena(url: string, pedido: PedidoDeSala): Promise<ConexaoArena> {
  const cliente = new Client(url);
  const fase = 'criar' in pedido ? (pedido.fase ?? 'arena-01') : await faseDaSala(url, pedido.codigo);
  const sala: Room = 'criar' in pedido ? await cliente.create('arena', { fase }) : await cliente.joinById(pedido.codigo);
  // Reconexão automática do SDK mesmo logo depois de entrar (o celular suspende a aba a qualquer hora).
  sala.reconnection.minUptime = 0;

  let ouvinte: ((texto: string) => void) | null = null;
  const pendentes: string[] = [];
  sala.onMessage('m', (texto: unknown) => {
    if (typeof texto !== 'string') return;
    if (ouvinte) ouvinte(texto);
    else pendentes.push(texto);
  });

  const ouvintesEstado: ((e: EstadoDaConexao) => void)[] = [];
  const avisar = (e: EstadoDaConexao) => {
    for (const fn of ouvintesEstado) fn(e);
  };
  sala.onDrop(() => {
    avisar('reconectando');
  });
  sala.onReconnect(() => {
    avisar('conectado');
  });
  sala.onLeave(() => {
    avisar('encerrada');
  });

  return {
    codigo: sala.roomId,
    fase,
    transporte: {
      enviar: (texto) => {
        sala.send('m', texto);
      },
      aoReceber: (fn) => {
        ouvinte = fn;
        for (const texto of pendentes.splice(0)) fn(texto);
      },
      fechar: () => {
        void sala.leave(true);
      },
    },
    aoMudar: (fn) => {
      ouvintesEstado.push(fn);
    },
    // 4010 = "pode tentar reconectar" no protocolo do Colyseus.
    derrubar: () => {
      sala.connection.close(4010, 'teste');
    },
  };
}
