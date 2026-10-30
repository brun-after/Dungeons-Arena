import { describe, expect, it } from 'vitest';
import { lerComando } from '../../src/arena/protocolo';
import { estadoPublico } from '../../src/arena/estado-publico';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO, type Balance } from '../../src/core/contexto';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { derivarFicha } from '../../src/progression/derivados';
import { guardarItem } from '../../src/progression/inventario';
import { lerItens, type Item } from '../../src/progression/itens';
import { aplicarSubidas, xpParaProximo } from '../../src/progression/nivel';
import { largarItem } from '../../src/world/objetos';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const item = (id: string): Item => obter(CONTEUDO.itens.get(id), id);

/** Jogador da campanha em (3,5) na sala aberta, com a mochila inicial da classe. */
function cenario(balance: Balance = BALANCE_PADRAO, modoId = 'campanha') {
  const ctx = contexto(faseDeTexto(SALA_ABERTA), balance, modoId);
  const estado = criarEstado({ semente: 7, faseId: 'teste' });
  const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
  estado.entidades.push(criarJogador(classe, 'j', 3, 5, balance));
  const eventos: EventoSimulacao[] = [];
  const j = (): Entidade => obter(buscarEntidade(estado, 'j'), 'j');
  const tick = (...cmds: Comando[]) => {
    simular(estado, ctx, cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })), eventos, DT_MS);
  };
  const de = <T extends EventoSimulacao['t']>(t: T) => eventos.filter((e): e is Extract<EventoSimulacao, { t: T }> => e.t === t);
  /** Coloca um item na mochila e devolve o invId. */
  const dar = (id: string): string => {
    const b = obter(j().bolsa, 'bolsa');
    expect(guardarItem(b, item(id), 1, balance.inventario)).toBe(true);
    return obter(b.mochila.at(-1), 'entrada').invId;
  };
  return { ctx, estado, eventos, j, tick, de, dar };
}

function permutacoes<T>(lista: T[]): T[][] {
  if (lista.length <= 1) return [lista];
  return lista.flatMap((x, i) => permutacoes([...lista.slice(0, i), ...lista.slice(i + 1)]).map((resto) => [x, ...resto]));
}

describe('catálogo de itens', () => {
  it('o catálogo oficial é válido e cobre os 10 slots', () => {
    const slots = new Set([...CONTEUDO.itens.values()].map((i) => i.slotPadrao).filter((s) => s !== null));
    expect(slots.size).toBe(10);
  });

  it('erros de catálogo são apontados', () => {
    const { erros } = lerItens({
      itens: [
        { id: 'x', nome: 'X', tipo: 'equipamento', descricao: '.', icone: '?', raridade: 'comum', valorBase: 1, slotPadrao: null, nivelMinimo: 1, bonusAtributos: { sorte: 1 }, bonusDefesa: 0, efeitos: [], dropavel: true },
        { id: 'p', nome: 'P', tipo: 'consumivel', descricao: '.', icone: '?', raridade: 'comum', valorBase: 1, slotPadrao: null, nivelMinimo: 1, bonusAtributos: {}, bonusDefesa: 0, efeitos: [], dropavel: true },
      ],
    });
    expect(erros.join('\n')).toMatch(/precisa de slotPadrao/);
    expect(erros.join('\n')).toMatch(/atributo desconhecido "sorte"/);
    expect(erros.join('\n')).toMatch(/ao menos um efeito/);
  });
});

