import { caminho } from '../../src/world/navegacao';
// Marco 29 (30/10/2026, D-128): o Reino Central em dados e o exterior gerado pela semente da região.

import { describe, expect, it } from 'vitest';
import { conteudoOficial } from '../../src/core/conteudo';
import reinoJson from '../../src/data/mundo/reino-central.json';
import { lerReino, ladoOposto, portaDa, regiaoPorId, vizinha, type Reino } from '../../src/mundo/reino';
import { carregarFase, passavel } from '../../src/world/fase';
import { gerarExterior } from '../../src/world/gerador-exterior';
import { validarFase } from '../../src/world/validacao-fase';

function reino(): Reino {
  const r = conteudoOficial().reinos.get('reino_central');
  if (!r) throw new Error('reino_central ausente');
  return r;
}

describe('Reino Central', () => {
  it('carrega sem erros com 3×3 regiões, 2 vilas, 1 região perigosa, 8 masmorras e 3 covis', () => {
    const r = reino();
    expect(r.regioes).toHaveLength(9);
    expect(r.regioes.filter((x) => x.vila)).toHaveLength(2);
    expect(r.regioes.filter((x) => x.perigo === 'perigoso')).toHaveLength(1);
    expect(r.masmorras).toHaveLength(8);
    expect(r.covis.map((c) => c.boss).sort()).toEqual(['bruxa_do_pantano', 'dragao_das_ruinas', 'rei_goblin']);
    expect(r.perigos.perigoso.pvp).toBe(true);
    expect(r.perigos.normal.pvp).toBe(false);
  });

  it('toda masmorra e todo covil têm uma porta no mapa', () => {
    const r = reino();
    const destinos = new Set(r.regioes.flatMap((x) => x.estruturas.map((e) => e.destino.id)));
    for (const m of [...r.masmorras, ...r.covis]) expect(destinos.has(m.id)).toBe(true);
  });

  it('recusa destino desconhecido, id repetido e início sem vila', () => {
    const json = structuredClone(reinoJson) as { inicio: string; regioes: { id: string; estruturas: { destino: { id: string } }[] }[] };
    const comPorta = json.regioes.find((x) => x.estruturas.length > 0);
    if (!comPorta?.estruturas[0]) throw new Error('sem estrutura');
    comPorta.estruturas[0].destino.id = 'nao_existe';
    json.inicio = 'campos_do_oeste';
    const regiao1 = json.regioes[1];
    if (regiao1) regiao1.id = 'vila_do_centro';
    const { reino: lido, erros } = lerReino(json);
    expect(lido).toBeNull();
    expect(erros.some((e) => e.includes('nao_existe'))).toBe(true);
    expect(erros.some((e) => e.includes('repetido'))).toBe(true);
  });

  it('vizinhas e lados opostos', () => {
    const r = reino();
    const centro = regiaoPorId(r, 'vila_do_centro');
    if (!centro) throw new Error('sem centro');
    expect(vizinha(r, centro, 'norte')?.id).toBe('ruinas_do_norte');
    expect(vizinha(r, centro, 'oeste')?.id).toBe('campos_do_oeste');
    const canto = regiaoPorId(r, 'floresta_antiga');
    if (!canto) throw new Error('sem canto');
    expect(vizinha(r, canto, 'norte')).toBeUndefined();
    expect(ladoOposto('leste')).toBe('oeste');
  });
});

