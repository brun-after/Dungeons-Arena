// Transporte WSS real (§3.1, §3.6) sobre o SDK do Colyseus. Implementa a mesma interface do
// loopback, então a ClienteArena não muda. O SDK reconecta sozinho por até 30 s e reenvia o que foi
// mandado durante a queda; a deduplicação por `seq` da sala impede aplicar duas vezes.

import { Client, type Room } from '@colyseus/sdk';
import type { Dificuldade } from '../modos/dificuldade';
import type { Transporte } from '../net/transporte';
import { lerRefFase, type RefFase } from '../save/esquema';

export type EstadoDaConexao = 'conectado' | 'reconectando' | 'encerrada';

export interface ConexaoArena {
  transporte: Transporte;
  /** Aguarda a confirmação de saída antes de liberar o servidor ou proxy. */
  encerrar: () => Promise<void>;
  /** Código curto da sala, para compartilhar (é o roomId, D-036). */
  codigo: string;
  /** Fase da sala (marco 7B): o cliente monta o contexto com ela. */
  fase: string;
  /** Avisos de queda, volta e encerramento (§4.12: "reconectando, voltou, sala encerrada"). */
  aoMudar: (ouvinte: (estado: EstadoDaConexao) => void) => void;
  /** Só para testes: derruba a conexão como se a rede tivesse caído. */
  derrubar: () => void;
}

/** Marco 17: ao criar, a faixa de nível da sala (sem ela, aberta). */
export type PedidoDeSala = { criar: true; fase?: string; faixa?: string } | { codigo: string };

interface InfoDaSala {
  tipo: string;
  fase: string | null;
  faseRef: RefFase | null;
}

/** Tipo e fase de uma sala existente, pela rota `/salas/:codigo` (marco 7B; o tipo e a referência, marco 15). */
async function infoDaSala(url: string, codigo: string): Promise<InfoDaSala> {
  const r = await fetch(`${url.replace(/^ws/, 'http')}/salas/${encodeURIComponent(codigo)}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(r.status === 404 ? 'nao_encontrada' : `sala ${codigo}: ${r.status}`);
  const corpo = (await r.json()) as { fase?: unknown; tipo?: unknown; faseRef?: unknown };
  return {
    tipo: typeof corpo.tipo === 'string' ? corpo.tipo : 'arena',
    fase: typeof corpo.fase === 'string' ? corpo.fase : null,
    faseRef: lerRefFase(corpo.faseRef),
  };
}

export async function conectarArena(url: string, pedido: PedidoDeSala): Promise<ConexaoArena> {
  const cliente = new Client(url);
  const fase = 'criar' in pedido ? (pedido.fase ?? 'arena-01') : ((await infoDaSala(url, pedido.codigo)).fase ?? 'arena-01');
  const sala: Room = 'criar' in pedido ? await cliente.create('arena', { fase, faixa: pedido.faixa ?? 'aberta' }) : await cliente.joinById(pedido.codigo);
  return { ...embrulhar(sala), fase };
}

/** Marco 15: criar o grupo (na fase e na dificuldade do anfitrião) ou entrar nele pelo código. */
export type PedidoDeGrupo = { criar: { faseRef: RefFase; dificuldade: Dificuldade } } | { codigo: string };

export interface ConexaoCampanha extends Omit<ConexaoArena, 'fase'> {
  /** A fase em que o grupo está agora (depois, `novaFase` avisa as trocas). */
  faseRef: RefFase;
}

export async function conectarCampanha(url: string, pedido: PedidoDeGrupo): Promise<ConexaoCampanha> {
  const cliente = new Client(url);
  if ('criar' in pedido) {
    const sala = await cliente.create('campanha', pedido.criar);
    return { ...embrulhar(sala), faseRef: pedido.criar.faseRef };
  }
  const info = await infoDaSala(url, pedido.codigo);
  if (info.tipo !== 'campanha' || !info.faseRef) throw new Error('nao_e_grupo');
  const sala = await cliente.joinById(pedido.codigo);
  return { ...embrulhar(sala), faseRef: info.faseRef };
}

function embrulhar(sala: Room): Omit<ConexaoArena, 'fase'> {
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

  // 19/10/2026: saída voluntária não reconecta se a rede cair durante o fechamento.
  const encerrar = () => {
    sala.reconnection.enabled = false;
    return sala.leave(true).then(() => {});
  };

  return {
    encerrar,
    codigo: sala.roomId,
    transporte: {
      enviar: (texto) => {
        sala.send('m', texto);
      },
      aoReceber: (fn) => {
        ouvinte = fn;
        for (const texto of pendentes.splice(0)) fn(texto);
      },
      fechar: () => {
        void encerrar();
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
