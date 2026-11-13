// Marco 40 (13/11/2026, D-161): as mecânicas que fazem as leituras de estilo, as fusões e as famílias cumprirem o que
// prometem — o efeito ao abater, o medo dos feridos, a armadilha que rearma e protege o aliado, a área ampliada, o eco
// das magias, a área que salta e a invocação que explode ao cair.
import { describe, expect, it } from 'vitest';
import { comBuffsDeLeitura } from '../../src/combat/buffs-de-leitura';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { aplicarEfeito, processarEfeitos, sofrerDano } from '../../src/combat/efeitos';
import { chaveDoAtor } from '../../src/combat/perfil';
import { armarArmadilha, dispararArmadilha } from '../../src/combat/efeitos-fluxo';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarEntidade } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const hab = (chave: string) => obter(resolverHabilidade(ctx, chave));

function cena() {
  const estado = criarEstado({ semente: 3, faseId: ctx.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get('arqueiro')), 'j', 3, 3, ctx.balance);
  const inimigo = criarEntidade({ id: 'i', tipo: 'inimigo', x: 5, y: 3, hpMax: 100, nivel: 1, xpBase: 10 });
  estado.entidades.push(j, inimigo);
  return { estado, j, inimigo };
}

describe('as promessas das leituras (D-161)', () => {
  it('a leitura muda a própria skill: saltos, área em linha, ininterrupta e efeitos ao abater', () => {
    expect(hab('flecha_explosiva^encadear10&atirador10').saltos?.quantidade).toBe(2);
    expect(hab('flecha_explosiva^atravessar10&mira_firme10').tipoArea).toBe('linha');
    expect(hab('flecha_explosiva^sustento10&inabalavel10').interrupcao).toBe('ininterrupta');
    expect(hab('desafio^grupo10&comandante10').aoAbater?.some((e) => e.tipo === 'cura' && e.em === 'aliados')).toBe(true);
    expect(hab('levante_profano^invocacao10&senhor_da_horda10').efeitos.find((e) => e.tipo === 'invocar_temporario')?.valor).toBe(3);
  });

  it('o medo só pega nos feridos', () => {
    const { estado, j, inimigo } = cena();
    inimigo.hp = 80;
    aplicarEfeito(estado, ctx, inimigo, construirEfeito('apavorar', { pct: 30, duracaoMs: 1500 }), { id: j.id, x: j.x, y: j.y }, null, []);
    expect(inimigo.efeitos.some((f) => f.tipo === 'aterrorizado')).toBe(false);
    inimigo.hp = 20;
    aplicarEfeito(estado, ctx, inimigo, construirEfeito('apavorar', { pct: 30, duracaoMs: 1500 }), { id: j.id, x: j.x, y: j.y }, null, []);
    expect(inimigo.efeitos.some((f) => f.tipo === 'aterrorizado')).toBe(true);
  });

  it('a armadilha da Vigia rearma uma vez e dá escudo ao aliado que pisa', () => {
    const { estado, j, inimigo } = cena();
    const vigia = hab('vigia^ecoar10&implacavel10');
    const ef = obter(vigia.efeitos.find((e) => e.tipo === 'armadilha'));
    expect(ef.pct).toBe(1);
    const saida: EventoSimulacao[] = [];
    armarArmadilha(estado, ctx, j, ef, { x: 5, y: 3 }, saida);
    const a = obter(estado.armadilhas[0]);
    const nada = () => undefined;
    expect(dispararArmadilha(estado, ctx, a, inimigo, nada, saida)).toBe(false);
    expect(dispararArmadilha(estado, ctx, a, inimigo, nada, saida)).toBe(true);
    // Uma segunda armadilha na mesma célula vai na seguinte da linha.
    armarArmadilha(estado, ctx, j, ef, { x: 5, y: 3 }, saida);
    expect(estado.armadilhas.some((x) => x.x === 6 && x.y === 3)).toBe(true);
    const escudo = obter(hab('vigia^sustento10&sobrevivente10').efeitos.find((e) => e.tipo === 'armadilha')).aliado;
    expect(escudo?.tipo).toBe('escudo');
  });

  it('a área ampliada cresce a próxima magia de área; o eco faz a magia repetir', () => {
    const { j } = cena();
    const nova = hab('nova_glacial');
    j.efeitos.push({ ...construirEfeito('area_ampliada', { valor: 1, duracaoMs: 8000 }), ateTick: 999, proximoTick: 0, inicioTick: 0, acumulos: 1, origemId: j.id });
    expect(comBuffsDeLeitura(j, nova, 0).raioArea).toBe(nova.raioArea + 1);
    j.efeitos = [{ ...construirEfeito('ecoando', { pct: 40, duracaoMs: 8000 }), ateTick: 999, proximoTick: 0, inicioTick: 0, acumulos: 1, origemId: j.id }];
    const ecos = (h: typeof nova) => h.efeitos.filter((e) => e.tipo === 'efeito_atrasado').length;
    expect(ecos(comBuffsDeLeitura(j, nova, 0))).toBe(ecos(nova) + 1);
  });

  it('o Exército em fúria marca as invocações para explodir ao cair; a fusão área + alvos salta', () => {
    expect(hab('ult_exercito_em_furia').efeitos.some((e) => e.tipo === 'explodir_ao_cair' && e.em === 'aliados')).toBe(true);
    expect(hab('ult_aniquilacao#fogo6.gelo3*area.alvos6!fogo6').saltos?.quantidade).toBe(1);
  });

  it('a Mortalha do Ceifador vira sombra quando o escudo quebra', () => {
    const { estado, j } = cena();
    const ef = obter(hab('mortalha_funebre^ecoar10&ceifador10').efeitos.find((e) => e.tipo === 'escudo' && e.interno));
    aplicarEfeito(estado, ctx, j, ef, { id: j.id, x: j.x, y: j.y }, null, []);
    sofrerDano(j, 3, estado.tick);
    expect(j.aoQuebrarEscudo).toBeUndefined();
    sofrerDano(j, 50, estado.tick);
    expect(j.aoQuebrarEscudo?.[0]?.tipo).toBe('fase');
    processarEfeitos(estado, ctx, []);
    expect(estado.fases?.some((f) => f.chave.startsWith('leitura_sombra'))).toBe(true);
  });

  it('o Contragolpe devolve o que a casca absorveu', () => {
    const { estado, j, inimigo } = cena();
    const origem = { id: j.id, x: j.x, y: j.y };
    aplicarEfeito(estado, ctx, j, construirEfeito('guardar_absorvido', { duracaoMs: 3500 }), origem, null, []);
    aplicarEfeito(estado, ctx, j, construirEfeito('escudo', { valor: 20, duracaoMs: 3000 }), origem, null, []);
    sofrerDano(j, 10, estado.tick);
    const antes = inimigo.hp;
    aplicarEfeito(estado, ctx, inimigo, construirEfeito('devolver_absorvido', { pct: 60 }), origem, null, []);
    expect(antes - inimigo.hp).toBe(6);
  });

  it('a Investida do Duelista volta ao ponto de partida', () => {
    const { estado, j } = cena();
    const retorno = obter(hab('investida_de_escudo^ecoar10&duelista10').efeitos.find((e) => e.interno?.tipo === 'retornar'));
    expect(retorno.em).toBe('conjurador');
    j.x = 6;
    aplicarEfeito(estado, ctx, j, construirEfeito('retornar', {}), { id: j.id, x: 3, y: 3 }, null, []);
    expect([j.x, j.y]).toEqual([3, 3]);
  });

  it('o Comando do Ceifador salta até o alvo e golpeia', () => {
    const { estado, j, inimigo } = cena();
    inimigo.x = 7;
    j.alvoSelecionado = inimigo.id;
    const ef = obter(hab('comando_sepulcral^ecoar10&ceifador10').efeitos.find((e) => e.tipo === 'saltar_ao_alvo'));
    aplicarEfeito(estado, ctx, j, ef, { id: j.id, x: j.x, y: j.y }, null, []);
    expect(j.x).toBeGreaterThan(3);
    expect(estado.fases?.some((f) => f.chave.startsWith('leitura_golpe_ceifador'))).toBe(true);
  });

  it('a onda do Brado rúnico leva a runa do Brado', () => {
    const g = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'g', 3, 3, ctx.balance);
    expect(chaveDoAtor(ctx, g, 'leitura_onda_runa', 0)).toMatch(/!/);
  });
});
