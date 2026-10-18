// Marco 18 (17/10/2026, D-068, D-069): as camadas do grimório — os 20 itens base com 4 formas e 10 afinidades
// elementais (120 variações), os ganchos, os conjuntos, as ressonâncias de atributo, os combos de sequência e as
// reações novas dos elementos.

import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { fazerCombo } from '../../src/combat/combos';
import { aplicarImpacto } from '../../src/combat/golpe';
import { chaveDoAtor } from '../../src/combat/perfil';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { bonusAtivos } from '../../src/progression/conjuntos';
import { dispararGanchos, type Gancho, type MundoDoGancho } from '../../src/progression/ganchos';
import { idItemBase, variacoesDeItem } from '../../src/progression/gerar-item-base';
import { ressonanciasDe } from '../../src/progression/ressonancias';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena() {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 7, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago'), 'mago'), 'j', 3, 3, ctx.balance);
  estado.entidades.push(j);
  const inimigo = (id: string, x: number, y: number) => {
    const e = criarInimigo(obter(ctx.conteudo.presets.get('goblin'), 'goblin'), id, x, y, ctx.balance);
    e.hp = e.hpMax = 500;
    estado.entidades.push(e);
    return e;
  };
  const eventos: EventoSimulacao[] = [];
  return { ctx, estado, j, inimigo, eventos };
}

describe('itens base com formas (D-069)', () => {
  it('20 bases × 4 formas + 15 afinidades × 4 = 140 variações, todas resolvem no catálogo', () => {
    const dados = CONTEUDO.itensComFormas;
    expect(dados.bases.size).toBe(20);
    const variacoes = variacoesDeItem(dados);
    expect(variacoes).toHaveLength(140);
    expect(variacoes.filter((v) => v.elemento !== null)).toHaveLength(60);
    // Afinidades desiguais: uma base com 3, outras com 2 e 1, a maioria com nenhuma.
    const porBase = [...dados.bases.values()].map((b) => b.elementos.length).sort();
    expect(Math.max(...porBase)).toBe(4);
    expect(porBase.filter((n) => n === 0).length).toBeGreaterThan(10);
    for (const v of variacoes) {
      const item = obter(CONTEUDO.itens.get(idItemBase(v.base, v.forma, v.elemento, 5, 1234)), `${v.base}/${v.forma}/${v.elemento}`);
      expect(item.forma).toBe(v.forma);
      expect(item.raridade).toBe(dados.formas[v.forma].raridade);
    }
  });

  it('a forma muda nome, raridade e poder; a elemental ganha o nome do elemento e o gancho do estado', () => {
    const comum = obter(CONTEUDO.itens.get(idItemBase('cajado', 'comum', null, 8, 42)), 'comum');
    const lendaria = obter(CONTEUDO.itens.get(idItemBase('cajado', 'lendaria', null, 8, 42)), 'lendária');
    const gelo = obter(CONTEUDO.itens.get(idItemBase('cajado', 'ultima', 'gelo', 8, 42)), 'última de gelo');
    expect(comum.nome).not.toBe(lendaria.nome);
    expect(lendaria.raridade).toBe('lendario');
    expect(gelo.raridade).toBe('ultima');
    const soma = (i: typeof comum) => Object.values(i.bonusAtributos).reduce((s, b) => s + b.valor, 0);
    expect(soma(lendaria)).toBeGreaterThan(soma(comum));
    expect(lendaria.ganchos.length).toBeGreaterThan(0);
    expect(gelo.nome).toContain('glacial');
    expect(gelo.ganchos.some((g) => g.efeito.tipo === 'aplicar' && g.efeito.efeito.tipo === 'resfriado')).toBe(true);
    // Elemento fora da afinidade da base não existe.
    expect(CONTEUDO.itens.get(idItemBase('machado', 'comum', 'gelo', 8, 42))).toBeUndefined();
  });
});

