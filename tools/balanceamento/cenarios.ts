// Cenários do simulador de balanceamento (marco 15, 15/10/2026, D-061). Roda o `simular()` de verdade, sem rede e
// determinístico pela semente: uma sala aberta, a ficha típica de cada classe no nível pedido, inimigos com o
// crescimento por nível e um bot de duelo que joga como uma pessoa razoável (mira o mais próximo, usa a barra quando
// pronta, deixa o ataque básico automático e anda até o alcance).

import type { Comando, ComandoDoTick } from '../../src/core/comandos';
import { conteudoOficial, modoPorId, type Conteudo } from '../../src/core/conteudo';
import { BALANCE_PADRAO, type Balance, type ContextoSimulacao } from '../../src/core/contexto';
import { criarEstado, type EstadoJogo } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { Atributos, Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import type { Dificuldade } from '../../src/modos/dificuldade';
import type { ModoDeJogo } from '../../src/modos/modo';
import { recalcularFicha } from '../../src/progression/derivados';
import { caminhosDoRank, nivelParaRank } from '../../src/progression/habilidades-personagem';
import { carregarFase } from '../../src/world/fase';
import { BotDeDuelo } from '../../src/bench/bot-duelo';

export { BotDeDuelo };

export const CONTEUDO: Conteudo = conteudoOficial();
export const TICKS_POR_S = 1000 / DT_MS;

/** Sala aberta (largura × altura), cercada de paredes. */
function salaAberta(largura: number, altura: number) {
  const mapa = [
    '#'.repeat(largura),
    ...Array.from({ length: altura - 2 }, () => `#${'.'.repeat(largura - 2)}#`),
    '#'.repeat(largura),
  ];
  return carregarFase({ id: 'balanceamento', nome: 'Balanceamento', ordem: 1, tipo: 'campanha', mapa, spawns: [{ x: 2, y: 2 }] });
}

/** O modo do cenário sem spawner nem objetos de fase: só quem foi posto na sala luta. */
function modoDoCenario(id: string): ModoDeJogo {
  return { ...modoPorId(CONTEUDO, id), spawnerDinamico: false, objetosDeFase: false };
}

export function contextoDoCenario(modoId = 'campanha', balance: Balance = BALANCE_PADRAO): ContextoSimulacao {
  return { fase: salaAberta(24, 18), balance, conteudo: CONTEUDO, modo: modoDoCenario(modoId) };
}

/**
 * Onde o jogador típico põe os pontos de cada classe (marco 18, D-068: a rolagem escala com Força e Inteligência; a
 * Destreza do arqueiro é cadência, não dano). Os pontos do "principal" se dividem por igual entre os da lista.
 */
export const ATRIBUTOS_TIPICOS: Readonly<Record<string, readonly (keyof Atributos)[]>> = {
  aventureiro: ['forca', 'inteligencia'],
  guerreiro: ['forca'],
  mago: ['inteligencia'],
  arqueiro: ['forca', 'destreza'],
};

/**
 * A ficha típica do nível: os pontos de atributo vão 2 no principal e 1 na constituição por nível; os de habilidade
 * sobem, em ordem, as habilidades da barra (o primeiro caminho nas evoluções); o equipamento inicial vai no corpo.
 */
export function jogadorTipico(ctx: ContextoSimulacao, classeId: string, nivel: number, id = 'j1', x = 4, y = 9): Entidade {
  const classe = CONTEUDO.classes.get(classeId);
  if (!classe) throw new Error(`classe ${classeId}`);
  const e = criarJogador(classe, id, x, y, ctx.balance);
  const bolsa = e.bolsa;
  if (!bolsa) throw new Error('sem bolsa');
  e.nivel = nivel;
  const pontos = (nivel - 1) * ctx.balance.xp.pontosPorNivel;
  const principais = ATRIBUTOS_TIPICOS[classe.id] ?? ['forca'];
  const noPrincipal = Math.round((pontos * 2) / 3);
  principais.forEach((a, i) => {
    bolsa.atributosBase[a] += Math.floor(noPrincipal / principais.length) + (i < noPrincipal % principais.length ? 1 : 0);
  });
  bolsa.atributosBase.constituicao += pontos - noPrincipal;
  let pontosHab = (nivel - 1) * ctx.balance.habilidades.pontosPorNivel;
  for (let volta = 0; pontosHab > 0 && volta < 10; volta++) {
    for (const c of bolsa.conhecidas) {
      if (pontosHab <= 0) break;
      const novo = c.rank + 1;
      if (novo > ctx.balance.habilidades.rankMax || nivel < nivelParaRank(ctx, c.id, novo)) continue;
      const caminhos = caminhosDoRank(ctx, c.id, novo);
      c.rank = novo;
      if (caminhos[0]) c.caminhos.push(caminhos[0]);
      pontosHab--;
    }
  }
  for (const entrada of [...bolsa.mochila]) {
    const item = CONTEUDO.itens.get(entrada.itemId);
    if (item?.tipo !== 'equipamento' || !item.slotPadrao || bolsa.equipamento[item.slotPadrao]) continue;
    bolsa.equipamento[item.slotPadrao] = entrada;
    bolsa.mochila = bolsa.mochila.filter((i) => i !== entrada);
  }
  recalcularFicha(e, ctx);
  e.hp = e.hpMax;
  e.mana = e.manaMax;
  return e;
}

export function inimigo(ctx: ContextoSimulacao, presetId: string, nivel: number, id = 'i1', x = 6, y = 9): Entidade {
  const preset = CONTEUDO.presets.get(presetId);
  if (!preset) throw new Error(`preset ${presetId}`);
  return criarInimigo(preset, id, x, y, ctx.balance, { nivel });
}

export interface Mundo {
  estado: EstadoJogo;
  ctx: ContextoSimulacao;
  eventos: EventoSimulacao[];
  rodar: (ticks: number, parar?: () => boolean) => void;
  /** Um comando avulso para o próximo tick (além dos bots). */
  comandar: (entidadeId: string, cmd: Comando) => void;
  bots: BotDeDuelo[];
}

export function mundo(ctx: ContextoSimulacao, semente: number, entidades: Entidade[], dificuldade: Dificuldade = 'normal'): Mundo {
  const estado = criarEstado({ semente, faseId: ctx.fase.id });
  estado.dificuldade = dificuldade;
  estado.entidades.push(...entidades);
  const eventos: EventoSimulacao[] = [];
  const bots: BotDeDuelo[] = [];
  let avulsos: ComandoDoTick[] = [];
  const rodar = (ticks: number, parar?: () => boolean) => {
    for (let i = 0; i < ticks; i++) {
      if (parar?.()) return;
      const comandos: ComandoDoTick[] = avulsos.map((c) => ({ ...c, tick: estado.tick }));
      avulsos = [];
      for (const b of bots) for (const cmd of b.agir(estado, ctx)) comandos.push({ tick: estado.tick, entidadeId: b.id, cmd });
      simular(estado, ctx, comandos, eventos, DT_MS);
    }
  };
  const comandar = (entidadeId: string, cmd: Comando) => {
    avulsos.push({ tick: estado.tick, entidadeId, cmd });
  };
  return { estado, ctx, eventos, rodar, comandar, bots };
}
