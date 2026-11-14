// D-173 (14/11/2026): as pendências do marco 40 — a identidade de cada classe nas ultimates, as fusões que mudam a
// forma, as leituras de estilo dos companheiros, a montaria comprada no Mundo e as ressonâncias.
import { describe, expect, it } from 'vitest';
import { CAMPOS_DO_PET, leituraDoPet, passoDoCompanheiro, ritmoDoCompanheiro, type CampoDoPet } from '../../src/combat/pets-estilos';
import { PETS } from '../../src/combat/pets';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { dispararRessonancias, efeitoNaFaixa, ressonanciasDoGolpe } from '../../src/combat/ressonancias';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { entradasDoDiario, registrarDescobertas } from '../../src/progression/diario';
import { vinculoDe } from '../../src/progression/vinculo';
import { aoSerAtingido } from '../../src/combat/movimento-classe';
import { REGISTRO_EFEITOS } from '../../src/combat/registro-efeitos';
import type { EstadoJogo } from '../../src/core/estado';
import type { Entidade } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

describe('as ultimates de cada classe (D-173)', () => {
  it('só o Necromante e o Aventureiro invocam, cada um com as próprias criaturas', () => {
    const criaturas: string[] = [];
    for (const classe of ['necromante', 'aventureiro']) {
      const v = CONTEUDO.veiculos.get(classe);
      expect(v?.invocacoes, classe).toBeDefined();
      expect(v?.etapas, classe).toBeUndefined();
      if (v?.invocacoes) criaturas.push(...Object.values(v.invocacoes));
    }
    expect(new Set(criaturas).size).toBe(6);
    for (const id of criaturas) expect(CONTEUDO.presets.get(id)?.invocacao, id).toBeDefined();
  });

  it('o Mago, o Guerreiro e o Arqueiro trocam a invocação por etapas próprias', () => {
    const etapas: string[] = [];
    for (const classe of ['mago', 'guerreiro', 'arqueiro']) {
      const v = CONTEUDO.veiculos.get(classe);
      expect(v?.invocacoes, classe).toBeUndefined();
      expect(v?.etapas, classe).toBeDefined();
      if (v?.etapas) etapas.push(...Object.values(v.etapas));
    }
    expect(new Set(etapas).size).toBe(9);
    for (const id of etapas) expect(CONTEUDO.definicoes.get(id)?.interna, id).toBe(true);
  });
});

describe('os companheiros leem os estilos do dono (D-173)', () => {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const tabela = ctx.balance.ajustesClasses.aventureiro.estilosDosPets ?? {};
  /** O Aventureiro no nível 100 com o par de atributos de um estilo no máximo. */
  function dono(estilo?: string): Entidade {
    const j = criarJogador(obter(CONTEUDO.classes.get('aventureiro')), 'd', 2, 2, ctx.balance);
    const b = obter(j.bolsa);
    j.nivel = 100;
    const e = (CONTEUDO.estilos.get('aventureiro') ?? []).find((x) => x.id === estilo);
    const atributos = { ...b.atributosBase };
    for (const a of Object.keys(e?.pesos ?? {}) as (keyof typeof atributos)[]) atributos[a] = 100;
    b.atributosBase = atributos;
    j.atributos = { ...atributos };
    return j;
  }

  it('os cinco estilos têm uma leitura para cada companheiro', () => {
    expect(Object.keys(tabela).sort()).toEqual((CONTEUDO.estilos.get('aventureiro') ?? []).map((e) => e.id).sort());
    for (const porPet of Object.values(tabela)) for (const pet of PETS) expect(Object.keys(porPet[pet] ?? {}).length, pet).toBeGreaterThan(0);
    for (const porPet of Object.values(tabela)) for (const campos of Object.values(porPet)) for (const c of Object.keys(campos ?? {})) expect(CAMPOS_DO_PET).toContain(c);
  });

  it('a leitura cresce com o estilo e é zero sem ele', () => {
    const sem = dono();
    for (const [estilo, porPet] of Object.entries(tabela)) {
      const com = dono(estilo);
      for (const pet of PETS) {
        for (const campo of Object.keys(porPet[pet] ?? {}) as CampoDoPet[]) {
          expect(leituraDoPet(ctx, com, pet, campo), `${estilo} ${pet} ${campo}`).toBeGreaterThan(leituraDoPet(ctx, sem, pet, campo));
        }
      }
    }
  });

  it('o companheiro do Mestre de Feras ataca mais vezes e o do Batedor anda mais rápido', () => {
    const d = dono('mestre_de_feras');
    const falcao = { ...dono(), id: 'f', preset: 'falcao_companheiro', invocacao: { donoId: d.id, companheiro: true } } as unknown as Entidade;
    const estado = { entidades: [d, falcao] } as unknown as EstadoJogo;
    expect(ritmoDoCompanheiro(estado, ctx, falcao)).toBeGreaterThan(1);
    expect(ritmoDoCompanheiro(estado, ctx, d)).toBe(1);
    const b = dono('batedor');
    const lobo = { ...falcao, preset: 'lobo_companheiro', invocacao: { donoId: b.id, companheiro: true } } as unknown as Entidade;
    expect(passoDoCompanheiro({ entidades: [b, lobo] } as unknown as EstadoJogo, ctx, lobo)).toBeGreaterThan(1);
  });
});

