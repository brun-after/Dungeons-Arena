// D-174 (14/11/2026): a skill de classe com a runa de outro elemento é feita inteira dele (a matéria e a cor), sem
// perder a silhueta; a ultimate não é igual entre as classes; a afinidade dominante só aparece quando se destaca.
import { describe, expect, it } from 'vitest';
import { perfilVisualDe } from '../../src/render/perfil-visual';
import { ASSINATURAS } from '../../src/render/vfx/assinaturas';
import { CLASSES_COM_RUNA, COR_DA_RUNA, RUNAS_VFX } from '../../src/render/vfx/manifestacao-runa';
import { corTrocada, emissoesTrocadas, texturaTrocada, trocaDe } from '../../src/render/vfx/transmutacao';
import { ehNucleoComGesto, NUCLEOS_COM_GESTO } from '../../src/render/vfx/nucleo-no-visual';
import { assinaturaDe } from '../../src/render/vfx/resolver';
import { visualDasComuns } from '../../src/render/visual-comum';
import { criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

describe('a transmutação pela runa (D-174)', () => {
  it('só troca quando a runa é de outro elemento', () => {
    expect(trocaDe('gelo', 'gelo')).toBeNull();
    expect(trocaDe('gelo', undefined)).toBeNull();
    expect(trocaDe('gelo', 'raio')).toEqual({ de: 'gelo', para: 'raio' });
    expect(trocaDe('arcano', 'psiquico')).toBeNull();
    expect(trocaDe('arqueiro', 'raio')).toEqual({ de: 'fisico', para: 'raio' });
  });

  it('a matéria do elemento de origem vira a da runa; a silhueta fica', () => {
    const troca = { de: 'gelo', para: 'raio' } as const;
    expect(texturaTrocada('gelo', troca)).toBe('arco');
    expect(texturaTrocada('floco', troca)).toBe('faisca');
    // A geada do chão não tem par no raio: some.
    expect(texturaTrocada('geada', troca)).toBeNull();
    // O círculo rúnico, a lâmina e os ossos são silhueta: ficam.
    for (const t of ['circulo_runico', 'lamina', 'cranio', 'mao_ossea', 'arco_golpe', 'hexagono']) expect(texturaTrocada(t, troca)).toBe(t);
    expect(texturaTrocada('chama3', { de: 'fogo', para: 'gelo' })).toBe('gelo');
    expect(texturaTrocada('queimado', { de: 'fogo', para: 'terra' })).toBe('rachadura');
  });

  it('a cor vai para o matiz da runa e guarda o claro e o escuro', () => {
    const troca = { de: 'gelo', para: 'fogo' } as const;
    expect(corTrocada(0xffffff, troca)).toBe(0xffffff);
    expect(corTrocada(0x000000, troca)).toBe(0);
    // Um azul vivo vira a cor do fogo, sem azul sobrando acima do vermelho.
    const c = corTrocada(0x2060ff, troca);
    expect((c >> 16) & 255).toBeGreaterThan(c & 255);
    expect(corTrocada(0x0000ff, { de: 'gelo', para: 'raio' })).toBe(COR_DA_RUNA.raio);
  });

  it('toda assinatura de elemento, em qualquer outra runa, fica sem a matéria de origem nas partículas', () => {
    for (const [nome, def] of Object.entries(ASSINATURAS)) {
      for (const runa of RUNAS_VFX) {
        const troca = trocaDe(def.familia, runa);
        if (!troca) continue;
        for (const lista of [def.conjuracao, def.corpo, def.rastro, def.impacto]) {
          if (!lista) continue;
          const trocadas = emissoesTrocadas(lista, troca);
          expect(trocadas).toHaveLength(lista.length);
          for (const [i, e] of trocadas.entries()) {
            const original = obter(lista[i]);
            // O que era matéria do elemento antigo mudou (ou o par é a mesma textura nos dois elementos).
            const esperado = texturaTrocada(original.textura, troca) ?? original.textura;
            expect(e.textura, `${nome} em ${runa}`).toBe(esperado);
          }
        }
      }
    }
  });

  it('o gelo do Mago em raio: nenhuma lasca de gelo, nenhum floco', () => {
    const def = ASSINATURAS.nova_glacial;
    const troca = obter(trocaDe(def.familia, 'raio'));
    const texturas = [def.conjuracao, def.corpo, def.rastro, def.impacto].flatMap((l) => emissoesTrocadas(l ?? [], troca).map((e) => e.textura));
    expect(texturas).not.toContain('gelo');
    expect(texturas).not.toContain('floco');
    expect(texturas).not.toContain('cristal');
  });
});

describe('o perfil visual de quem lança (D-174)', () => {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  it('as cinco classes têm a sua assinatura de ultimate', () => {
    expect([...CLASSES_COM_RUNA].sort()).toEqual([...CONTEUDO.classes.keys()].sort());
  });

  it('a afinidade dominante só aparece quando se destaca', () => {
    const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 2, 2, ctx.balance);
    const b = obter(j.bolsa);
    b.barra = b.barra.map(() => 'bola_de_fogo');
    expect(perfilVisualDe(ctx, j, 0)?.dominante?.runa).toBe('fogo');
    // Metade fogo, metade gelo: nenhuma se sobressai.
    b.barra = b.barra.map((_, i) => (i % 2 ? 'bola_de_fogo' : 'lanca_de_gelo'));
    expect(perfilVisualDe(ctx, j, 0)?.dominante).toBeNull();
    // Sem ficha, sem perfil.
    expect(perfilVisualDe(ctx, { ...j, bolsa: undefined } as unknown as typeof j, 0)).toBeNull();
  });
});

describe('o visual das skills comuns (D-175)', () => {
  it('nenhuma repete o visual de outra: a assinatura, a matéria e o gesto do núcleo formam um trio único', () => {
    const comuns = visualDasComuns(CONTEUDO);
    expect(comuns.size).toBe(89);
    const trios = new Set<string>();
    for (const [id, v] of comuns) {
      const h = obter(CONTEUDO.habilidades.get(id));
      const nome = assinaturaDe(h);
      const troca = v.trocar ? trocaDe(ASSINATURAS[nome].familia, h.elemento ?? 'fisico') : null;
      expect(ehNucleoComGesto(v.nucleo), id).toBe(true);
      trios.add(`${nome}|${troca?.para ?? ''}|${v.nucleo}`);
    }
    expect(trios.size).toBe(89);
  });

  it('os 20 núcleos têm gesto', () => {
    expect([...NUCLEOS_COM_GESTO].sort()).toEqual([...new Set([...CONTEUDO.definicoes.values()].flatMap((d) => (d.nucleo ? [d.nucleo] : [])))].sort());
  });
});
