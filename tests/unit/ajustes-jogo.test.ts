// Ajustes de 15/10/2026 (D-060): andar enquanto conjura por habilidade, tempo mínimo na zona de atenção, teclado
// numérico, o d20 visível e a área orgânica (o desenho cobre a hitbox sem ser ela).

import { describe, expect, it } from 'vitest';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { celulasDaForma } from '../../src/combat/formas';
import type { Habilidade } from '../../src/combat/habilidades';
import { poderDaHabilidade } from '../../src/combat/orcamento';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../../src/core/contexto';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import type { PresetInimigo } from '../../src/entities/presets';
import { indiceDoAtalho } from '../../src/input/teclado';
import { normalizarPreferencias } from '../../src/plataforma/preferencias';
import { contornoDaArea, dentroDoPoligono } from '../../src/render/formas-visuais';
import { centroDaCelula } from '../../src/render/projecao';
import { MIGRACOES } from '../../src/save/esquema';
import { faixaDoDado } from '../../src/ui/dado';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}
const CTX = { conteudo: CONTEUDO, balance: BALANCE_PADRAO };
const hab = (chave: string): Habilidade => obter(resolverHabilidade(CTX, chave), chave);

function cena(ctx: ContextoSimulacao, classe: string, jogador: [number, number], inimigos: [string, number, number][]) {
  const estado = criarEstado({ semente: 4, faseId: 'teste' });
  estado.entidades.push(criarJogador(obter(ctx.conteudo.classes.get(classe), classe), 'j', jogador[0], jogador[1], ctx.balance));
  inimigos.forEach(([preset, x, y], i) => estado.entidades.push(criarInimigo(obter(ctx.conteudo.presets.get(preset), preset), `i${i}`, x, y, ctx.balance)));
  const eventos: EventoSimulacao[] = [];
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
  const tick = (cmds: [string, Comando][] = []) => {
    simular(estado, ctx, cmds.map(([entidadeId, cmd]) => ({ tick: estado.tick, entidadeId, cmd })), eventos, DT_MS);
  };
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  return { estado, eventos, ent, tick, ticks };
}

describe('andar enquanto conjura (mobilidade por habilidade)', () => {
  /** Quantas células o jogador anda para o sul em `n` ticks, pedindo a habilidade junto. */
  const andouConjurando = (classe: string, id: string | null, n = 30) => {
    const c = cena(contexto(faseDeTexto(SALA_ABERTA)), classe, [3, 2], [['boneco', 3, 4]]);
    c.ent('j').autoAtaque = false;
    c.ent('j').mana = 50;
    const cmds: [string, Comando][] = [['j', { t: 'mover', dir: 'S' }]];
    if (id) cmds.push(['j', { t: 'usarHabilidade', id, alvo: 'i0' }]);
    c.tick(cmds);
    c.ticks(n);
    return c.ent('j').y + c.ent('j').progressoPasso - 2;
  };

  it('o ataque básico do jogador é livre; a explosão trava; a seta arcana anda devagar', () => {
    expect(hab('ataque_basico').mobilidade).toBe('livre');
    expect(hab('explosao').mobilidade).toBe('trava');
    expect(hab('seta_arcana').mobilidade).toBe('lenta');
    expect(hab('golpe').mobilidade).toBe('trava');
  });

  it('livre anda como sem ação; trava não sai do lugar; lenta anda menos', () => {
    const solto = andouConjurando('aventureiro', null);
    expect(andouConjurando('aventureiro', 'ataque_basico')).toBeCloseTo(solto, 6);
    expect(andouConjurando('aventureiro', 'explosao')).toBeLessThan(solto * 0.2);
    const lenta = andouConjurando('aventureiro', 'seta_arcana');
    expect(lenta).toBeGreaterThan(0);
    expect(lenta).toBeLessThan(solto);
  });

  it('andar conjurando custa no orçamento', () => {
    const base = hab('explosao');
    const r = BALANCE_PADRAO.orcamento;
    expect(poderDaHabilidade({ ...base, mobilidade: 'livre' }, r)).toBeCloseTo(poderDaHabilidade(base, r) * 1.15, 9);
    expect(poderDaHabilidade({ ...base, mobilidade: 'lenta' }, r)).toBeCloseTo(poderDaHabilidade(base, r) * 1.07, 9);
  });
});

describe('atenção do inimigo: tempo mínimo na zona', () => {
  /** Goblin com detecção 3 e hesitação fixa de 2 s, jogador longe; `entrar` põe o jogador na zona. */
  const montar = () => {
    const presets = new Map(CONTEUDO.presets);
    const goblin: PresetInimigo = { ...obter(presets.get('goblin'), 'goblin'), deteccao: 3, hesitacaoS: 2 };
    presets.set('goblin', goblin);
    const ctx: ContextoSimulacao = {
      ...contexto(faseDeTexto(SALA_ABERTA)),
      conteudo: { ...CONTEUDO, presets },
      balance: { ...BALANCE_PADRAO, ia: { ...BALANCE_PADRAO.ia, hesitacao: [], hesitacaoBaseS: 2 } },
    };
    const c = cena(ctx, 'aventureiro', [9, 9], [['goblin', 2, 2]]);
    c.ent('j').autoAtaque = false;
    const mover = (x: number, y: number) => {
      const j = c.ent('j');
      j.x = j.destinoX = x;
      j.y = j.destinoY = y;
    };
    return { ...c, ctx, mover };
  };

  it('ficar na zona: no fim da hesitação, persegue', () => {
    const c = montar();
    c.mover(4, 2);
    c.ticks(5);
    expect(c.ent('i0').ia?.modo).toBe('hesitando');
    c.ticks(ticksDe(2000));
    expect(c.ent('i0').ia?.modo).toBe('perseguindo');
  });

  it('sair durante o "?": a contagem pausa e, passada a graça, o inimigo volta a patrulhar; voltar hesita de novo', () => {
    const c = montar();
    c.mover(4, 2);
    c.ticks(30);
    c.mover(9, 9);
    c.ticks(ticksDe(BALANCE_PADRAO.ia.gracaForaDaZonaMs) - 5);
    expect(c.ent('i0').ia?.modo).toBe('hesitando');
    expect(c.ent('i0').ia?.foraDaZonaTicks).toBeGreaterThan(0);
    c.ticks(10);
    expect(c.ent('i0').ia?.modo).toBe('patrulha');
    expect(c.eventos.some((e) => e.t === 'iaDesistiu')).toBe(true);
    // Voltar à zona começa uma hesitação nova (não persegue de imediato).
    const goblin = c.ent('i0');
    c.mover(goblin.x + 2, goblin.y);
    c.ticks(3);
    expect(c.ent('i0').ia?.modo).toBe('hesitando');
  });

  it('golpear o inimigo durante o "?" faz a perseguição começar na hora', () => {
    const c = montar();
    c.mover(4, 2);
    c.ticks(5);
    c.tick([['j', { t: 'usarHabilidade', id: 'seta_arcana', alvo: 'i0' }]]);
    c.ticks(60);
    expect(c.ent('i0').ia?.modo).toBe('perseguindo');
  });
});

