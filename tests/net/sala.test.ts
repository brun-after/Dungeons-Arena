import { describe, expect, it } from 'vitest';
import { MAX_BYTES_MENSAGEM, versaoDoConteudo } from '../../src/arena/protocolo';
import { BURST_COMANDOS } from '../../src/arena/sala';
import { buscarEntidade } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { ticksDe } from '../../src/core/tempo';
import { largarObjeto } from '../../src/world/objetos';
import { conexaoDireta, novaSala } from './apoio';

const versao = versaoDoConteudo();

function entrar(sala: ReturnType<typeof novaSala>, pedidoFicha: unknown = { classeId: 'aventureiro' }) {
  const c = conexaoDireta(sala);
  c.enviar({ t: 'entrar', nome: 'Teste', pedidoFicha, versaoConteudo: versao });
  const bem = c.de('bemVindo')[0];
  if (!bem) throw new Error(`não entrou: ${JSON.stringify(c.recebidas)}`);
  let seq = 0;
  const cmd = (comando: unknown, extra: Record<string, unknown> = {}) => {
    seq++;
    c.enviar({ t: 'cmd', pacote: { sessaoId: bem.sessaoId, epocaSala: bem.epocaSala, seq, tickCliente: sala.estado.tick, cmd: comando, ...extra } });
    return seq;
  };
  return { ...c, bem, cmd, entidade: () => buscarEntidade(sala.estado, bem.entidadeId) };
}

describe('entrada na sala', () => {
  it('ficha adulterada é cortada e a prévia lista o que mudou', () => {
    const sala = novaSala();
    const j = entrar(sala, { classeId: 'aventureiro', atributos: { forca: 99 }, hpMax: 9999 });
    expect(j.bem.previa.alteracoes.map((a) => a.campo)).toEqual(expect.arrayContaining(['atributos.forca', 'hpMax']));
    expect(j.entidade()?.atributos.forca).toBeLessThanOrEqual(16);
    expect(j.entidade()?.equipe).toBe(`jogador:jogador-1`);
  });

  it('versão de conteúdo diferente e sala cheia são recusadas com motivo', () => {
    const sala = novaSala();
    const errada = conexaoDireta(sala);
    errada.enviar({ t: 'entrar', nome: 'x', pedidoFicha: {}, versaoConteudo: 'outra' });
    expect(errada.de('erro')).toEqual([{ t: 'erro', motivo: 'versao_conteudo' }]);
    for (let i = 0; i < 10; i++) entrar(sala);
    const decima1 = conexaoDireta(sala);
    decima1.enviar({ t: 'entrar', nome: 'x', pedidoFicha: {}, versaoConteudo: versao });
    expect(decima1.de('erro')).toEqual([{ t: 'erro', motivo: 'sala_cheia' }]);
  });
});

