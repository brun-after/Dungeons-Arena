// O social do Mundo no cliente (marco 30, 30/10/2026, D-129):
// - o painel ao lado do jogo: o grupo (os membros, onde estão, convidar pelo nome, sair, expulsar) e o chat (os
//   canais local, região e grupo; o nome de quem fala abre "silenciar" e "denunciar"). Silenciar é só deste
//   aparelho (guardado no navegador); a denúncia vai ao servidor;
// - o convite de grupo (aceitar ou ignorar);
// - a troca direta: propor a quem está mais perto, a oferta de cada lado, as duas confirmações.
// Texto sempre por `textContent`: o chat de outra pessoa nunca vira HTML.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { CANAIS_DO_CHAT, type AcaoDoMundo, type CanalDoChat } from '../mundo/acoes';
import type { AvisoDoMundo, OfertaVista } from '../mundo/avisos';
import { lerLugar } from '../mundo/lugares';
import type { Reino } from '../mundo/reino';
import { botao, campoNumero, comChave, linhaDeAcoes, linhaDeItem, lista, painel, paragrafo, subtitulo } from './mundo-dialogos';

type Aviso<T extends AvisoDoMundo['tipo']> = Extract<AvisoDoMundo, { tipo: T }>;

const CHAVE_SILENCIADOS = 'dungeons-arena:mundo-silenciados';

function lerSilenciados(): Set<string> {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(CHAVE_SILENCIADOS) ?? '[]');
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function gravarSilenciados(s: ReadonlySet<string>): void {
  try {
    localStorage.setItem(CHAVE_SILENCIADOS, JSON.stringify([...s]));
  } catch {
    // Sem o armazenamento (aba privada), silenciar vale só nesta visita.
  }
}

export interface OpcoesDoSocial {
  ctx: ContextoSimulacao;
  reino: Reino;
  estado: () => EstadoJogo | null;
  idLocal: () => string;
  enviar: (acao: AcaoDoMundo) => void;
  avisar: (texto: string) => void;
}

export interface PainelSocial {
  elemento: HTMLElement;
  chat(a: Aviso<'chat'>): void;
  grupo(a: Aviso<'grupo'>): void;
  convite(a: Aviso<'convite'>): void;
  troca(a: Aviso<'troca'>): void;
  /** Recolhe o painel quando a cena está no toque (a classe `toque` do body vem com a cena). */
  ajustarAoToque(): void;
}

