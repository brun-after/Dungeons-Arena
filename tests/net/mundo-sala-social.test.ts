// Marco 30 (30/10/2026, D-129): a sala do Mundo com o social e a economia: o quadro de missões (aceitar, caçar,
// entregar), o banco, o chat local e da região, a troca direta, o grupo (a entidade leva o grupo, a masmorra do grupo,
// o PvP que poupa o grupo), os materiais que os monstros deixam e as reservas do mercado.

import { describe, expect, it } from 'vitest';
import { versaoDoConteudo, type MensagemServidor } from '../../src/arena/protocolo';
import type { EntidadeId } from '../../src/core/comandos';
import { alvoOfensivoValido } from '../../src/combat/acao';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { posicionar, type Entidade } from '../../src/entities/entidade';
import { criarInimigo } from '../../src/entities/fabrica';
import { podeFerir } from '../../src/modos/relacao';
import type { AvisoDoMundo } from '../../src/mundo/avisos';
import { fichaNova, type FichaDoMundo } from '../../src/mundo/ficha-mundo';
import { lerLugar } from '../../src/mundo/lugares';
import { eventoDaRegiao, type EventoDaRegiao } from '../../src/mundo/eventos-mundo';
import { diaDe, ofertasDoQuadro } from '../../src/mundo/missoes-mundo';
import type { Perigo, Reino } from '../../src/mundo/reino';
import { SalaMundo } from '../../src/mundo/sala-mundo';
import { forjar } from '../../src/progression/forja';
import { guardarItem } from '../../src/progression/inventario';
import { tipoEm } from '../../src/world/fase';
import { integrarEntidade, planejarIrPara } from '../../src/world/movimento';
import { barradoNoRefugio, emRefugio } from '../../src/world/refugio';
import { CONTEUDO } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const REINO: Reino = obter(CONTEUDO.reinos.get('reino_central'), 'reino');
const AGORA = Date.UTC(2026, 9, 30, 12);

/** A sala com a morte de um monstro à mão (o evento e o respawn, como a simulação deixa). */
class SalaDeTeste extends SalaMundo {
  morte(id: EntidadeId, porId: EntidadeId, preset: string): void {
    this.estado.respawns.push({ id, preset, x: 1, y: 1, nivel: 1, geracao: 1, abates: 1, noTick: 1e9, habilidades: [] });
    this.eventosDoTick.length = 0;
    this.eventosDoTick.push({ t: 'morreu', tick: this.estado.tick, id, porId });
    this.depoisDoTick();
  }
}

function sala(lugar: string, agora = AGORA): SalaDeTeste {
  return new SalaDeTeste(REINO, obter(lerLugar(REINO, lugar), lugar), CONTEUDO, { semente: 9, agora: () => agora });
}

/** Um dia (ao meio-dia) em que o quadro da Vila do Centro oferece a missão. */
function diaCom(id: string): number {
  for (let d = 0; d < 400; d++) {
    const agora = AGORA + d * 86_400_000;
    if (ofertasDoQuadro(REINO.missoes, 'vila_do_centro', diaDe(agora), BALANCE_PADRAO.mundo.missoes.ofertasPorQuadro).includes(id)) return agora;
  }
  throw new Error(`nenhum dia oferece ${id}`);
}

function ficha(nome: string, id: string): FichaDoMundo {
  return obter(fichaNova({ conteudo: CONTEUDO, balance: BALANCE_PADRAO }, REINO, 'guerreiro', nome, id), 'ficha');
}

