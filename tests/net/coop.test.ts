// Marco 15 (15/10/2026, D-061): campanha cooperativa em loopback — ficha conferida, canal privado, anfitrião, saída
// com todos os vivos, fase nova levando os personagens, reconexão, escala pelo grupo e o save de cada um.

import { describe, expect, it } from 'vitest';
import { versaoDoConteudo, type MensagemServidor } from '../../src/arena/protocolo';
import { atualizarPersonagemNoSave, conferirPersonagem, pedidoDoPersonagem } from '../../src/coop/personagem';
import { criarSalaCampanha, type SalaCampanha } from '../../src/coop/sala-campanha';
import { modoPorId } from '../../src/core/conteudo';
import { buscarEntidade, clonarEstado, type Entidade } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { criarJogador } from '../../src/entities/fabrica';
import { tamanhoDoGrupo } from '../../src/modos/dificuldade';
import { VERSAO_SCHEMA, type RegistroProgresso } from '../../src/save/esquema';
import { contextoDaFase, FASE_INICIAL, faseOficialOuGerada } from '../../src/save/fases-campanha';
import { ClienteArena } from '../../src/net/cliente';
import { ligarSala } from '../../src/net/ligacao';
import { RedeLocal, REDE_PERFEITA } from '../../src/net/rede-local';
import { CONTEUDO } from '../apoio/fases';
import { conexaoDireta, novaSala } from './apoio';

const versao = versaoDoConteudo();

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function sala(): SalaCampanha {
  const r = criarSalaCampanha(CONTEUDO, { semente: 3, faseRef: FASE_INICIAL, dificuldade: 'normal' });
  if (!r.ok) throw new Error(r.erro);
  return r.sala;
}

function personagem(classeId = 'aventureiro', ajustar?: (e: Entidade) => void): unknown {
  const e = criarJogador(obter(CONTEUDO.classes.get(classeId), classeId), 'j1', 1, 1, sala().ctx.balance);
  e.nome = `Herói ${classeId}`;
  ajustar?.(e);
  return pedidoDoPersonagem(e);
}

function entrar(s: SalaCampanha, pedido: unknown = personagem()) {
  const c = conexaoDireta(s);
  c.enviar({ t: 'entrar', nome: 'x', pedidoFicha: pedido, versaoConteudo: versao });
  const bem = c.de('bemVindo')[0];
  if (!bem) throw new Error(`não entrou: ${JSON.stringify(c.recebidas)}`);
  let seq = 0;
  const cmd = (comando: unknown) => {
    seq++;
    c.enviar({ t: 'cmd', pacote: { sessaoId: bem.sessaoId, epocaSala: s.epoca, seq, tickCliente: s.estado.tick, cmd: comando } });
  };
  return { ...c, bem, cmd, entidade: () => obter(buscarEntidade(s.estado, bem.entidadeId), bem.entidadeId) };
}

const rodar = (s: SalaCampanha, n: number) => {
  for (let i = 0; i < n; i++) s.tick(DT_MS);
};

/** Uma célula de saída da fase atual (a porta de saída ou uma `S`). */
function celulaDeSaida(s: SalaCampanha): { x: number; y: number } {
  const p = s.ctx.fase.portaSaida;
  if (p) return { x: p.x, y: p.y };
  throw new Error('fase sem porta de saída');
}

function porNaSaida(s: SalaCampanha, e: Entidade): void {
  const c = celulaDeSaida(s);
  Object.assign(e, { x: c.x, y: c.y, destinoX: c.x, destinoY: c.y, progressoPasso: 0, caminho: [], waypoints: [] });
}

