// Marco 9A-1 (14/10/2026): ciclo econômico íntegro (§5.6): ouro, loja, baú, loot e ordenação.
// Sem duplicação, sem saldo negativo, sem recompensa repetida; toda recusa deixa o estado igual.

import { describe, expect, it } from 'vitest';
import { estadoPublico } from '../../src/arena/estado-publico';
import { lerComando } from '../../src/arena/protocolo';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO, type Balance } from '../../src/core/contexto';
import { buscarEntidade, criarEstado, type ObjetoNoMundo } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import type { Entidade } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { consumiveisComAtalho, guardarItem } from '../../src/progression/inventario';
import type { Item } from '../../src/progression/itens';
import { lerRegistro, VERSAO_SCHEMA } from '../../src/save/esquema';
import { chaveRecargaLoja } from '../../src/world/interacao';
import { largarOuro, novoObjeto } from '../../src/world/objetos';
import { validarFase } from '../../src/world/validacao-fase';
import { CONTEUDO, contexto, faseDeTexto, faseOficial01, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const item = (id: string): Item => obter(CONTEUDO.itens.get(id), id);
const JANELA = ticksDe(BALANCE_PADRAO.economia.janelaLojaMs);
const RECARGA = ticksDe(BALANCE_PADRAO.economia.recargaLojaMs);
const CONGELA_BAU = ticksDe(BALANCE_PADRAO.economia.bauCongelaMs);
const SOME_BAU = ticksDe(BALANCE_PADRAO.economia.bauSomeMs);

/** Sala aberta com jogadores (ids e células) e objetos; `tick` aplica comandos por jogador. */
function cenario(jogadores: [string, number, number][] = [['j', 3, 5]], balance: Balance = BALANCE_PADRAO) {
  const ctx = contexto(faseDeTexto(SALA_ABERTA), balance);
  const estado = criarEstado({ semente: 11, faseId: 'teste' });
  const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
  for (const [id, x, y] of jogadores) estado.entidades.push(criarJogador(classe, id, x, y, balance));
  const eventos: EventoSimulacao[] = [];
  const e = (id = 'j'): Entidade => obter(buscarEntidade(estado, id), id);
  const bolsa = (id = 'j') => obter(e(id).bolsa, 'bolsa');
  const tickCom = (cmds: [string, Comando][] = []) => {
    simular(estado, ctx, cmds.map(([entidadeId, cmd]) => ({ tick: estado.tick, entidadeId, cmd })), eventos, DT_MS);
  };
  const tick = (...cmds: Comando[]) => {
    tickCom(cmds.map((c) => ['j', c]));
  };
  const avancar = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const de = <T extends EventoSimulacao['t']>(t: T) => eventos.filter((x): x is Extract<EventoSimulacao, { t: T }> => x.t === t);
  const recusas = () => de('itemRecusado').map((x) => x.motivo);
  const objeto = (o: ObjetoNoMundo) => {
    estado.objetos.push(o);
    return o;
  };
  const dar = (id: string, qtd = 1): string => {
    expect(guardarItem(bolsa(), item(id), qtd, balance.inventario)).toBe(true);
    return obter(bolsa().mochila.at(-1), 'entrada').invId;
  };
  return { ctx, estado, eventos, e, bolsa, tick, tickCom, avancar, de, recusas, objeto, dar };
}

const loja = (x = 4, y = 5, estoque = ['pocao_vida', 'escudo_madeira']) => novoObjeto('loja1', 'loja', x, y, { itens: estoque });
const bau = (campos: Partial<ObjetoNoMundo> = {}, x = 4, y = 5) =>
  novoObjeto('bau1', 'bau', x, y, { itens: ['adaga', 'pocao_mana'], ouro: 30, ...campos });

describe('loja (§2.10)', () => {
  it('interagir ao lado abre a janela de 5 s e congela o jogador', () => {
    const c = cenario();
    c.objeto(loja());
    c.tick({ t: 'interagir' });
    expect(c.e().interacao).toMatchObject({ tipo: 'loja', objetoId: 'loja1' });
    c.tick({ t: 'mover', dir: 'O' });
    c.avancar(60);
    expect([c.e().x, c.e().y]).toEqual([3, 5]);
    c.tick({ t: 'ataqueBasico' });
    expect(c.de('acaoIniciada')).toHaveLength(0);
  });

  it('longe demais (Chebyshev > 1), nada abre', () => {
    const c = cenario();
    c.objeto(loja(5, 5));
    c.tick({ t: 'interagir' });
    expect(c.e().interacao).toBeNull();
    expect(c.recusas()).toEqual(['nada_perto']);
  });

  it('comprar desconta exatamente o valorBase e entrega o item', () => {
    const c = cenario();
    c.objeto(loja());
    c.bolsa().ouro = 50;
    c.tick({ t: 'interagir' });
    c.tick({ t: 'comprar', itemId: 'escudo_madeira' });
    expect(c.bolsa().ouro).toBe(50 - item('escudo_madeira').valorBase);
    expect(c.bolsa().mochila.some((i) => i.itemId === 'escudo_madeira')).toBe(true);
    expect(c.de('comprou')).toMatchObject([{ itemId: 'escudo_madeira', preco: 35 }]);
  });

  it('compra recusada não muda nada: fora da janela, sem ouro, fora do estoque, mochila cheia', () => {
    const c = cenario();
    c.objeto(loja());
    c.bolsa().ouro = 20;
    const foto = () => JSON.stringify(c.bolsa());
    let antes = foto();
    c.tick({ t: 'comprar', itemId: 'pocao_vida' });
    expect(foto()).toBe(antes);
    c.tick({ t: 'interagir' });
    antes = foto();
    c.tick({ t: 'comprar', itemId: 'escudo_madeira' });
    c.tick({ t: 'comprar', itemId: 'capa_sombria' });
    expect(foto()).toBe(antes);
    while (c.bolsa().mochila.length < BALANCE_PADRAO.inventario.capacidade) c.dar('adaga');
    c.bolsa().ouro = 50;
    const cheia = foto();
    c.tick({ t: 'comprar', itemId: 'escudo_madeira' });
    expect(foto()).toBe(cheia);
    expect(c.recusas()).toEqual(['loja_fechada', 'sem_ouro', 'fora_do_estoque', 'mochila_cheia']);
  });

  it('o saldo nunca fica negativo, mesmo com várias compras no mesmo tick', () => {
    const c = cenario();
    c.objeto(loja());
    c.bolsa().ouro = 25;
    c.tick({ t: 'interagir' });
    c.tick(...Array.from({ length: 5 }, (): Comando => ({ t: 'comprar', itemId: 'pocao_vida' })));
    expect(c.bolsa().ouro).toBe(5);
    expect(c.de('comprou')).toHaveLength(2);
    expect(c.recusas()).toEqual(['sem_ouro', 'sem_ouro', 'sem_ouro']);
  });

  it('vender paga 50% arredondado para baixo; chave e item equipado não se vendem', () => {
    const c = cenario();
    c.objeto(loja());
    const ouro = c.bolsa().ouro;
    const espada = obter(c.bolsa().mochila.find((i) => i.itemId === 'espada_curta'), 'espada').invId;
    const chave = c.dar('chave_ferro');
    const escudo = c.dar('escudo_madeira');
    c.tick({ t: 'equipar', invId: escudo, slot: 'arma_secundaria' });
    c.tick({ t: 'interagir' });
    c.tick({ t: 'vender', invId: espada }, { t: 'vender', invId: chave }, { t: 'vender', invId: escudo });
    expect(c.bolsa().ouro).toBe(ouro + Math.floor(item('espada_curta').valorBase / 2));
    expect(c.recusas()).toEqual(['nao_vendavel', 'nao_encontrado']);
    expect(c.bolsa().equipamento.arma_secundaria?.itemId).toBe('escudo_madeira');
  });

  it('vender uma pilha tira uma unidade por vez', () => {
    const c = cenario();
    c.objeto(loja());
    const pocao = obter(c.bolsa().mochila.find((i) => i.itemId === 'pocao_vida'), 'poção');
    c.tick({ t: 'interagir' });
    c.tick({ t: 'vender', invId: pocao.invId });
    expect(pocao.qtd).toBe(1);
    expect(c.de('vendeu')).toMatchObject([{ itemId: 'pocao_vida', preco: 5 }]);
  });

  it('fechar arma a recarga de 10 s; antes dela, a loja recusa', () => {
    const c = cenario();
    c.objeto(loja());
    c.tick({ t: 'interagir' });
    c.tick({ t: 'fecharLoja' });
    expect(c.e().interacao).toBeNull();
    expect(c.estado.recargas[chaveRecargaLoja('loja1', 'j')]).toBe(c.estado.tick - 1 + RECARGA);
    c.tick({ t: 'interagir' });
    expect(c.recusas()).toEqual(['em_recarga']);
    c.avancar(RECARGA);
    c.tick({ t: 'interagir' });
    expect(c.e().interacao?.tipo).toBe('loja');
  });

  it('a janela acaba sozinha em 5 s e também arma a recarga', () => {
    const c = cenario();
    c.objeto(loja());
    c.tick({ t: 'interagir' });
    c.avancar(JANELA);
    expect(c.e().interacao).toBeNull();
    expect(c.de('lojaFechada')).toHaveLength(1);
    c.tick({ t: 'comprar', itemId: 'pocao_vida' });
    expect(c.recusas()).toEqual(['loja_fechada']);
    c.tick({ t: 'interagir' });
    expect(c.recusas()).toEqual(['loja_fechada', 'em_recarga']);
  });

  it('morrer com a loja aberta fecha e arma a recarga (§2.12)', () => {
    const c = cenario();
    c.objeto(loja());
    c.tick({ t: 'interagir' });
    c.e().hp = 0;
    c.tick();
    expect(c.e().interacao).toBeNull();
    expect(c.estado.recargas[chaveRecargaLoja('loja1', 'j')]).toBeGreaterThan(c.estado.tick);
  });

  it('a recarga é por jogador: outro jogador abre a mesma loja', () => {
    const c = cenario([
      ['j', 3, 5],
      ['k', 5, 5],
    ]);
    c.objeto(loja());
    c.tickCom([['j', { t: 'interagir' }]]);
    c.tickCom([['j', { t: 'fecharLoja' }]]);
    c.tickCom([['k', { t: 'interagir' }]]);
    expect(c.e('k').interacao?.tipo).toBe('loja');
  });
});

describe('baú (§2.1, §2.10)', () => {
  it('congela 3 s, entrega itens e ouro uma vez só e some 5 s depois', () => {
    const c = cenario();
    const b = c.objeto(bau());
    const ouro = c.bolsa().ouro;
    c.tick({ t: 'interagir' });
    expect(b.abridorId).toBe('j');
    c.avancar(CONGELA_BAU - 1);
    expect(c.de('bauAberto')).toHaveLength(0);
    c.tick();
    expect(c.de('bauAberto')).toMatchObject([{ itens: ['adaga', 'pocao_mana'], ouro: 30 }]);
    expect(c.bolsa().ouro).toBe(ouro + 30);
    expect(c.e().interacao).toBeNull();
    c.tick({ t: 'interagir' });
    expect(c.recusas()).toEqual(['nada_perto']);
    expect(c.de('bauAberto')).toHaveLength(1);
    c.avancar(SOME_BAU);
    expect(c.estado.objetos).toHaveLength(0);
  });

  it('dez jogadores interagindo no mesmo tick: uma abertura e uma entrega', () => {
    const vizinhos: [string, number, number][] = [
      [3, 4], [4, 4], [5, 4], [3, 5], [5, 5], [3, 6], [4, 6], [5, 6], [4, 5], [4, 4],
    ].map(([x, y], i) => [`j${i}`, x ?? 0, y ?? 0]);
    const c = cenario(vizinhos);
    c.objeto(bau());
    c.tickCom(vizinhos.map(([id]) => [id, { t: 'interagir' }]));
    expect(c.de('interacaoIniciada')).toHaveLength(1);
    c.avancar(CONGELA_BAU + 1);
    expect(c.de('bauAberto')).toHaveLength(1);
    const totalOuro = vizinhos.reduce((s, [id]) => s + c.bolsa(id).ouro, 0);
    expect(totalOuro).toBe(vizinhos.length * BALANCE_PADRAO.economia.ouroInicial + 30);
  });

  it('trancado: sem a chave recusa; com a chave, consome a chave', () => {
    const c = cenario();
    c.objeto(bau({ chave: 'chave_ferro' }));
    c.tick({ t: 'interagir' });
    expect(c.recusas()).toEqual(['trancado']);
    expect(c.e().interacao).toBeNull();
    c.dar('chave_ferro');
    c.tick({ t: 'interagir' });
    c.avancar(CONGELA_BAU);
    expect(c.de('bauAberto')).toHaveLength(1);
    expect(c.bolsa().mochila.some((i) => i.itemId === 'chave_ferro')).toBe(false);
  });

  it('com a mochila cheia, o que não cabe cai ao lado', () => {
    const c = cenario();
    c.objeto(bau({ itens: ['adaga', 'gibao'], ouro: 0 }));
    while (c.bolsa().mochila.length < BALANCE_PADRAO.inventario.capacidade - 1) c.dar('luvas_couro');
    c.tick({ t: 'interagir' });
    c.avancar(CONGELA_BAU);
    expect(c.bolsa().mochila.filter((i) => i.itemId === 'adaga')).toHaveLength(1);
    expect(c.estado.objetos.filter((o) => o.tipo === 'item').map((o) => o.itemId)).toEqual(['gibao']);
  });

  it('morrer abrindo libera a reserva sem entregar', () => {
    const c = cenario();
    const b = c.objeto(bau());
    c.tick({ t: 'interagir' });
    c.e().hp = 0;
    c.tick();
    expect(b.abridorId).toBeNull();
    expect(b.abertoTick).toBe(0);
    c.avancar(CONGELA_BAU + 1);
    expect(c.de('bauAberto')).toHaveLength(0);
  });

  it('o conteúdo do baú fica fora do estado público (§3.6)', () => {
    const c = cenario();
    c.objeto(bau());
    const publico = estadoPublico(c.estado);
    expect(publico.objetos[0]).toMatchObject({ tipo: 'bau', itens: [], ouro: 0 });
    expect(c.estado.objetos[0]?.itens).toEqual(['adaga', 'pocao_mana']);
  });
});

describe('ouro, loot e ordenação', () => {
  it('ouro é coletado uma vez, mesmo com vários jogadores na célula', () => {
    const c = cenario([
      ['j', 3, 5],
      ['k', 3, 5],
    ]);
    largarOuro(c.estado, 12, 3, 5, c.eventos);
    c.tick();
    c.tick();
    expect(c.bolsa('j').ouro + c.bolsa('k').ouro).toBe(2 * BALANCE_PADRAO.economia.ouroInicial + 12);
    expect(c.de('coletou')).toHaveLength(1);
  });

  it('loot com quantidade entra inteiro na mochila', () => {
    const c = cenario();
    c.objeto(novoObjeto('l1', 'item', 3, 5, { itemId: 'pocao_mana', valor: 3 }));
    c.tick();
    expect(c.bolsa().mochila.find((i) => i.itemId === 'pocao_mana')?.qtd).toBe(3);
  });

  it('moverItem reordena; os atalhos seguem a ordem dos consumíveis', () => {
    const c = cenario();
    const mana = c.dar('pocao_mana');
    const ordem = () => c.bolsa().mochila.map((i) => i.itemId);
    expect(ordem()).toEqual(['espada_curta', 'pocao_vida', 'pocao_mana']);
    c.tick({ t: 'moverItem', invId: mana, posicao: 0 });
    expect(ordem()).toEqual(['pocao_mana', 'espada_curta', 'pocao_vida']);
    expect(consumiveisComAtalho(c.bolsa(), CONTEUDO.itens).map((i) => i.itemId)).toEqual(['pocao_mana', 'pocao_vida']);
    c.tick({ t: 'moverItem', invId: mana, posicao: 99 });
    expect(ordem()).toEqual(['espada_curta', 'pocao_vida', 'pocao_mana']);
  });

  it('o protocolo da arena aceita os comandos novos e recusa os malformados', () => {
    expect(lerComando({ t: 'comprar', itemId: 'pocao_vida' })).toEqual({ t: 'comprar', itemId: 'pocao_vida' });
    expect(lerComando({ t: 'vender', invId: 'i1', extra: 1 })).toEqual({ t: 'vender', invId: 'i1' });
    expect(lerComando({ t: 'fecharLoja' })).toEqual({ t: 'fecharLoja' });
    expect(lerComando({ t: 'moverItem', invId: 'i1', posicao: 2 })).toEqual({ t: 'moverItem', invId: 'i1', posicao: 2 });
    expect(lerComando({ t: 'moverItem', invId: 'i1', posicao: -1 })).toBeNull();
    expect(lerComando({ t: 'comprar' })).toBeNull();
  });
});

describe('conteúdo e save', () => {
  it('a fase 1 traz loja, dois baús (um trancado) e a chave', () => {
    const fase = faseOficial01();
    const tipos = fase.objetos.map((o) => o.tipo);
    expect(tipos.filter((t) => t === 'loja')).toHaveLength(1);
    expect(fase.objetos.filter((o) => o.tipo === 'bau').map((o) => o.chave)).toEqual([null, 'chave_ferro']);
    expect(fase.objetos.find((o) => o.tipo === 'loot')?.itemId).toBe('chave_ferro');
  });

  it('a validação recusa item desconhecido e chave que não é do tipo chave', () => {
    const base = { id: 'x', nome: 'x', ordem: 1, tipo: 'campanha', mapa: SALA_ABERTA, spawns: [{ x: 1, y: 1 }] };
    const itens = CONTEUDO.itens;
    const com = (objetos: unknown[]) => validarFase({ ...base, objetos }, undefined, itens);
    expect(com([{ tipo: 'bau', x: 0.5, y: 0.5, loot: ['nada'], ouro: 0 }]).ok).toBe(false);
    expect(com([{ tipo: 'bau', x: 0.5, y: 0.5, loot: [], ouro: 0, chave: 'adaga' }]).ok).toBe(false);
    expect(com([{ tipo: 'loja', x: 0.5, y: 0.5, estoque: [] }]).ok).toBe(false);
    expect(com([{ tipo: 'loot', x: 0.5, y: 0.5, itemId: 'adaga', quantidade: 0 }]).ok).toBe(false);
    const ok = com([{ tipo: 'bau', x: 0.5, y: 0.5, loot: ['adaga'], ouro: 5, chave: 'chave_ferro' }]);
    expect(ok.ok).toBe(true);
    // Validar de novo a forma normalizada dá o mesmo resultado (a campanha valida duas vezes).
    if (ok.ok) expect(validarFase(ok.fase, undefined, itens)).toEqual(ok);
  });

  it('save v3 abre na versão atual com ouro, interação e campos de objeto neutros', () => {
    const c = cenario();
    c.objeto(loja());
    const estado = JSON.parse(JSON.stringify(c.estado)) as { entidades: Record<string, unknown>[]; objetos: Record<string, unknown>[] };
    for (const e of estado.entidades) {
      delete e.interacao;
      delete (e.bolsa as Record<string, unknown>).ouro;
    }
    const novos = new Set(['itens', 'ouro', 'chave', 'abertoTick', 'abridorId']);
    estado.objetos = estado.objetos.map((o) => Object.fromEntries(Object.entries(o).filter(([k]) => !novos.has(k))));
    const r = lerRegistro({ versaoSchema: 3, slot: 1, criadoEm: 1, atualizadoEm: 2, faseRef: { tipo: 'oficial', id: 'fase-01' }, nomeFase: 'x', estado });
    if (!r.ok) throw new Error(r.erro);
    expect(r.registro.versaoSchema).toBe(VERSAO_SCHEMA);
    const j = obter(r.registro.estado.entidades[0], 'j');
    expect(j.interacao).toBeNull();
    expect(j.bolsa?.ouro).toBe(0);
    expect(r.registro.estado.objetos[0]).toMatchObject({ itens: [], ouro: 0, chave: null, abertoTick: 0, abridorId: null });
  });
});