describe('teclado numérico', () => {
  it('Numpad1–Numpad0 valem como os números de cima; o resto não', () => {
    for (let n = 1; n <= 9; n++) {
      expect(indiceDoAtalho(`Digit${n}`)).toBe(n - 1);
      expect(indiceDoAtalho(`Numpad${n}`)).toBe(n - 1);
    }
    expect(indiceDoAtalho('Numpad0')).toBe(9);
    expect(indiceDoAtalho('Digit0')).toBe(9);
    expect(indiceDoAtalho('NumpadAdd')).toBe(-1);
    expect(indiceDoAtalho('KeyQ')).toBe(-1);
  });
});

describe('d20 visível', () => {
  it('faixa pelo resultado: falha 1–3, bom 13–19, crítico 20', () => {
    expect([1, 3, 4, 12, 13, 19, 20].map(faixaDoDado)).toEqual(['falha', 'falha', 'normal', 'normal', 'bom', 'bom', 'critico']);
  });
});

describe('área orgânica (o desenho não é a hitbox)', () => {
  const fase = faseDeTexto(['####################', ...Array.from({ length: 18 }, () => '#..................#'), '####################']);
  const casos: [string, { x: number; y: number }][] = [
    ['explosao', { x: 9, y: 9 }],
    ['bola_de_fogo@3/amplo', { x: 9, y: 9 }],
    ['lanca_de_gelo', { x: 13, y: 7 }],
    ['tiro_em_leque', { x: 12, y: 11 }],
    ['redemoinho', { x: 9, y: 9 }],
    ['nova_glacial', { x: 9, y: 9 }],
    ['grito_de_guerra', { x: 9, y: 9 }],
  ];

  it('o contorno cobre o centro de toda célula atingida, em toda forma e raio', () => {
    for (const [chave, mira] of casos) {
      const h = hab(chave);
      const origem = { x: 9, y: 9 };
      const celulas = celulasDaForma(h, origem, h.tipoArea === 'ao_redor' ? origem : mira, fase);
      expect(celulas.length, chave).toBeGreaterThan(0);
      for (const semente of [1, 2, 99, 12345]) {
        const o = centroDaCelula(origem.x, origem.y);
        const desenho = h.tipoArea === 'linha' ? { tipo: 'faixa' as const, origem: o } : h.tipoArea === 'cone' ? { tipo: 'leque' as const, origem: o } : { tipo: 'radial' as const };
        const { pontos } = contornoDaArea(celulas, semente, desenho);
        for (const c of celulas) expect(dentroDoPoligono(centroDaCelula(c.x, c.y), pontos), `${chave} ${c.x},${c.y}`).toBe(true);
      }
    }
  });

  it('é determinístico pela ação e muda de uma ação para outra', () => {
    const celulas = celulasDaForma(hab('explosao'), { x: 3, y: 3 }, { x: 9, y: 9 }, fase);
    expect(contornoDaArea(celulas, 7)).toEqual(contornoDaArea(celulas, 7));
    expect(contornoDaArea(celulas, 7)).not.toEqual(contornoDaArea(celulas, 8));
  });

  it('a preferência "Mostrar a área exata" é normalizada (desligada por padrão)', () => {
    expect(normalizarPreferencias({}).areaExata).toBe(false);
    expect(normalizarPreferencias({ areaExata: true }).areaExata).toBe(true);
    expect(normalizarPreferencias({ areaExata: 'sim' }).areaExata).toBe(false);
  });
});

describe('save v10', () => {
  it('a IA ganha foraDaZonaTicks = 0, na fase atual e nas visitadas', () => {
    const migrar = obter(MIGRACOES[9], 'v9→v10');
    const ia = { modo: 'hesitando' };
    const r = migrar({ versaoSchema: 9, estado: { entidades: [{ ia }, { ia: null }] }, fasesVisitadas: { a: { entidades: [{ ia }] } } });
    expect((r.estado as { entidades: { ia: unknown }[] }).entidades[0]?.ia).toEqual({ modo: 'hesitando', foraDaZonaTicks: 0 });
    expect((r.estado as { entidades: { ia: unknown }[] }).entidades[1]?.ia).toBeNull();
    expect((r.fasesVisitadas as Record<string, { entidades: { ia: unknown }[] }>).a?.entidades[0]?.ia).toEqual({ modo: 'hesitando', foraDaZonaTicks: 0 });
  });
});
