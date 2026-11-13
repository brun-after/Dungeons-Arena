// Marco 26 (26/10/2026, D-110, D-111): a lore das classes sem números e o Diário com "Como" e "Efeito".
import { describe, expect, it } from 'vitest';
import { t, type ChaveTexto } from '../../src/i18n';
import { entradasDoDiario, TIPOS_DE_ENTRADA } from '../../src/progression/diario';
import { comoFazerCombo, descreverEntrada, textoDaCondicao } from '../../src/ui/diario-detalhes';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));

describe('textos das classes', () => {
  it('a escolha mostra lore e estilo sem números; os números ficam no Dom', () => {
    for (const c of CONTEUDO.classes.values()) {
      const lore = t(`classe.${c.id}.descricao` as ChaveTexto);
      const estilo = t(`classe.${c.id}.estilo` as ChaveTexto);
      const dom = t(`classe.${c.id}.dom` as ChaveTexto);
      expect(lore, c.id).not.toMatch(/\d|%/);
      expect(estilo, c.id).toMatch(/^Estilo: /);
      expect(estilo, c.id).not.toMatch(/\d|%/);
      expect(dom, c.id).toMatch(/\d/);
    }
  });
});

describe('Diário detalhado', () => {
  it('toda entrada tem nome e, com conteúdo, efeito ou como', () => {
    const todas = entradasDoDiario(ctx);
    for (const tipo of TIPOS_DE_ENTRADA) expect(todas.some((e) => e.tipo === tipo), tipo).toBe(true);
    for (const e of todas) {
      const d = descreverEntrada(ctx, e.id);
      expect(d.nome, e.id).not.toBe('');
      expect(d.como.length > 0 || d.efeito !== '', e.id).toBe(true);
      expect([d.nome, ...d.como, d.efeito].join(' '), e.id).not.toMatch(/undefined|NaN|\{\w+\}/);
    }
  });

  it('o combo diz as habilidades em ordem, a janela e as condições', () => {
    // Marco 40 (D-163): o Moedor antigo saiu com os combos de uma classe só; a Chuva ácida fica.
    const combo = CONTEUDO.combos.get('chuva_acida');
    expect(combo).toBeDefined();
    if (!combo) return;
    const [ordem = '', extras = ''] = comoFazerCombo(ctx, combo);
    const nome = (id: string) => CONTEUDO.definicoes.get(id)?.base.nome ?? id;
    expect(ordem).toBe(`${nome('flecha_venenosa')} › ${nome('chuva_de_flechas')}`);
    expect(extras).toContain('2,5 s');
    expect(descreverEntrada(ctx, 'combo:chuva_acida').efeito).toBe(combo.texto);
    expect(textoDaCondicao('alvo:sangrando')).toMatch(/^com o alvo /);
    // Toda condição usada nos dados tem texto.
    for (const c of CONTEUDO.combos.values()) for (const cond of c.condicoes) expect(textoDaCondicao(cond), cond).not.toBe(cond);
  });

  it('a reação diz o elemento, os estados e o que faz', () => {
    const d = descreverEntrada(ctx, 'reacao:vapor');
    expect(d.como[0]).toMatch(/Fogo/);
    expect(d.efeito).toMatch(/50%/);
  });
});
