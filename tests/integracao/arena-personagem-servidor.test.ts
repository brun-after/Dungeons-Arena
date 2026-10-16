// Marco 17 (15/10/2026, D-063): pelo servidor real — POST /certificar, sala da arena com faixa, entrada com o
// certificado (a ficha inteira chega com a bolsa no canal privado), GET /salas?faixa e o certificado na saída.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { contextoDaArena } from '../../src/arena/contexto-arena';
import { pedidoDoPersonagem } from '../../src/coop/personagem';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { conteudoOficial } from '../../src/core/conteudo';
import { DT_MS } from '../../src/core/loop';
import { criarJogador } from '../../src/entities/fabrica';
import type { Certificado } from '../../src/integridade/certificado';
import { ClienteArena } from '../../src/net/cliente';
import { pedirCertificado } from '../../src/plataforma/certificacao';
import { conectarArena } from '../../src/plataforma/transporte-colyseus';
import { iniciarServidor } from '../../server/servidor';

let porta = 0;
let encerrar: () => Promise<void> = () => Promise.resolve();
const url = () => `ws://localhost:${porta}`;

beforeAll(async () => {
  const s = await iniciarServidor({ porta: 0, regiao: 'teste', chaveCertificado: 'chave-de-integracao-com-tamanho' });
  porta = s.porta;
  encerrar = s.encerrar;
});

afterAll(async () => {
  await encerrar();
});

async function esperar(condicao: () => boolean, ms = 5000): Promise<void> {
  const inicio = Date.now();
  while (!condicao()) {
    if (Date.now() - inicio > ms) throw new Error('condição não atingida a tempo');
    await new Promise((r) => setTimeout(r, 20));
  }
}

describe('arena com o personagem certificado (servidor real)', () => {
  it('certifica por HTTP, entra inteiro numa sala da faixa e recebe o certificado na saída', async () => {
    const classe = conteudoOficial().classes.get('arqueiro');
    if (!classe) throw new Error('arqueiro');
    const p = pedidoDoPersonagem(criarJogador(classe, 'j1', 1, 1, BALANCE_PADRAO));
    if (!p) throw new Error('pedido');
    p.bolsa.personagemId = 'cccccccc-1111-2222-3333-444444444444';
    const r = await pedirCertificado(url(), p, null);
    if (!r.ok) throw new Error(r.motivo);

    const conexao = await conectarArena(url(), { criar: true, faixa: '1-5' });
    const lista = (await (await fetch(`http://localhost:${porta}/salas?faixa=1-5`)).json()) as { salas: { codigo: string }[] };
    expect(lista.salas.map((s) => s.codigo)).toContain(conexao.codigo);
    const vazia = (await (await fetch(`http://localhost:${porta}/salas?faixa=16-20`)).json()) as { salas: unknown[] };
    expect(vazia.salas).toHaveLength(0);

    const eu = new ClienteArena({ ctx: contextoDaArena('livre', conexao.fase), transporte: conexao.transporte, nome: 'A', pedidoFicha: { certificado: r.certificado }, agoraMs: () => performance.now() });
    eu.entrar();
    const passo = setInterval(() => {
      eu.passo();
    }, DT_MS);
    try {
      await esperar(() => eu.conectado && eu.bolsaPropria !== null);
      expect(eu.bolsaPropria?.personagemId).toBe('cccccccc-1111-2222-3333-444444444444');
      const saida = await new Promise<Certificado | null>((resolver) => {
        eu.aoCertificado = resolver;
        eu.pedirCertificado();
      });
      expect(saida?.retrato.bolsa.personagemId).toBe('cccccccc-1111-2222-3333-444444444444');
      // O certificado da saída serve de anterior para a próxima conferência.
      const deNovo = await pedirCertificado(url(), saida?.retrato ?? p, saida);
      expect(deNovo.ok).toBe(true);
    } finally {
      clearInterval(passo);
      conexao.transporte.fechar();
    }
  });

  it('certificado forjado: a sala recebe como ficha de treino (sem bolsa)', async () => {
    const conexao = await conectarArena(url(), { criar: true });
    const forjado = { retrato: { nome: 'x', nivel: 20, xp: 0, bolsa: {} }, emitidoEm: 1, assinatura: 'a'.repeat(64) };
    const eu = new ClienteArena({ ctx: contextoDaArena(), transporte: conexao.transporte, nome: 'B', pedidoFicha: { certificado: forjado, classeId: 'guerreiro' }, agoraMs: () => performance.now() });
    eu.entrar();
    await esperar(() => eu.conectado);
    await new Promise((r) => setTimeout(r, 300));
    expect(eu.bolsaPropria).toBeNull();
    conexao.transporte.fechar();
  });
});
