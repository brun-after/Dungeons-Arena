import { describe, expect, it } from 'vitest';
import { buscarEntidade } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import type { MensagemServidor } from '../../src/arena/protocolo';
import { ClienteArena } from '../../src/net/cliente';
import { novaSala } from './apoio';

function ambiente() {
  const sala = novaSala();
  let agora = 0;
  let receber: (texto: string) => void = () => {};
  let perderPatch = false, perderCompleto = false;
  const enviadas: { t: string }[] = [];
  const conexao = sala.conectar(texto => {
    const msg = JSON.parse(texto) as MensagemServidor;
    if (msg.t === 'patch' && perderPatch) { perderPatch = false; return; }
    if (msg.t === 'estado' && perderCompleto) { perderCompleto = false; return; }
    receber(texto);
  });
  const cliente = new ClienteArena({ ctx: sala.ctx, nome: 'Continuidade', pedidoFicha: { classeId: 'guerreiro' }, agoraMs: () => agora,
    transporte: { enviar: texto => { enviadas.push(JSON.parse(texto) as {t:string}); conexao.receber(texto); },
      aoReceber: fn => { receber = fn; }, fechar: () => { conexao.fechar(); } } });
  cliente.entrar();
  const e = cliente.entidadeId ? buscarEntidade(sala.estado, cliente.entidadeId) : null;
  if (!e) throw new Error('jogador ausente');
  e.autoAtaque = false;
  sala.estado.entidades = [e];
  const rodar = (ticks: number, servidor = true, predizer = true) => {
    for (let i = 0; i < ticks; i++) { agora += DT_MS; if (servidor) sala.tick(DT_MS); if (predizer) cliente.passo(); }
  };
  rodar(12);
  return { sala, cliente, enviadas, rodar, falharRecuperacao: () => { perderPatch = true; perderCompleto = true; },
    repetirEstado: () => { receber(JSON.stringify({ t: 'estado', tick: cliente.baseTick, estado: cliente.base, epocaSala: cliente.epoca, ackSeq: 0 })); } };
}

describe('continuidade dos estados autoritativos', () => {
  it('recupera a sequência quando o primeiro snapshot de ressincronização não chega', () => {
    const a = ambiente();
    a.falharRecuperacao();
    a.rodar(240);
    expect(a.cliente.baseTick).toBe(a.sala.estado.tick);
    expect(a.enviadas.filter(m => m.t === 'ressincronizar').length).toBeGreaterThanOrEqual(2);
  });

  it('para de fingir conexão ativa e limita a predição quando o servidor deixa de avançar', () => {
    const a = ambiente();
    const base = a.cliente.baseTick;
    a.cliente.enviarComando({ t: 'mover', dir: 'S' });
    a.rodar(60 * 10, false);
    expect(a.cliente.conectado).toBe(false);
    expect(a.cliente.tickLocal - base).toBeLessThanOrEqual(30);
    expect(a.enviadas.filter(m => m.t === 'ressincronizar').length).toBeGreaterThan(1);
    expect(a.enviadas.filter(m => m.t === 'ping').length).toBeGreaterThan(1);
    expect(a.enviadas.filter(m => m.t === 'cmd').length).toBeLessThan(15);
    // Ao retornar, o servidor recupera o cliente e recebe comandos atuais.
    a.rodar(120);
    expect(a.cliente.conectado).toBe(true);
    expect(a.cliente.baseTick).toBe(a.sala.estado.tick);
  });

  it('snapshots repetidos do mesmo tick não escondem uma simulação parada', () => {
    const a = ambiente();
    for (let i = 0; i < 240; i++) { a.repetirEstado(); a.rodar(1, false); }
    expect(a.cliente.conectado).toBe(false);
    a.rodar(12);
    expect(a.cliente.conectado).toBe(true);
  });

  it('um RTT extremo não cria centenas de ticks de reaplicação por snapshot', () => {
    const a = ambiente();
    a.cliente.rttMs = 30000;
    for (let i = 0; i < 300; i++) {
      a.rodar(1);
      expect(a.cliente.tickLocal - a.cliente.baseTick).toBeLessThanOrEqual(30);
    }
  });

  it('realinha o relógio quando a aba volta de uma pausa longa', () => {
    const a = ambiente();
    a.rodar(60 * 60, true, false);
    expect(a.cliente.tickLocal).toBeGreaterThanOrEqual(a.cliente.baseTick);
    a.rodar(12);
    expect(a.cliente.tickLocal - a.cliente.baseTick).toBeLessThanOrEqual(30);
    expect(a.cliente.conectado).toBe(true);
  });

  it('soltar o direcional durante a interrupção impede retomar uma direção antiga', () => {
    const a = ambiente();
    a.cliente.enviarComando({ t: 'mover', dir: 'S' });
    a.rodar(240, false);
    a.cliente.enviarComando({ t: 'mover', dir: 'parado' });
    a.rodar(120);
    const e = a.cliente.entidadeId ? buscarEntidade(a.sala.estado, a.cliente.entidadeId) : null;
    expect(e?.direcao).toBe('parado');
  });
});