describe('ganchos', () => {
  const mundo = (aplicados: [string, string][]): MundoDoGancho => ({
    aplicar: (alvo, ef) => aplicados.push([alvo.id, ef.tipo]),
    hostisPerto: () => [],
    elementoRecente: () => null,
  });

  it('dispara no momento certo, respeita a condição do estado do alvo e cura % da vida', () => {
    const c = cena();
    const alvo = c.inimigo('a', 4, 3);
    const nova = obter(CONTEUDO.habilidades.get('nova_glacial'), 'nova');
    const ganchos: Gancho[] = [
      {
        quando: 'aoAcertar',
        se: { tag: null, habilidade: 'nova_glacial', elemento: null, tipoAtaque: null, estadoDoAlvo: 'resfriado', chancePct: 100 },
        efeito: { tipo: 'aplicar', efeito: construirEfeito('congelado', { duracaoMs: 1500 }), em: 'alvo' },
      },
    ];
    const aplicados: [string, string][] = [];
    dispararGanchos(c.estado, ganchos, c.j, 'aoAcertar', { outro: alvo, hab: nova, estadosDoOutro: [] }, mundo(aplicados), c.eventos);
    expect(aplicados).toEqual([]);
    dispararGanchos(c.estado, ganchos, c.j, 'aoAcertar', { outro: alvo, hab: nova, estadosDoOutro: ['resfriado'] }, mundo(aplicados), c.eventos);
    expect(aplicados).toEqual([['a', 'congelado']]);
    dispararGanchos(c.estado, ganchos, c.j, 'aoCritico', { outro: alvo, hab: nova, estadosDoOutro: ['resfriado'] }, mundo(aplicados), c.eventos);
    expect(aplicados).toHaveLength(1);
  });

  it('o gancho do item equipado age no golpe: Aljava das brasas queima o alvo de flecha', () => {
    const c = cena();
    const j = criarJogador(obter(CONTEUDO.classes.get('arqueiro'), 'arqueiro'), 'k', 5, 5, c.ctx.balance);
    c.estado.entidades.push(j);
    const bolsa = obter(j.bolsa, 'bolsa');
    bolsa.equipamento.arma_secundaria = { invId: 'x1', itemId: idItemBase('aljava', 'lendaria', null, 5, 9), qtd: 1, ref: null };
    const alvo = c.inimigo('b', 6, 5);
    const flecha = obter(CONTEUDO.habilidades.get('flecha_perfurante'), 'flecha');
    for (let i = 0; i < 6; i++) aplicarImpacto(c.estado, c.ctx, alvo, { acaoId: i, fonte: fonteDaHabilidade(j, c.ctx, c.estado.tick, flecha), hab: flecha, indice: 0 }, c.eventos);
    expect(alvo.efeitos.some((f) => f.tipo === 'queimando')).toBe(true);
  });
});

describe('conjuntos', () => {
  it('Vigília do caçador: 2 peças dão o gancho, 3 peças fazem as flechas ecoarem', () => {
    const c = cena();
    const bolsa = obter(c.j.bolsa, 'bolsa');
    const vestir = (slot: 'cabeca' | 'capa' | 'arma_secundaria', base: string) => {
      bolsa.equipamento[slot] = { invId: `v-${base}`, itemId: idItemBase(base, 'epica', null, 4, 3), qtd: 1, ref: null };
    };
    vestir('cabeca', 'capuz');
    vestir('capa', 'capa');
    expect(bonusAtivos(CONTEUDO.conjuntos, bolsa, CONTEUDO.itens).map((a) => a.pecas)).toEqual([2]);
    expect(chaveDoAtor(c.ctx, c.j, 'chuva_de_flechas')).not.toContain('ecoar');
    vestir('arma_secundaria', 'aljava');
    expect(bonusAtivos(CONTEUDO.conjuntos, bolsa, CONTEUDO.itens)[0]?.bonus).toHaveLength(2);
    expect(chaveDoAtor(c.ctx, c.j, 'chuva_de_flechas')).toContain('ecoar');
    expect(chaveDoAtor(c.ctx, c.j, 'bola_de_fogo')).not.toContain('ecoar');
  });
});

