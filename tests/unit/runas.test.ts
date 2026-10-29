// Marco 26 (28/10/2026, D-116): as runas das classes, as cores por jogador, o retrato e a preferência.
import { describe, expect, it } from 'vitest';
import { FONTES_OFICIAIS, lerConteudo } from '../../src/core/conteudo';
import type { Entidade } from '../../src/entities/entidade';
import { normalizarPreferencias, PREFERENCIAS_PADRAO } from '../../src/plataforma/preferencias';
import { mioloDoRetrato } from '../../src/render/retrato';
import { coresDasRunas, girarMatiz, RUNAS, runaDe } from '../../src/render/runas';
import { primeiraFrase } from '../../src/ui/escolha-classe';
import { classeDaHabilidade, classeDoItem } from '../../src/ui/runa-dom';

const { conteudo } = lerConteudo(FONTES_OFICIAIS);

const jogador = (id: string, classeId: string, extra: Partial<Entidade> = {}): Entidade =>
  ({ id, classeId, controlador: 'humano', ...extra }) as Entidade;

describe('runas das classes', () => {
  it('há uma runa com traços para cada classe jogável', () => {
    for (const c of conteudo.classes.values()) {
      const r = runaDe(c.id);
      expect(r, c.id).not.toBeNull();
      expect(r?.tracos.length).toBeGreaterThan(2);
    }
    expect(Object.keys(RUNAS).sort()).toEqual([...conteudo.classes.keys()].sort());
    expect(runaDe('goblin')).toBeNull();
  });

  it('jogadores da mesma classe têm cores diferentes, iguais em qualquer ordem', () => {
    const lista = [jogador('b', 'mago'), jogador('a', 'mago'), jogador('c', 'guerreiro'), jogador('d', 'mago')];
    const cores = coresDasRunas(lista);
    expect(cores.get('a')).toBe(RUNAS.mago?.cor);
    expect(cores.get('c')).toBe(RUNAS.guerreiro?.cor);
    expect(new Set([cores.get('a'), cores.get('b'), cores.get('d')]).size).toBe(3);
    expect(coresDasRunas([...lista].reverse())).toEqual(cores);
  });

  it('inimigos e invocações não ganham runa', () => {
    const cores = coresDasRunas([
      jogador('ia', 'mago', { controlador: 'ia' }),
      jogador('servo', 'necromante', { invocacao: {} as Entidade['invocacao'] }),
    ]);
    expect(cores.size).toBe(0);
  });

  it('girar a matiz preserva a cor em 0° e a muda em 180°', () => {
    expect(girarMatiz(0x4a7fd6, 0)).toBe(0x4a7fd6);
    expect(girarMatiz(0x4a7fd6, 180)).not.toBe(0x4a7fd6);
    expect(girarMatiz(girarMatiz(0xc0392b, 180), 180)).toBeCloseTo(0xc0392b, -4);
  });

  it('a skill exclusiva e o livro que a ensina apontam a classe', () => {
    const guerreiro = conteudo.classes.get('guerreiro');
    const skill = guerreiro?.exclusivas[0] ?? '';
    expect(classeDaHabilidade(conteudo, skill)).toBe('guerreiro');
    expect(classeDaHabilidade(conteudo, 'barreira')).toBeNull();
    const livro = [...conteudo.itens.values()].find((i) => i.tipo === 'livro' && i.ensina === skill);
    if (livro) expect(classeDoItem(conteudo, livro.id)).toBe('guerreiro');
    expect(classeDoItem(conteudo, 'pocao_vida')).toBeNull();
  });
});

describe('seleção de classe', () => {
  it('cada classe tem retrato com a arma', () => {
    for (const c of conteudo.classes.values()) {
      const svg = mioloDoRetrato(c.modelo);
      expect(svg, c.id).toBeTruthy();
      expect(svg?.length).toBeGreaterThan(200);
    }
    expect(mioloDoRetrato('nada')).toBeNull();
  });

  it('a linha de lore é a primeira frase', () => {
    expect(primeiraFrase('Um. Dois. Três.')).toBe('Um.');
    expect(primeiraFrase('Sem ponto')).toBe('Sem ponto');
  });
});

describe('preferência da runa', () => {
  it('liga por padrão e tolera o save antigo', () => {
    expect(PREFERENCIAS_PADRAO.runaDaClasse).toBe(true);
    expect(PREFERENCIAS_PADRAO.seguirAlvo).toBe(true);
    expect(normalizarPreferencias({}).runaDaClasse).toBe(true);
    expect(normalizarPreferencias({ runaDaClasse: false, seguirAlvo: false })).toMatchObject({ runaDaClasse: false, seguirAlvo: false });
  });
});
