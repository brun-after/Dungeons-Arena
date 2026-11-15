// Marco 44 (15/11/2026, D-178): a caça noturna (missões e monstros só da noite) e o covil que dorme de dia.
import { describe, expect, it } from 'vitest';
import { modoPorId } from '../../src/core/conteudo';
import { lerLugar, montarLugar } from '../../src/mundo/lugares';
import { ofertasDoQuadro } from '../../src/mundo/missoes-mundo';
import { conferirSonoDoCovil, conferirNoite } from '../../src/mundo/noite';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { criarJogador } from '../../src/entities/fabrica';
import { vivo } from '../../src/entities/entidade';
import { CONTEUDO } from '../apoio/fases';

const MIN = 60_000;
const reino = () => {
  const r = CONTEUDO.reinos.get('reino_central');
  if (!r) throw new Error('reino');
  return r;
};

describe('a caça noturna (D-178)', () => {
  it('o quadro só mostra as missões da noite à noite', () => {
    const r = reino();
    const noturnas = new Set(r.missoes.filter((m) => m.hora === 'noite').map((m) => m.id));
    expect(noturnas.size).toBeGreaterThan(0);
    const dia = ofertasDoQuadro(r.missoes, 'vila_do_centro', 20_000, 6);
    expect(dia.some((id) => noturnas.has(id))).toBe(false);
    const noite = ofertasDoQuadro(r.missoes, 'vila_do_centro', 20_000, 6, 2);
    expect(noite.slice(0, dia.length)).toEqual(dia);
    expect(noite.filter((id) => noturnas.has(id))).toHaveLength(2);
  });

  it('parte da horda da noite é dos monstros que só saem nela', () => {
    const r = reino();
    const lugar = lerLugar(r, 'regiao:campos_do_oeste');
    if (lugar?.tipo !== 'regiao') throw new Error('lugar');
    const m = montarLugar(CONTEUDO, r, lugar, modoPorId(CONTEUDO, MODO_MUNDO));
    const classe = CONTEUDO.classes.get('guerreiro');
    if (!classe) throw new Error('classe');
    m.estado.entidades.push(criarJogador(classe, 'p1', m.ctx.fase.spawns[0]?.x ?? 10, m.ctx.fase.spawns[0]?.y ?? 10, m.ctx.balance));
    const ctx = { ...m.ctx, modo: { ...m.ctx.modo, escuro: 1 } };
    for (let s = 0; s < 120; s++) {
      m.estado.tick += 30;
      conferirNoite(m.estado, ctx, lugar.regiao, 1);
    }
    const noturnos = new Set(ctx.balance.mundo.noite.noturnos);
    expect(m.estado.entidades.some((e) => e.id.startsWith('noite:') && noturnos.has(e.preset))).toBe(true);
  });

  it('de dia o covil dorme; o primeiro golpe pega de surpresa; à noite, todos acordam', () => {
    const r = reino();
    const lugar = lerLugar(r, 'covil:minas_do_rei_goblin');
    if (lugar?.tipo !== 'covil') throw new Error('covil');
    const m = montarLugar(CONTEUDO, r, lugar, modoPorId(CONTEUDO, MODO_MUNDO));
    const monstros = () => m.estado.entidades.filter((e) => vivo(e) && e.controlador === 'ia' && !e.invocacao);
    expect(monstros().length).toBeGreaterThan(0);
    conferirSonoDoCovil(m.estado, m.ctx, 5 * MIN);
    expect(monstros().every((e) => e.efeitos.some((f) => f.tipo === 'adormecido' && f.pct === m.ctx.balance.mundo.noite.sonoDoCovilPct))).toBe(true);
    conferirSonoDoCovil(m.estado, m.ctx, 35 * MIN);
    expect(monstros().some((e) => e.efeitos.some((f) => f.tipo === 'adormecido'))).toBe(false);
  });
});
