// Marco 14 (14/10/2026), D-059: o sistema de habilidades jogando — interações entre efeitos, elementos e
// sinergias, efeitos novos, formas e saltos na simulação, progressão (ranks, caminhos, barra, livros),
// save v9, fases geradas e as descrições geradas.

import { describe, expect, it } from 'vitest';
import { idGerada } from '../../src/combat/chave-habilidade';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { construirEfeito, TIPOS_EFEITO, type EfeitoCanonico, type TipoEfeito } from '../../src/combat/registro-efeitos';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { digest } from '../../src/core/digest';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { hashTexto } from '../../src/core/rng';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import campanha from '../../src/data/campanha.json';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { recalcularFicha } from '../../src/progression/derivados';
import { aplicarSubidas, perderXp, xpParaProximo } from '../../src/progression/nivel';
import { guardarItem } from '../../src/progression/inventario';
import { lerRegistro, MIGRACOES } from '../../src/save/esquema';
import { descreverEfeito, descreverHabilidade } from '../../src/ui/descrever';
import { catalogoDeGeracao, gerarFase } from '../../src/world/gerador';
import { t, type ChaveTexto } from '../../src/i18n';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { comKit, CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

/** Jogador da classe em (3,5) e dois bonecos em (5,5) e (6,5). */
function cenario(classeId = 'aventureiro', presetAlvo = 'boneco') {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 9, faseId: 'teste' });
  estado.entidades.push(criarJogador(obter(CONTEUDO.classes.get(classeId), classeId), 'j', 3, 5, ctx.balance));
  estado.entidades.push(criarInimigo(obter(CONTEUDO.presets.get(presetAlvo), presetAlvo), 'a', 5, 5, ctx.balance));
  estado.entidades.push(criarInimigo(obter(CONTEUDO.presets.get('boneco'), 'boneco'), 'b', 6, 5, ctx.balance));
  const eventos: EventoSimulacao[] = [];
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
  const tick = (cmds: [string, Comando][] = []) => {
    simular(estado, ctx, cmds.map(([entidadeId, cmd]) => ({ tick: estado.tick, entidadeId, cmd })), eventos, DT_MS);
  };
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const aplicar = (id: string, tipo: TipoEfeito, parcial: Partial<Omit<EfeitoCanonico, 'tipo'>> = {}) => {
    const j = ent('j');
    aplicarEfeito(estado, ctx, ent(id), construirEfeito(tipo, parcial), { id: 'j', x: j.x, y: j.y }, null, eventos);
  };
  const tem = (id: string, tipo: TipoEfeito) => ent(id).efeitos.some((f) => f.tipo === tipo && f.ateTick > estado.tick);
  return { ctx, estado, eventos, ent, tick, ticks, aplicar, tem };
}

describe('interações entre efeitos (interacoes.json)', () => {
  it('resfriado acumula e, no terceiro, vira congelado', () => {
    const c = cenario();
    c.aplicar('a', 'resfriado');
    c.aplicar('a', 'resfriado');
    expect(c.ent('a').efeitos.find((f) => f.tipo === 'resfriado')?.acumulos).toBe(2);
    c.aplicar('a', 'resfriado');
    expect(c.tem('a', 'resfriado')).toBe(false);
    expect(c.tem('a', 'congelado')).toBe(true);
    // Congelado ignora a reaplicação (não estende).
    const ate = c.ent('a').efeitos.find((f) => f.tipo === 'congelado')?.ateTick;
    c.ticks(10);
    c.aplicar('a', 'congelado');
    expect(c.ent('a').efeitos.find((f) => f.tipo === 'congelado')?.ateTick).toBe(ate);
  });

  it('oposições: o fogo tira o frio e o frio tira o fogo', () => {
    const c = cenario();
    c.aplicar('a', 'resfriado');
    c.aplicar('a', 'queimando');
    expect([c.tem('a', 'resfriado'), c.tem('a', 'queimando')]).toEqual([false, true]);
    c.aplicar('a', 'resfriado');
    expect([c.tem('a', 'resfriado'), c.tem('a', 'queimando')]).toEqual([true, false]);
  });

  it('renova recomeça com o valor novo; mais forte fica com o maior (D-048)', () => {
    const c = cenario();
    c.aplicar('a', 'queimando', { valor: 5, duracaoMs: 3000 });
    c.aplicar('a', 'queimando', { valor: 2, duracaoMs: 1000 });
    expect(c.ent('a').efeitos.find((f) => f.tipo === 'queimando')?.valor).toBe(2);
    c.aplicar('a', 'bonus_dano', { pct: 40, duracaoMs: 5000 });
    c.aplicar('a', 'bonus_dano', { pct: 10, duracaoMs: 1000 });
    expect(c.ent('a').efeitos.find((f) => f.tipo === 'bonus_dano')?.pct).toBe(40);
  });

  it('teto de 8 efeitos: sai o que acaba primeiro', () => {
    const c = cenario();
    const tipos: TipoEfeito[] = ['silenciar', 'sem_ataque', 'modificar_dano', 'bonus_dano', 'ab_dano', 'ab_recarga', 'ab_alcance', 'ab_multi_alvo', 'fantasma'];
    tipos.forEach((tipo, i) => {
      c.aplicar('a', tipo, { duracaoMs: 2000 + i * 1000 });
    });
    const ativos = c.ent('a').efeitos.filter((f) => f.ateTick > c.estado.tick);
    expect(ativos).toHaveLength(8);
    expect(ativos.some((f) => f.tipo === 'silenciar')).toBe(false);
  });

  it('imunidade do preset: o esqueleto não é envenenado e resiste ao veneno', () => {
    const c = cenario('aventureiro', 'esqueleto');
    c.aplicar('a', 'envenenado');
    expect(c.tem('a', 'envenenado')).toBe(false);
  });
});

