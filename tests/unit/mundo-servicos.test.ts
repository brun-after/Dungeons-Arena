// Marco 30 (30/10/2026, D-129): os serviços do Mundo entre salas, no coordenador: o grupo (convite pelo nome,
// aceite, chat do grupo, saída) com os membros em salas diferentes, e o mercado do reino (anunciar, comprar com o
// preço certo, devolver a reserva quando falha, receber no banco, entregar na ficha guardada de quem saiu).

import { describe, expect, it } from 'vitest';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import type { ItemNaMochila } from '../../src/entities/entidade';
import type { AcaoDoMundo } from '../../src/mundo/acoes';
import type { AvisoDoMundo } from '../../src/mundo/avisos';
import { fichaNova, type FichaDoMundo } from '../../src/mundo/ficha-mundo';
import { liquidoDaVenda } from '../../src/mundo/mercado';
import type { AcaoSocial, ResultadoDoMercado } from '../../src/mundo/pendencias';
import { PersistenciaEmMemoria } from '../../server/persistencia-mundo';
import { atenderMercado, atenderSocial } from '../../server/mundo-servicos';
import { CoordenadorDoMundo } from '../../server/salas/sala-mundo';
import { CONTEUDO } from '../apoio/fases';

function ficha(nome: string): FichaDoMundo {
  const reino = CONTEUDO.reinos.get('reino_central');
  const f = reino ? fichaNova({ conteudo: CONTEUDO, balance: BALANCE_PADRAO }, reino, 'mago', nome, `pers-${nome}`) : null;
  if (!f) throw new Error('ficha');
  return f;
}

/** Uma sala de mentira: guarda o que o coordenador entrega a cada um. */
class SalaFalsa {
  readonly avisos = new Map<string, AvisoDoMundo[]>();
  readonly grupos = new Map<string, string | null>();
  readonly mercado = new Map<string, ResultadoDoMercado[]>();
  constructor(readonly presentes: Set<string>) {}
  liberarCaida(): FichaDoMundo | null {
    return null;
  }
  entregar(id: string, aviso: AvisoDoMundo): boolean {
    if (!this.presentes.has(id)) return false;
    this.avisos.set(id, [...(this.avisos.get(id) ?? []), aviso]);
    return true;
  }
  definirGrupo(id: string, grupo: string | null): boolean {
    if (!this.presentes.has(id)) return false;
    this.grupos.set(id, grupo);
    return true;
  }
  concluirMercado(id: string, r: ResultadoDoMercado): boolean {
    if (!this.presentes.has(id)) return false;
    this.mercado.set(id, [...(this.mercado.get(id) ?? []), r]);
    return true;
  }
  ultimo<T extends AvisoDoMundo['tipo']>(id: string, tipo: T): Extract<AvisoDoMundo, { tipo: T }> | undefined {
    return (this.avisos.get(id) ?? []).filter((a): a is Extract<AvisoDoMundo, { tipo: T }> => a.tipo === tipo).at(-1);
  }
}

const ANA = 'local:ana#1';
const BIA = 'local:bia#1';

/** O coordenador com a Ana na vila e a Bia nos campos. */
function montar() {
  const persistencia = new PersistenciaEmMemoria();
  const c = new CoordenadorDoMundo(persistencia, CONTEUDO);
  const vila = new SalaFalsa(new Set([ANA]));
  const campos = new SalaFalsa(new Set([BIA]));
  c.registrarSala('vila', vila);
  c.registrarSala('campos', campos);
  c.entrar(ANA, 'vila');
  c.entrar(BIA, 'campos');
  c.registrarPerfil(ANA, ficha('Ana'), 'regiao:vila_do_centro');
  c.registrarPerfil(BIA, ficha('Bia'), 'regiao:campos_do_oeste');
  const social = (identidade: string, nome: string, acao: AcaoSocial) => {
    atenderSocial(c, { tipo: 'social', identidade, nome, lugar: 'x', acao });
  };
  const mercado = (identidade: string, nome: string, acao: Extract<AcaoDoMundo, { a: 'mercado' }>, reserva: { item: ItemNaMochila | null; ouro: number }) =>
    atenderMercado(c, { tipo: 'mercado', identidade, nome, acao, reserva });
  return { persistencia, c, vila, campos, social, mercado };
}

