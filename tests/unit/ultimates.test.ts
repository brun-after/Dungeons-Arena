// Marco 24 (24/10/2026, D-094): a ultimate do par das teclas 1 e 2, o medidor de carga e os ganhos de cada classe.
import { describe, expect, it } from 'vitest';
import { cargaDaClasse, cargaDe, somarCarga, ultimateDe } from '../../src/combat/carga-ultimate';
import { ultimateDoPar } from '../../src/combat/ultimates';
import { lerComando } from '../../src/arena/protocolo';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena(classe = 'guerreiro') {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 7, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 3, 5, ctx.balance);
  const b = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'b', 4, 5, ctx.balance);
  estado.entidades.push(j, b);
  const eventos: EventoSimulacao[] = [];
  const tick = (cmd?: Parameters<typeof lerComando>[0]) => {
    simular(estado, ctx, cmd ? [{ tick: estado.tick, entidadeId: 'j', cmd: obter(lerComando(cmd)) }] : [], eventos, DT_MS);
  };
  return { ctx, estado, j, eventos, tick };
}

describe('ultimate do par (D-094)', () => {
  it('as duas skills iniciais formam a ultimate da classe, em qualquer ordem', () => {
    for (const c of CONTEUDO.classes.values()) {
      const { ctx, j } = cena(c.id);
      const [a, b] = c.iniciais;
      const u = obter(ultimateDe(ctx, j), c.id);
      expect(u.classe).toBe(c.id);
      expect(ultimateDoPar(CONTEUDO.ultimates, obter(b), obter(a))?.id).toBe(u.id);
    }
  });

  it('sem par nas teclas 1 e 2, ou com o medidor vazio, recusa', () => {
    const { j, eventos, tick } = cena();
    tick({ t: 'usarUltimate' });
    expect(eventos.find((e) => e.t === 'acaoRecusada')).toMatchObject({ motivo: 'sem_carga' });
    obter(j.bolsa).barra[1] = null;
    j.cargaUltimate = 100;
    tick({ t: 'usarUltimate' });
    expect(eventos.filter((e) => e.t === 'acaoRecusada').at(-1)).toMatchObject({ motivo: 'sem_ultimate' });
    expect(j.cargaUltimate).toBe(100);
  });

  it('com o medidor cheio, a ultimate sai, zera o medidor e não enche com o próprio golpe', () => {
    const { ctx, j, eventos, tick } = cena();
    const u = obter(ultimateDe(ctx, j));
    j.cargaUltimate = ctx.balance.ultimate.max;
    j.autoAtaque = false;
    tick({ t: 'usarUltimate', alvo: 'b' });
    expect(eventos.find((e) => e.t === 'acaoIniciada')).toMatchObject({ habilidadeId: u.id });
    expect(eventos.find((e) => e.t === 'ultimateUsada')).toMatchObject({ id: 'j', ultimateId: u.id });
    expect(cargaDe(j)).toBe(0);
    for (let i = 0; i < 120; i++) tick();
    expect(eventos.some((e) => e.t === 'impacto' && e.habilidadeId.startsWith(u.id))).toBe(true);
    expect(cargaDe(j)).toBe(0);
    // A ultimate não fica na barra: pedi-la como habilidade comum é recusado.
    tick({ t: 'usarHabilidade', id: u.id });
    expect(eventos.filter((e) => e.t === 'acaoRecusada').at(-1)).toMatchObject({ motivo: 'sem_habilidade' });
  });

  it('o medidor enche até o máximo e avisa uma vez', () => {
    const { ctx, estado, j } = cena();
    const saida: EventoSimulacao[] = [];
    somarCarga(ctx, j, 60, estado.tick, saida);
    somarCarga(ctx, j, 60, estado.tick, saida);
    somarCarga(ctx, j, 60, estado.tick, saida);
    expect(cargaDe(j)).toBe(ctx.balance.ultimate.max);
    expect(saida.filter((e) => e.t === 'ultimateCheia')).toHaveLength(1);
  });

  it('o ganho da classe respeita o intervalo mínimo do balance', () => {
    const { ctx, j } = cena('aventureiro');
    const r = ctx.balance.ultimate.classe.falcao;
    const saida: EventoSimulacao[] = [];
    cargaDaClasse(ctx, j, 'falcao', 10, saida);
    cargaDaClasse(ctx, j, 'falcao', 11, saida);
    expect(cargaDe(j)).toBe(r.valor);
    cargaDaClasse(ctx, j, 'falcao', 10 + ticksDe(r.intervaloMs), saida);
    expect(cargaDe(j)).toBe(2 * r.valor);
  });

  it('a fúria cheia do Guerreiro enche a ultimate', () => {
    const { ctx, j, tick } = cena();
    j.furia = { valor: ctx.balance.ajustesClasses.guerreiro.furia.max - 1, ultimoTick: 0 };
    tick({ t: 'selecionarAlvo', alvo: 'b' });
    for (let i = 0; i < 200 && cargaDe(j) < ctx.balance.ultimate.classe.furiaCheia.valor; i++) tick();
    expect(cargaDe(j)).toBeGreaterThanOrEqual(ctx.balance.ultimate.classe.furiaCheia.valor);
  });

  it('cada uma das 140 ultimates sai e acerta (ou age) sem quebrar a simulação', () => {
    const falhas: string[] = [];
    for (const u of CONTEUDO.ultimates.values()) {
      const { ctx, j, eventos, tick } = cena(u.classe);
      const bolsa = obter(j.bolsa);
      bolsa.barra[0] = u.par[0];
      bolsa.barra[1] = u.par[1];
      j.cargaUltimate = ctx.balance.ultimate.max;
      j.mana = j.manaMax = 999;
      j.hp = j.hpMax = 999;
      j.autoAtaque = false;
      tick({ t: 'usarUltimate', alvo: 'b' });
      if (!eventos.some((e) => e.t === 'ultimateUsada')) {
        falhas.push(`${u.id}: ${JSON.stringify(eventos.find((e) => e.t === 'acaoRecusada'))}`);
        continue;
      }
      for (let i = 0; i < 600; i++) tick();
      const agiu = eventos.some((e) => (e.t === 'impacto' || e.t === 'efeitoAplicado' || e.t === 'invocou') && e.tick > 0);
      if (!agiu) falhas.push(`${u.id}: sem impacto nem efeito`);
    }
    expect(falhas).toEqual([]);
  });

  it('a rede aceita o comando com e sem alvo', () => {
    expect(lerComando({ t: 'usarUltimate' })).toEqual({ t: 'usarUltimate' });
    expect(lerComando({ t: 'usarUltimate', alvo: { x: 2, y: 3 } })).toEqual({ t: 'usarUltimate', alvo: { x: 2, y: 3 } });
    expect(lerComando({ t: 'usarUltimate', alvo: 5 })).toBeNull();
  });
});