describe('efeitos novos', () => {
  it('escudo absorve antes da vida; dano direto passa por exposto', () => {
    const c = cenario();
    const a = c.ent('a');
    const hp = a.hp;
    c.aplicar('a', 'escudo', { valor: 10 });
    c.aplicar('a', 'dano_direto', { valor: 6 });
    expect(a.hp).toBe(hp);
    c.aplicar('a', 'dano_direto', { valor: 6 });
    expect(a.hp).toBe(hp - 2);
    expect(c.tem('a', 'escudo')).toBe(false);
    c.aplicar('a', 'exposto', { pct: 50 });
    c.aplicar('a', 'dano_direto', { valor: 4 });
    expect(a.hp).toBe(hp - 2 - 6);
  });

  it('veneno corta a cura recebida pela metade', () => {
    const c = cenario();
    const j = c.ent('j');
    j.hp = 10;
    c.aplicar('j', 'cura', { valor: 10 });
    expect(j.hp).toBe(20);
    c.aplicar('j', 'envenenado', { valor: 0, pct: 50 });
    c.aplicar('j', 'cura', { valor: 10 });
    expect(j.hp).toBe(25);
  });

  it('puxão traz para o lado de quem puxa; troca de lugar troca as células', () => {
    const c = cenario();
    const a = c.ent('a');
    c.aplicar('a', 'puxao', { valor: 5 });
    expect([a.x, a.y]).toEqual([4, 5]);
    c.aplicar('a', 'trocar_lugar');
    expect([c.ent('a').x, c.ent('j').x]).toEqual([3, 4]);
  });

  it('resfriado deixa mais lento', () => {
    const rapido = cenario();
    const lento = cenario();
    lento.aplicar('j', 'resfriado', { pct: 50, duracaoMs: 60_000 });
    for (const c of [rapido, lento]) {
      c.tick([['j', { t: 'mover', dir: 'S' }]]);
      c.ticks(60);
    }
    expect(lento.ent('j').y - 5).toBeLessThan(rapido.ent('j').y - 5);
  });
});

