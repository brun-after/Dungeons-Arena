// 02/11/2026: cor segue a origem da invocação, sem depender do jogador local.
import { describe, expect, it } from 'vitest';
import { conteudoOficial } from '../../src/core/conteudo';
import { catalogoDeGeracao } from '../../src/world/gerador';
import { criarEstado } from '../../src/core/estado';
import { criarEntidade } from '../../src/entities/entidade';
import { tintaDaInvocacao } from '../../src/render/cores-necromancia';

function cenario(preset = 'esqueleto') {
  const estado = criarEstado({ semente: 1, faseId: 'teste' });
  const dono = criarEntidade({ id: 'dono', tipo: 'jogador', x: 1, y: 1 });
  const servo = criarEntidade({ id: 'servo', tipo: 'invocacao', preset, x: 2, y: 1 });
  servo.invocacao = { donoId: dono.id, expiraTick: 100, dominado: false, comportamento: 'agressivo', avatar: false, golpesRestantes: 0, abates: 0, criadoTick: 0, nivelDominacao: 0 };
  estado.entidades.push(dono, servo);
  return { estado, dono, servo };
}

describe('identidade visual dos servos', () => {
  it('tinge de vermelho os servos e reanimados do jogador, mesmo sem o dono no recorte', () => {
    const { estado, dono, servo } = cenario();
    dono.classeId = 'necromante';
    expect(tintaDaInvocacao(servo, estado)).toBe(0xff7777);
    if (!servo.invocacao) throw new Error('sem invocação');
    servo.invocacao.necromancia = 'reanimado';
    estado.entidades.splice(0, 1);
    expect(tintaDaInvocacao(servo, estado)).toBe(0xff7777);
  });

  it('preserva os servos negros do boss mesmo quando o dono saiu do recorte de rede', () => {
    const { estado, dono, servo } = cenario('esqueleto_do_ossuario');
    dono.preset = 'necromante_ancestral';
    expect(tintaDaInvocacao(servo, estado)).toBe(0x37333d);
    estado.entidades.splice(0, 1);
    expect(tintaDaInvocacao(servo, estado)).toBe(0x37333d);
  });

  it('não altera inimigos comuns nem invocações de outras classes', () => {
    const { estado, dono, servo } = cenario();
    dono.classeId = 'aventureiro';
    expect(tintaDaInvocacao(servo, estado)).toBeNull();
    servo.invocacao = null;
    expect(tintaDaInvocacao(servo, estado)).toBeNull();
  });
});


it('o esqueleto exclusivo do boss não entra na população comum das fases', () => {
  expect(catalogoDeGeracao(conteudoOficial(), []).comuns).not.toContain('esqueleto_do_ossuario');
});

it('um servo apropriado pelo necromante jogador assume a cor vermelha', () => {
  const { estado, dono, servo } = cenario('esqueleto_do_ossuario');
  dono.classeId = 'necromante';
  expect(tintaDaInvocacao(servo, estado)).toBe(0xff7777);
});
