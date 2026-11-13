// Marco 39 (12/11/2026, D-151): as runas nas skills de classe e nas ultimates — a padrão (da skill ou da classe), a troca
// por um elemento com vínculo, a runa que some quando o vínculo esfria, a parte elemental de 20% a 60% na chave e no
// golpe, e a função secundária na cura.
import { describe, expect, it } from 'vitest';
import { formatarChave, lerChave } from '../../src/combat/chave-habilidade';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { aplicarRuna, escolherRuna, fracaoElemental, levaRuna, runaDoAtor, runasDisponiveis } from '../../src/combat/runas';
import { lerComando } from '../../src/arena/protocolo';
import { ticksDe } from '../../src/core/tempo';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { criarEstado } from '../../src/core/estado';
import { comCombosDoLancamento } from '../../src/combat/combos-assinados';
import { registrarUso } from '../../src/progression/vinculo';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
const r = ctx.balance.habilidades.runas;
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}
const jogador = (classe: string) => criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 2, 2, ctx.balance);

describe('runas nas skills de classe (D-151)', () => {
  it('a chave leva a runa e a faixa; lerChave devolve as mesmas partes', () => {
    const chave = formatarChave({ id: 'redemoinho', rank: 2, caminhos: [], mods: [], runa: { runa: 'gelo', faixa: 7 } });
    expect(chave).toBe('redemoinho@2!gelo7');
    expect(lerChave(chave)).toEqual({ id: 'redemoinho', rank: 2, caminhos: [], mods: [], runa: { runa: 'gelo', faixa: 7 } });
    expect(lerChave('redemoinho!agua3')).toBeNull();
    expect(lerChave('redemoinho!fogo11')).toBeNull();
  });

  it('só as skills de classe e as ultimates têm encaixe; a padrão vem da skill ou da classe', () => {
    expect(levaRuna(ctx, 'redemoinho')).toBe(true);
    expect(levaRuna(ctx, 'bola_de_fogo')).toBe(false);
    const g = jogador('guerreiro');
    expect(runaDoAtor(ctx, g, 'redemoinho', 0)?.runa).toBe('fisico');
    expect(runaDoAtor(ctx, g, 'lamina_em_brasa', 0)?.runa).toBe('fogo');
    expect(runaDoAtor(ctx, jogador('aventureiro'), 'mergulho', 0)?.runa).toBe('terra');
    expect(runaDoAtor(ctx, jogador('arqueiro'), 'flecha_perfurante', 0)?.runa).toBe('raio');
    expect(runaDoAtor(ctx, jogador('mago'), 'lanca_de_gelo', 0)?.runa).toBe('gelo');
  });

  it('a fração elemental vai de 20% a 60% pela faixa do vínculo', () => {
    expect(fracaoElemental(r, 0)).toBeCloseTo(r.fracaoMinPct / 100);
    expect(fracaoElemental(r, 10)).toBeCloseTo(r.fracaoMaxPct / 100);
    const h = obter(resolverHabilidade(ctx, 'mergulho!terra5'));
    expect(h.elemento).toBe('terra');
    expect(h.fracaoElemental).toBeCloseTo((r.fracaoMinPct + r.fracaoMaxPct) / 200);
    expect(h.efeitos.some((e) => e.tipo === 'enraizado')).toBe(true);
    const fisica = obter(resolverHabilidade(ctx, 'mergulho!fisico5'));
    expect(fisica.elemento).toBeNull();
    expect(fisica.tags).not.toContain('elemental');
  });

  it('trocar a runa exige vínculo; a runa esfria e o encaixe volta para a padrão', () => {
    const g = jogador('guerreiro');
    const b = obter(g.bolsa);
    expect(escolherRuna(ctx, g, 'redemoinho', 'gelo', 0)).toBe(false);
    for (let i = 0; i < 6; i++) registrarUso(ctx, b, 'gelo', 0);
    expect(runasDisponiveis(ctx, g, 'redemoinho', 0)).toContain('gelo');
    expect(escolherRuna(ctx, g, 'redemoinho', 'gelo', 0)).toBe(true);
    expect(habilidadeDoAtor(ctx, g, 'redemoinho', 0)?.elemento).toBe('gelo');
    // Muitas meias-vidas depois, o uso cai abaixo do mínimo: a runa some, a escolha fica guardada.
    const longe = ticksDe(ctx.balance.vinculo.usoMeiaVidaS * 1000 * 12);
    expect(runaDoAtor(ctx, g, 'redemoinho', longe)?.runa).toBe('fisico');
    expect(b.runas?.redemoinho).toBe('gelo');
    expect(escolherRuna(ctx, g, 'redemoinho', null, 0)).toBe(true);
    expect(b.runas?.redemoinho).toBeUndefined();
    // Skill sem encaixe ou que o personagem não conhece: nada muda.
    expect(escolherRuna(ctx, g, 'bola_de_fogo', 'gelo', 0)).toBe(false);
    expect(escolherRuna(ctx, g, 'lanca_de_gelo', 'gelo', 0)).toBe(false);
  });

  it('a cura ganha a função secundária sem deixar de curar', () => {
    const elementos = CONTEUDO.elementos;
    const base = { ...obter(resolverHabilidade(ctx, 'mergulho')), formulaDano: null, formulaCura: '2d6', efeitos: [], multCura: 1 };
    const sagrada = aplicarRuna(base, 'sagrado', 10, elementos, r);
    expect(sagrada.multCura).toBeCloseTo(1 + r.curaSagradoPct / 100);
    const gelo = aplicarRuna(base, 'gelo', 10, elementos, r);
    expect(gelo.formulaCura).toBe('2d6');
    expect(gelo.efeitos.some((e) => e.tipo === 'escudo')).toBe(true);
    expect(gelo.efeitos.some((e) => e.tipo === 'resfriado')).toBe(false);
  });

  // Marco 40 (13/11/2026, D-160): o bônus de par da ultimate virou o fio do par de elementos (ultimates-m40.test.ts).

  it('o combo com as duas skills na mesma runa bate mais; com runas diferentes, não', () => {
    const estado = criarEstado({ semente: 7, faseId: 'teste' });
    const g = jogador('guerreiro');
    const alvo = criarInimigo(obter(CONTEUDO.presets.get('goblin')), 'a', 3, 2, ctx.balance);
    estado.entidades.push(g, alvo);
    // Marco 40 (D-163): o par é o do Aríete (Investida brutal e depois Terremoto), um combo assinado.
    const terremoto = obter(habilidadeDoAtor(ctx, g, 'salto_esmagador', 0));
    const fazer = () => {
      g.ultimaDePapel = { id: 'investida_de_escudo', papel: 'mobilidade', tick: estado.tick, alvoId: alvo.id, atingidos: 0, abateu: false, alvos: [], miraX: 3, miraY: 2 };
      return comCombosDoLancamento(estado, ctx, g, terremoto, alvo, { x: 3, y: 2 }, []).multDano;
    };
    const mesma = fazer();
    // A investida com runa de gelo: as pontas do combo não combinam mais.
    for (let i = 0; i < 6; i++) registrarUso(ctx, obter(g.bolsa), 'gelo', 0);
    expect(escolherRuna(ctx, g, 'investida_de_escudo', 'gelo', 0)).toBe(true);
    expect(mesma / fazer()).toBeCloseTo(1 + r.parComboPct / 100);
  });

  it('o protocolo só aceita runas conhecidas', () => {
    expect(lerComando({ t: 'escolherRuna', habilidade: 'redemoinho', runa: 'gelo' })).toEqual({ t: 'escolherRuna', habilidade: 'redemoinho', runa: 'gelo' });
    expect(lerComando({ t: 'escolherRuna', habilidade: 'redemoinho', runa: null })).toEqual({ t: 'escolherRuna', habilidade: 'redemoinho', runa: null });
    expect(lerComando({ t: 'escolherRuna', habilidade: 'redemoinho', runa: 'agua' })).toBeNull();
  });
});
