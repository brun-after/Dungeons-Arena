// Modal da loja (§2.10). Marco 9A (14/10/2026). Só lê o estado e emite comandos: abre sozinho
// quando a simulação abre a janela da loja para o jogador local e fecha quando ela acaba. Fechar
// pelo modal (botão fechar, Esc, toque no fundo) emite `fecharLoja`, que arma a recarga.

import type { Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { t } from '../i18n';
import { precoDeVenda, vendavel, type Item } from '../progression/itens';
import { ofertasDoMundo } from '../mundo/lojas-mundo';
import { precoDoItem } from '../progression/itens-progressao';
import { estoqueDaLoja, lojaAberta } from '../progression/loja';
import { armaDoItem, molduraDoItem, resumoDoItem } from './mochila';
import { motivoParaNaoForjar, receitaDaLoja } from '../progression/forja';
import { fundivel } from '../progression/fusao-elemental';
import { criarModal } from './modal';
import { iconeDoItem } from './icones';
import { classeDoItem, comRuna } from './runa-dom';

export interface OpcoesLoja {
  ctx: ContextoSimulacao;
  estado: () => EstadoJogo;
  jogador: () => Entidade | undefined;
  emitir: (cmd: Comando) => void;
  /** Ao abrir: fecha outros modais e solta as teclas. */
  aoAbrir: () => void;
  /** Marco 38 (08/11/2026, D-142): no mercado do Mundo, abre os anúncios dos jogadores. */
  abrirAnuncios?: () => void;
}

export interface Loja {
  aberta: () => boolean;
  /** Chamado a cada quadro. */
  atualizar: () => void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

export function criarLoja(o: OpcoesLoja): Loja {
  const { ctx, emitir } = o;
  const itens = ctx.conteudo.itens;
  let assinatura = '';
  // Fechado pela simulação (a janela acabou): não emite `fecharLoja` de novo.
  let fechandoPeloEstado = false;
  // Fechado pelo jogador: não reabre enquanto o `fecharLoja` não chega à simulação.
  let janelaFechada = -1;
  let janelaAtual = -1;
  /** 09/11/2026 (D-144): a vida no quadro anterior; perder vida com a loja aberta faz a janela tremer. */
  let vidaAntes = -1;

  const modal = criarModal({
    titulo: t('loja.titulo'),
    rotuloFechar: t('loja.fechar'),
    classe: 'mochila loja',
    aoFechar: () => {
      if (!fechandoPeloEstado) {
        janelaFechada = janelaAtual;
        emitir({ t: 'fecharLoja' });
      }
      fechandoPeloEstado = false;
      assinatura = '';
    },
  });

  const saldo = el('p', 'saldo-loja');
  const listas = el('div', 'conteudo-modal');
  // D-067: a loja não tem prazo (fecha pelo jogador). D-144: a perseguição não a fecha mais; levar dano faz tremer.
  const tremer = () => {
    modal.dialogo.classList.remove('tremor-loja');
    modal.dialogo.getBoundingClientRect(); // reinicia a animação
    modal.dialogo.classList.add('tremor-loja');
  };
  modal.dialogo.addEventListener('animationend', () => { modal.dialogo.classList.remove('tremor-loja'); });
  modal.corpo.append(saldo, listas);

  const linha = (item: Item | undefined, rotulo: string, qtd: number, acao: { texto: string; chave: string; desligado: boolean; fazer: () => void } | null, nota?: string) => {
    const li = el('li', 'linha-item');
    const conteudo = el('span', 'conteudo-item');
    const iconeItem = el('span', molduraDoItem(item));
    iconeItem.append(iconeDoItem(item?.icone ?? 'circulo'));
    iconeItem.setAttribute('aria-hidden', 'true');
    const textos = el('span', 'textos-item');
    // Marco 26 (28/10/2026, D-116): o livro de skill de classe leva a runa da classe.
    textos.append(comRuna(el('span', `nome-item raridade-${item?.raridade ?? 'comum'}`, rotulo), item ? classeDoItem(ctx.conteudo, item.id) : null));
    const detalhe = nota ?? (item ? resumoDoItem(item, armaDoItem(ctx, item), o.jogador()?.bolsa?.classeId, ctx.balance) : '');
    if (detalhe) textos.append(el('span', 'detalhe-item', detalhe));
    conteudo.append(iconeItem, textos);
    if (qtd > 1) conteudo.append(el('span', 'qtd-item', `×${qtd}`));
    li.append(conteudo);
    if (acao) {
      const b = el('button', 'botao-cabecalho', acao.texto);
      b.type = 'button';
      b.dataset.chave = acao.chave;
      b.disabled = acao.desligado;
      b.setAttribute('aria-label', `${acao.texto}: ${rotulo}`);
      b.addEventListener('click', acao.fazer);
      li.append(b);
    }
    return li;
  };

  const desenhar = (j: Entidade, loja: ObjetoNoMundo) => {
    const bolsa = j.bolsa;
    if (!bolsa) return;
    assinatura = JSON.stringify([bolsa.mochila, bolsa.ouro, bolsa.tomosComprados, loja.objetoId, ofertasDoMundo(o.estado(),o.ctx,loja)]);
    const focoAntes = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.chave : undefined;
    saldo.textContent = t('loja.saldo', { ouro: bolsa.ouro });
    saldo.dataset.ouro = String(bolsa.ouro);
    listas.textContent = '';
    if(ctx.fase.id.startsWith('mundo_masmorra_'))listas.append(el('p','detalhe-item',t('loja.retornoDungeon',{mortes:bolsa.mortesNaDungeon??0})));
    // Marco 38 (D-142): o mercado da vila vende o estoque do reino e, pelo botão, os anúncios dos jogadores.
    if (loja.ref === 'mercado' && o.abrirAnuncios) {
      const b = el('button', 'botao-cabecalho', t('loja.anunciosDoReino'));
      b.type = 'button';
      b.dataset.chave = 'anuncios-do-reino';
      const abrir = o.abrirAnuncios;
      b.addEventListener('click', () => { abrir(); });
      listas.append(b);
    }

    listas.append(el('h3', 'subtitulo-modal', t('loja.estoque')));
    const estoque = el('ul', 'lista-itens estoque-loja');
    for (const id of estoqueDaLoja(o.estado(), o.ctx, loja)) {
      const item = itens.get(id);
      if (!item) continue;
      // Marco 17: o preço já com o desconto do Carisma.
      const preco = precoDoItem(item, j, o.ctx);
      estoque.append(
        linha(item, ofertasDoMundo(o.estado(),o.ctx,loja).includes(id) ? `${item.nome} · ${t('loja.ofertaTemporaria')}` : item.nome, 1, {
          texto: t('loja.comprar', { preco }),
          chave: `comprar-${id}`,
          desligado: bolsa.ouro < preco,
          fazer: () => { emitir({ t: 'comprar', itemId: id }); },
        }),
      );
    }
    listas.append(estoque);

    listas.append(el('h3', 'subtitulo-modal', t('loja.suaMochila')));
    if (bolsa.mochila.length === 0) listas.append(el('p', 'vazio-modal', t('loja.semItens')));
    const mochila = el('ul', 'lista-itens');
    for (const entrada of bolsa.mochila) {
      const item = itens.get(entrada.itemId);
      const pode = item ? vendavel(item) && entrada.ref !== 'resgate_dungeon' : false;
      const preco = item ? precoDeVenda(item, ctx.balance.economia.vendaPct) : 0;
      mochila.append(
        linha(
          item,
          item?.nome ?? entrada.itemId,
          entrada.qtd,
          pode ? { texto: t('loja.vender', { preco }), chave: `vender-${entrada.invId}`, desligado: false, fazer: () => { emitir({ t: 'vender', invId: entrada.invId }); } } : null,
          pode ? undefined : t('loja.naoCompra'),
        ),
      );
    }
    listas.append(mochila);
    desenharForja(j, loja);
    if (focoAntes) modal.corpo.querySelector<HTMLElement>(`[data-chave="${CSS.escape(focoAntes)}"]`)?.focus();
  };

  /**
   * Marco 18 (D-070): a forja. As receitas de item aparecem com os materiais; a de ascender lista as peças Lendárias da
   * mochila, uma linha para cada.
   */
  const desenharForja = (j: Entidade, loja: ObjetoNoMundo) => {
    const bolsa = j.bolsa;
    // Marco 30 (30/10/2026, D-129): só as receitas do ofício da loja (no Mundo, o ferreiro e o alquimista).
    // Marco 38 (D-142): em ordem de grau, com o grau no começo de cada linha.
    const receitas = [...ctx.conteudo.forja.values()].filter((r) => receitaDaLoja(r, loja)).sort((a, b) => a.grau - b.grau);
    if (!bolsa || receitas.length === 0) return;
    listas.append(el('h3', 'subtitulo-modal', t('loja.forja')));
    const ul = el('ul', 'lista-itens forja-loja');
    for (const r of receitas) {
      const materiais = [t('loja.grau', { grau: ['I', 'II', 'III', 'IV', 'V'][r.grau - 1] ?? r.grau }), ...r.entrada.map((x) => `${itens.get(x.item)?.nome ?? x.item} ×${x.qtd}`)].concat(r.ouro > 0 ? [t('loja.forjaOuro', { ouro: r.ouro })] : []).join(' · ');
      if (r.saida.tipo === 'fundir') {
        // A fusão lista as peças da mochila que a aceitam, uma linha para cada.
        const pecas = bolsa.mochila.filter((i) => fundivel(itens.get(i.itemId)));
        if (pecas.length === 0) ul.append(linha(undefined, r.nome, 1, null, `${r.texto} (${materiais}) · ${t('loja.fundirSemPeca')}`));
        for (const entrada of pecas) {
          const item = itens.get(entrada.itemId);
          const motivo = motivoParaNaoForjar(o.estado(), ctx, j, r, entrada.invId);
          ul.append(linha(item, `${r.nome}: ${item?.nome ?? entrada.itemId}`, 1, { texto: t('loja.forjar'), chave: `forjar-${r.id}-${entrada.invId}`, desligado: motivo !== null, fazer: () => { emitir({ t: 'forjar', receita: r.id, invId: entrada.invId }); } }, `${r.texto} (${materiais})`));
        }
        continue;
      }
      if (r.saida.tipo === 'item') {
        const item = itens.get(r.saida.item);
        const motivo = motivoParaNaoForjar(o.estado(), ctx, j, r, null);
        ul.append(linha(item, r.nome, 1, { texto: t('loja.forjar'), chave: `forjar-${r.id}`, desligado: motivo !== null, fazer: () => { emitir({ t: 'forjar', receita: r.id }); } }, `${r.texto} (${materiais})`));
        continue;
      }
      const lendarias = bolsa.mochila.filter((i) => itens.get(i.itemId)?.forma === 'lendaria');
      if (lendarias.length === 0) {
        ul.append(linha(undefined, r.nome, 1, null, `${r.texto} (${materiais}) · ${t('loja.forjaSemLendaria')}`));
        continue;
      }
      for (const entrada of lendarias) {
        const item = itens.get(entrada.itemId);
        const motivo = motivoParaNaoForjar(o.estado(), ctx, j, r, entrada.invId);
        ul.append(
          linha(item, `${r.nome}: ${item?.nome ?? entrada.itemId}`, 1, {
            texto: t('loja.forjar'),
            chave: `forjar-${r.id}-${entrada.invId}`,
            desligado: motivo !== null,
            fazer: () => { emitir({ t: 'forjar', receita: r.id, invId: entrada.invId }); },
          }, `${r.texto} (${materiais})`),
        );
      }
    }
    listas.append(ul);
  };

  const atualizar = () => {
    const j = o.jogador();
    const estado = o.estado();
    const loja = j ? lojaAberta(estado, j) : null;
    if (!j || !loja) {
      vidaAntes = -1;
      // ateTick é sempre LOJA_SEM_PRAZO; a confirmação libera a próxima abertura.
      janelaFechada = -1;
      if (modal.aberto()) {
        fechandoPeloEstado = true;
        modal.fechar();
      }
      return;
    }
    janelaAtual = j.interacao?.ateTick ?? -1;
    if (modal.aberto() && vidaAntes >= 0 && j.hp < vidaAntes) tremer();
    vidaAntes = j.hp;
    if (!modal.aberto()) {
      if (janelaAtual === janelaFechada) return;
      o.aoAbrir();
      modal.abrir();
    }
    const bolsa = j.bolsa;
    if (bolsa && JSON.stringify([bolsa.mochila, bolsa.ouro, bolsa.tomosComprados, loja.objetoId, ofertasDoMundo(o.estado(),o.ctx,loja)]) !== assinatura) desenhar(j, loja);
  };

  return { aberta: modal.aberto, atualizar };
}
