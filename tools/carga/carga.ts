// Teste de carga da arena (§5.6, tools/carga): N clientes bot reais pelo WebSocket, numa mesma sala.
// Relata RTT, erro de correção (p95/p99 e teleportes), banda recebida e enviada por cliente,
// rejeições, janela útil de aviso por habilidade, tempo de reconexão e o tick do servidor.
//
//   npm run carga -- --url ws://localhost:2567 --clientes 10 --segundos 120
//   npm run carga -- --url ws://localhost:2567 --perfil suportado --fase arena-02 --segundos 300
//   npm run carga -- --url wss://seu-nome.duckdns.org --fase arena-02 --segundos 1800 --registrar
//
// `--perfil` (suportado|degradado) põe o proxy de rede degradada (tools/rede) na frente de um
// servidor `ws://` local (D-045). `--registrar` acrescenta uma linha em docs/BENCHMARKS.md.
// Marco 7B (13/10/2026): perfis, fase, p99/teleportes, aviso, reconexão, banda enviada e tick.
// Marco 16 (15/10/2026, D-062): `--modo grupo` (campanha cooperativa, até 6 bots, cada um com o seu personagem),
// `/metricas` amostrado a cada 10 s (série do tick e da memória, com a tendência) e `--marco` no registro.
//
//   npm run carga -- --modo grupo --clientes 6 --perfil suportado --segundos 300

import { appendFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { contextoDaArena } from '../../src/arena/contexto-arena';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { BotDeArena } from '../../src/net/bot';
import { ClienteArena } from '../../src/net/cliente';
import { pedidoDoPersonagem } from '../../src/coop/personagem';
import { MODO_COOPERATIVO } from '../../src/coop/sala-campanha';
import { conteudoOficial, modoPorId } from '../../src/core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../../src/core/contexto';
import { criarJogador } from '../../src/entities/fabrica';
import { conectarArena, conectarCampanha, type ConexaoArena } from '../../src/plataforma/transporte-colyseus';
import type { RefFase } from '../../src/save/esquema';
import { contextoDaFase, FASE_INICIAL, faseOficialOuGerada } from '../../src/save/fases-campanha';
import { iniciarProxy, PERFIS, type Proxy } from '../rede/proxy';

const { values } = parseArgs({
  options: {
    url: { type: 'string', default: 'ws://localhost:2567' },
    clientes: { type: 'string', default: '10' },
    segundos: { type: 'string', default: '60' },
    perfil: { type: 'string' },
    fase: { type: 'string', default: 'arena-01' },
    registrar: { type: 'boolean', default: false },
    modo: { type: 'string', default: 'arena' },
    marco: { type: 'string', default: '16' },
  },
});
const urlServidor = values.url;
const grupo = values.modo === 'grupo';
const quantidade = Math.max(1, Math.min(grupo ? 6 : 10, Number(values.clientes)));
const segundos = Math.max(5, Number(values.segundos));
const fase = values.fase;
const perfilNome = values.perfil ?? null;
const TELEPORTE_CELULAS = 2;

function percentil(v: readonly number[], p: number): number {
  if (v.length === 0) return 0;
  const o = [...v].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor(o.length * p))] ?? 0;
}

// Perfil de rede: proxy local na frente do servidor ws:// (o wss:// remoto já é rede real).
let proxy: Proxy | null = null;
let url = urlServidor;
if (perfilNome) {
  const perfil = PERFIS[perfilNome];
  const m = /^ws:\/\/([\w.-]+):(\d+)$/.exec(urlServidor);
  if (!perfil || !m?.[1] || !m[2]) {
    console.error('--perfil precisa de suportado|degradado e de --url ws://host:porta (servidor local)');
    process.exit(2);
  }
  proxy = await iniciarProxy({ porta: 0, destinoHost: m[1], destinoPorta: Number(m[2]), perfil });
  url = `ws://127.0.0.1:${proxy.porta}`;
}

interface Participante {
  cliente: ClienteArena;
  conexao: Omit<ConexaoArena, 'fase'>;
  bot: BotDeArena;
  recebidos: number;
  enviados: number;
}

const conteudo = conteudoOficial();
/** Marco 16: o contexto de uma fase da campanha cooperativa (para os bots do `--modo grupo`). */
function contextoDoGrupo(ref: RefFase): ContextoSimulacao | null {
  const r = contextoDaFase(conteudo, faseOficialOuGerada(ref, conteudo), modoPorId(conteudo, MODO_COOPERATIVO));
  return r.ok ? r.ctx : null;
}
const ctx = grupo ? (contextoDoGrupo(FASE_INICIAL) ?? contextoDaArena('livre', fase)) : contextoDaArena('livre', fase);
const CLASSES_DO_GRUPO = ['guerreiro', 'mago', 'arqueiro', 'aventureiro'];
/** No grupo, cada bot traz um personagem de classe diferente (a sala confere a ficha como a de qualquer jogador). */
function pedidoDoBot(i: number): unknown {
  const classe = conteudo.classes.get(CLASSES_DO_GRUPO[i % CLASSES_DO_GRUPO.length] ?? 'aventureiro');
  return grupo && classe ? pedidoDoPersonagem(criarJogador(classe, 'j1', 1, 1, BALANCE_PADRAO)) : { classeId: 'aventureiro' };
}
/** Janela útil de aviso por habilidade (ms): tempo até o impacto menos o RTT (o evento chega e o comando volta). */
const janelas = new Map<string, number[]>();

