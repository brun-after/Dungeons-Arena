// A janela da troca direta do Mundo (25/11/2026, D-205; antes, dentro de mundo-social.ts, marco 30). Agora parece
// dois inventários frente a frente: à esquerda a sua oferta, à direita a do outro, cada uma com as casas da troca
// (`mundo.troca.maxItens`) e o ouro embaixo; a sua mochila fica abaixo para pôr itens com um clique. Cada mudança vai
// na hora (sem o "Atualizar a oferta", que parecia ser do ouro). O ouro tem botões próprios:
// - Adicionar gold: manda ouro (a janela mostra quanto você tem);
// - Cobrar: em vez de mandar, pede um valor (o preço de um item). O outro paga (põe o valor) ou faz uma
//   contraproposta (põe menos); quem cobrou aceita a contraproposta baixando a cobrança. Confirmar fica travado
//   enquanto uma cobrança não estiver coberta (a sala recusa também).
// O chat da troca começa desligado (o botão conta as falas novas) e só vai ao outro lado; dá para silenciar o outro
// só nesta troca ou para sempre (a mesma lista do chat do Mundo, guardada no aparelho).
// Texto sempre por `textContent`.

import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { t } from '../i18n';
import type { AcaoDoMundo } from '../mundo/acoes';
import type { AvisoDoMundo } from '../mundo/avisos';
import { icone, iconeDoItem } from './icones';
import { botao, comChave, painel, paragrafo } from './mundo-dialogos';
import './troca.css';

type AvisoTroca = Extract<AvisoDoMundo, { tipo: 'troca' }>;
type AvisoChat = Extract<AvisoDoMundo, { tipo: 'chat' }>;

export interface OpcoesDaTroca {
  ctx: ContextoSimulacao;
  eu: () => Entidade | null;
  enviar: (acao: AcaoDoMundo) => void;
  avisar: (texto: string) => void;
  /** A lista de silenciados do chat do Mundo (em minúsculas) e como gravá-la. */
  silenciados: Set<string>;
  gravarSilenciados: () => void;
}

export interface JanelaDaTroca {
  troca: (a: AvisoTroca) => void;
  /** A fala do chat da troca (canal 'troca'). */
  chat: (a: AvisoChat) => void;
}

type Edicao = 'ouro' | 'cobrar' | 'contra';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, classe: string, texto?: string): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
};

/** A seta entre os dois lados (o ícone da troca, sem pictograma de texto). */
function seta(): HTMLElement {
  const div = document.createElement('div');
  div.className = 'seta-troca';
  div.append(icone('troca'));
  return div;
}

