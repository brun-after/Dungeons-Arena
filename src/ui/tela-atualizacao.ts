// A tela de atualização do personagem (marco 39, 12/11/2026, D-149). Aparece ao entrar no jogo com um personagem criado
// antes do sistema novo (sem `bolsa.sistema`), uma vez por sessão até ser confirmada. Explica o que mudou, devolve todos
// os pontos no orçamento novo e já propõe a build antiga na mesma proporção (o jogador não começa do zero), com o
// pentagrama ao vivo e "−"/"+" em cada atributo. Confirmar manda o comando `atualizarSistema`, que a simulação confere.
// Textos sempre por textContent.

import type { Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { Bolsa, Entidade } from '../entities/entidade';
import { t } from '../i18n';
import { pontosAntes, pontosDaAtualizacao, precisaDaAtualizacao } from '../progression/atualizacao-39';
import { derivarFicha } from '../progression/derivados';
import { NOMES_ATRIBUTOS, type NomeAtributo } from '../progression/itens';
import { tetoDoAtributo } from '../progression/nivel';
import { nomeDoAtributo } from './dica-atributo';
import { criarModal } from './modal';
import { painelDeEstilos } from './radar-estilos';

export interface OpcoesTelaAtualizacao {
  ctx: ContextoSimulacao;
  jogador: () => Entidade | undefined;
  emitir: (cmd: Comando) => void;
}

type Pontos = Record<NomeAtributo, number>;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

/**
 * A build de antes na proporção do orçamento novo: os pontos que o jogador pôs acima da base da classe, escalados, com
 * o teto do nível; o arredondamento sobra para os atributos com maior parte (maior resto primeiro). Exportada para teste.
 */
export function proporcaoDeAntes(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, bolsa: Bolsa, nivel: number): Pontos {
  const base = ctx.conteudo.classes.get(bolsa.classeId)?.atributos ?? bolsa.atributosBase;
  const postos = Object.fromEntries(NOMES_ATRIBUTOS.map((a) => [a, Math.max(0, bolsa.atributosBase[a] - base[a])])) as Pontos;
  const soma = NOMES_ATRIBUTOS.reduce((s, a) => s + postos[a], 0);
  const novo = pontosDaAtualizacao({ nivel }, ctx);
  const teto = (a: NomeAtributo) => tetoDoAtributo(nivel, ctx.balance, base[a]);
  const saida = Object.fromEntries(NOMES_ATRIBUTOS.map((a) => [a, 0])) as Pontos;
  if (soma <= 0) return saida;
  const partes = NOMES_ATRIBUTOS.map((a) => ({ a, v: (postos[a] * novo) / soma }));
  let usados = 0;
  for (const p of partes) {
    saida[p.a] = Math.min(Math.floor(p.v), teto(p.a) - base[p.a]);
    usados += saida[p.a];
  }
  for (const p of [...partes].sort((x, y) => (y.v % 1) - (x.v % 1))) {
    if (usados >= novo) break;
    if (base[p.a] + saida[p.a] < teto(p.a) && p.v > 0) {
      saida[p.a]++;
      usados++;
    }
  }
  return saida;
}

export function criarTelaAtualizacao(o: OpcoesTelaAtualizacao): { atualizar: () => void } {
  const { ctx } = o;
  let mostrada = false;
  // Depois de confirmar, espera a simulação marcar o personagem (pela rede, alguns quadros) sem reabrir.
  let confirmada = false;
  let rascunho: Pontos | null = null;
  // Fechar sem confirmar só adia: a tela volta no quadro seguinte (o personagem antigo não joga com o orçamento velho).
  const modal = criarModal({ titulo: t('atualizacao.titulo'), rotuloFechar: t('atualizacao.fechar'), classe: 'modal-atualizacao', aoFechar: () => { mostrada = false; } });

  const desenhar = (j: Entidade, bolsa: Bolsa) => {
    const r = rascunho;
    if (!r) return;
    const base = ctx.conteudo.classes.get(bolsa.classeId)?.atributos ?? bolsa.atributosBase;
    const total = pontosDaAtualizacao(j, ctx);
    const usados = NOMES_ATRIBUTOS.reduce((s, a) => s + r[a], 0);
    const teto = (a: NomeAtributo) => tetoDoAtributo(j.nivel, ctx.balance, base[a]);
    const corpo = modal.corpo;
    corpo.replaceChildren();
    corpo.append(
      el('p', 'detalhe-item', t('atualizacao.texto')),
      el('p', 'detalhe-item', t('atualizacao.orcamento', { antes: pontosAntes(bolsa, ctx), agora: total })),
      el('p', 'linha-pontos', t('atualizacao.livres', { n: total - usados })),
    );
    const tabela = el('table', 'tabela-ficha');
    for (const a of NOMES_ATRIBUTOS) {
      const tr = el('tr');
      tr.dataset.atributo = a;
      const menos = el('button', 'botao-pequeno', '−');
      menos.type = 'button';
      menos.disabled = r[a] <= 0;
      menos.setAttribute('aria-label', t('atualizacao.menos', { atributo: nomeDoAtributo(a, bolsa.classeId) }));
      menos.addEventListener('click', () => { r[a]--; desenhar(j, bolsa); });
      const mais = el('button', 'botao-pequeno', '+');
      mais.type = 'button';
      mais.disabled = usados >= total || base[a] + r[a] >= teto(a);
      mais.setAttribute('aria-label', t('atualizacao.mais', { atributo: nomeDoAtributo(a, bolsa.classeId) }));
      mais.addEventListener('click', () => { r[a]++; desenhar(j, bolsa); });
      const celula = el('td');
      celula.append(menos, ' ', mais);
      tr.append(el('td', 'nome-atributo', nomeDoAtributo(a, bolsa.classeId)), el('td', 'efetivo', String(base[a] + r[a])), celula);
      tabela.append(tr);
    }
    corpo.append(tabela);
    // O pentagrama ao vivo, com os itens já equipados.
    const atributosBase = { ...base };
    for (const a of NOMES_ATRIBUTOS) atributosBase[a] = base[a] + r[a];
    const previa: Bolsa = { ...bolsa, atributosBase };
    const estilos = painelDeEstilos(ctx, previa, derivarFicha(previa, j.nivel, ctx).atributos, j.nivel);
    if (estilos) corpo.append(estilos);
    const acoes = el('div', 'acoes-atualizacao');
    const antes = el('button', 'botao', t('atualizacao.comoAntes'));
    antes.type = 'button';
    antes.addEventListener('click', () => { rascunho = proporcaoDeAntes(ctx, bolsa, j.nivel); desenhar(j, bolsa); });
    const zerar = el('button', 'botao', t('atualizacao.zerar'));
    zerar.type = 'button';
    zerar.addEventListener('click', () => { rascunho = Object.fromEntries(NOMES_ATRIBUTOS.map((a) => [a, 0])) as Pontos; desenhar(j, bolsa); });
    const confirmar = el('button', 'botao botao-primario', t('atualizacao.confirmar'));
    confirmar.type = 'button';
    confirmar.dataset.acao = 'confirmar-atualizacao';
    confirmar.addEventListener('click', () => { o.emitir({ t: 'atualizarSistema', pontos: { ...r } }); confirmada = true; modal.fechar(); });
    acoes.append(antes, zerar, confirmar);
    corpo.append(acoes);
  };

  return {
    atualizar: () => {
      const j = o.jogador();
      const bolsa = j?.bolsa;
      if (!j || !bolsa || mostrada || confirmada || !precisaDaAtualizacao(bolsa)) return;
      mostrada = true;
      rascunho = proporcaoDeAntes(ctx, bolsa, j.nivel);
      desenhar(j, bolsa);
      modal.abrir();
    },
  };
}