function entrar(s: SalaMundo, identidade: string, nome = identidade, grupo: string | null = null) {
  s.reservar(identidade, ficha(nome, `pers-${identidade}`), null, grupo);
  const recebidas: MensagemServidor[] = [];
  const conexao = s.conectar((t) => recebidas.push(JSON.parse(t) as MensagemServidor), identidade);
  conexao.receber(JSON.stringify({ t: 'entrar', nome: 'x', pedidoFicha: null, versaoConteudo: versaoDoConteudo() }));
  const bem = recebidas.find((m) => m.t === 'bemVindo');
  if (bem?.t !== 'bemVindo') throw new Error('não entrou');
  const avisos = () => recebidas.flatMap((m): AvisoDoMundo[] => (m.t === 'mundo' ? [m.aviso] : []));
  const ultimo = <T extends AvisoDoMundo['tipo']>(tipo: T) => avisos().filter((a): a is Extract<AvisoDoMundo, { tipo: T }> => a.tipo === tipo).at(-1);
  const e = (): Entidade => obter(buscarEntidade(s.estado, bem.entidadeId), 'entidade');
  const acao = (a: unknown) => {
    conexao.receber(JSON.stringify({ t: 'acaoMundo', acao: a }));
  };
  return { conexao, recebidas, bem, avisos, ultimo, e, acao };
}

const rodar = (s: SalaMundo, n = 1) => {
  for (let i = 0; i < n; i++) s.tick(DT_MS);
};

function irAoNpc(s: SalaMundo, c: ReturnType<typeof entrar>, papel: string) {
  const o = obter(s.estado.objetos.find((x) => x.tipo === 'npc' && x.ref === papel), papel);
  posicionar(c.e(), o.x, o.y + 1);
  return o;
}

const dar = (e: Entidade, itemId: string, qtd: number) => {
  guardarItem(obter(e.bolsa, 'bolsa'), obter(CONTEUDO.itens.get(itemId), itemId), qtd, BALANCE_PADRAO.inventario);
};

