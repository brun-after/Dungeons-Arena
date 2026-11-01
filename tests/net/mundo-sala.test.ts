// Marco 29 (30/10/2026, D-128): a sala do Mundo: a entrada pela ficha reservada, o save na vila, a passagem pela
// borda, o portal, a porta da estrutura, a saída da masmorra com a recompensa, o renascer na vila salva e a gravação
// ao sair.

import { describe, expect, it } from 'vitest';
import { versaoDoConteudo, type MensagemServidor } from '../../src/arena/protocolo';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { posicionar, type Entidade } from '../../src/entities/entidade';
import type { AvisoDoMundo } from '../../src/mundo/avisos';
import { fichaNova, type FichaDoMundo } from '../../src/mundo/ficha-mundo';
import { lerLugar } from '../../src/mundo/lugares';
import { SalaMundo } from '../../src/mundo/sala-mundo';
import { portaDa, type Reino } from '../../src/mundo/reino';
import { guardarItem } from '../../src/progression/inventario';
import { CONTEUDO } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const REINO: Reino = obter(CONTEUDO.reinos.get('reino_central'), 'reino');
const relogio = 1_000_000;

function sala(lugar: string): SalaMundo {
  return new SalaMundo(REINO, obter(lerLugar(REINO, lugar), lugar), CONTEUDO, { semente: 9, agora: () => relogio });
}

function ficha(): FichaDoMundo {
  return obter(fichaNova({ conteudo: CONTEUDO, balance: BALANCE_PADRAO }, REINO, 'guerreiro', 'Tester', 'pers-0001-teste'), 'ficha');
}

function entrar(s: SalaMundo, identidade: string, f: FichaDoMundo = ficha(), chegada: { x: number; y: number } | null = null) {
  s.reservar(identidade, f, chegada);
  const recebidas: MensagemServidor[] = [];
  const conexao = s.conectar((t) => recebidas.push(JSON.parse(t) as MensagemServidor), identidade);
  conexao.receber(JSON.stringify({ t: 'entrar', nome: 'x', pedidoFicha: null, versaoConteudo: versaoDoConteudo() }));
  const bem = recebidas.find((m) => m.t === 'bemVindo');
  if (bem?.t !== 'bemVindo') throw new Error(`não entrou: ${JSON.stringify(recebidas.slice(0, 2))}`);
  const avisos = () => recebidas.flatMap((m): AvisoDoMundo[] => (m.t === 'mundo' ? [m.aviso] : []));
  const e = (): Entidade => obter(buscarEntidade(s.estado, bem.entidadeId), 'entidade');
  const enviar = (msg: unknown) => {
    conexao.receber(JSON.stringify(msg));
  };
  return { conexao, recebidas, bem, avisos, e, enviar, seq: { n: 0 } };
}

const rodar = (s: SalaMundo, n = 1) => {
  for (let i = 0; i < n; i++) s.tick(DT_MS);
};

/** Põe a entidade ao lado do objeto e interage (o comando vai pela agenda da sala). */
function interagirCom(s: SalaMundo, c: ReturnType<typeof entrar>, tipo: string) {
  const o = obter(s.estado.objetos.find((x) => x.tipo === tipo), tipo);
  posicionar(c.e(), o.x, o.y + 1);
  c.enviar({ t: 'cmd', pacote: { sessaoId: c.bem.sessaoId, seq: ++c.seq.n, epocaSala: s.epoca, tickCliente: s.estado.tick, cmd: { t: 'interagir' } } });
  rodar(s, 4);
}

