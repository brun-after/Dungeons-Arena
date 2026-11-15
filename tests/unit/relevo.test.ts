// Marco 42 (15/11/2026, D-176): o relevo: as regras pelo desnível e a geração nas regiões do Mundo.
import { describe, expect, it } from 'vitest';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarJogador } from '../../src/entities/fabrica';
import { gerarExterior } from '../../src/world/gerador-exterior';
import { caminho } from '../../src/world/navegacao';
import { alturaEm, fatorDeSubida, passaDesnivel, tiroPassaEntre } from '../../src/world/relevo';
import { tiroLivre } from '../../src/combat/linha-de-tiro';
import type { Fase } from '../../src/world/fase';
import { CONTEUDO, contexto, faseDeTexto } from '../apoio/fases';

const R = BALANCE_PADRAO.relevo;

/** Uma sala aberta com as alturas por linha (um dígito por célula). */
function comAlturas(mapa: string[], alturas: string[]): Fase {
  const f = faseDeTexto(mapa);
  const a = new Uint8Array(f.largura * f.altura);
  alturas.forEach((linha, y) => {
    for (let x = 0; x < linha.length; x++) a[y * f.largura + x] = Number(linha.charAt(x));
  });
  return { ...f, alturas: a };
}

const MAPA = ['##########', '#........#', '#........#', '#........#', '##########'];

describe('regras do relevo (D-176)', () => {
  it('a tabela: encosta anda; muro baixo só salta; muro alto só voa; acima, ninguém', () => {
    expect(passaDesnivel(R, R.encostaMax, 'andar')).toBe(true);
    expect(passaDesnivel(R, R.muroBaixoMax, 'andar')).toBe(false);
    expect(passaDesnivel(R, R.muroBaixoMax, 'saltar')).toBe(true);
    expect(passaDesnivel(R, R.muroBaixoMax + 1, 'saltar')).toBe(false);
    expect(passaDesnivel(R, R.muroAltoMax, 'voar')).toBe(true);
    expect(passaDesnivel(R, R.muroAltoMax + 1, 'voar')).toBe(false);
    // Descer saltando ou voando: qualquer altura; a pé, o muro também barra na descida.
    expect(passaDesnivel(R, -9, 'saltar')).toBe(true);
    expect(passaDesnivel(R, -R.muroBaixoMax, 'andar')).toBe(false);
  });

  it('subir a encosta custa velocidade; descer não; a montaria sente menos', () => {
    const f = comAlturas(MAPA, ['0000000000', '0012000000', '0000000000', '0000000000', '0000000000']);
    expect(fatorDeSubida(f, R, { x: 1, y: 1 }, { x: 2, y: 1 })).toBeCloseTo(1 - R.subidaPctPorNivel / 100, 5);
    expect(fatorDeSubida(f, R, { x: 3, y: 1 }, { x: 2, y: 1 })).toBe(1);
    expect(fatorDeSubida(f, R, { x: 1, y: 1 }, { x: 2, y: 1 }, true)).toBeGreaterThan(fatorDeSubida(f, R, { x: 1, y: 1 }, { x: 2, y: 1 }));
  });

  it('a navegação contorna o muro pela rampa', () => {
    // Um muro alto na coluna 4, com uma rampa (encosta) na linha 3.
    const f = comAlturas(MAPA, ['0000000000', '0000500000', '0000500000', '0000200000', '0000000000']);
    const r = caminho(f, { x: 2, y: 1 }, { x: 6, y: 1 }, 60);
    expect(r.status).toBe('alcancado');
    expect(r.passos.some((p) => p.y === 3 && p.x === 4)).toBe(true);
    expect(r.passos.every((p) => alturaEm(f, p.x, p.y) !== 5)).toBe(true);
  });

  it('o tiro passa o muro baixo e para no alto; de cima, atira para baixo', () => {
    const baixo = comAlturas(MAPA, ['0000000000', '0000300000', '0000300000', '0000300000', '0000000000']);
    const alto = comAlturas(MAPA, ['0000000000', '0000500000', '0000500000', '0000500000', '0000000000']);
    expect(tiroPassaEntre(baixo, { x: 3, y: 2 }, { x: 4, y: 2 })).toBe(true);
    expect(tiroPassaEntre(alto, { x: 3, y: 2 }, { x: 4, y: 2 })).toBe(false);
    expect(tiroPassaEntre(alto, { x: 4, y: 2 }, { x: 5, y: 2 })).toBe(true);
    const ctx = contexto(alto);
    const estado = criarEstado({ semente: 1, faseId: 't' });
    expect(tiroLivre(estado, ctx, { x: 1, y: 2 }, { x: 7, y: 2 })).toBe(false);
  });

  it('a pé, o corpo não sobe o muro baixo', () => {
    const f = comAlturas(MAPA, ['0000000000', '0000333000', '0000333000', '0000333000', '0000000000']);
    const ctx = contexto(f);
    const estado = criarEstado({ semente: 1, faseId: 't' });
    const classe = CONTEUDO.classes.get('guerreiro');
    if (!classe) throw new Error('classe');
    const j = criarJogador(classe, 'p1', 2, 2, ctx.balance);
    estado.entidades.push(j);
    j.rumoX = 1;
    j.rumoY = 0;
    j.direcao = 'E';
    const ev: EventoSimulacao[] = [];
    for (let i = 0; i < 60; i++) simular(estado, ctx, [], ev, DT_MS);
    expect(j.px).toBeLessThan(3.6);
  });
});

