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
