// Os serviços do Mundo que passam entre salas (marco 30, 30/10/2026, D-129), atendidos pelo servidor a partir das
// pendências que as salas deixam:
// - o grupo (convite pelo nome, aceite, saída, expulsão): os grupos ficam no coordenador; cada membro recebe o grupo
//   na sala onde está, e a entidade passa a levá-lo;
// - o chat do grupo e a denúncia (que vai para o log, com o lugar);
// - o mercado do reino: anunciar, comprar, cancelar e receber, sobre a loja de anúncios. A sala já reservou o que o
//   pedido precisa; se o pedido falha, a reserva volta. O que é entregue vai pela sala onde a pessoa estiver, ou para
//   o banco da ficha se ela saiu do jogo.

import { randomUUID } from 'node:crypto';
import { BALANCE_PADRAO } from '../src/core/contexto';
import type { AvisoDoMundo, MembroVisto, MotivoDoMundo } from '../src/mundo/avisos';
import { limparTexto } from '../src/mundo/chat';
import type { GrupoDoMundo } from '../src/mundo/grupos';
import { anuncioVisto, aReceber, casaBusca, liquidoDaVenda, type Anuncio } from '../src/mundo/mercado';
import type { PendenciaDoMundo, ResultadoDoMercado } from '../src/mundo/pendencias';
import { registrarLog } from './metricas';
import type { CoordenadorDoMundo } from './salas/sala-mundo';

type Social = Extract<PendenciaDoMundo, { tipo: 'social' }>;
type PedidoDoMercado = Extract<PendenciaDoMundo, { tipo: 'mercado' }>;

const recusa = (motivo: MotivoDoMundo): AvisoDoMundo => ({ tipo: 'recusa', motivo });

/** O grupo como os membros o veem (o nome, a classe, o nível e onde cada um está). */
function avisoDoGrupo(c: CoordenadorDoMundo, g: GrupoDoMundo | null): AvisoDoMundo {
  const membros: MembroVisto[] = (g?.membros ?? []).map((id) => {
    const p = c.perfil(id);
    return { nome: p?.nome ?? '?', classeId: p?.classeId ?? '', nivel: p?.nivel ?? 1, lugar: c.lugarDe(id), lider: g?.lider === id };
  });
  return { tipo: 'grupo', id: g?.id ?? null, membros };
}

/** Avisa e marca a entidade de cada membro (e de quem saiu, sem grupo). */
export function publicarGrupo(c: CoordenadorDoMundo, g: GrupoDoMundo | null, fora: readonly string[] = []): void {
  const aviso = avisoDoGrupo(c, g);
  for (const id of g?.membros ?? []) {
    c.definirGrupoDe(id, g?.id ?? null);
    c.entregarA(id, aviso);
  }
  for (const id of fora) {
    c.definirGrupoDe(id, null);
    c.entregarA(id, avisoDoGrupo(c, null));
  }
}

export function atenderSocial(c: CoordenadorDoMundo, p: Social): void {
  const quem = p.identidade;
  const acao = p.acao;
  const agora = Date.now();
  if (acao.a === 'chat') {
    const g = c.grupos.grupoDe(quem);
    if (!g) {
      c.entregarA(quem, recusa('sem_grupo'));
      return;
    }
    for (const id of g.membros) c.entregarA(id, { tipo: 'chat', canal: 'grupo', de: p.nome, texto: acao.texto });
    return;
  }
  if (acao.a === 'denunciar') {
    registrarLog('mundo_denuncia', { lugar: p.lugar, alvo: limparTexto(acao.nome, 40), motivo: limparTexto(acao.motivo, 200) });
    c.entregarA(quem, recusa('denuncia_registrada'));
    return;
  }
  if (acao.op === 'convidar') {
    const alvo = c.porNome(acao.nome);
    const r = alvo ? c.grupos.convidar(quem, alvo, agora) : 'nao_encontrado';
    if (typeof r === 'string' || !alvo) c.entregarA(quem, recusa(typeof r === 'string' ? r : 'nao_encontrado'));
    else c.entregarA(alvo, { tipo: 'convite', grupo: r.convite, de: p.nome });
  } else if (acao.op === 'aceitar') {
    const r = c.grupos.aceitar(quem, acao.grupo, agora);
    if (typeof r === 'string') c.entregarA(quem, recusa(r));
    else publicarGrupo(c, r);
  } else if (acao.op === 'sair') {
    const r = c.grupos.sair(quem);
    if (!r) c.entregarA(quem, recusa('sem_grupo'));
    else publicarGrupo(c, r.desfeito ? null : r.grupo, r.desfeito ? [quem, ...r.grupo.membros] : [quem]);
  } else {
    const alvo = c.grupos.grupoDe(quem)?.membros.find((id) => c.perfil(id)?.nome.toLowerCase() === acao.nome.toLowerCase());
    const r = alvo ? c.grupos.expulsar(quem, alvo) : 'nao_encontrado';
    if (typeof r === 'string' || !alvo) c.entregarA(quem, recusa(typeof r === 'string' ? r : 'nao_encontrado'));
    else publicarGrupo(c, r.desfeito ? null : r.grupo, r.desfeito ? [alvo, ...r.grupo.membros] : [alvo]);
  }
}