describe('sala do Mundo: social e economia', () => {
  it('o quadro oferece as missões do dia; a caça anda e a entrega dá a recompensa', () => {
    const agora = diaCom('limpar_os_campos');
    const s = sala('regiao:vila_do_centro', agora);
    const c = entrar(s, 'u1');
    const missao = obter(REINO.missoes.find((m) => m.id === 'limpar_os_campos'), 'missão');
    if (missao.alvo.tipo !== 'cacar') throw new Error('tipo');
    // Longe do quadro, recusa; fora das ofertas do dia, também.
    c.acao({ a: 'missao', op: 'aceitar', id: missao.id });
    expect(c.ultimo('recusa')).toEqual({ tipo: 'recusa', motivo: 'longe' });
    irAoNpc(s, c, 'missoes');
    const fora = REINO.missoes.find((m) => !ofertasDoQuadro(REINO.missoes, 'vila_do_centro', diaDe(agora), BALANCE_PADRAO.mundo.missoes.ofertasPorQuadro).includes(m.id));
    c.acao({ a: 'missao', op: 'aceitar', id: obter(fora, 'missão fora do quadro').id });
    expect(c.ultimo('quadro')?.ativas ?? []).toEqual([]);
    c.acao({ a: 'missao', op: 'aceitar', id: missao.id });
    expect(c.ultimo('quadro')?.ativas).toEqual([expect.objectContaining({ id: missao.id, progresso: 0 })]);
    // Outro preset não conta; o certo anda até a meta.
    s.morte('g0', c.bem.entidadeId, 'goblin');
    expect(c.ultimo('missao')).toBeUndefined();
    const ouroAntes = obter(c.e().bolsa, 'bolsa').ouro;
    for (let i = 0; i < missao.alvo.qtd; i++) s.morte(`m${String(i)}`, c.bem.entidadeId, missao.alvo.preset);
    expect(c.ultimo('missao')).toMatchObject({ id: missao.id, progresso: missao.alvo.qtd });
    c.acao({ a: 'missao', op: 'entregar', id: missao.id });
    expect(c.ultimo('recompensa')).toMatchObject({ nome: missao.nome, ouro: missao.recompensa.ouro });
    expect(obter(c.e().bolsa, 'bolsa').ouro).toBe(ouroAntes + missao.recompensa.ouro);
    expect(c.ultimo('quadro')?.feitasHoje).toContain(missao.id);
    // A mesma diária não volta no mesmo dia.
    c.acao({ a: 'missao', op: 'aceitar', id: missao.id });
    expect(c.ultimo('quadro')?.ativas).toEqual([]);
  });

  it('a caça em outra região não anda a missão de outra região', () => {
    const s = sala('regiao:campos_do_oeste', diaCom('limpar_os_campos'));
    const c = entrar(s, 'u1');
    s.morte('m0', c.bem.entidadeId, 'slime');
    expect(c.ultimo('missao')).toBeUndefined();
  });

  it('o banco guarda e devolve, só perto do banqueiro', () => {
    const s = sala('regiao:vila_do_centro');
    const c = entrar(s, 'u1');
    dar(c.e(), 'erva_curativa', 3);
    const erva = obter(c.e().bolsa?.mochila.find((i) => i.itemId === 'erva_curativa'), 'erva');
    c.acao({ a: 'banco', op: 'guardar', invId: erva.invId, qtd: 2 });
    expect(c.ultimo('recusa')).toEqual({ tipo: 'recusa', motivo: 'longe' });
    irAoNpc(s, c, 'banco');
    c.acao({ a: 'banco', op: 'guardar', invId: erva.invId, qtd: 2 });
    expect(c.ultimo('banco')?.itens).toEqual([expect.objectContaining({ itemId: 'erva_curativa', qtd: 2 })]);
    obter(c.e().bolsa, 'bolsa').ouro = 40;
    c.acao({ a: 'bancoOuro', op: 'guardar', valor: 25 });
    expect(c.ultimo('banco')?.ouro).toBe(25);
    // O banco vai na gravação da ficha (a próxima entrada traz).
    rodar(s, 1);
    c.conexao.encerrar();
    const gravada = s.retirarPendencias().find((p) => p.tipo === 'gravar');
    expect(gravada?.tipo === 'gravar' && gravada.ficha.banco).toMatchObject({ ouro: 25, itens: [expect.objectContaining({ itemId: 'erva_curativa', qtd: 2 })] });
  });

  it('o chat local vai a quem está perto; o da região, a todos; o rápido demais é recusado', () => {
    const s = sala('regiao:vila_do_centro');
    const a = entrar(s, 'u1', 'Ana');
    const b = entrar(s, 'u2', 'Bia');
    posicionar(a.e(), 64, 64);
    posicionar(b.e(), 64 + BALANCE_PADRAO.mundo.chat.raioLocal + 5, 64);
    a.acao({ a: 'chat', canal: 'local', texto: 'oi\nperto' });
    expect(a.ultimo('chat')).toEqual({ tipo: 'chat', canal: 'local', de: 'Ana', texto: 'oi perto' });
    expect(b.ultimo('chat')).toBeUndefined();
    a.acao({ a: 'chat', canal: 'regiao', texto: 'todos' });
    expect(b.ultimo('chat')).toMatchObject({ canal: 'regiao', texto: 'todos' });
    for (let i = 0; i < BALANCE_PADRAO.mundo.chat.porJanela; i++) a.acao({ a: 'chat', canal: 'regiao', texto: `m${String(i)}` });
    expect(a.ultimo('recusa')).toEqual({ tipo: 'recusa', motivo: 'chat_rapido' });
    // O do grupo vai ao servidor (pendência social); a Ana gastou a janela, então fala a Bia.
    b.acao({ a: 'chat', canal: 'grupo', texto: '...' });
    expect(s.retirarPendencias()).toContainEqual(expect.objectContaining({ tipo: 'social', identidade: 'u2', nome: 'Bia' }));
  });

  it('a troca direta: convite, ofertas, duas confirmações e os itens trocados', () => {
    const s = sala('regiao:vila_do_centro');
    const a = entrar(s, 'u1', 'Ana');
    const b = entrar(s, 'u2', 'Bia');
    posicionar(a.e(), 60, 60);
    posicionar(b.e(), 61, 60);
    dar(a.e(), 'minerio_ferro', 2);
    obter(b.e().bolsa, 'bolsa').ouro = 90;
    a.acao({ a: 'troca', op: 'propor', alvo: b.bem.entidadeId });
    expect(b.ultimo('troca')).toMatchObject({ estado: 'convite', com: 'Ana', comId: a.bem.entidadeId });
    b.acao({ a: 'troca', op: 'aceitar', de: a.bem.entidadeId });
    const ferro = obter(a.e().bolsa?.mochila.find((i) => i.itemId === 'minerio_ferro'), 'ferro');
    a.acao({ a: 'troca', op: 'oferecer', itens: [{ invId: ferro.invId, qtd: 2 }], ouro: 0 });
    b.acao({ a: 'troca', op: 'oferecer', itens: [], ouro: 60 });
    expect(a.ultimo('troca')).toMatchObject({ estado: 'aberta', dele: { ouro: 60 }, minha: { itens: [{ itemId: 'minerio_ferro', qtd: 2 }] } });
    a.acao({ a: 'troca', op: 'confirmar' });
    b.acao({ a: 'troca', op: 'confirmar' });
    expect(a.ultimo('troca')?.estado).toBe('feita');
    expect(obter(a.e().bolsa, 'bolsa').ouro).toBeGreaterThanOrEqual(60);
    expect(b.e().bolsa?.mochila.some((i) => i.itemId === 'minerio_ferro')).toBe(true);
    // Longe, não dá para propor.
    posicionar(b.e(), 100, 100);
    a.acao({ a: 'troca', op: 'propor', alvo: b.bem.entidadeId });
    expect(a.ultimo('recusa')).toEqual({ tipo: 'recusa', motivo: 'longe' });
  });

  it('quem sai da sala no meio da troca a desfaz para o outro', () => {
    const s = sala('regiao:vila_do_centro');
    const a = entrar(s, 'u1', 'Ana');
    const b = entrar(s, 'u2', 'Bia');
    posicionar(a.e(), 60, 60);
    posicionar(b.e(), 61, 60);
    a.acao({ a: 'troca', op: 'propor', alvo: b.bem.entidadeId });
    b.acao({ a: 'troca', op: 'aceitar', de: a.bem.entidadeId });
    a.conexao.encerrar();
    expect(b.ultimo('troca')?.estado).toBe('cancelada');
  });

  it('o grupo: a entidade leva o grupo, o PvP poupa o grupo e a masmorra é a do grupo', () => {
    const s = sala('regiao:campos_do_oeste');
    const a = entrar(s, 'u1', 'Ana', 'g7');
    const b = entrar(s, 'u2', 'Bia');
    expect(a.e().grupo).toBe('g7');
    expect(s.definirGrupo('u2', 'g7')).toBe(true);
    expect(b.e().grupo).toBe('g7');
    expect(podeFerir(a.e(), b.e(), { ...s.ctx.modo, fogoAmigo: true })).toBe(false);
    s.definirGrupo('u2', null);
    expect(b.e().grupo).toBeNull();
    expect(podeFerir(a.e(), b.e(), { ...s.ctx.modo, fogoAmigo: true })).toBe(true);
    // A porta da masmorra: a instância do grupo (os outros do grupo caem na mesma sala).
    const porta = obter(s.estado.objetos.find((o) => o.tipo === 'porta_estrutura'), 'porta');
    posicionar(a.e(), porta.x, porta.y + 1);
    a.conexao.receber(JSON.stringify({ t: 'cmd', pacote: { sessaoId: a.bem.sessaoId, seq: 1, epocaSala: s.epoca, tickCliente: s.estado.tick, cmd: { t: 'interagir' } } }));
    rodar(s, 4);
    const troca = s.retirarPendencias().find((p) => p.tipo === 'trocar');
    expect(troca?.tipo === 'trocar' && troca.instancia).toBe('grupo:g7:toca_dos_goblins');
  });

  it('a caça do grupo: quem está perto do matador também anda a missão', () => {
    const s = sala('regiao:vila_do_centro', diaCom('limpar_os_campos'));
    const a = entrar(s, 'u1', 'Ana', 'g1');
    const b = entrar(s, 'u2', 'Bia', 'g1');
    const c = entrar(s, 'u3', 'Cris');
    for (const x of [a, b, c]) {
      irAoNpc(s, x, 'missoes');
      x.acao({ a: 'missao', op: 'aceitar', id: 'limpar_os_campos' });
    }
    s.morte('slime-x', a.bem.entidadeId, 'slime');
    expect(a.ultimo('missao')).toMatchObject({ progresso: 1 });
    expect(b.ultimo('missao')).toMatchObject({ progresso: 1 });
    expect(c.ultimo('missao')).toBeUndefined();
  });

  it('o mercado: a sala reserva o item e a taxa do anúncio, e o ouro da compra', () => {
    const s = sala('regiao:vila_do_centro');
    const c = entrar(s, 'u1', 'Ana');
    irAoNpc(s, c, 'mercado');
    dar(c.e(), 'minerio_prata', 3);
    const bolsa = obter(c.e().bolsa, 'bolsa');
    bolsa.ouro = 100;
    const prata = obter(bolsa.mochila.find((i) => i.itemId === 'minerio_prata'), 'prata');
    c.acao({ a: 'mercado', op: 'anunciar', invId: prata.invId, qtd: 2, preco: 200 });
    expect(bolsa.ouro).toBe(96);
    expect(bolsa.mochila.find((i) => i.itemId === 'minerio_prata')?.qtd).toBe(1);
    c.acao({ a: 'mercado', op: 'comprar', id: 'x', preco: 500 });
    expect(c.ultimo('recusa')).toEqual({ tipo: 'recusa', motivo: 'sem_ouro' });
    c.acao({ a: 'mercado', op: 'comprar', id: 'x', preco: 50 });
    expect(bolsa.ouro).toBe(46);
    const reservas = s.retirarPendencias().flatMap((p) => (p.tipo === 'mercado' ? [p.reserva] : []));
    expect(reservas).toHaveLength(2);
    expect(reservas[0]?.item).toMatchObject({ itemId: 'minerio_prata', qtd: 2 });
    expect(reservas[0]?.ouro).toBe(4);
    expect(reservas[1]).toEqual({ item: null, ouro: 50 });
    // A devolução de um pedido que falhou volta ao personagem.
    expect(s.concluirMercado('u1', { itens: [{ invId: 'z', itemId: 'minerio_prata', qtd: 2, ref: null }], ouro: 54, ouroNoBanco: 7 })).toBe(true);
    expect(bolsa.ouro).toBe(100);
    expect(bolsa.mochila.find((i) => i.itemId === 'minerio_prata')?.qtd).toBe(3);
    expect(s.concluirMercado('ninguem', { itens: [], ouro: 1, ouroNoBanco: 0 })).toBe(false);
  });
});

