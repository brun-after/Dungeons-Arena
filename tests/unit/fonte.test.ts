// A fonte do jogo, Runas de Filo (25/11/2026): a guardada em src/assets confere com o gerador (tools/fonte), cobre o
// português dos títulos e tem as runas onde a interface as procura (ui/runa-texto.ts).

import { readFileSync } from 'node:fs';
import opentype from 'opentype.js';
import { describe, expect, it } from 'vitest';
import { gerarFonte } from '../../tools/fonte/gerar';
import { CLASSES_DA_FONTE, ELEMENTOS_DA_FONTE, caractereDaRuna } from '../../src/ui/runa-texto';

const guardada = () => {
  const b = readFileSync('src/assets/fontes/runas-de-filo.otf');
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};

describe('fonte Runas de Filo', () => {
  it('a fonte guardada é a que o gerador faz hoje (rode npm run fonte depois de mexer em tools/fonte)', () => {
    const nova = gerarFonte();
    const velha = guardada();
    expect(velha.glyphs.length).toBe(nova.glyphs.length);
    for (let i = 1; i < nova.glyphs.length; i++) {
      const a = nova.glyphs.get(i), b = velha.glyphs.get(i);
      const nome = a.name ?? String(i);
      expect(b.unicode, nome).toBe(a.unicode);
      expect(b.advanceWidth, nome).toBe(a.advanceWidth);
      expect(b.path.toPathData(0), nome).toBe(a.path.toPathData(0));
    }
  }, 30_000);

  it('cobre as letras, os acentos e os números dos títulos', () => {
    const f = guardada();
    const texto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ0123456789 .,:;·-–+×/!?\'()%';
    const faltam = Array.from(texto).filter((c) => f.charToGlyphIndex(c) === 0);
    expect(faltam).toEqual([]);
  });

  it('tem uma runa para cada elemento e classe, com desenho', () => {
    const f = guardada();
    for (const id of [...ELEMENTOS_DA_FONTE, ...CLASSES_DA_FONTE]) {
      const g = f.charToGlyph(caractereDaRuna(id));
      expect(g.index, id).toBeGreaterThan(0);
      expect(g.path.commands.length, id).toBeGreaterThan(4);
    }
    expect(caractereDaRuna('nada')).toBe('');
  });
});
