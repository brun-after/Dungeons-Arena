// Marco 22 (23/10/2026, D-089): identidade do Aventureiro (falcão), do Mago (encarnação) e do Arqueiro (Mira firme).
import { describe, expect, it } from 'vitest';
import { estadoPublico } from '../../src/arena/estado-publico';
import { alvoOfensivoValido, fonteDaHabilidade, origemDaHabilidade } from '../../src/combat/acao';
import { reflexoDoFalcao } from '../../src/combat/ajustes-classes';
import { aplicarImpacto } from '../../src/combat/golpe';
import { companheiroDe, sincronizarCompanheiros } from '../../src/combat/companheiro';
import { contarInvocacoes } from '../../src/combat/efeitos-fluxo';
import {
  encarnar,
  multiplicadorEncarnacao,
  processarEncarnacoes,
  protecaoEncarnacao,
  reagirAoGolpe,
  restanteEncarnacaoMs,
  saltosEncarnacao,
  velocidadeEncarnacao,
} from '../../src/combat/encarnacao';
import { dispensarInvocacoes } from '../../src/combat/invocacoes';
import { fracaoMira, ticksParaCarregar } from '../../src/combat/mira';
import { registrarParticipacao } from '../../src/combat/participacao';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import type { Comando } from '../../src/core/comandos';
import { buscarEntidade, clonarEstado, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import type { Entidade } from '../../src/entities/entidade';
import { personagemNoInicio } from '../../src/save/transicao';
import { largarObjeto, largarOrbeEfeito, largarOuro, coletarObjetos } from '../../src/world/objetos';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { chebyshev } from '../../src/combat/geometria';
import { comKit, CONTEUDO, contexto, faseDeTexto, KIT_GERAL, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v == null) throw new Error(`${nome} ausente`);
  return v;
}

/** Jogador da classe em (3,5) e um boneco (sem IA) em (bonecoX,5), na sala aberta. */
function arena(classe: string, bonecoX = 5) {
  const estado = criarEstado({ semente: 3, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe), classe), 'j', 3, 5, ctx.balance);
  // Marco 24: o Aventureiro dos testes leva também o kit geral de antes (a Seta arcana sai do falcão).
  if (classe === 'aventureiro') comKit(j, [...KIT_GERAL, ...j.habilidades]);
  j.autoAtaque = false;
  const boneco = criarInimigo(obter(CONTEUDO.presets.get('boneco'), 'boneco'), 'b', bonecoX, 5, ctx.balance);
  estado.entidades.push(j, boneco);
  const eventos: EventoSimulacao[] = [];
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
  const tick = (cmds: [string, Comando][] = []) => {
    simular(estado, ctx, cmds.map(([entidadeId, cmd]) => ({ tick: estado.tick, entidadeId, cmd })), eventos, DT_MS);
  };
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const de = <T extends EventoSimulacao['t']>(t: T) => eventos.filter((e): e is Extract<EventoSimulacao, { t: T }> => e.t === t);
  return { estado, eventos, j, boneco, ent, tick, ticks, de };
}

