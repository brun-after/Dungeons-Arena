import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FONTES_OFICIAIS, lerConteudo } from '../../src/core/conteudo';
import type { ModoDeJogo } from '../../src/modos/modo';
import { podeFerir, relacao } from '../../src/modos/relacao';

const modo = (politicaRelacao: ModoDeJogo['politicaRelacao'], fogoAmigo = false): ModoDeJogo => ({
  id: 'm',
  nome: 'm',
  politicaRelacao,
  fogoAmigo,
});

describe('relacao() (§2.5)', () => {
  const a = { id: 'a', equipe: 'azul' };
  const b = { id: 'b', equipe: 'azul' };
  const c = { id: 'c', equipe: 'vermelho' };

  it('própria entidade é sempre "proprio"', () => {
    expect(relacao(a, a, modo('todos_hostis'))).toBe('proprio');
  });

  it('por equipe: mesma equipe é aliado, outra é hostil', () => {
    expect(relacao(a, b, modo('por_equipe'))).toBe('aliado');
    expect(relacao(a, c, modo('por_equipe'))).toBe('hostil');
  });

  it('todos hostis (Livre) e todos aliados (Horda) ignoram a equipe', () => {
    expect(relacao(a, b, modo('todos_hostis'))).toBe('hostil');
    expect(relacao(a, c, modo('todos_aliados'))).toBe('aliado');
  });

  it('fogo amigo é parâmetro do modo', () => {
    expect(podeFerir(a, b, modo('por_equipe'))).toBe(false);
    expect(podeFerir(a, b, modo('por_equipe', true))).toBe(true);
    expect(podeFerir(a, a, modo('por_equipe', true))).toBe(false);
  });
});

describe('conteúdo oficial (§3.9)', () => {
  it('skills, inimigos, classes e modo validam e se referenciam corretamente', () => {
    expect(lerConteudo(FONTES_OFICIAIS).erros).toEqual([]);
  });

  it('referência a habilidade inexistente é recusada', () => {
    const inimigos = { presets: [{ ...(FONTES_OFICIAIS.inimigos as { presets: object[] }).presets[0], ataqueBasico: 'nada' }] };
    const { erros } = lerConteudo({ ...FONTES_OFICIAIS, inimigos });
    expect(erros.some((e) => e.includes('habilidade desconhecida "nada"'))).toBe(true);
  });

  it('o ataque básico conjura em 504 ms e toda ação ofensiva dá ao menos 200 ms de aviso (§3.6)', () => {
    const { conteudo } = lerConteudo(FONTES_OFICIAIS);
    expect(conteudo.habilidades.get('ataque_basico')?.conjuracaoMs).toBe(504);
    for (const h of conteudo.habilidades.values()) {
      if (h.politicaAlvo === 'hostil') expect(h.conjuracaoMs, h.id).toBeGreaterThanOrEqual(200);
    }
  });
});

describe('arquitetura: hostilidade nunca pelo tipo (aceite 7)', () => {
  // Mira, IA, efeitos, dano, XP e modos não podem consultar `tipo` da entidade.
  // A colisão (§2.3) é a exceção prevista pela spec e fica fora desta lista.
  const PASTAS = ['combat', 'modos', 'progression'].map((p) => join(import.meta.dirname, '../../src', p));
  const ARQUIVOS_EXTRAS = ['entities/ia.ts'].map((p) => join(import.meta.dirname, '../../src', p));

  function arquivos(pasta: string): string[] {
    return readdirSync(pasta).flatMap((nome) => {
      const caminho = join(pasta, nome);
      return statSync(caminho).isDirectory() ? arquivos(caminho) : caminho.endsWith('.ts') ? [caminho] : [];
    });
  }

  it('nenhum arquivo de combate, modo ou progressão lê `.tipo` de entidade', () => {
    const lista = [...PASTAS.flatMap(arquivos), ...ARQUIVOS_EXTRAS.filter((c) => {
      try {
        return statSync(c).isFile();
      } catch {
        return false;
      }
    })];
    expect(lista.length).toBeGreaterThan(5);
    const ofensores = lista.filter((c) => /\.tipo\s*(===|!==|==|!=)\s*'(jogador|inimigo|invocacao|avatar)'/.test(readFileSync(c, 'utf8')));
    expect(ofensores).toEqual([]);
  });
});
