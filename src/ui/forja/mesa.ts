// Marco 51 (21/11/2026, D-197): a mesa da forja no ferreiro. Em cima, a cena (fornalha, bigorna, runas); embaixo, a
// receita aberta com os espaços que ela pede (a peça base, a segunda peça, os materiais e a runa), a bancada de engastes
// (engastar, extrair) e a bandeja com o que a mochila tem. Arrastar ou tocar põe a peça no espaço; "Forjar" corre a
// cena e só no fim emite o comando (a simulação confere tudo). Textos por textContent.

import type { Comando } from '../../core/comandos';
import type { ContextoSimulacao } from '../../core/contexto';
import type { EstadoJogo } from '../../core/estado';
import type { Entidade, ItemNaMochila } from '../../entities/entidade';
import { t } from '../../i18n';
import { engastavel, engastesDaPeca, semEngastes } from '../../progression/engaste';
import { atende, motivoDoMolde, precoDoEngaste, PREFIXO_RECEITA, type ExigenciaDePeca, type Molde } from '../../progression/moldes';
import { tornarAlvo, tornarArrastavel } from '../alquimia/arrastar';
import { iconeDoItem } from '../icones';
import { criarCenaDaForja, type CenaDaForja, type Forja } from './cena';

export interface EstadoMesa {
  receita: string | null;
  base: string | null;
  segunda: string | null;
  /** A peça na bancada de engastes. */
  peca: string | null;
  /** A cena fica viva entre os redesenhos (a animação não reinicia quando a mochila muda). */
  cena: Forja | null;
  quadro: CenaDaForja;
}

export const mesaVazia = (): EstadoMesa => ({ receita: null, base: null, segunda: null, peca: null, cena: null, quadro: { cor: null, engastes: 1, cheios: 0, temPeca: false } });

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

const GRAUS = ['I', 'II', 'III', 'IV', 'V'];