describe('o grupo entre salas', () => {
  it('convite pelo nome, aceite, chat do grupo e saída, com cada um na sua sala', () => {
    const { c, vila, campos, social } = montar();
    social(ANA, 'Ana', { a: 'grupo', op: 'convidar', nome: 'ninguém' });
    expect(vila.ultimo(ANA, 'recusa')).toEqual({ tipo: 'recusa', motivo: 'nao_encontrado' });
    social(ANA, 'Ana', { a: 'grupo', op: 'convidar', nome: 'bia' });
    const convite = campos.ultimo(BIA, 'convite');
    expect(convite).toMatchObject({ de: 'Ana' });
    social(BIA, 'Bia', { a: 'grupo', op: 'aceitar', grupo: convite?.grupo ?? '' });
    const g = c.grupos.grupoDe(ANA);
    expect(g?.membros).toEqual([ANA, BIA]);
    expect(vila.grupos.get(ANA)).toBe(g?.id);
    expect(campos.grupos.get(BIA)).toBe(g?.id);
    expect(campos.ultimo(BIA, 'grupo')?.membros).toEqual([
      expect.objectContaining({ nome: 'Ana', lider: true, lugar: 'regiao:vila_do_centro' }),
      expect.objectContaining({ nome: 'Bia', lider: false, lugar: 'regiao:campos_do_oeste' }),
    ]);
    social(BIA, 'Bia', { a: 'chat', canal: 'grupo', texto: 'vem pro oeste' });
    expect(vila.ultimo(ANA, 'chat')).toEqual({ tipo: 'chat', canal: 'grupo', de: 'Bia', texto: 'vem pro oeste' });
    // O grupo de dois se desfaz quando um sai: os dois ficam sem grupo.
    social(BIA, 'Bia', { a: 'grupo', op: 'sair' });
    expect(c.grupos.grupoDe(ANA)).toBeUndefined();
    expect(vila.grupos.get(ANA)).toBeNull();
    expect(campos.grupos.get(BIA)).toBeNull();
    social(ANA, 'Ana', { a: 'chat', canal: 'grupo', texto: 'oi' });
    expect(vila.ultimo(ANA, 'recusa')).toEqual({ tipo: 'recusa', motivo: 'sem_grupo' });
  });

  it('quem sai do jogo deixa o grupo', () => {
    const { c, campos, social } = montar();
    social(ANA, 'Ana', { a: 'grupo', op: 'convidar', nome: 'Bia' });
    social(BIA, 'Bia', { a: 'grupo', op: 'aceitar', grupo: campos.ultimo(BIA, 'convite')?.grupo ?? '' });
    c.sair(ANA);
    c.saiuDoJogo(ANA);
    expect(c.grupos.grupoDe(BIA)).toBeUndefined();
    expect(campos.ultimo(BIA, 'grupo')).toEqual({ tipo: 'grupo', id: null, membros: [] });
  });
});