describe('falcão do Aventureiro', () => {
  it('nasce no primeiro tick, com a vida do dono, e não conta no limite de invocações', () => {
    const a = arena('aventureiro');
    a.tick();
    const f = obter(companheiroDe(a.estado, a.j), 'falcão');
    expect(f.invocacao?.comportamento).toBe('companheiro');
    expect(f.hp).toBe(a.j.hp);
    expect(f.hpMax).toBe(a.j.hpMax);
    expect(contarInvocacoes(a.estado, 'j')).toBe(0);
    dispensarInvocacoes(a.estado, a.j, a.eventos);
    expect(companheiroDe(a.estado, a.j)).toBe(f);
  });

  it('outras classes não têm falcão', () => {
    const a = arena('mago');
    a.tick();
    expect(companheiroDe(a.estado, a.j)).toBeUndefined();
  });

  it('o dano no falcão sai da vida do dono, com a autoria; dono caído, o falcão cai junto', () => {
    const a = arena('aventureiro');
    a.tick();
    const f = obter(companheiroDe(a.estado, a.j), 'falcão');
    const hp = a.j.hp;
    // Marco 24 (D-098): no nível 1, 80% do dano chega ao dono.
    f.hp -= 10;
    registrarParticipacao(f, 'b', a.estado.tick, ctx);
    sincronizarCompanheiros(a.estado, ctx);
    expect(a.j.hp).toBe(hp - 8);
    expect(f.hp).toBe(a.j.hp);
    expect(a.j.participacao.some((p) => p.id === 'b')).toBe(true);
    expect(f.participacao).toEqual([]);
    // O golpe no falcão cai no dono (com as defesas dele).
    const golpe = obter(habilidadeDoAtor(ctx, a.boneco, a.boneco.ataqueBasico), 'golpe');
    const antes = a.j.hp;
    aplicarImpacto(a.estado, ctx, f, { acaoId: 9, hab: golpe, indice: 0, fonte: { ...fonteDaHabilidade(a.boneco, ctx, 0, golpe), d20Minimo: 20 } }, a.eventos);
    expect(a.j.hp).toBeLessThan(antes);
    expect(a.de('impacto').at(-1)).toMatchObject({ alvoId: 'j' });
    a.j.hp = 0;
    sincronizarCompanheiros(a.estado, ctx);
    expect(f.hp).toBe(0);
  });

  it('o reflexo do dano no dono cai com o nível: 80% no 1, 60% no máximo (marco 24)', () => {
    expect(reflexoDoFalcao(ctx, 1)).toBeCloseTo(0.8, 5);
    expect(reflexoDoFalcao(ctx, ctx.balance.xp.nivelMax)).toBeCloseTo(0.6, 5);
    const a = arena('aventureiro');
    a.tick();
    const f = obter(companheiroDe(a.estado, a.j), 'falcão');
    // No nível máximo, 10 de dano no falcão viram 6 no dono.
    a.j.nivel = ctx.balance.xp.nivelMax;
    const hp = a.j.hp;
    f.hp -= 10;
    sincronizarCompanheiros(a.estado, ctx);
    expect(a.j.hp).toBe(hp - 6);
  });

  it('o falcão não atrai inimigos: só vira alvo de quem já está perseguindo (marco 24)', () => {
    const a = arena('aventureiro');
    a.tick();
    const f = obter(companheiroDe(a.estado, a.j), 'falcão');
    const orc = criarInimigo(obter(CONTEUDO.presets.get('orc'), 'orc'), 'o', 8, 8, ctx.balance);
    a.estado.entidades.push(orc);
    a.tick();
    const ia = obter(orc.ia, 'ia do orc');
    ia.modo = 'patrulha';
    expect(alvoOfensivoValido(a.estado, ctx, orc, f)).toBe(false);
    expect(alvoOfensivoValido(a.estado, ctx, orc, a.j)).toBe(true);
    ia.modo = 'perseguindo';
    expect(alvoOfensivoValido(a.estado, ctx, orc, f)).toBe(true);
  });

  it('com o dono parado e nada em volta, o falcão pousa no ombro; o dono anda e ele sai (marco 24)', () => {
    const a = arena('aventureiro', 11);
    a.estado.entidades.splice(a.estado.entidades.indexOf(a.boneco), 1);
    a.tick();
    const f = obter(companheiroDe(a.estado, a.j), 'falcão');
    a.ticks(ticksDe(ctx.balance.ajustesClasses.aventureiro.falcao.pousoMs) + ticksDe(3000));
    expect(f.ia?.modo).toBe('pousado');
    expect(chebyshev(f, a.j)).toBe(0);
    a.tick([['j', { t: 'mover', dir: 'E' }]]);
    a.ticks(3);
    expect(f.ia?.modo).toBe('patrulha');
  });

  it('as habilidades saem do falcão; o ataque básico, do Aventureiro', () => {
    const a = arena('aventureiro');
    a.tick();
    const f = obter(companheiroDe(a.estado, a.j), 'falcão');
    f.x = 3;
    f.y = 3;
    const seta = obter(habilidadeDoAtor(ctx, a.j, 'seta_arcana'), 'seta');
    const basico = obter(habilidadeDoAtor(ctx, a.j, a.j.ataqueBasico), 'básico');
    expect(origemDaHabilidade(a.estado, a.j, seta)).toEqual({ x: 3, y: 3 });
    expect(origemDaHabilidade(a.estado, a.j, basico)).toEqual({ x: 3, y: 5 });
  });

  it('a habilidade ofensiva marca o alvo do dono (o falcão persegue o mesmo) e o falcão não ataca sozinho', () => {
    const a = arena('aventureiro');
    a.tick();
    const hp = a.boneco.hp;
    a.ticks(60);
    expect(a.ent('b').hp).toBe(hp);
    a.tick([['j', { t: 'usarHabilidade', id: 'seta_arcana', alvo: 'b' }]]);
    expect(a.j.alvoSelecionado).toBe('b');
  });

  it('recolhe o ouro em que pousa para a bolsa do dono', () => {
    const a = arena('aventureiro');
    a.tick();
    const f = obter(companheiroDe(a.estado, a.j), 'falcão');
    const ouro = obter(a.j.bolsa, 'bolsa').ouro;
    expect(largarOuro(a.estado, 9, f.x, f.y, a.eventos)).toBe(true);
    coletarObjetos(a.estado, ctx, a.eventos);
    expect(obter(a.j.bolsa, 'bolsa').ouro).toBe(ouro + 9);
    expect(a.de('coletou').at(-1)).toMatchObject({ id: 'j', ganho: 9 });
  });
});

