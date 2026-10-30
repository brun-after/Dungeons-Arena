// Marco 29 (30/10/2026, D-128): a área de interesse do Mundo (cada sessão vê só o que está perto) e a IA que dorme
// longe dos jogadores.

import { describe, expect, it } from 'vitest';
import { recortarPorInteresse } from '../../src/arena/interesse';
import { estadoPublico } from '../../src/arena/estado-publico';
import { aplicarPatch, GeradorDePatches, novoCacheDeCampos } from '../../src/arena/patches';
import { versaoDoConteudo, type MensagemServidor } from '../../src/arena/protocolo';
import { SalaArena } from '../../src/arena/sala';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade, type EstadoJogo } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { filtroDeAtivacao } from '../../src/entities/ia';
import { carregarFase } from '../../src/world/fase';
import { gerarExterior } from '../../src/world/gerador-exterior';
import { CONTEUDO, contexto } from '../apoio/fases';
import { conexaoDireta } from './apoio';

function salaDoMundo(regiaoId: string): SalaArena {
  const reino = CONTEUDO.reinos.get('reino_central');
  const regiao = reino?.regioes.find((r) => r.id === regiaoId);
  if (!reino || !regiao) throw new Error('reino ausente');
  const ctx = contexto(carregarFase(gerarExterior(reino, regiao).fase), BALANCE_PADRAO, 'mundo');
  return new SalaArena(ctx, { semente: 3, versaoConteudo: versaoDoConteudo() });
}

function entrar(sala: SalaArena) {
  const c = conexaoDireta(sala);
  c.enviar({ t: 'entrar', nome: 'x', pedidoFicha: { classeId: 'guerreiro' }, versaoConteudo: versaoDoConteudo() });
  const bem = c.de('bemVindo')[0];
  if (!bem) throw new Error(`não entrou: ${JSON.stringify(c.recebidas)}`);
  return { ...c, bem };
}

/** Reconstrói o que o cliente vê a partir do completo e dos patches recebidos. */
function visto(recebidas: readonly MensagemServidor[]): EstadoJogo | null {
  let estado: EstadoJogo | null = null;
  for (const m of recebidas) {
    if (m.t === 'estado') estado = m.estado;
    if (m.t === 'patch' && estado) estado = aplicarPatch(estado, m.patch);
  }
  return estado;
}

describe('área de interesse do Mundo', () => {
  it('o recorte mantém a própria entidade e corta o que está longe', () => {
    const sala = salaDoMundo('campos_do_oeste');
    const a = entrar(sala);
    const publico = estadoPublico(sala.estado);
    const recorte = recortarPorInteresse(publico, a.bem.entidadeId, 24);
    expect(recorte.entidades.some((e) => e.id === a.bem.entidadeId)).toBe(true);
    expect(recorte.entidades.length).toBeLessThan(publico.entidades.length);
    const eu = buscarEntidade(sala.estado, a.bem.entidadeId);
    if (!eu) throw new Error('sem entidade');
    for (const e of recorte.entidades) expect(Math.max(Math.abs(e.x - eu.x), Math.abs(e.y - eu.y))).toBeLessThanOrEqual(24);
  });

  it('duas sessões se veem perto; longe, uma some da outra pelo patch e volta ao chegar perto', () => {
    const sala = salaDoMundo('vila_do_centro');
    const a = entrar(sala);
    const b = entrar(sala);
    const rodar = (n: number) => {
      for (let i = 0; i < n; i++) sala.tick(DT_MS);
    };
    rodar(6);
    expect(visto(a.recebidas)?.entidades.some((e) => e.id === b.bem.entidadeId)).toBe(true);
    const eb = buscarEntidade(sala.estado, b.bem.entidadeId);
    if (!eb) throw new Error('sem b');
    // Leva B para longe (direto no estado do servidor, como uma passagem de região faria).
    eb.x = 5;
    eb.y = 64;
    eb.px = 5;
    eb.py = 64;
    rodar(6);
    const deA = visto(a.recebidas);
    expect(deA?.entidades.some((e) => e.id === b.bem.entidadeId)).toBe(false);
    expect(deA?.entidades.some((e) => e.id === a.bem.entidadeId)).toBe(true);
    const ea = buscarEntidade(sala.estado, a.bem.entidadeId);
    if (!ea) throw new Error('sem a');
    eb.x = ea.x + 2;
    eb.y = ea.y;
    eb.px = eb.x;
    eb.py = eb.y;
    rodar(6);
    expect(visto(a.recebidas)?.entidades.some((e) => e.id === b.bem.entidadeId)).toBe(true);
  });
});

describe('IA com ativação', () => {
  it('só acorda quem está no raio de algum jogador; sem raio, todas', () => {
    const sala = salaDoMundo('bosque_do_sul');
    const a = entrar(sala);
    const eu = buscarEntidade(sala.estado, a.bem.entidadeId);
    if (!eu) throw new Error('sem entidade');
    const filtro = filtroDeAtivacao(sala.estado, 32);
    const inimigos = sala.estado.entidades.filter((e) => e.controlador === 'ia');
    expect(inimigos.length).toBeGreaterThan(10);
    const acordados = inimigos.filter(filtro);
    expect(acordados.length).toBeLessThan(inimigos.length);
    for (const e of acordados) expect(Math.max(Math.abs(e.x - eu.x), Math.abs(e.y - eu.y))).toBeLessThanOrEqual(32);
    expect(inimigos.every(filtroDeAtivacao(sala.estado, undefined))).toBe(true);
  });

  it('o inimigo longe fica parado enquanto o tempo passa', () => {
    const sala = salaDoMundo('bosque_do_sul');
    const a = entrar(sala);
    const eu = buscarEntidade(sala.estado, a.bem.entidadeId);
    if (!eu) throw new Error('sem entidade');
    const longe = sala.estado.entidades.filter((e) => e.controlador === 'ia' && Math.max(Math.abs(e.x - eu.x), Math.abs(e.y - eu.y)) > 60);
    expect(longe.length).toBeGreaterThan(0);
    const antes = longe.map((e) => `${e.id}:${e.x},${e.y}`);
    for (let i = 0; i < 600; i++) sala.tick(DT_MS);
    const depois = longe.map((e) => {
      const x = buscarEntidade(sala.estado, e.id);
      return `${e.id}:${x?.x},${x?.y}`;
    });
    expect(depois).toEqual(antes);
  });

  it('o cache da transmissão não muda o patch de nenhuma sessão (só evita refazer o trabalho)', () => {
    const sala = salaDoMundo('campos_do_oeste');
    entrar(sala);
    entrar(sala);
    const ids = sala.estado.entidades.filter((e) => e.controlador === 'remoto').map((e) => e.id);
    const comCache = ids.map(() => new GeradorDePatches());
    const semCache = ids.map(() => new GeradorDePatches());
    for (let k = 0; k < 20; k++) {
      for (let i = 0; i < 6; i++) sala.tick(DT_MS);
      const publico = estadoPublico(sala.estado);
      const cache = novoCacheDeCampos();
      ids.forEach((id, i) => {
        const visao = recortarPorInteresse(publico, id, 24);
        expect(comCache[i]?.gerar(visao, cache)).toEqual(semCache[i]?.gerar(visao));
      });
    }
  });
});