describe('o mercado do reino', () => {
  const prata: ItemNaMochila = { invId: 'i1', itemId: 'minerio_prata', qtd: 2, ref: null };
  const regras = BALANCE_PADRAO.mundo.mercado;

  it('anunciar, comprar com o preço certo e receber a venda no banco', async () => {
    const { c, vila, campos, mercado } = montar();
    await mercado(ANA, 'Ana', { a: 'mercado', op: 'anunciar', invId: 'i1', qtd: 2, preco: 200 }, { item: prata, ouro: 4 });
    const quadro = campos.ultimo(BIA, 'mercado') ?? vila.ultimo(ANA, 'mercado');
    expect(quadro?.meus).toHaveLength(1);
    const anuncio = (await c.mercado.ativos(Date.now()))[0];
    if (!anuncio) throw new Error('anúncio');
    // A própria vendedora não compra; o preço errado (o anúncio mudou) é recusado e devolve a reserva.
    await mercado(BIA, 'Bia', { a: 'mercado', op: 'comprar', id: anuncio.id, preco: 150 }, { item: null, ouro: 150 });
    expect(campos.ultimo(BIA, 'recusa')).toEqual({ tipo: 'recusa', motivo: 'anuncio_indisponivel' });
    expect(campos.mercado.get(BIA)?.at(-1)).toEqual({ itens: [], ouro: 150, ouroNoBanco: 0 });
    await mercado(BIA, 'Bia', { a: 'mercado', op: 'comprar', id: anuncio.id, preco: 200 }, { item: null, ouro: 200 });
    expect(campos.mercado.get(BIA)?.at(-1)).toEqual({ itens: [expect.objectContaining({ itemId: 'minerio_prata', qtd: 2 })], ouro: 0, ouroNoBanco: 0 });
    // A segunda compra do mesmo anúncio não leva.
    await mercado(BIA, 'Bia', { a: 'mercado', op: 'comprar', id: anuncio.id, preco: 200 }, { item: null, ouro: 200 });
    expect(campos.mercado.get(BIA)?.at(-1)).toEqual({ itens: [], ouro: 200, ouroNoBanco: 0 });
    expect(vila.ultimo(ANA, 'mercado')?.aReceber ?? 0).toBe(0);
    await mercado(ANA, 'Ana', { a: 'mercado', op: 'listar', pagina: 0, busca: '' }, { item: null, ouro: 0 });
    expect(vila.ultimo(ANA, 'mercado')?.aReceber).toBe(liquidoDaVenda(200, regras));
    await mercado(ANA, 'Ana', { a: 'mercado', op: 'receber' }, { item: null, ouro: 0 });
    expect(vila.mercado.get(ANA)?.at(-1)).toEqual({ itens: [], ouro: 0, ouroNoBanco: liquidoDaVenda(200, regras) });
  });

  it('o anúncio cancelado devolve o item; o limite de anúncios devolve a reserva', async () => {
    const { c, vila, mercado } = montar();
    for (let i = 0; i < regras.anunciosPorPersonagem; i++) {
      await mercado(ANA, 'Ana', { a: 'mercado', op: 'anunciar', invId: 'i1', qtd: 1, preco: 10 + i }, { item: { ...prata, qtd: 1 }, ouro: 1 });
    }
    await mercado(ANA, 'Ana', { a: 'mercado', op: 'anunciar', invId: 'i1', qtd: 1, preco: 99 }, { item: { ...prata, qtd: 1 }, ouro: 2 });
    expect(vila.ultimo(ANA, 'recusa')).toEqual({ tipo: 'recusa', motivo: 'mercado_cheio' });
    expect(vila.mercado.get(ANA)?.at(-1)).toEqual({ itens: [expect.objectContaining({ qtd: 1 })], ouro: 2, ouroNoBanco: 0 });
    const um = (await c.mercado.doVendedor(ANA))[0];
    await mercado(ANA, 'Ana', { a: 'mercado', op: 'cancelar', id: um?.id ?? '' }, { item: null, ouro: 0 });
    expect(vila.mercado.get(ANA)?.at(-1)).toEqual({ itens: [expect.objectContaining({ itemId: 'minerio_prata' })], ouro: 0, ouroNoBanco: 0 });
    expect(await c.mercado.doVendedor(ANA)).toHaveLength(regras.anunciosPorPersonagem - 1);
  });

  it('quem saiu do jogo recebe no banco da ficha guardada', async () => {
    const { c, persistencia, vila, mercado } = montar();
    await persistencia.gravar('local:ana', 1, ficha('Ana'));
    vila.presentes.delete(ANA);
    c.sair(ANA);
    await mercado(ANA, 'Ana', { a: 'mercado', op: 'comprar', id: 'nenhum', preco: 70 }, { item: null, ouro: 70 });
    const f = await persistencia.carregar('local:ana', 1);
    expect(f?.banco.ouro).toBe(70);
  });
});
