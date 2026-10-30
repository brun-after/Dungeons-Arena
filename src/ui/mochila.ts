// Mochila e ficha (§2.10, §2.12). Marco 6 (13/10/2026). Só lê o estado e emite comandos.
// No toque, tocar a linha inteira equipa, usa ou desequipa; equipar e desequipar mantêm o modal aberto. No desktop, cada linha
// tem o seu botão. A lista é redesenhada só quando a bolsa, o nível ou o XP mudam.
// Marco 9A (14/10/2026): ouro, ordenação manual (subir e descer, persistida no save) e a tecla de atalho de
// cada consumível (7–9 e 0 desde o marco 24, D-050).
// Marco 14 (14/10/2026): a aba Habilidades (ui/mochila-habilidades.ts) e os livros (usar ensina).

import type { Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Entidade, ItemNaMochila } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { SLOTS_DE_EQUIPAMENTO, type Slot } from '../modos/modo';
import { DT_MS } from '../core/loop';
import { ticksRestantesDoEstudo } from '../progression/habilidades-personagem';
import { derivarFicha, multiplicadoresDoItem } from '../progression/derivados';
import { atributosUteis, bonusDeEspecializacao, descontoNaLojaPct, pontosUteis, multiplicadorDeRolagem, perfilDestreza, reducaoRecargaBasicoPct, vidaPorCelula } from '../progression/efeitos-atributo';
import { ressonanciasDe } from '../progression/ressonancias';
import { criarDicaAtributo, linhasDaDica, nomeDoAtributo, type DicaAtributo } from './dica-atributo';
import { bonusDeAtributo } from '../progression/ficha';
import { faixaDaFormula } from '../combat/dados';
import { habilidadeDoAtor } from '../combat/perfil';
import { cabeNoSlot, NOMES_ATRIBUTOS, type Item } from '../progression/itens';
import { consumiveisComAtalho } from '../progression/inventario';
import { tetoDoAtributo, xpParaProximo } from '../progression/nivel';
import { resolverHabilidade } from '../combat/compilar-habilidade';
import { desenharHabilidades, type EstadoAbaHabilidades } from './mochila-habilidades';
import { desenharDiario } from './mochila-diario';
import { duracaoLegivel } from './tempo';
import { criarModal } from './modal';
import { icone } from './icones';
import { classeDoItem, comRuna } from './runa-dom';

export interface OpcoesMochila {
  ctx: ContextoSimulacao;
  jogador: () => Entidade | undefined;
  emitir: (cmd: Comando) => void;
  /** Marco 10A-3: o estado, para saber se o jogador tem invocações (opcional). */
  estado?: () => EstadoJogo;
  toque: boolean;
  aoAbrir: () => void;
}

/** Tecla do n-ésimo atalho de consumível: 5, 6, 7, 8, 9 e 0. */
export function teclaDoAtalho(n: number): string {
  return String((n + 5) % 10);
}

export interface Mochila {
  botao: HTMLButtonElement;
  alternar: () => void;
  aberta: () => boolean;
  /** Chamado a cada quadro: atualiza o botão e, com o modal aberto, o conteúdo. */
  atualizar: () => void;
}

type Aba = 'itens' | 'ficha' | 'habilidades' | 'diario';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function botao(texto: string, chave: string, aoClicar: () => void, classe = 'botao-cabecalho'): HTMLButtonElement {
  const b = el('button', classe, texto);
  b.type = 'button';
  b.dataset.chave = chave;
  b.addEventListener('click', aoClicar);
  return b;
}

/**
 * Marco 18 (D-069): a moldura do ícone segue a forma (gema na Épica, brilho na Lendária, coroa na Última) e a cor do
 * elemento, se houver.
 */
export function molduraDoItem(item: Item | undefined): string {
  if (!item) return 'icone-item';
  const classes = ['icone-item'];
  if (item.forma) classes.push(`forma-${item.forma}`);
  if (item.elemento) classes.push(`elemento-${item.elemento}`);
  return classes.join(' ');
}

