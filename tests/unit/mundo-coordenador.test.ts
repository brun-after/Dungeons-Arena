// Marco 30 (30/10/2026, D-129): o coordenador do Mundo grava a ficha só quando ela mudou (o checkpoint de quem está
// parado não vai ao banco), e a falha de gravação deixa a próxima tentar de novo.

import { describe, expect, it, vi } from 'vitest';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { fichaNova, type FichaDoMundo } from '../../src/mundo/ficha-mundo';
import { PersistenciaEmMemoria } from '../../server/persistencia-mundo';
import { CoordenadorDoMundo } from '../../server/salas/sala-mundo';
import { CONTEUDO } from '../apoio/fases';

class Contadora extends PersistenciaEmMemoria {
  gravacoes = 0;
  falhar = false;
  override gravar(conta: string, slot: number, ficha: FichaDoMundo): Promise<void> {
    this.gravacoes++;
    return this.falhar ? Promise.reject(new Error('rede')) : super.gravar(conta, slot, ficha);
  }
}

function ficha(): FichaDoMundo {
  const reino = CONTEUDO.reinos.get('reino_central');
  const f = reino ? fichaNova({ conteudo: CONTEUDO, balance: BALANCE_PADRAO }, reino, 'mago', 'Ana', 'pers-ana') : null;
  if (!f) throw new Error('ficha');
  return f;
}

const esperar = () => new Promise((r) => setTimeout(r, 0));

describe('exclusão de personagens', () => {
  it('aguarda o último save antes de excluir e libera o slot sem ressuscitar a ficha', async () => {
    const p = new Contadora(), c = new CoordenadorDoMundo(p, CONTEUDO), f = ficha();
    let liberar = () => {};
    const espera = new Promise<void>(r => { liberar = r; });
    const gravar = p.gravar.bind(p);
    vi.spyOn(p, 'gravar').mockImplementation(async (...args) => { await espera; return gravar(...args); });
    c.gravar('local:apagar', 5, f);
    const apagando = c.excluir('local:apagar', 5, f.personagem.nome);
    await esperar();
    liberar();
    expect(await apagando).toBeNull();
    expect(await c.carregar('local:apagar', 5)).toBeNull();
    c.gravar('local:apagar', 5, f);
    await esperar();
    expect(await c.carregar('local:apagar', 5)).not.toBeNull();
  });

  it('recusa transferência com bilhete ainda válido e preserva o personagem', async () => {
    const p = new Contadora(), c = new CoordenadorDoMundo(p, CONTEUDO), f = ficha();
    await p.gravar('local:bilhete', 1, f);
    c.emitir({ conta: 'local:bilhete', slot: 1, ficha: f, lugar: 'regiao:campos_do_oeste', chegada: null, instancia: null });
    expect(await c.excluir('local:bilhete', 1, f.personagem.nome)).toBe('ja_jogando');
    expect(await p.carregar('local:bilhete', 1)).not.toBeNull();
  });

  it('anúncio pendente impede exclusão e não é herdado por um slot novo', async () => {
    const p = new Contadora(), c = new CoordenadorDoMundo(p, CONTEUDO), f = ficha();
    await p.gravar('local:vendedor', 1, f);
    await c.mercado.anunciar({ id: 'a', vendedor: 'local:vendedor#1', vendedorNome: 'Ana', item: { invId: 'i', itemId: 'pocao_vida', qtd: 1, ref: null }, preco: 10, liquido: 9, criadoEm: 1, expiraEm: 100000, estado: 'aberto' });
    expect(await c.excluir('local:vendedor', 1, f.personagem.nome)).toBe('mercado_pendente');
    await c.mercado.cancelar('a', 'local:vendedor#1');
    expect(await c.excluir('local:vendedor', 1, f.personagem.nome)).toBeNull();
  });

  it('falha de armazenamento preserva a ficha e permite tentar de novo', async () => {
    const p = new Contadora(), c = new CoordenadorDoMundo(p, CONTEUDO), f = ficha();
    await p.gravar('local:falha', 1, f);
    vi.spyOn(p, 'excluir').mockRejectedValueOnce(new Error('rede'));
    await expect(c.excluir('local:falha', 1, f.personagem.nome)).rejects.toThrow('rede');
    expect(await p.carregar('local:falha', 1)).not.toBeNull();
    expect(await c.excluir('local:falha', 1, f.personagem.nome)).toBeNull();
  });

  it('entrada concorrente aguarda a exclusão terminar no mesmo slot', async () => {
    const p = new Contadora(), c = new CoordenadorDoMundo(p, CONTEUDO), f = ficha();
    await p.gravar('local:disputa', 1, f);
    let liberar = () => {};
    const espera = new Promise<void>(r => { liberar = r; });
    const excluir = p.excluir.bind(p);
    vi.spyOn(p, 'excluir').mockImplementation(async (...args) => { await espera; return excluir(...args); });
    const apagando = c.excluir('local:disputa', 1, f.personagem.nome);
    await esperar();
    const entrando = c.noSlot('local:disputa', 1, () => c.carregar('local:disputa', 1));
    liberar();
    expect(await apagando).toBeNull();
    expect(await entrando).toBeNull();
  });
});

