// Marco 24 (24/10/2026, D-094, D-097): a migração 23 para 24 (skills de classe sem ponto, barra de 6, gerais
// liberadas, Guerreiro v1.2) e o Parar ataque.
import { describe, expect, it } from 'vitest';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { lerComando } from '../../src/arena/protocolo';
import { MIGRACOES, VERSAO_SCHEMA } from '../../src/save/esquema';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

describe('migração 23 para 24', () => {
  const guerreiroV23 = {
    id: 'j', nivel: 6, habilidades: ['investida', 'redemoinho', 'grito_de_guerra', 'escudo_de_ferro'],
    bolsa: {
      classeId: 'guerreiro', pontosHabilidade: 1,
      conhecidas: [
        { id: 'investida', rank: 2, caminhos: [] },
        { id: 'redemoinho', rank: 3, caminhos: ['amplo'] },
        { id: 'grito_de_guerra', rank: 1, caminhos: [] },
        { id: 'escudo_de_ferro', rank: 2, caminhos: [] },
        { id: 'corrente', rank: 1, caminhos: [] },
        { id: 'lanca_de_gelo', rank: 1, caminhos: [] },
        { id: 'pele_de_pedra', rank: 1, caminhos: [] },
      ],
      barra: ['investida', 'redemoinho', 'grito_de_guerra', 'escudo_de_ferro'],
      mochila: [{ invId: 'i1', itemId: 'livro_golpe_flamejante', qtd: 1, ref: null }],
      estudo: null,
    },
  };
  const migrado = () => {
    const r = obter(MIGRACOES[23])({ versaoSchema: 23, estado: { entidades: [structuredClone(guerreiroV23)], recargas: { j_grito_de_guerra: 40 } }, fasesVisitadas: {} });
    const estado = r.estado as { entidades: Record<string, unknown>[]; recargas: Record<string, number> };
    const e = obter(estado.entidades[0]);
    return { e, bolsa: e.bolsa as Record<string, unknown>, recargas: estado.recargas };
  };

  it('renomeia o Guerreiro v1.2 e organiza a barra de 6 (1–2 de classe, 3–6 gerais)', () => {
    const { e, bolsa, recargas } = migrado();
    expect(VERSAO_SCHEMA).toBe(28);
    const ids = (bolsa.conhecidas as { id: string }[]).map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(['brado', 'investida_de_escudo', 'redemoinho', 'corrente', 'investida', 'pele_de_pedra']));
    expect(ids).not.toContain('grito_de_guerra');
    // Skill exclusiva de outra classe sai.
    expect(ids).not.toContain('lanca_de_gelo');
    const barra = bolsa.barra as (string | null)[];
    expect(barra).toHaveLength(6);
    expect(barra.slice(0, 2)).toEqual(['redemoinho', 'brado']);
    expect(barra.slice(2)).toContain('investida');
    expect(e.habilidades).toEqual(barra.filter((x) => x !== null));
    expect((bolsa.mochila as { itemId: string }[])[0]?.itemId).toBe('livro_lamina_em_brasa');
    expect(recargas).toEqual({ j_brado: 40 });
  });

  it('devolve os pontos postos em skill de classe e libera as gerais conhecidas', () => {
    const { bolsa } = migrado();
    // Redemoinho no 3 (2 ranks pagos), Investida de escudo no 2 (1) e Corrente, que se aprendia com ponto (1). A Lança
    // de gelo, de outra classe, veio de livro (rank 1 sem ponto). São 4 de volta, mais o 1 que sobrava.
    expect(bolsa.pontosHabilidade).toBe(5);
    expect(bolsa.liberadas).toEqual(expect.arrayContaining(['investida', 'pele_de_pedra']));
    expect(bolsa.passivasAtivas).toEqual(['pele_de_pedra']);
    const redemoinho = (bolsa.conhecidas as { id: string; rank: number; caminhos: string[] }[]).find((c) => c.id === 'redemoinho');
    expect(redemoinho?.caminhos).toEqual(['amplo']);
    expect(redemoinho?.rank).toBeGreaterThanOrEqual(3);
  });
});

describe('Parar ataque (D-097)', () => {
  it('o comando desliga o básico automático, e escolher o alvo religa', () => {
    const ctx = contexto(faseDeTexto(SALA_ABERTA));
    const estado = criarEstado({ semente: 4, faseId: 'teste' });
    const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 3, 5, ctx.balance);
    estado.entidades.push(j, criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'b', 4, 5, ctx.balance));
    const eventos: EventoSimulacao[] = [];
    const tick = (cmd?: Parameters<typeof lerComando>[0]) => {
      simular(estado, ctx, cmd ? [{ tick: estado.tick, entidadeId: 'j', cmd: obter(lerComando(cmd)) }] : [], eventos, DT_MS);
    };
    tick({ t: 'autoAtaque', ligado: false });
    expect(j.autoAtaque).toBe(false);
    tick({ t: 'selecionarAlvo', alvo: 'b' });
    expect(j.autoAtaque).toBe(true);
    expect(lerComando({ t: 'autoAtaque', ligado: 'sim' })).toBeNull();
  });
});
