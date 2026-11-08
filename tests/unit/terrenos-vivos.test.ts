// Terrenos vivos (08/11/2026, D-138): a água reage aos elementos, o raio conduz e tudo volta no prazo.
import { describe, expect, it } from 'vitest';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { criarEstado } from '../../src/core/estado';
import { ticksDe } from '../../src/core/tempo';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { processarAmbientes } from '../../src/world/ambientes';
import { areasEfetivas, processarTerrenosVivos } from '../../src/world/terrenos-vivos';
import { emPerigo } from '../../src/world/perigos';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

function cenario() {
  const base = contexto(faseDeTexto(SALA_ABERTA));
  const ctx: ContextoSimulacao = { ...base, fase: { ...base.fase, ambientes: [{ tipo: 'agua', x: 6, y: 6, raio: 2 }] } };
  const estado = criarEstado({ semente: 3, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 2, 2, ctx.balance);
  const a = criarInimigo(obter(CONTEUDO.presets.get('goblin')), 'a', 6, 6, ctx.balance);
  const b = criarInimigo(obter(CONTEUDO.presets.get('goblin')), 'b', 7, 6, ctx.balance);
  estado.entidades.push(j, a, b);
  const golpe = (chave: string, dano = 20): EventoSimulacao[] => {
    const saida: EventoSimulacao[] = [{ t: 'impacto', tick: estado.tick, acaoId: 1, fonteId: 'j', alvoId: 'a', habilidadeId: chave, chave, dano, cura: 0, d20: 12, mult: 1, falha: false, critico: false, imune: false, indice: 0, sinergias: [] }];
    processarTerrenosVivos(estado, ctx, saida);
    return saida;
  };
  const tipoEm = () => areasEfetivas(estado, ctx.fase.ambientes ?? []).find((x) => x.x === 6 && x.y === 6)?.tipo;
  return { ctx, estado, a, b, golpe, tipoEm };
}

describe('terrenos vivos', () => {
  it('o gelo congela a água; o fogo derrete de volta e, na água, vira vapor; tudo volta no prazo', () => {
    const c = cenario();
    c.golpe('lanca_de_gelo');
    expect(c.tipoEm()).toBe('gelo_fino');
    // O gelo congelado fere quem não é do gelo: a IA passa a evitar.
    expect(emPerigo(c.estado, c.ctx, c.b, 6, 6)).toBe(true);
    c.golpe('bola_de_fogo');
    expect(c.tipoEm()).toBe('agua');
    expect(c.estado.terrenos ?? []).toHaveLength(0);
    const ev = c.golpe('bola_de_fogo');
    expect(c.tipoEm()).toBe('vapor');
    expect(ev.some((e) => e.t === 'terrenoReagiu' && e.de === 'agua' && e.para === 'vapor')).toBe(true);
    c.estado.tick = obter(c.estado.terrenos?.[0]).ateTick;
    processarTerrenosVivos(c.estado, c.ctx, []);
    expect(c.tipoEm()).toBe('agua');
    expect(c.estado.terrenos).toBeUndefined();
  });

  it('a terra faz lama (lenta, sem impedir o ataque) e o veneno não reage', () => {
    const c = cenario();
    c.golpe('flecha_venenosa');
    expect(c.tipoEm()).toBe('agua');
    c.golpe('estaca_de_pedra');
    expect(c.tipoEm()).toBe('lama');
    // No pulso das áreas (o próximo múltiplo do intervalo).
    c.estado.tick = ticksDe(c.ctx.balance.ambiente.intervaloMs) * 3;
    processarAmbientes(c.estado, c.ctx, []);
    expect(c.a.efeitos.some((f) => f.tipo === 'atolado')).toBe(true);
    expect(c.a.efeitos.some((f) => f.tipo === 'sem_ataque' || f.tipo === 'atordoar')).toBe(false);
  });

  it('o raio na água conduz: quem mais está nela leva parte do golpe e fica eletrizado', () => {
    const c = cenario();
    const antes = c.b.hp;
    c.golpe('raio_em_cadeia', 40);
    expect(c.b.hp).toBeLessThan(antes);
    expect(c.b.efeitos.some((f) => f.tipo === 'eletrizado')).toBe(true);
    expect(c.tipoEm()).toBe('campo_eletrico');
  });
});
