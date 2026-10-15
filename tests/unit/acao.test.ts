import { describe, expect, it } from 'vitest';
import { chaveRecarga } from '../../src/combat/acao';
import type { Comando } from '../../src/core/comandos';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import type { Entidade } from '../../src/entities/entidade';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));

function obter<T>(v: T | undefined, nome: string): T {
  if (v === undefined) throw new Error(`${nome} ausente`);
  return v;
}

/** Jogador em (3,5) e um boneco (sem IA) em (5,5), na sala aberta. */
function arena(semente = 1, bonecoX = 5) {
  const estado = criarEstado({ semente, faseId: 'teste' });
  const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
  const boneco = obter(CONTEUDO.presets.get('boneco'), 'boneco');
  estado.entidades.push(criarJogador(classe, 'j', 3, 5, ctx.balance));
  estado.entidades.push(criarInimigo(boneco, 'b', bonecoX, 5, ctx.balance));
  const eventos: EventoSimulacao[] = [];
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
  const tick = (cmds: [string, Comando][] = []) => {
    simular(estado, ctx, cmds.map(([entidadeId, cmd]) => ({ tick: estado.tick, entidadeId, cmd })), eventos, DT_MS);
  };
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const de = <T extends EventoSimulacao['t']>(t: T) => eventos.filter((e): e is Extract<EventoSimulacao, { t: T }> => e.t === t);
  return { estado, eventos, ent, tick, ticks, de };
}