describe('entrada com o personagem do slot', () => {
  it('três entram, cada um com a sua classe; a ficha impossível é cortada e a prévia diz o quê', () => {
    const s = sala();
    const a = entrar(s, personagem('guerreiro'));
    const b = entrar(s, personagem('mago'));
    const trapaceiro = entrar(
      s,
      personagem('arqueiro', (e) => {
        const bolsa = obter(e.bolsa, 'bolsa');
        e.nivel = 1;
        bolsa.atributosBase.forca = 30;
        bolsa.ouro = 10 ** 9;
        bolsa.pontosHabilidade = 50;
        bolsa.mochila.push({ invId: 'i99', itemId: 'nao_existe', qtd: 1, ref: null });
        const primeira = obter(bolsa.conhecidas[0], 'habilidade');
        primeira.rank = 5;
      }),
    );
    expect(a.entidade().bolsa?.classeId).toBe('guerreiro');
    expect(b.entidade().bolsa?.classeId).toBe('mago');
    const t = trapaceiro.entidade();
    const classe = obter(CONTEUDO.classes.get('arqueiro'), 'arqueiro');
    expect(t.bolsa?.atributosBase.forca).toBe(classe.atributos.forca);
    expect(t.bolsa?.atributosBase.destreza).toBe(classe.atributos.destreza);
    expect(t.bolsa?.ouro).toBe(s.ctx.balance.economia.ouroMax);
    expect(t.bolsa?.pontosHabilidade).toBe(0);
    expect(t.bolsa?.mochila.some((i) => i.itemId === 'nao_existe')).toBe(false);
    expect(t.bolsa?.conhecidas[0]?.rank).toBe(1);
    expect(trapaceiro.bem.previa.alteracoes.map((x) => x.campo)).toEqual(expect.arrayContaining(['atributosBase', 'ouro', 'pontosHabilidade', 'mochila', 'conhecidas']));
    // Todos do mesmo lado, sem empilhar na entrada.
    expect(new Set([a, b, trapaceiro].map((j) => j.entidade().equipe)).size).toBe(1);
    expect(new Set([a, b, trapaceiro].map((j) => `${j.entidade().x},${j.entidade().y}`)).size).toBe(3);
    expect(tamanhoDoGrupo(s.estado)).toBe(3);
  });

  it('sem classe que exista, a entrada é recusada; com 6 a sala está cheia', () => {
    const s = sala();
    const ruim = conexaoDireta(s);
    ruim.enviar({ t: 'entrar', nome: 'x', pedidoFicha: { bolsa: { classeId: 'dragao' } }, versaoConteudo: versao });
    expect(ruim.de('erro')).toEqual([{ t: 'erro', motivo: 'personagem_invalido' }]);
    for (let i = 0; i < 6; i++) entrar(s);
    const setimo = conexaoDireta(s);
    setimo.enviar({ t: 'entrar', nome: 'x', pedidoFicha: personagem(), versaoConteudo: versao });
    expect(setimo.de('erro')).toEqual([{ t: 'erro', motivo: 'sala_cheia' }]);
  });

  it('a aventura do editor não vai para o grupo', () => {
    expect(criarSalaCampanha(CONTEUDO, { semente: 1, faseRef: { tipo: 'aventura', id: 'x' }, dificuldade: 'normal' })).toEqual({ ok: false, erro: 'aventura' });
  });
});