export function desenharMesaDaForja(raiz: HTMLElement, estado: EstadoJogo, ctx: ContextoSimulacao, j: Entidade, emitir: (cmd: Comando) => void, m: EstadoMesa, redesenhar: () => void): void {
  const bolsa = j.bolsa;
  if (!bolsa) return;
  const itens = ctx.conteudo.itens;
  const naMochila = (invId: string | null): ItemNaMochila | undefined => (invId ? bolsa.mochila.find((i) => i.invId === invId) : undefined);
  // O que saiu da mochila sai da mesa.
  for (const k of ['receita', 'base', 'segunda', 'peca'] as const) if (!naMochila(m[k])) m[k] = null;
  const receita = naMochila(m.receita);
  const molde: Molde | undefined = receita ? ctx.conteudo.moldes.get(receita.itemId.slice(PREFIXO_RECEITA.length)) : undefined;
  const base = naMochila(m.base);
  const peca = naMochila(m.peca);
  const corDaPeca = (id: string | undefined): string | null => {
    const it = id ? itens.get(id) : undefined;
    const elemento = molde?.resultado.elemento ?? it?.elemento ?? null;
    return elemento ? ctx.conteudo.elementos.get(elemento)?.cor ?? null : null;
  };

  const caixa = el('section', 'mesa-forja');
  caixa.append(el('h3', 'subtitulo-modal', t('forja.titulo')));
  caixa.append(el('p', 'detalhe-item', t('forja.intro')));
  const alvoDaCena = base ?? peca;
  const pecaDaCena = alvoDaCena ? itens.get(semEngastes(alvoDaCena.itemId).base) : undefined;
  m.quadro = {
    cor: corDaPeca(alvoDaCena?.itemId),
    engastes: pecaDaCena && engastavel(pecaDaCena) ? engastesDaPeca(pecaDaCena, ctx.balance.engaste) : 1,
    cheios: alvoDaCena ? semEngastes(alvoDaCena.itemId).materiais.length : 0,
    temPeca: !!alvoDaCena,
  };
  const cena = m.cena ?? criarCenaDaForja(360, 200, () => m.quadro);
  m.cena = cena;
  const palco = el('div', 'palco-forja');
  palco.append(cena.elemento);
  caixa.append(palco);
  queueMicrotask(() => { cena.reanimar(); });

  // A receita aberta: os espaços pedidos.
  const espacos = el('div', 'espacos-forja');
  const espaco = (nome: string, aceita: string, invId: string | null, rotulo: string, aoTirar: () => void) => {
    const e = el('button', `espaco-forja${invId ? ' ocupado' : ''}`);
    e.type = 'button';
    e.dataset.chave = nome;
    tornarAlvo(e, nome, [aceita]);
    const it = naMochila(invId);
    const def = it ? itens.get(it.itemId) : undefined;
    e.append(el('span', 'rotulo-encaixe', rotulo));
    if (def) {
      e.append(iconeDoItem(def.icone), el('span', 'detalhe-item', def.nome));
      e.addEventListener('click', () => { aoTirar(); redesenhar(); });
    } else e.append(el('span', 'detalhe-item', t('alquimia.encaixeVazio')));
    return e;
  };
  espacos.append(espaco('espaco-receita', 'receita', m.receita, t('forja.receita'), () => { m.receita = null; }));
  const descrever = (x: ExigenciaDePeca) => `${t(`slot.${x.slot}` as never)}${x.familia ? ` (${t(`familiaArma.${x.familia}` as never)})` : ''}`;
  if (molde) {
    espacos.append(espaco('espaco-base', 'peca', m.base, t('forja.base', { peca: descrever(molde.base) }), () => { m.base = null; }));
    if (molde.segunda) espacos.append(espaco('espaco-segunda', 'peca', m.segunda, t('forja.segunda', { peca: descrever(molde.segunda) }), () => { m.segunda = null; }));
  }
  caixa.append(espacos);
  if (molde) {
    const ul = el('ul', 'descricao-habilidade');
    ul.append(el('li', 'linha-assinatura', `${molde.nome} · ${t('loja.grau', { grau: GRAUS[molde.grau - 1] ?? molde.grau })}`));
    ul.append(el('li', undefined, molde.texto));
    const tem = (itemId: string) => bolsa.mochila.filter((i) => i.itemId === itemId).reduce((s, i) => s + i.qtd, 0);
    for (const x of molde.materiais) ul.append(el('li', tem(x.item) >= x.qtd ? undefined : 'linha-instavel', t('forja.pede', { nome: itens.get(x.item)?.nome ?? x.item, tem: tem(x.item), qtd: x.qtd })));
    if (molde.runa) ul.append(el('li', tem(`runa_${molde.runa}`) > 0 ? undefined : 'linha-instavel', t('forja.pede', { nome: itens.get(`runa_${molde.runa}`)?.nome ?? molde.runa, tem: tem(`runa_${molde.runa}`), qtd: 1 })));
    if (molde.ouro > 0) ul.append(el('li', undefined, t('loja.forjaOuro', { ouro: molde.ouro })));
    const r = base ? motivoDoMolde(estado, ctx, j, receita?.invId ?? '', base.invId, m.segunda) : null;
    if (r && !('motivo' in r)) ul.append(el('li', 'linha-ressonante', t('forja.resultado', { nome: itens.get(r.resultado)?.nome ?? r.resultado })));
    caixa.append(ul);
    const pode = !!r && !('motivo' in r);
    const forjar = botao(t('forja.forjar'), 'forjar-molde', () => {
      if (!pode || !receita || !base) return;
      forjar.disabled = true;
      forjar.textContent = t('forja.forjando');
      const cmd: Comando = { t: 'forjarMolde', receita: receita.invId, base: base.invId, segunda: m.segunda };
      cena.forjar(() => { emitir(cmd); });
    }, 'botao-cabecalho botao-transmutar');
    forjar.disabled = !pode;
    if (r && 'motivo' in r) forjar.title = t(`item.${r.motivo}` as never);
    caixa.append(forjar);
  }

  // A bancada de engastes: a peça, os engastes cheios (tocar extrai) e os livres (soltar um material).
  const bancada = el('div', 'engastes-forja');
  bancada.append(el('h4', 'subtitulo-modal', t('forja.engastes')));
  bancada.append(espaco('espaco-peca', 'peca', m.peca, t('forja.pecaEngaste'), () => { m.peca = null; }));
  if (peca) {
    const { base: idBase, materiais } = semEngastes(peca.itemId);
    const it = itens.get(idBase);
    if (it && engastavel(it)) {
      const n = engastesDaPeca(it, ctx.balance.engaste);
      const preco = precoDoEngaste(ctx, it);
      bancada.append(el('p', 'detalhe-item', t('forja.precoEngaste', { n, preco, pct: ctx.balance.engaste.extrairVoltaPct })));
      const linha = el('div', 'linha-bandeja');
      for (let i = 0; i < n; i++) {
        const mat = materiais[i];
        if (mat) {
          const b = botao(itens.get(mat)?.nome ?? mat, `extrair-${String(i)}`, () => {
            emitir({ t: 'extrair', peca: peca.invId, indice: i });
            redesenhar();
          }, 'encaixe-alquimia ocupado');
          b.title = t('forja.extrair', { nome: itens.get(mat)?.nome ?? mat });
          b.prepend(iconeDoItem(itens.get(mat)?.icone ?? 'pedra'));
          linha.append(b);
        } else {
          const livre = el('div', 'encaixe-alquimia');
          tornarAlvo(livre, `engaste-${String(i)}`, ['material']);
          livre.dataset.engaste = String(i);
          livre.append(el('span', 'detalhe-item', t('alquimia.encaixeVazio')));
          linha.append(livre);
        }
      }
      bancada.append(linha);
    }
  }
  caixa.append(bancada);

  // A bandeja: receitas, peças e materiais da mochila.
  const bandeja = el('div', 'bandeja-alquimia');
  const chip = (i: ItemNaMochila, tipo: 'receita' | 'peca' | 'material', por: () => void) => {
    const def = itens.get(i.itemId);
    const p = el('button', `peca-alquimia peca-${tipo}`);
    p.type = 'button';
    p.dataset.chave = `forja-${i.invId}`;
    const cor = corDaPeca(i.itemId);
    if (cor && tipo === 'peca') p.style.setProperty('--cor-elemento', cor);
    p.append(iconeDoItem(def?.icone ?? 'circulo'), el('span', 'detalhe-item', `${def?.nome ?? i.itemId}${i.qtd > 1 ? ` ×${String(i.qtd)}` : ''}`));
    if (tipo === 'material') p.title = ctx.conteudo.alquimia.materiais.get(i.itemId)?.arma.texto ?? '';
    tornarArrastavel(p, { tipo, aoTocar: () => { por(); redesenhar(); }, aoSoltar: (alvo) => {
      if (tipo === 'peca' && alvo.dataset.alvo === 'espaco-segunda') m.segunda = i.invId;
      else if (tipo === 'peca' && alvo.dataset.alvo === 'espaco-peca') m.peca = i.invId;
      else if (tipo === 'material' && peca) emitir({ t: 'engastar', peca: peca.invId, material: i.invId });
      else por();
      redesenhar();
    } });
    return p;
  };
  const receitas = bolsa.mochila.filter((i) => i.itemId.startsWith(PREFIXO_RECEITA));
  const pecas = bolsa.mochila.filter((i) => engastavel(itens.get(semEngastes(i.itemId).base)));
  const materiais = bolsa.mochila.filter((i) => ctx.conteudo.alquimia.materiais.has(i.itemId));
  const linha = (titulo: string, lista: HTMLElement[], vazio: string) => {
    const l = el('div', 'linha-bandeja');
    l.append(el('h4', 'subtitulo-modal', titulo));
    if (lista.length) l.append(...lista);
    else l.append(el('p', 'detalhe-item', vazio));
    return l;
  };
  bandeja.append(
    linha(t('forja.receitas'), receitas.map((i) => chip(i, 'receita', () => { m.receita = i.invId; m.base = null; m.segunda = null; })), t('forja.semReceitas')),
    linha(t('forja.pecas'), pecas.map((i) => chip(i, 'peca', () => {
      const it = itens.get(i.itemId);
      if (molde && !m.base && atende(ctx, it, molde.base)) m.base = i.invId;
      else if (molde?.segunda && !m.segunda && atende(ctx, it, molde.segunda)) m.segunda = i.invId;
      else m.peca = i.invId;
    })), t('forja.semPecas')),
    linha(t('alquimia.material'), materiais.map((i) => chip(i, 'material', () => { if (peca) emitir({ t: 'engastar', peca: peca.invId, material: i.invId }); })), t('alquimia.semMateriais')),
  );
  caixa.append(bandeja);
  raiz.append(caixa);
}