describe('sala do Mundo', () => {
  it('sem ficha reservada, a entrada é recusada', () => {
    const s = sala('regiao:vila_do_centro');
    const recebidas: MensagemServidor[] = [];
    const c = s.conectar((t) => recebidas.push(JSON.parse(t) as MensagemServidor), 'ninguem');
    c.receber(JSON.stringify({ t: 'entrar', nome: 'x', pedidoFicha: { bolsa: { classeId: 'mago' } }, versaoConteudo: versaoDoConteudo() }));
    expect(recebidas).toEqual([{ t: 'erro', motivo: 'personagem_invalido' }]);
  });

  it('entra com a ficha, recebe o lugar e salva na pedra da vila', () => {
    const s = sala('regiao:vila_do_centro');
    const c = entrar(s, 'u1');
    expect(c.avisos()).toContainEqual(expect.objectContaining({ tipo: 'lugar', lugar: 'regiao:vila_do_centro', pvp: false, canal: 1 }));
    expect(c.e().nome).toBe('Tester');
    interagirCom(s, c, 'pedra_save');
    expect(c.avisos()).toContainEqual({ tipo: 'salvo', vila: 'vila_do_centro' });
    expect(s.retirarPendencias()).toContainEqual(expect.objectContaining({ tipo: 'gravar', identidade: 'u1' }));
  });

  it('a região perigosa liga o PvP', () => {
    const s = sala('regiao:ruinas_do_norte');
    expect(s.ctx.modo.fogoAmigo).toBe(true);
    expect(sala('regiao:campos_do_oeste').ctx.modo.fogoAmigo).toBe(false);
  });

  it('a passagem pela borda troca para a vizinha, chegando do lado oposto', () => {
    const s = sala('regiao:vila_do_centro');
    const c = entrar(s, 'u1');
    const meio = (REINO.regioes.find(r => r.id === 'vila_do_centro')?.tamanho ?? REINO.tamanhoRegiao) / 2;
    posicionar(c.e(), 0, meio);
    rodar(s);
    const p = s.retirarPendencias().find((x) => x.tipo === 'trocar');
    expect(p).toMatchObject({ tipo: 'trocar', destino: 'regiao:campos_do_oeste', chegada: { x: (REINO.regioes.find(r => r.id === 'campos_do_oeste')?.tamanho ?? REINO.tamanhoRegiao) - 3, y: (REINO.regioes.find(r => r.id === 'campos_do_oeste')?.tamanho ?? REINO.tamanhoRegiao) / 2 } });
    s.despedir(c.bem.sessaoId, { tipo: 'trocarSala', lugar: 'regiao:campos_do_oeste', bilhete: 'b', instancia: null });
    expect(s.jogadores).toBe(0);
    // A troca não grava de novo (a ficha seguiu com a pendência).
    expect(s.retirarPendencias()).toEqual([]);
  });

  it('o portal pago leva à vila descoberta, cobra ouro e arma a recarga', () => {
    const s = sala('regiao:vila_do_centro');
    const f = ficha();
    f.descobertas.push('regiao:encosta_do_leste');
    const c = entrar(s, 'u1', f);
    const bolsa = obter(c.e().bolsa, 'bolsa');
    bolsa.ouro = 500;
    interagirCom(s, c, 'pedra_portal');
    expect(c.avisos()).toContainEqual(expect.objectContaining({ tipo: 'portais', destinos: [expect.objectContaining({ regiao: 'encosta_do_leste' })] }));
    c.enviar({ t: 'viajar', destino: 'pico_gelado', pagamento: 'ouro' });
    expect(c.avisos()).toContainEqual({ tipo: 'recusa', motivo: 'destino_invalido' });
    c.enviar({ t: 'viajar', destino: 'encosta_do_leste', pagamento: 'ouro' });
    const custo = BALANCE_PADRAO.mundo.portal.ouroBase + BALANCE_PADRAO.mundo.portal.ouroPorRegiao;
    expect(bolsa.ouro).toBe(500 - custo);
    const troca = s.retirarPendencias().find((x) => x.tipo === 'trocar');
    expect(troca).toMatchObject({ destino: 'regiao:encosta_do_leste' });
    expect(troca?.ficha.portalLivreEm).toBe(relogio + BALANCE_PADRAO.mundo.portal.recargaS * 1000);
  });

  it('sem ter descoberto, o portal recusa; o pergaminho de retorno vale longe da pedra', () => {
    const s = sala('regiao:campos_do_oeste');
    const c = entrar(s, 'u1');
    c.enviar({ t: 'viajar', destino: 'encosta_do_leste', pagamento: 'ouro' });
    expect(c.avisos()).toContainEqual({ tipo: 'recusa', motivo: 'nao_descoberto' });
    const bolsa = obter(c.e().bolsa, 'bolsa');
    expect(guardarItem(bolsa, obter(CONTEUDO.itens.get('pergaminho_retorno'), 'pergaminho'), 1, BALANCE_PADRAO.inventario)).toBe(true);
    c.enviar({ t: 'viajar', destino: 'vila_do_centro', pagamento: 'pergaminho' });
    expect(bolsa.mochila.some((m) => m.itemId === 'pergaminho_retorno')).toBe(false);
    expect(s.retirarPendencias().find((x) => x.tipo === 'trocar')).toMatchObject({ destino: 'regiao:vila_do_centro' });
  });

  it('a porta da estrutura leva à masmorra instanciada; a saída aberta volta à porta com a recompensa', () => {
    const s = sala('regiao:campos_do_oeste');
    const c = entrar(s, 'u1');
    interagirCom(s, c, 'porta_estrutura');
    const ida = s.retirarPendencias().find((x) => x.tipo === 'trocar');
    expect(ida).toMatchObject({ destino: 'masmorra:toca_dos_goblins' });
    expect(ida?.instancia).toMatch(/^u1:/);
    expect(ida?.ficha.descobertas).toContain('masmorra:toca_dos_goblins');

    const dentro = sala('masmorra:toca_dos_goblins');
    expect(dentro.ctx.modo.tumuloNaMorte).toBe(false);
    const d = entrar(dentro, 'u1', obter(ida, 'ida').ficha);
    // O chefe cai e a saída abre.
    for (const e of dentro.estado.entidades) if (e.controlador === 'ia') e.hp = 0;
    rodar(dentro, 2);
    const saida = obter(dentro.ctx.fase.portaSaida, 'porta de saída');
    posicionar(d.e(), saida.x, saida.y);
    rodar(dentro, 2);
    const volta = dentro.retirarPendencias().find((x) => x.tipo === 'trocar');
    const estrutura = obter(REINO.regioes.find((r) => r.id === 'campos_do_oeste')?.estruturas[0], 'estrutura');
    expect(volta).toMatchObject({ destino: 'regiao:campos_do_oeste', chegada: portaDa(estrutura).frente });
    expect(d.avisos()).toContainEqual(expect.objectContaining({ tipo: 'recompensa', nome: 'Toca dos Goblins' }));
    expect(volta?.ficha.personagem.bolsa.mochila.some((m) => m.itemId === 'pergaminho_retorno')).toBe(true);
    expect(volta?.ficha.recargas.toca_dos_goblins).toBeGreaterThan(relogio);
  });

  it('o covil é gerado com o chefe do reino e conta como fora de dungeon', () => {
    const s = sala('covil:minas_do_rei_goblin');
    expect(s.ctx.modo.tumuloNaMorte).toBe(true);
    expect(s.estado.entidades.some((e) => e.preset === 'rei_goblin')).toBe(true);
  });

  it('morrer fora de dungeon deixa o túmulo e renasce na vila salva', () => {
    const s = sala('regiao:campos_do_oeste');
    const c = entrar(s, 'u1');
    c.e().hp = 0;
    rodar(s, 2);
    expect(s.estado.objetos.some((o) => o.tipo === 'tumulo')).toBe(true);
    rodar(s, 400);
    expect(s.retirarPendencias().find((x) => x.tipo === 'trocar')).toMatchObject({ destino: 'regiao:vila_do_centro' });
  });

  it('sair do jogo grava a ficha', () => {
    const s = sala('regiao:vila_do_centro');
    const c = entrar(s, 'u1');
    obter(c.e().bolsa, 'bolsa').ouro = 77;
    rodar(s, 3);
    c.conexao.encerrar();
    const g = s.retirarPendencias().find((x) => x.tipo === 'gravar');
    expect(g?.ficha.personagem.bolsa.ouro).toBe(77);
  });
});


it('retorna à vila salva na mesma região e não consome duas pedras em pedidos repetidos', () => {
  const s = sala('regiao:vila_do_centro');
  const c = entrar(s, 'retorno');
  const bolsa = obter(c.e().bolsa, 'bolsa');
  guardarItem(bolsa, obter(CONTEUDO.itens.get('pergaminho_retorno'), 'pedra'), 2, BALANCE_PADRAO.inventario);
  posicionar(c.e(), 40, 40);
  c.enviar({ t: 'viajar', destino: 'ultima_vila_salva', pagamento: 'pergaminho' });
  c.enviar({ t: 'viajar', destino: 'ultima_vila_salva', pagamento: 'pergaminho' });
  expect(bolsa.mochila.find(m => m.itemId === 'pergaminho_retorno')?.qtd).toBe(1);
  expect(s.retirarPendencias().filter(x => x.tipo === 'trocar')).toEqual([expect.objectContaining({ destino: 'regiao:vila_do_centro', chegada: null })]);
});
