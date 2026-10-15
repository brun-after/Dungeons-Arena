// Cenas de benchmark do cliente (marco 16, 15/10/2026, D-062, §5.6). Puro: monta o estado e os bots; a tela
// (bench-tela.ts) roda a simulação local e mede os quadros.
// - `carga`: 120×120, 60 NPCs, 10 avatares (o jogador e 9 bots), 20 invocações (2 por avatar), 30 armadilhas e os
//   projéteis que a luta produz (a meta da §5.6 é 100; a tela registra o pico).
// - `padrao`: 60×40, 20 NPCs, 5 avatares e 10 invocações.
// A fase é gerada com semente fixa; o resto é posto em células livres sorteadas pela mesma semente.

import type { Comando } from '../core/comandos';
import type { Conteudo } from '../core/conteudo';
import type { ContextoSimulacao } from '../core/contexto';
import { DONO_FASE, novoId, type EstadoJogo } from '../core/estado';
import { aleatorio, criarRng, hashTexto, inteiro, type EstadoRng } from '../core/rng';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { resolverHabilidade } from '../combat/compilar-habilidade';
import { lancarProjetil } from '../combat/projeteis';
import campanha from '../data/campanha.json';
import type { Entidade } from '../entities/entidade';
import { criarInimigo, criarJogador } from '../entities/fabrica';
import { guardarItem } from '../progression/inventario';
import { contextoDaFase, estadoInicialDaFase } from '../save/fases-campanha';
import { passavel } from '../world/fase';
import { catalogoDeGeracao, gerarFase } from '../world/gerador';
import { BotDeDuelo } from './bot-duelo';

export type TipoBench = 'carga' | 'padrao';

export interface RequisitosBench {
  largura: number;
  altura: number;
  salas: number;
  npcs: number;
  avatares: number;
  /** Pergaminhos por avatar (cada um vira uma invocação; o limite do modo é 2 por jogador). */
  pergaminhos: number;
  armadilhas: number;
}

/** As cenas da §5.6. */
export const CENAS_BENCH: Readonly<Record<TipoBench, RequisitosBench>> = {
  carga: { largura: 120, altura: 120, salas: 20, npcs: 60, avatares: 10, pergaminhos: 2, armadilhas: 30 },
  padrao: { largura: 60, altura: 40, salas: 10, npcs: 20, avatares: 5, pergaminhos: 2, armadilhas: 0 },
};

/** As classes dos avatares, em rodízio: atiradores e conjuradores para haver projéteis no ar. */
const CLASSES = ['arqueiro', 'mago', 'guerreiro', 'aventureiro'] as const;
const SEMENTE = 2026;

export interface CenaBench {
  ctx: ContextoSimulacao;
  estado: EstadoJogo;
  bots: BotDeDuelo[];
  /** Comandos do primeiro tick (os pergaminhos de invocação). */
  iniciais: { entidadeId: string; cmd: Comando }[];
  idLocal: string;
}

