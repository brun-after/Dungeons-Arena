// Marco 24 (24/10/2026, D-095): a sintonia pelas gerais das teclas 3 a 6 — Domínio com 2 da mesma família (marca a
// ultimate), vertente com 2 + 2 das famílias certas da classe.
import { describe, expect, it } from 'vitest';
import { cargaDe } from '../../src/combat/carga-ultimate';
import { chaveDoAtor } from '../../src/combat/perfil';
import { lerComando } from '../../src/arena/protocolo';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { forcaDaSintonia, sintoniaDasGerais, sintoniaDe } from '../../src/progression/sintonia';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena(classe = 'guerreiro', gerais: (string | null)[] = []) {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 5, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 3, 5, ctx.balance);
  const bolsa = obter(j.bolsa);
  gerais.forEach((id, i) => {
    if (id && !bolsa.conhecidas.some((c) => c.id === id)) bolsa.conhecidas.push({ id, rank: 1, caminhos: [] });
    bolsa.barra[2 + i] = id;
  });
  j.habilidades = bolsa.barra.filter((id): id is string => id !== null);
  estado.entidades.push(j, criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'b', 4, 5, ctx.balance));
  const eventos: EventoSimulacao[] = [];
  const tick = (cmd?: Parameters<typeof lerComando>[0]) => {
    simular(estado, ctx, cmd ? [{ tick: estado.tick, entidadeId: 'j', cmd: obter(lerComando(cmd)) }] : [], eventos, DT_MS);
  };
  return { ctx, estado, j, eventos, tick };
}

describe('sintonia (D-095)', () => {
  it('os dados: 9 Domínios, a sintonia de cada classe com as 9 famílias, 15 vertentes e 21 encarnações duplas', () => {
    const s = CONTEUDO.sintonia;
    expect(Object.keys(s.dominios)).toHaveLength(9);
    for (const c of CONTEUDO.classes.values()) expect(Object.keys(obter(s.classes[c.id], c.id))).toHaveLength(9);
    expect(s.vertentes).toHaveLength(15);
    for (const c of CONTEUDO.classes.values()) expect(s.vertentes.filter((v) => v.classe === c.id)).toHaveLength(3);
    expect(s.encarnacoesDuplas).toHaveLength(21);
  });

  it('conta as gerais de tecla por família; Domínio com 2; as passivas não contam', () => {
    const { ctx, j } = cena('guerreiro', ['investida', 'golpe_atordoante', 'curar', null]);
    const s = sintoniaDe(ctx, j);
    expect(s.familias).toEqual({ tecnica: 2, suporte: 1 });
    expect(s.dominios).toEqual(['tecnica']);
    expect(s.vertente).toBeNull();
    expect(forcaDaSintonia(s, 'tecnica')).toBe(2);
    expect(forcaDaSintonia(s, 'suporte')).toBe(1);
    expect(forcaDaSintonia(s, 'fogo')).toBe(0);
    expect(sintoniaDasGerais(ctx, 'guerreiro', ['pele_de_pedra', 'peso_da_rocha']).familias).toEqual({});
  });

  it('2 + 2 das famílias da classe ligam a vertente', () => {
    const { ctx, j } = cena('guerreiro', ['lanca_radiante', 'circulo_de_amparo', 'curar', 'barreira']);
    expect(sintoniaDe(ctx, j).vertente?.nome).toBe('Paladino');
    expect(sintoniaDasGerais(ctx, 'mago', ['lanca_radiante', 'circulo_de_amparo', 'curar', 'barreira']).vertente).toBeNull();
  });

  it('o Domínio marca a ultimate (técnica: os atingidos sangram)', () => {
    const { ctx, estado, j, eventos, tick } = cena('guerreiro', ['investida', 'golpe_atordoante', null, null]);
    const u = obter(CONTEUDO.ultimates.get('ult_ciclone_de_aco'));
    expect(chaveDoAtor(ctx, j, u.id, estado.tick)).toContain('dom_tecnica');
    j.cargaUltimate = ctx.balance.ultimate.max;
    j.autoAtaque = false;
    tick({ t: 'usarUltimate', alvo: 'b' });
    expect(cargaDe(j)).toBe(0);
    for (let i = 0; i < 120; i++) tick();
    expect(eventos.some((e) => e.t === 'efeitoAplicado' && e.alvoId === 'b' && e.tipo === 'sangrando')).toBe(true);
  });

  it('o Domínio do suporte põe escudo em você pela etapa interna', () => {
    const { ctx, j, eventos, tick } = cena('guerreiro', ['curar', 'barreira', null, null]);
    j.cargaUltimate = ctx.balance.ultimate.max;
    j.autoAtaque = false;
    tick({ t: 'usarUltimate', alvo: 'b' });
    for (let i = 0; i < 60; i++) tick();
    expect(eventos.some((e) => e.t === 'impacto' && e.habilidadeId === 'dom_suporte')).toBe(true);
    expect(j.efeitos.some((f) => f.tipo === 'escudo')).toBe(true);
  });
});
