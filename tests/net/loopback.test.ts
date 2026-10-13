import { describe, expect, it } from 'vitest';
import { digest } from '../../src/core/digest';
import { buscarEntidade } from '../../src/core/estado';
import { REDE_PERFEITA, type CondicaoDeRede } from '../../src/net/rede-local';
import { largarObjeto } from '../../src/world/objetos';
import { verificarInvariantes } from '../sim/harness';
import { ambiente, p95 } from './apoio';

const rede = (latenciaMs: number, jitterMs: number, perda = 0): CondicaoDeRede => ({ ...REDE_PERFEITA, latenciaMs, jitterMs, perda });

describe('loopback: dois clientes, predição e reconciliação (§3.6, §5.6)', () => {
  // RTT ≈ 2 × latência de ida.
  for (const [rtt, jitter] of [
    [30, 10],
    [80, 30],
    [150, 30],
  ] as const) {
    it(`RTT ${rtt} ms, jitter ±${jitter} ms: erro de correção p95 ≤ 0,25 célula`, () => {
      const amb = ambiente(rede(rtt / 2, jitter), 2, { bots: true });
      amb.rodar(60 * 40);
      for (const c of amb.clientes) {
        expect(c.conectado).toBe(true);
        // Descarta o primeiro segundo (aquecimento do relógio e do RTT).
        const erros = c.erros.slice(20);
        expect(erros.length).toBeGreaterThan(500);
        expect(p95(erros)).toBeLessThanOrEqual(0.25);
        expect(c.rejeitados).toBe(0);
      }
      // Os bots de fato andaram e lutaram.
      const passos = amb.clientes.map((c) => c.base?.entidades.find((e) => e.id === c.entidadeId)?.relogioAndar ?? 0);
      expect(Math.min(...passos)).toBeGreaterThan(1000);
    });
  }

  it('o estado público recebido é idêntico ao do servidor no mesmo tick', () => {
    const amb = ambiente(rede(40, 20), 2, { bots: true });
    let comparados = 0;
    amb.rodar(60 * 20, () => {
      for (const c of amb.clientes) {
        if (!c.base) continue;
        const doServidor = amb.digests.get(c.baseTick);
        if (doServidor) {
          expect(digest(c.base)).toBe(doServidor);
          comparados++;
        }
      }
    });
    expect(comparados).toBeGreaterThan(500);
  });

  it('mesma semente e mesmas condições → mesmo digest final do servidor', () => {
    const final = () => {
      const amb = ambiente(rede(40, 20), 2, { bots: true, semente: 3 });
      amb.rodar(60 * 15);
      return amb.digests.get(Math.max(...amb.digests.keys()));
    };
    expect(final()).toBe(final());
  });

  it('dois clientes chegam ao mesmo orbe no mesmo tick: uma coleta', () => {
    const amb = ambiente(rede(40, 0), 2);
    amb.rodar(60);
    const [c1, c2] = amb.clientes;
    if (!c1?.entidadeId || !c2?.entidadeId) throw new Error('clientes não entraram');
    const e1 = buscarEntidade(amb.sala.estado, c1.entidadeId);
    const e2 = buscarEntidade(amb.sala.estado, c2.entidadeId);
    if (!e1 || !e2) throw new Error('entidades ausentes');
    // Lados opostos do orbe em (6,10), ambos feridos.
    e1.x = e1.destinoX = 5;
    e2.x = e2.destinoX = 7;
    e1.y = e1.destinoY = e2.y = e2.destinoY = 10;
    e1.hp = e2.hp = 10;
    e1.autoAtaque = e2.autoAtaque = false;
    amb.sala.estado.objetos = [];
    largarObjeto(amb.sala.estado, 'orbe_hp', 6, 10, 30, 'pct', []);
    const coletas: string[] = [];
    amb.rodar(6);
    for (const c of amb.clientes) c.enviarComando({ t: 'mover', dir: c === c1 ? 'E' : 'O' });
    // Observa os eventos que o servidor transmite (pela sala, sem depender do cliente).
    const antes = amb.sala.estado.objetos.length;
    amb.rodar(60, () => {
      if (amb.sala.estado.objetos.length === 0 && coletas.length === 0) coletas.push('coletado');
    });
    expect(antes).toBe(1);
    expect(amb.sala.estado.objetos).toHaveLength(0);
    // Só um dos dois ganhou vida.
    expect([e1.hp > 10, e2.hp > 10].filter(Boolean)).toHaveLength(1);
  });

  it('perda de 3% com retransmissão (bloqueio TCP) não quebra a convergência', () => {
    const amb = ambiente(rede(60, 20, 0.03), 2, { bots: true });
    amb.rodar(60 * 20);
    for (const c of amb.clientes) {
      expect(c.baseTick).toBeGreaterThan(60 * 19);
      expect(digest(c.base ?? amb.sala.estado)).toBe(amb.digests.get(c.baseTick));
      expect(p95(c.erros.slice(20))).toBeLessThanOrEqual(1);
    }
  });
});

describe('carga em loopback', () => {
  it('10 clientes bot por 1 minuto de simulação mantêm as invariantes no servidor', () => {
    const amb = ambiente(rede(50, 20), 10, { bots: true });
    amb.rodar(60 * 60, () => {
      if (amb.sala.estado.tick % 60 !== 0) return;
      expect(verificarInvariantes(amb.sala.estado, amb.sala.ctx)).toEqual([]);
    });
    expect(amb.sala.jogadores).toBe(10);
    expect(amb.clientes.every((c) => c.conectado && c.rejeitados === 0)).toBe(true);
    // Banda média por cliente (§5.6: ≤ 100 KiB/s recebidos), com patches.
    const bytesPorClientePorSegundo = amb.sala.metricas().bytesEnviados / 10 / 60;
    expect(bytesPorClientePorSegundo).toBeLessThan(100 * 1024);
  }, 60_000);
});
