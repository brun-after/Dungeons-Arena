// Marco 40 (13/11/2026, D-164): o movimento da classe — o Voo Arcano, a Tirolesa, a Marcha, a Névoa e o Lobo, os
// limites em combate, os telhados e a imunidade ao que está no chão.
import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { aplicarImpacto } from '../../src/combat/golpe';
import {
  fatorDeConjuracaoDoMovimento,
  fatorDeDanoDoMovimento,
  fatorDeVelocidade,
  movimentoAtivo,
  movimentosLiberados,
  noAr,
} from '../../src/combat/movimento-classe';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { lerComando } from '../../src/arena/protocolo';
import type { Comando } from '../../src/core/comandos';
import { criarEstado, type EstadoJogo } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { simular } from '../../src/core/simulacao';
import { clonarEntidade, type Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { carregarFase } from '../../src/world/fase';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const ctx = contexto(faseDeTexto(SALA_ABERTA));

function cena(classe: string, nivel = 1, c = ctx) {
  const estado = criarEstado({ semente: 3, faseId: c.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 2, 5, c.balance);
  j.nivel = nivel;
  estado.entidades.push(j);
  const eventos: EventoSimulacao[] = [];
  const passo = (cmds: Comando[] = [], ms = DT_MS) => {
    for (let t = 0; t < ms; t += DT_MS) {
      simular(estado, c, t === 0 ? cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })) : [], eventos, DT_MS);
    }
  };
  return { estado, j, eventos, passo };
}
const modo = (e: Entidade) => e.movimentoClasse?.modo?.tipo;
const emCombateCom = (estado: EstadoJogo, e: Entidade) => e.participacao.push({ id: 'x', tick: estado.tick });

