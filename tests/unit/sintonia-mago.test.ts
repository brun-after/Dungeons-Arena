// Marco 24 (24/10/2026, D-095): a sintonia do Mago (as encarnações novas, as duplas) e as vertentes dele.
import { describe, expect, it } from 'vitest';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { duplaDe, encarnar, restanteEncarnacaoMs } from '../../src/combat/encarnacao';
import { aoAbaterComEncarnacao, aoAcertarMagia, concentracaoExtra, magoInamovivel, multiplicadorDaEncarnacao, raioAreaDaEncarnacao } from '../../src/combat/encarnacao-efeitos';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena(gerais: (string | null)[] = []) {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 19, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 3, 5, ctx.balance);
  j.nivel = 10;
  const bolsa = obter(j.bolsa);
  gerais.forEach((id, i) => {
    if (id && !bolsa.conhecidas.some((c) => c.id === id)) bolsa.conhecidas.push({ id, rank: 1, caminhos: [] });
    bolsa.barra[2 + i] = id;
  });
  j.habilidades = bolsa.barra.filter((id): id is string => id !== null);
  const b = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'b', 5, 5, ctx.balance);
  const v = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'v', 6, 5, ctx.balance);
  for (const x of [b, v]) x.hp = x.hpMax = 5000;
  estado.entidades.push(j, b, v);
  const eventos: EventoSimulacao[] = [];
  const hab = (id: string) => obter(habilidadeDoAtor(ctx, j, id), id);
  const lancar = (id: string, tick: number) => encarnar(ctx, j, hab(id), tick);
  const acerto = (id: string, dano: number, alvo: Entidade = b, cura = 0) => { aoAcertarMagia(estado, ctx, j, alvo, hab(id), dano, cura, true, eventos); };
  const tem = (e: Entidade, tipo: string) => e.efeitos.some((f) => f.tipo === tipo && f.ateTick > estado.tick);
  return { ctx, estado, j, b, v, eventos, hab, lancar, acerto, tem };
}

