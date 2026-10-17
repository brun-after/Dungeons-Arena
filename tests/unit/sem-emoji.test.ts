// Ajuste de 16/10/2026 (D-067): nenhum emoji no sistema — ícones próprios (data/icones.ts) no lugar. Este teste varre
// o código, os dados, o CSS e o index.html (comentários inclusos) e falha apontando arquivo e linha de cada emoji ou
// pictograma (setas, formas e símbolos usados como ícone). E todo `icone` do conteúdo existe no conjunto.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REGISTRO_EFEITOS } from '../../src/combat/registro-efeitos';
import { ehIcone } from '../../src/data/icones';
import { CONTEUDO } from '../apoio/fases';

/** Emoji e pictogramas: símbolos variados, dingbats, setas, formas geométricas, técnicos e o seletor de emoji. */
const PICTOGRAMA = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{2042}\u{22D4}\u{03DF}\u{3030}]/u;
/** O seletor de apresentação de emoji (U+FE0F), procurado à parte. */
const SELETOR_EMOJI = '\u{FE0F}';

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : /\.(ts|json|css|html)$/.test(nome) ? [caminho] : [];
  });
}

describe('sem emoji', () => {
  it('nenhum arquivo de src/ nem o index.html usa emoji ou pictograma', () => {
    const achados: string[] = [];
    for (const arquivo of [...arquivos('src'), 'index.html']) {
      readFileSync(arquivo, 'utf8')
        .split('\n')
        .forEach((linha, i) => {
          const m = PICTOGRAMA.exec(linha);
          if (m) achados.push(`${arquivo}:${i + 1} "${m[0]}"`);
          else if (linha.includes(SELETOR_EMOJI)) achados.push(`${arquivo}:${i + 1} (FE0F)`);
        });
    }
    expect(achados).toEqual([]);
  });

  it('todo ícone do conteúdo existe no conjunto', () => {
    const icones = [
      ...[...CONTEUDO.itens.values()].map((i) => i.icone),
      ...[...CONTEUDO.habilidades.values()].map((h) => h.icone),
      ...[...CONTEUDO.elementos.values()].map((e) => e.icone),
      ...Object.values(REGISTRO_EFEITOS).map((d) => d.icone),
    ];
    expect(icones.filter((i) => !ehIcone(i))).toEqual([]);
  });
});
