// 07/11/2026 (D-135, D-136): o Necromante sem cura nem escudo próprios; as Lanças da escuridão saem dos mortos; o Dardo
// funesto espera no círculo no ar e acumula cargas.
import { describe, expect, it } from 'vitest';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { processarServosNecromantes } from '../../src/combat/necromancia';
import { iniciarAcao, processarAcoes, recargaRestante } from '../../src/combat/acao';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { cargasProntas } from '../../src/combat/cargas';
import { ticksDe } from '../../src/core/tempo';
import { somDaHabilidade, sonsDoEvento } from '../../src/audio/mapeamento';

function obter<T>(v: T | null | undefined): T { if (v == null) throw Error('ausente'); return v; }
function cena() {
  const ctx = contexto(faseDeTexto(SALA_ABERTA), undefined, 'cooperativo');
  const estado = criarEstado({ faseId: 'teste', semente: 1 }); // marco 39: as mecânicas dos estilos também sorteiam; esta semente não tira falha crítica na lança
  const j = criarJogador(obter(CONTEUDO.classes.get('necromante')), 'j', 5, 5, ctx.balance);
  j.equipe = 'grupo'; j.autoAtaque = false; j.mana = 999;
  // Marco 40 (D-159): as Lanças saíram do kit; a mecânica segue no motor, e o teste dá a skill ao Necromante.
  const bolsa = obter(j.bolsa); bolsa.conhecidas.push({ id: 'dizimo_vital', rank: 1, caminhos: [] }); bolsa.barra[1] = 'dizimo_vital'; j.habilidades = bolsa.barra.filter((x): x is string => x !== null);
  estado.entidades.push(j);
  const eventos: EventoSimulacao[] = [];
  const npc = (id: string, x: number, y: number) => {
    const e = criarInimigo(obter(CONTEUDO.presets.get('goblin')), id, x, y, ctx.balance);
    e.equipe = 'monstros'; e.hp = e.hpMax = 10_000; e.ia = null; estado.entidades.push(e); return e;
  };
  const servo = () => obter(estado.entidades.find((e) => e.invocacao?.donoId === 'j' && e.invocacao.necromancia === 'servo'));
  const ate = (tick: number) => { while (estado.tick < tick) { estado.tick++; processarAcoes(estado, ctx, eventos); } };
  return { ctx, estado, j, eventos, npc, servo, ate };
}

describe('Necromante sem suporte (D-135)', () => {
  it('nenhuma skill do kit cura ou dá escudo a quem conjura', () => {
    const c = cena();
    const kit = obter(CONTEUDO.classes.get('necromante'));
    for (const id of [...kit.exclusivas, obter(kit.geralInicial)]) {
      const h = obter(resolverHabilidade(c.ctx, id));
      expect(h.efeitos.some((e) => ['cura', 'escudo', 'drenar_invocacao', 'cura_periodica'].includes(e.tipo)), id).toBe(false);
    }
    // Marco 40 (D-159): a Praga sepulcral virou o Véu sombrio, que intercepta e envenena quem bate (sem escudo nem cura).
    expect(obter(resolverHabilidade(c.ctx, 'mortalha_funebre')).efeitos.map((e) => e.tipo)).toEqual(['intercepta', 'reflexo']);
  });
});

describe('Lanças da escuridão (D-136)', () => {
  it('sem morto, é recusada sem gastar mana', () => {
    const c = cena(); const mana = c.j.mana;
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'dizimo_vital', undefined, c.eventos)).toBe(false);
    expect(c.j.mana).toBe(mana);
  });
  it('o Necromante para e conjura; a lança sai do morto, perfura o alvo e 1 célula atrás', () => {
    const c = cena(); processarServosNecromantes(c.estado, c.ctx, c.eventos);
    const s = c.servo(); s.x = 5; s.y = 8; s.ia = null;
    const a = c.npc('a', 8, 8); const b = c.npc('b', 9, 8); const longe = c.npc('l', 10, 8);
    c.j.alvoSelecionado = 'a';
    expect(obter(resolverHabilidade(c.ctx, 'dizimo_vital')).mobilidade).toBe('trava');
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'dizimo_vital', undefined, c.eventos)).toBe(true);
    c.ate(obter(c.j.acao).lancamentoTick);
    expect(c.eventos.find((e) => e.t === 'lancaDeOsso')).toMatchObject({ mortoId: s.id, deX: 5, deY: 8, paraX: 9, paraY: 8 });
    const golpes = c.eventos.filter((e) => e.t === 'impacto' && e.habilidadeId === 'dizimo_vital');
    expect(golpes.map((e) => (e.t === 'impacto' ? e.alvoId : ''))).toEqual(['a', 'b']);
    expect(a.hp).toBeLessThan(a.hpMax); expect(b.hp).toBeLessThan(b.hpMax); expect(longe.hp).toBe(longe.hpMax);
  });
  it('as evoluções: 2 células além no nível 2 e as lanças para os lados no 4', () => {
    const c = cena();
    expect(obter(resolverHabilidade(c.ctx, 'dizimo_vital')).lanca).toEqual({ alem: 1, lados: false });
    expect(obter(resolverHabilidade(c.ctx, 'dizimo_vital@2')).lanca).toEqual({ alem: 2, lados: false });
    expect(obter(resolverHabilidade(c.ctx, 'dizimo_vital@4')).lanca).toEqual({ alem: 2, lados: true });
  });
  it('cada morto lança a sua; quem leva mais de uma leva menos a cada uma', () => {
    const c = cena(); processarServosNecromantes(c.estado, c.ctx, c.eventos);
    const s = c.servo(); s.x = 5; s.y = 8; s.ia = null;
    c.estado.entidades.push({ ...s, id: 'r2', x: 8, y: 5, invocacao: { ...obter(s.invocacao), necromancia: 'reanimado' } });
    c.npc('a', 8, 8); c.j.alvoSelecionado = 'a';
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'dizimo_vital', undefined, c.eventos)).toBe(true);
    c.ate(obter(c.j.acao).lancamentoTick);
    expect(c.eventos.filter((e) => e.t === 'lancaDeOsso')).toHaveLength(2);
    expect(c.eventos.filter((e) => e.t === 'impacto' && e.habilidadeId === 'dizimo_vital' && e.alvoId === 'a')).toHaveLength(2);
  });
});

