// A skin Mágico do Aventureiro (06/11/2026): o falcão desenhado é a cartola. Nos movimentos do pássaro o pombo sai
// dela num puff (a cartola espera parada) e, no fim, ela vai de encontro a ele e ele entra noutro puff; nas magias, a
// cartola vira de boca para cima com a mão e a varinha e fica na preparação por uns segundos; pousada, fica vestida
// na cabeça do dono. Sem a skin, o falcão segue falcão.
import { describe, expect, it } from 'vitest';
import { companheiroDe } from '../../src/combat/companheiro';
import { Barramento } from '../../src/core/events';
import { criarEstado } from '../../src/core/estado';
import type { EventosDaSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { Entidade, PontoVisual } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { atualizarAparencias } from '../../src/progression/buffs';
import type { SistemaParticulas } from '../../src/render/particulas';
import { CELULA_PX } from '../../src/render/camera-calculo';
import { VooDoFalcao } from '../../src/render/voo-falcao';
import { CONTEUDO, contexto, faseDeTexto } from '../apoio/fases';

const SALA = ['############', '#..........#', '#..........#', '#..........#', '############'];

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena(skin: string | null) {
  const ctx = contexto(faseDeTexto(SALA));
  const estado = criarEstado({ semente: 3, faseId: 'teste' });
  estado.entidades.push(criarJogador(obter(CONTEUDO.classes.get('aventureiro'), 'aventureiro'), 'j', 3, 2, ctx.balance));
  const eventos: EventoSimulacao[] = [];
  const tick = () => {
    simular(estado, ctx, [], eventos, DT_MS);
  };
  if (skin) simular(estado, ctx, [{ tick: estado.tick, entidadeId: 'j', cmd: { t: 'skin', id: skin } }], eventos, DT_MS);
  tick();
  atualizarAparencias(estado, ctx);
  const dono = obter(estado.entidades.find((e) => e.id === 'j'), 'dono');
  const falcao = obter(companheiroDe(estado, dono), 'falcão');
  const puffs: string[] = [];
  const particulas = { emitir: (nome: string) => { puffs.push(nome); } } as unknown as SistemaParticulas;
  const voo = new VooDoFalcao({ particulas, habilidades: (chave) => ctx.conteudo.habilidades.get(chave.replace(/@.*$/, '')), parDaUltimate: () => null, reduzido: () => false });
  const bus = new Barramento<EventosDaSimulacao>();
  let agora = 1000;
  voo.ligar(bus, () => estado, () => agora);
  const base = (e: Entidade): PontoVisual => ({ x: e.x, y: e.y });
  const quadro = (ms: number) => {
    for (let t = 0; t < ms; t += 16) {
      agora += 16;
      voo.quadro(estado, agora, base);
    }
  };
  const usar = (habilidadeId: string, duracaoTicks = 20) => {
    bus.emitir('acaoIniciada', {
      t: 'acaoIniciada', tick: estado.tick, acaoId: 1, atorId: 'j', habilidadeId, chave: habilidadeId, alvoId: null, alvoX: 8, alvoY: 2,
      inicioTick: estado.tick, lancamentoTick: estado.tick, impactoPrevistoTick: estado.tick + duracaoTicks,
    });
  };
  return { estado, falcao, voo, quadro, usar, puffs, ajuste: () => voo.ajuste(falcao, agora), dono };
}

describe('skin Mágico: a cartola', () => {
  it('sem a skin o falcão segue falcão (sem troca de modelo nem pombo)', () => {
    const c = cena(null);
    c.quadro(100);
    expect(c.ajuste()?.modelo).toBeUndefined();
    expect(c.ajuste()?.acompanhante).toBeUndefined();
  });

  it('no mergulho o pombo sai da cartola, que espera parada, e volta para dentro dela', () => {
    const c = cena('aventureiro-magico');
    expect(c.dono.aparencia?.skin).toBe('aventureiro-magico');
    c.quadro(100);
    expect(c.ajuste()?.modelo).toBe('cartola');
    const antes = c.voo.posicao((e) => ({ x: e.x, y: e.y }))(c.falcao);
    c.usar('mergulho');
    c.quadro(200);
    const a = obter(c.ajuste(), 'ajuste');
    // a cartola segue cartola e o pombo voa como acompanhante
    expect(a.modelo).toBe('cartola');
    expect(a.acompanhante?.modelo).toBe('pombo');
    expect(c.puffs.filter((p) => p === 'puff_magico')).toHaveLength(1);
    const durante = c.voo.posicao((e) => ({ x: e.x, y: e.y }))(c.falcao);
    expect(Math.hypot(durante.x - antes.x, durante.y - antes.y)).toBeLessThan(0.3);
    // acabou o voo: a cartola espera um pouco e os dois se encontram no caminho (a cartola não vai até o alvo)
    const alvo = { x: 8, y: 2 };
    c.quadro(1300);
    let maisPerto = Infinity;
    for (let i = 0; i < 120; i++) {
      c.quadro(16);
      const p = c.voo.posicao((e) => ({ x: e.x, y: e.y }))(c.falcao);
      maisPerto = Math.min(maisPerto, Math.hypot(p.x - alvo.x, p.y - alvo.y));
    }
    expect(maisPerto).toBeGreaterThan(1);
    c.quadro(3000);
    expect(c.ajuste()?.acompanhante).toBeNull();
    expect(c.puffs.filter((p) => p === 'puff_magico')).toHaveLength(2);
  });

  it('nas magias a cartola vira com a varinha e fica na preparação por uns segundos (o grito sai dela)', () => {
    const c = cena('aventureiro-magico');
    c.quadro(100);
    c.usar('grito_do_falcao');
    c.quadro(150);
    // virando: ainda a cartola, girando em volta do meio
    expect(c.ajuste()?.gira ?? 0).toBeGreaterThan(0);
    c.quadro(800);
    expect(c.ajuste()?.modelo).toBe('cartola_magica');
    expect(c.ajuste()?.acompanhante).toBeNull();
    expect(c.puffs).not.toContain('puff_magico');
    // segue preparada um tempo depois do impacto
    c.quadro(2000);
    expect(c.ajuste()?.modelo).toBe('cartola_magica');
    c.quadro(3000);
    expect(c.ajuste()?.modelo).toBe('cartola');
  });

  it('outra magia durante a preparação a renova', () => {
    const c = cena('aventureiro-magico');
    c.quadro(100);
    c.usar('grito_do_falcao');
    c.quadro(3000);
    c.usar('grito_do_falcao');
    c.quadro(3000);
    expect(c.ajuste()?.modelo).toBe('cartola_magica');
  });

  it('pousada, a cartola fica vestida na cabeça do dono (a aba tocando a esfera, sem flutuar)', () => {
    const c = cena('aventureiro-magico');
    c.falcao.ia = { ...obter(c.falcao.ia, 'ia'), modo: 'pousado' };
    c.quadro(3000);
    const a = obter(c.ajuste(), 'ajuste');
    expect(a.modelo).toBe('cartola');
    expect(a.quadro).toBe(2);
    // a aba entra no alto da cabeça (0,91 célula de tela), descontada a elevação do modelo: abaixo do ombro do falcão
    expect(a.alturaPx).toBeCloseTo((0.91 - 0.094 * 0.8) * CELULA_PX, 0);
  });
});