async function conectar(pedido: { criar: true; fase: string } | { codigo: string }, i: number): Promise<Participante> {
  const conexao = grupo
    ? await conectarCampanha(url, 'criar' in pedido ? { criar: { faseRef: FASE_INICIAL, dificuldade: 'normal' } } : pedido)
    : await conectarArena(url, pedido);
  const p: Participante = { cliente: null as unknown as ClienteArena, conexao, bot: null as unknown as BotDeArena, recebidos: 0, enviados: 0 };
  // Conta os bytes recebidos e enviados por cliente.
  const original = conexao.transporte.aoReceber.bind(conexao.transporte);
  const transporte = {
    ...conexao.transporte,
    enviar: (texto: string) => {
      p.enviados += texto.length;
      conexao.transporte.enviar(texto);
    },
    aoReceber: (fn: (texto: string) => void) => {
      original((texto) => {
        p.recebidos += texto.length;
        fn(texto);
      });
    },
  };
  p.cliente = new ClienteArena({
    ctx,
    transporte,
    nome: `Bot ${i + 1}`,
    pedidoFicha: pedidoDoBot(i),
    agoraMs: () => performance.now(),
    ...(grupo && { contextoDe: contextoDoGrupo }),
  });
  p.bot = new BotDeArena(p.cliente, 100 + i);
  const cliente = p.cliente;
  cliente.aoEventos = (eventos: EventoSimulacao[]) => {
    for (const ev of eventos) {
      if (ev.t !== 'acaoIniciada') continue;
      const ator = cliente.base?.entidades.find((e) => e.id === ev.atorId);
      const hab = resolverHabilidade(ctx, ev.chave);
      if (ator?.controlador !== 'ia' || !hab || hab.politicaImpacto === 'proprio') continue;
      const lista = janelas.get(ev.habilidadeId) ?? [];
      lista.push((ev.impactoPrevistoTick - ev.tick) * DT_MS - cliente.rttMs);
      janelas.set(ev.habilidadeId, lista);
    }
  };
  cliente.entrar();
  return p;
}

const cena = grupo ? `campanha em grupo (${FASE_INICIAL.id})` : fase;
console.log(`Carga: ${quantidade} clientes em ${urlServidor}${perfilNome ? ` (perfil ${perfilNome})` : ''}, ${cena}, por ${segundos} s`);
const primeiro = await conectar({ criar: true, fase }, 0);
const codigo = primeiro.conexao.codigo;
const participantes = [primeiro];
for (let i = 1; i < quantidade; i++) participantes.push(await conectar({ codigo }, i));
console.log(`Sala ${codigo} com ${participantes.length} clientes`);

const inicio = performance.now();
const laco = setInterval(() => {
  for (const p of participantes) {
    p.bot.agir();
    p.cliente.passo();
  }
}, DT_MS);
/** Marco 16: série do `/metricas` (a cada 10 s): memória do processo, atraso do agendador e o tick desta sala. */
interface Amostra {
  s: number;
  rssMb: number;
  heapMb: number;
  atrasoP95Ms: number;
  tickP95Ms: number;
  tickP99Ms: number;
}
const amostras: Amostra[] = [];
async function amostrarMetricas(): Promise<void> {
  try {
    const r = await fetch(`${urlServidor.replace(/^ws/, 'http')}/metricas`, { cache: 'no-store' });
    if (!r.ok) return;
    const m = (await r.json()) as {
      processo: { rssMb: number; heapMb: number; atrasoAgendadorP95Ms: number };
      porSala: { codigo: string; tickP95Ms?: number; tickP99Ms?: number }[];
    };
    const sala = m.porSala.find((x) => x.codigo === codigo);
    amostras.push({
      s: Math.round((performance.now() - inicio) / 1000),
      rssMb: m.processo.rssMb,
      heapMb: m.processo.heapMb,
      atrasoP95Ms: m.processo.atrasoAgendadorP95Ms,
      tickP95Ms: sala?.tickP95Ms ?? 0,
      tickP99Ms: sala?.tickP99Ms ?? 0,
    });
  } catch {
    // Servidor sem `/metricas` (versão antiga): segue sem a série.
  }
}
const relatorio = setInterval(() => {
  const rtt = participantes.map((p) => p.cliente.rttMs);
  void amostrarMetricas().then(() => {
    const a = amostras.at(-1);
    console.log(
      `  ${Math.round((performance.now() - inicio) / 1000)} s · RTT médio ${Math.round(rtt.reduce((x, y) => x + y, 0) / rtt.length)} ms` +
        (a ? ` · RSS ${a.rssMb} MB · tick p95 ${a.tickP95Ms} ms · agendador p95 ${a.atrasoP95Ms} ms` : ''),
    );
  });
}, 10_000);

