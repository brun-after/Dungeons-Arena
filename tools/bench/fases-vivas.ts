// Benchmark de simulação das levas (17/10/2026); não mede a GPU nem promete FPS em aparelhos reais.
import { performance } from 'node:perf_hooks';
import { conteudoOficial } from '../../src/core/conteudo';
import { criarEstado } from '../../src/core/estado';
import { simular } from '../../src/core/simulacao';
import { DT_MS } from '../../src/core/loop';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { criarJogador } from '../../src/entities/fabrica';
import { carregarFase } from '../../src/world/fase';
import { gerarFase, catalogoDeGeracao } from '../../src/world/gerador';
import { povoarFase } from '../../src/world/populacao';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { passavel } from '../../src/world/fase';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { processarEnxame } from '../../src/world/enxame';
import campanha from '../../src/data/campanha.json';
const conteudo = conteudoOficial();
const json = gerarFase({ id: 'carga', nome: 'Carga', semente: 41, salas: 20, nivelInimigos: 5, matizGraus: 28, largura: 84, altura: 56, ambientesVivos: true, eventos: ['enxame'] }, catalogoDeGeracao(conteudo, campanha.geradas.estoque));
const fase = carregarFase(json), ctx = { fase, conteudo, balance: BALANCE_PADRAO, modo: conteudo.modoCampanha };
const estado = criarEstado({ faseId: fase.id, semente: 41 }); povoarFase(estado, ctx);
const classe = conteudo.classes.get('guerreiro'); if (!classe) throw Error('classe');
const spawn = fase.spawns[0]; if (!spawn) throw Error('spawn');
const j = criarJogador(classe, 'j', spawn.x, spawn.y, BALANCE_PADRAO); estado.entidades.unshift(j);
const eventos: EventoSimulacao[] = [];
aplicarEfeito(estado, ctx, j, construirEfeito('imune_dano', { duracaoMs: 600000 }), { id: j.id, x: j.x, y: j.y }, null, eventos);
// Exercita todos os pontos de reserva, sem alocar além do teto de inimigos vivos.
for (const i of [...estado.reservaEnxame ?? []]) {
  const alvo = fase.inimigos[i]; if (!alvo) continue;
  for (let y = 1; y < fase.altura - 1; y++) {
    const x = alvo.x + 6;
    if (passavel(fase, x, y) && !estado.entidades.some((e) => e.x === x && e.y === y)) { j.x = x; j.y = y; break; }
  }
  processarEnxame(estado, ctx);
}
// Junta o combate numa região aberta e faz todos perseguirem o mesmo jogador.
const encontro = fase.inimigos.find((i) => i.preset !== 'boss');
if (encontro) {
  const c = [[encontro.x + 1, encontro.y], [encontro.x - 1, encontro.y], [encontro.x, encontro.y + 1]].find(([x, y]) => x !== undefined && y !== undefined && passavel(fase, x, y) && !estado.entidades.some((e) => e.x === x && e.y === y));
  if (c && c[0] !== undefined && c[1] !== undefined) { j.x = c[0]; j.y = c[1]; }
}
for (const e of estado.entidades) if (e.controlador === 'ia') e.participacao = [{ id: j.id, tick: 1 }];
let maxAtivos = 0; const tempos: number[] = [];
for (let i = 0; i < 6000; i++) {
  eventos.length = 0;
  const inicio = performance.now(); simular(estado, ctx, [], eventos, DT_MS);
  tempos.push(performance.now() - inicio);
  maxAtivos = Math.max(maxAtivos, estado.entidades.filter((e) => e.controlador === 'ia' && !e.morto && e.hp > 0).length);
}
const amostra = tempos.slice(300).sort((a,b) => a-b);
console.log(JSON.stringify({ ticks: tempos.length, mapa: `${fase.largura}x${fase.altura}`, inimigosTotais: fase.inimigos.length, maxAtivos,
  mediaMs: amostra.reduce((a,b)=>a+b,0)/amostra.length, p95Ms: amostra[Math.floor(amostra.length*.95)], p99Ms: amostra[Math.floor(amostra.length*.99)] }, null, 2));
