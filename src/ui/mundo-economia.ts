// Os diálogos da economia do Mundo (marco 30, 30/10/2026, D-129), abertos pelos NPCs da vila e redesenhados a cada
// resposta da sala:
// - o quadro de missões: as ofertas do dia (aceitar), as aceitas com o progresso (entregar, abandonar) e as já
//   entregues hoje;
// - o banco: o baú (tirar) e a mochila (guardar), e o ouro nos dois sentidos;
// - o mercado do reino: a busca e as páginas dos anúncios (comprar pelo preço visto), os meus anúncios (cancelar),
//   o ouro a receber e o formulário de anunciar (com a taxa do anúncio e o que fica da venda).

import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade, ItemNaMochila } from '../entities/entidade';
import { t } from '../i18n';
import type { AcaoDoMundo } from '../mundo/acoes';
import type { AvisoDoMundo } from '../mundo/avisos';
import { liquidoDaVenda, taxaDeAnuncio } from '../mundo/mercado';
import { metaDa, type MissaoDoMundo } from '../mundo/missoes-mundo';
import type { Reino } from '../mundo/reino';
import { botao, campoNumero, comChave, linhaDeAcoes, linhaDeItem, lista, painel, paragrafo, subtitulo } from './mundo-dialogos';

type Aviso<T extends AvisoDoMundo['tipo']> = Extract<AvisoDoMundo, { tipo: T }>;

export interface OpcoesDaEconomia {
  ctx: ContextoSimulacao;
  reino: Reino;
  eu: () => Entidade | null;
  enviar: (acao: AcaoDoMundo) => void;
  agoraMs: () => number;
}

export interface PaineisDaEconomia {
  quadro(a: Aviso<'quadro'>): void;
  banco(a: Aviso<'banco'>): void;
  mercado(a: Aviso<'mercado'>): void;
  /** O progresso de uma missão aceita: o texto para a faixa de avisos (e o quadro aberto se redesenha). */
  missao(a: Aviso<'missao'>): string;
}

