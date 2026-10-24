// Harness de simulação (§5.1): roda o tick real com dt fixo e PRNG semeado, sem DOM e sem rede,
// validando invariantes a cada tick. Cresce a cada marco.

import type { ComandoDoTick, Dir8 } from '../../src/core/comandos';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { criarEstado, type EstadoJogo } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { aleatorio, criarRng, escolher, inteiro, type EstadoRng } from '../../src/core/rng';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { emPasso, type Entidade } from '../../src/entities/entidade';
import { SLOTS_DE_EQUIPAMENTO } from '../../src/modos/modo';
import { guardarItem } from '../../src/progression/inventario';
import { NOMES_ATRIBUTOS } from '../../src/progression/itens';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { bloqueia, reservaCelula } from '../../src/world/colisao';
import { passavel } from '../../src/world/fase';
import { contarDoSpawner } from '../../src/world/spawner';
import { CONTEUDO, contexto, faseOficial01 } from '../apoio/fases';

export interface Cenario {
  estado: EstadoJogo;
  ctx: ContextoSimulacao;
}

export interface OpcoesCenario {
  semente: number;
  inimigos?: number;
  jogadores?: number;
  ctx?: ContextoSimulacao;
}

// Marco 8A-2: aranha (armadilha), slime (rastro) e boss (invocação e efeito atrasado) entram no cenário.
const PRESETS_DO_CENARIO = ['goblin', 'esqueleto', 'orc', 'cultista', 'lobo', 'aranha', 'slime', 'boss'] as const;

function classeAventureiro() {
  const classe = CONTEUDO.classes.get('aventureiro');
  if (!classe) throw new Error('classe aventureiro ausente');
  return classe;
}

/** Cenário na fase oficial 1: jogadores perto do spawn e inimigos em células livres sorteadas pela semente. */
export function criarCenario(opcoes: OpcoesCenario): Cenario {
  const ctx = opcoes.ctx ?? contexto(faseOficial01());
  const { fase, balance } = ctx;
  const estado = criarEstado({ semente: opcoes.semente, faseId: fase.id });
  const spawn = fase.spawns[0] ?? { x: 1, y: 1 };
  const ocupadas = new Set<string>();
  const celulaLivre = () => {
    let x: number;
    let y: number;
    do {
      x = inteiro(estado.rng, 0, fase.largura - 1);
      y = inteiro(estado.rng, 0, fase.altura - 1);
    } while (!passavel(fase, x, y) || ocupadas.has(`${x},${y}`));
    ocupadas.add(`${x},${y}`);
    return { x, y };
  };

  for (let i = 0; i < (opcoes.jogadores ?? 1); i++) {
    const c = i === 0 ? spawn : celulaLivre();
    ocupadas.add(`${c.x},${c.y}`);
    const jogador = criarJogador(classeAventureiro(), `j${i + 1}`, c.x, c.y, balance);
    // Marco 10A-3: pergaminhos de invocação, para o bot exercitar invocações e avatares.
    for (const id of ['pergaminho_lobo', 'pergaminho_fada', 'pergaminho_espantalho']) {
      const item = CONTEUDO.itens.get(id);
      if (item && jogador.bolsa) guardarItem(jogador.bolsa, item, 3, balance.inventario);
    }
    estado.entidades.push(jogador);
  }
  const n = opcoes.inimigos ?? 12;
  for (let i = 0; i < n; i++) {
    const c = celulaLivre();
    const preset = CONTEUDO.presets.get(escolher(estado.rng, PRESETS_DO_CENARIO));
    if (!preset) throw new Error('preset ausente');
    const e = criarInimigo(preset, `i${String(i).padStart(3, '0')}`, c.x, c.y, balance);
    e.atributos.destreza = inteiro(estado.rng, 6, 20);
    estado.entidades.push(e);
  }
  return { estado, ctx };
}

/** Produz os comandos de um tick. Recebe o estado só para leitura. */
export type Produtor = (estado: Readonly<EstadoJogo>) => ComandoDoTick[];

const DIRECOES: readonly (Dir8 | 'parado')[] = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO', 'parado'];

/**
 * Bot determinístico: cada entidade age com 5% de chance por tick — anda, pede `irPara`, ataca,
 * usa habilidade ou seleciona alvo. PRNG próprio, separado do de gameplay.
 */