describe('IA do falcão (ajuste de 24/10/2026, D-091)', () => {
  const falcaoDe = (a: ReturnType<typeof arena>) => obter(companheiroDe(a.estado, a.j), 'falcão');

  it('fora de combate, passeia em volta do dono sem se afastar', () => {
    const a = arena('aventureiro', 10);
    a.estado.entidades = a.estado.entidades.filter((e) => e.id !== 'b');
    a.tick();
    const visitadas = new Set<string>();
    for (let i = 0; i < 600; i++) {
      a.tick();
      const f = falcaoDe(a);
      visitadas.add(`${f.x},${f.y}`);
      expect(chebyshev(f, a.j)).toBeLessThanOrEqual(ctx.balance.ajustesClasses.aventureiro.falcao.raioPasseio + 1);
    }
    expect(visitadas.size).toBeGreaterThan(3);
  });

  it('fora de combate, busca vida, mana e buffs para o dono', () => {
    const a = arena('aventureiro', 10);
    a.estado.entidades = a.estado.entidades.filter((e) => e.id !== 'b');
    a.tick();
    a.j.hp -= 20;
    a.j.mana = 0;
    largarObjeto(a.estado, 'orbe_hp', 7, 8, 10, 'abs', a.eventos);
    largarObjeto(a.estado, 'orbe_recurso', 1, 9, 5, 'abs', a.eventos);
    largarOrbeEfeito(a.estado, construirEfeito('bonus_dano', { pct: 20, duracaoMs: 5000 }), 7, 2, a.eventos);
    const hp = a.j.hp;
    a.ticks(900);
    expect(a.estado.objetos.filter((o) => o.tipo.startsWith('orbe'))).toEqual([]);
    expect(a.j.hp).toBeGreaterThan(hp);
    expect(a.j.mana).toBeGreaterThan(0);
    expect(a.j.buffsArmados.some((b) => b.efeito.tipo === 'bonus_dano')).toBe(true);
    expect(a.de('coletou').every((ev) => ev.id === 'j')).toBe(true);
  });

  it('em combate, mantém distância do alvo em vez de grudar nele', () => {
    const a = arena('aventureiro', 8);
    a.tick([['j', { t: 'selecionarAlvo', alvo: 'b' }]]);
    const distancias: number[] = [];
    for (let i = 0; i < 300; i++) {
      a.tick();
      distancias.push(chebyshev(falcaoDe(a), a.boneco));
    }
    expect(distancias.slice(120).filter((d) => d <= 1).length).toBeLessThan(30);
  });

  it('não volta a um combate longe do dono (ao renascer, o alvo antigo não puxa o falcão)', () => {
    const a = arena('aventureiro', 10);
    a.boneco.y = 10;
    a.j.x = 1; a.j.y = 1;
    a.tick([['j', { t: 'selecionarAlvo', alvo: 'b' }]]);
    for (let i = 0; i < 300; i++) {
      a.tick();
      expect(chebyshev(falcaoDe(a), a.j)).toBeLessThanOrEqual(ctx.balance.ajustesClasses.aventureiro.falcao.raioPasseio + 1);
    }
  });

  it('a habilidade sai do falcão mesmo longe; o uso conta o alcance do Aventureiro e o projétil voa até o alvo', () => {
    const a = arena('aventureiro');
    a.tick();
    const f = falcaoDe(a);
    f.x = 10; f.y = 10;
    const seta = obter(habilidadeDoAtor(ctx, a.j, 'seta_arcana'), 'seta');
    expect(origemDaHabilidade(a.estado, a.j, seta)).toEqual({ x: 10, y: 10 });
    a.tick([['j', { t: 'usarHabilidade', id: 'seta_arcana', alvo: 'b' }]]);
    expect(a.de('acaoRecusada')).toEqual([]);
    for (let i = 0; i < 200 && a.de('impacto').length === 0; i++) a.tick();
    expect(a.de('impacto')[0]).toMatchObject({ alvoId: 'b' });
  });
});