/** "FOR +2 · CON +10% · DEF +1" */
/** Marco 27 (D-126): a arma diz a família e o básico dela (o nome da variação). */
export function armaDoItem(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, item: Item): { familia: string; basico: string } | undefined {
  const arma = item.arma ? ctx.conteudo.armas.armas.get(item.arma) : undefined;
  const basico = arma ? resolverHabilidade(ctx, arma.basico)?.nome : undefined;
  return arma && basico ? { familia: t(`familiaArma.${arma.familia}` as ChaveTexto), basico } : undefined;
}

export function resumoDoItem(item: Item, arma?: { familia: string; basico: string }, classeDoLeitor?: string, balance?: ContextoSimulacao['balance']): string {
  const partes: string[] = [];
  if (arma) partes.push(t('mochila.basicoDaArma', { familia: arma.familia, basico: arma.basico }));
  for (const nome of NOMES_ATRIBUTOS) {
    const b = item.bonusAtributos[nome];
    if (!b) continue;
    const sinal = b.valor >= 0 ? '+' : '';
    partes.push(`${nomeDoAtributo(nome, classeDoLeitor, true)} ${sinal}${b.valor}${b.modo === 'pct' ? '%' : ''}`);
  }
  if (item.bonusDefesa !== 0) partes.push(`${t('atributoCurto.defesa')} ${item.bonusDefesa > 0 ? '+' : ''}${item.bonusDefesa}`);
  // Marco 28 (D-127): o multiplicador do item (cresce com o nível e a raridade).
  const m = balance ? multiplicadoresDoItem(item, balance) : null;
  if (m && m.danoPct > 0) partes.push(t('item.danoPct', { v: m.danoPct }));
  if (m && m.defesaPct > 0) partes.push(t('item.defesaPct', { v: m.defesaPct }));
  if (item.tipo === 'consumivel' || item.tipo === 'livro' || item.tipo === 'chave' || item.tipo === 'material') partes.push(item.descricao);
  // Marco 18 (D-069): a forma e o que a Lendária/Última faz.
  if (item.forma) partes.unshift(t(`forma.${item.forma}` as ChaveTexto));
  if (item.forma && item.descricao) partes.push(item.descricao);
  return partes.join(' · ');
}

