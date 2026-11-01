// 01/11/2026: travessia, custo de mobilidade e combate na água.
import { describe, expect, it } from 'vitest';
import { criarEntidade, posicionar } from '../../src/entities/entidade';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { definirDirecao, integrarEntidade } from '../../src/world/movimento';
import { caminho } from '../../src/world/navegacao';
import { iniciarAcao, processarAcoes } from '../../src/combat/acao';
import { aplicarImpacto } from '../../src/combat/golpe';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { contexto, faseDeTexto } from '../apoio/fases';

function cena() {
  const ctx = contexto(faseDeTexto(['#########', '#.......#', '#..~~~..#', '#.......#', '#########']));
  const estado = criarEstado({ faseId: ctx.fase.id, semente: 1 });
  const j = criarEntidade({ id: 'j', tipo: 'jogador', x: 3, y: 2 });
  const inimigo = criarEntidade({ id: 'i', tipo: 'inimigo', x: 2, y: 2 });
  j.equipe = 'jogadores'; inimigo.equipe = 'monstros';
  j.ataqueBasico = inimigo.ataqueBasico = 'golpe';
  estado.entidades.push(j, inimigo);
  const eventos: EventoSimulacao[] = [];
  return { ctx, estado, j, inimigo, eventos };
}

describe('natação', () => {
  it('navega e atravessa água até a outra margem', () => {
    const c = cena();
    expect(caminho(c.ctx.fase, { x: 2, y: 2 }, { x: 6, y: 2 }, 100).status).toBe('alcancado');
    definirDirecao(c.j, 'E');
    for (let i = 0; i < 240; i++) integrarEntidade(c.j, c.estado, c.ctx, c.eventos, 1000 / 60);
    expect(c.j.x).toBeGreaterThanOrEqual(6);
  });
  it('nadar é mais lento que andar com os mesmos atributos', () => {
    const a = cena(), b = cena(); posicionar(b.j, 3, 1);
    definirDirecao(a.j, 'E'); definirDirecao(b.j, 'E');
    integrarEntidade(a.j, a.estado, a.ctx, a.eventos, 100);
    integrarEntidade(b.j, b.estado, b.ctx, b.eventos, 100);
    expect(a.j.px - 3).toBeLessThan(b.j.px - 3);
  });
  it('não inicia ataque na água e recebe dano de quem está na margem', () => {
    const c = cena();
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'golpe', c.inimigo.id, c.eventos)).toBe(false);
    expect(c.eventos).toContainEqual(expect.objectContaining({ t: 'acaoRecusada', motivo: 'nadando' }));
    const hab = resolverHabilidade(c.ctx, 'golpe'); if (!hab) throw new Error('golpe');
    const antes = c.j.hp;
    aplicarImpacto(c.estado, c.ctx, c.j, { acaoId: 1, hab, indice: 0, fonte: { id: c.inimigo.id, equipe: c.inimigo.equipe, bonusAtributo: 10, multRolagem: 1, potencia: 1, carisma: 10, multDano: 1, multCura: 1, d20Minimo: 20 } }, c.eventos);
    expect(c.j.hp).toBeLessThan(antes);
  });
  it('entrar na água antes do lançamento impede o ataque preparado em terra', () => {
    const c = cena(); posicionar(c.j, 3, 1); posicionar(c.inimigo, 2, 1);
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'golpe', c.inimigo.id, c.eventos)).toBe(true);
    if (!c.j.acao) throw new Error('ação');
    c.estado.tick = c.j.acao.lancamentoTick;
    posicionar(c.j, 3, 2);
    processarAcoes(c.estado, c.ctx, c.eventos);
    expect(c.eventos.some(e => e.t === 'impacto')).toBe(false);
  });
});
