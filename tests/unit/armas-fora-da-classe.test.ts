// Marco 23 (24/10/2026, D-093): a arma de outra família troca o ataque básico.
import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { aplicarImpacto } from '../../src/combat/golpe';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { armaForaDaClasse, multiplicadorArma } from '../../src/progression/armas';
import { recalcularFicha } from '../../src/progression/derivados';
import { idItemBase } from '../../src/progression/gerar-item-base';
import { MIGRACOES } from '../../src/save/esquema';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

function personagem(classe: string, arma: string | null): Entidade {
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 2, 2, ctx.balance);
  const bolsa = obter(j.bolsa);
  bolsa.equipamento.arma_principal = arma ? { invId: 'a1', itemId: idItemBase(arma, 'comum', null, 1, 7), qtd: 1, ref: null } : null;
  recalcularFicha(j, ctx);
  return j;
}

describe('armas fora da classe', () => {
  it('o Mago de espada golpeia corpo a corpo, e sem ela volta ao dardo', () => {
    const mago = personagem('mago', 'espada');
    expect(mago.ataqueBasico).toBe('ataque_basico');
    expect(habilidadeDoAtor(ctx, mago, mago.ataqueBasico)?.politicaImpacto).toBe('contato');
    obter(mago.bolsa).equipamento.arma_principal = null;
    recalcularFicha(mago, ctx);
    expect(mago.ataqueBasico).toBe('dardo_arcano');
  });

  it('o Guerreiro de cajado ataca de longe e o Mago de arco atira flechas', () => {
    const guerreiro = personagem('guerreiro', 'cajado');
    expect(guerreiro.ataqueBasico).toBe('dardo_arcano');
    expect(habilidadeDoAtor(ctx, guerreiro, guerreiro.ataqueBasico)?.politicaImpacto).toBe('projetil');
    expect(personagem('mago', 'arco').ataqueBasico).toBe('tiro');
    expect(personagem('necromante', 'arco').ataqueBasico).toBe('tiro');
  });

  it('a arma da família natural (ou nenhuma) mantém o básico da classe', () => {
    expect(personagem('arqueiro', 'arco').ataqueBasico).toBe('tiro');
    expect(personagem('necromante', 'cajado').ataqueBasico).toBe('toque_funesto');
    expect(personagem('guerreiro', 'machado').ataqueBasico).toBe('ataque_basico');
    expect(personagem('mago', null).ataqueBasico).toBe('dardo_arcano');
    expect(armaForaDaClasse(ctx, personagem('aventureiro', 'lanca'))).toBeNull();
  });

  it('o básico emprestado bate menos; as outras habilidades não mudam', () => {
    const mago = personagem('mago', 'espada');
    expect(multiplicadorArma(ctx, mago, 'ataque_basico')).toBeCloseTo(1 + ctx.balance.armas.danoForaDaClassePct / 100);
    expect(multiplicadorArma(ctx, mago, 'bola_de_fogo')).toBe(1);
    expect(multiplicadorArma(ctx, personagem('guerreiro', 'espada'), 'ataque_basico')).toBe(1);
    // O golpe sai e fere de verdade.
    const estado = criarEstado({ semente: 3, faseId: ctx.fase.id });
    const alvo = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'i000', 3, 2, ctx.balance);
    estado.entidades.push(mago, alvo);
    const hab = obter(habilidadeDoAtor(ctx, mago, mago.ataqueBasico));
    const eventos: EventoSimulacao[] = [];
    aplicarImpacto(estado, ctx, alvo, { acaoId: 1, hab, indice: 0, fonte: { ...fonteDaHabilidade(mago, ctx, 0, hab), d20Minimo: 12 } }, eventos);
    expect(eventos.find((e) => e.t === 'impacto')).toMatchObject({ habilidadeId: 'ataque_basico' });
  });

  it('a migração do save dá o básico da arma a quem já a segurava', () => {
    const mago = personagem('mago', 'espada');
    mago.ataqueBasico = 'dardo_arcano';
    const migrado = obter(MIGRACOES[22])({ estado: { entidades: [mago] }, fasesVisitadas: {} });
    expect((migrado.estado as { entidades: Entidade[] }).entidades[0]?.ataqueBasico).toBe('ataque_basico');
  });
});
