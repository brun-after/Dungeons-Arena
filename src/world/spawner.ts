// Spawner dinâmico (§2.1). Marco 9A-2 (14/10/2026), D-051. Etapa 9 do tick, só onde o modo liga
// (`spawnerDinamico`). Roda depois da carência e a cada intervalo, sem estado próprio: o tick basta.
// Para cada categoria, em ordem fixa, se o que ele mesmo criou ainda não chegou ao máximo, sorteia a
// chance e procura uma célula: passável, sem entidade, objeto ou armadilha, e longe de todo jogador.
// Tudo pelo PRNG do estado (determinístico). Baú e loot só onde o modo pede (`loot.economiaDoSpawner`).

import { passivosDe } from '../progression/ganchos-do-portador';
import { fatoresDoMundo } from '../modos/dificuldade';
import { sortearEfeitoDeOrbe } from '../combat/registro-efeitos';
import type { Celula } from '../core/comandos';
import type { CategoriaSpawner, ContextoSimulacao } from '../core/contexto';
import { DONO_FASE, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio, inteiro } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { sortearItem } from '../progression/sorteio';
import { passavel } from './fase';
import { largarItem, largarObjeto, largarOrbeEfeito, novoObjeto } from './objetos';

/** Prefixo dos objetos do spawner: é assim que ele conta os seus. */
export const PREFIXO_SPAWNER = 's:';

type Categoria = 'bau' | 'loot' | 'orbe' | 'armadilha' | 'refugio';
const CATEGORIAS: readonly Categoria[] = ['bau', 'loot', 'orbe', 'armadilha', 'refugio'];

/** O spawner roda neste tick? Primeira rodada no fim da carência, depois a cada intervalo. */
export function rodadaDoSpawner(tick: number, ctx: ContextoSimulacao): boolean {
  const s = ctx.balance.spawner;
  const carencia = ticksDe(s.carenciaS * 1000);
  return tick >= carencia && (tick - carencia) % ticksDe(s.intervaloS * 1000) === 0;
}

/** Quantos objetos da categoria o spawner mantém no mundo agora. */
export function contarDoSpawner(estado: EstadoJogo, categoria: Categoria): number {
  if (categoria === 'armadilha') return estado.armadilhas.filter((a) => a.origem === 'spawner').length;
  const tipos: Record<Exclude<Categoria, 'armadilha'>, readonly string[]> = {
    bau: ['bau'],
    loot: ['item'],
    orbe: ['orbe_hp', 'orbe_recurso', 'orbe_efeito'],
    refugio: ['orbe_refugio'],
  };
  return estado.objetos.filter((o) => o.objetoId.startsWith(PREFIXO_SPAWNER) && tipos[categoria].includes(o.tipo)).length;
}

/** Célula livre e longe dos jogadores, em até `tentativas` sorteios; null se nenhuma servir. */
export function sortearCelula(estado: EstadoJogo, ctx: ContextoSimulacao): Celula | null {
  const { fase } = ctx;
  const s = ctx.balance.spawner;
  const jogadores = estado.entidades.filter((e) => e.controlador !== 'ia' && !e.morto);
  for (let i = 0; i < s.tentativas; i++) {
    const x = inteiro(estado.rng, 0, fase.largura - 1);
    const y = inteiro(estado.rng, 0, fase.altura - 1);
    if (!passavel(fase, x, y)) continue;
    if (estado.entidades.some((e) => (e.x === x && e.y === y) || (e.destinoX === x && e.destinoY === y))) continue;
    if (estado.objetos.some((o) => o.x === x && o.y === y) || estado.armadilhas.some((a) => a.x === x && a.y === y)) continue;
    if (jogadores.some((j) => Math.max(Math.abs(j.x - x), Math.abs(j.y - y)) < s.distanciaMinJogador)) continue;
    return { x, y };
  }
  return null;
}

