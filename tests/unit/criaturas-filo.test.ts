// Marco 45 (16/11/2026, D-182): as criaturas de Filo — as nove dimensões nos dados, os traços (placas, remontar,
// divisão, estilhaço, fome, bando, furtividade), os jeitos de caçar (fole, bola de neve, torre, vigia fixo) e as
// mecânicas de arena dos chefes (torres, geodo, máscaras, bombardeio, voo, bando, silêncio, pecados).
import { describe, expect, it } from 'vitest';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { protecaoDoChefe } from '../../src/entities/criaturas/chefes';
import { criaturasDaDimensao, presetNoNivel } from '../../src/entities/criaturas/dimensoes';
import { aposGolpeDaCriatura, fatorCausadoDaCriatura, fatorRecebidoDaCriatura } from '../../src/entities/criaturas/golpes';
import { MECANICAS_DE_CHEFE } from '../../src/entities/criaturas/tipos';
import { processarMortes } from '../../src/progression/morte';
import { entradasDoDiario, registrarDescobertas } from '../../src/progression/diario';
import { textosFilo } from '../../src/i18n/pt-BR-filo';
import { CONTEUDO, contexto, faseDeTexto } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v == null) throw new Error(`${nome} ausente`);
  return v;
}

const ARENA = ['#'.repeat(26), ...Array.from({ length: 24 }, () => `#${'.'.repeat(24)}#`), '#'.repeat(26)];
const preset = (id: string) => obter(CONTEUDO.presets.get(id), id);
const hab = (id: string) => obter(CONTEUDO.habilidades.get(id), id);

function cena(modo = 'mundo') {
  const ctx = contexto(faseDeTexto(ARENA), undefined, modo);
  const estado = criarEstado({ semente: 7, faseId: 'teste' });
  const eventos: EventoSimulacao[] = [];
  const tick = (n = 1) => { for (let i = 0; i < n; i++) simular(estado, ctx, [], eventos, DT_MS); };
  const jogador = (x: number, y: number, id = 'j'): Entidade => {
    const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), id, x, y, ctx.balance);
    j.autoAtaque = false;
    j.hp = j.hpMax = 100_000;
    estado.entidades.push(j);
    return j;
  };
  const inimigo = (p: string, x: number, y: number, id = p, nivel = 10): Entidade => {
    const e = criarInimigo(preset(p), id, x, y, ctx.balance, { nivel });
    estado.entidades.push(e);
    return e;
  };
  return { ctx, estado, eventos, tick, jogador, inimigo };
}

describe('as nove dimensões nos dados', () => {
  it('cada dimensão tem 4 comuns (um fofo até o 30) e 2 chefes, e toda mecânica de chefe existe', () => {
    expect(CONTEUDO.dimensoes.size).toBe(9);
    for (const d of CONTEUDO.dimensoes.values()) {
      const { comuns, chefes } = criaturasDaDimensao(CONTEUDO.presets, d.id);
      expect(comuns, d.id).toHaveLength(4);
      expect(chefes, d.id).toHaveLength(2);
      expect(comuns.some((c) => c.nivelPico !== null && c.nivelPico <= 30), d.id).toBe(true);
      // O Arauto Caído (o chefe final da campanha) luta sem mecânica de arena; os outros 17 têm a deles.
      for (const c of chefes) if (c.id !== 'boss') expect(MECANICAS_DE_CHEFE as readonly string[]).toContain(obter(c.chefe, c.id).mecanica);
    }
  });

  it('o fofo passa do pico e dá lugar a outro comum da dimensão', () => {
    const lista = criaturasDaDimensao(CONTEUDO.presets, 'putrevia').comuns.map((p) => p.id);
    expect(presetNoNivel(CONTEUDO.presets, 'slime', 20, lista, 0.5)).toBe('slime');
    const trocado = presetNoNivel(CONTEUDO.presets, 'slime', 60, lista, 0.5);
    expect(trocado).not.toBe('slime');
    expect(preset(trocado).dimensao).toBe('putrevia');
  });
});