export function montarCenaBench(tipo: TipoBench, conteudo: Conteudo): CenaBench {
  const r = CENAS_BENCH[tipo];
  const json = gerarFase(
    { id: `bench-${tipo}`, nome: `Benchmark (${tipo})`, semente: SEMENTE, salas: r.salas, nivelInimigos: 3, matizGraus: 0, largura: r.largura, altura: r.altura },
    catalogoDeGeracao(conteudo, campanha.geradas.estoque),
  );
  const lido = contextoDaFase(conteudo, json);
  if (!lido.ok) throw new Error(`fase de benchmark inválida: ${lido.erro}`);
  // Sem spawner: as contagens ficam as da cena.
  const ctx: ContextoSimulacao = { ...lido.ctx, modo: { ...lido.ctx.modo, spawnerDinamico: false } };
  const estado = estadoInicialDaFase(ctx);
  const rng = criarRng(hashTexto(`bench-${tipo}`));
  const ocupadas = new Set(estado.entidades.map((e) => `${e.x},${e.y}`));
  const livre = (): { x: number; y: number } => {
    for (let tentativa = 0; tentativa < 10_000; tentativa++) {
      const x = inteiro(rng, 1, ctx.fase.largura - 2);
      const y = inteiro(rng, 1, ctx.fase.altura - 2);
      if (passavel(ctx.fase, x, y) && !ocupadas.has(`${x},${y}`)) {
        ocupadas.add(`${x},${y}`);
        return { x, y };
      }
    }
    throw new Error('sem célula livre para o benchmark');
  };

  // NPCs: os da fase gerada, completados (ou cortados) até a conta da cena.
  const comuns = catalogoDeGeracao(conteudo, []).comuns;
  const npcs = estado.entidades.filter((e) => e.controlador === 'ia');
  for (const extra of npcs.slice(r.npcs)) estado.entidades = estado.entidades.filter((e) => e !== extra);
  for (let i = npcs.length; i < r.npcs; i++) {
    const preset = conteudo.presets.get(comuns[i % comuns.length] ?? 'goblin');
    if (!preset) continue;
    const c = livre();
    estado.entidades.push(criarInimigo(preset, `bench-npc-${i}`, c.x, c.y, ctx.balance, { nivel: 3 }));
  }

  // Avatares perto do início (o primeiro é o jogador), cada um com pergaminhos de invocação.
  const spawn = ctx.fase.spawns[0] ?? { x: 1, y: 1 };
  const bots: BotDeDuelo[] = [];
  const iniciais: CenaBench['iniciais'] = [];
  const pergaminho = conteudo.itens.get('pergaminho_lobo');
  for (let i = 0; i < r.avatares; i++) {
    const classe = conteudo.classes.get(CLASSES[i % CLASSES.length] ?? 'aventureiro');
    if (!classe) continue;
    const c = i === 0 ? spawn : livre();
    const e: Entidade = criarJogador(classe, `j${i + 1}`, c.x, c.y, ctx.balance);
    if (pergaminho && e.bolsa) guardarItem(e.bolsa, pergaminho, r.pergaminhos, ctx.balance.inventario);
    estado.entidades.push(e);
    // O jogador local também é um bot: o benchmark não depende de alguém apertando teclas.
    bots.push(new BotDeDuelo(e.id));
    for (const entrada of e.bolsa?.mochila.filter((m) => m.itemId === 'pergaminho_lobo') ?? []) {
      for (let k = 0; k < entrada.qtd; k++) iniciais.push({ entidadeId: e.id, cmd: { t: 'usarItem', invId: entrada.invId } });
    }
  }

  // Armadilhas de fase, permanentes, espalhadas.
  for (let i = 0; i < r.armadilhas; i++) {
    const c = livre();
    estado.armadilhas.push({
      id: estado.proximoId++,
      donoId: DONO_FASE,
      equipeDono: DONO_FASE,
      x: c.x,
      y: c.y,
      valor: 2,
      interno: null,
      ateTick: 0,
      origem: 'fase',
      permanente: true,
      rearmeTicks: 120,
      inerteAteTick: 0,
    });
  }
  return { ctx, estado, bots, iniciais, idLocal: 'j1' };
}

/** Projéteis no ar que a cena mantém (§5.6). A luta sozinha produz poucos; o benchmark completa com tiros de avatares. */
export const PROJETEIS_BENCH: Readonly<Record<TipoBench, number>> = { carga: 100, padrao: 10 };

/**
 * Completa os projéteis no ar até `alvo`: tiros de avatares vivos em direções sorteadas (8 células). Fica fora do
 * `simular()` de propósito — é a bancada de teste enchendo a cena, como os testes montam estados.
 */
export function completarProjeteis(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: number, rng: EstadoRng, saida: EventoSimulacao[]): void {
  const hab = resolverHabilidade(ctx, 'tiro');
  const avatares = estado.entidades.filter((e) => e.bolsa !== null && !e.morto);
  if (!hab || avatares.length === 0) return;
  for (let i = estado.projeteis.length; i < alvo; i++) {
    const ator = avatares[inteiro(rng, 0, avatares.length - 1)];
    if (!ator) return;
    const angulo = aleatorio(rng) * Math.PI * 2;
    const mira = { x: Math.round(ator.x + Math.cos(angulo) * 8), y: Math.round(ator.y + Math.sin(angulo) * 8) };
    const fonte = { id: ator.id, equipe: ator.equipe, bonusAtributo: 0, carisma: 10, multDano: 1, multCura: 1 };
    lancarProjetil(estado, ator, hab, novoId(estado), fonte, mira, saida);
  }
}

/** As contagens da cena agora (o que a §5.6 pede), para o relatório. */
export function contagens(estado: EstadoJogo): { npcs: number; invocacoes: number; avatares: number; armadilhas: number; projeteis: number } {
  const vivos = estado.entidades.filter((e) => !e.morto);
  return {
    npcs: vivos.filter((e) => e.controlador === 'ia' && !e.invocacao).length,
    invocacoes: vivos.filter((e) => e.invocacao !== null).length,
    avatares: vivos.filter((e) => e.bolsa !== null).length,
    armadilhas: estado.armadilhas.length,
    projeteis: estado.projeteis.length,
  };
}
