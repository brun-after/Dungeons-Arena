// D-175 (15/11/2026): toda skill e toda ultimate têm a narrativa, a descrição do visual e a receita.
import { describe, expect, it } from 'vitest';
import { ASSINATURAS_VISUAIS } from '../../src/combat/assinaturas-visuais';
import { criarJogador } from '../../src/entities/fabrica';
import { t, tOu } from '../../src/i18n';
import { historiaDaSkill } from '../../src/ui/historia-skill';
import { linhasDaSkill } from '../../src/ui/descricao-skill';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}
const ctx = contexto(faseDeTexto(SALA_ABERTA));
const mago = () => criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 2, 2, ctx.balance);

describe('a história das skills (D-175)', () => {
  it('toda assinatura visual tem a frase do que se vê', () => {
    for (const nome of ASSINATURAS_VISUAIS) {
      if (nome.startsWith('arma_')) continue;
      expect(tOu(`visual.${nome}`, ''), nome).not.toBe('');
    }
  });

  it('as skills comuns têm a narrativa do núcleo com a matéria do elemento, cada uma diferente', () => {
    const j = mago();
    const vistas = new Set<string>();
    let n = 0;
    for (const def of CONTEUDO.definicoes.values()) {
      if (!def.nucleo || def.interna) continue;
      const h = obter(historiaDaSkill(ctx, j, def.base.id, 0));
      expect(h.narrativa, def.base.id).not.toBe(t('narrativa.padrao'));
      expect(h.narrativa).not.toContain('{materia}');
      expect(h.visual.length, def.base.id).toBeGreaterThan(10);
      expect(h.receita.length, def.base.id).toBeGreaterThan(1);
      vistas.add(h.narrativa);
      n++;
    }
    expect(n).toBe(89);
    expect(vistas.size).toBe(89);
  });

  it('as skills de classe e os básicos de classe têm narrativa própria', () => {
    for (const classe of CONTEUDO.classes.values()) {
      const j = criarJogador(classe, 'j', 2, 2, ctx.balance);
      for (const id of [classe.ataqueBasico, ...classe.exclusivas]) {
        const h = obter(historiaDaSkill(ctx, j, id, 0));
        expect(h.narrativa, id).toBe(t(`narrativa.skill.${id}` as Parameters<typeof t>[0]));
        expect(h.receita.some((l) => l.includes(classe.nome)) || id === classe.ataqueBasico, id).toBe(true);
      }
    }
  });

  it('as 21 famílias de ultimate têm narrativa, e o visual diz a classe de quem lança', () => {
    const j = mago();
    for (const u of CONTEUDO.ultimates.values()) {
      const h = obter(historiaDaSkill(ctx, j, u.id, 0));
      expect(h.narrativa, u.id).not.toBe(t('narrativa.padrao'));
      expect(h.visual, u.id).toContain(t('visualExtra.classe.mago'));
    }
  });

  it('a descrição do seletor da barra abre com a história e o visual', () => {
    const j = mago();
    const linhas = linhasDaSkill(ctx, j, 'nova_glacial');
    expect(linhas[0]).toBe(t('narrativa.skill.nova_glacial'));
    expect(linhas[1]).toContain(t('visual.nova_glacial'));
  });

  it('a receita diz a runa, a sintonia e o nível da skill de classe', () => {
    const j = mago();
    const b = obter(j.bolsa);
    b.conhecidas = [...b.conhecidas.filter((c) => c.id !== 'nova_glacial'), { id: 'nova_glacial', rank: 2, caminhos: [] }];
    const receita = obter(historiaDaSkill(ctx, j, 'nova_glacial', 0)).receita.join('\n');
    expect(receita).toContain('Runa');
    expect(receita).toContain('Sintonia');
    expect(receita).toContain('Nível 2');
    expect(receita).toContain('Marcos');
  });
});
