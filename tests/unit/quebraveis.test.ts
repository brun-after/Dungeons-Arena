// Marco 26 (26/10/2026, D-113): os enfeites que quebram. Nascem nos modos com objetos, não bloqueiam, quebram com o
// básico mirado na célula, com área e com projétil (só do lado do jogador) e soltam um saque determinístico.

import { describe, expect, it } from 'vitest';
import { lerComando } from '../../src/arena/protocolo';
import { quebrarEm, quebravelEm, saqueDe } from '../../src/combat/quebraveis';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { contextoDaFase, estadoInicialDaFase, faseOficialOuGerada, faseSeguinte } from '../../src/save/fases-campanha';
import { TIPOS_DECORACAO } from '../../src/world/decoracao';
import { passavel } from '../../src/world/fase';
import { novoObjeto } from '../../src/world/objetos';
import { comKit, CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cenario(classeId = 'guerreiro', modo = 'campanha') {
  const ctx = contexto(faseDeTexto(SALA_ABERTA), BALANCE_PADRAO, modo);
  const estado = criarEstado({ semente: 7, faseId: 'teste' });
  const classe = obter(CONTEUDO.classes.get(classeId), 'classe');
  estado.entidades.push(criarJogador(classe, 'j', 3, 5, BALANCE_PADRAO));
  const eventos: EventoSimulacao[] = [];
  const j = (): Entidade => obter(buscarEntidade(estado, 'j'), 'j');
  const tick = (...cmds: Comando[]) => {
    simular(estado, ctx, cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })), eventos, DT_MS);
  };
  const avancar = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const barril = (x: number, y: number) => {
    const o = novoObjeto(`q:${x},${y}`, 'quebravel', x, y, { ref: 'barril' });
    estado.objetos.push(o);
    return o;
  };
  return { ctx, estado, eventos, j, tick, avancar, barril };
}

describe('quebráveis', () => {
  it('os tipos do balance existem e o saque é determinístico e dentro da tabela', () => {
    const q = BALANCE_PADRAO.quebraveis;
    for (const t of q.tipos) expect(TIPOS_DECORACAO as readonly string[]).toContain(t);
    const ctx = contexto(faseDeTexto(SALA_ABERTA));
    const vistos = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const s = saqueDe(ctx, 'gerada-3', `q:${i},${i * 3}`);
      expect(saqueDe(ctx, 'gerada-3', `q:${i},${i * 3}`)).toEqual(s);
      vistos.add(s.tipo);
      if (s.tipo === 'ouro') {
        expect(s.ouro).toBeGreaterThanOrEqual(q.ouroMin);
        expect(s.ouro).toBeLessThanOrEqual(q.ouroMax);
      } else expect(s.ouro).toBe(0);
    }
    expect(vistos).toEqual(new Set(Object.keys(q.saque)));
  });

  it('nascem dos enfeites da fase com tema só nos modos com objetos, sem bloquear a passagem', () => {
    // Procura, nas primeiras fases geradas da campanha, uma com quebráveis.
    let ref = faseSeguinte({ tipo: 'oficial', id: 'fase-02' });
    let achou = false;
    for (let n = 0; n < 8 && ref && !achou; n++, ref = faseSeguinte(ref)) {
      const r = contextoDaFase(CONTEUDO, faseOficialOuGerada(ref, CONTEUDO));
      if (!r.ok) continue;
      const quebraveis = estadoInicialDaFase(r.ctx).objetos.filter((o) => o.tipo === 'quebravel');
      if (quebraveis.length === 0) continue;
      achou = true;
      for (const o of quebraveis) {
        expect(BALANCE_PADRAO.quebraveis.tipos).toContain(o.ref);
        expect(passavel(r.ctx.fase, o.x, o.y)).toBe(true);
        expect(o.objetoId).toBe(`q:${o.x},${o.y}`);
      }
      // Sem objetos de fase (a arena), nenhum.
      const arena = estadoInicialDaFase({ ...r.ctx, modo: { ...r.ctx.modo, objetosDeFase: false } });
      expect(arena.objetos.some((o) => o.tipo === 'quebravel')).toBe(false);
    }
    expect(achou).toBe(true);
  });

  it('o básico mirado na célula quebra o barril vizinho; andar por cima não quebra', () => {
    const c = cenario();
    c.barril(4, 5);
    c.barril(3, 6);
    c.tick({ t: 'ataqueBasico', alvo: { x: 4, y: 5 } });
    c.avancar(60);
    expect(quebravelEm(c.estado, 4, 5)).toBeUndefined();
    const ev = c.eventos.find((e) => e.t === 'quebrou');
    expect(ev).toMatchObject({ forma: 'barril', x: 4, y: 5, porId: 'j' });
    // Anda por cima do outro (não bloqueia, não quebra) e não o recolhe.
    c.tick({ t: 'irPara', x: 3, y: 8 });
    c.avancar(120);
    expect(c.j().y).toBe(8);
    expect(quebravelEm(c.estado, 3, 6)).toBeDefined();
  });

  it('o protocolo aceita o básico mirado numa célula', () => {
    expect(lerComando({ t: 'ataqueBasico', alvo: { x: 4, y: 5 } })).toEqual({ t: 'ataqueBasico', alvo: { x: 4, y: 5 } });
    expect(lerComando({ t: 'ataqueBasico', alvo: { x: 'a' } })).toBeNull();
  });

  it('a área quebra o que pega; o monstro não quebra', () => {
    const c = cenario();
    c.barril(6, 5);
    c.barril(6, 6);
    const n = quebrarEm(c.estado, c.ctx, [{ x: 6, y: 5 }, { x: 6, y: 6 }, { x: 7, y: 7 }], c.j(), []);
    expect(n).toBe(2);
    c.barril(8, 8);
    const monstro = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'm', 8, 7, BALANCE_PADRAO);
    expect(quebrarEm(c.estado, c.ctx, [{ x: 8, y: 8 }], monstro, [])).toBe(0);
  });

  it('o projétil do jogador quebra o barril no caminho e para nele', () => {
    const c = cenario('arqueiro');
    comKit(c.j());
    c.barril(6, 5);
    c.tick({ t: 'ataqueBasico', alvo: { x: 8, y: 5 } });
    c.avancar(60);
    expect(quebravelEm(c.estado, 6, 5)).toBeUndefined();
    expect(c.eventos.some((e) => e.t === 'projetilFim' && e.motivo === 'acertou')).toBe(true);
  });

  it('o saque nasce onde o barril estava (ou numa vizinha)', () => {
    const c = cenario();
    // Quebra vários até sair algum saque.
    for (let x = 2; x <= 9; x++) c.barril(x, 2);
    quebrarEm(c.estado, c.ctx, Array.from({ length: 8 }, (_, i) => ({ x: 2 + i, y: 2 })), c.j(), c.eventos);
    const surgiram = c.eventos.filter((e) => e.t === 'objetoSurgiu');
    expect(surgiram.length).toBeGreaterThan(0);
    for (const s of surgiram) expect(Math.abs(s.y - 2)).toBeLessThanOrEqual(1);
  });
});