describe('validação de comandos (§3.6)', () => {
  it('reenvio do mesmo seq não reaplica (deduplicação)', () => {
    const sala = novaSala();
    const j = entrar(sala);
    const pacote = { sessaoId: j.bem.sessaoId, epocaSala: 1, seq: 1, tickCliente: 0, cmd: { t: 'usarHabilidade', id: 'curar' } };
    j.enviar({ t: 'cmd', pacote });
    j.enviar({ t: 'cmd', pacote });
    sala.tick(DT_MS);
    const eventos = j.de('eventos').flatMap((m) => m.eventos);
    expect(eventos.filter((e) => e.t === 'acaoIniciada')).toHaveLength(1);
    expect(eventos.filter((e) => e.t === 'acaoRecusada')).toHaveLength(0);
  });

  it(`limite de taxa: burst de ${BURST_COMANDOS}, o excesso é rejeitado com motivo`, () => {
    const sala = novaSala();
    const j = entrar(sala);
    for (let i = 0; i < 30; i++) j.cmd({ t: 'mover', dir: 'E' });
    expect(j.de('rejeitado').filter((r) => r.motivo === 'taxa')).toHaveLength(30 - BURST_COMANDOS);
    // Recarrega com o tempo: 1 s depois, aceita de novo.
    for (let i = 0; i < 60; i++) sala.tick(DT_MS);
    const antes = j.de('rejeitado').length;
    j.cmd({ t: 'mover', dir: 'O' });
    expect(j.de('rejeitado')).toHaveLength(antes);
  });

  it('mensagem grande, JSON inválido, número nulo e comando desconhecido são rejeitados', () => {
    const sala = novaSala();
    const j = entrar(sala);
    j.enviar('x'.repeat(MAX_BYTES_MENSAGEM + 1));
    j.enviar('{nao é json');
    j.enviar({ t: 'cmd', pacote: { sessaoId: j.bem.sessaoId, epocaSala: 1, seq: 1, tickCliente: null, cmd: { t: 'mover', dir: 'E' } } });
    j.cmd({ t: 'voar' });
    j.cmd({ t: 'irPara', x: 1e9, y: 2 }); // marco 26: fração vale, fora do mapa não
    expect(j.de('rejeitado').map((r) => r.motivo)).toEqual(['grande_demais', 'json_invalido', 'malformada', 'malformada', 'malformada']);
  });

  it('o jogador vem da sessão: pacote com sessão de outro é rejeitado', () => {
    const sala = novaSala();
    const a = entrar(sala);
    const b = entrar(sala);
    a.cmd({ t: 'mover', dir: 'E' }, { sessaoId: b.bem.sessaoId });
    expect(a.de('rejeitado')).toMatchObject([{ motivo: 'sessao' }]);
  });

  it('época antiga é rejeitada', () => {
    const sala = novaSala();
    const j = entrar(sala);
    j.cmd({ t: 'mover', dir: 'E' }, { epocaSala: 99 });
    expect(j.de('rejeitado')).toMatchObject([{ motivo: 'epoca' }]);
  });

  it('movimento mantido sem renovação expira em 500 ms', () => {
    const sala = novaSala();
    const j = entrar(sala);
    const inicio = j.entidade()?.x ?? 0;
    j.cmd({ t: 'mover', dir: 'E' });
    for (let i = 0; i < ticksDe(3000); i++) sala.tick(DT_MS);
    const andou = Math.abs((j.entidade()?.x ?? 0) - inicio);
    // 2,5 células/s: em ~0,5 s anda 1–2 células; sem a expiração seriam 7.
    expect(andou).toBeGreaterThan(0);
    expect(andou).toBeLessThanOrEqual(3);
  });

  it('métricas da sala são acumuladas: não caem quando um jogador sai', () => {
    const sala = novaSala();
    const a = entrar(sala);
    entrar(sala);
    for (let i = 0; i < 30; i++) sala.tick(DT_MS);
    const antes = sala.metricas().bytesEnviados;
    expect(antes).toBeGreaterThan(0);
    a.conexao.encerrar();
    expect(sala.metricas().bytesEnviados).toBe(antes);
    expect(sala.metricas().jogadores).toBe(1);
  });

  it('o criador da sala não tem prioridade: orbe disputado vai para os dois ao longo dos ticks', () => {
    const vencedores = new Set<string>();
    for (let t = 0; t < 6; t++) {
      const sala = novaSala(t + 1);
      const a = entrar(sala);
      const b = entrar(sala);
      for (let i = 0; i < t; i++) sala.tick(DT_MS);
      for (const j of [a, b]) {
        const e = j.entidade();
        if (!e) continue;
        e.x = 6;
        e.y = 6;
        e.hp = 1;
      }
      sala.estado.objetos = [];
      largarObjeto(sala.estado, 'orbe_hp', 6, 6, 30, 'pct', []);
      sala.tick(DT_MS);
      const coletas = a.de('eventos').flatMap((m) => m.eventos).filter((e) => e.t === 'coletou');
      expect(coletas).toHaveLength(1);
      if (coletas[0]?.t === 'coletou') vencedores.add(coletas[0].id);
    }
    expect(vencedores.size).toBe(2);
  });
});
