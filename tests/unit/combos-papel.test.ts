// Marco 40 (13/11/2026, D-163): os combos de papel — a skill anterior de um papel e esta de outro mudam esta — e o
// desdobramento pelo eixo mais forte.
import { describe, expect, it } from 'vitest';
import { papelDe } from '../../src/combat/combos-papel';
import { comCombosDoLancamento } from '../../src/combat/combos-assinados';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import type { Habilidade } from '../../src/combat/habilidades';
import type { Papel } from '../../src/combat/eixos';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarEntidade } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const hab = (chave: string) => obter(resolverHabilidade(ctx, chave));

function cena(papelAntes: Papel, alvoNoAntes = true) {
  const estado = criarEstado({ semente: 5, faseId: ctx.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 3, 3, ctx.balance);
  const inimigo = criarEntidade({ id: 'i', tipo: 'inimigo', x: 4, y: 3, hpMax: 100, nivel: 1, xpBase: 10 });
  estado.entidades.push(j, inimigo);
  j.ultimaDePapel = { id: 'outra', papel: papelAntes, tick: 0, alvoId: alvoNoAntes ? 'i' : null, atingidos: 2, abateu: false, alvos: ['i'], miraX: 4, miraY: 3 };
  const saida: EventoSimulacao[] = [];
  const lancar = (h: Habilidade) => comCombosDoLancamento(estado, ctx, j, h, inimigo, { x: inimigo.x, y: inimigo.y }, saida);
  return { estado, j, inimigo, saida, lancar };
}
const feitos = (saida: EventoSimulacao[]) => saida.flatMap((e) => (e.t === 'comboFeito' ? [e.combo] : []));
const ativo = (h: Habilidade, papel: Papel): Habilidade => ({ ...h, papel });

describe('combos de papel (D-163)', () => {
  it('cada combo do Códex está nos dados, e toda skill tem papel', () => {
    expect(CONTEUDO.combosDePapel.combos.size).toBe(17);
    expect(Object.keys(CONTEUDO.combosDePapel.desdobramentos)).toHaveLength(9);
    for (const d of CONTEUDO.definicoes.values()) expect(['dano', 'controle', 'cura', 'defesa', 'mobilidade', 'invocacao']).toContain(papelDe(d.base));
    expect(papelDe(hab('levante_profano'))).toBe('invocacao');
  });

  it('Golpe no preso: +30% de dano e o controle no alvo dura mais', () => {
    const c = cena('controle');
    c.inimigo.efeitos.push({ ...construirEfeito('enraizado', { duracaoMs: 1000 }), ateTick: 20, proximoTick: 0, inicioTick: 0, acumulos: 1, origemId: 'j' });
    const base = ativo(hab('lamina_em_brasa'), 'dano');
    const h = c.lancar(base);
    expect(feitos(c.saida)).toEqual(['golpe_no_preso']);
    expect(h.multDano).toBeCloseTo(base.multDano * 1.3);
    expect(c.inimigo.efeitos[0]?.ateTick).toBeGreaterThan(20);
  });

  it('sem o alvo preso, não há Golpe no preso; fora da janela, nenhum combo', () => {
    const c = cena('controle');
    c.lancar(ativo(hab('lamina_em_brasa'), 'dano'));
    expect(feitos(c.saida)).toEqual([]);
    const d = cena('mobilidade');
    d.estado.tick = 10_000;
    d.lancar(ativo(hab('lamina_em_brasa'), 'dano'));
    expect(feitos(d.saida)).toEqual([]);
  });

  it('Prisão dupla dobra o controle e deixa o alvo firme depois', () => {
    const c = cena('controle');
    const base = ativo({ ...hab('lamina_em_brasa'), efeitos: [construirEfeito('atordoar', { duracaoMs: 1000 })] }, 'controle');
    const h = c.lancar(base);
    expect(feitos(c.saida)).toEqual(['prisao_dupla']);
    expect(h.efeitos.find((e) => e.tipo === 'atordoar')?.duracaoMs).toBe(2000);
    expect(h.efeitos.find((e) => e.tipo === 'efeito_atrasado')?.interno?.tipo).toBe('firme');
  });

  it('Embalo empurra; Ritmo devolve metade do custo', () => {
    const c = cena('mobilidade');
    const h = c.lancar(ativo(hab('lamina_em_brasa'), 'dano'));
    expect(feitos(c.saida)).toEqual(['embalo']);
    expect(h.efeitos.some((e) => e.tipo === 'empurrao')).toBe(true);
    const r = cena('mobilidade');
    r.j.mana = 0;
    const mover = ativo({ ...hab('lamina_em_brasa'), custoRecurso: 10 }, 'mobilidade');
    r.lancar(mover);
    expect(feitos(r.saida)).toEqual(['ritmo']);
    expect(r.j.mana).toBe(5);
  });

  it('Sangue por sangue cresce a cura por inimigo atingido', () => {
    const c = cena('dano');
    const base = ativo(hab('lamina_em_brasa'), 'cura');
    expect(c.lancar(base).multCura).toBeCloseTo(base.multCura * 1.5);
  });

  it('o eixo da skill desdobra: com a marca, o combo deixa uma marca a mais', () => {
    const c = cena('mobilidade');
    const h = c.lancar({ ...ativo(hab('lamina_em_brasa'), 'dano'), formas: [{ mod: 'marca', faixa: 6 }] });
    expect(h.efeitos.some((e) => e.tipo === 'marca_estilo')).toBe(true);
  });
});

describe('combos assinados das classes (D-163)', () => {
  it('são seis por classe, entre skills da classe', () => {
    const porClasse = new Map<string, number>();
    for (const k of CONTEUDO.combosAssinados.values()) {
      porClasse.set(k.classe, (porClasse.get(k.classe) ?? 0) + 1);
      const c = obter(CONTEUDO.classes.get(k.classe));
      for (const id of [k.antes, k.depois]) expect([...c.exclusivas, ...c.saidas]).toContain(id);
    }
    expect([...porClasse.values()]).toEqual([6, 6, 6, 6, 6]);
  });

  it('o assinado vem no lugar do de papel: o Aríete aumenta a área do tremor', () => {
    const c = cena('mobilidade');
    obter(c.j.ultimaDePapel).id = 'investida_de_escudo';
    const base = hab('salto_esmagador');
    const h = c.lancar(base);
    expect(feitos(c.saida)).toEqual(['ariete']);
    expect(h.raioArea).toBe(base.raioArea + 1);
  });

  it('o Moedor puxa quem a investida atingiu; a Tempestade de aço agenda a saraivada central', () => {
    const c = cena('mobilidade');
    obter(c.j.ultimaDePapel).id = 'investida_de_escudo';
    c.inimigo.x = 7;
    c.lancar(hab('redemoinho'));
    expect(c.inimigo.x).toBeLessThan(7);
    const d = cena('dano');
    obter(d.j.ultimaDePapel).id = 'chuva_de_flechas';
    d.lancar(hab('tiro_em_leque'));
    expect(d.estado.fases?.some((f) => f.chave === 'combo_saraivada_central' && f.x === 4 && f.y === 3)).toBe(true);
  });
});
