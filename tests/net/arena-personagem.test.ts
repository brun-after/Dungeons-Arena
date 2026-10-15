// Marco 17 (15/10/2026, D-063): o personagem da campanha na arena — com certificado válido entra inteiro (bolsa,
// nível, itens) e ganha recompensa; sem ele, a ficha de treino recortada; a faixa da sala; o certificado na saída;
// o teto de XP por hora.

import { describe, expect, it } from 'vitest';
import { versaoDoConteudo } from '../../src/arena/protocolo';
import { SalaArena } from '../../src/arena/sala';
import { pedidoDoPersonagem, type PedidoDePersonagem } from '../../src/coop/personagem';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { criarJogador } from '../../src/entities/fabrica';
import { faixaPorId } from '../../src/modos/regras';
import { Certificador } from '../../server/certificacao';
import { CONTEUDO } from '../apoio/fases';
import { conexaoDireta, ctxArena } from './apoio';

const versao = versaoDoConteudo();
const certificador = new Certificador('chave-de-teste-da-arena-123');

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function sala(faixa: string | null = '6-10'): SalaArena {
  const ctx = ctxArena();
  return new SalaArena(ctx, { semente: 4, versaoConteudo: versao, faixa: faixaPorId(ctx.modo, faixa), certificacao: certificador.paraSala(() => 1_000) });
}

/** Um personagem de nível `nivel`, com os pontos que os níveis dão, e um certificado da chave de teste. */
function certificado(nivel: number, classe = 'guerreiro', id = '11111111-2222-3333-4444-555555555555') {
  const e = criarJogador(obter(CONTEUDO.classes.get(classe), classe), 'j1', 1, 1, BALANCE_PADRAO);
  const p = obter(pedidoDoPersonagem(e), 'pedido');
  p.nivel = nivel;
  p.bolsa.pontosAtributo = (nivel - 1) * BALANCE_PADRAO.xp.pontosPorNivel;
  p.bolsa.personagemId = id;
  p.bolsa.ouro = 40;
  const retrato = JSON.parse(JSON.stringify(p)) as PedidoDePersonagem;
  return certificador.assinar(retrato, 1_000);
}

function entrar(s: SalaArena, pedidoFicha: unknown) {
  const c = conexaoDireta(s);
  c.enviar({ t: 'entrar', nome: 'x', pedidoFicha, versaoConteudo: versao });
  const bem = c.de('bemVindo')[0];
  return { ...c, bem, entidade: () => (bem ? buscarEntidade(s.estado, bem.entidadeId) : undefined) };
}

const rodar = (s: SalaArena, n: number) => {
  for (let i = 0; i < n; i++) s.tick(DT_MS);
};

describe('entrada na arena com o personagem', () => {
  it('certificado válido: entra inteiro (nível, bolsa) e recebe a própria bolsa no canal privado', () => {
    const s = sala();
    const j = entrar(s, { certificado: certificado(7) });
    const e = obter(j.entidade(), 'entidade');
    expect(e.nivel).toBe(7);
    expect(e.bolsa?.ouro).toBe(40);
    expect(e.xpBase).toBe(7 * (s.ctx.modo.recompensaJogador?.xpPorNivel ?? 0));
    rodar(s, 3);
    expect(j.de('privado').at(-1)?.bolsa?.personagemId).toBe('11111111-2222-3333-4444-555555555555');
  });

  it('certificado forjado ou ausente: ficha de treino recortada, sem bolsa e sem canal privado', () => {
    const s = sala(null);
    const cert = certificado(7);
    const forjado = { ...cert, retrato: { ...cert.retrato, nivel: 20 } };
    const j = entrar(s, { certificado: forjado, classeId: 'guerreiro', nivel: 7 });
    const e = obter(j.entidade(), 'entidade');
    expect(e.bolsa).toBeNull();
    expect(e.nivel).toBeLessThanOrEqual(s.ctx.modo.clamp?.nivelMax ?? 10);
    rodar(s, 3);
    expect(j.de('privado')).toHaveLength(0);
  });

  it('fora da faixa da sala, a entrada é recusada com motivo', () => {
    const s = sala('6-10');
    const j = entrar(s, { certificado: certificado(3) });
    expect(j.de('erro')).toEqual([{ t: 'erro', motivo: 'fora_da_faixa' }]);
  });
});

describe('recompensa e certificado na saída', () => {
  it('derrotar um jogador certificado dá XP; o certificado da saída confere com a ficha da sala', () => {
    const s = sala();
    const a = entrar(s, { certificado: certificado(7, 'guerreiro', 'aaaaaaaa-0000-0000-0000-000000000001') });
    const b = entrar(s, { certificado: certificado(8, 'mago', 'bbbbbbbb-0000-0000-0000-000000000002') });
    const ea = obter(a.entidade(), 'a');
    const eb = obter(b.entidade(), 'b');
    const xpAntes = ea.xp;
    eb.hp = 0;
    eb.participacao.push({ id: ea.id, tick: s.estado.tick });
    rodar(s, 2);
    expect(a.de('eventos').flatMap((m) => m.eventos).some((ev) => ev.t === 'xpGanho' && ev.id === ea.id)).toBe(true);
    expect(ea.xp + ea.nivel * 1000).toBeGreaterThan(xpAntes + 7 * 1000);

    a.enviar({ t: 'pedirCertificado' });
    const cert = obter(a.de('certificado').at(-1)?.certificado, 'certificado');
    expect(certificador.confere(pedidoDoPersonagem(ea), cert)).toBe(true);
    expect(cert.retrato.bolsa.personagemId).toBe('aaaaaaaa-0000-0000-0000-000000000001');
  });

  it('quem entrou com ficha de treino não recebe certificado', () => {
    const s = sala(null);
    const j = entrar(s, { classeId: 'aventureiro' });
    j.enviar({ t: 'pedirCertificado' });
    expect(j.de('certificado')).toEqual([{ t: 'certificado', certificado: null }]);
  });

  it('passou do teto de XP por hora, os abates seguintes não dão XP', () => {
    const s = sala();
    const a = entrar(s, { certificado: certificado(7, 'guerreiro', 'aaaaaaaa-0000-0000-0000-000000000001') });
    const ea = obter(a.entidade(), 'a');
    // Ganho artificial acima do teto (com a folga de 10 min): a sala nota no próximo segundo.
    ea.xp += (s.ctx.modo.recompensaJogador?.tetoXpPorHora ?? 0) + 1;
    rodar(s, 61);
    const b = entrar(s, { certificado: certificado(8, 'mago', 'bbbbbbbb-0000-0000-0000-000000000002') });
    const eb = obter(b.entidade(), 'b');
    eb.hp = 0;
    eb.participacao.push({ id: ea.id, tick: s.estado.tick });
    rodar(s, 2);
    const ganhos = a.de('eventos').flatMap((m) => m.eventos).filter((ev) => ev.t === 'xpGanho' && ev.id === ea.id);
    expect(ganhos).toHaveLength(0);
  });
});