describe('encarnação elemental do Mago', () => {
  const hab = (id: string, j: Entidade) => obter(habilidadeDoAtor(ctx, j, id), id);

  it('fogo, gelo e raio trocam; outros elementos e outras classes não', () => {
    const a = arena('mago');
    expect(encarnar(ctx, a.j, hab('bola_de_fogo', a.j), 0)).toBe(true);
    expect(a.j.encarnacao).toBe('fogo');
    expect(encarnar(ctx, a.j, hab('bola_de_fogo', a.j), 0)).toBe(false);
    expect(encarnar(ctx, a.j, hab('dardo_toxico', a.j), 0)).toBe(false);
    expect(a.j.encarnacao).toBe('fogo');
    expect(encarnar(ctx, a.j, hab('lanca_de_gelo', a.j), 0)).toBe(true);
    expect(a.j.encarnacao).toBe('gelo');
    const outro = arena('arqueiro');
    expect(encarnar(ctx, outro.j, hab('bola_de_fogo', outro.j), 0)).toBe(false);
    expect(outro.j.encarnacao).toBeUndefined();
  });

  it('fogo: +5% nas magias e queima quem está a 1 célula', () => {
    const a = arena('mago', 4);
    a.j.encarnacao = 'fogo';
    a.j.encarnacaoAteTick = 99_999;
    expect(multiplicadorEncarnacao(ctx, a.j, hab('bola_de_fogo', a.j))).toBeCloseTo(1.05);
    a.estado.tick = 0;
    processarEncarnacoes(a.estado, ctx, a.eventos);
    expect(a.boneco.efeitos.some((f) => f.tipo === 'queimando')).toBe(true);
  });

  it('gelo: 10% menos dano e resfria quem golpeia de perto', () => {
    const a = arena('mago', 4);
    a.j.encarnacao = 'gelo';
    expect(protecaoEncarnacao(ctx, a.j)).toBeCloseTo(0.9);
    reagirAoGolpe(a.estado, ctx, a.j, a.boneco, a.eventos);
    expect(a.boneco.efeitos.some((f) => f.tipo === 'resfriado')).toBe(true);
  });

  it('raio: +15% de velocidade e um salto a mais', () => {
    const a = arena('mago');
    a.j.encarnacao = 'raio';
    expect(velocidadeEncarnacao(ctx, a.j)).toBeCloseTo(1.15);
    expect(saltosEncarnacao(a.j, hab('raio_em_cadeia', a.j))).toBe(1);
    a.j.encarnacao = 'fogo';
    expect(velocidadeEncarnacao(ctx, a.j)).toBe(1);
    expect(saltosEncarnacao(a.j, hab('raio_em_cadeia', a.j))).toBe(0);
  });

  it('dura 12 s desde a última magia do elemento; renova ao relançar e depois se apaga', () => {
    const a = arena('mago');
    const duracao = ticksDe(ctx.balance.ajustesClasses.mago.encarnacao.duracaoMs);
    encarnar(ctx, a.j, hab('bola_de_fogo', a.j), 0);
    expect(restanteEncarnacaoMs(a.j, 0)).toBe(ctx.balance.ajustesClasses.mago.encarnacao.duracaoMs);
    a.estado.tick = duracao - 10;
    encarnar(ctx, a.j, hab('bola_de_fogo', a.j), a.estado.tick);
    a.estado.tick = duracao + 5;
    processarEncarnacoes(a.estado, ctx, a.eventos);
    expect(a.j.encarnacao).toBe('fogo');
    a.estado.tick = 2 * duracao;
    processarEncarnacoes(a.estado, ctx, a.eventos);
    expect(a.j.encarnacao).toBeUndefined();
    expect(a.de('encarnacaoAcabou')).toEqual([expect.objectContaining({ id: 'j' })]);
  });

  it('lançar a magia emite `encarnou`; a fase nova zera', () => {
    const a = arena('mago');
    a.tick([['j', { t: 'usarHabilidade', id: 'raio_em_cadeia', alvo: 'b' }]]);
    a.ticks(ticksDe(875) + 5);
    expect(a.de('encarnou')).toEqual([expect.objectContaining({ id: 'j', elemento: 'raio' })]);
    expect(personagemNoInicio(a.j, { x: 1, y: 1 }).encarnacao).toBeUndefined();
  });
});

