// Marco 27 (29/10/2026, D-126): as armas de classe — 8 por classe, o básico de cada uma, a familiaridade, as frações
// de passiva da arma de outra classe, o 3º golpe pela mão secundária e a migração do save.
import { describe, expect, it } from 'vitest';
import { alcanceSemArma, basicoDaVez, contarBasico, fatorDaVelocidade, fatorDeCura, fatorDosServos, multiplicadorArma, recargaDoBasicoPct } from '../../src/combat/basico';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { criarEstado } from '../../src/core/estado';
import type { Entidade } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { emprestimosDe, FAMILIAS_DE_ARMA, passivaAtiva, temFamiliaridade } from '../../src/progression/armas';
import { recalcularFicha } from '../../src/progression/derivados';
import { idItemBase } from '../../src/progression/gerar-item-base';
import { equipar } from '../../src/progression/inventario';
import { MIGRACOES } from '../../src/save/esquema';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

const item = (base: string, invId: string) => ({ invId, itemId: idItemBase(base, 'comum', null, 1, 7), qtd: 1, ref: null });

function personagem(classe: string, principal: string | null, secundaria: string | null = null): Entidade {
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 2, 2, ctx.balance);
  const bolsa = obter(j.bolsa);
  bolsa.equipamento.arma_principal = principal ? item(principal, 'a1') : null;
  bolsa.equipamento.arma_secundaria = secundaria ? item(secundaria, 'a2') : null;
  recalcularFicha(j, ctx);
  return j;
}