const VAZIO: ResultadoDoMercado = { itens: [], ouro: 0, ouroNoBanco: 0 };

/** A reserva de volta (o pedido falhou). */
const devolucao = (p: PedidoDoMercado): ResultadoDoMercado => ({ itens: p.reserva.item ? [p.reserva.item] : [], ouro: p.reserva.ouro, ouroNoBanco: 0 });

/** O quadro do mercado para quem pediu: a página da busca e os anúncios dele. */
async function avisoDoMercado(c: CoordenadorDoMundo, quem: string, pagina: number, busca: string): Promise<AvisoDoMundo> {
  const agora = Date.now();
  const porPagina = BALANCE_PADRAO.mundo.mercado.pagina;
  const nome = (id: string) => c.conteudo.itens.get(id)?.nome ?? id;
  const ativos = (await c.mercado.ativos(agora)).filter((a) => casaBusca(a, busca, nome(a.item.itemId)));
  const meus = await c.mercado.doVendedor(quem);
  return {
    tipo: 'mercado',
    anuncios: ativos.slice(pagina * porPagina, (pagina + 1) * porPagina).map((a) => anuncioVisto(a, false)),
    pagina,
    total: ativos.length,
    meus: meus.map((a) => anuncioVisto(a, true)),
    aReceber: meus.filter((a) => a.estado === 'vendido').reduce((s, a) => s + a.liquido, 0),
  };
}

export async function atenderMercado(c: CoordenadorDoMundo, p: PedidoDoMercado): Promise<void> {
  const quem = p.identidade;
  const acao = p.acao;
  const regras = BALANCE_PADRAO.mundo.mercado;
  const agora = Date.now();
  let resultado: ResultadoDoMercado = VAZIO;
  let motivo: MotivoDoMundo | null = null;
  try {
    if (acao.op === 'anunciar' && p.reserva.item) {
      const abertos = (await c.mercado.doVendedor(quem)).filter((a) => a.estado === 'aberto' && !aReceber(a, agora));
      if (abertos.length >= regras.anunciosPorPersonagem) {
        motivo = 'mercado_cheio';
        resultado = devolucao(p);
      } else {
        const a: Anuncio = {
          id: randomUUID(),
          vendedor: quem,
          vendedorNome: p.nome,
          item: p.reserva.item,
          preco: acao.preco,
          liquido: liquidoDaVenda(acao.preco, regras),
          criadoEm: agora,
          expiraEm: agora + regras.duracaoH * 3_600_000,
          estado: 'aberto',
        };
        await c.mercado.anunciar(a);
      }
    } else if (acao.op === 'comprar') {
      const a = await c.mercado.comprar(acao.id, acao.preco, quem, agora);
      if (a) resultado = { itens: [a.item], ouro: 0, ouroNoBanco: 0 };
      else {
        motivo = 'anuncio_indisponivel';
        resultado = devolucao(p);
      }
    } else if (acao.op === 'cancelar') {
      const a = await c.mercado.cancelar(acao.id, quem);
      if (a) resultado = { itens: [a.item], ouro: 0, ouroNoBanco: 0 };
      else motivo = 'anuncio_indisponivel';
    } else if (acao.op === 'receber') {
      const recebidos = await c.mercado.receber(quem, agora);
      resultado = {
        itens: recebidos.filter((a) => a.estado !== 'vendido').map((a) => a.item),
        ouro: 0,
        ouroNoBanco: recebidos.filter((a) => a.estado === 'vendido').reduce((s, a) => s + a.liquido, 0),
      };
    }
  } catch (e) {
    registrarLog('mundo_mercado_falhou', { op: acao.op, motivo: e instanceof Error ? e.message : String(e) });
    motivo = 'mercado_indisponivel';
    resultado = devolucao(p);
  }
  if (resultado !== VAZIO) await c.concluirMercadoDe(quem, resultado);
  if (motivo) c.entregarA(quem, recusa(motivo));
  try {
    c.entregarA(quem, await avisoDoMercado(c, quem, acao.op === 'listar' ? acao.pagina : 0, acao.op === 'listar' ? acao.busca : ''));
  } catch {
    if (!motivo) c.entregarA(quem, recusa('mercado_indisponivel'));
  }
}