describe('elementos e sinergias no golpe', () => {
  it('fogo sobre resfriado: derrete (dano extra, o frio sai) e o golpe registra a sinergia', () => {
    const c = cenario('mago');
    c.aplicar('a', 'resfriado');
    c.ent('j').mana = 50;
    c.tick([['j', { t: 'usarHabilidade', id: 'bola_de_fogo', alvo: { x: 5, y: 5 } }]]);
    c.ticks(80);
    const impacto = c.eventos.find((e) => e.t === 'impacto' && e.alvoId === 'a' && !e.falha);
    if (impacto?.t !== 'impacto') throw new Error('sem impacto');
    expect(impacto.sinergias).toEqual(['derreter']);
    expect(c.tem('a', 'resfriado')).toBe(false);
    expect(c.tem('a', 'queimando')).toBe(true);
  });

  it('raio em cadeia salta para o vizinho, pela relação do modo (o jogador nunca é atingido)', () => {
    const c = cenario('mago');
    c.ent('j').mana = 50;
    c.tick([['j', { t: 'usarHabilidade', id: 'raio_em_cadeia', alvo: 'a' }]]);
    c.ticks(120);
    const atingidos = new Set(c.eventos.flatMap((e) => (e.t === 'impacto' && e.habilidadeId === 'raio_em_cadeia' ? [e.alvoId] : [])));
    expect(atingidos.has('a')).toBe(true);
    expect(atingidos.has('b')).toBe(true);
    expect(atingidos.has('j')).toBe(false);
  });

  it('suporte: o Brado fortalece quem conjura (e os aliados), não os inimigos', () => {
    const c = cenario('guerreiro');
    comKit(c.ent('j'), ['brado']);
    c.tick([['j', { t: 'usarHabilidade', id: 'brado' }]]);
    c.ticks(40);
    expect(c.tem('j', 'bonus_dano')).toBe(true);
    expect(c.tem('a', 'bonus_dano')).toBe(false);
  });

  it('custo em vida: o redemoinho cobra vida e nunca mata quem conjura', () => {
    const c = cenario('guerreiro');
    const j = c.ent('j');
    const hp = j.hp;
    c.tick([['j', { t: 'usarHabilidade', id: 'redemoinho' }]]);
    expect(j.hp).toBeLessThan(hp);
    j.hp = 2;
    c.ticks(ticksDaRecarga('redemoinho'));
    c.tick([['j', { t: 'usarHabilidade', id: 'redemoinho' }]]);
    expect(c.eventos.some((e) => e.t === 'acaoRecusada' && e.motivo === 'recurso')).toBe(true);
    expect(j.hp).toBe(2);
  });
});

function ticksDaRecarga(id: string): number {
  return Math.ceil((obter(CONTEUDO.habilidades.get(id), id).recargaMs + 1000) / DT_MS);
}