describe('relevo das regiões (D-176)', () => {
  const reino = CONTEUDO.reinos.get('reino_central');
  if (!reino) throw new Error('reino');

  it('é determinístico e as colinas têm encostas e muros', () => {
    const regiao = reino.regioes.find((r) => r.bioma === 'colinas');
    if (!regiao) throw new Error('colinas');
    const a = gerarExterior(reino, regiao).alturas;
    const b = gerarExterior(reino, regiao).alturas;
    expect([...a]).toEqual([...b]);
    const n = regiao.tamanho ?? reino.tamanhoRegiao;
    let encostas = 0;
    let muros = 0;
    for (let y = 1; y < n - 1; y++) {
      for (let x = 1; x < n - 2; x++) {
        const d = Math.abs((a[y * n + x + 1] ?? 0) - (a[y * n + x] ?? 0));
        if (d > 0 && d <= R.encostaMax) encostas++;
        else if (d > R.encostaMax) muros++;
      }
    }
    expect(encostas).toBeGreaterThan(200);
    expect(muros).toBeGreaterThan(20);
  });

  it('a vila e as chegadas ficam planas', () => {
    for (const regiao of reino.regioes) {
      const ex = gerarExterior(reino, regiao);
      const n = regiao.tamanho ?? reino.tamanhoRegiao;
      for (const s of ex.fase.spawns) expect(ex.alturas[s.y * n + s.x], `${regiao.id} chegada`).toBe(0);
      if (regiao.vila) expect(ex.alturas[regiao.vila.y * n + regiao.vila.x], `${regiao.id} vila`).toBe(0);
    }
  });

  it('as estruturas, a coleta e as luzes ficam onde se chega a pé', () => {
    for (const regiao of reino.regioes) {
      const ex = gerarExterior(reino, regiao);
      const fase = { ...faseDeTexto(ex.fase.mapa), alturas: ex.alturas };
      const origem = ex.fase.spawns[0];
      if (!origem) continue;
      for (const p of ex.pontos) {
        if (p.tipo !== 'coleta' && p.tipo !== 'estrutura') continue;
        const c = p.tipo === 'estrutura' ? p.frente : p;
        expect(caminho(fase, origem, c, 100_000).status, `${regiao.id} ${p.tipo}`).toBe('alcancado');
      }
    }
  });
});
