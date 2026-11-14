// O Arqueiro mais dependente de movimento e o deslize que respeita a animação (14/11/2026, D-171).
import { describe, expect, it } from 'vitest';
import { alcanceDe } from '../../src/combat/acao';
import { adiantarMiraPorSkill, fracaoMira, perderMiraPorDano, ticksParaCarregar } from '../../src/combat/mira';
import { noDeslize } from '../../src/combat/deslize';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { definirDirecao } from '../../src/world/movimento';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v == null) throw new Error(`${nome} ausente`);
  return v;
}

const ctx = contexto(faseDeTexto(SALA_ABERTA));
const arq = ctx.balance.ajustesClasses.arqueiro;

const arqueiro = (x = 5, y = 5): Entidade => criarJogador(obter(CONTEUDO.classes.get('arqueiro'), 'classe'), 'j', x, y, ctx.balance);
const encher = (e: Entidade, tick: number) => { e.mira = { desdeTick: tick - ticksParaCarregar(ctx, e) }; };

describe('alcance do Arqueiro pela Mira firme (D-171)', () => {
  const alcanceDoBasico = (e: Entidade, tick: number) => alcanceDe(ctx, e, obter(habilidadeDoAtor(ctx, e, e.ataqueBasico), 'básico'), tick);

  it('sem a Mira cheia, 30% menos; cheia, o alcance inteiro, andando ou não', () => {
    const j = arqueiro();
    encher(j, 100);
    const cheio = alcanceDoBasico(j, 100);
    j.mira = { desdeTick: 100 };
    expect(alcanceDoBasico(j, 100)).toBeCloseTo((cheio * arq.alcanceSemMiraPct) / 100, 6);
    j.direcao = 'E';
    expect(alcanceDoBasico(j, 100)).toBeCloseTo((cheio * arq.alcanceSemMiraPct * arq.alcanceAndandoPct) / 10000, 6);
    encher(j, 100);
    expect(alcanceDoBasico(j, 100)).toBe(cheio);
  });
});

describe('a Mira firme pelas skills de fora da classe (D-171)', () => {
  it('a skill de fora enche um pedaço; a de classe e o básico, não', () => {
    const j = arqueiro();
    j.mira = { desdeTick: 50 };
    const classe = obter(ctx.conteudo.classes.get('arqueiro'), 'classe').exclusivas[0];
    adiantarMiraPorSkill(ctx, j, obter(classe, 'exclusiva'), false, 50);
    adiantarMiraPorSkill(ctx, j, j.ataqueBasico, true, 50);
    expect(fracaoMira(ctx, j, 50)).toBe(0);
    adiantarMiraPorSkill(ctx, j, 'seta_arcana', false, 50);
    expect(fracaoMira(ctx, j, 50)).toBeCloseTo(arq.mira.porSkillPct / 100, 1);
  });

  it('levar dano zera a barra sem o Inabalável', () => {
    const j = arqueiro();
    encher(j, 200);
    perderMiraPorDano(ctx, j, 200);
    expect(fracaoMira(ctx, j, 200)).toBe(0);
  });
});

describe('o salto para trás respeita a animação (D-171)', () => {
  function cena() {
    const estado = criarEstado({ semente: 3, faseId: ctx.fase.id });
    const j = arqueiro(6, 5);
    j.movimentoClasse = { ativo: 'salto_atras', cargas: {} };
    const boneco = criarInimigo(obter(CONTEUDO.presets.get('boneco'), 'boneco'), 'b', 8, 5, ctx.balance);
    estado.entidades.push(j, boneco);
    const eventos: EventoSimulacao[] = [];
    return { estado, j, eventos };
  }

  it('andando para a frente, salta para trás e só volta a andar para a frente no fim do deslize', () => {
    const { estado, j, eventos } = cena();
    definirDirecao(j, 'E');
    simular(estado, ctx, [{ tick: estado.tick, entidadeId: 'j', cmd: { t: 'movimentoClasse' } }], eventos, DT_MS);
    expect(eventos.some((e) => e.t === 'deslocado' && e.id === 'j' && e.causa === 'recuo')).toBe(true);
    const pousou = j.px;
    expect(pousou).toBeLessThan(6);
    expect(noDeslize(j, estado.tick)).toBe(true);
    const fim = obter(j.deslize, 'deslize').ateTick;
    while (estado.tick < fim - 1) simular(estado, ctx, [], eventos, DT_MS);
    expect(j.px).toBeCloseTo(pousou, 6);
    for (let i = 0; i < 4; i++) simular(estado, ctx, [], eventos, DT_MS);
    expect(j.px).toBeGreaterThan(pousou);
  });

  it('recuar no mesmo rumo do salto segue sem esperar', () => {
    const { estado, j, eventos } = cena();
    definirDirecao(j, 'E');
    simular(estado, ctx, [{ tick: estado.tick, entidadeId: 'j', cmd: { t: 'movimentoClasse' } }], eventos, DT_MS);
    const pousou = j.px;
    definirDirecao(j, 'O');
    simular(estado, ctx, [], eventos, DT_MS);
    expect(noDeslize(j, estado.tick)).toBe(true);
    expect(j.px).toBeLessThan(pousou);
  });

  it('com o alvo à frente, o básico automático espera o fim do salto', () => {
    const { estado, j, eventos } = cena();
    definirDirecao(j, 'E');
    simular(estado, ctx, [{ tick: estado.tick, entidadeId: 'j', cmd: { t: 'movimentoClasse' } }], eventos, DT_MS);
    definirDirecao(j, 'parado');
    simular(estado, ctx, [{ tick: estado.tick, entidadeId: 'j', cmd: { t: 'selecionarAlvo', alvo: 'b' } }], eventos, DT_MS);
    const fim = obter(j.deslize, 'deslize').ateTick;
    const basicoAntes = () => eventos.some((e) => e.t === 'acaoIniciada' && e.atorId === 'j' && e.tick < fim);
    while (estado.tick < fim) simular(estado, ctx, [], eventos, DT_MS);
    expect(basicoAntes()).toBe(false);
    for (let i = 0; i < ticksDe(1000); i++) simular(estado, ctx, [], eventos, DT_MS);
    expect(eventos.some((e) => e.t === 'acaoIniciada' && e.atorId === 'j')).toBe(true);
  });
});
