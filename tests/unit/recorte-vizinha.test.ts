// Marco 41 (14/11/2026, D-169): o pedaço da região vizinha desenhado além da borda. Ele fica todo fora do mapa daqui
// (nada de lá em pé por cima do daqui), continua o corredor da passagem logo depois da borda e é o mesmo mapa que a
// cena de lá vai mostrar (o chão assado é reaproveitado).

import { describe, expect, it } from 'vitest';
import { modoPorId } from '../../src/core/conteudo';
import { lerLugar, montarLugar } from '../../src/mundo/lugares';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import type { Fase } from '../../src/world/fase';
import { passavel, tipoEm } from '../../src/world/fase';
import { celulaDaFaixa, LARGURA_PASSAGEM } from '../../src/world/passagens-exterior';
import { recorteDaVizinha } from '../../src/world/recorte-vizinha';
import { CONTEUDO } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const REINO = obter(CONTEUDO.reinos.get('reino_central'), 'reino');
const MODO = modoPorId(CONTEUDO, MODO_MUNDO);

function faseDe(id: string): Fase {
  const l = obter(lerLugar(REINO, id), id);
  return montarLugar(CONTEUDO, REINO, l, MODO).ctx.fase;
}

describe('a região vizinha além da borda (D-169)', () => {
  it('fica fora do mapa daqui, continua o corredor e guarda o mapa inteiro de lá', () => {
    let conferidas = 0;
    for (const regiao of REINO.regioes) {
      const aqui = faseDe(`regiao:${regiao.id}`);
      for (const area of aqui.passagens ?? []) {
        const lado = obter(area.lado, 'lado');
        const la = faseDe(obter(area.destino, 'destino'));
        const r = recorteDaVizinha(aqui.largura, lado, la);
        expect(r.completa).toBe(la);
        let celulas = 0;
        for (let y = 0; y < la.altura; y++) for (let x = 0; x < la.largura; x++) {
          if (tipoEm(r.fase, x, y) === 'vazio') continue;
          celulas++;
          const xa = x + r.dx;
          const ya = y + r.dy;
          expect(xa < 0 || ya < 0 || xa >= aqui.largura || ya >= aqui.altura, `${regiao.id} ${lado} ${x},${y}`).toBe(true);
          expect(tipoEm(r.fase, x, y)).toBe(tipoEm(la, x, y));
        }
        expect(celulas).toBeGreaterThan(0);
        // Logo além da borda, o corredor segue andável do outro lado.
        for (let u = 0; u < LARGURA_PASSAGEM; u++) {
          const fora = celulaDaFaixa(aqui.largura, lado, u, -1);
          expect(passavel(r.fase, fora.x - r.dx, fora.y - r.dy), `${regiao.id} ${lado} u${u}`).toBe(true);
        }
        for (const e of r.fase.enfeites ?? []) expect(tipoEm(r.fase, e.x, e.y)).not.toBe('vazio');
        conferidas++;
      }
    }
    expect(conferidas).toBeGreaterThan(4);
  });
});
