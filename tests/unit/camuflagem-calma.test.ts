// Marco 44 (15/11/2026, D-178): a zona de fácil camuflagem (a sombra das árvores), a calma da noite perto da vila e
// das entradas, e a batalha notada de mais perto à noite.
import { describe, expect, it } from 'vitest';
import { modoPorId } from '../../src/core/conteudo';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { aleatorio, criarRng } from '../../src/core/rng';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { raioContra, raioDeAtencao } from '../../src/entities/ia-mundo';
import { lerLugar, montarLugar } from '../../src/mundo/lugares';
import { calmaEm, nivelDaNoite } from '../../src/mundo/noite';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { copaEm, naMataFechada, naSombra, raioDaSombra } from '../../src/world/camuflagem';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { CONTEUDO } from '../apoio/fases';

const CAM = BALANCE_PADRAO.mundo.noite.camuflagem;

/** Árvores de duas em duas células de 6 a 30, cortadas por uma estrada de y = 16 a 20, e uma árvore solta em (36, 36). */
function mata() {
  const largura = 44;
  const obstaculos = new Uint8Array(largura * largura);
  for (let y = 6; y <= 30; y += 2) for (let x = 6; x <= 30; x += 2) if (y < 16 || y > 20) obstaculos[y * largura + x] = 3;
  obstaculos[36 * largura + 36] = 3;
  return { largura, altura: largura, obstaculos };
}

function regiao(id: string) {
  const reino = CONTEUDO.reinos.get('reino_central');
  if (!reino) throw new Error('reino');
  const lugar = lerLugar(reino, `regiao:${id}`);
  if (!lugar || lugar.tipo !== 'regiao') throw new Error('lugar');
  const m = montarLugar(CONTEUDO, reino, lugar, modoPorId(CONTEUDO, MODO_MUNDO));
  return { ...m, regiao: lugar.regiao };
}

describe('a zona de fácil camuflagem (D-178)', () => {
  it('a copa fecha só no meio das árvores: na estrada e na clareira, não', () => {
    const f = mata();
    expect(copaEm(f, 16, 10)).toBe(1);
    expect(copaEm(f, 18, 18)).toBe(0);
    expect(naMataFechada(f, 16, 10, CAM)).toBe(true);
    expect(naMataFechada(f, 36, 36, CAM)).toBe(false);
  });

  it('na mata fechada a sombra da árvore tem 5 vezes a área; na estrada e fora dela, ninguém se esconde', () => {
    const f = mata();
    expect(raioDaSombra(f, 16, 10, CAM) ** 2).toBeCloseTo(CAM.raioSombra ** 2 * CAM.areaNaMata, 5);
    expect(raioDaSombra(f, 36, 36, CAM)).toBe(CAM.raioSombra);
    // No meio da mata, entre os troncos, tudo é sombra; na árvore solta, só bem junto dela.
    expect(naSombra(f, 17, 11, CAM)).toBe(true);
    expect(naSombra(f, 36.5, 36, CAM)).toBe(true);
    expect(naSombra(f, 37.5, 36, CAM)).toBe(false);
    expect(naSombra(f, 18, 18, CAM)).toBe(false);
  });
});

describe('a calma da noite (D-178)', () => {
  it('junto da vila e das entradas, a horda tende ao piso da faixa; longe, é a da noite', () => {
    const m = regiao('vila_do_centro');
    const v = m.regiao.vila;
    if (!v) throw new Error('vila');
    const rng = criarRng(7);
    const sorte = () => aleatorio(rng);
    const junto = { x: v.x + v.raio + 2, y: v.y };
    expect(calmaEm(m.ctx, m.regiao, junto)).toBeGreaterThan(0.9);
    const niveis = Array.from({ length: 300 }, () => nivelDaNoite(m.ctx, m.regiao, junto, sorte));
    const baixos = niveis.filter((n) => n <= m.regiao.nivel[0] + m.ctx.balance.mundo.noite.calma.nivelBaixoAte).length;
    expect(baixos / niveis.length).toBeGreaterThan(0.7);
    expect(niveis.some((n) => n > m.regiao.nivel[1])).toBe(true);
    // A boca de uma passagem também acalma.
    const a = m.ctx.fase.passagens?.[0];
    if (!a) throw new Error('passagem');
    expect(calmaEm(m.ctx, m.regiao, { x: a.x0, y: a.y0 })).toBe(1);
  });

  it('longe da vila e das entradas, a noite traz só os de cima da faixa', () => {
    const m = regiao('campos_do_oeste');
    const longe = { x: 0, y: 0 };
    const n = m.regiao.tamanho ?? 128;
    let melhor = 1;
    for (let y = 10; y < n - 10; y += 4) for (let x = 10; x < n - 10; x += 4) {
      const c = calmaEm(m.ctx, m.regiao, { x, y });
      if (c < melhor) [melhor, longe.x, longe.y] = [c, x, y];
    }
    expect(melhor).toBe(0);
    const rng = criarRng(3);
    for (let i = 0; i < 50; i++) expect(nivelDaNoite(m.ctx, m.regiao, longe, () => aleatorio(rng))).toBeGreaterThan(m.regiao.nivel[1]);
  });
});

describe('a batalha por perto à noite (D-178)', () => {
  it('é notada de mais perto e chama a 50% do dia na noite fechada', () => {
    const m = regiao('campos_do_oeste');
    const classe = CONTEUDO.classes.get('guerreiro');
    const lobo = CONTEUDO.presets.get('lobo');
    if (!classe || !lobo) throw new Error('conteúdo');
    m.estado.entidades = [];
    const eu = criarJogador(classe, 'p1', 60, 60, m.ctx.balance);
    const vigia = criarInimigo(lobo, 'vigia', 60, 72, m.ctx.balance, { nivel: 3 });
    const ferido = criarInimigo(lobo, 'ferido', 60, 61, m.ctx.balance, { nivel: 3 });
    ferido.participacao.push({ id: eu.id, tick: m.estado.tick });
    m.estado.entidades.push(eu, vigia, ferido);
    const b = m.ctx.balance.mundo.atencaoBatalha;
    const dia: ContextoSimulacao = { ...m.ctx, modo: { ...m.ctx.modo, escuro: 0 } };
    const noite: ContextoSimulacao = { ...m.ctx, modo: { ...m.ctx.modo, escuro: 1 } };
    // A 11 células: de dia ouve a batalha (raio 16); à noite (raio 8), não.
    expect(raioDeAtencao(m.estado, dia, vigia, 5)).toBe(5 + b.bonus);
    expect(raioDeAtencao(m.estado, noite, vigia, 5)).toBe(5);
    // Perto, à noite, ouve; o raio inteiro (o base e o bônus) cai à metade uma vez só, contra quem não tem luz.
    vigia.y = 64;
    vigia.py = 64;
    expect(raioDeAtencao(m.estado, noite, vigia, 5)).toBe(5 + b.bonus);
    expect(raioContra(m.estado, noite, vigia, eu, raioDeAtencao(m.estado, noite, vigia, 5))).toBeCloseTo((5 + b.bonus) * 0.5);
  });
});
