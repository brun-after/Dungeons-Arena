import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { carregarFase, passavel, tipoEm } from '../../src/world/fase';
import { validarFase } from '../../src/world/validacao-fase';

const PASTA_FASES = join(import.meta.dirname, '../../src/data/fases');

const valida = {
  id: 'f',
  nome: 'F',
  ordem: 1,
  tipo: 'campanha',
  mapa: ['##########', '#........#', '#........#', '#.......S#', '##########', '##########', '##########', '##########'],
  spawns: [{ x: 1, y: 1 }],
};

describe('conteúdo oficial (§3.9)', () => {
  const arquivos = readdirSync(PASTA_FASES).filter((a) => a.endsWith('.json'));

  it('existe ao menos uma fase oficial', () => {
    expect(arquivos.length).toBeGreaterThan(0);
  });

  it.each(arquivos)('%s passa na validação', (arquivo) => {
    const json: unknown = JSON.parse(readFileSync(join(PASTA_FASES, arquivo), 'utf8'));
    const r = validarFase(json);
    expect(r.ok ? [] : r.erros).toEqual([]);
  });

  it('ids e ordens das fases oficiais são únicos', () => {
    const fases = arquivos.map((a) => JSON.parse(readFileSync(join(PASTA_FASES, a), 'utf8')) as { id: string; ordem: number });
    expect(new Set(fases.map((f) => f.id)).size).toBe(fases.length);
    expect(new Set(fases.map((f) => f.ordem)).size).toBe(fases.length);
  });
});

describe('validarFase', () => {
  it('aceita uma fase mínima válida', () => {
    expect(validarFase(valida).ok).toBe(true);
  });

  it('recusa entradas que não são fase', () => {
    expect(validarFase(null).ok).toBe(false);
    expect(validarFase([]).ok).toBe(false);
    expect(validarFase({ ...valida, mapa: 'texto' }).ok).toBe(false);
  });

  it('aponta a célula do erro', () => {
    const mapa = [...valida.mapa];
    mapa[2] = '#...X....#';
    const r = validarFase({ ...valida, mapa });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros).toContainEqual({ mensagem: "caractere inválido 'X'", x: 4, y: 2 });
  });

  it('recusa linhas de tamanhos diferentes e mapas fora do limite', () => {
    const torto = [...valida.mapa];
    torto[1] = '#.......#';
    expect(validarFase({ ...valida, mapa: torto }).ok).toBe(false);
    expect(validarFase({ ...valida, mapa: ['####', '#..#', '####'] }).ok).toBe(false);
  });

  it('recusa spawn em parede e saída inalcançável', () => {
    expect(validarFase({ ...valida, spawns: [{ x: 0, y: 0 }] }).ok).toBe(false);
    const mapa = [...valida.mapa];
    mapa[2] = '#.......##';
    mapa[3] = '#......#S#';
    const r = validarFase({ ...valida, mapa });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0]).toMatchObject({ mensagem: 'saída inalcançável a partir do spawn', x: 8, y: 3 });
  });
});

describe('carregarFase', () => {
  it('converte o texto em tipos de célula', () => {
    const r = validarFase(valida);
    if (!r.ok) throw new Error('fase de teste inválida');
    const fase = carregarFase(r.fase);
    expect([fase.largura, fase.altura]).toEqual([10, 8]);
    expect(tipoEm(fase, 0, 0)).toBe('parede');
    expect(tipoEm(fase, 1, 1)).toBe('piso');
    expect(tipoEm(fase, 8, 3)).toBe('saida');
    expect(tipoEm(fase, -1, 0)).toBe('vazio');
    expect(passavel(fase, 8, 3)).toBe(true);
    expect(passavel(fase, 0, 0)).toBe(false);
  });
});