describe('progressão de habilidades', () => {
  it('cada nível dá 1 ponto; o nível libera o rank; o caminho é obrigatório e definitivo', () => {
    const c = cenario('mago');
    const j = c.ent('j');
    const bolsa = obter(j.bolsa, 'bolsa');
    c.tick([['j', { t: 'subirRank', id: 'bola_de_fogo' }]]);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'habilidadeRecusada', motivo: 'sem_pontos' });
    j.xp = xpParaProximo(1, c.ctx.balance.xp) + xpParaProximo(2, c.ctx.balance.xp) + xpParaProximo(3, c.ctx.balance.xp) + xpParaProximo(4, c.ctx.balance.xp) + xpParaProximo(5, c.ctx.balance.xp);
    aplicarSubidas(j, c.ctx, c.estado.tick, c.eventos);
    expect(j.nivel).toBe(6);
    expect(bolsa.pontosHabilidade).toBe(5);
    c.tick([['j', { t: 'subirRank', id: 'bola_de_fogo' }]]);
    expect(bolsa.conhecidas.find((x) => x.id === 'bola_de_fogo')?.rank).toBe(2);
    // Rank 3 pede um caminho entre os oferecidos.
    c.tick([['j', { t: 'subirRank', id: 'bola_de_fogo' }]]);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'habilidadeRecusada', motivo: 'caminho_invalido' });
    c.tick([['j', { t: 'subirRank', id: 'bola_de_fogo', caminho: 'brutal' }]]);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'habilidadeRecusada', motivo: 'caminho_invalido' });
    c.tick([['j', { t: 'subirRank', id: 'bola_de_fogo', caminho: 'amplo' }]]);
    expect(bolsa.conhecidas.find((x) => x.id === 'bola_de_fogo')).toMatchObject({ rank: 3, caminhos: ['amplo'] });
    // A barra usa a habilidade compilada no rank e caminho do personagem.
    c.ent('j').mana = 50;
    c.tick([['j', { t: 'usarHabilidade', id: 'bola_de_fogo', alvo: { x: 5, y: 5 } }]]);
    expect(c.ent('j').acao?.chave).toBe('bola_de_fogo@3/amplo');
    // Rank 4 pede nível 10.
    c.ticks(200);
    c.tick([['j', { t: 'subirRank', id: 'bola_de_fogo' }]]);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'habilidadeRecusada', motivo: 'nivel_baixo' });
  });

  it('marco 24: classe sem ponto, geral por livro e ponto; teclas 1–2 de classe e 3–6 gerais', () => {
    const c = cenario('mago');
    const j = c.ent('j');
    const bolsa = obter(j.bolsa, 'bolsa');
    bolsa.pontosHabilidade = 6;
    expect(bolsa.barra.slice(0, 2)).toEqual(['lanca_de_gelo', 'raio_em_cadeia']);
    // Skill de outra classe não se aprende; a da própria vem do livro; a geral pede o livro antes do ponto.
    c.tick([['j', { t: 'subirRank', id: 'redemoinho' }]]);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'habilidadeRecusada', motivo: 'nao_aprendivel' });
    c.tick([['j', { t: 'subirRank', id: 'nova_glacial' }]]);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'habilidadeRecusada', motivo: 'de_classe' });
    c.tick([['j', { t: 'subirRank', id: 'seta_arcana' }]]);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'habilidadeRecusada', motivo: 'nao_liberada' });
    bolsa.liberadas = ['seta_arcana'];
    c.tick([['j', { t: 'subirRank', id: 'seta_arcana' }]]);
    // D-075: este teste de barra conclui o trabalho restante; aceleração por item é coberta separadamente.
    expect(bolsa.estudo?.id).toBe('seta_arcana');
    expect(bolsa.pontosHabilidade).toBe(5);
    if (bolsa.estudo) bolsa.estudo.restanteTicks = 1;
    c.tick();
    expect(bolsa.estudo).toBeNull();
    expect(bolsa.barra.indexOf('seta_arcana')).toBeGreaterThanOrEqual(2);
    // A geral não entra nas teclas de classe, e a de classe não sai delas; dentro do mesmo tipo, troca de lugar.
    c.tick([['j', { t: 'equiparHabilidade', id: 'seta_arcana', slot: 0 }]]);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'habilidadeRecusada', motivo: 'tecla_errada' });
    c.tick([['j', { t: 'equiparHabilidade', id: 'lanca_de_gelo', slot: 4 }]]);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'habilidadeRecusada', motivo: 'tecla_errada' });
    c.tick([['j', { t: 'equiparHabilidade', id: 'lanca_de_gelo', slot: 1 }]]);
    expect(bolsa.barra.slice(0, 2)).toEqual(['raio_em_cadeia', 'lanca_de_gelo']);
    expect(j.habilidades.slice(0, 2)).toEqual(['raio_em_cadeia', 'lanca_de_gelo']);
    c.tick([['j', { t: 'equiparHabilidade', id: 'seta_arcana', slot: 5 }]]);
    expect(bolsa.barra[5]).toBe('seta_arcana');
    // Passiva geral conhecida só vale ligada (D-095): ligar melhora a ficha, e ela não vai para a tecla.
    bolsa.conhecidas.push({ id: 'pele_de_pedra', rank: 1, caminhos: [] });
    const antes = j.hpMax;
    recalcularFicha(j, c.ctx);
    expect(j.hpMax).toBe(antes);
    c.tick([['j', { t: 'ativarPassiva', id: 'pele_de_pedra' }]]);
    expect(j.hpMax).toBeGreaterThan(antes);
    c.tick([['j', { t: 'equiparHabilidade', id: 'pele_de_pedra', slot: 3 }]]);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'habilidadeRecusada', motivo: 'passiva' });
  });

  it('marco 24: a skill de classe sobe com o nível, sem ponto, e espera o caminho no rank de evolução', () => {
    const c = cenario('mago');
    const j = c.ent('j');
    const bolsa = obter(j.bolsa, 'bolsa');
    for (let n = 1; n < 12; n++) j.xp += xpParaProximo(n, c.ctx.balance.xp);
    aplicarSubidas(j, c.ctx, 0, c.eventos);
    const lanca = obter(bolsa.conhecidas.find((x) => x.id === 'lanca_de_gelo'), 'lança');
    const evolucao = obter(c.ctx.balance.habilidades.ranksEvolucao[0], 'rank de evolução');
    expect(lanca.rank).toBe(evolucao - 1);
    const pontos = bolsa.pontosHabilidade;
    const caminho = obter(CONTEUDO.definicoes.get('lanca_de_gelo')?.evolucoes[evolucao]?.[0], 'caminho');
    c.tick([['j', { t: 'subirRank', id: 'lanca_de_gelo', caminho }]]);
    expect(lanca.rank).toBeGreaterThanOrEqual(evolucao);
    expect(lanca.caminhos).toEqual([caminho]);
    expect(bolsa.pontosHabilidade).toBe(pontos);
  });

  it('livros: o geral (e o raro) libera; o de classe ensina na hora e só para a dona; repetido é recusado', () => {
    const c = cenario('arqueiro');
    const bolsa = obter(c.ent('j').bolsa, 'bolsa');
    const raro = obter(CONTEUDO.itens.get('livro_raro'), 'livro raro');
    const gerada = idGerada(4242, 3);
    for (const id of ['livro_bola_de_fogo', 'livro_rolamento', 'livro_redemoinho']) guardarItem(bolsa, obter(CONTEUDO.itens.get(id), id), 2, c.ctx.balance.inventario);
    guardarItem(bolsa, raro, 1, c.ctx.balance.inventario, gerada);
    const inv = (itemId: string) => obter(bolsa.mochila.find((i) => i.itemId === itemId), itemId).invId;
    bolsa.pontosHabilidade = 6;
    const terminar = () => { if (bolsa.estudo) bolsa.estudo.restanteTicks = 1; c.tick(); };
    c.tick([['j', { t: 'usarItem', invId: inv('livro_bola_de_fogo') }]]);
    c.tick([['j', { t: 'usarItem', invId: inv('livro_raro') }]]);
    expect(bolsa.liberadas).toEqual(['bola_de_fogo', gerada]);
    expect(bolsa.conhecidas.some((x) => x.id === 'bola_de_fogo')).toBe(false);
    c.tick([['j', { t: 'usarItem', invId: inv('livro_bola_de_fogo') }]]);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'itemRecusado', motivo: 'ja_conhece' });
    // Liberada, aprende com ponto (e o estudo de sempre).
    c.tick([['j', { t: 'subirRank', id: 'bola_de_fogo' }]]);
    terminar();
    expect(bolsa.conhecidas.some((x) => x.id === 'bola_de_fogo')).toBe(true);
    // O livro de classe ensina na hora; o de outra classe é recusado sem gastar.
    c.tick([['j', { t: 'usarItem', invId: inv('livro_rolamento') }]]);
    expect(bolsa.conhecidas.find((x) => x.id === 'rolamento')).toMatchObject({ rank: 1 });
    c.tick([['j', { t: 'usarItem', invId: inv('livro_redemoinho') }]]);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'itemRecusado', motivo: 'outra_classe' });
    expect(bolsa.mochila.find((i) => i.itemId === 'livro_redemoinho')?.qtd).toBe(2);
  });

  it('morrer devolve só os pontos não gastos', () => {
    const c = cenario();
    const j = c.ent('j');
    const bolsa = obter(j.bolsa, 'bolsa');
    j.xp = xpParaProximo(1, c.ctx.balance.xp) + xpParaProximo(2, c.ctx.balance.xp);
    aplicarSubidas(j, c.ctx, 0, c.eventos);
    expect(bolsa.pontosHabilidade).toBe(2);
    perderXp(j, c.ctx, 10_000, true);
    expect(j.nivel).toBe(1);
    expect(bolsa.pontosHabilidade).toBe(0);
  });
});

