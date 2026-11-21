// 20/11/2026 (D-188, adendo): personagens antigos que ficaram com 1 skill de classe depois do ajuste do kit voltam a ter 2.
import { describe, expect, it } from 'vitest';
import { recalcularFicha } from '../../src/progression/derivados';
import { criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));

describe('as 2 teclas de classe nunca ficam vazias', () => {
  for (const [id, classe] of CONTEUDO.classes) {
    it(`${id}: com 1 skill de classe na barra, a outra inicial volta`, () => {
      const j = criarJogador(classe, 'j', 4, 5, ctx.balance);
      const bolsa = j.bolsa;
      if (!bolsa) throw new Error('sem bolsa');
      // O estado do save antigo: a segunda skill de classe saiu (conhecida e barra).
      const perdida = classe.iniciais[1];
      bolsa.conhecidas = bolsa.conhecidas.filter((c) => c.id !== perdida);
      bolsa.barra[1] = null;
      recalcularFicha(j, ctx);
      expect(bolsa.barra[0]).toBe(classe.iniciais[0]);
      expect(bolsa.barra[1]).toBe(perdida);
      expect(bolsa.conhecidas.some((c) => c.id === perdida)).toBe(true);
      expect(j.habilidades.slice(0, 2)).toEqual(classe.iniciais);
    });
  }

  it('um personagem sem nenhuma na barra recebe as duas, e uma segunda passada não muda nada', () => {
    const classe = CONTEUDO.classes.get('mago');
    if (!classe) throw new Error('sem classe');
    const j = criarJogador(classe, 'j', 4, 5, ctx.balance);
    const bolsa = j.bolsa;
    if (!bolsa) throw new Error('sem bolsa');
    bolsa.conhecidas = bolsa.conhecidas.filter((c) => !classe.iniciais.includes(c.id));
    bolsa.barra[0] = null;
    bolsa.barra[1] = null;
    recalcularFicha(j, ctx);
    const antes = JSON.stringify(bolsa);
    recalcularFicha(j, ctx);
    expect(bolsa.barra.slice(0, 2)).toEqual(classe.iniciais);
    expect(JSON.stringify(bolsa)).toBe(antes);
  });
});