describe('equipamento derivado (§2.10)', () => {
  it('a ordem de equipar não muda a ficha (todas as permutações)', () => {
    const ids = ['espada_curta', 'escudo_madeira', 'botas_rapidas', 'gibao'];
    const fichas = new Set<string>();
    for (const ordem of permutacoes(ids)) {
      const c = cenario();
      c.j().nivel = 3;
      const inv = ordem.map((id) => [id, c.dar(id)] as const);
      c.tick(...inv.map(([id, invId]) => ({ t: 'equipar', invId, slot: obter(item(id).slotPadrao, id) }) as const));
      const e = c.j();
      fichas.add(JSON.stringify([e.atributos, e.defesa, e.hpMax, e.manaMax]));
    }
    expect(fichas.size).toBe(1);
  });

  it('percentuais somam sem compor, arredondam uma vez e respeitam o limite', () => {
    const c = cenario();
    const bolsa = obter(c.j().bolsa, 'bolsa');
    bolsa.atributosBase.destreza = 10;
    // Dois +15% somam 30%: round((10 + 1) × 1,30) = 14 (compondo seria 14,5 → 15).
    const botas = { ...item('botas_rapidas'), id: 'b2', slotPadrao: 'capa' as const };
    const ctx = { ...c.ctx, conteudo: { ...CONTEUDO, itens: new Map([...CONTEUDO.itens, ['b2', botas]]) } };
    bolsa.equipamento.pes = { invId: 'a', itemId: 'botas_rapidas', qtd: 1, ref: null };
    bolsa.equipamento.capa = { invId: 'b', itemId: 'b2', qtd: 1, ref: null };
    bolsa.equipamento.maos = { invId: 'c', itemId: 'luvas_couro', qtd: 1, ref: null };
    expect(derivarFicha(bolsa, 1, ctx).atributos.destreza).toBe(14);
    bolsa.atributosBase.destreza = BALANCE_PADRAO.atributos.maximo - 1;
    expect(derivarFicha(bolsa, 1, ctx).atributos.destreza).toBe(BALANCE_PADRAO.atributos.maximo);
  });

  it('equipar troca com o que estava no slot e desequipar devolve à mochila', () => {
    const c = cenario();
    c.j().nivel = 2;
    // Marco 27: o Aventureiro já começa com o bumerangue de madeira na mão principal.
    const adaga = c.dar('adaga');
    const forcaBase = c.j().atributos.forca;
    const destrezaBase = c.j().atributos.destreza;
    c.tick({ t: 'equipar', invId: adaga, slot: 'arma_principal' });
    expect(c.j().atributos.destreza).toBe(destrezaBase + 2);
    expect(c.j().bolsa?.mochila.some((i) => i.itemId === 'bumerangue_madeira')).toBe(true);
    const machado = c.dar('machado_orc');
    c.tick({ t: 'equipar', invId: machado, slot: 'arma_principal' });
    expect(c.j().atributos.forca).toBe(forcaBase + 4);
    expect(c.j().atributos.destreza).toBe(destrezaBase);
    expect(c.j().bolsa?.mochila.some((i) => i.itemId === 'adaga')).toBe(true);
    c.tick({ t: 'desequipar', slot: 'arma_principal' });
    expect(c.j().atributos.forca).toBe(forcaBase);
    expect(c.j().bolsa?.equipamento.arma_principal).toBeNull();
  });

  it('recusas: slot errado, nível insuficiente, consumível equipado e mochila cheia ao desequipar', () => {
    const c = cenario();
    const espada = c.dar('adaga');
    c.tick({ t: 'equipar', invId: espada, slot: 'cabeca' });
    c.tick({ t: 'equipar', invId: c.dar('cota_malha'), slot: 'corpo' });
    c.tick({ t: 'equipar', invId: obter(c.j().bolsa?.mochila.find((i) => i.itemId === 'pocao_vida'), 'poção').invId, slot: 'corpo' });
    c.tick({ t: 'equipar', invId: espada, slot: 'arma_principal' });
    const bolsa = obter(c.j().bolsa, 'bolsa');
    while (bolsa.mochila.length < BALANCE_PADRAO.inventario.capacidade) c.dar('adaga');
    c.tick({ t: 'desequipar', slot: 'arma_principal' });
    expect(c.de('itemRecusado').map((e) => e.motivo)).toEqual(['slot_invalido', 'nivel_insuficiente', 'slot_invalido', 'mochila_cheia']);
  });
});