export function criarPaineisDaEconomia(o: OpcoesDaEconomia): PaineisDaEconomia {
  const itens = o.ctx.conteudo.itens;
  const nomeDoItem = (id: string) => itens.get(id)?.nome ?? id;
  const pilha = (i: { itemId: string; qtd: number }) => (i.qtd > 1 ? t('mundo.pilha', { nome: nomeDoItem(i.itemId), qtd: i.qtd }) : nomeDoItem(i.itemId));
  const missoes = new Map(o.reino.missoes.map((m) => [m.id, m]));
  const mochila = (): ItemNaMochila[] => o.eu()?.bolsa?.mochila ?? [];
  const ouro = () => o.eu()?.bolsa?.ouro ?? 0;

  const pQuadro = painel(t('mundo.quadro.titulo'));
  const pBanco = painel(t('mundo.banco.titulo'));
  const pMercado = painel(t('mundo.mercado.titulo'));
  let ultimoQuadro: Aviso<'quadro'> | null = null;

  const textoDaRecompensa = (m: MissaoDoMundo) => {
    const partes = [t('mundo.quadro.ouro', { ouro: m.recompensa.ouro }), t('mundo.quadro.xp', { xp: m.recompensa.xp }), ...m.recompensa.itens.map(nomeDoItem)];
    return partes.join(' · ');
  };

  const quadro = (a: Aviso<'quadro'>) => {
    ultimoQuadro = a;
    pQuadro.mostrar((corpo) => {
      const regras = o.ctx.balance.mundo.missoes;
      corpo.append(paragrafo(t('mundo.quadro.texto', { ativas: a.ativas.length, max: regras.ativasMax })));
      corpo.append(subtitulo(t('mundo.quadro.aceitas')));
      const ul = lista();
      if (a.ativas.length === 0) corpo.append(paragrafo(t('mundo.quadro.nenhuma')));
      for (const ativa of a.ativas) {
        const m = missoes.get(ativa.id);
        if (!m) continue;
        const meta = metaDa(m);
        const completa = ativa.progresso >= meta || m.alvo.tipo === 'entregar';
        ul.append(
          linhaDeItem(
            t('mundo.quadro.ativa', { nome: m.nome, progresso: Math.min(ativa.progresso, meta), meta }),
            comChave(botao(t('mundo.quadro.entregar'), () => { o.enviar({ a: 'missao', op: 'entregar', id: m.id }); }, !completa), `entregar-${m.id}`),
            comChave(botao(t('mundo.quadro.abandonar'), () => { o.enviar({ a: 'missao', op: 'abandonar', id: m.id }); }), `abandonar-${m.id}`),
          ),
        );
      }
      corpo.append(ul);
      corpo.append(subtitulo(t('mundo.quadro.ofertas')));
      const ofertas = lista();
      for (const id of a.ofertas) {
        const m = missoes.get(id);
        if (!m) continue;
        const feita = a.feitasHoje.includes(id);
        const aceita = a.ativas.some((x) => x.id === id);
        const li = linhaDeItem(
          `${m.nome}: ${m.texto} (${textoDaRecompensa(m)})`,
          comChave(
            botao(feita ? t('mundo.quadro.feita') : aceita ? t('mundo.quadro.aceita') : t('mundo.quadro.aceitar'), () => { o.enviar({ a: 'missao', op: 'aceitar', id }); }, feita || aceita || a.ativas.length >= regras.ativasMax),
            `aceitar-${id}`,
          ),
        );
        ofertas.append(li);
      }
      corpo.append(ofertas);
    });
  };

  const banco = (a: Aviso<'banco'>) => {
    pBanco.mostrar((corpo) => {
      corpo.append(paragrafo(t('mundo.banco.texto', { usados: a.itens.length, slots: a.slots, ouro: a.ouro, mochila: ouro() })));
      const valor = campoNumero(t('mundo.banco.valor'), Math.min(100, Math.max(1, ouro())), 1, 100_000_000);
      corpo.append(
        linhaDeAcoes(
          valor.el,
          comChave(botao(t('mundo.banco.guardarOuro'), () => { o.enviar({ a: 'bancoOuro', op: 'guardar', valor: valor.valor() }); }), 'guardar-ouro'),
          comChave(botao(t('mundo.banco.tirarOuro'), () => { o.enviar({ a: 'bancoOuro', op: 'tirar', valor: valor.valor() }); }), 'tirar-ouro'),
        ),
      );
      corpo.append(subtitulo(t('mundo.banco.bau')));
      const bau = lista();
      if (a.itens.length === 0) corpo.append(paragrafo(t('mundo.banco.vazio')));
      for (const i of a.itens) bau.append(linhaDeItem(pilha(i), comChave(botao(t('mundo.banco.tirar'), () => { o.enviar({ a: 'banco', op: 'tirar', invId: i.invId, qtd: i.qtd }); }), `tirar-${i.invId}`)));
      corpo.append(bau);
      corpo.append(subtitulo(t('mundo.banco.mochila')));
      const sua = lista();
      for (const i of mochila()) sua.append(linhaDeItem(pilha(i), comChave(botao(t('mundo.banco.guardar'), () => { o.enviar({ a: 'banco', op: 'guardar', invId: i.invId, qtd: i.qtd }); }), `guardar-${i.invId}`)));
      corpo.append(sua);
    });
  };

  // O mercado lembra a busca e a página entre as respostas.
  let busca = '';
  const mercado = (a: Aviso<'mercado'>) => {
    const regras = o.ctx.balance.mundo.mercado;
    pMercado.mostrar((corpo) => {
      corpo.append(paragrafo(t('mundo.mercado.texto', { anuncio: regras.taxaAnuncioPct, venda: regras.taxaVendaPct, horas: regras.duracaoH })));
      // A busca.
      const form = document.createElement('form');
      form.className = 'acoes-slot';
      const campo = document.createElement('input');
      campo.type = 'search';
      campo.maxLength = 40;
      campo.value = busca;
      campo.setAttribute('aria-label', t('mundo.mercado.buscar'));
      campo.placeholder = t('mundo.mercado.buscar');
      comChave(campo, 'busca');
      const ir = document.createElement('button');
      ir.type = 'submit';
      ir.className = 'botao-menu';
      ir.textContent = t('mundo.mercado.buscar');
      form.append(campo, ir);
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        busca = campo.value.trim();
        o.enviar({ a: 'mercado', op: 'listar', pagina: 0, busca });
      });
      corpo.append(form);
      // Os anúncios.
      const ul = lista();
      if (a.anuncios.length === 0) corpo.append(paragrafo(t('mundo.mercado.nenhum')));
      for (const x of a.anuncios) {
        ul.append(
          linhaDeItem(
            t('mundo.mercado.anuncio', { item: pilha(x), preco: x.preco, vendedor: x.vendedor }),
            // O próprio anúncio não se compra (o servidor recusa; o botão já vem desligado).
            comChave(botao(t('mundo.mercado.comprar', { preco: x.preco }), () => { o.enviar({ a: 'mercado', op: 'comprar', id: x.id, preco: x.preco }); }, ouro() < x.preco || a.meus.some((m) => m.id === x.id)), `comprar-${x.id}`),
          ),
        );
      }
      corpo.append(ul);
      const paginas = Math.max(1, Math.ceil(a.total / regras.pagina));
      corpo.append(
        linhaDeAcoes(
          comChave(botao(t('mundo.mercado.anterior'), () => { o.enviar({ a: 'mercado', op: 'listar', pagina: a.pagina - 1, busca }); }, a.pagina <= 0), 'anterior'),
          paragrafo(t('mundo.mercado.pagina', { pagina: a.pagina + 1, paginas }), 'texto-mundo'),
          comChave(botao(t('mundo.mercado.proxima'), () => { o.enviar({ a: 'mercado', op: 'listar', pagina: a.pagina + 1, busca }); }, a.pagina + 1 >= paginas), 'proxima'),
        ),
      );
      // Os meus.
      corpo.append(subtitulo(t('mundo.mercado.meus', { n: a.meus.length, max: regras.anunciosPorPersonagem })));
      corpo.append(linhaDeAcoes(paragrafo(t('mundo.mercado.aReceber', { ouro: a.aReceber }), 'texto-mundo'), comChave(botao(t('mundo.mercado.receber'), () => { o.enviar({ a: 'mercado', op: 'receber' }); }), 'receber')));
      const meus = lista();
      for (const x of a.meus) {
        const vencido = !x.vendido && x.expiraEm <= o.agoraMs();
        const estado = x.vendido ? t('mundo.mercado.vendido') : vencido ? t('mundo.mercado.vencido') : t('mundo.mercado.aberto');
        meus.append(
          linhaDeItem(
            t('mundo.mercado.meu', { item: pilha(x), preco: x.preco, estado }),
            comChave(botao(t('mundo.mercado.cancelar'), () => { o.enviar({ a: 'mercado', op: 'cancelar', id: x.id }); }, !!x.vendido || vencido), `cancelar-${x.id}`),
          ),
        );
      }
      corpo.append(meus);
      // Anunciar.
      corpo.append(subtitulo(t('mundo.mercado.anunciar')));
      const escolha = document.createElement('select');
      escolha.setAttribute('aria-label', t('mundo.mercado.item'));
      comChave(escolha, 'item-anuncio');
      for (const i of mochila()) {
        const op = document.createElement('option');
        op.value = i.invId;
        op.textContent = pilha(i);
        escolha.append(op);
      }
      const qtd = campoNumero(t('mundo.mercado.qtd'), 1, 1, 9999);
      const preco = campoNumero(t('mundo.mercado.preco'), 10, 1, regras.precoMax);
      const taxa = paragrafo('', 'texto-mundo');
      const conta = () => {
        const p = preco.valor();
        taxa.textContent = t('mundo.mercado.taxa', { taxa: taxaDeAnuncio(p, regras), liquido: liquidoDaVenda(p, regras) });
      };
      preco.el.addEventListener('input', conta);
      conta();
      const anunciar = botao(t('mundo.mercado.anunciar'), () => {
        const item = mochila().find((i) => i.invId === escolha.value);
        if (item) o.enviar({ a: 'mercado', op: 'anunciar', invId: item.invId, qtd: Math.min(item.qtd, qtd.valor()), preco: preco.valor() });
      }, mochila().length === 0);
      corpo.append(linhaDeAcoes(escolha, qtd.el, preco.el), taxa, linhaDeAcoes(comChave(anunciar, 'anunciar')));
    });
  };

  const missao = (a: Aviso<'missao'>): string => {
    const m = missoes.get(a.id);
    if (ultimoQuadro && pQuadro.aberto()) {
      quadro({ ...ultimoQuadro, ativas: ultimoQuadro.ativas.map((x) => (x.id === a.id ? { ...x, progresso: a.progresso } : x)) });
    }
    const nome = m?.nome ?? a.id;
    return a.progresso >= a.meta ? t('mundo.missao.completa', { nome }) : t('mundo.missao.progresso', { nome, progresso: a.progresso, meta: a.meta });
  };

  return { quadro, banco, mercado, missao };
}
