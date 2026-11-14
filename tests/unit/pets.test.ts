// Marco 40 (13/11/2026, D-165): os companheiros do Aventureiro — a Troca fixa na tecla 1, o lobo e o urso como
// companheiros, as skills de classe pelo companheiro ativo e o grito de fera pela diferença de nível.
import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { companheiroDe } from '../../src/combat/companheiro';
import { aplicarImpacto } from '../../src/combat/golpe';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { duracaoDoGrito, golpeAlcancaOPet, petDe, petDoCompanheiro, reflexoDoPet } from '../../src/combat/pets';
import type { Comando } from '../../src/core/comandos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { simular } from '../../src/core/simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { recalcularFicha } from '../../src/progression/derivados';
import { equiparHabilidade } from '../../src/progression/habilidades-personagem';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const ctx = contexto(faseDeTexto(SALA_ABERTA));

function cena(nivel = 1) {
  const estado = criarEstado({ semente: 4, faseId: ctx.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get('aventureiro')), 'j', 4, 5, ctx.balance);
  j.nivel = nivel;
  estado.entidades.push(j);
  const eventos: EventoSimulacao[] = [];
  const passo = (cmds: Comando[] = [], ms = DT_MS) => {
    for (let t = 0; t < ms; t += DT_MS) simular(estado, ctx, t === 0 ? cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })) : [], eventos, DT_MS);
  };
  const orc = (x: number, y: number, n = 1) => {
    const o = criarInimigo(obter(CONTEUDO.presets.get('orc')), `o${x}${y}`, x, y, ctx.balance);
    o.nivel = n;
    estado.entidades.push(o);
    return o;
  };
  return { estado, j, eventos, passo, orc };
}
const trocar = (c: ReturnType<typeof cena>) => {
  c.passo([{ t: 'usarHabilidade', id: 'troca_de_companheiro' }], 200);
  c.estado.recargas = {};
};
const duracao = (e: Entidade, tipo: string) => {
  const f = e.efeitos.find((x) => x.tipo === tipo);
  return f ? (f.ateTick - f.inicioTick) * DT_MS : 0;
};

