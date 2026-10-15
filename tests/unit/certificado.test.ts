// Marco 17 (15/10/2026, D-063): o certificado do personagem — só o servidor assina; editar o personagem invalida;
// o crescimento entre certificados precisa caber no tempo; sem histórico, só até o nível da regra; save v12.

import { describe, expect, it } from 'vitest';
import { contextoDaArena } from '../../src/arena/contexto-arena';
import { pedidoDoPersonagem, type PedidoDePersonagem } from '../../src/coop/personagem';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { criarJogador } from '../../src/entities/fabrica';
import { avaliarCrescimento, lerCertificado, minutosEntre, xpTotal } from '../../src/integridade/certificado';
import { MIGRACOES } from '../../src/save/esquema';
import { Certificador } from '../../server/certificacao';
import { CONTEUDO } from '../apoio/fases';

const ctx = contextoDaArena();
const MIN = 60_000;

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function personagem(ajustar?: (p: PedidoDePersonagem) => void): PedidoDePersonagem {
  const e = criarJogador(obter(CONTEUDO.classes.get('guerreiro'), 'guerreiro'), 'j1', 1, 1, BALANCE_PADRAO);
  const p = obter(pedidoDoPersonagem(e), 'pedido');
  p.bolsa.personagemId = '0f9c7a2e-5a1b-4c3d-9e8f-1234567890ab';
  ajustar?.(p);
  return JSON.parse(JSON.stringify(p)) as PedidoDePersonagem;
}

/** Sobe o personagem `niveis` níveis pelo caminho legítimo (pontos de atributo e de habilidade por nível). */
function subir(p: PedidoDePersonagem, niveis: number): void {
  p.nivel += niveis;
  p.bolsa.pontosAtributo += niveis * BALANCE_PADRAO.xp.pontosPorNivel;
  p.bolsa.pontosHabilidade += niveis * BALANCE_PADRAO.habilidades.pontosPorNivel;
}

describe('assinatura', () => {
  it('o servidor certifica; o certificado confere o personagem igual e recusa o editado', () => {
    const c = new Certificador('chave-de-teste-com-tamanho');
    const p = personagem();
    const r = c.certificar(p, null, ctx, 1_000);
    if (!r.ok) throw new Error(r.motivo);
    expect(c.confere(p, r.certificado)).toBe(true);
    const editado = personagem((x) => (x.bolsa.ouro = 99_999));
    expect(c.confere(editado, r.certificado)).toBe(false);
    // Outra chave (outro servidor ou certificado forjado) não vale.
    expect(new Certificador('outra-chave-de-teste-123').confere(p, r.certificado)).toBe(false);
    // Assinatura adulterada.
    const forjado = { ...r.certificado, assinatura: r.certificado.assinatura.replace(/^./, (ch) => (ch === 'a' ? 'b' : 'a')) };
    expect(c.confere(p, forjado)).toBe(false);
    expect(lerCertificado({ retrato: {}, emitidoEm: 1, assinatura: 'curta' })).toBeNull();
  });

  it('ficha que não fecha não é certificada; sem identidade também não', () => {
    const c = new Certificador('chave-de-teste-com-tamanho');
    expect(c.certificar(personagem((p) => (p.bolsa.atributosBase.forca = 30)), null, ctx, 1)).toEqual({ ok: false, motivo: 'ficha_invalida' });
    expect(c.certificar(personagem((p) => (p.bolsa.personagemId = '')), null, ctx, 1)).toEqual({ ok: false, motivo: 'sem_id' });
  });

  it('sem certificado anterior, só até o nível sem histórico', () => {
    const c = new Certificador('chave-de-teste-com-tamanho');
    const limite = BALANCE_PADRAO.integridade.nivelSemHistorico;
    expect(c.certificar(personagem((p) => subir(p, limite - 1)), null, ctx, 1).ok).toBe(true);
    expect(c.certificar(personagem((p) => subir(p, limite)), null, ctx, 1)).toEqual({ ok: false, motivo: 'sem_historico' });
  });
});

describe('crescimento plausível', () => {
  it('o mesmo XP que é recusado em 1 minuto é aceito depois de horas de jogo', () => {
    const c = new Certificador('chave-de-teste-com-tamanho');
    const r1 = c.certificar(personagem(), null, ctx, 0);
    if (!r1.ok) throw new Error(r1.motivo);
    const forte = personagem((p) => subir(p, 6));
    expect(c.certificar(forte, r1.certificado, ctx, MIN)).toEqual({ ok: false, motivo: 'xp_demais' });
    const r2 = c.certificar(forte, r1.certificado, ctx, 3 * 60 * MIN);
    expect(r2.ok).toBe(true);
  });

  it('ouro e itens acima do teto são recusados; outro personagem também', () => {
    const b = BALANCE_PADRAO;
    const antes = personagem();
    const rico = personagem((p) => (p.bolsa.ouro += b.integridade.ouroPorMinuto * 2 + b.integridade.folgaOuro + 1));
    expect(avaliarCrescimento(antes, rico, 2, b, () => 0)).toEqual({ ok: false, motivo: 'ouro_demais' });
    const cheio = personagem((p) => {
      for (let i = 0; i < b.integridade.folgaItens + 3; i++) p.bolsa.mochila.push({ invId: `x${i}`, itemId: 'elmo_ferro', qtd: 1, ref: null });
    });
    expect(avaliarCrescimento(antes, cheio, 1, b, () => 0)).toEqual({ ok: false, motivo: 'itens_demais' });
    const outro = personagem((p) => (p.bolsa.personagemId = 'aaaaaaaa-0000-0000-0000-000000000000'));
    expect(avaliarCrescimento(antes, outro, 600, b, () => 0)).toEqual({ ok: false, motivo: 'outro_personagem' });
  });

  it('o tempo entre certificados tem teto; o XP total soma os níveis', () => {
    const b = BALANCE_PADRAO;
    expect(minutosEntre(0, 10 * 24 * 60 * MIN, b)).toBe(b.integridade.minutosMaxPorCertificado);
    expect(xpTotal(3, 5, b.xp)).toBe((b.xp.tabela[0] ?? 0) + (b.xp.tabela[1] ?? 0) + 5);
  });
});

describe('save v12', () => {
  it('a bolsa ganha personagemId vazio e o registro, certificado nulo', () => {
    const migrar = obter(MIGRACOES[11], 'v11→v12');
    const r = migrar({ versaoSchema: 11, estado: { entidades: [{ bolsa: { ouro: 3 } }, { bolsa: null }] } });
    expect(r.certificado).toBeNull();
    const entidades = (r.estado as { entidades: { bolsa: unknown }[] }).entidades;
    expect(entidades[0]?.bolsa).toEqual({ ouro: 3, personagemId: '' });
    expect(entidades[1]?.bolsa).toBeNull();
  });
});