describe('Dardo funesto (D-136)', () => {
  it('o dardo espera 2 s no círculo no ar, parado onde foi conjurado, e sai de lá', () => {
    const c = cena(); c.npc('a', 9, 5);
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'dardo_funesto', 'a', c.eventos)).toBe(true);
    c.ate(obter(c.j.acao).lancamentoTick);
    const fase = obter(c.estado.fases?.[0]);
    expect(fase).toMatchObject({ origemX: 5, origemY: 5, alvoId: 'a' });
    expect(c.eventos.some((e) => e.t === 'projetilLancado')).toBe(false);
    c.j.x = 2;
    c.ate(fase.tick);
    expect(c.eventos.some((e) => e.t === 'projetilLancado')).toBe(true);
    expect(obter(c.estado.projeteis[0]).x).toBeGreaterThanOrEqual(5);
  });
  it('acumula 2 cargas, até 6 com Acúmulo e Arsenal; Pressa e Gatilho encurtam o disparo', () => {
    const c = cena(); c.npc('a', 9, 5);
    const h = obter(resolverHabilidade(c.ctx, 'dardo_funesto'));
    expect([h.cargas, h.disparoMs]).toEqual([2, 2000]);
    expect(obter(resolverHabilidade(c.ctx, 'dardo_funesto@5/acumulo,arsenal')).cargas).toBe(6);
    expect(obter(resolverHabilidade(c.ctx, 'dardo_funesto@5/pressa,gatilho')).disparoMs).toBeLessThan(1000);
    const chave = 'j_dardo_funesto';
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'dardo_funesto', 'a', c.eventos)).toBe(true);
    c.ate(obter(c.j.acao).lancamentoTick);
    expect(cargasProntas(c.estado, chave, h)).toBe(1);
    expect(recargaRestante(c.estado, 'j', 'dardo_funesto')).toBe(0);
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'dardo_funesto', 'a', c.eventos)).toBe(true);
    c.ate(obter(c.j.acao).lancamentoTick);
    expect(cargasProntas(c.estado, chave, h)).toBe(0);
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'dardo_funesto', 'a', c.eventos)).toBe(false);
    c.ate(c.estado.tick + ticksDe(h.recargaMs));
    expect(cargasProntas(c.estado, chave, h)).toBe(1);
  });
});

describe('Sons do Necromante (D-136)', () => {
  it('as skills soam graves (sombra ou ossos); o surgimento dos mortos segue a risada', () => {
    const c = cena();
    const h = (id: string) => obter(resolverHabilidade(c.ctx, id));
    expect(somDaHabilidade(h('dardo_funesto'))).toBe('necro_sombra');
    expect(somDaHabilidade(h('dizimo_vital'))).toBe('necro_ossos');
    expect(somDaHabilidade(h('explosao_cadaverica'))).toBe('necro_ossos');
    expect(somDaHabilidade(h('basico_cajado'), true)).toBe('zunido');
    const pedir = (ev: EventoSimulacao) => sonsDoEvento(ev, 'j', (chave) => resolverHabilidade(c.ctx, chave)).map((s) => s.som);
    expect(pedir({ t: 'acaoIniciada', tick: 1, acaoId: 1, atorId: 'j', habilidadeId: 'dardo_funesto', chave: 'dardo_funesto', alvoId: null, alvoX: 0, alvoY: 0, inicioTick: 1, lancamentoTick: 2, impactoPrevistoTick: 3 })).toEqual(['necro_conjura']);
    expect(pedir({ t: 'invocou', tick: 1, donoId: 'j', id: 's' })).toEqual(['invocacao']);
    expect(pedir({ t: 'lancaDeOsso', tick: 1, acaoId: 1, chave: 'dizimo_vital', donoId: 'j', mortoId: 's', deX: 0, deY: 0, paraX: 1, paraY: 0 })).toEqual(['necro_ossos']);
  });
});

// Marco 40 (13/11/2026, D-160): o Juízo das trevas era uma das 140 ultimates antigas, que saíram.
