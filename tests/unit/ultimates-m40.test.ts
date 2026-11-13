// Marco 40 (13/11/2026, D-160): os fios da ultimate — os elementos do par, a reação do par (e a runa no par) e a fusão
// dos dois estilos mais fortes —, graduais pela faixa e guardados na chave compilada.
import { describe, expect, it } from 'vitest';
import { formatarChave, lerChave } from '../../src/combat/chave-habilidade';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { chaveDoAtor } from '../../src/combat/perfil';
import { ultimateDe } from '../../src/combat/carga-ultimate';
import { criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
const r = ctx.balance.habilidades.runas;

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const ult = (chave: string) => obter(resolverHabilidade(ctx, chave), chave);

describe('fios da ultimate (D-160)', () => {
  it('a chave leva os elementos do par e a fusão, e volta igual', () => {
    const chave = 'ult_aniquilacao^ecoar3,maior_e_mais_lenta6#fogo6.gelo3*area.eco3!fogo8';
    const p = obter(lerChave(chave));
    expect(p.fios).toEqual({ par: [{ el: 'fogo', faixa: 6 }, { el: 'gelo', faixa: 3 }], fusao: { eixos: ['area', 'eco'], faixa: 3 } });
    expect(formatarChave(p)).toBe(chave);
    expect(lerChave('ult_aniquilacao*area.eco3')).toBeNull();
    expect(lerChave('ult_aniquilacao#fogo6.gelo3*area.area3')).toBeNull();
  });

  it('o par de elementos reage pela faixa do mais fraco, e a runa no par cresce até o dobro', () => {
    expect(ult('ult_aniquilacao#fogo6.gelo3!fisico5').bonusFiosPct).toBeCloseTo(r.parPorFaixaPct * 3);
    expect(ult('ult_aniquilacao#fogo6.gelo3!fogo8').bonusFiosPct).toBeCloseTo(r.parPorFaixaPct * 3 * 1.6);
    expect(ult('ult_aniquilacao#fogo10.gelo10!fogo10').bonusFiosPct).toBeCloseTo(r.parPorFaixaPct * 10 * 2);
    expect(ult('ult_aniquilacao#fogo6.gelo3!fogo8').reacaoPar).toBe('fogo+gelo');
    // O mesmo elemento nas duas skills não reage.
    expect(ult('ult_aniquilacao#fogo6.fogo6!fogo8').bonusFiosPct).toBeUndefined();
  });

  it('o elemento de cada skill do par entra com o estado dele, pela faixa', () => {
    const fraco = ult('ult_aniquilacao#fisico5.gelo2!fisico5').efeitos.find((e) => e.tipo === 'resfriado');
    const forte = ult('ult_aniquilacao#fisico5.gelo10!fisico5').efeitos.find((e) => e.tipo === 'resfriado');
    expect(obter(fraco).duracaoMs).toBeLessThan(obter(forte).duracaoMs);
    expect(ult('ult_aniquilacao#fisico5.gelo0!fisico5').efeitos.some((e) => e.tipo === 'resfriado')).toBe(false);
  });

  it('a fusão dos dois estilos entra pela faixa do mais fraco', () => {
    const sem = ult('ult_aniquilacao#fogo6.fogo6!fogo6');
    const com = ult('ult_aniquilacao#fogo6.fogo6*area.controle4!fogo6');
    expect(sem.efeitos.some((e) => e.tipo === 'enraizado')).toBe(false);
    expect(com.efeitos.some((e) => e.tipo === 'enraizado')).toBe(true);
    expect(com.fusao).toBe('area+controle');
    expect(CONTEUDO.fusoes.size).toBe(36);
  });

  it('o personagem leva os fios na chave da ultimate', () => {
    const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 3, 5, ctx.balance);
    const u = obter(ultimateDe(ctx, j));
    const chave = chaveDoAtor(ctx, j, u.id, 0);
    expect(chave).toMatch(/#[a-z]+\d+\.[a-z]+\d+/);
    expect(resolverHabilidade(ctx, chave)?.tags).toContain('ultimate');
  });
});