/** Marco 6: mochila e pontos, válidos ou não (slot errado, item que não existe mais). */
function comandoDeItem(rng: EstadoRng, e: Entidade): ComandoDoTick['cmd'] {
  const entrada = e.bolsa && e.bolsa.mochila.length > 0 ? escolher(rng, e.bolsa.mochila) : null;
  const sorteio = aleatorio(rng);
  if (entrada && sorteio < 0.25) return { t: 'equipar', invId: entrada.invId, slot: escolher(rng, SLOTS_DE_EQUIPAMENTO) };
  if (entrada && sorteio < 0.35) return { t: 'usarItem', invId: entrada.invId };
  if (sorteio < 0.45) return { t: 'desequipar', slot: escolher(rng, SLOTS_DE_EQUIPAMENTO) };
  if (sorteio < 0.5) return { t: 'distribuirPonto', atributo: escolher(rng, NOMES_ATRIBUTOS) };
  // Marco 9A: economia, válida ou não (loja fechada, sem ouro, item fora do estoque).
  if (sorteio < 0.65) return { t: 'interagir' };
  if (sorteio < 0.75) return { t: 'comprar', itemId: escolher(rng, ITENS) };
  if (entrada && sorteio < 0.85) return { t: 'vender', invId: entrada.invId };
  if (entrada && sorteio < 0.95) return { t: 'moverItem', invId: entrada.invId, posicao: inteiro(rng, 0, 25) };
  return { t: 'fecharLoja' };
}

const ITENS = [...CONTEUDO.itens.keys()];

export function criarBotAleatorio(semente: number): Produtor {
  const rng: EstadoRng = criarRng(semente);
  return (estado) => {
    const comandos: ComandoDoTick[] = [];
    for (const e of estado.entidades) {
      if (aleatorio(rng) >= 0.05) continue;
      const sorteio = aleatorio(rng);
      let cmd: ComandoDoTick['cmd'];
      if (sorteio < 0.5) cmd = { t: 'mover', dir: escolher(rng, DIRECOES) };
      else if (sorteio < 0.7) cmd = { t: 'irPara', x: e.x + inteiro(rng, -8, 8), y: e.y + inteiro(rng, -8, 8) };
      else if (sorteio < 0.85) cmd = { t: 'ataqueBasico' };
      else if (sorteio < 0.95) cmd = { t: 'usarHabilidade', id: escolher(rng, [e.ataqueBasico, ...e.habilidades]) };
      else if (sorteio < 0.97) cmd = { t: 'selecionarAlvo', alvo: escolher(rng, estado.entidades).id };
      else cmd = comandoDeItem(rng, e);
      comandos.push({ tick: estado.tick, entidadeId: e.id, cmd });
    }
    return comandos;
  };
}

