// Marco 24 (24/10/2026, D-095): as passivas gerais valem só ligadas, até 3, e a troca é fora de combate.
import { describe, expect, it } from 'vitest';
import { lerComando } from '../../src/arena/protocolo';
import { passivasDaBolsa } from '../../src/combat/perfil';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarJogador } from '../../src/entities/fabrica';
import { ligarAoAprender } from '../../src/progression/passivas-gerais';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const PASSIVAS = ['pele_de_pedra', 'couraca_treinada', 'disciplina_marcial', 'tenacidade'];

function cena() {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 3, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 3, 5, ctx.balance);
  estado.entidades.push(j);
  const bolsa = obter(j.bolsa);
  for (const id of PASSIVAS) bolsa.conhecidas.push({ id, rank: 1, caminhos: [] });
  bolsa.passivasAtivas = [];
  const eventos: EventoSimulacao[] = [];
  const tick = (cmd: Parameters<typeof lerComando>[0]) => {
    simular(estado, ctx, [{ tick: estado.tick, entidadeId: 'j', cmd: obter(lerComando(cmd)) }], eventos, DT_MS);
  };
  return { ctx, estado, j, bolsa, eventos, tick };
}

describe('passivas gerais (D-095)', () => {
  it('só as ligadas valem, até o limite', () => {
    const { ctx, bolsa, eventos, tick } = cena();
    expect(passivasDaBolsa(ctx, bolsa)).toHaveLength(0);
    for (const id of PASSIVAS.slice(0, 3)) tick({ t: 'ativarPassiva', id });
    expect(bolsa.passivasAtivas).toEqual(PASSIVAS.slice(0, 3));
    expect(passivasDaBolsa(ctx, bolsa)).toHaveLength(3);
    tick({ t: 'ativarPassiva', id: obter(PASSIVAS[3]) });
    expect(eventos.at(-1)).toMatchObject({ t: 'habilidadeRecusada', motivo: 'limite_passivas' });
    tick({ t: 'desativarPassiva', id: obter(PASSIVAS[0]) });
    tick({ t: 'ativarPassiva', id: obter(PASSIVAS[3]) });
    expect(bolsa.passivasAtivas).toEqual(PASSIVAS.slice(1));
    expect(eventos.filter((e) => e.t === 'passivaDefinida')).toHaveLength(5);
  });

  it('recusa em combate, a ativa e a desconhecida', () => {
    const { estado, j, eventos, tick } = cena();
    tick({ t: 'ativarPassiva', id: 'redemoinho' });
    expect(eventos.at(-1)).toMatchObject({ motivo: 'nao_passiva' });
    tick({ t: 'ativarPassiva', id: 'olho_frio' });
    expect(eventos.at(-1)).toMatchObject({ motivo: 'desconhecida' });
    j.participacao.push({ id: 'x', tick: estado.tick });
    tick({ t: 'ativarPassiva', id: 'pele_de_pedra' });
    expect(eventos.at(-1)).toMatchObject({ motivo: 'em_combate' });
  });

  it('aprender uma passiva geral a liga se houver vaga', () => {
    const { ctx, bolsa } = cena();
    for (const id of PASSIVAS) ligarAoAprender(ctx, bolsa, id);
    expect(bolsa.passivasAtivas).toEqual(PASSIVAS.slice(0, 3));
    ligarAoAprender(ctx, bolsa, 'redemoinho');
    expect(bolsa.passivasAtivas).toHaveLength(3);
  });

  it('a rede valida o comando', () => {
    expect(lerComando({ t: 'ativarPassiva', id: 'pele_de_pedra' })).toEqual({ t: 'ativarPassiva', id: 'pele_de_pedra' });
    expect(lerComando({ t: 'desativarPassiva', id: 3 })).toBeNull();
  });
});