describe('movimento da classe (D-164)', () => {
  it('cada classe tem a de longa distância no nível 1 e mais duas nos níveis 10 e 20; o G troca', () => {
    for (const classe of ['mago', 'arqueiro', 'guerreiro', 'necromante', 'aventureiro']) {
      const lista = obter(CONTEUDO.movimentos.get(classe));
      expect(lista[0]?.nivel).toBe(1);
      expect(['voo', 'tirolesa', 'marcha', 'nevoa', 'montaria']).toContain(lista[0]?.tipo);
    }
    const { j, passo } = cena('mago', 25);
    expect(movimentosLiberados(ctx, j)).toHaveLength(3);
    expect(movimentoAtivo(ctx, j)?.id).toBe('voo_arcano');
    passo([{ t: 'trocarMovimento' }]);
    expect(movimentoAtivo(ctx, j)?.id).toBe('piscar');
    const baixo = cena('mago', 5);
    baixo.passo([{ t: 'trocarMovimento' }]);
    expect(movimentoAtivo(ctx, baixo.j)?.id).toBe('voo_arcano');
  });

  it('o Voo Arcano decola, voa rápido fora de combate e não deixa dar o básico', () => {
    const { j, estado, eventos, passo } = cena('mago');
    passo([{ t: 'movimentoClasse' }]);
    expect(modo(j)).toBe('preparo');
    passo([], 1100);
    expect(modo(j)).toBe('voo');
    expect(noAr(j)).toBe(true);
    expect(fatorDeVelocidade(ctx, j)).toBeCloseTo(1 + ctx.balance.movimentoClasse.viagemPct / 100);
    const orc = criarInimigo(obter(CONTEUDO.presets.get('orc')), 'o', 3, 5, ctx.balance);
    estado.entidades.push(orc);
    passo([{ t: 'ataqueBasico', alvo: 'o' }]);
    expect(eventos.some((e) => e.t === 'acaoRecusada' && e.motivo === 'movimento')).toBe(true);
    // Pousa no mesmo botão.
    passo([{ t: 'movimentoClasse' }]);
    expect(modo(j)).toBeUndefined();
  });

  it('voando, as magias batem 30% (50% no 100), conjuram 50% mais (20% no 100) e o voo fica lento em combate', () => {
    const { j, estado } = cena('mago');
    j.movimentoClasse = { ativo: 'voo_arcano', cargas: {}, modo: { tipo: 'voo', id: 'voo_arcano', desdeTick: 0, combate: true } };
    expect(fatorDeDanoDoMovimento(ctx, j)).toBeCloseTo(0.3);
    expect(fatorDeConjuracaoDoMovimento(ctx, j)).toBeCloseTo(1.5);
    expect(fatorDeVelocidade(ctx, j)).toBeCloseTo(0.5);
    j.nivel = 100;
    expect(fatorDeDanoDoMovimento(ctx, j)).toBeCloseTo(0.5);
    expect(fatorDeConjuracaoDoMovimento(ctx, j)).toBeCloseTo(1.2);
    expect(fatorDeVelocidade(ctx, j)).toBeCloseTo(0.8);
    const hab = obter(habilidadeDoAtor(ctx, j, obter(j.bolsa).barra.find((x) => x !== null) ?? ''));
    const voando = fonteDaHabilidade(j, ctx, estado.tick, hab).multDano;
    delete j.movimentoClasse;
    expect(voando / fonteDaHabilidade(j, ctx, estado.tick, hab).multDano).toBeCloseTo(0.5);
  });

  it('o golpe de perto, do chão, não alcança quem voa', () => {
    const { j, estado } = cena('mago');
    const orc = criarInimigo(obter(CONTEUDO.presets.get('orc')), 'o', 3, 5, ctx.balance);
    estado.entidades.push(orc);
    j.movimentoClasse = { ativo: 'voo_arcano', cargas: {}, modo: { tipo: 'voo', id: 'voo_arcano', desdeTick: 0 } };
    const hab = obter(habilidadeDoAtor(ctx, orc, orc.ataqueBasico));
    expect(hab.politicaImpacto).toBe('contato');
    const saida: EventoSimulacao[] = [];
    const hp = j.hp;
    aplicarImpacto(estado, ctx, j, { acaoId: 1, fonte: fonteDaHabilidade(orc, ctx, 0, hab), hab, indice: 0 }, saida);
    expect(j.hp).toBe(hp);
    expect(saida.some((e) => e.t === 'esquivou')).toBe(true);
  });

  it('voando, sobe no telhado; não pousa nem ataca de lá', () => {
    const mapa = ['##########', '#........#', '#...##...#', '#...##...#', '#........#', '##########'];
    const fase = carregarFase({ id: 't', nome: 't', ordem: 1, tipo: 'campanha', mapa, spawns: [{ x: 1, y: 1 }], telhados: [{ x: 4, y: 2, largura: 2, altura: 2, revela: 'perto', estilo: 'telha' }] });
    const c = contexto(fase);
    const { j, eventos, passo } = cena('mago', 1, c);
    j.movimentoClasse = { ativo: 'voo_arcano', cargas: {}, modo: { tipo: 'voo', id: 'voo_arcano', desdeTick: 0 } };
    j.px = 2; j.py = 2; j.x = 2; j.y = 2;
    passo([{ t: 'mover', dir: 'E', dx: 1000, dy: 0 }], 600);
    passo([{ t: 'mover', dir: 'parado' }]);
    expect(j.x).toBeGreaterThanOrEqual(4);
    expect(j.x).toBeLessThanOrEqual(5);
    passo([{ t: 'movimentoClasse' }]);
    expect(modo(j)).toBe('voo');
    expect(eventos.some((e) => e.t === 'movimentoClasse' && e.motivo === 'pouso')).toBe(true);
  });

  it('a Tirolesa corre reta, não muda de rumo e para na parede', () => {
    const { j, passo } = cena('arqueiro');
    j.olhando = 'E';
    passo([{ t: 'movimentoClasse', dx: 1000, dy: 0 }]);
    expect(modo(j)).toBe('tirolesa');
    passo([{ t: 'mover', dir: 'S', dx: 0, dy: 1000 }], 200);
    expect(j.y).toBe(5);
    passo([{ t: 'mover', dir: 'parado' }], 1500);
    expect(modo(j)).toBeUndefined();
    expect(j.x).toBe(10);
    expect(j.y).toBe(5);
  });

  it('a Marcha come a fúria em combate; montado no Lobo, o golpe derruba', () => {
    const g = cena('guerreiro');
    g.passo([{ t: 'movimentoClasse' }]);
    expect(modo(g.j)).toBe('marcha');
    g.j.furia = { valor: 10, ultimoTick: g.estado.tick };
    emCombateCom(g.estado, g.j);
    g.passo([], 600);
    expect(g.j.furia.valor).toBeLessThan(10);
    expect(fatorDeVelocidade(ctx, g.j)).toBeCloseTo(1 + ctx.balance.movimentoClasse.marcha.combatePct / 100);

    const a = cena('aventureiro');
    a.passo([{ t: 'movimentoClasse' }]);
    a.passo([], 600);
    expect(modo(a.j)).toBe('montado');
    expect(fatorDeDanoDoMovimento(ctx, a.j)).toBeCloseTo(0.6);
    const orc = criarInimigo(obter(CONTEUDO.presets.get('orc')), 'o', 3, 5, ctx.balance);
    a.estado.entidades.push(orc);
    const hab = obter(habilidadeDoAtor(ctx, orc, orc.ataqueBasico));
    for (let i = 0; i < 6 && modo(a.j); i++) aplicarImpacto(a.estado, ctx, a.j, { acaoId: i, fonte: { ...fonteDaHabilidade(orc, ctx, 0, hab), d20Minimo: 20 }, hab, indice: 0 }, []);
    expect(modo(a.j)).toBeUndefined();
  });

  it('a Forma de Névoa fora de combate deixa intocável; o clone copia o estado; a rede aceita os comandos', () => {
    const { j, passo } = cena('necromante');
    passo([{ t: 'movimentoClasse' }]);
    expect(modo(j)).toBe('nevoa');
    expect(j.efeitos.some((f) => f.tipo === 'imune_dano')).toBe(true);
    const copia = clonarEntidade(j);
    obter(copia.movimentoClasse).cargas['forma_de_nevoa']?.push(99);
    expect(obter(j.movimentoClasse).cargas['forma_de_nevoa']).toHaveLength(1);
    expect(lerComando({ t: 'movimentoClasse', dx: 1000, dy: -1000 })).toEqual({ t: 'movimentoClasse', dx: 1000, dy: -1000 });
    expect(lerComando({ t: 'movimentoClasse' })).toEqual({ t: 'movimentoClasse' });
    expect(lerComando({ t: 'movimentoClasse', dx: 5000, dy: 0 })).toBeNull();
    expect(lerComando({ t: 'trocarMovimento' })).toEqual({ t: 'trocarMovimento' });
  });
});
