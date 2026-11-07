// 06/11/2026 (D-135): o básico de projétil não atira na parede, as armadilhas novas (dano pela vida atual, puxão,
// Passo leve, runas), os três inimigos novos (pedra encantada, saltador, armadilheiro) e o vínculo do Necromante.
import { describe, expect, it } from 'vitest';
import { iniciarAcao } from '../../src/combat/acao';
import { exigeLinha, tiroLivre } from '../../src/combat/linha-de-tiro';
import { vinculoDosMortos } from '../../src/combat/necromancia';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { dispararArmadilhaEm } from '../../src/combat/efeitos';
import { criarEstado, type Armadilha } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { catalogoDeGeracao } from '../../src/world/gerador';
import { gerarExterior } from '../../src/world/gerador-exterior';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v == null) throw new Error(`${nome} ausente`);
  return v;
}

const COM_PAREDE = [
  '############',
  '#..........#',
  '#..........#',
  '#....#.....#',
  '#....#.....#',
  '#....#.....#',
  '#....#.....#',
  '#....#.....#',
  '#..........#',
  '#..........#',
  '#..........#',
  '############',
];

const preset = (id: string) => obter(CONTEUDO.presets.get(id), id);

function cena(mapa: string[], modo = 'campanha') {
  const ctx = contexto(faseDeTexto(mapa), undefined, modo);
  const estado = criarEstado({ semente: 3, faseId: 'teste' });
  const eventos: EventoSimulacao[] = [];
  const tick = (n = 1) => {
    for (let i = 0; i < n; i++) simular(estado, ctx, [], eventos, DT_MS);
  };
  return { ctx, estado, eventos, tick };
}

function armadilha(id: number, x: number, y: number, extra: Partial<Armadilha> = {}): Armadilha {
  return { id, donoId: 'fase', equipeDono: 'fase', x, y, valor: 20, interno: null, ateTick: 0, origem: 'fase', permanente: true, rearmeTicks: 0, inerteAteTick: 0, reveladaPara: [], ...extra };
}

describe('linha de tiro do básico (D-135)', () => {
  it('a parede fecha a reta; o cajado não precisa dela', () => {
    const { ctx, estado } = cena(COM_PAREDE);
    expect(tiroLivre(estado, ctx, { x: 3, y: 5 }, { x: 7, y: 5 })).toBe(false);
    expect(tiroLivre(estado, ctx, { x: 3, y: 9 }, { x: 7, y: 9 })).toBe(true);
    const necro = criarJogador(obter(CONTEUDO.classes.get('necromante')), 'n', 2, 2, ctx.balance);
    const basico = obter(habilidadeDoAtor(ctx, necro, necro.ataqueBasico));
    expect(exigeLinha(ctx, necro, basico)).toBe(false);
  });

  it('o esqueleto não atira em quem está atrás da parede', () => {
    const { ctx, estado, eventos } = cena(COM_PAREDE);
    const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 7, 5, ctx.balance);
    const s = criarInimigo(preset('esqueleto'), 's', 3, 5, ctx.balance);
    estado.entidades.push(j, s);
    expect(iniciarAcao(estado, ctx, s, s.ataqueBasico, j.id, eventos)).toBe(false);
    expect(eventos.some((e) => e.t === 'acaoRecusada' && e.motivo === 'fora_de_alcance')).toBe(true);
    j.x = 7; j.y = 9; j.px = 7; j.py = 9;
    s.x = 3; s.y = 9; s.px = 3; s.py = 9;
    expect(iniciarAcao(estado, ctx, s, s.ataqueBasico, j.id, eventos)).toBe(true);
  });
});

describe('armadilhas (D-135)', () => {
  it('ferem o valor mais 12% da vida atual e puxam para o hostil mais perto', () => {
    const { ctx, estado, eventos } = cena(SALA_ABERTA);
    const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 2, 5, ctx.balance);
    const g = criarInimigo(preset('goblin'), 'g', 8, 5, ctx.balance);
    estado.entidades.push(j, g);
    const antes = j.hp;
    const a = armadilha(500, 2, 5);
    estado.armadilhas.push(a);
    dispararArmadilhaEm(estado, ctx, a, j, eventos);
    const dano = antes - j.hp;
    // A explosão atordoa e não tem defesa: o dano é o valor mais a parte da vida (arredondado).
    expect(dano).toBeGreaterThanOrEqual(Math.round(20 + antes * 0.12) - 1);
    expect(j.x).toBeGreaterThan(2);
    expect(eventos.some((e) => e.t === 'deslocado' && e.id === 'j')).toBe(true);
  });

  it('o Passo leve gasta-se e a armadilha não fere', () => {
    const { ctx, estado, eventos } = cena(SALA_ABERTA);
    const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 2, 5, ctx.balance);
    estado.entidades.push(j);
    j.efeitos.push({ ...construirEfeito('passo_leve'), ateTick: 10_000, origemId: 'j', desdeTick: 0 } as unknown as Entidade['efeitos'][number]);
    const antes = j.hp;
    const a = armadilha(501, 2, 5);
    dispararArmadilhaEm(estado, ctx, a, j, eventos);
    expect(j.hp).toBe(antes);
    expect(j.efeitos.some((f) => f.tipo === 'passo_leve')).toBe(false);
    expect(eventos.some((e) => e.t === 'armadilhaDisparou' && e.protegido)).toBe(true);
  });
});

