// Servidor da arena (§3.1): Node + Colyseus sobre WebSocket. Rotas HTTP próprias:
//   GET /saude          → { ok, versao, regiao, salas, tick } para o Caddy, o deploy, o lobby e a carga
//                         (tick = pior p95/p99 entre as salas, da metadata de cada uma; marco 7B)
//   GET /salas/:codigo  → existe ou não (tipo, fase), com limite de tentativas por origem (§2.13)
//   POST /relatorios    → relatório anônimo do teste com pessoas (marco 7A, D-044)
//   POST /certificar    → marco 17 (D-063): certifica o personagem (corpo `{personagem, anterior}`, texto JSON)
//   GET /metricas       → marco 16 (D-062): processo (memória, uptime, atraso do agendador) e cada sala (tick,
//                         jogadores, banda, filas, entidades, rejeições, reconexões); agregado, sem dado pessoal
// O matchmaking do Colyseus continua nas rotas padrão (/matchmake/...).

import http from 'node:http';
import { createEndpoint, createRouter, defineRoom, defineServer, matchMaker } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { MAX_BYTES_MENSAGEM, versaoDoConteudo } from '../src/arena/protocolo';
import { codigoValido, LimiteDeTentativas, normalizarCodigo } from './codigo-sala';
import { monitorarAgendador, registrarLog } from './metricas';
import { SalaColyseusBase } from './salas/sala-base';
import { Certificador } from './certificacao';
import { contextoDaArena } from '../src/arena/contexto-arena';
import { receberRelatorio } from './relatorios';
import { SalaCampanhaColyseus } from './salas/sala-campanha';
import { SalaLivreColyseus } from './salas/sala-livre';

export interface OpcoesServidor {
  porta: number;
  regiao: string;
  /** Margem sobre o teto de 16 KiB por mensagem (envelope do Colyseus). */
  maxPayload?: number;
  /** Pasta dos relatórios do teste com pessoas (volume `dados` no Docker). */
  dirDados?: string;
  /** Marco 16: salas por processo (padrão 6, a VM de 1 GB) e criações por minuto por origem (padrão 6). */
  maxSalas?: number;
  criacoesPorMinuto?: number;
  /** Marco 17: chave do certificado do personagem (sem ela, uma chave sorteada por processo). */
  chaveCertificado?: string | undefined;
}

/** Teto do corpo do `/certificar` (um personagem com a mochila cheia cabe com folga). */
const MAX_CORPO_CERTIFICADO = 64 * 1024;

