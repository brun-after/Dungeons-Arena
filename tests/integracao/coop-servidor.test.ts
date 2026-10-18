// Marco 15 (15/10/2026, D-061): a campanha cooperativa pelo servidor real (Colyseus + WebSocket) — o anfitrião cria
// o grupo, o convidado entra pelo código, cada um vê só a própria bolsa e o código de uma arena não vira grupo.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pedidoDoPersonagem } from '../../src/coop/personagem';
import { MODO_COOPERATIVO } from '../../src/coop/sala-campanha';
import { conteudoOficial, modoPorId } from '../../src/core/conteudo';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { criarJogador } from '../../src/entities/fabrica';
import { ClienteArena } from '../../src/net/cliente';
import { conectarArena, conectarCampanha, type PedidoDeGrupo } from '../../src/plataforma/transporte-colyseus';
import { contextoDaFase, FASE_INICIAL, faseOficialOuGerada } from '../../src/save/fases-campanha';
import type { RefFase } from '../../src/save/esquema';
import { iniciarServidor } from '../../server/servidor';

const conteudo = conteudoOficial();
let porta = 0;
let encerrar: () => Promise<void> = () => Promise.resolve();
const url = () => `ws://localhost:${porta}`;

beforeAll(async () => {
  const s = await iniciarServidor({ porta: 0, regiao: 'teste' });
  porta = s.porta;
  encerrar = s.encerrar;
});

afterAll(async () => {
  await encerrar();
});

function contextoDe(ref: RefFase) {
  const r = contextoDaFase(conteudo, faseOficialOuGerada(ref, conteudo), modoPorId(conteudo, MODO_COOPERATIVO));
  if (!r.ok) throw new Error(r.erro);
  return r.ctx;
}

async function membro(pedido: PedidoDeGrupo, classeId: string) {
  const conexao = await conectarCampanha(url(), pedido);
  const classe = conteudo.classes.get(classeId);
  if (!classe) throw new Error(classeId);
  const cliente = new ClienteArena({
    ctx: contextoDe(conexao.faseRef),
    transporte: conexao.transporte,
    nome: classeId,
    pedidoFicha: pedidoDoPersonagem(criarJogador(classe, 'j1', 1, 1, BALANCE_PADRAO)),
    agoraMs: () => performance.now(),
    contextoDe,
  });
  cliente.entrar();
  return { conexao, cliente };
}

async function jogar(ms: number, clientes: ClienteArena[]): Promise<void> {
  await new Promise<void>((resolver) => {
    const intervalo = setInterval(() => {
      for (const c of clientes) c.passo();
    }, DT_MS);
    setTimeout(() => {
      clearInterval(intervalo);
      resolver();
    }, ms);
  });
}

async function esperar(condicao: () => boolean, ms = 5000): Promise<void> {
  const inicio = Date.now();
  while (!condicao()) {
    if (Date.now() - inicio > ms) throw new Error('condição não atingida a tempo');
    await new Promise((r) => setTimeout(r, 20));
  }
}

describe('campanha cooperativa no servidor real', () => {
  it('o anfitrião cria, o convidado entra pelo código; cada um vê o outro e só a própria bolsa', async () => {
    const a = await membro({ criar: { faseRef: FASE_INICIAL, dificuldade: 'dificil' } }, 'necromante');
    const info = (await (await fetch(`http://localhost:${porta}/salas/${a.conexao.codigo}`)).json()) as Record<string, unknown>;
    expect(info).toMatchObject({ tipo: 'campanha', fase: 'oficial:fase-01', faseRef: FASE_INICIAL, maxJogadores: 6 });
    const b = await membro({ codigo: a.conexao.codigo }, 'mago');
    await esperar(() => a.cliente.conectado && b.cliente.conectado && a.cliente.bolsaPropria !== null && b.cliente.bolsaPropria !== null);
    await jogar(500, [a.cliente, b.cliente]);
    expect(a.cliente.anfitriao).toBe(true);
    expect(b.cliente.anfitriao).toBe(false);
    expect(a.cliente.bolsaPropria?.classeId).toBe('necromante');
    expect(b.cliente.previsto?.entidades.some((e) => e.invocacao?.donoId === a.cliente.entidadeId && e.invocacao.necromancia === 'servo')).toBe(true);
    expect(b.cliente.bolsaPropria?.classeId).toBe('mago');
    const outroEmA = a.cliente.previsto && b.cliente.entidadeId ? buscarEntidade(a.cliente.previsto, b.cliente.entidadeId) : undefined;
    expect(outroEmA?.bolsa).toBeNull();
    expect(a.cliente.previsto?.dificuldade).toBe('dificil');
    const pocao = a.cliente.bolsaPropria?.mochila.find((i) => i.itemId === 'pocao_vida');
    if (!pocao) throw new Error('Poção inicial ausente');
    const qtdAntes = b.cliente.bolsaPropria?.mochila.find((i) => i.itemId === 'pocao_vida')?.qtd ?? 0;
    a.cliente.enviarComando({ t: 'soltarItem', invId: pocao.invId, qtd: 1 });
    await jogar(400, [a.cliente, b.cliente]);
    const drop = b.cliente.previsto?.objetos.find((o) => o.itemId === 'pocao_vida' && o.aguardaSaidaDe === a.cliente.entidadeId);
    if (!drop) throw new Error('Drop não chegou ao aliado');
    a.cliente.enviarComando({ t: 'irPara', x: drop.x, y: drop.y - 2 });
    await jogar(900, [a.cliente, b.cliente]);
    b.cliente.enviarComando({ t: 'irPara', x: drop.x, y: drop.y });
    await jogar(1200, [a.cliente, b.cliente]);
    expect(b.cliente.bolsaPropria?.mochila.find((i) => i.itemId === 'pocao_vida')?.qtd).toBe(qtdAntes + 1);
    expect(a.cliente.previsto?.objetos.some((o) => o.objetoId === drop.objetoId)).toBe(false);
    a.conexao.transporte.fechar();
    b.conexao.transporte.fechar();
  });

  it('o código de uma arena não serve para entrar num grupo', async () => {
    const arena = await conectarArena(url(), { criar: true });
    await expect(conectarCampanha(url(), { codigo: arena.codigo })).rejects.toThrow('nao_e_grupo');
    arena.transporte.fechar();
  });
});
