// D-071 (17/10/2026): cura por abate e retirada do chefe, no mesmo núcleo da campanha e da arena.
import { describe, expect, it } from 'vitest';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { ticksDe } from '../../src/core/tempo';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { processarMortes } from '../../src/progression/morte';
import { regenerarRecursos } from '../../src/progression/recursos';
import { processarIa } from '../../src/entities/ia';
import { registrarParticipacao } from '../../src/combat/participacao';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function cena(preset = 'goblin') {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 42, faseId: 'teste' });
  const classe = CONTEUDO.classes.get('aventureiro');
  const modelo = CONTEUDO.presets.get(preset);
  if (!classe || !modelo) throw new Error('conteúdo ausente');
  const j = criarJogador(classe, 'j', 1, 1, ctx.balance);
  const npc = criarInimigo(modelo, 'npc', 10, 10, ctx.balance);
  npc.hpMax = 100;
  npc.hp = 20;
  estado.entidades.push(j, npc);
  return { ctx, estado, j, npc };
}

describe('recuperação por abate', () => {
  it.each(['goblin', 'boss'])('%s recupera metade da vida perdida uma única vez', (preset) => {
    const c = cena(preset);
    c.j.hp = 0;
    registrarParticipacao(c.j, c.npc.id, c.estado.tick, c.ctx);
    const eventos: EventoSimulacao[] = [];
    processarMortes(c.estado, c.ctx, eventos);
    expect(c.npc.hp).toBe(60);
    expect(eventos).toContainEqual(expect.objectContaining({ t: 'efeitoResultado', alvoId: c.npc.id, tipo: 'cura', cura: 40 }));
    processarMortes(c.estado, c.ctx, []);
    expect(c.npc.hp).toBe(60);
  });

  it('o golpe fatal no mesmo tick pertence ao último agressor, não à ordem alfabética', () => {
    const c = cena();
    registrarParticipacao(c.j, 'a-outro', 0, c.ctx);
    registrarParticipacao(c.j, c.npc.id, 0, c.ctx);
    c.j.hp = 0;
    processarMortes(c.estado, c.ctx, []);
    expect(c.npc.hp).toBe(60);
  });

  it('morte simultânea não ressuscita o NPC', () => {
    const c = cena();
    c.npc.hp = c.j.hp = 0;
    registrarParticipacao(c.j, c.npc.id, 0, c.ctx);
    processarMortes(c.estado, c.ctx, []);
    expect(c.npc.hp).toBe(0);
    expect(c.npc.morto).toBe(true);
  });

  it('jogador que abate não recebe a recuperação de NPC', () => {
    const c = cena();
    c.j.hp = 10;
    c.npc.hp = 0;
    c.npc.xpBase = 0;
    registrarParticipacao(c.npc, c.j.id, 0, c.ctx);
    processarMortes(c.estado, c.ctx, []);
    expect(c.j.hp).toBe(10);
  });

  it('NPC aliado do jogador não ganha a cura de inimigo', () => {
    const c = cena();
    const modelo = CONTEUDO.presets.get('goblin');
    if (!modelo) throw new Error('conteúdo ausente');
    const alvo = criarInimigo(modelo, 'alvo', 9, 9, c.ctx.balance);
    alvo.hp = alvo.xpBase = 0;
    c.npc.equipe = c.j.equipe;
    c.estado.entidades.push(alvo);
    registrarParticipacao(alvo, c.npc.id, 0, c.ctx);
    processarMortes(c.estado, c.ctx, []);
    expect(c.npc.hp).toBe(20);
  });

  // Ajuste de 21/10/2026: derrubar invocações (pergaminho ou Necromante) não cura o NPC.
  it.each([undefined, 'servo'] as const)('derrubar invocação (necromancia %s) não cura', (necromancia) => {
    const c = cena('boss');
    const modelo = CONTEUDO.presets.get('goblin');
    if (!modelo) throw new Error('conteúdo ausente');
    const invocada = criarInimigo(modelo, 'invocada', 9, 9, c.ctx.balance);
    invocada.equipe = c.j.equipe;
    invocada.invocacao = {
      donoId: c.j.id, expiraTick: 99_999, dominado: false, comportamento: 'agressivo', avatar: false, golpesRestantes: 0,
      abates: 0, criadoTick: 0, nivelDominacao: 0, ...(necromancia && { necromancia }),
    };
    invocada.hp = 0;
    c.estado.entidades.push(invocada);
    registrarParticipacao(invocada, c.npc.id, 0, c.ctx);
    processarMortes(c.estado, c.ctx, []);
    expect(c.npc.hp).toBe(20);
  });

  it('não ultrapassa a vida máxima e arredonda a metade de vida ímpar', () => {
    const c = cena();
    c.npc.hp = 99;
    c.j.hp = 0;
    registrarParticipacao(c.j, c.npc.id, 0, c.ctx);
    processarMortes(c.estado, c.ctx, []);
    expect(c.npc.hp).toBe(100);
  });
});

describe('regeneração do chefe', () => {
  it('espera a saída do combate e recupera 5% por segundo até o máximo', () => {
    const c = cena('boss');
    processarIa(c.estado, c.ctx, []);
    if (!c.npc.ia) throw new Error('IA ausente');
    c.npc.ia.modo = 'patrulha';
    c.npc.ia.modoDesdeTick = 0;
    for (let s = 1; s <= 5; s++) {
      c.estado.tick = ticksDe(s * 1000) - 1;
      regenerarRecursos(c.estado, c.ctx);
    }
    expect(c.npc.hp).toBe(20);
    for (let s = 6; s <= 30; s++) {
      c.estado.tick = ticksDe(s * 1000) - 1;
      regenerarRecursos(c.estado, c.ctx);
    }
    expect(c.npc.hp).toBe(100);
  });

  it('perseguição, dano recebido e dano causado impedem regeneração', () => {
    const c = cena('boss');
    processarIa(c.estado, c.ctx, []);
    if (!c.npc.ia) throw new Error('IA ausente');
    c.estado.tick = ticksDe(10000) - 1;
    c.npc.ia.modo = 'perseguindo';
    regenerarRecursos(c.estado, c.ctx);
    expect(c.npc.hp).toBe(20);
    c.npc.ia.modo = 'patrulha';
    registrarParticipacao(c.npc, c.j.id, c.estado.tick, c.ctx);
    regenerarRecursos(c.estado, c.ctx);
    expect(c.npc.hp).toBe(20);
    c.npc.participacao = [];
    registrarParticipacao(c.j, c.npc.id, c.estado.tick, c.ctx);
    regenerarRecursos(c.estado, c.ctx);
    expect(c.npc.hp).toBe(20);
  });

  it.each(['goblin', 'boss'])('não regenera um %s morto', (preset) => {
    const c = cena(preset);
    c.npc.hp = 0;
    c.estado.tick = ticksDe(10000) - 1;
    regenerarRecursos(c.estado, c.ctx);
    expect(c.npc.hp).toBe(0);
  });

  it('comuns não regeneram fora de combate', () => {
    const c = cena();
    c.estado.tick = ticksDe(10000) - 1;
    regenerarRecursos(c.estado, c.ctx);
    expect(c.npc.hp).toBe(20);
  });
});