describe('traços das criaturas', () => {
  it('as placas do Quebra-gelo seguram o golpe e caem com o golpe pesado', () => {
    const c = cena();
    const j = c.jogador(5, 5);
    const o = c.inimigo('orc', 6, 5);
    const antes = fatorRecebidoDaCriatura(c.estado, c.ctx, o, j, hab('ataque_basico'), false);
    expect(antes).toBeLessThan(1);
    o.criatura = { placas: 0 };
    expect(fatorRecebidoDaCriatura(c.estado, c.ctx, o, j, hab('ataque_basico'), false)).toBe(1);
  });

  it('o Arqueiro de Osso desmonta uma vez e se remonta; o golpe em área o derruba de vez', () => {
    const c = cena();
    c.jogador(3, 3);
    const e = c.inimigo('esqueleto', 12, 12);
    e.hp = 0;
    processarMortes(c.estado, c.ctx, c.eventos);
    expect(e.morto).toBe(false);
    expect(e.hp).toBe(1);
    c.tick(ticksDe(4200));
    expect(e.hp).toBeGreaterThan(1);
    e.hp = 0;
    processarMortes(c.estado, c.ctx, c.eventos);
    expect(e.morto).toBe(true);
    const f = c.inimigo('esqueleto', 14, 14, 'e2');
    f.criatura = { golpeFinal: { area: true, sagrado: false } };
    f.hp = 0;
    processarMortes(c.estado, c.ctx, c.eventos);
    expect(f.morto).toBe(true);
  });

  it('o Vidraceiro estilhaça ao cair e o Faminto perto come o morto e cresce', () => {
    const c = cena();
    const j = c.jogador(5, 5);
    const v = c.inimigo('vidraceiro', 6, 5);
    const f = c.inimigo('faminto', 7, 6);
    const vida = j.hp;
    const max = f.hpMax;
    v.hp = 0;
    processarMortes(c.estado, c.ctx, c.eventos);
    expect(j.hp).toBeLessThan(vida);
    expect(f.hpMax).toBeGreaterThan(max);
    expect(f.criatura?.comidos).toBe(1);
  });

  it('o Fagulheiro bate mais em bando', () => {
    const c = cena();
    const j = c.jogador(5, 5);
    const g = c.inimigo('goblin', 6, 5);
    const so = fatorCausadoDaCriatura(c.estado, c.ctx, g, j);
    c.inimigo('goblin', 6, 6, 'g2');
    c.inimigo('goblin', 7, 5, 'g3');
    expect(fatorCausadoDaCriatura(c.estado, c.ctx, g, j)).toBeGreaterThan(so);
  });

  it('o Gosminho ferido vira dois (uma vez)', () => {
    const c = cena();
    const j = c.jogador(5, 5);
    const s = c.inimigo('slime', 6, 5);
    s.hp = Math.floor(s.hpMax * 0.4);
    aposGolpeDaCriatura(c.estado, c.ctx, s, j, hab('ataque_basico'), 5, c.eventos);
    aposGolpeDaCriatura(c.estado, c.ctx, s, j, hab('ataque_basico'), 5, c.eventos);
    expect(c.estado.entidades.filter((e) => e.preset === 'slime')).toHaveLength(2);
  });

  it('o Silente some longe de quem caça e aparece perto', () => {
    const c = cena();
    const j = c.jogador(10, 10);
    const s = c.inimigo('silente', 16, 16, 'silente', 25);
    c.tick(ticksDe(1000));
    expect(s.invisivelAteTick).toBeGreaterThan(c.estado.tick);
    j.x = 15; j.y = 15;
    c.tick(ticksDe(1500));
    expect(s.invisivelAteTick).toBeLessThanOrEqual(c.estado.tick);
  });
});

