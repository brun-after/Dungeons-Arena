// Marco 30 (30/10/2026, D-129): o coordenador do Mundo grava a ficha só quando ela mudou (o checkpoint de quem está
// parado não vai ao banco), e a falha de gravação deixa a próxima tentar de novo.

import { describe, expect, it } from 'vitest';
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
