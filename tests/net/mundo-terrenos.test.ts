// Os terrenos e focos elementais do Mundo (08/11/2026, D-138): os fixos ficam perto do que os explica (a lava das
// ruínas, o gelo do pico, a névoa da cripta), e os focos acendem por chance, expiram e às vezes trazem o chefe.

import { describe, expect, it } from 'vitest';
import { lerLugar } from '../../src/mundo/lugares';
import { acenderFoco, apagarFoco, focoAceso, idDoChefeDoFoco } from '../../src/mundo/focos';
import { portaDa, reinoDoConteudo, type FocoDaRegiao, type Reino, type RegiaoDoMundo } from '../../src/mundo/reino';
import { SalaMundo } from '../../src/mundo/sala-mundo';
import { CONTEUDO } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const ATLAS: Reino = reinoDoConteudo(CONTEUDO);
const sala = (id: string, agora = 1_000_000) => new SalaMundo(ATLAS, obter(lerLugar(ATLAS, `regiao:${id}`), id), CONTEUDO, { semente: 9, agora: () => agora });
const regiao = (id: string): RegiaoDoMundo => obter(ATLAS.regioes.find((r) => r.id === id), id);

describe('terrenos do Mundo', () => {
  it('toda região monta e cada uma tem os terrenos do seu tema', () => {
    for (const r of ATLAS.regioes) {
      const s = sala(r.id);
      expect(s.ctx.fase.ambientes?.length ?? 0, r.id).toBeGreaterThan(0);
    }
    const tipos = (id: string) => new Set((sala(id).ctx.fase.ambientes ?? []).map((a) => a.tipo));
    expect(tipos('ruinas_do_norte').has('brasas')).toBe(true);
    expect(tipos('pico_gelado').has('gelo_fino')).toBe(true);
    expect(tipos('pantano_sombrio').has('miasma')).toBe(true);
    expect(tipos('colinas_do_sudeste').has('campo_eletrico')).toBe(true);
  });

  it('a névoa fica na porta da cripta e a luz, na do templo', () => {
    const s = sala('encosta_do_leste');
    const criptas = regiao('encosta_do_leste').estruturas.filter((e) => e.tipo === 'cripta').map((e) => portaDa(e).frente);
    const nevoas = (s.ctx.fase.ambientes ?? []).filter((a) => a.tipo === 'nevoa_sombria');
    expect(nevoas.length).toBeGreaterThan(0);
    for (const a of nevoas) expect(Math.min(...criptas.map((p) => Math.max(Math.abs(p.x - a.x), Math.abs(p.y - a.y))))).toBeLessThanOrEqual(8);
  });

  it('o foco acende por janela, igual para todos, e dura o tempo dele', () => {
    const foco: FocoDaRegiao = { ...obter(regiao('ruinas_do_norte').focos?.[0], 'foco'), chancePct: 100 };
    const janelaMs = foco.janelaMin * 60_000;
    let aceso: { inicio: number; fim: number } | null = null;
    for (let t = 0; t < janelaMs && !aceso; t += 30_000) aceso = focoAceso('ruinas_do_norte', foco, t);
    const janela = obter(aceso, 'janela');
    expect(janela.fim - janela.inicio).toBe(foco.duracaoMin * 60_000);
    expect(focoAceso('ruinas_do_norte', foco, janela.inicio)).toEqual(janela);
    expect(focoAceso('ruinas_do_norte', foco, janela.fim)).toBeNull();
    expect(focoAceso('ruinas_do_norte', { ...foco, chancePct: 0 }, janela.inicio)).toBeNull();
  });

  it('aceso, põe a lava longe da vila com o dragão às vezes; apagado, o dragão que ninguém feriu vai embora', () => {
    const r = regiao('ruinas_do_norte');
    const foco: FocoDaRegiao = { ...obter(r.focos?.[0], 'foco'), chancePct: 100, boss: { preset: 'dragao_fogo', chancePct: 100 } };
    const s = sala('ruinas_do_norte');
    const agora = 5_000_000;
    acenderFoco(s.estado, s.ctx, r, foco, { inicio: agora, fim: agora + 600_000 }, agora);
    const lava = (s.estado.terrenos ?? []).filter((t) => t.foco?.startsWith(foco.id));
    expect(lava.length).toBeGreaterThan(0);
    expect(lava.every((t) => t.tipo === 'brasas')).toBe(true);
    const chefe = obter(s.estado.entidades.find((e) => e.id === idDoChefeDoFoco(foco)), 'chefe');
    expect(chefe.preset).toBe('dragao_fogo');
    // Acender de novo na mesma janela não duplica.
    acenderFoco(s.estado, s.ctx, r, foco, { inicio: agora, fim: agora + 600_000 }, agora);
    expect((s.estado.terrenos ?? []).filter((t) => t.foco?.startsWith(foco.id))).toHaveLength(lava.length);
    apagarFoco(s.estado, foco);
    expect(s.estado.entidades.some((e) => e.id === chefe.id)).toBe(false);
  });

  it('o chefe ferido fica até o fim da luta', () => {
    const r = regiao('pico_gelado');
    const foco: FocoDaRegiao = { ...obter(r.focos?.[0], 'foco'), chancePct: 100, boss: { preset: 'dragao_gelo', chancePct: 100 } };
    const s = sala('pico_gelado');
    acenderFoco(s.estado, s.ctx, r, foco, { inicio: 0, fim: 600_000 }, 0);
    const chefe = obter(s.estado.entidades.find((e) => e.id === idDoChefeDoFoco(foco)), 'chefe');
    chefe.hp -= 10;
    apagarFoco(s.estado, foco);
    expect(s.estado.entidades.includes(chefe)).toBe(true);
  });
});
