// Teste de carga da arena (§5.6, tools/carga): N clientes bot reais pelo WebSocket, numa mesma sala.
// Relata RTT, erro de correção, banda recebida por cliente e rejeições.
//
//   npm run carga -- --url ws://localhost:2567 --clientes 10 --segundos 120
//   npm run carga -- --url wss://seu-nome.duckdns.org --clientes 10 --segundos 300 --registrar
//
// `--registrar` acrescenta uma linha em docs/BENCHMARKS.md.

import { appendFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { contextoDaArena } from '../../src/arena/contexto-arena';
import { DT_MS } from '../../src/core/loop';
import { BotDeArena } from '../../src/net/bot';
import { ClienteArena } from '../../src/net/cliente';
import { conectarArena, type ConexaoArena } from '../../src/plataforma/transporte-colyseus';

const { values } = parseArgs({
  options: {
    url: { type: 'string', default: 'ws://localhost:2567' },
    clientes: { type: 'string', default: '10' },
    segundos: { type: 'string', default: '60' },
    registrar: { type: 'boolean', default: false },
  },
});
const url = values.url;
const quantidade = Math.max(1, Math.min(10, Number(values.clientes)));
const segundos = Math.max(5, Number(values.segundos));

function percentil(v: readonly number[], p: number): number {
  if (v.length === 0) return 0;
  const o = [...v].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor(o.length * p))] ?? 0;
}

interface Participante {
  cliente: ClienteArena;
  conexao: ConexaoArena;
  bot: BotDeArena;
  bytes: number;
}

async function conectar(pedido: { criar: true } | { codigo: string }, i: number): Promise<Participante> {
  const ctx = contextoDaArena();
  const conexao = await conectarArena(url, pedido);
  const p: Participante = { cliente: null as unknown as ClienteArena, conexao, bot: null as unknown as BotDeArena, bytes: 0 };
  // Conta os bytes recebidos antes de entregar ao cliente.
  const original = conexao.transporte.aoReceber.bind(conexao.transporte);
  const transporte = {
    ...conexao.transporte,
    aoReceber: (fn: (texto: string) => void) => {
      original((texto) => {
        p.bytes += texto.length;
        fn(texto);
      });
    },
  };
  p.cliente = new ClienteArena({ ctx, transporte, nome: `Bot ${i + 1}`, pedidoFicha: { classeId: 'aventureiro' }, agoraMs: () => performance.now() });
  p.bot = new BotDeArena(p.cliente, 100 + i);
  p.cliente.entrar();
  return p;
}

console.log(`Carga: ${quantidade} clientes em ${url} por ${segundos} s`);
const primeiro = await conectar({ criar: true }, 0);
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
const relatorio = setInterval(() => {
  const rtt = participantes.map((p) => p.cliente.rttMs);
  console.log(`  ${Math.round((performance.now() - inicio) / 1000)} s · RTT médio ${Math.round(rtt.reduce((a, b) => a + b, 0) / rtt.length)} ms`);
}, 10_000);

await new Promise((r) => setTimeout(r, segundos * 1000));
clearInterval(laco);
clearInterval(relatorio);
const duracaoS = (performance.now() - inicio) / 1000;

const rtts = participantes.map((p) => p.cliente.rttMs);
const erros = participantes.flatMap((p) => p.cliente.erros.slice(20));
const banda = participantes.map((p) => p.bytes / duracaoS / 1024);
const resultado = {
  data: new Date().toISOString(),
  url,
  clientes: participantes.length,
  segundos: Math.round(duracaoS),
  rttP50Ms: Math.round(percentil(rtts, 0.5)),
  rttP95Ms: Math.round(percentil(rtts, 0.95)),
  correcaoP95Celulas: Number(percentil(erros, 0.95).toFixed(3)),
  correcaoP99Celulas: Number(percentil(erros, 0.99).toFixed(3)),
  bandaMediaKiBs: Number((banda.reduce((a, b) => a + b, 0) / banda.length).toFixed(1)),
  bandaMaxKiBs: Number(Math.max(...banda).toFixed(1)),
  rejeitados: participantes.reduce((s, p) => s + p.cliente.rejeitados, 0),
  ressincronizacoes: participantes.reduce((s, p) => s + p.cliente.ressincronizacoes, 0),
};
console.log(JSON.stringify(resultado, null, 2));

const metas = [
  ['correção p95 ≤ 0,25 célula', resultado.correcaoP95Celulas <= 0.25],
  ['banda recebida ≤ 100 KiB/s', resultado.bandaMaxKiBs <= 100],
  ['zero rejeições', resultado.rejeitados === 0],
] as const;
for (const [meta, ok] of metas) console.log(`${ok ? '✓' : '✗'} ${meta}`);

if (values.registrar) {
  appendFileSync(
    new URL('../../docs/BENCHMARKS.md', import.meta.url),
    `| ${resultado.data.slice(0, 10)} | 5 | Arena Livre, ${resultado.clientes} bots, ${resultado.segundos} s, ${url} | RTT p50/p95 · correção p95/p99 · banda média/máx | — / — · ≤ 0,25 · ≤ 100 KiB/s | ${resultado.rttP50Ms}/${resultado.rttP95Ms} ms · ${resultado.correcaoP95Celulas}/${resultado.correcaoP99Celulas} · ${resultado.bandaMediaKiBs}/${resultado.bandaMaxKiBs} KiB/s | rejeições ${resultado.rejeitados}, ressinc. ${resultado.ressincronizacoes} |\n`,
  );
  console.log('Registrado em docs/BENCHMARKS.md');
}
for (const p of participantes) p.conexao.transporte.fechar();
setTimeout(() => process.exit(metas.every(([, ok]) => ok) ? 0 : 1), 500);
