// Servidor da arena (§3.1): Node + Colyseus sobre WebSocket. Rotas HTTP próprias:
//   GET /saude          → { ok, versao, regiao, salas, tick } para o Caddy, o deploy, o lobby e a carga
//                         (tick = pior p95/p99 entre as salas, da metadata de cada uma; marco 7B)
//   GET /salas/:codigo  → existe ou não (tipo, fase), com limite de tentativas por origem (§2.13)
//   GET /salas?faixa=X  → marco 17: até 10 salas da arena com vaga naquela faixa de nível
//   POST /relatorios    → relatório anônimo do teste com pessoas (marco 7A, D-044)
//   POST /certificar    → marco 17 (D-063): certifica o personagem (corpo `{personagem, anterior}`, texto JSON)
//   GET /mundo/personagens → marco 29 (D-128): os personagens do Mundo da conta (cabeçalho `Authorization: Bearer`)
//   GET /metricas       → marco 16 (D-062): processo (memória, uptime, atraso do agendador) e cada sala (tick,
//                         jogadores, banda, filas, entidades, rejeições, reconexões); agregado, sem dado pessoal
// O matchmaking do Colyseus continua nas rotas padrão (/matchmake/...).

import { MercadoEmMemoria, MercadoSupabase, type LojaDoMercado } from './mercado-mundo';
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
import { CoordenadorDoMundo, reinoDoMundo, SalaMundoColyseus } from './salas/sala-mundo';
import { conteudoOficial } from '../src/core/conteudo';
import { PersistenciaEmMemoria, PersistenciaSupabase, type PersistenciaMundo } from './persistencia-mundo';

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
  /** Marco 29 (D-128): o Supabase do Mundo (a chave de serviço é segredo do GitHub). Sem os dois, o Mundo guarda na memória. */
  supabaseUrl?: string | undefined;
  supabaseChaveServico?: string | undefined;
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
  // Marco 29 (D-128): sem a nuvem configurada, o Mundo roda na memória (desenvolvimento e testes; nada persiste).
  const conteudoMundo = conteudoOficial();
  const persistencia: PersistenciaMundo =
    o.supabaseUrl && o.supabaseChaveServico ? new PersistenciaSupabase(o.supabaseUrl, o.supabaseChaveServico, reinoDoMundo(conteudoMundo)) : new PersistenciaEmMemoria();
  if (!(o.supabaseUrl && o.supabaseChaveServico)) registrarLog('mundo_sem_nuvem', {});
  // Marco 30 (D-129): os anúncios do mercado ficam no mesmo Supabase (ou na memória).
  const mercado: LojaDoMercado = o.supabaseUrl && o.supabaseChaveServico ? new MercadoSupabase(o.supabaseUrl, o.supabaseChaveServico) : new MercadoEmMemoria();
  const coordenador = new CoordenadorDoMundo(persistencia, conteudoMundo, mercado);
  SalaMundoColyseus.coordenador = coordenador;
  const limiteMundo = new LimiteDeTentativas(30, 60_000);
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
  // Marco 17: as salas da arena com vaga numa faixa (o lobby sugere as da faixa do personagem).
  const listarSalas = createEndpoint('/salas', { method: 'GET' }, async (ctx) => {
    const origem = ctx.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    if (!limite.permitir(origem, Date.now())) return resposta(429, { ok: false, motivo: 'muitas_tentativas' });
    const faixa = new URL(ctx.request?.url ?? '/', 'http://local').searchParams.get('faixa') ?? 'aberta';
    const salas = (await matchMaker.query({ name: 'arena' }))
      .filter((s) => ((s.metadata ?? {}) as { faixa?: string }).faixa === faixa && s.clients < s.maxClients && !s.locked)
      .slice(0, 10)
      .map((s) => ({ codigo: s.roomId, fase: ((s.metadata ?? {}) as { fase?: string }).fase ?? null, jogadores: s.clients, maxJogadores: s.maxClients }));
    return resposta(200, { ok: true, faixa, salas });
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

  const personagensMundo = createEndpoint('/mundo/personagens', { method: 'GET' }, async (ctx) => {
    const req = ctx.request;
    const origem = req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    if (!limiteMundo.permitir(origem, Date.now())) return resposta(429, { ok: false, motivo: 'muitas_tentativas' });
    const token = req?.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
    const conta = token ? await persistencia.autenticar(token) : null;
    if (!conta) return resposta(401, { ok: false, motivo: 'sem_conta' });
    return resposta(200, { ok: true, personagens: await persistencia.listar(conta) });
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
    rooms: {
      arena: defineRoom(SalaLivreColyseus),
      campanha: defineRoom(SalaCampanhaColyseus),
      mundo: defineRoom(SalaMundoColyseus).filterBy(['lugar', 'instancia']),
    },
    routes: createRouter({ saude, buscarSala, listarSalas, relatorios, metricas, certificar, personagensMundo }),
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
