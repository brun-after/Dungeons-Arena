// Marco 39 (12/11/2026, D-146): a Força vira Vontade — a migração do save, a ficha antiga no grupo e no Mundo, e a
// marca do sistema que pede a tela de atualização.
import { describe, expect, it } from 'vitest';
import { conferirPersonagem, pedidoDoPersonagem } from '../../src/coop/personagem';
import { criarJogador } from '../../src/entities/fabrica';
import { SISTEMA_DO_PERSONAGEM } from '../../src/entities/entidade';
import { MIGRACOES, VERSAO_SCHEMA } from '../../src/save/esquema';
import { vontadeNoLugarDaForca } from '../../src/save/migracao-39';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

describe('Força › Vontade', () => {
  it('a troca de chave preserva o valor e não mexe no que já está certo', () => {
    expect(vontadeNoLugarDaForca({ forca: 17, destreza: 12 })).toEqual({ vontade: 17, destreza: 12 });
    expect(vontadeNoLugarDaForca({ vontade: 14 })).toEqual({ vontade: 14 });
    expect(vontadeNoLugarDaForca(null)).toBeNull();
  });

  it('a migração 28 › 29 troca a chave em toda entidade e na base da ficha, também nas fases visitadas (e as ressonâncias dão lugar aos estilos)', () => {
    expect(VERSAO_SCHEMA).toBe(30);
    const entidade = { atributos: { forca: 20, destreza: 10 }, bolsa: { atributosBase: { forca: 18, destreza: 10 } } };
    const r = obter(MIGRACOES[28])({ estado: { entidades: [entidade, { atributos: { forca: 11 } }] }, fasesVisitadas: { f1: { entidades: [entidade] } } });
    expect(r).toEqual({
      estado: { entidades: [{ atributos: { vontade: 20, destreza: 10 }, bolsa: { atributosBase: { vontade: 18, destreza: 10 } }, estilos: [] }, { atributos: { vontade: 11 }, estilos: [] }] },
      fasesVisitadas: { f1: { entidades: [{ atributos: { vontade: 20, destreza: 10 }, bolsa: { atributosBase: { vontade: 18, destreza: 10 } }, estilos: [] }] } },
    });
  });

  it('a ficha antiga (com `forca` e sem o sistema) mantém os pontos e pede a tela de atualização', () => {
    const e = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 1, 1, ctx.balance);
    e.nivel = 5;
    const b = obter(e.bolsa);
    b.atributosBase.vontade += 4;
    const pedido = JSON.parse(JSON.stringify(pedidoDoPersonagem(e))) as { bolsa: { atributosBase: Record<string, number>; sistema?: number } };
    const { vontade, ...resto } = pedido.bolsa.atributosBase;
    pedido.bolsa.atributosBase = { ...resto, forca: obter(vontade) };
    delete pedido.bolsa.sistema;
    const conferido = obter(conferirPersonagem(pedido, ctx, 'p', 'dono'));
    expect(conferido.entidade.bolsa?.atributosBase.vontade).toBe(b.atributosBase.vontade);
    expect(conferido.entidade.bolsa?.sistema).toBeUndefined();
  });

  it('o personagem novo já nasce no sistema atual, e a marca sobrevive à conferência', () => {
    const e = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 1, 1, ctx.balance);
    expect(e.bolsa?.sistema).toBe(SISTEMA_DO_PERSONAGEM);
    expect(obter(conferirPersonagem(pedidoDoPersonagem(e), ctx, 'p', 'dono')).entidade.bolsa?.sistema).toBe(SISTEMA_DO_PERSONAGEM);
  });
});