const MB = 1024 * 1024;
const arredondar = (v: number) => Math.round(v * 10) / 10;

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
  const limiteRelatorios = new LimiteDeTentativas(10, 60_000);
  const agendador = monitorarAgendador();
  const certificador = new Certificador(o.chaveCertificado);
  if (!Certificador.configurada(o.chaveCertificado)) registrarLog('certificado_chave_temporaria', {});
  const limiteCertificacao = new LimiteDeTentativas(30, 60_000);
  const ctxCertificacao = contextoDaArena();
  SalaColyseusBase.limites = {
    maxSalas: o.maxSalas ?? 6,
    criacao: new LimiteDeTentativas(o.criacoesPorMinuto ?? 6, 60_000),
    agendador,
    certificador,
  };
  const httpServer = http.createServer();
  const inicio = Date.now();

  const saude = createEndpoint('/saude', { method: 'GET' }, async () => {
    const salas = await matchMaker.query({});
    const metricas = salas.map((s) => (s.metadata ?? {}) as { tickP95Ms?: number; tickP99Ms?: number });
    const pior = (campo: 'tickP95Ms' | 'tickP99Ms') => Math.max(0, ...metricas.map((m) => m[campo] ?? 0));
    const tick = salas.length > 0 ? { p95Ms: pior('tickP95Ms'), p99Ms: pior('tickP99Ms') } : null;
    return resposta(200, { ok: true, versao: versaoDoConteudo(), regiao: o.regiao, salas: salas.length, tick });
  });
  const buscarSala = createEndpoint('/salas/:codigo', { method: 'GET' }, async (ctx) => {
    const origem = ctx.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    if (!limite.permitir(origem, Date.now())) return resposta(429, { ok: false, motivo: 'muitas_tentativas' });
    const codigo = normalizarCodigo(ctx.params.codigo);
    if (!codigoValido(codigo)) return resposta(400, { ok: false, motivo: 'codigo_invalido' });
    const salas = await matchMaker.query({ roomId: codigo });
    const sala = salas[0];
    if (!sala) return resposta(404, { ok: false, motivo: 'nao_encontrada' });
    const meta = (sala.metadata ?? {}) as { fase?: string; tipo?: string; faseRef?: unknown };
    // Marco 15: o tipo (arena ou campanha) e, na campanha, a referência da fase, para o cliente montar o contexto.
    return resposta(200, {
      ok: true,
      codigo,
      tipo: meta.tipo ?? 'arena',
      fase: meta.fase ?? null,
      ...(meta.faseRef !== undefined && { faseRef: meta.faseRef }),
      jogadores: sala.clients,
      maxJogadores: sala.maxClients,
    });
  });
  const relatorios = createEndpoint('/relatorios', { method: 'POST', disableBody: true }, async (ctx) => {
    const req = ctx.request;
    if (!req) return resposta(400, { ok: false, motivo: 'sem_corpo' });
    const tamanho = req.headers.get('content-length');
    const r = await receberRelatorio(
      { dir: o.dirDados ?? 'dados', limite: limiteRelatorios },
      {
        origem: req.headers.get('origin'),
        chaveLimite: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local',
        tamanho: tamanho === null ? null : Number(tamanho),
        texto: () => req.text(),
      },
      Date.now(),
    );
    if (r.status === 201) registrarLog('relatorio_recebido', {});
    return resposta(r.status, r.status === 201 ? { ok: true } : { ok: false, motivo: r.motivo });
  });

  const certificar = createEndpoint('/certificar', { method: 'POST', disableBody: true }, async (ctx) => {
    const req = ctx.request;
    if (!req) return resposta(400, { ok: false, motivo: 'sem_corpo' });
    const origem = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    if (!limiteCertificacao.permitir(origem, Date.now())) return resposta(429, { ok: false, motivo: 'muitas_tentativas' });
    const texto = await req.text();
    if (texto.length > MAX_CORPO_CERTIFICADO) return resposta(413, { ok: false, motivo: 'grande_demais' });
    let corpo: unknown;
    try {
      corpo = JSON.parse(texto);
    } catch {
      return resposta(400, { ok: false, motivo: 'json_invalido' });
    }
    const c = (corpo ?? {}) as { personagem?: unknown; anterior?: unknown };
    const r = certificador.certificar(c.personagem, c.anterior, ctxCertificacao, Date.now());
    registrarLog('certificacao', { ok: r.ok, ...(!r.ok && { motivo: r.motivo }) });
    return resposta(r.ok ? 200 : 422, r);
  });

  const metricas = createEndpoint('/metricas', { method: 'GET' }, async () => {
    const salas = await matchMaker.query({});
    const mem = process.memoryUsage();
    return resposta(200, {
      ok: true,
      versao: versaoDoConteudo(),
      processo: {
        rssMb: arredondar(mem.rss / MB),
        heapMb: arredondar(mem.heapUsed / MB),
        uptimeS: Math.round((Date.now() - inicio) / 1000),
        atrasoAgendadorP95Ms: agendador.p95Ms(),
        atrasoAgendadorP99Ms: agendador.p99Ms(),
      },
      limites: { maxSalas: SalaColyseusBase.limites?.maxSalas ?? null },
      salas: salas.length,
      clientes: salas.reduce((s, x) => s + x.clients, 0),
      porSala: salas.map((s) => ({ codigo: s.roomId, nome: s.name, clientes: s.clients, ...((s.metadata ?? {}) as Record<string, unknown>) })),
    });
  });

  const servidor = defineServer({
    rooms: { arena: defineRoom(SalaLivreColyseus), campanha: defineRoom(SalaCampanhaColyseus) },
    routes: createRouter({ saude, buscarSala, relatorios, metricas, certificar }),
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
