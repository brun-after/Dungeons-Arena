// Marco 54 (26/11/2026, D-207): o lugar do Mundo contínuo, com as 24 regiões numa fase só.

import { describe, expect, it } from 'vitest';
import { conteudoOficial } from '../../src/core/conteudo';
import { montarMundoContinuo } from '../../src/mundo/mundo-continuo';
import { reinoDoConteudo } from '../../src/mundo/reino';
import { zonaEm } from '../../src/mundo/zonas';
import { Hibernacao } from '../../src/mundo/hibernacao';
import { clonarEstado } from '../../src/core/estado';
import { criarJogador } from '../../src/entities/fabrica';
import { passavel } from '../../src/world/fase';
import { caminho } from '../../src/world/navegacao';

const conteudo = conteudoOficial();
const reino = reinoDoConteudo(conteudo);
const inicio = performance.now();
const mundo = montarMundoContinuo(conteudo, reino, conteudo.modos.get('mundo') ?? conteudo.modoCampanha);
const ms = performance.now() - inicio;

describe('Mundo contínuo montado', () => {
  it('a fase tem o tamanho do atlas e começa na Vila do Centro', () => {
    const f = mundo.ctx.fase;
    expect(f.largura).toBe(mundo.atlas.largura);
    expect(f.altura).toBe(mundo.atlas.altura);
    const s = f.spawns[0];
    expect(s && zonaEm(mundo.zonas, s.x, s.y)).toBe(reino.inicio);
    console.info(`atlas ${String(f.largura)}×${String(f.altura)}, ${String(mundo.estado.entidades.length)} entidades, ${String(mundo.estado.objetos.length)} objetos, ${ms.toFixed(0)} ms`);
  });

  it('ids de entidades e objetos não se repetem', () => {
    const ids = mundo.estado.entidades.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const obj = mundo.estado.objetos.map((o) => o.objetoId);
    expect(new Set(obj).size).toBe(obj.length);
  });

  it('as zonas cobrem toda célula andável', () => {
    const f = mundo.ctx.fase;
    let fora = 0;
    for (let y = 0; y < f.altura; y += 3) for (let x = 0; x < f.largura; x += 3) if (passavel(f, x, y) && zonaEm(mundo.zonas, x, y) === null) fora++;
    expect(fora).toBe(0);
  });

  it('anda-se de uma região a outra pela costura, sem troca de sala', () => {
    const c = mundo.atlas.costuras.find((k) => k.par === ['vila_do_centro', 'campos_do_oeste'].sort().join('|'));
    if (!c) throw new Error('costura');
    const t = Math.floor((c.inicio + c.fim) / 2);
    const de = c.vertical ? { x: c.linha - 6, y: t } : { x: t, y: c.linha - 6 };
    const para = c.vertical ? { x: c.linha + 6, y: t } : { x: t, y: c.linha + 6 };
    expect(caminho(mundo.ctx.fase, de, para, 80).status).toBe('alcancado');
    expect(zonaEm(mundo.zonas, de.x, de.y)).not.toBe(zonaEm(mundo.zonas, para.x, para.y));
  });

  it('hiberna o que está longe do jogador e acorda ao chegar perto', () => {
    const estado = clonarEstado(mundo.estado);
    const s = mundo.ctx.fase.spawns[0];
    const classe = conteudo.classes.get('mago');
    if (!s || !classe) throw new Error('spawn');
    const eu = criarJogador(classe, 'p1', s.x, s.y, mundo.ctx.balance);
    estado.entidades.push(eu);
    const h = new Hibernacao(mundo.ctx.balance.mundo.hibernacao);
    const antes = estado.entidades.length;
    h.conferir(estado, true);
    expect(estado.entidades.length).toBeLessThan(antes / 10);
    expect(estado.entidades).toContain(eu);
    const r = mundo.ctx.balance.mundo.hibernacao;
    // Ninguém acordado fica longe demais; ninguém dormindo fica perto.
    for (const e of estado.entidades) if (e !== eu) expect(Math.max(Math.abs(e.x - eu.x), Math.abs(e.y - eu.y))).toBeLessThanOrEqual(r.raioDormir + r.bloco);
    // Andando até outra região, o que estava lá acorda.
    const c = mundo.atlas.areas.get('ruinas_do_norte');
    if (!c) throw new Error('area');
    eu.x = c.x + Math.floor(c.largura / 2);
    eu.y = c.y + Math.floor(c.altura / 2);
    const dormindo = h.dormindo().entidades;
    h.conferir(estado, true);
    expect(h.dormindo().entidades).not.toBe(dormindo);
    expect(estado.entidades.some((e) => e !== eu && zonaEm(mundo.zonas, e.x, e.y) === 'ruinas_do_norte')).toBe(true);
    expect(h.dormindo().entidades + estado.entidades.length).toBe(antes);
  });
});

// Marco 55 (26/11/2026, D-208): o cliente carimba as regiões conforme chegam (fora de ordem) e chega ao mesmo atlas.
describe('atlas do cliente', () => {
  it('carimbado em outra ordem, tem as mesmas células e listas do servidor', async () => {
    const { criarAtlasDoCliente } = await import('../../src/mundo/atlas-cliente');
    const { gerarRegiaoNoAtlas } = await import('../../src/mundo/atlas-fase');
    const cliente = criarAtlasDoCliente(conteudo, reino, conteudo.modos.get('mundo') ?? conteudo.modoCampanha);
    const ordem = cliente.ordemDePedido(1200, 600);
    expect(new Set(ordem).size).toBe(reino.regioes.length);
    const metade = Math.floor(ordem.length / 2);
    for (const id of ordem.slice(0, metade)) {
      const regiao = reino.regioes.find((r) => r.id === id);
      if (regiao) expect(cliente.receber(id, gerarRegiaoNoAtlas(reino, cliente.atlas, regiao))).not.toBeNull();
    }
    // Pela metade: o que falta é vazio e não se anda.
    const falta = ordem[metade];
    const area = falta ? cliente.atlas.areas.get(falta) : undefined;
    if (area) expect(passavel(cliente.ctx.fase, area.x + (area.largura >> 1), area.y + (area.altura >> 1))).toBe(false);
    for (const id of ordem.slice(metade)) {
      const regiao = reino.regioes.find((r) => r.id === id);
      if (regiao) cliente.receber(id, gerarRegiaoNoAtlas(reino, cliente.atlas, regiao));
    }
    const a = cliente.ctx.fase;
    const b = mundo.ctx.fase;
    expect(a.celulas).toEqual(b.celulas);
    expect(a.alturas).toEqual(b.alturas);
    expect(a.obstaculos).toEqual(b.obstaculos);
    for (const k of ['spawns', 'ambientes', 'refugios', 'telhados', 'ninhos', 'estruturas'] as const) expect(a[k]).toEqual(b[k]);
    expect(a.cenario?.length).toBe(b.cenario?.length);
    expect(cliente.regiaoEm(b.spawns[0]?.x ?? 0, b.spawns[0]?.y ?? 0)?.regiaoId).toBe(reino.inicio);
  }, 120_000);
});