export function criarJanelaTroca(o: OpcoesDaTroca): JanelaDaTroca {
  const regras = o.ctx.balance.mundo.troca;
  const itemDe = (id: string) => o.ctx.conteudo.itens.get(id);
  const cancelar = () => { o.enviar({ a: 'troca', op: 'cancelar' }); };
  const p = painel(t('mundo.troca.titulo'), cancelar);

  let atual: AvisoTroca | null = null;
  /** O que eu ponho: invId -> quantidade (a fonte da minha coluna; a sala só devolve itemId e quantidade). */
  let minha = new Map<string, number>();
  let edicao: Edicao | null = null;
  const campo = document.createElement('input');
  campo.type = 'number';
  campo.min = '0';
  campo.step = '1';
  campo.className = 'campo-ouro-troca';
  comChave(campo, 'ouro-troca');

  // O chat da troca: elementos que sobrevivem ao redesenho (o texto digitado e as falas ficam).
  let chatLigado = false;
  let novas = 0;
  let silenciadoNaTroca = false;
  const log = el('ul', 'log-chat log-troca');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  const formChat = el('form', 'form-chat');
  const entrada = document.createElement('input');
  entrada.maxLength = o.ctx.balance.mundo.chat.maxTexto;
  entrada.placeholder = t('mundo.chat.escrever');
  entrada.setAttribute('aria-label', t('mundo.troca.chatEscrever'));
  comChave(entrada, 'chat-troca');
  const enviarFala = el('button', 'botao-cabecalho', t('mundo.chat.enviar'));
  enviarFala.type = 'submit';
  formChat.append(entrada, enviarFala);
  formChat.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const texto = entrada.value.trim();
    if (texto) o.enviar({ a: 'troca', op: 'falar', texto });
    entrada.value = '';
  });
  entrada.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') entrada.blur(); });

  const zerar = () => {
    atual = null;
    minha = new Map();
    edicao = null;
    chatLigado = false;
    novas = 0;
    silenciadoNaTroca = false;
    log.textContent = '';
  };

  const redesenhar = () => { if (atual) troca(atual); };

  /** Manda a oferta inteira como está (itens marcados, ouro e cobrança). */
  const enviarOferta = (ouro: number, cobra: number) => {
    o.enviar({ a: 'troca', op: 'oferecer', itens: [...minha].map(([invId, qtd]) => ({ invId, qtd })), ouro, cobra });
  };

  const casa = (itemId: string | null, qtd: number, acao?: () => void, rotuloAcao?: string): HTMLElement => {
    const c = el('div', itemId ? 'casa-troca' : 'casa-troca vazia');
    if (!itemId) return c;
    const item = itemDe(itemId);
    c.append(iconeDoItem(item?.icone ?? itemId), el('span', 'nome-casa', item?.nome ?? itemId));
    if (qtd > 1) c.append(el('span', 'qtd-casa', `×${String(qtd)}`));
    c.title = item?.nome ?? itemId;
    if (acao && rotuloAcao) {
      const x = botao('×', acao, false, 'tirar-casa');
      x.setAttribute('aria-label', rotuloAcao);
      c.append(x);
    }
    return c;
  };

  const casas = (pilhas: { itemId: string; qtd: number; tirar?: () => void }[]): HTMLElement => {
    const g = el('div', 'casas-troca');
    for (let i = 0; i < regras.maxItens; i++) {
      const pl = pilhas[i];
      g.append(pl ? casa(pl.itemId, pl.qtd, pl.tirar, t('mundo.troca.tirar')) : casa(null, 0));
    }
    return g;
  };

  const selo = (confirmou: boolean) => el('span', confirmou ? 'selo-troca confirmado' : 'selo-troca', t(confirmou ? 'mundo.troca.selo.confirmou' : 'mundo.troca.selo.aguarda'));

  /** A linha do campo de ouro em edição (adicionar, cobrar ou contrapropor). */
  const linhaDeEdicao = (tipo: Edicao, maximo: number, aoConfirmar: (v: number) => void): HTMLElement => {
    const d = el('div', 'edicao-ouro');
    campo.max = String(maximo);
    if (campo.dataset.tipo !== tipo) {
      campo.dataset.tipo = tipo;
      campo.value = '';
    }
    campo.setAttribute('aria-label', t(`mundo.troca.campo.${tipo}`));
    const ok = botao(t(`mundo.troca.enviar.${tipo}`), () => {
      const v = Math.min(maximo, Math.max(0, Math.floor(Number(campo.value) || 0)));
      edicao = null;
      campo.value = '';
      delete campo.dataset.tipo;
      aoConfirmar(v);
      redesenhar();
    }, false, 'botao-cabecalho');
    d.append(el('span', 'rotulo-edicao', t(`mundo.troca.campo.${tipo}`)), campo, ok, botao(t('mundo.troca.voltar'), () => { edicao = null; redesenhar(); }, false, 'botao-cabecalho'));
    return d;
  };

  const minhaColuna = (a: AvisoTroca, eu: Entidade | null): HTMLElement => {
    const col = el('section', 'coluna-troca minha');
    const cab = el('header', 'cabeca-coluna');
    cab.append(el('h3', 'subtitulo-modal', t('mundo.troca.minha')), selo(a.confirmei));
    col.append(cab);
    const mochila = eu?.bolsa?.mochila ?? [];
    col.append(casas([...minha].flatMap(([invId, qtd]) => {
      const m = mochila.find((x) => x.invId === invId);
      return m ? [{ itemId: m.itemId, qtd, tirar: () => { minha.delete(invId); enviarOferta(a.minha.ouro, a.minha.cobra); redesenhar(); } }] : [];
    })));
    const meuOuro = eu?.bolsa?.ouro ?? 0;
    const ouro = el('div', 'ouro-troca');
    ouro.append(el('span', 'saldo-troca', t('mundo.troca.saldo', { ouro: meuOuro })));
    if (a.minha.ouro > 0) ouro.append(el('span', 'valor-troca', t('mundo.troca.mando', { ouro: a.minha.ouro })));
    if (a.minha.cobra > 0) ouro.append(el('span', 'valor-troca cobra', t('mundo.troca.cobro', { ouro: a.minha.cobra })));
    col.append(ouro);
    if (edicao === 'ouro') col.append(linhaDeEdicao('ouro', meuOuro, (v) => { enviarOferta(v, 0); }));
    else if (edicao === 'cobrar') col.append(linhaDeEdicao('cobrar', 100_000_000, (v) => { enviarOferta(0, v); }));
    else {
      // Sem valor, os dois botões; com um valor posto, mudar ou tirar só aquele (manda ouro ou cobra, nunca os dois).
      const acoes = el('div', 'acoes-ouro');
      const tipo: Edicao | null = a.minha.ouro > 0 ? 'ouro' : a.minha.cobra > 0 ? 'cobrar' : null;
      if (tipo) {
        acoes.append(
          comChave(botao(t(tipo === 'ouro' ? 'mundo.troca.mudarOuro' : 'mundo.troca.mudarCobranca'), () => { edicao = tipo; redesenhar(); }, false, 'botao-cabecalho'), 'mudar-ouro'),
          botao(t(tipo === 'ouro' ? 'mundo.troca.tirarOuro' : 'mundo.troca.tirarCobranca'), () => { enviarOferta(0, 0); }, false, 'botao-cabecalho'),
        );
      } else {
        acoes.append(
          comChave(botao(t('mundo.troca.adicionarOuro'), () => { edicao = 'ouro'; redesenhar(); }, meuOuro <= 0, 'botao-cabecalho botao-ouro'), 'adicionar-ouro'),
          comChave(botao(t('mundo.troca.cobrar'), () => { edicao = 'cobrar'; redesenhar(); }, false, 'botao-cabecalho botao-cobrar'), 'cobrar'),
        );
      }
      col.append(acoes);
    }
    return col;
  };

  const colunaDele = (a: AvisoTroca, eu: Entidade | null): HTMLElement => {
    const col = el('section', 'coluna-troca dele');
    const cab = el('header', 'cabeca-coluna');
    cab.append(el('h3', 'subtitulo-modal', t('mundo.troca.dele', { nome: a.com })), selo(a.confirmou));
    col.append(cab, casas(a.dele.itens));
    const ouro = el('div', 'ouro-troca');
    if (a.dele.ouro > 0) {
      // Pondo menos do que eu cobro, é uma contraproposta.
      const contra = a.minha.cobra > 0 && a.dele.ouro < a.minha.cobra;
      ouro.append(el('span', contra ? 'valor-troca cobra' : 'valor-troca', t(contra ? 'mundo.troca.contraproposta' : 'mundo.troca.manda', { nome: a.com, ouro: a.dele.ouro, pedido: a.minha.cobra })));
      if (contra) ouro.append(comChave(botao(t('mundo.troca.aceitarContra', { ouro: a.dele.ouro }), () => { enviarOferta(0, a.dele.ouro); }, false, 'botao-cabecalho'), 'aceitar-contra'));
    }
    if (a.dele.cobra > 0) {
      const paguei = a.minha.ouro >= a.dele.cobra;
      ouro.append(el('span', 'valor-troca cobra', t(paguei ? 'mundo.troca.cobraPaga' : 'mundo.troca.cobra', { nome: a.com, ouro: a.dele.cobra })));
      const meuOuro = eu?.bolsa?.ouro ?? 0;
      if (!paguei && edicao !== 'contra') {
        ouro.append(
          comChave(botao(t('mundo.troca.pagar', { ouro: a.dele.cobra }), () => { enviarOferta(a.dele.cobra, 0); }, meuOuro < a.dele.cobra, 'botao-cabecalho botao-ouro'), 'pagar'),
          comChave(botao(t('mundo.troca.contrapropor'), () => { edicao = 'contra'; redesenhar(); }, meuOuro <= 0, 'botao-cabecalho'), 'contrapropor'),
        );
      }
      if (edicao === 'contra') ouro.append(linhaDeEdicao('contra', Math.min(meuOuro, a.dele.cobra), (v) => { enviarOferta(v, 0); }));
    }
    if (a.dele.ouro === 0 && a.dele.cobra === 0) ouro.append(el('span', 'valor-troca nada', t('mundo.troca.semOuro')));
    col.append(ouro);
    return col;
  };

  /** A sua mochila, para pôr itens na oferta com um clique. */
  const suaMochila = (a: AvisoTroca, eu: Entidade | null): HTMLElement => {
    const s = el('section', 'mochila-troca');
    s.append(el('h3', 'subtitulo-modal', t('mundo.troca.suaMochila')));
    const g = el('div', 'grade-mochila-troca');
    const cheia = minha.size >= regras.maxItens;
    for (const i of eu?.bolsa?.mochila ?? []) {
      const posta = minha.has(i.invId);
      const item = itemDe(i.itemId);
      const b = comChave(botao('', () => {
        if (posta) minha.delete(i.invId);
        else if (!cheia) minha.set(i.invId, i.qtd);
        enviarOferta(a.minha.ouro, a.minha.cobra);
        redesenhar();
      }, !posta && cheia, posta ? 'item-mochila-troca posto' : 'item-mochila-troca'), `por-${i.invId}`);
      b.append(iconeDoItem(item?.icone ?? i.itemId));
      if (i.qtd > 1) b.append(el('span', 'qtd-casa', `×${String(i.qtd)}`));
      const nome = item?.nome ?? i.itemId;
      b.title = posta ? t('mundo.troca.tirarNome', { nome }) : t('mundo.troca.porNome', { nome });
      b.setAttribute('aria-label', b.title);
      b.setAttribute('aria-pressed', String(posta));
      g.append(b);
    }
    if (g.childElementCount === 0) g.append(paragrafo(t('mundo.troca.mochilaVazia')));
    s.append(g);
    return s;
  };

  const silenciadoSempre = (nome: string) => o.silenciados.has(nome.toLowerCase());

  const secaoChat = (a: AvisoTroca): HTMLElement => {
    const s = el('section', 'chat-troca');
    if (silenciadoNaTroca || silenciadoSempre(a.com)) {
      s.append(paragrafo(t('mundo.troca.chatSilenciado', { nome: a.com })));
      if (silenciadoNaTroca && !silenciadoSempre(a.com)) s.append(botao(t('mundo.troca.ouvir'), () => { silenciadoNaTroca = false; redesenhar(); }, false, 'botao-cabecalho'));
    }
    s.append(log, formChat);
    const acoes = el('div', 'acoes-slot');
    if (!silenciadoNaTroca && !silenciadoSempre(a.com)) {
      acoes.append(
        botao(t('mundo.troca.silenciarAqui', { nome: a.com }), () => { silenciadoNaTroca = true; redesenhar(); }, false, 'botao-cabecalho'),
        botao(t('mundo.troca.silenciarSempre', { nome: a.com }), () => {
          o.silenciados.add(a.com.toLowerCase());
          o.gravarSilenciados();
          redesenhar();
        }, false, 'botao-cabecalho'),
      );
    }
    s.append(acoes);
    return s;
  };

  function troca(a: AvisoTroca): void {
    if (a.estado === 'feita' || a.estado === 'cancelada') {
      p.fechar();
      zerar();
      o.avisar(t(a.estado === 'feita' ? 'mundo.troca.feita' : 'mundo.troca.cancelada', { nome: a.com }));
      return;
    }
    atual = a;
    p.mostrar((corpo, fechar) => {
      corpo.classList.add('corpo-troca');
      if (a.estado === 'convite') {
        corpo.append(paragrafo(t('mundo.troca.convite', { nome: a.com })));
        const acoes = el('div', 'acoes-slot');
        acoes.append(
          botao(t('mundo.troca.aceitar'), () => { o.enviar({ a: 'troca', op: 'aceitar', de: a.comId }); }),
          botao(t('mundo.grupo.ignorar'), () => { fechar(); cancelar(); }),
        );
        corpo.append(acoes);
        return;
      }
      const eu = o.eu();
      corpo.append(paragrafo(t('mundo.troca.texto', { nome: a.com }), 'texto-mundo'));
      const grade = el('div', 'grade-troca');
      grade.append(minhaColuna(a, eu), seta(), colunaDele(a, eu));
      corpo.append(grade, suaMochila(a, eu));
      if (chatLigado) corpo.append(secaoChat(a));
      const pendente = a.minha.cobra > a.dele.ouro || a.dele.cobra > a.minha.ouro;
      const rodape = el('div', 'rodape-troca');
      const rotuloChat = chatLigado ? t('mundo.troca.chatFechar') : novas === 1 ? t('mundo.troca.chatNova') : novas > 1 ? t('mundo.troca.chatNovas', { n: novas }) : t('mundo.troca.chatAbrir');
      const confirmar = comChave(botao(a.confirmei ? t('mundo.troca.confirmei') : t('mundo.troca.confirmar'), () => { o.enviar({ a: 'troca', op: 'confirmar' }); }, a.confirmei || pendente, 'botao-menu'), 'confirmar');
      if (pendente) confirmar.title = t('mundo.troca.cobrancaPendente');
      rodape.append(
        comChave(botao(rotuloChat, () => { chatLigado = !chatLigado; if (chatLigado) novas = 0; redesenhar(); }, false, novas > 0 && !chatLigado ? 'botao-cabecalho com-novas' : 'botao-cabecalho'), 'chat-ligar'),
        el('span', 'espaco-rodape'),
        confirmar,
        botao(t('mundo.troca.cancelar'), cancelar, false, 'botao-cabecalho'),
      );
      if (pendente) corpo.append(paragrafo(t('mundo.troca.cobrancaPendente'), 'aviso-cobranca'));
      corpo.append(rodape);
    });
  }

  return {
    troca,
    chat: (a) => {
      const minhaFala = a.de === o.eu()?.nome;
      if (!minhaFala && (silenciadoNaTroca || silenciadoSempre(a.de))) return;
      const li = el('li', minhaFala ? 'fala-minha' : 'fala-dele');
      li.append(el('span', 'nome-chat', a.de), el('span', 'texto-fala', a.texto));
      log.append(li);
      while (log.children.length > o.ctx.balance.mundo.chat.historico) log.firstElementChild?.remove();
      log.scrollTop = log.scrollHeight;
      if (!chatLigado && !minhaFala) {
        novas++;
        redesenhar();
      }
    },
  };
}

