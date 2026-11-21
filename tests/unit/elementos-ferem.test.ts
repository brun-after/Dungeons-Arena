// Marco 48 (20/11/2026, D-193): os elementos ferem. O estado guarda uma fração do golpe e o tique passa pela
// resistência do alvo; cada elemento faz algo com o estado que já estava no alvo; o veneno soma camadas; a natureza da
// criatura dá fraquezas, imunidades e reações; quem morre queimando passa o fogo adiante.
import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { aplicarEfeito, processarEfeitos } from '../../src/combat/efeitos';
import { espalharAoMorrer } from '../../src/combat/elementos-ferem';
import { escalarEstado, fatorDoTique, prepararDaReacao } from '../../src/combat/estado-do-golpe';
import { aplicarImpacto } from '../../src/combat/golpe';
import type { Habilidade } from '../../src/combat/habilidades';
import { naturezaDe } from '../../src/combat/naturezas';
import { construirEfeito, type TipoEfeito } from '../../src/combat/registro-efeitos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};

function cena() {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 11, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 3, 3, ctx.balance);
  estado.entidades.push(j);
  const inimigo = (id: string, x: number, y: number, preset = 'goblin') => {
    const e = criarInimigo(obter(ctx.conteudo.presets.get(preset)), id, x, y, ctx.balance);
    e.hp = e.hpMax = 5000;
    estado.entidades.push(e);
    return e;
  };
  return { ctx, estado, j, inimigo };
}

const origem = { id: 'j', x: 3, y: 3 };
const tem = (e: Entidade, tipo: TipoEfeito) => e.efeitos.find((f) => f.tipo === tipo && f.ateTick > 0);
const golpeDe = (elemento: Habilidade['elemento'], efeitos: Habilidade['efeitos'] = []): Habilidade => ({ ...obter(CONTEUDO.habilidades.get('raio_em_cadeia')), elemento, efeitos });

/** Golpeia até acertar (o d20 pode falhar), repondo o alvo a cada tentativa. */
function golpear(c: ReturnType<typeof cena>, alvo: Entidade, hab: Habilidade, antes?: () => void): EventoSimulacao[] {
  const eventos: EventoSimulacao[] = [];
  for (let tentativa = 0; tentativa < 40; tentativa++) {
    antes?.();
    eventos.length = 0;
    aplicarImpacto(c.estado, c.ctx, alvo, { acaoId: tentativa, fonte: fonteDaHabilidade(c.j, c.ctx, c.estado.tick, hab), hab, indice: 0 }, eventos);
    const ev = eventos.find((e) => e.t === 'impacto');
    if (ev?.t === 'impacto' && !ev.falha && ev.dano > 0) break;
  }
  return eventos;
}

describe('o estado sai do golpe (D-193)', () => {
  it('o queimando guarda uma fração do golpe por tique, nunca abaixo do valor que trazia', () => {
    const { ctx } = cena();
    const r = ctx.balance.elementosFerem;
    const pct = obter(r.estadoPctDoGolpe.queimando);
    expect(escalarEstado(ctx, construirEfeito('queimando', { valor: 3 }), 400).valor).toBe(Math.round((400 * pct) / 100));
    expect(escalarEstado(ctx, construirEfeito('queimando', { valor: 3 }), 10).valor).toBe(3);
    expect(escalarEstado(ctx, construirEfeito('resfriado'), 200)).toEqual(construirEfeito('resfriado'));
    // O dano direto de uma reação vale % do golpe por ponto.
    expect(prepararDaReacao(ctx, construirEfeito('dano_direto', { valor: 5 }), 100).valor).toBe(5 * r.reacaoDanoDiretoPorPontoPct);
  });

  it('no golpe de verdade, a queimadura cresce com o golpe e fere bem mais que 3 por tique', () => {
    const c = cena();
    c.j.nivel = 30;
    const alvo = c.inimigo('a', 4, 3);
    golpear(c, alvo, golpeDe('fogo', [construirEfeito('queimando', { valor: 3, duracaoMs: 3000 })]), () => { alvo.efeitos = []; });
    expect(obter(tem(alvo, 'queimando')).valor).toBeGreaterThan(3);
  });

  it('o tique sente a fraqueza da natureza: o morto-vivo arde mais no sagrado e no fogo', () => {
    const c = cena();
    const esqueleto = c.inimigo('e', 4, 3, 'esqueleto');
    const goblin = c.inimigo('g', 5, 3);
    expect(naturezaDe(c.ctx, esqueleto)?.ids).toContain('morto_vivo');
    expect(fatorDoTique(c.ctx, esqueleto, 'queimando', 0)).toBeGreaterThan(fatorDoTique(c.ctx, goblin, 'queimando', 0));
    // O veneno no esqueleto: o preset resiste e a natureza o deixa imune ao estado.
    aplicarEfeito(c.estado, c.ctx, esqueleto, construirEfeito('envenenado', { valor: 5 }), origem, null, []);
    expect(tem(esqueleto, 'envenenado')).toBeUndefined();
  });

  it('o veneno soma camadas até o teto, e o tique fere o valor somado', () => {
    const c = cena();
    const alvo = c.inimigo('a', 4, 3);
    const max = obter(c.ctx.balance.elementosFerem.camadasMax.envenenado);
    for (let i = 0; i < max + 3; i++) aplicarEfeito(c.estado, c.ctx, alvo, construirEfeito('envenenado', { valor: 4 }), origem, null, []);
    const f = obter(tem(alvo, 'envenenado'));
    expect(f.acumulos).toBe(max);
    expect(f.valor).toBe(4 * max);
    const antes = alvo.hp;
    const eventos: EventoSimulacao[] = [];
    // Um tique a cada segundo; 70 ticks passam do primeiro.
    for (let t = 0; t < 70; t++) {
      c.estado.tick++;
      processarEfeitos(c.estado, c.ctx, eventos);
    }
    expect(antes - alvo.hp).toBeGreaterThanOrEqual(4 * max);
  });
});

