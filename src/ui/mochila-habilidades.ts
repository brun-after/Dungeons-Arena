// Aba "Habilidades" da mochila (D-057, D-059). Marco 14 (14/10/2026). Só lê o estado e emite comandos.
// - Pontos de habilidade (1 por nível) e as 4 teclas (pôr e tirar habilidades);
// - as conhecidas, com o rank, o que fazem (descrição gerada) e "Subir rank" — nos ranks de evolução, os
//   caminhos aparecem como cartões e a escolha é definitiva;
// - as passivas e o que a classe ainda pode aprender. Botão desabilitado diz o motivo (o mesmo da simulação).

import { resolverHabilidade } from '../combat/compilar-habilidade';
import type { Habilidade } from '../combat/habilidades';
import { chaveDoAtor, perfilPara } from '../combat/perfil';
import type { Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { MotivoHabilidade } from '../core/eventos-simulacao';
import { SLOTS_BARRA, type Entidade } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { aprendiveisDa, caminhosDoRank, motivoParaNaoSubir, nivelParaRank } from '../progression/habilidades-personagem';
import { descreverCaminho, descreverHabilidade } from './descrever';

export interface EstadoAbaHabilidades {
  /** Habilidade escolhida para ir a uma tecla (o próximo toque numa tecla a coloca). */
  escolhendo: string | null;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function botao(texto: string, chave: string, aoClicar: () => void): HTMLButtonElement {
  const b = el('button', 'botao-cabecalho', texto);
  b.type = 'button';
  b.dataset.chave = chave;
  b.addEventListener('click', aoClicar);
  return b;
}

function textoDoMotivo(m: MotivoHabilidade, ctx: ContextoSimulacao, id: string, rank: number): string {
  return t(`habilidades.motivo.${m}` as ChaveTexto, { nivel: nivelParaRank(ctx, id, rank) });
}

export function desenharHabilidades(
  corpo: HTMLElement,
  j: Entidade,
  ctx: ContextoSimulacao,
  emitir: (cmd: Comando) => void,
  ui: EstadoAbaHabilidades,
  redesenhar: () => void,
): void {
  const bolsa = j.bolsa;
  if (!bolsa) return;
  const rankMax = ctx.balance.habilidades.rankMax;
  const compilada = (id: string): Habilidade | undefined => resolverHabilidade(ctx, chaveDoAtor(ctx, j, id));
  const pontos = el('p', 'linha-pontos', t('habilidades.pontos', { n: bolsa.pontosHabilidade }));
  pontos.dataset.pontosHabilidade = String(bolsa.pontosHabilidade);
  corpo.append(pontos);

  // As 4 teclas.
  corpo.append(el('h3', 'subtitulo-modal', t('habilidades.barra')));
  const teclas = el('ul', 'lista-itens teclas-habilidade');
  for (let slot = 0; slot < SLOTS_BARRA; slot++) {
    const id = bolsa.barra[slot] ?? null;
    const h = id ? compilada(id) : undefined;
    const li = el('li', 'linha-item');
    li.dataset.tecla = String(slot + 1);
    const rotulo = h ? `${t('habilidades.tecla', { n: slot + 1 })}: ${h.icone} ${h.nome}` : t('habilidades.teclaVazia', { n: slot + 1 });
    li.append(el('span', 'conteudo-item', rotulo));
    const escolhendo = ui.escolhendo;
    if (escolhendo !== null) {
      const nome = compilada(escolhendo)?.nome ?? escolhendo;
      li.append(
        botao(t('habilidades.tecla', { n: slot + 1 }), `tecla-${slot}`, () => {
          emitir({ t: 'equiparHabilidade', id: escolhendo, slot });
          ui.escolhendo = null;
          redesenhar();
        }),
      );
      li.title = t('habilidades.escolhaTecla', { nome });
    } else if (id) {
      li.append(botao(t('habilidades.limpar'), `limpar-${slot}`, () => { emitir({ t: 'equiparHabilidade', id: null, slot }); }));
    }
    teclas.append(li);
  }
  corpo.append(teclas);

  const cartao = (id: string, conhecida: { rank: number; caminhos: string[] } | null): HTMLLIElement | null => {
    const h = conhecida ? compilada(id) : resolverHabilidade(ctx, id);
    if (!h) return null;
    const li = el('li', 'linha-item cartao-habilidade');
    li.dataset.habilidade = id;
    const textos = el('div', 'textos-item');
    const cor = h.elemento ? ctx.conteudo.elementos.get(h.elemento)?.cor : undefined;
    const titulo = el('strong', 'nome-item', `${h.icone} ${h.nome}`);
    if (cor) titulo.style.color = cor;
    textos.append(titulo);
    const perfil = perfilPara(ctx, j, h);
    const linhas = descreverHabilidade(h, { rankMax, perfilDanoPct: perfil.danoPct });
    const desc = el('ul', 'descricao-habilidade');
    for (const linha of linhas) desc.append(el('li', undefined, linha));
    textos.append(desc);
    if (conhecida && conhecida.caminhos.length > 0) {
      const nomes = conhecida.caminhos.map((c) => ctx.conteudo.caminhos.get(c)?.nome ?? c).join(', ');
      textos.append(el('p', 'detalhe-item', t('habilidades.caminhosEscolhidos', { lista: nomes })));
    }
    li.append(textos);

    const acoes = el('div', 'acoes-habilidade');
    const proximo = (conhecida?.rank ?? 0) + 1;
    const opcoes = caminhosDoRank(ctx, id, proximo);
    const motivo = motivoParaNaoSubir(ctx, j, id);
    const precisaCaminho = motivo === 'caminho_invalido' && opcoes.length > 0;
    if (proximo <= rankMax) {
      if (precisaCaminho) {
        // Rank de evolução: um cartão por caminho, escolha definitiva.
        acoes.append(el('p', 'detalhe-item', t('habilidades.caminhos', { rank: proximo })));
        const grade = el('div', 'caminhos');
        for (const cid of opcoes) {
          const c = ctx.conteudo.caminhos.get(cid);
          if (!c) continue;
          const cartaoCaminho = el('div', 'cartao-caminho');
          cartaoCaminho.append(el('strong', undefined, `${c.icone} ${c.nome}`));
          const lista = el('ul');
          for (const linha of descreverCaminho(c)) lista.append(el('li', undefined, linha));
          cartaoCaminho.append(lista);
          cartaoCaminho.append(botao(t('habilidades.escolherCaminho', { nome: c.nome }), `caminho-${id}-${cid}`, () => { emitir({ t: 'subirRank', id, caminho: cid }); }));
          grade.append(cartaoCaminho);
        }
        acoes.append(grade);
      } else {
        const rotulo = conhecida ? t('habilidades.subir', { rank: proximo }) : t('habilidades.aprender');
        const b = botao(rotulo, `subir-${id}`, () => { emitir({ t: 'subirRank', id }); });
        b.disabled = motivo !== null;
        if (motivo) {
          b.title = textoDoMotivo(motivo, ctx, id, proximo);
          acoes.append(el('span', 'detalhe-item motivo', b.title));
        }
        acoes.append(b);
      }
    }
    if (conhecida && !h.passiva && ui.escolhendo === null) {
      acoes.append(botao(t('habilidades.porNaTecla'), `tecla-para-${id}`, () => {
        ui.escolhendo = id;
        redesenhar();
      }));
    }
    li.append(acoes);
    return li;
  };

  const ativas = bolsa.conhecidas.filter((c) => !resolverHabilidade(ctx, c.id)?.passiva);
  const passivas = bolsa.conhecidas.filter((c) => resolverHabilidade(ctx, c.id)?.passiva);
  const secao = (titulo: string, itens: (HTMLLIElement | null)[]) => {
    const presentes = itens.filter((x): x is HTMLLIElement => x !== null);
    if (presentes.length === 0) return;
    corpo.append(el('h3', 'subtitulo-modal', titulo));
    const ul = el('ul', 'lista-itens');
    ul.append(...presentes);
    corpo.append(ul);
  };
  secao(t('habilidades.conhecidas'), ativas.map((c) => cartao(c.id, c)));
  secao(t('habilidades.passivas'), passivas.map((c) => cartao(c.id, c)));
  const novas = aprendiveisDa(ctx, bolsa).filter((id) => !bolsa.conhecidas.some((c) => c.id === id));
  secao(t('habilidades.aprendiveis'), novas.map((id) => cartao(id, null)));
}