describe('companheiros do Aventureiro (D-165)', () => {
  it('a Troca de companheiro fica sempre na tecla 1 e o jogador não a tira de lá', () => {
    const { j, estado } = cena();
    const bolsa = obter(j.bolsa);
    expect(bolsa.barra[0]).toBe('troca_de_companheiro');
    const saida: EventoSimulacao[] = [];
    expect(equiparHabilidade(j, ctx, 'mergulho', 0, estado.tick, saida)).toBe(false);
    expect(equiparHabilidade(j, ctx, 'troca_de_companheiro', 1, estado.tick, saida)).toBe(false);
    expect(equiparHabilidade(j, ctx, null, 0, estado.tick, saida)).toBe(true);
    // Mesmo esvaziada, a ficha a põe de volta.
    expect(bolsa.barra[0]).toBe('troca_de_companheiro');
  });

  it('troca do falcão para o lobo, do lobo para o urso e de volta; o companheiro em campo muda junto', () => {
    const c = cena();
    c.passo([], 100);
    expect(petDoCompanheiro(obter(companheiroDe(c.estado, c.j)))).toBe('falcao');
    trocar(c);
    expect(petDe(c.j)).toBe('lobo');
    c.passo([], 100);
    expect(petDoCompanheiro(obter(companheiroDe(c.estado, c.j)))).toBe('lobo');
    trocar(c);
    c.passo([], 100);
    expect(petDoCompanheiro(obter(companheiroDe(c.estado, c.j)))).toBe('urso');
    trocar(c);
    expect(petDe(c.j)).toBe('falcao');
    expect(c.eventos.filter((e) => e.t === 'companheiroTrocado')).toHaveLength(3);
  });

  it('cada skill de classe muda com o companheiro: o Grito expõe no falcão, rosna no lobo e ruge no urso', () => {
    const c = cena();
    const grito = () => obter(habilidadeDoAtor(ctx, c.j, 'grito_do_falcao'));
    expect(grito().efeitos.map((e) => e.tipo)).toContain('exposto');
    obter(c.j.bolsa).pet = 'lobo';
    expect(grito().nome).toBe('Rosnar');
    expect(grito().politicaImpacto).toBe('area');
    expect(grito().efeitos.find((e) => e.tipo === 'grito_de_fera')?.interno?.tipo).toBe('atordoar');
    obter(c.j.bolsa).pet = 'urso';
    expect(grito().nome).toBe('Rugido');
    expect(grito().efeitos.find((e) => e.tipo === 'grito_de_fera')?.interno?.tipo).toBe('aterrorizado');
    for (const id of ['mergulho', 'garras_cegantes', 'vigia', 'rasante', 'tempestade_de_penas', 'retorno_ao_punho']) {
      const def = obter(CONTEUDO.definicoes.get(id));
      expect(def.variantes.pet_lobo?.nome, id).toBeTruthy();
      expect(def.variantes.pet_urso?.nome, id).toBeTruthy();
    }
  });

  it('o grito de fera: 0,5 s em quem tem nível igual ou maior, +0,1 s por nível a menos', () => {
    const c = cena(20);
    expect(duracaoDoGrito(ctx, c.j, c.orc(1, 1, 25))).toBe(500);
    expect(duracaoDoGrito(ctx, c.j, c.orc(2, 1, 20))).toBe(500);
    expect(duracaoDoGrito(ctx, c.j, c.orc(3, 1, 15))).toBe(1000);
    expect(duracaoDoGrito(ctx, c.j, c.orc(1, 2, 1))).toBe(2400);
  });

  it('o Rosnar atordoa em área e o Rugido apavora, pela diferença de nível', () => {
    const c = cena(10);
    obter(c.j.bolsa).pet = 'lobo';
    obter(c.j.bolsa).barra[1] = 'grito_do_falcao';
    obter(c.j.bolsa).conhecidas.push({ id: 'grito_do_falcao', rank: 1, caminhos: [] });
    recalcularFicha(c.j, ctx);
    c.passo([], 200);
    const lobo = obter(companheiroDe(c.estado, c.j));
    const forte = c.orc(lobo.x + 1, lobo.y, 12);
    const fraco = c.orc(lobo.x - 1, lobo.y + 1, 5);
    c.passo([{ t: 'usarHabilidade', id: 'grito_do_falcao' }], 400);
    expect(duracao(forte, 'atordoar')).toBeCloseTo(500);
    expect(duracao(fraco, 'atordoar')).toBeCloseTo(1000);
    // O Rugido do urso: os mesmos tempos, com medo (foge sem atacar).
    trocar(c);
    obter(c.j.bolsa).pet = 'urso';
    c.estado.recargas = {};
    c.passo([], 600);
    const urso = obter(companheiroDe(c.estado, c.j));
    const outro = c.orc(urso.x, urso.y + 1, 7);
    c.passo([{ t: 'usarHabilidade', id: 'grito_do_falcao' }], 400);
    expect(duracao(outro, 'aterrorizado')).toBeCloseTo(800);
  });

  it('o falcão só leva projéteis; o lobo, de perto; o urso aguenta mais', () => {
    const golpe = obter(habilidadeDoAtor(ctx, cena().orc(1, 1), 'golpe'));
    expect(golpeAlcancaOPet('falcao', golpe)).toBe(false);
    expect(golpeAlcancaOPet('lobo', golpe)).toBe(true);
    expect(golpeAlcancaOPet('urso', { ...golpe, politicaImpacto: 'area' })).toBe(true);
    expect(golpeAlcancaOPet('lobo', { ...golpe, politicaImpacto: 'area' })).toBe(false);
    expect(reflexoDoPet(ctx, 'urso', 30)).toBeLessThan(reflexoDoPet(ctx, 'lobo', 30));
    expect(reflexoDoPet(ctx, 'lobo', 30)).toBeLessThan(reflexoDoPet(ctx, 'falcao', 30));
  });

  it('o lobo colado no dono toma para si um golpe de perto', () => {
    const c = cena();
    obter(c.j.bolsa).pet = 'lobo';
    c.passo([], 100);
    const lobo = obter(companheiroDe(c.estado, c.j));
    lobo.px = c.j.px + 1; lobo.py = c.j.py; lobo.x = c.j.x + 1; lobo.y = c.j.y;
    const o = c.orc(c.j.x - 1, c.j.y);
    const hab = obter(habilidadeDoAtor(ctx, o, o.ataqueBasico));
    aplicarImpacto(c.estado, ctx, c.j, { acaoId: 1, hab, indice: 0, fonte: { ...fonteDaHabilidade(o, ctx, 0, hab), d20Minimo: 20 } }, c.eventos);
    expect(c.eventos.some((e) => e.t === 'impacto' && e.alvoId === 'j')).toBe(true);
    expect(c.estado.recargas[`lobo:intercepta:j`]).toBeGreaterThan(c.estado.tick);
  });
});
