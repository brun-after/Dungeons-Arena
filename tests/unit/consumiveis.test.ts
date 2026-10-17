// 17/10/2026: os atalhos distinguem o recurso recuperado e a invocação sem depender de tooltip.
import { describe, expect, it } from 'vitest';
import { nomeCurtoConsumivel } from '../../src/ui/consumiveis';
import { CONTEUDO } from '../apoio/fases';

const jogador = { hpMax: 100, manaMax: 10 };
function nome(id: string, recursos = jogador) {
  const item = CONTEUDO.itens.get(id);
  if (!item) throw new Error(`Item ausente: ${id}`);
  return nomeCurtoConsumivel(item, recursos);
}
describe('nomes dos atalhos de consumíveis', () => {
  it('mostra a recuperação nominal e acompanha o máximo de vida e mana', () => {
    expect(nome('pocao_vida')).toBe('Vida +40');
    expect(nome('pocao_mana')).toBe('Mana +5');
    expect(nome('pocao_vida', { hpMax: 201, manaMax: 31 })).toBe('Vida +80');
    expect(nome('pocao_mana', { hpMax: 201, manaMax: 31 })).toBe('Mana +16');
  });
  it('distingue cada pergaminho pelo nome da invocação', () => {
    for (const [id, rotulo] of Object.entries({ lobo: 'Lobo', sombra: 'Sombra', sentinela: 'Sentinela', fada: 'Fada', espantalho: 'Espantalho' })) {
      expect(nome(`pergaminho_${id}`)).toBe(rotulo);
    }
  });
});
