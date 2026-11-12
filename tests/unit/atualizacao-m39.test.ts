// Marco 39 (12/11/2026, D-149): a tela de atualização — devolve todo o orçamento do nível no sistema novo, confere o
// teto e o orçamento, marca o personagem e propõe a build antiga na mesma proporção.
import { describe, expect, it } from 'vitest';
import { lerComando } from '../../src/arena/protocolo';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { SISTEMA_DO_PERSONAGEM } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { aplicarAtualizacao, pontosDaAtualizacao, precisaDaAtualizacao } from '../../src/progression/atualizacao-39';
import { pontosAteONivel, tetoDoAtributo } from '../../src/progression/nivel';
import { proporcaoDeAntes } from '../../src/ui/tela-atualizacao';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

/** Um personagem antigo no nível 40: a build de antes (447 no 100; aqui, 29×3 + 10×4) e sem a marca. */
function antigo() {
  const e = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 2, 2, ctx.balance);
  const b = obter(e.bolsa);
  e.nivel = 40;
  delete b.sistema;
  b.atributosBase.inteligencia += 50;
  b.atributosBase.sabedoria += 40;
  b.atributosBase.constituicao += 37;
  b.pontosAtributo = 0;
  return { e, b };
}

describe('tela de atualização (D-149)', () => {
  it('só o personagem sem a marca precisa da tela', () => {
    expect(precisaDaAtualizacao(criarJogador(obter(CONTEUDO.classes.get('mago')), 'n', 1, 1, ctx.balance).bolsa)).toBe(false);
    expect(precisaDaAtualizacao(antigo().b)).toBe(true);
  });

  it('devolve o orçamento inteiro do nível, confere o teto e marca o personagem', () => {
    const { e, b } = antigo();
    const classe = obter(CONTEUDO.classes.get('mago'));
    const saida: EventoSimulacao[] = [];
    const teto = tetoDoAtributo(40, ctx.balance);
    expect(aplicarAtualizacao(e, ctx, { inteligencia: 500, sabedoria: 20 }, 0, saida)).toBe(true);
    expect(b.atributosBase.inteligencia).toBe(teto);
    expect(b.atributosBase.sabedoria).toBe(classe.atributos.sabedoria + 20);
    expect(b.atributosBase.constituicao).toBe(classe.atributos.constituicao);
    const postos = teto - classe.atributos.inteligencia + 20;
    expect(b.pontosAtributo).toBe(pontosAteONivel(40, ctx.balance.xp) - postos);
    expect(b.sistema).toBe(SISTEMA_DO_PERSONAGEM);
    expect(saida.some((ev) => ev.t === 'personagemAtualizado')).toBe(true);
    // Não aplica de novo.
    expect(aplicarAtualizacao(e, ctx, { carisma: 5 }, 0, saida)).toBe(false);
  });

  it('a proposta inicial é a build antiga na mesma proporção, dentro do orçamento e do teto', () => {
    const { e, b } = antigo();
    const p = proporcaoDeAntes(ctx, b, e.nivel);
    const total = Object.values(p).reduce((s, v) => s + v, 0);
    expect(total).toBe(pontosDaAtualizacao(e, ctx));
    expect(p.inteligencia).toBeGreaterThan(p.sabedoria);
    expect(p.sabedoria).toBeGreaterThan(p.constituicao);
    expect(p.carisma).toBe(0);
  });

  it('o protocolo aceita só atributos conhecidos e inteiros', () => {
    expect(lerComando({ t: 'atualizarSistema', pontos: { inteligencia: 3, vontade: 2 } })).toEqual({ t: 'atualizarSistema', pontos: { inteligencia: 3, vontade: 2 } });
    expect(lerComando({ t: 'atualizarSistema', pontos: { forca: 3 } })).toBeNull();
    expect(lerComando({ t: 'atualizarSistema', pontos: { inteligencia: -1 } })).toBeNull();
    expect(lerComando({ t: 'atualizarSistema', pontos: { inteligencia: 1.5 } })).toBeNull();
  });
});
