// Marco 40 (13/11/2026, D-162): a matriz das reações elementais — os 36 pares das 9 pontas (o Físico incluído) e o que
// as reações novas fazem no golpe.
import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { multiplicadorDanoRecebido } from '../../src/combat/efeitos';
import { aplicarImpacto } from '../../src/combat/golpe';
import type { Habilidade } from '../../src/combat/habilidades';
import type { TipoEfeito } from '../../src/combat/registro-efeitos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { PONTAS_ELEMENTAIS } from '../../src/progression/vinculo';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined): T => {
  if (v === undefined) throw new Error('ausente');
  return v;
};

/** A ponta de cada estado de elemento. */
const PONTA_DO_ESTADO: Partial<Record<TipoEfeito, string>> = {
  queimando: 'fogo', resfriado: 'gelo', congelado: 'gelo', eletrizado: 'raio', envenenado: 'veneno', exposto: 'psiquico',
  enraizado: 'terra', marcado: 'trevas', definhando: 'trevas', consagrado: 'sagrado',
};

function cena() {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 11, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 3, 3, ctx.balance);
  j.hp = 50;
  estado.entidades.push(j);
  const inimigo = (id: string, x: number, y: number) => {
    const e = criarInimigo(obter(ctx.conteudo.presets.get('goblin')), id, x, y, ctx.balance);
    e.hp = e.hpMax = 500;
    estado.entidades.push(e);
    return e;
  };
  return { ctx, estado, j, inimigo };
}

const com = (e: Entidade, tipo: TipoEfeito, tick: number) => {
  e.efeitos = [{ tipo, ateTick: tick + 300, origemId: 'j', valor: 2, pct: 0, proximoTick: 0, interno: null, ref: null, inicioTick: tick, acumulos: 1 }];
};

/** Golpeia até acertar (o d20 pode falhar), repondo o estado a cada tentativa. */
function golpear(c: ReturnType<typeof cena>, alvo: Entidade, hab: Habilidade, estado: TipoEfeito, antes?: () => void): EventoSimulacao[] {
  const eventos: EventoSimulacao[] = [];
  for (let tentativa = 0; tentativa < 30; tentativa++) {
    com(alvo, estado, c.estado.tick);
    antes?.();
    eventos.length = 0;
    aplicarImpacto(c.estado, c.ctx, alvo, { acaoId: tentativa, fonte: fonteDaHabilidade(c.j, c.ctx, c.estado.tick, hab), hab, indice: 0 }, eventos);
    const ev = eventos.find((e) => e.t === 'impacto');
    if (ev?.t === 'impacto' && !ev.falha) break;
  }
  return eventos;
}

const fisico = (): Habilidade => ({ ...obter(CONTEUDO.habilidades.get('raio_em_cadeia')), elemento: null, tipoAtaque: 'fisico', efeitos: [] });
const doElemento = (elemento: Habilidade['elemento']): Habilidade => ({ ...obter(CONTEUDO.habilidades.get('raio_em_cadeia')), elemento, efeitos: [] });
const reacoes = (eventos: EventoSimulacao[]) => eventos.flatMap((e) => (e.t === 'impacto' ? e.sinergias : []));

describe('a matriz das reações (D-162)', () => {
  it('cada par das 9 pontas tem a sua reação, e cada uma tem nome e texto', () => {
    const pares = new Set<string>();
    for (const s of CONTEUDO.interacoes.sinergias) {
      for (const estado of s.sobre) {
        const outra = PONTA_DO_ESTADO[estado];
        if (outra && outra !== s.elemento) pares.add([s.elemento, outra].sort().join('+'));
      }
    }
    const esperados = PONTAS_ELEMENTAIS.flatMap((a, i) => PONTAS_ELEMENTAIS.slice(i + 1).map((b) => [a, b].sort().join('+')));
    expect(esperados).toHaveLength(36);
    expect(esperados.filter((p) => !pares.has(p))).toEqual([]);
  });

  it('o golpe físico reage: Esmagar no preso, e o preso continua preso', () => {
    const c = cena();
    const a = c.inimigo('a', 5, 5);
    const eventos = golpear(c, a, fisico(), 'enraizado');
    expect(reacoes(eventos)).toContain('esmagar');
    expect(a.efeitos.some((f) => f.tipo === 'enraizado')).toBe(true);
    expect(reacoes(golpear(c, a, fisico(), 'eletrizado'))).toContain('condutor');
    expect(a.efeitos.some((f) => f.tipo === 'sem_ataque')).toBe(true);
  });

  it('Juízo é crítico', () => {
    const c = cena();
    const a = c.inimigo('a', 5, 5);
    const ev2 = golpear(c, a, doElemento('raio'), 'consagrado').find((e) => e.t === 'impacto');
    expect(ev2?.t === 'impacto' && ev2.sinergias.includes('juizo') && ev2.critico).toBe(true);
  });

  it('Quebra-alma consome a marca e cura quem bate', () => {
    const c = cena();
    const a = c.inimigo('a', 5, 5);
    const eventos = golpear(c, a, fisico(), 'marcado', () => { c.j.hp = 50; });
    expect(reacoes(eventos)).toContain('quebra_alma');
    expect(a.efeitos.some((f) => f.tipo === 'marcado')).toBe(false);
    expect(c.j.hp).toBeGreaterThan(50);
  });

  it('Orvalho dá escudo a quem lança e aos aliados perto do alvo', () => {
    const c = cena();
    const a = c.inimigo('a', 4, 3);
    const eventos = golpear(c, a, doElemento('sagrado'), 'resfriado');
    expect(reacoes(eventos)).toContain('orvalho');
    expect(c.j.efeitos.some((f) => f.tipo === 'escudo')).toBe(true);
  });

  it('a Sobrecarga salta só para o eletrizado mais perto', () => {
    const c = cena();
    const a = c.inimigo('a', 5, 5);
    const perto = c.inimigo('b', 6, 5);
    const longe = c.inimigo('d', 8, 5);
    const eventos = golpear(c, a, doElemento('psiquico'), 'eletrizado', () => {
      com(perto, 'eletrizado', c.estado.tick);
      com(longe, 'eletrizado', c.estado.tick);
    });
    expect(reacoes(eventos)).toContain('sobrecarga');
    expect(perto.efeitos.some((f) => f.tipo === 'atordoar')).toBe(true);
    expect(longe.efeitos.some((f) => f.tipo === 'atordoar')).toBe(false);
  });

  it('Fossilizar petrifica: o dano recebido cai pela metade', () => {
    const c = cena();
    const a = c.inimigo('a', 5, 5);
    const eventos = golpear(c, a, doElemento('terra'), 'congelado');
    expect(reacoes(eventos)).toContain('fossilizar');
    expect(a.efeitos.some((f) => f.tipo === 'petrificado')).toBe(true);
    expect(multiplicadorDanoRecebido(a, c.estado.tick)).toBeCloseTo(0.5);
  });

  it('Ferida aberta faz o veneno ferir de novo na hora', () => {
    const c = cena();
    const a = c.inimigo('a', 5, 5);
    const eventos = golpear(c, a, fisico(), 'envenenado', () => { a.hp = 500; });
    expect(reacoes(eventos)).toContain('ferida_aberta');
    const ev = eventos.find((e) => e.t === 'impacto');
    expect(500 - a.hp).toBeGreaterThan(ev?.t === 'impacto' ? ev.dano : 0);
  });
});
