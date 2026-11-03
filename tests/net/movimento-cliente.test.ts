import { expect, it } from 'vitest';
import { buscarEntidade } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { ClienteArena } from '../../src/net/cliente';
import { novaSala } from './apoio';

it('clicar para cima substitui a direção mantida e termina olhando para cima', () => {
  const sala = novaSala();
  let receber: (texto: string) => void = () => {};
  const conexao = sala.conectar((texto) => { receber(texto); });
  const cliente = new ClienteArena({
    ctx: sala.ctx, nome: 'Teste', pedidoFicha: { classeId: 'aventureiro' }, agoraMs: () => 0,
    transporte: {
      enviar: (texto) => { conexao.receber(texto); },
      aoReceber: (ouvinte) => { receber = ouvinte; },
      fechar: () => { conexao.fechar(); },
    },
  });
  cliente.entrar();
  if (!cliente.entidadeId) throw new Error('sem entidade');
  const e = buscarEntidade(sala.estado, cliente.entidadeId);
  if (!e) throw new Error('sem jogador');
  // Isola o movimento de ataques e colisões com NPCs.
  sala.estado.entidades = [e];
  e.autoAtaque = false;
  const passo = () => { sala.tick(DT_MS); cliente.passo(); };
  cliente.enviarComando({ t: 'mover', dir: 'S' });
  for (let i = 0; i < 6; i++) passo();
  const destino = { x: e.px, y: e.py - 1 };
  cliente.enviarComando({ t: 'irPara', ...destino });
  for (let i = 0; i < 100; i++) passo();
  expect(e.py).toBeCloseTo(destino.y, 1);
  expect(e.olhando).toBe('N');
  if (!cliente.previsto) throw new Error('sem predição');
  expect(buscarEntidade(cliente.previsto, e.id)?.olhando).toBe('N');
  expect(e.direcao).toBe('parado');
});