describe('consumíveis', () => {
  it('poção cura, gasta uma unidade e some quando acaba; com vida cheia, não gasta', () => {
    const c = cenario();
    const pocao = obter(c.j().bolsa?.mochila.find((i) => i.itemId === 'pocao_vida'), 'poção');
    c.tick({ t: 'usarItem', invId: pocao.invId });
    expect(c.de('itemRecusado')).toMatchObject([{ motivo: 'sem_efeito' }]);
    expect(pocao.qtd).toBe(2);
    c.j().hp = 10;
    c.tick({ t: 'usarItem', invId: pocao.invId });
    c.j().hp = 10;
    c.tick({ t: 'usarItem', invId: pocao.invId });
    expect(c.de('usouItem')).toHaveLength(2);
    expect(c.j().hp).toBe(10 + Math.round((c.j().hpMax * 40) / 100));
    expect(c.j().bolsa?.mochila.some((i) => i.itemId === 'pocao_vida')).toBe(false);
  });

  it('consumíveis empilham até o limite da pilha', () => {
    const c = cenario();
    const bolsa = obter(c.j().bolsa, 'bolsa');
    expect(guardarItem(bolsa, item('pocao_vida'), 9, BALANCE_PADRAO.inventario)).toBe(true);
    const pilhas = bolsa.mochila.filter((i) => i.itemId === 'pocao_vida').map((i) => i.qtd);
    expect(pilhas).toEqual([10, 1]);
  });
});

describe('nível e pontos (§2.12)', () => {
  it('sobe em laço preservando o excedente, dá pontos e recalcula a vida', () => {
    const c = cenario();
    const e = c.j();
    const hpAntes = e.hpMax;
    const precisa = xpParaProximo(1, BALANCE_PADRAO.xp) + xpParaProximo(2, BALANCE_PADRAO.xp);
    e.xp = precisa + 7;
    aplicarSubidas(e, c.ctx, 0, c.eventos);
    expect(e.nivel).toBe(3);
    expect(e.xp).toBe(7);
    expect(e.bolsa?.pontosAtributo).toBe(2 * BALANCE_PADRAO.xp.pontosPorNivel);
    expect(e.hpMax).toBe(hpAntes + 2 * BALANCE_PADRAO.xp.hpPorNivel);
    expect(c.de('subiuNivel').map((x) => x.nivel)).toEqual([2, 3]);
  });

  it('para no nível máximo; sem tabela, usa nível × 100', () => {
    expect(xpParaProximo(15, BALANCE_PADRAO.xp)).toBe(1500);
    const c = cenario();
    c.j().xp = 10_000_000;
    aplicarSubidas(c.j(), c.ctx, 0, c.eventos);
    expect(c.j().nivel).toBe(BALANCE_PADRAO.xp.nivelMax);
  });

  it('distribuir ponto aumenta a base e o efetivo; sem pontos, recusa', () => {
    const c = cenario();
    c.tick({ t: 'distribuirPonto', atributo: 'constituicao' });
    expect(c.de('itemRecusado')).toMatchObject([{ motivo: 'sem_pontos' }]);
    const bolsa = obter(c.j().bolsa, 'bolsa');
    bolsa.pontosAtributo = 1;
    const hpMax = c.j().hpMax;
    c.tick({ t: 'distribuirPonto', atributo: 'constituicao' });
    expect(bolsa.atributosBase.constituicao).toBe(11);
    expect(c.j().hpMax).toBe(hpMax + BALANCE_PADRAO.hp.hpAtributoMult);
    expect(bolsa.pontosAtributo).toBe(0);
  });

  it('matar um inimigo com XP sobe de nível pela simulação', () => {
    const c = cenario();
    const goblin = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'g', 4, 5, BALANCE_PADRAO);
    goblin.hp = 0;
    goblin.participacao.push({ id: 'j', tick: 0 });
    c.j().xp = xpParaProximo(1, BALANCE_PADRAO.xp) - 1;
    c.estado.entidades.push(goblin);
    c.tick();
    expect(c.j().nivel).toBe(2);
  });
});