describe('materiais dos monstros', () => {
  it('o monstro do Mundo deixa o material da tabela do reino ao morrer', () => {
    const s = sala('regiao:campos_do_oeste');
    entrar(s, 'u1');
    const goblins = s.estado.entidades.filter((e) => e.preset === 'goblin');
    expect(goblins.length).toBeGreaterThan(0);
    // Com a chance em 100%, cada goblin morto deixa uma orelha.
    const ctx = s.ctx as { modo: { materiaisDeInimigos?: unknown } };
    ctx.modo.materiaisDeInimigos = { goblin: [{ itemId: 'orelha_de_goblin', chancePct: 100 }] };
    for (const g of goblins) g.hp = 0;
    rodar(s, 2);
    const orelhas = s.estado.objetos.filter((o) => o.tipo === 'item' && o.itemId === 'orelha_de_goblin');
    expect(orelhas.length).toBe(goblins.length);
  });
});

describe('receitas por ofício', () => {
  it('o ferreiro faz as dele; a forja da campanha e a do alquimista não valem nele', () => {
    const s = sala('regiao:vila_do_centro');
    const c = entrar(s, 'u1');
    const ferreiro = obter(s.estado.objetos.find((o) => o.tipo === 'loja' && o.ref === 'ferreiro'), 'ferreiro');
    const j = c.e();
    j.interacao = { tipo: 'loja', objetoId: ferreiro.objetoId, ateTick: 2 ** 31 - 1 };
    dar(j, 'minerio_ferro', 4);
    dar(j, 'erva_curativa', 2);
    dar(j, 'gosma_de_slime', 1);
    dar(j, 'fragmento_eco', 5);
    obter(j.bolsa, 'bolsa').ouro = 100;
    const eventos: EventoSimulacao[] = [];
    for (const r of ['anel_do_eco', 'alquimista_pocao_vida']) {
      forjar(s.estado, s.ctx, j, r, null, eventos);
      expect(eventos.at(-1)).toMatchObject({ t: 'itemRecusado', motivo: 'nao_encontrado' });
    }
    forjar(s.estado, s.ctx, j, 'ferreiro_espada_curta', null, eventos);
    expect(eventos.at(-1)).toMatchObject({ t: 'forjou', itemId: 'espada_curta' });
    expect(j.bolsa?.mochila.some((i) => i.itemId === 'minerio_ferro')).toBe(false);
  });
});