describe('Mira firme do Arqueiro', () => {
  it('enche em 6 s (a Destreza encurta até 25%) e zera ao levar dano', () => {
    const a = arena('arqueiro');
    a.j.atributos.destreza = 10;
    expect(ticksParaCarregar(ctx, a.j)).toBe(Math.round(6000 / DT_MS));
    a.j.atributos.destreza = 40;
    expect(ticksParaCarregar(ctx, a.j)).toBe(Math.round(4500 / DT_MS));
    a.j.mira = { desdeTick: 0 };
    expect(fracaoMira(ctx, a.j, ticksParaCarregar(ctx, a.j))).toBe(1);
    registrarParticipacao(a.j, 'b', 50, ctx);
    expect(fracaoMira(ctx, a.j, 50)).toBe(0);
    expect(fracaoMira(ctx, arena('mago').j, 50)).toBeNull();
  });

  it('cheia, o próximo tiro é crítico, atravessa, vai até o alcance máximo e consome a barra', () => {
    const a = arena('arqueiro');
    a.j.mira = { desdeTick: -10_000 };
    a.tick([['j', { t: 'usarHabilidade', id: 'tiro', alvo: 'b' }]]);
    for (let i = 0; i < 40 && a.estado.projeteis.length === 0; i++) a.tick();
    const p = obter(a.estado.projeteis[0], 'projétil');
    expect(a.de('tiroCarregado')).toHaveLength(1);
    expect(p.atravessa).toBe(true);
    expect(p.d20Minimo).toBe(16);
    expect(p.restante).toBeGreaterThan(2);
    expect(fracaoMira(ctx, a.j, a.estado.tick)).toBeLessThan(1);
    for (let i = 0; i < 80 && a.de('impacto').length === 0; i++) a.tick();
    expect(a.de('impacto')[0]).toMatchObject({ critico: true });
  });

  it('a barra vazia não carrega o tiro; o clone copia a mira e a fase nova zera', () => {
    const a = arena('arqueiro');
    a.j.mira = { desdeTick: 0 };
    a.tick([['j', { t: 'usarHabilidade', id: 'tiro', alvo: 'b' }]]);
    a.ticks(10);
    expect(a.de('tiroCarregado')).toHaveLength(0);
    const copia = obter(clonarEstado(a.estado).entidades.find((e) => e.id === 'j'), 'cópia');
    expect(copia.mira).toEqual(a.j.mira);
    expect(copia.mira).not.toBe(a.j.mira);
    expect(personagemNoInicio(a.j, { x: 1, y: 1 }).mira).toBeUndefined();
  });
});

describe('na rede (estado público, sem a bolsa)', () => {
  it('a classe vem do `classeId`: falcão, encarnação e mira continuam valendo', () => {
    const a = arena('aventureiro');
    a.tick();
    const pub = estadoPublico(a.estado);
    const j = obter(pub.entidades.find((e) => e.id === 'j'), 'j');
    expect(j.bolsa ?? null).toBeNull();
    expect(companheiroDe(pub, j)).toBeDefined();
    const m = arena('mago');
    m.j.encarnacao = 'gelo';
    const mPub = obter(estadoPublico(m.estado).entidades.find((e) => e.id === 'j'), 'mago');
    expect(protecaoEncarnacao(ctx, mPub)).toBeCloseTo(0.9);
    const r = arena('arqueiro');
    r.j.mira = { desdeTick: 0 };
    const rPub = obter(estadoPublico(r.estado).entidades.find((e) => e.id === 'j'), 'arqueiro');
    expect(fracaoMira(ctx, rPub, 10_000)).toBe(1);
  });
});
