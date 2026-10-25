// Marco 24 (24/10/2026, D-096): as 4 sinergias passivas e as 12 ressonâncias novas (com os momentos da ultimate e do combo).
import { describe, expect, it } from 'vitest';
import { chaveRecarga } from '../../src/combat/acao';
import { somarCarga } from '../../src/combat/carga-ultimate';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { aoFecharSequencia, efeitoDaSinergia, escudoDoFluxo, processarSinergiasPassivas } from '../../src/combat/sinergias-passivas';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import type { Atributos, Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { dispararGanchosDe, dispararGanchosDosEventos, passivosDe } from '../../src/progression/ganchos-do-portador';
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
  it('os dados: 4 sinergias e 24 ressonâncias', () => {
    expect(CONTEUDO.sinergias.map((s) => s.id).sort()).toEqual(['avalanche_humana', 'bastiao_de_pedra', 'disciplina_ferrea', 'fluxo_de_cura']);
    expect(CONTEUDO.ressonancias.size).toBe(24);
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

describe('ressonâncias novas (D-096)', () => {
  it('Gladiador, Maestro e Eco ancestral pelos eventos do tick', () => {
    const c = cena('guerreiro', { forca: 13, destreza: 13, constituicao: 13, inteligencia: 14, carisma: 14, sabedoria: 13 });
    dispararGanchosDosEventos(c.estado, c.ctx, [{ t: 'ultimateUsada', tick: 0, id: 'j', ultimateId: 'x', acaoId: 1 }], c.eventos);
    expect(c.tem(c.j, 'escudo')).toBe(true);
    dispararGanchosDosEventos(c.estado, c.ctx, [{ t: 'comboFeito', tick: 0, id: 'j', combo: 'moedor', alvoId: null }], c.eventos);
    expect(c.j.cargaUltimate).toBeGreaterThanOrEqual(8);
    dispararGanchosDosEventos(c.estado, c.ctx, [{ t: 'ultimateCheia', tick: 0, id: 'j' }], c.eventos);
    expect(c.j.classeSemMana).toBe(true);
  });

  it('Comandante: o abate enche a ultimate dos aliados; Senhor da guerra: a ultimate fortalece os aliados', () => {
    const c = cena('guerreiro', { forca: 14, carisma: 14, constituicao: 13 });
    dispararGanchosDe(c.estado, c.ctx, c.j, 'aoMatar', { outro: c.b }, c.eventos);
    expect(c.aliado.cargaUltimate).toBe(10);
    expect(c.j.cargaUltimate ?? 0).toBe(0);
    dispararGanchosDe(c.estado, c.ctx, c.j, 'aoUsarUltimate', {}, c.eventos);
    expect(c.tem(c.aliado, 'bonus_dano')).toBe(true);
  });

  it('Oráculo e Sobrevivente aceleram a carga; Resiliente encurta os estados; Engenhoso atravessa', () => {
    const c = cena('mago', { inteligencia: 14, sabedoria: 14, carisma: 13, destreza: 14, constituicao: 14 });
    somarCarga(c.ctx, c.j, 10, 0, c.eventos);
    expect(c.j.cargaUltimate).toBeCloseTo(11.5);
    c.j.hp = 1;
    somarCarga(c.ctx, c.j, 10, 0, c.eventos);
    expect(c.j.cargaUltimate).toBeCloseTo(11.5 + 23);
    aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('atordoar', { duracaoMs: 1000 }), { id: 'b', x: 4, y: 5 }, null, c.eventos);
    expect(c.j.efeitos.find((f) => f.tipo === 'atordoar')?.ateTick).toBe(ticksDe(750));
    expect(passivosDe(c.ctx, c.j).atravessaMagico).toBe(1);
  });

  it('Ímpeto: crítico corpo a corpo tira 0,5 s da recarga das skills de classe; Arcano preciso expõe no crítico mágico', () => {
    const c = cena('guerreiro', { forca: 14, destreza: 14, inteligencia: 13, sabedoria: 13 });
    c.estado.recargas[chaveRecarga('j', 'redemoinho')] = ticksDe(5000);
    dispararGanchosDe(c.estado, c.ctx, c.j, 'aoCritico', { outro: c.b, hab: c.hab('ataque_basico') }, c.eventos);
    expect(c.estado.recargas[chaveRecarga('j', 'redemoinho')]).toBe(ticksDe(4500));
    dispararGanchosDe(c.estado, c.ctx, c.j, 'aoCritico', { outro: c.b, hab: c.hab('seta_arcana') }, c.eventos);
    expect(c.tem(c.b, 'exposto')).toBe(true);
  });
});