describe('inimigos novos (D-135)', () => {
  it('a pedra do Arremessador afim sai com o elemento dele', () => {
    const { ctx } = cena(SALA_ABERTA);
    const a = criarInimigo(preset('arremessador'), 'a', 2, 2, ctx.balance);
    expect(habilidadeDoAtor(ctx, a, a.ataqueBasico)?.elemento ?? null).toBeNull();
    a.afinidade = { elemento: 'fogo', extrema: false };
    expect(habilidadeDoAtor(ctx, a, a.ataqueBasico)?.elemento).toBe('fogo');
  });

  it('o duende corre e salta no alvo', () => {
    const { ctx, estado, eventos, tick } = cena(SALA_ABERTA);
    const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 9, 5, ctx.balance);
    j.autoAtaque = false;
    const d = criarInimigo(preset('duende_saltador'), 'd', 3, 5, ctx.balance);
    estado.entidades.push(j, d);
    tick(60 * 5);
    expect(eventos.some((e) => e.t === 'acaoIniciada' && e.atorId === 'd' && e.habilidadeId === 'salto_do_duende')).toBe(true);
    expect(eventos.some((e) => e.t === 'deslocado' && e.id === 'd' && e.causa === 'avanco')).toBe(true);
  });

  it('o runista foge plantando runas de pé e para para descansar', () => {
    const { ctx, estado, tick } = cena(SALA_ABERTA, 'mundo');
    const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 6, 6, ctx.balance);
    j.autoAtaque = false;
    const r = criarInimigo(preset('runista_medroso'), 'r', 3, 6, ctx.balance);
    estado.entidades.push(j, r);
    const fases = new Set<string>();
    for (let i = 0; i < 60 * 10; i++) {
      tick();
      if (r.ia?.especial) fases.add(r.ia.especial);
    }
    expect(estado.armadilhas.filter((a) => a.runa && a.donoId === 'r').length).toBeGreaterThan(1);
    expect(fases.has('fuga') && fases.has('descanso')).toBe(true);
  });

  it('o runista é só do Mundo; o exterior do Mundo tem armadilhas', () => {
    const cat = catalogoDeGeracao(CONTEUDO, []);
    expect(cat.comuns).not.toContain('runista_medroso');
    expect(cat.comuns).not.toContain('duende_saltador');
    const reino = obter([...CONTEUDO.reinos.values()][0]);
    const regiao = obter(reino.regioes.find((x) => x.perigo === 'normal'));
    const ext = gerarExterior(reino, regiao);
    expect((ext.fase.objetos ?? []).filter((o) => o.tipo === 'armadilha').length).toBeGreaterThan(10);
  });
});

describe('vínculo do Necromante (D-135)', () => {
  it('cura com o dano que o morto causa e leva', () => {
    const { ctx, estado, eventos } = cena(SALA_ABERTA);
    const n = criarJogador(obter(CONTEUDO.classes.get('necromante')), 'n', 2, 2, ctx.balance);
    const servo = criarInimigo(preset('servo_ossuario'), 's', 3, 3, ctx.balance);
    servo.invocacao = { donoId: 'n', expiraTick: 1e9, dominado: false } as Entidade['invocacao'];
    const g = criarInimigo(preset('goblin'), 'g', 4, 4, ctx.balance);
    estado.entidades.push(n, servo, g);
    n.hp = n.hpMax - 50;
    vinculoDosMortos(estado, ctx, servo, g, 100, eventos);
    expect(n.hp).toBe(n.hpMax - 50 + 8);
    vinculoDosMortos(estado, ctx, g, servo, 100, eventos);
    expect(n.hp).toBe(n.hpMax - 50 + 14);
  });
});

describe('Vista de armadilha (D-135)', () => {
  it('o efeito revela sem teste no raio; o Pó revelador o aplica e está nas lojas do Mundo', () => {
    const { ctx, estado, eventos, tick } = cena(SALA_ABERTA);
    const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 2, 2, ctx.balance);
    j.autoAtaque = false;
    estado.entidades.push(j);
    estado.armadilhas.push(armadilha(600, 8, 8));
    j.efeitos.push({ ...construirEfeito('vista_de_armadilha'), ateTick: 10_000, origemId: 'j', desdeTick: 0 } as unknown as Entidade['efeitos'][number]);
    tick(70);
    expect(estado.armadilhas[0]?.reveladaPara).toContain('j');
    expect(eventos.some((e) => e.t === 'armadilhaRevelada')).toBe(true);
    const po = obter(CONTEUDO.itens.get('po_revelador'));
    expect(po.efeitos.map((f) => f.tipo)).toEqual(['vista_de_armadilha']);
    for (const r of CONTEUDO.reinos.values()) expect(Object.values(r.lojas).flat()).toContain('po_revelador');
  });
});