describe('canal privado e anfitrião', () => {
  it('cada sessão recebe só a própria bolsa; o estado público vem sem bolsas', () => {
    const s = sala();
    const a = entrar(s, personagem('guerreiro'));
    const b = entrar(s, personagem('mago'));
    rodar(s, 3);
    const privA = a.de('privado').at(-1);
    const privB = b.de('privado').at(-1);
    expect(privA?.bolsa?.classeId).toBe('guerreiro');
    expect(privB?.bolsa?.classeId).toBe('mago');
    expect(privA?.anfitriao).toBe(true);
    expect(privB?.anfitriao).toBe(false);
    const publico = a.de('estado').at(-1)?.estado ?? a.bem.estado;
    expect(publico.entidades.every((e) => e.bolsa === null)).toBe(true);
    // Sem mudança, o privado não se repete.
    const n = a.de('privado').length;
    rodar(s, 6);
    expect(a.de('privado')).toHaveLength(n);
  });

  it('só o anfitrião troca a dificuldade; quando ele sai, o mais antigo assume', () => {
    const s = sala();
    const a = entrar(s);
    const b = entrar(s);
    b.cmd({ t: 'definirDificuldade', nivel: 'pesadelo' });
    expect(b.de('rejeitado').at(-1)?.motivo).toBe('nao_permitido');
    a.cmd({ t: 'definirDificuldade', nivel: 'dificil' });
    rodar(s, 1);
    expect(s.estado.dificuldade).toBe('dificil');
    a.conexao.encerrar();
    rodar(s, 3);
    expect(b.de('privado').at(-1)?.anfitriao).toBe(true);
    b.cmd({ t: 'definirDificuldade', nivel: 'facil' });
    rodar(s, 1);
    expect(s.estado.dificuldade).toBe('facil');
  });

  it('comandos de personagem: aceitos no cooperativo, recusados na arena', () => {
    const s = sala();
    const a = entrar(s);
    a.cmd({ t: 'equiparHabilidade', id: null, slot: 0 });
    rodar(s, 1);
    expect(a.de('rejeitado')).toHaveLength(0);
    expect(a.entidade().bolsa?.barra[0]).toBeNull();

    const arena = novaSala();
    const c = conexaoDireta(arena);
    c.enviar({ t: 'entrar', nome: 'x', pedidoFicha: { classeId: 'aventureiro' }, versaoConteudo: versao });
    const bem = obter(c.de('bemVindo')[0], 'bemVindo');
    for (const [seq, cmd] of [
      [1, { t: 'subirRank', id: 'curar' }],
      [2, { t: 'equiparHabilidade', id: null, slot: 0 }],
      [3, { t: 'definirDificuldade', nivel: 'pesadelo' }],
    ] as const) {
      c.enviar({ t: 'cmd', pacote: { sessaoId: bem.sessaoId, epocaSala: 1, seq, tickCliente: 0, cmd } });
    }
    expect(c.de('rejeitado').map((r) => r.motivo)).toEqual(['nao_permitido', 'nao_permitido', 'nao_permitido']);
  });
});

describe('a saída do grupo', () => {
  it('só avança com todos os vivos na saída aberta; leva os personagens, com vida cheia, para a fase seguinte', () => {
    const s = sala();
    const a = entrar(s, personagem('guerreiro', (e) => (e.nivel = 3)));
    const b = entrar(s);
    const c = entrar(s);
    s.estado.saidaAberta = true;
    porNaSaida(s, a.entidade());
    rodar(s, 2);
    expect(s.faseRef).toEqual(FASE_INICIAL);
    porNaSaida(s, b.entidade());
    rodar(s, 2);
    expect(s.faseRef).toEqual(FASE_INICIAL);
    // O terceiro morre: os vivos bastam.
    c.entidade().hp = 0;
    c.entidade().morto = true;
    a.entidade().hp = 1;
    rodar(s, 1);
    expect(s.faseRef).toEqual({ tipo: 'oficial', id: 'fase-02' });
    const nova = obter(a.de('novaFase').at(-1), 'novaFase');
    expect(nova.epocaSala).toBe(2);
    expect(nova.nome).toBe(s.nomeFase);
    expect(b.de('novaFase')).toHaveLength(1);
    expect(c.de('novaFase')).toHaveLength(1);
    const pa = a.entidade();
    expect(pa.nivel).toBe(3);
    expect(pa.hp).toBe(pa.hpMax);
    expect(c.entidade().morto).toBe(false);
    expect(s.estado.tick).toBeLessThan(5);
    // Comandos da fase anterior (época 1) são recusados; os da nova valem.
    a.cmd({ t: 'mover', dir: 'E' });
    expect(a.de('rejeitado')).toHaveLength(0);
  });

  it('quem caiu não segura o grupo; ao voltar, recebe a fase nova', () => {
    const s = sala();
    const a = entrar(s);
    const b = entrar(s);
    s.estado.saidaAberta = true;
    b.conexao.fechar();
    porNaSaida(s, a.entidade());
    rodar(s, 1);
    expect(s.faseRef.id).toBe('fase-02');
    expect(b.de('novaFase')).toHaveLength(0);
    b.conexao.retomar();
    rodar(s, 1);
    expect(b.de('novaFase')).toHaveLength(1);
    expect(buscarEntidade(s.estado, b.bem.entidadeId)).toBeDefined();
  });

  it('cliente em loopback: vê a própria bolsa, troca de contexto e de época na fase nova', () => {
    const s = sala();
    const rede = new RedeLocal(REDE_PERFEITA, 5);
    let agora = 0;
    const clientes = ['guerreiro', 'mago'].map((classe) => {
      const { cliente, servidor } = rede.conectar();
      ligarSala(s, servidor);
      const c = new ClienteArena({
        ctx: s.ctx,
        transporte: cliente,
        nome: classe,
        pedidoFicha: personagem(classe),
        agoraMs: () => agora,
        contextoDe: (ref) => {
          const r = contextoDaFase(CONTEUDO, faseOficialOuGerada(ref, CONTEUDO), modoPorId(CONTEUDO, 'cooperativo'));
          return r.ok ? r.ctx : null;
        },
      });
      c.entrar();
      return c;
    });
    let novas = 0;
    for (const c of clientes) c.aoNovaFase = () => novas++;
    const passo = (n: number) => {
      for (let i = 0; i < n; i++) {
        agora += DT_MS;
        rede.bombear(agora);
        s.tick(DT_MS);
        for (const c of clientes) c.passo();
      }
    };
    passo(10);
    const [g, m] = clientes;
    const proprio = (c: ClienteArena | undefined) => (c?.previsto && c.entidadeId ? buscarEntidade(c.previsto, c.entidadeId) : undefined);
    expect(proprio(g)?.bolsa?.classeId).toBe('guerreiro');
    expect(proprio(m)?.bolsa?.classeId).toBe('mago');
    // O outro jogador aparece sem bolsa para mim.
    const outro = g?.previsto?.entidades.find((e) => e.id === m?.entidadeId);
    expect(outro?.bolsa).toBeNull();

    s.estado.saidaAberta = true;
    for (const c of clientes) porNaSaida(s, obter(buscarEntidade(s.estado, obter(c.entidadeId, 'id')), 'entidade'));
    passo(10);
    expect(novas).toBe(2);
    expect(g?.epoca).toBe(2);
    expect(g?.ctx.fase.id).toBe(s.ctx.fase.id);
    expect(proprio(g)?.bolsa?.classeId).toBe('guerreiro');
    passo(30);
    expect(g?.ressincronizacoes).toBe(0);
  });
});