describe('as armas de classe', () => {
  it('cada classe tem 8 armas, cada uma com o seu básico e uma variação própria', () => {
    const armas = [...CONTEUDO.itensComFormas.bases.values()].filter((b) => b.arma && CONTEUDO.armas.armas.has(b.arma));
    for (const f of FAMILIAS_DE_ARMA) expect(armas.filter((b) => CONTEUDO.armas.armas.get(b.arma ?? '')?.familia === f)).toHaveLength(8);
    const basicos = armas.map((b) => obter(CONTEUDO.armas.armas.get(b.arma ?? '')).basico);
    expect(new Set(basicos).size).toBe(40);
    for (const id of basicos) {
      const h = obter(CONTEUDO.habilidades.get(id));
      expect(h.escalaRolagem?.length, id).toBeGreaterThan(0);
      expect(h.visual?.assinatura, id).toBe(`arma_${id.replace('basico_', '')}`);
    }
  });

  it('o básico vem da arma principal; sem arma, o da classe', () => {
    expect(personagem('guerreiro', 'machado').ataqueBasico).toBe('basico_machado');
    expect(personagem('mago', 'espada').ataqueBasico).toBe('basico_espada');
    expect(personagem('necromante', 'praga').ataqueBasico).toBe('basico_praga');
    expect(personagem('mago', null).ataqueBasico).toBe('dardo_arcano');
    expect(personagem('aventureiro', null).ataqueBasico).toBe('bumerangue');
  });

  it('a arma de partida já vem na mão principal, com o básico de base da família', () => {
    for (const [classe, basico] of [['guerreiro', 'ataque_basico'], ['arqueiro', 'tiro'], ['mago', 'dardo_arcano'], ['necromante', 'solo_amaldicoado'], ['aventureiro', 'bumerangue']] as const) {
      const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 2, 2, ctx.balance);
      expect(j.bolsa?.equipamento.arma_principal?.itemId, classe).toBe(CONTEUDO.classes.get(classe)?.armaInicial);
      recalcularFicha(j, ctx);
      expect(j.ataqueBasico, classe).toBe(basico);
      expect(temFamiliaridade(ctx, j), classe).toBe(true);
    }
  });

  it('sem a arma natural, cada classe perde parte da passiva dela', () => {
    const b = ctx.balance.armas.semFamiliaridade;
    expect(fatorDeCura(ctx, personagem('guerreiro', 'machado'))).toBe(1);
    expect(fatorDeCura(ctx, personagem('guerreiro', 'tomo'))).toBeCloseTo(1 + b.curaPct / 100);
    // A lâmina vale também na mão secundária para o Guerreiro.
    expect(fatorDeCura(ctx, personagem('guerreiro', 'tomo', 'espada'))).toBe(1);
    expect(fatorDosServos(ctx, personagem('necromante', 'espada'))).toBeCloseTo(1 + b.servosPct / 100);
    const arqueiro = personagem('arqueiro', 'espada');
    expect(alcanceSemArma(ctx, arqueiro, obter(habilidadeDoAtor(ctx, arqueiro, arqueiro.ataqueBasico)))).toBe(b.alcance);
    expect(fatorDaVelocidade(ctx, arqueiro)).toBeCloseTo(1 + b.velocidadePct / 100);
    const bola = obter(CONTEUDO.habilidades.get('bola_de_fogo'));
    expect(multiplicadorArma(ctx, personagem('mago', 'tomo'), bola)).toBe(1);
    expect(multiplicadorArma(ctx, personagem('mago', 'espada'), bola)).toBeCloseTo(1 + b.elementalPct / 100);
  });

  it('a passiva do Aventureiro só vale com o arremessável na mão principal', () => {
    expect(passivaAtiva(ctx, personagem('aventureiro', 'chakram'), 'pergaminhos')).toBe(true);
    expect(passivaAtiva(ctx, personagem('aventureiro', 'espada', 'chakram'), 'pergaminhos')).toBe(false);
    const av = personagem('aventureiro', 'chakram');
    expect(multiplicadorArma(ctx, av, obter(habilidadeDoAtor(ctx, av, av.ataqueBasico)))).toBeCloseTo(1 + ctx.balance.armas.aventureiro.danoBasicoPct / 100);
  });

  it('a arma de outra classe dá a fração da passiva dela', () => {
    expect(emprestimosDe(ctx, personagem('mago', 'espada'))).toEqual(['curaAoAbater']);
    expect(emprestimosDe(ctx, personagem('guerreiro', 'machado', 'tomo'))).toEqual(['basicoElemental']);
    expect(emprestimosDe(ctx, personagem('guerreiro', 'cajado'))).toEqual(['reanimar']);
    expect(emprestimosDe(ctx, personagem('mago', 'chakram'))).toEqual(['invocacaoDuracao']);
    // O arco na mão de outra classe atira, mas mais devagar.
    const mago = personagem('mago', 'arco');
    expect(recargaDoBasicoPct(ctx, mago, obter(habilidadeDoAtor(ctx, mago, mago.ataqueBasico)))).toBe(ctx.balance.armas.emprestimo.arcoRecargaPct);
    expect(emprestimosDe(ctx, personagem('arqueiro', 'arco'))).toEqual([]);
  });

  it('qualquer arma vai para a mão secundária, e o 3º básico sai por ela', () => {
    const j = personagem('arqueiro', 'arco');
    const bolsa = obter(j.bolsa);
    bolsa.mochila.push(item('espada', 'm1'));
    equipar(j, ctx, 'm1', 'arma_secundaria', 0, []);
    expect(bolsa.equipamento.arma_secundaria?.invId).toBe('m1');
    expect(j.armas?.secundario).toBe('basico_espada');
    const estado = criarEstado({ semente: 1, faseId: ctx.fase.id });
    const perto = { x: 3, y: 2 };
    const alcance = (id: string) => habilidadeDoAtor(ctx, j, id)?.alcanceCelulas ?? null;
    expect(basicoDaVez(estado, ctx, j, j.ataqueBasico, perto, alcance)).toBe(j.ataqueBasico);
    contarBasico(j, j.ataqueBasico);
    contarBasico(j, j.ataqueBasico);
    expect(basicoDaVez(estado, ctx, j, j.ataqueBasico, perto, alcance)).toBe('basico_espada');
    // Fora do alcance da espada, o golpe fica pendente e sai pelo arco.
    expect(basicoDaVez(estado, ctx, j, j.ataqueBasico, { x: 9, y: 2 }, alcance)).toBe(j.ataqueBasico);
    contarBasico(j, 'basico_espada');
    expect(j.armas?.contador).toBe(0);
  });

  it('a migração dá a arma de partida a quem estava de mãos vazias e refaz os básicos', () => {
    const mago = personagem('mago', null, 'espada');
    mago.ataqueBasico = 'ataque_basico';
    delete mago.armas;
    const migrado = obter(MIGRACOES[26])({ estado: { entidades: [mago] }, fasesVisitadas: {} });
    const [e] = (migrado.estado as { entidades: Entidade[] }).entidades;
    expect(e?.bolsa?.equipamento.arma_principal?.itemId).toBe('tomo_aprendiz');
    expect(e?.ataqueBasico).toBe('dardo_arcano');
    expect(e?.armas?.secundario).toBe('basico_espada');
  });
});
