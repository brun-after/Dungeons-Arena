// Painel da Sintonia na aba Habilidades (marco 24, 24/10/2026, D-095): as famílias das gerais nas teclas 3 a 6 e o que
// cada uma liga na passiva da classe, os Domínios (que marcam a ultimate), a vertente ligada e as possíveis, e, no Mago,
// a encarnação e a dupla. Também as passivas gerais ligadas (até 3), com o botão de ligar ou desligar em cada uma.
// Só lê o estado e emite comandos; a simulação recusa a troca em combate e avisa pelo evento.

import { duplaDe, encarnacaoDe, encarnaveis } from '../combat/encarnacao';
import type { Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { ehPassivaGeral } from '../progression/passivas-gerais';
import { sintoniaDe } from '../progression/sintonia';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

const nomeDaFamilia = (f: string) => t(`sintonia.familia.${f}` as ChaveTexto);

/** O bloco da Sintonia (famílias, Domínios, vertentes e, no Mago, a encarnação). */
export function desenharSintonia(corpo: HTMLElement, j: Entidade, ctx: ContextoSimulacao, tick: number): void {
  const classe = j.bolsa?.classeId ?? j.classeId ?? '';
  const regras = ctx.conteudo.sintonia;
  const s = sintoniaDe(ctx, j);
  const bloco = el('section', 'painel-sintonia');
  bloco.dataset.testid = 'painel-sintonia';
  bloco.append(el('h3', 'subtitulo-modal', t('sintonia.titulo')));
  const familias = Object.keys(s.familias);
  if (familias.length === 0) bloco.append(el('p', 'detalhe-item', t('sintonia.vazia')));
  const ul = el('ul', 'lista-sintonia');
  for (const f of familias) {
    const dominio = s.dominios.includes(f);
    const li = el('li', dominio ? 'familia dominio' : 'familia');
    li.dataset.familia = f;
    li.append(el('strong', undefined, t('sintonia.linha', { familia: nomeDaFamilia(f), n: s.familias[f] ?? 0 })));
    li.append(el('span', 'detalhe-item', regras.classes[classe]?.[f] ?? ''));
    if (dominio) li.append(el('span', 'detalhe-item marca-dominio', t('sintonia.dominio', { texto: regras.dominios[f] ?? '' })));
    ul.append(li);
  }
  bloco.append(ul);
  if (s.vertente) {
    const v = el('p', 'vertente-ativa', t('sintonia.vertente', { nome: s.vertente.nome, texto: s.vertente.texto }));
    v.dataset.vertente = s.vertente.id;
    bloco.append(v);
  }
  const possiveis = regras.vertentes.filter((v) => v.classe === classe && v.id !== s.vertente?.id);
  if (possiveis.length > 0) {
    const lista = el('ul', 'vertentes-possiveis');
    for (const v of possiveis) lista.append(el('li', 'detalhe-item', t('sintonia.vertentePossivel', { nome: v.nome, a: nomeDaFamilia(v.familias[0]), b: nomeDaFamilia(v.familias[1]) })));
    bloco.append(lista);
  }
  // No Mago: os elementos que encarna, o atual e a dupla.
  if (classe === 'mago') {
    const nomes = encarnaveis(ctx, j, tick).map((x) => t(`hud.encarnacao.${x}` as ChaveTexto)).join(', ');
    bloco.append(el('p', 'detalhe-item', t('sintonia.encarnaveis', { lista: nomes })));
    const atual = encarnacaoDe(j);
    const dupla = duplaDe(j, tick);
    const fusao = dupla ? regras.encarnacoesDuplas.find((d) => d.id === dupla) : undefined;
    if (atual) bloco.append(el('p', 'detalhe-item', t('sintonia.encarnado', { nome: t(`hud.encarnacao.${atual}` as ChaveTexto) })));
    if (fusao) bloco.append(el('p', 'vertente-ativa', t('sintonia.dupla', { nome: fusao.nome, texto: fusao.texto })));
  }
  corpo.append(bloco);
}

/** As passivas gerais conhecidas, com o contador de ligadas e o botão de cada uma. */
export function desenharPassivasGerais(corpo: HTMLElement, j: Entidade, ctx: ContextoSimulacao, emitir: (cmd: Comando) => void, redesenhar: () => void): void {
  const bolsa = j.bolsa;
  if (!bolsa) return;
  const gerais = bolsa.conhecidas.filter((c) => ehPassivaGeral(ctx, c.id));
  if (gerais.length === 0) return;
  const ativas = bolsa.passivasAtivas ?? [];
  const max = ctx.balance.passivasGerais.maxAtivas;
  const bloco = el('section', 'painel-passivas');
  bloco.dataset.testid = 'painel-passivas';
  bloco.append(el('h3', 'subtitulo-modal', t('passivas.titulo', { n: ativas.length, max })));
  bloco.append(el('p', 'detalhe-item', t('passivas.dica')));
  const ul = el('ul', 'lista-passivas');
  for (const c of gerais) {
    const ligada = ativas.includes(c.id);
    const nome = ctx.conteudo.definicoes.get(c.id)?.base.nome ?? c.id;
    const li = el('li', ligada ? 'passiva ligada' : 'passiva');
    li.dataset.passiva = c.id;
    li.append(el('span', 'nome-item', nome));
    const b = el('button', 'botao-cabecalho', t(ligada ? 'passivas.desligar' : 'passivas.ligar'));
    b.type = 'button';
    b.dataset.chave = `passiva-${c.id}`;
    b.setAttribute('aria-pressed', String(ligada));
    b.disabled = !ligada && ativas.length >= max;
    if (b.disabled) b.title = t('habilidades.motivo.limite_passivas');
    b.addEventListener('click', () => {
      emitir(ligada ? { t: 'desativarPassiva', id: c.id } : { t: 'ativarPassiva', id: c.id });
      redesenhar();
    });
    li.append(b);
    ul.append(li);
  }
  bloco.append(ul);
  corpo.append(bloco);
}