describe('a vila é refúgio', () => {
  it('o monstro no portão não entra nos muros nem ataca quem está dentro', () => {
    const s = sala('regiao:vila_do_centro');
    const c = entrar(s, 'u1');
    const vila = obter(REINO.regioes.find((r) => r.id === 'vila_do_centro')?.vila, 'vila');
    // O jogador logo dentro do portão leste; o goblin logo fora, de olho nele.
    posicionar(c.e(), vila.x + vila.raio - 2, vila.y);
    const goblin = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'g-portao', vila.x + vila.raio + 2, vila.y, BALANCE_PADRAO, { nivel: 5 });
    s.estado.entidades.push(goblin);
    const hp = c.e().hp;
    rodar(s, 600);
    const g = obter(buscarEntidade(s.estado, 'g-portao'), 'goblin');
    expect(emRefugio(s.ctx.fase, g.x, g.y)).toBe(false);
    expect(c.e().hp).toBe(hp);
    // A regra do alvo: dentro dos muros, o jogador não é alvo do goblin; fora, é. Só o monstro é barrado.
    expect(alvoOfensivoValido(s.estado, s.ctx, g, c.e())).toBe(false);
    posicionar(c.e(), vila.x + vila.raio + 3, vila.y);
    expect(alvoOfensivoValido(s.estado, s.ctx, g, c.e())).toBe(true);
    expect(barradoNoRefugio(g)).toBe(true);
    expect(barradoNoRefugio(c.e())).toBe(false);
    // Mandado à praça, o goblin para no muro (o passo para dentro não cabe). Só o movimento, sem a IA (que
    // escolheria outro rumo a cada tick).
    posicionar(g, vila.x + vila.raio + 2, vila.y);
    expect(planejarIrPara(g, { x: vila.x, y: vila.y }, s.ctx, s.estado.tick, [])).toBe(true);
    for (let i = 0; i < 300; i++) {
      integrarEntidade(g, s.estado, s.ctx, [], DT_MS);
      expect(emRefugio(s.ctx.fase, g.px, g.py)).toBe(false);
    }
    expect(Math.hypot(g.px - vila.x, g.py - vila.y)).toBeLessThan(vila.raio + 1.5);
  });
});

