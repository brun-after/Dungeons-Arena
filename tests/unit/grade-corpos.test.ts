// Marco 26 (29/10/2026, D-122): a colisão pela grade de corpos dá o mesmo resultado da varredura completa.
import { describe, expect, it } from 'vitest';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { clonarEstado, criarEstado, type EstadoJogo } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { criarInimigo } from '../../src/entities/fabrica';
import { ordemRotativa } from '../../src/world/colisao';
import { GradeDeCorpos } from '../../src/world/grade-corpos';
import { integrarEntidade, moverEntidades } from '../../src/world/movimento';
import { sincronizarPosicao } from '../../src/entities/entidade';
import { CONTEUDO, contexto, faseDeTexto } from '../apoio/fases';

const SALA = ['################', ...Array.from({ length: 12 }, () => '#..............#'), '################'];

function multidao(): EstadoJogo {
  const estado = criarEstado({ semente: 3, faseId: 'teste' });
  const goblin = CONTEUDO.presets.get('goblin');
  if (!goblin) throw new Error('goblin');
  let n = 0;
  for (let x = 1; x <= 14; x += 2) {
    for (let y = 1; y <= 12; y += 2) {
      const e = criarInimigo(goblin, `g${n++}`, x, y, BALANCE_PADRAO);
      // Todos para o centro: a multidão se aperta e desliza.
      const dx = 7.5 - x;
      const dy = 6.5 - y;
      const d = Math.hypot(dx, dy) || 1;
      e.direcao = 'E';
      e.rumoX = dx / d;
      e.rumoY = dy / d;
      estado.entidades.push(e);
    }
  }
  return estado;
}

describe('grade de corpos', () => {
  it('perto() inclui todos a menos do raio, na ordem do vetor', () => {
    const estado = multidao();
    const grade = new GradeDeCorpos(estado.entidades);
    for (const [x, y] of [[7, 6], [1.4, 1.6], [13.2, 11.7]] as const) {
      const r = 0.7;
      const dentro = estado.entidades.filter((e) => Math.hypot(e.px - x, e.py - y) < r);
      const perto = [...grade.perto(x, y, r)];
      for (const e of dentro) expect(perto).toContain(e);
      const indices = perto.map((e) => estado.entidades.indexOf(e));
      expect(indices).toEqual([...indices].sort((a, b) => a - b));
    }
  });

  it('o movimento com a grade termina nas mesmas posições que a varredura completa', () => {
    const ctx = contexto(faseDeTexto(SALA));
    const comGrade = multidao();
    const semGrade = clonarEstado(comGrade);
    for (let t = 0; t < 240; t++) {
      moverEntidades(comGrade, ctx, [], DT_MS);
      for (const e of semGrade.entidades) sincronizarPosicao(e);
      for (const e of ordemRotativa(semGrade.entidades, semGrade.tick)) integrarEntidade(e, semGrade, ctx, [], DT_MS);
      comGrade.tick++;
      semGrade.tick++;
    }
    expect(comGrade.entidades.map((e) => [e.px, e.py])).toEqual(semGrade.entidades.map((e) => [e.px, e.py]));
    // E a multidão andou de fato.
    expect(comGrade.entidades.some((e) => Math.abs(e.px - Math.round(e.px)) > 0.01 || e.x !== 1)).toBe(true);
  });
});
