// Marco 26 (29/10/2026, D-122): o save não cresce sem fim (recargas vencidas saem; só as últimas fases ficam guardadas).
import { describe, expect, it } from 'vitest';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { criarEstado, LIMPEZA_RECARGAS_TICKS, limparRecargasVencidas } from '../../src/core/estado';
import { criarJogador } from '../../src/entities/fabrica';
import { chaveDaFase, VERSAO_SCHEMA, type RefFase, type RegistroProgresso } from '../../src/save/esquema';
import { faseSeguinte } from '../../src/save/fases-campanha';
import { avancarFase, MAX_FASES_GUARDADAS } from '../../src/save/transicao';
import { CONTEUDO } from '../apoio/fases';

describe('save leve', () => {
  it('as recargas vencidas saem na limpeza; as em curso ficam', () => {
    const estado = criarEstado({ semente: 1, faseId: 'x' });
    estado.tick = LIMPEZA_RECARGAS_TICKS * 3;
    estado.recargas = { 'v12_mordida': 10, 'j_redemoinho': estado.tick + 100, 'j_ataque': estado.tick };
    limparRecargasVencidas(estado);
    expect(estado.recargas).toEqual({ 'j_redemoinho': estado.tick + 100 });
    // Fora do ritmo da limpeza, não mexe.
    estado.recargas.velha = 1;
    estado.tick++;
    limparRecargasVencidas(estado);
    expect(estado.recargas.velha).toBe(1);
  });

  it(`guarda só as últimas ${MAX_FASES_GUARDADAS} fases deixadas`, () => {
    const classe = CONTEUDO.classes.get('aventureiro');
    if (!classe) throw new Error('classe');
    let ref: RefFase = { tipo: 'oficial', id: 'fase-02' };
    const estado = criarEstado({ semente: 1, faseId: 'fase-02' });
    estado.entidades.push(criarJogador(classe, 'j', 2, 2, BALANCE_PADRAO));
    let r: RegistroProgresso = { versaoSchema: VERSAO_SCHEMA, slot: 1, criadoEm: 0, atualizadoEm: 0, faseRef: ref, nomeFase: 'F',
      estado, estatisticas: { mortes: 0, inimigosDerrotados: 0 }, fasesVisitadas: {}, certificado: null };
    const deixadas: string[] = [];
    for (let i = 0; i < MAX_FASES_GUARDADAS + 4; i++) {
      const proxima = faseSeguinte(ref);
      if (!proxima) throw new Error('sem próxima');
      deixadas.push(chaveDaFase(ref));
      r = avancarFase(r, { ref: proxima, nome: 'F', spawn: { x: 2, y: 2 }, novoEstado: () => criarEstado({ semente: 1, faseId: proxima.id }) }, i);
      ref = proxima;
    }
    expect(Object.keys(r.fasesVisitadas)).toEqual(deixadas.slice(-MAX_FASES_GUARDADAS));
  });
});