export function criarMochila(o: OpcoesMochila): Mochila {
  const { ctx, emitir } = o;
  const itens = ctx.conteudo.itens;
  let aba: Aba = 'itens';
  let dica: DicaAtributo | null = null;
  let assinatura = '';
  const estadoHabilidades: EstadoAbaHabilidades = { escolhendo: null };
  let rotuloBotao = '';

  const modal = criarModal({
    titulo: t('mochila.titulo'),
    rotuloFechar: t('mochila.fechar'),
    classe: 'mochila',
    aoAbrir: () => {
      // D-067: abrir a mochila gasta a carga de refúgio (imune por 45 s), se houver.
      emitir({ t: 'abrirMenu' });
      o.aoAbrir();
      desenhar();
    },
  });
  // `I` fecha de dentro do modal (a entrada de jogo fica bloqueada enquanto ele está aberto).
  modal.dialogo.addEventListener('keydown', (ev) => {
    if (ev.code === 'KeyI') modal.fechar();
  });

  const botaoAbrir = el('button', 'botao-cabecalho botao-mochila');
  botaoAbrir.type = 'button';
  botaoAbrir.addEventListener('click', () => {
    modal.abrir();
  });

  // D-076 (17/10/2026): trocar equipamentos não fecha a mochila, permitindo organizar vários slots.
  const agir = (cmd: Comando) => {
    emitir(cmd);
    if (o.toque && cmd.t !== 'equipar' && cmd.t !== 'desequipar') modal.fechar();
  };

  const linhaItem = (opcoes: {
    chave: string;
    item: Item | undefined;
    qtd: number;
    rotulo: string;
    acao: (() => void) | null;
    textoAcao: string;
    bloqueio: string | null;
    vazio?: boolean;
    ordem?: { subir: (() => void) | null; descer: (() => void) | null; invId: string };
    atalho?: string;
    /** Marco 27 (D-126): a arma também vai para a mão secundária. */
    extra?: { texto: string; acao: () => void };
  }): HTMLLIElement => {
    const li = el('li', opcoes.vazio ? 'linha-item vazio' : 'linha-item');
    const conteudo = el('span', 'conteudo-item');
    // D-067: o ícone do item é SVG do conjunto (o campo `icone` é um id).
    const iconeItem = el('span', molduraDoItem(opcoes.item));
    iconeItem.append(icone(opcoes.item?.icone ?? 'circulo'));
    iconeItem.setAttribute('aria-hidden', 'true');
    const textos = el('span', 'textos-item');
    const nome = el('span', `nome-item raridade-${opcoes.item?.raridade ?? 'comum'}`, opcoes.rotulo);
    // Marco 26 (28/10/2026, D-116): o livro que ensina skill de classe leva a runa da classe.
    if (opcoes.item) comRuna(nome, classeDoItem(ctx.conteudo, opcoes.item.id));
    textos.append(nome);
    const resumo = opcoes.item ? resumoDoItem(opcoes.item, armaDoItem(ctx, opcoes.item), o.jogador()?.bolsa?.classeId, ctx.balance) : '';
    const detalhe = opcoes.bloqueio ?? (opcoes.atalho ? [t('mochila.atalho', { tecla: opcoes.atalho }), resumo].filter(Boolean).join(' · ') : resumo);
    if (detalhe) textos.append(el('span', 'detalhe-item', detalhe));
    conteudo.append(iconeItem, textos);
    if (opcoes.qtd > 1) conteudo.append(el('span', 'qtd-item', `×${opcoes.qtd}`));
    const acao = opcoes.acao;
    if (o.toque && acao && !opcoes.bloqueio) {
      const b = botao('', opcoes.chave, acao, 'linha-toque');
      b.setAttribute('aria-label', `${opcoes.textoAcao}: ${opcoes.rotulo}`);
      b.append(conteudo);
      li.append(b);
    } else {
      li.append(conteudo);
      if (acao) {
        const b = botao(opcoes.textoAcao, opcoes.chave, acao);
        b.disabled = opcoes.bloqueio !== null;
        b.setAttribute('aria-label', `${opcoes.textoAcao}: ${opcoes.rotulo}`);
        li.append(b);
      }
    }
    const extra = opcoes.extra;
    if (extra && !opcoes.bloqueio) {
      const b = botao(extra.texto, `${opcoes.chave}-extra`, extra.acao);
      b.setAttribute('aria-label', `${extra.texto}: ${opcoes.rotulo}`);
      li.append(b);
    }
    const ordem = opcoes.ordem;
    if (ordem) {
      const grupo = el('span', 'ordem-item');
      for (const [texto, rotulo, fazer, sufixo] of [
        ['seta_cima', t('mochila.subir', { item: opcoes.rotulo }), ordem.subir, 'subir'],
        ['seta_baixo', t('mochila.descer', { item: opcoes.rotulo }), ordem.descer, 'descer'],
      ] as const) {
        const b = botao('', `${sufixo}-${ordem.invId}`, () => fazer?.(), 'botao-cabecalho botao-ordem');
        b.append(icone(texto));
        b.disabled = !fazer;
        b.setAttribute('aria-label', rotulo);
        grupo.append(b);
      }
      li.append(grupo);
      if (ctx.modo.objetosDeFase) {
        const soltar = (qtd: number) => { emitir({ t: 'soltarItem', invId: ordem.invId, qtd }); };
        const b = botao(t('mochila.soltar'), `soltar-${ordem.invId}`, () => { soltar(1); });
        b.setAttribute('aria-label', `${t('mochila.soltar')}: ${opcoes.rotulo}`);
        li.append(b);
        if (opcoes.qtd > 1) {
          const pilha = botao(t('mochila.soltarPilha'), `soltar-pilha-${ordem.invId}`, () => { soltar(opcoes.qtd); });
          pilha.setAttribute('aria-label', `${t('mochila.soltarPilha')}: ${opcoes.rotulo}`);
          li.append(pilha);
        }
      }
    }
    return li;
  };

  const desenharItens = (j: Entidade, corpo: HTMLElement) => {
    const bolsa = j.bolsa;
    if (!bolsa) return;
    // A mochila vem primeiro: é onde estão as ações; os slots ficam numa grade compacta.
    const ouro = el('p', 'saldo-loja', t('loja.saldo', { ouro: bolsa.ouro }));
    ouro.dataset.ouro = String(bolsa.ouro);
    corpo.append(
      ouro,
      el('h3', 'subtitulo-modal', t('mochila.itens', { n: bolsa.mochila.length, max: ctx.balance.inventario.capacidade })),
    );
    if (bolsa.mochila.length === 0) corpo.append(el('p', 'vazio-modal', t('mochila.semItens')));
    if (ctx.modo.objetosDeFase && bolsa.mochila.length > 0) corpo.append(el('p', 'detalhe-item', t('mochila.dicaSoltar')));
    const lista = el('ul', 'lista-itens');
    const atalhos = consumiveisComAtalho(bolsa, itens).map((i) => i.invId);
    bolsa.mochila.forEach((entrada, indice) => {
      const n = atalhos.indexOf(entrada.invId);
      // A ordenação não fecha o modal (no toque também): é para arrumar várias linhas seguidas.
      const mover = (posicao: number) => () => { emitir({ t: 'moverItem', invId: entrada.invId, posicao }); };
      lista.append(
        linhaDaMochila(j, entrada, {
          subir: indice > 0 ? mover(indice - 1) : null,
          descer: indice < bolsa.mochila.length - 1 ? mover(indice + 1) : null,
          invId: entrada.invId,
        }, n >= 0 ? teclaDoAtalho(n) : undefined),
      );
    });
    corpo.append(lista);

    corpo.append(el('h3', 'subtitulo-modal', t('mochila.equipado')));
    const slots = el('ul', 'lista-itens slots');
    for (const slot of SLOTS_DE_EQUIPAMENTO) {
      const entrada = bolsa.equipamento[slot];
      const item = entrada ? itens.get(entrada.itemId) : undefined;
      const nomeSlot = t(`slot.${slot}` as ChaveTexto);
      slots.append(
        linhaItem({
          chave: `slot-${slot}`,
          item,
          qtd: 1,
          rotulo: item ? `${nomeSlot}: ${item.nome}` : `${nomeSlot}: ${t('mochila.vazio')}`,
          vazio: !item,
          acao: item ? () => { agir({ t: 'desequipar', slot }); } : null,
          textoAcao: t('mochila.desequipar'),
          bloqueio: null,
        }),
      );
    }
    corpo.append(slots);
  };

  const linhaDaMochila = (
    j: Entidade,
    entrada: ItemNaMochila,
    ordem: { subir: (() => void) | null; descer: (() => void) | null; invId: string },
    atalho: string | undefined,
  ): HTMLLIElement => {
    const item = itens.get(entrada.itemId);
    // Marco 14: livro também se usa (ensina a habilidade).
    const consumivel = item?.tipo === 'consumivel' || item?.tipo === 'livro';
    const slot: Slot | null = item?.slotPadrao ?? null;
    const acao = consumivel
      ? () => {
        if (item.progressao?.tipo === 'rank') {
          estadoHabilidades.essenciaInvId = entrada.invId;
          aba = 'habilidades';
          desenhar();
        } else agir({ t: 'usarItem', invId: entrada.invId });
      }
      : slot
        ? () => { agir({ t: 'equipar', invId: entrada.invId, slot }); }
        : null;
    const bloqueio = item && j.nivel < item.nivelMinimo ? t('mochila.requerNivel', { nivel: item.nivelMinimo }) : null;
    // O livro raro mostra a habilidade gerada que ensina.
    const ensinada = entrada.ref ? resolverHabilidade(ctx, entrada.ref) : undefined;
    return linhaItem({
      chave: `inv-${entrada.invId}`,
      item,
      qtd: entrada.qtd,
      rotulo: ensinada ? `${item?.nome ?? entrada.itemId}: ${ensinada.nome}` : (item?.nome ?? entrada.itemId),
      acao,
      textoAcao: consumivel ? t('mochila.usar') : t('mochila.equipar'),
      bloqueio,
      ordem,
      ...(atalho !== undefined && { atalho }),
      ...(item && slot === 'arma_principal' && cabeNoSlot(item, 'arma_secundaria') && { extra: { texto: t('mochila.naSecundaria'), acao: () => { agir({ t: 'equipar', invId: entrada.invId, slot: 'arma_secundaria' }); } } }),
    });
  };

  const desenharFicha = (j: Entidade, corpo: HTMLElement) => {
    const bolsa = j.bolsa;
    if (!bolsa) return;
    const proximo = xpParaProximo(j.nivel, ctx.balance.xp);
    if (bolsa.xpLegado) corpo.append(el('p', 'detalhe-item', t('progressao.xpLegado', { n: bolsa.xpLegado })));
    const nivelMax = j.nivel >= ctx.balance.xp.nivelMax;
    corpo.append(
      el('p', 'linha-nivel', nivelMax ? t('ficha.nivelMax', { nivel: j.nivel }) : t('ficha.nivel', { nivel: j.nivel, xp: j.xp, proximo })),
    );
    const teto = tetoDoAtributo(j.nivel, ctx.balance);
    corpo.append(el('p', 'detalhe-item', t('ficha.teto', { teto, nivel: j.nivel, folga: ctx.balance.atributos.folgaSobreNivel, maximo: ctx.balance.atributos.maximo })));
    const pontos = el('p', 'linha-pontos', t('ficha.pontos', { n: bolsa.pontosAtributo }));
    pontos.dataset.pontos = String(bolsa.pontosAtributo);
    corpo.append(pontos);

    // Base + bônus do equipamento = efetivo; o efetivo vem da mesma função da simulação.
    const efetiva = derivarFicha(bolsa, j.nivel, ctx);
    // Marco 18 (D-068): o "?" de cada atributo abre a dica rápida com os números do personagem.
    dica?.destruir();
    dica = criarDicaAtributo(modal.corpo);
    const dicaAtual = dica;
    const tabela = el('table', 'tabela-ficha');
    const cab = el('tr');
    for (const chave of ['ficha.atributo', 'ficha.base', 'ficha.bonus', 'ficha.efetivo'] as const) cab.append(el('th', undefined, t(chave)));
    cab.append(el('th'));
    tabela.append(cab);
    for (const nome of NOMES_ATRIBUTOS) {
      const tr = el('tr');
      const base = bolsa.atributosBase[nome];
      const valor = efetiva.atributos[nome];
      const diff = valor - base;
      // Marco 28 (D-127): o atributo de classe aparece com o nome da classe.
      const rotulo = nomeDoAtributo(nome, bolsa.classeId);
      const nomeAtributo = el('td', 'nome-atributo', rotulo);
      nomeAtributo.append(' ', dicaAtual.botao(nome, () => linhasDaDica(nome, efetiva.atributos, ctx, j, efetiva.hpMax, efetiva.manaMax), rotulo));
      tr.append(
        nomeAtributo,
        el('td', undefined, String(base)),
        el('td', diff > 0 ? 'bonus-positivo' : diff < 0 ? 'bonus-negativo' : undefined, diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${diff}`),
        el('td', 'efetivo', String(valor)),
      );
      const celulaMais = el('td');
      if (bolsa.pontosAtributo > 0) {
        const mais = botao('+', `ponto-${nome}`, () => { emitir({ t: 'distribuirPonto', atributo: nome }); });
        mais.setAttribute('aria-label', t('ficha.aumentar', { atributo: rotulo }));
        // Marco 28 (D-127): no teto do nível (nível + 20), o "+" trava e diz por quê.
        if (base >= teto) {
          mais.disabled = true;
          mais.title = t('ficha.noTeto', { teto });
        }
        celulaMais.append(mais);
      }
      tr.append(celulaMais);
      tr.dataset.atributo = nome;
      tr.dataset.efetivo = String(valor);
      tabela.append(tr);
    }
    corpo.append(tabela);
    corpo.append(
      el('p', 'resumo-ficha', t('ficha.resumo', { defesa: efetiva.defesa, hp: efetiva.hpMax, mana: efetiva.manaMax })),
    );
    // Marco 18 (D-068): as ressonâncias que os atributos despertaram (as outras ficam para o diário).
    const ativas = ressonanciasDe(ctx.conteudo.ressonancias, efetiva.atributos);
    if (ativas.length > 0) {
      corpo.append(el('h3', 'subtitulo-modal', t('ficha.ressonancias')));
      const lista = el('ul', 'lista-ressonancias');
      for (const r of ativas) {
        const li = el('li');
        li.append(el('strong', undefined, r.nome), ` ${r.texto}`);
        li.dataset.ressonancia = r.id;
        lista.append(li);
      }
      corpo.append(lista);
    }
    // Marco 17 (D-063): o que os atributos dão, para o jogador ver o efeito do que escolheu.
    const basico = habilidadeDoAtor(ctx, j, j.ataqueBasico);
    if (basico?.formulaDano) {
      // Marco 18: a rolagem já com o multiplicador de Força e Inteligência.
      const faixaBruta = faixaDaFormula(basico.formulaDano);
      const mult = multiplicadorDeRolagem(atributosUteis(efetiva.atributos, ctx.balance), ctx.balance);
      const faixa = { min: Math.round(faixaBruta.min * mult), max: Math.round(faixaBruta.max * mult) };
      const bonus = bonusDeAtributo(atributosUteis(efetiva.atributos, ctx.balance), basico.escalaCom, ctx.balance.combate.multiplicadorAtributoPadrao) + bonusDeEspecializacao(efetiva.atributos, basico.escalaCom, ctx.balance);
      const recarga = (basico.recargaMs * (1 - reducaoRecargaBasicoPct(efetiva.atributos, ctx.balance, perfilDestreza(ctx, j)) / 100)) / 1000;
      const manaPorSegundo =
        ctx.balance.recursos.regenManaPorSegundo * (1 + (Math.max(0, pontosUteis(efetiva.atributos.sabedoria, ctx.balance) - 10) * ctx.balance.atributos.efeitos.regenManaPorSabedoriaPct) / 100);
      const derivados = el(
        'p',
        'derivados-ficha',
        t('ficha.derivados', {
          min: faixa.min + bonus,
          max: faixa.max + bonus,
          recarga: recarga.toFixed(2).replace('.', ','),
          mana: manaPorSegundo.toFixed(1).replace('.', ','),
          vida: vidaPorCelula(efetiva.atributos, ctx.balance),
          desconto: descontoNaLojaPct(efetiva.atributos, ctx.balance),
        }),
      );
      derivados.dataset.danoMax = String(faixa.max + bonus);
      corpo.append(derivados);
    }
    // Marco 10A-3: dispensar as invocações (só aparece com alguma viva).
    const estado = o.estado?.();
    if (estado?.entidades.some((x) => x.invocacao?.donoId === j.id && !x.invocacao.dominado && !x.morto)) {
      corpo.append(el('h3', 'subtitulo-modal', t('ficha.invocacoes')));
      corpo.append(botao(t('ficha.dispensar'), 'dispensar', () => { agir({ t: 'dispensar' }); modal.fechar(); }));
    }
  };

  /** A assinatura do que muda a mochila (o estudo entra sem o tempo que falta, que corre a cada tick). */
  const assinaturaDe = (j: Entidade): string => {
    const b = j.bolsa;
    const estudo = b?.estudo ? { id: b.estudo.id, velocidade12: b.estudo.velocidade12 } : null;
    return JSON.stringify([b ? { ...b, estudo } : null, j.nivel, j.xp]);
  };

  const desenhar = () => {
    const j = o.jogador();
    if (!j?.bolsa) return;
    assinatura = assinaturaDe(j);
    const focoAntes = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.chave : undefined;
    const corpo = modal.corpo;
    // A dica dos atributos é da aba Ficha: sai a cada redesenho (a ficha cria outra).
    dica?.destruir();
    dica = null;
    corpo.textContent = '';
    const abas = el('div', 'abas-modal');
    abas.setAttribute('role', 'group');
    for (const [id, chave] of [
      ['itens', 'mochila.abaItens'],
      ['ficha', 'mochila.abaFicha'],
      ['habilidades', 'habilidades.aba'],
      ['diario', 'diario.aba'],
    ] as const) {
      const comPontos = (id === 'ficha' && j.bolsa.pontosAtributo > 0) || (id === 'habilidades' && j.bolsa.pontosHabilidade > 0);
      const rotulo = comPontos ? `${t(chave)} •` : t(chave);
      const b = botao(rotulo, `aba-${id}`, () => {
        aba = id;
        estadoHabilidades.essenciaInvId = null;
        desenhar();
      });
      b.setAttribute('aria-pressed', String(aba === id));
      abas.append(b);
    }
    corpo.append(abas);
    const conteudo = el('div', 'conteudo-modal');
    if (aba === 'itens') desenharItens(j, conteudo);
    else if (aba === 'ficha') desenharFicha(j, conteudo);
    else if (aba === 'habilidades') desenharHabilidades(conteudo, j, ctx, emitir, estadoHabilidades, desenhar, o.estado?.().tick ?? 0);
    else desenharDiario(conteudo, j, ctx);
    corpo.append(conteudo);
    if (focoAntes) corpo.querySelector<HTMLElement>(`[data-chave="${CSS.escape(focoAntes)}"]`)?.focus();
  };

  const atualizar = () => {
    const j = o.jogador();
    if (!j?.bolsa) {
      botaoAbrir.hidden = true;
      return;
    }
    botaoAbrir.hidden = false;
    const pontos = j.bolsa.pontosAtributo > 0 || j.bolsa.pontosHabilidade > 0;
    const rotulo = `${t('mochila.nivelCurto', { nivel: j.nivel })} · ${t('mochila.ouro', { ouro: j.bolsa.ouro })}${pontos ? ' •' : ''}`;
    if (rotulo !== rotuloBotao) {
      rotuloBotao = rotulo;
      // Ajuste de 16/10/2026 (D-067): ícones da mochila e do ouro no lugar dos emojis.
      const texto = document.createElement('span');
      texto.textContent = `${t('mochila.nivelCurto', { nivel: j.nivel })} · `;
      const ouro = document.createElement('span');
      ouro.textContent = `${t('mochila.ouro', { ouro: j.bolsa.ouro })}${pontos ? ' •' : ''}`;
      botaoAbrir.replaceChildren(icone('mochila'), texto, icone('ouro', 'icone icone-ouro'), ouro);
      botaoAbrir.setAttribute('aria-label', pontos ? t('mochila.abrirComPontos') : t('mochila.abrir'));
      botaoAbrir.classList.toggle('com-pontos', pontos);
    }
    if (modal.aberto() && assinaturaDe(j) !== assinatura) desenhar();
    // Marco 18: o que falta do estudo corre sem redesenhar a aba.
    const estudo = j.bolsa.estudo;
    const falta = estudo && modal.aberto() ? modal.corpo.querySelector<HTMLElement>(`[data-estudo-restante="${CSS.escape(estudo.id)}"]`) : null;
    if (falta && estudo) {
      const texto = t('habilidades.estudando', { tempo: duracaoLegivel(ticksRestantesDoEstudo(estudo) * DT_MS) });
      if (falta.textContent !== texto) falta.textContent = texto;
    }
  };

  return {
    botao: botaoAbrir,
    alternar: () => {
      if (modal.aberto()) modal.fechar();
      else modal.abrir();
    },
    aberta: modal.aberto,
    atualizar,
  };
}
