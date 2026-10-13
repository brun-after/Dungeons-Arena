// Servidor da arena (§3.1): Node + Colyseus sobre WebSocket. Rotas HTTP próprias:
//   GET /saude          → { ok, versao, regiao, salas } para o Caddy, o deploy e o lobby (ping/região)
//   GET /salas/:codigo  → existe ou não, com limite de tentativas por origem (§2.13)
// O matchmaking do Colyseus continua nas rotas padrão (/matchmake/...).

import http from 'node:http';
import { createEndpoint, createRouter, defineRoom, defineServer, matchMaker } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { MAX_BYTES_MENSAGEM, versaoDoConteudo } from '../src/arena/protocolo';
import { codigoValido, LimiteDeTentativas, normalizarCodigo } from './codigo-sala';
import { registrarLog } from './metricas';
import { SalaLivreColyseus } from './salas/sala-livre';

export interface OpcoesServidor {
  porta: number;
  regiao: string;
  /** Margem sobre o teto de 16 KiB por mensagem (envelope do Colyseus). */
  maxPayload?: number;
}

const CABECALHOS_JSON = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'cache-control': 'no-store',
};

function resposta(status: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), { status, headers: CABECALHOS_JSON });
}

export async function iniciarServidor(o: OpcoesServidor): Promise<{ porta: number; encerrar: () => Promise<void> }> {
  const limite = new LimiteDeTentativas(20, 60_000);
  const httpServer = http.createServer();

  const saude = createEndpoint('/saude', { method: 'GET' }, async () => {
    const salas = await matchMaker.query({});
    return resposta(200, { ok: true, versao: versaoDoConteudo(), regiao: o.regiao, salas: salas.length });
  });
  const buscarSala = createEndpoint('/salas/:codigo', { method: 'GET' }, async (ctx) => {
    const origem = ctx.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    if (!limite.permitir(origem, Date.now())) return resposta(429, { ok: false, motivo: 'muitas_tentativas' });
    const codigo = normalizarCodigo(ctx.params.codigo);
    if (!codigoValido(codigo)) return resposta(400, { ok: false, motivo: 'codigo_invalido' });
    const salas = await matchMaker.query({ roomId: codigo });
    const sala = salas[0];
    if (!sala) return resposta(404, { ok: false, motivo: 'nao_encontrada' });
    return resposta(200, { ok: true, codigo, jogadores: sala.clients, maxJogadores: sala.maxClients });
  });

  const servidor = defineServer({
    rooms: { arena: defineRoom(SalaLivreColyseus) },
    routes: createRouter({ saude, buscarSala }),
    transport: new WebSocketTransport({ server: httpServer, maxPayload: o.maxPayload ?? MAX_BYTES_MENSAGEM + 4096 }),
    greet: false,
    gracefullyShutdown: false,
  });
  await servidor.listen(o.porta);
  const endereco = httpServer.address();
  const porta = typeof endereco === 'object' && endereco ? endereco.port : o.porta;
  registrarLog('servidor_iniciado', { porta, regiao: o.regiao, versao: versaoDoConteudo() });
  return {
    porta,
    encerrar: async () => {
      await servidor.gracefullyShutdown(false);
    },
  };
}