describe('gerarExterior', () => {
  it('é determinístico pela semente', () => {
    const r = reino();
    for (const regiao of r.regioes) {
      const a = gerarExterior(r, regiao);
      const b = gerarExterior(r, regiao);
      expect(a.fase.mapa).toEqual(b.fase.mapa);
      expect(a.pontos).toEqual(b.pontos);
      expect(a.fase.inimigos).toEqual(b.fase.inimigos);
    }
  });

  it('gera fases válidas do tamanho da região, com spawns andáveis', () => {
    const r = reino();
    const presets = new Set(conteudoOficial().presets.keys());
    for (const regiao of r.regioes) {
      const { fase } = gerarExterior(r, regiao);
      expect(fase.mapa).toHaveLength(regiao.tamanho ?? r.tamanhoRegiao);
      const v = validarFase(fase, presets);
      expect(v.ok ? [] : v.erros.slice(0, 3), regiao.id).toEqual([]);
      const f = carregarFase(fase);
      for (const s of fase.spawns) expect(passavel(f, s.x, s.y)).toBe(true);
    }
  });

  it('a vila tem os NPCs e nenhum inimigo dentro', () => {
    const r = reino();
    const regiao = regiaoPorId(r, 'vila_do_centro');
    if (!regiao?.vila) throw new Error('sem vila');
    const ex = gerarExterior(r, regiao);
    const papeis = ex.pontos.flatMap((p) => (p.tipo === 'npc' ? [p.papel] : []));
    expect(papeis.sort()).toEqual([...regiao.vila.npcs].sort());
    for (const i of ex.fase.inimigos ?? []) expect(Math.hypot(i.x - regiao.vila.x, i.y - regiao.vila.y)).toBeGreaterThan(regiao.vila.raio);
  });

  it('passagens só onde há vizinha, e as portas das estruturas ficam alcançáveis', () => {
    const r = reino();
    const canto = regiaoPorId(r, 'floresta_antiga');
    const sul = regiaoPorId(r, 'bosque_do_sul');
    if (!canto || !sul) throw new Error('regiões ausentes');
    const ex = gerarExterior(r, canto);
    expect(ex.passagens.norte).toHaveLength(0);
    expect(ex.passagens.oeste).toHaveLength(0);
    expect(ex.passagens.sul.length).toBeGreaterThan(0);
    expect(ex.passagens.leste.length).toBeGreaterThan(0);
    const exSul = gerarExterior(r, sul);
    const f = carregarFase(exSul.fase);
    for (const e of sul.estruturas) {
      const { frente } = portaDa(e);
      expect(passavel(f, frente.x, frente.y)).toBe(true);
    }
    expect(exSul.pontos.filter((p) => p.tipo === 'coleta').length).toBeGreaterThan(0);
    expect((exSul.fase.inimigos ?? []).length).toBeGreaterThan(10);
  });

  it('marco 31 (D-130): casas com telhado: na vila (perto) e abandonadas com um monstro dentro (dentro)', () => {
    const r = reino();
    for (const regiao of r.regioes) {
      const { fase } = gerarExterior(r, regiao);
      const f = carregarFase(fase);
      const telhados = fase.telhados ?? [];
      if (regiao.perigo !== 'seguro') expect(telhados.filter((t) => t.revela === 'dentro')).toHaveLength(r.perigos[regiao.perigo].casas);
      if (regiao.perigo === 'seguro') expect(telhados.every((t) => t.revela === 'perto')).toBe(true);
      for (const t of telhados) {
        // A porta no meio da parede sul é andável, e a parede em volta fecha o resto.
        expect(passavel(f, t.x + Math.floor(t.largura / 2), t.y + t.altura - 1)).toBe(true);
        expect(passavel(f, t.x, t.y)).toBe(false);
        expect(passavel(f, t.x + t.largura - 1, t.y + t.altura - 1)).toBe(false);
        if (t.revela === 'dentro') {
          const dentro = (fase.inimigos ?? []).filter((i) => i.x > t.x && i.x < t.x + t.largura - 1 && i.y > t.y && i.y < t.y + t.altura - 1);
          expect(dentro.length).toBeGreaterThan(0);
        }
      }
    }
    const centro = regiaoPorId(r, 'vila_do_centro');
    if (!centro) throw new Error('sem vila');
    expect((gerarExterior(r, centro).fase.telhados ?? []).length).toBeGreaterThanOrEqual(8);
  });
});


it('as regiões variam e ficam dentro de três vezes a área original', () => {
  const r = reino();
  expect(new Set(r.regioes.map(x => x.tamanho)).size).toBeGreaterThan(3);
  for (const regiao of r.regioes) {
    const n = regiao.tamanho ?? r.tamanhoRegiao;
    expect(n * n).toBeGreaterThan(128 * 128);
    expect(n * n).toBeLessThanOrEqual(3 * 128 * 128);
    const ex = gerarExterior(r, regiao);
    expect(ex.fase.mapa[1]?.[1]).toBe('~');
    const inimigos = ex.fase.inimigos ?? [];
    const agrupados = inimigos.filter(a => inimigos.some(b => a !== b && Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 7));
    expect(agrupados.length / inimigos.length, regiao.id).toBeGreaterThan(0.6);
    for (const preset of regiao.inimigos) expect(r.materiais[preset]).toContainEqual({ itemId: 'pergaminho_retorno', chancePct: 6 });
  }
});


it('todas as portas visíveis e NPCs são alcançáveis a partir da entrada', () => {
  const r = reino();
  for (const regiao of r.regioes) {
    const ex = gerarExterior(r, regiao), fase = carregarFase(ex.fase), origem = ex.fase.spawns[0];
    if (!origem) throw new Error('spawn');
    for (const p of ex.pontos) {
      if (p.tipo === 'coleta' || (p.tipo === 'estrutura' && p.escondida)) continue;
      const destino = p.tipo === 'npc' ? p : p.frente;
      expect(caminho(fase, origem, destino, fase.largura * fase.altura).status, `${regiao.id}: ${JSON.stringify(destino)}`).toBe('alcancado');
    }
  }
});