describe('save v9', () => {
  it('o personagem v8 vira aventureiro com as habilidades no rank 1, a barra e os pontos dos níveis', () => {
    const c = cenario();
    const j = structuredClone(comKit(c.ent('j'))) as unknown as Record<string, unknown>;
    const bolsa = { ...(j.bolsa as Record<string, unknown>) };
    for (const k of ['classeId', 'conhecidas', 'barra', 'pontosHabilidade']) Reflect.deleteProperty(bolsa, k);
    bolsa.mochila = (bolsa.mochila as Record<string, unknown>[]).map((i) => {
      const copia = { ...i };
      Reflect.deleteProperty(copia, 'ref');
      return copia;
    });
    const v8 = { ...j, nivel: 4, bolsa, acao: { acaoId: 1, habilidadeId: 'explosao', alvoId: null, alvoX: 1, alvoY: 1, inicioTick: 0, lancamentoTick: 9, impactoPrevistoTick: 9 } };
    const migrar = obter(MIGRACOES[8], 'v8→v9');
    const r = migrar({ versaoSchema: 8, estado: { entidades: [v8], projeteis: [{ habilidadeId: 'seta_arcana' }], objetos: [{}], respawns: [{}] }, fasesVisitadas: {} });
    const e = (r.estado as { entidades: Record<string, unknown>[] }).entidades[0] ?? {};
    expect(e.bolsa).toMatchObject({
      classeId: 'aventureiro',
      conhecidas: [{ id: 'seta_arcana', rank: 1, caminhos: [] }, { id: 'explosao', rank: 1, caminhos: [] }, { id: 'curar', rank: 1, caminhos: [] }, { id: 'golpe_atordoante', rank: 1, caminhos: [] }],
      barra: ['seta_arcana', 'explosao', 'curar', 'golpe_atordoante'],
      pontosHabilidade: 3,
    });
    expect(e.acao).toMatchObject({ chave: 'explosao' });
    expect((r.estado as { projeteis: unknown[] }).projeteis[0]).toMatchObject({ chave: 'seta_arcana', multCura: 1 });
    expect((r.estado as { respawns: unknown[] }).respawns[0]).toMatchObject({ habilidades: [] });
    expect(lerRegistro({ versaoSchema: 99 })).toEqual({ ok: false, erro: 'versao_futura' });
  });
});

