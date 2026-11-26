// Marco 54 (26/11/2026, D-207): a carga da sala do Mundo contínuo, no próprio processo (sem rede). Mede o que decide a
// lotação por canal: o tempo do tique do servidor (a simulação, a hibernação, a cópia do estado e o recorte por
// interesse de cada sessão) e os bytes que cada sessão receberia. Os bots entram espalhados pelas pedras de save das
// 24 regiões (ou todos na Vila do Centro, `--juntos`), andam ao acaso, atacam e usam habilidades.
//
//   npm run carga:continuo -- --clientes 40 --segundos 60
//   npm run carga:continuo -- --clientes 100 --segundos 60 --juntos
//   npm run carga:continuo -- --clientes 40 --segundos 60 --hoje   (a base: uma sala por região, como antes do D-207)

import { parseArgs } from 'node:util';
import { versaoDoConteudo, type MensagemServidor } from '../../src/arena/protocolo';
import type { Dir8 } from '../../src/core/comandos';
import { conteudoOficial, modoPorId } from '../../src/core/conteudo';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { DT_MS } from '../../src/core/loop';
import { aleatorio, criarRng, escolher } from '../../src/core/rng';
import { fichaNova } from '../../src/mundo/ficha-mundo';
import { lerLugar } from '../../src/mundo/lugares';
import { montarMundoContinuo } from '../../src/mundo/mundo-continuo';
import { reinoDoConteudo } from '../../src/mundo/reino';
import { SalaMundoContinuo } from '../../src/mundo/sala-continua';
import { MODO_MUNDO, SalaMundo } from '../../src/mundo/sala-mundo';

const { values } = parseArgs({ options: { clientes: { type: 'string', default: '40' }, segundos: { type: 'string', default: '60' }, juntos: { type: 'boolean', default: false }, hoje: { type: 'boolean', default: false } } });
const quantidade = Number(values.clientes);
const segundos = Number(values.segundos);
const DIRECOES: readonly Dir8[] = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
const CLASSES = ['guerreiro', 'mago', 'arqueiro', 'aventureiro', 'necromante'];

const conteudo = conteudoOficial();
const reino = reinoDoConteudo(conteudo);
let t0 = performance.now();
const opcoes = { semente: 7, agora: () => Date.now() };
const continua = values.hoje ? null : new SalaMundoContinuo(reino, conteudo, montarMundoContinuo(conteudo, reino, modoPorId(conteudo, MODO_MUNDO)), opcoes);
if (continua) console.log(`atlas montado em ${((performance.now() - t0) / 1000).toFixed(1)} s: ${String(continua.estado.entidades.length + continua.dormindo().entidades)} entidades`);
// Na base, uma sala por região com gente (gerada na hora, como o servidor faz ao primeiro jogador).
const porRegiao = new Map<string, SalaMundo>();
const salaDe = (regiao: string): SalaMundo => {
  if (continua) return continua;
  let s = porRegiao.get(regiao);
  if (!s) {
    const lugar = lerLugar(reino, `regiao:${regiao}`);
    if (!lugar) throw new Error(regiao);
    s = new SalaMundo(reino, lugar, conteudo, opcoes);
    porRegiao.set(regiao, s);
  }
  return s;
};

interface Bot {
  sala: SalaMundo;
  sessaoId: string;
  seq: number;
  bytes: number;
  receber: (t: string) => void;
}
const bots: Bot[] = [];
for (let i = 0; i < quantidade; i++) {
  const regiao = values.juntos ? reino.inicio : (reino.regioes[i % reino.regioes.length]?.id ?? reino.inicio);
  const identidade = `carga-${String(i)}`;
  const ficha = fichaNova({ conteudo, balance: BALANCE_PADRAO }, reino, CLASSES[i % CLASSES.length] ?? 'guerreiro', `Bot ${String(i + 1)}`, `pers-carga-${String(i)}`);
  if (!ficha) throw new Error('ficha');
  const sala = salaDe(regiao);
  sala.reservar(identidade, ficha, continua ? continua.chegadaNoAtlas(regiao, null) : null);
  const bot: Bot = { sala, sessaoId: '', seq: 0, bytes: 0, receber: () => undefined };
  const conexao = sala.conectar((t) => {
    bot.bytes += t.length;
    if (!bot.sessaoId) {
      const m = JSON.parse(t) as MensagemServidor;
      if (m.t === 'bemVindo') bot.sessaoId = m.sessaoId;
    }
  }, identidade);
  bot.receber = (t) => { conexao.receber(t); };
  bot.receber(JSON.stringify({ t: 'entrar', nome: `Bot ${String(i + 1)}`, pedidoFicha: null, versaoConteudo: versaoDoConteudo() }));
  bots.push(bot);
}
const salas = continua ? [continua] : [...porRegiao.values()];
console.log(`${String(bots.filter((b) => b.sessaoId).length)} de ${String(quantidade)} bots em ${String(salas.length)} sala(s) (${values.juntos ? 'todos na Vila do Centro' : 'espalhados pelas 24 regiões'})`);

const rng = criarRng(11);
const comando = (b: Bot, cmd: unknown) => {
  b.receber(JSON.stringify({ t: 'cmd', pacote: { sessaoId: b.sessaoId, seq: ++b.seq, epocaSala: b.sala.epoca, tickCliente: b.sala.estado.tick, cmd } }));
};
const ticks = Math.round((segundos * 1000) / DT_MS);
const tempos: number[] = [];
for (const b of bots) b.bytes = 0;
t0 = performance.now();
for (let k = 0; k < ticks; k++) {
  for (const b of bots) {
    const u = aleatorio(rng);
    if (u < 0.02) comando(b, { t: 'mover', dir: aleatorio(rng) < 0.1 ? 'parado' : escolher(rng, DIRECOES) });
    else if (u < 0.03) comando(b, { t: 'ataqueBasico' });
  }
  const a = performance.now();
  for (const sala of salas) sala.tick(DT_MS);
  tempos.push(performance.now() - a);
}
const total = (performance.now() - t0) / 1000;
tempos.sort((x, y) => x - y);
const q = (p: number) => tempos[Math.min(tempos.length - 1, Math.floor(tempos.length * p))] ?? 0;
const media = tempos.reduce((s, v) => s + v, 0) / tempos.length;
const kib = bots.reduce((s, b) => s + b.bytes, 0) / bots.length / 1024 / segundos;
const d = continua ? continua.dormindo() : { entidades: 0, objetos: 0 };
const acordadas = salas.reduce((s, x) => s + x.estado.entidades.length, 0);
const objetos = salas.reduce((s, x) => s + x.estado.objetos.length, 0);
console.log(`${String(ticks)} tiques em ${total.toFixed(1)} s · tique médio ${media.toFixed(2)} ms, p95 ${q(0.95).toFixed(2)} ms, p99 ${q(0.99).toFixed(2)} ms, máx ${q(1).toFixed(1)} ms (orçamento ${DT_MS.toFixed(1)} ms)`);
console.log(`acordados ${String(acordadas)} entidades e ${String(objetos)} objetos; dormindo ${String(d.entidades)} e ${String(d.objetos)} · ${kib.toFixed(1)} KiB/s por bot · heap ${(process.memoryUsage().heapUsed / 2 ** 20).toFixed(0)} MiB`);