describe('sintonia do Mago (D-095)', () => {
  it('os dados: 9 famílias, 3 vertentes, 7 encarnações e as 21 duplas com efeito', () => {
    const s = CONTEUDO.sintonia;
    expect(Object.keys(obter(s.efeitosDaClasse.mago))).toHaveLength(9);
    for (const v of s.vertentes.filter((x) => x.classe === 'mago')) expect(s.efeitosDaVertente[v.id]?.length).toBeGreaterThan(0);
    expect(Object.keys(s.efeitosDaEncarnacao).sort()).toEqual(['fogo', 'gelo', 'raio', 'sagrado', 'terra', 'trevas', 'veneno']);
    for (const d of s.encarnacoesDuplas) expect(d.efeitos.length, d.id).toBeGreaterThan(0);
  });

  it('as gerais de terra abrem a encarnação de terra; sem elas, a magia de terra não encarna', () => {
    expect(cena().lancar('estaca_de_pedra', 0)).toBe(false);
    const c = cena(['estaca_de_pedra']);
    expect(c.lancar('estaca_de_pedra', 0)).toBe(true);
    expect(c.j.encarnacao).toBe('terra');
    expect(magoInamovivel(c.ctx, c.j, 0)).toBe(true);
    expect(raioAreaDaEncarnacao(c.ctx, c.j, c.hab('nova_glacial'), 0).raioArea).toBe(3);
  });

  it('trocar de elemento em até 3 s funde os dois (Vapor) por 6 s; depois da janela, não', () => {
    const c = cena();
    c.lancar('bola_de_fogo', 0);
    expect(c.lancar('lanca_de_gelo', ticksDe(2000))).toBe(true);
    expect(duplaDe(c.j, ticksDe(2000))).toBe('vapor');
    expect(duplaDe(c.j, ticksDe(2000) + ticksDe(6000))).toBeNull();
    const longe = cena();
    longe.lancar('bola_de_fogo', 0);
    longe.lancar('lanca_de_gelo', ticksDe(4000));
    expect(duplaDe(longe.j, ticksDe(4000))).toBeNull();
  });

  it('Vapor cega, a encarnação de veneno envenena, a de trevas rouba vida e a de luz consagra', () => {
    const vapor = cena();
    vapor.lancar('bola_de_fogo', 0);
    vapor.lancar('lanca_de_gelo', 1);
    vapor.acerto('lanca_de_gelo', 10);
    expect(vapor.tem(vapor.b, 'cego')).toBe(true);
    const veneno = cena(['flecha_venenosa']);
    veneno.lancar('flecha_venenosa', 0);
    veneno.acerto('raio_em_cadeia', 10);
    expect(veneno.tem(veneno.b, 'envenenado')).toBe(true);
    const trevas = cena(['punhal_das_sombras']);
    trevas.lancar('punhal_das_sombras', 0);
    trevas.j.hp = 10;
    trevas.acerto('raio_em_cadeia', 100);
    expect(trevas.j.hp).toBe(15);
    const luz = cena(['lanca_radiante']);
    luz.lancar('lanca_radiante', 0);
    luz.acerto('raio_em_cadeia', 10);
    expect(luz.tem(luz.b, 'consagrado')).toBe(true);
  });

  it('Lava deixa o chão em chamas; Santuário de pedra dá escudo; Supercondução: +50% do raio no resfriado', () => {
    const lava = cena(['estaca_de_pedra']);
    lava.lancar('bola_de_fogo', 0);
    lava.lancar('estaca_de_pedra', 1);
    expect(duplaDe(lava.j, 1)).toBe('lava');
    lava.acerto('estaca_de_pedra', 10);
    expect(lava.estado.rastros.filter((r) => r.donoId === 'j' && r.tipo === 'rastro_dano')).toHaveLength(9);
    const santuario = cena(['estaca_de_pedra', 'lanca_radiante']);
    santuario.lancar('estaca_de_pedra', 0);
    santuario.lancar('lanca_radiante', 1);
    santuario.acerto('lanca_radiante', 10);
    expect(santuario.tem(santuario.j, 'escudo_acumulado')).toBe(true);
    const sc = cena();
    sc.lancar('lanca_de_gelo', 0);
    sc.lancar('raio_em_cadeia', 1);
    aplicarEfeito(sc.estado, sc.ctx, sc.b, construirEfeito('resfriado', { pct: 30, duracaoMs: 3000 }), { id: 'j', x: 3, y: 5 }, null, sc.eventos);
    expect(multiplicadorDaEncarnacao(sc.ctx, sc.j, sc.b, sc.hab('raio_em_cadeia'), 1)).toBe(1.5);
    expect(multiplicadorDaEncarnacao(sc.ctx, sc.j, sc.b, sc.hab('lanca_de_gelo'), 1)).toBe(1);
  });

  it('Pestilência: quem morre envenenado passa o veneno aos vizinhos', () => {
    const c = cena(['flecha_venenosa', 'punhal_das_sombras']);
    c.lancar('flecha_venenosa', 0);
    c.lancar('punhal_das_sombras', 1);
    expect(duplaDe(c.j, 1)).toBe('pestilencia');
    aplicarEfeito(c.estado, c.ctx, c.b, construirEfeito('envenenado', { valor: 2, duracaoMs: 5000 }), { id: 'j', x: 3, y: 5 }, null, c.eventos);
    aoAbaterComEncarnacao(c.estado, c.ctx, c.j, c.b, c.eventos);
    expect(c.tem(c.v, 'envenenado')).toBe(true);
  });

  it('psíquica estende, técnica e arcana renovam; o Dardo concentra mais rápido', () => {
    const psi = cena(['agulha_mental']);
    psi.lancar('bola_de_fogo', 0);
    const antes = restanteEncarnacaoMs(psi.j, 0);
    psi.lancar('agulha_mental', 0);
    expect(restanteEncarnacaoMs(psi.j, 0)).toBeCloseTo(antes + 4000, 3);
    const tec = cena(['golpe_atordoante']);
    tec.lancar('bola_de_fogo', 0);
    tec.lancar('golpe_atordoante', ticksDe(11_000));
    expect(restanteEncarnacaoMs(tec.j, ticksDe(11_000))).toBeCloseTo(2000, 3);
    const arc = cena(['seta_arcana', 'explosao']);
    arc.lancar('bola_de_fogo', 0);
    arc.lancar('seta_arcana', ticksDe(11_000));
    expect(restanteEncarnacaoMs(arc.j, ticksDe(11_000))).toBeCloseTo(12_000, 3);
    expect(concentracaoExtra(arc.ctx, arc.j, 0)).toBe(2);
  });

  it('suporte: a cura geral herda a encarnação (de fogo queima os hostis em volta do curado)', () => {
    const c = cena(['curar']);
    c.lancar('bola_de_fogo', 0);
    c.b.x = 4;
    c.acerto('curar', 0, c.j, 8);
    expect(c.tem(c.b, 'queimando')).toBe(true);
  });

  it('Alquimista: toda dupla vira Miasma ardente; Arquimago: dobra a duração e a Agulha renova', () => {
    const alq = cena(['bola_de_fogo', 'incinerar', 'flecha_venenosa', 'dardo_toxico']);
    alq.lancar('lanca_de_gelo', 0);
    alq.lancar('raio_em_cadeia', 1);
    expect(duplaDe(alq.j, 1)).toBe('miasma_ardente');
    const arq = cena(['seta_arcana', 'explosao', 'agulha_mental', 'telecinese']);
    arq.lancar('bola_de_fogo', 0);
    expect(restanteEncarnacaoMs(arq.j, 0)).toBeCloseTo(24_000, 3);
    arq.lancar('agulha_mental', ticksDe(20_000));
    expect(restanteEncarnacaoMs(arq.j, ticksDe(20_000))).toBeCloseTo(24_000, 3);
  });
});
