// D-078 (17/10/2026): sustentação pelo básico e continuidade da navegação na Investida.
import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { aplicarImpacto } from '../../src/combat/golpe';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { avancar } from '../../src/combat/efeitos-instantaneos';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | null | undefined): T { if (v == null) throw new Error('Conteúdo ausente'); return v; }
function cena(classe = 'guerreiro') {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 1, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 3, 3, ctx.balance);
  const a = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'a', 4, 3, ctx.balance);
  j.hpMax = 1000; j.hp = 100; a.hpMax = a.hp = 1000; a.defesa = 0;
  estado.entidades.push(j, a);
  const eventos: EventoSimulacao[] = [];
  const efeito = (tipo: 'escudo' | 'envenenado' | 'imune_dano', valor = 0, pct = 0, alvo = a) => { aplicarEfeito(estado, ctx, alvo, construirEfeito(tipo, { valor, pct, duracaoMs: 10000 }), { acaoId: 0, id: j.id, x: j.x, y: j.y }, null, eventos); };
  const bater = (id = j.ataqueBasico, falha = false) => {
    const hab = { ...obter(resolverHabilidade(ctx, id)), formulaDano: '50', efeitos: [] };
    const fonte = { ...fonteDaHabilidade(j, ctx, 0, hab), bonusAtributo: 0, multRolagem: 1, multDano: 1, carisma: falha ? -30 : 30 };
    aplicarImpacto(estado, ctx, a, { acaoId: 1, fonte, hab, indice: 0 }, eventos);
  };
  return { ctx, estado, j, a, eventos, efeito, bater };
}

describe('recuperação do guerreiro no ataque básico', () => {
  it('cura 10% do HP retirado depois da defesa e do escudo', () => {
    const c = cena(); c.a.defesa = 10; c.efeito('escudo', 20);
    c.bater();
    expect(c.a.hp).toBe(930);
    expect(c.j.hp).toBe(107);
    expect(c.eventos.some((e) => e.t === 'efeitoResultado' && e.tipo === 'cura' && e.cura === 7)).toBe(true);
  });
  it('não conta excesso letal e respeita o máximo de vida', () => {
    const c = cena(); c.a.hp = 10; c.bater(); expect(c.j.hp).toBe(101);
    const cheio = cena(); cheio.j.hp = 999; cheio.bater(); expect(cheio.j.hp).toBe(1000);
  });
  it('recebe a redução de cura do veneno', () => {
    const c = cena(); c.efeito('envenenado', 0, 50, c.j); c.bater(); expect(c.j.hp).toBe(105);
  });
  it('não cura com skill, outra classe, falha, imunidade ou escudo que absorve tudo', () => {
    const skill = cena(); skill.bater('investida'); expect(skill.j.hp).toBe(100);
    const outra = cena('aventureiro'); outra.bater(); expect(outra.j.hp).toBe(100);
    const falha = cena(); falha.bater(undefined, true); expect(falha.j.hp).toBe(100);
    const imune = cena(); imune.efeito('imune_dano'); imune.bater(); expect(imune.j.hp).toBe(100);
    const escudo = cena(); escudo.efeito('escudo', 500); escudo.bater(); expect(escudo.j.hp).toBe(100);
  });
});

it('o avanço recalcula o trajeto até o destino clicado e conserva a direção de movimento', () => {
  const c = cena(); c.j.direcao = 'S'; c.j.caminho = [{ x: 3, y: 4 }, { x: 3, y: 5 }];
  expect(avancar(c.estado, c.ctx, c.j, { x: 5, y: 3 }, 2)).toBe(true);
  expect([c.j.x, c.j.y]).toEqual([5, 3]);
  expect(c.j.caminho.at(-1)).toEqual({ x: 3, y: 5 });
  expect(c.j.direcao).toBe('S');
  expect(Math.abs(obter(c.j.caminho[0]).x - c.j.x) + Math.abs(obter(c.j.caminho[0]).y - c.j.y)).toBe(1);
});