export function criarPainelSocial(o: OpcoesDoSocial): PainelSocial {
  const regras = o.ctx.balance.mundo;
  const nomeDoItem = (id: string) => o.ctx.conteudo.itens.get(id)?.nome ?? id;
  const eu = (): Entidade | null => o.estado()?.entidades.find((e) => e.id === o.idLocal()) ?? null;
  const silenciados = lerSilenciados();

  const el = document.createElement('aside');
  el.className = 'painel-social';
  el.setAttribute('aria-label', t('mundo.social.rotulo'));
  // Recolhido, o painel é só o botão, com as mensagens novas contadas. No toque começa recolhido (a tela deitada do
  // celular não tem lugar para ele aberto o tempo todo): quem monta a tela chama `ajustarAoToque` com a cena pronta.
  let novas = 0;
  const recolher = botao('', () => {
    mostrarAberto(el.dataset.fechado === '1');
  }, false, 'botao-cabecalho');
  const mostrarAberto = (aberto: boolean) => {
    el.dataset.fechado = aberto ? '0' : '1';
    if (aberto) novas = 0;
    recolher.textContent = aberto ? t('mundo.social.recolher') : novas > 0 ? t('mundo.social.abrirNovas', { n: novas }) : t('mundo.social.abrir');
    recolher.setAttribute('aria-expanded', aberto ? 'true' : 'false');
  };
  mostrarAberto(true);

  // O grupo.
  const secaoGrupo = document.createElement('section');
  secaoGrupo.className = 'grupo-mundo';
  let meuGrupo: Aviso<'grupo'> = { tipo: 'grupo', id: null, membros: [] };
  const nomeDoLugar = (lugar: string | null) => {
    if (!lugar) return t('mundo.grupo.foraDoJogo');
    const l = lerLugar(o.reino, lugar);
    return !l ? lugar : l.tipo === 'regiao' ? l.regiao.nome : l.tipo === 'masmorra' ? l.masmorra.nome : l.covil.nome;
  };
  const desenharGrupo = () => {
    secaoGrupo.textContent = '';
    secaoGrupo.append(subtitulo(meuGrupo.id ? t('mundo.grupo.titulo', { n: meuGrupo.membros.length, max: regras.grupo.max }) : t('mundo.grupo.sem')));
    const minhaVez = eu()?.nome;
    const souLider = meuGrupo.membros.some((m) => m.lider && m.nome === minhaVez);
    const ul = lista('lista-grupo');
    for (const m of meuGrupo.membros) {
      const classe = o.ctx.conteudo.classes.get(m.classeId)?.nome ?? m.classeId;
      const texto = t(m.lider ? 'mundo.grupo.lider' : 'mundo.grupo.membro', { nome: m.nome, classe, nivel: m.nivel, lugar: nomeDoLugar(m.lugar) });
      const acoes = souLider && m.nome !== minhaVez ? [botao(t('mundo.grupo.expulsar'), () => { o.enviar({ a: 'grupo', op: 'expulsar', nome: m.nome }); }, false, 'botao-cabecalho')] : [];
      ul.append(linhaDeItem(texto, ...acoes));
    }
    secaoGrupo.append(ul);
    const form = document.createElement('form');
    form.className = 'acoes-slot';
    const nome = document.createElement('input');
    nome.maxLength = 24;
    nome.placeholder = t('mundo.grupo.nome');
    nome.setAttribute('aria-label', t('mundo.grupo.nome'));
    const convidar = document.createElement('button');
    convidar.type = 'submit';
    convidar.className = 'botao-cabecalho';
    convidar.textContent = t('mundo.grupo.convidar');
    form.append(nome, convidar);
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const n = nome.value.trim();
      if (n) o.enviar({ a: 'grupo', op: 'convidar', nome: n });
      nome.value = '';
    });
    secaoGrupo.append(form);
    const acoes: HTMLElement[] = [botao(t('mundo.troca.propor'), proporTroca, false, 'botao-cabecalho')];
    if (meuGrupo.id) acoes.push(botao(t('mundo.grupo.sair'), () => { o.enviar({ a: 'grupo', op: 'sair' }); }, false, 'botao-cabecalho'));
    if (silenciados.size > 0) {
      acoes.push(
        botao(t('mundo.chat.ouvirTodos', { n: silenciados.size }), () => {
          silenciados.clear();
          gravarSilenciados(silenciados);
          desenharGrupo();
        }, false, 'botao-cabecalho'),
      );
    }
    secaoGrupo.append(linhaDeAcoes(...acoes));
  };

  // O chat.
  const log = document.createElement('ul');
  log.className = 'log-chat';
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  const form = document.createElement('form');
  form.className = 'form-chat';
  const canal = document.createElement('select');
  canal.setAttribute('aria-label', t('mundo.chat.canal'));
  for (const c of CANAIS_DO_CHAT) {
    const op = document.createElement('option');
    op.value = c;
    op.textContent = t(`mundo.chat.canal.${c}` as ChaveTexto);
    canal.append(op);
  }
  const texto = document.createElement('input');
  texto.maxLength = regras.chat.maxTexto;
  texto.placeholder = t('mundo.chat.escrever');
  texto.setAttribute('aria-label', t('mundo.chat.escrever'));
  const enviar = document.createElement('button');
  enviar.type = 'submit';
  enviar.className = 'botao-cabecalho';
  enviar.textContent = t('mundo.chat.enviar');
  form.append(canal, texto, enviar);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const msg = texto.value.trim();
    if (!msg) return;
    o.enviar({ a: 'chat', canal: canal.value as CanalDoChat, texto: msg });
    texto.value = '';
  });
  // Esc sai do campo e devolve as teclas ao jogo.
  texto.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') texto.blur();
  });

  const menuDoNome = (li: HTMLLIElement, nome: string) => {
    li.querySelector('.menu-chat')?.remove();
    const menu = linhaDeAcoes(
      botao(t('mundo.chat.silenciar', { nome }), () => {
        silenciados.add(nome.toLowerCase());
        gravarSilenciados(silenciados);
        for (const x of log.querySelectorAll<HTMLLIElement>('li')) if (x.dataset.de === nome.toLowerCase()) x.remove();
        desenharGrupo();
      }, false, 'botao-cabecalho'),
      botao(t('mundo.chat.denunciar', { nome }), () => {
        o.enviar({ a: 'denunciar', nome, motivo: li.dataset.texto ?? '' });
        menu.remove();
      }, false, 'botao-cabecalho'),
    );
    menu.classList.add('menu-chat');
    li.append(menu);
  };

  const chat = (a: Aviso<'chat'>) => {
    if (silenciados.has(a.de.toLowerCase())) return;
    const li = document.createElement('li');
    li.dataset.canal = a.canal;
    li.dataset.de = a.de.toLowerCase();
    li.dataset.texto = a.texto;
    const rotulo = document.createElement('span');
    rotulo.className = 'canal-chat';
    rotulo.textContent = t(`mundo.chat.marca.${a.canal}` as ChaveTexto);
    li.append(rotulo);
    if (a.canal !== 'sistema') {
      const quem = botao(a.de, () => { menuDoNome(li, a.de); }, false, 'nome-chat');
      li.append(quem);
    }
    const corpo = document.createElement('span');
    corpo.textContent = a.texto;
    li.append(corpo);
    log.append(li);
    while (log.children.length > regras.chat.historico) log.firstElementChild?.remove();
    if (el.dataset.fechado === '1') {
      novas++;
      mostrarAberto(false);
    }
    log.scrollTop = log.scrollHeight;
  };

  // O chat primeiro: na tela baixa do celular, o grupo é que fica na rolagem.
  el.append(recolher, log, form, secaoGrupo);
  desenharGrupo();

  // O convite de grupo.
  const pConvite = painel(t('mundo.grupo.conviteTitulo'));
  const convite = (a: Aviso<'convite'>) => {
    pConvite.mostrar((corpo, fechar) => {
      corpo.append(paragrafo(t('mundo.grupo.convite', { de: a.de })));
      corpo.append(
        linhaDeAcoes(
          botao(t('mundo.grupo.aceitar'), () => {
            o.enviar({ a: 'grupo', op: 'aceitar', grupo: a.grupo });
            fechar();
          }),
          botao(t('mundo.grupo.ignorar'), fechar),
        ),
      );
    });
  };

  // A troca.
  const pTroca = painel(t('mundo.troca.titulo'));
  /** O que eu ainda não mandei: invId -> quantidade (vazio = a oferta como está na sala). */
  let rascunho = new Map<string, number>();
  const textoDaOferta = (of: OfertaVista) => {
    const partes = of.itens.map((i) => (i.qtd > 1 ? t('mundo.pilha', { nome: nomeDoItem(i.itemId), qtd: i.qtd }) : nomeDoItem(i.itemId)));
    if (of.ouro > 0) partes.push(t('mundo.quadro.ouro', { ouro: of.ouro }));
    return partes.length > 0 ? partes.join(' · ') : t('mundo.troca.nada');
  };
  function proporTroca(): void {
    const estado = o.estado();
    const meu = eu();
    if (!estado || !meu) return;
    const raio = regras.troca.raio;
    const perto = estado.entidades
      .filter((e) => e.id !== meu.id && !e.morto && e.controlador !== 'ia' && !e.invocacao)
      .map((e) => ({ e, d: Math.max(Math.abs(e.x - meu.x), Math.abs(e.y - meu.y)) }))
      .filter((x) => x.d <= raio)
      .sort((a, b) => a.d - b.d)[0];
    if (!perto) {
      o.avisar(t('mundo.troca.ninguem', { raio }));
      return;
    }
    o.enviar({ a: 'troca', op: 'propor', alvo: perto.e.id });
    o.avisar(t('mundo.troca.proposta', { nome: perto.e.nome }));
  }
  const troca = (a: Aviso<'troca'>) => {
    if (a.estado === 'feita' || a.estado === 'cancelada') {
      pTroca.fechar();
      rascunho = new Map();
      o.avisar(t(a.estado === 'feita' ? 'mundo.troca.feita' : 'mundo.troca.cancelada', { nome: a.com }));
      return;
    }
    pTroca.mostrar((corpo, fechar) => {
      if (a.estado === 'convite') {
        corpo.append(paragrafo(t('mundo.troca.convite', { nome: a.com })));
        corpo.append(
          linhaDeAcoes(
            botao(t('mundo.troca.aceitar'), () => { o.enviar({ a: 'troca', op: 'aceitar', de: a.comId }); }),
            botao(t('mundo.grupo.ignorar'), fechar),
          ),
        );
        return;
      }
      corpo.append(paragrafo(t('mundo.troca.texto', { nome: a.com })));
      corpo.append(subtitulo(t('mundo.troca.dele', { nome: a.com })), paragrafo(textoDaOferta(a.dele), 'texto-mundo'));
      if (a.confirmou) corpo.append(paragrafo(t('mundo.troca.eleConfirmou', { nome: a.com }), 'texto-mundo'));
      corpo.append(subtitulo(t('mundo.troca.minha')), paragrafo(textoDaOferta(a.minha), 'texto-mundo'));
      // A mochila: marcar o que vai na oferta (até o máximo de itens da troca).
      const ul = lista();
      for (const i of eu()?.bolsa?.mochila ?? []) {
        const marcado = rascunho.has(i.invId);
        const nome = i.qtd > 1 ? t('mundo.pilha', { nome: nomeDoItem(i.itemId), qtd: i.qtd }) : nomeDoItem(i.itemId);
        const b = botao(marcado ? t('mundo.troca.tirar') : t('mundo.troca.por'), () => {
          if (marcado) rascunho.delete(i.invId);
          else if (rascunho.size < regras.troca.maxItens) rascunho.set(i.invId, i.qtd);
          troca(a);
        }, !marcado && rascunho.size >= regras.troca.maxItens, 'botao-cabecalho');
        ul.append(linhaDeItem(nome, comChave(b, `por-${i.invId}`)));
      }
      corpo.append(ul);
      const ouro = campoNumero(t('mundo.troca.ouro'), a.minha.ouro, 0, eu()?.bolsa?.ouro ?? 0);
      corpo.append(
        linhaDeAcoes(
          ouro.el,
          comChave(botao(t('mundo.troca.oferecer'), () => {
            o.enviar({ a: 'troca', op: 'oferecer', itens: [...rascunho].map(([invId, qtd]) => ({ invId, qtd })), ouro: ouro.valor() });
          }), 'oferecer'),
        ),
      );
      corpo.append(
        linhaDeAcoes(
          comChave(botao(a.confirmei ? t('mundo.troca.confirmei') : t('mundo.troca.confirmar'), () => { o.enviar({ a: 'troca', op: 'confirmar' }); }, a.confirmei), 'confirmar'),
          botao(t('mundo.troca.cancelar'), () => { o.enviar({ a: 'troca', op: 'cancelar' }); }),
        ),
      );
    });
  };

  return {
    elemento: el,
    chat,
    grupo: (a) => {
      meuGrupo = a;
      desenharGrupo();
    },
    convite,
    troca,
    ajustarAoToque: () => {
      if (document.body.classList.contains('toque')) mostrarAberto(false);
    },
  };
}
