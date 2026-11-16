// 16/11/2026: o jogador não trava. O cenário baixo (arbusto, pedra miúda, toco, saco...) se atravessa; contra a parede,
// a quina e o tronco o corpo escorrega; e quem já encosta numa célula que passou a barrar (o degrau do relevo depois de
// descer) sai livre. A entrada oeste de Campos do Oeste prendia o jogador para sempre.
import { describe, expect, it } from 'vitest';
import { modoPorId } from '../../src/core/conteudo';
import type { Dir8 } from '../../src/core/comandos';
import { criarEstado, criarEntidade } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { posicionar } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { lerLugar, montarLugar } from '../../src/mundo/lugares';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { PASSA_POR_CIMA } from '../../src/world/cenario-baixo';
import { corpoCabe } from '../../src/world/corpo';
import { passavel, type Fase } from '../../src/world/fase';
import { gerarExterior } from '../../src/world/gerador-exterior';
import { OBSTACULO } from '../../src/world/geografia';
import { definirDirecao, integrarEntidade } from '../../src/world/movimento';
import { alturaEm, barraPorAltura } from '../../src/world/relevo';
import { contexto, CONTEUDO, faseDeTexto } from '../apoio/fases';

const DIRS: Dir8[] = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

function regiao(id: string) {
  const reino = CONTEUDO.reinos.get('reino_central');
  if (!reino) throw new Error('reino');
  const lugar = lerLugar(reino, `regiao:${id}`);
  if (!lugar || lugar.tipo !== 'regiao') throw new Error('lugar');
  return { reino, regiao: lugar.regiao, ...montarLugar(CONTEUDO, reino, lugar, modoPorId(CONTEUDO, MODO_MUNDO)) };
}

describe('o jogador não trava (16/11/2026)', () => {
  it('em Campos do Oeste, de qualquer ponto em que o corpo pode estar, ele sai andando para algum lado', () => {
    const m = regiao('campos_do_oeste');
    const classe = CONTEUDO.classes.get('guerreiro');
    if (!classe) throw new Error('classe');
    m.estado.entidades = [];
    const eu = criarJogador(classe, 'p1', 0, 0, m.ctx.balance);
    m.estado.entidades.push(eu);
    const f = m.ctx.fase;
    const r = m.ctx.balance.movimento.raioCorpo;
    const presos: string[] = [];
    // A volta da entrada que prendia (22..24, 140..145) célula a célula, e o resto da região em amostra.
    const pontos: [number, number][] = [];
    for (let y = 136; y <= 148; y++) for (let x = 18; x <= 28; x++) pontos.push([x, y]);
    for (let y = 4; y < f.altura - 4; y += 9) for (let x = 4; x < f.largura - 4; x += 9) pontos.push([x, y]);
    for (const [x, y] of pontos) {
      if (!passavel(f, x, y)) continue;
      for (const ox of [-0.42, 0, 0.42]) for (const oy of [-0.42, -0.2, 0, 0.2, 0.42]) {
        const px = x + ox;
        const py = y + oy;
        const alturas = new Set<number>();
        for (let j = Math.round(py - r); j <= Math.round(py + r); j++) for (let i = Math.round(px - r); i <= Math.round(px + r); i++) if (passavel(f, i, j)) alturas.add(alturaEm(f, i, j));
        if (![...alturas].some((h0) => corpoCabe(f, px, py, r, barraPorAltura(f, m.ctx.balance.relevo, h0, 'andar')))) continue;
        const saiu = DIRS.some((d) => {
          posicionar(eu, px, py);
          definirDirecao(eu, d);
          integrarEntidade(eu, m.estado, m.ctx, [], DT_MS * 3);
          return Math.hypot(eu.px - px, eu.py - py) > 0.05;
        });
        if (!saiu) presos.push(`(${px.toFixed(2)}, ${py.toFixed(2)})`);
      }
    }
    expect(presos).toEqual([]);
  });

  it('contra a quina da parede, o corpo escorrega em vez de parar', () => {
    const fase: Fase = faseDeTexto(['############', '#..........#', '#..........#', '#....#.....#', '#..........#', '#..........#', '############']);
    const ctx = contexto(fase);
    const estado = criarEstado({ semente: 1, faseId: fase.id });
    const e = criarEntidade({ id: 'j', tipo: 'jogador', x: 3, y: 3 });
    estado.entidades.push(e);
    // De frente para a quina de baixo do pilar em (5, 3), com o centro 0,45 abaixo do meio dele.
    posicionar(e, 3, 3.45);
    definirDirecao(e, 'E');
    for (let i = 0; i < 90; i++) integrarEntidade(e, estado, ctx, [], DT_MS);
    expect(e.px).toBeGreaterThan(6);
  });

  it('o arbusto e a pedra miúda não barram; o rochedo no pé do penhasco, sim; as peças baixas não ocupam a célula', () => {
    const m = regiao('campos_do_oeste');
    const ex = gerarExterior(m.reino, m.regiao);
    const f = m.ctx.fase;
    const o = ex.obstaculos;
    let arbustos = 0;
    let pedras = 0;
    for (let k = 0; k < o.length; k++) {
      const x = k % f.largura;
      const y = Math.floor(k / f.largura);
      if (o[k] === OBSTACULO.arbusto && passavel(f, x, y)) arbustos++;
      if (o[k] === OBSTACULO.rochedo && passavel(f, x, y)) pedras++;
    }
    expect(arbustos).toBeGreaterThan(20);
    expect(pedras).toBeGreaterThan(0);
    for (const p of ex.pecas) if (PASSA_POR_CIMA.has(p.nome)) expect(p.solido).toBe(false);
    expect(ex.pecas.some((p) => PASSA_POR_CIMA.has(p.nome))).toBe(true);
  });
});