describe('proteção na passagem', () => {
  it('quem chega à sala fica imune a dano por passagemProtecaoS', () => {
    const s = sala('regiao:campos_do_oeste');
    const c = entrar(s, 'u1');
    const imune = () => c.e().efeitos.some((f) => f.tipo === 'imune_dano' && f.ateTick > s.estado.tick);
    expect(imune()).toBe(true);
    rodar(s, Math.ceil((BALANCE_PADRAO.mundo.passagemProtecaoS * 1000) / DT_MS) + 2);
    expect(imune()).toBe(false);
  });
});

describe('estrutura escondida', () => {
  it('é rocha comum, a porta não se desenha e quem passa perto a descobre', () => {
    const s = sala('regiao:pico_gelado');
    const c = entrar(s, 'u1');
    const regiao = obter(REINO.regioes.find((r) => r.id === 'pico_gelado'), 'pico');
    const caverna = obter(regiao.estruturas.find((e) => e.escondida), 'escondida');
    expect(tipoEm(s.ctx.fase, caverna.x + 1, caverna.y + 1)).toBe('parede');
    const porta = obter(s.estado.objetos.find((o) => o.tipo === 'porta_estrutura' && o.ref === caverna.id), 'porta');
    expect(porta.escondido).toBe(true);
    const achouCaverna = () => c.avisos().some((a) => a.tipo === 'descoberta' && a.lugar === `masmorra:${caverna.destino.id}`);
    rodar(s, 1);
    expect(achouCaverna()).toBe(false);
    posicionar(c.e(), porta.x, porta.y + 1);
    rodar(s, 1);
    expect(achouCaverna()).toBe(true);
    expect(c.ultimo('descoberta')?.nome).toBe(caverna.nome);
  });
});