function criar(estado: EstadoJogo, ctx: ContextoSimulacao, categoria: Categoria, c: Celula, saida: EventoSimulacao[]): void {
  const s = ctx.balance.spawner;
  const objetoId = `${PREFIXO_SPAWNER}${estado.proximoId++}`;
  switch (categoria) {
    case 'bau': {
      const itens: string[] = [];
      const n = inteiro(estado.rng, s.itensBau[0], s.itensBau[1]);
      for (let i = 0; i < n; i++) {
        const item = sortearItem(estado, ctx, false);
        if (item) itens.push(item.id);
      }
      const ouro = inteiro(estado.rng, s.ouroBau[0], s.ouroBau[1]);
      estado.objetos.push(novoObjeto(objetoId, 'bau', c.x, c.y, { itens, ouro }));
      saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo: 'bau', x: c.x, y: c.y });
      return;
    }
    case 'loot': {
      const item = sortearItem(estado, ctx, false);
      if (item) largarItem(estado, item.id, c.x, c.y, saida, 1, objetoId);
      return;
    }
    case 'orbe': {
      const p = s.pesoOrbe;
      const sorteio = aleatorio(estado.rng) * (p.hp + p.recurso + p.efeito);
      const d = ctx.balance.drops;
      if (sorteio < p.hp) largarObjeto(estado, 'orbe_hp', c.x, c.y, d.orbeHpPct, 'pct', saida, objetoId);
      else if (sorteio < p.hp + p.recurso) largarObjeto(estado, 'orbe_recurso', c.x, c.y, d.orbeRecursoPct, 'pct', saida, objetoId);
      else {
        const efeito = sortearEfeitoDeOrbe(estado.rng, undefined, ctx.modo.sobrevivencia.revelarArmadilhas);
        if (efeito) largarOrbeEfeito(estado, efeito, c.x, c.y, saida, objetoId);
      }
      return;
    }
    case 'refugio': {
      estado.objetos.push(novoObjeto(objetoId, 'orbe_refugio', c.x, c.y));
      saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo: 'orbe_refugio', x: c.x, y: c.y });
      return;
    }
    case 'armadilha': {
      const id = estado.proximoId++;
      estado.armadilhas.push({
        id,
        donoId: DONO_FASE,
        equipeDono: DONO_FASE,
        x: c.x,
        y: c.y,
        valor: ctx.modo.sobrevivencia.revelarArmadilhas ? Math.max(s.danoArmadilha, ctx.balance.ambiente.danoArmadilhaBase) : s.danoArmadilha,
        interno: null,
        ateTick: estado.tick + ticksDe(s.armadilhaExpiraS * 1000),
        origem: 'spawner',
        permanente: false,
        rearmeTicks: 0,
        inerteAteTick: 0,
        reveladaPara: [],
      });
      saida.push({ t: 'armadilhaArmada', tick: estado.tick, donoId: DONO_FASE, armadilhaId: id, x: c.x, y: c.y });
      return;
    }
  }
}

function maiorRefugioMaisPct(estado: EstadoJogo, ctx: ContextoSimulacao): number {
  return estado.entidades.reduce((m, e) => (e.bolsa ? Math.max(m, passivosDe(ctx, e).refugioMaisPct) : m), 0);
}

/** Etapa 9 do tick. */
export function processarSpawner(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  if (!ctx.modo.spawnerDinamico || !rodadaDoSpawner(estado.tick, ctx)) return;
  for (const categoria of CATEGORIAS) {
    // Baú e loot são economia do mundo: só onde o modo pede (marco 17: a arena tem itens só dos abates).
    if ((categoria === 'bau' || categoria === 'loot') && !ctx.modo.loot.economiaDoSpawner) continue;
    const regra: CategoriaSpawner = ctx.balance.spawner[categoria];
    // Marco 15: o grupo maior mantém mais coisas no mundo.
    if (contarDoSpawner(estado, categoria) >= Math.round(regra.max * fatoresDoMundo(estado, ctx).spawner)) continue;
    // D-067: um refúgio por vez, contando o do mapa (de qualquer origem) e o que alguém carrega.
    if (categoria === 'refugio' && (estado.objetos.some((o) => o.tipo === 'orbe_refugio') || estado.entidades.some((e) => e.refugio))) continue;
    // Marco 18 (D-069): o Manto Último faz o refúgio aparecer mais (vale o maior bônus entre quem joga).
    const chance = categoria === 'refugio' ? regra.chance * (1 + maiorRefugioMaisPct(estado, ctx) / 100) : regra.chance;
    if (aleatorio(estado.rng) >= chance) continue;
    const celula = sortearCelula(estado, ctx);
    if (celula) criar(estado, ctx, categoria, celula, saida);
  }
}
