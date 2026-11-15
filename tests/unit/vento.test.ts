// Marco 42 (15/11/2026, D-176): o vento (inimigos, reações e terreno), sem runa de jogador ainda.
import { describe, expect, it } from 'vitest';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { ELEMENTOS } from '../../src/combat/elementos';
import { temLuzPropria } from '../../src/combat/luz-propria';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarJogador } from '../../src/entities/fabrica';
import { PONTAS_ELEMENTAIS } from '../../src/progression/vinculo';
import { ASSINATURAS } from '../../src/render/vfx/assinaturas';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

describe('vento (D-176)', () => {
  it('é elemento do jogo, mas ainda não é ponta do vínculo do jogador', () => {
    expect(ELEMENTOS).toContain('vento');
    expect(PONTAS_ELEMENTAIS).not.toContain('vento');
    expect(PONTAS_ELEMENTAIS).toHaveLength(9);
  });

  it('a Rajada é a skill da afinidade do vento: empurra, arrasta, apaga a tocha e dispersa os tiros', () => {
    expect(CONTEUDO.afinidades.elementos.get('vento')?.habilidade).toBe('rajada');
    const rajada = CONTEUDO.habilidades.get('rajada');
    expect(rajada?.elemento).toBe('vento');
    expect(rajada?.tipoArea).toBe('cone');
    const tipos = rajada?.efeitos.map((e) => e.tipo) ?? [];
    expect(tipos).toEqual(expect.arrayContaining(['empurrao', 'arrastado', 'apagar_luz', 'dispersar_tiros']));
    expect(ASSINATURAS.rajada.familia).toBe('vento');
  });

  it('o vento reage com cada ponta (o físico e os oito elementos)', () => {
    const pares = new Set<string>();
    const ESTADO: Record<string, string> = { queimando: 'fogo', resfriado: 'gelo', eletrizado: 'raio', envenenado: 'veneno', exposto: 'psiquico', enraizado: 'terra', marcado: 'trevas', definhando: 'trevas', consagrado: 'sagrado', arrastado: 'vento' };
    for (const s of CONTEUDO.interacoes.sinergias) {
      for (const sobre of s.sobre) {
        const outra = ESTADO[sobre];
        if (outra && (outra === 'vento' || s.elemento === 'vento') && outra !== s.elemento) pares.add(outra === 'vento' ? s.elemento : outra);
      }
    }
    expect([...pares].sort()).toEqual([...PONTAS_ELEMENTAIS].sort());
  });

  it('dispersar os tiros leva os projéteis hostis perto de quem sopra, e só esses', () => {
    const ctx = contexto(faseDeTexto(SALA_ABERTA));
    const estado = criarEstado({ semente: 2, faseId: 'teste' });
    const classe = CONTEUDO.classes.get('mago');
    if (!classe) throw new Error('classe');
    const j = criarJogador(classe, 'j', 3, 3, ctx.balance);
    estado.entidades.push(j);
    const base = { acaoId: 1, habilidadeId: 'x', chave: 'x', dirX: 1, dirY: 0 };
    estado.projeteis.push({ ...base, id: 1, donoId: 'm', equipeDono: 'inimigos', x: 4, y: 3 } as never, { ...base, id: 2, donoId: 'm', equipeDono: 'inimigos', x: 12, y: 3 } as never);
    const ev: EventoSimulacao[] = [];
    // A rajada de um inimigo de vento (em: conjurador) leva os tiros do jogador; aqui, o jogador sopra.
    aplicarEfeito(estado, ctx, j, construirEfeito('dispersar_tiros', { valor: 3 }), { id: j.id, x: j.x, y: j.y }, null, ev);
    expect(estado.projeteis.map((p) => p.id)).toEqual([2]);
  });

  it('a rajada apaga a tocha', () => {
    const ctx = contexto(faseDeTexto(SALA_ABERTA));
    const estado = criarEstado({ semente: 2, faseId: 'teste' });
    const classe = CONTEUDO.classes.get('mago');
    if (!classe) throw new Error('classe');
    const j = criarJogador(classe, 'j', 3, 3, ctx.balance);
    estado.entidades.push(j);
    const ev: EventoSimulacao[] = [];
    aplicarEfeito(estado, ctx, j, construirEfeito('tocha', { duracaoMs: 60_000 }), { id: j.id, x: 3, y: 3 }, null, ev);
    aplicarEfeito(estado, ctx, j, construirEfeito('apagar_luz', {}), { id: 'm', x: 5, y: 3 }, null, ev);
    expect(temLuzPropria(j)).toBe(false);
  });
});