describe('eventos por região', () => {
  const regras = BALANCE_PADRAO.mundo.eventos;
  /** A primeira hora (a cada minuto, a partir de AGORA) em que a região tem o evento. */
  const quandoHa = (regiao: string, perigo: Perigo, evento: EventoDaRegiao): number => {
    for (let m = 0; m < 60 * 24 * 30; m++) {
      const t = AGORA + m * 60_000;
      if (eventoDaRegiao(regiao, perigo, t, regras)?.evento === evento) return t;
    }
    throw new Error(`sem ${evento} em ${regiao}`);
  };

  it('o sorteio é igual para a mesma hora, dura o tempo da regra e a vila segura não tem lua sangrenta', () => {
    const t = quandoHa('campos_do_oeste', 'normal', 'lua_sangrenta');
    const ev = obter(eventoDaRegiao('campos_do_oeste', 'normal', t, regras), 'evento');
    expect(eventoDaRegiao('campos_do_oeste', 'normal', t, regras)).toEqual(ev);
    expect(ev.fim - t).toBeLessThanOrEqual(regras.duracaoMin * 60_000);
    expect(eventoDaRegiao('campos_do_oeste', 'normal', ev.fim, regras)).toBeNull();
    for (let m = 0; m < 60 * 24 * 10; m += 7) expect(eventoDaRegiao('vila_do_centro', 'seguro', AGORA + m * 60_000, regras)?.evento).not.toBe('lua_sangrenta');
  });

  it('a lua sangrenta multiplica o loot do modo; o mercador errante põe a loja; os dois avisam a sala', () => {
    const lua = new SalaDeTeste(REINO, obter(lerLugar(REINO, 'regiao:campos_do_oeste'), 'l'), CONTEUDO, { semente: 9, agora: () => quandoHa('campos_do_oeste', 'normal', 'lua_sangrenta') });
    const a = entrar(lua, 'u1');
    const base = lua.ctx.modo.lootPct ?? 100;
    rodar(lua, 61);
    expect(lua.ctx.modo.lootPct).toBe((base * regras.luaLootPct) / 100);
    expect(a.ultimo('evento')).toMatchObject({ evento: 'lua_sangrenta' });

    let agora = quandoHa('campos_do_oeste', 'normal', 'mercador_errante');
    const merc = new SalaDeTeste(REINO, obter(lerLugar(REINO, 'regiao:campos_do_oeste'), 'l'), CONTEUDO, { semente: 9, agora: () => agora });
    const b = entrar(merc, 'u2');
    rodar(merc, 61);
    expect(merc.estado.objetos.some((o) => o.objetoId === 'evento-mercador' && o.tipo === 'loja')).toBe(true);
    expect(b.ultimo('evento')).toMatchObject({ evento: 'mercador_errante' });
    // Acabou: a loja some e o aviso diz que acabou.
    agora = obter(eventoDaRegiao('campos_do_oeste', 'normal', agora, regras), 'ev').fim;
    rodar(merc, 61);
    expect(merc.estado.objetos.some((o) => o.objetoId === 'evento-mercador')).toBe(false);
    expect(b.ultimo('evento')).toMatchObject({ evento: null });
  });
});
