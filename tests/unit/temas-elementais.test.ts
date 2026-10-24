// Marco 23 (24/10/2026, D-092): dez slots, temas de fase, clima elemental e inimigos afins.
import { describe, expect, it } from 'vitest';
import campanha from '../../src/data/campanha.json';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { aplicarImpacto } from '../../src/combat/golpe';
import { multiplicadorClima, processarClima } from '../../src/combat/clima';
import { resistenciaPct } from '../../src/combat/elementos';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { clonarEstado, criarEstado } from '../../src/core/estado';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { ticksDe } from '../../src/core/tempo';
import { estadoPublico } from '../../src/arena/estado-publico';
import { BotDeDuelo } from '../../src/bench/bot-duelo';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { lerRegistro, MAX_SLOTS, SLOTS } from '../../src/save/esquema';
import { faseSeguinte } from '../../src/save/fases-campanha';
import { temaDaGerada } from '../../src/save/sequencia';
import { decoracoesDaFase, ehPilar } from '../../src/world/decoracao';
import { carregarFase, type FaseJson } from '../../src/world/fase';
import { catalogoDeGeracao, gerarFase, type ParametrosGeracao } from '../../src/world/gerador';
import { opcoesDoPosicionado } from '../../src/world/populacao';
import { lerTemas } from '../../src/world/temas';
import { validarFase } from '../../src/world/validacao-fase';
import { CONTEUDO, contexto, SALA_ABERTA } from '../apoio/fases';

const catalogo = catalogoDeGeracao(CONTEUDO, campanha.geradas.estoque);
const presets = new Set(CONTEUDO.presets.keys());
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}
const parametros = (s: number, extra: Partial<ParametrosGeracao> = {}): ParametrosGeracao => ({
  id: `tema-${s}`, nome: 'Salas', semente: s, salas: 12, nivelInimigos: 5, matizGraus: 28, largura: 60, altura: 40, ambientesVivos: true, ...extra,
});

/** Uma sala aberta com o tema pedido, um Mago e um goblin (com a afinidade pedida) ao lado. */
function cenario(tema: string | undefined, afinidade?: { elemento: 'gelo' | 'fogo' | 'raio'; extrema: boolean }) {
  const json: FaseJson = { id: 'sala', nome: 'Sala', ordem: 1, tipo: 'campanha', mapa: SALA_ABERTA, spawns: [{ x: 2, y: 2 }], ...(tema && { tema }) };
  const ctx = contexto(carregarFase(json));
  const estado = criarEstado({ semente: 4, faseId: json.id });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 2, 2, ctx.balance);
  const goblin = obter(CONTEUDO.presets.get('goblin'));
  const alvo = criarInimigo(goblin, 'i000', 3, 2, ctx.balance, opcoesDoPosicionado(ctx, goblin, { preset: 'goblin', x: 3, y: 2, nivel: 5, ...(afinidade && { afinidade }) }));
  estado.entidades.push(j, alvo);
  return { ctx, estado, j, alvo, eventos: [] as EventoSimulacao[] };
}

function golpear(c: ReturnType<typeof cenario>, habilidadeId: string, alvo: Entidade = c.alvo): EventoSimulacao | undefined {
  const hab = obter(CONTEUDO.habilidades.get(habilidadeId));
  const inicio = c.eventos.length;
  aplicarImpacto(c.estado, c.ctx, alvo, { acaoId: 1, hab, indice: 0, fonte: { ...fonteDaHabilidade(c.j, c.ctx, 0, hab), d20Minimo: 12 } }, c.eventos);
  return c.eventos.slice(inicio).find((e) => e.t === 'impacto');
}

