// Cenários do simulador de balanceamento (marco 15, 15/10/2026, D-061). Roda o `simular()` de verdade, sem rede e
// determinístico pela semente: uma sala aberta, a ficha típica de cada classe no nível pedido, inimigos com o
// crescimento por nível e um bot de duelo que joga como uma pessoa razoável (mira o mais próximo, usa a barra quando
// pronta, deixa o ataque básico automático e anda até o alcance).

import { alcanceDe, recargaRestante } from '../../src/combat/acao';
import { celulasDaForma } from '../../src/combat/formas';
import { celulaOcupada, chebyshev } from '../../src/combat/geometria';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import type { Comando, ComandoDoTick, Dir8 } from '../../src/core/comandos';
import { conteudoOficial, modoPorId, type Conteudo } from '../../src/core/conteudo';
import { BALANCE_PADRAO, type Balance, type ContextoSimulacao } from '../../src/core/contexto';
import { buscarEntidade, criarEstado, type EstadoJogo } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { vivo, type Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import type { Dificuldade } from '../../src/modos/dificuldade';
import type { ModoDeJogo } from '../../src/modos/modo';
import { podeFerir } from '../../src/modos/relacao';
import { recalcularFicha } from '../../src/progression/derivados';
import { caminhosDoRank, nivelParaRank } from '../../src/progression/habilidades-personagem';
import { carregarFase } from '../../src/world/fase';

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

/** Atributo principal de cada classe de combate (o que o bot põe primeiro ao subir). */
const PRINCIPAL = { corpo_a_corpo: 'forca', conjurador: 'inteligencia', atirador: 'destreza' } as const;

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
  const principal = PRINCIPAL[classe.classe];
  const noPrincipal = Math.round((pontos * 2) / 3);
  bolsa.atributosBase[principal] += noPrincipal;
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

/** Quanto tempo o bot espera antes de reavaliar o caminho (para não mandar `irPara` a cada tick). */
const REAVALIAR_CAMINHO_TICKS = 15;
/** Distância em que o atirador se afasta de um inimigo de corpo a corpo. */
const DISTANCIA_DE_KITE = 2;
/** Abaixo desta fração da vida, o bot toma uma poção (quando tem). */
const VIDA_PARA_POCAO = 0.35;

const DIRECOES: Record<string, Dir8> = { '0,-1': 'N', '1,-1': 'NE', '1,0': 'E', '1,1': 'SE', '0,1': 'S', '-1,1': 'SO', '-1,0': 'O', '-1,-1': 'NO' };

/**
 * A célula do bot está na área de uma conjuração hostil em curso? Devolve para onde sair (a direção que afasta do
 * centro da mira), como uma pessoa faz ao ver a telegrafia.
 */
function fugaDaArea(estado: EstadoJogo, ctx: ContextoSimulacao, eu: Entidade): Dir8 | null {
  const minha = celulaOcupada(eu);
  for (const outro of estado.entidades) {
    const acao = outro.acao;
    if (!acao || !vivo(outro) || !podeFerir(eu, outro, ctx.modo)) continue;
    const h = habilidadeDoAtor(ctx, outro, acao.habilidadeId);
    if (h?.politicaImpacto !== 'area') continue;
    const mira = { x: acao.alvoX, y: acao.alvoY };
    if (!celulasDaForma(h, celulaOcupada(outro), mira, ctx.fase).some((c) => c.x === minha.x && c.y === minha.y)) continue;
    const dx = Math.sign(minha.x - mira.x) || 1;
    const dy = Math.sign(minha.y - mira.y);
    return DIRECOES[`${dx},${dy}`] ?? 'E';
  }
  return null;
}

export class BotDeDuelo {
  private ultimoCaminho = -Infinity;

  constructor(
    readonly id: string,
    /** Usa as habilidades da barra (o ataque básico é sempre automático). */
    private readonly usaHabilidades = true,
    /** Parado e sem atacar: para medir quanto o personagem aguenta. */
    private readonly passivo = false,
    /** Sai das áreas telegrafadas e toma poção com a vida baixa (o que o aviso existe para permitir). */
    private readonly defendeSe = true,
  ) {}

  agir(estado: EstadoJogo, ctx: ContextoSimulacao): Comando[] {
    const eu = buscarEntidade(estado, this.id);
    if (!eu || !vivo(eu)) return [];
    if (this.passivo) {
      eu.autoAtaque = false;
      return [];
    }
    const alvo = estado.entidades
      .filter((e) => vivo(e) && podeFerir(eu, e, ctx.modo))
      .sort((a, b) => chebyshev(celulaOcupada(eu), celulaOcupada(a)) - chebyshev(celulaOcupada(eu), celulaOcupada(b)) || (a.id < b.id ? -1 : 1))[0];
    if (!alvo) return [];
    const cmds: Comando[] = [];
    if (this.defendeSe) {
      const pocao = eu.hp < eu.hpMax * VIDA_PARA_POCAO ? eu.bolsa?.mochila.find((i) => i.itemId === 'pocao_vida') : undefined;
      if (pocao) cmds.push({ t: 'usarItem', invId: pocao.invId });
      const fuga = fugaDaArea(estado, ctx, eu);
      if (fuga) {
        cmds.push({ t: 'mover', dir: fuga });
        this.ultimoCaminho = estado.tick;
        return cmds;
      }
    }
    if (eu.alvoSelecionado !== alvo.id) cmds.push({ t: 'selecionarAlvo', alvo: alvo.id });
    const distancia = chebyshev(celulaOcupada(eu), celulaOcupada(alvo));
    const basico = habilidadeDoAtor(ctx, eu, eu.ataqueBasico);
    const alcanceBasico = basico ? alcanceDe(ctx, eu, basico, estado.tick) : 1;
    // Quem ataca de longe se afasta de quem só bate de perto (como faz uma pessoa com arco ou cajado).
    const basicoDoAlvo = habilidadeDoAtor(ctx, alvo, alvo.ataqueBasico);
    const alcanceDoAlvo = basicoDoAlvo ? alcanceDe(ctx, alvo, basicoDoAlvo, estado.tick) : 1;
    if (this.defendeSe && alcanceBasico >= DISTANCIA_DE_KITE + 2 && alcanceDoAlvo <= DISTANCIA_DE_KITE && distancia <= DISTANCIA_DE_KITE) {
      const dx = Math.sign(eu.x - alvo.x) || 1;
      const dy = Math.sign(eu.y - alvo.y);
      cmds.push({ t: 'mover', dir: DIRECOES[`${dx},${dy}`] ?? 'E' });
      this.ultimoCaminho = estado.tick;
      return cmds;
    }
    // Habilidades: a primeira pronta da barra que alcança (só quando não está no meio de outra que não seja o básico).
    if (this.usaHabilidades && (!eu.acao || eu.acao.habilidadeId === eu.ataqueBasico)) {
      for (const id of eu.habilidades) {
        const h = habilidadeDoAtor(ctx, eu, id);
        if (!h || h.passiva || recargaRestante(estado, eu.id, h.id) > 0 || eu.mana < h.custoRecurso) continue;
        const ofensiva = h.politicaAlvo === 'hostil' || h.politicaAlvo === 'celula' || h.tipoArea === 'ao_redor';
        const alcance = alcanceDe(ctx, eu, h, estado.tick);
        if (ofensiva && distancia > Math.max(1, h.tipoArea === 'ao_redor' ? h.raioArea : alcance)) continue;
        // Suporte (cura, escudo) só com a vida pela metade.
        if (!ofensiva && eu.hp > eu.hpMax / 2) continue;
        cmds.push(h.politicaAlvo === 'celula' ? { t: 'usarHabilidade', id: h.id, alvo: celulaOcupada(alvo) } : { t: 'usarHabilidade', id: h.id, alvo: ofensiva ? alvo.id : eu.id });
        break;
      }
    }
    if (distancia > alcanceBasico) {
      if (estado.tick - this.ultimoCaminho >= REAVALIAR_CAMINHO_TICKS) {
        this.ultimoCaminho = estado.tick;
        const c = celulaOcupada(alvo);
        cmds.push({ t: 'irPara', x: c.x, y: c.y });
      }
    } else if (eu.direcao !== 'parado' || eu.caminho.length > 0) {
      cmds.push({ t: 'mover', dir: 'parado' });
    }
    return cmds;
  }
}