describe('fases geradas', () => {
  const catalogo = catalogoDeGeracao(CONTEUDO, campanha.geradas.estoque);
  const resumo = (semente: number) => {
    const f = gerarFase({ id: 'g', nome: 'G', semente, salas: 8, nivelInimigos: 5, matizGraus: 0 }, catalogo);
    const inimigos = (f.inimigos ?? []).map((i) => {
      const copia = { ...i };
      Reflect.deleteProperty(copia, 'habilidades');
      return copia;
    });
    return { f, hash: hashTexto(JSON.stringify({ mapa: f.mapa, inimigos, objetos: f.objetos, portas: f.portasInternas ?? [], saida: f.portaSaida ?? null })) };
  };

  it('o mapa, os inimigos e os objetos das fases já salvas não mudam (hash de antes do marco 14)', () => {
    expect([7, 12345, 99].map((s) => resumo(s).hash)).toEqual([3262627525, 566814603, 501629479]);
  });

  it('o chefe ganha 2 habilidades geradas; as dos inimigos são determinísticas e válidas', () => {
    const { f } = resumo(7);
    const chefe = obter(f.inimigos?.find((i) => i.preset === catalogo.boss), 'chefe');
    expect(chefe.habilidades).toHaveLength(2);
    expect(resumo(7).f.inimigos).toEqual(f.inimigos);
    for (const i of f.inimigos ?? []) for (const id of i.habilidades ?? []) expect(resolverHabilidade({ conteudo: CONTEUDO, balance: BALANCE_PADRAO }, id)).toBeDefined();
  });
});

describe('descrições geradas', () => {
  it('todo efeito tem nome e descrição; toda habilidade se descreve', () => {
    for (const tipo of TIPOS_EFEITO) {
      expect(t(`efeito.${tipo}` as ChaveTexto), tipo).not.toBe(undefined);
      expect(descreverEfeito(construirEfeito(tipo, { interno: construirEfeito('atordoar') })), tipo).not.toMatch(/\{|undefined|NaN/);
    }
    for (const h of CONTEUDO.habilidades.values()) {
      const linhas = descreverHabilidade(h, { rankMax: 5 });
      expect(linhas.length, h.id).toBeGreaterThan(1);
      expect(linhas.join(' '), h.id).not.toMatch(/\{|undefined|NaN/);
    }
    expect(descreverEfeito(construirEfeito('queimando', { valor: 3, duracaoMs: 3000 }))).toBe('Queima 3 por segundo por 3 s');
  });
});

describe('determinismo com o sistema de habilidades', () => {
  it('um mago lançando de tudo dá o mesmo digest com a mesma semente', () => {
    const rodada = () => {
      const c = cenario('mago');
      const ids = ['bola_de_fogo', 'lanca_de_gelo', 'raio_em_cadeia', 'barreira'];
      for (let i = 0; i < 1500; i++) {
        c.ent('j').mana = 50;
        c.tick(i % 30 === 0 ? [['j', { t: 'usarHabilidade', id: ids[(i / 30) % 4] ?? 'bola_de_fogo', alvo: i % 60 === 0 ? { x: 5, y: 5 } : 'a' }]] : []);
      }
      return digest(c.estado);
    };
    expect(rodada()).toBe(rodada());
  });
});
