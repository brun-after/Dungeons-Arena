// Marco 40 (13/11/2026, D-160): os fios da ultimate — os elementos do par, a reação do par (e a runa no par) e a fusão
// dos dois estilos mais fortes —, graduais pela faixa e guardados na chave compilada.
import { describe, expect, it } from 'vitest';
import { formatarChave, lerChave } from '../../src/combat/chave-habilidade';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { chaveDoAtor } from '../../src/combat/perfil';
import { ultimateDe } from '../../src/combat/carga-ultimate';
import { criarJogador } from '../../src/entities/fabrica';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
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

  it('a classe veste a ultimate: as criaturas da função e, no Necromante, as lanças (D-161)', () => {
    const chave = 'ult_legiao#fogo6.gelo3$mago!fogo8';
    expect(formatarChave(obter(lerChave(chave)))).toBe(chave);
    expect(lerChave('ult_legiao$mago')).toBeNull();
    const ref = (k: string) => ult(k).efeitos.find((e) => e.tipo === 'invocar_temporario')?.ref;
    expect(ref('ult_legiao#fogo6.gelo3$mago!fogo8')).toBe('espectro_tempestade');
    expect(ref('ult_legiao#fogo6.gelo3$necromante!trevas8')).toBe('esqueleto_profano');
    expect(ref('ult_guardioes#fogo6.gelo3$guerreiro!fisico8')).toBe('fada');
    expect(ref('ult_muralha_viva#fogo6.gelo3$arqueiro!raio8')).toBe('lobo_espiritual');
    expect(ult('ult_aniquilacao#fogo6.gelo3$necromante!trevas8').lanca?.junto).toBe(true);
    expect(ult('ult_aniquilacao#fogo6.gelo3$mago!fogo8').lanca).toBeUndefined();
    // A que não fere não lança.
    expect(ult('ult_legiao#fogo6.gelo3$necromante!trevas8').lanca).toBeUndefined();
  });

  it('a cratera do Cometa é da matéria da runa (D-161)', () => {
    const interno = (k: string) => ult(k).efeitos.find((e) => e.tipo === 'campo_veneno')?.interno?.tipo;
    expect(interno('ult_cometa_1#fogo6.gelo3$guerreiro!fogo8')).toBe('queimando');
    expect(interno('ult_cometa_1#fogo6.gelo3$guerreiro!gelo8')).toBe('resfriado');
    expect(interno('ult_cometa_1#fogo6.gelo3$guerreiro!fisico8')).toBe('atolado');
  });

  it('o Renascer levanta o aliado caído mais perto com 30% da vida (D-161)', () => {
    const estado = criarEstado({ semente: 1, faseId: ctx.fase.id });
    const classe = obter(CONTEUDO.classes.get('mago'));
    const quem = criarJogador(classe, 'a', 3, 3, ctx.balance);
    const perto = criarJogador(classe, 'b', 4, 3, ctx.balance);
    const longe = criarJogador(classe, 'c', 9, 3, ctx.balance);
    for (const e of [perto, longe]) {
      e.morto = true;
      e.hp = 0;
      e.reviverEmTick = 999;
    }
    estado.entidades.push(quem, perto, longe);
    const saida: EventoSimulacao[] = [];
    aplicarEfeito(estado, ctx, quem, construirEfeito('levantar', { valor: 3, pct: 30 }), { id: quem.id, x: 3, y: 3 }, null, saida);
    expect(perto.morto).toBe(false);
    expect(perto.reviverEmTick).toBe(0);
    expect(perto.hp).toBe(Math.round(perto.hpMax * 0.3));
    expect(longe.morto).toBe(true);
    expect(saida.some((e) => e.t === 'reviveu' && e.id === 'b')).toBe(true);
    expect(ult('ult_renascer').efeitos.some((e) => e.tipo === 'levantar')).toBe(true);
  });
});