describe('jeitos de caçar', () => {
  it('o Espelhante devolve a skill que levou', () => {
    const c = cena();
    const j = c.jogador(8, 8);
    const e = c.inimigo('espelhante', 10, 8);
    aposGolpeDaCriatura(c.estado, c.ctx, e, j, hab('golpe_atordoante'), 3, c.eventos);
    expect(e.criatura?.copia).toBe('golpe_atordoante');
    c.tick(ticksDe(5000));
    expect(c.eventos.some((ev) => ev.t === 'acaoIniciada' && ev.atorId === e.id && ev.habilidadeId === 'golpe_atordoante')).toBe(true);
    expect(e.habilidades).not.toContain('golpe_atordoante');
  });

  it('o Fornalheiro inspira e depois sopra', () => {
    const c = cena();
    c.jogador(5, 5);
    c.inimigo('fornalheiro', 7, 5);
    c.tick(ticksDe(8000));
    const usadas = c.eventos.filter((e) => e.t === 'acaoIniciada' && e.atorId === 'fornalheiro').map((e) => e.t === 'acaoIniciada' ? e.habilidadeId : '');
    expect(usadas).toContain('inspirar_fornalha');
    expect(usadas).toContain('soprar_fornalha');
    expect(usadas.indexOf('inspirar_fornalha')).toBeLessThan(usadas.indexOf('soprar_fornalha'));
  });

  it('o Obelisco Vigia não sai do lugar', () => {
    const c = cena();
    c.jogador(5, 5);
    const o = c.inimigo('obelisco_vigia', 9, 5);
    c.tick(ticksDe(6000));
    expect([Math.round(o.x), Math.round(o.y)]).toEqual([9, 5]);
  });

  it('o Floquinho de longe vira bola e rola acelerando', () => {
    const c = cena();
    c.jogador(8, 12);
    const f = c.inimigo('floquinho', 12, 12);
    c.tick(ticksDe(4000));
    expect(f.criatura?.rolouCelulas ?? 0).toBeGreaterThan(0);
  });
});

describe('mecânicas de arena dos chefes', () => {
  const comecar = (c: ReturnType<typeof cena>, id: string) => {
    c.jogador(8, 12);
    const b = c.inimigo(id, 13, 12, id, 20);
    b.hp = b.hpMax = 50_000;
    c.tick(ticksDe(2500));
    expect(b.criatura?.arena, id).toBeDefined();
    return b;
  };

  it('o Dragão Engrenado leva pouco dano com as torres de pé e fica exposto quando uma cai', () => {
    const c = cena();
    const b = comecar(c, 'dragao_raio');
    const torres = c.estado.entidades.filter((e) => e.preset === 'torre_engrenada' && e.hp > 0);
    expect(torres.length).toBeGreaterThan(0);
    expect(protecaoDoChefe(c.estado, c.ctx, b)).toBeLessThan(1);
    obter(torres[0]).hp = 0;
    c.tick(2);
    expect(protecaoDoChefe(c.estado, c.ctx, b)).toBeGreaterThan(1);
  });

  it('o Monarca de Geodo não leva dano enquanto há pilar', () => {
    const c = cena();
    const b = comecar(c, 'monarca_de_geodo');
    expect(protecaoDoChefe(c.estado, c.ctx, b)).toBe(0);
    for (const p of c.estado.entidades) if (p.preset === 'pilar_de_cristal') p.hp = 0;
    c.tick(3);
    expect(protecaoDoChefe(c.estado, c.ctx, b)).toBeGreaterThan(1);
  });

  it('o Rei das Máscaras na máscara das costas só sente o golpe pelas costas', () => {
    const c = cena();
    const b = comecar(c, 'rei_das_mascaras');
    expect(b.criatura?.regra).toBe('costas');
    expect(protecaoDoChefe(c.estado, c.ctx, b, { costas: false, contato: true })).toBe(0);
    expect(protecaoDoChefe(c.estado, c.ctx, b, { costas: true, contato: true })).toBe(1);
    expect(c.eventos.some((e) => e.t === 'regraDoChefe' && e.regra === 'costas')).toBe(true);
  });

  it('o Almirante marca o chão e a pipa bombardeia quem ficou no ponto', () => {
    const c = cena();
    const b = comecar(c, 'almirante_dos_ventos');
    const j = obter(c.estado.entidades.find((e) => e.id === 'j'));
    aplicarEfeito(c.estado, c.ctx, j, construirEfeito('sem_movimento', { duracaoMs: 60_000 }), { id: 'teste', x: 0, y: 0 }, null, c.eventos);
    const vida = j.hp;
    c.tick(ticksDe(9000));
    expect(c.eventos.some((e) => e.t === 'zonaDoChefe' && e.id === b.id && e.tipo === 'bombardeio')).toBe(true);
    expect(j.hp).toBeLessThan(vida);
  });

  it('a Harpia no ar não leva golpe de perto; o controle a derruba', () => {
    const c = cena();
    const b = comecar(c, 'harpia_soberana');
    expect(protecaoDoChefe(c.estado, c.ctx, b, { costas: false, contato: true })).toBe(0);
    aplicarEfeito(c.estado, c.ctx, b, construirEfeito('atordoar', { duracaoMs: 1000 }), { id: 'j', x: 8, y: 12 }, null, c.eventos);
    c.tick(2);
    expect(protecaoDoChefe(c.estado, c.ctx, b, { costas: false, contato: true })).toBeGreaterThan(1);
  });

  it('o Rei das Fagulhas com o bando por perto leva metade', () => {
    const c = cena();
    const b = comecar(c, 'rei_goblin');
    const sem = protecaoDoChefe(c.estado, c.ctx, b);
    c.inimigo('goblin', 14, 13, 'gx');
    expect(protecaoDoChefe(c.estado, c.ctx, b)).toBeLessThan(sem);
  });

  it('o Hierofante declara o pecado e o Dragão do Silêncio marca as zonas', () => {
    const c = cena();
    comecar(c, 'hierofante');
    c.tick(ticksDe(21_000));
    expect(c.eventos.some((e) => e.t === 'regraDoChefe' && e.id === 'hierofante')).toBe(true);
    const d = cena();
    comecar(d, 'dragao_gelo');
    d.tick(ticksDe(10_000));
    expect(d.eventos.some((e) => e.t === 'zonaDoChefe' && e.tipo === 'silencio')).toBe(true);
  });

  it('o chefe que cai leva os objetos de arena com ele, e eles não soltam nada', () => {
    const c = cena();
    const b = comecar(c, 'dragao_raio');
    const torres = c.estado.entidades.filter((e) => e.preset === 'torre_engrenada');
    b.hp = 0;
    processarMortes(c.estado, c.ctx, c.eventos);
    c.tick(2);
    expect(torres.every((t) => t.morto || t.hp <= 0)).toBe(true);
  });

  it('a Candelinha denuncia quem está invisível perto dela', () => {
    const c = cena();
    const j = c.jogador(10, 10);
    c.inimigo('candelinha', 12, 10);
    j.invisivelAteTick = c.estado.tick + ticksDe(30_000);
    c.tick(ticksDe(700));
    expect(j.invisivelAteTick).toBeLessThanOrEqual(c.estado.tick);
    expect(j.efeitos.some((f) => f.tipo === 'marcado' && f.ateTick > c.estado.tick)).toBe(true);
  });
});