describe('ciclo de uma ação (§2.7)', () => {
  it('custo e recarga são pagos no início da conjuração, e o impacto vem no lançamento', () => {
    const a = arena();
    const manaAntes = a.ent('j').mana;
    a.tick([['j', { t: 'usarHabilidade', id: 'seta_arcana', alvo: 'b' }]]);
    const j = a.ent('j');
    expect(j.mana).toBe(manaAntes - 2);
    expect(a.estado.recargas[chaveRecarga('j', 'seta_arcana')]).toBe(ticksDe(2500));
    const [iniciada] = a.de('acaoIniciada');
    expect(iniciada).toMatchObject({ inicioTick: 0, lancamentoTick: ticksDe(600) });
    // Aviso útil ≥ 200 ms antes do impacto (§3.6).
    expect(((obter(iniciada, 'evento').impactoPrevistoTick - 0) * DT_MS)).toBeGreaterThanOrEqual(200);
    a.ticks(ticksDe(600) + 20);
    expect(a.de('projetilLancado')).toHaveLength(1);
    expect(a.de('impacto').length + a.de('projetilFim').length).toBeGreaterThan(0);
  });

  it('recusa em recarga e sem recurso, sem cobrar de novo', () => {
    const a = arena();
    a.tick([['j', { t: 'usarHabilidade', id: 'explosao', alvo: 'b' }]]);
    a.ticks(ticksDe(900) + 2);
    const mana = a.ent('j').mana;
    a.tick([['j', { t: 'usarHabilidade', id: 'explosao', alvo: 'b' }]]);
    expect(a.ent('j').mana).toBe(mana);
    expect(a.de('acaoRecusada').at(-1)).toMatchObject({ motivo: 'recarga' });

    a.ent('j').mana = 0;
    a.tick([['j', { t: 'usarHabilidade', id: 'seta_arcana', alvo: 'b' }]]);
    expect(a.de('acaoRecusada').at(-1)).toMatchObject({ motivo: 'recurso' });
  });

  it('atordoar interrompe a conjuração sem devolver custo nem recarga', () => {
    const a = arena();
    const manaAntes = a.ent('j').mana;
    a.tick([['j', { t: 'usarHabilidade', id: 'explosao', alvo: 'b' }]]);
    a.ent('j').efeitos.push({ valor: 0, pct: 0, proximoTick: 0, interno: null, ref: null, inicioTick: 0, acumulos: 1, tipo: 'atordoar', ateTick: a.estado.tick + 30, origemId: 'b' });
    a.ticks(ticksDe(900) + 5);
    expect(a.de('acaoCancelada')).toMatchObject([{ motivo: 'interrompido' }]);
    expect(a.de('impacto')).toHaveLength(0);
    expect(a.ent('j').mana).toBeLessThan(manaAntes);
    expect(a.estado.recargas[chaveRecarga('j', 'explosao')]).toBeGreaterThan(a.estado.tick);
  });

  it('silêncio bloqueia só ação mágica; a física continua', () => {
    const a = arena(1, 4);
    a.ent('j').efeitos.push({ valor: 0, pct: 0, proximoTick: 0, interno: null, ref: null, inicioTick: 0, acumulos: 1, tipo: 'silenciar', ateTick: 1_000, origemId: 'b' });
    a.tick([['j', { t: 'usarHabilidade', id: 'seta_arcana', alvo: 'b' }]]);
    expect(a.de('acaoRecusada').at(-1)).toMatchObject({ motivo: 'bloqueado' });
    a.tick([['j', { t: 'ataqueBasico', alvo: 'b' }]]);
    expect(a.de('acaoIniciada')).toHaveLength(1);
  });

  it('golpe de contato erra se o alvo sair do alcance antes do impacto', () => {
    const a = arena(1, 5);
    a.tick([['j', { t: 'ataqueBasico', alvo: 'b' }]]);
    // O boneco foge para longe durante a conjuração.
    const b = a.ent('b');
    b.x = 10;
    b.destinoX = 10;
    a.ticks(ticksDe(504) + 2);
    expect(a.de('esquivou')).toHaveLength(1);
    expect(a.de('impacto')).toHaveLength(0);
  });

  it('área usa a geometria no tick do impacto', () => {
    const a = arena(1, 6);
    a.tick([['j', { t: 'usarHabilidade', id: 'explosao', alvo: 'b' }]]);
    const b = a.ent('b');
    b.y = 9;
    b.destinoY = 9;
    a.ticks(ticksDe(900) + 2);
    expect(a.de('impacto')).toHaveLength(0);
  });

  it('projétil lançado continua depois da morte do lançador', () => {
    const a = arena(4, 9);
    a.tick([['j', { t: 'usarHabilidade', id: 'seta_arcana', alvo: 'b' }]]);
    a.ticks(ticksDe(600) + 1);
    expect(a.estado.projeteis).toHaveLength(1);
    a.ent('j').hp = 0;
    a.ticks(120);
    expect(a.de('morreu').map((e) => e.id)).toContain('j');
    expect(a.de('projetilFim')).toHaveLength(1);
    expect(a.de('impacto').every((e) => e.fonteId === 'j')).toBe(true);
  });

  it('falha crítica não aplica efeito de acerto', () => {
    // Procura uma semente cujo golpe atordoante role falha crítica.
    for (let semente = 1; semente < 400; semente++) {
      const a = arena(semente, 4);
      a.tick([['j', { t: 'usarHabilidade', id: 'golpe_atordoante', alvo: 'b' }]]);
      a.ticks(ticksDe(600) + 2);
      const [imp] = a.de('impacto');
      if (!imp?.falha) continue;
      expect(imp.dano).toBe(0);
      expect(a.de('efeitoAplicado')).toHaveLength(0);
      return;
    }
    throw new Error('nenhuma falha crítica encontrada');
  });

  it('acerto do golpe atordoante atordoa o alvo, que não anda', () => {
    for (let semente = 1; semente < 50; semente++) {
      const a = arena(semente, 4);
      a.tick([['j', { t: 'usarHabilidade', id: 'golpe_atordoante', alvo: 'b' }]]);
      a.ticks(ticksDe(600) + 1);
      if (a.de('impacto')[0]?.falha !== false) continue;
      expect(a.de('efeitoAplicado')).toMatchObject([{ tipo: 'atordoar', alvoId: 'b' }]);
      a.tick([['b', { t: 'mover', dir: 'E' }]]);
      a.ticks(40);
      expect(a.ent('b').x).toBe(4);
      return;
    }
    throw new Error('nenhum acerto encontrado');
  });

  it('quem conjura não começa passo novo', () => {
    const a = arena();
    a.tick([['j', { t: 'usarHabilidade', id: 'curar' }]]);
    a.tick([['j', { t: 'mover', dir: 'N' }]]);
    a.ticks(ticksDe(700) - 3);
    expect(a.ent('j').y).toBe(5);
  });

  it('cura não passa do HP máximo', () => {
    const a = arena();
    const j = a.ent('j');
    j.hp = j.hpMax - 1;
    a.tick([['j', { t: 'usarHabilidade', id: 'curar' }]]);
    a.ticks(ticksDe(700) + 2);
    expect(a.ent('j').hp).toBe(j.hpMax);
    expect(a.de('impacto')[0]).toMatchObject({ cura: 1 });
  });
});

