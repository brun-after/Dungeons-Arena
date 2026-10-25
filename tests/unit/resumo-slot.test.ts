// 25/10/2026: o resumo do slot leva a classe do personagem (a lista de slots mostra com qual classe se joga).
import { describe, expect, it } from 'vitest';
import { criarEstado } from '../../src/core/estado';
import { criarJogador } from '../../src/entities/fabrica';
import { resumoDoRegistro, VERSAO_SCHEMA, type RegistroProgresso } from '../../src/save/esquema';
import { CONTEUDO, contexto, SALA_ABERTA, faseDeTexto } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));

function registro(classe: string | null): RegistroProgresso {
  const estado = criarEstado({ semente: 1, faseId: 'fase-01' });
  const def = classe ? CONTEUDO.classes.get(classe) : undefined;
  if (def) estado.entidades.push(criarJogador(def, 'j', 2, 2, ctx.balance));
  return { versaoSchema: VERSAO_SCHEMA, slot: 3, criadoEm: 1, atualizadoEm: 2, faseRef: { tipo: 'oficial', id: 'fase-01' }, nomeFase: 'Salões da entrada', estado, estatisticas: { mortes: 0, inimigosDerrotados: 0 }, fasesVisitadas: {}, certificado: null };
}

describe('resumo do slot', () => {
  it('traz a classe do personagem do save', () => {
    expect(resumoDoRegistro(registro('necromante'))).toMatchObject({ slot: 3, classeId: 'necromante', nomeFase: 'Salões da entrada' });
    expect(resumoDoRegistro(registro('guerreiro')).classeId).toBe('guerreiro');
  });

  it('sem personagem no save, a classe fica nula', () => {
    expect(resumoDoRegistro(registro(null)).classeId).toBeNull();
  });
});
