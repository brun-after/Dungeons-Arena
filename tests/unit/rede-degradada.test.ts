import { describe, expect, it } from 'vitest';
import { contextoDaArena, faseDeArena } from '../../src/arena/contexto-arena';
import { modoPorId } from '../../src/core/conteudo';
import { criarRng } from '../../src/core/rng';
import { ESPERA_PARA_AVISAR_MS, ESPERA_PARA_REARMAR_MS, MonitorDeConexao, RTT_INSTAVEL_MS } from '../../src/net/qualidade';
import { PERFIS, proximaLiberacao } from '../../tools/rede/proxy';
import { CONTEUDO } from '../apoio/fases';

describe('proxy de rede degradada (§5.6)', () => {
  it('nunca entrega fora de ordem e o atraso fica na faixa do perfil', () => {
    const perfil = PERFIS.suportado;
    if (!perfil) throw new Error('perfil');
    const rng = criarRng(3);
    let anterior = 0;
    let agora = 0;
    const atrasos: number[] = [];
    for (let i = 0; i < 5000; i++) {
      agora += 5;
      const quando = proximaLiberacao(anterior, agora, perfil, rng);
      expect(quando).toBeGreaterThanOrEqual(anterior);
      atrasos.push(quando - agora);
      anterior = quando;
    }
    const minimo = perfil.rttMs / 2 - perfil.jitterMs / 2;
    expect(Math.min(...atrasos)).toBeGreaterThanOrEqual(minimo - 1e-9);
  });

  it('uma perda segura o que vem atrás (head-of-line)', () => {
    const perfil = { rttMs: 100, jitterMs: 0, perda: 0, retransmissaoMs: 300 };
    const rng = criarRng(1);
    const perdido = proximaLiberacao(0, 0, { ...perfil, perda: 1 }, rng);
    expect(perdido).toBe(350);
    // O próximo chegou 10 ms depois e sairia aos 60 ms, mas espera o perdido.
    expect(proximaLiberacao(perdido, 10, perfil, rng)).toBe(350);
  });
});

describe('aviso de conexão instável (§3.6)', () => {
  it('avisa uma vez depois de 3 s ruins e só rearma depois de 5 s bons', () => {
    const m = new MonitorDeConexao();
    const ruim = RTT_INSTAVEL_MS + 50;
    expect(m.atualizar(0, ruim, true)).toBe(false);
    expect(m.atualizar(ESPERA_PARA_AVISAR_MS - 1, ruim, true)).toBe(false);
    expect(m.atualizar(ESPERA_PARA_AVISAR_MS, ruim, true)).toBe(true);
    expect(m.atualizar(ESPERA_PARA_AVISAR_MS + 4000, ruim, true)).toBe(false);
    const boa = 10_000;
    m.atualizar(boa, 80, true);
    m.atualizar(boa + ESPERA_PARA_REARMAR_MS, 80, true);
    m.atualizar(boa + ESPERA_PARA_REARMAR_MS + 1, 80, false);
    expect(m.atualizar(boa + ESPERA_PARA_REARMAR_MS + 1 + ESPERA_PARA_AVISAR_MS, 80, false)).toBe(true);
  });
});

describe('arenas do modo Livre', () => {
  it('a cena padrão da §5.6 é 60×40 com 20 NPCs; fase fora do modo vira a padrão', () => {
    const ctx = contextoDaArena('livre', 'arena-02');
    expect([ctx.fase.largura, ctx.fase.altura, ctx.fase.inimigos.length]).toEqual([60, 40, 20]);
    const livre = modoPorId(CONTEUDO, 'livre');
    expect(faseDeArena(livre, 'fase-01')).toBe('arena-01');
    expect(faseDeArena(livre, 42)).toBe('arena-01');
    expect(faseDeArena(livre, 'arena-02')).toBe('arena-02');
  });
});