export function verificarInvariantes(estado: EstadoJogo, ctx: ContextoSimulacao): string[] {
  const erros: string[] = [];
  const { fase, balance } = ctx;
  procurarNaoFinitos(estado, 'estado', erros);
  const ids = new Set<string>();
  for (const e of estado.entidades) {
    if (ids.has(e.id)) erros.push(`id repetido ${e.id}`);
    ids.add(e.id);
    if (!passavel(fase, e.x, e.y)) erros.push(`${e.id} em célula não passável (${e.x}, ${e.y})`);
    if (!passavel(fase, e.destinoX, e.destinoY)) erros.push(`${e.id} com destino não passável`);
    const distancia = Math.abs(e.destinoX - e.x) + Math.abs(e.destinoY - e.y);
    if (distancia > 1) erros.push(`${e.id} com destino não adjacente`);
    if (e.progressoPasso < 0 || e.progressoPasso >= 1) erros.push(`${e.id} com progresso ${e.progressoPasso}`);
    if (!emPasso(e) && e.progressoPasso !== 0) erros.push(`${e.id} parado com progresso`);
    if (e.waypoints.length > balance.movimento.filaMaxWaypoints) erros.push(`${e.id} com fila longa`);
    if (e.hp < 0 || e.hp > e.hpMax) erros.push(`${e.id} com hp ${e.hp} fora de [0, ${e.hpMax}]`);
    if (e.mana < 0 || e.mana > e.manaMax) erros.push(`${e.id} com mana ${e.mana} fora de [0, ${e.manaMax}]`);
    if (e.morto && e.acao) erros.push(`${e.id} morto conjurando`);
    if (e.acao && e.acao.lancamentoTick < estado.tick) erros.push(`${e.id} com ação vencida pendurada`);
    // Marco 9A: ouro inteiro e nunca negativo; nenhum item duplicado; morto não fica congelado.
    if (e.bolsa) {
      if (!Number.isInteger(e.bolsa.ouro) || e.bolsa.ouro < 0) erros.push(`${e.id} com ouro ${e.bolsa.ouro}`);
      const inv = [...e.bolsa.mochila, ...Object.values(e.bolsa.equipamento).filter((i) => i !== null)].map((i) => i.invId);
      if (new Set(inv).size !== inv.length) erros.push(`${e.id} com item duplicado`);
      if (e.bolsa.mochila.length > balance.inventario.capacidade) erros.push(`${e.id} com mochila acima da capacidade`);
      if (e.bolsa.mochila.some((i) => i.qtd < 1 || i.qtd > balance.inventario.pilhaMax)) erros.push(`${e.id} com pilha inválida`);
    }
    if (e.morto && e.interacao) erros.push(`${e.id} morto e congelado`);
  }
  const objetos = new Set<string>();
  for (const o of estado.objetos) {
    if (objetos.has(o.objetoId)) erros.push(`objeto repetido ${o.objetoId}`);
    objetos.add(o.objetoId);
    // Um abridor por vez, e só quem está de fato abrindo (§3.6).
    if (o.abridorId !== null && estado.entidades.find((e) => e.id === o.abridorId)?.interacao?.objetoId !== o.objetoId) {
      erros.push(`baú ${o.objetoId} reservado por quem não está abrindo`);
    }
  }
  // Marco 8A-2: invocações (não dominadas) e armadilhas dentro dos limites do modo, por dono.
  const porDono = new Map<string, number>();
  for (const e of estado.entidades) {
    // Marco 22: o falcão do Aventureiro tem vaga própria.
    if (e.invocacao && !e.invocacao.dominado && !e.invocacao.avatar && !e.invocacao.companheiro && e.hp > 0) porDono.set(e.invocacao.donoId, (porDono.get(e.invocacao.donoId) ?? 0) + 1);
  }
  for (const [dono, n] of porDono) if (n > ctx.modo.limites.invocacoesPorJogador) erros.push(`${dono} com ${n} invocações`);
  // Marco 10A-3: avatares contam à parte; golpes do avatar nunca negativos.
  for (const dono of new Set(estado.entidades.map((e) => e.invocacao?.donoId).filter((d): d is string => d !== undefined))) {
    const n = estado.entidades.filter((e) => e.invocacao?.donoId === dono && e.invocacao.avatar && e.hp > 0).length;
    if (n > ctx.modo.limites.avataresPorJogador) erros.push(`${dono} com ${n} avatares`);
  }
  for (const e of estado.entidades) if (e.invocacao && e.invocacao.golpesRestantes < 0) erros.push(`${e.id} com golpes negativos`);
  const armadilhas = new Map<string, number>();
  for (const a of estado.armadilhas) if (a.origem === 'habilidade') armadilhas.set(a.donoId, (armadilhas.get(a.donoId) ?? 0) + 1);
  // Marco 9A-2: o spawner nunca passa do máximo de cada categoria; só armadilha com rearme fica inerte.
  for (const c of ['bau', 'loot', 'orbe', 'armadilha'] as const) {
    const n = contarDoSpawner(estado, c);
    if (n > balance.spawner[c].max) erros.push(`spawner com ${n} de ${c}`);
  }
  for (const a of estado.armadilhas) if (a.inerteAteTick > estado.tick && a.rearmeTicks === 0) erros.push(`armadilha ${a.id} inerte sem rearme`);
  for (const [dono, n] of armadilhas) if (n > ctx.modo.limites.armadilhasPorJogador) erros.push(`${dono} com ${n} armadilhas`);
  for (const p of estado.projeteis) {
    if (!passavel(fase, Math.round(p.x), Math.round(p.y))) erros.push(`projétil ${p.id} fora do terreno`);
  }
  // Pares bloqueantes nunca dividem célula reservada (§2.3).
  const vivos = estado.entidades.filter((e) => !e.morto);
  for (let i = 0; i < vivos.length; i++) {
    for (let j = i + 1; j < vivos.length; j++) {
      const a = vivos[i];
      const b = vivos[j];
      if (!a || !b || !bloqueia(a, b, balance.colisao)) continue;
      if (reservaCelula(b, a.x, a.y) || reservaCelula(b, a.destinoX, a.destinoY)) {
        erros.push(`${a.id} e ${b.id} dividem célula reservada`);
      }
    }
  }
  return erros;
}

function procurarNaoFinitos(valor: unknown, caminho: string, erros: string[]): void {
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) erros.push(`${caminho} não é finito (${valor})`);
  } else if (Array.isArray(valor)) {
    valor.forEach((v, i) => {
      procurarNaoFinitos(v, `${caminho}[${i}]`, erros);
    });
  } else if (typeof valor === 'object' && valor !== null) {
    for (const [k, v] of Object.entries(valor)) procurarNaoFinitos(v, `${caminho}.${k}`, erros);
  }
}

/** Roda `ticks` ticks reais, falhando no primeiro tick que violar uma invariante. */
export function rodar(cenario: Cenario, ticks: number, produtor: Produtor): EventoSimulacao[] {
  const { estado, ctx } = cenario;
  const eventos: EventoSimulacao[] = [];
  for (let i = 0; i < ticks; i++) {
    const recargasAntes = { ...estado.recargas };
    simular(estado, ctx, produtor(estado), eventos, DT_MS);
    const erros = verificarInvariantes(estado, ctx);
    // Recargas são monotônicas (§2.7): nenhuma expiração anda para trás.
    for (const [chave, antes] of Object.entries(recargasAntes)) {
      if ((estado.recargas[chave] ?? 0) < antes) erros.push(`recarga ${chave} regrediu`);
    }
    if (erros.length > 0) {
      throw new Error(`invariante violada no tick ${estado.tick}: ${erros.join('; ')}`);
    }
  }
  return eventos;
}
