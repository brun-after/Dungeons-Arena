// Marco 10A-2 (14/10/2026): geração procedural (§2.1) e sequência da campanha com fases geradas, D-053.

import { describe, expect, it } from 'vitest';
import campanha from '../../src/data/campanha.json';
import { lerRegistro, VERSAO_SCHEMA, type RefFase } from '../../src/save/esquema';
import { proximaFase } from '../../src/save/sequencia';
import { carregarFase, tipoEm } from '../../src/world/fase';
import { catalogoDeGeracao, dimensoes, gerarFase, type ParametrosGeracao } from '../../src/world/gerador';
import { alcancaveis } from '../../src/world/navegacao';
import { validarFase } from '../../src/world/validacao-fase';
import { criarBotAleatorio, rodar } from '../sim/harness';
import { criarEstado } from '../../src/core/estado';
import { criarJogador } from '../../src/entities/fabrica';
import { povoarFase } from '../../src/world/populacao';
import { CONTEUDO, contexto } from '../apoio/fases';

const CATALOGO = catalogoDeGeracao(CONTEUDO, campanha.geradas.estoque);
const PRESETS = new Set(CONTEUDO.presets.keys());

const params = (semente: number, salas = 8, extra: Partial<ParametrosGeracao> = {}): ParametrosGeracao => ({
  id: `g${semente}`,
  nome: 'Teste',
  semente,
  salas,
  nivelInimigos: 4,
  matizGraus: 56,
  largura: 60,
  altura: 40,
  ...extra,
});

function validada(p: ParametrosGeracao) {
  const r = validarFase(gerarFase(p, CATALOGO), PRESETS, CONTEUDO.itens);
  if (!r.ok) throw new Error(`semente ${p.semente}: ${JSON.stringify(r.erros.slice(0, 3))}`);
  return carregarFase(r.fase);
}

describe('gerador de fases (§2.1)', () => {
  it('200 sementes geram fases válidas: boss na última sala, saída trancada por ele, tudo alcançável', () => {
    for (let semente = 1; semente <= 200; semente++) {
      const fase = validada(params(semente, 4 + (semente % 9)));
      const spawn = fase.spawns[0];
      if (!spawn) throw new Error('sem spawn');
      const alcance = alcancaveis(fase, spawn);
      const s = fase.portaSaida;
      if (!s) throw new Error(`semente ${semente}: sem saída`);
      expect(alcance[s.y * fase.largura + s.x]).toBe(1);
      for (const i of fase.inimigos) expect(alcance[i.y * fase.largura + i.x]).toBe(1);
      if (s.tranca === 'boss') expect(fase.inimigos[s.bossIndice ?? -1]?.preset).toBe('boss');
      expect(fase.objetos.some((o) => o.tipo === 'loja')).toBe(true);
      expect(fase.inimigos.every((i) => i.nivel === 4)).toBe(true);
      expect(fase.matizGraus).toBe(56);
    }
  });

  it('a mesma semente dá a mesma fase; sementes diferentes, fases diferentes', () => {
    expect(gerarFase(params(7), CATALOGO)).toEqual(gerarFase(params(7), CATALOGO));
    expect(gerarFase(params(7), CATALOGO).mapa).not.toEqual(gerarFase(params(8), CATALOGO).mapa);
  });

  it('com 10 salas ou mais, há portas internas distantes; com poucas, sem boss e saída livre', () => {
    let comPortas = 0;
    for (let semente = 1; semente <= 30; semente++) {
      const fase = validada(params(semente, 14));
      for (const p of fase.portasInternas) {
        comPortas++;
        expect(Math.max(Math.abs(p.a.x - p.b.x), Math.abs(p.a.y - p.b.y))).toBeGreaterThanOrEqual(10);
      }
    }
    expect(comPortas).toBeGreaterThan(0);
    const pequena = validada(params(3, 2));
    expect(pequena.inimigos.some((i) => i.preset === 'boss')).toBe(false);
    expect(pequena.portaSaida?.tranca).toBe('livre');
  });

  it('sem dimensões, usa a fórmula da área; com elas, respeita o tamanho', () => {
    expect(dimensoes({ id: 'x', nome: 'x', semente: 1, salas: 8, nivelInimigos: 1, matizGraus: 0 })).toEqual({ largura: 26, altura: 18 });
    const fase = validada(params(1));
    expect([fase.largura, fase.altura]).toEqual([60, 40]);
    let saidas = 0;
    for (let y = 0; y < fase.altura; y++) for (let x = 0; x < fase.largura; x++) if (tipoEm(fase, x, y) === 'saida') saidas++;
    expect(saidas).toBe(1);
  });

  it('o harness roda 3.000 ticks numa fase gerada sem violar invariantes', () => {
    const ctx = contexto(validada(params(11)));
    const estado = criarEstado({ semente: 11, faseId: 'g11' });
    const classe = CONTEUDO.classes.get('aventureiro');
    if (!classe) throw new Error('classe');
    const spawn = ctx.fase.spawns[0] ?? { x: 1, y: 1 };
    estado.entidades.push(criarJogador(classe, 'j1', spawn.x, spawn.y, ctx.balance));
    povoarFase(estado, ctx);
    rodar({ estado, ctx }, 3_000, criarBotAleatorio(4));
    expect(estado.tick).toBe(3_000);
  });
});