describe('o monstruário no diário', () => {
  it('as 54 criaturas entram no diário, e cada uma tem lore e dica (os comuns, também o terreno)', () => {
    const c = cena();
    const criaturas = entradasDoDiario(c.ctx).filter((e) => e.tipo === 'criatura');
    expect(criaturas).toHaveLength(54);
    const textos: Record<string, string> = textosFilo;
    for (const e of criaturas) {
      const p = preset(e.id.slice(9));
      expect(textos[`monstro.${p.id}.lore`], p.id).toBeTruthy();
      expect(textos[`monstro.${p.id}.dica`], p.id).toBeTruthy();
      if (p.arquetipo !== 'boss') expect(textos[`monstro.${p.id}.fenda`], p.id).toBeTruthy();
    }
    for (const d of CONTEUDO.dimensoes.keys()) expect(textos[`dimensao.${d}.nome`], d).toBeTruthy();
  });

  it('ver de perto revela a criatura; derrotar revela o resto e conta a vitória do chefe', () => {
    const c = cena();
    const j = c.jogador(5, 5);
    const bolsa = obter(j.bolsa, 'bolsa');
    c.inimigo('slime', 7, 5);
    c.inimigo('orc', 20, 20);
    const chefe = c.inimigo('rei_goblin', 9, 5);
    const saida: EventoSimulacao[] = [];
    c.estado.tick = 30;
    registrarDescobertas(c.estado, c.ctx, [], saida);
    expect(bolsa.diario).toContain('criatura:slime');
    expect(bolsa.diario).not.toContain('criatura:orc');
    chefe.morto = true;
    registrarDescobertas(c.estado, c.ctx, [{ t: 'morreu', tick: 31, id: chefe.id, porId: j.id }], saida);
    expect(bolsa.diario).toContain('criatura:rei_goblin:caiu');
    expect(bolsa.vitorias?.rei_goblin).toBe(1);
  });
});