// Reconexão (§5.6: controle de volta em ≤ 5 s): derruba um cliente no meio do teste.
const queda: { ms: number | null } = { ms: null };
const vitima = participantes[participantes.length > 1 ? 1 : 0];
if (vitima && segundos >= 20) {
  setTimeout(() => {
    const caiu = performance.now();
    vitima.conexao.aoMudar((estado) => {
      if (estado === 'conectado' && queda.ms === null) queda.ms = Math.round(performance.now() - caiu);
    });
    vitima.conexao.derrubar();
  }, (segundos * 1000) / 2);
}

await new Promise((r) => setTimeout(r, segundos * 1000));
clearInterval(laco);
clearInterval(relatorio);
const duracaoS = (performance.now() - inicio) / 1000;

// Tick do servidor pela /saude (metadata das salas), sem depender do log da VM.
async function lerTick(): Promise<{ p95Ms: number; p99Ms: number } | null> {
  try {
    const r = await fetch(`${urlServidor.replace(/^ws/, 'http')}/saude`, { cache: 'no-store' });
    return ((await r.json()) as { tick?: { p95Ms: number; p99Ms: number } | null }).tick ?? null;
  } catch {
    return null;
  }
}
const tick = await lerTick();
const reconexaoMs = queda.ms;

/** Tendência da memória (MB por minuto), pela reta dos mínimos quadrados sobre a série. */
function tendenciaMbPorMin(v: readonly Amostra[]): number | null {
  if (v.length < 3) return null;
  const mx = v.reduce((s, a) => s + a.s, 0) / v.length;
  const my = v.reduce((s, a) => s + a.rssMb, 0) / v.length;
  const num = v.reduce((s, a) => s + (a.s - mx) * (a.rssMb - my), 0);
  const den = v.reduce((s, a) => s + (a.s - mx) ** 2, 0);
  return den > 0 ? Number(((num / den) * 60).toFixed(2)) : null;
}
const serie = amostras.length
  ? {
      amostras: amostras.length,
      rssInicialMb: amostras[0]?.rssMb ?? 0,
      rssFinalMb: amostras.at(-1)?.rssMb ?? 0,
      rssMaxMb: Math.max(...amostras.map((a) => a.rssMb)),
      tendenciaMbPorMin: tendenciaMbPorMin(amostras),
      tickP95MaxMs: Math.max(...amostras.map((a) => a.tickP95Ms)),
      tickP99MaxMs: Math.max(...amostras.map((a) => a.tickP99Ms)),
      agendadorP95MaxMs: Math.max(...amostras.map((a) => a.atrasoP95Ms)),
    }
  : null;

const rtts = participantes.map((p) => p.cliente.rttMs);
const erros = participantes.flatMap((p) => p.cliente.erros.slice(20));
const recebida = participantes.map((p) => p.recebidos / duracaoS / 1024);
const enviada = participantes.map((p) => p.enviados / duracaoS / 1024);
const avisoP5 = Object.fromEntries([...janelas].map(([id, v]) => [id, Math.round(percentil(v, 0.05))]));
const r1 = (n: number) => Number(n.toFixed(1));
const resultado = {
  data: new Date().toISOString(),
  url: urlServidor,
  perfil: perfilNome ?? 'real',
  fase: cena,
  clientes: participantes.length,
  segundos: Math.round(duracaoS),
  rttP50Ms: Math.round(percentil(rtts, 0.5)),
  rttP95Ms: Math.round(percentil(rtts, 0.95)),
  correcaoP95Celulas: Number(percentil(erros, 0.95).toFixed(3)),
  correcaoP99Celulas: Number(percentil(erros, 0.99).toFixed(3)),
  teleportes: erros.filter((e) => e > TELEPORTE_CELULAS).length,
  bandaMediaKiBs: r1(recebida.reduce((a, b) => a + b, 0) / recebida.length),
  bandaMaxKiBs: r1(Math.max(...recebida)),
  bandaEnviadaMaxKiBs: r1(Math.max(...enviada)),
  rejeitados: participantes.reduce((s, p) => s + p.cliente.rejeitados, 0),
  motivosRejeicao: participantes.reduce<Record<string, number>>((acc, p) => {
    for (const [m, n] of Object.entries(p.cliente.motivosRejeicao)) acc[m] = (acc[m] ?? 0) + n;
    return acc;
  }, {}),
  ressincronizacoes: participantes.reduce((s, p) => s + p.cliente.ressincronizacoes, 0),
  reconexaoMs,
  avisoUtilP5Ms: avisoP5,
  tickServidor: tick,
  metricas: serie,
};
console.log(JSON.stringify(resultado, null, 2));
console.log(`rejeições por cliente: ${participantes.map((p) => p.cliente.rejeitados).join(' ')} (cliente 2 é o derrubado)`);

