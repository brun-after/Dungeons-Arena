// Marco 40 (14/11/2026, D-168): o que as mecânicas fazem além de mover — a névoa que reúne os servos, o Acelerar, a
// Âncora com o eco, os marcos elementais (a queda do salto, a armadilha do recuo, os tiros na corda), a Arremetida no ponto
// mirado e o companheiro do Aventureiro que precisa estar perto e fica onde a viagem acabou.
import { describe, expect, it } from 'vitest';
import { movimentoAtivo } from '../../src/combat/movimento-classe';
import { petDoCompanheiro } from '../../src/combat/pets';
import type { Comando } from '../../src/core/comandos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { simular } from '../../src/core/simulacao';
import { posicionar, type Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const ctx = contexto(faseDeTexto(SALA_ABERTA));

function cena(classe: string, nivel = 1) {
  const estado = criarEstado({ semente: 3, faseId: ctx.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 2, 5, ctx.balance);
  j.nivel = nivel;
  estado.entidades.push(j);
  const eventos: EventoSimulacao[] = [];
  const passo = (cmds: Comando[] = [], ms = DT_MS) => {
    for (let t = 0; t < ms; t += DT_MS) {
      simular(estado, ctx, t === 0 ? cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })) : [], eventos, DT_MS);
    }
  };
  const orc = (x: number, y: number) => {
    const o = criarInimigo(obter(CONTEUDO.presets.get('orc')), `o${x}${y}`, x, y, ctx.balance);
    estado.entidades.push(o);
    return o;
  };
  /** Troca até a mecânica pedida ficar ativa. */
  const ativar = (id: string) => {
    for (let i = 0; i < 3 && movimentoAtivo(ctx, j)?.id !== id; i++) passo([{ t: 'trocarMovimento' }]);
    expect(movimentoAtivo(ctx, j)?.id).toBe(id);
  };
  return { estado, j, eventos, passo, orc, ativar };
}
const modo = (e: Entidade) => e.movimentoClasse?.modo?.tipo;
const dist = (a: Entidade, b: Entidade) => Math.max(Math.abs(a.px - b.px), Math.abs(a.py - b.py));

