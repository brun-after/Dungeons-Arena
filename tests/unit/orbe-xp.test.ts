// 16/11/2026 (D-184): a luz de XP — o abate não dá XP direto; a luz é só do dono (vê e pega de perto), e o inimigo
// abaixo do nível do dono às vezes rende 3× ou 5×.
import { describe, expect, it } from 'vitest';
import { recortarPorInteresse } from '../../src/arena/interesse';
import { estadoPublico } from '../../src/arena/estado-publico';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { processarMortes } from '../../src/progression/morte';
import { brilhoDoOrbeXp, sorteDoXp } from '../../src/progression/orbe-xp';
import { coletarObjetos, expirarDrops } from '../../src/world/objetos';
import { ticksDe } from '../../src/core/tempo';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena(modoId = 'campanha') {
  const ctx = contexto(faseDeTexto(SALA_ABERTA), BALANCE_PADRAO, modoId);
  const estado = criarEstado({ semente: 7, faseId: 'teste' });
  const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
  estado.entidades.push(criarJogador(classe, 'j', 3, 5, BALANCE_PADRAO));
  const goblin = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'g', 6, 5, BALANCE_PADRAO);
  estado.entidades.push(goblin);
  const eventos: EventoSimulacao[] = [];
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
  const matar = (por: string[]) => {
    goblin.hp = 0;
    goblin.participacao = por.map((id) => ({ id, tick: estado.tick }));
    processarMortes(estado, ctx, eventos);
  };
  return { ctx, estado, eventos, ent, goblin, matar };
}

describe('luz de XP (D-184)', () => {
  it('o abate deixa a luz do dono e não dá XP na hora', () => {
    const c = cena();
    c.matar(['j']);
    expect(c.ent('j').xp).toBe(0);
    expect(c.eventos.some((e) => e.t === 'xpGanho')).toBe(false);
    const luz = obter(c.estado.objetos.find((o) => o.tipo === 'orbe_xp'), 'luz');
    expect(luz.ref).toBe('j');
    expect(luz.valor).toBeGreaterThan(0);
    expect({ x: luz.x, y: luz.y }).toEqual({ x: 6, y: 5 });
  });

  it('o dono pega de perto, sem pisar em cima; longe, não', () => {
    const c = cena();
    c.matar(['j']);
    const valor = obter(c.estado.objetos.find((o) => o.tipo === 'orbe_xp'), 'luz').valor;
    // A duas células, fica no chão.
    c.ent('j').x = 4;
    coletarObjetos(c.estado, c.ctx, c.eventos);
    expect(c.estado.objetos.some((o) => o.tipo === 'orbe_xp')).toBe(true);
    // Ao lado (na diagonal), pega.
    c.ent('j').x = 5;
    c.ent('j').y = 4;
    coletarObjetos(c.estado, c.ctx, c.eventos);
    expect(c.estado.objetos.some((o) => o.tipo === 'orbe_xp')).toBe(false);
    expect(c.ent('j').xp + (c.ent('j').bolsa?.xpFracao ?? 0)).toBeCloseTo(valor);
    expect(c.eventos.some((e) => e.t === 'coletou' && e.tipo === 'orbe_xp' && e.id === 'j')).toBe(true);
  });

  it('outro jogador não pega a luz de quem abateu, nem a recebe da área de interesse', () => {
    const c = cena();
    const classe = obter(CONTEUDO.classes.get('mago'), 'mago');
    c.estado.entidades.push(criarJogador(classe, 'k', 6, 5, BALANCE_PADRAO));
    c.matar(['j']);
    // O aliado perto ganha a parte dele (a própria luz, que pega por estar em cima); a de quem abateu fica.
    const daK = c.estado.objetos.find((o) => o.tipo === 'orbe_xp' && o.ref === 'k')?.valor ?? 0;
    coletarObjetos(c.estado, c.ctx, c.eventos);
    expect(c.ent('k').xp + (c.ent('k').bolsa?.xpFracao ?? 0)).toBeCloseTo(daK);
    expect(c.estado.objetos.filter((o) => o.tipo === 'orbe_xp').map((o) => o.ref)).toEqual(['j']);
    const publico = estadoPublico(c.estado);
    expect(recortarPorInteresse(publico, 'k', 20).objetos.some((o) => o.tipo === 'orbe_xp')).toBe(false);
    expect(recortarPorInteresse(publico, 'j', 20).objetos.some((o) => o.tipo === 'orbe_xp')).toBe(true);
  });

  it('cada um que teve parte ganha a sua luz', () => {
    const c = cena();
    const classe = obter(CONTEUDO.classes.get('mago'), 'mago');
    c.estado.entidades.push(criarJogador(classe, 'k', 8, 5, BALANCE_PADRAO));
    c.matar(['j', 'k']);
    const donos = c.estado.objetos.filter((o) => o.tipo === 'orbe_xp').map((o) => o.ref).sort();
    expect(donos).toEqual(['j', 'k']);
  });

  it('a sorte só vale contra quem está abaixo do nível, e dá 3× ou 5× perto de 5% e 1%', () => {
    const c = cena();
    const j = c.ent('j');
    j.nivel = 10;
    c.goblin.nivel = 10;
    let semSorte = true;
    for (let t = 0; t < 500; t++) {
      c.estado.tick = t;
      if (sorteDoXp(c.estado, c.ctx, j, c.goblin) !== 1) semSorte = false;
    }
    expect(semSorte).toBe(true);
    c.goblin.nivel = 5;
    const contagem = new Map<number, number>();
    const n = 20000;
    for (let t = 0; t < n; t++) {
      c.estado.tick = t;
      const m = sorteDoXp(c.estado, c.ctx, j, c.goblin);
      contagem.set(m, (contagem.get(m) ?? 0) + 1);
    }
    expect([...contagem.keys()].sort()).toEqual([1, 3, 5]);
    expect((contagem.get(3) ?? 0) / n).toBeGreaterThan(0.04);
    expect((contagem.get(3) ?? 0) / n).toBeLessThan(0.06);
    expect((contagem.get(5) ?? 0) / n).toBeGreaterThan(0.006);
    expect((contagem.get(5) ?? 0) / n).toBeLessThan(0.014);
  });

  it('brilha mais quanto mais XP leva, até o teto', () => {
    const b = (valor: number) => brilhoDoOrbeXp({ valor }, 5, BALANCE_PADRAO);
    expect(b(1)).toBeLessThan(b(10));
    expect(b(10)).toBeLessThan(b(40));
    expect(b(1e6)).toBe(1);
    expect(b(0)).toBeCloseTo(0.15);
  });

  it('some no prazo', () => {
    const c = cena();
    c.matar(['j']);
    // A checagem roda a cada segundo (no tick múltiplo de 60).
    const fim = c.estado.tick + ticksDe(BALANCE_PADRAO.xp.orbe.prazoMs);
    c.estado.tick = fim + (60 - (fim % 60));
    expirarDrops(c.estado, c.ctx);
    expect(c.estado.objetos.some((o) => o.tipo === 'orbe_xp')).toBe(false);
  });
});
