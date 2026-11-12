// Marco 24 (24/10/2026, D-096): as 4 sinergias passivas. Marco 39 (D-147): as ressonâncias deram lugar aos estilos.
import { describe, expect, it } from 'vitest';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { aoFecharSequencia, efeitoDaSinergia, escudoDoFluxo, processarSinergiasPassivas } from '../../src/combat/sinergias-passivas';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import type { Atributos, Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { dispararGanchosDe } from '../../src/progression/ganchos-do-portador';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena(classe = 'guerreiro', atributos: Partial<Atributos> = {}, passivas: string[] = []) {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 23, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 3, 5, ctx.balance);
  j.atributos = { ...j.atributos, ...atributos };
  const bolsa = obter(j.bolsa);
  for (const id of passivas) bolsa.conhecidas.push({ id, rank: 1, caminhos: [] });
  bolsa.passivasAtivas = passivas;
  const aliado = criarJogador(obter(CONTEUDO.classes.get('mago')), 'a', 4, 6, ctx.balance);
  const b = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'b', 4, 5, ctx.balance);
  const v = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'v', 5, 5, ctx.balance);
  estado.entidades.push(j, aliado, b, v);
  const eventos: EventoSimulacao[] = [];
  const hab = (id: string) => obter(habilidadeDoAtor(ctx, j, id), id);
  const tem = (e: Entidade, tipo: string) => e.efeitos.some((f) => f.tipo === tipo && f.ateTick > estado.tick);
  return { ctx, estado, j, aliado, b, v, eventos, hab, tem };
}

describe('sinergias passivas (D-096)', () => {
  it('os dados: 4 sinergias e 5 estilos por classe (marco 39: os estilos substituem as ressonâncias)', () => {
    expect(CONTEUDO.sinergias.map((s) => s.id).sort()).toEqual(['avalanche_humana', 'bastiao_de_pedra', 'disciplina_ferrea', 'fluxo_de_cura']);
    for (const classe of CONTEUDO.classes.keys()) expect(CONTEUDO.estilos.get(classe)).toHaveLength(5);
  });

  it('Disciplina férrea: com a passiva ligada, o Golpe atordoante atordoa +0,5 s', () => {
    const atordoa = construirEfeito('atordoar', { duracaoMs: 1000 });
    const sem = cena();
    expect(efeitoDaSinergia(sem.ctx, sem.j, sem.hab('golpe_atordoante'), atordoa).duracaoMs).toBe(1000);
    const com = cena('guerreiro', {}, ['disciplina_marcial']);
    expect(efeitoDaSinergia(com.ctx, com.j, com.hab('golpe_atordoante'), atordoa).duracaoMs).toBe(1500);
    expect(efeitoDaSinergia(com.ctx, com.j, com.hab('investida'), atordoa).duracaoMs).toBe(1000);
  });

  it('Fluxo de cura: o escudo do Fluxo restaurador vindo do Curar vale o dobro', () => {
    const c = cena('guerreiro', {}, ['fluxo_restaurador']);
    expect(escudoDoFluxo(c.ctx, c.j, c.hab('curar'))).toBe(2);
    expect(escudoDoFluxo(c.ctx, c.j, c.hab('barreira'))).toBe(1);
  });

  it('Avalanche humana: Investida e depois Golpe atordoante atordoa em volta do alvo', () => {
    const c = cena('guerreiro', {}, ['tenacidade']);
    aoFecharSequencia(c.estado, c.ctx, c.j, c.b, c.hab('golpe_atordoante'), 'investida', 0, c.eventos);
    expect(c.tem(c.v, 'atordoar')).toBe(true);
    expect(c.eventos.some((e) => e.t === 'sinergiaPassiva' && e.sinergia === 'avalanche_humana')).toBe(true);
    const tarde = cena('guerreiro', {}, ['tenacidade']);
    tarde.estado.tick = ticksDe(5000);
    aoFecharSequencia(tarde.estado, tarde.ctx, tarde.j, tarde.b, tarde.hab('golpe_atordoante'), 'investida', 0, tarde.eventos);
    expect(tarde.tem(tarde.v, 'atordoar')).toBe(false);
  });

  it('Bastião de pedra: junto da própria muralha, recupera vida a cada segundo', () => {
    const c = cena('guerreiro', {}, ['pele_de_pedra']);
    c.j.hp = 10;
    c.estado.camposTaticos = [{ id: 1, tipo: 'muralha', donoId: 'j', equipe: c.j.equipe, x: 3, y: 4, raio: 0, ateTick: 1000, proximoPulso: 0, intervaloTicks: ticksDe(1000), efeito: null }];
    processarSinergiasPassivas(c.estado, c.ctx, c.eventos);
    expect(c.j.hp).toBe(12);
  });
});

describe('mecânicas dos estilos pelos ganchos (marco 39: substituem as ressonâncias)', () => {
  it('Comandante cheio: o abate enche a ultimate dos aliados em 10 (a força da ponta)', () => {
    const c = cena('guerreiro', { carisma: 100, constituicao: 100 });
    const bolsa = obter(c.j.bolsa);
    bolsa.atributosBase = { ...bolsa.atributosBase, carisma: 100, constituicao: 100 };
    dispararGanchosDe(c.estado, c.ctx, c.j, 'aoMatar', { outro: c.b }, c.eventos);
    expect(c.aliado.cargaUltimate).toBe(10);
    expect(c.j.cargaUltimate ?? 0).toBe(0);
  });
});