describe('ataque básico não bloqueia habilidades (D-020)', () => {
  it('pedir habilidade durante a conjuração do básico substitui o básico', () => {
    const a = arena(1, 4);
    a.tick([['j', { t: 'ataqueBasico', alvo: 'b' }]]);
    a.ticks(5);
    a.tick([['j', { t: 'usarHabilidade', id: 'seta_arcana', alvo: 'b' }]]);
    expect(a.de('acaoCancelada')).toMatchObject([{ motivo: 'substituido' }]);
    expect(a.ent('j').acao?.habilidadeId).toBe('seta_arcana');
  });

  it('uma habilidade em conjuração não é substituída por outra', () => {
    const a = arena(1, 4);
    a.tick([['j', { t: 'usarHabilidade', id: 'explosao', alvo: 'b' }]]);
    a.tick([['j', { t: 'usarHabilidade', id: 'seta_arcana', alvo: 'b' }]]);
    expect(a.de('acaoRecusada')).toMatchObject([{ motivo: 'ocupado' }]);
    expect(a.ent('j').acao?.habilidadeId).toBe('explosao');
  });
});

describe('auto-alvo e ataque automático', () => {
  it('ataque básico sem alvo escolhe o hostil mais próximo no alcance', () => {
    const a = arena(1, 4);
    a.tick([['j', { t: 'ataqueBasico' }]]);
    expect(a.de('acaoIniciada')).toMatchObject([{ alvoId: 'b' }]);
  });

  it('sem hostil no alcance, recusa sem cobrar', () => {
    const a = arena(1, 10);
    a.tick([['j', { t: 'ataqueBasico' }]]);
    expect(a.de('acaoRecusada')).toMatchObject([{ motivo: 'sem_alvo' }]);
  });

  it('com alvo selecionado no alcance, ataca sozinho a cada recarga', () => {
    const a = arena(1, 4);
    a.tick([['j', { t: 'selecionarAlvo', alvo: 'b' }]]);
    a.ticks(300);
    expect(a.de('acaoIniciada').length).toBeGreaterThanOrEqual(3);
  });

  it('não seleciona a si mesmo nem aliado', () => {
    const a = arena();
    a.tick([['j', { t: 'selecionarAlvo', alvo: 'j' }]]);
    expect(a.ent('j').alvoSelecionado).toBeNull();
  });
});

describe('morte e respawn', () => {
  it('inimigo morto dá XP, sai do mundo e volta no mesmo id com a geração incrementada', () => {
    const a = arena(1, 4);
    const b = a.ent('b');
    b.hp = 1;
    a.tick([['j', { t: 'ataqueBasico', alvo: 'b' }]]);
    for (let i = 0; i < 200 && a.de('morreu').length === 0; i++) {
      a.tick();
      if (a.de('acaoCancelada').length > 0 || a.de('impacto').some((e) => e.falha)) {
        a.eventos.length = 0;
        a.tick([['j', { t: 'ataqueBasico', alvo: 'b' }]]);
      }
    }
    expect(a.estado.entidades.map((e) => e.id)).not.toContain('b');
    // O boneco não dá XP (xp 0 no preset); o respawn chega em 60 s.
    a.ticks(ticksDe(60_000) + 2);
    expect(a.ent('b').geracao).toBe(1);
    expect(a.ent('b').abates).toBe(1);
  });

  it('respawn espera a célula de origem liberar quando outro inimigo está nela', () => {
    const a = arena(1, 4);
    a.estado.entidades = a.estado.entidades.filter((e) => e.id !== 'b');
    a.estado.respawns.push({ id: 'b', preset: 'boneco', x: 6, y: 6, nivel: 1, geracao: 1, abates: 1, noTick: 0 });
    const ocupante = criarInimigo(obter(CONTEUDO.presets.get('boneco'), 'boneco'), 'ocupante', 6, 6, ctx.balance);
    a.estado.entidades.push(ocupante);
    a.ticks(5);
    expect(a.estado.entidades.map((e) => e.id)).not.toContain('b');
    ocupante.x = ocupante.destinoX = 8;
    a.ticks(2);
    expect(a.ent('b')).toMatchObject({ x: 6, y: 6, geracao: 1 });
  });

  it('jogador morto revive no spawn com HP cheio e fica invisível para inimigos', () => {
    const a = arena();
    a.ent('j').hp = 0;
    a.tick();
    expect(a.ent('j').morto).toBe(true);
    a.tick([['j', { t: 'mover', dir: 'E' }]]);
    a.ticks(ticksDe(1200) + 2);
    const j = a.ent('j');
    expect(j).toMatchObject({ morto: false, hp: j.hpMax, x: 1, y: 1 });
    expect(j.invisivelAteTick).toBeGreaterThan(a.estado.tick);
  });
});