describe('a montaria alugada no Mundo (D-173)', () => {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  it('é um item das lojas das vilas que dá o efeito de montaria por um tempo', () => {
    const item = obter(CONTEUDO.itens.get('montaria_de_aluguel'));
    expect(item.tipo).toBe('consumivel');
    expect(item.efeitos[0]).toMatchObject({ tipo: 'montaria' });
    expect(obter(item.efeitos[0]).duracaoMs).toBeGreaterThanOrEqual(300_000);
    expect(REGISTRO_EFEITOS.montaria.velocidade).toBe(true);
  });

  it('apeia ao levar dano', () => {
    const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'm', 2, 2, ctx.balance);
    const estado = { tick: 0, entidades: [j] } as unknown as EstadoJogo;
    j.efeitos = [{ tipo: 'montaria', ateTick: 9999, valor: 0, pct: 60, origemId: j.id } as unknown as Entidade['efeitos'][number]];
    aoSerAtingido(estado, j, []);
    expect(j.efeitos.some((f) => f.tipo === 'montaria')).toBe(false);
  });
});

describe('as ressonâncias (D-173)', () => {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  it('são 30, uma por par do Códex, cada uma com o efeito dela', () => {
    expect(CONTEUDO.ressonancias.size).toBe(30);
    const porEixo = new Map<string, number>();
    for (const r of CONTEUDO.ressonancias.values()) {
      expect(r.id).toBe(`${r.eixo}_${r.elemento}`);
      expect(r.nome.length).toBeGreaterThan(0);
      porEixo.set(r.eixo, (porEixo.get(r.eixo) ?? 0) + 1);
    }
    expect(porEixo.size).toBe(9);
    expect(entradasDoDiario(ctx).filter((e) => e.tipo === 'ressonancia')).toHaveLength(30);
  });

  it('o efeito cresce com a faixa e a duração tem piso', () => {
    const r = obter(CONTEUDO.ressonancias.get('sustento_terra'));
    const fraca = efeitoNaFaixa(r.efeito, 3, 50);
    const plena = efeitoNaFaixa(r.efeito, 10, 50);
    expect(plena.valor).toBe(r.efeito.valor);
    expect(fraca.valor).toBeLessThan(plena.valor);
    expect(fraca.duracaoMs).toBeGreaterThanOrEqual(r.efeito.duracaoMs / 2);
    expect(plena.duracaoMs).toBe(r.efeito.duracaoMs);
  });

  it('dispara no golpe com a forma do eixo e a sintonia do elemento, uma vez por recarga, e entra no diário', () => {
    const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 2, 2, ctx.balance);
    const alvo = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'a', 3, 2, ctx.balance);
    alvo.equipe = 'outra';
    const b = obter(j.bolsa);
    b.runas = {};
    b.barra = b.barra.map(() => 'bola_de_fogo');
    // A sintonia vem da barra: o mago com skills de fogo na barra.
    const estado = { tick: 100, entidades: [j, alvo], recargas: {} } as unknown as EstadoJogo;
    const fogo = Math.round(vinculoDe(ctx, j, estado.tick).fogo * 10);
    const hab = { ...obter(resolverHabilidade(ctx, 'bola_de_fogo')), formas: [{ mod: 'maior_e_mais_lenta' as const, faixa: 10 }] };
    const achadas = ressonanciasDoGolpe(ctx, j, hab, estado.tick);
    expect(fogo).toBeGreaterThanOrEqual(ctx.balance.habilidades.ressonancias.faixaMin);
    if (fogo >= ctx.balance.habilidades.ressonancias.faixaMin) {
      expect(achadas.map((x) => x.r.id)).toEqual(['area_fogo']);
      expect(achadas[0]?.faixa).toBe(Math.min(10, fogo));
      const saida: EventoSimulacao[] = [];
      dispararRessonancias(estado, ctx, j, alvo, hab, saida);
      expect(saida.filter((e) => e.t === 'ressonancia')).toHaveLength(1);
      dispararRessonancias(estado, ctx, j, alvo, hab, saida);
      expect(saida.filter((e) => e.t === 'ressonancia')).toHaveLength(1);
      const novas: EventoSimulacao[] = [];
      registrarDescobertas(estado, ctx, saida, novas);
      expect(b.diario).toContain('ressonancia:area_fogo');
    } else {
      expect(achadas).toEqual([]);
    }
    // Sem a forma do eixo, nada.
    expect(ressonanciasDoGolpe(ctx, j, { ...hab, formas: [] }, estado.tick)).toEqual([]);
  });
});