describe('dez slots', () => {
  it('aceita do 1 ao 10 e recusa o 11', () => {
    expect(SLOTS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(MAX_SLOTS).toBe(10);
    expect(lerRegistro({ slot: 11 })).toMatchObject({ ok: false });
  });
});

describe('temas de fase', () => {
  it('os 20 temas do catálogo são válidos e os inimigos existem', () => {
    expect(CONTEUDO.temas.size).toBe(20);
    expect(lerTemas({ temas: [...CONTEUDO.temas.values()].map(() => ({})) }).erros.length).toBeGreaterThan(0);
    const g = campanha.geradas.temas;
    for (const id of [...g.neutros, ...g.elementais]) expect(CONTEUDO.temas.has(id)).toBe(true);
    expect([...g.neutros, ...g.elementais].length).toBe(20);
    for (const id of g.elementais) expect(CONTEUDO.temas.get(id)?.elemento).not.toBeNull();
  });

  it('a fase sem tema sai igual; com tema, só ganha pilares e troca os inimigos de lugar nenhum', () => {
    for (const semente of [3, 41, 97]) {
      const sem = gerarFase(parametros(semente), catalogo);
      expect(sem.tema).toBeUndefined();
      const com = gerarFase(parametros(semente, { tema: 'caverna_gelo' }), catalogo);
      expect(com.tema).toBe('caverna_gelo');
      // O terreno só muda de piso para pilar.
      sem.mapa.forEach((linha, y) => {
        for (let x = 0; x < linha.length; x++) if (linha[x] !== com.mapa[y]?.[x]) expect([linha[x], com.mapa[y]?.[x]]).toEqual(['.', '#']);
      });
      // Os inimigos ficam nos mesmos lugares; os presets saem do tema.
      expect((com.inimigos ?? []).map((i) => [i.x, i.y])).toEqual((sem.inimigos ?? []).map((i) => [i.x, i.y]));
      const doTema = Object.keys(obter(CONTEUDO.temas.get('caverna_gelo')).inimigos);
      for (const i of com.inimigos ?? []) if (i.preset !== catalogo.boss) expect(doTema).toContain(i.preset);
      // O chefe do tema elemental nasce afim, na variante extrema.
      expect((com.inimigos ?? []).find((i) => i.preset === catalogo.boss)?.afinidade).toEqual({ elemento: 'gelo', extrema: true });
      // Determinística, válida e com todas as salas alcançáveis.
      expect(gerarFase(parametros(semente, { tema: 'caverna_gelo' }), catalogo)).toEqual(com);
      const r = validarFase(com, presets, CONTEUDO.itens);
      expect(r.ok, JSON.stringify(r.ok ? [] : r.erros)).toBe(true);
    }
  });

  it('todo tema gera fase válida, com pilares soltos, enfeites e áreas do tema', () => {
    let pilares = 0;
    for (const tema of CONTEUDO.temas.values()) {
      const json = gerarFase(parametros(77, { tema: tema.id, salas: 14 }), catalogo);
      const r = validarFase(json, presets, CONTEUDO.itens);
      expect(r.ok, `${tema.id}: ${JSON.stringify(r.ok ? [] : r.erros)}`).toBe(true);
      const fase = carregarFase(json);
      for (let y = 0; y < fase.altura; y++) for (let x = 0; x < fase.largura; x++) if (ehPilar(fase, x, y)) pilares++;
      expect(decoracoesDaFase(fase, tema).length).toBeGreaterThan(0);
      for (const a of json.ambientes ?? []) expect(tema.ambientes.tipos).toContain(a.tipo);
    }
    expect(pilares).toBeGreaterThan(0);
  });

  it('a sequência põe um tema por fase: elemental a cada 3, sem repetir o anterior', () => {
    const g = campanha.geradas;
    let ref = faseSeguinte({ tipo: 'oficial', id: 'fase-02' });
    let anterior: string | undefined;
    for (let n = 1; n <= 9; n++) {
      if (ref?.tipo !== 'gerada') throw Error('esperava gerada');
      const tema = obter(ref.params.tema);
      expect(tema).not.toBe(anterior);
      expect(n % 3 === 0 ? g.temas.elementais : g.temas.neutros).toContain(tema);
      expect(temaDaGerada(g, ref.id, n, anterior)).toBe(tema);
      anterior = tema;
      ref = faseSeguinte(ref);
    }
  });
});

describe('clima elemental', () => {
  it('reforça o elemento do tema e enfraquece o oposto', () => {
    const { ctx } = cenario('caverna_gelo');
    expect(multiplicadorClima(ctx, 'gelo')).toBeCloseTo(1 + BALANCE_PADRAO.clima.reforcoPct / 100);
    expect(multiplicadorClima(ctx, 'fogo')).toBeCloseTo(1 - BALANCE_PADRAO.clima.opressaoPct / 100);
    expect(multiplicadorClima(ctx, 'raio')).toBe(1);
    expect(multiplicadorClima(cenario('masmorra').ctx, 'gelo')).toBe(1);
  });

  it('o pulso resfria o personagem sem resistência e poupa quem resiste', () => {
    const c = cenario('caverna_gelo');
    c.estado.tick = ticksDe(BALANCE_PADRAO.clima.pulsoMs);
    processarClima(c.estado, c.ctx, c.eventos);
    expect(c.j.efeitos.some((f) => f.tipo === 'resfriado')).toBe(true);
    expect(c.alvo.efeitos.some((f) => f.tipo === 'resfriado')).toBe(false);
    // Na fase neutra, nada.
    const n = cenario('masmorra');
    n.estado.tick = ticksDe(BALANCE_PADRAO.clima.pulsoMs);
    processarClima(n.estado, n.ctx, n.eventos);
    expect(n.j.efeitos).toEqual([]);
  });
});

describe('inimigos afins', () => {
  it('gelo cura o inimigo de gelo, e o estado de gelo não pega nele', () => {
    const c = cenario(undefined, { elemento: 'gelo', extrema: false });
    expect(c.alvo.nome).toBe('Goblin de Gelo');
    expect(c.alvo.habilidades).toContain('lanca_de_gelo');
    c.alvo.hp = Math.floor(c.alvo.hpMax / 2);
    const antes = c.alvo.hp;
    const ev = golpear(c, 'lanca_de_gelo');
    expect(ev).toMatchObject({ dano: 0, absorveu: true });
    expect(c.alvo.hp).toBeGreaterThan(antes);
    expect(c.alvo.efeitos.some((f) => f.tipo === 'resfriado')).toBe(false);
    aplicarEfeito(c.estado, c.ctx, c.alvo, construirEfeito('resfriado'), { id: 'j', x: 2, y: 2 }, null, c.eventos);
    expect(c.alvo.efeitos.some((f) => f.tipo === 'resfriado')).toBe(false);
  });

  it('o oposto fere mais e o golpe sem elemento segue normal', () => {
    const afim = cenario(undefined, { elemento: 'gelo', extrema: false });
    expect(resistenciaPct(afim.ctx, afim.alvo, 'fogo')).toBe(BALANCE_PADRAO.afinidade.fraquezaPct);
    expect(resistenciaPct(afim.ctx, afim.alvo, 'raio')).toBe(0);
    expect(resistenciaPct(afim.ctx, afim.alvo, null)).toBe(0);
    const ev = golpear(afim, 'bola_de_fogo');
    expect(ev?.t === 'impacto' && ev.absorveu).toBeFalsy();
    expect(ev?.t === 'impacto' && ev.dano).toBeGreaterThan(0);
  });

  it('a variante extrema só cai pelo oposto (ou sem elemento), com mais vida e XP', () => {
    const comum = cenario(undefined, { elemento: 'gelo', extrema: false });
    const c = cenario(undefined, { elemento: 'gelo', extrema: true });
    expect(c.alvo.nome).toBe('Goblin Primordial de Gelo');
    expect(c.alvo.hpMax).toBeGreaterThan(comum.alvo.hpMax);
    expect(c.alvo.xpBase).toBeGreaterThan(comum.alvo.xpBase);
    expect(resistenciaPct(c.ctx, c.alvo, 'raio')).toBe(100);
    expect(resistenciaPct(c.ctx, c.alvo, 'fogo')).toBe(BALANCE_PADRAO.afinidade.extremaFraquezaPct);
    expect(golpear(c, 'raio_em_cadeia')).toMatchObject({ dano: 0, imune: true });
  });

  it('a afinidade passa pelo clone e pelo estado público', () => {
    const c = cenario(undefined, { elemento: 'fogo', extrema: false });
    expect(clonarEstado(c.estado).entidades[1]?.afinidade).toEqual({ elemento: 'fogo', extrema: false });
    expect(estadoPublico(c.estado).entidades[1]?.afinidade).toEqual({ elemento: 'fogo', extrema: false });
    const copia = clonarEstado(c.estado).entidades[1];
    if (copia?.afinidade) copia.afinidade.extrema = true;
    expect(c.alvo.afinidade?.extrema).toBe(false);
  });

  it('o bot não lança o elemento que o alvo absorve', () => {
    const c = cenario(undefined, { elemento: 'fogo', extrema: false });
    c.j.habilidades = ['bola_de_fogo', 'lanca_de_gelo'];
    c.j.mana = c.j.manaMax;
    const bot = new BotDeDuelo(c.j.id);
    const usadas = bot.agir(c.estado, c.ctx).flatMap((cmd) => (cmd.t === 'usarHabilidade' ? [cmd.id] : []));
    expect(usadas).not.toContain('bola_de_fogo');
  });
});