describe('drops e coleta de itens', () => {
  const comItem = (chance: number): Balance => ({ ...BALANCE_PADRAO, drops: { ...BALANCE_PADRAO.drops, chanceOrbeHp: 1, chanceItem: chance } });

  it('o item é sorteado à parte do orbe e do ouro, cai ao lado deles e só na primeira morte', () => {
    const c = cenario(comItem(1));
    const goblin = obter(CONTEUDO.presets.get('goblin'), 'goblin');
    const primeira = criarInimigo(goblin, 'g1', 6, 6, BALANCE_PADRAO);
    const reincidente = criarInimigo(goblin, 'g2', 8, 8, BALANCE_PADRAO);
    reincidente.abates = 1;
    primeira.hp = 0;
    reincidente.hp = 0;
    c.estado.entidades.push(primeira, reincidente);
    c.tick();
    const objetos = c.estado.objetos.map((o) => [o.tipo, o.x, o.y]);
    expect(objetos).toEqual([
      ['orbe_hp', 6, 6],
      ['ouro', 6, 5],
      ['item', 7, 6],
    ]);
  });

  it('o boss sempre solta item, de raridade mínima configurada', () => {
    const c = cenario();
    const boss = criarInimigo(obter(CONTEUDO.presets.get('boss'), 'boss'), 'boss', 7, 7, BALANCE_PADRAO);
    boss.hp = 0;
    c.estado.entidades.push(boss);
    c.tick();
    const drop = obter(c.estado.objetos.find((o) => o.tipo === 'item'), 'drop');
    expect(['raro', 'epico', 'lendario']).toContain(item(obter(drop.itemId, 'itemId')).raridade);
  });

  it('marco 17: no modo Livre também cai item (a arena dá itens nos abates)', () => {
    const c = cenario(comItem(1), 'livre');
    const g = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'g', 6, 6, BALANCE_PADRAO);
    g.hp = 0;
    c.estado.entidades.push(g);
    c.tick();
    expect(c.estado.objetos.some((o) => o.tipo === 'item')).toBe(true);
  });

  it('pisar no item guarda na mochila; com a mochila cheia, o item fica no chão', () => {
    const c = cenario();
    largarItem(c.estado, 'adaga', 3, 5, c.eventos);
    c.tick();
    expect(c.de('coletou')).toMatchObject([{ tipo: 'item', itemId: 'adaga' }]);
    expect(c.estado.objetos).toHaveLength(0);
    const bolsa = obter(c.j().bolsa, 'bolsa');
    while (bolsa.mochila.length < BALANCE_PADRAO.inventario.capacidade) c.dar('adaga');
    largarItem(c.estado, 'gibao', 3, 5, c.eventos);
    c.tick();
    expect(c.estado.objetos).toHaveLength(1);
  });
});

describe('rede e privacidade', () => {
  it('a bolsa nunca vai no estado público', () => {
    const c = cenario();
    expect(estadoPublico(c.estado).entidades.every((e) => e.bolsa === null)).toBe(true);
  });

  it('o protocolo valida slot e atributo dos comandos novos', () => {
    expect(lerComando({ t: 'equipar', invId: 'i1', slot: 'cabeca' })).toEqual({ t: 'equipar', invId: 'i1', slot: 'cabeca' });
    expect(lerComando({ t: 'equipar', invId: 'i1', slot: 'bolso' })).toBeNull();
    expect(lerComando({ t: 'desequipar', slot: 'anel' })).toEqual({ t: 'desequipar', slot: 'anel' });
    expect(lerComando({ t: 'distribuirPonto', atributo: 'forca' })).toEqual({ t: 'distribuirPonto', atributo: 'forca' });
    expect(lerComando({ t: 'distribuirPonto', atributo: 'sorte' })).toBeNull();
  });

  it('jogador da arena não tem bolsa: comandos de item são recusados', () => {
    const c = cenario(BALANCE_PADRAO, 'livre');
    c.j().bolsa = null;
    c.tick({ t: 'distribuirPonto', atributo: 'forca' });
    expect(c.de('itemRecusado')).toMatchObject([{ motivo: 'sem_mochila' }]);
  });
});