describe('movimento da classe: o que cada mecânica faz (D-168)', () => {
  it('a névoa leva todos os servos, mesmo os longe, para junto do Necromante, sem lutar, e acaba sem o escudo amarelo', () => {
    const c = cena('necromante', 20);
    c.passo([], 1500);
    const servo = obter(c.estado.entidades.find((e) => e.invocacao?.donoId === 'j' && e.invocacao.necromancia));
    posicionar(servo, 11, 8);
    c.orc(11, 9);
    c.passo([{ t: 'movimentoClasse' }]);
    expect(modo(c.j)).toBe('nevoa');
    expect(servo.invocacao?.nevoaAteTick).toBeGreaterThan(c.estado.tick);
    c.passo([], 1000);
    expect(dist(servo, c.j)).toBeLessThanOrEqual(2);
    expect(servo.alvoSelecionado).toBeNull();
    obter(obter(c.j.movimentoClasse).modo).ateTick = c.estado.tick;
    c.passo();
    expect(modo(c.j)).toBeUndefined();
    expect(servo.invocacao?.nevoaAteTick).toBeUndefined();
    for (const q of [c.j, servo]) expect(q.efeitos.some((f) => f.tipo === 'imune_dano' && f.origemId === 'j')).toBe(false);
  });

  it('o Acelerar dá velocidade a quem está no círculo, inimigo também; no nível 30, aplica o elemento do Mago', () => {
    const c = cena('mago', 30);
    c.ativar('acelerar');
    const perto = c.orc(3, 5);
    const longe = c.orc(9, 5);
    c.passo([{ t: 'movimentoClasse' }]);
    expect(c.j.movimentoClasse?.circulo).toMatchObject({ x: 2, y: 5, ponta: 'fogo' });
    c.passo([], 1100);
    expect(perto.efeitos.some((f) => f.tipo === 'acelerado')).toBe(true);
    expect(c.j.efeitos.some((f) => f.tipo === 'acelerado')).toBe(true);
    expect(longe.efeitos.some((f) => f.tipo === 'acelerado')).toBe(false);
    expect(perto.efeitos.some((f) => f.tipo === obter(ctx.conteudo.elementos.get('fogo')).estado.tipo)).toBe(true);
  });

  it('a Âncora finca o totem; perto dele, a 2ª volta (longe, recusa); no nível 30, a volta deixa o eco que provoca', () => {
    const c = cena('mago', 30);
    c.ativar('ancora_runica');
    c.passo([{ t: 'movimentoClasse' }]);
    const ancora = obter(c.j.movimentoClasse?.ancora);
    expect({ x: ancora.x, y: ancora.y }).toEqual({ x: 2, y: 5 });
    // O alcance começa em 8 células (+1,2 a cada 10 níveis): 11 no 30.
    expect(ancora.raio).toBe(11);
    posicionar(c.j, 5, 3);
    const orc = c.orc(5, 4);
    c.passo([{ t: 'movimentoClasse' }]);
    expect({ x: c.j.x, y: c.j.y }).toEqual({ x: 2, y: 5 });
    expect(c.j.movimentoClasse?.ancora).toBeUndefined();
    const eco = obter(c.estado.entidades.find((e) => e.invocacao?.donoId === 'j' && e.invocacao.comportamento === 'isca'));
    expect({ x: eco.x, y: eco.y }).toEqual({ x: 5, y: 3 });
    expect(orc.efeitos.some((f) => f.tipo === 'desafiado' && f.origemId === eco.id)).toBe(true);
    expect(c.j.invisivelAteTick).toBeGreaterThan(c.estado.tick);
    expect(c.eventos.filter((e) => e.t === 'movimentoClasse' && e.fase === 'inicio').at(-1)).toMatchObject({ eco: true, ponta: 'fogo' });

    // Sem o marco, a volta não deixa eco; fora do círculo, recusa.
    const b = cena('mago', 1);
    b.ativar('ancora_runica');
    b.passo([{ t: 'movimentoClasse' }]);
    posicionar(b.j, 11, 5);
    b.passo([], 9000);
    b.passo([{ t: 'movimentoClasse' }]);
    expect(b.eventos.some((e) => e.t === 'movimentoClasse' && e.motivo === 'ancora_longe')).toBe(true);
    posicionar(b.j, 6, 5);
    b.passo([{ t: 'movimentoClasse' }]);
    expect(b.j.x).toBe(2);
    expect(b.estado.entidades.some((e) => e.invocacao?.comportamento === 'isca')).toBe(false);
  });

  it('a Arremetida vai para o ponto mirado, não para onde o Guerreiro olha', () => {
    const c = cena('guerreiro');
    c.ativar('arremetida');
    c.j.olhando = 'E';
    c.passo([{ t: 'movimentoClasse', alvo: { x: 2, y: 1 } }], 400);
    expect(c.j.x).toBe(2);
    expect(c.j.y).toBeLessThan(5);
  });

  it('no nível 30, a queda do Salto de Guerra leva o Físico (dano bruto) e o Salto para Trás deixa a armadilha', () => {
    const g = cena('guerreiro', 30);
    const orc = g.orc(10, 4);
    const vida = orc.hp;
    g.passo([{ t: 'movimentoClasse', dx: 1000, dy: 0 }], 1200);
    expect(modo(g.j)).toBeUndefined();
    expect(orc.hp).toBeLessThan(vida);

    const a = cena('arqueiro', 30);
    a.ativar('salto_atras');
    a.j.olhando = 'E';
    a.passo([{ t: 'movimentoClasse', dx: 1000, dy: 0 }]);
    expect(a.estado.armadilhas.some((x) => x.donoId === 'j' && x.x === 2 && x.y === 5 && x.elemento === 'raio')).toBe(true);
  });

  it('balançando na corda da Chegada, o Arqueiro atira sozinho no inimigo perto; no nível 30, com o elemento', () => {
    const c = cena('arqueiro', 30);
    expect(movimentoAtivo(ctx, c.j)?.id).toBe('chegada');
    c.orc(6, 7);
    c.passo([{ t: 'movimentoClasse', dx: 1000, dy: 0 }]);
    expect(modo(c.j)).toBe('tirolesa');
    expect(c.j.movimentoClasse?.modo?.ponta).toBe('raio');
    c.passo([], 200);
    expect(c.eventos.some((e) => e.t === 'acaoIniciada' && e.atorId === 'j')).toBe(true);
  });

  it('o Aventureiro só monta com o companheiro perto; ao descer, o companheiro fica onde a viagem acabou e, no 30, carrega a descarga', () => {
    const c = cena('aventureiro', 30);
    obter(c.j.bolsa).pet = 'lobo';
    c.passo([], 200);
    const lobo = obter(c.estado.entidades.find((e) => e.invocacao?.donoId === 'j' && petDoCompanheiro(e) === 'lobo'));
    posicionar(lobo, 11, 8);
    c.passo([{ t: 'movimentoClasse' }]);
    expect(modo(c.j)).toBeUndefined();
    expect(c.eventos.some((e) => e.t === 'movimentoClasse' && e.motivo === 'longe')).toBe(true);
    posicionar(lobo, 3, 5);
    c.passo([{ t: 'movimentoClasse' }]);
    expect(modo(c.j)).toBe('montado');
    c.passo([{ t: 'mover', dir: 'E', dx: 1000, dy: 0 }], 500);
    c.passo([{ t: 'mover', dir: 'parado' }]);
    expect(dist(lobo, c.j)).toBeLessThan(0.5);
    expect(lobo.olhando).toBe('E');
    c.passo([{ t: 'movimentoClasse' }]);
    expect(modo(c.j)).toBeUndefined();
    const onde = { x: lobo.x, y: lobo.y };
    c.passo([], 100);
    expect(Math.abs(lobo.x - onde.x)).toBeLessThanOrEqual(1);
    expect(lobo.invocacao?.descarga).toMatchObject({ ponta: 'terra', golpes: ctx.balance.movimentoClasse.descarga.golpes });
  });
});
