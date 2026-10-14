import { describe, expect, it } from 'vitest';
import type { ComandoDoTick } from '../../src/core/comandos';
import { digest } from '../../src/core/digest';
import { clonarEstado } from '../../src/core/estado';
import { aleatorio, criarRng, escolher } from '../../src/core/rng';
import { povoarFase } from '../../src/world/populacao';
import { criarBotAleatorio, criarCenario, rodar, verificarInvariantes } from './harness';

describe('harness de simulação na fase oficial 1', () => {
  it('mantém as invariantes por 10.000 ticks com bot aleatório', () => {
    const cenario = criarCenario({ semente: 42, inimigos: 20, jogadores: 3 });
    expect(verificarInvariantes(cenario.estado, cenario.ctx)).toEqual([]);
    const eventos = rodar(cenario, 10_000, criarBotAleatorio(7));
    expect(cenario.estado.tick).toBe(10_000);
    // O bot precisa de fato mexer o mundo e lutar, senão o teste não prova nada.
    const contar = (t: string) => eventos.filter((e) => e.t === t).length;
    expect(contar('moveu')).toBeGreaterThan(1_000);
    expect(contar('impacto')).toBeGreaterThan(50);
    expect(contar('acaoCancelada') + contar('esquivou')).toBeGreaterThan(0);
    expect(contar('morreu')).toBeGreaterThan(0);
    expect(contar('iaNotou')).toBeGreaterThan(0);
    expect(contar('iaPerseguindo')).toBeGreaterThan(0);
  });

  it('toda ação ofensiva iniciada dá ao menos 200 ms entre o início e o impacto previsto (§3.6)', () => {
    const cenario = criarCenario({ semente: 8, inimigos: 20, jogadores: 3 });
    const eventos = rodar(cenario, 3_000, criarBotAleatorio(2));
    const iniciadas = eventos.filter((e) => e.t === 'acaoIniciada' && e.alvoId !== e.atorId);
    expect(iniciadas.length).toBeGreaterThan(20);
    for (const e of iniciadas) {
      if (e.t !== 'acaoIniciada') continue;
      expect((e.impactoPrevistoTick - e.inicioTick) * (1000 / 60)).toBeGreaterThanOrEqual(200);
    }
  });

  it('a mesma semente e os mesmos comandos produzem o mesmo digest', () => {
    const a = criarCenario({ semente: 123 });
    const b = criarCenario({ semente: 123 });
    rodar(a, 3_600, criarBotAleatorio(9));
    rodar(b, 3_600, criarBotAleatorio(9));
    expect(digest(a.estado)).toBe(digest(b.estado));
  });

  it('sementes diferentes produzem digests diferentes', () => {
    const a = criarCenario({ semente: 1 });
    const b = criarCenario({ semente: 2 });
    rodar(a, 600, criarBotAleatorio(9));
    rodar(b, 600, criarBotAleatorio(9));
    expect(digest(a.estado)).not.toBe(digest(b.estado));
  });

  it('dois "clientes" clonados no mesmo processo convergem com os mesmos comandos', () => {
    const original = criarCenario({ semente: 77 });
    rodar(original, 500, criarBotAleatorio(3));
    const clone = { estado: clonarEstado(original.estado), ctx: original.ctx };
    expect(digest(clone.estado)).toBe(digest(original.estado));

    rodar(original, 1_000, criarBotAleatorio(5));
    rodar(clone, 1_000, criarBotAleatorio(5));
    expect(digest(clone.estado)).toBe(digest(original.estado));
  });

  it('o clone é independente do original', () => {
    const original = criarCenario({ semente: 5 });
    const clone = clonarEstado(original.estado);
    rodar(original, 600, criarBotAleatorio(1));
    expect(digest(clone)).not.toBe(digest(original.estado));
  });

  // Marco 9A: ciclo econômico íntegro (§5.6). Três jogadores ao lado da loja e do baú da fase 1,
  // pedindo interagir, comprar, vender, fechar e reordenar o tempo todo; as invariantes (ouro ≥ 0,
  // nenhum item duplicado, um abridor por baú) são conferidas a cada tick por `rodar`.
  it('o ciclo de loja e baú mantém as invariantes por 6.000 ticks', () => {
    const cenario = criarCenario({ semente: 31, inimigos: 0, jogadores: 3 });
    // Só os objetos da fase (loja, baús, chave e orbes); os inimigos dela ficam de fora.
    povoarFase(cenario.estado, cenario.ctx);
    cenario.estado.entidades = cenario.estado.entidades.filter((e) => e.controlador !== 'ia');
    const celulas = [
      [7, 3],
      [8, 4],
      [9, 3],
    ] as const;
    cenario.estado.entidades.forEach((e, i) => {
      const [x, y] = celulas[i] ?? [7, 3];
      Object.assign(e, { x, y, destinoX: x, destinoY: y });
      if (e.bolsa) e.bolsa.ouro = 60;
    });
    const rng = criarRng(4);
    const estoque = ['pocao_vida', 'pocao_mana', 'adaga', 'escudo_madeira', 'capa_sombria'];
    const eventos = rodar(cenario, 6_000, (estado) => {
      const comandos: ComandoDoTick[] = [];
      for (const e of estado.entidades) {
        if (aleatorio(rng) >= 0.1) continue;
        const sorteio = aleatorio(rng);
        const entrada = e.bolsa && e.bolsa.mochila.length > 0 ? escolher(rng, e.bolsa.mochila) : null;
        let cmd: ComandoDoTick['cmd'];
        if (sorteio < 0.3) cmd = { t: 'interagir' };
        else if (sorteio < 0.6) cmd = { t: 'comprar', itemId: escolher(rng, estoque) };
        else if (sorteio < 0.8 && entrada) cmd = { t: 'vender', invId: entrada.invId };
        else if (sorteio < 0.9 && entrada) cmd = { t: 'moverItem', invId: entrada.invId, posicao: 0 };
        else cmd = { t: 'fecharLoja' };
        comandos.push({ tick: estado.tick, entidadeId: e.id, cmd });
      }
      return comandos;
    });
    const contar = (t: string) => eventos.filter((e) => e.t === t).length;
    expect(contar('comprou')).toBeGreaterThan(10);
    expect(contar('vendeu')).toBeGreaterThan(10);
    expect(contar('lojaFechada')).toBeGreaterThan(10);
    expect(cenario.estado.objetos.some((o) => o.tipo === 'loja')).toBe(true);
    expect(eventos.some((e) => e.t === 'itemRecusado' && (e.motivo === 'em_recarga' || e.motivo === 'sem_ouro'))).toBe(true);
  });
});