// Metas da §5.6. No perfil degradado vale a integridade (sem rejeição, reconexão), não a qualidade.
const degradado = perfilNome === 'degradado';
const menorAviso = Math.min(...Object.values(avisoP5));
const metas: (readonly [string, boolean])[] = [
  ['zero rejeições', resultado.rejeitados === 0],
  ['reconexão ≤ 5 s', reconexaoMs !== null && reconexaoMs <= 5000],
  ['banda recebida ≤ 100 KiB/s', resultado.bandaMaxKiBs <= 100],
  ['banda enviada ≤ 10 KiB/s', resultado.bandaEnviadaMaxKiBs <= 10],
];
if (!degradado) {
  metas.push(
    ['correção p95 ≤ 0,25 célula', resultado.correcaoP95Celulas <= 0.25],
    ['correção p99 ≤ 1 célula', resultado.correcaoP99Celulas <= 1],
    ['aviso útil p5 ≥ 200 ms em toda habilidade', Number.isFinite(menorAviso) && menorAviso >= 200],
  );
}
if (tick) metas.push(['tick do servidor p95 ≤ 8 ms e p99 ≤ 16,7 ms', tick.p95Ms <= 8 && tick.p99Ms <= 16.7]);
// Marco 16: na série do `/metricas`, nenhuma janela de 10 s com o tick acima da meta, e a memória sem subir mais de
// 1 MB por minuto (uma sessão de 30 min não pode crescer 30 MB).
if (serie) {
  metas.push(['tick p95 ≤ 8 ms em toda a série', serie.tickP95MaxMs <= 8]);
  if (serie.tendenciaMbPorMin !== null && segundos >= 300) metas.push(['memória estável (≤ 1 MB/min)', serie.tendenciaMbPorMin <= 1]);
}
for (const [meta, ok] of metas) console.log(`${ok ? '✓' : '✗'} ${meta}`);

if (values.registrar) {
  // Decimais com vírgula, como o resto do documento.
  const br = (n: number) => String(n).replace('.', ',');
  const avisos = Object.entries(avisoP5)
    .map(([id, ms]) => `${id} ${ms}`)
    .join(', ');
  const okMetas = metas.filter(([, ok]) => ok).length;
  appendFileSync(
    new URL('../../docs/BENCHMARKS.md', import.meta.url),
    `| ${resultado.data.slice(0, 10)} | ${values.marco} | ${cena}, ${resultado.clientes} bots, ${resultado.segundos} s, ${urlServidor}, perfil ${resultado.perfil} | RTT p50/p95 · correção p95/p99 · teleportes · banda rec./env. máx · tick p95/p99 · reconexão | — · ≤ 0,25/≤ 1 · — · ≤ 100/≤ 10 KiB/s · ≤ 8/≤ 16,7 ms · ≤ 5 s | ${resultado.rttP50Ms}/${resultado.rttP95Ms} ms · ${br(resultado.correcaoP95Celulas)}/${br(resultado.correcaoP99Celulas)} · ${resultado.teleportes} · ${br(resultado.bandaMaxKiBs)}/${br(resultado.bandaEnviadaMaxKiBs)} KiB/s · ${tick ? `${br(tick.p95Ms)}/${br(tick.p99Ms)} ms` : '—'} · ${reconexaoMs === null ? '—' : `${br(r1(reconexaoMs / 1000))} s`} | metas ${okMetas}/${metas.length}; rejeições ${resultado.rejeitados}; ressinc. ${resultado.ressincronizacoes}; aviso útil p5 (ms): ${avisos || '—'}${serie ? `; memória ${br(serie.rssInicialMb)}→${br(serie.rssFinalMb)} MB (máx. ${br(serie.rssMaxMb)}, tendência ${serie.tendenciaMbPorMin === null ? '—' : br(serie.tendenciaMbPorMin)} MB/min), tick p95 máx. na série ${br(serie.tickP95MaxMs)} ms, agendador p95 máx. ${br(serie.agendadorP95MaxMs)} ms` : ''} |\n`,
  );
  console.log('Registrado em docs/BENCHMARKS.md');
}
for (const p of participantes) p.conexao.transporte.fechar();
setTimeout(() => {
  void proxy?.encerrar();
  process.exit(metas.every(([, ok]) => ok) ? 0 : 1);
}, 500);
