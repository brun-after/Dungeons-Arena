// D-173 (14/11/2026): as pendências do marco 40 — a identidade de cada classe nas ultimates, as fusões que mudam a
// forma, as leituras de estilo dos companheiros, a montaria comprada no Mundo e as ressonâncias.
import { describe, expect, it } from 'vitest';
import { CAMPOS_DO_PET, leituraDoPet, passoDoCompanheiro, ritmoDoCompanheiro, type CampoDoPet } from '../../src/combat/pets-estilos';
import { PETS } from '../../src/combat/pets';
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