describe('cada elemento fere do seu jeito (D-193)', () => {
  it('raio: o eletrizado descarrega no vizinho no golpe seguinte', () => {
    const c = cena();
    const alvo = c.inimigo('a', 4, 3);
    const vizinho = c.inimigo('b', 5, 3);
    golpear(c, alvo, golpeDe('fogo'), () => {
      alvo.reacoesAte = {};
      aplicarEfeito(c.estado, c.ctx, alvo, construirEfeito('eletrizado'), origem, null, []);
      vizinho.hp = vizinho.hpMax;
    });
    expect(vizinho.hp).toBeLessThan(vizinho.hpMax);
    expect(tem(alvo, 'eletrizado')).toBeUndefined();
  });

  it('gelo: o golpe de outro elemento no congelado estilhaça em volta', () => {
    const c = cena();
    const alvo = c.inimigo('a', 4, 3);
    const vizinho = c.inimigo('b', 5, 4);
    golpear(c, alvo, golpeDe('raio'), () => {
      alvo.reacoesAte = {};
      aplicarEfeito(c.estado, c.ctx, alvo, construirEfeito('congelado'), origem, null, []);
      vizinho.hp = vizinho.hpMax;
    });
    expect(vizinho.hp).toBeLessThan(vizinho.hpMax);
  });

  it('trevas: o golpe no marcado cura quem marcou', () => {
    const c = cena();
    const alvo = c.inimigo('a', 4, 3);
    golpear(c, alvo, golpeDe('fogo'), () => {
      c.j.hp = 1;
      aplicarEfeito(c.estado, c.ctx, alvo, construirEfeito('marcado'), origem, null, []);
    });
    expect(c.j.hp).toBeGreaterThan(1);
  });

  it('fogo: quem morre queimando passa a queimadura aos vizinhos', () => {
    const c = cena();
    const morto = c.inimigo('a', 4, 3);
    const vizinho = c.inimigo('b', 5, 3);
    const longe = c.inimigo('c', 9, 9);
    aplicarEfeito(c.estado, c.ctx, morto, construirEfeito('queimando', { valor: 20, duracaoMs: 3000 }), origem, null, []);
    espalharAoMorrer(c.estado, c.ctx, morto, []);
    expect(tem(vizinho, 'queimando')?.valor).toBe(20);
    expect(tem(longe, 'queimando')).toBeUndefined();
  });
});

describe('a natureza das criaturas (D-193)', () => {
  it('a besta foge do fogo quando o queimando a pega pela primeira vez', () => {
    const c = cena();
    const lobo = c.inimigo('l', 4, 3, 'lobo');
    golpear(c, lobo, golpeDe('fogo', [construirEfeito('queimando', { valor: 3, duracaoMs: 3000 })]), () => {
      lobo.efeitos = [];
      lobo.reacoesAte = {};
    });
    expect(tem(lobo, 'aterrorizado')).toBeDefined();
  });

  it('o voador não se enraíza, e as feras dos personagens não têm natureza', () => {
    const c = cena();
    const pluma = c.inimigo('p', 4, 3, 'pluminha');
    aplicarEfeito(c.estado, c.ctx, pluma, construirEfeito('enraizado'), origem, null, []);
    expect(tem(pluma, 'enraizado')).toBeUndefined();
    expect(CONTEUDO.naturezas.presets.has('falcao_companheiro')).toBe(false);
    expect(naturezaDe(c.ctx, c.j)).toBeUndefined();
  });
});
