import { describe, expect, it } from 'vitest';
import { criarEstado } from '../../src/core/estado';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';
import { sonsDoEvento } from '../../src/audio/mapeamento';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { DT_MS } from '../../src/core/loop';

function cena(distancia: number) {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const classe = CONTEUDO.classes.get('guerreiro'), preset = CONTEUDO.presets.get('boneco');
  if (!classe || !preset) throw new Error('conteúdo ausente');
  const estado = criarEstado({ semente: 42, faseId: ctx.fase.id });
  const j = criarJogador(classe, 'j', 3, 5, ctx.balance);
  j.seguirAlvo = false;
  estado.entidades.push(j, criarInimigo(preset, 'alvo', 3 + distancia, 5, ctx.balance));
  const eventos: EventoSimulacao[] = [];
  const tick = (selecionar = false) => { simular(estado, ctx, selecionar ? [{ tick: estado.tick, entidadeId: 'j', cmd: { t: 'selecionarAlvo', alvo: 'alvo' } }] : [], eventos, DT_MS); };
  const sons = () => eventos.flatMap(ev => sonsDoEvento(ev, 'j', id => resolverHabilidade(ctx, id)));
  return { estado, j, eventos, tick, sons };
}

describe('áudio de guerreiro ao selecionar um alvo', () => {
  it('manter alvo fora do alcance por dez segundos não produz efeitos de ataque', () => {
    const c = cena(5); c.tick(true);
    for (let i = 0; i < 600; i++) c.tick();
    expect(c.j.alvoSelecionado).toBe('alvo');
    expect(c.eventos.filter(e => e.t === 'acaoIniciada' && e.atorId === 'j')).toEqual([]);
    expect(c.sons()).toEqual([]);
  });
  it('o automático pode acertar um alvo próximo, sem disparar chiado na preparação', () => {
    const c = cena(1); c.tick(true);
    for (let i = 0; i < 300; i++) c.tick();
    expect(c.eventos.some(e => e.t === 'acaoIniciada' && e.atorId === 'j')).toBe(true);
    expect(c.eventos.some(e => e.t === 'impacto' && e.fonteId === 'j')).toBe(true);
    expect(c.sons().some(p => p.som === 'golpe' || p.som === 'conjuracao')).toBe(false);
    expect(c.sons().length).toBeGreaterThan(0);
  });
});
