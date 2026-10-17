// Aba "Habilidades" da mochila (D-057, D-059). Marco 14 (14/10/2026). Só lê o estado e emite comandos.
// - Pontos de habilidade (1 por nível) e as 4 teclas (pôr e tirar habilidades);
// - as conhecidas, com o rank, o que fazem (descrição gerada) e "Subir rank" — nos ranks de evolução, os
//   caminhos aparecem como cartões e a escolha é definitiva;
// - as passivas e o que a classe ainda pode aprender. Botão desabilitado diz o motivo (o mesmo da simulação).
// Marco 18 (17/10/2026, D-068): cada carta mostra o grau ("Rank B/A/S"); aprender vira estudar (com o tempo já
// encurtado pela Inteligência), e a carta em estudo mostra o que falta e o botão de acelerar (1 ponto, −1/3 do total).
// Ajuste de 16/10/2026 (D-067): pôr na tecla ficou direto — as 4 teclas são blocos com o ícone no topo e cada
// carta de habilidade ativa tem os botões 1 2 3 4 (a tecla atual marcada; tocar nela de novo tira).

import { resolverHabilidade } from '../combat/compilar-habilidade';
import type { Habilidade } from '../combat/habilidades';
import { chaveDoAtor, perfilPara } from '../combat/perfil';
import type { Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { MotivoHabilidade } from '../core/eventos-simulacao';
import { SLOTS_BARRA, type Entidade } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { DT_MS } from '../core/loop';
import { aprendiveisDa, caminhosDoRank, fusoesVisiveis, motivoParaNaoSubir, nivelParaRank, ticksDeEstudo } from '../progression/habilidades-personagem';
import { definicaoDe } from '../combat/compilar-habilidade';
import { duracaoLegivel } from './tempo';
import { descreverCaminho, descreverHabilidade } from './descrever';
import { icone } from './icones';

export interface EstadoAbaHabilidades {
  /** Mantido para a mochila (D-067: a escolha agora é direta, pelos botões 1 2 3 4 da carta). */
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

  // As 4 teclas: blocos com o ícone e o nome; "tirar" esvazia a tecla.
  corpo.append(el('h3', 'subtitulo-modal', t('habilidades.barra')));
  const teclas = el('ul', 'teclas-habilidade');
  for (let slot = 0; slot < SLOTS_BARRA; slot++) {
    const id = bolsa.barra[slot] ?? null;
    const h = id ? compilada(id) : undefined;
    const li = el('li', h ? 'bloco-tecla' : 'bloco-tecla vazio');
    li.dataset.tecla = String(slot + 1);
    li.append(el('span', 'numero-tecla', String(slot + 1)), h ? icone(h.icone) : el('span', 'icone-vazio'), el('span', 'nome-tecla', h ? h.nome : t('habilidades.livre')));
    li.setAttribute('aria-label', h ? t('habilidades.tecla', { n: slot + 1 }) + `: ${h.nome}` : t('habilidades.teclaVazia', { n: slot + 1 }));
    if (id) {
      const tirar = botao('', `limpar-${slot}`, () => { emitir({ t: 'equiparHabilidade', id: null, slot }); });
      tirar.append(icone('fechar'));
      tirar.setAttribute('aria-label', t('habilidades.tirarDaTecla', { n: slot + 1 }));
      li.append(tirar);
    }
    teclas.append(li);
  }
  corpo.append(teclas);
  /** Os botões 1 2 3 4 de uma habilidade ativa conhecida: põe na tecla; na tecla em que já está, tira. */
  const botoesDeTecla = (id: string, nome: string): HTMLElement => {
    const grupo = el('div', 'teclas-da-carta');
    grupo.setAttribute('role', 'group');
    grupo.setAttribute('aria-label', t('habilidades.porNaTeclaDe', { nome }));
    grupo.append(el('span', 'detalhe-item', t('habilidades.porNaTecla')));
    for (let slot = 0; slot < SLOTS_BARRA; slot++) {
      const ja = bolsa.barra[slot] === id;
      const b = botao(String(slot + 1), `tecla-${id}-${slot}`, () => {
        emitir({ t: 'equiparHabilidade', id: ja ? null : id, slot });
        redesenhar();
      });
      b.classList.add('botao-tecla');
      b.setAttribute('aria-pressed', String(ja));
      b.setAttribute('aria-label', ja ? t('habilidades.tirarDaTecla', { n: slot + 1 }) : t('habilidades.porEmTecla', { n: slot + 1, nome }));
      grupo.append(b);
    }
    return grupo;
  };

  const cartao = (id: string, conhecida: { rank: number; caminhos: string[] } | null): HTMLLIElement | null => {
    const h = conhecida ? compilada(id) : resolverHabilidade(ctx, id);
    if (!h) return null;
    const li = el('li', 'linha-item cartao-habilidade');
    li.dataset.habilidade = id;
    const textos = el('div', 'textos-item');
    const cor = h.elemento ? ctx.conteudo.elementos.get(h.elemento)?.cor : undefined;
    const titulo = el('strong', 'nome-item');
    titulo.append(icone(h.icone), ` ${h.nome}`);
    if (cor) titulo.style.color = cor;
    const grau = el('span', `grau-habilidade grau-${h.grau}`, t('habilidades.grau', { grau: h.grau }));
    grau.title = t('habilidades.grauDica', { grau: h.grau, min: Math.round((ticksDeEstudo(ctx, j, id) * DT_MS) / 60000) });
    titulo.append(' ', grau);
    textos.append(titulo);
    const perfil = perfilPara(ctx, j, h);
    const linhas = descreverHabilidade(h, { rankMax, perfilDanoPct: perfil.danoPct });
    const desc = el('ul', 'descricao-habilidade');
    for (const linha of linhas) desc.append(el('li', undefined, linha));
    textos.append(desc);
    // Marco 18 (D-068): os marcos de nível (o do 2 e o do 4); os já alcançados aparecem acesos.
    const marcos = definicaoDe(ctx, id)?.marcos ?? {};
    const listaMarcos = Object.entries(marcos);
    if (listaMarcos.length > 0) {
      const ul = el('ul', 'marcos-habilidade');
      for (const [n, m] of listaMarcos) {
        const li = el('li', (conhecida?.rank ?? 0) >= Number(n) ? 'marco alcancado' : 'marco', t('habilidades.marco', { n, texto: m.texto }));
        ul.append(li);
      }
      textos.append(ul);
    }
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
          const nomeCaminho = el('strong');
          nomeCaminho.append(icone(c.icone), ` ${c.nome}`);
          cartaoCaminho.append(nomeCaminho);
          const lista = el('ul');
          for (const linha of descreverCaminho(c)) lista.append(el('li', undefined, linha));
          cartaoCaminho.append(lista);
          cartaoCaminho.append(botao(t('habilidades.escolherCaminho', { nome: c.nome }), `caminho-${id}-${cid}`, () => { emitir({ t: 'subirRank', id, caminho: cid }); }));
          grade.append(cartaoCaminho);
        }
        acoes.append(grade);
      } else if (!conhecida && bolsa.estudo?.id === id) {
        // Em estudo: o que falta (atualizado pela mochila a cada quadro) e o botão de acelerar.
        const falta = el('span', 'detalhe-item estudo-restante');
        falta.dataset.estudoRestante = id;
        falta.textContent = t('habilidades.estudando', { tempo: duracaoLegivel(bolsa.estudo.restanteTicks * DT_MS) });
        acoes.append(falta);
        const fatia = Math.ceil(bolsa.estudo.totalTicks / ctx.balance.habilidades.estudo.aceleracoes) * DT_MS;
        const acelerar = botao(t('habilidades.acelerar', { tempo: duracaoLegivel(fatia) }), `acelerar-${id}`, () => { emitir({ t: 'acelerarEstudo' }); });
        acelerar.disabled = bolsa.pontosHabilidade <= 0 || bolsa.estudo.aceleracoes >= ctx.balance.habilidades.estudo.aceleracoes;
        acoes.append(acelerar);
      } else {
        const rotulo = conhecida
          ? t('habilidades.subir', { rank: proximo })
          : t('habilidades.estudar', { tempo: duracaoLegivel(ticksDeEstudo(ctx, j, id) * DT_MS) });
        const b = botao(rotulo, `subir-${id}`, () => { emitir({ t: 'subirRank', id }); });
        b.disabled = motivo !== null;
        if (motivo) {
          b.title = textoDoMotivo(motivo, ctx, id, proximo);
          acoes.append(el('span', 'detalhe-item motivo', b.title));
        }
        acoes.append(b);
      }
    }
    if (conhecida && !h.passiva) acoes.append(botoesDeTecla(id, h.nome));
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
  // Marco 18 (camada 7): as fusões aparecem quando as duas partes são conhecidas.
  const fusoes = fusoesVisiveis(ctx, bolsa).filter((id) => !bolsa.conhecidas.some((c) => c.id === id));
  secao(t('habilidades.fusoes'), fusoes.map((id) => cartao(id, null)));
}
