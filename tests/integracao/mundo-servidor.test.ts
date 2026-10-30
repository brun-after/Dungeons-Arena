// Marco 29 (30/10/2026, D-128): o Mundo pelo servidor real, com a persistência em memória (a conta `local:` dos
// testes): criar o personagem na vila de início, a lista da conta, a troca de sala pelo bilhete ao passar pela
// borda, a recusa de quem entra fora da vila salva e a ficha gravada ao sair.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { MensagemServidor } from '../../src/arena/protocolo';
import { versaoDoConteudo } from '../../src/arena/protocolo';
import type { AvisoDoMundo } from '../../src/mundo/avisos';
import { conectarMundo, personagensDoMundo } from '../../src/plataforma/transporte-colyseus';
import { SalaMundoColyseus } from '../../server/salas/sala-mundo';
import { iniciarServidor } from '../../server/servidor';

let porta = 0;
let encerrar: () => Promise<void> = () => Promise.resolve();
const url = () => `ws://localhost:${String(porta)}`;

beforeAll(async () => {
  const s = await iniciarServidor({ porta: 0, regiao: 'teste' });
  porta = s.porta;
  encerrar = s.encerrar;
});

afterAll(async () => {
  await encerrar();
});

async function esperar<T>(achar: () => T | undefined, ms = 5000): Promise<T> {
  const inicio = Date.now();
  for (;;) {
    const v = achar();
    if (v !== undefined) return v;
    if (Date.now() - inicio > ms) throw new Error('condição não atingida a tempo');
    await new Promise((r) => setTimeout(r, 20));
  }
}

async function entrarNoLugar(token: string, pedido: Parameters<typeof conectarMundo>[2]) {
  const conexao = await conectarMundo(url(), token, pedido);
  const recebidas: MensagemServidor[] = [];
  conexao.transporte.aoReceber((t) => recebidas.push(JSON.parse(t) as MensagemServidor));
  conexao.transporte.enviar(JSON.stringify({ t: 'entrar', nome: 'x', pedidoFicha: null, versaoConteudo: versaoDoConteudo() }));
  const bem = await esperar(() => recebidas.find((m) => m.t === 'bemVindo' || m.t === 'erro'));
  if (bem.t !== 'bemVindo') throw new Error(JSON.stringify(bem));
  const aviso = <T extends AvisoDoMundo['tipo']>(tipo: T) =>
    recebidas.flatMap((m) => (m.t === 'mundo' && m.aviso.tipo === tipo ? [m.aviso as Extract<AvisoDoMundo, { tipo: T }>] : []))[0];
  return { conexao, recebidas, bem, aviso };
}

describe('Mundo (servidor real)', () => {
  it('cria o personagem na vila, lista na conta e não deixa entrar duas vezes', async () => {
    const token = 'local:conta-a';
    const a = await entrarNoLugar(token, { lugar: 'regiao:vila_do_centro', slot: 1, criar: { classeId: 'mago', nome: 'Merlin' } });
    expect(a.aviso('lugar')).toMatchObject({ lugar: 'regiao:vila_do_centro', canal: 1 });
    const lista = await personagensDoMundo(url(), token);
    expect(lista).toEqual([expect.objectContaining({ slot: 1, nome: 'Merlin', classeId: 'mago', vilaSalva: 'vila_do_centro' })]);
    await expect(conectarMundo(url(), token, { lugar: 'regiao:vila_do_centro', slot: 1 })).rejects.toThrow();
    await a.conexao.encerrar();
  });

  it('dois personagens na mesma região caem na mesma sala (o canal 1)', async () => {
    const x = await entrarNoLugar('local:conta-x', { lugar: 'regiao:vila_do_centro', slot: 1, criar: { classeId: 'mago', nome: 'X' } });
    const y = await entrarNoLugar('local:conta-y', { lugar: 'regiao:vila_do_centro', slot: 1, criar: { classeId: 'guerreiro', nome: 'Y' } });
    expect(y.conexao.codigo).toBe(x.conexao.codigo);
    await x.conexao.encerrar();
    await y.conexao.encerrar();
  });

  it('sem conta, o servidor recusa; fora da vila salva também', async () => {
    await expect(conectarMundo(url(), 'token-qualquer', { lugar: 'regiao:vila_do_centro', slot: 1 })).rejects.toThrow();
    const token = 'local:conta-b';
    const b = await entrarNoLugar(token, { lugar: 'regiao:vila_do_centro', slot: 2, criar: { classeId: 'guerreiro', nome: 'B' } });
    await b.conexao.encerrar();
    await new Promise((r) => setTimeout(r, 300));
    await expect(conectarMundo(url(), token, { lugar: 'regiao:campos_do_oeste', slot: 2 })).rejects.toThrow(/fora_da_vila_salva/);
  });

  it('a página recarregada assume o personagem da sessão caída, sem esperar a reserva de reconexão', async () => {
    const token = 'local:conta-d';
    const a = await entrarNoLugar(token, { lugar: 'regiao:vila_do_centro', slot: 1, criar: { classeId: 'mago', nome: 'Volta' } });
    a.conexao.derrubar(true);
    await new Promise((r) => setTimeout(r, 300));
    const b = await entrarNoLugar(token, { lugar: 'regiao:vila_do_centro', slot: 1 });
    expect(b.aviso('lugar')).toMatchObject({ lugar: 'regiao:vila_do_centro' });
    // Com a sessão nova ativa, uma terceira entrada continua recusada.
    await expect(conectarMundo(url(), token, { lugar: 'regiao:vila_do_centro', slot: 1 })).rejects.toThrow(/ja_jogando/);
    await b.conexao.encerrar();
  });

  it('o portal recusa o destino não descoberto; o bilhete leva a ficha para outra sala, uma vez só', async () => {
    const token = 'local:conta-c';
    const c = await entrarNoLugar(token, { lugar: 'regiao:vila_do_centro', slot: 1, criar: { classeId: 'arqueiro', nome: 'Robin' } });
    c.conexao.transporte.enviar(JSON.stringify({ t: 'viajar', destino: 'encosta_do_leste', pagamento: 'pergaminho' }));
    expect(await esperar(() => c.aviso('recusa'))).toEqual({ tipo: 'recusa', motivo: 'nao_descoberto' });
    await c.conexao.encerrar();
    await new Promise((r) => setTimeout(r, 300));
    // A troca de sala: o coordenador emite o bilhete (como a passagem pela borda faria) e o cliente entra com ele.
    const coord = SalaMundoColyseus.coordenador;
    if (!coord) throw new Error('sem coordenador');
    const ficha = await coord.persistencia.carregar(token, 1);
    if (!ficha) throw new Error('sem ficha');
    const bilhete = coord.emitir({ conta: token, slot: 1, ficha, lugar: 'regiao:campos_do_oeste', chegada: { x: 125, y: 64 }, instancia: null });
    const d = await entrarNoLugar(token, { lugar: 'regiao:campos_do_oeste', bilhete });
    expect(d.aviso('lugar')).toMatchObject({ lugar: 'regiao:campos_do_oeste' });
    expect(d.aviso('descoberta')).toMatchObject({ lugar: 'regiao:campos_do_oeste' });
    await d.conexao.encerrar();
    await new Promise((r) => setTimeout(r, 300));
    await expect(conectarMundo(url(), token, { lugar: 'regiao:campos_do_oeste', bilhete })).rejects.toThrow(/bilhete_invalido/);
    // Ao sair, a descoberta foi gravada.
    expect((await coord.persistencia.carregar(token, 1))?.descobertas).toContain('regiao:campos_do_oeste');
  });
});
