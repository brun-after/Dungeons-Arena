// Marco 48 (20/11/2026, D-192): a runa escolhida, o uso que sustenta o vínculo e o resto da ficha que o servidor
// descartava sobrevivem à ida e volta pelo Mundo, pelo grupo e pela arena (conferirPersonagem), e o uso é reancorado
// no tick de quem recebe.
import { describe, expect, it } from 'vitest';
import { conferirPersonagem, pedidoDoPersonagem } from '../../src/coop/personagem';
import { conferirRunas, conferirVinculoUso } from '../../src/coop/conferir-extras';
import { escolherRuna, runaDoAtor } from '../../src/combat/runas';
import { criarJogador } from '../../src/entities/fabrica';
import { registrarUso, usoAtual } from '../../src/progression/vinculo';
import { ticksDe } from '../../src/core/tempo';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}
const guerreiro = () => criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 2, 2, ctx.balance);

describe('a ficha conferida guarda runas e o vínculo de uso (D-192)', () => {
  it('a runa escolhida passa por conferirPersonagem e continua valendo na sala nova', () => {
    const g = guerreiro();
    const b = obter(g.bolsa);
    for (let i = 0; i < 6; i++) registrarUso(ctx, b, 'gelo', 100);
    expect(escolherRuna(ctx, g, 'redemoinho', 'gelo', 100)).toBe(true);
    const conferido = obter(conferirPersonagem(pedidoDoPersonagem(g), ctx, 'p1', 'dono', 5));
    const nova = conferido.entidade;
    expect(nova.bolsa?.runas).toEqual({ redemoinho: 'gelo' });
    // O uso foi reancorado no tick da sala que recebe (5), e a runa vale lá.
    expect(nova.bolsa?.vinculoUso?.gelo?.tick).toBe(5);
    expect(runaDoAtor(ctx, nova, 'redemoinho', 5)?.runa).toBe('gelo');
    expect(conferido.alteracoes.map((a) => a.campo)).not.toContain('runas');
  });

  it('o uso chega já esfriado até o último uso e não volta a esfriar pelo tick da sala antiga', () => {
    const r = ctx.balance.vinculo;
    const meiaVida = ticksDe(r.usoMeiaVidaS * 1000);
    const uso = obter(conferirVinculoUso(ctx, { fogo: { valor: 8, tick: 1000 }, gelo: { valor: 8, tick: 1000 + meiaVida } }, 3));
    expect(uso.gelo?.valor).toBeCloseTo(8);
    expect(uso.fogo?.valor).toBeCloseTo(4);
    expect(uso.fogo?.tick).toBe(3);
    // Na sala nova o tick é pequeno: sem reancorar, o uso ficaria "no futuro" e nunca esfriaria.
    expect(usoAtual(r, uso.gelo, 3 + meiaVida)).toBeCloseTo(4);
  });

  it('runas inválidas não passam: encaixe que não existe, skill sem encaixe ou elemento desconhecido', () => {
    expect(conferirRunas(ctx, { redemoinho: 'gelo', bola_de_fogo: 'raio', redemoinho_x: 'fogo', lamina_em_brasa: 'agua' })).toEqual({ redemoinho: 'gelo' });
    expect(conferirRunas(ctx, 'gelo')).toBeUndefined();
  });

  it('companheiro, missões, diário e vitórias seguem a ficha, conferidos contra o conteúdo', () => {
    const a = criarJogador(obter(CONTEUDO.classes.get('aventureiro')), 'j', 2, 2, ctx.balance);
    const b = obter(a.bolsa);
    const missao = obter([...CONTEUDO.missoes.values()][0]);
    const chefe = obter([...CONTEUDO.presets.keys()][0]);
    b.pet = 'lobo';
    b.missoes = { [missao.id]: missao.meta + 50, inventada: 3 };
    b.diario = ['fusao:x', 'fusao:x', 42 as unknown as string];
    b.vitorias = { [chefe]: 2, ninguem: 9 };
    const nova = obter(obter(conferirPersonagem(pedidoDoPersonagem(a), ctx, 'p', 'dono')).entidade.bolsa);
    expect(nova.pet).toBe('lobo');
    expect(nova.missoes).toEqual({ [missao.id]: missao.meta - 1 });
    expect(nova.diario).toEqual(['fusao:x']);
    expect(nova.vitorias).toEqual({ [chefe]: 2 });
  });
});