describe('sequência da campanha', () => {
  const seguinte = (ref: RefFase) => proximaFase(ref, campanha.fases, campanha.geradas, 20);

  it('as oficiais vêm na ordem; depois da última, fases geradas que pioram uma a uma', () => {
    expect(seguinte({ tipo: 'oficial', id: 'fase-01' })).toEqual({ tipo: 'oficial', id: 'fase-02' });
    const g1 = seguinte({ tipo: 'oficial', id: 'fase-02' });
    if (g1?.tipo !== 'gerada') throw new Error('esperava gerada');
    expect(g1).toMatchObject({ id: 'gerada-1', numero: 1, params: { nome: 'Profundezas 1', nivelInimigos: 4, matizGraus: 28, largura: 60, altura: 40 } });
    expect(g1.params.salas).toBeGreaterThanOrEqual(6);
    expect(g1.params.salas).toBeLessThanOrEqual(9);
    const g2 = seguinte(g1);
    if (g2?.tipo !== 'gerada') throw new Error('esperava gerada');
    expect(g2.params).toMatchObject({ nome: 'Profundezas 2', nivelInimigos: 5, matizGraus: 56 });
    expect(g2.params.salas - g1.params.salas).toBeGreaterThanOrEqual(0);
    expect(g2.params.salas - g1.params.salas).toBeLessThanOrEqual(3);
    expect(seguinte(g1)).toEqual(g2);
    expect(seguinte({ tipo: 'aventura', id: 'x' })).toBeNull();
  });

  it('o nível para em 20 e o matiz dá a volta', () => {
    let ref: RefFase | null = { tipo: 'oficial', id: 'fase-02' };
    for (let i = 0; i < 30 && ref; i++) ref = seguinte(ref);
    if (ref?.tipo !== 'gerada') throw new Error('esperava gerada');
    expect(ref.params.nivelInimigos).toBe(20);
    expect(ref.params.matizGraus).toBeLessThan(360);
    expect(ref.params.salas).toBeLessThanOrEqual(campanha.geradas.salasMax);
  });

  it('a referência gerada vai e volta pelo save; parâmetros inválidos são recusados', () => {
    const g1 = seguinte({ tipo: 'oficial', id: 'fase-02' });
    const ctx = contexto(validada(params(5)));
    const estado = criarEstado({ semente: 1, faseId: 'gerada-1' });
    const classe = CONTEUDO.classes.get('aventureiro');
    if (!classe || !g1) throw new Error('faltou algo');
    estado.entidades.push(criarJogador(classe, 'j1', 2, 2, ctx.balance));
    const registro = { versaoSchema: VERSAO_SCHEMA, slot: 1, criadoEm: 1, atualizadoEm: 2, faseRef: g1, nomeFase: 'Profundezas 1', estado, estatisticas: {}, fasesVisitadas: {} };
    const lido = lerRegistro(JSON.parse(JSON.stringify(registro)));
    if (!lido.ok) throw new Error(lido.erro);
    expect(lido.registro.faseRef).toEqual(g1);
    const ruim = { ...registro, faseRef: { ...g1, params: { ...(g1.tipo === 'gerada' ? g1.params : {}), salas: 0 } } };
    expect(lerRegistro(JSON.parse(JSON.stringify(ruim)))).toEqual({ ok: false, erro: 'fase' });
  });
});
