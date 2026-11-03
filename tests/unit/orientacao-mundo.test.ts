import { describe, expect, it } from 'vitest';
import { proximaEtapa, direcaoGeografica, rumoNaTela } from '../../src/mundo/orientacao';
import { reinoDoConteudo, portaDa } from '../../src/mundo/reino';
import { cartografia } from '../../src/ui/cartografia';
import { criarProjecao } from '../../src/render/projecao';
import { CONTEUDO, faseDeTexto } from '../apoio/fases';

const reino = reinoDoConteudo(CONTEUDO);
const fase = faseDeTexto(Array.from({ length: 160 }, () => '.'.repeat(160)));

describe('orientação geográfica do Mundo', () => {
  it('cliques voltam à célula correta, mesmo em mapa retangular e com margem', () => {
    for (const [w, h] of [[160, 160], [80, 200], [240, 90]]) {
      const m = cartografia(w ?? 1, h ?? 1, 1000, 660, 48);
      for (const p of [{ x: 0, y: 0 }, { x: 55, y: 55 }, { x: (w ?? 1) - 1, y: (h ?? 1) - 1 }]) {
        const q = m.ponto(p.x, p.y);
        expect(m.celula(q.x, q.y)).toEqual(p);
      }
      expect(m.celula(0, 0).x).toBeLessThan(0);
    }
  });

  it.each([[0, -1, 'N'], [1, 0, 'L'], [0, 1, 'S'], [-1, 0, 'O']] as const)('o rumo %s,%s acompanha a matriz do cenário (%s)', (x, y, nome) => {
    const p = criarProjecao('iso', 160, 160), a = p.projetar(0, 0), b = p.projetar(x, y);
    expect(rumoNaTela({ x: 0, y: 0 }, { x, y })).toBeCloseTo(Math.atan2(b.y - a.y, b.x - a.x));
    expect(direcaoGeografica({ x: 0, y: 0 }, { x, y })).toBe(nome);
  });

  it('manda para a porta da dungeon, em vez do centro da região', () => {
    const r = reino.regioes.find(r => r.id === reino.inicio), e = r?.estruturas[0];
    if (!r || !e) throw new Error('estrutura ausente');
    expect(proximaEtapa(reino, `regiao:${r.id}`, { lugar: `${e.destino.tipo}:${e.destino.id}`, nome: e.nome }, fase)).toMatchObject({ ponto: portaDa(e).frente, tipo: 'destino' });
  });

  it('oeste leva à passagem esquerda da grade (baixo à esquerda na tela)', () => {
    expect(proximaEtapa(reino, 'regiao:vila_do_centro', { lugar: 'regiao:campos_do_oeste', nome: 'Campos' }, fase)).toMatchObject({ tipo: 'passagem', ponto: { x: 0, y: 80 } });
  });

  it('considera o lugar alcançado ao entrar, mas mantém pontos pessoais até chegar à posição', () => {
    const lugar = `regiao:${reino.inicio}`;
    expect(proximaEtapa(reino, lugar, { lugar, nome: 'Vila' }, fase)).toMatchObject({ tipo: 'chegou', ponto: null });
    expect(proximaEtapa(reino, lugar, { lugar, nome: 'Ponto', ponto: { x: 30, y: 40 } }, fase)).toMatchObject({ tipo: 'destino', ponto: { x: 30, y: 40 } });
  });

  it('não inventa passagem terrestre entre reinos separados', () => {
    const outro = reino.territorios?.find(t => t.id !== reino.id);
    if (!outro) throw new Error('outro reino ausente');
    expect(proximaEtapa(reino, `regiao:${reino.inicio}`, { lugar: `regiao:${outro.inicio}`, nome: outro.nome }, fase)).toMatchObject({ tipo: 'portal', ponto: null });
  });
});