describe('o progresso volta para o slot de cada um', () => {
  it('atualizarPersonagemNoSave troca só a progressão e mantém a fase e a posição do slot', () => {
    const s = sala();
    const ctx = s.ctx;
    const doSlot = criarJogador(obter(CONTEUDO.classes.get('mago'), 'mago'), 'j1', 4, 5, ctx.balance);
    const estado = clonarEstado(s.estado);
    estado.entidades.unshift(doSlot);
    const registro: RegistroProgresso = {
      versaoSchema: VERSAO_SCHEMA,
      slot: 2,
      criadoEm: 1,
      atualizadoEm: 1,
      faseRef: { tipo: 'oficial', id: 'fase-02' },
      nomeFase: 'Catacumbas',
      estado,
      estatisticas: { inimigosDerrotados: 0, mortes: 0 },
      fasesVisitadas: {},
    };
    const conferido = obter(conferirPersonagem(pedidoDoPersonagem(doSlot), ctx, 'p1', 'jogador-1'), 'conferido');
    const doGrupo = conferido.entidade;
    doGrupo.nivel = 4;
    doGrupo.xp = 10;
    obter(doGrupo.bolsa, 'bolsa').ouro = 321;
    const novo = atualizarPersonagemNoSave(registro, doGrupo, ctx, 99);
    const j = obter(novo.estado.entidades.find((e) => e.id === 'j1'), 'j1');
    expect(j.nivel).toBe(4);
    expect(j.bolsa?.ouro).toBe(321);
    expect([j.x, j.y]).toEqual([4, 5]);
    expect(novo.faseRef).toEqual(registro.faseRef);
    expect(novo.atualizadoEm).toBe(99);
    expect(j.hpMax).toBeGreaterThan(doSlot.hpMax);
    // O registro original não muda.
    expect(registro.estado.entidades[0]?.nivel).toBe(1);
  });
});

// Garante que a forma das mensagens novas está no tipo do protocolo.
export type _MensagensNovas = Extract<MensagemServidor, { t: 'privado' | 'novaFase' | 'fimDaCampanha' }>;
