// Marco 24 (25/10/2026, D-098): as trajetórias do falcão nas skills, as ultimates tingidas e as asas em rajadas.
import { describe, expect, it } from 'vitest';
import { MODELOS } from '../../src/render/modelos';
import { pontoDoVoo, quadroDasAsas, VOOS_SKILL, vooDaUltimate, type FormaVoo } from '../../src/render/voos-falcao';
import { CONTEUDO } from '../apoio/fases';

const DE = { x: 0, y: 0 };
const ALVO = { x: 6, y: 0 };

describe('o voo do falcão (marco 24)', () => {
  it('o mergulho sobe e para no alto antes de cair em linha reta até o alvo', () => {
    const alto = pontoDoVoo('mergulho', 0.5, DE, ALVO, DE);
    expect(alto.altura).toBeGreaterThan(1);
    expect(alto.x).toBeLessThan(0);
    const descida = pontoDoVoo('mergulho', 0.8, DE, ALVO, DE);
    expect(descida.altura).toBeLessThan(alto.altura);
    const fim = pontoDoVoo('mergulho', 1, DE, ALVO, DE);
    expect(fim.x).toBeCloseTo(6, 5);
    expect(fim.altura).toBeCloseTo(0, 5);
  });

  it('o rasante voa baixo e passa do alvo; o zigue-zague sai da linha; a Vigia circula o dono', () => {
    expect(pontoDoVoo('rasante', 0.5, DE, ALVO, DE).altura).toBeLessThan(0);
    expect(pontoDoVoo('rasante', 1, DE, ALVO, DE).x).toBeGreaterThan(6);
    expect(Math.abs(pontoDoVoo('zigue', 0.15, DE, ALVO, DE).y)).toBeGreaterThan(0.2);
    const dono = { x: 3, y: 3 };
    for (const t of [0, 0.25, 0.5, 0.75]) {
      const p = pontoDoVoo('circulo', t, DE, ALVO, dono);
      expect(Math.hypot(p.x - dono.x, p.y - dono.y)).toBeLessThan(1);
    }
  });

  it('toda forma de voo dá pontos finitos em todo o tempo', () => {
    const formas: FormaVoo[] = ['mergulho', 'rasante', 'zigue', 'espiral', 'grito', 'circulo', 'retorno', 'dupla', 'reto'];
    for (const f of formas) {
      for (let t = 0; t <= 1; t += 0.1) {
        const p = pontoDoVoo(f, t, DE, ALVO, DE);
        expect(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.altura), `${f} ${t}`).toBe(true);
      }
    }
  });

  it('as skills com voo próprio existem e são do falcão', () => {
    for (const id of Object.keys(VOOS_SKILL)) expect(CONTEUDO.definicoes.get(id)?.base.tags, id).toContain('falcao');
  });

  it('as ultimates do falcão tingem o falcão; cor quase branca vira o dourado', () => {
    const trovao = vooDaUltimate('ult_mergulho_do_trovao', ['mergulho', 'grito_do_falcao'], 0xf2f2f2);
    expect(trovao).toMatchObject({ forma: 'mergulho', tinge: true, cor: 0x5dade2 });
    expect(vooDaUltimate('ult_x', ['rasante', 'vigia'], 0xf2f2f2)?.cor).toBe(0xf5b041);
    expect(vooDaUltimate('ult_x', ['rasante', 'vigia'], 0x9fd3ff)?.cor).toBe(0x9fd3ff);
    expect(vooDaUltimate('ult_x', ['outra', 'coisa'], null)).toBeNull();
    // Toda ultimate do Aventureiro tem o voo de alguma skill do par.
    for (const u of CONTEUDO.ultimates.values()) if (u.classe === 'aventureiro') expect(vooDaUltimate(u.id, u.par, null), u.id).not.toBeNull();
  });

  it('as asas batem em rajadas: na maior parte do tempo, planam; pousado, ficam fechadas', () => {
    expect(MODELOS.falcao.quadros).toBe(3);
    let batendo = 0;
    for (let ms = 0; ms < 20_000; ms += 10) if (quadroDasAsas(ms, 1, false, false) === 1) batendo++;
    expect(batendo).toBeGreaterThan(100);
    expect(batendo).toBeLessThan(1000);
    expect(quadroDasAsas(1234, 1, true, false)).toBe(2);
    // Voando rápido, bate sem parar.
    const rapido = new Set([0, 55, 110, 165, 220].map((ms) => quadroDasAsas(ms, 1, false, true)));
    expect(rapido.size).toBe(2);
  });
});
