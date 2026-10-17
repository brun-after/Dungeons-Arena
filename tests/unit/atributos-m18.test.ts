// Marco 18 (17/10/2026, D-068): os atributos depois do grimório — a rolagem escala com Força e Inteligência (meio a
// meio), o bônus fixo segue a habilidade, a Inteligência dá potência aos efeitos, a Destreza do arqueiro rende mais
// na recarga do básico (teto 50%), a Sabedoria revela e desarma armadilhas, e todo inimigo atacado revida na hora.

import { describe, expect, it } from 'vitest';
import { comPotencia } from '../../src/combat/golpe';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { BALANCE_PADRAO, type Balance } from '../../src/core/contexto';
import { buscarEntidade, criarEstado, DONO_FASE } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { ComandoDoTick } from '../../src/core/comandos';
import { registrarParticipacao } from '../../src/combat/participacao';
import { ATRIBUTOS_NEUTROS, type Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import {
  chanceDeDesarmarPct,
  chanceDeRevelarPct,
  multiplicadorDeRolagem,
  potenciaDeEfeito,
  raioDeRevelar,
  reducaoRecargaBasicoPct,
} from '../../src/progression/efeitos-atributo';
import { bonusDeAtributo } from '../../src/progression/ficha';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const b = BALANCE_PADRAO;
const atr = (p: Partial<typeof ATRIBUTOS_NEUTROS>) => ({ ...ATRIBUTOS_NEUTROS, ...p });

function obter<T>(v: T | undefined, nome: string): T {
  if (v === undefined) throw new Error(`${nome} ausente`);
  return v;
}

describe('dano e potência (D-068)', () => {
  it('a rolagem escala com FOR e INT, metade de cada', () => {
    const k = b.atributos.efeitos.rolagemPorPontoPct / 100;
    expect(multiplicadorDeRolagem(atr({}), b)).toBe(1);
    expect(multiplicadorDeRolagem(atr({ forca: 14 }), b)).toBeCloseTo(1 + 2 * k);
    expect(multiplicadorDeRolagem(atr({ inteligencia: 14 }), b)).toBeCloseTo(1 + 2 * k);
    expect(multiplicadorDeRolagem(atr({ forca: 14, inteligencia: 14 }), b)).toBeCloseTo(1 + 4 * k);
    expect(multiplicadorDeRolagem(atr({ forca: 1, inteligencia: 1 }), b)).toBe(b.atributos.efeitos.rolagemMin);
  });

  it('o bônus fixo segue a habilidade: arco com Força, magia com Inteligência', () => {
    const flecha = obter(CONTEUDO.habilidades.get('flecha_perfurante'), 'flecha');
    const seta = obter(CONTEUDO.habilidades.get('seta_arcana'), 'seta');
    expect(flecha.escalaCom).toBe('forca');
    expect(seta.escalaCom).toBe('inteligencia');
    const a = atr({ forca: 15, destreza: 20, inteligencia: 12 });
    expect(bonusDeAtributo(a, flecha.escalaCom, 1)).toBe(15);
    expect(bonusDeAtributo(a, seta.escalaCom, 1)).toBe(12);
  });

  it('a Inteligência dá potência: duração dos status e valor dos números, nunca o pct nem os fluxos', () => {
    expect(potenciaDeEfeito(atr({}), b)).toBe(1);
    const p = potenciaDeEfeito(atr({ inteligencia: 20 }), b);
    expect(p).toBeGreaterThan(1);
    const queimando = comPotencia(construirEfeito('queimando', { duracaoMs: 3000, valor: 4 }), p);
    expect(queimando.duracaoMs).toBe(Math.round(3000 * p));
    expect(queimando.valor).toBe(Math.round(4 * p));
    const lento = comPotencia(construirEfeito('resfriado', { duracaoMs: 3000, pct: 30 }), p);
    expect(lento.pct).toBe(30);
    const armadilha = construirEfeito('armadilha', { valor: 8 });
    expect(comPotencia(armadilha, p)).toBe(armadilha);
    expect(potenciaDeEfeito(atr({ inteligencia: 30 }), b)).toBe(b.atributos.efeitos.potenciaMax);
  });

  it('a Destreza do arqueiro chega a 50% de recarga do básico; as outras classes param em 30%', () => {
    const arqueiro = obter(CONTEUDO.classes.get('arqueiro'), 'arqueiro');
    const guerreiro = obter(CONTEUDO.classes.get('guerreiro'), 'guerreiro');
    const muita = atr({ destreza: 30 });
    expect(reducaoRecargaBasicoPct(muita, b, arqueiro.destreza)).toBe(50);
    expect(reducaoRecargaBasicoPct(muita, b, guerreiro.destreza)).toBe(30);
    expect(reducaoRecargaBasicoPct(atr({ destreza: 14 }), b, arqueiro.destreza)).toBeGreaterThan(reducaoRecargaBasicoPct(atr({ destreza: 14 }), b, guerreiro.destreza));
  });
});

describe('revide imediato da IA', () => {
  function cena() {
    const ctx = contexto(faseDeTexto(SALA_ABERTA));
    const estado = criarEstado({ semente: 5, faseId: 'teste' });
    const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
    // Longe do inimigo (fora da detecção): ele está em patrulha.
    estado.entidades.push(criarJogador(classe, 'j', 1, 1, ctx.balance), criarJogador(classe, 'k', 1, 10, ctx.balance));
    estado.entidades.push(criarInimigo(obter(ctx.conteudo.presets.get('goblin'), 'goblin'), 'i', 10, 10, ctx.balance));
    const eventos: EventoSimulacao[] = [];
    const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
    const tick = () => { simular(estado, ctx, [], eventos, DT_MS); };
    return { ctx, estado, eventos, ent, tick };
  }

  it('o inimigo atacado persegue na hora e troca para quem bateu por último', () => {
    const c = cena();
    c.tick();
    expect(c.ent('i').ia?.modo).toBe('patrulha');
    registrarParticipacao(c.ent('i'), 'j', c.estado.tick, c.ctx);
    c.tick();
    expect(c.ent('i').ia?.modo).toBe('perseguindo');
    expect(c.ent('i').ia?.alvoId).toBe('j');
    registrarParticipacao(c.ent('i'), 'k', c.estado.tick, c.ctx);
    c.tick();
    expect(c.ent('i').ia?.alvoId).toBe('k');
    const alvos = c.eventos.flatMap((e) => (e.t === 'iaPerseguindo' ? [e.alvoId] : []));
    expect(alvos).toEqual(['j', 'k']);
  });
});

describe('Sabedoria e armadilhas', () => {
  it('raio e chances crescem com a Sabedoria', () => {
    expect(raioDeRevelar(atr({ sabedoria: 16 }), b)).toBeGreaterThan(raioDeRevelar(atr({}), b));
    expect(chanceDeRevelarPct(atr({ sabedoria: 16 }), b)).toBeGreaterThan(chanceDeRevelarPct(atr({}), b));
    expect(chanceDeRevelarPct(atr({ sabedoria: 30 }), b)).toBe(b.armadilhas.chanceMaxPct);
    expect(chanceDeDesarmarPct(atr({ sabedoria: 30 }), b)).toBe(b.armadilhas.desarmeMaxPct);
  });

  function cenaArmadilha(balance: Balance, modoId = 'campanha') {
    const ctx = contexto(faseDeTexto(SALA_ABERTA), balance, modoId);
    const estado = criarEstado({ semente: 9, faseId: 'teste' });
    const j = criarJogador(obter(CONTEUDO.classes.get('aventureiro'), 'classe'), 'j', 3, 3, ctx.balance);
    estado.entidades.push(j);
    estado.armadilhas.push({
      id: 900, donoId: DONO_FASE, equipeDono: DONO_FASE, x: 4, y: 3, valor: 5, interno: null, ateTick: 0,
      origem: 'fase', permanente: true, rearmeTicks: 0, inerteAteTick: 0, reveladaPara: [],
    });
    const eventos: EventoSimulacao[] = [];
    let pendentes: ComandoDoTick[] = [];
    const tick = () => {
      simular(estado, ctx, pendentes, eventos, DT_MS);
      pendentes = [];
    };
    const interagir = () => { pendentes = [{ tick: estado.tick, entidadeId: 'j', cmd: { t: 'interagir' } }]; };
    return { estado, eventos, j, tick, interagir };
  }

  const certeiro: Balance = { ...b, armadilhas: { ...b.armadilhas, chanceBasePct: 100, chanceMaxPct: 100, desarmeBasePct: 100, desarmeMaxPct: 100 } };
  const azarado: Balance = { ...b, armadilhas: { ...b.armadilhas, chanceBasePct: 100, chanceMaxPct: 100, desarmeBasePct: 0, desarmeMaxPct: 0 } };
  const intervalo = Math.round(b.armadilhas.revelarIntervaloMs / DT_MS);
  const desarme = Math.round(b.armadilhas.desarmeMs / DT_MS);

  it('a armadilha perto é revelada e, revelada, desarmada com interagir (dá XP)', () => {
    const c = cenaArmadilha(certeiro);
    for (let i = 0; i <= intervalo; i++) c.tick();
    expect(c.estado.armadilhas[0]?.reveladaPara).toEqual(['j']);
    c.interagir();
    c.tick();
    expect(c.j.interacao?.tipo).toBe('desarme');
    const xp = c.j.xp;
    for (let i = 0; i <= desarme; i++) c.tick();
    expect(c.estado.armadilhas).toEqual([]);
    expect(c.eventos.some((e) => e.t === 'armadilhaDesarmada' && e.sucesso)).toBe(true);
    expect(c.j.xp).toBeGreaterThan(xp);
  });

  it('o desarme que falha dispara a armadilha em quem tentou', () => {
    const c = cenaArmadilha(azarado);
    for (let i = 0; i <= intervalo; i++) c.tick();
    const hp = c.j.hp;
    c.interagir();
    for (let i = 0; i <= desarme + 1; i++) c.tick();
    expect(c.eventos.some((e) => e.t === 'armadilhaDesarmada' && !e.sucesso)).toBe(true);
    expect(c.eventos.some((e) => e.t === 'armadilhaDisparou' && e.alvoId === 'j')).toBe(true);
    expect(c.j.hp).toBeLessThan(hp);
  });

  it('no modo que não revela (arena Livre), a Sabedoria não acha nada', () => {
    const c = cenaArmadilha(certeiro, 'livre');
    for (let i = 0; i <= intervalo * 2; i++) c.tick();
    expect(c.estado.armadilhas[0]?.reveladaPara ?? []).toEqual([]);
  });
});