describe('ressonâncias de atributo', () => {
  it('atributo alto destrava a individual; o par em 14+ destrava a combinada', () => {
    const base = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, carisma: 10 };
    const ids = (a: typeof base) => ressonanciasDe(CONTEUDO.ressonancias, a).map((r) => r.id);
    expect(ids(base)).toEqual([]);
    expect(ids({ ...base, forca: 16 })).toEqual(['impacto']);
    expect(ids({ ...base, forca: 14, inteligencia: 14 })).toEqual(['lamina_runica']);
    expect(ids({ ...base, forca: 16, constituicao: 16 })).toEqual(expect.arrayContaining(['impacto', 'muralha', 'inamovivel']));
  });
});

describe('combos de sequência', () => {
  it('Lança de gelo e depois Raio em cadeia, dentro da janela, fecham o Condutor; fora dela, não', () => {
    const c = cena();
    const alvo = c.inimigo('a', 5, 3);
    const raio = obter(CONTEUDO.habilidades.get('raio_em_cadeia'), 'raio');
    c.j.ultimaHabilidade = { id: 'lanca_de_gelo', chave: 'lanca_de_gelo', tick: c.estado.tick, alvoId: alvo.id };
    const r = fazerCombo(c.estado, c.ctx, c.j, raio, alvo, { x: 5, y: 3 }, c.eventos);
    expect(r?.danoPct).toBeGreaterThan(0);
    expect(c.eventos.some((e) => e.t === 'comboFeito' && e.combo === 'condutor')).toBe(true);
    expect(alvo.efeitos.some((f) => f.tipo === 'eletrizado')).toBe(true);
    c.estado.tick += 10_000;
    expect(fazerCombo(c.estado, c.ctx, c.j, raio, alvo, { x: 5, y: 3 }, c.eventos)).toBeNull();
  });
});

describe('reações novas', () => {
  it('derreter deixa molhado; raio em molhado eletrocuta o alvo e os molhados perto', () => {
    const c = cena();
    const a = c.inimigo('a', 5, 5);
    const b = c.inimigo('b', 6, 6);
    const longe = c.inimigo('c', 10, 10);
    const raio = obter(CONTEUDO.habilidades.get('raio_em_cadeia'), 'raio');
    const molhar = (e: Entidade) => {
      const tick = c.estado.tick;
      e.efeitos = [{ tipo: 'molhado', ateTick: tick + 300, origemId: 'j', valor: 0, pct: 0, proximoTick: 0, interno: null, ref: null, inicioTick: tick, acumulos: 1 }];
    };
    // O d20 pode falhar (1–3): tenta até um golpe que acerte.
    for (let tentativa = 0; tentativa < 20; tentativa++) {
      for (const e of [a, b, longe]) molhar(e);
      c.eventos.length = 0;
      aplicarImpacto(c.estado, c.ctx, a, { acaoId: tentativa, fonte: fonteDaHabilidade(c.j, c.ctx, c.estado.tick, raio), hab: raio, indice: 0 }, c.eventos);
      const impacto = c.eventos.find((e) => e.t === 'impacto');
      if (impacto?.t === 'impacto' && !impacto.falha) break;
    }
    const impacto = c.eventos.find((e) => e.t === 'impacto');
    expect(impacto?.t === 'impacto' && impacto.sinergias).toContain('eletrocutar');
    expect(obter(buscarEntidade(c.estado, 'b'), 'b').efeitos.some((f) => f.tipo === 'atordoar')).toBe(true);
    expect(obter(buscarEntidade(c.estado, 'c'), 'c').efeitos.some((f) => f.tipo === 'atordoar')).toBe(false);
    const derreter = CONTEUDO.interacoes.sinergias.find((s) => s.id === 'derreter');
    expect(derreter?.aplicar.map((e) => e.tipo)).toContain('molhado');
  });
});