describe('coordenador do Mundo: gravação só com mudança', () => {
  it('a mesma ficha não grava de novo; a ficha mudada grava', async () => {
    const p = new Contadora();
    const c = new CoordenadorDoMundo(p, CONTEUDO);
    const f = ficha();
    c.gravar('local:a', 1, f);
    c.gravar('local:a', 1, { ...f });
    await esperar();
    expect(p.gravacoes).toBe(1);
    c.gravar('local:a', 1, { ...f, vilaSalva: 'encosta_do_leste' });
    await esperar();
    expect(p.gravacoes).toBe(2);
    // Outro slot da mesma conta é outra ficha.
    c.gravar('local:a', 2, f);
    await esperar();
    expect(p.gravacoes).toBe(3);
  });

  it('a falha esquece a última gravada (a próxima, mesmo igual, tenta de novo); sair também esquece', async () => {
    const p = new Contadora();
    const c = new CoordenadorDoMundo(p, CONTEUDO);
    const f = ficha();
    p.falhar = true;
    c.gravar('local:b', 1, f);
    await esperar();
    p.falhar = false;
    c.gravar('local:b', 1, f);
    await esperar();
    expect(p.gravacoes).toBe(2);
    c.sair('local:b#1');
    c.gravar('local:b', 1, f);
    await esperar();
    expect(p.gravacoes).toBe(3);
  });
});


describe('reservas de sessão do Mundo', () => {
  it('uma saída atrasada não libera a nova sessão na mesma sala', () => {
    const c = new CoordenadorDoMundo(new Contadora(), CONTEUDO);
    expect(c.entrar('a#1', 'sala', 'antiga')).toBe(true);
    expect(c.sair('a#1', 'sala', 'antiga')).toBe(true);
    expect(c.entrar('a#1', 'sala', 'nova')).toBe(true);
    expect(c.sair('a#1', 'sala', 'antiga')).toBe(false);
    expect(c.entrar('a#1', 'outra', 'intrusa')).toBe(false);
  });
  it('bilhetes expirados não mantêm o personagem em troca', () => {
    const c = new CoordenadorDoMundo(new Contadora(), CONTEUDO);
    const agora = vi.spyOn(Date, 'now').mockReturnValue(1000);
    try {
      c.emitir({ conta: 'a', slot: 1, ficha: ficha(), lugar: 'regiao:vila_do_centro', chegada: null, instancia: null });
      expect(c.emTroca('a#1')).toBe(true);
      agora.mockReturnValue(61001);
      expect(c.emTroca('a#1')).toBe(false);
    } finally { agora.mockRestore(); }
  });
  it('descartar a sala limpa a reserva órfã', () => {
    const c = new CoordenadorDoMundo(new Contadora(), CONTEUDO);
    c.entrar('a#1', 'velha');
    c.registrarSala('velha', null);
    expect(c.entrar('a#1', 'nova')).toBe(true);
  });
});


it('reentrada aguarda gravações em ordem e preserva o save mais recente', async () => {
  const p = new PersistenciaEmMemoria();
  const gravar = p.gravar.bind(p);
  let liberar = () => {};
  const espera = new Promise<void>(r => { liberar = r; });
  let chamadas = 0;
  vi.spyOn(p, 'gravar').mockImplementation(async (conta, slot, f) => {
    if (++chamadas === 1) await espera;
    await gravar(conta, slot, f);
  });
  const c = new CoordenadorDoMundo(p, CONTEUDO), f = ficha();
  c.gravar('local:ordem', 1, f);
  c.gravar('local:ordem', 1, { ...f, vilaSalva: 'encosta_do_leste' });
  const carregando = c.carregar('local:ordem', 1);
  await esperar(); expect(chamadas).toBe(1);
  liberar();
  expect((await carregando)?.vilaSalva).toBe('encosta_do_leste');
  expect(chamadas).toBe(2);
});
